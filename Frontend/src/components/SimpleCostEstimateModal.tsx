import React, { useState, useEffect, useMemo, useRef } from 'react';
import { X, FileText, Euro, Calendar, User, Check, XCircle, RotateCcw, Eye, AlertTriangle, Phone, Mail, Star, MessageCircle, ExternalLink, Clock, CheckCircle, PlayCircle, Settings, MapPin, Building, Briefcase, Flag, TrendingUp, AlertCircle, Download, ChevronDown, Square, CheckSquare, Info } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getAuthenticatedFileUrl, getApiBaseUrl, apiCall } from '../api/api';
import TradeProgress from './TradeProgress';

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
  const { isBautraeger } = useAuth();

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
                      
                      <div className="h-96 bg-white/5">
                        {doc.type && doc.type.includes('pdf') ? (
                          <iframe
                            src={getViewerUrl(doc)}
                            className="w-full h-full border-0"
                            title={doc.name || doc.title || doc.file_name || 'Dokument'}
                            onError={() => setViewerError('PDF konnte nicht geladen werden')}
                          />
                        ) : (
                          <iframe
                            src={getViewerUrl(doc)}
                            className="w-full h-full border-0"
                            title={doc.name || doc.title || doc.file_name || 'Dokument'}
                            onError={() => setViewerError('Dokument konnte nicht geladen werden')}
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
  const [completionStatus, setCompletionStatus] = useState(trade?.completion_status || 'in_progress');
  const [acceptanceDefects, setAcceptanceDefects] = useState<any[]>([]);
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
        trade_id: trade.id,
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

  // Dokumente laden - NUR geteilte Dokumente aus shared_document_ids
  const loadTradeDocuments = async (tradeId: number) => {
    if (!tradeId) return;
    
    setDocumentsLoading(true);
    setDocumentsError(null);
    
    try {
      console.log('🔍 SimpleCostEstimateModal - Lade Dokumente für Trade:', tradeId);
      
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Kein Authentifizierungs-Token gefunden');
      }
      
      const baseUrl = process.env.NODE_ENV === 'development' 
        ? 'http://localhost:8000/api/v1' 
        : '/api/v1';
      
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
      
      let documents = [];
      
      // WICHTIG: NUR geteilte Dokumente aus shared_document_ids laden
      console.log('📄 Milestone shared_document_ids Feld:', milestoneData.shared_document_ids);
      console.log('📄 Milestone shared_document_ids Typ:', typeof milestoneData.shared_document_ids);
      
      if (milestoneData.shared_document_ids) {
        try {
          let sharedDocIds = milestoneData.shared_document_ids;
          
          // Verschiedene Parsing-Versuche
          if (typeof sharedDocIds === 'string') {
            // Versuche JSON zu parsen
            try {
              sharedDocIds = JSON.parse(sharedDocIds);
            } catch (e) {
              // Wenn JSON-Parsing fehlschlägt, könnte es ein komma-separierter String sein
              console.log('📄 JSON-Parsing fehlgeschlagen, versuche als komma-separierte Liste:', sharedDocIds);
              sharedDocIds = sharedDocIds.split(',').map(id => id.trim()).filter(id => id);
            }
          }
          
          console.log('📄 Geteilte Dokument-IDs nach Parsing:', sharedDocIds);
          console.log('📄 Ist Array?:', Array.isArray(sharedDocIds));
          
          if (Array.isArray(sharedDocIds) && sharedDocIds.length > 0) {
            // Konvertiere IDs zu Zahlen falls nötig
            const docIds = sharedDocIds.map(id => {
              if (typeof id === 'string') {
                return parseInt(id, 10);
              }
              return id;
            }).filter(id => !isNaN(id) && id > 0);
            
            console.log('📄 Bereinigte Dokument-IDs:', docIds);
            
            // Lade die geteilten Dokumente
            const sharedDocsPromises = docIds.map(async (docId: number) => {
              try {
                console.log(`📄 Lade Dokument mit ID ${docId}...`);
                const docResponse = await fetch(`${baseUrl}/documents/${docId}`, {
                  headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                  },
                });
                
                if (docResponse.ok) {
                  const docData = await docResponse.json();
                  console.log(`✅ Dokument ${docId} geladen:`, docData);
                  return {
                    ...docData,
                    isShared: true,
                    category: 'shared'
                  };
                } else {
                  console.error(`❌ Fehler beim Laden von Dokument ${docId}: HTTP ${docResponse.status}`);
                }
                return null;
              } catch (e) {
                console.error(`❌ Fehler beim Laden des geteilten Dokuments ${docId}:`, e);
                return null;
              }
            });

            const sharedDocs = await Promise.all(sharedDocsPromises);
            const validSharedDocs = sharedDocs.filter(doc => doc !== null);
            
            console.log('📄 SimpleCostEstimateModal - Geteilte Dokumente geladen:', validSharedDocs);
            documents = validSharedDocs;
          }
        } catch (e) {
          console.error('❌ Fehler beim Verarbeiten der geteilten Dokumente:', e);
        }
      }

      console.log('📄 SimpleCostEstimateModal - Finale Dokumentenliste (nur geteilte):', documents);
      setLoadedDocuments(documents);
      
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
      loadAppointmentResponses();
      loadMessages();
      
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

        {/* Zusätzliche Details */}
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
          {acceptedQuote.estimated_duration && (
            <div className="text-center">
              <div className="text-green-300 font-medium">{acceptedQuote.estimated_duration}</div>
              <div className="text-gray-400 text-xs">Tage</div>
            </div>
          )}
          
          {acceptedQuote.warranty_period && (
            <div className="text-center">
              <div className="text-green-300 font-medium">{acceptedQuote.warranty_period}</div>
              <div className="text-gray-400 text-xs">Monate Garantie</div>
            </div>
          )}
          
          {acceptedQuote.start_date && (
            <div className="text-center">
              <div className="text-green-300 font-medium">
                {new Date(acceptedQuote.start_date).toLocaleDateString('de-DE')}
              </div>
              <div className="text-gray-400 text-xs">Startdatum</div>
            </div>
          )}
          
          {acceptedQuote.completion_date && (
            <div className="text-center">
              <div className="text-green-300 font-medium">
                {new Date(acceptedQuote.completion_date).toLocaleDateString('de-DE')}
              </div>
              <div className="text-gray-400 text-xs">Fertigstellung</div>
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
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X size={24} className="text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* Ausschreibungsdetails - Professioneller Header */}
          <div className="bg-gradient-to-br from-[#2c3539]/50 to-[#1a1a2e]/50 rounded-xl border border-gray-600/30 p-6 mb-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Info size={20} className="text-[#ffbd59]" />
              Ausschreibungsdetails
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Linke Spalte */}
              <div className="space-y-4">
                <div>
                  <div className="text-sm text-gray-400 mb-1">Gewerk</div>
                  <div className="text-white font-medium">{trade?.title}</div>
                </div>
                
                <div>
                  <div className="text-sm text-gray-400 mb-1">Beschreibung</div>
                  <div className="text-gray-300 text-sm">{trade?.description || 'Keine Beschreibung verfügbar'}</div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-gray-400 mb-1">Status</div>
                    <div className={`inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium ${
                      trade?.status === 'completed' ? 'bg-green-500/20 text-green-300' :
                      trade?.status === 'in_progress' ? 'bg-yellow-500/20 text-yellow-300' :
                      trade?.status === 'planned' ? 'bg-blue-500/20 text-blue-300' :
                      'bg-gray-500/20 text-gray-300'
                    }`}>
                      {trade?.status === 'completed' ? 'Abgeschlossen' :
                       trade?.status === 'in_progress' ? 'In Bearbeitung' :
                       trade?.status === 'planned' ? 'Geplant' :
                       trade?.status || 'Unbekannt'}
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-sm text-gray-400 mb-1">Priorität</div>
                    <div className={`inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium ${
                      trade?.priority === 'high' ? 'bg-red-500/20 text-red-300' :
                      trade?.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-300' :
                      'bg-green-500/20 text-green-300'
                    }`}>
                      {trade?.priority === 'high' ? 'Hoch' :
                       trade?.priority === 'medium' ? 'Mittel' :
                       'Niedrig'}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Rechte Spalte */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-gray-400 mb-1">Budget</div>
                    <div className="text-white font-medium">
                      {trade?.budget ? `CHF ${Number(trade.budget).toLocaleString('de-DE')}` : 'Nicht festgelegt'}
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-sm text-gray-400 mb-1">Geplantes Datum</div>
                    <div className="text-white">
                      {trade?.planned_date ? new Date(trade.planned_date).toLocaleDateString('de-DE') : 'Nicht festgelegt'}
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-gray-400 mb-1">Startdatum</div>
                    <div className="text-white">
                      {trade?.start_date ? new Date(trade.start_date).toLocaleDateString('de-DE') : 'Nicht festgelegt'}
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-sm text-gray-400 mb-1">Enddatum</div>
                    <div className="text-white">
                      {trade?.end_date ? new Date(trade.end_date).toLocaleDateString('de-DE') : 'Nicht festgelegt'}
                    </div>
                  </div>
                </div>
                
                {trade?.requires_inspection === '1' && (
                  <div className="p-3 bg-purple-500/10 border border-purple-500/30 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Eye size={16} className="text-purple-400" />
                      <span className="text-purple-300 text-sm font-medium">Besichtigung erforderlich</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Comprehensive Trade Header - zeigt alle wichtigen Gewerk-Informationen */}
          {renderTradeHeader()}
          
          {/* Accepted Provider Header - zusätzlich anzeigen wenn Angebot angenommen */}
          {renderAcceptedProviderHeader()}
          
          {/* HAUPTANSICHT: Unterschiedlich je nach Angebotsstatus */}
          {acceptedQuote ? (
            // ANSICHT 1: Nach Annahme eines Angebots
            <div className="space-y-6">
              {/* Accepted Quote Info - vereinfacht da Header bereits Details zeigt */}
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-green-300 mb-3 flex items-center gap-2">
                  <FileText size={20} />
                  Angenommenes Angebot
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <Euro size={16} className="text-green-400" />
                    <span className="text-white font-medium">
                      {acceptedQuote.total_amount?.toLocaleString('de-DE')} {acceptedQuote.currency || 'EUR'}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <User size={16} className="text-blue-400" />
                    <span className="text-gray-300">{acceptedQuote.company_name}</span>
                  </div>
                  
                  {acceptedQuote.estimated_duration && (
                    <div className="flex items-center gap-2">
                      <Calendar size={16} className="text-purple-400" />
                      <span className="text-gray-300">{acceptedQuote.estimated_duration} Tage</span>
                    </div>
                  )}
                </div>
                
                {acceptedQuote.description && (
                  <div className="mt-4">
                    <p className="text-gray-300 text-sm">{acceptedQuote.description}</p>
                  </div>
                )}
              </div>

              {/* Project Info */}
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-blue-300 mb-3">Projekt Information</h3>
                <div className="space-y-2">
                  <p className="text-gray-300"><span className="text-white font-medium">Projekt:</span> {project?.name}</p>
                  <p className="text-gray-300"><span className="text-white font-medium">Gewerk:</span> {trade?.title}</p>
                  <p className="text-gray-300"><span className="text-white font-medium">Status:</span> {trade?.status}</p>
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
                    ) : (
                      <>
                        <Clock size={20} className="text-blue-400" />
                        <div>
                          <h4 className="text-blue-300 font-medium">Gewerk in Bearbeitung</h4>
                          <p className="text-blue-200 text-sm">Das Gewerk kann zur Abnahme freigegeben werden.</p>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Abnahme-Aktionen */}
                <div className="space-y-3">
                  {completionStatus === 'in_progress' && (
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
                        Termin vereinbaren
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
                    <div className="bg-green-500/5 border border-green-500/20 rounded-lg p-3">
                      <div className="flex items-center gap-2 text-green-300">
                        <CheckCircle size={16} />
                        <span className="text-sm font-medium">
                          Gewerk vollständig abgeschlossen - Rechnung kann gestellt werden
                        </span>
                      </div>
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

              {/* Abnahme-Workflow-Bereich */}
              {acceptedQuote && (
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
                      ) : (
                        <>
                          <Clock size={20} className="text-blue-400" />
                          <div>
                            <h4 className="text-blue-300 font-medium">Gewerk in Bearbeitung</h4>
                            <p className="text-blue-200 text-sm">Das Gewerk kann zur Abnahme freigegeben werden.</p>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Abnahme-Aktionen */}
                  <div className="space-y-3">
                    {completionStatus === 'in_progress' && (
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
                          Termin vereinbaren
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
                      <div className="bg-green-500/5 border border-green-500/20 rounded-lg p-3">
                        <div className="flex items-center gap-2 text-green-300">
                          <CheckCircle size={16} />
                          <span className="text-sm font-medium">
                            Gewerk vollständig abgeschlossen - Rechnung kann gestellt werden
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
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

      {/* Finale Abnahme-Modal */}
      {showFinalAcceptanceModal && (
        <FinalAcceptanceModal
          isOpen={showFinalAcceptanceModal}
          onClose={() => setShowFinalAcceptanceModal(false)}
          trade={trade}
          defects={acceptanceDefects}
          onComplete={handleFinalAcceptance}
          loading={loading}
        />
      )}

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
    </div>
  );
}

// Abnahme-Modal-Komponente
interface AcceptanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  trade: any;
  onComplete: (data: any) => void;
  loading: boolean;
}

function AcceptanceModal({ isOpen, onClose, trade, onComplete, loading }: AcceptanceModalProps) {
  const [accepted, setAccepted] = useState(true);
  const [acceptanceNotes, setAcceptanceNotes] = useState('');
  const [defects, setDefects] = useState<any[]>([]);
  const [newDefect, setNewDefect] = useState({ description: '', severity: 'medium', location: '' });

  if (!isOpen) return null;

  const addDefect = () => {
    if (!newDefect.description.trim()) return;
    
    setDefects(prev => [...prev, { ...newDefect, id: Date.now() }]);
    setNewDefect({ description: '', severity: 'medium', location: '' });
  };

  const removeDefect = (id: number) => {
    setDefects(prev => prev.filter(d => d.id !== id));
  };

  const handleSubmit = () => {
    onComplete({
      accepted: accepted && defects.length === 0,
      acceptanceNotes,
      defects,
      inspectorName: 'Bauträger'
    });
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-70 p-4">
      <div className="bg-[#2c3539] rounded-2xl shadow-2xl border border-white/20 max-w-2xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-600/30">
          <h3 className="text-xl font-semibold text-white">Abnahme durchführen</h3>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
            <X size={20} className="text-gray-400" />
          </button>
        </div>
        
        <div className="p-6 max-h-[calc(90vh-140px)] overflow-y-auto space-y-6">
          {/* Gewerk-Info */}
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
            <h4 className="text-blue-300 font-medium mb-2">Gewerk: {trade?.title}</h4>
            <p className="text-gray-300 text-sm">Führen Sie die Abnahme des Gewerks durch und dokumentieren Sie eventuelle Mängel.</p>
          </div>

          {/* Abnahme-Ergebnis */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">Abnahme-Ergebnis</label>
            <div className="space-y-2">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  checked={accepted && defects.length === 0}
                  onChange={() => setAccepted(true)}
                  className="w-4 h-4 text-green-600"
                />
                <span className="text-white">Gewerk ohne Mängel abgenommen</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  checked={!accepted || defects.length > 0}
                  onChange={() => setAccepted(false)}
                  className="w-4 h-4 text-yellow-600"
                />
                <span className="text-white">Abnahme unter Vorbehalt (mit Mängeln)</span>
              </label>
            </div>
          </div>

          {/* Mängel-Dokumentation */}
          <div>
            <h4 className="text-lg font-medium text-white mb-3">Mängel dokumentieren</h4>
            
            {/* Bestehende Mängel */}
            {defects.length > 0 && (
              <div className="mb-4 space-y-2">
                {defects.map((defect) => (
                  <div key={defect.id} className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="text-white font-medium">{defect.description}</p>
                        <div className="flex gap-4 mt-1 text-sm text-gray-400">
                          <span>Schwere: {defect.severity}</span>
                          {defect.location && <span>Ort: {defect.location}</span>}
                        </div>
                      </div>
                      <button
                        onClick={() => removeDefect(defect.id)}
                        className="p-1 hover:bg-red-500/20 rounded transition-colors"
                      >
                        <X size={16} className="text-red-400" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Neuen Mangel hinzufügen */}
            <div className="bg-gray-700/30 rounded-lg p-4 space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Mangel-Beschreibung</label>
                <textarea
                  value={newDefect.description}
                  onChange={(e) => setNewDefect(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Beschreiben Sie den Mangel..."
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                  rows={2}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Schweregrad</label>
                  <select
                    value={newDefect.severity}
                    onChange={(e) => setNewDefect(prev => ({ ...prev, severity: e.target.value }))}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  >
                    <option value="low">Gering</option>
                    <option value="medium">Mittel</option>
                    <option value="high">Hoch</option>
                    <option value="critical">Kritisch</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Ort (optional)</label>
                  <input
                    type="text"
                    value={newDefect.location}
                    onChange={(e) => setNewDefect(prev => ({ ...prev, location: e.target.value }))}
                    placeholder="z.B. Badezimmer, Küche..."
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              <button
                onClick={addDefect}
                disabled={!newDefect.description.trim()}
                className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                Mangel hinzufügen
              </button>
            </div>
          </div>

          {/* Abnahme-Notizen */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Abnahme-Notizen</label>
            <textarea
              value={acceptanceNotes}
              onChange={(e) => setAcceptanceNotes(e.target.value)}
              placeholder="Zusätzliche Notizen zur Abnahme..."
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={3}
            />
          </div>
        </div>
        
        <div className="flex gap-3 p-6 border-t border-gray-600/30">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg font-medium transition-colors"
          >
            Abbrechen
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            {loading ? 'Wird abgeschlossen...' : 'Abnahme abschließen'}
          </button>
        </div>
      </div>
    </div>
  );
}

// Finale Abnahme-Modal-Komponente
interface FinalAcceptanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  trade: any;
  defects: any[];
  onComplete: (accepted: boolean, notes: string) => void;
  loading: boolean;
}

function FinalAcceptanceModal({ isOpen, onClose, trade, defects, onComplete, loading }: FinalAcceptanceModalProps) {
  const [finalAccepted, setFinalAccepted] = useState(true);
  const [finalNotes, setFinalNotes] = useState('');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-70 p-4">
      <div className="bg-[#2c3539] rounded-2xl shadow-2xl border border-white/20 max-w-2xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-600/30">
          <h3 className="text-xl font-semibold text-white">Finale Abnahme</h3>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
            <X size={20} className="text-gray-400" />
          </button>
        </div>
        
        <div className="p-6 max-h-[calc(90vh-140px)] overflow-y-auto space-y-6">
          {/* Info */}
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
            <h4 className="text-yellow-300 font-medium mb-2">Finale Abnahme für: {trade?.title}</h4>
            <p className="text-gray-300 text-sm">
              Prüfen Sie, ob die dokumentierten Mängel behoben wurden und führen Sie die finale Abnahme durch.
            </p>
          </div>

          {/* Dokumentierte Mängel */}
          <div>
            <h4 className="text-lg font-medium text-white mb-3">Ursprünglich dokumentierte Mängel ({defects.length})</h4>
            <div className="space-y-2">
              {defects.map((defect, index) => (
                <div key={index} className="bg-gray-700/30 rounded-lg p-3">
                  <p className="text-white font-medium">{defect.description || defect.title || `Mangel ${index + 1}`}</p>
                  <div className="flex gap-4 mt-1 text-sm text-gray-400">
                    {defect.severity && <span>Schwere: {defect.severity}</span>}
                    {defect.location && <span>Ort: {defect.location}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Finale Bewertung */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">Finale Bewertung</label>
            <div className="space-y-2">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  checked={finalAccepted}
                  onChange={() => setFinalAccepted(true)}
                  className="w-4 h-4 text-green-600"
                />
                <span className="text-white">Alle Mängel behoben - Gewerk vollständig abgenommen</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  checked={!finalAccepted}
                  onChange={() => setFinalAccepted(false)}
                  className="w-4 h-4 text-red-600"
                />
                <span className="text-white">Mängel noch nicht vollständig behoben</span>
              </label>
            </div>
          </div>

          {/* Finale Notizen */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Finale Abnahme-Notizen</label>
            <textarea
              value={finalNotes}
              onChange={(e) => setFinalNotes(e.target.value)}
              placeholder="Notizen zur finalen Abnahme..."
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
              rows={3}
            />
          </div>
        </div>
        
        <div className="flex gap-3 p-6 border-t border-gray-600/30">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg font-medium transition-colors"
          >
            Abbrechen
          </button>
          <button
            onClick={() => onComplete(finalAccepted, finalNotes)}
            disabled={loading}
            className={`flex-1 px-4 py-2 text-white rounded-lg font-medium transition-colors disabled:opacity-50 ${
              finalAccepted 
                ? 'bg-green-600 hover:bg-green-700' 
                : 'bg-yellow-600 hover:bg-yellow-700'
            }`}
          >
            {loading ? 'Wird abgeschlossen...' : finalAccepted ? 'Finale Abnahme' : 'Mit Vorbehalt abschließen'}
          </button>
        </div>
      </div>
    </div>
  );
}
