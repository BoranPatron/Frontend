// Finales Debug-Skript für Geo-Suche nach Datenbank-Behebung
// Testet die Kartenansicht nach der Behebung der fehlenden Koordinaten

console.log('🔍 Finale Geo-Search Debug-Analyse gestartet');

// 1. Authentifizierung und API-Test
async function testCompleteGeoSearch() {
  console.log('=== VOLLSTÄNDIGER GEO-SEARCH TEST ===');
  
  const token = localStorage.getItem('token');
  const user = localStorage.getItem('user');
  
  if (!token) {
    console.error('❌ Kein Token vorhanden - bitte anmelden');
    return null;
  }
  
  // API Base URL
  const hostname = window.location.hostname;
  const port = window.location.port;
  const baseUrl = `http://${hostname}:${port || '8000'}`;
  
  console.log('API Base URL:', baseUrl);
  console.log('Token vorhanden:', !!token);
  
  try {
    // Teste die Gewerk-Suche mit verschiedenen Standorten
    const testLocations = [
      { name: 'Berlin', lat: 52.5200, lng: 13.4050 },
      { name: 'München', lat: 48.1351, lng: 11.5820 },
      { name: 'Düsseldorf', lat: 51.2254, lng: 6.7763 }
    ];
    
    for (const location of testLocations) {
      console.log(`\n🔍 Teste Suche in ${location.name}...`);
      
      const searchRequest = {
        latitude: location.lat,
        longitude: location.lng,
        radius_km: 50,
        limit: 10
      };
      
      const response = await fetch(`${baseUrl}/geo/search-trades`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(searchRequest)
      });
      
      console.log(`Response Status für ${location.name}:`, response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`✅ ${location.name}: ${data.length} Gewerke gefunden`);
        
        if (data.length > 0) {
          const firstTrade = data[0];
          console.log(`Erstes Gewerk in ${location.name}:`, {
            id: firstTrade.id,
            title: firstTrade.title,
            category: firstTrade.category,
            status: firstTrade.status,
            address_latitude: firstTrade.address_latitude,
            address_longitude: firstTrade.address_longitude,
            distance_km: firstTrade.distance_km,
            project_name: firstTrade.project_name,
            address_street: firstTrade.address_street,
            address_city: firstTrade.address_city
          });
          
          // Prüfe Koordinaten
          if (firstTrade.address_latitude && firstTrade.address_longitude) {
            console.log(`✅ Koordinaten vorhanden: ${firstTrade.address_latitude}, ${firstTrade.address_longitude}`);
          } else {
            console.log(`❌ Keine Koordinaten vorhanden`);
          }
        } else {
          console.log(`⚠️ Keine Gewerke in ${location.name} gefunden`);
        }
      } else {
        const errorText = await response.text();
        console.error(`❌ API-Fehler für ${location.name}:`, response.status, errorText);
      }
    }
    
    return true;
    
  } catch (error) {
    console.error('❌ Netzwerk-Fehler:', error);
    return null;
  }
}

// 2. Frontend-Komponente testen
function testFrontendComponents() {
  console.log('\n=== FRONTEND-KOMPONENTEN TEST ===');
  
  // Suche nach React-Komponenten
  const reactRoot = document.querySelector('#root');
  console.log('React Root gefunden:', !!reactRoot);
  
  // Suche nach der Karten-Komponente
  const mapContainer = document.querySelector('.leaflet-container');
  console.log('Leaflet Container gefunden:', !!mapContainer);
  
  // Suche nach Markern
  const markers = document.querySelectorAll('.leaflet-marker-icon');
  console.log('Marker gefunden:', markers.length);
  
  // Suche nach Popups
  const popups = document.querySelectorAll('.leaflet-popup');
  console.log('Popups gefunden:', popups.length);
  
  // Suche nach der GeoSearch-Komponente
  const geoSearchElements = document.querySelectorAll('[data-testid="geo-search"], .geo-search, [class*="GeoSearch"]');
  console.log('GeoSearch-Elemente gefunden:', geoSearchElements.length);
  
  // Debug-Informationen
  const debugInfo = {
    reactRoot: !!reactRoot,
    mapContainer: !!mapContainer,
    markersCount: markers.length,
    popupsCount: popups.length,
    geoSearchElements: geoSearchElements.length,
    windowSize: {
      width: window.innerWidth,
      height: window.innerHeight
    },
    currentUrl: window.location.href
  };
  
  console.log('Frontend Debug Info:', debugInfo);
  return debugInfo;
}

// 3. Karten-Rendering testen
function testMapRendering() {
  console.log('\n=== KARTEN-RENDERING TEST ===');
  
  // Prüfe Leaflet-Bibliothek
  const leafletAvailable = typeof L !== 'undefined';
  console.log('Leaflet verfügbar:', leafletAvailable);
  
  // Prüfe React-Leaflet
  const reactLeafletAvailable = typeof MapContainer !== 'undefined';
  console.log('React-Leaflet verfügbar:', reactLeafletAvailable);
  
  // Suche nach Karten-Elementen
  const mapElements = document.querySelectorAll('.leaflet-container, .leaflet-map, [class*="map"]');
  console.log('Karten-Elemente gefunden:', mapElements.length);
  
  // Prüfe CSS-Styles
  const mapStyles = window.getComputedStyle(document.querySelector('.leaflet-container') || document.body);
  console.log('Karten-Styles geladen:', !!mapStyles);
  
  // Debug-Informationen
  const mapDebugInfo = {
    leafletAvailable,
    reactLeafletAvailable,
    mapElementsCount: mapElements.length,
    mapStylesLoaded: !!mapStyles,
    userAgent: navigator.userAgent
  };
  
  console.log('Karten Debug Info:', mapDebugInfo);
  return mapDebugInfo;
}

// 4. Vollständige Analyse
async function runFinalGeoSearchDebug() {
  console.log('🚀 Starte finale Geo-Search Debug-Analyse...');
  
  try {
    // 1. API-Test
    const apiSuccess = await testCompleteGeoSearch();
    
    // 2. Frontend-Komponenten
    const frontendInfo = testFrontendComponents();
    
    // 3. Karten-Rendering
    const mapInfo = testMapRendering();
    
    // Zusammenfassung
    console.log('\n📊 FINALE DEBUG-ZUSAMMENFASSUNG:');
    console.log('✅ API-Test:', apiSuccess ? 'Erfolgreich' : 'Fehlgeschlagen');
    console.log('✅ React Root:', frontendInfo.reactRoot);
    console.log('✅ Leaflet Container:', frontendInfo.mapContainer);
    console.log('✅ Marker gefunden:', frontendInfo.markersCount);
    console.log('✅ Leaflet verfügbar:', mapInfo.leafletAvailable);
    console.log('✅ React-Leaflet verfügbar:', mapInfo.reactLeafletAvailable);
    
    // Problem-Analyse
    if (apiSuccess && frontendInfo.markersCount === 0) {
      console.log('\n🔍 PROBLEM ERKANNT: API funktioniert, aber keine Marker auf der Karte');
      console.log('Mögliche Ursachen:');
      console.log('1. Leaflet-Karte nicht korrekt initialisiert');
      console.log('2. Marker-Rendering fehlgeschlagen');
      console.log('3. CSS-Probleme mit Marker-Sichtbarkeit');
      console.log('4. React-Komponente nicht korrekt gerendert');
    } else if (!apiSuccess) {
      console.log('\n🔍 PROBLEM ERKANNT: API funktioniert nicht');
      console.log('Mögliche Ursachen:');
      console.log('1. Backend nicht gestartet');
      console.log('2. Authentifizierungsproblem');
      console.log('3. Datenbank-Probleme');
      console.log('4. Netzwerk-Probleme');
    } else {
      console.log('\n✅ Alles scheint normal zu funktionieren');
    }
    
    return {
      apiSuccess,
      frontendInfo,
      mapInfo
    };
    
  } catch (error) {
    console.error('❌ Fehler bei der finalen Debug-Analyse:', error);
    return null;
  }
}

// 5. Automatische Ausführung
console.log('🔄 Starte finale Debug-Analyse...');
runFinalGeoSearchDebug().then(results => {
  console.log('✅ Finale Debug-Analyse abgeschlossen');
  console.log('Ergebnisse:', results);
}).catch(error => {
  console.error('❌ Finale Debug-Analyse fehlgeschlagen:', error);
});

// 6. Manuelle Ausführung ermöglichen
window.debugGeoSearchFinal = runFinalGeoSearchDebug;
console.log('💡 Verwende window.debugGeoSearchFinal() für manuelle Ausführung');

// 7. Zusätzliche Hilfsfunktionen
window.testGeoSearchAPI = testCompleteGeoSearch;
window.testFrontendComponents = testFrontendComponents;
window.testMapRendering = testMapRendering; 