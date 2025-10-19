import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  Globe, 
  Star, 
  Settings, 
  ChevronDown, 
  ChevronLeft,
  ChevronRight,
  Moon, 
  Sun, 
  LogOut, 
  Plus,
  X,
  AlertTriangle,
  FileText,
  BarChart3,
  MessageCircle,
  Handshake,
  DollarSign,
  Palette,
  CheckSquare,
  Euro,
  MessageSquare,
  User,
  Menu,
  Target,
  Calendar,
  Coins,
  CloudUpload,
  Image,
  Shield,
  Eye,
  EyeOff,
  FolderOpen,
  Video,
  Archive,
  Info,
  Building,
  CheckCircle,
  Zap,
  Sparkles,
  Wrench,
  Clock,
  Users
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useProject } from '../context/ProjectContext';
import { getProject } from '../api/projectService';
import { createProject } from '../api/projectService';
import AddressAutocomplete from './AddressAutocomplete';
import { uploadDocument } from '../api/documentService';
import { DocumentCategorizer } from '../utils/documentCategorizer';

import CreditIndicator from './CreditIndicator';
import CreditDisplay from './CreditDisplay';
import NavbarCalendar from './NavbarCalendar';
import ContactTab from './ContactTab';
import CreditDeductionAnimation from './CreditDeductionAnimation';
import { appointmentService } from '../api/appointmentService';
import logo from '../logo_trans_big.png';

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
    icon: Settings,
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
    icon: Settings,
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
    icon: FolderOpen,
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
    icon: CheckCircle,
    color: 'emerald',
    subcategories: [
      'Auftragsbestätigungen',
      'Bestellbestätigungen',
      'Leistungsbestätigungen'
    ]
  }
};

// Hilfsfunktion für Bauphasen
function getConstructionPhases(country: string) {
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
}



export default function Navbar() {
  const { user, logout, isServiceProvider } = useAuth();
  const location = useLocation();
  const pathname = location.pathname;
  const { selectedProject, projects } = useProject();
  const [isDarkMode, setIsDarkMode] = useState(false);

  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [appointmentCount, setAppointmentCount] = useState(0);
  const [nextAppointment, setNextAppointment] = useState<any>(null);
  
  // Credit deduction animation state
  const [showCreditDeductionAnimation, setShowCreditDeductionAnimation] = useState(false);
  
  // Projekt-Erstellung State
  const [showCreateProjectModal, setShowCreateProjectModal] = useState(false);
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [createProjectError, setCreateProjectError] = useState<string | null>(null);
  const [isPrivacyBannerCollapsed, setIsPrivacyBannerCollapsed] = useState(true);
  const [showDocumentInheritanceTooltip, setShowDocumentInheritanceTooltip] = useState(false);
  
  // Dokument-Upload State
  const [uploadFiles, setUploadFiles] = useState<any[]>([]);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [projectForm, setProjectForm] = useState({
    name: '',
    description: '',
    project_type: 'new_build',
    address_street: '',
    address_zip: '',
    address_city: '',
    address_country: 'Schweiz',
    property_size: '',
    construction_area: '',
    start_date: '',
    end_date: '',
    budget: '',
    is_public: true,
    allow_quotes: true,
    construction_phase: ''
  });

  // Subtiler Projekt-Hinweis (außerhalb des Dashboards)
  const [currentProjectId, setCurrentProjectId] = useState<number | null>(null);
  const [currentProjectName, setCurrentProjectName] = useState<string | null>(null);
  const [isFetchingProject, setIsFetchingProject] = useState(false);

  useEffect(() => {
    // Nicht auf Dashboard/Service-Provider-Dashboard anzeigen
    if (pathname === '/' || pathname === '/service-provider') {
      setCurrentProjectId(null);
      setCurrentProjectName(null);
      return;
    }

    // 1) Context bevorzugen
    if (selectedProject) {
      setCurrentProjectId(selectedProject.id);
      setCurrentProjectName(selectedProject.name);
      return;
    }

    // 2) URL-Query ?project=ID
    const params = new URLSearchParams(location.search);
    const projectParam = params.get('project');
    if (projectParam && /^\d+$/.test(projectParam)) {
      const id = parseInt(projectParam, 10);
      setCurrentProjectId(id);
      // Versuche aus Projektliste zu lesen
      const inList = projects?.find(p => p.id === id);
      if (inList) {
        setCurrentProjectName(inList.name);
      } else {
        // Fallback: API-Fetch
        if (!isFetchingProject) {
          setIsFetchingProject(true);
          getProject(id).then(p => {
            setCurrentProjectName(p?.name || `Projekt #${id}`);
          }).catch(() => {
            setCurrentProjectName(`Projekt #${id}`);
          }).finally(() => setIsFetchingProject(false));
        }
      }
      return;
    }

    // 3) Route-Param aus /project/:id oder /messages/:projectId etc.
    const projectIdFromPath = (() => {
      const m1 = pathname.match(/\/project\/(\d+)/);
      if (m1) return parseInt(m1[1], 10);
      const m2 = pathname.match(/\/messages\/(\d+)/);
      if (m2) return parseInt(m2[1], 10);
      return null;
    })();

    if (projectIdFromPath) {
      setCurrentProjectId(projectIdFromPath);
      const inList = projects?.find(p => p.id === projectIdFromPath);
      if (inList) {
        setCurrentProjectName(inList.name);
      } else {
        if (!isFetchingProject) {
          setIsFetchingProject(true);
          getProject(projectIdFromPath).then(p => {
            setCurrentProjectName(p?.name || `Projekt #${projectIdFromPath}`);
          }).catch(() => {
            setCurrentProjectName(`Projekt #${projectIdFromPath}`);
          }).finally(() => setIsFetchingProject(false));
        }
      }
    } else {
      setCurrentProjectId(null);
      setCurrentProjectName(null);
    }
  }, [pathname, location.search, selectedProject, projects]);

  // Lade Terminanzahl beim Mount und bei Benutzeränderungen
  useEffect(() => {
    if (user) {
      loadAppointmentCount();
    }
  }, [user]);

  // Event-Listener für Termin-Updates
  useEffect(() => {
    const handleAppointmentUpdate = () => {
      console.log('📅 Appointment updated event received, reloading appointment count...');
      loadAppointmentCount();
    };

    const handleAppointmentResponse = () => {
      console.log('📅 Appointment response event received, reloading appointment count...');
      loadAppointmentCount();
    };

    const handleAppointmentCreated = () => {
      console.log('📅 Appointment created event received, reloading appointment count...');
      loadAppointmentCount();
    };

    // Verschiedene Events für Terminänderungen
    window.addEventListener('appointmentUpdated', handleAppointmentUpdate);
    window.addEventListener('appointmentResponse', handleAppointmentResponse);
    window.addEventListener('appointmentAccepted', handleAppointmentUpdate);
    window.addEventListener('appointmentRejected', handleAppointmentUpdate);
    window.addEventListener('appointmentCreated', handleAppointmentCreated);
    
    return () => {
      window.removeEventListener('appointmentUpdated', handleAppointmentUpdate);
      window.removeEventListener('appointmentResponse', handleAppointmentResponse);
      window.removeEventListener('appointmentAccepted', handleAppointmentUpdate);
      window.removeEventListener('appointmentRejected', handleAppointmentUpdate);
      window.removeEventListener('appointmentCreated', handleAppointmentCreated);
    };
  }, []);

  // Event-Listener für Credit-Deduktion-Animation
  useEffect(() => {
    const handleCreditDeduction = () => {
      console.log('💰 Credit deduction event received, showing animation...');
      setShowCreditDeductionAnimation(true);
    };

    window.addEventListener('creditDeduction', handleCreditDeduction);
    
    return () => {
      window.removeEventListener('creditDeduction', handleCreditDeduction);
    };
  }, []);

  // Öffne Projekt-Erstellungs-Modal, wenn ?create=project in der URL steht
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('create') === 'project') {
      setShowCreateProjectModal(true);
      // Query-Param entfernen, damit ein Refresh nicht erneut öffnet
      window.history.replaceState({}, '', pathname);
    }
  }, [location.search, pathname]);



  const handleLogout = () => {
    logout();
  };

  // Funktion zum Laden der Terminanzahl für den aktuellen Monat und des nächsten Termins
  const loadAppointmentCount = async () => {
    if (!user) return;
    
    try {
      const appointments = await appointmentService.getMyAppointments();
      console.log('📅 DEBUG: Alle Termine geladen:', appointments);
      console.log('📅 DEBUG: Benutzer-Info:', {
        userId: user?.id,
        userRole: user?.user_role,
        isServiceProvider: isServiceProvider()
      });
      
      // Aktueller Monat
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      console.log('📅 DEBUG: Aktueller Monat/Jahr:', { currentMonth, currentYear });
      
      // Filtere Termine basierend auf Benutzerrolle und aktuellem Monat
      const relevantAppointments = appointments.filter(apt => {
        const appointmentDate = new Date(apt.scheduled_date);
        const isCurrentMonth = appointmentDate.getMonth() === currentMonth && appointmentDate.getFullYear() === currentYear;
        
        console.log('📅 DEBUG: Prüfe Termin:', {
          appointmentId: apt.id,
          appointmentTitle: apt.title,
          appointmentDate: apt.scheduled_date,
          parsedDate: appointmentDate,
          isCurrentMonth,
          created_by: apt.created_by,
          userId: user?.id
        });
        
        if (!isCurrentMonth) {
          console.log('📅 DEBUG: Termin nicht im aktuellen Monat:', apt.id);
          return false;
        }
        
        if (isServiceProvider()) {
          // Dienstleister sehen nur Termine wo sie eingeladen wurden oder geantwortet haben
          const responses = Array.isArray(apt.responses) ? apt.responses : [];
          const invitedProviders = Array.isArray(apt.invited_service_providers) ? apt.invited_service_providers : [];
          
          console.log('📅 DEBUG: Dienstleister-Filterung für Termin:', {
            appointmentId: apt.id,
            responses: responses,
            invitedProviders: invitedProviders,
            userId: user?.id,
            // Alle verfügbaren Felder des Termins
            allFields: Object.keys(apt),
            fullAppointment: apt
          });
          
          // Erweiterte Logik: Prüfe alle möglichen Response-Felder
          const responsesArray = responses || [];
          const responsesArrayAlt = (apt as any).responses_array || [];
          const appointmentResponses = (apt as any).appointment_responses || [];
          const serviceProviderResponses = (apt as any).service_provider_responses || [];
          
          // Kombiniere alle Response-Arrays
          const allResponses = [
            ...responsesArray,
            ...responsesArrayAlt,
            ...appointmentResponses,
            ...serviceProviderResponses
          ];
          
          const hasResponse = responses.some((r: any) => 
            r.service_provider_id === user?.id || 
            String(r.service_provider_id) === String(user?.id) ||
            Number(r.service_provider_id) === Number(user?.id)
          );
          
          const hasResponseExtended = allResponses.some((r: any) => {
            if (!r) return false;
            return r.service_provider_id === user?.id || 
                   String(r.service_provider_id) === String(user?.id) ||
                   Number(r.service_provider_id) === Number(user?.id) ||
                   r.user_id === user?.id ||
                   String(r.user_id) === String(user?.id) ||
                   Number(r.user_id) === Number(user?.id);
          });
          
          const isInvited = invitedProviders.some((provider: any) => {
            if (typeof provider === 'number') {
              return provider === user?.id || 
                     String(provider) === String(user?.id) ||
                     Number(provider) === Number(user?.id);
            } else if (typeof provider === 'object' && provider !== null) {
              return provider.id === user?.id || 
                     String(provider.id) === String(user?.id) ||
                     Number(provider.id) === Number(user?.id);
            } else if (typeof provider === 'string') {
              return provider === String(user?.id) ||
                     Number(provider) === Number(user?.id);
            }
            return false;
          });
          
          const isRelevant = hasResponse || hasResponseExtended || isInvited;
          console.log('📅 DEBUG: Dienstleister-Relevanz (erweitert):', {
            appointmentId: apt.id,
            hasResponse,
            hasResponseExtended,
            isInvited,
            isRelevant,
            allResponsesCount: allResponses.length,
            invitedProvidersCount: invitedProviders.length
          });
          
          return isRelevant;
        } else {
          // Bauträger sehen alle Termine die sie erstellt haben
          const isRelevant = apt.created_by === user?.id;
          console.log('📅 DEBUG: Bauträger-Relevanz:', {
            appointmentId: apt.id,
            created_by: apt.created_by,
            userId: user?.id,
            isRelevant
          });
          return isRelevant;
        }
      });
      
      console.log('📅 DEBUG: Relevante Termine für aktuellen Monat:', relevantAppointments);
      console.log('📅 DEBUG: Terminanzahl für aktuellen Monat:', relevantAppointments.length);
      
      setAppointmentCount(relevantAppointments.length);
      
      // Finde den nächsten anstehenden Termin (nicht nur aktueller Monat)
      const allRelevantAppointments = appointments.filter(apt => {
        if (isServiceProvider()) {
          // Verwende die gleiche erweiterte Logik wie für Monats-Termine
          const responses = Array.isArray(apt.responses) ? apt.responses : [];
          const invitedProviders = Array.isArray(apt.invited_service_providers) ? apt.invited_service_providers : [];
          
          // Erweiterte Logik: Prüfe alle möglichen Response-Felder
          const responsesArray = responses || [];
          const responsesArrayAlt = (apt as any).responses_array || [];
          const appointmentResponses = (apt as any).appointment_responses || [];
          const serviceProviderResponses = (apt as any).service_provider_responses || [];
          
          // Kombiniere alle Response-Arrays
          const allResponses = [
            ...responsesArray,
            ...responsesArrayAlt,
            ...appointmentResponses,
            ...serviceProviderResponses
          ];
          
          const hasResponse = responses.some((r: any) => 
            r.service_provider_id === user?.id || 
            String(r.service_provider_id) === String(user?.id) ||
            Number(r.service_provider_id) === Number(user?.id)
          );
          
          const hasResponseExtended = allResponses.some((r: any) => {
            if (!r) return false;
            return r.service_provider_id === user?.id || 
                   String(r.service_provider_id) === String(user?.id) ||
                   Number(r.service_provider_id) === Number(user?.id) ||
                   r.user_id === user?.id ||
                   String(r.user_id) === String(user?.id) ||
                   Number(r.user_id) === Number(user?.id);
          });
          
          const isInvited = invitedProviders.some((provider: any) => {
            if (typeof provider === 'number') {
              return provider === user?.id || 
                     String(provider) === String(user?.id) ||
                     Number(provider) === Number(user?.id);
            } else if (typeof provider === 'object' && provider !== null) {
              return provider.id === user?.id || 
                     String(provider.id) === String(user?.id) ||
                     Number(provider.id) === Number(user?.id);
            } else if (typeof provider === 'string') {
              return provider === String(user?.id) ||
                     Number(provider) === Number(user?.id);
            }
            return false;
          });
          
          return hasResponse || hasResponseExtended || isInvited;
        } else {
          return apt.created_by === user?.id;
        }
      });
      
      const upcomingAppointments = allRelevantAppointments
        .filter(apt => {
          const appointmentDate = new Date(apt.scheduled_date);
          return appointmentDate > now && apt.status !== 'CANCELLED' && apt.status !== 'COMPLETED';
        })
        .sort((a, b) => new Date(a.scheduled_date).getTime() - new Date(b.scheduled_date).getTime());
      
      console.log('📅 DEBUG: Alle relevanten Termine:', allRelevantAppointments);
      console.log('📅 DEBUG: Anstehende Termine:', upcomingAppointments);
      
      if (upcomingAppointments.length > 0) {
        console.log('📅 DEBUG: Nächster Termin gesetzt:', upcomingAppointments[0]);
        setNextAppointment(upcomingAppointments[0]);
      } else {
        console.log('📅 DEBUG: Kein nächster Termin gefunden');
        setNextAppointment(null);
      }
    } catch (error) {
      console.error('❌ Fehler beim Laden der Terminanzahl:', error);
      setAppointmentCount(0);
      setNextAppointment(null);
    }
  };

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle('dark');
  };

  // Projekt-Erstellung Funktionen
  const handleCreateProjectClick = () => {
    setShowCreateProjectModal(true);
    setCreateProjectError(null);
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
      property_size: '',
      construction_area: '',
      start_date: '',
      end_date: '',
      budget: '',
      is_public: true,
      allow_quotes: true,
      construction_phase: ''
    });
  };

  const handleProjectFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setProjectForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleFileSelection = (files: File[]) => {
    const newFiles = files.map(file => {
      // Automatische Kategorisierung basierend auf Dateiname
      const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
      const detectedCategory = DocumentCategorizer.categorizeDocument(file.name, fileExtension);
      const suggestedSubcategory = detectedCategory ? DocumentCategorizer.suggestSubcategory(detectedCategory, file.name) : null;
      
      return {
        file,
        status: 'pending' as const,
        progress: 0,
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        autoDetected: !!detectedCategory,
        confidence: detectedCategory ? DocumentCategorizer.calculateConfidence(file.name, fileExtension, detectedCategory) : 0,
        suggestedCategory: detectedCategory?.id,
        suggestedSubcategory: suggestedSubcategory || undefined
      };
    });

    const filesWithSuggestions = [...uploadFiles, ...newFiles];
    
    // Automatically accept suggestions for auto-detected files
    const autoAcceptedFiles = filesWithSuggestions.map(file => {
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
        property_size: projectForm.property_size ? parseFloat(projectForm.property_size) : undefined,
        construction_area: projectForm.construction_area ? parseFloat(projectForm.construction_area) : undefined,
        start_date: projectForm.start_date || undefined,
        end_date: projectForm.end_date || undefined,
        budget: projectForm.budget ? parseFloat(projectForm.budget) : undefined,
        is_public: true,
        allow_quotes: projectForm.allow_quotes,
        construction_phase: projectForm.construction_phase || undefined
      };

      const newProject = await createProject(projectData);
      // Upload documents if any
      if (uploadFiles && uploadFiles.length > 0) {
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
            } catch (error) {
            console.error(`❌ Fehler beim Upload von ${uploadFile.file.name}:`, error);
          }
        }
        }

      // Schließe Modal und navigiere zur Startseite
      handleCloseCreateProjectModal();
      window.location.href = '/';

    } catch (error) {
      console.error('❌ Fehler beim Erstellen des Projekts:', error);
      setCreateProjectError(error instanceof Error ? error.message : 'Unbekannter Fehler beim Erstellen des Projekts');
    } finally {
      setIsCreatingProject(false);
    }
  };

  // Entfernt: frühere Helper zum Auslesen der Projekt-ID aus dem Pfad,
  // da der neue dezente Projekt-Hinweis robustere Ermittlung inklusive Fallbacks nutzt

  const isActive = (path: string) => pathname === path;
  const isProjectActive = () => pathname.includes('/project/');

  return (
    <nav className="mobile-nav-fix bg-gradient-to-r from-[#2c3539] to-[#3d4952] text-white shadow-xl border-b border-[#ffbd59]/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo und Hauptnavigation */}
          <div className="flex items-center gap-8">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3 group" data-tour-id="navbar-logo">
              <img src={logo} alt="BuildWise Logo" className="h-8 w-auto" />
              <span className="font-bold text-xl tracking-wide text-[#ffbd59] group-hover:text-[#ffa726] transition-colors">
                BuildWise
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-1">
              {isServiceProvider() ? (
                /* Dienstleister-Navigation: nur Dashboard und Gebühren */
                <>
                  <Link
                    to="/service-provider"
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 ${
                      isActive('/service-provider')
                        ? 'bg-[#ffbd59] text-[#2c3539] font-semibold shadow-lg' 
                        : 'text-white hover:bg-white/10 hover:text-[#ffbd59]'
                    }`}
                  >
                    <Home size={18} />
                    <span>Dashboard</span>
                  </Link>

                  <Link
                    to="/service-provider/buildwise-fees"
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 ${
                      isActive('/service-provider/buildwise-fees') 
                        ? 'bg-[#ffbd59] text-[#2c3539] font-semibold shadow-lg' 
                        : 'text-white hover:bg-white/10 hover:text-[#ffbd59]'
                    }`}
                  >
                    <Euro size={18} />
                    <span>Gebühren</span>
                  </Link>
                </>
              ) : (
                /* Bauträger-Navigation: vollständige Navigation */
                <>
                  <Link
                    to="/"
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 ${
                      isActive('/')
                        ? 'bg-[#ffbd59] text-[#2c3539] font-semibold shadow-lg' 
                        : 'text-white hover:bg-white/10 hover:text-[#ffbd59]'
                    }`}
                  >
                    <Home size={18} />
                    <span>Dashboard</span>
                  </Link>

                  <Link
                    to="/global-projects"
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 ${
                      isActive('/global-projects') 
                        ? 'bg-[#ffbd59] text-[#2c3539] font-semibold shadow-lg' 
                        : 'text-white hover:bg-white/10 hover:text-[#ffbd59]'
                    }`}
                  >
                    <Globe size={18} />
                    <span>Übersicht</span>
                  </Link>



                  {/* Pro Button für Bauträger deaktiviert */}
                  {/* 
                  <Link
                    to="/buildwise-fees"
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 ${
                      isActive('/buildwise-fees') 
                        ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white font-semibold shadow-lg' 
                        : 'text-purple-200 hover:bg-purple-500/20 hover:text-purple-100 border border-purple-400/30'
                    }`}
                  >
                    <Star size={18} />
                    <span>Pro</span>
                  </Link>
                  */}


                </>
              )}
            </div>
          </div>



          {/* Rechte Seite */}
          <div className="flex items-center gap-4">
            {/* Moderne Termin-Anzeige */}
            <div className="hidden md:flex items-center gap-3 px-4 py-2.5 bg-gradient-to-br from-white/5 via-white/10 to-white/5 rounded-2xl border border-white/20 backdrop-blur-xl shadow-2xl shadow-black/20 hover:shadow-2xl hover:shadow-[#ffbd59]/20 transition-all duration-500 group cursor-pointer relative overflow-hidden"
                 onClick={() => setShowCalendar(!showCalendar)}
                 title={nextAppointment ? `Termine diesen Monat: ${appointmentCount} | Nächster Termin: ${nextAppointment.title} am ${new Date(nextAppointment.scheduled_date).toLocaleDateString('de-DE', { 
                   weekday: 'long',
                   day: '2-digit', 
                   month: 'long',
                   year: 'numeric',
                   hour: '2-digit',
                   minute: '2-digit'
                 })}` : `Termine diesen Monat: ${appointmentCount} | Terminkalender öffnen`}>
                
                {/* Moderne Glow-Effekte */}
                <div className="absolute inset-0 bg-gradient-to-r from-[#ffbd59]/5 via-transparent to-[#ffa726]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-[#ffbd59]/10 to-[#ffa726]/10 blur-xl opacity-0 group-hover:opacity-50 transition-opacity duration-500"></div>
                
                {/* Terminanzahl Badge */}
                <div className="flex items-center gap-2 relative z-10">
                  <div className="relative">
                    <div className="p-2 rounded-xl bg-gradient-to-br from-[#ffbd59]/20 to-[#ffa726]/20 backdrop-blur-sm border border-[#ffbd59]/30 group-hover:scale-110 transition-transform duration-300">
                      <Calendar size={16} className="text-[#ffbd59] group-hover:text-white transition-colors duration-300" />
                    </div>
                    {appointmentCount > 0 && (
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-br from-[#ffbd59] via-[#ffa726] to-[#ff8c42] rounded-full flex items-center justify-center shadow-lg shadow-[#ffbd59]/50">
                        <span className="text-white text-xs font-bold leading-none drop-shadow-sm">{appointmentCount}</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Nächster Termin */}
                  {nextAppointment && (
                    <div className="flex items-center gap-2 text-sm">
                      <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-gradient-to-r from-gray-800/50 to-gray-700/50 backdrop-blur-sm border border-gray-600/30">
                        <Clock size={12} className="text-[#ffbd59] animate-pulse" />
                        <span className="text-gray-100 font-medium tracking-wide">
                          {new Date(nextAppointment.scheduled_date).toLocaleDateString('de-DE', { 
                            day: '2-digit', 
                            month: '2-digit' 
                          })}
                        </span>
                      </div>
                      <ChevronRight size={12} className="text-gray-400 group-hover:text-[#ffbd59] group-hover:translate-x-1 transition-all duration-300" />
                    </div>
                  )}
                </div>
              </div>



            {/* Dezenter Projekt-Hinweis (außer Dashboard) */}
            {currentProjectId && currentProjectName && (
              <Link
                to={`/project/${currentProjectId}`}
                className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full border border-white/20 bg-white/10 hover:bg-white/15 text-sm text-gray-200 transition-colors"
                title={`Zum Projekt: ${currentProjectName}`}
                data-tour-id="navbar-current-project"
              >
                <Building size={16} className="text-[#ffbd59]" />
                <span className="max-w-[220px] truncate">{currentProjectName}</span>
              </Link>
            )}
            {/* Pro-Button für Bauträger - DEAKTIVIERT */}
            {!isServiceProvider() && user?.user_role === 'bautraeger' && (
              <div className="hidden md:block">
                {user?.subscription_plan === 'pro' && user?.subscription_status === 'active' ? (
                  // Pro-Badge für aktive Pro-User - NICHT KLICKBAR
                  <div className="flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-[#ffbd59] to-[#ffa726] rounded-full cursor-default opacity-75">
                    <span className="text-[#2c3539] font-semibold text-sm">💎 Pro</span>
                  </div>
                ) : (
                  // Pro-Upgrade-Button für Basis-User - NICHT KLICKBAR
                  <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-gray-600 to-gray-700 text-gray-400 rounded-lg font-semibold cursor-not-allowed opacity-60">
                    <span className="text-lg">💎</span>
                    <span>Pro</span>
                  </div>
                )}
              </div>
            )}
            
            

            {/* Credit-Indicator für Bauträger */}
            {!isServiceProvider() && user?.user_role === 'BAUTRAEGER' && (
              <div className="hidden md:block" data-tour-id="navbar-credits">
                <CreditDisplay />
              </div>
            )}

            {/* Benutzer-Menü */}
            <div className="relative" data-tour-id="navbar-profile">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-3 p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-[#ffbd59] to-[#ffa726] rounded-full flex items-center justify-center">
                  <span className="text-[#2c3539] font-semibold text-sm">
                    {user?.first_name?.[0]}{user?.last_name?.[0]}
                  </span>
                </div>
                <div className="hidden sm:block text-left">
                  <div className="text-sm font-medium text-white">
                    {user?.first_name} {user?.last_name}
                  </div>
                  <div className="text-xs text-gray-300">{user?.user_type}</div>
                </div>
                <ChevronDown size={16} className="text-gray-300" />
              </button>
              
              {showUserMenu && (
                <div className="absolute right-0 top-full mt-2 w-64 bg-[#3d4952] rounded-xl shadow-2xl border border-white/20 z-50">
                  <div className="p-2">
                    <div className="p-3 border-b border-white/10">
                      <div className="font-medium text-white">
                        {user?.first_name} {user?.last_name}
                      </div>
                      <div className="text-sm text-gray-300">{user?.email}</div>
                    </div>
                    
                    <div className="p-2 space-y-1">
                      <button
                        onClick={toggleDarkMode}
                        className="flex items-center justify-between w-full p-3 rounded-lg hover:bg-white/10 transition-colors text-white"
                      >
                        <div className="flex items-center gap-3">
                          {isDarkMode ? <Moon size={16} /> : <Sun size={16} />}
                          <span className="text-sm">
                            {isDarkMode ? 'Dark Mode' : 'Light Mode'}
                          </span>
                        </div>
                        <div className={`w-10 h-6 rounded-full transition-colors ${isDarkMode ? 'bg-[#ffbd59]' : 'bg-gray-600'}`}>
                          <div className={`w-4 h-4 bg-white rounded-full transition-transform ${isDarkMode ? 'translate-x-4' : 'translate-x-0'} mt-1 ml-1`}></div>
                        </div>
                      </button>
                      
                      <Link
                        to="/profile"
                        className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/10 transition-colors text-white"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <User size={16} />
                        <span className="text-sm">Profil bearbeiten</span>
                      </Link>
                      
                      
                      <div className="border-t border-white/10 pt-1 mt-1">
                        <button
                          onClick={handleLogout}
                          className="flex items-center gap-3 p-3 rounded-lg hover:bg-red-500/20 text-red-300 transition-colors w-full"
                        >
                          <LogOut size={16} />
                          <span className="text-sm">Abmelden</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="md:hidden mobile-touch-target hover:bg-white/10 rounded-lg transition-colors"
            >
              {showMobileMenu ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {showMobileMenu && (
          <div className="md:hidden mobile-container border-t border-white/10 py-4 relative z-50">
            <div className="space-y-2">
              {isServiceProvider() ? (
                /* Dienstleister Mobile Menu: nur Dashboard und Gebühren */
                <>
                  <Link
                    to="/service-provider"
                    className={`mobile-link flex items-center gap-3 p-3 rounded-lg transition-colors ${
                      isActive('/service-provider') ? 'bg-[#ffbd59] text-[#2c3539]' : 'text-white hover:bg-white/10'
                    }`}
                    onClick={() => setShowMobileMenu(false)}
                  >
                    <Home size={18} />
                    <span>Dashboard</span>
                  </Link>
                  
                  <Link
                    to="/service-provider/buildwise-fees"
                    className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                      isActive('/service-provider/buildwise-fees') ? 'bg-[#ffbd59] text-[#2c3539]' : 'text-white hover:bg-white/10'
                    }`}
                    onClick={() => setShowMobileMenu(false)}
                  >
                    <Euro size={18} />
                    <span>Gebühren</span>
                  </Link>
                </>
              ) : (
                /* Bauträger Mobile Menu: vollständige Navigation */
                <>
                  <Link
                    to="/"
                    className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                      isActive('/') ? 'bg-[#ffbd59] text-[#2c3539]' : 'text-white hover:bg-white/10'
                    }`}
                    onClick={() => setShowMobileMenu(false)}
                  >
                    <Home size={18} />
                    <span>Dashboard</span>
                  </Link>
                  
                  <Link
                    to="/global-projects"
                    className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                      isActive('/global-projects') ? 'bg-[#ffbd59] text-[#2c3539]' : 'text-white hover:bg-white/10'
                    }`}
                    onClick={() => setShowMobileMenu(false)}
                  >
                    <Globe size={18} />
                    <span>Globale Übersicht</span>
                  </Link>
                  
                  <Link
                    to="/tasks"
                    className="flex items-center gap-3 p-3 rounded-lg text-white hover:bg-white/10 transition-colors"
                    onClick={() => setShowMobileMenu(false)}
                  >
                    <Target size={18} />
                    <span>Aufgaben</span>
                  </Link>
                  
                  <Link
                    to="/documents"
                    className="flex items-center gap-3 p-3 rounded-lg text-white hover:bg-white/10 transition-colors"
                    onClick={() => setShowMobileMenu(false)}
                  >
                    <FileText size={18} />
                    <span>Dokumente</span>
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Click outside to close dropdowns */}
      {(showUserMenu || showMobileMenu) && (
        <div 
          className="fixed inset-0 z-40 bg-transparent" 
          onClick={() => {
            setShowUserMenu(false);
            setShowMobileMenu(false);
          }}
        />
      )}

      {/* NavbarCalendar */}
      <NavbarCalendar 
        isOpen={showCalendar}
        onClose={() => setShowCalendar(false)}
      />

      {/* ContactTab */}
      <ContactTab
        userRole={user?.user_role as 'BAUTRAEGER' | 'DIENSTLEISTER'}
        userId={user?.id || 0}
      />

      {/* Credit Deduction Animation */}
      <CreditDeductionAnimation
        isVisible={showCreditDeductionAnimation}
        onComplete={() => setShowCreditDeductionAnimation(false)}
      />



      {/* Projekt-Erstellungs-Modal */}
      {showCreateProjectModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-[#2c3539] to-[#3d4952] rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-[#ffbd59]/20 relative">
            
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

            <div className={`p-6 transition-all duration-300 ${
              isPrivacyBannerCollapsed ? 'mr-16' : 'mr-80 lg:mr-80 md:mr-64 sm:mr-48'
            }`}>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">Neues Projekt erstellen</h2>
                <button
                  onClick={handleCloseCreateProjectModal}
                  className="text-gray-400 hover:text-[#ffbd59] transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleCreateProject} className="space-y-6">
                {/* Grundinformationen */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-200 mb-2">
                      Projektname *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={projectForm.name}
                      onChange={handleProjectFormChange}
                      required
                      className="w-full px-3 py-2 bg-[#1a1a2e]/50 border border-gray-600 rounded-lg focus:ring-2 focus:ring-[#ffbd59] focus:border-[#ffbd59] text-white placeholder-gray-400"
                      placeholder="z.B. Einfamilienhaus München"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-200 mb-2">
                      Land
                    </label>
                    <select
                      name="address_country"
                      value={projectForm.address_country}
                      onChange={handleProjectFormChange}
                      className="w-full px-3 py-2 bg-[#1a1a2e]/50 border border-gray-600 rounded-lg focus:ring-2 focus:ring-[#ffbd59] focus:border-[#ffbd59] text-white"
                    >
                      <option value="Deutschland">Deutschland</option>
                      <option value="Schweiz">Schweiz</option>
                      <option value="Österreich">Österreich</option>
                    </select>
                  </div>
                </div>

                {/* Projekttyp */}
                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-2">
                    Projekttyp *
                  </label>
                  <select
                    name="project_type"
                    value={projectForm.project_type}
                    onChange={handleProjectFormChange}
                    required
                    className="w-full px-3 py-2 bg-[#1a1a2e]/50 border border-gray-600 rounded-lg focus:ring-2 focus:ring-[#ffbd59] focus:border-[#ffbd59] text-white"
                  >
                    <option value="new_build">Neubau</option>
                    <option value="renovation">Renovierung</option>
                    <option value="extension">Anbau</option>
                    <option value="refurbishment">Sanierung</option>
                  </select>
                </div>

                {/* Bauphasen-Auswahl (nur bei Neubau) */}
                {projectForm.project_type === 'new_build' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-200 mb-2">
                      🏗️ Aktuelle Bauphase (optional)
                    </label>
                    <select
                      name="construction_phase"
                      value={projectForm.construction_phase}
                      onChange={handleProjectFormChange}
                      className="w-full px-3 py-2 bg-[#1a1a2e]/50 border border-gray-600 rounded-lg focus:ring-2 focus:ring-[#ffbd59] focus:border-[#ffbd59] text-white"
                    >
                      <option value="">Keine Phase ausgewählt</option>
                      {getConstructionPhases(projectForm.address_country).map((phase) => (
                        <option key={phase.value} value={phase.value}>
                          {phase.label}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-400 mt-1">
                      💡 Wählen Sie die aktuelle Bauphase für {projectForm.address_country}
                    </p>
                  </div>
                )}

                {/* Beschreibung */}
                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-2">
                    Beschreibung
                  </label>
                  <textarea
                    name="description"
                    value={projectForm.description}
                    onChange={handleProjectFormChange}
                    rows={3}
                    className="w-full px-3 py-2 bg-[#1a1a2e]/50 border border-gray-600 rounded-lg focus:ring-2 focus:ring-[#ffbd59] focus:border-[#ffbd59] text-white placeholder-gray-400"
                    placeholder="Beschreiben Sie Ihr Projekt..."
                  />
                </div>

                {/* Adresse */}
                <div className="space-y-4">
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
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-200 mb-2">
                      Grundstücksgröße (m²)
                    </label>
                    <input
                      type="number"
                      name="property_size"
                      value={projectForm.property_size}
                      onChange={handleProjectFormChange}
                      className="w-full px-3 py-2 bg-[#1a1a2e]/50 border border-gray-600 rounded-lg focus:ring-2 focus:ring-[#ffbd59] focus:border-[#ffbd59] text-white placeholder-gray-400"
                      placeholder="z.B. 500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-200 mb-2">
                      Wohnfläche (m²)
                    </label>
                    <input
                      type="number"
                      name="construction_area"
                      value={projectForm.construction_area}
                      onChange={handleProjectFormChange}
                      className="w-full px-3 py-2 bg-[#1a1a2e]/50 border border-gray-600 rounded-lg focus:ring-2 focus:ring-[#ffbd59] focus:border-[#ffbd59] text-white placeholder-gray-400"
                      placeholder="z.B. 150"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-200 mb-2">
                      Budget (€)
                    </label>
                    <input
                      type="number"
                      name="budget"
                      value={projectForm.budget}
                      onChange={handleProjectFormChange}
                      className="w-full px-3 py-2 bg-[#1a1a2e]/50 border border-gray-600 rounded-lg focus:ring-2 focus:ring-[#ffbd59] focus:border-[#ffbd59] text-white placeholder-gray-400"
                      placeholder="z.B. 500000"
                    />
                  </div>
                </div>

                {/* Zeitplan */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-200 mb-2">
                      Startdatum
                    </label>
                    <input
                      type="date"
                      name="start_date"
                      value={projectForm.start_date}
                      onChange={handleProjectFormChange}
                      className="w-full px-3 py-2 bg-[#1a1a2e]/50 border border-gray-600 rounded-lg focus:ring-2 focus:ring-[#ffbd59] focus:border-[#ffbd59] text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-200 mb-2">
                      <span className="hidden sm:inline">Voraussichtliches Enddatum</span>
                      <span className="sm:hidden">Vrsl. Enddatum</span>
                    </label>
                    <input
                      type="date"
                      name="end_date"
                      value={projectForm.end_date}
                      onChange={handleProjectFormChange}
                      className="w-full px-3 py-2 bg-[#1a1a2e]/50 border border-gray-600 rounded-lg focus:ring-2 focus:ring-[#ffbd59] focus:border-[#ffbd59] text-white"
                    />
                    <div className="flex flex-wrap gap-2 mt-2">
                      <button
                        type="button"
                        onClick={() => {
                          if (!projectForm.start_date) return;
                          const startDate = new Date(projectForm.start_date);
                          const next6Months = new Date(startDate.getFullYear(), startDate.getMonth() + 6, startDate.getDate());
                          setProjectForm(prev => ({ ...prev, end_date: next6Months.toISOString().split('T')[0] }));
                        }}
                        className="px-2 py-1 text-xs bg-[#ffbd59]/20 hover:bg-[#ffbd59]/30 text-[#ffbd59] rounded border border-[#ffbd59]/30 transition-colors"
                      >
                        +6M
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (!projectForm.start_date) return;
                          const startDate = new Date(projectForm.start_date);
                          const nextYear = new Date(startDate.getFullYear() + 1, startDate.getMonth(), startDate.getDate());
                          setProjectForm(prev => ({ ...prev, end_date: nextYear.toISOString().split('T')[0] }));
                        }}
                        className="px-2 py-1 text-xs bg-[#ffbd59]/20 hover:bg-[#ffbd59]/30 text-[#ffbd59] rounded border border-[#ffbd59]/30 transition-colors"
                      >
                        +1J
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (!projectForm.start_date) return;
                          const startDate = new Date(projectForm.start_date);
                          const next18Months = new Date(startDate.getFullYear(), startDate.getMonth() + 18, startDate.getDate());
                          setProjectForm(prev => ({ ...prev, end_date: next18Months.toISOString().split('T')[0] }));
                        }}
                        className="px-2 py-1 text-xs bg-[#ffbd59]/20 hover:bg-[#ffbd59]/30 text-[#ffbd59] rounded border border-[#ffbd59]/30 transition-colors"
                      >
                        +18M
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (!projectForm.start_date) return;
                          const startDate = new Date(projectForm.start_date);
                          const next2Years = new Date(startDate.getFullYear() + 2, startDate.getMonth(), startDate.getDate());
                          setProjectForm(prev => ({ ...prev, end_date: next2Years.toISOString().split('T')[0] }));
                        }}
                        className="px-2 py-1 text-xs bg-[#ffbd59]/20 hover:bg-[#ffbd59]/30 text-[#ffbd59] rounded border border-[#ffbd59]/30 transition-colors"
                      >
                        +2J
                      </button>
                    </div>
                  </div>
                </div>

                {/* Einstellungen */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      name="allow_quotes"
                      checked={projectForm.allow_quotes}
                      onChange={handleProjectFormChange}
                      className="w-4 h-4 text-[#ffbd59] bg-[#1a1a2e]/50 border-gray-600 rounded focus:ring-[#ffbd59] focus:ring-2"
                    />
                    <label className="text-sm text-gray-200">
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
                      onClick={() => {
                        const input = document.createElement('input');
                        input.type = 'file';
                        input.multiple = true;
                        input.accept = '.pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.mp4,.mov,.avi';
                        input.onchange = (e) => {
                          const files = Array.from((e.target as HTMLInputElement).files || []);
                          handleFileSelection(files);
                        };
                        input.click();
                      }}
                      className="bg-[#ffbd59] hover:bg-[#ff8c42] text-white px-6 py-3 rounded-lg font-medium transition-colors"
                    >
                      Dateien auswählen
                    </button>
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
                            return FileText;
                          };
                          
                          const FileIconComponent = getFileIcon(uploadFile.file);
                          return (
                            <div key={uploadFile.id} className="flex items-center justify-between p-4 bg-[#1a1a2e]/50 rounded-lg border border-gray-600/30">
                              <div className="flex items-center space-x-3">
                                <FileIconComponent className="w-6 h-6 text-[#ffbd59]" />
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
                                    {uploadFile.autoDetected && (
                                      <span className="ml-2 text-green-400 flex items-center gap-1">
                                        <Zap className="w-3 h-3" />
                                        Auto-erkannt ({uploadFile.confidence}%)
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

                {/* Fehler-Anzeige */}
                {createProjectError && (
                  <div className="bg-red-500/20 border border-red-500/30 text-red-300 px-4 py-3 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <AlertTriangle size={16} />
                      <span>{createProjectError}</span>
                    </div>
                  </div>
                )}

                {/* Buttons */}
                <div className="flex items-center justify-end space-x-4 pt-4">
                  <button
                    type="button"
                    onClick={handleCloseCreateProjectModal}
                    className="px-6 py-2 text-gray-300 hover:text-white transition-colors"
                  >
                    Abbrechen
                  </button>
                  <button
                    type="submit"
                    disabled={isCreatingProject}
                    className="flex items-center space-x-2 bg-[#ffbd59] hover:bg-[#ffa726] disabled:bg-gray-600 text-[#2c3539] px-6 py-2 rounded-lg font-semibold transition-colors duration-200"
                  >
                    {isCreatingProject ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#2c3539]"></div>
                        <span>Erstelle...</span>
                      </>
                    ) : (
                      <>
                        <Plus size={16} />
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
                            ({(uploadFile.file.size / 1024 / 1024).toFixed(2)} MB)
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

                        {/* Auto-Detection Suggestion */}
                        {uploadFile.autoDetected && uploadFile.suggestedCategory && (
                          <div className="mb-3 p-3 bg-[#ffbd59]/10 border border-[#ffbd59]/30 rounded-lg">
                            <div className="flex items-center gap-2">
                              <Target className="w-4 h-4 text-[#ffbd59]" />
                              <span className="text-[#ffbd59] text-sm font-medium">
                                Kategorisierungsvorschlag: <strong>{DOCUMENT_CATEGORIES[uploadFile.suggestedCategory as keyof typeof DOCUMENT_CATEGORIES]?.name}</strong>
                                {uploadFile.suggestedSubcategory && ` > ${uploadFile.suggestedSubcategory}`}
                              </span>
                            </div>
                          </div>
                        )}


                        {/* Category Selection */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Kategorie */}
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                              Kategorie *
                            </label>
                            <select
                              value={uploadFile.category || uploadFile.suggestedCategory || ''}
                              onChange={(e) => {
                                const newCategory = e.target.value;
                                setUploadFiles(prev => prev.map((f, i) => 
                                  i === index 
                                    ? { ...f, category: newCategory, subcategory: '', document_type: 'other' }
                                    : f
                                ));
                              }}
                              className="w-full px-3 py-2 bg-[#1a1a2e]/50 border border-gray-600 rounded-lg focus:ring-2 focus:ring-[#ffbd59] focus:border-[#ffbd59] text-white"
                            >
                              <option value="">Kategorie wählen...</option>
                              {Object.entries(DOCUMENT_CATEGORIES).map(([key, category]) => (
                                <option key={key} value={key}>
                                  {category.name}
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Unterkategorie */}
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                              Unterkategorie *
                            </label>
                            <select
                              value={uploadFile.subcategory || uploadFile.suggestedSubcategory || ''}
                              onChange={(e) => {
                                setUploadFiles(prev => prev.map((f, i) => 
                                  i === index 
                                    ? { ...f, subcategory: e.target.value }
                                    : f
                                ));
                              }}
                              disabled={!(uploadFile.category || uploadFile.suggestedCategory)}
                              className="w-full px-3 py-2 bg-[#1a1a2e]/50 border border-gray-600 rounded-lg focus:ring-2 focus:ring-[#ffbd59] focus:border-[#ffbd59] text-white disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <option value="">Unterkategorie wählen...</option>
                              {(uploadFile.category || uploadFile.suggestedCategory) && DOCUMENT_CATEGORIES[(uploadFile.category || uploadFile.suggestedCategory) as keyof typeof DOCUMENT_CATEGORIES]?.subcategories.map((sub) => (
                                <option key={sub} value={sub}>
                                  {sub}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>

                      {/* Remove Button */}
                      <button
                        onClick={() => setUploadFiles(prev => prev.filter((_, i) => i !== index))}
                        className="text-gray-400 hover:text-red-400 transition-colors p-1"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-700">
              <div className="flex items-center justify-between">
                <p className="text-gray-300 text-sm">
                  {uploadFiles.filter(f => f.category && f.subcategory).length} von {uploadFiles.length} Dokumenten kategorisiert
                </p>
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
                    onClick={() => setShowUploadModal(false)}
                    disabled={uploadFiles.some(f => !f.category && !f.subcategory)}
                    className="bg-[#ffbd59] hover:bg-[#ffa726] disabled:bg-[#2c3539] disabled:cursor-not-allowed text-[#1a1a2e] disabled:text-gray-400 px-6 py-2 rounded-lg font-medium transition-colors"
                  >
                    Kategorisierung bestätigen
                  </button>
                </div>
              </div>
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
    </nav>
  );
} 
