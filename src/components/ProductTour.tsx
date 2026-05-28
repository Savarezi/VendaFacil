import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronRight, 
  ChevronLeft, 
  X, 
  Sparkles, 
  HelpCircle, 
  Play, 
  CheckCircle2 
} from 'lucide-react';

interface TourStep {
  id: string; // matches application activeTab ID
  title: string;
  emoji: string;
  text: string;
}

interface ProductTourProps {
  activeTab: string;
  setActiveTab: (tabId: string) => void;
  onClose?: () => void;
}

export const TOUR_STEPS: TourStep[] = [
  {
    id: 'pdv',
    title: 'Frente de Caixa (PDV)',
    emoji: '🛒',
    text: 'Seja muito bem-vindo! 🌟 Este é o coração das suas vendas diárias. Aqui, o operador registra os produtos de forma rápida, gerencia o carrinho em tempo real e fecha as vendas na hora. Tudo projetado para ser ágil, intuitivo e livre de complicações! ⚡'
  },
  {
    id: 'produtos',
    title: 'Cadastro de Produtos & Estoque',
    emoji: '📦',
    text: 'Seu catálogo completo de mercadorias! 🔍 Aqui você gerencia códigos de barras (EAN), ajusta preços de custo e de venda, e acompanha as quantidades físicas de estoque para nunca ficar desabastecido. O estoque agora exibe uma lista otimizada para poupar espaço! 📈'
  },
  {
    id: 'clientes',
    title: 'Gestão e Fidelização de Clientes',
    emoji: '👥',
    text: 'Seus clientes são o seu maior patrimônio! ❤️ Nesta aba, você cadastra novos perfis, salva contatos essenciais e acompanha o histórico detalhado de compras. Perfeito para estreitar o relacionamento e fidelizar seus compradores recorrentes! 🤝'
  },
  {
    id: 'fornecedores',
    title: 'Controle de Fornecedores',
    emoji: '🚚',
    text: 'Mantenha seus parceiros comerciais organizados! 🏗️ Cadastre e gerencie os contatos das distribuidoras e marcas que abastecem sua loja. Facilita o contato rápido no momento de renegociar contratos ou repor mercadorias essenciais. 🤝'
  },
  {
    id: 'compras',
    title: 'Compras & Entrada de Estoque',
    emoji: '📥',
    text: 'Sempre que novas mercadorias chegarem, registre aqui! 🧾 A entrada de notas de compra alimenta as quantidades físicas do seu estoque automaticamente e recalcula seus custos operacionais médios. Organização total no mesmo fluxo! 🔄'
  },
  {
    id: 'historico',
    title: 'Histórico de Vendas Realizadas',
    emoji: '⏳',
    text: 'Sua máquina do tempo comercial! 🔍 Consulte todos os cupons fiscais fechados, realize buscas por período ou operador, efetue cancelamentos de transações com facilidade e re-imprima comprovantes salvos em um instante. Controle completo e seguro! 🧾'
  },
  {
    id: 'fluxocaixa',
    title: 'Fluxo de Caixa Diário',
    emoji: '💸',
    text: 'A saúde do seu dinheiro em tempo real! 📊 Acompanhe as receitas das vendas presenciais e registre retiradas emergenciais de dinheiro ou pequenas despesas extras (sangrias e suprimentos). Mantenha as rédeas financeiras do dia com precisão operacional! 💰'
  },
  {
    id: 'contaspagar',
    title: 'Contas a Pagar & Despesas',
    emoji: '📉',
    text: 'Evite multas e tenha previsibilidade financeira! 🗓️ Organize todas as obrigações fiscais e comerciais da empresa (como aluguel, fornecedores e contas de consumo). Monitore as datas de vencimento em formato intuitivo e evite surpresas! 🚦'
  },
  {
    id: 'contasreceber',
    title: 'Contas a Receber & Parcelamentos',
    emoji: '📈',
    text: 'Controle o faturamento futuro das suas vendas presenciais! 🏦 Monitore em detalhes as vendas feitas a prazo, cheques ou parcelamentos pendentes dos clientes, gerencie datas de crédito e reduza problemas de inadimplência corporativa com total visibilidade! 🪙'
  },
  {
    id: 'relatorios',
    title: 'Relatórios Inteligentes & BI',
    emoji: '📊',
    text: 'Sua central de inteligência empresarial! 🧠 Visualize gráficos modernos de faturamento, vendas consolidadas, produtos mais vendidos da semana, estatísticas de ticket médio e o desempenho da equipe para tomar as melhores decisões de mercado! 🚀'
  }
];

export default function ProductTour({ activeTab, setActiveTab, onClose }: ProductTourProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [coords, setCoords] = useState<{ top: number; left: number; position: 'absolute' | 'fixed' }>({ top: 0, left: 0, position: 'fixed' });
  const tooltipRef = useRef<HTMLDivElement>(null);

  // Load first steps according to current main active tab to stay synced
  useEffect(() => {
    const matchedIndex = TOUR_STEPS.findIndex(step => step.id === activeTab);
    if (matchedIndex !== -1 && matchedIndex !== currentStepIndex) {
      setCurrentStepIndex(matchedIndex);
    }
  }, [activeTab]);

  // Handle position bounding to current active navigation ID
  useEffect(() => {
    const updatePosition = () => {
      const activeStep = TOUR_STEPS[currentStepIndex];
      const elementId = `tour-tab-${activeStep.id}`;
      const targetElement = document.getElementById(elementId);

      if (targetElement) {
        const rect = targetElement.getBoundingClientRect();
        const screenWidth = window.innerWidth;
        const isMobile = screenWidth < 768;

        if (isMobile) {
          // On small screens, keep it nice and centered at the bottom of the viewport
          setCoords({
            top: window.innerHeight - 240,
            left: screenWidth / 2,
            position: 'fixed'
          });
          // Ensure the tab itself is visible by scrolling horizontally
          targetElement.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        } else {
          // Centered below the horizontal nav tab button
          setCoords({
            top: rect.bottom + window.scrollY + 12,
            left: rect.left + (rect.width / 2) + window.scrollX,
            position: 'absolute'
          });
        }
      } else {
        // Safe screen-center fallback
        setCoords({
          top: window.innerHeight / 2 - 100,
          left: window.innerWidth / 2,
          position: 'fixed'
        });
      }
    };

    // Delay calculation slightly to allow React DOM update/active tab changes rendering time
    const timer = setTimeout(updatePosition, 100);
    window.addEventListener('resize', updatePosition);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', updatePosition);
    };
  }, [currentStepIndex]);

  const handleNext = () => {
    if (currentStepIndex < TOUR_STEPS.length - 1) {
      const nextIndex = currentStepIndex + 1;
      setCurrentStepIndex(nextIndex);
      setActiveTab(TOUR_STEPS[nextIndex].id);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      const prevIndex = currentStepIndex - 1;
      setCurrentStepIndex(prevIndex);
      setActiveTab(TOUR_STEPS[prevIndex].id);
    }
  };

  const handleComplete = () => {
    localStorage.setItem('vendafacil_product_tour_completed', 'true');
    if (onClose) onClose();
  };

  const currentStep = TOUR_STEPS[currentStepIndex];

  return (
    <div className="fixed inset-0 z-50 pointer-events-none" id="product_tour_wrapper">
      {/* Dimmed backdrop background (pointer events none on body except relative elements) */}
      <div className="absolute inset-0 bg-slate-950/30 backdrop-blur-[0.5px] pointer-events-auto cursor-pointer" onClick={handleComplete} />

      {/* Floating Animated Tooltip container */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStepIndex}
          ref={tooltipRef}
          initial={{ opacity: 0, scale: 0.92, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -5 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
          className="bg-white text-slate-800 rounded-2xl shadow-[0_15px_50px_-15px_rgba(15,23,42,0.4)] border border-indigo-100 p-5 sm:p-6 w-[92%] sm:w-[480px] pointer-events-auto z-50 origin-top"
          style={{
            position: coords.position,
            top: coords.top,
            left: coords.left,
            transform: 'translateX(-50%)',
          }}
          id={`product_tour_step_${currentStep.id}`}
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-4 mb-3.5">
            <div className="flex items-center gap-2.5">
              <span className="text-2xl shrink-0" role="img" aria-label={currentStep.title}>
                {currentStep.emoji}
              </span>
              <div>
                <span className="text-[10px] font-extrabold text-indigo-600 uppercase tracking-widest flex items-center gap-1.5">
                  <Sparkles size={11} className="animate-pulse" /> Tour Interativo ({currentStepIndex + 1}/{TOUR_STEPS.length})
                </span>
                <h3 className="font-extrabold text-slate-900 text-[15px] sm:text-base tracking-tight leading-tight mt-0.5">
                  {currentStep.title}
                </h3>
              </div>
            </div>
            <button
              onClick={handleComplete}
              className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-50 transition-all cursor-pointer shrink-0"
              title="Pular e fechar tutorial"
              id="tour_btn_skip_corner"
            >
              <X size={16} />
            </button>
          </div>

          {/* Description Text */}
          <div className="text-slate-600 text-xs sm:text-[13px] leading-relaxed mb-5 font-normal">
            <p className="bg-slate-50/80 p-3 rounded-xl border border-slate-100 italic text-slate-650">
              {currentStep.text}
            </p>
          </div>

          {/* Actions / Buttons Footer */}
          <div className="flex items-center justify-between border-t border-slate-100 pt-4 gap-3 bg-white">
            <button
              onClick={handleComplete}
              className="text-slate-500 hover:text-slate-700 font-bold text-xs hover:underline cursor-pointer transition-colors"
              id="tour_btn_skip_primary"
            >
              Pular Introdução
            </button>

            <div className="flex items-center gap-2">
              {currentStepIndex > 0 && (
                <button
                  onClick={handlePrev}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-3xs"
                  id="tour_btn_prev"
                >
                  <ChevronLeft size={14} /> Voltar
                </button>
              )}

              <button
                onClick={handleNext}
                className="flex items-center gap-1.5 px-4.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-extrabold transition-all cursor-pointer shadow-2xs group"
                id="tour_btn_next"
              >
                {currentStepIndex === TOUR_STEPS.length - 1 ? (
                  <>
                    <CheckCircle2 size={13} /> Finalizar Tour
                  </>
                ) : (
                  <>
                    Avançar <ChevronRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
                  </>
                )}
              </button>
            </div>
          </div>
          
          {/* Tooltip top triangle pointer (Only showing on non-mobile absolute layout) */}
          {coords.position === 'absolute' && (
            <div className="absolute top-0 left-1/2 -mt-2 -ml-2 w-4 h-4 bg-white border-t border-l border-indigo-100 rotate-45 pointer-events-none" />
          )}

        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// Small Help button in header controller
interface TourLauncherProps {
  onStartTour: () => void;
  tourCompleted: boolean;
}

export function TourLauncher({ onStartTour, tourCompleted }: TourLauncherProps) {
  return (
    <motion.button
      onClick={onStartTour}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={`flex items-center gap-1.5 py-1 px-2.5 rounded-full text-[10px] font-bold tracking-normal uppercase border transition-all cursor-pointer shrink-0 ${
        !tourCompleted 
          ? 'bg-indigo-600 text-white border-indigo-500 animate-pulse shadow-xs'
          : 'bg-slate-900 hover:bg-slate-800 text-slate-350 border-slate-850 hover:text-white'
      }`}
      title="Iniciar tour guiado pelo sistema"
      id="header_tour_launcher_btn"
    >
      <Sparkles size={11} className={!tourCompleted ? 'text-amber-300' : 'text-indigo-400'} />
      <span>{tourCompleted ? 'Dicas do Sistema' : 'Primeiro Acesso? Comece Aqui!'}</span>
    </motion.button>
  );
}
