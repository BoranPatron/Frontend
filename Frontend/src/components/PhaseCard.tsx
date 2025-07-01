import React, { useState } from 'react';
import { ChevronDown, ChevronUp, RotateCcw, CheckCircle, Clock, AlertCircle, X } from 'lucide-react';
import { ProjectPhase, getPhaseInfo, getPhaseIndex, PHASES } from '../constants/phases';
import { setProjectPhase } from '../api/projectService';
import { updateMilestone } from '../api/milestoneService';

interface Milestone {
  id: number;
  title: string;
  status: 'planned' | 'in_progress' | 'completed' | 'delayed' | 'cancelled';
  planned_date: string;
  actual_date?: string;
  category?: string;
}

interface PhaseCardProps {
  currentPhase: ProjectPhase;
  projectId: number;
  milestones: Milestone[];
  onPhaseChange: (newPhase: ProjectPhase) => Promise<void>;
  onMilestoneUpdate: () => Promise<void>;
  className?: string;
}

export default function PhaseCard({ 
  currentPhase, 
  projectId, 
  milestones, 
  onPhaseChange, 
  onMilestoneUpdate,
  className = '' 
}: PhaseCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [targetPhase, setTargetPhase] = useState<ProjectPhase | null>(null);
  const [isChangingPhase, setIsChangingPhase] = useState(false);
  const [isUpdatingMilestones, setIsUpdatingMilestones] = useState(false);

  const currentPhaseIndex = getPhaseIndex(currentPhase);
  const currentPhaseInfo = getPhaseInfo(currentPhase);

  // Filtere Meilensteine, die noch nicht erreicht wurden (nicht completed)
  const incompleteMilestones = milestones.filter(m => m.status !== 'completed' && m.status !== 'cancelled');

  const handlePhaseClick = async (phase: ProjectPhase) => {
    if (phase === currentPhase) return;
    
    setTargetPhase(phase);
    setShowResetDialog(true);
  };

  const confirmPhaseReset = async () => {
    if (!targetPhase) return;
    
    setIsChangingPhase(true);
    try {
      await setProjectPhase(projectId, targetPhase);
      await onPhaseChange(targetPhase);
      setShowResetDialog(false);
      setTargetPhase(null);
    } catch (error) {
      console.error('Error changing phase:', error);
    } finally {
      setIsChangingPhase(false);
    }
  };

  const handleMilestoneStatusChange = async (milestoneId: number, newStatus: string) => {
    setIsUpdatingMilestones(true);
    try {
      await updateMilestone(milestoneId, { status: newStatus });
      await onMilestoneUpdate();
    } catch (error) {
      console.error('Error updating milestone:', error);
    } finally {
      setIsUpdatingMilestones(false);
    }
  };

  const getPhaseStatus = (phase: ProjectPhase) => {
    const phaseIndex = getPhaseIndex(phase);
    if (phaseIndex < currentPhaseIndex) return 'completed';
    if (phaseIndex === currentPhaseIndex) return 'current';
    return 'upcoming';
  };

  const getPhaseClasses = (phase: ProjectPhase) => {
    const status = getPhaseStatus(phase);
    const baseClasses = "flex items-center gap-3 p-3 rounded-lg transition-all duration-300 cursor-pointer";
    
    switch (status) {
      case 'completed':
        return `${baseClasses} bg-green-500/20 border border-green-500/30 text-green-300 hover:bg-green-500/30`;
      case 'current':
        return `${baseClasses} bg-[#ffbd59]/20 border border-[#ffbd59]/30 text-[#ffbd59] hover:bg-[#ffbd59]/30`;
      case 'upcoming':
        return `${baseClasses} bg-gray-500/20 border border-gray-500/30 text-gray-400 hover:bg-gray-500/30 opacity-60`;
      default:
        return baseClasses;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle size={16} className="text-green-400" />;
      case 'in_progress':
        return <Clock size={16} className="text-blue-400" />;
      case 'delayed':
        return <AlertCircle size={16} className="text-red-400" />;
      case 'cancelled':
        return <X size={16} className="text-gray-400" />;
      default:
        return <Clock size={16} className="text-gray-400" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'planned': return 'Geplant';
      case 'in_progress': return 'In Bearbeitung';
      case 'completed': return 'Abgeschlossen';
      case 'delayed': return 'Verzögert';
      case 'cancelled': return 'Abgebrochen';
      default: return status;
    }
  };

  return (
    <div className={`bg-white/5 rounded-xl border border-white/10 overflow-hidden ${className}`}>
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-6 text-left hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#ffbd59]/20 rounded-lg">
              <div className="text-[#ffbd59] text-lg">{currentPhaseInfo.icon}</div>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Projektphasen</h3>
              <p className="text-gray-400 text-sm">Aktuell: {currentPhaseInfo.label}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className={`transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
              <ChevronDown size={20} className="text-[#ffbd59]" />
            </div>
          </div>
        </div>
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="px-6 pb-6 space-y-4">
          {/* Kompakte Phasenanzeige (Default) */}
          <div className="flex items-center justify-center gap-2 p-4 bg-white/5 rounded-lg">
            {Object.values(PHASES).map((phaseInfo, index) => {
              const phase = phaseInfo.id;
              const status = getPhaseStatus(phase);
              const isVisible = status === 'current' || 
                               (status === 'completed' && index === currentPhaseIndex - 1) ||
                               (status === 'upcoming' && index === currentPhaseIndex + 1);
              
              if (!isVisible) return null;
              
              return (
                <div
                  key={phase}
                  onClick={() => handlePhaseClick(phase)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-300 cursor-pointer ${
                    status === 'completed' ? 'bg-green-500/20 text-green-300 opacity-60' :
                    status === 'current' ? 'bg-[#ffbd59]/20 text-[#ffbd59]' :
                    'bg-gray-500/20 text-gray-400 opacity-60'
                  }`}
                >
                  <span className="text-sm">{phaseInfo.icon}</span>
                  <span className="text-sm font-medium">{phaseInfo.label}</span>
                  {status === 'current' && (
                    <div className="w-2 h-2 bg-[#ffbd59] rounded-full animate-pulse"></div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Vollständige Phasenliste */}
          <div className="space-y-2">
            <h4 className="text-white font-medium mb-3">Vollständiger Phasenverlauf</h4>
            {Object.values(PHASES).map((phaseInfo) => {
              const phase = phaseInfo.id;
              const status = getPhaseStatus(phase);
              
              return (
                <div
                  key={phase}
                  onClick={() => handlePhaseClick(phase)}
                  className={getPhaseClasses(phase)}
                >
                  <span className="text-lg">{phaseInfo.icon}</span>
                  <div className="flex-1">
                    <div className="font-medium">{phaseInfo.label}</div>
                    <div className="text-xs opacity-75">{phaseInfo.description}</div>
                  </div>
                  {status === 'current' && (
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-[#ffbd59] rounded-full animate-pulse"></div>
                      <span className="text-xs">Aktiv</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Meilensteine für Phasenreset */}
          {showResetDialog && targetPhase && (
            <div className="mt-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
              <h4 className="text-yellow-300 font-medium mb-3">
                Phase zurücksetzen: {getPhaseInfo(targetPhase).label}
              </h4>
              <p className="text-gray-300 text-sm mb-4">
                Die folgenden Meilensteine sind noch nicht abgeschlossen und müssen angepasst werden:
              </p>
              
              {incompleteMilestones.length === 0 ? (
                <p className="text-green-300 text-sm">Alle Meilensteine sind abgeschlossen.</p>
              ) : (
                <div className="space-y-2">
                  {incompleteMilestones.map((milestone) => (
                    <div key={milestone.id} className="flex items-center gap-3 p-2 bg-white/5 rounded">
                      {getStatusIcon(milestone.status)}
                      <div className="flex-1">
                        <div className="text-white text-sm">{milestone.title}</div>
                        <div className="text-gray-400 text-xs">
                          {milestone.category && `${milestone.category} • `}
                          Geplant: {new Date(milestone.planned_date).toLocaleDateString('de-DE')}
                        </div>
                      </div>
                      <select
                        value={milestone.status}
                        onChange={(e) => handleMilestoneStatusChange(milestone.id, e.target.value)}
                        className="bg-white/10 border border-white/20 rounded px-2 py-1 text-sm text-white"
                        disabled={isUpdatingMilestones}
                      >
                        <option value="planned">Geplant</option>
                        <option value="in_progress">In Bearbeitung</option>
                        <option value="completed">Abgeschlossen</option>
                        <option value="delayed">Verzögert</option>
                        <option value="cancelled">Abgebrochen</option>
                      </select>
                    </div>
                  ))}
                </div>
              )}
              
              <div className="flex gap-3 mt-4">
                <button
                  onClick={confirmPhaseReset}
                  disabled={isChangingPhase}
                  className="flex items-center gap-2 px-4 py-2 bg-[#ffbd59] text-[#3d4952] rounded-lg font-medium hover:bg-[#ffa726] transition-colors disabled:opacity-50"
                >
                  {isChangingPhase ? (
                    <div className="w-4 h-4 border-2 border-[#3d4952] border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <RotateCcw size={16} />
                  )}
                  Phase bestätigen
                </button>
                <button
                  onClick={() => {
                    setShowResetDialog(false);
                    setTargetPhase(null);
                  }}
                  className="px-4 py-2 bg-gray-500/20 text-gray-300 rounded-lg font-medium hover:bg-gray-500/30 transition-colors"
                >
                  Abbrechen
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 