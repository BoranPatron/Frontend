import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSwipeable } from 'react-swipeable';
import { 
  Home, 
  FileText, 
  CheckSquare, 
  Euro, 
  MessageSquare, 
  BarChart3, 
  Users, 
  Upload, 
  Clock, 
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Palette,
  Plus,
  X
} from 'lucide-react';
import DashboardCard from '../components/DashboardCard';
import { useProject } from '../context/ProjectContext';
import { useAuth } from '../context/AuthContext';
import { getProjects, createProject } from '../api/projectService';

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
  property_size?: number;
  construction_area?: number;
  estimated_duration?: number;
  is_public: boolean;
  allow_quotes: boolean;
  created_at: string;
  updated_at: string;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { isInitialized, isAuthenticated } = useAuth();
  const { 
    projects, 
    selectedProject, 
    selectedProjectIndex, 
    setSelectedProjectIndex,
    loadProjects,
    isLoading: projectsLoading,
    error: projectsError 
  } = useProject();
  
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  
  // State für Projekt-Erstellung
  const [showCreateProjectModal, setShowCreateProjectModal] = useState(false);
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [createProjectError, setCreateProjectError] = useState<string | null>(null);
  const [projectForm, setProjectForm] = useState({
    name: '',
    description: '',
    project_type: 'new_build',
    address: '',
    property_size: '',
    construction_area: '',
    start_date: '',
    end_date: '',
    budget: '',
    is_public: false,
    allow_quotes: true
  });

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
  const onFinanceClick = () => {
    if (selectedProject) {
      navigate(`/finance?project=${selectedProject.id}`);
    } else {
      navigate('/finance');
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

  const handleCloseCreateProjectModal = () => {
    setShowCreateProjectModal(false);
    setProjectForm({
      name: '',
      description: '',
      project_type: 'new_build',
      address: '',
      property_size: '',
      construction_area: '',
      start_date: '',
      end_date: '',
      budget: '',
      is_public: false,
      allow_quotes: true
    });
  };

  const handleProjectFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setProjectForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
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
        address: projectForm.address.trim() || undefined,
        property_size: projectForm.property_size ? parseFloat(projectForm.property_size) : undefined,
        construction_area: projectForm.construction_area ? parseFloat(projectForm.construction_area) : undefined,
        start_date: projectForm.start_date || undefined,
        end_date: projectForm.end_date || undefined,
        budget: projectForm.budget ? parseFloat(projectForm.budget) : undefined,
        is_public: projectForm.is_public,
        allow_quotes: projectForm.allow_quotes
      };

      const newProject = await createProject(projectData);
      console.log('✅ Neues Projekt erstellt:', newProject);

      // Schließe Modal und lade Projekte neu
      handleCloseCreateProjectModal();
      await loadProjects();

      // Navigiere zum neuen Projekt
      navigate(`/project/${newProject.id}`);

    } catch (error) {
      console.error('❌ Fehler beim Erstellen des Projekts:', error);
      setCreateProjectError(error instanceof Error ? error.message : 'Unbekannter Fehler beim Erstellen des Projekts');
    } finally {
      setIsCreatingProject(false);
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

  // Berechne Budget-Auslastung
  const getBudgetUtilization = (project: Project) => {
    if (!project.budget || project.budget === 0) return 0;
    return Math.round((project.current_costs / project.budget) * 100);
  };

  // Mock-Daten für Dashboard-Kacheln (können später durch echte API-Daten ersetzt werden)
  const getMockProjectStats = (project: Project) => {
    // Berechne die Anzahl aktiver Gewerke basierend auf der Projekt-ID
    // In einer echten Implementierung würde dies aus der Datenbank kommen
    const activeTrades = Math.floor(Math.random() * 8) + 2; // 2-9 aktive Gewerke
    
    return {
      activeTrades,
      openTasks: Math.floor(Math.random() * 20) + 5,
      newDocuments: Math.floor(Math.random() * 10) + 1,
      newQuotes: Math.floor(Math.random() * 5),
      notifications: Math.floor(Math.random() * 8) + 2,
      lastActivity: "vor 2 Stunden"
    };
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
  const projectStats = getMockProjectStats(currentProject);

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

  // Dynamische Dashboard-Karten basierend auf aktuellem Projekt
  const getDashboardCards = () => [
    {
      title: "Manager",
      description: "Projekt- und Gewerkverwaltung",
      icon: <Home size={32} />,
      onClick: onManagerClick,
      ariaLabel: "Projekt- und Gewerkverwaltung öffnen",
      status: (isOnline ? 'online' : 'offline') as 'online' | 'offline',
      progress: { value: currentProject.progress_percentage, label: "Projektfortschritt" },
      cardId: "manager",
      path: "/",
      iconString: "<Home size={16} />",
      children: (
        <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
          <Users size={16} />
          <span>{projectStats.activeTrades} aktive Gewerke</span>
        </div>
      )
    },
    {
      title: "Docs",
      description: "Dokumentenmanagement & Uploads",
      icon: <FileText size={32} />,
      onClick: onDocsClick,
      ariaLabel: "Dokumentenmanagement öffnen",
      badge: { text: `${projectStats.newDocuments} neue`, color: "blue" as const },
      cardId: "docs",
      path: "/documents",
      iconString: "<FileText size={16} />",
      children: (
        <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
          <Upload size={16} />
          <span>Foto-Upload verfügbar</span>
        </div>
      )
    },
    {
      title: "To Do",
      description: "Aufgabenmanagement & Tracking",
      icon: <CheckSquare size={32} />,
      onClick: onTodoClick,
      ariaLabel: "Aufgabenmanagement öffnen",
      badge: { text: `${projectStats.openTasks} offen`, color: "yellow" as const },
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
      title: "Finance",
      description: "Budget, Ausgaben & Forecasts",
      icon: <Euro size={32} />,
      onClick: onFinanceClick,
      ariaLabel: "Finanzmanagement öffnen",
      progress: { 
        value: getBudgetUtilization(currentProject), 
        label: "Budget-Auslastung" 
      },
      cardId: "finance",
      path: "/finance",
      iconString: "<Euro size={16} />",
      children: (
        <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
          <TrendingUp size={16} />
          <span>Forecasts verfügbar</span>
        </div>
      )
    },
    {
      title: "Gewerke",
      description: "Angebote & Ausschreibungen",
      icon: <MessageSquare size={32} />,
      onClick: onOfferingClick,
      ariaLabel: "Angebote und Ausschreibungen öffnen",
      badge: { text: `${projectStats.newQuotes} neue`, color: "green" as const },
      cardId: "quotes",
      path: "/quotes",
      iconString: "<MessageSquare size={16} />",
      children: (
        <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
          <MessageSquare size={16} />
          <span>Angebote verwalten</span>
        </div>
      )
    },
    {
      title: "Visualize",
      description: "Analytics & Berichte",
      icon: <BarChart3 size={32} />,
      onClick: onVisualizeClick,
      ariaLabel: "Analytics und Berichte öffnen",
      cardId: "visualize",
      path: "/visualize",
      iconString: "<BarChart3 size={16} />",
      children: (
        <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
          <BarChart3 size={16} />
          <span>Daten visualisieren</span>
        </div>
      )
    },
    {
      title: "Canvas",
      description: "Unlimited Canvas & Kollaboration",
      icon: <Palette size={32} />,
      onClick: onCanvasClick,
      ariaLabel: "Canvas und Kollaboration öffnen",
      cardId: "canvas",
      path: "/canvas",
      iconString: "<Palette size={16} />",
      children: (
        <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
          <Palette size={16} />
          <span>Sticky Notes & Zeichnungen</span>
        </div>
      )
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460] p-6">
      {/* Header mit Projekt-Informationen */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-bold text-white">Dashboard</h1>
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${isOnline ? 'bg-green-400' : 'bg-red-400'}`}></div>
            <span className="text-sm text-gray-300">{isOnline ? 'Online' : 'Offline'}</span>
          </div>
        </div>

        {/* Projekt-Auswahl mit Swipe-Funktionalität */}
        {projects.length > 0 && (
          <div 
            {...swipeHandlers}
            className="relative bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 transition-all duration-300 hover:bg-white/15"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-[#ffbd59] rounded-full"></div>
                <span className="text-sm text-gray-400">Aktuelles Projekt</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-400">
                  {selectedProjectIndex + 1} von {projects.length}
                </span>
              </div>
            </div>

            <div className="mb-4">
              <h2 className="text-2xl font-bold text-white mb-2">{currentProject.name}</h2>
              <p className="text-gray-300 mb-3">{currentProject.description}</p>
              
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

            {/* Projekt-Fortschritt */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-300">Fortschritt</span>
                <span className="text-[#ffbd59] font-bold">{currentProject.progress_percentage}%</span>
              </div>
              <div className="w-full bg-gray-700/50 rounded-full h-3 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-[#ffbd59] to-[#ffa726] h-3 rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${currentProject.progress_percentage}%` }}
                ></div>
              </div>
            </div>

            {/* Projekt-Details */}
            <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
              <div>
                <span className="text-gray-400">Start:</span>
                <span className="text-white ml-2">{formatDate(currentProject.start_date || '')}</span>
              </div>
              <div>
                <span className="text-gray-400">Ende:</span>
                <span className="text-white ml-2">{formatDate(currentProject.end_date || '')}</span>
              </div>
            </div>
          </div>
        )}

        {/* Fehler-Anzeige */}
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

      {/* Dashboard-Karten */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {getDashboardCards().map((card, index) => (
          <DashboardCard
            key={index}
            title={card.title}
            icon={card.icon}
            onClick={card.onClick}
            ariaLabel={card.ariaLabel}
            status={card.status}
            badge={card.badge}
            progress={card.progress}
            cardId={card.cardId}
            path={card.path}
            iconString={card.iconString}
          >
            {card.children}
          </DashboardCard>
        ))}
      </div>

      {/* Debug-Info */}
      <div className="mt-8 text-xs text-gray-400 text-center">
        <p>Debug: AuthContext initialisiert: {isInitialized ? 'Ja' : 'Nein'}</p>
        <p>Debug: Projekte geladen: {projects.length}</p>
        <p>Debug: Aktuelles Projekt: {selectedProject ? selectedProject.name : 'Keines'}</p>
      </div>

      {/* Projekt-Erstellungs-Modal */}
      {showCreateProjectModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Neues Projekt erstellen</h2>
                <button
                  onClick={handleCloseCreateProjectModal}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleCreateProject} className="space-y-6">
                {/* Grundinformationen */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Projektname *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={projectForm.name}
                      onChange={handleProjectFormChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent"
                      placeholder="z.B. Einfamilienhaus München"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Projekttyp *
                    </label>
                    <select
                      name="project_type"
                      value={projectForm.project_type}
                      onChange={handleProjectFormChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent"
                    >
                      <option value="new_build">Neubau</option>
                      <option value="renovation">Renovierung</option>
                      <option value="extension">Anbau</option>
                      <option value="refurbishment">Sanierung</option>
                    </select>
                  </div>
                </div>

                {/* Beschreibung */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Beschreibung
                  </label>
                  <textarea
                    name="description"
                    value={projectForm.description}
                    onChange={handleProjectFormChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent"
                    placeholder="Beschreiben Sie Ihr Projekt..."
                  />
                </div>

                {/* Adresse */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Projektadresse
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={projectForm.address}
                    onChange={handleProjectFormChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent"
                    placeholder="z.B. Musterstraße 123, 80331 München"
                  />
                </div>

                {/* Projektdetails */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Grundstücksgröße (m²)
                    </label>
                    <input
                      type="number"
                      name="property_size"
                      value={projectForm.property_size}
                      onChange={handleProjectFormChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent"
                      placeholder="z.B. 500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Wohnfläche (m²)
                    </label>
                    <input
                      type="number"
                      name="construction_area"
                      value={projectForm.construction_area}
                      onChange={handleProjectFormChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent"
                      placeholder="z.B. 150"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Budget (€)
                    </label>
                    <input
                      type="number"
                      name="budget"
                      value={projectForm.budget}
                      onChange={handleProjectFormChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent"
                      placeholder="z.B. 500000"
                    />
                  </div>
                </div>

                {/* Zeitplan */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Startdatum
                    </label>
                    <input
                      type="date"
                      name="start_date"
                      value={projectForm.start_date}
                      onChange={handleProjectFormChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Enddatum
                    </label>
                    <input
                      type="date"
                      name="end_date"
                      value={projectForm.end_date}
                      onChange={handleProjectFormChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Einstellungen */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      name="is_public"
                      checked={projectForm.is_public}
                      onChange={handleProjectFormChange}
                      className="w-4 h-4 text-[#ffbd59] border-gray-300 rounded focus:ring-[#ffbd59]"
                    />
                    <label className="text-sm text-gray-700">
                      Projekt für Dienstleister sichtbar machen
                    </label>
                  </div>

                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      name="allow_quotes"
                      checked={projectForm.allow_quotes}
                      onChange={handleProjectFormChange}
                      className="w-4 h-4 text-[#ffbd59] border-gray-300 rounded focus:ring-[#ffbd59]"
                    />
                    <label className="text-sm text-gray-700">
                      Angebote für dieses Projekt erlauben
                    </label>
                  </div>
                </div>

                {/* Fehler-Anzeige */}
                {createProjectError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
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
                    className="px-6 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    Abbrechen
                  </button>
                  <button
                    type="submit"
                    disabled={isCreatingProject}
                    className="flex items-center space-x-2 bg-[#ffbd59] hover:bg-[#ffa726] disabled:bg-gray-300 text-[#2c3539] px-6 py-2 rounded-lg font-semibold transition-colors duration-200"
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
    </div>
  );
} 