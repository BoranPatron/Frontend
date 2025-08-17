import React, { useState, useEffect } from 'react';
import { 
  X, 
  Eye, 
  Download, 
  ExternalLink, 
  FileText, 
  ChevronDown,
  Calendar,
  MapPin,
  CheckCircle,
  Clock,
  Star,
  Building,
  Calculator,
  Receipt,
  AlertTriangle,
  Settings,
  RefreshCw,
  CheckSquare,
  Square,
  Info,
  StickyNote,
  CreditCard,
  Shield,
  User,
  Phone,
  Mail,
  Globe,
  Package
} from 'lucide-react';
import type { TradeSearchResult } from '../api/geoService';
import { useAuth } from '../context/AuthContext';
import { getAuthenticatedFileUrl, getApiBaseUrl, apiCall } from '../api/api';
import TradeProgress from './TradeProgress';
import QuoteDetailsModal from './QuoteDetailsModal';
import { appointmentService, type AppointmentResponse } from '../api/appointmentService';
import ServiceProviderRating from './ServiceProviderRating';
import InvoiceModal from './InvoiceModal';
import FinalAcceptanceModal from './FinalAcceptanceModal';
// import FullDocumentViewer from './DocumentViewer';
import { updateMilestone } from '../api/milestoneService';

// PDF Viewer Komponente
const PDFViewer: React.FC<{ url: string; filename: string; onError: (error: string) => void }> = ({ url, filename, onError }) => {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadPDF = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        onError('Kein Authentifizierungstoken verfÃ¼gbar');
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
      console.error('âŒ Fehler beim Laden des PDFs:', error);
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
  project?: any;
  isOpen: boolean;
  onClose: () => void;
  onCreateQuote: (trade: TradeSearchResult) => void;
  existingQuotes?: Quote[];
  onCreateInspection?: (tradeId: number, selectedQuoteIds: number[]) => void;
  onAcceptQuote?: (quoteId: number) => void;
  onRejectQuote?: (quoteId: number, reason: string) => void;
}

interface Quote {
  id: number;
  service_provider_id: number;
  status: string;
  total_price?: number;
  total_amount?: number;
  created_at: string;
  updated_at?: string;
  service_provider_name?: string;
  contact_released?: boolean;
  company_name?: string;
  contact_person?: string;
  phone?: string;
  email?: string;
  website?: string;
  currency?: string;
  labor_cost?: number | string;
  material_cost?: number | string;
  overhead_cost?: number | string;
  title?: string;
  description?: string;
  valid_until?: string;
  start_date?: string;
  completion_date?: string;
  estimated_duration?: number;
  payment_terms?: string;
  warranty_months?: number;
  profit_margin?: number;
  notes?: string;
  documents?: Array<{
    id: number;
    title?: string;
    name?: string;
    file_name?: string;
    url?: string;
    file_path?: string;
    type?: string;
    mime_type?: string;
    size?: number;
    uploaded_at?: string;
  }>;
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

  console.log('ðŸ” TradeDocumentViewer - Debug:', {
    documents,
    documentsLength: documents?.length,
    documentsType: typeof documents,
    documentsIsArray: Array.isArray(documents),
    documentsFirstItem: documents?.[0],
    isBautraeger: isBautraeger(),
    existingQuotes,
    documentsFull: documents,
    // ZusÃ¤tzliche Debug-Informationen
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

  console.log('ðŸ” TradeDocumentViewer - Nach safeDocuments:', {
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
                ? 'Keine Dokumente fÃ¼r dieses Gewerk vorhanden' 
                : 'Keine Dokumente fÃ¼r dieses Gewerk freigegeben'
              }
            </p>
            <p className="text-gray-500 text-xs mt-1">
              {isBautraeger() 
                ? 'Dokumente kÃ¶nnen Ã¼ber die Projektverwaltung hinzugefÃ¼gt werden' 
                : 'Dokumente werden nach Angebotsannahme verfÃ¼gbar'
              }
            </p>
          </div>
        </div>
      </div>
    );
  }

  const getFileIcon = (doc: any) => {
    const type = doc.type || doc.mime_type || '';
    if (type && type.includes('pdf')) return 'ðŸ“„';
    if (type && (type.includes('word') || type.includes('document'))) return 'ðŸ“';
    if (type && (type.includes('presentation') || type.includes('powerpoint'))) return 'ðŸ“Š';
    return 'ðŸ“';
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
                            setViewerError('Kein Authentifizierungstoken verfÃ¼gbar');
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
                      {selectedDoc === String(doc.id) ? 'SchlieÃŸen' : 'Ansehen'}
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
                          alert('Kein Authentifizierungstoken verfÃ¼gbar');
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
                        console.error('âŒ Fehler beim Ã–ffnen des Dokuments:', error);
                        alert('Dokument konnte nicht geÃ¶ffnet werden');
                      }
                    }}
                  className="flex items-center gap-1 px-3 py-2 bg-blue-600/20 text-blue-400 rounded-lg hover:bg-blue-600/30 transition-all duration-200 text-sm font-medium"
                  title="In neuem Tab Ã¶ffnen"
                >
                  <ExternalLink size={14} />
                  Ã–ffnen
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
                          console.error(`âŒ PDF Viewer Fehler:`, error);
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

  // Hilfsfunktion fÃ¼r Projekttyp-Labels
  const getProjectTypeLabel = (type: string) => {
    switch (type) {
      case 'new_build': return 'Neubau';
      case 'renovation': return 'Renovierung';
      case 'extension': return 'Erweiterung';
      case 'modernization': return 'Modernisierung';
      case 'maintenance': return 'Wartung';
      default: return type;
    }
  };

   export default function TradeDetailsModal({ 
  trade, 
  project,
  isOpen, 
  onClose, 
  onCreateQuote, 
  existingQuotes = [],
  onCreateInspection,
  onAcceptQuote,
  onRejectQuote
}: TradeDetailsModalProps) {
  

  const { user, isBautraeger } = useAuth();
  // const [loading, setLoading] = useState(false);
  // const [userHasQuote, setUserHasQuote] = useState(false);
  // const [userQuote, setUserQuote] = useState<Quote | null>(null);
  // const [showCostEstimateForm, setShowCostEstimateForm] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedQuoteIds, setSelectedQuoteIds] = useState<number[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<{ title: string; description: string; category?: string; priority?: string; planned_date?: string; notes?: string; requires_inspection?: boolean }>({ title: '', description: '' });
  const [isUpdatingTrade, setIsUpdatingTrade] = useState(false);
  
  // Neue States fÃ¼r dynamisches Laden der Dokumente
  const [loadedDocuments, setLoadedDocuments] = useState<any[]>([]);
  const [documentsLoading, setDocumentsLoading] = useState(false);
  const [documentsError, setDocumentsError] = useState<string | null>(null);
  const [showQuoteDetails, setShowQuoteDetails] = useState(false);
  const [quoteForDetails, setQuoteForDetails] = useState<Quote | null>(null);
  const [appointmentsForTrade, setAppointmentsForTrade] = useState<AppointmentResponse[]>([]);
  const [showAcceptConfirm, setShowAcceptConfirm] = useState(false);
  const [quoteIdToAccept, setQuoteIdToAccept] = useState<number | null>(null);
  const [acceptAcknowledged, setAcceptAcknowledged] = useState(false);
  
  // States fÃ¼r neue Features
  const [currentProgress, setCurrentProgress] = useState(trade?.progress_percentage || 0);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [hasRated, setHasRated] = useState(false);
      const [acceptedQuote, setAcceptedQuote] = useState<Quote | null>(null);
    const [completionStatus, setCompletionStatus] = useState(trade?.completion_status || 'in_progress');
      const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [existingInvoice, setExistingInvoice] = useState<any>(null);
  
  // State für das Angebot des aktuellen Dienstleisters
  const [userQuote, setUserQuote] = useState<Quote | null>(null);
  const [userQuoteLoading, setUserQuoteLoading] = useState(false);
  const [showMyQuoteDetails, setShowMyQuoteDetails] = useState(false);
  
  // States für Annehmen/Ablehnen
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectingQuoteId, setRejectingQuoteId] = useState<number | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  
  // States für Abnahme-Workflow
  const [showFinalAcceptanceModal, setShowFinalAcceptanceModal] = useState(false);
  const [acceptanceDefects, setAcceptanceDefects] = useState<any[]>([]);

  // Handler für Angebot annehmen
  const handleAcceptQuote = async (quoteId: number) => {
    try {
      await onAcceptQuote?.(quoteId);
      console.log('✅ Angebot angenommen:', quoteId);
    } catch (error) {
      console.error('❌ Fehler beim Annehmen des Angebots:', error);
    }
  };

  // Handler für Angebot ablehnen
  const handleRejectQuote = async (quoteId: number, reason: string) => {
    try {
      await onRejectQuote?.(quoteId, reason);
      setShowRejectModal(false);
      setRejectingQuoteId(null);
      setRejectionReason('');
      console.log('✅ Angebot abgelehnt:', quoteId, 'Grund:', reason);
    } catch (error) {
      console.error('❌ Fehler beim Ablehnen des Angebots:', error);
    }
  };

  // Hilfsfunktion: Prüft ob ein Quote dem aktuellen User gehört
  const isUserQuote = (quote: Quote, user: any): boolean => {
    if (!quote || !user) return false;
    
    console.log('🔍 isUserQuote Vergleich:', {
      quoteServiceProviderId: quote.service_provider_id,
      quoteServiceProviderIdType: typeof quote.service_provider_id,
      userId: user.id,
      userIdType: typeof user.id,
      directMatch: quote.service_provider_id === user.id,
      looseMatch: quote.service_provider_id == user.id,
      stringMatch: String(quote.service_provider_id) === String(user.id)
    });
    
    // Robuste ID-Vergleiche (number vs string handling)
    const isMatch = quote.service_provider_id === user.id || 
                   quote.service_provider_id == user.id ||
                   String(quote.service_provider_id) === String(user.id) ||
                   Number(quote.service_provider_id) === Number(user.id);
    
    if (isMatch) {
      console.log('✅ Quote-User-Match gefunden über ID-Vergleich!');
    } else {
      console.log('❌ Kein Quote-User-Match über ID-Vergleich');
    }
    
    return isMatch;
  };
  const [fullTradeData, setFullTradeData] = useState<any>(null);
  const [showTradeDetails, setShowTradeDetails] = useState(false);

      // KRITISCH: Verwende NUR den Backend-Status, NICHT das trade Objekt
  // useEffect(() => {
  //   if (trade?.completion_status) {
  //     setCompletionStatus(trade.completion_status);
  //     console.log('ðŸ”„ TradeDetailsModal - Completion Status aktualisiert:', trade.completion_status);
  //   }
  // }, [trade?.completion_status]);

  // Debug-Log nur wenn Modal geÃ¶ffnet ist oder sich der Status Ã¤ndert
  if (isOpen || trade?.id) {
    console.log('ðŸ” TradeDetailsModal - Hauptkomponente gerendert:', {
      isOpen,
      tradeId: trade?.id,
      tradeTitle: trade?.title,
      tradeDescription: trade?.description,
      completionStatus: completionStatus,
      tradeCompletionStatus: trade?.completion_status,
      existingInvoice: existingInvoice,
      isBautraeger: isBautraeger(),
      existingQuotes: existingQuotes,
      shouldShowInvoiceButton: !isBautraeger() && completionStatus === 'completed' && !existingInvoice
    });
    
    // Warnung wenn trade-ID 1 ist (kÃ¶nnte falsches Gewerk sein)
    if (trade?.id === 1 && trade?.title === 'Elektroinstallation EG') {
      console.warn('âš ï¸ WARNUNG: TradeDetailsModal verwendet Milestone ID 1 ("Elektroinstallation EG"). Falls dies ein neues Gewerk sein sollte, kÃ¶nnte es ein Problem mit der Milestone-Erstellung geben.');
    }
  }

  // Lade vollstÃ¤ndige Trade-Daten und Termine fÃ¼r dieses Gewerk, wenn Modal geÃ¶ffnet
  useEffect(() => {
    let cancelled = false;
    
    const loadFullTradeData = async () => {
      try {
        if (!trade?.id) return;
        
        const token = localStorage.getItem('token');
        if (!token) return;
        
        const baseUrl = window.location.hostname === 'localhost' 
          ? 'http://localhost:8000/api/v1' 
          : '/api/v1';
        
        console.log('ðŸ” TradeDetailsModal - Lade vollstÃ¤ndige Trade-Daten fÃ¼r ID:', trade.id);
        
        const response = await fetch(`${baseUrl}/milestones/${trade.id}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          const fullData = await response.json();
          console.log('âœ… TradeDetailsModal - VollstÃ¤ndige Trade-Daten geladen:', fullData);
          if (!cancelled) setFullTradeData(fullData);
        } else {
          console.error('âŒ Fehler beim Laden der vollstÃ¤ndigen Trade-Daten:', response.status);
        }
      } catch (e) {
        console.error('âŒ Fehler beim Laden der vollstÃ¤ndigen Trade-Daten:', e);
      }
    };
    
    const loadAppointments = async () => {
      try {
        if (!trade?.id) return;
        const all = await appointmentService.getMyAppointments();
        const relevant = all.filter(a => a.milestone_id === (trade as any).id && a.appointment_type === 'INSPECTION');
        if (!cancelled) setAppointmentsForTrade(relevant);
      } catch (e) {
        console.error('âŒ Termine laden fehlgeschlagen:', e);
      }
    };
    
    if (isOpen) {
      loadFullTradeData();
      loadAppointments();
    }
    return () => { cancelled = true; };
  }, [isOpen, trade?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Hilfsfunktion: Ist aktueller Nutzer (Dienstleister) zur Besichtigung eingeladen?
  const isUserInvitedForInspection = React.useMemo(() => {
    if (!user || isBautraeger()) return false;
    return Array.isArray(appointmentsForTrade) && appointmentsForTrade.some(ap => {
      const invited = Array.isArray(ap.invited_service_providers) ? ap.invited_service_providers : [];
      const responsesArr = Array.isArray(ap.responses) ? ap.responses : (Array.isArray((ap as any).responses_array) ? (ap as any).responses_array : []);
      const inInvites = invited.some((sp: any) => Number(sp.id) === Number(user.id));
      const inResponses = responsesArr.some((r: any) => Number(r.service_provider_id) === Number(user.id));
      return inInvites || inResponses;
    });
  }, [appointmentsForTrade, user, isBautraeger]);

  // Funktion zum dynamischen Laden der Dokumente und completion_status
  const loadTradeDocuments = async (tradeId: number) => {
    // Verhindere doppelte Aufrufe für dieselbe tradeId
    if (lastLoadedTradeIdRef.current === tradeId) {
      console.log('ðŸ"„ TradeDetailsModal - Dokumente bereits geladen für Trade:', tradeId);
      return;
    }
    lastLoadedTradeIdRef.current = tradeId;
    if (!tradeId) return;
    
    setDocumentsLoading(true);
    setDocumentsError(null);
    
    try {
      console.log('ðŸ” TradeDetailsModal - Lade Dokumente und completion_status fÃ¼r Trade:', tradeId);
      
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Kein Authentifizierungstoken verfÃ¼gbar');
      }
      
      const baseUrl = getApiBaseUrl();
      
      // FÃ¼r BautrÃ¤ger: Lade direkt vom Milestone-Endpoint
      // FÃ¼r Dienstleister: Verwende die Geo-Suche (wie bisher)
      if (isBautraeger()) {
        console.log('ðŸ—ï¸ BautrÃ¤ger-Modus: Lade Dokumente direkt vom Milestone-Endpoint');
        
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
        console.log('âœ… TradeDetailsModal - Milestone-Daten geladen:', milestoneData);
        
        // KRITISCH: Aktualisiere completion_status vom Backend
        if (milestoneData.completion_status) {
          console.log('ðŸ”„ TradeDetailsModal - Aktualisiere completion_status vom Backend:', milestoneData.completion_status);
          setCompletionStatus(milestoneData.completion_status);
        }
        
        // Extrahiere und verarbeite die Dokumente
        let documents = [];
        if (milestoneData.documents) {
          if (Array.isArray(milestoneData.documents)) {
            documents = milestoneData.documents;
          } else if (typeof milestoneData.documents === 'string') {
            try {
              documents = JSON.parse(milestoneData.documents);
            } catch (e) {
              console.error('âŒ Fehler beim Parsen der Dokumente:', e);
              documents = [];
            }
          }
        }
        
        // ZusÃ¤tzlich: Lade geteilte Dokumente falls vorhanden
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
                  console.error(`âŒ Fehler beim Laden des geteilten Dokuments ${docId}:`, e);
                  return null;
                }
              });
              
              const sharedDocs = await Promise.all(sharedDocsPromises);
              const validSharedDocs = sharedDocs.filter(doc => doc !== null);
              
              console.log('ðŸ“„ TradeDetailsModal - Geteilte Dokumente geladen:', validSharedDocs);
              documents = [...documents, ...validSharedDocs];
            }
          } catch (e) {
            console.error('âŒ Fehler beim Verarbeiten der geteilten Dokumente:', e);
          }
        }
        
        console.log('ðŸ“„ TradeDetailsModal - Finale Dokumentenliste (BautrÃ¤ger):', documents);
        setLoadedDocuments(documents);
        
      } else {
        // Dienstleister-Modus: Verwende die Geo-Suche (wie bisher)
        console.log('ðŸ”§ Dienstleister-Modus: Verwende Geo-Suche fÃ¼r Dokumente');
        
        // Lade das vollstÃ¤ndige Milestone mit Dokumenten vom Backend
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
        console.log('âœ… TradeDetailsModal - Milestone-Daten geladen:', milestoneData);
        console.log('ðŸ” TradeDetailsModal - completion_status im Response (Dienstleister):', milestoneData.completion_status);
        
        // KRITISCH: Aktualisiere completion_status vom Backend
        if (milestoneData.completion_status) {
          console.log('ðŸ”„ TradeDetailsModal - Aktualisiere completion_status vom Backend (Dienstleister):', milestoneData.completion_status);
          setCompletionStatus(milestoneData.completion_status);
        } else {
          console.log('âš ï¸ TradeDetailsModal - Kein completion_status im Backend-Response gefunden (Dienstleister)');
        }
        
        // Extrahiere und verarbeite die Dokumente
        let documents = [];
        if (milestoneData.documents) {
          if (Array.isArray(milestoneData.documents)) {
            documents = milestoneData.documents;
          } else if (typeof milestoneData.documents === 'string') {
            try {
              documents = JSON.parse(milestoneData.documents);
            } catch (e) {
              console.error('âŒ Fehler beim Parsen der Dokumente:', e);
              documents = [];
            }
          }
        }
        
        // ZusÃ¤tzlich: Lade geteilte Dokumente falls vorhanden
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
                  console.error(`âŒ Fehler beim Laden des geteilten Dokuments ${docId}:`, e);
                  return null;
                }
              });
              
              const sharedDocs = await Promise.all(sharedDocsPromises);
              const validSharedDocs = sharedDocs.filter(doc => doc !== null);
              
              console.log('ðŸ“„ TradeDetailsModal - Geteilte Dokumente geladen:', validSharedDocs);
              documents = [...documents, ...validSharedDocs];
            }
          } catch (e) {
            console.error('âŒ Fehler beim Verarbeiten der geteilten Dokumente:', e);
          }
        }
        
        console.log('ðŸ“„ TradeDetailsModal - Finale Dokumentenliste (Dienstleister):', documents);
        setLoadedDocuments(documents);
      }
      
    } catch (error) {
      console.error('âŒ TradeDetailsModal - Fehler beim Laden der Dokumente:', error);
      setDocumentsError(error instanceof Error ? error.message : 'Unbekannter Fehler');
      
      // Fallback: Verwende die ursprÃ¼nglichen trade.documents falls vorhanden
      if (trade?.documents && Array.isArray(trade.documents)) {
        console.log('ðŸ”„ TradeDetailsModal - Verwende Fallback auf trade.documents:', trade.documents);
        setLoadedDocuments(trade.documents);
      } else {
        setLoadedDocuments([]);
      }
    } finally {
      setDocumentsLoading(false);
    }
  };

  // ZusÃ¤tzliche Debug-Logs fÃ¼r Dokumente
  useEffect(() => {
    if (trade?.documents) {
      console.log('ðŸ“„ TradeDetailsModal - Dokumente gefunden:', {
        documents: trade.documents,
        documentsLength: trade.documents.length,
        documentsType: typeof trade.documents,
        documentsIsArray: Array.isArray(trade.documents),
        firstDocument: trade.documents[0],
        allDocuments: trade.documents
      });
    } else {
      console.log('âš ï¸ TradeDetailsModal - Keine Dokumente gefunden');
    }
  }, [trade?.documents]);

  // Lade Dokumente und completion_status wenn Modal geÃ¶ffnet wird
  useEffect(() => {
    if (isOpen && trade?.id) {
      console.log('ðŸ” TradeDetailsModal - Modal geÃ¶ffnet, lade Dokumente fÃ¼r Trade:', trade.id);
      loadTradeDocuments(trade.id);
      // ZusÃ¤tzlich: Lade completion_status explizit vom Backend
      loadCompletionStatus(trade.id);
    }
  }, [isOpen, trade?.id]);

  // Verwende useRef um doppelte API-Aufrufe zu vermeiden
  const lastLoadedTradeIdRef = React.useRef<number | null>(null);

  // Funktion zum Laden des completion_status vom Backend
  const loadCompletionStatus = async (tradeId: number) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      
      const baseUrl = getApiBaseUrl();
      const response = await fetch(`${baseUrl}/milestones/${tradeId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const milestoneData = await response.json();
        console.log('ðŸ” TradeDetailsModal - Milestone-Daten fÃ¼r completion_status:', milestoneData);
        
        if (milestoneData.completion_status) {
          console.log('ðŸ”„ TradeDetailsModal - Setze completion_status vom Backend:', milestoneData.completion_status);
          setCompletionStatus(milestoneData.completion_status);
        }
      }
    } catch (error) {
      console.error('âŒ TradeDetailsModal - Fehler beim Laden des completion_status:', error);
    }
  };

  // Fallback: Setze ursprÃ¼ngliche Dokumente falls vorhanden und noch keine geladen wurden
  // Entfernt: Dieser useEffect verursachte endlose Re-Renders
  // useEffect(() => {
  //   if (isOpen && trade?.documents && Array.isArray(trade.documents) && loadedDocuments.length === 0 && !documentsLoading) {
  //     console.log('ðŸ"„ TradeDetailsModal - Setze ursprÃ¼ngliche trade.documents als Fallback:', trade.documents);
  //     setLoadedDocuments(trade.documents);
  //   }
  // }, [isOpen, trade?.documents, loadedDocuments.length, documentsLoading]);

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
      console.log('ðŸ” Debug existingQuotes:', existingQuotes);
      const accepted = existingQuotes.find(q => q.status === 'accepted');
      console.log('ðŸ” Debug accepted quote:', accepted);
      if (accepted) {
        setAcceptedQuote(accepted);
      } else {
        // Fallback: Auch nach anderen mÃ¶glichen Status-Werten suchen
        const acceptedFallback = existingQuotes.find(q => 
          q.status === 'angenommen' || 
          q.status === 'ACCEPTED' || 
          q.status === 'Angenommen'
        );
        console.log('ðŸ” Debug accepted fallback:', acceptedFallback);
        if (acceptedFallback) {
          setAcceptedQuote(acceptedFallback);
        }
      }
    }
  }, [existingQuotes]);

  // KRITISCH: Verwende NUR den Backend-Status, nicht das trade Objekt
  // useEffect(() => {
  //   if (trade && completionStatus === 'in_progress') {
  //     console.log('ðŸ”„ TradeDetailsModal - Setze completion_status vom trade Objekt als initialer Fallback:', trade.completion_status);
  //     setCompletionStatus(trade.completion_status || 'in_progress');
  //     setCurrentProgress(trade.progress_percentage || 0);
  //   }
  // }, [trade, completionStatus]);

    // Lade bestehende Rechnung
    const loadExistingInvoice = async () => {
      if (!trade?.id) return;
      
      try {
        const { api } = await import('../api/api');
        const response = await api.get(`/invoices/milestone/${trade.id}`);
        
        if (response.data) {
          setExistingInvoice(response.data);
          console.log('âœ… Bestehende Rechnung geladen:', response.data);
        }
      } catch (error: any) {
        if (error.response?.status !== 404) {
          console.error('âŒ Fehler beim Laden der bestehenden Rechnung:', error);
        }
        // 404 ist OK - bedeutet nur dass noch keine Rechnung existiert
        setExistingInvoice(null);
      }
    };

    // Lade bestehende Rechnung wenn Modal geÃ¶ffnet wird
    useEffect(() => {
      if (isOpen && trade?.id && (completionStatus === 'completed' || completionStatus === 'completed_with_defects')) {
        loadExistingInvoice();
      }
    }, [isOpen, trade?.id, completionStatus]);

    // Lade das Angebot des aktuellen Dienstleisters aus existingQuotes
    useEffect(() => {
      if (isOpen && !isBautraeger() && user?.id && existingQuotes) {
        setUserQuoteLoading(true);
        
        console.log('🔍 DEBUG: Suche nach Benutzer-Quote', {
          userId: user.id,
          userIdType: typeof user.id,
          userObject: user,
          existingQuotesLength: existingQuotes.length,
          existingQuotes: existingQuotes.map(q => ({
            id: q.id,
            service_provider_id: q.service_provider_id,
            service_provider_id_type: typeof q.service_provider_id,
            status: q.status,
            title: q.title
          }))
        });
        
        // ERWEITERTE DEBUG-INFO
        console.log('🔍 ERWEITERTE DEBUG-INFO:', {
          'user.id': user.id,
          'user.id type': typeof user.id,
          'user.email': user.email,
          'user.first_name': user.first_name,
          'user.last_name': user.last_name,
          'user.user_role': user.user_role,
          'user.company_name': user.company_name,
          'user.id === 12': user.id === 12,
          'user.id == 12': user.id == 12,
          'String(user.id) === "12"': String(user.id) === "12",
          'Number(user.id) === 12': Number(user.id) === 12,
          'alle user properties': Object.keys(user),
          'user vollständig': user
        });
        
        // Suche das Quote des aktuellen Benutzers in den existingQuotes
        // Verwende die erweiterte isUserQuote Funktion für robuste Erkennung
        const foundUserQuote = existingQuotes.find(q => isUserQuote(q, user));
        
        if (foundUserQuote) {
          setUserQuote(foundUserQuote);
          console.log('🔍 Benutzer-Quote aus existingQuotes gefunden:', foundUserQuote);
        } else {
          setUserQuote(null);
          console.log('ℹ️ Kein Angebot für aktuellen Benutzer in existingQuotes gefunden');
        }
        
        setUserQuoteLoading(false);
      }
    }, [isOpen, user?.id, existingQuotes, isBautraeger]);

    const getCategoryIcon = (category: string) => {
    const iconMap: { [key: string]: { color: string; icon: React.ReactNode } } = {
      'electrical': { color: '#fbbf24', icon: <span className="text-lg">âš¡</span> },
      'plumbing': { color: '#3b82f6', icon: <span className="text-lg">ðŸ”§</span> },
      'heating': { color: '#ef4444', icon: <span className="text-lg">ðŸ”¥</span> },
      'roofing': { color: '#f97316', icon: <span className="text-lg">ðŸ </span> },
      'windows': { color: '#10b981', icon: <span className="text-lg">ðŸªŸ</span> },
      'flooring': { color: '#8b5cf6', icon: <span className="text-lg">ðŸ“</span> },
      'walls': { color: '#ec4899', icon: <span className="text-lg">ðŸ§±</span> },
      'foundation': { color: '#6b7280', icon: <span className="text-lg">ðŸ—ï¸</span> },
      'landscaping': { color: '#22c55e', icon: <span className="text-lg">ðŸŒ±</span> }
    };
    
    return iconMap[category] || { color: '#6b7280', icon: <span className="text-lg">ðŸ”§</span> };
  };

  // Handler für finale Abnahme
  const loadAcceptanceDefects = async () => {
    if (!trade?.id) return;
    
    try {
      const { api } = await import('../api/api');
      const response = await api.get(`/acceptance/milestone/${trade.id}/defects`);
      setAcceptanceDefects(response.data || []);
      console.log('✅ Abnahme-Mängel geladen:', response.data);
    } catch (error) {
      console.error('❌ Fehler beim Laden der Abnahme-Mängel:', error);
      setAcceptanceDefects([]);
    }
  };

  const handleStartFinalAcceptance = async () => {
    console.log('🏁 Starte finale Abnahme für Milestone:', trade?.id);
    
    // Lade Mängel
    await loadAcceptanceDefects();
    
    // Öffne FinalAcceptanceModal
    setShowFinalAcceptanceModal(true);
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
      case 'delayed': return 'VerzÃ¶gert';
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

  const getCompletionStatusColor = (status: string) => {
    switch (status) {
      case 'in_progress': return 'text-blue-400';
      case 'completion_requested': return 'text-yellow-400';
      case 'under_review': return 'text-orange-400';
      case 'completed': return 'text-green-400';
      case 'archived': return 'text-gray-400';
      default: return 'text-gray-400';
    }
  };

  const getCompletionStatusLabel = (status: string) => {
    switch (status) {
      case 'in_progress': return 'In Bearbeitung';
      case 'completion_requested': return 'Abnahme angefordert';
      case 'under_review': return 'Nachbesserung';
      case 'completed': return 'Abgenommen';
      case 'archived': return 'Archiviert';
      default: return status;
    }
  };

  const getCompletionStatusIcon = (status: string) => {
    switch (status) {
      case 'in_progress': return <Clock size={16} />;
      case 'completion_requested': return <AlertTriangle size={16} />;
      case 'under_review': return <AlertTriangle size={16} />;
      case 'completed': return <CheckCircle size={16} />;
      case 'archived': return <CheckCircle size={16} />;
      default: return <Clock size={16} />;
    }
  };

  // Handler fÃ¼r Baufortschritt
  const handleProgressChange = async (newProgress: number) => {
    setCurrentProgress(newProgress);
    // Optional: API call to update progress
  };

  const handleCompletionRequest = async () => {
    try {
      console.log('ðŸ” TradeDetailsModal - Sende Abnahme-Anfrage fÃ¼r Trade:', trade?.id);
      
      const response = await apiCall(`/milestones/${trade?.id}/progress/completion`, {
        method: 'POST',
        body: JSON.stringify({
          message: 'Gewerk fertiggestellt. Bitte um Abnahme.',
          update_type: 'completion'
        })
      });
      
      console.log('âœ… TradeDetailsModal - Abnahme-Anfrage erfolgreich:', response);
      setCompletionStatus('completion_requested');
      
      // Aktualisiere auch den Fortschritt
      if (trade?.id) {
        loadTradeDocuments(trade.id);
      }
    } catch (error) {
      console.error('âŒ TradeDetailsModal - Fehler bei Fertigstellungsmeldung:', error);
      alert('Fehler beim Anfordern der Abnahme. Bitte versuchen Sie es erneut.');
    }
  };

  const handleCompletionResponse = async (accepted: boolean, message?: string, deadline?: string) => {
    try {
      console.log('ðŸ” TradeDetailsModal - Sende Abnahme-Antwort fÃ¼r Trade:', trade?.id, {
        accepted,
        message,
        deadline
      });
      
      const response = await apiCall(`/milestones/${trade?.id}/progress/completion/response`, {
        method: 'POST',
        body: JSON.stringify({
          accepted,
          message: message || (accepted ? 'Gewerk abgenommen.' : 'Nachbesserung erforderlich.'),
          revision_deadline: deadline
        })
      });
      
      console.log('âœ… TradeDetailsModal - Abnahme-Antwort erfolgreich:', response);
      setCompletionStatus(accepted ? 'completed' : 'under_review');
      
      // Aktualisiere auch den Fortschritt
      if (trade?.id) {
        loadTradeDocuments(trade.id);
      }
    } catch (error) {
      console.error('âŒ TradeDetailsModal - Fehler bei Abnahme-Antwort:', error);
      alert('Fehler beim Verarbeiten der Abnahme-Antwort. Bitte versuchen Sie es erneut.');
    }
  };

  // Entfernt: handleInvoiceUploaded da nicht verwendet

  const handleRatingComplete = () => {
    setHasRated(true);
    setShowRatingModal(false);
  };

  if (!isOpen || !trade) return null;

  // Debug-Logging
  console.log('ðŸ” TradeDetailsModal RENDERING:', {
    isOpen,
    tradeId: trade?.id,
    tradeTitle: trade?.title,
    userId: user?.id,
    userRole: user?.user_role,
    isBautraeger: isBautraeger(),
    appointmentsCount: appointmentsForTrade.length
  });

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-[#1a1a2e] to-[#2c3539] rounded-2xl shadow-2xl border border-gray-600/30 max-w-6xl w-full max-h-[95vh] overflow-hidden relative flex flex-col">
        {/* DEBUG HINWEIS */}
        <div className="absolute top-2 right-2 bg-red-500/90 text-white px-3 py-1 rounded-lg text-sm font-bold z-50 shadow-lg">
          🔍 DEBUG: TradeDetailsModal
        </div>
        
        <div className="flex items-center justify-between p-6 border-b border-gray-600/30 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-[#ffbd59] to-[#ffa726] rounded-xl flex items-center justify-center text-white font-bold shadow-lg">
              {getCategoryIcon(trade.category || '').icon}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1">
                <h2 className="text-xl font-bold text-white">{trade.title}</h2>
                {/* Bearbeiten Button: nur wenn kein Angebot angenommen und keine Angebote vorliegen */}
                {(() => {
                  const hasAccepted = (existingQuotes || []).some(q => String(q.status).toLowerCase() === 'accepted');
                  const hasAnyQuote = (existingQuotes || []).length > 0;
                  const disabled = hasAnyQuote;
                  const title = hasAccepted ? 'Bearbeiten nicht mÃ¶glich, Angebot wurde bereits angenommen' : (hasAnyQuote ? 'Bearbeiten nicht mÃ¶glich, es liegen bereits Angebote vor' : 'Gewerk bearbeiten');
                  return (
                    <button
                      onClick={() => { if (!disabled) { setIsEditing(true); setEditForm({ title: trade.title || '', description: trade.description || '', category: (trade as any).category || '', priority: (trade as any).priority || 'medium', planned_date: (trade as any).planned_date || '', notes: (trade as any).notes || '', requires_inspection: (trade as any).requires_inspection || false }); }}}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1 ${disabled ? 'bg-white/5 text-gray-400 cursor-not-allowed opacity-50' : 'bg-white/10 text-white hover:bg-white/20'}`}
                      title={title}
                      disabled={disabled}
                    >
                      <CheckSquare size={14} />
                      Bearbeiten
                    </button>
                  );
                })()}
                {(completionStatus === 'completed' || completionStatus === 'completed_with_defects') && (
                  <div className="inline-flex items-center gap-1 px-3 py-1 bg-green-500/20 border border-green-500/30 text-green-300 rounded-full text-sm font-medium">
                    <CheckCircle size={14} />
                    {completionStatus === 'completed_with_defects' ? 'Unter Vorbehalt' : 'Abgeschlossen'}
                  </div>
                )}
                {(trade as any).requires_inspection && (
                  <div className="inline-flex items-center gap-1 px-3 py-1 bg-blue-500/20 border border-blue-500/30 text-blue-300 rounded-full text-sm font-medium">
                    <Eye size={14} />
                    Besichtigung erforderlich
                  </div>
                )}
              </div>
              <p className="text-gray-400 text-sm">{trade.category}</p>
              
              {/* Gewerk-Details */}
              <div className="mt-3 space-y-3">
                {/* ZusÃ¤tzliche Informationen Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {/* Erstellungsdatum */}
                  {trade.created_at && (
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar size={14} className="text-green-400" />
                      <span className="text-gray-400">Erstellt:</span>
                      <span className="font-medium text-white">
                        {new Date(trade.created_at).toLocaleDateString('de-DE', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                  )}

                  {/* Budget */}
                  {trade.budget && String(trade.budget) !== '0' && String(trade.budget) !== '0.0' && (
                    <div className="flex items-center gap-2 text-sm">
                      <Receipt size={14} className="text-green-400" />
                      <span className="text-gray-400">Budget:</span>
                      <span className="font-medium text-white">
                        CHF {parseFloat(String(trade.budget)).toLocaleString('de-DE')}
                      </span>
                    </div>
                  )}

                  {/* Bauphase */}
                  {(trade as any).construction_phase && (
                    <div className="flex items-center gap-2 text-sm">
                      <Settings size={14} className="text-orange-400" />
                      <span className="text-gray-400">Bauphase:</span>
                      <span className="font-medium text-white capitalize">
                        {(trade as any).construction_phase === 'ausschreibung' ? 'Ausschreibung' :
                         (trade as any).construction_phase === 'planung' ? 'Planung' :
                         (trade as any).construction_phase === 'rohbau' ? 'Rohbau' :
                         (trade as any).construction_phase === 'ausbau' ? 'Ausbau' :
                         (trade as any).construction_phase === 'fertigstellung' ? 'Fertigstellung' :
                         (trade as any).construction_phase === 'abnahme' ? 'Abnahme' : (trade as any).construction_phase}
                      </span>
                    </div>
                  )}
                </div>

                {/* Notizen - separate Zeile fÃ¼r bessere Lesbarkeit */}
                {(trade as any).notes && (
                  <div className="bg-black/20 rounded-lg p-3 mt-3">
                    <div className="flex items-center gap-2 mb-2">
                      <StickyNote size={14} className="text-yellow-400" />
                      <span className="text-sm font-medium text-yellow-300">Notizen</span>
                    </div>
                    <div className="text-sm text-gray-300 leading-relaxed">
                      {(trade as any).notes.length > 200 
                        ? `${(trade as any).notes.substring(0, 200)}...` 
                        : (trade as any).notes
                      }
                    </div>
                  </div>
                )}

                {/* ZusÃ¤tzliche Informationen aus notify_on_completion */}
                {(trade as any).notify_on_completion && (
                  <div className="bg-black/20 rounded-lg p-3 mt-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Info size={14} className="text-cyan-400" />
                      <span className="text-sm font-medium text-cyan-300">ZusÃ¤tzliche Informationen</span>
                    </div>
                    <div className="text-sm text-gray-300 leading-relaxed">
                      {(trade as any).notify_on_completion.length > 200 
                        ? `${(trade as any).notify_on_completion.substring(0, 200)}...` 
                        : (trade as any).notify_on_completion
                      }
                    </div>
                  </div>
                )}
              </div>
              
              {/* Projektinformationen */}
              {project && (
                <div className="mt-4 pt-3 border-t border-gray-600/30">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                    <div className="flex items-center gap-2 text-gray-300">
                      <Building size={14} className="text-[#ffbd59]" />
                      <span className="text-gray-400">Projekt:</span>
                      <span className="font-medium text-white">{project.name || 'Nicht angegeben'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-300">
                      <Settings size={14} className="text-[#ffbd59]" />
                      <span className="text-gray-400">Typ:</span>
                      <span className="font-medium text-white">{getProjectTypeLabel(project.project_type) || 'Nicht angegeben'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-300">
                      <MapPin size={14} className="text-[#ffbd59]" />
                      <span className="text-gray-400">Standort:</span>
                      <span className="font-medium text-white">{project.address || project.location || project.city || 'Projektadresse nicht verfÃ¼gbar'}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Angebot abgeben Button für Dienstleister */}
            {!isBautraeger() && (() => {
              const userQuote = (existingQuotes || []).find(quote => quote.service_provider_id === user?.id);
              const hasUserQuote = !!userQuote;
              
              if (!hasUserQuote) {
                return (
                  <button
                    onClick={() => {
                      // Navigiere zum ServiceProviderDashboard mit Quote-Parameter
                      window.location.href = `/service-provider?quote=${trade.id}`;
                    }}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center gap-2 shadow-lg"
                  >
                    <Package size={16} />
                    Angebot abgeben
                  </button>
                );
              }
              return null;
            })()}
            
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors p-2 rounded-lg hover:bg-white/10"
            >
              <X size={24} />
            </button>
          </div>
        </div>
        
        {/* Besichtigungstermin-Anzeige */}
        {appointmentsForTrade && appointmentsForTrade.length > 0 && (
          <div className="px-6 py-4 bg-gradient-to-r from-blue-600/20 to-cyan-500/20 border-b border-blue-400/30 flex-shrink-0">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <Calendar size={20} className="text-blue-300" />
                </div>
                <div>
                  <h3 className="text-white font-semibold">Besichtigungstermin vereinbart</h3>
                  <p className="text-blue-200 text-sm">
                    {appointmentsForTrade[0]?.scheduled_date ? 
                      new Date(appointmentsForTrade[0].scheduled_date).toLocaleDateString('de-DE', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      }) : 'Termin geplant'
                    }
                  </p>
                </div>
              </div>
              <div className="flex-1"></div>
              <div className="text-right">
                <div className="text-blue-200 text-sm">
                  {appointmentsForTrade[0]?.invited_service_providers?.length || 0} Dienstleister eingeladen
                </div>
                <div className="text-blue-300 text-xs">
                  {appointmentsForTrade[0]?.location || 'Standort nicht angegeben'}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-6">
          {/* Angenommenes Angebot - Dienstleister-Informationen */}
          {isBautraeger() && acceptedQuote && (
            <div className="mb-6 p-6 bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 rounded-xl border border-emerald-500/20">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-emerald-500/20 rounded-lg">
                  <CheckCircle size={20} className="text-emerald-400" />
                </div>
                <h3 className="text-lg font-semibold text-white">Beauftragter Dienstleister</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Firma und Kontaktperson */}
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Building size={16} className="text-gray-400" />
                    <div>
                      <div className="text-xs text-gray-400">Firma</div>
                      <div className="text-white font-medium">{acceptedQuote.company_name || 'Nicht angegeben'}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <User size={16} className="text-gray-400" />
                    <div>
                      <div className="text-xs text-gray-400">Ansprechpartner</div>
                      <div className="text-white font-medium">{acceptedQuote.contact_person || 'Nicht angegeben'}</div>
                    </div>
                  </div>
                </div>
                
                {/* Kontaktdaten */}
                <div className="space-y-3">
                  {acceptedQuote.email && (
                    <div className="flex items-center gap-3">
                      <Mail size={16} className="text-gray-400" />
                      <div>
                        <div className="text-xs text-gray-400">E-Mail</div>
                        <a href={`mailto:${acceptedQuote.email}`} className="text-[#ffbd59] hover:underline">
                          {acceptedQuote.email}
                        </a>
                      </div>
                    </div>
                  )}
                  
                  {acceptedQuote.phone && (
                    <div className="flex items-center gap-3">
                      <Phone size={16} className="text-gray-400" />
                      <div>
                        <div className="text-xs text-gray-400">Telefon</div>
                        <a href={`tel:${acceptedQuote.phone}`} className="text-[#ffbd59] hover:underline">
                          {acceptedQuote.phone}
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Angebotssumme und Zeitraum */}
              <div className="mt-4 pt-4 border-t border-emerald-500/20 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <div className="text-xs text-gray-400 mb-1">Angebotssumme</div>
                  <div className="text-xl font-bold text-[#ffbd59]">
                    {new Intl.NumberFormat('de-DE', { 
                      style: 'currency', 
                      currency: acceptedQuote.currency || 'CHF' 
                    }).format(acceptedQuote.total_amount || 0)}
                  </div>
                </div>
                
                {acceptedQuote.start_date && (
                  <div>
                    <div className="text-xs text-gray-400 mb-1">Startdatum</div>
                    <div className="text-white font-medium">
                      {new Date(acceptedQuote.start_date).toLocaleDateString('de-DE')}
                    </div>
                  </div>
                )}
                
                {acceptedQuote.completion_date && (
                  <div>
                    <div className="text-xs text-gray-400 mb-1">Fertigstellung</div>
                    <div className="text-white font-medium">
                      {new Date(acceptedQuote.completion_date).toLocaleDateString('de-DE')}
                    </div>
                  </div>
                )}
              </div>
              
              {/* Aktionen */}
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  onClick={() => window.open(`mailto:${acceptedQuote.email}`, '_blank')}
                  className="px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors flex items-center gap-2"
                  disabled={!acceptedQuote.email}
                >
                  <Mail size={16} />
                  E-Mail senden
                </button>
                
                {acceptedQuote.phone && (
                  <button
                    onClick={() => window.open(`tel:${acceptedQuote.phone}`, '_blank')}
                    className="px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors flex items-center gap-2"
                  >
                    <Phone size={16} />
                    Anrufen
                  </button>
                )}
                
                {acceptedQuote.website && (
                  <button
                    onClick={() => window.open(acceptedQuote.website, '_blank')}
                    className="px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors flex items-center gap-2"
                  >
                    <Globe size={16} />
                    Website
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Edit Modal Inline */}
          {isEditing && (
            <div className="mb-6 p-4 bg-white/5 rounded-xl border border-white/10">
              <h3 className="text-white font-semibold mb-3">Gewerk bearbeiten</h3>
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  try {
                    setIsUpdatingTrade(true);
                    const payload: any = {
                      title: editForm.title,
                      description: editForm.description,
                      category: editForm.category || undefined,
                      priority: editForm.priority || undefined,
                      planned_date: editForm.planned_date || undefined,
                      notes: editForm.notes || undefined,
                      requires_inspection: !!editForm.requires_inspection,
                    };
                    await updateMilestone((trade as any).id, payload);
                    // Lokal aktualisieren
                    (trade as any).title = payload.title || (trade as any).title;
                    (trade as any).description = payload.description || (trade as any).description;
                    (trade as any).category = payload.category ?? (trade as any).category;
                    (trade as any).priority = payload.priority ?? (trade as any).priority;
                    (trade as any).planned_date = payload.planned_date ?? (trade as any).planned_date;
                    (trade as any).notes = payload.notes ?? (trade as any).notes;
                    (trade as any).requires_inspection = payload.requires_inspection;
                    setIsEditing(false);
                  } catch (err) {
                    console.error('âŒ Fehler beim Aktualisieren des Gewerks:', err);
                    alert('Fehler beim Aktualisieren des Gewerks');
                  } finally {
                    setIsUpdatingTrade(false);
                  }
                }}
                className="space-y-3"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-300 mb-1">Titel</label>
                    <input value={editForm.title} onChange={(e)=>setEditForm(p=>({...p,title:e.target.value}))} className="w-full px-3 py-2 bg-[#1a1a2e] border border-gray-700 rounded-lg text-white" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-300 mb-1">Kategorie</label>
                    <input value={editForm.category||''} onChange={(e)=>setEditForm(p=>({...p,category:e.target.value}))} className="w-full px-3 py-2 bg-[#1a1a2e] border border-gray-700 rounded-lg text-white" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-300 mb-1">Beschreibung</label>
                  <textarea rows={3} value={editForm.description} onChange={(e)=>setEditForm(p=>({...p,description:e.target.value}))} className="w-full px-3 py-2 bg-[#1a1a2e] border border-gray-700 rounded-lg text-white" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs text-gray-300 mb-1">PrioritÃ¤t</label>
                    <select value={editForm.priority||'medium'} onChange={(e)=>setEditForm(p=>({...p,priority:e.target.value}))} className="w-full px-3 py-2 bg-[#1a1a2e] border border-gray-700 rounded-lg text-white">
                      <option value="low">Niedrig</option>
                      <option value="medium">Mittel</option>
                      <option value="high">Hoch</option>
                      <option value="critical">Kritisch</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-300 mb-1">Geplantes Datum</label>
                    <input type="date" value={editForm.planned_date||''} onChange={(e)=>setEditForm(p=>({...p,planned_date:e.target.value}))} className="w-full px-3 py-2 bg-[#1a1a2e] border border-gray-700 rounded-lg text-white" />
                  </div>
                  <div className="flex items-center gap-2 mt-6">
                    <input id="requires_inspection_td" type="checkbox" checked={!!editForm.requires_inspection} onChange={(e)=>setEditForm(p=>({...p,requires_inspection:e.target.checked}))} className="w-4 h-4 text-[#ffbd59] bg-[#2c3539]/50 border-gray-600 rounded" />
                    <label htmlFor="requires_inspection_td" className="text-xs text-gray-300">Besichtigung erforderlich</label>
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-300 mb-1">Notizen</label>
                  <textarea rows={2} value={editForm.notes||''} onChange={(e)=>setEditForm(p=>({...p,notes:e.target.value}))} className="w-full px-3 py-2 bg-[#1a1a2e] border border-gray-700 rounded-lg text-white" />
                </div>
                <div className="flex justify-end gap-2">
                  <button type="button" onClick={()=>setIsEditing(false)} className="px-4 py-2 text-gray-300 hover:text-white">Abbrechen</button>
                  <button type="submit" disabled={isUpdatingTrade} className="px-4 py-2 bg-[#ffbd59] text-[#2c3539] rounded-lg font-semibold hover:bg-[#ffa726] disabled:opacity-50">{isUpdatingTrade?'Speichernâ€¦':'Speichern'}</button>
                </div>
              </form>
            </div>
          )}

          {/* Ausschreibungsdetails - Klappbarer Bereich */}
          <div className="mb-6 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/30 rounded-xl overflow-hidden">
            {/* Klappbarer Header */}
            <button
              onClick={() => setShowTradeDetails(!showTradeDetails)}
              className="w-full p-4 flex items-center justify-between hover:bg-blue-500/5 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Info size={20} className="text-blue-400" />
                <h3 className="text-lg font-bold text-blue-300">Ausschreibungsdetails</h3>
              </div>
              <ChevronDown 
                size={20} 
                className={`text-blue-400 transition-transform duration-200 ${showTradeDetails ? 'rotate-180' : ''}`} 
              />
            </button>
            
            {/* Klappbarer Inhalt */}
            {showTradeDetails && (
              <div className="px-6 pb-6 space-y-4">
              {/* Debug-Informationen */}
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-xs">
                <div className="text-red-300 font-medium mb-2">Debug: Trade-Objekt Eigenschaften</div>
                <div className="text-gray-300 space-y-1">
                  <div>trade.id: {trade?.id}</div>
                  <div>trade.title: {trade?.title}</div>
                  <div>trade.description: {trade?.description ? 'VORHANDEN' : 'FEHLT'}</div>
                  <div>trade.created_at: {trade?.created_at ? 'VORHANDEN' : 'FEHLT'}</div>
                  <div>trade.notes: {(trade as any)?.notes ? 'VORHANDEN' : 'FEHLT'}</div>
                  <div>fullTradeData: {fullTradeData ? 'GELADEN' : 'NICHT GELADEN'}</div>
                  {fullTradeData && (
                    <>
                      <div>fullTradeData.description: {fullTradeData.description ? 'VORHANDEN' : 'FEHLT'}</div>
                      <div>fullTradeData.created_at: {fullTradeData.created_at ? 'VORHANDEN' : 'FEHLT'}</div>
                      <div>fullTradeData.notes: {fullTradeData.notes ? 'VORHANDEN' : 'FEHLT'}</div>
                    </>
                  )}
                  <div>Alle Keys: {Object.keys(trade || {}).join(', ')}</div>
                </div>
              </div>

              {/* Beschreibung */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <FileText size={16} className="text-blue-400" />
                  <span className="text-sm font-medium text-blue-300">Beschreibung</span>
                </div>
                <div className="bg-black/20 rounded-lg p-4">
                  <div className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">
                    {fullTradeData?.description || trade?.description || (trade as any)?.description || 'Keine Beschreibung verfÃ¼gbar'}
                  </div>
                </div>
              </div>

              {/* Erstellungsdatum und Notizen Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Erstellungsdatum */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar size={16} className="text-green-400" />
                    <span className="text-sm font-medium text-green-300">Erstellt am</span>
                  </div>
                  <div className="bg-black/20 rounded-lg p-4">
                    <div className="text-sm text-white font-medium">
                      {fullTradeData?.created_at || trade?.created_at || (trade as any)?.created_at ? 
                        new Date(fullTradeData?.created_at || trade?.created_at || (trade as any)?.created_at).toLocaleDateString('de-DE', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        }) : 'Nicht verfÃ¼gbar'
                      }
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      Debug: {fullTradeData?.created_at || trade?.created_at || (trade as any)?.created_at || 'KEIN DATUM'}
                    </div>
                  </div>
                </div>

                {/* Notizen */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <StickyNote size={16} className="text-yellow-400" />
                    <span className="text-sm font-medium text-yellow-300">Notizen</span>
                  </div>
                  <div className="bg-black/20 rounded-lg p-4">
                    <div className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">
                      {fullTradeData?.notes || trade?.notes || (trade as any)?.notes || 'Keine Notizen vorhanden'}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      Debug: {fullTradeData?.notes || trade?.notes || (trade as any)?.notes || 'KEINE NOTIZEN'}
                    </div>
                  </div>
                </div>
              </div>

              {/* ZusÃ¤tzliche Informationen */}
              {((trade as any).notify_on_completion || trade.notify_on_completion) && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle size={16} className="text-orange-400" />
                    <span className="text-sm font-medium text-orange-300">ZusÃ¤tzliche Informationen</span>
                  </div>
                  <div className="bg-black/20 rounded-lg p-4">
                    <div className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">
                      {(trade as any).notify_on_completion || trade.notify_on_completion}
                    </div>
                  </div>
                </div>
              )}
              </div>
            )}
          </div>

          {/* Dienstleister: Mein Angebot Abschnitt - NUR für Dienstleister */}
          {!isBautraeger() && (
            <div className="mb-6 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-xl overflow-hidden">
              <button 
                onClick={() => setShowMyQuoteDetails(!showMyQuoteDetails)} 
                className="w-full p-4 flex items-center justify-between hover:bg-green-500/5 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-500/20 rounded-lg">
                    <FileText size={18} className="text-green-400" />
                  </div>
                  <h3 className="text-lg font-bold text-green-300">
                    Mein Angebot {userQuoteLoading && '(Lädt...)'}
                  </h3>
                </div>
                <ChevronDown 
                  size={20} 
                  className={`text-green-400 transition-transform duration-200 ${showMyQuoteDetails ? 'rotate-180' : ''}`} 
                />
              </button>

              {showMyQuoteDetails && (
                <div className="border-t border-green-500/20 p-6 space-y-6">
                  {userQuoteLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-400 mr-3"></div>
                      <span className="text-gray-300">Lade Angebotsdaten...</span>
                    </div>
                  ) : !userQuote ? (
                    <div className="text-center py-8">
                      <div className="text-gray-400 mb-4">
                        <FileText size={48} className="mx-auto mb-4 opacity-50" />
                        <h4 className="text-lg font-semibold text-gray-300 mb-2">Kein Angebot vorhanden</h4>
                        <p className="text-sm">Sie haben noch kein Angebot für diese Ausschreibung abgegeben.</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {/* Grundinformationen */}
                      <div className="bg-black/20 rounded-lg p-4 border border-green-500/20">
                        <h5 className="text-white font-semibold mb-3 flex items-center gap-2">
                          <Info size={16} className="text-green-400" />
                          Grundinformationen
                        </h5>
                        
                        {/* Titel */}
                        {userQuote.title && (
                          <div className="mb-4">
                            <div className="text-sm text-green-300 mb-1">Angebots-Titel</div>
                            <div className="text-white font-medium">{userQuote.title}</div>
                          </div>
                        )}
                        
                        {/* Gesamtbetrag und Status */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-lg p-3">
                            <div className="text-sm text-green-300 mb-1">Gesamtbetrag</div>
                            <div className="text-xl font-bold text-white">
                              {userQuote.total_amount ? 
                                `${Number(userQuote.total_amount).toLocaleString('de-DE')} ${userQuote.currency || 'CHF'}` : 
                                'Nicht angegeben'
                              }
                            </div>
                          </div>
                          <div className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 rounded-lg p-3">
                            <div className="text-sm text-blue-300 mb-1">Status</div>
                            <div className="text-lg font-semibold text-white">
                              {userQuote.status === 'accepted' ? 'Angenommen' :
                               userQuote.status === 'submitted' ? 'Eingereicht' :
                               userQuote.status === 'DRAFT' ? 'Entwurf' :
                               userQuote.status === 'draft' ? 'Entwurf' :
                               userQuote.status}
                            </div>
                          </div>
                        </div>

                        {/* Beschreibung */}
                        {userQuote.description && (
                          <div className="mb-4">
                            <div className="text-sm text-green-300 mb-2">Beschreibung</div>
                            <div className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap bg-black/30 rounded-lg p-3">
                              {userQuote.description}
                            </div>
                          </div>
                        )}

                        {/* Termine */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                          {userQuote.valid_until && (
                            <div>
                              <div className="text-sm text-green-300 mb-1">Gültig bis</div>
                              <div className="text-white">{new Date(userQuote.valid_until).toLocaleDateString('de-DE')}</div>
                            </div>
                          )}
                          {userQuote.start_date && (
                            <div>
                              <div className="text-sm text-green-300 mb-1">Startdatum</div>
                              <div className="text-white">{new Date(userQuote.start_date).toLocaleDateString('de-DE')}</div>
                            </div>
                          )}
                          {userQuote.completion_date && (
                            <div>
                              <div className="text-sm text-green-300 mb-1">Fertigstellung</div>
                              <div className="text-white">{new Date(userQuote.completion_date).toLocaleDateString('de-DE')}</div>
                            </div>
                          )}
                        </div>

                        {/* Geschätzte Dauer */}
                        {userQuote.estimated_duration && userQuote.estimated_duration > 0 && (
                          <div className="mb-4">
                            <div className="text-sm text-green-300 mb-1">Geschätzte Dauer</div>
                            <div className="text-white">{userQuote.estimated_duration} Tage</div>
                          </div>
                        )}
                      </div>

                      {/* Kostenaufschlüsselung */}
                      {(userQuote.labor_cost || userQuote.material_cost || userQuote.overhead_cost) && (
                        <div className="bg-black/20 rounded-lg p-4 border border-green-500/20">
                          <h5 className="text-white font-semibold mb-3 flex items-center gap-2">
                            <Calculator size={16} className="text-green-400" />
                            Kostenaufschlüsselung
                          </h5>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {userQuote.labor_cost && (
                              <div className="text-center">
                                <div className="text-sm text-green-300 mb-1">Arbeitskosten</div>
                                <div className="text-white font-semibold">
                                  {Number(userQuote.labor_cost).toLocaleString('de-DE')} {userQuote.currency || 'CHF'}
                                </div>
                              </div>
                            )}
                            {userQuote.material_cost && (
                              <div className="text-center">
                                <div className="text-sm text-green-300 mb-1">Materialkosten</div>
                                <div className="text-white font-semibold">
                                  {Number(userQuote.material_cost).toLocaleString('de-DE')} {userQuote.currency || 'CHF'}
                                </div>
                              </div>
                            )}
                            {userQuote.overhead_cost && (
                              <div className="text-center">
                                <div className="text-sm text-green-300 mb-1">Sonstige Kosten</div>
                                <div className="text-white font-semibold">
                                  {Number(userQuote.overhead_cost).toLocaleString('de-DE')} {userQuote.currency || 'CHF'}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Zahlungsbedingungen und Garantie */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {userQuote.payment_terms && (
                          <div className="bg-black/20 rounded-lg p-4 border border-green-500/20">
                            <h5 className="text-white font-semibold mb-2 flex items-center gap-2">
                              <CreditCard size={16} className="text-green-400" />
                              Zahlungsbedingungen
                            </h5>
                            <div className="text-gray-300 text-sm">
                              {userQuote.payment_terms === '30_days' ? '30 Tage' :
                               userQuote.payment_terms === '14_days' ? '14 Tage' :
                               userQuote.payment_terms === '7_days' ? '7 Tage' :
                               userQuote.payment_terms}
                            </div>
                          </div>
                        )}
                        {userQuote.warranty_period && (
                          <div className="bg-black/20 rounded-lg p-4 border border-green-500/20">
                            <h5 className="text-white font-semibold mb-2 flex items-center gap-2">
                              <Shield size={16} className="text-green-400" />
                              Garantie
                            </h5>
                            <div className="text-white">
                              {userQuote.warranty_period} Monate
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Kontaktinformationen */}
                      {(userQuote.company_name || userQuote.contact_person || userQuote.phone || userQuote.email) && (
                        <div className="bg-black/20 rounded-lg p-4 border border-green-500/20">
                          <h5 className="text-white font-semibold mb-3 flex items-center gap-2">
                            <User size={16} className="text-green-400" />
                            Kontaktinformationen
                          </h5>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            {userQuote.company_name && (
                              <div>
                                <div className="text-green-300 mb-1">Unternehmen</div>
                                <div className="text-white">{userQuote.company_name}</div>
                              </div>
                            )}
                            {userQuote.contact_person && (
                              <div>
                                <div className="text-green-300 mb-1">Ansprechpartner</div>
                                <div className="text-white">{userQuote.contact_person}</div>
                              </div>
                            )}
                            {userQuote.phone && (
                              <div>
                                <div className="text-green-300 mb-1">Telefon</div>
                                <div className="text-white">{userQuote.phone}</div>
                              </div>
                            )}
                            {userQuote.email && (
                              <div>
                                <div className="text-green-300 mb-1">E-Mail</div>
                                <div className="text-white">{userQuote.email}</div>
                              </div>
                            )}
                            {userQuote.website && (
                              <div>
                                <div className="text-green-300 mb-1">Website</div>
                                <div className="text-white">{userQuote.website}</div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Dokumente */}
                      {(userQuote.pdf_upload_path || userQuote.additional_documents) && (
                        <div className="bg-black/20 rounded-lg p-4 border border-green-500/20">
                          <h5 className="text-white font-semibold mb-3 flex items-center gap-2">
                            <FileText size={16} className="text-green-400" />
                            Angebotsdokumente
                          </h5>
                          <div className="space-y-3">
                            {userQuote.pdf_upload_path && (
                              <div className="flex items-center justify-between p-3 bg-black/30 rounded-lg">
                                <div className="flex items-center gap-3">
                                  <div className="p-2 bg-green-500/20 rounded-lg">
                                    <FileText size={16} className="text-green-400" />
                                  </div>
                                  <div>
                                    <div className="text-white font-medium">Angebots-PDF</div>
                                    <div className="text-gray-400 text-xs">{userQuote.pdf_upload_path}</div>
                                  </div>
                                </div>
                                <button
                                  onClick={() => window.open(userQuote.pdf_upload_path, '_blank')}
                                  className="px-3 py-1 bg-green-500/20 text-green-300 rounded-lg hover:bg-green-500/30 transition-colors text-sm"
                                >
                                  Öffnen
                                </button>
                              </div>
                            )}
                            {userQuote.additional_documents && (
                              <div className="flex items-center justify-between p-3 bg-black/30 rounded-lg">
                                <div className="flex items-center gap-3">
                                  <div className="p-2 bg-green-500/20 rounded-lg">
                                    <FileText size={16} className="text-green-400" />
                                  </div>
                                  <div>
                                    <div className="text-white font-medium">Zusätzliche Dokumente</div>
                                    <div className="text-gray-400 text-xs">{userQuote.additional_documents}</div>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Erstellungs- und Aktualisierungsdatum */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-400">
                        <div>
                          <span className="text-green-300">Erstellt:</span> {new Date(userQuote.created_at).toLocaleDateString('de-DE', { 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                        {userQuote.updated_at && userQuote.updated_at !== userQuote.created_at && (
                          <div>
                            <span className="text-green-300">Aktualisiert:</span> {new Date(userQuote.updated_at).toLocaleDateString('de-DE', { 
                              year: 'numeric', 
                              month: 'long', 
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* DEBUG: Angebote für Bauträger */}
          {(() => {
            console.log('🔍 TradeDetailsModal DEBUG - Angebots-Sektion Bedingungen:', {
              isBautraeger: isBautraeger(),
              existingQuotes: existingQuotes,
              existingQuotesLength: existingQuotes?.length,
              existingQuotesType: typeof existingQuotes,
              shouldShow: isBautraeger() && existingQuotes && existingQuotes.length > 0
            });
            return null;
          })()}
          
          {/* TEMPORÄRE DEBUG-ANZEIGE für Bauträger */}
          {isBautraeger() && (
            <div className="mb-6 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/30 rounded-xl p-4">
              <h3 className="text-yellow-300 font-bold mb-2">🔍 DEBUG: Angebots-Status</h3>
              <div className="text-sm text-gray-300 space-y-1">
                <div>existingQuotes: {existingQuotes ? 'vorhanden' : 'null/undefined'}</div>
                <div>existingQuotes.length: {existingQuotes?.length || 0}</div>
                <div>existingQuotes Typ: {typeof existingQuotes}</div>
                <div>isBautraeger(): {isBautraeger() ? 'true' : 'false'}</div>
                <div>Bedingung erfüllt: {(isBautraeger() && existingQuotes && existingQuotes.length > 0) ? 'JA' : 'NEIN'}</div>
                {existingQuotes && existingQuotes.length > 0 && (
                  <div>Angebote: {existingQuotes.map(q => `${q.id}:${q.status}`).join(', ')}</div>
                )}
              </div>
            </div>
          )}

          {/* Angebote für Bauträger - TEMPORÄR: Zeige auch wenn keine Angebote vorhanden */}
          {isBautraeger() && (
            <div className="mb-6 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/30 rounded-xl overflow-hidden">
              <div className="p-4 border-b border-blue-500/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-500/20 rounded-lg">
                      <FileText size={18} className="text-blue-400" />
                    </div>
                    <h3 className="text-lg font-bold text-blue-300">
                      Eingegangene Angebote ({existingQuotes?.length || 0})
                    </h3>
                  </div>
                  {(trade as any).requires_inspection && (
                    <button
                      onClick={() => {
                        if (selectedQuoteIds.length === 0) {
                          alert('Bitte wählen Sie mindestens ein Angebot für die Besichtigung aus.');
                          return;
                        }
                        onCreateInspection?.(trade.id, selectedQuoteIds);
                      }}
                      disabled={selectedQuoteIds.length === 0 || (appointmentsForTrade && appointmentsForTrade.length > 0)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors ${
                        (appointmentsForTrade && appointmentsForTrade.length > 0)
                          ? 'bg-gray-500/20 text-gray-400 cursor-not-allowed border border-gray-500/40'
                          : selectedQuoteIds.length > 0
                            ? 'bg-orange-500/20 text-orange-300 hover:bg-orange-500/30 border border-orange-500/40'
                            : 'bg-gray-500/20 text-gray-400 cursor-not-allowed border border-gray-500/40'
                      }`}
                    >
                      <Calendar size={16} />
                      {(appointmentsForTrade && appointmentsForTrade.length > 0) 
                        ? 'Termin bereits vereinbart' 
                        : `Besichtigung vereinbaren (${selectedQuoteIds.length})`
                      }
                    </button>
                  )}
                </div>
              </div>

              <div className="p-6 space-y-4">
                {existingQuotes && existingQuotes.length > 0 ? existingQuotes.map((quote) => (
                  <div 
                    key={quote.id} 
                    className={`p-4 rounded-xl border transition-all duration-200 cursor-pointer ${
                      quote.status === 'accepted' 
                        ? 'bg-green-500/10 border-green-500/30' 
                        : selectedQuoteIds.includes(quote.id)
                        ? 'bg-blue-500/20 border-blue-400/60 shadow-lg shadow-blue-500/20'
                        : 'bg-white/5 border-white/20 hover:border-blue-400/40 hover:bg-white/10'
                    }`}
                    onClick={(e) => {
                      // Nur bei Besichtigungspflicht und nicht angenommenen Angeboten
                      if ((trade as any).requires_inspection && quote.status !== 'accepted') {
                        e.preventDefault();
                        e.stopPropagation();
                        
                        if (selectedQuoteIds.includes(quote.id)) {
                          setSelectedQuoteIds(selectedQuoteIds.filter(id => id !== quote.id));
                        } else {
                          setSelectedQuoteIds([...selectedQuoteIds, quote.id]);
                        }
                      }
                    }}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-start gap-3">
                        {(trade as any).requires_inspection && quote.status !== 'accepted' && (
                          <div className="mt-1 relative">
                            {selectedQuoteIds.includes(quote.id) && (
                              <div className="absolute -top-1 -left-1 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                                <CheckCircle size={12} className="text-white" />
                              </div>
                            )}
                            <input
                              type="checkbox"
                              checked={selectedQuoteIds.includes(quote.id)}
                              onChange={(e) => {
                                e.stopPropagation(); // Verhindere Container-Klick
                                if (e.target.checked) {
                                  setSelectedQuoteIds([...selectedQuoteIds, quote.id]);
                                } else {
                                  setSelectedQuoteIds(selectedQuoteIds.filter(id => id !== quote.id));
                                }
                              }}
                              onClick={(e) => e.stopPropagation()} // Verhindere Container-Klick auch bei onClick
                              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                            />
                          </div>
                        )}
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="text-white font-semibold">{quote.company_name || quote.contact_person || 'Unbekannter Anbieter'}</h4>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              quote.status === 'accepted' ? 'bg-green-500/20 text-green-400' :
                              quote.status === 'under_review' ? 'bg-yellow-500/20 text-yellow-400' :
                              quote.status === 'rejected' ? 'bg-red-500/20 text-red-400' :
                              'bg-blue-500/20 text-blue-400'
                            }`}>
                              {quote.status === 'accepted' ? 'Angenommen' :
                               quote.status === 'under_review' ? 'In Prüfung' :
                               quote.status === 'rejected' ? 'Abgelehnt' :
                               quote.status === 'submitted' ? 'Eingereicht' : 'Entwurf'}
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                            <div>
                              <span className="text-gray-400">Angebotssumme:</span>
                              <div className="text-[#ffbd59] font-bold text-lg">
                                {new Intl.NumberFormat('de-DE', {
                                  style: 'currency',
                                  currency: quote.currency || 'EUR'
                                }).format(quote.total_amount || 0)}
                              </div>
                            </div>
                            <div>
                              <span className="text-gray-400">Dauer:</span>
                              <div className="text-white">{quote.estimated_duration || 0} Tage</div>
                            </div>
                            <div>
                              <span className="text-gray-400">Garantie:</span>
                              <div className="text-white">{(quote as any).warranty_period || 0} Monate</div>
                            </div>
                          </div>

                          {quote.contact_person && (
                            <div className="mt-3 flex items-center gap-4 text-sm text-gray-300">
                              <div className="flex items-center gap-1">
                                <User size={14} />
                                {quote.contact_person}
                              </div>
                              {quote.phone && (
                                <div className="flex items-center gap-1">
                                  <Phone size={14} />
                                  {quote.phone}
                                </div>
                              )}
                              {quote.email && (
                                <div className="flex items-center gap-1">
                                  <Mail size={14} />
                                  {quote.email}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Annehmen/Ablehnen Buttons rechts oben auf der Kachel */}
                      {isBautraeger() && (quote.status === 'submitted' || quote.status === 'draft') && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAcceptQuote(quote.id);
                            }}
                            className="px-3 py-1.5 bg-green-500/20 text-green-300 rounded-lg hover:bg-green-500/30 transition-colors text-sm font-medium flex items-center gap-1"
                          >
                            <CheckCircle size={14} />
                            Annehmen
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setRejectingQuoteId(quote.id);
                              setShowRejectModal(true);
                            }}
                            className="px-3 py-1.5 bg-red-500/20 text-red-300 rounded-lg hover:bg-red-500/30 transition-colors text-sm font-medium flex items-center gap-1"
                          >
                            <X size={14} />
                            Ablehnen
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="text-xs text-gray-400">
                        Eingereicht: {new Date(quote.created_at).toLocaleDateString('de-DE', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation(); // Verhindere Container-Klick
                            setQuoteForDetails(quote);
                            setShowQuoteDetails(true);
                          }}
                          className="px-3 py-1.5 bg-blue-500/20 text-blue-300 rounded-lg hover:bg-blue-500/30 transition-colors text-sm font-medium flex items-center gap-1"
                        >
                          <Eye size={14} />
                          Details
                        </button>
                        

                      </div>
                    </div>
                  </div>
                )) : (
                  <div className="text-center py-8">
                    <FileText size={48} className="mx-auto mb-4 text-gray-500" />
                    <h3 className="text-lg font-semibold text-gray-300 mb-2">Keine Angebote vorhanden</h3>
                    <p className="text-gray-400 text-sm">
                      Für dieses Gewerk sind noch keine Angebote eingegangen.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="space-y-6">
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
                  <ChevronDown 
                    size={20} 
                    className={`text-gray-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                  />
                </div>
              </div>
              
              {isExpanded && (
                <div className="px-6 pb-6">
                  {documentsError ? (
                    <div className="text-center py-8">
                      <div className="text-red-400 mb-4">
                        Fehler beim Laden der Dokumente: {documentsError}
                      </div>
                      <button 
                        onClick={() => window.location.reload()}
                        className="px-4 py-2 bg-[#ffbd59] text-[#1a1a2e] rounded-lg hover:bg-[#ffa726] transition-colors"
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
                </div>
              )}
            </div>

            {/* Baufortschritt & Kommunikation */}
            {(
              // Für Bauträger: Immer anzeigen (können jederzeit kommentieren)
              isBautraeger() ||
              // Für Dienstleister: Immer anzeigen (können kommunizieren und Fortschritt melden)
              !isBautraeger()
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

            {/* Abnahme-Workflow für Dienstleister */}
            {!isBautraeger() && completionStatus === 'completed_with_defects' && (
              <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-orange-300 mb-3 flex items-center gap-2">
                  <Settings size={20} />
                  Abnahme-Workflow
                </h3>
                
                {/* Status-Banner */}
                <div className="mb-4 p-3 rounded-lg border bg-yellow-500/10 border-yellow-500/30">
                  <div className="flex items-center gap-3">
                    <AlertTriangle size={20} className="text-yellow-400" />
                    <div>
                      <h4 className="text-yellow-300 font-medium">Abnahme unter Vorbehalt</h4>
                      <p className="text-yellow-200 text-sm">
                        Mängel wurden dokumentiert. Finale Abnahme durch Bauträger steht noch aus.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Mängel-Übersicht */}
                <div className="space-y-3">
                  <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-lg p-3">
                    <h4 className="text-yellow-300 font-medium mb-2">Dokumentierte Mängel</h4>
                    <p className="text-gray-400 text-sm">
                      Der Bauträger hat Mängel dokumentiert. Beheben Sie diese und starten Sie die finale Abnahme.
                    </p>
                  </div>
                  
                  <button
                    onClick={handleStartFinalAcceptance}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors"
                  >
                    <CheckCircle size={16} />
                    Finale Abnahme starten
                  </button>
                </div>
              </div>
            )}

            {/* Rechnungsstellung für Dienstleister */}
            {!isBautraeger() && completionStatus === 'completed' && (
              <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-green-300 mb-3 flex items-center gap-2">
                  <Receipt size={20} />
                  Rechnungsstellung
                </h3>
                
                {existingInvoice ? (
                  // Bestehende Rechnung anzeigen
                  <div className="space-y-3">
                    <div className="bg-green-500/5 border border-green-500/20 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-green-300 font-medium">Rechnung erstellt</h4>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          existingInvoice.status === 'paid' 
                            ? 'bg-green-500/20 text-green-300'
                            : existingInvoice.status === 'sent'
                            ? 'bg-blue-500/20 text-blue-300'
                            : 'bg-yellow-500/20 text-yellow-300'
                        }`}>
                          {existingInvoice.status === 'paid' ? 'Bezahlt' : 
                           existingInvoice.status === 'sent' ? 'Versendet' : 'Entwurf'}
                        </span>
                      </div>
                      <div className="text-sm text-gray-300 space-y-1">
                        <div className="flex justify-between">
                          <span>Rechnungsnummer:</span>
                          <span className="text-white font-medium">{existingInvoice.invoice_number}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Betrag:</span>
                          <span className="text-white font-medium">
                            {new Intl.NumberFormat('de-DE', {
                              style: 'currency',
                              currency: existingInvoice.currency || 'EUR'
                            }).format(existingInvoice.total_amount || 0)}
                          </span>
                        </div>
                        {existingInvoice.created_at && (
                          <div className="flex justify-between">
                            <span>Erstellt:</span>
                            <span className="text-white font-medium">
                              {new Date(existingInvoice.created_at).toLocaleDateString('de-DE')}
                            </span>
                          </div>
                        )}
                        {existingInvoice.status === 'paid' && existingInvoice.paid_at && (
                          <div className="flex justify-between">
                            <span>Bezahlt am:</span>
                            <span className="text-green-300 font-medium">
                              {new Date(existingInvoice.paid_at).toLocaleDateString('de-DE')}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  // Rechnung erstellen
                  <div className="space-y-3">
                    <div className="bg-green-500/5 border border-green-500/20 rounded-lg p-3">
                      <h4 className="text-green-300 font-medium mb-2">Gewerk erfolgreich abgenommen</h4>
                      <p className="text-gray-300 text-sm">
                        Das Gewerk wurde vollständig abgenommen. Sie können jetzt Ihre Rechnung erstellen.
                      </p>
                    </div>
                    
                    <button
                      onClick={() => setShowInvoiceModal(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors"
                    >
                      <FileText size={16} />
                      Rechnung stellen
                    </button>
                  </div>
                )}
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

      {/* Rechnungs-Modal */}
      {showInvoiceModal && (acceptedQuote || userQuote) && (
        <InvoiceModal
          isOpen={showInvoiceModal}
          onClose={() => setShowInvoiceModal(false)}
          milestoneId={trade.id}
          milestoneTitle={trade.title}
          contractValue={(acceptedQuote?.total_price || userQuote?.total_amount || 0)}
          onInvoiceSubmitted={() => {
            setShowInvoiceModal(false);
            // Lade die Rechnung neu
            loadExistingInvoice();
          }}
        />
      )}

      {/* Quote Details Modal */}
      {showQuoteDetails && quoteForDetails && (
        <QuoteDetailsModal
          isOpen={showQuoteDetails}
          onClose={() => {
            setShowQuoteDetails(false);
            setQuoteForDetails(null);
          }}
          quote={quoteForDetails}
          trade={trade}
          project={{
            id: trade?.project_id || 0,
            name: trade?.project_name || 'Unbekanntes Projekt'
          }}
          user={user}
        />
      )}

      {/* Angebot Annahme Bestätigung */}
      {showAcceptConfirm && quoteIdToAccept && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#2c3539] rounded-2xl shadow-2xl border border-white/20 max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-green-500/20 rounded-lg">
                  <CheckCircle size={24} className="text-green-400" />
                </div>
                <h3 className="text-xl font-bold text-white">Angebot annehmen</h3>
              </div>
              
              <p className="text-gray-300 mb-6">
                Möchten Sie dieses Angebot wirklich annehmen? Diese Aktion kann nicht rückgängig gemacht werden.
              </p>
              
              <div className="mb-6">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={acceptAcknowledged}
                    onChange={(e) => setAcceptAcknowledged(e.target.checked)}
                    className="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500"
                  />
                  <span className="text-sm text-gray-300">
                    Ich bestätige, dass ich das Angebot geprüft habe und annehmen möchte.
                  </span>
                </label>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowAcceptConfirm(false);
                    setQuoteIdToAccept(null);
                    setAcceptAcknowledged(false);
                  }}
                  className="flex-1 px-4 py-2 bg-gray-500/20 text-gray-300 rounded-lg hover:bg-gray-500/30 transition-colors"
                >
                  Abbrechen
                </button>
                <button
                  onClick={async () => {
                    if (!acceptAcknowledged) {
                      alert('Bitte bestätigen Sie die Annahme.');
                      return;
                    }
                    
                    try {
                      await apiCall(`/quotes/${quoteIdToAccept}/accept`, 'POST');
                      setShowAcceptConfirm(false);
                      setQuoteIdToAccept(null);
                      setAcceptAcknowledged(false);
                      window.location.reload();
                    } catch (error) {
                      console.error('Fehler beim Annehmen:', error);
                      alert('Fehler beim Annehmen des Angebots');
                    }
                  }}
                  disabled={!acceptAcknowledged}
                  className={`flex-1 px-4 py-2 rounded-lg transition-colors ${
                    acceptAcknowledged
                      ? 'bg-green-500/20 text-green-300 hover:bg-green-500/30'
                      : 'bg-gray-500/20 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  Angebot annehmen
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Ablehnungs-Modal */}
      {showRejectModal && rejectingQuoteId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-gradient-to-br from-[#2c3539] to-[#1a1a2e] rounded-2xl shadow-2xl border border-red-500/30 max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-red-500/20 rounded-full">
                  <X className="w-6 h-6 text-red-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Angebot ablehnen</h3>
                  <p className="text-sm text-gray-400">Bitte geben Sie einen Grund für die Ablehnung an</p>
                </div>
              </div>
              
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Ablehnungsgrund eingeben..."
                className="w-full p-3 bg-white/10 border border-gray-600/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50 resize-none h-24"
                autoFocus
              />
              
              <div className="flex items-center gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowRejectModal(false);
                    setRejectingQuoteId(null);
                    setRejectionReason('');
                  }}
                  className="flex-1 px-4 py-2 bg-gray-500/20 text-gray-300 rounded-lg hover:bg-gray-500/30 transition-colors"
                >
                  Abbrechen
                </button>
                <button
                  onClick={() => {
                    if (!rejectionReason.trim()) {
                      alert('Bitte geben Sie einen Ablehnungsgrund an.');
                      return;
                    }
                    handleRejectQuote(rejectingQuoteId, rejectionReason);
                  }}
                  disabled={!rejectionReason.trim()}
                  className={`flex-1 px-4 py-2 rounded-lg transition-colors ${
                    rejectionReason.trim()
                      ? 'bg-red-500/20 text-red-300 hover:bg-red-500/30'
                      : 'bg-gray-500/20 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  Ablehnen
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FinalAcceptanceModal für finale Abnahme */}
      {showFinalAcceptanceModal && (
        <FinalAcceptanceModal
          isOpen={showFinalAcceptanceModal}
          onClose={() => setShowFinalAcceptanceModal(false)}
          acceptanceId={1} // Wird vom Backend automatisch ermittelt
          milestoneId={trade?.id || 0}
          milestoneTitle={trade?.title || 'Gewerk'}
          defects={acceptanceDefects}
          onAcceptanceComplete={() => {
            setShowFinalAcceptanceModal(false);
            // Reload der Daten nach finaler Abnahme
            if (trade?.id) {
              loadTradeDocuments(trade.id);
              loadCompletionStatus(trade.id);
            }
          }}
        />
      )}
    </div>
  );
}
