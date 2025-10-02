import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  Plus,
  Search,
  X
} from 'lucide-react';
import { resourceService, type Resource, type ResourceCalendarEntry, type ResourceAllocation } from '../api/resourceService';
import { useAuth } from '../context/AuthContext';
import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';
import weekOfYear from 'dayjs/plugin/weekOfYear';
import isBetween from 'dayjs/plugin/isBetween';

dayjs.extend(isoWeek);
dayjs.extend(weekOfYear);
dayjs.extend(isBetween);

interface ResourceCalendarProps {
  serviceProviderId?: number;
  onResourceClick?: (resource: Resource) => void;
  onAddResource?: () => void;
  className?: string;
  showFilters?: boolean;
  initialResources?: Resource[];
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
  className = '',
  showFilters = true,
  initialResources = []
}) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [currentDate, setCurrentDate] = useState(dayjs());
  // Nur Monatsansicht verwenden
  const [calendarEntries, setCalendarEntries] = useState<ResourceCalendarEntry[]>([]);
  const [resources, setResources] = useState<Resource[]>(initialResources);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showLegend, setShowLegend] = useState(true);
  const [calendarDays, setCalendarDays] = useState<CalendarDay[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [showFiltersPanel, setShowFiltersPanel] = useState(false);
  const [hoveredEntry, setHoveredEntry] = useState<ResourceCalendarEntry | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const initialResourcesRef = useRef<Resource[]>(initialResources);

  // Filter Ressourcen basierend auf Suchkriterien
  const getFilteredResources = useCallback(() => {
    return resources.filter(resource => {
      const matchesSearch = searchQuery === '' || 
        resource.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        resource.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        resource.provider_company_name?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCategory = selectedCategory === 'all' || resource.category === selectedCategory;
      const matchesStatus = selectedStatus === 'all' || resource.status === selectedStatus;
      
      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [resources, searchQuery, selectedCategory, selectedStatus]);

  // Finde Ressource für einen Kalendereintrag
  const getResourceForEntry = (entry: ResourceCalendarEntry): Resource | null => {
    return resources.find(resource => resource.id === entry.resource_id) || null;
  };

  // Erstelle Kalendereinträge aus Ressourcen-Daten
  const createCalendarEntriesFromResources = (resourceList: Resource[], startDate: string, endDate: string): ResourceCalendarEntry[] => {
    const entries: ResourceCalendarEntry[] = [];
    
    resourceList.forEach(resource => {
      if (!resource.start_date || !resource.end_date) return;
      
      const resourceStart = dayjs(resource.start_date);
      const resourceEnd = dayjs(resource.end_date);
      const periodStart = dayjs(startDate);
      const periodEnd = dayjs(endDate);
      
      // Builder-preferred Zeitraum (falls vorhanden)
      const builderStart = resource.builder_preferred_start_date ? dayjs(resource.builder_preferred_start_date) : null;
      const builderEnd = resource.builder_preferred_end_date ? dayjs(resource.builder_preferred_end_date) : null;
      
      // Finde Überschneidung zwischen Ressourcen-Zeitraum und Kalender-Zeitraum
      const overlapStart = resourceStart.isAfter(periodStart) ? resourceStart : periodStart;
      const overlapEnd = resourceEnd.isBefore(periodEnd) ? resourceEnd : periodEnd;
      
      if (overlapStart.isBefore(overlapEnd) || overlapStart.isSame(overlapEnd)) {
        // Erstelle Einträge für jeden Tag im Überschneidungszeitraum
        let current = overlapStart.startOf('day');
        const end = overlapEnd.endOf('day');
        
        while (current.isBefore(end) || current.isSame(end, 'day')) {
          // Bestimme Status basierend auf verschiedenen Faktoren
          let status: string;
          let color: string;
          let label: string;
          
          // 1. Grundlegender Ressourcen-Status
          if (resource.status === 'ALLOCATED') {
            status = 'confirmed';
            color = '#3b82f6';
            label = `${resource.person_count} ${resource.category} (Zugewiesen)`;
          } else if (resource.status === 'RESERVED') {
            status = 'tentative';
            color = '#f59e0b';
            label = `${resource.person_count} ${resource.category} (Reserviert)`;
          } else if (resource.status === 'COMPLETED') {
            status = 'completed';
            color = '#6b7280';
            label = `${resource.person_count} ${resource.category} (Abgeschlossen)`;
          } else if (resource.status === 'CANCELLED') {
            status = 'completed';
            color = '#ef4444';
            label = `${resource.person_count} ${resource.category} (Storniert)`;
          } else {
            // 2. Prüfe Builder-preferred Zeitraum
            if (builderStart && builderEnd && 
                current.isAfter(builderStart.subtract(1, 'day')) && 
                current.isBefore(builderEnd.add(1, 'day'))) {
              status = 'tentative';
              color = '#ff6b35'; // Orange-rot für deutlichere Hervorhebung
              label = `${resource.person_count} ${resource.category} (Bauträger-Wunsch)`;
            } else {
              status = 'available';
              color = '#10b981';
              label = `${resource.person_count} ${resource.category}`;
            }
          }
          
          entries.push({
            id: undefined,
            resource_id: resource.id,
            service_provider_id: resource.service_provider_id,
            entry_date: current.format('YYYY-MM-DD'),
            person_count: resource.person_count,
            hours_allocated: resource.daily_hours || 8,
            status: status as any,
            color: color,
            label: label
          });
          
          current = current.add(1, 'day');
        }
      }
    });
    
    console.log('📅 Erstellt', entries.length, 'Kalendereinträge aus', resourceList.length, 'Ressourcen');
    return entries;
  };

  // Lade Kalenderdaten
  const loadCalendarData = useCallback(async () => {
    if (!serviceProviderId && !user?.id) return;
    
    setLoading(true);
    try {
      const providerId = serviceProviderId || user?.id || 0;
      
      // Zeitraum für Monatsansicht
      const startDate = currentDate.startOf('month').subtract(7, 'days').format('YYYY-MM-DD');
      const endDate = currentDate.endOf('month').add(7, 'days').format('YYYY-MM-DD');

      // Verwende bereits gesetzte Ressourcen oder lade von API
      let resourceList: Resource[] = [];
      if (initialResourcesRef.current && initialResourcesRef.current.length > 0) {
        resourceList = initialResourcesRef.current;
        console.log('📅 Verwende initiale Ressourcen:', resourceList.length, 'Ressourcen');
      } else {
        console.log('📅 Lade Ressourcen von API...');
        resourceList = await resourceService.listResources({ 
          service_provider_id: providerId,
          start_date: startDate,
          end_date: endDate
        });
        setResources(resourceList);
      }

      // Erstelle Kalendereinträge aus Ressourcen-Daten (da API-Endpoint nicht verfügbar)
      let entries: ResourceCalendarEntry[] = [];
      try {
        // Versuche zuerst API-Aufruf
        entries = await resourceService.getCalendarEntries(providerId, startDate, endDate);
        console.log('📅 Kalendereinträge von API geladen:', entries.length);
      } catch (error) {
        console.log('⚠️ Kalendereinträge API nicht verfügbar, erstelle aus Ressourcen-Daten');
        // Erstelle Kalendereinträge aus Ressourcen-Daten
        entries = createCalendarEntriesFromResources(resourceList, startDate, endDate);
      }

      setCalendarEntries(entries);
      
      // Generiere Kalendertage
      generateCalendarDays(entries);
    } catch (error) {
      console.error('Fehler beim Laden der Kalenderdaten:', error);
    } finally {
      setLoading(false);
    }
  }, [serviceProviderId, user?.id, currentDate]);

  // Initiale Ressourcen setzen wenn verfügbar
  useEffect(() => {
    if (initialResourcesRef.current && initialResourcesRef.current.length > 0) {
      setResources(initialResourcesRef.current);
      console.log('📅 Initiale Ressourcen gesetzt:', initialResourcesRef.current.length);
    }
  }, []); // Nur einmal beim Mount

  useEffect(() => {
    loadCalendarData();
  }, [loadCalendarData]);

  // Generiere Kalender-Grid
  const generateCalendarDays = (entries: ResourceCalendarEntry[]) => {
    const days: CalendarDay[] = [];
    // Monatsansicht: Starte mit Montag der ersten Woche
    const firstDay = currentDate.startOf('month');
    const startOfWeek = firstDay.day() === 0 ? 6 : firstDay.day() - 1;
    let current = firstDay.subtract(startOfWeek, 'days');
    
    // Ende mit Sonntag der letzten Woche
    const lastDay = currentDate.endOf('month');
    const endOfWeek = lastDay.day() === 0 ? 0 : 7 - lastDay.day();
    const endDate = lastDay.add(endOfWeek, 'days');

    while (current.isBefore(endDate) || current.isSame(endDate)) {
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
    setCurrentDate(prev => prev.subtract(1, 'month'));
  };

  const navigateNext = () => {
    setCurrentDate(prev => prev.add(1, 'month'));
  };

  const navigateToday = () => {
    setCurrentDate(dayjs());
  };

  // Berechne Statistiken basierend auf gefilterten Ressourcen
  const calculateStats = () => {
    const filteredResources = getFilteredResources();
    
    const totalPersons = filteredResources.reduce((sum, resource) => 
      sum + (resource.person_count || 0), 0
    );
    
    const availablePersons = filteredResources
      .filter(resource => resource.status === 'AVAILABLE' && !resource.builder_preferred_start_date)
      .reduce((sum, resource) => sum + (resource.person_count || 0), 0);
    
    const allocatedPersons = filteredResources
      .filter(resource => ['ALLOCATED', 'RESERVED'].includes(resource.status || ''))
      .reduce((sum, resource) => sum + (resource.person_count || 0), 0);

    const builderPreferredPersons = filteredResources
      .filter(resource => resource.status === 'AVAILABLE' && resource.builder_preferred_start_date)
      .reduce((sum, resource) => sum + (resource.person_count || 0), 0);

    return {
      totalPersons,
      availablePersons,
      allocatedPersons,
      builderPreferredPersons,
      utilizationRate: totalPersons > 0 ? (allocatedPersons / totalPersons * 100).toFixed(1) : '0',
      totalResources: filteredResources.length
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
            {day.resources.slice(0, 3).map((resource, idx) => {
              const isBuilderPreferred = resource.label?.includes('Bauträger-Wunsch');
              return (
                <div
                  key={idx}
                  className={`text-xs p-1 rounded cursor-pointer hover:opacity-80 transition-all duration-200 ${
                    isBuilderPreferred ? 'ring-1 ring-orange-400 shadow-lg' : ''
                  }`}
                  style={{
                    backgroundColor: isBuilderPreferred 
                      ? `${STATUS_COLORS[resource.status || 'available']}30` 
                      : `${STATUS_COLORS[resource.status || 'available']}20`,
                    borderLeft: `3px solid ${STATUS_COLORS[resource.status || 'available']}`,
                    boxShadow: isBuilderPreferred ? '0 0 8px rgba(255, 107, 53, 0.3)' : 'none'
                  }}
                  onMouseEnter={(e) => {
                    setHoveredEntry(resource);
                    setTooltipPosition({ x: e.clientX, y: e.clientY });
                  }}
                  onMouseLeave={() => setHoveredEntry(null)}
                  onMouseMove={(e) => setTooltipPosition({ x: e.clientX, y: e.clientY })}
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
              );
            })}
            
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

  return (
    <div className={`bg-[#1a1a1a] rounded-2xl p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <Calendar className="w-6 h-6 text-[#ffbd59]" />
          <h2 className="text-2xl font-bold text-white">Ressourcenplanung</h2>
        </div>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Filter className="w-5 h-5 text-[#ffbd59]" />
              Filter & Suche
            </h3>
            <button
              onClick={() => setShowFiltersPanel(!showFiltersPanel)}
              className="flex items-center gap-2 px-3 py-2 bg-[#2a2a2a] text-white rounded-lg hover:bg-[#333] transition-colors"
            >
              <Filter className="w-4 h-4" />
              {showFiltersPanel ? 'Filter ausblenden' : 'Filter anzeigen'}
            </button>
          </div>

          {showFiltersPanel && (
            <div className="bg-[#2a2a2a] rounded-lg p-4 border border-gray-700">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Suchfeld */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Suche nach Kategorie oder Beschreibung..."
                    className="w-full pl-10 pr-4 py-2 bg-[#1a1a1a] text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ffbd59] border border-gray-600"
                  />
                </div>

                {/* Kategorie Filter */}
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-4 py-2 bg-[#1a1a1a] text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ffbd59] border border-gray-600"
                >
                  <option value="all">Alle Kategorien</option>
                  {Array.from(new Set(resources.map(r => r.category).filter(Boolean))).map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>

                {/* Status Filter */}
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="px-4 py-2 bg-[#1a1a1a] text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ffbd59] border border-gray-600"
                >
                  <option value="all">Alle Status</option>
                  <option value="AVAILABLE">Verfügbar</option>
                  <option value="RESERVED">Reserviert</option>
                  <option value="ALLOCATED">Zugewiesen</option>
                  <option value="COMPLETED">Abgeschlossen</option>
                  <option value="CANCELLED">Storniert</option>
                </select>
              </div>

              {/* Filter Ergebnisse */}
              <div className="mt-4 flex items-center justify-between">
                <div className="text-sm text-gray-400">
                  {getFilteredResources().length} von {resources.length} Ressourcen angezeigt
                </div>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('all');
                    setSelectedStatus('all');
                  }}
                  className="flex items-center gap-2 px-3 py-1 text-sm text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                  Filter zurücksetzen
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-6">
        <div className="bg-[#2a2a2a] rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <Users className="w-5 h-5 text-gray-400" />
            <span className="text-xs text-gray-500">Ressourcen</span>
          </div>
          <div className="text-2xl font-bold text-white">{stats.totalResources}</div>
          <div className="text-xs text-gray-400">Gesamt</div>
        </div>

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

        <div className="bg-[#2a2a2a] rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <MapPin className="w-5 h-5 text-purple-500" />
            <span className="text-xs text-gray-500">Bauträger-Wunsch</span>
          </div>
          <div className="text-2xl font-bold text-purple-500">{stats.builderPreferredPersons}</div>
          <div className="text-xs text-gray-400">Personen</div>
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
          {currentDate.format('MMMM YYYY')}
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
      ) : (
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
      )}

      {/* Legend */}
      {showLegend && (
        <div className="mt-6 pt-6 border-t border-gray-700">
          <div className="space-y-3">
            <span className="text-sm text-gray-400 font-medium">Legende:</span>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span className="text-sm text-gray-400">Verfügbar</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <span className="text-sm text-gray-400">Reserviert</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-blue-500" />
                <span className="text-sm text-gray-400">Zugewiesen</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-orange-500" />
                <span className="text-sm text-gray-400">Bauträger-Wunsch</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-gray-500" />
                <span className="text-sm text-gray-400">Abgeschlossen</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <span className="text-sm text-gray-400">Storniert</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tooltip */}
      {hoveredEntry && (
        <div
          className="fixed z-50 bg-[#1a1a1a] border border-gray-600 rounded-lg p-4 shadow-2xl max-w-sm"
          style={{
            left: tooltipPosition.x + 10,
            top: tooltipPosition.y - 10,
            pointerEvents: 'none'
          }}
        >
          {(() => {
            const resource = getResourceForEntry(hoveredEntry);
            if (!resource) return null;

            const totalDays = Math.ceil(dayjs(resource.end_date).diff(dayjs(resource.start_date), 'day') + 1);
            const totalHours = totalDays * (resource.daily_hours || 8) * resource.person_count;
            const builderStart = resource.builder_preferred_start_date ? dayjs(resource.builder_preferred_start_date) : null;
            const builderEnd = resource.builder_preferred_end_date ? dayjs(resource.builder_preferred_end_date) : null;

            return (
              <div className="space-y-3">
                {/* Header */}
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: hoveredEntry.color }}
                  />
                  <h3 className="text-white font-semibold">{resource.category}</h3>
                </div>

                {/* Basis-Informationen */}
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Personen:</span>
                    <span className="text-white">{resource.person_count}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Tägliche Stunden:</span>
                    <span className="text-white">{resource.daily_hours || 8}h</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Gesamtstunden:</span>
                    <span className="text-white">{totalHours}h</span>
                  </div>
                </div>

                {/* Zeitraum */}
                <div className="border-t border-gray-700 pt-2">
                  <div className="text-sm text-gray-400 mb-1">Zeitraum:</div>
                  <div className="text-sm text-white">
                    {dayjs(resource.start_date).format('DD.MM.YYYY')} - {dayjs(resource.end_date).format('DD.MM.YYYY')}
                  </div>
                  <div className="text-xs text-gray-500">
                    {totalDays} Tage ({Math.ceil(totalDays / 7)} Wochen)
                  </div>
                </div>

                {/* Builder-preferred Zeitraum */}
                {builderStart && builderEnd && (
                  <div className="border-t border-gray-700 pt-2">
                    <div className="text-sm text-gray-400 mb-1">Bauträger-Wunsch:</div>
                    <div className="text-sm text-purple-300">
                      {builderStart.format('DD.MM.YYYY')} - {builderEnd.format('DD.MM.YYYY')}
                    </div>
                    {resource.builder_date_range_notes && (
                      <div className="text-xs text-gray-400 mt-1 italic">
                        "{resource.builder_date_range_notes}"
                      </div>
                    )}
                  </div>
                )}

                {/* Status */}
                <div className="border-t border-gray-700 pt-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-400">Status:</span>
                    <span className={`text-sm px-2 py-1 rounded text-xs font-medium ${
                      resource.status === 'AVAILABLE' ? 'bg-green-500/20 text-green-400' :
                      resource.status === 'ALLOCATED' ? 'bg-blue-500/20 text-blue-400' :
                      resource.status === 'RESERVED' ? 'bg-yellow-500/20 text-yellow-400' :
                      resource.status === 'COMPLETED' ? 'bg-gray-500/20 text-gray-400' :
                      'bg-red-500/20 text-red-400'
                    }`}>
                      {resource.status === 'AVAILABLE' ? 'Verfügbar' :
                       resource.status === 'ALLOCATED' ? 'Zugewiesen' :
                       resource.status === 'RESERVED' ? 'Reserviert' :
                       resource.status === 'COMPLETED' ? 'Abgeschlossen' :
                       resource.status === 'CANCELLED' ? 'Storniert' : 'Unbekannt'}
                    </span>
                  </div>
                </div>

                {/* Beschreibung */}
                {resource.description && (
                  <div className="border-t border-gray-700 pt-2">
                    <div className="text-sm text-gray-400 mb-1">Beschreibung:</div>
                    <div className="text-sm text-gray-300">{resource.description}</div>
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
};

export default ResourceCalendar;