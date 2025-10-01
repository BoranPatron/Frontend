import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  Calendar,
  Clock,
  MapPin,
  Eye,
  EyeOff,
  Info,
  Edit,
  Trash2,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  Building,
  Phone,
  Mail,
  Settings
} from 'lucide-react';
import { Resource } from '../api/resourceService';
import dayjs from 'dayjs';

interface EnhancedResourceCardProps {
  resource: Resource;
  onEdit?: (resource: Resource) => void;
  onDelete?: (resourceId: number) => void;
  className?: string;
}

// Tooltip-Komponente
const Tooltip: React.FC<{ content: string | React.ReactNode; children: React.ReactNode }> = ({ 
  content, 
  children 
}) => {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className="relative inline-block">
      <div
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
      >
        {children}
      </div>
      {isVisible && (
        <div className="absolute z-50 px-3 py-2 text-sm text-white bg-gray-900 rounded shadow-lg border border-gray-600 w-80 bottom-full left-1/2 transform -translate-x-1/2 mb-1">
          <div className="whitespace-normal break-words">
            {content}
          </div>
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-2 h-2 bg-gray-900 border border-gray-600 rotate-45 -mt-1"></div>
        </div>
      )}
    </div>
  );
};

const EnhancedResourceCard: React.FC<EnhancedResourceCardProps> = ({
  resource,
  onEdit,
  onDelete,
  className = ''
}) => {
  const [showDetails, setShowDetails] = useState(false);

  // Berechne Ressourcennutzung
  const calculateResourceUtilization = () => {
    if (!resource.builder_preferred_start_date || !resource.builder_preferred_end_date) {
      return null;
    }

    const totalDays = Math.ceil(dayjs(resource.end_date).diff(dayjs(resource.start_date), 'day') + 1);
    const usedDays = Math.ceil(dayjs(resource.builder_preferred_end_date).diff(dayjs(resource.builder_preferred_start_date), 'day') + 1);
    
    return {
      percentage: Math.round((usedDays / totalDays) * 100),
      totalDays,
      usedDays
    };
  };

  const utilization = calculateResourceUtilization();

  // Status-Badge Farben
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-green-500/20 text-green-400';
      case 'allocated':
        return 'bg-red-500/20 text-red-400';
      case 'reserved':
        return 'bg-yellow-500/20 text-yellow-400';
      default:
        return 'bg-gray-500/20 text-gray-400';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'available':
        return 'Verfügbar';
      case 'allocated':
        return 'Angezogen';
      case 'reserved':
        return 'Reserviert';
      default:
        return 'Unbekannt';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-[#2a2a2a] rounded-lg border border-gray-700 hover:border-gray-600 transition-all duration-300 overflow-hidden ${className}`}
    >
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-lg font-semibold text-white">
                {resource.person_count} {resource.category}
              </h3>
              
              {/* Status Badge */}
              <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${getStatusColor(resource.status || 'available')}`}>
                {getStatusLabel(resource.status || 'available')}
              </span>

              {/* Angezogen Badge */}
              {resource.status === 'allocated' && (
                <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-[#ffbd59]/20 text-[#ffbd59]">
                  🔥 Angezogen
                </span>
              )}

              {/* Builder Notes Badge */}
              {resource.builder_date_range_notes && (
                <Tooltip content={`Bauträger-Notizen: ${resource.builder_date_range_notes}`}>
                  <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-500/20 text-blue-400 cursor-help">
                    💬
                  </span>
                </Tooltip>
              )}
            </div>

            {/* Grundinformationen */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
              <div className="flex items-center gap-2 text-gray-400">
                <Users className="w-4 h-4" />
                <span>
                  {resource.address_city || 'Uster'} • ab {dayjs(resource.start_date).format('DD.MM.YYYY')}
                </span>
              </div>
              
              <div className="flex items-center gap-2 text-gray-400">
                <Calendar className="w-4 h-4" />
                <span>
                  {dayjs(resource.start_date).format('DD.MM')} - {dayjs(resource.end_date).format('DD.MM.YYYY')}
                </span>
              </div>
              
              <div className="flex items-center gap-2 text-gray-400">
                <Clock className="w-4 h-4" />
                <span>{resource.total_hours}h</span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[#ffbd59] font-semibold">
                  {utilization ? `${utilization.percentage}%` : `${Math.ceil((dayjs(resource.end_date).diff(dayjs(resource.start_date), 'day') + 1) * resource.person_count)} Personentage`}
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 ml-4">
            {onEdit && (
              <button
                onClick={() => onEdit(resource)}
                className="p-2 text-gray-400 hover:text-white hover:bg-[#333] rounded transition-colors"
                title="Bearbeiten"
              >
                <Edit className="w-4 h-4" />
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => onDelete(resource.id!)}
                className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                title="Löschen"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Ressourcennutzung durch Bauträger */}
        {utilization && (
          <div className="mb-3 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span className="text-sm text-blue-300 font-medium">Ressourcennutzung durch Bauträger</span>
              </div>
              <span className="text-sm text-[#ffbd59] font-semibold">
                {utilization.percentage}%
              </span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs mb-3">
              <div>
                <span className="text-gray-400">Dienstleister bereit:</span>
                <div className="text-blue-300">
                  {dayjs(resource.start_date).format('DD.MM.YY')} - {dayjs(resource.end_date).format('DD.MM.YY')}
                  <div className="text-gray-500">({utilization.totalDays} Tage)</div>
                </div>
              </div>
              <div>
                <span className="text-gray-400">Bauträger wünscht:</span>
                <div className="text-[#ffbd59]">
                  {dayjs(resource.builder_preferred_start_date).format('DD.MM.YY')} - {dayjs(resource.builder_preferred_end_date).format('DD.MM.YY')}
                  <div className="text-gray-500">({utilization.usedDays} Tage)</div>
                </div>
              </div>
              <div>
                <span className="text-gray-400">Nutzungsgrad:</span>
                <div className="text-green-400 font-medium">
                  {utilization.percentage}% genutzt
                </div>
              </div>
            </div>

            {/* Fortschrittsbalken */}
            <div className="mb-3">
              <div className="w-full bg-gray-600 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-green-400 to-[#ffbd59] h-2 rounded-full transition-all"
                  style={{ width: `${utilization.percentage}%` }}
                ></div>
              </div>
            </div>

            {/* Bauträger-Notizen */}
            {resource.builder_date_range_notes && (
              <div className="p-2 bg-blue-600/10 border border-blue-600/20 rounded">
                <div className="text-xs text-blue-300 font-medium mb-1">💬 Bauträger-Notizen:</div>
                <div className="text-xs text-gray-300">{resource.builder_date_range_notes}</div>
              </div>
            )}
          </div>
        )}

        {/* Details Button */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-400 hover:text-white bg-[#333] hover:bg-[#444] rounded transition-colors"
          >
            {showDetails ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            Details
            {showDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {/* Info Badges */}
          <div className="flex gap-1">
            {resource.provider_languages && (
              <Tooltip content={`Sprachen: ${resource.provider_languages}`}>
                <div className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs cursor-help">
                  🌐
                </div>
              </Tooltip>
            )}
            {resource.description && resource.description.length > 50 && (
              <Tooltip content="Ausführliche Beschreibung verfügbar">
                <div className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded text-xs cursor-help">
                  📋
                </div>
              </Tooltip>
            )}
          </div>
        </div>

        {/* Erweiterte Details */}
        <AnimatePresence>
          {showDetails && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-3 pt-3 border-t border-gray-600"
            >
              <div className="space-y-4">
                {/* Kontaktinformationen */}
                {(resource.provider_company_name || resource.provider_email || resource.provider_phone || resource.provider_company_address) && (
                  <div>
                    <div className="text-xs text-[#ffbd59] font-medium mb-2">📞 Kontakt</div>
                    <div className="space-y-1 text-xs">
                      {resource.provider_company_name && (
                        <div className="flex items-center gap-2">
                          <Building className="w-3 h-3 text-gray-400" />
                          <span className="text-gray-300">{resource.provider_company_name}</span>
                        </div>
                      )}
                      {resource.provider_email && (
                        <div className="flex items-center gap-2">
                          <Mail className="w-3 h-3 text-gray-400" />
                          <span className="text-gray-300">{resource.provider_email}</span>
                        </div>
                      )}
                      {resource.provider_phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="w-3 h-3 text-gray-400" />
                          <span className="text-gray-300">{resource.provider_phone}</span>
                        </div>
                      )}
                      {resource.provider_company_address && (
                        <div className="flex items-center gap-2">
                          <MapPin className="w-3 h-3 text-gray-400" />
                          <span className="text-gray-300">{resource.provider_company_address}</span>
                        </div>
                      )}
                      {resource.provider_company_website && (
                        <div className="flex items-center gap-2">
                          <Settings className="w-3 h-3 text-gray-400" />
                          <span className="text-gray-300">{resource.provider_company_website}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Zeitraum-Details */}
                {utilization && (
                  <div>
                    <div className="text-xs text-[#ffbd59] font-medium mb-2">📅 Zeitraum-Details</div>
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Dienstleister verfügbar:</span>
                        <span className="text-blue-300">
                          {dayjs(resource.start_date).format('DD.MM.YY')} - {dayjs(resource.end_date).format('DD.MM.YY')}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Bauträger wünscht:</span>
                        <span className="text-[#ffbd59]">
                          {dayjs(resource.builder_preferred_start_date).format('DD.MM.YY')} - {dayjs(resource.builder_preferred_end_date).format('DD.MM.YY')}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Nutzungsgrad:</span>
                        <span className="text-green-400 font-medium">
                          {utilization.percentage}%
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Beschreibung */}
                {resource.description && (
                  <div>
                    <div className="text-xs text-[#ffbd59] font-medium mb-2">📋 Beschreibung</div>
                    <div className="text-gray-300 text-xs leading-relaxed">
                      {resource.description}
                    </div>
                  </div>
                )}

                {/* Sprachen */}
                {resource.provider_languages && (
                  <div>
                    <div className="text-xs text-[#ffbd59] font-medium mb-2">🌐 Sprachen</div>
                    <div className="text-gray-300 text-xs">
                      {resource.provider_languages}
                    </div>
                  </div>
                )}

                {/* Skills */}
                {resource.skills && resource.skills.length > 0 && (
                  <div>
                    <div className="text-xs text-[#ffbd59] font-medium mb-2">🏆 Fähigkeiten</div>
                    <div className="flex flex-wrap gap-1">
                      {resource.skills.map((skill, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-[#333] text-gray-300 rounded text-xs"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Equipment */}
                {resource.equipment && resource.equipment.length > 0 && (
                  <div>
                    <div className="text-xs text-[#ffbd59] font-medium mb-2">🔧 Ausrüstung</div>
                    <div className="flex flex-wrap gap-1">
                      {resource.equipment.map((item, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-[#333] text-gray-300 rounded text-xs"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default EnhancedResourceCard;

