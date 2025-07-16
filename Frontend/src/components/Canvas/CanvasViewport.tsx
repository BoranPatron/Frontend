import React, { useRef, useEffect, useState, useCallback } from 'react';
import type { CanvasState, CanvasObject, CollaborationArea } from '../../api/canvasService';
import CanvasObjectRenderer from './CanvasObjectRenderer';

interface CanvasViewportProps {
  canvasState: CanvasState;
  onViewportChange: (viewport: { x: number; y: number; scale: number }) => void;
  onObjectUpdate: (objectId: string, updates: any) => void;
  onSelectionChange: (objectIds: string[], areaIds: string[]) => void;
  sessionId: string;
  onCursorMove: (x: number, y: number) => void;
}

const CanvasViewport: React.FC<CanvasViewportProps> = ({
  canvasState,
  onViewportChange,
  onObjectUpdate,
  onSelectionChange,
  sessionId,
  onCursorMove
}) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [selectedObjects, setSelectedObjects] = useState<string[]>([]);
  const [selectedAreas, setSelectedAreas] = useState<string[]>([]);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeTarget, setResizeTarget] = useState<string | null>(null);

  // Pan/Zoom-Handling
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 0) { // Linke Maustaste
      setIsDragging(true);
      setDragStart({
        x: e.clientX - canvasState.viewport.x,
        y: e.clientY - canvasState.viewport.y
      });
    }
  }, [canvasState.viewport]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDragging) {
      const newX = e.clientX - dragStart.x;
      const newY = e.clientY - dragStart.y;
      onViewportChange({
        ...canvasState.viewport,
        x: newX,
        y: newY
      });
    }

    // Cursor-Position senden
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      const x = (e.clientX - rect.left - canvasState.viewport.x) / canvasState.viewport.scale;
      const y = (e.clientY - rect.top - canvasState.viewport.y) / canvasState.viewport.scale;
      onCursorMove(x, y);
    }
  }, [isDragging, dragStart, canvasState.viewport, onViewportChange, onCursorMove]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setIsResizing(false);
    setResizeTarget(null);
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newScale = Math.max(0.1, Math.min(5, canvasState.viewport.scale * delta));
    
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      
      const newX = mouseX - (mouseX - canvasState.viewport.x) * (newScale / canvasState.viewport.scale);
      const newY = mouseY - (mouseY - canvasState.viewport.y) * (newScale / canvasState.viewport.scale);
      
      onViewportChange({
        x: newX,
        y: newY,
        scale: newScale
      });
    }
  }, [canvasState.viewport, onViewportChange]);

  // Touch-Handling für Mobile
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      setIsDragging(true);
      setDragStart({
        x: touch.clientX - canvasState.viewport.x,
        y: touch.clientY - canvasState.viewport.y
      });
    }
  }, [canvasState.viewport]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (isDragging && e.touches.length === 1) {
      const touch = e.touches[0];
      const newX = touch.clientX - dragStart.x;
      const newY = touch.clientY - dragStart.y;
      onViewportChange({
        ...canvasState.viewport,
        x: newX,
        y: newY
      });
    }
  }, [isDragging, dragStart, canvasState.viewport, onViewportChange]);

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Objekt-Auswahl
  const handleObjectClick = useCallback((objectId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (e.shiftKey) {
      // Multi-Auswahl
      setSelectedObjects(prev => 
        prev.includes(objectId) 
          ? prev.filter(id => id !== objectId)
          : [...prev, objectId]
      );
    } else {
      // Einzel-Auswahl
      setSelectedObjects([objectId]);
      setSelectedAreas([]);
    }
  }, []);

  const handleAreaClick = useCallback((areaId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (e.shiftKey) {
      setSelectedAreas(prev => 
        prev.includes(areaId) 
          ? prev.filter(id => id !== areaId)
          : [...prev, areaId]
      );
    } else {
      setSelectedAreas([areaId]);
      setSelectedObjects([]);
    }
  }, []);

  // Canvas-Klick (Auswahl aufheben)
  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    if (e.target === canvasRef.current) {
      setSelectedObjects([]);
      setSelectedAreas([]);
    }
  }, []);

  // Auswahl-Änderungen weiterleiten
  useEffect(() => {
    onSelectionChange(selectedObjects, selectedAreas);
  }, [selectedObjects, selectedAreas, onSelectionChange]);

  // Keyboard-Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        // Löschen der ausgewählten Objekte/Bereiche
        // Wird vom Parent gehandhabt
      } else if (e.key === 'Escape') {
        setSelectedObjects([]);
        setSelectedAreas([]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div
      ref={canvasRef}
      className="w-full h-full bg-gray-100 overflow-hidden cursor-grab active:cursor-grabbing"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onWheel={handleWheel}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onClick={handleCanvasClick}
    >
      {/* Canvas-Container mit Transform */}
      <div
        className="relative"
        style={{
          transform: `translate(${canvasState.viewport.x}px, ${canvasState.viewport.y}px) scale(${canvasState.viewport.scale})`,
          transformOrigin: '0 0'
        }}
      >
        {/* Kollaborationsbereiche */}
        {canvasState.areas.map((area) => (
          <div
            key={area.area_id}
            className={`absolute border-2 cursor-pointer ${
              selectedAreas.includes(area.area_id) 
                ? 'border-blue-500 bg-blue-100 bg-opacity-20' 
                : 'border-gray-400 bg-gray-100 bg-opacity-10'
            }`}
            style={{
              left: area.x,
              top: area.y,
              width: area.width,
              height: area.height,
              borderColor: area.color
            }}
            onClick={(e) => handleAreaClick(area.area_id, e)}
          >
            <div className="absolute -top-6 left-0 bg-white px-2 py-1 rounded text-sm font-medium">
              {area.name}
            </div>
          </div>
        ))}

        {/* Canvas-Objekte */}
        {canvasState.objects.map((object) => (
          <CanvasObjectRenderer
            key={object.object_id}
            object={object}
            isSelected={selectedObjects.includes(object.object_id)}
            onClick={(e) => handleObjectClick(object.object_id, e)}
            onUpdate={(updates) => onObjectUpdate(object.object_id, updates)}
          />
        ))}

        {/* Grid für Orientierung */}
        <div className="absolute inset-0 pointer-events-none">
          <svg width="100%" height="100%" className="opacity-10">
            <defs>
              <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
                <path d="M 50 0 L 0 0 0 50" fill="none" stroke="gray" strokeWidth="1"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>
      </div>
    </div>
  );
};

export default CanvasViewport; 