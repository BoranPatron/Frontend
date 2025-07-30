import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Download,
  ZoomIn,
  ZoomOut,
  RotateCw,
  FileText,
  MessageSquare,
  Send,
  Star,
  Edit3,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  Eye,
  EyeOff,
  User,
  Calendar,
  Hash
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface Document {
  id: number;
  title: string;
  file_name: string;
  file_path: string;
  file_size: number;
  mime_type?: string;
  description?: string;
  category?: string;
  subcategory?: string;
  is_favorite?: boolean;
  status?: string;
  created_at: string;
  updated_at: string;
  project_id: number;
  uploaded_by: number;
}

interface Comment {
  id: number;
  document_id: number;
  user_id: number;
  user_name: string;
  content: string;
  page_number?: number;
  position_x?: number;
  position_y?: number;
  created_at: string;
  updated_at: string;
}

interface DocumentViewerProps {
  document: Document;
  onClose: () => void;
}

const DocumentViewer: React.FC<DocumentViewerProps> = ({ document, onClose }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string>('');
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [showComments, setShowComments] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // PDF-spezifische States
  const [pdfUrl, setPdfUrl] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  
  // Text-spezifische States
  const [fontSize, setFontSize] = useState(14);
  const [lineHeight, setLineHeight] = useState(1.6);
  
  const viewerRef = useRef<HTMLDivElement>(null);
  const pdfViewerRef = useRef<HTMLIFrameElement>(null);

  // Validierung des document Objekts
  if (!document) {
    console.error('❌ DocumentViewer: document prop is undefined');
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md">
          <h3 className="text-lg font-semibold text-red-600 mb-2">Fehler</h3>
          <p className="text-gray-700 mb-4">Das Dokument konnte nicht geladen werden.</p>
          <button
            onClick={onClose}
            className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
          >
            Schließen
          </button>
        </div>
      </div>
    );
  }

  // Bestimme Dateityp
  const getFileType = () => {
    if (!document.file_name) {
      console.warn('⚠️ DocumentViewer: file_name is missing');
      return 'unsupported';
    }
    
    const extension = document.file_name.split('.').pop()?.toLowerCase();
    const mimeType = document.mime_type?.toLowerCase();
    
    if (mimeType === 'application/pdf' || extension === 'pdf') return 'pdf';
    if (mimeType?.startsWith('text/') || ['txt', 'md', 'log'].includes(extension || '')) return 'text';
    if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(extension || '')) return 'image';
    return 'unsupported';
  };

  const fileType = getFileType();

  // Lade Dokument-Inhalte
  useEffect(() => {
    loadDocument();
    loadComments();
  }, [document.id]);

  const loadDocument = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:8000/api/v1/documents/${document.id}/content`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Dokument konnte nicht geladen werden');
      }

      if (fileType === 'pdf') {
        // PDF als Blob laden und URL erstellen
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        setPdfUrl(url);
      } else if (fileType === 'text') {
        // Text-Inhalt laden
        const text = await response.text();
        setFileContent(text);
      }
    } catch (err: any) {
      setError(err.message || 'Fehler beim Laden des Dokuments');
    } finally {
      setLoading(false);
    }
  };

  const loadComments = async () => {
    try {
      const response = await fetch(`http://localhost:8000/api/v1/documents/${document.id}/comments`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const commentsData = await response.json();
        setComments(commentsData);
      }
    } catch (err) {
      console.warn('Kommentare konnten nicht geladen werden:', err);
    }
  };

  const addComment = async () => {
    if (!newComment.trim()) return;

    try {
      const response = await fetch(`http://localhost:8000/api/v1/documents/${document.id}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          content: newComment.trim(),
          page_number: fileType === 'pdf' ? currentPage : null
        })
      });

      if (response.ok) {
        const comment = await response.json();
        setComments(prev => [...prev, comment]);
        setNewComment('');
      }
    } catch (err) {
      console.error('Kommentar konnte nicht hinzugefügt werden:', err);
    }
  };

  const deleteComment = async (commentId: number) => {
    if (!window.confirm('Kommentar löschen?')) return;

    try {
      const response = await fetch(`http://localhost:8000/api/v1/documents/comments/${commentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        setComments(prev => prev.filter(c => c.id !== commentId));
      }
    } catch (err) {
      console.error('Kommentar konnte nicht gelöscht werden:', err);
    }
  };

  const downloadDocument = async () => {
    try {
      const response = await fetch(`http://localhost:8000/api/v1/documents/${document.id}/download`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
                 const a = window.document.createElement('a');
        a.href = url;
        a.download = document.file_name;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error('Download fehlgeschlagen:', err);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  // PDF-Steuerung
  const zoomIn = () => setZoom(prev => Math.min(prev + 0.25, 3));
  const zoomOut = () => setZoom(prev => Math.max(prev - 0.25, 0.5));
  const rotate = () => setRotation(prev => (prev + 90) % 360);
  const nextPage = () => setCurrentPage(prev => Math.min(prev + 1, totalPages));
  const prevPage = () => setCurrentPage(prev => Math.max(prev - 1, 1));

  // Text-Steuerung
  const increaseFontSize = () => setFontSize(prev => Math.min(prev + 2, 24));
  const decreaseFontSize = () => setFontSize(prev => Math.max(prev - 2, 10));

  // Cleanup bei Unmount
  useEffect(() => {
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [pdfUrl]);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
        <div className="bg-slate-800 rounded-2xl p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#ffbd59] mx-auto mb-4"></div>
          <p className="text-white">Dokument wird geladen...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
        <div className="bg-slate-800 rounded-2xl p-8 text-center max-w-md">
          <div className="text-red-400 mb-4">
            <FileText className="w-16 h-16 mx-auto mb-2" />
            <h3 className="text-xl font-bold">Fehler beim Laden</h3>
          </div>
          <p className="text-gray-300 mb-6">{error}</p>
          <button
            onClick={onClose}
            className="bg-[#ffbd59] text-[#1a1a2e] px-6 py-2 rounded-lg font-medium hover:bg-[#ffa726] transition-colors"
          >
            Schließen
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`fixed inset-0 bg-black/90 backdrop-blur-sm z-50 ${isFullscreen ? 'p-0' : 'p-4'}`}>
      <div className={`bg-gradient-to-br from-[#2c3539] to-[#1a1a2e] rounded-2xl shadow-2xl h-full flex flex-col ${isFullscreen ? 'rounded-none' : ''}`}>
        {/* Header */}
        <div className="bg-gradient-to-r from-[#3d4952] to-[#51646f] p-4 border-b border-gray-700 flex items-center justify-between rounded-t-2xl">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <FileText className="w-6 h-6 text-[#ffbd59]" />
              <div>
                <h2 className="text-lg font-bold text-white truncate max-w-md">{document.title}</h2>
                <div className="flex items-center gap-4 text-sm text-gray-300">
                  <span>{document.file_name}</span>
                  <span>{formatFileSize(document.file_size)}</span>
                  <span>{new Date(document.created_at).toLocaleDateString('de-DE')}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Dokument-spezifische Steuerung */}
            {fileType === 'pdf' && (
              <>
                <div className="flex items-center gap-1 bg-black/20 rounded-lg px-3 py-1">
                  <button onClick={prevPage} disabled={currentPage <= 1} className="p-1 hover:bg-white/10 rounded disabled:opacity-50">
                    <ChevronLeft className="w-4 h-4 text-white" />
                  </button>
                  <span className="text-white text-sm px-2">{currentPage} / {totalPages}</span>
                  <button onClick={nextPage} disabled={currentPage >= totalPages} className="p-1 hover:bg-white/10 rounded disabled:opacity-50">
                    <ChevronRight className="w-4 h-4 text-white" />
                  </button>
                </div>
                <button onClick={zoomOut} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                  <ZoomOut className="w-5 h-5 text-white" />
                </button>
                <span className="text-white text-sm px-2">{Math.round(zoom * 100)}%</span>
                <button onClick={zoomIn} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                  <ZoomIn className="w-5 h-5 text-white" />
                </button>
                <button onClick={rotate} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                  <RotateCw className="w-5 h-5 text-white" />
                </button>
              </>
            )}

            {fileType === 'text' && (
              <>
                <button onClick={decreaseFontSize} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                  <span className="text-white text-sm">A-</span>
                </button>
                <span className="text-white text-sm px-2">{fontSize}px</span>
                <button onClick={increaseFontSize} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                  <span className="text-white text-sm">A+</span>
                </button>
              </>
            )}

            {/* Allgemeine Steuerung */}
            <button onClick={() => setShowComments(!showComments)} className={`p-2 rounded-lg transition-colors ${showComments ? 'bg-[#ffbd59] text-[#1a1a2e]' : 'hover:bg-white/10 text-white'}`}>
              <MessageSquare className="w-5 h-5" />
            </button>
            <button onClick={toggleFullscreen} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
              {isFullscreen ? <Minimize2 className="w-5 h-5 text-white" /> : <Maximize2 className="w-5 h-5 text-white" />}
            </button>
            <button onClick={downloadDocument} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
              <Download className="w-5 h-5 text-white" />
            </button>
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Dokument-Viewer */}
          <div className={`flex-1 bg-gray-100 overflow-auto ${showComments ? 'border-r border-gray-700' : ''}`} ref={viewerRef}>
            {fileType === 'pdf' && pdfUrl && (
              <div className="h-full flex items-center justify-center p-4">
                <div 
                  className="bg-white shadow-2xl"
                  style={{ 
                    transform: `scale(${zoom}) rotate(${rotation}deg)`,
                    transformOrigin: 'center',
                    transition: 'transform 0.3s ease'
                  }}
                >
                  <iframe
                    ref={pdfViewerRef}
                    src={`${pdfUrl}#page=${currentPage}&zoom=${zoom * 100}`}
                    className="w-[800px] h-[1000px] border-0"
                    title={document.title}
                    onLoad={() => {
                      // PDF-Seiten ermitteln (vereinfacht)
                      setTotalPages(10); // Placeholder - in echter Implementierung PDF-Metadaten auslesen
                    }}
                  />
                </div>
              </div>
            )}

            {fileType === 'text' && (
              <div className="h-full p-8 bg-white">
                <pre 
                  className="font-mono text-gray-800 whitespace-pre-wrap break-words"
                  style={{ 
                    fontSize: `${fontSize}px`,
                    lineHeight: lineHeight
                  }}
                >
                  {fileContent}
                </pre>
              </div>
            )}

            {fileType === 'image' && (
              <div className="h-full flex items-center justify-center p-4">
                <img 
                  src={`http://localhost:8000/api/v1/documents/${document.id}/content`}
                  alt={document.title}
                  className="max-w-full max-h-full object-contain"
                  style={{ 
                    transform: `scale(${zoom}) rotate(${rotation}deg)`,
                    transition: 'transform 0.3s ease'
                  }}
                />
              </div>
            )}

            {fileType === 'unsupported' && (
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-600 mb-2">Vorschau nicht verfügbar</h3>
                  <p className="text-gray-500 mb-6">Dieser Dateityp kann nicht inline angezeigt werden.</p>
                  <button
                    onClick={downloadDocument}
                    className="bg-[#ffbd59] text-[#1a1a2e] px-6 py-2 rounded-lg font-medium hover:bg-[#ffa726] transition-colors"
                  >
                    Datei herunterladen
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Kommentarspalte */}
          {showComments && (
            <div className="w-80 bg-[#2c3539] flex flex-col">
              {/* Kommentar-Header */}
              <div className="p-4 border-b border-gray-600">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <MessageSquare className="w-5 h-5" />
                    Kommentare
                  </h3>
                  <span className="text-sm text-gray-400">{comments.length}</span>
                </div>

                {/* Neuer Kommentar */}
                <div className="space-y-3">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Kommentar hinzufügen..."
                    className="w-full bg-[#3d4952] border border-gray-600 rounded-lg p-3 text-white placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent"
                    rows={3}
                  />
                  <button
                    onClick={addComment}
                    disabled={!newComment.trim()}
                    className="w-full bg-[#ffbd59] text-[#1a1a2e] py-2 px-4 rounded-lg font-medium hover:bg-[#ffa726] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    Kommentar hinzufügen
                  </button>
                </div>
              </div>

              {/* Kommentare-Liste */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {comments.length === 0 ? (
                  <div className="text-center py-8">
                    <MessageSquare className="w-12 h-12 text-gray-500 mx-auto mb-3" />
                    <p className="text-gray-400">Noch keine Kommentare</p>
                    <p className="text-sm text-gray-500">Fügen Sie den ersten Kommentar hinzu</p>
                  </div>
                ) : (
                  comments.map((comment) => (
                    <div key={comment.id} className="bg-[#3d4952] rounded-lg p-4 space-y-3">
                      {/* Kommentar-Header */}
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-[#ffbd59] rounded-full flex items-center justify-center">
                            <User className="w-4 h-4 text-[#1a1a2e]" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-white">{comment.user_name}</p>
                            <div className="flex items-center gap-2 text-xs text-gray-400">
                              <Calendar className="w-3 h-3" />
                              {new Date(comment.created_at).toLocaleDateString('de-DE', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                              {comment.page_number && (
                                <>
                                  <Hash className="w-3 h-3" />
                                  <span>Seite {comment.page_number}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Kommentar-Aktionen */}
                        {user?.id === comment.user_id && (
                          <button
                            onClick={() => deleteComment(comment.id)}
                            className="p-1 hover:bg-red-500/20 rounded text-gray-400 hover:text-red-400 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      {/* Kommentar-Inhalt */}
                      <div className="text-gray-200 text-sm leading-relaxed whitespace-pre-wrap">
                        {comment.content}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DocumentViewer; 