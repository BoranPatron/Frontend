import React from 'react';
import { CheckCircle, Circle, Clock, TrendingUp } from 'lucide-react';

interface ConstructionPhase {
  value: string;
  label: string;
}

interface ConstructionPhaseTimelineProps {
  currentPhase?: string;
  country?: string;
  phases?: ConstructionPhase[];
  showLegend?: boolean;
  showProgress?: boolean;
  compact?: boolean;
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

const getPhaseLabel = (phase: string, phases: ConstructionPhase[]) => {
  const phaseObj = phases.find(p => p.value === phase);
  return phaseObj ? phaseObj.label : phase;
};

export default function ConstructionPhaseTimeline({ 
  currentPhase, 
  country, 
  phases: customPhases,
  showLegend = true,
  showProgress = true,
  compact = false
}: ConstructionPhaseTimelineProps) {
  if (!currentPhase || !country) return null;

  const phases = customPhases || getConstructionPhases(country);
  const currentPhaseIndex = phases.findIndex(p => p.value === currentPhase);

  if (phases.length === 0) return null;

  const progressPercentage = ((currentPhaseIndex + 1) / phases.length) * 100;

  return (
    <div className={`${compact ? 'mt-3' : 'mt-6'}`}>
      {/* Modern Header mit Progress */}
      {showProgress && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-[#ffbd59] to-[#ffa726] rounded-lg flex items-center justify-center">
                <TrendingUp size={16} className="text-white" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">Bauphasen-Fortschritt</h4>
                <p className="text-xs text-gray-400">
                  {getPhaseLabel(currentPhase, phases)} • Phase {currentPhaseIndex + 1} von {phases.length}
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-[#ffbd59]">{Math.round(progressPercentage)}%</div>
              <div className="text-xs text-gray-400">Fortschritt</div>
            </div>
          </div>
          
          {/* Modern Progress Bar */}
          <div className="relative w-full h-3 bg-gray-700/50 rounded-full overflow-hidden backdrop-blur-sm border border-gray-600/30">
            <div 
              className="absolute inset-0 bg-gradient-to-r from-[#ffbd59] to-[#ffa726] h-3 rounded-full transition-all duration-1000 ease-out shadow-lg"
              style={{ width: `${progressPercentage}%` }}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent h-3 rounded-full animate-pulse"></div>
          </div>
        </div>
      )}

      {/* Modern Legend */}
      {showLegend && (
        <div className="flex items-center justify-between mb-6 p-4 bg-white/5 rounded-xl border border-white/10 backdrop-blur-sm">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-400 shadow-lg shadow-green-400/30"></div>
              <span className="text-xs text-gray-300">Abgeschlossen</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#ffbd59] shadow-lg shadow-[#ffbd59]/30 animate-pulse"></div>
              <span className="text-xs text-gray-300">Aktuell</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-gray-500"></div>
              <span className="text-xs text-gray-300">Ausstehend</span>
            </div>
          </div>
          <div className="text-xs text-gray-400">
            {country} • {phases.length} Phasen
          </div>
        </div>
      )}
      
      {/* Modern Timeline */}
      <div className="relative">
        {/* Desktop Timeline */}
        <div className="hidden lg:flex items-center justify-between space-x-4 overflow-x-auto pb-6">
          {phases.map((phase, index) => {
            const isCompleted = index < currentPhaseIndex;
            const isCurrent = index === currentPhaseIndex;
            
            return (
              <div key={phase.value} className="flex flex-col items-center min-w-0 flex-1 group">
                {/* Modern Phase Circle */}
                <div className={`relative w-12 h-12 rounded-full border-2 flex items-center justify-center transition-all duration-500 group-hover:scale-110 ${
                  isCompleted 
                    ? 'bg-green-400 border-green-400 shadow-lg shadow-green-400/30' 
                    : isCurrent
                    ? 'bg-[#ffbd59] border-[#ffbd59] shadow-lg shadow-[#ffbd59]/30 animate-pulse'
                    : 'bg-transparent border-gray-500 group-hover:border-gray-400'
                }`}>
                  {isCompleted && (
                    <CheckCircle size={20} className="text-white" />
                  )}
                  {isCurrent && (
                    <Clock size={20} className="text-white" />
                  )}
                  {!isCompleted && !isCurrent && (
                    <Circle size={20} className="text-gray-500" />
                  )}
                </div>
                
                {/* Modern Connection Line */}
                {index < phases.length - 1 && (
                  <div className={`w-full h-1 mt-3 transition-all duration-500 rounded-full ${
                    isCompleted ? 'bg-green-400' : 'bg-gray-500'
                  }`}></div>
                )}
                
                {/* Modern Phase Label */}
                <div className="mt-4 text-center">
                  <span className={`text-sm font-medium transition-all duration-300 ${
                    isCompleted 
                      ? 'text-green-400' 
                      : isCurrent
                      ? 'text-[#ffbd59] font-semibold'
                      : 'text-gray-500 group-hover:text-gray-400'
                  }`}>
                    {phase.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Tablet Timeline */}
        <div className="hidden md:flex lg:hidden items-center justify-between space-x-3 overflow-x-auto pb-6">
          {phases.map((phase, index) => {
            const isCompleted = index < currentPhaseIndex;
            const isCurrent = index === currentPhaseIndex;
            
            return (
              <div key={phase.value} className="flex flex-col items-center min-w-0 flex-1 group">
                {/* Modern Phase Circle */}
                <div className={`relative w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all duration-500 group-hover:scale-110 ${
                  isCompleted 
                    ? 'bg-green-400 border-green-400 shadow-lg shadow-green-400/30' 
                    : isCurrent
                    ? 'bg-[#ffbd59] border-[#ffbd59] shadow-lg shadow-[#ffbd59]/30 animate-pulse'
                    : 'bg-transparent border-gray-500 group-hover:border-gray-400'
                }`}>
                  {isCompleted && (
                    <CheckCircle size={16} className="text-white" />
                  )}
                  {isCurrent && (
                    <Clock size={16} className="text-white" />
                  )}
                  {!isCompleted && !isCurrent && (
                    <Circle size={16} className="text-gray-500" />
                  )}
                </div>
                
                {/* Modern Connection Line */}
                {index < phases.length - 1 && (
                  <div className={`w-full h-1 mt-2 transition-all duration-500 rounded-full ${
                    isCompleted ? 'bg-green-400' : 'bg-gray-500'
                  }`}></div>
                )}
                
                {/* Modern Phase Label */}
                <div className="mt-3 text-center">
                  <span className={`text-xs font-medium transition-all duration-300 ${
                    isCompleted 
                      ? 'text-green-400' 
                      : isCurrent
                      ? 'text-[#ffbd59] font-semibold'
                      : 'text-gray-500 group-hover:text-gray-400'
                  }`}>
                    {phase.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Mobile Timeline */}
        <div className="md:hidden">
          <div className="flex items-center space-x-4 overflow-x-auto pb-4 scrollbar-hide">
            {phases.map((phase, index) => {
              const isCompleted = index < currentPhaseIndex;
              const isCurrent = index === currentPhaseIndex;
              
              return (
                <div key={phase.value} className="flex flex-col items-center min-w-0 flex-shrink-0 group">
                  {/* Modern Phase Circle */}
                  <div className={`relative w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all duration-500 group-hover:scale-110 ${
                    isCompleted 
                      ? 'bg-green-400 border-green-400 shadow-lg shadow-green-400/30' 
                      : isCurrent
                      ? 'bg-[#ffbd59] border-[#ffbd59] shadow-lg shadow-[#ffbd59]/30 animate-pulse'
                      : 'bg-transparent border-gray-500 group-hover:border-gray-400'
                  }`}>
                    {isCompleted && (
                      <CheckCircle size={14} className="text-white" />
                    )}
                    {isCurrent && (
                      <Clock size={14} className="text-white" />
                    )}
                    {!isCompleted && !isCurrent && (
                      <Circle size={14} className="text-gray-500" />
                    )}
                  </div>
                  
                  {/* Modern Phase Label */}
                  <div className="mt-2 text-center">
                    <span className={`text-xs font-medium transition-all duration-300 ${
                      isCompleted 
                        ? 'text-green-400' 
                        : isCurrent
                        ? 'text-[#ffbd59] font-semibold'
                        : 'text-gray-500 group-hover:text-gray-400'
                    }`}>
                      {phase.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Modern Progress Info */}
      {showProgress && (
        <div className="mt-6 p-4 bg-white/5 rounded-xl border border-white/10 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-green-500 rounded-lg flex items-center justify-center">
                <CheckCircle size={16} className="text-white" />
              </div>
              <div>
                <div className="text-sm font-semibold text-white">
                  {currentPhaseIndex} von {phases.length} Phasen abgeschlossen
                </div>
                <div className="text-xs text-gray-400">
                  {phases.length - currentPhaseIndex - 1} Phasen verbleibend
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-[#ffbd59]">{Math.round(progressPercentage)}%</div>
              <div className="text-xs text-gray-400">Fortschritt</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 