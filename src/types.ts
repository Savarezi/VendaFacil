export interface Product {
  id: string;
  name: string;
  code: string;
  category: string;
  price: number;
  stock: number;
  supplier?: string;
  
  // Propriedades facultativas de fracionamento (caixa e unidade)
  isFractional?: boolean;
  unitsPerBox?: number;
  pricePerBox?: number;
  pricePerUnit?: number;
  salesModel?: 'both' | 'unit_only' | 'box_only';
}

export interface Client {
  id: string;
  name: string;
  document: string; // CPF or CNPJ
  phone: string;
  address: string;
  creditLimit: number;
}

export interface Supplier {
  id: string;
  companyName: string; // Razão Social
  document: string; // CNPJ
  contactName: string;
  phone: string;
  email: string;
}

export interface SaleItem {
  productId: string;
  productName: string;
  price: number;
  quantity: number;
  
  // Detalhes extras do formato na venda
  format?: 'unit' | 'box';
  unitsPerBox?: number;
}

export interface Sale {
  id: string;
  timestamp: string; // ISO String
  items: SaleItem[];
  subtotal: number;
  discount: number;
  total: number;
  paymentMethod: string; // 'Dinheiro' | 'Cartão de Crédito' | 'Cartão de Débito' | 'Pix' | 'Crediário'
  customerName: string;
  status: 'Concluída' | 'Cancelada' | 'Pendente';
}

export interface CashFlowEntry {
  id: string;
  timestamp: string;
  type: 'Entrada' | 'Saída';
  description: string;
  value: number;
  category: string;
  saleId?: string;
}

export interface AccountPayable {
  id: string;
  supplierName: string;
  dueDate: string; // YYYY-MM-DD
  value: number;
  status: 'Pendente' | 'Pago' | 'Atrasado';
  category?: string;
  expenseType?: 'fixed' | 'variable';
  description?: string;
}

export interface AccountReceivable {
  id: string;
  customerName: string;
  dueDate: string; // YYYY-MM-DD
  value: number;
  status: 'Pendente' | 'Recebido' | 'Atrasado';
  saleId?: string;
}

export interface PurchaseItem {
  id: string;
  purchaseId: string;
  productId: string;
  productName: string;
  quantity: number;
  costPrice: number;
  format?: 'unit' | 'box';
  unitsPerBox?: number;
}

export interface Purchase {
  id: string;
  timestamp: string; // ISO String
  supplierId?: string;
  supplierName: string;
  items: PurchaseItem[];
  subtotal: number;
  discount: number;
  total: number;
  paymentMethod: string; // 'Dinheiro' | 'A prazo' | 'Pix' | 'Cartão'
  status: 'Concluída' | 'Cancelada';
}

