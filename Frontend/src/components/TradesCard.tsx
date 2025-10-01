import React, { useState, useEffect } from 'react';
import { Wrench, User, Euro, BarChart3, Calendar, Tag, CheckCircle, XCircle, AlertTriangle, Eye, FileText, ChevronDown, ChevronUp, Clock, Users, Trophy, Sparkles, MessageCircle, Edit, Trash2, MoreHorizontal, StickyNote } from 'lucide-react';
import { updateMilestone, deleteMilestone } from '../api/milestoneService';
import { useNavigate } from 'react-router-dom';
import { getQuotesForMilestone } from '../api/quoteService';
import { TRADE_CATEGORIES } from '../constants/tradeCategories';

interface Trade {
  id: number;
  title: string;
  description: string;
  status: 'planned' | 'in_progress' | 'completed' | 'delayed' | 'cancelled';
  contractor?: string;
  start_date?: string;
  end_date?: string;
  budget?: number;
  actual_costs?: number;
  progress_percentage: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
  category?: string;
  notes?: string;
  planned_date?: string;
  requires_inspection?: boolean;
  created_at: string;
  updated_at: string;
}

interface QuoteData {
  id: number;
  title: string;
  total_amount: number;
  currency: string;
  status: string;
  created_at: string;
  valid_until: string;
  company_name: string;
  contact_person: string;
  description: string;
  labor_cost?: number;
  material_cost?: number;
  overhead_cost?: number;
  estimated_duration?: number;
  warranty_period?: number;
  payment_terms?: string;
  rejection_reason?: string;
}

interface TradesCardProps {
  trades: Trade[];
  projectId?: number;
  isExpanded: boolean;
  onToggle: () => void;
  onAcceptQuote?: (quoteId: number) => void;
  onRejectQuote?: (quoteId: number, reason: string) => void;
  onResetQuote?: (quoteId: number) => void;
  onEditTrade?: (tradeId: number) => void;
  onDeleteTrade?: (tradeId: number) => void;
  onTradeClick?: (trade: Trade) => void;
  tradeAppointments?: { [tradeId: number]: any[] };
}

interface TradeStats {
  totalQuotes: number;
  acceptedQuote?: QuoteData;
  pendingQuotes: number;
  rejectedQuotes: number;
}

export default function TradesCard({ 
  trades, 
  projectId, 
  isExpanded, 
  onToggle,
  onAcceptQuote,
  onRejectQuote,
  onResetQuote,
  onEditTrade,
  onDeleteTrade,
  onTradeClick,
  tradeAppointments = {}
}: TradesCardProps) {
  const navigate = useNavigate();
  const [showAll, setShowAll] = useState(false);
  const [quoteData, setQuoteData] = useState<{ [tradeId: number]: QuoteData | null }>({});
  const [quoteStatus, setQuoteStatus] = useState<{ [tradeId: number]: string }>({});
  const [loading, setLoading] = useState<{ [tradeId: number]: boolean }>({});
  const [showRejectModal, setShowRejectModal] = useState<{ [tradeId: number]: boolean }>({});
  const [rejectionReason, setRejectionReason] = useState<{ [tradeId: number]: string }>({});
  const [showDetails, setShowDetails] = useState<{ [tradeId: number]: boolean }>({});
  const [tradeStats, setTradeStats] = useState<{ [tradeId: number]: TradeStats }>({});
  const [showTradeActions, setShowTradeActions] = useState<{ [tradeId: number]: boolean }>({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<{ [tradeId: number]: boolean }>({});
  const [editingTrade, setEditingTrade] = useState<Trade | null>(null);
  const [editForm, setEditForm] = useState<{ title: string; description: string; category: string; priority: string; planned_date: string; notes: string; requires_inspection: boolean }>({ title: '', description: '', category: '', priority: 'medium', planned_date: '', notes: '', requires_inspection: false });
  const [isUpdatingTrade, setIsUpdatingTrade] = useState(false);
  const [updatedTrades, setUpdatedTrades] = useState<{ [id: number]: Partial<Trade> }>({});

  console.log('🔍 TradesCard Props:', { trades, projectId, isExpanded, tradesLength: trades.length });

  useEffect(() => {
    if (isExpanded && trades.length > 0) {
      trades.forEach(trade => {
        checkQuoteStatus(trade.id);
        loadTradeStats(trade.id);
      });
    }
  }, [isExpanded, trades]);

  // Schließe Dropdown-Menüs beim Klicken außerhalb
  useEffect(() => {
    const handleClickOutside = () => {
      setShowTradeActions({});
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const checkQuoteStatus = async (tradeId: number) => {
    try {
      setLoading(prev => ({ ...prev, [tradeId]: true }));
      
      // Robuste Token-Validierung und -Wiederherstellung
      const token = await getValidToken();
      if (!token) {
        console.log('❌ Kein gültiger Token verfügbar');
        setQuoteStatus(prev => ({ ...prev, [tradeId]: 'unknown' }));
        return;
      }

      console.log(`🔍 Prüfe Quote-Status für Gewerk ${tradeId}...`);
      
      // Robuste API-Prüfung mit mehreren Fallback-Optionen
      const quoteData = await findUserQuote(tradeId, token);
      
      if (quoteData) {
        console.log(`✅ Angebot gefunden: Status = ${quoteData.status}`);
        setQuoteStatus(prev => ({ ...prev, [tradeId]: quoteData.status || 'submitted' }));
        setQuoteData(prev => ({ ...prev, [tradeId]: quoteData }));
      } else {
        console.log('❌ Kein Angebot gefunden');
        setQuoteStatus(prev => ({ ...prev, [tradeId]: 'none' }));
        setQuoteData(prev => ({ ...prev, [tradeId]: null }));
      }
    } catch (error) {
      console.error('❌ Fehler beim Prüfen des Quote-Status:', error);
      setQuoteStatus(prev => ({ ...prev, [tradeId]: 'unknown' }));
      setQuoteData(prev => ({ ...prev, [tradeId]: null }));
    } finally {
      setLoading(prev => ({ ...prev, [tradeId]: false }));
    }
  };

  // Robuste Token-Validierung und -Wiederherstellung
  const getValidToken = async (): Promise<string | null> => {
    // Versuche 1: Token aus localStorage
    let token = localStorage.getItem('accessToken');
    console.log(`🔍 Token aus localStorage: ${token ? token.substring(0, 10) + '...' : 'Nicht gefunden'}`);
    
    if (token && token.length > 10) {
      // Token-Validität prüfen
      const isValid = await validateToken(token);
      if (isValid) {
        console.log('✅ Token ist gültig');
        return token;
      } else {
        console.log('❌ Token ist ungültig, versuche Token-Refresh');
      }
    }

    // Versuche 2: Token-Refresh
    try {
      console.log('🔄 Versuche Token-Refresh...');
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        const newToken = await refreshAccessToken(refreshToken);
        if (newToken) {
          console.log('✅ Token erfolgreich erneuert');
          return newToken;
        }
      }
    } catch (error) {
      console.log('❌ Token-Refresh fehlgeschlagen:', error);
    }

    console.log('❌ Kein gültiger Token verfügbar');
    return null;
  };

  // Token-Validität prüfen
  const validateToken = async (token: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/v1/auth/verify', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      return response.ok;
    } catch (error) {
      console.log('❌ Token-Validierung fehlgeschlagen:', error);
      return false;
    }
  };

  // Token-Refresh
  const refreshAccessToken = async (refreshToken: string): Promise<string | null> => {
    try {
      const response = await fetch('/api/v1/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ refresh_token: refreshToken })
      });

      if (response.ok) {
        const data = await response.json();
        const newToken = data.access_token;
        if (newToken) {
          localStorage.setItem('accessToken', newToken);
          return newToken;
        }
      }
      return null;
    } catch (error) {
      console.log('❌ Token-Refresh fehlgeschlagen:', error);
      return null;
    }
  };

  // Robuste Quote-Suche mit mehreren API-Endpoints und Response-Validierung
  const findUserQuote = async (tradeId: number, token: string): Promise<any> => {
    const endpoints = [
      // Endpoint 1: Check-user-quote (primär)
      {
        url: `/api/v1/quotes/milestone/${tradeId}/check-user-quote`,
        name: 'check-user-quote'
      },
      // Endpoint 2: Quotes mit milestone_id Filter
      {
        url: `/api/v1/quotes?milestone_id=${tradeId}`,
        name: 'quotes-by-milestone'
      },
      // Endpoint 3: Alle Quotes des Users
      {
        url: '/api/v1/quotes',
        name: 'all-user-quotes'
      },
      // Endpoint 4: Quotes mit trade_id Filter
      {
        url: `/api/v1/quotes?trade_id=${tradeId}`,
        name: 'quotes-by-trade'
      },
      // Endpoint 5: Quotes mit milestone Filter
      {
        url: `/api/v1/quotes?milestone=${tradeId}`,
        name: 'quotes-by-milestone-alt'
      }
    ];

    for (const endpoint of endpoints) {
      try {
        console.log(`🔄 Teste Endpoint: ${endpoint.name}`);
        
        const response = await fetch(endpoint.url, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        console.log(`📡 ${endpoint.name} Status: ${response.status}`);

        if (response.ok) {
          // Robuste Response-Validierung
          let data;
          try {
            const responseText = await response.text();
            console.log(`📄 ${endpoint.name} Raw Response:`, responseText);
            
            if (!responseText || responseText.trim() === '') {
              console.log(`⚠️ ${endpoint.name}: Leere Response`);
              continue;
            }
            
            data = JSON.parse(responseText);
            console.log(`📊 ${endpoint.name} Parsed Response:`, data);
          } catch (parseError) {
            console.log(`❌ ${endpoint.name} JSON Parse Error:`, parseError);
            continue;
          }

          // Endpoint 1: check-user-quote
          if (endpoint.name === 'check-user-quote') {
            if (data && data.has_quote && data.quote) {
              console.log(`✅ Angebot über ${endpoint.name} gefunden`);
              return data.quote;
            }
          }
          
          // Endpoint 2-5: Array-basierte Endpoints
          else if (Array.isArray(data)) {
            const userQuote = data.find((quote: any) => {
              // Verschiedene mögliche Feldnamen für trade/milestone ID
              return quote && (
                quote.milestone_id === tradeId || 
                quote.trade_id === tradeId || 
                quote.milestone === tradeId ||
                quote.trade === tradeId
              );
            });
            
            if (userQuote) {
              console.log(`✅ Angebot über ${endpoint.name} gefunden:`, userQuote);
              return userQuote;
            }
          }
          
          // Endpoint mit direktem Quote-Objekt
          else if (data && data.id && (data.milestone_id === tradeId || data.trade_id === tradeId)) {
            console.log(`✅ Angebot über ${endpoint.name} gefunden:`, data);
            return data;
          }
        } else {
          console.log(`❌ ${endpoint.name} Error: ${response.status} ${response.statusText}`);
        }
      } catch (error) {
        console.log(`❌ ${endpoint.name} Exception:`, error);
      }
    }

    console.log('❌ Kein Angebot in allen Endpoints gefunden');
    return null;
  };

  // Neue Funktion zum Laden der Gewerk-Statistiken
  const loadTradeStats = async (tradeId: number) => {
    try {
      console.log(`🔍 Lade Trade-Statistiken für Gewerk ${tradeId}...`);
      
      // Versuche zuerst die normale API
      let allQuotes;
      try {
        allQuotes = await getQuotesForMilestone(tradeId);
        console.log(`📊 Gefundene Angebote für Gewerk ${tradeId}:`, allQuotes);
      } catch (apiError) {
        console.log(`⚠️ API-Fehler, verwende Fallback für Gewerk ${tradeId}:`, apiError);
        // Fallback: Verwende die vorhandenen Quote-Daten
        const currentQuote = quoteData[tradeId];
        allQuotes = currentQuote ? [currentQuote] : [];
      }
      
      const acceptedQuote = allQuotes.find((q: QuoteData) => q.status === 'accepted');
      console.log(`✅ Angenommenes Angebot für Gewerk ${tradeId}:`, acceptedQuote);
      
      const stats: TradeStats = {
        totalQuotes: allQuotes.length,
        acceptedQuote: acceptedQuote,
        pendingQuotes: allQuotes.filter((q: QuoteData) => q.status === 'submitted' || q.status === 'under_review').length,
        rejectedQuotes: allQuotes.filter((q: QuoteData) => q.status === 'rejected').length
      };
      
      console.log(`📈 Trade-Statistiken für Gewerk ${tradeId}:`, stats);
      setTradeStats(prev => ({ ...prev, [tradeId]: stats }));
    } catch (error) {
      console.error(`❌ Fehler beim Laden der Trade-Statistiken für Gewerk ${tradeId}:`, error);
      // Setze Default-Statistiken bei Fehlern
      const defaultStats: TradeStats = {
        totalQuotes: 0,
        acceptedQuote: null,
        pendingQuotes: 0,
        rejectedQuotes: 0
      };
      setTradeStats(prev => ({ ...prev, [tradeId]: defaultStats }));
    }
  };

  const handleAcceptQuote = async (tradeId: number) => {
    if (!onAcceptQuote) return;
    
    const quote = quoteData[tradeId];
    if (!quote) return;

    try {
      await onAcceptQuote(quote.id);
      // Status aktualisieren
      setQuoteStatus(prev => ({ ...prev, [tradeId]: 'accepted' }));
      // Gewerk-Statistiken neu laden
      await loadTradeStats(tradeId);
      console.log(`✅ Angebot für Gewerk ${tradeId} erfolgreich angenommen`);
    } catch (error) {
      console.error('❌ Fehler beim Annehmen des Angebots:', error);
    }
  };

  const handleRejectQuote = async (tradeId: number) => {
    if (!onRejectQuote) return;
    
    const quote = quoteData[tradeId];
    if (!quote) return;

    const reason = rejectionReason[tradeId] || '';
    if (!reason.trim()) {
      alert('Bitte geben Sie einen Ablehnungsgrund an.');
      return;
    }

    try {
      await onRejectQuote(quote.id, reason);
      // Status aktualisieren
      setQuoteStatus(prev => ({ ...prev, [tradeId]: 'rejected' }));
      setShowRejectModal(prev => ({ ...prev, [tradeId]: false }));
      setRejectionReason(prev => ({ ...prev, [tradeId]: '' }));
      // Gewerk-Statistiken neu laden
      await loadTradeStats(tradeId);
      console.log(`✅ Angebot für Gewerk ${tradeId} erfolgreich abgelehnt`);
    } catch (error) {
      console.error('❌ Fehler beim Ablehnen des Angebots:', error);
    }
  };

  const handleResetQuote = async (tradeId: number) => {
    if (!onResetQuote) return;
    
    const quote = quoteData[tradeId];
    if (!quote) return;

    try {
      await onResetQuote(quote.id);
      // Status aktualisieren
      setQuoteStatus(prev => ({ ...prev, [tradeId]: 'submitted' }));
      // Gewerk-Statistiken neu laden
      await loadTradeStats(tradeId);
      console.log(`✅ Angebot für Gewerk ${tradeId} erfolgreich zurückgesetzt`);
    } catch (error) {
      console.error('❌ Fehler beim Zurücksetzen des Angebots:', error);
    }
  };

  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'none':
        return {
          icon: <FileText size={14} className="text-gray-400" />,
          text: 'Kein Angebot',
          color: 'text-gray-400',
          bgColor: 'bg-gray-500/10',
          borderColor: 'border-gray-500/20',
          dotColor: 'bg-gray-400'
        };
      case 'submitted':
        return {
          icon: <Clock size={14} className="text-blue-400" />,
          text: 'Eingereicht',
          color: 'text-blue-400',
          bgColor: 'bg-blue-500/10',
          borderColor: 'border-blue-500/20',
          dotColor: 'bg-blue-400'
        };
      case 'accepted':
        return {
          icon: <CheckCircle size={14} className="text-green-400" />,
          text: 'Angenommen',
          color: 'text-green-400',
          bgColor: 'bg-green-500/10',
          borderColor: 'border-green-500/20',
          dotColor: 'bg-green-400'
        };
      case 'rejected':
        return {
          icon: <XCircle size={14} className="text-red-400" />,
          text: 'Abgelehnt',
          color: 'text-red-400',
          bgColor: 'bg-red-500/10',
          borderColor: 'border-red-500/20',
          dotColor: 'bg-red-400'
        };
      default:
        return {
          icon: <AlertTriangle size={14} className="text-yellow-400" />,
          text: 'Unbekannt',
          color: 'text-yellow-400',
          bgColor: 'bg-yellow-500/10',
          borderColor: 'border-yellow-500/20',
          dotColor: 'bg-yellow-400'
        };
    }
  };

  const formatCurrency = (amount: number, currency: string = 'EUR') => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  const getTradeStatusLabel = (status: string) => {
    switch (status) {
      case 'planned': return 'Geplant';
      case 'in_progress': return 'In Bearbeitung';
      case 'completed': return 'Abgeschlossen';
      case 'delayed': return 'Verzögert';
      case 'cancelled': return 'Abgebrochen';
      default: return status;
    }
  };

  const getTradeStatusColor = (status: string) => {
    switch (status) {
      case 'planned': return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'in_progress': return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      case 'completed': return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'delayed': return 'bg-orange-500/20 text-orange-300 border-orange-500/30';
      case 'cancelled': return 'bg-red-500/20 text-red-300 border-red-500/30';
      default: return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'medium': return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      case 'high': return 'bg-orange-500/20 text-orange-300 border-orange-500/30';
      case 'critical': return 'bg-red-500/20 text-red-300 border-red-500/30';
      default: return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'low': return 'Niedrig';
      case 'medium': return 'Mittel';
      case 'high': return 'Hoch';
      case 'critical': return 'Kritisch';
      default: return priority;
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'electrical': return 'Elektro';
      case 'plumbing': return 'Sanitär';
      case 'heating': return 'Heizung';
      case 'flooring': return 'Bodenbelag';
      case 'painting': return 'Malerei';
      case 'carpentry': return 'Zimmerei';
      case 'roofing': return 'Dachdeckerei';
      case 'landscaping': return 'Garten- & Landschaftsbau';
      case 'civil_engineering': return 'Tiefbau';
      case 'structural': return 'Hochbau';
      case 'interior': return 'Innenausbau / Interior';
      case 'facade': return 'Fassade';
      case 'windows_doors': return 'Fenster & Türen';
      case 'drywall': return 'Trockenbau';
      case 'tiling': return 'Fliesenarbeiten';
      case 'insulation': return 'Dämmung';
      case 'hvac': return 'Klima / Lüftung (HVAC)';
      case 'smart_home': return 'Smart Home';
      case 'site_preparation': return 'Erdarbeiten / Baustellenvorbereitung';
      case 'other': return 'Sonstiges';
      default: return category;
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('de-DE');
  };

  // Prüft, ob ein Gewerk bearbeitet/gelöscht werden kann (keine Angebote erhalten)
  const canEditOrDeleteTrade = (tradeId: number) => {
    const stats = tradeStats[tradeId];
    const hasQuotes = stats && stats.totalQuotes > 0;
    return !hasQuotes;
  };

  const openEditModal = (trade: Trade) => {
    setEditingTrade(trade);
    setEditForm({
      title: trade.title || '',
      description: trade.description || '',
      category: trade.category || '',
      priority: trade.priority || 'medium',
      planned_date: trade.planned_date || '',
      notes: trade.notes || '',
      requires_inspection: (trade as any).requires_inspection || false,
    });
  };

  const handleUpdateTrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTrade) return;
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
      await updateMilestone(editingTrade.id, payload);
      setUpdatedTrades(prev => ({ ...prev, [editingTrade.id]: { ...payload } }));
      setEditingTrade(null);
    } catch (error) {
      console.error('❌ Fehler beim Aktualisieren des Gewerks:', error);
      alert('Fehler beim Aktualisieren des Gewerks');
    } finally {
      setIsUpdatingTrade(false);
    }
  };

  const handleEditTrade = (tradeId: number) => {
    const trade = trades.find(t => t.id === tradeId);
    if (!trade) return;
    if (canEditOrDeleteTrade(tradeId)) {
      openEditModal(trade);
    }
  };

  const handleDeleteTrade = async (tradeId: number) => {
    if (!canEditOrDeleteTrade(tradeId)) {
      alert('Gewerk kann nicht gelöscht werden, da bereits Angebote vorliegen');
      return;
    }

    try {
      await deleteMilestone(tradeId);
      
      // Entferne das Gewerk aus der lokalen Liste über den Parent-Callback
      if (onDeleteTrade) {
        onDeleteTrade(tradeId);
      }
      
      setShowDeleteConfirm(prev => ({ ...prev, [tradeId]: false }));
      alert('Ausschreibung wurde erfolgreich gelöscht');
    } catch (error) {
      console.error('❌ Fehler beim Löschen des Gewerks:', error);
      alert('Fehler beim Löschen der Ausschreibung');
    }
  };

  return (
    <div className="w-full">
      {/* Header entfernt - wird jetzt vom übergeordneten Dashboard verwaltet */}
      
      {isExpanded && (
        <div className="space-y-3 flex flex-col">
          {trades.length === 0 ? (
            <div className="text-center py-8">
              <Wrench size={48} className="text-gray-400 mx-auto mb-4" />
              <p className="text-gray-400 text-sm mb-4">Keine Gewerke für dieses Projekt vorhanden</p>
              <p className="text-gray-500 text-xs mb-1">Erstellen Sie ein neues Gewerk in den Projekt-Details.</p>
              {projectId && (
                <button
                  onClick={() => navigate(`/project/${projectId}`)}
                  className="px-4 py-2 bg-[#ffbd59] text-[#3d4952] rounded-lg font-semibold hover:bg-[#ffa726] transition-colors"
                >
                  Zu den Projekt-Details
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3 flex flex-col auto-rows-max">
              {(showAll ? trades : trades.slice(0, 5)).map((trade) => {
                const currentQuoteStatus = quoteStatus[trade.id] || 'unknown';
                const currentQuoteData = quoteData[trade.id];
                const isLoading = loading[trade.id] || false;
                const statusInfo = getStatusDisplay(currentQuoteStatus);
                const showDetailsForTrade = showDetails[trade.id] || false;
                const tradeStatsForTrade = tradeStats[trade.id];
                const overridden = updatedTrades[trade.id] || {};
                const effectiveTrade = { ...trade, ...overridden } as Trade;

                return (
                  <div
                    key={trade.id}
                    className={`bg-white/10 rounded-lg p-4 cursor-pointer hover:bg-white/20 transition-all duration-300 h-auto min-h-fit flex-shrink-0 ${
                      (tradeStatsForTrade?.acceptedQuote || currentQuoteStatus === 'accepted') 
                        ? 'border-2 border-green-500/40 bg-gradient-to-r from-green-500/5 to-emerald-500/5 shadow-lg shadow-green-500/10' 
                        : 'border border-white/10'
                    }`}
                    role="button"
                    onClick={() => onTradeClick && onTradeClick(trade)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-[#ffbd59]/20 rounded-lg">
                          <Wrench size={16} className="text-[#ffbd59]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-white font-medium text-sm truncate">{effectiveTrade.title}</h4>
                          {(effectiveTrade.description || effectiveTrade.notes) && (
                            <p className="text-gray-400 text-xs mt-1 line-clamp-2">
                              {effectiveTrade.description || effectiveTrade.notes || 'Keine Details verfügbar'}
                            </p>
                          )}
                          
                          {/* Angebots-Statistiken */}
                          {(() => {
                            console.log(`🔍 Rendering Trade ${trade.id}:`, {
                              tradeStats: tradeStatsForTrade,
                              hasAcceptedQuote: !!tradeStatsForTrade?.acceptedQuote,
                              acceptedQuote: tradeStatsForTrade?.acceptedQuote
                            });
                            return null;
                          })()}
                          {tradeStatsForTrade && (
                            <div className="mt-2 flex items-center gap-3">
                              {/* Anzahl der Angebote */}
                              <div 
                                className="flex items-center gap-1 cursor-pointer hover:text-[#ffbd59] transition-colors group"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setShowDetails(prev => ({ ...prev, [trade.id]: true }));
                                }}
                              >
                                <Users size={14} className="text-[#ffbd59] group-hover:text-[#ffa726]" />
                                <span className="text-xs text-gray-300 group-hover:text-[#ffbd59]">
                                  {tradeStatsForTrade?.totalQuotes || 0} {(tradeStatsForTrade?.totalQuotes === 1) ? 'Angebot' : 'Angebote'}
                                </span>
                              </div>
                              
                              {/* Besichtigungstermin Badge */}
                              {tradeAppointments[trade.id] && tradeAppointments[trade.id].length > 0 && (
                                <div className="relative group">
                                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-blue-600/30 via-cyan-500/30 to-blue-600/30 border border-blue-400/40 rounded-full cursor-pointer transform transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-blue-500/20">
                                    <div className="flex items-center gap-1.5">
                                      <Calendar size={12} className="text-blue-300" />
                                      <span className="text-xs font-semibold text-blue-200">
                                        🗓️ Besichtigung
                                      </span>
                                    </div>
                                    
                                    {/* Termin-Indikator */}
                                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-400 rounded-full border-2 border-white/20 animate-pulse"></div>
                                  </div>
                                  
                                  {/* Tooltip */}
                                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-3 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none z-[100]">
                                    <div className="bg-gradient-to-b from-gray-900 to-gray-800 text-white text-xs rounded-xl py-3 px-4 shadow-2xl border border-gray-600/50 backdrop-blur-sm min-w-[200px]">
                                      <div className="flex items-center gap-2 mb-2">
                                        <Calendar size={14} className="text-blue-400" />
                                        <div className="font-bold text-blue-300">Besichtigungstermin</div>
                                      </div>
                                      <div className="text-gray-300">
                                        {tradeAppointments[trade.id][0]?.scheduled_date ? 
                                          new Date(tradeAppointments[trade.id][0].scheduled_date).toLocaleDateString('de-DE', {
                                            day: '2-digit',
                                            month: '2-digit',
                                            year: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                          }) : 'Termin geplant'
                                        }
                                      </div>
                                    </div>
                                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1 border-4 border-transparent border-t-gray-900"></div>
                                  </div>
                                </div>
                              )}

                              {/* Angenommenes Angebot Badge - Best Practice Design */}
                              {(tradeStatsForTrade?.acceptedQuote || currentQuoteStatus === 'accepted') && (
                                <div className="relative group">
                                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-green-600/30 via-emerald-500/30 to-green-600/30 border border-green-400/40 rounded-full cursor-pointer transform transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-green-500/20 animate-pulse-slow hover:animate-none">
                                    <div className="flex items-center gap-1.5">
                                      <Trophy size={12} className="text-green-300" />
                                      <span className="text-xs font-semibold text-green-200">
                                        ✓ Angenommen
                                      </span>
                                      <Sparkles size={10} className="text-yellow-300 animate-sparkle" />
                                    </div>
                                    
                                    {/* Erfolgs-Indikator */}
                                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white/20 animate-ping"></div>
                                  </div>
                                  
                                  {/* Erweiterter Tooltip mit Best Practice Design */}
                                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-3 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none z-[100]">
                                    <div className="bg-gradient-to-b from-gray-900 to-gray-800 text-white text-xs rounded-xl py-3 px-4 shadow-2xl border border-gray-600/50 backdrop-blur-sm min-w-[280px]">
                                      <div className="flex items-center gap-2 mb-2">
                                        <Trophy size={14} className="text-green-400" />
                                        <div className="font-bold text-green-300">Angenommenes Angebot</div>
                                        <div className="flex-1"></div>
                                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                                      </div>
                                      
                                      <div className="space-y-2">
                                        <div className="flex justify-between items-center">
                                          <span className="text-gray-300">Dienstleister:</span>
                                          <span className="text-white font-medium">
                                            {tradeStatsForTrade?.acceptedQuote?.company_name || currentQuoteData?.company_name || 'Unbekannt'}
                                          </span>
                                        </div>
                                        
                                        <div className="flex justify-between items-center">
                                          <span className="text-gray-300">Betrag:</span>
                                          <span className="text-green-300 font-bold">
                                            {formatCurrency((tradeStatsForTrade?.acceptedQuote || currentQuoteData)?.total_amount || 0, (tradeStatsForTrade?.acceptedQuote || currentQuoteData)?.currency || 'EUR')}
                                          </span>
                                        </div>
                                        
                                        <div className="flex justify-between items-center">
                                          <span className="text-gray-300">Angenommen:</span>
                                          <span className="text-white">
                                            {formatDate((tradeStatsForTrade?.acceptedQuote || currentQuoteData)?.created_at || '')}
                                          </span>
                                        </div>
                                        
                                        {(tradeStatsForTrade?.acceptedQuote || currentQuoteData)?.warranty_period && (
                                          <div className="flex justify-between items-center">
                                            <span className="text-gray-300">Garantie:</span>
                                            <span className="text-white">
                                              {(tradeStatsForTrade?.acceptedQuote || currentQuoteData)?.warranty_period} Monate
                                            </span>
                                          </div>
                                        )}
                                      </div>
                                      
                                      {/* Status-Bar */}
                                      <div className="mt-3 pt-2 border-t border-gray-600/50">
                                        <div className="flex items-center gap-2">
                                          <div className="flex-1 bg-gray-700 rounded-full h-1.5">
                                            <div className="bg-gradient-to-r from-green-400 to-green-500 h-1.5 rounded-full" style={{ width: '100%' }}></div>
                                          </div>
                                          <span className="text-xs text-green-300 font-medium">100% Abgeschlossen</span>
                                        </div>
                                      </div>
                                      
                                      {/* Pfeil */}
                                      <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full">
                                        <div className="w-0 h-0 border-l-6 border-r-6 border-t-6 border-l-transparent border-r-transparent border-t-gray-900"></div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                                            )}

                              {/* Fertigstellungsstatus Badge - nur wenn tatsächlich fertiggestellt markiert */}
                              {(tradeStatsForTrade?.acceptedQuote || currentQuoteStatus === 'accepted') && (() => {
                                // Verwende nur den tatsächlichen completion_status aus den Daten
                                const actualCompletionStatus = (trade as any).completion_status;
                                
                                if (actualCompletionStatus && actualCompletionStatus !== 'in_progress') {
                                  return (
                                    <div className="relative group">
                                      <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full cursor-pointer transform transition-all duration-300 hover:scale-105 shadow-lg border ${
                                        actualCompletionStatus === 'completed' 
                                          ? 'bg-gradient-to-r from-green-600/40 via-emerald-500/40 to-green-600/40 border-green-400/50 hover:shadow-green-500/30'
                                          : actualCompletionStatus === 'completed_with_defects'
                                          ? 'bg-gradient-to-r from-yellow-600/40 via-amber-500/40 to-yellow-600/40 border-yellow-400/50 hover:shadow-yellow-500/30'
                                          : actualCompletionStatus === 'completion_requested'
                                          ? 'bg-gradient-to-r from-orange-600/40 via-orange-500/40 to-orange-600/40 border-orange-400/50 hover:shadow-orange-500/30 animate-pulse'
                                          : 'bg-gradient-to-r from-gray-600/40 via-gray-500/40 to-gray-600/40 border-gray-400/50 hover:shadow-gray-500/30'
                                      }`}>
                                        <div className="flex items-center gap-1.5">
                                          {actualCompletionStatus === 'completion_requested' ? (
                                            <>
                                              <Clock size={12} className="text-orange-200" />
                                              <span className="text-xs font-semibold text-orange-200">
                                                🔄 Als fertiggestellt markiert
                                              </span>
                                            </>
                                          ) : actualCompletionStatus === 'completed' ? (
                                            <>
                                              <CheckCircle size={12} className="text-green-200" />
                                              <span className="text-xs font-semibold text-green-200">
                                                ✅ Abgeschlossen
                                              </span>
                                            </>
                                          ) : actualCompletionStatus === 'completed_with_defects' ? (
                                            <>
                                              <AlertTriangle size={12} className="text-yellow-200" />
                                              <span className="text-xs font-semibold text-yellow-200">
                                                ⚠️ Unter Vorbehalt
                                              </span>
                                            </>
                                          ) : (
                                            <span className="text-xs font-semibold text-gray-200">{actualCompletionStatus}</span>
                                          )}
                                        </div>
                                        
                                        {/* Status-Indikator */}
                                        <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-white/20 ${
                                          actualCompletionStatus === 'completion_requested' ? 'bg-orange-400 animate-ping' :
                                          actualCompletionStatus === 'completed' ? 'bg-green-400' :
                                          actualCompletionStatus === 'completed_with_defects' ? 'bg-yellow-400' :
                                          'bg-gray-400'
                                        }`}></div>
                                      </div>
                                      
                                      {/* Tooltip */}
                                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-3 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none z-[100]">
                                        <div className="bg-gradient-to-b from-gray-900 to-gray-800 text-white text-xs rounded-xl py-3 px-4 shadow-2xl border border-gray-600/50 backdrop-blur-sm min-w-[200px]">
                                          <div className="flex items-center gap-2 mb-2">
                                            {actualCompletionStatus === 'completion_requested' ? (
                                              <>
                                                <Clock size={14} className="text-orange-400" />
                                                <div className="font-bold text-orange-300">Als fertiggestellt markiert</div>
                                              </>
                                            ) : actualCompletionStatus === 'completed' ? (
                                              <>
                                                <CheckCircle size={14} className="text-green-400" />
                                                <div className="font-bold text-green-300">Projekt abgeschlossen</div>
                                              </>
                                            ) : actualCompletionStatus === 'completed_with_defects' ? (
                                              <>
                                                <AlertTriangle size={14} className="text-yellow-400" />
                                                <div className="font-bold text-yellow-300">Abgeschlossen unter Vorbehalt</div>
                                              </>
                                            ) : (
                                              <div className="font-bold text-gray-300">Status: {actualCompletionStatus}</div>
                                            )}
                                          </div>
                                          <div className="text-gray-300 text-xs">
                                            {actualCompletionStatus === 'completion_requested' 
                                              ? 'Der Dienstleister hat das Projekt als fertiggestellt markiert und wartet auf Ihre Bestätigung.'
                                              : actualCompletionStatus === 'completed'
                                              ? 'Das Projekt wurde erfolgreich abgeschlossen und abgenommen.'
                                              : actualCompletionStatus === 'completed_with_defects'
                                              ? 'Das Projekt wurde unter Vorbehalt abgenommen. Mängel wurden dokumentiert.'
                                              : 'Fertigstellungsstatus des Projekts.'
                                            }
                                          </div>
                                        </div>
                                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1 border-4 border-transparent border-t-gray-900"></div>
                                      </div>
                                    </div>
                                  );
                                }
                                return null;
                              })()}

                              {/* Offene Angebote mit verbessertem Design */}
                              {!tradeStatsForTrade?.acceptedQuote && (tradeStatsForTrade?.pendingQuotes || 0) > 0 && (
                                <div className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-500/20 border border-blue-500/30 rounded-full hover:bg-blue-500/30 transition-colors">
                                  <Clock size={12} className="text-blue-400" />
                                  <span className="text-xs text-blue-300 font-medium">
                                    {tradeStatsForTrade?.pendingQuotes || 0} offen
                                  </span>
                                </div>
                              )}
                              
                              {/* Abgelehnte Angebote */}
                              {(tradeStatsForTrade?.rejectedQuotes || 0) > 0 && (
                                <div className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-500/20 border border-red-500/30 rounded-full">
                                  <XCircle size={12} className="text-red-400" />
                                  <span className="text-xs text-red-300 font-medium">
                                    {tradeStatsForTrade?.rejectedQuotes || 0} abgelehnt
                                  </span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Aktionen */}
                      <div className="flex flex-col gap-1 items-end">
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(effectiveTrade.priority)}`}>
                            {getPriorityLabel(effectiveTrade.priority)}
                          </span>
                          {/* Bearbeiten/Löschen Aktionen */}
                          <div className="flex items-center gap-2">
                            {/* Bearbeiten-Button: erlaubt nur wenn keine Angebote vorhanden */}
                            {(() => {
                              const hasAnyQuote = (tradeStatsForTrade?.totalQuotes || 0) > 0;
                              const hasAccepted = !!tradeStatsForTrade?.acceptedQuote || currentQuoteStatus === 'accepted';
                              const disabled = hasAnyQuote;
                              const title = hasAccepted
                                ? 'Bearbeiten nicht möglich, Angebot wurde bereits angenommen'
                                : (hasAnyQuote ? 'Bearbeiten nicht möglich, es liegen bereits Angebote vor' : 'Gewerk bearbeiten');
                              return (
                                <button
                                  onClick={(e) => { e.stopPropagation(); if (!disabled) openEditModal(effectiveTrade); }}
                                  className={`px-2 py-1 rounded-lg text-xs font-medium transition-colors flex items-center gap-1 ${disabled ? 'bg-white/5 text-gray-400 cursor-not-allowed opacity-50' : 'bg-white/10 text-white hover:bg-white/20'}`}
                                  title={title}
                                  disabled={disabled}
                                >
                                  <Edit className="w-3 h-3" />
                                  Bearbeiten
                                </button>
                              );
                            })()}
                            {/* Löschen-Button: nur wenn keine Angebote vorhanden */}
                            {(() => {
                              const canDelete = canEditOrDeleteTrade(trade.id);
                              const title = canDelete ? 'Gewerk löschen' : 'Löschen nicht möglich, es liegen bereits Angebote vor';
                              return (
                                <button
                                  onClick={(e) => { e.stopPropagation(); if (canDelete) setShowDeleteConfirm(prev => ({ ...prev, [trade.id]: true })); }}
                                  className={`px-2 py-1 rounded-lg text-xs font-medium transition-colors flex items-center gap-1 ${canDelete ? 'bg-red-500/10 text-red-300 hover:bg-red-500/20' : 'bg-white/5 text-gray-400 cursor-not-allowed opacity-50'}`}
                                  title={title}
                                  disabled={!canDelete}
                                >
                                  <Trash2 className="w-3 h-3" />
                                  Löschen
                                </button>
                              );
                            })()}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs text-gray-400 mt-2">
                      {effectiveTrade.planned_date && (
                        <div className="flex items-center gap-1">
                          <Calendar size={12} className="text-[#ffbd59]" />
                          <span>Geplant: {formatDate(effectiveTrade.planned_date)}</span>
                        </div>
                      )}
                      
                      {effectiveTrade.contractor && (
                        <div className="flex items-center gap-1">
                          <User size={12} className="text-[#ffbd59]" />
                          <span className="truncate">{effectiveTrade.contractor}</span>
                        </div>
                      )}
                      
                      {effectiveTrade.budget && effectiveTrade.budget > 0 && (
                        <div className="flex items-center gap-1">
                          <Euro size={12} className="text-[#ffbd59]" />
                          <span>{effectiveTrade.budget.toLocaleString('de-DE')} €</span>
                        </div>
                      )}
                      
                      {effectiveTrade.start_date && (
                        <div className="flex items-center gap-1">
                          <Calendar size={12} className="text-[#ffbd59]" />
                          <span>Start: {formatDate(effectiveTrade.start_date)}</span>
                        </div>
                      )}
                      
                      {(effectiveTrade as any).requires_inspection || (effectiveTrade as any).inspection_required ? (
                        <div className="flex items-center gap-1">
                          <Eye size={12} className="text-blue-400" />
                          <span>Besichtigung erforderlich</span>
                        </div>
                      ) : null}
                      

                      
                      {effectiveTrade.progress_percentage > 0 && (
                        <div className="flex items-center gap-1">
                          <BarChart3 size={12} className="text-green-400" />
                          <span>{effectiveTrade.progress_percentage}% abgeschlossen</span>
                        </div>
                      )}
                    </div>

                    {trade.progress_percentage > 0 && (
                      <div className="mt-3">
                        <div className="flex justify-between text-xs text-gray-400 mb-1">
                          <span>Fortschritt</span>
                          <span>{trade.progress_percentage}%</span>
                        </div>
                        <div className="w-full bg-gray-700/50 rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-[#ffbd59] to-[#ffa726] h-2 rounded-full transition-all duration-300" 
                            style={{ width: `${trade.progress_percentage}%` }}
                          />
                        </div>
                      </div>
                    )}

                    <div className="mt-3 flex flex-wrap gap-2">
                      {effectiveTrade.category && (
                        <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium bg-[#ffbd59]/20 text-[#ffbd59] border border-[#ffbd59]/30">
                          <Tag size={10} />
                          {getCategoryLabel(effectiveTrade.category)}
                        </span>
                      )}
                      
                      {(effectiveTrade.notes || effectiveTrade.description) && (
                        <span 
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium bg-blue-500/20 text-blue-300 border border-blue-500/30 cursor-help" 
                          title={effectiveTrade.notes || effectiveTrade.description || 'Beschreibung & Leistungsumfang verfügbar'}
                        >
                          <StickyNote size={10} />
                          Beschreibung & Leistungsumfang
                        </span>
                      )}
                      
                      {(trade.requires_inspection || (trade as any).inspection_required) && (
                        <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium bg-blue-500/20 text-blue-300 border border-blue-500/30">
                          <Eye size={10} />
                          Besichtigung erforderlich
                        </span>
                      )}
                      
                      {effectiveTrade.status && (
                        <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium ${getTradeStatusColor(trade.status)}`}>
                          {getTradeStatusLabel(effectiveTrade.status)}
                        </span>
                      )}
                    </div>

                    {/* Angebot-Status und Aktionen */}
                    <div className="mt-4 pt-3 border-t border-white/10">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {isLoading ? (
                            <>
                              <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
                              <span className="text-xs text-gray-400">Prüfe Angebot...</span>
                            </>
                          ) : (
                            <>
                              <div className={`w-2 h-2 ${statusInfo.dotColor} rounded-full`}></div>
                              <span className={`text-xs ${statusInfo.color} font-medium`}>{statusInfo.text}</span>
                            </>
                          )}
                        </div>
                        
                        {currentQuoteData && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowDetails(prev => ({ ...prev, [trade.id]: !showDetailsForTrade }));
                            }}
                            className="text-xs text-[#ffbd59] hover:text-[#ffa726] transition-colors flex items-center gap-1"
                          >
                            {showDetailsForTrade ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                            {showDetailsForTrade ? 'Weniger anzeigen' : 'Details anzeigen'}
                          </button>
                        )}
                      </div>

                      {/* Angebot-Details */}
                      {currentQuoteData && showDetailsForTrade && (
                        <div className={`mt-3 p-3 rounded-lg ${statusInfo.bgColor} border ${statusInfo.borderColor}`}>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                            <div className="flex items-center gap-2">
                              <Euro size={12} className="text-gray-400" />
                              <span className="text-gray-400">Betrag:</span>
                              <span className="text-white font-medium">{formatCurrency(currentQuoteData.total_amount, currentQuoteData.currency)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Calendar size={12} className="text-gray-400" />
                              <span className="text-gray-400">Erstellt:</span>
                              <span className="text-white font-medium">{formatDate(currentQuoteData.created_at)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Calendar size={12} className="text-gray-400" />
                              <span className="text-gray-400">Gültig bis:</span>
                              <span className="text-white font-medium">{formatDate(currentQuoteData.valid_until)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <User size={12} className="text-gray-400" />
                              <span className="text-gray-400">Dienstleister:</span>
                              <span className="text-white font-medium">{currentQuoteData.company_name || currentQuoteData.contact_person}</span>
                            </div>
                          </div>
                          
                          {currentQuoteData.description && (
                            <div className="mt-2 text-xs">
                              <span className="text-gray-400">Beschreibung:</span>
                              <p className="text-white mt-1 leading-relaxed">{currentQuoteData.description}</p>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Angebot-Aktionen */}
                      {currentQuoteData && !isLoading && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {currentQuoteStatus === 'submitted' && (
                            <>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleAcceptQuote(trade.id);
                                }}
                                className="flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg text-xs font-medium hover:from-green-600 hover:to-green-700 transition-all duration-300 transform hover:scale-105 shadow-lg"
                              >
                                <CheckCircle size={12} />
                                Angebot annehmen
                              </button>
                              
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setShowRejectModal(prev => ({ ...prev, [trade.id]: true }));
                                }}
                                className="flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg text-xs font-medium hover:from-red-600 hover:to-red-700 transition-all duration-300 transform hover:scale-105 shadow-lg"
                              >
                                <XCircle size={12} />
                                Angebot ablehnen
                              </button>
                            </>
                          )}
                          
                          {currentQuoteStatus === 'accepted' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleResetQuote(trade.id);
                              }}
                              className="flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-yellow-500 to-yellow-600 text-white rounded-lg text-xs font-medium hover:from-yellow-600 hover:to-yellow-700 transition-all duration-300 transform hover:scale-105 shadow-lg"
                            >
                              <AlertTriangle size={12} />
                              Angebot zurücksetzen
                            </button>
                          )}
                          
                          {currentQuoteStatus === 'rejected' && currentQuoteData.rejection_reason && (
                            <div className="w-full p-2 bg-red-500/10 border border-red-500/20 rounded-lg">
                              <div className="flex items-center gap-1 text-red-300 mb-1">
                                <XCircle size={12} />
                                <span className="text-xs font-medium">Ablehnungsgrund</span>
                              </div>
                              <p className="text-xs text-red-200">{currentQuoteData.rejection_reason}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              
              {trades.length > 5 && !showAll && (
                <button
                  onClick={() => setShowAll(true)}
                  className="w-full text-center text-[#ffbd59] text-sm hover:underline py-3"
                >
                  +{trades.length - 5} weitere Gewerke anzeigen
                </button>
              )}
              {trades.length > 5 && showAll && (
                <button
                  onClick={() => setShowAll(false)}
                  className="w-full text-center text-[#ffbd59] text-sm hover:underline py-3"
                >
                  Weniger anzeigen
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Ablehnungs-Modal */}
      {Object.keys(showRejectModal).map(tradeId => {
        if (showRejectModal[parseInt(tradeId)]) {
          return (
            <div key={tradeId} className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-[#2c3539] rounded-2xl shadow-2xl border border-white/20 max-w-md w-full">
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Angebot ablehnen</h3>
                  <p className="text-sm text-gray-400 mb-4">
                    Bitte geben Sie einen Grund für die Ablehnung an:
                  </p>
                  <textarea
                    value={rejectionReason[parseInt(tradeId)] || ''}
                    onChange={(e) => setRejectionReason(prev => ({ ...prev, [parseInt(tradeId)]: e.target.value }))}
                    placeholder="Ablehnungsgrund..."
                    className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent resize-none"
                    rows={3}
                  />
                  <div className="flex gap-3 mt-6">
                    <button
                      onClick={() => {
                        setShowRejectModal(prev => ({ ...prev, [parseInt(tradeId)]: false }));
                        setRejectionReason(prev => ({ ...prev, [parseInt(tradeId)]: '' }));
                      }}
                      className="flex-1 px-4 py-2 bg-gray-500 text-white rounded-lg font-medium hover:bg-gray-600 transition-colors"
                    >
                      Abbrechen
                    </button>
                    <button
                      onClick={() => handleRejectQuote(parseInt(tradeId))}
                      className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-colors"
                    >
                      Ablehnen
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        }
        return null;
      })}

      {/* Lösch-Bestätigungs-Modal */}
      {Object.keys(showDeleteConfirm).map(tradeId => {
        if (showDeleteConfirm[parseInt(tradeId)]) {
          const trade = trades.find(t => t.id === parseInt(tradeId));
          if (!trade) return null;

          return (
            <div key={tradeId} className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-gradient-to-br from-[#2c3539] to-[#1a1a2e] rounded-2xl shadow-2xl border border-red-500/30 max-w-md w-full">
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-3 bg-red-500/20 rounded-full">
                      <Trash2 className="w-6 h-6 text-red-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">Gewerk löschen</h3>
                      <p className="text-sm text-gray-400">Diese Aktion kann nicht rückgängig gemacht werden</p>
                    </div>
                  </div>
                  
                  <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-6">
                    <p className="text-red-200 text-sm">
                      Möchten Sie das Gewerk <strong>"{trade.title}"</strong> wirklich löschen?
                    </p>
                    {trade.description && (
                      <p className="text-red-300/70 text-xs mt-2 italic">
                        {trade.description}
                      </p>
                    )}
                  </div>
                  
                  <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 mb-6">
                    <div className="flex items-center gap-2 text-green-300 text-sm">
                      <CheckCircle className="w-4 h-4" />
                      <span>Dieses Gewerk hat noch keine Angebote erhalten</span>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowDeleteConfirm(prev => ({ ...prev, [parseInt(tradeId)]: false }))}
                      className="flex-1 px-4 py-2.5 bg-gray-600 hover:bg-gray-500 text-white rounded-lg font-medium transition-colors"
                    >
                      Abbrechen
                    </button>
                    <button
                      onClick={() => handleDeleteTrade(parseInt(tradeId))}
                      className="flex-1 px-4 py-2.5 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-lg font-medium transition-all transform hover:scale-105 shadow-lg"
                    >
                      Löschen
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        }
        return null;
      })}

      {/* Gewerk bearbeiten Modal */}
      {editingTrade && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-[#2c3539] to-[#1a1a2e] rounded-2xl shadow-2xl border border-white/20 max-w-xl w-full">
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Gewerk bearbeiten</h3>
              <button onClick={() => setEditingTrade(null)} className="text-gray-400 hover:text-white">✕</button>
            </div>
            <form onSubmit={handleUpdateTrade} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Titel</label>
                <input
                  type="text"
                  value={editForm.title}
                  onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 bg-[#1a1a2e]/50 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-[#ffbd59]"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Beschreibung</label>
                <textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 bg-[#1a1a2e]/50 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-[#ffbd59]"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Kategorie</label>
                  <select
                    value={editForm.category}
                    onChange={(e) => setEditForm(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-3 py-2 bg-[#1a1a2e]/50 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-[#ffbd59]"
                  >
                    <option value="">Kategorie wählen</option>
                    {TRADE_CATEGORIES.map(category => (
                      <option key={category.value} value={category.value}>
                        {category.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Priorität</label>
                  <select
                    value={editForm.priority}
                    onChange={(e) => setEditForm(prev => ({ ...prev, priority: e.target.value }))}
                    className="w-full px-3 py-2 bg-[#1a1a2e]/50 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-[#ffbd59]"
                  >
                    <option value="low">Niedrig</option>
                    <option value="medium">Mittel</option>
                    <option value="high">Hoch</option>
                    <option value="urgent">Dringend</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Geplantes Datum</label>
                  <input
                    type="date"
                    value={editForm.planned_date}
                    onChange={(e) => setEditForm(prev => ({ ...prev, planned_date: e.target.value }))}
                    className="w-full px-3 py-2 bg-[#1a1a2e]/50 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-[#ffbd59]"
                  />
                </div>
                <div className="flex items-center gap-2 mt-6">
                  <input
                    id="requires_inspection"
                    type="checkbox"
                    checked={editForm.requires_inspection}
                    onChange={(e) => setEditForm(prev => ({ ...prev, requires_inspection: e.target.checked }))}
                    className="w-4 h-4 text-[#ffbd59] bg-[#2c3539]/50 border-gray-600 rounded focus:ring-[#ffbd59] focus:ring-2"
                  />
                  <label htmlFor="requires_inspection" className="text-sm text-gray-300">Besichtigung erforderlich</label>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Notizen</label>
                <textarea
                  value={editForm.notes}
                  onChange={(e) => setEditForm(prev => ({ ...prev, notes: e.target.value }))}
                  rows={2}
                  className="w-full px-3 py-2 bg-[#1a1a2e]/50 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-[#ffbd59]"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setEditingTrade(null)} className="px-4 py-2 text-gray-300 hover:text-white">Abbrechen</button>
                <button type="submit" disabled={isUpdatingTrade} className="px-4 py-2 bg-[#ffbd59] text-[#2c3539] rounded-lg font-semibold hover:bg-[#ffa726] disabled:opacity-50">
                  {isUpdatingTrade ? 'Speichern…' : 'Speichern'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Löschbestätigungs-Modal */}
      {Object.entries(showDeleteConfirm).map(([tradeId, show]) => {
        if (!show) return null;
        const trade = trades.find(t => t.id === parseInt(tradeId));
        if (!trade) return null;
        
        return (
          <div key={tradeId} className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
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
                    Möchten Sie die Ausschreibung <strong className="text-white">"{trade.title}"</strong> wirklich löschen?
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
                    onClick={() => setShowDeleteConfirm(prev => ({ ...prev, [tradeId]: false }))}
                    className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
                  >
                    Abbrechen
                  </button>
                  <button
                    onClick={() => handleDeleteTrade(parseInt(tradeId))}
                    className="px-6 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-semibold transition-colors flex items-center gap-2"
                  >
                    <Trash2 size={16} />
                    Endgültig löschen
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
} 