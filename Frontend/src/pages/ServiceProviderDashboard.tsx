import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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
  CheckSquare,
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
  Wrench,
  Archive,
  ExternalLink
} from 'lucide-react';
import DashboardCard from '../components/DashboardCard';
import CostEstimateForm from '../components/CostEstimateForm';
import TradeMap from '../components/TradeMap';
import TradeDetailsModal from '../components/TradeDetailsModal';
import CostEstimateDetailsModal from '../components/CostEstimateDetailsModal';
import ServiceProviderQuoteModal from '../components/ServiceProviderQuoteModal';
import ArchivedTrades from '../components/ArchivedTrades';
import InvoiceManagementModal from '../components/InvoiceManagementModal';
import { 
  searchTradesInRadius, 
  type TradeSearchRequest, 
  type TradeSearchResult
} from '../api/geoService';
import { createQuote, getQuotesForMilestone, acceptQuote, rejectQuote, withdrawQuote } from '../api/quoteService';
import { getMilestones, getAllMilestones } from '../api/milestoneService';
import { getProjects } from '../api/projectService';
import logo from '../logo_trans_big.png';
import TradeCreationForm from '../components/TradeCreationForm';

export default function ServiceProviderDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, userRole, isAuthenticated } = useAuth();
  const [isOnline, setIsOnline] = useState(navigator.onLine);



  // Geo-Search State für Dienstleister
  const [showGeoSearch, setShowGeoSearch] = useState(true);

  const [activeTab, setActiveTab] = useState<'list' | 'map'>('map');
  const [manualAddress, setManualAddress] = useState('');
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [showAcceptedTrades, setShowAcceptedTrades] = useState(false);
  const [showArchive, setShowArchive] = useState(false);
  const [showInvoiceManagement, setShowInvoiceManagement] = useState(false);
  
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
  // Gewerk-Erstellung
  const [showTradeCreationForm, setShowTradeCreationForm] = useState(false);
  const [selectedProjectIdForCreation, setSelectedProjectIdForCreation] = useState<number | null>(null);

        // Query-Param getrieben: Neue Ausschreibung
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const create = params.get('create');
    const projectParam = params.get('project');
    if (create === 'trade') {
      if (projectParam) {
        setSelectedProjectIdForCreation(parseInt(projectParam, 10));
      }
      setShowTradeCreationForm(true);
      // 'create' aus URL entfernen, 'project' belassen
      const newParams = new URLSearchParams(location.search);
      newParams.delete('create');
      navigate({ pathname: location.pathname, search: newParams.toString() ? `?${newParams.toString()}` : '' }, { replace: true });
    }
  }, [location.search, navigate]);

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

  // URL-Parameter für automatisches Öffnen des Quote-Forms
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const quoteParam = urlParams.get('quote');
    
    if (quoteParam && (trades.length > 0 || geoTrades.length > 0)) {
      // Finde das Trade mit der ID und öffne das CostEstimateForm
      const tradeId = parseInt(quoteParam);
      if (tradeId && !isNaN(tradeId)) {
        const trade = trades.find(t => t.id === tradeId) || geoTrades.find(t => t.id === tradeId);
        if (trade) {
          console.log('🎯 Öffne CostEstimateForm für Trade:', trade.id, trade.title);
          setSelectedTradeForQuote(trade);
          setShowCostEstimateForm(true);
          
          // Entferne URL-Parameter nach dem Öffnen
          const newUrl = window.location.pathname;
          window.history.replaceState({}, '', newUrl);
        }
      }
    }
  }, [location.search, trades, geoTrades]);

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
    console.log('🔍 loadTrades: Funktion gestartet');
    setIsLoadingTrades(true);
    setError('');
    try {
      console.log('🔍 loadTrades: Lade alle Milestones...');
      // Dienstleister: alle Milestones (Ausschreibungen) global laden
      const tradesData = await getAllMilestones();
      console.log('🔍 loadTrades: Milestones geladen:', tradesData.length, 'Trades');
      setTrades(tradesData);
      
      // Debug: Prüfe ob Error-State korrekt zurückgesetzt wird
      console.log('🔍 loadTrades: Error-State vor Reset:', error);
      console.log('🔍 loadTrades: TradesData erfolgreich geladen, setze Error zurück');
      
      console.log('🔍 loadTrades: Starte loadAllTradeQuotes...');
      // Lade Angebote für alle Gewerke
      await loadAllTradeQuotes(tradesData);
      console.log('🔍 loadTrades: Erfolgreich abgeschlossen');
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
      console.log('🔍 loadAllTradeQuotes: Starte Laden für', tradesData.length, 'Trades');
      const quotesMap: { [tradeId: number]: any[] } = {};
      const quotePromises = tradesData.map(async (trade) => {
        try {
          console.log('🔍 Lade Quotes für Trade ID:', trade.id);
          const quotes = await getQuotesForMilestone(trade.id);
          console.log('🔍 Quotes für Trade', trade.id, ':', quotes.length, 'gefunden', quotes);
          quotesMap[trade.id] = quotes;
        } catch (e: any) {
          console.error('❌ Error loading quotes for trade:', trade.id, e);
          quotesMap[trade.id] = [];
        }
      });
      await Promise.all(quotePromises);
      console.log('🔍 Finale quotesMap:', quotesMap);
      setAllTradeQuotes(quotesMap);
    } catch (e: any) {
      console.error('❌ Error loading all trade quotes:', e);
      setAllTradeQuotes({});
    }
  };

  // Lade Trades beim Komponenten-Mount
  useEffect(() => {
    console.log('🔍 useEffect: Komponente gemountet, starte loadTrades()');
    loadTrades().catch(error => {
      console.error('❌ useEffect: Fehler in loadTrades():', error);
      setError('Fehler beim Laden der Gewerke');
    });
  }, []);

  // Hilfsfunktion: Prüft ob ein Quote dem aktuellen User gehört
  const isUserQuote = (quote: any, user: any): boolean => {
    if (!quote || !user) return false;
    
    console.log('🔍 ServiceProvider isUserQuote Vergleich:', {
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
      console.log('✅ ServiceProvider Quote-User-Match gefunden über ID-Vergleich!');
    } else {
      console.log('❌ ServiceProvider Kein Quote-User-Match über ID-Vergleich');
    }
    
    return isMatch;
  };

  // Prüfe ob der aktuelle Dienstleister bereits ein Angebot für ein Gewerk abgegeben hat
  const hasServiceProviderQuote = (tradeId: number): boolean => {
    if (!user || (user.user_type !== 'service_provider' && user.user_role !== 'DIENSTLEISTER')) {
      return false;
    }
    
    const quotes = allTradeQuotes[tradeId] || [];
    
    // DEBUG: Ausgabe für Analyse
    console.log('🔍 hasServiceProviderQuote DEBUG:', {
      tradeId,
      userId: user.id,
      userIdType: typeof user.id,
      quotesCount: quotes.length,
      quotes: quotes.map(q => ({
        id: q.id,
        service_provider_id: q.service_provider_id,
        service_provider_id_type: typeof q.service_provider_id,
        status: q.status,
        email: q.email,
        company_name: q.company_name,
        contact_person: q.contact_person
      })),
      userObject: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        user_role: user.user_role,
        company_name: user.company_name
      },
      userObjectFull: user
    });
    
    // Verwende die erweiterte isUserQuote Funktion für robuste Erkennung
    const hasQuote = quotes.some(quote => isUserQuote(quote, user));
    
    console.log('🔍 hasServiceProviderQuote RESULT:', { tradeId, hasQuote });
    
    return hasQuote;
  };

  // Prüfe den Status des Angebots des aktuellen Dienstleisters
  const getServiceProviderQuoteStatus = (tradeId: number): string | null => {
    if (!user || (user.user_type !== 'service_provider' && user.user_role !== 'DIENSTLEISTER')) {
      return null;
    }
    
    const quotes = allTradeQuotes[tradeId] || [];
    // Verwende die erweiterte isUserQuote Funktion für robuste Erkennung
    const userQuote = quotes.find(quote => isUserQuote(quote, user));
    

    
    return userQuote ? userQuote.status : null;
  };

  // Hole das Quote-Objekt des aktuellen Dienstleisters für ein Trade
  const getServiceProviderQuote = (tradeId: number): any | null => {
    if (!user || (user.user_type !== 'service_provider' && user.user_role !== 'DIENSTLEISTER')) {
      return null;
    }
    
    const quotes = allTradeQuotes[tradeId] || [];
    // Verwende die erweiterte isUserQuote Funktion für robuste Erkennung
    const userQuote = quotes.find(quote => isUserQuote(quote, user));
    

    
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
    setDetailTrade(trade);
    setShowTradeDetails(true);
  };

  const handleCostEstimateSubmit = async (costEstimateData: any) => {
    if (!selectedTradeForQuote || !user) {
      console.error('❌ Fehlende Daten für Angebotserstellung');
      return;
    }

    try {
      // Angebot über API erstellen
      // WICHTIG: Verwende IMMER die aktuellen User-Daten für Kontaktinformationen
      const quoteData = {
        title: costEstimateData.title || `Angebot für ${selectedTradeForQuote.title}`,
        description: costEstimateData.description || '',
        project_id: selectedTradeForQuote.project_id,
        milestone_id: selectedTradeForQuote.id,
        service_provider_id: user.id, // KRITISCH: Muss user.id sein
        total_amount: parseFloat(costEstimateData.total_amount) || 0,
        currency: costEstimateData.currency || 'CHF', // Standard CHF
        valid_until: costEstimateData.valid_until || '',
        labor_cost: parseFloat(costEstimateData.labor_cost) || 0,
        material_cost: parseFloat(costEstimateData.material_cost) || 0,
        overhead_cost: parseFloat(costEstimateData.overhead_cost) || 0,
        estimated_duration: parseInt(costEstimateData.estimated_duration) || 0,
        start_date: costEstimateData.start_date || '',
        completion_date: costEstimateData.completion_date || '',
        payment_terms: costEstimateData.payment_terms || '30_days',
        warranty_period: parseInt(costEstimateData.warranty_period) || 12,
        // KRITISCH: Verwende IMMER aktuelle User-Daten, nicht Form-Daten
        company_name: user.company_name || costEstimateData.company_name || '',
        contact_person: `${user.first_name} ${user.last_name}`,
        phone: user.phone || costEstimateData.phone || '',
        email: user.email, // IMMER user.email verwenden
        website: user.company_website || costEstimateData.website || ''
      };

      console.log('🔍 Quote-Erstellung mit Daten:', {
        service_provider_id: quoteData.service_provider_id,
        service_provider_id_type: typeof quoteData.service_provider_id,
        email: quoteData.email,
        contact_person: quoteData.contact_person,
        company_name: quoteData.company_name,
        userId: user.id,
        userEmail: user.email
      });

      const newQuote = await createQuote(quoteData);
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

  // Dedizierte Dienstleister-Dashboard-Karten inklusive Todo-Kachel
  const getDashboardCards = () => [
    {
      title: "To Do",
      description: "Aufgabenmanagement & Tracking",
      icon: <CheckSquare size={32} />,
      onClick: () => navigate('/tasks'),
      ariaLabel: "Aufgabenmanagement öffnen",
      badge: { text: `${stats.activeQuotes} offen`, color: "yellow" as const },
      cardId: "tasks",
      path: "/tasks",
      iconString: "<CheckSquare size={16} />",
      children: (
        <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
          <Clock size={16} />
          <span>Stundenerfassung</span>
        </div>
      )
    },
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
      onClick: () => window.location.href = '/invoices',
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
    },
    {
      title: "Archiv",
      description: "Abgeschlossene Gewerke & Historie",
      icon: <Archive size={32} />,
      onClick: () => setShowArchive(true),
      ariaLabel: "Archivierte Gewerke anzeigen",
      badge: { text: "Abgeschlossen", color: "green" as const },
      cardId: "archive",
      path: "/archive",
      iconString: "<Archive size={16} />",
      children: (
        <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
          <CheckCircle size={16} />
          <span>Fertige Projekte einsehen</span>
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

      {/* Dashboard-Karten */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {/* Alle Dashboard-Karten inklusive Todo-Kachel */}
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

              {/* Neue Ausschreibung Modal */}
      {showTradeCreationForm && (
        <TradeCreationForm
          isOpen={showTradeCreationForm}
          onClose={() => setShowTradeCreationForm(false)}
          onSubmit={async () => {
            setShowTradeCreationForm(false);
            try {
              setIsLoadingTrades(true);
              const all = await getAllMilestones();
              setTrades(all || []);
            } catch (e) {
              console.error('Fehler beim Neuladen der Gewerke:', e);
            } finally {
              setIsLoadingTrades(false);
            }
          }}
          projectId={selectedProjectIdForCreation || 0}
        />
      )}

      {/* Angebotsverfahren - Gewerke mit eigenen Angeboten */}
      <div className="mb-8 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 backdrop-blur-xl rounded-2xl p-6 border border-blue-500/30 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl shadow-lg">
              <FileText size={24} className="text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Angebotsverfahren</h2>
              <p className="text-gray-400 text-sm mt-1">
                Gewerke für die Sie bereits Angebote abgegeben haben
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-blue-400">
              {geoTrades.filter(trade => hasServiceProviderQuote(trade.id)).length}
            </div>
            <div className="text-xs text-gray-400">Laufende Angebote</div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {geoTrades
            .filter(trade => hasServiceProviderQuote(trade.id))
            .map((trade) => {
              const quoteStatus = getServiceProviderQuoteStatus(trade.id);
              const quote = getServiceProviderQuote(trade.id);
              
              return (
                <div key={trade.id} className="bg-white/5 rounded-xl p-4 border border-blue-500/20 hover:border-blue-400/40 transition-all duration-300">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-500/20 rounded-lg">
                        {getCategoryIcon(trade.category)}
                      </div>
                      <div>
                        <h3 className="font-semibold text-white text-sm">{trade.title}</h3>
                        <p className="text-gray-400 text-xs">Projekt ID: {trade.project_id}</p>
                      </div>
                    </div>
                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                      quoteStatus === 'accepted' ? 'bg-green-500/20 text-green-400' :
                      quoteStatus === 'under_review' ? 'bg-yellow-500/20 text-yellow-400' :
                      quoteStatus === 'rejected' ? 'bg-red-500/20 text-red-400' :
                      'bg-blue-500/20 text-blue-400'
                    }`}>
                      {getQuoteStatusLabel(quoteStatus || 'draft')}
                    </div>
                  </div>
                  
                  <div className="space-y-2 text-xs text-gray-300">
                    <div className="flex justify-between">
                      <span>Angebotssumme:</span>
                      <span className="font-semibold text-white">
                        {quote?.total_amount ? `${Number(quote.total_amount).toLocaleString('de-DE')} ${quote.currency || 'CHF'}` : 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Eingereicht:</span>
                      <span>{quote?.created_at ? new Date(quote.created_at).toLocaleDateString('de-DE') : 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Entfernung:</span>
                      <span>{trade.distance_km ? `${trade.distance_km.toFixed(1)} km` : 'N/A'}</span>
                    </div>
                  </div>
                  
                  <div className="mt-4 flex gap-2">
                    <button
                      onClick={() => {
                        setDetailTrade(trade);
                        setShowTradeDetails(true);
                      }}
                      className="flex-1 px-3 py-2 bg-blue-500/20 text-blue-300 rounded-lg hover:bg-blue-500/30 transition-colors text-xs font-medium"
                    >
                      Details
                    </button>
                    {quoteStatus === 'draft' && (
                      <button
                        onClick={() => {
                          setSelectedTradeForQuote(trade);
                          setShowCostEstimateForm(true);
                        }}
                        className="flex-1 px-3 py-2 bg-yellow-500/20 text-yellow-300 rounded-lg hover:bg-yellow-500/30 transition-colors text-xs font-medium"
                      >
                        Bearbeiten
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
        </div>
        
        {geoTrades.filter(trade => hasServiceProviderQuote(trade.id)).length === 0 && (
          <div className="text-center py-8">
            <FileText size={48} className="mx-auto mb-4 text-gray-500" />
            <h3 className="text-lg font-semibold text-gray-300 mb-2">Keine laufenden Angebote</h3>
            <p className="text-gray-400 text-sm">
              Sie haben noch keine Angebote für Gewerke abgegeben. Nutzen Sie die Geo-Search unten, um passende Ausschreibungen zu finden.
            </p>
          </div>
        )}
      </div>

      {/* Gewonnene Ausschreibungen - Angenommene Angebote */}
      <div className="mb-8 bg-gradient-to-br from-green-500/10 to-emerald-500/10 backdrop-blur-xl rounded-2xl p-6 border border-green-500/30 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-lg">
              <Award size={24} className="text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Gewonnene Ausschreibungen</h2>
              <p className="text-gray-400 text-sm mt-1">
                Angenommene Angebote und aktive Projekte
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-green-400">
              {geoTrades.filter(trade => getServiceProviderQuoteStatus(trade.id) === 'accepted').length}
            </div>
            <div className="text-xs text-gray-400">Gewonnene Projekte</div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {geoTrades
            .filter(trade => getServiceProviderQuoteStatus(trade.id) === 'accepted')
            .map((trade) => {
              const quote = getServiceProviderQuote(trade.id);
              
              return (
                <div key={trade.id} className="bg-white/5 rounded-xl p-4 border border-green-500/20 hover:border-green-400/40 transition-all duration-300">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-500/20 rounded-lg">
                        {getCategoryIcon(trade.category)}
                      </div>
                      <div>
                        <h3 className="font-semibold text-white text-sm">{trade.title}</h3>
                        <p className="text-gray-400 text-xs">Projekt ID: {trade.project_id}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                      <span className="text-green-400 text-xs font-medium">Aktiv</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2 text-xs text-gray-300">
                    <div className="flex justify-between">
                      <span>Auftragswert:</span>
                      <span className="font-semibold text-green-400">
                        {quote?.total_amount ? `${Number(quote.total_amount).toLocaleString('de-DE')} ${quote.currency || 'CHF'}` : 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Angenommen:</span>
                      <span>{quote?.updated_at ? new Date(quote.updated_at).toLocaleDateString('de-DE') : 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Status:</span>
                      <span className="text-green-400">
                        {getStatusLabel(trade.status)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="mt-4 flex gap-2">
                    <button
                      onClick={() => {
                        setDetailTrade(trade);
                        setShowTradeDetails(true);
                      }}
                      className="flex-1 px-3 py-2 bg-green-500/20 text-green-300 rounded-lg hover:bg-green-500/30 transition-colors text-xs font-medium"
                    >
                      Projekt öffnen
                    </button>
                    <button
                      onClick={() => {
                        // Navigation zu Projektdetails oder Fortschritt
                        window.location.href = `/projects/${trade.project_id}`;
                      }}
                      className="px-3 py-2 bg-blue-500/20 text-blue-300 rounded-lg hover:bg-blue-500/30 transition-colors text-xs font-medium"
                    >
                      <ExternalLink size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
        </div>
        
        {geoTrades.filter(trade => getServiceProviderQuoteStatus(trade.id) === 'accepted').length === 0 && (
          <div className="text-center py-8">
            <Award size={48} className="mx-auto mb-4 text-gray-500" />
            <h3 className="text-lg font-semibold text-gray-300 mb-2">Noch keine gewonnenen Ausschreibungen</h3>
            <p className="text-gray-400 text-sm">
              Sobald Ihre Angebote angenommen werden, erscheinen sie hier als aktive Projekte.
            </p>
          </div>
        )}
      </div>

      {/* Gewerke in Ihrer Nähe - Moderne Geo-Suche */}
      {showGeoSearch && (
        <div className="mb-6 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-2xl hover:shadow-[0_0_30px_rgba(255,189,89,0.15)] transition-all duration-500">
          {/* Modern Header with Glow */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-[#ffbd59] to-[#ffa726] rounded-xl shadow-lg shadow-[#ffbd59]/20">
                <MapPin size={24} className="text-[#2c3539]" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Gewerke in Ihrer Nähe</h2>
                <p className="text-gray-400 text-sm mt-1">
                  {currentLocation ? (
                    <>Finden Sie passende Dienstleister im Umkreis</>  
                  ) : (
                    <>Geben Sie eine Adresse ein oder nutzen Sie Ihren Standort</>  
                  )}
                </p>
              </div>
            </div>
            
            {/* Toolbar: Tabs + Search Icon + Results */}
            <div className="flex items-center gap-3">
              {/* Tabs */}
              <div className="flex items-center p-1 bg-white/10 rounded-xl backdrop-blur-sm">
                <button
                  onClick={() => setActiveTab('list')}
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-300 ${
                    activeTab === 'list'
                      ? 'bg-gradient-to-r from-[#ffbd59] to-[#ffa726] text-[#2c3539] shadow-lg shadow-[#ffbd59]/30 transform scale-105'
                      : 'text-white hover:text-[#ffbd59] hover:bg-white/10'
                  }`}
                >
                  <List size={16} className="inline mr-2" />
                  Liste
                </button>
                <button
                  onClick={() => setActiveTab('map')}
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-300 ${
                    activeTab === 'map'
                      ? 'bg-gradient-to-r from-[#ffbd59] to-[#ffa726] text-[#2c3539] shadow-lg shadow-[#ffbd59]/30 transform scale-105'
                      : 'text-white hover:text-[#ffbd59] hover:bg-white/10'
                  }`}
                >
                  <Map size={16} className="inline mr-2" />
                  Karte
                </button>
              </div>

              {/* Search Icon Button */}
              <button
                onClick={performGeoSearch}
                disabled={geoLoading || !currentLocation}
                title="Gewerke suchen"
                className="p-2.5 rounded-lg bg-gradient-to-r from-[#ffbd59] to-[#ffa726] text-[#2c3539] hover:from-[#ffa726] hover:to-[#ff9800] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-md hover:shadow-xl"
              >
                {geoLoading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#2c3539]"></div>
                ) : (
                  <Search size={18} className="" />
                )}
              </button>

              {/* Results inline */}
              <div className="hidden md:flex items-center text-xs bg-white/10 border border-white/20 text-white rounded-lg px-2 py-1">
                {(() => {
                  const tradeIds = new Set([...geoTrades.map(t => t.id), ...trades.map(t => t.id)]);
                  return (
                    <span>
                      <span className="text-emerald-400 font-semibold mr-1">{tradeIds.size}</span>
                      gefunden{currentLocation ? ` · ${radiusKm}km` : ''}
                    </span>
                  );
                })()}
              </div>
            </div>
          </div>
          
          {/* Modern Location Input with Glow */}
          <div className="bg-white/5 rounded-xl p-4 mb-4 border border-white/10 hover:border-[#ffbd59]/30 transition-all duration-300">
            <label className="text-white text-sm font-medium mb-2 block">📍 Standort festlegen</label>
            <div className="flex items-center gap-3">
              <div className="flex-1 relative">
                <input
                  type="text"
                  placeholder="Straße, PLZ Ort eingeben..."
                  value={manualAddress}
                  onChange={(e) => setManualAddress(e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 text-white rounded-xl text-sm border border-white/20 focus:outline-none focus:border-[#ffbd59] focus:shadow-[0_0_15px_rgba(255,189,89,0.2)] placeholder-white/40 transition-all duration-300"
                />
                {currentLocation && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  </div>
                )}
              </div>
              
              <button
                onClick={handleManualAddressGeocode}
                disabled={isGeocoding || !manualAddress.trim()}
                className="px-5 py-3 bg-gradient-to-r from-[#ffbd59] to-[#ffa726] text-[#2c3539] rounded-xl hover:from-[#ffa726] hover:to-[#ff9800] disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-[#ffbd59]/30"
              >
                {isGeocoding ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#2c3539] inline mr-2"></div>
                    Suche...
                  </>
                ) : (
                  <>
                    <Search size={16} className="inline mr-2" />
                    Suchen
                  </>
                )}
              </button>
              
              <button
                onClick={useOwnLocation}
                disabled={geoLoading}
                className="group px-4 py-3 bg-gradient-to-r from-emerald-500 to-green-500 text-white rounded-xl hover:from-emerald-600 hover:to-green-600 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-emerald-500/30"
                title="Aktuellen Standort verwenden"
              >
                <User size={16} className="group-hover:animate-pulse" />
              </button>
            </div>
          </div>
          
          {/* Modern Search Controls */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {/* Radius Slider with Visual Feedback */}
            <div className="bg-white/5 rounded-xl p-4 border border-white/10 hover:border-[#ffbd59]/30 transition-all duration-300">
              <div className="flex items-center justify-between mb-3">
                <span className="text-white text-sm font-medium">🎯 Suchradius</span>
                <span className="px-3 py-1 bg-gradient-to-r from-[#ffbd59] to-[#ffa726] text-[#2c3539] rounded-full text-sm font-bold shadow-lg shadow-[#ffbd59]/20">
                  {radiusKm} km
                </span>
              </div>
      <div className="relative">
                <input
                  type="range"
                  min="1"
                  max="50"
                  value={radiusKm}
                  onChange={(e) => setRadiusKm(parseInt(e.target.value))}
                  className="w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer slider-thumb"
                  style={{
                    background: `linear-gradient(to right, #10b981 0%, #10b981 ${(radiusKm/50)*100}%, rgba(255,255,255,0.15) ${(radiusKm/50)*100}%, rgba(255,255,255,0.15) 100%)`
                  }}
                />
                <style>{`
                  /* WebKit */
                  .slider-thumb::-webkit-slider-thumb {
                    appearance: none;
                    width: 14px;
                    height: 14px;
                    background: linear-gradient(135deg, #10b981, #34d399);
                    border-radius: 9999px;
                    cursor: pointer;
                    box-shadow: 0 0 8px rgba(16, 185, 129, 0.5);
                    border: 2px solid rgba(255,255,255,0.6);
                    transition: transform 0.2s ease, box-shadow 0.2s ease;
                  }
                  .slider-thumb::-webkit-slider-thumb:hover {
                    transform: scale(1.1);
                    box-shadow: 0 0 14px rgba(16, 185, 129, 0.7);
                  }
                  .slider-thumb::-webkit-slider-runnable-track {
                    height: 4px;
                    border-radius: 9999px;
                  }
                  /* Firefox */
                  .slider-thumb::-moz-range-thumb {
                    width: 14px;
                    height: 14px;
                    background: linear-gradient(135deg, #10b981, #34d399);
                    border: 2px solid rgba(255,255,255,0.6);
                    border-radius: 9999px;
                    box-shadow: 0 0 8px rgba(16,185,129,0.5);
                    transition: transform 0.2s ease, box-shadow 0.2s ease;
                  }
                  .slider-thumb::-moz-range-thumb:hover {
                    transform: scale(1.1);
                    box-shadow: 0 0 14px rgba(16,185,129,0.7);
                  }
                  .slider-thumb::-moz-range-track {
                    height: 4px;
                    background: transparent;
                    border: none;
                    border-radius: 9999px;
                  }
                `}</style>
              </div>
              <div className="flex justify-between mt-2">
                <span className="text-gray-500 text-xs">1 km</span>
                <span className="text-gray-500 text-xs">25 km</span>
                <span className="text-gray-500 text-xs">50 km</span>
              </div>
            </div>
            
            {/* Category Filter with Icons */}
            <div className="bg-white/5 rounded-xl p-4 border border-white/10 hover:border-[#ffbd59]/30 transition-all duration-300">
              <label className="text-white text-sm font-medium mb-3 block">🏗️ Gewerk-Kategorie</label>
              <select
                value={geoTradeCategory || ''}
                onChange={(e) => setGeoTradeCategory(e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-800 text-white rounded-xl text-sm border border-gray-600 focus:outline-none focus:border-[#ffbd59] focus:ring-2 focus:ring-[#ffbd59] transition-all duration-300 cursor-pointer hover:bg-gray-700"
              >
                <option value="">Alle Kategorien</option>
                <option value="electrical">⚡ Elektro</option>
                <option value="plumbing">🚿 Sanitär</option>
                <option value="heating">🔥 Heizung</option>
                <option value="flooring">🏗️ Bodenbelag</option>
                <option value="painting">🎨 Malerei</option>
                <option value="carpentry">🪚 Zimmerei</option>
                <option value="roofing">🏠 Dachdeckerei</option>
                <option value="landscaping">🌳 Garten- & Landschaftsbau</option>
                <option value="civil_engineering">🚧 Tiefbau</option>
                <option value="structural">🏗️ Hochbau</option>
                <option value="interior">🛋️ Innenausbau / Interior</option>
                <option value="facade">🏢 Fassade</option>
                <option value="windows_doors">🪟 Fenster & Türen</option>
                <option value="drywall">🧱 Trockenbau</option>
                <option value="tiling">🧩 Fliesenarbeiten</option>
                <option value="insulation">🧊 Dämmung</option>
                <option value="hvac">🌬️ Klima / Lüftung (HVAC)</option>
                <option value="smart_home">📡 Smart Home</option>
                <option value="site_preparation">🚜 Erdarbeiten / Baustellenvorbereitung</option>
              </select>
            </div>
          </div>
          
          {/* Search Button entfernt, da jetzt in der Toolbar */}
          
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
          
          

          {/* Modern Content Area with Smooth Transitions */}
              {activeTab === 'list' ? (
            <div>
              {(isLoadingTrades || geoLoading) ? (
                <div className="bg-gradient-to-br from-white/5 to-white/10 rounded-2xl p-12 text-center backdrop-blur-sm border border-white/10">
                  <div className="relative">
                    <div className="animate-spin rounded-full h-16 w-16 border-4 border-white/20 border-t-[#ffbd59] mx-auto mb-4"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <MapPin size={24} className="text-[#ffbd59] animate-pulse" />
                    </div>
                  </div>
                  <p className="text-white font-medium">Suche Gewerke in Ihrer Nähe...</p>
                  <p className="text-gray-400 text-sm mt-2">Dies kann einen Moment dauern</p>
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
                    // Verwende die erweiterte isUserQuote Funktion für robuste Erkennung
                    const userQuote = quotes.find(quote => isUserQuote(quote, user));
                    const hasQuote = !!userQuote;
                    const quoteStatus = userQuote?.status || null;

                    return (
                      <div 
                        key={`trade-${trade.id}-${index}`}
                        className={`group relative bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/20 hover:border-[#ffbd59]/50 hover:shadow-[0_0_30px_rgba(255,189,89,0.2)] transition-all duration-500 transform hover:-translate-y-1 cursor-pointer overflow-hidden ${
                          hasQuote ? 'border-[#ffbd59]/50 shadow-lg shadow-[#ffbd59]/10' : ''
                        } ${
                          quoteStatus === 'accepted' 
                            ? 'border-2 border-green-500/40 bg-gradient-to-r from-green-500/5 to-emerald-500/5 shadow-xl shadow-green-500/20' 
                            : quoteStatus === 'under_review'
                            ? 'border-2 border-yellow-500/40 bg-gradient-to-r from-yellow-500/5 to-orange-500/5 shadow-xl shadow-yellow-500/20'
                            : quoteStatus === 'rejected'
                            ? 'border-2 border-red-500/40 bg-gradient-to-r from-red-500/5 to-pink-500/5 shadow-xl shadow-red-500/20'
                            : ''
                        } ${
                          trade.isGeoResult ? 'border-blue-500/30' : ''
                        }`}
                        onClick={() => {
                          console.log('🔍 CLICK DEBUG: Trade clicked', {
                            tradeId: trade.id,
                            tradeTitle: trade.title,
                            userId: user?.id,
                            userRole: user?.user_role
                          });
                          
                          // Prüfe ob der AKTUELLE USER ein Quote für dieses Trade hat
                          const userHasQuote = hasServiceProviderQuote(trade.id);
                          // Verwende die erweiterte isUserQuote Funktion für robuste Erkennung
                          const userQuote = (allTradeQuotes[trade.id] || []).find((q: any) => isUserQuote(q, user));
                          
                          console.log('🔍 OPENING TradeDetailsModal', {
                            userHasQuote,
                            userQuote: userQuote?.id,
                            settingDetailTrade: trade.id,
                            settingShowTradeDetails: true
                          });
                          
                          // TEMPORÄR: Immer TradeDetailsModal öffnen für neue Baufortschrittsfunktionalität
                          setDetailTrade(trade);
                          setShowTradeDetails(true);
                          
                          // ORIGINAL LOGIK (auskommentiert):
                          // if (userHasQuote && userQuote) {
                          //   //   setSelectedTradeForCostEstimateDetails(trade);
                          //   setShowCostEstimateDetailsModal(true);
                          // } else {
                          //   //   setDetailTrade(trade);
                          //   setShowTradeDetails(true);
                          // }
                        }}
                      >
                        {/* Hover Glow Effect */}
                        <div className="absolute inset-0 bg-gradient-to-r from-[#ffbd59]/0 to-[#ffa726]/0 group-hover:from-[#ffbd59]/5 group-hover:to-[#ffa726]/5 transition-all duration-500 pointer-events-none"></div>
                        
                        {/* Status Badge Overlay - Top Right */}
                        {hasQuote && (
                          <div className="absolute top-3 right-3 z-20">
                            <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border backdrop-blur-sm ${
                              quoteStatus === 'accepted' 
                                ? 'bg-green-500/20 text-green-300 border-green-500/40 shadow-lg shadow-green-500/20' 
                                : quoteStatus === 'under_review'
                                ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40 shadow-lg shadow-yellow-500/20'
                                : quoteStatus === 'rejected'
                                ? 'bg-red-500/20 text-red-300 border-red-500/40 shadow-lg shadow-red-500/20'
                                : 'bg-blue-500/20 text-blue-300 border-blue-500/40 shadow-lg shadow-blue-500/20'
                            }`}>
                              <div className={`w-2 h-2 rounded-full ${
                                quoteStatus === 'accepted' ? 'bg-green-400 animate-pulse' :
                                quoteStatus === 'under_review' ? 'bg-yellow-400 animate-pulse' :
                                quoteStatus === 'rejected' ? 'bg-red-400' :
                                'bg-blue-400'
                              }`}></div>
                              <span>
                                {quoteStatus === 'accepted' ? 'Gewonnen' :
                                 quoteStatus === 'under_review' ? 'In Prüfung' :
                                 quoteStatus === 'rejected' ? 'Abgelehnt' :
                                 'Angebot'}
                              </span>
                            </div>
                          </div>
                        )}
                        
                        {/* Modern Geo-Badge with Glow */}
                        {trade.isGeoResult && (
                          <div className="flex items-center gap-2 mb-3">
                            <div className="flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-blue-500/20 to-blue-400/20 rounded-full border border-blue-400/30">
                              <MapPin size={14} className="text-blue-400 animate-pulse" />
                              <span className="text-blue-400 text-xs font-medium">
                                {trade.distance_km?.toFixed(1)}km entfernt
                              </span>
                            </div>
                            {trade.project_name && (
                              <span className="text-gray-400 text-xs">
                                {trade.project_name}
                              </span>
                            )}
                          </div>
                        )}

                        <div className="flex items-start justify-between mb-4 relative z-10">
                          <div className="flex items-center gap-3">
                            <div className="p-3 bg-gradient-to-br from-[#ffbd59] to-[#ffa726] rounded-xl shadow-lg shadow-[#ffbd59]/20 group-hover:shadow-[#ffbd59]/40 transition-all duration-300 group-hover:scale-110">
                              {getCategoryIcon(trade.category || '')}
                            </div>
                            <div>
                              <h3 className="text-lg font-bold text-white group-hover:text-[#ffbd59] transition-all duration-300">
                                {trade.title}
                              </h3>
                              <p className="text-gray-300 text-sm mt-1">{trade.description}</p>
                              {trade.isGeoResult && trade.address_street && (
                                <p className="text-gray-400 text-xs mt-2 flex items-center gap-1">
                                  <MapPin size={12} className="text-gray-500" />
                                  {trade.address_street}, {trade.address_zip} {trade.address_city}
                                </p>
                              )}
                          </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`px-3 py-1.5 rounded-full text-xs font-medium backdrop-blur-sm ${getStatusColor(trade.status)} shadow-lg`}>
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
                /* Modern Map View with Glow */
                <div className="h-[50vh] min-h-[400px] rounded-2xl overflow-hidden border border-white/20 shadow-2xl hover:shadow-[0_0_40px_rgba(255,189,89,0.2)] transition-all duration-500">
                  <TradeMap
                    currentLocation={currentLocation}
                    trades={geoTrades}
                    radiusKm={radiusKm}
                    onTradeClick={(trade) => {
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
        existingQuotes={(() => {
          const quotes = detailTrade ? (allTradeQuotes[detailTrade.id] || []) : [];
          console.log('🔍 DEBUG: Übergabe an TradeDetailsModal', {
            tradeId: detailTrade?.id,
            quotesLength: quotes.length,
            quotes: quotes.map(q => ({
              id: q.id,
              service_provider_id: q.service_provider_id,
              service_provider_id_type: typeof q.service_provider_id,
              status: q.status
            })),
            userId: user?.id,
            userIdType: typeof user?.id
          });
          return quotes;
        })()}
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

      {/* Archiv Modal */}
      {showArchive && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#2c3539] rounded-2xl shadow-2xl border border-white/20 max-w-7xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <h2 className="text-xl font-bold text-white">Archivierte Gewerke</h2>
              <button
                onClick={() => setShowArchive(false)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <XCircle size={24} className="text-gray-400" />
              </button>
            </div>
            <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
              <ArchivedTrades />
            </div>
          </div>
        </div>
      )}

      {/* Rechnungsmanagement Modal */}
      {showInvoiceManagement && (
        <InvoiceManagementModal
          isOpen={showInvoiceManagement}
          onClose={() => setShowInvoiceManagement(false)}
        />
      )}
    </div>
  );
} 
