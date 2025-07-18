// Debug-Skript für Karten-Marker (Finale Version)
// Führe dieses Skript in der Browser-Konsole aus

console.log('🚀 Starte finale Karten-Marker Debug-Analyse...');

// 1. Überprüfe AuthContext
function debugAuthContext() {
  console.log('=== AUTH CONTEXT DEBUG ===');
  
  // Versuche React DevTools zu verwenden
  if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
    console.log('✅ React DevTools verfügbar');
  } else {
    console.log('❌ React DevTools nicht verfügbar');
  }
  
  // Suche nach AuthContext im DOM
  const authElements = document.querySelectorAll('[data-testid*="auth"], [class*="auth"], [id*="auth"]');
  console.log('🔍 Auth-Elemente gefunden:', authElements.length);
  
  // Prüfe localStorage für Token
  const token = localStorage.getItem('token');
  console.log('🔑 Token vorhanden:', !!token);
  
  // Prüfe sessionStorage für User-Daten
  const userData = sessionStorage.getItem('user');
  console.log('👤 User-Daten vorhanden:', !!userData);
  
  if (userData) {
    try {
      const user = JSON.parse(userData);
      console.log('👤 User-Typ:', user.user_type);
      console.log('👤 Service Provider:', user.user_type === 'service_provider');
    } catch (e) {
      console.log('❌ Fehler beim Parsen der User-Daten:', e);
    }
  }
}

// 2. Überprüfe TradeMap-Komponente
function debugTradeMapComponent() {
  console.log('=== TRADE MAP COMPONENT DEBUG ===');
  
  // Suche nach TradeMap-Elementen
  const mapElements = document.querySelectorAll('[class*="map"], [class*="leaflet"], [class*="trade"]');
  console.log('🗺️ Map-Elemente gefunden:', mapElements.length);
  
  // Suche nach Leaflet-Container
  const leafletContainer = document.querySelector('.leaflet-container');
  if (leafletContainer) {
    console.log('✅ Leaflet-Container gefunden');
    console.log('📏 Container-Größe:', leafletContainer.offsetWidth, 'x', leafletContainer.offsetHeight);
  } else {
    console.log('❌ Leaflet-Container nicht gefunden');
  }
  
  // Suche nach Markern
  const markers = document.querySelectorAll('.leaflet-marker-icon, .custom-marker, .cluster-marker');
  console.log('📍 Marker gefunden:', markers.length);
  
  // Suche nach Popups
  const popups = document.querySelectorAll('.leaflet-popup');
  console.log('💬 Popups gefunden:', popups.length);
}

// 3. Überprüfe Trade-Daten
function debugTradeData() {
  console.log('=== TRADE DATA DEBUG ===');
  
  // Versuche React-Komponenten zu finden
  const reactRoot = document.querySelector('#root');
  if (reactRoot && reactRoot._reactInternalFiber) {
    console.log('✅ React-Root gefunden');
    
    // Versuche Props zu extrahieren
    try {
      const fiber = reactRoot._reactInternalFiber;
      console.log('🔍 React-Fiber gefunden');
      
      // Suche nach TradeMap-Komponente
      let currentFiber = fiber;
      while (currentFiber) {
        if (currentFiber.type && currentFiber.type.name === 'TradeMap') {
          console.log('✅ TradeMap-Komponente gefunden');
          console.log('📊 Props:', currentFiber.memoizedProps);
          break;
        }
        currentFiber = currentFiber.return;
      }
    } catch (e) {
      console.log('❌ Fehler beim Zugriff auf React-Fiber:', e);
    }
  } else {
    console.log('❌ React-Root nicht gefunden');
  }
}

// 4. Überprüfe Koordinaten-Daten
function debugCoordinateData() {
  console.log('=== COORDINATE DATA DEBUG ===');
  
  // Suche nach Koordinaten in der Seite
  const coordinateElements = document.querySelectorAll('[class*="lat"], [class*="lng"], [class*="coord"]');
  console.log('📍 Koordinaten-Elemente gefunden:', coordinateElements.length);
  
  // Prüfe localStorage für Koordinaten
  const storedCoords = localStorage.getItem('currentLocation');
  if (storedCoords) {
    try {
      const coords = JSON.parse(storedCoords);
      console.log('📍 Gespeicherte Koordinaten:', coords);
    } catch (e) {
      console.log('❌ Fehler beim Parsen der gespeicherten Koordinaten:', e);
    }
  } else {
    console.log('❌ Keine gespeicherten Koordinaten gefunden');
  }
  
  // Suche nach Zürich-spezifischen Daten
  const zurichElements = document.querySelectorAll('*');
  let zurichCount = 0;
  zurichElements.forEach(el => {
    if (el.textContent && el.textContent.includes('Zürich')) {
      zurichCount++;
    }
  });
  console.log('🇨🇭 Zürich-Referenzen gefunden:', zurichCount);
}

// 5. Überprüfe JavaScript-Fehler
function debugJavaScriptErrors() {
  console.log('=== JAVASCRIPT ERRORS DEBUG ===');
  
  // Prüfe auf globale Fehler
  if (window.lastError) {
    console.log('❌ Letzter Fehler:', window.lastError);
  }
  
  // Prüfe auf React-Fehler
  const errorBoundary = document.querySelector('[class*="error"], [class*="Error"]');
  if (errorBoundary) {
    console.log('⚠️ Error-Boundary gefunden');
  }
  
  // Prüfe auf Loading-States
  const loadingElements = document.querySelectorAll('[class*="loading"], [class*="spinner"]');
  console.log('⏳ Loading-Elemente gefunden:', loadingElements.length);
}

// 6. Teste Karten-Interaktion
function testMapInteraction() {
  console.log('=== MAP INTERACTION TEST ===');
  
  // Suche nach Karten-Container
  const mapContainer = document.querySelector('.leaflet-container');
  if (mapContainer) {
    console.log('✅ Karten-Container gefunden');
    
    // Simuliere Klick auf Karte
    const clickEvent = new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
      view: window
    });
    
    mapContainer.dispatchEvent(clickEvent);
    console.log('🖱️ Klick auf Karte simuliert');
    
    // Prüfe ob Leaflet geladen ist
    if (window.L) {
      console.log('✅ Leaflet-Bibliothek verfügbar');
      console.log('🌍 Leaflet-Version:', window.L.version);
    } else {
      console.log('❌ Leaflet-Bibliothek nicht verfügbar');
    }
  } else {
    console.log('❌ Karten-Container nicht gefunden');
  }
}

// 7. Überprüfe Netzwerk-Anfragen
function debugNetworkRequests() {
  console.log('=== NETWORK REQUESTS DEBUG ===');
  
  // Prüfe auf laufende XHR-Anfragen
  const xhrRequests = performance.getEntriesByType('resource');
  const apiRequests = xhrRequests.filter(req => req.name.includes('/api/'));
  
  console.log('🌐 API-Anfragen gefunden:', apiRequests.length);
  apiRequests.forEach(req => {
    console.log('  -', req.name, '(', req.duration.toFixed(2), 'ms)');
  });
  
  // Prüfe auf WebSocket-Verbindungen
  if (window.WebSocket) {
    console.log('✅ WebSocket unterstützt');
  }
}

// 8. Teste spezifische Zürich-Daten
function testZurichSpecificData() {
  console.log('=== ZÜRICH SPECIFIC DATA TEST ===');
  
  // Suche nach Zürich-spezifischen Elementen
  const zurichElements = document.querySelectorAll('*');
  const zurichData = [];
  
  zurichElements.forEach(el => {
    if (el.textContent) {
      const text = el.textContent.toLowerCase();
      if (text.includes('zürich') || text.includes('küsnacht') || text.includes('seestrasse')) {
        zurichData.push({
          element: el.tagName,
          text: el.textContent.substring(0, 100)
        });
      }
    }
  });
  
  console.log('🇨🇭 Zürich-spezifische Daten gefunden:', zurichData.length);
  zurichData.slice(0, 5).forEach(data => {
    console.log('  -', data.element, ':', data.text);
  });
}

// 9. Hauptfunktion
async function runFinalMapMarkerDebug() {
  console.log('🚀 Starte finale Karten-Marker Debug-Analyse...');
  console.log('='.repeat(50));
  
  // 1. AuthContext überprüfen
  debugAuthContext();
  
  console.log('\n' + '='.repeat(50));
  
  // 2. TradeMap-Komponente überprüfen
  debugTradeMapComponent();
  
  console.log('\n' + '='.repeat(50));
  
  // 3. Trade-Daten überprüfen
  debugTradeData();
  
  console.log('\n' + '='.repeat(50));
  
  // 4. Koordinaten-Daten überprüfen
  debugCoordinateData();
  
  console.log('\n' + '='.repeat(50));
  
  // 5. JavaScript-Fehler überprüfen
  debugJavaScriptErrors();
  
  console.log('\n' + '='.repeat(50));
  
  // 6. Karten-Interaktion testen
  testMapInteraction();
  
  console.log('\n' + '='.repeat(50));
  
  // 7. Netzwerk-Anfragen überprüfen
  debugNetworkRequests();
  
  console.log('\n' + '='.repeat(50));
  
  // 8. Zürich-spezifische Daten testen
  testZurichSpecificData();
  
  console.log('\n' + '='.repeat(50));
  console.log('✅ Finale Karten-Marker Debug-Analyse abgeschlossen');
  console.log('\n💡 Nächste Schritte:');
  console.log('1. Überprüfe ob Koordinaten in den Trade-Daten vorhanden sind');
  console.log('2. Prüfe ob die TradeMap-Komponente die Daten korrekt erhält');
  console.log('3. Teste ob Leaflet die Marker korrekt rendert');
  console.log('4. Überprüfe ob die Zürich-Koordinaten (47.3769, 8.5417) verwendet werden');
}

// Führe Debug aus
runFinalMapMarkerDebug(); 