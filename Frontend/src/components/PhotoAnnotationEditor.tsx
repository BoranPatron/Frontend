import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  Circle, 
  Square, 
  Type, 
  Pencil, 
  Save, 
  Undo, 
  Redo,
  Trash2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  MousePointer
} from 'lucide-react';

interface Annotation {
  id: string;
  type: 'circle' | 'rectangle' | 'text' | 'arrow' | 'freehand';
  x: number;
  y: number;
  width?: number;
  height?: number;
  text?: string;
  color: string;
  strokeWidth: number;
  points?: { x: number; y: number }[];
}

interface PhotoAnnotationEditorProps {
  imageUrl: string;
  onSave: (annotatedImageUrl: string, annotations: Annotation[]) => void;
  onClose: () => void;
  initialAnnotations?: Annotation[];
}

const PhotoAnnotationEditor: React.FC<PhotoAnnotationEditorProps> = ({
  imageUrl,
  onSave,
  onClose,
  initialAnnotations = []
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [annotations, setAnnotations] = useState<Annotation[]>(initialAnnotations);
  const [currentTool, setCurrentTool] = useState<'select' | 'circle' | 'rectangle' | 'text' | 'freehand'>('select');
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentAnnotation, setCurrentAnnotation] = useState<Annotation | null>(null);
  const [selectedAnnotation, setSelectedAnnotation] = useState<string | null>(null);
  const [color, setColor] = useState('#ff0000');
  const [strokeWidth, setStrokeWidth] = useState(3);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [imageLoaded, setImageLoaded] = useState(false);
  const [history, setHistory] = useState<Annotation[][]>([initialAnnotations]);
  const [historyIndex, setHistoryIndex] = useState(0);

  const image = useRef(new Image());

  useEffect(() => {
    image.current.onload = () => {
      setImageLoaded(true);
      drawCanvas();
    };
    image.current.src = imageUrl;
  }, [imageUrl]);

  useEffect(() => {
    if (imageLoaded) {
      drawCanvas();
    }
  }, [annotations, zoom, offset, imageLoaded, selectedAnnotation]);

  const drawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas || !imageLoaded) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Save context state
    ctx.save();

    // Apply zoom and offset
    ctx.scale(zoom, zoom);
    ctx.translate(offset.x, offset.y);

    // Draw image
    ctx.drawImage(image.current, 0, 0);

    // Draw annotations
    annotations.forEach((annotation) => {
      drawAnnotation(ctx, annotation, annotation.id === selectedAnnotation);
    });

    // Draw current annotation being created
    if (currentAnnotation) {
      drawAnnotation(ctx, currentAnnotation, false);
    }

    // Restore context state
    ctx.restore();
  };

  const drawAnnotation = (ctx: CanvasRenderingContext2D, annotation: Annotation, isSelected: boolean) => {
    ctx.strokeStyle = annotation.color;
    ctx.lineWidth = annotation.strokeWidth;
    ctx.fillStyle = annotation.color + '20'; // Semi-transparent fill

    if (isSelected) {
      ctx.strokeStyle = '#00ff00';
      ctx.lineWidth = annotation.strokeWidth + 2;
    }

    switch (annotation.type) {
      case 'circle':
        ctx.beginPath();
        const radius = Math.sqrt(Math.pow(annotation.width || 0, 2) + Math.pow(annotation.height || 0, 2)) / 2;
        ctx.arc(annotation.x + (annotation.width || 0) / 2, annotation.y + (annotation.height || 0) / 2, radius, 0, 2 * Math.PI);
        ctx.stroke();
        if (isSelected) ctx.fill();
        break;

      case 'rectangle':
        ctx.beginPath();
        ctx.rect(annotation.x, annotation.y, annotation.width || 0, annotation.height || 0);
        ctx.stroke();
        if (isSelected) ctx.fill();
        break;

      case 'text':
        ctx.font = `${annotation.strokeWidth * 6}px Arial`;
        ctx.fillStyle = annotation.color;
        ctx.fillText(annotation.text || '', annotation.x, annotation.y);
        break;

      case 'freehand':
        if (annotation.points && annotation.points.length > 1) {
          ctx.beginPath();
          ctx.moveTo(annotation.points[0].x, annotation.points[0].y);
          for (let i = 1; i < annotation.points.length; i++) {
            ctx.lineTo(annotation.points[i].x, annotation.points[i].y);
          }
          ctx.stroke();
        }
        break;
    }
  };

  const getCanvasCoordinates = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / zoom - offset.x;
    const y = (e.clientY - rect.top) / zoom - offset.y;
    return { x, y };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const coords = getCanvasCoordinates(e);

    if (currentTool === 'select') {
      // Check if clicking on existing annotation
      const clickedAnnotation = annotations.find(ann => 
        coords.x >= ann.x && 
        coords.x <= ann.x + (ann.width || 0) &&
        coords.y >= ann.y && 
        coords.y <= ann.y + (ann.height || 0)
      );
      setSelectedAnnotation(clickedAnnotation?.id || null);
      return;
    }

    setIsDrawing(true);
    const newAnnotation: Annotation = {
      id: Date.now().toString(),
      type: currentTool,
      x: coords.x,
      y: coords.y,
      color,
      strokeWidth,
      ...(currentTool === 'freehand' ? { points: [coords] } : {})
    };

    if (currentTool === 'text') {
      const text = prompt('Text eingeben:');
      if (text) {
        newAnnotation.text = text;
        addToHistory([...annotations, newAnnotation]);
        setAnnotations(prev => [...prev, newAnnotation]);
      }
      setIsDrawing(false);
      return;
    }

    setCurrentAnnotation(newAnnotation);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !currentAnnotation) return;

    const coords = getCanvasCoordinates(e);

    if (currentAnnotation.type === 'freehand') {
      setCurrentAnnotation(prev => prev ? {
        ...prev,
        points: [...(prev.points || []), coords]
      } : null);
    } else {
      setCurrentAnnotation(prev => prev ? {
        ...prev,
        width: coords.x - prev.x,
        height: coords.y - prev.y
      } : null);
    }
  };

  const handleMouseUp = () => {
    if (!isDrawing || !currentAnnotation) return;

    if (currentAnnotation.type !== 'text') {
      addToHistory([...annotations, currentAnnotation]);
      setAnnotations(prev => [...prev, currentAnnotation]);
    }

    setIsDrawing(false);
    setCurrentAnnotation(null);
  };

  const addToHistory = (newAnnotations: Annotation[]) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newAnnotations);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const undo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setAnnotations(history[historyIndex - 1]);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setAnnotations(history[historyIndex + 1]);
    }
  };

  const deleteSelected = () => {
    if (selectedAnnotation) {
      const newAnnotations = annotations.filter(ann => ann.id !== selectedAnnotation);
      addToHistory(newAnnotations);
      setAnnotations(newAnnotations);
      setSelectedAnnotation(null);
    }
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Create a temporary canvas with the final image
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = image.current.width;
    tempCanvas.height = image.current.height;
    const tempCtx = tempCanvas.getContext('2d');
    
    if (tempCtx) {
      // Draw original image
      tempCtx.drawImage(image.current, 0, 0);
      
      // Draw all annotations
      annotations.forEach(annotation => {
        drawAnnotation(tempCtx, annotation, false);
      });
      
      // Convert to data URL
      const annotatedImageUrl = tempCanvas.toDataURL('image/png');
      onSave(annotatedImageUrl, annotations);
    }
  };

  const tools = [
    { id: 'select', icon: MousePointer, label: 'Auswählen' },
    { id: 'circle', icon: Circle, label: 'Kreis' },
    { id: 'rectangle', icon: Square, label: 'Rechteck' },
    { id: 'text', icon: Type, label: 'Text' },
    { id: 'freehand', icon: Pencil, label: 'Freihand' }
  ];

  const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff', '#000000', '#ffffff'];

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[10000] p-4">
      <div className="bg-[#2c3539] rounded-2xl shadow-2xl border border-white/20 max-w-7xl w-full max-h-[95vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10 flex-shrink-0">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Pencil size={24} className="text-blue-400" />
            Foto Markierung
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="flex flex-1 min-h-0">
          {/* Toolbar */}
          <div className="w-64 p-4 border-r border-white/10 flex-shrink-0 bg-[#1a1a2e]/50">
            <div className="space-y-4">
              {/* Tools */}
              <div>
                <h3 className="text-white font-medium mb-2">Werkzeuge</h3>
                <div className="grid grid-cols-2 gap-2">
                  {tools.map((tool) => (
                    <button
                      key={tool.id}
                      onClick={() => setCurrentTool(tool.id as any)}
                      className={`p-3 rounded-lg border transition-all ${
                        currentTool === tool.id
                          ? 'border-blue-500 bg-blue-500/20 text-blue-300'
                          : 'border-gray-600 bg-gray-600/10 text-gray-300 hover:border-blue-500'
                      }`}
                    >
                      <tool.icon size={20} className="mx-auto mb-1" />
                      <div className="text-xs">{tool.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Colors */}
              <div>
                <h3 className="text-white font-medium mb-2">Farbe</h3>
                <div className="grid grid-cols-4 gap-2">
                  {colors.map((c) => (
                    <button
                      key={c}
                      onClick={() => setColor(c)}
                      className={`w-8 h-8 rounded border-2 transition-all ${
                        color === c ? 'border-white' : 'border-gray-600'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              {/* Stroke Width */}
              <div>
                <h3 className="text-white font-medium mb-2">Strichstärke</h3>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={strokeWidth}
                  onChange={(e) => setStrokeWidth(Number(e.target.value))}
                  className="w-full"
                />
                <div className="text-gray-400 text-sm mt-1">{strokeWidth}px</div>
              </div>

              {/* Actions */}
              <div className="space-y-2">
                <div className="flex gap-2">
                  <button
                    onClick={undo}
                    disabled={historyIndex <= 0}
                    className="flex-1 p-2 bg-gray-600 text-white rounded hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Undo size={16} className="mx-auto" />
                  </button>
                  <button
                    onClick={redo}
                    disabled={historyIndex >= history.length - 1}
                    className="flex-1 p-2 bg-gray-600 text-white rounded hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Redo size={16} className="mx-auto" />
                  </button>
                </div>
                
                {selectedAnnotation && (
                  <button
                    onClick={deleteSelected}
                    className="w-full p-2 bg-red-600 text-white rounded hover:bg-red-700 flex items-center justify-center gap-2"
                  >
                    <Trash2 size={16} />
                    Löschen
                  </button>
                )}
              </div>

              {/* Zoom Controls */}
              <div>
                <h3 className="text-white font-medium mb-2">Zoom</h3>
                <div className="flex gap-2 mb-2">
                  <button
                    onClick={() => setZoom(Math.max(0.1, zoom - 0.1))}
                    className="flex-1 p-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                  >
                    <ZoomOut size={16} className="mx-auto" />
                  </button>
                  <button
                    onClick={() => setZoom(Math.min(3, zoom + 0.1))}
                    className="flex-1 p-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                  >
                    <ZoomIn size={16} className="mx-auto" />
                  </button>
                </div>
                <div className="text-gray-400 text-sm text-center">{Math.round(zoom * 100)}%</div>
                <button
                  onClick={() => { setZoom(1); setOffset({ x: 0, y: 0 }); }}
                  className="w-full p-2 bg-gray-600 text-white rounded hover:bg-gray-700 mt-2 flex items-center justify-center gap-2"
                >
                  <RotateCcw size={16} />
                  Reset
                </button>
              </div>
            </div>
          </div>

          {/* Canvas Area */}
          <div className="flex-1 p-4 overflow-auto bg-gray-900">
            <canvas
              ref={canvasRef}
              width={800}
              height={600}
              className="border border-gray-600 cursor-crosshair bg-white"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              style={{
                cursor: currentTool === 'select' ? 'default' : 'crosshair'
              }}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-white/10 flex-shrink-0 bg-[#2c3539]">
          <div className="text-gray-400 text-sm">
            {annotations.length} Markierung{annotations.length !== 1 ? 'en' : ''}
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
            >
              Abbrechen
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
            >
              <Save size={16} />
              Speichern
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PhotoAnnotationEditor;