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
  ClipboardList,
  Calculator,
  Sparkles,
  Zap,
  Target,
  Award,
  ChevronLeft,
  ChevronRight,
  Building,
  MapPin,
  Plus,
  Settings
} from 'lucide-react';
import logo from '../logo_bw.png';
import { useAuth } from '../context/AuthContext';

// Interface für echte Projekte aus der API
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
  const { user, isServiceProvider } = useAuth();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [currentProjectIndex, setCurrentProjectIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateProjectModal, setShowCreateProjectModal] = useState(false);
  const [newProjectData, setNewProjectData] = useState({
    name: '',
    description: '',
    project_type: 'new_build',
    address: '',
    budget: 0,
    is_public: true,
    allow_quotes: true
  });

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

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError("");
      // API-Call zum Backend
      const created = await import('../api/projectService').then(m => m.createProject({
        name: newProjectData.name,
        description: newProjectData.description,
        project_type: newProjectData.project_type, // jetzt immer klein
        status: 'planning', // Enum-Wert klein!
        budget: newProjectData.budget,
        address: newProjectData.address,
        is_public: newProjectData.is_public,
        allow_quotes: newProjectData.allow_quotes,
      }));
      // Nach erfolgreichem Anlegen: Projekte neu laden
      await loadProjects();
      setShowCreateProjectModal(false);
      setNewProjectData({
        name: '',
        description: '',
        project_type: 'new_build',
        address: '',
        budget: 0,
        is_public: true,
        allow_quotes: true
      });
    } catch (error: any) {
      setError('Fehler beim Erstellen des Projekts');
    } finally {
      setLoading(false);
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
  const getDashboardCards = () => {
    const baseCards = [
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
        title: "Gewerke",
        description: "Gewerkeverwaltung & Ausschreibungen",
        icon: <Handshake size={32} />,
        onClick: onOfferingClick,
        ariaLabel: "Gewerkeverwaltung öffnen",
        badge: { text: `${projectStats.newQuotes} neue`, color: "green" as const },
        children: (
          <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
            <BarChart3 size={16} />
            <span>Ausschreibungen verfügbar</span>
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
    // Entferne die "Projekt anlegen"-Kachel komplett
    return baseCards;
  };

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
                <img src={logo} alt="BuildWise Logo" className="w-20 h-20 object-contain rounded-2xl shadow-lg" />
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
          
          {/* Header Actions */}
          <div className="flex items-center gap-3">
            {/* Online/Offline Status */}
            <div className={`flex items-center gap-3 px-5 py-2 rounded-full text-base font-medium backdrop-blur-md border ${isOnline ? 'bg-green-500/20 text-green-300 border-green-500/30' : 'bg-red-500/20 text-red-300 border-red-500/30'}`}>
              {isOnline ? <Wifi size={18} className="animate-pulse" /> : <WifiOff size={18} />}
              <span>{isOnline ? 'Online' : 'Offline'}</span>
            </div>
            {/* Projekt anlegen Button (immer oben rechts, auch wenn keine Projekte existieren) */}
            <button
              onClick={() => setShowCreateProjectModal(true)}
              className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-[#ffbd59] to-[#ffa726] text-[#3d4952] rounded-md font-semibold hover:from-[#ffa726] hover:to-[#ff9800] transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105 text-sm"
            >
              <Plus size={16} />
              <span>Projekt anlegen</span>
            </button>
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
        {projects.length > 0 ? (
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

            {/* Project Info Card */}
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 hover:border-[#ffbd59]/30 transition-all duration-300">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-white mb-2">{currentProject.name}</h2>
                  <p className="text-gray-300 text-sm mb-3">{currentProject.description}</p>
                  <div className="flex flex-wrap gap-3 text-xs">
                    <span className={`px-3 py-1 rounded-full ${getStatusColor(currentProject.status)}`}>
                      {getStatusLabel(currentProject.status)}
                    </span>
                    <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                      {getProjectTypeLabel(currentProject.project_type)}
                    </span>
                    {currentProject.address && (
                      <span className="px-3 py-1 rounded-full bg-gray-500/20 text-gray-300 border border-gray-500/30">
                        📍 {currentProject.address}
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-[#ffbd59] mb-1">
                    {currentProject.progress_percentage}%
                  </div>
                  <div className="text-sm text-gray-400">Fortschritt</div>
                </div>
              </div>
              
              {/* Progress Bar */}
              <div className="w-full bg-gray-700/50 rounded-full h-3 mb-4">
                <div 
                  className="bg-gradient-to-r from-[#ffbd59] to-[#ffa726] h-3 rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${currentProject.progress_percentage}%` }}
                />
              </div>
              
              {/* Project Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="text-center">
                  <div className="text-white font-semibold">{projectStats.activeTrades}</div>
                  <div className="text-gray-400">Gewerke</div>
                </div>
                <div className="text-center">
                  <div className="text-white font-semibold">{projectStats.openTasks}</div>
                  <div className="text-gray-400">Aufgaben</div>
                </div>
                <div className="text-center">
                  <div className="text-white font-semibold">{projectStats.newDocuments}</div>
                  <div className="text-gray-400">Dokumente</div>
                </div>
                <div className="text-center">
                  <div className="text-white font-semibold">{projectStats.newQuotes}</div>
                  <div className="text-gray-400">Angebote</div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* No Projects State */
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 mb-6 text-center">
            <Building size={64} className="text-[#ffbd59] mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Willkommen bei BuildWise!</h2>
            <p className="text-gray-300 mb-6">Erstellen Sie Ihr erstes Bauprojekt, um loszulegen.</p>
            <button
              onClick={() => setShowCreateProjectModal(true)}
              className="flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-[#ffbd59] to-[#ffa726] text-[#3d4952] rounded-lg font-semibold hover:from-[#ffa726] hover:to-[#ff9800] transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 mx-auto"
            >
              <Plus size={20} />
              <span>Erstes Projekt anlegen</span>
            </button>
          </div>
        )}
      </header>

      {/* Offline Banner */}
      {!isOnline && (
        <div className="relative bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-6 py-4 flex items-center justify-center gap-3 shadow-lg z-30">
          <AlertTriangle size={20} className="animate-pulse" />
          <span className="font-medium">Offline-Modus: Änderungen werden synchronisiert, sobald Sie wieder online sind</span>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {dashboardCards.map((card, index) => (
            <DashboardCard key={index} {...card} />
          ))}
        </div>
      </main>

      {/* Create Project Modal */}
      {showCreateProjectModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
            <h2 className="text-2xl font-bold text-[#3d4952] mb-6 flex items-center gap-3">
              <Plus size={24} className="text-[#ffbd59]" />
              Neues Projekt anlegen
            </h2>
            
            <form onSubmit={handleCreateProject} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Projektname *
                </label>
                <input
                  type="text"
                  required
                  value={newProjectData.name}
                  onChange={(e) => setNewProjectData({...newProjectData, name: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent"
                  placeholder="z.B. Einfamilienhaus Musterstraße"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Beschreibung
                </label>
                <textarea
                  value={newProjectData.description}
                  onChange={(e) => setNewProjectData({...newProjectData, description: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent"
                  rows={3}
                  placeholder="Beschreibung des Bauprojekts..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Projekttyp *
                </label>
                <select
                  required
                  value={newProjectData.project_type}
                  onChange={(e) => setNewProjectData({...newProjectData, project_type: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent"
                >
                  <option value="new_build">Neubau</option>
                  <option value="renovation">Renovierung</option>
                  <option value="extension">Anbau</option>
                  <option value="refurbishment">Sanierung</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Adresse
                </label>
                <input
                  type="text"
                  value={newProjectData.address}
                  onChange={(e) => setNewProjectData({...newProjectData, address: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent"
                  placeholder="Musterstraße 123, 12345 Musterstadt"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Budget (€)
                </label>
                <input
                  type="number"
                  value={newProjectData.budget}
                  onChange={(e) => setNewProjectData({...newProjectData, budget: parseInt(e.target.value) || 0})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent"
                  placeholder="300000"
                />
              </div>
              
              <div className="flex items-center gap-4 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-[#ffbd59] to-[#ffa726] text-[#3d4952] py-3 px-6 rounded-lg font-semibold hover:from-[#ffa726] hover:to-[#ff9800] transition-all duration-300"
                >
                  Projekt erstellen
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateProjectModal(false)}
                  className="flex-1 bg-gray-300 text-gray-700 py-3 px-6 rounded-lg font-semibold hover:bg-gray-400 transition-all duration-300"
                >
                  Abbrechen
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
} 