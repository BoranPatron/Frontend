import React from 'react';
import { X, MapPin, Calendar, DollarSign, Ruler, Building2, Clock, Eye, Edit } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

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
  address_street?: string;
  address_zip?: string;
  address_city?: string;
  address_country?: string;
  property_size?: number;
  construction_area?: number;
  estimated_duration?: number;
  is_public: boolean;
  allow_quotes: boolean;
  created_at: string;
  updated_at: string;
  construction_phase?: string;
}

interface ProjectDetailsModalProps {
  project: Project;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: () => void;
}

export default function ProjectDetailsModal({ project, isOpen, onClose, onEdit }: ProjectDetailsModalProps) {
  const { isBautraeger } = useAuth();
  
  if (!isOpen) return null;

  const getProjectTypeLabel = (type: string) => {
    switch (type) {
      case 'new_build': return 'Neubau';
      case 'renovation': return 'Renovierung';
      case 'extension': return 'Erweiterung';
      case 'modernization': return 'Modernisierung';
      default: return type;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'planning': return 'Planung';
      case 'in_progress': return 'In Bearbeitung';
      case 'completed': return 'Abgeschlossen';
      case 'on_hold': return 'Pausiert';
      default: return status;
    }
  };

  const getConstructionPhaseLabel = (phase: string) => {
    switch (phase) {
      case 'vorprojekt': return 'Vorprojekt';
      case 'projektierung': return 'Projektierung';
      case 'baugenehmigung': return 'Baugenehmigung';
      case 'ausschreibung': return 'Ausschreibung';
      case 'aushub': return 'Aushub';
      case 'fundament': return 'Fundament';
      case 'rohbau': return 'Rohbau';
      case 'ausbau': return 'Ausbau';
      case 'fertigstellung': return 'Fertigstellung';
      default: return phase;
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Nicht angegeben';
    return new Date(dateString).toLocaleDateString('de-DE');
  };

  const formatCurrency = (amount?: number) => {
    if (!amount) return 'Nicht angegeben';
    return new Intl.NumberFormat('de-CH', {
      style: 'currency',
      currency: 'CHF'
    }).format(amount);
  };

  const formatArea = (area?: number) => {
    if (!area) return 'Nicht angegeben';
    return `${area.toLocaleString('de-CH')} m²`;
  };

  return (
    <div className="fixed inset-0 z-[10000] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-lg rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-white/20 shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-white/5 backdrop-blur-md rounded-t-3xl p-6 border-b border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-[#ffbd59] to-[#ffa726] rounded-xl flex items-center justify-center">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">{project.name}</h2>
                <p className="text-gray-300">{getProjectTypeLabel(project.project_type)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {onEdit && (
                <button
                  onClick={onEdit}
                  className="px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white"
                  title="Projekt bearbeiten"
                >
                  <Edit size={16} />
                  Bearbeiten
                </button>
              )}
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-white/10 transition-colors"
              >
                <X className="w-6 h-6 text-white" />
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Beschreibung */}
          <div className="bg-white/5 rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
              <Eye className="w-5 h-5 text-[#ffbd59]" />
              Projektbeschreibung
            </h3>
            <p className="text-gray-200 leading-relaxed">
              {project.description || 'Keine Beschreibung verfügbar'}
            </p>
          </div>

          {/* Projektstatus und Fortschritt */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white/5 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-[#ffbd59]" />
                Status & Fortschritt
              </h3>
              <div className="space-y-4">
                {/* Für Bauträger: Bauphase als Hauptstatus, für andere: normaler Status */}
                <div>
                  <p className="text-sm text-gray-400 mb-1">
                    {isBautraeger() && project.construction_phase ? 'Bauphase' : 'Status'}
                  </p>
                  <p className="text-white font-medium">
                    {isBautraeger() && project.construction_phase 
                      ? getConstructionPhaseLabel(project.construction_phase)
                      : getStatusLabel(project.status)
                    }
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-400 mb-1">Fortschritt</p>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-[#ffbd59] to-[#ffa726] h-2 rounded-full transition-all duration-300"
                        style={{ width: `${project.progress_percentage}%` }}
                      />
                    </div>
                    <span className="text-white font-medium">{project.progress_percentage}%</span>
                  </div>
                </div>
                {/* Zusätzliche Bauphase nur anzeigen wenn nicht als Hauptstatus verwendet */}
                {!isBautraeger() && project.construction_phase && (
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Bauphase</p>
                    <p className="text-white font-medium">{getConstructionPhaseLabel(project.construction_phase)}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Finanzen - Budget nur für Bauträger sichtbar */}
            <div className="bg-white/5 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-[#ffbd59]" />
                Finanzen
              </h3>
              <div className="space-y-4">
                {/* Budget nur für Bauträger anzeigen */}
                {isBautraeger() && (
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Budget</p>
                    <p className="text-white font-medium">{formatCurrency(project.budget)}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-gray-400 mb-1">Aktuelle Kosten</p>
                  <p className="text-white font-medium">{formatCurrency(project.current_costs)}</p>
                </div>
                {/* Verbleibendes Budget nur für Bauträger und wenn Budget vorhanden */}
                {isBautraeger() && project.budget && project.current_costs && (
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Verbleibend</p>
                    <p className={`font-medium ${project.current_costs > project.budget ? 'text-red-400' : 'text-green-400'}`}>
                      {formatCurrency(project.budget - project.current_costs)}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Adresse */}
          <div className="bg-white/5 rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-[#ffbd59]" />
              Projektstandort
            </h3>
            <div className="space-y-3">
              <p className="text-white font-medium">
                {project.address || `${project.address_street}, ${project.address_city}`}
              </p>
              {(project.address_street || project.address_zip || project.address_city || project.address_country) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  {project.address_street && (
                    <div>
                      <p className="text-gray-400">Straße</p>
                      <p className="text-white">{project.address_street}</p>
                    </div>
                  )}
                  {(project.address_zip || project.address_city) && (
                    <div>
                      <p className="text-gray-400">PLZ/Ort</p>
                      <p className="text-white">{project.address_zip} {project.address_city}</p>
                    </div>
                  )}
                  {project.address_country && (
                    <div>
                      <p className="text-gray-400">Land</p>
                      <p className="text-white">{project.address_country}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Projektdetails */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Zeitplan */}
            <div className="bg-white/5 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-[#ffbd59]" />
                Zeitplan
              </h3>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-400 mb-1">Startdatum</p>
                  <p className="text-white font-medium">{formatDate(project.start_date)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400 mb-1">Enddatum</p>
                  <p className="text-white font-medium">{formatDate(project.end_date)}</p>
                </div>
                {project.estimated_duration && (
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Geschätzte Dauer</p>
                    <p className="text-white font-medium">{project.estimated_duration} Monate</p>
                  </div>
                )}
              </div>
            </div>

            {/* Flächen */}
            <div className="bg-white/5 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Ruler className="w-5 h-5 text-[#ffbd59]" />
                Flächen
              </h3>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-400 mb-1">Grundstücksgröße</p>
                  <p className="text-white font-medium">{formatArea(project.property_size)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400 mb-1">Baufläche</p>
                  <p className="text-white font-medium">{formatArea(project.construction_area)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Projekteinstellungen */}
          <div className="bg-white/5 rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Projekteinstellungen</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Öffentliches Projekt</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    project.is_public 
                      ? 'bg-green-500/20 text-green-400' 
                      : 'bg-red-500/20 text-red-400'
                  }`}>
                    {project.is_public ? 'Ja' : 'Nein'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Angebote erlaubt</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    project.allow_quotes 
                      ? 'bg-green-500/20 text-green-400' 
                      : 'bg-red-500/20 text-red-400'
                  }`}>
                    {project.allow_quotes ? 'Ja' : 'Nein'}
                  </span>
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-400 mb-1">Erstellt am</p>
                  <p className="text-white font-medium">{formatDate(project.created_at)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400 mb-1">Zuletzt aktualisiert</p>
                  <p className="text-white font-medium">{formatDate(project.updated_at)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}






