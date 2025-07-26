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
  RefreshCw,
  // Zusätzliche Icons für Quotes-Integration
  Eye,
  Edit,
  Trash2,
  Upload,
  Download,
  Send,
  XCircle,
  Award,
  Gavel,
  Ban,
  RotateCcw,
  Plus,
  Calendar,
  Target,
  Building,
  Shield,
  Star,
  Wrench
} from 'lucide-react';
import DashboardCard from '../components/DashboardCard';
import CostEstimateForm from '../components/CostEstimateForm';
import TradeMap from '../components/TradeMap';
import TradeDetailsModal from '../components/TradeDetailsModal';
import CostEstimateDetailsModal from '../components/CostEstimateDetailsModal';
import ServiceProviderQuoteModal from '../components/ServiceProviderQuoteModal';
import { 
  searchTradesInRadius, 
  type TradeSearchRequest, 
  type TradeSearchResult
} from '../api/geoService';
import { createQuote, getQuotesForMilestone, acceptQuote, rejectQuote, withdrawQuote } from '../api/quoteService';
import { getMilestones, getAllMilestones } from '../api/milestoneService';
import { getProjects } from '../api/projectService';
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

  // Quotes-Integration State
  const [trades, setTrades] = useState<any[]>([]);
  const [isLoadingTrades, setIsLoadingTrades] = useState(true);
  const [allTradeQuotes, setAllTradeQuotes] = useState<{ [tradeId: number]: any[] }>({});
  const [selectedTrade, setSelectedTrade] = useState<any | null>(null);
  const [showQuotesModal, setShowQuotesModal] = useState(false);
  const [showCostEstimateDetailsModal, setShowCostEstimateDetailsModal] = useState(false);
  const [selectedTradeForCostEstimateDetails, setSelectedTradeForCostEstimateDetails] = useState<any | null>(null);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

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

  // Lade Trades und Quotes für Dienstleister
  const loadTrades = async () => {
    setIsLoadingTrades(true);
    setError('');
    try {
      // Dienstleister: alle Milestones (Ausschreibungen) global laden
      const tradesData = await getAllMilestones();
      setTrades(tradesData);
      
      // Lade Angebote für alle Gewerke
      await loadAllTradeQuotes(tradesData);
    } catch (err: any) {
      console.error('❌ Error in loadTrades:', err);
      setError('Fehler beim Laden der Gewerke');
    } finally {
      setIsLoadingTrades(false);
    }
  };

  // Lade Angebote für alle Gewerke
  const loadAllTradeQuotes = async (tradesData: any[]) => {
    try {
      const quotesMap: { [tradeId: number]: any[] } = {};
      const quotePromises = tradesData.map(async (trade) => {
        try {
          const quotes = await getQuotesForMilestone(trade.id);
          quotesMap[trade.id] = quotes;
        } catch (e: any) {
          console.error('❌ Error loading quotes for trade:', trade.id, e);
          quotesMap[trade.id] = [];
        }
      });
      await Promise.all(quotePromises);
      setAllTradeQuotes(quotesMap);
    } catch (e: any) {
      console.error('❌ Error loading all trade quotes:', e);
      setAllTradeQuotes({});
    }
  };

  // Lade Trades beim Komponenten-Mount
  useEffect(() => {
    loadTrades();
  }, []);

  // Prüfe ob der aktuelle Dienstleister bereits ein Angebot für ein Gewerk abgegeben hat
  const hasServiceProviderQuote = (tradeId: number): boolean => {
    if (!user || (user.user_type !== 'service_provider' && user.user_role !== 'DIENSTLEISTER')) {
      console.log('🔍 hasServiceProviderQuote: User ist kein Dienstleister oder nicht vorhanden', {
        user_type: user?.user_type,
        user_role: user?.user_role
      });
      return false;
    }
    
    const quotes = allTradeQuotes[tradeId] || [];
    const hasQuote = quotes.some(quote => quote.service_provider_id === user.id);
    console.log(`🔍 hasServiceProviderQuote: Trade ${tradeId}, User ${user.id}, hasQuote: ${hasQuote}`);
    return hasQuote;
  };

  // Prüfe den Status des Angebots des aktuellen Dienstleisters
  const getServiceProviderQuoteStatus = (tradeId: number): string | null => {
    if (!user || (user.user_type !== 'service_provider' && user.user_role !== 'DIENSTLEISTER')) {
      return null;
    }
    
    const quotes = allTradeQuotes[tradeId] || [];
    const userQuote = quotes.find(quote => quote.service_provider_id === user.id);
    return userQuote ? userQuote.status : null;
  };

  // Hole das Quote-Objekt des aktuellen Dienstleisters für ein Trade
  const getServiceProviderQuote = (tradeId: number): any | null => {
    if (!user || (user.user_type !== 'service_provider' && user.user_role !== 'DIENSTLEISTER')) {
      return null;
    }
    
    const quotes = allTradeQuotes[tradeId] || [];
    const userQuote = quotes.find(quote => quote.service_provider_id === user.id);
    console.log(`🔍 getServiceProviderQuote: Trade ${tradeId}, User ${user.id}, Quote:`, userQuote);
    return userQuote || null;
  };

  // Utility-Funktionen
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Nicht festgelegt';
    return new Date(dateString).toLocaleDateString('de-DE');
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'planning': return 'Planung';
      case 'cost_estimate': return 'Kostenvoranschlag';
      case 'tender': return 'Ausschreibung';
      case 'bidding': return 'Angebote';
      case 'evaluation': return 'Bewertung';
      case 'awarded': return 'Vergeben';
      case 'in_progress': return 'In Bearbeitung';
      case 'completed': return 'Abgeschlossen';
      case 'delayed': return 'Verzögert';
      case 'cancelled': return 'Storniert';
      default: return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planning': return 'bg-blue-100 text-blue-800';
      case 'cost_estimate': return 'bg-yellow-100 text-yellow-800';
      case 'tender': return 'bg-purple-100 text-purple-800';
      case 'bidding': return 'bg-orange-100 text-orange-800';
      case 'evaluation': return 'bg-pink-100 text-pink-800';
      case 'awarded': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-cyan-100 text-cyan-800';
      case 'completed': return 'bg-emerald-100 text-emerald-800';
      case 'delayed': return 'bg-red-100 text-red-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      case 'planned': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getQuoteStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'text-gray-400';
      case 'submitted': return 'text-blue-400';
      case 'under_review': return 'text-yellow-400';
      case 'accepted': return 'text-green-400';
      case 'rejected': return 'text-red-400';
      case 'expired': return 'text-gray-400';
      default: return 'text-gray-400';
    }
  };

  const getQuoteStatusLabel = (status: string) => {
    switch (status) {
      case 'draft': return 'Entwurf';
      case 'submitted': return 'Eingereicht';
      case 'under_review': return 'In Prüfung';
      case 'accepted': return 'Angenommen';
      case 'rejected': return 'Abgelehnt';
      case 'expired': return 'Abgelaufen';
      default: return status;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category?.toLowerCase()) {
      case 'electrical':
      case 'elektro':
        return <Wrench size={20} className="text-white" />;
      case 'plumbing':
      case 'sanitaer':
        return <Wrench size={20} className="text-white" />;
      case 'heating':
      case 'heizung':
        return <Wrench size={20} className="text-white" />;
      default:
        return <Building size={20} className="text-white" />;
    }
  };

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
      
      // Alle Daten aktualisieren: sowohl Geo-Search als auch lokale Trades
      const updatePromises = [];
      
      // Geo-Search aktualisieren
      if (currentLocation) {
        updatePromises.push(performGeoSearch());
      }
      
      // Lokale Trades und Quotes aktualisieren
      updatePromises.push(loadTrades());
      
      // Beide Updates parallel ausführen
      await Promise.all(updatePromises);
      
      console.log('✅ Alle Daten aktualisiert nach Angebotserstellung');
      
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
              <span className="text-white font-medium">Kostenvoranschläge & Geo-Suche</span>
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
          
          {/* Error Banner */}
          {error && (
            <div className="bg-red-500/20 border border-red-500/30 text-red-300 px-4 py-3 flex items-center justify-between mb-4 rounded-lg">
              <div className="flex items-center gap-3">
                <AlertTriangle size={16} />
                <span className="text-sm">{error}</span>
              </div>
              <button onClick={() => setError('')} className="text-red-300 hover:text-red-100">
                <XCircle size={16} />
              </button>
            </div>
          )}

          {/* Success Banner */}
          {success && (
            <div className="bg-green-500/20 border border-green-500/30 text-green-300 px-4 py-3 flex items-center justify-between mb-4 rounded-lg">
              <div className="flex items-center gap-3">
                <CheckCircle size={16} />
                <span className="text-sm">{success}</span>
              </div>
              <button onClick={() => setSuccess('')} className="text-green-300 hover:text-green-100">
                <XCircle size={16} />
              </button>
            </div>
          )}
          
          {/* Ergebnisse-Anzeige */}
          {(geoTrades.length > 0 || trades.length > 0) && (
            <div className="text-white text-sm mb-4">
              {(() => {
                // Berechne deduplizierte Anzahl
                const tradeIds = new Set([...geoTrades.map(t => t.id), ...trades.map(t => t.id)]);
                return (
                  <>
                    <span className="text-[#ffbd59] font-bold">{tradeIds.size}</span> Gewerke gefunden 
                    {currentLocation && (
                      <span> im Radius von <span className="text-[#ffbd59] font-bold">{radiusKm}km</span></span>
                    )}
                    {geoTrades.length > 0 && trades.length > 0 && (
                      <span className="text-gray-400 ml-2">
                        ({geoTrades.length} Geo + {trades.length} Lokal, {tradeIds.size} eindeutig)
                      </span>
                    )}
                  </>
                );
              })()}
            </div>
          )}

          {/* Kombinierte Gewerke-Darstellung im Quotes-Stil */}
              {activeTab === 'list' ? (
            <div>
              {(isLoadingTrades || geoLoading) ? (
                <div className="bg-white/5 rounded-2xl p-12 text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#ffbd59] mx-auto mb-4"></div>
                  <p className="text-white">Lade Gewerke...</p>
                          </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Kombiniere und dedupliziere Geo-Trades und lokale Trades */}
                  {(() => {
                    // Erstelle eine Map für Deduplizierung basierend auf ID
                    const tradeMap: { [key: number]: any } = {};
                    
                    // Füge Geo-Trades hinzu (haben Priorität wegen Distanz-Info)
                    geoTrades.forEach(trade => {
                      tradeMap[trade.id] = {...trade, isGeoResult: true};
                    });
                    
                    // Füge lokale Trades hinzu (nur wenn nicht bereits vorhanden)
                    trades.forEach(trade => {
                      if (!tradeMap[trade.id]) {
                        tradeMap[trade.id] = {...trade, isGeoResult: false};
                      }
                    });
                    
                    return Object.values(tradeMap);
                  })().map((trade: any, index: number) => {
                    const quotes = allTradeQuotes[trade.id] || [];
                    const userQuote = quotes.find(quote => quote.service_provider_id === user?.id);
                    const hasQuote = !!userQuote;
                    const quoteStatus = userQuote?.status || null;

                    return (
                      <div 
                        key={`trade-${trade.id}-${index}`}
                        className={`group bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-2xl cursor-pointer ${
                          hasQuote ? 'border-[#ffbd59]/50' : ''
                        } ${
                          quoteStatus === 'accepted' 
                            ? 'border-2 border-green-500/40 bg-gradient-to-r from-green-500/5 to-emerald-500/5 shadow-lg shadow-green-500/10' 
                            : ''
                        } ${
                          trade.isGeoResult ? 'border-blue-500/30' : ''
                        }`}
                        onClick={() => {
                          console.log('🔍 Trade-Kachel geklickt:', trade);
                          console.log('🔍 Verfügbare Quotes:', quotes);
                          console.log('🔍 AllTradeQuotes:', allTradeQuotes);
                          console.log('🔍 User:', user);
                          
                          // Prüfe ob der AKTUELLE USER ein Quote für dieses Trade hat
                          const userHasQuote = hasServiceProviderQuote(trade.id);
                          const userQuote = (allTradeQuotes[trade.id] || []).find((q: any) => q.service_provider_id === user?.id);
                          
                          console.log('🔍 User hat Quote:', userHasQuote);
                          console.log('🔍 Eigenes Quote:', userQuote);
                          
                          if (userHasQuote && userQuote) {
                            console.log('✅ User hat eigenes Quote - öffne ServiceProviderQuoteModal');
                            setSelectedTradeForCostEstimateDetails(trade);
                            setShowCostEstimateDetailsModal(true);
                          } else {
                            console.log('⚠️ User hat kein Quote - öffne TradeDetailsModal zum Erstellen');
                            setDetailTrade(trade);
                            setShowTradeDetails(true);
                          }
                        }}
                      >
                        {/* Geo-Badge */}
                        {trade.isGeoResult && (
                          <div className="flex items-center gap-2 mb-3">
                            <MapPin size={16} className="text-blue-400" />
                            <span className="text-blue-400 text-sm font-medium">
                              {trade.distance_km?.toFixed(1)}km entfernt
                            </span>
                            {trade.project_name && (
                              <span className="text-gray-400 text-sm">
                                • {trade.project_name}
                              </span>
                            )}
                          </div>
                        )}

                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-gradient-to-br from-[#ffbd59] to-[#ffa726] rounded-xl">
                              {getCategoryIcon(trade.category || '')}
                            </div>
                            <div>
                              <h3 className="text-lg font-semibold text-white group-hover:text-[#ffbd59] transition-colors">
                                {trade.title}
                              </h3>
                              <p className="text-gray-300 text-sm">{trade.description}</p>
                              {trade.isGeoResult && trade.address_street && (
                                <p className="text-gray-400 text-xs mt-1">
                            📍 {trade.address_street}, {trade.address_zip} {trade.address_city}
                                </p>
                              )}
                          </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(trade.status)}`}>
                              {getStatusLabel(trade.status)}
                            </span>
                          </div>
                        </div>

                        {/* Erweiterte Informationen Grid */}
                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div>
                            <p className="text-gray-400 text-sm">Kategorie</p>
                            <span className="text-white text-sm font-medium">
                              {trade.category || 'Unbekannt'}
                            </span>
                          </div>
                          <div>
                            <p className="text-gray-400 text-sm">Budget</p>
                            <span className="text-white text-sm font-medium">
                              {trade.budget ? formatCurrency(trade.budget) : 'Nicht festgelegt'}
                            </span>
                          </div>
                          <div>
                            <p className="text-gray-400 text-sm">Priorität</p>
                            <span className="text-white text-sm font-medium">
                              {trade.priority || 'Normal'}
                            </span>
                          </div>
                          <div>
                            <p className="text-gray-400 text-sm">Besichtigung</p>
                            <div className="flex items-center gap-1">
                              {trade.requires_inspection ? (
                                <>
                                  <Eye size={14} className="text-orange-400" />
                                  <span className="text-orange-400 text-sm font-medium">Erforderlich</span>
                                </>
                              ) : (
                                <>
                                  <XCircle size={14} className="text-gray-400" />
                                  <span className="text-gray-400 text-sm font-medium">Nicht erforderlich</span>
                                </>
                          )}
                        </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-sm text-gray-300 mb-4">
                          <div className="flex items-center gap-4">
                            <span>📅 {formatDate(trade.planned_date || trade.start_date)}</span>
                            <span>📊 {(() => {
                              // Verwende Quote-Stats aus Backend wenn verfügbar, sonst aus allTradeQuotes
                              const quoteCount = trade.quote_stats?.total_quotes ?? quotes.length;
                              return `${quoteCount} Angebote`;
                            })()} </span>
                            {trade.isGeoResult && trade.distance_km && (
                              <span>📍 {trade.distance_km.toFixed(1)}km</span>
                            )}
                          </div>
                        </div>

                        {/* Angebot-Status */}
                        <div className="pt-4 border-t border-white/10">
                          <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                              {hasQuote ? (
                                <div className="flex items-center gap-2">
                                  <span className="text-sm text-gray-400">Ihr Angebot:</span>
                                  <span className={`text-sm font-medium ${getQuoteStatusColor(quoteStatus || '')}`}>
                                    {getQuoteStatusLabel(quoteStatus || '')}
                                  </span>
                                  {userQuote && (
                                    <span className="text-[#ffbd59] text-sm font-bold">
                                      {formatCurrency(userQuote.total_amount)}
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <span className="text-sm text-gray-400">Noch kein Angebot abgegeben</span>
                              )}
                            </div>
                            
                            {!hasQuote && (
                          <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCreateQuote(trade);
                                }}
                                className="px-4 py-2 bg-[#10b981] text-white rounded-lg hover:bg-[#059669] transition-colors text-sm font-medium flex items-center gap-2"
                              >
                                <Plus size={16} />
                            Angebot abgeben
                          </button>
                            )}
                        </div>
                      </div>
                    </div>
                    );
                  })}
                    </div>
                  )}
                </div>
              ) : (
                /* Karten-Ansicht */
            <div className="h-96 rounded-lg overflow-hidden">
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

          {/* Error-Anzeige */}
          {geoError && (
            <div className="bg-red-500/20 border border-red-500/30 text-red-300 px-3 py-2 rounded-lg text-sm mt-4">
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

      {/* ServiceProviderQuoteModal für Dienstleister - zeigt nur das eigene Angebot */}
      {showCostEstimateDetailsModal && selectedTradeForCostEstimateDetails && (
        <ServiceProviderQuoteModal
          isOpen={showCostEstimateDetailsModal}
          onClose={() => {
            setShowCostEstimateDetailsModal(false);
            setSelectedTradeForCostEstimateDetails(null);
          }}
          trade={selectedTradeForCostEstimateDetails}
          quote={getServiceProviderQuote(selectedTradeForCostEstimateDetails.id)}
          project={{
            id: selectedTradeForCostEstimateDetails.project_id,
            name: selectedTradeForCostEstimateDetails.project_name || `Projekt ${selectedTradeForCostEstimateDetails.project_id}`,
            description: selectedTradeForCostEstimateDetails.description || '',
            location: selectedTradeForCostEstimateDetails.project?.location || 'Nicht angegeben',
            owner_name: selectedTradeForCostEstimateDetails.project?.owner_name || 'Nicht angegeben'
          }}

        />
      )}
    </div>
  );
} 