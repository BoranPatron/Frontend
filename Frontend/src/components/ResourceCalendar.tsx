import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  Calendar,
  ChevronLeft,
  ChevronRight,
  Users,
  Clock,
  MapPin,
  Filter,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  Download,
  Plus
} from 'lucide-react';
import { resourceService, type Resource, type ResourceCalendarEntry, type ResourceAllocation } from '../api/resourceService';
import { useAuth } from '../context/AuthContext';
import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';
import weekOfYear from 'dayjs/plugin/weekOfYear';

dayjs.extend(isoWeek);
dayjs.extend(weekOfYear);

interface ResourceCalendarProps {
  serviceProviderId?: number;
  onResourceClick?: (resource: Resource) => void;
  onAddResource?: () => void;
  className?: string;
}

interface CalendarDay {
  date: dayjs.Dayjs;
  resources: ResourceCalendarEntry[];
  isCurrentMonth: boolean;
  isToday: boolean;
  isWeekend: boolean;
}

type ViewMode = 'month' | 'week' | 'day';

const STATUS_COLORS = {
  available: '#10b981',
  tentative: '#f59e0b',
  confirmed: '#3b82f6',
  in_progress: '#8b5cf6',
  completed: '#6b7280'
};

const STATUS_LABELS = {
  available: 'Verfügbar',
  tentative: 'Vorläufig',
  confirmed: 'Bestätigt',
  in_progress: 'In Arbeit',
  completed: 'Abgeschlossen'
};

const ResourceCalendar: React.FC<ResourceCalendarProps> = ({
  serviceProviderId,
  onResourceClick,
  onAddResource,
  className = ''
}) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [currentDate, setCurrentDate] = useState(dayjs());
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [calendarEntries, setCalendarEntries] = useState<ResourceCalendarEntry[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showLegend, setShowLegend] = useState(true);
  const [calendarDays, setCalendarDays] = useState<CalendarDay[]>([]);

  // Lade Kalenderdaten
  const loadCalendarData = useCallback(async () => {
    if (!serviceProviderId && !user?.id) return;
    
    setLoading(true);
    try {
      const providerId = serviceProviderId || user?.id || 0;
      
      // Bestimme Zeitraum basierend auf ViewMode
      let startDate: string, endDate: string;
      
      switch (viewMode) {
        case 'day':
          startDate = currentDate.format('YYYY-MM-DD');
          endDate = currentDate.format('YYYY-MM-DD');
          break;
        case 'week':
          startDate = currentDate.startOf('isoWeek').format('YYYY-MM-DD');
          endDate = currentDate.endOf('isoWeek').format('YYYY-MM-DD');
          break;
        case 'month':
        default:
          startDate = currentDate.startOf('month').subtract(7, 'days').format('YYYY-MM-DD');
          endDate = currentDate.endOf('month').add(7, 'days').format('YYYY-MM-DD');
          break;
      }

      // Lade Kalenderdaten und Ressourcen parallel
      const [entries, resourceList] = await Promise.all([
        resourceService.getCalendarEntries(providerId, startDate, endDate),
        resourceService.listResources({ 
          service_provider_id: providerId,
          start_date: startDate,
          end_date: endDate
        })
      ]);

      setCalendarEntries(entries);
      setResources(resourceList);
      
      // Generiere Kalendertage
      generateCalendarDays(entries);
    } catch (error) {
      console.error('Fehler beim Laden der Kalenderdaten:', error);
    } finally {
      setLoading(false);
    }
  }, [serviceProviderId, user?.id, currentDate, viewMode]);

  useEffect(() => {
    loadCalendarData();
  }, [loadCalendarData]);

  // Generiere Kalender-Grid
  const generateCalendarDays = (entries: ResourceCalendarEntry[]) => {
    const days: CalendarDay[] = [];
    let current: dayjs.Dayjs;
    let endDate: dayjs.Dayjs;

    switch (viewMode) {
      case 'day':
        current = currentDate.startOf('day');
        endDate = currentDate.endOf('day');
        break;
      case 'week':
        current = currentDate.startOf('isoWeek');
        endDate = currentDate.endOf('isoWeek');
        break;
      case 'month':
      default:
        // Starte mit Montag der ersten Woche
        const firstDay = currentDate.startOf('month');
        const startOfWeek = firstDay.day() === 0 ? 6 : firstDay.day() - 1;
        current = firstDay.subtract(startOfWeek, 'days');
        
        // Ende mit Sonntag der letzten Woche
        const lastDay = currentDate.endOf('month');
        const endOfWeek = lastDay.day() === 0 ? 0 : 7 - lastDay.day();
        endDate = lastDay.add(endOfWeek, 'days');
        break;
    }

    while (current.isSameOrBefore(endDate)) {
      const dayEntries = entries.filter(entry => 
        dayjs(entry.entry_date).isSame(current, 'day')
      );

      days.push({
        date: current,
        resources: dayEntries,
        isCurrentMonth: current.month() === currentDate.month(),
        isToday: current.isSame(dayjs(), 'day'),
        isWeekend: current.day() === 0 || current.day() === 6
      });

      current = current.add(1, 'day');
    }

    setCalendarDays(days);
  };

  // Navigation
  const navigatePrevious = () => {
    switch (viewMode) {
      case 'day':
        setCurrentDate(prev => prev.subtract(1, 'day'));
        break;
      case 'week':
        setCurrentDate(prev => prev.subtract(1, 'week'));
        break;
      case 'month':
        setCurrentDate(prev => prev.subtract(1, 'month'));
        break;
    }
  };

  const navigateNext = () => {
    switch (viewMode) {
      case 'day':
        setCurrentDate(prev => prev.add(1, 'day'));
        break;
      case 'week':
        setCurrentDate(prev => prev.add(1, 'week'));
        break;
      case 'month':
        setCurrentDate(prev => prev.add(1, 'month'));
        break;
    }
  };

  const navigateToday = () => {
    setCurrentDate(dayjs());
  };

  // Berechne Statistiken
  const calculateStats = () => {
    const totalPersons = calendarEntries.reduce((sum, entry) => 
      sum + (entry.person_count || 0), 0
    );
    
    const availablePersons = calendarEntries
      .filter(entry => entry.status === 'available')
      .reduce((sum, entry) => sum + (entry.person_count || 0), 0);
    
    const allocatedPersons = calendarEntries
      .filter(entry => ['confirmed', 'in_progress'].includes(entry.status || ''))
      .reduce((sum, entry) => sum + (entry.person_count || 0), 0);

    return {
      totalPersons,
      availablePersons,
      allocatedPersons,
      utilizationRate: totalPersons > 0 ? (allocatedPersons / totalPersons * 100).toFixed(1) : '0'
    };
  };

  const stats = calculateStats();

  // Render Day Cell
  const renderDayCell = (day: CalendarDay) => {
    const hasResources = day.resources.length > 0;
    const totalPersons = day.resources.reduce((sum, r) => sum + r.person_count, 0);
    
    return (
      <motion.div
        key={day.date.format('YYYY-MM-DD')}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`
          relative p-2 border border-gray-700 rounded-lg min-h-[100px]
          ${day.isCurrentMonth ? 'bg-[#2a2a2a]' : 'bg-[#1a1a1a] opacity-60'}
          ${day.isToday ? 'ring-2 ring-[#ffbd59]' : ''}
          ${day.isWeekend ? 'bg-opacity-50' : ''}
          hover:bg-[#333] transition-colors cursor-pointer
        `}
      >
        {/* Tag Nummer */}
        <div className={`text-sm font-semibold mb-1 ${
          day.isToday ? 'text-[#ffbd59]' : 'text-gray-400'
        }`}>
          {day.date.format('D')}
        </div>

        {/* Ressourcen-Anzeige */}
        {hasResources && (
          <div className="space-y-1">
            {day.resources.slice(0, 3).map((resource, idx) => (
              <div
                key={idx}
                className="text-xs p-1 rounded"
                style={{
                  backgroundColor: `${STATUS_COLORS[resource.status || 'available']}20`,
                  borderLeft: `3px solid ${STATUS_COLORS[resource.status || 'available']}`
                }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-white truncate">
                    {resource.label || `${resource.person_count} Pers.`}
                  </span>
                  {resource.hours_allocated && (
                    <span className="text-gray-400 text-xs">
                      {resource.hours_allocated}h
                    </span>
                  )}
                </div>
              </div>
            ))}
            
            {day.resources.length > 3 && (
              <div className="text-xs text-gray-500 text-center">
                +{day.resources.length - 3} weitere
              </div>
            )}
          </div>
        )}

        {/* Total Persons Badge */}
        {totalPersons > 0 && (
          <div className="absolute bottom-1 right-1 bg-[#ffbd59] text-black text-xs px-1.5 py-0.5 rounded-full">
            {totalPersons}
          </div>
        )}
      </motion.div>
    );
  };

  // Render Week View
  const renderWeekView = () => {
    const weekDays = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
    const hours = Array.from({ length: 24 }, (_, i) => i);
    
    return (
      <div className="overflow-x-auto">
        <div className="min-w-[800px]">
          {/* Week Header */}
          <div className="grid grid-cols-8 gap-2 mb-2">
            <div className="text-center text-sm text-gray-400">Zeit</div>
            {calendarDays.map((day, idx) => (
              <div key={idx} className="text-center">
                <div className="text-sm text-gray-400">{weekDays[idx]}</div>
                <div className={`text-lg font-semibold ${
                  day.isToday ? 'text-[#ffbd59]' : 'text-white'
                }`}>
                  {day.date.format('DD.MM')}
                </div>
              </div>
            ))}
          </div>

          {/* Hour Grid */}
          <div className="border-t border-gray-700">
            {hours.filter(h => h % 2 === 0).map(hour => (
              <div key={hour} className="grid grid-cols-8 gap-2 border-b border-gray-800">
                <div className="text-xs text-gray-400 py-2 text-right pr-2">
                  {hour.toString().padStart(2, '0')}:00
                </div>
                {calendarDays.map((day, idx) => (
                  <div 
                    key={idx} 
                    className="border-l border-gray-800 min-h-[40px] hover:bg-[#333] transition-colors"
                  >
                    {day.resources
                      .filter(r => {
                        const entryHour = parseInt(dayjs(r.entry_date).format('HH'));
                        return entryHour >= hour && entryHour < hour + 2;
                      })
                      .map((resource, rIdx) => (
                        <div
                          key={rIdx}
                          className="text-xs p-1 m-1 rounded"
                          style={{
                            backgroundColor: `${STATUS_COLORS[resource.status || 'available']}40`,
                            borderLeft: `2px solid ${STATUS_COLORS[resource.status || 'available']}`
                          }}
                        >
                          {resource.person_count} Pers.
                        </div>
                      ))
                    }
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={`bg-[#1a1a1a] rounded-2xl p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <Calendar className="w-6 h-6 text-[#ffbd59]" />
          <h2 className="text-2xl font-bold text-white">Ressourcenplanung</h2>
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center space-x-2">
          {(['month', 'week', 'day'] as ViewMode[]).map(mode => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-3 py-1 rounded-lg transition-colors ${
                viewMode === mode 
                  ? 'bg-[#ffbd59] text-black' 
                  : 'bg-[#2a2a2a] text-gray-400 hover:text-white'
              }`}
            >
              {mode === 'month' ? 'Monat' : mode === 'week' ? 'Woche' : 'Tag'}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-[#2a2a2a] rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <Users className="w-5 h-5 text-gray-400" />
            <span className="text-xs text-gray-500">Gesamt</span>
          </div>
          <div className="text-2xl font-bold text-white">{stats.totalPersons}</div>
          <div className="text-xs text-gray-400">Personen</div>
        </div>

        <div className="bg-[#2a2a2a] rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <span className="text-xs text-gray-500">Verfügbar</span>
          </div>
          <div className="text-2xl font-bold text-green-500">{stats.availablePersons}</div>
          <div className="text-xs text-gray-400">Personen</div>
        </div>

        <div className="bg-[#2a2a2a] rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <Clock className="w-5 h-5 text-blue-500" />
            <span className="text-xs text-gray-500">Verplant</span>
          </div>
          <div className="text-2xl font-bold text-blue-500">{stats.allocatedPersons}</div>
          <div className="text-xs text-gray-400">Personen</div>
        </div>

        <div className="bg-[#2a2a2a] rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <AlertCircle className="w-5 h-5 text-[#ffbd59]" />
            <span className="text-xs text-gray-500">Auslastung</span>
          </div>
          <div className="text-2xl font-bold text-[#ffbd59]">{stats.utilizationRate}%</div>
          <div className="text-xs text-gray-400">Auslastungsrate</div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <button
            onClick={navigatePrevious}
            className="p-2 bg-[#2a2a2a] rounded-lg hover:bg-[#333] transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>
          <button
            onClick={navigateToday}
            className="px-4 py-2 bg-[#2a2a2a] text-white rounded-lg hover:bg-[#333] transition-colors"
          >
            Heute
          </button>
          <button
            onClick={navigateNext}
            className="p-2 bg-[#2a2a2a] rounded-lg hover:bg-[#333] transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-white" />
          </button>
        </div>

        <div className="text-xl font-semibold text-white">
          {viewMode === 'day' && currentDate.format('DD. MMMM YYYY')}
          {viewMode === 'week' && `KW ${currentDate.isoWeek()} - ${currentDate.year()}`}
          {viewMode === 'month' && currentDate.format('MMMM YYYY')}
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowLegend(!showLegend)}
            className="p-2 bg-[#2a2a2a] rounded-lg hover:bg-[#333] transition-colors"
          >
            {showLegend ? <EyeOff className="w-5 h-5 text-white" /> : <Eye className="w-5 h-5 text-white" />}
          </button>
          <button
            onClick={loadCalendarData}
            className="p-2 bg-[#2a2a2a] rounded-lg hover:bg-[#333] transition-colors"
          >
            <RefreshCw className="w-5 h-5 text-white" />
          </button>
          {onAddResource && (
            <button
              onClick={onAddResource}
              className="px-4 py-2 bg-[#ffbd59] text-black rounded-lg hover:bg-[#f59e0b] transition-colors flex items-center space-x-2"
            >
              <Plus className="w-5 h-5" />
              <span>Neue Ressource</span>
            </button>
          )}
        </div>
      </div>

      {/* Calendar Content */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#ffbd59]"></div>
        </div>
      ) : viewMode === 'month' ? (
        <>
          {/* Weekday Headers */}
          <div className="grid grid-cols-7 gap-2 mb-2">
            {['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map(day => (
              <div key={day} className="text-center text-sm font-semibold text-gray-400">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-2">
            {calendarDays.map(day => renderDayCell(day))}
          </div>
        </>
      ) : viewMode === 'week' ? (
        renderWeekView()
      ) : (
        // Day View
        <div className="space-y-4">
          {calendarDays[0]?.resources.length > 0 ? (
            calendarDays[0].resources.map((resource, idx) => (
              <div
                key={idx}
                className="bg-[#2a2a2a] rounded-lg p-4 border-l-4"
                style={{ borderColor: STATUS_COLORS[resource.status || 'available'] }}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-3">
                    <Users className="w-5 h-5 text-gray-400" />
                    <span className="text-white font-semibold">
                      {resource.label || `Ressource #${idx + 1}`}
                    </span>
                  </div>
                  <span 
                    className="px-2 py-1 rounded text-xs"
                    style={{
                      backgroundColor: `${STATUS_COLORS[resource.status || 'available']}30`,
                      color: STATUS_COLORS[resource.status || 'available']
                    }}
                  >
                    {STATUS_LABELS[resource.status || 'available']}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-gray-400">Personen:</span>
                    <span className="text-white ml-2">{resource.person_count}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Stunden:</span>
                    <span className="text-white ml-2">{resource.hours_allocated || 8}h</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Zeit:</span>
                    <span className="text-white ml-2">
                      {dayjs(resource.entry_date).format('HH:mm')}
                    </span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12 text-gray-500">
              Keine Ressourcen für diesen Tag geplant
            </div>
          )}
        </div>
      )}

      {/* Legend */}
      {showLegend && (
        <div className="mt-6 pt-6 border-t border-gray-700">
          <div className="flex items-center space-x-6">
            <span className="text-sm text-gray-400">Legende:</span>
            {Object.entries(STATUS_LABELS).map(([key, label]) => (
              <div key={key} className="flex items-center space-x-2">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: STATUS_COLORS[key as keyof typeof STATUS_COLORS] }}
                />
                <span className="text-sm text-gray-400">{label}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ResourceCalendar;