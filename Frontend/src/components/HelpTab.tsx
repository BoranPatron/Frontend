import React, { useState } from 'react';
import { 
  HelpCircle, 
  X, 
  Info, 
  Package, 
  FileText, 
  Settings, 
  Phone, 
  CheckCircle2,
  ChevronRight,
  Lightbulb,
  ArrowRight
} from 'lucide-react';
import { useMobile } from '../hooks/useMobile';

interface HelpTabProps {
  activeTab: string;
  isBautraeger: boolean;
  hasAcceptedQuote: boolean;
}

const HelpTab: React.FC<HelpTabProps> = ({ activeTab, isBautraeger, hasAcceptedQuote }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { isMobile } = useMobile();

  // Schließe Panel bei Touch außerhalb (nur auf mobilen Geräten)
  React.useEffect(() => {
    if (!isMobile || !isExpanded) return;

    const handleTouchOutside = (event: TouchEvent) => {
      const target = event.target as Element;
      if (!target.closest('[data-help-tab]')) {
        setIsExpanded(false);
      }
    };

    document.addEventListener('touchstart', handleTouchOutside);
    return () => document.removeEventListener('touchstart', handleTouchOutside);
  }, [isMobile, isExpanded]);

  const tabExplanations = {
    // Dienstleister Tabs (TradeDetailsModal)
    contact: {
      title: "Kontakt",
      icon: Phone,
      description: isBautraeger 
        ? "Direkte Kontaktinformationen des beauftragten Dienstleisters"
        : "Direkte Kontaktinformationen des Bauträgers",
      details: isBautraeger ? [
        "Telefonnummer und E-Mail des Dienstleisters",
        "Ansprechpartner und Zuständigkeiten",
        "Notfallkontakte",
        "Terminvereinbarungen"
      ] : [
        "Telefonnummer und E-Mail",
        "Ansprechpartner und Zuständigkeiten",
        "Notfallkontakte",
        "Terminvereinbarungen"
      ]
    },
    overview: {
      title: "Überblick",
      icon: Info,
      description: "Hier findest du alle wichtigen Informationen zur Ausschreibung",
      details: [
        "Projektübersicht und Standort",
        "Zeitplan und Termine",
        "Ausschreibungsdetails",
        "Kontaktinformationen des Bauträgers"
      ]
    },
    quotes: {
      title: isBautraeger ? "Angebote" : "Mein Angebot",
      icon: Package,
      description: isBautraeger 
        ? "Verwalte alle eingegangenen Angebote und Ressourcen-Zuweisungen"
        : "Verwalte dein Angebot für diese Ausschreibung",
      details: isBautraeger ? [
        "Alle eingegangenen Angebote anzeigen",
        "Angebote vergleichen und bewerten",
        "Ressourcen-Zuweisungen verwalten",
        "Angebote annehmen oder ablehnen"
      ] : [
        "Dein aktuelles Angebot einsehen",
        "Angebot überarbeiten oder korrigieren",
        "Angebotsstatus verfolgen",
        "Nachfragen zum Angebot stellen"
      ]
    },
    documents: {
      title: "Dokumente",
      icon: FileText,
      description: "Alle relevanten Dokumente und Unterlagen zur Ausschreibung",
      details: [
        "Baupläne und technische Zeichnungen",
        "Spezifikationen und Anforderungen",
        "Vertragsunterlagen",
        "Zusätzliche Projektinformationen"
      ]
    },
    progress: {
      title: "Fortschritt & Kommunikation",
      icon: Settings,
      description: "Verfolge den Projektfortschritt mit dem interaktiven Slider und kommuniziere mit dem Bauträger",
      details: [
        "Fortschritt-Slider: Ziehe den Slider von 0% bis 100% um den Baufortschritt zu dokumentieren",
        "Automatische Updates: Bei jeder Nachricht wird der aktuelle Fortschritt mitgesendet",
        "Visuelle Anzeige: Der Fortschritt wird in Echtzeit in der Hauptansicht angezeigt",
        "Fertigstellungsmeldung: Bei 100% kannst du das Gewerk als fertiggestellt melden",
        "Nachrichten und Updates austauschen",
        "Termine und Besichtigungen verwalten",
        "Projektstatus verfolgen"
      ]
    },
    abnahme: {
      title: "Abnahme",
      icon: CheckCircle2,
      description: "Abnahme-Workflow und Qualitätskontrolle",
      details: [
        "Abnahme-Termine vereinbaren",
        "Mängel dokumentieren",
        "Abnahme-Status verfolgen",
        "Finale Abnahme durchführen"
      ]
    },
    
    // Bauträger Tabs (SimpleCostEstimateModal) - contact tab is already at the top
    details: {
      title: "Übersicht",
      icon: Info,
      description: "Alle wichtigen Informationen zum Gewerk und Projekt",
      details: [
        "Gewerk-Details und Spezifikationen",
        "Projektübersicht und Standort",
        "Zeitplan und Termine",
        "Status und Priorität"
      ]
    },
    offers: {
      title: "Angebote",
      icon: Package,
      description: "Verwalte alle eingegangenen Angebote von Dienstleistern",
      details: [
        "Alle Angebote vergleichen und bewerten",
        "Angebote annehmen oder ablehnen",
        "Besichtigungstermine vereinbaren",
        "Angebotsstatus verfolgen"
      ]
    },
    communication: {
      title: "Kommunikation",
      icon: Settings,
      description: "Direkte Kommunikation mit dem beauftragten Dienstleister",
      details: [
        "Nachrichten und Updates austauschen",
        "Baufortschritt verfolgen",
        "Termine und Besichtigungen koordinieren",
        "Projektstatus kommunizieren"
      ]
    },
    completion: {
      title: "Abnahme",
      icon: CheckCircle2,
      description: "Abnahme-Workflow und Qualitätskontrolle des Gewerks",
      details: [
        "Abnahme-Anfragen bearbeiten",
        "Mängel dokumentieren und verfolgen",
        "Finale Abnahme durchführen",
        "Rechnungen verwalten"
      ]
    }
  };

  const currentTab = tabExplanations[activeTab as keyof typeof tabExplanations];
  const TabIcon = currentTab?.icon || Info;

  if (!currentTab) return null;

  // Open listener from CentralTabCluster (Desktop)
  React.useEffect(() => {
    const open = () => setIsExpanded(true);
    window.addEventListener('openHelpTab', open as EventListener);
    return () => window.removeEventListener('openHelpTab', open as EventListener);
  }, []);

  return (
    <>
      {/* Help Tab Button - Mobile optimiert */}
      <div className={`fixed ${isMobile ? 'bottom-4 right-4' : 'left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 md:hidden'} z-[100]`}>
        <button
          data-help-tab
          onClick={() => setIsExpanded(!isExpanded)}
          className={`
            group relative flex items-center justify-center 
            ${isMobile ? 'w-12 h-12' : 'w-14 h-14'} 
            rounded-full
            bg-gradient-to-br from-blue-500/20 to-purple-500/20
            backdrop-blur-md border border-white/20
            hover:from-blue-500/30 hover:to-purple-500/30
            transition-all duration-300 ease-out
            shadow-lg hover:shadow-xl hover:shadow-blue-500/25
            hover:scale-105 active:scale-95
            ${isExpanded ? 'from-blue-500/40 to-purple-500/40 shadow-blue-500/30' : ''}
          `}
        >
          <HelpCircle 
            size={isMobile ? 20 : 24} 
            className={`
              text-white/80 group-hover:text-white
              transition-all duration-300
              ${isExpanded ? 'text-white' : ''}
            `} 
          />
          
          {/* Glow Effect */}
          <div className={`
            absolute inset-0 rounded-full
            bg-gradient-to-br from-blue-400/20 to-purple-400/20
            blur-md opacity-0 group-hover:opacity-100
            transition-opacity duration-300
            ${isExpanded ? 'opacity-100' : ''}
          `} />
          
          {/* Pulse Animation */}
          <div className={`
            absolute inset-0 rounded-full
            bg-gradient-to-br from-blue-400/30 to-purple-400/30
            animate-pulse opacity-0 group-hover:opacity-50
            transition-opacity duration-300
            ${isExpanded ? 'opacity-50' : ''}
          `} />
        </button>
      </div>

      {/* Expanded Help Panel - Mobile optimiert */}
      {isExpanded && (
        <div 
          data-help-tab
          className={`
            fixed z-[100] 
            ${isMobile 
              ? 'bottom-20 right-4 left-4 w-auto' 
              : 'left-20 top-1/2 transform -translate-y-1/2 w-80'
            }
          `}
        >
          <div className="
            bg-gradient-to-br from-gray-900/95 to-gray-800/95
            backdrop-blur-xl border border-white/20 rounded-2xl
            shadow-2xl shadow-blue-500/20
            overflow-hidden
          ">
            {/* Header */}
            <div className="
              bg-gradient-to-r from-blue-500/20 to-purple-500/20
              backdrop-blur-sm border-b border-white/10
              ${isMobile ? 'p-3' : 'p-4'} 
              flex items-center justify-between
            ">
              <div className="flex items-center gap-3">
                <div className="
                  ${isMobile ? 'p-1.5' : 'p-2'} 
                  rounded-lg
                  bg-gradient-to-br from-blue-500/20 to-purple-500/20
                  backdrop-blur-sm border border-white/20
                ">
                  <TabIcon size={isMobile ? 16 : 20} className="text-blue-300" />
                </div>
                <div>
                  <h3 className={`text-white font-semibold ${isMobile ? 'text-base' : 'text-lg'}`}>
                    {currentTab.title}
                  </h3>
                  <p className={`text-gray-300 ${isMobile ? 'text-xs' : 'text-sm'}`}>
                    Hilfe & Erklärung
                  </p>
                </div>
              </div>
              
              <button
                onClick={() => setIsExpanded(false)}
                className="
                  ${isMobile ? 'p-1.5' : 'p-2'} 
                  rounded-lg hover:bg-white/10
                  transition-colors duration-200
                  group
                "
              >
                <X size={isMobile ? 16 : 18} className="text-gray-400 group-hover:text-white" />
              </button>
            </div>

            {/* Content */}
            <div className={`${isMobile ? 'p-3' : 'p-4'} space-y-${isMobile ? '3' : '4'}`}>
              {/* Description */}
              <div className="
                ${isMobile ? 'p-2.5' : 'p-3'} 
                rounded-xl
                bg-gradient-to-br from-blue-500/10 to-purple-500/10
                backdrop-blur-sm border border-blue-500/20
              ">
                <div className="flex items-start gap-2">
                  <Lightbulb size={isMobile ? 14 : 16} className="text-yellow-400 mt-0.5 flex-shrink-0" />
                  <p className={`text-gray-200 ${isMobile ? 'text-xs' : 'text-sm'} leading-relaxed`}>
                    {currentTab.description}
                  </p>
                </div>
              </div>

              {/* Details */}
              <div>
                <h4 className={`text-white font-medium mb-${isMobile ? '2' : '3'} flex items-center gap-2`}>
                  <ArrowRight size={isMobile ? 14 : 16} className="text-blue-400" />
                  <span className={isMobile ? 'text-sm' : 'text-base'}>Was du hier tun kannst:</span>
                </h4>
                <ul className={`space-y-${isMobile ? '1.5' : '2'}`}>
                  {currentTab.details.map((detail, index) => (
                    <li key={`help-detail-${activeTab}-${index}`} className="flex items-start gap-2">
                      <ChevronRight size={isMobile ? 12 : 14} className="text-blue-400 mt-1 flex-shrink-0" />
                      <span className={`text-gray-300 ${isMobile ? 'text-xs' : 'text-sm'} leading-relaxed`}>
                        {detail}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Additional Tips */}
              <div className="
                ${isMobile ? 'p-2.5' : 'p-3'} 
                rounded-xl
                bg-gradient-to-br from-green-500/10 to-emerald-500/10
                backdrop-blur-sm border border-green-500/20
              ">
                <div className="flex items-start gap-2">
                  <div className={`w-2 h-2 bg-green-400 rounded-full ${isMobile ? 'mt-1.5' : 'mt-2'} flex-shrink-0`} />
                  <div>
                    <p className={`text-green-200 ${isMobile ? 'text-xs' : 'text-sm'} font-medium mb-1`}>
                      💡 Tipp
                    </p>
                    <p className={`text-gray-300 ${isMobile ? 'text-xs' : 'text-xs'} leading-relaxed`}>
                      {activeTab === 'progress' 
                        ? "🎯 Verwende den Fortschritt-Slider regelmäßig: Ziehe ihn bei jedem wichtigen Baufortschritt weiter. Bei 100% kannst du die Fertigstellung melden und der Bauträger wird zur Abnahme eingeladen."
                        : activeTab === 'contact' && !isBautraeger
                        ? "Nutze die Kontaktinformationen für direkte Kommunikation mit dem Bauträger bei Fragen oder Problemen."
                        : activeTab === 'contact' && isBautraeger
                        ? "Hier findest du alle wichtigen Kontaktdaten des beauftragten Dienstleisters für direkte Kommunikation."
                        : activeTab === 'quotes' && !isBautraeger
                        ? "Überprüfe dein Angebot regelmäßig und stelle bei Fragen direkt Kontakt zum Bauträger auf."
                        : activeTab === 'offers' && isBautraeger
                        ? "Vergleiche Angebote sorgfältig und vereinbare bei Bedarf Besichtigungstermine."
                        : activeTab === 'communication' && isBautraeger
                        ? "Halte regelmäßigen Kontakt mit dem Dienstleister und verfolge den Baufortschritt."
                        : activeTab === 'completion' && isBautraeger
                        ? "Prüfe Abnahme-Anfragen gründlich und dokumentiere Mängel sorgfältig."
                        : "Alle wichtigen Informationen findest du in diesem Tab. Bei Fragen nutze die Kontaktfunktion."
                      }
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="
              bg-gradient-to-r from-gray-800/50 to-gray-700/50
              backdrop-blur-sm border-t border-white/10
              ${isMobile ? 'p-2' : 'p-3'} 
              text-center
            ">
              <p className={`text-gray-400 ${isMobile ? 'text-xs' : 'text-xs'}`}>
                💡 Tipp: Diese Hilfe ist kontextabhängig und zeigt immer Informationen zum aktuellen Tab
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default HelpTab;
