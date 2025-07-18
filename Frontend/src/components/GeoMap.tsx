import React, { useEffect, useRef, useState } from 'react';
import { ProjectSearchResult, ServiceProviderSearchResult, formatDistance } from '../api/geoService';

interface GeoMapProps {
  currentLocation: { latitude: number; longitude: number } | null;
  projects: ProjectSearchResult[];
  serviceProviders: ServiceProviderSearchResult[];
  searchMode: 'projects' | 'service_providers';
  onMarkerClick: (item: ProjectSearchResult | ServiceProviderSearchResult) => void;
}

export default function GeoMap({ 
  currentLocation, 
  projects, 
  serviceProviders, 
  searchMode, 
  onMarkerClick 
}: GeoMapProps) {
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
    document.head.appendChild(link);

    return () => {
      document.head.removeChild(link);
    };
  }, []);

  // Leaflet Script laden
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.integrity = 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=';
    script.crossOrigin = '';
    
    script.onload = () => {
      setIsMapLoaded(true);
    };
    
    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
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
    const centerMarker = L.marker([currentLocation.latitude, currentLocation.longitude])
      .addTo(newMap)
      .bindPopup('<b>Ihr Standort</b><br>Zentrum der Suche');

    // Suchradius-Kreis hinzufügen (wird später implementiert)
    const radiusCircle = L.circle([currentLocation.latitude, currentLocation.longitude], {
      color: 'blue',
      fillColor: '#3388ff',
      fillOpacity: 0.1,
      radius: 50000 // 50km Standard
    }).addTo(newMap);

    setMap(newMap);

    return () => {
      if (newMap) {
        newMap.remove();
      }
    };
  }, [isMapLoaded, currentLocation]);

  // Marker aktualisieren
  useEffect(() => {
    if (!map || !isMapLoaded) return;

    // Alte Marker entfernen
    markers.forEach(marker => marker.remove());
    const newMarkers: any[] = [];

    // Neue Marker hinzufügen
    if (searchMode === 'projects') {
      projects.forEach((project, index) => {
        // @ts-ignore
        const L = window.L;
        if (!L) return;

        const marker = L.marker([project.address_latitude, project.address_longitude])
          .addTo(map)
          .bindPopup(`
            <div class="p-2">
              <h3 class="font-bold text-lg">${project.name}</h3>
              <p class="text-sm text-gray-600">${project.description || 'Keine Beschreibung'}</p>
              <div class="mt-2">
                <span class="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                  ${project.project_type}
                </span>
                <span class="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded ml-1">
                  ${project.status}
                </span>
              </div>
              <p class="text-sm mt-1">
                <strong>Adresse:</strong> ${project.address_street}, ${project.address_zip} ${project.address_city}
              </p>
              <p class="text-sm">
                <strong>Entfernung:</strong> ${formatDistance(project.distance_km)}
              </p>
              ${project.budget ? `<p class="text-sm"><strong>Budget:</strong> ${project.budget.toLocaleString()}€</p>` : ''}
              <button 
                onclick="window.dispatchEvent(new CustomEvent('markerClick', {detail: ${JSON.stringify(project)}}))"
                class="mt-2 bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
              >
                Details anzeigen
              </button>
            </div>
          `);

        newMarkers.push(marker);
      });
    } else {
      serviceProviders.forEach((provider, index) => {
        // @ts-ignore
        const L = window.L;
        if (!L) return;

        const marker = L.marker([provider.address_latitude, provider.address_longitude])
          .addTo(map)
          .bindPopup(`
            <div class="p-2">
              <h3 class="font-bold text-lg">${provider.first_name} ${provider.last_name}</h3>
              ${provider.company_name ? `<p class="text-sm text-gray-600">${provider.company_name}</p>` : ''}
              <div class="mt-2">
                ${provider.is_verified ? 
                  '<span class="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded">✓ Verifiziert</span>' : 
                  '<span class="inline-block bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded">Nicht verifiziert</span>'
                }
              </div>
              <p class="text-sm mt-1">
                <strong>Adresse:</strong> ${provider.address_street}, ${provider.address_zip} ${provider.address_city}
              </p>
              <p class="text-sm">
                <strong>Entfernung:</strong> ${formatDistance(provider.distance_km)}
              </p>
              <button 
                onclick="window.dispatchEvent(new CustomEvent('markerClick', {detail: ${JSON.stringify(provider)}}))"
                class="mt-2 bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
              >
                Details anzeigen
              </button>
            </div>
          `);

        newMarkers.push(marker);
      });
    }

    setMarkers(newMarkers);

    // Event-Listener für Marker-Clicks
    const handleMarkerClick = (event: CustomEvent) => {
      onMarkerClick(event.detail);
    };

    window.addEventListener('markerClick', handleMarkerClick as EventListener);

    return () => {
      window.removeEventListener('markerClick', handleMarkerClick as EventListener);
    };
  }, [map, projects, serviceProviders, searchMode, onMarkerClick]);

  // Radius-Kreis aktualisieren
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

    // Neuen Radius-Kreis hinzufügen (50km Standard)
    L.circle([currentLocation.latitude, currentLocation.longitude], {
      color: 'blue',
      fillColor: '#3388ff',
      fillOpacity: 0.1,
      radius: 50000
    }).addTo(map);

  }, [map, currentLocation]);

  if (!currentLocation) {
    return (
      <div className="h-full bg-gray-50 rounded-lg flex items-center justify-center">
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
        style={{ minHeight: '400px' }}
      />
      
      {/* Karten-Controls */}
      <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-2 z-10">
        <div className="text-xs text-gray-600 mb-1">Legende</div>
        <div className="flex items-center space-x-2 text-xs">
          <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
          <span>Zentrum</span>
        </div>
        <div className="flex items-center space-x-2 text-xs">
          <div className="w-3 h-3 bg-red-500 rounded-full"></div>
          <span>{searchMode === 'projects' ? 'Projekte' : 'Dienstleister'}</span>
        </div>
        <div className="text-xs text-gray-500 mt-1">
          {searchMode === 'projects' ? projects.length : serviceProviders.length} Ergebnisse
        </div>
      </div>
    </div>
  );
} 