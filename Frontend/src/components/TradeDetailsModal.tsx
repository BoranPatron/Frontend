import React, { useState, useEffect } from 'react';
import { 
  X, 
  Eye, 
  Download, 
  ExternalLink, 
  FileText, 
  ChevronDown,
  User,
  Mail,
  Phone,
  Globe,
  Calendar,
  MapPin,
  CheckCircle,
  Clock,
  Star,
  Building,
  Calculator,
  Receipt
} from 'lucide-react';
import type { TradeSearchResult } from '../api/geoService';
import { useAuth } from '../context/AuthContext';
import { getAuthenticatedFileUrl, getApiBaseUrl, apiCall } from '../api/api';
import TradeProgress from './TradeProgress';
import ServiceProviderRating from './ServiceProviderRating';
import InvoiceUpload from './InvoiceUpload';
// import FullDocumentViewer from './DocumentViewer';

// PDF Viewer Komponente
const PDFViewer: React.FC<{ url: string; filename: string; onError: (error: string) => void }> = ({ url, filename, onError }) => {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadPDF = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        onError('Kein Authentifizierungstoken verfügbar');
        return;
      }

      // Versuche Document-ID aus URL zu extrahieren
      const documentId = extractDocumentIdFromUrl(url);
      if (documentId) {
        const baseUrl = getApiBaseUrl();
        const response = await fetch(`${baseUrl}/documents/${documentId}/content`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const blob = await response.blob();
          const objectUrl = URL.createObjectURL(blob);
          setPdfUrl(objectUrl);
        } else {
          throw new Error('PDF konnte nicht geladen werden');
        }
      } else {
        // Fallback: Verwende die authentifizierte URL
        const authenticatedUrl = getAuthenticatedFileUrl(url);
        setPdfUrl(authenticatedUrl);
      }
    } catch (error) {
      console.error('❌ Fehler beim Laden des PDFs:', error);
      onError('PDF konnte nicht geladen werden');
    } finally {
      setLoading(false);
    }
  };

  // Hilfsfunktion um Document-ID aus URL zu extrahieren
  const extractDocumentIdFromUrl = (url: string): string | null => {
    const patterns = [
      /\/documents\/(\d+)\//,
      /document_(\d+)/,
      /(\d+)\.(pdf|doc|docx|txt)$/,
      /\/storage\/uploads\/project_\d+\/(\d+)\./
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        return match[1];
      }
    }
    return null;
  };

  useEffect(() => {
    loadPDF();
  }, [url]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#ffbd59] mx-auto mb-2"></div>
          <p className="text-gray-400 text-sm">Lade PDF...</p>
        </div>
      </div>
    );
  }

  if (!pdfUrl) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-red-400 text-sm">PDF konnte nicht geladen werden</p>
        </div>
      </div>
    );
  }

  return (
    <iframe
      src={pdfUrl}
      width="100%"
      height="100%"
      frameBorder="0"
      className="rounded-b border-0"
      title={filename}
    />
  );
};

interface TradeDetailsModalProps {
  trade: TradeSearchResult | null;
  isOpen: boolean;
  onClose: () => void;
  onCreateQuote: (trade: TradeSearchResult) => void;
  existingQuotes?: Quote[];
}

interface Quote {
  id: number;
  service_provider_id: number;
  status: string;
  total_price: number;
  created_at: string;
  service_provider_name?: string;
  contact_released?: boolean;
  company_name?: string;
  contact_person?: string;
  phone?: string;
  email?: string;
  website?: string;
}

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
  existingQuotes: Quote[];
}

function TradeDocumentViewer({ documents, existingQuotes }: DocumentViewerProps) {
  const [selectedDoc, setSelectedDoc] = useState<string | null>(null);
  const [viewerError, setViewerError] = useState<string | null>(null);
  const { isBautraeger } = useAuth();

  console.log('🔍 TradeDocumentViewer - Debug:', {
    documents,
    documentsLength: documents?.length,
    documentsType: typeof documents,
    documentsIsArray: Array.isArray(documents),
    documentsFirstItem: documents?.[0],
    isBautraeger: isBautraeger(),
    existingQuotes,
    documentsFull: documents,
    // Zusätzliche Debug-Informationen
    documentsStringified: JSON.stringify(documents, null, 2)
  });

  // Robuste Dokumentenverarbeitung
  const safeDocuments = React.useMemo(() => {
    if (!documents) return [];
    if (Array.isArray(documents)) return documents;
    if (typeof documents === 'string') {
      try {
        const parsed = JSON.parse(documents);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }
    return [];
  }, [documents]);

  console.log('🔍 TradeDocumentViewer - Nach safeDocuments:', {
    safeDocuments,
    safeDocumentsLength: safeDocuments.length,
    safeDocumentsType: typeof safeDocuments,
    safeDocumentsIsArray: Array.isArray(safeDocuments)
  });

  if (!safeDocuments || safeDocuments.length === 0) {
    return (
      <div className="bg-gradient-to-br from-[#2c3539]/30 to-[#1a1a2e]/30 rounded-xl p-6 border border-gray-600/30 backdrop-blur-sm">
        <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
          <FileText size={18} className="text-[#ffbd59]" />
          Dokumente
        </h3>
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <FileText size={48} className="text-gray-500 mx-auto mb-3 opacity-50" />
            <p className="text-gray-400 text-sm">
              {isBautraeger() 
                ? 'Keine Dokumente für dieses Gewerk vorhanden' 
                : 'Keine Dokumente für dieses Gewerk freigegeben'
              }
            </p>
            <p className="text-gray-500 text-xs mt-1">
              {isBautraeger() 
                ? 'Dokumente können über die Projektverwaltung hinzugefügt werden' 
                : 'Dokumente werden nach Angebotsannahme verfügbar'
              }
            </p>
          </div>
        </div>
      </div>
    );
  }

  const getFileIcon = (doc: any) => {
    const type = doc.type || doc.mime_type || '';
    if (type && type.includes('pdf')) return '📄';
    if (type && (type.includes('word') || type.includes('document'))) return '📝';
    if (type && (type.includes('presentation') || type.includes('powerpoint'))) return '📊';
    return '📁';
  };

  const canPreview = (doc: any) => {
    const type = doc.type || doc.mime_type || '';
    return type && (type.includes('pdf') || 
           type.includes('word') || 
           type.includes('document') ||
           type.includes('presentation') || 
           type.includes('powerpoint'));
  };

  const getViewerUrl = (doc: any) => {
    const url = doc.url || doc.file_path || '';
    const type = doc.type || doc.mime_type || '';
    
    if (type && type.includes('pdf')) {
      const documentId = extractDocumentIdFromUrl(url);
      if (documentId) {
        const baseUrl = getApiBaseUrl();
        return `${baseUrl}/documents/${documentId}/content`;
      }
      return getAuthenticatedFileUrl(url);
    }
    
    if (type && (type.includes('word') || type.includes('document') || 
        type.includes('presentation') || type.includes('powerpoint'))) {
      const authenticatedUrl = getAuthenticatedFileUrl(url);
      return `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(authenticatedUrl)}`;
    }
    
    return getAuthenticatedFileUrl(url);
  };

  const extractDocumentIdFromUrl = (url: string): string | null => {
    const patterns = [
      /\/documents\/(\d+)\//,
      /document_(\d+)/,
      /(\d+)\.(pdf|doc|docx|txt)$/,
      /\/storage\/uploads\/project_\d+\/(\d+)\./
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        return match[1];
      }
    }
    return null;
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
                  
                  {(isBautraeger() || existingQuotes.some((quote: Quote) => quote.status === 'accepted')) && (
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
                    {doc.type && doc.type.includes('pdf') ? (
                      <PDFViewer 
                        url={doc.url || doc.file_path || ''} 
                        filename={doc.name || doc.title || doc.file_name || 'document'}
                        onError={(error: string) => {
                          console.error(`❌ PDF Viewer Fehler:`, error);
                          setViewerError('PDF konnte nicht geladen werden');
                        }}
                      />
                    ) : (
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
                  )}
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

   export default function TradeDetailsModal({ 
  trade, 
  isOpen, 
  onClose, 
  onCreateQuote, 
  existingQuotes = [] 
}: TradeDetailsModalProps) {
  

  const { user, isBautraeger } = useAuth();
  // const [loading, setLoading] = useState(false);
  // const [userHasQuote, setUserHasQuote] = useState(false);
  // const [userQuote, setUserQuote] = useState<Quote | null>(null);
  // const [showCostEstimateForm, setShowCostEstimateForm] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Neue States für dynamisches Laden der Dokumente
  const [loadedDocuments, setLoadedDocuments] = useState<any[]>([]);
  const [documentsLoading, setDocumentsLoading] = useState(false);
  const [documentsError, setDocumentsError] = useState<string | null>(null);
  
  // States für neue Features
  const [currentProgress, setCurrentProgress] = useState(trade?.progress_percentage || 0);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [hasRated, setHasRated] = useState(false);
  const [acceptedQuote, setAcceptedQuote] = useState<Quote | null>(null);
  const [completionStatus, setCompletionStatus] = useState(trade?.completion_status || 'in_progress');

  console.log('🔍 TradeDetailsModal - Hauptkomponente gerendert:', {
    isOpen,
    tradeId: trade?.id,
    documents: trade?.documents,
    documentsLength: trade?.documents?.length,
    documentsType: typeof trade?.documents,
    documentsIsArray: Array.isArray(trade?.documents),
    isBautraeger: isBautraeger(),
    existingQuotes: existingQuotes,
    tradeKeys: trade ? Object.keys(trade) : [],
    tradeFull: trade,
    // Erweiterte Debug-Informationen
    loadedDocuments: loadedDocuments,
    loadedDocumentsLength: loadedDocuments.length,
    documentsLoading: documentsLoading,
    documentsError: documentsError
  });

  // Funktion zum dynamischen Laden der Dokumente
  const loadTradeDocuments = async (tradeId: number) => {
    if (!tradeId) return;
    
    setDocumentsLoading(true);
    setDocumentsError(null);
    
    try {
      console.log('🔍 TradeDetailsModal - Lade Dokumente für Trade:', tradeId);
      
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Kein Authentifizierungstoken verfügbar');
      }
      
      const baseUrl = getApiBaseUrl();
      
      // Für Bauträger: Lade direkt vom Milestone-Endpoint
      // Für Dienstleister: Verwende die Geo-Suche (wie bisher)
      if (isBautraeger()) {
        console.log('🏗️ Bauträger-Modus: Lade Dokumente direkt vom Milestone-Endpoint');
        
        const response = await fetch(`${baseUrl}/milestones/${tradeId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) {
          throw new Error(`Fehler beim Laden der Gewerk-Details: ${response.status}`);
        }
        
        const milestoneData = await response.json();
        console.log('✅ TradeDetailsModal - Milestone-Daten geladen:', milestoneData);
        
        // Extrahiere und verarbeite die Dokumente
        let documents = [];
        if (milestoneData.documents) {
          if (Array.isArray(milestoneData.documents)) {
            documents = milestoneData.documents;
          } else if (typeof milestoneData.documents === 'string') {
            try {
              documents = JSON.parse(milestoneData.documents);
            } catch (e) {
              console.error('❌ Fehler beim Parsen der Dokumente:', e);
              documents = [];
            }
          }
        }
        
        // Zusätzlich: Lade geteilte Dokumente falls vorhanden
        if (milestoneData.shared_document_ids) {
          try {
            let sharedDocIds = milestoneData.shared_document_ids;
            if (typeof sharedDocIds === 'string') {
              sharedDocIds = JSON.parse(sharedDocIds);
            }
            
            if (Array.isArray(sharedDocIds) && sharedDocIds.length > 0) {
              // Lade die geteilten Dokumente
              const sharedDocsPromises = sharedDocIds.map(async (docId: number) => {
                try {
                  const docResponse = await fetch(`${baseUrl}/documents/${docId}`, {
                    headers: {
                      'Authorization': `Bearer ${token}`,
                      'Content-Type': 'application/json'
                    }
                  });
                  
                  if (docResponse.ok) {
                    const docData = await docResponse.json();
                    return {
                      id: docData.id,
                      name: docData.title || docData.file_name,
                      title: docData.title,
                      file_name: docData.file_name,
                      url: `/api/v1/documents/${docData.id}/download`,
                      file_path: `/api/v1/documents/${docData.id}/download`,
                      type: docData.mime_type || 'application/octet-stream',
                      mime_type: docData.mime_type,
                      size: docData.file_size || 0,
                      file_size: docData.file_size,
                      category: docData.category,
                      subcategory: docData.subcategory,
                      created_at: docData.created_at
                    };
                  }
                  return null;
                } catch (e) {
                  console.error(`❌ Fehler beim Laden des geteilten Dokuments ${docId}:`, e);
                  return null;
                }
              });
              
              const sharedDocs = await Promise.all(sharedDocsPromises);
              const validSharedDocs = sharedDocs.filter(doc => doc !== null);
              
              console.log('📄 TradeDetailsModal - Geteilte Dokumente geladen:', validSharedDocs);
              documents = [...documents, ...validSharedDocs];
            }
          } catch (e) {
            console.error('❌ Fehler beim Verarbeiten der geteilten Dokumente:', e);
          }
        }
        
        console.log('📄 TradeDetailsModal - Finale Dokumentenliste (Bauträger):', documents);
        setLoadedDocuments(documents);
        
      } else {
        // Dienstleister-Modus: Verwende die Geo-Suche (wie bisher)
        console.log('🔧 Dienstleister-Modus: Verwende Geo-Suche für Dokumente');
        
        // Lade das vollständige Milestone mit Dokumenten vom Backend
        const response = await fetch(`${baseUrl}/milestones/${tradeId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) {
          throw new Error(`Fehler beim Laden der Gewerk-Details: ${response.status}`);
        }
        
        const milestoneData = await response.json();
        console.log('✅ TradeDetailsModal - Milestone-Daten geladen:', milestoneData);
        
        // Extrahiere und verarbeite die Dokumente
        let documents = [];
        if (milestoneData.documents) {
          if (Array.isArray(milestoneData.documents)) {
            documents = milestoneData.documents;
          } else if (typeof milestoneData.documents === 'string') {
            try {
              documents = JSON.parse(milestoneData.documents);
            } catch (e) {
              console.error('❌ Fehler beim Parsen der Dokumente:', e);
              documents = [];
            }
          }
        }
        
        // Zusätzlich: Lade geteilte Dokumente falls vorhanden
        if (milestoneData.shared_document_ids) {
          try {
            let sharedDocIds = milestoneData.shared_document_ids;
            if (typeof sharedDocIds === 'string') {
              sharedDocIds = JSON.parse(sharedDocIds);
            }
            
            if (Array.isArray(sharedDocIds) && sharedDocIds.length > 0) {
              // Lade die geteilten Dokumente
              const sharedDocsPromises = sharedDocIds.map(async (docId: number) => {
                try {
                  const docResponse = await fetch(`${baseUrl}/documents/${docId}`, {
                    headers: {
                      'Authorization': `Bearer ${token}`,
                      'Content-Type': 'application/json'
                    }
                  });
                  
                  if (docResponse.ok) {
                    const docData = await docResponse.json();
                    return {
                      id: docData.id,
                      name: docData.title || docData.file_name,
                      title: docData.title,
                      file_name: docData.file_name,
                      url: `/api/v1/documents/${docData.id}/download`,
                      file_path: `/api/v1/documents/${docId}/download`,
                      type: docData.mime_type || 'application/octet-stream',
                      mime_type: docData.mime_type,
                      size: docData.file_size || 0,
                      file_size: docData.file_size,
                      category: docData.category,
                      subcategory: docData.subcategory,
                      created_at: docData.created_at
                    };
                  }
                  return null;
                } catch (e) {
                  console.error(`❌ Fehler beim Laden des geteilten Dokuments ${docId}:`, e);
                  return null;
                }
              });
              
              const sharedDocs = await Promise.all(sharedDocsPromises);
              const validSharedDocs = sharedDocs.filter(doc => doc !== null);
              
              console.log('📄 TradeDetailsModal - Geteilte Dokumente geladen:', validSharedDocs);
              documents = [...documents, ...validSharedDocs];
            }
          } catch (e) {
            console.error('❌ Fehler beim Verarbeiten der geteilten Dokumente:', e);
          }
        }
        
        console.log('📄 TradeDetailsModal - Finale Dokumentenliste (Dienstleister):', documents);
        setLoadedDocuments(documents);
      }
      
    } catch (error) {
      console.error('❌ TradeDetailsModal - Fehler beim Laden der Dokumente:', error);
      setDocumentsError(error instanceof Error ? error.message : 'Unbekannter Fehler');
      
      // Fallback: Verwende die ursprünglichen trade.documents falls vorhanden
      if (trade?.documents && Array.isArray(trade.documents)) {
        console.log('🔄 TradeDetailsModal - Verwende Fallback auf trade.documents:', trade.documents);
        setLoadedDocuments(trade.documents);
      } else {
        setLoadedDocuments([]);
      }
    } finally {
      setDocumentsLoading(false);
    }
  };

  // Zusätzliche Debug-Logs für Dokumente
  useEffect(() => {
    if (trade?.documents) {
      console.log('📄 TradeDetailsModal - Dokumente gefunden:', {
        documents: trade.documents,
        documentsLength: trade.documents.length,
        documentsType: typeof trade.documents,
        documentsIsArray: Array.isArray(trade.documents),
        firstDocument: trade.documents[0],
        allDocuments: trade.documents
      });
    } else {
      console.log('⚠️ TradeDetailsModal - Keine Dokumente gefunden');
    }
  }, [trade?.documents]);

  // Lade Dokumente wenn Modal geöffnet wird
  useEffect(() => {
    if (isOpen && trade?.id) {
      console.log('🔍 TradeDetailsModal - Modal geöffnet, lade Dokumente für Trade:', trade.id);
      loadTradeDocuments(trade.id);
    }
  }, [isOpen, trade?.id]);

  // Fallback: Setze ursprüngliche Dokumente falls vorhanden und noch keine geladen wurden
  useEffect(() => {
    if (isOpen && trade?.documents && Array.isArray(trade.documents) && loadedDocuments.length === 0 && !documentsLoading) {
      console.log('🔄 TradeDetailsModal - Setze ursprüngliche trade.documents als Fallback:', trade.documents);
      setLoadedDocuments(trade.documents);
    }
  }, [isOpen, trade?.documents, loadedDocuments.length, documentsLoading]);

    // useEffect(() => {
  //   if (isOpen && trade) {
  //   setLoading(true);
  //     
  //     const userQuote = existingQuotes.find(quote => quote.service_provider_id === user?.id);
  //     if (userQuote) {
  //       setUserHasQuote(true);
  //       setUserQuote(userQuote);
  //     } else {
  //       setUserHasQuote(false);
  //     setUserQuote(null);
  //     }
  //     
  //     setLoading(false);
  //   }
  // }, [isOpen, trade, existingQuotes, user?.id]);

  // Finde akzeptiertes Quote
  useEffect(() => {
    if (existingQuotes && existingQuotes.length > 0) {
      console.log('🔍 Debug existingQuotes:', existingQuotes);
      const accepted = existingQuotes.find(q => q.status === 'accepted');
      console.log('🔍 Debug accepted quote:', accepted);
      if (accepted) {
        setAcceptedQuote(accepted);
      } else {
        // Fallback: Auch nach anderen möglichen Status-Werten suchen
        const acceptedFallback = existingQuotes.find(q => 
          q.status === 'angenommen' || 
          q.status === 'ACCEPTED' || 
          q.status === 'Angenommen'
        );
        console.log('🔍 Debug accepted fallback:', acceptedFallback);
        if (acceptedFallback) {
          setAcceptedQuote(acceptedFallback);
        }
      }
    }
  }, [existingQuotes]);

  // Update completion status from trade
  useEffect(() => {
    if (trade) {
      setCompletionStatus(trade.completion_status || 'in_progress');
      setCurrentProgress(trade.progress_percentage || 0);
    }
  }, [trade]);

  const getCategoryIcon = (category: string) => {
    const iconMap: { [key: string]: { color: string; icon: React.ReactNode } } = {
      'electrical': { color: '#fbbf24', icon: <span className="text-lg">⚡</span> },
      'plumbing': { color: '#3b82f6', icon: <span className="text-lg">🔧</span> },
      'heating': { color: '#ef4444', icon: <span className="text-lg">🔥</span> },
      'roofing': { color: '#f97316', icon: <span className="text-lg">🏠</span> },
      'windows': { color: '#10b981', icon: <span className="text-lg">🪟</span> },
      'flooring': { color: '#8b5cf6', icon: <span className="text-lg">📐</span> },
      'walls': { color: '#ec4899', icon: <span className="text-lg">🧱</span> },
      'foundation': { color: '#6b7280', icon: <span className="text-lg">🏗️</span> },
      'landscaping': { color: '#22c55e', icon: <span className="text-lg">🌱</span> }
    };
    
    return iconMap[category] || { color: '#6b7280', icon: <span className="text-lg">🔧</span> };
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planned': return 'text-blue-400';
      case 'in_progress': return 'text-yellow-400';
      case 'completed': return 'text-green-400';
      case 'delayed': return 'text-red-400';
      case 'cancelled': return 'text-gray-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'planned': return 'Geplant';
      case 'in_progress': return 'In Bearbeitung';
      case 'completed': return 'Abgeschlossen';
      case 'delayed': return 'Verzögert';
      case 'cancelled': return 'Storniert';
      default: return status;
    }
  };

  const getQuoteStatusColor = (status: string) => {
    switch (status) {
      case 'accepted': return 'text-green-400';
      case 'submitted': return 'text-yellow-400';
      case 'rejected': return 'text-red-400';
      case 'draft': return 'text-gray-400';
      default: return 'text-gray-400';
    }
  };

  const getQuoteStatusLabel = (status: string) => {
    switch (status) {
      case 'accepted': return 'Angenommen';
      case 'submitted': return 'Eingereicht';
      case 'rejected': return 'Abgelehnt';
      case 'draft': return 'Entwurf';
      default: return status;
    }
  };

  // Handler für Baufortschritt
  const handleProgressChange = async (newProgress: number) => {
    setCurrentProgress(newProgress);
    // Optional: API call to update progress
  };

  const handleCompletionRequest = async () => {
    try {
      await apiCall(`/milestones/${trade?.id}/progress/completion`, {
        method: 'POST',
        body: JSON.stringify({
          message: 'Gewerk fertiggestellt. Bitte um Abnahme.'
        })
      });
      setCompletionStatus('completion_requested');
    } catch (error) {
      console.error('Fehler bei Fertigstellungsmeldung:', error);
    }
  };

  const handleCompletionResponse = async (accepted: boolean, message?: string, deadline?: string) => {
    try {
      await apiCall(`/milestones/${trade?.id}/progress/completion/response`, {
        method: 'POST',
        body: JSON.stringify({
          accepted,
          message,
          revision_deadline: deadline
        })
      });
      setCompletionStatus(accepted ? 'completed' : 'under_review');
    } catch (error) {
      console.error('Fehler bei Abnahme-Antwort:', error);
    }
  };

  const handleInvoiceUploaded = () => {
    // Refresh trade data after invoice upload
    if (trade?.id) {
      loadTradeDocuments(trade.id);
    }
  };

  const handleRatingComplete = () => {
    setHasRated(true);
    setShowRatingModal(false);
  };

  if (!isOpen || !trade) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-[#1a1a2e] to-[#2c3539] rounded-2xl shadow-2xl border border-gray-600/30 max-w-6xl w-full max-h-[95vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-600/30">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-[#ffbd59] to-[#ffa726] rounded-xl flex items-center justify-center text-white font-bold shadow-lg">
              {getCategoryIcon(trade.category || '').icon}
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">{trade.title}</h2>
              <p className="text-gray-400 text-sm">{trade.category}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors p-2 rounded-lg hover:bg-white/10"
          >
            <X size={24} />
          </button>
        </div>

        <div className="h-[calc(95vh-120px)] overflow-y-auto p-6">
          <div className="space-y-6">
            {/* Status und Priorität */}
            <div className="flex items-center gap-4">
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(trade.status)}`}>
                {getStatusLabel(trade.status)}
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-[#ffbd59]/20 text-[#ffbd59]">
                {trade.priority}
              </span>
            </div>

            {/* Beschreibung */}
            {trade.description && (
              <div className="bg-gradient-to-br from-[#1a1a2e]/50 to-[#2c3539]/50 rounded-xl p-6 border border-gray-600/30">
                <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                  <FileText size={18} className="text-[#ffbd59]" />
           Beschreibung
                </h3>
                <p className="text-gray-300 leading-relaxed">{trade.description}</p>
       </div>
            )}

            {/* Projekt-Informationen */}
            <div className="bg-gradient-to-br from-[#1a1a2e]/50 to-[#2c3539]/50 rounded-xl p-6 border border-gray-600/30">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Building size={18} className="text-[#ffbd59]" />
                Projekt-Informationen
           </h3>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div>
                  <span className="text-sm font-medium text-gray-400">Projektname</span>
                  <p className="text-white">{trade.project_name || 'Nicht angegeben'}</p>
             </div>
             <div>
                  <span className="text-sm font-medium text-gray-400">Projekttyp</span>
                  <p className="text-white">{trade.project_type || 'Nicht angegeben'}</p>
             </div>
             <div>
                  <span className="text-sm font-medium text-gray-400">Projekt-Status</span>
                  <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(trade.project_status)}`}>
                    {getStatusLabel(trade.project_status)}
               </span>
             </div>
                {trade.budget && (
             <div>
                    <span className="text-sm font-medium text-gray-400">Budget</span>
                    <p className="text-white font-bold">{trade.budget.toLocaleString('de-DE')} €</p>
               </div>
             )}
                 </div>
            </div>

            {/* Standort */}
            <div className="bg-gradient-to-br from-[#1a1a2e]/50 to-[#2c3539]/50 rounded-xl p-6 border border-gray-600/30">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <MapPin size={18} className="text-[#ffbd59]" />
                Standort
              </h3>
              <div className="space-y-2">
                <p className="text-white">
                  {trade.address_street || 'Adresse nicht angegeben'}
                </p>
                <p className="text-gray-300">
                  {trade.address_zip} {trade.address_city}
                </p>
                {trade.distance_km && (
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <span>📍 Entfernung: {trade.distance_km.toFixed(1)} km</span>
               </div>
             )}
           </div>
         </div>

            {/* Zeitplan */}
            <div className="bg-gradient-to-br from-[#1a1a2e]/50 to-[#2c3539]/50 rounded-xl p-6 border border-gray-600/30">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Calendar size={18} className="text-[#ffbd59]" />
                Zeitplan
           </h3>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             {trade.planned_date && (
               <div>
                    <span className="text-sm font-medium text-gray-400">Geplantes Datum</span>
                    <p className="text-white">
                   {new Date(trade.planned_date).toLocaleDateString('de-DE')}
                 </p>
               </div>
             )}
             {trade.start_date && (
               <div>
                    <span className="text-sm font-medium text-gray-400">Startdatum</span>
                    <p className="text-white">
                   {new Date(trade.start_date).toLocaleDateString('de-DE')}
                 </p>
               </div>
             )}
             {trade.end_date && (
               <div>
                    <span className="text-sm font-medium text-gray-400">Enddatum</span>
                    <p className="text-white">
                   {new Date(trade.end_date).toLocaleDateString('de-DE')}
                 </p>
               </div>
             )}
             {trade.created_at && (
               <div>
                    <span className="text-sm font-medium text-gray-400">Erstellt am</span>
                    <p className="text-white">
                   {new Date(trade.created_at).toLocaleDateString('de-DE')}
                 </p>
               </div>
             )}
           </div>
         </div>

            {/* Technische Details */}
            {trade.requires_inspection && (
              <div className="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-xl p-6 border border-yellow-500/30">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <CheckCircle size={18} className="text-yellow-400" />
                  Besichtigung
                   </h3>
                <div className="flex items-center gap-2">
                  <CheckCircle size={20} className="text-yellow-400" />
                  <span className="text-yellow-300 font-medium">Vor-Ort-Besichtigung erforderlich</span>
                     </div>
                     </div>
            )}

            {/* Fortschritt */}
            {trade.progress_percentage !== undefined && (
              <div className="bg-gradient-to-br from-[#1a1a2e]/50 to-[#2c3539]/50 rounded-xl p-6 border border-gray-600/30">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Clock size={18} className="text-[#ffbd59]" />
                  Fortschritt
                   </h3>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-gray-400">Fortschritt</span>
                  <span className="text-white font-bold">{trade.progress_percentage}%</span>
                     </div>
                <div className="w-full bg-gray-600/30 rounded-full h-3">
                  <div 
                    className="bg-gradient-to-r from-[#ffbd59] to-[#ffa726] h-3 rounded-full transition-all duration-300 shadow-lg"
                    style={{ width: `${trade.progress_percentage}%` }}
                  ></div>
                   </div>
                 </div>
            )}

            {/* Angebote */}
            {existingQuotes && existingQuotes.length > 0 && (
              <div className="bg-gradient-to-br from-[#1a1a2e]/50 to-[#2c3539]/50 rounded-xl p-6 border border-gray-600/30">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Eye size={18} className="text-[#ffbd59]" />
                  Angebote ({existingQuotes.length})
                    </h3>
                <div className="space-y-3">
                  {existingQuotes.map((quote) => (
                    <div key={quote.id} className="bg-gradient-to-br from-[#1a1a2e]/30 to-[#2c3539]/30 rounded-lg p-4 border border-gray-600/20">
                      <div className="flex items-center justify-between">
                            <div>
                          <p className="text-white font-medium">
                            {quote.status === 'accepted' && quote.contact_released ? 
                              (quote.company_name || quote.service_provider_name || `Angebot #${quote.id}`) :
                              (quote.service_provider_name || `Angebot #${quote.id}`)}
                              </p>
                          <p className="text-gray-400 text-sm">
                                {new Date(quote.created_at).toLocaleDateString('de-DE')}
                              </p>
                          </div>
                          <div className="text-right">
                          <p className="text-white font-bold">
                              {quote.total_amount?.toLocaleString('de-DE') || quote.total_price?.toLocaleString('de-DE') || 'N/A'} €
                            </p>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getQuoteStatusColor(quote.status)}`}>
                              {getQuoteStatusLabel(quote.status)}
                            </span>
                        </div>
                          </div>
                          
                          {/* Kontaktdaten bei akzeptiertem Angebot */}
                          {quote.status === 'accepted' && quote.contact_released && (
                            <div className="mt-4 pt-4 border-t border-gray-600/30">
                              <p className="text-sm text-gray-400 mb-2">Kontaktdaten:</p>
                              <div className="grid grid-cols-2 gap-2 text-sm">
                                {quote.contact_person && (
                                  <div className="flex items-center gap-2">
                                    <User size={14} className="text-gray-400" />
                                    <span className="text-white">{quote.contact_person}</span>
                                  </div>
                                )}
                                {quote.phone && (
                                  <div className="flex items-center gap-2">
                                    <Phone size={14} className="text-gray-400" />
                                    <a href={`tel:${quote.phone}`} className="text-[#ffbd59] hover:underline">{quote.phone}</a>
                                  </div>
                                )}
                                {quote.email && (
                                  <div className="flex items-center gap-2">
                                    <Mail size={14} className="text-gray-400" />
                                    <a href={`mailto:${quote.email}`} className="text-[#ffbd59] hover:underline">{quote.email}</a>
                                  </div>
                                )}
                                {quote.website && (
                                  <div className="flex items-center gap-2">
                                    <Globe size={14} className="text-gray-400" />
                                    <a href={quote.website} target="_blank" rel="noopener noreferrer" className="text-[#ffbd59] hover:underline">Website</a>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

            {/* Dokumente - Einklappbar */}
            <div className="bg-gradient-to-br from-[#1a1a2e]/50 to-[#2c3539]/50 rounded-xl border border-gray-600/30 overflow-hidden">
              <div className="flex items-center justify-between p-6 cursor-pointer hover:bg-[#1a1a2e]/30 transition-all duration-200" onClick={() => setIsExpanded(!isExpanded)}>
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <FileText size={18} className="text-[#ffbd59]" />
                  Dokumente ({documentsLoading ? '...' : (loadedDocuments.length > 0 ? loadedDocuments.length : (trade.documents?.length || 0))})
                  {documentsLoading && (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#ffbd59] ml-2"></div>
                  )}
                  </h3>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-400">
                    {isExpanded ? 'Einklappen' : 'Ausklappen'}
                  </span>
                  <div className={`transform transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
                    <ChevronDown size={20} className="text-[#ffbd59]" />
                     </div>
                  </div>
                </div>

              {isExpanded && (
                <div className="border-t border-gray-600/30">
                  {documentsLoading ? (
                    <div className="p-6 text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#ffbd59] mx-auto mb-3"></div>
                      <p className="text-gray-400">Lade Dokumente...</p>
                    </div>
                  ) : documentsError ? (
                    <div className="p-6 text-center">
                      <div className="text-red-400 mb-3">❌ Fehler beim Laden der Dokumente</div>
                      <p className="text-gray-400 text-sm">{documentsError}</p>
                      <button
                        onClick={() => trade?.id && loadTradeDocuments(trade.id)}
                        className="mt-3 px-4 py-2 bg-[#ffbd59] text-[#1a1a2e] rounded-lg hover:bg-[#ffa726] transition-colors text-sm font-medium"
                      >
                        Erneut versuchen
                      </button>
                    </div>
                  ) : (
                    <TradeDocumentViewer 
                      documents={loadedDocuments.length > 0 ? loadedDocuments : (trade?.documents || [])} 
                      existingQuotes={existingQuotes} 
                    />
                  )}
                  
                  {/* Debug-Informationen für Entwicklung */}
                  {typeof window !== 'undefined' && window.location.hostname === 'localhost' && (
                    <div className="p-4 bg-gray-800 text-xs text-gray-300 border-t border-gray-600">
                      <div className="mb-2">🔍 Debug-Informationen:</div>
                      <div>• Dynamisch geladene Dokumente: {loadedDocuments.length}</div>
                      <div>• Original trade.documents: {trade?.documents?.length || 0}</div>
                      <div>• Dokumente werden geladen: {documentsLoading ? 'Ja' : 'Nein'}</div>
                      <div>• Fehler: {documentsError || 'Keiner'}</div>
                      <div>• Trade ID: {trade?.id}</div>
                      <div>• Modal geöffnet: {isOpen ? 'Ja' : 'Nein'}</div>
                    </div>
                  )}
                  </div>
                )}
                  </div>
            
            {/* Debug-Informationen (temporär) */}
            {process.env.NODE_ENV === 'development' && (
              <div className="bg-red-900/50 rounded-xl p-4 border border-red-600/30 mb-4">
                <h3 className="text-white font-bold mb-2">🐛 Debug Info</h3>
                <div className="text-sm text-gray-300 space-y-1">
                  <div>existingQuotes.length: {existingQuotes?.length || 0}</div>
                  <div>acceptedQuote: {acceptedQuote ? 'JA' : 'NEIN'}</div>
                  <div>acceptedQuote.status: {acceptedQuote?.status || 'N/A'}</div>
                  <div>completionStatus: {completionStatus}</div>
                  <div>currentProgress: {currentProgress}%</div>
                  <div>isBautraeger: {isBautraeger() ? 'JA' : 'NEIN'}</div>
                  <div>user?.id: {user?.id}</div>
                  <div>Quotes: {JSON.stringify(existingQuotes?.map(q => ({ id: q.id, status: q.status })), null, 2)}</div>
                </div>
              </div>
            )}

            {/* Baufortschritt & Kommunikation */}
            {(
              // Für Bauträger: Immer anzeigen (können jederzeit kommentieren)
              isBautraeger() ||
              // Für Dienstleister: Nur wenn sie ein Angebot haben
              (acceptedQuote || existingQuotes?.length > 0)
            ) && (
              <TradeProgress
                milestoneId={trade.id}
                currentProgress={currentProgress}
                onProgressChange={handleProgressChange}
                isBautraeger={isBautraeger()}
                isServiceProvider={!isBautraeger() && (acceptedQuote?.service_provider_id === user?.id || existingQuotes?.some(q => q.service_provider_id === user?.id))}
                completionStatus={completionStatus}
                onCompletionRequest={handleCompletionRequest}
                onCompletionResponse={handleCompletionResponse}
              />
            )}
            
            {/* Rechnungsstellung - nur für Dienstleister nach Abnahme */}
            {!isBautraeger() && acceptedQuote?.service_provider_id === user?.id && completionStatus === 'completed' && (
              <InvoiceUpload
                milestoneId={trade.id}
                onInvoiceUploaded={handleInvoiceUploaded}
              />
            )}
            
            {/* Rechnungsanzeige für Bauträger */}
            {isBautraeger() && completionStatus === 'completed' && trade?.invoice_generated && (
              <div className="bg-gradient-to-br from-[#1a1a2e]/50 to-[#2c3539]/50 rounded-xl p-6 border border-gray-600/30">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Receipt size={18} className="text-[#ffbd59]" />
                  Rechnung
                </h3>
                {!hasRated ? (
                  <div className="text-center">
                    <p className="text-gray-400 mb-4">
                      Bitte bewerten Sie zuerst den Dienstleister, um die Rechnung einzusehen.
                    </p>
                    <button
                      onClick={() => setShowRatingModal(true)}
                      className="px-6 py-3 bg-gradient-to-r from-[#ffbd59] to-[#ffa726] text-[#1a1a2e] font-semibold rounded-lg hover:shadow-lg transition-all duration-200"
                    >
                      <Star size={20} className="inline mr-2" />
                      Dienstleister bewerten
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Betrag:</span>
                      <span className="text-white font-bold">{trade?.invoice_amount?.toLocaleString('de-DE')} €</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Fällig bis:</span>
                      <span className="text-white">{trade?.invoice_due_date ? new Date(trade.invoice_due_date).toLocaleDateString('de-DE') : '-'}</span>
                    </div>
                    <a
                      href={trade?.invoice_pdf_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block w-full px-6 py-3 bg-gradient-to-r from-[#ffbd59] to-[#ffa726] text-[#1a1a2e] font-semibold rounded-lg hover:shadow-lg transition-all duration-200 text-center"
                    >
                      <Download size={20} className="inline mr-2" />
                      Rechnung herunterladen
                    </a>
                  </div>
                )}
              </div>
            )}

            {/* Dienstleister-spezifische Aktionen */}
            {!isBautraeger() && !acceptedQuote && (
              <div className="bg-gradient-to-br from-[#1a1a2e]/50 to-[#2c3539]/50 rounded-xl p-6 border border-gray-600/30">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Calculator size={18} className="text-[#ffbd59]" />
                  Aktionen
                </h3>
                      <button
                  onClick={() => onCreateQuote(trade)}
                  className="w-full bg-gradient-to-r from-[#ffbd59] to-[#ffa726] text-[#1a1a2e] font-semibold py-3 px-6 rounded-lg hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2"
                      >
                  <Calculator size={20} />
                        Angebot abgeben
                      </button>
                    </div>
                  )}
                </div>
              </div>
      </div>
      
      {/* Bewertungs-Modal */}
      {showRatingModal && acceptedQuote && (
        <ServiceProviderRating
          isOpen={showRatingModal}
          onClose={() => setShowRatingModal(false)}
          serviceProviderId={acceptedQuote?.service_provider_id || 0}
          projectId={trade?.project_id || 0}
          milestoneId={trade?.id || 0}
          quoteId={acceptedQuote?.id}
          onRatingComplete={handleRatingComplete}
        />
      )}
    </div>
  );
} 