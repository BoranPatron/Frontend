import React, { useEffect, useState, useCallback } from 'react';
import { X, Download, ZoomIn, ZoomOut, RotateCw, Maximize2, Minimize2, ExternalLink } from 'lucide-react';
import { getAuthenticatedFileUrl } from '../api/api';

interface InlineFileViewerProps {
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


const InlineFileViewer: React.FC<InlineFileViewerProps> = ({ fileUrl, fileName, title, onClose }) => {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [blobUrl, setBlobUrl] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
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
        
        console.log('🔄 Lade Datei für Inline-Viewer:', authenticatedUrl);
        
        // Verwende fetch mit Authorization-Header
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
    
    // Cleanup bei Unmount
    return () => {
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
      }
    };
  }, [authenticatedUrl]);

  const handleKey = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
    if ((e.ctrlKey || e.metaKey) && e.key === '+') { e.preventDefault(); setZoom(z => Math.min(z + 0.25, 3)); }
    if ((e.ctrlKey || e.metaKey) && (e.key === '-' || e.key === '_')) { e.preventDefault(); setZoom(z => Math.max(z - 0.25, 0.5)); }
  }, [onClose]);

  useEffect(() => {
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [handleKey]);

  const download = () => {
    const a = document.createElement('a');
    // Verwende Blob-URL falls verfügbar, sonst authenticatedUrl
    a.href = blobUrl || authenticatedUrl;
    a.download = fileName || title || 'datei';
    a.rel = 'noreferrer';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className={`fixed inset-0 z-50 ${isFullscreen ? '' : 'p-4'} bg-black/90 backdrop-blur-sm`}>
      <div className={`bg-gradient-to-br from-[#2c3539] to-[#1a1a2e] rounded-2xl shadow-2xl h-full flex flex-col ${isFullscreen ? 'rounded-none' : ''}`}>
        {/* Toolbar */}
        <div className="flex items-center justify-between p-3 border-b border-gray-700">
          <div className="min-w-0">
            <div className="text-white font-semibold truncate max-w-[60vw]">{title || fileName || 'Dokument'}</div>
            <div className="text-xs text-gray-400 truncate max-w-[60vw]">{fileName || fileUrl}</div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setZoom(z => Math.max(z - 0.25, 0.5))} className="p-2 rounded-lg hover:bg-white/10 text-white" title="Verkleinern"><ZoomOut size={18} /></button>
            <span className="text-white text-sm w-12 text-center">{Math.round(zoom * 100)}%</span>
            <button onClick={() => setZoom(z => Math.min(z + 0.25, 3))} className="p-2 rounded-lg hover:bg-white/10 text-white" title="Vergrößern"><ZoomIn size={18} /></button>
            <button onClick={() => setRotation(r => (r + 90) % 360)} className="p-2 rounded-lg hover:bg-white/10 text-white" title="Drehen"><RotateCw size={18} /></button>
            <a href={blobUrl || authenticatedUrl} target="_blank" rel="noreferrer" className="p-2 rounded-lg hover:bg-white/10 text-white" title="In neuem Tab öffnen"><ExternalLink size={18} /></a>
            <button onClick={download} className="p-2 rounded-lg hover:bg-white/10 text-white" title="Download"><Download size={18} /></button>
            <button onClick={() => setIsFullscreen(v => !v)} className="p-2 rounded-lg hover:bg-white/10 text-white" title="Vollbild">
              {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
            </button>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/10 text-white" title="Schließen"><X size={18} /></button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex items-center justify-center overflow-auto p-4">
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
              src={blobUrl}
              alt={title || fileName || 'Bild'}
              className="max-w-none"
              style={{ transform: `scale(${zoom}) rotate(${rotation}deg)`, transformOrigin: 'center', transition: 'transform 0.2s ease' }}
            />
          )}

          {!loading && !error && fileType === 'pdf' && blobUrl && (
            <div className="bg-white shadow-2xl" style={{ transform: `scale(${zoom}) rotate(${rotation}deg)`, transformOrigin: 'center', transition: 'transform 0.2s ease' }}>
              <iframe src={`${blobUrl}#toolbar=0`} title={title || fileName || 'PDF'} className="w-[900px] h-[80vh] border-0" />
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

export default InlineFileViewer;


