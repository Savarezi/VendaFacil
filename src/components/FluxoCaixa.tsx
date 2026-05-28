import React, { useState } from 'react';
import { useErp } from '../context/ErpContext';
import { Plus, Search, ArrowUpCircle, ArrowDownCircle, DollarSign, Calendar, TrendingUp, X, Check, Trash2 } from 'lucide-react';
import CustomChart from './CustomChart';

export default function FluxoCaixa() {
  const { cashFlow, addCashFlow, deleteCashFlow } = useErp();

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('Todos'); // 'Todos' | 'Entrada' | 'Saída'

  // Modal form states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [description, setDescription] = useState('');
  const [type, setType] = useState<'Entrada' | 'Saída'>('Entrada');
  const [value, setValue] = useState('');
  const [category, setCategory] = useState('Outros');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Dynamic calculations
  const entradasTotal = cashFlow.filter(c => c.type === 'Entrada').reduce((sum, c) => sum + c.value, 0);
  const saidasTotal = cashFlow.filter(c => c.type === 'Saída').reduce((sum, c) => sum + c.value, 0);
  const netBalance = entradasTotal - saidasTotal;

  const filteredFlow = cashFlow.filter(c => {
    const matchesSearch = c.description.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          c.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'Todos' || c.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedVal = parseFloat(value) || 0;

    addCashFlow({
      type,
      description,
      value: parsedVal,
      category
    });

    // Reset Form
    setDescription('');
    setValue('');
    setCategory('Outros');
    setIsModalOpen(false);
  };

  // Convert cash flow logs into simple line graph points for custom visualization dynamically
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d;
  });

  const groupPoints = days.map((d, i) => {
    const targetDateStr = d.toISOString().split('T')[0];
    
    // Find cash flow entries matching this date
    const dayEntries = cashFlow.filter(cf => {
      try {
        const cfDateStr = new Date(cf.timestamp).toISOString().split('T')[0];
        return cfDateStr === targetDateStr;
      } catch {
        return false;
      }
    });

    const dayEntradas = dayEntries.filter(cf => cf.type === 'Entrada').reduce((sum, cf) => sum + cf.value, 0);
    const daySaidas = dayEntries.filter(cf => cf.type === 'Saída').reduce((sum, cf) => sum + cf.value, 0);
    
    const isToday = i === 6;
    let value = dayEntradas - daySaidas;
    
    // Make it 100% dynamic without fictitious mock seeds
    value = Math.max(0, value);

    const label = d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }) + (isToday ? ' (Hoje)' : '');
    
    return {
      label,
      value
    };
  });

  const formatCurrency = (val: number) => {
    return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Fluxo de Caixa</h1>
          <p className="text-slate-500 text-sm mt-1">Controle o caixa operacional diário. Monitore receitas, despesas e faturamento.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-all text-sm font-medium flex items-center gap-2 shadow-sm"
        >
          <Plus size={16} />
          Lançamento Manual
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Entradas */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between hover:border-emerald-200 transition-all">
          <div className="space-y-1">
            <span className="text-slate-500 text-xs font-semibold">Total de Entradas</span>
            <h3 className="text-xl font-mono font-bold text-emerald-600">{formatCurrency(entradasTotal)}</h3>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-full">
            <ArrowUpCircle size={22} />
          </div>
        </div>

        {/* Saídas */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between hover:border-rose-200 transition-all">
          <div className="space-y-1">
            <span className="text-slate-500 text-xs font-semibold">Total de Saídas</span>
            <h3 className="text-xl font-mono font-bold text-rose-600">{formatCurrency(saidasTotal)}</h3>
          </div>
          <div className="p-3 bg-rose-50 text-rose-600 rounded-full">
            <ArrowDownCircle size={22} />
          </div>
        </div>

        {/* Saldo Líquido */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between hover:border-indigo-200 transition-all">
          <div className="space-y-1">
            <span className="text-slate-500 text-xs font-semibold">Saldo de Caixa Disponível</span>
            <h3 className={`text-xl font-mono font-bold ${netBalance >= 0 ? 'text-indigo-600' : 'text-rose-700'}`}>{formatCurrency(netBalance)}</h3>
          </div>
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-full">
            <DollarSign size={22} />
          </div>
        </div>
      </div>

      {/* Chart and Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 col - Chart */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm lg:col-span-2 space-y-4">
          <div>
            <h3 className="font-semibold text-slate-800 text-sm">Visualização de Saldos Acumulados</h3>
            <p className="text-xs text-slate-400">Mudanças líquidas do caixa financeiro por ciclo diário</p>
          </div>
          <div className="pt-2">
            <CustomChart type="bar" data={groupPoints} height={200} />
          </div>
        </div>

        {/* Right column - Filtering and Recent logs */}
        <div className="lg:col-span-1 space-y-4 flex flex-col">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm grow space-y-4">
            <div className="border-b border-slate-50 pb-2">
              <h3 className="font-semibold text-slate-800 text-sm">Controle de Pesquisa</h3>
              <p className="text-xs text-slate-400">Classifique e rastreie movimentações</p>
            </div>
            
            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-500">Filtrar por Descrição / Tag</label>
                <div className="relative text-xs">
                  <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    type="text" 
                    placeholder="Ex: Aluguel, Venda, Samsung"
                    className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-400 text-slate-700"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-500">Filtrar Categoria</label>
                <select 
                  className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-600"
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                >
                  <option value="Todos">Todas as Transações</option>
                  <option value="Entrada">Apenas Receitas (Entradas)</option>
                  <option value="Saída">Apenas Despesas (Saídas)</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Movement Table List */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h3 className="font-bold text-slate-800 text-sm">Extrato de Movimentações Recentes</h3>
          <span className="text-[10px] bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded font-mono text-indigo-700 font-semibold">{filteredFlow.length} registros</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100 text-slate-400 font-semibold text-[10px] tracking-wider uppercase">
                <th className="px-6 py-3">Tipo</th>
                <th className="px-6 py-3">Lançamento / Descrição</th>
                <th className="px-6 py-3">Data</th>
                <th className="px-6 py-3">Categoria</th>
                <th className="px-6 py-3 text-right">Valor</th>
                <th className="px-6 py-3 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 text-xs">
              {filteredFlow.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50 transition-all font-medium">
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-bold text-[10px] ${
                      c.type === 'Entrada' 
                        ? 'bg-emerald-50 text-emerald-700' 
                        : 'bg-rose-50 text-rose-700'
                    }`}>
                      {c.type === 'Entrada' ? 'Entrada (+)' : 'Saída (-)'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-800 font-bold">{c.description}</td>
                  <td className="px-6 py-4 text-slate-500 font-mono font-normal">
                    {new Date(c.timestamp).toLocaleDateString('pt-BR')} {new Date(c.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-semibold text-[10px]">{c.category}</span>
                  </td>
                  <td className={`px-6 py-4 text-right font-mono font-bold text-sm ${
                    c.type === 'Entrada' ? 'text-emerald-600' : 'text-rose-600'
                  }`}>
                    {c.type === 'Entrada' ? '+' : '-'}{formatCurrency(c.value)}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button 
                      onClick={() => setDeleteId(c.id)}
                      className="p-1 px-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-all"
                      title="Excluir Lançamento"
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredFlow.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-400">
                    Nenhuma movimentação de caixa encontrada.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manual Lançamento Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-sm w-full overflow-hidden transition-all text-xs">
            <div className="flex justify-between items-center bg-slate-50 px-6 py-4 border-b border-slate-100">
              <h2 className="font-bold text-slate-800 text-md">Lançamento de Caixa Manual</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="font-semibold text-slate-600">Tipo de Fluxo</label>
                <div className="grid grid-cols-2 gap-2">
                  <button 
                    type="button"
                    onClick={() => setType('Entrada')}
                    className={`p-2 rounded-lg font-semibold text-center transition-all ${
                      type === 'Entrada' 
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-300 ring-2 ring-emerald-50' 
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-500 border border-slate-200'
                    }`}
                  >
                    Entrada (+)
                  </button>
                  <button 
                    type="button"
                    onClick={() => setType('Saída')}
                    className={`p-2 rounded-lg font-semibold text-center transition-all ${
                      type === 'Saída' 
                        ? 'bg-rose-50 text-rose-700 border border-rose-300 ring-2 ring-rose-50' 
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-500 border border-slate-200'
                    }`}
                  >
                    Saída (-)
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-600">Descrição do Lançamento</label>
                <input 
                  type="text" 
                  required
                  placeholder="Ex: Pagamento internet, Tarifa bancária..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-400 text-slate-700"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-600">Valor (R$)</label>
                  <input 
                    type="number" 
                    step="0.01"
                    required
                    placeholder="0.00"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-400 text-slate-700"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-600">Categoria</label>
                  <select 
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-400 text-slate-600 bg-white"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  >
                    <option value="Utilidades">Utilidades (Água, Luz)</option>
                    <option value="Fornecedores">Fornecedores</option>
                    <option value="Impostos">Impostos / Taxas</option>
                    <option value="Aluguel">Aluguel / Logística</option>
                    <option value="Vendas">Vendas</option>
                    <option value="Outros">Outros Extras</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-4 border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg transition-all font-semibold"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-all font-semibold flex items-center gap-1.5"
                >
                  <Check size={14} />
                  Confirmar Lançamento
                </button>
              </div>
            </form>
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
              <h3 className="font-bold text-slate-800 text-sm">Remover Lançamento de Caixa?</h3>
              <p className="text-slate-500 text-xs">
                Deseja realmente deletar este registro de movimentação de caixa? Esta ação é definitiva e removerá este histórico financeiro do sistema.
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
                  await deleteCashFlow(deleteId);
                  setDeleteId(null);
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition-all font-semibold"
              >
                Confirmar Exclusão
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
