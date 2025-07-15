import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Users, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  MessageCircle,
  Upload,
  Download,
  Eye,
  Edit,
  Send,
  Award,
  Gavel,
  Shield,
  Euro,
  Calendar,
  Building,
  Handshake,
  Star,
  X,
  Plus
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface TenderPhase {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'active' | 'completed' | 'overdue';
  deadline?: string;
  requirements: string[];
  documents: string[];
  participants: number[];
}

interface TenderProcessProps {
  tradeId: number;
  projectId: number;
  isOpen: boolean;
  onClose: () => void;
}

const TENDER_PHASES: TenderPhase[] = [
  {
    id: 'cost_estimate',
    name: 'Kostenvoranschlag',
    description: 'Grobe Kostenschätzung und Machbarkeitsprüfung',
    status: 'pending',
    requirements: [
      'Technische Spezifikationen',
      'Grundlegende Anforderungen',
      'Budget-Rahmen'
    ],
    documents: [],
    participants: []
  },
  {
    id: 'tender',
    name: 'Ausschreibung',
    description: 'Formelle Ausschreibung mit detaillierten Unterlagen',
    status: 'pending',
    requirements: [
      'Detaillierte technische Spezifikationen',
      'Rechtliche Anforderungen',
      'Qualitätsstandards',
      'Sicherheitsanforderungen',
      'Umweltanforderungen'
    ],
    documents: [],
    participants: []
  },
  {
    id: 'bidding',
    name: 'Angebotsphase',
    description: 'Dienstleister reichen Angebote ein',
    status: 'pending',
    requirements: [
      'Angebotsformular',
      'Technische Unterlagen',
      'Preisaufschlüsselung',
      'Referenzen',
      'Qualifikationsnachweise'
    ],
    documents: [],
    participants: []
  },
  {
    id: 'evaluation',
    name: 'Bewertung',
    description: 'Systematische Bewertung aller Angebote',
    status: 'pending',
    requirements: [
      'Bewertungskriterien',
      'Preis-Leistungs-Verhältnis',
      'Technische Eignung',
      'Referenzen prüfen'
    ],
    documents: [],
    participants: []
  },
  {
    id: 'negotiation',
    name: 'Nachverhandlung',
    description: 'Verhandlung mit ausgewählten Anbietern',
    status: 'pending',
    requirements: [
      'Verhandlungsprotokoll',
      'Anpassungen dokumentieren',
      'Finale Angebote'
    ],
    documents: [],
    participants: []
  },
  {
    id: 'awarded',
    name: 'Auftragsvergabe',
    description: 'Vertragsabschluss und Auftragsvergabe',
    status: 'pending',
    requirements: [
      'Vertragsunterlagen',
      'Leistungsbeschreibung',
      'Zahlungsbedingungen',
      'Gewährleistung'
    ],
    documents: [],
    participants: []
  }
];

export default function TenderProcess({ tradeId, projectId, isOpen, onClose }: TenderProcessProps) {
  const { isServiceProvider } = useAuth();
  const [phases, setPhases] = useState<TenderPhase[]>(TENDER_PHASES);
  const [currentPhase, setCurrentPhase] = useState<string>('cost_estimate');
  const [showDocumentUpload, setShowDocumentUpload] = useState(false);
  const [showInviteServiceProviders, setShowInviteServiceProviders] = useState(false);
  const [showQuestions, setShowQuestions] = useState(false);

  const getPhaseStatus = (phaseId: string) => {
    const phase = phases.find(p => p.id === phaseId);
    return phase?.status || 'pending';
  };

  const getPhaseIcon = (phaseId: string, status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle size={20} className="text-green-400" />;
      case 'active':
        return <Clock size={20} className="text-yellow-400" />;
      case 'overdue':
        return <AlertTriangle size={20} className="text-red-400" />;
      default:
        return <FileText size={20} className="text-gray-400" />;
    }
  };

  const getPhaseColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'border-green-500 bg-green-500/10';
      case 'active':
        return 'border-yellow-500 bg-yellow-500/10';
      case 'overdue':
        return 'border-red-500 bg-red-500/10';
      default:
        return 'border-gray-500 bg-gray-500/10';
    }
  };

  const handlePhaseActivation = (phaseId: string) => {
    setPhases(prev => prev.map(phase => ({
      ...phase,
      status: phase.id === phaseId ? 'active' : 
              phases.findIndex(p => p.id === phaseId) > phases.findIndex(p => p.id === phase.id) ? 'pending' : 'completed'
    })));
    setCurrentPhase(phaseId);
  };

  const handleDocumentUpload = (phaseId: string) => {
    setShowDocumentUpload(true);
    // Implementierung für Dokumenten-Upload
  };

  const handleInviteServiceProviders = (phaseId: string) => {
    setShowInviteServiceProviders(true);
    // Implementierung für Dienstleister-Einladung
  };

  const handleQuestions = (phaseId: string) => {
    setShowQuestions(true);
    // Implementierung für Fragen & Antworten
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-[#3d4952] rounded-xl shadow-2xl border border-white/20 w-full max-w-6xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <Gavel className="text-[#ffbd59]" size={24} />
            <div>
              <h2 className="text-xl font-semibold text-white">Professioneller Ausschreibungsprozess</h2>
              <p className="text-sm text-gray-300">Gewerk #{tradeId} - Projekt #{projectId}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X size={20} className="text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* Prozess-Übersicht */}
          <div className="mb-8">
            <h3 className="text-lg font-medium text-white mb-4">Ausschreibungsphasen</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {phases.map((phase, index) => (
                <div
                  key={phase.id}
                  className={`p-4 rounded-lg border-2 transition-all cursor-pointer ${
                    getPhaseColor(getPhaseStatus(phase.id))
                  } ${currentPhase === phase.id ? 'ring-2 ring-[#ffbd59]' : ''}`}
                  onClick={() => handlePhaseActivation(phase.id)}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {getPhaseIcon(phase.id, getPhaseStatus(phase.id))}
                      <span className="font-medium text-white">{phase.name}</span>
                    </div>
                    <span className="text-xs text-gray-400">#{index + 1}</span>
                  </div>
                  <p className="text-sm text-gray-300 mb-3">{phase.description}</p>
                  <div className="space-y-2">
                    <div className="text-xs text-gray-400">Anforderungen:</div>
                    <ul className="text-xs text-gray-300 space-y-1">
                      {phase.requirements.slice(0, 2).map((req, idx) => (
                        <li key={idx} className="flex items-center gap-1">
                          <div className="w-1 h-1 bg-[#ffbd59] rounded-full"></div>
                          {req}
                        </li>
                      ))}
                      {phase.requirements.length > 2 && (
                        <li className="text-gray-400">+{phase.requirements.length - 2} weitere</li>
                      )}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Aktuelle Phase Details */}
          <div className="mb-8">
            <h3 className="text-lg font-medium text-white mb-4">
              Aktuelle Phase: {phases.find(p => p.id === currentPhase)?.name}
            </h3>
            <div className="bg-white/5 rounded-lg p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Anforderungen */}
                <div>
                  <h4 className="font-medium text-white mb-3 flex items-center gap-2">
                    <Shield size={16} />
                    Anforderungen
                  </h4>
                  <ul className="space-y-2">
                    {phases.find(p => p.id === currentPhase)?.requirements.map((req, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-gray-300">
                        <CheckCircle size={14} className="text-green-400 mt-0.5 flex-shrink-0" />
                        {req}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Aktionen */}
                <div>
                  <h4 className="font-medium text-white mb-3 flex items-center gap-2">
                    <Send size={16} />
                    Verfügbare Aktionen
                  </h4>
                  <div className="space-y-2">
                    <button
                      onClick={() => handleDocumentUpload(currentPhase)}
                      className="flex items-center gap-2 w-full p-3 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-white text-sm"
                    >
                      <Upload size={16} />
                      Dokumente hochladen
                    </button>
                    <button
                      onClick={() => handleInviteServiceProviders(currentPhase)}
                      className="flex items-center gap-2 w-full p-3 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-white text-sm"
                    >
                      <Users size={16} />
                      Dienstleister einladen
                    </button>
                    <button
                      onClick={() => handleQuestions(currentPhase)}
                      className="flex items-center gap-2 w-full p-3 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-white text-sm"
                    >
                      <MessageCircle size={16} />
                      Fragen & Antworten
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Juristische Hinweise */}
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
            <h4 className="font-medium text-yellow-300 mb-2 flex items-center gap-2">
              <AlertTriangle size={16} />
              Juristische Hinweise
            </h4>
            <ul className="text-sm text-yellow-200 space-y-1">
              <li>• Alle Phasen müssen dokumentiert werden</li>
              <li>• Gleichbehandlung aller Anbieter sicherstellen</li>
              <li>• Bewertungskriterien vorab festlegen</li>
              <li>• Vertragsunterlagen rechtlich prüfen lassen</li>
              <li>• Gewährleistung und Haftung regeln</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/10 bg-[#2c3539]">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-300">
              Phase {phases.findIndex(p => p.id === currentPhase) + 1} von {phases.length}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700 transition-colors"
              >
                Schließen
              </button>
              <button
                onClick={() => {/* Implementierung für nächste Phase */}}
                className="px-4 py-2 bg-[#ffbd59] text-[#2c3539] rounded-lg font-medium hover:bg-[#ffa726] transition-colors"
              >
                Nächste Phase
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 