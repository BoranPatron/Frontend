import React, { useState, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Map,
  Search,
  Users,
  Calendar,
  MapPin,
  Filter,
  X,
  ChevronDown,
  ChevronUp,
  Clock,
  Euro,
  Star,
  CheckCircle,
  AlertCircle,
  Phone,
  Mail,
  Building,
  Wrench,
  Plus,
  Eye,
  Settings,
  Navigation
} from 'lucide-react';
import { resourceService, type Resource, type ResourceSearchParams } from '../api/resourceService';
import { useAuth } from '../context/AuthContext';
import AddressAutocomplete from './AddressAutocomplete';
import { TRADE_CATEGORIES } from '../constants/tradeCategories';
import dayjs from 'dayjs';

// Fix für Leaflet Icons
import 'leaflet/dist/leaflet.css';
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: '/marker-icon-2x.png',
  iconUrl: '/marker-icon.png',
  shadowUrl: '/marker-shadow.png',
});

interface ResourceGeoSearchProps {
  tradeId?: number;
  category?: string;
  onResourceSelect?: (resources: Resource[]) => void;
  selectedResources?: Resource[];
  className?: string;
}

interface MapBounds {
  center: [number, number];
  zoom: number;
}

// Map Control Component
const MapControls: React.FC<{ onCenterLocation: () => void }> = ({ onCenterLocation }) => {
  const map = useMap();
  
  return (
    <div className="absolute top-4 right-4 z-[1000] flex flex-col space-y-2">
      <button
        onClick={onCenterLocation}
        className="p-2 bg-white rounded-lg shadow-lg hover:bg-gray-100 transition-colors"
      >
        <Navigation className="w-5 h-5 text-gray-700" />
      </button>
    </div>
  );
};

const ResourceGeoSearch: React.FC<ResourceGeoSearchProps> = ({
  tradeId,
  category,
  onResourceSelect,
  selectedResources = [],
  className = ''
}) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [resources, setResources] = useState<Resource[]>([]);
  const [filteredResources, setFilteredResources] = useState<Resource[]>([]);
  const [mapBounds, setMapBounds] = useState<MapBounds>({
    center: [52.5200, 13.4050], // Berlin als Default
    zoom: 10
  });
  
  // Filter State
  const [showFilters, setShowFilters] = useState(true);
  const [searchParams, setSearchParams] = useState<ResourceSearchParams>({
    category: category || '',
    start_date: dayjs().format('YYYY-MM-DD'),
    end_date: dayjs().add(30, 'days').format('YYYY-MM-DD'),
    radius_km: 50,
    status: 'available'
  });
  
  const [selectedResourceIds, setSelectedResourceIds] = useState<number[]>(
    selectedResources.map(r => r.id!).filter(Boolean)
  );
  
  const [hoveredResource, setHoveredResource] = useState<Resource | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  // Lade Ressourcen basierend auf Standort
  const loadResources = useCallback(async () => {
    setLoading(true);
    try {
      const params: ResourceSearchParams = {
        ...searchParams,
        latitude: mapBounds.center[0],
        longitude: mapBounds.center[1]
      };
      
      const results = await resourceService.searchResourcesGeo(params);
      setResources(results);
      setFilteredResources(results);
    } catch (error) {
      console.error('Fehler beim Laden der Ressourcen:', error);
    } finally {
      setLoading(false);
    }
  }, [searchParams, mapBounds]);

  useEffect(() => {
    loadResources();
  }, [loadResources]);

  // Filtere Ressourcen
  const applyFilters = () => {
    let filtered = [...resources];
    
    // Nach Personenzahl filtern
    if (searchParams.min_persons) {
      filtered = filtered.filter(r => r.person_count >= searchParams.min_persons!);
    }
    
    // Nach Preis filtern
    if (searchParams.max_hourly_rate) {
      filtered = filtered.filter(r => 
        !r.hourly_rate || r.hourly_rate <= searchParams.max_hourly_rate!
      );
    }
    
    // Nach Skills filtern
    if (searchParams.skills && searchParams.skills.length > 0) {
      filtered = filtered.filter(r => 
        searchParams.skills?.some(skill => 
          r.skills?.includes(skill)
        )
      );
    }
    
    setFilteredResources(filtered);
  };

  // Ressource auswählen/abwählen
  const toggleResourceSelection = (resource: Resource) => {
    if (!resource.id) return;
    
    setSelectedResourceIds(prev => {
      const newIds = prev.includes(resource.id!)
        ? prev.filter(id => id !== resource.id)
        : [...prev, resource.id!];
      
      // Callback mit vollständigen Ressourcen
      if (onResourceSelect) {
        const selectedRes = resources.filter(r => newIds.includes(r.id!));
        onResourceSelect(selectedRes);
      }
      
      return newIds;
    });
  };

  // Custom Marker Icons
  const createCustomIcon = (resource: Resource, isSelected: boolean) => {
    const color = isSelected ? '#ffbd59' : 
                  resource.status === 'available' ? '#10b981' : 
                  resource.status === 'allocated' ? '#3b82f6' : '#6b7280';
    
    return L.divIcon({
      className: 'custom-div-icon',
      html: `
        <div style="
          background-color: ${color};
          width: 40px;
          height: 40px;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          display: flex;
          align-items: center;
          justify-content: center;
          border: 3px solid white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        ">
          <div style="transform: rotate(45deg); color: white; font-weight: bold; font-size: 14px;">
            ${resource.person_count}
          </div>
        </div>
      `,
      iconSize: [40, 40],
      iconAnchor: [20, 40],
      popupAnchor: [0, -40]
    });
  };

  // Berechne Statistiken
  const calculateStats = () => {
    const totalPersons = filteredResources.reduce((sum, r) => sum + r.person_count, 0);
    const avgHourlyRate = filteredResources.length > 0 
      ? filteredResources.reduce((sum, r) => sum + (r.hourly_rate || 0), 0) / filteredResources.length
      : 0;
    const selectedPersons = filteredResources
      .filter(r => selectedResourceIds.includes(r.id!))
      .reduce((sum, r) => sum + r.person_count, 0);
    
    return {
      totalResources: filteredResources.length,
      totalPersons,
      avgHourlyRate,
      selectedResources: selectedResourceIds.length,
      selectedPersons
    };
  };

  const stats = calculateStats();

  // Center map on user location
  const centerOnUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setMapBounds({
            center: [position.coords.latitude, position.coords.longitude],
            zoom: 12
          });
        },
        (error) => {
          console.error('Fehler beim Abrufen der Position:', error);
        }
      );
    }
  };

  return (
    <div className={`bg-[#1a1a1a] rounded-2xl overflow-hidden ${className}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-[#ffbd59] to-[#f59e0b] p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Map className="w-6 h-6 text-white" />
            <div>
              <h3 className="text-xl font-bold text-white">Ressourcen-Suche</h3>
              <p className="text-sm text-white/80">
                Verfügbare Ressourcen in Ihrer Nähe
              </p>
            </div>
          </div>
          
          {/* Stats */}
          <div className="flex items-center space-x-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-white">{stats.totalResources}</div>
              <div className="text-xs text-white/80">Gefunden</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-white">{stats.selectedResources}</div>
              <div className="text-xs text-white/80">Ausgewählt</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-white">{stats.selectedPersons}</div>
              <div className="text-xs text-white/80">Personen</div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex h-[700px]">
        {/* Left Sidebar - Filters & List */}
        <div className={`${showFilters ? 'w-96' : 'w-12'} transition-all duration-300 bg-[#2a2a2a] border-r border-gray-700`}>
          {showFilters ? (
            <div className="p-4 h-full overflow-y-auto">
              {/* Toggle Button */}
              <button
                onClick={() => setShowFilters(false)}
                className="mb-4 p-2 hover:bg-[#333] rounded-lg transition-colors"
              >
                <ChevronUp className="w-5 h-5 text-gray-400" />
              </button>

              {/* Search Filters */}
              <div className="space-y-4 mb-6">
                <h4 className="text-lg font-semibold text-white flex items-center">
                  <Filter className="w-5 h-5 mr-2 text-[#ffbd59]" />
                  Filter
                </h4>

                {/* Date Range */}
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Zeitraum</label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="date"
                      value={searchParams.start_date}
                      onChange={(e) => setSearchParams(prev => ({ ...prev, start_date: e.target.value }))}
                      className="bg-[#333] text-white rounded-lg px-3 py-2 text-sm"
                    />
                    <input
                      type="date"
                      value={searchParams.end_date}
                      onChange={(e) => setSearchParams(prev => ({ ...prev, end_date: e.target.value }))}
                      className="bg-[#333] text-white rounded-lg px-3 py-2 text-sm"
                    />
                  </div>
                </div>

                {/* Category */}
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Kategorie</label>
                  <select
                    value={searchParams.category}
                    onChange={(e) => setSearchParams(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full bg-[#333] text-white rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="">Alle Kategorien</option>
                    {TRADE_CATEGORIES.map(category => (
                      <option key={category.value} value={category.value}>
                        {category.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Min Persons */}
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Min. Personen</label>
                  <input
                    type="number"
                    min="1"
                    value={searchParams.min_persons || ''}
                    onChange={(e) => setSearchParams(prev => ({ 
                      ...prev, 
                      min_persons: e.target.value ? parseInt(e.target.value) : undefined 
                    }))}
                    placeholder="z.B. 5"
                    className="w-full bg-[#333] text-white rounded-lg px-3 py-2 text-sm"
                  />
                </div>

                {/* Max Hourly Rate */}
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Max. Stundensatz (€)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={searchParams.max_hourly_rate || ''}
                    onChange={(e) => setSearchParams(prev => ({ 
                      ...prev, 
                      max_hourly_rate: e.target.value ? parseFloat(e.target.value) : undefined 
                    }))}
                    placeholder="z.B. 50.00"
                    className="w-full bg-[#333] text-white rounded-lg px-3 py-2 text-sm"
                  />
                </div>

                {/* Search Radius */}
                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    Suchradius: {searchParams.radius_km} km
                  </label>
                  <input
                    type="range"
                    min="5"
                    max="200"
                    step="5"
                    value={searchParams.radius_km}
                    onChange={(e) => setSearchParams(prev => ({ 
                      ...prev, 
                      radius_km: parseInt(e.target.value) 
                    }))}
                    className="w-full"
                  />
                </div>

                <button
                  onClick={() => { applyFilters(); loadResources(); }}
                  className="w-full px-4 py-2 bg-[#ffbd59] text-black rounded-lg hover:bg-[#f59e0b] transition-colors flex items-center justify-center space-x-2"
                >
                  <Search className="w-4 h-4" />
                  <span>Suchen</span>
                </button>
              </div>

              {/* Resource List */}
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-gray-400 mb-2">
                  Gefundene Ressourcen ({filteredResources.length})
                </h4>
                
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {filteredResources.map(resource => (
                    <motion.div
                      key={resource.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`p-3 rounded-lg border transition-all cursor-pointer ${
                        selectedResourceIds.includes(resource.id!)
                          ? 'bg-[#ffbd59]/10 border-[#ffbd59]'
                          : 'bg-[#333] border-gray-700 hover:border-gray-600'
                      }`}
                      onClick={() => toggleResourceSelection(resource)}
                      onMouseEnter={() => setHoveredResource(resource)}
                      onMouseLeave={() => setHoveredResource(null)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <div className={`w-2 h-2 rounded-full ${
                            resource.status === 'available' ? 'bg-green-500' : 'bg-gray-500'
                          }`} />
                          <span className="text-sm font-semibold text-white">
                            {resource.provider_name || 'Unbekannt'}
                          </span>
                        </div>
                        <input
                          type="checkbox"
                          checked={selectedResourceIds.includes(resource.id!)}
                          onChange={(e) => {
                            e.stopPropagation();
                            toggleResourceSelection(resource);
                          }}
                          className="rounded border-gray-600 text-[#ffbd59] focus:ring-[#ffbd59]"
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="flex items-center space-x-1">
                          <Users className="w-3 h-3 text-gray-400" />
                          <span className="text-gray-300">{resource.person_count} Pers.</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Clock className="w-3 h-3 text-gray-400" />
                          <span className="text-gray-300">{resource.total_hours}h</span>
                        </div>
                        {resource.hourly_rate && (
                          <div className="flex items-center space-x-1">
                            <Euro className="w-3 h-3 text-gray-400" />
                            <span className="text-gray-300">{resource.hourly_rate}€/h</span>
                          </div>
                        )}
                        <div className="flex items-center space-x-1">
                          <MapPin className="w-3 h-3 text-gray-400" />
                          <span className="text-gray-300 truncate">
                            {resource.address_city || 'Unbekannt'}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center">
              <button
                onClick={() => setShowFilters(true)}
                className="p-2 hover:bg-[#333] rounded-lg transition-colors"
              >
                <ChevronDown className="w-5 h-5 text-gray-400 rotate-90" />
              </button>
            </div>
          )}
        </div>

        {/* Map Container */}
        <div className="flex-1 relative">
          {loading && (
            <div className="absolute inset-0 bg-black/50 z-[1000] flex items-center justify-center">
              <div className="bg-[#2a2a2a] rounded-lg p-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#ffbd59]"></div>
              </div>
            </div>
          )}
          
          <MapContainer
            center={mapBounds.center}
            zoom={mapBounds.zoom}
            className="h-full w-full"
            style={{ background: '#1a1a1a' }}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            />
            
            {/* Search Radius Circle */}
            <Circle
              center={mapBounds.center}
              radius={searchParams.radius_km! * 1000}
              pathOptions={{
                color: '#ffbd59',
                fillColor: '#ffbd59',
                fillOpacity: 0.1,
                weight: 2,
                dashArray: '5, 10'
              }}
            />
            
            {/* Resource Markers */}
            {filteredResources.map(resource => {
              if (!resource.latitude || !resource.longitude) return null;
              
              const isSelected = selectedResourceIds.includes(resource.id!);
              const isHovered = hoveredResource?.id === resource.id;
              
              return (
                <Marker
                  key={resource.id}
                  position={[resource.latitude, resource.longitude]}
                  icon={createCustomIcon(resource, isSelected)}
                  eventHandlers={{
                    click: () => toggleResourceSelection(resource),
                    mouseover: () => setHoveredResource(resource),
                    mouseout: () => setHoveredResource(null)
                  }}
                >
                  <Popup>
                    <div className="p-2 min-w-[200px]">
                      <h4 className="font-semibold text-sm mb-2">
                        {resource.provider_name || 'Ressource'}
                      </h4>
                      <div className="space-y-1 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">Personen:</span>
                          <span className="font-medium">{resource.person_count}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">Zeitraum:</span>
                          <span className="font-medium">
                            {dayjs(resource.start_date).format('DD.MM')} - 
                            {dayjs(resource.end_date).format('DD.MM.YY')}
                          </span>
                        </div>
                        {resource.hourly_rate && (
                          <div className="flex items-center justify-between">
                            <span className="text-gray-600">Stundensatz:</span>
                            <span className="font-medium">{resource.hourly_rate}€</span>
                          </div>
                        )}
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">Kategorie:</span>
                          <span className="font-medium">{resource.category}</span>
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleResourceSelection(resource);
                        }}
                        className={`mt-3 w-full px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                          isSelected
                            ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            : 'bg-[#ffbd59] text-black hover:bg-[#f59e0b]'
                        }`}
                      >
                        {isSelected ? 'Abwählen' : 'Auswählen'}
                      </button>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
            
            <MapControls onCenterLocation={centerOnUserLocation} />
          </MapContainer>
        </div>
      </div>

      {/* Bottom Action Bar */}
      {selectedResourceIds.length > 0 && (
        <motion.div
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          className="bg-[#2a2a2a] border-t border-gray-700 p-4"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-400">
                {selectedResourceIds.length} Ressourcen ausgewählt
              </span>
              <span className="text-sm text-white font-semibold">
                {stats.selectedPersons} Personen gesamt
              </span>
              {stats.avgHourlyRate > 0 && (
                <span className="text-sm text-gray-400">
                  Ø {stats.avgHourlyRate.toFixed(2)}€/h
                </span>
              )}
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setSelectedResourceIds([])}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Auswahl aufheben
              </button>
              <button
                onClick={() => {
                  const selected = resources.filter(r => selectedResourceIds.includes(r.id!));
                  onResourceSelect?.(selected);
                }}
                className="px-4 py-2 bg-[#ffbd59] text-black rounded-lg hover:bg-[#f59e0b] transition-colors flex items-center space-x-2"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Zur Vorauswahl hinzufügen</span>
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default ResourceGeoSearch;