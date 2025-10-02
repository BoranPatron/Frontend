import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  ChevronLeft,
  ChevronRight,
  Users,
  Search,
  Filter,
  MapPin,
  Calendar,
  Clock,
  Euro,
  Star,
  CheckCircle,
  AlertCircle,
  X,
  Plus,
  Trash2,
  GripVertical,
  Eye,
  EyeOff,
  Send,
  Info,
  Building,
  Phone,
  Mail,
  Settings,
  ChevronDown,
  HelpCircle
} from 'lucide-react';
import { resourceService, type Resource, type ResourceAllocation } from '../api/resourceService';
import { useAuth } from '../context/AuthContext';
import { getBrowserLocation } from '../api/geoService';
import dayjs from 'dayjs';

interface ResourceSelectionPanelProps {
  isOpen: boolean;
  onToggle: () => void;
  tradeId: number;
  category: string;
  preferredDateRange?: { start: string; end: string };
  onResourcesSelected?: (allocations: ResourceAllocation[], resources: Resource[]) => void;
  className?: string;
}

interface ResourceDateRange {
  resourceId: number;
  startDate: string;
  endDate: string;
  notes?: string;
}

interface DraggableResourceProps {
  resource: Resource;
  isSelected: boolean;
  onToggleSelect: () => void;
  onRemove: () => void;
  onDateRangeChange?: (resourceId: number, startDate: string, endDate: string, notes?: string) => void;
  individualDateRange?: ResourceDateRange;
}

// Tooltip-Komponente mit besserer Positionierung
const Tooltip: React.FC<{ content: string | React.ReactNode; children: React.ReactNode; position?: 'top' | 'bottom' | 'left' | 'right' }> = ({ 
  content, 
  children, 
  position = 'top' 
}) => {
  const [isVisible, setIsVisible] = useState(false);

  const getTooltipClasses = () => {
    const baseClasses = "absolute z-[99999] px-4 py-3 text-sm text-white bg-gray-900 rounded shadow-lg border border-gray-600 w-96";
    
    switch (position) {
      case 'top':
        return `${baseClasses} bottom-full left-1/2 transform -translate-x-1/2 mb-1`;
      case 'bottom':
        return `${baseClasses} top-full left-1/2 transform -translate-x-1/2 mt-1`;
      case 'left':
        return `${baseClasses} right-full top-1/2 transform -translate-y-1/2 mr-1`;
      case 'right':
        return `${baseClasses} left-full top-1/2 transform -translate-y-1/2 ml-1`;
      default:
        return `${baseClasses} bottom-full left-1/2 transform -translate-x-1/2 mb-1`;
    }
  };

  const getArrowClasses = () => {
    const baseClasses = "absolute w-2 h-2 bg-gray-900 border border-gray-600";
    
    switch (position) {
      case 'top':
        return `${baseClasses} top-full left-1/2 transform -translate-x-1/2 rotate-45 -mt-1`;
      case 'bottom':
        return `${baseClasses} bottom-full left-1/2 transform -translate-x-1/2 rotate-45 -mb-1`;
      case 'left':
        return `${baseClasses} left-full top-1/2 transform -translate-y-1/2 rotate-45 -ml-1`;
      case 'right':
        return `${baseClasses} right-full top-1/2 transform -translate-y-1/2 rotate-45 -mr-1`;
      default:
        return `${baseClasses} top-full left-1/2 transform -translate-x-1/2 rotate-45 -mt-1`;
    }
  };

  return (
    <div className="relative inline-block">
      <div
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
      >
        {children}
      </div>
      {isVisible && (
        <div className={getTooltipClasses()}>
          <div className="whitespace-normal break-words">
            {content}
          </div>
          <div className={getArrowClasses()}></div>
        </div>
      )}
    </div>
  );
};

// Sortable Resource Item
const SortableResourceItem: React.FC<DraggableResourceProps & { id: string }> = ({
  id,
  resource,
  isSelected,
  onToggleSelect,
  onRemove,
  onDateRangeChange,
  individualDateRange
}) => {
  const [showDateInput, setShowDateInput] = useState(false);
  const [showContactInfo, setShowContactInfo] = useState(false);
  const [localDateRange, setLocalDateRange] = useState({
    start: individualDateRange?.startDate || '',
    end: individualDateRange?.endDate || '',
    notes: individualDateRange?.notes || ''
  });
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-[#333] rounded-lg p-4 border transition-all ${
        isSelected ? 'border-[#ffbd59] bg-[#ffbd59]/10' : 'border-gray-700'
      } ${isDragging ? 'shadow-xl z-50' : ''}`}
    >
      <div className="flex items-start space-x-3">
        {/* Drag Handle */}
        <div
          {...attributes}
          {...listeners}
          className="mt-1 cursor-move hover:text-[#ffbd59] transition-colors"
        >
          <GripVertical className="w-4 h-4 text-gray-500" />
        </div>

        {/* Resource Info */}
        <div className="flex-1">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h4 className="text-sm font-semibold text-white">
                {resource.provider_name || 'Dienstleister'}
              </h4>
              <div className="flex items-center space-x-2 mt-1">
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                  resource.status === 'available' 
                    ? 'bg-green-500/20 text-green-400' 
                    : 'bg-gray-500/20 text-gray-400'
                }`}>
                  {resource.status === 'available' ? 'Verfügbar' : 'Reserviert'}
                </span>
                <span className="text-xs text-gray-400">
                  {resource.category}
                </span>
                {(!resource.latitude || !resource.longitude) && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-500/20 text-yellow-400">
                    📍 Kein Standort
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={onRemove}
              className="p-1 hover:bg-red-500/20 rounded transition-colors"
            >
              <X className="w-4 h-4 text-red-400" />
            </button>
          </div>

          {/* Basic Details */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <Tooltip content={`${resource.person_count} Person${resource.person_count !== 1 ? 'en' : ''} verfügbar für diesen Zeitraum`}>
              <div className="flex items-center space-x-1 cursor-help">
                <Users className="w-3 h-3 text-gray-400" />
                <span className="text-gray-300">{resource.person_count} Personen</span>
                <HelpCircle className="w-3 h-3 text-gray-500" />
              </div>
            </Tooltip>
            
            <Tooltip content={`Gesamtstunden: ${resource.total_hours}h (${resource.daily_hours || 8}h pro Tag × ${Math.ceil((dayjs(resource.end_date).diff(dayjs(resource.start_date), 'day') + 1))} Tage × ${resource.person_count} Personen)`}>
              <div className="flex items-center space-x-1 cursor-help">
                <Clock className="w-3 h-3 text-gray-400" />
                <span className="text-gray-300">{resource.total_hours}h</span>
                <HelpCircle className="w-3 h-3 text-gray-500" />
              </div>
            </Tooltip>
            
            <Tooltip content={`Verfügbar vom ${dayjs(resource.start_date).format('DD.MM.YYYY')} bis ${dayjs(resource.end_date).format('DD.MM.YYYY')} (${Math.ceil((dayjs(resource.end_date).diff(dayjs(resource.start_date), 'day') + 1))} Tage)`}>
              <div className="flex items-center space-x-1 cursor-help">
                <Calendar className="w-3 h-3 text-gray-400" />
                <span className="text-gray-300">
                  {dayjs(resource.start_date).format('DD.MM')} - 
                  {dayjs(resource.end_date).format('DD.MM')}
                </span>
                <HelpCircle className="w-3 h-3 text-gray-500" />
              </div>
            </Tooltip>
            
            {resource.hourly_rate && (
              <Tooltip content={`Stundensatz: ${resource.hourly_rate}€/h${resource.daily_rate ? ` | Tagessatz: ${resource.daily_rate}€/Tag` : ''}${resource.currency ? ` (${resource.currency})` : ''}`}>
                <div className="flex items-center space-x-1 cursor-help">
                  <Euro className="w-3 h-3 text-gray-400" />
                  <span className="text-gray-300">{resource.hourly_rate}€/h</span>
                  <HelpCircle className="w-3 h-3 text-gray-500" />
                </div>
              </Tooltip>
            )}
          </div>

          {/* Ressourcennutzung - Differenz zwischen tatsächlichen und gewünschten Zeiträumen */}
          {resource.builder_preferred_start_date && resource.builder_preferred_end_date && (
            <div className="mt-2 p-2 bg-blue-500/10 border border-blue-500/30 rounded-lg">
              <Tooltip content={
                <div className="max-w-80">
                  <div className="font-semibold text-white mb-2 text-sm">Ressourcennutzung</div>
                  <div className="text-sm space-y-2">
                    <div className="text-blue-300">
                      <strong>🔵 Dienstleister bereit:</strong><br/>
                      {dayjs(resource.start_date).format('DD.MM.YYYY')} - {dayjs(resource.end_date).format('DD.MM.YYYY')}<br/>
                      ({Math.ceil(dayjs(resource.end_date).diff(dayjs(resource.start_date), 'day') + 1)} Tage)
                    </div>
                    <div className="text-[#ffbd59]">
                      <strong>🟡 Bauträger wünscht:</strong><br/>
                      {dayjs(resource.builder_preferred_start_date).format('DD.MM.YYYY')} - {dayjs(resource.builder_preferred_end_date).format('DD.MM.YYYY')}<br/>
                      ({Math.ceil(dayjs(resource.builder_preferred_end_date).diff(dayjs(resource.builder_preferred_start_date), 'day') + 1)} Tage)
                    </div>
                    <div className="text-green-300">
                      <strong>📊 Nutzungsgrad:</strong><br/>
                      {(() => {
                        const totalDays = Math.ceil(dayjs(resource.end_date).diff(dayjs(resource.start_date), 'day') + 1);
                        const usedDays = Math.ceil(dayjs(resource.builder_preferred_end_date).diff(dayjs(resource.builder_preferred_start_date), 'day') + 1);
                        const utilization = Math.round((usedDays / totalDays) * 100);
                        return `${utilization}% der verfügbaren Zeit genutzt`;
                      })()}
                    </div>
                    {resource.builder_date_range_notes && (
                      <div className="text-gray-300">
                        <strong>💬 Notizen:</strong><br/>
                        {resource.builder_date_range_notes}
                      </div>
                    )}
                  </div>
                </div>
              }>
                <div className="flex items-center justify-between cursor-help">
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    <span className="text-xs text-blue-300 font-medium">Ressourcennutzung</span>
                  </div>
                  <span className="text-xs text-[#ffbd59] font-semibold">
                    {(() => {
                      const totalDays = Math.ceil(dayjs(resource.end_date).diff(dayjs(resource.start_date), 'day') + 1);
                      const usedDays = Math.ceil(dayjs(resource.builder_preferred_end_date).diff(dayjs(resource.builder_preferred_start_date), 'day') + 1);
                      return Math.round((usedDays / totalDays) * 100);
                    })()}%
                  </span>
                </div>
                <div className="mt-1">
                  <div className="w-full bg-gray-600 rounded-full h-1.5">
                    <div 
                      className="bg-gradient-to-r from-green-400 to-[#ffbd59] h-1.5 rounded-full transition-all"
                      style={{
                        width: `${(() => {
                          const totalDays = Math.ceil(dayjs(resource.end_date).diff(dayjs(resource.start_date), 'day') + 1);
                          const usedDays = Math.ceil(dayjs(resource.builder_preferred_end_date).diff(dayjs(resource.builder_preferred_start_date), 'day') + 1);
                          return Math.round((usedDays / totalDays) * 100);
                        })()}%`
                      }}
                    ></div>
                  </div>
                </div>
              </Tooltip>
            </div>
          )}

          {/* Details-Button */}
          <div className="mt-2 flex gap-2">
            <button
              onClick={() => setShowContactInfo(!showContactInfo)}
              className="flex-1 flex items-center justify-center space-x-1 text-xs text-gray-400 hover:text-gray-300 bg-[#2a2a2a] hover:bg-[#333] rounded px-2 py-1 transition-colors"
            >
              <Eye className="w-3 h-3" />
              <span>Details</span>
              <span className="text-[#ffbd59]">
                {showContactInfo ? '▼' : '▶'}
              </span>
            </button>
            
            {/* Zusätzliche Info-Badges */}
            <div className="flex gap-1">
              {resource.builder_date_range_notes && (
                <Tooltip content={`Bauträger-Notizen: ${resource.builder_date_range_notes}`}>
                  <div className="px-1.5 py-0.5 bg-blue-500/20 text-blue-400 rounded text-xs cursor-help">
                    💬
                  </div>
                </Tooltip>
              )}
              {resource.provider_languages && (
                <Tooltip content={`Sprachen: ${resource.provider_languages}`}>
                  <div className="px-1.5 py-0.5 bg-green-500/20 text-green-400 rounded text-xs cursor-help">
                    🌐
                  </div>
                </Tooltip>
              )}
              {resource.provider_bio && resource.provider_bio.length > 50 && (
                <Tooltip content="Ausführliche Beschreibung verfügbar">
                  <div className="px-1.5 py-0.5 bg-purple-500/20 text-purple-400 rounded text-xs cursor-help">
                    📋
                  </div>
                </Tooltip>
              )}
            </div>
          </div>
            
          {/* Erweiterte Details */}
          {showContactInfo && (
            <div className="mt-2 pt-2 border-t border-gray-600">
              <div className="space-y-3">
                {/* Kontaktinformationen */}
                <div>
                  <div className="text-xs text-[#ffbd59] font-medium mb-1">📞 Kontakt</div>
                  <div className="space-y-1 text-xs">
                    {resource.provider_company_name && (
                      <div className="flex items-center space-x-1">
                        <Building className="w-3 h-3 text-gray-400" />
                        <span className="text-gray-300">{resource.provider_company_name}</span>
                      </div>
                    )}
                    {resource.provider_email && (
                      <div className="flex items-center space-x-1">
                        <Mail className="w-3 h-3 text-gray-400" />
                        <span className="text-gray-300">{resource.provider_email}</span>
                      </div>
                    )}
                    {resource.provider_phone && (
                      <div className="flex items-center space-x-1">
                        <Phone className="w-3 h-3 text-gray-400" />
                        <span className="text-gray-300">{resource.provider_phone}</span>
                      </div>
                    )}
                    {resource.provider_company_address && (
                      <div className="flex items-center space-x-1">
                        <MapPin className="w-3 h-3 text-gray-400" />
                        <span className="text-gray-300">{resource.provider_company_address}</span>
                      </div>
                    )}
                    {resource.provider_company_website && (
                      <Tooltip content={`Website des Dienstleisters - klicken zum Öffnen`}>
                        <div className="flex items-center space-x-1 cursor-help">
                          <Settings className="w-3 h-3 text-gray-400" />
                          <span className="text-gray-300">{resource.provider_company_website}</span>
                          <HelpCircle className="w-3 h-3 text-gray-500" />
                        </div>
                      </Tooltip>
                    )}
                  </div>
                </div>

                {/* Bauträger-Notizen */}
                {resource.builder_date_range_notes && (
                  <div>
                    <div className="text-xs text-[#ffbd59] font-medium mb-1 flex items-center space-x-1">
                      <span>💬 Bauträger-Notizen</span>
                    </div>
                    <div className="p-2 bg-blue-500/10 border border-blue-500/30 rounded text-xs text-gray-300">
                      {resource.builder_date_range_notes}
                    </div>
                  </div>
                )}

                {/* Zeitraum-Details */}
                {resource.builder_preferred_start_date && resource.builder_preferred_end_date && (
                  <div>
                    <div className="text-xs text-[#ffbd59] font-medium mb-1">📅 Zeitraum-Details</div>
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
                          {(() => {
                            const totalDays = Math.ceil(dayjs(resource.end_date).diff(dayjs(resource.start_date), 'day') + 1);
                            const usedDays = Math.ceil(dayjs(resource.builder_preferred_end_date).diff(dayjs(resource.builder_preferred_start_date), 'day') + 1);
                            return Math.round((usedDays / totalDays) * 100);
                          })()}%
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Beschreibung */}
                {resource.provider_bio && (
                  <div>
                    <div className="text-xs text-[#ffbd59] font-medium mb-1">📋 Beschreibung</div>
                    <Tooltip content={`Vollständige Beschreibung: ${resource.provider_bio}`}>
                      <div className="text-gray-300 text-xs leading-relaxed cursor-help">
                        {resource.provider_bio.length > 100 
                          ? `${resource.provider_bio.substring(0, 100)}...` 
                          : resource.provider_bio}
                      </div>
                    </Tooltip>
                  </div>
                )}

                {/* Sprachen */}
                {resource.provider_languages && (
                  <div>
                    <div className="text-xs text-[#ffbd59] font-medium mb-1">🌐 Sprachen</div>
                    <div className="text-gray-300 text-xs">
                      {resource.provider_languages}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Kompakter Zeitraum-Button mit Tooltip */}
          {isSelected && (
            <div className="mt-1">
              <Tooltip 
                position="bottom"
                content={
                  <div className="w-96">
                    <div className="font-semibold text-white mb-2 text-sm">Zeitraum-Anpassung</div>
                    <div className="text-sm space-y-2">
                      <div className="text-blue-300">
                        <strong>Verfügbar:</strong><br/>
                        {dayjs(resource.start_date).format('DD.MM.YYYY')} - {dayjs(resource.end_date).format('DD.MM.YYYY')}
                      </div>
                      <div className="text-[#ffbd59]">
                        <strong>Ihr gewünschter Zeitraum:</strong><br/>
                        Wählen Sie einen spezifischen Teilzeitraum für Ihr Projekt
                      </div>
                      <div className="text-gray-300 text-sm">
                        💡 <strong>Beispiel:</strong> Dienstleister ist 30 Tage verfügbar, Sie benötigen nur 5 Tage für Ihr Projekt
                      </div>
                    </div>
                  </div>
                }
              >
                <button
                  onClick={() => setShowDateInput(!showDateInput)}
                  className="flex items-center space-x-1 text-xs text-[#ffbd59] hover:text-[#ffa726] transition-colors cursor-help"
                >
                  <Calendar className="w-3 h-3" />
                  <span>{showDateInput ? 'Zeitraum ausblenden' : 'Zeitraum anpassen'}</span>
                  <HelpCircle className="w-3 h-3 text-gray-500" />
                </button>
              </Tooltip>
            </div>
          )}
        </div>

        {/* Selection Checkbox */}
        <div className="mt-1">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={onToggleSelect}
            className="rounded border-gray-600 text-[#ffbd59] focus:ring-[#ffbd59]"
          />
        </div>
      </div>

      {/* Kompakte Zeitraum-Eingabe */}
      {isSelected && showDateInput && (
        <div className="mt-1 pt-1 border-t border-gray-600">
          <div className="space-y-1">
            <div className="grid grid-cols-2 gap-1">
              <div>
                <Tooltip position="top" content="Wählen Sie den gewünschten Starttermin für diese Ressource. Muss innerhalb der Dienstleister-Verfügbarkeit liegen.">
                  <label className="block text-xs text-gray-400 mb-0.5 cursor-help">
                    Start
                    <HelpCircle className="w-3 h-3 text-gray-500 inline ml-1" />
                  </label>
                </Tooltip>
                <input
                  type="date"
                  value={localDateRange.start}
                  onChange={(e) => {
                    const newRange = { ...localDateRange, start: e.target.value };
                    setLocalDateRange(newRange);
                    onDateRangeChange?.(resource.id!, newRange.start, newRange.end, newRange.notes);
                  }}
                  className="w-full px-1 py-0.5 bg-[#2a2a2a] text-white rounded text-xs border border-gray-600 focus:border-[#ffbd59]"
                />
              </div>
              <div>
                <Tooltip position="top" content="Wählen Sie den gewünschten Endtermin für diese Ressource. Muss innerhalb der Dienstleister-Verfügbarkeit liegen.">
                  <label className="block text-xs text-gray-400 mb-0.5 cursor-help">
                    Ende
                    <HelpCircle className="w-3 h-3 text-gray-500 inline ml-1" />
                  </label>
                </Tooltip>
                <input
                  type="date"
                  value={localDateRange.end}
                  onChange={(e) => {
                    const newRange = { ...localDateRange, end: e.target.value };
                    setLocalDateRange(newRange);
                    onDateRangeChange?.(resource.id!, newRange.start, newRange.end, newRange.notes);
                  }}
                  className="w-full px-1 py-0.5 bg-[#2a2a2a] text-white rounded text-xs border border-gray-600 focus:border-[#ffbd59]"
                />
              </div>
            </div>
            
            <div>
              <Tooltip position="top" content="Fügen Sie spezielle Anforderungen oder Präferenzen für diesen Zeitraum hinzu (z.B. Arbeitszeiten, besondere Wünsche).">
                <label className="block text-xs text-gray-400 mb-0.5 cursor-help">
                  Notizen
                  <HelpCircle className="w-3 h-3 text-gray-500 inline ml-1" />
                </label>
              </Tooltip>
              <input
                type="text"
                value={localDateRange.notes}
                onChange={(e) => {
                  const newRange = { ...localDateRange, notes: e.target.value };
                  setLocalDateRange(newRange);
                  onDateRangeChange?.(resource.id!, newRange.start, newRange.end, newRange.notes);
                }}
                placeholder="z.B. nur morgens..."
                className="w-full px-1 py-0.5 bg-[#2a2a2a] text-white rounded text-xs border border-gray-600 focus:border-[#ffbd59]"
              />
            </div>

            {/* Minimale Verfügbarkeits-Info mit Tooltip */}
            <Tooltip 
              position="top"
              content={
                <div className="max-w-64">
                  <div className="font-semibold text-white mb-2 text-sm">Verfügbarkeits-Erklärung</div>
                  <div className="text-sm space-y-2">
                    <div className="text-blue-300">
                      <strong>🔵 Dienstleister-Verfügbarkeit:</strong><br/>
                      Der gesamte Zeitraum, in dem der Dienstleister grundsätzlich verfügbar ist
                    </div>
                    <div className="text-[#ffbd59]">
                      <strong>🟡 Ihr gewünschter Zeitraum:</strong><br/>
                      Der spezifische Zeitraum, den Sie für Ihr Projekt benötigen
                    </div>
                    <div className="text-gray-300 text-sm">
                      ✅ <strong>Regel:</strong> Ihr gewünschter Zeitraum muss innerhalb der Dienstleister-Verfügbarkeit liegen
                    </div>
                  </div>
                </div>
              }
            >
              <div className="p-1 bg-blue-500/10 border border-blue-500/30 rounded text-xs cursor-help">
                <div className="text-blue-400 text-xs">Verfügbar: {dayjs(resource.start_date).format('DD.MM')} - {dayjs(resource.end_date).format('DD.MM.YYYY')}</div>
                {localDateRange.start && localDateRange.end && (
                  <div className="mt-0.5">
                    <div className="text-[#ffbd59] text-xs">
                      Gewünscht: {dayjs(localDateRange.start).format('DD.MM')} - {dayjs(localDateRange.end).format('DD.MM.YYYY')}
                    </div>
                    {/* Minimale Validierung */}
                    {(() => {
                      const providerStart = dayjs(resource.start_date);
                      const providerEnd = dayjs(resource.end_date);
                      const desiredStart = dayjs(localDateRange.start);
                      const desiredEnd = dayjs(localDateRange.end);
                      
                      const isValid = desiredStart.isAfter(providerStart.subtract(1, 'day')) && 
                                     desiredEnd.isBefore(providerEnd.add(1, 'day'));
                      
                      return (
                        <div className={`text-xs ${isValid ? 'text-green-400' : 'text-red-400'}`}>
                          {isValid ? '✅ OK' : '⚠️ Nicht verfügbar'}
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
            </Tooltip>
          </div>
        </div>
      )}

      {/* Kompakter Zeitraum-Anzeiger */}
      {isSelected && !showDateInput && (localDateRange.start || localDateRange.end) && (
        <div className="mt-1 flex items-center space-x-1 text-xs text-[#ffbd59]">
          <Calendar className="w-3 h-3" />
          <span>
            {localDateRange.start && localDateRange.end 
              ? `${dayjs(localDateRange.start).format('DD.MM')} - ${dayjs(localDateRange.end).format('DD.MM.YYYY')}`
              : 'Zeitraum teilweise definiert'
            }
          </span>
        </div>
      )}
    </div>
  );
};

// Rest of the component remains the same as the original...
const ResourceSelectionPanel: React.FC<ResourceSelectionPanelProps> = ({
  isOpen,
  onToggle,
  tradeId,
  category,
  preferredDateRange,
  onResourcesSelected,
  className = ''
}) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [resources, setResources] = useState<Resource[]>([]);
  const [selectedResourceIds, setSelectedResourceIds] = useState<string[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  
  // Individuelle Zeiträume pro Ressource
  const [individualDateRanges, setIndividualDateRanges] = useState<Map<number, ResourceDateRange>>(new Map());
  
  // Location state
  const [currentLocation, setCurrentLocation] = useState<{ latitude: number; longitude: number } | null>(() => {
    const saved = localStorage.getItem('buildwise_geo_location');
    return saved ? JSON.parse(saved) : null;
  });
  
  // Filter states
  const [minPersons, setMinPersons] = useState<number | undefined>();
  const [maxRate, setMaxRate] = useState<number | undefined>();
  const [maxDistance, setMaxDistance] = useState<number>(100); // Default 100km
  const [isHelpExpanded, setIsHelpExpanded] = useState(false);
  const [dateRange, setDateRange] = useState({
    start: preferredDateRange?.start || dayjs().format('YYYY-MM-DD'),
    end: preferredDateRange?.end || dayjs().add(30, 'days').format('YYYY-MM-DD')
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Update dateRange when preferredDateRange changes
  useEffect(() => {
    if (preferredDateRange?.start && preferredDateRange?.end) {
      setDateRange({
        start: preferredDateRange.start,
        end: preferredDateRange.end
      });
    }
  }, [preferredDateRange]);

  // Get user location if not available
  useEffect(() => {
    if (!currentLocation && isOpen) {
      getBrowserLocation()
        .then((location) => {
          console.log('Browser location obtained:', location);
          setCurrentLocation(location);
          localStorage.setItem('buildwise_geo_location', JSON.stringify(location));
        })
        .catch((error) => {
          console.warn('Geolocation nicht verfügbar:', error);
          // Fallback: Use Uster, Switzerland coordinates for testing
          const fallbackLocation = { latitude: 47.3467, longitude: 8.7208 }; // Uster, Switzerland
          console.log('Using fallback location (Uster, CH):', fallbackLocation);
          setCurrentLocation(fallbackLocation);
          localStorage.setItem('buildwise_geo_location', JSON.stringify(fallbackLocation));
        });
    }
  }, [isOpen, currentLocation]);

  // Calculate distance between two points using Haversine formula
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Geocode address to coordinates
  const geocodeAddress = async (address: string): Promise<{ latitude: number; longitude: number } | null> => {
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`);
      const data = await response.json();
      
      if (data && data.length > 0) {
        return {
          latitude: parseFloat(data[0].lat),
          longitude: parseFloat(data[0].lon)
        };
      }
      return null;
    } catch (error) {
      console.error('Geocoding error:', error);
      return null;
    }
  };

  // Load resources
  const loadResources = async () => {
    if (!currentLocation) {
      console.warn('Keine Position verfügbar für Geo-Suche');
      return;
    }
    
    setLoading(true);
    const searchParams = {
      category,
      start_date: dateRange.start,
      end_date: dateRange.end,
      min_persons: minPersons,
      max_hourly_rate: maxRate,
      latitude: currentLocation.latitude,
      longitude: currentLocation.longitude,
      radius_km: maxDistance,
      status: 'available'
    };
    
    console.log('Searching resources with params:', searchParams);
    
    try {
      // TEMPORARY FIX: Always use regular search with client-side filtering
      // This ensures we can see all resources that match the criteria
      console.log('Using regular search with client-side filtering (temporary fix)...');
      const allResults = await resourceService.listResources({
        category,
        // TEMPORARY: Remove date filtering to test
        // start_date: dateRange.start,
        // end_date: dateRange.end,
        min_persons: minPersons,
        max_hourly_rate: maxRate,
        status: 'available'
      });
      
      console.log(`Regular search found ${allResults.length} total resources`);
      
      // Filter by distance client-side, geocode addresses if needed
      const filteredResults = await Promise.all(
        allResults.map(async (resource) => {
          let resourceLat = resource.latitude;
          let resourceLon = resource.longitude;
          
          // If no coordinates but has address, try to geocode
          if ((!resourceLat || !resourceLon) && (resource.address_street || resource.address_city || resource.address_postal_code)) {
            const address = `${resource.address_street || ''}, ${resource.address_city || ''}, ${resource.address_postal_code || ''}`.trim().replace(/^,\s*|,\s*$/g, '');
            console.log(`Resource ${resource.id} has no coordinates but has address, attempting geocoding...`);
            
            const geocoded = await geocodeAddress(address);
            if (geocoded) {
              resourceLat = geocoded.latitude;
              resourceLon = geocoded.longitude;
              console.log(`Resource ${resource.id} geocoded successfully: ${resourceLat}, ${resourceLon}`);
              
              // Note: Not updating database due to permission restrictions
              // Coordinates are used temporarily for distance calculation only
              console.log(`Resource ${resource.id} using temporary coordinates for filtering`);
            } else {
              console.log(`Resource ${resource.id} geocoding failed for address: ${address}`);
              return null;
            }
          }
          
          // If still no coordinates, exclude the resource
          if (!resourceLat || !resourceLon) {
            console.log(`Resource ${resource.id} has no coordinates - excluding`);
            return null;
          }
          
          // Calculate distance
          const distance = calculateDistance(
            currentLocation.latitude, 
            currentLocation.longitude,
            resourceLat, 
            resourceLon
          );
          
          console.log(`Resource ${resource.id} distance: ${distance.toFixed(2)}km (limit: ${maxDistance}km)`);
          
          // Check distance filter
          if (distance > maxDistance) {
            console.log(`Resource ${resource.id} excluded: distance ${distance.toFixed(2)}km > ${maxDistance}km`);
            return null;
          }
          
          // Check date overlap (client-side filtering)
          const resourceStart = dayjs(resource.start_date);
          const resourceEnd = dayjs(resource.end_date);
          const searchStart = dayjs(dateRange.start);
          const searchEnd = dayjs(dateRange.end);
          
          // Check if there's any overlap between resource availability and search period
          const hasOverlap = resourceStart.isBefore(searchEnd) && resourceEnd.isAfter(searchStart);
          
          console.log(`Resource ${resource.id} date check:`, {
            resourcePeriod: `${resourceStart.format('YYYY-MM-DD')} to ${resourceEnd.format('YYYY-MM-DD')}`,
            searchPeriod: `${searchStart.format('YYYY-MM-DD')} to ${searchEnd.format('YYYY-MM-DD')}`,
            hasOverlap
          });
          
          if (!hasOverlap) {
            console.log(`Resource ${resource.id} excluded: no date overlap`);
            return null;
          }
          
          console.log(`Resource ${resource.id} included: distance ${distance.toFixed(2)}km, date overlap OK`);
          return resource;
        })
      );
      
      // Remove null values
      const validResults = filteredResults.filter(resource => resource !== null);
      
      console.log(`Client-side filtering found ${validResults.length} resources within ${maxDistance}km`);
      console.log('Client-side filtered results:', validResults);
      setResources(validResults);
      
      // Lade bereits gespeicherte individuelle Zeiträume
      const savedDateRanges = new Map<number, ResourceDateRange>();
      validResults.forEach(resource => {
        if (resource.builder_preferred_start_date && resource.builder_preferred_end_date) {
          savedDateRanges.set(resource.id!, {
            resourceId: resource.id!,
            startDate: resource.builder_preferred_start_date,
            endDate: resource.builder_preferred_end_date,
            notes: resource.builder_date_range_notes
          });
        }
      });
      setIndividualDateRanges(savedDateRanges);
      console.log('Geladene gespeicherte Zeiträume:', savedDateRanges);
    } catch (error) {
      console.error('Fehler beim Laden der Ressourcen:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && currentLocation) {
      loadResources();
    }
  }, [isOpen, category, maxDistance, currentLocation]);

  // Handle drag events
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      setResources((items) => {
        const oldIndex = items.findIndex((i) => i.id?.toString() === active.id);
        const newIndex = items.findIndex((i) => i.id?.toString() === over?.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
    setActiveId(null);
  };

  // Toggle resource selection
  const toggleResourceSelection = (resourceId: string) => {
    setSelectedResourceIds(prev =>
      prev.includes(resourceId)
        ? prev.filter(id => id !== resourceId)
        : [...prev, resourceId]
    );
  };

  // Remove resource from list
  const removeResource = (resourceId: string) => {
    setResources(prev => prev.filter(r => r.id?.toString() !== resourceId));
    setSelectedResourceIds(prev => prev.filter(id => id !== resourceId));
    // Entferne auch den individuellen Zeitraum
    setIndividualDateRanges(prev => {
      const newMap = new Map(prev);
      newMap.delete(parseInt(resourceId));
      return newMap;
    });
  };

  // Handle individual date range changes
  const handleDateRangeChange = async (resourceId: number, startDate: string, endDate: string, notes?: string) => {
    // Update local state
    setIndividualDateRanges(prev => {
      const newMap = new Map(prev);
      if (startDate && endDate) {
        newMap.set(resourceId, {
          resourceId,
          startDate,
          endDate,
          notes
        });
      } else {
        newMap.delete(resourceId);
      }
      return newMap;
    });

    // Update database
    try {
      await resourceService.updateBuilderPreferredDates(
        resourceId,
        startDate || undefined,
        endDate || undefined,
        notes || undefined
      );
      console.log(`Zeitraum für Ressource ${resourceId} erfolgreich gespeichert:`, {
        startDate,
        endDate,
        notes
      });
    } catch (error) {
      console.error(`Fehler beim Speichern des Zeitraums für Ressource ${resourceId}:`, error);
      // Optional: Zeige eine Fehlermeldung an den Benutzer
    }
  };

  // Send invitations
  const sendInvitations = async () => {
    if (selectedResourceIds.length === 0) return;

    setLoading(true);
    try {
      const allocations: ResourceAllocation[] = selectedResourceIds.map((resourceId, index) => {
        const resource = resources.find(r => r.id?.toString() === resourceId);
        const individualRange = individualDateRanges.get(parseInt(resourceId));
        
        // Verwende individuellen Zeitraum falls vorhanden, sonst den globalen
        const startDate = individualRange?.startDate || dateRange.start;
        const endDate = individualRange?.endDate || dateRange.end;
        
        return {
          resource_id: parseInt(resourceId),
          trade_id: tradeId,
          allocated_person_count: resource?.person_count || 1,
          allocated_start_date: startDate,
          allocated_end_date: endDate,
          allocation_status: 'pre_selected' as const,
          priority: index,
          notes: individualRange?.notes || `Gewünschter Zeitraum: ${startDate} - ${endDate}`
        };
      });

      const createdAllocations = await resourceService.bulkCreateAllocations(allocations);
      
      // Send notifications
      await Promise.all(
        createdAllocations.map(allocation =>
          allocation.id ? resourceService.sendInvitationNotification(allocation.id) : null
        )
      );

      // Sammle die vollständigen Resource-Daten für die ausgewählten Ressourcen
      const selectedResourcesData = selectedResourceIds.map(resourceId => 
        resources.find(r => r.id?.toString() === resourceId)
      ).filter(Boolean) as Resource[];

      onResourcesSelected?.(createdAllocations, selectedResourcesData);
      
      // Reset
      setSelectedResourceIds([]);
      
      // Success feedback - removed alert popup
    } catch (error) {
      console.error('Fehler beim Zuweisen der Ressourcen:', error);
      alert('Fehler beim Zuweisen der Ressourcen');
    } finally {
      setLoading(false);
    }
  };

  // Filter resources
  const filteredResources = resources.filter(resource => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        resource.provider_name?.toLowerCase().includes(query) ||
        resource.provider_company_name?.toLowerCase().includes(query) ||
        resource.provider_email?.toLowerCase().includes(query) ||
        resource.provider_bio?.toLowerCase().includes(query) ||
        resource.provider_languages?.toLowerCase().includes(query) ||
        resource.address_city?.toLowerCase().includes(query) ||
        resource.category?.toLowerCase().includes(query)
      );
    }
    return true;
  });

  // Debug: Log resources state
  console.log('Resources state:', resources);
  console.log('Filtered resources:', filteredResources);
  console.log('Search query:', searchQuery);

  // Calculate stats
  const totalPersons = selectedResourceIds.reduce((sum, id) => {
    const resource = resources.find(r => r.id?.toString() === id);
    return sum + (resource?.person_count || 0);
  }, 0);

  const avgRate = selectedResourceIds.length > 0
    ? selectedResourceIds.reduce((sum, id) => {
        const resource = resources.find(r => r.id?.toString() === id);
        return sum + (resource?.hourly_rate || 0);
      }, 0) / selectedResourceIds.length
    : 0;

  const activeResource = activeId 
    ? resources.find(r => r.id?.toString() === activeId)
    : null;

  return (
    <>
      {/* Toggle Button */}
      <motion.button
        onClick={onToggle}
        className={`fixed left-0 top-1/2 -translate-y-1/2 z-[60] bg-[#ffbd59] text-black p-3 rounded-r-lg shadow-lg hover:bg-[#f59e0b] transition-all ${
          isOpen ? 'translate-x-[28rem]' : 'translate-x-0'
        }`}
        animate={{ x: isOpen ? 448 : 0 }}
      >
        {isOpen ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
      </motion.button>

      {/* Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: -448 }}
            animate={{ x: 0 }}
            exit={{ x: -448 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className={`fixed left-0 top-0 h-full w-[28rem] bg-[#1a1a1a] border-r border-gray-700 shadow-2xl z-50 flex flex-col ${className}`}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-[#ffbd59] to-[#f59e0b] p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <Users className="w-5 h-5 text-white" />
                  <h3 className="text-lg font-bold text-white">Ressourcen-Vorauswahl</h3>
                </div>
                <button
                  onClick={onToggle}
                  className="p-1 hover:bg-white/20 rounded transition-colors"
                >
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>
              
              {/* Stats */}
              <div className="grid grid-cols-3 gap-2">
                <Tooltip content={`${filteredResources.length} verfügbare Ressourcen nach aktuellen Filtern`}>
                  <div className="bg-white/20 rounded p-2 text-center cursor-help">
                    <div className="text-xl font-bold text-white">{filteredResources.length}</div>
                    <div className="text-xs text-white/80">Verfügbar</div>
                  </div>
                </Tooltip>
                <Tooltip content={`${selectedResourceIds.length} Ressourcen für Zuweisung ausgewählt`}>
                  <div className="bg-white/20 rounded p-2 text-center cursor-help">
                    <div className="text-xl font-bold text-white">{selectedResourceIds.length}</div>
                    <div className="text-xs text-white/80">Ausgewählt</div>
                  </div>
                </Tooltip>
                <Tooltip content={`Gesamtanzahl Personen in ausgewählten Ressourcen: ${totalPersons}`}>
                  <div className="bg-white/20 rounded p-2 text-center cursor-help">
                    <div className="text-xl font-bold text-white">{totalPersons}</div>
                    <div className="text-xs text-white/80">Personen</div>
                  </div>
                </Tooltip>
              </div>
              
              {/* Location Info */}
              {currentLocation && (
                <div className="mt-3 text-xs text-white/70 text-center">
                  <MapPin className="w-3 h-3 inline mr-1" />
                  Suchzentrum: {currentLocation.latitude.toFixed(4)}, {currentLocation.longitude.toFixed(4)}
                </div>
              )}
              
              {/* Preferred Date Range Info */}
              {preferredDateRange?.start && preferredDateRange?.end && (
                <div className="mt-3 p-2 bg-white/10 rounded-lg text-center">
                  <div className="flex items-center justify-center space-x-2 text-xs text-white/90">
                    <Calendar className="w-3 h-3" />
                    <span>
                      Gewünschter Zeitraum des Bauträgers:
                    </span>
                  </div>
                  <div className="text-xs text-white/80 mt-1">
                    {dayjs(preferredDateRange.start).format('DD.MM.YYYY')} - {dayjs(preferredDateRange.end).format('DD.MM.YYYY')}
                  </div>
                  <div className="text-xs text-white/70 mt-1">
                    Nur Ressourcen, die in diesem Zeitraum verfügbar sind, werden angezeigt
                  </div>
                </div>
              )}
              
              {/* Location Controls */}
              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => {
                    const usterLocation = { latitude: 47.3467, longitude: 8.7208 };
                    console.log('Manuell auf Uster, CH gesetzt:', usterLocation);
                    setCurrentLocation(usterLocation);
                    localStorage.setItem('buildwise_geo_location', JSON.stringify(usterLocation));
                  }}
                  className="flex-1 px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
                >
                  📍 Uster, CH
                </button>
                <button
                  onClick={() => {
                    getBrowserLocation()
                      .then((location) => {
                        setCurrentLocation(location);
                        localStorage.setItem('buildwise_geo_location', JSON.stringify(location));
                      })
                      .catch((error) => {
                        console.warn('Geolocation error:', error);
                        alert('Standortfreigabe fehlgeschlagen');
                      });
                  }}
                  className="flex-1 px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors"
                >
                  🎯 Aktueller Ort
                </button>
              </div>
            </div>

            {/* Search & Filter */}
            <div className="p-4 border-b border-gray-700">
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Suche nach Name, Firma, E-Mail, Beschreibung, Sprachen, Ort..."
                  className="w-full pl-10 pr-4 py-2 bg-[#2a2a2a] text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ffbd59]"
                />
              </div>

              {/* Distance Slider */}
              <div className="mb-3 p-3 bg-[#2a2a2a] rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm text-gray-300 flex items-center space-x-2">
                    <MapPin className="w-4 h-4" />
                    <span>Entfernung zum Standort</span>
                  </label>
                  <span className="text-sm text-[#ffbd59] font-semibold">{maxDistance} km</span>
                </div>
                <div className="relative">
                  <input
                    type="range"
                    min="1"
                    max="100"
                    value={maxDistance}
                    onChange={(e) => setMaxDistance(parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer distance-slider"
                    style={{
                      background: `linear-gradient(to right, #ffbd59 0%, #ffbd59 ${maxDistance}%, #4a5568 ${maxDistance}%, #4a5568 100%)`
                    }}
                  />
                  <div className="flex justify-between text-xs text-gray-400 mt-1">
                    <span>1 km</span>
                    <span>100 km</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowFilters(!showFilters)}
                className="w-full px-3 py-2 bg-[#2a2a2a] text-white rounded-lg hover:bg-[#333] transition-colors flex items-center justify-between"
              >
                <span className="flex items-center space-x-2">
                  <Filter className="w-4 h-4" />
                  <span>Filter</span>
                </span>
                <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
              </button>

              {/* Filter Options */}
              {showFilters && (
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: 'auto' }}
                  className="mt-3 space-y-3 overflow-hidden"
                >
                  <div>
                    <label className="text-xs text-gray-400">Min. Personen</label>
                    <input
                      type="number"
                      min="1"
                      value={minPersons || ''}
                      onChange={(e) => setMinPersons(e.target.value ? parseInt(e.target.value) : undefined)}
                      className="w-full px-3 py-1.5 bg-[#2a2a2a] text-white rounded text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400">Max. Stundensatz (€)</label>
                    <input
                      type="number"
                      min="0"
                      value={maxRate || ''}
                      onChange={(e) => setMaxRate(e.target.value ? parseFloat(e.target.value) : undefined)}
                      className="w-full px-3 py-1.5 bg-[#2a2a2a] text-white rounded text-sm"
                    />
                  </div>
                  <button
                    onClick={loadResources}
                    className="w-full px-3 py-1.5 bg-[#ffbd59] text-black rounded text-sm hover:bg-[#f59e0b] transition-colors"
                  >
                    Filter anwenden
                  </button>
                </motion.div>
              )}
            </div>

            {/* Resource List with Drag & Drop */}
            <div className="flex-1 overflow-y-auto p-4">
              {loading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#ffbd59]"></div>
                </div>
              ) : filteredResources.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-400">Keine Ressourcen gefunden</p>
                  <p className="text-xs text-gray-500 mb-4">
                    Radius: {maxDistance}km um {currentLocation ? `${currentLocation.latitude.toFixed(4)}, ${currentLocation.longitude.toFixed(4)}` : 'unbekannten Standort'}
                  </p>
                </div>
              ) : (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragStart={handleDragStart}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={filteredResources.map(r => r.id?.toString() || '')}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-2">
                      {filteredResources.map(resource => (
                        <SortableResourceItem
                          key={resource.id}
                          id={resource.id?.toString() || ''}
                          resource={resource}
                          isSelected={selectedResourceIds.includes(resource.id?.toString() || '')}
                          onToggleSelect={() => toggleResourceSelection(resource.id?.toString() || '')}
                          onRemove={() => removeResource(resource.id?.toString() || '')}
                          onDateRangeChange={handleDateRangeChange}
                          individualDateRange={individualDateRanges.get(resource.id!)}
                        />
                      ))}
                    </div>
                  </SortableContext>

                  <DragOverlay>
                    {activeResource && (
                      <div className="bg-[#333] rounded-lg p-4 border border-[#ffbd59] shadow-xl">
                        <div className="text-sm font-semibold text-white">
                          {activeResource.provider_name}
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                          {activeResource.person_count} Personen
                        </div>
                        {activeResource.provider_company_name && (
                          <div className="text-xs text-gray-400 mt-1">
                            {activeResource.provider_company_name}
                          </div>
                        )}
                      </div>
                    )}
                  </DragOverlay>
                </DndContext>
              )}
            </div>

            {/* Actions */}
            {selectedResourceIds.length > 0 && (
              <motion.div
                initial={{ y: 100 }}
                animate={{ y: 0 }}
                className="p-4 border-t border-gray-700 bg-[#2a2a2a]"
              >
                <div className="mb-3 text-sm">
                  <Tooltip content={`${selectedResourceIds.length} Ressourcen für Zuweisung ausgewählt`}>
                    <div className="flex items-center justify-between mb-1 cursor-help">
                      <span className="text-gray-400">Ausgewählt:</span>
                      <span className="text-white font-semibold">
                        {selectedResourceIds.length} Ressourcen
                      </span>
                      <HelpCircle className="w-3 h-3 text-gray-500 ml-1" />
                    </div>
                  </Tooltip>
                  <Tooltip content={`Gesamtanzahl aller Personen in den ausgewählten Ressourcen`}>
                    <div className="flex items-center justify-between mb-1 cursor-help">
                      <span className="text-gray-400">Gesamt Personen:</span>
                      <span className="text-white font-semibold">{totalPersons}</span>
                      <HelpCircle className="w-3 h-3 text-gray-500 ml-1" />
                    </div>
                  </Tooltip>
                  {avgRate > 0 && (
                    <Tooltip content={`Durchschnittlicher Stundensatz aller ausgewählten Ressourcen`}>
                      <div className="flex items-center justify-between mb-1 cursor-help">
                        <span className="text-gray-400">Ø Stundensatz:</span>
                        <span className="text-white font-semibold">{avgRate.toFixed(2)}€</span>
                        <HelpCircle className="w-3 h-3 text-gray-500 ml-1" />
                      </div>
                    </Tooltip>
                  )}
                  
                  {/* Individuelle Zeiträume Zusammenfassung */}
                  {individualDateRanges.size > 0 && (
                    <Tooltip content={`${individualDateRanges.size} Ressourcen haben individuelle Zeiträume definiert`}>
                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-600 cursor-help">
                        <span className="text-gray-400 flex items-center space-x-1">
                          <Calendar className="w-3 h-3" />
                          <span>Individuelle Zeiträume:</span>
                        </span>
                        <span className="text-[#ffbd59] font-semibold">
                          {individualDateRanges.size} von {selectedResourceIds.length}
                        </span>
                        <HelpCircle className="w-3 h-3 text-gray-500 ml-1" />
                      </div>
                    </Tooltip>
                  )}
                </div>

                <div className="flex space-x-2">
                  <Tooltip content="Alle ausgewählten Ressourcen abwählen">
                    <button
                      onClick={() => setSelectedResourceIds([])}
                      className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors cursor-help"
                    >
                      Auswahl aufheben
                    </button>
                  </Tooltip>
                  <Tooltip content={`Ressourcen an ${selectedResourceIds.length} ausgewählte Dienstleister zuweisen`}>
                    <button
                      onClick={sendInvitations}
                      disabled={loading}
                      className="flex-1 px-4 py-2 bg-[#ffbd59] text-black rounded-lg hover:bg-[#f59e0b] transition-colors flex items-center justify-center space-x-2 disabled:opacity-50 cursor-help"
                    >
                      <Send className="w-4 h-4" />
                      <span>Zuweisen</span>
                    </button>
                  </Tooltip>
                </div>
              </motion.div>
            )}

            {/* Info Box */}
            <div className="p-4 border-t border-gray-700">
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
                <button
                  onClick={() => setIsHelpExpanded(!isHelpExpanded)}
                  className="flex items-start space-x-2 w-full text-left hover:bg-blue-500/20 rounded-lg p-2 -m-2 transition-colors"
                >
                  <Info className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                  <div className="text-xs text-blue-300 flex-1">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold">So funktioniert's:</p>
                      <svg 
                        className={`w-4 h-4 text-blue-400 transition-transform ${isHelpExpanded ? 'rotate-180' : ''}`}
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                    {isHelpExpanded && (
                      <ul className="space-y-1 mt-2">
                        <li>• Wählen Sie passende Ressourcen aus</li>
                        <li>• Sehen Sie alle Dienstleister-Details (Firma, Kontakt, etc.)</li>
                        <li>• Hovern Sie über Stunden/Personen für detaillierte Berechnungen</li>
                        <li>• Sortieren Sie per Drag & Drop nach Priorität</li>
                        <li>• Weisen Sie Ressourcen an ausgewählte Dienstleister zu</li>
                        <li>• Nutzen Sie den Details-Button für erweiterte Informationen</li>
                        <li>• Sehen Sie Ressourcennutzung und Bauträger-Notizen</li>
                      </ul>
                    )}
                  </div>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ResourceSelectionPanel;
