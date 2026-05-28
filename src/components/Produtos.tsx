import React, { useState } from 'react';
import { useErp } from '../context/ErpContext';
import { Product } from '../types';
import { Search, Plus, SlidersHorizontal, Edit2, Trash2, Package, Check, X, AlertTriangle } from 'lucide-react';

export default function Produtos() {
  const { products, suppliers, addProduct, editProduct, deleteProduct } = useErp();

  // Search and Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todas');
  const [stockFilter, setStockFilter] = useState('Todos'); // 'Todos' | 'Baixo' | 'Normal'

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [category, setCategory] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [supplier, setSupplier] = useState('');

  // Novas variáveis para suporte a fracionamento
  const [isFractional, setIsFractional] = useState(false);
  const [unitsPerBox, setUnitsPerBox] = useState('12');
  const [pricePerBox, setPricePerBox] = useState('');
  const [pricePerUnit, setPricePerUnit] = useState('');
  const [salesModel, setSalesModel] = useState<'both' | 'unit_only' | 'box_only'>('both');
  
  // Tipo de venda simplificado
  const [tipoVenda, setTipoVenda] = useState<'unit_only' | 'box_only' | 'both'>('unit_only');

  // Extract unique categories for filter select dropdown
  const categories = ['Todas', ...Array.from(new Set(products.map(p => p.category)))];

  // Filtered Products List
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          p.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'Todas' || p.category === selectedCategory;
    
    let matchesStock = true;
    if (stockFilter === 'Baixo') {
      matchesStock = p.stock <= 5;
    } else if (stockFilter === 'Normal') {
      matchesStock = p.stock > 5;
    }

    return matchesSearch && matchesCategory && matchesStock;
  });

  const handleOpenModal = (p?: Product) => {
    if (p) {
      setEditingId(p.id);
      setName(p.name);
      setCode(p.code);
      setCategory(p.category);
      setPrice(p.price.toString());
      setStock(p.stock.toString());
      setSupplier(p.supplier);
      setIsFractional(p.isFractional || false);
      setUnitsPerBox((p.unitsPerBox || 12).toString());
      setPricePerBox((p.pricePerBox || p.price).toString());
      setPricePerUnit((p.pricePerUnit || p.price).toString());
      setSalesModel(p.salesModel || 'both');
      
      const currentTipo = !p.isFractional 
        ? 'unit_only' 
        : (p.salesModel === 'box_only' ? 'box_only' : 'both');
      setTipoVenda(currentTipo);
    } else {
      setEditingId(null);
      setName('');
      // Auto-generate some fancy catalog code if registering a generic product
      setCode(`PROD-${Math.floor(100 + Math.random() * 900)}`);
      setCategory('Bebidas');
      setPrice('');
      setStock('');
      setSupplier(suppliers[0]?.companyName || '');
      setIsFractional(false);
      setUnitsPerBox('12');
      setPricePerBox('');
      setPricePerUnit('');
      setSalesModel('both');
      setTipoVenda('unit_only');
    }
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    
    const parsedStock = parseInt(stock, 10) || 0;
    const uPerBox = tipoVenda === 'unit_only' ? 12 : (parseInt(unitsPerBox, 10) || 12);
    const isFrac = tipoVenda !== 'unit_only';
    const sModel = tipoVenda === 'unit_only' ? 'both' : tipoVenda;

    const parsedPricePerUnit = parseFloat(pricePerUnit) || 0;
    const parsedPricePerBox = parseFloat(pricePerBox) || 0;

    // Define standard price field used primarily for standard list rendering
    let parsedPrice = 0;
    if (tipoVenda === 'unit_only') {
      parsedPrice = parsedPricePerUnit;
    } else if (tipoVenda === 'box_only') {
      parsedPrice = parsedPricePerBox;
    } else {
      parsedPrice = parsedPricePerUnit;
    }

    const newProdData = {
      name,
      code,
      category,
      price: parsedPrice,
      stock: parsedStock,
      supplier,
      isFractional: isFrac,
      unitsPerBox: uPerBox,
      pricePerBox: isFrac ? parsedPricePerBox : 0,
      pricePerUnit: tipoVenda === 'box_only' ? 0 : parsedPricePerUnit,
      salesModel: sModel as 'both' | 'unit_only' | 'box_only'
    };

    if (editingId) {
      editProduct(editingId, newProdData);
    } else {
      addProduct(newProdData);
    }
    setIsModalOpen(false);
  };

  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleDelete = (id: string) => {
    deleteProduct(id);
    setDeleteId(null);
  };

  const formatCurrency = (val: number) => {
    return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Catálogo de Produtos</h1>
          <p className="text-slate-500 text-sm mt-1">Gerencie produtos, códigos de barras, preços de venda e níveis de estoque.</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-all text-sm font-medium flex items-center gap-2 shadow-sm"
        >
          <Plus size={16} />
          Cadastrar Produto
        </button>
      </div>

      {/* Search and Filters bar */}
      <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:max-w-md">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Buscar por nome ou código..."
            className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-400 focus:bg-white transition-all text-slate-700"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex w-full md:w-auto items-center gap-2.5 flex-wrap">
          <div className="flex items-center gap-1.5 text-slate-500 text-xs font-semibold">
            <SlidersHorizontal size={14} />
            <span>Filtros:</span>
          </div>
          
          {/* Category Filter */}
          <select 
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-600 focus:outline-none focus:border-indigo-400"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            {categories.map((c, i) => (
              <option key={i} value={c}>{c}</option>
            ))}
          </select>

          {/* Stock Filter */}
          <select 
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-600 focus:outline-none focus:border-indigo-400"
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value)}
          >
            <option value="Todos">Estoque (Todos)</option>
            <option value="Baixo">Estoque Crítico (&le; 5)</option>
            <option value="Normal">Estoque Normal (&gt; 5)</option>
          </select>
        </div>
      </div>

      {/* Products Table Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold text-xs tracking-wider uppercase">
                <th className="px-6 py-3.5">Código</th>
                <th className="px-6 py-3.5">Nome do Produto</th>
                <th className="px-6 py-3.5">Categoria</th>
                <th className="px-6 py-3.5 text-right">Preço de Venda</th>
                <th className="px-6 py-3.5 text-center">Estoque</th>
                <th className="px-6 py-3.5 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 text-xs">
              {filteredProducts.map((p) => {
                const isLowStock = p.stock <= 5;
                const isOutOfStock = p.stock === 0;

                return (
                  <tr key={p.id} className="hover:bg-slate-50 transition-all">
                    <td className="px-6 py-4 font-mono text-indigo-600 font-semibold">{p.code}</td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-800 text-sm">{p.name}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600">{p.category}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {!p.isFractional ? (
                        <span className="font-mono font-bold text-slate-900">{formatCurrency(p.price)}</span>
                      ) : (
                        <div className="font-mono text-[11px] leading-tight flex flex-col items-end">
                          {p.salesModel !== 'box_only' && (
                            <span className="font-bold text-slate-800" title="Preço unitário avulso">
                              {formatCurrency(p.pricePerUnit || p.price)} <span className="text-[10px] text-slate-400 font-normal">/un</span>
                            </span>
                          )}
                          {p.salesModel !== 'unit_only' && (
                            <span className="text-indigo-600 font-semibold" title="Preço da caixa fechada">
                              {formatCurrency(p.pricePerBox || 0)} <span className="text-[10px] text-slate-400 font-normal">/cx</span>
                            </span>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col items-center justify-center">
                        <span className={`px-2 py-1 rounded-full font-semibold font-mono text-center min-w-[50px] ${
                          isOutOfStock 
                            ? 'bg-rose-100 text-rose-700' 
                            : isLowStock 
                              ? 'bg-amber-100 text-amber-700' 
                              : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {!p.isFractional || !p.unitsPerBox || p.unitsPerBox <= 1 ? (
                            `${p.stock} un`
                          ) : (
                            <>
                              {Math.floor(p.stock / p.unitsPerBox) > 0 && `${Math.floor(p.stock / p.unitsPerBox)} cx`}
                              {Math.floor(p.stock / p.unitsPerBox) > 0 && p.stock % p.unitsPerBox > 0 && ' e '}
                              {p.stock % p.unitsPerBox > 0 && `${p.stock % p.unitsPerBox} un`}
                              {p.stock === 0 && '0 un'}
                            </>
                          )}
                        </span>
                        {isLowStock && (
                          <span className="flex items-center gap-0.5 text-[9px] text-amber-600 mt-1 font-medium">
                            <AlertTriangle size={10} /> Estoque Baixo
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button 
                          onClick={() => handleOpenModal(p)}
                          className="p-1.5 hover:bg-slate-100 rounded text-slate-500 hover:text-indigo-600 transition-all tooltip"
                          title="Editar"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button 
                          onClick={() => setDeleteId(p.id)}
                          className="p-1.5 hover:bg-slate-100 rounded text-slate-500 hover:text-rose-600 transition-all tooltip"
                          title="Excluir"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-slate-400">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <Package size={36} strokeWidth={1} />
                      <span className="text-xs">Nenhum produto correspondente encontrado.</span>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-lg w-full overflow-hidden transition-all scale-100">
            <div className="flex justify-between items-center bg-slate-50 px-6 py-4 border-b border-slate-100">
              <h2 className="font-bold text-slate-800 text-md">
                {editingId ? 'Editar Dados do Produto' : 'Cadastrar Novo Produto'}
              </h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-all"
              >
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                {/* Nome do Produto */}
                <div className="col-span-2 space-y-1">
                  <label className="font-semibold text-slate-700">Nome do Produto</label>
                  <input 
                    type="text" 
                    required
                    placeholder='Ex: Smart TV LED 4K 50"'
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-400 text-slate-700 text-xs"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>

                {/* Código de Referência */}
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Código de Referência</label>
                  <input 
                    type="text" 
                    required
                    placeholder="Ex: PROD-101"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-400 text-slate-700 text-xs"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                  />
                </div>

                {/* Categoria */}
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Categoria</label>
                  <select 
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-400 text-slate-600 bg-white text-xs"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  >
                    <option value="Bebidas">Bebidas</option>
                    <option value="Alimentos">Alimentos</option>
                    <option value="Eletrônicos">Eletrônicos</option>
                    <option value="Eletrodomésticos">Eletrodomésticos</option>
                    <option value="Informática">Informática</option>
                    <option value="Utilidades">Utilidades</option>
                    <option value="Outros">Outros</option>
                  </select>
                </div>

                {/* Estoque Inicial */}
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Estoque Inicial (unidades)</label>
                  <input 
                    type="number" 
                    required
                    placeholder="0"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-400 text-slate-700 text-xs"
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                  />
                </div>

                {/* Tipo de Venda Selector */}
                <div className="col-span-2 border-t border-slate-100 pt-3 space-y-1.5">
                  <label className="font-bold text-slate-800 text-[12px] flex items-center gap-1.5">
                    <Package size={14} className="text-indigo-600" />
                    Tipo de Venda
                  </label>
                  <p className="text-slate-400 text-[10px]">Escolha como este produto será vendido no caixa do PDV.</p>
                  
                  <select 
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-400 text-slate-700 bg-white text-xs font-medium"
                    value={tipoVenda}
                    onChange={(e) => setTipoVenda(e.target.value as any)}
                  >
                    <option value="unit_only">Apenas por Unidade</option>
                    <option value="box_only">Apenas por Caixa</option>
                    <option value="both">Unidade e Caixa (Ambos)</option>
                  </select>
                </div>

                {/* Condições e Formatação de Preço com base no Tipo de Venda */}
                <div className="col-span-2">
                  {tipoVenda === 'unit_only' && (
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs animate-fadeIn space-y-1.5">
                      <label className="font-semibold text-slate-700 block">Preço de Venda Unitário (R$)</label>
                      <input 
                        type="number" 
                        step="0.01"
                        required
                        placeholder="0.00"
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-400 text-slate-700 font-mono text-xs"
                        value={pricePerUnit}
                        onChange={(e) => setPricePerUnit(e.target.value)}
                      />
                    </div>
                  )}

                  {tipoVenda === 'box_only' && (
                    <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs animate-fadeIn">
                      <div className="space-y-1.5">
                        <label className="font-semibold text-slate-700 block">Quantidade por Caixa</label>
                        <input 
                          type="number"
                          placeholder="Ex: 12"
                          required
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-400 text-slate-700 font-mono text-xs"
                          value={unitsPerBox}
                          onChange={(e) => setUnitsPerBox(e.target.value)}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="font-semibold text-slate-700 block">Preço da Caixa (R$)</label>
                        <input 
                          type="number" 
                          step="0.01"
                          placeholder="0.00"
                          required
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-400 text-slate-700 font-mono text-xs"
                          value={pricePerBox}
                          onChange={(e) => setPricePerBox(e.target.value)}
                        />
                      </div>
                    </div>
                  )}

                  {tipoVenda === 'both' && (
                    <div className="grid grid-cols-3 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] animate-fadeIn">
                      <div className="space-y-1.5">
                        <label className="font-semibold text-slate-700 block">Quantidade por Caixa</label>
                        <input 
                          type="number"
                          placeholder="Ex: 12"
                          required
                          className="w-full px-2.5 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-400 text-slate-700 font-mono"
                          value={unitsPerBox}
                          onChange={(e) => setUnitsPerBox(e.target.value)}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="font-semibold text-slate-700 block">Preço da Caixa (R$)</label>
                        <input 
                          type="number" 
                          step="0.01"
                          placeholder="0.00"
                          required
                          className="w-full px-2.5 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-400 text-slate-700 font-mono"
                          value={pricePerBox}
                          onChange={(e) => setPricePerBox(e.target.value)}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="font-semibold text-slate-700 block text-indigo-700 font-bold">Preço Unitário (R$)</label>
                        <input 
                          type="number" 
                          step="0.01"
                          placeholder="0.00"
                          required
                          className="w-full px-2.5 py-2 bg-white border border-indigo-200 focus:border-indigo-400 rounded-lg text-slate-700 font-mono"
                          value={pricePerUnit}
                          onChange={(e) => setPricePerUnit(e.target.value)}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-4 border-t border-slate-100">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg transition-all font-medium"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-all font-medium flex items-center gap-1.5"
                >
                  <Check size={14} />
                  Salvar Produto
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
              <h3 className="font-bold text-slate-800 text-sm">Remover Produto?</h3>
              <p className="text-slate-500">
                Tem certeza de que deseja excluir este produto do catálogo? Esta ação removerá permanentemente o item do inventário do SGE.
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
                Excluir Produto
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
