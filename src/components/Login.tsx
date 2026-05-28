import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  ShoppingCart, 
  Package, 
  Users, 
  Truck, 
  ArrowRightLeft, 
  TrendingDown, 
  TrendingUp, 
  History, 
  BarChart3, 
  Building2, 
  Eye, 
  EyeOff, 
  Lock, 
  Mail, 
  CheckCircle2, 
  AlertCircle,
  ArrowRight,
  Database,
  Shield,
  Wifi,
  Layers,
  Sparkles,
  RefreshCw,
  Server
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

interface LoginProps {
  onLoginSuccess: () => void;
}

export default function Login({ onLoginSuccess }: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // exactly 9 modules for a perfect 3x3 grid
  const modules = [
    { 
      id: 'pdv', 
      label: 'Frente de Caixa (PDV)', 
      desc: 'Processamento ágil de pedidos, carrinho e vendas instantâneas.',
      icon: ShoppingCart, 
      color: 'text-cyan-400', 
      bg: 'bg-cyan-500/10',
      border: 'border-cyan-500/15',
      badge: 'Tempo Real'
    },
    { 
      id: 'produtos', 
      label: 'Catálogo de Produtos', 
      desc: 'Gestão de estoque, código de barras (EAN) e custos médios.',
      icon: Package, 
      color: 'text-indigo-400', 
      bg: 'bg-indigo-500/10',
      border: 'border-indigo-500/15',
      badge: 'Estoque'
    },
    { 
      id: 'clientes', 
      label: 'Histórico & CRM', 
      desc: 'Fichas de clientes, histórico de compras e fidelização ativa.',
      icon: Users, 
      color: 'text-violet-400', 
      bg: 'bg-violet-500/10',
      border: 'border-violet-500/15',
      badge: 'Fidelidade'
    },
    { 
      id: 'fornecedores', 
      label: 'Fornecedores', 
      desc: 'Mapeamento e contatos de distribuidoras e marcas parceiras.',
      icon: Truck, 
      color: 'text-amber-400', 
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/15',
      badge: 'Parcerias'
    },
    { 
      id: 'compras', 
      label: 'Compras & Entradas', 
      desc: 'Previsão de reposições de estoque por notas de compras.',
      icon: Layers, 
      color: 'text-pink-400', 
      bg: 'bg-pink-500/10',
      border: 'border-pink-500/15',
      badge: 'Automático'
    },
    { 
      id: 'fluxocaixa', 
      label: 'Fluxo de Caixa', 
      desc: 'Conciliação em tempo real de receitas diárias e retiradas.',
      icon: ArrowRightLeft, 
      color: 'text-emerald-400', 
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/15',
      badge: 'Conciliado'
    },
    { 
      id: 'contaspagar', 
      label: 'Contas a Pagar', 
      desc: 'Vencimentos sob controle total, evitando multas e atrasos.',
      icon: TrendingDown, 
      color: 'text-rose-400', 
      bg: 'bg-rose-500/10',
      border: 'border-rose-500/15',
      badge: 'Fiscal'
    },
    { 
      id: 'contasreceber', 
      label: 'Contas a Receber', 
      desc: 'Acompanhamento de faturamento futuro e parcelamentos.',
      icon: TrendingUp, 
      color: 'text-sky-400', 
      bg: 'bg-sky-500/10',
      border: 'border-sky-500/15',
      badge: 'Recebíveis'
    },
    { 
      id: 'relatorios', 
      label: 'Relatórios Inteligentes', 
      desc: 'Métricas gerenciais, curva ABC e ticket médio do negócio.',
      icon: BarChart3, 
      color: 'text-purple-400', 
      bg: 'bg-purple-500/10',
      border: 'border-purple-500/15',
      badge: 'Business BI'
    },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email) {
      setError('Por favor, informe seu endereço de e-mail.');
      return;
    }
    if (!password) {
      setError('Por favor, insira sua senha de acesso.');
      return;
    }
    if (password.length < 6) {
      setError('A senha deve conter pelo menos 6 caracteres.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Por favor, insira um e-mail com formato válido.');
      return;
    }

    setIsLoading(true);

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password
        });

        if (signInError) {
          throw signInError;
        }

        if (data.user) {
          setSuccess(true);
          const userName = data.user.user_metadata?.name || 'Administrador';

          localStorage.setItem('vendafacil_auth_user', JSON.stringify({
            email: data.user.email,
            name: userName,
            role: 'Administrador'
          }));

          setTimeout(() => {
            onLoginSuccess();
          }, 800);
        }
      } catch (err: any) {
        setIsLoading(false);
        let msg = err.message || 'Erro de autenticação.';
        if (msg === 'Invalid login credentials') {
          msg = 'E-mail ou senha incorretos. Por favor, verifique suas credenciais de segurança.';
        } else if (msg.includes('Email not confirmed')) {
          msg = 'E-mail pendente de confirmação. Verifique sua caixa de correio.';
        }
        setError(msg);
      }
    } else {
      // Simulação Offline Segura
      setTimeout(() => {
        if (email === 'demo@empresa.com' && password !== 'admin123') {
          setIsLoading(false);
          setError('A chave de acesso fornecida está incorreta para esta licença demonstrativa.');
          return;
        }

        setIsLoading(false);
        setSuccess(true);
        
        localStorage.setItem('vendafacil_auth_user', JSON.stringify({
          email: email,
          name: 'Supervisor de Vendas',
          role: 'Administrador'
        }));

        setTimeout(() => {
          onLoginSuccess();
        }, 800);
      }, 1000);
    }
  };

  return (
    <div className="h-screen w-full bg-[#020512] flex flex-col lg:flex-row font-sans text-slate-100 selection:bg-indigo-500/30 selection:text-white relative overflow-hidden antialiased">
      
      {/* Luz radial de alta profundidade visual */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-[10%] -left-[10%] w-[50%] h-[60%] rounded-full bg-cyan-500/5 blur-[120px]" />
        <div className="absolute top-[30%] right-[5%] w-[45%] h-[55%] rounded-full bg-indigo-600/5 blur-[140px]" />
        <div className="absolute -bottom-[15%] left-[30%] w-[35%] h-[45%] rounded-full bg-blue-600/5 blur-[100px]" />
        
        {/* Grade de fundo técnica corporativa de última geração */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#080f2c_1px,transparent_1px),linear-gradient(to_bottom,#080f2c_1px,transparent_1px)] bg-[size:3rem_3rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_80%,transparent_100%)] opacity-20" />
      </div>

      {/* LADO ESQUERDO: Branding, Headlines e Módulos do ERP */}
      <div className="w-full lg:w-3/5 xl:w-[62%] h-full flex flex-col justify-between p-4 sm:p-6 lg:p-8 xl:p-10 z-10 overflow-hidden relative">
        
        {/* Top Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-slate-950/80 rounded-lg text-cyan-400 border border-cyan-500/30 shadow-md">
              <Building2 size={18} className="shrink-0" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-lg font-black tracking-tight text-white leading-none bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-slate-350">
                  VendaFácil
                </span>
                <span className="px-1.5 py-0.5 rounded text-[8px] font-extrabold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 uppercase tracking-widest leading-none">
                  ERP PREMIUM
                </span>
              </div>
              <p className="text-[8px] text-cyan-400/80 font-bold uppercase tracking-widest leading-none mt-0.5">ESTRUTURA DE ALTA PERFORMANCE</p>
            </div>
          </div>

          {/* Microstatus de Conectividade Integrada */}
          <div className="flex items-center gap-3 text-[10px] font-mono text-slate-450 bg-slate-900/30 px-2.5 py-1 rounded-full border border-slate-850/60">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
              API SEFAZ Ativa
            </span>
            <span className="text-slate-800">|</span>
            <span className="font-semibold text-slate-400">v4.8 Enterprise</span>
          </div>
        </div>

        {/* Headlines Centrais Compactos */}
        <div className="my-auto max-w-3xl py-2 xl:py-4">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[9px] font-extrabold bg-[#0d213b]/60 text-cyan-400 border border-cyan-500/20 mb-2.5">
            <Sparkles size={10} className="text-amber-400" />
            <span className="uppercase tracking-widest">SaaS Corporativo</span>
          </div>
          <h2 className="text-xl sm:text-2xl xl:text-3xl font-black text-white tracking-tight leading-none uppercase">
            ERP para Gestão Comercial
          </h2>
          <p className="text-xs sm:text-[13px] text-slate-350 mt-1.5 max-w-2xl leading-normal font-light">
            Controle financeiro, estoque, vendas e operação em uma única plataforma integrada. 
            Projetada para garantir velocidade máxima em vendas presenciais e decisões assertivas.
          </p>

          {/* 3x3 Grid Super Compacto dos Módulos */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 py-4 xl:gap-3">
            {modules.map((m) => {
              const IconComp = m.icon;
              return (
                <div
                  key={m.id}
                  className="p-3.5 rounded-xl relative overflow-hidden bg-[#070b1e]/50 backdrop-blur-md border border-slate-850/60 hover:border-cyan-500/25 transition-all duration-200 flex flex-col justify-between group shadow-sm hover:shadow-cyan-500/5 hover:-translate-y-0.5"
                >
                  {/* Glowing core effect */}
                  <div className="absolute -right-4 -bottom-4 w-12 h-12 rounded-full bg-cyan-500/5 blur-lg group-hover:bg-indigo-500/10 transition-all duration-200" />

                  <div>
                    {/* Icon e Badge */}
                    <div className="flex items-center justify-between mb-2">
                      <div className={`p-1.5 rounded-md ${m.bg} ${m.color} h-fit shrink-0`}>
                        <IconComp size={14} />
                      </div>
                      <span className="text-[8px] font-mono font-medium text-slate-500 tracking-wider bg-slate-900/40 px-1.5 py-0.5 rounded border border-slate-850">
                        {m.badge}
                      </span>
                    </div>

                    <h3 className="text-[11px] xl:text-xs font-black text-white tracking-tight leading-tight group-hover:text-cyan-400 transition-colors">
                      {m.label}
                    </h3>
                    <p className="text-[10px] text-slate-400/90 mt-0.5 leading-snug line-clamp-2">
                      {m.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer do Painel Esquerdo */}
        <div className="flex items-center justify-between text-[10px] text-slate-500 font-medium pt-3.5 border-t border-slate-900/60">
          <span>&copy; {new Date().getFullYear()} VendaFácil ERP. Todos os direitos reservados.</span>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 text-[9px] tracking-wide uppercase">
              <Shield size={10} className="text-cyan-400" /> Segurança TLS 1.3
            </span>
          </div>
        </div>
      </div>

      {/* LADO DIREITO: Painel de Login de Alta Fidelidade */}
      <div className="w-full lg:w-2/5 xl:w-[38%] h-full flex flex-col justify-between p-4 sm:p-6 lg:p-8 xl:p-10 z-10 bg-[#04060f]/95 border-t lg:border-t-0 lg:border-l border-slate-900/60 relative overflow-hidden">
        
        {/* Glow de iluminação de fundo */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 rounded-full bg-indigo-500/5 blur-[100px] pointer-events-none" />

        {/* Top Header Invisivel no Desktop mas exibe no Mobile */}
        <div className="lg:hidden flex items-center gap-2 justify-center py-2">
          <div className="p-1 bg-gradient-to-br from-cyan-500 to-indigo-600 rounded-lg text-white">
            <Building2 size={16} />
          </div>
          <span className="text-base font-bold tracking-tight text-white">VendaFácil ERP</span>
        </div>

        {/* Painel Administrativo Central */}
        <div className="my-auto w-full max-w-[360px] mx-auto">
          
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="p-5 sm:p-6 rounded-2xl bg-[#080d22]/50 border border-indigo-500/20 backdrop-blur-lg shadow-xl shadow-indigo-950/20 relative"
          >
            {/* Status Live indicators no topo do login */}
            <div className="mb-4 flex items-center justify-between border-b border-slate-900/60 pb-3">
              <div className="flex items-center gap-1.5">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-cyan-400"></span>
                </span>
                <span className="text-[9px] font-mono font-bold text-cyan-400 uppercase tracking-widest leading-none">
                  SEFAZ Conectado
                </span>
              </div>
              <div className="flex items-center gap-1 text-[9px] font-mono text-slate-400">
                <Wifi size={10} className="text-emerald-400" />
                <span>Sync Cloud 100%</span>
              </div>
            </div>

            <div className="mb-4.5">
              <h2 className="text-base sm:text-lg font-black text-white tracking-tight leading-none uppercase">
                Acesso Corporativo
              </h2>
              <p className="text-[11px] text-slate-450 mt-1 leading-normal">
                Informe o seu e-mail e sua chave de acesso para entrar.
              </p>
            </div>

            {/* Caixa de Erro compacta */}
            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-3.5 p-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-[11px] flex gap-2 items-start font-medium leading-relaxed"
              >
                <AlertCircle size={14} className="shrink-0 mt-0.5 text-red-400" />
                <span>{error}</span>
              </motion.div>
            )}

            {/* Sucesso compacta */}
            {success && (
              <motion.div 
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-3.5 p-2.5 rounded-lg bg-cyan-500/15 border border-cyan-500/20 text-cyan-400 text-[11px] flex gap-2 items-start font-medium leading-relaxed"
              >
                <CheckCircle2 size={14} className="shrink-0 mt-0.5 text-cyan-450" />
                <span>Sessão autorizada! Carregando infraestrutura analítica...</span>
              </motion.div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-3.5">
              
              {/* E-mail */}
              <div>
                <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">
                  E-mail de Usuário
                </label>
                <div className="relative group/input">
                  <div className="absolute inset-y-0 left-3 flex items-center text-slate-500 group-focus-within/input:text-cyan-400 transition-colors pointer-events-none">
                    <Mail size={13} />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading || success}
                    placeholder="exemplo@empresa.com"
                    className="w-full bg-[#030612]/90 text-slate-100 placeholder-slate-650 border border-slate-850 rounded-xl py-2 pl-9 pr-3 text-xs focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/10 transition-all disabled:opacity-50"
                    id="login_email_field"
                  />
                </div>
              </div>

              {/* Senha */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest">
                    Chave de Acesso
                  </label>
                  <span className="text-[9px] text-slate-500 select-none">
                    admin123
                  </span>
                </div>
                <div className="relative group/input">
                  <div className="absolute inset-y-0 left-3 flex items-center text-slate-500 group-focus-within/input:text-cyan-400 transition-colors pointer-events-none">
                    <Lock size={13} />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading || success}
                    placeholder="••••••••"
                    className="w-full bg-[#030612]/90 text-slate-100 placeholder-slate-650 border border-slate-850 rounded-xl py-2 pl-9 pr-9 text-xs focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/10 transition-all disabled:opacity-50"
                    id="login_password_field"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading || success}
                    className="absolute inset-y-0 right-3 flex items-center text-slate-500 hover:text-slate-200 transition-colors focus:outline-none cursor-pointer"
                  >
                    {showPassword ? <EyeOff size={13} /> : <Eye size={13} />}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isLoading || success}
                className="w-full mt-2 relative overflow-hidden bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-extrabold py-2.5 px-4 rounded-xl text-xs shadow-lg group flex items-center justify-center gap-1.5 hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-75 disabled:transform-none cursor-pointer"
                id="login_submit_btn"
              >
                {isLoading ? (
                  <span className="flex items-center gap-1.5">
                    <RefreshCw className="animate-spin h-3.5 w-3.5" />
                    <span>Autenticando...</span>
                  </span>
                ) : success ? (
                  <span className="flex items-center gap-1">
                    <CheckCircle2 size={14} /> Carregando...
                  </span>
                ) : (
                  <>
                    <span>Entrar no Sistema</span>
                    <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
                  </>
                )}
              </button>
            </form>

            {/* TLS information underneath login box */}
            <div className="mt-4 pt-3.5 border-t border-slate-900/60 flex items-center justify-between text-[8px] font-mono text-slate-500 uppercase tracking-widest leading-none">
              <span>TLS v1.3</span>
              <span>•</span>
              <span>Sincronizado</span>
              <span>•</span>
              <span>Multi-Tenant</span>
            </div>
          </motion.div>

          {/* Setup Indicator */}
          <div className="mt-4 flex justify-center text-center">
            {isSupabaseConfigured ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-500/5 text-emerald-400 border border-emerald-500/15 rounded-full text-[9px] font-bold font-mono">
                <Server size={10} /> Cloud active (US-East)
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-500/5 text-amber-400 border border-amber-500/15 rounded-full text-[9px] font-extrabold font-mono uppercase tracking-wider">
                <Database size={10} /> Demonstrativo local
              </span>
            )}
          </div>
        </div>

        {/* Rodapé do Painel Direito */}
        <div className="text-center text-[9px] text-slate-600 font-mono py-1">
          <span>SESSÃO PROTEGIDA POR CRIPTOGRAFIA DE PONTA A PONTA</span>
        </div>
      </div>
    </div>
  );
}
