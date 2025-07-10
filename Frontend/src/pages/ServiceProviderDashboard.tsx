import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  MessageCircle, 
  Handshake, 
  Building, 
  Users, 
  Upload, 
  BarChart3, 
  Clock, 
  Calculator, 
  Eye, 
  Camera, 
  TrendingUp, 
  Calendar, 
  Sparkles, 
  Wifi, 
  WifiOff, 
  AlertTriangle, 
  ChevronLeft, 
  ChevronRight,
  User,
  FileText,
  Euro
} from 'lucide-react';
import DashboardCard from '../components/DashboardCard';
import logo from '../logo_trans_big.png';

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

interface ProjectStats {
  activeTrades: number;
  newDocuments: number;
  openTasks: number;
  newQuotes: number;
}

export default function ServiceProviderDashboard() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProjectIndex, setCurrentProjectIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isOnline, setIsOnline] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  const currentProject = projects[currentProjectIndex] || {
    id: 0,
    name: 'Kein Projekt',
    description: '',
    project_type: '',
    status: '',
    progress_percentage: 0,
    budget: 0,
    current_costs: 0,
    is_public: false,
    allow_quotes: false,
    created_at: '',
    updated_at: ''
  };

  // Mock-Statistiken für Dienstleister
  const projectStats: ProjectStats = {
    activeTrades: 12,
    newDocuments: 3,
    openTasks: 8,
    newQuotes: 5
  };

  useEffect(() => {
    loadProjects();
    
    // Online/Offline Status überwachen
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const loadProjects = async () => {
    try {
      setLoading(true);
      // Hier würde normalerweise die API aufgerufen werden
      // Für den Test verwenden wir Mock-Daten
      const mockProjects: Project[] = [
        {
          id: 1,
          name: "Wohnhaus Bauprojekt",
          description: "Modernes Einfamilienhaus mit Garten",
          project_type: "residential",
          status: "active",
          progress_percentage: 65,
          budget: 450000,
          current_costs: 292500,
          start_date: "2024-01-15",
          end_date: "2024-12-31",
          address: "Musterstraße 123, 12345 Musterstadt",
          property_size: 800,
          construction_area: 180,
          estimated_duration: 12,
          is_public: true,
          allow_quotes: true,
          created_at: "2024-01-01T00:00:00",
          updated_at: "2024-01-01T00:00:00"
        }
      ];
      
      setProjects(mockProjects);
      setCurrentProjectIndex(0);
    } catch (err: any) {
      console.error('Error loading projects:', err);
      setError('Fehler beim Laden der Projekte');
    } finally {
      setLoading(false);
    }
  };

  const handleSwipe = (direction: 'left' | 'right') => {
    if (projects.length <= 1) return;
    
    setIsTransitioning(true);
    
    setTimeout(() => {
      if (direction === 'left') {
        setCurrentProjectIndex(prev => 
          prev === projects.length - 1 ? 0 : prev + 1
        );
      } else {
        setCurrentProjectIndex(prev => 
          prev === 0 ? projects.length - 1 : prev - 1
        );
      }
      setIsTransitioning(false);
    }, 150);
  };

  // Dienstleister-spezifische Click-Handler
  const onMessagesClick = () => {
    navigate('/messages');
  };

  const onTradesClick = () => {
    navigate('/quotes');
  };

  const getProjectTypeLabel = (type: string) => {
    switch (type) {
      case 'residential': return 'Wohnbau';
      case 'commercial': return 'Gewerbebau';
      case 'industrial': return 'Industriebau';
      case 'infrastructure': return 'Infrastruktur';
      default: return type;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return 'Aktiv';
      case 'completed': return 'Abgeschlossen';
      case 'on_hold': return 'Pausiert';
      case 'cancelled': return 'Abgebrochen';
      default: return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'completed': return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'on_hold': return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      case 'cancelled': return 'bg-red-500/20 text-red-300 border-red-500/30';
      default: return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  };

  // Dienstleister-Dashboard-Karten (reduzierte Oberfläche)
  const getDashboardCards = () => [
    {
      title: "Messenger",
      description: "Kommunikation mit Bauträgern",
      icon: <MessageCircle size={32} />,
      onClick: onMessagesClick,
      ariaLabel: "Messenger öffnen",
      status: (isOnline ? 'online' : 'offline') as 'online' | 'offline',
      badge: { text: '3 neue', color: "blue" as const },
      children: (
        <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
          <Users size={16} />
          <span>Direkte Kommunikation</span>
        </div>
      )
    },
    {
      title: "Gewerke",
      description: "Ausschreibungen & Angebote",
      icon: <Handshake size={32} />,
      onClick: onTradesClick,
      ariaLabel: "Gewerke und Ausschreibungen öffnen",
      badge: { text: `${projectStats.newQuotes} neue`, color: "green" as const },
      children: (
        <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
          <BarChart3 size={16} />
          <span>Angebote abgeben</span>
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
                <img src={logo} alt="BuildWise Logo" className="w-20 h-20 object-contain rounded-2xl shadow-lg" />
              </div>
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-green-400 to-green-500 rounded-full border-2 border-white animate-pulse"></div>
            </div>
            <div>
              <h1 className="text-3xl font-extrabold bg-gradient-to-r from-white to-[#ffbd59] bg-clip-text text-transparent tracking-tight">BuildWise</h1>
              <p className="text-base text-gray-300 flex items-center gap-2">
                <Sparkles size={16} className="text-[#ffbd59]" />
                Dienstleister-Portal
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

        {/* Projekt-Info für Dienstleister */}
        <div className="relative mb-6">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Building size={24} className="text-[#ffbd59]" />
                <div>
                  <h2 className="text-xl font-bold text-white">{currentProject.name}</h2>
                  <p className="text-gray-300 text-sm">{currentProject.description}</p>
                </div>
              </div>
              <div className="text-right">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(currentProject.status)}`}>
                  {getStatusLabel(currentProject.status)}
                </span>
                <p className="text-gray-300 text-sm mt-1">
                  {getProjectTypeLabel(currentProject.project_type)}
                </p>
              </div>
            </div>
            
            {/* Dienstleister-spezifische Informationen */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="text-center">
                <div className="text-[#ffbd59] font-bold text-lg">{projectStats.newQuotes}</div>
                <div className="text-gray-300">Neue Ausschreibungen</div>
              </div>
              <div className="text-center">
                <div className="text-[#ffbd59] font-bold text-lg">{projectStats.activeTrades}</div>
                <div className="text-gray-300">Aktive Gewerke</div>
              </div>
              <div className="text-center">
                <div className="text-[#ffbd59] font-bold text-lg">3</div>
                <div className="text-gray-300">Neue Nachrichten</div>
              </div>
              <div className="text-center">
                <div className="text-[#ffbd59] font-bold text-lg">5</div>
                <div className="text-gray-300">Ihre Angebote</div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-8 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Dashboard-Karten */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            {dashboardCards.map((card, index) => (
              <DashboardCard
                key={index}
                title={card.title}
                icon={card.icon}
                onClick={card.onClick}
                ariaLabel={card.ariaLabel}
                status={card.status}
                badge={card.badge}
              >
                {card.children}
              </DashboardCard>
            ))}
          </div>

          {/* Dienstleister-spezifische Informationen */}
          <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <User size={24} className="text-[#ffbd59]" />
              Willkommen im Dienstleister-Portal
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-gray-300">
              <div>
                <h4 className="font-semibold text-white mb-2">Ihre Möglichkeiten:</h4>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <MessageCircle size={16} className="text-[#ffbd59]" />
                    Direkte Kommunikation mit Bauträgern
                  </li>
                  <li className="flex items-center gap-2">
                    <Handshake size={16} className="text-[#ffbd59]" />
                    Auf Ausschreibungen bewerben
                  </li>
                  <li className="flex items-center gap-2">
                    <FileText size={16} className="text-[#ffbd59]" />
                    Angebote mit PDF-Upload erstellen
                  </li>
                  <li className="flex items-center gap-2">
                    <Euro size={16} className="text-[#ffbd59]" />
                    Preise und Konditionen angeben
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-white mb-2">Aktuelle Statistiken:</h4>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span>Neue Ausschreibungen:</span>
                    <span className="text-[#ffbd59] font-bold">{projectStats.newQuotes}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Ihre Angebote:</span>
                    <span className="text-[#ffbd59] font-bold">5</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Angebote angenommen:</span>
                    <span className="text-[#ffbd59] font-bold">2</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Neue Nachrichten:</span>
                    <span className="text-[#ffbd59] font-bold">3</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
} 