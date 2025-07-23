import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  FileText, 
  Handshake, 
  Users, 
  BarChart3, 
  User, 
  Euro, 
  Sparkles,
  TrendingUp,
  MessageSquare,
  Clock,
  CheckCircle,
  AlertTriangle,
  MapPin,
  Search,
  List,
  Map,
  Filter,
  RefreshCw
} from 'lucide-react';
import DashboardCard from '../components/DashboardCard';
import CostEstimateForm from '../components/CostEstimateForm';
import TradeMap from '../components/TradeMap';
import TradeDetailsModal from '../components/TradeDetailsModal';
import { 
  searchTradesInRadius, 
  type TradeSearchRequest, 
  type TradeSearchResult
} from '../api/geoService';
import { createQuote } from '../api/quoteService';
import logo from '../logo_trans_big.png';

export default function ServiceProviderDashboard() {
  const navigate = useNavigate();
  const { user, userRole, isAuthenticated } = useAuth();
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Geo-Search State für Dienstleister
  const [showGeoSearch, setShowGeoSearch] = useState(true);
  const [activeTab, setActiveTab] = useState<'list' | 'map'>('list');
  const [manualAddress, setManualAddress] = useState('');
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [showAcceptedTrades, setShowAcceptedTrades] = useState(false);
  
  const [currentLocation, setCurrentLocation] = useState<{ latitude: number; longitude: number } | null>(() => {
    const saved = localStorage.getItem('buildwise_geo_location');
    return saved ? JSON.parse(saved) : null;
  });
  
  const [radiusKm, setRadiusKm] = useState(() => {
    const saved = localStorage.getItem('buildwise_geo_radius');
    return saved ? parseInt(saved) : 50;
  });
  
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [geoTrades, setGeoTrades] = useState<TradeSearchResult[]>([]);
  
  // Filter-State
  const [geoTradeCategory, setGeoTradeCategory] = useState<string>('');
  const [geoTradeStatus, setGeoTradeStatus] = useState<string>('');
  const [geoTradePriority, setGeoTradePriority] = useState<string>('');
  const [geoMinBudget, setGeoMinBudget] = useState<number | undefined>();
  const [geoMaxBudget, setGeoMaxBudget] = useState<number | undefined>();

  // Quote/Angebot-State
  const [showCostEstimateForm, setShowCostEstimateForm] = useState(false);
  const [selectedTradeForQuote, setSelectedTradeForQuote] = useState<TradeSearchResult | null>(null);
  
  // Detailansicht-State
  const [showTradeDetails, setShowTradeDetails] = useState(false);
  const [detailTrade, setDetailTrade] = useState<TradeSearchResult | null>(null);

  // Online/Offline-Status überwachen
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Weiterleitung wenn nicht authentifiziert oder nicht Dienstleister
  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/login?message=please_login');
      return;
    }
    
    if (userRole !== 'dienstleister' && user?.user_role !== 'DIENSTLEISTER') {
      navigate('/');
      return;
    }
  }, [isAuthenticated, userRole, user, navigate]);

  // Geo-Search Functions
  const useOwnLocation = () => {
    if (navigator.geolocation) {
      setGeoLoading(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          };
          setCurrentLocation(location);
          localStorage.setItem('buildwise_geo_location', JSON.stringify(location));
          setGeoLoading(false);
          console.log('✅ Standort ermittelt:', location);
        },
        (error) => {
          console.error('❌ Standort-Fehler:', error);
          setGeoError('Standort konnte nicht ermittelt werden');
          setGeoLoading(false);
        }
      );
    } else {
      setGeoError('Geolocation wird nicht unterstützt');
    }
  };

  const handleManualAddressGeocode = async () => {
    if (!manualAddress.trim()) return;
    
    setIsGeocoding(true);
    try {
      // Einfache Geocoding-Simulation (in der Realität würde hier eine echte API verwendet)
      // Für Demo-Zwecke setzen wir einen festen Standort
      const location = {
        latitude: 52.5200,
        longitude: 13.4050
      };
      setCurrentLocation(location);
      localStorage.setItem('buildwise_geo_location', JSON.stringify(location));
      console.log('✅ Adresse geocodiert:', manualAddress, location);
    } catch (error) {
      console.error('❌ Geocoding-Fehler:', error);
      setGeoError('Adresse konnte nicht gefunden werden');
    } finally {
      setIsGeocoding(false);
    }
  };

  const performGeoSearch = async () => {
    if (!currentLocation) {
      setGeoError('Bitte wählen Sie einen Standort aus');
      return;
    }
    
    try {
      setGeoLoading(true);
      setGeoError(null);
      
      const searchRequest: TradeSearchRequest = {
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        radius_km: radiusKm,
        category: geoTradeCategory || undefined,
        status: geoTradeStatus || undefined,
        priority: geoTradePriority || undefined,
        min_budget: geoMinBudget,
        max_budget: geoMaxBudget,
        limit: 100
      };
      
      const tradeResults = await searchTradesInRadius(searchRequest);
      setGeoTrades(tradeResults);
      console.log('✅ Geo-Gewerke geladen:', tradeResults.length);
    } catch (error) {
      console.error('❌ Geo-Search Fehler:', error);
      setGeoError('Fehler bei der Gewerke-Suche');
    } finally {
      setGeoLoading(false);
    }
  };

  // Auto-Search wenn Standort verfügbar
  useEffect(() => {
    if (currentLocation && showGeoSearch) {
      performGeoSearch();
    }
  }, [currentLocation, radiusKm, geoTradeCategory, geoTradeStatus, geoTradePriority, geoMinBudget, geoMaxBudget]);

  // Angebot-Funktionen
  const handleCreateQuote = (trade: TradeSearchResult) => {
    setSelectedTradeForQuote(trade);
    setShowCostEstimateForm(true);
  };

  const handleTradeDetails = (trade: TradeSearchResult) => {
    console.log('👁️ Zeige Details für:', trade);
    setDetailTrade(trade);
    setShowTradeDetails(true);
  };

  const handleCostEstimateSubmit = async (costEstimateData: any) => {
    if (!selectedTradeForQuote || !user) {
      console.error('❌ Fehlende Daten für Angebotserstellung');
      return;
    }

    try {
      console.log('🚀 Erstelle Angebot:', costEstimateData);
      
      // Angebot über API erstellen
      const quoteData = {
        title: costEstimateData.title || `Angebot für ${selectedTradeForQuote.title}`,
        description: costEstimateData.description || '',
        project_id: selectedTradeForQuote.project_id,
        milestone_id: selectedTradeForQuote.id,
        service_provider_id: user.id,
        total_amount: parseFloat(costEstimateData.total_amount) || 0,
        currency: costEstimateData.currency || 'EUR',
        valid_until: costEstimateData.valid_until || '',
        labor_cost: parseFloat(costEstimateData.labor_cost) || 0,
        material_cost: parseFloat(costEstimateData.material_cost) || 0,
        overhead_cost: parseFloat(costEstimateData.overhead_cost) || 0,
        estimated_duration: parseInt(costEstimateData.estimated_duration) || 0,
        start_date: costEstimateData.start_date || '',
        completion_date: costEstimateData.completion_date || '',
        payment_terms: costEstimateData.payment_terms || '',
        warranty_period: parseInt(costEstimateData.warranty_period) || 12,
        company_name: costEstimateData.company_name || user.company_name || '',
        contact_person: costEstimateData.contact_person || `${user.first_name} ${user.last_name}`,
        phone: costEstimateData.phone || user.phone || '',
        email: costEstimateData.email || user.email || '',
        website: costEstimateData.website || ''
      };

      const newQuote = await createQuote(quoteData);
      console.log('✅ Angebot erfolgreich erstellt:', newQuote);
      
      // Form schließen und Erfolgsmeldung
      setShowCostEstimateForm(false);
      setSelectedTradeForQuote(null);
      
      // Geo-Search aktualisieren um neue Daten zu laden
      if (currentLocation) {
        performGeoSearch();
      }
      
    } catch (error) {
      console.error('❌ Fehler beim Erstellen des Angebots:', error);
    }
  };

  // Mock-Statistiken für Dienstleister (können später durch echte API-Daten ersetzt werden)
  const getServiceProviderStats = () => {
    return {
      activeQuotes: 8,
      newTenders: geoTrades.length || 3,
      documentsUploaded: 12,
      responseRate: 85,
      lastActivity: "vor 2 Stunden"
    };
  };

  const stats = getServiceProviderStats();

  // Dedizierte Dienstleister-Dashboard-Karten (nur Docs und Gewerke)
  const getDashboardCards = () => [
    {
      title: "Docs",
      description: "Dokumentenmanagement & Uploads",
      icon: <FileText size={32} />,
      onClick: () => navigate('/documents'),
      ariaLabel: "Dokumentenmanagement öffnen",
      badge: { text: `${stats.documentsUploaded} Dokumente`, color: "blue" as const },
      cardId: "docs",
      path: "/documents",
      iconString: "<FileText size={16} />",
      children: (
        <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
          <FileText size={16} />
          <span>Angebots-PDFs hochladen</span>
        </div>
      )
    },
    {
      title: "Rechnungen",
      description: "Rechnungsmanagement & Zahlungen",
      icon: <Euro size={32} />,
      onClick: () => navigate('/invoices'),
      ariaLabel: "Rechnungsmanagement öffnen",
      badge: { text: `${stats.activeQuotes} Rechnungen`, color: "green" as const },
      cardId: "invoices",
      path: "/invoices",
      iconString: "<Euro size={16} />",
      children: (
        <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
          <BarChart3 size={16} />
          <span>Rechnungen erstellen & verwalten</span>
        </div>
      )
    }
  ];

  const dashboardCards = getDashboardCards();

  // Fallback wenn nicht authentifiziert
  if (!isAuthenticated()) {
  return (
      <div className="min-h-screen bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#ffbd59] mx-auto mb-4"></div>
          <p className="text-white">Lade Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460] p-6">
      {/* Header mit Dienstleister-Informationen */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-bold text-white">Dienstleister-Dashboard</h1>
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${isOnline ? 'bg-green-400' : 'bg-red-400'}`}></div>
            <span className="text-sm text-gray-300">{isOnline ? 'Online' : 'Offline'}</span>
          </div>
      </div>

        {/* Dienstleister-Profil-Karte */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 transition-all duration-300 hover:bg-white/15">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-[#ffbd59] rounded-full"></div>
              <span className="text-sm text-gray-400">Dienstleister-Profil</span>
              </div>
            <div className="flex items-center space-x-2">
              <CheckCircle size={16} className="text-green-400" />
              <span className="text-sm text-green-400">Verifiziert</span>
            </div>
          </div>

          <div className="mb-4">
            <h2 className="text-2xl font-bold text-white mb-2">
              {user?.company_name || `${user?.first_name} ${user?.last_name}`}
            </h2>
            <p className="text-gray-300 mb-3">
              {user?.company_address || 'Dienstleister für Bauprojekte'}
            </p>
            
            <div className="flex flex-wrap gap-4 text-sm">
              <span className="px-3 py-1 rounded-full text-blue-400 bg-white/10">
                Dienstleister
              </span>
              <span className="px-3 py-1 rounded-full text-green-400 bg-white/10">
                {stats.responseRate}% Antwortrate
              </span>
              <span className="px-3 py-1 rounded-full text-purple-400 bg-white/10">
                {stats.activeQuotes} aktive Angebote
              </span>
            </div>
          </div>

          {/* Dienstleister-Statistiken */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="text-center">
              <div className="text-2xl font-bold text-[#ffbd59]">{stats.activeQuotes}</div>
              <div className="text-gray-400">Aktive Angebote</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-[#ffbd59]">{stats.newTenders}</div>
              <div className="text-gray-400">Neue Ausschreibungen</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-[#ffbd59]">{stats.documentsUploaded}</div>
              <div className="text-gray-400">Dokumente</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-[#ffbd59]">{stats.responseRate}%</div>
              <div className="text-gray-400">Antwortrate</div>
            </div>
          </div>
        </div>
      </div>

      {/* Dashboard-Karten (nur Docs und Gewerke) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {dashboardCards.map((card, index) => (
              <DashboardCard
                key={index}
                title={card.title}
                icon={card.icon}
                onClick={card.onClick}
                ariaLabel={card.ariaLabel}
            status={isOnline ? 'online' : 'offline'}
                badge={card.badge}
                cardId={card.cardId}
                path={card.path}
                iconString={card.iconString}
              >
                {card.children}
              </DashboardCard>
            ))}
          </div>

      {/* Geo-basierte Gewerke-Suche für Dienstleister */}
      {showGeoSearch && (
        <div className="mb-6 bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <MapPin size={20} className="text-[#ffbd59]" />
              <span className="text-white font-medium">Geo-basierte Gewerksuche</span>
              {currentLocation && (
                <span className="text-[#ffbd59] text-xs">
                  📍 {currentLocation.latitude.toFixed(4)}, {currentLocation.longitude.toFixed(4)}
                </span>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab('list')}
                className={`px-3 py-1.5 rounded-lg font-medium text-xs transition-colors ${
                  activeTab === 'list'
                    ? 'bg-[#ffbd59] text-[#2c3539]'
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                <List size={14} className="inline mr-1" />
                Liste
              </button>
              <button
                onClick={() => setActiveTab('map')}
                className={`px-3 py-1.5 rounded-lg font-medium text-xs transition-colors ${
                  activeTab === 'map'
                    ? 'bg-[#ffbd59] text-[#2c3539]'
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                <Map size={14} className="inline mr-1" />
                Karte
              </button>
            </div>
          </div>
          
          {/* Standort-Eingabe */}
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Adresse eingeben (z.B. Musterstraße 1, 10115 Berlin)"
                value={manualAddress}
                onChange={(e) => setManualAddress(e.target.value)}
                className="w-full px-3 py-2 bg-white/10 text-white rounded-lg text-sm border border-white/20 focus:outline-none focus:border-[#ffbd59] placeholder-white/50"
              />
            </div>
            
            <button
              onClick={handleManualAddressGeocode}
              disabled={isGeocoding || !manualAddress.trim()}
              className="px-4 py-2 bg-[#ffbd59] text-[#2c3539] rounded-lg hover:bg-[#ffa726] disabled:opacity-50 text-sm font-medium"
            >
              {isGeocoding ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b border-[#2c3539] inline mr-2"></div>
                  Suche...
                </>
              ) : (
                'Adresse suchen'
              )}
            </button>
            
            <button
              onClick={useOwnLocation}
              disabled={geoLoading}
              className="px-3 py-2 bg-[#10b981] text-white rounded-lg hover:bg-[#059669] disabled:opacity-50 text-sm font-medium"
              title="Eigenen Standort übernehmen"
            >
              <User size={16} />
            </button>
          </div>
          
          {/* Suchradius und Filter */}
          <div className="flex items-center gap-4 mb-4 flex-wrap">
            <div className="flex items-center gap-3">
              <span className="text-white text-sm font-medium">Suchradius:</span>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="1"
                  max="50"
                  value={radiusKm}
                  onChange={(e) => setRadiusKm(parseInt(e.target.value))}
                  className="w-32 h-2 bg-[#ffbd59]/30 rounded-lg appearance-none cursor-pointer"
                />
                <span className="text-[#ffbd59] text-sm font-bold min-w-[3rem]">{radiusKm} km</span>
              </div>
            </div>
            
            <div className="flex items-center gap-2 flex-wrap">
              <select
                value={geoTradeCategory || ''}
                onChange={(e) => setGeoTradeCategory(e.target.value)}
                className="px-3 py-1.5 bg-white/10 text-white rounded-lg text-sm border border-white/20 focus:outline-none focus:border-[#ffbd59]"
              >
                <option value="">Alle Kategorien</option>
                <option value="electrical">Elektro</option>
                <option value="plumbing">Sanitär</option>
                <option value="heating">Heizung</option>
                <option value="roofing">Dach</option>
                <option value="windows">Fenster/Türen</option>
                <option value="flooring">Boden</option>
                <option value="walls">Wände</option>
                <option value="foundation">Fundament</option>
                <option value="landscaping">Garten</option>
              </select>
              
              <select
                value={geoTradeStatus || ''}
                onChange={(e) => setGeoTradeStatus(e.target.value)}
                className="px-3 py-1.5 bg-white/10 text-white rounded-lg text-sm border border-white/20 focus:outline-none focus:border-[#ffbd59]"
              >
                <option value="">Alle Status</option>
                <option value="planning">Planung</option>
                <option value="cost_estimate">Kostenvoranschlag</option>
                <option value="tender">Ausschreibung</option>
                <option value="bidding">Angebote</option>
                <option value="evaluation">Bewertung</option>
                <option value="awarded">Vergeben</option>
                <option value="in_progress">In Bearbeitung</option>
                <option value="completed">Abgeschlossen</option>
              </select>
            </div>
            
            <div className="flex items-center gap-2">
              <input
                type="number"
                placeholder="Min €"
                value={geoMinBudget || ''}
                onChange={(e) => setGeoMinBudget(e.target.value ? parseInt(e.target.value) : undefined)}
                className="w-20 px-2 py-1.5 bg-white/10 text-white rounded-lg text-sm border border-white/20 focus:outline-none focus:border-[#ffbd59]"
              />
              <span className="text-white text-sm">-</span>
              <input
                type="number"
                placeholder="Max €"
                value={geoMaxBudget || ''}
                onChange={(e) => setGeoMaxBudget(e.target.value ? parseInt(e.target.value) : undefined)}
                className="w-20 px-2 py-1.5 bg-white/10 text-white rounded-lg text-sm border border-white/20 focus:outline-none focus:border-[#ffbd59]"
              />
            </div>
            
            <button
              onClick={performGeoSearch}
              disabled={geoLoading || !currentLocation}
              className="px-4 py-1.5 bg-[#ffbd59] text-[#2c3539] rounded-lg hover:bg-[#ffa726] disabled:opacity-50 text-sm font-medium flex items-center gap-2"
            >
              {geoLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b border-[#2c3539]"></div>
                  Suche...
                </>
              ) : (
                <>
                  <Search size={16} />
                  Suchen
                </>
              )}
            </button>
          </div>
          
          {/* Ergebnisse-Anzeige */}
          {geoTrades.length > 0 && (
            <div className="text-white text-sm mb-4">
              <span className="text-[#ffbd59] font-bold">{geoTrades.length}</span> Gewerke im Radius von <span className="text-[#ffbd59] font-bold">{radiusKm}km</span> gefunden
            </div>
          )}

                    {/* Geo-Search Ergebnisse */}
          {geoTrades.length > 0 && (
            <div className="space-y-4">
              {activeTab === 'list' ? (
                /* Listen-Ansicht */
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {geoTrades.slice(0, 5).map((trade, index) => (
                    <div key={index} className="bg-white/5 rounded-lg p-3 border border-white/10">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="font-medium text-white">{trade.title || 'Gewerk'}</div>
                          <div className="text-sm text-gray-300">{trade.category} • {trade.distance_km.toFixed(1)}km entfernt</div>
                          <div className="text-xs text-gray-400 mt-1">
                            📁 {trade.project_name} ({trade.project_type})
                          </div>
                          <div className="text-xs text-gray-400">
                            📍 {trade.address_street}, {trade.address_zip} {trade.address_city}
                          </div>
                          {trade.budget && (
                            <div className="text-sm text-[#ffbd59] mt-1">Budget: {trade.budget.toLocaleString('de-DE')} €</div>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleTradeDetails(trade)}
                            className="px-3 py-1 bg-blue-500 text-white rounded text-sm font-medium hover:bg-blue-600"
                          >
                            Details
                          </button>
                          <button
                            onClick={() => handleCreateQuote(trade)}
                            className="px-3 py-1 bg-[#ffbd59] text-[#2c3539] rounded text-sm font-medium hover:bg-[#ffa726]"
                          >
                            Angebot abgeben
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {geoTrades.length > 5 && (
                    <div className="text-center">
                      <button
                        onClick={() => navigate('/quotes')}
                        className="text-[#ffbd59] text-sm hover:underline"
                      >
                        Alle {geoTrades.length} Gewerke anzeigen
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                /* Karten-Ansicht */
                <div className="h-64 rounded-lg overflow-hidden">
                  <TradeMap
                    currentLocation={currentLocation}
                    trades={geoTrades}
                    radiusKm={radiusKm}
                    onTradeClick={(trade) => {
                      console.log('📍 Karten-Marker geklickt:', trade);
                      handleTradeDetails(trade);
                    }}
                  />
                </div>
              )}
            </div>
          )}

          {/* Error-Anzeige */}
          {geoError && (
            <div className="bg-red-500/20 border border-red-500/30 text-red-300 px-3 py-2 rounded-lg text-sm">
              {geoError}
            </div>
          )}
        </div>
      )}

      {/* Dienstleister-Aktionen und Tipps */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Aktuelle Aktivitäten */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Clock size={24} className="text-[#ffbd59]" />
            Aktuelle Aktivitäten
          </h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <div className="flex-1">
                <div className="text-sm font-medium text-white">Neues Angebot eingereicht</div>
                <div className="text-xs text-gray-400">Sanitärinstallation - vor 2 Stunden</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
              <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
              <div className="flex-1">
                <div className="text-sm font-medium text-white">Dokument hochgeladen</div>
                <div className="text-xs text-gray-400">Kostenvoranschlag.pdf - vor 4 Stunden</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
              <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
              <div className="flex-1">
                <div className="text-sm font-medium text-white">Ausschreibung verfügbar</div>
                <div className="text-xs text-gray-400">Elektroinstallation - vor 6 Stunden</div>
              </div>
            </div>
          </div>
        </div>

        {/* Tipps für Dienstleister */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Sparkles size={24} className="text-[#ffbd59]" />
            Tipps für mehr Erfolg
            </h3>
          <div className="space-y-4 text-gray-300">
            <div className="flex items-start gap-3">
              <CheckCircle size={16} className="text-green-400 mt-1 flex-shrink-0" />
              <div>
                <div className="font-medium text-white">Vollständige Angebote</div>
                <div className="text-sm">Laden Sie detaillierte PDFs mit Kostenaufschlüsselung hoch</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Clock size={16} className="text-blue-400 mt-1 flex-shrink-0" />
              <div>
                <div className="font-medium text-white">Schnelle Antworten</div>
                <div className="text-sm">Reagieren Sie innerhalb von 24 Stunden auf Ausschreibungen</div>
                  </div>
                </div>
            <div className="flex items-start gap-3">
              <TrendingUp size={16} className="text-purple-400 mt-1 flex-shrink-0" />
              <div>
                <div className="font-medium text-white">Wettbewerbsfähige Preise</div>
                <div className="text-sm">Analysieren Sie Marktpreise für bessere Chancen</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Debug-Info für Dienstleister */}
      <div className="mt-8 text-xs text-gray-400 text-center">
        <p>Debug: User Role: {userRole || user?.user_role}</p>
        <p>Debug: User Type: {user?.user_type}</p>
        <p>Debug: Company: {user?.company_name || 'Nicht gesetzt'}</p>
        <p>Debug: Is Authenticated: {isAuthenticated() ? 'Ja' : 'Nein'}</p>
        <p>Debug: Geo-Search aktiv: {showGeoSearch ? 'Ja' : 'Nein'}</p>
        <p>Debug: Gefundene Gewerke: {geoTrades.length}</p>
        <p>Debug: Last Activity: {stats.lastActivity}</p>
      </div>

      {/* Angebot-Erstellungsformular */}
      {showCostEstimateForm && selectedTradeForQuote && (
        <CostEstimateForm
          isOpen={showCostEstimateForm}
          onClose={() => {
            setShowCostEstimateForm(false);
            setSelectedTradeForQuote(null);
          }}
          onSubmit={handleCostEstimateSubmit}
          trade={selectedTradeForQuote}
          project={{
            id: selectedTradeForQuote.project_id,
            name: selectedTradeForQuote.project_name,
            project_type: selectedTradeForQuote.project_type,
            status: selectedTradeForQuote.project_status
          }}
        />
      )}

      {/* TradeDetailsModal */}
      <TradeDetailsModal
        trade={detailTrade}
        isOpen={showTradeDetails}
        onClose={() => {
          setShowTradeDetails(false);
          setDetailTrade(null);
        }}
        onCreateQuote={handleCreateQuote}
      />
    </div>
  );
} 