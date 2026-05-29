import React, { useState, useEffect } from 'react';
import { ErpProvider, useErp } from './context/ErpContext';
import Produtos from './components/Produtos';
import Clientes from './components/Clientes';
import Fornecedores from './components/Fornecedores';
import Compras from './components/Compras';
import PDV from './components/PDV';
import HistoricoVendas from './components/HistoricoVendas';
import FluxoCaixa from './components/FluxoCaixa';
import ContasPagar from './components/ContasPagar';
import ContasReceber from './components/ContasReceber';
import Relatorios from './components/Relatorios';
import Login from './components/Login';
import ProductTour, { TourLauncher } from './components/ProductTour';

import { 
  Package, 
  Users, 
  Truck, 
  ShoppingBag,
  ShoppingCart, 
  History, 
  ArrowRightLeft, 
  TrendingDown, 
  TrendingUp, 
  BarChart3, 
  Menu, 
  X, 
  Building2, 
  UserCircle,
  LogOut
} from 'lucide-react';

function AppContent() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('vendafacil_auth_user');
        return !!stored;
      } catch {
        return false;
      }
    }
    return false;
  });

  const [user, setUser] = useState<{ name: string; email: string; role?: string } | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      try {
        const stored = localStorage.getItem('vendafacil_auth_user');
        if (stored) {
          setUser(JSON.parse(stored));
        }
      } catch {
        setUser(null);
      }
    } else {
      setUser(null);
    }
  }, [isAuthenticated]);

  const [activeTab, setActiveTab] = useState<string>('pdv');
  const { isDbConnected, dbError, clearDbError } = useErp();

  const [isTourActive, setIsTourActive] = useState<boolean>(false);
  const [tourCompleted, setTourCompleted] = useState<boolean>(true);

  // Controle individual por e-mail no localStorage
  useEffect(() => {
    if (isAuthenticated && user?.email) {
      try {
        const completed = localStorage.getItem(`vendafacil_tour_done_${user.email}`) === 'true';
        setTourCompleted(completed);
        if (!completed) {
          // Inicia automaticamente apenas no primeiro login deste e-mail
          setIsTourActive(true);
          setActiveTab('pdv');
        }
      } catch (err) {
        console.error('Error loading tour completion state:', err);
      }
    }
  }, [isAuthenticated, user?.email]);

  const handleStartTour = () => {
    setActiveTab('pdv');
    setIsTourActive(true);
  };

  const handleTourClose = () => {
    setIsTourActive(false);
    setTourCompleted(true);
    if (user?.email) {
      try {
        localStorage.setItem(`vendafacil_tour_done_${user.email}`, 'true');
      } catch (err) {
        console.error('Error saving tour state:', err);
      }
    }
  };

  if (!isAuthenticated) {
    return <Login onLoginSuccess={() => setIsAuthenticated(true)} />;
  }

  // Menu de navegação lateral simplificado e focado na operação
  const menuItems = [
    { id: 'pdv', label: 'PDV (Frente Caixa)', icon: ShoppingCart },
    { id: 'produtos', label: 'Produtos', icon: Package },
    { id: 'clientes', label: 'Clientes', icon: Users },
    { id: 'fornecedores', label: 'Fornecedores', icon: Truck },
    { id: 'compras', label: 'Compras & Entradas', icon: ShoppingBag },
    { id: 'historico', label: 'Histórico Vendas', icon: History },
    { id: 'fluxocaixa', label: 'Fluxo de Caixa', icon: ArrowRightLeft },
    { id: 'contaspagar', label: 'Contas a Pagar', icon: TrendingDown },
    { id: 'contasreceber', label: 'Contas a Receber', icon: TrendingUp },
    { id: 'relatorios', label: 'Relatórios & BI', icon: BarChart3 },
  ];

  const renderActiveScreen = () => {
    switch (activeTab) {
      case 'pdv':
        return <PDV />;
      case 'produtos':
        return <Produtos />;
      case 'clientes':
        return <Clientes />;
      case 'fornecedores':
        return <Fornecedores />;
      case 'compras':
        return <Compras />;
      case 'historico':
        return <HistoricoVendas />;
      case 'fluxocaixa':
        return <FluxoCaixa />;
      case 'contaspagar':
        return <ContasPagar />;
      case 'contasreceber':
        return <ContasReceber />;
      case 'relatorios':
        return <Relatorios />;
      default:
        return <PDV />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans select-none antialiased text-slate-800">
      
      {/* Barra superior de navegação horizontal completa */}
      <header className="bg-slate-900 text-white border-b border-slate-800 flex flex-col shrink-0 z-40 shadow-md">
        
        {/* Linha Principal: Branding, Status e Perfil */}
        <div className="h-16 px-4 sm:px-6 flex items-center justify-between gap-4">
          
          {/* Logo e Nome da Marca */}
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-indigo-650 rounded-lg text-white">
              <Building2 size={18} />
            </div>
            <div>
              <h2 className="font-bold text-white text-sm tracking-tight">VendaFácil</h2>
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Gestão Comercial</p>
            </div>
          </div>

          {/* Status do Sistema e Sincronização */}
          <div className="hidden md:flex items-center gap-3 text-xs">
            <span className="font-semibold text-slate-400 uppercase tracking-wider text-[9px] bg-slate-800 px-2 py-0.5 rounded border border-slate-700/80">
              Matriz Central
            </span>
            <span className="text-slate-750">|</span>
            {isDbConnected ? (
              <span className="flex items-center gap-1.5 font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/25">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                Nuvem Sincronizada
              </span>
            ) : (
              <span className="flex items-center gap-1.5 font-bold text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/25">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                Acesso Local
              </span>
            )}
            <span className="text-slate-755">|</span>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
              <span className="font-mono text-slate-400 font-semibold text-[11px]">Terminal PDV-01</span>
            </div>
          </div>

          {/* Informações do Operador e LogOut */}
          <div className="flex items-center gap-3 min-w-0 shrink-0">

            {/* Botão de Tour do Sistema */}
            <TourLauncher onStartTour={handleStartTour} tourCompleted={tourCompleted} />

            <div className="flex items-center gap-2 text-right min-w-0">
              <div className="truncate text-xs">
                <p className="font-bold text-white truncate max-w-[120px] sm:max-w-[180px]">
                  {user?.name || 'Operador'}
                </p>
                <p className="text-slate-400 text-[10px] truncate max-w-[120px] sm:max-w-[180px]">
                  {user?.email || 'operador@empresa.com'}
                </p>
              </div>
              <UserCircle size={28} className="text-slate-400 shrink-0 hidden sm:block" />
            </div>
            
            <button
              onClick={() => {
                localStorage.removeItem('vendafacil_auth_user');
                setIsAuthenticated(false);
              }}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-450 hover:bg-rose-500/10 transition-all cursor-pointer shrink-0"
              title="Sair do Sistema"
              id="app_logout_btn"
            >
              <LogOut size={16} />
            </button>
          </div>

        </div>

        {/* Linha Secundária: Navegação Horizontal Responsiva de Módulos */}
        <div className="bg-slate-950 border-t border-slate-800/80 px-2 sm:px-4">
          <nav className="flex items-center gap-1 overflow-x-auto py-1.5 scrollbar-none">
            {menuItems.map((item) => {
              const IconComp = item.icon;
              const isActive = activeTab === item.id;
              
              return (
                <button
                  key={item.id}
                  id={`tour-tab-${item.id}`}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 shrink-0 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    isActive 
                      ? 'bg-indigo-650 text-white shadow-xs' 
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/50'
                  }`}
                >
                  <IconComp size={14} className="shrink-0" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

      </header>

      {/* Workspace de renderização interna ocupando tela livre */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Alerta de sincronização / troubleshooter de banco se houver erro */}
        {dbError && (
          <div className="px-6 md:px-8 pt-6 max-w-7xl mx-auto w-full">
            <div className="bg-amber-50 border border-amber-200 p-5 rounded-xl shadow-xs relative">
              <button 
                onClick={clearDbError}
                className="absolute top-4 right-4 p-1 rounded-full text-amber-500 hover:text-amber-800 hover:bg-amber-100/50 transition-all animate-none"
                title="Fechar alerta"
              >
                <X size={18} />
              </button>
              <div className="flex gap-3">
                <div className="mt-0.5 text-amber-500">
                  <span className="flex h-3 w-3 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
                  </span>
                </div>
                <div className="flex-1 text-xs sm:text-sm text-slate-700">
                  <h3 className="font-bold text-slate-900 mb-1 flex items-center gap-1.5 uppercase tracking-wider text-[11px]">Sincronização Supabase</h3>
                  <div className="whitespace-pre-line leading-relaxed text-slate-600">
                    {dbError}
                  </div>
                  <div className="mt-4">
                    <button 
                      onClick={clearDbError}
                      className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg shadow-xs text-xs transition-all"
                    >
                      Ocultar Alerta
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Visualização de módulos */}
        <main className="flex-1 p-6 md:p-8 overflow-y-auto block max-w-7xl mx-auto w-full">
          {renderActiveScreen()}
        </main>

      </div>

      {/* Tutorial Guiado */}
      {isTourActive && (
        <ProductTour 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
          onClose={handleTourClose} 
        />
      )}

    </div>
  );
}

export default function App() {
  return (
    <ErpProvider>
      <AppContent />
    </ErpProvider>
  );
}
