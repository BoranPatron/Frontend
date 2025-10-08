import React, { useState, useEffect } from 'react';
import { Award, TrendingUp, Info } from 'lucide-react';
import { getMyRank, type UserRankResponse } from '../api/gamificationService';

interface UserRankDisplayProps {
  className?: string;
}

const UserRankDisplay: React.FC<UserRankDisplayProps> = ({ className = '' }) => {
  const [rankData, setRankData] = useState<UserRankResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showTooltip, setShowTooltip] = useState(false);

  useEffect(() => {
    loadRankData();
  }, []);

  const loadRankData = async () => {
    try {
      setLoading(true);
      const data = await getMyRank();
      setRankData(data);
      setError(null);
    } catch (err) {
      console.error('Fehler beim Laden des Rangs:', err);
      setError('Rang konnte nicht geladen werden');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <div className="animate-pulse bg-gray-300/20 rounded-lg px-3 py-1">
          <div className="h-4 w-20 bg-gray-300/30 rounded"></div>
        </div>
      </div>
    );
  }

  if (error || !rankData) {
    return null; // Zeige nichts bei Fehlern
  }

  const { current_rank, next_rank, progress, completed_count } = rankData;

  return (
    <div className={`relative ${className}`}>
      {/* Rang-Anzeige */}
      <div 
        className="flex items-center space-x-2 cursor-pointer group"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onClick={() => setShowTooltip(!showTooltip)}
      >
        <div className="flex items-center space-x-2 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 backdrop-blur-sm rounded-lg px-3 py-2 border border-yellow-500/30 hover:border-yellow-400/50 transition-all duration-300">
          <Award size={16} className="text-yellow-400" />
          <span className="text-sm font-semibold text-white">
            {current_rank.title}
          </span>
          <span className="text-lg">{current_rank.emoji}</span>
        </div>
        
        
        <Info size={14} className="text-gray-400 group-hover:text-yellow-400 transition-colors" />
      </div>

      {/* Tooltip */}
      {showTooltip && (
        <div className="absolute top-full left-0 mt-2 z-[9999] min-w-80 max-w-96" style={{ zIndex: 9999 }}>
          <div className="bg-gray-900/95 backdrop-blur-xl rounded-xl p-4 border border-white/20 shadow-2xl">
            {/* Aktueller Rang */}
            <div className="mb-4">
              <div className="flex items-center space-x-3 mb-2">
                <span className="text-2xl">{current_rank.emoji}</span>
                <div>
                  <h3 className="text-lg font-bold text-white">{current_rank.title}</h3>
                  <p className="text-sm text-gray-300">{current_rank.description}</p>
                </div>
              </div>
              <div className="text-sm text-gray-400">
                {completed_count} abgeschlossene Angebote
              </div>
            </div>

            {/* Nächster Rang */}
            {next_rank && (
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-gray-300">Nächster Rang:</span>
                  <span className="text-sm text-yellow-400">
                    {next_rank.min_count - completed_count} Angebote
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-lg">{next_rank.emoji}</span>
                  <div>
                    <div className="text-sm font-semibold text-white">{next_rank.title}</div>
                    <div className="text-xs text-gray-400">{next_rank.description}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Motivationsnachricht */}
            <div className="pt-3 border-t border-gray-700">
              <div className="flex items-center space-x-2">
                <TrendingUp size={14} className="text-green-400" />
                <span className="text-xs text-gray-400">
                  {next_rank 
                    ? `Weiter so! Nur noch ${next_rank.min_count - completed_count} Angebote bis zum nächsten Rang.`
                    : 'Herzlichen Glückwunsch! Sie haben den höchsten Rang erreicht!'
                  }
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserRankDisplay;
