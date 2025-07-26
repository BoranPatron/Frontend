import React, { useState, useEffect } from 'react';
import { CheckCircle, Clock, XCircle, AlertTriangle, Eye, FileText, Euro, Calendar, User, ChevronDown, ChevronUp, Trophy } from 'lucide-react';
import QuoteDebugInfo from './QuoteDebugInfo';

interface TradeCardWithStatusProps {
  trade: any;
  onTradeClick: (trade: any) => void;
  onViewQuoteDetails?: (quote: any) => void;
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
}

export default function TradeCardWithStatus({ trade, onTradeClick, onViewQuoteDetails }: TradeCardWithStatusProps) {
  const [quoteStatus, setQuoteStatus] = useState<'none' | 'submitted' | 'accepted' | 'rejected' | 'loading' | 'unknown'>('loading');
  const [quoteData, setQuoteData] = useState<QuoteData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    checkQuoteStatus();
  }, [trade.id]);

  const checkQuoteStatus = async () => {
    try {
      setLoading(true);
      
      // Robuste Token-Validierung und -Wiederherstellung
      const token = await getValidToken();
      if (!token) {
        console.log('❌ Kein gültiger Token verfügbar');
        setQuoteStatus('unknown');
        return;
      }

      console.log(`🔍 Prüfe Quote-Status für Gewerk ${trade.id}...`);
      console.log(`🔑 Token verfügbar: ${token.substring(0, 10)}...`);
      
      // Robuste API-Prüfung mit mehreren Fallback-Optionen
      const quoteData = await findUserQuote(trade.id, token);
      
      if (quoteData) {
        console.log(`✅ Angebot gefunden: Status = ${quoteData.status}`);
        setQuoteStatus(quoteData.status || 'submitted');
        setQuoteData(quoteData);
      } else {
        console.log('❌ Kein Angebot gefunden');
        
        // Fallback: Prüfe Backend-Status und versuche alternative Methoden
        const backendStatus = await checkBackendStatus(token);
        if (backendStatus.working) {
          console.log('✅ Backend funktioniert, aber kein Angebot gefunden');
          setQuoteStatus('none');
          setQuoteData(null);
        } else {
          console.log('⚠️ Backend-Probleme erkannt, verwende Fallback-Modus');
          // Fallback: Zeige "Unbekannt" Status bei Backend-Problemen
          setQuoteStatus('unknown');
          setQuoteData(null);
        }
      }
    } catch (error) {
      console.error('❌ Fehler beim Prüfen des Quote-Status:', error);
      setQuoteStatus('unknown');
      setQuoteData(null);
    } finally {
      setLoading(false);
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

    // Versuche 3: Automatische Re-Authentifizierung
    try {
      console.log('🔄 Versuche automatische Re-Authentifizierung...');
      const newToken = await reAuthenticate();
      if (newToken) {
        console.log('✅ Re-Authentifizierung erfolgreich');
        return newToken;
      }
    } catch (error) {
      console.log('❌ Re-Authentifizierung fehlgeschlagen:', error);
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

  // Automatische Re-Authentifizierung
  const reAuthenticate = async (): Promise<string | null> => {
    try {
      // Versuche mit gespeicherten Credentials
      const savedCredentials = localStorage.getItem('userCredentials');
      if (savedCredentials) {
        const credentials = JSON.parse(savedCredentials);
        const response = await fetch('/api/v1/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(credentials)
        });

        if (response.ok) {
          const data = await response.json();
          const newToken = data.access_token;
          if (newToken) {
            localStorage.setItem('accessToken', newToken);
            return newToken;
          }
        }
      }
      return null;
    } catch (error) {
      console.log('❌ Re-Authentifizierung fehlgeschlagen:', error);
      return null;
    }
  };

  // Backend-Status-Prüfung
  const checkBackendStatus = async (token: string): Promise<{working: boolean, error?: string}> => {
    try {
      const response = await fetch('/api/v1/quotes', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        try {
          const responseText = await response.text();
          if (responseText && responseText.trim() !== '') {
            JSON.parse(responseText);
            return { working: true };
          }
        } catch (parseError) {
          return { working: false, error: 'Invalid JSON response' };
        }
      }
      
      return { working: false, error: `HTTP ${response.status}` };
    } catch (error) {
      return { working: false, error: error instanceof Error ? error.message : 'Unknown error' };
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
            console.log(`📄 ${endpoint.name} Invalid Response:`, await response.text());
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
          try {
            const errorText = await response.text();
            console.log(`📄 ${endpoint.name} Error Response:`, errorText);
          } catch (error) {
            console.log(`❌ ${endpoint.name} Error Response nicht lesbar`);
          }
        }
      } catch (error) {
        console.log(`❌ ${endpoint.name} Exception:`, error);
      }
    }

    console.log('❌ Kein Angebot in allen Endpoints gefunden');
    return null;
  };

  const formatCurrency = (amount: number, currency: string = 'EUR') => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Nicht angegeben';
    return new Date(dateString).toLocaleDateString('de-DE');
  };

  const getStatusDisplay = () => {
    switch (quoteStatus) {
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

  const statusInfo = getStatusDisplay();

  const handleViewDetails = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (quoteData && onViewQuoteDetails) {
      onViewQuoteDetails(quoteData);
    } else {
      setShowDetails(!showDetails);
    }
  };

  return (
    <div 
      className={`bg-white/5 rounded-lg p-4 border cursor-pointer hover:bg-white/10 transition-all duration-300 transform hover:scale-105 hover:shadow-lg ${
        quoteStatus === 'accepted' 
          ? 'border-green-500/40 bg-gradient-to-r from-green-500/5 to-emerald-500/5 hover:border-green-500/60 shadow-lg shadow-green-500/10' 
          : 'border-white/10 hover:border-[#ffbd59]/30'
      }`}
      onClick={() => onTradeClick(trade)}
    >
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex-1 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-[#ffbd59] rounded-full"></div>
              <div className="font-medium text-white text-lg">{trade.title || 'Gewerk'}</div>
            </div>
            {/* Status-Badge mit verbessertem Design */}
            <div className="flex items-center gap-2">
              {loading ? (
                <>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
                  <span className="text-xs text-gray-400">Prüfe...</span>
                </>
              ) : (
                <>
                  <div className={`w-2 h-2 ${statusInfo.dotColor} rounded-full`}></div>
                  <span className={`text-xs ${statusInfo.color} font-medium`}>{statusInfo.text}</span>
                  
                  {/* Spezieller Badge für angenommene Angebote */}
                  {quoteStatus === 'accepted' && (
                    <div className="inline-flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-green-600/30 to-emerald-500/30 border border-green-400/40 rounded-full animate-pulse-slow">
                      <Trophy size={10} className="text-green-300" />
                      <span className="text-xs font-semibold text-green-200">✓ Angenommen</span>
                      <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-ping"></div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-gray-400">Kategorie:</span>
              <span className="text-white font-medium">{trade.category}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-400">Entfernung:</span>
              <span className="text-white font-medium">{trade.distance_km.toFixed(1)}km</span>
            </div>
          </div>
          
          <div className="text-xs text-gray-400 space-y-1">
            <div className="flex items-center gap-1">
              📁 {trade.project_name} ({trade.project_type})
            </div>
            <div className="flex items-center gap-1">
              📍 {trade.address_street}, {trade.address_zip} {trade.address_city}
            </div>
          </div>
          
          {trade.budget && (
            <div className="text-sm text-[#ffbd59] font-semibold">
              💰 Budget: {trade.budget.toLocaleString('de-DE')} €
            </div>
          )}
          
          {/* Erweiterte Angebot-Details */}
          {quoteData && showDetails && (
            <div className={`mt-3 pt-3 border-t border-white/10 space-y-3 ${statusInfo.bgColor} rounded-lg p-3`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {statusInfo.icon}
                  <span className={`text-sm font-medium ${statusInfo.color}`}>
                    Angebot {statusInfo.text.toLowerCase()}
                  </span>
                </div>
                <button
                  onClick={handleViewDetails}
                  className="text-xs text-[#ffbd59] hover:text-[#ffa726] transition-colors flex items-center gap-1"
                >
                  <Eye size={12} />
                  Vollständige Details
                </button>
              </div>
              
              {/* Angebot-Informationen */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <Euro size={12} className="text-gray-400" />
                  <span className="text-gray-400">Betrag:</span>
                  <span className="text-white font-medium">{formatCurrency(quoteData.total_amount, quoteData.currency)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar size={12} className="text-gray-400" />
                  <span className="text-gray-400">Erstellt:</span>
                  <span className="text-white font-medium">{formatDate(quoteData.created_at)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar size={12} className="text-gray-400" />
                  <span className="text-gray-400">Gültig bis:</span>
                  <span className="text-white font-medium">{formatDate(quoteData.valid_until)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <User size={12} className="text-gray-400" />
                  <span className="text-gray-400">Dienstleister:</span>
                  <span className="text-white font-medium">{quoteData.company_name || quoteData.contact_person}</span>
                </div>
              </div>
              
              {/* Kostenaufschlüsselung */}
              {(quoteData.labor_cost || quoteData.material_cost || quoteData.overhead_cost) && (
                <div className="bg-white/5 rounded p-2 space-y-1">
                  <div className="text-xs font-medium text-white mb-2">Kostenaufschlüsselung:</div>
                  {quoteData.labor_cost && (
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-300">Arbeitskosten:</span>
                      <span className="text-white">{formatCurrency(quoteData.labor_cost, quoteData.currency)}</span>
                    </div>
                  )}
                  {quoteData.material_cost && (
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-300">Materialkosten:</span>
                      <span className="text-white">{formatCurrency(quoteData.material_cost, quoteData.currency)}</span>
                    </div>
                  )}
                  {quoteData.overhead_cost && (
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-300">Gemeinkosten:</span>
                      <span className="text-white">{formatCurrency(quoteData.overhead_cost, quoteData.currency)}</span>
                    </div>
                  )}
                  <div className="border-t border-white/20 pt-1 mt-1">
                    <div className="flex justify-between text-xs font-medium">
                      <span className="text-white">Gesamtbetrag:</span>
                      <span className="text-[#ffbd59]">{formatCurrency(quoteData.total_amount, quoteData.currency)}</span>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Beschreibung */}
              {quoteData.description && (
                <div className="text-xs">
                  <span className="text-gray-400">Beschreibung:</span>
                  <p className="text-white mt-1 leading-relaxed">{quoteData.description}</p>
                </div>
              )}
            </div>
          )}
          
          {/* Details-Button für Angebote */}
          {quoteData && !showDetails && (
            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={handleViewDetails}
                className="text-xs text-[#ffbd59] hover:text-[#ffa726] transition-colors flex items-center gap-1"
              >
                <ChevronDown size={12} />
                Angebot-Details anzeigen
              </button>
            </div>
          )}
          
          {/* Debug-Komponente für API-Probleme */}
          <QuoteDebugInfo 
            tradeId={trade.id}
            onDebugComplete={(hasQuote, quoteData) => {
              if (hasQuote && quoteData) {
                console.log('🔧 Debug gefunden: Angebot existiert!', quoteData);
                setQuoteStatus(quoteData.status || 'submitted');
                setQuoteData(quoteData);
              }
            }}
          />
        </div>
        
        <div className="flex items-center gap-2 lg:flex-col lg:items-end">
          <div className="text-center text-[#ffbd59] text-xs font-medium">
            👁️ Details anzeigen
          </div>
          <div className="hidden lg:block text-[#ffbd59] text-xs">
            →
          </div>
        </div>
      </div>
    </div>
  );
} 