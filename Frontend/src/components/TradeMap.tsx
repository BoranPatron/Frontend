import React, { useEffect, useRef, useState } from 'react';
import type { TradeSearchResult } from '../api/geoService';

interface TradeMapProps {
  currentLocation: { latitude: number; longitude: number } | null;
  trades: TradeSearchResult[];
  radiusKm: number;
  onTradeClick: (trade: TradeSearchResult) => void;
  isExpanded?: boolean;
  hasQuoteForTrade?: (tradeId: number) => boolean;
  getQuoteStatusForTrade?: (tradeId: number) => string | null;
  showAcceptedTrades?: boolean;
}

export default function TradeMap({ 
  currentLocation, 
  trades, 
  radiusKm,
  onTradeClick,
  isExpanded = false,
  hasQuoteForTrade,
  getQuoteStatusForTrade
}: TradeMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<any>(null);
  const [markers, setMarkers] = useState<any[]>([]);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [isLegendExpanded, setIsLegendExpanded] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [lastTouchTime, setLastTouchTime] = useState(0);
  const [isTouching, setIsTouching] = useState(false);

  // Touch-Handler für bessere mobile Interaktion
  const handleTouchToggle = () => {
    const now = Date.now();
    if (now - lastTouchTime < 300) return; // Verhindere Doppelklicks
    setLastTouchTime(now);
    setIsLegendExpanded(!isLegendExpanded);
  };

  const handleTouchStart = () => {
    setIsTouching(true);
    handleTouchToggle();
  };

  const handleTouchEnd = () => {
    setTimeout(() => setIsTouching(false), 150); // Kurze Verzögerung für visuelles Feedback
  };

  // Mobile Detection und Responsive Verhalten
  useEffect(() => {
    const checkMobile = () => {
      const width = window.innerWidth;
      const mobile = width < 768; // Tailwind md breakpoint
      const tablet = width >= 768 && width < 1024; // Tailwind lg breakpoint
      
      setIsMobile(mobile);
      setIsTablet(tablet);
      
      // In der mobilen Ansicht ist die Legende standardmäßig eingeklappt
      if (mobile) {
        setIsLegendExpanded(false);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Leaflet CSS laden
  useEffect(() => {
    // Prüfen ob bereits geladen
    const existingLink = document.querySelector('link[href*="leaflet.css"]');
    if (!existingLink) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      link.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
      link.crossOrigin = '';
      
      // CSS vollständig laden bevor fortgefahren wird
      link.onload = () => {
        console.log('✅ Leaflet CSS geladen');
      };
      
      link.onerror = () => {
        console.error('❌ Fehler beim Laden von Leaflet CSS');
      };
      
      try {
        document.head.appendChild(link);
      } catch (error) {
        console.error('Failed to append Leaflet CSS:', error);
      }
      
      return () => {
        try {
          if (document.head.contains(link)) {
            document.head.removeChild(link);
          }
        } catch (error) {
          console.warn('Failed to remove Leaflet CSS:', error);
        }
      };
    }
  }, []);

  // Leaflet Script laden
  useEffect(() => {
    // Prüfen ob bereits geladen
    if (window.L) {
      console.log('✅ Leaflet bereits verfügbar');
      setIsMapLoaded(true);
      return;
    }
    
    const existingScript = document.querySelector('script[src*="leaflet.js"]');
    if (!existingScript) {
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.integrity = 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=';
      script.crossOrigin = '';
      
      script.onload = () => {
        console.log('✅ Leaflet Script geladen');
        setIsMapLoaded(true);
      };
      
      script.onerror = () => {
        console.error('❌ Fehler beim Laden von Leaflet Script');
      };
      
      try {
        document.head.appendChild(script);
      } catch (error) {
        console.error('Failed to append Leaflet script:', error);
      }
      
      return () => {
        try {
          if (document.head.contains(script)) {
            document.head.removeChild(script);
          }
        } catch (error) {
          console.warn('Failed to remove Leaflet script:', error);
        }
      };
    } else {
      // Script existiert bereits, warten auf Verfügbarkeit
      const checkLeaflet = setInterval(() => {
        if (window.L) {
          console.log('✅ Leaflet verfügbar nach Warten');
          setIsMapLoaded(true);
          clearInterval(checkLeaflet);
        }
      }, 100);
      
      return () => clearInterval(checkLeaflet);
    }
  }, []);

  // Karte initialisieren
  useEffect(() => {
    if (!isMapLoaded || !mapRef.current || !currentLocation) {
      console.log('🔍 Karten-Init übersprungen:', { isMapLoaded, hasMapRef: !!mapRef.current, hasLocation: !!currentLocation });
      return;
    }

    // @ts-ignore - Leaflet ist global verfügbar
    const L = window.L;
    if (!L) {
      console.error('❌ Leaflet nicht verfügbar für Karten-Init');
      return;
    }

    try {
      console.log('🗺️ Initialisiere Karte...');
      
      // Karte erstellen
      const newMap = L.map(mapRef.current, {
        preferCanvas: true,
        zoomControl: true,
        attributionControl: true
      }).setView(
        [currentLocation.latitude, currentLocation.longitude], 
        9
      );

      // OpenStreetMap Tile Layer hinzufügen
      const tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
        subdomains: ['a', 'b', 'c']
      });
      
      tileLayer.addTo(newMap);
      
      // Warten bis Tiles geladen sind
      tileLayer.on('load', () => {
        console.log('✅ Karten-Tiles geladen');
      });

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

      console.log('✅ Karte erfolgreich initialisiert');
      setMap(newMap);

      return () => {
        console.log('🧹 Karte wird entfernt');
        if (newMap) {
          newMap.remove();
        }
      };
    } catch (error) {
      console.error('❌ Fehler bei Karten-Initialisierung:', error);
    }
  }, [isMapLoaded, currentLocation]);

  // Suchradius-Kreis aktualisieren
  useEffect(() => {
    if (!map || !currentLocation || !isMapLoaded || !mapRef.current) {
      console.log('🔍 Radius-Kreis übersprungen - Map noch nicht bereit');
      return;
    }

    // @ts-ignore
    const L = window.L;
    if (!L) {
      console.warn('⚠️ Leaflet nicht verfügbar für Radius-Kreis');
      return;
    }

    try {
      // Alten Radius-Kreis entfernen
      map.eachLayer((layer: any) => {
        if (layer instanceof L.Circle) {
          map.removeLayer(layer);
        }
      });

      // Neuen Radius-Kreis hinzufügen - mit Verzögerung für DOM-Bereitschaft
      setTimeout(() => {
        try {
          const circle = L.circle([currentLocation.latitude, currentLocation.longitude], {
            color: '#ffbd59',
            fillColor: '#ffbd59',
            fillOpacity: 0.1,
            weight: 2,
            radius: radiusKm * 1000 // Meter
          });
          
          if (map && mapRef.current) {
            circle.addTo(map);
            console.log('✅ Radius-Kreis hinzugefügt:', radiusKm, 'km');
          }
        } catch (error) {
          console.error('❌ Fehler beim Hinzufügen des Radius-Kreises:', error);
        }
      }, 100);
    } catch (error) {
      console.error('❌ Fehler beim Verarbeiten des Radius-Kreises:', error);
    }

  }, [map, currentLocation, radiusKm, isMapLoaded]);

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
        
        // Sicherheitsprüfung: Überspringe Trades ohne gültige Koordinaten
        if (!trade.address_latitude || !trade.address_longitude || 
            isNaN(trade.address_latitude) || isNaN(trade.address_longitude)) {
          console.warn('⚠️ Trade ohne gültige Koordinaten übersprungen:', trade.id, trade.title);
          return;
        }
        
        const categoryInfo = getCategoryIcon(trade.category);
        
        // Quote-Status prüfen
        const hasQuote = hasQuoteForTrade ? hasQuoteForTrade(trade.id) : false;
        const quoteStatus = getQuoteStatusForTrade ? getQuoteStatusForTrade(trade.id) : null;
        
        // Border-Farbe basierend auf Quote-Status
        let borderColor = 'white';
        let borderWidth = '3px';
        if (hasQuote) {
          borderWidth = '4px';
          switch (quoteStatus) {
            case 'accepted':
              borderColor = '#10b981'; // green-500
              break;
            case 'under_review':
              borderColor = '#f59e0b'; // yellow-500
              break;
            case 'rejected':
              borderColor = '#ef4444'; // red-500
              break;
            default:
              borderColor = '#3b82f6'; // blue-500
          }
        }
        
        const tradeIcon = L.divIcon({
          className: 'trade-marker',
          html: `
            <div style="
              background: ${categoryInfo.color}; 
              width: 30px; 
              height: 30px; 
              border-radius: 50%; 
              border: ${borderWidth} solid ${borderColor}; 
              box-shadow: 0 2px 6px rgba(0,0,0,0.3);
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 14px;
              position: relative;
            ">
              ${categoryInfo.icon}
              ${hasQuote ? `<div style="
                position: absolute;
                top: -2px;
                right: -2px;
                width: 8px;
                height: 8px;
                background: ${borderColor};
                border-radius: 50%;
                border: 1px solid white;
              "></div>` : ''}
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
        
        // Sicherheitsprüfung: Überspringe Cluster ohne gültige Koordinaten
        if (!firstTrade.address_latitude || !firstTrade.address_longitude || 
            isNaN(firstTrade.address_latitude) || isNaN(firstTrade.address_longitude)) {
          console.warn('⚠️ Cluster ohne gültige Koordinaten übersprungen:', cluster.length, 'Trades');
          return;
        }
        
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
      // Überspringe Trades ohne gültige Koordinaten
      if (!trade.address_latitude || !trade.address_longitude || 
          isNaN(trade.address_latitude) || isNaN(trade.address_longitude)) {
        console.warn('⚠️ Trade beim Clustering übersprungen (keine Koordinaten):', trade.id);
        return;
      }
      
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
    const startDate = trade.start_date ? new Date(trade.start_date).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: '2-digit' }) : 'Flexibel';
    const endDate = trade.end_date ? new Date(trade.end_date).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: '2-digit' }) : '';
    
    return `
      <div class="p-2 min-w-[180px] max-w-[220px]">
        <div class="flex items-center gap-1 mb-1">
          <span style="font-size: 14px;">${categoryInfo.icon}</span>
          <h3 class="font-semibold text-sm leading-tight">${trade.title}</h3>
        </div>
        
        <div class="mb-2 flex flex-wrap gap-1">
          <span class="inline-block bg-blue-100 text-blue-800 text-xs px-1.5 py-0.5 rounded">
            ${trade.category}
          </span>
          <span class="inline-block bg-green-100 text-green-800 text-xs px-1.5 py-0.5 rounded">
            ${trade.status}
          </span>
        </div>
        
        <div class="space-y-0.5 text-xs mb-2">
          <p><strong>Start:</strong> <span class="text-gray-700">${startDate}</span></p>
          ${endDate ? `<p><strong>Ende:</strong> <span class="text-gray-700">${endDate}</span></p>` : ''}
          <p><strong>Entfernung:</strong> <span class="text-blue-600 font-medium">${trade.distance_km.toFixed(1)} km</span></p>
        </div>
        
        <button 
          onclick="window.dispatchEvent(new CustomEvent('tradeMarkerClick', {detail: ${JSON.stringify(trade).replace(/"/g, '&quot;')}}))"
          class="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 text-white px-2 py-1 rounded text-xs font-medium hover:from-yellow-600 hover:to-yellow-700 transition-all shadow-sm"
        >
          Details
        </button>
      </div>
    `;
  };

  const createClusterPopup = (cluster: TradeSearchResult[]) => {
    const firstTrade = cluster[0];
    
    const tradesList = cluster.map((trade) => {
      const categoryInfo = getCategoryIcon(trade.category);
      
      return `
        <div class="flex items-center gap-2 py-1">
          <span style="font-size: 12px;">${categoryInfo.icon}</span>
          <span class="text-xs text-gray-800 flex-1 truncate">${trade.title}</span>
          <button 
            onclick="window.dispatchEvent(new CustomEvent('tradeMarkerClick', {detail: ${JSON.stringify(trade).replace(/"/g, '&quot;')}}))"
            class="text-xs px-2 py-0.5 bg-gray-200 hover:bg-gray-300 rounded transition-colors"
          >
            Details
          </button>
        </div>
      `;
    }).join('');

    return `
      <div class="p-2 min-w-[200px] max-w-[250px]">
        <div class="flex items-center gap-1 mb-2">
          <span class="w-5 h-5 bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-full flex items-center justify-center text-white font-bold text-xs">
            ${cluster.length}
          </span>
          <h3 class="font-semibold text-sm">${firstTrade.address_city}</h3>
        </div>
        
        <div class="max-h-48 overflow-y-auto">
          ${tradesList}
        </div>
      </div>
    `;
  };

  // Auto-Zoom zu allen Markern
  useEffect(() => {
    if (!map || !currentLocation || trades.length === 0 || !isMapLoaded || !mapRef.current) {
      console.log('🔍 Auto-Zoom übersprungen - Map noch nicht bereit oder keine Trades');
      return;
    }

    // @ts-ignore
    const L = window.L;
    if (!L) {
      console.warn('⚠️ Leaflet nicht verfügbar für Auto-Zoom');
      return;
    }

    try {
      // Filtere Trades ohne gültige Koordinaten
      const validTrades = trades.filter(trade => 
        trade.address_latitude && trade.address_longitude &&
        !isNaN(trade.address_latitude) && !isNaN(trade.address_longitude)
      );

      if (validTrades.length === 0) {
        console.log('🔍 Keine Trades mit gültigen Koordinaten für Auto-Zoom');
        return;
      }

      const group = new (L as any).featureGroup([
        (L as any).marker([currentLocation.latitude, currentLocation.longitude]),
        ...validTrades.map(trade => (L as any).marker([trade.address_latitude, trade.address_longitude]))
      ]);

      map.fitBounds(group.getBounds().pad(0.1));
      console.log('✅ Auto-Zoom auf', validTrades.length, 'Trades angewendet');
    } catch (error) {
      console.error('❌ Fehler beim Auto-Zoom:', error);
    }
  }, [map, currentLocation, trades, isMapLoaded]);

  // Karte bei Hover-Vergrößerung neu dimensionieren
  useEffect(() => {
    if (!map || !mapRef.current) {
      console.log('🔍 Map-Resize übersprungen - Map noch nicht bereit');
      return;
    }

    // Längeres Timeout für smooth transition (synchron mit CSS-Transitions)
    const resizeTimeout = setTimeout(() => {
      try {
        if (map && mapRef.current) {
          map.invalidateSize();
          
          // Optional: Zoom-Level bei Vergrößerung leicht anpassen
          if (isExpanded && currentLocation) {
            const currentZoom = map.getZoom();
            // Leichte Zoom-Anpassung für bessere Übersicht bei größerer Karte
            map.setView([currentLocation.latitude, currentLocation.longitude], Math.min(currentZoom + 0.3, 14), {
              animate: true,
              duration: 0.8 // Smooth zoom animation
            });
          }
          console.log('✅ Map-Größe aktualisiert, isExpanded:', isExpanded);
        }
      } catch (error) {
        console.error('❌ Map resize error:', error);
      }
    }, 300); // Längere Verzögerung für smooth transition (synchron mit 1000ms CSS)

    return () => clearTimeout(resizeTimeout);
  }, [map, isExpanded, currentLocation]);

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
      {/* Loading-Anzeige */}
      {!map && (
        <div className="absolute inset-0 bg-gray-100 rounded-lg flex items-center justify-center z-20">
          <div className="text-center text-gray-500">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-lg font-medium">Karte wird geladen...</p>
            <p className="text-sm">
              {!isMapLoaded ? 'Leaflet wird geladen...' : 'Karte wird initialisiert...'}
            </p>
          </div>
        </div>
      )}
      
      <div 
        ref={mapRef}
        className="w-full h-full rounded-lg"
        style={{ 
          height: '100%',
          minHeight: '400px',
          width: '100%',
          position: 'relative',
          zIndex: 1
        }}
      />
      
      {/* Kompakte ausklappbare Legende mit Glow- und Glassmorph-Effekten */}
      <div className={`absolute z-10 ${
        isMobile ? 'top-2 right-2' : 
        isTablet ? 'top-3 right-3' : 
        'top-4 right-4'
      }`}>
        <div 
          className={`bg-gradient-to-br from-white/95 to-white/90 backdrop-blur-xl rounded-xl shadow-2xl border border-white/30 transition-all duration-500 ease-out overflow-hidden ${
            isLegendExpanded 
              ? isMobile 
                ? `w-48 ${isTouching ? 'shadow-[0_0_35px_rgba(255,189,89,0.35)] scale-105' : 'shadow-[0_0_25px_rgba(255,189,89,0.25)]'}` 
                : isTablet
                ? 'w-72 shadow-[0_0_35px_rgba(255,189,89,0.28)]'
                : 'w-80 shadow-[0_0_40px_rgba(255,189,89,0.3)] hover:shadow-[0_0_50px_rgba(255,189,89,0.4)]'
              : isMobile
                ? `w-24 ${isTouching ? 'shadow-[0_0_20px_rgba(255,189,89,0.25)] scale-105' : 'shadow-[0_0_12px_rgba(255,189,89,0.15)]'}`
                : isTablet
                ? 'w-40 shadow-[0_0_18px_rgba(255,189,89,0.18)]'
                : 'w-48 shadow-[0_0_20px_rgba(255,189,89,0.2)] hover:shadow-[0_0_30px_rgba(255,189,89,0.3)]'
          }`}
          onMouseEnter={() => !isMobile && setIsLegendExpanded(true)}
          onMouseLeave={() => !isMobile && setIsLegendExpanded(false)}
          onClick={() => isMobile && handleTouchToggle()}
          onTouchStart={() => isMobile && handleTouchStart()}
          onTouchEnd={() => isMobile && handleTouchEnd()}
          style={{ touchAction: 'manipulation' }}
        >
          {/* Header mit Toggle-Button */}
          <div className={`flex items-center justify-between bg-gradient-to-r from-[#ffbd59]/20 to-[#ffa726]/20 border-b border-white/20 ${
            isMobile ? 'p-1.5' : 
            isTablet ? 'p-2.5' : 
            'p-3'
          }`}>
            <div className={`flex items-center ${isMobile ? 'gap-1.5' : 'gap-2'}`}>
              <div className={`bg-gradient-to-br from-[#ffbd59] to-[#ffa726] rounded-lg flex items-center justify-center shadow-lg ${
                isMobile ? 'w-4 h-4' : 
                isTablet ? 'w-5.5 h-5.5' : 
                'w-6 h-6'
              }`}>
                <svg className={`text-white ${
                  isMobile ? 'w-2.5 h-2.5' : 
                  isTablet ? 'w-3.5 h-3.5' : 
                  'w-4 h-4'
                }`} fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
              </div>
              <span className={`font-bold text-gray-800 ${
                isMobile ? 'text-xs' : 
                isTablet ? 'text-xs' : 
                'text-sm'
              }`}>
                {isMobile && !isLegendExpanded ? 'L' : 'Legende'}
              </span>
            </div>
            <div className={`flex items-center ${isMobile ? 'gap-1.5' : 'gap-2'}`}>
              <span className={`bg-gradient-to-r from-[#ffbd59] to-[#ffa726] text-white rounded-full font-bold shadow-lg ${
                isMobile ? 'text-xs px-1.5 py-0.5' : 
                isTablet ? 'text-xs px-1.5 py-0.5' : 
                'text-xs px-2 py-1'
              }`}>
                {trades.length}
              </span>
              <div className={`rounded-full transition-all duration-300 ${
                isLegendExpanded ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
              } ${
                isMobile ? 'w-1.5 h-1.5' : 
                isTablet ? 'w-1.5 h-1.5' : 
                'w-2 h-2'
              }`}></div>
            </div>
          </div>

          {/* Kompakter Inhalt (immer sichtbar) */}
          <div className={`${
            isMobile ? 'p-1.5' : 
            isTablet ? 'p-2.5' : 
            'p-3'
          }`}>
            <div className={`${isMobile ? 'space-y-1.5' : 'space-y-2'} ${isMobile ? 'text-xs' : 'text-xs'}`}>
              <div className={`flex items-center ${isMobile ? 'gap-1.5' : 'gap-2'}`}>
                <div className={`bg-blue-500 rounded-full border border-white shadow-sm ${
                  isMobile ? 'w-2 h-2' : 
                  isTablet ? 'w-2.5 h-2.5' : 
                  'w-3 h-3'
                }`}></div>
                <span className={`text-gray-700 font-medium ${
                  isMobile ? 'text-xs' : 
                  isTablet ? 'text-xs' : 
                  'text-xs'
                }`}>
                  {isMobile && !isLegendExpanded ? '📍' : 'Ihr Standort'}
                </span>
              </div>
              <div className={`flex items-center ${isMobile ? 'gap-1.5' : 'gap-2'}`}>
                <div className={`bg-yellow-500 rounded-full border border-white shadow-sm ${
                  isMobile ? 'w-2 h-2' : 
                  isTablet ? 'w-2.5 h-2.5' : 
                  'w-3 h-3'
                }`}></div>
                <span className={`text-gray-700 font-medium ${
                  isMobile ? 'text-xs' : 
                  isTablet ? 'text-xs' : 
                  'text-xs'
                }`}>
                  {isMobile && !isLegendExpanded ? '🎯' : 'Ausschreibungen'}
                </span>
              </div>
            </div>
          </div>

          {/* Erweiterte Inhalte (nur bei Hover/Click) */}
          <div className={`transition-all duration-500 ease-out overflow-hidden ${
            isLegendExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
          }`}>
            <div className={`border-t border-white/20 bg-gradient-to-b from-white/10 to-transparent ${
              isMobile ? 'px-1.5 pb-1.5' : 
              isTablet ? 'px-2.5 pb-2.5' : 
              'px-3 pb-3'
            }`}>
              {/* Kategorien */}
              <div className={`${
                isMobile ? 'mt-1.5' : 
                isTablet ? 'mt-2.5' : 
                'mt-3'
              }`}>
                <div className={`font-bold text-gray-700 mb-2 flex items-center gap-1 ${
                  isMobile ? 'text-xs' : 
                  isTablet ? 'text-xs' : 
                  'text-xs'
                }`}>
                  <span>🏗️</span>
                  <span>{isMobile ? 'Kategorien' : 'Gewerke-Kategorien'}</span>
                </div>
                <div className={`grid gap-1 ${
                  isMobile ? 'grid-cols-1 text-xs' : 
                  isTablet ? 'grid-cols-2 text-xs' : 
                  'grid-cols-2 text-xs'
                }`}>
                  <div className="flex items-center gap-1 hover:bg-white/20 rounded px-1 py-0.5 transition-colors">
                    <span>⚡</span>
                    <span className="text-gray-600">Elektro</span>
                  </div>
                  <div className="flex items-center gap-1 hover:bg-white/20 rounded px-1 py-0.5 transition-colors">
                    <span>🔧</span>
                    <span className="text-gray-600">Sanitär</span>
                  </div>
                  <div className="flex items-center gap-1 hover:bg-white/20 rounded px-1 py-0.5 transition-colors">
                    <span>🔥</span>
                    <span className="text-gray-600">Heizung</span>
                  </div>
                  <div className="flex items-center gap-1 hover:bg-white/20 rounded px-1 py-0.5 transition-colors">
                    <span>🏠</span>
                    <span className="text-gray-600">Dach</span>
                  </div>
                  <div className="flex items-center gap-1 hover:bg-white/20 rounded px-1 py-0.5 transition-colors">
                    <span>🪟</span>
                    <span className="text-gray-600">Fenster</span>
                  </div>
                  <div className="flex items-center gap-1 hover:bg-white/20 rounded px-1 py-0.5 transition-colors">
                    <span>🌱</span>
                    <span className="text-gray-600">Garten</span>
                  </div>
                </div>
              </div>

              {/* Zusätzliche Informationen */}
              <div className={`pt-2 border-t border-white/20 ${
                isMobile ? 'mt-1.5' : 
                isTablet ? 'mt-2.5' : 
                'mt-3'
              }`}>
                <div className={`text-gray-500 space-y-1 ${
                  isMobile ? 'text-xs' : 
                  isTablet ? 'text-xs' : 
                  'text-xs'
                }`}>
                  <div className="flex items-center gap-1">
                    <span>💡</span>
                    <span>{
                      isMobile ? 'Marker anklicken' : 
                      isTablet ? 'Marker anklicken' : 
                      'Klicken Sie auf Marker für Details'
                    }</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span>🎯</span>
                    <span>{
                      isMobile ? 'Angebote abgeben' : 
                      isTablet ? 'Angebote abgeben' : 
                      'Angebote direkt abgeben'
                    }</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 