import React, { useEffect, useState, useCallback, useRef } from 'react';
import { X, Download, ZoomIn, ZoomOut, RotateCw, ExternalLink, RotateCcw, Move } from 'lucide-react';
import { getAuthenticatedFileUrl } from '../api/api';

interface MobileInlineFileViewerProps {
  fileUrl: string;
  fileName?: string;
  title?: string;
  onClose: () => void;
}

function inferType(fileUrl: string): 'pdf' | 'image' | 'unknown' {
  const url = fileUrl.split('?')[0];
  const ext = url.split('.').pop()?.toLowerCase() || '';
  if (ext === 'pdf') return 'pdf';
  if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(ext)) return 'image';
  return 'unknown';
}

const MobileInlineFileViewer: React.FC<MobileInlineFileViewerProps> = ({ fileUrl, fileName, title, onClose }) => {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [blobUrl, setBlobUrl] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Mobile specific states
  const [touchStart, setTouchStart] = useState<{ x: number; y: number; distance: number } | null>(null);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [lastTouchTime, setLastTouchTime] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  
  // Verwende getAuthenticatedFileUrl für alle URLs
  const authenticatedUrl = getAuthenticatedFileUrl(fileUrl);
  const fileType = inferType(authenticatedUrl);

  // Lade Datei mit Authentifizierung und erstelle Blob-URL
  useEffect(() => {
    const loadFile = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('Kein Authentifizierungstoken verfügbar');
        }
        
        console.log('🔄 Lade Datei für Mobile Inline-Viewer:', authenticatedUrl);
        
        const response = await fetch(authenticatedUrl, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': '*/*'
          }
        });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        setBlobUrl(url);
        
        console.log('✅ Datei erfolgreich geladen als Blob-URL');
      } catch (err: any) {
        console.error('❌ Fehler beim Laden der Datei:', err);
        setError(err.message || 'Fehler beim Laden der Datei');
      } finally {
        setLoading(false);
      }
    };
    
    loadFile();
    
    return () => {
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
      }
    };
  }, [authenticatedUrl]);

  const handleKey = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  }, [onClose]);

  useEffect(() => {
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [handleKey]);

  // Touch gesture handlers
  const getDistance = (touches: TouchList) => {
    if (touches.length < 2) return 0;
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const now = Date.now();
    const timeDiff = now - lastTouchTime;
    
    // Single tap to toggle controls
    if (e.touches.length === 1 && timeDiff < 300) {
      setShowControls(prev => !prev);
      setLastTouchTime(now);
      return;
    }
    
    // Double tap to toggle fullscreen
    if (e.touches.length === 1 && timeDiff < 300 && timeDiff > 100) {
      setIsFullscreen(prev => !prev);
      return;
    }
    
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      setTouchStart({
        x: touch.clientX,
        y: touch.clientY,
        distance: 0
      });
      setIsPanning(true);
    } else if (e.touches.length === 2) {
      const distance = getDistance(e.touches);
      setTouchStart({
        x: (e.touches[0].clientX + e.touches[1].clientX) / 2,
        y: (e.touches[0].clientY + e.touches[1].clientY) / 2,
        distance
      });
      setIsPanning(false);
    }
  }, [lastTouchTime]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!touchStart) return;
    e.preventDefault();
    
    if (e.touches.length === 1 && isPanning) {
      // Pan gesture
      const touch = e.touches[0];
      const deltaX = touch.clientX - touchStart.x;
      const deltaY = touch.clientY - touchStart.y;
      
      setPanOffset(prev => ({
        x: prev.x + deltaX,
        y: prev.y + deltaY
      }));
      
      setTouchStart({
        x: touch.clientX,
        y: touch.clientY,
        distance: 0
      });
    } else if (e.touches.length === 2) {
      // Pinch to zoom
      const distance = getDistance(e.touches);
      const scale = distance / touchStart.distance;
      const newZoom = Math.max(0.5, Math.min(3, zoom * scale));
      setZoom(newZoom);
      
      setTouchStart({
        x: (e.touches[0].clientX + e.touches[1].clientX) / 2,
        y: (e.touches[0].clientY + e.touches[1].clientY) / 2,
        distance
      });
    }
  }, [touchStart, isPanning, zoom]);

  const handleTouchEnd = useCallback(() => {
    setTouchStart(null);
    setIsPanning(false);
  }, []);

  // Reset pan when zoom changes
  useEffect(() => {
    if (zoom <= 1) {
      setPanOffset({ x: 0, y: 0 });
    }
  }, [zoom]);

  const download = () => {
    const a = document.createElement('a');
    a.href = blobUrl || authenticatedUrl;
    a.download = fileName || title || 'datei';
    a.rel = 'noreferrer';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className={`fixed inset-0 z-50 ${isFullscreen ? '' : 'p-2'} bg-black/95 backdrop-blur-sm`}>
      <div className={`bg-gradient-to-br from-[#2c3539] to-[#1a1a2e] ${isFullscreen ? 'rounded-none' : 'rounded-xl'} shadow-2xl h-full flex flex-col`}>
        
        {/* Header */}
        <div className={`flex items-center justify-between ${isFullscreen ? 'p-2' : 'p-3'} border-b border-gray-700`}>
          <div className="min-w-0 flex-1">
            <div className="text-white font-semibold truncate text-sm">
              {title || fileName || 'Dokument'}
            </div>
            {!isFullscreen && (
              <div className="text-xs text-gray-400 truncate">
                {fileName || fileUrl}
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-1">
            <button onClick={download} className="p-2 rounded-lg hover:bg-white/10 text-white" title="Download">
              <Download size={16} />
            </button>
            <a href={blobUrl || authenticatedUrl} target="_blank" rel="noreferrer" className="p-2 rounded-lg hover:bg-white/10 text-white" title="In neuem Tab öffnen">
              <ExternalLink size={16} />
            </a>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/10 text-white" title="Schließen">
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Mobile Controls Panel */}
        {showControls && !isFullscreen && (
          <div className="bg-[#2a2a2a] border-b border-gray-700 p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-white text-sm font-medium">Zoom: {Math.round(zoom * 100)}%</span>
              <button 
                onClick={() => setZoom(1)} 
                className="text-[#ffbd59] text-xs hover:text-[#ffa726]"
              >
                Reset
              </button>
            </div>
            
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setZoom(z => Math.max(z - 0.25, 0.5))} 
                className="flex-1 bg-[#333] hover:bg-[#444] text-white py-2 px-2 rounded-lg text-xs flex items-center justify-center gap-1"
              >
                <ZoomOut size={12} />
                <span>Kleiner</span>
              </button>
              
              <button 
                onClick={() => setZoom(z => Math.min(z + 0.25, 3))} 
                className="flex-1 bg-[#333] hover:bg-[#444] text-white py-2 px-2 rounded-lg text-xs flex items-center justify-center gap-1"
              >
                <ZoomIn size={12} />
                <span>Größer</span>
              </button>
              
              <button 
                onClick={() => setRotation(r => (r + 90) % 360)} 
                className="bg-[#333] hover:bg-[#444] text-white py-2 px-2 rounded-lg text-xs flex items-center justify-center"
                title="Drehen"
              >
                <RotateCw size={12} />
              </button>
              
              <button 
                onClick={() => setRotation(0)} 
                className="bg-[#333] hover:bg-[#444] text-white py-2 px-2 rounded-lg text-xs flex items-center justify-center"
                title="Reset Rotation"
              >
                <RotateCcw size={12} />
              </button>
            </div>
            
            <div className="mt-2 text-xs text-gray-400 text-center">
              Tippen Sie auf das Bild für Zoom & Pan • Doppeltippen für Vollbild
            </div>
          </div>
        )}

        {/* Content */}
        <div 
          ref={containerRef}
          className="flex-1 flex items-center justify-center overflow-auto p-2 relative"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {loading && (
            <div className="text-center text-gray-300">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#ffbd59] mx-auto mb-4"></div>
              <p>Dokument wird geladen...</p>
            </div>
          )}

          {error && (
            <div className="text-center text-red-300">
              <div className="mb-4">❌ Fehler beim Laden des Dokuments</div>
              <p className="text-sm mb-4">{error}</p>
              <div className="flex items-center justify-center gap-2">
                <a href={authenticatedUrl} target="_blank" rel="noreferrer" className="px-4 py-2 bg-[#ffbd59] text-[#1a1a2e] rounded-lg hover:bg-[#ffa726]">Im neuen Tab öffnen</a>
                <button onClick={download} className="px-4 py-2 border border-gray-600 rounded-lg hover:bg-white/10">Download</button>
              </div>
            </div>
          )}

          {!loading && !error && fileType === 'image' && blobUrl && (
            <img
              ref={imageRef}
              src={blobUrl}
              alt={title || fileName || 'Bild'}
              className="max-w-none cursor-grab active:cursor-grabbing"
              style={{ 
                transform: `scale(${zoom}) rotate(${rotation}deg) translate(${panOffset.x}px, ${panOffset.y}px)`, 
                transformOrigin: 'center', 
                transition: isPanning ? 'none' : 'transform 0.2s ease',
                maxWidth: '100vw',
                maxHeight: '100vh'
              }}
              draggable={false}
            />
          )}

          {!loading && !error && fileType === 'pdf' && blobUrl && (
            <div 
              className="bg-white shadow-2xl" 
              style={{ 
                transform: `scale(${zoom}) rotate(${rotation}deg) translate(${panOffset.x}px, ${panOffset.y}px)`, 
                transformOrigin: 'center', 
                transition: isPanning ? 'none' : 'transform 0.2s ease'
              }}
            >
              <iframe 
                src={`${blobUrl}#toolbar=0`} 
                title={title || fileName || 'PDF'} 
                className="w-[95vw] h-[70vh] border-0"
                style={{ pointerEvents: isPanning ? 'none' : 'auto' }}
              />
            </div>
          )}

          {!loading && !error && fileType === 'unknown' && (
            <div className="text-center text-gray-300">
              <div className="mb-4">Keine Inline-Vorschau verfügbar.</div>
              <div className="flex items-center justify-center gap-2">
                <a href={blobUrl || authenticatedUrl} target="_blank" rel="noreferrer" className="px-4 py-2 bg-[#ffbd59] text-[#1a1a2e] rounded-lg hover:bg-[#ffa726]">Im neuen Tab öffnen</a>
                <button onClick={download} className="px-4 py-2 border border-gray-600 rounded-lg hover:bg-white/10">Download</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MobileInlineFileViewer;