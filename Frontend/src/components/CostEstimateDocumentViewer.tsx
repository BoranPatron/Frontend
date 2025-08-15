import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  FileText, 
  Eye, 
  Download, 
  ExternalLink, 
  X 
} from 'lucide-react';

interface DocumentViewerProps {
  documents: Array<{
    id: number | string;
    title?: string;
    name?: string;
    file_name?: string;
    url?: string;
    file_path?: string;
    type?: string;
    mime_type?: string;
    size?: number;
    file_size?: number;
  }>;
  existingQuotes: any[];
}

export default function CostEstimateDocumentViewer({ documents, existingQuotes }: DocumentViewerProps) {
  const [selectedDoc, setSelectedDoc] = useState<string | null>(null);
  const [viewerError, setViewerError] = useState<string | null>(null);
  const { user } = useAuth();

  console.log('🔍 CostEstimateDocumentViewer - Debug:', {
    documents,
    documentsLength: documents?.length,
    documentsType: typeof documents,
    documentsIsArray: Array.isArray(documents),
    documentsFirstItem: documents?.[0],
    existingQuotes
  });

  const safeDocuments = React.useMemo(() => {
    if (!documents || !Array.isArray(documents)) {
      return [];
    }
    
    const filtered = documents.filter(doc => doc && (doc.id || doc.name || doc.title || doc.file_name));
    return filtered;
  }, [documents]);

  console.log('🔍 CostEstimateDocumentViewer - Nach safeDocuments:', {
    safeDocuments,
    safeDocumentsLength: safeDocuments.length,
    safeDocumentsType: typeof safeDocuments,
    safeDocumentsIsArray: Array.isArray(safeDocuments)
  });

  if (!safeDocuments || safeDocuments.length === 0) {
    return (
      <div className="bg-gradient-to-br from-[#2c3539]/30 to-[#1a1a2e]/30 rounded-xl p-6 border border-gray-600/30 backdrop-blur-sm">
        <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
          <FileText size={18} className="text-[#ffbd59]" />
          Dokumente (0)
        </h3>
        <div className="text-center py-8">
          <FileText size={48} className="text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400">Keine Dokumente verfügbar</p>
        </div>
      </div>
    );
  }

  const getApiBaseUrl = () => {
    if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
      return 'http://localhost:8000/api/v1';
    }
    return '/api/v1';
  };

  const getAuthenticatedFileUrl = (filePath: string) => {
    if (!filePath) return '';
    
    const token = localStorage.getItem('token');
    if (!token) return filePath;
    
    const baseUrl = getApiBaseUrl();
    
    if (filePath.startsWith('/api/v1/documents/')) {
      return `${baseUrl.replace('/api/v1', '')}${filePath}?token=${encodeURIComponent(token)}`;
    }
    
    if (filePath.startsWith('/')) {
      return `${baseUrl.replace('/api/v1', '')}${filePath}?token=${encodeURIComponent(token)}`;
    }
    
    return `${baseUrl}/${filePath}?token=${encodeURIComponent(token)}`;
  };

  const extractDocumentIdFromUrl = (url: string): string | null => {
    if (!url) return null;
    
    const match = url.match(/\/documents\/(\d+)/);
    return match ? match[1] : null;
  };

  const getFileIcon = (doc: any) => {
    const fileType = doc.type || doc.mime_type || '';
    const fileName = doc.name || doc.title || doc.file_name || '';
    
    if (fileType.includes('pdf') || fileName.toLowerCase().endsWith('.pdf')) {
      return 'PDF';
    } else if (fileType.includes('image') || /\.(jpg|jpeg|png|gif|bmp|webp)$/i.test(fileName)) {
      return 'IMG';
    } else if (fileType.includes('word') || /\.(doc|docx)$/i.test(fileName)) {
      return 'DOC';
    } else if (fileType.includes('excel') || /\.(xls|xlsx)$/i.test(fileName)) {
      return 'XLS';
    } else if (fileType.includes('powerpoint') || /\.(ppt|pptx)$/i.test(fileName)) {
      return 'PPT';
    } else {
      return 'FILE';
    }
  };

  const canPreview = (doc: any) => {
    const fileType = doc.type || doc.mime_type || '';
    const fileName = doc.name || doc.title || doc.file_name || '';
    
    return fileType.includes('pdf') || 
           fileType.includes('image') || 
           /\.(pdf|jpg|jpeg|png|gif|bmp|webp)$/i.test(fileName);
  };

  const getViewerUrl = (doc: any) => {
    const authenticatedUrl = getAuthenticatedFileUrl(doc.url || doc.file_path || '');
    
    if (doc.type && doc.type.includes('pdf')) {
      return `https://docs.google.com/viewer?url=${encodeURIComponent(authenticatedUrl)}&embedded=true`;
    }
    
    return authenticatedUrl;
  };

  const isBautraeger = () => {
    return user?.user_type === 'bautraeger' || user?.user_type === 'developer' || 
           user?.user_type === 'PRIVATE' || user?.user_type === 'PROFESSIONAL' || 
           user?.user_type === 'private' || user?.user_type === 'professional';
  };

  return (
    <div className="bg-gradient-to-br from-[#2c3539]/30 to-[#1a1a2e]/30 rounded-xl p-6 border border-gray-600/30 backdrop-blur-sm">
      <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
        <FileText size={18} className="text-[#ffbd59]" />
        Dokumente ({safeDocuments.length})
      </h3>
      
      {viewerError && (
        <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
          <p className="text-red-400 text-sm">{viewerError}</p>
        </div>
      )}
      
      <div className="space-y-3">
        {safeDocuments.map((doc) => {
          if (!doc) {
            return null;
          }
          
          return (
          <div key={doc.id} className="bg-gradient-to-br from-[#1a1a2e]/50 to-[#2c3539]/50 rounded-lg border border-gray-600/30 p-4 hover:border-[#ffbd59]/50 transition-all duration-200 group">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-[#ffbd59] to-[#ffa726] rounded-lg flex items-center justify-center text-white font-bold shadow-lg">
                    {getFileIcon(doc)}
                </div>
                <div>
                    <p className="font-medium text-white group-hover:text-[#ffbd59] transition-colors">
                      {doc.name || doc.title || doc.file_name || 'Unbekanntes Dokument'}
                    </p>
                  <p className="text-sm text-gray-400">
                      {((doc.size || doc.file_size || 0) / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                  {canPreview(doc) && (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                        
                        if (doc.type && doc.type.includes('pdf')) {
                          const token = localStorage.getItem('token');
                          if (!token) {
                            setViewerError('Kein Authentifizierungstoken verfügbar');
                            return;
                          }
                          
                          const documentId = extractDocumentIdFromUrl(doc.url || doc.file_path || '');
                          if (documentId) {
                            setSelectedDoc(selectedDoc === String(doc.id) ? null : String(doc.id));
                            setViewerError(null);
                            return;
                          }
                        }
                        
                        setSelectedDoc(selectedDoc === String(doc.id) ? null : String(doc.id));
                      setViewerError(null);
                    }}
                    className={`flex items-center gap-1 px-3 py-2 rounded-lg transition-all duration-200 text-sm font-medium ${
                        selectedDoc === String(doc.id)
                        ? 'bg-[#ffbd59] text-[#1a1a2e] shadow-lg'
                        : 'bg-[#ffbd59]/20 text-[#ffbd59] hover:bg-[#ffbd59]/30'
                    }`}
                    title="Dokument anzeigen"
                  >
                    <Eye size={14} />
                      {selectedDoc === String(doc.id) ? 'Schließen' : 'Ansehen'}
                  </button>
                )}
                  
                  {(isBautraeger() || existingQuotes.some((quote: any) => quote.status === 'accepted')) && (
                <a
                      href={getAuthenticatedFileUrl(doc.url || doc.file_path || '')}
                      download={doc.name || doc.title || doc.file_name || 'document'}
                  className="flex items-center gap-1 px-3 py-2 bg-green-600/20 text-green-400 rounded-lg hover:bg-green-600/30 transition-all duration-200 text-sm font-medium"
                      title={isBautraeger() ? "Dokument herunterladen" : "Dokument herunterladen (nur nach Angebotsannahme)"}
                >
                  <Download size={14} />
                  Download
                </a>
                  )}
                  
                  <button
                    onClick={async (e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      
                      try {
                        const token = localStorage.getItem('token');
                        if (!token) {
                          alert('Kein Authentifizierungstoken verfügbar');
                          return;
                        }
                        
                        const documentId = extractDocumentIdFromUrl(doc.url || doc.file_path || '');
                        if (documentId) {
                          const baseUrl = getApiBaseUrl();
                          const response = await fetch(`${baseUrl}/documents/${documentId}/content`, {
                            headers: {
                              'Authorization': `Bearer ${token}`
                            }
                          });
                          
                          if (response.ok) {
                            const blob = await response.blob();
                            const url = URL.createObjectURL(blob);
                            window.open(url, '_blank');
                            setTimeout(() => URL.revokeObjectURL(url), 1000);
                          } else {
                            throw new Error('Dokument konnte nicht geladen werden');
                          }
                        } else {
                          const authenticatedUrl = getAuthenticatedFileUrl(doc.url || doc.file_path || '');
                          window.open(authenticatedUrl, '_blank');
                        }
                      } catch (error) {
                        console.error('❌ Fehler beim Öffnen des Dokuments:', error);
                        alert('Dokument konnte nicht geöffnet werden');
                      }
                    }}
                  className="flex items-center gap-1 px-3 py-2 bg-blue-600/20 text-blue-400 rounded-lg hover:bg-blue-600/30 transition-all duration-200 text-sm font-medium"
                  title="In neuem Tab öffnen"
                >
                  <ExternalLink size={14} />
                  Öffnen
                  </button>
              </div>
            </div>
            
              {selectedDoc === String(doc.id) && (
                <div className="mt-4 bg-gradient-to-br from-[#1a1a2e]/80 to-[#2c3539]/80 rounded-lg border border-gray-600/50 overflow-hidden">
                  <div className="flex items-center justify-between p-3 border-b border-gray-600/30">
                    <div className="flex items-center gap-2">
                      <FileText size={16} className="text-[#ffbd59]" />
                      <span className="text-white font-medium">
                        {doc.name || doc.title || doc.file_name || 'Dokument'}
                      </span>
                        </div>
                        <button
                          onClick={() => setSelectedDoc(null)}
                          className="text-gray-400 hover:text-white transition-colors"
                        >
                          <X size={16} />
                        </button>
                      </div>
                      <div style={{ height: '400px' }} className="relative">
                        <iframe
                        src={getViewerUrl(doc)}
                          width="100%"
                          height="100%"
                          frameBorder="0"
                          className="rounded-b border-0"
                          onError={() => {
                          setViewerError('Das Dokument konnte nicht geladen werden');
                          }}
                        />
                </div>
              </div>
            )}
          </div>
          );
        })}
      </div>
    </div>
  );
}
