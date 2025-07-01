import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSwipeable } from 'react-swipeable';
import DashboardCard from '../components/DashboardCard';
import { getProjects } from '../api/projectService';
import { 
  Home, 
  FileText, 
  CheckSquare, 
  Euro, 
  Handshake, 
  Eye,
  Wifi,
  WifiOff,
  Clock,
  AlertTriangle,
  TrendingUp,
  Upload,
  Calendar,
  Users,
  BarChart3,
  Camera,
  FolderOpen,
  ClipboardList,
  Calculator,
  Image as ImageIcon,
  Sparkles,
  Zap,
  Target,
  Award,
  ChevronLeft,
  ChevronRight,
  Building,
  MapPin
} from 'lucide-react';
import logo from '../logo_bw.png';
import { PHASES, ProjectPhase } from '../constants/phases';

// Interface für echte Projekte aus der API
interface Project {
  id: number;
  name: string;
  description: string;
  project_type: string;
  status: string;
  phase: string;
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
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [currentProjectIndex, setCurrentProjectIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Lade echte Projekte aus der API
  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    setLoading(true);
    try {
      const data = await getProjects();
      setProjects(data);
      // Setze den Index zurück, falls das aktuelle Projekt nicht mehr existiert
      if (currentProjectIndex >= data.length) {
        setCurrentProjectIndex(0);
      }
    } catch (e: any) {
      console.error('❌ Error loading projects:', e);
      setError(e.message || 'Fehler beim Laden der Projekte');
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  // Fallback-Projekt falls keine Projekte geladen werden konnten
  const fallbackProject: Project = {
    id: 0,
    name: "Keine Projekte verfügbar",
    description: "Erstellen Sie Ihr erstes Projekt im Manager",
    project_type: "new_build",
    status: "planning",
    phase: "preparation",
    progress_percentage: 0,
    current_costs: 0,
    is_public: false,
    allow_quotes: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  const currentProject = projects.length > 0 ? projects[currentProjectIndex] : fallbackProject;

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

  // Swipe-Handler
  const handleSwipe = (direction: 'left' | 'right') => {
    if (isTransitioning || projects.length === 0) return;
    
    setIsTransitioning(true);
    
    if (direction === 'left' && currentProjectIndex < projects.length - 1) {
      setCurrentProjectIndex(prev => prev + 1);
    } else if (direction === 'right' && currentProjectIndex > 0) {
      setCurrentProjectIndex(prev => prev - 1);
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
    if (projects.length > 0) {
      navigate(`/project/${projects[currentProjectIndex].id}`);
    } else {
      navigate('/');
    }
  };
  const onDocsClick = () => {
    if (projects.length > 0) {
      navigate(`/documents?project=${projects[currentProjectIndex].id}`);
    } else {
      navigate('/documents');
    }
  };
  const onTodoClick = () => {
    if (projects.length > 0) {
      navigate(`/tasks?project=${projects[currentProjectIndex].id}`);
    } else {
      navigate('/tasks');
    }
  };
  const onFinanceClick = () => {
    if (projects.length > 0) {
      navigate(`/finance?project=${projects[currentProjectIndex].id}`);
    } else {
      navigate('/finance');
    }
  };
  const onOfferingClick = () => {
    navigate('/quotes');
  };
  const onVisualizeClick = () => {
    if (projects.length > 0) {
      navigate(`/visualize?project=${projects[currentProjectIndex].id}`);
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

  const getPhaseLabel = (phase: string) => {
    return PHASES[phase as ProjectPhase]?.label || phase;
  };

  const getPhaseColor = (phase: string) => {
    return PHASES[phase as ProjectPhase]?.color || 'bg-gray-500';
  };

  const getPhaseIcon = (phase: string) => {
    return PHASES[phase as ProjectPhase]?.icon || '📋';
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

  const projectStats = getMockProjectStats(currentProject);

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
        value: currentProject.budget ? Math.round((currentProject.current_costs / currentProject.budget) * 100) : 0, 
        label: "Budget-Auslastung" 
      },
      children: (
        <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
          <Calculator size={16} />
          <span>€ {currentProject.current_costs.toLocaleString()} / € {(currentProject.budget || 0).toLocaleString()}</span>
        </div>
      )
    },
    {
      title: "Offering",
      description: "Angebotsmanagement & Vergleich",
      icon: <Handshake size={32} />,
      onClick: onOfferingClick,
      ariaLabel: "Angebotsmanagement öffnen",
      badge: { text: `${projectStats.newQuotes} neue`, color: "green" as const },
      children: (
        <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
          <BarChart3 size={16} />
          <span>KI-Analyse verfügbar</span>
        </div>
      )
    },
    {
      title: "Visualize",
      description: "Pläne, Fotos & Visualisierungen",
      icon: <Eye size={32} />,
      onClick: onVisualizeClick,
      ariaLabel: "Visualisierungen öffnen",
      children: (
        <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
          <Camera size={16} />
          <span>Site-Photos</span>
        </div>
      )
    },
    {
      title: "Roadmap",
      description: "Zeitliche Übersicht & Gantt-Diagramm",
      icon: <TrendingUp size={32} />,
      onClick: () => {
        if (projects.length > 0) {
          navigate(`/roadmap?project=${currentProject.id}`);
        } else {
          navigate('/roadmap');
        }
      },
      ariaLabel: "Roadmap und Zeitplanung öffnen",
      children: (
        <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
          <Calendar size={16} />
          <span>Gantt & Timeline</span>
        </div>
      )
    }
  ];

  const dashboardCards = getDashboardCards();

  // Loading-Zustand
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#51646f] via-[#3d4952] to-[#2c3539] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#ffbd59] mx-auto mb-4"></div>
          <p className="text-white text-lg">Lade Projekte...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#51646f] via-[#3d4952] to-[#2c3539] flex flex-col relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-[#ffbd59] rounded-full mix-blend-multiply filter blur-2xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-[#ffbd59] rounded-full mix-blend-multiply filter blur-2xl opacity-20 animate-pulse" style={{animationDelay: '2s'}}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[36rem] h-[36rem] bg-[#ffbd59] rounded-full mix-blend-multiply filter blur-2xl opacity-10 animate-pulse" style={{animationDelay: '4s'}}></div>
      </div>

      {/* Header */}
      <header className="sticky top-0 z-20 bg-gradient-to-r from-[#3d4952]/95 to-[#51646f]/95 backdrop-blur-lg text-white px-8 py-7 shadow-2xl border-b border-[#ffbd59]/20">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-20 h-20 flex items-center justify-center">
                <img src={logo} alt="BuildWise Logo" className="w-20 h-20 object-contain rounded-2xl shadow-lg bg-white/10 p-1" />
              </div>
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-green-400 to-green-500 rounded-full border-2 border-white animate-pulse"></div>
            </div>
            <div>
              <h1 className="text-3xl font-extrabold bg-gradient-to-r from-white to-[#ffbd59] bg-clip-text text-transparent tracking-tight">BuildWise</h1>
              <p className="text-base text-gray-300 flex items-center gap-2">
                <Sparkles size={16} className="text-[#ffbd59]" />
                Digitaler Bauassistent
              </p>
            </div>
          </div>
          {/* Online/Offline Status */}
          <div className={`flex items-center gap-3 px-5 py-2 rounded-full text-base font-medium backdrop-blur-md border ${isOnline ? 'bg-green-500/20 text-green-300 border-green-500/30' : 'bg-red-500/20 text-red-300 border-red-500/30'}`}>
            {isOnline ? <Wifi size={18} className="animate-pulse" /> : <WifiOff size={18} />}
            <span>{isOnline ? 'Online' : 'Offline'}</span>
          </div>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="bg-red-500/20 border border-red-500/30 text-red-300 px-6 py-4 flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <AlertTriangle size={20} />
              <span>{error}</span>
            </div>
            <button onClick={() => setError('')} className="text-red-300 hover:text-red-100">
              <span>×</span>
            </button>
          </div>
        )}

        {/* Swipeable Project Info */}
        <div 
          {...swipeHandlers}
          className={`relative mb-6 transition-all duration-300 ${isTransitioning ? 'opacity-75 scale-95' : 'opacity-100 scale-100'}`}
        >
          {/* Swipe-Indikatoren */}
          {projects.length > 1 && (
            <>
              <div className="absolute top-1/2 left-4 transform -translate-y-1/2 z-10">
                <button
                  onClick={() => handleSwipe('right')}
                  disabled={currentProjectIndex === 0}
                  className={`p-2 rounded-full backdrop-blur-md border transition-all duration-300 ${
                    currentProjectIndex === 0 
                      ? 'bg-gray-500/20 text-gray-500 border-gray-500/30 cursor-not-allowed' 
                      : 'bg-white/10 text-white border-white/20 hover:bg-white/20 hover:scale-110'
                  }`}
                  aria-label="Vorheriges Projekt"
                >
                  <ChevronLeft size={20} />
                </button>
              </div>
              
              <div className="absolute top-1/2 right-4 transform -translate-y-1/2 z-10">
                <button
                  onClick={() => handleSwipe('left')}
                  disabled={currentProjectIndex === projects.length - 1}
                  className={`p-2 rounded-full backdrop-blur-md border transition-all duration-300 ${
                    currentProjectIndex === projects.length - 1 
                      ? 'bg-gray-500/20 text-gray-500 border-gray-500/30 cursor-not-allowed' 
                      : 'bg-white/10 text-white border-white/20 hover:bg-white/20 hover:scale-110'
                  }`}
                  aria-label="Nächstes Projekt"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            </>
          )}

          {/* Project Info */}
          <div className="text-center px-16">
            <h2 className="text-3xl font-bold text-[#ffbd59] mb-2 flex items-center justify-center gap-3">
              <Zap size={28} className="animate-bounce" />
              Willkommen zurück
            </h2>
            
            {/* Projekt-Navigation-Indikatoren */}
            {projects.length > 1 && (
              <div className="flex justify-center gap-2 mb-4">
                {projects.map((_, index) => (
                  <div
                    key={index}
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${
                      index === currentProjectIndex 
                        ? 'bg-[#ffbd59] scale-125' 
                        : 'bg-gray-500/50'
                    }`}
                  />
                ))}
              </div>
            )}

            <div className="flex flex-wrap items-center justify-center gap-6 text-gray-300 mb-4">
              <div className="flex items-center gap-2">
                <Building size={16} className="text-[#ffbd59]" />
                <span>Projekt: <span className="font-semibold text-white">{currentProject.name}</span></span>
              </div>
              <div className="flex items-center gap-2">
                <Award size={16} className="text-[#ffbd59]" />
                <span>Phase: <span className="font-semibold text-white">{getPhaseLabel(currentProject.phase)}</span></span>
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPhaseColor(currentProject.phase)} text-white`}>
                  {getPhaseIcon(currentProject.phase)}
                </span>
              </div>
              {currentProject.address && (
                <div className="flex items-center gap-2">
                  <MapPin size={16} className="text-[#ffbd59]" />
                  <span>Standort: <span className="font-semibold text-white">{currentProject.address}</span></span>
                </div>
              )}
            </div>

            {/* Swipe-Hinweis */}
            {projects.length > 1 && (
              <div className="text-xs text-gray-400 mb-4 flex items-center justify-center gap-2">
                <span>← Swipe für andere Projekte →</span>
              </div>
            )}

            {/* Keine Projekte Hinweis */}
            {projects.length === 0 && (
              <div className="text-sm text-gray-400 mb-4 flex items-center justify-center gap-2">
                <span>Erstellen Sie Ihr erstes Projekt im Manager</span>
              </div>
            )}
          </div>

          {/* Progress Bar */}
          <div className="space-y-3">
            <div className="flex justify-between text-base">
              <span className="text-gray-300">Projektfortschritt</span>
              <span className="text-[#ffbd59] font-bold text-lg">{currentProject.progress_percentage}%</span>
            </div>
            <div className="relative w-full bg-gray-700/50 rounded-full h-5 backdrop-blur-sm border border-gray-600/30">
              <div 
                className="absolute inset-0 bg-gradient-to-r from-[#ffbd59] to-[#ffa726] h-5 rounded-full transition-all duration-1000 ease-out shadow-lg" 
                style={{ width: `${currentProject.progress_percentage}%` }} 
              />
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent h-5 rounded-full animate-pulse"></div>
            </div>
          </div>
        </div>
      </header>

      {/* Offline Banner */}
      {!isOnline && (
        <div className="relative bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-6 py-4 flex items-center justify-center gap-3 shadow-lg z-30">
          <AlertTriangle size={20} className="animate-pulse" />
          <span className="font-medium">Offline-Modus: Änderungen werden synchronisiert, sobald Sie wieder online sind</span>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 p-8 relative z-10">
        <div className="max-w-7xl mx-auto">
          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            <div className="group bg-white/10 backdrop-blur-lg rounded-2xl p-7 shadow-xl border border-white/20 hover:bg-white/15 transition-all duration-300 transform hover:-translate-y-2">
              <div className="flex items-center">
                <div className="p-4 bg-gradient-to-br from-green-400 to-green-600 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <Users className="w-7 h-7 text-white" />
                </div>
                <div className="ml-5">
                  <p className="text-base font-medium text-gray-300">Aktive Gewerke</p>
                  <p className="text-3xl font-bold text-white">{projectStats.activeTrades}</p>
                </div>
              </div>
            </div>
            <div className="group bg-white/10 backdrop-blur-lg rounded-2xl p-7 shadow-xl border border-white/20 hover:bg-white/15 transition-all duration-300 transform hover:-translate-y-2">
              <div className="flex items-center">
                <div className="p-4 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <Clock className="w-7 h-7 text-white" />
                </div>
                <div className="ml-5">
                  <p className="text-base font-medium text-gray-300">Offene Aufgaben</p>
                  <p className="text-3xl font-bold text-white">{projectStats.openTasks}</p>
                </div>
              </div>
            </div>
            <div className="group bg-white/10 backdrop-blur-lg rounded-2xl p-7 shadow-xl border border-white/20 hover:bg-white/15 transition-all duration-300 transform hover:-translate-y-2">
              <div className="flex items-center">
                <div className="p-4 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <AlertTriangle className="w-7 h-7 text-white" />
                </div>
                <div className="ml-5">
                  <p className="text-base font-medium text-gray-300">Benachrichtigungen</p>
                  <p className="text-3xl font-bold text-white">{projectStats.notifications}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Main Dashboard Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
            {dashboardCards.map((card, index) => (
              <div key={index} className="transform hover:scale-105 transition-all duration-300">
                <DashboardCard
                  title={card.title}
                  icon={card.icon}
                  onClick={card.onClick}
                  ariaLabel={card.ariaLabel}
                  status={card.status}
                  badge={card.badge}
                  progress={card.progress}
                >
                  {card.children}
                </DashboardCard>
              </div>
            ))}
          </div>

          {/* Recent Activity Section */}
          <div className="mt-16 bg-white/10 backdrop-blur-lg rounded-3xl p-10 shadow-2xl border border-white/20">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
              <Clock size={24} className="text-[#ffbd59]" />
              Letzte Aktivitäten - {currentProject.name}
            </h2>
            <div className="space-y-4">
              <div className="flex items-center p-4 bg-white/5 rounded-xl backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-all duration-300">
                <div className="w-3 h-3 bg-gradient-to-r from-green-400 to-green-600 rounded-full mr-4 animate-pulse"></div>
                <span className="text-sm text-gray-200">Neues Angebot für Projekt "{currentProject.name}" erhalten</span>
                <span className="ml-auto text-xs text-gray-400">{projectStats.lastActivity}</span>
              </div>
              <div className="flex items-center p-4 bg-white/5 rounded-xl backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-all duration-300">
                <div className="w-3 h-3 bg-gradient-to-r from-blue-400 to-blue-600 rounded-full mr-4 animate-pulse" style={{animationDelay: '1s'}}></div>
                <span className="text-sm text-gray-200">Dokument "Bauantrag.pdf" hochgeladen</span>
                <span className="ml-auto text-xs text-gray-400">vor 4 Stunden</span>
              </div>
              <div className="flex items-center p-4 bg-white/5 rounded-xl backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-all duration-300">
                <div className="w-3 h-3 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full mr-4 animate-pulse" style={{animationDelay: '2s'}}></div>
                <span className="text-sm text-gray-200">Aufgabe "Elektroinstallation planen" erstellt</span>
                <span className="ml-auto text-xs text-gray-400">vor 1 Tag</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer Navigation */}
      <footer className="relative bg-gradient-to-r from-[#3d4952]/95 to-[#51646f]/95 backdrop-blur-lg text-white px-8 py-7 border-t border-[#ffbd59]/20 mt-10">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <button 
            onClick={() => navigate(-1)}
            className="flex items-center gap-3 px-7 py-3 bg-gradient-to-r from-[#51646f] to-[#607583] text-[#ffbd59] rounded-xl hover:from-[#607583] hover:to-[#6b7a8a] transition-all duration-300 transform hover:scale-105 shadow-lg border border-[#ffbd59]/20 font-semibold text-lg"
            aria-label="Zurück zur vorherigen Seite"
          >
            <span>← Zurück</span>
          </button>
          <div className="flex items-center gap-6 text-base text-gray-300">
            <span className="font-semibold">BuildWise v1.0</span>
            <span className="text-[#ffbd59]">•</span>
            <span>© 2025</span>
          </div>
        </div>
      </footer>
    </div>
  );
} 