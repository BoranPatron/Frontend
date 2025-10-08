import React, { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSwipeable } from 'react-swipeable';
import { 
  Users, CheckSquare, FileText, MessageSquare, 
  Edit, Eye, ChevronLeft, ChevronRight,
  Plus, Settings, Bell, Search
} from 'lucide-react';

// Mobile-optimierte Komponenten
const MobileQuickStats = memo(({ 
  projectStats, 
  projects, 
  onNavigate 
}: {
  projectStats: any;
  projects: any[];
  onNavigate: (path: string) => void;
}) => {
  const stats = useMemo(() => [
    {
      icon: Users,
      count: projectStats.activeTrades,
      label: 'Aktiv',
      color: 'text-[#ffbd59]',
      onClick: () => {
        const tradesSection = document.querySelector('[data-section="trades"]');
        tradesSection?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    },
    {
      icon: CheckSquare,
      count: projectStats.openTasks,
      label: 'Aufgaben',
      color: 'text-green-400',
      onClick: () => {
        const todoSection = document.querySelector('[data-section="todos"]');
        todoSection?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    },
    {
      icon: FileText,
      count: projectStats.documentsTotal,
      label: 'Docs',
      color: 'text-blue-400',
      onClick: () => onNavigate('/documents')
    },
    {
      icon: MessageSquare,
      count: projectStats.newQuotes,
      label: 'Angebote',
      color: 'text-purple-400',
      onClick: () => onNavigate('/quotes')
    }
  ], [projectStats, onNavigate]);

  return (
    <div className="sticky top-0 z-40 bg-gradient-to-br from-[#1a1a2e]/95 via-[#16213e]/95 to-[#0f3460]/95 backdrop-blur-lg border-b border-white/10 mb-4 -mx-4 px-4 py-3">
      <div className="grid grid-cols-4 gap-2">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          const isDisabled = projects.length === 0;
          
          return (
            <button
              key={index}
              onClick={isDisabled ? undefined : stat.onClick}
              disabled={isDisabled}
              className={`
                mobile-touch-target mobile-card p-3 rounded-xl border transition-all duration-200
                ${isDisabled 
                  ? 'bg-white/5 border-gray-600/30 opacity-50 cursor-not-allowed' 
                  : 'bg-white/10 border-[#ffbd59]/30 hover:border-[#ffbd59]/60 hover:bg-white/15 active:scale-95'
                }
              `}
              style={{ touchAction: 'manipulation' }}
            >
              <div className="flex flex-col items-center space-y-1">
                <Icon 
                  size={20} 
                  className={`${stat.color} ${!isDisabled ? 'transition-transform duration-200' : ''}`} 
                />
                <span className="text-lg font-bold text-white">{stat.count}</span>
                <span className="text-xs text-gray-300 text-center leading-tight">{stat.label}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
});

const MobileProjectCarousel = memo(({ 
  projects, 
  selectedProjectIndex, 
  onProjectChange,
  onEditProject,
  onProjectDetails 
}: {
  projects: any[];
  selectedProjectIndex: number;
  onProjectChange: (index: number) => void;
  onEditProject: () => void;
  onProjectDetails: () => void;
}) => {
  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => {
      if (selectedProjectIndex < projects.length - 1) {
        onProjectChange(selectedProjectIndex + 1);
      }
    },
    onSwipedRight: () => {
      if (selectedProjectIndex > 0) {
        onProjectChange(selectedProjectIndex - 1);
      }
    },
    trackMouse: false,
    delta: 50,
    swipeDuration: 300,
    preventScrollOnSwipe: true
  });

  const currentProject = projects[selectedProjectIndex];

  return (
    <div 
      {...swipeHandlers}
      className="mobile-card bg-white/10 backdrop-blur-lg rounded-2xl p-4 border border-white/20 mb-4"
    >
      {/* Projekt-Indikatoren */}
      <div className="flex justify-center mb-4">
        <div className="flex items-center gap-2">
          {projects.map((_, index) => (
            <button
              key={index}
              onClick={() => onProjectChange(index)}
              className={`
                transition-all duration-200 rounded-full
                ${index === selectedProjectIndex
                  ? 'w-3 h-3 bg-[#ffbd59] shadow-lg shadow-[#ffbd59]/50'
                  : 'w-2 h-2 bg-white/30 hover:bg-white/50'
                }
              `}
              style={{ touchAction: 'manipulation' }}
            />
          ))}
        </div>
      </div>

      {/* Projekt-Header */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xl font-bold text-white truncate flex-1 mr-3">
          {currentProject?.name}
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={onEditProject}
            className="mobile-touch-target p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
            style={{ touchAction: 'manipulation' }}
          >
            <Edit size={16} />
          </button>
          <button
            onClick={onProjectDetails}
            className="mobile-touch-target px-3 py-2 rounded-lg bg-[#ffbd59] text-[#2c3539] font-medium hover:bg-[#ffa726] transition-colors"
            style={{ touchAction: 'manipulation' }}
          >
            <Eye size={16} />
          </button>
        </div>
      </div>

      {/* Projekt-Metadaten */}
      <div className="space-y-2">
        {currentProject?.start_date && (
          <div className="flex items-center gap-2 text-sm">
            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
            <span className="text-green-300">Start:</span>
            <span className="text-white font-medium">
              {new Date(currentProject.start_date).toLocaleDateString('de-DE')}
            </span>
          </div>
        )}
        {currentProject?.end_date && (
          <div className="flex items-center gap-2 text-sm">
            <div className="w-2 h-2 bg-red-400 rounded-full"></div>
            <span className="text-red-300">Ende:</span>
            <span className="text-white font-medium">
              {new Date(currentProject.end_date).toLocaleDateString('de-DE')}
            </span>
          </div>
        )}
      </div>

      {/* Swipe-Hinweis */}
      <div className="text-center mt-3">
        <span className="text-xs text-gray-400">
          ← Wischen zum Wechseln →
        </span>
      </div>
    </div>
  );
});

const MobileTradesSection = memo(({ 
  trades, 
  title, 
  color, 
  count, 
  onTradeClick,
  onAcceptQuote,
  onRejectQuote 
}: {
  trades: any[];
  title: string;
  color: string;
  count: number;
  onTradeClick: (trade: any) => void;
  onAcceptQuote: (quoteId: number) => Promise<void>;
  onRejectQuote: (quoteId: number, reason: string) => Promise<void>;
}) => {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-white flex items-center gap-2">
          <div className={`w-2 h-2 ${color} rounded-full animate-pulse`}></div>
          <span className="hidden sm:inline">{title}</span>
          <span className="sm:hidden">{title.split(' ')[0]}</span>
          <span className="text-xs text-gray-400 bg-white/10 px-2 py-1 rounded-full">
            {count}
          </span>
        </h3>
      </div>
      
      <div className="mobile-card bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 overflow-hidden">
        <div className="mobile-spacing p-4 space-y-3">
          {trades.length === 0 ? (
            <div className="text-center py-6">
              <div className="w-12 h-12 bg-gray-600/30 rounded-full flex items-center justify-center mx-auto mb-3">
                <CheckSquare size={24} className="text-gray-400" />
              </div>
              <p className="text-gray-400 text-sm">Keine Einträge</p>
            </div>
          ) : (
            <div className="space-y-2">
              {trades.slice(0, 3).map((trade) => (
                <button
                  key={trade.id}
                  onClick={() => onTradeClick(trade)}
                  className="w-full text-left mobile-touch-target p-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[#ffbd59]/30 transition-all duration-200"
                  style={{ touchAction: 'manipulation' }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-white truncate">
                        {trade.title || trade.name}
                      </h4>
                      <p className="text-xs text-gray-400 mt-1">
                        {trade.description?.substring(0, 50)}...
                      </p>
                    </div>
                    <ChevronRight size={16} className="text-gray-400 flex-shrink-0 ml-2" />
                  </div>
                </button>
              ))}
              {trades.length > 3 && (
                <div className="text-center pt-2">
                  <span className="text-xs text-gray-400">
                    +{trades.length - 3} weitere
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

const MobileFloatingActionButton = memo(({ 
  onCreateProject, 
  onCreateTrade 
}: {
  onCreateProject: () => void;
  onCreateTrade: () => void;
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <div className={`flex flex-col items-end space-y-3 transition-all duration-300 ${
        isExpanded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
      }`}>
        <button
          onClick={onCreateTrade}
          className="mobile-touch-target flex items-center gap-2 px-4 py-3 bg-[#ffbd59] text-[#2c3539] rounded-full font-medium shadow-lg hover:bg-[#ffa726] transition-colors"
          style={{ touchAction: 'manipulation' }}
        >
          <Plus size={20} />
          <span className="text-sm">Gewerk</span>
        </button>
        <button
          onClick={onCreateProject}
          className="mobile-touch-target flex items-center gap-2 px-4 py-3 bg-blue-500 text-white rounded-full font-medium shadow-lg hover:bg-blue-600 transition-colors"
          style={{ touchAction: 'manipulation' }}
        >
          <Plus size={20} />
          <span className="text-sm">Projekt</span>
        </button>
      </div>
      
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="mobile-touch-target w-14 h-14 bg-gradient-to-r from-[#ffbd59] to-[#ffa726] text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center"
        style={{ touchAction: 'manipulation' }}
      >
        <Plus 
          size={24} 
          className={`transition-transform duration-300 ${isExpanded ? 'rotate-45' : ''}`} 
        />
      </button>
    </div>
  );
});

// Hauptkomponente
const MobileDashboardOptimized = memo(({
  projects,
  selectedProjectIndex,
  onProjectChange,
  projectStats,
  projectTrades,
  allTradeQuotes,
  onTradeClick,
  onAcceptQuote,
  onRejectQuote,
  onCreateProject,
  onCreateTrade,
  onEditProject,
  onProjectDetails
}: {
  projects: any[];
  selectedProjectIndex: number;
  onProjectChange: (index: number) => void;
  projectStats: any;
  projectTrades: any[];
  allTradeQuotes: {[key: number]: any[]};
  onTradeClick: (trade: any) => void;
  onAcceptQuote: (quoteId: number) => Promise<void>;
  onRejectQuote: (quoteId: number, reason: string) => Promise<void>;
  onCreateProject: () => void;
  onCreateTrade: () => void;
  onEditProject: () => void;
  onProjectDetails: () => void;
}) => {
  const navigate = useNavigate();

  // Memoized trade filtering
  const { openTrades, acceptedTrades, completedTrades } = useMemo(() => {
    const open = projectTrades.filter(trade => {
      const quotes = allTradeQuotes[trade.id] || [];
      return !quotes.some(quote => quote.status === 'accepted');
    });

    const accepted = projectTrades.filter(trade => {
      const quotes = allTradeQuotes[trade.id] || [];
      const hasAcceptedQuote = quotes.some(quote => quote.status === 'accepted');
      const isCompleted = (trade as any).completion_status === 'completed';
      return hasAcceptedQuote && !isCompleted;
    });

    const completed = projectTrades.filter(trade => {
      return (trade as any).completion_status === 'completed';
    });

    return { openTrades: open, acceptedTrades: accepted, completedTrades: completed };
  }, [projectTrades, allTradeQuotes]);

  const handleNavigate = useCallback((path: string) => {
    navigate(path);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460]">
      <div className="container mx-auto px-4 py-4 max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">Dashboard</h1>
            <p className="text-sm text-gray-400">Projektübersicht</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              className="mobile-touch-target p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
              style={{ touchAction: 'manipulation' }}
            >
              <Search size={20} />
            </button>
            <button
              className="mobile-touch-target p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
              style={{ touchAction: 'manipulation' }}
            >
              <Bell size={20} />
            </button>
          </div>
        </div>

        {/* Quick Stats */}
        <MobileQuickStats 
          projectStats={projectStats}
          projects={projects}
          onNavigate={handleNavigate}
        />

        {/* Projekt-Carousel */}
        {projects.length > 0 && (
          <MobileProjectCarousel
            projects={projects}
            selectedProjectIndex={selectedProjectIndex}
            onProjectChange={onProjectChange}
            onEditProject={onEditProject}
            onProjectDetails={onProjectDetails}
          />
        )}

        {/* Trades Sections */}
        <div className="space-y-4" data-section="trades">
          <MobileTradesSection
            trades={openTrades}
            title="Offene Ausschreibungen"
            color="bg-orange-400"
            count={openTrades.length}
            onTradeClick={onTradeClick}
            onAcceptQuote={onAcceptQuote}
            onRejectQuote={onRejectQuote}
          />

          <MobileTradesSection
            trades={acceptedTrades}
            title="Angenommene Ausschreibungen"
            color="bg-green-400"
            count={acceptedTrades.length}
            onTradeClick={onTradeClick}
            onAcceptQuote={onAcceptQuote}
            onRejectQuote={onRejectQuote}
          />

          {completedTrades.length > 0 && (
            <MobileTradesSection
              trades={completedTrades}
              title="Abgeschlossene Ausschreibungen"
              color="bg-blue-400"
              count={completedTrades.length}
              onTradeClick={onTradeClick}
              onAcceptQuote={onAcceptQuote}
              onRejectQuote={onRejectQuote}
            />
          )}
        </div>

        {/* Floating Action Button */}
        <MobileFloatingActionButton
          onCreateProject={onCreateProject}
          onCreateTrade={onCreateTrade}
        />
      </div>
    </div>
  );
});

MobileDashboardOptimized.displayName = 'MobileDashboardOptimized';

export default MobileDashboardOptimized;
