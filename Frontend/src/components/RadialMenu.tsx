import { useMemo, useRef, useState, useEffect, KeyboardEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useProject } from "../context/ProjectContext";
import { 
  Home, 
  FileText, 
  CheckSquare, 
  Euro, 
  MessageSquare, 
  BarChart3, 
  Palette,
  Plus,
  X,
  Info
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
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const navigate = useNavigate();
  const { selectedProject } = useProject();

  // Default items wenn keine customItems übergeben werden
  const getDefaultItems = (): RadialItem[] => {
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
        description: "Projekt- und Gewerkverwaltung"
      },
      {
        id: "docs",
        label: "Docs",
        icon: <FileText size={24} />,
        onSelect: () => {
          if (projectId) {
            navigate(`/documents?project=${projectId}`);
          } else {
            navigate('/documents');
          }
        },
        color: "#4F46E5",
        description: "Dokumentenmanagement"
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
        description: "Budget & Ausgaben"
      },
      {
        id: "quotes",
        label: "Gewerke",
        icon: <MessageSquare size={24} />,
        onSelect: () => navigate('/quotes'),
        color: "#8B5CF6",
        description: "Angebote & Ausschreibungen"
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

  // Calculate layout with polar coordinates
  const layout = useMemo(() => {
    const count = items.length;
    const span = endAngleDeg - startAngleDeg;
    
    return items.map((_, i) => {
      const t = count === 1 ? 0.5 : i / (count - 1);
      const angle = (startAngleDeg + t * span) * (Math.PI / 180);
      const x = Math.cos(angle) * currentRadius;
      const y = Math.sin(angle) * currentRadius;
      return { x, y, angleDeg: startAngleDeg + t * span };
    });
  }, [items, currentRadius, startAngleDeg, endAngleDeg]);

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
        setActiveIndex((i) => (i - 1 + items.length) % items.length);
        break;
      case "ArrowRight":
      case "ArrowDown":
        e.preventDefault();
        setActiveIndex((i) => (i + 1) % items.length);
        break;
      case "Enter":
      case " ":
        e.preventDefault();
        items[activeIndex]?.onSelect();
        setOpen(false);
        break;
      case "Tab":
        e.preventDefault();
        if (e.shiftKey) {
          setActiveIndex((i) => (i - 1 + items.length) % items.length);
        } else {
          setActiveIndex((i) => (i + 1) % items.length);
        }
        break;
    }
  };

  // Focus management
  useEffect(() => {
    if (open && activeIndex !== null) {
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
          position: "fixed",
          right: isMobile ? 32 : 64,
          bottom: isMobile ? 32 : 64,
          zIndex: 9999,
          filter: enableGooeyEffect && open ? 'url(#gooey)' : undefined,
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
                zIndex: -1
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
                    stiffness: 350,
                    damping: 25,
                    delay: 0.04 * i,
                  }}
                  onClick={() => {
                    item.onSelect();
                    setOpen(false);
                  }}
                  onMouseEnter={() => {
                    setHoveredIndex(i);
                    setActiveIndex(i);
                  }}
                  onMouseLeave={() => setHoveredIndex(null)}
                  onFocus={() => setActiveIndex(i)}
                  className="absolute group"
                  style={{
                    width: isMobile ? 52 : 64,
                    height: isMobile ? 52 : 64,
                    borderRadius: "50%",
                    border: "none",
                    background: hoveredIndex === i || activeIndex === i 
                      ? `linear-gradient(135deg, ${item.color}, ${item.color}dd)`
                      : `linear-gradient(135deg, #2a2f3a, #1f2937)`,
                    color: "white",
                    boxShadow: hoveredIndex === i || activeIndex === i
                      ? `0 0 40px ${item.color}88,
                         0 0 25px ${item.color}66,
                         0 12px 32px ${item.color}60,
                         0 8px 20px rgba(0,0,0,0.4),
                         0 4px 12px rgba(0,0,0,0.3),
                         inset 0 1px 0 rgba(255,255,255,0.2)`
                      : "0 6px 16px rgba(0,0,0,0.25), 0 2px 6px rgba(0,0,0,0.2)",
                    cursor: "pointer",
                    willChange: "transform",
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    outline: 'none',
                    transition: 'background 0.3s ease',
                    zIndex: 50,
                  }}
                  whileHover={{ scale: 1.15 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {/* Icon */}
                  <div className="relative">
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
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute bottom-full mb-3 px-3 py-2 bg-gray-900/95 backdrop-blur-md rounded-lg shadow-xl border border-gray-700 whitespace-nowrap pointer-events-none"
                      style={{ zIndex: 10000 }}
                    >
                      <div className="text-sm font-semibold text-white">{item.label}</div>
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
                          borderTop: '6px solid rgb(17 24 39 / 0.95)',
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
    </>
  );
}
