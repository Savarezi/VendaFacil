import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  Product, Client, Supplier, Sale, Purchase, PurchaseItem, CashFlowEntry, 
  AccountPayable, AccountReceivable, SaleItem 
} from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

// Métodos auxiliares para suporte a fracionamento de caixas/unidades
export function parseProductFromDb(raw: any): Product {
  // 1. Extrair categoria limpa
  let category = raw.category || 'Outros';
  if (category && category.includes('::JSON::')) {
    category = category.split('::JSON::')[0] || 'Outros';
  }

  // 2. Definir valores default para fracionamento
  let isFractional = false;
  let unitsPerBox = 12;
  let pricePerBox = Number(raw.price || 0);
  let pricePerUnit = Number(raw.price || 0);
  let salesModel: 'both' | 'unit_only' | 'box_only' = 'both';

  // 3. Prioridade 1: Atributos diretos no objeto (Local Storage ou colunas nativas do banco)
  if (raw.isFractional !== undefined && raw.isFractional !== null) {
    isFractional = !!raw.isFractional;
    unitsPerBox = raw.unitsPerBox !== undefined ? Number(raw.unitsPerBox) : 12;
    pricePerBox = raw.pricePerBox !== undefined ? Number(raw.pricePerBox) : Number(raw.price || 0);
    pricePerUnit = raw.pricePerUnit !== undefined ? Number(raw.pricePerUnit) : Number(raw.price || 0);
    salesModel = raw.salesModel || 'both';
  } else if (raw.allows_box_sale !== undefined && raw.allows_box_sale !== null) {
    // Sincronizando com colunas do banco mapeadas pelo editor da usuária
    isFractional = !!raw.allows_box_sale;
    unitsPerBox = raw.units_per_box !== undefined && raw.units_per_box !== null ? Number(raw.units_per_box) : 12;
    pricePerBox = raw.box_price !== undefined && raw.box_price !== null ? Number(raw.box_price) : Number(raw.price || 0);
    pricePerUnit = Number(raw.price || 0);
    salesModel = 'both';
  }

  // 4. Prioridade 2 (Fallback): Buscar de metadados Legados serializados na categoria
  const rawCat = raw.category || '';
  if (rawCat && rawCat.includes('::JSON::')) {
    const parts = rawCat.split('::JSON::');
    try {
      const meta = JSON.parse(parts[1]);
      isFractional = meta.f !== undefined ? !!meta.f : (meta.isFractional || false);
      unitsPerBox = meta.u !== undefined ? Number(meta.u) : (meta.unitsPerBox || 12);
      pricePerBox = meta.b !== undefined ? Number(meta.b) : (meta.pricePerBox || Number(raw.price || 0));
      pricePerUnit = meta.p !== undefined ? Number(meta.p) : (meta.pricePerUnit || Number(raw.price || 0));
      salesModel = meta.m !== undefined ? meta.m : (meta.salesModel || 'both');
    } catch (e) {
      console.error('Erro ao ler metadados legados do produto:', e);
    }
  }

  return {
    id: raw.id,
    name: raw.name,
    code: raw.code,
    category: category,
    price: Number(raw.price),
    stock: Number(raw.stock),
    supplier: raw.supplier || '',
    isFractional,
    unitsPerBox,
    pricePerBox,
    pricePerUnit,
    salesModel
  };
}

export function serializeProductCategory(prod: Omit<Product, 'id'> | Product): string {
  if (prod.isFractional) {
    // Serialização em formato ultra compacto de 1 caractere por chave para evitar varchar(100) estourar
    const meta = {
      f: prod.isFractional ? 1 : 0,
      u: prod.unitsPerBox,
      b: prod.pricePerBox,
      p: prod.pricePerUnit,
      m: prod.salesModel
    };
    return `${prod.category}::JSON::${JSON.stringify(meta)}`;
  }
  return prod.category;
}

// Métodos auxiliares para suporte a categorização personalizada de contas a pagar
export function parsePayableFromDb(raw: any): AccountPayable {
  let name = raw.supplier_name || raw.supplierName || '';
  let category = 'Fornecedores';
  let expenseType: 'fixed' | 'variable' = 'variable';
  let description = '';

  if (name && name.includes('::JSONAP::')) {
    const parts = name.split('::JSONAP::');
    name = parts[0] || '';
    try {
      const meta = JSON.parse(parts[1]);
      // Suporte a chaves curtas 'c', 'e', 'd' ou pernas longas anteriores
      category = meta.c !== undefined ? meta.c : (meta.category || 'Fornecedores');
      expenseType = meta.e !== undefined ? meta.e : (meta.expenseType || 'variable');
      description = meta.d !== undefined ? meta.d : (meta.description || '');
    } catch (e) {
      console.error('Erro ao ler metadados da conta a pagar:', e);
    }
  }

  return {
    id: raw.id,
    supplierName: name,
    dueDate: raw.due_date || raw.dueDate,
    value: Number(raw.value),
    status: raw.status,
    category,
    expenseType,
    description
  };
}

export function serializePayableSupplierName(payable: Omit<AccountPayable, 'id'> | AccountPayable): string {
  let name = payable.supplierName;
  if (name && name.includes('::JSONAP::')) {
    name = name.split('::JSONAP::')[0];
  }
  // Serialização ultra compacta do Contas a Pagar
  const meta = {
    c: payable.category || 'Fornecedores',
    e: payable.expenseType || 'variable',
    d: payable.description || ''
  };
  return `${name}::JSONAP::${JSON.stringify(meta)}`;
}

interface ErpContextType {
  products: Product[];
  clients: Client[];
  suppliers: Supplier[];
  sales: Sale[];
  purchases: Purchase[];
  cashFlow: CashFlowEntry[];
  accountsPayable: AccountPayable[];
  accountsReceivable: AccountReceivable[];
  isDbConnected: boolean;
  dbError: string | null;
  clearDbError: () => void;
  
  addProduct: (product: Omit<Product, 'id'>) => Promise<void>;
  editProduct: (id: string, product: Omit<Product, 'id'>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  
  addClient: (client: Omit<Client, 'id'>) => Promise<void>;
  editClient: (id: string, client: Omit<Client, 'id'>) => Promise<void>;
  deleteClient: (id: string) => Promise<void>;

  addSupplier: (supplier: Omit<Supplier, 'id'>) => Promise<void>;
  editSupplier: (id: string, supplier: Omit<Supplier, 'id'>) => Promise<void>;
  deleteSupplier: (id: string) => Promise<void>;

  performSale: (items: SaleItem[], customerName: string, paymentMethod: string, discount: number) => Promise<void>;
  deleteSale: (id: string) => Promise<void>;
  
  addPurchase: (purchase: Omit<Purchase, 'id' | 'timestamp' | 'items'>, items: Omit<PurchaseItem, 'id' | 'purchaseId'>[]) => Promise<void>;
  cancelPurchase: (id: string) => Promise<void>;

  addCashFlow: (entry: Omit<CashFlowEntry, 'id' | 'timestamp'>) => Promise<void>;
  deleteCashFlow: (id: string) => Promise<void>;
  
  addAccountPayable: (account: Omit<AccountPayable, 'id'>) => Promise<void>;
  deleteAccountPayable: (id: string) => Promise<void>;
  
  addAccountReceivable: (account: Omit<AccountReceivable, 'id'>) => Promise<void>;
  deleteAccountReceivable: (id: string) => Promise<void>;

  payPayable: (id: string) => Promise<void>;
  receiveReceivable: (id: string) => Promise<void>;
}

const ErpContext = createContext<ErpContextType | undefined>(undefined);

export function useErp() {
  const context = useContext(ErpContext);
  if (!context) {
    throw new Error('useErp must be used within an ErpProvider');
  }
  return context;
}

interface ErpProviderProps {
  children: ReactNode;
}

export function ErpProvider({ children }: ErpProviderProps) {
  // Inicialização limpa de dados - Sem poeira de dados fictícios para permitir testes limpos
  const [products, setProducts] = useState<Product[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [cashFlow, setCashFlow] = useState<CashFlowEntry[]>([]);
  const [accountsPayable, setAccountsPayable] = useState<AccountPayable[]>([]);
  const [accountsReceivable, setAccountsReceivable] = useState<AccountReceivable[]>([]);
  const [dbError, setDbError] = useState<string | null>(null);

  const clearDbError = () => setDbError(null);

  // Carregar dados no bootstrap
  useEffect(() => {
    const loadInitialData = async () => {
      if (isSupabaseConfigured && supabase) {
        try {
          let dbProds: any[] | null = null;
          let dbClis: any[] | null = null;
          let dbSups: any[] | null = null;
          let dbSales: any[] | null = null;
          let dbSaleItems: any[] | null = null;
          let dbPurchases: any[] | null = null;
          let dbPurchaseItems: any[] | null = null;
          let dbCash: any[] | null = null;
          let dbPay: any[] | null = null;
          let dbRec: any[] | null = null;
          const missingTables: string[] = [];

          try {
            const { data, error } = await supabase.from('products').select('*').order('name');
            if (error) throw error;
            dbProds = data;
          } catch (e: any) {
            console.error('Erro na tabela de produtos:', e);
            missingTables.push('products');
          }

          try {
            const { data, error } = await supabase.from('clients').select('*').order('name');
            if (error) throw error;
            dbClis = data;
          } catch (e: any) {
            console.error('Erro na tabela de clientes:', e);
            missingTables.push('clients');
          }

          try {
            const { data, error } = await supabase.from('suppliers').select('*').order('company_name');
            if (error) throw error;
            dbSups = data;
          } catch (e: any) {
            console.error('Erro na tabela de fornecedores:', e);
            missingTables.push('suppliers');
          }

          try {
            const { data, error } = await supabase.from('sales').select('*').order('timestamp', { ascending: false });
            if (error) throw error;
            dbSales = data;
          } catch (e: any) {
            console.error('Erro na tabela de vendas:', e);
            missingTables.push('sales');
          }

          try {
            const { data, error } = await supabase.from('sale_items').select('*');
            if (error) throw error;
            dbSaleItems = data;
          } catch (e: any) {
            console.error('Erro na tabela de itens de venda:', e);
          }

          try {
            const { data, error } = await supabase.from('purchases').select('*').order('timestamp', { ascending: false });
            if (!error) dbPurchases = data;
          } catch (e: any) {
            console.error('Erro ao ler compras do Supabase:', e);
          }

          try {
            const { data, error } = await supabase.from('purchase_items').select('*');
            if (!error) dbPurchaseItems = data;
          } catch (e: any) {
            console.error('Erro ao ler itens de compras do Supabase:', e);
          }

          try {
            const { data, error } = await supabase.from('cash_flow_entries').select('*').order('timestamp', { ascending: false });
            if (error) throw error;
            dbCash = data;
          } catch (e: any) {
            console.error('Erro na tabela de fluxo de caixa (cash_flow_entries):', e);
            missingTables.push('cash_flow_entries');
          }

          try {
            const { data, error } = await supabase.from('accounts_payable').select('*').order('due_date');
            if (error) throw error;
            dbPay = data;
          } catch (e: any) {
            console.error('Erro na tabela de contas a pagar:', e);
            missingTables.push('accounts_payable');
          }

          try {
            const { data, error } = await supabase.from('accounts_receivable').select('*').order('due_date');
            if (error) throw error;
            dbRec = data;
          } catch (e: any) {
            console.error('Erro na tabela de contas a receber:', e);
            missingTables.push('accounts_receivable');
          }

          if (missingTables.length > 0) {
            setDbError(
              `As seguintes tabelas parecem estar ausentes ou sem as permissões corretas no seu banco de dados Supabase: **${missingTables.join(', ')}**.\n\n` +
              `Por favor, acesse o painel de administração do seu Supabase, clique em **SQL Editor** > **New Query** e cole TODO o conteúdo do arquivo \`SUPABASE_SCHEMA.sql\` disponível na raiz do projeto para criar as estruturas e conceder as permissões RLS necessárias!`
            );
          }

          // Processar fornecedores primeiro para que possamos mapear o nome associado aos produtos
          const mappedSuppliers: Supplier[] = dbSups ? dbSups.map(row => ({
            id: row.id,
            companyName: row.company_name,
            document: row.document || '',
            contactName: row.contact_name || '',
            phone: row.phone || '',
            email: row.email || ''
          })) : [];

          if (dbSups) {
            setSuppliers(mappedSuppliers);
          }

          if (dbProds) {
            setProducts(dbProds.map(row => {
              const matchingSuppl = mappedSuppliers.find(s => s.id === row.supplier_id);
              return parseProductFromDb({
                ...row,
                supplier: matchingSuppl ? matchingSuppl.companyName : ''
              });
            }));
          }
          if (dbClis) {
            setClients(dbClis.map(row => ({
              id: row.id,
              name: row.name,
              document: row.document || '',
              phone: row.phone || '',
              address: row.address || '',
              creditLimit: Number(row.credit_limit || 0)
            })));
          }
          if (dbSales) {
            setSales(dbSales.map(row => {
              const rowItems = dbSaleItems
                ? dbSaleItems.filter((item: any) => item.sale_id === row.id)
                : [];
              return {
                id: row.id,
                timestamp: row.timestamp,
                items: rowItems.map((item: any) => ({
                  productId: item.product_id || '',
                  productName: item.product_name,
                  price: Number(item.price),
                  quantity: Number(item.quantity)
                })),
                subtotal: Number(row.subtotal),
                discount: Number(row.discount),
                total: Number(row.total),
                paymentMethod: row.payment_method,
                customerName: row.customer_name || 'Consumidor Final',
                status: row.status as 'Concluída' | 'Cancelada' | 'Pendente'
              };
            }));
          }
          if (dbCash) {
            setCashFlow(dbCash.map(row => ({
              id: row.id,
              timestamp: row.timestamp,
              type: row.type as 'Entrada' | 'Saída',
              description: row.description,
              value: Number(row.value),
              category: row.category || '',
              saleId: row.sale_id
            })));
          }
          if (dbPay) {
            setAccountsPayable(dbPay.map(row => parsePayableFromDb(row)));
          }
          if (dbRec) {
            setAccountsReceivable(dbRec.map(row => ({
              id: row.id,
              customerName: row.customer_name,
              dueDate: row.due_date,
              value: Number(row.value),
              status: row.status as 'Pendente' | 'Recebido' | 'Atrasado',
              saleId: row.sale_id
            })));
          }

          if (dbPurchases) {
            setPurchases(dbPurchases.map(row => {
              const rowItems = dbPurchaseItems
                ? dbPurchaseItems.filter((item: any) => item.purchase_id === row.id)
                : [];
              return {
                id: row.id,
                timestamp: row.timestamp,
                supplierId: row.supplier_id || undefined,
                supplierName: row.supplier_name,
                items: rowItems.map((item: any) => ({
                  id: item.id,
                  purchaseId: item.purchase_id,
                  productId: item.product_id || '',
                  productName: item.product_name,
                  quantity: Number(item.quantity),
                  costPrice: Number(item.cost_price),
                  format: item.format || 'unit',
                  unitsPerBox: Number(item.units_per_box || 12)
                })),
                subtotal: Number(row.subtotal || 0),
                discount: Number(row.discount || 0),
                total: Number(row.total || 0),
                paymentMethod: row.payment_method || 'Dinheiro',
                status: row.status as 'Concluída' | 'Cancelada'
              };
            }));
          } else {
            setPurchases(JSON.parse(localStorage.getItem('sge_purchases') || '[]'));
          }

        } catch (error: any) {
          console.error('Erro na sincronização inicial do Supabase:', error);
          setDbError(`Falha na sincronização inicial do Supabase: ${error?.message || String(error)}. Verifique a conexão com o banco ou execute o script SQL.`);
        }
      } else {
        const localProds = JSON.parse(localStorage.getItem('sge_products') || '[]');
        setProducts(localProds.map((p: any) => parseProductFromDb(p)));
        setClients(JSON.parse(localStorage.getItem('sge_clients') || '[]'));
        setSuppliers(JSON.parse(localStorage.getItem('sge_suppliers') || '[]'));
        setSales(JSON.parse(localStorage.getItem('sge_sales') || '[]'));
        setPurchases(JSON.parse(localStorage.getItem('sge_purchases') || '[]'));
        setCashFlow(JSON.parse(localStorage.getItem('sge_cash_flow') || '[]'));
        
        const localPayables = JSON.parse(localStorage.getItem('sge_accounts_payable') || '[]');
        setAccountsPayable(localPayables.map((row: any) => parsePayableFromDb(row)));

        setAccountsReceivable(JSON.parse(localStorage.getItem('sge_accounts_receivable') || '[]'));
      }
    };

    loadInitialData();
  }, []);

  // CRUD Actions para Produtos
  const addProduct = async (newProd: Omit<Product, 'id'>) => {
    if (isSupabaseConfigured && supabase) {
      try {
        const matchingSupplier = suppliers.find(s => s.companyName === newProd.supplier);
        const supplierId = matchingSupplier ? matchingSupplier.id : null;

        // Salvar os campos usando a estrutura padrão de colunas suportada no Supabase,
        // com serialização compacta segura para evitar erros de banco de dados
        const { data, error } = await supabase.from('products').insert([{
          name: newProd.name,
          code: newProd.code,
          category: serializeProductCategory(newProd),
          price: newProd.price,
          stock: newProd.stock,
          supplier_id: supplierId
        }]).select();

        if (error) throw error;
        if (data && data[0]) {
          const added = parseProductFromDb({
            ...data[0],
            supplier: newProd.supplier
          });
          setProducts(prev => [...prev, added]);
        } else {
          const addedLocal: Product = {
            id: Date.now().toString(),
            ...newProd
          };
          setProducts(prev => [...prev, addedLocal]);
        }
      } catch (e: any) {
        console.error('Erro ao salvar produto:', e);
        setDbError(
          `Erro ao salvar produto no Supabase: **${e?.message || String(e)}**.\n\n` +
          `Dica extra: Se o erro indicar 'relation "products" does not exist', certifique-se de ter executado o script de criação de tabelas \`SUPABASE_SCHEMA.sql\` no Supabase SQL Editor.`
        );
      }
    } else {
      const added: Product = { ...newProd, id: Date.now().toString() };
      const updated = [...products, added];
      setProducts(updated);
      localStorage.setItem('sge_products', JSON.stringify(updated));
    }
  };

  const editProduct = async (id: string, updatedProps: Omit<Product, 'id'>) => {
    if (isSupabaseConfigured && supabase) {
      try {
        const matchingSupplier = suppliers.find(s => s.companyName === updatedProps.supplier);
        const supplierId = matchingSupplier ? matchingSupplier.id : null;

        // Atualizar usando a estrutura de colunas compatível e segura
        const { error } = await supabase.from('products').update({
          name: updatedProps.name,
          code: updatedProps.code,
          category: serializeProductCategory(updatedProps),
          price: updatedProps.price,
          stock: updatedProps.stock,
          supplier_id: supplierId
        }).eq('id', id);

        if (error) throw error;
        setProducts(prev => prev.map(p => p.id === id ? { ...updatedProps, id } : p));
      } catch (e: any) {
        console.error('Erro ao atualizar produto:', e);
        setDbError(`Erro ao atualizar produto no Supabase: **${e?.message || String(e)}**.`);
      }
    } else {
      const updated = products.map(p => p.id === id ? { ...updatedProps, id } : p);
      setProducts(updated);
      localStorage.setItem('sge_products', JSON.stringify(updated));
    }
  };

  const deleteProduct = async (id: string) => {
    if (isSupabaseConfigured && supabase) {
      try {
        // Desassociar referências na tabela sale_items para evitar violação de chave estrangeira (on delete set null manual)
        await supabase.from('sale_items').update({ product_id: null }).eq('product_id', id);

        const { error } = await supabase.from('products').delete().eq('id', id);
        if (error) throw error;
        setProducts(prev => prev.filter(p => p.id !== id));
      } catch (e: any) {
        console.error('Erro ao deletar produto:', e);
        setDbError(`Erro ao deletar produto no Supabase: **${e?.message || String(e)}**.`);
      }
    } else {
      const updated = products.filter(p => p.id !== id);
      setProducts(updated);
      localStorage.setItem('sge_products', JSON.stringify(updated));
    }
  };

  // CRUD Actions para Clientes
  const addClient = async (newClient: Omit<Client, 'id'>) => {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.from('clients').insert([{
          name: newClient.name,
          document: newClient.document,
          phone: newClient.phone,
          address: newClient.address,
          credit_limit: newClient.creditLimit
        }]).select();

        if (error) throw error;
        if (data && data[0]) {
          const added: Client = {
            id: data[0].id,
            name: data[0].name,
            document: data[0].document,
            phone: data[0].phone || '',
            address: data[0].address || '',
            creditLimit: Number(data[0].credit_limit || 0)
          };
          setClients(prev => [...prev, added]);
        } else {
          const addedLocal: Client = {
            id: Date.now().toString(),
            ...newClient
          };
          setClients(prev => [...prev, addedLocal]);
        }
      } catch (e: any) {
        console.error('Erro ao salvar cliente:', e);
        setDbError(
          `Erro ao salvar cliente no Supabase: **${e?.message || String(e)}**.\n\n` +
          `Dica extra: Se o erro indicar 'relation "clients" does not exist', certifique-se de executar o arquivo \`SUPABASE_SCHEMA.sql\` no Supabase SQL Editor.`
        );
      }
    } else {
      const added: Client = { ...newClient, id: Date.now().toString() };
      const updated = [...clients, added];
      setClients(updated);
      localStorage.setItem('sge_clients', JSON.stringify(updated));
    }
  };

  const editClient = async (id: string, updatedProps: Omit<Client, 'id'>) => {
    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase.from('clients').update({
          name: updatedProps.name,
          document: updatedProps.document,
          phone: updatedProps.phone,
          address: updatedProps.address,
          credit_limit: updatedProps.creditLimit
        }).eq('id', id);

        if (error) throw error;
        setClients(prev => prev.map(c => c.id === id ? { ...updatedProps, id } : c));
      } catch (e: any) {
        console.error('Erro ao atualizar cliente:', e);
        setDbError(`Erro ao atualizar cliente no Supabase: **${e?.message || String(e)}**.`);
      }
    } else {
      const updated = clients.map(c => c.id === id ? { ...updatedProps, id } : c);
      setClients(updated);
      localStorage.setItem('sge_clients', JSON.stringify(updated));
    }
  };

  const deleteClient = async (id: string) => {
    if (isSupabaseConfigured && supabase) {
      try {
        // Desassociar referências brutas nas tabelas vinculadas para evitar violações de chave estrangeira
        await supabase.from('sales').update({ client_id: null }).eq('client_id', id);
        await supabase.from('accounts_receivable').update({ client_id: null }).eq('client_id', id);

        const { error } = await supabase.from('clients').delete().eq('id', id);
        if (error) throw error;
        setClients(prev => prev.filter(c => c.id !== id));
      } catch (e: any) {
        console.error('Erro ao deletar cliente:', e);
        setDbError(`Erro ao deletar cliente no Supabase: **${e?.message || String(e)}**.`);
      }
    } else {
      const updated = clients.filter(c => c.id !== id);
      setClients(updated);
      localStorage.setItem('sge_clients', JSON.stringify(updated));
    }
  };

  // CRUD Actions para Fornecedores
  const addSupplier = async (newSuppl: Omit<Supplier, 'id'>) => {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.from('suppliers').insert([{
          company_name: newSuppl.companyName,
          document: newSuppl.document,
          contact_name: newSuppl.contactName,
          phone: newSuppl.phone,
          email: newSuppl.email
        }]).select();

        if (error) throw error;
        if (data && data[0]) {
          const added: Supplier = {
            id: data[0].id,
            companyName: data[0].company_name,
            document: data[0].document,
            contactName: data[0].contact_name || '',
            phone: data[0].phone || '',
            email: data[0].email || ''
          };
          setSuppliers(prev => [...prev, added]);
        } else {
          const addedLocal: Supplier = {
            id: Date.now().toString(),
            ...newSuppl
          };
          setSuppliers(prev => [...prev, addedLocal]);
        }
      } catch (e: any) {
        console.error('Erro ao salvar fornecedor:', e);
        setDbError(
          `Erro ao salvar fornecedor no Supabase: **${e?.message || String(e)}**.\n\n` +
          `Dica extra: Se o erro indicar 'relation "suppliers" does not exist', certifique-se de executar o arquivo \`SUPABASE_SCHEMA.sql\` no Supabase SQL Editor.`
        );
      }
    } else {
      const added: Supplier = { ...newSuppl, id: Date.now().toString() };
      const updated = [...suppliers, added];
      setSuppliers(updated);
      localStorage.setItem('sge_suppliers', JSON.stringify(updated));
    }
  };

  const editSupplier = async (id: string, updatedProps: Omit<Supplier, 'id'>) => {
    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase.from('suppliers').update({
          company_name: updatedProps.companyName,
          document: updatedProps.document,
          contact_name: updatedProps.contactName,
          phone: updatedProps.phone,
          email: updatedProps.email
        }).eq('id', id);

        if (error) throw error;
        setSuppliers(prev => prev.map(s => s.id === id ? { ...updatedProps, id } : s));
      } catch (e: any) {
        console.error('Erro ao atualizar fornecedor:', e);
        setDbError(`Erro ao atualizar fornecedor no Supabase: **${e?.message || String(e)}**.`);
      }
    } else {
      const updated = suppliers.map(s => s.id === id ? { ...updatedProps, id } : s);
      setSuppliers(updated);
      localStorage.setItem('sge_suppliers', JSON.stringify(updated));
    }
  };

  const deleteSupplier = async (id: string) => {
    if (isSupabaseConfigured && supabase) {
      try {
        // Desassociar referências cruas de fornecedor nas tabelas vinculadas
        await supabase.from('products').update({ supplier_id: null }).eq('supplier_id', id);
        await supabase.from('accounts_payable').update({ supplier_id: null }).eq('supplier_id', id);

        const { error } = await supabase.from('suppliers').delete().eq('id', id);
        if (error) throw error;
        setSuppliers(prev => prev.filter(s => s.id !== id));
      } catch (e: any) {
        console.error('Erro ao deletar fornecedor:', e);
        setDbError(`Erro ao deletar fornecedor no Supabase: **${e?.message || String(e)}**.`);
      }
    } else {
      const updated = suppliers.filter(s => s.id !== id);
      setSuppliers(updated);
      localStorage.setItem('sge_suppliers', JSON.stringify(updated));
    }
  };

  // Vendas e Emissão de caixa
  const performSale = async (
    items: SaleItem[],
    customerName: string,
    paymentMethod: string,
    discount: number
  ) => {
    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const total = subtotal - discount;
    const dateStr = new Date().toISOString();
    
    if (isSupabaseConfigured && supabase) {
      try {
        const matchingClient = clients.find(c => c.name === customerName);
        const clientId = matchingClient ? matchingClient.id : null;

        // Enviar registro da venda (sem ID, deixando o banco gear o UUID automaticamente)
        const { data: saleData, error: saleErr } = await supabase.from('sales').insert([{
          timestamp: dateStr,
          subtotal,
          discount,
          total,
          payment_method: paymentMethod,
          customer_name: customerName || 'Consumidor Final',
          client_id: clientId,
          status: 'Concluída'
        }]).select();

        if (saleErr) throw saleErr;
        if (!saleData || !saleData[0]) {
          throw new Error('Falha ao obter o ID gerado da venda no Supabase.');
        }

        const createdSaleId = saleData[0].id;

        // Inserir os itens individuais na tabela sale_items
        const saleItemsPayload = items.map(item => ({
          sale_id: createdSaleId,
          product_id: item.productId || null,
          product_name: item.productName,
          price: item.price,
          quantity: item.quantity
        }));

        const { error: itemsErr } = await supabase.from('sale_items').insert(saleItemsPayload);
        if (itemsErr) throw itemsErr;

        // Atualizar estoque unitário buscando o saldo mais atual e seguro diretamente do banco
        await Promise.all(items.map(async (item) => {
          if (item.productId) {
            const { data: currentProd, error: fetchErr } = await supabase
              .from('products')
              .select('stock')
              .eq('id', item.productId)
              .single();
            
            if (fetchErr) throw fetchErr;

            const currentStock = currentProd ? Number(currentProd.stock) : 0;
            const unitsToDeduct = item.format === 'box' && item.unitsPerBox 
              ? item.quantity * item.unitsPerBox 
              : item.quantity;
            const newSt = Math.max(0, currentStock - unitsToDeduct);

            const { error: stockErr } = await supabase
              .from('products')
              .update({ stock: newSt })
              .eq('id', item.productId);
            
            if (stockErr) throw stockErr;
          }
        }));

        // Registrar no Contas a Receber ou Fluxo de Caixa imediato
        if (paymentMethod === 'Crediário') {
          const dateIn30Days = new Date();
          dateIn30Days.setDate(dateIn30Days.getDate() + 30);
          const dueDateStr = dateIn30Days.toISOString().split('T')[0];

          const { data: recData, error: recErr } = await supabase.from('accounts_receivable').insert([{
            customer_name: customerName || 'Consumidor Final',
            client_id: clientId,
            sale_id: createdSaleId,
            due_date: dueDateStr,
            value: total,
            status: 'Pendente'
          }]).select();

          if (recErr) throw recErr;

          if (recData && recData[0]) {
            const newAR: AccountReceivable = {
              id: recData[0].id,
              customerName: recData[0].customer_name,
              dueDate: recData[0].due_date,
              value: Number(recData[0].value),
              status: recData[0].status,
              saleId: createdSaleId
            };
            setAccountsReceivable(prev => [...prev, newAR]);
          }
        } else {
          const { data: cashData, error: cashErr } = await supabase.from('cash_flow_entries').insert([{
            timestamp: dateStr,
            type: 'Entrada',
            description: `Venda #${createdSaleId.slice(0, 8).toUpperCase()} (${customerName || 'Consumidor Final'})`,
            value: total,
            category: 'Vendas',
            sale_id: createdSaleId
          }]).select();

          if (cashErr) throw cashErr;

          if (cashData && cashData[0]) {
            const newEntry: CashFlowEntry = {
              id: cashData[0].id,
              timestamp: cashData[0].timestamp,
              type: cashData[0].type as 'Entrada' | 'Saída',
              description: cashData[0].description,
              value: Number(cashData[0].value),
              category: cashData[0].category || '',
              saleId: createdSaleId
            };
            setCashFlow(prev => [newEntry, ...prev]);
          }
        }

        const newSale: Sale = {
          id: createdSaleId,
          timestamp: dateStr,
          items,
          subtotal,
          discount,
          total,
          paymentMethod,
          customerName: customerName || 'Consumidor Final',
          status: 'Concluída'
        };

        // Sincronizar estados locais
        setProducts(prev => {
          return prev.map(p => {
            const item = items.find(i => i.productId === p.id);
            if (item) {
              const unitsToDeduct = item.format === 'box' && item.unitsPerBox 
                ? item.quantity * item.unitsPerBox 
                : item.quantity;
              const updatedStock = Math.max(0, p.stock - unitsToDeduct);
              return { ...p, stock: updatedStock };
            }
            return p;
          });
        });
        setSales(prev => [newSale, ...prev]);

      } catch (e: any) {
        console.error('Erro na transação de vendas no Supabase:', e);
        setDbError(
          `Erro ao concluir venda no Supabase: **${e?.message || String(e)}**.\n\n` +
          `Verifique se as tabelas \`sales\`, \`cash_flow_entries\` e \`accounts_receivable\` estão devidamente configuradas e se você executou o arquivo \`SUPABASE_SCHEMA.sql\`.`
        );
      }
    } else {
      // Local transaction
      const nextSaleNum = sales.length + 1;
      const saleId = `VEN-${new Date().toLocaleDateString('pt-BR', { year: '2-digit', month: '2-digit' }).replace('/', '')}-${nextSaleNum.toString().padStart(2, '0')}`;

      const newSale: Sale = {
        id: saleId,
        timestamp: dateStr,
        items,
        subtotal,
        discount,
        total,
        paymentMethod,
        customerName: customerName || 'Consumidor Final',
        status: 'Concluída'
      };

      setProducts(prev => {
        const updated = prev.map(p => {
          const item = items.find(i => i.productId === p.id);
          if (item) {
            const unitsToDeduct = item.format === 'box' && item.unitsPerBox 
              ? item.quantity * item.unitsPerBox 
              : item.quantity;
            const updatedStock = Math.max(0, p.stock - unitsToDeduct);
            return { ...p, stock: updatedStock };
          }
          return p;
        });
        localStorage.setItem('sge_products', JSON.stringify(updated));
        return updated;
      });

      if (paymentMethod === 'Crediário') {
        const dateIn30Days = new Date();
        dateIn30Days.setDate(dateIn30Days.getDate() + 30);
        const dueDateStr = dateIn30Days.toISOString().split('T')[0];
        
        const newAR: AccountReceivable = {
          id: Date.now().toString(),
          customerName: customerName || 'Consumidor Final',
          dueDate: dueDateStr,
          value: total,
          status: 'Pendente',
          saleId: saleId
        };
        const updatedAR = [...accountsReceivable, newAR];
        setAccountsReceivable(updatedAR);
        localStorage.setItem('sge_accounts_receivable', JSON.stringify(updatedAR));
      } else {
        const newEntry: CashFlowEntry = {
          id: Date.now().toString(),
          timestamp: dateStr,
          type: 'Entrada',
          description: `Venda ${saleId} (${customerName || 'Consumidor Final'})`,
          value: total,
          category: 'Vendas',
          saleId: saleId
        };
        const updatedCF = [newEntry, ...cashFlow];
        setCashFlow(updatedCF);
        localStorage.setItem('sge_cash_flow', JSON.stringify(updatedCF));
      }

      const updatedSales = [newSale, ...sales];
      setSales(updatedSales);
      localStorage.setItem('sge_sales', JSON.stringify(updatedSales));
    }
  };

  const deleteSale = async (id: string) => {
    const saleToDelete = sales.find(s => s.id === id);
    if (!saleToDelete) return;

    if (isSupabaseConfigured && supabase) {
      try {
        // 1. Devolver estoque no Supabase
        await Promise.all(saleToDelete.items.map(async (item) => {
          if (item.productId) {
            const { data: currentProd, error: fetchErr } = await supabase
              .from('products')
              .select('stock')
              .eq('id', item.productId)
              .single();
            
            if (fetchErr) throw fetchErr;

            const currentStock = currentProd ? Number(currentProd.stock) : 0;
            const newSt = currentStock + item.quantity;

            const { error: stockErr } = await supabase
              .from('products')
              .update({ stock: newSt })
              .eq('id', item.productId);
            
            if (stockErr) throw stockErr;
          }
        }));

        // 2. Apagar lançamentos financeiros associados
        await supabase.from('cash_flow_entries').delete().eq('sale_id', id);
        await supabase.from('accounts_receivable').delete().eq('sale_id', id);

        // 3. Deletar a venda (sale_items é cascading delete via sale_id)
        const { error: saleErr } = await supabase.from('sales').delete().eq('id', id);
        if (saleErr) throw saleErr;

        // 4. Sincronizar estados locais
        setProducts(prev => {
          return prev.map(p => {
            const item = saleToDelete.items.find(i => i.productId === p.id);
            if (item) {
              return { ...p, stock: p.stock + item.quantity };
            }
            return p;
          });
        });

        setSales(prev => prev.filter(s => s.id !== id));
        setCashFlow(prev => prev.filter(cf => cf.saleId !== id));
        setAccountsReceivable(prev => prev.filter(ar => ar.saleId !== id));

      } catch (e: any) {
        console.error('Erro ao excluir venda no Supabase:', e);
        setDbError(`Erro ao excluir venda no Supabase: **${e?.message || String(e)}**.`);
      }
    } else {
      // Modo offline/local
      // 1. Devolver estoque local do produto
      const updatedProducts = products.map(p => {
        const item = saleToDelete.items.find(i => i.productId === p.id);
        if (item) {
          return { ...p, stock: p.stock + item.quantity };
        }
        return p;
      });
      setProducts(updatedProducts);
      localStorage.setItem('sge_products', JSON.stringify(updatedProducts));

      // 2. Apagar lançamentos locais
      const updatedCF = cashFlow.filter(cf => cf.saleId !== id);
      setCashFlow(updatedCF);
      localStorage.setItem('sge_cash_flow', JSON.stringify(updatedCF));

      const updatedAR = accountsReceivable.filter(ar => ar.saleId !== id);
      setAccountsReceivable(updatedAR);
      localStorage.setItem('sge_accounts_receivable', JSON.stringify(updatedAR));

      // 3. Deletar venda
      const updatedSales = sales.filter(s => s.id !== id);
      setSales(updatedSales);
      localStorage.setItem('sge_sales', JSON.stringify(updatedSales));
    }
  };

  // Compras de Estoque e Entradas
  const addPurchase = async (
    purchaseProps: Omit<Purchase, 'id' | 'timestamp' | 'items'>,
    itemsProps: Omit<PurchaseItem, 'id' | 'purchaseId'>[]
  ) => {
    const timestamp = new Date().toISOString();
    const subtotal = itemsProps.reduce((sum, item) => sum + item.costPrice * item.quantity, 0);
    const total = subtotal - purchaseProps.discount;
    const supplier_name = purchaseProps.supplierName;
    const payment_method = purchaseProps.paymentMethod;

    if (isSupabaseConfigured && supabase) {
      try {
        const matchingSupplier = suppliers.find(s => s.companyName === supplier_name);
        const supplierId = matchingSupplier ? matchingSupplier.id : null;

        // 1. Criar Compra
        const { data: purchaseData, error: purchaseErr } = await supabase.from('purchases').insert([{
          timestamp,
          supplier_id: supplierId,
          supplier_name,
          subtotal,
          discount: purchaseProps.discount,
          total,
          payment_method,
          status: 'Concluída'
        }]).select();

        if (purchaseErr) throw purchaseErr;
        if (!purchaseData || !purchaseData[0]) {
          throw new Error('Falha ao obter ID gerado da compra.');
        }

        const createdPurchaseId = purchaseData[0].id;

        // 2. Criar Itens da Compra
        const purchaseItemsPayload = itemsProps.map(item => ({
          purchase_id: createdPurchaseId,
          product_id: item.productId || null,
          product_name: item.productName,
          quantity: item.quantity,
          cost_price: item.costPrice,
          format: item.format || 'unit',
          units_per_box: item.unitsPerBox || 12
        }));

        const { error: itemsErr } = await supabase.from('purchase_items').insert(purchaseItemsPayload);
        if (itemsErr) throw itemsErr;

        // 3. Atualizar estoque dos produtos correspondentes
        await Promise.all(itemsProps.map(async (item) => {
          if (item.productId) {
            const { data: currentProd, error: fetchErr } = await supabase
              .from('products')
              .select('stock')
              .eq('id', item.productId)
              .single();
            
            if (fetchErr) throw fetchErr;

            const currentStock = currentProd ? Number(currentProd.stock) : 0;
            const unitsToAdd = item.format === 'box' && item.unitsPerBox
              ? item.quantity * item.unitsPerBox
              : item.quantity;
            const newSt = currentStock + unitsToAdd;

            const { error: stockErr } = await supabase
              .from('products')
              .update({ stock: newSt })
              .eq('id', item.productId);

            if (stockErr) throw stockErr;
          }
        }));

        // 4. Fluxo financeiro (Caixa ou Contas a Pagar)
        if (payment_method === 'A prazo') {
          const dateIn30Days = new Date();
          dateIn30Days.setDate(dateIn30Days.getDate() + 30);
          const dueDateStr = dateIn30Days.toISOString().split('T')[0];

          const { data: payData, error: payErr } = await supabase.from('accounts_payable').insert([{
            supplier_name,
            supplier_id: supplierId,
            due_date: dueDateStr,
            value: total,
            status: 'Pendente'
          }]).select();

          if (payErr) throw payErr;
          if (payData && payData[0]) {
            const newAP: AccountPayable = {
              id: payData[0].id,
              supplierName: payData[0].supplier_name,
              dueDate: payData[0].due_date,
              value: Number(payData[0].value),
              status: payData[0].status
            };
            setAccountsPayable(prev => [...prev, newAP]);
          }
        } else {
          // Saída imediata de caixa
          const { data: cashData, error: cashErr } = await supabase.from('cash_flow_entries').insert([{
            timestamp,
            type: 'Saída',
            description: `Compra de estoque de ${supplier_name}`,
            value: total,
            category: 'Compras de Mercadoria'
          }]).select();

          if (cashErr) throw cashErr;
          if (cashData && cashData[0]) {
            const newEntry: CashFlowEntry = {
              id: cashData[0].id,
              timestamp: cashData[0].timestamp,
              type: 'Saída',
              description: cashData[0].description,
              value: Number(cashData[0].value),
              category: cashData[0].category || ''
            };
            setCashFlow(prev => [newEntry, ...prev]);
          }
        }

        // 5. Atualizar Estados Locais
        const savedItems = purchaseItemsPayload.map((it, idx) => ({
          id: Date.now().toString() + '_' + idx,
          purchaseId: createdPurchaseId,
          productId: it.product_id || '',
          productName: it.product_name,
          quantity: it.quantity,
          costPrice: it.cost_price,
          format: it.format as 'unit' | 'box',
          unitsPerBox: it.units_per_box
        }));

        const newPurchase: Purchase = {
          id: createdPurchaseId,
          timestamp,
          supplierId: supplierId || undefined,
          supplierName: supplier_name,
          items: savedItems,
          subtotal,
          discount: purchaseProps.discount,
          total,
          paymentMethod: payment_method,
          status: 'Concluída'
        };

        setProducts(prev => {
          return prev.map(p => {
            const item = itemsProps.find(i => i.productId === p.id);
            if (item) {
              const unitsToAdd = item.format === 'box' && item.unitsPerBox
                ? item.quantity * item.unitsPerBox
                : item.quantity;
              return { ...p, stock: p.stock + unitsToAdd };
            }
            return p;
          });
        });

        setPurchases(prev => [newPurchase, ...prev]);

      } catch (e: any) {
        console.error('Erro ao realizar compra no Supabase:', e);
        setDbError(`Falha ao registrar compra no Supabase: ${e?.message || String(e)}`);
      }
    } else {
      // Local transaction
      const nextPurchaseNum = purchases.length + 1;
      const purchaseId = `COMP-${new Date().toLocaleDateString('pt-BR', { year: '2-digit', month: '2-digit' }).replace('/', '')}-${nextPurchaseNum.toString().padStart(3, '0')}`;

      const savedItems = itemsProps.map((item, idx) => ({
        id: `PITEM-${Date.now()}-${idx}`,
        purchaseId,
        productId: item.productId || '',
        productName: item.productName,
        quantity: item.quantity,
        costPrice: item.costPrice,
        format: item.format,
        unitsPerBox: item.unitsPerBox
      }));

      const newPurchase: Purchase = {
        id: purchaseId,
        timestamp,
        supplierName: supplier_name,
        items: savedItems,
        subtotal,
        discount: purchaseProps.discount,
        total,
        paymentMethod: payment_method,
        status: 'Concluída'
      };

      // 1. Incrementar Estoque Local
      const updatedProducts = products.map(p => {
        const item = itemsProps.find(i => i.productId === p.id);
        if (item) {
          const unitsToAdd = item.format === 'box' && item.unitsPerBox
            ? item.quantity * item.unitsPerBox
            : item.quantity;
          return { ...p, stock: p.stock + unitsToAdd };
        }
        return p;
      });
      setProducts(updatedProducts);
      localStorage.setItem('sge_products', JSON.stringify(updatedProducts));

      // 2. Fluxo Financeiro Local
      if (payment_method === 'A prazo') {
        const dateIn30Days = new Date();
        dateIn30Days.setDate(dateIn30Days.getDate() + 30);
        const dueDateStr = dateIn30Days.toISOString().split('T')[0];

        const newAP: AccountPayable = {
          id: `PAY-${Date.now()}`,
          supplierName: supplier_name,
          dueDate: dueDateStr,
          value: total,
          status: 'Pendente'
        };
        const updatedAP = [...accountsPayable, newAP];
        setAccountsPayable(updatedAP);
        localStorage.setItem('sge_accounts_payable', JSON.stringify(updatedAP));
      } else {
        const newEntry: CashFlowEntry = {
          id: `CF-${Date.now()}`,
          timestamp,
          type: 'Saída',
          description: `Compra de estoque de ${supplier_name}`,
          value: total,
          category: 'Compras de Mercadoria'
        };
        const updatedCF = [newEntry, ...cashFlow];
        setCashFlow(updatedCF);
        localStorage.setItem('sge_cash_flow', JSON.stringify(updatedCF));
      }

      // 3. Salvar Compra Local
      const updatedPurchases = [newPurchase, ...purchases];
      setPurchases(updatedPurchases);
      localStorage.setItem('sge_purchases', JSON.stringify(updatedPurchases));
    }
  };

  const cancelPurchase = async (id: string) => {
    const purchaseToCancel = purchases.find(p => p.id === id);
    if (!purchaseToCancel || purchaseToCancel.status === 'Cancelada') return;

    if (isSupabaseConfigured && supabase) {
      try {
        // 1. Cancelar compra no banco de dados
        const { error: purchaseErr } = await supabase
          .from('purchases')
          .update({ status: 'Cancelada' })
          .eq('id', id);

        if (purchaseErr) throw purchaseErr;

        // 2. Deduzir o estoque que tinha sido ganho
        await Promise.all(purchaseToCancel.items.map(async (item) => {
          if (item.productId) {
            const { data: currentProd, error: fetchErr } = await supabase
              .from('products')
              .select('stock')
              .eq('id', item.productId)
              .single();

            if (!fetchErr && currentProd) {
              const currentStock = Number(currentProd.stock);
              const unitsToDeduct = item.format === 'box' && item.unitsPerBox
                ? item.quantity * item.unitsPerBox
                : item.quantity;
              const newSt = Math.max(0, currentStock - unitsToDeduct);

              await supabase
                .from('products')
                .update({ stock: newSt })
                .eq('id', item.productId);
            }
          }
        }));

        // 3. Atualizar localmente
        setProducts(prev => {
          return prev.map(p => {
            const item = purchaseToCancel.items.find(i => i.productId === p.id);
            if (item) {
              const unitsToDeduct = item.format === 'box' && item.unitsPerBox
                ? item.quantity * item.unitsPerBox
                : item.quantity;
              return { ...p, stock: Math.max(0, p.stock - unitsToDeduct) };
            }
            return p;
          });
        });

        setPurchases(prev => prev.map(p => p.id === id ? { ...p, status: 'Cancelada' } : p));

      } catch (e: any) {
        console.error('Erro ao cancelar compra no Supabase:', e);
        setDbError(`Falha ao cancelar compra: ${e?.message || String(e)}`);
      }
    } else {
      // Local cancel
      const updatedProducts = products.map(p => {
        const item = purchaseToCancel.items.find(i => i.productId === p.id);
        if (item) {
          const unitsToDeduct = item.format === 'box' && item.unitsPerBox
            ? item.quantity * item.unitsPerBox
            : item.quantity;
          return { ...p, stock: Math.max(0, p.stock - unitsToDeduct) };
        }
        return p;
      });
      setProducts(updatedProducts);
      localStorage.setItem('sge_products', JSON.stringify(updatedProducts));

      const updatedPurchases = purchases.map(p => p.id === id ? { ...p, status: 'Cancelada' as const } : p);
      setPurchases(updatedPurchases);
      localStorage.setItem('sge_purchases', JSON.stringify(updatedPurchases));
    }
  };

  // Caixa e Lançamentos Livres
  const addCashFlow = async (entry: Omit<CashFlowEntry, 'id' | 'timestamp'>) => {
    const dateStr = new Date().toISOString();
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.from('cash_flow_entries').insert([{
          timestamp: dateStr,
          type: entry.type,
          description: entry.description,
          value: entry.value,
          category: entry.category
        }]).select();

        if (error) throw error;
        if (data && data[0]) {
          const added: CashFlowEntry = {
            id: data[0].id,
            timestamp: data[0].timestamp,
            type: data[0].type as 'Entrada' | 'Saída',
            description: data[0].description,
            value: Number(data[0].value),
            category: data[0].category || ''
          };
          setCashFlow(prev => [added, ...prev]);
        }
      } catch (e: any) {
        console.error('Erro ao registrar caixa no Supabase:', e);
        setDbError(`Erro ao registrar fluxo de caixa no Supabase: **${e?.message || String(e)}**.`);
      }
    } else {
      const added: CashFlowEntry = {
        ...entry,
        id: Date.now().toString(),
        timestamp: dateStr
      };
      const list = [added, ...cashFlow];
      setCashFlow(list);
      localStorage.setItem('sge_cash_flow', JSON.stringify(list));
    }
  };

  // Contas a Pagar
  const addAccountPayable = async (account: Omit<AccountPayable, 'id'>) => {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.from('accounts_payable').insert([{
          supplier_name: serializePayableSupplierName(account),
          due_date: account.dueDate,
          value: account.value,
          status: account.status
        }]).select();

        if (error) throw error;
        if (data && data[0]) {
          const added: AccountPayable = parsePayableFromDb(data[0]);
          setAccountsPayable(prev => [...prev, added]);
        }
      } catch (e: any) {
        console.error('Erro ao criar conta a pagar:', e);
        setDbError(`Erro ao criar conta a pagar no Supabase: **${e?.message || String(e)}**.`);
      }
    } else {
      const added: AccountPayable = { ...account, id: Date.now().toString() };
      const list = [...accountsPayable, added];
      setAccountsPayable(list);
      localStorage.setItem('sge_accounts_payable', JSON.stringify(list.map(p => ({
        ...p,
        supplierName: serializePayableSupplierName(p)
      }))));
    }
  };

  const payPayable = async (id: string) => {
    const payableToPay = accountsPayable.find(acc => acc.id === id);
    if (!payableToPay) return;

    const payCategory = payableToPay.category || 'Fornecedores';
    const payDesc = `Pagamento: ${payableToPay.supplierName}${payableToPay.description ? ` (${payableToPay.description})` : ''}`;

    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase.from('accounts_payable').update({ status: 'Pago' }).eq('id', id);
        if (error) throw error;
        
        if (payableToPay.status !== 'Pago') {
          await addCashFlow({
            type: 'Saída',
            description: payDesc,
            value: payableToPay.value,
            category: payCategory
          });
        }

        setAccountsPayable(prev => prev.map(acc => acc.id === id ? { ...acc, status: 'Pago' } : acc));
      } catch (e: any) {
        console.error('Erro ao liquidar conta a pagar:', e);
        setDbError(`Erro ao liquidar conta a pagar no Supabase: **${e?.message || String(e)}**.`);
      }
    } else {
      if (payableToPay.status !== 'Pago') {
        const addedCF: CashFlowEntry = {
          id: Date.now().toString(),
          timestamp: new Date().toISOString(),
          type: 'Saída',
          description: payDesc,
          value: payableToPay.value,
          category: payCategory
        };
        const updatedCF = [addedCF, ...cashFlow];
        setCashFlow(updatedCF);
        localStorage.setItem('sge_cash_flow', JSON.stringify(updatedCF));
      }
      
      const list = accountsPayable.map(acc => acc.id === id ? { ...acc, status: 'Pago' as const } : acc);
      setAccountsPayable(list);
      localStorage.setItem('sge_accounts_payable', JSON.stringify(list.map(p => ({
        ...p,
        supplierName: serializePayableSupplierName(p)
      }))));
    }
  };

  // Contas a Receber
  const addAccountReceivable = async (account: Omit<AccountReceivable, 'id'>) => {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.from('accounts_receivable').insert([{
          customer_name: account.customerName,
          due_date: account.dueDate,
          value: account.value,
          status: account.status
        }]).select();

        if (error) throw error;
        if (data && data[0]) {
          const added: AccountReceivable = {
            id: data[0].id,
            customerName: data[0].customer_name,
            dueDate: data[0].due_date,
            value: Number(data[0].value),
            status: data[0].status as 'Pendente' | 'Recebido' | 'Atrasado'
          };
          setAccountsReceivable(prev => [...prev, added]);
        }
      } catch (e: any) {
        console.error('Erro ao lançar recebimento:', e);
        setDbError(`Erro ao registrar conta a receber no Supabase: **${e?.message || String(e)}**.`);
      }
    } else {
      const added: AccountReceivable = { ...account, id: Date.now().toString() };
      const list = [...accountsReceivable, added];
      setAccountsReceivable(list);
      localStorage.setItem('sge_accounts_receivable', JSON.stringify(list));
    }
  };

  const receiveReceivable = async (id: string) => {
    const receivableToReceive = accountsReceivable.find(acc => acc.id === id);
    if (!receivableToReceive) return;

    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase.from('accounts_receivable').update({ status: 'Recebido' }).eq('id', id);
        if (error) throw error;

        if (receivableToReceive.status !== 'Recebido') {
          await addCashFlow({
            type: 'Entrada',
            description: `Recebimento de cliente: ${receivableToReceive.customerName}`,
            value: receivableToReceive.value,
            category: 'Vendas'
          });
        }

        setAccountsReceivable(prev => prev.map(acc => acc.id === id ? { ...acc, status: 'Recebido' } : acc));
      } catch (e: any) {
        console.error('Erro ao registrar recebimento:', e);
        setDbError(`Erro ao liquidar conta a receber no Supabase: **${e?.message || String(e)}**.`);
      }
    } else {
      if (receivableToReceive.status !== 'Recebido') {
        const addedCF: CashFlowEntry = {
          id: Date.now().toString(),
          timestamp: new Date().toISOString(),
          type: 'Entrada',
          description: `Recebimento de cliente: ${receivableToReceive.customerName}`,
          value: receivableToReceive.value,
          category: 'Vendas'
        };
        const updatedCF = [addedCF, ...cashFlow];
        setCashFlow(updatedCF);
        localStorage.setItem('sge_cash_flow', JSON.stringify(updatedCF));
      }
      
      const list = accountsReceivable.map(acc => acc.id === id ? { ...acc, status: 'Recebido' as const } : acc);
      setAccountsReceivable(list);
      localStorage.setItem('sge_accounts_receivable', JSON.stringify(list));
    }
  };

  const deleteCashFlow = async (id: string) => {
    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase.from('cash_flow_entries').delete().eq('id', id);
        if (error) throw error;
        setCashFlow(prev => prev.filter(c => c.id !== id));
      } catch (e: any) {
        console.error('Erro ao deletar lançamento do fluxo de caixa:', e);
        setDbError(`Erro ao deletar lançamento do fluxo de caixa: **${e?.message || String(e)}**.`);
      }
    } else {
      const updated = cashFlow.filter(c => c.id !== id);
      setCashFlow(updated);
      localStorage.setItem('sge_cash_flow', JSON.stringify(updated));
    }
  };

  const deleteAccountPayable = async (id: string) => {
    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase.from('accounts_payable').delete().eq('id', id);
        if (error) throw error;
        setAccountsPayable(prev => prev.filter(a => a.id !== id));
      } catch (e: any) {
        console.error('Erro ao deletar conta a pagar:', e);
        setDbError(`Erro ao deletar conta a pagar: **${e?.message || String(e)}**.`);
      }
    } else {
      const updated = accountsPayable.filter(a => a.id !== id);
      setAccountsPayable(updated);
      localStorage.setItem('sge_accounts_payable', JSON.stringify(updated.map(p => ({
        ...p,
        supplierName: serializePayableSupplierName(p)
      }))));
    }
  };

  const deleteAccountReceivable = async (id: string) => {
    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase.from('accounts_receivable').delete().eq('id', id);
        if (error) throw error;
        setAccountsReceivable(prev => prev.filter(a => a.id !== id));
      } catch (e: any) {
        console.error('Erro ao deletar conta a receber:', e);
        setDbError(`Erro ao deletar conta a receber: **${e?.message || String(e)}**.`);
      }
    } else {
      const updated = accountsReceivable.filter(a => a.id !== id);
      setAccountsReceivable(updated);
      localStorage.setItem('sge_accounts_receivable', JSON.stringify(updated));
    }
  };

  return (
    <ErpContext.Provider value={{
      products, clients, suppliers, sales, purchases, cashFlow, accountsPayable, accountsReceivable,
      isDbConnected: isSupabaseConfigured,
      dbError,
      clearDbError,
      addProduct, editProduct, deleteProduct,
      addClient, editClient, deleteClient,
      addSupplier, editSupplier, deleteSupplier,
      performSale, deleteSale, addPurchase, cancelPurchase, addCashFlow, deleteCashFlow, addAccountPayable, deleteAccountPayable, addAccountReceivable, deleteAccountReceivable,
      payPayable, receiveReceivable
    }}>
      {children}
    </ErpContext.Provider>
  );
}
