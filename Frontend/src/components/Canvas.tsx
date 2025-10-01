import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Palette, 
  Type, 
  Image, 
  Square, 
  Circle,
  Minus,
  Download, 
  Save, 
  X, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw,
  Eraser,
  Move,
  Users,
  Lock,
  Unlock,
  Share,
  Settings,
  Undo,
  Redo,
  Group,
  Ungroup,
  Trash2,
  Plus,
  Minus as MinusIcon,
  Copy
} from 'lucide-react';

// Types und Interfaces
interface CanvasElement {
  id: string;
  type: 'sticky' | 'rectangle' | 'circle' | 'line' | 'text' | 'image' | 'frame' | 'eraser';
  x: number;
  y: number;
  width: number;
  height: number;
  content: string;
  color: string;
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: number;
  fontSize?: number;
  fontFamily?: string;
  rotation: number;
  zIndex: number;
  isSelected: boolean;
  isLocked: boolean;
  isGrouped: boolean;
  groupId?: string;
  collaborators?: string[];
  messages?: CanvasMessage[];
  // Neue Felder für Drag & Drop
  isDragging?: boolean;
  isResizing?: boolean;
  resizeHandle?: 'nw' | 'ne' | 'sw' | 'se' | 'n' | 's' | 'e' | 'w';
  originalSize?: { width: number; height: number };
  originalPosition?: { x: number; y: number };
  // Kollaborationsbereich
  isCollaborationFrame?: boolean;
  frameName?: string;
  assignedUsers?: string[];
  isRestricted?: boolean;
}

interface CanvasMessage {
  id: string;
  userId: number;
  userName: string;
  message: string;
  timestamp: string;
}

interface CollaborationFrame {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  assignedUsers: string[];
  isRestricted: boolean;
  color: string;
}

interface CanvasState {
  elements: CanvasElement[];
  collaborationFrames: CollaborationFrame[];
  selectedElements: string[];
  selectedFrame: string | null;
  viewport: {
    x: number;
    y: number;
    scale: number;
  };
  tool: 'select' | 'sticky' | 'rectangle' | 'circle' | 'line' | 'text' | 'image' | 'eraser' | 'frame';
  isDrawing: boolean;
  drawingPath: { x: number; y: number }[];
  history: CanvasState[];
  historyIndex: number;
  collaborators: Array<{
    id: string;
    name: string;
    color: string;
    position: { x: number; y: number };
  }>;
}

interface CanvasProps {
  projectId: number;
  isOpen: boolean;
  onClose: () => void;
}

// Utility Functions
const generateId = () => Math.random().toString(36).substr(2, 9);
const getRandomColor = () => `hsl(${Math.random() * 360}, 70%, 80%)`;
const getRandomCollaboratorColor = () => `hsl(${Math.random() * 360}, 70%, 60%)`;

export default function Canvas({ projectId, isOpen, onClose }: CanvasProps) {
  // State Management
  const [canvasState, setCanvasState] = useState<CanvasState>({
    elements: [],
    collaborationFrames: [],
    selectedElements: [],
    selectedFrame: null,
    viewport: { x: 0, y: 0, scale: 1 },
    tool: 'select',
    isDrawing: false,
    drawingPath: [],
    history: [],
    historyIndex: -1,
    collaborators: []
  });

  const [isPanning, setIsPanning] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState<string | null>(null);
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });
  const [showCollaborationModal, setShowCollaborationModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportSettings, setExportSettings] = useState({
    format: 'png' as 'png' | 'pdf',
    includeFrames: true,
    saveToDocs: false,
    selectedFrame: null as string | null
  });

  // Refs
  const canvasRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-save
  useEffect(() => {
    const interval = setInterval(() => {
      saveCanvasState();
    }, 5000); // Auto-save every 5 seconds

    return () => clearInterval(interval);
  }, [canvasState]);

  // Load initial state
  useEffect(() => {
    loadCanvasState();
  }, [projectId]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'z':
            e.preventDefault();
            if (e.shiftKey) {
              redo();
            } else {
              undo();
            }
            break;
          case 'y':
            e.preventDefault();
            redo();
            break;
          case 'a':
            e.preventDefault();
            selectAll();
            break;
          case 's':
            e.preventDefault();
            saveCanvasState();
            break;
          case 'd':
            e.preventDefault();
            duplicateSelected();
            break;
          case 'Delete':
          case 'Backspace':
            e.preventDefault();
            deleteSelected();
            break;
        }
      } else {
        switch (e.key) {
          case 'Escape':
            clearSelection();
            break;
          case '1':
            setTool('select');
            break;
          case '2':
            setTool('sticky');
            break;
          case '3':
            setTool('rectangle');
            break;
          case '4':
            setTool('circle');
            break;
          case '5':
            setTool('line');
            break;
          case '6':
            setTool('text');
            break;
          case '7':
            setTool('image');
            break;
          case '8':
            setTool('eraser');
            break;
          case '9':
            setTool('frame');
            break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [canvasState]);

  // Save/Load Functions
  const saveCanvasState = () => {
    const key = `canvas_${projectId}`;
    localStorage.setItem(key, JSON.stringify(canvasState));
  };

  const loadCanvasState = () => {
    const key = `canvas_${projectId}`;
    const saved = localStorage.getItem(key);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setCanvasState(parsed);
      } catch (error) {
        console.error('Error loading canvas state:', error);
      }
    }
  };

  // History Management
  const addToHistory = useCallback((newState: CanvasState) => {
    setCanvasState(prev => {
      const newHistory = [...prev.history.slice(0, prev.historyIndex + 1), prev];
      const updatedState = { ...newState, history: newHistory, historyIndex: newHistory.length };
      
      // Limit history to 50 states
      if (newHistory.length > 50) {
        updatedState.history = newHistory.slice(-50);
        updatedState.historyIndex = 49;
      }
      
      return updatedState;
    });
  }, []);

  const undo = () => {
    if (canvasState.historyIndex > 0) {
      const newIndex = canvasState.historyIndex - 1;
      const previousState = canvasState.history[newIndex];
      setCanvasState(prev => ({ ...prev, ...previousState, historyIndex: newIndex }));
    }
  };

  const redo = () => {
    if (canvasState.historyIndex < canvasState.history.length - 1) {
      const newIndex = canvasState.historyIndex + 1;
      const nextState = canvasState.history[newIndex];
      setCanvasState(prev => ({ ...prev, ...nextState, historyIndex: newIndex }));
    }
  };

  // Tool Management
  const setTool = (tool: CanvasState['tool']) => {
    setCanvasState(prev => ({ ...prev, tool }));
  };

  // Element Creation
  const createElement = (type: CanvasElement['type'], x: number, y: number, options: Partial<CanvasElement> = {}) => {
    const element: CanvasElement = {
      id: generateId(),
      type,
      x,
      y,
      width: type === 'line' ? 100 : 150,
      height: type === 'line' ? 2 : 100,
      content: type === 'text' ? 'Text eingeben...' : '',
      color: getRandomColor(),
      backgroundColor: type === 'sticky' ? '#ffeb3b' : '#ffffff',
      borderColor: '#000000',
      borderWidth: 1,
      fontSize: 16,
      fontFamily: 'Arial, sans-serif',
      rotation: 0,
      zIndex: canvasState.elements.length,
      isSelected: false,
      isLocked: false,
      isGrouped: false,
      ...options
    };

    addToHistory({
      ...canvasState,
      elements: [...canvasState.elements, element],
      selectedElements: [element.id]
    });
  };

  // Mouse Event Handlers
  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = (e.clientX - rect.left - canvasState.viewport.x) / canvasState.viewport.scale;
    const y = (e.clientY - rect.top - canvasState.viewport.y) / canvasState.viewport.scale;

    setLastMousePos({ x: e.clientX, y: e.clientY });

    if (e.button === 1 || (e.button === 0 && e.altKey)) {
      // Middle mouse or Alt+Left for panning
      setIsPanning(true);
      return;
    }

    if (canvasState.tool === 'select') {
      // Select mode
      const clickedElement = findElementAtPosition(x, y);
      if (clickedElement) {
        if (e.shiftKey) {
          // Multi-select
          const newSelection = canvasState.selectedElements.includes(clickedElement.id)
            ? canvasState.selectedElements.filter(id => id !== clickedElement.id)
            : [...canvasState.selectedElements, clickedElement.id];
          setCanvasState(prev => ({ ...prev, selectedElements: newSelection }));
        } else {
          // Single select
          setCanvasState(prev => ({ 
            ...prev, 
            selectedElements: [clickedElement.id],
            selectedFrame: null
          }));
        }
      } else {
        // Clicked on empty space
        if (!e.shiftKey) {
          setCanvasState(prev => ({ 
            ...prev, 
            selectedElements: [],
            selectedFrame: null
          }));
        }
      }
    } else {
      // Create new element
      createElement(canvasState.tool, x, y);
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = (e.clientX - rect.left - canvasState.viewport.x) / canvasState.viewport.scale;
    const y = (e.clientY - rect.top - canvasState.viewport.y) / canvasState.viewport.scale;

    if (isPanning) {
      const deltaX = e.clientX - lastMousePos.x;
      const deltaY = e.clientY - lastMousePos.y;
      
      setCanvasState(prev => ({
        ...prev,
        viewport: {
          ...prev.viewport,
          x: prev.viewport.x + deltaX,
          y: prev.viewport.y + deltaY
        }
      }));
    } else if (isResizing && resizeHandle) {
      // Handle resizing
      const selectedElement = canvasState.elements.find(el => el.id === canvasState.selectedElements[0]);
      if (selectedElement) {
        const deltaX = (e.clientX - lastMousePos.x) / canvasState.viewport.scale;
        const deltaY = (e.clientY - lastMousePos.y) / canvasState.viewport.scale;
        
        const newElement = { ...selectedElement };
        
        switch (resizeHandle) {
          case 'se':
            newElement.width = Math.max(50, selectedElement.width + deltaX);
            newElement.height = Math.max(50, selectedElement.height + deltaY);
            break;
          case 'sw':
            newElement.x = selectedElement.x + deltaX;
            newElement.width = Math.max(50, selectedElement.width - deltaX);
            newElement.height = Math.max(50, selectedElement.height + deltaY);
            break;
          case 'ne':
            newElement.y = selectedElement.y + deltaY;
            newElement.width = Math.max(50, selectedElement.width + deltaX);
            newElement.height = Math.max(50, selectedElement.height - deltaY);
            break;
          case 'nw':
            newElement.x = selectedElement.x + deltaX;
            newElement.y = selectedElement.y + deltaY;
            newElement.width = Math.max(50, selectedElement.width - deltaX);
            newElement.height = Math.max(50, selectedElement.height - deltaY);
            break;
        }
        
        updateElement(newElement);
      }
    } else if (canvasState.tool === 'line' && canvasState.isDrawing) {
      // Continue drawing line
      setCanvasState(prev => ({
        ...prev,
        drawingPath: [...prev.drawingPath, { x, y }]
      }));
    }

    setLastMousePos({ x: e.clientX, y: e.clientY });
  };

  const handleCanvasMouseUp = () => {
    setIsPanning(false);
    setIsResizing(false);
    setResizeHandle(null);
    
    if (canvasState.tool === 'line' && canvasState.isDrawing) {
      // Finish drawing line
      if (canvasState.drawingPath.length > 1) {
        const path = canvasState.drawingPath;
        const start = path[0];
        const end = path[path.length - 1];
        
        createElement('line', start.x, start.y, {
          width: Math.abs(end.x - start.x),
          height: Math.abs(end.y - start.y),
          x: Math.min(start.x, end.x),
          y: Math.min(start.y, end.y)
        });
      }
      
      setCanvasState(prev => ({
        ...prev,
        isDrawing: false,
        drawingPath: []
      }));
    }
  };

  // Utility Functions
  const findElementAtPosition = (x: number, y: number): CanvasElement | null => {
    for (let i = canvasState.elements.length - 1; i >= 0; i--) {
      const element = canvasState.elements[i];
      if (x >= element.x && x <= element.x + element.width &&
          y >= element.y && y <= element.y + element.height) {
        return element;
      }
    }
    return null;
  };

  const updateElement = (updatedElement: CanvasElement) => {
    setCanvasState(prev => ({
      ...prev,
      elements: prev.elements.map(el => 
        el.id === updatedElement.id ? updatedElement : el
      )
    }));
  };

  const deleteSelected = () => {
    setCanvasState(prev => ({
      ...prev,
      elements: prev.elements.filter(el => !prev.selectedElements.includes(el.id)),
      selectedElements: []
    }));
    addToHistory(canvasState);
  };

  const selectAll = () => {
    setCanvasState(prev => ({
      ...prev,
      selectedElements: prev.elements.map(el => el.id)
    }));
  };

  const clearSelection = () => {
    setCanvasState(prev => ({
      ...prev,
      selectedElements: [],
      selectedFrame: null
    }));
  };

  const duplicateSelected = () => {
    const selectedElements = canvasState.elements.filter(el => 
      canvasState.selectedElements.includes(el.id)
    );
    
    const newElements = selectedElements.map(el => ({
      ...el,
      id: generateId(),
      x: el.x + 20,
      y: el.y + 20,
      isSelected: false
    }));
    
    setCanvasState(prev => ({
      ...prev,
      elements: [...prev.elements, ...newElements],
      selectedElements: newElements.map(el => el.id)
    }));
    addToHistory(canvasState);
  };

  // Zoom Functions
  const handleZoom = (delta: number, centerX: number, centerY: number) => {
    const newScale = Math.max(0.1, Math.min(5, canvasState.viewport.scale + delta));
    const scaleFactor = newScale / canvasState.viewport.scale;
    
    setCanvasState(prev => ({
      ...prev,
      viewport: {
        x: centerX - (centerX - prev.viewport.x) * scaleFactor,
        y: centerY - (centerY - prev.viewport.y) * scaleFactor,
        scale: newScale
      }
    }));
  };

  // Image Upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const reader = new FileReader();
    
    reader.onload = (event) => {
      const img = new window.Image();
      img.onload = () => {
        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return;

        const x = (rect.width / 2 - canvasState.viewport.x) / canvasState.viewport.scale;
        const y = (rect.height / 2 - canvasState.viewport.y) / canvasState.viewport.scale;
        
        createElement('image', x, y, {
          width: img.width,
          height: img.height,
          content: event.target?.result as string
        });
      };
      img.src = event.target?.result as string;
    };
    
    reader.readAsDataURL(file);
  };

  // Collaboration Frame Functions
  const createCollaborationFrame = (x: number, y: number, width: number, height: number) => {
    const frame: CollaborationFrame = {
      id: generateId(),
      name: `Kollaborationsbereich ${canvasState.collaborationFrames.length + 1}`,
      x,
      y,
      width,
      height,
      assignedUsers: [],
      isRestricted: false,
      color: getRandomColor()
    };

    setCanvasState(prev => ({
      ...prev,
      collaborationFrames: [...prev.collaborationFrames, frame],
      selectedFrame: frame.id
    }));
  };

  // Export Functions
  const handleExport = () => {
    setShowExportModal(true);
  };

  const exportCanvas = async () => {
    if (!svgRef.current) return;

    try {
      const svg = svgRef.current;
      const svgData = new XMLSerializer().serializeToString(svg);
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      
      if (exportSettings.format === 'png') {
        // Convert SVG to PNG
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new window.Image();
        
        img.onload = () => {
          canvas.width = svg.viewBox.baseVal.width;
          canvas.height = svg.viewBox.baseVal.height;
          ctx?.drawImage(img, 0, 0);
          
          canvas.toBlob((blob) => {
            if (blob) {
              if (exportSettings.saveToDocs) {
                // Save to Docs (implement API call)
                } else {
                // Download
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `canvas_export_${Date.now()}.png`;
                a.click();
                URL.revokeObjectURL(url);
              }
            }
          });
        };
        
        const svgUrl = URL.createObjectURL(svgBlob);
        img.src = svgUrl;
      } else {
        // PDF export
        if (exportSettings.saveToDocs) {
          // Save to Docs (implement API call)
          } else {
          // Download
          const url = URL.createObjectURL(svgBlob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `canvas_export_${Date.now()}.svg`;
          a.click();
          URL.revokeObjectURL(url);
        }
      }
    } catch (error) {
      console.error('Export error:', error);
    }
    
    setShowExportModal(false);
  };

  // Render Functions
  const renderElement = (element: CanvasElement) => {
    const isSelected = canvasState.selectedElements.includes(element.id);
    const transform = `translate(${element.x} ${element.y}) rotate(${element.rotation} ${element.width/2} ${element.height/2})`;

    switch (element.type) {
      case 'sticky':
        return (
          <g key={element.id} transform={transform}>
            <rect
              width={element.width}
              height={element.height}
              fill={element.backgroundColor}
              stroke={isSelected ? '#3b82f6' : element.borderColor}
              strokeWidth={isSelected ? 3 : element.borderWidth}
              rx={8}
              ry={8}
            />
            <foreignObject width={element.width} height={element.height} x={0} y={0}>
              <div className="p-3 h-full">
                <textarea
                  className="w-full h-full bg-transparent border-none outline-none resize-none text-sm"
                  value={element.content}
                  onChange={(e) => updateElement({ ...element, content: e.target.value })}
                  onMouseDown={(e) => e.stopPropagation()}
                  onMouseUp={(e) => e.stopPropagation()}
                />
              </div>
            </foreignObject>
            {isSelected && renderSelectionHandles(element)}
          </g>
        );

      case 'rectangle':
        return (
          <g key={element.id} transform={transform}>
            <rect
              width={element.width}
              height={element.height}
              fill={element.backgroundColor}
              stroke={isSelected ? '#3b82f6' : element.borderColor}
              strokeWidth={isSelected ? 3 : element.borderWidth}
            />
            {isSelected && renderSelectionHandles(element)}
          </g>
        );

      case 'circle':
        return (
          <g key={element.id} transform={transform}>
            <circle
              cx={element.width / 2}
              cy={element.height / 2}
              r={Math.min(element.width, element.height) / 2}
              fill={element.backgroundColor}
              stroke={isSelected ? '#3b82f6' : element.borderColor}
              strokeWidth={isSelected ? 3 : element.borderWidth}
            />
            {isSelected && renderSelectionHandles(element)}
          </g>
        );

      case 'line':
        return (
          <g key={element.id} transform={transform}>
            <line
              x1={0}
              y1={0}
              x2={element.width}
              y2={element.height}
              stroke={element.color}
              strokeWidth={element.borderWidth || 2}
              strokeDasharray={element.type === 'line' ? '5,5' : undefined}
            />
            {isSelected && renderSelectionHandles(element)}
          </g>
        );

      case 'text':
        return (
          <g key={element.id} transform={transform}>
            <foreignObject width={element.width} height={element.height} x={0} y={0}>
              <div className="p-2 h-full">
                <textarea
                  className="w-full h-full bg-transparent border-none outline-none resize-none"
                  style={{
                    fontSize: element.fontSize,
                    fontFamily: element.fontFamily,
                    color: element.color
                  }}
                  value={element.content}
                  onChange={(e) => updateElement({ ...element, content: e.target.value })}
                  onMouseDown={(e) => e.stopPropagation()}
                  onMouseUp={(e) => e.stopPropagation()}
                />
              </div>
            </foreignObject>
            {isSelected && renderSelectionHandles(element)}
          </g>
        );

      case 'image':
        return (
          <g key={element.id} transform={transform}>
            <image
              href={element.content}
              width={element.width}
              height={element.height}
              stroke={isSelected ? '#3b82f6' : element.borderColor}
              strokeWidth={isSelected ? 3 : element.borderWidth}
            />
            {isSelected && renderSelectionHandles(element)}
          </g>
        );

      default:
        return null;
    }
  };

  const renderSelectionHandles = (element: CanvasElement) => {
    const handles = [
      { x: 0, y: 0, cursor: 'nw-resize', handle: 'nw' },
      { x: element.width / 2, y: 0, cursor: 'n-resize', handle: 'n' },
      { x: element.width, y: 0, cursor: 'ne-resize', handle: 'ne' },
      { x: element.width, y: element.height / 2, cursor: 'e-resize', handle: 'e' },
      { x: element.width, y: element.height, cursor: 'se-resize', handle: 'se' },
      { x: element.width / 2, y: element.height, cursor: 's-resize', handle: 's' },
      { x: 0, y: element.height, cursor: 'sw-resize', handle: 'sw' },
      { x: 0, y: element.height / 2, cursor: 'w-resize', handle: 'w' }
    ];

    return handles.map((handle, index) => (
      <rect
        key={index}
        x={handle.x - 4}
        y={handle.y - 4}
        width={8}
        height={8}
        fill="#3b82f6"
        stroke="#ffffff"
        strokeWidth={1}
        style={{ cursor: handle.cursor }}
        onMouseDown={(e) => {
          e.stopPropagation();
          setIsResizing(true);
          setResizeHandle(handle.handle as any);
        }}
      />
    ));
  };

  const renderCollaborationFrames = () => {
    return canvasState.collaborationFrames.map(frame => (
      <g key={frame.id}>
        <rect
          x={frame.x}
          y={frame.y}
          width={frame.width}
          height={frame.height}
          fill="none"
          stroke={frame.color}
          strokeWidth={3}
          strokeDasharray="10,5"
          opacity={0.7}
        />
        <text
          x={frame.x + 10}
          y={frame.y + 25}
          fill={frame.color}
          fontSize="14"
          fontWeight="bold"
        >
          {frame.name}
        </text>
      </g>
    ));
  };

  const renderCollaborators = () => {
    return canvasState.collaborators.map(collaborator => (
      <circle
        key={collaborator.id}
        cx={collaborator.position.x}
        cy={collaborator.position.y}
        r={8}
        fill={collaborator.color}
        stroke="#ffffff"
        strokeWidth={2}
      />
    ));
  };

  // Toolbar Component
  const Toolbar = () => (
    <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200 p-2 flex items-center gap-2 z-50">
      {/* Tools */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => setTool('select')}
          className={`p-2 rounded-lg transition-colors ${
            canvasState.tool === 'select' ? 'bg-blue-500 text-white' : 'hover:bg-gray-100'
          }`}
          title="Auswahl (1)"
        >
          <Move size={16} />
        </button>
        <button
          onClick={() => setTool('sticky')}
          className={`p-2 rounded-lg transition-colors ${
            canvasState.tool === 'sticky' ? 'bg-blue-500 text-white' : 'hover:bg-gray-100'
          }`}
          title="Sticky Note (2)"
        >
          <Type size={16} />
        </button>
        <button
          onClick={() => setTool('rectangle')}
          className={`p-2 rounded-lg transition-colors ${
            canvasState.tool === 'rectangle' ? 'bg-blue-500 text-white' : 'hover:bg-gray-100'
          }`}
          title="Rechteck (3)"
        >
          <Square size={16} />
        </button>
        <button
          onClick={() => setTool('circle')}
          className={`p-2 rounded-lg transition-colors ${
            canvasState.tool === 'circle' ? 'bg-blue-500 text-white' : 'hover:bg-gray-100'
          }`}
          title="Kreis (4)"
        >
          <Circle size={16} />
        </button>
        <button
          onClick={() => setTool('line')}
          className={`p-2 rounded-lg transition-colors ${
            canvasState.tool === 'line' ? 'bg-blue-500 text-white' : 'hover:bg-gray-100'
          }`}
          title="Linie (5)"
        >
          <Minus size={16} />
        </button>
        <button
          onClick={() => setTool('text')}
          className={`p-2 rounded-lg transition-colors ${
            canvasState.tool === 'text' ? 'bg-blue-500 text-white' : 'hover:bg-gray-100'
          }`}
          title="Text (6)"
        >
          <Type size={16} />
        </button>
        <button
          onClick={() => setTool('image')}
          className={`p-2 rounded-lg transition-colors ${
            canvasState.tool === 'image' ? 'bg-blue-500 text-white' : 'hover:bg-gray-100'
          }`}
          title="Bild (7)"
        >
          <Image size={16} />
        </button>
        <button
          onClick={() => setTool('eraser')}
          className={`p-2 rounded-lg transition-colors ${
            canvasState.tool === 'eraser' ? 'bg-red-500 text-white' : 'hover:bg-gray-100'
          }`}
          title="Radierer (8)"
        >
          <Eraser size={16} />
        </button>
        <button
          onClick={() => setTool('frame')}
          className={`p-2 rounded-lg transition-colors ${
            canvasState.tool === 'frame' ? 'bg-blue-500 text-white' : 'hover:bg-gray-100'
          }`}
          title="Kollaborationsbereich (9)"
        >
          <Square size={16} />
        </button>
      </div>

      <div className="w-px h-6 bg-gray-300 mx-2" />

      {/* Actions */}
      <div className="flex items-center gap-1">
        <button
          onClick={undo}
          disabled={canvasState.historyIndex <= 0}
          className="p-2 rounded-lg transition-colors hover:bg-gray-100 disabled:opacity-50"
          title="Rückgängig (Ctrl+Z)"
        >
          <Undo size={16} />
        </button>
        <button
          onClick={redo}
          disabled={canvasState.historyIndex >= canvasState.history.length - 1}
          className="p-2 rounded-lg transition-colors hover:bg-gray-100 disabled:opacity-50"
          title="Wiederholen (Ctrl+Y)"
        >
          <Redo size={16} />
        </button>
        <button
          onClick={selectAll}
          className="p-2 rounded-lg transition-colors hover:bg-gray-100"
          title="Alles auswählen (Ctrl+A)"
        >
          <Square size={16} />
        </button>
        <button
          onClick={duplicateSelected}
          disabled={canvasState.selectedElements.length === 0}
          className="p-2 rounded-lg transition-colors hover:bg-gray-100 disabled:opacity-50"
          title="Duplizieren (Ctrl+D)"
        >
          <Copy size={16} />
        </button>
        <button
          onClick={deleteSelected}
          disabled={canvasState.selectedElements.length === 0}
          className="p-2 rounded-lg transition-colors hover:bg-gray-100 disabled:opacity-50"
          title="Löschen (Delete)"
        >
          <Trash2 size={16} />
        </button>
      </div>

      <div className="w-px h-6 bg-gray-300 mx-2" />

      {/* Zoom */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => handleZoom(-0.1, window.innerWidth / 2, window.innerHeight / 2)}
          className="p-2 rounded-lg transition-colors hover:bg-gray-100"
          title="Verkleinern"
        >
          <ZoomOut size={16} />
        </button>
        <span className="text-sm font-medium min-w-[60px] text-center">
          {Math.round(canvasState.viewport.scale * 100)}%
        </span>
        <button
          onClick={() => handleZoom(0.1, window.innerWidth / 2, window.innerHeight / 2)}
          className="p-2 rounded-lg transition-colors hover:bg-gray-100"
          title="Vergrößern"
        >
          <ZoomIn size={16} />
        </button>
        <button
          onClick={() => setCanvasState(prev => ({
            ...prev,
            viewport: { x: 0, y: 0, scale: 1 }
          }))}
          className="p-2 rounded-lg transition-colors hover:bg-gray-100"
          title="Zurücksetzen"
        >
          <RotateCcw size={16} />
        </button>
      </div>

      <div className="w-px h-6 bg-gray-300 mx-2" />

      {/* Collaboration */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => setShowCollaborationModal(true)}
          className="p-2 rounded-lg transition-colors hover:bg-gray-100"
          title="Kollaboration"
        >
          <Users size={16} />
        </button>
        <button
          onClick={handleExport}
          className="p-2 rounded-lg transition-colors hover:bg-gray-100"
          title="Exportieren"
        >
          <Download size={16} />
        </button>
        <button
          onClick={saveCanvasState}
          className="p-2 rounded-lg transition-colors hover:bg-gray-100"
          title="Speichern (Ctrl+S)"
        >
          <Save size={16} />
        </button>
      </div>
    </div>
  );

  // Main Render
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-900 z-50">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700 bg-gray-800">
        <h2 className="text-xl font-semibold text-white">BuildWise Canvas</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={saveCanvasState}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Speichern
          </button>
          <button
            onClick={handleExport}
            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
          >
            Exportieren
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            Schließen
          </button>
        </div>
      </div>

      {/* Canvas Container */}
      <div className="relative flex-1 overflow-hidden">
        <Toolbar />
        
        <div
          ref={canvasRef}
          className="w-full h-full cursor-crosshair"
          onMouseDown={handleCanvasMouseDown}
          onMouseMove={handleCanvasMouseMove}
          onMouseUp={handleCanvasMouseUp}
          onWheel={(e) => {
            e.preventDefault();
            const rect = canvasRef.current?.getBoundingClientRect();
            if (rect) {
              const centerX = e.clientX - rect.left;
              const centerY = e.clientY - rect.top;
              handleZoom(e.deltaY > 0 ? -0.1 : 0.1, centerX, centerY);
            }
          }}
        >
          <svg
            ref={svgRef}
            width="100%"
            height="100%"
            viewBox={`${canvasState.viewport.x} ${canvasState.viewport.y} ${window.innerWidth / canvasState.viewport.scale} ${window.innerHeight / canvasState.viewport.scale}`}
            style={{
              transform: `scale(${canvasState.viewport.scale})`,
              transformOrigin: '0 0'
            }}
          >
            {/* Grid */}
            <defs>
              <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
                <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#e5e7eb" strokeWidth="1" opacity="0.3"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />

            {/* Collaboration Frames */}
            {renderCollaborationFrames()}

            {/* Elements */}
            {canvasState.elements.map(renderElement)}

            {/* Drawing Path */}
            {canvasState.isDrawing && canvasState.drawingPath.length > 1 && (
              <polyline
                points={canvasState.drawingPath.map(p => `${p.x},${p.y}`).join(' ')}
                fill="none"
                stroke="#3b82f6"
                strokeWidth="2"
              />
            )}

            {/* Collaborators */}
            {renderCollaborators()}
          </svg>
        </div>

        {/* Hidden file input for image upload */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          style={{ display: 'none' }}
        />
      </div>

      {/* Collaboration Modal */}
      {showCollaborationModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-60">
          <div className="bg-white rounded-lg p-6 w-96 max-h-96 overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Kollaboration</h3>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Aktive Nutzer</h4>
                <div className="space-y-2">
                  {canvasState.collaborators.map(collaborator => (
                    <div key={collaborator.id} className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: collaborator.color }}
                      />
                      <span>{collaborator.name}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="font-medium mb-2">Kollaborationsbereiche</h4>
                <div className="space-y-2">
                  {canvasState.collaborationFrames.map(frame => (
                    <div key={frame.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span>{frame.name}</span>
                      <button
                        onClick={() => {
                          setCanvasState(prev => ({
                            ...prev,
                            collaborationFrames: prev.collaborationFrames.filter(f => f.id !== frame.id)
                          }));
                        }}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setShowCollaborationModal(false)}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                Schließen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-60">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-lg font-semibold mb-4">Export</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Format</label>
                <select
                  value={exportSettings.format}
                  onChange={(e) => setExportSettings(prev => ({
                    ...prev,
                    format: e.target.value as 'png' | 'pdf'
                  }))}
                  className="w-full p-2 border rounded"
                >
                  <option value="png">PNG</option>
                  <option value="pdf">PDF</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Bereich</label>
                <select
                  value={exportSettings.selectedFrame || ''}
                  onChange={(e) => setExportSettings(prev => ({
                    ...prev,
                    selectedFrame: e.target.value || null
                  }))}
                  className="w-full p-2 border rounded"
                >
                  <option value="">Gesamter Canvas</option>
                  {canvasState.collaborationFrames.map(frame => (
                    <option key={frame.id} value={frame.id}>{frame.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="saveToDocs"
                  checked={exportSettings.saveToDocs}
                  onChange={(e) => setExportSettings(prev => ({
                    ...prev,
                    saveToDocs: e.target.checked
                  }))}
                />
                <label htmlFor="saveToDocs">In Docs speichern</label>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setShowExportModal(false)}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                Abbrechen
              </button>
              <button
                onClick={exportCanvas}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Exportieren
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 
