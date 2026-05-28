import React, { useState } from 'react';
import { useErp } from '../context/ErpContext';
import { 
  Search, Plus, Calendar, CheckSquare, Clock, AlertCircle, 
  Trash2, X, Check, ArrowRightLeft, Building, FileText, 
  Layers, PlusCircle, PieChart, Info 
} from 'lucide-react';

const defaultCategories = [
  'Fornecedores', 
  'Aluguel', 
  'Água', 
  'Luz', 
  'Internet', 
  'Salários', 
  'Impostos', 
  'Manutenção', 
  'Transporte', 
  'Outros'
];

export default function ContasPagar() {
  const { 
    accountsPayable, 
    suppliers, 
    addAccountPayable, 
    payPayable, 
    deleteAccountPayable 
  } = useErp();

  // Search/Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('Todos');
  const [expenseTypeFilter, setExpenseTypeFilter] = useState('Todos'); // 'Todos' | 'fixed' | 'variable'
  const [statusFilter, setStatusFilter] = useState('Todos'); // 'Todos' | 'Pendente' | 'Pago' | 'Atrasado'

  // Categories persistence list
  const [categories, setCategories] = useState<string[]>(() => {
    const saved = localStorage.getItem('sge_payable_categories');
    return saved ? JSON.parse(saved) : defaultCategories;
  });
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isAddingCategory, setIsAddingCategory] = useState(false);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [supplierName, setSupplierName] = useState('Fornecedor Avulso');
  const [isCustomSupplier, setIsCustomSupplier] = useState(false);
  const [customSupplierName, setCustomSupplierName] = useState('');
  const [category, setCategory] = useState('Fornecedores');
  const [expenseType, setExpenseType] = useState<'fixed' | 'variable'>('variable');
  const [dueDate, setDueDate] = useState('');
  const [value, setValue] = useState('');
  const [status, setStatus] = useState<'Pendente' | 'Pago' | 'Atrasado'>('Pendente');
  const [description, setDescription] = useState('');

  // Confirmation modally states
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [payConfirmId, setPayConfirmId] = useState<string | null>(null);

  // Add dynamic custom category
  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newCategoryName.trim();
    if (!trimmed) return;
    
    // Normalize casing for unique checking
    if (categories.some(c => c.toLowerCase() === trimmed.toLowerCase())) {
      alert('Esta categoria já existe!');
      return;
    }
    
    const updated = [...categories, trimmed];
    setCategories(updated);
    localStorage.setItem('sge_payable_categories', JSON.stringify(updated));
    setNewCategoryName('');
    setIsAddingCategory(false);
  };

  // Create account payable
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedVal = parseFloat(value) || 0;
    const finalSupplierName = isCustomSupplier ? customSupplierName.trim() : supplierName;

    if (!finalSupplierName) {
      alert('Por favor, defina o Credor / Emitente!');
      return;
    }

    addAccountPayable({
      supplierName: finalSupplierName,
      dueDate,
      value: parsedVal,
      status,
      category,
      expenseType,
      description: description.trim()
    });

    // Reset Form
    setSupplierName(suppliers[0]?.companyName || 'Fornecedor Avulso');
    setCustomSupplierName('');
    setIsCustomSupplier(false);
    setDueDate(new Date().toISOString().split('T')[0]);
    setValue('');
    setStatus('Pendente');
    setCategory('Fornecedores');
    setExpenseType('variable');
    setDescription('');
    setIsModalOpen(false);
  };

  const handlePay = (id: string) => {
    payPayable(id);
    setPayConfirmId(null);
  };

  const formatCurrency = (val: number) => {
    return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  // Helper mapping category icons dynamically
  const getCategoryIcon = (categoryName: string) => {
    switch (categoryName.toLowerCase()) {
      case 'aluguel':
        return <Building size={12} className="text-blue-500" />;
      case 'água':
      case 'agua':
        return <AlertCircle size={12} className="text-sky-500" />;
      case 'luz':
      case 'energia':
        return <Clock size={12} className="text-amber-500" />;
      case 'internet':
      case 'telefonia':
        return <PlusCircle size={12} className="text-purple-500" />;
      case 'salários':
      case 'salarios':
      case 'folha':
        return <CheckSquare size={12} className="text-emerald-500" />;
      case 'impostos':
      case 'taxas':
        return <FileText size={12} className="text-rose-500" />;
      case 'transporte':
      case 'frete':
        return <ArrowRightLeft size={12} className="text-cyan-500" />;
      case 'fornecedores':
        return <Layers size={12} className="text-indigo-500" />;
      default:
        return <Layers size={12} className="text-slate-500" />;
    }
  };

  // Evaluate due status labels
  const getDueDateStatus = (dueDateStr: string, status: string) => {
    if (status === 'Pago') {
      return { 
        label: 'Quitada', 
        color: 'text-emerald-600 bg-emerald-50 border-emerald-100', 
        icon: 'check' 
      };
    }
    
    const today = new Date();
    today.setHours(0,0,0,0);
    const dueDate = new Date(dueDateStr);
    dueDate.setHours(0,0,0,0);
    
    // Difference in milliseconds to calendar days
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return { 
        label: `Atrasada há ${Math.abs(diffDays)} ${Math.abs(diffDays) === 1 ? 'dia' : 'dias'}`, 
        color: 'text-rose-600 bg-rose-50 border-rose-100 font-bold', 
        icon: 'alert' 
      };
    } else if (diffDays === 0) {
      return { 
        label: 'Vence HOJE!', 
        color: 'text-amber-600 bg-amber-50 border-amber-200 font-bold animate-pulse', 
        icon: 'clock' 
      };
    } else if (diffDays <= 3) {
      return { 
        label: `Vence em ${diffDays} ${diffDays === 1 ? 'dia' : 'dias'}`, 
        color: 'text-amber-600 bg-amber-50 border-amber-100', 
        icon: 'calendar' 
      };
    } else {
      return { 
        label: `Vence em ${diffDays} dias`, 
        color: 'text-slate-500 bg-slate-50 border-slate-100', 
        icon: 'calendar' 
      };
    }
  };

  // Filter accounts
  const filteredPayables = accountsPayable.filter(a => {
    const textToMatch = `${a.supplierName} ${a.description || ''} ${a.category || ''}`.toLowerCase();
    const matchesSearch = textToMatch.includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'Todos' || a.category === categoryFilter;
    const matchesExpenseType = expenseTypeFilter === 'Todos' || a.expenseType === expenseTypeFilter;
    const matchesStatus = statusFilter === 'Todos' || a.status === statusFilter;
    return matchesSearch && matchesCategory && matchesExpenseType && matchesStatus;
  });

  // Sum statistics
  const pendingAccounts = accountsPayable.filter(a => a.status !== 'Pago');
  const paidAccounts = accountsPayable.filter(a => a.status === 'Pago');

  const totalPending = pendingAccounts.reduce((sum, a) => sum + a.value, 0);
  const totalPaid = paidAccounts.reduce((sum, a) => sum + a.value, 0);
  const totalFixed = accountsPayable.filter(a => a.expenseType === 'fixed').reduce((sum, a) => sum + a.value, 0);
  const totalVariable = accountsPayable.filter(a => a.expenseType === 'variable').reduce((sum, a) => sum + a.value, 0);

  // Group by category to generate dynamic distribution reports
  const categoryTotals: Record<string, number> = {};
  let totalReportExpenses = 0;

  accountsPayable.forEach(a => {
    const cat = a.category || 'Fornecedores';
    categoryTotals[cat] = (categoryTotals[cat] || 0) + a.value;
    totalReportExpenses += a.value;
  });

  const sortedCategoryTotals = Object.entries(categoryTotals).map(([name, val]) => ({
    name,
    value: val,
    percent: totalReportExpenses > 0 ? (val / totalReportExpenses) * 100 : 0
  })).sort((a, b) => b.value - a.value);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-101 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Contas a Pagar</h1>
          <p className="text-slate-500 text-sm mt-1">
            Lance duplicatas, faturas, aluguel, salários, contas recorrentes de consumo e classifique despesas.
          </p>
        </div>
        <button 
          onClick={() => {
            setSupplierName(suppliers[0]?.companyName || 'Fornecedor Avulso');
            setDueDate(new Date().toISOString().split('T')[0]);
            setIsCustomSupplier(false);
            setIsModalOpen(true);
          }}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-all text-sm font-semibold flex items-center gap-2 shadow-sm cursor-pointer"
        >
          <Plus size={16} />
          Programar Lançamento
        </button>
      </div>

      {/* Corporate Summary Indicators */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-medium">
        {/* Card 1: Open Balance */}
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs space-y-1.5 flex flex-col justify-center">
          <div className="flex items-center gap-1.5 text-amber-600 font-bold">
            <Clock size={14} />
            <span className="uppercase tracking-wider text-[9px]">Saldo Pendente</span>
          </div>
          <span className="text-xl font-bold text-slate-800 font-mono">
            {formatCurrency(totalPending)}
          </span>
          <p className="text-slate-400 text-[9px]">Obrigações operacionais em aberto.</p>
        </div>

        {/* Card 2: Fixed Expenses */}
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs space-y-1.5 flex flex-col justify-center">
          <div className="flex items-center gap-1.5 text-blue-600 font-bold">
            <Building size={14} />
            <span className="uppercase tracking-wider text-[9px]">Despesas Fixas</span>
          </div>
          <span className="text-xl font-bold text-slate-800 font-mono">
            {formatCurrency(totalFixed)}
          </span>
          <p className="text-slate-400 text-[9px]">Custos estruturais e aluguéis.</p>
        </div>

        {/* Card 3: Variable Expenses */}
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs space-y-1.5 flex flex-col justify-center">
          <div className="flex items-center gap-1.5 text-pink-600 font-bold">
            <Layers size={14} />
            <span className="uppercase tracking-wider text-[9px]">Despesas Variáveis</span>
          </div>
          <span className="text-xl font-bold text-slate-800 font-mono">
            {formatCurrency(totalVariable)}
          </span>
          <p className="text-slate-400 text-[9px]">Consumos, impostos e fardos.</p>
        </div>

        {/* Card 4: Overdue counts */}
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs space-y-1.5 flex flex-col justify-center">
          <div className="flex items-center gap-1.5 text-emerald-600 font-bold">
            <CheckSquare size={14} />
            <span className="uppercase tracking-wider text-[9px]">Total Liquidado</span>
          </div>
          <span className="text-xl font-bold text-slate-800 font-mono">
            {formatCurrency(totalPaid)}
          </span>
          <p className="text-slate-400 text-[9px]">Histórico de saídas pagas / baixas.</p>
        </div>
      </div>

      {/* Advanced Filtering Control Center */}
      <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between text-xs font-semibold">
        <div className="relative w-full md:max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Buscar por credor, notas..."
            className="w-full pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-400 focus:bg-white transition-all text-slate-700 text-xs"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap gap-2.5 w-full md:w-auto items-center justify-end">
          {/* Categoria despesa */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 text-[10px] font-bold">Classificação:</span>
            <select 
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-650 focus:outline-none text-xs"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="Todos">Todas Categorias</option>
              {categories.map((cat, idx) => (
                <option key={idx} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Regime fixa/variavel */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 text-[10px] font-bold">Regime:</span>
            <select 
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-650 focus:outline-none text-xs"
              value={expenseTypeFilter}
              onChange={(e) => setExpenseTypeFilter(e.target.value)}
            >
              <option value="Todos">Fixas e Variáveis</option>
              <option value="fixed">Apenas Regime Fixo</option>
              <option value="variable">Apenas Regime Variável</option>
            </select>
          </div>

          {/* Liquidacao status */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 text-[10px] font-bold">Status:</span>
            <select 
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-650 focus:outline-none text-xs"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="Todos">Todos</option>
              <option value="Pendente">Pendentes</option>
              <option value="Pago">Quitados (Pagos)</option>
              <option value="Atrasado">Inadimplentes</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Grid: Left List (70%) & Right Report/Manager (30%) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left column - Operations Matrix list */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold tracking-wider uppercase text-[10px]">
                    <th className="px-6 py-3.5">Credor / Lançamento</th>
                    <th className="px-6 py-3.5">Classificação</th>
                    <th className="px-6 py-3.5">Vencimento</th>
                    <th className="px-6 py-3.5 text-right">Valor</th>
                    <th className="px-6 py-3.5 text-center">Dar Baixa</th>
                    <th className="px-6 py-3.5 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredPayables.map((a) => {
                    const dueStatus = getDueDateStatus(a.dueDate, a.status);
                    return (
                      <tr key={a.id} className="hover:bg-slate-50 transition-all font-medium">
                        {/* Credor and Notes */}
                        <td className="px-6 py-4">
                          <div className="flex flex-col space-y-0.5">
                            <span className="font-bold text-slate-800 text-sm">{a.supplierName}</span>
                            {a.description ? (
                              <span className="text-[10px] text-slate-400 italic font-mono max-w-[200px] truncate" title={a.description}>
                                {a.description}
                              </span>
                            ) : (
                              <span className="text-[9px] text-slate-350 italic">Sem observações</span>
                            )}
                          </div>
                        </td>

                        {/* Category & Fixed Tag */}
                        <td className="px-6 py-4 space-y-1">
                          <div className="flex flex-col items-start gap-1">
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-100 text-slate-650 border border-slate-150 font-bold text-[9px] uppercase tracking-wide">
                              {getCategoryIcon(a.category || 'Fornecedores')}
                              {a.category || 'Fornecedores'}
                            </span>
                            {a.expenseType === 'fixed' ? (
                              <span className="px-1.5 py-0.2 rounded text-[8px] uppercase tracking-wider font-extrabold bg-blue-50 text-blue-600 border border-blue-150">Fixo</span>
                            ) : (
                              <span className="px-1.5 py-0.2 rounded text-[8px] uppercase tracking-wider font-extrabold bg-pink-50 text-pink-600 border border-pink-150">Variável</span>
                            )}
                          </div>
                        </td>

                        {/* Date due */}
                        <td className="px-6 py-4">
                          <div className="flex flex-col space-y-0.5">
                            <div className="flex items-center gap-1 text-slate-500 font-semibold font-mono text-[10px]">
                              <Calendar size={11} />
                              <span>{new Date(a.dueDate).toLocaleDateString('pt-BR')}</span>
                            </div>
                            <span className={`inline-block text-[8px] font-extrabold px-1.5 py-0.2 rounded border w-max uppercase ${dueStatus.color}`}>
                              {dueStatus.label}
                            </span>
                          </div>
                        </td>

                        {/* Financial Value */}
                        <td className="px-6 py-4 text-right font-mono font-bold text-slate-900 text-sm">
                          {formatCurrency(a.value)}
                        </td>

                        {/* Confirm pay trigger */}
                        <td className="px-6 py-4 text-center">
                          {a.status !== 'Pago' ? (
                            <button
                              onClick={() => setPayConfirmId(a.id)}
                              className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white rounded border border-indigo-200 transition-all font-semibold text-[10px] flex items-center gap-1 mx-auto cursor-pointer shadow-xs"
                            >
                              <Check size={11} /> Quitar
                            </button>
                          ) : (
                            <span className="text-emerald-600 font-extrabold flex items-center justify-center gap-1 text-[10px] uppercase tracking-wide">
                              <CheckSquare size={12} className="text-emerald-500" /> Liquidado
                            </span>
                          )}
                        </td>

                        {/* Delete account */}
                        <td className="px-6 py-4 text-center">
                          <button 
                            onClick={() => setDeleteId(a.id)}
                            className="p-1 px-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-all cursor-pointer"
                            title="Excluir de Vez"
                          >
                            <Trash2 size={13} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredPayables.length === 0 && (
                    <tr>
                      <td colSpan={6} className="text-center py-10 text-slate-400 font-medium">
                        Nenhuma duplicata ou conta programada corresponde aos filtros definidos.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right column - Reports distributions & custom category additions (30%) */}
        <div className="space-y-6">
          
          {/* Expenditure categories distribution reports */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
            <div className="flex justify-between items-center pb-2.5 border-b border-slate-100">
              <h2 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                <PieChart size={15} className="text-indigo-600 animate-spin-slow" />
                Relatório de Classificação de Custos
              </h2>
            </div>
            
            <p className="text-slate-400 text-[10px] leading-relaxed">
              Resumo automatizado do rateio orçamentário histórico de duplicatas e faturas.
            </p>

            {sortedCategoryTotals.length === 0 ? (
              <p className="text-center py-6 text-slate-400 text-[10px]">Sem dados de despesa lançados.</p>
            ) : (
              <div className="space-y-3.5 pt-1.5">
                {sortedCategoryTotals.map((item, idx) => (
                  <div key={idx} className="space-y-1 text-[11px]">
                    <div className="flex justify-between text-[10px] font-bold text-slate-600">
                      <span className="flex items-center gap-1">
                        {getCategoryIcon(item.name)}
                        {item.name}
                      </span>
                      <span className="font-mono text-slate-800">
                        {formatCurrency(item.value)} <span className="text-slate-400 font-normal">({item.percent.toFixed(0)}%)</span>
                      </span>
                    </div>
                    {/* Linear Progress Bar */}
                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div 
                        className="bg-indigo-600 h-1.5 rounded-full transition-all duration-500" 
                        style={{ width: `${item.percent}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Custom categories manager box */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
            <div className="flex justify-between items-center pb-2.5 border-b border-slate-101">
              <h2 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                <Layers size={14} className="text-indigo-600" />
                Criar Nova Classificação / Tipo
              </h2>
              <span className="text-[10px] font-mono text-indigo-700 font-extrabold bg-indigo-50 px-1.5 py-0.5 rounded-full">
                {categories.length} no total
              </span>
            </div>

            <p className="text-slate-400 text-[10px] leading-relaxed">
              Seu negócio possui custos singulares? Insira abaixo novas classificações customizadas para programar faturas sob medida.
            </p>

            {isAddingCategory ? (
              <form onSubmit={handleAddCategory} className="space-y-2 text-[11px] animate-fadeIn">
                <input 
                  type="text" 
                  required
                  placeholder="Ex: Marketing, Manutenção TI, Seguros"
                  className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-slate-755 placeholder-slate-400 focus:outline-none focus:border-indigo-400 bg-white"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                />
                <div className="flex gap-1.5 justify-end">
                  <button 
                    type="button"
                    onClick={() => {
                      setIsAddingCategory(false);
                      setNewCategoryName('');
                    }}
                    className="px-2.5 py-1 border border-slate-250 rounded text-[10px] font-bold text-slate-500 hover:bg-slate-50"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-[10px] font-bold"
                  >
                    Adicionar
                  </button>
                </div>
              </form>
            ) : (
              <button 
                onClick={() => setIsAddingCategory(true)}
                className="w-full py-1.5 bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 text-slate-700 hover:text-indigo-600 rounded-lg text-[10px] font-bold transition-all flex items-center justify-center gap-1 cursor-pointer"
              >
                <Plus size={12} /> Personalizar Classificação
              </button>
            )}

            {/* List tags */}
            <div className="flex flex-wrap gap-1.5 pt-1.5">
              {categories.map((cat, idx) => (
                <span 
                  key={idx}
                  className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 rounded-full text-[9px] font-bold transition-colors cursor-default"
                >
                  {getCategoryIcon(cat)}
                  {cat}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bill creation / Scheduling modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-sm w-full overflow-hidden transition-all text-xs">
            <div className="flex justify-between items-center bg-slate-50 px-6 py-4 border-b border-slate-101">
              <h2 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                <Calendar size={14} className="text-indigo-600" />
                Programar Obrigações / Títulos
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X size={16} />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="p-6 space-y-4">
              
              {/* Custom / Standard Creditor Selector */}
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="font-semibold text-slate-600">Credor / Emitente</label>
                  <button 
                    type="button"
                    onClick={() => setIsCustomSupplier(!isCustomSupplier)}
                    className="text-indigo-600 hover:text-indigo-700 font-bold text-[10px] underline cursor-pointer"
                  >
                    {isCustomSupplier ? 'Selecionar cadastrado' : 'Digitar credor avulso'}
                  </button>
                </div>
                
                {isCustomSupplier ? (
                  <input 
                    type="text"
                    required
                    placeholder="Ex: Companhia de Saneamento, Imobiliária Aliança"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-400 text-slate-700 bg-white"
                    value={customSupplierName}
                    onChange={(e) => setCustomSupplierName(e.target.value)}
                  />
                ) : (
                  <select 
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-400 text-slate-650 bg-white"
                    value={supplierName}
                    onChange={(e) => setSupplierName(e.target.value)}
                  >
                    {suppliers.map((s, idx) => (
                      <option key={idx} value={s.companyName}>{s.companyName}</option>
                    ))}
                    <option value="Fornecedor Avulso">Fornecedor Avulso / Serviços</option>
                  </select>
                )}
              </div>

              {/* Classificacao / Categoria */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-600">Classificação</label>
                  <select 
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-400 text-slate-650 bg-white text-xs"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  >
                    {categories.map((cat, idx) => (
                      <option key={idx} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                {/* Tipo despesa Regime */}
                <div className="space-y-1">
                  <label className="font-semibold text-slate-600">Regime Financeiro</label>
                  <select 
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-400 text-slate-650 bg-white text-xs font-bold"
                    value={expenseType}
                    onChange={(e) => setExpenseType(e.target.value as any)}
                  >
                    <option value="variable">Variável (Pontual)</option>
                    <option value="fixed">Fixo (Mensalidade)</option>
                  </select>
                </div>
              </div>

              {/* Valor do Titulo */}
              <div className="space-y-1">
                <label className="font-semibold text-slate-600">Valor Imputado (R$)</label>
                <input 
                  type="number" 
                  step="0.01"
                  required
                  placeholder="0.00"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-400 text-slate-700 font-mono"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                />
              </div>

              {/* Data Vencimento e Status */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-600">Data de Vencimento</label>
                  <input 
                    type="date" 
                    required
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-400 text-slate-600 bg-white text-xs"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-600">Status Inicial</label>
                  <select 
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-400 text-slate-600 bg-white text-xs font-semibold"
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                  >
                    <option value="Pendente">Pendente</option>
                    <option value="Atrasado">Atrasada</option>
                    <option value="Pago">Quitada (Pago)</option>
                  </select>
                </div>
              </div>

              {/* Descricao / Referência */}
              <div className="space-y-1">
                <label className="font-semibold text-slate-600">Observações / Historico descritivo</label>
                <input 
                  type="text" 
                  placeholder="Ex: ref. ao mês de Maio, boleto CEF..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-400 text-slate-700"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              {/* Modal Buttons */}
              <div className="flex gap-2 justify-end pt-4 border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg transition-all font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-all font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Plus size={14} />
                  Programar Lançamento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation pay click Modal Popup */}
      {payConfirmId && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-sm w-full p-6 text-xs text-center space-y-4">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
              <Check className="h-6 w-6" />
            </div>
            <div className="space-y-1.5">
              <h3 className="font-bold text-slate-800 text-sm">Liquidar Obrigação Financeira?</h3>
              <p className="text-slate-400">
                Ao quitar esta duplicata, ela será marcada como **Paga** no sistema de contas e uma saída ("Saída") correspondente será debitada no seu Fluxo de Caixa.
              </p>
            </div>
            <div className="flex gap-2 justify-center pt-2">
              <button
                type="button"
                onClick={() => setPayConfirmId(null)}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg transition-all font-semibold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => handlePay(payConfirmId)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-all font-semibold cursor-pointer shadow-xs"
              >
                Sim, Marcar Pago
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation delete click Modal Popup */}
      {deleteId && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-sm w-full p-6 text-xs text-center space-y-4">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 text-rose-600">
              <Trash2 className="h-6 w-6" />
            </div>
            <div className="space-y-1.5">
              <h3 className="font-bold text-slate-800 text-sm">Remover Lançamento de Conta?</h3>
              <p className="text-slate-400">
                Deseja de fato excluir definitivamente esta duplicata? Esta ação é irreversível e removerá todos os dados do SGE.
              </p>
            </div>
            <div className="flex gap-2 justify-center pt-2">
              <button
                type="button"
                onClick={() => setDeleteId(null)}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg transition-all font-medium cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={async () => {
                  await deleteAccountPayable(deleteId);
                  setDeleteId(null);
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition-all font-semibold cursor-pointer shadow-xs"
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
