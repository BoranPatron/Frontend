import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { appointmentService } from '../api/appointmentService';
// import InspectionStatusTracker from './InspectionStatusTracker'; // DEPRECATED: Ersetzt durch AppointmentStatusCard
import AppointmentStatusCard from './AppointmentStatusCard';
import AppointmentResponseTracker from './AppointmentResponseTracker';
import InspectionSentBadge from './InspectionSentBadge';
import TradeProgress from './TradeProgress';
import AcceptanceModal from './AcceptanceModal';
import { 
  X, 
  Calendar, 
  TrendingUp, 
  Shield, 
  FileText, 
  Wrench, 
  Euro, 
  Clock, 
  User, 
  Phone, 
  Mail, 
  Globe,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Info,
  Download,
  Eye,
  Settings,
  Target,
  BarChart3,
  MapPin,
  Tag,
  Star,
  Award,
  File,
  FolderOpen,
  AlertCircle,
  Zap,
  Thermometer,
  Droplets,
  Sun,
  Home,
  TreePine,
  Hammer,
  Ruler,
  Palette,
  Layers,
  Anchor,
  Sprout,
  Check,
  ThumbsDown,
  MessageSquare,
  Send
} from 'lucide-react';

interface CostEstimateDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  trade: any;
  quotes: any[];
  project: any;
  onAcceptQuote: (quoteId: number) => void;
  onRejectQuote: (quoteId: number, reason: string) => void;
  onResetQuote: (quoteId: number) => void;
  onCreateInspection?: (tradeId: number, selectedQuoteIds: number[]) => void;
  onTradeUpdate?: (updatedTrade: any) => void;  // ✅ Callback für Trade-Updates
  inspectionStatus?: {
    hasActiveInspection: boolean;
    appointmentDate?: string;
    isInspectionDay: boolean;
    selectedServiceProviderId?: number;
  };
}

export default function CostEstimateDetailsModal({ 
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
  inspectionStatus: externalInspectionStatus
}: CostEstimateDetailsModalProps) {
  const { user } = useAuth();
  const [selectedQuote, setSelectedQuote] = useState<any>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [inspectionStatus, setInspectionStatus] = useState<{
    hasActiveInspection: boolean;
    appointmentDate?: string;
    isInspectionDay: boolean;
    selectedServiceProviderId?: number;
  }>({ hasActiveInspection: false, isInspectionDay: false });
  const [loading, setLoading] = useState(false);
  const [selectedQuotesForInspection, setSelectedQuotesForInspection] = useState<number[]>([]);
  const [completionStatus, setCompletionStatus] = useState<string>('in_progress');
  const [showAcceptanceModal, setShowAcceptanceModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [proposedDate, setProposedDate] = useState('');
  const [proposedTime, setProposedTime] = useState('');
  const [scheduleNotes, setScheduleNotes] = useState('');

  // Lade Besichtigungstermin-Status wenn Modal geöffnet wird
  useEffect(() => {
    if (isOpen && trade?.id) {
      if (externalInspectionStatus) {
        // Verwende die von außen übergebenen Daten
        setInspectionStatus(externalInspectionStatus);
        console.log('🔍 Verwende externe Besichtigungsstatus für Gewerk', trade.id, ':', externalInspectionStatus);
      } else {
        // Lade die Daten selbst
        loadInspectionStatus();
      }
      
      // Debug: Zeige das komplette trade Objekt
      console.log('🔍 CostEstimate - Komplettes trade Objekt (completion_status):', trade.completion_status);
      
      // WICHTIG: Setze completionStatus SOFORT mit trade.completion_status
      const currentStatus = trade.completion_status || 'in_progress';
      console.log('🔄 CostEstimate - Modal geöffnet für Trade:', trade.id);
      console.log('🔄 CostEstimate - Trade completion_status:', trade.completion_status);
      console.log('🔄 CostEstimate - Setze completionStatus SOFORT auf:', currentStatus);
      setCompletionStatus(currentStatus);
      
      // IMMER den aktuellen completion_status vom Backend laden um sicherzustellen dass er aktuell ist
      // Das ist KRITISCH weil das trade Objekt möglicherweise veraltet ist
      console.log('🔍 CostEstimate - Lade frischen completion_status vom Backend...');
      loadTradeCompletionStatus();
    }
  }, [isOpen, trade?.id, externalInspectionStatus]);

  // Reagiere auf Änderungen des trade.completion_status von außen
  useEffect(() => {
    if (trade?.completion_status && trade.completion_status !== completionStatus) {
      console.log('🔄 CostEstimate - Trade completion_status hat sich geändert:', trade.completion_status);
      setCompletionStatus(trade.completion_status);
    }
  }, [trade?.completion_status]);

  const loadInspectionStatus = async () => {
    try {
      const status = await appointmentService.checkActiveInspectionForTrade(trade.id);
      setInspectionStatus(status);
      console.log('🔍 Besichtigungsstatus für Gewerk', trade.id, ':', status);
    } catch (error) {
      console.error('❌ Fehler beim Laden des Besichtigungsstatus:', error);
    }
  };

  // Terminvereinbarung für Abnahme
  const handleScheduleAcceptance = async () => {
    if (!proposedDate || !proposedTime) {
      alert('Bitte wählen Sie Datum und Uhrzeit für den Abnahme-Termin.');
      return;
    }

    try {
      console.log('📅 Terminvorschlag für Abnahme:', { proposedDate, proposedTime, scheduleNotes });
      
      const proposedDateTime = new Date(`${proposedDate}T${proposedTime}`);
      
      const response = await fetch('/api/v1/acceptance/schedule-appointment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          milestone_id: trade.id,
          proposed_date: proposedDateTime.toISOString(),
          notes: scheduleNotes
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Abnahme-Termin vorgeschlagen:', result);
        
        setShowScheduleModal(false);
        setProposedDate('');
        setProposedTime('');
        setScheduleNotes('');
        
        alert('Abnahme-Termin wurde vorgeschlagen. Der Dienstleister wird benachrichtigt.');
      } else {
        const error = await response.json();
        console.error('❌ Fehler bei Terminvorschlag:', error);
        alert('Fehler beim Vorschlagen des Termins. Bitte versuchen Sie es erneut.');
      }
    } catch (error) {
      console.error('❌ Fehler bei Terminvereinbarung:', error);
      alert('Fehler bei der Terminvereinbarung. Bitte versuchen Sie es erneut.');
    }
  };

  // Sofortige Abnahme starten
  const handleStartAcceptance = () => {
    setShowAcceptanceModal(true);
  };

  // Abnahme abschließen
  const handleCompleteAcceptance = async (acceptanceData: any) => {
    try {
      setLoading(true);
      console.log('🔍 Schließe Abnahme ab:', acceptanceData);

      // Zuerst Abnahme erstellen
      const createResponse = await fetch('/api/v1/acceptance/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          project_id: trade.project_id,
          milestone_id: trade.id,
          service_provider_id: trade.accepted_by,
          acceptance_type: 'FINAL',
          acceptance_notes: acceptanceData.acceptanceNotes,
          contractor_notes: acceptanceData.contractorNotes,
          quality_rating: acceptanceData.qualityRating,
          timeliness_rating: acceptanceData.timelinessRating,
          overall_rating: acceptanceData.overallRating,
          photos: acceptanceData.photos,
          warranty_period_months: 24
        })
      });

      if (!createResponse.ok) {
        throw new Error('Fehler beim Erstellen der Abnahme');
      }

      const acceptance = await createResponse.json();

      // Dann Abnahme abschließen
      const completeResponse = await fetch(`/api/v1/acceptance/${acceptance.id}/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          accepted: acceptanceData.accepted,
          acceptance_notes: acceptanceData.acceptanceNotes,
          contractor_notes: acceptanceData.contractorNotes,
          quality_rating: acceptanceData.qualityRating,
          timeliness_rating: acceptanceData.timelinessRating,
          overall_rating: acceptanceData.overallRating,
          photos: acceptanceData.photos,
          defects: acceptanceData.defects
        })
      });

      if (completeResponse.ok) {
        const result = await completeResponse.json();
        console.log('✅ Abnahme erfolgreich abgeschlossen:', result);
        
        // Update Status
        if (acceptanceData.accepted && acceptanceData.defects.length === 0) {
          setCompletionStatus('completed');
          trade.completion_status = 'completed';
        } else if (acceptanceData.accepted && acceptanceData.defects.length > 0) {
          setCompletionStatus('completed_with_defects');
          trade.completion_status = 'completed_with_defects';
        } else {
          setCompletionStatus('under_review');
          trade.completion_status = 'under_review';
        }
        
        setShowAcceptanceModal(false);
        
        // Lade aktuelle Daten vom Backend
        await loadTradeCompletionStatus();
        
        alert(`Abnahme erfolgreich ${acceptanceData.accepted ? 'abgeschlossen' : 'mit Mängeln dokumentiert'}. PDF-Protokoll wurde erstellt.`);
      } else {
        const error = await completeResponse.json();
        console.error('❌ Fehler beim Abschließen der Abnahme:', error);
        alert('Fehler beim Abschließen der Abnahme. Bitte versuchen Sie es erneut.');
      }
    } catch (error) {
      console.error('❌ Fehler bei Abnahme:', error);
      alert('Fehler bei der Abnahme. Bitte versuchen Sie es erneut.');
    } finally {
      setLoading(false);
    }
  };

  // Lade den aktuellen completion_status vom Backend (KRITISCH für Synchronisation)
  const loadTradeCompletionStatus = async () => {
    if (!trade?.id) {
      console.log('❌ CostEstimate - Kein trade.id vorhanden');
      return;
    }
    
    try {
      console.log('🔍 CostEstimate - Lade aktuellen completion_status vom Backend für Trade:', trade.id);
      
      const token = localStorage.getItem('token');
      console.log('🔍 CostEstimate - Token vorhanden:', !!token);
      
      const response = await fetch(`/api/v1/milestones/${trade.id}/completion-status`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('🔍 CostEstimate - Response Status:', response.status);
      console.log('🔍 CostEstimate - Response Headers:', response.headers);
      
      if (response.ok) {
        try {
          const data = await response.json();
          console.log('✅ CostEstimate - Backend completion_status geladen:', data);
          console.log('🔍 CostEstimate - Vorher completionStatus:', completionStatus);
          console.log('🔍 CostEstimate - Neuer completion_status:', data.completion_status);
          
          // IMMER updaten - auch wenn der Status gleich ist, um sicherzustellen dass UI aktuell ist
          if (data.completion_status) {
            // Update das lokale trade Objekt
            const updatedTrade = {
              ...trade,
              completion_status: data.completion_status,
              progress_percentage: data.progress_percentage || trade.progress_percentage
            };
            
            console.log('🔄 CostEstimate - Setze completionStatus auf:', data.completion_status);
            setCompletionStatus(data.completion_status);
            
            // Informiere die übergeordnete Komponente über das Update
            if (onTradeUpdate) {
              console.log('🔄 CostEstimate - Rufe onTradeUpdate auf mit:', updatedTrade);
              onTradeUpdate(updatedTrade);
            }
            
            // Force re-render mit Timeout um State-Update zu garantieren
            setTimeout(() => {
              console.log('🔄 CostEstimate - Force re-render nach Status-Update');
              setSelectedQuote({...selectedQuote});
            }, 50);
          }
        } catch (jsonError) {
          console.error('❌ CostEstimate - JSON Parse Fehler:', jsonError);
          // Response ist bereits consumed, können nicht nochmal .text() aufrufen
          console.error('❌ CostEstimate - Response konnte nicht als JSON geparst werden');
        }
      } else {
        const errorText = await response.text();
        console.error('❌ CostEstimate - Backend API Fehler:', response.status, errorText);
      }
    } catch (error) {
      console.error('❌ CostEstimate - Backend nicht erreichbar:', error);
    }
  };
  const [showInspectionSelection, setShowInspectionSelection] = useState(false);

  if (!isOpen || !trade) return null;

  // Prüfe ob Besichtigung erforderlich ist
  const requiresInspection = trade.requires_inspection === true || trade.requires_inspection === 'true';
  
  // Filtere eingereichte Angebote für Besichtigung
  // Ursprüngliche Logik: nur submitted/under_review
  const submittedQuotes = quotes.filter(quote => 
    quote.status === 'submitted' || quote.status === 'under_review'
  );

  // Erweiterte Logik: Alle verfügbaren Quotes für Besichtigung (außer draft/rejected)
  const availableQuotesForInspection = quotes.filter(quote => 
    quote.status !== 'draft' && quote.status !== 'rejected' && quote.status !== 'expired'
  );

  // Debug: Zeige alle Status-Werte
  console.log('  - Alle Quote-Status-Details:', quotes.map(q => ({ 
    id: q.id, 
    status: q.status, 
    service_provider: q.service_provider_name || q.service_provider_id 
  })));
  
  // ERWEITERTE DEBUG-AUSGABE: Zeige tatsächliche Array-Inhalte
  console.log('🔍 DETAILLIERTE QUOTE-ANALYSE:');
  quotes.forEach((quote, index) => {
    console.log(`  Quote ${index + 1}:`, {
      id: quote.id,
      status: quote.status,
      statusType: typeof quote.status,
      statusLength: quote.status?.length,
      service_provider: quote.service_provider_name || quote.service_provider_id
    });
  });
  
  // Debug: Zeige Filterlogik im Detail
  console.log('  - Filter submittedQuotes:', quotes.map(q => ({
    id: q.id,
    status: q.status,
    isSubmitted: q.status === 'submitted',
    isUnderReview: q.status === 'under_review',
    passesSubmittedFilter: q.status === 'submitted' || q.status === 'under_review'
  })));
  
  console.log('  - Filter availableQuotes:', quotes.map(q => ({
    id: q.id,
    status: q.status,
    isDraft: q.status === 'draft',
    isRejected: q.status === 'rejected',
    isExpired: q.status === 'expired',
    passesAvailableFilter: q.status !== 'draft' && q.status !== 'rejected' && q.status !== 'expired'
  })));

  // Verwende verfügbare Quotes wenn submittedQuotes leer ist
  const quotesForInspection = submittedQuotes.length > 0 ? submittedQuotes : availableQuotesForInspection;
  
  // TEMPORÄRER FIX: Wenn alle Filter leer sind, verwende alle Quotes
  const finalQuotesForInspection = quotesForInspection.length > 0 ? quotesForInspection : quotes;
  
  console.log('🔧 TEMPORÄRER FIX - finalQuotesForInspection.length:', finalQuotesForInspection.length);

  // Debug-Ausgaben für Besichtigungs-Button-Sichtbarkeit
  console.log('🔍 Debug Besichtigungs-Button-Sichtbarkeit:');
  console.log('  - trade.requires_inspection:', trade.requires_inspection);
  console.log('  - requiresInspection (berechnet):', requiresInspection);
  console.log('  - quotes.length:', quotes.length);
  console.log('  - submittedQuotes.length:', submittedQuotes.length);
  console.log('  - availableQuotesForInspection.length:', availableQuotesForInspection.length);
  console.log('  - quotesForInspection.length:', quotesForInspection.length);
  console.log('  - Button sollte sichtbar sein (alt):', requiresInspection && quotesForInspection.length > 0);
  console.log('  - Button sollte sichtbar sein (neu):', requiresInspection && finalQuotesForInspection.length > 0);

  const handleInspectionQuoteToggle = (quoteId: number) => {
    setSelectedQuotesForInspection(prev => 
      prev.includes(quoteId) 
        ? prev.filter(id => id !== quoteId)
        : [...prev, quoteId]
    );
  };

  const handleCreateInspection = () => {
    if (selectedQuotesForInspection.length === 0) {
      alert('Bitte wählen Sie mindestens ein Angebot für die Besichtigung aus.');
      return;
    }
    
    if (onCreateInspection) {
      onCreateInspection(trade.id, selectedQuotesForInspection);
      setShowInspectionSelection(false);
      setSelectedQuotesForInspection([]);
      onClose();
    }
  };

  const getCategoryIcon = (category: string) => {
    const iconMap: { [key: string]: React.ReactNode } = {
      'elektro': <Zap size={16} className="text-yellow-400" />,
      'sanitaer': <Droplets size={16} className="text-blue-400" />,
      'heizung': <Thermometer size={16} className="text-red-400" />,
      'dach': <Sun size={16} className="text-orange-400" />,
      'fenster_tueren': <Home size={16} className="text-green-400" />,
      'boden': <Layers size={16} className="text-brown-400" />,
      'wand': <Palette size={16} className="text-purple-400" />,
      'fundament': <Anchor size={16} className="text-gray-400" />,
      'garten': <Sprout size={16} className="text-green-400" />,
      'eigene': <Settings size={16} className="text-gray-400" />
    };
    return iconMap[category] || <Wrench size={16} className="text-gray-400" />;
  };

  const getCategoryLabel = (category: string) => {
    const labelMap: { [key: string]: string } = {
      'elektro': 'Elektroinstallation',
      'sanitaer': 'Sanitär',
      'heizung': 'Heizung',
      'dach': 'Dach',
      'fenster_tueren': 'Fenster & Türen',
      'boden': 'Boden',
      'wand': 'Wand',
      'fundament': 'Fundament',
      'garten': 'Garten & Landschaft',
      'eigene': 'Eigene Kategorie'
    };
    return labelMap[category] || category;
  };

  const getQuoteStatusLabel = (status: string) => {
    const statusMap: { [key: string]: string } = {
      'submitted': 'Eingereicht',
      'under_review': 'In Prüfung',
      'accepted': 'Angenommen',
      'rejected': 'Abgelehnt',
      'expired': 'Abgelaufen'
    };
    return statusMap[status] || status;
  };

  const getQuoteStatusColor = (status: string) => {
    const colorMap: { [key: string]: string } = {
      'submitted': 'bg-blue-500/20 border-blue-500/30 text-blue-300',
      'under_review': 'bg-yellow-500/20 border-yellow-500/30 text-yellow-300',
      'accepted': 'bg-green-500/20 border-green-500/30 text-green-300',
      'rejected': 'bg-red-500/20 border-red-500/30 text-red-300',
      'expired': 'bg-gray-500/20 border-gray-500/30 text-gray-300'
    };
    return colorMap[status] || 'bg-gray-500/20 border-gray-500/30 text-gray-300';
  };

  const formatCurrency = (amount: number, currency: string = 'EUR') => {
    return amount.toLocaleString('de-DE', { style: 'currency', currency });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-DE');
  };

  const handleAcceptQuote = async (quote: any) => {
    setLoading(true);
    try {
      await onAcceptQuote(quote.id);
      setSelectedQuote(null);
    } catch (error) {
      console.error('Fehler beim Annehmen des Kostenvoranschlags:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRejectQuote = async (quote: any) => {
    if (!rejectionReason.trim()) {
      alert('Bitte geben Sie einen Ablehnungsgrund an.');
      return;
    }

    setLoading(true);
    try {
      await onRejectQuote(quote.id, rejectionReason);
      setShowRejectModal(false);
      setRejectionReason('');
      setSelectedQuote(null);
    } catch (error) {
      console.error('Fehler beim Ablehnen des Kostenvoranschlags:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResetQuote = async (quote: any) => {
    setLoading(true);
    try {
      await onResetQuote(quote.id);
      setSelectedQuote(null);
    } catch (error) {
      console.error('Fehler beim Zurücksetzen des Kostenvoranschlags:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderQuoteDetails = (quote: any) => {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-white">{quote.title}</h3>
            <p className="text-gray-400">{quote.description}</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-[#ffbd59]">
              {formatCurrency(quote.total_amount, quote.currency)}
            </div>
            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${getQuoteStatusColor(quote.status)}`}>
              {quote.status === 'accepted' && <CheckCircle size={14} />}
              {quote.status === 'rejected' && <XCircle size={14} />}
              {quote.status === 'under_review' && <Clock size={14} />}
              {quote.status === 'submitted' && <Send size={14} />}
              <span>{getQuoteStatusLabel(quote.status)}</span>
            </div>
          </div>
        </div>

        {/* Kostenvoranschlag Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h4 className="font-semibold text-white flex items-center gap-2">
              <Euro size={16} className="text-[#ffbd59]" />
              Kostenaufschlüsselung
            </h4>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                <span className="text-sm text-gray-400">Gesamtbetrag</span>
                <span className="text-lg font-bold text-[#ffbd59]">
                  {formatCurrency(quote.total_amount, quote.currency)}
                </span>
              </div>
              
              {quote.labor_cost && (
                <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                  <span className="text-sm text-gray-400">Arbeitskosten</span>
                  <span className="text-sm font-medium text-white">
                    {formatCurrency(quote.labor_cost, quote.currency)}
                  </span>
                </div>
              )}
              
              {quote.material_cost && (
                <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                  <span className="text-sm text-gray-400">Materialkosten</span>
                  <span className="text-sm font-medium text-white">
                    {formatCurrency(quote.material_cost, quote.currency)}
                  </span>
                </div>
              )}
              
              {quote.overhead_cost && (
                <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                  <span className="text-sm text-gray-400">Gemeinkosten</span>
                  <span className="text-sm font-medium text-white">
                    {formatCurrency(quote.overhead_cost, quote.currency)}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-semibold text-white flex items-center gap-2">
              <Calendar size={16} className="text-[#ffbd59]" />
              Zeitplan & Bedingungen
            </h4>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                <span className="text-sm text-gray-400">Geschätzte Dauer</span>
                <span className="text-sm font-medium text-white">{quote.estimated_duration} Tage</span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                <span className="text-sm text-gray-400">Startdatum</span>
                <span className="text-sm font-medium text-white">{formatDate(quote.start_date)}</span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                <span className="text-sm text-gray-400">Fertigstellungsdatum</span>
                <span className="text-sm font-medium text-white">{formatDate(quote.completion_date)}</span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                <span className="text-sm text-gray-400">Gültig bis</span>
                <span className="text-sm font-medium text-white">{formatDate(quote.valid_until)}</span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                <span className="text-sm text-gray-400">Garantie</span>
                <span className="text-sm font-medium text-white">{quote.warranty_period} Monate</span>
              </div>
              
              {quote.payment_terms && (
                <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                  <span className="text-sm text-gray-400">Zahlungsbedingungen</span>
                  <span className="text-sm font-medium text-white">{quote.payment_terms}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Dienstleister Informationen */}
        <div className="space-y-4">
          <h4 className="font-semibold text-white flex items-center gap-2">
            <User size={16} className="text-[#ffbd59]" />
            Dienstleister Informationen
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              {quote.company_name && (
                <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                  <span className="text-sm text-gray-400">Firma</span>
                  <span className="text-sm font-medium text-white">{quote.company_name}</span>
                </div>
              )}
              
              {quote.contact_person && (
                <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                  <span className="text-sm text-gray-400">Ansprechpartner</span>
                  <span className="text-sm font-medium text-white">{quote.contact_person}</span>
                </div>
              )}
            </div>
            
            <div className="space-y-3">
              {quote.phone && (
                <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                  <span className="text-sm text-gray-400">Telefon</span>
                  <span className="text-sm font-medium text-white">{quote.phone}</span>
                </div>
              )}
              
              {quote.email && (
                <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                  <span className="text-sm text-gray-400">E-Mail</span>
                  <span className="text-sm font-medium text-white">{quote.email}</span>
                </div>
              )}
              
              {quote.website && (
                <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                  <span className="text-sm text-gray-400">Website</span>
                  <span className="text-sm font-medium text-white">{quote.website}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Risiko & Qualität */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h4 className="font-semibold text-white flex items-center gap-2">
              <AlertTriangle size={16} className="text-[#ffbd59]" />
              Risiko-Bewertung
            </h4>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                <span className="text-sm text-gray-400">Risiko-Score</span>
                <span className={`text-sm font-medium ${
                  quote.risk_score > 30 ? 'text-red-400' : 
                  quote.risk_score > 15 ? 'text-yellow-400' : 'text-green-400'
                }`}>
                  {quote.risk_score}%
                </span>
              </div>
              
              {quote.price_deviation && (
                <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                  <span className="text-sm text-gray-400">Preisabweichung</span>
                  <span className={`text-sm font-medium ${
                    quote.price_deviation > 20 ? 'text-red-400' : 
                    quote.price_deviation > 10 ? 'text-yellow-400' : 'text-green-400'
                  }`}>
                    {quote.price_deviation}%
                  </span>
                </div>
              )}
              
              {quote.ai_recommendation && (
                <div className="p-3 bg-white/5 rounded-lg">
                  <span className="text-sm text-gray-400">KI-Empfehlung</span>
                  <div className="text-sm text-white mt-1">{quote.ai_recommendation}</div>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-semibold text-white flex items-center gap-2">
              <Star size={16} className="text-[#ffbd59]" />
              Qualität & Bewertung
            </h4>
            
            <div className="space-y-3">
              {quote.rating && (
                <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                  <span className="text-sm text-gray-400">Bewertung</span>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        size={14}
                        className={star <= quote.rating ? 'text-yellow-400 fill-current' : 'text-gray-400'}
                      />
                    ))}
                    <span className="text-sm text-white ml-1">({quote.rating}/5)</span>
                  </div>
                </div>
              )}
              
              {quote.feedback && (
                <div className="p-3 bg-white/5 rounded-lg">
                  <span className="text-sm text-gray-400">Feedback</span>
                  <div className="text-sm text-white mt-1">{quote.feedback}</div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Aktions-Buttons */}
        <div className="flex items-center justify-center gap-4 pt-6 border-t border-white/10">
          {/* Buttons für alle Benutzer mit submitted, draft oder under_review Status */}
          {(quote.status === 'submitted' || quote.status === 'draft' || quote.status === 'under_review') && (
            <>
              {/* Prüfe ob Button ausgegraut werden soll */}
              {(() => {
                const shouldDisableAccept = inspectionStatus.hasActiveInspection && 
                                          !inspectionStatus.isInspectionDay && 
                                          !inspectionStatus.selectedServiceProviderId;
                
                // DEBUG: Detaillierte Ausgabe der Bedingungen
                console.log('🔍 DEBUG: Button-Deaktivierung für Gewerk', trade.id, ':', {
                  inspectionStatus,
                  hasActiveInspection: inspectionStatus.hasActiveInspection,
                  isInspectionDay: inspectionStatus.isInspectionDay,
                  selectedServiceProviderId: inspectionStatus.selectedServiceProviderId,
                  shouldDisableAccept
                });
                
                return (
                  <button
                    onClick={() => handleAcceptQuote(quote)}
                    disabled={loading || shouldDisableAccept}
                    className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all duration-300 transform shadow-lg ${
                      shouldDisableAccept 
                        ? 'bg-gray-400 text-gray-600 cursor-not-allowed opacity-50' 
                        : 'bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed'
                    }`}
                    title={shouldDisableAccept ? 'Annahme erst nach dem Besichtigungstermin möglich' : ''}
                  >
                    {loading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      <CheckCircle size={16} />
                    )}
                    Kostenvoranschlag annehmen
                  </button>
                );
              })()}
              
              <button
                onClick={() => setShowRejectModal(true)}
                disabled={loading}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl font-semibold hover:from-red-600 hover:to-red-700 transition-all duration-300 transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <XCircle size={16} />
                Kostenvoranschlag ablehnen
              </button>
            </>
          )}

          {/* Informationsmeldung wenn Annahme wegen Besichtigungstermin blockiert ist */}
          {inspectionStatus.hasActiveInspection && !inspectionStatus.isInspectionDay && !inspectionStatus.selectedServiceProviderId && (
            <div className="w-full p-4 bg-orange-500/10 border border-orange-500/20 rounded-lg">
              <div className="flex items-center gap-2 text-orange-300 mb-2">
                <Calendar size={16} />
                <span className="font-medium">Besichtigungstermin geplant</span>
              </div>
              <p className="text-sm text-orange-200">
                Die Annahme von Kostenvoranschlägen ist bis zum Besichtigungstermin am{' '}
                {inspectionStatus.appointmentDate && 
                  new Date(inspectionStatus.appointmentDate).toLocaleDateString('de-DE', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric'
                  })
                } gesperrt.
              </p>
            </div>
          )}
          
          {/* Reset-Button für alle Benutzer */}
          {quote.status === 'accepted' && (
            <button
              onClick={() => handleResetQuote(quote)}
              disabled={loading}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-yellow-500 to-yellow-600 text-white rounded-xl font-semibold hover:from-yellow-600 hover:to-yellow-700 transition-all duration-300 transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <AlertTriangle size={16} />
              )}
              Kostenvoranschlag zurücksetzen
            </button>
          )}
          
          {/* Ablehnungsgrund anzeigen */}
          {quote.status === 'rejected' && quote.rejection_reason && (
            <div className="w-full p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
              <div className="flex items-center gap-2 text-red-300 mb-2">
                <XCircle size={16} />
                <span className="font-medium">Ablehnungsgrund</span>
              </div>
              <p className="text-sm text-red-200">{quote.rejection_reason}</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-[#2c3539] rounded-2xl shadow-2xl border border-white/20 max-w-6xl w-full max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-[#ffbd59] to-[#ffa726] rounded-xl">
                <FileText size={24} className="text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Kostenvoranschlag Details</h2>
                <p className="text-sm text-gray-400">{trade.title}</p>
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
          <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
            <div className="p-6">
              {selectedQuote ? (
                renderQuoteDetails(selectedQuote)
              ) : (
                <div className="space-y-6">
                  {/* Gewerk Informationen */}
                  <div className="bg-white/5 rounded-lg p-4">
                    <div className="flex items-center gap-3 mb-4">
                      {getCategoryIcon(trade.category || '')}
                      <div className="flex-1">
                        <h3 className="font-semibold text-white">{trade.title}</h3>
                        <p className="text-sm text-gray-400">{trade.description}</p>
                        
                        {/* Inspection Sent Badge */}
                        <div className="mt-2">
                          <InspectionSentBadge 
                            inspectionSent={trade.inspection_sent || false}
                            inspectionSentAt={trade.inspection_sent_at}
                            appointmentCount={1} // TODO: Aus Appointments laden
                            pendingResponses={0} // TODO: Aus Appointment Responses berechnen
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-400">Kategorie:</span>
                        <div className="text-white">{getCategoryLabel(trade.category || '')}</div>
                      </div>
                      <div>
                        <span className="text-gray-400">Status:</span>
                        <div className="text-white">{trade.status}</div>
                      </div>
                      <div>
                        <span className="text-gray-400">Priorität:</span>
                        <div className="text-white">{trade.priority}</div>
                      </div>
                      <div>
                        <span className="text-gray-400">Geplant:</span>
                        <div className="text-white">{formatDate(trade.planned_date)}</div>
                      </div>
                    </div>
                  </div>

                  {/* Debug-Anzeige für Besichtigungs-Button */}
                  <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mb-4">
                    <h4 className="text-sm font-semibold text-blue-400 mb-2">🔍 Debug: Besichtigung erstellen Button</h4>
                    <div className="text-xs text-gray-300 space-y-1">
                      <div>requires_inspection: <span className="text-yellow-400">{String(trade.requires_inspection)}</span></div>
                      <div>requiresInspection (berechnet): <span className="text-yellow-400">{String(requiresInspection)}</span></div>
                      <div>Anzahl Quotes: <span className="text-yellow-400">{quotes.length}</span></div>
                      <div>Anzahl submittedQuotes: <span className="text-yellow-400">{submittedQuotes.length}</span></div>
                      <div>Anzahl availableQuotesForInspection: <span className="text-yellow-400">{availableQuotesForInspection.length}</span></div>
                      <div>Anzahl quotesForInspection: <span className="text-yellow-400">{quotesForInspection.length}</span></div>
                      <div>Anzahl finalQuotesForInspection: <span className="text-yellow-400">{finalQuotesForInspection.length}</span></div>
                      <div>Quote-Status: <span className="text-yellow-400">{quotes.map(q => `${q.id}:${q.status}`).join(', ')}</span></div>
                      <div>Button sichtbar (original): <span className="text-yellow-400">{String(requiresInspection && submittedQuotes.length > 0)}</span></div>
                      <div>Button sichtbar (berechnet): <span className="text-yellow-400">{String(requiresInspection && quotesForInspection.length > 0)}</span></div>
                      <div>Button sichtbar (FINAL): <span className="text-yellow-400">{String(requiresInspection && finalQuotesForInspection.length > 0)}</span></div>
                    </div>
                  </div>

                  {/* Besichtigungs-Bereich - Zeige wenn requiresInspection true ist und Quotes verfügbar */}
                  {requiresInspection && finalQuotesForInspection.length > 0 && (
                    <div className="bg-gradient-to-r from-[#ffbd59]/10 to-[#ffa726]/10 border border-[#ffbd59]/30 rounded-lg p-4 mb-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-gradient-to-br from-[#ffbd59] to-[#ffa726] rounded-lg">
                            <Eye size={20} className="text-white" />
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-white">Besichtigung erforderlich</h3>
                            <p className="text-sm text-gray-300">
                              Dieses Gewerk erfordert eine Vor-Ort-Besichtigung. Wählen Sie Angebote für die Einladung aus.
                            </p>
                          </div>
                        </div>
                        
                        {!showInspectionSelection && (
                          <button
                            onClick={() => setShowInspectionSelection(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#ffbd59] to-[#ffa726] text-white rounded-lg font-semibold hover:from-[#ffa726] hover:to-[#ff9800] transition-all duration-300 transform hover:scale-105 shadow-lg"
                          >
                            <Calendar size={16} />
                            Besichtigung erstellen
                          </button>
                        )}
                      </div>
                      
                      {showInspectionSelection && (
                        <div className="space-y-4">
                          <div className="bg-white/5 rounded-lg p-4">
                            <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
                              <CheckCircle size={16} className="text-[#ffbd59]" />
                              Angebote für Besichtigung auswählen
                            </h4>
                            
                            <div className="space-y-2">
                              {quotes.map((quote: any) => (
                                <div 
                                  key={quote.id}
                                  className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${
                                    selectedQuotesForInspection.includes(quote.id)
                                      ? 'bg-[#ffbd59]/20 border border-[#ffbd59]/40'
                                      : 'bg-white/5 border border-white/10 hover:bg-white/10'
                                  }`}
                                  onClick={() => handleInspectionQuoteToggle(quote.id)}
                                >
                                  <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                                    selectedQuotesForInspection.includes(quote.id)
                                      ? 'bg-[#ffbd59] border-[#ffbd59]'
                                      : 'border-gray-400'
                                  }`}>
                                    {selectedQuotesForInspection.includes(quote.id) && (
                                      <Check size={12} className="text-white" />
                                    )}
                                  </div>
                                  
                                  <div className="flex-1">
                                    <div className="flex items-center justify-between">
                                      <span className="text-white font-medium">{quote.title}</span>
                                      <span className="text-[#ffbd59] font-bold">
                                        {formatCurrency(quote.total_amount, quote.currency)}
                                      </span>
                                    </div>
                                    <div className="text-sm text-gray-400">
                                      {quote.company_name} • {quote.estimated_duration} Tage
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                            
                            <div className="flex items-center justify-end gap-3 mt-4 pt-4 border-t border-white/10">
                              <button
                                onClick={() => {
                                  setShowInspectionSelection(false);
                                  setSelectedQuotesForInspection([]);
                                }}
                                className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                              >
                                Abbrechen
                              </button>
                              <button
                                onClick={handleCreateInspection}
                                disabled={selectedQuotesForInspection.length === 0}
                                className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-[#ffbd59] to-[#ffa726] text-white rounded-lg font-semibold hover:from-[#ffa726] hover:to-[#ff9800] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <Calendar size={16} />
                                Besichtigung planen ({selectedQuotesForInspection.length} Angebote)
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Appointment Status Cards - nur für Bauträger */}
                  {project && user?.user_role === 'BAUTRAEGER' && (
                    <AppointmentStatusCard 
                      projectId={project.id} 
                      milestoneId={trade.id}
                      onDecisionMade={(decision) => {
                        console.log('Entscheidung getroffen:', decision);
                        // Hier können Sie weitere Aktionen ausführen
                      }}
                    />
                  )}

                  {/* Appointment Response Tracker - zeigt Antworten aller Dienstleister */}
                  {project && user?.user_role === 'BAUTRAEGER' && (
                    <>
                      {console.log('🔍 [MODAL-DEBUG] Rendering AppointmentResponseTracker:', {
                        projectId: project.id,
                        milestoneId: trade.id,
                        tradeTitle: trade.title,
                        userRole: user?.user_role
                      })}
                      <AppointmentResponseTracker
                        projectId={project.id}
                        milestoneId={trade.id}
                        className="mt-6"
                      />
                    </>
                  )}

                  {/* Kostenvoranschläge Liste */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                      <FileText size={20} className="text-[#ffbd59]" />
                      Verfügbare Kostenvoranschläge ({quotes.length})
                    </h3>
                    
                    {quotes.length === 0 ? (
                      <div className="text-center py-8 text-gray-400">
                        <FileText size={32} className="mx-auto mb-2 opacity-50" />
                        <p>Keine Kostenvoranschläge vorhanden</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {quotes.map((quote: any) => (
                          <div 
                            key={quote.id} 
                            className="p-4 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-colors"
                          >
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <div className={`w-3 h-3 rounded-full ${
                                  quote.status === 'accepted' ? 'bg-green-500' :
                                  quote.status === 'rejected' ? 'bg-red-500' :
                                  quote.status === 'under_review' ? 'bg-yellow-500' :
                                  'bg-blue-500'
                                }`}></div>
                                <span className="text-sm font-medium text-white">{quote.title}</span>
                              </div>
                              <span className="text-lg font-bold text-[#ffbd59]">
                                {formatCurrency(quote.total_amount, quote.currency)}
                              </span>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-3 text-xs">
                              <div>
                                <span className="text-gray-400">Firma:</span>
                                <div className="text-white">{quote.company_name || '—'}</div>
                              </div>
                              <div>
                                <span className="text-gray-400">Dauer:</span>
                                <div className="text-white">{quote.estimated_duration} Tage</div>
                              </div>
                              <div>
                                <span className="text-gray-400">Status:</span>
                                <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${getQuoteStatusColor(quote.status)}`}>
                                  {getQuoteStatusLabel(quote.status)}
                                </div>
                              </div>
                              <div>
                                <span className="text-gray-400">Gültig bis:</span>
                                <div className="text-white">{formatDate(quote.valid_until)}</div>
                              </div>
                            </div>
                            
                            <div className="mt-3 flex items-center justify-between">
                              <button 
                                onClick={() => setSelectedQuote(quote)}
                                className="text-sm text-[#ffbd59] hover:text-[#ffa726] transition-colors"
                              >
                                Details anzeigen →
                              </button>
                              
                              {/* Aktions-Buttons für jeden Kostenvoranschlag */}
                              <div className="flex items-center gap-2">
                                {/* Buttons für alle Benutzer mit submitted, draft oder under_review Status */}
                                {(quote.status === 'submitted' || quote.status === 'draft' || quote.status === 'under_review') && (
                                  <>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleAcceptQuote(quote);
                                      }}
                                      disabled={loading}
                                      className="flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg text-xs font-medium hover:from-green-600 hover:to-green-700 transition-all duration-200 transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                      {loading ? (
                                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                                      ) : (
                                        <CheckCircle size={12} />
                                      )}
                                      Annehmen
                                    </button>
                                    
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedQuote(quote);
                                        setShowRejectModal(true);
                                      }}
                                      disabled={loading}
                                      className="flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg text-xs font-medium hover:from-red-600 hover:to-red-700 transition-all duration-200 transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                      <XCircle size={12} />
                                      Ablehnen
                                    </button>
                                  </>
                                )}
                                
                                {/* Reset-Button für alle Benutzer */}
                                {quote.status === 'accepted' && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleResetQuote(quote);
                                    }}
                                    disabled={loading}
                                    className="flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-yellow-500 to-yellow-600 text-white rounded-lg text-xs font-medium hover:from-yellow-600 hover:to-yellow-700 transition-all duration-200 transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                    {loading ? (
                                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                                    ) : (
                                      <AlertTriangle size={12} />
                                    )}
                                    Zurücksetzen
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* DEPRECATED: InspectionStatusTracker ersetzt durch AppointmentStatusCard */}
                  </div>
                </div>
              )}

              {/* Baufortschritt & Kommunikation */}
              {trade && (
                <TradeProgress
                  milestoneId={trade.id}
                  currentProgress={trade.progress_percentage || 0}
                  onProgressChange={(progress) => {
                    // Update progress in trade object
                    trade.progress_percentage = progress;
                  }}
                  isBautraeger={user?.user_type === 'bautraeger' || user?.user_type === 'developer' || user?.user_type === 'PRIVATE' || user?.user_type === 'PROFESSIONAL' || user?.user_type === 'private' || user?.user_type === 'professional'}
                  isServiceProvider={user?.user_type === 'service_provider' || user?.user_type === 'SERVICE_PROVIDER'}
                  completionStatus={completionStatus}
                  onCompletionRequest={async () => {
                    try {
                      console.log('🔍 CostEstimate - Sende Abnahme-Anfrage für Trade:', trade.id);
                      
                      const response = await fetch(`/api/v1/milestones/${trade.id}/progress/completion`, {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                          'Authorization': `Bearer ${localStorage.getItem('token')}`
                        },
                        body: JSON.stringify({
                          message: 'Gewerk fertiggestellt. Bitte um Abnahme.',
                          update_type: 'completion'
                        })
                      });
                      
                      if (response.ok) {
                        console.log('✅ CostEstimate - Abnahme-Anfrage erfolgreich');
                        trade.completion_status = 'completion_requested';
                        setCompletionStatus('completion_requested');
                        
                        // Lade aktuelle Daten vom Backend
                        await loadTradeCompletionStatus();
                        
                        // Force re-render
                        setSelectedQuote({...selectedQuote});
                      } else {
                        throw new Error('API-Fehler');
                      }
                    } catch (error) {
                      console.error('❌ CostEstimate - Fehler bei Fertigstellungsmeldung:', error);
                      alert('Fehler beim Anfordern der Abnahme. Bitte versuchen Sie es erneut.');
                    }
                  }}
                  onCompletionResponse={async (accepted: boolean, message?: string, deadline?: string) => {
                    try {
                      console.log('🔍 CostEstimate - Sende Abnahme-Antwort für Trade:', trade.id, {
                        accepted,
                        message,
                        deadline
                      });
                      
                      const response = await fetch(`/api/v1/milestones/${trade.id}/progress/completion/response`, {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                          'Authorization': `Bearer ${localStorage.getItem('token')}`
                        },
                        body: JSON.stringify({
                          accepted,
                          message: message || (accepted ? 'Gewerk abgenommen.' : 'Nachbesserung erforderlich.'),
                          revision_deadline: deadline
                        })
                      });
                      
                      if (response.ok) {
                        console.log('✅ CostEstimate - Abnahme-Antwort erfolgreich');
                        const newStatus = accepted ? 'completed' : 'under_review';
                        trade.completion_status = newStatus;
                        setCompletionStatus(newStatus);
                        
                        // Lade aktuelle Daten vom Backend
                        await loadTradeCompletionStatus();
                        
                        // Force re-render
                        setSelectedQuote({...selectedQuote});
                      } else {
                        throw new Error('API-Fehler');
                      }
                    } catch (error) {
                      console.error('❌ CostEstimate - Fehler bei Abnahme-Antwort:', error);
                      alert('Fehler beim Verarbeiten der Abnahme-Antwort. Bitte versuchen Sie es erneut.');
                    }
                  }}
                />
              )}



              {/* Abnahme-Workflow für Bauträger in CostEstimate */}
              {trade && (user?.user_type === 'bautraeger' || user?.user_type === 'developer' || user?.user_type === 'PRIVATE' || user?.user_type === 'PROFESSIONAL' || user?.user_type === 'private' || user?.user_type === 'professional') && (
                <div className="bg-gradient-to-br from-[#1a1a2e]/50 to-[#2c3539]/50 rounded-xl p-6 border border-gray-600/30 mt-6">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <CheckCircle size={18} className="text-[#ffbd59]" />
                    Abnahme-Workflow
                  </h3>
                  
                  {(!completionStatus || completionStatus === 'in_progress') && (
                    <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Clock size={20} className="text-blue-400" />
                        <span className="text-blue-300 font-medium">Arbeiten in Bearbeitung</span>
                      </div>
                      <p className="text-blue-200 text-sm">
                        Das Gewerk ist aktuell zu {trade.progress_percentage || 0}% fertiggestellt. Warten Sie auf die Fertigstellungsmeldung des Dienstleisters.
                      </p>
                    </div>
                  )}
                  
                  {completionStatus === 'completion_requested' && (
                    <div className="space-y-4">
                      <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <AlertTriangle size={20} className="text-yellow-400" />
                          <span className="text-yellow-300 font-medium">Abnahme angefordert</span>
                        </div>
                        <p className="text-yellow-200 text-sm mb-3">
                          Der Dienstleister hat das Gewerk als fertiggestellt gemeldet. Bitte prüfen Sie die Arbeiten vor Ort.
                        </p>
                        <div className="bg-yellow-500/20 rounded-lg p-3 text-sm text-yellow-100">
                          <strong>Prüfschritte:</strong>
                          <ul className="list-disc list-inside mt-2 space-y-1">
                            <li>Vollständigkeit der Arbeiten kontrollieren</li>
                            <li>Qualität und Ausführung bewerten</li>
                            <li>Übereinstimmung mit Spezifikationen prüfen</li>
                            <li>Sicherheits- und Normenkonformität kontrollieren</li>
                          </ul>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <button
                          onClick={handleStartAcceptance}
                          className="flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold rounded-lg hover:shadow-lg transition-all duration-200"
                        >
                          <CheckCircle size={20} />
                          Abnahme starten
                        </button>
                        <button
                          onClick={() => setShowScheduleModal(true)}
                          className="flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white font-semibold rounded-lg hover:shadow-lg transition-all duration-200"
                        >
                          <Calendar size={20} />
                          Termin vereinbaren
                        </button>
                        <button
                          onClick={async () => {
                            const message = prompt('Begründung für Nachbesserung (erforderlich):');
                            if (message && message.trim()) {
                              const deadline = prompt('Frist für Nachbesserung (YYYY-MM-DD, optional):');
                              try {
                                const response = await fetch(`/api/v1/milestones/${trade.id}/progress/completion/response`, {
                                  method: 'POST',
                                  headers: {
                                    'Content-Type': 'application/json',
                                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                                  },
                                  body: JSON.stringify({
                                    accepted: false,
                                    message: message.trim(),
                                    revision_deadline: deadline || undefined
                                  })
                                });
                                
                                if (response.ok) {
                                  trade.completion_status = 'under_review';
                                  setCompletionStatus('under_review');
                                  
                                  // Lade aktuelle Daten vom Backend
                                  await loadTradeCompletionStatus();
                                  
                                  // Force re-render
                                  setSelectedQuote({...selectedQuote});
                                }
                              } catch (error) {
                                console.error('Fehler bei Nachbesserung:', error);
                              }
                            } else if (message !== null) {
                              alert('Bitte geben Sie eine Begründung für die Nachbesserung an.');
                            }
                          }}
                          className="flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold rounded-lg hover:shadow-lg transition-all duration-200"
                        >
                          <AlertTriangle size={20} />
                          Nachbesserung anfordern
                        </button>
                      </div>
                      
                      <div className="mt-4 p-3 bg-gray-600/20 rounded-lg">
                        <p className="text-gray-300 text-sm">
                          <strong>Hinweis:</strong> Nach der Abnahme wird das Gewerk archiviert und der Dienstleister kann eine Rechnung stellen.
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {completionStatus === 'under_review' && (
                    <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle size={20} className="text-orange-400" />
                        <span className="text-orange-300 font-medium">Nachbesserung angefordert</span>
                      </div>
                      <p className="text-orange-200 text-sm">
                        Sie haben Nachbesserungen angefordert. Der Dienstleister wird die erforderlichen Arbeiten ausführen und erneut um Abnahme bitten.
                      </p>
                    </div>
                  )}
                  
                  {completionStatus === 'completed' && (
                    <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle size={20} className="text-green-400" />
                        <span className="text-green-300 font-medium">Gewerk abgenommen</span>
                      </div>
                      <p className="text-green-200 text-sm">
                        Das Gewerk wurde erfolgreich abgenommen und ist archiviert. Der Dienstleister kann nun eine Rechnung stellen.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Terminvereinbarungs-Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-60 p-4">
          <div className="bg-[#2c3539] rounded-2xl shadow-2xl border border-white/20 max-w-md w-full">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Calendar size={20} className="text-purple-400" />
                Abnahme-Termin vereinbaren
              </h3>
              
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
                    className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
                    className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Zusätzliche Notizen
                  </label>
                  <textarea
                    value={scheduleNotes}
                    onChange={(e) => setScheduleNotes(e.target.value)}
                    placeholder="Besondere Hinweise zum Termin..."
                    className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    rows={3}
                  />
                </div>
                
                <div className="bg-purple-500/10 rounded-lg p-3">
                  <p className="text-purple-200 text-sm">
                    <strong>Hinweis:</strong> Der Dienstleister wird über Ihren Terminvorschlag benachrichtigt und kann diesen annehmen oder einen Gegenvorschlag machen.
                  </p>
                </div>
                
                <div className="flex items-center justify-end gap-3">
                  <button
                    onClick={() => {
                      setShowScheduleModal(false);
                      setProposedDate('');
                      setProposedTime('');
                      setScheduleNotes('');
                    }}
                    className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                  >
                    Abbrechen
                  </button>
                  <button
                    onClick={handleScheduleAcceptance}
                    disabled={!proposedDate || !proposedTime}
                    className="px-6 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Termin vorschlagen
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Ablehnungs-Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-60 p-4">
          <div className="bg-[#2c3539] rounded-2xl shadow-2xl border border-white/20 max-w-md w-full">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Kostenvoranschlag ablehnen</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Ablehnungsgrund *
                  </label>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Bitte geben Sie einen Grund für die Ablehnung an..."
                    className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent"
                    rows={4}
                  />
                </div>
                
                <div className="flex items-center justify-end gap-3">
                  <button
                    onClick={() => {
                      setShowRejectModal(false);
                      setRejectionReason('');
                    }}
                    className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                  >
                    Abbrechen
                  </button>
                  <button
                    onClick={() => handleRejectQuote(selectedQuote)}
                    disabled={loading || !rejectionReason.trim()}
                    className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Ablehnen...' : 'Ablehnen'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Abnahme-Modal */}
      <AcceptanceModal
        isOpen={showAcceptanceModal}
        onClose={() => setShowAcceptanceModal(false)}
        trade={trade}
        onComplete={handleCompleteAcceptance}
      />
    </>
  );
} 