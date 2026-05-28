import React, { useState } from 'react';
import { useErp } from '../context/ErpContext';
import { Search, Calendar, Filter, Eye, ShoppingBag, X, Trash2 } from 'lucide-react';
import { Sale } from '../types';

export default function HistoricoVendas() {
  const { sales, deleteSale } = useErp();

  // Filter states
  const [customerSearch, setCustomerSearch] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('Todas');
  const [dateFilter, setDateFilter] = useState('Todas'); // 'Todas' | 'Hoje' | 'Ultimos7'
  const [statusFilter, setStatusFilter] = useState('Todas');

  // Modal view receipt state
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const todayStr = '2026-05-26'; // current mock date

  const isToday = (timestampStr: string) => {
    return timestampStr.startsWith(todayStr);
  };

  const isWithinLast7Days = (timestampStr: string) => {
    const saleDate = new Date(timestampStr);
    const limitDate = new Date(todayStr);
    limitDate.setDate(limitDate.getDate() - 7);
    return saleDate >= limitDate;
  };

  const filteredSales = sales.filter(s => {
    const matchesCustomer = s.customerName.toLowerCase().includes(customerSearch.toLowerCase()) ||
                            s.id.toLowerCase().includes(customerSearch.toLowerCase());
    const matchesPayment = paymentFilter === 'Todas' || s.paymentMethod === paymentFilter;
    
    let matchesDate = true;
    if (dateFilter === 'Hoje') {
      matchesDate = isToday(s.timestamp);
    } else if (dateFilter === 'Ultimos7') {
      matchesDate = isWithinLast7Days(s.timestamp);
    }

    const matchesStatus = statusFilter === 'Todas' || s.status === statusFilter;

    return matchesCustomer && matchesPayment && matchesDate && matchesStatus;
  });

  const handleDelete = async (id: string) => {
    await deleteSale(id);
    setDeleteId(null);
  };

  const formatCurrency = (val: number) => {
    return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Histórico de Transações</h1>
          <p className="text-slate-500 text-sm mt-1">Consulte o registro geral de vendas presenciais e faturadas, ordens e notas.</p>
        </div>
      </div>

      {/* Control bar / Advanced filters */}
      <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          
          {/* Query search Input */}
          <div className="relative text-xs">
            <Search size={16} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Código ou cliente..."
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-400 text-slate-700 text-xs"
              value={customerSearch}
              onChange={(e) => setCustomerSearch(e.target.value)}
            />
          </div>

          {/* Payment category select */}
          <select 
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-600 text-xs focus:outline-none focus:border-indigo-400"
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
          >
            <option value="Todas">Met. Pagamento: Todos</option>
            <option value="Pix">Pix (À Vista)</option>
            <option value="Dinheiro">Dinheiro</option>
            <option value="Cartão de Crédito">Cartão de Crédito</option>
            <option value="Cartão de Débito">Cartão de Débito</option>
            <option value="Crediário">Crediário (A Prazo)</option>
          </select>

          {/* Date Range Selector */}
          <select 
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-600 text-xs focus:outline-none focus:border-indigo-400"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
          >
            <option value="Todas">Data: Todo Período</option>
            <option value="Hoje">Hoje (26/05)</option>
            <option value="Ultimos7">Últimos 7 Dias</option>
          </select>

          {/* Status select dropdown */}
          <select 
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-600 text-xs focus:outline-none focus:border-indigo-400"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="Todas">Operação: Todos os Status</option>
            <option value="Concluída">Concluída</option>
            <option value="Pendente">Pendente</option>
            <option value="Cancelada">Cancelada</option>
          </select>

        </div>
      </div>

      {/* Table Log */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold text-xs tracking-wider uppercase">
                <th className="px-6 py-3.5">Código Venda</th>
                <th className="px-6 py-3.5">Data & Hora</th>
                <th className="px-6 py-3.5">Nome do Cliente</th>
                <th className="px-6 py-3.5 text-center">Filtro de Pagamento</th>
                <th className="px-6 py-3.5 text-right">Subtotal</th>
                <th className="px-6 py-3.5 text-right">Desconto</th>
                <th className="px-6 py-3.5 text-right">Total Líquido</th>
                <th className="px-6 py-3.5 text-center">Status</th>
                <th className="px-6 py-3.5 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 text-xs">
              {filteredSales.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50 transition-all font-medium">
                  <td className="px-6 py-4 font-mono font-bold text-indigo-600">{s.id}</td>
                  <td className="px-6 py-4 text-slate-500 font-normal">
                    {new Date(s.timestamp).toLocaleDateString('pt-BR')} {new Date(s.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="px-6 py-4 text-slate-800 font-bold">{s.customerName}</td>
                  <td className="px-6 py-4 text-center">
                    <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-semibold">
                      {s.paymentMethod}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right font-mono font-normal text-slate-500">{formatCurrency(s.subtotal)}</td>
                  <td className="px-6 py-4 text-right font-mono text-rose-500 font-medium">-{formatCurrency(s.discount)}</td>
                  <td className="px-6 py-4 text-right font-mono font-bold text-slate-900">{formatCurrency(s.total)}</td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-2 py-0.5 rounded-full font-semibold ${
                      s.status === 'Concluída' 
                        ? 'bg-emerald-100 text-emerald-800' 
                        : s.status === 'Pendente' 
                          ? 'bg-amber-100 text-amber-800' 
                          : 'bg-rose-100 text-rose-800'
                    }`}>
                      {s.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <button 
                        onClick={() => setSelectedSale(s)}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded transition-all"
                        title="Visualizar Cupom Venda"
                      >
                        <Eye size={15} />
                      </button>
                      <button 
                        onClick={() => setDeleteId(s.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded transition-all"
                        title="Excluir Venda"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredSales.length === 0 && (
                <tr>
                  <td colSpan={9} className="text-center py-10 text-slate-400">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <ShoppingBag size={36} strokeWidth={1} />
                      <span className="text-xs">Nenhum cupom de venda encontrado.</span>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Sale Detail Overlay Modal */}
      {selectedSale && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-md w-full overflow-hidden transition-all text-xs">
            <div className="flex justify-between items-center bg-slate-50 px-6 py-4 border-b border-slate-100">
              <h2 className="font-bold text-slate-800 text-md flex items-center gap-2">
                <ShoppingBag size={16} className="text-indigo-600" />
                Cupom ID: {selectedSale.id}
              </h2>
              <button onClick={() => setSelectedSale(null)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-y-2 border-b border-slate-100 pb-3 font-medium text-slate-600">
                <span>Cliente:</span>
                <span className="font-bold text-slate-800 text-right">{selectedSale.customerName}</span>
                
                <span>Data:</span>
                <span className="text-right">{new Date(selectedSale.timestamp).toLocaleString('pt-BR')}</span>

                <span>F. Pagamento:</span>
                <span className="text-right font-semibold text-indigo-700">{selectedSale.paymentMethod}</span>

                <span>Status Operacional:</span>
                <span className="text-right text-emerald-600 font-bold">{selectedSale.status}</span>
              </div>

              {/* Items Table List */}
              <div className="space-y-1.5">
                <h4 className="font-semibold text-slate-500 uppercase tracking-wider text-[10px]">Itens Comprados</h4>
                <div className="divide-y divide-slate-50 border border-slate-100 rounded-lg overflow-hidden bg-slate-50 p-1">
                  {selectedSale.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between p-2">
                      <div className="max-w-[70%]">
                        <p className="font-semibold text-slate-700 truncate">{item.productName}</p>
                        <span className="text-[10px] text-slate-400 font-mono">{item.quantity} un x {formatCurrency(item.price)}</span>
                      </div>
                      <span className="font-mono font-bold text-slate-800 pl-2 self-center">{formatCurrency(item.price * item.quantity)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Financial summary calculations */}
              <div className="pt-3 border-t border-slate-100 space-y-1.5 font-mono text-slate-500">
                <div className="flex justify-between">
                  <span>Subtotal Geral:</span>
                  <span>{formatCurrency(selectedSale.subtotal)}</span>
                </div>
                <div className="flex justify-between text-rose-500 font-medium">
                  <span>Desconto Concedido:</span>
                  <span>-{formatCurrency(selectedSale.discount)}</span>
                </div>
                <div className="flex justify-between border-t border-slate-100 pt-1.5 text-sm font-bold text-indigo-600">
                  <span>Preço Final Pago:</span>
                  <span>{formatCurrency(selectedSale.total)}</span>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button 
                  type="button"
                  onClick={() => {
                    setSelectedSale(null);
                    setDeleteId(selectedSale.id);
                  }}
                  className="px-4 py-2 border border-rose-250 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg transition-all font-semibold flex items-center gap-1.5"
                >
                  <Trash2 size={14} />
                  Excluir Venda
                </button>
                <button 
                  onClick={() => setSelectedSale(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-all font-semibold"
                >
                  Fechar Visualização
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Exclusão */}
      {deleteId && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-sm w-full p-6 text-xs text-center space-y-4">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 text-rose-600">
              <Trash2 className="h-6 w-6" />
            </div>
            <div className="space-y-2">
              <h3 className="font-bold text-slate-800 text-sm">Remover Venda de Erro?</h3>
              <p className="text-slate-500">
                Deseja realmente excluir esta venda? Esta ação devolverá os itens de volta ao saldo de estoque e removerá os lançamentos financeiros vinculados do SGE.
              </p>
            </div>
            <div className="flex gap-2 justify-center pt-2">
              <button
                type="button"
                onClick={() => setDeleteId(null)}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg transition-all font-semibold"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => handleDelete(deleteId)}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition-all font-semibold"
              >
                Sim, Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
