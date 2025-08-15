import { useMemo, useRef, useState, useEffect, KeyboardEvent, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useProject } from "../context/ProjectContext";
import { useAuth } from "../context/AuthContext";
import { 
  Home, 
  CheckSquare, 
  Euro, 
  MessageSquare, 
  BarChart3, 
  Palette,
  Plus,
  X,
  Info,
  FolderPlus,
  ListPlus,
  Receipt,
  Hammer,
  Upload,
  Settings,
  Calendar,
  Bell,
  Search,
  Star,
  TrendingUp,
  FileText
} from 'lucide-react';

type RadialItem = {
  id: string;
  label: string;
  icon: React.ReactNode;
  onSelect: () => void;
  color: string;
  description?: string;
  badge?: {
    text: string;
    color: string;
  };
  ring?: number; // 1 = inner ring, 2 = outer ring
  tourId?: string; // data-tour-id for guided tour
};

type RadialMenuAdvancedProps = {
  enableGooeyEffect?: boolean;
  showTooltips?: boolean;
  enableSecondRing?: boolean;
  customCreateActions?: RadialItem[];
};

export function RadialMenuAdvanced({
  enableGooeyEffect = true,
  showTooltips = true,
  enableSecondRing = false,
  customCreateActions
}: RadialMenuAdvancedProps) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [showCreateMenu, setShowCreateMenu] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const navigate = useNavigate();
  const { selectedProject } = useProject();
  const { user, userRole } = useAuth();

  // Responsive Detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Main navigation items
  const getMainItems = (): RadialItem[] => {
    const projectId = selectedProject?.id;
    const items: RadialItem[] = [
      {
        id: "documents",
        label: "Dokumente",
        icon: <FileText size={24} />,
        onSelect: () => {
          if (projectId) {
            navigate(`/documents?project=${projectId}`);
          } else {
            navigate('/documents');
          }
        },
        color: "#3B82F6",
        description: "Dokumentenmanagement",
        ring: 1,
        tourId: "radial-menu-documents"
      },
      {
        id: "tasks",
        label: "To-Do",
        icon: <CheckSquare size={24} />,
        onSelect: () => {
          if (projectId) {
            navigate(`/tasks?project=${projectId}`);
          } else {
            navigate('/tasks');
          }
        },
        color: "#10B981",
        description: "Aufgabenmanagement",
        ring: 1,
        tourId: "radial-menu-tasks"
      },
      {
        id: "finance",
        label: "Finance",
        icon: <Euro size={24} />,
        onSelect: () => {
          if (projectId) {
            navigate(`/finance?project=${projectId}`);
          } else {
            navigate('/finance');
          }
        },
        color: "#F59E0B",
        description: "Budget & Ausgaben",
        ring: 1,
        tourId: "radial-menu-finance"
      },
      // Entfernt: Gewerke-Hauptpunkt (Seite /quotes deaktiviert)
      {
        id: "visualize",
        label: "Visualize",
        icon: <BarChart3 size={24} />,
        onSelect: () => {
          if (projectId) {
            navigate(`/visualize?project=${projectId}`);
          } else {
            navigate('/visualize');
          }
        },
        color: "#06B6D4",
        description: "Analytics & Berichte",
        ring: 1,
        tourId: "radial-menu-visualize"
      },
      {
        id: "canvas",
        label: "Canvas",
        icon: <Palette size={24} />,
        onSelect: () => {
          if (projectId) {
            navigate(`/project/${projectId}/canvas`);
          } else {
            navigate('/canvas');
          }
        },
        color: "#EC4899",
        description: "Kollaboration & Zeichnungen",
        ring: 1,
        tourId: "radial-menu-canvas"
      }
    ];

    // Filter based on user role and subscription
    if (userRole === 'dienstleister' || userRole === 'DIENSTLEISTER') {
      return items;
    }
    
    if (userRole === 'bautraeger' || userRole === 'BAUTRAEGER') {
      const isProUser = user?.subscription_plan === 'PRO' && user?.subscription_status === 'ACTIVE';
      if (!isProUser) {
        return items;
      }
    }
    
    return items;
  };

  // Create action items (second ring)
  const getCreateItems = (): RadialItem[] => {
    if (customCreateActions) return customCreateActions;
    
    const projectId = selectedProject?.id;
    return [
      {
        id: "create-project",
        label: "Neues Projekt",
        icon: <FolderPlus size={20} />,
        onSelect: () => {
          // Öffnet das globale Projekt-Erstellungs-Modal über URL-Parameter
          navigate(`${window.location.pathname}?create=project`);
        },
        color: "#ffbd59",
        description: "Projekt erstellen",
        ring: 2,
        tourId: "radial-menu-create-project"
      },
      {
        id: "create-task",
        label: "Neue Aufgabe",
        icon: <ListPlus size={20} />,
        onSelect: () => {
          // Öffnet die Aufgaben-Seite, optional mit Create-Hinweis
          if (projectId) {
            navigate(`/tasks?project=${projectId}&create=task`);
          } else {
            navigate('/tasks?create=task');
          }
        },
        color: "#10B981",
        description: "Aufgabe hinzufügen",
        ring: 2
      },
      {
        id: "create-expense",
        label: "Neue Ausgabe",
        icon: <Receipt size={20} />,
        onSelect: () => {
          // Öffnet Finanzen und triggert Ausgaben-Modal via Query-Param
          if (projectId) {
            navigate(`/finance?project=${projectId}&create=expense`);
          } else {
            navigate('/finance?create=expense');
          }
        },
        color: "#F59E0B",
        description: "Ausgabe erfassen",
        ring: 2
      },
      {
        id: "create-trade",
        label: "Neues Gewerk",
        icon: <Hammer size={20} />,
        onSelect: () => {
          // Öffnet das aktuelle Layout und triggert Gewerk-Formular via Query-Param
          if (projectId) {
            navigate(`${window.location.pathname}?create=trade&project=${projectId}`);
          } else {
            navigate(`${window.location.pathname}?create=trade`);
          }
        },
        color: "#8B5CF6",
        description: "Gewerk erstellen",
        ring: 2
      },
      {
        id: "upload-doc",
        label: "Upload",
        icon: <Upload size={20} />,
        onSelect: () => {
          // Öffnet DMS und triggert Upload-Modal via Query-Param
          if (projectId) {
            navigate(`/documents?project=${projectId}&create=upload`);
          } else {
            navigate('/documents?create=upload');
          }
        },
        color: "#4F46E5",
        description: "Dokument hochladen",
        ring: 2
      }
    ];
  };

  const mainItems = getMainItems();
  // Sekundärreihe als Primärreihe integrieren
  const createItems = getCreateItems();
  const allItems = [...mainItems, ...createItems.map(ci => ({ ...ci, ring: 1 }))];

  // Calculate layout with multiple rings - doubled radius for maximum spacing
  const layout = useMemo(() => {
    const radius1 = isMobile ? 220 : 280;  // Doubled from 110/140
    const radius2 = isMobile ? 330 : 420;  // Doubled from 165/210
    
    return allItems.map((item, i) => {
      const isSecondRing = false; // alles in den Primärring verschoben
      const radius = radius1;
      
      // Calculate angle based on ring
      const itemsInRing = allItems; // ein Ring
      const indexInRing = itemsInRing.indexOf(item);
      const countInRing = itemsInRing.length;
      
      const startAngle = isSecondRing ? -160 : -170;
      const endAngle = isSecondRing ? -80 : -60;
      const span = endAngle - startAngle;
      
      const t = countInRing === 1 ? 0.5 : indexInRing / (countInRing - 1);
      const angle = (startAngle + t * span) * (Math.PI / 180);
      
      return {
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * radius,
        angleDeg: startAngle + t * span,
        ring: 1
      };
    });
  }, [allItems, isMobile]);

  // Click outside to close
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) {
        setOpen(false);
        setShowCreateMenu(false);
        setHoveredIndex(null);
      }
    };
    
    if (open) {
      document.addEventListener("pointerdown", handleOutsideClick);
      return () => document.removeEventListener("pointerdown", handleOutsideClick);
    }
  }, [open]);

  // Keyboard navigation
  const handleKeyDown = (e: KeyboardEvent) => {
    if (!open) {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        setOpen(true);
        if (enableSecondRing) {
          setShowCreateMenu(true);
        }
      }
      return;
    }

    switch (e.key) {
      case "Escape":
        if (showCreateMenu) {
          setShowCreateMenu(false);
        } else {
          setOpen(false);
        }
        buttonRef.current?.focus();
        break;
      case "ArrowLeft":
      case "ArrowUp":
        e.preventDefault();
        setActiveIndex((i) => (i - 1 + allItems.length) % allItems.length);
        break;
      case "ArrowRight":
      case "ArrowDown":
        e.preventDefault();
        setActiveIndex((i) => (i + 1) % allItems.length);
        break;
      case "Enter":
      case " ":
        e.preventDefault();
        allItems[activeIndex]?.onSelect();
        setOpen(false);
        setShowCreateMenu(false);
        break;
      case "Tab":
        e.preventDefault();
        if (e.shiftKey) {
          setActiveIndex((i) => (i - 1 + allItems.length) % allItems.length);
        } else {
          setActiveIndex((i) => (i + 1) % allItems.length);
        }
        break;
      case "c":
      case "C":
        // Toggle create menu with 'C' key
        if (enableSecondRing) {
          setShowCreateMenu(!showCreateMenu);
        }
        break;
    }
  };

  // Long press detection for mobile
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);
  
  const handleTouchStart = useCallback(() => {
    if (!open) {
      const timer = setTimeout(() => {
        setOpen(true);
        if (enableSecondRing) {
          setShowCreateMenu(true);
        }
      }, 500);
      setLongPressTimer(timer);
    }
  }, [open, enableSecondRing]);

  const handleTouchEnd = useCallback(() => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
  }, [longPressTimer]);

  return (
    <>
      {/* Gooey Filter */}
      {enableGooeyEffect && (
        <svg style={{ position: 'absolute', width: 0, height: 0 }}>
          <defs>
            <filter id="gooey-advanced">
              <feGaussianBlur in="SourceGraphic" stdDeviation="10" result="blur" />
              <feColorMatrix
                in="blur"
                mode="matrix"
                values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 20 -10"
                result="gooey"
              />
              <feComposite in="SourceGraphic" in2="gooey" operator="atop" />
            </filter>
          </defs>
        </svg>
      )}

      <div
        ref={containerRef}
        className="radial-menu-container"
        style={{
          position: "fixed",
          right: isMobile ? 32 : 64,
          bottom: isMobile ? 32 : 64,
          zIndex: document.querySelector('[data-tour-id-root]') ? 9998 : 9999, // Niedriger z-index während Tour
          filter: enableGooeyEffect && open ? 'url(#gooey-advanced)' : undefined,
        }}
        role="menu"
        aria-expanded={open}
        onKeyDown={handleKeyDown}
      >
        {/* Background overlay - outside of menu items AnimatePresence */}
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{ 
                pointerEvents: 'none',
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0, 0, 0, 0.3)',
                backdropFilter: 'blur(12px)',
                zIndex: -1
              }}
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {open && (
            <>

              {/* Orbit lines (visual enhancement) */}
              {enableSecondRing && showCreateMenu && (
                <>
                  <motion.div
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 0.2, scale: 1 }}
                    exit={{ opacity: 0, scale: 0 }}
                    className="absolute"
                    style={{
                      width: isMobile ? 440 : 560,
                      height: isMobile ? 440 : 560,
                      border: '1px dashed rgba(255, 189, 89, 0.3)',
                      borderRadius: '50%',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      pointerEvents: 'none'
                    }}
                  />
                  <motion.div
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 0.15, scale: 1 }}
                    exit={{ opacity: 0, scale: 0 }}
                    transition={{ delay: 0.1 }}
                    className="absolute"
                    style={{
                      width: isMobile ? 660 : 840,
                      height: isMobile ? 660 : 840,
                      border: '1px dashed rgba(255, 189, 89, 0.2)',
                      borderRadius: '50%',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      pointerEvents: 'none'
                    }}
                  />
                </>
              )}

              {/* Radial menu items */}
              {allItems.map((item, i) => (
                <motion.button
                  key={item.id}
                  type="button"
                  role="menuitem"
                  aria-label={item.label}
                  data-radial-item={item.id}
                  data-tour-id={item.tourId}
                  initial={{ 
                    x: 0, 
                    y: 0, 
                    opacity: 0, 
                    scale: 0.3, 
                   rotate: -180 
                  }}
                  animate={{
                    x: layout[i].x,
                    y: layout[i].y,
                    opacity: 1,
                    scale: hoveredIndex === i ? 1.25 : activeIndex === i ? 1.1 : 1,
                    rotate: 0,
                  }}
                  exit={{ 
                    x: 0, 
                    y: 0, 
                    opacity: 0, 
                    scale: 0.3,
                     rotate: 180
                  }}
                  transition={{
                    type: "spring",
                    stiffness: item.ring === 2 ? 280 : 350,
                    damping: 25,
                    delay: item.ring === 2 ? 0.06 * i : 0.04 * i,
                  }}
                  onClick={() => {
                    item.onSelect();
                    setOpen(false);
                    setShowCreateMenu(false);
                  }}
                  onMouseEnter={() => {
                    setHoveredIndex(i);
                    setActiveIndex(i);
                  }}
                  onMouseLeave={() => setHoveredIndex(null)}
                  onFocus={() => setActiveIndex(i)}
                  className="absolute group"
                  style={{
                    width: hoveredIndex === i ? (isMobile ? 64 : 76) : (isMobile ? 52 : 64),
                    height: hoveredIndex === i ? (isMobile ? 64 : 76) : (isMobile ? 52 : 64),
                    borderRadius: "50%",
                    border: "none",
                    background: hoveredIndex === i || activeIndex === i 
                      ? `linear-gradient(135deg, ${item.color}, ${item.color}dd)`
                      : `linear-gradient(135deg, #2a2f3a, #1f2937)`,
                    color: "white",
                    boxShadow: hoveredIndex === i || activeIndex === i
                      ? `0 0 60px ${item.color}aa,
                         0 0 40px ${item.color}88,
                         0 0 25px ${item.color}66,
                         0 12px 32px ${item.color}60,
                         0 8px 20px rgba(0,0,0,0.4),
                         0 4px 12px rgba(0,0,0,0.3),
                         inset 0 2px 2px rgba(255,255,255,0.3),
                         inset 0 -2px 2px rgba(0,0,0,0.2)`
                      : "0 6px 16px rgba(0,0,0,0.25), 0 2px 6px rgba(0,0,0,0.2)",
                    cursor: "pointer",
                    willChange: "transform",
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    outline: 'none',
                    transition: 'background 0.3s ease, z-index 0.1s ease',
                    opacity: 1,
                    zIndex: hoveredIndex === i ? 500 : 50,
                  }}
                  whileHover={{ scale: 1.2 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {/* Icon */}
                  <div className="relative" style={{
                    transform: hoveredIndex === i ? 'scale(1.15)' : 'scale(1)',
                    transition: 'transform 0.2s ease'
                  }}>
                    {item.icon}
                    
                    {/* Badge */}
                    {item.badge && (
                      <div 
                        className="absolute -top-2 -right-2 px-1.5 py-0.5 rounded-full text-[10px] font-bold"
                        style={{
                          background: item.badge.color,
                          color: 'white',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                        }}
                      >
                        {item.badge.text}
                      </div>
                    )}
                  </div>

                  {/* Tooltip */}
                  {showTooltips && (hoveredIndex === i || activeIndex === i) && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.9 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.9 }}
                      className="absolute bottom-full mb-4 px-4 py-3 bg-gray-900 backdrop-blur-lg rounded-xl shadow-2xl border-2 border-[#ffbd59]/50 whitespace-nowrap pointer-events-none"
                      style={{ 
                        zIndex: 99999,
                        filter: 'drop-shadow(0 0 20px rgba(255,189,89,0.3))'
                      }}
                    >
                      <div className="text-sm font-bold text-white">{item.label}</div>
                      {item.description && (
                        <div className="text-xs text-gray-300 mt-1">{item.description}</div>
                      )}
                      <div 
                        className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-px"
                        style={{
                          width: 0,
                          height: 0,
                          borderLeft: '8px solid transparent',
                          borderRight: '8px solid transparent',
                          borderTop: '8px solid rgb(17 24 39)',
                        }}
                      />
                    </motion.div>
                  )}
                </motion.button>
              ))}

              {/* Secondary button entfällt – alle Aktionen sind im Primärring */}
            </>
          )}
        </AnimatePresence>

        {/* Central FAB button - Always on top */}
        <motion.button
          ref={buttonRef}
          type="button"
          aria-label={open ? "Menü schließen" : "Menü öffnen"}
          aria-expanded={open}
          data-tour-id="radial-menu-fab"
          onClick={() => {
            if (!open) {
              setOpen(true);
              if (enableSecondRing) {
                setShowCreateMenu(true);
              }
            } else {
              setOpen(false);
              setShowCreateMenu(false);
            }
          }}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          className="relative group"
          style={{
            position: 'relative',
            width: isMobile ? 56 : 72,
            height: isMobile ? 56 : 72,
            borderRadius: "50%",
            border: "none",
            background: open 
              ? "linear-gradient(135deg, #ef4444, #dc2626)"
              : "linear-gradient(135deg, #ffbd59, #ffa726)",
            color: "white",
            boxShadow: open
              ? "0 12px 28px rgba(239,68,68,0.4), 0 6px 14px rgba(0,0,0,0.3)"
              : "0 12px 28px rgba(255,189,89,0.4), 0 6px 14px rgba(0,0,0,0.3)",
            cursor: "pointer",
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: isMobile ? 28 : 36,
            fontWeight: 'bold',
            outline: 'none',
            zIndex: 100,
          }}
          whileTap={{ scale: 0.9 }}
          whileHover={{ scale: 1.1 }}
          animate={{ rotate: open ? 45 : 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
        >
          {open ? <X size={isMobile ? 24 : 32} /> : <Plus size={isMobile ? 24 : 32} />}
          
          {/* Pulse animation when closed */}
          {!open && (
            <>
              <motion.div
                className="absolute inset-0 rounded-full"
                style={{
                  background: "linear-gradient(135deg, #ffbd59, #ffa726)",
                  opacity: 0.3,
                }}
                animate={{
                  scale: [1, 1.3, 1.3],
                  opacity: [0.3, 0, 0],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  repeatDelay: 1,
                }}
              />
              
              {/* Notification dot */}
              {!localStorage.getItem('radial-menu-advanced-used') && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
              )}
            </>
          )}
        </motion.button>

        {/* Hint for keyboard shortcuts */}
        {open && !isMobile && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute left-1/2 transform -translate-x-1/2 -bottom-20 bg-gray-900/90 text-white text-xs px-3 py-2 rounded-lg whitespace-nowrap"
          >
            <div className="flex items-center gap-4">
              <span>←→ Navigate</span>
              <span>Enter Select</span>
              {enableSecondRing && <span>C Create Menu</span>}
              <span>ESC Close</span>
            </div>
          </motion.div>
        )}
      </div>

      <style jsx>{`
        .radial-menu-container {
          -webkit-tap-highlight-color: transparent;
          user-select: none;
        }
      `}</style>
    </>
  );
}
