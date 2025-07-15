import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useProject } from '../context/ProjectContext';
import { getMilestones, createMilestone, updateMilestone, getAllMilestones, deleteMilestone } from '../api/milestoneService';
import { getProjects } from '../api/projectService';

import { getQuotesForMilestone, createMockQuotesForMilestone, acceptQuote, resetQuote, createQuote, updateQuote, deleteQuote, submitQuote, rejectQuote, withdrawQuote } from '../api/quoteService';
import { uploadDocument } from '../api/documentService';
import api from '../api/api';
import TradeCreationForm from '../components/TradeCreationForm';
import CostEstimateForm from '../components/CostEstimateForm';
import TradeDetailsModal from '../components/TradeDetailsModal';
import CostEstimateDetailsModal from '../components/CostEstimateDetailsModal';
import OrderConfirmationGenerator from '../components/OrderConfirmationGenerator';
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
  Calculator
} from 'lucide-react';

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
}

// Interface für Gewerke
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

export default function Trades() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isServiceProvider } = useAuth();
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
  const [selectedProject, setSelectedProject] = useState<number | null>(null);
  
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
  const [showCostEstimateForm, setShowCostEstimateForm] = useState(false);
  const [selectedTradeForEstimate, setSelectedTradeForEstimate] = useState<Trade | null>(null);

  // State für TradeDetailsModal
  const [showTradeDetailsModal, setShowTradeDetailsModal] = useState(false);
  const [selectedTradeForDetails, setSelectedTradeForDetails] = useState<Trade | null>(null);

  // State für CostEstimateDetailsModal (Bauträger-Ansicht)
  const [showCostEstimateDetailsModal, setShowCostEstimateDetailsModal] = useState(false);
  const [selectedTradeForCostEstimateDetails, setSelectedTradeForCostEstimateDetails] = useState<Trade | null>(null);

  // State für Auftragsbestätigung
  const [showOrderConfirmationGenerator, setShowOrderConfirmationGenerator] = useState(false);
  const [orderConfirmationData, setOrderConfirmationData] = useState<any>(null);

  // Handler für Auftragsbestätigung-Generierung
  const handleGenerateOrderConfirmation = async (documentData: any) => {
    try {
      console.log('📋 Erstelle Auftragsbestätigung-Dokument:', documentData);
      
      // Erstelle FormData für Dokument-Upload
      const formData = new FormData();
      
      // Erstelle Blob aus dem Dokument-Inhalt
      const contentBlob = new Blob([documentData.content], { type: 'text/plain' });
      const contentFile = new File([contentBlob], 'auftragsbestätigung.txt', { type: 'text/plain' });
      
      formData.append('file', contentFile);
      formData.append('project_id', documentData.project_id.toString());
      formData.append('title', documentData.title);
      formData.append('description', documentData.description);
      formData.append('document_type', documentData.document_type);
      formData.append('category', documentData.category);
      formData.append('tags', documentData.tags);
      formData.append('is_public', documentData.is_public.toString());
      
      // Upload Dokument
      const uploadedDocument = await uploadDocument(formData);
      console.log('✅ Auftragsbestätigung erfolgreich erstellt:', uploadedDocument);
      
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
        console.log('👷 Service provider detected, loading all milestones...');
        tradesData = await getAllMilestones();
        console.log('✅ Service provider milestones loaded:', tradesData);
      } else {
        // Bauträger: Trades projektbasiert laden (wie bisher)
        console.log('🏗️ Professional detected, loading project-based milestones...');
        if (selectedProject) {
          console.log('📋 Loading milestones for project:', selectedProject);
          tradesData = await getMilestones(selectedProject);
          console.log('✅ Project milestones loaded:', tradesData);
        } else {
          console.log('⚠️ No selected project, skipping milestone load');
          setTrades([]);
          setIsLoadingTrades(false);
          return;
        }
      }
      console.log('📊 Setting trades state with:', tradesData);
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
      console.log(`🔍 Loading quotes for trade ${tradeId}...`);
      const data = await getQuotesForMilestone(tradeId);
      console.log(`📊 Found ${data.length} quotes for trade ${tradeId}:`, data);
        setTradeQuotes(data);
    } catch (err: any) {
      console.error('Error loading quotes:', err);
          setTradeQuotes([]);
    }
  };

  // Lade Angebote für alle Gewerke
  const loadAllTradeQuotes = async (tradesData: Trade[]) => {
    try {
      console.log('🔍 Loading quotes for all trades...');
      const quotesMap: { [tradeId: number]: Quote[] } = {};
      const quotePromises = tradesData.map(async (trade) => {
        try {
          const quotes = await getQuotesForMilestone(trade.id);
          console.log(`📊 Found ${quotes.length} quotes for trade ${trade.id}`);
            quotesMap[trade.id] = quotes;
        } catch (e: any) {
          console.error('❌ Error loading quotes for trade:', trade.id, e);
              quotesMap[trade.id] = [];
        }
      });
      await Promise.all(quotePromises);
      console.log('✅ All trade quotes loaded:', quotesMap);
      setAllTradeQuotes(quotesMap);
    } catch (e: any) {
      console.error('❌ Error loading all trade quotes:', e);
      setAllTradeQuotes({});
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
      console.log('🔧 Accepting quote with ID:', quoteId);
      // Prüfe ob Token vorhanden ist
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Nicht angemeldet. Bitte melden Sie sich erneut an.');
        return;
      }
      console.log('🔐 Token vorhanden, sende Anfrage...');
      await acceptQuote(quoteId);
      console.log('✅ Kostenvoranschlag erfolgreich akzeptiert');
      
      // Finde das angenommene Angebot und das zugehörige Gewerk
      const acceptedQuote = allTradeQuotes[selectedTradeForCostEstimateDetails?.id || 0]?.find(q => q.id === quoteId);
      if (acceptedQuote && selectedTradeForCostEstimateDetails && currentProject) {
        console.log('📋 Erstelle Auftragsbestätigung für:', {
          project: currentProject,
          trade: selectedTradeForCostEstimateDetails,
          quote: acceptedQuote,
          user: user
        });
        
        // Setze Daten für Auftragsbestätigung
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
        console.log('🔄 Lade Angebote neu...');
        await loadTradeQuotes(selectedTrade.id);
      }
      // Lade alle Gewerke neu, um die Details in den Kacheln zu aktualisieren
      console.log('🔄 Lade alle Gewerke neu...');
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
      console.log('🔧 Resetting quote with ID:', quoteId);
      // Prüfe ob Token vorhanden ist
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Nicht angemeldet. Bitte melden Sie sich erneut an.');
        return;
      }
      
      console.log('🔄 Setze Angebot zurück auf "submitted"...');
      
      // Rufe die Reset-API auf
      await resetQuote(quoteId);
      
      console.log('✅ Angebot erfolgreich zurückgesetzt');
      
      // Lade die Angebote neu, um den Status zu aktualisieren
      if (selectedTrade) {
        console.log('🔄 Lade Angebote neu...');
        await loadTradeQuotes(selectedTrade.id);
      }
      
      // Lade alle Gewerke neu, um die Details in den Kacheln zu aktualisieren
      console.log('🔄 Lade alle Gewerke neu...');
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
      
      console.log('📤 Sending offer data:', quoteData);
      
      const res = await createQuote(quoteData);
      console.log('✅ Offer submitted successfully:', res);
      
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
      console.log('🔧 Rejecting quote with ID:', quoteId, 'Reason:', reason);
      // Prüfe ob Token vorhanden ist
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Nicht angemeldet. Bitte melden Sie sich erneut an.');
        return;
      }
      console.log('🔐 Token vorhanden, sende Anfrage...');
      await rejectQuote(quoteId, reason);
      console.log('✅ Angebot erfolgreich abgelehnt');
      // Lade die Angebote neu, um den Status zu aktualisieren
      if (selectedTrade) {
        console.log('🔄 Lade Angebote neu...');
        await loadTradeQuotes(selectedTrade.id);
      }
      // Lade alle Gewerke neu, um die Details in den Kacheln zu aktualisieren
      console.log('🔄 Lade alle Gewerke neu...');
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
      console.log('🔧 Withdrawing quote with ID:', quoteId);
      // Prüfe ob Token vorhanden ist
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Nicht angemeldet. Bitte melden Sie sich erneut an.');
        return;
      }
      console.log('🔐 Token vorhanden, sende Anfrage...');
      await withdrawQuote(quoteId);
      console.log('✅ Angebot erfolgreich zurückgezogen');
      // Lade die Angebote neu, um den Status zu aktualisieren
      if (selectedTrade) {
        console.log('🔄 Lade Angebote neu...');
        await loadTradeQuotes(selectedTrade.id);
      }
      // Lade alle Gewerke neu, um die Details in den Kacheln zu aktualisieren
      console.log('🔄 Lade alle Gewerke neu...');
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
        console.log('🔄 Loading projects...');
        const projects = await getProjects();
        console.log('📋 Projects loaded:', projects);
        setProjects(projects);
        
        // Für Bauträger: Verwende das aktuell ausgewählte Projekt
        if (!isServiceProviderUser && currentProject) {
          console.log('🔧 Using current project from context:', currentProject.id);
          setSelectedProject(currentProject.id);
        } else if (isServiceProviderUser && projects.length > 0 && !selectedProject) {
          console.log('🔧 Setting selectedProject to first project:', projects[0].id);
          setSelectedProject(projects[0].id);
        } else if (projects.length === 0) {
          console.log('⚠️ No projects found');
        } else {
          console.log('ℹ️ selectedProject already set or no projects available');
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

  // Neue Funktion für TradeCreationForm
  const handleCreateTradeWithForm = async (tradeData: any) => {
    try {
      console.log('🔧 Erstelle Gewerk mit erweiterten Daten:', tradeData);
      
      // API-Call für die Gewerk-Erstellung
      const milestoneData = {
        title: tradeData.title,
        description: tradeData.description,
        project_id: tradeData.project_id,
        status: 'planned', // Backend erwartet 'planned' statt 'planning'
        priority: tradeData.priority,
        planned_date: tradeData.planned_date, // Backend erwartet YYYY-MM-DD Format
        category: tradeData.category,
        notes: tradeData.notes,
        is_critical: false,
        notify_on_completion: true
      };
      
      console.log('📡 Sende Milestone-Daten:', milestoneData);
      await createMilestone(milestoneData);
      
      // Erfolgreich erstellt
      console.log('✅ Gewerk erfolgreich erstellt');
      
      // Modal schließen und Daten neu laden
      setShowTradeCreationForm(false);
      await loadTrades();
      
    } catch (error) {
      console.error('❌ Fehler beim Erstellen des Gewerks:', error);
      throw error;
    }
  };

  // Kostenvoranschlag-Funktionen
  const openCostEstimateModal = (trade: Trade) => {
    console.log('🔧 openCostEstimateModal aufgerufen für Trade:', trade);
    console.log('🔧 currentProject:', currentProject);
    console.log('🔧 user:', user);
    setSelectedTradeForEstimate(trade);
    setShowCostEstimateForm(true);
  };

  const openTradeDetailsModal = (trade: Trade) => {
    setSelectedTradeForDetails(trade);
    setShowTradeDetailsModal(true);
  };

  const handleCostEstimateSubmit = async (costEstimateData: any) => {
    try {
      console.log('🔧 Erstelle Kostenvoranschlag:', costEstimateData);
      
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
      
      console.log('📡 Sende Kostenvoranschlag-Daten:', quoteData);
      await createQuote(quoteData);
      
      // Erfolgreich erstellt
      console.log('✅ Kostenvoranschlag erfolgreich erstellt');
      
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
      console.log('🗑️ Lösche Gewerk:', tradeId);
      
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
      
      console.log('✅ Gewerk erfolgreich gelöscht');
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

  // Debug-Handler
  const handleDebugDeleteAll = async () => {
    if (!window.confirm('Wirklich ALLE Gewerke, Angebote und Kostenpositionen löschen?')) return;
    try {
      await api.delete('/milestones/debug/delete-all-milestones-and-quotes');
      alert('Alle Gewerke, Angebote und Kostenpositionen wurden gelöscht!');
      window.location.reload();
    } catch (err: any) {
      alert('Fehler beim Löschen: ' + (err.response?.data?.detail || err.message));
    }
  };

  if (isLoadingTrades) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#ffbd59] mx-auto mb-4"></div>
          <p className="text-white">Lade Gewerke...</p>
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
              {isServiceProviderUser ? 'Kostenvoranschläge' : 'Gewerke'}
            </h1>
            <p className="text-gray-300">
              {isServiceProviderUser 
                ? 'Verwalten Sie Ihre Kostenvoranschläge für verschiedene Gewerke'
                : 'Erstellen und verwalten Sie Gewerke für Ihr Bauprojekt'
              }
            </p>
          </div>
          
          {!isServiceProviderUser && (
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowTradeCreationForm(true)}
                className="flex items-center gap-2 px-6 py-3 bg-[#ffbd59] text-[#2c3539] rounded-lg font-semibold hover:bg-[#ffa726] transition-colors"
              >
                <Plus size={20} />
                Gewerk erstellen
              </button>
            </div>
          )}
        </div>

        {/* Debug-Button nur im Entwicklungsmodus */}
        {import.meta.env.DEV && (
          <button
            onClick={handleDebugDeleteAll}
            className="mb-8 px-6 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition shadow-lg border-2 border-red-800"
          >
            Debug: Alle Gewerke, Angebote & Kostenpositionen löschen
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
            <h3 className="text-2xl font-bold text-white mb-1">{trades.length}</h3>
            <p className="text-sm text-gray-400">Gewerke</p>
          </div>

          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl">
                <Eye size={24} className="text-white" />
              </div>
              <span className="text-sm text-gray-400">Aktive Gewerke</span>
            </div>
            <h3 className="text-2xl font-bold text-white mb-1">
              {activeCount}
            </h3>
            <p className="text-sm text-gray-400">Anzahl aktiver Gewerke</p>
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
            <p className="text-sm text-gray-400">Gewerke ohne Angebote</p>
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
            <p className="text-sm text-gray-400">Gewerke mit ausstehenden Angeboten</p>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Gewerke durchsuchen..."
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

        {/* Gewerke Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredTrades.map((trade) => (
            <div 
              key={trade.id} 
              className={`group bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-300 transform hover:-translate-y-2 hover:shadow-2xl ${
                isServiceProviderUser ? '' : 'cursor-pointer'
              }`}
              onClick={isServiceProviderUser ? undefined : () => {
                // Prüfe ob Kostenvoranschläge vorhanden sind
                const quotes = allTradeQuotes[trade.id] || [];
                if (quotes.length > 0) {
                  // Öffne CostEstimateDetailsModal für Bauträger
                  setSelectedTradeForCostEstimateDetails(trade);
                  setShowCostEstimateDetailsModal(true);
                } else {
                  // Öffne normale TradeDetailsModal wenn keine Kostenvoranschläge vorhanden
                  openTradeDetailsModal(trade);
                }
              }}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-[#ffbd59] to-[#ffa726] rounded-xl">
                    <Wrench size={20} className="text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-lg group-hover:text-[#ffbd59] transition-colors">
                      {trade.title}
                    </h3>
                    <p className="text-sm text-gray-400">{trade.description}</p>
                  </div>
                </div>
                
                {/* Actions Menu - nur für Bauträger */}
                {!isServiceProviderUser && (() => {
                  const quotes = allTradeQuotes[trade.id] || [];
                  const acceptedQuotes = quotes.filter(q => q.status === 'accepted');
                  const canEdit = acceptedQuotes.length === 0;
                  
                  return canEdit ? (
                    <div className="relative" onClick={(e) => e.stopPropagation()}>
                      <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                        <MoreHorizontal size={16} className="text-gray-400" />
                      </button>
                      <div className="absolute right-0 top-full mt-2 w-48 bg-[#3d4952] rounded-xl shadow-2xl border border-white/20 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-10">
                        <button
                          onClick={() => openEditModal(trade)}
                          className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/10 transition-colors rounded-t-xl"
                        >
                          <Edit size={16} />
                          <span>Bearbeiten</span>
                        </button>
                        <button
                          onClick={() => handleDeleteTrade(trade.id)}
                          disabled={deletingTrade === trade.id}
                          className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-red-500/20 text-red-300 transition-colors rounded-b-xl disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {deletingTrade === trade.id ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-300"></div>
                              <span>Lösche...</span>
                            </>
                          ) : (
                            <>
                              <Trash2 size={16} />
                              <span>Löschen</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  ) : null;
                })()}
                

              </div>

              {/* Gewerk Details */}
              <div className="space-y-4 mb-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">Kategorie</span>
                  <div className="flex items-center gap-2">
                    {getCategoryIcon(trade.category || '')}
                    <span className="text-sm font-medium text-white">{getCategoryLabel(trade.category || '')}</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <Calendar size={14} className="text-gray-400" />
                    <span className="text-gray-400">Geplant:</span>
                    <span className="text-white ml-1">{trade.planned_date ? new Date(trade.planned_date).toLocaleDateString('de-DE') : '—'}</span>
                  </div>
                  
                  {trade.start_date && trade.end_date && (
                    <div className="flex items-center gap-1">
                      <Calendar size={14} className="text-gray-400" />
                      <span className="text-gray-400">Dauer:</span>
                      <span className="text-white ml-1">{Math.round((new Date(trade.end_date).getTime() - new Date(trade.start_date).getTime()) / (1000 * 60 * 60 * 24))} Tage</span>
                    </div>
                  )}
                </div>
                
                {trade.budget && (
                  <div className="flex items-center gap-1 text-sm">
                    <span className="text-gray-400">Budget:</span>
                    <span className="text-white">{trade.budget.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}</span>
                  </div>
                )}
                
                {trade.contractor && (
                  <div className="flex items-center gap-1 text-sm">
                    <span className="text-gray-400">Auftragnehmer:</span>
                    <span className="text-white">{trade.contractor}</span>
                  </div>
                )}
                
                <div className="flex items-center gap-1 text-sm">
                  <TrendingUp size={14} className="text-gray-400" />
                  <span className="text-gray-400">Fortschritt:</span>
                  <span className="text-white ml-1">{trade.progress_percentage || 0}%</span>
                </div>
                
                {trade.is_critical && (
                  <div className="flex items-center gap-2 p-2 bg-red-500/10 border border-red-500/20 rounded-lg">
                    <Shield size={14} className="text-red-400" />
                    <span className="text-sm text-red-300 font-medium">Kritisches Gewerk</span>
                  </div>
                )}
              </div>

              {/* Angenommenes Kostenvoranschlag Details */}
              {(() => {
                const quotes = allTradeQuotes[trade.id] || [];
                const acceptedQuote = quotes.find(q => q.status === 'accepted');
                
                if (acceptedQuote) {
                  return (
                    <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 mb-4">
                      <div className="flex items-center gap-2 mb-3">
                        <CheckCircle size={16} className="text-green-400" />
                        <span className="text-sm font-medium text-green-300">Angenommener Kostenvoranschlag</span>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-400">Kostenvoranschlag:</span>
                          <span className="text-sm font-medium text-white">{acceptedQuote.title}</span>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-400">Betrag:</span>
                          <span className="text-lg font-bold text-[#ffbd59]">
                            {acceptedQuote.total_amount.toLocaleString('de-DE', { style: 'currency', currency: acceptedQuote.currency })}
                          </span>
                        </div>
                        
                        {acceptedQuote.company_name && (
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-400">Firma:</span>
                            <span className="text-sm text-white">{acceptedQuote.company_name}</span>
                          </div>
                        )}
                        
                        {acceptedQuote.contact_person && (
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-400">Ansprechpartner:</span>
                            <span className="text-sm text-white">{acceptedQuote.contact_person}</span>
                          </div>
                        )}
                        
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-400">Dauer:</span>
                          <span className="text-sm text-white">{acceptedQuote.estimated_duration} Tage</span>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-400">Garantie:</span>
                          <span className="text-sm text-white">{acceptedQuote.warranty_period} Monate</span>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-400">Risiko:</span>
                          <span className={`text-sm ${acceptedQuote.risk_score > 30 ? 'text-red-400' : acceptedQuote.risk_score > 15 ? 'text-yellow-400' : 'text-green-400'}`}>
                            {acceptedQuote.risk_score}%
                          </span>
                        </div>
                        
                        {acceptedQuote.contact_released && (
                          <div className="mt-3 p-2 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                            <div className="flex items-center gap-2 text-sm">
                              <User size={14} className="text-blue-400" />
                              <span className="text-blue-300 font-medium">Kontaktdaten freigegeben</span>
                            </div>
                            {acceptedQuote.phone && (
                              <div className="flex items-center gap-1 text-xs text-gray-400 mt-1">
                                <Phone size={12} />
                                <span>{acceptedQuote.phone}</span>
                              </div>
                            )}
                            {acceptedQuote.email && (
                              <div className="flex items-center gap-1 text-xs text-gray-400">
                                <Mail size={12} />
                                <span>{acceptedQuote.email}</span>
                              </div>
                            )}
                            {acceptedQuote.website && (
                              <div className="flex items-center gap-1 text-xs text-gray-400">
                                <Globe size={12} />
                                <span>{acceptedQuote.website}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                }
                
                // Zeige Anzahl der verfügbaren Kostenvoranschläge
                const availableQuotes = quotes.filter(q => q.status === 'submitted');
                const acceptedQuotes = quotes.filter(q => q.status === 'accepted');
                const underReviewQuotes = quotes.filter(q => q.status === 'under_review');
                
                if (availableQuotes.length > 0 || acceptedQuotes.length > 0 || underReviewQuotes.length > 0) {
                  return (
                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 mb-4">
                      <div className="flex items-center gap-2 mb-2">
                        <FileText size={16} className="text-blue-400" />
                        <span className="text-sm font-medium text-blue-300">
                          {quotes.length} Kostenvoranschlag{quotes.length > 1 ? 'e' : ''} verfügbar
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2 text-xs">
                        {availableQuotes.length > 0 && (
                          <span className="bg-green-500/20 text-green-300 px-2 py-1 rounded">
                            {availableQuotes.length} zur Annahme
                          </span>
                        )}
                        {underReviewQuotes.length > 0 && (
                          <span className="bg-yellow-500/20 text-yellow-300 px-2 py-1 rounded">
                            {underReviewQuotes.length} in Prüfung
                          </span>
                        )}
                        {acceptedQuotes.length > 0 && (
                          <span className="bg-blue-500/20 text-blue-300 px-2 py-1 rounded">
                            {acceptedQuotes.length} angenommen
                          </span>
                        )}
                      </div>
                    </div>
                  );
                }
                
                return null;
              })()}

              {/* Status and AI Analysis */}
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  {/* Klickbarer Status */}
                  <div className="relative group" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => {
                        const statuses = ['planned', 'in_progress', 'completed', 'delayed', 'cancelled'];
                        const currentIndex = statuses.indexOf(trade.status);
                        const nextStatus = statuses[(currentIndex + 1) % statuses.length];
                        handleQuickStatusChange(trade.id, nextStatus);
                      }}
                      className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium backdrop-blur-md border ${getStatusColor(trade.status)} hover:scale-105 transition-all duration-200 cursor-pointer group`}
                      title="Klicken zum Ändern des Status"
                    >
                      {getStatusLabel(trade.status)}
                      <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-[10px]">↻</span>
                    </button>
                  </div>
                  
                  {/* Klickbare Priorität */}
                  {trade.priority && (
                    <div className="relative group" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => {
                          const priorities = ['low', 'medium', 'high', 'critical'];
                          const currentIndex = priorities.indexOf(trade.priority);
                          const nextPriority = priorities[(currentIndex + 1) % priorities.length];
                          handleQuickPriorityChange(trade.id, nextPriority);
                        }}
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-white/10 border border-white/20 ${getPriorityColor(trade.priority)} hover:scale-105 transition-all duration-200 cursor-pointer group`}
                        title="Klicken zum Ändern der Priorität"
                      >
                        <span>{getPriorityLabel(trade.priority)}</span>
                        <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-[10px]">↻</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
              {/* Details einsehen Button für alle Benutzer */}
              <div className="mt-4">
                <button
                  className="w-full px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-semibold hover:from-blue-600 hover:to-blue-700 transition-all duration-300 transform hover:scale-105 shadow-lg"
                  onClick={(e) => {
                    e.stopPropagation();
                    openTradeDetailsModal(trade);
                  }}
                >
                  <Eye size={16} className="inline mr-2" />
                  Details einsehen
                </button>
              </div>

              {/* Angebot abgeben Button für Dienstleister */}
              {isServiceProviderUser && (() => {
                const quotes = allTradeQuotes[trade.id] || [];
                const myQuote = quotes.find(q => q.service_provider_id === user?.id);
                
                if (myQuote) {
                  // Angebot bereits abgegeben - zeige Status
                  return (
                    <div className="mt-4 space-y-3">
                      {/* Status-Badge */}
                      <div className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold ${
                        myQuote.status === 'accepted' 
                          ? 'bg-green-500/20 border border-green-500/30 text-green-300'
                          : myQuote.status === 'rejected'
                          ? 'bg-red-500/20 border border-red-500/30 text-red-300'
                          : myQuote.status === 'under_review'
                          ? 'bg-yellow-500/20 border border-yellow-500/30 text-yellow-300'
                          : 'bg-blue-500/20 border border-blue-500/30 text-blue-300'
                      }`}>
                        {myQuote.status === 'accepted' && <CheckCircle size={16} />}
                        {myQuote.status === 'rejected' && <XCircle size={16} />}
                        {myQuote.status === 'under_review' && <Clock size={16} />}
                        {myQuote.status === 'submitted' && <Send size={16} />}
                        <span>
                          {myQuote.status === 'accepted' && 'Angebot angenommen'}
                          {myQuote.status === 'rejected' && 'Angebot abgelehnt'}
                          {myQuote.status === 'under_review' && 'In Prüfung'}
                          {myQuote.status === 'submitted' && isServiceProviderUser && 'Angebot eingereicht'}
                        </span>
                      </div>
                      
                      {/* Angebot-Details */}
                      <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-semibold text-white text-sm">Ihr Kostenvoranschlag</h4>
                          <span className="text-lg font-bold text-[#ffbd59]">
                            {myQuote.total_amount.toLocaleString('de-DE', { style: 'currency', currency: myQuote.currency })}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3 text-xs text-gray-400">
                          <div>
                            <span>Dauer:</span>
                            <div className="text-white font-medium">{myQuote.estimated_duration} Tage</div>
                          </div>
                          <div>
                            <span>Gültig bis:</span>
                            <div className="text-white font-medium">{new Date(myQuote.valid_until).toLocaleDateString('de-DE')}</div>
                          </div>
                          {myQuote.labor_cost && (
                            <div>
                              <span>Arbeitskosten:</span>
                              <div className="text-white font-medium">
                                {myQuote.labor_cost.toLocaleString('de-DE', { style: 'currency', currency: myQuote.currency })}
                              </div>
                            </div>
                          )}
                          {myQuote.material_cost && (
                            <div>
                              <span>Materialkosten:</span>
                              <div className="text-white font-medium">
                                {myQuote.material_cost.toLocaleString('de-DE', { style: 'currency', currency: myQuote.currency })}
                              </div>
                            </div>
                          )}
                          {myQuote.overhead_cost && (
                            <div>
                              <span>Gemeinkosten:</span>
                              <div className="text-white font-medium">
                                {myQuote.overhead_cost.toLocaleString('de-DE', { style: 'currency', currency: myQuote.currency })}
                              </div>
                            </div>
                          )}
                          {myQuote.payment_terms && (
                            <div>
                              <span>Zahlungsbedingungen:</span>
                              <div className="text-white font-medium">{myQuote.payment_terms}</div>
                            </div>
                          )}
                        </div>
                        
                        {/* Details und Zurückziehen Buttons */}
                        <div className="mt-3 space-y-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openQuoteDetailsModal(myQuote);
                            }}
                            className="w-full px-3 py-2 bg-[#ffbd59]/20 text-[#ffbd59] text-xs rounded-lg hover:bg-[#ffbd59]/30 transition-colors"
                          >
                            Details anzeigen
                          </button>
                          
                          {/* Zurückziehen Button nur für Dienstleister */}
                          {isServiceProviderUser && myQuote.status === 'submitted' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (window.confirm('Möchten Sie diesen Kostenvoranschlag wirklich zurückziehen? Diese Aktion kann nicht rückgängig gemacht werden.')) {
                                  handleWithdrawQuote(myQuote.id);
                                }
                              }}
                              className="w-full px-3 py-2 bg-red-500/20 text-red-300 text-xs rounded-lg hover:bg-red-500/30 transition-colors"
                            >
                              Zurückziehen
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                } else {
                  // Kein Angebot abgegeben - zeige Button unten rechts
                  return (
                    <div className="mt-4">
                      <button
                        className="w-full px-4 py-3 bg-gradient-to-r from-[#ffbd59] to-[#ffa726] text-[#3d4952] rounded-xl font-semibold hover:from-[#ffa726] hover:to-[#ff9800] transition-all duration-300 transform hover:scale-105 shadow-lg"
                        onClick={(e) => {
                          e.stopPropagation();
                          console.log('🔧 Button-Click erkannt für Trade:', trade);
                          openCostEstimateModal(trade);
                        }}
                        style={{ display: 'block', visibility: 'visible' }}
                      >
                        <Calculator size={16} className="inline mr-2" />
                        Kostenvoranschlag abgeben
                      </button>
                    </div>
                  );
                }
              })()}
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredTrades.length === 0 && (
          <div className="text-center py-12">
            <div className="p-6 bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 max-w-md mx-auto">
              <Wrench size={48} className="text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">Keine Gewerke gefunden</h3>
              <p className="text-gray-400 mb-6">
                {searchTerm || filterStatus !== 'all' 
                  ? 'Versuchen Sie andere Suchkriterien oder Filter.'
                  : 'Es sind aktuell keine ausgeschriebenen Gewerke verfügbar.'
                }
              </p>
              {/* Button nur für Bauträger anzeigen */}
              {!isServiceProviderUser && !searchTerm && filterStatus === 'all' && (
                <button
                  onClick={() => setShowTradeModal(true)}
                  className="px-6 py-3 bg-gradient-to-r from-[#ffbd59] to-[#ffa726] text-[#3d4952] rounded-xl hover:from-[#ffa726] hover:to-[#ff9800] transition-all duration-300 font-semibold"
                >
                  Erstes Gewerk erstellen
                </button>
              )}
            </div>
          </div>
        )}

        {/* TradeCreationForm Modal */}
        {showTradeCreationForm && currentProject && (
          <TradeCreationForm
            isOpen={showTradeCreationForm}
            onClose={() => setShowTradeCreationForm(false)}
            onSubmit={handleCreateTradeWithForm}
            projectId={currentProject.id}
          />
        )}

        {/* CostEstimateForm Modal */}
        {showCostEstimateForm && selectedTradeForEstimate && (
          <CostEstimateForm
            isOpen={showCostEstimateForm}
            onClose={() => {
              setShowCostEstimateForm(false);
              setSelectedTradeForEstimate(null);
            }}
            onSubmit={handleCostEstimateSubmit}
            trade={selectedTradeForEstimate}
            project={currentProject || {
              id: selectedTradeForEstimate.project_id,
              name: 'Unbekanntes Projekt',
              description: 'Projekt-Details nicht verfügbar'
            }}
          />
        )}

        {/* TradeDetailsModal */}
        {showTradeDetailsModal && selectedTradeForDetails && (
          <TradeDetailsModal
            isOpen={showTradeDetailsModal}
            onClose={() => {
              setShowTradeDetailsModal(false);
              setSelectedTradeForDetails(null);
            }}
            trade={selectedTradeForDetails}
            quotes={allTradeQuotes[selectedTradeForDetails.id] || []}
            project={currentProject}
          />
        )}

        {/* CostEstimateDetailsModal für Bauträger */}
        {showCostEstimateDetailsModal && selectedTradeForCostEstimateDetails && (
          <CostEstimateDetailsModal
            isOpen={showCostEstimateDetailsModal}
            onClose={() => {
              setShowCostEstimateDetailsModal(false);
              setSelectedTradeForCostEstimateDetails(null);
            }}
            trade={selectedTradeForCostEstimateDetails}
            quotes={allTradeQuotes[selectedTradeForCostEstimateDetails.id] || []}
            project={currentProject}
            onAcceptQuote={handleAcceptQuote}
            onRejectQuote={handleRejectQuote}
            onResetQuote={handleResetQuote}
          />
        )}

        {/* OrderConfirmationGenerator */}
        {showOrderConfirmationGenerator && orderConfirmationData && (
          <OrderConfirmationGenerator
            data={orderConfirmationData}
            onGenerate={handleGenerateOrderConfirmation}
            onClose={handleCloseOrderConfirmationGenerator}
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