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
  CheckCircle
} from 'lucide-react';
import DashboardCard from '../components/DashboardCard';
import { useProject } from '../context/ProjectContext';
import { useAuth } from '../context/AuthContext';
import { getProjects } from '../api/projectService';

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
  const { isInitialized } = useAuth();
  const { 
    projects, 
    selectedProject, 
    selectedProjectIndex, 
    setSelectedProjectIndex,
    isLoading: projectsLoading,
    error: projectsError 
  } = useProject();
  
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

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
        <p>Projekte geladen: {projects.length}</p>
        <p>Aktuelles Projekt: {selectedProject?.name || 'Keines'}</p>
      </div>
    </div>
  );
} 