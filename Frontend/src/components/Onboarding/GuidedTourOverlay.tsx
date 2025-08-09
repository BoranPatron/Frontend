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
  { id: 'dashboard-title', title: 'Willkommen!', description: 'Kurzer Rundgang durch das Dashboard. Folgen Sie den Pfeilen und Hinweisen.', pointer: 'bottom' },
  { id: 'manager', title: 'Manager', description: 'Zentrale Verwaltung Ihrer Projekte und Gewerke.' },
  { id: 'docs', title: 'Dokumente', description: 'Hier laden Sie Pläne, Verträge und Nachweise hoch.' },
  { id: 'quotes', title: 'Gewerke & Angebote', description: 'Ausschreibungen erstellen und Angebote managen.' },
  { id: 'tasks', title: 'To Do', description: 'Aufgaben verwalten, Fortschritt tracken und Prioritäten setzen.' },
  { id: 'finance', title: 'Finanzen', description: 'Budget, Ausgaben und Forecasts im Blick behalten.' },
  { id: 'visualize', title: 'Visualize', description: 'Daten und Berichte visualisieren.' },
  { id: 'canvas', title: 'Canvas', description: 'Kollaboratives Whiteboard für Ideen und Skizzen.' },
  { id: 'fab-main', title: 'Aktionen', description: 'Klicken Sie auf das Plus, um Aktionen zu öffnen.', waitForClick: true },
  { id: 'fab-create-project', title: 'Projekt erstellen', description: 'Erstellen Sie Ihr erstes Projekt. Klicken Sie hier.', waitForClick: true },
  { id: 'create-project-modal', title: 'Projektdetails', description: 'Füllen Sie die wichtigsten Eckdaten aus und speichern Sie.', pointer: 'top' },
  { id: 'project-details', title: 'Projekt-Details', description: 'Hier sehen Sie jederzeit alle Details Ihres Projekts.' },
  { id: 'dashboard-title', title: 'Geschafft!', description: 'Tour abgeschlossen. Viel Erfolg mit BuildWise!' }
].slice(0, 15);

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

function decidePointer(el: HTMLElement | null): Pointer {
  if (!el) return 'auto';
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
    const el = document.querySelector(`[data-tour-id="${step?.id}"]`) as HTMLElement | null;
    setActiveEl(el);
    setRect(getElementRect(el));

    // Stelle sicher, dass das Element sichtbar ist
    if (el) {
      try {
        el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
      } catch {}
    }

    if (step?.waitForClick && el) {
      setWaitingClick(true);
      const handler = () => {
        setWaitingClick(false);
        // Warte kurz, bis UI (z. B. Modal) geöffnet ist
        setTimeout(() => setCurrent((c) => Math.min(c + 1, steps.length - 1)), 400);
      };
      el.addEventListener('click', handler, { once: true });
      return () => {
        el.removeEventListener('click', handler as any);
      };
    } else {
      setWaitingClick(false);
    }
  }, [current, step?.id, step?.waitForClick, steps.length]);

  // Repositionierung bei Scroll/Resize, damit Overlay mitwandert
  useEffect(() => {
    const update = () => setRect(getElementRect(activeEl));
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
  const prev = () => setCurrent((c) => Math.max(0, c - 1));

  const finish = async () => {
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
    onClose?.();
  };

  // rect wird live aktualisiert, Memo ist nicht notwendig
  // Dynamische Pointer-Entscheidung: bevorzugt die Platzverhältnisse, falls kein expliziter Pointer angegeben
  const pointer: Pointer = !step?.pointer || step.pointer === 'auto' ? decidePointer(activeEl) : (step.pointer as Pointer);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[60]"
      aria-hidden
      style={{ pointerEvents: 'none' }}
      data-tour-id-root
    >
      {/* Dimmer */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" />

      {/* Highlight-Box um Ziel */}
      {rect && (
        <div
          className="absolute border-2 border-[#ffbd59] rounded-2xl shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]"
          style={{
            top: rect.top - 8,
            left: rect.left - 8,
            width: rect.width + 16,
            height: rect.height + 16,
            pointerEvents: 'none',
            boxShadow: '0 0 0 9999px rgba(0,0,0,0.55), 0 8px 30px rgba(0,0,0,0.5)'
          }}
        />
      )}

      {/* Tooltip/Card */}
      {rect ? (
        <div
          className="absolute max-w-sm bg-white/10 backdrop-blur-lg border border-white/20 text-white rounded-2xl p-4 shadow-2xl"
          style={{
            top: (() => {
              const cardHeight = 168; // Mindesthöhe Tooltip
              if (pointer === 'bottom') return Math.min(rect.top + rect.height + 16, window.innerHeight - cardHeight - 16);
              if (pointer === 'top') return Math.max(rect.top - 16 - cardHeight, 16);
              // left/right oder auto → vertikal mittig, aber im Viewport halten
              const mid = rect.top + rect.height / 2 - cardHeight / 2;
              return Math.min(Math.max(mid, 16), window.innerHeight - cardHeight - 16);
            })(),
            left: (() => {
              const cardWidth = 320; // Mindestbreite Tooltip
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
                className="px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm"
                onClick={prev}
                disabled={current === 0}
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
                <span className="px-3 py-1 rounded-lg bg-white/10 text-white text-sm">Bitte klicken…</span>
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
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 max-w-sm bg-white/10 backdrop-blur-lg border border-white/20 text-white rounded-2xl p-4 shadow-2xl"
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


