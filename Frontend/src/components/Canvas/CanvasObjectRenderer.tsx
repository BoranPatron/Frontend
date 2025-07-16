import React, { useState, useRef, useCallback } from 'react';
import type { CanvasObject } from '../../api/canvasService';

interface CanvasObjectRendererProps {
  object: CanvasObject;
  isSelected: boolean;
  onClick: (e: React.MouseEvent) => void;
  onUpdate: (updates: any) => void;
}

const CanvasObjectRenderer: React.FC<CanvasObjectRendererProps> = ({
  object,
  isSelected,
  onClick,
  onUpdate
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(object.content || '');
  const dragStart = useRef({ x: 0, y: 0 });
  const resizeStart = useRef({ x: 0, y: 0, width: 0, height: 0 });

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDragging(true);
    dragStart.current = {
      x: e.clientX - object.x,
      y: e.clientY - object.y
    };
  }, [object.x, object.y]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDragging) {
      const newX = e.clientX - dragStart.current.x;
      const newY = e.clientY - dragStart.current.y;
      onUpdate({ x: newX, y: newY });
    } else if (isResizing) {
      const deltaX = e.clientX - resizeStart.current.x;
      const deltaY = e.clientY - resizeStart.current.y;
      const newWidth = Math.max(50, resizeStart.current.width + deltaX);
      const newHeight = Math.max(50, resizeStart.current.height + deltaY);
      onUpdate({ width: newWidth, height: newHeight });
    }
  }, [isDragging, isResizing, onUpdate]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setIsResizing(false);
  }, []);

  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setIsResizing(true);
    resizeStart.current = {
      x: e.clientX,
      y: e.clientY,
      width: object.width,
      height: object.height
    };
  }, [object.width, object.height]);

  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (object.type === 'text' || object.type === 'sticky') {
      setIsEditing(true);
      setEditContent(object.content || '');
    }
  }, [object.type, object.content]);

  const handleEditSave = useCallback(() => {
    onUpdate({ content: editContent });
    setIsEditing(false);
  }, [editContent, onUpdate]);

  const handleEditCancel = useCallback(() => {
    setEditContent(object.content || '');
    setIsEditing(false);
  }, [object.content]);

  const renderObject = () => {
    const baseStyle = {
      position: 'absolute' as const,
      left: object.x,
      top: object.y,
      width: object.width,
      height: object.height,
      transform: `rotate(${object.rotation}deg)`,
      cursor: isDragging ? 'grabbing' : 'grab'
    };

    switch (object.type) {
      case 'rectangle':
        return (
          <div
            style={{
              ...baseStyle,
              border: `2px solid ${object.color}`,
              backgroundColor: 'transparent'
            }}
            className={isSelected ? 'ring-2 ring-blue-500' : ''}
          />
        );

      case 'circle':
        return (
          <div
            style={{
              ...baseStyle,
              border: `2px solid ${object.color}`,
              borderRadius: '50%',
              backgroundColor: 'transparent'
            }}
            className={isSelected ? 'ring-2 ring-blue-500' : ''}
          />
        );

      case 'sticky':
        return (
          <div
            style={{
              ...baseStyle,
              backgroundColor: object.color,
              border: '1px solid #000',
              padding: '8px',
              fontSize: object.font_size || 14,
              fontFamily: object.font_family || 'Arial'
            }}
            className={`${isSelected ? 'ring-2 ring-blue-500' : ''} shadow-md`}
          >
            {isEditing ? (
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                onBlur={handleEditSave}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.ctrlKey) {
                    handleEditSave();
                  } else if (e.key === 'Escape') {
                    handleEditCancel();
                  }
                }}
                style={{
                  width: '100%',
                  height: '100%',
                  border: 'none',
                  outline: 'none',
                  resize: 'none',
                  backgroundColor: 'transparent',
                  fontSize: object.font_size || 14,
                  fontFamily: object.font_family || 'Arial'
                }}
                autoFocus
              />
            ) : (
              <div className="whitespace-pre-wrap break-words">
                {object.content || 'Sticky Note'}
              </div>
            )}
          </div>
        );

      case 'text':
        return (
          <div
            style={{
              ...baseStyle,
              color: object.color,
              fontSize: object.font_size || 16,
              fontFamily: object.font_family || 'Arial',
              backgroundColor: 'transparent',
              border: 'none',
              outline: 'none'
            }}
            className={isSelected ? 'ring-2 ring-blue-500' : ''}
          >
            {isEditing ? (
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                onBlur={handleEditSave}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.ctrlKey) {
                    handleEditSave();
                  } else if (e.key === 'Escape') {
                    handleEditCancel();
                  }
                }}
                style={{
                  width: '100%',
                  height: '100%',
                  border: 'none',
                  outline: 'none',
                  resize: 'none',
                  backgroundColor: 'transparent',
                  color: object.color,
                  fontSize: object.font_size || 16,
                  fontFamily: object.font_family || 'Arial'
                }}
                autoFocus
              />
            ) : (
              <div className="whitespace-pre-wrap break-words">
                {object.content || 'Text eingeben...'}
              </div>
            )}
          </div>
        );

      case 'line':
        return (
          <svg
            style={{
              ...baseStyle,
              width: object.width,
              height: object.height
            }}
            className={isSelected ? 'ring-2 ring-blue-500' : ''}
          >
            <line
              x1="0"
              y1="0"
              x2={object.width}
              y2={object.height}
              stroke={object.color}
              strokeWidth="2"
            />
          </svg>
        );

      case 'image':
        return (
          <div
            style={{
              ...baseStyle,
              backgroundImage: object.image_url ? `url(${object.image_url})` : 'none',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundColor: '#f0f0f0',
              border: '1px solid #ccc'
            }}
            className={isSelected ? 'ring-2 ring-blue-500' : ''}
          >
            {!object.image_url && (
              <div className="flex items-center justify-center h-full text-gray-500">
                🖼️ Bild
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onClick={onClick}
      onDoubleClick={handleDoubleClick}
      className="absolute"
    >
      {renderObject()}
      
      {/* Resize-Handles */}
      {isSelected && (
        <>
          <div
            className="absolute w-3 h-3 bg-blue-500 border border-white cursor-se-resize"
            style={{
              right: '-6px',
              bottom: '-6px'
            }}
            onMouseDown={handleResizeStart}
          />
          <div
            className="absolute w-3 h-3 bg-blue-500 border border-white cursor-nw-resize"
            style={{
              left: '-6px',
              top: '-6px'
            }}
            onMouseDown={handleResizeStart}
          />
        </>
      )}
    </div>
  );
};

export default CanvasObjectRenderer; 