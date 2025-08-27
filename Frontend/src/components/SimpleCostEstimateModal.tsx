import React, { useState, useEffect, useMemo, useRef } from 'react';
import { X, FileText, Euro, Calendar, User, Check, XCircle, RotateCcw, Eye, AlertTriangle, Phone, Mail, Star, MessageCircle, ExternalLink, Clock, CheckCircle, PlayCircle, Settings, MapPin, Building, Briefcase, Flag, TrendingUp, AlertCircle, Download, ChevronDown, Square, CheckSquare, Info, Receipt, CreditCard, Archive, Globe } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getAuthenticatedFileUrl, getApiBaseUrl, apiCall } from '../api/api';
import TradeProgress from './TradeProgress';
import AcceptanceModal from './AcceptanceModalNew';
import FinalAcceptanceModal from './FinalAcceptanceModal';

// TradeDocumentViewer Komponente aus TradeDetailsModal
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

function TradeDocumentViewer({ documents, existingQuotes }: DocumentViewerProps) {
  const [selectedDoc, setSelectedDoc] = useState<string | null>(null);
  const [viewerError, setViewerError] = useState<string | null>(null);
  const [documentBlobs, setDocumentBlobs] = useState<{[key: string]: string}>({});
  const [loadingDocs, setLoadingDocs] = useState<{[key: string]: boolean}>({});
  const { isBautraeger } = useAuth();

  // Cleanup Blob-URLs beim Unmount
  useEffect(() => {
    return () => {
      Object.values(documentBlobs).forEach(url => {
        if (url) URL.revokeObjectURL(url);
      });
    };
  }, [documentBlobs]);

  // Robuste Dokumentenverarbeitung
  const safeDocuments = useMemo(() => {
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

  // Funktion zum Laden von Dokumenten mit Token-Authentifizierung
  const loadDocumentBlob = async (doc: any) => {
    const docKey = String(doc.id);
    if (documentBlobs[docKey] || loadingDocs[docKey]) return;
    
    setLoadingDocs(prev => ({ ...prev, [docKey]: true }));
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Kein Authentifizierungstoken verfügbar');
      }
      
      const documentId = extractDocumentIdFromUrl(doc.url || doc.file_path || '') || doc.id;
      const baseUrl = getApiBaseUrl();
      
      const response = await fetch(`${baseUrl}/documents/${documentId}/content`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      
      setDocumentBlobs(prev => ({ ...prev, [docKey]: blobUrl }));
      console.log('✅ Dokument-Blob geladen für:', doc.name);
    } catch (error) {
      console.error('❌ Fehler beim Laden des Dokument-Blobs:', error);
      setViewerError(`Fehler beim Laden: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`);
    } finally {
      setLoadingDocs(prev => ({ ...prev, [docKey]: false }));
    }
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
                    onClick={async (e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      
                      if (selectedDoc === String(doc.id)) {
                        // Schließen
                        setSelectedDoc(null);
                        setViewerError(null);
                      } else {
                        // Öffnen und Dokument laden
                        setSelectedDoc(String(doc.id));
                        setViewerError(null);
                        await loadDocumentBlob(doc);
                      }
                    }}
                    className={`flex items-center gap-1 px-3 py-2 rounded-lg transition-all duration-200 text-sm font-medium ${
                        selectedDoc === String(doc.id)
                        ? 'bg-[#ffbd59] text-[#1a1a2e] shadow-lg'
                        : 'bg-[#ffbd59]/20 text-[#ffbd59] hover:bg-[#ffbd59]/30'
                    }`}
                    title="Dokument anzeigen"
                    disabled={loadingDocs[String(doc.id)]}
                  >
                    <Eye size={14} />
                    {loadingDocs[String(doc.id)] ? 'Lädt...' : 
                     selectedDoc === String(doc.id) ? 'Schließen' : 'Ansehen'}
                  </button>
                )}
                  
                  {(isBautraeger() || existingQuotes.some((quote: any) => quote.status === 'accepted')) && (
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
                          
                          const documentId = extractDocumentIdFromUrl(doc.url || doc.file_path || '') || doc.id;
                          const baseUrl = getApiBaseUrl();
                          
                          const response = await fetch(`${baseUrl}/documents/${documentId}/content`, {
                            headers: {
                              'Authorization': `Bearer ${token}`
                            }
                          });
                          
                          if (!response.ok) {
                            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                          }
                          
                          const blob = await response.blob();
                          const url = URL.createObjectURL(blob);
                          
                          // Download auslösen
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = doc.name || doc.title || doc.file_name || 'document';
                          document.body.appendChild(a);
                          a.click();
                          document.body.removeChild(a);
                          
                          // Cleanup
                          setTimeout(() => URL.revokeObjectURL(url), 1000);
                          
                          console.log('✅ Dokument-Download erfolgreich:', doc.name);
                        } catch (error) {
                          console.error('❌ Fehler beim Download:', error);
                          alert('Dokument konnte nicht heruntergeladen werden');
                        }
                      }}
                      className="flex items-center gap-1 px-3 py-2 bg-green-600/20 text-green-400 rounded-lg hover:bg-green-600/30 transition-all duration-200 text-sm font-medium"
                      title={isBautraeger() ? "Dokument herunterladen" : "Dokument herunterladen (nur nach Angebotsannahme)"}
                    >
                      <Download size={14} />
                      Download
                    </button>
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
                        
                        const documentId = extractDocumentIdFromUrl(doc.url || doc.file_path || '') || doc.id;
                        const baseUrl = getApiBaseUrl();
                        
                        const response = await fetch(`${baseUrl}/documents/${documentId}/content`, {
                          headers: {
                            'Authorization': `Bearer ${token}`
                          }
                        });
                        
                        if (!response.ok) {
                          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                        }
                        
                        const blob = await response.blob();
                        const url = URL.createObjectURL(blob);
                        window.open(url, '_blank');
                        setTimeout(() => URL.revokeObjectURL(url), 1000);
                        
                        console.log('✅ Dokument extern geöffnet:', doc.name);
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
                      
                      <div className="h-96 bg-white/5">
                        {loadingDocs[String(doc.id)] ? (
                          <div className="flex items-center justify-center h-full">
                            <div className="text-center">
                              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#ffbd59] mx-auto mb-2"></div>
                              <p className="text-gray-400 text-sm">Dokument wird geladen...</p>
                            </div>
                          </div>
                        ) : documentBlobs[String(doc.id)] ? (
                          <iframe
                            src={documentBlobs[String(doc.id)]}
                            className="w-full h-full border-0"
                            title={doc.name || doc.title || doc.file_name || 'Dokument'}
                            onError={() => setViewerError('Dokument konnte nicht angezeigt werden')}
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full">
                            <div className="text-center">
                              <FileText size={48} className="text-gray-500 mx-auto mb-2" />
                              <p className="text-gray-400 text-sm">Dokument nicht verfügbar</p>
                            </div>
                          </div>
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

interface SimpleCostEstimateModalProps {
  isOpen: boolean;
  onClose: () => void;
  trade: any;
  quotes: any[];
  project: any;
  onAcceptQuote?: (quoteId: number) => void;
  onRejectQuote?: (quoteId: number, reason: string) => void;
  onResetQuote?: (quoteId: number) => void;
  onCreateInspection?: (tradeId: number, selectedQuoteIds: number[]) => void;
  onTradeUpdate?: (updatedTrade: any) => void;
  inspectionStatus?: {
    hasActiveInspection: boolean;
    appointmentDate?: string;
    isInspectionDay: boolean;
    selectedServiceProviderId?: number;
  };
}

export default function SimpleCostEstimateModal({ 
  isOpen, 
  onClose, 
  trade, 
  quotes, 
  project,
  onAcceptQuote,
  onRejectQuote,
  onResetQuote,
  onCreateInspection,
  onTradeUpdate,
  inspectionStatus: propInspectionStatus
}: SimpleCostEstimateModalProps) {
  const { user, isBautraeger } = useAuth();
  // State für Modal-Funktionen
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedQuoteForAction, setSelectedQuoteForAction] = useState<any>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [selectedQuotesForInspection, setSelectedQuotesForInspection] = useState<number[]>([]);
  
  // State für einklappbare Abschnitte
  const [isContractorExpanded, setIsContractorExpanded] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showServiceProviderRating, setShowServiceProviderRating] = useState(false);
  
  // Dokumente-States
  const [loadedDocuments, setLoadedDocuments] = useState<any[]>([]);
  const [documentsLoading, setDocumentsLoading] = useState(false);
  const [documentsError, setDocumentsError] = useState<string | null>(null);
  
  // Abnahme-States
  const [showAcceptanceModal, setShowAcceptanceModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showFinalAcceptanceModal, setShowFinalAcceptanceModal] = useState(false);
  // Temporäre Lösung: Simuliere completion_status für Demo-Zwecke
  const simulatedCompletionStatus = trade?.id === 1 ? 'completion_requested' : (trade?.completion_status || 'in_progress');
  const [completionStatus, setCompletionStatus] = useState(simulatedCompletionStatus);
  const [acceptanceDefects, setAcceptanceDefects] = useState<any[]>([]);
  const [acceptanceId, setAcceptanceId] = useState<number | null>(null);
  
  // Rechnungs-States
  const [existingInvoice, setExistingInvoice] = useState<any>(null);
  const [showInvoiceViewer, setShowInvoiceViewer] = useState(false);
  const [isMarkingAsPaid, setIsMarkingAsPaid] = useState(false);
  const [proposedDate, setProposedDate] = useState('');
  const [proposedTime, setProposedTime] = useState('');
  const [scheduleNotes, setScheduleNotes] = useState('');
  
  // Besichtigungs-States
  const [inspectionStatus, setInspectionStatus] = useState({
    hasActiveInspection: false,
    appointmentDate: null as string | null,
    isInspectionDay: false,
    selectedServiceProviderId: null as number | null
  });
  const [appointmentResponses, setAppointmentResponses] = useState<any[]>([]);
  
  // Kommunikations-States
  const [showCommunicationModal, setShowCommunicationModal] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [communicationLoading, setCommunicationLoading] = useState(false);
  
  // Fortschritts-States
  const [currentProgress, setCurrentProgress] = useState(0);
  
  // Zusätzliche States für erweiterte Funktionen
  const [isExpanded, setIsExpanded] = useState(false);

  // Lade Dokumente beim Öffnen des Modals
  useEffect(() => {
    if (isOpen && trade?.id) {
      console.log('🔍 SimpleCostEstimateModal geöffnet für Trade:', trade.id);
      console.log('🔍 SimpleCostEstimateModal - User Rolle:', user?.user_role);
      console.log('🔍 SimpleCostEstimateModal - isBautraeger:', isBautraeger());
      loadTradeDocuments(trade.id);
    }
  }, [isOpen, trade?.id]);

  if (!isOpen) return null;

  const acceptedQuote = quotes.find(q => q.status === 'accepted');
  const submittedQuotes = quotes.filter(q => q.status === 'submitted');
  
  console.log('🎯 SIMPLE MODAL RENDER - Trade:', trade?.id, 'Quotes:', quotes?.length, 'Accepted:', acceptedQuote?.id);

  // Handler-Funktionen
  const handleAcceptQuote = async (quote: any) => {
    if (!onAcceptQuote) return;
    setLoading(true);
    try {
      await onAcceptQuote(quote.id);
    } catch (error) {
      console.error('Fehler beim Annehmen des Angebots:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRejectQuote = async () => {
    if (!onRejectQuote || !selectedQuoteForAction) return;
    setLoading(true);
    try {
      await onRejectQuote(selectedQuoteForAction.id, rejectionReason);
      setShowRejectModal(false);
      setSelectedQuoteForAction(null);
      setRejectionReason('');
    } catch (error) {
      console.error('Fehler beim Ablehnen des Angebots:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResetQuote = async (quote: any) => {
    if (!onResetQuote) return;
    setLoading(true);
    try {
      await onResetQuote(quote.id);
    } catch (error) {
      console.error('Fehler beim Zurücksetzen des Angebots:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateInspection = () => {
    if (!onCreateInspection || selectedQuotesForInspection.length === 0) return;
    onCreateInspection(trade.id, selectedQuotesForInspection);
  };

  const toggleQuoteForInspection = (quoteId: number) => {
    setSelectedQuotesForInspection(prev => 
      prev.includes(quoteId) 
        ? prev.filter(id => id !== quoteId)
        : [...prev, quoteId]
    );
  };

  // Abnahme-Handler-Funktionen
  const handleStartAcceptance = () => {
    console.log('🚀 Abnahme wird gestartet für Trade:', trade?.id);
    setShowAcceptanceModal(true);
  };

  const handleScheduleAcceptance = async () => {
    if (!proposedDate || !proposedTime) {
      alert('Bitte wählen Sie Datum und Uhrzeit für den Abnahme-Termin.');
      return;
    }

    try {
      console.log('📅 Terminvorschlag für Abnahme:', { proposedDate, proposedTime, scheduleNotes });
      
      const proposedDateTime = new Date(`${proposedDate}T${proposedTime}`);
      const { api } = await import('../api/api');
      
      const response = await api.post('/appointments/schedule', {
        trade_id: trade.id,
        appointment_type: 'acceptance',
        proposed_date: proposedDateTime.toISOString(),
        notes: scheduleNotes
      });

      const result = response.data || response;
      console.log('✅ Abnahme-Termin vorgeschlagen:', result);
      
      setShowScheduleModal(false);
      setProposedDate('');
      setProposedTime('');
      setScheduleNotes('');
      
      alert('Abnahme-Termin wurde vorgeschlagen. Der Dienstleister wird benachrichtigt.');
    } catch (error) {
      console.error('❌ Fehler bei Terminvereinbarung:', error);
      alert('Fehler bei der Terminvereinbarung. Bitte versuchen Sie es erneut.');
    }
  };

  const handleCompleteAcceptance = async (acceptanceData: any) => {
    console.log('🏁 Abnahme wird abgeschlossen:', acceptanceData);
    setLoading(true);
    
    try {
      const { api } = await import('../api/api');
      
      // Erstelle eine neue Abnahme oder aktualisiere eine bestehende
      const response = await api.post('/acceptance/complete', {
        accepted: acceptanceData.accepted,
        acceptanceNotes: acceptanceData.acceptanceNotes,
        defects: acceptanceData.defects || [],
        milestone_id: trade.id,
        project_id: trade.project_id,
        quote_id: acceptedQuote?.id,
        completion_date: new Date().toISOString(),
        inspector_name: acceptanceData.inspectorName || 'Bauträger',
        inspector_signature: acceptanceData.inspectorSignature || null
      });

      const result = response.data || response;
      console.log('✅ Abnahme erfolgreich abgeschlossen:', result);
      
      // Schließe Modal
      setShowAcceptanceModal(false);
      
      // Update Status basierend auf Ergebnis
      if (acceptanceData.accepted && acceptanceData.defects.length === 0) {
        setCompletionStatus('completed');
        
        // Zeige Erfolgs-Nachricht
        alert('✅ Abnahme erfolgreich abgeschlossen!');
      } else {
        setCompletionStatus('completed_with_defects');
        
        // Bei "Abnahme unter Vorbehalt" - lade Mängel und öffne finale Abnahme-Modal
        const defectCount = acceptanceData.defects?.length || 0;
        alert(`⚠️ Abnahme unter Vorbehalt abgeschlossen. ${defectCount} Mängel dokumentiert und automatisch als Tasks für den Dienstleister erstellt.`);
        
        // Setze die Mängel für das finale Abnahme-Modal
        console.log('🔍 Setze Mängel für finale Abnahme:', acceptanceData.defects);
        setAcceptanceDefects(acceptanceData.defects || []);
        
        // Öffne das finale Abnahme-Modal nach kurzer Verzögerung
        setTimeout(() => {
          console.log('🔍 Öffne FinalAcceptanceModal mit Mängeln:', acceptanceData.defects);
          setShowFinalAcceptanceModal(true);
        }, 1000);
      }
      
      // Lade aktuelle Daten vom Backend
      if (onTradeUpdate) {
        onTradeUpdate({ ...trade, completion_status: acceptanceData.accepted ? 'completed' : 'completed_with_defects' });
      }
      
    } catch (error) {
      console.error('❌ Fehler bei Abnahme:', error);
      alert('Fehler bei der Abnahme. Bitte versuchen Sie es erneut.');
    } finally {
      setLoading(false);
    }
  };

  const handleFinalAcceptance = async (finalAccepted: boolean, finalNotes: string) => {
    try {
      setLoading(true);
      const { api } = await import('../api/api');
      
      const response = await api.post('/acceptance/final', {
        trade_id: trade.id,
        accepted: finalAccepted,
        notes: finalNotes,
        defects_resolved: finalAccepted
      });

      console.log('✅ Finale Abnahme abgeschlossen:', response.data);
      
      setShowFinalAcceptanceModal(false);
      setCompletionStatus(finalAccepted ? 'completed' : 'completed_with_defects');
      
      if (finalAccepted) {
        alert('✅ Finale Abnahme erfolgreich! Das Gewerk ist vollständig abgeschlossen.');
      } else {
        alert('⚠️ Finale Abnahme mit verbleibenden Mängeln dokumentiert.');
      }
      
      if (onTradeUpdate) {
        onTradeUpdate({ ...trade, completion_status: finalAccepted ? 'completed' : 'completed_with_defects' });
      }
      
    } catch (error) {
      console.error('❌ Fehler bei finaler Abnahme:', error);
      alert('Fehler bei der finalen Abnahme. Bitte versuchen Sie es erneut.');
    } finally {
      setLoading(false);
    }
  };
  
  // Handler für Fortschrittsänderungen
  const handleProgressChange = (newProgress: number) => {
    setCurrentProgress(newProgress);
  };

  // Lade dokumentierte Mängel
  const loadAcceptanceDefects = async () => {
    if (!trade?.id) return;
    
    try {
      const { api } = await import('../api/api');
      
      // Lade zuerst die Abnahme-Informationen
      const acceptanceResponse = await api.get(`/acceptance/milestone/${trade.id}`);
      if (acceptanceResponse.data && acceptanceResponse.data.length > 0) {
        const latestAcceptance = acceptanceResponse.data[acceptanceResponse.data.length - 1];
        setAcceptanceId(latestAcceptance.id);
        console.log('✅ Abnahme-ID gesetzt:', latestAcceptance.id);
      }
      
      // Lade dann die Mängel (alle, auch bereits erledigte für finale Abnahme)
      const defectsResponse = await api.get(`/acceptance/milestone/${trade.id}/defects?include_resolved=true`);
      setAcceptanceDefects(defectsResponse.data || []);
      console.log('✅ Abnahme-Mängel geladen (inkl. erledigte):', defectsResponse.data);
    } catch (error) {
      console.error('❌ Fehler beim Laden der Abnahme-Mängel:', error);
      setAcceptanceDefects([]);
      setAcceptanceId(null);
    }
  };

  // Lade bestehende Rechnung
  const loadExistingInvoice = async () => {
    if (!trade?.id) return;
    
    console.log('🔍 SimpleCostEstimateModal - loadExistingInvoice gestartet für Trade:', trade.id);
    
    try {
      const { api } = await import('../api/api');
      const response = await api.get(`/invoices/milestone/${trade.id}`);
      
      if (response.data) {
        setExistingInvoice(response.data);
        console.log('✅ Bestehende Rechnung geladen:', response.data);
      } else {
        console.log('ℹ️ Keine Rechnung in Response gefunden');
        setExistingInvoice(null);
      }
    } catch (error: any) {
      if (error.response?.status !== 404) {
        console.error('❌ Fehler beim Laden der bestehenden Rechnung:', error);
      } else {
        console.log('ℹ️ Keine Rechnung vorhanden (404)');
      }
      // 404 ist OK - bedeutet nur dass noch keine Rechnung existiert
      setExistingInvoice(null);
    }
  };

  // Handler für Rechnung anzeigen
  const handleViewInvoice = async () => {
    if (!existingInvoice) return;
    
    try {
      const { api } = await import('../api/api');
      
      // Mark as viewed (löst automatische DMS-Integration im Backend aus)
      await api.post(`/invoices/${existingInvoice.id}/mark-viewed`);
      
      // Open PDF in new window
      const token = localStorage.getItem('token');
      const baseUrl = window.location.hostname === 'localhost' 
        ? 'http://localhost:8000' 
        : '';
      
      // Erstelle einen Blob-URL mit Authorization Header
      const response = await fetch(`${baseUrl}/api/v1/invoices/${existingInvoice.id}/download`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        window.open(url, '_blank');
        
        // Cleanup nach kurzer Zeit
        setTimeout(() => window.URL.revokeObjectURL(url), 1000);
      } else {
        throw new Error('Fehler beim Laden der Rechnung');
      }
      
    } catch (error) {
      console.error('❌ Fehler beim Anzeigen der Rechnung:', error);
      alert('Fehler beim Öffnen der Rechnung. Bitte versuchen Sie es erneut.');
    }
  };

  // Handler für Rechnung als bezahlt markieren
  const handleMarkAsPaid = async () => {
    if (!existingInvoice) return;
    
    if (!confirm('Möchten Sie diese Rechnung wirklich als bezahlt markieren?')) {
      return;
    }
    
    setIsMarkingAsPaid(true);
    
    try {
      const { api } = await import('../api/api');
      
      const response = await api.post(`/invoices/${existingInvoice.id}/mark-paid`, {
        paid_at: new Date().toISOString(),
        payment_reference: `Bauträger-Zahlung-${Date.now()}`
      });
      
      if (response.data) {
        // Aktualisiere die lokale Rechnung
        setExistingInvoice((prev: any) => ({
          ...prev,
          status: 'paid',
          paid_at: new Date().toISOString()
        }));
        
        // Erfolgreiche Benachrichtigung mit DMS-Hinweis
        const message = `✅ Rechnung wurde erfolgreich als bezahlt markiert!
        
📁 Die Rechnung wurde automatisch im DMS kategorisiert:
• Kategorie: Finanzen & Abrechnung
• Unterkategorie: Bezahlte Rechnungen
• Status: Automatisch archiviert
• Tags: Rechnung, Bezahlt, ${trade?.title || 'Gewerk'}

Das Dokument ist jetzt im Projektarchiv verfügbar und kann jederzeit abgerufen werden.`;
        
        alert(message);
      }
      
    } catch (error) {
      console.error('❌ Fehler beim Markieren als bezahlt:', error);
      alert('Fehler beim Markieren der Rechnung als bezahlt. Bitte versuchen Sie es erneut.');
    } finally {
      setIsMarkingAsPaid(false);
    }
  };

  // Handler für Rechnung herunterladen
  const handleDownloadInvoice = async () => {
    if (!existingInvoice) return;
    
    try {
      const { api } = await import('../api/api');
      
      // Zuerst mark-viewed aufrufen, damit DMS-Dokument erstellt wird falls noch nicht vorhanden
      await api.post(`/invoices/${existingInvoice.id}/mark-viewed`);
      
      const response = await api.get(`/invoices/${existingInvoice.id}/download`, { 
        responseType: 'blob' 
      });
      
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Rechnung_${existingInvoice.invoice_number}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('❌ Fehler beim Herunterladen der Rechnung:', error);
      alert('Fehler beim Herunterladen der Rechnung. Bitte versuchen Sie es erneut.');
    }
  };
  
  // Handler für Archivierung
  const handleArchiveTrade = async () => {
    if (!trade?.id) return;
    
    const confirmed = window.confirm(
      `Möchten Sie das Gewerk "${trade.title}" wirklich ins Archiv verschieben?\n\n` +
      'Das Gewerk wird mit allen Informationen (Dienstleister, Angebot, Rechnung) archiviert ' +
      'und kann im Archiv-Bereich eingesehen werden.'
    );
    
    if (!confirmed) return;
    
    try {
      setLoading(true);
      
      // API-Call zum Archivieren des Gewerks
      const { apiCall } = await import('../api/api');
      const response = await apiCall(`/milestones/${trade.id}/archive`, {
        method: 'POST',
        body: JSON.stringify({
          archived_at: new Date().toISOString(),
          archived_by: 'bautraeger',
          archive_reason: 'Gewerk abgeschlossen und Rechnung bezahlt'
        })
      });
      
      if (response) {
        alert('✅ Gewerk wurde erfolgreich ins Archiv verschoben!');
        
        // Aktualisiere das Trade-Objekt
        if (onTradeUpdate) {
          onTradeUpdate({ 
            ...trade, 
            completion_status: 'archived',
            archived_at: new Date().toISOString()
          });
        }
        
        // Schließe das Modal
        onClose();
      }
      
    } catch (error) {
      console.error('❌ Fehler beim Archivieren:', error);
      alert('Fehler beim Archivieren des Gewerks. Bitte versuchen Sie es erneut.');
    } finally {
      setLoading(false);
    }
  };
  
  // Handler für Fertigstellungsanfrage
  const handleCompletionRequest = async () => {
    try {
      console.log('🔍 SimpleCostEstimateModal - Sende Abnahme-Anfrage für Trade:', trade?.id);
      
      const response = await apiCall(`/milestones/${trade?.id}/progress/completion`, {
        method: 'POST',
        body: JSON.stringify({
          message: 'Gewerk fertiggestellt. Bitte um Abnahme.',
          update_type: 'completion'
        })
      });
      
      console.log('✅ SimpleCostEstimateModal - Abnahme-Anfrage erfolgreich:', response);
      setCompletionStatus('completion_requested');
      
      // Aktualisiere auch den Fortschritt
      if (trade?.id) {
        loadTradeDocuments(trade.id);
      }
    } catch (error) {
      console.error('❌ SimpleCostEstimateModal - Fehler bei Fertigstellungsmeldung:', error);
      alert('Fehler beim Anfordern der Abnahme. Bitte versuchen Sie es erneut.');
    }
  };
  
  // Handler für Fertigstellungsantwort
  const handleCompletionResponse = async (accepted: boolean, message?: string, deadline?: string) => {
    try {
      console.log('🔍 SimpleCostEstimateModal - Sende Abnahme-Antwort für Trade:', trade?.id, {
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
      
      console.log('✅ SimpleCostEstimateModal - Abnahme-Antwort erfolgreich:', response);
      setCompletionStatus(accepted ? 'completed' : 'revision_required');
    } catch (error) {
      console.error('❌ SimpleCostEstimateModal - Fehler bei Abnahme-Antwort:', error);
      alert('Fehler bei der Abnahme-Antwort. Bitte versuchen Sie es erneut.');
    }
  };

  // Bekannte Dokumentennamen (Fallback wenn API versagt)
  const KNOWN_DOCUMENT_NAMES: Record<number, string> = {
    10: "Angebot_Sanitaer_Heizung_Boran",
    12: "Lettenstrasse_Baumeister - F-LV_V2", 
    13: "LSOB-EN"
  };

  // Hilfsfunktion: Robuste Dokumentenverarbeitung
  const processDocuments = async (documentsData: any, baseUrl: string, token: string) => {
    let documents = [];
    
    if (!documentsData) return documents;
    
    // Fall 1: Array von Dokumenten
    if (Array.isArray(documentsData)) {
      for (const doc of documentsData) {
        if (typeof doc === 'object' && doc !== null && doc.id) {
          // Bereits vollständiges Dokument-Objekt
          documents.push(doc);
        } else if (typeof doc === 'number' || (typeof doc === 'string' && !isNaN(Number(doc)))) {
          // Dokument-ID - lade vollständige Daten
          const docId = Number(doc);
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
                documents.push({
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
                });
              } else {
                // API gab leere/generische Daten zurück - verwende hardcoded Namen
                const knownName = KNOWN_DOCUMENT_NAMES[docId] || `Dokument ${docId}`;
                console.log(`🔄 API-Daten leer für Dokument ${docId}, verwende KNOWN NAME: "${knownName}"`);
                documents.push({
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
                });
              }
            } else {
              console.error(`❌ API-Fehler für Dokument ${docId}:`, docResponse.status, docResponse.statusText);
              const knownName = KNOWN_DOCUMENT_NAMES[docId] || `Dokument ${docId}`;
              console.log(`❌ FALLBACK NAME für Dokument ${docId}: "${knownName}"`);
              // Fallback: Erstelle ein minimales Dokument-Objekt
              documents.push({
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
              });
            }
          } catch (e) {
            console.error(`❌ Fehler beim Laden des Dokuments ${docId}:`, e);
            const knownName = KNOWN_DOCUMENT_NAMES[docId] || `Dokument ${docId}`;
            console.log(`❌ EXCEPTION FALLBACK NAME für Dokument ${docId}: "${knownName}"`);
            // Fallback: Erstelle ein minimales Dokument-Objekt
            documents.push({
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
            });
          }
        }
      }
    }
    // Fall 2: JSON-String
    else if (typeof documentsData === 'string') {
      try {
        // Handle double-quoted JSON strings like '"[13]"'
        let cleanedData = documentsData;
        if (documentsData.startsWith('"') && documentsData.endsWith('"')) {
          cleanedData = documentsData.slice(1, -1);
        }
        const parsed = JSON.parse(cleanedData);
        return await processDocuments(parsed, baseUrl, token);
      } catch (e) {
        console.error('❌ Fehler beim Parsen der Dokumente-Daten:', e, documentsData);
      }
    }
    
    return documents;
  };

  // Dokumente laden - Robuste Version aus TradeDetailsModal
  const loadTradeDocuments = async (tradeId: number) => {
    if (!tradeId) return;
    
    setDocumentsLoading(true);
    setDocumentsError(null);
    
    try {
      console.log('🔍 SimpleCostEstimateModal - Lade Dokumente für Trade:', tradeId);
      
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('❌ SimpleCostEstimateModal - Kein Authentifizierungstoken verfügbar');
        setDocumentsError('Kein Authentifizierungstoken verfügbar');
        return;
      }
      
      const baseUrl = getApiBaseUrl();
      
      // Lade das vollständige Milestone mit Dokumenten vom Backend
      const response = await fetch(`${baseUrl}/milestones/${tradeId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const milestoneData = await response.json();
      console.log('✅ SimpleCostEstimateModal - Milestone-Daten geladen:', milestoneData);
      console.log('🔍 SimpleCostEstimateModal - shared_document_ids:', milestoneData.shared_document_ids);
      console.log('🔍 SimpleCostEstimateModal - documents:', milestoneData.documents);
      console.log('🔍 SimpleCostEstimateModal - completion_status:', milestoneData.completion_status);
      
      // Aktualisiere completion_status vom Backend
      if (milestoneData.completion_status) {
        setCompletionStatus(milestoneData.completion_status);
        console.log('✅ SimpleCostEstimateModal - completion_status aktualisiert:', milestoneData.completion_status);
      }
      
      let documents = [];
      
      // Verarbeite documents Spalte (falls vorhanden)
      if (milestoneData.documents) {
        console.log('📄 SimpleCostEstimateModal - Verarbeite documents Spalte:', milestoneData.documents);
        const processedDocs = await processDocuments(milestoneData.documents, baseUrl, token);
        documents = [...documents, ...processedDocs];
      }
      
      // Verarbeite shared_document_ids Spalte
      console.log('📄 Milestone shared_document_ids Feld:', milestoneData.shared_document_ids);
      console.log('📄 Milestone shared_document_ids Typ:', typeof milestoneData.shared_document_ids);
      
      if (milestoneData.shared_document_ids) {
        console.log('📄 SimpleCostEstimateModal - Verarbeite shared_document_ids:', milestoneData.shared_document_ids);
        const processedSharedDocs = await processDocuments(milestoneData.shared_document_ids, baseUrl, token);
        documents = [...documents, ...processedSharedDocs];
      }

      // Entferne Duplikate basierend auf ID
      const uniqueDocuments = documents.filter((doc, index, self) => 
        index === self.findIndex(d => d.id === doc.id)
      );

      console.log('📄 SimpleCostEstimateModal - Finale Dokumentenliste:', uniqueDocuments);
      console.log('📄 SimpleCostEstimateModal - Anzahl Dokumente:', uniqueDocuments.length);
      uniqueDocuments.forEach((doc: any, index: number) => {
        console.log(`📄 SimpleCostEstimateModal Dokument ${index + 1}:`, {
          id: doc.id,
          name: doc.name || doc.title,
          url: doc.url || doc.file_path,
          file_path: doc.file_path,
          source: doc.source || 'processed'
        });
      });

      setLoadedDocuments(uniqueDocuments);
      
    } catch (error) {
      console.error('❌ SimpleCostEstimateModal - Fehler beim Laden der Dokumente:', error);
      setDocumentsError(error instanceof Error ? error.message : 'Unbekannter Fehler');
      setLoadedDocuments([]);
    } finally {
      setDocumentsLoading(false);
    }
  };

  // Besichtigungs-Handler
  const loadAppointmentResponses = async () => {
    if (!trade?.id) return;
    
    try {
      const { api } = await import('../api/api');
      const response = await api.get(`/appointments/responses/${trade.id}`);
      setAppointmentResponses(response.data || []);
      console.log('✅ Appointment-Responses geladen:', response.data);
    } catch (error) {
      console.error('❌ Fehler beim Laden der Appointment-Responses:', error);
      setAppointmentResponses([]);
    }
  };

  const formatAppointmentStatus = (serviceProviderId: number, appointmentDate: string | null) => {
    const response = appointmentResponses.find(r => r.service_provider_id === serviceProviderId);
    
    if (!response) {
      return { status: 'pending', text: 'Keine Antwort', color: 'text-gray-400' };
    }
    
    switch (response.status) {
      case 'accepted':
        return { status: 'accepted', text: 'Zugesagt', color: 'text-green-400' };
      case 'declined':
        return { status: 'declined', text: 'Abgesagt', color: 'text-red-400' };
      case 'alternative_proposed':
        return { status: 'alternative', text: 'Alternativ-Termin', color: 'text-yellow-400' };
      default:
        return { status: 'pending', text: 'Ausstehend', color: 'text-gray-400' };
    }
  };

  // Kommunikations-Handler
  const loadMessages = async () => {
    if (!trade?.id) return;
    
    setCommunicationLoading(true);
    try {
      const { api } = await import('../api/api');
      const response = await api.get(`/messages/trade/${trade.id}`);
      setMessages(response.data || []);
      console.log('✅ Nachrichten geladen:', response.data);
    } catch (error) {
      console.error('❌ Fehler beim Laden der Nachrichten:', error);
      setMessages([]);
    } finally {
      setCommunicationLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !trade?.id) return;
    
    setCommunicationLoading(true);
    try {
      const { api } = await import('../api/api');
      const response = await api.post('/messages', {
        trade_id: trade.id,
        message: newMessage.trim(),
        sender_type: 'bautraeger',
        recipient_type: 'service_provider',
        recipient_id: acceptedQuote?.service_provider_id || acceptedQuote?.user_id
      });

      console.log('✅ Nachricht gesendet:', response.data);
      setNewMessage('');
      
      // Nachrichten neu laden
      await loadMessages();
      
    } catch (error) {
      console.error('❌ Fehler beim Senden der Nachricht:', error);
      alert('Fehler beim Senden der Nachricht. Bitte versuchen Sie es erneut.');
    } finally {
      setCommunicationLoading(false);
    }
  };

  // Dokumente und Besichtigungs-Daten beim Öffnen des Modals laden
  useEffect(() => {
    if (isOpen && trade?.id) {
      loadTradeDocuments(trade.id);
      // loadAppointmentResponses(); // Deaktiviert wegen 404-Fehler
      // loadMessages(); // Deaktiviert wegen 404-Fehler
      
      // Prüfe Besichtigungs-Status
      if (propInspectionStatus && trade) {
        setInspectionStatus({
          hasActiveInspection: propInspectionStatus.hasActiveInspection || false,
          appointmentDate: propInspectionStatus.appointmentDate || null,
          isInspectionDay: propInspectionStatus.isInspectionDay || false,
          selectedServiceProviderId: propInspectionStatus.selectedServiceProviderId || null
        });
      }
    }
  }, [isOpen, trade?.id]);

  // Lade Mängel wenn Status 'completed_with_defects' ist
  useEffect(() => {
    if (isOpen && completionStatus === 'completed_with_defects' && trade?.id) {
      console.log('🔍 SimpleCostEstimateModal - Lade Mängel für completed_with_defects Status');
      loadAcceptanceDefects();
    }
  }, [isOpen, completionStatus, trade?.id]);

  // Lade Mängel wenn finale Abnahme-Modal geöffnet wird
  useEffect(() => {
    if (showFinalAcceptanceModal && trade?.id) {
      console.log('🔍 SimpleCostEstimateModal - Lade Mängel für finale Abnahme');
      loadAcceptanceDefects();
    }
  }, [showFinalAcceptanceModal, trade?.id]);

  // Lade bestehende Rechnung wenn Gewerk abgeschlossen ist
  useEffect(() => {
    if (isOpen && (completionStatus === 'completed' || completionStatus === 'completed_with_defects') && trade?.id && isBautraeger()) {
      console.log('🔍 SimpleCostEstimateModal - Lade bestehende Rechnung für Bauträger', {
        isOpen,
        completionStatus,
        tradeId: trade?.id,
        isBautraeger: isBautraeger()
      });
      loadExistingInvoice();
    }
  }, [isOpen, completionStatus, trade?.id, isBautraeger]);

  // Render Comprehensive Trade Header
  const renderTradeHeader = () => {
    if (!trade) return null;

    // Hilfsfunktionen für Formatierung
    const formatDate = (dateString: string) => {
      if (!dateString || dateString === '0') return 'Nicht festgelegt';
      try {
        return new Date(dateString).toLocaleDateString('de-DE');
      } catch {
        return 'Ungültiges Datum';
      }
    };

    const formatCurrency = (amount: string | number) => {
      if (!amount || amount === '0' || amount === '0.0') return 'Nicht festgelegt';
      const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
      return `CHF ${numAmount.toLocaleString('de-DE')}`;
    };

    const getStatusColor = (status: string) => {
      switch (status?.toLowerCase()) {
        case 'planned': return { bg: 'bg-blue-500/20', border: 'border-blue-500/30', text: 'text-blue-300', label: 'Geplant' };
        case 'in_progress': return { bg: 'bg-yellow-500/20', border: 'border-yellow-500/30', text: 'text-yellow-300', label: 'In Bearbeitung' };
        case 'completed': return { bg: 'bg-green-500/20', border: 'border-green-500/30', text: 'text-green-300', label: 'Abgeschlossen' };
        case 'cancelled': return { bg: 'bg-red-500/20', border: 'border-red-500/30', text: 'text-red-300', label: 'Abgebrochen' };
        default: return { bg: 'bg-gray-500/20', border: 'border-gray-500/30', text: 'text-gray-300', label: status || 'Unbekannt' };
      }
    };

    const getPriorityColor = (priority: string) => {
      switch (priority?.toLowerCase()) {
        case 'high': return { bg: 'bg-red-500/20', border: 'border-red-500/30', text: 'text-red-300', label: 'Hoch', icon: AlertTriangle };
        case 'medium': return { bg: 'bg-yellow-500/20', border: 'border-yellow-500/30', text: 'text-yellow-300', label: 'Mittel', icon: Flag };
        case 'low': return { bg: 'bg-green-500/20', border: 'border-green-500/30', text: 'text-green-300', label: 'Niedrig', icon: Flag };
        default: return { bg: 'bg-gray-500/20', border: 'border-gray-500/30', text: 'text-gray-300', label: priority || 'Normal', icon: Flag };
      }
    };

    const getCategoryLabel = (category: string) => {
      const categories: { [key: string]: string } = {
        'civil_engineering': 'Tiefbau',
        'electrical': 'Elektro',
        'plumbing': 'Sanitär',
        'heating': 'Heizung',
        'flooring': 'Bodenbelag',
        'painting': 'Malerei',
        'carpentry': 'Zimmerei',
        'roofing': 'Dacharbeiten',
        'insulation': 'Dämmung',
        'windows_doors': 'Fenster & Türen',
        'landscaping': 'Landschaftsbau',
        'other': 'Sonstiges'
      };
      return categories[category] || category || 'Nicht kategorisiert';
    };

    const getConstructionPhaseLabel = (phase: string) => {
      const phases: { [key: string]: string } = {
        'ausschreibung': 'Ausschreibung',
        'planung': 'Planung',
        'rohbau': 'Rohbau',
        'ausbau': 'Ausbau',
        'fertigstellung': 'Fertigstellung',
        'abnahme': 'Abnahme'
      };
      return phases[phase] || phase || 'Nicht festgelegt';
    };

    const statusInfo = getStatusColor(trade.status);
    const priorityInfo = getPriorityColor(trade.priority);
    const PriorityIcon = priorityInfo.icon;

    return (
      <div className="mb-6 bg-gradient-to-r from-[#1a1a2e]/80 to-[#2c3539]/80 border border-gray-600/30 rounded-xl p-6 backdrop-blur-sm">
        {/* Haupttitel und Status */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-[#ffbd59] to-[#ffa726] rounded-xl flex items-center justify-center text-white font-bold shadow-lg">
              <Briefcase size={32} />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-white mb-2 leading-tight">
                {trade.title}
              </h2>
              <div className="flex items-center gap-3 mb-3">
                <div className={`px-3 py-1 rounded-full ${statusInfo.bg} ${statusInfo.border} border`}>
                  <span className={`text-sm font-medium ${statusInfo.text}`}>
                    {statusInfo.label}
                  </span>
                </div>
                {/* Fertigstellungsstatus - prominenter Badge */}
                {completionStatus && completionStatus !== 'in_progress' && (
                  <div className={`inline-flex items-center gap-1 px-4 py-2 rounded-full text-sm font-semibold border-2 shadow-lg ${
                    completionStatus === 'completed' 
                      ? 'bg-green-500/30 border-green-400/60 text-green-200 shadow-green-500/20'
                      : completionStatus === 'completed_with_defects'
                      ? 'bg-yellow-500/30 border-yellow-400/60 text-yellow-200 shadow-yellow-500/20'
                      : completionStatus === 'completion_requested'
                      ? 'bg-orange-500/30 border-orange-400/60 text-orange-200 shadow-orange-500/20 animate-pulse'
                      : 'bg-gray-500/30 border-gray-400/60 text-gray-200 shadow-gray-500/20'
                  }`}>
                    {completionStatus === 'completion_requested' ? (
                      <>
                        <Clock size={16} />
                        Als fertiggestellt markiert
                      </>
                    ) : completionStatus === 'completed' ? (
                      <>
                        <CheckCircle size={16} />
                        Abgeschlossen
                      </>
                    ) : completionStatus === 'completed_with_defects' ? (
                      <>
                        <AlertTriangle size={16} />
                        Unter Vorbehalt
                      </>
                    ) : (
                      <span>{completionStatus}</span>
                    )}
                  </div>
                )}
                <div className={`flex items-center gap-1 px-3 py-1 rounded-full ${priorityInfo.bg} ${priorityInfo.border} border`}>
                  <PriorityIcon size={14} className={priorityInfo.text} />
                  <span className={`text-sm font-medium ${priorityInfo.text}`}>
                    {priorityInfo.label}
                  </span>
                </div>
                {trade.is_critical === '1' && (
                  <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-red-500/20 border-red-500/30 border">
                    <AlertCircle size={14} className="text-red-300" />
                    <span className="text-sm font-medium text-red-300">Kritisch</span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-300">
                <div className="flex items-center gap-1">
                  <Building size={16} className="text-gray-400" />
                  <span>{getCategoryLabel(trade.category)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <TrendingUp size={16} className="text-gray-400" />
                  <span>{getConstructionPhaseLabel(trade.construction_phase)}</span>
                </div>
                {trade.progress_percentage && trade.progress_percentage !== '0' && (
                  <div className="flex items-center gap-1">
                    <CheckCircle size={16} className="text-green-400" />
                    <span>{trade.progress_percentage}% abgeschlossen</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Projekt-Info */}
          {project && (
            <div className="text-right">
              <div className="text-sm text-gray-400 mb-1">Projekt</div>
              <div className="text-white font-medium">{project.name}</div>
              {project.address_city && (
                <div className="flex items-center gap-1 text-sm text-gray-300 mt-1">
                  <MapPin size={14} className="text-gray-400" />
                  <span>{project.address_city}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Detailinformationen Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          {/* Termine */}
          <div className="bg-black/20 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Calendar size={16} className="text-blue-400" />
              <span className="text-sm font-medium text-blue-300">Termine</span>
            </div>
            <div className="space-y-1 text-sm">
              <div className="text-gray-300">
                <span className="text-gray-400">Geplant:</span> {formatDate(trade.planned_date)}
              </div>
              {trade.start_date && trade.start_date !== '0' && (
                <div className="text-gray-300">
                  <span className="text-gray-400">Start:</span> {formatDate(trade.start_date)}
                </div>
              )}
              {trade.end_date && trade.end_date !== '0' && (
                <div className="text-gray-300">
                  <span className="text-gray-400">Ende:</span> {formatDate(trade.end_date)}
                </div>
              )}
            </div>
          </div>

          {/* Budget */}
          <div className="bg-black/20 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Euro size={16} className="text-green-400" />
              <span className="text-sm font-medium text-green-300">Budget</span>
            </div>
            <div className="space-y-1 text-sm">
              <div className="text-gray-300">
                <span className="text-gray-400">Geplant:</span> {formatCurrency(trade.budget)}
              </div>
              {trade.actual_costs && trade.actual_costs !== '0' && (
                <div className="text-gray-300">
                  <span className="text-gray-400">Ist:</span> {formatCurrency(trade.actual_costs)}
                </div>
              )}
              {acceptedQuote && (
                <div className="text-green-300 font-medium">
                  <span className="text-gray-400">Angebot:</span> {formatCurrency(acceptedQuote.total_amount)}
                </div>
              )}
            </div>
          </div>

          {/* Besichtigung */}
          <div className="bg-black/20 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Eye size={16} className="text-purple-400" />
              <span className="text-sm font-medium text-purple-300">Besichtigung</span>
            </div>
            <div className="space-y-1 text-sm">
              {trade.requires_inspection === '1' ? (
                <>
                  <div className="text-purple-300">Erforderlich</div>
                  {trade.inspection_sent === '1' ? (
                    <div className="text-green-300">Einladung versendet</div>
                  ) : (
                    <div className="text-yellow-300">Noch nicht versendet</div>
                  )}
                </>
              ) : (
                <div className="text-gray-400">Nicht erforderlich</div>
              )}
            </div>
          </div>

          {/* Angebote */}
          <div className="bg-black/20 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <FileText size={16} className="text-orange-400" />
              <span className="text-sm font-medium text-orange-300">Angebote</span>
            </div>
            <div className="space-y-1 text-sm">
              <div className="text-gray-300">
                <span className="text-gray-400">Gesamt:</span> {quotes.length}
              </div>
              {acceptedQuote ? (
                <div className="text-green-300">1 angenommen</div>
              ) : (
                <div className="text-yellow-300">Noch keine Annahme</div>
              )}
            </div>
          </div>
        </div>

        {/* Beschreibung (falls vorhanden und nicht zu lang) */}
        {trade.description && trade.description.length > 0 && (
          <div className="bg-black/20 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <FileText size={16} className="text-gray-400" />
              <span className="text-sm font-medium text-gray-300">Beschreibung</span>
            </div>
            <div className="text-sm text-gray-300 leading-relaxed">
              {trade.description.length > 200 
                ? `${trade.description.substring(0, 200)}...` 
                : trade.description
              }
            </div>
          </div>
        )}

        {/* Zusätzliche Informationen (falls vorhanden) */}
        {(trade.notify_on_completion || trade.notes) && (
          <div className="mt-4 pt-4 border-t border-gray-600/30">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {trade.notify_on_completion && (
                <div>
                  <div className="text-sm font-medium text-gray-400 mb-1">Zusätzliche Informationen</div>
                  <div className="text-sm text-gray-300">{trade.notify_on_completion}</div>
                </div>
              )}
              {trade.notes && (
                <div>
                  <div className="text-sm font-medium text-gray-400 mb-1">Notizen</div>
                  <div className="text-sm text-gray-300">{trade.notes}</div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  // Render Accepted Provider Header
  const renderAcceptedProviderHeader = () => {
    if (!acceptedQuote) return null;
    
    // Debug: Zeige alle Quote-Daten
    console.log('🔍 SimpleCostEstimateModal - Vollständige acceptedQuote Daten:', acceptedQuote);
    console.log('🔍 SimpleCostEstimateModal - Fehlende Felder Check:', {
      labor_cost: acceptedQuote.labor_cost,
      material_cost: acceptedQuote.material_cost,
      overhead_cost: acceptedQuote.overhead_cost,
      estimated_duration: acceptedQuote.estimated_duration,
      payment_terms: acceptedQuote.payment_terms,
      website: acceptedQuote.website,
      accepted_at: acceptedQuote.accepted_at,
      quote_number: acceptedQuote.quote_number,
      qualifications: acceptedQuote.qualifications,
      certifications: acceptedQuote.certifications,
      technical_approach: acceptedQuote.technical_approach,
      quality_standards: acceptedQuote.quality_standards,
      safety_measures: acceptedQuote.safety_measures,
      environmental_compliance: acceptedQuote.environmental_compliance,
      risk_assessment: acceptedQuote.risk_assessment,
      contingency_plan: acceptedQuote.contingency_plan,
      additional_notes: acceptedQuote.additional_notes,
      references: acceptedQuote.references
    });
    
    // CRITICAL DEBUG: Alert um sicherzustellen dass Code ausgeführt wird
    alert('SimpleCostEstimateModal - renderAcceptedProviderHeader wird ausgeführt!');

    return (
      <div className="mb-6 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-lg p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center text-white font-bold shadow-lg">
              <User size={24} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white mb-1">{acceptedQuote.company_name}</h3>
              <p className="text-green-200 text-sm mb-2">{acceptedQuote.contact_person}</p>
              <div className="flex items-center gap-4">
                <span className="text-2xl font-bold text-green-300">
                  {acceptedQuote.total_amount?.toLocaleString('de-DE')} {acceptedQuote.currency || 'EUR'}
                </span>
                <span className="px-3 py-1 bg-green-600 text-white text-sm rounded-full">
                  Angenommen
                </span>
              </div>
            </div>
          </div>
          
          {/* Service Provider Rating Button */}
          <button
            onClick={() => setShowServiceProviderRating(true)}
            className="flex items-center gap-2 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white font-medium rounded-lg transition-colors"
          >
            <Star size={16} />
            Bewerten
          </button>
        </div>

        {/* Kontakt-Buttons */}
        <div className="flex gap-3 flex-wrap">
          {acceptedQuote.phone && (
            <a
              href={`tel:${acceptedQuote.phone}`}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              <Phone size={16} />
              Anrufen
            </a>
          )}
          
          {acceptedQuote.email && (
            <a
              href={`mailto:${acceptedQuote.email}`}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
            >
              <Mail size={16} />
              E-Mail
            </a>
          )}
          
          <button
            onClick={() => setShowCommunicationModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
          >
            <MessageCircle size={16} />
            Nachrichten {messages.length > 0 && `(${messages.length})`}
          </button>
          
          {acceptedQuote.website && (
            <a
              href={acceptedQuote.website}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
            >
              <ExternalLink size={16} />
              Website
            </a>
          )}
        </div>

        {/* Angebots-Details */}
        {acceptedQuote.description && (
          <div className="mt-4 p-4 bg-green-500/5 border border-green-500/20 rounded-lg">
            <h4 className="text-sm font-medium text-green-300 mb-2">Angebotsbeschreibung:</h4>
            <p className="text-gray-300 text-sm">{acceptedQuote.description}</p>
          </div>
        )}

        {/* Vollständige Angebots-Details */}
        <div className="mt-6 space-y-6">
          
          {/* DEBUG: Immer sichtbarer Test-Bereich */}
          <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4">
            <h4 className="text-red-300 font-bold">🚨 DEBUG: Dieser Bereich sollte IMMER sichtbar sein!</h4>
            <p className="text-white">Wenn du das siehst, wird der Code ausgeführt.</p>
          </div>
          
          {/* Kostenaufschlüsselung */}
          <div className="bg-green-500/5 border border-green-500/20 rounded-lg p-4">
            <h4 className="text-sm font-medium text-green-300 mb-3 flex items-center gap-2">
              <Euro size={16} />
              Kostenaufschlüsselung
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-green-300 font-bold text-lg">
                  {acceptedQuote.total_amount?.toLocaleString('de-DE')} {acceptedQuote.currency || 'EUR'}
                </div>
                <div className="text-gray-400 text-xs">Gesamtbetrag</div>
              </div>
              
              {(acceptedQuote.labor_cost !== null && acceptedQuote.labor_cost !== undefined) && (
                <div className="text-center">
                  <div className="text-green-300 font-medium">
                    {acceptedQuote.labor_cost?.toLocaleString('de-DE')} {acceptedQuote.currency || 'EUR'}
                  </div>
                  <div className="text-gray-400 text-xs">Arbeitskosten</div>
                </div>
              )}
              
              {(acceptedQuote.material_cost !== null && acceptedQuote.material_cost !== undefined) && (
                <div className="text-center">
                  <div className="text-green-300 font-medium">
                    {acceptedQuote.material_cost?.toLocaleString('de-DE')} {acceptedQuote.currency || 'EUR'}
                  </div>
                  <div className="text-gray-400 text-xs">Materialkosten</div>
                </div>
              )}
              
              {(acceptedQuote.overhead_cost !== null && acceptedQuote.overhead_cost !== undefined) && (
                <div className="text-center">
                  <div className="text-green-300 font-medium">
                    {acceptedQuote.overhead_cost?.toLocaleString('de-DE')} {acceptedQuote.currency || 'EUR'}
                  </div>
                  <div className="text-gray-400 text-xs">Nebenkosten</div>
                </div>
              )}
            </div>
          </div>

          {/* Zeitplan & Bedingungen */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-blue-500/5 border border-blue-500/20 rounded-lg p-4">
              <h4 className="text-sm font-medium text-blue-300 mb-3 flex items-center gap-2">
                <Calendar size={16} />
                Zeitplan
              </h4>
              <div className="space-y-2">
                {acceptedQuote.start_date && (
                  <div className="flex justify-between">
                    <span className="text-gray-400 text-sm">Startdatum:</span>
                    <span className="text-blue-300 text-sm">
                      {new Date(acceptedQuote.start_date).toLocaleDateString('de-DE')}
                    </span>
                  </div>
                )}
                
                {acceptedQuote.completion_date && (
                  <div className="flex justify-between">
                    <span className="text-gray-400 text-sm">Fertigstellung:</span>
                    <span className="text-blue-300 text-sm">
                      {new Date(acceptedQuote.completion_date).toLocaleDateString('de-DE')}
                    </span>
                  </div>
                )}
                
                {(acceptedQuote.estimated_duration !== null && acceptedQuote.estimated_duration !== undefined) && (
                  <div className="flex justify-between">
                    <span className="text-gray-400 text-sm">Dauer:</span>
                    <span className="text-blue-300 text-sm">{acceptedQuote.estimated_duration} Tage</span>
                  </div>
                )}
                
                {acceptedQuote.valid_until && (
                  <div className="flex justify-between">
                    <span className="text-gray-400 text-sm">Gültig bis:</span>
                    <span className="text-blue-300 text-sm">
                      {new Date(acceptedQuote.valid_until).toLocaleDateString('de-DE')}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-purple-500/5 border border-purple-500/20 rounded-lg p-4">
              <h4 className="text-sm font-medium text-purple-300 mb-3 flex items-center gap-2">
                <Receipt size={16} />
                Bedingungen
              </h4>
              <div className="space-y-2">
                {(acceptedQuote.payment_terms !== null && acceptedQuote.payment_terms !== undefined && acceptedQuote.payment_terms !== '') && (
                  <div className="flex justify-between">
                    <span className="text-gray-400 text-sm">Zahlung:</span>
                    <span className="text-purple-300 text-sm">{acceptedQuote.payment_terms}</span>
                  </div>
                )}
                
                {(acceptedQuote.warranty_period !== null && acceptedQuote.warranty_period !== undefined) && (
                  <div className="flex justify-between">
                    <span className="text-gray-400 text-sm">Garantie:</span>
                    <span className="text-purple-300 text-sm">{acceptedQuote.warranty_period} Monate</span>
                  </div>
                )}
                
                {(acceptedQuote.quote_number !== null && acceptedQuote.quote_number !== undefined && acceptedQuote.quote_number !== '') && (
                  <div className="flex justify-between">
                    <span className="text-gray-400 text-sm">Angebotsnummer:</span>
                    <span className="text-purple-300 text-sm">{acceptedQuote.quote_number}</span>
                  </div>
                )}
                
                {(acceptedQuote.accepted_at !== null && acceptedQuote.accepted_at !== undefined) && (
                  <div className="flex justify-between">
                    <span className="text-gray-400 text-sm">Angenommen am:</span>
                    <span className="text-purple-300 text-sm">
                      {new Date(acceptedQuote.accepted_at).toLocaleDateString('de-DE')}
                    </span>
                  </div>
                )}
                
                {(acceptedQuote.website !== null && acceptedQuote.website !== undefined && acceptedQuote.website !== '') && (
                  <div className="flex justify-between">
                    <span className="text-gray-400 text-sm">Website:</span>
                    <a 
                      href={acceptedQuote.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-purple-300 text-sm hover:text-purple-200 underline"
                    >
                      {acceptedQuote.website}
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Qualifikationen & Zertifikate */}
          {((acceptedQuote.qualifications && acceptedQuote.qualifications.trim() !== '') || 
            (acceptedQuote.certifications && acceptedQuote.certifications.trim() !== '') || 
            (acceptedQuote.references && acceptedQuote.references.trim() !== '')) && (
            <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-lg p-4">
              <h4 className="text-sm font-medium text-yellow-300 mb-3 flex items-center gap-2">
                <Star size={16} />
                Qualifikationen & Referenzen
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {(acceptedQuote.qualifications && acceptedQuote.qualifications.trim() !== '') && (
                  <div>
                    <div className="text-yellow-300 text-sm font-medium mb-1">Qualifikationen:</div>
                    <div className="text-gray-300 text-sm">{acceptedQuote.qualifications}</div>
                  </div>
                )}
                
                {(acceptedQuote.certifications && acceptedQuote.certifications.trim() !== '') && (
                  <div>
                    <div className="text-yellow-300 text-sm font-medium mb-1">Zertifikate:</div>
                    <div className="text-gray-300 text-sm">{acceptedQuote.certifications}</div>
                  </div>
                )}
                
                {(acceptedQuote.references && acceptedQuote.references.trim() !== '') && (
                  <div>
                    <div className="text-yellow-300 text-sm font-medium mb-1">Referenzen:</div>
                    <div className="text-gray-300 text-sm">{acceptedQuote.references}</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Technische Details */}
          {((acceptedQuote.technical_approach && acceptedQuote.technical_approach.trim() !== '') || 
            (acceptedQuote.quality_standards && acceptedQuote.quality_standards.trim() !== '') || 
            (acceptedQuote.safety_measures && acceptedQuote.safety_measures.trim() !== '')) && (
            <div className="bg-indigo-500/5 border border-indigo-500/20 rounded-lg p-4">
              <h4 className="text-sm font-medium text-indigo-300 mb-3 flex items-center gap-2">
                <Settings size={16} />
                Technische Details
              </h4>
              <div className="space-y-3">
                {(acceptedQuote.technical_approach && acceptedQuote.technical_approach.trim() !== '') && (
                  <div>
                    <div className="text-indigo-300 text-sm font-medium mb-1">Technisches Vorgehen:</div>
                    <div className="text-gray-300 text-sm">{acceptedQuote.technical_approach}</div>
                  </div>
                )}
                
                {(acceptedQuote.quality_standards && acceptedQuote.quality_standards.trim() !== '') && (
                  <div>
                    <div className="text-indigo-300 text-sm font-medium mb-1">Qualitätsstandards:</div>
                    <div className="text-gray-300 text-sm">{acceptedQuote.quality_standards}</div>
                  </div>
                )}
                
                {(acceptedQuote.safety_measures && acceptedQuote.safety_measures.trim() !== '') && (
                  <div>
                    <div className="text-indigo-300 text-sm font-medium mb-1">Sicherheitsmaßnahmen:</div>
                    <div className="text-gray-300 text-sm">{acceptedQuote.safety_measures}</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Risiko & Compliance */}
          {((acceptedQuote.risk_assessment && acceptedQuote.risk_assessment.trim() !== '') || 
            (acceptedQuote.environmental_compliance && acceptedQuote.environmental_compliance.trim() !== '') || 
            (acceptedQuote.contingency_plan && acceptedQuote.contingency_plan.trim() !== '')) && (
            <div className="bg-red-500/5 border border-red-500/20 rounded-lg p-4">
              <h4 className="text-sm font-medium text-red-300 mb-3 flex items-center gap-2">
                <AlertTriangle size={16} />
                Risiko & Compliance
              </h4>
              <div className="space-y-3">
                {(acceptedQuote.risk_assessment && acceptedQuote.risk_assessment.trim() !== '') && (
                  <div>
                    <div className="text-red-300 text-sm font-medium mb-1">Risikobewertung:</div>
                    <div className="text-gray-300 text-sm">{acceptedQuote.risk_assessment}</div>
                  </div>
                )}
                
                {(acceptedQuote.environmental_compliance && acceptedQuote.environmental_compliance.trim() !== '') && (
                  <div>
                    <div className="text-red-300 text-sm font-medium mb-1">Umwelt-Compliance:</div>
                    <div className="text-gray-300 text-sm">{acceptedQuote.environmental_compliance}</div>
                  </div>
                )}
                
                {(acceptedQuote.contingency_plan && acceptedQuote.contingency_plan.trim() !== '') && (
                  <div>
                    <div className="text-red-300 text-sm font-medium mb-1">Notfallplan:</div>
                    <div className="text-gray-300 text-sm">{acceptedQuote.contingency_plan}</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Zusätzliche Informationen */}
          {((acceptedQuote.additional_notes && acceptedQuote.additional_notes.trim() !== '') || 
            (acceptedQuote.reference_projects && acceptedQuote.reference_projects.trim() !== '')) && (
            <div className="bg-gray-500/5 border border-gray-500/20 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-300 mb-3 flex items-center gap-2">
                <Info size={16} />
                Zusätzliche Informationen
              </h4>
              <div className="space-y-3">
                {(acceptedQuote.reference_projects && acceptedQuote.reference_projects.trim() !== '') && (
                  <div>
                    <div className="text-gray-300 text-sm font-medium mb-1">Referenzprojekte:</div>
                    <div className="text-gray-400 text-sm">{acceptedQuote.reference_projects}</div>
                  </div>
                )}
                
                {(acceptedQuote.additional_notes && acceptedQuote.additional_notes.trim() !== '') && (
                  <div>
                    <div className="text-gray-300 text-sm font-medium mb-1">Zusätzliche Hinweise:</div>
                    <div className="text-gray-400 text-sm">{acceptedQuote.additional_notes}</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Bewertung & Feedback */}
          {(acceptedQuote.rating || acceptedQuote.feedback) && (
            <div className="bg-orange-500/5 border border-orange-500/20 rounded-lg p-4">
              <h4 className="text-sm font-medium text-orange-300 mb-3 flex items-center gap-2">
                <Star size={16} />
                Bewertung & Feedback
              </h4>
              <div className="space-y-2">
                {acceptedQuote.rating && (
                  <div className="flex justify-between">
                    <span className="text-gray-400 text-sm">Bewertung:</span>
                    <span className="text-orange-300 text-sm">
                      {acceptedQuote.rating}/5 ⭐
                    </span>
                  </div>
                )}
                
                {acceptedQuote.feedback && (
                  <div>
                    <div className="text-orange-300 text-sm font-medium mb-1">Feedback:</div>
                    <div className="text-gray-300 text-sm">{acceptedQuote.feedback}</div>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-[#1a1a2e] to-[#2c3539] rounded-2xl shadow-[0_0_40px_rgba(255,189,89,0.08)] border border-gray-600/30 max-w-4xl w-full max-h-[90vh] overflow-hidden relative">
        {/* DEBUG HINWEIS */}
        <div className="absolute top-2 right-2 bg-blue-500/90 text-white px-3 py-1 rounded-lg text-sm font-bold z-50 shadow-lg">
          🔍 DEBUG: SimpleCostEstimateModal
        </div>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-600/30">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-[#ffbd59] to-[#ffa726] rounded-xl flex items-center justify-center text-white font-bold shadow-lg">
              <FileText size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">
                Ausschreibung Details
              </h2>
              <p className="text-sm text-gray-400">Umfassende Übersicht und Verwaltung</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Archiv-Button - prominent im Header platziert */}
            {existingInvoice?.status === 'paid' && 
             (completionStatus === 'completed' || trade?.completion_status === 'completed') && (
              <button
                onClick={handleArchiveTrade}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white font-semibold rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl border border-orange-500/30"
                title="Gewerk ins Archiv verschieben"
              >
                <Archive size={18} />
                <span>Ins Archiv verschieben</span>
              </button>
            )}
            
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X size={24} className="text-gray-400" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">

          
          {/* Ausschreibungsdetails */}
          <div className="bg-gradient-to-br from-[#2c3539]/50 to-[#1a1a2e]/50 rounded-xl border border-gray-600/30 p-6 mb-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Info size={20} className="text-[#ffbd59]" />
              Ausschreibungsdetails
            </h3>
            
            <div className="space-y-4">
              {/* Titel und Kategorie */}
              <div>
                <div className="text-sm text-gray-400 mb-1">Gewerk</div>
                <div className="text-white font-medium text-lg">{trade?.title}</div>
                <div className="text-gray-400 text-sm mt-1">{trade?.category}</div>
              </div>
              
              {/* Beschreibung */}
              {trade?.description && (
                <div className="bg-black/20 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Info size={14} className="text-blue-400" />
                    <span className="text-sm font-medium text-blue-300">Beschreibung</span>
                  </div>
                  <div className="text-sm text-gray-300 leading-relaxed">
                    {trade.description}
                  </div>
                </div>
              )}

              {/* Grid mit weiteren Informationen */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Erstellungsdatum */}
                {trade?.created_at && (
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar size={14} className="text-green-400" />
                    <span className="text-gray-400">Erstellt:</span>
                    <span className="font-medium text-white">
                      {new Date(trade.created_at).toLocaleDateString('de-DE', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </span>
                  </div>
                )}

                {/* Budget */}
                {trade?.budget && String(trade.budget) !== '0' && String(trade.budget) !== '0.0' && (
                  <div className="flex items-center gap-2 text-sm">
                    <Euro size={14} className="text-green-400" />
                    <span className="text-gray-400">Budget:</span>
                    <span className="font-medium text-white">
                      CHF {parseFloat(String(trade.budget)).toLocaleString('de-DE')}
                    </span>
                  </div>
                )}

                {/* Status */}
                <div className="flex items-center gap-2 text-sm">
                  <Flag size={14} className="text-purple-400" />
                  <span className="text-gray-400">Status:</span>
                  <span className={`inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium ${
                    trade?.status === 'completed' ? 'bg-green-500/20 text-green-300' :
                    trade?.status === 'in_progress' ? 'bg-yellow-500/20 text-yellow-300' :
                    trade?.status === 'planned' ? 'bg-blue-500/20 text-blue-300' :
                    'bg-gray-500/20 text-gray-300'
                  }`}>
                    {trade?.status === 'completed' ? 'Abgeschlossen' :
                     trade?.status === 'in_progress' ? 'In Bearbeitung' :
                     trade?.status === 'planned' ? 'Geplant' :
                     trade?.status || 'Unbekannt'}
                  </span>
                </div>

                {/* Bauphase */}
                {(trade as any)?.construction_phase && (
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

                {/* Besichtigung erforderlich */}
                {(trade as any)?.requires_inspection && (
                  <div className="flex items-center gap-2 text-sm">
                    <Eye size={14} className="text-purple-400" />
                    <span className="text-gray-400">Besichtigung:</span>
                    <span className="font-medium text-purple-300">Erforderlich</span>
                  </div>
                )}
              </div>

              {/* Notizen */}
              {(trade as any)?.notes && (
                <div className="bg-black/20 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText size={14} className="text-yellow-400" />
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

              {/* Zusätzliche Informationen aus notify_on_completion */}
              {(trade as any)?.notify_on_completion && (
                <div className="bg-black/20 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Info size={14} className="text-cyan-400" />
                    <span className="text-sm font-medium text-cyan-300">Zusätzliche Informationen</span>
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
                    <span className="font-medium text-white">
                      {project.project_type === 'new_build' ? 'Neubau' :
                       project.project_type === 'renovation' ? 'Renovierung' :
                       project.project_type === 'extension' ? 'Erweiterung' :
                       project.project_type === 'modernization' ? 'Modernisierung' :
                       project.project_type || 'Nicht angegeben'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-300">
                    <MapPin size={14} className="text-[#ffbd59]" />
                    <span className="text-gray-400">Standort:</span>
                    <span className="font-medium text-white">{project.address || project.location || project.city || 'Projektadresse nicht verfügbar'}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Angenommenes Angebot - Dienstleister-Informationen */}
          {acceptedQuote && (
            <div className="mb-6 p-6 bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 rounded-xl border border-emerald-500/20">
              <button
                onClick={() => setIsContractorExpanded(!isContractorExpanded)}
                className="w-full flex items-center justify-between mb-4 hover:bg-emerald-500/5 p-2 rounded-lg transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-500/20 rounded-lg">
                    <CheckCircle size={20} className="text-emerald-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-white">Beauftragter Dienstleister</h3>
                </div>
                <div className={`transform transition-transform ${isContractorExpanded ? 'rotate-180' : ''}`}>
                  <ChevronDown size={20} className="text-gray-400" />
                </div>
              </button>
              
              {isContractorExpanded && (
                <div>
              
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
                
                {acceptedQuote.estimated_duration && (
                  <div>
                    <div className="text-xs text-gray-400 mb-1">Geschätzte Dauer</div>
                    <div className="text-white font-medium">
                      {acceptedQuote.estimated_duration} Tage
                    </div>
                  </div>
                )}
              </div>
              
              {/* Beschreibung */}
              {acceptedQuote.description && (
                <div className="mt-4 pt-4 border-t border-emerald-500/20">
                  <div className="text-xs text-gray-400 mb-2">Angebotsbeschreibung</div>
                  <div className="text-gray-300 text-sm leading-relaxed">
                    {acceptedQuote.description}
                  </div>
                </div>
              )}

              {/* Angebotsnummer */}
              {acceptedQuote.quote_number && (
                <div className="mt-4 pt-4 border-t border-emerald-500/20">
                  <div className="bg-black/20 rounded-lg p-4 border border-emerald-500/20">
                    <h5 className="text-white font-semibold mb-2 flex items-center gap-2">
                      <Receipt size={16} className="text-emerald-400" />
                      Angebotsnummer
                    </h5>
                    <div className="text-emerald-300 font-mono text-lg">
                      {acceptedQuote.quote_number}
                    </div>
                  </div>
                </div>
              )}

              {/* Qualifikationen und Referenzen */}
              {(acceptedQuote.qualifications || acceptedQuote.references || acceptedQuote.certifications) && (
                <div className="mt-4 pt-4 border-t border-emerald-500/20">
                  <div className="bg-black/20 rounded-lg p-4 border border-emerald-500/20">
                    <h5 className="text-white font-semibold mb-3 flex items-center gap-2">
                      <Star size={16} className="text-emerald-400" />
                      Qualifikationen & Referenzen
                    </h5>
                    <div className="space-y-4">
                      {acceptedQuote.qualifications && (
                        <div>
                          <div className="text-sm text-emerald-300 mb-2">Qualifikationen</div>
                          <div className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap bg-black/30 rounded-lg p-3">
                            {acceptedQuote.qualifications}
                          </div>
                        </div>
                      )}
                      {acceptedQuote.references && (
                        <div>
                          <div className="text-sm text-emerald-300 mb-2">Referenzen</div>
                          <div className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap bg-black/30 rounded-lg p-3">
                            {acceptedQuote.references}
                          </div>
                        </div>
                      )}
                      {acceptedQuote.certifications && (
                        <div>
                          <div className="text-sm text-emerald-300 mb-2">Zertifizierungen</div>
                          <div className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap bg-black/30 rounded-lg p-3">
                            {acceptedQuote.certifications}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Technische Details */}
              {(acceptedQuote.technical_approach || acceptedQuote.quality_standards || acceptedQuote.safety_measures || acceptedQuote.environmental_compliance) && (
                <div className="mt-4 pt-4 border-t border-emerald-500/20">
                  <div className="bg-black/20 rounded-lg p-4 border border-emerald-500/20">
                    <h5 className="text-white font-semibold mb-3 flex items-center gap-2">
                      <Settings size={16} className="text-emerald-400" />
                      Technische Details
                    </h5>
                    <div className="space-y-4">
                      {acceptedQuote.technical_approach && (
                        <div>
                          <div className="text-sm text-emerald-300 mb-2">Technischer Ansatz</div>
                          <div className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap bg-black/30 rounded-lg p-3">
                            {acceptedQuote.technical_approach}
                          </div>
                        </div>
                      )}
                      {acceptedQuote.quality_standards && (
                        <div>
                          <div className="text-sm text-emerald-300 mb-2">Qualitätsstandards</div>
                          <div className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap bg-black/30 rounded-lg p-3">
                            {acceptedQuote.quality_standards}
                          </div>
                        </div>
                      )}
                      {acceptedQuote.safety_measures && (
                        <div>
                          <div className="text-sm text-emerald-300 mb-2">Sicherheitsmaßnahmen</div>
                          <div className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap bg-black/30 rounded-lg p-3">
                            {acceptedQuote.safety_measures}
                          </div>
                        </div>
                      )}
                      {acceptedQuote.environmental_compliance && (
                        <div>
                          <div className="text-sm text-emerald-300 mb-2">Umwelt-Compliance</div>
                          <div className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap bg-black/30 rounded-lg p-3">
                            {acceptedQuote.environmental_compliance}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Risikobewertung und Notfallplan */}
              {(acceptedQuote.risk_assessment || acceptedQuote.contingency_plan) && (
                <div className="mt-4 pt-4 border-t border-emerald-500/20">
                  <div className="bg-black/20 rounded-lg p-4 border border-emerald-500/20">
                    <h5 className="text-white font-semibold mb-3 flex items-center gap-2">
                      <AlertTriangle size={16} className="text-emerald-400" />
                      Risikomanagement
                    </h5>
                    <div className="space-y-4">
                      {acceptedQuote.risk_assessment && (
                        <div>
                          <div className="text-sm text-emerald-300 mb-2">Risikobewertung</div>
                          <div className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap bg-black/30 rounded-lg p-3">
                            {acceptedQuote.risk_assessment}
                          </div>
                        </div>
                      )}
                      {acceptedQuote.contingency_plan && (
                        <div>
                          <div className="text-sm text-emerald-300 mb-2">Notfallplan</div>
                          <div className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap bg-black/30 rounded-lg p-3">
                            {acceptedQuote.contingency_plan}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Zusätzliche Notizen */}
              {acceptedQuote.additional_notes && (
                <div className="mt-4 pt-4 border-t border-emerald-500/20">
                  <div className="bg-black/20 rounded-lg p-4 border border-emerald-500/20">
                    <h5 className="text-white font-semibold mb-3 flex items-center gap-2">
                      <MessageCircle size={16} className="text-emerald-400" />
                      Zusätzliche Notizen
                    </h5>
                    <div className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap bg-black/30 rounded-lg p-3">
                      {acceptedQuote.additional_notes}
                    </div>
                  </div>
                </div>
              )}
              
              {/* Aktionen */}
              <div className="mt-4 flex flex-wrap gap-2">
                {acceptedQuote.email && (
                  <button
                    onClick={() => window.open(`mailto:${acceptedQuote.email}`, '_blank')}
                    className="px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors flex items-center gap-2"
                  >
                    <Mail size={16} />
                    E-Mail senden
                  </button>
                )}
                
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
            </div>
          )}

          {/* HAUPTANSICHT: Unterschiedlich je nach Angebotsstatus */}
          {acceptedQuote ? (
            // ANSICHT 1: Nach Annahme eines Angebots
            <div className="space-y-6">


              {/* Project Info */}
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-blue-300 mb-3">Projekt Information</h3>
                <div className="space-y-2">
                  <p className="text-gray-300"><span className="text-white font-medium">Projekt:</span> {project?.name}</p>
                  <p className="text-gray-300"><span className="text-white font-medium">Gewerk:</span> {trade?.title}</p>
                  <p className="text-gray-300"><span className="text-white font-medium">Status:</span> {trade?.status}</p>
                  {/* Fertigstellungsstatus */}
                  {completionStatus && completionStatus !== 'in_progress' && (
                    <div className="flex items-center gap-2">
                      <span className="text-white font-medium">Fertigstellung:</span>
                      <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${
                        completionStatus === 'completed' 
                          ? 'bg-green-500/20 border border-green-500/30 text-green-300'
                          : completionStatus === 'completed_with_defects'
                          ? 'bg-yellow-500/20 border border-yellow-500/30 text-yellow-300'
                          : completionStatus === 'completion_requested'
                          ? 'bg-orange-500/20 border border-orange-500/30 text-orange-300'
                          : 'bg-gray-500/20 border border-gray-500/30 text-gray-300'
                      }`}>
                        {completionStatus === 'completion_requested' ? (
                          <>
                            <Clock size={14} />
                            Als fertiggestellt markiert
                          </>
                        ) : completionStatus === 'completed' ? (
                          <>
                            <CheckCircle size={14} />
                            Abgeschlossen
                          </>
                        ) : completionStatus === 'completed_with_defects' ? (
                          <>
                            <AlertTriangle size={14} />
                            Unter Vorbehalt
                          </>
                        ) : (
                          <span>{completionStatus}</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Submitted Quotes - Aktionen möglich */}
              {submittedQuotes.length > 0 && (
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-blue-300 mb-3">
                    Eingereichte Angebote ({submittedQuotes.length})
                  </h3>
                  <div className="space-y-3">
                    {submittedQuotes.map((quote) => (
                      <div key={quote.id} className="bg-gray-700/30 rounded-lg p-3">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <span className="text-white font-medium">{quote.company_name}</span>
                            <span className="ml-2 text-xs px-2 py-1 rounded bg-blue-600 text-white">
                              {quote.status}
                            </span>
                          </div>
                          <span className="text-gray-300 font-medium">
                            {quote.total_amount?.toLocaleString('de-DE')} {quote.currency || 'EUR'}
                          </span>
                        </div>
                        
                        {quote.description && (
                          <p className="text-gray-400 text-sm mb-3">{quote.description}</p>
                        )}
                        
                        <div className="flex gap-2 flex-wrap">
                          {onAcceptQuote && (
                            <button
                              onClick={() => handleAcceptQuote(quote)}
                              disabled={loading}
                              className="flex items-center gap-1 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg transition-colors disabled:opacity-50"
                            >
                              <Check size={14} />
                              Annehmen
                            </button>
                          )}
                          
                          {onRejectQuote && (
                            <button
                              onClick={() => {
                                setSelectedQuoteForAction(quote);
                                setShowRejectModal(true);
                              }}
                              disabled={loading}
                              className="flex items-center gap-1 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg transition-colors disabled:opacity-50"
                            >
                              <XCircle size={14} />
                              Ablehnen
                            </button>
                          )}
                          
                          {onCreateInspection && (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => toggleQuoteForInspection(quote.id)}
                                className={`flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg transition-colors ${
                                  selectedQuotesForInspection.includes(quote.id)
                                    ? 'bg-purple-600 hover:bg-purple-700 text-white'
                                    : 'bg-gray-600 hover:bg-gray-700 text-gray-300'
                                }`}
                              >
                                <Eye size={14} />
                                {selectedQuotesForInspection.includes(quote.id) ? 'Ausgewählt' : 'Besichtigung'}
                              </button>
                              
                              {/* Terminantwort-Status */}
                              {inspectionStatus.hasActiveInspection && inspectionStatus.appointmentDate && (
                                <span className={`text-xs px-2 py-1 rounded ${
                                  formatAppointmentStatus(quote.service_provider_id || quote.user_id, inspectionStatus.appointmentDate).color
                                } bg-gray-700/50`}>
                                  {formatAppointmentStatus(quote.service_provider_id || quote.user_id, inspectionStatus.appointmentDate).text}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Besichtigungs-Button */}
                  {onCreateInspection && selectedQuotesForInspection.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-600/30">
                      <button
                        onClick={handleCreateInspection}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors"
                      >
                        <Eye size={16} />
                        Besichtigung erstellen ({selectedQuotesForInspection.length} Angebote)
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Accepted Quote Actions */}
              {acceptedQuote && onResetQuote && (
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-yellow-300 mb-3 flex items-center gap-2">
                    <AlertTriangle size={20} />
                    Angebot-Verwaltung
                  </h3>
                  <p className="text-gray-300 text-sm mb-3">
                    Das Angebot von {acceptedQuote.company_name} wurde angenommen. 
                    Sie können es zurücksetzen, um andere Angebote zu prüfen.
                  </p>
                  <button
                    onClick={() => handleResetQuote(acceptedQuote)}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
                  >
                    <RotateCcw size={16} />
                    Angebot zurücksetzen
                  </button>
                </div>
              )}

              {/* Dokumente-Bereich mit vollständigem Viewer */}
              <TradeDocumentViewer 
                documents={loadedDocuments} 
                existingQuotes={quotes} 
              />
              
              {/* Kommunikation & Fortschritt */}
              <div className="bg-gradient-to-br from-[#2c3539]/50 to-[#1a1a2e]/50 rounded-xl border border-gray-600/30 p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <MessageCircle size={20} className="text-[#ffbd59]" />
                  Kommunikation & Fortschritt
                </h3>
                
                <TradeProgress
                  milestoneId={trade?.id}
                  currentProgress={currentProgress}
                  onProgressChange={handleProgressChange}
                  isBautraeger={true}
                  isServiceProvider={false}
                  completionStatus={completionStatus}
                  onCompletionRequest={handleCompletionRequest}
                  onCompletionResponse={handleCompletionResponse}
                  hideCompletionResponseControls={true}
                  hasAcceptedQuote={true}
                />
              </div>
              
              {/* Abnahme-Workflow-Bereich */}
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
                    : completionStatus === 'completion_requested'
                    ? 'bg-orange-500/10 border-orange-500/30'
                    : 'bg-blue-500/10 border-blue-500/30'
                }`}>
                  <div className="flex items-center gap-3">
                    {completionStatus === 'completed' ? (
                      <>
                        <CheckCircle size={20} className="text-green-400" />
                        <div>
                          <h4 className="text-green-300 font-medium">Gewerk vollständig abgenommen</h4>
                          <p className="text-green-200 text-sm">Das Gewerk wurde erfolgreich und ohne Mängel abgenommen.</p>
                        </div>
                      </>
                    ) : completionStatus === 'completed_with_defects' ? (
                      <>
                        <AlertTriangle size={20} className="text-yellow-400" />
                        <div>
                          <h4 className="text-yellow-300 font-medium">Abnahme unter Vorbehalt</h4>
                          <p className="text-yellow-200 text-sm">
                            Mängel wurden dokumentiert. Finale Abnahme steht noch aus.
                          </p>
                        </div>
                      </>
                    ) : completionStatus === 'completion_requested' ? (
                      <>
                        <AlertTriangle size={20} className="text-orange-400" />
                        <div>
                          <h4 className="text-orange-300 font-medium">Fertigstellung gemeldet</h4>
                          <p className="text-orange-200 text-sm">
                            Der Dienstleister hat die Fertigstellung gemeldet. Abnahme kann gestartet werden.
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

                {/* Abnahme-Aktionen */}
                <div className="space-y-3">
                  {completionStatus === 'completion_requested' && isBautraeger() && (
                    <div className="flex gap-3 flex-wrap">
                      <button
                        onClick={handleStartAcceptance}
                        disabled={loading}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
                      >
                        <PlayCircle size={16} />
                        Abnahme starten
                      </button>
                      
                      <button
                        onClick={() => setShowScheduleModal(true)}
                        disabled={loading}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
                      >
                        <Calendar size={16} />
                        Abnahme-Termin vereinbaren
                      </button>
                    </div>
                  )}
                  
                  {completionStatus === 'completed_with_defects' && (
                    <div className="space-y-3">
                      <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-lg p-3">
                        <h4 className="text-yellow-300 font-medium mb-2">Dokumentierte Mängel ({acceptanceDefects.length})</h4>
                        {acceptanceDefects.length > 0 ? (
                          <div className="space-y-2">
                            {acceptanceDefects.slice(0, 3).map((defect, index) => (
                              <div key={index} className="text-sm text-gray-300">
                                • {defect.description || defect.title || `Mangel ${index + 1}`}
                              </div>
                            ))}
                            {acceptanceDefects.length > 3 && (
                              <div className="text-sm text-gray-400">
                                ... und {acceptanceDefects.length - 3} weitere Mängel
                              </div>
                            )}
                          </div>
                        ) : (
                          <p className="text-gray-400 text-sm">Keine Mängel-Details verfügbar</p>
                        )}
                      </div>
                      
                      <button
                        onClick={() => setShowFinalAcceptanceModal(true)}
                        disabled={loading}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
                      >
                        <CheckCircle size={16} />
                        Finale Abnahme durchführen
                      </button>
                    </div>
                  )}
                  
                  {completionStatus === 'completed' && (
                    <div className="space-y-3">
                      <div className="bg-green-500/5 border border-green-500/20 rounded-lg p-3">
                        <div className="flex items-center gap-2 text-green-300">
                          <CheckCircle size={16} />
                          <span className="text-sm font-medium">
                            Gewerk vollständig abgeschlossen
                          </span>
                        </div>
                      </div>
                      
                      {/* Rechnungsanzeige */}
                      {(() => {
                        console.log('🔍 SimpleCostEstimateModal - Rechnungsanzeige Check:', {
                          existingInvoice,
                          isBautraeger: isBautraeger(),
                          completionStatus
                        });
                        return null;
                      })()}
                      {existingInvoice ? (
                        <div className="bg-blue-500/5 border border-blue-500/20 rounded-lg p-3">
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <h4 className="text-blue-300 font-medium">Rechnung erhalten</h4>
                              <p className="text-gray-400 text-sm">Der Dienstleister hat eine Rechnung erstellt</p>
                            </div>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              existingInvoice.status === 'paid' 
                                ? 'bg-green-500/20 text-green-300'
                                : existingInvoice.status === 'sent'
                                ? 'bg-blue-500/20 text-blue-300'
                                : 'bg-yellow-500/20 text-yellow-300'
                            }`}>
                              {existingInvoice.status === 'paid' ? 'Bezahlt' : 
                               existingInvoice.status === 'sent' ? 'Versendet' : 'Neu'}
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4 mb-3 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-400">Rechnungsnummer:</span>
                              <span className="text-white font-medium">{existingInvoice.invoice_number}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">Betrag:</span>
                              <span className="text-white font-medium">
                                {new Intl.NumberFormat('de-DE', {
                                  style: 'currency',
                                  currency: existingInvoice.currency || 'EUR'
                                }).format(existingInvoice.total_amount || 0)}
                              </span>
                            </div>
                          </div>
                          
                          <div className="flex gap-2 flex-wrap">
                            <button
                              onClick={handleViewInvoice}
                              className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
                            >
                              <Eye size={14} />
                              Öffnen
                            </button>
                            <button
                              onClick={handleDownloadInvoice}
                              className="flex items-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors"
                            >
                              <Download size={14} />
                              Download
                            </button>
                            {existingInvoice.status !== 'paid' && (
                              <button
                                onClick={handleMarkAsPaid}
                                className="flex items-center gap-2 px-3 py-2 bg-yellow-600 hover:bg-yellow-700 text-white text-sm font-medium rounded-lg transition-colors"
                                disabled={isMarkingAsPaid}
                              >
                                <CreditCard size={14} />
                                {isMarkingAsPaid ? 'Wird markiert...' : 'Als bezahlt markieren'}
                              </button>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="bg-blue-500/5 border border-blue-500/20 rounded-lg p-3">
                          <p className="text-blue-300 text-sm">
                            Warten auf Rechnung vom Dienstleister...
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Besichtigungs-Management */}
              {submittedQuotes.length > 0 && (
                <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-purple-300 mb-3 flex items-center gap-2">
                    <Eye size={20} />
                    Besichtigungs-Management
                  </h3>
                  
                  {inspectionStatus.hasActiveInspection ? (
                    <div className="space-y-4">
                      {/* Aktive Besichtigung */}
                      <div className="bg-purple-500/5 border border-purple-500/20 rounded-lg p-4">
                        <div className="flex items-center gap-3 mb-3">
                          <Calendar size={20} className="text-purple-400" />
                          <div>
                            <h4 className="text-purple-300 font-medium">Aktive Besichtigung</h4>
                            <p className="text-gray-300 text-sm">
                              {inspectionStatus.appointmentDate 
                                ? `Termin: ${new Date(inspectionStatus.appointmentDate).toLocaleDateString('de-DE')} um ${new Date(inspectionStatus.appointmentDate).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}`
                                : 'Termin wird koordiniert'
                              }
                            </p>
                          </div>
                        </div>
                        
                        {/* Terminantworten-Übersicht */}
                        {appointmentResponses.length > 0 && (
                          <div className="space-y-2">
                            <h5 className="text-sm font-medium text-purple-300">Terminantworten:</h5>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              {appointmentResponses.map((response, index) => {
                                const quote = quotes.find(q => (q.service_provider_id || q.user_id) === response.service_provider_id);
                                const statusInfo = formatAppointmentStatus(response.service_provider_id, inspectionStatus.appointmentDate);
                                
                                return (
                                  <div key={index} className="flex items-center justify-between bg-gray-700/30 rounded-lg p-2">
                                    <span className="text-white text-sm">{quote?.company_name || 'Unbekannt'}</span>
                                    <span className={`text-xs px-2 py-1 rounded ${statusInfo.color} bg-gray-700/50`}>
                                      {statusInfo.text}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                        
                        {inspectionStatus.isInspectionDay && (
                          <div className="mt-3 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                            <div className="flex items-center gap-2 text-green-300">
                              <CheckCircle size={16} />
                              <span className="text-sm font-medium">Heute ist Besichtigungstag!</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-gray-300 text-sm">
                        Wählen Sie Angebote für eine gemeinsame Besichtigung aus und erstellen Sie einen Besichtigungstermin.
                      </p>
                      
                      {selectedQuotesForInspection.length > 0 && (
                        <div className="bg-purple-500/5 border border-purple-500/20 rounded-lg p-3">
                          <h4 className="text-purple-300 font-medium mb-2">
                            Ausgewählte Angebote ({selectedQuotesForInspection.length})
                          </h4>
                          <div className="space-y-1">
                            {selectedQuotesForInspection.map(quoteId => {
                              const quote = quotes.find(q => q.id === quoteId);
                              return (
                                <div key={quoteId} className="flex items-center justify-between text-sm">
                                  <span className="text-white">{quote?.company_name}</span>
                                  <span className="text-gray-400">
                                    {quote?.total_amount?.toLocaleString('de-DE')} {quote?.currency || 'EUR'}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}



              {/* Fortschritts-Tracking */}
              {acceptedQuote && (
                <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-cyan-300 mb-3 flex items-center gap-2">
                    <Settings size={20} />
                    Projekt-Fortschritt
                  </h3>
                  
                  {/* Fortschritts-Balken */}
                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-cyan-300">Gesamtfortschritt</span>
                      <span className="text-sm text-gray-400">
                        {completionStatus === 'completed' ? '100%' : 
                         completionStatus === 'completed_with_defects' ? '90%' : 
                         acceptedQuote ? '60%' : '20%'}
                      </span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-300 ${
                          completionStatus === 'completed' ? 'bg-green-500 w-full' :
                          completionStatus === 'completed_with_defects' ? 'bg-yellow-500 w-[90%]' :
                          acceptedQuote ? 'bg-cyan-500 w-[60%]' : 'bg-blue-500 w-[20%]'
                        }`}
                      />
                    </div>
                  </div>

                  {/* Meilensteine */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                        quotes.length > 0 ? 'bg-green-500' : 'bg-gray-600'
                      }`}>
                        {quotes.length > 0 ? <Check size={14} className="text-white" /> : <span className="text-xs text-gray-400">1</span>}
                      </div>
                      <div className="flex-1">
                        <h4 className="text-white font-medium">Angebote erhalten</h4>
                        <p className="text-gray-400 text-sm">{quotes.length} Angebote eingegangen</p>
                      </div>
                      <span className="text-xs text-gray-400">
                        {quotes.length > 0 ? '✓ Abgeschlossen' : 'Ausstehend'}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                        acceptedQuote ? 'bg-green-500' : 'bg-gray-600'
                      }`}>
                        {acceptedQuote ? <Check size={14} className="text-white" /> : <span className="text-xs text-gray-400">2</span>}
                      </div>
                      <div className="flex-1">
                        <h4 className="text-white font-medium">Angebot angenommen</h4>
                        <p className="text-gray-400 text-sm">
                          {acceptedQuote ? `${acceptedQuote.company_name} beauftragt` : 'Noch kein Angebot angenommen'}
                        </p>
                      </div>
                      <span className="text-xs text-gray-400">
                        {acceptedQuote ? '✓ Abgeschlossen' : 'Ausstehend'}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                        completionStatus === 'in_progress' && acceptedQuote ? 'bg-blue-500' : 
                        completionStatus === 'completed' || completionStatus === 'completed_with_defects' ? 'bg-green-500' : 
                        'bg-gray-600'
                      }`}>
                        {completionStatus === 'completed' || completionStatus === 'completed_with_defects' ? 
                          <Check size={14} className="text-white" /> : 
                          completionStatus === 'in_progress' && acceptedQuote ? 
                            <Clock size={14} className="text-white" /> : 
                            <span className="text-xs text-gray-400">3</span>
                        }
                      </div>
                      <div className="flex-1">
                        <h4 className="text-white font-medium">Ausführung</h4>
                        <p className="text-gray-400 text-sm">
                          {completionStatus === 'completed' ? 'Gewerk abgeschlossen' :
                           completionStatus === 'completed_with_defects' ? 'Abgeschlossen mit Mängeln' :
                           completionStatus === 'in_progress' && acceptedQuote ? 'In Bearbeitung' :
                           'Noch nicht gestartet'}
                        </p>
                      </div>
                      <span className="text-xs text-gray-400">
                        {completionStatus === 'completed' ? '✓ Abgeschlossen' :
                         completionStatus === 'completed_with_defects' ? '⚠ Mit Mängeln' :
                         completionStatus === 'in_progress' && acceptedQuote ? '🔄 Läuft' :
                         'Ausstehend'}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                        completionStatus === 'completed' ? 'bg-green-500' : 'bg-gray-600'
                      }`}>
                        {completionStatus === 'completed' ? <Check size={14} className="text-white" /> : <span className="text-xs text-gray-400">4</span>}
                      </div>
                      <div className="flex-1">
                        <h4 className="text-white font-medium">Finale Abnahme</h4>
                        <p className="text-gray-400 text-sm">
                          {completionStatus === 'completed' ? 'Erfolgreich abgenommen' : 'Noch ausstehend'}
                        </p>
                      </div>
                      <span className="text-xs text-gray-400">
                        {completionStatus === 'completed' ? '✓ Abgeschlossen' : 'Ausstehend'}
                      </span>
                    </div>
                  </div>

                  {/* Zeitplan-Info */}
                  {acceptedQuote && (acceptedQuote.start_date || acceptedQuote.completion_date) && (
                    <div className="mt-4 p-3 bg-cyan-500/5 border border-cyan-500/20 rounded-lg">
                      <h4 className="text-cyan-300 font-medium mb-2">Zeitplan</h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        {acceptedQuote.start_date && (
                          <div>
                            <span className="text-gray-400">Geplanter Start:</span>
                            <div className="text-white font-medium">
                              {new Date(acceptedQuote.start_date).toLocaleDateString('de-DE')}
                            </div>
                          </div>
                        )}
                        {acceptedQuote.completion_date && (
                          <div>
                            <span className="text-gray-400">Geplante Fertigstellung:</span>
                            <div className="text-white font-medium">
                              {new Date(acceptedQuote.completion_date).toLocaleDateString('de-DE')}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* All Quotes Summary */}
              <div className="bg-gray-500/10 border border-gray-500/30 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-300 mb-3">Alle Angebote ({quotes.length})</h3>
                <div className="space-y-2">
                  {quotes.map((quote, index) => (
                    <div key={quote.id} className="flex justify-between items-center py-2 border-b border-gray-600/30 last:border-b-0">
                      <div>
                        <span className="text-white font-medium">{quote.company_name}</span>
                        <span className={`ml-2 text-xs px-2 py-1 rounded ${
                          quote.status === 'accepted' ? 'bg-green-600 text-white' :
                          quote.status === 'submitted' ? 'bg-blue-600 text-white' :
                          quote.status === 'rejected' ? 'bg-red-600 text-white' :
                          'bg-gray-600 text-gray-300'
                        }`}>
                          {quote.status}
                        </span>
                      </div>
                      <span className="text-gray-300">
                        {quote.total_amount?.toLocaleString('de-DE')} {quote.currency || 'EUR'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : quotes.length > 0 ? (
            // ANSICHT 2: Angebote vorhanden aber noch keins angenommen
            <div className="space-y-6">
              {/* Hauptbereich: Angebotsliste mit Mehrfachauswahl */}
              <div className="bg-gradient-to-br from-[#2c3539]/50 to-[#1a1a2e]/50 rounded-xl border border-gray-600/30 p-6">
                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <FileText size={24} className="text-[#ffbd59]" />
                  Eingegangene Angebote ({quotes.length})
                </h3>
                
                {/* Besichtigungshinweis wenn erforderlich */}
                {trade?.requires_inspection === '1' && (
                  <div className="mb-6 p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2 text-purple-300 mb-1">
                          <Eye size={18} />
                          <span className="font-medium">Besichtigung erforderlich</span>
                        </div>
                        <p className="text-gray-400 text-sm">
                          Wählen Sie die Anbieter aus, die Sie zur Besichtigung einladen möchten.
                          Sie können auch direkt ein Angebot annehmen.
                        </p>
                      </div>
                      {selectedQuotesForInspection.length > 0 && (
                        <div className="text-purple-300 font-bold text-lg">
                          {selectedQuotesForInspection.length} ausgewählt
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Angebotsliste */}
                <div className="space-y-4">
                  {quotes.map((quote) => (
                    <div 
                      key={quote.id} 
                      className={`bg-[#1a1a2e]/50 rounded-lg border-2 transition-all duration-200 ${
                        selectedQuotesForInspection.includes(quote.id) 
                          ? 'border-purple-500 shadow-lg shadow-purple-500/20' 
                          : 'border-gray-600/50 hover:border-gray-500'
                      }`}
                    >
                      {/* Angebots-Header */}
                      <div className="p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex items-center gap-3">
                            {/* Checkbox für Besichtigung */}
                            {trade?.requires_inspection === '1' && (
                              <button
                                onClick={() => toggleQuoteForInspection(quote.id)}
                                className="p-1 hover:bg-purple-500/20 rounded transition-colors"
                              >
                                {selectedQuotesForInspection.includes(quote.id) ? (
                                  <CheckSquare size={24} className="text-purple-400" />
                                ) : (
                                  <Square size={24} className="text-gray-500" />
                                )}
                              </button>
                            )}
                            
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-white font-bold text-lg">{quote.company_name}</span>
                                <span className={`text-xs px-2 py-1 rounded font-medium ${
                                  quote.status === 'submitted' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' :
                                  quote.status === 'draft' ? 'bg-gray-500/20 text-gray-300 border border-gray-500/30' :
                                  quote.status === 'rejected' ? 'bg-red-500/20 text-red-300 border border-red-500/30' :
                                  'bg-gray-500/20 text-gray-300 border border-gray-500/30'
                                }`}>
                                  {quote.status === 'submitted' ? 'Eingereicht' :
                                   quote.status === 'draft' ? 'Entwurf' :
                                   quote.status === 'rejected' ? 'Abgelehnt' :
                                   quote.status}
                                </span>
                              </div>
                              {quote.contact_person && (
                                <div className="text-sm text-gray-400 mt-1">
                                  Ansprechpartner: {quote.contact_person}
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <div className="text-right">
                            <div className="text-2xl font-bold text-green-400">
                              CHF {quote.total_amount?.toLocaleString('de-DE')}
                            </div>
                            {quote.valid_until && (
                              <div className="text-xs text-gray-400 mt-1">
                                Gültig bis: {new Date(quote.valid_until).toLocaleDateString('de-DE')}
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {/* Angebots-Details */}
                        {quote.description && (
                          <div className="mb-3 p-3 bg-gray-700/20 rounded-lg">
                            <p className="text-gray-300 text-sm">{quote.description}</p>
                          </div>
                        )}
                        
                        {/* Kennzahlen */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                          {quote.estimated_duration && (
                            <div className="flex items-center gap-2 p-2 bg-blue-500/10 rounded-lg">
                              <Clock size={16} className="text-blue-400" />
                              <div>
                                <div className="text-xs text-gray-400">Dauer</div>
                                <div className="text-sm text-white font-medium">{quote.estimated_duration} Tage</div>
                              </div>
                            </div>
                          )}
                          {quote.warranty_period && (
                            <div className="flex items-center gap-2 p-2 bg-green-500/10 rounded-lg">
                              <CheckCircle size={16} className="text-green-400" />
                              <div>
                                <div className="text-xs text-gray-400">Garantie</div>
                                <div className="text-sm text-white font-medium">{quote.warranty_period} Monate</div>
                              </div>
                            </div>
                          )}
                          {quote.start_date && (
                            <div className="flex items-center gap-2 p-2 bg-cyan-500/10 rounded-lg">
                              <Calendar size={16} className="text-cyan-400" />
                              <div>
                                <div className="text-xs text-gray-400">Start</div>
                                <div className="text-sm text-white font-medium">
                                  {new Date(quote.start_date).toLocaleDateString('de-DE')}
                                </div>
                              </div>
                            </div>
                          )}
                          {quote.completion_date && (
                            <div className="flex items-center gap-2 p-2 bg-orange-500/10 rounded-lg">
                              <Flag size={16} className="text-orange-400" />
                              <div>
                                <div className="text-xs text-gray-400">Fertig</div>
                                <div className="text-sm text-white font-medium">
                                  {new Date(quote.completion_date).toLocaleDateString('de-DE')}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                        
                        {/* Aktions-Buttons */}
                        <div className="flex gap-2 flex-wrap pt-3 border-t border-gray-600/30">
                          {/* Direkt annehmen - auch bei Besichtigung möglich */}
                          {quote.status === 'submitted' && onAcceptQuote && (
                            <button
                              onClick={() => handleAcceptQuote(quote)}
                              disabled={loading}
                              className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
                            >
                              <Check size={16} />
                              Angebot annehmen
                            </button>
                          )}
                          
                          {/* Ablehnen */}
                          {quote.status === 'submitted' && onRejectQuote && (
                            <button
                              onClick={() => {
                                setSelectedQuoteForAction(quote);
                                setShowRejectModal(true);
                              }}
                              disabled={loading}
                              className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
                            >
                              <XCircle size={16} />
                              Ablehnen
                            </button>
                          )}
                          
                          {/* Details anzeigen */}
                          <button
                            onClick={() => console.log('Details für Quote:', quote.id)}
                            className="flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-lg transition-colors"
                          >
                            <Eye size={16} />
                            Details
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Besichtigungstermin-Button (fixiert am Ende) */}
                {trade?.requires_inspection === '1' && onCreateInspection && selectedQuotesForInspection.length > 0 && (
                  <div className="mt-6 pt-6 border-t border-gray-600/30">
                    <button
                      onClick={handleCreateInspection}
                      className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-bold rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
                    >
                      <Eye size={20} />
                      <span>
                        Besichtigungstermin vereinbaren mit {selectedQuotesForInspection.length} {selectedQuotesForInspection.length === 1 ? 'Anbieter' : 'Anbietern'}
                      </span>
                    </button>
                  </div>
                )}
              </div>

              {/* Dokumente-Bereich */}
              <div className="bg-gradient-to-br from-[#2c3539]/50 to-[#1a1a2e]/50 rounded-xl border border-gray-600/30 p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <FileText size={20} className="text-[#ffbd59]" />
                  Geteilte Dokumente
                  {documentsLoading && (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#ffbd59]"></div>
                  )}
                </h3>
                
                {documentsError ? (
                  <div className="text-center py-8">
                    <div className="text-red-400 mb-4">
                      Fehler beim Laden der Dokumente: {documentsError}
                    </div>
                  </div>
                ) : loadedDocuments.length > 0 ? (
                  <TradeDocumentViewer 
                    documents={loadedDocuments} 
                    existingQuotes={quotes} 
                  />
                ) : (
                  <div className="text-center py-8">
                    <FileText size={48} className="text-gray-500 mx-auto mb-4" />
                    <p className="text-gray-400">Keine geteilten Dokumente vorhanden</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            // ANSICHT 3: Noch keine Angebote vorhanden
            <div className="space-y-6">
              <div className="text-center py-8 bg-gray-700/20 rounded-lg">
                <FileText size={48} className="text-gray-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-300 mb-2">Noch keine Angebote</h3>
                <p className="text-gray-400 mb-4">Es wurden noch keine Angebote für dieses Gewerk eingereicht.</p>
                {trade?.requires_inspection === '1' && (
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/20 border border-purple-500/30 rounded-lg">
                    <Eye size={16} className="text-purple-400" />
                    <span className="text-purple-300 text-sm">Besichtigung erforderlich</span>
                  </div>
                )}
              </div>

              {/* Dokumente auch ohne Angebote anzeigen */}
              <TradeDocumentViewer 
                documents={loadedDocuments} 
                existingQuotes={quotes} 
              />
            </div>
          )}


        </div>
      </div>

      {/* Ablehnungs-Modal */}
      {showRejectModal && selectedQuoteForAction && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-60 p-4">
          <div className="bg-[#2c3539] rounded-2xl shadow-2xl border border-white/20 max-w-md w-full">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Kostenvoranschlag ablehnen</h3>
              
              <div className="space-y-4">
                <div>
                  <p className="text-gray-300 text-sm mb-2">
                    Angebot von: <span className="font-medium text-white">{selectedQuoteForAction.company_name}</span>
                  </p>
                  <p className="text-gray-300 text-sm">
                    Betrag: <span className="font-medium text-white">
                      {selectedQuoteForAction.total_amount?.toLocaleString('de-DE')} {selectedQuoteForAction.currency || 'EUR'}
                    </span>
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Ablehnungsgrund (optional)
                  </label>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Grund für die Ablehnung..."
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                    rows={3}
                  />
                </div>
              </div>
              
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowRejectModal(false);
                    setSelectedQuoteForAction(null);
                    setRejectionReason('');
                  }}
                  className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg font-medium transition-colors"
                >
                  Abbrechen
                </button>
                <button
                  onClick={handleRejectQuote}
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  {loading ? 'Wird abgelehnt...' : 'Ablehnen'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}



      {/* Abnahme-Modal */}
      {showAcceptanceModal && (
        <AcceptanceModal
          isOpen={showAcceptanceModal}
          onClose={() => setShowAcceptanceModal(false)}
          trade={trade}
          onComplete={handleCompleteAcceptance}
          loading={loading}
        />
      )}

      {/* Terminvereinbarungs-Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-70 p-4">
          <div className="bg-[#2c3539] rounded-2xl shadow-2xl border border-white/20 max-w-md w-full">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Abnahme-Termin vereinbaren</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Datum *
                  </label>
                  <input
                    type="date"
                    value={proposedDate}
                    onChange={(e) => setProposedDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Uhrzeit *
                  </label>
                  <input
                    type="time"
                    value={proposedTime}
                    onChange={(e) => setProposedTime(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Notizen (optional)
                  </label>
                  <textarea
                    value={scheduleNotes}
                    onChange={(e) => setScheduleNotes(e.target.value)}
                    placeholder="Zusätzliche Informationen zum Termin..."
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    rows={3}
                  />
                </div>
              </div>
              
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowScheduleModal(false);
                    setProposedDate('');
                    setProposedTime('');
                    setScheduleNotes('');
                  }}
                  className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg font-medium transition-colors"
                >
                  Abbrechen
                </button>
                <button
                  onClick={handleScheduleAcceptance}
                  disabled={!proposedDate || !proposedTime}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  Termin vorschlagen
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Finale Abnahme-Modal - entfernt, da doppelt vorhanden */}

      {/* Kommunikations-Modal */}
      {showCommunicationModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-70 p-4">
          <div className="bg-[#2c3539] rounded-2xl shadow-2xl border border-white/20 max-w-2xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-600/30">
              <div className="flex items-center gap-3">
                <MessageCircle size={20} className="text-blue-400" />
                <div>
                  <h3 className="text-xl font-semibold text-white">Kommunikation</h3>
                  <p className="text-sm text-gray-400">
                    {acceptedQuote?.company_name || 'Service Provider'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowCommunicationModal(false)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X size={20} className="text-gray-400" />
              </button>
            </div>
            
            <div className="flex flex-col h-[calc(90vh-140px)]">
              {/* Nachrichten-Historie */}
              <div className="flex-1 p-4 overflow-y-auto">
                {communicationLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
                    <span className="ml-3 text-gray-400">Nachrichten werden geladen...</span>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center py-8">
                    <MessageCircle size={48} className="text-gray-500 mx-auto mb-4" />
                    <h4 className="text-lg font-medium text-gray-300 mb-2">Noch keine Nachrichten</h4>
                    <p className="text-gray-400 text-sm">Starten Sie die Kommunikation mit dem Service Provider.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {messages.map((message, index) => (
                      <div
                        key={message.id || index}
                        className={`flex ${
                          message.sender_type === 'bautraeger' ? 'justify-end' : 'justify-start'
                        }`}
                      >
                        <div
                          className={`max-w-[70%] rounded-lg p-3 ${
                            message.sender_type === 'bautraeger'
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-700 text-gray-100'
                          }`}
                        >
                          <p className="text-sm">{message.message}</p>
                          <div className="flex items-center justify-between mt-2 text-xs opacity-70">
                            <span>
                              {message.sender_type === 'bautraeger' ? 'Sie' : acceptedQuote?.company_name || 'Service Provider'}
                            </span>
                            <span>
                              {message.created_at 
                                ? new Date(message.created_at).toLocaleString('de-DE', {
                                    day: '2-digit',
                                    month: '2-digit',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })
                                : 'Jetzt'
                              }
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Nachricht senden */}
              <div className="p-4 border-t border-gray-600/30">
                <div className="flex gap-3">
                  <textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Nachricht eingeben..."
                    className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    rows={2}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                      }
                    }}
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!newMessage.trim() || communicationLoading}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 self-end"
                  >
                    {communicationLoading ? 'Senden...' : 'Senden'}
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  Drücken Sie Enter zum Senden, Shift+Enter für neue Zeile
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AcceptanceModal für Abnahme-Workflow */}
      {showAcceptanceModal && (
        <AcceptanceModal
          isOpen={showAcceptanceModal}
          onClose={() => setShowAcceptanceModal(false)}
          trade={trade}
          onComplete={handleCompleteAcceptance}
        />
      )}

      {/* FinalAcceptanceModal für finale Abnahme */}
      {showFinalAcceptanceModal && acceptanceId && (
        <FinalAcceptanceModal
          isOpen={showFinalAcceptanceModal}
          onClose={() => setShowFinalAcceptanceModal(false)}
          acceptanceId={acceptanceId}
          milestoneId={trade?.id}
          milestoneTitle={trade?.title}
          defects={acceptanceDefects}
          onAcceptanceComplete={() => {
            setShowFinalAcceptanceModal(false);
            // Reload der Daten nach finaler Abnahme
            if (trade?.id) {
              loadTradeDocuments(trade.id);
            }
          }}
        />
      )}
    </div>
  );
}
