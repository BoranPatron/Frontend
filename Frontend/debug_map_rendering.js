// Debug-Skript für Karten-Rendering-Problem
// Analysiert warum Marker nicht auf der Karte angezeigt werden

console.log('🔍 Debug: Karten-Rendering-Problem Analyse gestartet');

// 1. Analysiere TradeMap-Komponente
function debugTradeMapComponent() {
  console.log('=== TRADEMAP KOMPONENTE ANALYSE ===');
  
  // Suche nach TradeMap-Elementen
  const tradeMapContainer = document.querySelector('.leaflet-container');
  console.log('Leaflet Container gefunden:', !!tradeMapContainer);
  
  // Suche nach Markern
  const markers = document.querySelectorAll('.leaflet-marker-icon, .custom-marker, .cluster-marker');
  console.log('Marker gefunden:', markers.length);
  
  // Suche nach Popups
  const popups = document.querySelectorAll('.leaflet-popup');
  console.log('Popups gefunden:', popups.length);
  
  // Prüfe CSS-Styles
  const mapStyles = window.getComputedStyle(tradeMapContainer || document.body);
  console.log('Karten-Styles geladen:', !!mapStyles);
  
  // Debug-Informationen
  const mapDebugInfo = {
    containerFound: !!tradeMapContainer,
    markersCount: markers.length,
    popupsCount: popups.length,
    stylesLoaded: !!mapStyles,
    windowSize: {
      width: window.innerWidth,
      height: window.innerHeight
    }
  };
  
  console.log('TradeMap Debug Info:', mapDebugInfo);
  return mapDebugInfo;
}

// 2. Analysiere Trade-Daten
function debugTradeData() {
  console.log('=== TRADE-DATEN ANALYSE ===');
  
  // Versuche, auf React-State zuzugreifen
  const reactDevTools = window.__REACT_DEVTOOLS_GLOBAL_HOOK__;
  console.log('React DevTools verfügbar:', !!reactDevTools);
  
  // Suche nach Trade-Daten in localStorage oder sessionStorage
  const storedTrades = localStorage.getItem('trades') || sessionStorage.getItem('trades');
  console.log('Gespeicherte Trade-Daten:', !!storedTrades);
  
  // Debug-Informationen
  const tradeDataInfo = {
    reactDevTools: !!reactDevTools,
    storedTrades: !!storedTrades,
    currentUrl: window.location.href
  };
  
  console.log('Trade-Daten Debug Info:', tradeDataInfo);
  return tradeDataInfo;
}

// 3. Teste Leaflet-Bibliothek
function debugLeafletLibrary() {
  console.log('=== LEAFLET-BIBLIOTHEK TEST ===');
  
  // Prüfe Leaflet-Verfügbarkeit
  const leafletAvailable = typeof L !== 'undefined';
  console.log('Leaflet verfügbar:', leafletAvailable);
  
  // Prüfe React-Leaflet
  const reactLeafletAvailable = typeof MapContainer !== 'undefined';
  console.log('React-Leaflet verfügbar:', reactLeafletAvailable);
  
  // Prüfe Marker-Klassen
  const markerClasses = [
    'leaflet-marker-icon',
    'leaflet-marker-shadow',
    'custom-marker',
    'cluster-marker'
  ];
  
  const availableClasses = markerClasses.filter(className => {
    const elements = document.querySelectorAll(`.${className}`);
    return elements.length > 0;
  });
  
  console.log('Verfügbare Marker-Klassen:', availableClasses);
  
  // Debug-Informationen
  const leafletDebugInfo = {
    leafletAvailable,
    reactLeafletAvailable,
    availableClasses,
    userAgent: navigator.userAgent
  };
  
  console.log('Leaflet Debug Info:', leafletDebugInfo);
  return leafletDebugInfo;
}

// 4. Analysiere Koordinaten-Daten
function debugCoordinateData() {
  console.log('=== KOORDINATEN-DATEN ANALYSE ===');
  
  // Suche nach Trade-Elementen in der DOM
  const tradeElements = document.querySelectorAll('[data-trade-id], [class*="trade"], [class*="gewerk"]');
  console.log('Trade-Elemente gefunden:', tradeElements.length);
  
  // Versuche, Koordinaten aus der DOM zu extrahieren
  const coordinates = [];
  tradeElements.forEach((element, index) => {
    const text = element.textContent || '';
    const latMatch = text.match(/latitude[:\s]*([\d.-]+)/i);
    const lngMatch = text.match(/longitude[:\s]*([\d.-]+)/i);
    
    if (latMatch && lngMatch) {
      coordinates.push({
        index,
        latitude: parseFloat(latMatch[1]),
        longitude: parseFloat(lngMatch[1])
      });
    }
  });
  
  console.log('Gefundene Koordinaten:', coordinates);
  
  // Debug-Informationen
  const coordinateDebugInfo = {
    tradeElements: tradeElements.length,
    coordinatesFound: coordinates.length,
    coordinates: coordinates
  };
  
  console.log('Koordinaten Debug Info:', coordinateDebugInfo);
  return coordinateDebugInfo;
}

// 5. Teste React-Komponenten-Rendering
function debugReactRendering() {
  console.log('=== REACT-RENDERING ANALYSE ===');
  
  // Suche nach React-Root
  const reactRoot = document.querySelector('#root');
  console.log('React Root gefunden:', !!reactRoot);
  
  // Suche nach React-Elementen
  const reactElements = document.querySelectorAll('[data-reactroot], [data-reactid]');
  console.log('React-Elemente gefunden:', reactElements.length);
  
  // Prüfe React DevTools
  const reactDevTools = window.__REACT_DEVTOOLS_GLOBAL_HOOK__;
  console.log('React DevTools verfügbar:', !!reactDevTools);
  
  // Debug-Informationen
  const reactDebugInfo = {
    reactRoot: !!reactRoot,
    reactElements: reactElements.length,
    reactDevTools: !!reactDevTools
  };
  
  console.log('React Debug Info:', reactDebugInfo);
  return reactDebugInfo;
}

// 6. Vollständige Analyse
async function runMapRenderingDebug() {
  console.log('🚀 Starte Karten-Rendering Debug-Analyse...');
  
  try {
    // 1. TradeMap-Komponente
    const mapInfo = debugTradeMapComponent();
    
    // 2. Trade-Daten
    const tradeDataInfo = debugTradeData();
    
    // 3. Leaflet-Bibliothek
    const leafletInfo = debugLeafletLibrary();
    
    // 4. Koordinaten-Daten
    const coordinateInfo = debugCoordinateData();
    
    // 5. React-Rendering
    const reactInfo = debugReactRendering();
    
    // Zusammenfassung
    console.log('\n📊 KARTEN-RENDERING DEBUG-ZUSAMMENFASSUNG:');
    console.log('✅ TradeMap Container:', mapInfo.containerFound);
    console.log('✅ Marker gefunden:', mapInfo.markersCount);
    console.log('✅ Leaflet verfügbar:', leafletInfo.leafletAvailable);
    console.log('✅ React-Leaflet verfügbar:', leafletInfo.reactLeafletAvailable);
    console.log('✅ Koordinaten gefunden:', coordinateInfo.coordinatesFound);
    console.log('✅ React Root:', reactInfo.reactRoot);
    
    // Problem-Analyse
    if (mapInfo.containerFound && mapInfo.markersCount === 0) {
      console.log('\n🔍 PROBLEM ERKANNT: Karte vorhanden, aber keine Marker');
      console.log('Mögliche Ursachen:');
      console.log('1. Keine Trade-Daten mit Koordinaten');
      console.log('2. Leaflet-Marker werden nicht gerendert');
      console.log('3. CSS-Probleme mit Marker-Sichtbarkeit');
      console.log('4. React-Komponente nicht korrekt aktualisiert');
    } else if (!mapInfo.containerFound) {
      console.log('\n🔍 PROBLEM ERKANNT: Karten-Container nicht gefunden');
      console.log('Mögliche Ursachen:');
      console.log('1. TradeMap-Komponente nicht geladen');
      console.log('2. React-Rendering fehlgeschlagen');
      console.log('3. CSS-Probleme mit Container-Sichtbarkeit');
    } else if (coordinateInfo.coordinatesFound === 0) {
      console.log('\n🔍 PROBLEM ERKANNT: Keine Koordinaten in den Daten');
      console.log('Mögliche Ursachen:');
      console.log('1. Trade-Daten haben keine Koordinaten');
      console.log('2. API liefert keine Koordinaten');
      console.log('3. Datenübertragung fehlgeschlagen');
    } else {
      console.log('\n✅ Karten-Rendering scheint normal zu funktionieren');
    }
    
    return {
      mapInfo,
      tradeDataInfo,
      leafletInfo,
      coordinateInfo,
      reactInfo
    };
    
  } catch (error) {
    console.error('❌ Fehler bei der Karten-Rendering Debug-Analyse:', error);
    return null;
  }
}

// 7. Automatische Ausführung
console.log('🔄 Starte automatische Karten-Rendering Debug-Analyse...');
runMapRenderingDebug().then(results => {
  console.log('✅ Karten-Rendering Debug-Analyse abgeschlossen');
  console.log('Ergebnisse:', results);
}).catch(error => {
  console.error('❌ Karten-Rendering Debug-Analyse fehlgeschlagen:', error);
});

// 8. Manuelle Ausführung ermöglichen
window.debugMapRendering = runMapRenderingDebug;
console.log('💡 Verwende window.debugMapRendering() für manuelle Ausführung');

// 9. Zusätzliche Hilfsfunktionen
window.debugTradeMapComponent = debugTradeMapComponent;
window.debugTradeData = debugTradeData;
window.debugLeafletLibrary = debugLeafletLibrary;
window.debugCoordinateData = debugCoordinateData;
window.debugReactRendering = debugReactRendering; 