import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getApiBaseUrl } from '../api/api';
import {
  X,
  Download,
  ExternalLink,
  FileText,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Maximize2,
  ChevronLeft,
  ChevronRight,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import type { DocumentItem } from './DocumentSidebar';

interface DocumentViewerModalProps {
  document: DocumentItem | null;
  isOpen: boolean;
  onClose: () => void;
  onNavigate?: (direction: 'prev' | 'next') => void;
  canNavigatePrev?: boolean;
  canNavigateNext?: boolean;
}

const DocumentViewerModal: React.FC<DocumentViewerModalProps> = ({
  document,
  isOpen,
  onClose,
  onNavigate,
  canNavigatePrev = false,
  canNavigateNext = false
}) => {
  const { user } = useAuth();
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);

  useEffect(() => {
    if (document && isOpen) {
      loadDocument();
    }
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [document, isOpen]);

  const loadDocument = async () => {
    if (!document) return;

    setLoading(true);
    setError(null);
    setPdfUrl(null);

    try {
      const token = localStorage.getItem('token');
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

      // Versuche Document-ID aus verschiedenen Quellen zu extrahieren
      let documentId = document.id;
      
      const response = await fetch(`${getApiBaseUrl()}/api/v1/documents/${documentId}/content`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Dokument konnte nicht geladen werden');
      }

      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      setPdfUrl(objectUrl);
    } catch (err: any) {
      console.error('❌ Fehler beim Laden des Dokuments:', err);
      setError(err.message || 'Fehler beim Laden des Dokuments');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!document) return;

    try {
      const token = localStorage.getItem('token');
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

      const response = await fetch(`${baseUrl}/documents/${document.id}/download`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Download fehlgeschlagen');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = document.filename || 'dokument.pdf';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      
      // Safe cleanup with timeout
      setTimeout(() => {
        try {
          if (a.parentNode === document.body) {
            document.body.removeChild(a);
          }
        } catch (error) {
          console.warn('Failed to remove download link:', error);
        }
      }, 100);
    } catch (err: any) {
      console.error('❌ Download-Fehler:', err);
      alert('Fehler beim Herunterladen: ' + err.message);
    }
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 25, 200));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 25, 50));
  };

  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (!isOpen) return;

    switch (e.key) {
      case 'Escape':
        onClose();
        break;
      case 'ArrowLeft':
        if (canNavigatePrev && onNavigate) {
          onNavigate('prev');
        }
        break;
      case 'ArrowRight':
        if (canNavigateNext && onNavigate) {
          onNavigate('next');
        }
        break;
      case '+':
      case '=':
        handleZoomIn();
        break;
      case '-':
        handleZoomOut();
        break;
      case 'r':
      case 'R':
        handleRotate();
        break;
    }
  };

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, canNavigatePrev, canNavigateNext]);

  if (!isOpen || !document) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/90 z-[100] flex flex-col">
        {/* Header */}
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          className="bg-[#1a1a1a]/95 backdrop-blur-sm border-b border-gray-700 p-4"
        >
          <div className="max-w-screen-2xl mx-auto flex items-center justify-between">
            {/* Document Info */}
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <div className="w-10 h-10 bg-[#ffbd59] rounded-lg flex items-center justify-center flex-shrink-0">
                <FileText className="w-6 h-6 text-black" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-white font-semibold text-lg truncate">
                  {document.title}
                </h2>
                <p className="text-gray-400 text-sm truncate">
                  {document.filename}
                  {document.ausschreibung_title && (
                    <span className="text-[#ffbd59] ml-2">
                      • {document.ausschreibung_title}
                    </span>
                  )}
                </p>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-2">
              {/* Zoom Controls */}
              <div className="flex items-center gap-1 bg-[#2a2a2a] rounded-lg p-1">
                <button
                  onClick={handleZoomOut}
                  disabled={zoom <= 50}
                  className="p-2 hover:bg-[#333] rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  title="Verkleinern (-)"
                >
                  <ZoomOut className="w-4 h-4 text-white" />
                </button>
                <span className="text-white text-sm px-2 min-w-[60px] text-center">
                  {zoom}%
                </span>
                <button
                  onClick={handleZoomIn}
                  disabled={zoom >= 200}
                  className="p-2 hover:bg-[#333] rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  title="Vergrößern (+)"
                >
                  <ZoomIn className="w-4 h-4 text-white" />
                </button>
              </div>

              {/* Rotate */}
              <button
                onClick={handleRotate}
                className="p-2 bg-[#2a2a2a] hover:bg-[#333] rounded-lg transition-colors"
                title="Drehen (R)"
              >
                <RotateCw className="w-4 h-4 text-white" />
              </button>

              {/* Download */}
              <button
                onClick={handleDownload}
                className="p-2 bg-[#2a2a2a] hover:bg-[#ffbd59] hover:text-black rounded-lg transition-colors"
                title="Herunterladen"
              >
                <Download className="w-4 h-4" />
              </button>

              {/* Close */}
              <button
                onClick={onClose}
                className="p-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                title="Schließen (ESC)"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>
        </motion.div>

        {/* Content Area */}
        <div className="flex-1 relative overflow-hidden">
          {/* Navigation Buttons */}
          {onNavigate && (
            <>
              {canNavigatePrev && (
                <button
                  onClick={() => onNavigate('prev')}
                  className="absolute left-4 top-1/2 -translate-y-1/2 z-10 p-3 bg-[#1a1a1a]/90 hover:bg-[#ffbd59] text-white hover:text-black rounded-full transition-colors shadow-lg"
                  title="Vorheriges Dokument (←)"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
              )}
              {canNavigateNext && (
                <button
                  onClick={() => onNavigate('next')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 z-10 p-3 bg-[#1a1a1a]/90 hover:bg-[#ffbd59] text-white hover:text-black rounded-full transition-colors shadow-lg"
                  title="Nächstes Dokument (→)"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              )}
            </>
          )}

          {/* Document Viewer */}
          <div className="w-full h-full flex items-center justify-center p-8">
            {loading ? (
              <div className="text-center">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-[#ffbd59] border-t-transparent mx-auto mb-4"></div>
                <p className="text-gray-400">Lade Dokument...</p>
              </div>
            ) : error ? (
              <div className="text-center">
                <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                <p className="text-red-400 mb-4">{error}</p>
                <button
                  onClick={loadDocument}
                  className="px-6 py-3 bg-[#ffbd59] text-black rounded-lg hover:bg-[#f59e0b] transition-colors"
                >
                  Erneut versuchen
                </button>
              </div>
            ) : pdfUrl ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full h-full"
                style={{
                  transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
                  transition: 'transform 0.3s ease'
                }}
              >
                <iframe
                  src={pdfUrl}
                  className="w-full h-full bg-white rounded-lg shadow-2xl"
                  title={document.title}
                />
              </motion.div>
            ) : (
              <div className="text-center">
                <FileText className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">Dokument wird vorbereitet...</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer with keyboard shortcuts hint */}
        <div className="bg-[#1a1a1a]/95 backdrop-blur-sm border-t border-gray-700 px-4 py-2">
          <div className="max-w-screen-2xl mx-auto">
            <p className="text-gray-500 text-xs text-center">
              Tastenkombinationen: ESC = Schließen | ← → = Navigation | + - = Zoom | R = Drehen
            </p>
          </div>
        </div>
      </div>
    </AnimatePresence>
  );
};

export default DocumentViewerModal;

