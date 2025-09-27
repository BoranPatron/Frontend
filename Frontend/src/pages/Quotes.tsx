import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useProject } from '../context/ProjectContext';
import { getMilestones, createMilestone, updateMilestone, getAllMilestones, deleteMilestone } from '../api/milestoneService';
import { getProjects } from '../api/projectService';

import { getQuotesForMilestone, createMockQuotesForMilestone, acceptQuote, resetQuote, createQuote, updateQuote, deleteQuote, submitQuote, rejectQuote, withdrawQuote } from '../api/quoteService';
import { createFeeFromQuote } from '../api/buildwiseFeeService';
import { appointmentService } from '../api/appointmentService';
import { uploadDocument } from '../api/documentService';
import { searchProjectsInRadius, searchTradesInRadius, searchServiceProvidersInRadius, getBrowserLocation } from '../api/geoService';
import api from '../api/api';
import { TRADE_CATEGORIES } from '../constants/tradeCategories';
import TradeCreationForm from '../components/TradeCreationForm';
import CostEstimateForm from '../components/CostEstimateForm';
import TradeDetailsModal from '../components/TradeDetailsModal';
import CostEstimateDetailsModal from '../components/CostEstimateDetailsModal';
import CreateInspectionModal from '../components/CreateInspectionModal';
import OrderConfirmationGenerator from '../components/OrderConfirmationGenerator';
import TradeMap from '../components/TradeMap';
import UpgradeModal from '../components/UpgradeModal';
import { 
  Plus, 
  FileText, 
  Users, 
  MessageSquare, 
  Euro, 
  Calendar, 
  Target, 
  CheckCircle, 
  X, 
  Edit, 
  Trash2, 
  Eye, 
  Download, 
  Upload, 
  Send, 
  Award, 
  Gavel,
  AlertTriangle,
  Clock,
  Star,
  Handshake,
  Building,
  Shield,
  ArrowLeft,
  ChevronRight,
  ChevronDown,
  Ban,
  RotateCcw,
  XCircle,
  User,
  Mail,
  Phone,
  Globe,
  Brain,
  Info,
  AlertCircle,
  Search,
  Filter,
  TrendingUp,
  Zap,
  MoreHorizontal,
  MapPin,
  ClipboardList,
  Droplets,
  Thermometer,
  Hammer,
  TreePine,
  Wrench,
  ChevronUp,
  MessageCircle,
  Calculator,
  Map,
  List
} from 'lucide-react';
import type {
  ProjectSearchRequest,
  TradeSearchRequest,
  ServiceProviderSearchRequest,
  ProjectSearchResult,
  TradeSearchResult,
  ServiceProviderSearchResult
} from '../api/geoService';

interface Quote {
  id: number;
  title: string;
  description: string;
  status: 'draft' | 'submitted' | 'under_review' | 'accepted' | 'rejected' | 'expired';
  project_id: number;
  milestone_id?: number;
  service_provider_id: number;
  total_amount: number;
  currency: string;
  valid_until: string;
  labor_cost: number;
  material_cost: number;
  overhead_cost: number;
  estimated_duration: number;
  start_date: string;
  completion_date: string;
  payment_terms: string;
  warranty_period: number;
  risk_score: number;
  price_deviation: number;
  ai_recommendation: string;
  contact_released: boolean;
  company_name?: string;
  contact_person?: string;
  phone?: string;
  email?: string;
  website?: string;
  pdf_upload_path?: string;
  additional_documents?: string;
  rating?: number;
  feedback?: string;
  rejection_reason?: string;
  created_at: string;
  updated_at: string;
  submitted_at: string | null;
  accepted_at: string | null;
  // Neue Felder für professionellen Prozess
  phase: 'cost_estimate' | 'tender' | 'bidding' | 'evaluation' | 'awarded';
  cost_estimate_amount?: number;
  tender_documents?: string[];
  technical_specifications?: string;
  legal_requirements?: string;
  submission_deadline?: string;
  evaluation_criteria?: string[];
  invited_service_providers?: number[];
  questions_and_answers?: Array<{
    question: string;
    answer: string;
    asked_by: number;
    answered_by: number;
    asked_at: string;
    answered_at: string;
  }>;
  negotiation_history?: Array<{
    action: string;
    details: string;
    timestamp: string;
    user_id: number;
  }>;
}

interface ServiceProvider {
  id: number;
  first_name: string;
  last_name: string;
  company_name: string;
  company_address: string;
  company_phone: string;
  company_website: string;
  region: string;
  is_verified: boolean;
}

interface Project {
  id: number;
  name: string;
  description: string;
  address?: string;  // Vollständige Projektadresse
  address_street?: string;
  address_zip?: string;
  address_city?: string;
  address_latitude?: number;
  address_longitude?: number;
}

// Interface für Ausschreibungen
interface Trade {
  id: number;
  project_id: number;
  title: string;
  description: string;
  status: 'planning' | 'cost_estimate' | 'tender' | 'bidding' | 'evaluation' | 'awarded' | 'in_progress' | 'completed' | 'delayed' | 'cancelled';
  priority: string;
  progress_percentage: number;
  planned_date: string;
  start_date?: string;
  end_date?: string;
  actual_date?: string;
  category?: string;
  budget?: number;
  actual_costs?: number;
  contractor?: string;
  is_critical: boolean;
  notify_on_completion: boolean;
  notes?: string;
  created_at: string;
  updated_at: string;
  completed_at?: string;
  
  // Kategorie-spezifische Felder
  category_specific_fields?: {
    // Elektro
    electrical_voltage?: string;
    electrical_power?: string;
    electrical_circuits?: number;
    electrical_switches?: number;
    electrical_outlets?: number;
    electrical_lighting_points?: number;
    
    // Sanitär
    plumbing_fixtures?: number;
    plumbing_pipes_length?: number;
    plumbing_water_heater?: boolean;
    plumbing_sewage_system?: boolean;
    plumbing_water_supply?: boolean;
    
    // Heizung
    heating_system_type?: string;
    heating_power?: string;
    heating_radiators?: number;
    heating_thermostats?: number;
    heating_boiler?: boolean;
    
    // Dach
    roof_material?: string;
    roof_area?: number;
    roof_pitch?: number;
    roof_insulation?: boolean;
    roof_gutters?: boolean;
    roof_skylights?: number;
    
    // Fenster/Türen
    windows_count?: number;
    windows_type?: string;
    windows_glazing?: string;
    doors_count?: number;
    doors_type?: string;
    doors_material?: string;
    
    // Boden
    floor_material?: string;
    floor_area?: number;
    floor_subfloor?: string;
    floor_insulation?: boolean;
    
    // Wand
    wall_material?: string;
    wall_area?: number;
    wall_insulation?: boolean;
    wall_paint?: boolean;
    
    // Fundament
    foundation_type?: string;
    foundation_depth?: number;
    foundation_soil_type?: string;
    foundation_waterproofing?: boolean;
    
    // Garten/Landschaft
    garden_area?: number;
    garden_irrigation?: boolean;
    garden_lighting?: boolean;
    garden_paths?: boolean;
    garden_plants?: boolean;
    
    // Sonstiges
    custom_fields?: Record<string, any>;
  };
  
  // Dokumente und Dateien
  documents?: Array<{
    id: number;
    title: string;
    file_name: string;
    file_path: string;
    file_size: number;
    mime_type: string;
    uploaded_at: string;
  }>;
  
  // Technische Spezifikationen
  technical_specifications?: string;
  quality_requirements?: string;
  safety_requirements?: string;
  environmental_requirements?: string;
  
  // Neue Felder für professionellen Prozess
  phase: 'cost_estimate' | 'tender' | 'bidding' | 'evaluation' | 'awarded';
  cost_estimate_deadline?: string;
  tender_deadline?: string;
  bidding_deadline?: string;
  legal_requirements?: string;
  evaluation_criteria?: string[];
  invited_service_providers?: number[];
  awarded_service_provider?: number;
  contract_documents?: string[];
  warranty_period?: number;
  payment_terms?: string;
}

// Interface für kombinierte Ausschreibungen (lokale + Geo-Ausschreibungen)
interface CombinedTrade extends Trade {
  isGeoResult?: boolean;
  distance_km?: number;
  project_name?: string;
  project_type?: string;
  project_status?: string;
  project_address?: string;  // Vollständige Projektadresse
  address_street?: string;
  address_zip?: string;
  address_city?: string;
  address_latitude?: number;
  address_longitude?: number;
}

// Interface für gruppierte Projekte mit Ausschreibungen
interface ProjectWithTrades extends ProjectSearchResult {
  trades: TradeSearchResult[];
}

export default function Trades() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isServiceProvider, isBautraeger, userRole } = useAuth();
  const { selectedProject: currentProject } = useProject();
  
  // Prüfe ob der Benutzer ein Dienstleister ist
  const isServiceProviderUser = isServiceProvider();
  
  // State für Gewerke
  const [trades, setTrades] = useState<Trade[]>([]);
  const [isLoadingTrades, setIsLoadingTrades] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // State für Projekte (für Dienstleister)
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  
  // State für Filter und Suche
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  
  // State für Modal
  const [showTradeModal, setShowTradeModal] = useState(false);
  const [editingTrade, setEditingTrade] = useState<Trade | null>(null);
  const [deletingTrade, setDeletingTrade] = useState<number | null>(null);
  
  // State für Angebote-Modal
  const [showQuotesModal, setShowQuotesModal] = useState(false);
  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);
  const [tradeQuotes, setTradeQuotes] = useState<Quote[]>([]);
  
  // State für Angebote aller Gewerke
  const [allTradeQuotes, setAllTradeQuotes] = useState<{ [tradeId: number]: Quote[] }>({});
  
  // State für Besichtigungsstatus aller Gewerke
  const [tradeInspectionStatus, setTradeInspectionStatus] = useState<{ 
    [tradeId: number]: {
      hasActiveInspection: boolean;
      appointmentDate?: string;
      isInspectionDay: boolean;
      selectedServiceProviderId?: number;
    }
  }>({});
  
  // State für Angebot-Details-Modal
  const [showQuoteDetailsModal, setShowQuoteDetailsModal] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
  
  // State für Formular
  const [tradeForm, setTradeForm] = useState({
    title: '',
    description: '',
    category: 'eigene',
    customCategory: '',
    start_date: '',
    end_date: '',
    notes: '',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'critical',
    is_critical: false
  });

  // Angebotsformular-Modal-States
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [offerForm, setOfferForm] = useState({
    total_amount: '',
    description: '',
    valid_until: '',
    pdf: null as File | null,
    currency: 'EUR',
    labor_cost: '',
    material_cost: '',
    overhead_cost: '',
    start_date: '',
    completion_date: '',
    payment_terms: '',
    warranty_period: '',
    risk_score: '',
    price_deviation: '',
    ai_recommendation: '',
    contact_released: false,
    company_name: '',
    contact_person: '',
    phone: '',
    email: '',
    website: '',
    pdf_upload_path: '',
    additional_documents: '',
    rating: '',
    feedback: ''
  });
  const [offerLoading, setOfferLoading] = useState(false);
  const [offerSuccess, setOfferSuccess] = useState('');
  const [offerError, setOfferError] = useState('');
  const [offerTrade, setOfferTrade] = useState<Trade | null>(null);
  // Accordion-Logik für Angebotsformular (toggle)
  const [openOfferSection, setOpenOfferSection] = useState<'basis' | 'kalkulation' | 'kontakt' | null>('basis');
  const handleAccordionToggle = (section: 'basis' | 'kalkulation' | 'kontakt') => {
    setOpenOfferSection(prev => prev === section ? null : section);
  };

  // State für Reject-Modal
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectingQuote, setRejectingQuote] = useState<Quote | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejectLoading, setRejectLoading] = useState(false);
  
  // State für Withdraw-Modal
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawingQuote, setWithdrawingQuote] = useState<Quote | null>(null);
  const [withdrawLoading, setWithdrawLoading] = useState(false);

  // Neue State-Variablen für TradeCreationForm
  const [showTradeCreationForm, setShowTradeCreationForm] = useState(false);
  // Query-Param zum direkten Öffnen des Gewerk-Formulars
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const shouldOpenTradeCreate = params.get('create') === 'trade';
    if (shouldOpenTradeCreate) {
      setShowTradeCreationForm(true);
    }
  }, [location.search]);
  const [showCostEstimateForm, setShowCostEstimateForm] = useState(false);
  const [selectedTradeForEstimate, setSelectedTradeForEstimate] = useState<Trade | null>(null);
  const [selectedTradeForCostEstimate, setSelectedTradeForCostEstimate] = useState<Trade | null>(null);

  // State für TradeDetailsModal
  const [showTradeDetailsModal, setShowTradeDetailsModal] = useState(false);
  const [selectedTradeForDetails, setSelectedTradeForDetails] = useState<Trade | null>(null);

  // State für CostEstimateDetailsModal (Bauträger-Ansicht)
  const [showCostEstimateDetailsModal, setShowCostEstimateDetailsModal] = useState(false);
  // Guard, um Modals nur einmal pro Klick zu öffnen (Flacker verhindern)
  const modalGuardRef = useRef<{ lastTradeId?: number; timestamp?: number }>({});
  const [selectedTradeForCostEstimateDetails, setSelectedTradeForCostEstimateDetails] = useState<Trade | null>(null);

  // State für Auftragsbestätigung
  const [showOrderConfirmationGenerator, setShowOrderConfirmationGenerator] = useState(false);
  const [selectedTradeForOrderConfirmation, setSelectedTradeForOrderConfirmation] = useState<Trade | null>(null);
  const [selectedQuoteForOrderConfirmation, setSelectedQuoteForOrderConfirmation] = useState<Quote | null>(null);
  const [orderConfirmationData, setOrderConfirmationData] = useState<any>(null);

  // Geo-Search State für Dienstleister - immer ausgeklappt
  const [showGeoSearch, setShowGeoSearch] = useState(true);
  
  // Tab State für Ansichtsmodus
  const [activeTab, setActiveTab] = useState<'list' | 'map'>('list');
  
  // Verbesserte Geo-Suche State
  const [manualAddress, setManualAddress] = useState('');
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [showAcceptedTrades, setShowAcceptedTrades] = useState(false);
  
  const [geoSearchMode, setGeoSearchMode] = useState<'projects' | 'trades' | 'service_providers'>(() => {
    const saved = localStorage.getItem('buildwise_geo_search_mode');
    return (saved as any) || 'trades';
  });
  
  const [geoViewMode, setGeoViewMode] = useState<'map' | 'list'>(() => {
    const saved = localStorage.getItem('buildwise_geo_view_mode');
    return (saved as any) || 'list';
  });
  
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
  
  // Geo-Search Results
  const [geoProjects, setGeoProjects] = useState<ProjectSearchResult[]>([]);
  const [geoTrades, setGeoTrades] = useState<TradeSearchResult[]>([]);
  const [geoServiceProviders, setGeoServiceProviders] = useState<ServiceProviderSearchResult[]>([]);
  const [projectsWithTrades, setProjectsWithTrades] = useState<ProjectWithTrades[]>([]);
  
  // localStorage-Persistierung für Geo-Search-Einstellungen
  
  useEffect(() => {
    localStorage.setItem('buildwise_geo_search_mode', geoSearchMode);
  }, [geoSearchMode]);
  
  useEffect(() => {
    localStorage.setItem('buildwise_geo_view_mode', geoViewMode);
  }, [geoViewMode]);
  
  useEffect(() => {
    if (currentLocation) {
      localStorage.setItem('buildwise_geo_location', JSON.stringify(currentLocation));
    }
  }, [currentLocation]);
  
  useEffect(() => {
    localStorage.setItem('buildwise_geo_radius', radiusKm.toString());
  }, [radiusKm]);
  
  // Geo-Search Filter
  const [geoProjectType, setGeoProjectType] = useState<string>('');
  const [geoProjectStatus, setGeoProjectStatus] = useState<string>('');
  const [geoTradeCategory, setGeoTradeCategory] = useState<string>('');
  const [geoTradeStatus, setGeoTradeStatus] = useState<string>('');
  const [geoTradePriority, setGeoTradePriority] = useState<string>('');
  const [geoMinBudget, setGeoMinBudget] = useState<number | undefined>();
  const [geoMaxBudget, setGeoMaxBudget] = useState<number | undefined>();
  const [geoUserType, setGeoUserType] = useState<string>('');

  // State für Upgrade Modal (Gewerke-Limit)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  
  // State für Besichtigungs-Modal
  const [showCreateInspectionModal, setShowCreateInspectionModal] = useState(false);
  const [selectedTradeForInspection, setSelectedTradeForInspection] = useState<any>(null);
  const [selectedQuotesForInspection, setSelectedQuotesForInspection] = useState<any[]>([]);

  // Funktion um Gewerke-Limit zu prüfen
  const checkTradeLimit = () => {
    const subscriptionPlan = user?.subscription_plan || 'basis';
    const userRole = user?.user_role;
    
    // Limit nur für Bauträger in Basis-Version
    if (userRole === 'bautraeger' && subscriptionPlan === 'basis') {
      const tradeCount = trades.filter(trade => trade.project_id === selectedProject?.id).length;
      const TRADE_LIMIT = 3;
      
      if (tradeCount >= TRADE_LIMIT) {
        setShowUpgradeModal(true);
        return false;
      }
    }
    
    return true;
  };
  
  // Handler für Gewerk erstellen mit Limit-Prüfung
  const handleCreateTrade = () => {
    if (checkTradeLimit()) {
      setShowTradeCreationForm(true);
    }
  };
  
  // Handler für Upgrade Modal
  const handleUpgrade = async (planType: 'monthly' | 'yearly') => {
    // Hier würde die Upgrade-Logik implementiert werden
    setShowUpgradeModal(false);
    alert('Upgrade-Funktionalität wird implementiert. Kontaktieren Sie uns für Details.');
  };

  // Handler für Auftragsbestätigung-Generierung
  const handleGenerateOrderConfirmation = async (documentData: any) => {
    try {
      // Erstelle FormData für Dokument-Upload
      const formData = new FormData();
      
      // Verwende die PDF-Datei direkt aus documentData
      formData.append('file', documentData.file);
      formData.append('project_id', documentData.project_id.toString());
      formData.append('title', documentData.title);
      formData.append('description', documentData.description);
      formData.append('document_type', documentData.document_type);
      formData.append('category', documentData.category);
      formData.append('subcategory', documentData.subcategory);
      formData.append('tags', documentData.tags);
      formData.append('is_public', documentData.is_public.toString());
      
      // Upload Dokument
      const uploadedDocument = await uploadDocument(formData);
      // Schließe Modal
      setShowOrderConfirmationGenerator(false);
      setOrderConfirmationData(null);
      
      // Zeige Erfolgsmeldung
      setSuccess('Auftragsbestätigung erfolgreich erstellt und im Dokumentenbereich abgelegt!');
      setTimeout(() => setSuccess(''), 5000);
      
      // Navigiere zum Dokumentenbereich
      setTimeout(() => {
        window.open(`/documents?project=${documentData.project_id}`, '_blank');
      }, 2000);
      
    } catch (error: any) {
      console.error('❌ Fehler beim Erstellen der Auftragsbestätigung:', error);
      setError(`Fehler beim Erstellen der Auftragsbestätigung: ${error.message}`);
    }
  };

  const handleCloseOrderConfirmationGenerator = () => {
    setShowOrderConfirmationGenerator(false);
    setOrderConfirmationData(null);
  };

  const loadTrades = async () => {
    console.log('🔍 loadTrades called with:', { selectedProject, isServiceProvider: isServiceProvider() });
    setIsLoadingTrades(true);
    setError('');
    try {
      let tradesData: Trade[] = [];
      if (isServiceProvider()) {
        // Dienstleister: alle Milestones (Ausschreibungen) global laden
        tradesData = await getAllMilestones();
        } else {
        // Bauträger: Trades projektbasiert laden (wie bisher)
        if (selectedProject) {
          tradesData = await getMilestones(selectedProject.id);
          } else {
          setTrades([]);
          setIsLoadingTrades(false);
          return;
        }
      }
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

  // Lade Angebote für ein Gewerk
  const loadTradeQuotes = async (tradeId: number) => {
    try {
      const data = await getQuotesForMilestone(tradeId);
      setTradeQuotes(data);
    } catch (err: any) {
      console.error('Error loading quotes:', err);
          setTradeQuotes([]);
    }
  };

  // Lade Angebote für alle Gewerke
  const loadAllTradeQuotes = async (tradesData: Trade[]) => {
    try {
      const quotesMap: { [tradeId: number]: Quote[] } = {};
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
      
      // Lade auch die Besichtigungsstatus für alle Gewerke
      await loadAllTradeInspectionStatus(tradesData);
    } catch (e: any) {
      console.error('❌ Error loading all trade quotes:', e);
      setAllTradeQuotes({});
    }
  };

  // Lade Besichtigungsstatus für alle Gewerke
  const loadAllTradeInspectionStatus = async (tradesData: Trade[]) => {
    try {
      const statusMap: { [tradeId: number]: {
        hasActiveInspection: boolean;
        appointmentDate?: string;
        isInspectionDay: boolean;
        selectedServiceProviderId?: number;
      }} = {};
      
      const statusPromises = tradesData.map(async (trade) => {
        try {
          const status = await appointmentService.checkActiveInspectionForTrade(trade.id);
          statusMap[trade.id] = status;
        } catch (e: any) {
          console.error('❌ Error loading inspection status for trade:', trade.id, e);
          statusMap[trade.id] = { hasActiveInspection: false, isInspectionDay: false };
        }
      });
      
      await Promise.all(statusPromises);
      setTradeInspectionStatus(statusMap);
    } catch (e: any) {
      console.error('❌ Error loading all trade inspection status:', e);
      setTradeInspectionStatus({});
    }
  };

  // Öffne Angebote-Modal
  const openQuotesModal = async (trade: Trade) => {
    setSelectedTrade(trade);
    await loadTradeQuotes(trade.id);
    setShowQuotesModal(true);
  };

  // Öffne Angebot-Details-Modal
  const openQuoteDetailsModal = (quote: Quote) => {
    setSelectedQuote(quote);
    setShowQuoteDetailsModal(true);
  };

  // Akzeptiere ein Angebot
  const handleAcceptQuote = async (quoteId: number) => {
    // Finde das zugehörige Gewerk für die Besichtigungsstatus-Prüfung
    let tradeId: number | null = null;
    for (const [tId, quotes] of Object.entries(allTradeQuotes)) {
      if (quotes.some(q => q.id === quoteId)) {
        tradeId = parseInt(tId);
        break;
      }
    }
    
    // Prüfe Besichtigungsstatus
    if (tradeId && tradeInspectionStatus[tradeId]) {
      const inspectionStatus = tradeInspectionStatus[tradeId];
      if (inspectionStatus.hasActiveInspection && 
          !inspectionStatus.isInspectionDay && 
          !inspectionStatus.selectedServiceProviderId) {
        setError(`Die Annahme von Kostenvoranschlägen ist bis zum Besichtigungstermin am ${
          inspectionStatus.appointmentDate ? 
          new Date(inspectionStatus.appointmentDate).toLocaleDateString('de-DE') : 
          'unbekanntem Datum'
        } gesperrt.`);
        return;
      }
    }
    
    // Bestätigungsdialog für verbindliche Annahme
    const confirmed = window.confirm(
      '⚠️ WICHTIG: Kostenvoranschlag verbindlich annehmen?\n\n' +
      'Durch die Annahme dieses Kostenvoranschlags gehen Sie eine verbindliche Vereinbarung ein. ' +
      'Alle anderen Kostenvoranschläge für dieses Gewerk werden automatisch abgelehnt. ' +
      'Das angenommene Angebot wird als Kostenposition in der Finanzübersicht angezeigt.\n\n' +
      'Möchten Sie den Kostenvoranschlag wirklich annehmen?'
    );
    
    if (!confirmed) {
      return;
    }
    
    try {
      // Prüfe ob Token vorhanden ist
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Nicht angemeldet. Bitte melden Sie sich erneut an.');
        return;
      }
      await acceptQuote(quoteId);
      // Finde das angenommene Angebot und das zugehörige Gewerk
      const acceptedQuote = allTradeQuotes[selectedTradeForCostEstimateDetails?.id || 0]?.find(q => q.id === quoteId);
      if (acceptedQuote && selectedTradeForCostEstimateDetails && currentProject) {
        // Erstelle automatisch BuildWise-Gebühr
        try {
          // Verwende die Trade-ID als cost_position_id, da diese die Kostenposition repräsentiert
          const costPositionId = selectedTradeForCostEstimateDetails?.id || quoteId;
          const buildwiseFee = await createFeeFromQuote(
            quoteId,
            costPositionId, // Verwende Trade-ID als cost_position_id
            1.0 // 1% Gebühr
          );
          } catch (feeError: any) {
          console.error('❌ Fehler beim Erstellen der BuildWise-Gebühr:', feeError);
          // Gebühren-Fehler nicht kritisch behandeln, da Angebot bereits akzeptiert wurde
        }
        
        // Setze Daten für Auftragsbestätigung
        setSelectedTradeForOrderConfirmation(selectedTradeForCostEstimateDetails);
        setSelectedQuoteForOrderConfirmation(acceptedQuote);
        setOrderConfirmationData({
          project: currentProject,
          trade: selectedTradeForCostEstimateDetails,
          quote: acceptedQuote,
          user: user
        });
        
        // Öffne Auftragsbestätigung-Generator
        setShowOrderConfirmationGenerator(true);
      }
      
      // Lade die Angebote neu, um den Status zu aktualisieren
      if (selectedTrade) {
        await loadTradeQuotes(selectedTrade.id);
      }
      // Lade alle Gewerke neu, um die Details in den Kacheln zu aktualisieren
      await loadTrades();
      // Zeige Erfolgsmeldung
      setSuccess('Kostenvoranschlag erfolgreich angenommen! Auftragsbestätigung wird erstellt...');
      setTimeout(() => setSuccess(''), 5000);
    } catch (err: any) {
      console.error('❌ Error accepting quote:', err);
      // Spezifische Fehlerbehandlung
      if (err.message?.includes('Could not validate credentials')) {
        setError('Sitzung abgelaufen. Bitte melden Sie sich erneut an.');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
      } else if (err.message?.includes('NetworkError')) {
        setError('Verbindungsfehler. Bitte überprüfen Sie Ihre Internetverbindung.');
      } else {
        setError(`Fehler beim Akzeptieren des Kostenvoranschlags: ${err.message || 'Unbekannter Fehler'}`);
      }
    }
  };

  // Setze ein angenommenes Angebot zurück
  const handleResetQuote = async (quoteId: number) => {
    // Bestätigungsdialog für Zurücksetzen
    const confirmed = window.confirm(
      '⚠️ WICHTIG: Angebot zurücksetzen?\n\n' +
      'Durch das Zurücksetzen wird das Angebot wieder auf "Angebot annehmen" gesetzt. ' +
      'Die zugehörige Kostenposition wird aus der Finanzübersicht entfernt.\n\n' +
      'Möchten Sie das Angebot wirklich zurücksetzen?'
    );
    
    if (!confirmed) {
      return;
    }
    
    try {
      // Prüfe ob Token vorhanden ist
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Nicht angemeldet. Bitte melden Sie sich erneut an.');
        return;
      }
      
      // Rufe die Reset-API auf
      await resetQuote(quoteId);
      
      // Lade die Angebote neu, um den Status zu aktualisieren
      if (selectedTrade) {
        await loadTradeQuotes(selectedTrade.id);
      }
      
      // Lade alle Gewerke neu, um die Details in den Kacheln zu aktualisieren
      await loadTrades();
      
      // Zeige Erfolgsmeldung
      setSuccess('Angebot erfolgreich zurückgesetzt! Die Kostenposition wurde aus der Finanzübersicht entfernt.');
      setTimeout(() => setSuccess(''), 5000);
    } catch (err: any) {
      console.error('❌ Error resetting quote:', err);
      // Spezifische Fehlerbehandlung
      if (err.message?.includes('Could not validate credentials')) {
        setError('Sitzung abgelaufen. Bitte melden Sie sich erneut an.');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
      } else if (err.message?.includes('NetworkError')) {
        setError('Verbindungsfehler. Bitte überprüfen Sie Ihre Internetverbindung.');
      } else {
        setError(`Fehler beim Zurücksetzen des Angebots: ${err.message || 'Unbekannter Fehler'}`);
      }
    }
  };

  // Handler für Angebotsformular
  const openOfferModal = (trade: Trade) => {
    setOfferTrade(trade);
    setOfferForm({
      total_amount: '',
      description: '',
      valid_until: '',
      pdf: null,
      currency: 'EUR',
      labor_cost: '',
      material_cost: '',
      overhead_cost: '',
      start_date: '',
      completion_date: '',
      payment_terms: '',
      warranty_period: '',
      risk_score: '',
      price_deviation: '',
      ai_recommendation: '',
      contact_released: false,
      company_name: '',
      contact_person: '',
      phone: '',
      email: '',
      website: '',
      pdf_upload_path: '',
      additional_documents: '',
      rating: '',
      feedback: ''
    });
    setOfferSuccess('');
    setOfferError('');
    setShowOfferModal(true);
  };
  const closeOfferModal = () => {
    setShowOfferModal(false);
    setOfferTrade(null);
  };
  const handleOfferFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setOfferForm((prev) => ({ ...prev, [name]: value }));
  };
  const handleOfferCurrencyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setOfferForm((prev) => ({ ...prev, currency: e.target.value }));
  };
  const handleOfferPaymentTermsChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { value } = e.target;
    setOfferForm((prev) => ({ ...prev, payment_terms: value }));
  };
  const handleOfferFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setOfferForm((prev) => ({ ...prev, pdf: e.target.files![0] }));
    }
  };
  const handleOfferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setOfferLoading(true);
    setOfferSuccess('');
    setOfferError('');
    
    try {
      if (!offerTrade) throw new Error('Kein Gewerk ausgewählt');
      
      // Validierung der Pflichtfelder mit spezifischen Fehlermeldungen
      const missingFields: string[] = [];
      
      if (!offerForm.total_amount || offerForm.total_amount.trim() === '') {
        missingFields.push('Preis');
      }
      
      if (!offerForm.valid_until || offerForm.valid_until.trim() === '') {
        missingFields.push('Gültig bis');
      }
      
      if (!offerForm.start_date || offerForm.start_date.trim() === '') {
        missingFields.push('Startdatum');
      }
      
      if (!offerForm.completion_date || offerForm.completion_date.trim() === '') {
        missingFields.push('Vorausichtliche Fertigstellung');
      }
      
      if (!offerForm.company_name || offerForm.company_name.trim() === '') {
        missingFields.push('Firmenname');
      }
      
      if (!offerForm.contact_person || offerForm.contact_person.trim() === '') {
        missingFields.push('Ansprechpartner');
      }
      
      if (!offerForm.email || offerForm.email.trim() === '') {
        missingFields.push('E-Mail');
      }
      
      if (missingFields.length > 0) {
        throw new Error(`Bitte füllen Sie folgende Pflichtfelder aus: ${missingFields.join(', ')}`);
      }
      
      // Erstelle JSON-Objekt für API-Request (Backend erwartet QuoteCreate Schema)
      const quoteData: any = {
        title: `${offerForm.company_name} - ${offerTrade.title}`,
        description: offerForm.description || '',
        total_amount: parseFloat(offerForm.total_amount),
        currency: offerForm.currency || 'EUR',
        valid_until: offerForm.valid_until,
        start_date: offerForm.start_date,
        completion_date: offerForm.completion_date,
        project_id: offerTrade.project_id, // KORREKTUR: Immer die Projekt-ID des Gewerks verwenden
        milestone_id: offerTrade.id,
        service_provider_id: user?.id || 0, // Aktueller Benutzer als Dienstleister
        status: 'submitted', // Neues Angebot hat Status "submitted"
        // Dienstleister-Felder
        company_name: offerForm.company_name,
        contact_person: offerForm.contact_person,
        email: offerForm.email
      };
      
      // Optionale Felder nur hinzufügen wenn sie existieren
      if (offerForm.labor_cost) quoteData.labor_cost = parseFloat(offerForm.labor_cost);
      if (offerForm.material_cost) quoteData.material_cost = parseFloat(offerForm.material_cost);
      if (offerForm.overhead_cost) quoteData.overhead_cost = parseFloat(offerForm.overhead_cost);
      if (offerForm.warranty_period) quoteData.warranty_period = parseInt(offerForm.warranty_period);
      if (offerForm.payment_terms) quoteData.payment_terms = offerForm.payment_terms;
      if (offerForm.phone) quoteData.phone = offerForm.phone;
      if (offerForm.website) quoteData.website = offerForm.website;
      
      const res = await createQuote(quoteData);
      setOfferSuccess('Angebot erfolgreich eingereicht!');
      setShowOfferModal(false);
      
      // Lade Angebote neu
      if (selectedTrade) {
        await loadTradeQuotes(selectedTrade.id);
      }
      await loadTrades();
      
    } catch (err: any) {
      console.error('❌ Error submitting offer:', err);
      
      // Spezifische Fehlerbehandlung für 422 Validierungsfehler
      if (err.response?.status === 422) {
        const validationErrors = err.response.data?.detail;
        if (Array.isArray(validationErrors)) {
          const errorMessages = validationErrors.map((error: any) => {
            const field = error.loc?.join('.') || error.field || 'Unbekanntes Feld';
            const message = error.msg || error.message || 'Ungültiger Wert';
            return `${field}: ${message}`;
          }).join(', ');
          setOfferError(`Validierungsfehler: ${errorMessages}`);
        } else if (typeof validationErrors === 'string') {
          setOfferError(`Validierungsfehler: ${validationErrors}`);
        } else {
          setOfferError('Ungültige Daten für das Angebot. Bitte überprüfen Sie alle Felder.');
        }
      } else if (err.response?.status === 401) {
        setOfferError('Nicht autorisiert. Bitte melden Sie sich erneut an.');
      } else if (err.response?.status === 403) {
        setOfferError('Keine Berechtigung für diese Aktion.');
      } else if (err.response?.status === 404) {
        setOfferError('Gewerk oder Projekt nicht gefunden.');
      } else if (err.response?.data?.detail) {
        setOfferError(err.response.data.detail);
      } else {
        setOfferError(err.message || 'Fehler beim Absenden des Angebots');
      }
    } finally {
      setOfferLoading(false);
    }
  };

  // Handler für Angebot ablehnen
  const handleRejectQuote = async (quoteId: number, reason?: string) => {
    // Bestätigungsdialog für Ablehnung
    const confirmed = window.confirm(
      '⚠️ WICHTIG: Angebot ablehnen?\n\n' +
      'Durch die Ablehnung dieses Angebots wird es als "abgelehnt" markiert. ' +
      'Der Dienstleister wird über die Ablehnung informiert.\n\n' +
      'Möchten Sie das Angebot wirklich ablehnen?'
    );
    
    if (!confirmed) {
      return;
    }
    
    try {
      // Prüfe ob Token vorhanden ist
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Nicht angemeldet. Bitte melden Sie sich erneut an.');
        return;
      }
      await rejectQuote(quoteId, reason);
      // Lade die Angebote neu, um den Status zu aktualisieren
      if (selectedTrade) {
        await loadTradeQuotes(selectedTrade.id);
      }
      // Lade alle Gewerke neu, um die Details in den Kacheln zu aktualisieren
      await loadTrades();
      // Zeige Erfolgsmeldung
      setSuccess('Angebot erfolgreich abgelehnt! Der Dienstleister wurde informiert.');
      setTimeout(() => setSuccess(''), 5000);
      // Schließe Modal
      setShowRejectModal(false);
      setRejectingQuote(null);
      setRejectionReason('');
    } catch (err: any) {
      console.error('❌ Error rejecting quote:', err);
      // Spezifische Fehlerbehandlung
      if (err.message?.includes('Could not validate credentials')) {
        setError('Sitzung abgelaufen. Bitte melden Sie sich erneut an.');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
      } else if (err.message?.includes('NetworkError')) {
        setError('Verbindungsfehler. Bitte überprüfen Sie Ihre Internetverbindung.');
      } else {
        setError(`Fehler beim Ablehnen des Angebots: ${err.message || 'Unbekannter Fehler'}`);
      }
    }
  };

  // Exponiere Handler temporär für Inline-Menü im TradeDetailsModal
  ;(window as any).__onAcceptQuote = handleAcceptQuote;
  ;(window as any).__onRejectQuote = handleRejectQuote;

  // Handler für Angebot zurückziehen (Dienstleister)
  const handleWithdrawQuote = async (quoteId: number) => {
    // Bestätigungsdialog für Rückzug
    const confirmed = window.confirm(
      '⚠️ WICHTIG: Angebot zurückziehen?\n\n' +
      'Durch das Zurückziehen wird das Angebot unwiderruflich gelöscht. ' +
      'Diese Aktion kann nicht rückgängig gemacht werden.\n\n' +
      'Möchten Sie das Angebot wirklich zurückziehen?'
    );
    
    if (!confirmed) {
      return;
    }
    
    try {
      // Prüfe ob Token vorhanden ist
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Nicht angemeldet. Bitte melden Sie sich erneut an.');
        return;
      }
      await withdrawQuote(quoteId);
      // Lade die Angebote neu, um den Status zu aktualisieren
      if (selectedTrade) {
        await loadTradeQuotes(selectedTrade.id);
      }
      // Lade alle Gewerke neu, um die Details in den Kacheln zu aktualisieren
      await loadTrades();
      // Zeige Erfolgsmeldung
      setSuccess('Angebot erfolgreich zurückgezogen!');
      setTimeout(() => setSuccess(''), 5000);
      // Schließe Modal
      setShowWithdrawModal(false);
      setWithdrawingQuote(null);
    } catch (err: any) {
      console.error('❌ Error withdrawing quote:', err);
      // Spezifische Fehlerbehandlung
      if (err.message?.includes('Could not validate credentials')) {
        setError('Sitzung abgelaufen. Bitte melden Sie sich erneut an.');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
      } else if (err.message?.includes('NetworkError')) {
        setError('Verbindungsfehler. Bitte überprüfen Sie Ihre Internetverbindung.');
      } else {
        setError(`Fehler beim Zurückziehen des Angebots: ${err.message || 'Unbekannter Fehler'}`);
      }
    }
  };

  // Öffne Reject-Modal
  const openRejectModal = (quote: Quote) => {
    setRejectingQuote(quote);
    setRejectionReason('');
    setShowRejectModal(true);
  };

  // Öffne Withdraw-Modal
  const openWithdrawModal = (quote: Quote) => {
    setWithdrawingQuote(quote);
    setShowWithdrawModal(true);
  };

  // Besichtigungs-Handler
  const handleCreateInspection = (tradeId: number, selectedQuoteIds: number[]) => {
    const trade = trades.find(t => t.id === tradeId);
    const tradeQuotes = allTradeQuotes[tradeId] || [];
    const selectedQuotes = tradeQuotes.filter(q => selectedQuoteIds.includes(q.id));
    
    if (trade && selectedQuotes.length > 0) {
      setSelectedTradeForInspection(trade);
      setSelectedQuotesForInspection(selectedQuotes);
      // Schliesse beide ggf. offenen Modalfenster, um Überlagerungen zu vermeiden
      setShowCostEstimateDetailsModal(false);
      setShowTradeDetailsModal(false);
      setTimeout(() => {
        setShowCreateInspectionModal(true);
      }, 150);
    }
  };

  const handleInspectionCreated = async (inspectionResult: any) => {
    try {
      // Erfolgsmeldung mit Details anzeigen
      const invitationsCount = inspectionResult.invitations_count || 0;
      setSuccess(`Besichtigung erfolgreich erstellt! ${invitationsCount} Dienstleister wurden benachrichtigt.`);
      setTimeout(() => setSuccess(''), 5000);
      
      // Modal schließen
      setShowCreateInspectionModal(false);
      setSelectedTradeForInspection(null);
      setSelectedQuotesForInspection([]);
      
      // Optional: Daten neu laden
      if (selectedTrade) {
        await loadTradeQuotes(selectedTrade.id);
      }
      
    } catch (err: any) {
      console.error('❌ Fehler beim Verarbeiten der Besichtigung:', err);
      setError(`Fehler beim Verarbeiten der Besichtigung: ${err.message}`);
    }
  };

  // Öffnet ein Modal exklusiv (verhindert visuelle Überlagerungen/Flackern)
  const openExclusiveModal = (target: 'trade' | 'cost', trade: any) => {
    // Setze Auswahl synchron
    if (target === 'trade') {
      setSelectedTradeForDetails(trade);
      setSelectedTradeForCostEstimateDetails(null as any);
      setShowCostEstimateDetailsModal(false);
      setShowTradeDetailsModal(true);
    } else {
      setSelectedTradeForCostEstimateDetails(trade);
      setSelectedTradeForDetails(null as any);
      setShowTradeDetailsModal(false);
      setShowCostEstimateDetailsModal(true);
    }
  };

  const handleNewOfferFromRejected = (quote: Quote) => {
    const trade = trades.find(t => t.id === quote.milestone_id);
    if (trade) {
      // Setze das Angebotsformular mit den Daten des abgelehnten Angebots
      setOfferForm({
        total_amount: quote.total_amount.toString(),
        description: quote.description || '',
        valid_until: quote.valid_until ? new Date(quote.valid_until).toISOString().split('T')[0] : '',
        pdf: null,
        currency: quote.currency,
        labor_cost: quote.labor_cost ? quote.labor_cost.toString() : '',
        material_cost: quote.material_cost ? quote.material_cost.toString() : '',
        overhead_cost: quote.overhead_cost ? quote.overhead_cost.toString() : '',
        start_date: quote.start_date || '',
        completion_date: quote.completion_date || '',
        payment_terms: quote.payment_terms || '',
        warranty_period: quote.warranty_period ? quote.warranty_period.toString() : '',
        company_name: quote.company_name || '',
        contact_person: quote.contact_person || '',
        phone: quote.phone || '',
        email: quote.email || '',
        website: quote.website || '',
        additional_documents: quote.additional_documents || '',
        risk_score: quote.risk_score ? quote.risk_score.toString() : '',
        price_deviation: quote.price_deviation ? quote.price_deviation.toString() : '',
        ai_recommendation: quote.ai_recommendation || '',
        contact_released: quote.contact_released || false,
        pdf_upload_path: quote.pdf_upload_path || '',
        rating: quote.rating ? quote.rating.toString() : '',
        feedback: quote.feedback || ''
      });
      
      // Setze das Gewerk für das Angebotsformular
      setOfferTrade(trade);
      
      // Schließe das Details-Modal
      setShowQuoteDetailsModal(false);
      
      // Öffne das Angebotsformular-Modal nach kurzer Verzögerung
      setTimeout(() => {
        setShowOfferModal(true);
      }, 150);
    }
  };

  // Lade Projekte beim ersten Laden, falls sie noch nicht geladen sind
  useEffect(() => {
    const loadProjectsIfNeeded = async () => {
      try {
        const projects = await getProjects();
        setProjects(projects);
        
        // Für Bauträger: Verwende das aktuell ausgewählte Projekt
        if (!isServiceProviderUser && currentProject) {
          setSelectedProject(currentProject);
        } else if (isServiceProviderUser && projects.length > 0 && !selectedProject) {
          setSelectedProject(projects[0]);
        } else if (projects.length === 0) {
          } else {
          }
      } catch (error) {
        console.error('❌ Error loading projects:', error);
      }
    };
    
    loadProjectsIfNeeded();
  }, [currentProject, isServiceProviderUser]);

  // Lade Gewerke/Ausschreibungen korrekt je nach Rolle
  useEffect(() => {
    if (isServiceProviderUser) {
      // Dienstleister: sofort alle Gewerke/Ausschreibungen laden
      loadTrades();
    } else if (selectedProject) {
      // Bauträger: erst laden, wenn ein Projekt gewählt ist
      loadTrades();
    }
    // eslint-disable-next-line
  }, [selectedProject, isServiceProviderUser]);

  const activeCount = trades.filter(t => t.status !== 'completed').length;
  
  // Berechne Gewerke ohne Angebote
  const tradesWithoutQuotes = trades.filter(trade => {
    const quotes = allTradeQuotes[trade.id] || [];
    return quotes.length === 0;
  }).length;
  
  // Berechne Gewerke mit ausstehenden Angeboten (nicht akzeptiert)
  const tradesWithPendingQuotes = trades.filter(trade => {
    const quotes = allTradeQuotes[trade.id] || [];
    return quotes.length > 0 && quotes.every(quote => quote.status !== 'accepted');
  }).length;

  // Neue Funktion für TradeCreationForm - DEAKTIVIERT um Duplizierung zu vermeiden
  const handleCreateTradeWithForm = async (tradeData: any) => {
    try {
      // Modal schließen und Daten neu laden
      setShowTradeCreationForm(false);
      await loadTrades();
      
    } catch (error) {
      console.error('❌ Fehler beim Verarbeiten des Gewerks:', error);
      throw error;
    }
  };

  // Kostenvoranschlag-Funktionen
  const openCostEstimateModal = (trade: Trade | CombinedTrade) => {
    // Bei Geo-Gewerken das korrekte Projekt-Objekt erstellen
    if ('isGeoResult' in trade && trade.isGeoResult) {
      const geoProject = {
        id: trade.project_id,
        name: (trade as CombinedTrade).project_name || 'Unbekanntes Projekt',
        description: `Projekt vom Typ: ${(trade as CombinedTrade).project_type || 'Unbekannt'}`
      };
      setSelectedProject(geoProject);
    }
    
    setSelectedTradeForCostEstimate(trade);
    setShowCostEstimateForm(true);
  };

  const openTradeDetailsModal = (trade: Trade) => {
    setSelectedTradeForDetails(trade);
    setShowTradeDetailsModal(true);
    };

  const handleCostEstimateSubmit = async (costEstimateData: any) => {
    try {
      // API-Call für die Kostenvoranschlag-Erstellung
      const quoteData = {
        title: costEstimateData.title,
        description: costEstimateData.description,
        project_id: costEstimateData.project_id,
        milestone_id: costEstimateData.trade_id,
        service_provider_id: user?.id || 0,
        total_amount: parseFloat(costEstimateData.total_amount),
        currency: costEstimateData.currency,
        valid_until: costEstimateData.valid_until,
        estimated_duration: parseInt(costEstimateData.estimated_duration),
        start_date: costEstimateData.start_date,
        completion_date: costEstimateData.completion_date,
        labor_cost: costEstimateData.labor_cost ? parseFloat(costEstimateData.labor_cost) : 0,
        material_cost: costEstimateData.material_cost ? parseFloat(costEstimateData.material_cost) : 0,
        overhead_cost: costEstimateData.overhead_cost ? parseFloat(costEstimateData.overhead_cost) : 0,
        payment_terms: costEstimateData.payment_terms,
        warranty_period: costEstimateData.warranty_period ? parseInt(costEstimateData.warranty_period) : 24,
        status: 'submitted',
        company_name: costEstimateData.company_name,
        contact_person: costEstimateData.contact_person,
        phone: costEstimateData.phone,
        email: costEstimateData.email,
        website: costEstimateData.website
      };
      
      // Falls der Dienstleister bereits ein Angebot für dieses Gewerk hat: ersetze statt neu anzulegen
      const existing = (allTradeQuotes[costEstimateData.trade_id] || []).find((q: any) => q.service_provider_id === user?.id);
      if (existing) {
        await updateQuote(existing.id, quoteData);
      } else {
        await createQuote(quoteData);
      }
      
      // Erfolgreich erstellt
      // Modal schließen und Daten neu laden
      setShowCostEstimateForm(false);
      setSelectedTradeForEstimate(null);
      
      // Erfolgsmeldung anzeigen
      setSuccess('Kostenvoranschlag erfolgreich abgegeben!');
      setTimeout(() => setSuccess(''), 5000);
      
      // Daten neu laden
      await loadTrades();
      
    } catch (error) {
      console.error('❌ Fehler beim Erstellen des Kostenvoranschlags:', error);
      setError('Fehler beim Erstellen des Kostenvoranschlags: ' + (error as any).message);
      throw error;
    }
  };

  // Schnelle Status-Änderung
  const handleQuickStatusChange = async (tradeId: number, newStatus: string) => {
    try {
      const trade = trades.find(t => t.id === tradeId);
      if (!trade) return;

      await updateMilestone(tradeId, { status: newStatus });
      
      // Update local state
      setTrades(prev => prev.map(t => 
        t.id === tradeId ? { ...t, status: newStatus as any } : t
      ));
      
      setSuccess(`Status von "${trade.title}" erfolgreich geändert!`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (error: any) {
      console.error('Fehler beim Ändern des Status:', error);
      setError('Fehler beim Ändern des Status');
    }
  };

  // Schnelle Prioritäts-Änderung
  const handleQuickPriorityChange = async (tradeId: number, newPriority: string) => {
    try {
      const trade = trades.find(t => t.id === tradeId);
      if (!trade) return;

      await updateMilestone(tradeId, { priority: newPriority });
      
      // Update local state
      setTrades(prev => prev.map(t => 
        t.id === tradeId ? { ...t, priority: newPriority } : t
      ));
      
      setSuccess(`Priorität von "${trade.title}" erfolgreich geändert!`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (error: any) {
      console.error('Fehler beim Ändern der Priorität:', error);
      setError('Fehler beim Ändern der Priorität');
    }
  };

  // Öffne Bearbeitungsmodal
  const openEditModal = (trade: Trade) => {
    setEditingTrade(trade);
    setTradeForm({
      title: trade.title,
      description: trade.description || '',
      category: trade.category || 'eigene',
      customCategory: trade.category || '',
      start_date: trade.start_date || trade.planned_date || '',
      end_date: trade.end_date || '',
      notes: trade.notes || '',
      priority: trade.priority as 'low' | 'medium' | 'high' | 'critical',
      is_critical: trade.is_critical
    });
    setShowTradeModal(true);
  };

  const handleDeleteTrade = async (tradeId: number) => {
    if (!window.confirm('Möchten Sie dieses Gewerk wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.')) {
      setDeletingTrade(null);
      return;
    }

    try {
      setDeletingTrade(tradeId);
      // Prüfe ob bereits Angebote angenommen wurden
      const quotes = allTradeQuotes[tradeId] || [];
      const acceptedQuotes = quotes.filter(q => q.status === 'accepted');
      
      if (acceptedQuotes.length > 0) {
        alert('Dieses Gewerk kann nicht gelöscht werden, da bereits Angebote angenommen wurden.');
        setDeletingTrade(null);
        return;
      }

      // Lösche das Gewerk
      await api.delete(`/milestones/${tradeId}`);
      
      setSuccess('Gewerk erfolgreich gelöscht');
      
      // Aktualisiere die lokale Liste
      setTrades(prev => prev.filter(t => t.id !== tradeId));
      
      // Entferne die Angebote aus dem lokalen State
      setAllTradeQuotes(prev => {
        const newQuotes = { ...prev };
        delete newQuotes[tradeId];
        return newQuotes;
      });
      
    } catch (error: any) {
      console.error('❌ Fehler beim Löschen des Gewerks:', error);
      setError('Fehler beim Löschen des Gewerks: ' + (error.response?.data?.detail || error.message));
    } finally {
      setDeletingTrade(null);
    }
  };

  const resetTradeForm = () => {
    setTradeForm({
      title: '',
      description: '',
      category: 'eigene',
      customCategory: '',
      start_date: '',
      end_date: '',
      notes: '',
      priority: 'medium',
      is_critical: false
    });
    setEditingTrade(null);
  };

  // Filtere Gewerke basierend auf Suche und Status
  const filteredTrades = trades.filter(trade => {
    const matchesSearch = trade.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         trade.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (trade.category && trade.category.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = filterStatus === 'all' || trade.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  // Debug-Handler - Erweiterte Version für alle Abhängigkeiten
  const handleDebugDeleteAll = async () => {
    if (!window.confirm('Wirklich ALLE Gewerke samt ALLEN Abhängigkeiten löschen?\n\nDies löscht:\n• Alle Gewerke (Milestones)\n• Alle Angebote (Quotes)\n• Alle Kostenpositionen (Cost Positions)\n• Alle Rechnungen (Invoices)\n• Alle Abnahmen (Acceptances)\n• Alle Bewertungen (Ratings)\n• Alle Termine (Appointments)\n• Alle Dokumente (Documents)\n\n⚠️ WARNUNG: Diese Aktion kann nicht rückgängig gemacht werden!')) return;
    
    try {
      // 1. Lösche alle Rechnungen zuerst (abhängig von Gewerken)
      await api.delete('/invoices/debug/delete-all-invoices');
      
      // 2. Lösche alle Abnahmen (abhängig von Gewerken)
      await api.delete('/acceptance/debug/delete-all-acceptances');
      
      // 3. Lösche alle Bewertungen (abhängig von Gewerken)
      await api.delete('/ratings/debug/delete-all-ratings');
      
      // 4. Lösche alle Termine (abhängig von Gewerken)
      await api.delete('/appointments/debug/delete-all-appointments');
      
      // 5. Lösche alle Dokumente (abhängig von Gewerken)
      await api.delete('/documents/debug/delete-all-documents');
      
      // 6. Lösche alle Kostenpositionen (abhängig von Gewerken)
      await api.delete('/cost-positions/debug/delete-all-cost-positions');
      
      // 7. Lösche alle Angebote (abhängig von Gewerken)
      await api.delete('/quotes/debug/delete-all-quotes');
      
      // 8. Lösche alle Gewerke (Milestones) - zuletzt
      await api.delete('/milestones/debug/delete-all-milestones');
      
      alert('✅ Alle Gewerke samt ALLEN Abhängigkeiten wurden erfolgreich gelöscht!\n\nGelöscht wurden:\n• Alle Gewerke (Milestones)\n• Alle Angebote (Quotes)\n• Alle Kostenpositionen (Cost Positions)\n• Alle Rechnungen (Invoices)\n• Alle Abnahmen (Acceptances)\n• Alle Bewertungen (Ratings)\n• Alle Termine (Appointments)\n• Alle Dokumente (Documents)');
      
      // Seite neu laden
      window.location.reload();
      
    } catch (err: any) {
      console.error('❌ Fehler beim umfassenden Löschen:', err);
      const errorMessage = err.response?.data?.detail || err.message || 'Unbekannter Fehler';
      alert(`❌ Fehler beim Löschen: ${errorMessage}\n\nBitte überprüfen Sie die Backend-Logs für weitere Details.`);
    }
  };

  // Geo-Search Funktionen für Dienstleister
  const getCurrentBrowserLocation = async () => {
    try {
      setGeoLoading(true);
      setGeoError(null);
      
      if (!navigator.geolocation) {
        throw new Error('Geolocation wird von diesem Browser nicht unterstützt');
      }
      
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        });
      });
      
      const location = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude
      };
      
      setCurrentLocation(location);
      } catch (error: any) {
      console.error('❌ Browser-Standort fehlgeschlagen:', error);
      setGeoError(`Standort konnte nicht ermittelt werden: ${error.message}`);
    } finally {
      setGeoLoading(false);
    }
  };

  const useOwnLocation = async () => {
    try {
      setGeoLoading(true);
      setGeoError(null);
      
      // Hole den eigenen Standort aus dem localStorage oder API
      const userLocation = localStorage.getItem('userLocation');
      if (userLocation) {
        const location = JSON.parse(userLocation);
        setCurrentLocation(location);
        setManualAddress(''); // Reset address input when using own location
        } else {
        // Fallback: Verwende Browser-Standort
        await getCurrentBrowserLocation();
      }
    } catch (error: any) {
      console.error('❌ Fehler beim Übernehmen des eigenen Standorts:', error);
      setGeoError(`Eigener Standort konnte nicht übernommen werden: ${error.message}`);
      // Fallback: Verwende Browser-Standort
      await getCurrentBrowserLocation();
    } finally {
      setGeoLoading(false);
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
      
      if (geoSearchMode === 'trades') {
        // Gewerke-Suche für Dienstleister
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
        setGeoProjects([]);
        setGeoServiceProviders([]);
        } else if (geoSearchMode === 'projects') {
        // Projekte-Suche
        const searchRequest: ProjectSearchRequest = {
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
          radius_km: radiusKm,
          project_type: geoProjectType || undefined,
          status: geoProjectStatus || undefined,
          min_budget: geoMinBudget,
          max_budget: geoMaxBudget,
          limit: 100
        };
        
        const projectResults = await searchProjectsInRadius(searchRequest);
        setGeoProjects(projectResults);
        setGeoTrades([]);
        setGeoServiceProviders([]);
        } else {
        // Dienstleister-Suche
        const searchRequest: ServiceProviderSearchRequest = {
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
          radius_km: radiusKm,
          user_type: geoUserType || undefined,
          limit: 100
        };
        
        const providerResults = await searchServiceProvidersInRadius(searchRequest);
        setGeoServiceProviders(providerResults);
        setGeoProjects([]);
        setGeoTrades([]);
        }
    } catch (error: any) {
      console.error('❌ Geo-Suche fehlgeschlagen:', error);
      setGeoError(`Suche fehlgeschlagen: ${error.message}`);
    } finally {
      setGeoLoading(false);
    }
  };

  // Automatische Geo-Suche bei Standortänderung
  useEffect(() => {
    if (currentLocation && showGeoSearch) {
      performGeoSearch();
    }
  }, [currentLocation, radiusKm, geoSearchMode, geoTradeCategory, geoTradeStatus, geoTradePriority, geoMinBudget, geoMaxBudget, geoUserType]);

  // Verbesserte Geo-Suche Funktionen
  const handleManualAddressGeocode = async () => {
    if (!manualAddress.trim()) {
      setGeoError('Bitte geben Sie eine Adresse ein');
      return;
    }

    setIsGeocoding(true);
    try {
      // Parse Adresse (einfache Implementierung)
      const addressParts = manualAddress.split(',').map(part => part.trim());
      if (addressParts.length < 2) {
        throw new Error('Bitte geben Sie eine vollständige Adresse ein (Straße, PLZ Ort)');
      }

      // Demo-Geocoding (in der echten Implementierung würde hier die API aufgerufen)
      const demoLocation = {
        latitude: 52.5200 + (Math.random() - 0.5) * 0.1,
        longitude: 13.4050 + (Math.random() - 0.5) * 0.1
      };
      
      setCurrentLocation(demoLocation);
      setSuccess('Adresse erfolgreich geocodiert');
    } catch (error) {
      console.error('Geocoding-Fehler:', error);
      setGeoError(error instanceof Error ? error.message : 'Geocoding fehlgeschlagen');
    } finally {
      setIsGeocoding(false);
    }
  };

  const handleTradeClick = (trade: any) => {
    // Guard: verhindere Doppelevents/Endlosschleifen
    const now = Date.now();
    if (
      modalGuardRef.current.lastTradeId === trade.id &&
      modalGuardRef.current.timestamp &&
      now - modalGuardRef.current.timestamp < 500
    ) {
      return;
    }
    modalGuardRef.current = { lastTradeId: trade.id, timestamp: now };
    // Debug-Logging hinzufügen
    console.log('🔍 handleTradeClick aufgerufen:', {
      trade: trade,
      tradeId: trade.id,
      quotes: allTradeQuotes[trade.id] || [],
      quotesLength: (allTradeQuotes[trade.id] || []).length,
      userType: user?.user_type
    });

    // Robuste Bauträger-Erkennung (Role oder Type)
    const isBautraegerUser = (user?.user_role?.toUpperCase?.() === 'BAUTRAEGER') || (user?.user_type === 'bautraeger') || (user?.user_type === 'developer');

    // Für Bauträger: Erst Angebotsübersicht (TradeDetailsModal) solange NICHT angenommen; nach Annahme → Kostenvoranschlag-Details
    if (isBautraegerUser) {
      const quotes = allTradeQuotes[trade.id] || [];
      const hasAccepted = quotes.some(q => String(q.status).toLowerCase() === 'accepted');
      
      console.log('🔍 Bauträger Klick Debug:', {
        tradeId: trade.id,
        quotesCount: quotes.length,
        quotesStatus: quotes.map(q => q.status),
        hasAccepted,
        userRole: user?.user_role,
        userType: user?.user_type
      });
      
      // WICHTIG: Bauträger soll IMMER zuerst die Angebotsauswahl sehen (TradeDetailsModal)
      // Nur wenn bereits ein Angebot angenommen wurde, dann CostEstimateDetailsModal
      if (hasAccepted) {
        console.log('📋 (Bauträger) Angenommenes Angebot vorhanden → CostEstimateDetailsModal', { tradeId: trade.id, quotes });
        openExclusiveModal('cost', trade);
      } else {
        console.log('📋 (Bauträger) IMMER ZUERST → TradeDetailsModal (Angebotsauswahl + Besichtigung)', { tradeId: trade.id, quotes });
        openExclusiveModal('trade', trade);
      }
      return;
    }

    // Für Dienstleister: Öffne Trade-Details oder CostEstimateDetailsModal
    const quotes = allTradeQuotes[trade.id] || [];
    if (quotes.length > 0) {
      openExclusiveModal('cost', trade);
    } else {
      openExclusiveModal('trade', trade);
    }
  };

  // Prüfe ob der aktuelle Dienstleister bereits ein Angebot für ein Gewerk abgegeben hat
  const hasServiceProviderQuote = (tradeId: number): boolean => {
    if (!user || user.user_type !== 'service_provider') {
      return false;
    }
    
    const quotes = allTradeQuotes[tradeId] || [];
    return quotes.some(quote => quote.service_provider_id === user.id);
  };

  // Prüfe den Status des Angebots des aktuellen Dienstleisters
  const getServiceProviderQuoteStatus = (tradeId: number): string | null => {
    if (!user || user.user_type !== 'service_provider') {
      return null;
    }
    
    const quotes = allTradeQuotes[tradeId] || [];
    const userQuote = quotes.find(quote => quote.service_provider_id === user.id);
    return userQuote ? userQuote.status : null;
  };

  // Neue Funktion zum Prüfen des Angebots-Status für ein Gewerk
  const getTradeQuoteStatus = (tradeId: number) => {
    const quotes = allTradeQuotes[tradeId] || [];
    const acceptedQuote = quotes.find(quote => quote.status === 'accepted');
    const pendingQuotes = quotes.filter(quote => 
      quote.status === 'submitted' || quote.status === 'under_review'
    );
    const rejectedQuotes = quotes.filter(quote => quote.status === 'rejected');
    
    return {
      hasAcceptedQuote: !!acceptedQuote,
      acceptedQuote,
      pendingQuotes,
      rejectedQuotes,
      totalQuotes: quotes.length
    };
  };

  // Funktion zum Rendern der Angebots-Status-Badges
  const renderQuoteStatusBadge = (tradeId: number) => {
    const quoteStatus = getTradeQuoteStatus(tradeId);
    
    if (quoteStatus.hasAcceptedQuote) {
      return (
        <div className="relative group">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-green-600/30 via-emerald-500/30 to-green-600/30 border border-green-400/40 rounded-full cursor-pointer transform transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-green-500/20">
            <div className="flex items-center gap-1.5">
              <CheckCircle size={12} className="text-green-300" />
              <span className="text-xs font-semibold text-green-200">
                ✓ Angenommen
              </span>
            </div>
          </div>
          
          {/* Tooltip für angenommene Angebote */}
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none z-50">
            <div className="bg-gradient-to-b from-gray-900 to-gray-800 text-white text-xs rounded-xl py-3 px-4 shadow-2xl border border-gray-600/50 backdrop-blur-sm min-w-[280px]">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle size={14} className="text-green-400" />
                <div className="font-bold text-green-300">Angenommenes Angebot</div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Dienstleister:</span>
                  <span className="text-white font-medium">
                    {quoteStatus.acceptedQuote?.company_name || quoteStatus.acceptedQuote?.contact_person || 'Unbekannt'}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Betrag:</span>
                  <span className="text-green-300 font-bold">
                    {formatCurrency(quoteStatus.acceptedQuote?.total_amount || 0)}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Angenommen:</span>
                  <span className="text-white">
                    {formatDate(quoteStatus.acceptedQuote?.accepted_at || quoteStatus.acceptedQuote?.created_at || '')}
                  </span>
                </div>
              </div>
              
              {/* Pfeil */}
              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full">
                <div className="w-0 h-0 border-l-6 border-r-6 border-t-6 border-l-transparent border-r-transparent border-t-gray-900"></div>
              </div>
            </div>
          </div>
        </div>
      );
    }
    
    if (quoteStatus.pendingQuotes.length > 0) {
      return (
        <div className="relative group">
          <div className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-500/20 border border-blue-500/30 rounded-full hover:bg-blue-500/30 transition-colors">
            <Clock size={12} className="text-blue-400" />
            <span className="text-xs text-blue-300 font-medium">
              {quoteStatus.pendingQuotes.length} offen
            </span>
          </div>
          
          {/* Tooltip für offene Angebote */}
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none z-50">
            <div className="bg-gradient-to-b from-gray-900 to-gray-800 text-white text-xs rounded-xl py-3 px-4 shadow-2xl border border-gray-600/50 backdrop-blur-sm min-w-[200px]">
              <div className="flex items-center gap-2 mb-2">
                <Clock size={14} className="text-blue-400" />
                <div className="font-bold text-blue-300">Offene Angebote</div>
              </div>
              
              <div className="space-y-1">
                {quoteStatus.pendingQuotes.slice(0, 3).map((quote, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <span className="text-gray-300 text-xs">
                      {quote.company_name || quote.contact_person || 'Unbekannt'}
                    </span>
                                       <span className="text-blue-300 text-xs font-medium">
                     {formatCurrency(quote.total_amount)}
                   </span>
                  </div>
                ))}
                {quoteStatus.pendingQuotes.length > 3 && (
                  <div className="text-gray-400 text-xs">
                    +{quoteStatus.pendingQuotes.length - 3} weitere...
                  </div>
                )}
              </div>
              
              {/* Pfeil */}
              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full">
                <div className="w-0 h-0 border-l-6 border-r-6 border-t-6 border-l-transparent border-r-transparent border-t-gray-900"></div>
              </div>
            </div>
          </div>
        </div>
      );
    }
    
    if (quoteStatus.totalQuotes === 0) {
      return (
        <div className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-500/20 border border-gray-500/30 rounded-full">
          <span className="text-xs text-gray-300 font-medium">
            Kein Angebot
          </span>
        </div>
      );
    }
    
    return null;
  };

  // Kombinierte Gewerke-Liste (lokale + Geo-Gewerke)
  const getCombinedTrades = (): CombinedTrade[] => {
    // Für Dienstleister: Nur Geo-Gewerke
    if (isServiceProviderUser) {
      const geoTradeResults: CombinedTrade[] = geoTrades.map(geoTrade => ({
        id: geoTrade.id,
        project_id: geoTrade.project_id,
        title: geoTrade.title,
        description: geoTrade.description || '',
        status: geoTrade.status as any,
        priority: geoTrade.priority,
        progress_percentage: geoTrade.progress_percentage,
        planned_date: geoTrade.planned_date,
        start_date: geoTrade.start_date,
        end_date: geoTrade.end_date,
        actual_date: geoTrade.end_date,
        category: geoTrade.category,
        budget: geoTrade.budget,
        actual_costs: undefined,
        contractor: geoTrade.contractor,
        is_critical: false,
        notify_on_completion: false,
        notes: '',
        created_at: geoTrade.created_at || new Date().toISOString(),
        updated_at: geoTrade.created_at || new Date().toISOString(),
        completed_at: undefined,
        // Phase-Feld hinzufügen (erforderlich für CombinedTrade)
        phase: 'cost_estimate' as any,
        // Geo-spezifische Felder
        isGeoResult: true,
        distance_km: geoTrade.distance_km,
        project_name: geoTrade.project_name,
        project_type: geoTrade.project_type,
        project_status: geoTrade.project_status,
        project_address: geoTrade.project_address,
        address_street: geoTrade.address_street,
        address_zip: geoTrade.address_zip,
        address_city: geoTrade.address_city,
        // Koordinaten für Karten-Anzeige hinzufügen
        address_latitude: geoTrade.address_latitude,
        address_longitude: geoTrade.address_longitude
      }));

      return geoTradeResults;
    }
    
    // Für Bauträger: Lokale Gewerke mit Projekt-Koordinaten
    const localTrades: CombinedTrade[] = filteredTrades.map(trade => {
      // Finde das zugehörige Projekt für Koordinaten
      const project = projects.find(p => p.id === trade.project_id);
      
      return {
        ...trade,
        isGeoResult: false,
        // Projekt-Koordinaten für Karten-Anzeige hinzufügen
        address_latitude: project?.address_latitude,
        address_longitude: project?.address_longitude,
        // Projekt-Adressdaten für Anzeige
        project_name: project?.name,
        project_address: project?.address,
        address_street: project?.address_street,
        address_zip: project?.address_zip,
        address_city: project?.address_city
      };
    });

    return localTrades;
  };

  const combinedTrades = getCombinedTrades();

  if (isLoadingTrades) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#ffbd59] mx-auto mb-4"></div>
          <p className="text-white">Lade Ausschreibungen...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#51646f] via-[#3d4952] to-[#2c3539] flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="bg-red-500/20 border border-red-500/30 rounded-2xl p-6 mb-6">
            <h2 className="text-xl font-bold text-red-300 mb-4">Fehler beim Laden</h2>
            <p className="text-red-200 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
            >
              Seite neu laden
            </button>
          </div>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-2 bg-[#ffbd59] text-[#3d4952] rounded-lg font-semibold hover:bg-[#ffa726] transition"
          >
            Zurück zum Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460] p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              {isServiceProviderUser ? 'Kostenvoranschläge' : 'Ausschreibungen'}
            </h1>
            <p className="text-gray-300">
              {isServiceProviderUser 
                ? 'Verwalten Sie Ihre Kostenvoranschläge für verschiedene Ausschreibungen'
                : 'Erstellen und verwalten Sie Ausschreibungen für Ihr Bauprojekt'
              }
            </p>
          </div>
          
          {!isServiceProviderUser && (
            <div className="flex items-center gap-4">
              {(() => {
                const subscriptionPlan = user?.subscription_plan || 'basis';
                const userRole = user?.user_role;
                const currentTradeCount = trades.filter(trade => trade.project_id === selectedProject?.id).length;
                const isLimitReached = userRole === 'bautraeger' && subscriptionPlan === 'basis' && currentTradeCount >= 3;
                
                return (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleCreateTrade}
                      disabled={isLimitReached}
                      className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-colors ${
                        isLimitReached 
                          ? 'bg-gray-500 text-gray-300 cursor-not-allowed' 
                          : 'bg-[#ffbd59] text-[#2c3539] hover:bg-[#ffa726]'
                      }`}
                    >
                      <Plus size={20} />
                      Ausschreibung erstellen
                    </button>
                    
                    {userRole === 'bautraeger' && subscriptionPlan === 'basis' && (
                      <div className="text-sm text-gray-300">
                        <span className={currentTradeCount >= 3 ? 'text-red-400' : 'text-gray-300'}>
                          {currentTradeCount}/3 Ausschreibungen
                        </span>
                        {currentTradeCount >= 3 && (
                          <span className="ml-2 text-[#ffbd59] font-medium">
                            • Pro-Version für mehr
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          )}


        </div>

        {/* Debug-Button nur im Entwicklungsmodus */}
        {import.meta.env.DEV && (
          <button
            onClick={handleDebugDeleteAll}
            className="mb-8 px-6 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition shadow-lg border-2 border-red-800"
          >
            Debug: Alle Ausschreibungen, Angebote & Kostenpositionen löschen
          </button>
        )}

        {/* Error Banner */}
        {error && (
          <div className="bg-red-500/20 border border-red-500/30 text-red-300 px-6 py-4 flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <AlertTriangle size={20} />
              <span>{error}</span>
            </div>
            <button onClick={() => setError('')} className="text-red-300 hover:text-red-100">
              <XCircle size={20} />
            </button>
          </div>
        )}

        {/* Success Banner */}
        {success && (
          <div className="bg-green-500/20 border border-green-500/30 text-green-300 px-6 py-4 flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <CheckCircle size={20} />
              <span>{success}</span>
            </div>
            <button onClick={() => setSuccess('')} className="text-green-300 hover:text-green-100">
              <XCircle size={20} />
            </button>
          </div>
        )}

        {/* Debug Info */}
        <div className="bg-yellow-500/20 border border-yellow-500/30 text-yellow-300 px-6 py-4 mb-6 rounded-lg">
          <h3 className="font-bold mb-2">Debug Info:</h3>
          <p>Loading: {isLoadingTrades.toString()}</p>
          <p>Trades Count: {trades.length}</p>
          <p>FilteredTrades Count: {filteredTrades.length}</p>
          <p>CombinedTrades Count: {combinedTrades.length}</p>
          <p>GeoTrades Count: {geoTrades.length}</p>
          <p>Error: {error || 'Kein Fehler'}</p>
          <p>Current URL: {window.location.href}</p>
        </div>



        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl">
                <Handshake size={24} className="text-white" />
              </div>
              <span className="text-sm text-gray-400">Gesamt</span>
            </div>
            <h3 className="text-2xl font-bold text-white mb-1">{combinedTrades.length}</h3>
            <p className="text-sm text-gray-400">Ausschreibungen</p>
          </div>

          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl">
                <Eye size={24} className="text-white" />
              </div>
              <span className="text-sm text-gray-400">Aktive Ausschreibungen</span>
            </div>
            <h3 className="text-2xl font-bold text-white mb-1">
              {activeCount}
            </h3>
            <p className="text-sm text-gray-400">Anzahl aktiver Ausschreibungen</p>
          </div>

          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-red-400 to-red-600 rounded-xl">
                <AlertTriangle size={24} className="text-white" />
              </div>
              <span className="text-sm text-gray-400">Ohne Angebote</span>
            </div>
            <h3 className="text-2xl font-bold text-white mb-1">
              {tradesWithoutQuotes}
            </h3>
            <p className="text-sm text-gray-400">Ausschreibungen ohne Angebote</p>
          </div>

          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-orange-400 to-orange-600 rounded-xl">
                <Clock size={24} className="text-white" />
              </div>
              <span className="text-sm text-gray-400">Ausstehend</span>
            </div>
            <h3 className="text-2xl font-bold text-white mb-1">
              {tradesWithPendingQuotes}
            </h3>
            <p className="text-sm text-gray-400">Ausschreibungen mit ausstehenden Angeboten</p>
          </div>
        </div>

        {/* Verbesserte Geo-Suche für Dienstleister - unterhalb der Kacheln */}
        {isServiceProviderUser && showGeoSearch && (
          <div className="mb-6 bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20">
            {/* Haupt-Header */}
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
              
              {/* Tab-Buttons */}
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
              {/* Adresseingabe */}
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Adresse eingeben (z.B. Musterstraße 1, 10115 Berlin)"
                  value={manualAddress}
                  onChange={(e) => setManualAddress(e.target.value)}
                  className="w-full px-3 py-2 bg-white/10 text-white rounded-lg text-sm border border-white/20 focus:outline-none focus:border-[#ffbd59] placeholder-white/50"
                />
              </div>
              
              {/* Geocoding-Button */}
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
              
              {/* Eigenen Standort Button */}
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
            <div className="flex items-center gap-4 mb-4">
              {/* Radius-Slider mit sichtbarer Anzeige */}
              <div className="flex items-center gap-3">
                <span className="text-white text-sm font-medium">Suchradius:</span>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="1"
                    max="50"
                    value={radiusKm}
                    onChange={(e) => setRadiusKm(parseInt(e.target.value))}
                    className="w-32 h-2 bg-[#ffbd59]/30 rounded-lg appearance-none cursor-pointer slider"
                  />
                  <span className="text-[#ffbd59] text-sm font-bold min-w-[3rem]">{radiusKm} km</span>
                </div>
              </div>
              
              {/* Filter */}
              <div className="flex items-center gap-2">
                <select
                  value={geoTradeCategory || ''}
                  onChange={(e) => setGeoTradeCategory(e.target.value)}
                  className="px-3 py-1.5 bg-white/10 text-white rounded-lg text-sm border border-white/20 focus:outline-none focus:border-[#ffbd59]"
                >
                  <option value="">Alle Kategorien</option>
                  {TRADE_CATEGORIES.map(category => (
                    <option key={category.value} value={category.value}>
                      {category.label}
                    </option>
                  ))}
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
              
              {/* Budget-Filter */}
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
              
              {/* Such-Button */}
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
            
            {/* Toggle für angenommene Gewerke */}
            <div className="flex items-center gap-3 mb-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showAcceptedTrades}
                  onChange={(e) => setShowAcceptedTrades(e.target.checked)}
                  className="w-4 h-4 text-[#ffbd59] bg-white/10 border-white/20 rounded focus:ring-[#ffbd59] focus:ring-2"
                />
                <span className="text-white text-sm">Angenommene Ausschreibungen anzeigen</span>
              </label>
            </div>
            
            {/* Ergebnisse-Anzeige */}
            {geoTrades.length > 0 && (
              <div className="text-white text-sm">
                <span className="text-[#ffbd59] font-bold">{geoTrades.length}</span> Ausschreibungen im Radius von <span className="text-[#ffbd59] font-bold">{radiusKm}km</span> gefunden
              </div>
            )}
          </div>
        )}

        {/* Search and Filter */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Ausschreibungen durchsuchen..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent"
            />
          </div>
          
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="pl-10 pr-8 py-3 bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent appearance-none cursor-pointer"
            >
              <option value="all">Alle Status</option>
              <option value="planned">Geplant</option>
              <option value="in_progress">Aktiv</option>
              <option value="completed">Abgeschlossen</option>
              <option value="delayed">Verzögert</option>
              <option value="cancelled">Abgebrochen</option>
            </select>
          </div>
        </div>

        {/* Gewerke Anzeige basierend auf Tab */}
        {activeTab === 'list' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {combinedTrades.map((trade) => (
            <div 
              key={`${trade.isGeoResult ? 'geo' : 'local'}-${trade.id}`} 
              className={`group bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-300 transform hover:-translate-y-2 hover:shadow-2xl cursor-pointer ${
                trade.isGeoResult ? 'border-[#ffbd59]/50' : ''
              } ${
                getTradeQuoteStatus(trade.id).hasAcceptedQuote 
                  ? 'border-2 border-green-500/40 bg-gradient-to-r from-green-500/5 to-emerald-500/5 shadow-lg shadow-green-500/10' 
                  : ''
              }`}
              onClick={() => handleTradeClick(trade)}
            >
              {/* Geo-Badge für Geo-Ergebnisse */}
              {trade.isGeoResult && (
                <div className="flex items-center gap-2 mb-3">
                  <MapPin size={16} className="text-[#ffbd59]" />
                  <span className="text-[#ffbd59] text-sm font-medium">
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
                    {/* Projekt-Info für Geo-Gewerke */}
                    {trade.isGeoResult && trade.project_name && (
                      <p className="text-gray-400 text-xs mt-1">
                        📁 {trade.project_name} ({trade.project_type})
                      </p>
                    )}
                    {/* Adresse für Geo-Gewerke */}
                    {trade.isGeoResult && trade.address_street && (
                      <p className="text-gray-400 text-xs">
                        📍 {trade.address_street}, {trade.address_zip} {trade.address_city}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(trade.status)}`}>
                    {getStatusLabel(trade.status)}
                  </span>
                  {trade.is_critical && (
                    <span className="px-2 py-1 bg-red-500 text-white rounded-full text-xs font-medium">
                      Kritisch
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-gray-400 text-sm">Fortschritt</p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-[#ffbd59] to-[#ffa726] h-2 rounded-full transition-all duration-300"
                        style={{ width: `${trade.progress_percentage}%` }}
                      ></div>
                    </div>
                    <span className="text-white text-sm font-medium">{trade.progress_percentage}%</span>
                  </div>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Priorität</p>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(trade.priority)}`}>
                    {getPriorityLabel(trade.priority)}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm text-gray-300">
                <div className="flex items-center gap-4">
                  <span>📅 {formatDate(trade.planned_date)}</span>
                  {trade.budget && (
                    <span>💰 {formatCurrency(trade.budget)}</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {/* Angebots-Status-Badge */}
                  {renderQuoteStatusBadge(trade.id)}
                  
                  {/* Anzahl der Angebote */}
                  <span className="text-[#ffbd59]">
                    {allTradeQuotes[trade.id]?.length || 0} Angebote
                  </span>
                  
                  {/* Erweiterte Anzeige für angenommene Angebote */}
                  {getTradeQuoteStatus(trade.id).hasAcceptedQuote && (
                    <div className="flex items-center gap-1 text-xs text-green-300">
                      <span>•</span>
                      <span>{formatCurrency(getTradeQuoteStatus(trade.id).acceptedQuote?.total_amount || 0)}</span>
                    </div>
                  )}
                </div>
              </div>

              {isServiceProviderUser && (
                <div className="mt-4 pt-4 border-t border-white/10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-400">Status:</span>
                      <span className={`text-sm font-medium ${getStatusColor(trade.status)}`}>
                        {getStatusLabel(trade.status)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {/* Angebot-Status für Dienstleister */}
                      {hasServiceProviderQuote(trade.id) ? (
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-400">Ihr Angebot:</span>
                          <span className={`text-sm font-medium ${getQuoteStatusColor(getServiceProviderQuoteStatus(trade.id) || '')}`}>
                            {getQuoteStatusLabel(getServiceProviderQuoteStatus(trade.id) || '')}
                          </span>
                        </div>
                      ) : (
                        /* Angebot abgeben Button für Dienstleister */
                        <button
                          onClick={(e) => {
                            e.stopPropagation(); // Verhindert das Öffnen des Modals
                            openCostEstimateModal(trade);
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
              )}
            </div>
          ))}
        </div>
        ) : (
          /* Karten-Ansicht */
          <div className="h-[700px] bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 p-4">
            {currentLocation ? (
                          <TradeMap
              trades={combinedTrades as any}
              currentLocation={currentLocation}
              radiusKm={radiusKm}
              onTradeClick={handleTradeClick}
            />
            ) : (
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <MapPin size={48} className="text-[#ffbd59] mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-white mb-2">Karte nicht verfügbar</h3>
                  <p className="text-gray-300">Bitte wählen Sie einen Standort aus, um die Kartenansicht zu aktivieren.</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* No Results */}
        {combinedTrades.length === 0 && !isLoadingTrades && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🏗️</div>
            <h3 className="text-xl font-semibold text-white mb-2">Keine Ausschreibungen gefunden</h3>
            <p className="text-gray-300">
              {isServiceProviderUser 
                ? 'Es sind aktuell keine ausgeschriebenen Ausschreibungen verfügbar.'
                : 'Erstellen Sie Ihre erste Ausschreibung für dieses Projekt.'
              }
            </p>
          </div>
        )}

        {/* Loading State */}
        {isLoadingTrades && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#ffbd59] mx-auto mb-4"></div>
            <p className="text-white">Lade Ausschreibungen...</p>
          </div>
        )}

        {/* Modals */}
        {showTradeCreationForm && selectedProject && (
          <TradeCreationForm
            isOpen={showTradeCreationForm}
            onClose={() => setShowTradeCreationForm(false)}
            onSubmit={handleCreateTradeWithForm}
            projectId={selectedProject.id}
          />
        )}

        {showCostEstimateForm && selectedTradeForCostEstimate && (
          <CostEstimateForm
            isOpen={showCostEstimateForm}
            onClose={() => setShowCostEstimateForm(false)}
            onSubmit={handleCostEstimateSubmit}
            trade={selectedTradeForCostEstimate}
            project={selectedProject}
          />
        )}

        {showTradeDetailsModal && !showCostEstimateDetailsModal && selectedTradeForDetails && (
          <>
            {console.log('🔍 TradeDetailsModal wird gerendert:', {
              showTradeDetailsModal,
              selectedTradeForDetails,
              tradeId: selectedTradeForDetails?.id,
              existingQuotes: allTradeQuotes[selectedTradeForDetails?.id] || []
            })}
            <TradeDetailsModal
              isOpen={showTradeDetailsModal}
              onClose={() => setShowTradeDetailsModal(false)}
              trade={selectedTradeForDetails as any}
              existingQuotes={allTradeQuotes[selectedTradeForDetails.id] || []}
              onCreateQuote={(trade) => {
                setSelectedTradeForCostEstimate(trade as any);
                setShowCostEstimateForm(true);
              }}
              onCreateInspection={handleCreateInspection}
            />
          </>
        )}

        {/* TEMPORÄR DEAKTIVIERT - Modal wird nur in Dashboard.tsx gerendert */}
        {false && showCostEstimateDetailsModal && !showTradeDetailsModal && selectedTradeForCostEstimateDetails && (
          <CostEstimateDetailsModal
            isOpen={showCostEstimateDetailsModal}
            onClose={() => setShowCostEstimateDetailsModal(false)}
            trade={selectedTradeForCostEstimateDetails}
            quotes={selectedTradeForCostEstimateDetails && selectedTradeForCostEstimateDetails.id ? allTradeQuotes[selectedTradeForCostEstimateDetails.id] || [] : []}
            project={selectedProject}
            onAcceptQuote={handleAcceptQuote}
            onRejectQuote={handleRejectQuote}
            onResetQuote={handleResetQuote}
            onCreateInspection={handleCreateInspection}
            onTradeUpdate={(updatedTrade) => {
              // Update das selectedTradeForCostEstimateDetails
              setSelectedTradeForCostEstimateDetails(updatedTrade);
              // Update auch die trades Liste
              setTrades(prevTrades => 
                prevTrades.map(trade => 
                  trade.id === updatedTrade.id ? updatedTrade : trade
                )
              );
              // Keine sofortigen Reloads hier, um Flackern/Loops zu verhindern
            }}
            inspectionStatus={selectedTradeForCostEstimateDetails && selectedTradeForCostEstimateDetails.id ? tradeInspectionStatus[selectedTradeForCostEstimateDetails.id] : undefined}
          />
        )}

        {showOrderConfirmationGenerator && selectedTradeForOrderConfirmation && (
          <OrderConfirmationGenerator
            data={{
              project: selectedProject,
              trade: selectedTradeForOrderConfirmation,
              quote: selectedQuoteForOrderConfirmation,
              user: user
            }}
            onGenerate={handleGenerateOrderConfirmation}
            onClose={handleCloseOrderConfirmationGenerator}
          />
        )}

        {/* Upgrade Modal für Gewerke-Limit */}
        <UpgradeModal 
          isOpen={showUpgradeModal}
          onClose={() => setShowUpgradeModal(false)}
          onUpgrade={handleUpgrade}
        />

        {/* Besichtigungs-Erstellungs-Modal */}
        {showCreateInspectionModal && selectedTradeForInspection && (
          <CreateInspectionModal
            isOpen={showCreateInspectionModal}
            onClose={() => {
              setShowCreateInspectionModal(false);
              setSelectedTradeForInspection(null);
              setSelectedQuotesForInspection([]);
            }}
            trade={selectedTradeForInspection}
            selectedQuotes={selectedQuotesForInspection}
            project={selectedProject}
            onCreateInspection={handleInspectionCreated}
          />
        )}
      </div>
    </div>
  );
}

function getStatusLabel(status: string) {
  switch (status) {
    case 'planned':
    case 'geplant':
      return 'Geplant';
    case 'in_progress':
    case 'aktiv':
      return 'Aktiv';
    case 'completed':
    case 'abgeschlossen':
      return 'Abgeschlossen';
    case 'delayed':
    case 'verzögert':
      return 'Verzögert';
    case 'cancelled':
    case 'abgebrochen':
      return 'Abgebrochen';
    default:
      return status;
  }
}

function getStatusColor(status: string) {
  switch (status) {
    case 'planned':
    case 'geplant':
      return '#6366f1';
    case 'in_progress':
    case 'aktiv':
      return '#22d3ee';
    case 'completed':
    case 'abgeschlossen':
      return '#22c55e';
    case 'delayed':
    case 'verzögert':
      return '#f59e42';
    case 'cancelled':
    case 'abgebrochen':
      return '#ef4444';
    default:
      return '#64748b';
  }
}

function getPriorityLabel(priority: string) {
  switch (priority) {
    case 'low':
    case 'niedrig':
      return 'Niedrig';
    case 'medium':
    case 'mittel':
      return 'Mittel';
    case 'high':
    case 'hoch':
      return 'Hoch';
    case 'critical':
    case 'kritisch':
      return 'Kritisch';
    default:
      return priority;
  }
}

function getPriorityColor(priority: string) {
  switch (priority) {
    case 'low':
    case 'niedrig':
      return 'text-blue-400 border-blue-400/30';
    case 'medium':
    case 'mittel':
      return 'text-yellow-400 border-yellow-400/30';
    case 'high':
    case 'hoch':
      return 'text-red-400 border-red-400/30';
    case 'critical':
    case 'kritisch':
      return 'text-purple-400 border-purple-400/30';
    default:
      return 'text-gray-400 border-gray-400/30';
  }
}

function getCategoryLabel(category: string) {
  switch (category) {
    case 'fundament':
      return 'Fundament';
    case 'rohbau':
      return 'Rohbau';
    case 'dach':
      return 'Dach';
    case 'elektro':
      return 'Elektro';
    case 'sanitaer':
      return 'Sanitär';
    case 'heizung':
      return 'Heizung';
    case 'fenster':
      return 'Fenster & Türen';
    case 'innenausbau':
      return 'Innenausbau';
    case 'aussenanlagen':
      return 'Außenanlagen';
    case 'eigene':
      return 'Eigene';
    default:
      return category || 'Nicht kategorisiert';
  }
}

function getCategoryIcon(category: string) {
  switch (category) {
    case 'fundament':
      return <Building size={16} />;
    case 'rohbau':
      return <Building size={16} />;
    case 'dach':
      return <Building size={16} />;
    case 'elektro':
      return <Zap size={16} />;
    case 'sanitaer':
      return <Droplets size={16} />;
    case 'heizung':
      return <Thermometer size={16} />;
    case 'ausbau':
      return <Hammer size={16} />;
    case 'fassade':
      return <Building size={16} />;
    case 'garten':
      return <TreePine size={16} />;
    case 'strasse':
      return <Target size={16} />;
    default:
      return <Building size={16} />;
  }
}

function getQuoteStatusLabel(status: string) {
  switch (status) {
    case 'draft': return 'Entwurf';
    case 'submitted': return 'Eingereicht';
    case 'under_review': return 'In Prüfung';
    case 'accepted': return 'Akzeptiert';
    case 'rejected': return 'Abgelehnt';
    case 'expired': return 'Abgelaufen';
    default: return status;
  }
}

function getQuoteStatusColor(status: string) {
  switch (status) {
    case 'draft': return 'bg-gray-100 text-gray-800';
    case 'submitted': return 'bg-blue-100 text-blue-800';
    case 'under_review': return 'bg-yellow-100 text-yellow-800';
    case 'accepted': return 'bg-green-100 text-green-800';
    case 'rejected': return 'bg-red-100 text-red-800';
    case 'expired': return 'bg-gray-100 text-gray-600';
    default: return 'bg-gray-100 text-gray-800';
  }
}

function getRiskColor(riskScore: number) {
  if (riskScore <= 15) return 'text-green-600';
  if (riskScore <= 25) return 'text-yellow-600';
  return 'text-red-600';
}

function getPriceDeviationColor(deviation: number) {
  if (deviation < -10) return 'text-green-600';
  if (deviation < 10) return 'text-yellow-600';
  return 'text-red-600';
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR'
  }).format(amount);
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('de-DE');
}
