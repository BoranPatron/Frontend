// Finales Test-Skript für Geo-Suche nach Datenbank-Behebung
console.log('🔍 FINALER TEST: Geo-Suche nach Datenbank-Behebung');

// 1. Teste die Geo-Search API
async function testGeoSearchAPI() {
  console.log('=== TESTE GEO-SEARCH API ===');
  
  const token = localStorage.getItem('token');
  if (!token) {
    console.error('❌ Kein Token vorhanden - bitte anmelden');
    return null;
  }
  
  const baseUrl = `http://${window.location.hostname}:${window.location.port || '8000'}`;
  
  try {
    const searchRequest = {
      latitude: 52.5200, // Berlin
      longitude: 13.4050,
      radius_km: 50,
      limit: 10
    };
    
    console.log('Sende Suchanfrage:', searchRequest);
    
    const response = await fetch(`${baseUrl}/geo/search-trades`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(searchRequest)
    });
    
    console.log('Response Status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ API-Antwort erfolgreich:', data);
      console.log('Anzahl Gewerke:', data.length);
      
      if (data.length > 0) {
        const firstTrade = data[0];
        console.log('Erstes Gewerk:', {
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
          console.log('✅ Koordinaten vorhanden:', firstTrade.address_latitude, firstTrade.address_longitude);
        } else {
          console.log('❌ Keine Koordinaten vorhanden');
        }
      } else {
        console.log('⚠️ Keine Gewerke gefunden');
      }
      
      return data;
    } else {
      const errorText = await response.text();
      console.error('❌ API-Fehler:', response.status, errorText);
      return null;
    }
  } catch (error) {
    console.error('❌ Netzwerk-Fehler:', error);
    return null;
  }
}

// 2. Teste Frontend-Komponenten
function testFrontendComponents() {
  console.log('\n=== TESTE FRONTEND-KOMPONENTEN ===');
  
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
  
  // Debug-Informationen
  const debugInfo = {
    reactRoot: !!reactRoot,
    mapContainer: !!mapContainer,
    markersCount: markers.length,
    popupsCount: popups.length,
    windowSize: {
      width: window.innerWidth,
      height: window.innerHeight
    },
    currentUrl: window.location.href
  };
  
  console.log('Frontend Debug Info:', debugInfo);
  return debugInfo;
}

// 3. Teste Karten-Rendering
function testMapRendering() {
  console.log('\n=== TESTE KARTEN-RENDERING ===');
  
  // Prüfe Leaflet-Bibliothek
  const leafletAvailable = typeof L !== 'undefined';
  console.log('Leaflet verfügbar:', leafletAvailable);
  
  // Suche nach Karten-Elementen
  const mapElements = document.querySelectorAll('.leaflet-container, .leaflet-map, [class*="map"]');
  console.log('Karten-Elemente gefunden:', mapElements.length);
  
  // Prüfe CSS-Styles
  const mapStyles = window.getComputedStyle(document.querySelector('.leaflet-container') || document.body);
  console.log('Karten-Styles geladen:', !!mapStyles);
  
  // Debug-Informationen
  const mapDebugInfo = {
    leafletAvailable,
    mapElementsCount: mapElements.length,
    mapStylesLoaded: !!mapStyles,
    userAgent: navigator.userAgent
  };
  
  console.log('Karten Debug Info:', mapDebugInfo);
  return mapDebugInfo;
}

// 4. Vollständiger Test
async function runFinalTest() {
  console.log('🚀 Starte finalen Test nach Datenbank-Behebung...');
  
  try {
    // 1. API-Test
    const apiResults = await testGeoSearchAPI();
    
    // 2. Frontend-Komponenten
    const frontendInfo = testFrontendComponents();
    
    // 3. Karten-Rendering
    const mapInfo = testMapRendering();
    
    // Zusammenfassung
    console.log('\n📊 FINALER TEST-ZUSAMMENFASSUNG:');
    console.log('✅ API-Test:', apiResults ? `${apiResults.length} Gewerke gefunden` : 'Fehlgeschlagen');
    console.log('✅ React Root:', frontendInfo.reactRoot);
    console.log('✅ Leaflet Container:', frontendInfo.mapContainer);
    console.log('✅ Marker gefunden:', frontendInfo.markersCount);
    console.log('✅ Leaflet verfügbar:', mapInfo.leafletAvailable);
    
    // Erfolgs-Analyse
    if (apiResults && apiResults.length > 0 && frontendInfo.markersCount > 0) {
      console.log('\n🎉 ERFOLG: Gewerke werden auf der Karte angezeigt!');
      console.log('✅ API liefert Daten mit Koordinaten');
      console.log('✅ Frontend zeigt Marker an');
      console.log('✅ Problem ist behoben!');
    } else if (apiResults && apiResults.length > 0 && frontendInfo.markersCount === 0) {
      console.log('\n⚠️ PROBLEM: API liefert Daten, aber keine Marker auf der Karte');
      console.log('Mögliche Ursachen:');
      console.log('1. Leaflet-Karte nicht korrekt initialisiert');
      console.log('2. Marker-Rendering fehlgeschlagen');
      console.log('3. CSS-Probleme mit Marker-Sichtbarkeit');
    } else if (!apiResults || apiResults.length === 0) {
      console.log('\n❌ PROBLEM: Keine Daten von der API');
      console.log('Mögliche Ursachen:');
      console.log('1. Backend nicht gestartet');
      console.log('2. Authentifizierungsproblem');
      console.log('3. Datenbank-Probleme');
    } else {
      console.log('\n✅ Alles scheint normal zu funktionieren');
    }
    
    return {
      apiResults,
      frontendInfo,
      mapInfo
    };
    
  } catch (error) {
    console.error('❌ Fehler beim finalen Test:', error);
    return null;
  }
}

// 5. Automatische Ausführung
console.log('🔄 Starte finalen Test...');
runFinalTest().then(results => {
  console.log('✅ Finaler Test abgeschlossen');
  console.log('Ergebnisse:', results);
}).catch(error => {
  console.error('❌ Finaler Test fehlgeschlagen:', error);
});

// 6. Manuelle Ausführung ermöglichen
window.runFinalGeoTest = runFinalTest;
console.log('💡 Verwende window.runFinalGeoTest() für manuelle Ausführung');

// 7. Zusätzliche Hilfsfunktionen
window.testGeoSearchAPI = testGeoSearchAPI;
window.testFrontendComponents = testFrontendComponents;
window.testMapRendering = testMapRendering; 