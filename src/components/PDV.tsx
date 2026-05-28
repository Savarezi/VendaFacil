import React, { useState } from 'react';
import { useErp } from '../context/ErpContext';
import { Product, SaleItem } from '../types';
import { Search, ShoppingCart, Plus, Minus, Trash2, CheckCircle, CreditCard, DollarSign, Tag, Users, AlertCircle, RefreshCw } from 'lucide-react';

interface CartItem {
  id: string; // `${product.id}-${format}`
  product: Product;
  quantity: number;
  format: 'unit' | 'box';
  price: number;
}

export default function PDV() {
  const { products, clients, performSale } = useErp();

  // State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todas');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [discountInput, setDiscountInput] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Pix');
  
  // Checkout success view trigger
  const [successReceipt, setSuccessReceipt] = useState<{
    id: string;
    total: number;
    payment: string;
    customer: string;
  } | null>(null);

  // Filter products for quick selection grid
  const categories = ['Todas', ...Array.from(new Set(products.map(p => p.category)))];
  
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          p.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'Todas' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Cart operations
  const addToCart = (product: Product, format: 'unit' | 'box' = 'unit') => {
    const formatLabel = format === 'box' ? 'caixa' : 'unidade';
    const priceToCharge = format === 'box' 
      ? (product.pricePerBox || product.price * (product.unitsPerBox || 12)) 
      : (product.pricePerUnit || product.price);
    const unitsNeeded = format === 'box' ? (product.unitsPerBox || 12) : 1;

    if (product.stock < unitsNeeded) {
      alert(`Aviso: Este produto não possui estoque suficiente para vender 1 ${formatLabel}!`);
      return;
    }

    setCart(prev => {
      const cartItemId = `${product.id}-${format}`;
      const existing = prev.find(item => item.id === cartItemId);
      
      // Calcular o total de unidades já reservadas no carrinho
      const totalReservedUnits = prev.reduce((sum, item) => {
        if (item.product.id === product.id) {
          const itemUnits = item.format === 'box' ? item.quantity * (item.product.unitsPerBox || 12) : item.quantity;
          return sum + itemUnits;
        }
        return sum;
      }, 0);

      if (totalReservedUnits + unitsNeeded > product.stock) {
        alert(`Limite de estoque físico atingido (${product.stock} un disponíveis).`);
        return prev;
      }

      if (existing) {
        return prev.map(item => 
          item.id === cartItemId 
            ? { ...item, quantity: item.quantity + 1 } 
            : item
        );
      }
      
      return [...prev, { 
        id: cartItemId,
        product, 
        quantity: 1, 
        format,
        price: priceToCharge
      }];
    });
  };

  const updateQty = (cartItemId: string, delta: number) => {
    setCart(prev => {
      const currentItem = prev.find(item => item.id === cartItemId);
      if (!currentItem) return prev;
      
      const targetQty = currentItem.quantity + delta;
      if (targetQty <= 0) return prev;

      const product = currentItem.product;
      const unitsPerIncrement = currentItem.format === 'box' ? (product.unitsPerBox || 12) : 1;

      // Calcular outras reservas do mesmo produto no carrinho
      const otherItemsReservedUnits = prev
        .filter(item => item.product.id === product.id && item.id !== cartItemId)
        .reduce((sum, item) => {
          const itemUnits = item.format === 'box' ? item.quantity * (item.product.unitsPerBox || 12) : item.quantity;
          return sum + itemUnits;
        }, 0);

      const computedNewReservation = otherItemsReservedUnits + (targetQty * unitsPerIncrement);

      if (computedNewReservation > product.stock) {
        alert(`Estoque máximo atingido. Limite do estoque físico: ${product.stock} un.`);
        return prev;
      }

      return prev.map(item => 
        item.id === cartItemId 
          ? { ...item, quantity: targetQty } 
          : item
      );
    });
  };

  const removeFromCart = (cartItemId: string) => {
    setCart(prev => prev.filter(item => item.id !== cartItemId));
  };

  const clearCart = () => {
    setCart([]);
    setDiscountInput('');
    setSelectedCustomerId('');
    setPaymentMethod('Pix');
  };

  // Financial Sums
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discount = parseFloat(discountInput) || 0;
  const total = Math.max(0, subtotal - discount);

  const handleCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) {
      alert('Erro: Adicione ao menos 1 item ao carrinho.');
      return;
    }

    const customer = clients.find(c => c.id === selectedCustomerId);
    const customerName = customer ? customer.name : 'Consumidor Final';

    // Build sale items array
    const saleItems: SaleItem[] = cart.map(item => ({
      productId: item.product.id,
      productName: item.product.name,
      price: item.price,
      quantity: item.quantity,
      format: item.format,
      unitsPerBox: item.product.unitsPerBox || 12
    }));

    // Trigger state changes in context
    performSale(saleItems, customerName, paymentMethod, discount);

    // Save success metadata for invoice receipt popup
    setSuccessReceipt({
      id: `VEN-${Math.floor(100+Math.random()*900)}`,
      total,
      payment: paymentMethod,
      customer: customerName
    });

    // Clear cart and checkout settings
    clearCart();
  };

  const formatCurrency = (val: number) => {
    return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const formatStockDisplay = (p: Product) => {
    if (!p.isFractional || !p.unitsPerBox || p.unitsPerBox <= 1) {
      return `${p.stock} un`;
    }
    const boxes = Math.floor(p.stock / p.unitsPerBox);
    const units = p.stock % p.unitsPerBox;
    
    const parts = [];
    if (boxes > 0) parts.push(`${boxes} cx`);
    if (units > 0) parts.push(`${units} un`);
    
    return parts.join(' e ') || '0 un';
  };

  return (
    <div className="space-y-6">
      {/* Receipts success modal popup */}
      {successReceipt && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-sm w-full p-6 text-center text-xs space-y-4">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto text-xl font-bold animate-bounce">
              <CheckCircle size={28} />
            </div>
            
            <div className="space-y-1">
              <h3 className="font-bold text-slate-800 text-lg">Cupom Não Fiscal</h3>
              <p className="text-slate-400">Venda executada com sucesso!</p>
            </div>

            <div className="border-t border-b border-dashed border-slate-200 py-3 text-left space-y-2 font-mono text-slate-600">
              <div className="flex justify-between">
                <span>Operação:</span>
                <span className="font-semibold text-slate-800">VEN-PDV-ATU</span>
              </div>
              <div className="flex justify-between">
                <span>Cliente:</span>
                <span className="font-semibold text-slate-800 truncate max-w-[150px]">{successReceipt.customer}</span>
              </div>
              <div className="flex justify-between">
                <span>F. Pagamento:</span>
                <span className="font-semibold text-slate-800">{successReceipt.payment}</span>
              </div>
              <div className="flex justify-between border-t border-dashed border-slate-200 pt-2 text-sm">
                <span>Total Pago:</span>
                <span className="font-bold text-indigo-600">{formatCurrency(successReceipt.total)}</span>
              </div>
            </div>

            <p className="text-[10px] text-slate-400">O estoque e as contas financeiras foram atualizados no sistema.</p>

            <button 
              onClick={() => setSuccessReceipt(null)}
              className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-all font-medium"
            >
              Iniciar Nova Venda
            </button>
          </div>
        </div>
      )}

      {/* Header and statistics panel placeholder */}
      <div className="flex justify-between items-center border-b border-slate-100 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">PDV Automático</h1>
          <p className="text-slate-500 text-sm mt-1">Terminal de frente de caixa rápido para atendimento ao consumidor.</p>
        </div>
        <button 
          onClick={clearCart}
          className="text-slate-500 hover:text-slate-800 flex items-center gap-1 text-xs font-semibold"
        >
          <RefreshCw size={14} />
          Limpar Cupom
        </button>
      </div>

      {/* Two column split UI layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column - Products Selection Catalog Grid (Col 7) */}
        <div className="lg:col-span-7 space-y-4">
          
          {/* Quick search & category pick controls */}
          <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1 text-xs">
              <Search size={16} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder="Pesquisar por código, descrição..."
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-400 text-slate-700 text-xs"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="flex gap-1 overflow-x-auto pb-1 sm:pb-0">
              {categories.slice(0, 4).map((cat, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all whitespace-nowrap ${
                    selectedCategory === cat 
                      ? 'bg-indigo-50 text-indigo-600 border border-indigo-200'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-500 border border-transparent'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Lista de produtos em formato de lista compacta para economizar espaço */}
          <div className="flex flex-col gap-1.5 max-h-[500px] overflow-y-auto pr-1">
            {filteredProducts.map(p => {
              const isOutOfStock = p.stock === 0;
              const totalItemsInCart = cart
                .filter(item => item.product.id === p.id)
                .reduce((sum, item) => sum + item.quantity, 0);
              const isAdded = totalItemsInCart > 0;

              return (
                <div 
                  key={p.id}
                  className={`p-2.5 bg-white rounded-lg border transition-all select-none flex items-center justify-between gap-3 relative ${
                    isOutOfStock 
                      ? 'opacity-60 bg-slate-50 border-slate-200 cursor-not-allowed'
                      : isAdded 
                        ? 'border-indigo-300 ring-1 ring-indigo-50 bg-indigo-50/5 shadow-2xs'
                        : 'border-slate-200 hover:border-indigo-250 hover:bg-slate-50/30 shadow-3xs'
                  }`}
                >
                  {/* Info Bloco à Esquerda */}
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    {/* Badge de quantidade se adicionado ao carrinho */}
                    {isAdded && (
                      <span className="bg-indigo-650 text-white font-mono text-[9px] font-extrabold px-1.5 py-0.5 rounded-full shrink-0 shadow-xs">
                        {totalItemsInCart}x
                      </span>
                    )}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[9px] text-indigo-500 font-mono tracking-wider font-extrabold bg-indigo-50 px-1.5 py-0.2 rounded shrink-0">
                          {p.code}
                        </span>
                        <span className={`px-1.5 py-0.2 rounded font-bold font-mono text-[9px] shrink-0 ${
                          isOutOfStock 
                            ? 'bg-rose-50 text-rose-500' 
                            : p.stock <= 5 
                              ? 'bg-amber-50 text-amber-600' 
                              : 'bg-slate-150 text-slate-600'
                        }`}>
                          Estoque: {formatStockDisplay(p)}
                        </span>
                      </div>
                      <h3 className="font-bold text-slate-800 text-xs truncate mt-1" title={p.name}>
                        {p.name}
                      </h3>
                    </div>
                  </div>

                  {/* Preço e Botão de Atalho à Direita */}
                  <div className="shrink-0 flex items-center gap-2.5">
                    {!p.isFractional ? (
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-900 text-xs sm:text-xs">
                          {formatCurrency(p.price)}
                        </span>
                        <button
                          disabled={isOutOfStock}
                          onClick={() => addToCart(p, 'unit')}
                          className="p-1 px-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 text-white rounded-lg transition-all flex items-center gap-1 text-[11px] font-bold cursor-pointer shadow-3xs"
                          title="Lançar unidade"
                        >
                          <Plus size={12} /> Lançar
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        {p.salesModel !== 'box_only' && (
                          <button
                            disabled={isOutOfStock}
                            onClick={() => addToCart(p, 'unit')}
                            className="px-2 py-0.5 sm:py-1 bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 text-slate-700 hover:text-indigo-605 rounded-md text-[9px] font-bold transition-all flex flex-col items-center justify-center leading-tight cursor-pointer shrink-0"
                          >
                            <span className="text-slate-400 font-normal text-[7px] uppercase">Unidade</span>
                            <span className="font-bold text-slate-800">{formatCurrency(p.pricePerUnit || p.price)}</span>
                          </button>
                        )}
                        {p.salesModel !== 'unit_only' && (
                          <button
                            disabled={isOutOfStock || p.stock < (p.unitsPerBox || 12)}
                            onClick={() => addToCart(p, 'box')}
                            className="px-2 py-0.5 sm:py-1 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 hover:border-indigo-300 text-indigo-700 rounded-md text-[9px] font-bold transition-all flex flex-col items-center justify-center leading-tight cursor-pointer shrink-0"
                            title={`Caixa com ${p.unitsPerBox || 12} unidades`}
                          >
                            <span className="text-indigo-400 font-normal text-[7px] uppercase">Caixa ({p.unitsPerBox || 12})</span>
                            <span className="font-bold text-indigo-700">{formatCurrency(p.pricePerBox || (p.price * (p.unitsPerBox || 12)))}</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            
            {filteredProducts.length === 0 && (
              <div className="text-center py-12 text-slate-400 border border-dashed border-slate-200 rounded-xl bg-slate-50">
                <AlertCircle size={24} className="mx-auto text-slate-300 mb-2" />
                <p className="text-xs">Nenhum produto cadastrado para essa busca.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Coupon / Cart & Checkout operations (Col 5) */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex flex-col justify-between min-h-[480px]">
          
          <div className="space-y-4">
            {/* Customer pick details */}
            <div className="space-y-1 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
              <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1.5">
                <Users size={12} />
                Identificar Cliente
              </label>
              <select 
                className="w-full bg-white border border-slate-200 rounded px-2.5 py-1 text-slate-600 text-xs focus:outline-none focus:border-indigo-400"
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
              >
                <option value="">Consumidor Final (Default)</option>
                {clients.map(c => (
                  <option key={c.id} value={c.id}>{c.name} ({c.document})</option>
                ))}
              </select>
            </div>

            {/* List of checkout receipt rows */}
            <div className="space-y-2">
              <h3 className="font-semibold text-slate-800 text-xs flex items-center gap-1.5">
                <ShoppingCart size={14} className="text-indigo-600" />
                Cupom Ativo ({cart.length} itens)
              </h3>
              
              <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1 text-xs divide-y divide-slate-100">
                {cart.map((item, idx) => (
                  <div key={item.id} className="flex justify-between items-center pt-2.5">
                    <div className="max-w-[65%] space-y-1">
                      <p className="font-semibold text-slate-800 truncate text-xs" title={item.product.name}>
                        {item.product.name}
                      </p>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`px-1.5 py-0.5 rounded-[4px] text-[8px] font-extrabold uppercase tracking-wider ${
                          item.format === 'box' 
                            ? 'bg-indigo-50 text-indigo-600 border border-indigo-150' 
                            : 'bg-slate-100 text-slate-600 border border-slate-150'
                        }`}>
                          {item.format === 'box' ? `Caixa (${item.product.unitsPerBox || 12} un)` : 'Unidade'}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {item.quantity} x {formatCurrency(item.price)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Quantity switcher */}
                      <div className="flex items-center border border-slate-200 rounded-lg bg-white">
                        <button 
                          type="button"
                          onClick={() => updateQty(item.id, -1)}
                          className="p-1 hover:bg-slate-50 text-slate-500 cursor-pointer"
                        >
                          <Minus size={10} />
                        </button>
                        <span className="px-1.5 font-mono font-bold text-slate-800 text-[11px]">{item.quantity}</span>
                        <button 
                          type="button"
                          onClick={() => updateQty(item.id, 1)}
                          className="p-1 hover:bg-slate-50 text-slate-500 cursor-pointer"
                        >
                          <Plus size={10} />
                        </button>
                      </div>

                      <button 
                        type="button"
                        onClick={() => removeFromCart(item.id)}
                        className="p-1 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                        title="Remover Item"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}

                {cart.length === 0 && (
                  <div className="text-center py-10 text-slate-400 space-y-1 flex flex-col items-center">
                    <ShoppingCart size={28} strokeWidth={1} className="text-slate-300" />
                    <span>O carrinho está inteiramente vazio.</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Checkout calculation and billing widgets */}
          <div className="mt-4 pt-4 border-t border-slate-100 space-y-3.5 text-xs">
            {/* Discount input & Payment choices */}
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">
                  <Tag size={11} /> Desconto R$
                </label>
                <input 
                  type="number" 
                  placeholder="0.00"
                  className="w-full bg-white border border-slate-200 rounded px-2 py-0.5 text-slate-700 text-xs font-mono focus:outline-none"
                  value={discountInput}
                  onChange={(e) => setDiscountInput(e.target.value)}
                />
              </div>

              <div className="space-y-1 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">
                  <CreditCard size={11} /> Pagamento
                </label>
                <select
                  className="w-full bg-white border border-slate-200 rounded px-2 py-0.5 text-slate-600 font-medium"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                >
                  <option value="Pix">💡 Pix (À Vista)</option>
                  <option value="Dinheiro">💵 Dinheiro (físico)</option>
                  <option value="Cartão de Crédito">💳 Crédito</option>
                  <option value="Cartão de Débito">💳 Débito</option>
                  <option value="Crediário">📑 Crediário (A prazo)</option>
                </select>
              </div>
            </div>

            {/* Sums overview */}
            <div className="space-y-1 bg-slate-50 p-3 rounded-lg border border-slate-200 font-mono text-slate-600 block text-[11px]">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-rose-600">
                <span>Desconto Aplicado:</span>
                <span>-{formatCurrency(discount)}</span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-1 text-sm font-bold text-slate-800">
                <span>Total Líquido:</span>
                <span className="text-indigo-600">{formatCurrency(total)}</span>
              </div>
            </div>

            {/* Primary validation trigger */}
            <button
              onClick={handleCheckout}
              disabled={cart.length === 0}
              className={`w-full py-2.5 rounded-lg font-semibold text-center transition-all flex items-center justify-center gap-1.5 shadow-sm text-sm ${
                cart.length === 0 
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200' 
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer'
              }`}
            >
              <DollarSign size={16} />
              Finalizar Venda (Fechar Caixa)
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
