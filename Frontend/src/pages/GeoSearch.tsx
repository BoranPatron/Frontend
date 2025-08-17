import React, { useState, useEffect } from 'react';
import { MapPin, Search, Filter, Map, List, Eye, EyeOff, Target, Navigation, Globe, User, Users, Trophy, Clock, AlertTriangle, CheckCircle, XCircle, Sparkles, MessageCircle, Award, TrendingUp, Star, Wrench, Tag, Euro, Package, X } from 'lucide-react';
import { 
  searchTradesInRadius, 
  getCurrentLocation, 
  geocodeAddress
} from '../api/geoService';
import type {
  ProjectSearchResult,
  TradeSearchResult,
  Address
} from '../api/geoService';
import TradeMap from '../components/TradeMap';
import TradeDetailsModal from '../components/TradeDetailsModal';
import MilestoneCompletionModal from '../components/MilestoneCompletionModal';

interface ProjectWithTrades extends ProjectSearchResult {
  trades: TradeSearchResult[];
}

export default function GeoSearch() {
  const [currentLocation, setCurrentLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [radiusKm, setRadiusKm] = useState(10);
  const [searchMode, setSearchMode] = useState<'trades' | 'projects'>('trades');
  const [addressInput, setAddressInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [trades, setTrades] = useState<TradeSearchResult[]>([]);
  const [projects, setProjects] = useState<ProjectSearchResult[]>([]);
  const [showAcceptedTrades, setShowAcceptedTrades] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [selectedTrade, setSelectedTrade] = useState<TradeSearchResult | null>(null);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [completionTrade, setCompletionTrade] = useState<TradeSearchResult | null>(null);
  const [selectedMapTrade, setSelectedMapTrade] = useState<TradeSearchResult | null>(null);
  const [filters, setFilters] = useState({
    categories: [] as string[], // Mehrfachauswahl für Kategorien
    status: '',
    priority: '',
    minBudget: '',
    maxBudget: ''
  });
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);

  // Lade gespeicherte Einstellungen beim Start
  useEffect(() => {
    const savedSettings = localStorage.getItem('geoSearchSettings');
    if (savedSettings) {
      try {
        const settings = JSON.parse(savedSettings);
        setCurrentLocation(settings.location);
        setRadiusKm(settings.radiusKm || 10);
        setSearchMode(settings.searchMode || 'trades');
        setAddressInput(settings.addressInput || '');
        setShowAcceptedTrades(settings.showAcceptedTrades || false);
        setViewMode(settings.viewMode || 'list');
        setFilters(settings.filters || {
          category: '',
          status: '',
          priority: '',
          minBudget: '',
          maxBudget: ''
        });
      } catch (error) {
        console.error('Fehler beim Laden der gespeicherten Einstellungen:', error);
      }
    }
  }, []);

  // Speichere Einstellungen bei Änderungen
  useEffect(() => {
    const settings = {
      location: currentLocation,
      radiusKm,
      searchMode,
      addressInput,
      showAcceptedTrades,
      viewMode,
      filters
    };
    localStorage.setItem('geoSearchSettings', JSON.stringify(settings));
  }, [currentLocation, radiusKm, searchMode, addressInput, showAcceptedTrades, viewMode, filters]);

  const getCurrentBrowserLocation = async () => {
    setIsLoading(true);
    try {
      const location = await getCurrentLocation();
      setCurrentLocation(location);
      setAddressInput(''); // Reset address input when using browser location
    } catch (error) {
      console.error('Fehler beim Abrufen des Browser-Standorts:', error);
      alert('Fehler beim Abrufen des Standorts. Bitte überprüfen Sie die Standortberechtigungen.');
    } finally {
      setIsLoading(false);
    }
  };

  const useOwnLocation = async () => {
    setIsLoading(true);
    try {
      // Hole den eigenen Standort aus dem localStorage oder API
      const userLocation = localStorage.getItem('userLocation');
      if (userLocation) {
        const location = JSON.parse(userLocation);
        setCurrentLocation(location);
        setAddressInput(''); // Reset address input when using own location
        } else {
        // Fallback: Verwende Browser-Standort
        await getCurrentBrowserLocation();
      }
    } catch (error) {
      console.error('Fehler beim Übernehmen des eigenen Standorts:', error);
      alert('Fehler beim Übernehmen des eigenen Standorts. Verwende Browser-Standort.');
      await getCurrentBrowserLocation();
    } finally {
      setIsLoading(false);
    }
  };

  const performSearch = async () => {
    if (!currentLocation) {
      alert('Bitte wählen Sie zuerst einen Standort aus.');
      return;
    }

    setIsLoading(true);
    try {
      if (searchMode === 'trades') {
        const searchRequest = {
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
          radius_km: radiusKm,
          category: filters.category || undefined,
          status: filters.status || undefined,
          priority: filters.priority || undefined,
          min_budget: filters.minBudget ? parseFloat(filters.minBudget) : undefined,
          max_budget: filters.maxBudget ? parseFloat(filters.maxBudget) : undefined,
          limit: 100
        };

        const results = await searchTradesInRadius(searchRequest);
        setTrades(results);
        setProjects([]);
      } else {
        // Für Projekte (falls implementiert)
        setTrades([]);
        setProjects([]);
      }
    } catch (error) {
      console.error('Fehler bei der Geo-Suche:', error);
      alert('Fehler bei der Suche. Bitte versuchen Sie es erneut.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualAddressGeocode = async () => {
    if (!addressInput.trim()) {
      alert('Bitte geben Sie eine Adresse ein.');
      return;
    }

    setIsLoading(true);
    try {
      const address: Address = {
        street: addressInput,
        zip_code: '',
        city: '',
        country: 'Deutschland'
      };

      const geocoded = await geocodeAddress(address);
      setCurrentLocation({
        latitude: geocoded.latitude,
        longitude: geocoded.longitude
      });
    } catch (error) {
      console.error('Fehler beim Geocoding:', error);
      alert('Fehler beim Geocoding der Adresse. Bitte überprüfen Sie die Eingabe.');
    } finally {
      setIsLoading(false);
    }
  };

  // Keyboard-Support für Map-Popups
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selectedMapTrade) {
        setSelectedMapTrade(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedMapTrade]);

  // Click-Outside-Handler für Category-Dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.category-dropdown-container')) {
        setShowCategoryDropdown(false);
      }
    };

    if (showCategoryDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showCategoryDropdown]);

  const handleTradeClick = (trade: TradeSearchResult) => {
    setSelectedTrade(trade);
  };

  const handleCompleteTrade = (trade: TradeSearchResult) => {
    setCompletionTrade(trade);
    setShowCompletionModal(true);
  };

  const handleCompletionSubmit = async (completionData: any) => {
    try {
      const response = await fetch('/api/milestones/completion/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(completionData)
      });

      if (response.ok) {
        // Refresh trades to show updated status
        if (currentLocation) {
          await performSearch();
        }
      } else {
        console.error('❌ Fehler beim Einreichen des Abschluss-Antrags');
      }
    } catch (error) {
      console.error('❌ Netzwerk-Fehler:', error);
    }
  };

  const closeTradeDetails = () => {
    setSelectedTrade(null);
  };

  const getFilteredTrades = () => {
    let filtered = trades;

    if (!showAcceptedTrades) {
      filtered = filtered.filter(trade => 
        trade.status !== 'awarded' && trade.status !== 'completed'
      );
    }

    if (filters.categories.length > 0) {
      filtered = filtered.filter(trade => 
        filters.categories.some(category => 
          trade.category?.toLowerCase().includes(category.toLowerCase())
        )
      );
    }

    if (filters.status) {
      filtered = filtered.filter(trade => trade.status === filters.status);
    }

    if (filters.priority) {
      filtered = filtered.filter(trade => trade.priority === filters.priority);
    }

    if (filters.minBudget) {
      filtered = filtered.filter(trade => 
        trade.budget && trade.budget >= parseFloat(filters.minBudget)
      );
    }

    if (filters.maxBudget) {
      filtered = filtered.filter(trade => 
        trade.budget && trade.budget <= parseFloat(filters.maxBudget)
      );
    }

    return filtered;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'planning': return 'Planung';
      case 'cost_estimate': return 'Kostenvoranschlag';
      case 'tender': return 'Ausschreibung';
      case 'bidding': return 'Angebote';
      case 'evaluation': return 'Bewertung';
      case 'awarded': return 'Vergeben';
      case 'in_progress': return 'In Bearbeitung';
      case 'completed': return 'Abgeschlossen';
      case 'delayed': return 'Verzögert';
      case 'cancelled': return 'Storniert';
      default: return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planning': return 'bg-blue-100 text-blue-800';
      case 'cost_estimate': return 'bg-yellow-100 text-yellow-800';
      case 'tender': return 'bg-purple-100 text-purple-800';
      case 'bidding': return 'bg-orange-100 text-orange-800';
      case 'evaluation': return 'bg-pink-100 text-pink-800';
      case 'awarded': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-cyan-100 text-cyan-800';
      case 'completed': return 'bg-emerald-100 text-emerald-800';
      case 'delayed': return 'bg-red-100 text-red-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      case 'planned': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category?.toLowerCase()) {
      case 'electrical':
      case 'elektro':
        return 'Elektro';
      case 'plumbing':
      case 'sanitaer':
        return 'Sanitär';
      case 'heating':
      case 'heizung':
        return 'Heizung';
      case 'roofing':
      case 'dach':
        return 'Dach';
      case 'windows':
      case 'fenster':
        return 'Fenster/Türen';
      case 'flooring':
      case 'boden':
        return 'Boden';
      case 'walls':
      case 'waende':
        return 'Wände';
      case 'foundation':
      case 'fundament':
        return 'Fundament';
      case 'landscaping':
      case 'garten':
        return 'Garten/Landschaft';
      default:
        return category || 'Sonstiges';
    }
  };

  // Badge-System Funktionen nach Best Practice
  // Badge-Funktionen wurden direkt ins JSX implementiert

  // Badge-Funktionen wurden direkt ins JSX implementiert

  const filteredTrades = getFilteredTrades();

  return (
    <div className="min-h-[120vh] bg-[#2c3539] text-white">
      <style>{`
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-[#ffbd59] mb-2">Geo-basierte Umkreissuche</h1>
          <p className="text-gray-300">Finden Sie Gewerke und Projekte in Ihrer Nähe</p>
        </div>

        {/* Suchbereich */}
        <div className="bg-white/5 backdrop-blur-sm rounded-lg p-6 mb-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
            {/* Standort-Eingabe */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-300">Standort</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Adresse eingeben..."
                  value={addressInput}
                  onChange={(e) => setAddressInput(e.target.value)}
                  className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#ffbd59]"
                />
                <button
                  onClick={handleManualAddressGeocode}
                  disabled={isLoading || !addressInput.trim()}
                  className="px-4 py-2 bg-[#ffbd59] text-[#2c3539] rounded-lg font-medium hover:bg-[#ffa726] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Search size={16} />
                </button>
              </div>
            </div>

            {/* Browser-Standort */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-300">Standort-Optionen</label>
              <div className="flex gap-2">
                <button
                  onClick={getCurrentBrowserLocation}
                  disabled={isLoading}
                  className="flex-1 px-4 py-2 bg-[#3b82f6] text-white rounded-lg font-medium hover:bg-[#2563eb] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Target size={16} />
                  {isLoading ? 'Lade...' : 'Browser'}
                </button>
                <button
                  onClick={useOwnLocation}
                  disabled={isLoading}
                  className="px-4 py-2 bg-[#10b981] text-white rounded-lg font-medium hover:bg-[#059669] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  title="Eigenen Standort übernehmen"
                >
                  <User size={16} />
                </button>
              </div>
            </div>
          </div>

          {/* Suchparameter */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Radius</label>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="1"
                  max="50"
                  value={radiusKm}
                  onChange={(e) => setRadiusKm(parseInt(e.target.value))}
                  className="flex-1"
                />
                <span className="text-sm font-medium min-w-[3rem]">{radiusKm} km</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Suchmodus</label>
              <select
                value={searchMode}
                onChange={(e) => setSearchMode(e.target.value as 'trades' | 'projects')}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#ffbd59]"
              >
                <option value="trades">Gewerke</option>
                <option value="projects">Projekte</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Ansicht</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setViewMode('list')}
                  className={`flex-1 px-3 py-2 rounded-lg font-medium transition-colors ${
                    viewMode === 'list' 
                      ? 'bg-[#ffbd59] text-[#2c3539]' 
                      : 'bg-white/10 text-white hover:bg-white/20'
                  }`}
                >
                  <List size={16} />
                </button>
                <button
                  onClick={() => setViewMode('map')}
                  className={`flex-1 px-3 py-2 rounded-lg font-medium transition-colors ${
                    viewMode === 'map' 
                      ? 'bg-[#ffbd59] text-[#2c3539]' 
                      : 'bg-white/10 text-white hover:bg-white/20'
                  }`}
                >
                  <Map size={16} />
                </button>
              </div>
            </div>
          </div>

          {/* Filter */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
            <div className="relative category-dropdown-container">
              <label className="block text-sm font-medium text-gray-300 mb-2">Kategorien</label>
              <button
                onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#ffbd59] flex items-center justify-between"
              >
                <span className="text-left">
                  {filters.categories.length === 0 
                    ? 'Alle Kategorien' 
                    : filters.categories.length === 1 
                    ? getCategoryLabel(filters.categories[0])
                    : `${filters.categories.length} Kategorien`
                  }
                </span>
                <Filter size={16} className="text-gray-400" />
              </button>
              
              {showCategoryDropdown && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-gray-800 border border-gray-600 rounded-lg shadow-xl z-30 max-h-60 overflow-y-auto">
                  {[
                    { value: 'site_preparation', label: 'Baustellenvorbereitung' },
                    { value: 'foundation', label: 'Fundament' },
                    { value: 'structural', label: 'Rohbau' },
                    { value: 'roofing', label: 'Dach' },
                    { value: 'electrical', label: 'Elektro' },
                    { value: 'plumbing', label: 'Sanitär' },
                    { value: 'heating', label: 'Heizung' },
                    { value: 'flooring', label: 'Boden' },
                    { value: 'windows', label: 'Fenster/Türen' },
                    { value: 'insulation', label: 'Dämmung' },
                    { value: 'interior', label: 'Innenausbau' },
                    { value: 'landscaping', label: 'Garten/Landschaft' }
                  ].map((category) => (
                    <label
                      key={category.value}
                      className="flex items-center gap-3 px-3 py-2 hover:bg-gray-700 cursor-pointer text-white"
                    >
                      <input
                        type="checkbox"
                        checked={filters.categories.includes(category.value)}
                        onChange={(e) => {
                          const newCategories = e.target.checked
                            ? [...filters.categories, category.value]
                            : filters.categories.filter(c => c !== category.value);
                          setFilters({...filters, categories: newCategories});
                        }}
                        className="w-4 h-4 text-[#ffbd59] bg-gray-700 border-gray-600 rounded focus:ring-[#ffbd59] focus:ring-2"
                      />
                      <span className="text-sm">{category.label}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Status</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({...filters, status: e.target.value})}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#ffbd59]"
              >
                <option value="">Alle Status</option>
                <option value="planning">Planung</option>
                <option value="cost_estimate">Kostenvoranschlag</option>
                <option value="tender">Ausschreibung</option>
                <option value="bidding">Angebote</option>
                <option value="evaluation">Bewertung</option>
                <option value="awarded">Vergeben</option>
                <option value="in_progress">In Bearbeitung</option>
                <option value="completed">Abgeschlossen</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Priorität</label>
              <select
                value={filters.priority}
                onChange={(e) => setFilters({...filters, priority: e.target.value})}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#ffbd59]"
              >
                <option value="">Alle Prioritäten</option>
                <option value="low">Niedrig</option>
                <option value="medium">Mittel</option>
                <option value="high">Hoch</option>
                <option value="critical">Kritisch</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Min. Budget</label>
              <input
                type="number"
                placeholder="€"
                value={filters.minBudget}
                onChange={(e) => setFilters({...filters, minBudget: e.target.value})}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#ffbd59]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Max. Budget</label>
              <input
                type="number"
                placeholder="€"
                value={filters.maxBudget}
                onChange={(e) => setFilters({...filters, maxBudget: e.target.value})}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#ffbd59]"
              />
            </div>
          </div>

          {/* Aktions-Buttons */}
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={performSearch}
                disabled={isLoading || !currentLocation}
                className="px-6 py-3 bg-[#ffbd59] text-[#2c3539] rounded-lg font-medium hover:bg-[#ffa726] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Search size={16} />
                {isLoading ? 'Suche läuft...' : 'Suche starten'}
              </button>

              <button
                onClick={() => setShowAcceptedTrades(!showAcceptedTrades)}
                className={`px-4 py-3 rounded-lg font-medium flex items-center gap-2 transition-colors ${
                  showAcceptedTrades 
                    ? 'bg-[#10b981] text-white hover:bg-[#059669]' 
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                {showAcceptedTrades ? <Eye size={16} /> : <EyeOff size={16} />}
                {showAcceptedTrades ? 'Alle anzeigen' : 'Nur neue'}
              </button>
            </div>

            {currentLocation && (
              <div className="text-sm text-gray-300">
                <MapPin size={14} className="inline mr-1" />
                {currentLocation.latitude.toFixed(4)}, {currentLocation.longitude.toFixed(4)}
              </div>
            )}
          </div>
        </div>

        {/* Ergebnisse */}
        {filteredTrades.length > 0 && (
          <div className="bg-white/5 backdrop-blur-sm rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-[#ffbd59]">
                {filteredTrades.length} Gewerke gefunden
              </h2>
              <div className="text-sm text-gray-300">
                Radius: {radiusKm} km
              </div>
            </div>

            {viewMode === 'map' ? (
              <div className="h-[50vh] min-h-[400px] rounded-lg overflow-hidden relative">
                <TradeMap
                  trades={filteredTrades}
                  currentLocation={currentLocation}
                  radiusKm={radiusKm}
                  onTradeClick={(trade) => setSelectedMapTrade(trade)}
                  showAcceptedTrades={showAcceptedTrades}
                />

                {/* Modernes Trade-Popup auf der Karte */}
                {selectedMapTrade && (
                  <div className="absolute inset-x-4 bottom-4 z-20">
                    <div className="bg-white/95 backdrop-blur-lg rounded-2xl p-6 shadow-2xl border border-white/20 max-w-2xl mx-auto">
                      {/* Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-[#ffbd59]/20 rounded-lg">
                            <Wrench size={24} className="text-[#ffbd59]" />
                          </div>
                          <div>
                            <h3 className="text-xl font-bold text-gray-900">{selectedMapTrade.title}</h3>
                            <p className="text-gray-600">{selectedMapTrade.project_name}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => setSelectedMapTrade(null)}
                          className="text-gray-400 hover:text-gray-600 p-1"
                        >
                          <X size={20} />
                        </button>
                      </div>

                      {/* Badges */}
                      <div className="flex items-center gap-2 flex-wrap mb-4">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-600 text-white">
                          <Tag size={12} className="mr-1" />
                          {getCategoryLabel(selectedMapTrade.category)}
                        </span>
                        
                        {selectedMapTrade.requires_inspection && (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-orange-600 text-white">
                            <Eye size={12} className="mr-1" />
                            Besichtigung erforderlich
                          </span>
                        )}
                        
                        {selectedMapTrade.quote_stats && (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-600 text-white">
                            <Users size={12} className="mr-1" />
                            {selectedMapTrade.quote_stats.total_quotes || 0} Bewerber
                          </span>
                        )}
                        
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedMapTrade.status)} text-white`}>
                          {getStatusLabel(selectedMapTrade.status)}
                        </span>
                      </div>

                      {/* Informationen */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div className="text-center">
                          <div className="text-gray-500 text-sm">Startdatum</div>
                          <div className="font-semibold text-gray-900">
                            {selectedMapTrade.start_date ? new Date(selectedMapTrade.start_date).toLocaleDateString('de-DE') : 'Flexibel'}
                          </div>
                        </div>
                        
                        {selectedMapTrade.budget && (
                          <div className="text-center">
                            <div className="text-gray-500 text-sm">Budget</div>
                            <div className="font-bold text-[#ffbd59]">
                              {new Intl.NumberFormat('de-DE', { 
                                style: 'currency', 
                                currency: 'EUR',
                                maximumFractionDigits: 0
                              }).format(selectedMapTrade.budget)}
                            </div>
                          </div>
                        )}
                        
                        {selectedMapTrade.distance_km && (
                          <div className="text-center">
                            <div className="text-gray-500 text-sm">Entfernung</div>
                            <div className="font-semibold text-gray-900">
                              {selectedMapTrade.distance_km.toFixed(1)} km
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Beschreibung */}
                      {selectedMapTrade.description && (
                        <div className="mb-4">
                          <div className="text-gray-500 text-sm mb-2">Beschreibung</div>
                          <div className="text-gray-700 text-sm line-clamp-3">
                            {selectedMapTrade.description}
                          </div>
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex gap-3">
                        <button
                          onClick={() => {
                            setSelectedMapTrade(null);
                            // Navigiere zum ServiceProviderDashboard mit dem gewählten Trade
                            window.location.href = `/service-provider?quote=${selectedMapTrade.id}`;
                          }}
                          className="flex-1 bg-green-600 text-white px-4 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                        >
                          <Package size={16} />
                          Angebot abgeben
                        </button>
                        
                        <button
                          onClick={() => {
                            setSelectedMapTrade(null);
                            handleTradeClick(selectedMapTrade);
                          }}
                          className="flex-1 bg-[#ffbd59] text-[#2c3539] px-4 py-3 rounded-lg font-semibold hover:bg-[#ffa726] transition-colors flex items-center justify-center gap-2"
                        >
                          <Eye size={16} />
                          Details
                        </button>
                        
                        <button
                          onClick={() => setSelectedMapTrade(null)}
                          className="px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredTrades.map((trade) => (
                  <div
                    key={trade.id}
                    className="bg-white/10 backdrop-blur-sm rounded-lg p-4 hover:bg-white/20 transition-all duration-300 cursor-pointer border border-white/10"
                    onClick={() => handleTradeClick(trade)}
                  >
                    {/* Zeilen-Layout: Horizontal angeordnet */}
                    <div className="flex items-center gap-4">
                      {/* Icon */}
                      <div className="p-3 bg-[#ffbd59]/20 rounded-lg flex-shrink-0">
                        <Wrench size={24} className="text-[#ffbd59]" />
                      </div>

                        {/* Titel und Projekt */}
                        <div className="flex-1">
                          <h3 className="font-bold text-white text-lg leading-tight mb-1">{trade.title}</h3>
                          <p className="text-gray-300 text-sm mb-3">{trade.project_name}</p>
                          
                          {/* Kompakte Badge-Reihe */}
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-600 text-white">
                              <Tag size={10} className="mr-1" />
                              {getCategoryLabel(trade.category)}
                            </span>
                            
                            {trade.requires_inspection && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-600 text-white">
                                <Eye size={10} className="mr-1" />
                                Besichtigung
                              </span>
                            )}
                            
                            {trade.quote_stats && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-600 text-white">
                                <Users size={10} className="mr-1" />
                                {trade.quote_stats.total_quotes || 0} Bewerber
                              </span>
                            )}
                            
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(trade.status)}`}>
                              {getStatusLabel(trade.status)}
                            </span>
                          </div>
                          
                          {/* Beschreibung (gekürzt) */}
                          {trade.description && (
                            <div className="text-gray-300 text-sm mt-2 line-clamp-2">
                              {trade.description}
                            </div>
                          )}
                        </div>

                        {/* Rechte Seite: Datum, Budget und Entfernung */}
                        <div className="text-right flex-shrink-0 space-y-2">
                          <div className="text-white font-semibold text-sm">
                            <Clock size={14} className="inline mr-1" />
                            {trade.start_date ? new Date(trade.start_date).toLocaleDateString('de-DE', { 
                              day: '2-digit', 
                              month: '2-digit',
                              year: '2-digit'
                            }) : 'Termin offen'}
                          </div>
                          
                          {trade.budget && (
                            <div className="text-[#ffbd59] font-bold text-sm">
                              <Euro size={14} className="inline mr-1" />
                              {new Intl.NumberFormat('de-DE', { 
                                style: 'currency', 
                                currency: 'EUR',
                                maximumFractionDigits: 0
                              }).format(trade.budget)}
                            </div>
                          )}
                          
                          {trade.distance_km && (
                            <div className="text-gray-400 text-xs">
                              <MapPin size={12} className="inline mr-1" />
                              {trade.distance_km.toFixed(1)} km
                            </div>
                          )}
                          
                          {/* Action Button */}
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleTradeClick(trade);
                            }}
                            className="bg-[#ffbd59] text-[#2c3539] px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#ffa726] transition-colors flex items-center gap-2 mt-3"
                          >
                            <Eye size={14} />
                            Details
                          </button>
                        </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Keine Ergebnisse */}
        {!isLoading && currentLocation && filteredTrades.length === 0 && trades.length > 0 && (
          <div className="bg-white/5 backdrop-blur-sm rounded-lg p-6 text-center">
            <Search size={48} className="text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-300 mb-2">Keine Ergebnisse</h3>
            <p className="text-gray-400">Keine Gewerke entsprechen den aktuellen Filtern.</p>
          </div>
        )}

        {/* Keine Suche durchgeführt */}
        {!isLoading && !currentLocation && (
          <div className="bg-white/5 backdrop-blur-sm rounded-lg p-6 text-center">
            <Globe size={48} className="text-[#ffbd59] mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">Bereit für die Suche</h3>
            <p className="text-gray-300">Wählen Sie einen Standort und starten Sie die Suche.</p>
          </div>
        )}
      </div>

      {/* Trade Details Modal */}
      {selectedTrade && (
        <TradeDetailsModal
          isOpen={!!selectedTrade}
          onClose={closeTradeDetails}
          trade={selectedTrade}
          quotes={[]}
          project={{
            id: selectedTrade.project_id,
            name: selectedTrade.project_name || 'Unbekanntes Projekt',
            description: ''
          }}
        />
      )}

      {/* Milestone Completion Modal */}
      {completionTrade && (
        <MilestoneCompletionModal
          isOpen={showCompletionModal}
          onClose={() => {
            setShowCompletionModal(false);
            setCompletionTrade(null);
          }}
          milestone={completionTrade}
          onSubmit={handleCompletionSubmit}
        />
      )}
    </div>
  );
} 
