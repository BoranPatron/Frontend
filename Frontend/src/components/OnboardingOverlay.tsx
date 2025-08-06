import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  ChevronRight, 
  ChevronLeft, 
  Home, 
  Globe, 
  Star, 
  Settings, 
  Plus,
  MessageCircle,
  BarChart3,
  FileText,
  Handshake,
  DollarSign,
  Palette,
  CheckSquare,
  Target,
  Calendar,
  Coins,
  MapPin,
  Users,
  Building,
  ClipboardList
} from 'lucide-react';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  targetSelector: string;
  position: 'top' | 'bottom' | 'left' | 'right' | 'center';
  highlightElement?: boolean;
  showArrow?: boolean;
  action?: () => void;
  icon?: React.ReactNode;
}

interface OnboardingOverlayProps {
  isVisible: boolean;
  onComplete: () => void;
  onSkip: () => void;
  userType: 'beta' | 'new';
}

const OnboardingOverlay: React.FC<OnboardingOverlayProps> = ({
  isVisible,
  onComplete,
  onSkip,
  userType
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [highlightedElement, setHighlightedElement] = useState<HTMLElement | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  // Onboarding-Schritte für verschiedene User-Typen
  const getOnboardingSteps = (): OnboardingStep[] => {
    const baseSteps: OnboardingStep[] = [
      {
        id: 'welcome',
        title: 'Willkommen bei BuildWise!',
        description: 'Entdecken Sie die wichtigsten Funktionen unserer Plattform. Wir führen Sie durch die wichtigsten Bereiche.',
        targetSelector: 'body',
        position: 'center',
        icon: <Building className="w-8 h-8 text-blue-500" />
      },
      {
        id: 'navbar',
        title: 'Navigation & Hauptmenü',
        description: 'Hier finden Sie alle wichtigen Bereiche: Projekte, Nachrichten, Finanzen und mehr. Nutzen Sie die Favoriten-Funktion für schnellen Zugriff.',
        targetSelector: 'nav',
        position: 'bottom',
        highlightElement: true,
        showArrow: true,
        icon: <Home className="w-6 h-6 text-blue-500" />
      },
      {
        id: 'dashboard',
        title: 'Dashboard & Übersicht',
        description: 'Ihr zentraler Arbeitsbereich mit allen wichtigen Informationen auf einen Blick.',
        targetSelector: '[data-testid="dashboard"]',
        position: 'bottom',
        highlightElement: true,
        icon: <BarChart3 className="w-6 h-6 text-green-500" />
      },
      {
        id: 'projects',
        title: 'Projektmanagement',
        description: 'Erstellen und verwalten Sie Ihre Bauprojekte. Hier können Sie alle Projektdetails einsehen und bearbeiten.',
        targetSelector: '[data-testid="projects-section"]',
        position: 'right',
        highlightElement: true,
        icon: <Building className="w-6 h-6 text-orange-500" />
      },
      {
        id: 'messages',
        title: 'Kommunikation',
        description: 'Tauschen Sie sich mit Ihrem Team aus. Nachrichten, Termine und wichtige Updates finden Sie hier.',
        targetSelector: '[data-testid="messages-section"]',
        position: 'left',
        highlightElement: true,
        icon: <MessageCircle className="w-6 h-6 text-purple-500" />
      },
      {
        id: 'finance',
        title: 'Finanzmanagement',
        description: 'Behalten Sie Ihre Kosten im Überblick. Rechnungen, Angebote und Finanzberichte auf einen Blick.',
        targetSelector: '[data-testid="finance-section"]',
        position: 'top',
        highlightElement: true,
        icon: <DollarSign className="w-6 h-6 text-green-500" />
      },
      {
        id: 'tasks',
        title: 'Aufgaben & Zeitplan',
        description: 'Verwalten Sie Aufgaben und behalten Sie den Zeitplan im Auge. Hier sehen Sie alle anstehenden Arbeiten.',
        targetSelector: '[data-testid="tasks-section"]',
        position: 'bottom',
        highlightElement: true,
        icon: <CheckSquare className="w-6 h-6 text-blue-500" />
      },
      {
        id: 'geo-search',
        title: 'Geografische Suche',
        description: 'Finden Sie Dienstleister in Ihrer Nähe. Die Kartenansicht zeigt Ihnen alle verfügbaren Partner.',
        targetSelector: '[data-testid="geo-search"]',
        position: 'left',
        highlightElement: true,
        icon: <MapPin className="w-6 h-6 text-red-500" />
      },
      {
        id: 'favorites',
        title: 'Favoriten & Schnellzugriff',
        description: 'Speichern Sie häufig genutzte Funktionen als Favoriten für schnellen Zugriff.',
        targetSelector: '[data-testid="favorites"]',
        position: 'right',
        highlightElement: true,
        icon: <Star className="w-6 h-6 text-yellow-500" />
      }
    ];

    // Zusätzliche Schritte für Beta-User
    if (userType === 'beta') {
      baseSteps.push(
        {
          id: 'beta-features',
          title: 'Beta-Features',
          description: 'Als Beta-User haben Sie Zugriff auf neue Funktionen. Testen Sie diese und geben Sie uns Feedback!',
          targetSelector: '[data-testid="beta-features"]',
          position: 'center',
          highlightElement: true,
          icon: <Target className="w-6 h-6 text-purple-500" />
        },
        {
          id: 'feedback',
          title: 'Feedback & Support',
          description: 'Helfen Sie uns dabei, die Plattform zu verbessern. Ihr Feedback ist wertvoll für uns!',
          targetSelector: '[data-testid="feedback-section"]',
          position: 'bottom',
          highlightElement: true,
          icon: <MessageCircle className="w-6 h-6 text-blue-500" />
        }
      );
    }

    return baseSteps;
  };

  const steps = getOnboardingSteps();

  // Element-Hervorhebung
  useEffect(() => {
    if (!isVisible || currentStep >= steps.length) return;

    const step = steps[currentStep];
    const targetElement = document.querySelector(step.targetSelector) as HTMLElement;

    if (targetElement && step.highlightElement) {
      setHighlightedElement(targetElement);
      targetElement.style.zIndex = '9999';
      targetElement.style.position = 'relative';
    } else {
      setHighlightedElement(null);
    }

    return () => {
      if (targetElement) {
        targetElement.style.zIndex = '';
        targetElement.style.position = '';
      }
    };
  }, [currentStep, isVisible, steps]);

  // Tooltip-Positionierung
  useEffect(() => {
    if (!highlightedElement || !tooltipRef.current) return;

    const rect = highlightedElement.getBoundingClientRect();
    const tooltip = tooltipRef.current;
    const step = steps[currentStep];

    let top = 0;
    let left = 0;

    switch (step.position) {
      case 'top':
        top = rect.top - tooltip.offsetHeight - 10;
        left = rect.left + (rect.width / 2) - (tooltip.offsetWidth / 2);
        break;
      case 'bottom':
        top = rect.bottom + 10;
        left = rect.left + (rect.width / 2) - (tooltip.offsetWidth / 2);
        break;
      case 'left':
        top = rect.top + (rect.height / 2) - (tooltip.offsetHeight / 2);
        left = rect.left - tooltip.offsetWidth - 10;
        break;
      case 'right':
        top = rect.top + (rect.height / 2) - (tooltip.offsetHeight / 2);
        left = rect.right + 10;
        break;
      case 'center':
        top = window.innerHeight / 2 - tooltip.offsetHeight / 2;
        left = window.innerWidth / 2 - tooltip.offsetWidth / 2;
        break;
    }

    tooltip.style.top = `${Math.max(10, top)}px`;
    tooltip.style.left = `${Math.max(10, left)}px`;
  }, [currentStep, highlightedElement, steps]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    onSkip();
  };

  if (!isVisible) return null;

  const currentStepData = steps[currentStep];

  return (
    <div className="fixed inset-0 z-[9998] bg-black/50 backdrop-blur-sm">
      {/* Highlighted Element Overlay */}
      {highlightedElement && (
        <div
          className="absolute border-2 border-blue-500 rounded-lg shadow-2xl animate-pulse"
          style={{
            top: highlightedElement.offsetTop - 4,
            left: highlightedElement.offsetLeft - 4,
            width: highlightedElement.offsetWidth + 8,
            height: highlightedElement.offsetHeight + 8,
            zIndex: 9999
          }}
        />
      )}

      {/* Tooltip */}
      <div
        ref={tooltipRef}
        className="absolute bg-white rounded-xl shadow-2xl p-6 max-w-sm border border-gray-200"
        style={{ zIndex: 10000 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            {currentStepData.icon}
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {currentStepData.title}
              </h3>
              <p className="text-sm text-gray-500">
                Schritt {currentStep + 1} von {steps.length}
              </p>
            </div>
          </div>
          <button
            onClick={handleSkip}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <p className="text-gray-700 mb-6 leading-relaxed">
          {currentStepData.description}
        </p>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
          <div
            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
          />
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={handlePrevious}
            disabled={currentStep === 0}
            className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Zurück</span>
          </button>

          <button
            onClick={handleNext}
            className="flex items-center space-x-2 px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            <span>
              {currentStep === steps.length - 1 ? 'Abschließen' : 'Weiter'}
            </span>
            {currentStep < steps.length - 1 && <ChevronRight className="w-4 h-4" />}
          </button>
        </div>

        {/* Skip Button */}
        <button
          onClick={handleSkip}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-sm"
        >
          Überspringen
        </button>
      </div>
    </div>
  );
};

export default OnboardingOverlay;