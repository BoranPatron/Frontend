// Debug-Skript für Trade-Datenfluss
// Analysiert die Datenübertragung zwischen Quotes-Seite und TradeMap-Komponente

console.log('🔍 Debug: Trade-Datenfluss Analyse gestartet');

// 1. Analysiere React-State und Props
function debugReactStateAndProps() {
  console.log('=== REACT-STATE UND PROPS ANALYSE ===');
  
  // Versuche, auf React DevTools zuzugreifen
  const reactDevTools = window.__REACT_DEVTOOLS_GLOBAL_HOOK__;
  console.log('React DevTools verfügbar:', !!reactDevTools);
  
  // Suche nach React-Komponenten in der DOM
  const reactComponents = document.querySelectorAll('[data-reactroot], [data-reactid]');
  console.log('React-Komponenten gefunden:', reactComponents.length);
  
  // Suche nach spezifischen TradeMap-Elementen
  const tradeMapElements = document.querySelectorAll('.leaflet-container, [class*="map"], [class*="trade"]');
  console.log('TradeMap-Elemente gefunden:', tradeMapElements.length);
  
  // Debug-Informationen
  const reactDebugInfo = {
    reactDevTools: !!reactDevTools,
    reactComponents: reactComponents.length,
    tradeMapElements: tradeMapElements.length,
    currentUrl: window.location.href
  };
  
  console.log('React State/Props Debug Info:', reactDebugInfo);
  return reactDebugInfo;
}

// 2. Analysiere Trade-Daten in der Quotes-Seite
function debugQuotesPageData() {
  console.log('=== QUOTES-SEITE DATEN ANALYSE ===');
  
  // Suche nach Trade-Listen-Elementen
  const tradeListElements = document.querySelectorAll('[class*="trade"], [class*="gewerk"], [data-trade-id]');
  console.log('Trade-Listen-Elemente gefunden:', tradeListElements.length);
  
  // Suche nach Trade-Daten in der DOM
  const tradeDataElements = document.querySelectorAll('tr, .trade-item, .gewerk-item');
  console.log('Trade-Daten-Elemente gefunden:', tradeDataElements.length);
  
  // Extrahiere Trade-Informationen aus der DOM
  const extractedTrades = [];
  tradeDataElements.forEach((element, index) => {
    const text = element.textContent || '';
    const titleMatch = text.match(/([A-Za-zÄäÖöÜüß\s]+)/);
    const idMatch = text.match(/ID[:\s]*(\d+)/i);
    const categoryMatch = text.match(/(Elektro|Sanitär|Heizung|Dach|Fenster|Boden|Wände|Fundament|Garten)/i);
    
    if (titleMatch || idMatch) {
      extractedTrades.push({
        index,
        title: titleMatch ? titleMatch[1].trim() : 'Unbekannt',
        id: idMatch ? parseInt(idMatch[1]) : null,
        category: categoryMatch ? categoryMatch[1] : 'Unbekannt',
        text: text.substring(0, 100) + '...'
      });
    }
  });
  
  console.log('Extrahierte Trade-Daten:', extractedTrades);
  
  // Debug-Informationen
  const quotesDebugInfo = {
    tradeListElements: tradeListElements.length,
    tradeDataElements: tradeDataElements.length,
    extractedTrades: extractedTrades.length,
    trades: extractedTrades
  };
  
  console.log('Quotes-Seite Debug Info:', quotesDebugInfo);
  return quotesDebugInfo;
}

// 3. Analysiere Koordinaten in den Trade-Daten
function debugTradeCoordinates() {
  console.log('=== TRADE-KOORDINATEN ANALYSE ===');
  
  // Suche nach Koordinaten in der DOM
  const coordinateElements = document.querySelectorAll('[class*="coordinate"], [class*="location"], [class*="address"]');
  console.log('Koordinaten-Elemente gefunden:', coordinateElements.length);
  
  // Extrahiere Koordinaten aus der DOM
  const coordinates = [];
  coordinateElements.forEach((element, index) => {
    const text = element.textContent || '';
    const latMatch = text.match(/latitude[:\s]*([\d.-]+)/i);
    const lngMatch = text.match(/longitude[:\s]*([\d.-]+)/i);
    const addressMatch = text.match(/([A-Za-zÄäÖöÜüß\s]+,\s*\d{5}\s+[A-Za-zÄäÖöÜüß\s]+)/);
    
    if (latMatch && lngMatch) {
      coordinates.push({
        index,
        latitude: parseFloat(latMatch[1]),
        longitude: parseFloat(lngMatch[1]),
        address: addressMatch ? addressMatch[1] : null
      });
    }
  });
  
  console.log('Gefundene Koordinaten:', coordinates);
  
  // Debug-Informationen
  const coordinateDebugInfo = {
    coordinateElements: coordinateElements.length,
    coordinatesFound: coordinates.length,
    coordinates: coordinates
  };
  
  console.log('Trade-Koordinaten Debug Info:', coordinateDebugInfo);
  return coordinateDebugInfo;
}

// 4. Teste Datenübertragung zur TradeMap
function debugDataTransferToTradeMap() {
  console.log('=== DATENÜBERTRAGUNG ZUR TRADEMAP ANALYSE ===');
  
  // Suche nach TradeMap-Container
  const tradeMapContainer = document.querySelector('.leaflet-container');
  console.log('TradeMap Container gefunden:', !!tradeMapContainer);
  
  // Suche nach Markern in der TradeMap
  const markers = document.querySelectorAll('.leaflet-marker-icon, .custom-marker, .cluster-marker');
  console.log('Marker in TradeMap gefunden:', markers.length);
  
  // Prüfe, ob TradeMap sichtbar ist
  const mapVisibility = tradeMapContainer ? 
    window.getComputedStyle(tradeMapContainer).display !== 'none' : false;
  console.log('TradeMap sichtbar:', mapVisibility);
  
  // Prüfe TradeMap-Größe
  const mapSize = tradeMapContainer ? {
    width: tradeMapContainer.offsetWidth,
    height: tradeMapContainer.offsetHeight
  } : null;
  console.log('TradeMap-Größe:', mapSize);
  
  // Debug-Informationen
  const transferDebugInfo = {
    containerFound: !!tradeMapContainer,
    markersCount: markers.length,
    mapVisibility,
    mapSize
  };
  
  console.log('Datenübertragung Debug Info:', transferDebugInfo);
  return transferDebugInfo;
}

// 5. Analysiere JavaScript-Fehler
function debugJavaScriptErrors() {
  console.log('=== JAVASCRIPT-FEHLER ANALYSE ===');
  
  // Prüfe auf JavaScript-Fehler
  const originalError = console.error;
  const errors = [];
  
  console.error = function(...args) {
    errors.push(args.join(' '));
    originalError.apply(console, args);
  };
  
  // Warte kurz und sammle Fehler
  setTimeout(() => {
    console.error = originalError;
    console.log('JavaScript-Fehler gefunden:', errors.length);
    errors.forEach((error, index) => {
      console.log(`Fehler ${index + 1}:`, error);
    });
  }, 1000);
  
  // Debug-Informationen
  const errorDebugInfo = {
    errorsFound: errors.length,
    errors: errors
  };
  
  console.log('JavaScript-Fehler Debug Info:', errorDebugInfo);
  return errorDebugInfo;
}

// 6. Vollständige Datenfluss-Analyse
async function runTradeDataFlowDebug() {
  console.log('🚀 Starte Trade-Datenfluss Debug-Analyse...');
  
  try {
    // 1. React-State und Props
    const reactInfo = debugReactStateAndProps();
    
    // 2. Quotes-Seite Daten
    const quotesInfo = debugQuotesPageData();
    
    // 3. Trade-Koordinaten
    const coordinateInfo = debugTradeCoordinates();
    
    // 4. Datenübertragung zur TradeMap
    const transferInfo = debugDataTransferToTradeMap();
    
    // 5. JavaScript-Fehler
    const errorInfo = debugJavaScriptErrors();
    
    // Zusammenfassung
    console.log('\n📊 TRADE-DATENFLUSS DEBUG-ZUSAMMENFASSUNG:');
    console.log('✅ React-Komponenten:', reactInfo.reactComponents);
    console.log('✅ Trade-Listen-Elemente:', quotesInfo.tradeListElements);
    console.log('✅ Extrahierte Trades:', quotesInfo.extractedTrades.length);
    console.log('✅ Koordinaten gefunden:', coordinateInfo.coordinatesFound);
    console.log('✅ TradeMap Container:', transferInfo.containerFound);
    console.log('✅ Marker in TradeMap:', transferInfo.markersCount);
    console.log('✅ TradeMap sichtbar:', transferInfo.mapVisibility);
    
    // Problem-Analyse
    if (quotesInfo.extractedTrades.length > 0 && transferInfo.markersCount === 0) {
      console.log('\n🔍 PROBLEM ERKANNT: Trades vorhanden, aber keine Marker auf der Karte');
      console.log('Mögliche Ursachen:');
      console.log('1. Koordinaten fehlen in den Trade-Daten');
      console.log('2. Datenübertragung zur TradeMap fehlgeschlagen');
      console.log('3. TradeMap-Komponente rendert Marker nicht');
      console.log('4. CSS-Probleme mit Marker-Sichtbarkeit');
    } else if (quotesInfo.extractedTrades.length === 0) {
      console.log('\n🔍 PROBLEM ERKANNT: Keine Trade-Daten gefunden');
      console.log('Mögliche Ursachen:');
      console.log('1. API liefert keine Trade-Daten');
      console.log('2. React-Komponente lädt Daten nicht');
      console.log('3. DOM-Elemente nicht korrekt gerendert');
    } else if (!transferInfo.containerFound) {
      console.log('\n🔍 PROBLEM ERKANNT: TradeMap-Container nicht gefunden');
      console.log('Mögliche Ursachen:');
      console.log('1. TradeMap-Komponente nicht geladen');
      console.log('2. React-Rendering fehlgeschlagen');
      console.log('3. CSS-Probleme mit Container-Sichtbarkeit');
    } else {
      console.log('\n✅ Trade-Datenfluss scheint normal zu funktionieren');
    }
    
    return {
      reactInfo,
      quotesInfo,
      coordinateInfo,
      transferInfo,
      errorInfo
    };
    
  } catch (error) {
    console.error('❌ Fehler bei der Trade-Datenfluss Debug-Analyse:', error);
    return null;
  }
}

// 7. Automatische Ausführung
console.log('🔄 Starte automatische Trade-Datenfluss Debug-Analyse...');
runTradeDataFlowDebug().then(results => {
  console.log('✅ Trade-Datenfluss Debug-Analyse abgeschlossen');
  console.log('Ergebnisse:', results);
}).catch(error => {
  console.error('❌ Trade-Datenfluss Debug-Analyse fehlgeschlagen:', error);
});

// 8. Manuelle Ausführung ermöglichen
window.debugTradeDataFlow = runTradeDataFlowDebug;
console.log('💡 Verwende window.debugTradeDataFlow() für manuelle Ausführung');

// 9. Zusätzliche Hilfsfunktionen
window.debugReactStateAndProps = debugReactStateAndProps;
window.debugQuotesPageData = debugQuotesPageData;
window.debugTradeCoordinates = debugTradeCoordinates;
window.debugDataTransferToTradeMap = debugDataTransferToTradeMap;
window.debugJavaScriptErrors = debugJavaScriptErrors; 