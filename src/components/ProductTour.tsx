import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight, X, Play } from 'lucide-react';

export interface TourStep {
  id: string; // Corresponds to the activeTab
  title: string;
  description: string;
  emoji: string;
}

export const TOUR_STEPS: TourStep[] = [
  {
    id: 'pdv',
    title: 'PDV (Frente Caixa)',
    description: 'Esta é a tela principal de vendas e pagamentos.',
    emoji: '🛒'
  },
  {
    id: 'produtos',
    title: 'Produtos',
    description: 'Área para cadastro e controle de produtos.',
    emoji: '📦'
  },
  {
    id: 'clientes',
    title: 'Clientes',
    description: 'Gerencie os clientes cadastrados.',
    emoji: '👥'
  },
  {
    id: 'fornecedores',
    title: 'Fornecedores',
    description: 'Controle empresas fornecedoras.',
    emoji: '🚚'
  },
  {
    id: 'compras',
    title: 'Compras & Entradas',
    description: 'Registre compras e entrada de estoque.',
    emoji: '🛍️'
  },
  {
    id: 'historico',
    title: 'Histórico Vendas',
    description: 'Consulte vendas realizadas.',
    emoji: '📜'
  },
  {
    id: 'fluxocaixa',
    title: 'Fluxo de Caixa',
    description: 'Acompanhe movimentações financeiras.',
    emoji: '🔄'
  },
  {
    id: 'contaspagar',
    title: 'Contas a Pagar',
    description: 'Controle despesas e vencimentos.',
    emoji: '📉'
  },
  {
    id: 'contasreceber',
    title: 'Contas a Receber',
    description: 'Gerencie recebimentos pendentes.',
    emoji: '📈'
  },
  {
    id: 'relatorios',
    title: 'Relatórios & BI',
    description: 'Visualize gráficos e indicadores.',
    emoji: '📊'
  }
];

interface ProductTourProps {
  activeTab: string;
  setActiveTab: (tabId: string) => void;
  onClose: () => void;
}

export default function ProductTour({ activeTab, setActiveTab, onClose }: ProductTourProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [maskRect, setMaskRect] = useState<DOMRect | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ top: 0, left: 0, arrowLeft: 0, position: 'above' });
  const tooltipRef = useRef<HTMLDivElement>(null);

  // Synchronize dynamic screen state of active ERP tab with current tutorial step index
  useEffect(() => {
    const step = TOUR_STEPS[currentIndex];
    if (step && activeTab !== step.id) {
      setActiveTab(step.id);
    }
  }, [currentIndex, activeTab, setActiveTab]);

  // Calculate high-fidelity highlight cutout and tooltip alignment coordinates
  const updateHighlightCoords = () => {
    const step = TOUR_STEPS[currentIndex];
    if (!step) return;

    const element = document.getElementById(`tour-tab-${step.id}`);
    if (element) {
      // Ensure element is perfectly central in scrollable viewports
      element.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      
      // Let's defer measurement to allow layout/scrolling adjustments to settle
      setTimeout(() => {
        const rect = element.getBoundingClientRect();
        setMaskRect(rect);

        // Responsive alignment calculations for the overlay panel
        const tooltipWidth = tooltipRef.current ? tooltipRef.current.offsetWidth : 380;
        const tooltipHeight = tooltipRef.current ? tooltipRef.current.offsetHeight : 180;
        const screenWidth = window.innerWidth;
        const screenHeight = window.innerHeight;

        // Positioning: menu header is usually at top. So tooltip goes underneath the cutout
        let idealTop = rect.bottom + 12;
        let position = 'below';

        // Fallback to above/center if cramped underneath
        if (idealTop + tooltipHeight > screenHeight - 20) {
          idealTop = Math.max(16, rect.top - tooltipHeight - 12);
          position = 'above';
        }

        // Horizontal alignment math with screen boundary safety constraint padding
        let idealLeft = rect.left + (rect.width / 2) - (tooltipWidth / 2);
        
        // Prevent sticking past screen sides
        const minLeft = 12;
        const maxLeft = screenWidth - tooltipWidth - 12;
        idealLeft = Math.max(minLeft, Math.min(maxLeft, idealLeft));

        // Arrow pointer needs to align exactly on center of the highlighted menu item
        const arrowLeft = rect.left + (rect.width / 2) - idealLeft;

        setTooltipPos({
          top: idealTop,
          left: idealLeft,
          arrowLeft: arrowLeft,
          position: position
        });
      }, 100);
    } else {
      // If the target menu is not resolved on screen, center the modal on canvas
      const screenWidth = window.innerWidth;
      const screenHeight = window.innerHeight;
      const tWidth = tooltipRef.current ? tooltipRef.current.offsetWidth : 380;
      const tHeight = tooltipRef.current ? tooltipRef.current.offsetHeight : 180;
      
      setMaskRect(null);
      setTooltipPos({
        top: (screenHeight - tHeight) / 2,
        left: (screenWidth - tWidth) / 2,
        arrowLeft: tWidth / 2,
        position: 'center'
      });
    }
  };

  useEffect(() => {
    updateHighlightCoords();
    // Add event listeners for responsive updates
    window.addEventListener('resize', updateHighlightCoords);
    window.addEventListener('scroll', updateHighlightCoords);
    return () => {
      window.removeEventListener('resize', updateHighlightCoords);
      window.removeEventListener('scroll', updateHighlightCoords);
    };
  }, [currentIndex]);

  const handleNext = () => {
    if (currentIndex < TOUR_STEPS.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleSkip = () => {
    onClose();
  };

  const step = TOUR_STEPS[currentIndex];

  return (
    <div className="fixed inset-0 z-50 pointer-events-none" id="tour-system-container">
      {/* Dynamic SVG Dark Mask Overlay with Highlight Window Cutout */}
      <svg className="absolute inset-0 w-full h-full pointer-events-auto" style={{ mixBlendMode: 'multiply' }}>
        <defs>
          <mask id="tour-cutout-mask">
            {/* Opaque white leaves the dark overlay */}
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            
            {/* Transparent black cutout exposes the header item underneath */}
            {maskRect && (
              <rect
                x={maskRect.x - 6}
                y={maskRect.y - 4}
                width={maskRect.width + 12}
                height={maskRect.height + 8}
                rx="8"
                fill="black"
              />
            )}
          </mask>
        </defs>
        
        {/* Semi-transparent dark overlay pane */}
        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill="rgba(15, 23, 42, 0.82)"
          mask="url(#tour-cutout-mask)"
        />
      </svg>

      {/* Pulsing visual halo around the target highlighted active item */}
      {maskRect && (
        <div
          className="absolute border-2 border-amber-400 rounded-lg pointer-events-none animate-pulse z-50"
          style={{
            top: maskRect.top - 6,
            left: maskRect.x - 8,
            width: maskRect.width + 16,
            height: maskRect.height + 12,
            boxShadow: '0 0 16px rgba(245, 158, 11, 0.65)'
          }}
        />
      )}

      {/* Floating Interactive Tooltip Dialog Card with Motion Effects */}
      <div
        ref={tooltipRef}
        className="absolute pointer-events-auto z-50 w-[90%] sm:w-[380px] bg-white rounded-2xl shadow-2xl border border-indigo-100 p-5 flex flex-col gap-4"
        style={{
          top: tooltipPos.top,
          left: tooltipPos.left,
          transition: 'top 0.2s cubic-bezier(0.16, 1, 0.3, 1), left 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Dialog Indicator Arrow */}
        {tooltipPos.position !== 'center' && (
          <div
            className={`absolute w-4 h-4 bg-white rotate-45 border-l border-t border-indigo-100 ${
              tooltipPos.position === 'below' ? '-top-2' : '-bottom-2 border-r border-b border-t-0 border-l-0'
            }`}
            style={{
              left: Math.max(16, Math.min(tooltipPos.arrowLeft - 8, (tooltipRef.current?.offsetWidth || 380) - 24)),
              transition: 'left 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
          />
        )}

        {/* Header Block with Skip corner option */}
        <div className="flex items-start justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl mr-1" role="img" aria-label={step.title}>
              {step.emoji}
            </span>
            <div>
              <p className="text-[10px] text-indigo-650 font-extrabold uppercase tracking-widest">Tutorial ERP</p>
              <h4 className="font-extrabold text-slate-900 text-sm tracking-tight">{step.title}</h4>
            </div>
          </div>
          <button
            onClick={handleSkip}
            className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100/80 transition-all cursor-pointer"
            title="Pular todo o tour"
            id="tour_btn_skip_corner"
          >
            <X size={15} />
          </button>
        </div>

        {/* Informative Text Body */}
        <div className="bg-slate-50/70 p-3 rounded-xl border border-slate-100 sm:text-sm text-xs leading-relaxed text-slate-650 italic shrink-0">
          “{step.description}”
        </div>

        {/* Progress & Actions Footer Section */}
        <div className="flex items-center justify-between gap-3 border-t border-slate-100 pt-3.5 mt-1 shrink-0">
          {/* Progress Indicator Dots / Fractional Label */}
          <div className="flex flex-col gap-0.5">
            <span className="text-[11px] font-bold text-slate-400">
              Passo {currentIndex + 1} de {TOUR_STEPS.length}
            </span>
            <div className="flex gap-1.5 mt-1">
              {TOUR_STEPS.map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i === currentIndex ? 'w-5 bg-indigo-600' : 'w-1.5 bg-slate-200'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Action Row */}
          <div className="flex items-center gap-2">
            {/* Skip Option */}
            <button
              onClick={handleSkip}
              className="text-xs text-slate-400 hover:text-slate-600 font-extrabold px-2 py-1.5 hover:underline cursor-pointer"
              id="tour_btn_skip_primary"
            >
              Pular
            </button>

            {/* Back Arrow Button */}
            {currentIndex > 0 && (
              <button
                onClick={handlePrev}
                className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-700 active:scale-95 transition-all cursor-pointer"
                title="Voltar"
                id="tour_btn_prev"
              >
                <ChevronLeft size={16} />
              </button>
            )}

            {/* Next / Proceed Button */}
            <button
              onClick={handleNext}
              className="flex items-center gap-1 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-extrabold text-xs px-3.5 py-2 rounded-xl transition-all shadow-md shadow-indigo-600/20 cursor-pointer"
              id="tour_btn_next"
            >
              <span>{currentIndex === TOUR_STEPS.length - 1 ? 'Concluir' : 'Próximo'}</span>
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Minimal Floating Trigger Launcher Component to re-open the onboarding anytime
interface TourLauncherProps {
  onStartTour: () => void;
  tourCompleted: boolean;
}

export function TourLauncher({ onStartTour, tourCompleted }: TourLauncherProps) {
  return (
    <button
      onClick={onStartTour}
      className={`relative flex items-center gap-1 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
        !tourCompleted 
          ? 'bg-amber-500 hover:bg-amber-600 text-slate-950 animate-bounce shadow-md shadow-amber-500/25 ring-2 ring-amber-400/50' 
          : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/80 hover:text-white'
      }`}
      title="Fazer Tour do Sistema"
      id="header_tour_launcher_btn"
    >
      <Play size={11} className={`shrink-0 ${!tourCompleted ? 'fill-current animate-pulse' : ''}`} />
      <span className="text-[11px] sm:text-xs">
        <span className="hidden sm:inline">{!tourCompleted ? 'Descobrir Sistema' : 'Fazer Tour'}</span>
        <span className="inline sm:hidden">Tour</span>
      </span>
    </button>
  );
}
