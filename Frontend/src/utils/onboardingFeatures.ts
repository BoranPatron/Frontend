/**
 * Onboarding Feature Definitions
 * Definiert alle Features, die im kontextuellen Onboarding-System erklärt werden
 */

export interface OnboardingFeature {
  id: string;
  title: string;
  description: string;
  priority: number; // 1 = highest priority
  userRole: 'BAUTRAEGER' | 'DIENSTLEISTER' | 'BOTH';
  icon?: string;
  placement?: 'top' | 'bottom' | 'left' | 'right' | 'auto';
  showHotspot?: boolean; // Zeigt pulsierenden Hotspot
  triggerOn?: 'hover' | 'click' | 'focus' | 'mount'; // Wann soll Tooltip erscheinen
  delay?: number; // Verzögerung in ms
}

// Bauträger Features
export const BAUTRAEGER_FEATURES: OnboardingFeature[] = [
  {
    id: 'radial-menu-fab',
    title: 'Dein Kommandozentrum 🎯',
    description: 'Alle wichtigen Aktionen an einem Ort: Projekte erstellen, Ausschreibungen starten, Dokumente hochladen und mehr. Klicke hier, um loszulegen!',
    priority: 1,
    userRole: 'BAUTRAEGER',
    placement: 'left',
    showHotspot: true,
    triggerOn: 'hover',
    delay: 1000
  },
  {
    id: 'create-project-button',
    title: 'Starte dein erstes Projekt 🏗️',
    description: 'Erstelle ein neues Bauprojekt und behalte alle Details, Kosten und Fortschritte im Blick.',
    priority: 2,
    userRole: 'BAUTRAEGER',
    placement: 'bottom',
    showHotspot: true,
    triggerOn: 'hover'
  },
  {
    id: 'create-trade-button',
    title: 'Ausschreibung starten 📋',
    description: 'Erstelle Ausschreibungen für verschiedene Gewerke und erhalte Angebote von qualifizierten Dienstleistern.',
    priority: 3,
    userRole: 'BAUTRAEGER',
    placement: 'bottom',
    showHotspot: true,
    triggerOn: 'hover'
  },
  {
    id: 'document-upload-button',
    title: 'Dokumente hochladen 📁',
    description: 'Lade alle projektbezogenen Dokumente hoch: Baupläne, Verträge, Rechnungen und mehr. Automatische Kategorisierung inklusive!',
    priority: 4,
    userRole: 'BAUTRAEGER',
    placement: 'bottom',
    showHotspot: false,
    triggerOn: 'hover'
  },
  {
    id: 'kanban-board-tab',
    title: 'Aufgaben organisieren 📊',
    description: 'Nutze das Kanban Board, um Aufgaben zu verwalten, zu priorisieren und den Fortschritt zu verfolgen.',
    priority: 5,
    userRole: 'BAUTRAEGER',
    placement: 'bottom',
    showHotspot: false,
    triggerOn: 'click'
  },
  {
    id: 'notification-icon',
    title: 'Benachrichtigungen 🔔',
    description: 'Verpasse nichts Wichtiges! Hier siehst du neue Angebote, Termine und wichtige Updates zu deinen Projekten.',
    priority: 6,
    userRole: 'BAUTRAEGER',
    placement: 'bottom',
    showHotspot: false,
    triggerOn: 'hover'
  },
  {
    id: 'finance-widget',
    title: 'Finanzen im Blick 💰',
    description: 'Überwache dein Budget, verfolge Ausgaben und behalte die Kontrolle über deine Projektfinanzen.',
    priority: 7,
    userRole: 'BAUTRAEGER',
    placement: 'top',
    showHotspot: false,
    triggerOn: 'mount',
    delay: 3000
  }
];

// Dienstleister Features
export const DIENSTLEISTER_FEATURES: OnboardingFeature[] = [
  {
    id: 'radial-menu-fab',
    title: 'Dein Werkzeug-Center 🛠️',
    description: 'Hier findest du alle Funktionen für Angebote, Aufgaben, Dokumente und Ressourcen – alles zentral an einem Ort.',
    priority: 1,
    userRole: 'DIENSTLEISTER',
    placement: 'left',
    showHotspot: true,
    triggerOn: 'hover',
    delay: 1000
  },
  {
    id: 'search-trades-section',
    title: 'Aufträge finden 🎯',
    description: 'Durchsuche verfügbare Ausschreibungen in deiner Region. Filtere nach Gewerk, Entfernung und Budget.',
    priority: 2,
    userRole: 'DIENSTLEISTER',
    placement: 'top',
    showHotspot: true,
    triggerOn: 'mount',
    delay: 2000
  },
  {
    id: 'geo-map-tab',
    title: 'Geografische Suche 🗺️',
    description: 'Die Karte zeigt alle Aufträge in deiner Nähe. Klicke auf einen Marker, um Details zu sehen und ein Angebot abzugeben.',
    priority: 3,
    userRole: 'DIENSTLEISTER',
    placement: 'bottom',
    showHotspot: false,
    triggerOn: 'click'
  },
  {
    id: 'create-quote-button',
    title: 'Angebot erstellen 💼',
    description: 'Erstelle professionelle Kostenvoranschläge mit unserem Kalkulator. Material, Arbeitszeit und Zusatzleistungen werden automatisch berechnet.',
    priority: 4,
    userRole: 'DIENSTLEISTER',
    placement: 'bottom',
    showHotspot: false,
    triggerOn: 'hover'
  },
  {
    id: 'resource-management-section',
    title: 'Deine Verfügbarkeit 📊',
    description: 'Hinterlege freie Kapazitäten, Stundensätze und Qualifikationen. Bauträger finden dich dann automatisch für passende Projekte.',
    priority: 5,
    userRole: 'DIENSTLEISTER',
    placement: 'top',
    showHotspot: false,
    triggerOn: 'mount',
    delay: 4000
  },
  {
    id: 'notification-icon',
    title: 'Keine Chance verpassen 🔔',
    description: 'Werde sofort benachrichtigt bei neuen Ausschreibungen in deiner Region, Auftragserteilungen oder Zahlungseingängen.',
    priority: 6,
    userRole: 'DIENSTLEISTER',
    placement: 'bottom',
    showHotspot: false,
    triggerOn: 'hover'
  }
];

// Kombiniere alle Features
export const ALL_FEATURES = [...BAUTRAEGER_FEATURES, ...DIENSTLEISTER_FEATURES];

// Helper Functions
export function getFeaturesByRole(role: 'BAUTRAEGER' | 'DIENSTLEISTER'): OnboardingFeature[] {
  return ALL_FEATURES.filter(f => f.userRole === role || f.userRole === 'BOTH')
    .sort((a, b) => a.priority - b.priority);
}

export function getFeatureById(id: string): OnboardingFeature | undefined {
  return ALL_FEATURES.find(f => f.id === id);
}

export function getHighPriorityFeatures(role: 'BAUTRAEGER' | 'DIENSTLEISTER', maxPriority: number = 3): OnboardingFeature[] {
  return getFeaturesByRole(role).filter(f => f.priority <= maxPriority);
}

