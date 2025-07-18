import React, { useEffect, useRef, useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Building, Zap, Droplets, Thermometer, Hammer, TreePine, Target, Eye, CheckCircle, Clock, AlertTriangle } from 'lucide-react';

// Leaflet-Icon-Fix für React
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface TradeMapProps {
  trades: any[];
  currentLocation: { latitude: number; longitude: number } | null;
  radiusKm: number;
  onTradeClick: (trade: any) => void;
  showAcceptedTrades: boolean;
}

// Custom Icons für verschiedene Gewerk-Kategorien
const createCustomIcon = (color: string, icon: any) => {
  return L.divIcon({
    html: `
      <div style="
        background: ${color};
        border: 2px solid white;
        border-radius: 50%;
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        color: white;
        font-size: 16px;
      ">
        ${icon}
      </div>
    `,
    className: 'custom-marker',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32]
  });
};

const getTradeIcon = (category: string) => {
  switch (category?.toLowerCase()) {
    case 'electrical':
    case 'elektro':
      return createCustomIcon('#f59e0b', '⚡');
    case 'plumbing':
    case 'sanitaer':
      return createCustomIcon('#3b82f6', '💧');
    case 'heating':
    case 'heizung':
      return createCustomIcon('#ef4444', '🔥');
    case 'roofing':
    case 'dach':
      return createCustomIcon('#8b5cf6', '🏠');
    case 'windows':
    case 'fenster':
      return createCustomIcon('#10b981', '🪟');
    case 'flooring':
    case 'boden':
      return createCustomIcon('#f97316', '🏗️');
    case 'walls':
    case 'waende':
      return createCustomIcon('#6b7280', '🧱');
    case 'foundation':
    case 'fundament':
      return createCustomIcon('#374151', '🏛️');
    case 'landscaping':
    case 'garten':
      return createCustomIcon('#059669', '🌳');
    default:
      return createCustomIcon('#6366f1', '🔧');
  }
};

// Map Controller für automatische Zentrierung
function MapController({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  
  useEffect(() => {
    map.setView(center, zoom);
  }, [map, center, zoom]);
  
  return null;
}

export default function TradeMap({ 
  trades, 
  currentLocation, 
  radiusKm, 
  onTradeClick,
  showAcceptedTrades 
}: TradeMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const [filteredTrades, setFilteredTrades] = useState<any[]>([]);

  // Filtere Gewerke basierend auf showAcceptedTrades
  useEffect(() => {
    if (showAcceptedTrades) {
      setFilteredTrades(trades);
    } else {
      // Zeige nur Gewerke, die noch nicht angenommen wurden
      setFilteredTrades(trades.filter(trade => trade.status !== 'awarded' && trade.status !== 'completed'));
    }
  }, [trades, showAcceptedTrades]);

  // Clustering-Logik für Gewerke an gleicher Position
  const clusteredTrades = useMemo(() => {
    console.log('🔍 Debug Clustering:', {
      totalTrades: trades.length,
      filteredTrades: filteredTrades.length,
      currentLocation
    });

    // Wenn keine Gewerke vorhanden, zeige leeres Array
    if (filteredTrades.length === 0) {
      console.log('⚠️ Keine Gewerke zum Anzeigen');
      return [];
    }

    const clusters: { [key: string]: any[] } = {};
    const CLUSTER_RADIUS = 0.01; // Erhöht auf ~1km für bessere Sichtbarkeit
    
    filteredTrades.forEach((trade, index) => {
      // Debug-Logging für erste paar Gewerke
      if (index < 3) {
        console.log(`🔍 Trade ${index}:`, {
          id: trade.id,
          title: trade.title,
          address_latitude: trade.address_latitude,
          address_longitude: trade.address_longitude,
          latitude: trade.latitude,
          longitude: trade.longitude,
          currentLocation
        });
      }

      // Verwende die korrekten Koordinaten
      let lat = trade.address_latitude || trade.latitude;
      let lng = trade.address_longitude || trade.longitude;
      
      // Fallback auf currentLocation nur wenn keine eigenen Koordinaten vorhanden
      if (!lat || !lng) {
        if (currentLocation) {
          lat = currentLocation.latitude;
          lng = currentLocation.longitude;
          console.log(`⚠️ Trade ${trade.id} hat keine Koordinaten, verwende currentLocation`);
        } else {
          console.log(`❌ Trade ${trade.id} hat keine Koordinaten und kein currentLocation`);
          return; // Überspringe dieses Gewerk
        }
      }
      
      // Erstelle Cluster-Key basierend auf gerundeten Koordinaten
      const clusterKey = `${Math.round(lat / CLUSTER_RADIUS)},${Math.round(lng / CLUSTER_RADIUS)}`;
      
      if (!clusters[clusterKey]) {
        clusters[clusterKey] = [];
      }
      clusters[clusterKey].push(trade);
    });
    
    const result = Object.values(clusters);
    console.log('✅ Clustering abgeschlossen:', {
      clusters: result.length,
      totalTradesInClusters: result.reduce((sum, cluster) => sum + cluster.length, 0)
    });
    
    return result;
  }, [filteredTrades, currentLocation]);

  // Erstelle Cluster-Icon basierend auf Anzahl der Gewerke
  const createClusterIcon = (count: number) => {
    const size = Math.min(32 + count * 4, 48); // Größe basierend auf Anzahl
    const fontSize = Math.min(12 + count, 16);
    
    return L.divIcon({
      html: `
        <div style="
          background: linear-gradient(135deg, #ffbd59, #ffa726);
          border: 3px solid white;
          border-radius: 50%;
          width: ${size}px;
          height: ${size}px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 8px rgba(0,0,0,0.3);
          color: white;
          font-size: ${fontSize}px;
          font-weight: bold;
          cursor: pointer;
        ">
          ${count}
        </div>
      `,
      className: 'cluster-marker',
      iconSize: [size, size],
      iconAnchor: [size / 2, size],
      popupAnchor: [0, -size]
    });
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
      case 'planning': return '#6366f1';
      case 'cost_estimate': return '#f59e0b';
      case 'tender': return '#3b82f6';
      case 'bidding': return '#8b5cf6';
      case 'evaluation': return '#ec4899';
      case 'awarded': return '#10b981';
      case 'in_progress': return '#22d3ee';
      case 'completed': return '#059669';
      case 'delayed': return '#f97316';
      case 'cancelled': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'awarded':
      case 'completed':
        return <CheckCircle size={16} />;
      case 'in_progress':
        return <Clock size={16} />;
      case 'delayed':
        return <AlertTriangle size={16} />;
      default:
        return <Eye size={16} />;
    }
  };

  if (!currentLocation) {
    return (
      <div className="h-full flex items-center justify-center bg-white/5 rounded-lg">
        <div className="text-center">
          <MapPin size={48} className="text-[#ffbd59] mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">Kein Standort ausgewählt</h3>
          <p className="text-gray-300">Bitte wählen Sie einen Standort aus, um die Karte zu aktivieren.</p>
        </div>
      </div>
    );
  }

  const center: [number, number] = [currentLocation.latitude, currentLocation.longitude];

  return (
    <div className="h-full w-full relative">
      <MapContainer
        center={center}
        zoom={10}
        style={{ height: '100%', width: '100%' }}
        ref={mapRef}
        className="rounded-lg"
      >
        <MapController center={center} zoom={10} />
        
        {/* OpenStreetMap Tiles */}
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        
        {/* Suchradius-Kreis */}
        <Circle
          center={center}
          radius={radiusKm * 1000} // Konvertiere km zu Metern
          pathOptions={{
            color: '#ffbd59',
            fillColor: '#ffbd59',
            fillOpacity: 0.1,
            weight: 2
          }}
        />
        
        {/* Aktueller Standort Marker */}
        <Marker
          position={center}
          icon={L.divIcon({
            html: `
              <div style="
                background: #ffbd59;
                border: 3px solid white;
                border-radius: 50%;
                width: 20px;
                height: 20px;
                box-shadow: 0 2px 4px rgba(0,0,0,0.3);
              "></div>
            `,
            className: 'current-location-marker',
            iconSize: [20, 20],
            iconAnchor: [10, 10]
          })}
        >
          <Popup>
            <div className="text-center">
              <strong>Ihr Standort</strong><br />
              <small className="text-gray-600">
                {currentLocation.latitude.toFixed(4)}, {currentLocation.longitude.toFixed(4)}
              </small>
            </div>
          </Popup>
        </Marker>
        
        {/* Gewerke Markers mit Clustering */}
        {clusteredTrades.length === 0 ? (
          // Fallback: Zeige alle Gewerke ohne Clustering wenn keine Cluster vorhanden
          filteredTrades.map((trade, index) => {
            console.log(`🔍 Rendering Trade ${index}:`, trade);
            
            // Verwende currentLocation als Fallback wenn keine Koordinaten vorhanden
            const position: [number, number] = [
              trade.address_latitude || trade.latitude || currentLocation.latitude,
              trade.address_longitude || trade.longitude || currentLocation.longitude
            ];
            
            return (
              <Marker
                key={`fallback-${trade.id}`}
                position={position}
                icon={getTradeIcon(trade.category)}
                eventHandlers={{
                  click: () => onTradeClick(trade)
                }}
              >
                <Popup>
                  <div className="min-w-[250px]">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-bold text-lg text-gray-800">{trade.title}</h3>
                      <div className="flex items-center gap-1">
                        {getStatusIcon(trade.status)}
                        <span 
                          className="text-xs px-2 py-1 rounded-full text-white"
                          style={{ backgroundColor: getStatusColor(trade.status) }}
                        >
                          {getStatusLabel(trade.status)}
                        </span>
                      </div>
                    </div>
                    
                    {trade.description && (
                      <p className="text-gray-600 text-sm mb-2">{trade.description}</p>
                    )}
                    
                    <div className="space-y-1 text-sm">
                      {trade.category && (
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Kategorie:</span>
                          <span className="text-gray-600">{trade.category}</span>
                        </div>
                      )}
                      
                      {trade.budget && (
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Budget:</span>
                          <span className="text-gray-600">{formatCurrency(trade.budget)}</span>
                        </div>
                      )}
                      
                      {trade.distance_km && (
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Entfernung:</span>
                          <span className="text-gray-600">{trade.distance_km.toFixed(1)} km</span>
                        </div>
                      )}
                      
                      {trade.project_name && (
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Projekt:</span>
                          <span className="text-gray-600">{trade.project_name}</span>
                        </div>
                      )}
                      
                      {trade.address_street && (
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Adresse:</span>
                          <span className="text-gray-600">
                            {trade.address_street}, {trade.address_zip} {trade.address_city}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    <div className="mt-3 pt-2 border-t border-gray-200">
                      <button
                        onClick={() => onTradeClick(trade)}
                        className="w-full bg-[#ffbd59] text-[#2c3539] px-3 py-1.5 rounded text-sm font-medium hover:bg-[#ffa726] transition-colors"
                      >
                        Details anzeigen
                      </button>
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })
        ) : (
          // Normale Clustering-Logik
          clusteredTrades.map((cluster, clusterIndex) => {
            if (cluster.length === 1) {
              // Einzelnes Gewerk - zeige normalen Marker
              const trade = cluster[0];
              const position: [number, number] = [
                trade.address_latitude || trade.latitude || currentLocation.latitude,
                trade.address_longitude || trade.longitude || currentLocation.longitude
              ];
            
            return (
              <Marker
                key={`single-${trade.id}`}
                position={position}
                icon={getTradeIcon(trade.category)}
                eventHandlers={{
                  click: () => onTradeClick(trade)
                }}
              >
                <Popup>
                  <div className="min-w-[250px]">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-bold text-lg text-gray-800">{trade.title}</h3>
                      <div className="flex items-center gap-1">
                        {getStatusIcon(trade.status)}
                        <span 
                          className="text-xs px-2 py-1 rounded-full text-white"
                          style={{ backgroundColor: getStatusColor(trade.status) }}
                        >
                          {getStatusLabel(trade.status)}
                        </span>
                      </div>
                    </div>
                    
                    {trade.description && (
                      <p className="text-gray-600 text-sm mb-2">{trade.description}</p>
                    )}
                    
                    <div className="space-y-1 text-sm">
                      {trade.category && (
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Kategorie:</span>
                          <span className="text-gray-600">{trade.category}</span>
                        </div>
                      )}
                      
                      {trade.budget && (
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Budget:</span>
                          <span className="text-gray-600">{formatCurrency(trade.budget)}</span>
                        </div>
                      )}
                      
                      {trade.distance_km && (
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Entfernung:</span>
                          <span className="text-gray-600">{trade.distance_km.toFixed(1)} km</span>
                        </div>
                      )}
                      
                      {trade.project_name && (
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Projekt:</span>
                          <span className="text-gray-600">{trade.project_name}</span>
                        </div>
                      )}
                      
                      {trade.address_street && (
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Adresse:</span>
                          <span className="text-gray-600">
                            {trade.address_street}, {trade.address_zip} {trade.address_city}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    <div className="mt-3 pt-2 border-t border-gray-200">
                      <button
                        onClick={() => onTradeClick(trade)}
                        className="w-full bg-[#ffbd59] text-[#2c3539] px-3 py-1.5 rounded text-sm font-medium hover:bg-[#ffa726] transition-colors"
                      >
                        Details anzeigen
                      </button>
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          } else {
            // Cluster mit mehreren Gewerken
            const firstTrade = cluster[0];
            const position: [number, number] = [
              firstTrade.address_latitude || firstTrade.latitude || currentLocation.latitude,
              firstTrade.address_longitude || firstTrade.longitude || currentLocation.longitude
            ];
            
            return (
              <Marker
                key={`cluster-${clusterIndex}`}
                position={position}
                icon={createClusterIcon(cluster.length)}
                eventHandlers={{
                  click: () => {
                    // Zeige alle Gewerke im Cluster an
                    cluster.forEach(trade => onTradeClick(trade));
                  }
                }}
              >
                <Popup>
                  <div className="min-w-[300px]">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-bold text-lg text-gray-800">
                        {cluster.length} Gewerke an dieser Adresse
                      </h3>
                      <div className="flex items-center gap-1">
                        <span 
                          className="text-xs px-2 py-1 rounded-full text-white"
                          style={{ backgroundColor: '#ffbd59' }}
                        >
                          Cluster
                        </span>
                      </div>
                    </div>
                    
                    {/* Adresse des Clusters */}
                    {firstTrade.address_street && (
                      <div className="mb-3 p-2 bg-gray-50 rounded">
                        <div className="text-sm font-medium text-gray-700">Adresse:</div>
                        <div className="text-sm text-gray-600">
                          {firstTrade.address_street}, {firstTrade.address_zip} {firstTrade.address_city}
                        </div>
                      </div>
                    )}
                    
                    {/* Liste aller Gewerke im Cluster */}
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {cluster.map((trade, index) => (
                        <div 
                          key={trade.id} 
                          className="p-2 border border-gray-200 rounded hover:bg-gray-50 cursor-pointer"
                          onClick={() => onTradeClick(trade)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="font-medium text-gray-800">{trade.title}</div>
                              {trade.category && (
                                <div className="text-xs text-gray-600">{trade.category}</div>
                              )}
                            </div>
                            <div className="flex items-center gap-1 ml-2">
                              {getStatusIcon(trade.status)}
                              <span 
                                className="text-xs px-1 py-0.5 rounded text-white text-xs"
                                style={{ backgroundColor: getStatusColor(trade.status) }}
                              >
                                {getStatusLabel(trade.status)}
                              </span>
                            </div>
                          </div>
                          
                          {trade.budget && (
                            <div className="text-xs text-gray-600 mt-1">
                              Budget: {formatCurrency(trade.budget)}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                    
                    <div className="mt-3 pt-2 border-t border-gray-200">
                      <div className="text-xs text-gray-500 text-center">
                        Klicken Sie auf ein Gewerk für Details
                      </div>
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          }
        })
      )}
      </MapContainer>
      
      {/* Legende */}
      <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-lg">
        <h4 className="font-semibold text-gray-800 mb-2">Legende</h4>
        <div className="space-y-1 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#f59e0b]"></div>
            <span>Elektro</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#3b82f6]"></div>
            <span>Sanitär</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#ef4444]"></div>
            <span>Heizung</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#8b5cf6]"></div>
            <span>Dach</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#10b981]"></div>
            <span>Fenster/Türen</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#6366f1]"></div>
            <span>Sonstige</span>
          </div>
        </div>
      </div>
      
      {/* Statistiken */}
      <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-lg">
        <h4 className="font-semibold text-gray-800 mb-2">Statistiken</h4>
        <div className="space-y-1 text-xs">
          <div className="flex justify-between gap-4">
            <span>Gefunden:</span>
            <span className="font-medium">{filteredTrades.length}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span>Radius:</span>
            <span className="font-medium">{radiusKm} km</span>
          </div>
          {filteredTrades.length > 0 && (
            <div className="flex justify-between gap-4">
              <span>Durchschnitt:</span>
              <span className="font-medium">
                {(filteredTrades.reduce((sum, trade) => sum + (trade.distance_km || 0), 0) / filteredTrades.length).toFixed(1)} km
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 