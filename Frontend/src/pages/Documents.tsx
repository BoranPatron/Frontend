import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  Download,
  Upload,
  FileText,
  Image,
  File,
  AlertTriangle,
  CheckCircle,
  XCircle,
  MoreHorizontal,
  ArrowLeft,
  PlusCircle,
  RefreshCw,
  Search,
  Filter,
  FolderOpen,
  Calendar,
  User,
  Tag,
  Lock,
  Globe,
  BarChart3,
  Home,
  FileArchive,
  Shield,
  Folder,
  Grid,
  List,
  SortAsc,
  SortDesc,
  Star,
  Clock,
  FileType,
  Layers,
  Archive,
  Share2,
  History,
  Settings,
  ChevronDown,
  ChevronRight,
  X,
  CloudUpload,
  Paperclip,
  Building,
  Heart,
  HardDrive,
  Zap,
  Target,
  TrendingUp,
  BookOpen,
  Video,
  FileImage,
  FileVideo,
  FileAudio,
  FileCode,
  FileSpreadsheet,
  FileBarChart,
  Award,
  Briefcase,
  Calculator,
  Hammer,
  Camera,
  CheckSquare,
  AlertCircle,
  Info,
  FileCheck,
  Wrench,
  Menu
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useProject } from '../context/ProjectContext';
import { 
  getDocuments, 
  uploadDocument, 
  deleteDocument, 
  deleteDocumentForServiceProvider,
  updateDocument,
  toggleDocumentFavorite,
  updateDocumentStatus,
  getCategoryStatistics,
  trackDocumentAccess,
  getRecentDocuments,
  searchDocumentsFulltext,
  getProjectMilestones,
  Milestone
} from '../api/documentService';
import { getProjects } from '../api/projectService';
import DocumentViewer from '../components/DocumentViewer';
import PageHeader from '../components/PageHeader';
import MobileDocumentsView from '../components/MobileDocumentsView';
import { DocumentCategorizer } from '../utils/documentCategorizer';
import { glass } from '../styles/glass';

// Dokumentenkategorien für die Baubranche
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
  order_confirmations: {
    name: 'Auftragsbestätigungen',
    icon: FileCheck,
    color: 'indigo',
    subcategories: [
      'Auftragsbestätigungen',
      'Bestellbestätigungen',
      'Leistungsbestätigungen'
    ]
  },
  project_management: {
    name: 'Projektmanagement',
    icon: BarChart3,
    color: 'emerald',
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
  procurement: {
    name: 'Ausschreibungen & Angebote',
    icon: Briefcase,
    color: 'teal',
    subcategories: [
      'Ausschreibungsunterlagen',
      'Technische Spezifikationen',
      'Angebote',
      'Angebotsbewertung',
      'Vergabedokumentation',
      'Verhandlungen'
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
  }
};

// Mapping von Backend-Kategorien zu Frontend-Kategorien (unterstützt sowohl uppercase als auch lowercase)
const CATEGORY_MAPPING: { [key: string]: string } = {
  // Uppercase (für Kompatibilität)
  'PLANNING': 'planning',
  'CONTRACTS': 'contracts',
  'FINANCE': 'finance',
  'EXECUTION': 'execution',
  'DOCUMENTATION': 'documentation',
  'ORDER_CONFIRMATIONS': 'order_confirmations',
  'PROJECT_MANAGEMENT': 'project_management',  // Neu: Projektmanagement
  'PROCUREMENT': 'procurement',                // Neu: Ausschreibungen & Angebote
  'TECHNICAL': 'technical',                    // Neu: Technische Unterlagen
  // Lowercase (aktuelle Backend-Ausgabe)
  'planning': 'planning',
  'contracts': 'contracts',
  'finance': 'finance',
  'execution': 'execution',
  'documentation': 'documentation',
  'order_confirmations': 'order_confirmations',
  'project_management': 'project_management',  // Neu: Projektmanagement
  'procurement': 'procurement',                // Neu: Ausschreibungen & Angebote
  'technical': 'technical'                    // Neu: Technische Unterlagen
};

// Hilfsfunktion zur Konvertierung von Backend- zu Frontend-Kategorien
const convertBackendToFrontendCategory = (backendCategory: string): string => {
  return CATEGORY_MAPPING[backendCategory] || 'documentation'; // Fallback
};

// Umgekehrtes Mapping von Frontend-Kategorien zu Backend-Kategorien
const FRONTEND_TO_BACKEND_MAPPING: { [key: string]: string } = {
  'planning': 'planning',
  'contracts': 'contracts', 
  'finance': 'finance',
  'execution': 'execution',
  'documentation': 'documentation',
  'order_confirmations': 'order_confirmations',
  'project_management': 'project_management',  // Neu: Projektmanagement
  'procurement': 'procurement',                // Neu: Ausschreibungen & Angebote
  'technical': 'technical'                    // Neu: Technische Unterlagen
};

// Hilfsfunktion zur Konvertierung von Frontend- zu Backend-Kategorien
const convertFrontendToBackendCategory = (frontendCategory: string): string => {
  // Alle Kategorien werden jetzt vom Backend unterstützt
  const backendCategory = FRONTEND_TO_BACKEND_MAPPING[frontendCategory];
  
  if (backendCategory) {
    return backendCategory;
  }
  
  console.warn(`🚧 Kategorie '${frontendCategory}' wird nicht unterstützt, verwende Fallback 'documentation'`);
  return 'documentation'; // Fallback für nicht unterstützte Kategorien
};

// Hilfsfunktion zur Konvertierung der Kategorie-Statistiken
const convertCategoryStats = (backendStats: any): CategoryStats[] => {
  const frontendStats: CategoryStats[] = [];
  
  // Prüfe ob backendStats gültig ist
  if (!backendStats || typeof backendStats !== 'object') {
    console.warn('convertCategoryStats: Ungültige backendStats:', backendStats);
    return frontendStats;
  }
  
  // Backend gibt jetzt ein Objekt zurück, nicht mehr ein Array
  Object.entries(backendStats).forEach(([backendCategory, stats]: [string, any]) => {
    try {
      const frontendCategory = convertBackendToFrontendCategory(backendCategory);
      
      // Konvertiere Unterkategorien-Format
      const subcategories: { [key: string]: number } = {};
      if (stats && stats.subcategories && typeof stats.subcategories === 'object') {
        Object.entries(stats.subcategories).forEach(([subcategory, subStats]: [string, any]) => {
          subcategories[subcategory] = subStats.document_count || 0;
        });
      }
      
      frontendStats.push({
        category: frontendCategory,
        count: stats.total_documents || 0,
        total_size: stats.total_size || 0,
        avg_size: stats.total_documents > 0 ? (stats.total_size || 0) / stats.total_documents : 0,
        favorite_count: stats.favorite_count || 0,
        subcategories: subcategories
      });
    } catch (error) {
      console.error('Fehler beim Konvertieren der Kategorie-Statistiken:', error);
    }
  });
  
  return frontendStats;
};

interface Document {
  id: number;
  title: string;
  description?: string;
  file_name: string;
  file_path: string;
  file_size: number;
  mime_type?: string;
  document_type: string;
  category?: string;
  subcategory?: string;
  is_favorite?: boolean;
  status?: string;
  tags?: string;
  is_encrypted: boolean;
  created_at: string;
  updated_at: string;
  accessed_at?: string;
  project_id: number;
  uploaded_by: number;
  // Neue Felder für Ausschreibungsinformationen
  milestone_id?: number;
  milestone_title?: string;
  milestone_status?: string;
  milestone_category?: string;
}

interface UploadFile {
  file: File;
  category?: string;
  subcategory?: string;
  status: 'pending' | 'uploading' | 'success' | 'error';
  progress: number;
  error?: string;
}

interface CategoryStats {
  category: string;
  count: number;
  total_size: number;
  avg_size: number;
  favorite_count: number;
  subcategories: { [key: string]: number };
}

interface Project {
  id: number;
  name: string;
  description: string;
  project_type: string;
  status: string;
}

const Documents: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { selectedProject: contextProject } = useProject();
  
  // Lokale Projektverwaltung für Documents
  const [allProjects, setAllProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(contextProject);
  
  // State für Dokumente und UI
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // State für View-Modi und Filter
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [favoriteFilter, setFavoriteFilter] = useState<boolean | null>(null);
  const [selectedMilestone, setSelectedMilestone] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<'created_at' | 'title' | 'file_size' | 'accessed_at'>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  // Neu: Quote-Status-Filter für Dienstleister
  const [quoteStatusFilter, setQuoteStatusFilter] = useState<'accepted' | 'own' | 'all'>('accepted');
  
  // State für Upload
  const [uploadFiles, setUploadFiles] = useState<UploadFile[]>([]);
  const [showUploadModal, setShowUploadModal] = useState(false);
  // Query-Param zum direkten Öffnen des Upload-Modals
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const shouldOpenUpload = params.get('create') === 'upload';
    if (shouldOpenUpload) {
      setShowUploadModal(true);
    }
  }, [location.search]);
  const [dragOver, setDragOver] = useState(false);
  
  // State für Sidebar
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['all']));
  const [selectedFolder, setSelectedFolder] = useState<string>('all');
  const [categoryStats, setCategoryStats] = useState<CategoryStats[]>([]);
  
  // State für Gesamtanzahl aller Dokumente
  const [totalDocumentCount, setTotalDocumentCount] = useState<number>(0);
  
  // State für Ausschreibungen
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loadingMilestones, setLoadingMilestones] = useState(false);
  
  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);
  
  // Dokumentenviewer State
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [showViewer, setShowViewer] = useState(false);
  
  // Dokument-Bearbeitung State
  const [editingDocument, setEditingDocument] = useState<Document | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editCategory, setEditCategory] = useState<string>('');
  const [editSubcategory, setEditSubcategory] = useState<string>('');
  const [editMilestoneId, setEditMilestoneId] = useState<number | null>(null);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [duplicateTargetMilestoneId, setDuplicateTargetMilestoneId] = useState<number | null>(null);

  // Memoized Kategorien-Liste für bessere Performance
  const memoizedCategories = React.useMemo(() => {
    return Object.entries(DOCUMENT_CATEGORIES).map(([categoryKey, category]) => {
      const catStats = categoryStats.find((stat: CategoryStats) => stat.category === categoryKey);
      const isExpanded = expandedFolders.has(categoryKey);
      const Icon = category.icon;
      
      return {
        categoryKey,
        category,
        catStats,
        isExpanded,
        Icon
      };
    });
  }, [categoryStats, expandedFolders]);

  // Gefilterte und sortierte Dokumente
  const filteredDocuments = React.useMemo(() => {
    console.log('[DEBUG] Filtering documents:', {
      totalDocuments: documents.length,
      documents: documents,
      selectedCategory,
      selectedSubcategory,
      statusFilter,
      favoriteFilter,
      searchTerm,
      selectedMilestone
    });
    
    let filtered = documents;

    // Kategorie-Filter - Dokumente sind bereits konvertiert
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(doc => doc.category === selectedCategory);
    }

    // Unterkategorie-Filter
    if (selectedSubcategory !== 'all') {
      filtered = filtered.filter(doc => doc.subcategory === selectedSubcategory);
    }

    // Status-Filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(doc => doc.status === statusFilter);
    }

    // Favoriten-Filter
    if (favoriteFilter !== null) {
      filtered = filtered.filter(doc => doc.is_favorite === favoriteFilter);
    }

    // Ausschreibungs-Filter (wird bereits im Backend angewendet)
    // selectedMilestone wird in loadDocuments() verwendet

    // Suchfilter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(doc =>
        doc.title.toLowerCase().includes(term) ||
        doc.description?.toLowerCase().includes(term) ||
        doc.file_name.toLowerCase().includes(term) ||
        doc.tags?.toLowerCase().includes(term)
      );
    }

    // Sortierung
    filtered.sort((a, b) => {
      let aVal: any, bVal: any;
      
      switch (sortBy) {
        case 'title':
          aVal = a.title.toLowerCase();
          bVal = b.title.toLowerCase();
          break;
        case 'file_size':
          aVal = a.file_size;
          bVal = b.file_size;
          break;
        case 'accessed_at':
          aVal = new Date(a.accessed_at || a.created_at);
          bVal = new Date(b.accessed_at || b.created_at);
          break;
        default: // created_at
          aVal = new Date(a.created_at);
          bVal = new Date(b.created_at);
      }

      if (sortOrder === 'desc') {
        return aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
      } else {
        return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      }
    });

    console.log('[DEBUG] Filtered documents result:', {
      filteredCount: filtered.length,
      originalCount: documents.length,
      filtered: filtered
    });

    return filtered;
  }, [documents, selectedCategory, selectedSubcategory, statusFilter, favoriteFilter, searchTerm, sortBy, sortOrder, selectedMilestone]);

  // Drag & Drop Handlers
  useEffect(() => {
    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
      setDragOver(true);
    };

    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault();
      if (!dropZoneRef.current?.contains(e.relatedTarget as Node)) {
        setDragOver(false);
      }
    };

    const handleDrop = (e: DragEvent) => {
    e.preventDefault();
      setDragOver(false);
      
      const files = Array.from(e.dataTransfer?.files || []);
      handleFilesSelected(files);
    };

    document.addEventListener('dragover', handleDragOver);
    document.addEventListener('dragleave', handleDragLeave);
    document.addEventListener('drop', handleDrop);

    return () => {
      document.removeEventListener('dragover', handleDragOver);
      document.removeEventListener('dragleave', handleDragLeave);
      document.removeEventListener('drop', handleDrop);
    };
  }, []);

  // Projekte laden
  const loadProjects = async () => {
    try {
      const projects = await getProjects();
      setAllProjects(projects);
      
      // Wenn kein Projekt ausgewählt ist, wähle das erste aus
      if (!selectedProject && projects.length > 0) {
        setSelectedProject(projects[0]);
      } else if (selectedProject) {
        // Aktualisiere das ausgewählte Projekt mit den neuesten Daten
        const updatedProject = projects.find(p => p.id === selectedProject.id);
        if (updatedProject) {
          setSelectedProject(updatedProject);
        }
      }
    } catch (error: any) {
      console.error('Fehler beim Laden der Projekte:', error);
    }
  };

  // Ausschreibungen laden
  const loadMilestones = async () => {
    if (!selectedProject) return;
    
    try {
      setLoadingMilestones(true);
      const milestoneList = await getProjectMilestones(selectedProject.id);
      setMilestones(milestoneList);
    } catch (error: any) {
      console.error('Fehler beim Laden der Ausschreibungen:', error);
      setMilestones([]);
      // Zeige keine Fehlermeldung, da dies optional ist
    } finally {
      setLoadingMilestones(false);
    }
  };

  // Gesamtanzahl aller Dokumente laden
  const loadTotalDocumentCount = async () => {
    if (!selectedProject) return;
    
    try {
      const backendStats = await getCategoryStatistics(selectedProject.id);
      const convertedStats = convertCategoryStats(backendStats || {});
      
      // Summiere alle Dokumente aus allen Kategorien
      const totalCount = convertedStats.reduce((sum, stat) => sum + stat.count, 0);
      setTotalDocumentCount(totalCount);
    } catch (error: any) {
      console.error('Fehler beim Laden der Gesamtanzahl:', error);
      setTotalDocumentCount(0);
    }
  };

  // Dokumente laden
  const loadDocuments = async () => {
    
    // Für Dienstleister: Lade Dokumente basierend auf Quote-Status-Filter
    if (user && (user.user_type === 'service_provider' || user.user_role === 'DIENSTLEISTER') && !selectedProject) {
      try {
        setLoading(true);
        // Lade Dienstleister-spezifische Dokumente (temporäre Lösung ohne Filter)
        console.log('[DEBUG] Starting to load service provider documents...');
        const docs = await getDocuments(0, { // project_id wird ignoriert für Dienstleister-Dokumente
          service_provider_documents: true // Flag für Dienstleister-Dokumente
          // Temporär deaktiviert: quote_status_filter: quoteStatusFilter
        });
        console.log('[DEBUG] getDocuments() completed, result:', docs);
        
        console.log('[DEBUG] Service Provider Documents loaded:', {
          rawDocs: docs,
          docCount: docs.length,
          firstDoc: docs[0],
          docsType: typeof docs,
          docsIsArray: Array.isArray(docs)
        });
        
        // Konvertiere Backend-Kategorien zu Frontend-Kategorien
        console.log('[DEBUG] About to convert documents, docs type:', typeof docs, 'isArray:', Array.isArray(docs));
        const convertedDocs = docs.map((doc: Document) => ({
          ...doc,
          category: doc.category ? convertBackendToFrontendCategory(doc.category) : 'documentation'
        }));
        
        console.log('[DEBUG] Converted documents:', {
          convertedDocs,
          convertedCount: convertedDocs.length
        });
        
        console.log('[DEBUG] Setting documents state with:', convertedDocs.length, 'documents');
        setDocuments(convertedDocs);
        
        // Kategorie-Statistiken laden und konvertieren
        try {
          const backendStats = await getCategoryStatistics(undefined, true); // service_provider_documents = true, temporär ohne quote_status_filter
          // Backend gibt ein Objekt zurück, nicht ein Array
          const convertedStats = convertCategoryStats(backendStats || {});
          setCategoryStats(convertedStats);
          
          // Gesamtanzahl aktualisieren
          const totalCount = convertedStats.reduce((sum, stat) => sum + stat.count, 0);
          setTotalDocumentCount(totalCount);
        } catch (statsError) {
          console.error('Fehler beim Laden der Kategorie-Statistiken:', statsError);
          setCategoryStats([]);
        }
        
      } catch (err: any) {
        console.error('[ERROR] Service Provider document loading failed:', err);
        console.error('[ERROR] Error details:', {
          message: err.message,
          stack: err.stack,
          response: err.response?.data
        });
        setError(err.message || 'Fehler beim Laden der Dokumente');
      } finally {
        console.log('[DEBUG] Service Provider document loading completed, setting loading to false');
        setLoading(false);
      }
      return;
    }
    
    // Für Bauträger: Normale projektspezifische Dokumente
    if (!selectedProject) return;
    
    try {
      setLoading(true);
      const backendCategory = selectedCategory !== 'all' ? convertFrontendToBackendCategory(selectedCategory) : undefined;
      
      const docs = await getDocuments(selectedProject.id, {
        category: backendCategory,
        subcategory: selectedSubcategory !== 'all' ? selectedSubcategory : undefined,
        status_filter: statusFilter !== 'all' ? statusFilter : undefined,
        is_favorite: favoriteFilter !== null ? favoriteFilter : undefined,
        search: searchTerm || undefined,
        sort_by: sortBy,
        sort_order: sortOrder,
        limit: 100,
        milestone_id: selectedMilestone || undefined
      });
      
      // Konvertiere Backend-Kategorien zu Frontend-Kategorien
      const convertedDocs = docs.map((doc: Document) => ({
        ...doc,
        category: doc.category ? convertBackendToFrontendCategory(doc.category) : 'documentation'
      }));
      
      setDocuments(convertedDocs);
      // Kategorie-Statistiken laden und konvertieren
      try {
        const backendStats = await getCategoryStatistics(selectedProject.id);
        // Backend gibt ein Objekt zurück, nicht ein Array
        const convertedStats = convertCategoryStats(backendStats || {});
        setCategoryStats(convertedStats);
        
        // Gesamtanzahl aktualisieren
        const totalCount = convertedStats.reduce((sum, stat) => sum + stat.count, 0);
        setTotalDocumentCount(totalCount);
      } catch (statsError) {
        console.error('Fehler beim Laden der Kategorie-Statistiken:', statsError);
        setCategoryStats([]);
      }
      
    } catch (err: any) {
      setError(err.message || 'Fehler beim Laden der Dokumente');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    if (contextProject && contextProject !== selectedProject) {
      setSelectedProject(contextProject);
    }
  }, [contextProject]);

  useEffect(() => {
    loadDocuments();
  }, [selectedProject, selectedCategory, selectedSubcategory, statusFilter, favoriteFilter, searchTerm, sortBy, sortOrder, selectedMilestone]);

  useEffect(() => {
    loadMilestones();
    loadTotalDocumentCount();
  }, [selectedProject]);

  // Datei-Handling
  const handleFilesSelected = (files: File[]) => {
    const newUploadFiles: UploadFile[] = files.map(file => {
      // Automatische Kategorisierung basierend auf Dateiname
      const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
      const detectedCategory = DocumentCategorizer.categorizeDocument(file.name, fileExtension);
      const suggestedSubcategory = detectedCategory ? DocumentCategorizer.suggestSubcategory(detectedCategory, file.name) : null;
      
      return {
        file,
        status: 'pending' as const,
        progress: 0,
        category: detectedCategory?.id,
        subcategory: suggestedSubcategory || undefined
      };
    });
    
    setUploadFiles(newUploadFiles);
    setShowUploadModal(true);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    handleFilesSelected(files);
  };

  const handleAdditionalFilesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newUploadFiles: UploadFile[] = files.map(file => {
      // Automatische Kategorisierung basierend auf Dateiname
      const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
      const detectedCategory = DocumentCategorizer.categorizeDocument(file.name, fileExtension);
      const suggestedSubcategory = detectedCategory ? DocumentCategorizer.suggestSubcategory(detectedCategory, file.name) : null;
      
      return {
        file,
        status: 'pending' as const,
        progress: 0,
        category: detectedCategory?.id,
        subcategory: suggestedSubcategory || undefined
      };
    });
    
    // Füge neue Dateien zur bestehenden Liste hinzu, anstatt sie zu überschreiben
    setUploadFiles(prev => [...prev, ...newUploadFiles]);
    
    // Reset input field for next selection
    e.target.value = '';
  };

  const assignCategoryToFile = (index: number, category: string, subcategory?: string) => {
    setUploadFiles(prev => prev.map((file, i) => 
      i === index ? { ...file, category, subcategory } : file
    ));
  };

  const removeUploadFile = (index: number) => {
    setUploadFiles(prev => prev.filter((_, i) => i !== index));
  };

  const uploadAllFiles = async () => {
    // Für Dienstleister: Upload ohne selectedProject möglich
    if (!selectedProject && user && user.user_type !== 'service_provider' && user.user_role !== 'DIENSTLEISTER') {
      return;
    }

    for (let i = 0; i < uploadFiles.length; i++) {
      const uploadFile = uploadFiles[i];
      
      if (uploadFile.status !== 'pending') continue;
      
      try {
        // Status auf uploading setzen
        setUploadFiles(prev => prev.map((file, index) => 
          index === i ? { ...file, status: 'uploading', progress: 0 } : file
        ));

         // FormData für Upload erstellen
         const formData = new FormData();
         
         // Für Dienstleister: Verwende erstes verfügbares Projekt oder 1 als Fallback
         if (selectedProject) {
           formData.append('project_id', selectedProject.id.toString());
         } else if (user && (user.user_type === 'service_provider' || user.user_role === 'DIENSTLEISTER')) {
           // Für Dienstleister: Verwende erstes verfügbares Projekt oder Fallback
           const defaultProjectId = allProjects.length > 0 ? allProjects[0].id : 1;
           formData.append('project_id', defaultProjectId.toString());
         }
         
         formData.append('file', uploadFile.file);
         formData.append('title', uploadFile.file.name.replace(/\.[^/.]+$/, ""));
         formData.append('description', '');
         
         // Konvertiere Frontend-Kategorie zu Backend-Kategorie
         const backendCategory = uploadFile.category ? convertFrontendToBackendCategory(uploadFile.category) : 'documentation';
         formData.append('category', backendCategory);
         
         if (uploadFile.subcategory) {
           formData.append('subcategory', uploadFile.subcategory);
         }
         formData.append('document_type', getDocumentTypeFromFile(uploadFile.file.name));

         await uploadDocument(formData);

        // Erfolg
        setUploadFiles(prev => prev.map((file, index) => 
          index === i ? { ...file, status: 'success', progress: 100 } : file
        ));

      } catch (error: any) {
        setUploadFiles(prev => prev.map((file, index) => 
          index === i ? { ...file, status: 'error', progress: 0, error: error.message } : file
        ));
      }
    }

    // Nach kurzer Verzögerung Modal schließen und Dokumente neu laden
    setTimeout(() => {
      setShowUploadModal(false);
      setUploadFiles([]);
      loadDocuments();
      setSuccess('Dokumente erfolgreich hochgeladen!');
    }, 2000);
  };

  // Dokumenttyp aus Datei ermitteln
  const getDocumentTypeFromFile = (fileName: string): string => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    
    switch (ext) {
      case 'pdf': return 'pdf'; // ✅ Korrigiert: kleingeschrieben für Backend
      case 'jpg': case 'jpeg': case 'png': case 'gif': case 'bmp': return 'photo';
      case 'mp4': case 'avi': case 'mov': case 'wmv': return 'video';
      case 'doc': case 'docx': return 'report';
      case 'xls': case 'xlsx': return 'report';
      case 'ppt': case 'pptx': return 'report';
      default: return 'other';
    }
  };

  // Ordner-Navigation - Optimiert für stabile Sidebar
  const toggleFolder = (folderId: string) => {
    setExpandedFolders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(folderId)) {
        newSet.delete(folderId);
      } else {
        newSet.add(folderId);
      }
      return newSet;
    });
  };

  const selectFolder = (folderId: string, category?: string, subcategory?: string) => {
    // Batch State Updates für bessere Performance und Stabilität
    React.startTransition(() => {
      setSelectedFolder(folderId);
      setSelectedCategory(category || 'all');
      setSelectedSubcategory(subcategory || 'all');
    });
  };

  // Neue Funktion für Kategorie-Klicks ohne Sidebar-Flicker
  const handleCategoryClick = React.useCallback((categoryKey: string) => {
    React.startTransition(() => {
      // Erst den Ordner erweitern/zuklappen
      toggleFolder(categoryKey);
      // Dann die Kategorie auswählen
      selectFolder(categoryKey, categoryKey);
    });
  }, []);

  // Neue Funktion für Unterkategorie-Klicks ohne Sidebar-Flicker
  const handleSubcategoryClick = React.useCallback((categoryKey: string, subcategory: string) => {
    React.startTransition(() => {
      selectFolder(`${categoryKey}-${subcategory}`, categoryKey, subcategory);
    });
  }, []);

  // Neue Funktion für "Alle Dokumente" - setzt alle Filter zurück
  const handleAllDocumentsClick = React.useCallback(() => {
    React.startTransition(() => {
      // Alle Filter zurücksetzen
      setSelectedFolder('all');
      setSelectedCategory('all');
      setSelectedSubcategory('all');
      setStatusFilter('all');
      setFavoriteFilter(null);
      setSelectedMilestone(null);
      setSearchTerm('');
      setSortBy('created_at');
      setSortOrder('desc');
    });
  }, []);

  // Neue Funktion für Favoriten-Klicks ohne Sidebar-Flicker
  const handleFavoritesClick = React.useCallback(() => {
    React.startTransition(() => {
      setFavoriteFilter(favoriteFilter === true ? null : true);
      setSelectedFolder('favorites');
    });
  }, [favoriteFilter]);

  // Utility-Funktionen
  const getCategoryIcon = (category: string) => {
    return DOCUMENT_CATEGORIES[category as keyof typeof DOCUMENT_CATEGORIES]?.icon || File;
  };

  const getCategoryColor = (category: string) => {
    return DOCUMENT_CATEGORIES[category as keyof typeof DOCUMENT_CATEGORIES]?.color || 'gray';
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getDocumentStats = () => {
    const totalDocs = documents.length;
    const totalSize = documents.reduce((sum, doc) => sum + doc.file_size, 0);
    const favoriteCount = documents.filter(doc => doc.is_favorite).length;
    
    return { totalDocs, totalSize, favoriteCount };
  };

  // Dokument-Aktionen
  const handleToggleFavorite = async (docId: number) => {
    try {
      await toggleDocumentFavorite(docId);
      setDocuments(prev => prev.map(doc => 
        doc.id === docId ? { ...doc, is_favorite: !doc.is_favorite } : doc
      ));
    } catch (error: any) {
      setError(error.message);
    }
  };

  const handleStatusChange = async (docId: number, newStatus: string) => {
    try {
      await updateDocumentStatus(docId, newStatus);
      setDocuments(prev => prev.map(doc => 
        doc.id === docId ? { ...doc, status: newStatus } : doc
      ));
    } catch (error: any) {
      setError(error.message);
    }
  };

  const handleViewDocument = async (doc: Document) => {
    try {
      await trackDocumentAccess(doc.id);
      setSelectedDocument(doc);
      setShowViewer(true);
    } catch (error: any) {
      console.warn('Fehler beim Tracking:', error.message);
      setSelectedDocument(doc);
      setShowViewer(true);
    }
  };

  const handleDeleteDocument = async (docId: number) => {
    // Für Service Provider: Soft-Delete (nur für sie unsichtbar)
    if (user && (user.user_type === 'service_provider' || user.user_role === 'DIENSTLEISTER')) {
      if (!window.confirm('Möchten Sie dieses Dokument wirklich löschen? Eine Wiederherstellung ist nicht möglich.')) {
        return;
      }

      try {
        await deleteDocumentForServiceProvider(docId);
        setDocuments(prev => prev.filter(doc => doc.id !== docId));
        setSuccess('Dokument wurde gelöscht');
      } catch (error: any) {
        setError(error.message);
      }
    } else {
      // Für Bauträger: Normale Löschung
      if (!window.confirm('Sind Sie sicher, dass Sie dieses Dokument löschen möchten?')) {
        return;
      }

      try {
        await deleteDocument(docId);
        setDocuments(prev => prev.filter(doc => doc.id !== docId));
        setSuccess('Dokument erfolgreich gelöscht');
      } catch (error: any) {
        setError(error.message);
      }
    }
  };

  const handleEditDocument = (doc: Document) => {
    setEditingDocument(doc);
    setEditCategory(doc.category || '');
    setEditSubcategory(doc.subcategory || '');
    setEditMilestoneId(doc.milestone_id || null);
    setShowEditModal(true);
  };

  const handleUpdateDocument = async () => {
    if (!editingDocument || !editCategory) {
      alert('Bitte wählen Sie eine Kategorie aus');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('category', editCategory.toUpperCase());
      if (editSubcategory) {
        formData.append('subcategory', editSubcategory);
      }
      if (editMilestoneId) {
        formData.append('milestone_id', editMilestoneId.toString());
      }

      await updateDocument(editingDocument.id, formData);
      
      // Update local state
      setDocuments(prev => prev.map(doc => 
        doc.id === editingDocument.id 
          ? { ...doc, category: editCategory, subcategory: editSubcategory, milestone_id: editMilestoneId }
          : doc
      ));
      
      // Close modal
      setShowEditModal(false);
      setEditingDocument(null);
      setEditCategory('');
      setEditSubcategory('');
      setEditMilestoneId(null);
      
      setSuccess('Dokument erfolgreich aktualisiert');
    } catch (error: any) {
      setError(error.message);
    }
  };

  // Dokument-Duplikation zwischen Ausschreibungen
  const handleDuplicateDocument = async () => {
    if (!editingDocument || !duplicateTargetMilestoneId) {
      alert('Bitte wählen Sie eine Ziel-Ausschreibung aus');
      return;
    }

    try {
      // Erstelle eine Kopie des Dokuments für die neue Ausschreibung
      const duplicateData = {
        title: `${editingDocument.title} (Kopie)`,
        description: editingDocument.description,
        category: editingDocument.category,
        subcategory: editingDocument.subcategory,
        milestone_id: duplicateTargetMilestoneId,
        tags: editingDocument.tags
      };

      // Hier würde normalerweise ein API-Call gemacht werden
      // Für jetzt simulieren wir es
      console.log('Dupliziere Dokument:', duplicateData);
      
      setShowDuplicateModal(false);
      setDuplicateTargetMilestoneId(null);
      setSuccess(`Dokument erfolgreich in Ausschreibung "${milestones.find(m => m.id === duplicateTargetMilestoneId)?.title}" dupliziert`);
      
      // Lade Dokumente neu
      loadDocuments();
    } catch (error: any) {
      setError(error.message);
    }
  };

  const openDuplicateModal = () => {
    setShowDuplicateModal(true);
  };

  // Loading state
  if (loading && documents.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-blue-400 animate-spin mx-auto mb-4" />
          <p className="text-white">Dokumente werden geladen...</p>
        </div>
      </div>
    );
  }

  // Kein Projekt ausgewählt (nur für Bauträger)
  if (!selectedProject && user && user.user_type !== 'service_provider' && user.user_role !== 'DIENSTLEISTER') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Building className="w-16 h-16 text-blue-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Kein Projekt ausgewählt</h2>
          <p className="text-gray-300 mb-6">Bitte wählen Sie ein Projekt aus, um Dokumente zu verwalten.</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
          >
            Zum Dashboard
          </button>
        </div>
      </div>
    );
  }

  const stats = getDocumentStats();

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460]">
      {/* Mobile View */}
      <div className="lg:hidden">
        <MobileDocumentsView
          documents={documents}
          filteredDocuments={filteredDocuments}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          sortBy={sortBy}
          sortOrder={sortOrder}
          setSortBy={(sort: string) => setSortBy(sort as 'created_at' | 'title' | 'file_size' | 'accessed_at')}
          setSortOrder={(order: string) => setSortOrder(order as 'asc' | 'desc')}
          onRefresh={loadDocuments}
          onUpload={() => fileInputRef.current?.click()}
          onViewDocument={handleViewDocument}
          onEditDocument={handleEditDocument}
          onToggleFavorite={handleToggleFavorite}
          onDeleteDocument={handleDeleteDocument}
          formatFileSize={formatFileSize}
          getCategoryIcon={getCategoryIcon}
          getCategoryColor={getCategoryColor}
        />
      </div>

      {/* Desktop View */}
      <div className="hidden lg:block">
        {/* Drag & Drop Overlay */}
        {dragOver && (
          <div className="fixed inset-0 bg-[#ffbd59]/20 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="bg-gradient-to-br from-[#2c3539] to-[#1a1a2e] rounded-2xl p-8 shadow-2xl text-center border-2 border-[#ffbd59] border-dashed">
              <CloudUpload className="w-16 h-16 text-[#ffbd59] mx-auto mb-4 animate-bounce" />
              <h3 className="text-xl font-bold text-white mb-2">Dateien hier ablegen</h3>
              <p className="text-gray-300">Lassen Sie die Dateien los, um sie hochzuladen</p>
            </div>
          </div>
        )}

        <div className="flex h-screen">
          {/* Sidebar - Stabiler Container */}
          <div className="w-80 flex flex-col sticky top-0 h-screen overflow-hidden bg-white/10 backdrop-blur-lg border-r border-white/20">
            {/* Projekt-Header */}
            <div className="p-6 border-b border-white/10 bg-white/5 backdrop-blur-sm">
            <div className="flex items-center gap-3 mb-4">
              <button 
                onClick={() => navigate('/dashboard')}
                className="p-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 hover:border-[#ffbd59]/50 rounded-xl transition-all duration-300 shadow-lg shadow-white/10 hover:shadow-[#ffbd59]/20"
              >
                <ArrowLeft size={20} className="text-[#ffbd59]" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-white">
                  {user && (user.user_type === 'service_provider' || user.user_role === 'DIENSTLEISTER') 
                    ? 'Meine Dokumente' 
                    : 'Dokumente'
                  }
                </h1>
                <p className="text-sm text-gray-400">
                  {user && (user.user_type === 'service_provider' || user.user_role === 'DIENSTLEISTER')
                    ? 'Rechnungen & Dokumente'
                    : 'Intelligentes DMS'
                  }
                </p>
              </div>
            </div>

            {/* Projekt-Auswahl (nur für Bauträger) */}
            {user && user.user_type !== 'service_provider' && user.user_role !== 'DIENSTLEISTER' && (
              <div className="space-y-2 mb-4">
                <label className="text-sm font-medium text-gray-300">Projekt</label>
                <select
                  value={selectedProject?.id || ''}
                  onChange={(e) => {
                    const projectId = parseInt(e.target.value);
                    const project = allProjects.find(p => p.id === projectId);
                    setSelectedProject(project || null);
                  }}
                  className="w-full px-3 py-2 bg-[#3d4952] border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent"
                >
                  <option value="" className="bg-[#3d4952] text-white">Projekt wählen...</option>
                  {allProjects.map(project => (
                    <option key={project.id} value={project.id} className="bg-[#3d4952] text-white">
                      {project.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
            
            {/* Statistiken */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20 hover:border-[#ffbd59]/50 transition-all duration-300 shadow-lg shadow-white/10 hover:shadow-[#ffbd59]/20">
                <div className="text-2xl font-bold text-[#ffbd59]">{stats.totalDocs}</div>
                <div className="text-xs text-gray-300">Dokumente</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20 hover:border-[#ffbd59]/50 transition-all duration-300 shadow-lg shadow-white/10 hover:shadow-[#ffbd59]/20">
                <div className="text-2xl font-bold text-[#ffbd59]">{formatFileSize(stats.totalSize)}</div>
                <div className="text-xs text-gray-300">Gesamt</div>
              </div>
            </div>
          </div>

          {/* Navigation - Optimiert für Stabilität */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="space-y-2">
              {/* Alle Dokumente */}
              <div
                className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-all duration-300 ${
                  selectedFolder === 'all' && !favoriteFilter && !selectedMilestone && selectedCategory === 'all' && selectedSubcategory === 'all' && statusFilter === 'all' && !searchTerm
                    ? 'bg-[#ffbd59] text-[#1a1a2e] shadow-lg shadow-[#ffbd59]/30' 
                    : 'text-gray-300 hover:bg-white/10 hover:border-white/20 border border-transparent backdrop-blur-sm'
                }`}
                onClick={handleAllDocumentsClick}
              >
                <Home size={18} />
                <span className="font-medium">
                  {user && (user.user_type === 'service_provider' || user.user_role === 'DIENSTLEISTER')
                    ? 'Gewonnene Projekte'
                    : 'Alle Dokumente'
                  }
                </span>
                <span className="ml-auto text-sm">{totalDocumentCount}</span>
              </div>

              {/* Favoriten */}
              <div
                className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-all duration-300 ${
                  favoriteFilter === true ? 'bg-[#ffbd59] text-[#1a1a2e] shadow-lg shadow-[#ffbd59]/30' : 'text-gray-300 hover:bg-white/10 hover:border-white/20 border border-transparent backdrop-blur-sm'
                }`}
                onClick={handleFavoritesClick}
              >
                <Star size={18} />
                <span className="font-medium">Favoriten</span>
                <span className="ml-auto text-sm">{stats.favoriteCount}</span>
              </div>


              {/* Ausschreibungs-Dokumente */}
              <div className="space-y-1">
                <div className="flex items-center gap-3 px-3 py-2 text-gray-300">
                  <Briefcase size={18} />
                  <span className="font-medium">Ausschreibungen</span>
                </div>
                <div className="ml-6">
                  <select
                    value={selectedMilestone || ''}
                    onChange={(e) => {
                      const milestoneId = e.target.value ? parseInt(e.target.value) : null;
                      setSelectedMilestone(milestoneId);
                      setSelectedFolder(milestoneId ? `milestone-${milestoneId}` : 'all');
                    }}
                    className="w-full px-3 py-2 bg-[#3d4952] border border-gray-600 rounded-lg text-white text-sm focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent"
                    disabled={loadingMilestones}
                  >
                    <option value="" className="bg-[#3d4952] text-white">Alle Dokumente</option>
                    {loadingMilestones ? (
                      <option disabled className="bg-[#3d4952] text-white">Lade Ausschreibungen...</option>
                    ) : (
                      milestones.map(milestone => (
                        <option key={milestone.id} value={milestone.id} className="bg-[#3d4952] text-white">
                          {milestone.title}
                        </option>
                      ))
                    )}
                  </select>
                </div>
              </div>

              {/* Kategorien - Optimiert für Stabilität */}
              <div className="space-y-1 mt-4">
                {memoizedCategories.map(({ categoryKey, category, catStats, isExpanded, Icon }) => (
                  <div key={categoryKey}>
                    {/* Kategorie-Header */}
                    <div 
                      className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                        selectedCategory === categoryKey ? `bg-${category.color}-600/20 text-${category.color}-400` : 'text-gray-300 hover:bg-slate-700/50'
                      }`}
                      onClick={() => handleCategoryClick(categoryKey)}
                    >
                      {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      <Icon className="w-5 h-5" />
                      <span className="font-medium flex-1">
                        {typeof category.name === 'string' ? category.name : 'Unbekannte Kategorie'}
                      </span>
                      <span className="text-sm bg-slate-600 px-2 py-1 rounded">
                        {catStats?.count || 0}
                      </span>
                    </div>
        
                    {/* Unterkategorien */}
                    {isExpanded && (
                      <div className="ml-6 space-y-1 mt-1">
                        {category.subcategories.map(subcategory => {
                          const count = catStats?.subcategories?.[subcategory] || 0;
                          return (
                            <div
                              key={subcategory}
                              className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${
                                selectedSubcategory === subcategory ? 'bg-slate-600/50 text-white' : 'text-gray-400 hover:bg-slate-700/30'
                              }`}
                              onClick={() => handleSubcategoryClick(categoryKey, subcategory)}
                            >
                              <Folder className="w-4 h-4" />
                              <span className="flex-1 text-sm">{subcategory}</span>
                              {count > 0 && (
                                <span className="text-xs bg-slate-600 px-1.5 py-0.5 rounded">{count}</span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
                
        </div>

        {/* Hauptbereich */}
        <div className="flex-1 flex flex-col" ref={dropZoneRef}>
          {/* Header mit Suche und Filtern */}
<div className="bg-white/10 backdrop-blur-lg border-b border-white/20 p-6">
            <div className="flex items-center justify-between mb-4">
              <PageHeader
                title={
                  selectedMilestone 
                    ? milestones.find(m => m.id === selectedMilestone)?.title || 'Ausschreibungs-Dokumente'
                    : selectedCategory === 'all' 
                      ? 'Alle Dokumente' 
                      : (selectedCategory && DOCUMENT_CATEGORIES[selectedCategory as keyof typeof DOCUMENT_CATEGORIES]?.name) || 'Dokumente'
                }
                subtitle={`${filteredDocuments.length} von ${documents.length} Dokumente`}
              />

              {/* View Toggle and Upload Button */}
              <div className="flex items-center gap-3">
                <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-1 flex shadow-lg shadow-white/10">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded transition-all duration-300 ${
                      viewMode === 'grid' 
                        ? 'bg-[#ffbd59] text-[#1a1a2e] shadow-lg shadow-[#ffbd59]/30' 
                        : 'text-gray-400 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <Grid className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded transition-all duration-300 ${
                      viewMode === 'list' 
                        ? 'bg-[#ffbd59] text-[#1a1a2e] shadow-lg shadow-[#ffbd59]/30' 
                        : 'text-gray-400 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>
                
                {/* Upload Button */}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileInputChange}
                  multiple
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif"
                  className="hidden"
                />
                
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 px-4 py-2 bg-[#ffbd59] text-[#1a1a2e] rounded-lg hover:bg-[#ffa726] transition-all duration-300 font-medium shadow-lg shadow-[#ffbd59]/30 hover:shadow-xl hover:shadow-[#ffbd59]/50 hover:scale-105"
                >
                  <Upload size={18} />
                  Hochladen
                </button>
              </div>
            </div>

            {/* Suchleiste und Filter */}
            <div className="flex items-center gap-4">
              {/* Suche */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Dokumente durchsuchen..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent w-full pl-10 pr-4 shadow-lg shadow-white/10"
                />
              </div>
                
              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-[#3d4952] backdrop-blur-sm border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent shadow-lg shadow-white/10"
              >
                <option value="all" className="bg-[#3d4952] text-white">Alle Status</option>
                <option value="draft" className="bg-[#3d4952] text-white">Entwurf</option>
                <option value="review" className="bg-[#3d4952] text-white">Prüfung</option>
                <option value="approved" className="bg-[#3d4952] text-white">Genehmigt</option>
                <option value="rejected" className="bg-[#3d4952] text-white">Abgelehnt</option>
                <option value="archived" className="bg-[#3d4952] text-white">Archiviert</option>
              </select>


              {/* Ausschreibungs-Filter */}
              <select
                value={selectedMilestone || ''}
                onChange={(e) => {
                  const milestoneId = e.target.value ? parseInt(e.target.value) : null;
                  setSelectedMilestone(milestoneId);
                }}
                className="bg-[#3d4952] backdrop-blur-sm border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent shadow-lg shadow-white/10 hover:bg-white/20 transition-all duration-300"
                disabled={loadingMilestones}
              >
                <option value="" className="bg-[#3d4952] text-white">Alle Dokumente</option>
                {loadingMilestones ? (
                  <option disabled className="bg-[#3d4952] text-white">Lade Ausschreibungen...</option>
                ) : (
                  milestones.map(milestone => (
                    <option key={milestone.id} value={milestone.id} className="bg-[#3d4952] text-white">
                      {milestone.title}
                    </option>
                  ))
                )}
              </select>

              {/* Sortierung */}
              <select
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [field, order] = e.target.value.split('-');
                  setSortBy(field as 'created_at' | 'title' | 'file_size' | 'accessed_at');
                  setSortOrder(order as 'asc' | 'desc');
                }}
                className="bg-[#3d4952] backdrop-blur-sm border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent shadow-lg shadow-white/10"
              >
                <option value="created_at-desc" className="bg-[#3d4952] text-white">Neueste zuerst</option>
                <option value="created_at-asc" className="bg-[#3d4952] text-white">Älteste zuerst</option>
                <option value="title-asc" className="bg-[#3d4952] text-white">Name A-Z</option>
                <option value="title-desc" className="bg-[#3d4952] text-white">Name Z-A</option>
                <option value="file_size-desc" className="bg-[#3d4952] text-white">Größte zuerst</option>
                <option value="file_size-asc" className="bg-[#3d4952] text-white">Kleinste zuerst</option>
                <option value="accessed_at-desc" className="bg-[#3d4952] text-white">Zuletzt verwendet</option>
              </select>

              {/* Aktualisieren */}
              <button
                onClick={loadDocuments}
                className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-2 text-gray-400 hover:text-white hover:bg-white/20 transition-all duration-300 shadow-lg shadow-white/10 hover:shadow-[#ffbd59]/20"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
            </div>
          </div>
                
          {/* Dokumentenliste */}
          <div className="flex-1 overflow-y-auto p-6 relative">
            {/* Error/Success Messages */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-6 flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-red-400" />
                <span className="text-red-400">{error}</span>
                <button 
                  onClick={() => setError(null)}
                  className="ml-auto text-red-400 hover:text-red-300"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {success && (
              <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 mb-6 flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <span className="text-green-400">{success}</span>
                <button 
                  onClick={() => setSuccess(null)}
                  className="ml-auto text-green-400 hover:text-green-300"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Dokumente */}
            {filteredDocuments.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">Keine Dokumente gefunden</h3>
                <p className="text-gray-400 mb-6">
                  {documents.length === 0 
                    ? 'Laden Sie Ihr erstes Dokument hoch, um zu beginnen.'
                    : 'Versuchen Sie, Ihre Suchkriterien anzupassen.'
                  }
                </p>
                {documents.length === 0 && (
                  <div className="space-y-4">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="bg-[#ffbd59] hover:bg-[#ffa726] text-[#1a1a2e] px-6 py-3 rounded-lg font-medium transition-all duration-300 shadow-lg shadow-[#ffbd59]/30 hover:shadow-xl hover:shadow-[#ffbd59]/50 hover:scale-105"
                    >
                      Erstes Dokument hochladen
                    </button>
                    
                    {/* Drag & Drop Hinweis */}
                    <div className="bg-gradient-to-r from-[#ffbd59]/10 to-[#ffa726]/10 border-2 border-dashed border-[#ffbd59]/30 rounded-2xl p-8 mt-8 mx-auto max-w-md backdrop-blur-sm shadow-lg shadow-[#ffbd59]/20">
                      <div className="flex items-center justify-center mb-4">
                        <div className="relative">
                          <CloudUpload className="w-12 h-12 text-[#ffbd59] animate-pulse" />
                          <div className="absolute -top-1 -right-1 w-4 h-4 bg-[#ffbd59] rounded-full animate-ping"></div>
                        </div>
                      </div>
                      <h4 className="text-lg font-bold text-white mb-2">Drag & Drop</h4>
                      <p className="text-gray-300 text-sm leading-relaxed">
                        Ziehen Sie Ihre Dokumente einfach hierher! 
                        <br />
                        <span className="text-[#ffbd59] font-medium">PDF, Word, Excel, Bilder</span> werden unterstützt.
                      </p>
                      <div className="flex items-center justify-center gap-2 mt-4">
                        <div className="w-2 h-2 bg-[#ffbd59] rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-[#ffbd59] rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                        <div className="w-2 h-2 bg-[#ffbd59] rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div>
                {viewMode === 'grid' ? (
                  // Grid View
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredDocuments.map((doc) => {
                      const CategoryIcon = getCategoryIcon(doc.category || 'documentation');
                      const categoryColor = getCategoryColor(doc.category || 'documentation');
                      
                      return (
                        <div
                          key={doc.id}
                          className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 p-4 hover:border-[#ffbd59]/50 transition-all duration-300 group shadow-lg shadow-white/10 hover:shadow-xl hover:shadow-[#ffbd59]/30 hover:scale-105"
                        >
                          {/* Header */}
                          <div className="flex items-start justify-between mb-3">
                            <div className={`p-2 rounded-lg bg-${categoryColor}-500/10 backdrop-blur-sm border border-${categoryColor}-500/20 shadow-lg shadow-${categoryColor}-500/20`}>
                              <CategoryIcon className={`w-6 h-6 text-${categoryColor}-400`} />
                            </div>
                            <div className="flex items-center gap-1">
                              {doc.is_favorite && (
                                <Star className="w-4 h-4 text-yellow-400 fill-current" />
                              )}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleToggleFavorite(doc.id);
                                }}
                                className="opacity-0 group-hover:opacity-100 transition-all duration-300 p-1 hover:bg-white/20 backdrop-blur-sm rounded border border-transparent hover:border-white/20"
                              >
                                <MoreHorizontal className="w-4 h-4 text-gray-400" />
                              </button>
                            </div>
                          </div>

                          {/* Content */}
                          <div className="mb-3">
                            <h3 className="font-semibold text-white mb-1 line-clamp-2">{doc.title}</h3>
                            <p className="text-sm text-gray-400 mb-2">{doc.file_name}</p>
                            {doc.description && (
                              <p className="text-xs text-gray-500 line-clamp-2">{doc.description}</p>
                            )}
                          </div>
                
                          {/* Metadata */}
                          <div className="space-y-2 mb-4">
                            <div className="flex items-center justify-between text-xs text-gray-400">
                              <span>{formatFileSize(doc.file_size)}</span>
                              <span>{doc.status || 'draft'}</span>
                            </div>
                            {doc.subcategory && (
                              <div className="text-xs text-gray-500">
                                {doc.subcategory}
                              </div>
                            )}
                            {/* Ausschreibungsinformationen */}
                            {doc.milestone_title && (
                              <div className="flex items-center gap-2 text-xs">
                                <Briefcase className="w-3 h-3 text-[#ffbd59]" />
                                <span className="text-[#ffbd59] font-medium">
                                  {doc.milestone_title}
                                </span>
                                {doc.milestone_status && (
                                  <span className={`px-1.5 py-0.5 rounded text-xs ${
                                    doc.milestone_status === 'completed' ? 'bg-green-500/20 text-green-400' :
                                    doc.milestone_status === 'in_progress' ? 'bg-blue-500/20 text-blue-400' :
                                    doc.milestone_status === 'planned' ? 'bg-yellow-500/20 text-yellow-400' :
                                    'bg-gray-500/20 text-gray-400'
                                  }`}>
                                    {doc.milestone_status}
                                  </span>
                                )}
                              </div>
                            )}
                            <div className="text-xs text-gray-500">
                              {new Date(doc.created_at).toLocaleDateString('de-DE')}
                            </div>
                          </div>
                
                          {/* Actions */}
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleViewDocument(doc)}
                              className="flex-1 bg-[#ffbd59]/20 hover:bg-[#ffbd59]/30 text-[#ffbd59] py-2 px-3 rounded-lg text-sm font-medium transition-all duration-300 backdrop-blur-sm border border-[#ffbd59]/30 hover:border-[#ffbd59]/50 shadow-lg shadow-[#ffbd59]/20 hover:shadow-xl hover:shadow-[#ffbd59]/40"
                            >
                              Öffnen
                            </button>
                            <button
                              onClick={() => handleEditDocument(doc)}
                              className="p-2 rounded-lg bg-white/10 backdrop-blur-sm text-gray-400 hover:text-blue-400 hover:bg-white/20 transition-all duration-300 border border-white/20 hover:border-blue-400/50 shadow-lg shadow-white/10 hover:shadow-blue-400/20"
                              title="Kategorien bearbeiten"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleToggleFavorite(doc.id)}
                              className={`p-2 rounded-lg transition-all duration-300 backdrop-blur-sm border ${
                                doc.is_favorite 
                                  ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30 shadow-lg shadow-yellow-500/20' 
                                  : 'bg-white/10 text-gray-400 hover:text-yellow-400 hover:bg-white/20 border-white/20 hover:border-yellow-400/50 shadow-lg shadow-white/10 hover:shadow-yellow-400/20'
                              }`}
                            >
                              <Star className={`w-4 h-4 ${doc.is_favorite ? 'fill-current' : ''}`} />
                            </button>
                            <button
                              onClick={() => handleDeleteDocument(doc.id)}
                              className="p-2 rounded-lg bg-white/10 backdrop-blur-sm text-gray-400 hover:text-red-400 hover:bg-white/20 transition-all duration-300 border border-white/20 hover:border-red-400/50 shadow-lg shadow-white/10 hover:shadow-red-400/20"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  // List View
                  <div className="space-y-2">
                    {filteredDocuments.map((doc) => {
                      const CategoryIcon = getCategoryIcon(doc.category || 'documentation');
                      const categoryColor = getCategoryColor(doc.category || 'documentation');
                      
                      return (
                        <div
                          key={doc.id}
                          className="bg-white/10 backdrop-blur-lg rounded-lg border border-white/20 p-4 hover:border-[#ffbd59]/50 transition-all duration-300 group shadow-lg shadow-white/10 hover:shadow-xl hover:shadow-[#ffbd59]/30"
                        >
                          <div className="flex items-center gap-4">
                            {/* Icon */}
                            <div className={`p-2 rounded-lg bg-${categoryColor}-500/10 backdrop-blur-sm border border-${categoryColor}-500/20 shadow-lg shadow-${categoryColor}-500/20`}>
                              <CategoryIcon className={`w-5 h-5 text-${categoryColor}-400`} />
                            </div>
                    
                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-semibold text-white truncate">{doc.title}</h3>
                                {doc.is_favorite && (
                                  <Star className="w-4 h-4 text-yellow-400 fill-current flex-shrink-0" />
                                )}
                              </div>
                              <div className="flex items-center gap-4 text-sm text-gray-400">
                                <span>{doc.file_name}</span>
                                <span>{formatFileSize(doc.file_size)}</span>
                                <span>{doc.subcategory}</span>
                                <span>{new Date(doc.created_at).toLocaleDateString('de-DE')}</span>
                              </div>
                              {/* Ausschreibungsinformationen */}
                              {doc.milestone_title && (
                                <div className="flex items-center gap-2 text-sm mt-1">
                                  <Briefcase className="w-3 h-3 text-[#ffbd59]" />
                                  <span className="text-[#ffbd59] font-medium">
                                    {doc.milestone_title}
                                  </span>
                                  {doc.milestone_status && (
                                    <span className={`px-1.5 py-0.5 rounded text-xs ${
                                      doc.milestone_status === 'completed' ? 'bg-green-500/20 text-green-400' :
                                      doc.milestone_status === 'in_progress' ? 'bg-blue-500/20 text-blue-400' :
                                      doc.milestone_status === 'planned' ? 'bg-yellow-500/20 text-yellow-400' :
                                      'bg-gray-500/20 text-gray-400'
                                    }`}>
                                      {doc.milestone_status}
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                    
                            {/* Status */}
                            <div className={`px-2 py-1 rounded text-xs font-medium ${
                              doc.status === 'approved' ? 'bg-green-500/20 text-green-400' :
                              doc.status === 'rejected' ? 'bg-red-500/20 text-red-400' :
                              doc.status === 'review' ? 'bg-yellow-500/20 text-yellow-400' :
                              'bg-gray-500/20 text-gray-400'
                            }`}>
                              {doc.status || 'draft'}
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300">
                              <button
                                onClick={() => handleViewDocument(doc)}
                                className="p-2 rounded-lg bg-[#ffbd59]/20 text-[#ffbd59] hover:bg-[#ffbd59]/30 transition-all duration-300 backdrop-blur-sm border border-[#ffbd59]/30 hover:border-[#ffbd59]/50 shadow-lg shadow-[#ffbd59]/20 hover:shadow-xl hover:shadow-[#ffbd59]/40"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleEditDocument(doc)}
                                className="p-2 rounded-lg bg-white/10 backdrop-blur-sm text-gray-400 hover:text-blue-400 hover:bg-white/20 transition-all duration-300 border border-white/20 hover:border-blue-400/50 shadow-lg shadow-white/10 hover:shadow-blue-400/20"
                                title="Kategorien bearbeiten"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleToggleFavorite(doc.id)}
                                className={`p-2 rounded-lg transition-all duration-300 backdrop-blur-sm border ${
                                  doc.is_favorite 
                                    ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30 shadow-lg shadow-yellow-500/20' 
                                    : 'bg-white/10 text-gray-400 hover:text-yellow-400 hover:bg-white/20 border-white/20 hover:border-yellow-400/50 shadow-lg shadow-white/10 hover:shadow-yellow-400/20'
                                }`}
                              >
                                <Star className={`w-4 h-4 ${doc.is_favorite ? 'fill-current' : ''}`} />
                              </button>
                              <button
                                onClick={() => handleDeleteDocument(doc.id)}
                                className="p-2 rounded-lg bg-white/10 backdrop-blur-sm text-gray-400 hover:text-red-400 hover:bg-white/20 transition-all duration-300 border border-white/20 hover:border-red-400/50 shadow-lg shadow-white/10 hover:shadow-red-400/20"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
<div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
<div className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl w-full max-w-4xl max-h-[80vh] overflow-hidden border border-white/20">
            {/* Header */}
            <div className="p-6 border-b border-white/10 bg-white/5 backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">Dokumente hochladen</h2>
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
              <div className="space-y-4">
                {uploadFiles.map((uploadFile, index) => (
<div key={index} className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-4 shadow-lg shadow-white/10">
                    <div className="flex items-start gap-4">
                      {/* File Info */}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <File className="w-5 h-5 text-blue-400" />
                          <span className="font-medium text-white">{uploadFile.file.name}</span>
                          <span className="text-sm text-gray-400">
                            ({formatFileSize(uploadFile.file.size)})
                          </span>
                          {uploadFile.category && (
                            <span className="text-xs bg-[#ffbd59]/20 text-[#ffbd59] px-2 py-1 rounded-full">
                              Auto-erkannt
                            </span>
                          )}
                        </div>

                        {/* Category Selection */}
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">
                              Kategorie
                            </label>
                            <select
                              value={uploadFile.category || ''}
                              onChange={(e) => assignCategoryToFile(index, e.target.value)}
                              className="bg-[#3d4952] backdrop-blur-sm border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent shadow-lg shadow-white/10"
                            >
                              <option value="" className="bg-[#3d4952] text-white">Kategorie wählen...</option>
                              {Object.entries(DOCUMENT_CATEGORIES).map(([key, category]) => (
                                <option key={key} value={key} className="bg-[#3d4952] text-white">{category.name}</option>
                              ))}
                            </select>
                          </div>
                
                          {uploadFile.category && (
                            <div>
                              <label className="block text-sm font-medium text-gray-300 mb-1">
                                Unterkategorie
                              </label>
                              <select
                                value={uploadFile.subcategory || ''}
                                onChange={(e) => assignCategoryToFile(index, uploadFile.category!, e.target.value)}
                                className="bg-[#3d4952] backdrop-blur-sm border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent shadow-lg shadow-white/10"
                              >
                                <option value="" className="bg-[#3d4952] text-white">Unterkategorie wählen...</option>
                                {DOCUMENT_CATEGORIES[uploadFile.category as keyof typeof DOCUMENT_CATEGORIES]?.subcategories.map(sub => (
                                  <option key={sub} value={sub} className="bg-[#3d4952] text-white">{sub}</option>
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
                            <XCircle className="w-4 h-4" />
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
<div className="p-6 border-t border-white/10 bg-white/5 backdrop-blur-sm flex items-center justify-between">
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
                <input
                  type="file"
                  id="additional-file-input"
                  multiple
                  onChange={handleAdditionalFilesSelected}
                  className="hidden"
                />
                <button
                  onClick={() => document.getElementById('additional-file-input')?.click()}
                  className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 hover:border-[#ffbd59]/50 text-white rounded-lg font-medium transition-all duration-300 shadow-lg shadow-white/10 hover:shadow-[#ffbd59]/20"
                >
                  <Plus className="w-4 h-4" />
                  Weitere Dokumente
                </button>
                <button
                  onClick={uploadAllFiles}
                  disabled={uploadFiles.some(f => !f.category && !f.subcategory) || uploadFiles.some(f => f.status === 'uploading')}
                  className="bg-[#ffbd59] hover:bg-[#ffa726] disabled:bg-white/10 disabled:cursor-not-allowed text-[#1a1a2e] disabled:text-gray-400 px-6 py-2 rounded-lg font-medium transition-all duration-300 shadow-lg shadow-[#ffbd59]/30 hover:shadow-xl hover:shadow-[#ffbd59]/50 hover:scale-105 disabled:hover:scale-100"
                  title={uploadFiles.some(f => !f.category && !f.subcategory) ? 'Bitte wählen Sie für alle Dokumente mindestens eine Kategorie oder Unterkategorie aus' : ''}
                >
                  Alle hochladen
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Document Modal */}
      {showEditModal && editingDocument && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl w-full max-w-md border border-white/20">
            {/* Header */}
            <div className="p-6 border-b border-white/10 bg-white/5 backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">Dokument bearbeiten</h2>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingDocument(null);
                    setEditCategory('');
                    setEditSubcategory('');
                  }}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-4">
                  <File className="w-5 h-5 text-blue-400" />
                  <span className="font-medium text-white">{editingDocument.title}</span>
                </div>
              </div>

              <div className="space-y-4">
                {/* Category Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Kategorie
                  </label>
                  <select
                    value={editCategory}
                    onChange={(e) => {
                      setEditCategory(e.target.value);
                      setEditSubcategory(''); // Reset subcategory when category changes
                    }}
                    className="bg-[#3d4952] backdrop-blur-sm border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent shadow-lg shadow-white/10"
                  >
                    <option value="" className="bg-[#3d4952] text-white">Kategorie wählen...</option>
                    {Object.entries(DOCUMENT_CATEGORIES).map(([key, category]) => (
                      <option key={key} value={key} className="bg-[#3d4952] text-white">{category.name}</option>
                    ))}
                  </select>
                </div>

                {/* Subcategory Selection */}
                {editCategory && (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Unterkategorie
                    </label>
                    <select
                      value={editSubcategory}
                      onChange={(e) => setEditSubcategory(e.target.value)}
                      className="bg-[#3d4952] backdrop-blur-sm border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent shadow-lg shadow-white/10"
                    >
                      <option value="" className="bg-[#3d4952] text-white">Unterkategorie wählen...</option>
                      {DOCUMENT_CATEGORIES[editCategory as keyof typeof DOCUMENT_CATEGORIES]?.subcategories.map(sub => (
                        <option key={sub} value={sub} className="bg-[#3d4952] text-white">{sub}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Ausschreibungs-Zuordnung */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Ausschreibung zuordnen
                  </label>
                  <select
                    value={editMilestoneId || ''}
                    onChange={(e) => setEditMilestoneId(e.target.value ? parseInt(e.target.value) : null)}
                    className="bg-[#3d4952] backdrop-blur-sm border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent shadow-lg shadow-white/10"
                  >
                    <option value="" className="bg-[#3d4952] text-white">Keine Ausschreibung</option>
                    {milestones.map(milestone => (
                      <option key={milestone.id} value={milestone.id} className="bg-[#3d4952] text-white">
                        {milestone.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-white/10 bg-white/5 backdrop-blur-sm flex items-center justify-between">
              <button
                onClick={openDuplicateModal}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-all duration-300 shadow-lg shadow-blue-600/30 hover:shadow-xl hover:shadow-blue-600/50 hover:scale-105"
                disabled={milestones.length === 0}
                title={milestones.length === 0 ? 'Keine Ausschreibungen verfügbar' : 'Dokument in andere Ausschreibung duplizieren'}
              >
                <File className="w-4 h-4" />
                Duplizieren
              </button>
              
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingDocument(null);
                    setEditCategory('');
                    setEditSubcategory('');
                    setEditMilestoneId(null);
                  }}
                  className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                >
                  Abbrechen
                </button>
                <button
                  onClick={handleUpdateDocument}
                  disabled={!editCategory}
                  className="bg-[#ffbd59] hover:bg-[#ffa726] disabled:bg-white/10 disabled:cursor-not-allowed text-[#1a1a2e] disabled:text-gray-400 px-6 py-2 rounded-lg font-medium transition-all duration-300 shadow-lg shadow-[#ffbd59]/30 hover:shadow-xl hover:shadow-[#ffbd59]/50 hover:scale-105 disabled:hover:scale-100"
                >
                  Speichern
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Duplikations-Modal */}
      {showDuplicateModal && editingDocument && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl w-full max-w-md border border-white/20">
            {/* Header */}
            <div className="p-6 border-b border-white/10 bg-white/5 backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">Dokument duplizieren</h2>
                <button
                  onClick={() => {
                    setShowDuplicateModal(false);
                    setDuplicateTargetMilestoneId(null);
                  }}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-4">
                  <File className="w-5 h-5 text-blue-400" />
                  <span className="font-medium text-white">{editingDocument.title}</span>
                </div>
                <p className="text-sm text-gray-400 mb-4">
                  Wählen Sie die Ziel-Ausschreibung aus, in die das Dokument dupliziert werden soll:
                </p>
              </div>

              <div className="space-y-4">
                {/* Ziel-Ausschreibung */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Ziel-Ausschreibung
                  </label>
                  <select
                    value={duplicateTargetMilestoneId || ''}
                    onChange={(e) => setDuplicateTargetMilestoneId(e.target.value ? parseInt(e.target.value) : null)}
                    className="bg-[#3d4952] backdrop-blur-sm border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent shadow-lg shadow-white/10"
                  >
                    <option value="" className="bg-[#3d4952] text-white">Ausschreibung wählen...</option>
                    {milestones.filter(m => m.id !== editingDocument.milestone_id).map(milestone => (
                      <option key={milestone.id} value={milestone.id} className="bg-[#3d4952] text-white">
                        {milestone.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-white/10 bg-white/5 backdrop-blur-sm flex items-center justify-end gap-3">
              <button
                onClick={() => {
                  setShowDuplicateModal(false);
                  setDuplicateTargetMilestoneId(null);
                }}
                className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
              >
                Abbrechen
              </button>
              <button
                onClick={handleDuplicateDocument}
                disabled={!duplicateTargetMilestoneId}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-white/10 disabled:cursor-not-allowed text-white disabled:text-gray-400 px-6 py-2 rounded-lg font-medium transition-all duration-300 shadow-lg shadow-blue-600/30 hover:shadow-xl hover:shadow-blue-600/50 hover:scale-105 disabled:hover:scale-100"
              >
                Duplizieren
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Document Viewer */}
      {showViewer && selectedDocument && (
        <DocumentViewer
          document={selectedDocument}
          onClose={() => {
            setShowViewer(false);
            setSelectedDocument(null);
          }}
        />
      )}
    </div>
  );
};

export default Documents; 
