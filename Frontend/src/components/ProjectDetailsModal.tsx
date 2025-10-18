import React, { useState, useEffect } from 'react';
import { X, MapPin, Calendar, DollarSign, Ruler, Building2, Clock, Eye, Edit, ChevronDown, ChevronUp } from 'lucide-react';
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
  const [isMobile, setIsMobile] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    description: true,
    status: true,
    finance: true,
    location: true,
    timeline: true,
    areas: true,
    settings: true
  });
  
  // Mobile Detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };
  
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

  // Mobile Bottom Sheet Animation Helper
  const CollapsibleSection = ({ 
    title, 
    icon: Icon, 
    sectionKey, 
    children 
  }: { 
    title: string; 
    icon: React.ElementType; 
    sectionKey: string; 
    children: React.ReactNode;
  }) => {
    const isExpanded = expandedSections[sectionKey];
    
    return (
      <div className="bg-white/5 rounded-2xl overflow-hidden">
        <button
          onClick={() => toggleSection(sectionKey)}
          className="w-full px-4 md:px-6 py-4 flex items-center justify-between hover:bg-white/10 transition-colors touch-manipulation active:scale-[0.98]"
        >
          <div className="flex items-center gap-3">
            <Icon className="w-5 h-5 text-[#ffbd59] flex-shrink-0" />
            <h3 className="text-base md:text-lg font-semibold text-white text-left">{title}</h3>
          </div>
          {isMobile && (
            isExpanded ? 
              <ChevronUp className="w-5 h-5 text-gray-400 flex-shrink-0" /> : 
              <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
          )}
        </button>
        {(!isMobile || isExpanded) && (
          <div className="px-4 md:px-6 pb-4 md:pb-6">
            {children}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[10000] bg-black/50 backdrop-blur-sm flex items-end md:items-center justify-center md:p-4">
      <div className={`
        bg-white/10 backdrop-blur-lg border border-white/20 shadow-2xl w-full
        ${isMobile 
          ? 'rounded-t-3xl max-h-[92vh] animate-slideUp' 
          : 'rounded-3xl max-w-4xl max-h-[90vh]'
        }
        overflow-y-auto
      `}>
        {/* Header - Sticky auf Mobile */}
        <div className="sticky top-0 bg-white/5 backdrop-blur-md rounded-t-3xl px-4 py-4 md:p-6 border-b border-white/10 z-10">
          <div className="flex items-center justify-between">
            {/* Mobile: Kompakterer Header */}
            <div className="flex items-center gap-2 md:gap-4 flex-1 min-w-0">
              <div className={`
                bg-gradient-to-br from-[#ffbd59] to-[#ffa726] rounded-xl flex items-center justify-center flex-shrink-0
                ${isMobile ? 'w-10 h-10' : 'w-12 h-12'}
              `}>
                <Building2 className={`text-white ${isMobile ? 'w-5 h-5' : 'w-6 h-6'}`} />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className={`font-bold text-white truncate ${isMobile ? 'text-lg' : 'text-2xl'}`}>
                  {project.name}
                </h2>
                <p className="text-gray-300 text-sm truncate">{getProjectTypeLabel(project.project_type)}</p>
              </div>
            </div>
            
            {/* Mobile: Icon-Only Buttons */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {onEdit && (
                <button
                  onClick={onEdit}
                  className={`
                    rounded-lg font-medium transition-all flex items-center gap-2 
                    bg-white/10 hover:bg-white/20 active:scale-95 text-white
                    touch-manipulation
                    ${isMobile ? 'p-2' : 'px-4 py-2'}
                  `}
                  title="Projekt bearbeiten"
                >
                  <Edit size={isMobile ? 18 : 16} />
                  {!isMobile && <span>Bearbeiten</span>}
                </button>
              )}
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-white/10 active:scale-95 transition-all touch-manipulation"
              >
                <X className={`text-white ${isMobile ? 'w-5 h-5' : 'w-6 h-6'}`} />
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-3 md:p-6 space-y-3 md:space-y-6">
          {/* Beschreibung */}
          <CollapsibleSection title="Projektbeschreibung" icon={Eye} sectionKey="description">
            <p className="text-gray-200 leading-relaxed text-sm md:text-base">
              {project.description || 'Keine Beschreibung verfügbar'}
            </p>
          </CollapsibleSection>

          {/* Mobile: Separate Sections für Status & Finanzen */}
          <CollapsibleSection title="Status & Fortschritt" icon={Clock} sectionKey="status">
            <div className="space-y-4">
              <div>
                <p className="text-xs md:text-sm text-gray-400 mb-1">
                  {isBautraeger() && project.construction_phase ? 'Bauphase' : 'Status'}
                </p>
                <p className="text-white font-medium text-sm md:text-base">
                  {isBautraeger() && project.construction_phase 
                    ? getConstructionPhaseLabel(project.construction_phase)
                    : getStatusLabel(project.status)
                  }
                </p>
              </div>
              <div>
                <p className="text-xs md:text-sm text-gray-400 mb-1">Fortschritt</p>
                <div className="flex items-center gap-3">
                  <div className="flex-1 bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-[#ffbd59] to-[#ffa726] h-2 rounded-full transition-all duration-300"
                      style={{ width: `${project.progress_percentage}%` }}
                    />
                  </div>
                  <span className="text-white font-medium text-sm md:text-base">{project.progress_percentage}%</span>
                </div>
              </div>
              {!isBautraeger() && project.construction_phase && (
                <div>
                  <p className="text-xs md:text-sm text-gray-400 mb-1">Bauphase</p>
                  <p className="text-white font-medium text-sm md:text-base">{getConstructionPhaseLabel(project.construction_phase)}</p>
                </div>
              )}
            </div>
          </CollapsibleSection>

          <CollapsibleSection title="Finanzen" icon={DollarSign} sectionKey="finance">
            <div className="space-y-4">
              {isBautraeger() && (
                <div>
                  <p className="text-xs md:text-sm text-gray-400 mb-1">Budget</p>
                  <p className="text-white font-medium text-sm md:text-base">{formatCurrency(project.budget)}</p>
                </div>
              )}
              <div>
                <p className="text-xs md:text-sm text-gray-400 mb-1">Aktuelle Kosten</p>
                <p className="text-white font-medium text-sm md:text-base">{formatCurrency(project.current_costs)}</p>
              </div>
              {isBautraeger() && project.budget && project.current_costs && (
                <div>
                  <p className="text-xs md:text-sm text-gray-400 mb-1">Verbleibend</p>
                  <p className={`font-medium text-sm md:text-base ${project.current_costs > project.budget ? 'text-red-400' : 'text-green-400'}`}>
                    {formatCurrency(project.budget - project.current_costs)}
                  </p>
                </div>
              )}
            </div>
          </CollapsibleSection>

          {/* Adresse */}
          <CollapsibleSection title="Projektstandort" icon={MapPin} sectionKey="location">
            <div className="space-y-3">
              <p className="text-white font-medium text-sm md:text-base">
                {project.address || `${project.address_street}, ${project.address_city}`}
              </p>
              {(project.address_street || project.address_zip || project.address_city || project.address_country) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 text-xs md:text-sm">
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
          </CollapsibleSection>

          {/* Zeitplan */}
          <CollapsibleSection title="Zeitplan" icon={Calendar} sectionKey="timeline">
            <div className="space-y-3 md:space-y-4">
              <div>
                <p className="text-xs md:text-sm text-gray-400 mb-1">Startdatum</p>
                <p className="text-white font-medium text-sm md:text-base">{formatDate(project.start_date)}</p>
              </div>
              <div>
                <p className="text-xs md:text-sm text-gray-400 mb-1">Enddatum</p>
                <p className="text-white font-medium text-sm md:text-base">{formatDate(project.end_date)}</p>
              </div>
              {project.estimated_duration && (
                <div>
                  <p className="text-xs md:text-sm text-gray-400 mb-1">Geschätzte Dauer</p>
                  <p className="text-white font-medium text-sm md:text-base">{project.estimated_duration} Monate</p>
                </div>
              )}
            </div>
          </CollapsibleSection>

          {/* Flächen */}
          <CollapsibleSection title="Flächen" icon={Ruler} sectionKey="areas">
            <div className="space-y-3 md:space-y-4">
              <div>
                <p className="text-xs md:text-sm text-gray-400 mb-1">Grundstücksgröße</p>
                <p className="text-white font-medium text-sm md:text-base">{formatArea(project.property_size)}</p>
              </div>
              <div>
                <p className="text-xs md:text-sm text-gray-400 mb-1">Baufläche</p>
                <p className="text-white font-medium text-sm md:text-base">{formatArea(project.construction_area)}</p>
              </div>
            </div>
          </CollapsibleSection>

          {/* Projekteinstellungen */}
          <CollapsibleSection title="Projekteinstellungen" icon={Building2} sectionKey="settings">
            <div className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-300 text-sm md:text-base">Öffentliches Projekt</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    project.is_public 
                      ? 'bg-green-500/20 text-green-400' 
                      : 'bg-red-500/20 text-red-400'
                  }`}>
                    {project.is_public ? 'Ja' : 'Nein'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-300 text-sm md:text-base">Angebote erlaubt</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    project.allow_quotes 
                      ? 'bg-green-500/20 text-green-400' 
                      : 'bg-red-500/20 text-red-400'
                  }`}>
                    {project.allow_quotes ? 'Ja' : 'Nein'}
                  </span>
                </div>
              </div>
              <div className="space-y-3 pt-3 border-t border-white/10">
                <div>
                  <p className="text-xs md:text-sm text-gray-400 mb-1">Erstellt am</p>
                  <p className="text-white font-medium text-sm md:text-base">{formatDate(project.created_at)}</p>
                </div>
                <div>
                  <p className="text-xs md:text-sm text-gray-400 mb-1">Zuletzt aktualisiert</p>
                  <p className="text-white font-medium text-sm md:text-base">{formatDate(project.updated_at)}</p>
                </div>
              </div>
            </div>
          </CollapsibleSection>
        </div>
      </div>
    </div>
  );
}






