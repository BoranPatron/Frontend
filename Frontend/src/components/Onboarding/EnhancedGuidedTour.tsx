/**
 * EnhancedGuidedTour - Moderne, intuitive Onboarding-Tour für BuildWise
 * 
 * ✨ NEUE FEATURES (2.0):
 * - 🎯 Fokussiert: Nur 8 Steps statt 14+ (60 Sekunden Tour)
 * - 🎨 Moderne UI: Glassmorphism, Glow-Effekte, Gradient-Buttons
 * - 📊 Fortschrittsbalken: Animiert mit Shimmer-Effekt
 * - ⌨️ Keyboard Shortcuts: Pfeiltasten & ESC Support
 * - 💫 Animationen: Multi-Layer Spotlight, Pulsing Glow
 * - 🎮 Interaktiv: Click-to-Action für wichtige Features
 * - 📱 Responsive: Optimiert für alle Bildschirmgrößen
 * 
 * BAUTRÄGER TOUR:
 * 1. Willkommen - Quick Intro
 * 2. Radial Menu - Kommandozentrum (mit Click)
 * 3. Personalisierung - Drag & Drop Tipp
 * 4. Projekt-Mockup - Visuelles Preview
 * 5. Ausschreibungen - Management Preview
 * 6. Benachrichtigungen - Real-time Updates
 * 7. Kanban Board - Task Management
 * 8. Ready to Start - Erfolgsabschluss
 * 
 * DIENSTLEISTER TOUR:
 * 1. Willkommen - Quick Intro
 * 2. Werkzeug-Center (mit Click)
 * 3. Auftragssuche - Tender Preview
 * 4. Geo-Map - Geografische Suche
 * 5. Kalkulator - Angebotserstellung
 * 6. Verfügbarkeit - Ressourcen-Management
 * 7. Benachrichtigungen
 * 8. Ready to Start
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { X, ArrowRight, ArrowLeft, CheckCircle, ChevronDown, Sparkles } from 'lucide-react';
import { useOnboarding } from '../../context/OnboardingContext';
import { ProjectMockup, TenderMockup, CostPositionMockup, TodoMockup, GeoMapMockup, KanbanMockup, TabsMockup } from './TourMockups';

// Custom CSS Animations
const customStyles = `
  @keyframes spotlight-pulse {
    0%, 100% {
      opacity: 1;
      transform: scale(1);
    }
    50% {
      opacity: 0.9;
      transform: scale(1.02);
    }
  }
  
  @keyframes subtle-glow {
    0%, 100% {
      opacity: 0.3;
    }
    50% {
      opacity: 0.5;
    }
  }
  
  @keyframes shimmer {
    0% {
      transform: translateX(-100%);
    }
    100% {
      transform: translateX(100%);
    }
  }
  
  @keyframes float {
    0%, 100% {
      transform: translateY(0px);
    }
    50% {
      transform: translateY(-10px);
    }
  }
`;

// Inject styles with cleanup
function useEnhancedTourStyles() {
  useEffect(() => {
    const styleSheet = document.createElement('style');
    styleSheet.id = 'enhanced-tour-styles';
    styleSheet.setAttribute('data-component', 'EnhancedGuidedTour');
    styleSheet.textContent = customStyles;
    
    try {
      document.head.appendChild(styleSheet);
    } catch (error) {
      console.error('Failed to append enhanced tour styles:', error);
    }
    
    return () => {
      try {
        if (styleSheet.parentNode === document.head) {
          document.head.removeChild(styleSheet);
        }
      } catch (error) {
        console.warn('Failed to remove enhanced tour styles:', error);
      }
    };
  }, []);
}

type Pointer = 'auto' | 'top' | 'bottom' | 'left' | 'right';

export type TourStep = {
  id: string; // data-tour-id
  title: string;
  description: string;
  waitForClick?: boolean;
  pointer?: Pointer;
  scrollToElement?: boolean;
  showMockup?: 'project' | 'tender' | 'cost' | 'todo' | 'geomap' | 'kanban' | 'tabs';
  mockupPosition?: 'below' | 'above' | 'side';
  customContent?: React.ReactNode;
};

interface EnhancedGuidedTourProps {
  onClose?: () => void;
  onCompleted?: () => void;
  steps?: TourStep[];
  userRole?: 'BAUTRAEGER' | 'DIENSTLEISTER';
}

// Moderne, kompakte Bauträger Tour - fokussiert auf die wichtigsten Features
const bautraegerSteps: TourStep[] = [
  { 
    id: 'dashboard-title', 
    title: 'Willkommen bei BuildWise! 🏗️', 
    description: 'Hey! Schön, dass du da bist. In nur 60 Sekunden zeige ich dir die wichtigsten Features, die deine Bauprojekte revolutionieren werden. Bereit? Dann lass uns loslegen!', 
    pointer: 'bottom' 
  },
  { 
    id: 'radial-menu-fab', 
    title: 'Dein Kommandozentrum 🎯', 
    description: 'Dieser Button ist dein Alleskönner! Klicke ihn jetzt an und entdecke alle wichtigen Aktionen: Projekte erstellen, Ausschreibungen starten, Dokumente hochladen – alles an einem Ort.', 
    pointer: 'left',
    waitForClick: true 
  },
  { 
    id: 'radial-menu-fab', 
    title: 'Individuell anpassbar 🎨', 
    description: 'Pro-Tipp: Ziehe die Buttons per Drag & Drop, um dein persönliches Layout zu erstellen. BuildWise merkt sich deine Anordnung automatisch!', 
    pointer: 'top' 
  },
  {
    id: 'tour-mockup-project',
    title: 'Deine Projekte im Überblick ✨',
    description: 'So sehen deine Bauprojekte aus: Fortschritt, Budget, Bauphase und alle wichtigen Kennzahlen – immer aktuell und übersichtlich. Wechsle mit den Dots zwischen mehreren Projekten.',
    pointer: 'auto',
    showMockup: 'project',
    mockupPosition: 'below',
    scrollToElement: false
  },
  {
    id: 'tour-mockup-tender',
    title: 'Ausschreibungen managen 📋',
    description: 'Erstelle Ausschreibungen, erhalte Angebote von qualifizierten Dienstleistern und vergleiche sie direkt. Der Status zeigt dir auf einen Blick: Offen, Angebote eingegangen oder bereits vergeben.',
    pointer: 'auto',
    showMockup: 'tender',
    mockupPosition: 'below',
    scrollToElement: false
  },
  { 
    id: 'notification-tab-bautraeger', 
    title: 'Nie wieder etwas verpassen! 🔔', 
    description: 'Dein Benachrichtigungs-Tab rechts blinkt grün bei neuen Angeboten, Terminbestätigungen oder wichtigen Updates. Ein Klick zeigt dir sofort alle Details!', 
    pointer: 'left' 
  },
  {
    id: 'tour-mockup-kanban',
    title: 'Aufgaben organisieren 📋',
    description: 'Behalte den Überblick mit dem Kanban Board! Ziehe Aufgaben einfach zwischen "Zu erledigen", "In Bearbeitung" und "Erledigt". Perfekt für Teamarbeit und Projektmanagement.',
    pointer: 'auto',
    showMockup: 'kanban',
    mockupPosition: 'below',
    scrollToElement: false
  },
  { 
    id: 'dashboard-title', 
    title: 'Bereit durchzustarten! 🚀', 
    description: 'Das war\'s! Du kennst jetzt die wichtigsten Features. Erstelle dein erstes Projekt über das Radial Menu und erlebe, wie einfach Bauprojektmanagement sein kann. Viel Erfolg!', 
    pointer: 'bottom',
    scrollToElement: true 
  }
];

// Moderne, kompakte Dienstleister Tour - fokussiert auf Auftragsfindung
const dienstleisterSteps: TourStep[] = [
  { 
    id: 'dashboard-title', 
    title: 'Willkommen bei BuildWise! 🔧', 
    description: 'Perfekt! In 60 Sekunden zeige ich dir, wie du mit BuildWise neue Aufträge findest und gewinnst. Lass uns deine ersten Schritte zum Erfolg gehen!', 
    pointer: 'bottom' 
  },
  { 
    id: 'radial-menu-fab', 
    title: 'Dein Werkzeug-Center 🛠️', 
    description: 'Dieser Button ist dein Hauptwerkzeug! Klicke ihn jetzt an: Hier findest du alle Funktionen für Angebote, Aufgaben, Dokumente und Ressourcen – alles zentral an einem Ort.', 
    pointer: 'left',
    waitForClick: true 
  },
  {
    id: 'tour-mockup-tender',
    title: 'Aufträge finden & gewinnen 🎯',
    description: 'So findest du neue Projekte: Verfügbare Ausschreibungen mit Entfernung, Budget und Deadline. Erstelle professionelle Angebote direkt in der Plattform und gewinne lukrative Aufträge!',
    pointer: 'auto',
    showMockup: 'tender',
    mockupPosition: 'below',
    scrollToElement: false
  },
  {
    id: 'tour-mockup-geomap',
    title: 'Geografische Suche 🗺️', 
    description: 'Die Karte zeigt alle Aufträge in deiner Nähe! Jeder Marker ist ein potenzielles Projekt – mit Gewerk, Entfernung und Budget. Ein Klick und du kannst direkt bieten.', 
    pointer: 'auto',
    showMockup: 'geomap',
    mockupPosition: 'below',
    scrollToElement: false 
  },
  {
    id: 'tour-mockup-cost',
    title: 'Professionelle Angebote 💰',
    description: 'Unser Kalkulator hilft dir: Material, Arbeitszeit, Zusatzleistungen – alles wird automatisch berechnet. Erstelle in Minuten professionelle Kostenvoranschläge, die überzeugen!',
    pointer: 'auto',
    showMockup: 'cost',
    mockupPosition: 'below',
    scrollToElement: false
  },
  {
    id: 'resource-management-section',
    title: 'Deine Verfügbarkeit 📊',
    description: 'Erhöhe deine Sichtbarkeit! Hinterlege freie Kapazitäten, Stundensätze und Qualifikationen. Bauträger finden dich dann automatisch für passende Projekte – mehr Aufträge ohne Akquise!',
    pointer: 'auto',
    scrollToElement: false
  },
  { 
    id: 'notification-icon', 
    title: 'Keine Chance verpassen! 🔔', 
    description: 'Werde sofort benachrichtigt bei neuen Ausschreibungen in deiner Region, Auftragserteilungen oder Zahlungseingängen. Immer einen Schritt voraus!', 
    pointer: 'left' 
  },
  { 
    id: 'dashboard-title', 
    title: 'Jetzt durchstarten! 🚀', 
    description: 'Das war\'s! Du kennst jetzt die wichtigsten Tools. Vervollständige dein Profil, setze deine Verfügbarkeit und finde deine ersten Aufträge. Viel Erfolg!', 
    pointer: 'bottom',
    scrollToElement: true 
  }
];

function getElementRect(el: HTMLElement | null) {
  if (!el) return null;
  const rect = el.getBoundingClientRect();
  return {
    top: rect.top,
    left: rect.left,
    width: rect.width,
    height: rect.height,
    centerX: rect.left + rect.width / 2,
    centerY: rect.top + rect.height / 2,
  } as const;
}

function decidePointer(el: HTMLElement | null, stepId?: string): Pointer {
  if (!el) return 'auto';
  
  // Special handling for step 3 (Command Center)
  if (stepId === 'radial-menu-fab') {
    const rect = el.getBoundingClientRect();
    // FAB is bottom right, so always 'top' for better readability
    if (rect.bottom > window.innerHeight - 150) {
      return 'top';
    }
  }
  
  const rect = el.getBoundingClientRect();
  const vSpaceTop = rect.top;
  const vSpaceBottom = window.innerHeight - rect.bottom;
  if (vSpaceBottom > 160) return 'bottom';
  if (vSpaceTop > 160) return 'top';
  const hSpaceLeft = rect.left;
  const hSpaceRight = window.innerWidth - rect.right;
  if (hSpaceRight > hSpaceLeft) return 'right';
  return 'left';
}

function smoothScrollTo(element: HTMLElement, offset: number = 100) {
  const elementRect = element.getBoundingClientRect();
  const absoluteElementTop = elementRect.top + window.scrollY;
  const middle = absoluteElementTop - (window.innerHeight / 2) + (elementRect.height / 2);
  
  window.scrollTo({
    top: Math.max(0, middle - offset),
    behavior: 'smooth'
  });
}

export default function EnhancedGuidedTour({ 
  onClose, 
  onCompleted, 
  steps, 
  userRole = 'BAUTRAEGER' 
}: EnhancedGuidedTourProps) {
  useEnhancedTourStyles(); // Initialize styles with cleanup
  
  const { completeTour } = useOnboarding();
  const [current, setCurrent] = useState(0);
  const [activeEl, setActiveEl] = useState<HTMLElement | null>(null);
  const [waitingClick, setWaitingClick] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const mockupRef = useRef<HTMLDivElement>(null);
  const [rect, setRect] = useState<ReturnType<typeof getElementRect> | null>(null);

  // Use role-specific steps or provided steps
  const tourSteps = steps || (userRole === 'BAUTRAEGER' ? bautraegerSteps : dienstleisterSteps);
  const step = tourSteps[current];

  // Handle scrolling and element positioning
  useEffect(() => {
    let scrollTimeout: NodeJS.Timeout;

    const setupStep = async () => {
      // Cleanup previous hover state
      const prevEl = activeEl;
      if (prevEl && step?.id && !step.id.startsWith('radial-menu-')) {
        const leaveEvent = new MouseEvent('mouseleave', {
          view: window,
          bubbles: true,
          cancelable: true
        });
        prevEl.dispatchEvent(leaveEvent);
      }

      // Find target element or use mockup for tour-mockup steps
      let el: HTMLElement | null = null;
      
      if (step?.id.startsWith('tour-mockup-')) {
        // For mockup steps, target the mockup container
        el = mockupRef.current;
      } else {
        el = document.querySelector(`[data-tour-id="${step?.id}"]`) as HTMLElement | null;
      }

      setActiveEl(el);
      setRect(getElementRect(el));

      // Handle scrolling
      if (step?.scrollToElement !== false && el) {
        setIsScrolling(true);
        
        // Smooth scroll to element
        smoothScrollTo(el);
        
        scrollTimeout = setTimeout(() => {
          setIsScrolling(false);
          setRect(getElementRect(el));
        }, 800); // Wait for scroll to complete
      }

      // Handle special interactions
      if (el && step?.id && step.id.startsWith('radial-menu-') && step.id !== 'radial-menu-fab') {
        // Simulate hover to show tooltip
        setTimeout(() => {
          const event = new MouseEvent('mouseenter', {
            view: window,
            bubbles: true,
            cancelable: true
          });
          el.dispatchEvent(event);
        }, 100);
      }
    };

    setupStep();

    return () => {
      if (scrollTimeout) clearTimeout(scrollTimeout);
    };
  }, [current, step?.id, activeEl]);

  // Handle click waiting and special menu interactions
  useEffect(() => {
    if (step?.waitForClick && activeEl) {
      setWaitingClick(true);
      const handler = () => {
        setWaitingClick(false);
        setTimeout(() => setCurrent((c) => Math.min(c + 1, tourSteps.length - 1)), 600);
      };
      activeEl.addEventListener('click', handler, { once: true });
      return () => {
        activeEl.removeEventListener('click', handler as any);
      };
    } else {
      setWaitingClick(false);
    }

    // Handle radial menu interactions
    const fabButton = document.querySelector('[data-tour-id="radial-menu-fab"]') as HTMLElement;
    
    if (step?.id && step.id.startsWith('radial-menu-') && step.id !== 'radial-menu-fab') {
      if (fabButton && (!fabButton.getAttribute('aria-expanded') || fabButton?.getAttribute('aria-expanded') === 'false')) {
        setTimeout(() => {
          fabButton?.click();
        }, 200);
      }
    } else if (step?.id === 'dashboard-title' || !step?.id?.startsWith('radial-menu-')) {
      if (fabButton && fabButton.getAttribute('aria-expanded') === 'true') {
        setTimeout(() => {
          fabButton?.click();
        }, 100);
      }
    }
  }, [current, step?.id, step?.waitForClick, tourSteps.length, activeEl]);

  // Update rect on scroll/resize
  useEffect(() => {
    const update = () => {
      if (!isScrolling) {
        setRect(getElementRect(activeEl));
      }
    };
    update();
    window.addEventListener('scroll', update, true);
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update, true);
      window.removeEventListener('resize', update);
    };
  }, [activeEl, isScrolling]);

  // Keyboard navigation
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
      if (e.key === 'ArrowRight') next();
      if (e.key === 'ArrowLeft') prev();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const next = () => {
    console.log('🔴 NEXT BUTTON CLICKED!', { current, waitingClick, stepId: step?.id });
    if (current < tourSteps.length - 1) setCurrent(current + 1);
    else finish();
  };

  const prev = () => {
    console.log('🔴 PREV BUTTON CLICKED!', { current, waitingClick, stepId: step?.id });
    if (waitingClick) return;
    setCurrent((c) => Math.max(0, c - 1));
  };

  const finish = async () => {
    // Close radial menu if open
    const fabButton = document.querySelector('[data-tour-id="radial-menu-fab"]') as HTMLElement;
    if (fabButton?.getAttribute('aria-expanded') === 'true') {
      fabButton?.click();
    }
    
    // completeTour() aus dem OnboardingContext kümmert sich um die Datenbank-Aktualisierung
    await completeTour();
    onCompleted?.();
    onClose?.();
  };

  const handleClose = () => {
    const fabButton = document.querySelector('[data-tour-id="radial-menu-fab"]') as HTMLElement;
    if (fabButton?.getAttribute('aria-expanded') === 'true') {
      fabButton?.click();
    }
    onClose?.();
  };

  const pointer: Pointer = !step?.pointer || step.pointer === 'auto' ? decidePointer(activeEl, step?.id) : (step.pointer as Pointer);

  // Render mockup content
  const renderMockup = () => {
    if (!step?.showMockup) return null;

    const mockupComponents = {
      project: <ProjectMockup variant={userRole.toLowerCase() as 'bautraeger' | 'dienstleister'} />,
      tender: <TenderMockup variant={userRole.toLowerCase() as 'bautraeger' | 'dienstleister'} />,
      cost: <CostPositionMockup variant={userRole.toLowerCase() as 'bautraeger' | 'dienstleister'} />,
      todo: <TodoMockup variant={userRole.toLowerCase() as 'bautraeger' | 'dienstleister'} />,
      geomap: <GeoMapMockup variant={userRole.toLowerCase() as 'bautraeger' | 'dienstleister'} />,
      kanban: <KanbanMockup variant={userRole.toLowerCase() as 'bautraeger' | 'dienstleister'} />,
      tabs: <TabsMockup variant={userRole.toLowerCase() as 'bautraeger' | 'dienstleister'} />
    };

    return (
      <div 
        ref={mockupRef}
        className="w-full max-w-2xl mx-auto mt-6 mb-6 pointer-events-none"
        data-tour-id={step.id}
      >
        {mockupComponents[step.showMockup]}
      </div>
    );
  };

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[9999]"
      aria-hidden
      style={{ pointerEvents: 'none' }}
      data-tour-id-root
    >
      {/* Modern dimmer with subtle gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-black/60 via-black/50 to-black/60 backdrop-blur-[3px]" />

      {/* NO HIGHLIGHT FOR ANY STEP - GUARANTEED NO CLICK BLOCKING */}
      
      {/* Interactive hole for click-waiting steps */}
      {rect && waitingClick && (
        <>
          <svg
            className="absolute inset-0 pointer-events-none"
            style={{ width: '100%', height: '100%' }}
          >
            <defs>
              <mask id="highlight-mask">
                <rect x="0" y="0" width="100%" height="100%" fill="white" />
                <rect
                  x={rect.left - 8}
                  y={rect.top - 8}
                  width={rect.width + 16}
                  height={rect.height + 16}
                  rx="16"
                  fill="black"
                />
              </mask>
            </defs>
            <rect
              x="0"
              y="0"
              width="100%"
              height="100%"
              fill="rgba(0,0,0,0.4)"
              mask="url(#highlight-mask)"
            />
          </svg>
          <div
            className="absolute border-3 border-[#ffbd59] rounded-2xl animate-pulse shadow-[0_0_40px_rgba(255,189,89,0.8)]"
            style={{
              top: rect.top - 8,
              left: rect.left - 8,
              width: rect.width + 16,
              height: rect.height + 16,
              pointerEvents: 'none'
            }}
          />
        </>
      )}

      {/* Main content area */}
      <div className="absolute inset-0 pointer-events-none overflow-y-auto z-[9998]">
        <div className="min-h-full flex flex-col items-center justify-center p-4">
          {/* Modern tour card with glassmorphism */}
          {rect || step?.showMockup ? (
            <div
              className="max-w-lg bg-gradient-to-br from-gray-900/95 via-gray-800/95 to-gray-900/95 backdrop-blur-xl border-2 border-[#ffbd59]/60 text-white rounded-3xl p-8 shadow-2xl pointer-events-auto relative overflow-hidden z-[9999]"
              style={{
                marginTop: rect && !step?.showMockup ? (() => {
                  const cardHeight = 250;
                  
                  if (step?.id === 'radial-menu-fab') {
                    return Math.max(rect.top - cardHeight - 80, 20);
                  }
                  
                  if (pointer === 'bottom') return Math.min(rect.top + rect.height + 20, window.innerHeight - cardHeight - 20);
                  if (pointer === 'top') return Math.max(rect.top - 24 - cardHeight, 20);
                  const mid = rect.top + rect.height / 2 - cardHeight / 2;
                  return Math.min(Math.max(mid, 20), window.innerHeight - cardHeight - 20);
                })() : undefined,
                boxShadow: `
                  0 0 60px rgba(255,189,89,0.3),
                  0 20px 40px rgba(0,0,0,0.4),
                  inset 0 0 40px rgba(255,189,89,0.05)
                `
              }}
            >
              {/* Animated background glow effect */}
              <div 
                className="absolute inset-0 opacity-30"
                style={{
                  background: 'radial-gradient(circle at 50% 0%, rgba(255,189,89,0.2) 0%, transparent 70%)',
                  animation: 'subtle-glow 3s ease-in-out infinite'
                }}
              />
              
              {/* Content wrapper */}
              <div className="relative z-10">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex-1">
                    {/* Step indicator badge */}
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#ffbd59]/20 border border-[#ffbd59]/40 rounded-full mb-3">
                      <div className="w-2 h-2 bg-[#ffbd59] rounded-full animate-pulse" />
                      <span className="text-xs font-semibold text-[#ffbd59]">
                        Schritt {current + 1} von {tourSteps.length}
                      </span>
                    </div>
                    
                    <h3 className="text-2xl font-bold mb-3 leading-tight bg-gradient-to-r from-white to-[#ffbd59] bg-clip-text text-transparent">
                      {step?.title}
                    </h3>
                    <p className="text-gray-100 leading-relaxed text-base">{step?.description}</p>
                    {step?.customContent && (
                      <div className="mt-4">
                        {step.customContent}
                      </div>
                    )}
                  </div>
                  <button
                    className="p-2 rounded-xl hover:bg-white/10 transition-all duration-200 hover:scale-110 active:scale-95"
                    onClick={handleClose}
                    title="Tour beenden"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Mockup content */}
              {step?.showMockup && (
                <div className="mb-6">
                  {renderMockup()}
                  {step?.scrollToElement && (
                    <div className="flex justify-center mt-4">
                      <ChevronDown className="w-6 h-6 text-[#ffbd59] animate-bounce" />
                    </div>
                  )}
                </div>
              )}

              {/* Modern progress bar */}
              <div className="relative mt-6 mb-6">
                <div className="flex items-center justify-between text-sm text-gray-300 mb-2">
                  <span className="font-medium">Fortschritt</span>
                  <span className="font-semibold text-[#ffbd59]">{Math.round(((current + 1) / tourSteps.length) * 100)}%</span>
                </div>
                <div className="w-full h-2 bg-gray-700/50 rounded-full overflow-hidden relative">
                  <div 
                    className="h-full bg-gradient-to-r from-[#ffbd59] to-[#ffa726] rounded-full transition-all duration-500 ease-out relative"
                    style={{ width: `${((current + 1) / tourSteps.length) * 100}%` }}
                  >
                    {/* Shimmer effect */}
                    <div 
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                      style={{
                        animation: 'shimmer 2s infinite',
                        transform: 'translateX(-100%)'
                      }}
                    />
                  </div>
                  {/* Glow effect */}
                  <div 
                    className="absolute top-0 h-full bg-[#ffbd59] blur-md opacity-50 transition-all duration-500"
                    style={{ 
                      width: `${((current + 1) / tourSteps.length) * 100}%`,
                      left: 0
                    }}
                  />
                </div>
              </div>
              
              {/* Keyboard shortcuts hint */}
              <div className="flex items-center justify-center gap-2 mb-3 text-xs text-gray-400">
                <Sparkles className="w-3 h-3" />
                <span>Tipp: Nutze ← → Pfeiltasten oder ESC zum Beenden</span>
              </div>
              
              {/* Navigation controls with modern styling */}
              <div className="flex items-center justify-between gap-3 pt-4 border-t border-gray-700/50">
                <button
                  className="group flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed border border-white/10 hover:border-white/20 transition-all duration-200 hover:scale-105 active:scale-95 disabled:hover:scale-100"
                  onClick={prev}
                  disabled={current === 0 || waitingClick}
                >
                  <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                  <span>Zurück</span>
                </button>
                
                <div className="flex gap-3">
                  {current < tourSteps.length - 1 && (
                    <button
                      className="group flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#ffbd59] to-[#ffa726] hover:from-[#ffa726] hover:to-[#ff9800] text-[#2c3539] text-sm font-bold transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg hover:shadow-[#ffbd59]/50"
                      onClick={next}
                    >
                      <span>Weiter</span>
                      <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                    </button>
                  )}
                  
                  {waitingClick && (
                    <div className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-orange-500/20 text-orange-300 text-sm font-medium border border-orange-500/40">
                      <div className="w-2 h-2 bg-orange-400 rounded-full animate-ping" />
                      <span className="animate-pulse">Bitte klicken…</span>
                    </div>
                  )}
                  
                  {current === tourSteps.length - 1 && (
                    <button
                      className="group flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white text-sm font-bold transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg hover:shadow-green-500/50"
                      onClick={finish}
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>Tour beenden</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="max-w-lg bg-gradient-to-br from-gray-900/95 via-gray-800/95 to-gray-900/95 backdrop-blur-xl border-2 border-[#ffbd59]/60 text-white rounded-3xl p-8 shadow-2xl pointer-events-auto relative overflow-hidden z-[9999]">
              {/* Animated background glow */}
              <div 
                className="absolute inset-0 opacity-30"
                style={{
                  background: 'radial-gradient(circle at 50% 0%, rgba(255,189,89,0.2) 0%, transparent 70%)',
                  animation: 'subtle-glow 3s ease-in-out infinite'
                }}
              />
              
              <div className="relative z-10">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex-1">
                    {/* Step indicator badge */}
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#ffbd59]/20 border border-[#ffbd59]/40 rounded-full mb-3">
                      <div className="w-2 h-2 bg-[#ffbd59] rounded-full animate-pulse" />
                      <span className="text-xs font-semibold text-[#ffbd59]">
                        Schritt {current + 1} von {tourSteps.length}
                      </span>
                    </div>
                    
                    <h3 className="text-2xl font-bold mb-3 leading-tight bg-gradient-to-r from-white to-[#ffbd59] bg-clip-text text-transparent">
                      {step?.title}
                    </h3>
                    <p className="text-gray-100 leading-relaxed text-base">{step?.description}</p>
                  </div>
                  <button 
                    className="p-2 rounded-xl hover:bg-white/10 transition-all duration-200 hover:scale-110 active:scale-95" 
                    onClick={handleClose}
                    title="Tour beenden"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                {/* Progress bar */}
                <div className="relative mt-6 mb-6">
                  <div className="flex items-center justify-between text-sm text-gray-300 mb-2">
                    <span className="font-medium">Fortschritt</span>
                    <span className="font-semibold text-[#ffbd59]">{Math.round(((current + 1) / tourSteps.length) * 100)}%</span>
                  </div>
                  <div className="w-full h-2 bg-gray-700/50 rounded-full overflow-hidden relative">
                    <div 
                      className="h-full bg-gradient-to-r from-[#ffbd59] to-[#ffa726] rounded-full transition-all duration-500 ease-out relative"
                      style={{ width: `${((current + 1) / tourSteps.length) * 100}%` }}
                    >
                      <div 
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                        style={{
                          animation: 'shimmer 2s infinite',
                          transform: 'translateX(-100%)'
                        }}
                      />
                    </div>
                    <div 
                      className="absolute top-0 h-full bg-[#ffbd59] blur-md opacity-50 transition-all duration-500"
                      style={{ 
                        width: `${((current + 1) / tourSteps.length) * 100}%`,
                        left: 0
                      }}
                    />
                  </div>
                </div>
                
                {/* Keyboard shortcuts hint */}
                <div className="flex items-center justify-center gap-2 mb-3 text-xs text-gray-400">
                  <Sparkles className="w-3 h-3" />
                  <span>Tipp: Nutze ← → Pfeiltasten oder ESC zum Beenden</span>
                </div>
                
                {/* Navigation */}
                <div className="flex items-center justify-between gap-3 pt-4 border-t border-gray-700/50">
                  <button 
                    className="group flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed border border-white/10 hover:border-white/20 transition-all duration-200 hover:scale-105 active:scale-95 disabled:hover:scale-100" 
                    onClick={prev} 
                    disabled={current === 0}
                  >
                    <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                    <span>Zurück</span>
                  </button>
                  <div className="flex gap-3">
                    {current < tourSteps.length - 1 && (
                      <button 
                        className="group flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#ffbd59] to-[#ffa726] hover:from-[#ffa726] hover:to-[#ff9800] text-[#2c3539] text-sm font-bold transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg hover:shadow-[#ffbd59]/50" 
                        onClick={next}
                      >
                        <span>Weiter</span>
                        <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                      </button>
                    )}
                    {current === tourSteps.length - 1 && (
                      <button 
                        className="group flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white text-sm font-bold transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg hover:shadow-green-500/50" 
                        onClick={finish}
                      >
                        <CheckCircle className="w-4 h-4" />
                        <span>Tour beenden</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}