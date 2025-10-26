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
  Building,
  Users,
  CreditCard
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
  const [isDragMode, setIsDragMode] = useState(false);
  const [draggedItem, setDraggedItem] = useState<number | null>(null);
  const [customOrder, setCustomOrder] = useState<string[]>([]);
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);
  const [longPressStartTime, setLongPressStartTime] = useState<number | null>(null);
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

  // Primary actions (most important - inner ring)
  const getPrimaryItems = (): RadialItem[] => {
    const projectId = selectedProject?.id;
    
    // Dienstleister-spezifische Primary Items
    if (userRole === 'dienstleister' || userRole === 'DIENSTLEISTER') {
      return [
        {
          id: "create-resource",
          label: "Neue Ressource",
          icon: <Users size={28} />,
          onSelect: () => {
            // Navigate to service provider dashboard with resource modal
            window.location.href = '/service-provider?showResourceManagement=true';
          },
          color: "#10B981",
          description: "Neue Ressource erfassen",
          ring: 1,
          tourId: "radial-menu-create-resource"
        }
      ];
    }
    
    // Bauträger Primary Items
    return [
      {
        id: "create-project",
        label: "Neues Projekt",
        icon: <Building size={28} />,
        onSelect: () => {
          navigate(`${window.location.pathname}?create=project`);
        },
        color: "#ffbd59",
        description: "Projekt erstellen",
        ring: 1, // Primary ring
        tourId: "radial-menu-create-project"
        // Never disabled - always available
      },
      {
        id: "create-trade",
        label: "Neue Ausschreibung",
        icon: <Hammer size={28} />,
        onSelect: () => {
          // Dispatch event to open trade creation form on dashboard
          const event = new CustomEvent('openTradeCreationForm', { 
            detail: { projectId: projectId || null } 
          });
          window.dispatchEvent(event);
        },
        color: "#8B5CF6",
        description: "Ausschreibung erstellen",
        ring: 1, // Primary ring
        disabled: !hasProjects,
        disabledReason: "Erstellen Sie zuerst ein Projekt"
      }
    ];
  };

  // Secondary navigation items (outer ring)
  const getSecondaryItems = (): RadialItem[] => {
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
        ring: 2,
        tourId: "radial-menu-documents",
        disabled: !hasProjects,
        disabledReason: "Erstellen Sie zuerst ein Projekt"
      },
      {
        id: "tasks",
        label: "To-Do",
        icon: <CheckSquare size={24} />,
        onSelect: () => {
          // Dispatch event to scroll to todo section on dashboard instead of navigating
          const event = new CustomEvent('scrollToTodo');
          window.dispatchEvent(event);
        },
        color: "#10B981",
        description: "Neue Aufgabe erstellen",
        ring: 2,
        tourId: "radial-menu-tasks",
        disabled: !hasProjects,
        disabledReason: "Erstellen Sie zuerst ein Projekt"
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
        description: "Analytics & Berichte",
        ring: 2,
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
        ring: 2,
        tourId: "radial-menu-canvas",
        disabled: !hasProjects,
        disabledReason: "Erstellen Sie zuerst ein Projekt"
      },
      {
        id: "create-task",
        label: "Neue Aufgabe",
        icon: <ListPlus size={24} />,
        onSelect: () => {
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
        id: "upload-doc",
        label: "Upload",
        icon: <Upload size={24} />,
        onSelect: () => {
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

    // Filter based on user role and subscription
    if (userRole === 'dienstleister' || userRole === 'DIENSTLEISTER') {
      // Dienstleister-spezifische Items
      return [
        {
          id: "documents",
          label: "Dokumente",
          icon: <FileText size={24} />,
          onSelect: () => navigate('/documents'),
          color: "#3B82F6",
          description: "Dokumentenmanagement",
          ring: 2,
          tourId: "radial-menu-documents"
        },
        {
          id: "tasks",
          label: "To-Do",
          icon: <CheckSquare size={24} />,
          onSelect: () => {
            // For service providers, also scroll to todo section instead of navigating
            const event = new CustomEvent('scrollToTodo');
            window.dispatchEvent(event);
          },
          color: "#10B981",
          description: "Neue Aufgabe erstellen",
          ring: 2,
          tourId: "radial-menu-tasks"
        },
        {
          id: "upload-doc",
          label: "Upload",
          icon: <Upload size={24} />,
          onSelect: () => navigate('/documents?create=upload'),
          color: "#4F46E5",
          description: "Dokument hochladen",
          ring: 2
        },
        {
          id: "invoices",
          label: "Rechnungen",
          icon: <CreditCard size={28} />,
          onSelect: () => navigate('/invoices'),
          color: "#F59E0B",
          description: "Rechnungsverwaltung",
          ring: 1, // Moved to primary ring for service providers
          tourId: "radial-menu-invoices"
        },
        {
          id: "bidding",
          label: "Ausschreibungen",
          icon: <Hammer size={24} />,
          onSelect: () => {
            // Check if we're already on the service provider dashboard
            if (window.location.pathname === '/service-provider') {
              // Already on dashboard - just scroll to section
              const event = new CustomEvent('scrollToBidding');
              window.dispatchEvent(event);
            } else {
              // Navigate to dashboard first, then scroll
              navigate('/service-provider?scrollToBidding=true');
            }
          },
          color: "#8B5CF6",
          description: "Ausschreibungen in Ihrer Nähe",
          ring: 2, // Outer ring for service providers
          tourId: "radial-menu-bidding"
        }
      ];
    }
    
    if (userRole === 'bautraeger' || userRole === 'BAUTRAEGER') {
      const isProUser = user?.subscription_plan === 'PRO' && user?.subscription_status === 'ACTIVE';
      if (!isProUser) {
        return items;
      }
    }
    
    return items;
  };

  const primaryItems = getPrimaryItems();
  const secondaryItems = getSecondaryItems();
  
  // Combine all items with proper ring assignment
  const defaultItems = [...primaryItems, ...secondaryItems];

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

  // Drag and drop handlers - only for secondary buttons
  const handleDragStart = useCallback((e: React.DragEvent, index: number) => {
    if (!isDragMode) return;
    const item = allItems[index];
    // Only allow dragging of secondary buttons (ring 2)
    if (item.ring === 1) return;
    setDraggedItem(index);
    e.dataTransfer.effectAllowed = 'move';
  }, [isDragMode, allItems]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    if (!isDragMode) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, [isDragMode]);

  const handleDrop = useCallback((e: React.DragEvent, dropIndex: number) => {
    if (!isDragMode || draggedItem === null) return;
    e.preventDefault();
    
    const draggedItem_obj = allItems[draggedItem];
    const dropItem_obj = allItems[dropIndex];
    
    // Only allow dropping on secondary buttons (ring 2)
    if (draggedItem_obj.ring === 1 || dropItem_obj.ring === 1) return;
    
    const newOrder = [...allItems.map(item => item.id)];
    const draggedId = newOrder[draggedItem];
    
    // Remove dragged item from its current position
    newOrder.splice(draggedItem, 1);
    
    // Insert at new position
    newOrder.splice(dropIndex, 0, draggedId);
    
    saveCustomOrder(newOrder);
    setDraggedItem(null);
  }, [isDragMode, draggedItem, allItems, saveCustomOrder]);

  const handleDragEnd = useCallback(() => {
    setDraggedItem(null);
  }, []);

  // Calculate layout with multiple rings - screen-safe positioning with vertical primary layout
  const layout = useMemo(() => {
    // Even larger radii for maximum spacing
    const primaryRadius = isMobile ? 70 : 90;  // Inner ring - keep same
    const secondaryRadius = isMobile ? 200 : 240;  // Outer ring - even larger
    
    return allItems.map((item, i) => {
      const isPrimaryRing = item.ring === 1;
      
      if (isPrimaryRing) {
        // Primary buttons positioned horizontally to the left of FAB to avoid overlap
        const primaryItems = allItems.filter(i => i.ring === 1);
        const indexInPrimary = primaryItems.indexOf(item);
        const primaryCount = primaryItems.length;
        
        // Primary buttons positioned to the left of FAB in a vertical line
        const fabSize = isMobile ? 56 : 72;
        const buttonSize = isMobile ? 52 : 64;
        const spacing = isMobile ? 80 : 100; // Distance from FAB
        const baseOffset = -(fabSize/2 + buttonSize/2 + spacing); // Position to the left of FAB
        
        // Stack vertically
        const verticalSpacing = isMobile ? 60 : 70;
        const verticalOffset = -(verticalSpacing * (primaryCount - 1)) / 2;
        
        return {
          x: baseOffset, // Positioned to the left of FAB
          y: verticalOffset + (indexInPrimary * verticalSpacing),
          angleDeg: -90, // Always pointing up
          ring: item.ring,
          isVertical: true,
          isHorizontal: true
        };
      } else {
        // Secondary buttons in a compact arc - moved further left
        const radius = secondaryRadius;
        const itemsInRing = allItems.filter(i => i.ring === 2);
        const indexInRing = itemsInRing.indexOf(item);
        const countInRing = itemsInRing.length;
        
        // Quarter circle arrangement with left alignment - from -90° to -180° (left side)
        const startAngle = -90;  // Start at top
        const endAngle = -180;    // End at left side
        const span = endAngle - startAngle;
        
        const t = countInRing === 1 ? 0.5 : indexInRing / (countInRing - 1);
        const angle = (startAngle + t * span) * (Math.PI / 180);
        
        // No left offset needed since we're already going left
        const leftOffset = 0;
        
        return {
          x: Math.cos(angle) * radius + leftOffset,
          y: Math.sin(angle) * radius,
          angleDeg: startAngle + t * span,
          ring: item.ring,
          isVertical: false
        };
      }
    });
  }, [allItems, isMobile]);

  // Click outside to close
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) {
        setOpen(false);
        setShowCreateMenu(false);
        setHoveredIndex(null);
        // Exit drag mode when closing menu
        if (isDragMode) {
          setIsDragMode(false);
        }
      }
    };
    
    if (open) {
      document.addEventListener("pointerdown", handleOutsideClick);
      return () => document.removeEventListener("pointerdown", handleOutsideClick);
    }
  }, [open, isDragMode]);

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
          const currentItem = allItems[currentIndex];
          
          // If in primary ring, stay in primary ring
          if (currentItem?.ring === 1) {
            const primaryItems = allItems.filter(item => item.ring === 1);
            const currentPrimaryIndex = primaryItems.indexOf(currentItem);
            let newPrimaryIndex = (currentPrimaryIndex - 1 + primaryItems.length) % primaryItems.length;
            const newItem = primaryItems[newPrimaryIndex];
            return allItems.indexOf(newItem);
          }
          
          // Otherwise navigate normally
          let newIndex = (currentIndex - 1 + allItems.length) % allItems.length;
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
          const currentItem = allItems[currentIndex];
          
          // If in primary ring, stay in primary ring
          if (currentItem?.ring === 1) {
            const primaryItems = allItems.filter(item => item.ring === 1);
            const currentPrimaryIndex = primaryItems.indexOf(currentItem);
            let newPrimaryIndex = (currentPrimaryIndex + 1) % primaryItems.length;
            const newItem = primaryItems[newPrimaryIndex];
            return allItems.indexOf(newItem);
          }
          
          // Otherwise navigate normally
          let newIndex = (currentIndex + 1) % allItems.length;
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
      case "1":
        // Jump to primary ring
        e.preventDefault();
        const primaryItems = allItems.filter(item => item.ring === 1 && !item.disabled);
        if (primaryItems.length > 0) {
          setActiveIndex(allItems.indexOf(primaryItems[0]));
        }
        break;
      case "2":
        // Jump to secondary ring
        e.preventDefault();
        const secondaryItems = allItems.filter(item => item.ring === 2 && !item.disabled);
        if (secondaryItems.length > 0) {
          setActiveIndex(allItems.indexOf(secondaryItems[0]));
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
        // Toggle drag mode with 'E' key (alternative to long press)
        if (open) {
          e.preventDefault();
          setIsDragMode(!isDragMode);
          
          // Trigger vibration if supported
          if (navigator.vibrate) {
            navigator.vibrate([100, 50, 100]);
          }
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

  // Long press detection for drag mode activation (3 seconds)
  const handleFABTouchStart = useCallback(() => {
    if (!open) {
      // Normal menu opening
      const timer = setTimeout(() => {
        setOpen(true);
        if (enableSecondRing) {
          setShowCreateMenu(true);
        }
        // On mobile, start with primary ring focused
        const primaryItems = allItems.filter(item => item.ring === 1 && !item.disabled);
        if (primaryItems.length > 0) {
          setActiveIndex(allItems.indexOf(primaryItems[0]));
        }
      }, isMobile ? 300 : 500);
      setLongPressTimer(timer);
    } else {
      // Long press on FAB when menu is open - activate drag mode
      setLongPressStartTime(Date.now());
      const timer = setTimeout(() => {
        // 3 seconds passed - activate drag mode
        setIsDragMode(true);
        
        // Trigger vibration if supported
        if (navigator.vibrate) {
          navigator.vibrate([100, 50, 100]); // Vibrate pattern
        }
        
        // Visual feedback - make all draggable buttons vibrate
        const draggableButtons = document.querySelectorAll('[data-draggable="true"]');
        draggableButtons.forEach(button => {
          button.classList.add('animate-pulse');
          setTimeout(() => button.classList.remove('animate-pulse'), 1000);
        });
        
      }, 3000); // 3 seconds
      setLongPressTimer(timer);
    }
  }, [open, enableSecondRing, allItems, isMobile]);

  const handleFABTouchEnd = useCallback(() => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
    
    // If we were in a long press for drag mode, cancel it
    if (longPressStartTime && Date.now() - longPressStartTime < 3000) {
      setLongPressStartTime(null);
    }
  }, [longPressTimer, longPressStartTime]);

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
          filter: enableGooeyEffect && open ? 'url(#gooey-advanced)' : undefined,
          zIndex: document.querySelector('[data-tour-id-root]') ? 9998 : 99999,
          position: 'fixed',
          right: isMobile ? 16 : 24,
          bottom: isMobile ? 16 : 24,
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
                zIndex: 9998
              }}
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {open && (
            <>

              {/* Quarter circle indicators for left-aligned arrangement */}
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: isMobile ? 0.1 : 0.15, scale: 1 }}
                exit={{ opacity: 0, scale: 0 }}
                className="absolute"
                style={{
                  width: isMobile ? 140 : 180,
                  height: isMobile ? 140 : 180,
                  border: isMobile ? '1px dashed rgba(255, 189, 89, 0.3)' : '2px dashed rgba(255, 189, 89, 0.4)',
                  borderRadius: '50%',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  pointerEvents: 'none',
                  background: 'radial-gradient(circle, rgba(255, 189, 89, 0.05) 0%, transparent 70%)',
                  clipPath: 'polygon(50% 50%, 50% 0%, 0% 0%, 0% 50%)' // Quarter circle mask
                }}
              />
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: isMobile ? 0.05 : 0.1, scale: 1 }}
                exit={{ opacity: 0, scale: 0 }}
                transition={{ delay: 0.1 }}
                className="absolute"
                style={{
                  width: isMobile ? 400 : 480,
                  height: isMobile ? 400 : 480,
                  border: '1px dashed rgba(139, 92, 246, 0.2)',
                  borderRadius: '50%',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  pointerEvents: 'none',
                  background: 'radial-gradient(circle, rgba(139, 92, 246, 0.02) 0%, transparent 70%)',
                  clipPath: 'polygon(50% 50%, 50% 0%, 0% 0%, 0% 50%)' // Quarter circle mask
                }}
              />
              
              {/* Horizontal indicator for primary buttons - positioned to the left */}
              <motion.div
                initial={{ opacity: 0, scaleX: 0 }}
                animate={{ opacity: 0.1, scaleX: 1 }}
                exit={{ opacity: 0, scaleX: 0 }}
                transition={{ delay: 0.2 }}
                className="absolute"
                style={{
                  width: isMobile ? '120' : '140',
                  height: '2px',
                  background: 'linear-gradient(to left, rgba(255, 189, 89, 0.3), transparent)',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  pointerEvents: 'none',
                }}
              />
              
              {/* Vertical indicator for primary buttons - positioned to the left */}
              <motion.div
                initial={{ opacity: 0, scaleY: 0 }}
                animate={{ opacity: 0.1, scaleY: 1 }}
                exit={{ opacity: 0, scaleY: 0 }}
                transition={{ delay: 0.3 }}
                className="absolute"
                style={{
                  width: '2px',
                  height: isMobile ? '120' : '140',
                  background: 'linear-gradient(to top, rgba(255, 189, 89, 0.3), transparent)',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  pointerEvents: 'none',
                }}
              />

              {/* Radial menu items */}
              {allItems.map((item, i) => (
                <motion.button
                  key={item.id}
                  type="button"
                  role="menuitem"
                  aria-label={item.label}
                  data-radial-item={item.id}
                  data-tour-id={item.tourId}
                  draggable={isDragMode && !item.disabled && item.ring === 2}
                  data-draggable={isDragMode && !item.disabled && item.ring === 2}
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
                    stiffness: item.ring === 1 ? 400 : 350, // Primary buttons animate faster
                    damping: 25,
                    delay: item.ring === 1 ? 0.02 * i : 0.04 * i, // Primary buttons appear first
                  }}
                  onClick={() => {
                    if (!item.disabled && !isDragMode) {
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
                  className={`absolute group ${item.disabled ? 'cursor-not-allowed' : isDragMode && item.ring === 2 ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'}`}
                  style={{
                    // Primary ring buttons are larger and more prominent
                    width: item.ring === 1 
                      ? (hoveredIndex === i ? (isMobile ? 60 : 72) : (isMobile ? 52 : 64))
                      : (hoveredIndex === i ? (isMobile ? 56 : 68) : (isMobile ? 48 : 60)),
                    height: item.ring === 1 
                      ? (hoveredIndex === i ? (isMobile ? 60 : 72) : (isMobile ? 52 : 64))
                      : (hoveredIndex === i ? (isMobile ? 56 : 68) : (isMobile ? 48 : 60)),
                    borderRadius: "50%",
                    border: item.ring === 1 ? "2px solid rgba(255,255,255,0.3)" : "none",
                    background: item.disabled 
                      ? "linear-gradient(135deg, #6b7280, #4b5563)"
                      : item.ring === 1
                        ? hoveredIndex === i || activeIndex === i 
                          ? `linear-gradient(135deg, ${item.color}, ${item.color}dd)`
                          : `linear-gradient(135deg, ${item.color}ee, ${item.color}cc)`
                        : hoveredIndex === i || activeIndex === i 
                          ? `linear-gradient(135deg, ${item.color}, ${item.color}dd)`
                          : `linear-gradient(135deg, #2a2f3a, #1f2937)`,
                    color: item.disabled ? "#9ca3af" : "white",
                    boxShadow: item.disabled
                      ? "0 4px 12px rgba(0,0,0,0.2), 0 2px 6px rgba(0,0,0,0.1)"
                      : item.ring === 1
                        ? hoveredIndex === i || activeIndex === i
                          ? `0 0 60px ${item.color}aa,
                             0 0 40px ${item.color}88,
                             0 0 25px ${item.color}66,
                             0 12px 32px ${item.color}60,
                             0 8px 20px rgba(0,0,0,0.4),
                             0 4px 12px rgba(0,0,0,0.3),
                             inset 0 2px 2px rgba(255,255,255,0.3),
                             inset 0 -2px 2px rgba(0,0,0,0.2)`
                          : `0 0 30px ${item.color}88,
                             0 0 20px ${item.color}66,
                             0 6px 20px ${item.color}50,
                             0 3px 10px rgba(0,0,0,0.3),
                             inset 0 1px 1px rgba(255,255,255,0.3),
                             inset 0 -1px 1px rgba(0,0,0,0.2)`
                        : hoveredIndex === i || activeIndex === i
                          ? `0 0 40px ${item.color}88,
                             0 0 25px ${item.color}66,
                             0 8px 24px ${item.color}50,
                             0 4px 12px rgba(0,0,0,0.3),
                             inset 0 1px 1px rgba(255,255,255,0.2),
                             inset 0 -1px 1px rgba(0,0,0,0.1)`
                          : "0 4px 12px rgba(0,0,0,0.25), 0 2px 6px rgba(0,0,0,0.2)",
                    cursor: item.disabled ? "not-allowed" : "pointer",
                    willChange: "transform",
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    outline: 'none',
                    transition: 'background 0.3s ease, z-index 0.1s ease',
                    opacity: item.disabled ? 0.6 : 1,
                    zIndex: item.ring === 1 ? (hoveredIndex === i ? 10000 : 7500) : (hoveredIndex === i ? 5000 : 2500),
                  }}
                  whileHover={item.disabled ? {} : { 
                    scale: item.ring === 1 ? 1.25 : 1.2,
                    rotate: item.ring === 1 ? 5 : 0
                  }}
                  whileTap={item.disabled ? {} : { scale: 0.95 }}
                >
                  {/* Icon */}
                  <div className="relative" style={{
                    transform: item.disabled 
                      ? 'scale(1)' 
                      : item.ring === 1 
                        ? (hoveredIndex === i ? 'scale(1.25)' : 'scale(1.1)')
                        : (hoveredIndex === i ? 'scale(1.15)' : 'scale(1)'),
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

                  {/* Enhanced Tooltip */}
                  {showTooltips && (hoveredIndex === i || activeIndex === i) && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.9 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.9 }}
                      className={`absolute bottom-full mb-4 px-4 py-3 backdrop-blur-lg rounded-xl shadow-2xl whitespace-nowrap pointer-events-none ${
                        item.ring === 1 
                          ? 'bg-gradient-to-r from-gray-900 to-gray-800 border-2 border-[#ffbd59]/60' 
                          : 'bg-gray-900 border-2 border-[#ffbd59]/50'
                      }`}
                      style={{ 
                        zIndex: 10002,
                        filter: item.ring === 1 
                          ? `drop-shadow(0 0 30px ${item.color}40) drop-shadow(0 0 15px rgba(255,189,89,0.4))`
                          : 'drop-shadow(0 0 20px rgba(255,189,89,0.3))'
                      }}
                    >
                      <div className={`text-sm font-bold text-white ${item.ring === 1 ? 'text-lg' : ''}`}>
                        {item.label}
                        {item.ring === 1 && (
                          <span className="ml-2 text-xs bg-yellow-500/20 px-2 py-0.5 rounded-full">
                            WICHTIG
                          </span>
                        )}
                      </div>
                      {item.description && (
                        <div className="text-xs text-gray-300 mt-1">{item.description}</div>
                      )}
                      {item.disabled && (
                        <div className="text-xs text-red-300 mt-1">{item.disabledReason}</div>
                      )}
                      {isDragMode && !item.disabled && item.ring === 2 && (
                        <div className="text-xs text-blue-300 mt-1">Zum Verschieben ziehen</div>
                      )}
                      <div 
                        className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-px"
                        style={{
                          width: 0,
                          height: 0,
                          borderLeft: '8px solid transparent',
                          borderRight: '8px solid transparent',
                          borderTop: item.ring === 1 ? '8px solid rgb(31 41 55)' : '8px solid rgb(17 24 39)',
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
          data-feature-id="radial-menu-fab"
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
          onTouchStart={handleFABTouchStart}
          onTouchEnd={handleFABTouchEnd}
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
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse" style={{ zIndex: 10002 }} />
              )}
            </>
          )}
        </motion.button>

        {/* Drag Mode Indicator - Unauffälliger */}
        {isDragMode && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute top-4 right-4 bg-blue-500/80 text-white px-3 py-1.5 rounded-full shadow-md flex items-center gap-2 text-sm"
            style={{
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255,255,255,0.1)',
              zIndex: 10003
            }}
          >
            <Edit3 size={14} />
            <span className="font-medium">Verschiebemodus</span>
          </motion.div>
        )}

        {/* Hint for keyboard shortcuts - desktop */}
        {open && !isMobile && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute left-1/2 transform -translate-x-1/2 -bottom-24 bg-gray-900/90 text-white text-xs px-3 py-2 rounded-lg whitespace-nowrap"
            style={{ zIndex: 10003 }}
          >
            <div className="flex items-center gap-4">
              <span>←→ Navigate</span>
              <span>1/2 Switch Ring</span>
              <span>Enter Select</span>
              <span>E Drag Mode</span>
              {customOrder.length > 0 && <span>R Reset</span>}
              <span>ESC Close</span>
            </div>
          </motion.div>
        )}

        {/* Mobile hint */}
        {open && isMobile && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute left-1/2 transform -translate-x-1/2 -bottom-20 bg-gray-900/90 text-white text-xs px-3 py-2 rounded-lg text-center"
            style={{ zIndex: 10003 }}
          >
            <div className="flex flex-col items-center gap-1">
              <span className="font-semibold">Primär-Buttons links</span>
              <span className="text-gray-300">Tippen Sie auf die größeren Buttons links</span>
              <span className="text-xs text-blue-300 mt-1">3s halten für Verschiebemodus</span>
            </div>
          </motion.div>
        )}
      </div>

      <style>{`
        .radial-menu-container {
          -webkit-tap-highlight-color: transparent;
          user-select: none;
          position: fixed !important;
          transform: translateZ(0) !important;
          will-change: transform !important;
          right: 24px !important;
          bottom: 24px !important;
        }
        
        .service-provider-radial-menu {
          position: fixed !important;
          transform: translateZ(0) !important;
          will-change: transform !important;
          right: 24px !important;
          bottom: 24px !important;
        }
        
        @media (max-width: 768px) {
          .radial-menu-container,
          .service-provider-radial-menu {
            right: 16px !important;
            bottom: 16px !important;
          }
        }
      `}</style>
    </>
  );
}
