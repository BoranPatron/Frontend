import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  Calendar,
  Clock,
  MapPin,
  Euro,
  Plus,
  Eye,
  Edit,
  Trash2,
  ChevronRight,
  Info,
  AlertCircle,
  CheckCircle,
  TrendingUp,
  Activity,
  BarChart3,
  Filter,
  Search,
  RefreshCw
} from 'lucide-react';
import { resourceService, type Resource } from '../api/resourceService';
import { useAuth } from '../context/AuthContext';
import ResourceManagementModal from './ResourceManagementModal';
import dayjs from 'dayjs';

interface ResourceManagementDashboardProps {
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

const ResourceManagementDashboard: React.FC<ResourceManagementDashboardProps> = ({
  className = ''
}) => {
  const { user } = useAuth();
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editResource, setEditResource] = useState<Resource | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
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
      resource.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = selectedCategory === '' || resource.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  // Berechne Nutzungsgrad für eine Ressource
  const calculateResourceUtilization = (resource: Resource) => {
    if (!resource.builder_preferred_start_date || !resource.builder_preferred_end_date) {
      return null;
    }

    const totalDays = Math.ceil(dayjs(resource.end_date).diff(dayjs(resource.start_date), 'day') + 1);
    const usedDays = Math.ceil(dayjs(resource.builder_preferred_end_date).diff(dayjs(resource.builder_preferred_start_date), 'day') + 1);
    
    return Math.round((usedDays / totalDays) * 100);
  };

  // Kategorien für Filter
  const categories = Array.from(new Set(resources.map(r => r.category).filter(Boolean)));

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
              Teilen Sie Ihre verfügbaren Mitarbeiter und Kapazitäten mit Bauträgern. Diese können Ihre Ressourcen für Projekte vormerken und Sie zu Angeboten einladen.
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
          <button
            onClick={() => setShowCreateModal(true)}
            className="text-sm text-gray-400 hover:text-white transition-colors"
          >
            Ausblenden
          </button>
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
          <div className="space-y-3">
            {filteredResources.map((resource) => (
              <motion.div
                key={resource.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-[#2a2a2a] rounded-lg p-4 border border-gray-700 hover:border-gray-600 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-white">
                        {resource.person_count} {resource.category}
                      </h3>
                      
                      {/* Status Badge */}
                      <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                        resource.status === 'available' 
                          ? 'bg-green-500/20 text-green-400' 
                          : resource.status === 'allocated'
                          ? 'bg-red-500/20 text-red-400'
                          : 'bg-gray-500/20 text-gray-400'
                      }`}>
                        {resource.status === 'available' ? 'Verfügbar' : 
                         resource.status === 'allocated' ? 'Angezogen' : 'Reserviert'}
                      </span>

                      {/* Builder Date Range Notes Badge */}
                      {resource.builder_date_range_notes && (
                        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-500/20 text-blue-400">
                          💬 Bauträger-Notizen
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                      <div className="flex items-center gap-2 text-gray-400">
                        <Users className="w-4 h-4" />
                        <span>Uster • ab 26.9.2025</span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-gray-400">
                        <Calendar className="w-4 h-4" />
                        <span>
                          {dayjs(resource.start_date).format('DD.MM.YYYY')} - {dayjs(resource.end_date).format('DD.MM.YYYY')}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-gray-400">
                        <Clock className="w-4 h-4" />
                        <span>{resource.total_hours}h</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[#ffbd59] font-semibold">
                          {calculateResourceUtilization(resource) ? `${calculateResourceUtilization(resource)}%` : '9 Personentage'}
                        </span>
                      </div>
                    </div>

                    {/* Ressourcennutzung - Differenz zwischen tatsächlichen und gewünschten Zeiträumen */}
                    {resource.builder_preferred_start_date && resource.builder_preferred_end_date && (
                      <div className="mt-3 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                            <span className="text-sm text-blue-300 font-medium">Ressourcennutzung durch Bauträger</span>
                          </div>
                          <span className="text-sm text-[#ffbd59] font-semibold">
                            {calculateResourceUtilization(resource)}%
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                          <div>
                            <span className="text-gray-400">Dienstleister bereit:</span>
                            <div className="text-blue-300">
                              {dayjs(resource.start_date).format('DD.MM.YY')} - {dayjs(resource.end_date).format('DD.MM.YY')}
                            </div>
                          </div>
                          <div>
                            <span className="text-gray-400">Bauträger wünscht:</span>
                            <div className="text-[#ffbd59]">
                              {dayjs(resource.builder_preferred_start_date).format('DD.MM.YY')} - {dayjs(resource.builder_preferred_end_date).format('DD.MM.YY')}
                            </div>
                          </div>
                          <div>
                            <span className="text-gray-400">Nutzungsgrad:</span>
                            <div className="text-green-400 font-medium">
                              {calculateResourceUtilization(resource)}% genutzt
                            </div>
                          </div>
                        </div>

                        {/* Bauträger-Notizen */}
                        {resource.builder_date_range_notes && (
                          <div className="mt-3 p-2 bg-blue-600/10 border border-blue-600/20 rounded">
                            <div className="text-xs text-blue-300 font-medium mb-1">💬 Bauträger-Notizen:</div>
                            <div className="text-xs text-gray-300">{resource.builder_date_range_notes}</div>
                          </div>
                        )}

                        {/* Fortschrittsbalken */}
                        <div className="mt-3">
                          <div className="w-full bg-gray-600 rounded-full h-2">
                            <div 
                              className="bg-gradient-to-r from-green-400 to-[#ffbd59] h-2 rounded-full transition-all"
                              style={{
                                width: `${calculateResourceUtilization(resource)}%`
                              }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => setEditResource(resource)}
                      className="p-2 text-gray-400 hover:text-white hover:bg-[#333] rounded transition-colors"
                      title="Bearbeiten"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                      title="Löschen"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Buttons */}
      <div className="flex justify-between items-center">
        <button className="px-6 py-2 bg-[#2a2a2a] text-white rounded-lg hover:bg-[#333] transition-colors border border-gray-700">
          Kalenderansicht
        </button>
        
        <button className="px-6 py-2 bg-[#2a2a2a] text-white rounded-lg hover:bg-[#333] transition-colors border border-gray-700">
          KPI Dashboard
        </button>
        
        <button className="px-6 py-2 bg-[#ffbd59] text-black rounded-lg hover:bg-[#f59e0b] transition-colors font-medium">
          Detailansicht
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
    </div>
  );
};

export default ResourceManagementDashboard;

