import React, { useEffect, useMemo, useRef, useState } from 'react';
import { X, ArrowRight, ArrowLeft, CheckCircle, ChevronDown } from 'lucide-react';
import { useOnboarding } from '../../context/OnboardingContext';
import { ProjectMockup, TenderMockup, CostPositionMockup, TodoMockup, GeoMapMockup, KanbanMockup, TabsMockup } from './TourMockups';

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

// Bauträger Steps with mockups and scrolling
const bautraegerSteps: TourStep[] = [
  { 
    id: 'dashboard-title', 
    title: 'Willkommen bei BuildWise! 🏗️', 
    description: 'Perfekt! Sie sind jetzt als Bauträger angemeldet. Ich führe Sie durch die wichtigsten Funktionen – das dauert nur 3 Minuten und zeigt Ihnen, wie BuildWise Ihre Bauprojekte revolutioniert.', 
    pointer: 'bottom' 
  },
  {
    id: 'tour-mockup-projects',
    title: 'So werden Ihre Projekte aussehen! ✨',
    description: 'Hier sehen Sie eine Vorschau, wie Ihre Bauprojekte im Dashboard dargestellt werden. Jedes Projekt zeigt Ihnen auf einen Blick: Fortschritt, Budget, aktuelle Bauphase und alle wichtigen Kennzahlen.',
    pointer: 'auto',
    showMockup: 'project',
    mockupPosition: 'below',
    scrollToElement: false
  },
  { 
    id: 'radial-menu-fab', 
    title: 'Ihr Kommandozentrum: Das Radial Menu! 🎯', 
    description: 'Klicken Sie jetzt auf das Plus-Symbol! Hier finden Sie alle wichtigen Funktionen: Projekte erstellen, Gewerke verwalten, Ausschreibungen starten, Dokumente hochladen und vieles mehr.', 
    pointer: 'left',
    waitForClick: true 
  },
  { 
    id: 'radial-menu-fab', 
    title: 'Personalisierung leicht gemacht! 🎨', 
    description: 'Pro-Tipp: Sie können alle Buttons im Radial Menu per Drag & Drop neu anordnen! Ziehen Sie einfach die Buttons an Ihre bevorzugten Positionen – BuildWise merkt sich Ihre Einstellungen.', 
    pointer: 'top' 
  },
  { 
    id: 'dashboard-projects', 
    title: 'Ihre Projektzentrale', 
    description: 'Hier sehen Sie alle Ihre Bauprojekte im Überblick. Jedes Projekt zeigt Status, Fortschritt und wichtige Kennzahlen. Sie können zwischen verschiedenen Projekten wechseln und alle Details auf einen Blick erfassen.', 
    pointer: 'auto' 
  },
  {
    id: 'tour-mockup-tender',
    title: 'Ausschreibungen & Angebote verwalten 📋',
    description: 'So organisieren Sie Ihre Ausschreibungen! Sie sehen den Status jeder Ausschreibung, wie viele Angebote eingegangen sind und können diese direkt vergleichen und bewerten.',
    pointer: 'auto',
    showMockup: 'tender',
    mockupPosition: 'below',
    scrollToElement: true
  },
  {
    id: 'tour-mockup-cost',
    title: 'Kostenkontrolle in Echtzeit 💰',
    description: 'Behalten Sie Ihre Finanzen im Blick! Jede Kostenposition wird übersichtlich dargestellt – von genehmigten Ausgaben bis zu ausstehenden Rechnungen. So verlieren Sie nie den Überblick über Ihr Budget.',
    pointer: 'auto',
    showMockup: 'cost',
    mockupPosition: 'below',
    scrollToElement: true
  },
  { 
    id: 'navbar-logo', 
    title: 'Die Navigation', 
    description: 'Die obere Leiste bietet Schnellzugriff auf wichtige Funktionen. Lass uns die einzelnen Bereiche anschauen.', 
    pointer: 'bottom',
    scrollToElement: true 
  },
  { 
    id: 'navbar-credits', 
    title: 'Ihr Credit-System 💳', 
    description: 'Hier sehen Sie Ihr aktuelles Credit-Guthaben. Credits ermöglichen Ihnen den Zugang zu Premium-Funktionen wie erweiterte Analysen, automatische Berichte und Priority-Support.', 
    pointer: 'bottom' 
  },
  { 
    id: 'notification-tab-bautraeger', 
    title: 'Ihr Benachrichtigungs-Center! 🔔', 
    description: 'Hier rechts am Bildschirmrand finden Sie Ihre Benachrichtigungen. Sobald Dienstleister auf Anfragen antworten oder neue Angebote eingehen, werden Sie sofort informiert!', 
    pointer: 'left' 
  },
  {
    id: 'tour-mockup-kanban',
    title: 'Kanban Board: Drag & Drop Aufgabenverwaltung 📋',
    description: 'Organisieren Sie Ihre Aufgaben mit unserem intuitiven Kanban Board! Ziehen Sie Aufgaben einfach per Drag & Drop zwischen den Spalten "Zu erledigen", "In Bearbeitung" und "Abgeschlossen". So behalten Sie den Überblick über alle Projektaufgaben.',
    pointer: 'auto',
    showMockup: 'kanban',
    mockupPosition: 'below',
    scrollToElement: true
  },
  {
    id: 'geo-search-section',
    title: 'Ressourcen in Ihrer Nähe finden 🎯',
    description: 'Finden Sie qualifizierte Dienstleister in Ihrer Region! Die Geo-Suche zeigt Ihnen alle verfügbaren Ressourcen auf einer interaktiven Karte. Sie können nach Gewerken filtern, Entfernungen einstellen und direkt Kontakt zu Dienstleistern aufnehmen.',
    pointer: 'auto',
    scrollToElement: true
  },
  {
    id: 'resource-search-filters',
    title: 'Erweiterte Ressourcenfilter 🔍', 
    description: 'Nutzen Sie die erweiterten Filter um genau die Ressourcen zu finden, die Sie brauchen: Nach Kategorie, Verfügbarkeit, Entfernung, Preisvorstellungen und spezifischen Qualifikationen. So sparen Sie Zeit und finden die perfekten Partner für Ihr Projekt.',
    pointer: 'auto',
    scrollToElement: true
  },
  { 
    id: 'navbar-profile', 
    title: 'Ihr Profil-Bereich', 
    description: 'Verwalten Sie hier Ihre Einstellungen, Credits und Unternehmensdaten. Sie können auch Ihr Abonnement upgraden oder Team-Mitglieder einladen.', 
    pointer: 'bottom' 
  },
  { 
    id: 'dashboard-title', 
    title: 'Sie sind startklar! 🎉', 
    description: 'Perfekt! Sie kennen jetzt alle wichtigen Bereiche von BuildWise. Erstellen Sie Ihr erstes Projekt oder erkunden Sie die Plattform auf eigene Faust. Unser Support-Team hilft Ihnen gerne bei Fragen weiter!', 
    pointer: 'bottom',
    scrollToElement: true 
  }
];

// Dienstleister Steps with different focus
const dienstleisterSteps: TourStep[] = [
  { 
    id: 'dashboard-title', 
    title: 'Willkommen bei BuildWise! 🔧', 
    description: 'Großartig! Sie sind jetzt als Dienstleister registriert. Ich zeige Ihnen, wie Sie mit BuildWise neue Aufträge finden, Angebote erstellen und Ihre Projekte verwalten können.', 
    pointer: 'bottom' 
  },
  {
    id: 'tour-mockup-projects',
    title: 'Ihre Projekte im Überblick! ✨',
    description: 'So sehen Ihre laufenden und potenziellen Projekte aus. Sie sehen sofort: eingereichte Angebote, gewonnene Aufträge und deren Status. Alles übersichtlich an einem Ort.',
    pointer: 'auto',
    showMockup: 'project',
    mockupPosition: 'below',
    scrollToElement: false
  },
  {
    id: 'tour-mockup-tender',
    title: 'Neue Aufträge finden & verwalten 🎯',
    description: 'Hier finden Sie verfügbare Ausschreibungen in Ihrer Region! Sie sehen die Entfernung, Deadlines und können direkt Angebote abgeben. Gewonnene Aufträge werden separat verwaltet.',
    pointer: 'auto',
    showMockup: 'tender',
    mockupPosition: 'below',
    scrollToElement: true
  },
  {
    id: 'tour-mockup-geomap',
    title: 'Geografische Auftragssuche 🗺️', 
    description: 'Entdecken Sie Aufträge in Ihrer Nähe! Auf der interaktiven Karte sehen Sie alle verfügbaren Ausschreibungen als Marker. Jeder Marker zeigt Ihnen Gewerk, Entfernung und Budget. Klicken Sie einfach auf einen Marker, um direkt ein Angebot abzugeben.', 
    pointer: 'auto',
    showMockup: 'geomap',
    mockupPosition: 'below',
    scrollToElement: true 
  },
  {
    id: 'tour-mockup-cost',
    title: 'Professionelle Angebotserstellung 💰',
    description: 'Erstellen Sie detaillierte Kostenvoranschläge mit unserem integrierten Kalkulator. Material, Arbeitszeit, Zusatzleistungen – alles wird automatisch berechnet und professionell formatiert.',
    pointer: 'auto',
    showMockup: 'cost',
    mockupPosition: 'below',
    scrollToElement: true
  },
  { 
    id: 'service-provider-tabs', 
    title: 'Ihre Arbeitsorganisation', 
    description: 'Wechseln Sie zwischen "Angebote erstellen", "Laufende Projekte" und "Abgeschlossene Arbeiten". Jeder Bereich ist auf Ihre Arbeitsweise optimiert.', 
    pointer: 'auto',
    scrollToElement: true 
  },
  {
    id: 'tour-mockup-kanban',
    title: 'Aufgaben-Kanban: Organisiert durch Drag & Drop 📋',
    description: 'Verwalten Sie Ihre Projektaufgaben mit dem praktischen Kanban Board! Verschieben Sie Aufgaben einfach per Drag & Drop zwischen "Zu erledigen", "In Bearbeitung" und "Abgeschlossen". Perfekt für die Übersicht über alle Ihre laufenden Arbeiten.',
    pointer: 'auto',
    showMockup: 'kanban',
    mockupPosition: 'below',
    scrollToElement: true
  },
  {
    id: 'tour-mockup-todo',
    title: 'Termine & Deadlines verwalten 📋',
    description: 'Behalten Sie alle wichtigen Termine im Blick: von Angebots-Deadlines bis zu Projektmeilensteinen und Rechnungsstellungen. Nie wieder wichtige Fristen verpassen!',
    pointer: 'auto',
    showMockup: 'todo',
    mockupPosition: 'below',
    scrollToElement: true
  },
  {
    id: 'resource-management-section',
    title: 'Ihre Ressourcenverwaltung 🛠️',
    description: 'Verwalten Sie hier Ihre verfügbaren Kapazitäten! Legen Sie Ihre freien Termine, Mitarbeiteranzahl, Stundensätze und Spezialqualifikationen fest. Je detaillierter Ihr Profil, desto häufiger werden Sie für passende Projekte gefunden.',
    pointer: 'auto',
    scrollToElement: true
  },
  {
    id: 'resource-create-button',
    title: 'Ressourcen ausschreiben ➕',
    description: 'Klicken Sie hier um eine neue Ressource zu erstellen! Geben Sie Ihren Zeitraum, Ihre Kapazitäten und Preise an. Bauträger können dann gezielt nach Ihren Leistungen suchen und Sie für Projekte vorauewählen.',
    pointer: 'auto',
    scrollToElement: true
  },
  {
    id: 'resource-stats',
    title: 'Ihre Leistungskennzahlen 📊',
    description: 'Behalten Sie den Überblick über Ihre Auslastung! Hier sehen Sie Ihre verfügbaren Personentage, gebuchte Kapazitäten und Ihren Auslastungsgrad. Diese KPIs helfen Ihnen bei der optimalen Ressourcenplanung.',
    pointer: 'auto',
    scrollToElement: true
  },
  { 
    id: 'radial-menu-fab', 
    title: 'Ihr Werkzeug-Center: Das Radial Menu! 🛠️', 
    description: 'Entdecken Sie Ihr persönliches Werkzeug-Center! Das Radial Menu bietet Ihnen schnellen Zugriff auf alle wichtigen Funktionen: Aufgaben verwalten, Dokumente hochladen, Rechnungen erstellen und Ihr Archiv durchsuchen.', 
    pointer: 'left' 
  },
  { 
    id: 'notification-icon', 
    title: 'Ihre Benachrichtigungen 🔔', 
    description: 'Werden Sie sofort informiert über neue Ausschreibungen in Ihrer Region, Auftragserteilungen und Zahlungseingänge. Verpassen Sie keine Geschäftschance!', 
    pointer: 'left' 
  },
  { 
    id: 'navbar-profile', 
    title: 'Ihr Unternehmensprofil', 
    description: 'Pflegen Sie hier Ihr Firmenprofil, Referenzen und Zertifikate. Ein vollständiges Profil erhöht Ihre Chancen bei Ausschreibungen erheblich.', 
    pointer: 'bottom' 
  },
  { 
    id: 'dashboard-title', 
    title: 'Bereit für neue Aufträge! 🚀', 
    description: 'Perfekt! Sie können jetzt mit BuildWise durchstarten. Schauen Sie sich verfügbare Ausschreibungen an oder vervollständigen Sie Ihr Profil. Viel Erfolg bei Ihren ersten Projekten!', 
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
    if (current < tourSteps.length - 1) setCurrent(current + 1);
    else finish();
  };

  const prev = () => {
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
      kanban: <KanbanMockup variant={userRole.toLowerCase() as 'bautraeger' | 'dienstleister'} />
    };

    return (
      <div 
        ref={mockupRef}
        className="w-full max-w-2xl mx-auto mt-6 mb-6"
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
      {/* Enhanced dimmer */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" />

      {/* Enhanced highlight box around target */}
      {rect && !waitingClick && (
        <>
          {/* Main highlight border with enhanced visibility */}
          <div
            className="absolute border-4 border-[#ffbd59] rounded-2xl shadow-[0_0_50px_rgba(255,189,89,0.8)] animate-pulse"
            style={{
              top: rect.top - 12,
              left: rect.left - 12,
              width: rect.width + 24,
              height: rect.height + 24,
              pointerEvents: 'none',
              boxShadow: '0 0 0 9999px rgba(0,0,0,0.5), 0 0 60px rgba(255,189,89,0.6), inset 0 0 20px rgba(255,189,89,0.3)'
            }}
          />
          {/* Secondary glow effect */}
          <div
            className="absolute border-2 border-[#ffa726] rounded-2xl animate-pulse"
            style={{
              top: rect.top - 8,
              left: rect.left - 8,
              width: rect.width + 16,
              height: rect.height + 16,
              pointerEvents: 'none',
              boxShadow: '0 0 30px rgba(255,167,38,0.7)'
            }}
          />
          {/* Subtle inner highlight */}
          <div
            className="absolute border border-white/30 rounded-xl"
            style={{
              top: rect.top - 4,
              left: rect.left - 4,
              width: rect.width + 8,
              height: rect.height + 8,
              pointerEvents: 'none'
            }}
          />
        </>
      )}
      
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
      <div className="absolute inset-0 pointer-events-none overflow-y-auto">
        <div className="min-h-full flex flex-col items-center justify-center p-4">
          {/* Tour tooltip/card */}
          {rect || step?.showMockup ? (
            <div
              className="max-w-lg bg-gray-900/95 backdrop-blur-md border border-[#ffbd59]/50 text-white rounded-2xl p-6 shadow-2xl pointer-events-auto"
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
                })() : undefined
              }}
            >
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex-1">
                  <h3 className="text-xl font-bold mb-3 leading-tight">{step?.title}</h3>
                  <p className="text-gray-100 leading-relaxed">{step?.description}</p>
                  {step?.customContent && (
                    <div className="mt-4">
                      {step.customContent}
                    </div>
                  )}
                </div>
                <button
                  className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                  onClick={handleClose}
                >
                  <X className="w-5 h-5" />
                </button>
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

              {/* Navigation controls */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-700">
                <div className="text-sm text-gray-300">
                  Schritt {current + 1} von {tourSteps.length}
                  <div className="w-32 bg-gray-700 rounded-full h-1 mt-1">
                    <div 
                      className="bg-[#ffbd59] h-1 rounded-full transition-all duration-300"
                      style={{ width: `${((current + 1) / tourSteps.length) * 100}%` }}
                    />
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <button
                    className="px-4 py-2 rounded-lg bg-gray-700/80 hover:bg-gray-600/80 text-white text-sm disabled:opacity-50 disabled:cursor-not-allowed border border-gray-600 transition-colors"
                    onClick={prev}
                    disabled={current === 0 || waitingClick}
                  >
                    <ArrowLeft className="w-4 h-4 inline-block mr-1" /> Zurück
                  </button>
                  
                  {current < tourSteps.length - 1 && !waitingClick && (
                    <button
                      className="px-4 py-2 rounded-lg bg-[#ffbd59] hover:bg-[#ffa726] text-[#2c3539] text-sm font-semibold transition-colors"
                      onClick={next}
                    >
                      Weiter <ArrowRight className="w-4 h-4 inline-block ml-1" />
                    </button>
                  )}
                  
                  {waitingClick && (
                    <span className="px-4 py-2 rounded-lg bg-orange-500/20 text-orange-300 text-sm border border-orange-500/30 animate-pulse">
                      Bitte klicken…
                    </span>
                  )}
                  
                  {current === tourSteps.length - 1 && (
                    <button
                      className="px-4 py-2 rounded-lg bg-green-500 hover:bg-green-600 text-white text-sm font-semibold transition-colors"
                      onClick={finish}
                    >
                      <CheckCircle className="w-4 h-4 inline-block mr-1" /> Tour beenden
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="max-w-lg bg-gray-900/95 backdrop-blur-md border border-[#ffbd59]/50 text-white rounded-2xl p-6 shadow-2xl pointer-events-auto">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-xl font-bold mb-3">{step?.title}</h3>
                  <p className="text-gray-100 leading-relaxed">{step?.description}</p>
                </div>
                <button className="p-2 rounded-lg hover:bg-white/10 transition-colors" onClick={handleClose}>
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="flex items-center justify-between pt-4 border-t border-gray-700">
                <div className="text-sm text-gray-300">Schritt {current + 1} von {tourSteps.length}</div>
                <div className="flex gap-3">
                  <button 
                    className="px-4 py-2 rounded-lg bg-gray-700/80 hover:bg-gray-600/80 text-white text-sm disabled:opacity-50" 
                    onClick={prev} 
                    disabled={current === 0}
                  >
                    <ArrowLeft className="w-4 h-4 inline-block mr-1" /> Zurück
                  </button>
                  {current < tourSteps.length - 1 && (
                    <button 
                      className="px-4 py-2 rounded-lg bg-[#ffbd59] hover:bg-[#ffa726] text-[#2c3539] text-sm font-semibold" 
                      onClick={next}
                    >
                      Weiter <ArrowRight className="w-4 h-4 inline-block ml-1" />
                    </button>
                  )}
                  {current === tourSteps.length - 1 && (
                    <button 
                      className="px-4 py-2 rounded-lg bg-green-500 hover:bg-green-600 text-white text-sm font-semibold" 
                      onClick={finish}
                    >
                      <CheckCircle className="w-4 h-4 inline-block mr-1" /> Tour beenden
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}