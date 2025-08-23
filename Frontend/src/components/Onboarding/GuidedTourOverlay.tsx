import React, { useEffect, useMemo, useRef, useState } from 'react';
import { X, ArrowRight, ArrowLeft, CheckCircle } from 'lucide-react';
import { updateMe } from '../../api/userService';

type Pointer = 'auto' | 'top' | 'bottom' | 'left' | 'right';

export type TourStep = {
  id: string; // data-tour-id
  title: string;
  description: string;
  waitForClick?: boolean;
  pointer?: Pointer;
};

interface GuidedTourOverlayProps {
  onClose?: () => void;
  onCompleted?: () => void;
  steps?: TourStep[];
}

const defaultSteps: TourStep[] = [
  { 
    id: 'dashboard-title', 
    title: 'Willkommen bei BuildWise!', 
    description: 'Ich zeige dir die wichtigsten Funktionen. Diese Tour dauert nur 2 Minuten.', 
    pointer: 'bottom' 
  },
  { 
    id: 'radial-menu-fab', 
    title: 'Das Radial Menu', 
    description: 'Dein zentraler Zugang zu allen Funktionen! Das Plus-Symbol unten rechts ist dein persönlicher Assistent.', 
    pointer: 'left' 
  },
  { 
    id: 'radial-menu-fab', 
    title: 'Entdecke dein Kommandozentrum! ✨', 
    description: 'Klicke jetzt auf das Plus-Symbol und lass dich überraschen! Hier findest du alles: 🏗️ Projekte erstellen, 📄 Dokumente verwalten, 💰 Finanzen überblicken, ✅ Aufgaben koordinieren, 🎯 Angebote einholen und noch vieles mehr. Los geht\'s - ein Klick öffnet dir alle Türen!', 
    pointer: 'right',
    waitForClick: true
  },
  { 
    id: 'radial-menu-fab', 
    title: 'Personalisier dein Menu! 🎯', 
    description: 'Pro-Tipp: Du kannst alle Buttons im Radial Menu per Drag & Drop verschieben! Ziehe einfach einen Button an eine neue Position und das Menu merkt sich deine Präferenzen. So hast du deine wichtigsten Funktionen immer griffbereit.', 
    pointer: 'top'
  },
  { 
    id: 'dashboard-projects', 
    title: 'Deine Projekte im Überblick', 
    description: 'Hier in der Mitte siehst du alle deine Bauprojekte und laufenden Ausschreibungen. Jedes Projekt zeigt den aktuellen Status, Fortschritt und wichtige Kennzahlen.', 
    pointer: 'auto' 
  },
  { 
    id: 'navbar-logo', 
    title: 'Die Navigation', 
    description: 'Die obere Leiste bietet Schnellzugriff auf wichtige Funktionen. Lass uns die einzelnen Bereiche anschauen.', 
    pointer: 'bottom' 
  },
  { 
    id: 'navbar-credits', 
    title: 'Deine Credits', 
    description: 'Hier siehst du dein aktuelles Credit-Guthaben. Credits ermöglichen dir den Zugang zu Pro-Funktionen und werden täglich abgebucht.', 
    pointer: 'bottom' 
  },
  { 
    id: 'navbar-favorites', 
    title: 'Favoriten', 
    description: 'Markiere wichtige Dokumente, Aufgaben oder Bereiche als Favoriten für schnellen Zugriff.', 
    pointer: 'bottom' 
  },
  { 
    id: 'notification-tab-bautraeger', 
    title: 'Deine Benachrichtigungslasche! 🔔', 
    description: 'Hier rechts am Bildschirmrand findest du deine persönliche Benachrichtigungslasche. Sobald Dienstleister auf Terminanfragen antworten, blinkt sie grün auf und informiert dich sofort! Ein Klick darauf zeigt alle wichtigen Updates zu deinen Bauprojekten.', 
    pointer: 'left' 
  },
  { 
    id: 'navbar-profile', 
    title: 'Dein Profil', 
    description: 'Verwalte deine Einstellungen, Credits und persönlichen Informationen über das Profil-Menü.', 
    pointer: 'bottom' 
  },
  { 
    id: 'dashboard-title', 
    title: 'Bereit zum Start! 🎉', 
    description: 'Du kennst jetzt die wichtigsten Bereiche. Beginne mit deinem ersten Projekt oder erkunde BuildWise auf eigene Faust. Bei Fragen hilft dir unser Support gerne weiter!', 
    pointer: 'bottom' 
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
  
  // Spezielle Behandlung für Schritt 3 (Kommandozentrum)
  if (stepId === 'radial-menu-fab') {
    const rect = el.getBoundingClientRect();
    // FAB ist unten rechts, also immer 'top' für bessere Lesbarkeit
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

export default function GuidedTourOverlay({ onClose, onCompleted, steps = defaultSteps }: GuidedTourOverlayProps) {
  const [current, setCurrent] = useState(0);
  const [activeEl, setActiveEl] = useState<HTMLElement | null>(null);
  const [waitingClick, setWaitingClick] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [rect, setRect] = useState<ReturnType<typeof getElementRect> | null>(null);

  const step = steps[current];

  useEffect(() => {
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
    
    const el = document.querySelector(`[data-tour-id="${step?.id}"]`) as HTMLElement | null;
    setActiveEl(el);
    setRect(getElementRect(el));

    // Stelle sicher, dass das Element sichtbar ist
    if (el) {
      try {
        el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
      } catch {}
      
      // Trigger hover state für Radial Menu Items um Tooltip anzuzeigen
      if (step?.id && step.id.startsWith('radial-menu-') && step.id !== 'radial-menu-fab' && step.id !== 'radial-menu-create-ring') {
        // Simuliere Hover um den Tooltip zu zeigen
        setTimeout(() => {
          const event = new MouseEvent('mouseenter', {
            view: window,
            bubbles: true,
            cancelable: true
          });
          el.dispatchEvent(event);
        }, 100);
      }
    }
    
    // Cleanup function
    return () => {
      if (el && step?.id && step.id.startsWith('radial-menu-') && step.id !== 'radial-menu-fab') {
        const leaveEvent = new MouseEvent('mouseleave', {
          view: window,
          bubbles: true,
          cancelable: true
        });
        el.dispatchEvent(leaveEvent);
      }
    };

    if (step?.waitForClick && el) {
      setWaitingClick(true);
      const handler = () => {
        setWaitingClick(false);
        // Warte kurz, bis UI (z. B. Modal) geöffnet ist
        setTimeout(() => setCurrent((c) => Math.min(c + 1, steps.length - 1)), 600);
      };
      el.addEventListener('click', handler, { once: true });
      return () => {
        el.removeEventListener('click', handler as any);
      };
    } else {
      setWaitingClick(false);
    }
    
    // Spezielle Behandlung für das Radial Menu
    const fabButton = document.querySelector('[data-tour-id="radial-menu-fab"]') as HTMLElement;
    
    if (step?.id && step.id.startsWith('radial-menu-') && step.id !== 'radial-menu-fab') {
      // Öffne das Radial Menu automatisch für die Tour (außer beim Klick-Schritt)
      if (fabButton && (!fabButton.getAttribute('aria-expanded') || fabButton?.getAttribute('aria-expanded') === 'false')) {
        setTimeout(() => {
          fabButton?.click();
        }, 200);
      }
    } else if (step?.id === 'dashboard-title' || !step?.id?.startsWith('radial-menu-')) {
      // Schließe das Radial Menu wenn wir nicht mehr bei den Radial-Menu-Schritten sind
      if (fabButton && fabButton.getAttribute('aria-expanded') === 'true') {
        setTimeout(() => {
          fabButton?.click();
        }, 100);
      }
    }
  }, [current, step?.id, step?.waitForClick, steps.length]);

  // Repositionierung bei Scroll/Resize, damit Overlay mitwandert
  useEffect(() => {
    const update = () => {
      setRect(getElementRect(activeEl));
    };
    update();
    window.addEventListener('scroll', update, true);
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update, true);
      window.removeEventListener('resize', update);
    };
  }, [activeEl]);

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
    if (current < steps.length - 1) setCurrent(current + 1);
    else finish();
  };
  const prev = () => {
    if (waitingClick) return; // Verhindere Zurück während auf Klick gewartet wird
    setCurrent((c) => Math.max(0, c - 1));
  };

  const finish = async () => {
    // Schließe das Radial Menu falls offen
    const fabButton = document.querySelector('[data-tour-id="radial-menu-fab"]') as HTMLElement;
    if (fabButton?.getAttribute('aria-expanded') === 'true') {
      fabButton?.click();
    }
    
    try {
      await updateMe({
        consent_fields: {
          dashboard_tour: {
            completed: true,
            version: '1.0',
            completed_at: new Date().toISOString(),
          }
        }
      });
    } catch (e) {
      // non-blocking
      console.warn('Tour-Abschluss konnte nicht gespeichert werden', e);
    }
    onCompleted?.();
    onClose?.();
  };

  const handleClose = () => {
    // Schließe das Radial Menu falls offen
    const fabButton = document.querySelector('[data-tour-id="radial-menu-fab"]') as HTMLElement;
    if (fabButton?.getAttribute('aria-expanded') === 'true') {
      fabButton?.click();
    }
    onClose?.();
  };

  // rect wird live aktualisiert, Memo ist nicht notwendig
  // Dynamische Pointer-Entscheidung: bevorzugt die Platzverhältnisse, falls kein expliziter Pointer angegeben
  const pointer: Pointer = !step?.pointer || step.pointer === 'auto' ? decidePointer(activeEl, step?.id) : (step.pointer as Pointer);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[9999]"
      aria-hidden
      style={{ pointerEvents: 'none' }}
      data-tour-id-root
    >
      {/* Dimmer - mit reduzierter Transparenz für bessere Sichtbarkeit */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px]" />

      {/* Highlight-Box um Ziel - mit Loch für Interaktion */}
      {rect && !waitingClick && (
        <div
          className="absolute border-3 border-[#ffbd59] rounded-2xl shadow-[0_0_20px_rgba(255,189,89,0.5)]"
          style={{
            top: rect.top - 8,
            left: rect.left - 8,
            width: rect.width + 16,
            height: rect.height + 16,
            pointerEvents: 'none',
            boxShadow: '0 0 0 9999px rgba(0,0,0,0.35), 0 8px 30px rgba(0,0,0,0.3)'
          }}
        />
      )}
      
      {/* Spezielle Behandlung für waitingClick - Loch im Overlay für Klick-Interaktion */}
      {rect && waitingClick && (
        <>
          {/* Overlay mit Loch */}
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
              fill="rgba(0,0,0,0.35)"
              mask="url(#highlight-mask)"
            />
          </svg>
          {/* Highlight-Rahmen */}
          <div
            className="absolute border-3 border-[#ffbd59] rounded-2xl animate-pulse shadow-[0_0_30px_rgba(255,189,89,0.7)]"
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

      {/* Tooltip/Card */}
      {rect ? (
        <div
          className="absolute max-w-sm bg-gray-900/90 backdrop-blur-md border border-[#ffbd59]/50 text-white rounded-2xl p-4 shadow-2xl"
          style={{
            top: (() => {
              const cardHeight = 200; // Etwas größere Höhe für längeren Text
              
              // Spezielle Behandlung für Radial Menu (FAB Button)
              if (step?.id === 'radial-menu-fab') {
                // Für FAB: Deutlich höher positionieren UND sicherstellen, dass Button klickbar bleibt
                const safeTopPosition = Math.max(rect.top - cardHeight - 80, 20);
                return safeTopPosition;
              }
              
              if (pointer === 'bottom') return Math.min(rect.top + rect.height + 20, window.innerHeight - cardHeight - 20);
              if (pointer === 'top') return Math.max(rect.top - 24 - cardHeight, 20);
              // left/right oder auto → vertikal mittig, aber im Viewport halten
              const mid = rect.top + rect.height / 2 - cardHeight / 2;
              return Math.min(Math.max(mid, 20), window.innerHeight - cardHeight - 20);
            })(),
            left: (() => {
              const cardWidth = 320; // Mindestbreite Tooltip
              
              // Spezielle Behandlung für Radial Menu (FAB Button)
              if (step?.id === 'radial-menu-fab') {
                // Für FAB: Links vom Button positionieren, damit er klickbar bleibt
                return Math.max(rect.left - cardWidth - 20, 16);
              }
              
              if (pointer === 'right') return Math.min(rect.left + rect.width + 16, window.innerWidth - cardWidth - 16);
              if (pointer === 'left') return Math.max(rect.left - cardWidth - 16, 16);
              // top/bottom oder auto → horizontal mittig, aber im Viewport halten
              const mid = rect.left + rect.width / 2 - cardWidth / 2;
              return Math.min(Math.max(mid, 16), window.innerWidth - cardWidth - 16);
            })(),
            pointerEvents: 'auto'
          }}
        >
          <div className="flex items-start justify-between gap-4 max-w-[320px]">
            <div>
              <h3 className="text-lg font-bold mb-1 leading-snug">{step?.title}</h3>
              <p className="text-sm text-gray-100 leading-relaxed">{step?.description}</p>
            </div>
            <button
              className="p-1 rounded-lg hover:bg-white/10"
              onClick={handleClose}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="flex items-center justify-between mt-3">
            <div className="text-xs text-gray-300">Schritt {current + 1} / {steps.length}</div>
            <div className="flex gap-2">
              <button
                className="px-3 py-1 rounded-lg bg-gray-700/80 hover:bg-gray-600/80 text-white text-sm disabled:opacity-50 disabled:cursor-not-allowed border border-gray-600"
                onClick={prev}
                disabled={current === 0 || waitingClick}
              >
                <ArrowLeft className="w-4 h-4 inline-block mr-1" /> Zurück
              </button>
              {current < steps.length - 1 && !waitingClick && (
                <button
                  className="px-3 py-1 rounded-lg bg-[#ffbd59] hover:bg-[#ffa726] text-[#2c3539] text-sm font-semibold"
                  onClick={next}
                >
                  Weiter <ArrowRight className="w-4 h-4 inline-block ml-1" />
                </button>
              )}
              {waitingClick && (
                <span className="px-3 py-1 rounded-lg bg-orange-500/20 text-orange-300 text-sm border border-orange-500/30 animate-pulse">Bitte klicken…</span>
              )}
              {current === steps.length - 1 && (
                <button
                  className="px-3 py-1 rounded-lg bg-green-500 hover:bg-green-600 text-white text-sm font-semibold"
                  onClick={finish}
                >
                  <CheckCircle className="w-4 h-4 inline-block mr-1" /> Beenden
                </button>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 max-w-sm bg-gray-900/90 backdrop-blur-md border border-[#ffbd59]/50 text-white rounded-2xl p-4 shadow-2xl"
          style={{ pointerEvents: 'auto' }}
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold mb-1">{step?.title}</h3>
              <p className="text-sm text-gray-200">{step?.description}</p>
            </div>
            <button className="p-1 rounded-lg hover:bg-white/10" onClick={handleClose}>
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="flex items-center justify-between mt-3">
            <div className="text-xs text-gray-300">Schritt {current + 1} / {steps.length}</div>
            <div className="flex gap-2">
              <button className="px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm" onClick={prev} disabled={current === 0}>
                <ArrowLeft className="w-4 h-4 inline-block mr-1" /> Zurück
              </button>
              {current < steps.length - 1 && (
                <button className="px-3 py-1 rounded-lg bg-[#ffbd59] hover:bg-[#ffa726] text-[#2c3539] text-sm font-semibold" onClick={next}>
                  Weiter <ArrowRight className="w-4 h-4 inline-block ml-1" />
                </button>
              )}
              {current === steps.length - 1 && (
                <button className="px-3 py-1 rounded-lg bg-green-500 hover:bg-green-600 text-white text-sm font-semibold" onClick={finish}>
                  <CheckCircle className="w-4 h-4 inline-block mr-1" /> Beenden
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


