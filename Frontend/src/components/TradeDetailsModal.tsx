import React, { useState, useEffect } from 'react';
import QuoteDocumentUpload from './QuoteDocumentUpload';
import { 
  X, 
  Eye, 
  Download, 
  ExternalLink, 
  FileText, 
  ChevronDown,
  Upload,
  Calendar,
  MapPin,
  CheckCircle,
  CheckCircle2,
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
  Package,
  Trash2,
  Save,
  MessageCircle,
  Camera,
  Users
} from 'lucide-react';
import type { TradeSearchResult } from '../api/geoService';
import { useAuth } from '../context/AuthContext';
import { getAuthenticatedFileUrl, getApiBaseUrl, apiCall } from '../api/api';
import TradeProgress from './TradeProgress';
import QuoteDetailsModal from './QuoteDetailsModal';
import FinalAcceptanceModal from './FinalAcceptanceModal';
import { appointmentService, type AppointmentResponse } from '../api/appointmentService';
import ServiceProviderRating from './ServiceProviderRating';
import InvoiceModal from './InvoiceModal';
// import FullDocumentViewer from './DocumentViewer';
import { updateMilestone, deleteMilestone } from '../api/milestoneService';
import { resourceService, type ResourceAllocation } from '../api/resourceService';

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
        // Fallback: Prüfe ob URL bereits ein /documents/ Endpoint ist
        if (url.includes('/documents/') && url.includes('/content')) {
          const response = await fetch(url, {
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
          // Letzter Fallback: Verwende die authentifizierte URL
          const authenticatedUrl = getAuthenticatedFileUrl(url);
          setPdfUrl(authenticatedUrl);
        }
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
  onTradeUpdate?: (updatedTrade: any) => void;
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
  warranty_period?: number;
  profit_margin?: number;
  notes?: string;
  quote_number?: string;
  qualifications?: string;
  technical_approach?: string;
  references?: string;
  certifications?: string;
  quality_standards?: string;
  safety_measures?: string;
  environmental_compliance?: string;
  risk_assessment?: string;
  contingency_plan?: string;
  additional_notes?: string;
  pdf_upload_path?: string;
  additional_documents?: string;
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
  const [loadedDocuments, setLoadedDocuments] = useState<any[]>([]);
  const [isLoadingDocs, setIsLoadingDocs] = useState(false);
  const { isBautraeger } = useAuth();

  // KRITISCHER DEBUG
  console.log('🚨 TradeDocumentViewer AUFGERUFEN:', {
    documents,
    documentsType: typeof documents,
    documentsLength: Array.isArray(documents) ? documents.length : 'not array',
    existingQuotes: existingQuotes?.length || 0
  });

  // DEBUG: Dokumente beim Mount loggen
  React.useEffect(() => {
    console.log('🚨 TradeDocumentViewer MOUNT:', {
      documentsCount: Array.isArray(documents) ? documents.length : 'nicht array',
      documentsType: typeof documents,
      documents: documents
    });
  }, []);

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

  // Robuste Dokumentenverarbeitung - VERBESSERT
  const safeDocuments = React.useMemo(() => {
    console.log('🔧 safeDocuments Processing:', { documents, loadedDocuments });
    
    if (!documents) return [];
    if (Array.isArray(documents)) {
      // Filtere ungültige Dokumente heraus und entferne Duplikate
      const validDocs = documents.filter(doc => {
        const isValid = doc && typeof doc === 'object' && (doc.id || doc.name || doc.title || doc.file_name);
        console.log('🔧 Dokument-Validierung:', { doc, isValid, hasId: !!doc?.id, hasName: !!doc?.name, hasTitle: !!doc?.title, hasFileName: !!doc?.file_name });
        return isValid;
      });
      
      // Entferne Duplikate basierend auf ID (String/Number-sicher)
      const uniqueDocs = validDocs.filter((doc, index, self) => 
        index === self.findIndex(d => String(d.id) === String(doc.id))
      );
      
      console.log('🔧 safeDocuments Result:', { 
        originalLength: documents.length,
        validDocs: validDocs.length, 
        uniqueDocs: uniqueDocs.length, 
        docs: uniqueDocs.map(d => ({ id: d.id, name: d.name, title: d.title }))
      });
      return uniqueDocs;
    }
    if (typeof documents === 'string') {
      try {
        const parsed = JSON.parse(documents);
        if (Array.isArray(parsed)) {
          // Filtere ungültige Dokumente heraus
          return parsed.filter(doc => {
            return doc && typeof doc === 'object' && (doc.id || doc.name || doc.title || doc.file_name);
          });
        }
        return [];
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
                ? 'Keine Dokumente für diese Ausschreibung vorhanden' 
                : 'Keine Dokumente für diese Ausschreibung freigegeben'
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
    <div className="space-y-4">
      {/* Header entfernt - wird vom Haupt-Modal bereitgestellt */}
      
      {viewerError && (
        <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
          <p className="text-red-400 text-sm">{viewerError}</p>
        </div>
      )}
      
      {/* Warnung wenn Dokumente nicht vollständig geladen werden konnten */}
      {documents && Array.isArray(documents) && documents.length > 0 && 
       typeof documents[0] === 'number' && safeDocuments.length === 0 && !isLoadingDocs && (
        <div className="mb-4 p-3 bg-yellow-500/20 border border-yellow-500/30 rounded-lg">
          <p className="text-yellow-400 text-sm">
            ⚠️ Dokumente werden geladen... Falls sie nicht erscheinen, versuchen Sie die Seite neu zu laden.
          </p>
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
                          // Prüfe ob URL bereits ein /documents/ Endpoint ist
                          const docUrl = doc.url || doc.file_path || '';
                          if (docUrl.includes('/documents/') && (docUrl.includes('/content') || docUrl.includes('/download'))) {
                            const response = await fetch(docUrl, {
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
                            const authenticatedUrl = getAuthenticatedFileUrl(docUrl);
                            window.open(authenticatedUrl, '_blank');
                          }
                        }
                      } catch (error) {
                        console.error('âŒ Fehler beim Ã–ffnen des Dokuments:', error);
                        alert('Dokument konnte nicht geÃ¶ffnet werden');
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
  onRejectQuote,
  onTradeUpdate
}: TradeDetailsModalProps) {
  
  // DEBUG: Modal Rendering
  console.log('🚨🚨🚨 TradeDetailsModal RENDER:', { isOpen, tradeId: trade?.id, tradeTitle: trade?.title });
  
  if (!isOpen) {
    return null;
  }
  
  if (!trade) {
    return null;
  }

  // Erweiterte ICS-Download-Funktion mit allen Kontaktinformationen
  const downloadEnhancedCalendarEvent = async (appointment: AppointmentResponse) => {
    try {
      // Erstelle detaillierte Beschreibung mit allen verfügbaren Informationen
      const description = createDetailedDescription(appointment);
      
      // Berechne Start- und Endzeit
      const startDate = new Date(appointment.scheduled_date);
      const endDate = new Date(startDate.getTime() + (appointment.duration_minutes || 60) * 60000);
      
      // Erstelle ICS-Inhalt
      const icsContent = generateICSContent({
        title: appointment.title || 'Besichtigungstermin',
        description: description,
        location: appointment.location || '',
        startDate: startDate,
        endDate: endDate,
        appointmentId: appointment.id
      });
      
      // Download der ICS-Datei - Outlook-optimiert
      const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // Dateiname ohne Sonderzeichen für bessere Kompatibilität
      const dateStr = startDate.toISOString().split('T')[0];
      const safeTitle = (appointment.title || 'Besichtigung').replace(/[^a-zA-Z0-9]/g, '_');
      link.download = `${safeTitle}_${dateStr}.ics`;
      
      // Für bessere Browser-Kompatibilität
      link.setAttribute('download', link.download);
      link.style.display = 'none';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Fehler beim Erstellen des erweiterten Kalendereintrags:', error);
      // Fallback zur Standard-Funktion
      await appointmentService.downloadCalendarEvent(appointment.id);
    }
  };

  // Erstelle detaillierte Beschreibung mit allen verfügbaren Informationen
  const createDetailedDescription = (appointment: AppointmentResponse): string => {
    const parts: string[] = [];
    
    // Grundbeschreibung
    if (appointment.description) {
      parts.push(appointment.description);
      parts.push(''); // Leerzeile
    }
    
    // Projektinformationen
    if (project) {
      parts.push(`PROJEKT: ${project.name || 'Unbekannt'}`);
      if (project.address || project.location || project.city) {
        parts.push(`Projektadresse: ${project.address || project.location || project.city}`);
      }
      parts.push(''); // Leerzeile
    }
    
    // Gewerk-Informationen
    if (trade) {
      parts.push(`GEWERK: ${trade.title}`);
      if (trade.category) {
        parts.push(`Kategorie: ${trade.category}`);
      }
      parts.push(''); // Leerzeile
    }
    
    // Standort-Informationen
    if (appointment.location) {
      parts.push(`ORT: ${appointment.location}`);
    }
    if (appointment.location_details) {
      parts.push(`Ortshinweise: ${appointment.location_details}`);
    }
    
    // Kontaktinformationen - erweitert um alle verfügbaren Felder
    const contactInfo: string[] = [];
    
    // Hauptkontakt
    if ((appointment as any).contact_person) {
      contactInfo.push(`Ansprechpartner: ${(appointment as any).contact_person}`);
    }
    if ((appointment as any).contact_phone) {
      contactInfo.push(`Telefon: ${(appointment as any).contact_phone}`);
    }
    if ((appointment as any).contact_email) {
      contactInfo.push(`E-Mail: ${(appointment as any).contact_email}`);
    }
    
    // Alternativer Kontakt
    if ((appointment as any).alternative_contact_person) {
      contactInfo.push(`Alternativer Kontakt: ${(appointment as any).alternative_contact_person}`);
      if ((appointment as any).alternative_contact_phone) {
        contactInfo.push(`Alt. Telefon: ${(appointment as any).alternative_contact_phone}`);
      }
    }
    
    if (contactInfo.length > 0) {
      parts.push('KONTAKT:');
      parts.push(...contactInfo);
      parts.push(''); // Leerzeile
    }
    
    // Vorbereitungshinweise
    if ((appointment as any).preparation_notes) {
      parts.push('VORBEREITUNGSHINWEISE:');
      parts.push((appointment as any).preparation_notes);
      parts.push(''); // Leerzeile
    }
    
    // Besondere Anforderungen
    if ((appointment as any).special_requirements) {
      parts.push('BESONDERE ANFORDERUNGEN:');
      parts.push((appointment as any).special_requirements);
      parts.push(''); // Leerzeile
    }
    
    // Zusätzliche Ortsangaben
    if ((appointment as any).additional_location_info) {
      parts.push('ZUSÄTZLICHE ORTSANGABEN:');
      parts.push((appointment as any).additional_location_info);
      parts.push(''); // Leerzeile
    }
    
    // Parkinformationen
    if ((appointment as any).parking_info) {
      parts.push('PARKMÖGLICHKEITEN:');
      parts.push((appointment as any).parking_info);
      parts.push(''); // Leerzeile
    }
    
    // Zugangshinweise
    if ((appointment as any).access_instructions) {
      parts.push('ZUGANGSHINWEISE:');
      parts.push((appointment as any).access_instructions);
      parts.push(''); // Leerzeile
    }
    
    
    return parts.join('\\n');
  };

  // Generiere Standard-ICS-Inhalt (minimal und kompatibel) mit korrekter Zeitzone
  const generateICSContent = (event: {
    title: string;
    description: string;
    location: string;
    startDate: Date;
    endDate: Date;
    appointmentId: number;
  }): string => {
    // Formatiere Datum für ICS in lokaler Zeit (ohne UTC-Konvertierung)
    const formatDate = (date: Date): string => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const seconds = String(date.getSeconds()).padStart(2, '0');
      
      // Verwende lokale Zeit ohne 'Z' (floating time)
      return `${year}${month}${day}T${hours}${minutes}${seconds}`;
    };
    
    const now = new Date();
    const uid = `${event.appointmentId}-${now.getTime()}@buildwise`;
    
    console.log('🔍 TradeDetailsModal ICS Generation Debug:', {
      startDate: event.startDate,
      localStartTime: event.startDate.toLocaleString('de-DE'),
      icsStartTime: formatDate(event.startDate),
      endDate: event.endDate,
      icsEndTime: formatDate(event.endDate)
    });
    
    // Escape Sonderzeichen für ICS
    const escapeICSText = (text: string): string => {
      return text
        .replace(/\\/g, '\\\\')
        .replace(/;/g, '\\;')
        .replace(/,/g, '\\,')
        .replace(/\n/g, '\\n')
        .replace(/\r/g, '');
    };
    
    // Minimaler, standardkonformer ICS-Inhalt mit lokaler Zeit
    return [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//BuildWise//Appointment Calendar//DE',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      `UID:${uid}`,
      `DTSTART:${formatDate(event.startDate)}`,
      `DTEND:${formatDate(event.endDate)}`,
      `DTSTAMP:${formatDate(now)}`,
      `SUMMARY:${escapeICSText(event.title)}`,
      `DESCRIPTION:${escapeICSText(event.description)}`,
      event.location ? `LOCATION:${escapeICSText(event.location)}` : '',
      'STATUS:CONFIRMED',
      'TRANSP:OPAQUE',
      'END:VEVENT',
      'END:VCALENDAR'
    ].filter(line => line !== '').join('\r\n');
  };

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
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeletingTrade, setIsDeletingTrade] = useState(false);
  const [bautraegerContact, setBautraegerContact] = useState<any>(null);
  const [loadingBautraegerContact, setLoadingBautraegerContact] = useState(false);
  
  // ResourceAllocations State
  const [resourceAllocations, setResourceAllocations] = useState<ResourceAllocation[]>([]);
  const [loadingResourceAllocations, setLoadingResourceAllocations] = useState(false);

  // Prüft, ob das Gewerk gelöscht werden kann (keine Angebote vorhanden)
  const canDeleteTrade = () => {
    return (existingQuotes || []).length === 0;
  };

  // Löscht das Gewerk
  const handleDeleteTrade = async () => {
    if (!canDeleteTrade()) {
      alert('Gewerk kann nicht gelöscht werden, da bereits Angebote vorliegen');
      return;
    }

    try {
      setIsDeletingTrade(true);
      await deleteMilestone((trade as any).id);
      
      // Schließe das Modal und rufe onClose auf
      onClose();
      
      // Optional: Zeige Erfolgsmeldung
      alert('Ausschreibung wurde erfolgreich gelöscht');
    } catch (error) {
      console.error('❌ Fehler beim Löschen des Gewerks:', error);
      alert('Fehler beim Löschen der Ausschreibung');
    } finally {
      setIsDeletingTrade(false);
      setShowDeleteConfirm(false);
    }
  };
  
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
    // Temporäre Lösung: Simuliere completion_status für Demo-Zwecke
    const simulatedCompletionStatus = trade?.id === 1 ? 'completion_requested' : (trade?.completion_status || 'in_progress');
    const [completionStatus, setCompletionStatus] = useState(simulatedCompletionStatus);
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
  const [acceptanceId, setAcceptanceId] = useState<number | null>(null);
  const [hasFinalAcceptance, setHasFinalAcceptance] = useState(false);
  
  // State für vollständige Trade-Daten vom Backend
  const [fullTradeData, setFullTradeData] = useState<any>(null);
  
  // State für Besichtigungsstatus
  const [inspectionCompleted, setInspectionCompleted] = useState(false);

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

  // Funktion zum Laden der ResourceAllocations für dieses Trade
  const loadResourceAllocations = async () => {
    if (!trade?.id) return;
    
    try {
      setLoadingResourceAllocations(true);
      const allocations = await resourceService.getAllocationsByTrade(trade.id);
      setResourceAllocations(allocations);
      console.log('✅ ResourceAllocations geladen:', allocations);
    } catch (error) {
      console.error('❌ Fehler beim Laden der ResourceAllocations:', error);
    } finally {
      setLoadingResourceAllocations(false);
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
  const [showTradeDetails, setShowTradeDetails] = useState(true);
  
  // Smart default tab selection based on user role and context
  const getDefaultTab = () => {
    // If service provider with accepted quote, always show progress tab
    if (!isBautraeger() && acceptedQuote) {
      return 'progress';
    }
    // If Bautraeger with new quotes to review
    if (isBautraeger() && existingQuotes && existingQuotes.length > 0 && 
        existingQuotes.some(q => q.status === 'submitted')) {
      return 'quotes';
    }
    // If service provider without quote, focus on overview
    if (!isBautraeger() && !acceptedQuote && (!existingQuotes || !existingQuotes.some(q => isUserQuote(q, user)))) {
      return 'overview';
    }
    // Default to overview for most cases
    return 'overview';
  };
  
  const [activeTab, setActiveTab] = useState(getDefaultTab());
  
  // Keyboard navigation for tabs
  const tabs = ['overview', 'quotes', 'documents', 'progress', 'abnahme'];
  
  const handleTabKeyDown = (e: React.KeyboardEvent, tabIndex: number) => {
    if (e.key === 'ArrowLeft' && tabIndex > 0) {
      e.preventDefault();
      setActiveTab(tabs[tabIndex - 1]);
    } else if (e.key === 'ArrowRight' && tabIndex < tabs.length - 1) {
      e.preventDefault();
      setActiveTab(tabs[tabIndex + 1]);
    } else if (e.key === 'Home') {
      e.preventDefault();
      setActiveTab(tabs[0]);
    } else if (e.key === 'End') {
      e.preventDefault();
      setActiveTab(tabs[tabs.length - 1]);
    }
  };

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
      shouldShowInvoiceButton: !isBautraeger() && completionStatus === 'completed' && (!existingInvoice || !['sent', 'viewed', 'paid', 'overdue'].includes(existingInvoice.status)),
      hasFinalAcceptance: hasFinalAcceptance
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
        const relevant = all.filter(a => a.milestone_id === (trade as any).id && (a.appointment_type === 'INSPECTION' || a.appointment_type === 'REVIEW'));
        if (!cancelled) {
          setAppointmentsForTrade(relevant);
          
          // Prüfe ob eine Besichtigung bereits als abgeschlossen markiert wurde
          const hasCompletedInspection = relevant.some(appointment => 
            appointment.appointment_type === 'INSPECTION' && appointment.inspection_completed
          );
          if (hasCompletedInspection) {
            setInspectionCompleted(true);
          }
        }
      } catch (e) {
        console.error('âŒ Termine laden fehlgeschlagen:', e);
      }
    };
    
    if (isOpen) {
      loadFullTradeData();
      loadAppointments();
      loadResourceAllocations();
    }

    // Event-Listener für neu erstellte Termine (z.B. Wiedervorlage-Termine)
    const handleAppointmentCreated = (event: CustomEvent) => {
      console.log('📅 Neuer Termin erstellt, lade Termine neu:', event.detail);
      if (event.detail.milestoneId === trade?.id) {
        console.log('🔄 Lade Termine neu für Trade:', trade?.id);
        loadAppointments();
      }
    };

    // Debug-Funktion: Teste Termine-Erstellung direkt
    const testCreateReviewAppointment = async () => {
      const acceptedQuote = existingQuotes?.find(q => q.status === 'accepted');
      if (!acceptedQuote) {
        alert('Kein angenommenes Angebot gefunden für Test');
        return;
      }
      
      const testDate = new Date();
      testDate.setDate(testDate.getDate() + 7); // 7 Tage in der Zukunft
      const deadline = testDate.toISOString().split('T')[0];
      
      try {
        await createReviewAppointmentForTrade(deadline, 'Test-Wiedervorlage-Termin');
        console.log('✅ Test-Termin erfolgreich erstellt');
      } catch (error) {
        console.error('❌ Test-Termin-Erstellung fehlgeschlagen:', error);
        alert('Fehler beim Erstellen des Test-Termins: ' + (error as Error).message);
      }
    };

    // Temporärer Debug-Button (kann später entfernt werden)
    (window as any).testCreateReviewAppointment = testCreateReviewAppointment;

    window.addEventListener('appointmentCreated', handleAppointmentCreated as EventListener);

    return () => { 
      cancelled = true; 
      window.removeEventListener('appointmentCreated', handleAppointmentCreated as EventListener);
    };
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

  // Hilfsfunktion: Hat aktueller Nutzer (Dienstleister) einen Termin zugesagt?
  const userAcceptedAppointments = React.useMemo(() => {
    if (!user || isBautraeger()) return [];
    
    const acceptedAppointments: Array<{appointment: AppointmentResponse, response: any}> = [];
    
    if (Array.isArray(appointmentsForTrade)) {
      appointmentsForTrade.forEach(ap => {
        // Prüfe verschiedene Response-Strukturen
        let responsesArr: any[] = [];
        
        if (Array.isArray(ap.responses)) {
          responsesArr = ap.responses;
        } else if (Array.isArray((ap as any).responses_array)) {
          responsesArr = (ap as any).responses_array;
        } else if (typeof (ap as any).responses === 'string') {
          try {
            responsesArr = JSON.parse((ap as any).responses);
          } catch (e) {
            responsesArr = [];
          }
        }
        
        // Finde akzeptierte Antworten des aktuellen Benutzers
        const userResponse = responsesArr.find((r: any) => 
          Number(r.service_provider_id) === Number(user.id) && 
          r.status === 'accepted'
        );
        
        if (userResponse) {
          acceptedAppointments.push({
            appointment: ap,
            response: userResponse
          });
        }
      });
    }
    
    return acceptedAppointments;
  }, [appointmentsForTrade, user, isBautraeger]);

  // Bekannte Dokumentennamen (Fallback wenn API versagt)
  const KNOWN_DOCUMENT_NAMES: Record<number, string> = {
    10: "Angebot_Sanitaer_Heizung_Boran",
    12: "Lettenstrasse_Baumeister - F-LV_V2", 
    13: "LSOB-EN"
  };

  // Erstelle Wiedervorlage-Termin bei Abnahme unter Vorbehalt
  const createReviewAppointmentForTrade = async (deadline: string, notes?: string) => {
    try {
      console.log('📅 Erstelle Wiedervorlage-Termin für Trade:', trade?.id);

      // Berechne Terminzeit (standardmäßig 14:00 Uhr)
      const appointmentDate = new Date(deadline);
      appointmentDate.setHours(14, 0, 0, 0); // 14:00 Uhr

      // Finde den beauftragten Dienstleister aus den existingQuotes
      const acceptedQuote = existingQuotes?.find(q => q.status === 'accepted');
      const serviceProviderId = acceptedQuote?.service_provider_id;

      if (!serviceProviderId) {
        console.warn('⚠️ Kein beauftragter Dienstleister gefunden für Wiedervorlage-Termin');
        throw new Error('Kein beauftragter Dienstleister gefunden');
      }

      // Sammle alle relevanten Informationen für den Termin
      const appointmentData = {
        title: `Wiedervorlage: ${trade?.title || 'Gewerk-Abnahme'}`,
        description: `Wiedervorlage-Termin für die finale Abnahme des Gewerks "${trade?.title}"\n\n` +
          `Grund der Wiedervorlage: Abnahme unter Vorbehalt\n` +
          `${notes ? `\nNotizen: ${notes}` : ''}` +
          `\nBitte prüfen Sie die behobenen Mängel vor dem Termin.`,
        scheduled_date: appointmentDate.toISOString(),
        duration_minutes: 120, // 2 Stunden für Wiedervorlage
        location: project?.address || project?.location || 'Projektadresse',
        location_details: 'Wiedervorlage-Termin für finale Gewerk-Abnahme',
        appointment_type: 'REVIEW' as const,
        milestone_id: trade?.id,
        project_id: project?.id,
        contact_person: project?.owner_name || user?.full_name || 'Bauträger',
        contact_phone: project?.owner_phone || user?.phone,
        preparation_notes: 'Bitte prüfen Sie die behobenen Mängel vor dem Termin',
        // KRITISCH: Lade nur den beauftragten Dienstleister ein
        invited_service_provider_ids: [Number(serviceProviderId)]
      };

      console.log('📅 Wiedervorlage-Termin Daten:', appointmentData);
      console.log('👥 Eingeladener Dienstleister:', serviceProviderId);
      console.log('👤 Beauftragter Dienstleister Details:', acceptedQuote);

      // Erstelle den Termin über den appointmentService
      const createdAppointment = await appointmentService.createAppointment(appointmentData);

      console.log('✅ Wiedervorlage-Termin erfolgreich erstellt:', createdAppointment);

      // Event für andere Komponenten auslösen
      window.dispatchEvent(new CustomEvent('appointmentCreated', {
        detail: {
          type: 'review',
          appointment: createdAppointment,
          milestoneId: trade?.id
        }
      }));

      // Erfolgs-Benachrichtigung
      const reviewDateFormatted = new Date(deadline).toLocaleDateString('de-DE', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
      
      alert(`✅ Wiedervorlage-Termin erfolgreich erstellt!\n\n` +
            `📅 Datum: ${reviewDateFormatted} um 14:00 Uhr\n` +
            `📍 Ort: ${project?.address || 'Projektadresse'}\n` +
            `👤 Dienstleister: ${acceptedQuote?.company_name || acceptedQuote?.contact_person}\n\n` +
            `Der Termin wurde automatisch erstellt und beide Parteien können ihn in ihrem Kalender einsehen.`);

    } catch (error) {
      console.error('❌ Fehler beim Erstellen des Wiedervorlage-Termins:', error);
      throw error;
    }
  };

  // Hilfsfunktion: Robuste Dokumentenverarbeitung
  const processDocuments = async (documentsData: any, baseUrl: string, token: string): Promise<any[]> => {
    let documents: any[] = [];
    
    if (!documentsData) return documents;
    
    // Fall 1: Array von Dokumenten
    if (Array.isArray(documentsData)) {
      if (documentsData.length === 0) return documents;
      
      // Prüfe ob es vollständige Dokument-Objekte oder nur IDs sind
      const firstItem = documentsData[0];
      if (typeof firstItem === 'number') {
        // Es sind nur Document-IDs - lade die vollständigen Dokumente
        console.log('🔄 Dokumente sind nur IDs, lade vollständige Dokumente:', documentsData);
        const docPromises = documentsData.map(async (docId: number) => {
                            try {
                    const docResponse = await fetch(`${baseUrl}/documents/${docId}/info`, {
                      headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                      }
                    });
                    
                    if (docResponse.ok) {
                      const docData = await docResponse.json();
                      
                      // Prüfe ob API echte Daten zurückgegeben hat oder nur leere/generische Daten
                      const hasValidTitle = docData.title && docData.title !== `Dokument ${docId}` && docData.title.trim() !== '';
                      const hasValidFileName = docData.file_name && docData.file_name !== `document_${docId}.pdf` && docData.file_name.trim() !== '';
                      
                      if (hasValidTitle || hasValidFileName) {
                        console.log(`✅ ECHTER NAME für Dokument ${docId}: "${docData.title}"`);
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
                      } else {
                        // API gab leere/generische Daten zurück - verwende hardcoded Namen
                        const knownName = KNOWN_DOCUMENT_NAMES[docId] || `Dokument ${docId}`;
                        console.log(`🔄 API-Daten leer für Dokument ${docId}, verwende KNOWN NAME: "${knownName}"`);
                        return {
                          id: docData.id || docId,
                          name: knownName,
                          title: knownName,
                          file_name: `${knownName.replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`,
                          url: `/api/v1/documents/${docId}/download`,
                          file_path: `/api/v1/documents/${docId}/download`,
                          type: docData.mime_type || 'application/pdf',
                          mime_type: docData.mime_type || 'application/pdf',
                          size: docData.file_size || 0,
                          file_size: docData.file_size || 0,
                          category: docData.category || 'planning',
                          subcategory: docData.subcategory || 'Dokumente',
                          created_at: docData.created_at || new Date().toISOString()
                        };
                      }
                    } else {
                      console.error(`❌ API-Fehler für Dokument ${docId}:`, docResponse.status, docResponse.statusText);
                      const knownName = KNOWN_DOCUMENT_NAMES[docId] || `Dokument ${docId}`;
                      console.log(`❌ FALLBACK NAME für Dokument ${docId}: "${knownName}"`);
                      // Fallback: Erstelle ein minimales Dokument-Objekt
                      return {
                        id: docId,
                        name: knownName,
                        title: knownName,
                        file_name: `${knownName.replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`,
                        url: `/api/v1/documents/${docId}/download`,
                        file_path: `/api/v1/documents/${docId}/download`,
                        type: 'application/pdf',
                        mime_type: 'application/pdf',
                        size: 0,
                        file_size: 0,
                        category: 'documentation',
                        subcategory: null,
                        created_at: new Date().toISOString()
                      };
                    }
                  } catch (e) {
                    console.error(`❌ Fehler beim Laden des Dokuments ${docId}:`, e);
                    const knownName = KNOWN_DOCUMENT_NAMES[docId] || `Dokument ${docId}`;
                    console.log(`❌ EXCEPTION FALLBACK NAME für Dokument ${docId}: "${knownName}"`);
                    // Fallback: Erstelle ein minimales Dokument-Objekt
                    return {
                      id: docId,
                      name: knownName,
                      title: knownName,
                      file_name: `${knownName.replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`,
                      url: `/api/v1/documents/${docId}/download`,
                      file_path: `/api/v1/documents/${docId}/download`,
                      type: 'application/pdf',
                      mime_type: 'application/pdf',
                      size: 0,
                      file_size: 0,
                      category: 'documentation',
                      subcategory: null,
                      created_at: new Date().toISOString()
                    };
                  }
        });
        
        const loadedDocs = await Promise.all(docPromises);
        documents = loadedDocs.filter(doc => doc !== null);
      } else if (typeof firstItem === 'object' && firstItem.id) {
        // Es sind bereits vollständige Dokument-Objekte
        documents = documentsData;
      }
    }
    // Fall 2: String mit JSON
    else if (typeof documentsData === 'string') {
      try {
        // Behandle doppelt gequotete Strings wie '"[13]"'
        let stringToParse = documentsData;
        if (documentsData.startsWith('"') && documentsData.endsWith('"')) {
          stringToParse = documentsData.slice(1, -1); // Entferne äußere Anführungszeichen
          console.log('🔧 Entferne doppelte Anführungszeichen:', documentsData, '->', stringToParse);
        }
        
        const parsed = JSON.parse(stringToParse);
        return await processDocuments(parsed, baseUrl, token); // Rekursiver Aufruf
      } catch (e) {
        console.error('❌ Fehler beim Parsen der Dokumente:', e);
        console.error('❌ Problematischer String:', documentsData);
      }
    }
    
    return documents;
  };

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
        throw new Error('Kein Authentifizierungstoken verfügbar');
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
        
        // Aktualisiere vollständige Trade-Daten
        setFullTradeData(milestoneData);
        
        // KRITISCH: Aktualisiere completion_status vom Backend
        if (milestoneData.completion_status) {
          console.log('ðŸ”„ TradeDetailsModal - Aktualisiere completion_status vom Backend:', milestoneData.completion_status);
          setCompletionStatus(milestoneData.completion_status);
        }
        
        // Extrahiere und verarbeite die Dokumente
        let documents = [];
        if (milestoneData.documents) {
          if (Array.isArray(milestoneData.documents)) {
            documents = await processDocuments(milestoneData.documents, baseUrl, token);
          } else if (typeof milestoneData.documents === 'string') {
            try {
              documents = await processDocuments(milestoneData.documents, baseUrl, token);
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
                  // Fallback: Erstelle ein minimales Dokument-Objekt
                  const knownName = KNOWN_DOCUMENT_NAMES[docId] || `Dokument ${docId}`;
                  console.log(`❌ SHARED DOCS FALLBACK NAME für Dokument ${docId}: "${knownName}"`);
                  return {
                    id: docId,
                    name: knownName,
                    title: knownName,
                    file_name: `${knownName.replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`,
                    url: `/api/v1/documents/${docId}/download`,
                    file_path: `/api/v1/documents/${docId}/download`,
                    type: 'application/pdf',
                    mime_type: 'application/pdf',
                    size: 0,
                    file_size: 0,
                    category: 'documentation',
                    subcategory: null,
                    created_at: new Date().toISOString()
                  };
                } catch (e) {
                  console.error(`âŒ Fehler beim Laden des geteilten Dokuments ${docId}:`, e);
                  // Fallback: Erstelle ein minimales Dokument-Objekt
                  const knownName = KNOWN_DOCUMENT_NAMES[docId] || `Dokument ${docId}`;
                  console.log(`❌ SHARED DOCS FALLBACK NAME für Dokument ${docId}: "${knownName}"`);
                  return {
                    id: docId,
                    name: knownName,
                    title: knownName,
                    file_name: `${knownName.replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`,
                    url: `/api/v1/documents/${docId}/download`,
                    file_path: `/api/v1/documents/${docId}/download`,
                    type: 'application/pdf',
                    mime_type: 'application/pdf',
                    size: 0,
                    file_size: 0,
                    category: 'documentation',
                    subcategory: null,
                    created_at: new Date().toISOString()
                  };
                }
              });
              
              const sharedDocs = await Promise.all(sharedDocsPromises);
              const validSharedDocs = sharedDocs; // Alle Dokumente sind jetzt gültig (Fallbacks erstellt)
              
              console.log('ðŸ“„ TradeDetailsModal - Geteilte Dokumente geladen:', validSharedDocs);
              // Kombiniere Dokumente und entferne Duplikate basierend auf ID (String/Number-sicher)
              const allDocs = [...documents, ...validSharedDocs];
              documents = allDocs.filter((doc, index, self) => 
                index === self.findIndex(d => String(d.id) === String(doc.id))
              );
              console.log('ðŸ"„ TradeDetailsModal - Duplikate entfernt. Vorher:', allDocs.length, 'Nachher:', documents.length);
            }
          } catch (e) {
            console.error('âŒ Fehler beim Verarbeiten der geteilten Dokumente:', e);
          }
        }
        
        console.log('📄 TradeDetailsModal - Finale Dokumentenliste (Bauträger):', documents);
        console.log('📄 TradeDetailsModal - Anzahl Dokumente:', documents.length);
        documents.forEach((doc: any, index: number) => {
          console.log(`📄 Dokument ${index + 1}:`, {
            id: doc.id,
            name: doc.name,
            url: doc.url,
            file_path: doc.file_path,
            source: doc.url?.includes('/documents/') ? 'shared_documents' : 'documents'
          });
        });
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
            documents = await processDocuments(milestoneData.documents, baseUrl, token);
          } else if (typeof milestoneData.documents === 'string') {
            try {
              documents = await processDocuments(milestoneData.documents, baseUrl, token);
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
                  // Fallback: Erstelle ein minimales Dokument-Objekt
                  const knownName = KNOWN_DOCUMENT_NAMES[docId] || `Dokument ${docId}`;
                  console.log(`❌ SHARED DOCS FALLBACK NAME für Dokument ${docId}: "${knownName}"`);
                  return {
                    id: docId,
                    name: knownName,
                    title: knownName,
                    file_name: `${knownName.replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`,
                    url: `/api/v1/documents/${docId}/download`,
                    file_path: `/api/v1/documents/${docId}/download`,
                    type: 'application/pdf',
                    mime_type: 'application/pdf',
                    size: 0,
                    file_size: 0,
                    category: 'documentation',
                    subcategory: null,
                    created_at: new Date().toISOString()
                  };
                } catch (e) {
                  console.error(`âŒ Fehler beim Laden des geteilten Dokuments ${docId}:`, e);
                  // Fallback: Erstelle ein minimales Dokument-Objekt
                  const knownName = KNOWN_DOCUMENT_NAMES[docId] || `Dokument ${docId}`;
                  console.log(`❌ SHARED DOCS FALLBACK NAME für Dokument ${docId}: "${knownName}"`);
                  return {
                    id: docId,
                    name: knownName,
                    title: knownName,
                    file_name: `${knownName.replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`,
                    url: `/api/v1/documents/${docId}/download`,
                    file_path: `/api/v1/documents/${docId}/download`,
                    type: 'application/pdf',
                    mime_type: 'application/pdf',
                    size: 0,
                    file_size: 0,
                    category: 'documentation',
                    subcategory: null,
                    created_at: new Date().toISOString()
                  };
                }
              });
              
              const sharedDocs = await Promise.all(sharedDocsPromises);
              const validSharedDocs = sharedDocs; // Alle Dokumente sind jetzt gültig (Fallbacks erstellt)
              
              console.log('ðŸ“„ TradeDetailsModal - Geteilte Dokumente geladen:', validSharedDocs);
              // Kombiniere Dokumente und entferne Duplikate basierend auf ID (String/Number-sicher)
              const allDocs = [...documents, ...validSharedDocs];
              documents = allDocs.filter((doc, index, self) => 
                index === self.findIndex(d => String(d.id) === String(doc.id))
              );
              console.log('ðŸ"„ TradeDetailsModal - Duplikate entfernt. Vorher:', allDocs.length, 'Nachher:', documents.length);
            }
          } catch (e) {
            console.error('âŒ Fehler beim Verarbeiten der geteilten Dokumente:', e);
          }
        }
        
        console.log('📄 TradeDetailsModal - Finale Dokumentenliste (Dienstleister):', documents);
        console.log('📄 TradeDetailsModal - Anzahl Dokumente:', documents.length);
        console.log('📄 TradeDetailsModal - Rohdaten:', {
          originalDocuments: milestoneData.documents,
          originalSharedDocIds: milestoneData.shared_document_ids,
          processedDocuments: documents
        });
        documents.forEach((doc: any, index: number) => {
          console.log(`📄 Dokument ${index + 1}:`, {
            id: doc.id,
            name: doc.name,
            url: doc.url,
            file_path: doc.file_path,
            source: doc.url?.includes('/documents/') ? 'shared_documents' : 'documents'
          });
        });
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
      // WICHTIG: Lade immer Mängel-Daten beim Modal-Öffnen
      loadAcceptanceDefects();
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

    // Lade Bauträger-Kontaktdaten - verschiedene Ansätze
    const loadBautraegerContact = async () => {
      console.log('🔍 DEBUG: loadBautraegerContact aufgerufen', {
        tradeId: trade?.id,
        tradeCreatedBy: (trade as any)?.created_by,
        projectId: project?.id,
        projectObject: project,
        tradeObject: trade,
        isBautraeger: isBautraeger()
      });
      
      if (!trade?.id) {
        console.log('❌ DEBUG: Keine trade.id vorhanden');
        return;
      }
      
      try {
        setLoadingBautraegerContact(true);
        
        // Ansatz 1: Versuche über Milestone-Details (falls created_by dort verfügbar)
        console.log('🔄 DEBUG: Versuche Milestone-Details zu laden für ID:', trade.id);
        
        const { api } = await import('../api/api');
        
        try {
          // Lade vollständige Milestone-Daten
          const milestoneResponse = await api.get(`/milestones/${trade.id}`);
          console.log('📡 DEBUG: Milestone API Response:', milestoneResponse);
          console.log('📡 DEBUG: Milestone Response Data:', milestoneResponse.data);
          console.log('📡 DEBUG: Milestone created_by:', milestoneResponse.data?.created_by);
          
          if (milestoneResponse.data && milestoneResponse.data.created_by) {
            console.log('✅ DEBUG: created_by gefunden in Milestone-Daten:', milestoneResponse.data.created_by);
            
            try {
              // Versuche verschiedene User-API-Endpoints
              const userId = milestoneResponse.data.created_by;
              console.log('🔄 DEBUG: Versuche User-Daten für ID zu laden:', userId);
              
              // Korrekter Endpoint: /users/profile/{id}
              try {
                console.log('🔄 DEBUG: Versuche /users/profile/{id}');
                const userResponse = await api.get(`/users/profile/${userId}`);
                console.log('📡 DEBUG: User API Response (/users/profile/{id}):', userResponse);
                
                if (userResponse.data) {
                  setBautraegerContact(userResponse.data);
                  console.log('✅ Bauträger-Kontaktdaten geladen über /users/profile/{id}:', userResponse.data);
                  return;
                }
              } catch (error1) {
                console.log('❌ DEBUG: /users/profile/{id} fehlgeschlagen:', error1.message);
                console.log('❌ DEBUG: Error Details:', {
                  status: error1.response?.status,
                  statusText: error1.response?.statusText,
                  data: error1.response?.data
                });
              }
              
              console.log('❌ DEBUG: User-API-Endpoint fehlgeschlagen');
              
            } catch (userError) {
              console.error('❌ DEBUG: Fehler beim Laden der User-Daten:', userError);
            }
          } else {
            console.log('❌ DEBUG: Kein created_by in Milestone-Daten gefunden');
            console.log('❌ DEBUG: Milestone-Daten Struktur:', Object.keys(milestoneResponse.data || {}));
          }
        } catch (milestoneError) {
          console.error('❌ DEBUG: Fehler beim Laden der Milestone-Daten:', milestoneError);
        }
        
        // Ansatz 2: Verwende Projekt-Kontaktdaten als Hauptquelle
        console.log('🔍 DEBUG: Prüfe Projekt-Kontaktdaten:', {
          projectExists: !!project,
          projectId: project?.id,
          projectName: project?.name,
          contactPerson: project?.contact_person,
          contactEmail: project?.contact_email,
          contactPhone: project?.contact_phone,
          address: project?.address,
          hasContactData: !!(project?.contact_person || project?.contact_email || project?.contact_phone || project?.name)
        });
        
        if (project && (project.contact_person || project.contact_email || project.contact_phone || project.name)) {
          console.log('🔄 DEBUG: Verwende Projekt-Kontaktdaten als Hauptquelle');
          console.log('📊 DEBUG: Projekt-Daten:', {
            name: project.name,
            contact_person: project.contact_person,
            contact_email: project.contact_email,
            contact_phone: project.contact_phone,
            address: project.address
          });
          
          setBautraegerContact({
            first_name: project.contact_person?.split(' ')[0] || '',
            last_name: project.contact_person?.split(' ').slice(1).join(' ') || '',
            company_name: project.name || '',
            email: project.contact_email || '',
            phone: project.contact_phone || '',
            company_address: project.address || ''
          });
          console.log('✅ Projekt-Kontaktdaten verwendet');
          return;
        } else {
          console.log('❌ DEBUG: Projekt-Kontaktdaten nicht verfügbar oder Bedingung nicht erfüllt');
        }
        
        // Ansatz 3: Versuche über Projekt-Details
        if (project?.id) {
          console.log('🔄 DEBUG: Versuche Projekt-Details zu laden für ID:', project.id);
          
          try {
            const projectResponse = await api.get(`/projects/${project.id}`);
            console.log('📡 DEBUG: Projekt API Response:', projectResponse);
            
            if (projectResponse.data && projectResponse.data.owner_id) {
              console.log('✅ DEBUG: owner_id gefunden in Projekt-Daten:', projectResponse.data.owner_id);
              
              // Versuche korrekten User-Endpoint für owner_id
              const ownerId = projectResponse.data.owner_id;
              
              try {
                const userResponse = await api.get(`/users/profile/${ownerId}`);
                if (userResponse.data) {
                  setBautraegerContact(userResponse.data);
                  console.log('✅ Bauträger-Kontaktdaten über Projekt-Owner geladen:', userResponse.data);
                  return;
                }
              } catch (error) {
                console.log('❌ DEBUG: /users/profile/{owner_id} fehlgeschlagen:', error.message);
              }
            }
          } catch (projectError) {
            console.log('❌ DEBUG: Projekt-Details laden fehlgeschlagen:', projectError.message);
          }
        }
        
        // Fallback: Verwende grundlegende Projekt-Informationen
        if (project && project.name) {
          console.log('🔄 DEBUG: Verwende grundlegende Projekt-Informationen als Fallback');
          setBautraegerContact({
            first_name: '',
            last_name: '',
            company_name: project.name,
            email: '',
            phone: '',
            company_address: project.address || ''
          });
          console.log('✅ Grundlegende Projekt-Informationen verwendet');
          return;
        }
        
        // Letzter Fallback: Zeige generische Bauträger-Informationen
        console.log('🔄 DEBUG: Verwende generische Bauträger-Informationen als letzten Fallback');
        setBautraegerContact({
          first_name: '',
          last_name: '',
          company_name: 'Bauträger',
          email: '',
          phone: '',
          company_address: ''
        });
        console.log('✅ Generische Bauträger-Informationen verwendet');
        
      } catch (error: any) {
        console.error('❌ Fehler beim Laden der Bauträger-Kontaktdaten:', error);
        console.log('❌ DEBUG: Error Details:', {
          message: error.message,
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data
        });
        setBautraegerContact(null);
      } finally {
        setLoadingBautraegerContact(false);
      }
    };

    // Lade bestehende Rechnung wenn Modal geöffnet wird - nach Abschluss des Gewerks
    useEffect(() => {
      if (isOpen && trade?.id && (completionStatus === 'completed' || completionStatus === 'completed_with_defects')) {
        loadExistingInvoice();
      }
    }, [isOpen, trade?.id, completionStatus]);

    // Lade Bauträger-Kontaktdaten wenn Modal geöffnet wird
    useEffect(() => {
      console.log('🔍 DEBUG: useEffect für loadBautraegerContact', {
        isOpen,
        tradeId: trade?.id,
        projectId: project?.id,
        isBautraeger: isBautraeger(),
        shouldLoad: isOpen && trade?.id && !isBautraeger()
      });
      
      if (isOpen && trade?.id && !isBautraeger()) {
        console.log('✅ DEBUG: Bedingungen erfüllt, lade Kontaktdaten');
        loadBautraegerContact();
      } else {
        console.log('❌ DEBUG: Bedingungen nicht erfüllt, lade keine Kontaktdaten');
      }
    }, [isOpen, trade?.id, project?.id]);

    // Prüfe finale Abnahme-Status wenn Modal geöffnet wird
    useEffect(() => {
      if (isOpen && trade?.id && completionStatus === 'completed') {
        checkFinalAcceptance();
      }
    }, [isOpen, trade?.id, completionStatus]);

    // Lade das Angebot des aktuellen Dienstleisters aus existingQuotes
    useEffect(() => {
      if (isOpen && !isBautraeger() && user?.id) {
        setUserQuoteLoading(true);
        
        console.log('🔍 DEBUG: Suche nach Benutzer-Quote', {
          userId: user.id,
          userIdType: typeof user.id,
          userObject: user,
          existingQuotesLength: existingQuotes?.length || 0,
          existingQuotes: (existingQuotes || []).map(q => ({
            id: q.id,
            service_provider_id: q.service_provider_id,
            service_provider_id_type: typeof q.service_provider_id,
            status: q.status,
            title: q.title,
            quote_number: q.quote_number,
            qualifications: q.qualifications,
            technical_approach: q.technical_approach
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
        const foundUserQuote = (existingQuotes || []).find(q => isUserQuote(q, user));
        
        if (foundUserQuote) {
          setUserQuote(foundUserQuote);
          console.log('✅ Benutzer-Quote aus existingQuotes gefunden:', {
            id: foundUserQuote.id,
            title: foundUserQuote.title,
            status: foundUserQuote.status,
            quote_number: foundUserQuote.quote_number,
            qualifications: foundUserQuote.qualifications,
            technical_approach: foundUserQuote.technical_approach,
            hasNewFields: !!(foundUserQuote.quote_number || foundUserQuote.qualifications)
          });
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
      
      // Lade zuerst die Abnahme-ID
      try {
        const acceptanceResponse = await api.get(`/acceptance/milestone/${trade.id}`);
        if (acceptanceResponse.data && acceptanceResponse.data.length > 0) {
          const latestAcceptance = acceptanceResponse.data[acceptanceResponse.data.length - 1];
          setAcceptanceId(latestAcceptance.id);
          console.log('✅ Abnahme-ID gesetzt:', latestAcceptance.id);
        }
      } catch (acceptanceError) {
        console.warn('⚠️ Keine Abnahme gefunden, verwende Standard-ID');
        setAcceptanceId(1);
      }
      
      // Lade dann die Mängel
      const response = await api.get(`/acceptance/milestone/${trade.id}/defects`);
      setAcceptanceDefects(response.data || []);
      console.log('✅ Abnahme-Mängel geladen:', response.data);
    } catch (error) {
      console.error('❌ Fehler beim Laden der Abnahme-Mängel:', error);
      setAcceptanceDefects([]);
      setAcceptanceId(1); // Fallback
    }
  };

  // Prüfe ob finale Abnahme durch Bauträger stattgefunden hat
  const checkFinalAcceptance = async () => {
    if (!trade?.id) return;
    
    try {
      const { api } = await import('../api/api');
      
      // Lade alle Abnahmen für diesen Milestone
      const acceptanceResponse = await api.get(`/acceptance/milestone/${trade.id}`);
      if (acceptanceResponse.data && acceptanceResponse.data.length > 0) {
        // Prüfe ob eine Abnahme eine final_completion_date hat (= finale Bauträger-Abnahme)
        const hasFinal = acceptanceResponse.data.some((acceptance: any) => acceptance.final_completion_date);
        setHasFinalAcceptance(hasFinal);
        console.log('🔍 Finale Abnahme-Status:', hasFinal ? 'Vorhanden' : 'Nicht vorhanden');
      } else {
        setHasFinalAcceptance(false);
      }
    } catch (error) {
      console.error('❌ Fehler beim Prüfen der finalen Abnahme:', error);
      setHasFinalAcceptance(false);
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
          message: 'Ausschreibung fertiggestellt. Bitte um Abnahme.'
        })
      });
      
      console.log('✅ TradeDetailsModal - Abnahme-Anfrage erfolgreich:', response);
      setCompletionStatus('completion_requested');
      
      // Benachrichtige Parent-Komponente über Status-Änderung
      if (onTradeUpdate && trade) {
        onTradeUpdate({ ...trade, completion_status: 'completion_requested' });
      }
      
      // Führe Post-Completion-Aktionen aus
      await handlePostCompletionActions();
      
      // Aktualisiere auch den Fortschritt
      if (trade?.id) {
        loadTradeDocuments(trade.id);
      }
    } catch (error) {
      console.error('âŒ TradeDetailsModal - Fehler bei Fertigstellungsmeldung:', error);
      alert('Fehler beim Anfordern der Abnahme. Bitte versuchen Sie es erneut.');
    }
  };

  // Post-Completion-Aktionen: Benachrichtigung und Kanban-Task erstellen
  const handlePostCompletionActions = async () => {
    if (!trade || !user) {
      console.log('⚠️ Keine Trade- oder User-Daten verfügbar');
      return;
    }

    // Verhindere mehrfache Ausführung - prüfe ob bereits eine Task für diese Trade existiert
    const taskCheckKey = `completion_task_created_${trade.id}`;
    if (sessionStorage.getItem(taskCheckKey)) {
      console.log('⚠️ Post-Completion-Aktionen bereits ausgeführt für Trade:', trade.id);
      return;
    }

    try {
      console.log('🔄 Starte Post-Completion-Aktionen für Trade:', trade.id);
      
      // Markiere als in Bearbeitung
      sessionStorage.setItem(taskCheckKey, 'true');

      // 1. Benachrichtigung für Bauträger erstellen
      await createCompletionNotification();
      
      // 2. Kanban-Task für Abnahme erstellen
      await createAcceptanceTask();
      
      // 3. Optional: E-Mail-Benachrichtigung senden
      await sendCompletionEmailNotification();
      
      console.log('✅ Alle Post-Completion-Aktionen erfolgreich abgeschlossen');
    } catch (error: any) {
      console.error('❌ Fehler bei Post-Completion-Aktionen:', error);
      // Entferne den Lock bei Fehlern, damit es erneut versucht werden kann
      sessionStorage.removeItem(taskCheckKey);
    }
  };

  // Benachrichtigung für Bauträger erstellen
  const createCompletionNotification = async () => {
    try {
      console.log('🔔 Erstelle Benachrichtigung für Bauträger...');
      
      const notificationData = {
        project_id: trade?.project_id,
        title: 'Ausschreibung fertiggestellt',
        message: `Die Ausschreibung "${trade?.title}" wurde vom Dienstleister als fertiggestellt markiert und wartet auf Ihre Abnahme.`,
        type: 'completion',
        related_id: trade?.id,
        priority: 'high'
      };

      const response = await apiCall('/notifications', {
        method: 'POST',
        body: JSON.stringify(notificationData)
      });

      console.log('✅ Benachrichtigung erstellt:', response);
      
      // Event für Echtzeit-Updates
      window.dispatchEvent(new CustomEvent('notificationCreated', { 
        detail: response 
      }));

    } catch (error: any) {
      console.error('❌ Fehler beim Erstellen der Benachrichtigung:', error);
      throw error;
    }
  };

  // Kanban-Task für Abnahme erstellen
  const createAcceptanceTask = async () => {
    try {
      console.log('📋 Erstelle Kanban-Task für Abnahme...');
      
      const taskData = {
        title: `Abnahme: ${trade?.title}`,
        description: `**Ausschreibung fertiggestellt - Abnahme erforderlich**

📋 **Ausschreibung:** ${trade?.title}
🏗️ **Gewerk:** ${trade?.category || 'Nicht spezifiziert'}
👤 **Dienstleister:** ${user?.first_name} ${user?.last_name}
📅 **Fertiggestellt am:** ${new Date().toLocaleDateString('de-DE')}

**Nächste Schritte:**
- [ ] Arbeiten vor Ort prüfen
- [ ] Qualität bewerten
- [ ] Abnahme durchführen oder Mängel dokumentieren

**Status:** Wartet auf Bauträger-Abnahme`,
        status: 'todo',
        priority: 'high',
        project_id: trade?.project_id || 1,
        assigned_to: null, // Wird vom Backend basierend auf project_id zugewiesen
        due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 Tage
        estimated_hours: 2
      };

      const response = await apiCall('/tasks', {
        method: 'POST',
        body: JSON.stringify(taskData)
      });

      console.log('✅ Kanban-Task erstellt:', response);
      
      // Event für Echtzeit-Updates
      window.dispatchEvent(new CustomEvent('taskCreated', { 
        detail: response 
      }));

    } catch (error: any) {
      console.error('❌ Fehler beim Erstellen des Kanban-Tasks:', error);
      throw error;
    }
  };

  // E-Mail-Benachrichtigung senden
  const sendCompletionEmailNotification = async () => {
    try {
      console.log('📧 Sende E-Mail-Benachrichtigung...');
      
      const emailData = {
        project_id: trade?.project_id,
        subject: `Ausschreibung fertiggestellt: ${trade?.title}`,
        template: 'completion_notification',
        data: {
          trade_title: trade?.title,
          service_provider_name: `${user?.first_name} ${user?.last_name}`,
          completion_date: new Date().toLocaleDateString('de-DE'),
          trade_category: trade?.category || 'Nicht spezifiziert'
        }
      };

      const response = await apiCall('/notifications/email', {
        method: 'POST',
        body: JSON.stringify(emailData)
      });

      console.log('✅ E-Mail-Benachrichtigung gesendet:', response);

    } catch (error: any) {
      console.error('❌ Fehler beim Senden der E-Mail-Benachrichtigung:', error);
      // E-Mail-Fehler sind nicht kritisch, daher werfen wir hier keinen Error
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
          message: message || (accepted ? 'Ausschreibung abgenommen.' : 'Nachbesserung erforderlich.'),
          revision_deadline: deadline
        })
      });
      
      console.log('âœ… TradeDetailsModal - Abnahme-Antwort erfolgreich:', response);
      const newStatus = accepted ? 'completed' : 'under_review';
      setCompletionStatus(newStatus);
      
      // Benachrichtige Parent-Komponente über Status-Änderung
      if (onTradeUpdate && trade) {
        onTradeUpdate({ ...trade, completion_status: newStatus });
      }
      
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

  // Abnahme-Workflow Komponente für Dienstleister - bedingte Platzierung
  const renderAbnahmeWorkflow = () => (
    <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-4">
      <h3 className="text-lg font-semibold text-orange-300 mb-3 flex items-center gap-2">
        <Settings size={20} />
        Abnahme-Workflow
      </h3>
      
      {/* Status-Banner */}
      <div className={`mb-4 p-3 rounded-lg border ${
        completionStatus === 'completed' 
          ? 'bg-green-500/10 border-green-500/30' 
          : completionStatus === 'completed_with_defects'
          ? 'bg-yellow-500/10 border-yellow-500/30'
          : completionStatus === 'defects_resolved'
          ? 'bg-blue-500/10 border-blue-500/30'
          : completionStatus === 'completion_requested'
          ? 'bg-orange-500/10 border-orange-500/30'
          : 'bg-blue-500/10 border-blue-500/30'
      }`}>
        <div className="flex items-center gap-3">
          {completionStatus === 'completed' ? (
            <>
              <CheckCircle size={20} className="text-green-400" />
              <div>
                <h4 className="text-green-300 font-medium">Gewerk vollständig abgeschlossen</h4>
                <p className="text-green-200 text-sm">Das Gewerk wurde erfolgreich und ohne Mängel abgenommen.</p>
              </div>
            </>
          ) : completionStatus === 'completed_with_defects' ? (
            <>
              <AlertTriangle size={20} className="text-yellow-400" />
              <div>
                <h4 className="text-yellow-300 font-medium">Abnahme unter Vorbehalt</h4>
                <p className="text-yellow-200 text-sm">
                  Es wurden Mängel dokumentiert. Bitte beheben Sie diese für die finale Abnahme.
                </p>
              </div>
            </>
          ) : completionStatus === 'defects_resolved' ? (
            <>
              <CheckCircle size={20} className="text-blue-400" />
              <div>
                <h4 className="text-blue-300 font-medium">Mängelbehebung gemeldet</h4>
                <p className="text-blue-200 text-sm">
                  Sie haben die Mängelbehebung gemeldet. Der Bauträger wird die finale Abnahme durchführen.
                </p>
              </div>
            </>
          ) : completionStatus === 'completion_requested' ? (
            <>
              <AlertTriangle size={20} className="text-orange-400" />
              <div>
                <h4 className="text-orange-300 font-medium">Fertigstellung gemeldet</h4>
                <p className="text-orange-200 text-sm">
                  Sie haben die Fertigstellung gemeldet. Der Bauträger wird die Abnahme durchführen.
                </p>
              </div>
            </>
          ) : (
            <>
              <Clock size={20} className="text-blue-400" />
              <div>
                <h4 className="text-blue-300 font-medium">Gewerk in Bearbeitung</h4>
                <p className="text-blue-200 text-sm">Das Gewerk ist noch nicht zur Abnahme bereit.</p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Abnahme-Aktionen für Dienstleister - Fertigstellung wird über TradeProgress-Komponente gehandhabt */}
      <div className="space-y-3">
        
        {completionStatus === 'completed_with_defects' && !isBautraeger() && (
          <div className="space-y-3">
            <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-lg p-3">
              <h4 className="text-yellow-300 font-medium mb-2">
                Dokumentierte Mängel ({acceptanceDefects.length})
              </h4>
              <p className="text-gray-400 text-sm mb-3">
                Der Bauträger hat Mängel dokumentiert. Quittieren Sie jeden behobenen Mangel einzeln.
              </p>
              
              {/* Mängel-Liste mit einzelner Quittierung */}
              {acceptanceDefects.length > 0 ? (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {acceptanceDefects.map((defect, index) => (
                    <div 
                      key={defect.id || index} 
                      className="flex items-start gap-3 p-3 bg-black/30 rounded-lg border border-transparent hover:border-yellow-400/50 hover:bg-black/50 hover:shadow-lg hover:shadow-yellow-400/20 transition-all duration-300 cursor-pointer group"
                      onClick={(e) => {
                        e.stopPropagation();
                        console.log('🔍 Mangel-Details:', defect);
                      }}
                    >
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          console.log('🔧 Mangel lokal als behoben markiert:', defect);
                          
                          // NUR lokales Update - API-Call erfolgt später im FinalAcceptanceModal
                          const updatedDefects = acceptanceDefects.map(d => 
                            d.id === defect.id ? { ...d, resolved: !d.resolved } : d
                          );
                          setAcceptanceDefects(updatedDefects);
                          
                          console.log('✅ Mangel-Status lokal geändert');
                        }}
                        className="mt-1 w-6 h-6 rounded-full border-2 border-yellow-400 bg-transparent hover:bg-yellow-400 hover:scale-110 hover:shadow-lg hover:shadow-yellow-400/50 transition-all duration-200 flex items-center justify-center cursor-pointer active:scale-95"
                        title="Als behoben markieren"
                      >
                        {defect.resolved ? (
                          <CheckCircle size={16} className="text-green-400 drop-shadow-sm animate-pulse" />
                        ) : (
                          <div className="w-3 h-3 bg-yellow-400 rounded-full opacity-70 group-hover:opacity-100 group-hover:animate-pulse transition-all" />
                        )}
                      </button>
                      
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-white mb-1">
                          {defect.title || `Mangel ${index + 1}`}
                        </div>
                        <div className="text-xs text-gray-300 mb-1">
                          {defect.description || 'Keine Beschreibung'}
                        </div>
                        {defect.location && (
                          <div className="text-xs text-gray-400">
                            📍 {defect.location} {defect.room && `- ${defect.room}`}
                          </div>
                        )}
                        {defect.severity && (
                          <div className={`inline-block px-2 py-1 rounded text-xs font-medium mt-1 ${
                            defect.severity === 'CRITICAL' ? 'bg-red-500/20 text-red-300' :
                            defect.severity === 'MAJOR' ? 'bg-orange-500/20 text-orange-300' :
                            'bg-yellow-500/20 text-yellow-300'
                          }`}>
                            {defect.severity === 'CRITICAL' ? 'Kritisch' :
                             defect.severity === 'MAJOR' ? 'Wichtig' : 'Gering'}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 text-sm">Keine Mängel-Details verfügbar</p>
              )}
            </div>
            
            <button
              onClick={() => setShowFinalAcceptanceModal(true)}
              disabled={false}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-blue-500/30 hover:scale-105 active:scale-95 disabled:opacity-50"
            >
              <FileText size={16} />
              Finale Abnahme öffnen
            </button>
          </div>
        )}
        
        {completionStatus === 'completed' && (
          <div className="bg-green-500/5 border border-green-500/20 rounded-lg p-3">
            <div className="flex items-center gap-2 text-green-300">
              <CheckCircle size={16} />
              <span className="text-sm font-medium">
                Gewerk erfolgreich abgeschlossen!
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  // Handler für Besichtigung abschließen
  const handleInspectionCompleted = async () => {
    try {
      // Finde den relevanten Besichtigungstermin
      const relevantAppointments = appointmentsForTrade.filter(appointment => {
        if (isBautraeger()) {
          return appointment.created_by === user?.id && appointment.appointment_type === 'INSPECTION';
        }
        return false; // Nur Bauträger können Besichtigungen als abgeschlossen markieren
      });

      if (relevantAppointments.length === 0) {
        console.error('❌ Kein relevanter Besichtigungstermin gefunden');
        return;
      }

      const appointmentId = relevantAppointments[0].id;
      
      // API-Call um Besichtigung als abgeschlossen zu markieren
      await appointmentService.markInspectionCompleted(appointmentId);
      
      setInspectionCompleted(true);
      console.log('✅ Besichtigung als abgeschlossen markiert');
      
      // Aktualisiere die Appointments um den neuen Status zu reflektieren
      const updatedAppointments = appointmentsForTrade.map(apt => 
        apt.id === appointmentId 
          ? { ...apt, inspection_completed: true }
          : apt
      );
      setAppointmentsForTrade(updatedAppointments);
      
    } catch (error) {
      console.error('❌ Fehler beim Markieren der Besichtigung als abgeschlossen:', error);
      // Zeige Fehlermeldung an
      alert('Fehler beim Markieren der Besichtigung als abgeschlossen. Bitte versuchen Sie es erneut.');
    }
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
    <>
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-[#1a1a2e] to-[#2c3539] rounded-2xl shadow-2xl border border-gray-600/30 max-w-6xl w-full h-[90vh] overflow-hidden relative flex flex-col">
        {/* DEBUG HINWEIS */}
        <div className="absolute top-2 right-2 bg-red-500/90 text-white px-3 py-1 rounded-lg text-sm font-bold z-50 shadow-lg">
          🔍 DEBUG: TradeDetailsModal
        </div>
        
        {/* TEST BUTTON für Wiedervorlage-Termine */}
        {isBautraeger() && existingQuotes?.some(q => q.status === 'accepted') && (
          <div className="absolute top-2 left-2 z-50">
            <button
              onClick={async () => {
                const testDate = new Date();
                testDate.setDate(testDate.getDate() + 7);
                const deadline = testDate.toISOString().split('T')[0];
                
                try {
                  await createReviewAppointmentForTrade(deadline, 'Test-Wiedervorlage-Termin erstellt über Debug-Button');
                } catch (error) {
                  console.error('Test fehlgeschlagen:', error);
                }
              }}
              className="bg-blue-500/90 text-white px-3 py-1 rounded-lg text-sm font-bold shadow-lg hover:bg-blue-600 transition-colors"
              title="Test: Erstelle Wiedervorlage-Termin"
            >
              📅 Test Wiedervorlage
            </button>
          </div>
        )}
        
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
                  const title = hasAccepted ? 'Bearbeiten nicht mÃ¶glich, Angebot wurde bereits angenommen' : (hasAnyQuote ? 'Bearbeiten nicht mÃ¶glich, es liegen bereits Angebote vor' : 'Ausschreibung bearbeiten');
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
                
                {/* Löschen Button: nur wenn keine Angebote vorliegen */}
                {(() => {
                  const canDelete = canDeleteTrade();
                  const title = canDelete ? 'Ausschreibung löschen' : 'Löschen nicht möglich, es liegen bereits Angebote vor';
                  return (
                    <button
                      onClick={() => { if (canDelete) { setShowDeleteConfirm(true); } }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1 ${canDelete ? 'bg-red-500/20 text-red-300 hover:bg-red-500/30 border border-red-500/30' : 'bg-white/5 text-gray-400 cursor-not-allowed opacity-50'}`}
                      title={title}
                      disabled={!canDelete}
                    >
                      <Trash2 size={14} />
                      Löschen
                    </button>
                  );
                })()}
                
                {(completionStatus === 'completed' || completionStatus === 'completed_with_defects' || completionStatus === 'completion_requested') && (
                  <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${
                    completionStatus === 'completed' 
                      ? 'bg-green-500/20 border border-green-500/30 text-green-300'
                      : completionStatus === 'completed_with_defects'
                      ? 'bg-yellow-500/20 border border-yellow-500/30 text-yellow-300'
                      : completionStatus === 'completion_requested'
                      ? 'bg-orange-500/20 border border-orange-500/30 text-orange-300'
                      : 'bg-green-500/20 border border-green-500/30 text-green-300'
                  }`}>
                    {completionStatus === 'completion_requested' ? (
                      <>
                        <Clock size={14} />
                        Als fertiggestellt markiert
                      </>
                    ) : (
                      <>
                        <CheckCircle size={14} />
                        {completionStatus === 'completed_with_defects' ? 'Unter Vorbehalt' : 'Abgeschlossen'}
                      </>
                    )}
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
        
        {/* Banner für Terminzusagen */}
        {userAcceptedAppointments.length > 0 && (
          <div className="mx-6 mt-4 mb-2">
            {userAcceptedAppointments.map(({appointment, response}, index) => (
              <div key={`${appointment.id}-${index}`} className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/40 rounded-lg p-4 mb-3 shadow-lg">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-green-500/30 rounded-full flex items-center justify-center">
                      <CheckCircle size={20} className="text-green-400" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="text-green-300 font-semibold text-sm">Terminzusage bestätigt</h4>
                      <span className="px-2 py-1 bg-green-500/20 text-green-300 text-xs rounded-full font-medium">
                        Zugesagt
                      </span>
                    </div>
                    <div className="space-y-1 text-sm">
                      <div className="flex items-center gap-2 text-gray-300">
                        <Calendar size={14} className="text-green-400" />
                        <span className="font-medium">{appointment.title}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-300">
                        <Clock size={14} className="text-green-400" />
                        <span>
                          {new Date(appointment.scheduled_date).toLocaleDateString('de-DE', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                      {appointment.location && (
                        <div className="flex items-center gap-2 text-gray-300">
                          <MapPin size={14} className="text-green-400" />
                          <span>{appointment.location}</span>
                        </div>
                      )}
                      {response.message && (
                        <div className="mt-2 p-2 bg-green-500/10 rounded border-l-2 border-green-500/50">
                          <p className="text-gray-300 text-xs italic">"{response.message}"</p>
                        </div>
                      )}
                      {response.responded_at && (
                        <div className="text-xs text-gray-400 mt-1">
                          Zugesagt am: {new Date(response.responded_at).toLocaleDateString('de-DE', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {/* Besichtigungstermin-Anzeige */}
        {(() => {
          // Filtere Termine für den aktuellen Benutzer
          const relevantAppointments = appointmentsForTrade.filter(appointment => {
            if (isBautraeger()) {
              // Bauträger sehen alle Termine die sie erstellt haben
              return appointment.created_by === user?.id;
            } else {
              // Dienstleister sehen nur Termine zu denen sie eingeladen wurden
              const responses = Array.isArray(appointment.responses) ? appointment.responses : [];
              const invitedProviders = Array.isArray(appointment.invited_service_providers) ? appointment.invited_service_providers : [];
              
              // Prüfe ob User zu diesem Termin eingeladen wurde oder bereits geantwortet hat
              const hasUserResponse = responses.some((r: any) => 
                r.service_provider_id === user?.id || 
                String(r.service_provider_id) === String(user?.id) ||
                Number(r.service_provider_id) === Number(user?.id)
              );
              
              const isInvited = invitedProviders.some((provider: any) => {
                // Robuste Prüfung für verschiedene Datenstrukturen
                if (typeof provider === 'number') {
                  return provider === user?.id || 
                         String(provider) === String(user?.id) ||
                         Number(provider) === Number(user?.id);
                } else if (typeof provider === 'object' && provider !== null) {
                  return provider.id === user?.id || 
                         String(provider.id) === String(user?.id) ||
                         Number(provider.id) === Number(user?.id);
                } else if (typeof provider === 'string') {
                  return provider === String(user?.id) ||
                         Number(provider) === Number(user?.id);
                }
                return false;
              });
              
              return hasUserResponse || isInvited;
            }
          });

          console.log('🔍 Termine-Banner Debug:', {
            userId: user?.id,
            userRole: user?.user_role,
            isBautraeger: isBautraeger(),
            totalAppointments: appointmentsForTrade.length,
            relevantAppointments: relevantAppointments.length,
            appointmentDetails: relevantAppointments.map(apt => ({
              id: apt.id,
              title: apt.title,
              created_by: apt.created_by,
              responses: apt.responses,
              invited_service_providers: apt.invited_service_providers
            }))
          });

          return relevantAppointments.length > 0 && !inspectionCompleted && (
            <div className={`px-6 py-4 border-b flex-shrink-0 ${
              relevantAppointments[0]?.appointment_type === 'REVIEW'
                ? 'bg-gradient-to-r from-orange-600/20 to-amber-500/20 border-orange-400/30'
                : 'bg-gradient-to-r from-blue-600/20 to-cyan-500/20 border-blue-400/30'
            }`}>
              <div className="flex items-start gap-4">
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-xl ${
                    relevantAppointments[0]?.appointment_type === 'REVIEW'
                      ? 'bg-orange-500/20'
                      : 'bg-blue-500/20'
                  }`}>
                    <Calendar size={24} className={
                      relevantAppointments[0]?.appointment_type === 'REVIEW'
                        ? 'text-orange-300'
                        : 'text-blue-300'
                    } />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-white font-semibold text-lg">
                      {relevantAppointments[0]?.appointment_type === 'REVIEW' 
                        ? (relevantAppointments[0]?.title || 'Wiedervorlage-Termin vereinbart')
                        : (relevantAppointments[0]?.title || 'Besichtigungstermin vereinbart')
                      }
                    </h3>
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Clock size={16} className={
                          relevantAppointments[0]?.appointment_type === 'REVIEW'
                            ? 'text-orange-300'
                            : 'text-blue-300'
                        } />
                        <span className={
                          relevantAppointments[0]?.appointment_type === 'REVIEW'
                            ? 'text-orange-200'
                            : 'text-blue-200'
                        }>
                          {relevantAppointments[0]?.scheduled_date ? 
                            new Date(relevantAppointments[0].scheduled_date).toLocaleDateString('de-DE', {
                              weekday: 'long',
                              day: '2-digit',
                              month: 'long',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            }) : 'Termin geplant'
                          }
                        </span>
                      </div>
                      {relevantAppointments[0]?.duration_minutes && (
                        <div className="flex items-center gap-2">
                          <span className="text-blue-300">•</span>
                          <span className="text-blue-200">
                            {Math.floor(relevantAppointments[0].duration_minutes / 60)}h {relevantAppointments[0].duration_minutes % 60}min
                          </span>
                        </div>
                      )}
                    </div>
                    {relevantAppointments[0]?.location && (
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin size={16} className="text-blue-300" />
                        <span className="text-blue-200">{relevantAppointments[0].location}</span>
                      </div>
                    )}
                    {relevantAppointments[0]?.location_details && (
                      <div className="text-xs text-blue-300 ml-5">
                        {relevantAppointments[0].location_details}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex-1"></div>
                
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    {relevantAppointments.length > 1 && (
                      <div className="text-blue-200 text-sm mb-1">
                        {relevantAppointments.length} Termine
                      </div>
                    )}
                    {relevantAppointments[0]?.description && (
                      <div className="text-blue-300 text-xs max-w-xs truncate">
                        {relevantAppointments[0].description}
                      </div>
                    )}
                  </div>
                  
                  {/* Besichtigung stattgefunden Button - dezent */}
                  <button
                    onClick={handleInspectionCompleted}
                    className="flex items-center gap-1 px-3 py-1.5 bg-yellow-500/10 text-yellow-400 rounded-lg hover:bg-yellow-500/20 transition-colors text-xs font-medium border border-yellow-500/20 hover:border-yellow-500/40"
                    title="Besichtigung hat stattgefunden"
                  >
                    <CheckCircle size={14} />
                    Stattgefunden
                  </button>
                  
                  {/* ICS Download Button */}
                  <button
                    onClick={async () => {
                      try {
                        const appointment = relevantAppointments[0];
                        await downloadEnhancedCalendarEvent(appointment);
                      } catch (error) {
                        console.error('Fehler beim Download des Kalendereintrags:', error);
                        alert('Fehler beim Herunterladen des Kalendereintrags');
                      }
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-500/20 text-blue-300 rounded-lg hover:bg-blue-500/30 transition-colors text-sm font-medium"
                    title="Kalendereintrag speichern"
                  >
                    <Download size={16} />
                    Kalender
                  </button>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Eingeklapptes Banner - zeigt nur dass Besichtigung stattgefunden hat */}
        {(() => {
          // Filtere auch hier die relevanten Termine
          const relevantAppointments = appointmentsForTrade.filter(appointment => {
            if (isBautraeger()) {
              return appointment.created_by === user?.id;
            } else {
              const responses = Array.isArray(appointment.responses) ? appointment.responses : [];
              const invitedProviders = Array.isArray(appointment.invited_service_providers) ? appointment.invited_service_providers : [];
              
              const hasUserResponse = responses.some((r: any) => 
                r.service_provider_id === user?.id || 
                String(r.service_provider_id) === String(user?.id) ||
                Number(r.service_provider_id) === Number(user?.id)
              );
              
              const isInvited = invitedProviders.some((provider: any) => {
                // Robuste Prüfung für verschiedene Datenstrukturen
                if (typeof provider === 'number') {
                  return provider === user?.id || 
                         String(provider) === String(user?.id) ||
                         Number(provider) === Number(user?.id);
                } else if (typeof provider === 'object' && provider !== null) {
                  return provider.id === user?.id || 
                         String(provider.id) === String(user?.id) ||
                         Number(provider.id) === Number(user?.id);
                } else if (typeof provider === 'string') {
                  return provider === String(user?.id) ||
                         Number(provider) === Number(user?.id);
                }
                return false;
              });
              
              return hasUserResponse || isInvited;
            }
          });

          return relevantAppointments.length > 0 && inspectionCompleted && (
            <div className="px-6 py-2 bg-gradient-to-r from-yellow-600/10 to-amber-500/10 border-b border-yellow-400/20 flex-shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-yellow-500/20 rounded-lg">
                    <CheckCircle size={18} className="text-yellow-400" />
                  </div>
                  <div>
                    <span className="text-yellow-300 font-medium text-sm">Besichtigung hat stattgefunden</span>
                    <span className="text-yellow-400/70 text-xs ml-2">
                      {relevantAppointments[0]?.scheduled_date ? 
                        new Date(relevantAppointments[0].scheduled_date).toLocaleDateString('de-DE', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric'
                        }) : ''
                      }
                    </span>
                  </div>
                </div>
                
                {/* Button zum wieder Einblenden */}
                <button
                  onClick={() => setInspectionCompleted(false)}
                  className="text-yellow-400/60 hover:text-yellow-300 transition-colors p-1"
                  title="Details wieder anzeigen"
                >
                  <ChevronDown size={16} />
                </button>
              </div>
            </div>
          );
        })()}

        {/* Tab Navigation */}
        <div className="flex-shrink-0 border-b border-gray-600/30 bg-gradient-to-r from-[#1a1a2e]/80 to-[#2c3539]/80 overflow-x-auto">
          <div className="flex px-6 min-w-max" role="tablist" aria-label="Ausschreibungsdetails">
            {/* Overview Tab - Always visible */}
            <button
              onClick={() => setActiveTab('overview')}
              onKeyDown={(e) => handleTabKeyDown(e, 0)}
              role="tab"
              aria-selected={activeTab === 'overview'}
              aria-controls="overview-panel"
              id="overview-tab"
              tabIndex={activeTab === 'overview' ? 0 : -1}
              className={`px-4 py-3 font-medium text-sm border-b-2 transition-all duration-200 whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-[#ffbd59] focus:ring-offset-2 focus:ring-offset-[#2c3539] ${
                activeTab === 'overview'
                  ? 'border-[#ffbd59] text-[#ffbd59] bg-[#ffbd59]/5'
                  : 'border-transparent text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <div className="flex items-center gap-2">
                <Info size={16} />
                <span className="hidden sm:inline">Überblick</span>
                <span className="sm:hidden">Info</span>
              </div>
            </button>
            
            {/* Quotes Tab */}
            <button
              onClick={() => setActiveTab('quotes')}
              onKeyDown={(e) => handleTabKeyDown(e, 1)}
              role="tab"
              aria-selected={activeTab === 'quotes'}
              aria-controls="quotes-panel"
              id="quotes-tab"
              tabIndex={activeTab === 'quotes' ? 0 : -1}
              className={`px-4 py-3 font-medium text-sm border-b-2 transition-all duration-200 whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-[#ffbd59] focus:ring-offset-2 focus:ring-offset-[#2c3539] ${
                activeTab === 'quotes'
                  ? 'border-[#ffbd59] text-[#ffbd59] bg-[#ffbd59]/5'
                  : 'border-transparent text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <div className="flex items-center gap-2">
                <Package size={16} />
                <span className="hidden md:inline">
                  {isBautraeger() ? `Angebote (${(existingQuotes?.length || 0) + (resourceAllocations?.length || 0)})` : 'Mein Angebot'}
                </span>
                <span className="md:hidden">
                  {isBautraeger() ? `${(existingQuotes?.length || 0) + (resourceAllocations?.length || 0)}` : 'Angebot'}
                </span>
                {isBautraeger() && existingQuotes && existingQuotes.length > 0 && existingQuotes.some(q => q.status === 'submitted') && (
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                )}
              </div>
            </button>
            
            {/* Documents Tab */}
            <button
              onClick={() => setActiveTab('documents')}
              onKeyDown={(e) => handleTabKeyDown(e, 2)}
              role="tab"
              aria-selected={activeTab === 'documents'}
              aria-controls="documents-panel"
              id="documents-tab"
              tabIndex={activeTab === 'documents' ? 0 : -1}
              className={`px-4 py-3 font-medium text-sm border-b-2 transition-all duration-200 whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-[#ffbd59] focus:ring-offset-2 focus:ring-offset-[#2c3539] ${
                activeTab === 'documents'
                  ? 'border-[#ffbd59] text-[#ffbd59] bg-[#ffbd59]/5'
                  : 'border-transparent text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <div className="flex items-center gap-2">
                <FileText size={16} />
                <span className="hidden sm:inline">
                  Dokumente ({documentsLoading ? '...' : (loadedDocuments && Array.isArray(loadedDocuments) ? loadedDocuments.length : 0)})
                </span>
                <span className="sm:hidden">
                  Docs ({documentsLoading ? '...' : (loadedDocuments && Array.isArray(loadedDocuments) ? loadedDocuments.length : 0)})
                </span>
                {loadedDocuments && loadedDocuments.length > 0 && (
                  <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                )}
              </div>
            </button>
            
            {/* Progress Tab */}
            <button
              onClick={() => setActiveTab('progress')}
              onKeyDown={(e) => handleTabKeyDown(e, 3)}
              role="tab"
              aria-selected={activeTab === 'progress'}
              aria-controls="progress-panel"
              id="progress-tab"
              tabIndex={activeTab === 'progress' ? 0 : -1}
              className={`px-4 py-3 font-medium text-sm border-b-2 transition-all duration-200 whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-[#ffbd59] focus:ring-offset-2 focus:ring-offset-[#2c3539] ${
                activeTab === 'progress'
                  ? 'border-[#ffbd59] text-[#ffbd59] bg-[#ffbd59]/5'
                  : 'border-transparent text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <div className="flex items-center gap-2">
                <Settings size={16} />
                <span className="hidden sm:inline">Fortschritt & Kommunikation</span>
                <span className="sm:hidden">Status</span>
                {(completionStatus === 'completed' || completionStatus === 'completion_requested' || completionStatus === 'completed_with_defects') && (
                  <div className="w-2 h-2 bg-[#ffbd59] rounded-full animate-pulse"></div>
                )}
              </div>
            </button>
            
            {/* Kontakt Tab - nur für Dienstleister */}
            {!isBautraeger() && (
              <button
                onClick={() => setActiveTab('contact')}
                onKeyDown={(e) => handleTabKeyDown(e, 4)}
                role="tab"
                aria-selected={activeTab === 'contact'}
                aria-controls="contact-panel"
                id="contact-tab"
                tabIndex={activeTab === 'contact' ? 0 : -1}
                className={`px-4 py-3 font-medium text-sm border-b-2 transition-all duration-200 whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-[#ffbd59] focus:ring-offset-2 focus:ring-offset-[#2c3539] ${
                  activeTab === 'contact'
                    ? 'border-[#ffbd59] text-[#ffbd59] bg-[#ffbd59]/5'
                    : 'border-transparent text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Phone size={16} />
                  <span className="hidden sm:inline">Kontakt</span>
                  <span className="sm:hidden">Kontakt</span>
                </div>
              </button>
            )}

            {/* Abnahme Tab - nur für Dienstleister mit angenommenem Angebot */}
            {!isBautraeger() && acceptedQuote && (
              <button
                onClick={() => setActiveTab('abnahme')}
                onKeyDown={(e) => handleTabKeyDown(e, 5)}
                role="tab"
                aria-selected={activeTab === 'abnahme'}
                aria-controls="abnahme-panel"
                id="abnahme-tab"
                tabIndex={activeTab === 'abnahme' ? 0 : -1}
                className={`px-4 py-3 font-medium text-sm border-b-2 transition-all duration-200 whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-[#ffbd59] focus:ring-offset-2 focus:ring-offset-[#2c3539] ${
                  activeTab === 'abnahme'
                    ? 'border-[#ffbd59] text-[#ffbd59] bg-[#ffbd59]/5'
                    : 'border-transparent text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={16} />
                  <span className="hidden sm:inline">Abnahme</span>
                  <span className="sm:hidden">Abnahme</span>
                  {(completionStatus === 'completed_with_defects' || completionStatus === 'completion_requested') && (
                    <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                  )}
                </div>
              </button>
            )}
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 min-h-0">
          {/* Tab Content */}
          {activeTab === 'overview' && (
            <div 
              role="tabpanel" 
              id="overview-panel" 
              aria-labelledby="overview-tab"
              className="space-y-6"
            >
              {/* Accepted Quote - Service Provider Information */}
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
              <h3 className="text-white font-semibold mb-3">Ausschreibung bearbeiten</h3>
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  try {
                    setIsUpdatingTrade(true);
                    const payload: any = {};
                    
                    // Nur definierte Werte hinzufügen - KEINE undefined Werte!
                    if (editForm.title && editForm.title.trim()) payload.title = editForm.title;
                    if (editForm.description && editForm.description.trim()) payload.description = editForm.description;
                    if (editForm.category && editForm.category.trim()) payload.category = editForm.category;
                    if (editForm.priority && editForm.priority.trim()) payload.priority = editForm.priority;
                    if (editForm.planned_date && editForm.planned_date.trim()) payload.planned_date = editForm.planned_date;
                    if (editForm.notes && editForm.notes.trim()) payload.notes = editForm.notes;
                    payload.requires_inspection = !!editForm.requires_inspection;
                    
                    console.log('🔧 [DEBUG] Sending update payload:', payload);
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
                    alert('Fehler beim Aktualisieren der Ausschreibung');
                  } finally {
                    setIsUpdatingTrade(false);
                  }
                }}
                className="space-y-3"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-300 mb-1">Titel</label>
                    <input 
                      value={editForm.title} 
                      onChange={(e) => setEditForm(p => ({ ...p, title: e.target.value }))} 
                      className="w-full px-3 py-2 bg-[#1a1a2e] border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#ffbd59] focus:border-[#ffbd59]" 
                      placeholder="z.B. Elektroinstallation Erdgeschoss"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-300 mb-1">Kategorie</label>
                    <select 
                      value={editForm.category || ''} 
                      onChange={(e) => setEditForm(p => ({ ...p, category: e.target.value }))} 
                      className="w-full px-3 py-2 bg-[#1a1a2e] border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#ffbd59] focus:border-[#ffbd59]"
                      required
                    >
                      <option value="">Kategorie wählen</option>
                      <option value="electrical">Elektro</option>
                      <option value="plumbing">Sanitär</option>
                      <option value="heating">Heizung</option>
                      <option value="flooring">Bodenbelag</option>
                      <option value="painting">Malerei</option>
                      <option value="carpentry">Zimmerei</option>
                      <option value="roofing">Dachdeckerei</option>
                      <option value="landscaping">Garten- & Landschaftsbau</option>
                      <option value="civil_engineering">Tiefbau</option>
                      <option value="structural">Hochbau</option>
                      <option value="interior">Innenausbau / Interior</option>
                      <option value="facade">Fassade</option>
                      <option value="windows_doors">Fenster & Türen</option>
                      <option value="drywall">Trockenbau</option>
                      <option value="tiling">Fliesenarbeiten</option>
                      <option value="insulation">Dämmung</option>
                      <option value="hvac">Klima / Lüftung (HVAC)</option>
                      <option value="smart_home">Smart Home</option>
                      <option value="site_preparation">Erdarbeiten / Baustellenvorbereitung</option>
                      <option value="other">Sonstiges</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-300 mb-1">Beschreibung & Leistungsumfang</label>
                    <textarea 
                      rows={4} 
                      value={editForm.description} 
                      onChange={(e) => setEditForm(p => ({ ...p, description: e.target.value }))} 
                      className="w-full px-3 py-2 bg-[#1a1a2e] border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#ffbd59] focus:border-[#ffbd59] resize-none" 
                      placeholder="Detaillierte Beschreibung des Gewerks..."
                      required
                    />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs text-gray-300 mb-1">PrioritÃ¤t</label>
                    <select 
                      value={editForm.priority || 'medium'} 
                      onChange={(e) => setEditForm(p => ({ ...p, priority: e.target.value }))} 
                      className="w-full px-3 py-2 bg-[#1a1a2e] border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#ffbd59] focus:border-[#ffbd59]"
                    >
                      <option value="low">Niedrig</option>
                      <option value="medium">Mittel</option>
                      <option value="high">Hoch</option>
                      <option value="urgent">Dringend</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-300 mb-1">Geplantes Datum</label>
                    <input 
                      type="date" 
                      value={editForm.planned_date || ''} 
                      onChange={(e) => setEditForm(p => ({ ...p, planned_date: e.target.value }))} 
                      className="w-full px-3 py-2 bg-[#1a1a2e] border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#ffbd59] focus:border-[#ffbd59]"
                      required
                    />
                  </div>
                  <div className="flex items-center gap-2 mt-6">
                    <input id="requires_inspection_td" type="checkbox" checked={!!editForm.requires_inspection} onChange={(e)=>setEditForm(p=>({...p,requires_inspection:e.target.checked}))} className="w-4 h-4 text-[#ffbd59] bg-[#2c3539]/50 border-gray-600 rounded" />
                    <label htmlFor="requires_inspection_td" className="text-xs text-gray-300">Besichtigung erforderlich</label>
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-300 mb-1">Notizen</label>
                    <textarea 
                      rows={3} 
                      value={editForm.notes || ''} 
                      onChange={(e) => setEditForm(p => ({ ...p, notes: e.target.value }))} 
                      className="w-full px-3 py-2 bg-[#1a1a2e] border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#ffbd59] focus:border-[#ffbd59] resize-none" 
                      placeholder="Zusätzliche Notizen oder Anweisungen..."
                    />
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
              {/* Beschreibung */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <FileText size={16} className="text-blue-400" />
                  <span className="text-sm font-medium text-blue-300">Beschreibung & Leistungsumfang</span>
                </div>
                <div className="bg-black/20 rounded-lg p-4">
                  <div className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">
                    {fullTradeData?.description || trade?.description || (trade as any)?.description || 'Keine Beschreibung verfÃ¼gbar'}
                  </div>
                </div>
              </div>

              {/* Erstellungsdatum und Notizen Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Geplantes Datum */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar size={16} className="text-[#ffbd59]" />
                    <span className="text-sm font-medium text-[#ffbd59]">Geplantes Datum</span>
                  </div>
                  <div className="bg-black/20 rounded-lg p-4">
                    <div className="text-sm text-gray-300">
                      {(fullTradeData?.planned_date || trade?.planned_date || (trade as any)?.planned_date) ? (
                        new Date(fullTradeData?.planned_date || trade?.planned_date || (trade as any)?.planned_date).toLocaleDateString('de-DE')
                      ) : (
                        'Nicht festgelegt'
                      )}
                    </div>
                  </div>
                </div>
                
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
                      {fullTradeData?.notes || (trade as any)?.notes || 'Keine Notizen vorhanden'}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      Debug: {fullTradeData?.notes || (trade as any)?.notes || 'KEINE NOTIZEN'}
                    </div>
                  </div>
                </div>
              </div>

              {/* ZusÃ¤tzliche Informationen */}
              {(trade as any).notify_on_completion && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle size={16} className="text-orange-400" />
                    <span className="text-sm font-medium text-orange-300">ZusÃ¤tzliche Informationen</span>
                  </div>
                  <div className="bg-black/20 rounded-lg p-4">
                    <div className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">
                      {(trade as any).notify_on_completion}
                    </div>
                  </div>
                </div>
              )}
              </div>
            )}
          </div>

              {/* Abnahme-Workflow direkt unterhalb der Ausschreibungsdetails für Dienstleister - nur wenn Angebot angenommen */}
              {!isBautraeger() && acceptedQuote && completionStatus === 'completed_with_defects' && (
                <div className="mb-6">
                  {renderAbnahmeWorkflow()}
                </div>
              )}
            </div>
          )}
          
          {/* Quotes Tab */}
          {activeTab === 'quotes' && (
            <div 
              role="tabpanel" 
              id="quotes-panel" 
              aria-labelledby="quotes-tab"
              className="space-y-6"
            >
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

                      {/* Zahlungsbedingungen */}
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

                      {/* Angebotsnummer */}
                      {userQuote.quote_number && (
                        <div className="bg-black/20 rounded-lg p-4 border border-green-500/20">
                          <h5 className="text-white font-semibold mb-2 flex items-center gap-2">
                            <Receipt size={16} className="text-green-400" />
                            Angebotsnummer
                          </h5>
                          <div className="text-white font-mono text-lg">
                            {userQuote.quote_number}
                          </div>
                        </div>
                      )}

                      {/* Qualifikationen und Referenzen */}
                      {(userQuote.qualifications || userQuote.references || userQuote.certifications) && (
                        <div className="bg-black/20 rounded-lg p-4 border border-green-500/20">
                          <h5 className="text-white font-semibold mb-3 flex items-center gap-2">
                            <Star size={16} className="text-green-400" />
                            Qualifikationen & Referenzen
                          </h5>
                          <div className="space-y-4">
                            {userQuote.qualifications && (
                              <div>
                                <div className="text-sm text-green-300 mb-2">Qualifikationen</div>
                                <div className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap bg-black/30 rounded-lg p-3">
                                  {userQuote.qualifications}
                                </div>
                              </div>
                            )}
                            {userQuote.references && (
                              <div>
                                <div className="text-sm text-green-300 mb-2">Referenzen</div>
                                <div className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap bg-black/30 rounded-lg p-3">
                                  {userQuote.references}
                                </div>
                              </div>
                            )}
                            {userQuote.certifications && (
                              <div>
                                <div className="text-sm text-green-300 mb-2">Zertifizierungen</div>
                                <div className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap bg-black/30 rounded-lg p-3">
                                  {userQuote.certifications}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Technische Details */}
                      {(userQuote.technical_approach || userQuote.quality_standards || userQuote.safety_measures || userQuote.environmental_compliance) && (
                        <div className="bg-black/20 rounded-lg p-4 border border-green-500/20">
                          <h5 className="text-white font-semibold mb-3 flex items-center gap-2">
                            <Settings size={16} className="text-green-400" />
                            Technische Details
                          </h5>
                          <div className="space-y-4">
                            {userQuote.technical_approach && (
                              <div>
                                <div className="text-sm text-green-300 mb-2">Technischer Ansatz</div>
                                <div className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap bg-black/30 rounded-lg p-3">
                                  {userQuote.technical_approach}
                                </div>
                              </div>
                            )}
                            {userQuote.quality_standards && (
                              <div>
                                <div className="text-sm text-green-300 mb-2">Qualitätsstandards</div>
                                <div className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap bg-black/30 rounded-lg p-3">
                                  {userQuote.quality_standards}
                                </div>
                              </div>
                            )}
                            {userQuote.safety_measures && (
                              <div>
                                <div className="text-sm text-green-300 mb-2">Sicherheitsmaßnahmen</div>
                                <div className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap bg-black/30 rounded-lg p-3">
                                  {userQuote.safety_measures}
                                </div>
                              </div>
                            )}
                            {userQuote.environmental_compliance && (
                              <div>
                                <div className="text-sm text-green-300 mb-2">Umwelt-Compliance</div>
                                <div className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap bg-black/30 rounded-lg p-3">
                                  {userQuote.environmental_compliance}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Risikobewertung und Notfallplan */}
                      {(userQuote.risk_assessment || userQuote.contingency_plan) && (
                        <div className="bg-black/20 rounded-lg p-4 border border-green-500/20">
                          <h5 className="text-white font-semibold mb-3 flex items-center gap-2">
                            <AlertTriangle size={16} className="text-green-400" />
                            Risikomanagement
                          </h5>
                          <div className="space-y-4">
                            {userQuote.risk_assessment && (
                              <div>
                                <div className="text-sm text-green-300 mb-2">Risikobewertung</div>
                                <div className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap bg-black/30 rounded-lg p-3">
                                  {userQuote.risk_assessment}
                                </div>
                              </div>
                            )}
                            {userQuote.contingency_plan && (
                              <div>
                                <div className="text-sm text-green-300 mb-2">Notfallplan</div>
                                <div className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap bg-black/30 rounded-lg p-3">
                                  {userQuote.contingency_plan}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Zusätzliche Notizen */}
                      {userQuote.additional_notes && (
                        <div className="bg-black/20 rounded-lg p-4 border border-green-500/20">
                          <h5 className="text-white font-semibold mb-3 flex items-center gap-2">
                            <StickyNote size={16} className="text-green-400" />
                            Zusätzliche Notizen
                          </h5>
                          <div className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap bg-black/30 rounded-lg p-3">
                            {userQuote.additional_notes}
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
                      
                      {/* Dokument-Upload für eigenes Angebot */}
                      {userQuote && userQuote.status !== 'accepted' && (
                        <div className="bg-black/20 rounded-lg p-4 border border-green-500/20">
                          <h5 className="text-white font-semibold mb-3 flex items-center gap-2">
                            <Upload size={16} className="text-green-400" />
                            Dokumente hinzufügen
                          </h5>
                          <QuoteDocumentUpload 
                            quoteId={userQuote.id}
                            onUploadSuccess={(updatedQuote) => {
                              setUserQuote(updatedQuote);
                              console.log('✅ Dokument für eigenes Angebot hochgeladen:', updatedQuote);
                            }}
                            onUploadError={(error) => {
                              console.error('❌ Upload-Fehler für eigenes Angebot:', error);
                            }}
                          />
                        </div>
                      )}
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
                      Eingegangene Angebote ({(existingQuotes?.length || 0) + (resourceAllocations?.length || 0)})
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
                      className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all duration-300 ${
                        (appointmentsForTrade && appointmentsForTrade.length > 0)
                          ? 'bg-gray-500/20 text-gray-400 cursor-not-allowed border border-gray-500/40'
                          : selectedQuoteIds.length > 0
                            ? 'bg-gradient-to-r from-[#ffbd59] to-[#ffa726] text-black hover:shadow-lg hover:shadow-[#ffbd59]/30 animate-pulse border border-[#ffbd59]/50'
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
                {/* ResourceAllocations (zugeordnete Ressourcen) */}
                {loadingResourceAllocations ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mr-3"></div>
                    <span className="text-gray-300">Lade zugeordnete Ressourcen...</span>
                  </div>
                ) : resourceAllocations && resourceAllocations.length > 0 ? (
                  <>
                    <div className="mb-4">
                      <h4 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
                        <Users size={18} className="text-blue-400" />
                        Zugeordnete Ressourcen ({resourceAllocations.length})
                      </h4>
                    </div>
                    {resourceAllocations.map((allocation) => (
                      <div 
                        key={`allocation-${allocation.id}`} 
                        className="p-4 rounded-xl border bg-blue-500/10 border-blue-500/30"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-start gap-3">
                            <div className="p-2 bg-blue-500/20 rounded-lg">
                              <Users size={16} className="text-blue-400" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h4 className="text-white font-semibold">
                                  {allocation.resource?.provider_name || 'Dienstleister'}
                                </h4>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  allocation.allocation_status === 'pre_selected' ? 'bg-blue-500/20 text-blue-400' :
                                  allocation.allocation_status === 'invited' ? 'bg-yellow-500/20 text-yellow-400' :
                                  allocation.allocation_status === 'accepted' ? 'bg-green-500/20 text-green-400' :
                                  allocation.allocation_status === 'rejected' ? 'bg-red-500/20 text-red-400' :
                                  'bg-gray-500/20 text-gray-400'
                                }`}>
                                  {allocation.allocation_status === 'pre_selected' ? 'Vorausgewählt' :
                                   allocation.allocation_status === 'invited' ? 'Eingeladen' :
                                   allocation.allocation_status === 'accepted' ? 'Angenommen' :
                                   allocation.allocation_status === 'rejected' ? 'Abgelehnt' :
                                   allocation.allocation_status}
                                </span>
                              </div>
                              
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                <div>
                                  <span className="text-gray-400">Personen:</span>
                                  <div className="text-white font-semibold">{allocation.allocated_person_count}</div>
                                </div>
                                <div>
                                  <span className="text-gray-400">Zeitraum:</span>
                                  <div className="text-white">
                                    {new Date(allocation.allocated_start_date).toLocaleDateString('de-DE')} - 
                                    {new Date(allocation.allocated_end_date).toLocaleDateString('de-DE')}
                                  </div>
                                </div>
                                <div>
                                  <span className="text-gray-400">Kategorie:</span>
                                  <div className="text-white">{allocation.resource?.category || 'Nicht angegeben'}</div>
                                </div>
                              </div>

                              {allocation.resource?.address_city && (
                                <div className="mt-3 flex items-center gap-4 text-sm text-gray-300">
                                  <div className="flex items-center gap-1">
                                    <MapPin size={14} />
                                    {allocation.resource.address_city}, {allocation.resource.address_postal_code}
                                  </div>
                                  {allocation.resource.hourly_rate && (
                                    <div className="flex items-center gap-1">
                                      <Clock size={14} />
                                      {allocation.resource.hourly_rate}€/h
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    <div className="border-t border-gray-600/30 my-6"></div>
                  </>
                ) : null}

                {/* Quotes (Angebote) */}
                {(existingQuotes && existingQuotes.length > 0) || (resourceAllocations && resourceAllocations.length > 0) ? (
                  <>
                    {existingQuotes && existingQuotes.length > 0 && existingQuotes.map((quote) => (
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
                          {/* Annehmen Button: nur deaktiviert wenn Besichtigung erforderlich aber nicht vereinbart */}
                          {(trade as any).requires_inspection && (!appointmentsForTrade || appointmentsForTrade.length === 0) ? (
                            <div className="flex items-center gap-2">
                              <button
                                disabled
                                className="px-3 py-1.5 bg-gray-500/20 text-gray-400 rounded-lg cursor-not-allowed transition-colors text-sm font-medium flex items-center gap-1 opacity-60"
                                title="Besichtigung erforderlich: Vereinbaren Sie zuerst eine Besichtigung über den Button 'Besichtigung vereinbaren' oben, bevor Sie das Angebot annehmen können."
                              >
                                <Eye size={14} className="text-[#ffbd59]" />
                                Besichtigung erforderlich
                              </button>
                            </div>
                          ) : (
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
                          )}
                          
                          {/* Ablehnen Button: immer aktiv */}
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
                ))}
                  </>
                ) : (
                  <div className="text-center py-8">
                    <FileText size={48} className="mx-auto mb-4 text-gray-500" />
                    <h3 className="text-lg font-semibold text-gray-300 mb-2">Keine Angebote vorhanden</h3>
                    <p className="text-gray-400 text-sm">
                      Für diese Ausschreibung sind noch keine Angebote eingegangen und keine Ressourcen zugeordnet.
                    </p>
                  </div>
                )}
                
                {/* Workflow-Hinweis für Bauträger */}
                {((existingQuotes && existingQuotes.length > 0) || (resourceAllocations && resourceAllocations.length > 0)) && (
                  <div className="mt-4 p-3 bg-gradient-to-r from-[#ffbd59]/10 to-[#ffa726]/10 border border-[#ffbd59]/20 rounded-lg">
                    {(trade as any).requires_inspection ? (
                      appointmentsForTrade && appointmentsForTrade.length > 0 ? (
                        <div className="flex items-center gap-2">
                          <CheckCircle size={16} className="text-emerald-400" />
                          <p className="text-sm text-emerald-300 font-medium">
                            ✅ Besichtigung vereinbart: Sie können nun Angebote annehmen oder ablehnen.
                          </p>
                        </div>
                      ) : (
                        <div className="flex items-start gap-2">
                          <div className="flex-shrink-0 w-5 h-5 bg-[#ffbd59] text-black rounded-full flex items-center justify-center text-xs font-bold mt-0.5">!</div>
                          <div>
                            <p className="text-sm text-[#ffbd59] font-medium">Besichtigung erforderlich</p>
                            <p className="text-xs text-gray-300 mt-1">
                              Wählen Sie Angebote aus und vereinbaren Sie eine Besichtigung, bevor Sie Angebote annehmen können.
                            </p>
                          </div>
                        </div>
                      )
                    ) : (
                      <div className="flex items-center gap-2">
                        <CheckCircle size={16} className="text-emerald-400" />
                        <p className="text-sm text-emerald-300 font-medium">
                          💡 Direktannahme möglich: Sie können Angebote direkt annehmen oder ablehnen.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
            </div>
          )}
          
          {/* Documents Tab */}
          {activeTab === 'documents' && (
            <div 
              role="tabpanel" 
              id="documents-panel" 
              aria-labelledby="documents-tab"
              className="space-y-6"
            >
              <div className="bg-gradient-to-br from-[#1a1a2e]/50 to-[#2c3539]/50 rounded-xl border border-gray-600/30 overflow-hidden">
                <div className="flex items-center justify-between p-6">
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <FileText size={18} className="text-[#ffbd59]" />
                    Alle Dokumente ({documentsLoading ? '...' : (loadedDocuments && Array.isArray(loadedDocuments) ? loadedDocuments.length : 0)})
                  </h3>
                </div>
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
                    <>
                      {(() => {
                        const tradeDocsArray = trade?.documents && Array.isArray(trade.documents) ? trade.documents : [];
                        const loadedDocsArray = loadedDocuments && Array.isArray(loadedDocuments) ? loadedDocuments : [];
                        const allDocs = [...tradeDocsArray, ...loadedDocsArray];
                        const combinedDocs = allDocs.filter((doc, index, self) => 
                          index === self.findIndex(d => String(d.id) === String(doc.id))
                        );
                        return (
                          <TradeDocumentViewer 
                            documents={combinedDocs} 
                            existingQuotes={existingQuotes} 
                          />
                        );
                      })()}
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Progress Tab */}
          {activeTab === 'progress' && (
            <div 
              role="tabpanel" 
              id="progress-panel" 
              aria-labelledby="progress-tab"
              className="space-y-6"
            >
              {/* Chat-Dokumentation Banner für Dienstleister mit angenommenem Angebot */}
              {!isBautraeger() && acceptedQuote && (
                <div className="mb-6 p-4 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/30 rounded-xl">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-blue-500/20 rounded-lg flex-shrink-0">
                      <MessageCircle size={20} className="text-blue-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-blue-300 font-semibold mb-2">Baustand dokumentieren & kommunizieren</h3>
                      <p className="text-blue-200 text-sm mb-3">
                        Nutzen Sie den Chat, um den Baustand regelmäßig zu dokumentieren und Fotos hochzuladen. 
                        So halten Sie alle Beteiligten über den Fortschritt auf dem Laufenden.
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <div className="flex items-center gap-2 text-xs text-blue-300">
                          <Camera size={14} />
                          <span>Fotos hochladen</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-blue-300">
                          <FileText size={14} />
                          <span>Fortschritt dokumentieren</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-blue-300">
                          <Users size={14} />
                          <span>Team informieren</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <TradeProgress
                milestoneId={trade.id}
                currentProgress={currentProgress}
                onProgressChange={handleProgressChange}
                isBautraeger={isBautraeger()}
                isServiceProvider={!isBautraeger() && (acceptedQuote?.service_provider_id === user?.id || existingQuotes?.some(q => q.service_provider_id === user?.id))}
                completionStatus={completionStatus}
                onCompletionRequest={handleCompletionRequest}
                onCompletionResponse={handleCompletionResponse}
                hasAcceptedQuote={existingQuotes && existingQuotes.some(quote => quote.status === 'accepted')}
              />
              
              {/* Acceptance Workflow for Bauträger */}
              {isBautraeger() && completionStatus === 'completed_with_defects' && (
                <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-orange-300 mb-3 flex items-center gap-2">
                    <Settings size={20} />
                    Abnahme-Workflow
                  </h3>
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
                  <button
                    onClick={handleStartFinalAcceptance}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors"
                  >
                    <CheckCircle size={16} />
                    Finale Abnahme starten
                  </button>
                </div>
              )}
              
              {/* Acceptance Workflow for Dienstleister */}
              {!isBautraeger() && acceptedQuote && completionStatus === 'completed_with_defects' && (
                <div>
                  {renderAbnahmeWorkflow()}
                </div>
              )}
            </div>
          )}

          {/* Kontakt Tab - nur für Dienstleister */}
          {activeTab === 'contact' && !isBautraeger() && (
            <div 
              role="tabpanel" 
              id="contact-panel" 
              aria-labelledby="contact-tab"
              className="space-y-6"
            >
              <div className="bg-gradient-to-br from-[#1a1a2e]/80 to-[#2c3539]/80 rounded-xl border border-gray-600/30 p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-purple-500/20 rounded-lg">
                    <Phone size={24} className="text-purple-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">Bauträger-Kontaktdaten</h2>
                    <p className="text-gray-400 text-sm">Kontaktinformationen für direkte Kommunikation</p>
                  </div>
                </div>

                {/* Projektinformationen */}
                {project && (
                  <div className="mb-6 p-4 bg-gradient-to-r from-purple-500/10 to-indigo-500/10 border border-purple-500/30 rounded-xl">
                    <h3 className="text-purple-300 font-semibold mb-4 flex items-center gap-2">
                      <Building size={18} className="text-purple-400" />
                      Projektinformationen
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm text-purple-300 mb-1">Projektname</div>
                        <div className="text-white font-medium">{project.name || 'Nicht angegeben'}</div>
                      </div>
                      <div>
                        <div className="text-sm text-purple-300 mb-1">Projekttyp</div>
                        <div className="text-white font-medium">{getProjectTypeLabel(project.project_type) || 'Nicht angegeben'}</div>
                      </div>
                    </div>
                    {project.address && (
                      <div className="mt-3">
                        <div className="text-sm text-purple-300 mb-1">Projektadresse</div>
                        <div className="text-white font-medium">{project.address}</div>
                      </div>
                    )}
                  </div>
                )}

                {/* Kontaktdaten */}
                <div className="mb-6 p-4 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/30 rounded-xl">
                  <h3 className="text-blue-300 font-semibold mb-4 flex items-center gap-2">
                    <User size={18} className="text-blue-400" />
                    Kontaktdaten des Bauträgers
                  </h3>
                  
                  {loadingBautraegerContact ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mr-3"></div>
                      <span className="text-gray-300">Lade Kontaktdaten...</span>
                    </div>
                  ) : bautraegerContact ? (
                    <div className="space-y-4">
                      {/* Kontaktperson */}
                      {(bautraegerContact.first_name || bautraegerContact.last_name) && (
                        <div className="flex items-center gap-3">
                          <User size={16} className="text-blue-400" />
                          <div>
                            <div className="text-sm text-blue-300 mb-1">Ansprechpartner</div>
                            <div className="text-white font-medium">
                              {[bautraegerContact.first_name, bautraegerContact.last_name].filter(Boolean).join(' ')}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Firmenname - immer anzeigen */}
                      <div className="flex items-center gap-3">
                        <Building size={16} className="text-blue-400" />
                        <div>
                          <div className="text-sm text-blue-300 mb-1">Bauträger</div>
                          <div className="text-white font-medium">{bautraegerContact.company_name || 'Bauträger'}</div>
                        </div>
                      </div>

                      {/* Kontaktinformationen Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* E-Mail */}
                        {bautraegerContact.email && (
                          <div className="flex items-center gap-3">
                            <Mail size={16} className="text-blue-400" />
                            <div>
                              <div className="text-sm text-blue-300 mb-1">E-Mail</div>
                              <a 
                                href={`mailto:${bautraegerContact.email}`} 
                                className="text-[#ffbd59] hover:underline font-medium"
                              >
                                {bautraegerContact.email}
                              </a>
                            </div>
                          </div>
                        )}
                        
                        {/* Telefon */}
                        {bautraegerContact.phone && (
                          <div className="flex items-center gap-3">
                            <Phone size={16} className="text-blue-400" />
                            <div>
                              <div className="text-sm text-blue-300 mb-1">Telefon</div>
                              <a 
                                href={`tel:${bautraegerContact.phone}`} 
                                className="text-[#ffbd59] hover:underline font-medium"
                              >
                                {bautraegerContact.phone}
                              </a>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Firmenadresse */}
                      {bautraegerContact.company_address && (
                        <div className="flex items-center gap-3">
                          <MapPin size={16} className="text-blue-400" />
                          <div>
                            <div className="text-sm text-blue-300 mb-1">Firmenadresse</div>
                            <div className="text-white font-medium">{bautraegerContact.company_address}</div>
                          </div>
                        </div>
                      )}
                      
                      {/* Hinweis wenn keine Kontaktdaten verfügbar */}
                      {!bautraegerContact.email && !bautraegerContact.phone && (
                        <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                          <div className="flex items-center gap-2">
                            <Info size={16} className="text-yellow-400" />
                            <div className="text-yellow-300 text-sm">
                              Kontaktdaten des Bauträgers sind nicht verfügbar. 
                              Für direkte Kommunikation wenden Sie sich bitte über die Plattform an den Bauträger.
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="text-gray-400 mb-4">
                        <Phone size={48} className="mx-auto mb-4 opacity-50" />
                        <h4 className="text-lg font-semibold text-gray-300 mb-2">Keine Kontaktdaten verfügbar</h4>
                        <p className="text-sm">Die Kontaktdaten des Bauträgers konnten nicht geladen werden.</p>
                        <div className="text-xs text-gray-500 mt-2">
                          DEBUG: loadingBautraegerContact={loadingBautraegerContact ? 'true' : 'false'}, 
                          bautraegerContact={bautraegerContact ? 'exists' : 'null'}, 
                          trade.created_by={(trade as any)?.created_by || 'undefined'}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Schnellaktionen */}
                {bautraegerContact && (bautraegerContact.email || bautraegerContact.phone) && (
                  <div className="p-4 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-xl">
                    <h3 className="text-green-300 font-semibold mb-4 flex items-center gap-2">
                      <MessageCircle size={18} className="text-green-400" />
                      Schnellaktionen
                    </h3>
                    <div className="flex flex-wrap gap-3">
                      {bautraegerContact.email && (
                        <button
                          onClick={() => window.open(`mailto:${bautraegerContact.email}`, '_blank')}
                          className="px-4 py-2 bg-green-500/20 text-green-300 rounded-lg hover:bg-green-500/30 transition-colors flex items-center gap-2 border border-green-500/30 hover:scale-105 active:scale-95"
                        >
                          <Mail size={16} />
                          E-Mail senden
                        </button>
                      )}
                      
                      {bautraegerContact.phone && (
                        <button
                          onClick={() => window.open(`tel:${bautraegerContact.phone}`, '_blank')}
                          className="px-4 py-2 bg-green-500/20 text-green-300 rounded-lg hover:bg-green-500/30 transition-colors flex items-center gap-2 border border-green-500/30 hover:scale-105 active:scale-95"
                        >
                          <Phone size={16} />
                          Anrufen
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Hinweise */}
                <div className="mt-6 p-4 bg-gradient-to-r from-gray-500/10 to-slate-500/10 border border-gray-500/30 rounded-xl">
                  <h3 className="text-gray-300 font-semibold mb-3 flex items-center gap-2">
                    <Info size={16} className="text-gray-400" />
                    Hinweise
                  </h3>
                  <div className="space-y-2 text-sm text-gray-400">
                    <p>• Nutzen Sie die Kontaktdaten für direkte Kommunikation mit dem Bauträger</p>
                    <p>• E-Mail-Kommunikation wird automatisch in Ihrem E-Mail-Client geöffnet</p>
                    <p>• Telefonanrufe werden über Ihr Standard-Telefonie-Programm gestartet</p>
                    <p>• Bei Fragen zur Ausschreibung können Sie direkt Kontakt aufnehmen</p>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Abnahme Tab - nur für Dienstleister */}
          {activeTab === 'abnahme' && !isBautraeger() && acceptedQuote && (
            <div 
              role="tabpanel" 
              id="abnahme-panel" 
              aria-labelledby="abnahme-tab"
              className="space-y-6"
            >
              <div className="bg-gradient-to-br from-[#1a1a2e]/80 to-[#2c3539]/80 rounded-xl border border-gray-600/30 p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-[#ffbd59]/20 rounded-lg">
                    <CheckCircle2 size={24} className="text-[#ffbd59]" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">Abnahme-Workflow</h2>
                    <p className="text-gray-400 text-sm">Status und Aktionen zur Abnahme Ihres Gewerks</p>
                  </div>
                </div>

                {/* Status-Anzeige */}
                <div className="mb-6 p-4 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/30 rounded-xl">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-blue-500/20 rounded-lg">
                      <Info size={20} className="text-blue-400" />
                    </div>
                    <h3 className="text-blue-300 font-semibold">Aktueller Status</h3>
                  </div>
                  
                  {completionStatus === 'completed_with_defects' ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                        <span className="text-yellow-300 font-medium">Abnahme unter Vorbehalt</span>
                      </div>
                      <p className="text-yellow-200 text-sm">
                        Der Bauträger hat Mängel dokumentiert. Bitte beheben Sie diese für die finale Abnahme.
                      </p>
                      <div className="mt-4">
                        <button
                          onClick={() => {
                            // Verwende bestehende Funktion für Abnahme-Response
                            handleCompletionResponse(true, 'Mängelbehebung abgeschlossen');
                          }}
                          className="px-4 py-2 bg-[#ffbd59] text-[#1a1a2e] rounded-lg hover:bg-[#ffbd59]/90 transition-colors font-medium"
                        >
                          Mängelbehebung abgeschlossen melden
                        </button>
                      </div>
                    </div>
                  ) : completionStatus === 'defects_resolved' ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-blue-400 rounded-full animate-pulse"></div>
                        <span className="text-blue-300 font-medium">Warten auf finale Abnahme</span>
                      </div>
                      <p className="text-blue-200 text-sm">
                        Sie haben die Mängelbehebung gemeldet. Der Bauträger wird die finale Abnahme durchführen.
                      </p>
                    </div>
                  ) : completionStatus === 'completion_requested' ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                        <span className="text-green-300 font-medium">Abnahme angefordert</span>
                      </div>
                      <p className="text-green-200 text-sm">
                        Sie haben die Fertigstellung gemeldet. Der Bauträger wird die Abnahme durchführen.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                        <span className="text-gray-300 font-medium">Noch nicht zur Abnahme bereit</span>
                      </div>
                      <p className="text-gray-200 text-sm">
                        Das Gewerk ist noch nicht zur Abnahme bereit. Melden Sie die Fertigstellung über den Fortschritt-Tab.
                      </p>
                    </div>
                  )}
                </div>

                {/* Mängel-Anzeige (falls vorhanden) */}
                {acceptanceDefects && acceptanceDefects.length > 0 && (
                  <div className="mb-6 p-4 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/30 rounded-xl">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-yellow-500/20 rounded-lg">
                        <AlertTriangle size={20} className="text-yellow-400" />
                      </div>
                      <h3 className="text-yellow-300 font-semibold">Dokumentierte Mängel</h3>
                    </div>
                    
                    <div className="space-y-3">
                      {acceptanceDefects.map((defect: any, index: number) => (
                        <div key={index} className="p-3 bg-yellow-500/5 border border-yellow-500/20 rounded-lg">
                          <div className="flex items-start gap-3">
                            <div className="w-2 h-2 bg-yellow-400 rounded-full mt-2 flex-shrink-0"></div>
                            <div className="flex-1">
                              <p className="text-yellow-200 text-sm font-medium mb-1">
                                {defect.description || 'Mangel ohne Beschreibung'}
                              </p>
                              {defect.location && (
                                <p className="text-yellow-300/70 text-xs">
                                  Ort: {defect.location}
                                </p>
                              )}
                              {defect.severity && (
                                <p className="text-yellow-300/70 text-xs">
                                  Schweregrad: {defect.severity}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Vollständiger Rechnungsstellungs-Abschnitt */}
                {completionStatus === 'completed' && (
                  <div className="p-6 bg-gradient-to-br from-[#1a1a2e]/80 to-[#2c3539]/80 rounded-xl border border-gray-600/30 backdrop-blur-sm shadow-lg">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="p-3 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-lg shadow-lg">
                        <Receipt size={24} className="text-green-400" />
                      </div>
                      <div>
                        <h3 className="text-green-300 font-semibold text-xl">Rechnungsstellung</h3>
                        <p className="text-gray-400 text-sm">Verwalten Sie Ihre Rechnungen für dieses Gewerk</p>
                      </div>
                    </div>
                    
                    {existingInvoice && ['sent', 'viewed', 'paid', 'overdue'].includes(existingInvoice.status) ? (
                      // Bestehende Rechnung anzeigen
                      <div className="space-y-4">
                        <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-xl p-4 backdrop-blur-sm shadow-lg hover:shadow-xl hover:shadow-green-500/20 transition-all duration-300">
                          <div className="flex items-center justify-between mb-4">
                            <h4 className="text-green-300 font-semibold text-lg flex items-center gap-2">
                              <FileText size={18} />
                              Rechnung erstellt
                            </h4>
                            <span className={`px-3 py-1 rounded-full text-sm font-medium shadow-lg ${
                              existingInvoice.status === 'paid' 
                                ? 'bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-300 border border-green-500/30'
                                : existingInvoice.status === 'sent'
                                ? 'bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-blue-300 border border-blue-500/30'
                                : 'bg-gradient-to-r from-yellow-500/20 to-orange-500/20 text-yellow-300 border border-yellow-500/30'
                            }`}>
                              {existingInvoice.status === 'paid' ? 'Bezahlt' : 
                               existingInvoice.status === 'sent' ? 'Versendet' : 'Entwurf'}
                            </span>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-gradient-to-r from-[#1a1a2e]/50 to-[#2c3539]/50 rounded-lg p-3 border border-gray-600/30">
                              <div className="text-sm text-gray-400 mb-1">Rechnungsnummer</div>
                              <div className="text-white font-semibold">{existingInvoice.invoice_number}</div>
                            </div>
                            <div className="bg-gradient-to-r from-[#1a1a2e]/50 to-[#2c3539]/50 rounded-lg p-3 border border-gray-600/30">
                              <div className="text-sm text-gray-400 mb-1">Betrag</div>
                              <div className="text-[#ffbd59] font-bold text-lg">
                                {new Intl.NumberFormat('de-DE', {
                                  style: 'currency',
                                  currency: existingInvoice.currency || 'EUR'
                                }).format(existingInvoice.total_amount || 0)}
                              </div>
                            </div>
                            {existingInvoice.created_at && (
                              <div className="bg-gradient-to-r from-[#1a1a2e]/50 to-[#2c3539]/50 rounded-lg p-3 border border-gray-600/30">
                                <div className="text-sm text-gray-400 mb-1">Erstellt am</div>
                                <div className="text-white font-medium">
                                  {new Date(existingInvoice.created_at).toLocaleDateString('de-DE')}
                                </div>
                              </div>
                            )}
                            {existingInvoice.status === 'paid' && existingInvoice.paid_at && (
                              <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-lg p-3 border border-green-500/30">
                                <div className="text-sm text-green-400 mb-1">Bezahlt am</div>
                                <div className="text-green-300 font-semibold">
                                  {new Date(existingInvoice.paid_at).toLocaleDateString('de-DE')}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ) : (
                      // Rechnung erstellen - behandle draft und cancelled als "keine Rechnung"
                      <div className="space-y-4">
                        <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-xl p-4 backdrop-blur-sm">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="p-2 bg-green-500/20 rounded-lg">
                              <CheckCircle size={20} className="text-green-400" />
                            </div>
                            <h4 className="text-green-300 font-semibold text-lg">Ausschreibung erfolgreich abgenommen</h4>
                          </div>
                          <p className="text-gray-300 text-sm leading-relaxed">
                            Die Ausschreibung wurde vollständig abgenommen. Sie können jetzt Ihre Rechnung erstellen und versenden.
                          </p>
                        </div>
                        
                        <button
                          onClick={() => setShowInvoiceModal(true)}
                          className="flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-green-500/30 hover:scale-105 active:scale-95"
                        >
                          <FileText size={18} />
                          Rechnung stellen
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Workflow-Aktionen */}
                <div className="mt-6 p-4 bg-gradient-to-r from-gray-500/10 to-slate-500/10 border border-gray-500/30 rounded-xl">
                  <h3 className="text-gray-300 font-semibold mb-3">Nächste Schritte</h3>
                  <div className="space-y-2 text-sm text-gray-400">
                    {completionStatus === 'completed_with_defects' ? (
                      <>
                        <p>• Beheben Sie die dokumentierten Mängel</p>
                        <p>• Melden Sie die Mängelbehebung über den Button oben</p>
                        <p>• Warten Sie auf die finale Abnahme durch den Bauträger</p>
                        <p>• Nach erfolgreicher Abnahme können Sie die Rechnung stellen</p>
                      </>
                    ) : completionStatus === 'defects_resolved' ? (
                      <>
                        <p>• Der Bauträger wurde über die Mängelbehebung informiert</p>
                        <p>• Warten Sie auf die finale Abnahme</p>
                        <p>• Nach erfolgreicher Abnahme können Sie die Rechnung stellen</p>
                      </>
                    ) : completionStatus === 'completion_requested' ? (
                      <>
                        <p>• Der Bauträger wurde über die Fertigstellung informiert</p>
                        <p>• Warten Sie auf die Abnahme durch den Bauträger</p>
                        <p>• Nach erfolgreicher Abnahme können Sie die Rechnung stellen</p>
                      </>
                    ) : completionStatus === 'completed' ? (
                      <>
                        <p>• Das Gewerk wurde erfolgreich abgenommen</p>
                        <p>• Sie können nun Ihre Rechnung stellen (siehe Abschnitt oben)</p>
                        <p>• Verfolgen Sie den Status Ihrer Rechnung</p>
                      </>
                    ) : (
                      <>
                        <p>• Schließen Sie Ihr Gewerk ab</p>
                        <p>• Melden Sie die Fertigstellung über den Fortschritt-Tab</p>
                        <p>• Warten Sie auf die Abnahme durch den Bauträger</p>
                        <p>• Nach erfolgreicher Abnahme können Sie die Rechnung stellen</p>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
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
          projectId={trade?.project_id || project?.id}
          serviceProviderId={acceptedQuote?.service_provider_id || userQuote?.service_provider_id || user?.id}
          onInvoiceSubmitted={() => {
            setShowInvoiceModal(false);
            // Lade die Rechnung neu
            loadExistingInvoice();
            // Trigger eine Aktualisierung des Trades
            if (onTradeUpdate) {
              onTradeUpdate({ ...trade, has_invoice: true });
            }
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

      </div>
      
      {/* Löschbestätigungs-Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-gradient-to-br from-[#2c3539] to-[#1a1a2e] rounded-2xl shadow-2xl w-full max-w-md border border-red-500/30">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-red-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Ausschreibung löschen</h3>
                  <p className="text-sm text-gray-400">Diese Aktion kann nicht rückgängig gemacht werden</p>
                </div>
              </div>
              
              <div className="mb-6">
                <p className="text-gray-300 mb-3">
                  Möchten Sie die Ausschreibung <strong className="text-white">"{trade?.title}"</strong> wirklich löschen?
                </p>
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-red-300">
                      <p className="font-medium mb-1">Wichtiger Hinweis:</p>
                      <p>Diese Ausschreibung kann nur gelöscht werden, wenn noch keine Angebote von Dienstleistern vorliegen.</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
                  disabled={isDeletingTrade}
                >
                  Abbrechen
                </button>
                <button
                  onClick={handleDeleteTrade}
                  disabled={isDeletingTrade}
                  className="px-6 py-2 bg-red-500 hover:bg-red-600 disabled:bg-red-500/50 text-white rounded-lg font-semibold transition-colors flex items-center gap-2"
                >
                  {isDeletingTrade ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Löschen...
                    </>
                  ) : (
                    <>
                      <Trash2 size={16} />
                      Endgültig löschen
                    </>
                  )}
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
          acceptanceId={acceptanceId || 0}
          milestoneId={trade?.id || 0}
          milestoneTitle={trade?.title || 'Ausschreibung'}
          defects={acceptanceDefects}
          onAcceptanceComplete={() => {
            setShowFinalAcceptanceModal(false);
            // Reload der Daten nach finaler Abnahme
            if (trade?.id) {
              loadTradeDocuments(trade.id);
              loadCompletionStatus(trade.id);
              // Prüfe finale Abnahme-Status neu
              checkFinalAcceptance();
            }
          }}
        />
      )}
    </>
  );
}
