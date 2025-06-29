import React from 'react';
import { Wrench, User, Euro, BarChart3, Calendar, Tag } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Trade {
  id: number;
  title: string;
  description: string;
  status: 'planned' | 'in_progress' | 'completed' | 'delayed' | 'cancelled';
  contractor?: string;
  start_date?: string;
  end_date?: string;
  budget?: number;
  actual_costs?: number;
  progress_percentage: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
  category?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

interface TradesCardProps {
  trades: Trade[];
  projectId?: number;
  isExpanded: boolean;
  onToggle: () => void;
}

export default function TradesCard({ trades, projectId, isExpanded, onToggle }: TradesCardProps) {
  const navigate = useNavigate();

  console.log('🔍 TradesCard Props:', { trades, projectId, isExpanded, tradesLength: trades.length });

  const getTradeStatusLabel = (status: string) => {
    switch (status) {
      case 'planned': return 'Geplant';
      case 'in_progress': return 'In Bearbeitung';
      case 'completed': return 'Abgeschlossen';
      case 'delayed': return 'Verzögert';
      case 'cancelled': return 'Abgebrochen';
      default: return status;
    }
  };

  const getTradeStatusColor = (status: string) => {
    switch (status) {
      case 'planned': return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'in_progress': return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      case 'completed': return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'delayed': return 'bg-orange-500/20 text-orange-300 border-orange-500/30';
      case 'cancelled': return 'bg-red-500/20 text-red-300 border-red-500/30';
      default: return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'medium': return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      case 'high': return 'bg-orange-500/20 text-orange-300 border-orange-500/30';
      case 'critical': return 'bg-red-500/20 text-red-300 border-red-500/30';
      default: return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'low': return 'Niedrig';
      case 'medium': return 'Mittel';
      case 'high': return 'Hoch';
      case 'critical': return 'Kritisch';
      default: return priority;
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('de-DE');
  };

  return (
    <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full p-6 text-left hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white flex items-center gap-3">
            <Wrench size={20} className="text-[#ffbd59]" />
            Gewerke ({trades.length})
          </h3>
          <div className={`transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
            <svg className="w-5 h-5 text-[#ffbd59]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </button>
      
      {isExpanded && (
        <div className="px-6 pb-6 space-y-3">
          {trades.length === 0 ? (
            <div className="text-center py-8">
              <Wrench size={48} className="text-gray-400 mx-auto mb-4" />
              <p className="text-gray-400 text-sm mb-4">Keine Gewerke für dieses Projekt vorhanden</p>
              <p className="text-gray-500 text-xs mb-4">Erstellen Sie ein neues Gewerk über die "Gewerke"-Seite</p>
              <button
                onClick={() => navigate('/quotes')}
                className="px-4 py-2 bg-[#ffbd59] text-[#3d4952] rounded-lg font-semibold hover:bg-[#ffa726] transition-colors"
              >
                Gewerk erstellen
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {trades.slice(0, 5).map((trade) => (
                <div
                  key={trade.id}
                  className="bg-white/10 rounded-lg p-4 cursor-pointer hover:bg-white/20 transition-colors"
                  onClick={() => navigate('/quotes')}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-[#ffbd59]/20 rounded-lg">
                        <Wrench size={16} className="text-[#ffbd59]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-white font-medium text-sm truncate">{trade.title}</h4>
                        {trade.description && (
                          <p className="text-gray-400 text-xs mt-1 line-clamp-2">{trade.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getTradeStatusColor(trade.status)}`}>
                        {getTradeStatusLabel(trade.status)}
                      </span>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(trade.priority)}`}>
                        {getPriorityLabel(trade.priority)}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs text-gray-400">
                    {trade.contractor && (
                      <div className="flex items-center gap-1">
                        <User size={12} />
                        <span className="truncate">{trade.contractor}</span>
                      </div>
                    )}
                    
                    {trade.budget && trade.budget > 0 && (
                      <div className="flex items-center gap-1">
                        <Euro size={12} />
                        <span>{trade.budget.toLocaleString('de-DE')} €</span>
                      </div>
                    )}
                    
                    {trade.start_date && (
                      <div className="flex items-center gap-1">
                        <Calendar size={12} />
                        <span>Start: {formatDate(trade.start_date)}</span>
                      </div>
                    )}
                    
                    {trade.progress_percentage > 0 && (
                      <div className="flex items-center gap-1">
                        <BarChart3 size={12} />
                        <span>{trade.progress_percentage}%</span>
                      </div>
                    )}
                  </div>

                  {trade.progress_percentage > 0 && (
                    <div className="mt-3">
                      <div className="flex justify-between text-xs text-gray-400 mb-1">
                        <span>Fortschritt</span>
                        <span>{trade.progress_percentage}%</span>
                      </div>
                      <div className="w-full bg-gray-700/50 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-[#ffbd59] to-[#ffa726] h-2 rounded-full transition-all duration-300" 
                          style={{ width: `${trade.progress_percentage}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {trade.category && (
                    <div className="mt-3">
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-500/20 text-gray-300 border border-gray-500/30">
                        <Tag size={10} />
                        {trade.category}
                      </span>
                    </div>
                  )}
                </div>
              ))}
              
              {trades.length > 5 && (
                <button
                  onClick={() => navigate('/quotes')}
                  className="w-full text-center text-[#ffbd59] text-sm hover:underline py-3"
                >
                  +{trades.length - 5} weitere Gewerke anzeigen
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
} 