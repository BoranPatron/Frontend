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
  FileText,
  Edit3,
  Save,
  RotateCcw,
  Building
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
  disabled?: boolean; // New property to disable items
  disabledReason?: string; // Reason why item is disabled
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
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [showCreateMenu, setShowCreateMenu] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [draggedItem, setDraggedItem] = useState<number | null>(null);
  const [customOrder, setCustomOrder] = useState<string[]>([]);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const navigate = useNavigate();
  const { selectedProject, projects } = useProject();
  const { user, userRole } = useAuth();

  // Check if any projects exist
  const hasProjects = projects.length > 0;

  // Load custom order from localStorage
  useEffect(() => {
    const savedOrder = localStorage.getItem('radial-menu-custom-order');
    if (savedOrder) {
      try {
        setCustomOrder(JSON.parse(savedOrder));
      } catch (error) {
        console.error('Error loading custom order:', error);
        setCustomOrder([]);
      }
    }
  }, []);

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
        tourId: "radial-menu-documents",
        disabled: !hasProjects,
        disabledReason: "Erstellen Sie zuerst ein Projekt"
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
        tourId: "radial-menu-tasks",
        disabled: !hasProjects,
        disabledReason: "Erstellen Sie zuerst ein Projekt"
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
        tourId: "radial-menu-visualize",
        disabled: !hasProjects,
        disabledReason: "Erstellen Sie zuerst ein Projekt"
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
        tourId: "radial-menu-canvas",
        disabled: !hasProjects,
        disabledReason: "Erstellen Sie zuerst ein Projekt"
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
        icon: <Building size={20} />,
        onSelect: () => {
          // Öffnet das globale Projekt-Erstellungs-Modal über URL-Parameter
          navigate(`${window.location.pathname}?create=project`);
        },
        color: "#ffbd59",
        description: "Projekt erstellen",
        ring: 2,
        tourId: "radial-menu-create-project"
        // Never disabled - always available
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
        ring: 2,
        disabled: !hasProjects,
        disabledReason: "Erstellen Sie zuerst ein Projekt"
      },

      {
        id: "create-trade",
        label: "Neue Ausschreibung",
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
        description: "Ausschreibung erstellen",
        ring: 2,
        disabled: !hasProjects,
        disabledReason: "Erstellen Sie zuerst ein Projekt"
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
        ring: 2,
        disabled: !hasProjects,
        disabledReason: "Erstellen Sie zuerst ein Projekt"
      }
    ];
  };

  const mainItems = getMainItems();
  // Sekundärreihe als Primärreihe integrieren
  const createItems = getCreateItems();
  const defaultItems = [...mainItems, ...createItems.map(ci => ({ ...ci, ring: 1 }))];

  // Apply custom order if available
  const allItems = useMemo(() => {
    if (customOrder.length === 0) {
      return defaultItems;
    }

    // Create a map of items by ID for quick lookup
    const itemsMap = new Map(defaultItems.map(item => [item.id, item]));
    
    // Build ordered array based on custom order
    const orderedItems: RadialItem[] = [];
    
    // Add items in custom order
    for (const id of customOrder) {
      const item = itemsMap.get(id);
      if (item) {
        orderedItems.push(item);
        itemsMap.delete(id);
      }
    }
    
    // Add any remaining items that weren't in custom order
    itemsMap.forEach(item => {
      orderedItems.push(item);
    });
    
    return orderedItems;
  }, [defaultItems, customOrder]);

  // Don't set initial activeIndex - let it remain null until user interaction

  // Save custom order to localStorage
  const saveCustomOrder = useCallback((newOrder: string[]) => {
    setCustomOrder(newOrder);
    localStorage.setItem('radial-menu-custom-order', JSON.stringify(newOrder));
  }, []);

  // Reset to default order
  const resetToDefault = useCallback(() => {
    setCustomOrder([]);
    localStorage.removeItem('radial-menu-custom-order');
  }, []);

  // Drag and drop handlers
  const handleDragStart = useCallback((e: React.DragEvent, index: number) => {
    if (!isEditMode) return;
    setDraggedItem(index);
    e.dataTransfer.effectAllowed = 'move';
  }, [isEditMode]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    if (!isEditMode) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, [isEditMode]);

  const handleDrop = useCallback((e: React.DragEvent, dropIndex: number) => {
    if (!isEditMode || draggedItem === null) return;
    e.preventDefault();
    
    const newOrder = [...allItems.map(item => item.id)];
    const draggedId = newOrder[draggedItem];
    
    // Remove dragged item from its current position
    newOrder.splice(draggedItem, 1);
    
    // Insert at new position
    newOrder.splice(dropIndex, 0, draggedId);
    
    saveCustomOrder(newOrder);
    setDraggedItem(null);
  }, [isEditMode, draggedItem, allItems, saveCustomOrder]);

  const handleDragEnd = useCallback(() => {
    setDraggedItem(null);
  }, []);

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
        // Exit edit mode when closing menu
        if (isEditMode) {
          setIsEditMode(false);
        }
      }
    };
    
    if (open) {
      document.addEventListener("pointerdown", handleOutsideClick);
      return () => document.removeEventListener("pointerdown", handleOutsideClick);
    }
  }, [open, isEditMode]);

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
        setActiveIndex((i) => {
          const currentIndex = i ?? 0;
          let newIndex = (currentIndex - 1 + allItems.length) % allItems.length;
          // Skip disabled items
          while (allItems[newIndex]?.disabled && newIndex !== currentIndex) {
            newIndex = (newIndex - 1 + allItems.length) % allItems.length;
          }
          return newIndex;
        });
        break;
      case "ArrowRight":
      case "ArrowDown":
        e.preventDefault();
        setActiveIndex((i) => {
          const currentIndex = i ?? 0;
          let newIndex = (currentIndex + 1) % allItems.length;
          // Skip disabled items
          while (allItems[newIndex]?.disabled && newIndex !== currentIndex) {
            newIndex = (newIndex + 1) % allItems.length;
          }
          return newIndex;
        });
        break;
      case "Enter":
      case " ":
        e.preventDefault();
        if (activeIndex !== null && !allItems[activeIndex]?.disabled) {
          allItems[activeIndex]?.onSelect();
          setOpen(false);
          setShowCreateMenu(false);
        }
        break;
      case "Tab":
        e.preventDefault();
        if (e.shiftKey) {
          setActiveIndex((i) => {
            const currentIndex = i ?? 0;
            let newIndex = (currentIndex - 1 + allItems.length) % allItems.length;
            // Skip disabled items
            while (allItems[newIndex]?.disabled && newIndex !== currentIndex) {
              newIndex = (newIndex - 1 + allItems.length) % allItems.length;
            }
            return newIndex;
          });
        } else {
          setActiveIndex((i) => {
            const currentIndex = i ?? 0;
            let newIndex = (currentIndex + 1) % allItems.length;
            // Skip disabled items
            while (allItems[newIndex]?.disabled && newIndex !== currentIndex) {
              newIndex = (newIndex + 1) % allItems.length;
            }
            return newIndex;
          });
        }
        break;
      case "c":
      case "C":
        // Toggle create menu with 'C' key
        if (enableSecondRing) {
          setShowCreateMenu(!showCreateMenu);
        }
        break;
      case "e":
      case "E":
        // Toggle edit mode with 'E' key
        if (open) {
          e.preventDefault();
          setIsEditMode(!isEditMode);
        }
        break;
      case "r":
      case "R":
        // Reset order with 'R' key
        if (open && customOrder.length > 0) {
          e.preventDefault();
          resetToDefault();
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
          right: isMobile ? 112 : 144,
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
                  draggable={isEditMode && !item.disabled}
                  onDragStart={(e) => handleDragStart(e as unknown as React.DragEvent<Element>, i)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, i)}
                  onDragEnd={handleDragEnd}
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
                    opacity: item.disabled ? 0.6 : draggedItem === i ? 0.8 : 1,
                    scale: item.disabled ? 1 : hoveredIndex === i ? 1.25 : activeIndex === i ? 1.1 : 1,
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
                    if (!item.disabled && !isEditMode) {
                      item.onSelect();
                      setOpen(false);
                      setShowCreateMenu(false);
                    }
                  }}
                  onMouseEnter={() => {
                    if (!item.disabled) {
                      setHoveredIndex(i);
                      setActiveIndex(i);
                    }
                  }}
                  onMouseLeave={() => {
                    setHoveredIndex(null);
                    setActiveIndex(null);
                  }}
                  onFocus={() => {
                    if (!item.disabled) {
                      setActiveIndex(i);
                    }
                  }}
                  className={`absolute group ${item.disabled ? 'cursor-not-allowed' : isEditMode ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'}`}
                  style={{
                    width: hoveredIndex === i ? (isMobile ? 64 : 76) : (isMobile ? 52 : 64),
                    height: hoveredIndex === i ? (isMobile ? 64 : 76) : (isMobile ? 52 : 64),
                    borderRadius: "50%",
                    border: "none",
                    background: item.disabled 
                      ? "linear-gradient(135deg, #6b7280, #4b5563)"
                      : hoveredIndex === i || activeIndex === i 
                        ? `linear-gradient(135deg, ${item.color}, ${item.color}dd)`
                        : `linear-gradient(135deg, #2a2f3a, #1f2937)`,
                    color: item.disabled ? "#9ca3af" : "white",
                    boxShadow: item.disabled
                      ? "0 4px 12px rgba(0,0,0,0.2), 0 2px 6px rgba(0,0,0,0.1)"
                      : hoveredIndex === i || activeIndex === i
                        ? `0 0 60px ${item.color}aa,
                           0 0 40px ${item.color}88,
                           0 0 25px ${item.color}66,
                           0 12px 32px ${item.color}60,
                           0 8px 20px rgba(0,0,0,0.4),
                           0 4px 12px rgba(0,0,0,0.3),
                           inset 0 2px 2px rgba(255,255,255,0.3),
                           inset 0 -2px 2px rgba(0,0,0,0.2)`
                        : "0 6px 16px rgba(0,0,0,0.25), 0 2px 6px rgba(0,0,0,0.2)",
                    cursor: item.disabled ? "not-allowed" : "pointer",
                    willChange: "transform",
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    outline: 'none',
                    transition: 'background 0.3s ease, z-index 0.1s ease',
                    opacity: item.disabled ? 0.6 : 1,
                    zIndex: hoveredIndex === i ? 500 : 50,
                  }}
                  whileHover={item.disabled ? {} : { scale: 1.2 }}
                  whileTap={item.disabled ? {} : { scale: 0.95 }}
                >
                  {/* Icon */}
                  <div className="relative" style={{
                    transform: item.disabled ? 'scale(1)' : hoveredIndex === i ? 'scale(1.15)' : 'scale(1)',
                    transition: 'transform 0.2s ease',
                    opacity: item.disabled ? 0.7 : 1
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
                      {item.disabled && (
                        <div className="text-xs text-red-300 mt-1">{item.disabledReason}</div>
                      )}
                      {isEditMode && !item.disabled && (
                        <div className="text-xs text-blue-300 mt-1">Zum Verschieben ziehen</div>
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

        {/* Edit Mode Controls */}
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute bottom-20 right-32 flex flex-col gap-2"
          >
            {/* Edit Mode Toggle */}
            <button
              onClick={() => setIsEditMode(!isEditMode)}
              className={`p-3 rounded-full shadow-lg transition-all duration-200 transform hover:scale-110 ${
                isEditMode 
                  ? 'bg-gradient-to-r from-green-500 to-green-600 text-white' 
                  : 'bg-gradient-to-r from-gray-600 to-gray-700 text-gray-300 hover:text-white'
              }`}
              title={isEditMode ? "Bearbeitungsmodus beenden" : "Reihenfolge bearbeiten"}
            >
              <Edit3 size={20} />
            </button>

            {/* Reset Order Button */}
            {customOrder.length > 0 && (
              <button
                onClick={resetToDefault}
                className="p-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-full shadow-lg transition-all duration-200 transform hover:scale-110"
                title="Standardreihenfolge wiederherstellen"
              >
                <RotateCcw size={20} />
              </button>
            )}
          </motion.div>
        )}

        {/* Edit Mode Indicator */}
        {isEditMode && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute top-4 right-36 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2"
          >
            <Edit3 size={16} />
            <span className="text-sm font-medium">Bearbeitungsmodus</span>
          </motion.div>
        )}

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
              <span>E Edit Mode</span>
              {customOrder.length > 0 && <span>R Reset</span>}
              <span>ESC Close</span>
            </div>
          </motion.div>
        )}
      </div>

      <style>{`
        .radial-menu-container {
          -webkit-tap-highlight-color: transparent;
          user-select: none;
        }
      `}</style>
    </>
  );
}
