import React, { useEffect, useRef, useState } from 'react';
import type { TradeSearchResult } from '../api/geoService';

interface TradeMapProps {
  currentLocation: { latitude: number; longitude: number } | null;
  trades: TradeSearchResult[];
  radiusKm: number;
  onTradeClick: (trade: TradeSearchResult) => void;
}

export default function TradeMap({ 
  currentLocation, 
  trades, 
  radiusKm,
  onTradeClick 
}: TradeMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<any>(null);
  const [markers, setMarkers] = useState<any[]>([]);
  const [isMapLoaded, setIsMapLoaded] = useState(false);

  // Leaflet CSS laden
  useEffect(() => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    link.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
    link.crossOrigin = '';
    
    // Prüfen ob bereits geladen
    const existingLink = document.querySelector('link[href*="leaflet.css"]');
    if (!existingLink) {
      document.head.appendChild(link);
    }

    return () => {
      if (!existingLink && document.head.contains(link)) {
        document.head.removeChild(link);
      }
    };
  }, []);

  // Leaflet Script laden
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.integrity = 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=';
    script.crossOrigin = '';
    
    // Prüfen ob bereits geladen
    if (window.L) {
      setIsMapLoaded(true);
      return;
    }
    
    script.onload = () => {
      setIsMapLoaded(true);
    };
    
    const existingScript = document.querySelector('script[src*="leaflet.js"]');
    if (!existingScript) {
      document.head.appendChild(script);
    }

    return () => {
      if (!existingScript && document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, []);

  // Karte initialisieren
  useEffect(() => {
    if (!isMapLoaded || !mapRef.current || !currentLocation) return;

    // @ts-ignore - Leaflet ist global verfügbar
    const L = window.L;
    if (!L) return;

    // Karte erstellen
    const newMap = L.map(mapRef.current).setView(
      [currentLocation.latitude, currentLocation.longitude], 
      12
    );

    // OpenStreetMap Tile Layer hinzufügen
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(newMap);

    // Zentrum-Marker hinzufügen
    const centerIcon = L.divIcon({
      className: 'center-marker',
      html: '<div style="background: #3b82f6; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3);"></div>',
      iconSize: [20, 20],
      iconAnchor: [10, 10]
    });

    const centerMarker = L.marker([currentLocation.latitude, currentLocation.longitude], { icon: centerIcon })
      .addTo(newMap)
      .bindPopup('<div class="text-center"><b>📍 Ihr Standort</b><br><span class="text-sm text-gray-600">Zentrum der Suche</span></div>');

    setMap(newMap);

    return () => {
      if (newMap) {
        newMap.remove();
      }
    };
  }, [isMapLoaded, currentLocation]);

  // Suchradius-Kreis aktualisieren
  useEffect(() => {
    if (!map || !currentLocation) return;

    // @ts-ignore
    const L = window.L;
    if (!L) return;

    // Alten Radius-Kreis entfernen
    map.eachLayer((layer: any) => {
      if (layer instanceof L.Circle) {
        map.removeLayer(layer);
      }
    });

    // Neuen Radius-Kreis hinzufügen
    L.circle([currentLocation.latitude, currentLocation.longitude], {
      color: '#ffbd59',
      fillColor: '#ffbd59',
      fillOpacity: 0.1,
      weight: 2,
      radius: radiusKm * 1000 // Meter
    }).addTo(map);

  }, [map, currentLocation, radiusKm]);

    // Trade-Marker mit Clustering aktualisieren
  useEffect(() => {
    if (!map || !isMapLoaded) return;

    // @ts-ignore
    const L = window.L;
    if (!L) return;

    // Alte Marker entfernen
    markers.forEach(marker => map.removeLayer(marker));
    const newMarkers: any[] = [];

    // Cluster-Logik: Gruppiere Trades nach Koordinaten
    const clusteredTrades = clusterTradesByLocation(trades);

    clusteredTrades.forEach((cluster) => {
      if (cluster.length === 1) {
        // Einzelnes Gewerk - normaler Marker
        const trade = cluster[0];
        const categoryInfo = getCategoryIcon(trade.category);
        
        const tradeIcon = L.divIcon({
          className: 'trade-marker',
          html: `
            <div style="
              background: ${categoryInfo.color}; 
              width: 30px; 
              height: 30px; 
              border-radius: 50%; 
              border: 3px solid white; 
              box-shadow: 0 2px 6px rgba(0,0,0,0.3);
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 14px;
            ">
              ${categoryInfo.icon}
            </div>
          `,
          iconSize: [30, 30],
          iconAnchor: [15, 15]
        });

        const marker = L.marker([trade.address_latitude, trade.address_longitude], { icon: tradeIcon })
          .addTo(map)
          .bindPopup(createSingleTradePopup(trade));

        newMarkers.push(marker);
      } else {
        // Cluster-Marker für mehrere Gewerke
        const firstTrade = cluster[0];
        const clusterIcon = createClusterIcon(cluster);
        
        const marker = L.marker([firstTrade.address_latitude, firstTrade.address_longitude], { icon: clusterIcon })
          .addTo(map)
          .bindPopup(createClusterPopup(cluster));

        newMarkers.push(marker);
      }
    });

    setMarkers(newMarkers);

    // Event-Listener für Trade-Marker-Clicks
    const handleTradeMarkerClick = (event: CustomEvent) => {
      onTradeClick(event.detail);
    };

    window.addEventListener('tradeMarkerClick', handleTradeMarkerClick as EventListener);

    return () => {
      window.removeEventListener('tradeMarkerClick', handleTradeMarkerClick as EventListener);
    };
  }, [map, trades, onTradeClick]);

  // Hilfsfunktionen für Clustering
  const clusterTradesByLocation = (trades: TradeSearchResult[]) => {
    const clusters: { [key: string]: TradeSearchResult[] } = {};
    const CLUSTER_THRESHOLD = 0.001; // ~100m Radius

    trades.forEach(trade => {
      // Erstelle einen Cluster-Key basierend auf gerundeten Koordinaten
      const lat = Math.round(trade.address_latitude / CLUSTER_THRESHOLD) * CLUSTER_THRESHOLD;
      const lng = Math.round(trade.address_longitude / CLUSTER_THRESHOLD) * CLUSTER_THRESHOLD;
      const clusterKey = `${lat},${lng}`;

      if (!clusters[clusterKey]) {
        clusters[clusterKey] = [];
      }
      clusters[clusterKey].push(trade);
    });

    return Object.values(clusters);
  };

  const getCategoryIcon = (category: string) => {
    const iconMap: { [key: string]: { color: string; icon: string } } = {
      'electrical': { color: '#fbbf24', icon: '⚡' },
      'plumbing': { color: '#3b82f6', icon: '🔧' },
      'heating': { color: '#ef4444', icon: '🔥' },
      'roofing': { color: '#f97316', icon: '🏠' },
      'windows': { color: '#10b981', icon: '🪟' },
      'flooring': { color: '#8b5cf6', icon: '📐' },
      'walls': { color: '#ec4899', icon: '🧱' },
      'foundation': { color: '#6b7280', icon: '🏗️' },
      'landscaping': { color: '#22c55e', icon: '🌱' }
    };
    return iconMap[category] || { color: '#6b7280', icon: '🔨' };
  };

  const createClusterIcon = (cluster: TradeSearchResult[]) => {
    // @ts-ignore
    const L = window.L;
    
    const categories = cluster.map(trade => trade.category);
    const uniqueCategories = [...new Set(categories)];
    const count = cluster.length;
    
    // Erstelle Icon-Grid für verschiedene Kategorien
    const iconSize = 16;
    const maxIcons = Math.min(uniqueCategories.length, 4);
    const iconsPerRow = Math.min(maxIcons, 2);
    const rows = Math.ceil(maxIcons / iconsPerRow);
    
    const containerSize = Math.max(40, Math.min(60, 30 + count * 2));
    
    const iconsHTML = uniqueCategories.slice(0, maxIcons).map((category, index) => {
      const categoryInfo = getCategoryIcon(category);
      const row = Math.floor(index / iconsPerRow);
      const col = index % iconsPerRow;
      const offsetX = (containerSize - iconsPerRow * iconSize) / 2 + col * iconSize;
      const offsetY = (containerSize - rows * iconSize) / 2 + row * iconSize;
      
      return `
        <div style="
          position: absolute;
          left: ${offsetX}px;
          top: ${offsetY}px;
          width: ${iconSize}px;
          height: ${iconSize}px;
          background: ${categoryInfo.color};
          border-radius: 50%;
          border: 2px solid white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.3);
        ">
          ${categoryInfo.icon}
        </div>
      `;
    }).join('');
    
    return L.divIcon({
      className: 'cluster-marker',
      html: `
        <div style="
          position: relative;
          width: ${containerSize}px;
          height: ${containerSize}px;
          background: linear-gradient(135deg, #ffbd59, #ffa726);
          border-radius: 50%;
          border: 4px solid white;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        ">
          ${iconsHTML}
          <div style="
            position: absolute;
            bottom: -8px;
            right: -8px;
            background: #ef4444;
            color: white;
            border-radius: 50%;
            width: 20px;
            height: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 11px;
            font-weight: bold;
            border: 2px solid white;
            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
          ">
            ${count}
          </div>
        </div>
      `,
      iconSize: [containerSize, containerSize],
      iconAnchor: [containerSize / 2, containerSize / 2]
    });
  };

  const createSingleTradePopup = (trade: TradeSearchResult) => {
    const categoryInfo = getCategoryIcon(trade.category);
    
    return `
      <div class="p-3 min-w-[250px]">
        <div class="flex items-center gap-2 mb-2">
          <span style="font-size: 18px;">${categoryInfo.icon}</span>
          <h3 class="font-bold text-lg">${trade.title}</h3>
        </div>
        
        <div class="mb-2">
          <span class="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded mr-1">
            ${trade.category}
          </span>
          <span class="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
            ${trade.status}
          </span>
        </div>
        
        <p class="text-sm text-gray-600 mb-2">${trade.description || 'Keine Beschreibung'}</p>
        
        <div class="space-y-1 text-sm mb-3">
          <p><strong>Projekt:</strong> ${trade.project_name}</p>
          <p><strong>Adresse:</strong> ${trade.address_street}, ${trade.address_zip} ${trade.address_city}</p>
          <p><strong>Entfernung:</strong> ${trade.distance_km.toFixed(1)} km</p>
          ${trade.budget ? `<p><strong>Budget:</strong> ${trade.budget.toLocaleString('de-DE')} €</p>` : ''}
          ${trade.planned_date ? `<p><strong>Geplant:</strong> ${new Date(trade.planned_date).toLocaleDateString('de-DE')}</p>` : ''}
        </div>
        
        <button 
          onclick="window.dispatchEvent(new CustomEvent('tradeMarkerClick', {detail: ${JSON.stringify(trade).replace(/"/g, '&quot;')}}))"
          class="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:from-yellow-600 hover:to-yellow-700 transition-all duration-300"
        >
          🎯 Angebot abgeben
        </button>
      </div>
    `;
  };

  const createClusterPopup = (cluster: TradeSearchResult[]) => {
    const firstTrade = cluster[0];
    const categoryCounts = cluster.reduce((acc, trade) => {
      acc[trade.category] = (acc[trade.category] || 0) + 1;
      return acc;
    }, {} as { [key: string]: number });

    const categoryList = Object.entries(categoryCounts)
      .map(([category, count]) => {
        const categoryInfo = getCategoryIcon(category);
        return `
          <div class="flex items-center gap-2 text-sm">
            <span style="font-size: 14px;">${categoryInfo.icon}</span>
            <span>${category} (${count})</span>
          </div>
        `;
      }).join('');

    const tradesList = cluster.map(trade => {
      const categoryInfo = getCategoryIcon(trade.category);
      return `
        <div class="border-b border-gray-200 pb-2 mb-2 last:border-b-0 last:pb-0 last:mb-0">
          <div class="flex items-center gap-2 mb-1">
            <span style="font-size: 14px;">${categoryInfo.icon}</span>
            <h4 class="font-medium text-gray-800">${trade.title}</h4>
          </div>
          <p class="text-xs text-gray-600 mb-2">${trade.description || 'Keine Beschreibung'}</p>
          <div class="flex items-center justify-between">
            <span class="text-xs text-gray-500">${trade.project_name}</span>
            <button 
              onclick="window.dispatchEvent(new CustomEvent('tradeMarkerClick', {detail: ${JSON.stringify(trade).replace(/"/g, '&quot;')}}))"
              class="bg-yellow-500 text-white px-2 py-1 rounded text-xs hover:bg-yellow-600 transition-colors"
            >
              Angebot
            </button>
          </div>
        </div>
      `;
    }).join('');

    return `
      <div class="p-3 min-w-[300px] max-w-[400px]">
        <div class="flex items-center gap-2 mb-3">
          <div class="w-6 h-6 bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-full flex items-center justify-center text-white font-bold text-xs">
            ${cluster.length}
          </div>
          <h3 class="font-bold text-lg">Gewerke an dieser Adresse</h3>
        </div>
        
        <div class="mb-3">
          <p class="text-sm text-gray-600 mb-2">
            <strong>Adresse:</strong> ${firstTrade.address_street}, ${firstTrade.address_zip} ${firstTrade.address_city}
          </p>
          <div class="space-y-1">
            ${categoryList}
          </div>
        </div>
        
        <div class="max-h-64 overflow-y-auto">
          <h4 class="font-medium text-gray-800 mb-2">Verfügbare Gewerke:</h4>
          ${tradesList}
        </div>
      </div>
    `;
  };

  // Auto-Zoom zu allen Markern
  useEffect(() => {
    if (!map || !currentLocation || trades.length === 0) return;

    // @ts-ignore
    const L = window.L;
    if (!L) return;

         const group = new (L as any).featureGroup([
       (L as any).marker([currentLocation.latitude, currentLocation.longitude]),
       ...trades.map(trade => (L as any).marker([trade.address_latitude, trade.address_longitude]))
     ]);

    map.fitBounds(group.getBounds().pad(0.1));
  }, [map, currentLocation, trades]);

  if (!currentLocation) {
    return (
      <div className="h-full bg-gray-100 rounded-lg flex items-center justify-center">
        <div className="text-center text-gray-500">
          <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
          <p className="text-lg font-medium">Kein Standort ausgewählt</p>
          <p className="text-sm">Bitte wählen Sie einen Standort aus</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full relative">
      <div 
        ref={mapRef}
        className="w-full h-full rounded-lg"
        style={{ minHeight: '300px' }}
      />
      
      {/* Karten-Controls */}
      <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-3 z-10 max-w-[200px]">
        <div className="text-xs text-gray-600 font-medium mb-2">Legende</div>
        
        <div className="space-y-1 text-xs">
                        <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-500 rounded-full border-2 border-white"></div>
            <span>Ihr Standort</span>
                        </div>
                        <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-yellow-500 rounded-full border-2 border-white"></div>
            <span>Gewerke</span>
                        </div>
                        <div className="flex items-center gap-2">
            <div className="w-3 h-3 border-2 border-yellow-500 rounded-full opacity-50"></div>
            <span>Suchradius ({radiusKm}km)</span>
                      </div>
                    </div>
                    
        <div className="text-xs text-gray-500 mt-2 pt-2 border-t">
          <div className="font-medium text-gray-700">{trades.length} Gewerke gefunden</div>
          <div>Klicken Sie auf einen Marker für Details</div>
                      </div>
                    </div>
                    
      {/* Kategorie-Legende */}
      <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-3 z-10 max-w-[200px]">
        <div className="text-xs text-gray-600 font-medium mb-2">Kategorien</div>
        <div className="grid grid-cols-2 gap-1 text-xs">
          <div className="flex items-center gap-1">
            <span>⚡</span>
            <span>Elektro</span>
          </div>
          <div className="flex items-center gap-1">
            <span>🔧</span>
            <span>Sanitär</span>
          </div>
          <div className="flex items-center gap-1">
            <span>🔥</span>
            <span>Heizung</span>
          </div>
          <div className="flex items-center gap-1">
            <span>🏠</span>
            <span>Dach</span>
          </div>
          <div className="flex items-center gap-1">
            <span>🪟</span>
            <span>Fenster</span>
          </div>
          <div className="flex items-center gap-1">
            <span>🌱</span>
            <span>Garten</span>
          </div>
        </div>
      </div>
    </div>
  );
} 