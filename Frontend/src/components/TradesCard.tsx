import React, { useState, useEffect } from 'react';
import { Wrench, User, Euro, BarChart3, Calendar, Tag, CheckCircle, XCircle, AlertTriangle, Eye, FileText, ChevronDown, ChevronUp, Clock, Users, Trophy, Sparkles, MessageCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getQuotesForMilestone } from '../api/quoteService';

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
  onResetQuote
}: TradesCardProps) {
  const navigate = useNavigate();
  const [quoteData, setQuoteData] = useState<{ [tradeId: number]: QuoteData | null }>({});
  const [quoteStatus, setQuoteStatus] = useState<{ [tradeId: number]: string }>({});
  const [loading, setLoading] = useState<{ [tradeId: number]: boolean }>({});
  const [showRejectModal, setShowRejectModal] = useState<{ [tradeId: number]: boolean }>({});
  const [rejectionReason, setRejectionReason] = useState<{ [tradeId: number]: string }>({});
  const [showDetails, setShowDetails] = useState<{ [tradeId: number]: boolean }>({});
  const [tradeStats, setTradeStats] = useState<{ [tradeId: number]: TradeStats }>({});

  console.log('🔍 TradesCard Props:', { trades, projectId, isExpanded, tradesLength: trades.length });

  useEffect(() => {
    if (isExpanded && trades.length > 0) {
      trades.forEach(trade => {
        checkQuoteStatus(trade.id);
        loadTradeStats(trade.id);
      });
    }
  }, [isExpanded, trades]);

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

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('de-DE');
  };

  return (
    <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full p-6 text-left hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white flex items-center gap-3">
            <Wrench size={20} className="text-[#ffbd59]" />
            Gewerke ({trades.length})
          </h3>
          <div className={`transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
            <svg className="w-5 h-5 text-[#ffbd59]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </button>
      
      {isExpanded && (
        <div className="px-6 pb-6 space-y-3">
          {trades.length === 0 ? (
            <div className="text-center py-8">
              <Wrench size={48} className="text-gray-400 mx-auto mb-4" />
              <p className="text-gray-400 text-sm mb-4">Keine Gewerke für dieses Projekt vorhanden</p>
              <p className="text-gray-500 text-xs mb-4">Erstellen Sie ein neues Gewerk über die "Gewerke"-Seite</p>
              <button
                onClick={() => navigate('/quotes')}
                className="px-4 py-2 bg-[#ffbd59] text-[#3d4952] rounded-lg font-semibold hover:bg-[#ffa726] transition-colors"
              >
                Gewerk erstellen
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {trades.slice(0, 5).map((trade) => {
                const currentQuoteStatus = quoteStatus[trade.id] || 'unknown';
                const currentQuoteData = quoteData[trade.id];
                const isLoading = loading[trade.id] || false;
                const statusInfo = getStatusDisplay(currentQuoteStatus);
                const showDetailsForTrade = showDetails[trade.id] || false;
                const tradeStatsForTrade = tradeStats[trade.id];

                return (
                  <div
                    key={trade.id}
                    className={`bg-white/10 rounded-lg p-4 cursor-pointer hover:bg-white/20 transition-all duration-300 ${
                      (tradeStatsForTrade.acceptedQuote || currentQuoteStatus === 'accepted') 
                        ? 'border-2 border-green-500/40 bg-gradient-to-r from-green-500/5 to-emerald-500/5 shadow-lg shadow-green-500/10' 
                        : 'border border-white/10'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-[#ffbd59]/20 rounded-lg">
                          <Wrench size={16} className="text-[#ffbd59]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-white font-medium text-sm truncate">{trade.title}</h4>
                          {trade.description && (
                            <p className="text-gray-400 text-xs mt-1 line-clamp-2">{trade.description}</p>
                          )}
                          
                          {/* Angebots-Statistiken */}
                          {(() => {
                            console.log(`🔍 Rendering Trade ${trade.id}:`, {
                              tradeStats: tradeStatsForTrade,
                              hasAcceptedQuote: !!tradeStatsForTrade.acceptedQuote,
                              acceptedQuote: tradeStatsForTrade.acceptedQuote
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
                                  navigate(`/quotes?tradeId=${trade.id}`);
                                }}
                              >
                                <Users size={14} className="text-[#ffbd59] group-hover:text-[#ffa726]" />
                                <span className="text-xs text-gray-300 group-hover:text-[#ffbd59]">
                                  {tradeStatsForTrade.totalQuotes} {tradeStatsForTrade.totalQuotes === 1 ? 'Angebot' : 'Angebote'}
                                </span>
                              </div>
                              
                              {/* Angenommenes Angebot Badge - Best Practice Design */}
                              {(tradeStatsForTrade.acceptedQuote || currentQuoteStatus === 'accepted') && (
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
                                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-3 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none z-50">
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
                                            {tradeStatsForTrade.acceptedQuote?.company_name || currentQuoteData?.company_name || 'Unbekannt'}
                                          </span>
                                        </div>
                                        
                                        <div className="flex justify-between items-center">
                                          <span className="text-gray-300">Betrag:</span>
                                          <span className="text-green-300 font-bold">
                                            {formatCurrency((tradeStatsForTrade.acceptedQuote || currentQuoteData)?.total_amount || 0, (tradeStatsForTrade.acceptedQuote || currentQuoteData)?.currency || 'EUR')}
                                          </span>
                                        </div>
                                        
                                        <div className="flex justify-between items-center">
                                          <span className="text-gray-300">Angenommen:</span>
                                          <span className="text-white">
                                            {formatDate((tradeStatsForTrade.acceptedQuote || currentQuoteData)?.created_at || '')}
                                          </span>
                                        </div>
                                        
                                        {(tradeStatsForTrade.acceptedQuote || currentQuoteData)?.warranty_period && (
                                          <div className="flex justify-between items-center">
                                            <span className="text-gray-300">Garantie:</span>
                                            <span className="text-white">
                                              {(tradeStatsForTrade.acceptedQuote || currentQuoteData)?.warranty_period} Monate
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
                              
                              {/* Offene Angebote mit verbessertem Design */}
                              {!tradeStatsForTrade.acceptedQuote && tradeStatsForTrade.pendingQuotes > 0 && (
                                <div className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-500/20 border border-blue-500/30 rounded-full hover:bg-blue-500/30 transition-colors">
                                  <Clock size={12} className="text-blue-400" />
                                  <span className="text-xs text-blue-300 font-medium">
                                    {tradeStatsForTrade.pendingQuotes} offen
                                  </span>
                                </div>
                              )}
                              
                              {/* Abgelehnte Angebote */}
                              {tradeStatsForTrade.rejectedQuotes > 0 && (
                                <div className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-500/20 border border-red-500/30 rounded-full">
                                  <XCircle size={12} className="text-red-400" />
                                  <span className="text-xs text-red-300 font-medium">
                                    {tradeStatsForTrade.rejectedQuotes} abgelehnt
                                  </span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Status-Badges mit verbessertem Design */}
                      <div className="flex flex-col gap-1">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getTradeStatusColor(trade.status)}`}>
                          {getTradeStatusLabel(trade.status)}
                        </span>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(trade.priority)}`}>
                          {getPriorityLabel(trade.priority)}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs text-gray-400">
                      {trade.contractor && (
                        <div className="flex items-center gap-1">
                          <User size={12} />
                          <span className="truncate">{trade.contractor}</span>
                        </div>
                      )}
                      
                      {trade.budget && trade.budget > 0 && (
                        <div className="flex items-center gap-1">
                          <Euro size={12} />
                          <span>{trade.budget.toLocaleString('de-DE')} €</span>
                        </div>
                      )}
                      
                      {trade.start_date && (
                        <div className="flex items-center gap-1">
                          <Calendar size={12} />
                          <span>Start: {formatDate(trade.start_date)}</span>
                        </div>
                      )}
                      
                      {trade.progress_percentage > 0 && (
                        <div className="flex items-center gap-1">
                          <BarChart3 size={12} />
                          <span>{trade.progress_percentage}%</span>
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

                    {trade.category && (
                      <div className="mt-3">
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-500/20 text-gray-300 border border-gray-500/30">
                          <Tag size={10} />
                          {trade.category}
                        </span>
                      </div>
                    )}

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
              
              {trades.length > 5 && (
                <button
                  onClick={() => navigate('/quotes')}
                  className="w-full text-center text-[#ffbd59] text-sm hover:underline py-3"
                >
                  +{trades.length - 5} weitere Gewerke anzeigen
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
    </div>
  );
} 