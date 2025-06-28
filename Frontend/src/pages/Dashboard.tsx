import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardCard from '../components/DashboardCard';
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
  Award
} from 'lucide-react';

export default function Dashboard() {
  const navigate = useNavigate();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [currentProject] = useState({
    name: "Hausbau München",
    phase: "Ausführung",
    progress: 65
  });

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

  // Callback-Handler für alle Kacheln
  const onManagerClick = () => navigate('/projects');
  const onDocsClick = () => navigate('/documents');
  const onTodoClick = () => navigate('/tasks');
  const onFinanceClick = () => navigate('/finance');
  const onOfferingClick = () => navigate('/quotes');
  const onVisualizeClick = () => navigate('/visualize');

  const dashboardCards = [
    {
      title: "Manager",
      description: "Projekt- und Gewerkverwaltung",
      icon: <Home size={32} />,
      onClick: onManagerClick,
      ariaLabel: "Projekt- und Gewerkverwaltung öffnen",
      status: (isOnline ? 'online' : 'offline') as 'online' | 'offline',
      progress: { value: 75, label: "Projektfortschritt" },
      children: (
        <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
          <Users size={16} />
          <span>3 aktive Gewerke</span>
        </div>
      )
    },
    {
      title: "Docs",
      description: "Dokumentenmanagement & Uploads",
      icon: <FileText size={32} />,
      onClick: onDocsClick,
      ariaLabel: "Dokumentenmanagement öffnen",
      badge: { text: "12 neue", color: "blue" as const },
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
      badge: { text: "5 offen", color: "yellow" as const },
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
      progress: { value: 45, label: "Budget-Auslastung" },
      children: (
        <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
          <Calculator size={16} />
          <span>€ 125.000 / € 280.000</span>
        </div>
      )
    },
    {
      title: "Offering",
      description: "Angebotsmanagement & Vergleich",
      icon: <Handshake size={32} />,
      onClick: onOfferingClick,
      ariaLabel: "Angebotsmanagement öffnen",
      badge: { text: "3 neue", color: "green" as const },
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
    }
  ];

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
              <div className="w-14 h-14 bg-gradient-to-br from-[#ffbd59] to-[#ffa726] rounded-2xl flex items-center justify-center shadow-lg transform hover:scale-110 transition-transform duration-300">
                <Home size={28} className="text-[#3d4952] drop-shadow-sm" />
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
          <div className={`flex items-center gap-3 px-5 py-2 rounded-full text-base font-medium backdrop-blur-md border ${isOnline ? 'bg-green-500/20 text-green-300 border-green-500/30' : 'bg-red-500/20 text-red-300 border-red-500/30'}`}> {isOnline ? <Wifi size={18} className="animate-pulse" /> : <WifiOff size={18} />} <span>{isOnline ? 'Online' : 'Offline'}</span></div>
        </div>
        {/* Project Info */}
        <div className="mb-6">
          <h2 className="text-3xl font-bold text-[#ffbd59] mb-2 flex items-center gap-3">
            <Zap size={28} className="animate-bounce" />
            Willkommen zurück
          </h2>
          <div className="flex flex-wrap items-center gap-6 text-gray-300">
            <div className="flex items-center gap-2">
              <Target size={16} className="text-[#ffbd59]" />
              <span>Projekt: <span className="font-semibold text-white">{currentProject.name}</span></span>
            </div>
            <div className="flex items-center gap-2">
              <Award size={16} className="text-[#ffbd59]" />
              <span>Phase: <span className="text-[#ffbd59] font-semibold">{currentProject.phase}</span></span>
            </div>
          </div>
        </div>
        {/* Progress Bar */}
        <div className="space-y-3">
          <div className="flex justify-between text-base">
            <span className="text-gray-300">Projektfortschritt</span>
            <span className="text-[#ffbd59] font-bold text-lg">{currentProject.progress}%</span>
          </div>
          <div className="relative w-full bg-gray-700/50 rounded-full h-5 backdrop-blur-sm border border-gray-600/30">
            <div className="absolute inset-0 bg-gradient-to-r from-[#ffbd59] to-[#ffa726] h-5 rounded-full transition-all duration-1000 ease-out shadow-lg" style={{ width: `${currentProject.progress}%` }} />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent h-5 rounded-full animate-pulse"></div>
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
                  <TrendingUp className="w-7 h-7 text-white" />
                </div>
                <div className="ml-5">
                  <p className="text-base font-medium text-gray-300">Aktive Projekte</p>
                  <p className="text-3xl font-bold text-white">3</p>
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
                  <p className="text-3xl font-bold text-white">12</p>
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
                  <p className="text-3xl font-bold text-white">5</p>
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
              Letzte Aktivitäten
            </h2>
            <div className="space-y-4">
              <div className="flex items-center p-4 bg-white/5 rounded-xl backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-all duration-300">
                <div className="w-3 h-3 bg-gradient-to-r from-green-400 to-green-600 rounded-full mr-4 animate-pulse"></div>
                <span className="text-sm text-gray-200">Neues Angebot für Projekt "Hausbau München" erhalten</span>
                <span className="ml-auto text-xs text-gray-400">vor 2 Stunden</span>
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