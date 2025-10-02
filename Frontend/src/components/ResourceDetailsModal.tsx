import React from 'react';
import { X, Calendar, MapPin, Euro, Users, Clock, Edit, Trash2, AlertCircle } from 'lucide-react';

interface ResourceDetailsModalProps {
  resource: any;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  isAllocated?: boolean;
  allocationDetails?: any;
  translateCategory: (category: string) => string;
  translateSubcategory: (subcategory: string) => string;
}

const ResourceDetailsModal: React.FC<ResourceDetailsModalProps> = ({
  resource,
  isOpen,
  onClose,
  onEdit,
  onDelete,
  isAllocated = false,
  allocationDetails,
  translateCategory,
  translateSubcategory
}) => {
  if (!isOpen || !resource) return null;

  const personDays = Math.ceil(
    (new Date(resource.end_date).getTime() - new Date(resource.start_date).getTime()) / 
    (1000 * 60 * 60 * 24)
  ) * (resource.person_count || 1);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-DE', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-DE', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1a1d2e] rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-white/10">
        {/* Header */}
        <div className="sticky top-0 bg-[#1a1d2e] border-b border-white/10 p-6 flex items-center justify-between z-10">
          <div>
            <h2 className="text-2xl font-bold text-white">Ressource Details</h2>
            <p className="text-sm text-gray-400 mt-1">
              {resource.title || `${resource.person_count} ${translateCategory(resource.category)}`}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Allocation Warning */}
          {isAllocated && (
            <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-yellow-400 font-medium text-sm">
                  Diese Ressource wurde bereits einem Bauträger zugeordnet
                </p>
                <p className="text-yellow-300 text-xs mt-1">
                  Bearbeiten und Löschen ist nicht mehr möglich.
                </p>
              </div>
            </div>
          )}

          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-purple-400" />
              Grundinformationen
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                <label className="text-xs text-gray-400 uppercase tracking-wide">Titel</label>
                <p className="text-white font-medium mt-1">{resource.title || 'Kein Titel'}</p>
              </div>
              <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                <label className="text-xs text-gray-400 uppercase tracking-wide">Kategorie</label>
                <p className="text-white font-medium mt-1">
                  {translateCategory(resource.category)}
                  {resource.subcategory && (
                    <span className="text-gray-400 text-sm ml-2">
                      ({translateSubcategory(resource.subcategory)})
                    </span>
                  )}
                </p>
              </div>
              <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                <label className="text-xs text-gray-400 uppercase tracking-wide">Anzahl Personen</label>
                <p className="text-white font-medium mt-1">{resource.person_count}</p>
              </div>
              <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                <label className="text-xs text-gray-400 uppercase tracking-wide">Status</label>
                <p className="text-white font-medium mt-1">
                  <span className={`inline-flex items-center px-2 py-1 rounded text-xs ${
                    resource.status === 'available' ? 'bg-green-500/20 text-green-400' :
                    resource.status === 'allocated' ? 'bg-blue-500/20 text-blue-400' :
                    resource.status === 'unavailable' ? 'bg-red-500/20 text-red-400' :
                    'bg-gray-500/20 text-gray-400'
                  }`}>
                    {resource.status === 'available' ? 'Verfügbar' :
                     resource.status === 'allocated' ? 'Zugewiesen' :
                     resource.status === 'unavailable' ? 'Nicht verfügbar' :
                     resource.status}
                  </span>
                </p>
              </div>
            </div>
          </div>

          {/* Time Period */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-purple-400" />
              Zeitraum
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                <label className="text-xs text-gray-400 uppercase tracking-wide">Startdatum</label>
                <p className="text-white font-medium mt-1">{formatDate(resource.start_date)}</p>
              </div>
              <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                <label className="text-xs text-gray-400 uppercase tracking-wide">Enddatum</label>
                <p className="text-white font-medium mt-1">{formatDate(resource.end_date)}</p>
              </div>
              <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                <label className="text-xs text-gray-400 uppercase tracking-wide">Personentage</label>
                <p className="text-white font-medium mt-1">{personDays}</p>
              </div>
            </div>
          </div>

          {/* Work Hours */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-purple-400" />
              Arbeitszeit
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                <label className="text-xs text-gray-400 uppercase tracking-wide">Tägliche Stunden</label>
                <p className="text-white font-medium mt-1">{resource.daily_hours || 8} Stunden</p>
              </div>
              <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                <label className="text-xs text-gray-400 uppercase tracking-wide">Gesamt Stunden</label>
                <p className="text-white font-medium mt-1">{resource.total_hours || personDays * 8} Stunden</p>
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <MapPin className="w-5 h-5 text-purple-400" />
              Standort
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                <label className="text-xs text-gray-400 uppercase tracking-wide">Straße</label>
                <p className="text-white font-medium mt-1">{resource.address_street || 'Nicht angegeben'}</p>
              </div>
              <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                <label className="text-xs text-gray-400 uppercase tracking-wide">PLZ</label>
                <p className="text-white font-medium mt-1">{resource.address_postal_code || 'Nicht angegeben'}</p>
              </div>
              <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                <label className="text-xs text-gray-400 uppercase tracking-wide">Stadt</label>
                <p className="text-white font-medium mt-1">{resource.address_city || 'Nicht angegeben'}</p>
              </div>
              <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                <label className="text-xs text-gray-400 uppercase tracking-wide">Land</label>
                <p className="text-white font-medium mt-1">{resource.address_country || 'Deutschland'}</p>
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Euro className="w-5 h-5 text-purple-400" />
              Preise
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                <label className="text-xs text-gray-400 uppercase tracking-wide">Stundensatz</label>
                <p className="text-white font-medium mt-1">
                  {resource.hourly_rate ? `${resource.hourly_rate} €/h` : 'Nicht angegeben'}
                </p>
              </div>
              <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                <label className="text-xs text-gray-400 uppercase tracking-wide">Tagessatz</label>
                <p className="text-white font-medium mt-1">
                  {resource.daily_rate ? `${resource.daily_rate} €/Tag` : 'Nicht angegeben'}
                </p>
              </div>
            </div>
          </div>

          {/* Description */}
          {resource.description && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">Beschreibung</h3>
              <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                <p className="text-gray-300 text-sm whitespace-pre-wrap">{resource.description}</p>
              </div>
            </div>
          )}

          {/* Skills */}
          {resource.skills && resource.skills.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">Fähigkeiten</h3>
              <div className="flex flex-wrap gap-2">
                {resource.skills.map((skill: string, index: number) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full text-xs font-medium border border-purple-500/30"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Equipment */}
          {resource.equipment && resource.equipment.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">Ausrüstung</h3>
              <div className="flex flex-wrap gap-2">
                {resource.equipment.map((item: string, index: number) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-xs font-medium border border-blue-500/30"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Allocation Details */}
          {isAllocated && allocationDetails && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">Zuordnung</h3>
              <div className="p-4 bg-[#ffbd59]/10 border border-[#ffbd59]/30 rounded-lg space-y-3">
                <div>
                  <label className="text-xs text-gray-400 uppercase tracking-wide">Ausschreibung</label>
                  <p className="text-white font-medium mt-1">
                    {allocationDetails.trade?.title || `#${allocationDetails.trade_id}`}
                  </p>
                </div>
                {allocationDetails.bautraeger && (
                  <div>
                    <label className="text-xs text-gray-400 uppercase tracking-wide">Bauträger</label>
                    <p className="text-white font-medium mt-1">
                      {allocationDetails.bautraeger.first_name} {allocationDetails.bautraeger.last_name}
                      {allocationDetails.bautraeger.company_name && (
                        <span className="text-gray-400 ml-2">({allocationDetails.bautraeger.company_name})</span>
                      )}
                    </p>
                  </div>
                )}
                <div>
                  <label className="text-xs text-gray-400 uppercase tracking-wide">Allokationszeitraum</label>
                  <p className="text-white font-medium mt-1">
                    {formatDate(allocationDetails.allocated_start_date)} - {formatDate(allocationDetails.allocated_end_date)}
                  </p>
                </div>
                <div>
                  <label className="text-xs text-gray-400 uppercase tracking-wide">Zugewiesene Personen</label>
                  <p className="text-white font-medium mt-1">{allocationDetails.allocated_person_count}</p>
                </div>
              </div>
            </div>
          )}

          {/* Metadata */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Metadaten</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                <label className="text-xs text-gray-400 uppercase tracking-wide">Erstellt am</label>
                <p className="text-white font-medium mt-1">{formatDateTime(resource.created_at)}</p>
              </div>
              <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                <label className="text-xs text-gray-400 uppercase tracking-wide">Aktualisiert am</label>
                <p className="text-white font-medium mt-1">{formatDateTime(resource.updated_at)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-[#1a1d2e] border-t border-white/10 p-6 flex items-center justify-between">
          <div className="flex gap-3">
            {!isAllocated && onEdit && (
              <button
                onClick={onEdit}
                className="px-4 py-2 bg-purple-500/20 text-purple-300 rounded-lg hover:bg-purple-500/30 transition-colors font-medium border border-purple-500/30 flex items-center gap-2"
              >
                <Edit className="w-4 h-4" />
                Bearbeiten
              </button>
            )}
            {!isAllocated && onDelete && (
              <button
                onClick={onDelete}
                className="px-4 py-2 bg-red-500/20 text-red-300 rounded-lg hover:bg-red-500/30 transition-colors font-medium border border-red-500/30 flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Löschen
              </button>
            )}
          </div>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors font-medium"
          >
            Schließen
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResourceDetailsModal;

