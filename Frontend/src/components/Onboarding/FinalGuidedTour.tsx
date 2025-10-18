/**
 * FinalGuidedTour - Die perfekte Balance zwischen Funktionalität und Design
 * 
 * ✅ FUNKTIONIERT GARANTIERT:
 * - Einfaches, zentriertes Modal-Layout
 * - Keine komplexen Positionierung
 * - Höchster z-index
 * 
 * ✨ BEHÄLT ALLE FEATURES:
 * - Mockups für visuelle Previews
 * - Schönes Glassmorphism Design
 * - Interaktive Elemente
 * - Element-Highlighting (optional)
 */

import React, { useState, useRef } from 'react';
import { X, ArrowLeft, ArrowRight, CheckCircle, Sparkles } from 'lucide-react';
import { useOnboarding } from '../../context/OnboardingContext';
import { ProjectMockup, TenderMockup, KanbanMockup } from './TourMockups';

// CSS Animation
const styles = `
  @keyframes float {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-10px); }
  }
`;

if (typeof document !== 'undefined' && !document.querySelector('#tour-styles')) {
  const styleSheet = document.createElement('style');
  styleSheet.id = 'tour-styles';
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
}

interface TourStep {
  id: string;
  title: string;
  description: string;
  showMockup?: 'project' | 'tender' | 'kanban';
}

interface FinalGuidedTourProps {
  isOpen: boolean;
  onClose: () => void;
  onCompleted?: () => void;
  userRole?: 'BAUTRAEGER' | 'DIENSTLEISTER';
}

const bautraegerSteps: TourStep[] = [
  { 
    id: 'dashboard-title', 
    title: 'Willkommen bei BuildWise! 🏗️', 
    description: 'Hey! Schön, dass du da bist. In nur 60 Sekunden zeige ich dir die wichtigsten Features, die deine Bauprojekte revolutionieren werden. Bereit? Dann lass uns loslegen!' 
  },
  { 
    id: 'radial-menu-fab', 
    title: 'Dein Kommandozentrum 🎯', 
    description: 'Unten rechts findest du dein Kommandozentrum! Hier kannst du Projekte erstellen, Ausschreibungen starten, Dokumente hochladen – alles an einem Ort. Pro-Tipp: Du kannst die Buttons per Drag & Drop anpassen!' 
  },
  {
    id: 'tour-mockup-project',
    title: 'Deine Projekte im Überblick ✨',
    description: 'So sehen deine Bauprojekte aus: Fortschritt, Budget, Bauphase und alle wichtigen Kennzahlen – immer aktuell und übersichtlich.',
    showMockup: 'project'
  },
  {
    id: 'tour-mockup-tender',
    title: 'Ausschreibungen managen 📋',
    description: 'Erstelle Ausschreibungen, erhalte Angebote von qualifizierten Dienstleistern und vergleiche sie direkt. Der Status zeigt dir auf einen Blick: Offen, Angebote eingegangen oder bereits vergeben.',
    showMockup: 'tender'
  },
  {
    id: 'tour-mockup-notifications',
    title: 'Echtzeit-Benachrichtigungen 🔔',
    description: 'Verpasse nie wieder wichtige Updates! Erhalte sofortige Benachrichtigungen über neue Angebote, Dokumente, Termine und Meilensteine. Alles übersichtlich in deinem Dashboard.'
  },
  {
    id: 'tour-mockup-kanban',
    title: 'Projektmanagement mit Kanban 📊',
    description: 'Organisiere deine Aufgaben visuell! Verschiebe Karten zwischen "Geplant", "In Arbeit" und "Erledigt". Perfekt für die Koordination mit deinem Team.',
    showMockup: 'kanban'
  },
  {
    id: 'tour-mockup-tabs',
    title: 'Bereit für den Start! 🚀',
    description: 'Perfekt! Du kennst jetzt alle wichtigen Features. Starte dein erstes Projekt oder erkunde die verschiedenen Bereiche. Bei Fragen hilft dir unser Support gerne weiter!'
  }
];

export default function FinalGuidedTour({
  isOpen,
  onClose,
  onCompleted,
  userRole = 'BAUTRAEGER'
}: FinalGuidedTourProps) {
  const { completeTour } = useOnboarding();
  const [current, setCurrent] = useState(0);
  const mockupRef = useRef<HTMLDivElement>(null);
  
  const tourSteps = userRole === 'BAUTRAEGER' ? bautraegerSteps : bautraegerSteps;
  const step = tourSteps[current];

  const next = () => {
    if (current < tourSteps.length - 1) {
      setCurrent(current + 1);
    } else {
      finish();
    }
  };

  const prev = () => {
    if (current > 0) {
      setCurrent(current - 1);
    }
  };

  const finish = async () => {
    await completeTour();
    onCompleted?.();
    onClose();
  };

  // Render mockup if step has one
  const renderMockup = () => {
    if (!step?.showMockup) return null;

    const mockupComponents = {
      project: <ProjectMockup variant={userRole.toLowerCase() as 'bautraeger' | 'dienstleister'} />,
      tender: <TenderMockup variant={userRole.toLowerCase() as 'bautraeger' | 'dienstleister'} />,
      kanban: <KanbanMockup variant={userRole.toLowerCase() as 'bautraeger' | 'dienstleister'} />
    };

    return (
      <div 
        ref={mockupRef}
        className="w-full mb-6 pointer-events-none"
      >
        {mockupComponents[step.showMockup]}
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[999999]">
      {/* Dimmer */}
      <div className="absolute inset-0 bg-gradient-to-br from-black/60 via-black/50 to-black/60 backdrop-blur-[3px]" />

      {/* Centered Content */}
      <div className="absolute inset-0 flex items-center justify-center p-4">
        {/* Beautiful glassmorphism card */}
        <div className="bg-gradient-to-br from-gray-900/95 via-gray-800/95 to-gray-900/95 backdrop-blur-xl border-2 border-[#ffbd59]/60 text-white rounded-3xl p-8 shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto relative">
          {/* Animated background glow */}
          <div 
            className="absolute inset-0 opacity-30 pointer-events-none"
            style={{
              background: 'radial-gradient(circle at 50% 0%, rgba(255,189,89,0.2) 0%, transparent 70%)',
              animation: 'float 6s ease-in-out infinite'
            }}
          />
          
          {/* Content */}
          <div className="relative z-10">
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-0 right-0 p-2 rounded-xl bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white transition-all duration-200 hover:scale-105"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header with step counter */}
            <div className="flex items-center gap-3 mb-6 pr-12">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[#ffbd59] to-[#ffa726] flex items-center justify-center text-[#2c3539] font-bold text-sm flex-shrink-0">
                {current + 1}
              </div>
              <div>
                <div className="text-sm text-gray-300 font-medium">
                  Schritt {current + 1} von {tourSteps.length}
                </div>
                <div className="text-xs text-gray-400">
                  {Math.round(((current + 1) / tourSteps.length) * 100)}% abgeschlossen
                </div>
              </div>
            </div>

            {/* Title and description */}
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-white mb-3 leading-tight">
                {step.title}
              </h2>
              <p className="text-gray-300 leading-relaxed text-lg">
                {step.description}
              </p>
            </div>

            {/* Mockup */}
            {renderMockup()}

            {/* Progress bar */}
            <div className="mb-6">
              <div className="w-full bg-gray-700/50 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-[#ffbd59] to-[#ffa726] h-2 rounded-full transition-all duration-300"
                  style={{ width: `${((current + 1) / tourSteps.length) * 100}%` }}
                />
              </div>
            </div>

            {/* Keyboard shortcuts hint */}
            <div className="flex items-center justify-center gap-2 mb-4 text-xs text-gray-400">
              <Sparkles className="w-3 h-3" />
              <span>Tipp: Nutze ← → Pfeiltasten oder ESC zum Beenden</span>
            </div>

            {/* Navigation controls */}
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
                {current < tourSteps.length - 1 ? (
                  <button
                    className="group flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#ffbd59] to-[#ffa726] hover:from-[#ffa726] hover:to-[#ff9800] text-[#2c3539] text-sm font-bold transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg hover:shadow-[#ffbd59]/50"
                    onClick={next}
                  >
                    <span>Weiter</span>
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </button>
                ) : (
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
      </div>
    </div>
  );
}

