import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useOnboarding } from '../context/OnboardingContext';
import EnhancedGuidedTour from '../components/Onboarding/EnhancedGuidedTour';
import ResourceDetailsModal from '../components/ResourceDetailsModal';
import { 
  FileText, 
  User, 
  Euro, 
  Sparkles,
  TrendingUp,
  Clock,
  CheckCircle,
  CheckSquare,
  AlertTriangle,
  AlertCircle,
  MapPin,
  Search,
  Map,
  RefreshCw,
  XCircle,
  Award,
  Gavel,
  Plus,
  Building,
  Wrench,
  Archive,
  ExternalLink,
  Users,
  Calendar,
  BarChart,
  ChevronDown,
  Mail
} from 'lucide-react';

import CostEstimateForm from '../components/CostEstimateForm';
import TradeMap from '../components/TradeMap';
import TradeDetailsModal from '../components/TradeDetailsModal';
import AddressAutocomplete from '../components/AddressAutocomplete';
// import CostEstimateDetailsModal from '../components/CostEstimateDetailsModal';
import ServiceProviderQuoteModal from '../components/ServiceProviderQuoteModal';
import ArchivedTrades from '../components/ArchivedTrades';
import InvoiceManagementModal from '../components/InvoiceManagementModal';
import ResourceManagementModal from '../components/ResourceManagementModal';
import ResourceCalendar from '../components/ResourceCalendar';
import ResourceKPIDashboard from '../components/ResourceKPIDashboard';
import ServiceProviderDocumentTab from '../components/ServiceProviderDocumentTab';
import NotificationTab from '../components/NotificationTab';
import ContactTab from '../components/ContactTab';
import UserRankDisplay from '../components/UserRankDisplay';
import TaskCreationModal from '../components/TaskCreationModal';

import KanbanBoard from '../components/KanbanBoard';
import { 
  searchTradesInRadius, 
  geocodeAddress,
  type TradeSearchRequest, 
  type TradeSearchResult
} from '../api/geoService';
import { getApiBaseUrl } from '../api/api';
import { createQuote, getQuotesForMilestone, acceptQuote, rejectQuote, withdrawQuote, getQuotes } from '../api/quoteService';
import { getMilestones, getAllMilestones } from '../api/milestoneService';
import { getProjects } from '../api/projectService';
import { resourceService, type ResourceAllocation } from '../api/resourceService';
import { checkAccountStatus, type AccountStatus } from '../api/buildwiseFeeService';
import { TRADE_CATEGORIES } from '../constants/tradeCategories';
import logo from '../logo_trans_big.png';
import TradeCreationForm from '../components/TradeCreationForm';

export default function ServiceProviderDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, userRole, isAuthenticated } = useAuth();
  const { showTour, setShowTour, shouldDisableUI, userRole: onboardingUserRole, completeTour } = useOnboarding();
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // CSS for blinking glow effect
  React.useEffect(() => {
    const style = document.createElement('style');
    style.setAttribute('data-component', 'ServiceProviderDashboard');
    style.textContent = `
      @keyframes glow-blink {
        0% {
          box-shadow: 0 0 20px rgba(251, 191, 36, 0.8), 0 0 40px rgba(251, 191, 36, 0.6), 0 0 60px rgba(251, 191, 36, 0.4);
          border-color: rgba(251, 191, 36, 0.8);
        }
        100% {
          box-shadow: 0 0 30px rgba(251, 191, 36, 1), 0 0 60px rgba(251, 191, 36, 0.8), 0 0 90px rgba(251, 191, 36, 0.6);
          border-color: rgba(251, 191, 36, 1);
        }
      }
    `;
    
    try {
      document.head.appendChild(style);
    } catch (error) {
      console.error('Failed to append ServiceProviderDashboard styles:', error);
    }
    
    return () => {
      try {
        if (style.parentNode === document.head) {
          document.head.removeChild(style);
        }
      } catch (error) {
        console.warn('Failed to remove ServiceProviderDashboard styles:', error);
      }
    };
  }, []);



  // Geo-Search State für Dienstleister
  const [showGeoSearch, setShowGeoSearch] = useState(true);

  const [activeTab, setActiveTab] = useState<'rows' | 'cards' | 'map'>('map');
  const [manualAddress, setManualAddress] = useState('');
  const [isGeocoding, setIsGeocoding] = useState(false);
  
  // Adressvorschlag State
  const [selectedAddress, setSelectedAddress] = useState({
    address_street: '',
    address_zip: '',
    address_city: '',
    address_country: 'Deutschland'
  });

  // Mobile Optimierung: Wechsle zu Zeilen-Ansicht auf mobilen Geräten
  useEffect(() => {
    const handleResize = () => {
      const isMobile = window.innerWidth < 768; // md breakpoint
      if (isMobile && activeTab === 'cards') {
        setActiveTab('rows');
      }
    };

    // Initial check
    handleResize();

    // Listen for resize events
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [activeTab]);
  const [showAcceptedTrades, setShowAcceptedTrades] = useState(false);
  const [showArchive, setShowArchive] = useState(false);
  const [showInvoiceManagement, setShowInvoiceManagement] = useState(false);
  const [showResourceManagement, setShowResourceManagement] = useState(false);
  const [selectedResourceForDetails, setSelectedResourceForDetails] = useState<any>(null);
  const [showResourceDetailsModal, setShowResourceDetailsModal] = useState(false);
  const [resourceToDelete, setResourceToDelete] = useState<any>(null);
  const [showResourceCalendar, setShowResourceCalendar] = useState(false);
  const [showResourceKPIs, setShowResourceKPIs] = useState(false);
  const [showTaskCreation, setShowTaskCreation] = useState(false);
  const [showResourceDetails, setShowResourceDetails] = useState(true);
  const [showResourceSection, setShowResourceSection] = useState(false);
  const [userResources, setUserResources] = useState<any[]>([]);
  const [resourceAllocations, setResourceAllocations] = useState<ResourceAllocation[]>([]);
  const [resourceStats, setResourceStats] = useState({
    totalEmployees: 0,
    totalPersonDays: 0,
    totalHours: 0,
    utilization: 0
  });
  
  // State für Account-Status und überfällige Zahlungen
  const [accountStatus, setAccountStatus] = useState<AccountStatus | null>(null);
  const [isCheckingAccountStatus, setIsCheckingAccountStatus] = useState(false);
  
  // State für erweiterte Beschreibungen in Kacheln
  const [expandedDescriptions, setExpandedDescriptions] = useState<Set<number>>(new Set());
  
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
  
  // Service Provider Angebote und zugehörige Trades
  const [serviceProviderQuotes, setServiceProviderQuotes] = useState<any[]>([]);
  const [serviceProviderTrades, setServiceProviderTrades] = useState<TradeSearchResult[]>([]);
  
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

  // State für eingeklappte abgeschlossene Projekte (standardmäßig eingeklappt)
  const [isCompletedProjectsExpanded, setIsCompletedProjectsExpanded] = useState(false);
  const [geoSearchExpanded, setGeoSearchExpanded] = useState(false); // State für erweiterte Geo-Search

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
  const [tradesError, setTradesError] = useState('');
  
  // Rechnungs-State für abgeschlossene Projekte
  const [tradeInvoices, setTradeInvoices] = useState<{ [tradeId: number]: any }>({});
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

  // Query-Param getrieben: Ressourcenmanagement Modal
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const showResourceManagementParam = params.get('showResourceManagement');
    if (showResourceManagementParam === 'true') {
      setShowResourceManagement(true);
      // 'showResourceManagement' aus URL entfernen
      const newParams = new URLSearchParams(location.search);
      newParams.delete('showResourceManagement');
      navigate({ pathname: location.pathname, search: newParams.toString() ? `?${newParams.toString()}` : '' }, { replace: true });
    }
  }, [location.search, navigate]);

  // Query-Param getrieben: Task-Erstellung Modal
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const createTaskParam = params.get('create');
    if (createTaskParam === 'task') {
      setShowTaskCreation(true);
      // 'create' aus URL entfernen
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

  // Lade Ressourcen des Benutzers
  useEffect(() => {
    if (user?.id) {
      loadUserResources();
    }
  }, [user?.id]);

  // Hilfsfunktion: Übersetzt englische Kategorien ins Deutsche
  const translateCategory = (category: string) => {
    const translations: { [key: string]: string } = {
      'drywall': 'Trockenbau',
      'plumbing': 'Sanitär',
      'electrical': 'Elektro',
      'carpentry': 'Zimmerei',
      'painting': 'Malerarbeiten',
      'flooring': 'Bodenbeläge',
      'roofing': 'Dacharbeiten',
      'concrete': 'Betonarbeiten',
      'masonry': 'Mauerarbeiten',
      'insulation': 'Dämmung',
      'hvac': 'Heizung/Lüftung',
      'landscaping': 'Gartenbau',
      'excavation': 'Erdarbeiten',
      'steel': 'Stahlbau',
      'glass': 'Glasarbeiten',
      'tiles': 'Fliesenarbeiten',
      'plastering': 'Putzarbeiten',
      'scaffolding': 'Gerüstbau',
      'cleaning': 'Reinigung',
      'security': 'Sicherheit',
      'catering': 'Catering',
      'transport': 'Transport',
      'equipment': 'Geräte',
      'materials': 'Materialien',
      'consulting': 'Beratung',
      'planning': 'Planung',
      'supervision': 'Bauleitung',
      'inspection': 'Abnahme',
      'maintenance': 'Wartung',
      'renovation': 'Renovierung',
      'demolition': 'Abbruch',
      'other': 'Sonstiges'
    };
    
    return translations[category.toLowerCase()] || category;
  };

  // Hilfsfunktion: Übersetzt auch Subkategorien
  const translateSubcategory = (subcategory: string) => {
    const translations: { [key: string]: string } = {
      'framing': 'Rahmenbau',
      'drywall_installation': 'Trockenbau-Installation',
      'taping': 'Spachteln',
      'sanding': 'Schleifen',
      'pipes': 'Rohrleitungen',
      'fixtures': 'Armaturen',
      'water_heater': 'Warmwasserbereiter',
      'drainage': 'Entwässerung',
      'wiring': 'Verkabelung',
      'outlets': 'Steckdosen',
      'lighting': 'Beleuchtung',
      'panels': 'Schalttafeln',
      'framing_carpentry': 'Rahmenbau-Zimmerei',
      'finish_carpentry': 'Ausbau-Zimmerei',
      'cabinets': 'Schränke',
      'trim': 'Leisten',
      'interior_painting': 'Innenanstrich',
      'exterior_painting': 'Außenanstrich',
      'primer': 'Grundierung',
      'hardwood': 'Parkett',
      'laminate': 'Laminat',
      'tile': 'Fliesen',
      'carpet': 'Teppich',
      'shingles': 'Schindeln',
      'metal_roofing': 'Metalldach',
      'flat_roofing': 'Flachdach',
      'foundation': 'Fundament',
      'slab': 'Platte',
      'reinforcement': 'Bewehrung',
      'brick': 'Ziegel',
      'stone': 'Stein',
      'block': 'Block',
      'fiberglass': 'Glasfaser',
      'foam': 'Schaum',
      'cellulose': 'Zellulose',
      'furnace': 'Heizung',
      'air_conditioning': 'Klimaanlage',
      'ventilation': 'Belüftung',
      'ductwork': 'Kanäle',
      'plants': 'Pflanzen',
      'irrigation': 'Bewässerung',
      'hardscaping': 'Hartgestaltung',
      'excavation': 'Aushub',
      'backfill': 'Verfüllung',
      'grading': 'Planierung',
      'structural': 'Tragwerk',
      'welding': 'Schweißen',
      'windows': 'Fenster',
      'doors': 'Türen',
      'mirrors': 'Spiegel',
      'ceramic': 'Keramik',
      'porcelain': 'Porzellan',
      'natural_stone': 'Naturstein',
      'grout': 'Fugenmörtel',
      'interior': 'Innenputz',
      'exterior': 'Außenputz',
      'textured': 'Strukturputz',
      'tube': 'Rohrgerüst',
      'frame': 'Rahmengerüst',
      'system': 'Systemgerüst',
      'commercial': 'Gewerblich',
      'residential': 'Wohngebäude',
      'deep_cleaning': 'Grundreinigung',
      'maintenance': 'Unterhalt',
      'access_control': 'Zugangskontrolle',
      'surveillance': 'Überwachung',
      'alarm_systems': 'Alarmanlagen',
      'food_service': 'Gastronomie',
      'event_catering': 'Event-Catering',
      'delivery': 'Lieferung',
      'pickup': 'Abholung',
      'heavy_machinery': 'Baumaschinen',
      'tools': 'Werkzeuge',
      'supplies': 'Materialien',
      'raw_materials': 'Rohmaterialien',
      'finished_goods': 'Fertigerzeugnisse',
      'technical': 'Technisch',
      'business': 'Geschäftlich',
      'legal': 'Rechtlich',
      'architectural': 'Architektonisch',
      'engineering': 'Ingenieurwesen',
      'construction': 'Bauleitung',
      'project_management': 'Projektmanagement',
      'quality_control': 'Qualitätskontrolle',
      'final_inspection': 'Endabnahme',
      'preventive': 'Vorbeugend',
      'corrective': 'Korrektiv',
      'emergency': 'Notfall',
      'kitchen': 'Küche',
      'bathroom': 'Badezimmer',
      'living_room': 'Wohnzimmer',
      'bedroom': 'Schlafzimmer',
      'partial': 'Teilweise',
      'complete': 'Vollständig',
      'selective': 'Selektiv'
    };
    
    return translations[subcategory.toLowerCase()] || subcategory;
  };

  // Hilfsfunktion: Lädt Trade- und Projekt-Informationen für eine ResourceAllocation
  const loadAllocationDetails = async (allocation: any) => {
    try {
      // Prüfe ob trade_id gültig ist
      if (!allocation.trade_id || allocation.trade_id === 0) {
        console.error('❌ ServiceProviderDashboard: Ungültige trade_id in loadAllocationDetails:', allocation.trade_id);
        return null;
      }
      
      // Lade Trade-Informationen
      const tradeResponse = await fetch(`${getApiBaseUrl()}/api/v1/milestones/${allocation.trade_id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (tradeResponse.ok) {
        const trade = await tradeResponse.json();
        
        // Lade Projekt-Informationen (mit Fehlerbehandlung für 403)
        if (trade.project_id && trade.project_id !== 0) {
          try {
            const projectResponse = await fetch(`${getApiBaseUrl()}/api/v1/projects/${trade.project_id}`, {
              headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
              }
            });
            
            if (projectResponse.ok) {
              const project = await projectResponse.json();
              
              // Lade Bauträger-Informationen
              if (project.owner_id) {
                const userResponse = await fetch(`${getApiBaseUrl()}/api/v1/users/${project.owner_id}`, {
                  headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                  }
                });
                
                if (userResponse.ok) {
                  const bautraeger = await userResponse.json();
                  return {
                    ...allocation,
                    trade,
                    project,
                    bautraeger
                  };
                }
              }
              
              return {
                ...allocation,
                trade,
                project
              };
            } else if (projectResponse.status === 403) {
              console.warn('⚠️ ServiceProviderDashboard: Keine Berechtigung für Projekt', trade.project_id, '- überspringe Projekt-Details');
              return {
                ...allocation,
                trade,
                project: null
              };
            } else {
              console.error('❌ ServiceProviderDashboard: Fehler beim Laden des Projekts', trade.project_id, ':', projectResponse.status);
              return {
                ...allocation,
                trade,
                project: null
              };
            }
          } catch (error) {
            console.error('❌ ServiceProviderDashboard: Fehler beim Laden des Projekts', trade.project_id, ':', error);
            return {
              ...allocation,
              trade,
              project: null
            };
          }
        }
        
        return {
          ...allocation,
          trade
        };
      }
    } catch (error) {
      console.error('Fehler beim Laden der Allocation-Details:', error);
    }
    
    return allocation;
  };

  const loadUserResources = async () => {
    if (!user?.id) return;
    
    try {
      const resources = await resourceService.getMyResources();
      setUserResources(resources);
      
      // Lade auch die Allokationen für Markierungen
      const allocations = await resourceService.getMyAllocations();
      
      // Filtere ungültige Allocations VOR der Verarbeitung (trade_id = 0)
      const validAllocationsBeforeProcessing = allocations.filter(allocation => {
        if (!allocation.trade_id || allocation.trade_id === 0) {
          console.warn('⚠️ ServiceProviderDashboard: Überspringe Allocation mit ungültiger trade_id:', allocation.trade_id);
          return false;
        }
        return true;
      });
      
      // Erweitere Allokationen mit Trade- und Projekt-Informationen (mit Fehlerbehandlung)
      const extendedAllocations = await Promise.allSettled(
        validAllocationsBeforeProcessing.map(allocation => loadAllocationDetails(allocation))
      );
      
      // Filtere erfolgreiche Allocations heraus
      const validAllocations = extendedAllocations
        .filter(result => result.status === 'fulfilled' && result.value !== null)
        .map(result => result.value);
      
      setResourceAllocations(validAllocations);
      
      // Berechne Statistiken
      calculateResourceStats(resources);
    } catch (error) {
      console.error('Fehler beim Laden der Ressourcen:', error);
      // Setze leere Stats bei Fehler
      setUserResources([]);
      setResourceAllocations([]);
      setResourceStats({
        totalEmployees: 0,
        totalPersonDays: 0,
        totalHours: 0,
        utilization: 0
      });
    }
  };

  // Funktion zum Prüfen des Account-Status und überfälliger Zahlungen
  const checkPaymentStatus = async () => {
    try {
      setIsCheckingAccountStatus(true);
      console.log('🔍 Prüfe Account-Status und überfällige Zahlungen...');
      
      const status = await checkAccountStatus();
      setAccountStatus(status);
      
      console.log('✅ Account-Status geprüft:', {
        hasOverdueFees: status.has_overdue_fees,
        overdueCount: status.overdue_fees.length,
        totalOverdueAmount: status.total_overdue_amount
      });
      
    } catch (error) {
      console.error('❌ Fehler beim Prüfen des Account-Status:', error);
      // Bei Fehlern setzen wir einen sicheren Fallback
      setAccountStatus({
        account_locked: false,
        has_overdue_fees: false,
        overdue_fees: [],
        total_overdue_amount: 0,
        message: 'Account-Status konnte nicht geprüft werden'
      });
    } finally {
      setIsCheckingAccountStatus(false);
    }
  };

  // Handler: Ressource Details anzeigen
  const handleShowResourceDetails = (resource: any) => {
    setSelectedResourceForDetails(resource);
    setShowResourceDetailsModal(true);
  };

  // Handler: Ressource bearbeiten
  const handleEditResource = (resource: any) => {
    setShowResourceDetailsModal(false);
    // TODO: Implementiere Bearbeitungsfunktion
    console.log('Bearbeite Ressource:', resource);
  };

  // Handler: Ressource löschen
  const handleDeleteResource = async (resource: any) => {
    if (!confirm(`Möchten Sie die Ressource "${resource.title || resource.category}" wirklich löschen?`)) {
      return;
    }

    try {
      await resourceService.deleteResource(resource.id);
      setShowResourceDetailsModal(false);
      setSelectedResourceForDetails(null);
      // Lade Ressourcen neu
      await loadUserResources();
      alert('Ressource erfolgreich gelöscht.');
    } catch (error) {
      console.error('Fehler beim Löschen der Ressource:', error);
      alert('Fehler beim Löschen der Ressource. Bitte versuchen Sie es erneut.');
    }
  };

  const calculateResourceStats = (resources: any[]) => {
    if (!resources || resources.length === 0) {
      setResourceStats({
        totalEmployees: 0,
        totalPersonDays: 0,
        totalHours: 0,
        utilization: 0
      });
      return;
    }

    // Berechne Gesamtstatistiken
    let totalEmployees = 0;
    let totalPersonDays = 0;
    let totalHours = 0;
    let allocatedPersonDays = 0;
    
    // Aktueller Monat für Berechnung
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    resources.forEach(resource => {
      // Zähle nur Ressourcen im aktuellen Monat
      const resStart = new Date(resource.start_date);
      const resEnd = new Date(resource.end_date);
      
      // Überprüfe ob Ressource im aktuellen Monat aktiv ist
      if (resEnd >= startOfMonth && resStart <= endOfMonth) {
        totalEmployees += resource.person_count || 0;
        
        // Berechne Überlappung mit aktuellem Monat
        const effectiveStart = resStart > startOfMonth ? resStart : startOfMonth;
        const effectiveEnd = resEnd < endOfMonth ? resEnd : endOfMonth;
        const days = Math.ceil((effectiveEnd.getTime() - effectiveStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        
        const personDays = days * (resource.person_count || 1);
        totalPersonDays += personDays;
        totalHours += personDays * (resource.daily_hours || 8);
        
        // Zähle allokierte Tage
        if (resource.status === 'allocated') {
          allocatedPersonDays += personDays;
        }
      }
    });

    // Berechne Auslastung
    const utilization = totalPersonDays > 0 
      ? Math.round((allocatedPersonDays / totalPersonDays) * 100) 
      : 0;

    setResourceStats({
      totalEmployees,
      totalPersonDays: Math.round(totalPersonDays),
      totalHours: Math.round(totalHours),
      utilization
    });
  };

  // Hilfsfunktion: Prüft ob eine Ressource angezogen wurde (pre_selected Status)
  const isResourceAllocated = (resourceId: number): boolean => {
    return resourceAllocations.some(allocation => 
      allocation.resource_id === resourceId && 
      allocation.allocation_status === 'pre_selected'
    );
  };

  // Hilfsfunktion: Holt die Allokations-Details für eine Ressource
  const getResourceAllocationDetails = (resourceId: number): ResourceAllocation | null => {
    return resourceAllocations.find(allocation => 
      allocation.resource_id === resourceId && 
      allocation.allocation_status === 'pre_selected'
    ) || null;
  };

  // URL-Parameter für automatisches Öffnen des Quote-Forms und Scrollen zu Ausschreibungen
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const quoteParam = urlParams.get('quote');
    const scrollToBiddingParam = urlParams.get('scrollToBidding');
    
    // Handle scroll to bidding section
    if (scrollToBiddingParam === 'true') {
      console.log('🎯 URL-Parameter scrollToBidding=true erkannt - scrolle zu Ausschreibungen-Abschnitt');
      setTimeout(() => {
        const geoSearchSection = document.querySelector('[data-tour-id="geo-search-section"]');
        if (geoSearchSection) {
          geoSearchSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 500); // Small delay to ensure page is loaded
      
      // Remove URL parameter after scrolling
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
    }
    
    // Handle quote form opening
    if (quoteParam && (trades.length > 0 || geoTrades.length > 0)) {
      console.log('🔍 URL-Parameter quote erkannt:', quoteParam, 'für Trades:', trades.length, 'geoTrades:', geoTrades.length);
      // Finde das Trade mit der ID und öffne das CostEstimateForm
      const tradeId = parseInt(quoteParam);
      if (tradeId && !isNaN(tradeId)) {
        const trade = trades.find(t => t.id === tradeId) || geoTrades.find(t => t.id === tradeId);
        if (trade) {
          console.log('🔍 Trade gefunden für URL-Parameter:', trade.id, trade.title);
          // Prüfe ob der User bereits ein Angebot für dieses Trade hat
          const userHasQuote = hasServiceProviderQuote(trade.id);
          console.log('🔍 User hat bereits Angebot für Trade', trade.id, ':', userHasQuote);
          if (!userHasQuote) {
            console.log('🎯 Öffne CostEstimateForm für Trade:', trade.id, trade.title);
            setSelectedTradeForQuote(trade);
            setShowCostEstimateForm(true);
          } else {
            console.log('🎯 CostEstimateForm nicht geöffnet (URL-Parameter) - User hat bereits ein Angebot für Trade:', trade.id);
            // Öffne stattdessen das TradeDetailsModal
            setSelectedTrade(trade);
            setDetailTrade(trade);
            setShowTradeDetails(true);
          }
          
          // Entferne URL-Parameter nach dem Öffnen
          const newUrl = window.location.pathname;
          window.history.replaceState({}, '', newUrl);
        } else {
          console.log('🔍 Trade nicht gefunden für URL-Parameter quote:', tradeId);
        }
      }
    }
  }, [location.search, trades, geoTrades]);

  // Handler für das Schließen des CostEstimateForm Modals
  const handleCloseCostEstimateForm = () => {
    setShowCostEstimateForm(false);
    setSelectedTradeForQuote(null);
    
    // Entferne auch den URL-Parameter falls er noch vorhanden ist
    const urlParams = new URLSearchParams(location.search);
    if (urlParams.get('quote')) {
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
    }
  };

  // Event-Listener für Benachrichtigungs-Klicks (TradeDetailsModal öffnen)
  // Event-Listener für Scrollen zu Ausschreibungen-Abschnitt (vom Radial Menu)
  useEffect(() => {
    const handleScrollToBidding = () => {
      console.log('📋 ServiceProviderDashboard: Event empfangen - Scrolle zu Ausschreibungen-Abschnitt');
      const geoSearchSection = document.querySelector('[data-tour-id="geo-search-section"]');
      if (geoSearchSection) {
        geoSearchSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    };

    window.addEventListener('scrollToBidding', handleScrollToBidding as any);
    
    return () => {
      window.removeEventListener('scrollToBidding', handleScrollToBidding as any);
    };
  }, []);

  useEffect(() => {
    const handleOpenTradeDetails = (event: CustomEvent) => {
      console.log('📋 Event empfangen: TradeDetails öffnen für Trade:', event.detail.tradeId);
      const tradeId = event.detail.tradeId;
      const showQuoteForm = event.detail.showQuoteForm;
      const source = event.detail.source;
      
      // Prüfe ob tradeId gültig ist (nicht 0 oder undefined)
      if (!tradeId || tradeId === 0) {
        console.error('❌ Ungültige tradeId:', tradeId);
        alert('Die Ausschreibung konnte nicht gefunden werden. Die Benachrichtigung enthält ungültige Daten.');
        return;
      }
      
      // Finde das Trade in den lokalen Daten
      const trade = trades.find(t => t.id === tradeId) || geoTrades.find(t => t.id === tradeId);
      
      if (trade) {
        console.log('✅ Trade gefunden:', trade);
        
        // Wenn showQuoteForm=true, öffne direkt das CostEstimateForm
        // ABER nur wenn der User noch kein Angebot für dieses Trade hat
        if (showQuoteForm) {
          const userHasQuote = hasServiceProviderQuote(trade.id);
          if (!userHasQuote) {
            console.log('🎯 Öffne CostEstimateForm für Trade:', trade.id, trade.title);
            setSelectedTradeForQuote(trade);
            setShowCostEstimateForm(true);
          } else {
            console.log('🎯 CostEstimateForm nicht geöffnet - User hat bereits ein Angebot für Trade:', trade.id);
            // Öffne stattdessen das TradeDetailsModal
            setSelectedTrade(trade);
            setDetailTrade(trade);
            setShowTradeDetails(true);
          }
        } else {
          // Ansonsten Trade auswählen und Modal öffnen
          console.log('🎯 Öffne TradeDetailsModal für Trade:', trade.id, trade.title);
          setSelectedTrade(trade);
          setDetailTrade(trade);
          setShowTradeDetails(true);
        }
      } else {
        console.warn('⚠️ Trade nicht gefunden in lokalen Daten, lade neu...');
        // Fallback: Lade Trades neu und versuche erneut
        loadTrades().then(() => {
          const refreshedTrade = trades.find(t => t.id === tradeId) || geoTrades.find(t => t.id === tradeId);
          if (refreshedTrade) {
            if (showQuoteForm) {
              const userHasQuote = hasServiceProviderQuote(refreshedTrade.id);
              if (!userHasQuote) {
                console.log('🎯 Öffne CostEstimateForm für Trade (nach Reload):', refreshedTrade.id, refreshedTrade.title);
                setSelectedTradeForQuote(refreshedTrade);
                setShowCostEstimateForm(true);
              } else {
                console.log('🎯 CostEstimateForm nicht geöffnet (nach Reload) - User hat bereits ein Angebot für Trade:', refreshedTrade.id);
                setSelectedTrade(refreshedTrade);
                setDetailTrade(refreshedTrade);
                setShowTradeDetails(true);
              }
            } else {
              console.log('🎯 Öffne TradeDetailsModal für Trade (nach Reload):', refreshedTrade.id, refreshedTrade.title);
              setSelectedTrade(refreshedTrade);
              setDetailTrade(refreshedTrade);
              setShowTradeDetails(true);
            }
          } else {
            console.error('❌ Trade auch nach Neuladen nicht gefunden:', tradeId);
            alert('Die Ausschreibung konnte nicht gefunden werden. Bitte versuchen Sie es erneut.');
          }
        });
      }
    };

    window.addEventListener('openTradeDetails', handleOpenTradeDetails as EventListener);
    
    return () => {
      window.removeEventListener('openTradeDetails', handleOpenTradeDetails as EventListener);
    };
  }, [trades, geoTrades]);

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

  const handleSelectedAddressGeocode = async () => {
    if (!selectedAddress.address_street.trim()) return;
    
    setIsGeocoding(true);
    try {
      // Echte Geocoding-Funktionalität für ausgewählte Adresse
      const fullAddress = [
        selectedAddress.address_street,
        selectedAddress.address_zip,
        selectedAddress.address_city,
        selectedAddress.address_country
      ].filter(Boolean).join(', ');

      const geocodingResult = await geocodeAddress({
        street: selectedAddress.address_street,
        zip_code: selectedAddress.address_zip,
        city: selectedAddress.address_city,
        country: selectedAddress.address_country || 'Deutschland'
      });

      if (geocodingResult.latitude && geocodingResult.longitude) {
        const location = {
          latitude: geocodingResult.latitude,
          longitude: geocodingResult.longitude
        };
        setCurrentLocation(location);
        localStorage.setItem('buildwise_geo_location', JSON.stringify(location));
        setGeoError(null);
        console.log('✅ Adresse erfolgreich geocodiert:', fullAddress);
      } else {
        throw new Error('Geocoding fehlgeschlagen - keine Koordinaten erhalten');
      }
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

  // Periodischer Refresh der Trade-Daten für aktuelle Projekte (DEAKTIVIERT)
  // useEffect(() => {
  //   const refreshInterval = setInterval(() => {
  //     // getAllTradesWithQuotes ist bereits ein useMemo, keine Funktion
  //     const activeTradeIds = getAllTradesWithQuotes
  //       .filter((trade: any) => getServiceProviderQuoteStatus(trade.id) === 'accepted')
  //       .map((trade: any) => trade.id);
  //     
  //     if (activeTradeIds.length > 0) {
  //       console.log('🔄 Periodischer Refresh für aktive Trades:', activeTradeIds);
  //       activeTradeIds.forEach(tradeId => refreshTradeData(tradeId));
  //     }
  //   }, 60000); // Alle 60 Sekunden
  //
  //   return () => clearInterval(refreshInterval);
  // }, []);

  // Auto-Dismissal Logic: Clear errors wenn entsprechende API erfolgreich wird
  useEffect(() => {
    if (geoTrades.length > 0 && geoError) {
      setGeoError(null);
    }
  }, [geoTrades.length, geoError]);

  useEffect(() => {
    if (trades.length > 0 && tradesError) {
      setTradesError('');
    }
  }, [trades.length, tradesError]);



  // Lade Trades und Quotes für Dienstleister
  const loadTrades = async () => {
    console.log('🔍 loadTrades: Funktion gestartet');
    setIsLoadingTrades(true);
    setTradesError('');
    try {
      console.log('🔍 loadTrades: Lade alle Milestones...');
      console.log('🔍 loadTrades: User Info:', {
        id: user?.id,
        email: user?.email,
        user_type: user?.user_type,
        user_role: user?.user_role,
        isAuthenticated: isAuthenticated()
      });
      
      // Dienstleister: alle Milestones (Ausschreibungen) global laden
      const tradesData = await getAllMilestones();
      console.log('🔍 loadTrades: Milestones geladen:', tradesData.length, 'Trades');
      
      // Debug: Prüfe has_unread_messages Status - DIENSTLEISTER-SPEZIFISCH
      tradesData.forEach((trade: any) => {
        const dienstleisterUnread = trade.has_unread_messages_dienstleister || false;
        console.log(`🔍 Trade ${trade.id} (${trade.title}): has_unread_messages_dienstleister = ${dienstleisterUnread} (type: ${typeof dienstleisterUnread})`);
        if (dienstleisterUnread) {
          console.log(`📧 Trade ${trade.id} (${trade.title}): Dienstleister hat ungelesene Nachrichten = ${dienstleisterUnread}`);
        }
      });
      
      setTrades(tradesData);
      
      // Debug: Prüfe ob Error-State korrekt zurückgesetzt wird
      console.log('🔍 loadTrades: Error-State vor Reset:', tradesError);
      console.log('🔍 loadTrades: TradesData erfolgreich geladen, setze Error zurück');
      
      console.log('🔍 loadTrades: Starte loadAllTradeQuotes...');
      // Lade Angebote für alle Gewerke
      await loadAllTradeQuotes(tradesData);
      console.log('🔍 loadTrades: Erfolgreich abgeschlossen');
    } catch (err: any) {
      console.error('❌ Error in loadTrades - Detaillierte Fehlerinfo:', {
        message: err.message,
        status: err.response?.status,
        statusText: err.response?.statusText,
        data: err.response?.data,
        config: {
          url: err.config?.url,
          method: err.config?.method,
          headers: err.config?.headers
        }
      });
      
      // Spezifische Fehlermeldungen basierend auf HTTP-Status
      let errorMessage = 'Fehler beim Laden der Gewerke';
      if (err.response?.status === 401) {
        errorMessage = 'Authentifizierung fehlgeschlagen - Bitte neu anmelden';
      } else if (err.response?.status === 403) {
        errorMessage = 'Keine Berechtigung für Gewerke-Liste';
      } else if (err.response?.status === 404) {
        errorMessage = 'Gewerke-Endpunkt nicht gefunden';
      } else if (err.response?.status >= 500) {
        errorMessage = 'Server-Fehler beim Laden der Gewerke';
      } else if (err.code === 'NETWORK_ERROR' || err.message.includes('Network Error')) {
        errorMessage = 'Netzwerk-Fehler - Server nicht erreichbar';
      }
      
      setTradesError(errorMessage);
      
      // Fallback: Versuche Daten über Geo-Search zu bekommen, falls vorhanden
      console.log('🔄 loadTrades: Versuche Fallback über Geo-Search...');
      if (geoTrades.length > 0) {
        console.log('✅ loadTrades: Fallback erfolgreich - verwende Geo-Search Daten als Trades');
        setTrades(geoTrades.map(geoTrade => ({
          ...geoTrade,
          // Konvertiere Geo-Search Format zu Trades Format
          project_name: geoTrade.project_name,
          status: geoTrade.status
        })));
        // Aktualisiere Fehlermeldung um Fallback zu erwähnen
        setTradesError(errorMessage + ' (verwende Geo-Search Daten)');
      }
    } finally {
      setIsLoadingTrades(false);
    }
  };

  // Lade Rechnungen für abgeschlossene Projekte
  const loadTradeInvoices = async () => {
    if (!user) return;
    
    try {
      const completedTrades = getAllTradesWithQuotes
        .filter(trade => getServiceProviderQuoteStatus(trade.id) === 'accepted' && trade.completion_status === 'completed');
      
      const invoicePromises = completedTrades.map(async (trade) => {
        try {
          const { api } = await import('../api/api');
          const response = await api.get(`/api/v1/invoices/milestone/${trade.id}`);
          return { tradeId: trade.id, invoice: response.data };
        } catch (error: any) {
          if (error.response?.status === 404) {
            // Keine Rechnung gefunden - das ist OK
            return { tradeId: trade.id, invoice: null };
          }
          console.error(`Fehler beim Laden der Rechnung für Trade ${trade.id}:`, error);
          return { tradeId: trade.id, invoice: null };
        }
      });
      
      const invoiceResults = await Promise.all(invoicePromises);
      const invoicesMap: { [tradeId: number]: any } = {};
      
      invoiceResults.forEach(({ tradeId, invoice }) => {
        invoicesMap[tradeId] = invoice;
      });
      
      setTradeInvoices(invoicesMap);
    } catch (error) {
      console.error('Fehler beim Laden der Rechnungen:', error);
    }
  };

  // Prüfe ob eine Rechnung für ein Trade existiert und versendet wurde
  const hasValidInvoice = (tradeId: number): boolean => {
    const invoice = tradeInvoices[tradeId];
    return invoice && ['sent', 'viewed', 'paid', 'overdue'].includes(invoice.status);
  };

  // Erstelle Benachrichtigung für fehlende Rechnung
  const createMissingInvoiceNotification = async (trade: any) => {
    if (!user) return;
    
    try {
      const { api } = await import('../api/api');
      
      const notificationData = {
        recipient_id: user.id,
        type: 'missing_invoice',
        title: 'Rechnung ausstehend',
        message: `Das Projekt "${trade.title}" ist abgeschlossen, aber Sie haben noch keine Rechnung gestellt.`,
        description: `Projekt: ${trade.title} (ID: ${trade.project_id})\nAuftragswert: ${getServiceProviderQuote(trade.id)?.total_amount || 'N/A'} CHF\n\nErstellen Sie jetzt Ihre Rechnung, um die Bezahlung zu erhalten.`,
        priority: 'high',
        metadata: {
          trade_id: trade.id,
          project_id: trade.project_id,
          completion_date: trade.created_at,
          action_required: 'create_invoice'
        }
      };

      await api.post('/api/v1/notifications/', notificationData);
      
      console.log('📢 Benachrichtigung für fehlende Rechnung erstellt:', notificationData);
      
      // Event für NotificationTab auslösen
      window.dispatchEvent(new CustomEvent('notificationCreated', { 
        detail: { 
          notification: notificationData,
          tradeId: trade.id
        } 
      }));
      
    } catch (error) {
      console.error('Fehler beim Erstellen der Benachrichtigung für fehlende Rechnung:', error);
    }
  };

  // Lade alle Angebote des Service Providers
  const loadServiceProviderQuotes = async () => {
    if (!user) return;
    
    try {
      console.log('🔍 loadServiceProviderQuotes: Lade alle Angebote des Service Providers...');
      const quotes = await getQuotes(); // Ohne project_id = alle Angebote des Service Providers
      console.log('🔍 loadServiceProviderQuotes: Gefundene Angebote:', quotes);
      
      setServiceProviderQuotes(quotes);
      
      // Lade die zugehörigen Trades/Milestones für diese Angebote
      const uniqueTradeIds = [...new Set(quotes.map((quote: any) => quote.milestone_id).filter(Boolean))];
      console.log('🔍 loadServiceProviderQuotes: Unique Trade IDs:', uniqueTradeIds);
      
      if (uniqueTradeIds.length > 0) {
        // ROBUSTE LÖSUNG: Lade Trades direkt vom Backend für jede milestone_id
        const tradePromises = uniqueTradeIds.map(async (tradeId) => {
          try {
            const { api } = await import('../api/api');
            const response = await api.get(`/api/v1/milestones/${tradeId}`);
            console.log('🔍 Geladene Trade-Daten für ID', tradeId, ':', response.data);
            return response.data;
          } catch (error) {
            console.error('❌ Fehler beim Laden von Trade', tradeId, ':', error);
            return null;
          }
        });
        
        const tradeResults = await Promise.allSettled(tradePromises);
        const loadedTrades = tradeResults
          .filter(result => result.status === 'fulfilled' && result.value !== null)
          .map(result => result.value);
        console.log('🔍 loadServiceProviderQuotes: Alle geladenen Trades:', loadedTrades);
        setServiceProviderTrades(loadedTrades);
        
        // Zusätzlich: Kombiniere mit bereits vorhandenen Trades aus geoTrades
        const existingTrades = [...geoTrades, ...trades].filter(trade => 
          uniqueTradeIds.includes(trade.id)
        );
        
        // Merge beide Listen und dedupliziere
        const allRelevantTrades = [...loadedTrades, ...existingTrades];
        const deduplicatedTrades = allRelevantTrades.filter((trade, index, self) => 
          index === self.findIndex(t => t.id === trade.id)
        );
        
        console.log('🔍 loadServiceProviderQuotes: Finale deduplizierte Trades:', deduplicatedTrades);
        setServiceProviderTrades(deduplicatedTrades);
      }
      
    } catch (error) {
      console.error('❌ Fehler beim Laden der Service Provider Angebote:', error);
      setServiceProviderQuotes([]);
      setServiceProviderTrades([]);
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
      setTradesError('Fehler beim Laden der Gewerke');
    });
    
    // Lade auch die Service Provider Angebote
    loadServiceProviderQuotes().catch(error => {
      console.error('❌ useEffect: Fehler in loadServiceProviderQuotes():', error);
    });
    
    // Prüfe Account-Status und überfällige Zahlungen
    checkPaymentStatus().catch(error => {
      console.error('❌ useEffect: Fehler beim Prüfen des Account-Status:', error);
    });
  }, []);

  // Zusätzlicher useEffect für regelmäßige Aktualisierung der Service Provider Quotes und Trades
  useEffect(() => {
    if (!user) return;
    
    const refreshServiceProviderData = () => {
      console.log('🔄 Regelmäßige Aktualisierung der Service Provider Daten...');
      
      // Aktualisiere Quotes
      loadServiceProviderQuotes().catch(error => {
        console.error('❌ Fehler bei regelmäßiger Aktualisierung (Quotes):', error);
      });
      
      // Aktualisiere Trades (für has_unread_messages)
      console.log('📧 Aktualisiere Trades für Benachrichtigungen...');
      loadTrades().catch(error => {
        console.error('❌ Fehler bei regelmäßiger Aktualisierung (Trades):', error);
      });
      
      // Aktualisiere Account-Status und überfällige Zahlungen
      checkPaymentStatus().catch(error => {
        console.error('❌ Fehler bei regelmäßiger Aktualisierung (Account-Status):', error);
      });
    };
    
    // Sofortige Aktualisierung
    refreshServiceProviderData();
    
    // Dann alle 15 Sekunden (schneller für Benachrichtigungen)
    const interval = setInterval(refreshServiceProviderData, 15000);
    
    // Event Listener für "messagesMarkedAsRead" - aktualisiert Trades sofort wenn Nachrichten als gelesen markiert wurden
    const handleMessagesMarkedAsRead = (event: any) => {
      console.log('📧 Event "messagesMarkedAsRead" empfangen - aktualisiere Trades...', event.detail);
      const { tradeId, userType } = event.detail;
      
      // OPTIMISTISCHES UPDATE: Aktualisiere Trades sofort lokal, ohne auf Backend zu warten
      setTrades(prevTrades => {
        return prevTrades.map(trade => {
          if (trade.id === tradeId) {
            console.log(`📧 Aktualisiere Trade ${tradeId} lokal - setze Mail-Symbol auf false`);
            return {
              ...trade,
              has_unread_messages_bautraeger: false,
              has_unread_messages_dienstleister: false
            };
          }
          return trade;
        });
      });
      
      // Dann asynchron vom Backend neu laden (für Konsistenz)
      setTimeout(() => {
        loadTrades().catch(error => {
          console.error('❌ Fehler beim Aktualisieren der Trades nach messagesMarkedAsRead:', error);
        });
      }, 500); // Kurze Verzögerung damit Backend Zeit hat zu committen
    };
    
    window.addEventListener('messagesMarkedAsRead', handleMessagesMarkedAsRead);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('messagesMarkedAsRead', handleMessagesMarkedAsRead);
    };
  }, [user?.id]); // Abhängig von user.id, damit es bei User-Wechsel neu lädt

  // Lade Rechnungen wenn abgeschlossene Projekte eingeklappt werden
  useEffect(() => {
    if (isCompletedProjectsExpanded && user) {
      loadTradeInvoices();
    }
  }, [isCompletedProjectsExpanded, user]);

  // Erstelle Benachrichtigungen für abgeschlossene Projekte ohne Rechnung
  useEffect(() => {
    if (isCompletedProjectsExpanded && Object.keys(tradeInvoices).length > 0) {
      const completedTrades = getAllTradesWithQuotes
        .filter(trade => getServiceProviderQuoteStatus(trade.id) === 'accepted' && trade.completion_status === 'completed');
      
      completedTrades.forEach(trade => {
        if (!hasValidInvoice(trade.id)) {
          // Prüfe ob bereits eine Benachrichtigung für dieses Projekt existiert
          const notificationKey = `missing_invoice_notification_${trade.id}`;
          if (!localStorage.getItem(notificationKey)) {
            createMissingInvoiceNotification(trade);
            // Markiere als erstellt, um Duplikate zu vermeiden
            localStorage.setItem(notificationKey, new Date().toISOString());
          }
        }
      });
    }
  }, [isCompletedProjectsExpanded, tradeInvoices]);

  // Prüfe ob der aktuelle Dienstleister bereits ein Angebot für ein Gewerk abgegeben hat
  const hasServiceProviderQuote = (tradeId: number): boolean => {
    console.log('🔍 hasServiceProviderQuote START für Trade:', tradeId);
    
    if (!user) {
      console.log('🔍 hasServiceProviderQuote: Kein User vorhanden');
      return false;
    }
    
    if (user.user_type !== 'service_provider' && user.user_role !== 'DIENSTLEISTER') {
      console.log('🔍 hasServiceProviderQuote: User ist kein Service Provider', { 
        user_type: user.user_type, 
        user_role: user.user_role 
      });
      return false;
    }
    
    // Prüfe sowohl allTradeQuotes als auch serviceProviderQuotes
    const quotes = allTradeQuotes[tradeId] || [];
    const serviceQuotes = serviceProviderQuotes.filter(q => q.milestone_id === tradeId);
    const allQuotes = [...quotes, ...serviceQuotes];
    
    // DEBUG: Erweiterte Ausgabe für Analyse
    console.log('🔍 hasServiceProviderQuote DEBUG:', {
      tradeId,
      userId: user.id,
      userIdType: typeof user.id,
      userEmail: user.email,
      quotesCount: quotes.length,
      serviceQuotesCount: serviceQuotes.length,
      totalQuotesCount: allQuotes.length,
      allTradeQuotesKeys: Object.keys(allTradeQuotes),
      serviceProviderQuotesTotal: serviceProviderQuotes.length,
      quotes: allQuotes.map(q => ({
        id: q.id,
        milestone_id: q.milestone_id,
        service_provider_id: q.service_provider_id,
        service_provider_id_type: typeof q.service_provider_id,
        status: q.status,
        email: q.email,
        company_name: q.company_name,
        contact_person: q.contact_person,
        title: q.title
      })),
      userObject: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        user_role: user.user_role,
        user_type: user.user_type,
        company_name: user.company_name
      }
    });
    
    // Prüfe jedes Quote einzeln mit detailliertem Logging
    console.log('🔍 hasServiceProviderQuote: Prüfe jedes Quote einzeln...');
    const matchingQuotes: any[] = [];
    
    allQuotes.forEach((quote, index) => {
      console.log(`🔍 Prüfe Quote ${index + 1}/${allQuotes.length}:`, {
        quoteId: quote.id,
        milestone_id: quote.milestone_id,
        service_provider_id: quote.service_provider_id,
        email: quote.email
      });
      
      const isMatch = isUserQuote(quote, user);
      if (isMatch) {
        matchingQuotes.push(quote);
        console.log(`✅ Quote ${quote.id} gehört zum User!`);
      } else {
        console.log(`❌ Quote ${quote.id} gehört NICHT zum User`);
      }
    });
    
    const hasQuote = matchingQuotes.length > 0;
    
    console.log('🔍 hasServiceProviderQuote FINAL RESULT:', { 
      tradeId, 
      hasQuote,
      matchingQuotesCount: matchingQuotes.length,
      matchingQuotes: matchingQuotes.map(q => ({ id: q.id, status: q.status, email: q.email }))
    });
    
    return hasQuote;
  };

  // Memoized function: Kombiniert alle Trades für die der Service Provider Angebote hat
  const getAllTradesWithQuotes = useMemo((): any[] => {
    try {
      console.log('🔍 getAllTradesWithQuotes START');
      
      // WICHTIG: Verwende die echten Milestones mit has_unread_messages Feldern
      // Kombiniere und dedupliziere Geo-Trades und lokale Trades
      const tradeMap: { [key: number]: any } = {};
      
      // Füge Geo-Trades hinzu (haben Priorität wegen Distanz-Info)
      geoTrades.forEach(trade => {
        tradeMap[trade.id] = {...trade, isGeoResult: true};
      });
      
      // WICHTIG: Merge lokale Trades mit Geo-Trades um has_unread_messages Felder zu erhalten
      serviceProviderTrades.forEach(trade => {
        if (tradeMap[trade.id]) {
          // Trade existiert bereits in geoTrades - MERGE die Felder
          tradeMap[trade.id] = {
            ...tradeMap[trade.id], // Behalte Geo-Daten (distance_km, etc.)
            has_unread_messages_bautraeger: trade.has_unread_messages_bautraeger,
            has_unread_messages_dienstleister: trade.has_unread_messages_dienstleister,
            // Weitere wichtige Felder aus lokalen Trades übernehmen
            completion_status: trade.completion_status || tradeMap[trade.id].completion_status,
          };
        } else {
          // Trade existiert nur in lokalen Trades
          tradeMap[trade.id] = {...trade, isGeoResult: false};
        }
      });
      
      const combinedTrades = Object.values(tradeMap);
      
      // Debug: Zeige has_unread_messages Status für alle Trades
      console.log('🔍 CombinedTrades - Mail-Symbol Status:', combinedTrades.map(t => ({
        id: t.id,
        title: t.title,
        has_unread_messages_dienstleister: t.has_unread_messages_dienstleister,
        isGeoResult: t.isGeoResult
      })));
      
      // Filtere nur Trades mit Quotes
      const tradesWithQuotes = combinedTrades.filter(trade => {
        const hasQuote = serviceProviderQuotes.some(quote => quote.milestone_id === trade.id);
        return hasQuote;
      });
      
      console.log('🔍 getAllTradesWithQuotes RESULT:', {
        totalTradesWithQuotes: tradesWithQuotes.length,
        trades: tradesWithQuotes
      });
      
      return tradesWithQuotes;
    } catch (error) {
      console.error('❌ Fehler in getAllTradesWithQuotes:', error);
      return [];
    }
  }, [geoTrades, serviceProviderTrades, serviceProviderQuotes, allTradeQuotes, user?.id]);

  // Funktion zum Aktualisieren eines einzelnen Trades (z.B. nach Statusänderung)
  const refreshTradeData = async (tradeId: number) => {
    try {
      console.log('🔄 Aktualisiere Trade-Daten für ID:', tradeId);
      
      // Lade aktuelle Trade-Daten vom Backend
      const { api } = await import('../api/api');
      const response = await api.get(`/api/v1/milestones/${tradeId}`);
      const updatedTrade = response.data;
      
      console.log('✅ Aktualisierte Trade-Daten erhalten:', updatedTrade);
      
      // Aktualisiere geoTrades
      setGeoTrades(prevGeoTrades => {
        const updated = prevGeoTrades.map(trade => 
          trade.id === tradeId ? { ...trade, ...updatedTrade } : trade
        );
        console.log('🔄 geoTrades aktualisiert für Trade', tradeId);
        return updated;
      });
      
      // Aktualisiere serviceProviderTrades
      setServiceProviderTrades(prevTrades => {
        const updated = prevTrades.map(trade => 
          trade.id === tradeId ? { ...trade, ...updatedTrade } : trade
        );
        
        // Falls Trade nicht in serviceProviderTrades ist, aber ein Quote existiert, füge es hinzu
        const tradeExists = prevTrades.some(trade => trade.id === tradeId);
        if (!tradeExists && hasServiceProviderQuote(tradeId)) {
          console.log('🔄 Füge Trade', tradeId, 'zu serviceProviderTrades hinzu');
          updated.push(updatedTrade);
        }
        
        console.log('🔄 serviceProviderTrades aktualisiert für Trade', tradeId);
        return updated;
      });
      
      // Zusätzlich: Aktualisiere auch die allTradeQuotes falls nötig
      try {
        const quotes = await getQuotesForMilestone(tradeId);
        setAllTradeQuotes(prev => ({
          ...prev,
          [tradeId]: quotes
        }));
        console.log('🔄 allTradeQuotes aktualisiert für Trade', tradeId, ':', quotes.length, 'Quotes');
      } catch (quotesError) {
        console.warn('⚠️ Fehler beim Aktualisieren der Quotes für Trade', tradeId, ':', quotesError);
      }
      
      console.log('✅ Trade-Daten erfolgreich aktualisiert für ID:', tradeId);
      
    } catch (error) {
      console.error('❌ Fehler beim Aktualisieren der Trade-Daten:', error);
    }
  };

  // Funktion zum kompletten Neuladen aller Daten (Fallback bei Problemen)
  const reloadAllData = async () => {
    try {
      console.log('🔄 Starte komplettes Neuladen aller Daten...');
      
      // Parallel alle Datenquellen neu laden
      const promises = [
        loadServiceProviderQuotes(),
        performGeoSearch(),
        loadTrades(),
        checkPaymentStatus()
      ];
      
      await Promise.all(promises);
      console.log('✅ Komplettes Neuladen aller Daten abgeschlossen');
      
    } catch (error) {
      console.error('❌ Fehler beim kompletten Neuladen der Daten:', error);
    }
  };

  // Hilfsfunktion: Prüft ob ein Quote dem aktuellen User gehört (optimiert)
  const isUserQuote = useMemo(() => {
    return (quote: any, user: any): boolean => {
      if (!quote || !user) {
        return false;
      }
      
      // Einfacher, direkter Vergleich
      return quote.service_provider_id === user.id;
    };
  }, []);

  // Prüfe den Status des Angebots des aktuellen Dienstleisters
  const getServiceProviderQuoteStatus = (tradeId: number): string | null => {
    if (!user || (user.user_type !== 'service_provider' && user.user_role !== 'DIENSTLEISTER')) {
      return null;
    }
    
    // Prüfe sowohl allTradeQuotes als auch serviceProviderQuotes
    const quotes = allTradeQuotes[tradeId] || [];
    const serviceQuotes = serviceProviderQuotes.filter(q => q.milestone_id === tradeId);
    const allQuotes = [...quotes, ...serviceQuotes];
    
    // Verwende die erweiterte isUserQuote Funktion für robuste Erkennung
    const userQuote = allQuotes.find(quote => isUserQuote(quote, user));
    
    return userQuote ? userQuote.status : null;
  };

  // Hole das Quote-Objekt des aktuellen Dienstleisters für ein Trade
  const getServiceProviderQuote = (tradeId: number): any | null => {
    if (!user || (user.user_type !== 'service_provider' && user.user_role !== 'DIENSTLEISTER')) {
      return null;
    }
    
    // Prüfe sowohl allTradeQuotes als auch serviceProviderQuotes
    const quotes = allTradeQuotes[tradeId] || [];
    const serviceQuotes = serviceProviderQuotes.filter(q => q.milestone_id === tradeId);
    const allQuotes = [...quotes, ...serviceQuotes];
    
    // Verwende die erweiterte isUserQuote Funktion für robuste Erkennung
    const userQuote = allQuotes.find(quote => isUserQuote(quote, user));
    
    return userQuote || null;
  };

  // Utility-Funktionen
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  // Hilfsfunktionen für Texttrunkierung
  const truncateText = (text: string, maxLength: number = 120) => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + '...';
  };

  const toggleDescriptionExpansion = (tradeId: number) => {
    setExpandedDescriptions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(tradeId)) {
        newSet.delete(tradeId);
      } else {
        newSet.add(tradeId);
      }
      return newSet;
    });
  };

  const isDescriptionExpanded = (tradeId: number) => {
    return expandedDescriptions.has(tradeId);
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

  // Neue Funktionen für completion_status anstelle von status
  const getCompletionStatusLabel = (completionStatus: string) => {
    switch (completionStatus) {
      case 'in_progress': return '🔧 In Bearbeitung';
      case 'completion_requested': return '📋 Fertigstellung gemeldet';
      case 'under_review': return '🔍 In Prüfung';
      case 'completed': return '✅ Abgeschlossen';
      case 'completed_with_defects': return '⚠️ Abgeschlossen mit Mängeln';
      case 'defects_resolved': return '🔧 Mängel behoben';
      case 'archived': return '📦 Archiviert';
      default: return '🔧 In Bearbeitung';
    }
  };

  const getCompletionStatusColor = (completionStatus: string) => {
    switch (completionStatus) {
      case 'in_progress': return 'bg-blue-500/20 text-blue-300 border border-blue-500/40';
      case 'completion_requested': return 'bg-orange-500/20 text-orange-300 border border-orange-500/40';
      case 'under_review': return 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/40';
      case 'completed': return 'bg-green-500/20 text-green-300 border border-green-500/40';
      case 'completed_with_defects': return 'bg-amber-500/20 text-amber-300 border border-amber-500/40';
      case 'defects_resolved': return 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40';
      case 'archived': return 'bg-gray-500/20 text-gray-300 border border-gray-500/40';
      default: return 'bg-blue-500/20 text-blue-300 border border-blue-500/40';
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

  const getCategoryIcon = (category: string | undefined | null) => {
    const cat = category?.toLowerCase() || '';
    try {
      switch (cat) {
        case 'electrical':
        case 'elektro':
          return React.createElement(Wrench, { size: 20, className: "text-white" });
        case 'plumbing':
        case 'sanitaer':
          return React.createElement(Wrench, { size: 20, className: "text-white" });
        case 'heating':
        case 'heizung':
          return React.createElement(Wrench, { size: 20, className: "text-white" });
        default:
          return React.createElement(Building, { size: 20, className: "text-white" });
      }
    } catch (error) {
      console.error('❌ Fehler in getCategoryIcon:', error, error.stack);
      // Fallback: return null anstelle eines JSX-Elements
      return React.createElement(Building, { size: 20, className: "text-white" });
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
      console.error('❌ Fehlende Daten für Angebotserstellung:', {
        selectedTradeForQuote: !!selectedTradeForQuote,
        user: !!user,
        userEmail: user?.email,
        userId: user?.id
      });
      
      // Zeige Fehlermeldung an den Benutzer
      alert('Fehler: Benutzerdaten oder Trade-Informationen fehlen. Bitte melden Sie sich erneut an.');
      return;
    }

    try {
      // Validiere erforderliche Felder
      if (!costEstimateData.total_amount || parseFloat(costEstimateData.total_amount) <= 0) {
        alert('Fehler: Bitte geben Sie einen gültigen Gesamtbetrag ein.');
        return;
      }
      
      if (!user.email) {
        alert('Fehler: Ihre E-Mail-Adresse ist nicht verfügbar. Bitte melden Sie sich erneut an.');
        return;
      }
      
      if (!user.first_name || !user.last_name) {
        alert('Fehler: Ihre Kontaktdaten sind unvollständig. Bitte melden Sie sich erneut an.');
        return;
      }

      // Angebot über API erstellen
      // WICHTIG: Verwende IMMER die aktuellen User-Daten für Kontaktinformationen
      const quoteData = {
        title: costEstimateData.title || `Angebot für ${selectedTradeForQuote.title}`,
        description: costEstimateData.description || '',
        project_id: selectedTradeForQuote.project_id,
        milestone_id: selectedTradeForQuote.id,
        // service_provider_id wird vom Backend automatisch gesetzt - nicht senden
        // status wird vom Backend auf DRAFT gesetzt und dann auf SUBMITTED geändert
        total_amount: parseFloat(costEstimateData.total_amount) || 0,
        currency: costEstimateData.currency || 'EUR', // Standard EUR wie im Schema
        ...(costEstimateData.valid_until && { valid_until: costEstimateData.valid_until }),
        ...(costEstimateData.labor_cost && { labor_cost: parseFloat(costEstimateData.labor_cost) }),
        ...(costEstimateData.material_cost && { material_cost: parseFloat(costEstimateData.material_cost) }),
        ...(costEstimateData.overhead_cost && { overhead_cost: parseFloat(costEstimateData.overhead_cost) }),
        ...(costEstimateData.estimated_duration && { estimated_duration: parseInt(costEstimateData.estimated_duration) }),
        ...(costEstimateData.start_date && { start_date: costEstimateData.start_date }),
        ...(costEstimateData.completion_date && { completion_date: costEstimateData.completion_date }),
        payment_terms: costEstimateData.payment_terms || '30_days',
        warranty_period: parseInt(costEstimateData.warranty_period) || 12,
        // KRITISCH: Verwende IMMER aktuelle User-Daten, nicht Form-Daten
        company_name: user.company_name || costEstimateData.company_name || '',
        contact_person: `${user.first_name} ${user.last_name}`,
        phone: user.phone || costEstimateData.phone || '',
        email: user.email, // IMMER user.email verwenden
        website: user.company_website || costEstimateData.website || '',
        // Alle neuen Felder hinzufügen
        quote_number: costEstimateData.quote_number || '',
        qualifications: costEstimateData.qualifications || '',
        references: costEstimateData.references || '',
        certifications: costEstimateData.certifications || '',
        technical_approach: costEstimateData.technical_approach || '',
        quality_standards: costEstimateData.quality_standards || '',
        safety_measures: costEstimateData.safety_measures || '',
        environmental_compliance: costEstimateData.environmental_compliance || '',
        risk_assessment: costEstimateData.risk_assessment || '',
        contingency_plan: costEstimateData.contingency_plan || '',
        additional_notes: costEstimateData.additional_notes || ''
      };

      console.log('🔍 Quote-Erstellung mit Daten:', {
        project_id: quoteData.project_id,
        milestone_id: quoteData.milestone_id,
        total_amount: quoteData.total_amount,
        email: quoteData.email,
        contact_person: quoteData.contact_person,
        company_name: quoteData.company_name,
        userId: user.id,
        userEmail: user.email,
        apiUrl: window.location.hostname
      });

      // Prüfe API-Verbindung vor dem Request
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('❌ Kein Token im localStorage gefunden');
        alert('Fehler: Sie sind nicht angemeldet. Bitte melden Sie sich erneut an.');
        return;
      }

      console.log('🔑 Token gefunden, erstelle Angebot...');
      const newQuote = await createQuote(quoteData);
      
      console.log('✅ ServiceProviderDashboard: Angebot erfolgreich erstellt:', newQuote);
      console.log('🔍 ServiceProviderDashboard: Trade-Daten für Benachrichtigung:', selectedTradeForQuote);
      
      // Erstelle Erfolgs-Benachrichtigung für Dienstleister
      await createQuoteSubmissionNotification(newQuote, selectedTradeForQuote);
      
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
      
      // Service Provider Angebote aktualisieren
      updatePromises.push(loadServiceProviderQuotes());
      
      // Beide Updates parallel ausführen
      await Promise.all(updatePromises);
      
      } catch (error) {
      console.error('❌ Fehler beim Erstellen des Angebots:', error);
      
      // Detaillierte Fehlerbehandlung
      if (error.response) {
        const status = error.response.status;
        const data = error.response.data;
        
        console.error('❌ API-Fehler:', {
          status,
          data,
          url: error.config?.url
        });
        
        if (status === 401) {
          alert('Fehler: Sie sind nicht angemeldet oder Ihre Sitzung ist abgelaufen. Bitte melden Sie sich erneut an.');
        } else if (status === 422) {
          const errorMessage = data?.detail || data?.message || 'Validierungsfehler';
          alert(`Fehler: ${errorMessage}`);
        } else if (status === 500) {
          alert('Fehler: Server-Fehler. Bitte versuchen Sie es später erneut.');
        } else {
          alert(`Fehler: ${status} - ${data?.message || 'Unbekannter Fehler'}`);
        }
      } else if (error.request) {
        console.error('❌ Netzwerk-Fehler:', error.request);
        alert('Fehler: Keine Verbindung zum Server. Bitte überprüfen Sie Ihre Internetverbindung.');
      } else {
        console.error('❌ Unbekannter Fehler:', error.message);
        alert(`Fehler: ${error.message || 'Ein unbekannter Fehler ist aufgetreten'}`);
      }
    }
  };

  // Erstelle Benachrichtigung nach Angebot-Abgabe
  const createQuoteSubmissionNotification = async (quote: any, trade: any) => {
    try {
      console.log('📢 ServiceProviderDashboard: Erstelle Angebot-Benachrichtigung...');
      console.log('📢 ServiceProviderDashboard: Quote-Daten:', quote);
      console.log('📢 ServiceProviderDashboard: Trade-Daten:', trade);
      
      // Erstelle lokale Benachrichtigung für sofortige Anzeige
      const notification = {
        id: Date.now(), // Temporäre ID
        type: 'quote_submitted' as const,
        title: 'Angebot erfolgreich eingereicht! 🎉',
        message: `Ihr Angebot für "${trade?.title || 'Gewerk'}" wurde erfolgreich eingereicht.`,
        description: `Angebotssumme: ${new Intl.NumberFormat('de-DE', { 
          style: 'currency', 
          currency: quote.currency || 'CHF' 
        }).format(quote.total_amount || 0)} | Projekt: ${trade?.project_name || 'Unbekannt'}`,
        timestamp: new Date().toISOString(),
        isNew: true,
        tradeId: trade?.id,
        quoteId: quote.id,
        priority: 'normal' as const,
        actionRequired: false,
        projectName: trade?.project_name,
        quoteSummary: {
          amount: quote.total_amount,
          currency: quote.currency,
          validUntil: quote.valid_until,
          startDate: quote.start_date,
          completionDate: quote.completion_date
        }
      };

      console.log('📢 Benachrichtigung erstellt:', notification);

      // Event für NotificationTab auslösen (Dienstleister)
      window.dispatchEvent(new CustomEvent('quoteSubmitted', {
        detail: {
          notification: notification,
          quote: quote,
          trade: trade
        }
      }));
      
      // Event für Bautraeger wird bereits vom quoteService.ts ausgelöst
      // Kein separates Event nötig
      console.log('📢 ServiceProviderDashboard: Event für Bautraeger wird vom quoteService.ts ausgelöst');

      // Browser-Benachrichtigung falls erlaubt
      if ('Notification' in window && Notification.permission === 'granted') {
        const browserNotification = new Notification('Angebot eingereicht! 🎉', {
          body: `Ihr Angebot für "${trade?.title}" wurde erfolgreich eingereicht.`,
          icon: '/favicon.ico',
          tag: `quote-${quote.id}`,
          requireInteraction: true
        });
        
        // Klick auf Browser-Benachrichtigung öffnet die Ausschreibung
        browserNotification.onclick = () => {
          window.dispatchEvent(new CustomEvent('openTradeDetails', {
            detail: {
              tradeId: trade?.id,
              source: 'browser_notification'
            }
          }));
          browserNotification.close();
        };
      }

      // Backend-Benachrichtigungen werden automatisch vom quote_service.py erstellt
      // Keine manuellen Backend-Benachrichtigungen nötig
      console.log('📢 ServiceProviderDashboard: Backend-Benachrichtigungen werden automatisch erstellt');

    } catch (error) {
      console.error('❌ Fehler beim Erstellen der Angebot-Benachrichtigung:', error);
      // Nicht kritisch - Angebot wurde trotzdem erstellt
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

  // Dashboard-Karten entfernt - Funktionalität über Radiales Menü verfügbar

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
    <>
      <div className="service-providerdashboard min-h-screen bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460] p-6">
      {/* Header mit Dienstleister-Informationen */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2" data-tour-id="dashboard-title">
              Willkommen zurück, {user?.first_name || user?.name || 'Dienstleister'}! 🔧
            </h1>
            <p className="text-gray-300 text-lg md:block hidden md:whitespace-normal">
              Dashboard|Aufträge, Angebote und mehr
            </p>
            <p className="text-gray-300 text-lg md:hidden block whitespace-nowrap overflow-hidden text-ellipsis">
               Aufträge & Angebote verwalten.
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${isOnline ? 'bg-green-400' : 'bg-red-400'}`}></div>
            <span className="text-sm text-gray-300">{isOnline ? 'Online' : 'Offline'}</span>
          </div>
        </div>

        {/* Zahlungsaufforderungs-Banner */}
        {accountStatus?.has_overdue_fees && (
          <div className="mb-6 p-4 bg-gradient-to-r from-red-500/20 to-red-600/10 backdrop-blur-lg border border-red-500/30 rounded-xl shadow-lg shadow-red-500/20 animate-pulse">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0 w-8 h-8 bg-red-500/20 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-red-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-red-200 mb-1">
                    ⚠️ Zahlungsaufforderung
                  </h3>
                  <p className="text-sm text-red-300/90 mb-2">
                    Sie haben {accountStatus.overdue_fees.length} überfällige Zahlung{accountStatus.overdue_fees.length > 1 ? 'en' : ''} 
                    in Höhe von {formatCurrency(accountStatus.total_overdue_amount)}.
                  </p>
                  <p className="text-xs text-red-400/80">
                    Bitte begleichen Sie diese Zahlungen umgehend, um eine Sperrung Ihres Accounts zu vermeiden.
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => navigate('/service-provider/buildwise-fees')}
                  className="group flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl font-semibold hover:from-red-700 hover:to-red-800 transition-all duration-300 transform hover:scale-105 shadow-lg shadow-red-500/50 hover:shadow-red-500/70"
                >
                  <ExternalLink className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" />
                  <span>Jetzt bezahlen</span>
                </button>
                <button
                  onClick={() => checkPaymentStatus()}
                  disabled={isCheckingAccountStatus}
                  className="group p-2 text-red-400 hover:text-red-300 transition-all duration-200 hover:bg-red-500/20 rounded-lg hover:scale-110 disabled:opacity-50"
                  title="Status aktualisieren"
                >
                  <RefreshCw className={`w-4 h-4 group-hover:scale-110 transition-transform duration-200 ${isCheckingAccountStatus ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Shortcut-Zeile mit wichtigen Funktionen */}
        <div className="mb-8">
          <div className="grid grid-cols-4 gap-2 md:gap-4">
            {/* Dokument-Kachel */}
            <button
              onClick={() => navigate('/documents')}
              className="group bg-gradient-to-br from-blue-500/20 to-blue-600/10 backdrop-blur-lg rounded-xl p-2 md:p-4 border border-blue-500/30 hover:border-blue-400/50 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/20 hover:scale-105"
            >
              <div className="flex flex-col items-center text-center space-y-1 md:space-y-2">
                <div className="p-2 md:p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-lg group-hover:shadow-blue-500/30 transition-all duration-300">
                  <FileText size={16} className="md:w-5 md:h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-xs md:text-sm font-semibold text-white group-hover:text-blue-300 transition-colors">Dokument</h3>
                </div>
              </div>
            </button>

            {/* Angebote-Kachel */}
            <button
              onClick={() => {
                // Scroll zum Abschnitt "Ausschreibungen in Ihrer Nähe"
                const geoSearchSection = document.querySelector('[data-tour-id="geo-search-section"]');
                if (geoSearchSection) {
                  geoSearchSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
              }}
              className="group bg-gradient-to-br from-green-500/20 to-green-600/10 backdrop-blur-lg rounded-xl p-2 md:p-4 border border-green-500/30 hover:border-green-400/50 transition-all duration-300 hover:shadow-lg hover:shadow-green-500/20 hover:scale-105"
            >
              <div className="flex flex-col items-center text-center space-y-1 md:space-y-2">
                <div className="p-2 md:p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-lg group-hover:shadow-green-500/30 transition-all duration-300">
                  <Gavel size={16} className="md:w-5 md:h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-xs md:text-sm font-semibold text-white group-hover:text-green-300 transition-colors">Angebote</h3>
                </div>
              </div>
            </button>

            {/* Rechnungen-Kachel */}
            <button
              onClick={() => navigate('/invoices')}
              className="group bg-gradient-to-br from-purple-500/20 to-purple-600/10 backdrop-blur-lg rounded-xl p-2 md:p-4 border border-purple-500/30 hover:border-purple-400/50 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/20 hover:scale-105"
            >
              <div className="flex flex-col items-center text-center space-y-1 md:space-y-2">
                <div className="p-2 md:p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-lg group-hover:shadow-purple-500/30 transition-all duration-300">
                  <Euro size={16} className="md:w-5 md:h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-xs md:text-sm font-semibold text-white group-hover:text-purple-300 transition-colors">Rechnungen</h3>
                </div>
              </div>
            </button>

            {/* Gebühren-Kachel */}
            <button
              onClick={() => navigate('/service-provider/buildwise-fees')}
              className="group bg-gradient-to-br from-orange-500/20 to-orange-600/10 backdrop-blur-lg rounded-xl p-2 md:p-4 border border-orange-500/30 hover:border-orange-400/50 transition-all duration-300 hover:shadow-lg hover:shadow-orange-500/20 hover:scale-105"
            >
              <div className="flex flex-col items-center text-center space-y-1 md:space-y-2">
                <div className="p-2 md:p-3 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg shadow-lg group-hover:shadow-orange-500/30 transition-all duration-300">
                  <TrendingUp size={16} className="md:w-5 md:h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-xs md:text-sm font-semibold text-white group-hover:text-orange-300 transition-colors">Gebühren</h3>
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Dienstleister-Profil-Karte */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 transition-all duration-300 hover:bg-white/15 relative z-20">
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
            
            {/* Rang-Anzeige */}
            <UserRankDisplay className="mb-4" />
            
            {/* Badges entfernt */}
          </div>

          {/* Statistiken entfernt */}
        </div>
      </div>

      {/* Dashboard-Karten entfernt - Funktionalität jetzt über Radiales Menü */}

      {/* Kanban-Board für To-Do Aufgaben */}
      <div className="mb-8 relative z-10" data-tour-id="kanban-board-section">
        <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-2xl">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-gradient-to-br from-[#10B981] to-[#059669] rounded-xl shadow-lg shadow-[#10B981]/20">
              <CheckSquare size={24} className="text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">To-Do Aufgaben</h2>
              <p className="text-gray-400 text-sm mt-1">
                Verwalten Sie Ihre Aufgaben im Kanban-Board
              </p>
            </div>
          </div>
          
          {/* Kanban Board Container - Mit Error Boundary */}
          <div className="bg-white/5 rounded-xl p-4 border border-white/10 mobile-container">
            <React.Suspense fallback={
              <div className="text-center py-8 text-white">
                <p className="text-lg font-semibold mb-2">Kanban Board wird geladen...</p>
              </div>
            }>
              <KanbanBoard 
                key={`kanban-${user?.id}`}
                showOnlyAssignedToMe={true}
                showArchived={false}
                className="compact mobile-scroll"
                mobileViewMode="auto"
              />
            </React.Suspense>
          </div>
        </div>
      </div>

      {/* Ressourcenverwaltung Sektion - Einklappbar */}
      <div className="mb-8 bg-gradient-to-br from-[#ffbd59]/10 to-[#ffa726]/5 backdrop-blur-xl rounded-2xl border border-[#ffbd59]/20 shadow-2xl hover:shadow-[0_0_30px_rgba(255,189,89,0.15)] transition-all duration-300" data-tour-id="resource-management-section">
        {/* Header mit Icon - Einklappbar */}
        <div className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-[#ffbd59] to-[#ffa726] rounded-xl shadow-lg shadow-[#ffbd59]/20">
              <Users size={24} className="text-[#2c3539]" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold text-white">Ressourcenverwaltung</h2>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowResourceManagement(true)}
                    className="px-3 py-1.5 bg-[#ffbd59]/20 text-[#ffbd59] rounded-lg hover:bg-[#ffbd59]/30 transition-colors text-xs font-medium border border-[#ffbd59]/30"
                    data-tour-id="resource-create-button"
                  >
                    <Plus size={14} className="inline mr-1" />
                    Ressourcen ausschreiben
                  </button>
                  <button
                    onClick={() => setShowResourceSection(!showResourceSection)}
                    className="px-2 py-1.5 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors"
                    title={showResourceSection ? 'Bereich einklappen' : 'Bereich ausklappen'}
                  >
                    <ChevronDown className={`w-4 h-4 transition-transform ${showResourceSection ? 'rotate-180' : ''}`} />
                  </button>
                </div>
              </div>
              <p className="text-gray-400 text-sm mt-1">Personal- und Kapazitätsplanung für Ihre Projekte</p>
            </div>
          </div>
        </div>
        
        {/* Einklappbarer Inhaltsbereich */}
        {showResourceSection && (
          <div className="px-6 pb-6 space-y-6">
            {/* Info Banner */}
            <div className="p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-blue-400 mb-1">Ressourcen intelligent verwalten</p>
                  <p className="text-xs text-gray-300">
                  Teile deine verfügbaren Mitarbeiter und Kapazitäten mit Bauträgern. Diese können deine Ressourcen für Projekte vormerken und dich zu Angeboten einladen.
                    <br />
                    <span className="text-[#ffbd59] font-medium">🎯 Angezogene Ressourcen</span> werden hier markiert angezeigt.
                  </p>
                </div>
              </div>
            </div>

            {/* Ressourcen Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4" data-tour-id="resource-stats">
              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <div className="flex items-center gap-3">
                  <Users size={20} className="text-[#ffbd59]" />
              <div>
                <p className="text-gray-400 text-xs">Verfügbare Mitarbeiter</p>
                <p className="text-2xl font-bold text-white">{resourceStats.totalEmployees || 0}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {userResources.length > 0 ? 'Aktive Ressourcen' : 'Noch keine angelegt'}
                </p>
              </div>
            </div>
          </div>
          
              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <div className="flex items-center gap-3">
                  <Users size={20} className="text-[#ffbd59]" />
              <div>
                <p className="text-gray-400 text-xs">Angezogene Ressourcen</p>
                <p className="text-2xl font-bold text-[#ffbd59]">{resourceAllocations.filter(a => a.allocation_status === 'pre_selected').length}</p>
                <p className="text-xs text-[#ffbd59] mt-1">
                  {resourceAllocations.filter(a => a.allocation_status === 'pre_selected').length > 0 ? 'Von Bauträgern ausgewählt' : 'Keine Auswahlen'}
                </p>
              </div>
            </div>
          </div>
          
              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <div className="flex items-center gap-3">
                  <Clock size={20} className="text-blue-400" />
              <div>
                <p className="text-gray-400 text-xs">Personentage (Monat)</p>
                <p className="text-2xl font-bold text-white">{resourceStats.totalPersonDays || 0}</p>
                <p className="text-xs text-blue-400 mt-1">{resourceStats.totalHours || 0} Stunden</p>
              </div>
            </div>
          </div>
          
              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <div className="flex items-center gap-3">
                  <TrendingUp size={20} className="text-green-400" />
              <div>
                <p className="text-gray-400 text-xs">Auslastung</p>
                <p className="text-2xl font-bold text-white">
                  {resourceStats.utilization > 0 ? `${resourceStats.utilization}%` : '-'}
                </p>
                <p className="text-xs text-yellow-400 mt-1">
                  {resourceStats.utilization > 80 ? 'Hoch' : 
                   resourceStats.utilization > 50 ? 'Optimal' : 
                   resourceStats.utilization > 0 ? 'Niedrig' : 'Keine Daten'}
                </p>
              </div>
            </div>
          </div>
            </div>
            
            {/* Aktionsbuttons */}
            <div className="flex flex-wrap gap-3 mt-6">
              <button
                onClick={() => setShowResourceCalendar(true)}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-white/5 text-white rounded-lg hover:bg-white/10 transition-colors border border-white/10"
              >
                <Calendar size={18} />
                <span className="text-sm font-medium">Kalenderansicht</span>
              </button>
              
              <button
                onClick={() => setShowResourceKPIs(true)}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-white/5 text-white rounded-lg hover:bg-white/10 transition-colors border border-white/10"
              >
                <BarChart size={18} />
                <span className="text-sm font-medium">KPI Dashboard</span>
              </button>
            </div>
        
            {/* Einklappbarer Bereich für Ressourcendetails */}
            {showResourceDetails && (
              <div className="mt-6 space-y-3 animate-fadeIn">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-300">Ihre Ressourcen</h3>
                  <button
                    onClick={() => setShowResourceDetails(false)}
                    className="text-xs text-gray-400 hover:text-white transition-colors"
                  >
                    Ausblenden
                  </button>
                </div>
                
                {userResources.length > 0 ? (
                  <div className="space-y-2">
                    {userResources.slice(0, 3).map((resource: any, index: number) => {
                      const personDays = Math.ceil(
                        (new Date(resource.end_date).getTime() - new Date(resource.start_date).getTime()) / 
                        (1000 * 60 * 60 * 24)
                      ) * (resource.person_count || 1);
                      
                      // Prüfe ob diese Ressource angezogen wurde
                      const isAllocated = isResourceAllocated(resource.id);
                      const allocationDetails = getResourceAllocationDetails(resource.id);
                      
                      return (
                        <div key={resource.id || index} className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                          isAllocated 
                            ? 'bg-[#ffbd59]/10 border-[#ffbd59]/30 hover:bg-[#ffbd59]/20' 
                            : 'bg-white/5 border-white/10 hover:bg-white/10'
                        }`}>
                          <div className="flex items-center gap-3">
                            <div className={`w-2 h-2 rounded-full ${
                              isAllocated ? 'bg-[#ffbd59]' :
                              resource.status === 'available' ? 'bg-green-400' : 
                              resource.status === 'allocated' ? 'bg-blue-400' : 
                              'bg-yellow-400'
                            }`}></div>
                            <div>
                              {/* Ressourcen-Titel */}
                              {resource.title && (
                                <h4 className="text-sm font-semibold text-white mb-1">
                                  {resource.title}
                                </h4>
                              )}
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-medium text-white">
                                  {resource.person_count} {translateCategory(resource.category) || 'Mitarbeiter'}
                                  {resource.subcategory && (
                                    <span className="text-gray-400 ml-1">
                                      ({translateSubcategory(resource.subcategory)})
                                    </span>
                                  )}
                                </p>
                                {isAllocated && (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-[#ffbd59]/20 text-[#ffbd59] border border-[#ffbd59]/30">
                                    🎯 Angezogen
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-gray-400">
                                {resource.address_city || 'Standort'} - ab {new Date(resource.start_date).toLocaleDateString('de-DE')}
                              </p>
                              {isAllocated && allocationDetails && (
                                <div className="mt-2 space-y-1">
                                  <p className="text-xs text-[#ffbd59]">
                                    📅 {new Date(allocationDetails.allocated_start_date).toLocaleDateString('de-DE')} - {new Date(allocationDetails.allocated_end_date).toLocaleDateString('de-DE')}
                                  </p>
                                  <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs text-purple-300">
                                        🔗 {allocationDetails.trade?.title || `Ausschreibung #${allocationDetails.trade_id}`}
                                      </span>
                                      <button
                                        onClick={() => {
                                          // Prüfe ob trade_id gültig ist
                                          if (!allocationDetails.trade_id || allocationDetails.trade_id === 0) {
                                            console.error('❌ ServiceProviderDashboard: Ungültige trade_id:', allocationDetails.trade_id);
                                            alert('Die Ausschreibung konnte nicht gefunden werden. Die Ressourcen-Zuweisung enthält ungültige Daten.');
                                            return;
                                          }
                                          
                                          // Event für TradeDetailsModal auslösen
                                          window.dispatchEvent(new CustomEvent('openTradeDetails', {
                                            detail: {
                                              tradeId: allocationDetails.trade_id,
                                              source: 'resource_management'
                                            }
                                          }));
                                        }}
                                        className="text-xs text-purple-300 hover:text-purple-200 underline"
                                      >
                                        Anzeigen
                                      </button>
                                    </div>
                                    {allocationDetails.bautraeger && (
                                      <div className="text-xs text-gray-400">
                                        👤 {allocationDetails.bautraeger.first_name} {allocationDetails.bautraeger.last_name}
                                        {allocationDetails.bautraeger.company_name && ` (${allocationDetails.bautraeger.company_name})`}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="text-xs text-[#ffbd59] font-medium">{personDays} Personentage</div>
                            <button
                              onClick={() => handleShowResourceDetails(resource)}
                              className="px-3 py-1 bg-purple-500/20 text-purple-300 rounded-lg hover:bg-purple-500/30 transition-colors text-xs font-medium border border-purple-500/30"
                            >
                              Details
                            </button>
                          </div>
                        </div>
                      );
                    })}
                    
                    {userResources.length > 3 && (
                      <button
                        onClick={() => navigate('/resources')}
                        className="w-full p-2 text-center text-xs text-[#ffbd59] hover:text-[#ffa726] transition-colors"
                      >
                        +{userResources.length - 3} weitere Ressourcen anzeigen
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-6 bg-white/5 rounded-lg border border-white/10">
                    <Users className="w-12 h-12 text-gray-500 mx-auto mb-3" />
                    <p className="text-sm text-gray-400 mb-3">Noch keine Ressourcen angelegt</p>
                    <button
                      onClick={() => setShowResourceManagement(true)}
                      className="px-4 py-2 bg-[#ffbd59]/20 text-[#ffbd59] rounded-lg hover:bg-[#ffbd59]/30 transition-colors text-xs font-medium border border-[#ffbd59]/30"
                    >
                      Erste Ressource anlegen
                    </button>
                  </div>
                )}
              </div>
            )}
            
            {/* Zeige/Verstecke Details Button */}
            {!showResourceDetails && userResources.length > 0 && (
              <div className="mt-4 text-center">
                <button
                  onClick={() => setShowResourceDetails(true)}
                  className="text-xs text-[#ffbd59] hover:text-[#ffa726] transition-colors"
                >
                  Details anzeigen ({userResources.length} Ressourcen)
                </button>
              </div>
            )}
          </div>
        )}
        
        {/* Berechnungshinweis */}
        <div className="mt-4 p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
          <div className="flex items-start gap-2">
            <AlertTriangle size={16} className="text-yellow-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs text-yellow-400 font-medium">Automatische Berechnung</p>
              <p className="text-xs text-gray-300 mt-1">
                Personentage werden automatisch berechnet: Anzahl Personen × Arbeitstage × tägliche Stunden.
                Ein Personentag entspricht 8 Arbeitsstunden.
              </p>
            </div>
          </div>
        </div>
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

      {/* Moderne Zwei-Spalten Layout: Angebotsbereich + Geo-Search */}
      {/* Mobile: Einspaltiges Layout | Desktop: Zwei-Spalten | Expanded: Vollbild */}
      <div className={`mb-8 transition-all duration-500 ${geoSearchExpanded ? 'fixed inset-0 z-[99999] bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460] p-6 overflow-y-auto' : ''}`}>
        <div className={`transition-all duration-1000 ease-out ${
          geoSearchExpanded 
            ? 'max-w-7xl mx-auto' 
            : 'grid grid-cols-1 xl:grid-cols-2 gap-8'
        }`}>
          
          {/* Linke Spalte: Angebotsverfahren / Gewonnene Ausschreibungen mit Toggle */}
          <div className={`${geoSearchExpanded ? 'hidden' : 'space-y-6'}`} data-tour-id="offer-management-section">
            {/* Moderner Toggle-Header */}
            <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-gradient-to-br from-[#ffbd59] to-[#ffa726] rounded-xl shadow-lg shadow-[#ffbd59]/20">
                    <FileText size={24} className="text-[#2c3539]" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">Angebots-Management</h2>
                    <p className="text-gray-400 text-sm mt-1">
                      Verwalte deine Ausschreibungen und gewonnenen Projekte
                    </p>
                  </div>
                </div>
              </div>

              {/* Übersichtskarten für Angebotsverfahren und Gewonnene Projekte */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {/* Angebotsverfahren Karte */}
                <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-xl p-4 border border-blue-500/20 hover:border-blue-400/40 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/20">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-500/20 rounded-lg">
                        <Gavel size={20} className="text-blue-400" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-white text-sm">Angebotsverfahren</h3>
                        <p className="text-gray-400 text-xs">Laufende Angebote</p>
                      </div>
                    </div>
                    <div className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-xs font-medium">
                      {getAllTradesWithQuotes.filter(trade => getServiceProviderQuoteStatus(trade.id) !== 'accepted').length}
                    </div>
                  </div>
                </div>

                {/* Gewonnene Projekte Karte */}
                <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-xl p-4 border border-green-500/20 hover:border-green-400/40 transition-all duration-300 hover:shadow-lg hover:shadow-green-500/20">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-500/20 rounded-lg">
                        <Award size={20} className="text-green-400" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-white text-sm">Gewonnene Projekte</h3>
                        <p className="text-gray-400 text-xs">Aktive Aufträge</p>
                      </div>
                    </div>
                    <div className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-xs font-medium">
                      {getAllTradesWithQuotes.filter(trade => getServiceProviderQuoteStatus(trade.id) === 'accepted' && trade.completion_status !== 'completed').length}
                    </div>
                  </div>
                </div>
              </div>


              {/* Content-Bereich */}
              <div className="space-y-6">
                {/* Angebotsverfahren Section */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                      <Gavel size={20} className="text-blue-400" />
                      Angebotsverfahren
                    </h3>
                    <div className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-xs font-medium">
                      {getAllTradesWithQuotes.filter(trade => getServiceProviderQuoteStatus(trade.id) !== 'accepted').length}
                    </div>
                  </div>
                  
                  <div className="bidding-cards-container">
                    {getAllTradesWithQuotes
                      .filter(trade => getServiceProviderQuoteStatus(trade.id) !== 'accepted')
                      .map((trade) => {
                        const quoteStatus = getServiceProviderQuoteStatus(trade.id);
                        const quote = getServiceProviderQuote(trade.id);
                        
                        return (
                          <div key={trade.id} className="bidding-card bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-xl p-4 border border-blue-500/20 hover:border-blue-400/40 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/20">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-500/20 rounded-lg">
                                  {getCategoryIcon(trade.category)}
                                </div>
                                <div>
                                  <h3 className="font-semibold text-white text-sm">
                                    {trade.title}
                                    {trade.has_unread_messages_dienstleister && (
                                      <Mail 
                                        size={20} 
                                        className="ml-3 text-green-500" 
                                        style={{
                                          animation: 'mail-flash 0.5s linear infinite !important',
                                          animationName: 'mail-flash !important',
                                          animationDuration: '0.5s !important',
                                          animationTimingFunction: 'linear !important',
                                          animationIterationCount: 'infinite !important',
                                          filter: 'drop-shadow(0 0 8px #00ff00)',
                                          fontWeight: 'bold',
                                          fontSize: '20px',
                                          willChange: 'opacity',
                                          display: 'inline-block'
                                        }}
                                      />
                                    )}
                                  </h3>
                                  <p className="text-gray-400 text-xs">Projekt ID: {trade.project_id}</p>
                                  {/* Beschreibung mit Trunkierung für Angebotsverfahren */}
                                  {trade.description && (
                                    <div className="mt-1">
                                      <p className="text-gray-300 text-xs leading-relaxed">
                                        {isDescriptionExpanded(trade.id) 
                                          ? trade.description 
                                          : truncateText(trade.description, 80)
                                        }
                                      </p>
                                      {trade.description.length > 80 && (
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            toggleDescriptionExpansion(trade.id);
                                          }}
                                          className="inline-flex items-center gap-1 mt-1 text-xs text-blue-400 hover:text-blue-300 transition-colors"
                                        >
                                          {isDescriptionExpanded(trade.id) ? 'Weniger' : 'Mehr'}
                                        </button>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div className={`px-3 py-1 rounded-full text-xs font-medium backdrop-blur-sm ${
                                quoteStatus === 'accepted' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                                quoteStatus === 'under_review' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
                                quoteStatus === 'rejected' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                                'bg-blue-500/20 text-blue-400 border border-blue-500/30'
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
                  
                  {getAllTradesWithQuotes.filter(trade => getServiceProviderQuoteStatus(trade.id) !== 'accepted').length === 0 && (
                    <div className="text-center py-12">
                      <Gavel size={48} className="mx-auto mb-4 text-gray-500" />
                      <h3 className="text-lg font-semibold text-gray-300 mb-2">Keine laufenden Angebote</h3>
                      <p className="text-gray-400 text-sm max-w-md mx-auto">
                        Du hast derzeit keine Angebote im Angebotsverfahren. Nutze die Geo-Search rechts, um passende Ausschreibungen zu finden.
                      </p>
                    </div>
                  )}
                </div>

                {/* Gewonnene Projekte Section */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                      <Award size={20} className="text-green-400" />
                      Gewonnene Projekte
                    </h3>
                    <div className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-xs font-medium">
                      {getAllTradesWithQuotes.filter(trade => getServiceProviderQuoteStatus(trade.id) === 'accepted' && trade.completion_status !== 'completed').length}
                    </div>
                  </div>
                  
                  <div className="bidding-cards-container">
                    {getAllTradesWithQuotes
                      .filter(trade => getServiceProviderQuoteStatus(trade.id) === 'accepted' && trade.completion_status !== 'completed')
                      .map((trade) => {
                        const quote = getServiceProviderQuote(trade.id);
                        
                        // Verwende nur den tatsächlichen completion_status aus den Daten
                        const actualCompletionStatus = trade.completion_status || 'in_progress';
                        
                        // Berechne Fortschritt basierend auf Start- und Enddatum
                        const getProgressPercentage = () => {
                          if (!quote?.start_date || !quote?.completion_date) return 0;
                          const start = new Date(quote.start_date);
                          const end = new Date(quote.completion_date);
                          const now = new Date();
                          const total = end.getTime() - start.getTime();
                          const elapsed = now.getTime() - start.getTime();
                          return Math.min(Math.max((elapsed / total) * 100, 0), 100);
                        };
                        
                        const progressPercentage = getProgressPercentage();
                        
                        return (
                          <div 
                            key={trade.id} 
                            className="bidding-card group relative overflow-hidden bg-gradient-to-br from-green-500/5 via-emerald-500/10 to-green-600/5 rounded-2xl p-6 border border-green-500/20 hover:border-green-400/50 transition-all duration-500 hover:shadow-2xl hover:shadow-green-500/25 backdrop-blur-sm cursor-pointer"
                            onClick={() => {
                              setDetailTrade(trade);
                              setShowTradeDetails(true);
                            }}
                          >
                            {/* Glow-Effekt */}
                            <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 via-emerald-500/5 to-green-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl"></div>
                            
                            {/* Glassmorph-Effekt */}
                            <div className="absolute inset-0 bg-white/5 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl"></div>
                            
                            <div className="relative z-10">
                              <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-4">
                                  <div className="p-3 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-xl shadow-lg group-hover:shadow-green-500/30 transition-all duration-300">
                                    {getCategoryIcon(trade.category)}
                                  </div>
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                      <h3 className="font-bold text-white text-base group-hover:text-green-300 transition-colors duration-300">
                                        {trade.title}
                                      </h3>
                                      {trade.has_unread_messages_dienstleister && (
                                        <div className="relative">
                                          <Mail 
                                            size={16} 
                                            className="text-blue-400 animate-pulse" 
                                            title="Ungelesene Nachrichten"
                                          />
                                          <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-400 rounded-full animate-ping"></div>
                                        </div>
                                      )}
                                    </div>
                                    <p className="text-gray-400 text-sm mb-2">Projekt ID: {trade.project_id}</p>
                                    
                                    {/* Beschreibung mit verbessertem Design */}
                                    {trade.description && (
                                      <div className="mt-2">
                                        <p className="text-gray-300 text-sm leading-relaxed">
                                          {isDescriptionExpanded(trade.id) 
                                            ? trade.description 
                                            : truncateText(trade.description, 100)
                                          }
                                        </p>
                                        {trade.description.length > 100 && (
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              toggleDescriptionExpansion(trade.id);
                                            }}
                                            className="inline-flex items-center gap-1 mt-2 text-sm text-green-400 hover:text-green-300 transition-colors font-medium"
                                          >
                                            {isDescriptionExpanded(trade.id) ? 'Weniger anzeigen' : 'Mehr anzeigen'}
                                            <span className="text-xs">{isDescriptionExpanded(trade.id) ? '▲' : '▼'}</span>
                                          </button>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </div>
                                
                                {/* Status und Budget */}
                                <div className="text-right flex-shrink-0">
                                  <div className="px-3 py-1 bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-400 rounded-full text-sm font-semibold mb-3 shadow-lg">
                                    {getCompletionStatusLabel(actualCompletionStatus)}
                                  </div>
                                  {quote && (
                                    <div className="text-green-300 text-lg font-bold mb-2">
                                      {formatCurrency(quote.total_amount)} CHF
                                    </div>
                                  )}
                                </div>
                              </div>
                              
                              {/* Erweiterte Projektinformationen */}
                              <div className="grid grid-cols-2 gap-6 mb-6">
                                <div className="space-y-3">
                                  <div className="flex justify-between items-center">
                                    <span className="text-gray-400 text-sm font-medium">Fertigstellung:</span>
                                    <span className="text-white text-sm font-semibold">
                                      {quote?.completion_date ? new Date(quote.completion_date).toLocaleDateString('de-DE') : 'Nicht festgelegt'}
                                    </span>
                                  </div>
                                  <div className="flex justify-between items-center">
                                    <span className="text-gray-400 text-sm font-medium">Projektstart:</span>
                                    <span className="text-white text-sm font-semibold">
                                      {quote?.start_date ? new Date(quote.start_date).toLocaleDateString('de-DE') : 'Nicht festgelegt'}
                                    </span>
                                  </div>
                                </div>
                                <div className="space-y-3">
                                  <div className="flex justify-between items-center">
                                    <span className="text-gray-400 text-sm font-medium">Kategorie:</span>
                                    <span className="text-white text-sm font-semibold">{trade.category || 'Unbekannt'}</span>
                                  </div>
                                  <div className="flex justify-between items-center">
                                    <span className="text-gray-400 text-sm font-medium">Standort:</span>
                                    <span className="text-white text-sm font-semibold">
                                      {(() => {
                                        // Priorität: location > address_city > address_street > address_zip
                                        if (trade.location) return trade.location;
                                        if (trade.address_city) return trade.address_city;
                                        if (trade.address_street) return trade.address_street;
                                        if (trade.address_zip) return trade.address_zip;
                                        return 'Nicht angegeben';
                                      })()}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              
                              {/* Fortschrittsbalken */}
                              {quote?.start_date && quote?.completion_date && (
                                <div className="mb-6">
                                  <div className="flex justify-between items-center mb-2">
                                    <span className="text-gray-400 text-sm font-medium">Projektfortschritt</span>
                                    <span className="text-green-400 text-sm font-semibold">{Math.round(progressPercentage)}%</span>
                                  </div>
                                  <div className="w-full bg-gray-700/50 rounded-full h-2 overflow-hidden">
                                    <div 
                                      className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full transition-all duration-1000 ease-out shadow-lg"
                                      style={{ width: `${progressPercentage}%` }}
                                    ></div>
                                  </div>
                                </div>
                              )}
                              
                            </div>
                          </div>
                        );
                      })}
                  </div>
                  
                  {getAllTradesWithQuotes.filter(trade => getServiceProviderQuoteStatus(trade.id) === 'accepted' && trade.completion_status !== 'completed').length === 0 && (
                    <div className="text-center py-12">
                      <Award size={48} className="mx-auto mb-4 text-gray-500" />
                      <h3 className="text-lg font-semibold text-gray-300 mb-2">Noch keine gewonnenen Ausschreibungen</h3>
                      <p className="text-gray-400 text-sm max-w-md mx-auto">
                        Sobald Ihre Angebote angenommen werden, erscheinen sie hier als aktive Projekte.
                      </p>
                    </div>
                  )}
                </div>

                {/* Abgeschlossene Projekte Section - Einklappbar */}
                <div>
                  <button
                    onClick={() => setIsCompletedProjectsExpanded(!isCompletedProjectsExpanded)}
                    className="flex items-center justify-between w-full p-4 bg-gradient-to-br from-purple-500/10 to-indigo-500/10 rounded-xl border border-purple-500/20 hover:border-purple-400/40 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/20"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-purple-500/20 rounded-lg">
                        <CheckCircle size={20} className="text-purple-400" />
                      </div>
                      <div className="text-left">
                        <h3 className="text-lg font-semibold text-white">Abgeschlossene Projekte</h3>
                        <p className="text-gray-400 text-sm">Fertige Aufträge</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="px-3 py-1 bg-purple-500/20 text-purple-400 rounded-full text-xs font-medium">
                        {getAllTradesWithQuotes.filter(trade => getServiceProviderQuoteStatus(trade.id) === 'accepted' && trade.completion_status === 'completed').length}
                      </div>
                      {/* Badge für Projekte ohne Rechnung */}
                      {getAllTradesWithQuotes.filter(trade => 
                        getServiceProviderQuoteStatus(trade.id) === 'accepted' && 
                        trade.completion_status === 'completed' && 
                        !hasValidInvoice(trade.id)
                      ).length > 0 && (
                        <div className="px-1.5 py-0.5 bg-red-500 text-white rounded-full text-xs font-bold animate-pulse">
                          !
                        </div>
                      )}
                      <svg 
                        className={`w-5 h-5 text-purple-400 transition-transform duration-300 ${isCompletedProjectsExpanded ? 'rotate-180' : ''}`} 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </button>
                  
                  {/* Einklappbarer Content */}
                  {isCompletedProjectsExpanded && (
                    <div className="mt-4 space-y-4">
                      <div className="bidding-cards-container">
                        {getAllTradesWithQuotes
                          .filter(trade => getServiceProviderQuoteStatus(trade.id) === 'accepted' && trade.completion_status === 'completed')
                          .map((trade) => {
                            const quote = getServiceProviderQuote(trade.id);
                            
                            return (
                              <div key={trade.id} className="bidding-card bg-gradient-to-br from-purple-500/10 to-indigo-500/10 rounded-xl p-4 border border-purple-500/20 hover:border-purple-400/40 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/20">
                                <div className="flex items-start justify-between mb-3">
                                  <div className="flex items-center gap-3">
                                    <div className="p-2 bg-purple-500/20 rounded-lg">
                                      {getCategoryIcon(trade.category)}
                                    </div>
                                    <div>
                                      <h3 className="font-semibold text-white text-sm">
                                        {trade.title}
                                        {trade.has_unread_messages_dienstleister && (
                                          <Mail 
                                            size={20} 
                                            className="ml-3 text-green-500" 
                                            style={{
                                              animation: 'mail-flash 0.5s linear infinite !important',
                                              animationName: 'mail-flash !important',
                                              animationDuration: '0.5s !important',
                                              animationTimingFunction: 'linear !important',
                                              animationIterationCount: 'infinite !important',
                                              filter: 'drop-shadow(0 0 8px #00ff00)',
                                              fontWeight: 'bold',
                                              fontSize: '20px',
                                              willChange: 'opacity',
                                              display: 'inline-block'
                                            }}
                                          />
                                        )}
                                      </h3>
                                      <p className="text-gray-400 text-xs">Projekt ID: {trade.project_id}</p>
                                      {/* Beschreibung mit Trunkierung */}
                                      {trade.description && (
                                        <div className="mt-1">
                                          <p className="text-gray-300 text-xs leading-relaxed">
                                            {isDescriptionExpanded(trade.id) 
                                              ? trade.description 
                                              : truncateText(trade.description, 80)
                                            }
                                          </p>
                                          {trade.description.length > 80 && (
                                            <button
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                toggleDescriptionExpansion(trade.id);
                                              }}
                                              className="inline-flex items-center gap-1 mt-1 text-xs text-purple-400 hover:text-purple-300 transition-colors"
                                            >
                                              {isDescriptionExpanded(trade.id) ? 'Weniger' : 'Mehr'}
                                            </button>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                                    <span className="text-purple-400 text-xs font-medium">Abgeschlossen</span>
                                  </div>
                                </div>
                                
                                {/* Prominente Warnung für fehlende Rechnung - nur wenn keine gültige Rechnung existiert */}
                                {!hasValidInvoice(trade.id) && (
                                  <div className="mb-3 p-3 bg-gradient-to-r from-red-500/20 to-orange-500/20 border border-red-500/30 rounded-lg animate-pulse">
                                    <div className="flex items-center gap-2 mb-2">
                                      <AlertTriangle size={16} className="text-red-400" />
                                      <span className="text-red-400 font-semibold text-sm">Rechnung ausstehend!</span>
                                    </div>
                                    <p className="text-red-300 text-xs">
                                      Das Projekt ist abgeschlossen, aber Sie haben noch keine Rechnung gestellt. 
                                      Erstellen Sie jetzt Ihre Rechnung, um die Bezahlung zu erhalten.
                                    </p>
                                  </div>
                                )}

                                {/* Rechnung bereits erstellt - Erfolgs-Anzeige */}
                                {hasValidInvoice(trade.id) && (
                                  <div className="mb-3 p-3 bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-lg">
                                    <div className="flex items-center gap-2 mb-2">
                                      <CheckCircle size={16} className="text-green-400" />
                                      <span className="text-green-400 font-semibold text-sm">Rechnung erstellt</span>
                                    </div>
                                    <p className="text-green-300 text-xs">
                                      Ihre Rechnung wurde erfolgreich erstellt und versendet. Status: {tradeInvoices[trade.id]?.status || 'Unbekannt'}
                                    </p>
                                  </div>
                                )}
                                
                                <div className="space-y-2 text-xs text-gray-300">
                                  <div className="flex justify-between">
                                    <span>Auftragswert:</span>
                                    <span className="font-semibold text-purple-400">
                                      {quote?.total_amount ? `${Number(quote.total_amount).toLocaleString('de-DE')} ${quote.currency || 'CHF'}` : 'N/A'}
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Abgeschlossen:</span>
                                    <span>{trade.created_at ? new Date(trade.created_at).toLocaleDateString('de-DE') : 'N/A'}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Status:</span>
                                    <span className="text-purple-400 font-medium">
                                      Abgeschlossen
                                    </span>
                                  </div>
                                </div>
                                
                                <div className="mt-4 flex gap-2">
                                  {!hasValidInvoice(trade.id) ? (
                                    <button
                                      onClick={() => {
                                        setDetailTrade(trade);
                                        setShowTradeDetails(true);
                                      }}
                                      className="flex-1 px-3 py-2 bg-red-500/20 text-red-300 rounded-lg hover:bg-red-500/30 transition-colors text-xs font-medium border border-red-500/30 animate-pulse"
                                    >
                                      <AlertTriangle size={14} className="inline mr-1" />
                                      Rechnung erstellen
                                    </button>
                                  ) : (
                                    <button
                                      onClick={() => {
                                        setDetailTrade(trade);
                                        setShowTradeDetails(true);
                                      }}
                                      className="flex-1 px-3 py-2 bg-green-500/20 text-green-300 rounded-lg hover:bg-green-500/30 transition-colors text-xs font-medium"
                                    >
                                      <CheckCircle size={14} className="inline mr-1" />
                                      Rechnung anzeigen
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                      </div>
                      
                      {getAllTradesWithQuotes.filter(trade => getServiceProviderQuoteStatus(trade.id) === 'accepted' && trade.completion_status === 'completed').length === 0 && (
                        <div className="text-center py-12">
                          <CheckCircle size={48} className="mx-auto mb-4 text-gray-500" />
                          <h3 className="text-lg font-semibold text-gray-300 mb-2">Noch keine abgeschlossenen Projekte</h3>
                          <p className="text-gray-400 text-sm max-w-md mx-auto">
                            Sobald deine Projekte abgeschlossen werden, erscheinen sie hier.
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Rechte Spalte: Erweiterte Geo-Search mit Hover-Vergrößerung */}
          <div className={`transition-all duration-1000 ease-out ${
            geoSearchExpanded ? 'col-span-2' : ''
          }`} data-tour-id="geo-search-section">
            {/* Geo-Search Container */}
            <div 
              className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl p-6 hover:shadow-[0_0_30px_rgba(255,189,89,0.15)] transition-all duration-300"
            >
              {/* Header mit Expand-Button */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-gradient-to-br from-[#ffbd59] to-[#ffa726] rounded-xl shadow-lg shadow-[#ffbd59]/20">
                    <MapPin size={24} className="text-[#2c3539]" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">Ausschreibungen in deiner Nähe</h2>
                    <p className="text-gray-400 text-sm mt-1">
                      {currentLocation ? (
                        <>Finde passende Ausschreibungen im Umkreis</>  
                      ) : (
                        <>Geben Sie eine Adresse ein oder nutzen Sie Ihren Standort</>  
                      )}
                    </p>
                  </div>
                </div>

                {/* Expand/Collapse Button - Mobile-optimiert */}
                <div className="flex items-center gap-2 sm:gap-3">
                  {geoSearchExpanded && (
                    <button
                      onClick={() => setGeoSearchExpanded(false)}
                      className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-red-500/20 text-red-300 rounded-lg hover:bg-red-500/30 transition-colors text-sm font-medium"
                      title="Geo-Search verkleinern"
                    >
                      <XCircle size={16} />
                      <span className="hidden sm:inline">Schließen</span>
                    </button>
                  )}
                  {!geoSearchExpanded && (
                    <button
                      onClick={() => setGeoSearchExpanded(true)}
                      className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-gradient-to-r from-[#ffbd59] to-[#ffa726] text-[#2c3539] rounded-lg hover:from-[#ffa726] hover:to-[#ff9800] transition-all duration-300 transform hover:scale-105 text-sm font-medium shadow-lg hover:shadow-xl"
                      title="Geo-Search auf Vollbild erweitern"
                    >
                      <ExternalLink size={16} />
                      <span className="hidden sm:inline">Erweitern</span>
                    </button>
                  )}
                  
                  {/* Results Badge - Mobile angepasst */}
                  <div className="flex items-center text-xs bg-white/10 border border-white/20 text-white rounded-lg px-2 sm:px-3 py-1">
                    <span>
                      <span className="text-emerald-400 font-semibold mr-1">
                        {(() => {
                          const tradeIds = new Set([...geoTrades.map(t => t.id), ...trades.map(t => t.id)]);
                          return tradeIds.size;
                        })()}
                      </span>
                      <span className="hidden sm:inline">gefunden{currentLocation ? ` · ${radiusKm}km` : ''}</span>
                      <span className="sm:hidden">Ergebnisse</span>
                    </span>
                  </div>
                </div>
              </div>
              {/* Toolbar: Drei Haupttabs + Search Icon */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  {/* Responsive Tabs - Kacheln nur auf Desktop */}
                  <div className="flex items-center p-1 bg-white/10 rounded-xl backdrop-blur-sm">
                    <button
                      onClick={() => setActiveTab('rows')}
                      className={`flex-1 px-3 sm:px-4 py-3 rounded-lg font-medium text-sm transition-all duration-300 flex items-center justify-center gap-2 ${
                        activeTab === 'rows'
                          ? 'bg-gradient-to-r from-[#ffbd59] to-[#ffa726] text-[#2c3539] shadow-lg shadow-[#ffbd59]/30 transform scale-[1.02]'
                          : 'text-gray-300 hover:text-white hover:bg-white/10'
                      }`}
                      title="Zeilenansicht"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M3 6h18v2H3V6zm0 5h18v2H3v-2zm0 5h18v2H3v-2z"/>
                      </svg>
                      <span className="hidden sm:inline">Zeilen</span>
                    </button>
                    {/* Kacheln-Tab nur auf Desktop anzeigen */}
                    <button
                      onClick={() => setActiveTab('cards')}
                      className={`hidden md:flex flex-1 px-3 sm:px-4 py-3 rounded-lg font-medium text-sm transition-all duration-300 items-center justify-center gap-2 ${
                        activeTab === 'cards'
                          ? 'bg-gradient-to-r from-[#ffbd59] to-[#ffa726] text-[#2c3539] shadow-lg shadow-[#ffbd59]/30 transform scale-[1.02]'
                          : 'text-gray-300 hover:text-white hover:bg-white/10'
                      }`}
                      title="Kachelansicht"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M3 3h8v8H3V3zm10 0h8v8h-8V3zM3 13h8v8H3v-8zm10 0h8v8h-8v-8z"/>
                      </svg>
                      <span className="hidden sm:inline">Kacheln</span>
                    </button>
                    <button
                      onClick={() => setActiveTab('map')}
                      className={`flex-1 px-3 sm:px-4 py-3 rounded-lg font-medium text-sm transition-all duration-300 flex items-center justify-center gap-2 ${
                        activeTab === 'map'
                          ? 'bg-gradient-to-r from-[#ffbd59] to-[#ffa726] text-[#2c3539] shadow-lg shadow-[#ffbd59]/30 transform scale-[1.02]'
                          : 'text-gray-300 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      <Map size={16} />
                      <span className="hidden sm:inline">Karte</span>
                    </button>
                  </div>

                  {/* Search Icon Button */}
                  <button
                    onClick={performGeoSearch}
                    disabled={geoLoading || !currentLocation}
                    title="Gewerke suchen"
                    className="rounded-lg bg-gradient-to-r from-[#ffbd59] to-[#ffa726] text-[#2c3539] hover:from-[#ffa726] hover:to-[#ff9800] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-md hover:shadow-xl p-2.5"
                  >
                    {geoLoading ? (
                      <div className="animate-spin rounded-full border-b-2 border-[#2c3539] h-5 w-5"></div>
                    ) : (
                      <Search size={18} className="" />
                    )}
                  </button>
                </div>
              </div>
          
          {/* Modern Location Input with Address Autocomplete */}
          <div className="bg-white/5 rounded-xl p-4 mb-4 border border-white/10 hover:border-[#ffbd59]/30 transition-all duration-300">
            <label className="text-white text-sm font-medium mb-2 block">📍 Standort festlegen</label>
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <AddressAutocomplete
                  label=""
                  placeholder="Straße, PLZ Ort eingeben..."
                  value={selectedAddress}
                  onChange={(next) => setSelectedAddress({
                    address_street: next.address_street,
                    address_zip: next.address_zip,
                    address_city: next.address_city,
                    address_country: next.address_country || 'Deutschland'
                  })}
                  className=""
                />
              </div>
              
              <button
                onClick={handleSelectedAddressGeocode}
                disabled={isGeocoding || !selectedAddress.address_street.trim()}
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
                className={`group px-4 py-3 bg-gradient-to-r from-emerald-500 to-green-500 text-white rounded-xl hover:from-emerald-600 hover:to-green-600 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-emerald-500/30 ${!currentLocation ? 'animate-bounce scale-110' : ''}`}
                style={!currentLocation ? {
                  animation: 'bounce 1s infinite, glow-blink 0.8s infinite alternate',
                  boxShadow: '0 0 20px rgba(251, 191, 36, 0.8), 0 0 40px rgba(251, 191, 36, 0.6), 0 0 60px rgba(251, 191, 36, 0.4)',
                  border: '4px solid rgba(251, 191, 36, 0.8)'
                } : {}}
                title="Aktuellen Standort verwenden"
              >
                <MapPin size={16} className="group-hover:animate-pulse" />
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
              <label className="text-white text-sm font-medium mb-3 block">🏗️ Kategorie</label>
              <select
                value={geoTradeCategory || ''}
                onChange={(e) => setGeoTradeCategory(e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-800 text-white rounded-xl text-sm border border-gray-600 focus:outline-none focus:border-[#ffbd59] focus:ring-2 focus:ring-[#ffbd59] transition-all duration-300 cursor-pointer hover:bg-gray-700"
              >
                <option value="">Alle Kategorien</option>
                {TRADE_CATEGORIES.map(category => (
                  <option key={category.value} value={category.value}>
                    {category.emoji} {category.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          {/* Search Button entfernt, da jetzt in der Toolbar */}
          



          

          
          

          {/* Modern Content Area with Smooth Transitions */}
              {(() => {
                /* Kombiniere und dedupliziere Geo-Trades und lokale Trades FÜR ALLE TABS */
                // Erstelle eine Map für Deduplizierung basierend auf ID
                const tradeMap: { [key: number]: any } = {};
                
                // Füge Geo-Trades hinzu (haben Priorität wegen Distanz-Info)
                geoTrades.forEach(trade => {
                  tradeMap[trade.id] = {...trade, isGeoResult: true};
                });
                
                // WICHTIG: Merge lokale Trades mit Geo-Trades um has_unread_messages Felder zu erhalten
                trades.forEach(trade => {
                  if (tradeMap[trade.id]) {
                    // Trade existiert bereits in geoTrades - MERGE die Felder
                    tradeMap[trade.id] = {
                      ...tradeMap[trade.id], // Behalte Geo-Daten (distance_km, etc.)
                      has_unread_messages_bautraeger: trade.has_unread_messages_bautraeger,
                      has_unread_messages_dienstleister: trade.has_unread_messages_dienstleister,
                      // Weitere wichtige Felder aus lokalen Trades übernehmen
                      completion_status: trade.completion_status || tradeMap[trade.id].completion_status,
                    };
                  } else {
                    // Trade existiert nur in lokalen Trades
                    tradeMap[trade.id] = {...trade, isGeoResult: false};
                  }
                });
                
                const combinedTrades = Object.values(tradeMap);

                // Rendering basierend auf activeTab
                if (activeTab === 'rows' || activeTab === 'cards') {
                  return (
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
                  {/* Status-Indikatoren für parallele API-Calls */}
                  <div className="flex justify-center gap-4 mt-4">
                    <div className={`flex items-center gap-2 text-xs ${geoLoading ? 'text-yellow-400' : geoError ? 'text-red-400' : 'text-green-400'}`}>
                      <div className={`w-2 h-2 rounded-full ${geoLoading ? 'bg-yellow-400 animate-pulse' : geoError ? 'bg-red-400' : 'bg-green-400'}`}></div>
                      Geo-Suche
                    </div>
                    <div className={`flex items-center gap-2 text-xs ${isLoadingTrades ? 'text-yellow-400' : tradesError ? 'text-red-400' : 'text-green-400'}`}>
                      <div className={`w-2 h-2 rounded-full ${isLoadingTrades ? 'bg-yellow-400 animate-pulse' : tradesError ? 'bg-red-400' : 'bg-green-400'}`}></div>
                      Gewerke-Liste
                    </div>
                  </div>
                </div>
              ) : (
                (() => {
                  
                  // Debug: Zeige has_unread_messages Status für alle Trades
                  console.log('🔍 CombinedTrades - Mail-Symbol Status:', combinedTrades.map(t => ({
                    id: t.id,
                    title: t.title,
                    has_unread_messages_dienstleister: t.has_unread_messages_dienstleister,
                    isGeoResult: t.isGeoResult
                  })));
                  
                  // Zeige Fallback-Meldung nur wenn BEIDE APIs fehlschlagen
                  if (combinedTrades.length === 0 && geoError && tradesError) {
                    return (
                      <div className="col-span-full bg-gradient-to-br from-white/5 to-white/10 rounded-2xl p-8 text-center backdrop-blur-sm border border-white/10">
                        <AlertTriangle size={48} className="mx-auto mb-4 text-yellow-400" />
                        <h3 className="text-lg font-semibold text-white mb-2">Keine Gewerke verfügbar</h3>
                        <p className="text-gray-400 text-sm mb-4">
                          Sowohl Geo-Suche als auch Gewerke-Liste sind fehlgeschlagen.
                        </p>
                        <button
                          onClick={() => {
                            setGeoError(null);
                            setTradesError('');
                            performGeoSearch();
                            loadTrades();
                          }}
                          className="px-4 py-2 bg-[#ffbd59] text-[#2c3539] rounded-lg hover:bg-[#ffa726] transition-colors font-medium"
                        >
                          <RefreshCw size={16} className="inline mr-2" />
                          Erneut versuchen
                        </button>
                      </div>
                    );
                  }
                  
                  return (
                    <div className={activeTab === 'cards' 
                      ? "grid grid-cols-1 lg:grid-cols-2 gap-6 auto-rows-max items-start"
                      : "space-y-3"
                    }>
                      {combinedTrades.map((trade: any, index: number) => {
                    // Verwende die robuste hasServiceProviderQuote Funktion
                    const hasQuote = hasServiceProviderQuote(trade.id);
                    const userQuote = getServiceProviderQuote(trade.id);
                    const quoteStatus = userQuote?.status || null;
                    // Verwende nur den tatsächlichen completion_status aus den Daten
                    const actualCompletionStatus = trade.completion_status || 'in_progress';

                    return activeTab === 'cards' ? (
                      <div 
                        key={`trade-${trade.id}-${index}`}
                        className={`group relative bg-gradient-to-br from-white/8 to-white/4 backdrop-blur-xl rounded-xl p-5 border border-white/20 hover:border-[#ffbd59]/50 hover:shadow-lg transition-all duration-300 cursor-pointer h-full flex flex-col ${
                          hasQuote ? 'border-[#ffbd59]/40 shadow-md shadow-[#ffbd59]/10' : ''
                        } ${
                          quoteStatus === 'accepted' 
                            ? 'border-l-4 border-l-green-500 bg-gradient-to-r from-green-500/8 to-transparent' 
                            : quoteStatus === 'under_review'
                            ? 'border-l-4 border-l-yellow-500 bg-gradient-to-r from-yellow-500/8 to-transparent'
                            : quoteStatus === 'rejected'
                            ? 'border-l-4 border-l-red-500 bg-gradient-to-r from-red-500/8 to-transparent'
                            : hasQuote
                            ? 'border-l-4 border-l-blue-500 bg-gradient-to-r from-blue-500/8 to-transparent'
                            : ''
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
                        {/* Optimierter Kachel-Inhalt - Balance zwischen kompakt und lesbar */}
                        
                        {/* Header mit Titel und Status */}
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3 flex-1">
                            <div className="relative">
                              <div className="p-3 bg-gradient-to-br from-[#ffbd59] to-[#ffa726] rounded-xl shadow-lg">
                                {getCategoryIcon(trade.category || '')}
                              </div>
                              {/* Brief-Symbol für ungelesene Nachrichten - DIENSTLEISTER-SPEZIFISCH */}
                              {trade.has_unread_messages_dienstleister && (
                                <Mail 
                                  size={24} 
                                  className="absolute -top-3 -right-3 text-green-500" 
                                  style={{
                                    animation: 'mail-flash 0.5s linear infinite !important',
                                    animationName: 'mail-flash !important',
                                    animationDuration: '0.5s !important',
                                    animationTimingFunction: 'linear !important',
                                    animationIterationCount: 'infinite !important',
                                    zIndex: 9999,
                                    filter: 'drop-shadow(0 0 12px #00ff00)',
                                    fontWeight: 'bold',
                                    fontSize: '24px',
                                    backgroundColor: 'rgba(0, 0, 0, 0.3)',
                                    borderRadius: '50%',
                                    padding: '4px',
                                    willChange: 'opacity',
                                    display: 'inline-block'
                                  }}
                                />
                              )}
                              {/* Debug: Zeige has_unread_messages Status */}
                              {console.log(`🔍 Trade ${trade.id} (${trade.title}): has_unread_messages_dienstleister = ${trade.has_unread_messages_dienstleister}`)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="text-white font-bold text-lg leading-tight mb-1">
                                {trade.title}
                              </h3>
                              <div className="flex items-center gap-2">
                                <span className="text-gray-300 text-sm font-medium">{trade.category || 'Unbekannt'}</span>
                                {trade.isGeoResult && (
                                  <span className="text-blue-400 text-sm flex items-center gap-1 bg-blue-500/20 px-2 py-1 rounded-full">
                                    <MapPin size={12} />
                                    {trade.distance_km?.toFixed(1)}km
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          {/* Status Badge - rechts oben */}
                          <div className="flex flex-col items-end gap-2">
                            <span className={`px-3 py-1.5 rounded-lg text-sm font-medium ${getCompletionStatusColor(actualCompletionStatus)}`}>
                              {getCompletionStatusLabel(actualCompletionStatus)}
                            </span>
                            {hasQuote && (
                              <span className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                                quoteStatus === 'accepted' ? 'bg-green-500/30 text-green-300 border border-green-500/50' :
                                quoteStatus === 'under_review' ? 'bg-yellow-500/30 text-yellow-300 border border-yellow-500/50' :
                                quoteStatus === 'rejected' ? 'bg-red-500/30 text-red-300 border border-red-500/50' :
                                'bg-blue-500/30 text-blue-300 border border-blue-500/50'
                              }`}>
                                {quoteStatus === 'accepted' ? '✓ Gewonnen' :
                                 quoteStatus === 'under_review' ? '⏳ In Prüfung' :
                                 quoteStatus === 'rejected' ? '✗ Abgelehnt' :
                                 '📋 Angebot abgegeben'}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Wichtige Informationen */}
                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div>
                            <p className="text-gray-400 text-xs uppercase tracking-wide mb-1">Datum</p>
                            <p className="text-white text-sm font-medium">
                              📅 {formatDate(trade.planned_date || trade.start_date)}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-400 text-xs uppercase tracking-wide mb-1">Eingabefrist</p>
                            <p className="text-white text-sm font-medium">
                              {trade.submission_deadline ? (
                                <>⏰ {formatDate(trade.submission_deadline)}</>
                              ) : (
                                <>⏰ Nicht festgelegt</>
                              )}
                            </p>
                          </div>
                        </div>

                        {/* Angebots-Bereich - bleibt am unteren Rand */}
                        <div className="mt-auto pt-4 border-t border-white/10">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <span className="text-sm text-gray-400">
                                📊 {(() => {
                                  const quoteCount = trade.quote_stats?.total_quotes ?? (allTradeQuotes[trade.id] || []).length;
                                  return `${quoteCount} Angebote`;
                                })()} 
                              </span>
                              {!hasQuote && (
                                <span className="text-sm px-3 py-1 bg-orange-500/20 text-orange-300 rounded-full border border-orange-500/30 animate-pulse">
                                  ⚡ Verfügbar
                                </span>
                              )}
                            </div>
                            
                            {!hasQuote ? (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCreateQuote(trade);
                                }}
                                className="px-4 py-2.5 bg-[#10b981] text-white rounded-lg hover:bg-[#059669] transition-colors text-sm font-medium flex items-center gap-2 shadow-lg hover:shadow-xl"
                              >
                                <Plus size={16} />
                                Angebot abgeben
                              </button>
                            ) : (
                              <div className="text-right">
                                <div className={`text-sm font-medium mb-1 ${getQuoteStatusColor(quoteStatus || '')}`}>
                                  {getQuoteStatusLabel(quoteStatus || '')}
                                </div>
                                {userQuote && (
                                  <div className="text-[#ffbd59] text-lg font-bold">
                                    {formatCurrency(userQuote.total_amount)}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ) : (
                      // Zeilenansicht - kompakte Darstellung
                      <div 
                        key={`trade-row-${trade.id}-${index}`}
                        className={`group relative bg-gradient-to-r from-white/5 to-white/10 backdrop-blur-xl rounded-xl p-4 border border-white/20 hover:border-[#ffbd59]/50 hover:shadow-[0_0_20px_rgba(255,189,89,0.15)] transition-all duration-300 cursor-pointer ${
                          hasQuote ? 'border-[#ffbd59]/50 shadow-lg shadow-[#ffbd59]/10' : ''
                        } ${
                          quoteStatus === 'accepted' 
                            ? 'border-l-4 border-l-green-500 bg-gradient-to-r from-green-500/15 to-transparent shadow-lg shadow-green-500/20' 
                            : quoteStatus === 'under_review'
                            ? 'border-l-4 border-l-yellow-500 bg-gradient-to-r from-yellow-500/15 to-transparent shadow-lg shadow-yellow-500/20'
                            : quoteStatus === 'rejected'
                            ? 'border-l-4 border-l-red-500 bg-gradient-to-r from-red-500/15 to-transparent shadow-lg shadow-red-500/20'
                            : hasQuote
                            ? 'border-l-4 border-l-blue-500 bg-gradient-to-r from-blue-500/15 to-transparent shadow-lg shadow-blue-500/20'
                            : ''
                        }`}
                        onClick={() => {
                          console.log('🔍 ROW CLICK DEBUG: Trade clicked', {
                            tradeId: trade.id,
                            tradeTitle: trade.title,
                            userId: user?.id,
                            userRole: user?.user_role
                          });
                          
                          setDetailTrade(trade);
                          setShowTradeDetails(true);
                        }}
                      >
                        <div className="flex items-center justify-between">
                          {/* Linke Seite: Hauptinformationen */}
                          <div className="flex items-center gap-4 flex-1">
                            {/* Icon */}
                            <div className="relative">
                              <div className="p-2 bg-gradient-to-br from-[#ffbd59] to-[#ffa726] rounded-lg shadow-lg shadow-[#ffbd59]/20 flex-shrink-0">
                                {getCategoryIcon(trade.category || '')}
                              </div>
                            </div>
                            
                            {/* Titel und Beschreibung */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="text-white font-semibold truncate">
                                  {trade.title}
                                  {trade.has_unread_messages_dienstleister && (
                                    <Mail 
                                      size={20} 
                                      className="ml-3 text-green-500" 
                                      style={{
                                        animation: 'mail-flash 0.5s linear infinite !important',
                                        animationName: 'mail-flash !important',
                                        animationDuration: '0.5s !important',
                                        animationTimingFunction: 'linear !important',
                                        animationIterationCount: 'infinite !important',
                                        filter: 'drop-shadow(0 0 8px #00ff00)',
                                        fontWeight: 'bold',
                                        fontSize: '20px',
                                        willChange: 'opacity',
                                        display: 'inline-block'
                                      }}
                                    />
                                  )}
                                </h3>
                                {trade.isGeoResult && (
                                  <span className="text-blue-400 text-xs bg-blue-500/20 px-2 py-1 rounded-full flex items-center gap-1">
                                    <MapPin size={10} />
                                    {trade.distance_km?.toFixed(1)}km
                                  </span>
                                )}
                                {hasQuote && (
                                  <span className={`text-xs px-2 py-1 rounded-full flex items-center gap-1 font-medium shadow-lg ${
                                    quoteStatus === 'accepted' ? 'bg-green-500/30 text-green-300 border border-green-500/50' :
                                    quoteStatus === 'under_review' ? 'bg-yellow-500/30 text-yellow-300 border border-yellow-500/50' :
                                    quoteStatus === 'rejected' ? 'bg-red-500/30 text-red-300 border border-red-500/50' :
                                    'bg-blue-500/30 text-blue-300 border border-blue-500/50'
                                  }`}>
                                    <div className={`w-1.5 h-1.5 rounded-full ${
                                      quoteStatus === 'accepted' ? 'bg-green-300 animate-pulse' :
                                      quoteStatus === 'under_review' ? 'bg-yellow-300 animate-pulse' :
                                      quoteStatus === 'rejected' ? 'bg-red-300' :
                                      'bg-blue-300 animate-pulse'
                                    }`}></div>
                                    {quoteStatus === 'accepted' ? '✓ Gewonnen' :
                                     quoteStatus === 'under_review' ? '⏳ In Prüfung' :
                                     quoteStatus === 'rejected' ? '✗ Abgelehnt' :
                                     '📋 Angebot abgegeben'}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-4 text-sm text-gray-400">
                                <span>{trade.category || 'Unbekannt'}</span>
                                <span>
                                  ⏰ {trade.submission_deadline ? formatDate(trade.submission_deadline) : 'Eingabefrist n.a.'}
                                </span>
                                <span>📅 {formatDate(trade.planned_date || trade.start_date)}</span>
                                <span>📊 {(() => {
                                  const quoteCount = trade.quote_stats?.total_quotes ?? (allTradeQuotes[trade.id] || []).length;
                                  return `${quoteCount} Angebote`;
                                })()}</span>
                              </div>
                            </div>
                          </div>
                          
                          {/* Rechte Seite: Status und Aktionen */}
                          <div className="flex items-center gap-3 flex-shrink-0">
                            {/* Status Badge */}
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getCompletionStatusColor(actualCompletionStatus)}`}>
                              {getCompletionStatusLabel(actualCompletionStatus)}
                            </span>
                            
                            {/* Angebot Button oder Status */}
                            {hasQuote ? (
                              <div className="text-right">
                                <div className={`text-sm font-medium ${getQuoteStatusColor(quoteStatus || '')}`}>
                                  {getQuoteStatusLabel(quoteStatus || '')}
                                </div>
                                {userQuote && (
                                  <div className="text-[#ffbd59] text-sm font-bold">
                                    {formatCurrency(userQuote.total_amount)}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="flex flex-col items-end gap-2">
                                <span className="text-xs px-2 py-1 bg-orange-500/20 text-orange-400 rounded-full border border-orange-500/30 animate-pulse">
                                  ⚡ Verfügbar
                                </span>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleCreateQuote(trade);
                                  }}
                                  className="px-3 py-2 bg-[#10b981] text-white rounded-lg hover:bg-[#059669] transition-colors text-sm font-medium flex items-center gap-2 shadow-lg hover:shadow-xl transform hover:scale-105"
                                >
                                  <Plus size={14} />
                                  Angebot abgeben
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                      })}
                    </div>
                  );
                })()
              )}
            </div>
                  );
                } else {
                  // Map-Ansicht mit kombinierten Trades
                  // Filtere nur Trades mit gültigen Koordinaten (von GeoSearch)
                  const tradesWithCoordinates = combinedTrades.filter(trade => 
                    trade.address_latitude != null && 
                    trade.address_longitude != null &&
                    !isNaN(trade.address_latitude) &&
                    !isNaN(trade.address_longitude)
                  );
                  
                  console.log('🗺️ Map-Ansicht: Gefilterte Trades mit Koordinaten:', tradesWithCoordinates.length, 'von', combinedTrades.length);
                  
                  return (
                /* Modern Map View with Glow */
                <div className="rounded-2xl overflow-hidden border border-white/20 shadow-2xl h-[50vh] min-h-[400px] hover:shadow-[0_0_40px_rgba(255,189,89,0.2)] transition-all duration-300">
                  <TradeMap
                    currentLocation={currentLocation}
                    trades={tradesWithCoordinates}
                    radiusKm={radiusKm}
                    onTradeClick={(trade) => {
                      handleTradeDetails(trade);
                    }}
                    isExpanded={false}
                    hasQuoteForTrade={hasServiceProviderQuote}
                    getQuoteStatusForTrade={getServiceProviderQuoteStatus}
                  />
                </div>
                  );
                }
              })()}

              {/* Error-Anzeige */}
              {geoError && (
                <div className="bg-red-500/20 border border-red-500/30 text-red-300 px-3 py-2 rounded-lg text-sm mt-4">
                  {geoError}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tipps für Dienstleister */}
      <div className="mobile-stack lg:grid lg:grid-cols-1 gap-6" data-tour-id="tips-section">
        <div className="mobile-card bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
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

      </div>
    
      {/* Modals - außerhalb des Hauptcontainers */}
      {/* Angebot-Erstellungsformular */}
      {showCostEstimateForm && selectedTradeForQuote && (
      <CostEstimateForm
        isOpen={showCostEstimateForm}
        onClose={handleCloseCostEstimateForm}
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
      onTradeUpdate={(updatedTrade) => {
        // Aktualisiere Trade-Daten nach Änderungen (z.B. completion_status)
        console.log('🔄 Trade aktualisiert, refreshe Daten für ID:', updatedTrade.id);
        refreshTradeData(updatedTrade.id);
      }}
      existingQuotes={(() => {
        if (!detailTrade) return [];
        
        // Kombiniere allTradeQuotes und serviceProviderQuotes
        const tradeQuotes = allTradeQuotes[detailTrade.id] || [];
        const serviceQuotes = serviceProviderQuotes.filter(q => q.milestone_id === detailTrade.id);
        const allQuotes = [...tradeQuotes, ...serviceQuotes];
        
        // Entferne Duplikate basierend auf ID - aber bevorzuge Quotes mit korrekter milestone_id
        const uniqueQuotes = [];
        const seenIds = new Set();
        
        // Erst alle Quotes mit korrekter milestone_id hinzufügen
        for (const quote of allQuotes) {
          if (quote.milestone_id === detailTrade.id && !seenIds.has(quote.id)) {
            uniqueQuotes.push(quote);
            seenIds.add(quote.id);
          }
        }
        
        // Dann alle anderen Quotes hinzufügen (falls noch nicht vorhanden)
        for (const quote of allQuotes) {
          if (!seenIds.has(quote.id)) {
            uniqueQuotes.push(quote);
            seenIds.add(quote.id);
          }
        }
        
        console.log('🔍 DEBUG: Erweiterte Übergabe an TradeDetailsModal', {
          tradeId: detailTrade.id,
          tradeQuotesLength: tradeQuotes.length,
          serviceQuotesLength: serviceQuotes.length,
          totalQuotesLength: uniqueQuotes.length,
          quotes: uniqueQuotes.map(q => ({
            id: q.id,
            service_provider_id: q.service_provider_id,
            service_provider_id_type: typeof q.service_provider_id,
            status: q.status,
            title: q.title,
            hasNewFields: !!(q.quote_number || q.qualifications || q.technical_approach)
          })),
          userId: user?.id,
          userIdType: typeof user?.id
        });
        
        return uniqueQuotes;
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
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[99999] p-4">
        <div className="bg-[#2c3539] rounded-2xl shadow-2xl border border-white/20 max-w-7xl w-full max-h-[95vh] overflow-hidden">
          <div className="flex items-center justify-between p-6 border-b border-white/10">
            <h2 className="text-xl font-bold text-white">Archivierte Gewerke</h2>
            <button
              onClick={() => setShowArchive(false)}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <XCircle size={24} className="text-gray-400" />
            </button>
          </div>
          <div className="overflow-y-auto max-h-[calc(95vh-120px)]">
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

    {/* Ressourcenmanagement Modal */}
    {showResourceManagement && (
      <ResourceManagementModal
        isOpen={showResourceManagement}
        onClose={() => setShowResourceManagement(false)}
        onResourceCreated={(resource) => {
          // Reload resources after creation
          loadUserResources();
        }}
      />
    )}

    {/* Ressourcenkalender Modal */}
    {showResourceCalendar && (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[99999] p-4">
        <div className="bg-[#2c3539] rounded-2xl shadow-2xl border border-white/20 max-w-7xl w-full max-h-[95vh] overflow-hidden">
          <div className="flex items-center justify-between p-6 border-b border-white/10">
            <h2 className="text-xl font-bold text-white">Ressourcenkalender</h2>
            <button
              onClick={() => setShowResourceCalendar(false)}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <XCircle size={24} className="text-gray-400" />
            </button>
          </div>
          <div className="overflow-y-auto max-h-[calc(95vh-120px)] p-6">
            <ResourceCalendar 
              serviceProviderId={user?.id}
              onResourceClick={(resource) => {
                console.log('Resource clicked:', resource);
              }}
            />
          </div>
        </div>
      </div>
    )}

    {/* Ressourcen KPI Dashboard Modal */}
    {showResourceKPIs && (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[99999] p-4">
        <div className="bg-[#2c3539] rounded-2xl shadow-2xl border border-white/20 max-w-7xl w-full max-h-[95vh] overflow-hidden">
          <div className="flex items-center justify-between p-6 border-b border-white/10">
            <h2 className="text-xl font-bold text-white">Ressourcen KPIs</h2>
            <button
              onClick={() => setShowResourceKPIs(false)}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <XCircle size={24} className="text-gray-400" />
            </button>
          </div>
          <div className="overflow-y-auto max-h-[calc(95vh-120px)] p-6">
            <ResourceKPIDashboard 
              serviceProviderId={user?.id}
            />
          </div>
        </div>
      </div>
    )}

    {/* Enhanced Guided Tour for Service Providers */}
    {showTour && (
      <EnhancedGuidedTour
        onClose={() => setShowTour(false)}
        onCompleted={() => completeTour()}
        userRole="DIENSTLEISTER"
      />
    )}

    {/* Resource Details Modal */}
    {showResourceDetailsModal && selectedResourceForDetails && (
      <ResourceDetailsModal
        resource={selectedResourceForDetails}
        isOpen={showResourceDetailsModal}
        onClose={() => {
          setShowResourceDetailsModal(false);
          setSelectedResourceForDetails(null);
        }}
        onEdit={() => handleEditResource(selectedResourceForDetails)}
        onDelete={() => handleDeleteResource(selectedResourceForDetails)}
        isAllocated={isResourceAllocated(selectedResourceForDetails.id)}
        allocationDetails={getResourceAllocationDetails(selectedResourceForDetails.id)}
        translateCategory={translateCategory}
        translateSubcategory={translateSubcategory}
      />
    )}

    {/* Resource KPI Dashboard Modal */}
    <ResourceKPIDashboard
      isOpen={showResourceKPIs}
      onClose={() => setShowResourceKPIs(false)}
    />

    {/* Resource Calendar Modal */}
    {showResourceCalendar && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[99999] p-4">
        <div className="bg-[#1a1a1a] rounded-2xl w-full max-w-7xl max-h-[95vh] overflow-hidden">
          <div className="flex items-center justify-between p-6 border-b border-gray-700">
            <h2 className="text-2xl font-bold text-white">Ressourcen-Kalenderansicht</h2>
            <button
              onClick={() => setShowResourceCalendar(false)}
              className="p-2 text-gray-400 hover:text-white hover:bg-[#333] rounded-lg transition-colors"
            >
              <XCircle className="w-6 h-6" />
            </button>
          </div>
          <div className="p-6 overflow-y-auto max-h-[calc(95vh-120px)]">
            <ResourceCalendar
              serviceProviderId={user?.id}
              initialResources={userResources}
              onAddResource={() => {}}
              showFilters={true}
            />
          </div>
        </div>
      </div>
    )}

      {/* Notification Tab für Dienstleister */}
      {user && (user.user_type === 'service_provider' || user.user_role === 'DIENSTLEISTER') && (
        <NotificationTab userRole="DIENSTLEISTER" userId={user.id} />
      )}

      {/* Service Provider Document Tab */}
      {user && (user.user_type === 'service_provider' || user.user_role === 'DIENSTLEISTER') && (
        <ServiceProviderDocumentTab userId={user.id} />
      )}

      {/* Contact Tab für Dienstleister */}
      {user && (user.user_type === 'service_provider' || user.user_role === 'DIENSTLEISTER') && (
        <ContactTab userRole="DIENSTLEISTER" userId={user.id} />
      )}

      {/* Task Creation Modal */}
      <TaskCreationModal
        isOpen={showTaskCreation}
        onClose={() => setShowTaskCreation(false)}
        onTaskCreated={() => {
          // Optional: Reload data or show success message
          console.log('Task created successfully');
        }}
      />
    </>
  );
}
