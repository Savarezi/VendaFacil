import React, { useState } from 'react';
import { useErp } from '../context/ErpContext';
import { Purchase, PurchaseItem, Product } from '../types';
import { 
  Search, 
  Plus, 
  Trash2, 
  ShoppingBag, 
  X, 
  PlusCircle, 
  AlertCircle, 
  ChevronDown, 
  ChevronUp, 
  Calendar, 
  PlusSquare, 
  ArrowRightLeft, 
  BarChart, 
  TrendingDown,
  Info
} from 'lucide-react';

export default function Compras() {
  const { 
    purchases, 
    products, 
    suppliers, 
    addPurchase, 
    cancelPurchase, 
    accountsPayable 
  } = useErp();

  // Filters & UI States
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Todas'); // 'Todas' | 'Concluída' | 'Cancelada'
  const [expandedPurchaseId, setExpandedPurchaseId] = useState<string | null>(null);
  
  // Registration Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Dinheiro');
  const [discount, setDiscount] = useState('');
  
  // New Item Temporary List
  const [provisionalItems, setProvisionalItems] = useState<Omit<PurchaseItem, 'id' | 'purchaseId'>[]>([]);
  
  // New Item Fields
  const [selectedProductId, setSelectedProductId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [costPrice, setCostPrice] = useState('');
  const [format, setFormat] = useState<'unit' | 'box'>('unit');

  // Find active product properties
  const activeProduct = products.find(p => p.id === selectedProductId);

  // Compute stats
  const activePurchases = purchases.filter(p => p.status === 'Concluída');
  const totalSpent = activePurchases.reduce((sum, p) => sum + p.total, 0);
  const pendingPayablesFromPurchases = accountsPayable
    .filter(ap => ap.status === 'Pendente')
    .reduce((sum, ap) => sum + ap.value, 0);

  // Filtered list
  const filteredPurchases = purchases.filter(p => {
    const matchesSearch = p.supplierName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          p.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'Todas' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleOpenModal = () => {
    setSelectedSupplier(suppliers[0]?.companyName || '');
    setPaymentMethod('Dinheiro');
    setDiscount('');
    setProvisionalItems([]);
    resetItemFields();
    setIsModalOpen(true);
  };

  const resetItemFields = () => {
    setSelectedProductId(products[0]?.id || '');
    setQuantity('1');
    setCostPrice('');
    setFormat('unit');
  };

  const handleAddProvisionalItem = () => {
    if (!selectedProductId) return;
    const prod = products.find(p => p.id === selectedProductId);
    if (!prod) return;

    const parsedQty = parseFloat(quantity) || 0;
    const parsedCost = parseFloat(costPrice) || 0;

    if (parsedQty <= 0) {
      alert('Por favor, informe uma quantidade válida.');
      return;
    }
    if (parsedCost <= 0) {
      alert('Por favor, informe um preço de custo válido.');
      return;
    }

    const newItem: Omit<PurchaseItem, 'id' | 'purchaseId'> = {
      productId: prod.id,
      productName: prod.name,
      quantity: parsedQty,
      costPrice: parsedCost,
      format,
      unitsPerBox: prod.unitsPerBox || 12
    };

    setProvisionalItems(prev => [...prev, newItem]);
    
    // Clear item inputs
    setQuantity('1');
    setCostPrice('');
  };

  const handleRemoveProvisionalItem = (index: number) => {
    setProvisionalItems(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleSavePurchase = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedSupplier) {
      alert('Por favor, cadastre um fornecedor antes de registrar uma compra.');
      return;
    }

    if (provisionalItems.length === 0) {
      alert('Por favor, adicione ao menos um produto à compra.');
      return;
    }

    const parsedDiscount = parseFloat(discount) || 0;
    const subtotal = provisionalItems.reduce((sum, item) => sum + (item.costPrice * item.quantity), 0);
    const total = subtotal - parsedDiscount;

    const newPurchaseProps = {
      supplierName: selectedSupplier,
      subtotal,
      discount: parsedDiscount,
      total,
      paymentMethod,
      status: 'Concluída' as const
    };

    await addPurchase(newPurchaseProps, provisionalItems);
    setIsModalOpen(false);
  };

  const toggleExpand = (id: string) => {
    setExpandedPurchaseId(prev => prev === id ? null : id);
  };

  const formatCurrency = (val: number) => {
    return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Compras & Entradas de Estoque</h1>
          <p className="text-slate-500 text-sm mt-1">
            Lance notas fiscais de compra, controle o custo real de entrada das mercadorias e reabasteça o depósito.
          </p>
        </div>
        <button 
          onClick={handleOpenModal}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-all text-sm font-medium flex items-center gap-2 shadow-sm"
        >
          <Plus size={16} />
          Registrar Compra
        </button>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-50 rounded-lg text-emerald-600">
            <ShoppingBag size={22} />
          </div>
          <div>
            <p className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Total Investido (Custo)</p>
            <h3 className="text-xl font-bold font-mono text-slate-800 mt-0.5">{formatCurrency(totalSpent)}</h3>
          </div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-indigo-50 rounded-lg text-indigo-600">
            <Calendar size={22} />
          </div>
          <div>
            <p className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Compras Registradas</p>
            <h3 className="text-xl font-bold font-mono text-slate-800 mt-0.5">{purchases.length} notas</h3>
          </div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-rose-50 rounded-lg text-rose-600">
            <TrendingDown size={22} />
          </div>
          <div>
            <p className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Compromissos a Pagar</p>
            <h3 className="text-xl font-bold font-mono text-rose-650 mt-0.5">{formatCurrency(pendingPayablesFromPurchases)}</h3>
          </div>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:max-w-md">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Buscar por Fornecedor ou Código de Compra..."
            className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-400 focus:bg-white transition-all text-slate-700"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex w-full md:w-auto items-center gap-2">
          <span className="text-slate-500 text-xs font-semibold whitespace-nowrap">Status:</span>
          <select 
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-600 focus:outline-none focus:border-indigo-400"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="Todas">Todas as Compras</option>
            <option value="Concluída">Apenas Concluídas</option>
            <option value="Cancelada">Apenas Canceladas</option>
          </select>
        </div>
      </div>

      {/* Purchase History List */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold text-xs tracking-wider uppercase">
                <th className="px-6 py-3.5">ID da Compra</th>
                <th className="px-6 py-3.5">Data/Hora</th>
                <th className="px-6 py-3.5">Fornecedor</th>
                <th className="px-6 py-3.5">Método Pagto</th>
                <th className="px-6 py-3.5 text-right">Total Pago</th>
                <th className="px-6 py-3.5 text-center">Status</th>
                <th className="px-6 py-3.5 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 text-xs">
              {filteredPurchases.map((purchase) => {
                const isExpanded = expandedPurchaseId === purchase.id;
                const isCanceled = purchase.status === 'Cancelada';

                return (
                  <React.Fragment key={purchase.id}>
                    <tr className={`hover:bg-slate-50 transition-all ${isCanceled ? 'opacity-65 bg-slate-50/50' : ''}`}>
                      <td 
                        onClick={() => toggleExpand(purchase.id)}
                        className="px-6 py-4 font-mono text-indigo-600 font-semibold cursor-pointer hover:underline"
                      >
                        #{purchase.id.slice(0, 8).toUpperCase()}
                      </td>
                      <td className="px-6 py-4 text-slate-500">{formatDate(purchase.timestamp)}</td>
                      <td className="px-6 py-4 font-semibold text-slate-800">{purchase.supplierName}</td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 rounded bg-slate-100 text-slate-600 font-medium">{purchase.paymentMethod}</span>
                      </td>
                      <td className="px-6 py-4 text-right font-mono font-bold text-slate-900">{formatCurrency(purchase.total)}</td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          isCanceled 
                            ? 'bg-rose-100 text-rose-700' 
                            : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {purchase.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button 
                            onClick={() => toggleExpand(purchase.id)}
                            className="p-1 px-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 transition-all text-[11px] rounded flex items-center gap-1 font-medium"
                          >
                            {isExpanded ? 'Esconder Lista' : 'Expandir Itens'}
                            {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                          </button>
                          
                          {!isCanceled && (
                            <button 
                              onClick={() => {
                                if (confirm('Tem certeza que deseja cancelar esta compra? O estoque adicionado será devolvido.')) {
                                  cancelPurchase(purchase.id);
                                }
                              }}
                              className="p-1 px-2.5 border border-rose-200 hover:bg-rose-50 text-rose-600 transition-all text-[11px] font-semibold rounded"
                            >
                              Cancelar
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>

                    {/* Extended Items list */}
                    {isExpanded && (
                      <tr>
                        <td colSpan={7} className="px-6 py-3 bg-slate-50 border-y border-slate-150">
                          <div className="rounded-lg border border-slate-200 bg-white overflow-hidden shadow-inner p-3 space-y-2">
                            <h4 className="text-slate-800 text-xs font-bold flex items-center gap-1.5 border-b border-slate-100 pb-2">
                              <ShoppingBag size={14} className="text-emerald-600" />
                              Itens Discriminados na Compra
                            </h4>
                            <table className="w-full text-left text-[11px] text-slate-600">
                              <thead>
                                <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                                  <th className="py-1">Nome do Produto</th>
                                  <th className="py-1 text-center">Formato de Compra</th>
                                  <th className="py-1 text-center">Quantidade Comprada</th>
                                  <th className="py-1 text-right">Preço de Custo Cobrado</th>
                                  <th className="py-1 text-right">Subtotal</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {purchase.items.map((it, idx) => (
                                  <tr key={idx} className="py-1">
                                    <td className="py-2.5 font-semibold text-slate-800">{it.productName}</td>
                                    <td className="py-2.5 text-center">
                                      <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 font-semibold font-mono text-[9px]">
                                        {it.format === 'box' ? `CAIXA (${it.unitsPerBox} un)` : 'UNIDADE AVULSA'}
                                      </span>
                                    </td>
                                    <td className="py-2.5 text-center font-mono font-bold text-slate-800">
                                      {it.quantity} {it.format === 'box' ? 'caixas' : 'unidades'}
                                    </td>
                                    <td className="py-2.5 text-right font-mono text-slate-500">{formatCurrency(it.costPrice)} / {it.format === 'box' ? 'cx' : 'un'}</td>
                                    <td className="py-2.5 text-right font-mono font-bold text-slate-850">{formatCurrency(it.costPrice * it.quantity)}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}

              {filteredPurchases.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <ShoppingBag size={42} strokeWidth={1} className="text-slate-355" />
                      <span className="text-xs font-medium">Nenhuma compra registrada neste período de interesse.</span>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* REGISTRATION MODAL DRAWER */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4.5 border-b border-slate-100 flex items-center justify-between bg-slate-900 text-white">
              <div>
                <h3 className="font-bold text-base flex items-center gap-2">
                  <PlusSquare size={18} className="text-emerald-400" />
                  Registrar Nova Nota de Compra (Entrada de Estoque)
                </h3>
                <p className="text-[10px] text-slate-400 mt-0.5">Siga o preenchimento físico das notas emitidas pelos distribuidores.</p>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-all focus:outline-none"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSavePurchase} className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Step 1: Vendor & Carrier Choice */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 pb-5">
                <div className="col-span-1 md:col-span-2">
                  <h4 className="text-[11px] uppercase tracking-wider font-bold text-slate-400 flex items-center gap-1 mb-2">
                    <ArrowRightLeft size={12} className="text-slate-500" />
                    Fornecedor & Forma Fiscal
                  </h4>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 select-none">Fornecedor Responsável da Nota</label>
                  <select 
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-400 text-slate-700 bg-white text-xs font-semibold"
                    value={selectedSupplier}
                    onChange={(e) => setSelectedSupplier(e.target.value)}
                  >
                    {suppliers.map((sup, idx) => (
                      <option key={idx} value={sup.companyName}>{sup.companyName}</option>
                    ))}
                    {suppliers.length === 0 && (
                      <option value="">Nenhum fornecedor cadastrado</option>
                    )}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 select-none">Forma de Pagamento Billed</label>
                  <select 
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-400 text-slate-700 bg-white text-xs font-semibold"
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  >
                    <option value="Dinheiro">Dinheiro vivo ou Caixa</option>
                    <option value="Pix">Transferência PIX</option>
                    <option value="Cartão">Cartão de Débito/Crédito</option>
                    <option value="A prazo">A Prazo (Gera Duplicata no Contas a Pagar)</option>
                  </select>
                </div>
              </div>

              {/* Step 2: Item Addition Box */}
              <div className="border border-slate-200 rounded-xl p-4 bg-white shadow-xs space-y-4">
                <h4 className="text-[11px] uppercase tracking-wider font-bold text-slate-400 flex items-center gap-1 border-b border-slate-100 pb-2">
                  <PlusCircle size={13} className="text-indigo-500" />
                  Adicionar mercadorias compradas à lista
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-3.5 items-end">
                  {/* Select Product */}
                  <div className="space-y-1 md:col-span-2">
                    <label className="text-[10px] font-bold text-slate-600 uppercase">Escolha o Produto</label>
                    <select 
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-400 text-slate-700 bg-white text-xs font-semibold"
                      value={selectedProductId}
                      onChange={(e) => {
                        setSelectedProductId(e.target.value);
                        // default logic
                        const selected = products.find(p => p.id === e.target.value);
                        if (selected) {
                          setFormat(selected.isFractional ? 'box' : 'unit');
                        }
                      }}
                    >
                      {products.map((p, idx) => (
                        <option key={idx} value={p.id}>{p.name} ({p.code})</option>
                      ))}
                      {products.length === 0 && (
                        <option value="">Nenhum produto em estoque</option>
                      )}
                    </select>
                  </div>

                  {/* Formato de Compra */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-600 uppercase">Formato Comprado</label>
                    <select 
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-400 text-slate-700 bg-white text-xs font-semibold"
                      value={format}
                      onChange={(e) => setFormat(e.target.value as any)}
                    >
                      <option value="unit">Unidade Avulsa</option>
                      {activeProduct?.isFractional && (
                        <option value="box">Caixa Fechada ({activeProduct.unitsPerBox} un)</option>
                      )}
                    </select>
                  </div>

                  {/* Quantidade */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-600 uppercase">Quantidade Comprada</label>
                    <input 
                      type="number" 
                      min="1"
                      step="0.01"
                      placeholder="1"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-400 text-slate-700 text-xs font-mono font-bold"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                    />
                  </div>

                  {/* Preço de Custo */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-indigo-700 uppercase flex items-center gap-1">
                      Custo Unitário Pago (R$)
                      <span className="tooltip cursor-pointer text-slate-400" title="Digite o preço cobrado exatamente nesta compra. Não calculamos automaticamente para flexibilidade comercial!"><Info size={11} /></span>
                    </label>
                    <input 
                      type="number" 
                      min="0.01"
                      step="0.01"
                      placeholder="0.00"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-300 focus:border-indigo-400 text-indigo-700 text-xs font-mono font-bold"
                      value={costPrice}
                      onChange={(e) => setCostPrice(e.target.value)}
                    />
                  </div>

                  <div className="md:col-span-4 flex justify-end">
                    <button 
                      type="button"
                      onClick={handleAddProvisionalItem}
                      className="px-4 py-2 bg-indigo-650 hover:bg-slate-800 text-white transition-all text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-sm"
                    >
                      <PlusCircle size={15} />
                      Adicionar Mercadoria à Nota
                    </button>
                  </div>
                </div>
              </div>

              {/* Provisional Added list inside Modal */}
              <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
                <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-200">
                  <h5 className="font-bold text-slate-700 text-xs uppercase tracking-wider">Metas de Nota Compradas ({provisionalItems.length})</h5>
                </div>
                <table className="w-full text-left text-[11px] border-collapse">
                  <thead>
                    <tr className="bg-slate-50/50 border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider text-[9px]">
                      <th className="px-4 py-2">Produto</th>
                      <th className="px-4 py-2 text-center">Unidades / Pack</th>
                      <th className="px-4 py-2 text-center">Quantidade</th>
                      <th className="px-4 py-2 text-right">Preço de Custo (Nota)</th>
                      <th className="px-4 py-2 text-right">Total</th>
                      <th className="px-4 py-2 text-center">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {provisionalItems.map((item, index) => (
                      <tr key={index} className="hover:bg-slate-50/60">
                        <td className="px-4 py-3 font-semibold text-slate-800">{item.productName}</td>
                        <td className="px-4 py-3 text-center">
                          <span className="px-1 py-0.5 rounded bg-slate-100 text-slate-500 font-semibold uppercase text-[9px] font-mono">
                            {item.format === 'box' ? `CAIXA (${item.unitsPerBox} un)` : 'UNIDADE'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center font-mono font-bold text-slate-800">
                          {item.quantity} {item.format === 'box' ? 'cx' : 'un'}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-slate-600">{formatCurrency(item.costPrice)}</td>
                        <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">{formatCurrency(item.costPrice * item.quantity)}</td>
                        <td className="px-4 py-3 text-center">
                          <button 
                            type="button" 
                            onClick={() => handleRemoveProvisionalItem(index)}
                            className="p-1 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded transition"
                          >
                            <Trash2 size={13} />
                          </button>
                        </td>
                      </tr>
                    ))}

                    {provisionalItems.length === 0 && (
                      <tr>
                        <td colSpan={6} className="text-center py-6 text-slate-400 font-semibold">
                          Nenhum item adicionado à nota comercial ainda.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Subtotal & Discount and Calculation row */}
              <div className="flex flex-col md:flex-row justify-between items-end gap-4 border-t border-slate-100 pt-5 pr-2">
                <div className="space-y-1 w-full md:max-w-xs">
                  <label className="text-[11px] font-bold text-slate-500 uppercase">Desconto Concedido do Distribuidor (R$)</label>
                  <input 
                    type="number" 
                    placeholder="0.00"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-400 text-slate-700 text-xs font-mono font-bold"
                    value={discount}
                    onChange={(e) => setDiscount(e.target.value)}
                  />
                </div>

                <div className="w-full md:max-w-xs bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col space-y-1.5 font-semibold text-xs">
                  <div className="flex justify-between text-slate-500">
                    <span>Subtotal da Nota:</span>
                    <span className="font-mono font-semibold">{formatCurrency(provisionalItems.reduce((sum, item) => sum + item.costPrice * item.quantity, 0))}</span>
                  </div>
                  <div className="flex justify-between text-rose-500">
                    <span>Desconto Aplicado:</span>
                    <span className="font-mono font-semibold">-{formatCurrency(parseFloat(discount) || 0)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-bold text-slate-800 border-t border-slate-200 pt-1.5">
                    <span>Custo Total Final:</span>
                    <span className="font-mono font-bold text-indigo-750">
                      {formatCurrency(
                        Math.max(0, provisionalItems.reduce((sum, item) => sum + item.costPrice * item.quantity, 0) - (parseFloat(discount) || 0))
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </form>

            {/* Modal Actions */}
            <div className="px-6 py-4.5 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2">
              <button 
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-100 rounded-lg transition-all text-xs font-semibold text-slate-500"
              >
                Voltar / Cancelar
              </button>
              <button 
                type="button"
                onClick={handleSavePurchase}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-all text-xs font-bold shadow-sm"
              >
                Confirmar Compra & Entrada
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
