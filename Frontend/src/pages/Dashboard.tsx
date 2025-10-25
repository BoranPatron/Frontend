import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSwipeable } from 'react-swipeable';
import { useAuth } from '../context/AuthContext';
import { useProject } from '../context/ProjectContext';
import { useMobileViewport, useMobilePerformance } from '../hooks/useMobileOptimization';
import MobileDashboardOptimized from '../components/mobile/MobileDashboardOptimized';
import { getProjects, createProject, updateProject } from '../api/projectService';
import { uploadDocument } from '../api/documentService';
import ConstructionPhaseTimeline from '../components/ConstructionPhaseTimeline';
import TradesCard from '../components/TradesCard';
import TradeDetailsModal from '../components/TradeDetailsModal';
import ProjectDetailsModal from '../components/ProjectDetailsModal';

import SimpleCostEstimateModal from '../components/SimpleCostEstimateModal';
import CreateInspectionModal from '../components/CreateInspectionModal';
import TradeCreationForm from '../components/TradeCreationForm';
import FinanceWidget from '../components/FinanceWidget';
import FinanceAnalytics from '../components/FinanceAnalytics';
import FinancialCharts from '../components/FinancialCharts';
import ProjectFinancialAnalysis from '../components/ProjectFinancialAnalysis';
import { getMilestones, getAllMilestones } from '../api/milestoneService';
import { acceptQuote, rejectQuote, resetQuote, getQuotesForMilestone, getQuotes } from '../api/quoteService';
import { getTasks } from '../api/taskService';
import { getCategoryStatistics } from '../api/documentService';
import { appointmentService } from '../api/appointmentService';
import { RadialMenu } from '../components/RadialMenu';
import { RadialMenuAdvanced } from '../components/RadialMenuAdvanced';
import KanbanBoard from '../components/KanbanBoard';
import TaskCreationModal from '../components/TaskCreationModal';
import { CreditAnimationProvider, useCreditAdditionAnimation } from '../context/CreditAnimationContext';
import { 
  Users, 
  Upload, 
  Eye, 
  X, 
  AlertTriangle,
  Shield,
  EyeOff,
  FolderOpen,
  Star,
  Building,
  FileText,
  Calculator,
  Hammer,
  Camera,
  FileCheck,
  CheckCircle,
  Info,
  CheckSquare,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Plus,
  CloudUpload,
  Image,
  Video,
  Archive,
  File,
  Edit,
  Zap,
  Sparkles,
  Target,
  Wrench,
  Calendar,
  DollarSign,
  TrendingUp,
  TrendingDown,
  BarChart3
} from 'lucide-react';
import GuidedTourOverlay from '../components/Onboarding/GuidedTourOverlay';
import FinalGuidedTour from '../components/Onboarding/FinalGuidedTour';
import { useOnboarding } from '../context/OnboardingContext';
import DisableableButton from '../components/Onboarding/DisableableButton';
import { DocumentCategorizer } from '../utils/documentCategorizer';
import PageHeader from '../components/PageHeader';
import AddressAutocomplete from '../components/AddressAutocomplete';
import DocumentSidebar from '../components/DocumentSidebar';
import DocumentViewerModal from '../components/DocumentViewerModal';
import type { DocumentItem } from '../components/DocumentSidebar';

// DMS-Kategorien (synchron mit Backend)
const DOCUMENT_CATEGORIES = {
  planning: {
    name: 'Planung & Genehmigung',
    icon: Building,
    color: 'blue',
    subcategories: [
      'Baupläne & Grundrisse',
      'Baugenehmigungen',
      'Statische Berechnungen',
      'Energieausweise',
      'Vermessungsunterlagen'
    ]
  },
  contracts: {
    name: 'Verträge & Rechtliches',
    icon: FileText,
    color: 'green',
    subcategories: [
      'Bauverträge',
      'Nachträge',
      'Versicherungen',
      'Gewährleistungen',
      'Mängelrügen'
    ]
  },
  finance: {
    name: 'Finanzen & Abrechnung',
    icon: Calculator,
    color: 'yellow',
    subcategories: [
      'Rechnungen',
      'Kostenvoranschläge',
      'Leistungsverzeichnisse',
      'Zahlungsbelege',
      'Änderungsaufträge',
      'Schlussrechnungen'
    ]
  },
  execution: {
    name: 'Ausführung & Handwerk',
    icon: Hammer,
    color: 'orange',
    subcategories: [
      'Lieferscheine',
      'Materialbelege',
      'Abnahmeprotokolle',
      'Prüfberichte',
      'Zertifikate',
      'Arbeitsanweisungen'
    ]
  },
  documentation: {
    name: 'Dokumentation & Medien',
    icon: Camera,
    color: 'purple',
    subcategories: [
      'Fotos',
      'Baufortschrittsfotos',
      'Mängeldokumentation',
      'Bestandsdokumentation',
      'Videos',
      'Baustellenberichte'
    ]
  },
  procurement: {
    name: 'Ausschreibungen & Angebote',
    icon: FileText,
    color: 'indigo',
    subcategories: [
      'Ausschreibungsunterlagen',
      'Technische Spezifikationen',
      'Angebote',
      'Angebotsbewertung',
      'Vergabedokumentation',
      'Verhandlungen'
    ]
  },
  project_management: {
    name: 'Projektmanagement',
    icon: Calendar,
    color: 'teal',
    subcategories: [
      'Projektpläne',
      'Terminplanung',
      'Budgetplanung',
      'Projektsteuerung',
      'Risikomanagement',
      'Qualitätsmanagement',
      'Ressourcenplanung',
      'Projektdokumentation'
    ]
  },
  technical: {
    name: 'Technische Unterlagen',
    icon: Wrench,
    color: 'gray',
    subcategories: [
      'Technische Zeichnungen',
      'Spezifikationen',
      'Datenblätter',
      'Handbücher',
      'Anleitungen',
      'Installationsanweisungen',
      'Wartungsanleitungen'
    ]
  },
  order_confirmations: {
    name: 'Auftragsbestätigungen',
    icon: FileCheck,
    color: 'emerald',
    subcategories: [
      'Auftragsbestätigungen',
      'Bestellbestätigungen',
      'Leistungsbestätigungen'
    ]
  }
};

interface UploadFile {
  file: File;
  category?: string;
  subcategory?: string;
  status: 'pending' | 'uploading' | 'success' | 'error';
  progress: number;
  error?: string;
  id?: string;
  autoDetected?: boolean;
  confidence?: number;
  suggestedCategory?: string;
  suggestedSubcategory?: string;
}

interface Project {
  id: number;
  name: string;
  description: string;
  project_type: string;
  status: string;
  progress_percentage: number;
  budget?: number;
  current_costs: number;
  start_date?: string;
  end_date?: string;
  address?: string;
  address_street?: string;
  address_zip?: string;
  address_city?: string;
  address_country?: string;
  property_size?: number;
  construction_area?: number;
  estimated_duration?: number;
  is_public: boolean;
  allow_quotes: boolean;
  created_at: string;
  updated_at: string;
  // Neue Felder für Bauphasen
  construction_phase?: string;
}

// Dashboard-Komponente mit Credit-Animation
function DashboardWithCreditAnimation() {
  const { acceptQuoteWithAnimation } = useCreditAdditionAnimation();
  const navigate = useNavigate();
  const location = useLocation();
  const { isInitialized, isAuthenticated, userRole, user, isServiceProvider } = useAuth();
  const { 
    projects, 
    selectedProject, 
    selectedProjectIndex, 
    setSelectedProjectIndex,
    loadProjects,
    isLoading: projectsLoading,
    error: projectsError 
  } = useProject();


  // Mobile Optimierung Hooks
  const viewport = useMobileViewport();
  const performance = useMobilePerformance();

  // Weiterleitung für Dienstleister zur dedizierten Dienstleister-Ansicht
  useEffect(() => {
    if (isInitialized && isAuthenticated() && (userRole === 'dienstleister' || user?.user_role === 'DIENSTLEISTER')) {
      navigate('/service-provider');
      return;
    }
  }, [isInitialized, isAuthenticated, userRole, user, navigate]);
  
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string>('');
  const [error, setError] = useState<string>('');
  const { showTour, setShowTour, shouldDisableUI, userRole: onboardingUserRole, completeTour } = useOnboarding();
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  
  // State für Projekt-Erstellung
  const [showCreateProjectModal, setShowCreateProjectModal] = useState(false);
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [createProjectError, setCreateProjectError] = useState<string | null>(null);
  const [isPrivacyBannerCollapsed, setIsPrivacyBannerCollapsed] = useState(true);
  const [showDocumentInheritanceTooltip, setShowDocumentInheritanceTooltip] = useState(false);
  const [projectForm, setProjectForm] = useState({
    name: '',
    description: '',
    project_type: 'new_build',
    address_street: '',
    address_zip: '',
    address_city: '',
    address_country: 'Schweiz',
    construction_phase: '', // Neues Feld für Bauphase
    property_size: '',
    construction_area: '',
    start_date: '',
    end_date: '',
    budget: '',
    is_public: true,
    allow_quotes: true
  });
  // Edit-Projekt Modal State
  const [showEditProjectModal, setShowEditProjectModal] = useState(false);
  const [isUpdatingProject, setIsUpdatingProject] = useState(false);
  const [editProjectError, setEditProjectError] = useState<string | null>(null);

  // Projekt-Details Modal State
  const [showProjectDetailsModal, setShowProjectDetailsModal] = useState(false);

  // State für Dokumenten-Upload (vollständiges DMS-System)
  const [uploadFiles, setUploadFiles] = useState<UploadFile[]>([]);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const fileInputRef = React.createRef<HTMLInputElement>();

  // Bauphasen je nach Land
  const getConstructionPhases = (country: string) => {
    switch (country) {
      case 'Schweiz':
        return [
          { value: 'vorprojekt', label: 'Vorprojekt' },
          { value: 'projektierung', label: 'Projektierung' },
          { value: 'baugenehmigung', label: 'Baugenehmigung' },
          { value: 'ausschreibung', label: 'Ausschreibung' },
          { value: 'aushub', label: 'Aushub' },
          { value: 'fundament', label: 'Fundament' },
          { value: 'rohbau', label: 'Rohbau' },
          { value: 'dach', label: 'Dach' },
          { value: 'fassade', label: 'Fassade' },
          { value: 'innenausbau', label: 'Innenausbau' },
          { value: 'fertigstellung', label: 'Fertigstellung' }
        ];
      case 'Deutschland':
        return [
          { value: 'planungsphase', label: 'Planungsphase' },
          { value: 'baugenehmigung', label: 'Baugenehmigung' },
          { value: 'ausschreibung', label: 'Ausschreibung' },
          { value: 'aushub', label: 'Aushub' },
          { value: 'fundament', label: 'Fundament' },
          { value: 'rohbau', label: 'Rohbau' },
          { value: 'dach', label: 'Dach' },
          { value: 'fassade', label: 'Fassade' },
          { value: 'innenausbau', label: 'Innenausbau' },
          { value: 'fertigstellung', label: 'Fertigstellung' }
        ];
      case 'Österreich':
        return [
          { value: 'planungsphase', label: 'Planungsphase' },
          { value: 'einreichung', label: 'Einreichung' },
          { value: 'ausschreibung', label: 'Ausschreibung' },
          { value: 'aushub', label: 'Aushub' },
          { value: 'fundament', label: 'Fundament' },
          { value: 'rohbau', label: 'Rohbau' },
          { value: 'dach', label: 'Dach' },
          { value: 'fassade', label: 'Fassade' },
          { value: 'innenausbau', label: 'Innenausbau' },
          { value: 'fertigstellung', label: 'Fertigstellung' }
        ];
      default:
        return [];
    }
  };

  const getPhaseLabel = (phase: string) => {
    const phases = getConstructionPhases(projectForm.address_country);
    const phaseObj = phases.find(p => p.value === phase);
    return phaseObj ? phaseObj.label : phase;
  };

  const getPhaseColor = (phase: string) => {
    const phaseColors: { [key: string]: string } = {
      // Schweiz
      'vorprojekt': 'text-blue-400',
      'projektierung': 'text-indigo-400',
      'baugenehmigung': 'text-yellow-400',
      'ausschreibung': 'text-orange-400',
      'aushub': 'text-red-400',
      'fundament': 'text-purple-400',
      'rohbau': 'text-pink-400',
      'dach': 'text-indigo-400',
      'fassade': 'text-green-400',
      'innenausbau': 'text-teal-400',
      'fertigstellung': 'text-emerald-400',
      
      // Deutschland und Österreich (gemeinsame Phasen)
      'planungsphase': 'text-blue-400',
      'einreichung': 'text-yellow-400'
    };
    return phaseColors[phase] || 'text-gray-400';
  };

  // Hilfsfunktion für Bauphasen-Informationen
  const getConstructionPhaseInfo = (country: string, phase: string) => {
    const phases = getConstructionPhases(country);
    const currentPhaseIndex = phases.findIndex(p => p.value === phase);
    const phaseLabel = phases.find(p => p.value === phase)?.label || phase;
    
    return {
      phases,
      currentPhaseIndex,
      phaseLabel,
      totalPhases: phases.length,
      progressPercentage: phases.length > 0 ? ((currentPhaseIndex + 1) / phases.length) * 100 : 0
    };
  };

  const handleProjectDetailsClick = () => {
    setShowProjectDetailsModal(true);
  };

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

  // Weiterleitung zur Login-Seite wenn nicht authentifiziert
  useEffect(() => {
    if (isInitialized && !isAuthenticated()) {
      console.log('🔐 Benutzer nicht authentifiziert - Weiterleitung zur Login-Seite');
      navigate('/login?message=please_login');
    }
  }, [isInitialized, isAuthenticated, navigate]);

  // Tour logic is now handled by OnboardingContext

  // Event-Listener für TradeDetailsModal öffnen (von Benachrichtigungen)
  useEffect(() => {
    const handleOpenTradeDetails = async (event: CustomEvent) => {
      console.log('📋 Dashboard: Event empfangen - TradeDetails öffnen für Trade:', event.detail.tradeId);
      const tradeId = event.detail.tradeId;
      
      try {
        // Lade das spezifische Milestone direkt von der API
        const milestone = await getMilestones(selectedProject?.id || 0);
        const trade = milestone.find((m: any) => m.id === tradeId);
        
        if (trade) {
          console.log('✅ Dashboard: Trade gefunden, öffne TradeDetailsModal:', trade);
          setSelectedTradeForDetails(trade);
          setShowTradeDetailsModal(true);
        } else {
          console.warn('⚠️ Dashboard: Trade nicht gefunden, versuche direkte API-Abfrage...');
          
          // Fallback: Versuche alle Projekte zu durchsuchen
          for (const project of projects) {
            try {
              const projectMilestones = await getMilestones(project.id);
              const foundTrade = projectMilestones.find((m: any) => m.id === tradeId);
              if (foundTrade) {
                console.log('✅ Dashboard: Trade in anderem Projekt gefunden:', foundTrade);
                setSelectedTradeForDetails(foundTrade);
                setShowTradeDetailsModal(true);
                return;
              }
            } catch (error) {
              console.warn(`⚠️ Fehler beim Durchsuchen von Projekt ${project.id}:`, error);
            }
          }
          
          console.error('❌ Dashboard: Trade in keinem Projekt gefunden:', tradeId);
          alert('Die Ausschreibung konnte nicht gefunden werden. Bitte laden Sie die Seite neu.');
        }
      } catch (error) {
        console.error('❌ Dashboard: Fehler beim Laden der Milestones:', error);
        alert('Fehler beim Laden der Ausschreibung. Bitte versuchen Sie es erneut.');
      }
    };

    window.addEventListener('openTradeDetails', handleOpenTradeDetails as any);
    
    return () => {
      window.removeEventListener('openTradeDetails', handleOpenTradeDetails as any);
    };
  }, [selectedProject, projects]);

  // Event-Listener für SimpleCostEstimateModal öffnen (von Benachrichtigungen)
  useEffect(() => {
    const handleOpenSimpleCostEstimateModal = async (event: CustomEvent) => {
      console.log('🔧 Dashboard: Event empfangen - SimpleCostEstimateModal öffnen für Trade:', event.detail.tradeId);
      const tradeId = event.detail.tradeId;
      
      try {
        // Lade das spezifische Milestone direkt von der API
        const milestone = await getMilestones(selectedProject?.id || 0);
        const trade = milestone.find((m: any) => m.id === tradeId);
        
        if (trade) {
          console.log('✅ Dashboard: Trade gefunden, öffne SimpleCostEstimateModal:', trade);
          setSelectedTradeForSimpleCostEstimate(trade);
          setShowSimpleCostEstimateModal(true);
        } else {
          console.error('❌ Dashboard: Trade nicht gefunden:', tradeId);
          alert('Ausschreibung nicht gefunden. Bitte versuchen Sie es erneut.');
        }
      } catch (error) {
        console.error('❌ Dashboard: Fehler beim Laden der Milestones:', error);
        alert('Fehler beim Laden der Ausschreibung. Bitte versuchen Sie es erneut.');
      }
    };

    window.addEventListener('openSimpleCostEstimateModal', handleOpenSimpleCostEstimateModal as any);
    
    return () => {
      window.removeEventListener('openSimpleCostEstimateModal', handleOpenSimpleCostEstimateModal as any);
    };
  }, [selectedProject, projects]);

  // Event-Listener für To-Do-Scrolling (vom Radial Menu)
  useEffect(() => {
    const handleScrollToTodo = () => {
      console.log('📋 Dashboard: Event empfangen - Öffne Task Creation Modal');
      setShowTaskCreationModal(true);
    };

    window.addEventListener('scrollToTodo', handleScrollToTodo as any);
    
    return () => {
      window.removeEventListener('scrollToTodo', handleScrollToTodo as any);
    };
  }, []);

  // Event-Listener für TradeCreationForm öffnen (vom Radial Menu)
  useEffect(() => {
    const handleOpenTradeCreationForm = (event: CustomEvent) => {
      const { projectId } = event.detail;
      
      // Set project if specified
      if (projectId && projects.length > 0) {
        const idx = projects.findIndex(p => p.id === projectId);
        if (idx >= 0) {
          setSelectedProjectIndex(idx);
        }
      }
      
      // Open trade creation form
      setShowTradeCreationForm(true);
    };

    window.addEventListener('openTradeCreationForm', handleOpenTradeCreationForm as any);
    
    return () => {
      window.removeEventListener('openTradeCreationForm', handleOpenTradeCreationForm as any);
    };
  }, [projects, setSelectedProjectIndex]);

  // Swipe-Handler für Projekt-Navigation
  const handleSwipe = (direction: 'left' | 'right') => {
    if (isTransitioning || projects.length === 0) return;
    
    setIsTransitioning(true);
    
    if (direction === 'left' && selectedProjectIndex < projects.length - 1) {
      setSelectedProjectIndex(selectedProjectIndex + 1);
    } else if (direction === 'right' && selectedProjectIndex > 0) {
      setSelectedProjectIndex(selectedProjectIndex - 1);
    }
    
    // Transition-Animation beenden
    setTimeout(() => setIsTransitioning(false), 300);
  };

  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => handleSwipe('left'),
    onSwipedRight: () => handleSwipe('right'),
    trackMouse: true,
    delta: 50, // Mindest-Swipe-Distanz
    swipeDuration: 500, // Maximale Swipe-Dauer
  });

  // Query-Param getriebenes Öffnen von Modals (z. B. Neues Gewerk über RadialMenu)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const create = params.get('create');
    const projectParam = params.get('project');
    
    if (create === 'trade') {
      if (projectParam && projects.length > 0) {
        const idx = projects.findIndex(p => String(p.id) === String(projectParam));
        if (idx >= 0) setSelectedProjectIndex(idx);
      }
      
      // Always open trade creation form when create=trade parameter is present
      setShowTradeCreationForm(true);
      
      // Nur 'create' entfernen, 'project' beibehalten
      const newParams = new URLSearchParams(location.search);
      newParams.delete('create');
      navigate({ pathname: location.pathname, search: newParams.toString() ? `?${newParams.toString()}` : '' }, { replace: true });
    }
  }, [location.search, projects.length, selectedProject?.id, setSelectedProjectIndex]);

  // Desktop-Projekt-Navigation: Vor/Zurück + Dropdown + Pfeiltasten
  const canGoPrev = selectedProjectIndex > 0;
  const canGoNext = selectedProjectIndex < Math.max(projects.length - 1, 0);

  const goPrevProject = () => {
    if (canGoPrev) setSelectedProjectIndex(selectedProjectIndex - 1);
  };
  const goNextProject = () => {
    if (canGoNext) setSelectedProjectIndex(selectedProjectIndex + 1);
  };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (isTransitioning || projects.length === 0) return;
      if (e.key === 'ArrowLeft') {
        goPrevProject();
      } else if (e.key === 'ArrowRight') {
        goNextProject();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isTransitioning, projects.length, selectedProjectIndex]);

  // Callback-Handler für alle Kacheln
  const onManagerClick = () => {
    if (selectedProject) {
      navigate(`/project/${selectedProject.id}`);
    } else {
      navigate('/');
    }
  };
  const onDocsClick = () => {
    if (selectedProject) {
      navigate(`/documents?project=${selectedProject.id}`);
    } else {
      navigate('/documents');
    }
  };
  const onTodoClick = () => {
    if (selectedProject) {
      navigate(`/tasks?project=${selectedProject.id}`);
    } else {
      navigate('/tasks');
    }
  };
  const onOfferingClick = () => {
    navigate('/quotes');
  };
  const onVisualizeClick = () => {
    if (selectedProject) {
      navigate(`/visualize?project=${selectedProject.id}`);
    } else {
      navigate('/visualize');
    }
  };
  
  const onCanvasClick = () => {
    if (selectedProject) {
      navigate(`/project/${selectedProject.id}/canvas`);
    } else {
      navigate('/canvas');
    }
  };

  // Projekt-Erstellung Funktionen
  const handleCreateProjectClick = () => {
    setShowCreateProjectModal(true);
    setCreateProjectError(null);
  };
  const handleOpenEditProjectModal = () => {
    if (!selectedProject) return;
    const p: any = selectedProject;
    setProjectForm({
      name: p.name || '',
      description: p.description || '',
      project_type: p.project_type || 'new_build',
      address_street: p.address_street || '',
      address_zip: p.address_zip || '',
      address_city: p.address_city || '',
      address_country: (p as any).address_country || 'Schweiz',
      construction_phase: (p as any).construction_phase || '',
      property_size: p.property_size ? String(p.property_size) : '',
      construction_area: p.construction_area ? String(p.construction_area) : '',
      start_date: p.start_date || '',
      end_date: p.end_date || '',
      budget: p.budget ? String(p.budget) : '',
      is_public: p.is_public ?? true,
      allow_quotes: p.allow_quotes ?? true
    });
    setEditProjectError(null);
    setShowEditProjectModal(true);
  };
  const handleCloseEditProjectModal = () => {
    setShowEditProjectModal(false);
    setEditProjectError(null);
  };

  const handleCloseCreateProjectModal = () => {
    setShowCreateProjectModal(false);
    setProjectForm({
      name: '',
      description: '',
      project_type: 'new_build',
      address_street: '',
      address_zip: '',
      address_city: '',
      address_country: 'Schweiz',
      construction_phase: '',
      property_size: '',
      construction_area: '',
      start_date: '',
      end_date: '',
      budget: '',
      is_public: true,
      allow_quotes: true
    });
    // Reset document upload state
    setUploadFiles([]);
    setShowUploadModal(false);
  };

  const handleProjectFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setProjectForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleFileSelection = (files: File[]) => {
    const newFiles = files.map(file => ({
      file,
      status: 'pending' as const,
      progress: 0,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    }));

    setUploadFiles(prev => [...prev, ...newFiles]);
    setShowUploadModal(true);
  };

  const getDocumentTypeFromFile = (filename: string): string => {
    const extension = filename.toLowerCase().split('.').pop();
    switch (extension) {
      case 'pdf': return 'pdf';
      case 'doc':
      case 'docx': return 'document';
      case 'xls':
      case 'xlsx': return 'spreadsheet';
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif': return 'image';
      case 'mp4':
      case 'avi':
      case 'mov': return 'video';
      default: return 'other';
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreatingProject(true);
    setCreateProjectError(null);

    try {
              // Formatiere die Daten für die API
        const projectData = {
          name: projectForm.name.trim(),
          description: projectForm.description.trim() || '',
          project_type: projectForm.project_type,
          status: 'planning', // Standard-Status für neue Projekte

          address_street: projectForm.address_street?.trim() || undefined,
          address_zip: projectForm.address_zip?.trim() || undefined,
          address_city: projectForm.address_city?.trim() || undefined,
          address_country: projectForm.address_country?.trim() || 'Schweiz',
          construction_phase: projectForm.construction_phase || undefined,
          property_size: projectForm.property_size ? parseFloat(projectForm.property_size) : undefined,
          construction_area: projectForm.construction_area ? parseFloat(projectForm.construction_area) : undefined,
          start_date: projectForm.start_date || undefined,
          end_date: projectForm.end_date || undefined,
          budget: projectForm.budget ? parseFloat(projectForm.budget) : undefined,
          is_public: true,
          allow_quotes: projectForm.allow_quotes
        };

      console.log('🚀 Erstelle neues Projekt mit Daten:', projectData);
      const newProject = await createProject(projectData);
      console.log('✅ Neues Projekt erstellt:', newProject);

      // Upload documents if any
      if (uploadFiles.length > 0) {
        console.log('📄 Lade Dokumente ins DMS hoch...');
        // Setze project_id für alle Upload-Dateien
        for (let i = 0; i < uploadFiles.length; i++) {
          const uploadFile = uploadFiles[i];
          
          // Nur kategorisierte Dateien hochladen
          if (!uploadFile.category) {
            console.warn(`⚠️ Dokument ${uploadFile.file.name} wurde nicht kategorisiert und wird übersprungen`);
            continue;
          }
          
          try {
            const formData = new FormData();
            formData.append('project_id', newProject.id.toString());
            formData.append('file', uploadFile.file);
            formData.append('title', uploadFile.file.name.replace(/\.[^/.]+$/, ""));
            formData.append('description', '');
            
            // Konvertiere Frontend-Kategorie zu Backend-Format (lowercase)
            const backendCategory = uploadFile.category.toLowerCase();
            formData.append('category', backendCategory);
            
            if (uploadFile.subcategory) {
              formData.append('subcategory', uploadFile.subcategory);
            }
            formData.append('document_type', getDocumentTypeFromFile(uploadFile.file.name));

            const response = await uploadDocument(formData);
            console.log(`✅ Dokument ${uploadFile.file.name} erfolgreich hochgeladen`);
          } catch (error) {
            console.error(`❌ Fehler beim Upload von ${uploadFile.file.name}:`, error);
          }
        }
        console.log('✅ Alle kategorisierten Dokumente wurden verarbeitet');
      }

      // Schließe Modal und lade Projekte neu
      handleCloseCreateProjectModal();
      await loadProjects();

      // Navigiere zur Startseite (Dashboard)
      navigate('/');

    } catch (error) {
      console.error('❌ Fehler beim Erstellen des Projekts:', error);
      setCreateProjectError(error instanceof Error ? error.message : 'Unbekannter Fehler beim Erstellen des Projekts');
    } finally {
      setIsCreatingProject(false);
    }
  };
  const handleUpdateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject) return;
    setIsUpdatingProject(true);
    setEditProjectError(null);
    try {
      const projectData = {
        name: projectForm.name.trim(),
        description: projectForm.description.trim() || '',
        project_type: projectForm.project_type,
        address_street: projectForm.address_street?.trim() || undefined,
        address_zip: projectForm.address_zip?.trim() || undefined,
        address_city: projectForm.address_city?.trim() || undefined,
        address_country: projectForm.address_country?.trim() || 'Deutschland',
        construction_phase: projectForm.construction_phase || undefined,
        property_size: projectForm.property_size ? parseFloat(projectForm.property_size) : undefined,
        construction_area: projectForm.construction_area ? parseFloat(projectForm.construction_area) : undefined,
        start_date: projectForm.start_date || undefined,
        end_date: projectForm.end_date || undefined,
        budget: projectForm.budget ? parseFloat(projectForm.budget) : undefined,
        is_public: true,
        allow_quotes: projectForm.allow_quotes
      } as any;
      await updateProject(selectedProject.id, projectData);
      setShowEditProjectModal(false);
      await loadProjects();
    } catch (error: any) {
      console.error('❌ Fehler beim Aktualisieren des Projekts:', error);
      setEditProjectError(error?.message || 'Unbekannter Fehler beim Aktualisieren des Projekts');
    } finally {
      setIsUpdatingProject(false);
    }
  };

  // Dokumenten-Upload-Funktionen (vollständiges DMS-System)
  const getFileIcon = (file: File) => {
    const extension = file.name.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf':
        return FileText;
      case 'doc':
      case 'docx':
        return FileText;
      case 'xls':
      case 'xlsx':
        return Calculator;
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return Camera;
      case 'mp4':
      case 'mov':
      case 'avi':
        return Camera;
      default:
        return FileText;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };



  const handleFilesSelected = (files: File[]) => {
    const newUploadFiles: UploadFile[] = files.map(file => {
      // Automatische Kategorisierung basierend auf Dateiname
      const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
      const detectedCategory = DocumentCategorizer.categorizeDocument(file.name, fileExtension);
      const suggestedSubcategory = detectedCategory ? DocumentCategorizer.suggestSubcategory(detectedCategory, file.name) : null;
      
      return {
        file,
        status: 'pending',
        progress: 0,
        autoDetected: !!detectedCategory,
        confidence: detectedCategory ? DocumentCategorizer.calculateConfidence(file.name, fileExtension, detectedCategory) : 0,
        suggestedCategory: detectedCategory?.id,
        suggestedSubcategory: suggestedSubcategory || undefined
      };
    });
    
    // Automatically accept suggestions for auto-detected files
    const autoAcceptedFiles = newUploadFiles.map(file => {
      if (file.autoDetected && file.suggestedCategory && file.suggestedSubcategory) {
        return {
          ...file,
          category: file.suggestedCategory,
          subcategory: file.suggestedSubcategory
        };
      }
      return file;
    });
    
    setUploadFiles(autoAcceptedFiles);
    setShowUploadModal(true);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    handleFilesSelected(files);
  };

  const assignCategoryToFile = (index: number, category: string, subcategory?: string) => {
    setUploadFiles(prev => prev.map((file, i) => 
      i === index ? { ...file, category, subcategory } : file
    ));
  };

  const removeUploadFile = (index: number) => {
    setUploadFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleAutoAcceptSuggestions = () => {
    setUploadFiles(prev => prev.map(file => {
      if (file.autoDetected && file.suggestedCategory && file.suggestedSubcategory) {
        return {
          ...file,
          category: file.suggestedCategory,
          subcategory: file.suggestedSubcategory
        };
      }
      return file;
    }));
  };

  const uploadDocument = async (formData: FormData) => {
    const response = await fetch('/api/v1/documents/upload', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: formData
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(errorData || 'Upload fehlgeschlagen');
    }

    return await response.json();
  };

  const confirmDocumentCategorization = () => {
    // Markiere alle Dateien als kategorisiert
    const allCategorized = uploadFiles.every(f => f.category);
    
    if (!allCategorized) {
      alert('Bitte kategorisieren Sie alle Dokumente bevor Sie fortfahren.');
      return;
    }

    // Schließe das Modal - die Dokumente werden beim "Projekt erstellen" hochgeladen
    setShowUploadModal(false);
    
    // Zeige Bestätigungsmeldung
    console.log('✅ Dokumente kategorisiert und bereit zum Upload beim Projekt erstellen');
  };

  // Handler für Create-Actions (können vom RadialMenu oder anderen Komponenten genutzt werden)
  const handleCreateTrade = () => {
    setShowTradeCreationForm(true);
  };

  const handleCreateTodo = () => {
    if (selectedProject) {
      navigate(`/tasks/create?project=${selectedProject.id}`);
    } else {
      navigate('/tasks/create');
    }
  };


  // Hilfsfunktionen für Projekt-Daten
  const getProjectTypeLabel = (type: string) => {
    switch (type) {
      case 'new_build': return 'Neubau';
      case 'renovation': return 'Renovierung';
      case 'extension': return 'Anbau';
      case 'refurbishment': return 'Sanierung';
      default: return type;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'planning': return 'Planung';
      case 'preparation': return 'Vorbereitung';
      case 'execution': return 'Ausführung';
      case 'completion': return 'Fertigstellung';
      case 'completed': return 'Abgeschlossen';
      case 'on_hold': return 'Pausiert';
      case 'cancelled': return 'Abgebrochen';
      default: return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planning': return 'text-blue-400';
      case 'preparation': return 'text-yellow-400';
      case 'execution': return 'text-green-400';
      case 'completion': return 'text-purple-400';
      case 'completed': return 'text-green-500';
      case 'on_hold': return 'text-orange-400';
      case 'cancelled': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  // Formatierung für Datum
  const formatDate = (dateString: string) => {
    if (!dateString) return 'Nicht festgelegt';
    const date = new Date(dateString);
    return date.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Berechnung der Werktage zwischen zwei Daten
  const calculateWorkingDays = (startDate: string, endDate: string) => {
    if (!startDate || !endDate) return 0;
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (start >= end) return 0;
    
    let workingDays = 0;
    const current = new Date(start);
    
    while (current < end) {
      const dayOfWeek = current.getDay();
      // Montag = 1, Dienstag = 2, ..., Samstag = 6, Sonntag = 0
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        workingDays++;
      }
      current.setDate(current.getDate() + 1);
    }
    
    return workingDays;
  };

  // Berechnung der Gesamttage zwischen zwei Daten
  const calculateTotalDays = (startDate: string, endDate: string) => {
    if (!startDate || !endDate) return 0;
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (start >= end) return 0;
    
    const timeDiff = end.getTime() - start.getTime();
    return Math.ceil(timeDiff / (1000 * 3600 * 24));
  };

  // Berechne Budget-Auslastung
  const getBudgetUtilization = (project: Project) => {
    if (!project.budget || project.budget === 0) return 0;
    return Math.round((project.current_costs / project.budget) * 100);
  };

  // Echte Dashboard-Statistiken
  const [statsLoading, setStatsLoading] = useState(false);
  const [projectStats, setProjectStats] = useState({
    activeTrades: 0,
    openTasks: 0,
    documentsTotal: 0,
    newQuotes: 0,
    notifications: 0,
    lastActivity: ''
  });

  const refreshProjectStats = async (project: Project | null) => {
    if (!project || !project.id) {
      setProjectStats({ activeTrades: 0, openTasks: 0, documentsTotal: 0, newQuotes: 0, notifications: 0, lastActivity: '' });
      return;
    }
    try {
      setStatsLoading(true);
      // 1) Aktive Gewerke: Milestones mit Status != completed/cancelled
      console.log(`📡 [ROBUST] Lade aktive Gewerke für Projekt ${project.id}`);
      let activeTrades = 0;
      try {
        const trades = await getMilestones(project.id);
        if (trades && Array.isArray(trades)) {
          activeTrades = trades.filter((t: any) => {
            const s = String(t.status || '').toLowerCase();
            return s !== 'completed' && s !== 'cancelled' && s !== 'archived';
          }).length;
          console.log(`✅ [ROBUST] ${activeTrades} aktive Gewerke gefunden von ${trades.length} total`);
        } else {
          console.warn(`⚠️ [ROBUST] Keine oder ungültige Trades erhalten:`, trades);
        }
      } catch (tradesError: any) {
        console.error(`❌ [ROBUST] Fehler beim Laden der Gewerke:`, tradesError);
      }

      // 2) Offene Aufgaben: Tasks mit Status != completed/cancelled
      console.log(`📡 [ROBUST] Lade Aufgaben für Projekt ${project.id}`);
      let openTasks = 0;
      try {
        const tasks = await getTasks(project.id);
        if (tasks && Array.isArray(tasks)) {
          openTasks = tasks.filter((t: any) => {
            const s = String(t.status || '').toLowerCase();
            return s !== 'completed' && s !== 'cancelled';
          }).length;
          console.log(`✅ [ROBUST] ${openTasks} offene Aufgaben gefunden von ${tasks.length} total`);
        } else {
          console.warn(`⚠️ [ROBUST] Keine oder ungültige Aufgaben erhalten:`, tasks);
        }
      } catch (tasksError: any) {
        console.error(`❌ [ROBUST] Fehler beim Laden der Aufgaben:`, tasksError);
      }

      // 3) Dokumente: Summe aller DMS-Dokumente (über Kategorien summiert)
      console.log(`📡 [ROBUST] Lade Dokument-Statistiken für Projekt ${project.id}`);
      let documentsTotal = 0;
      try {
        const categoryStats = await getCategoryStatistics(project.id);
        if (categoryStats && typeof categoryStats === 'object') {
          documentsTotal = Object.values(categoryStats).reduce((sum: number, cat: any) => sum + (cat?.total_documents || 0), 0);
          console.log(`✅ [ROBUST] ${documentsTotal} Dokumente gefunden`);
        } else {
          console.warn(`⚠️ [ROBUST] Keine oder ungültige Kategorie-Statistiken erhalten:`, categoryStats);
        }
      } catch (docError: any) {
        console.error(`❌ [ROBUST] Fehler beim Laden der Dokument-Statistiken:`, docError);
      }

      // 4) Neue Angebote: Angebote mit viewed === false
      console.log(`📡 [ROBUST] Lade Angebote für Projekt ${project.id}`);
      let newQuotes = 0;
      try {
        const quotes = await getQuotes(project.id);
        if (quotes && Array.isArray(quotes)) {
          const viewedLocalRaw = localStorage.getItem('viewed_quotes') || '[]';
          let viewedLocal: number[] = [];
          try { 
            viewedLocal = JSON.parse(viewedLocalRaw) as number[]; 
          } catch { 
            viewedLocal = []; 
          }
          
          newQuotes = quotes.filter((q: any) => {
            if (!q) return false;
            if (typeof q.viewed !== 'undefined') {
              return q.viewed === false || q.viewed === 0;
            }
            return !viewedLocal.includes(Number(q.id));
          }).length;
          
          console.log(`✅ [ROBUST] ${newQuotes} neue Angebote gefunden von ${quotes.length} total`);
        } else {
          console.warn(`⚠️ [ROBUST] Keine oder ungültige Angebote erhalten:`, quotes);
        }
      } catch (quoteError: any) {
        console.error(`❌ [ROBUST] Fehler beim Laden der Angebote:`, quoteError);
      }

      setProjectStats(prev => ({
        ...prev,
        activeTrades,
        openTasks,
        documentsTotal,
        newQuotes,
        lastActivity: prev.lastActivity
      }));
    } catch (e) {
      console.error('❌ Fehler beim Laden der Projekt-Statistiken:', e);
      setProjectStats({ activeTrades: 0, openTasks: 0, documentsTotal: 0, newQuotes: 0, notifications: 0, lastActivity: '' });
    } finally {
      setStatsLoading(false);
    }
  };

  // Fallback-Projekt falls keine Projekte geladen werden konnten
  const fallbackProject: Project = {
    id: 0,
    name: "Keine Projekte verfügbar",
    description: "Erstellen Sie Ihr erstes Projekt im Manager",
    project_type: "new_build",
    status: "planning",
    progress_percentage: 0,
    current_costs: 0,
    is_public: false,
    allow_quotes: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  const currentProject = selectedProject || fallbackProject;

  useEffect(() => {
    if (selectedProject) {
      void refreshProjectStats(selectedProject);
    } else {
      setProjectStats({ activeTrades: 0, openTasks: 0, documentsTotal: 0, newQuotes: 0, notifications: 0, lastActivity: '' });
    }
  }, [selectedProject?.id]);
  // Gewerke unterhalb des Projekt-Abschnitts
  const [projectTrades, setProjectTrades] = useState<any[]>([]);
  const [isLoadingTrades, setIsLoadingTrades] = useState(false);
  const [tradesError, setTradesError] = useState<string | null>(null);
  
  // Hilfsfunktion zum Filtern archivierter Gewerke
  const filterActiveTradesOnly = (trades: any[]) => {
    return (trades || []).filter((trade: any) => {
      const completionStatus = trade.completion_status;
      const isArchived = trade.archived;
      
      // Gewerk ist archiviert wenn completion_status = "archived" oder archived = true
      return completionStatus !== 'archived' && !isArchived;
    });
  };
  
  // Hilfsfunktion zum Laden und Filtern von Gewerken mit robuster Fehlerbehandlung
  const loadAndFilterTrades = async (projectId: number) => {
    console.log(`🔍 [ROBUST] loadAndFilterTrades aufgerufen für projectId: ${projectId}`);
    
    try {
      // Schritt 1: Validiere Projekt-ID
      if (!projectId || projectId <= 0) {
        console.error(`❌ [ROBUST] Ungültige projectId: ${projectId}`);
        return [];
      }

      // Schritt 2: Versuche Milestones zu laden
      console.log(`📡 [ROBUST] Lade Milestones für Projekt ${projectId}`);
      const allTrades = await getMilestones(projectId);
      
      if (!allTrades || !Array.isArray(allTrades)) {
        console.warn(`⚠️ [ROBUST] Keine oder ungültige Milestones erhalten:`, allTrades);
        return [];
      }

      console.log(`✅ [ROBUST] ${allTrades.length} Milestones geladen für Projekt ${projectId}`);

      // Schritt 3: Filtere aktive Trades
      const activeTrades = filterActiveTradesOnly(allTrades);
      console.log(`🔍 [ROBUST] Aktive Gewerke (ohne archivierte): ${activeTrades.length} von ${allTrades.length}`);
      
      return activeTrades;
    } catch (error: any) {
      console.error(`❌ [ROBUST] Fehler in loadAndFilterTrades für Projekt ${projectId}:`, error);
      
      // Fallback: Versuche alle Milestones zu laden und clientseitig zu filtern
      try {
        console.log(`🔄 [ROBUST] Versuche Fallback: lade alle Milestones`);
        const allMilestones = await getAllMilestones();
        
        if (allMilestones && Array.isArray(allMilestones)) {
          // Filtere nach Projekt-ID
          const projectMilestones = allMilestones.filter((milestone: any) => 
            milestone.project_id === projectId
          );
          
          const activeTrades = filterActiveTradesOnly(projectMilestones);
          console.log(`✅ [ROBUST] Fallback erfolgreich: ${activeTrades.length} aktive Trades für Projekt ${projectId}`);
          return activeTrades;
        }
      } catch (fallbackError: any) {
        console.error(`❌ [ROBUST] Auch Fallback fehlgeschlagen:`, fallbackError);
      }
      
      // Letzter Fallback: leere Liste
      console.log(`🔄 [ROBUST] Verwende letzten Fallback: leere Liste`);
      return [];
    }
  };
  
  // Modal-States (wie in Quotes.tsx)
  const [selectedTradeForDetails, setSelectedTradeForDetails] = useState<any | null>(null);
  const [showTradeDetailsModal, setShowTradeDetailsModal] = useState(false);

  const [selectedTradeForSimpleCostEstimate, setSelectedTradeForSimpleCostEstimate] = useState<any | null>(null);
  const [showSimpleCostEstimateModal, setShowSimpleCostEstimateModal] = useState(false);
  const [allTradeQuotes, setAllTradeQuotes] = useState<{[key: number]: any[]}>({});
  
  // State für Besichtigungs-Modal
  const [showCreateInspectionModal, setShowCreateInspectionModal] = useState(false);
  const [selectedTradeForInspection, setSelectedTradeForInspection] = useState<any>(null);
  const [selectedQuotesForInspection, setSelectedQuotesForInspection] = useState<any[]>([]);
  const [tradeInspectionStatus, setTradeInspectionStatus] = useState<{[key: number]: any}>({});
  const [tradeAppointments, setTradeAppointments] = useState<{[key: number]: any[]}>({});

  // State für Dokumenten-Sidebar und Viewer
  const [selectedDocument, setSelectedDocument] = useState<DocumentItem | null>(null);
  const [showDocumentViewer, setShowDocumentViewer] = useState(false);
  const [allDocuments, setAllDocuments] = useState<DocumentItem[]>([]);

  const loadAppointmentsForTrades = async (tradesList: any[]) => {
    console.log('🔄 loadAppointmentsForTrades aufgerufen für', tradesList.length, 'Gewerke');
    try {
      const appointments = await appointmentService.getMyAppointments();
      const tradeAppointmentsMap: {[key: number]: any[]} = {};
      
      tradesList.forEach(trade => {
        const relevantAppointments = appointments.filter(apt => 
          apt.milestone_id === trade.id && apt.appointment_type === 'INSPECTION'
        );
        tradeAppointmentsMap[trade.id] = relevantAppointments;
      });
      
      setTradeAppointments(tradeAppointmentsMap);
      console.log('✅ Trade Appointments geladen:', tradeAppointmentsMap);
    } catch (error) {
      console.error('❌ Fehler beim Laden der Besichtigungstermine:', error);
    }
  };

  const loadQuotesForTrades = async (tradesList: any[]) => {
    console.log('🔄 loadQuotesForTrades aufgerufen für', tradesList.length, 'Gewerke');
    try {
      console.log('🚀 loadAllTradeQuotes: Starte Laden für', tradesList.length, 'Trades');
      console.log('🚀 loadAllTradeQuotes: Trades:', tradesList.map(t => `${t.id}:${t.title}`));
      
      const entries: Array<[number, any[]]> = [];
      for (const t of tradesList) {
        try {
          console.log(`📋 Lade Quotes für Gewerk ${t.id} (${t.title})`);
          const quotes = await getQuotesForMilestone(t.id);
          console.log(`✅ Gefunden: ${quotes?.length || 0} Quotes für Gewerk ${t.id}`);
          
          // SPEZIELLE DEBUG-AUSGABE FÜR MILESTONE_ID=1
          if (t.id === 1) {
            console.log('🎯 SPEZIAL DEBUG für milestone_id=1:');
            console.log('   Quotes erhalten:', quotes);
            console.log('   Quotes Typ:', typeof quotes);
            console.log('   Quotes Array?:', Array.isArray(quotes));
            console.log('   Quotes Länge:', quotes?.length);
            if (quotes && quotes.length > 0) {
              quotes.forEach((q: any, idx: number) => {
                console.log(`   Quote ${idx + 1}:`, {
                  id: q.id,
                  status: q.status,
                  total_amount: q.total_amount,
                  company_name: q.company_name
                });
              });
            }
          }
          
          entries.push([t.id, quotes || []]);
        } catch (e) {
          console.error('❌ Fehler beim Laden der Quotes für Trade', t.id, e);
          entries.push([t.id, []]);
        }
      }
      const mapping: {[key: number]: any[]} = {};
      for (const [id, quotes] of entries) {
        mapping[id] = quotes;
        if (quotes.length > 0) {
          console.log(`📊 Gewerk ${id} hat ${quotes.length} Quotes:`, quotes.map(q => `${q.id}:${q.status}`));
        }
      }
      console.log('🎯 Finales allTradeQuotes mapping:', mapping);
      
      // SPEZIELLE DEBUG-AUSGABE FÜR MILESTONE_ID=1 IM MAPPING
      if (mapping[1]) {
        console.log('🎯 MAPPING DEBUG für milestone_id=1:', mapping[1]);
        console.log('🎯 MAPPING DEBUG Anzahl:', mapping[1].length);
      } else {
        console.log('❌ MAPPING DEBUG: Keine Quotes für milestone_id=1 im finalen Mapping!');
      }
      
      setAllTradeQuotes(mapping);
    } catch (e) {
      console.error('❌ Fehler beim Laden der Quotes für alle Trades:', e);
      setAllTradeQuotes({});
    }
  };
  
  // Gewerk-Erstellung
  const [showTradeCreationForm, setShowTradeCreationForm] = useState(false);
  
  // Task Creation Modal State
  const [showTaskCreationModal, setShowTaskCreationModal] = useState(false);
  
  // State für eingeklappte abgeschlossene Ausschreibungen (standardmäßig aufgeklappt)
  const [showCompletedTrades, setShowCompletedTrades] = useState(true);
  
  // Ref für To-Do Aufgaben Abschnitt
  const todoSectionRef = useRef<HTMLDivElement>(null);
  
  // Funktion zum Scrollen zum To-Do Aufgaben Abschnitt
  const scrollToTodoSection = () => {
    if (todoSectionRef.current) {
      todoSectionRef.current.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
    }
  };

  useEffect(() => {
    const loadProjectTrades = async () => {
      if (!selectedProject) {
        console.log(`🔍 [ROBUST] Kein Projekt ausgewählt, setze leere Trades`);
        setProjectTrades([]);
        return;
      }
      
      console.log(`🔍 [ROBUST] loadProjectTrades aufgerufen für Projekt: ${selectedProject.id} (${selectedProject.name})`);
      
      try {
        setIsLoadingTrades(true);
        setTradesError(null);
        
        // Verwende die robuste loadAndFilterTrades Funktion
        const activeTrades = await loadAndFilterTrades(selectedProject.id);
        
        console.log(`✅ [ROBUST] ${activeTrades.length} aktive Trades geladen für Projekt ${selectedProject.id}`);
        setProjectTrades(activeTrades);
        
        if (activeTrades && activeTrades.length > 0) {
          console.log(`📡 [ROBUST] Lade Quotes für ${activeTrades.length} Trades`);
          void loadQuotesForTrades(activeTrades);
        } else {
          console.log(`ℹ️ [ROBUST] Keine aktiven Trades, setze leere Quotes`);
          setAllTradeQuotes({});
        }
      } catch (e: any) {
        console.error(`❌ [ROBUST] Fehler beim Laden der Gewerke für Projekt ${selectedProject.id}:`, e);
        setTradesError(`Gewerke konnten nicht geladen werden: ${e.message}`);
        setProjectTrades([]);
        setAllTradeQuotes({});
        
        // Zeige Benutzer-freundliche Fehlermeldung
        console.log(`ℹ️ [ROBUST] Zeige Fehlermeldung für Benutzer`);
      } finally {
        setIsLoadingTrades(false);
        console.log(`✅ [ROBUST] loadProjectTrades abgeschlossen für Projekt ${selectedProject.id}`);
      }
    };
    
    loadProjectTrades();
  }, [selectedProject?.id]);

  useEffect(() => {
    console.log('🔄 useEffect projectTrades triggered:', {
      projectTrades: projectTrades,
      projectTradesLength: projectTrades?.length,
      shouldLoadQuotes: projectTrades && projectTrades.length > 0
    });
    if (projectTrades && projectTrades.length > 0) {
      console.log('🚀 Rufe loadQuotesForTrades auf...');
      void loadQuotesForTrades(projectTrades);
      console.log('🚀 Rufe loadAppointmentsForTrades auf...');
      void loadAppointmentsForTrades(projectTrades);
    } else {
      console.log('❌ Keine Gewerke zum Laden von Quotes');
    }
  }, [projectTrades]);

  // Window-Handler für TradeDetailsModal setzen
  useEffect(() => {
    const handleAccept = async (quoteId: number) => {
      try {
        // Angebot annehmen
        await acceptQuoteWithAnimation(quoteId);
        
        // Finde das Gewerk zu dem das Angebot gehört
        const acceptedQuote = Object.values(allTradeQuotes)
          .flat()
          .find(q => q.id === quoteId);
        
        if (acceptedQuote?.milestone_id) {
          // Finde alle anderen Angebote für das gleiche Gewerk
          const otherQuotes = (allTradeQuotes[acceptedQuote.milestone_id] || [])
            .filter(q => 
              q.id !== quoteId && 
              !['accepted', 'rejected'].includes(String(q.status).toLowerCase())
            );
          
          // Alle anderen Angebote automatisch ablehnen
          for (const quote of otherQuotes) {
            try {
              await rejectQuote(quote.id, 'Automatisch abgelehnt: Anderes Angebot wurde angenommen');
              console.log(`✅ Angebot ${quote.id} automatisch abgelehnt`);
            } catch (rejectError) {
              console.warn(`⚠️ Konnte Angebot ${quote.id} nicht automatisch ablehnen:`, rejectError);
            }
          }
          
          setSuccess(`Angebot erfolgreich angenommen! ${otherQuotes.length} andere Angebote wurden automatisch abgelehnt.`);
        } else {
          setSuccess('Angebot erfolgreich angenommen!');
        }
        
        setTimeout(() => setSuccess(''), 5000);
        
        // Gewerke und Angebote neu laden
        if (selectedProject?.id) {
          const activeTrades = await loadAndFilterTrades(selectedProject.id);
          setProjectTrades(activeTrades);
          await loadQuotesForTrades(activeTrades);
        }
      } catch (e: any) {
        console.error('❌ Fehler beim Annehmen:', e);
        setError('Fehler beim Annehmen des Angebots: ' + (e.message || 'Unbekannter Fehler'));
      }
    };

    const handleReject = async (quoteId: number, reason: string) => {
      try {
        await rejectQuote(quoteId, reason);
        setSuccess('Angebot erfolgreich abgelehnt!');
        setTimeout(() => setSuccess(''), 3000);
        
        // Gewerke und Angebote neu laden
        if (selectedProject?.id) {
          const activeTrades = await loadAndFilterTrades(selectedProject.id);
          setProjectTrades(activeTrades);
          await loadQuotesForTrades(activeTrades);
        }
      } catch (e: any) {
        console.error('❌ Fehler beim Ablehnen:', e);
        setError('Fehler beim Ablehnen des Angebots: ' + (e.message || 'Unbekannter Fehler'));
      }
    };

    (window as any).__onAcceptQuote = handleAccept;
    (window as any).__onRejectQuote = handleReject;
    
    return () => {
      delete (window as any).__onAcceptQuote;
      delete (window as any).__onRejectQuote;
    };
  }, [selectedProject?.id, allTradeQuotes]);

  // Warte auf AuthContext-Initialisierung
  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#ffbd59] mx-auto mb-4"></div>
          <p className="text-white">Initialisiere Dashboard...</p>
        </div>
      </div>
    );
  }

  // Zeige Login-Aufforderung wenn nicht authentifiziert
  if (!isAuthenticated()) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460] flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="bg-blue-500/20 border border-blue-500/30 rounded-xl p-6 mb-4">
            <h2 className="text-xl font-semibold text-blue-300 mb-2">Anmeldung erforderlich</h2>
            <p className="text-blue-200 mb-4">Bitte melden Sie sich an, um auf Ihre Projekte zuzugreifen.</p>
            <button
              onClick={() => navigate('/login')}
              className="bg-[#ffbd59] text-[#2c3539] px-4 py-2 rounded-lg font-medium hover:bg-[#ffa726] transition-colors"
            >
              Zum Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Zeige Loading während Projekte geladen werden
  if (projectsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#ffbd59] mx-auto mb-4"></div>
          <p className="text-white">Lade Projekte...</p>
        </div>
      </div>
    );
  }

  // Zeige Fehler wenn Projekte nicht geladen werden konnten
  if (projectsError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460] flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-6 mb-4">
            <h2 className="text-xl font-semibold text-red-300 mb-2">Fehler beim Laden der Projekte</h2>
            <p className="text-red-200 mb-4">{projectsError}</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-[#ffbd59] text-[#2c3539] px-4 py-2 rounded-lg font-medium hover:bg-[#ffa726] transition-colors"
            >
              Seite neu laden
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Note: Die Navigation erfolgt jetzt über das RadialMenu
  // Die Handler-Funktionen bleiben für die Wiederverwendung in anderen Komponenten erhalten

  // Intelligente Modal-Auswahl (aus Quotes.tsx)
  const openExclusiveModal = (target: 'trade' | 'cost' | 'simple', trade: any) => {
    console.log('🔧 openExclusiveModal aufgerufen:', { target, trade: trade?.id, title: trade?.title });
    
    // Schließe ALLE Modals
    setShowTradeDetailsModal(false);
    setSelectedTradeForDetails(null);
    setShowSimpleCostEstimateModal(false);
    setSelectedTradeForSimpleCostEstimate(null);
    
    // Öffne die gewünschte Modal
    if (target === 'trade') {
      console.log('🟥 ÖFFNE: TradeDetailsModal (Bauträger)');
      setSelectedTradeForDetails(trade);
      setShowTradeDetailsModal(true);
    } else if (target === 'simple' || target === 'cost') {
      // 'cost' wird zu 'simple' umgeleitet für Rückwärtskompatibilität
      console.log('🟦 ÖFFNE: SimpleCostEstimateModal (Dienstleister)');
      setSelectedTradeForSimpleCostEstimate(trade);
      setShowSimpleCostEstimateModal(true);
    }
  };

  // Besichtigung erstellen Handler
  const handleCreateInspection = (tradeId: number, selectedQuoteIds: number[]) => {
    console.log('🗓️ handleCreateInspection aufgerufen:', { tradeId, selectedQuoteIds });
    
    const trade = projectTrades.find(t => t.id === tradeId);
    if (!trade) {
      console.error('❌ Gewerk nicht gefunden:', tradeId);
      return;
    }
    
    const quotes = allTradeQuotes[tradeId] || [];
    const selectedQuotes = quotes.filter(q => selectedQuoteIds.includes(q.id));
    
    console.log('🗓️ Ausgewählte Angebote für Besichtigung:', selectedQuotes);
    
    setSelectedTradeForInspection(trade);
    setSelectedQuotesForInspection(selectedQuotes);
    
    // Schließe andere Modals
    setShowTradeDetailsModal(false);
    setShowSimpleCostEstimateModal(false);
    
    // Öffne Besichtigungs-Modal nach kurzer Verzögerung
    setTimeout(() => {
      setShowCreateInspectionModal(true);
    }, 150);
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
      
      // Gewerke neu laden um aktuelle Termine zu reflektieren
      if (selectedProject?.id) {
        const activeTrades = await loadAndFilterTrades(selectedProject.id);
                setProjectTrades(activeTrades);
                await loadQuotesForTrades(activeTrades);
                await loadAppointmentsForTrades(activeTrades);
      }
      
    } catch (err: any) {
      console.error('❌ Fehler beim Verarbeiten der Besichtigung:', err);
      setError('Fehler beim Erstellen der Besichtigung: ' + (err.message || 'Unbekannter Fehler'));
    }
  };



  const handleTradeClick = async (trade: any) => {
    console.log('🔍 handleTradeClick aufgerufen:', {
      trade: trade,
      tradeId: trade.id,
      quotes: allTradeQuotes[trade.id] || [],
      quotesLength: (allTradeQuotes[trade.id] || []).length,
      userType: user?.user_type,
      allTradeQuotes: allTradeQuotes,
      allTradeQuotesKeys: Object.keys(allTradeQuotes),
      tradeIdType: typeof trade.id
    });

    // DEBUG: Welches Modal wird geöffnet?
    console.log('🎯 MODAL ENTSCHEIDUNG:', {
      isBautraeger: user?.user_type === 'project_owner',
      userType: user?.user_type,
      userRole: user?.user_role,
      quotesAvailable: (allTradeQuotes[trade.id] || []).length > 0,
      willOpenTradeDetails: user?.user_type === 'project_owner',
      willOpenSimpleCostEstimate: user?.user_type !== 'project_owner'
    });

    // 🚀 WORKAROUND: Lade Quotes direkt beim Klick, falls sie nicht vorhanden sind
    let currentQuotes = allTradeQuotes[trade.id] || [];
    if (currentQuotes.length === 0) {
      console.log('🔄 Keine Quotes im Cache, lade direkt für Trade', trade.id);
      try {
        const freshQuotes = await getQuotesForMilestone(trade.id);
        console.log('✅ Fresh Quotes geladen:', freshQuotes?.length || 0);
        currentQuotes = freshQuotes || [];
        
        // Aktualisiere den Cache
        setAllTradeQuotes(prev => ({
          ...prev,
          [trade.id]: currentQuotes
        }));
      } catch (e) {
        console.error('❌ Fehler beim Laden der Fresh Quotes:', e);
      }
    }

    console.log('🔍 MODAL STATES BEFORE CLICK:', {
      showSimpleCostEstimateModal,
      showTradeDetailsModal,
      selectedTradeForSimpleCostEstimate: selectedTradeForSimpleCostEstimate?.id,
      selectedTradeForDetails: selectedTradeForDetails?.id
    });

    // Robuste Bauträger-Erkennung (Role oder Type)
    const isBautraegerUser = (user?.user_role?.toUpperCase?.() === 'BAUTRAEGER') || (user?.user_type === 'bautraeger') || (user?.user_type === 'developer');

    console.log('🔍 Benutzer-Erkennung:', {
      'user?.user_role': user?.user_role,
      'user?.user_type': user?.user_type,
      'isBautraegerUser': isBautraegerUser,
      'user object': user
    });

  // Für Bauträger: Intelligente Modal-Auswahl basierend auf Angebotsstatus
    if (isBautraegerUser) {
      const quotes = currentQuotes; // Verwende die aktuell geladenen Quotes
      const hasAccepted = quotes.some(q => String(q.status).toLowerCase() === 'accepted');
      
      console.log('🔍 Bauträger Klick Debug:', {
        tradeId: trade.id,
        quotesCount: quotes.length,
        quotesStatus: quotes.map(q => q.status),
        quotesDetails: quotes.map(q => ({ id: q.id, status: q.status, company: q.company_name })),
        hasAccepted,
        userRole: user?.user_role,
        userType: user?.user_type,
        willOpenModal: hasAccepted ? 'SimpleCostEstimateModal' : 'TradeDetailsModal'
      });
      
      if (hasAccepted) {
        // Ein Angebot wurde angenommen → SimpleCostEstimateModal mit Dienstleister-Infos
        console.log('✅ (Bauträger) Angebot angenommen → SimpleCostEstimateModal', { tradeId: trade.id, quotes });
        openExclusiveModal('simple', trade);
      } else {
        // Noch kein Angebot angenommen → TradeDetailsModal (egal ob Angebote vorhanden oder nicht)
        console.log('📋 (Bauträger) Kein Angebot angenommen → TradeDetailsModal', { 
          tradeId: trade.id, 
          quotesCount: quotes.length,
          hasQuotes: quotes.length > 0 
        });
        openExclusiveModal('trade', trade);
      }
      return;
    }

    // Für Dienstleister: Immer TradeDetailsModal öffnen (enthält "Mein Angebot" Abschnitt)
    console.log('📋 Öffne TradeDetailsModal für Dienstleister - Trade', trade.id);
    openExclusiveModal('trade', trade);
  };

  // Handler für Dokumenten-Sidebar
  const handleDocumentClick = (document: DocumentItem) => {
    setSelectedDocument(document);
    setShowDocumentViewer(true);
  };

  const handleDocumentViewerClose = () => {
    setShowDocumentViewer(false);
    setSelectedDocument(null);
  };

  const handleDocumentNavigate = (direction: 'prev' | 'next') => {
    if (!selectedDocument || allDocuments.length === 0) return;
    
    const currentIndex = allDocuments.findIndex(doc => doc.id === selectedDocument.id);
    if (currentIndex === -1) return;
    
    let newIndex = currentIndex;
    if (direction === 'prev' && currentIndex > 0) {
      newIndex = currentIndex - 1;
    } else if (direction === 'next' && currentIndex < allDocuments.length - 1) {
      newIndex = currentIndex + 1;
    }
    
    if (newIndex !== currentIndex) {
      setSelectedDocument(allDocuments[newIndex]);
    }
  };

  // Check if navigation is possible
  const canNavigatePrev = selectedDocument && allDocuments.length > 0 
    ? allDocuments.findIndex(doc => doc.id === selectedDocument.id) > 0
    : false;
    
  const canNavigateNext = selectedDocument && allDocuments.length > 0
    ? allDocuments.findIndex(doc => doc.id === selectedDocument.id) < allDocuments.length - 1
    : false;

  // Prüfe ob User Bauträger ist
  const isBautraegerUser = (
    user?.user_type === 'project_owner' ||
    user?.user_type === 'bautraeger' ||
    user?.user_type === 'developer' ||
    user?.user_role === 'BAUTRAEGER'
  );


  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460] p-4 md:p-6">
      {/* Header mit Projekt-Informationen */}
      <div className="mb-6 md:mb-8">
        <div className="mb-4 md:mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
                Willkommen zurück, {user?.first_name || user?.name || 'Bauträger'}! 👋
              </h1>
              <p className="text-gray-300 text-base md:text-lg md:block hidden md:whitespace-normal">
                Hier ist dein Dashboard - verwalte deine Bauprojekte effizient und behalte den Überblick über alle wichtigen Aspekte deiner Bauvorhaben.
              </p>
              <p className="text-gray-300 text-base md:hidden block whitespace-nowrap overflow-hidden text-ellipsis">
                Dein Dashboard - Bauprojekte verwalten.
              </p>
            </div>
            <div className="flex items-center space-x-2 md:ml-4">
              <div className={`w-3 h-3 rounded-full ${isOnline ? 'bg-green-400' : 'bg-red-400'}`}></div>
              <span className="text-sm text-gray-300">{isOnline ? 'Online' : 'Offline'}</span>
            </div>
          </div>
        </div>

        {/* Fixierte Schnellzugriff-Kacheln */}
        <div className="sticky top-0 z-40 bg-gradient-to-br from-[#1a1a2e]/95 via-[#16213e]/95 to-[#0f3460]/95 backdrop-blur-lg border-b border-white/10 mb-4 md:mb-6 -mx-4 md:-mx-6 px-4 md:px-6 py-3 md:py-4">
          <div className="grid grid-cols-4 gap-3 md:gap-4 lg:gap-6" data-tour-id="dashboard-projects">
            {/* Quick Stats */}
            <div 
              className={`backdrop-blur-lg rounded-xl p-3 md:p-4 lg:p-5 border shadow-lg transition-all duration-300 group transform ${
                projects.length === 0 
                  ? 'bg-white/5 border-gray-600/30 cursor-not-allowed opacity-50' 
                  : 'bg-white/10 border-[#ffbd59]/30 hover:border-[#ffbd59]/60 shadow-[#ffbd59]/20 hover:shadow-[#ffbd59]/40 hover:bg-white/15 cursor-pointer hover:scale-105'
              }`}
              onClick={projects.length === 0 ? undefined : () => {
                const tradesSection = document.querySelector('[data-section="trades"]');
                if (tradesSection) {
                  tradesSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
              }}
              title={projects.length === 0 ? "Erstellen Sie zuerst ein Projekt" : "Zu den Gewerken scrollen"}
            >
              <div className="flex items-center justify-between mb-2 md:mb-3">
                <Users size={18} className={`md:w-6 md:h-6 transition-transform duration-200 ${
                  projects.length === 0 ? 'text-gray-500' : 'text-[#ffbd59] group-hover:scale-110'
                }`} />
                  <span className="text-xl md:text-2xl lg:text-3xl font-bold text-white">{projectStats.activeTrades}</span>
              </div>
                <p className="text-sm md:text-base text-gray-300">Aktive Ausschreibungen</p>
            </div>
            
            <div 
              className={`backdrop-blur-lg rounded-xl p-3 md:p-4 lg:p-5 border shadow-lg transition-all duration-300 group transform ${
                projects.length === 0 
                  ? 'bg-white/5 border-gray-600/30 cursor-not-allowed opacity-50' 
                  : 'bg-white/10 border-[#ffbd59]/30 hover:border-[#ffbd59]/60 shadow-[#ffbd59]/20 hover:shadow-[#ffbd59]/40 hover:bg-white/15 cursor-pointer hover:scale-105'
              }`}
              onClick={projects.length === 0 ? undefined : scrollToTodoSection}
              title={projects.length === 0 ? "Erstellen Sie zuerst ein Projekt" : "Zu den To-Do Aufgaben scrollen"}
            >
              <div className="flex items-center justify-between mb-2 md:mb-3">
                <CheckSquare size={18} className={`md:w-6 md:h-6 transition-transform duration-200 ${
                  projects.length === 0 ? 'text-gray-500' : 'text-green-400 group-hover:scale-110'
                }`} />
                  <span className="text-xl md:text-2xl lg:text-3xl font-bold text-white">{projectStats.openTasks}</span>
              </div>
              <p className="text-sm md:text-base text-gray-300">Offene Aufgaben</p>
            </div>
            
            <div 
              className={`backdrop-blur-lg rounded-xl p-3 md:p-4 lg:p-5 border shadow-lg transition-all duration-300 group transform ${
                projects.length === 0 
                  ? 'bg-white/5 border-gray-600/30 cursor-not-allowed opacity-50' 
                  : 'bg-white/10 border-[#ffbd59]/30 hover:border-[#ffbd59]/60 shadow-[#ffbd59]/20 hover:shadow-[#ffbd59]/40 hover:bg-white/15 cursor-pointer hover:scale-105'
              }`}
              onClick={projects.length === 0 ? undefined : () => navigate('/documents')}
              title={projects.length === 0 ? "Erstellen Sie zuerst ein Projekt" : "Zum intelligenten DMS"}
            >
              <div className="flex items-center justify-between mb-2 md:mb-3">
                <FileText size={18} className={`md:w-6 md:h-6 transition-transform duration-200 ${
                  projects.length === 0 ? 'text-gray-500' : 'text-blue-400 group-hover:scale-110'
                }`} />
                  <span className="text-xl md:text-2xl lg:text-3xl font-bold text-white">{projectStats.documentsTotal}</span>
              </div>
                <p className="text-sm md:text-base text-gray-300">Dokumente</p>
            </div>
            
            <div 
              className={`backdrop-blur-lg rounded-xl p-3 md:p-4 lg:p-5 border shadow-lg transition-all duration-300 group transform ${
                projects.length === 0 
                  ? 'bg-white/5 border-gray-600/30 cursor-not-allowed opacity-50' 
                  : 'bg-white/10 border-[#ffbd59]/30 hover:border-[#ffbd59]/60 shadow-[#ffbd59]/20 hover:shadow-[#ffbd59]/40 hover:bg-white/15 cursor-pointer hover:scale-105'
              }`}
              onClick={projects.length === 0 ? undefined : () => {
                const financialSection = document.querySelector('[data-section="financial-analysis"]');
                if (financialSection) {
                  financialSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
              }}
              title={projects.length === 0 ? "Erstellen Sie zuerst ein Projekt" : "Zu den Finanzen scrollen"}
            >
              <div className="flex items-center justify-between mb-2 md:mb-3">
                <DollarSign size={18} className={`md:w-6 md:h-6 transition-transform duration-200 ${
                  projects.length === 0 ? 'text-gray-500' : 'text-green-400 group-hover:scale-110'
                }`} />
                  <span className="text-xl md:text-2xl lg:text-3xl font-bold text-white">
                    {(() => {
                      // Verwende die gleiche Berechnung wie in ProjectFinancialAnalysis
                      if (!currentProject.budget) return 'N/A';
                      const remainingBudget = currentProject.budget - currentProject.current_costs;
                      return `${remainingBudget.toLocaleString('de-DE')} €`;
                    })()}
                  </span>
              </div>
              <p className="text-sm md:text-base text-gray-300">Finanzen</p>
            </div>
          </div>
        </div>



        {/* Projekt-Auswahl mit Swipe-Funktionalität */}
        {projects.length > 0 && (
          <div 
            {...swipeHandlers}
            className="relative bg-white/10 backdrop-blur-lg rounded-2xl p-4 md:p-6 border border-white/20 transition-all duration-300 hover:bg-white/15"
          >
            <div className="mb-4">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-3 h-3 bg-[#ffbd59] rounded-full"></div>
                <span className="text-sm text-gray-400">Aktuelles Projekt</span>
              </div>
              
              {/* Desktop: Projektnavigation mit Dots */}
              <div className="hidden lg:flex justify-center mb-4">
                {/* Dot-Indikatoren */}
                <div className="flex items-center gap-3">
                  {projects.map((_, index) => (
                    <button
                      key={`desktop-dot-${index}`}
                      onClick={() => setSelectedProjectIndex(index)}
                      className={`transition-all duration-300 ${
                        index === selectedProjectIndex
                          ? 'w-3 h-3 bg-[#ffbd59] shadow-lg shadow-[#ffbd59]/50 ring-2 ring-[#ffbd59]/30'
                          : 'w-2 h-2 bg-white/30 hover:bg-white/50'
                      } rounded-full hover:scale-125 active:scale-110`}
                      title={`Zu Projekt ${index + 1} wechseln`}
                    />
                  ))}
                </div>
              </div>

              {/* Tablet/Mobile: Projektnavigation mit Dots */}
              <div className="lg:hidden mb-4">
                <div className="text-center mb-3">
                  <div className="text-xs text-gray-400">
                    Wischen oder Punkt antippen zum Wechseln
                  </div>
                </div>
                
                {/* Dot-Indikatoren für Tablet/Mobile */}
                <div className="flex items-center justify-center gap-4">
                  {projects.map((_, index) => (
                    <button
                      key={`tablet-dot-${index}`}
                      onClick={() => setSelectedProjectIndex(index)}
                      className={`transition-all duration-300 ${
                        index === selectedProjectIndex
                          ? 'w-5 h-5 bg-[#ffbd59] shadow-lg shadow-[#ffbd59]/50 ring-2 ring-[#ffbd59]/30'
                          : 'w-4 h-4 bg-white/30 hover:bg-white/50'
                      } rounded-full hover:scale-125 active:scale-110 touch-manipulation`}
                      title={`Zu Projekt ${index + 1} wechseln`}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="mb-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between mb-3 gap-3">
                <h2 className="text-xl md:text-2xl font-bold text-white">{currentProject.name}</h2>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleOpenEditProjectModal}
                    className="px-3 md:px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white text-sm md:text-base"
                    title="Projekt bearbeiten"
                  >
                    <Edit size={16} />
                    Bearbeiten
                  </button>
                  <button
                    onClick={handleProjectDetailsClick}
                    className="bg-[#ffbd59] text-[#2c3539] px-3 md:px-4 py-2 rounded-lg font-medium hover:bg-[#ffa726] transition-colors flex items-center gap-2 text-sm md:text-base"
                    data-tour-id="project-details"
                  >
                    <Eye size={16} />
                    Details
                  </button>
                </div>
              </div>
              
              {/* Prominente Start- und Enddaten unter dem Titel */}
              <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-6 mb-4">
                <div className="group relative flex items-center gap-3 px-3 md:px-4 py-2 rounded-xl bg-green-500/10 border border-green-500/30 shadow-lg shadow-green-500/20 hover:bg-green-500/20 hover:border-green-500/50 hover:shadow-xl hover:shadow-green-500/30 transition-all duration-300 cursor-pointer">
                  <div className="w-3 h-3 bg-green-400 rounded-full shadow-lg shadow-green-400/50 group-hover:shadow-green-400/80 transition-all duration-300"></div>
                  <span className="text-sm font-semibold text-green-300 group-hover:text-green-200 transition-colors duration-300">Start:</span>
                  <span className="text-sm font-bold text-green-100 group-hover:text-white transition-colors duration-300">{formatDate(currentProject.start_date || '')}</span>
                  
                  {/* Tooltip für Startdatum */}
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900/95 backdrop-blur-sm border border-green-500/30 rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none z-10">
                    <div className="text-xs text-green-300 font-medium mb-1">Projektstart</div>
                    <div className="text-sm text-white font-semibold">{formatDate(currentProject.start_date || '')}</div>
                    {currentProject.start_date && (
                      <div className="text-xs text-gray-400 mt-1">
                        {new Date(currentProject.start_date).toLocaleDateString('de-DE', { 
                          weekday: 'long',
                          day: '2-digit',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </div>
                    )}
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900/95"></div>
                  </div>
                </div>
                
                <div className="group relative flex items-center gap-3 px-3 md:px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/30 shadow-lg shadow-red-500/20 hover:bg-red-500/20 hover:border-red-500/50 hover:shadow-xl hover:shadow-red-500/30 transition-all duration-300 cursor-pointer">
                  <div className="w-3 h-3 bg-red-400 rounded-full shadow-lg shadow-red-400/50 group-hover:shadow-red-400/80 transition-all duration-300"></div>
                  <span className="text-sm font-semibold text-red-300 group-hover:text-red-200 transition-colors duration-300">Ende:</span>
                  <span className="text-sm font-bold text-red-100 group-hover:text-white transition-colors duration-300">{formatDate(currentProject.end_date || '')}</span>
                  
                  {/* Tooltip für Enddatum */}
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900/95 backdrop-blur-sm border border-red-500/30 rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none z-10">
                    <div className="text-xs text-red-300 font-medium mb-1">Projektende</div>
                    <div className="text-sm text-white font-semibold">{formatDate(currentProject.end_date || '')}</div>
                    {currentProject.end_date && (
                      <div className="text-xs text-gray-400 mt-1">
                        {new Date(currentProject.end_date).toLocaleDateString('de-DE', { 
                          weekday: 'long',
                          day: '2-digit',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </div>
                    )}
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900/95"></div>
                  </div>
                </div>
                
                {/* Projektlaufzeit Tooltip */}
                {currentProject.start_date && currentProject.end_date && (
                  <div className="group relative flex items-center gap-3 px-4 py-2 rounded-xl bg-blue-500/10 border border-blue-500/30 shadow-lg shadow-blue-500/20 hover:bg-blue-500/20 hover:border-blue-500/50 hover:shadow-xl hover:shadow-blue-500/30 transition-all duration-300 cursor-pointer">
                    <div className="w-3 h-3 bg-blue-400 rounded-full shadow-lg shadow-blue-400/50 group-hover:shadow-blue-400/80 transition-all duration-300"></div>
                    <span className="text-sm font-semibold text-blue-300 group-hover:text-blue-200 transition-colors duration-300">Dauer:</span>
                    <span className="text-sm font-bold text-blue-100 group-hover:text-white transition-colors duration-300">
                      {calculateTotalDays(currentProject.start_date, currentProject.end_date)} Tage
                    </span>
                    
                    {/* Tooltip für Projektlaufzeit */}
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900/95 backdrop-blur-sm border border-blue-500/30 rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none z-10 min-w-[200px]">
                      <div className="text-xs text-blue-300 font-medium mb-2">Projektlaufzeit</div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-400">Gesamttage:</span>
                          <span className="text-white font-semibold">{calculateTotalDays(currentProject.start_date, currentProject.end_date)} Tage</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-400">Werktage:</span>
                          <span className="text-white font-semibold">{calculateWorkingDays(currentProject.start_date, currentProject.end_date)} Tage</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-400">Wochenenden:</span>
                          <span className="text-white font-semibold">
                            {calculateTotalDays(currentProject.start_date, currentProject.end_date) - calculateWorkingDays(currentProject.start_date, currentProject.end_date)} Tage
                          </span>
                        </div>
                      </div>
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900/95"></div>
                    </div>
                  </div>
                )}
              </div>
              {/* Einklappbare Projektbeschreibung */}
              {currentProject.description && (
                <div className="mb-3">
                  {(() => {
                    const maxLength = 150; // Maximale Anzahl Zeichen vor dem Einklappen
                    const isLongText = currentProject.description.length > maxLength;
                    const displayText = isDescriptionExpanded || !isLongText 
                      ? currentProject.description 
                      : currentProject.description.substring(0, maxLength) + '...';
                    
                    return (
                      <div>
                        <div className="text-gray-300 leading-relaxed whitespace-pre-wrap break-words">
                          {displayText}
                        </div>
                        {isLongText && (
                          <button
                            onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                            className="mt-2 text-[#ffbd59] hover:text-[#ffa726] text-sm font-medium transition-colors flex items-center gap-1"
                          >
                            {isDescriptionExpanded ? (
                              <>
                                <span>Weniger anzeigen</span>
                                <svg className="w-4 h-4 transform rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                              </>
                            ) : (
                              <>
                                <span>Mehr anzeigen</span>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    );
                  })()}
                </div>
              )}
              
              {/* Projektanschrift mit Hover-Effekt */}
              {(currentProject.address || (currentProject.address_street && currentProject.address_city)) && (
                <div className="group relative mb-4">
                  <div 
                    className="flex items-center gap-2 p-3 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 group-hover:bg-white/10 group-hover:border-[#ffbd59]/30 transition-all duration-300 cursor-pointer"
                    onClick={handleProjectDetailsClick}
                    title="Klicken Sie für Projekt-Details"
                  >
                    <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-[#ffbd59] to-[#ffa726] rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-300 group-hover:text-white transition-colors duration-300 font-medium truncate">
                        {currentProject.address || `${currentProject.address_street}, ${currentProject.address_city}`}
                      </p>
                      <p className="text-xs text-gray-400 group-hover:text-gray-300 transition-colors duration-300">
                        Projektstandort
                      </p>
                    </div>
                    <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <svg className="w-4 h-4 text-[#ffbd59]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#ffbd59]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl"></div>
                  </div>
                  
                  {/* Hover-Tooltip mit vollständiger Adresse */}
                  <div className="absolute bottom-full left-0 right-0 mb-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0 pointer-events-none z-[100]">
                    <div className="bg-gray-800/95 backdrop-blur-md border border-gray-600/50 rounded-lg p-3 shadow-xl">
                      <div className="flex items-start gap-2">
                        <div className="flex-shrink-0 w-5 h-5 bg-[#ffbd59] rounded-full flex items-center justify-center mt-0.5">
                          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                        </div>
                                                 <div className="flex-1">
                           <p className="text-sm font-medium text-white mb-1">Projektanschrift</p>
                           <p className="text-xs text-gray-300 leading-relaxed">
                             {currentProject.address || `${currentProject.address_street}, ${currentProject.address_city}`}
                           </p>
                                                      {(currentProject.address_street || currentProject.address_zip || currentProject.address_city) && (
                             <div className="mt-2 pt-2 border-t border-gray-600/50">
                               {currentProject.address_street && (
                                 <p className="text-xs text-gray-400">
                                   <span className="font-medium">Straße:</span> {currentProject.address_street}
                                 </p>
                               )}
                               {(currentProject.address_zip || currentProject.address_city) && (
                                 <p className="text-xs text-gray-400">
                                   <span className="font-medium">PLZ/Ort:</span> {currentProject.address_zip || ''} {currentProject.address_city || ''}
                                 </p>
                               )}
                               {currentProject.address_country && (
                                 <p className="text-xs text-gray-400">
                                   <span className="font-medium">Land:</span> {currentProject.address_country}
                                 </p>
                               )}
                             </div>
                           )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="flex flex-wrap gap-4 text-sm">
                <span className={`px-3 py-1 rounded-full ${getStatusColor(currentProject.status)} bg-white/10`}>
                  {getStatusLabel(currentProject.status)}
                </span>
                <span className="px-3 py-1 rounded-full text-blue-400 bg-white/10">
                  {getProjectTypeLabel(currentProject.project_type)}
                </span>
                {currentProject.budget && (
                  <span className="px-3 py-1 rounded-full text-green-400 bg-white/10">
                    Budget: {currentProject.budget.toLocaleString('de-DE')} €
                  </span>
                )}
              </div>
            </div>

            {/* Projekt-Fortschritt entfernt */}

            {/* Bauphasen-Zeitstrahl - nur für Neubau-Projekte */}
            {currentProject.project_type === 'new_build' && (
              <>
                {(currentProject as any).construction_phase && (currentProject as any).address_country && (
                  <ConstructionPhaseTimeline 
                    currentPhase={(currentProject as any).construction_phase}
                    country={(currentProject as any).address_country}
                    showLegend={true}
                    showProgress={true}
                    compact={false}
                  />
                )}
                
                {/* Bauphasen-Info falls keine Phase gesetzt ist */}
                {!((currentProject as any).construction_phase) && (
                  <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                    <div className="flex items-center gap-2 text-blue-300">
                      <span className="text-sm">🏗️ Keine Bauphase ausgewählt</span>
                    </div>
                    <p className="text-xs text-blue-400 mt-1">
                      Wählen Sie eine Bauphase im Projekt-Details, um den Fortschritt zu verfolgen.
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Erfolgs-Anzeige */}
        {success && (
          <div className="bg-green-500/20 border border-green-500/30 text-green-300 px-4 py-3 rounded-xl mb-4 flex items-center gap-3">
            <CheckCircle size={20} />
            <span>{success}</span>
          </div>
        )}

        {/* Fehler-Anzeige */}
        {error && (
          <div className="bg-red-500/20 border border-red-500/30 text-red-300 px-4 py-3 rounded-xl mb-4 flex items-center gap-3">
            <AlertTriangle size={20} />
            <span>{error}</span>
          </div>
        )}

        {/* Projekt-Fehler-Anzeige */}
        {projectsError && (
          <div className="bg-red-500/20 border border-red-500/30 text-red-300 px-4 py-3 rounded-xl mb-4 flex items-center gap-3">
            <AlertTriangle size={20} />
            <span>Fehler beim Laden der Projekte: {projectsError}</span>
          </div>
        )}

        {/* Loading-Anzeige */}
        {projectsLoading && (
          <div className="bg-blue-500/20 border border-blue-500/30 text-blue-300 px-4 py-3 rounded-xl mb-4 flex items-center gap-3">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-300"></div>
            <span>Lade Projekte...</span>
          </div>
        )}
      </div>

        

        

      {/* Kanban-Board für To-Do Aufgaben - ÜBER den Ausschreibungen */}
      {selectedProject && (
        <div ref={todoSectionRef} className="mb-6 md:mb-8">
          <KanbanBoard 
            showOnlyAssignedToMe={false}
            showArchived={false}
            projectId={selectedProject.id}
            defaultExpanded={false}
          />
        </div>
      )}

      {/* Ausschreibungen für aktuelles Projekt - Zweigeteiltes Layout */}
      {selectedProject && (
        <div className="mb-6 md:mb-8" data-section="trades">
          {/* Header mit Buttons in einer Zeile */}
          <div className="flex items-center justify-between mb-4 md:mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-[#ffbd59] rounded-full"></div>
              <span className="text-lg font-semibold text-white">Ausschreibungen</span>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/archive')}
                className="flex items-center gap-2 px-4 py-2 bg-gray-600/20 hover:bg-gray-600/30 text-gray-300 hover:text-white rounded-lg transition-all duration-200 border border-gray-500/30 hover:border-gray-400/50"
                title="Zum Archiv - Abgeschlossene Ausschreibungen anzeigen"
              >
                <Archive size={16} />
                <span className="text-sm font-medium">Archiv</span>
              </button>
              <button
                onClick={handleCreateTrade}
                className="px-4 py-2 bg-[#ffbd59] text-[#3d4952] rounded-lg font-semibold hover:bg-[#ffa726] transition-colors flex items-center gap-2"
              >
                <Plus size={18} />
                Neue Ausschreibung
              </button>
            </div>
          </div>
          
          {/* Festes Layout: Immer 2 Spalten, dritter Bereich in zweiter Reihe */}
          {/* Mobile: Gestapelt | Tablet/Desktop: 2 Spalten mit Bereich in zweiter Reihe */}
          <div className="space-y-4 md:space-y-0 md:grid md:grid-cols-2 md:gap-4 lg:gap-6 items-start auto-rows-max">
            {/* Linke Spalte: Offene Ausschreibungen */}
            <div className="space-y-4 w-full h-auto min-h-fit">
              <div className="flex items-center justify-between">
                <h3 className="text-lg md:text-xl font-semibold text-white flex items-center gap-2 md:gap-3">
                  <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse"></div>
                  <span className="hidden sm:inline">Offene Ausschreibungen</span>
                  <span className="sm:hidden">Offen</span>
                  <span className="text-sm md:text-base text-gray-400 bg-white/10 px-2 py-1 rounded-full">
                    {(() => {
                      const openTrades = projectTrades.filter(trade => {
                        const quotes = allTradeQuotes[trade.id] || [];
                        const hasAcceptedQuote = quotes.some(quote => quote.status === 'accepted');
                        return !hasAcceptedQuote;
                      });
                      return openTrades.length;
                    })()}
                  </span>
                </h3>
              </div>
              
              <div className="mobile-card bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 overflow-hidden relative h-auto min-h-fit">
                <div className="mobile-spacing p-4 md:p-5 lg:p-6 space-y-3 relative z-10 h-auto min-h-fit">
                  {(() => {
                    const openTrades = projectTrades.filter(trade => {
                      const quotes = allTradeQuotes[trade.id] || [];
                      const hasAcceptedQuote = quotes.some(quote => quote.status === 'accepted');
                      return !hasAcceptedQuote;
                    });
                    
                    if (openTrades.length === 0) {
                      return (
                        <div className="text-center py-8">
                          <CheckCircle size={48} className="text-green-400 mx-auto mb-4" />
                          <p className="text-gray-400 text-sm mb-4">Alle Ausschreibungen haben angenommene Angebote</p>
                          <p className="text-gray-500 text-xs">Erstellen Sie neue Ausschreibungen über den Button oben.</p>
                        </div>
                      );
                    }
                    
                    return (
                      <TradesCard
                        trades={openTrades}
                        projectId={selectedProject.id}
                        isExpanded={true}
                        onToggle={() => {}}
                        onTradeClick={handleTradeClick}
                        tradeAppointments={tradeAppointments}
                        onAcceptQuote={async (quoteId: number, providerName?: string, isInspectionQuote?: boolean) => {
                          try {
                            await acceptQuoteWithAnimation(quoteId, providerName, isInspectionQuote);
                            const activeTrades = await loadAndFilterTrades(selectedProject.id);
                            setProjectTrades(activeTrades);
                            await loadQuotesForTrades(activeTrades);
                            await loadAppointmentsForTrades(activeTrades);
                            setSuccess('Angebot erfolgreich angenommen!');
                            setTimeout(() => setSuccess(''), 3000);
                          } catch (e: any) {
                            console.error('❌ Fehler beim Annehmen:', e);
                            setError('Fehler beim Annehmen des Angebots');
                          }
                        }}
                        onRejectQuote={async (quoteId: number, reason: string) => {
                          try {
                            await rejectQuote(quoteId, reason);
                            const activeTrades = await loadAndFilterTrades(selectedProject.id);
                            setProjectTrades(activeTrades);
                            await loadQuotesForTrades(activeTrades);
                            await loadAppointmentsForTrades(activeTrades);
                            setSuccess('Angebot erfolgreich abgelehnt!');
                            setTimeout(() => setSuccess(''), 3000);
                          } catch (e: any) {
                            console.error('❌ Fehler beim Ablehnen:', e);
                            setError('Fehler beim Ablehnen des Angebots');
                          }
                        }}
                        onResetQuote={async (quoteId: number) => {
                          try {
                            await resetQuote(quoteId);
                            const activeTrades = await loadAndFilterTrades(selectedProject.id);
                            setProjectTrades(activeTrades);
                          } catch (e) {
                            console.error('❌ Fehler beim Zurücksetzen:', e);
                          }
                        }}
                      />
                    );
                  })()}
                </div>
              </div>
            </div>
            
            {/* Rechte Spalte: Angenommene Ausschreibungen */}
            <div className="space-y-4 w-full h-auto min-h-fit">
              <div className="flex items-center justify-between">
                <h3 className="text-lg md:text-xl font-semibold text-white flex items-center gap-2 md:gap-3">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="hidden sm:inline">Angenommene Ausschreibungen</span>
                  <span className="sm:hidden">Angenommen</span>
                  <span className="text-sm md:text-base text-gray-400 bg-white/10 px-2 py-1 rounded-full">
                    {(() => {
                      const acceptedTrades = projectTrades.filter(trade => {
                        const quotes = allTradeQuotes[trade.id] || [];
                        const hasAcceptedQuote = quotes.some(quote => quote.status === 'accepted');
                        const isCompleted = (trade as any).completion_status === 'completed';
                        return hasAcceptedQuote && !isCompleted;
                      });
                      return acceptedTrades.length;
                    })()}
                  </span>
                </h3>
              </div>
              
              <div className="mobile-card bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 overflow-hidden relative h-auto min-h-fit">
                <div className="mobile-spacing p-4 md:p-5 lg:p-6 space-y-3 relative z-10 h-auto min-h-fit">
                  {(() => {
                    const acceptedTrades = projectTrades.filter(trade => {
                      const quotes = allTradeQuotes[trade.id] || [];
                      const hasAcceptedQuote = quotes.some(quote => quote.status === 'accepted');
                      const isCompleted = (trade as any).completion_status === 'completed';
                      return hasAcceptedQuote && !isCompleted;
                    });
                    
                    if (acceptedTrades.length === 0) {
                      return (
                        <div className="text-center py-8">
                          <AlertTriangle size={48} className="text-yellow-400 mx-auto mb-4" />
                          <p className="text-gray-400 text-sm mb-4">Keine laufenden Ausschreibungen</p>
                          <p className="text-gray-500 text-xs">Angenommene Ausschreibungen ohne Abschluss erscheinen hier.</p>
                        </div>
                      );
                    }
                    
                    return (
                      <TradesCard
                        trades={acceptedTrades}
                        projectId={selectedProject.id}
                        isExpanded={true}
                        onToggle={() => {}}
                        onTradeClick={handleTradeClick}
                        tradeAppointments={tradeAppointments}
                        onAcceptQuote={async (quoteId: number, providerName?: string, isInspectionQuote?: boolean) => {
                          try {
                            await acceptQuoteWithAnimation(quoteId, providerName, isInspectionQuote);
                            const activeTrades = await loadAndFilterTrades(selectedProject.id);
                            setProjectTrades(activeTrades);
                            await loadQuotesForTrades(activeTrades);
                            await loadAppointmentsForTrades(activeTrades);
                            setSuccess('Angebot erfolgreich angenommen!');
                            setTimeout(() => setSuccess(''), 3000);
                          } catch (e: any) {
                            console.error('❌ Fehler beim Annehmen:', e);
                            setError('Fehler beim Annehmen des Angebots');
                          }
                        }}
                        onRejectQuote={async (quoteId: number, reason: string) => {
                          try {
                            await rejectQuote(quoteId, reason);
                            const activeTrades = await loadAndFilterTrades(selectedProject.id);
                            setProjectTrades(activeTrades);
                            await loadQuotesForTrades(activeTrades);
                            await loadAppointmentsForTrades(activeTrades);
                            setSuccess('Angebot erfolgreich abgelehnt!');
                            setTimeout(() => setSuccess(''), 3000);
                          } catch (e: any) {
                            console.error('❌ Fehler beim Ablehnen:', e);
                            setError('Fehler beim Ablehnen des Angebots');
                          }
                        }}
                        onResetQuote={async (quoteId: number) => {
                          try {
                            await resetQuote(quoteId);
                            const activeTrades = await loadAndFilterTrades(selectedProject.id);
                            setProjectTrades(activeTrades);
                          } catch (e) {
                            console.error('❌ Fehler beim Zurücksetzen:', e);
                          }
                        }}
                      />
                    );
                  })()}
                </div>
              </div>
            </div>
            
            {/* Dritter Bereich: Abgeschlossene Ausschreibungen - Elegante Timeline-Ansicht */}
            <div className="space-y-4 w-full h-auto min-h-fit md:col-span-2 md:mt-4 md:pt-4 md:border-t md:border-white/10">
              {/* Header mit modernem Design */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-3 h-3 bg-gradient-to-r from-emerald-400 to-green-500 rounded-full animate-pulse"></div>
                    <div className="absolute inset-0 w-3 h-3 bg-emerald-400/30 rounded-full animate-ping"></div>
                  </div>
                  <h3 className="text-lg md:text-xl font-semibold text-white">
                    <span className="hidden sm:inline">Abgeschlossene Ausschreibungen</span>
                    <span className="sm:hidden">Abgeschlossen</span>
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className="text-xs md:text-sm text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-full border border-emerald-500/20">
                      {(() => {
                        const completedTrades = projectTrades.filter(trade => {
                          const quotes = allTradeQuotes[trade.id] || [];
                          const hasAcceptedQuote = quotes.some(quote => quote.status === 'accepted');
                          const isCompleted = (trade as any).completion_status === 'completed';
                          return hasAcceptedQuote && isCompleted;
                        });
                        return completedTrades.length;
                      })()}
                    </span>
                    <div className="hidden sm:flex items-center gap-1 text-emerald-400/60 text-xs">
                      <CheckCircle size={12} />
                      <span>Erfolgreich abgeschlossen</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Moderne Timeline-Ansicht für abgeschlossene Ausschreibungen */}
              {(() => {
                const completedTrades = projectTrades.filter(trade => {
                  const quotes = allTradeQuotes[trade.id] || [];
                  const hasAcceptedQuote = quotes.some(quote => quote.status === 'accepted');
                  const isCompleted = (trade as any).completion_status === 'completed';
                  return hasAcceptedQuote && isCompleted;
                });
                
                if (completedTrades.length === 0) {
                  return (
                    <div className="bg-gradient-to-r from-gray-500/5 to-gray-600/5 border border-gray-500/20 rounded-xl p-6 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-16 h-16 bg-gray-500/10 rounded-full flex items-center justify-center">
                          <CheckCircle size={24} className="text-gray-400" />
                        </div>
                        <div>
                          <p className="text-gray-300 text-sm font-medium">Noch keine Ausschreibungen abgeschlossen</p>
                          <p className="text-gray-500 text-xs mt-1">Abgeschlossene Projekte erscheinen hier in einer übersichtlichen Timeline</p>
                        </div>
                      </div>
                    </div>
                  );
                }
                
                // Kompakte Timeline-Ansicht mit maximal 3 sichtbaren Einträgen
                const visibleTrades = completedTrades.slice(0, 3);
                const remainingCount = completedTrades.length - 3;
                
                return (
                  <div className="space-y-3">
                    {/* Timeline Container */}
                    <div className="relative">
                      {/* Timeline Line */}
                      <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gradient-to-b from-emerald-400/50 to-emerald-600/30"></div>
                      
                      {/* Timeline Items */}
                      <div className="space-y-4">
                        {visibleTrades.map((trade, index) => {
                          const quotes = allTradeQuotes[trade.id] || [];
                          const acceptedQuote = quotes.find(quote => quote.status === 'accepted');
                          const completionDate = (trade as any).completion_date || (trade as any).updated_at;
                          
                          return (
                            <div 
                              key={trade.id}
                              className="group relative flex items-start gap-4 cursor-pointer"
                              onClick={() => handleTradeClick(trade)}
                            >
                              {/* Timeline Dot */}
                              <div className="relative z-10 flex-shrink-0">
                                <div className="w-8 h-8 bg-gradient-to-r from-emerald-400 to-green-500 rounded-full flex items-center justify-center shadow-lg group-hover:shadow-emerald-400/25 transition-all duration-300">
                                  <CheckCircle size={14} className="text-white" />
                                </div>
                                <div className="absolute inset-0 w-8 h-8 bg-emerald-400/20 rounded-full animate-ping group-hover:animate-none"></div>
                              </div>
                              
                              {/* Content Card */}
                              <div className="flex-1 min-w-0">
                                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 group-hover:bg-white/10 group-hover:border-emerald-400/30 transition-all duration-300 group-hover:shadow-lg group-hover:shadow-emerald-400/10">
                                  <div className="flex items-start justify-between gap-3">
                                    <div className="flex-1 min-w-0">
                                      <h4 className="text-white font-medium text-sm group-hover:text-emerald-100 transition-colors truncate">
                                        {trade.title}
                                      </h4>
                                      <div className="flex items-center gap-2 mt-1">
                                        {acceptedQuote && (
                                          <span className="text-xs text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                                            {acceptedQuote.company_name}
                                          </span>
                                        )}
                                        {completionDate && (
                                          <span className="text-xs text-gray-400">
                                            {new Date(completionDate).toLocaleDateString('de-DE')}
                                          </span>
                                        )}
                                      </div>
                                      {acceptedQuote && (
                                        <div className="mt-2 flex items-center gap-2">
                                          <span className="text-xs text-gray-400">Finaler Preis:</span>
                                          <span className="text-sm font-semibold text-emerald-400">
                                            {acceptedQuote.total_amount?.toLocaleString('de-DE')} €
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                    
                                    {/* Hover Action Indicator */}
                                    <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                      <div className="w-6 h-6 bg-emerald-400/20 rounded-full flex items-center justify-center">
                                        <svg className="w-3 h-3 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    
                    {/* Show More Button für zusätzliche Einträge */}
                    {remainingCount > 0 && (
                      <div className="flex justify-center pt-2">
                        <button
                          onClick={() => setShowCompletedTrades(!showCompletedTrades)}
                          className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 hover:text-emerald-200 rounded-lg transition-all duration-200 border border-emerald-500/20 hover:border-emerald-400/40 group"
                        >
                          <span className="text-sm font-medium">
                            {showCompletedTrades ? 'Weniger anzeigen' : `+${remainingCount} weitere anzeigen`}
                          </span>
                          {showCompletedTrades ? (
                            <ChevronUp size={16} className="group-hover:scale-110 transition-transform" />
                          ) : (
                            <ChevronDown size={16} className="group-hover:scale-110 transition-transform" />
                          )}
                        </button>
                      </div>
                    )}
                    
                    {/* Erweiterte Ansicht (nur wenn showCompletedTrades true ist) */}
                    {showCompletedTrades && remainingCount > 0 && (
                      <div className="mt-4 pt-4 border-t border-white/10">
                        <div className="space-y-3">
                          {completedTrades.slice(3).map((trade, index) => {
                            const quotes = allTradeQuotes[trade.id] || [];
                            const acceptedQuote = quotes.find(quote => quote.status === 'accepted');
                            const completionDate = (trade as any).completion_date || (trade as any).updated_at;
                            
                            return (
                              <div 
                                key={trade.id}
                                className="group relative flex items-start gap-4 cursor-pointer"
                                onClick={() => handleTradeClick(trade)}
                              >
                                {/* Timeline Dot */}
                                <div className="relative z-10 flex-shrink-0">
                                  <div className="w-6 h-6 bg-gradient-to-r from-emerald-400 to-green-500 rounded-full flex items-center justify-center shadow-lg group-hover:shadow-emerald-400/25 transition-all duration-300">
                                    <CheckCircle size={10} className="text-white" />
                                  </div>
                                </div>
                                
                                {/* Content Card */}
                                <div className="flex-1 min-w-0">
                                  <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-3 group-hover:bg-white/10 group-hover:border-emerald-400/30 transition-all duration-300">
                                    <div className="flex items-start justify-between gap-3">
                                      <div className="flex-1 min-w-0">
                                        <h4 className="text-white font-medium text-sm group-hover:text-emerald-100 transition-colors truncate">
                                          {trade.title}
                                        </h4>
                                        <div className="flex items-center gap-2 mt-1">
                                          {acceptedQuote && (
                                            <span className="text-xs text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                                              {acceptedQuote.company_name}
                                            </span>
                                          )}
                                          {completionDate && (
                                            <span className="text-xs text-gray-400">
                                              {new Date(completionDate).toLocaleDateString('de-DE')}
                                            </span>
                                          )}
                                        </div>
                                        {acceptedQuote && (
                                          <div className="mt-1">
                                            <span className="text-xs font-semibold text-emerald-400">
                                              {acceptedQuote.total_amount?.toLocaleString('de-DE')} €
                                            </span>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Finanz-Analyse - für alle Benutzer */}
      {selectedProject && (
        <div className="mb-6 md:mb-8" data-section="financial-analysis">
          <ProjectFinancialAnalysis 
            projectId={selectedProject.id}
            projectName={selectedProject.name}
            budget={selectedProject.budget}
          />
        </div>
      )}

      {/* Finance Widget - unter den Gewerken */}
      {selectedProject && (
        <div className="mb-6 md:mb-8">
          <FinanceWidget projectId={selectedProject.id} />
        </div>
      )}


      {selectedProject && (
        <div className="mb-6 md:mb-8" data-section="trades-continued">
          {/* Intelligente Modal-Auswahl wie in Quotes.tsx */}
          {(() => {
            console.log('🔧 Modal Render Check:', {
              showTradeDetailsModal,
              selectedTradeForDetails: selectedTradeForDetails?.id,
              showSimpleCostEstimateModal,
              selectedTradeForSimpleCostEstimate: selectedTradeForSimpleCostEstimate?.id
            });
            return null;
          })()}
          
          {showTradeDetailsModal && selectedTradeForDetails && selectedProject && (
            <TradeDetailsModal
              trade={selectedTradeForDetails}
              project={selectedProject}
              isOpen={showTradeDetailsModal}
              onClose={() => {
                console.log('🔧 TradeDetailsModal wird geschlossen');
                setShowTradeDetailsModal(false);
                setSelectedTradeForDetails(null);
              }}
              onCreateQuote={() => {}}
              existingQuotes={allTradeQuotes[selectedTradeForDetails.id] || []}
              onCreateInspection={handleCreateInspection}
              onAcceptQuote={async (quoteId: number, providerName?: string, isInspectionQuote?: boolean) => {
                try {
                  await acceptQuoteWithAnimation(quoteId, providerName, isInspectionQuote);
                  // Gewerke neu laden nach Annahme
                  const activeTrades = await loadAndFilterTrades(selectedProject.id);
                  setProjectTrades(activeTrades);
                  await loadQuotesForTrades(activeTrades);
                  console.log('✅ Angebot angenommen und Daten neu geladen');
                } catch (error) {
                  console.error('❌ Fehler beim Annehmen des Angebots:', error);
                }
              }}
              onRejectQuote={async (quoteId: number, reason: string) => {
                try {
                  await rejectQuote(quoteId, reason);
                  // Gewerke neu laden nach Ablehnung
                  const activeTrades = await loadAndFilterTrades(selectedProject.id);
                  setProjectTrades(activeTrades);
                  await loadQuotesForTrades(activeTrades);
                  console.log('✅ Angebot abgelehnt und Daten neu geladen');
                } catch (error) {
                  console.error('❌ Fehler beim Ablehnen des Angebots:', error);
                }
              }}
            />
          )}
          
          {/* SimpleCostEstimateModal für Bauträger-Ansicht */}
          {showSimpleCostEstimateModal && selectedTradeForSimpleCostEstimate && (
            <SimpleCostEstimateModal
              key={`simple-cost-estimate-${selectedTradeForSimpleCostEstimate.id}`}
              isOpen={showSimpleCostEstimateModal}
              onClose={() => {
                setShowSimpleCostEstimateModal(false);
                setSelectedTradeForSimpleCostEstimate(null);
              }}
              trade={selectedTradeForSimpleCostEstimate}
              quotes={allTradeQuotes[selectedTradeForSimpleCostEstimate.id] || []}
              project={selectedProject}
              onAcceptQuote={async (quoteId: number, providerName?: string, isInspectionQuote?: boolean) => {
                try {
                  await acceptQuoteWithAnimation(quoteId, providerName, isInspectionQuote);
                  const activeTrades = await loadAndFilterTrades(selectedProject.id);
                  setProjectTrades(activeTrades);
                  await loadQuotesForTrades(activeTrades);
                } catch (e) {
                  console.error('❌ Fehler beim Annehmen:', e);
                }
              }}
              onRejectQuote={async (quoteId: number, reason: string) => {
                try {
                  await rejectQuote(quoteId, reason);
                  const activeTrades = await loadAndFilterTrades(selectedProject.id);
                  setProjectTrades(activeTrades);
                  await loadQuotesForTrades(activeTrades);
                } catch (e) {
                  console.error('❌ Fehler beim Ablehnen:', e);
                }
              }}
              onResetQuote={async (quoteId: number) => {
                try {
                  await resetQuote(quoteId);
                  const activeTrades = await loadAndFilterTrades(selectedProject.id);
                  setProjectTrades(activeTrades);
                  await loadQuotesForTrades(activeTrades);
                } catch (e) {
                  console.error('❌ Fehler beim Zurücksetzen:', e);
                }
              }}
              onCreateInspection={handleCreateInspection}
              inspectionStatus={tradeInspectionStatus[selectedTradeForSimpleCostEstimate.id]}
              onTradeUpdate={async (updatedTrade: any) => {
                // Aktualisiere den Trade im State
                const activeTrades = await loadAndFilterTrades(selectedProject.id);
                setProjectTrades(activeTrades);
                await loadQuotesForTrades(activeTrades);
                console.log('✅ Trade aktualisiert');
              }}
            />
          )}
          
          {/* Task Creation Modal */}
          <TaskCreationModal
            isOpen={showTaskCreationModal}
            onClose={() => setShowTaskCreationModal(false)}
            onTaskCreated={() => {
              setShowTaskCreationModal(false);
              // Refresh project stats after task creation
              if (selectedProject) {
                refreshProjectStats(selectedProject);
              }
            }}
          />
          
          {/* Gewerk-Erstellung */}
          {showTradeCreationForm && (
            <TradeCreationForm
              isOpen={showTradeCreationForm}
              onClose={() => setShowTradeCreationForm(false)}
              onSubmit={async (tradeData: any) => {
                setShowTradeCreationForm(false);
                // Lade Gewerke neu nach Erstellung (nur wenn Projekt ausgewählt)
                if (selectedProject) {
                  const activeTrades = await loadAndFilterTrades(selectedProject.id);
                  setProjectTrades(activeTrades);
                }
              }}
              projectId={selectedProject?.id || 0}
            />
          )}
        </div>
      )}


      {/* Projekt-Erstellungs-Modal */}
      {showCreateProjectModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" data-tour-id="create-project-modal">
          <div className="bg-gradient-to-br from-[#1a1a2e] to-[#16213e] text-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto relative">
            
            {/* Seitlicher Datenschutz-Banner */}
            <div className={`absolute top-0 right-0 h-full transition-all duration-300 ease-in-out z-10 ${
              isPrivacyBannerCollapsed ? 'w-16' : 'w-80 lg:w-80 md:w-64 sm:w-48'
            }`}>
              <div className="h-full bg-gradient-to-b from-blue-500/15 to-indigo-500/15 border-l border-blue-500/30 backdrop-blur-sm">
                {/* Toggle Button */}
                <button
                  onClick={() => setIsPrivacyBannerCollapsed(!isPrivacyBannerCollapsed)}
                  className="absolute top-4 left-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 hover:text-blue-300 rounded-lg p-2 transition-all duration-200 border border-blue-500/30 shadow-lg"
                  title={isPrivacyBannerCollapsed ? "Datenschutz-Info anzeigen" : "Datenschutz-Info ausblenden"}
                >
                  {isPrivacyBannerCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
                </button>

                {/* Collapsed State Indicator */}
                {isPrivacyBannerCollapsed && (
                  <div className="space-y-2">
                    <div className="absolute top-36 left-1/2 transform -translate-x-1/2 -rotate-90 origin-center">
                      <div className="flex items-center space-x-1 text-blue-300 text-xs font-medium whitespace-nowrap bg-blue-500/20 px-3 py-1 rounded border border-blue-500/30">
                        <Shield size={12} />
                        <span>Datenschutz & Sichtbarkeit</span>
                      </div>
                    </div>
                    
                    {/* Dokumenten-Vererbung Button - DEAKTIVIERT */}
                    {/* <div className="absolute top-48 left-1/2 transform -translate-x-1/2 -rotate-90 origin-center">
                      <button
                        onClick={() => setShowDocumentInheritanceTooltip(!showDocumentInheritanceTooltip)}
                        className="flex items-center space-x-1 text-green-300 text-xs font-medium whitespace-nowrap bg-green-500/20 px-3 py-1 rounded border border-green-500/30 hover:bg-green-500/30 transition-colors"
                        title={showDocumentInheritanceTooltip ? "Dokumenten-Vererbung ausblenden" : "Dokumenten-Vererbung anzeigen"}
                      >
                        <FolderOpen size={12} />
                        <span>Dokumenten-Vererbung</span>
                        {showDocumentInheritanceTooltip ? <ChevronLeft size={12} /> : <ChevronRight size={12} />}
                      </button>
                    </div> */}
                  </div>
                )}

                {/* Banner Content */}
                <div className={`h-full pt-16 px-4 transition-all duration-300 ${
                  isPrivacyBannerCollapsed ? 'opacity-0 pointer-events-none' : 'opacity-100'
                }`}>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2 mb-4">
                      <Shield className="w-5 h-5 text-blue-400" />
                      <h4 className="text-white font-semibold text-sm">
                        Datenschutz & Sichtbarkeit
                      </h4>
                    </div>
                    
                    <div className="text-gray-300 text-xs space-y-3">
                      <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                        <div className="flex items-start space-x-2">
                          <Eye className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-white font-medium text-xs mb-1">Alle Projektinformationen</p>
                            <p className="text-gray-400 text-xs leading-relaxed">
                              sind nur für Sie als Bauträger sichtbar und werden vertraulich behandelt.
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-yellow-500/10 rounded-lg p-3 border border-yellow-500/20">
                        <div className="flex items-start space-x-2">
                          <EyeOff className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-yellow-400 font-medium text-xs mb-1">Ausnahme: Projektadresse</p>
                            <p className="text-gray-400 text-xs leading-relaxed">
                              Die Adresse wird bei der Erstellung von Ausschreibungen automatisch an Dienstleister weitergegeben, damit diese die Anschrift der Baustelle kennen.
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-green-500/10 rounded-lg p-3 border border-green-500/20">
                        <div className="flex items-start space-x-2">
                          <FolderOpen className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-green-400 font-medium text-xs mb-1">Dokumente im DMS</p>
                            <p className="text-gray-400 text-xs leading-relaxed">
                              Hochgeladene Dokumente werden diesem Projekt im Dokumenten-Management-System (DMS) zugeordnet. Bei späteren Ausschreibungen können Sie gezielt auswählen, welche Dokumente für Dienstleister sichtbar sein sollen.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Header mit Gradient */}
            <div className="bg-gradient-to-r from-[#3d4952]/95 to-[#51646f]/95 backdrop-blur-lg text-white px-6 py-4 rounded-t-2xl border-b border-[#ffbd59]/20">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-white to-[#ffbd59] bg-clip-text text-transparent">
                  Neues Projekt erstellen
                </h2>
                <button
                  onClick={handleCloseCreateProjectModal}
                  className="text-white/80 hover:text-white transition-colors p-1 rounded-full hover:bg-white/10"
                >
                  <X size={24} />
                </button>
              </div>
            </div>
            
            <div className={`p-6 transition-all duration-300 ${
              isPrivacyBannerCollapsed ? 'mr-16' : 'mr-80 lg:mr-80 md:mr-64 sm:mr-48'
            }`}>

              <form onSubmit={handleCreateProject} className="space-y-6">
                {/* Grundinformationen */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-200 mb-3">
                      Projektname *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={projectForm.name}
                      onChange={handleProjectFormChange}
                      required
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-600 text-white rounded-xl focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent transition-all duration-200 placeholder-gray-400"
                      placeholder="z.B. Einfamilienhaus München"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-200 mb-3">
                      Land
                    </label>
                    <select
                      name="address_country"
                      value={projectForm.address_country}
                      onChange={handleProjectFormChange}
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-600 text-white rounded-xl focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent transition-all duration-200"
                    >
                      <option value="Deutschland">Deutschland</option>
                      <option value="Schweiz">Schweiz</option>
                      <option value="Österreich">Österreich</option>
                    </select>
                  </div>
                </div>

                {/* Projekttyp */}
                <div>
                  <label className="block text-sm font-semibold text-gray-200 mb-3">
                    Projekttyp *
                  </label>
                  <select
                    name="project_type"
                    value={projectForm.project_type}
                    onChange={handleProjectFormChange}
                    required
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-600 text-white rounded-xl focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent transition-all duration-200"
                  >
                    <option value="new_build">Neubau</option>
                    <option value="renovation">Renovierung</option>
                    <option value="extension">Anbau</option>
                    <option value="refurbishment">Sanierung</option>
                  </select>
                </div>

                {/* Bauphasen-Auswahl (nur für Neubau) */}
                {projectForm.project_type === 'new_build' && (
                  <div className="bg-gradient-to-r from-[#ffbd59]/10 to-[#ffa726]/10 border border-[#ffbd59]/30 rounded-xl p-4">
                    <label className="block text-sm font-semibold text-gray-200 mb-3">
                      🏗️ Aktuelle Bauphase (optional)
                    </label>
                    <select
                      name="construction_phase"
                      value={projectForm.construction_phase}
                      onChange={handleProjectFormChange}
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-600 text-white rounded-xl focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent transition-all duration-200"
                    >
                      <option value="">Keine Phase ausgewählt</option>
                      {getConstructionPhases(projectForm.address_country).map((phase) => (
                        <option key={phase.value} value={phase.value}>
                          {phase.label}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-300 mt-3">
                      💡 Wählen Sie die aktuelle Bauphase für {projectForm.address_country}
                    </p>
                  </div>
                )}



                {/* Beschreibung */}
                <div>
                  <label className="block text-sm font-semibold text-gray-200 mb-3">
                    Beschreibung
                  </label>
                  <textarea
                    name="description"
                    value={projectForm.description}
                    onChange={handleProjectFormChange}
                    rows={3}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-600 text-white rounded-xl focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent transition-all duration-200 placeholder-gray-400"
                    placeholder="Beschreiben Sie Ihr Projekt..."
                  />
                </div>

                {/* Adresse */}
                <div className="space-y-6">
                  <AddressAutocomplete
                    label="Adresse"
                    value={{
                      address_street: projectForm.address_street,
                      address_zip: projectForm.address_zip,
                      address_city: projectForm.address_city,
                      address_country: projectForm.address_country,
                    }}
                    onChange={(addr) => setProjectForm(prev => ({
                      ...prev,
                      address_street: addr.address_street,
                      address_zip: addr.address_zip,
                      address_city: addr.address_city,
                      address_country: addr.address_country || prev.address_country,
                    }))}
                  />
                </div>

                {/* Projektdetails */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-200 mb-3">
                      Grundstücksgröße (m²)
                    </label>
                    <input
                      type="number"
                      name="property_size"
                      value={projectForm.property_size}
                      onChange={handleProjectFormChange}
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-600 text-white rounded-xl focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent transition-all duration-200 placeholder-gray-400"
                      placeholder="z.B. 500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-200 mb-3">
                      Wohnfläche (m²)
                    </label>
                    <input
                      type="number"
                      name="construction_area"
                      value={projectForm.construction_area}
                      onChange={handleProjectFormChange}
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-600 text-white rounded-xl focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent transition-all duration-200 placeholder-gray-400"
                      placeholder="z.B. 150"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-200 mb-3">
                      Budget (€)
                    </label>
                    <input
                      type="number"
                      name="budget"
                      value={projectForm.budget}
                      onChange={handleProjectFormChange}
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-600 text-white rounded-xl focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent transition-all duration-200 placeholder-gray-400"
                      placeholder="z.B. 500000"
                    />
                  </div>
                </div>

                {/* Zeitplan */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-200 mb-3">
                      Startdatum
                    </label>
                    <input
                      type="date"
                      name="start_date"
                      value={projectForm.start_date}
                      onChange={handleProjectFormChange}
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-600 text-white rounded-xl focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent transition-all duration-200"
                    />
                    <div className="flex flex-wrap gap-2 mt-2">
                      <button
                        type="button"
                        onClick={() => {
                          const today = new Date();
                          const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, today.getDate());
                          setProjectForm(prev => ({ ...prev, start_date: nextMonth.toISOString().split('T')[0] }));
                        }}
                        className="px-2 py-1 text-xs bg-[#ffbd59]/20 hover:bg-[#ffbd59]/30 text-[#ffbd59] rounded border border-[#ffbd59]/30 transition-colors"
                      >
                        +1M
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const today = new Date();
                          const next3Months = new Date(today.getFullYear(), today.getMonth() + 3, today.getDate());
                          setProjectForm(prev => ({ ...prev, start_date: next3Months.toISOString().split('T')[0] }));
                        }}
                        className="px-2 py-1 text-xs bg-[#ffbd59]/20 hover:bg-[#ffbd59]/30 text-[#ffbd59] rounded border border-[#ffbd59]/30 transition-colors"
                      >
                        +3M
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const today = new Date();
                          const next6Months = new Date(today.getFullYear(), today.getMonth() + 6, today.getDate());
                          setProjectForm(prev => ({ ...prev, start_date: next6Months.toISOString().split('T')[0] }));
                        }}
                        className="px-2 py-1 text-xs bg-[#ffbd59]/20 hover:bg-[#ffbd59]/30 text-[#ffbd59] rounded border border-[#ffbd59]/30 transition-colors"
                      >
                        +6M
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-200 mb-3">
                      <span className="hidden sm:inline">Voraussichtliches Enddatum</span>
                      <span className="sm:hidden">Vrsl. Enddatum</span>
                    </label>
                    <input
                      type="date"
                      name="end_date"
                      value={projectForm.end_date}
                      onChange={handleProjectFormChange}
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-600 text-white rounded-xl focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent transition-all duration-200"
                    />
                    <div className="flex flex-wrap gap-2 mt-2">
                      <button
                        type="button"
                        onClick={() => {
                          const today = new Date();
                          const next6Months = new Date(today.getFullYear(), today.getMonth() + 6, today.getDate());
                          setProjectForm(prev => ({ ...prev, end_date: next6Months.toISOString().split('T')[0] }));
                        }}
                        className="px-2 py-1 text-xs bg-[#ffbd59]/20 hover:bg-[#ffbd59]/30 text-[#ffbd59] rounded border border-[#ffbd59]/30 transition-colors"
                      >
                        +6M
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const today = new Date();
                          const nextYear = new Date(today.getFullYear() + 1, today.getMonth(), today.getDate());
                          setProjectForm(prev => ({ ...prev, end_date: nextYear.toISOString().split('T')[0] }));
                        }}
                        className="px-2 py-1 text-xs bg-[#ffbd59]/20 hover:bg-[#ffbd59]/30 text-[#ffbd59] rounded border border-[#ffbd59]/30 transition-colors"
                      >
                        +1J
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const today = new Date();
                          const next18Months = new Date(today.getFullYear(), today.getMonth() + 18, today.getDate());
                          setProjectForm(prev => ({ ...prev, end_date: next18Months.toISOString().split('T')[0] }));
                        }}
                        className="px-2 py-1 text-xs bg-[#ffbd59]/20 hover:bg-[#ffbd59]/30 text-[#ffbd59] rounded border border-[#ffbd59]/30 transition-colors"
                      >
                        +18M
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const today = new Date();
                          const next2Years = new Date(today.getFullYear() + 2, today.getMonth(), today.getDate());
                          setProjectForm(prev => ({ ...prev, end_date: next2Years.toISOString().split('T')[0] }));
                        }}
                        className="px-2 py-1 text-xs bg-[#ffbd59]/20 hover:bg-[#ffbd59]/30 text-[#ffbd59] rounded border border-[#ffbd59]/30 transition-colors"
                      >
                        +2J
                      </button>
                    </div>
                  </div>
                </div>

                {/* Dokumente hochladen */}
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-200 mb-3">
                      Projekt-Dokumente (optional)
                    </label>
                    <div className="border-2 border-dashed border-gray-600 rounded-xl p-8 text-center hover:border-[#ffbd59] transition-all duration-200">
                      <div className="space-y-4">
                        <div className="mx-auto w-16 h-16 bg-[#ffbd59]/10 rounded-full flex items-center justify-center">
                          <Upload className="w-8 h-8 text-[#ffbd59]" />
                        </div>
                        <div>
                          <p className="text-white font-medium mb-2">Dokumente zum Projekt hochladen</p>
                          <p className="text-gray-400 text-sm mb-4">
                            Baupläne, Genehmigungen, Verträge und andere relevante Dokumente
                          </p>
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="bg-[#ffbd59] hover:bg-[#ffa726] text-[#1a1a2e] px-6 py-3 rounded-lg font-medium transition-colors"
                          >
                            Dateien auswählen
                          </button>
                          <input
                            ref={fileInputRef}
                            type="file"
                            multiple
                            onChange={handleFileInputChange}
                            className="hidden"
                            accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.mp4,.mov,.avi"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Ausgewählte Dateien Anzeige */}
                  {uploadFiles.length > 0 && (
                    <div className="space-y-4">
                      <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
                        <div className="flex items-center gap-2 text-blue-300 mb-3">
                          <FileText className="w-5 h-5" />
                          <span className="font-medium">
                            {uploadFiles.length} Datei{uploadFiles.length !== 1 ? 'en' : ''} ausgewählt
                          </span>
                        </div>
                        
                        {/* Liste der Dokumente */}
                        <div className="space-y-2 mb-3">
                          {uploadFiles.map((file, index) => (
                            <div key={index} className="flex items-center justify-between bg-[#2c3539]/30 rounded-lg px-3 py-2">
                              <div className="flex items-center gap-2 flex-1">
                                <FileText className="w-4 h-4 text-gray-400" />
                                <span className="text-sm text-gray-300 truncate">{file.file.name}</span>
                                <span className="text-xs text-gray-500">({formatFileSize(file.file.size)})</span>
                              </div>
                              {file.category && (
                                <div className="flex items-center gap-2">
                                  <CheckCircle className="w-4 h-4 text-green-400" />
                                  <span className="text-xs text-green-400">Kategorisiert</span>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                        
                        <p className="text-blue-200 text-sm">
                          {uploadFiles.some(f => f.category) 
                            ? `${uploadFiles.filter(f => f.category).length} von ${uploadFiles.length} Dokumenten kategorisiert. Diese werden beim Klick auf "Projekt erstellen" ins DMS hochgeladen.`
                            : 'Die Dokumente werden nach der Kategorisierung beim Projekt erstellen ins DMS hochgeladen.'
                          }
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Einstellungen */}
                <div className="space-y-4 bg-gradient-to-r from-gray-800/50 to-gray-700/50 rounded-xl p-6 border border-gray-600">
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      name="allow_quotes"
                      checked={projectForm.allow_quotes}
                      onChange={handleProjectFormChange}
                      className="w-5 h-5 text-[#ffbd59] border-gray-500 rounded focus:ring-[#ffbd59] transition-all duration-200"
                    />
                    <label className="text-sm font-medium text-gray-200">
                      Angebote für dieses Projekt erlauben
                    </label>
                  </div>
                </div>

                {/* Dokument-Upload */}
                <div className="bg-[#1a1a2e]/30 rounded-xl p-6 border border-gray-600/30">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                    <CloudUpload className="w-5 h-5 mr-2 text-[#ffbd59]" />
                    Projekt-Dokumente hochladen (optional)
                  </h3>
                  
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.currentTarget.classList.add('border-[#ffbd59]', 'bg-[#ffbd59]/10');
                    }}
                    onDragLeave={(e) => {
                      e.preventDefault();
                      e.currentTarget.classList.remove('border-[#ffbd59]', 'bg-[#ffbd59]/10');
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.currentTarget.classList.remove('border-[#ffbd59]', 'bg-[#ffbd59]/10');
                      const files = Array.from(e.dataTransfer.files);
                      handleFileSelection(files);
                    }}
                    className="border-2 border-dashed border-gray-600 rounded-xl p-8 text-center transition-all hover:border-[#ffbd59]/50"
                  >
                    <CloudUpload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <p className="text-white text-lg font-medium mb-2">
                      Dokumente hier ablegen oder klicken zum Auswählen
                    </p>
                    <p className="text-gray-400 text-sm mb-2">
                      Unterstützte Formate: PDF, Word, Excel, Bilder, Videos (max. 50MB pro Datei)
                    </p>
                    <div className="flex items-center justify-center gap-2 text-[#ffbd59] text-sm font-medium mb-4">
                      <Sparkles className="w-4 h-4" />
                      <span>Automatische Kategorisierung</span>
                    </div>
                    
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="bg-[#ffbd59] hover:bg-[#ff8c42] text-white px-6 py-3 rounded-lg font-medium transition-colors"
                    >
                      Dateien auswählen
                    </button>
                    
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      onChange={(e) => {
                        if (e.target.files) {
                          handleFileSelection(Array.from(e.target.files));
                        }
                      }}
                      className="hidden"
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.mp4,.mov,.avi"
                    />
                  </div>

                  {/* Hochgeladene Dateien */}
                  {uploadFiles.length > 0 && (
                    <div className="mt-6">
                      <h4 className="text-lg font-semibold text-white mb-4">
                        Hochgeladene Dokumente ({uploadFiles.length})
                      </h4>
                      
                      <div className="space-y-3">
                        {uploadFiles.map((uploadFile) => {
                          const getFileIcon = (file: File) => {
                            const type = file.type.toLowerCase();
                            if (type.includes('image')) return Image;
                            if (type.includes('video')) return Video;
                            if (type.includes('pdf') || type.includes('document')) return FileText;
                            if (type.includes('zip') || type.includes('rar')) return Archive;
                            return File;
                          };
                          
                          const FileIcon = getFileIcon(uploadFile.file);
                          return (
                            <div key={uploadFile.id} className="flex items-center justify-between p-4 bg-[#1a1a2e]/50 rounded-lg border border-gray-600/30">
                              <div className="flex items-center space-x-3">
                                <FileIcon className="w-6 h-6 text-[#ffbd59]" />
                                <div>
                                  <p className="text-white font-medium">{uploadFile.file.name}</p>
                                  <p className="text-gray-400 text-sm">
                                    {(uploadFile.file.size / 1024 / 1024).toFixed(2)} MB
                                    {uploadFile.category && (
                                      <span className="ml-2 text-[#ffbd59]">
                                        • {DOCUMENT_CATEGORIES[uploadFile.category as keyof typeof DOCUMENT_CATEGORIES]?.name}
                                        {uploadFile.subcategory && ` > ${uploadFile.subcategory}`}
                                      </span>
                                    )}
                                  </p>
                                </div>
                              </div>
                              
                              <div className="flex items-center space-x-2">
                                {uploadFile.status === 'success' && (
                                  <CheckCircle className="w-5 h-5 text-green-400" />
                                )}
                                {uploadFile.status === 'error' && (
                                  <AlertTriangle className="w-5 h-5 text-red-400" />
                                )}
                                <button
                                  type="button"
                                  onClick={() => setUploadFiles(prev => prev.filter(f => f.id !== uploadFile.id))}
                                  className="text-gray-400 hover:text-red-400 transition-colors"
                                >
                                  <X size={18} />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Error Display */}
                {createProjectError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <AlertTriangle size={16} />
                      <span>{createProjectError}</span>
                    </div>
                  </div>
                )}

                {/* Buttons */}
                <div className="flex items-center justify-end space-x-4 pt-6">
                  <button
                    type="button"
                    onClick={handleCloseCreateProjectModal}
                    className="px-6 py-3 text-gray-600 hover:text-gray-800 transition-colors font-medium"
                  >
                    Abbrechen
                  </button>
                  <button
                    type="submit"
                    disabled={isCreatingProject}
                    className="flex items-center space-x-2 bg-gradient-to-r from-[#ffbd59] to-[#ffa726] hover:from-[#ffa726] hover:to-[#ff9800] disabled:from-gray-300 disabled:to-gray-400 text-[#2c3539] px-6 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg"
                  >
                    {isCreatingProject ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#2c3539]"></div>
                        <span>Erstelle...</span>
                      </>
                    ) : (
                      <>
                        <Star size={16} />
                        <span>Projekt erstellen</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Dokumenten-Vererbung Tooltip */}
      {showDocumentInheritanceTooltip && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-gradient-to-br from-[#1a1a2e] to-[#16213e] text-white rounded-2xl shadow-2xl max-w-md w-full border border-green-500/20">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-white flex items-center">
                  <FolderOpen className="w-6 h-6 mr-2 text-green-400" />
                  Dokumenten-Vererbung
                </h3>
                <button
                  onClick={() => setShowDocumentInheritanceTooltip(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
              
              <div className="space-y-4 text-gray-300">
                <div className="bg-green-500/10 rounded-lg p-4 border border-green-500/20">
                  <h4 className="text-green-400 font-semibold mb-2 flex items-center">
                    <Eye className="w-4 h-4 mr-2" />
                    Wie funktioniert die Dokumenten-Vererbung?
                  </h4>
                  <p className="text-sm leading-relaxed">
                    Beim Erstellen von Ausschreibungen können Sie gezielt auswählen, welche Projekt-Dokumente für Dienstleister sichtbar sein sollen.
                  </p>
                </div>
                
                <div className="bg-blue-500/10 rounded-lg p-4 border border-blue-500/20">
                  <h4 className="text-blue-400 font-semibold mb-2 flex items-center">
                    <Shield className="w-4 h-4 mr-2" />
                    Datenschutz & Kontrolle
                  </h4>
                  <p className="text-sm leading-relaxed">
                    <strong>Nur die von Ihnen ausgewählten Dokumente</strong> werden an Dienstleister weitergegeben. Alle anderen Projekt-Dokumente bleiben privat und sind nur für Sie sichtbar.
                  </p>
                </div>
                
                <div className="bg-yellow-500/10 rounded-lg p-4 border border-yellow-500/20">
                  <h4 className="text-yellow-400 font-semibold mb-2 flex items-center">
                    <Info className="w-4 h-4 mr-2" />
                    Praktisches Beispiel
                  </h4>
                  <p className="text-sm leading-relaxed">
                    Sie können z.B. nur die Baupläne und technischen Spezifikationen freigeben, während interne Kostenaufstellungen und Verträge privat bleiben.
                  </p>
                </div>
              </div>
              
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowDocumentInheritanceTooltip(false)}
                  className="bg-green-600 hover:bg-green-500 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                >
                  Verstanden
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Projekt-Bearbeitungs-Modal */}
      {showEditProjectModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-[#1a1a2e] to-[#16213e] text-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="bg-gradient-to-r from-[#3d4952]/95 to-[#51646f]/95 backdrop-blur-lg text-white px-6 py-4 rounded-t-2xl border-b border-[#ffbd59]/20">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-white to-[#ffbd59] bg-clip-text text-transparent">
                  Projekt bearbeiten
                </h2>
                <button
                  onClick={handleCloseEditProjectModal}
                  className="text-white/80 hover:text-white transition-colors p-1 rounded-full hover:bg-white/10"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            <div className="p-6">
              <form onSubmit={handleUpdateProject} className="space-y-6">
                {/* Grundinformationen */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-200 mb-3">
                      Projektname *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={projectForm.name}
                      onChange={handleProjectFormChange}
                      required
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-600 text-white rounded-xl focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent transition-all duration-200 placeholder-gray-400"
                      placeholder="z.B. Einfamilienhaus München"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-200 mb-3">
                      Land
                    </label>
                    <select
                      name="address_country"
                      value={projectForm.address_country}
                      onChange={handleProjectFormChange}
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-600 text-white rounded-xl focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent transition-all duration-200"
                    >
                      <option value="Deutschland">Deutschland</option>
                      <option value="Schweiz">Schweiz</option>
                      <option value="Österreich">Österreich</option>
                    </select>
                  </div>
                </div>

                {/* Projekttyp */}
                <div>
                  <label className="block text-sm font-semibold text-gray-200 mb-3">
                    Projekttyp *
                  </label>
                  <select
                    name="project_type"
                    value={projectForm.project_type}
                    onChange={handleProjectFormChange}
                    required
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-600 text-white rounded-xl focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent transition-all duration-200"
                  >
                    <option value="new_build">Neubau</option>
                    <option value="renovation">Renovierung</option>
                    <option value="extension">Anbau</option>
                    <option value="refurbishment">Sanierung</option>
                  </select>
                </div>

                {/* Bauphase (optional) */}
                {projectForm.project_type === 'new_build' && (
                  <div className="bg-gradient-to-r from-[#ffbd59]/10 to-[#ffa726]/10 border border-[#ffbd59]/30 rounded-xl p-4">
                    <label className="block text-sm font-semibold text-gray-200 mb-3">
                      🏗️ Aktuelle Bauphase (optional)
                    </label>
                    <select
                      name="construction_phase"
                      value={projectForm.construction_phase}
                      onChange={handleProjectFormChange}
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-600 text-white rounded-xl focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent transition-all duration-200"
                    >
                      <option value="">Keine Phase ausgewählt</option>
                      {getConstructionPhases(projectForm.address_country).map((phase) => (
                        <option key={phase.value} value={phase.value}>
                          {phase.label}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Beschreibung */}
                <div>
                  <label className="block text-sm font-semibold text-gray-200 mb-3">
                    Beschreibung
                  </label>
                  <textarea
                    name="description"
                    value={projectForm.description}
                    onChange={handleProjectFormChange}
                    rows={3}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-600 text-white rounded-xl focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent transition-all duration-200 placeholder-gray-400"
                    placeholder="Beschreiben Sie Ihr Projekt..."
                  />
                </div>

                {/* Adresse */}
                <div className="space-y-6">
                  <AddressAutocomplete
                    label="Adresse"
                    value={{
                      address_street: projectForm.address_street,
                      address_zip: projectForm.address_zip,
                      address_city: projectForm.address_city,
                      address_country: projectForm.address_country,
                    }}
                    onChange={(addr) => setProjectForm(prev => ({
                      ...prev,
                      address_street: addr.address_street,
                      address_zip: addr.address_zip,
                      address_city: addr.address_city,
                      address_country: addr.address_country || prev.address_country,
                    }))}
                  />
                </div>

                {/* Projektdetails */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-200 mb-3">
                      Grundstücksgröße (m²)
                    </label>
                    <input
                      type="number"
                      name="property_size"
                      value={projectForm.property_size}
                      onChange={handleProjectFormChange}
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-600 text-white rounded-xl focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent transition-all duration-200 placeholder-gray-400"
                      placeholder="z.B. 500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-200 mb-3">
                      Wohnfläche (m²)
                    </label>
                    <input
                      type="number"
                      name="construction_area"
                      value={projectForm.construction_area}
                      onChange={handleProjectFormChange}
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-600 text-white rounded-xl focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent transition-all duration-200 placeholder-gray-400"
                      placeholder="z.B. 150"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-200 mb-3">
                      Budget (€)
                    </label>
                    <input
                      type="number"
                      name="budget"
                      value={projectForm.budget}
                      onChange={handleProjectFormChange}
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-600 text-white rounded-xl focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent transition-all duration-200 placeholder-gray-400"
                      placeholder="z.B. 500000"
                    />
                  </div>
                </div>

                {/* Zeitplan */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-200 mb-3">
                      Startdatum
                    </label>
                    <input
                      type="date"
                      name="start_date"
                      value={projectForm.start_date}
                      onChange={handleProjectFormChange}
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-600 text-white rounded-xl focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent transition-all duration-200"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-200 mb-3">
                      Enddatum
                    </label>
                    <input
                      type="date"
                      name="end_date"
                      value={projectForm.end_date}
                      onChange={handleProjectFormChange}
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-600 text-white rounded-xl focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent transition-all duration-200"
                    />
                  </div>
                </div>

                {/* Einstellungen */}
                <div className="space-y-4 bg-gradient-to-r from-gray-800/50 to-gray-700/50 rounded-xl p-6 border border-gray-600">
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      name="allow_quotes"
                      checked={projectForm.allow_quotes}
                      onChange={handleProjectFormChange}
                      className="w-5 h-5 text-[#ffbd59] border-gray-500 rounded focus:ring-[#ffbd59] transition-all duration-200"
                    />
                    <label className="text-sm font-medium text-gray-200">
                      Angebote für dieses Projekt erlauben
                    </label>
                  </div>
                </div>

                {/* Fehler-Anzeige */}
                {editProjectError && (
                  <div className="bg-red-500/20 border border-red-500/30 text-red-300 px-4 py-3 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <AlertTriangle size={16} />
                      <span>{editProjectError}</span>
                    </div>
                  </div>
                )}

                {/* Buttons */}
                <div className="flex items-center justify-end space-x-4 pt-6">
                  <button
                    type="button"
                    onClick={handleCloseEditProjectModal}
                    className="px-6 py-3 text-gray-300 hover:text-white transition-colors"
                  >
                    Abbrechen
                  </button>
                  <button
                    type="submit"
                    disabled={isUpdatingProject}
                    className="flex items-center space-x-2 bg-gradient-to-r from-[#ffbd59] to-[#ffa726] hover:from-[#ffa726] hover:to-[#ff9800] disabled:from-gray-300 disabled:to-gray-400 text-[#2c3539] px-6 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg"
                  >
                    {isUpdatingProject ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#2c3539]"></div>
                        <span>Speichere...</span>
                      </>
                    ) : (
                      <>
                        <Star size={16} />
                        <span>Änderungen speichern</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      

      {/* Radial Menu wurde global in App.tsx eingebunden */}

      {/* Final Guided Tour - Best of both worlds */}
      <FinalGuidedTour
        isOpen={showTour}
        onClose={() => setShowTour(false)}
        onCompleted={() => completeTour()}
        userRole={onboardingUserRole || 'BAUTRAEGER'}
      />

      {/* DMS Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gradient-to-br from-[#2c3539] to-[#1a1a2e] rounded-2xl shadow-2xl w-full max-w-4xl max-h-[80vh] overflow-hidden border border-gray-700">
            {/* Header */}
            <div className="p-6 border-b border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">Dokumente kategorisieren</h2>
                <button
                  onClick={() => {
                    setShowUploadModal(false);
                    setUploadFiles([]);
                  }}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
                
            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(80vh-140px)]">
              {/* Info Banner */}
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mb-4">
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-blue-400 mt-0.5" />
                  <div>
                    <p className="text-blue-300 font-medium">Hinweis zur Dokumentenverwaltung</p>
                    <p className="text-blue-200 text-sm mt-1">
                      Bitte kategorisieren Sie hier Ihre Dokumente. Der eigentliche Upload erfolgt automatisch beim Klick auf "Projekt erstellen".
                    </p>
                  </div>
                </div>
              </div>

              {/* Auto-Recognition Banner */}
              {uploadFiles.some(f => f.autoDetected) && (
                <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 mb-4">
                  <div className="flex items-start gap-3">
                    <Sparkles className="w-5 h-5 text-green-400 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-green-300 font-medium">Intelligente Dokumentenerkennung aktiv</p>
                      <p className="text-green-200 text-sm mt-1">
                        {uploadFiles.filter(f => f.autoDetected).length} von {uploadFiles.length} Dokumenten automatisch erkannt und Kategorisierungsvorschläge erstellt.
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="space-y-4">
                {uploadFiles.map((uploadFile, index) => (
                  <div key={index} className="bg-[#3d4952]/50 rounded-lg p-4 border border-gray-600">
                    <div className="flex items-start gap-4">
                      {/* File Info */}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <FileText className="w-5 h-5 text-blue-400" />
                          <span className="font-medium text-white">{uploadFile.file.name}</span>
                          <span className="text-sm text-gray-400">
                            ({formatFileSize(uploadFile.file.size)})
                          </span>
                          {uploadFile.autoDetected && (
                            <div className="flex items-center gap-1 ml-2">
                              <Zap className="w-4 h-4 text-[#ffbd59]" />
                              <span className="text-[#ffbd59] text-sm font-medium">
                                {uploadFile.confidence}% sicher
                              </span>
                            </div>
                          )}
                        </div>


                        {/* Category Selection */}
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">
                              Kategorie
                            </label>
                            <select
                              value={uploadFile.category || uploadFile.suggestedCategory || ''}
                              onChange={(e) => assignCategoryToFile(index, e.target.value)}
                              className={`w-full bg-[#2c3539] border rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#ffbd59] ${
                                uploadFile.suggestedCategory && !uploadFile.category 
                                  ? 'border-[#ffbd59]/50 bg-[#ffbd59]/5' 
                                  : 'border-gray-600'
                              }`}
                            >
                              <option value="">Kategorie wählen...</option>
                              {Object.entries(DOCUMENT_CATEGORIES).map(([key, category]) => (
                                <option key={key} value={key}>
                                  {category.name}
                                </option>
                              ))}
                            </select>
                          </div>
                
                          {(uploadFile.category || uploadFile.suggestedCategory) && (
                            <div>
                              <label className="block text-sm font-medium text-gray-300 mb-1">
                                Unterkategorie
                              </label>
                              <select
                                value={uploadFile.subcategory || uploadFile.suggestedSubcategory || ''}
                                onChange={(e) => assignCategoryToFile(index, uploadFile.category || uploadFile.suggestedCategory!, e.target.value)}
                                className={`w-full bg-[#2c3539] border rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#ffbd59] ${
                                  uploadFile.suggestedSubcategory && !uploadFile.subcategory 
                                    ? 'border-[#ffbd59]/50 bg-[#ffbd59]/5' 
                                    : 'border-gray-600'
                                }`}
                              >
                                <option value="">Unterkategorie wählen...</option>
                                {DOCUMENT_CATEGORIES[(uploadFile.category || uploadFile.suggestedCategory) as keyof typeof DOCUMENT_CATEGORIES]?.subcategories.map(sub => (
                                  <option key={sub} value={sub}>
                                    {sub}
                                  </option>
                                ))}
                              </select>
                            </div>
                          )}
                        </div>
                
                        {/* Progress Bar */}
                        {uploadFile.status === 'uploading' && (
                          <div className="mt-3">
                            <div className="bg-[#2c3539] rounded-full h-2">
                              <div 
                                className="bg-[#ffbd59] h-2 rounded-full transition-all duration-300"
                                style={{ width: `${uploadFile.progress}%` }}
                              />
                            </div>
                          </div>
                        )}

                        {/* Status */}
                        {uploadFile.status === 'success' && (
                          <div className="mt-2 flex items-center gap-2 text-green-400">
                            <CheckCircle className="w-4 h-4" />
                            <span className="text-sm">Upload erfolgreich</span>
                          </div>
                        )}

                        {uploadFile.status === 'error' && (
                          <div className="mt-2 flex items-center gap-2 text-red-400">
                            <AlertTriangle className="w-4 h-4" />
                            <span className="text-sm">{uploadFile.error || 'Upload fehlgeschlagen'}</span>
                          </div>
                        )}
                      </div>

                      {/* Remove Button */}
                      {uploadFile.status === 'pending' && (
                        <button
                          onClick={() => removeUploadFile(index)}
                          className="text-gray-400 hover:text-red-400 transition-colors"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-700 flex items-center justify-between">
              <div className="text-sm text-gray-400">
                {uploadFiles.length} Datei{uploadFiles.length !== 1 ? 'en' : ''} ausgewählt
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    setShowUploadModal(false);
                    setUploadFiles([]);
                  }}
                  className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                >
                  Abbrechen
                </button>
                <button
                  onClick={confirmDocumentCategorization}
                  disabled={uploadFiles.some(f => !f.category)}
                  className="bg-[#ffbd59] hover:bg-[#ffa726] disabled:bg-[#2c3539] disabled:cursor-not-allowed text-[#1a1a2e] disabled:text-gray-400 px-6 py-2 rounded-lg font-medium transition-colors"
                >
                  Kategorisierung bestätigen
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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

      {/* Projekt-Details-Modal */}
      {showProjectDetailsModal && currentProject && (
        <ProjectDetailsModal
          project={currentProject}
          isOpen={showProjectDetailsModal}
          onClose={() => setShowProjectDetailsModal(false)}
          onEdit={() => {
            setShowProjectDetailsModal(false);
            setShowEditProjectModal(true);
          }}
        />
      )}

      {/* Dokumenten-Sidebar (nur für Bauträger) */}
      {isBautraegerUser && (
        <DocumentSidebar onDocumentClick={handleDocumentClick} />
      )}

      {/* Dokumenten-Viewer-Modal */}
      <DocumentViewerModal
        document={selectedDocument}
        isOpen={showDocumentViewer}
        onClose={handleDocumentViewerClose}
        onNavigate={handleDocumentNavigate}
        canNavigatePrev={canNavigatePrev}
        canNavigateNext={canNavigateNext}
      />



      {/* Mobile Optimierte Ansicht */}
      {viewport.isMobile && (
        <MobileDashboardOptimized
          projects={projects}
          selectedProjectIndex={selectedProjectIndex}
          onProjectChange={setSelectedProjectIndex}
          projectStats={projectStats}
          projectTrades={projectTrades}
          allTradeQuotes={allTradeQuotes}
          onTradeClick={handleTradeClick}
          onAcceptQuote={async (quoteId: number, providerName?: string, isInspectionQuote?: boolean) => {
            try {
              await acceptQuoteWithAnimation(quoteId, providerName, isInspectionQuote);
              const activeTrades = await loadAndFilterTrades(selectedProject.id);
              setProjectTrades(activeTrades);
              await loadQuotesForTrades(activeTrades);
              await loadAppointmentsForTrades(activeTrades);
              setSuccess('Angebot erfolgreich angenommen!');
              setTimeout(() => setSuccess(''), 3000);
            } catch (e: any) {
              console.error('❌ Fehler beim Annehmen:', e);
              setError('Fehler beim Annehmen des Angebots');
            }
          }}
          onRejectQuote={async (quoteId: number, reason: string) => {
            try {
              await rejectQuote(quoteId, reason);
              const activeTrades = await loadAndFilterTrades(selectedProject.id);
              setProjectTrades(activeTrades);
              await loadQuotesForTrades(activeTrades);
              await loadAppointmentsForTrades(activeTrades);
              setSuccess('Angebot erfolgreich abgelehnt!');
              setTimeout(() => setSuccess(''), 3000);
            } catch (e: any) {
              console.error('❌ Fehler beim Ablehnen:', e);
              setError('Fehler beim Ablehnen des Angebots');
            }
          }}
          onCreateProject={handleCreateProjectClick}
          onCreateTrade={handleCreateTrade}
          onEditProject={handleOpenEditProjectModal}
          onProjectDetails={handleProjectDetailsClick}
        />
      )}

    </div>
  );
}

// Hauptkomponente mit Credit-Animation Provider
export default function Dashboard() {
  return (
    <CreditAnimationProvider>
      <DashboardWithCreditAnimation />
    </CreditAnimationProvider>
  );
} 