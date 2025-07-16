import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  MessageCircle, 
  Handshake, 
  Users, 
  BarChart3, 
  User, 
  FileText, 
  Euro, 
  Sparkles
} from 'lucide-react';
import DashboardCard from '../components/DashboardCard';
import logo from '../logo_trans_big.png';

export default function ServiceProviderDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Mock-Statistiken für Dienstleister (optional, kann entfernt werden)
  const projectStats = {
    activeTrades: 12,
    newDocuments: 3,
    openTasks: 8,
    newQuotes: 5
  };

  // Dienstleister-Dashboard-Karten (reduzierte Oberfläche)
  const getDashboardCards = () => [
    {
      title: "Messenger",
      description: "Kommunikation mit Bauträgern",
      icon: <MessageCircle size={32} />,
      onClick: () => navigate('/messages'),
      ariaLabel: "Messenger öffnen",
      status: 'online' as 'online',
      badge: { text: '3 neue', color: "blue" as const },
      cardId: "messenger",
      path: "/messages",
      iconString: "<MessageCircle size={16} />",
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
      onClick: () => navigate('/quotes'),
      ariaLabel: "Gewerke und Ausschreibungen öffnen",
      badge: { text: `${projectStats.newQuotes} neue`, color: "green" as const },
      cardId: "service-quotes",
      path: "/quotes",
      iconString: "<Handshake size={16} />",
      children: (
        <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
          <BarChart3 size={16} />
          <span>Angebote abgeben</span>
        </div>
      )
    },

  ];

  const dashboardCards = getDashboardCards();

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
          {/* Online/Offline Status (optional, immer online) */}
          <div className={`flex items-center gap-3 px-5 py-2 rounded-full text-base font-medium backdrop-blur-md border bg-green-500/20 text-green-300 border-green-500/30`}>
            Online
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
                cardId={card.cardId}
                path={card.path}
                iconString={card.iconString}
              >
                {card.children}
              </DashboardCard>
            ))}
          </div>

          {/* Willkommensbox */}
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