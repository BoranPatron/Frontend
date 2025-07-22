import React from 'react';
import { CheckCircle, Circle, Clock } from 'lucide-react';

interface ConstructionPhase {
  value: string;
  label: string;
}

interface CompactPhaseTimelineProps {
  currentPhase?: string;
  country?: string;
  phases?: ConstructionPhase[];
}

// Hilfsfunktion für Bauphasen
const getConstructionPhases = (country: string): ConstructionPhase[] => {
  switch (country) {
    case 'Schweiz':
      return [
        { value: 'vorprojekt', label: 'Vorprojekt' },
        { value: 'projektierung', label: 'Projektierung' },
        { value: 'baugenehmigung', label: 'Baugenehmigung' },
        { value: 'ausschreibung', label: 'Ausschreibung' },
        { value: 'aushub', label: 'Aushub' },
        { value: 'fundament', label: 'Fundament' },
        { value: 'rohbau', label: 'Rohbau' },
        { value: 'dach', label: 'Dach' },
        { value: 'fassade', label: 'Fassade' },
        { value: 'innenausbau', label: 'Innenausbau' },
        { value: 'fertigstellung', label: 'Fertigstellung' }
      ];
    case 'Deutschland':
      return [
        { value: 'planungsphase', label: 'Planungsphase' },
        { value: 'baugenehmigung', label: 'Baugenehmigung' },
        { value: 'ausschreibung', label: 'Ausschreibung' },
        { value: 'aushub', label: 'Aushub' },
        { value: 'fundament', label: 'Fundament' },
        { value: 'rohbau', label: 'Rohbau' },
        { value: 'dach', label: 'Dach' },
        { value: 'fassade', label: 'Fassade' },
        { value: 'innenausbau', label: 'Innenausbau' },
        { value: 'fertigstellung', label: 'Fertigstellung' }
      ];
    case 'Österreich':
      return [
        { value: 'planungsphase', label: 'Planungsphase' },
        { value: 'einreichung', label: 'Einreichung' },
        { value: 'ausschreibung', label: 'Ausschreibung' },
        { value: 'aushub', label: 'Aushub' },
        { value: 'fundament', label: 'Fundament' },
        { value: 'rohbau', label: 'Rohbau' },
        { value: 'dach', label: 'Dach' },
        { value: 'fassade', label: 'Fassade' },
        { value: 'innenausbau', label: 'Innenausbau' },
        { value: 'fertigstellung', label: 'Fertigstellung' }
      ];
    default:
      return [];
  }
};

export default function CompactPhaseTimeline({ 
  currentPhase, 
  country, 
  phases: customPhases
}: CompactPhaseTimelineProps) {
  if (!currentPhase || !country) return null;

  const phases = customPhases || getConstructionPhases(country);
  const currentPhaseIndex = phases.findIndex(p => p.value === currentPhase);

  if (phases.length === 0) return null;

  const progressPercentage = ((currentPhaseIndex + 1) / phases.length) * 100;

  return (
    <div className="mt-4">
      {/* Modern Compact Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-gradient-to-br from-[#ffbd59] to-[#ffa726] rounded-lg flex items-center justify-center">
            <Clock size={12} className="text-white" />
          </div>
          <div>
            <div className="text-xs font-semibold text-white">Bauphasen</div>
            <div className="text-xs text-gray-400">
              Phase {currentPhaseIndex + 1} von {phases.length}
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-sm font-bold text-[#ffbd59]">{Math.round(progressPercentage)}%</div>
        </div>
      </div>

      {/* Modern Compact Progress Bar */}
      <div className="relative w-full h-2 bg-gray-700/50 rounded-full overflow-hidden backdrop-blur-sm border border-gray-600/30 mb-3">
        <div 
          className="absolute inset-0 bg-gradient-to-r from-[#ffbd59] to-[#ffa726] h-2 rounded-full transition-all duration-1000 ease-out shadow-lg"
          style={{ width: `${progressPercentage}%` }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent h-2 rounded-full animate-pulse"></div>
      </div>

      {/* Modern Compact Timeline */}
      <div className="flex items-center justify-between space-x-1 overflow-hidden">
        {phases.map((phase, index) => {
          const isCompleted = index < currentPhaseIndex;
          const isCurrent = index === currentPhaseIndex;
          
          return (
            <div key={phase.value} className="flex flex-col items-center min-w-0 flex-1 group">
              {/* Modern Compact Phase Circle */}
              <div className={`relative w-4 h-4 rounded-full border transition-all duration-300 group-hover:scale-110 ${
                isCompleted 
                  ? 'bg-green-400 border-green-400 shadow-lg shadow-green-400/30' 
                  : isCurrent
                  ? 'bg-[#ffbd59] border-[#ffbd59] shadow-lg shadow-[#ffbd59]/30 animate-pulse'
                  : 'bg-transparent border-gray-500 group-hover:border-gray-400'
              }`}>
                {isCompleted && (
                  <CheckCircle size={12} className="text-white absolute inset-0 m-auto" />
                )}
                {isCurrent && (
                  <Clock size={12} className="text-white absolute inset-0 m-auto" />
                )}
                {!isCompleted && !isCurrent && (
                  <Circle size={12} className="text-gray-500 absolute inset-0 m-auto" />
                )}
              </div>
              
              {/* Modern Compact Connection Line */}
              {index < phases.length - 1 && (
                <div className={`w-full h-0.5 mt-1 transition-all duration-300 rounded-full ${
                  isCompleted ? 'bg-green-400' : 'bg-gray-500'
                }`}></div>
              )}
            </div>
          );
        })}
      </div>
      
      {/* Modern Compact Progress Info */}
      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-400 shadow-lg shadow-green-400/30"></div>
          <span className="text-xs text-gray-400">
            {currentPhaseIndex} abgeschlossen
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-gray-500"></div>
          <span className="text-xs text-gray-400">
            {phases.length - currentPhaseIndex - 1} verbleibend
          </span>
        </div>
      </div>
    </div>
  );
} 