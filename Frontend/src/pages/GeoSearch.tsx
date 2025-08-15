import React, { useState, useEffect } from 'react';
import { MapPin, Search, Filter, Map, List, Eye, EyeOff, Target, Navigation, Globe, User, Users, Trophy, Clock, AlertTriangle, CheckCircle, XCircle, Sparkles, MessageCircle, Award, TrendingUp, Star, Wrench, Tag, Euro, Package } from 'lucide-react';
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
  const [filters, setFilters] = useState({
    category: '',
    status: '',
    priority: '',
    minBudget: '',
    maxBudget: ''
  });

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

    if (filters.category) {
      filtered = filtered.filter(trade => 
        trade.category?.toLowerCase().includes(filters.category.toLowerCase())
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
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#ffbd59]"
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
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Kategorie</label>
              <select
                value={filters.category}
                onChange={(e) => setFilters({...filters, category: e.target.value})}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#ffbd59]"
              >
                <option value="">Alle Kategorien</option>
                <option value="elektro">Elektro</option>
                <option value="sanitaer">Sanitär</option>
                <option value="heizung">Heizung</option>
                <option value="dach">Dach</option>
                <option value="fenster">Fenster/Türen</option>
                <option value="boden">Boden</option>
                <option value="waende">Wände</option>
                <option value="fundament">Fundament</option>
                <option value="garten">Garten/Landschaft</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Status</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({...filters, status: e.target.value})}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#ffbd59]"
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
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#ffbd59]"
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
              <div className="h-[50vh] min-h-[400px] rounded-lg overflow-hidden">
                <TradeMap
                  trades={filteredTrades}
                  currentLocation={currentLocation}
                  radiusKm={radiusKm}
                  onTradeClick={handleTradeClick}
                  showAcceptedTrades={showAcceptedTrades}
                />
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
                {filteredTrades.map((trade) => (
                  <div
                    key={trade.id}
                    className="bg-white/10 backdrop-blur-sm rounded-lg p-4 hover:bg-white/20 transition-all duration-300 cursor-pointer border border-white/10 flex flex-col h-full"
                    onClick={() => handleTradeClick(trade)}
                  >
                    {/* Header mit Titel und Icon */}
                    <div className="flex items-start gap-3 mb-4">
                      <div className="p-2 bg-[#ffbd59]/20 rounded-lg flex-shrink-0">
                        <Wrench size={20} className="text-[#ffbd59]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-white text-base leading-tight line-clamp-2">{trade.title}</h3>
                        <p className="text-gray-400 text-sm mt-1">{trade.project_name}</p>
                      </div>
                    </div>

                    {/* Prominente Badge-Sektion */}
                    <div className="space-y-3 mb-4">
                      {/* Erste Reihe: Kategorie und Besichtigung */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-blue-600 text-white">
                          <Tag size={12} className="mr-1.5" />
                          {getCategoryLabel(trade.category)}
                        </span>
                        
                        {trade.requires_inspection && (
                          <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-orange-600 text-white">
                            <Eye size={12} className="mr-1.5" />
                            Besichtigung
                          </span>
                        )}
                      </div>

                      {/* Zweite Reihe: Bewerber und Status */}
                      <div className="flex items-center gap-2 flex-wrap">
                        {trade.quote_stats && (
                          <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-purple-600 text-white">
                            <Users size={12} className="mr-1.5" />
                            {trade.quote_stats.total_quotes || 0} Bewerber
                          </span>
                        )}
                        
                        <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium ${getStatusColor(trade.status)}`}>
                          {getStatusLabel(trade.status)}
                        </span>
                      </div>

                      {/* Dritte Reihe: Start und Budget */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-green-600 text-white">
                          <Clock size={12} className="mr-1.5" />
                          {trade.start_date ? new Date(trade.start_date).toLocaleDateString('de-DE', { 
                            day: '2-digit', 
                            month: '2-digit' 
                          }) : 'Flexibel'}
                        </span>
                        
                        {trade.budget && (
                          <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-emerald-600 text-white">
                            <Euro size={12} className="mr-1.5" />
                            {(trade.budget / 1000).toFixed(0)}k€
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Kompakte Details */}
                    <div className="space-y-2 text-sm flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400">Entfernung:</span>
                        <span className="text-white font-medium">{trade.distance_km ? trade.distance_km.toFixed(1) : 'N/A'} km</span>
                      </div>
                      
                      {trade.description && (
                        <div className="text-gray-300 text-xs line-clamp-2 mt-2">
                          {trade.description}
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="mt-4 pt-3 border-t border-white/10 space-y-2">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTradeClick(trade);
                        }}
                        className="w-full bg-[#ffbd59] text-[#2c3539] px-3 py-2 rounded-lg text-sm font-medium hover:bg-[#ffa726] transition-colors flex items-center justify-center gap-2"
                      >
                        <Eye size={14} />
                        Details anzeigen
                      </button>
                      
                      {/* Gewerk abschließen Button - nur für angenommene Gewerke */}
                      {trade.status === 'in_progress' && (
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCompleteTrade(trade);
                          }}
                          className="w-full bg-green-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                        >
                          <Package size={14} />
                          Gewerk abschließen
                        </button>
                      )}
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
