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

// Korrigierte Custom Icons für verschiedene Gewerk-Kategorien
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
        /* WICHTIG: Keine transform-Eigenschaft hier */
      ">
        ${icon}
      </div>
    `,
    className: 'custom-marker',
    iconSize: [32, 32],
    iconAnchor: [16, 16], // Wichtig: Anker muss genau in der Mitte sein
    popupAnchor: [0, -16]
  });
};

const getTradeIcon = (category: string) => {
  // Debug-Logging für Kategorie-Erkennung
  console.log('🎯 getTradeIcon called with category:', category);
  
  if (!category) {
    console.log('⚠️ Keine Kategorie angegeben, verwende Standard-Icon');
    return createCustomIcon('#6366f1', '🔧');
  }
  
  const categoryLower = category.toLowerCase().trim();
  console.log('🔍 Normalisierte Kategorie:', categoryLower);
  
  switch (categoryLower) {
    case 'electrical':
    case 'elektro':
    case 'elektrik':
    case 'electric':
    case 'strom':
    case 'elektroinstallation':
    case 'elektroanlage':
      console.log('⚡ Elektro-Kategorie erkannt, verwende Blitz-Icon');
      return createCustomIcon('#f59e0b', '⚡');
      
    case 'plumbing':
    case 'sanitaer':
    case 'sanitär':
    case 'wasser':
    case 'rohr':
    case 'sanitaerinstallation':
      console.log('💧 Sanitär-Kategorie erkannt, verwende Wasser-Icon');
      return createCustomIcon('#3b82f6', '💧');
      
    case 'heating':
    case 'heizung':
    case 'wärme':
    case 'waerme':
    case 'heizungsanlage':
    case 'heizungssystem':
      console.log('🔥 Heizung-Kategorie erkannt, verwende Feuer-Icon');
      return createCustomIcon('#ef4444', '🔥');
      
    case 'roofing':
    case 'dach':
    case 'dachdecker':
    case 'dachdeckung':
    case 'dachstuhl':
      console.log('🏠 Dach-Kategorie erkannt, verwende Haus-Icon');
      return createCustomIcon('#8b5cf6', '🏠');
      
    case 'windows':
    case 'fenster':
    case 'fensterbau':
    case 'fensterinstallation':
    case 'glas':
      console.log('🪟 Fenster-Kategorie erkannt, verwende Fenster-Icon');
      return createCustomIcon('#10b981', '🪟');
      
    case 'flooring':
    case 'boden':
    case 'bodenbelag':
    case 'estrich':
    case 'fliesen':
      console.log('🏗️ Boden-Kategorie erkannt, verwende Bau-Icon');
      return createCustomIcon('#f97316', '🏗️');
      
    case 'walls':
    case 'waende':
    case 'wände':
    case 'mauer':
    case 'putz':
    case 'trockenbau':
      console.log('🧱 Wände-Kategorie erkannt, verwende Stein-Icon');
      return createCustomIcon('#6b7280', '🧱');
      
    case 'foundation':
    case 'fundament':
    case 'grundbau':
    case 'keller':
    case 'unterbau':
      console.log('🏛️ Fundament-Kategorie erkannt, verwende Säulen-Icon');
      return createCustomIcon('#374151', '🏛️');
      
    case 'landscaping':
    case 'garten':
    case 'landschaftsbau':
    case 'gartenbau':
    case 'pflaster':
      console.log('🌳 Garten-Kategorie erkannt, verwende Baum-Icon');
      return createCustomIcon('#059669', '🌳');
      
    default:
      console.log('🔧 Unbekannte Kategorie, verwende Standard-Icon:', categoryLower);
      return createCustomIcon('#6366f1', '🔧');
  }
};

// MapController mit Event-Handlers für Benutzerbewegungen
function MapController({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  
  useEffect(() => {
    // Event-Handler für Benutzerbewegungen
    const handleMapMove = () => {
      console.log('🗺️ Map moved:', map.getCenter(), 'Zoom:', map.getZoom());
    };
    
    const handleMapZoom = () => {
      console.log('🔍 Map zoomed:', map.getZoom());
    };
    
    const handleMapClick = (e: any) => {
      console.log('🖱️ Map clicked at:', e.latlng);
    };
    
    // Event-Listener hinzufügen
    map.on('move', handleMapMove);
    map.on('zoom', handleMapZoom);
    map.on('click', handleMapClick);
    
    // Cleanup
    return () => {
      map.off('move', handleMapMove);
      map.off('zoom', handleMapZoom);
      map.off('click', handleMapClick);
    };
  }, [map]);
  
  // Aktualisiere Kartenposition bei Props-Änderungen
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  
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
  const [mapCenter, setMapCenter] = useState<[number, number]>([0, 0]);
  const [mapZoom, setMapZoom] = useState(10);
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

  // Force Re-render wenn Marker nicht sichtbar sind
  useEffect(() => {
    if (filteredTrades.length > 0 && clusteredTrades.length === 0) {
      console.log('🔄 Force Re-render wegen fehlender Marker');
      // Trigger resize event für Leaflet
      setTimeout(() => {
        window.dispatchEvent(new Event('resize'));
      }, 100);
    }
  }, [filteredTrades, clusteredTrades]);

  // Aktualisiere Kartencenter bei Standort-Änderungen
  useEffect(() => {
    if (currentLocation) {
      const newCenter: [number, number] = [currentLocation.latitude, currentLocation.longitude];
      setMapCenter(newCenter);
      
      // Aktualisiere Kartenposition
      if (mapRef.current) {
        mapRef.current.setView(newCenter, mapZoom);
      }
    }
  }, [currentLocation, mapZoom]);

  // Event-Handler für Kartenbewegungen
  const handleMapMove = () => {
    if (mapRef.current) {
      const center = mapRef.current.getCenter();
      setMapCenter([center.lat, center.lng]);
      console.log('🗺️ Map center updated:', center);
    }
  };

  const handleMapZoom = () => {
    if (mapRef.current) {
      const zoom = mapRef.current.getZoom();
      setMapZoom(zoom);
      console.log('🔍 Map zoom updated:', zoom);
    }
  };

  // Erstelle korrigierte Cluster-Icon mit Gewerk-Icons statt gelbem Kreis
  const createClusterIcon = (trades: any[]) => {
    // Erstelle ein Grid von Icons basierend auf den Kategorien
    const categories = trades.map(trade => trade.category).filter(Boolean);
    const uniqueCategories = [...new Set(categories)];
    
    // Begrenze auf maximal 4 Icons für bessere Übersichtlichkeit
    const displayCategories = uniqueCategories.slice(0, 4);
    
    // Berechne die Größe basierend auf der Anzahl der Icons
    const iconSize = 16;
    const padding = 8;
    const iconsPerRow = Math.min(displayCategories.length, 2);
    const rows = Math.ceil(displayCategories.length / iconsPerRow);
    
    const width = iconsPerRow * iconSize + (iconsPerRow - 1) * 2 + padding * 2;
    const height = rows * iconSize + (rows - 1) * 2 + padding * 2;
    
    // Erstelle HTML für die Icons - OHNE transform
    const iconsHTML = displayCategories.map((category, index) => {
      const icon = getTradeIcon(category);
      const row = Math.floor(index / iconsPerRow);
      const col = index % iconsPerRow;
      
      // Extrahiere das korrekte HTML aus dem Icon
      let iconHTML = '';
      if (icon.options && icon.options.html) {
        // Konvertiere HTMLElement zu String falls nötig
        if (typeof icon.options.html === 'string') {
          iconHTML = icon.options.html;
        } else if (icon.options.html instanceof HTMLElement) {
          iconHTML = icon.options.html.outerHTML;
        } else {
          iconHTML = String(icon.options.html);
        }
      } else if (typeof icon === 'string') {
        iconHTML = icon;
      } else {
        // Fallback: Verwende das Blitz-Icon für Elektro
        iconHTML = '<div style="background: #f59e0b; border-radius: 50%; width: 16px; height: 16px; display: flex; align-items: center; justify-content: center; color: white; font-size: 10px;">⚡</div>';
      }
      
      console.log(`🎯 Cluster Icon für Kategorie "${category}":`, iconHTML);
      
      return `<div style="
        position: absolute;
        left: ${padding + col * (iconSize + 2)}px;
        top: ${padding + row * (iconSize + 2)}px;
        width: ${iconSize}px;
        height: ${iconSize}px;
        display: flex;
        align-items: center;
        justify-content: center;
      ">${iconHTML}</div>`;
    }).join('');
    
    // Erstelle Tooltip-Inhalt für Hover
    const tooltipContent = trades.map(trade => 
      `• ${trade.title} (${trade.category || 'Unbekannt'})`
    ).join('<br>');
    
    return L.divIcon({
      html: `
        <div style="
          background: rgba(255, 255, 255, 0.95);
          border: 2px solid #ffbd59;
          border-radius: 8px;
          width: ${width}px;
          height: ${height}px;
          position: relative;
          box-shadow: 0 4px 8px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          /* WICHTIG: Keine transform-Eigenschaft hier */
        " 
        title="${trades.length} Gewerke an dieser Adresse"
        data-tooltip="${tooltipContent}"
        data-trades-count="${trades.length}"
        class="cluster-marker-container"
        >
          ${iconsHTML}
          ${trades.length > 4 ? `<div style="
            position: absolute;
            top: -8px;
            right: -8px;
            background: #ff4444;
            color: white;
            border-radius: 50%;
            width: 20px;
            height: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            font-weight: bold;
            border: 2px solid white;
            z-index: 10;
          ">${trades.length}</div>` : ''}
        </div>
      `,
      className: 'cluster-marker',
      iconSize: [width, height],
      iconAnchor: [width / 2, height / 2], // Wichtig: Anker muss genau in der Mitte sein
      popupAnchor: [0, -height / 2]
    });
  };

  // Erstelle Tooltip-Element für Cluster-Marker
  const createTooltip = () => {
    const tooltip = document.createElement('div');
    tooltip.id = 'cluster-tooltip';
    tooltip.style.cssText = `
      position: absolute;
      background: rgba(0, 0, 0, 0.9);
      color: white;
      padding: 8px 12px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 500;
      white-space: normal;
      z-index: 10000;
      opacity: 0;
      visibility: hidden;
      transition: opacity 0.2s ease, visibility 0.2s ease;
      pointer-events: none;
      max-width: 300px;
      text-align: left;
      line-height: 1.4;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      transform: translateX(-50%);
    `;
    document.body.appendChild(tooltip);
    return tooltip;
  };

  // Aktiviere Hover-Funktionalität für Cluster-Marker
  const activateClusterHover = () => {
    let tooltip = document.getElementById('cluster-tooltip');
    if (!tooltip) {
      tooltip = createTooltip();
    }

    const clusterMarkers = document.querySelectorAll('.cluster-marker-container');
    
    clusterMarkers.forEach(marker => {
      // Entferne bestehende Event-Listener
      const existingEnterHandler = (marker as any)._mouseEnterHandler;
      const existingLeaveHandler = (marker as any)._mouseLeaveHandler;
      
      if (existingEnterHandler) {
        marker.removeEventListener('mouseenter', existingEnterHandler);
      }
      if (existingLeaveHandler) {
        marker.removeEventListener('mouseleave', existingLeaveHandler);
      }
      
      // Mouse Enter Handler
      const mouseEnterHandler = (e: Event) => {
        const tooltipContent = marker.getAttribute('data-tooltip');
        const tradesCount = marker.getAttribute('data-trades-count');
        
        if (tooltipContent) {
          tooltip.innerHTML = `
            <div style="font-weight: bold; margin-bottom: 4px;">
              ${tradesCount} Gewerke an dieser Adresse:
            </div>
            <div style="font-size: 11px;">
              ${tooltipContent}
            </div>
          `;
          
          // Positioniere Tooltip
          const rect = marker.getBoundingClientRect();
          tooltip.style.left = rect.left + rect.width / 2 + 'px';
          tooltip.style.top = rect.top - 10 + 'px';
          
          // Zeige Tooltip
          tooltip.style.opacity = '1';
          tooltip.style.visibility = 'visible';
        }
      };
      
      // Mouse Leave Handler
      const mouseLeaveHandler = () => {
        tooltip.style.opacity = '0';
        tooltip.style.visibility = 'hidden';
      };
      
      // Speichere Handler für späteres Entfernen
      (marker as any)._mouseEnterHandler = mouseEnterHandler;
      (marker as any)._mouseLeaveHandler = mouseLeaveHandler;
      
      // Füge Event-Listener hinzu
      marker.addEventListener('mouseenter', mouseEnterHandler);
      marker.addEventListener('mouseleave', mouseLeaveHandler);
    });
  };

  // Aktiviere Hover nach dem Rendering
  useEffect(() => {
    const timer = setTimeout(() => {
      activateClusterHover();
    }, 1000); // Warte 1 Sekunde nach dem Rendering
    
    return () => {
      clearTimeout(timer);
      // Entferne Tooltip beim Cleanup
      const tooltip = document.getElementById('cluster-tooltip');
      if (tooltip) {
        tooltip.remove();
      }
    };
  }, [trades]); // Aktiviere neu wenn sich trades ändern

  // Funktion zum Auflösen von Clustern beim Zoomen
  const handleClusterZoom = (cluster: any[], position: [number, number]) => {
    if (mapRef.current) {
      // Zoom zur Cluster-Position
      mapRef.current.setView(position, Math.max(mapRef.current.getZoom() + 2, 16));
      
      // Optional: Zeige eine Benachrichtigung über die Anzahl der Gewerke
      console.log(`🔍 Cluster aufgelöst: ${cluster.length} Gewerke an dieser Position`);
    }
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
        center={mapCenter}
        zoom={mapZoom}
        style={{ height: '100%', width: '100%' }}
        ref={mapRef}
        className="rounded-lg"
      >
        <MapController center={mapCenter} zoom={mapZoom} />
        
        {/* OpenStreetMap Tiles */}
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        
        {/* Suchradius-Kreis */}
        <Circle
          center={mapCenter}
          radius={radiusKm * 1000} // Konvertiere km zu Metern
          pathOptions={{
            color: '#ffbd59',
            fillColor: '#ffbd59',
            fillOpacity: 0.1,
            weight: 2
          }}
        />
        
        {/* Aktueller Standort Marker - korrigiert */}
        <Marker
          position={mapCenter}
          icon={L.divIcon({
            html: `
              <div style="
                background: #ffbd59;
                border: 3px solid white;
                border-radius: 50%;
                width: 20px;
                height: 20px;
                box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                transform: translate(-50%, -50%);
              "></div>
            `,
            className: 'current-location-marker',
            iconSize: [20, 20],
            iconAnchor: [10, 10], // Wichtig: Anker muss genau in der Mitte sein
            popupAnchor: [0, -10]
          })}
        >
          <Popup>
            <div className="text-center">
              <strong>Ihr Standort</strong><br />
              <small className="text-gray-600">
                {currentLocation?.latitude.toFixed(4)}, {currentLocation?.longitude.toFixed(4)}
              </small>
            </div>
          </Popup>
        </Marker>
        
        {/* Gewerke Markers mit Clustering - korrigiert */}
        {clusteredTrades.length === 0 ? (
          // Fallback: Zeige alle Gewerke ohne Clustering wenn keine Cluster vorhanden
          filteredTrades.map((trade, index) => {
            console.log(`🔍 Rendering Trade ${index}:`, trade);
            
            // Verwende currentLocation als Fallback wenn keine Koordinaten vorhanden
            const position: [number, number] = [
              trade.address_latitude || trade.latitude || currentLocation?.latitude || 0,
              trade.address_longitude || trade.longitude || currentLocation?.longitude || 0
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
          // Normale Clustering-Logik - korrigiert
          clusteredTrades.map((cluster, clusterIndex) => {
            if (cluster.length === 1) {
              // Einzelnes Gewerk - zeige normalen Marker
              const trade = cluster[0];
              const position: [number, number] = [
                trade.address_latitude || trade.latitude || currentLocation?.latitude || 0,
                trade.address_longitude || trade.longitude || currentLocation?.longitude || 0
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
            // Cluster mit mehreren Gewerken - korrigiert mit Gewerk-Icons
            const firstTrade = cluster[0];
            const position: [number, number] = [
              firstTrade.address_latitude || firstTrade.latitude || currentLocation?.latitude || 0,
              firstTrade.address_longitude || firstTrade.longitude || currentLocation?.longitude || 0
            ];
            
            return (
              <Marker
                key={`cluster-${clusterIndex}`}
                position={position}
                icon={createClusterIcon(cluster)}
                eventHandlers={{
                  click: () => {
                    // Verwende die neue Cluster-Zoom-Funktion
                    handleClusterZoom(cluster, position);
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