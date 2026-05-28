import React, { useState } from 'react';
import { useErp } from '../context/ErpContext';
import { Search, Plus, Calendar, CheckSquare, X, Check, Landmark, UserPlus, Trash2 } from 'lucide-react';

export default function ContasReceber() {
  const { accountsReceivable, clients, addAccountReceivable, receiveReceivable, deleteAccountReceivable } = useErp();

  // Filter conditions
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Todos'); // 'Todos' | 'Pendente' | 'Recebido' | 'Atrasado'

  // Modal toggle states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [value, setValue] = useState('');
  const [status, setStatus] = useState<'Pendente' | 'Recebido' | 'Atrasado'>('Pendente');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Filter receivables list
  const filteredReceivables = accountsReceivable.filter(a => {
    const matchesSearch = a.customerName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'Todos' || a.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedVal = parseFloat(value) || 0;

    addAccountReceivable({
      customerName,
      dueDate,
      value: parsedVal,
      status
    });

    setCustomerName('');
    setDueDate('');
    setValue('');
    setStatus('Pendente');
    setIsModalOpen(false);
  };

  const [receiveConfirmId, setReceiveConfirmId] = useState<string | null>(null);

  const handleReceive = (id: string) => {
    receiveReceivable(id);
    setReceiveConfirmId(null);
  };

  const formatCurrency = (val: number) => {
    return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-101 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Contas a Receber</h1>
          <p className="text-slate-500 text-sm mt-1">Monitore parcelas faturadas, vendas em crediário, carnês e adiantamentos de clientes.</p>
        </div>
        <button 
          onClick={() => {
            setCustomerName(clients[0]?.name || 'Consumidor Final');
            setDueDate(new Date().toISOString().split('T')[0]);
            setIsModalOpen(true);
          }}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-all text-sm font-medium flex items-center gap-2 shadow-sm"
        >
          <Plus size={16} />
          Lançar Recebimento
        </button>
      </div>

      {/* Control filters bar */}
      <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:max-w-md text-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Buscar por cliente..."
            className="w-full pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-400 focus:bg-white transition-all text-slate-700"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <select 
          className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 focus:outline-none"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="Todos">Status: Todos</option>
          <option value="Pendente">Status: Pendente</option>
          <option value="Recebido">Status: Recebido</option>
          <option value="Atrasado">Status: Atrasado</option>
        </select>
      </div>

      {/* Bill Matrix Grid */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold text-xs tracking-wider uppercase">
                <th className="px-6 py-3.5">Cliente / Sacado</th>
                <th className="px-6 py-3.5">Data de Vencimento</th>
                <th className="px-6 py-3.5 text-right">Valor Líquido</th>
                <th className="px-6 py-3.5 text-center">Status</th>
                <th className="px-6 py-3.5 text-center">Dar Baixa</th>
                <th className="px-6 py-3.5 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 text-xs text-medium">
              {filteredReceivables.map((a) => (
                <tr key={a.id} className="hover:bg-slate-50 transition-all font-medium">
                  <td className="px-6 py-4">
                    <div className="font-semibold text-slate-800 text-sm">{a.customerName}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5 text-slate-500 font-medium">
                      <Calendar size={13} />
                      <span>{new Date(a.dueDate).toLocaleDateString('pt-BR')}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right font-mono font-bold text-slate-900 text-sm">
                    {formatCurrency(a.value)}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                      a.status === 'Recebido' 
                        ? 'bg-emerald-100 text-emerald-800' 
                        : a.status === 'Pendente' 
                          ? 'bg-amber-100 text-amber-800' 
                          : 'bg-rose-100 text-rose-800'
                    }`}>
                      {a.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    {a.status !== 'Recebido' ? (
                      <button
                        onClick={() => setReceiveConfirmId(a.id)}
                        className="px-2.5 py-1 bg-indigo-50 hover:bg-emerald-600 text-indigo-700 hover:text-white rounded border border-indigo-200 transition-all font-bold text-[11px] flex items-center gap-1 mx-auto"
                      >
                        <Landmark size={11} /> Baixar Título
                      </button>
                    ) : (
                      <span className="text-emerald-600 font-bold flex items-center justify-center gap-1 text-[11px]">
                        <CheckSquare size={12} /> Recebido
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button 
                      onClick={() => setDeleteId(a.id)}
                      className="p-1 px-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-all"
                      title="Excluir Título"
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredReceivables.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-400">
                    Nenhum crédito correspondente a receber.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bill program overlay modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-sm w-full overflow-hidden transition-all text-xs">
            <div className="flex justify-between items-center bg-slate-50 px-6 py-4 border-b border-slate-100">
              <h2 className="font-bold text-slate-800 text-md">Lançar Contas a Receber</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="font-semibold text-slate-600">Selecione o Cliente</label>
                <select 
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-400 text-slate-600 bg-white"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                >
                  {clients.map((c, idx) => (
                    <option key={idx} value={c.name}>{c.name}</option>
                  ))}
                  {clients.length === 0 && (
                    <option value="Cliente Não Identificado">Cliente Não Identificado</option>
                  )}
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-600">Valor Estimado (R$)</label>
                <input 
                  type="number" 
                  step="0.01"
                  required
                  placeholder="0.00"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-400 text-slate-700 font-mono text-xs"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-600">Data de Vencimento</label>
                  <input 
                    type="date" 
                    required
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-400 text-slate-605 bg-white"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-600">Status Inicial</label>
                  <select 
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-400 text-slate-605 bg-white font-semibold"
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                  >
                    <option value="Pendente">Pendente</option>
                    <option value="Atrasado">Inadimplente (Atrasado)</option>
                    <option value="Recebido">Recebido / Pago</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-4 border-t border-slate-101">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-650 rounded-lg transition-all font-semibold"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-all font-semibold flex items-center gap-1.5"
                >
                  <Landmark size={14} />
                  Gravar Recebimento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Recebimento */}
      {receiveConfirmId && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-sm w-full p-6 text-xs text-center space-y-4">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-650">
              <Landmark className="h-6 w-6 text-emerald-600" />
            </div>
            <div className="space-y-2">
              <h3 className="font-bold text-slate-800 text-sm">Baixar Duplicata / Lançamento?</h3>
              <p className="text-slate-500">
                Deseja confirmar o recebimento deste título de crédito? O caixa correspondente será acrescido.
              </p>
            </div>
            <div className="flex gap-2 justify-center pt-2">
              <button
                type="button"
                onClick={() => setReceiveConfirmId(null)}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg transition-all font-semibold"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => handleReceive(receiveConfirmId)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-all font-semibold"
              >
                Confirmar Recebimento
              </button>
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
              <h3 className="font-bold text-slate-800 text-sm">Remover Conta a Receber?</h3>
              <p className="text-slate-500">
                Deseja realmente deletar esta expectativa de direito de crédito? Esta ação é definitiva e removerá o título do sistema.
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
                onClick={async () => {
                  await deleteAccountReceivable(deleteId);
                  setDeleteId(null);
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition-all font-semibold"
              >
                Sim, Deletar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
