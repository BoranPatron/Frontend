import { useMemo, useRef, useState, useEffect, KeyboardEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useProject } from "../context/ProjectContext";
import { useAuth } from "../context/AuthContext";
import { 
  Home, 
  CheckSquare, 
  Euro, 
  BarChart3, 
  Palette,
  Plus,
  X,
  Info,
  Hammer,
  FileText,
  Users,
  Settings
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
};

type RadialMenuProps = {
  items?: RadialItem[];
  radius?: number;
  mobileRadius?: number;
  startAngleDeg?: number;
  endAngleDeg?: number;
  className?: string;
  enableGooeyEffect?: boolean;
  showTooltips?: boolean;
};

export function RadialMenu({
  items: customItems,
  radius = 280,  // Doubled from 140
  mobileRadius = 220,  // Doubled from 110
  startAngleDeg = -170,
  endAngleDeg = -60,
  className,
  enableGooeyEffect = false,
  showTooltips = true,
}: RadialMenuProps) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const navigate = useNavigate();
  const { selectedProject } = useProject();
  const { user } = useAuth();

  // Primary actions (most important - positioned prominently)
  const getPrimaryItems = (): RadialItem[] => {
    const projectId = selectedProject?.id;
    return [
      {
        id: "create-project",
        label: "Neues Projekt",
        icon: <Home size={28} />,
        onSelect: () => {
          navigate(`${window.location.pathname}?create=project`);
        },
        color: "#ffbd59",
        description: "Projekt erstellen"
      },
      {
        id: "create-trade",
        label: "Neue Ausschreibung",
        icon: <Hammer size={28} />,
        onSelect: () => {
          if (projectId) {
            navigate(`${window.location.pathname}?create=trade&project=${projectId}`);
          } else {
            navigate(`${window.location.pathname}?create=trade`);
          }
        },
        color: "#8B5CF6",
        description: "Ausschreibung erstellen"
      }
    ];
  };

  // Secondary navigation items
  const getSecondaryItems = (): RadialItem[] => {
    const projectId = selectedProject?.id;
    return [
      {
        id: "manager",
        label: "Manager",
        icon: <Home size={24} />,
        onSelect: () => {
          if (projectId) {
            navigate(`/project/${projectId}`);
          } else {
            navigate('/');
          }
        },
        color: "#ffbd59",
        description: "Projekt- und Ausschreibungsverwaltung"
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
        description: "Aufgabenmanagement"
      },
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
        description: "Dokumentenmanagement"
      },
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
        description: "Analytics & Berichte"
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
        description: "Kollaboration & Zeichnungen"
      }
    ];
  };

  // Default items wenn keine customItems übergeben werden
  const getDefaultItems = (): RadialItem[] => {
    const primaryItems = getPrimaryItems();
    const secondaryItems = getSecondaryItems();
    
    // Combine with primary items first for better positioning
    return [...primaryItems, ...secondaryItems];
  };

  const items = customItems || getDefaultItems();

  // Responsive Detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const currentRadius = isMobile ? mobileRadius : radius;

  // Calculate layout with polar coordinates - screen-safe positioning
  const layout = useMemo(() => {
    const count = items.length;
    
    return items.map((item, i) => {
      const isPrimary = i < 2; // First 2 items are primary
      
      if (isPrimary) {
        // Primary buttons positioned horizontally to the left of FAB to avoid overlap
        const fabSize = isMobile ? 56 : 72;
        const buttonSize = isMobile ? 52 : 64;
        const spacing = isMobile ? 70 : 80;
        const baseOffset = -(fabSize/2 + buttonSize/2 + spacing); // Start to the left of FAB
        
        // Stack vertically but offset to the left
        const verticalSpacing = isMobile ? 60 : 70;
        const verticalOffset = -(verticalSpacing * (2 - 1)) / 2;
        
        return {
          x: baseOffset, // Positioned to the left of FAB
          y: verticalOffset + (i * verticalSpacing),
          angleDeg: -90, // Always pointing up
          isPrimary: true,
          isVertical: true,
          isHorizontal: true
        };
      } else {
        // Secondary buttons in a compact arc
        const adjustedRadius = isMobile ? 140 : 180;
        const secondaryCount = count - 2;
        const secondaryIndex = i - 2;
        
        // Compact arc from -135 to -45 degrees (safe area)
        const startAngle = -135;
        const endAngle = -45;
        const span = endAngle - startAngle;
        
        const t = secondaryCount === 1 ? 0.5 : secondaryIndex / (secondaryCount - 1);
        const angle = (startAngle + t * span) * (Math.PI / 180);
        const x = Math.cos(angle) * adjustedRadius;
        const y = Math.sin(angle) * adjustedRadius;
        
        return { x, y, angleDeg: startAngle + t * span, isPrimary: false, isVertical: false };
      }
    });
  }, [items, isMobile]);

  // Click outside to close
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) {
        setOpen(false);
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
      }
      return;
    }

    switch (e.key) {
      case "Escape":
        setOpen(false);
        buttonRef.current?.focus();
        break;
      case "ArrowLeft":
      case "ArrowUp":
        e.preventDefault();
        setActiveIndex((i) => {
          const currentIndex = i ?? 0;
          return (currentIndex - 1 + items.length) % items.length;
        });
        break;
      case "ArrowRight":
      case "ArrowDown":
        e.preventDefault();
        setActiveIndex((i) => {
          const currentIndex = i ?? 0;
          return (currentIndex + 1) % items.length;
        });
        break;
      case "Enter":
      case " ":
        e.preventDefault();
        if (activeIndex !== null) items[activeIndex]?.onSelect();
        setOpen(false);
        break;
      case "Tab":
        e.preventDefault();
        if (e.shiftKey) {
          setActiveIndex((i) => {
            const currentIndex = i ?? 0;
            return (currentIndex - 1 + items.length) % items.length;
          });
        } else {
          setActiveIndex((i) => {
            const currentIndex = i ?? 0;
            return (currentIndex + 1) % items.length;
          });
        }
        break;
    }
  };

  // Focus management
  useEffect(() => {
    if (open && activeIndex !== null && activeIndex >= 0) {
      const element = document.querySelector(`[data-radial-item="${items[activeIndex]?.id}"]`) as HTMLElement;
      element?.focus();
    }
  }, [activeIndex, open, items]);

  return (
    <>
      {/* Gooey Filter (optional) */}
      {enableGooeyEffect && (
        <svg style={{ position: 'absolute', width: 0, height: 0 }}>
          <defs>
            <filter id="gooey">
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
        className={className}
        style={{
          filter: enableGooeyEffect && open ? 'url(#gooey)' : undefined,
          zIndex: 9999,
        }}
        role="menu"
        aria-expanded={open}
        onKeyDown={handleKeyDown}
      >
        {/* Background overlay moved outside AnimatePresence */}
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0"
              style={{ 
                pointerEvents: 'none',
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0, 0, 0, 0.2)',
                backdropFilter: 'blur(8px)',
                zIndex: 9998
              }}
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {open && (
            <>

              {/* Radial menu items */}
              {items.map((item, i) => (
                <motion.button
                  key={item.id}
                  type="button"
                  role="menuitem"
                  aria-label={item.label}
                  data-radial-item={item.id}
                  initial={{ x: 0, y: 0, opacity: 0, scale: 0.3, rotate: -180 }}
                  animate={{
                    x: layout[i].x,
                    y: layout[i].y,
                    opacity: 1,
                    scale: hoveredIndex === i ? 1.15 : activeIndex === i ? 1.1 : 1,
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
                    stiffness: layout[i].isPrimary ? 400 : 350, // Primary buttons animate faster
                    damping: 25,
                    delay: layout[i].isPrimary ? 0.02 * i : 0.04 * i, // Primary buttons appear first
                  }}
                  onClick={() => {
                    item.onSelect();
                    setOpen(false);
                  }}
                  onMouseEnter={() => {
                    setHoveredIndex(i);
                    setActiveIndex(i);
                  }}
                  onMouseLeave={() => {
                    setHoveredIndex(null);
                    setActiveIndex(null);
                  }}
                  onFocus={() => setActiveIndex(i)}
                  className="absolute group"
                  style={{
                    // Primary items are larger and more prominent
                    width: layout[i].isPrimary 
                      ? (hoveredIndex === i ? (isMobile ? 60 : 72) : (isMobile ? 52 : 64))
                      : (hoveredIndex === i ? (isMobile ? 56 : 68) : (isMobile ? 48 : 60)),
                    height: layout[i].isPrimary 
                      ? (hoveredIndex === i ? (isMobile ? 60 : 72) : (isMobile ? 52 : 64))
                      : (hoveredIndex === i ? (isMobile ? 56 : 68) : (isMobile ? 48 : 60)),
                    borderRadius: "50%",
                    border: layout[i].isPrimary ? "2px solid rgba(255,255,255,0.3)" : "none",
                    background: layout[i].isPrimary
                      ? hoveredIndex === i || activeIndex === i 
                        ? `linear-gradient(135deg, ${item.color}, ${item.color}dd)`
                        : `linear-gradient(135deg, ${item.color}ee, ${item.color}cc)`
                      : hoveredIndex === i || activeIndex === i 
                        ? `linear-gradient(135deg, ${item.color}, ${item.color}dd)`
                        : `linear-gradient(135deg, #2a2f3a, #1f2937)`,
                    color: "white",
                    boxShadow: layout[i].isPrimary
                      ? hoveredIndex === i || activeIndex === i
                        ? `0 0 40px ${item.color}aa,
                           0 0 25px ${item.color}88,
                           0 0 15px ${item.color}66,
                           0 8px 24px ${item.color}60,
                           0 4px 12px rgba(0,0,0,0.4),
                           0 2px 6px rgba(0,0,0,0.3),
                           inset 0 2px 2px rgba(255,255,255,0.3),
                           inset 0 -2px 2px rgba(0,0,0,0.2)`
                        : `0 0 20px ${item.color}88,
                           0 0 12px ${item.color}66,
                           0 4px 16px ${item.color}50,
                           0 2px 8px rgba(0,0,0,0.3),
                           inset 0 1px 1px rgba(255,255,255,0.3),
                           inset 0 -1px 1px rgba(0,0,0,0.2)`
                      : hoveredIndex === i || activeIndex === i
                        ? `0 0 30px ${item.color}88,
                           0 0 18px ${item.color}66,
                           0 6px 20px ${item.color}50,
                           0 3px 10px rgba(0,0,0,0.3),
                           inset 0 1px 1px rgba(255,255,255,0.2),
                           inset 0 -1px 1px rgba(0,0,0,0.1)`
                        : "0 4px 12px rgba(0,0,0,0.25), 0 2px 6px rgba(0,0,0,0.2)",
                    cursor: "pointer",
                    willChange: "transform",
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    outline: 'none',
                    transition: 'background 0.3s ease',
                    zIndex: layout[i].isPrimary ? (hoveredIndex === i ? 10000 : 7500) : 5000,
                  }}
                  whileHover={{ 
                    scale: layout[i].isPrimary ? 1.2 : 1.15,
                    rotate: layout[i].isPrimary ? 5 : 0
                  }}
                  whileTap={{ scale: 0.95 }}
                >
                  {/* Icon */}
                  <div className="relative" style={{
                    transform: layout[i].isPrimary 
                      ? (hoveredIndex === i ? 'scale(1.2)' : 'scale(1.1)')
                      : (hoveredIndex === i ? 'scale(1.15)' : 'scale(1)'),
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

                  {/* Enhanced Tooltip */}
                  {showTooltips && (hoveredIndex === i || activeIndex === i) && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className={`absolute bottom-full mb-3 px-3 py-2 backdrop-blur-md rounded-lg shadow-xl whitespace-nowrap pointer-events-none ${
                        layout[i].isPrimary 
                          ? 'bg-gradient-to-r from-gray-900 to-gray-800 border border-[#ffbd59]/60' 
                          : 'bg-gray-900/95 border border-gray-700'
                      }`}
                      style={{ 
                        zIndex: 10002,
                        filter: layout[i].isPrimary 
                          ? `drop-shadow(0 0 20px ${item.color}40)`
                          : 'none'
                      }}
                    >
                      <div className={`text-sm font-semibold text-white ${layout[i].isPrimary ? 'text-base' : ''}`}>
                        {item.label}
                        {layout[i].isPrimary && (
                          <span className="ml-2 text-xs bg-yellow-500/20 px-2 py-0.5 rounded-full">
                            WICHTIG
                          </span>
                        )}
                      </div>
                      {item.description && (
                        <div className="text-xs text-gray-300 mt-0.5">{item.description}</div>
                      )}
                      <div 
                        className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-px"
                        style={{
                          width: 0,
                          height: 0,
                          borderLeft: '6px solid transparent',
                          borderRight: '6px solid transparent',
                          borderTop: layout[i].isPrimary ? '6px solid rgb(31 41 55)' : '6px solid rgb(17 24 39 / 0.95)',
                        }}
                      />
                    </motion.div>
                  )}
                </motion.button>
              ))}
            </>
          )}
        </AnimatePresence>

        {/* Central FAB button - Always on top */}
        <motion.button
          ref={buttonRef}
          type="button"
          aria-label={open ? "Menü schließen" : "Menü öffnen"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
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
            zIndex: 10001,
          }}
          whileTap={{ scale: 0.9 }}
          whileHover={{ scale: 1.1 }}
          animate={{ rotate: open ? 45 : 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
        >
          {open ? <X size={isMobile ? 24 : 32} /> : <Plus size={isMobile ? 24 : 32} />}
          
          {/* Pulse animation when closed */}
          {!open && (
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
          )}
        </motion.button>

        {/* Hint for first-time users */}
        {!open && !localStorage.getItem('radial-menu-hint-shown') && (
          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            className="absolute right-full mr-3 top-1/2 -translate-y-1/2 bg-gray-900/95 text-white px-3 py-2 rounded-lg text-sm whitespace-nowrap"
            style={{ zIndex: 10003 }}
            onAnimationComplete={() => {
              setTimeout(() => {
                localStorage.setItem('radial-menu-hint-shown', 'true');
              }, 5000);
            }}
          >
            <div className="flex items-center gap-2">
              <Info size={16} />
              <span>Klicken Sie für das Hauptmenü</span>
            </div>
            <div 
              className="absolute left-full top-1/2 transform -translate-y-1/2 -ml-px"
              style={{
                width: 0,
                height: 0,
                borderTop: '6px solid transparent',
                borderBottom: '6px solid transparent',
                borderLeft: '6px solid rgb(17 24 39 / 0.95)',
              }}
            />
          </motion.div>
        )}
      </div>

      <style>{`
        .service-provider-radial-menu {
          position: fixed !important;
          transform: translateZ(0) !important;
          will-change: transform !important;
          right: 24px !important;
          bottom: 24px !important;
        }
        
        @media (max-width: 768px) {
          .service-provider-radial-menu {
            right: 16px !important;
            bottom: 16px !important;
          }
        }
      `}</style>
    </>
  );
}
