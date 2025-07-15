import React, { useState, useEffect } from 'react';
import { 
  X, 
  Download, 
  ZoomIn, 
  ZoomOut, 
  RotateCw, 
  FileText,
  Image,
  File,
  Loader2,
  AlertCircle
} from 'lucide-react';

interface DocumentViewerProps {
  document: {
    id: number;
    title: string;
    file_name: string;
    file_path: string;
    mime_type: string;
    file_size: number;
  } | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function DocumentViewer({ document: doc, isOpen, onClose }: DocumentViewerProps) {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [documentUrl, setDocumentUrl] = useState<string | null>(null);
  const [textContent, setTextContent] = useState<string | null>(null);
  const [contentType, setContentType] = useState<'text' | 'image' | 'pdf' | 'unsupported' | 'error' | null>(null);

  // API-URL basierend auf der aktuellen Host-URL
  const getApiBaseUrl = () => {
    const hostname = window.location.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://localhost:8000';
    }
    return `http://${hostname}:8000`;
  };

  useEffect(() => {
    if (isOpen && doc) {
      setLoading(true);
      setError(null);
      setTextContent(null);
      // Reset zoom and rotation when opening new document
      setZoom(1);
      setRotation(0);
    }
  }, [isOpen, doc]);

  // Lade das Dokument als Blob und erstelle eine URL
  useEffect(() => {
    if (isOpen && doc) {
      const loadDocument = async () => {
        if (!doc) return;
        
        setLoading(true);
        setError(null);
        
        try {
          const token = localStorage.getItem('token');
          const response = await fetch(`${getApiBaseUrl()}/api/v1/documents/${doc.id}/view`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          
          const data = await response.json();
          
          if (data.type === 'text') {
            // Textdateien direkt anzeigen
            setTextContent(data.content);
            setContentType('text');
          } else if (data.type === 'image') {
            // Bilder als Base64 anzeigen
            const blob = new Blob([Uint8Array.from(atob(data.content), c => c.charCodeAt(0))], { type: data.mime_type });
            const url = URL.createObjectURL(blob);
            setDocumentUrl(url);
            setContentType('image');
          } else if (data.type === 'pdf') {
            // PDFs als Base64 anzeigen
            const blob = new Blob([Uint8Array.from(atob(data.content), c => c.charCodeAt(0))], { type: data.mime_type });
            const url = URL.createObjectURL(blob);
            setDocumentUrl(url);
            setContentType('pdf');
          } else if (data.type === 'unsupported') {
            setError(data.message || 'Dieser Dateityp wird nicht unterstützt');
            setContentType('unsupported');
          } else {
            setError('Unbekannter Dateityp');
            setContentType('unsupported');
          }
        } catch (err) {
          console.error('Fehler beim Laden des Dokuments:', err);
          setError('Fehler beim Laden des Dokuments');
          setContentType('error');
        } finally {
          setLoading(false);
        }
      };
      
      loadDocument();
    }
    
    // Cleanup function
    return () => {
      if (documentUrl) {
        URL.revokeObjectURL(documentUrl);
        setDocumentUrl(null);
      }
      setTextContent(null);
    };
  }, [isOpen, doc]);

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.25, 0.25));
  };

  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  const handleDownload = () => {
    if (doc) {
      const token = localStorage.getItem('token');
      const link = document.createElement('a');
      link.href = `${getApiBaseUrl()}/api/v1/documents/${doc.id}/download`;
      link.download = doc.file_name;
      
      // Token als Query-Parameter hinzufügen (falls nötig)
      if (token) {
        link.href += `?token=${token}`;
      }
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) {
      return <Image size={24} className="text-blue-500" />;
    } else if (mimeType.includes('pdf')) {
      return <FileText size={24} className="text-red-500" />;
    } else {
      return <File size={24} className="text-gray-500" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const renderDocumentContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-gray-600">Dokument wird geladen...</p>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="text-center text-red-600">
            <AlertCircle className="h-8 w-8 mx-auto mb-2" />
            <p>{error}</p>
          </div>
        </div>
      );
    }

    if (contentType === 'text' && textContent) {
      return (
        <div className="bg-gray-50 p-4 rounded-lg max-h-96 overflow-auto">
          <pre className="text-sm text-gray-800 whitespace-pre-wrap font-mono">
            {textContent}
          </pre>
        </div>
      );
    }

    if (contentType === 'image' && documentUrl) {
      return (
        <div className="flex justify-center">
          <img
            src={documentUrl}
            alt={doc?.title || 'Dokument'}
            className="max-w-full max-h-full object-contain"
            style={{
              transform: `scale(${zoom}) rotate(${rotation}deg)`,
              transition: 'transform 0.3s ease'
            }}
          />
        </div>
      );
    }

    if (contentType === 'pdf' && documentUrl) {
      return (
        <div className="w-full h-96">
          <iframe
            src={documentUrl}
            className="w-full h-full border-0"
            title={doc?.title || 'PDF Dokument'}
          />
        </div>
      );
    }

    if (contentType === 'unsupported') {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="text-center text-gray-600">
            <File className="h-8 w-8 mx-auto mb-2" />
            <p>Vorschau nicht verfügbar</p>
            <p className="text-sm">Dieser Dateityp wird nicht unterstützt</p>
          </div>
        </div>
      );
    }

    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center text-gray-600">
          <FileText className="h-8 w-8 mx-auto mb-2" />
          <p>Dokument wird geladen...</p>
        </div>
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl h-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            {doc && getFileIcon(doc.mime_type)}
            <div>
              <h2 className="font-semibold text-gray-900">{doc?.title}</h2>
              <p className="text-sm text-gray-500">
                {doc?.file_name} • {doc && formatFileSize(doc.file_size)}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Zoom Controls */}
            <button
              onClick={handleZoomOut}
              disabled={zoom <= 0.25}
              className="p-2 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              title="Verkleinern"
            >
              <ZoomOut size={16} />
            </button>
            <span className="text-sm text-gray-600 min-w-[3rem] text-center">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={handleZoomIn}
              disabled={zoom >= 3}
              className="p-2 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              title="Vergrößern"
            >
              <ZoomIn size={16} />
            </button>
            
            {/* Rotate Button (only for images) */}
            {doc?.mime_type.startsWith('image/') && (
              <button
                onClick={handleRotate}
                className="p-2 hover:bg-gray-100 rounded-lg"
                title="Drehen"
              >
                <RotateCw size={16} />
              </button>
            )}
            
            {/* Download Button */}
            <button
              onClick={handleDownload}
              className="p-2 hover:bg-gray-100 rounded-lg"
              title="Herunterladen"
            >
              <Download size={16} />
            </button>
            
            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg"
              title="Schließen"
            >
              <X size={16} />
            </button>
          </div>
        </div>
        
        {/* Content */}
        <div className="flex-1 relative overflow-hidden">
          {renderDocumentContent()}
        </div>
      </div>
    </div>
  );
} 