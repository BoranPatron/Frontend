import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  Calendar,
  Clock,
  TrendingUp,
  Activity,
  Plus,
  Search,
  Filter,
  RefreshCw,
  AlertCircle,
  Info,
  BarChart3,
  X
} from 'lucide-react';
import { resourceService, type Resource } from '../api/resourceService';
import { useAuth } from '../context/AuthContext';
import EnhancedResourceCard from './EnhancedResourceCard';
import ResourceManagementModal from './ResourceManagementModal';
import ResourceCalendar from './ResourceCalendar';
import ResourceKPIDashboard from './ResourceKPIDashboard';
import dayjs from 'dayjs';

interface EnhancedResourceListProps {
  className?: string;
}

interface ResourceStats {
  totalResources: number;
  availableResources: number;
  assignedResources: number;
  totalPersonDays: number;
  utilization: number;
  noData: boolean;
}

const EnhancedResourceList: React.FC<EnhancedResourceListProps> = ({
  className = ''
}) => {
  const { user } = useAuth();
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editResource, setEditResource] = useState<Resource | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [showCalendarView, setShowCalendarView] = useState(false);
  const [showKPIDashboard, setShowKPIDashboard] = useState(false);
  const [stats, setStats] = useState<ResourceStats>({
    totalResources: 0,
    availableResources: 0,
    assignedResources: 0,
    totalPersonDays: 0,
    utilization: 0,
    noData: true
  });

  // Lade Ressourcen
  const loadResources = async () => {
    setLoading(true);
    try {
      const data = await resourceService.listResources({
        service_provider_id: user?.id
      });
      
      console.log('Loaded resources:', data);
      setResources(data);
      
      // Berechne Statistiken
      calculateStats(data);
    } catch (error) {
      console.error('Error loading resources:', error);
    } finally {
      setLoading(false);
    }
  };

  // Berechne Statistiken
  const calculateStats = (resourceData: Resource[]) => {
    if (resourceData.length === 0) {
      setStats({
        totalResources: 0,
        availableResources: 0,
        assignedResources: 0,
        totalPersonDays: 0,
        utilization: 0,
        noData: true
      });
      return;
    }

    const totalResources = resourceData.length;
    const availableResources = resourceData.filter(r => r.status === 'available').length;
    const assignedResources = resourceData.filter(r => r.status === 'allocated' || r.status === 'reserved').length;
    
    // Berechne Personentage
    const totalPersonDays = resourceData.reduce((sum, resource) => {
      if (resource.start_date && resource.end_date) {
        const days = Math.ceil(dayjs(resource.end_date).diff(dayjs(resource.start_date), 'day') + 1);
        return sum + (days * resource.person_count);
      }
      return sum;
    }, 0);

    // Berechne Auslastung (vereinfacht)
    const utilization = totalResources > 0 ? Math.round((assignedResources / totalResources) * 100) : 0;

    setStats({
      totalResources,
      availableResources,
      assignedResources,
      totalPersonDays,
      utilization,
      noData: false
    });
  };

  useEffect(() => {
    loadResources();
  }, [user?.id]);

  // Filter Ressourcen
  const filteredResources = resources.filter(resource => {
    const matchesSearch = searchQuery === '' || 
      resource.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      resource.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      resource.provider_company_name?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = selectedCategory === '' || resource.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  // Kategorien für Filter
  const categories = Array.from(new Set(resources.map(r => r.category).filter(Boolean)));

  // Handle resource edit
  const handleEdit = (resource: Resource) => {
    setEditResource(resource);
  };

  // Handle resource delete
  const handleDelete = async (resourceId: number) => {
    if (window.confirm('Möchten Sie diese Ressource wirklich löschen?')) {
      try {
        await resourceService.deleteResource(resourceId);
        loadResources();
      } catch (error) {
        console.error('Error deleting resource:', error);
        alert('Fehler beim Löschen der Ressource');
      }
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Users className="w-8 h-8 text-[#ffbd59]" />
            Ressourcenverwaltung
          </h1>
          <p className="text-gray-400 mt-1">Personal- und Kapazitätsplanung für Ihre Projekte</p>
        </div>
        
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#ffbd59] text-black rounded-lg hover:bg-[#f59e0b] transition-colors font-medium"
        >
          <Plus className="w-4 h-4" />
          Ressourcen ausschreiben
        </button>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="text-blue-300 font-medium mb-1">Ressourcen intelligent verwalten</h3>
            <p className="text-blue-200 text-sm leading-relaxed">
              Teile deine verfügbaren Mitarbeiter und Kapazitäten mit Bauträgern. Diese können deine Ressourcen für Projekte vormerken und dich zu Angeboten einladen.
            </p>
            <div className="mt-2 text-red-300 text-sm flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              Angezogene Ressourcen werden hier markiert angezeigt.
            </div>
          </div>
        </div>
      </div>

      {/* Statistik-Kacheln */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Verfügbare Mitarbeiter */}
        <div className="bg-[#2a2a2a] rounded-lg p-4 border border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-400">Verfügbare Mitarbeiter</h3>
            <Users className="w-5 h-5 text-gray-400" />
          </div>
          <div className="text-2xl font-bold text-white mb-1">
            {stats.availableResources}
          </div>
          <div className="text-xs text-gray-500">Aktive Ressourcen</div>
        </div>

        {/* Angezogene Ressourcen */}
        <div className="bg-[#2a2a2a] rounded-lg p-4 border border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-400">Angezogene Ressourcen</h3>
            <Activity className="w-5 h-5 text-[#ffbd59]" />
          </div>
          <div className="text-2xl font-bold text-white mb-1">
            {stats.assignedResources}
          </div>
          <div className="text-xs text-gray-500">Von Bauträgern ausgewählt</div>
        </div>

        {/* Personentage */}
        <div className="bg-[#2a2a2a] rounded-lg p-4 border border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-400">Personentage (Monat)</h3>
            <Clock className="w-5 h-5 text-gray-400" />
          </div>
          <div className="text-2xl font-bold text-white mb-1">
            {stats.totalPersonDays}
          </div>
          <div className="text-xs text-gray-500">160 Stunden</div>
        </div>

        {/* Auslastung */}
        <div className="bg-[#2a2a2a] rounded-lg p-4 border border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-400">Auslastung</h3>
            <TrendingUp className="w-5 h-5 text-green-400" />
          </div>
          <div className="text-2xl font-bold text-white mb-1">
            {stats.noData ? '-' : `${stats.utilization}%`}
          </div>
          <div className="text-xs text-gray-500">Keine Daten</div>
        </div>
      </div>

      {/* Automatische Berechnung Info */}
      <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="text-yellow-300 font-medium mb-1">Automatische Berechnung</h3>
            <p className="text-yellow-200 text-sm">
              Personentage werden automatisch berechnet: Anzahl Personen × Arbeitstage × tägliche Stunden. Ein Personentag entspricht 8 Arbeitsstunden.
            </p>
          </div>
        </div>
      </div>

      {/* Filter und Suche */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Suche nach Kategorie oder Beschreibung..."
            className="w-full pl-10 pr-4 py-2 bg-[#2a2a2a] text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ffbd59] border border-gray-700"
          />
        </div>
        
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-4 py-2 bg-[#2a2a2a] text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ffbd59] border border-gray-700"
        >
          <option value="">Alle Kategorien</option>
          {categories.map(category => (
            <option key={category} value={category}>{category}</option>
          ))}
        </select>

        <button
          onClick={loadResources}
          className="flex items-center gap-2 px-4 py-2 bg-[#2a2a2a] text-white rounded-lg hover:bg-[#333] transition-colors border border-gray-700"
        >
          <RefreshCw className="w-4 h-4" />
          Aktualisieren
        </button>
      </div>

      {/* Ressourcen-Liste */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Ihre Ressourcen</h2>
          <span className="text-sm text-gray-400">
            {filteredResources.length} von {resources.length} Ressourcen
          </span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#ffbd59]"></div>
          </div>
        ) : filteredResources.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 mb-4">
              {searchQuery || selectedCategory ? 'Keine Ressourcen gefunden' : 'Noch keine Ressourcen erstellt'}
            </p>
            {!searchQuery && !selectedCategory && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-4 py-2 bg-[#ffbd59] text-black rounded-lg hover:bg-[#f59e0b] transition-colors"
              >
                Erste Ressource erstellen
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence>
              {filteredResources.map((resource) => (
                <EnhancedResourceCard
                  key={resource.id}
                  resource={resource}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Bottom Actions */}
      <div className="flex justify-between items-center pt-6">
        <button 
          onClick={() => setShowCalendarView(true)}
          className="px-6 py-2 bg-[#2a2a2a] text-white rounded-lg hover:bg-[#333] transition-colors border border-gray-700 flex items-center gap-2"
        >
          <Calendar className="w-4 h-4" />
          Kalenderansicht
        </button>
        
        <button 
          onClick={() => {
            console.log('🔄 KPI Dashboard button clicked (EnhancedResourceList)');
            setShowKPIDashboard(true);
          }}
          className="px-6 py-2 bg-[#2a2a2a] text-white rounded-lg hover:bg-[#333] transition-colors border border-gray-700 flex items-center gap-2"
        >
          <BarChart3 className="w-4 h-4" />
          KPI Dashboard
        </button>
      </div>

      {/* Resource Management Modal */}
      <ResourceManagementModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        editResource={editResource}
        onResourceCreated={(resource) => {
          loadResources();
          setEditResource(null);
          setShowCreateModal(false);
        }}
      />

      {/* Edit Modal */}
      {editResource && (
        <ResourceManagementModal
          isOpen={!!editResource}
          onClose={() => setEditResource(null)}
          editResource={editResource}
          onResourceCreated={(resource) => {
            loadResources();
            setEditResource(null);
          }}
        />
      )}

      {/* Calendar View Modal */}
      {showCalendarView && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1a1a] rounded-2xl w-full max-w-7xl max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-700">
              <h2 className="text-2xl font-bold text-white">Ressourcen-Kalenderansicht</h2>
              <button
                onClick={() => setShowCalendarView(false)}
                className="p-2 text-gray-400 hover:text-white hover:bg-[#333] rounded-lg transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              <ResourceCalendar
                serviceProviderId={user?.id}
                initialResources={resources}
                onAddResource={() => setShowCreateModal(true)}
                showFilters={true}
              />
            </div>
          </div>
        </div>
      )}

      {/* KPI Dashboard Modal */}
      <ResourceKPIDashboard
        isOpen={showKPIDashboard}
        onClose={() => {
          console.log('🔄 KPI Dashboard closing (EnhancedResourceList)');
          setShowKPIDashboard(false);
        }}
      />
    </div>
  );
};

export default EnhancedResourceList;

