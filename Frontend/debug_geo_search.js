// Debug-Skript für Geo-Suche und Kartenansicht
// Analysiert das Problem mit fehlenden Markern auf der Karte

console.log('🔍 Debug Geo-Suche gestartet');

// 1. Authentifizierung testen
function debugAuthContext() {
  console.log('=== AUTHENTIFIZIERUNG ===');
  
  const token = localStorage.getItem('token');
  const user = localStorage.getItem('user');
  
  console.log('Token vorhanden:', !!token);
  console.log('User vorhanden:', !!user);
  
  if (user) {
    try {
      const userData = JSON.parse(user);
      console.log('User-Typ:', userData.user_type);
      console.log('User-ID:', userData.id);
    } catch (e) {
      console.error('Fehler beim Parsen der User-Daten:', e);
    }
  }
  
  return { token, user };
}

// 2. API-Basis-URL testen
function debugApiBaseUrl() {
  console.log('=== API BASIS-URL ===');
  
  // Importiere die API-Funktion
  const apiModule = window.apiModule || {};
  const getApiBaseUrl = apiModule.getApiBaseUrl || (() => {
    const hostname = window.location.hostname;
    const port = window.location.port;
    return `http://${hostname}:${port || '8000'}`;
  });
  
  const baseUrl = getApiBaseUrl();
  console.log('API Base URL:', baseUrl);
  
  return baseUrl;
}

// 3. Geo-Service API testen
async function testGeoSearchAPI() {
  console.log('=== GEO-SEARCH API TEST ===');
  
  const baseUrl = debugApiBaseUrl();
  const { token } = debugAuthContext();
  
  if (!token) {
    console.error('❌ Kein Token vorhanden');
    return null;
  }
  
  try {
    // Teste die Gewerk-Suche
    const searchRequest = {
      latitude: 52.5200, // Berlin
      longitude: 13.4050,
      radius_km: 10,
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
    console.log('Response Headers:', Object.fromEntries(response.headers.entries()));
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ API-Antwort erfolgreich:', data);
      console.log('Anzahl Gewerke:', data.length);
      
      // Analysiere die Datenstruktur
      if (data.length > 0) {
        const firstTrade = data[0];
        console.log('Erstes Gewerk:', firstTrade);
        console.log('Koordinaten vorhanden:', {
          address_latitude: !!firstTrade.address_latitude,
          address_longitude: !!firstTrade.address_longitude,
          latitude: !!firstTrade.latitude,
          longitude: !!firstTrade.longitude
        });
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

// 4. Frontend-Komponente analysieren
function debugFrontendComponent() {
  console.log('=== FRONTEND KOMPONENTE ===');
  
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
  
  // Debug-Informationen aus der React-Komponente extrahieren
  const debugInfo = {
    mapContainer: !!mapContainer,
    markersCount: markers.length,
    popupsCount: popups.length,
    windowSize: {
      width: window.innerWidth,
      height: window.innerHeight
    }
  };
  
  console.log('Frontend Debug Info:', debugInfo);
  return debugInfo;
}

// 5. Service-Funktionen testen
async function testServiceFunctions() {
  console.log('=== SERVICE FUNKTIONEN ===');
  
  try {
    // Teste die geoService-Funktionen
    const geoService = window.geoService || {};
    
    if (typeof geoService.searchTradesInRadius === 'function') {
      console.log('✅ searchTradesInRadius Funktion gefunden');
      
      const testRequest = {
        latitude: 52.5200,
        longitude: 13.4050,
        radius_km: 10,
        limit: 5
      };
      
      console.log('Teste searchTradesInRadius mit:', testRequest);
      
      try {
        const results = await geoService.searchTradesInRadius(testRequest);
        console.log('Service-Ergebnisse:', results);
        return results;
      } catch (error) {
        console.error('❌ Service-Fehler:', error);
        return null;
      }
    } else {
      console.log('⚠️ searchTradesInRadius Funktion nicht gefunden');
      return null;
    }
  } catch (error) {
    console.error('❌ Fehler beim Testen der Service-Funktionen:', error);
    return null;
  }
}

// 6. Karten-Daten analysieren
function debugMapData() {
  console.log('=== KARTEN-DATEN ===');
  
  // Suche nach React-State
  const reactDevTools = window.__REACT_DEVTOOLS_GLOBAL_HOOK__;
  console.log('React DevTools verfügbar:', !!reactDevTools);
  
  // Versuche, auf React-Komponenten zuzugreifen
  const reactElements = document.querySelectorAll('[data-reactroot], [data-reactid]');
  console.log('React-Elemente gefunden:', reactElements.length);
  
  // Debug-Informationen sammeln
  const mapData = {
    reactDevTools: !!reactDevTools,
    reactElements: reactElements.length,
    currentUrl: window.location.href,
    userAgent: navigator.userAgent
  };
  
  console.log('Karten-Daten Debug:', mapData);
  return mapData;
}

// 7. Vollständige Analyse durchführen
async function runGeoSearchDebug() {
  console.log('🚀 Starte vollständige Geo-Search Debug-Analyse...');
  
  try {
    // 1. Authentifizierung
    const auth = debugAuthContext();
    
    // 2. API-Basis-URL
    const baseUrl = debugApiBaseUrl();
    
    // 3. API-Test
    const apiResults = await testGeoSearchAPI();
    
    // 4. Frontend-Komponente
    const frontendInfo = debugFrontendComponent();
    
    // 5. Service-Funktionen
    const serviceResults = await testServiceFunctions();
    
    // 6. Karten-Daten
    const mapData = debugMapData();
    
    // Zusammenfassung
    console.log('📊 DEBUG-ZUSAMMENFASSUNG:');
    console.log('✅ Authentifizierung:', !!auth.token);
    console.log('✅ API Base URL:', baseUrl);
    console.log('✅ API-Ergebnisse:', apiResults ? apiResults.length : 0, 'Gewerke');
    console.log('✅ Frontend-Container:', frontendInfo.mapContainer);
    console.log('✅ Marker gefunden:', frontendInfo.markersCount);
    console.log('✅ Service-Funktionen:', !!serviceResults);
    
    // Problem-Analyse
    if (apiResults && apiResults.length > 0 && frontendInfo.markersCount === 0) {
      console.log('🔍 PROBLEM ERKANNT: API liefert Daten, aber keine Marker auf der Karte');
      console.log('Mögliche Ursachen:');
      console.log('1. Koordinaten fehlen oder sind ungültig');
      console.log('2. Leaflet-Karte nicht korrekt initialisiert');
      console.log('3. Marker-Rendering fehlgeschlagen');
      console.log('4. CSS-Probleme mit Marker-Sichtbarkeit');
    } else if (!apiResults || apiResults.length === 0) {
      console.log('🔍 PROBLEM ERKANNT: Keine Daten von der API');
      console.log('Mögliche Ursachen:');
      console.log('1. Authentifizierungsproblem');
      console.log('2. Keine Gewerke in der Datenbank');
      console.log('3. API-Endpoint nicht verfügbar');
      console.log('4. Netzwerk-Probleme');
    } else {
      console.log('✅ Alles scheint normal zu funktionieren');
    }
    
    return {
      auth,
      baseUrl,
      apiResults,
      frontendInfo,
      serviceResults,
      mapData
    };
    
  } catch (error) {
    console.error('❌ Fehler bei der Debug-Analyse:', error);
    return null;
  }
}

// 8. Automatische Ausführung
console.log('🔄 Starte automatische Debug-Analyse...');
runGeoSearchDebug().then(results => {
  console.log('✅ Debug-Analyse abgeschlossen');
  console.log('Ergebnisse:', results);
}).catch(error => {
  console.error('❌ Debug-Analyse fehlgeschlagen:', error);
});

// 9. Manuelle Ausführung ermöglichen
window.debugGeoSearch = runGeoSearchDebug;
console.log('💡 Verwende window.debugGeoSearch() für manuelle Ausführung'); 