import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  Globe, 
  Star, 
  Settings, 
  ChevronDown, 
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
  Video,
  Archive,
  FolderOpen,
  Info,
  Building
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useProject } from '../context/ProjectContext';
import { getProject } from '../api/projectService';
import { createProject } from '../api/projectService';
import { uploadDocument } from '../api/documentService';
import FavoritesManager from './FavoritesManager';
import CreditIndicator from './CreditIndicator';
import CreditDisplay from './CreditDisplay';
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
      'Baufortschrittsfotos',
      'Mängeldokumentation',
      'Bestandsdokumentation',
      'Videos',
      'Baustellenberichte'
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

interface FavoriteItem {
  id: string;
  title: string;
  path: string;
  icon: string;
  category: 'navigation' | 'tools' | 'projects';
  isActive?: boolean;
}

export default function Navbar() {
  const { user, logout, isServiceProvider } = useAuth();
  const location = useLocation();
  const pathname = location.pathname;
  const { selectedProject, projects } = useProject();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [showFavoritesManager, setShowFavoritesManager] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  
  // Projekt-Erstellung State
  const [showCreateProjectModal, setShowCreateProjectModal] = useState(false);
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [createProjectError, setCreateProjectError] = useState<string | null>(null);
  
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
    address_country: 'Deutschland',
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

  // Favoriten laden
  useEffect(() => {
    const loadFavorites = () => {
      try {
        const storedFavorites = localStorage.getItem('favorites');
        if (storedFavorites) {
          const parsedFavorites = JSON.parse(storedFavorites);
          setFavorites(parsedFavorites);
          console.log('🔍 Favoriten geladen:', parsedFavorites);
        }
      } catch (error) {
        console.error('❌ Fehler beim Laden der Favoriten:', error);
        setFavorites([]);
      }
    };

    loadFavorites();
    
    const handleStorageChange = () => {
      loadFavorites();
    };

    const handleCustomStorageChange = (event: Event) => {
      if (event instanceof StorageEvent && event.key === 'favorites') {
        loadFavorites();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('favoritesChanged', handleCustomStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('favoritesChanged', handleCustomStorageChange);
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

  const renderIcon = (iconString: string) => {
    const iconMap: { [key: string]: React.ReactNode } = {
      '<Home size={16} />': <Home size={16} />,
      '<FileText size={16} />': <FileText size={16} />,
      '<CheckSquare size={16} />': <CheckSquare size={16} />,
      '<Euro size={16} />': <Euro size={16} />,
      '<MessageSquare size={16} />': <MessageSquare size={16} />,
      '<BarChart3 size={16} />': <BarChart3 size={16} />,
      '<Palette size={16} />': <Palette size={16} />,
      '<Globe size={16} />': <Globe size={16} />,
    };
    
    return iconMap[iconString] || <Star size={16} />;
  };

  const handleLogout = () => {
    logout();
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
      address_country: 'Deutschland',
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
        address_country: projectForm.address_country?.trim() || 'Deutschland',
        property_size: projectForm.property_size ? parseFloat(projectForm.property_size) : undefined,
        construction_area: projectForm.construction_area ? parseFloat(projectForm.construction_area) : undefined,
        start_date: projectForm.start_date || undefined,
        end_date: projectForm.end_date || undefined,
        budget: projectForm.budget ? parseFloat(projectForm.budget) : undefined,
        is_public: true,
        allow_quotes: projectForm.allow_quotes,
        construction_phase: projectForm.construction_phase || undefined
      };

      console.log('🚀 Erstelle neues Projekt mit Daten:', projectData);
      const newProject = await createProject(projectData);
      console.log('✅ Neues Projekt erstellt:', newProject);

      // Upload documents if any
      if (uploadFiles && uploadFiles.length > 0) {
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

      // Schließe Modal und navigiere zum neuen Projekt
      handleCloseCreateProjectModal();
      window.location.href = `/project/${newProject.id}`;

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
    <nav className="bg-gradient-to-r from-[#2c3539] to-[#3d4952] text-white shadow-xl border-b border-[#ffbd59]/20">
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

                  <div className="relative group" data-tour-id="navbar-favorites">
                    <button className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 ${
                      isProjectActive() 
                        ? 'bg-[#ffbd59] text-[#2c3539] font-semibold shadow-lg' 
                        : 'text-white hover:bg-white/10 hover:text-[#ffbd59]'
                    }`}>
                      <Star size={18} />
                      <span>Favoriten</span>
                      <ChevronDown size={16} className="group-hover:rotate-180 transition-transform" />
                    </button>
                    
                    <div className="absolute top-full left-0 mt-2 w-64 bg-[#3d4952] rounded-xl shadow-2xl border border-white/20 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50">
                      <div className="p-2">
                        <div className="flex items-center justify-between p-3 text-gray-300 text-sm border-b border-white/10">
                          <span>Ihre konfigurierten Favoriten</span>
                          <button
                            onClick={() => setShowFavoritesManager(true)}
                            className="p-1 hover:bg-white/10 rounded transition-colors"
                            title="Favoriten verwalten"
                          >
                            <Settings size={14} className="text-[#ffbd59]" />
                          </button>
                        </div>
                        <div className="mt-2 max-h-64 overflow-y-auto">
                          {favorites.length > 0 ? (
                            favorites.map((favorite) => (
                              <Link
                                key={favorite.id}
                                to={favorite.path}
                                className={`flex items-center gap-3 p-3 rounded-lg hover:bg-white/10 transition-colors text-white ${
                                  isActive(favorite.path) ? 'bg-white/10 text-[#ffbd59]' : ''
                                }`}
                              >
                                <div className="text-[#ffbd59]">
                                  {renderIcon(favorite.icon)}
                                </div>
                                <span>{favorite.title}</span>
                              </Link>
                            ))
                          ) : (
                            <div className="p-3 text-gray-400 text-sm text-center">
                              <Star size={16} className="mx-auto mb-2 opacity-50" />
                              <p>Keine Favoriten konfiguriert</p>
                              <p className="text-xs mt-1">Klicken Sie auf das Zahnrad zum Konfigurieren</p>
                              <p className="text-xs mt-1 text-gray-500">Debug: {favorites.length} Favoriten geladen</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

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

                  {/* Credits-Link für Bauträger */}
                  {!isServiceProvider() && user?.user_role === 'BAUTRAEGER' && (
                    <Link
                      to="/credits"
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 ${
                        isActive('/credits') 
                          ? 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-white font-semibold shadow-lg' 
                          : 'text-yellow-200 hover:bg-yellow-500/20 hover:text-yellow-100 border border-yellow-400/30'
                      }`}
                    >
                      <Coins size={18} />
                      <span>Credits</span>
                    </Link>
                  )}

                  <div className="relative group">
                    <button className="flex items-center gap-2 px-4 py-2 rounded-lg text-white hover:bg-white/10 hover:text-[#ffbd59] transition-all duration-300">
                      <BarChart3 size={18} />
                      <span>Tools</span>
                      <ChevronDown size={16} className="group-hover:rotate-180 transition-transform" />
                    </button>
                    
                    <div className="absolute top-full left-0 mt-2 w-56 bg-[#3d4952] rounded-xl shadow-2xl border border-white/20 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50">
                      <div className="p-2">
                        <Link
                          to="/documents"
                          className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/10 transition-colors text-white"
                        >
                          <FileText size={16} className="text-[#ffbd59]" />
                          <span>Dokumente</span>
                        </Link>
                        <Link
                          to="/visualize"
                          className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/10 transition-colors text-white"
                        >
                          <BarChart3 size={16} className="text-[#ffbd59]" />
                          <span>Visualisierung</span>
                        </Link>
                        <Link
                          to="/roadmap"
                          className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/10 transition-colors text-white"
                        >
                          <Calendar size={16} className="text-[#ffbd59]" />
                          <span>Roadmap</span>
                        </Link>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>



          {/* Rechte Seite */}
          <div className="flex items-center gap-4">
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
            {/* Pro-Button für Bauträger */}
            {!isServiceProvider() && user?.user_role === 'bautraeger' && (
              <div className="hidden md:block">
                {user?.subscription_plan === 'pro' && user?.subscription_status === 'active' ? (
                  // Pro-Badge für aktive Pro-User
                  <div className="flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-[#ffbd59] to-[#ffa726] rounded-full">
                    <span className="text-[#2c3539] font-semibold text-sm">💎 Pro</span>
                  </div>
                ) : (
                  // Pro-Upgrade-Button für Basis-User
                  <button
                    onClick={() => {/* TODO: Open UpgradeModal */}}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#ffbd59] to-[#ffa726] hover:from-[#ffa726] hover:to-[#ff9800] text-[#2c3539] rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg"
                  >
                    <span className="text-lg">💎</span>
                    <span>Pro</span>
                  </button>
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
                      
                      <Link
                        to="/messages"
                        className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/10 transition-colors text-white"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <MessageCircle size={16} />
                        <span className="text-sm">Nachrichten</span>
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
              className="md:hidden p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              {showMobileMenu ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {showMobileMenu && (
          <div className="md:hidden border-t border-white/10 py-4">
            <div className="space-y-2">
              {isServiceProvider() ? (
                /* Dienstleister Mobile Menu: nur Dashboard und Gebühren */
                <>
                  <Link
                    to="/service-provider"
                    className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
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
                    to="/finance"
                    className="flex items-center gap-3 p-3 rounded-lg text-white hover:bg-white/10 transition-colors"
                    onClick={() => setShowMobileMenu(false)}
                  >
                    <Euro size={18} />
                    <span>Finanzen</span>
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
          className="fixed inset-0 z-40" 
          onClick={() => {
            setShowUserMenu(false);
            setShowMobileMenu(false);
          }}
        />
      )}

      {/* FavoritesManager Modal */}
      <FavoritesManager 
        isOpen={showFavoritesManager} 
        onClose={() => setShowFavoritesManager(false)} 
      />

      {/* Projekt-Erstellungs-Modal */}
      {showCreateProjectModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-[#2c3539] to-[#3d4952] rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-[#ffbd59]/20">
            <div className="p-6">
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
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-200 mb-2">
                        Straße & Hausnummer
                      </label>
                      <input
                        type="text"
                        name="address_street"
                        value={projectForm.address_street}
                        onChange={handleProjectFormChange}
                        className="w-full px-3 py-2 bg-[#1a1a2e]/50 border border-gray-600 rounded-lg focus:ring-2 focus:ring-[#ffbd59] focus:border-[#ffbd59] text-white placeholder-gray-400"
                        placeholder="z.B. Musterstraße 123"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-200 mb-2">
                        PLZ
                      </label>
                      <input
                        type="text"
                        name="address_zip"
                        value={projectForm.address_zip}
                        onChange={handleProjectFormChange}
                        className="w-full px-3 py-2 bg-[#1a1a2e]/50 border border-gray-600 rounded-lg focus:ring-2 focus:ring-[#ffbd59] focus:border-[#ffbd59] text-white placeholder-gray-400"
                        placeholder="z.B. 80331"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-200 mb-2">
                        Ort
                      </label>
                      <input
                        type="text"
                        name="address_city"
                        value={projectForm.address_city}
                        onChange={handleProjectFormChange}
                        className="w-full px-3 py-2 bg-[#1a1a2e]/50 border border-gray-600 rounded-lg focus:ring-2 focus:ring-[#ffbd59] focus:border-[#ffbd59] text-white placeholder-gray-400"
                        placeholder="z.B. München"
                      />
                    </div>
                  </div>
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
                      Enddatum
                    </label>
                    <input
                      type="date"
                      name="end_date"
                      value={projectForm.end_date}
                      onChange={handleProjectFormChange}
                      className="w-full px-3 py-2 bg-[#1a1a2e]/50 border border-gray-600 rounded-lg focus:ring-2 focus:ring-[#ffbd59] focus:border-[#ffbd59] text-white"
                    />
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
                    <p className="text-gray-400 text-sm mb-4">
                      Unterstützte Formate: PDF, Word, Excel, Bilder, Videos (max. 50MB pro Datei)
                    </p>
                    
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
                        </div>

                        {/* Category Selection */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Kategorie */}
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                              Kategorie *
                            </label>
                            <select
                              value={uploadFile.category || ''}
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
                                <option key={key} value={key}>{category.name}</option>
                              ))}
                            </select>
                          </div>

                          {/* Unterkategorie */}
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                              Unterkategorie *
                            </label>
                            <select
                              value={uploadFile.subcategory || ''}
                              onChange={(e) => {
                                setUploadFiles(prev => prev.map((f, i) => 
                                  i === index 
                                    ? { ...f, subcategory: e.target.value }
                                    : f
                                ));
                              }}
                              disabled={!uploadFile.category}
                              className="w-full px-3 py-2 bg-[#1a1a2e]/50 border border-gray-600 rounded-lg focus:ring-2 focus:ring-[#ffbd59] focus:border-[#ffbd59] text-white disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <option value="">Unterkategorie wählen...</option>
                              {uploadFile.category && DOCUMENT_CATEGORIES[uploadFile.category as keyof typeof DOCUMENT_CATEGORIES]?.subcategories.map((sub) => (
                                <option key={sub} value={sub}>{sub}</option>
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
                    disabled={uploadFiles.some(f => !f.category || !f.subcategory)}
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
    </nav>
  );
} 