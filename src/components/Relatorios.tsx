import React from 'react';
import { useErp } from '../context/ErpContext';
import { AlertTriangle, TrendingUp, DollarSign, Package, Compass, ShoppingBag, Landmark, ArrowUpRight } from 'lucide-react';
import CustomChart from './CustomChart';

export default function Relatorios() {
  const { sales, products, cashFlow } = useErp();

  // Dynamic calculations for report cards
  const formatCurrency = (val: number) => {
    return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const totalSalesVal = sales.reduce((sum, s) => sum + s.total, 0);
  const avgTicket = sales.length > 0 ? totalSalesVal / sales.length : 0;
  
  // Calculate simulated gross profit (assuming we have a 45% standard markup profit margin on sales in commerce)
  const estimatedProfit = totalSalesVal * 0.45;

  const lowStockItems = products.filter(p => p.stock <= 5);

  // Grouped products sales values list
  const pMap: { [key: string]: { name: string; qty: number; total: number; cat: string } } = {};
  sales.forEach(s => {
    s.items.forEach(item => {
      if (!pMap[item.productId]) {
        // Find category
        const catalogProd = products.find(p => p.id === item.productId);
        pMap[item.productId] = { 
          name: item.productName, 
          qty: 0, 
          total: 0, 
          cat: catalogProd ? catalogProd.category : 'Outros' 
        };
      }
      pMap[item.productId].qty += item.quantity;
      pMap[item.productId].total += item.price * item.quantity;
    });
  });

  const bestSellers = Object.values(pMap).sort((a,b) => b.qty - a.qty);

  // Dynamics: calculate real monthly revenue from last 6 months
  const monthlyRevenueData = Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (5 - i));
    const label = d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }).replace('.', '');
    
    // Sum real sales for this specific month/year
    const monthSales = sales.filter(s => {
      try {
        const saleDate = new Date(s.timestamp);
        return saleDate.getMonth() === d.getMonth() && saleDate.getFullYear() === d.getFullYear();
      } catch {
        return false;
      }
    });
    
    const value = monthSales.reduce((sum, s) => sum + s.total, 0);
    return {
      label,
      value
    };
  });

  // Dynamics: group real sales items by category dynamically
  const categoryTotals: { [category: string]: number } = {};
  
  sales.forEach(s => {
    s.items.forEach(item => {
      // Find category in products catalog
      const product = products.find(p => p.id === item.productId);
      const category = product ? product.category : 'Outros';
      const itemTotal = item.price * item.quantity;
      categoryTotals[category] = (categoryTotals[category] || 0) + itemTotal;
    });
  });

  const categoryColors = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#3b82f6', '#ef4444'];
  const categoryShareData = Object.entries(categoryTotals).map(([label, value], index) => ({
    label,
    value,
    color: categoryColors[index % categoryColors.length]
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-101 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Centro de Inteligência e Relatórios</h1>
          <p className="text-slate-500 text-sm mt-1">Gere análises de desempenho mercantil, lucros acumulados e rupturas de gôndola.</p>
        </div>
      </div>

      {/* Overview Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Faturamento Mensal */}
        <div className="bg-white p-5 rounded-xl border border-slate-205 shadow-sm space-y-1">
          <span className="text-slate-500 text-[11px] font-semibold uppercase tracking-wider block">Faturamento Acumulado</span>
          <h3 className="text-xl font-bold font-mono text-slate-800">{formatCurrency(totalSalesVal)}</h3>
          <p className="text-[10px] text-slate-400 mt-1">Soma de cupons fiscais emitidos</p>
        </div>

        {/* Card 2: Lucratividade Média */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-slate-500 text-[11px] font-semibold uppercase tracking-wider block">Lucro Bruto Estimado</span>
          <h3 className="text-xl font-bold font-mono text-emerald-600">{formatCurrency(estimatedProfit)}</h3>
          <p className="text-[10px] text-slate-400 mt-1">Média padrão de markup comercial (45%)</p>
        </div>

        {/* Card 3: Ticket Médio */}
        <div className="bg-white p-5 rounded-xl border border-slate-220 shadow-sm space-y-1">
          <span className="text-slate-500 text-[11px] font-semibold uppercase tracking-wider block">Ticket Médio</span>
          <h3 className="text-xl font-bold font-mono text-indigo-650">{formatCurrency(avgTicket)}</h3>
          <p className="text-[10px] text-slate-400 mt-1">Valor médio arrecadado por cupom</p>
        </div>

        {/* Card 4: Ruptura de Estoque */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-slate-500 text-[11px] font-semibold uppercase tracking-wider block">Ruptura / Alerta Estoque</span>
          <h3 className="text-xl font-bold font-mono text-rose-700">{lowStockItems.length} referências</h3>
          <p className="text-[10px] text-slate-400 mt-1">Substâncias críticas abaixo de 5 un</p>
        </div>
      </div>

      {/* Chart layouts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left Side: Monthly Revenue (Line Graph) */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div>
            <h3 className="font-semibold text-slate-800 text-sm">Faturamento Anual de 2026</h3>
            <p className="text-[11px] text-slate-400 leading-tight">Visualização da progressão de faturamento bruto nos últimos meses de operação comercial</p>
          </div>
          <div className="pt-2">
            <CustomChart type="line" data={monthlyRevenueData} height={200} />
          </div>
        </div>

        {/* Right Side: Category share (Bar chart) */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div>
            <h3 className="font-semibold text-slate-800 text-sm">Vendas por Divisão / Categoria</h3>
            <p className="text-[11px] text-slate-400 leading-tight">Divisão de faturamento comercial estimativo por categorias de catálogo recomendadas</p>
          </div>
          <div className="pt-2">
            <CustomChart type="bar" data={categoryShareData} height={200} />
          </div>
        </div>

      </div>

      {/* Detailed break downs: low stocks & product sales list split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left column Best Sellers (Col 7) */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
          <div className="border-b border-slate-50 pb-2">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
              <ShoppingBag size={16} className="text-indigo-600" />
              Ranqueamento Geral de Comercialização
            </h3>
            <p className="text-xs text-slate-400">Produtos ordenados em ordem decrescente de faturamento e volumes no terminal.</p>
          </div>

          <div className="space-y-2 max-h-[300px] overflow-y-auto text-xs pr-1 divide-y divide-slate-100">
            {bestSellers.map((item, idx) => (
              <div key={idx} className="flex justify-between items-center pt-2.5">
                <div className="space-y-1 max-w-[65%]">
                  <p className="font-bold text-slate-800 truncate">{item.name}</p>
                  <span className="text-[10px] bg-slate-100 text-slate-500 font-semibold px-1.5 py-0.5 rounded uppercase">
                    {item.cat}
                  </span>
                </div>
                <div className="text-right flex flex-col font-mono text-[11px]">
                  <span className="font-bold text-slate-900">{formatCurrency(item.total)}</span>
                  <span className="text-slate-400 text-[10px]">{item.qty} un de saída</span>
                </div>
              </div>
            ))}
            {bestSellers.length === 0 && (
              <div className="text-center py-10 text-slate-400 font-medium">Nenhum ranking de produtos registrado no momento.</div>
            )}
          </div>
        </div>

        {/* Right column Critical Inventory (Col 5) */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
          <div className="border-b border-slate-50 pb-2">
            <h3 className="font-bold text-rose-700 text-sm flex items-center gap-1.5">
              <AlertTriangle size={16} className="text-rose-600" />
              Alerta de Reposição Crítica
            </h3>
            <p className="text-xs text-slate-400">Lista ativa de mercadorias com quantidade menor ou igual ao estoque de segurança (5 un).</p>
          </div>

          <div className="space-y-2.5 max-h-[300px] overflow-y-auto text-xs pr-1">
            {lowStockItems.map((item, idx) => (
              <div key={idx} className="flex justify-between items-center bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                <div className="space-y-1 max-w-[70%]">
                  <p className="font-semibold text-slate-700 truncate">{item.name}</p>
                  <span className="text-[10px] text-slate-400 font-mono">Código: {item.code}</span>
                </div>
                <div className="text-right">
                  <span className={`px-2 py-0.5 rounded font-mono font-bold text-[10px] ${
                    item.stock === 0 ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
                  }`}>
                    {item.stock} un restando
                  </span>
                </div>
              </div>
            ))}
            {lowStockItems.length === 0 && (
              <div className="text-center py-10 text-slate-400">Excelente! Toda a sua gôndola de estoque está abastecida.</div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
