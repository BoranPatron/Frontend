// Debug-Skript für Leaflet-Marker Problem
// Analysiert warum Marker nicht auf der Karte angezeigt werden

console.log('🔍 Debug Leaflet-Marker Problem gestartet');

// 1. Überprüfe Leaflet-Bibliothek
function debugLeafletLibrary() {
  console.log('=== LEAFLET BIBLIOTHEK DEBUG ===');
  
  // Prüfe ob Leaflet geladen ist
  const leafletAvailable = typeof L !== 'undefined';
  console.log('Leaflet verfügbar:', leafletAvailable);
  
  if (leafletAvailable) {
    console.log('Leaflet Version:', L.version);
    console.log('Leaflet Icons verfügbar:', !!L.Icon);
    console.log('Leaflet DivIcon verfügbar:', !!L.divIcon);
  } else {
    console.error('❌ Leaflet ist nicht geladen!');
    console.log('💡 Mögliche Ursachen:');
    console.log('   1. Leaflet-Script nicht eingebunden');
    console.log('   2. Netzwerk-Probleme beim Laden');
    console.log('   3. JavaScript-Fehler beim Laden');
  }
  
  return leafletAvailable;
}

// 2. Überprüfe React-Leaflet
function debugReactLeaflet() {
  console.log('=== REACT-LEAFLET DEBUG ===');
  
  // Prüfe ob React-Leaflet Komponenten verfügbar sind
  const reactLeafletAvailable = typeof MapContainer !== 'undefined';
  console.log('React-Leaflet verfügbar:', reactLeafletAvailable);
  
  if (reactLeafletAvailable) {
    console.log('MapContainer verfügbar:', typeof MapContainer);
    console.log('Marker verfügbar:', typeof Marker);
    console.log('Popup verfügbar:', typeof Popup);
  } else {
    console.error('❌ React-Leaflet ist nicht geladen!');
  }
  
  return reactLeafletAvailable;
}

// 3. Überprüfe Karten-Container
function debugMapContainer() {
  console.log('=== KARTEN-CONTAINER DEBUG ===');
  
  // Suche nach Leaflet-Container
  const leafletContainer = document.querySelector('.leaflet-container');
  console.log('Leaflet-Container gefunden:', !!leafletContainer);
  
  if (leafletContainer) {
    console.log('Container-Größe:', {
      width: leafletContainer.offsetWidth,
      height: leafletContainer.offsetHeight,
      clientWidth: leafletContainer.clientWidth,
      clientHeight: leafletContainer.clientHeight
    });
    
    // Prüfe CSS-Styles
    const styles = window.getComputedStyle(leafletContainer);
    console.log('Container-Styles:', {
      display: styles.display,
      position: styles.position,
      visibility: styles.visibility,
      opacity: styles.opacity,
      zIndex: styles.zIndex
    });
    
    // Prüfe ob Container sichtbar ist
    const isVisible = leafletContainer.offsetWidth > 0 && leafletContainer.offsetHeight > 0;
    console.log('Container sichtbar:', isVisible);
  } else {
    console.error('❌ Leaflet-Container nicht gefunden!');
  }
  
  return !!leafletContainer;
}

// 4. Überprüfe Marker-Elemente
function debugMarkerElements() {
  console.log('=== MARKER-ELEMENTE DEBUG ===');
  
  // Suche nach verschiedenen Marker-Typen
  const customMarkers = document.querySelectorAll('.custom-marker');
  const clusterMarkers = document.querySelectorAll('.cluster-marker');
  const leafletMarkers = document.querySelectorAll('.leaflet-marker-icon');
  const currentLocationMarkers = document.querySelectorAll('.current-location-marker');
  
  console.log('Marker gefunden:', {
    customMarkers: customMarkers.length,
    clusterMarkers: clusterMarkers.length,
    leafletMarkers: leafletMarkers.length,
    currentLocationMarkers: currentLocationMarkers.length
  });
  
  // Prüfe CSS-Styles der Marker
  if (customMarkers.length > 0) {
    const firstMarker = customMarkers[0];
    const styles = window.getComputedStyle(firstMarker);
    console.log('Erster Custom-Marker Styles:', {
      display: styles.display,
      position: styles.position,
      visibility: styles.visibility,
      opacity: styles.opacity,
      width: styles.width,
      height: styles.height,
      zIndex: styles.zIndex
    });
  }
  
  // Prüfe ob Marker im DOM sind aber nicht sichtbar
  const allMarkers = [...customMarkers, ...clusterMarkers, ...leafletMarkers];
  console.log('Gesamtanzahl Marker im DOM:', allMarkers.length);
  
  return allMarkers.length;
}

// 5. Überprüfe TradeMap-Komponente
function debugTradeMapComponent() {
  console.log('=== TRADEMAP-KOMPONENTE DEBUG ===');
  
  // Suche nach React-Komponenten
  const reactRoot = document.querySelector('#root');
  if (reactRoot && reactRoot._reactInternalFiber) {
    console.log('✅ React-Root gefunden');
    
    try {
      // Versuche TradeMap-Komponente zu finden
      let currentFiber = reactRoot._reactInternalFiber;
      let tradeMapFound = false;
      
      while (currentFiber && !tradeMapFound) {
        if (currentFiber.type && currentFiber.type.name === 'TradeMap') {
          console.log('✅ TradeMap-Komponente gefunden');
          console.log('Props:', currentFiber.memoizedProps);
          
          const props = currentFiber.memoizedProps;
          if (props) {
            console.log('TradeMap Props:', {
              tradesCount: props.trades?.length || 0,
              currentLocation: props.currentLocation,
              radiusKm: props.radiusKm,
              showAcceptedTrades: props.showAcceptedTrades
            });
            
            // Prüfe Trade-Daten
            if (props.trades && props.trades.length > 0) {
              console.log('Erste Trade-Daten:', props.trades[0]);
              console.log('Koordinaten vorhanden:', {
                address_latitude: !!props.trades[0].address_latitude,
                address_longitude: !!props.trades[0].address_longitude,
                latitude: !!props.trades[0].latitude,
                longitude: !!props.trades[0].longitude
              });
            }
          }
          
          tradeMapFound = true;
        }
        currentFiber = currentFiber.return;
      }
      
      if (!tradeMapFound) {
        console.log('⚠️ TradeMap-Komponente nicht gefunden');
      }
    } catch (error) {
      console.error('❌ Fehler beim Zugriff auf React-Komponenten:', error);
    }
  } else {
    console.log('❌ React-Root nicht gefunden');
  }
}

// 6. Teste Marker-Rendering
function testMarkerRendering() {
  console.log('=== MARKER-RENDERING TEST ===');
  
  // Versuche einen Test-Marker zu erstellen
  if (typeof L !== 'undefined') {
    try {
      // Erstelle Test-Icon
      const testIcon = L.divIcon({
        html: `
          <div style="
            background: #ff0000;
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
          ">
            🧪
          </div>
        `,
        className: 'test-marker',
        iconSize: [32, 32],
        iconAnchor: [16, 32]
      });
      
      console.log('✅ Test-Icon erstellt:', testIcon);
      
      // Suche nach Karten-Container
      const mapContainer = document.querySelector('.leaflet-container');
      if (mapContainer) {
        // Versuche Marker zum DOM hinzuzufügen
        const testMarkerDiv = document.createElement('div');
        testMarkerDiv.className = 'test-marker';
        testMarkerDiv.style.position = 'absolute';
        testMarkerDiv.style.left = '50%';
        testMarkerDiv.style.top = '50%';
        testMarkerDiv.style.transform = 'translate(-50%, -50%)';
        testMarkerDiv.style.zIndex = '1000';
        testMarkerDiv.innerHTML = `
          <div style="
            background: #ff0000;
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
          ">
            🧪
          </div>
        `;
        
        mapContainer.appendChild(testMarkerDiv);
        console.log('✅ Test-Marker zum DOM hinzugefügt');
        
        // Entferne Test-Marker nach 3 Sekunden
        setTimeout(() => {
          if (testMarkerDiv.parentNode) {
            testMarkerDiv.parentNode.removeChild(testMarkerDiv);
            console.log('🧹 Test-Marker entfernt');
          }
        }, 3000);
      }
    } catch (error) {
      console.error('❌ Fehler beim Test-Marker-Rendering:', error);
    }
  } else {
    console.error('❌ Leaflet nicht verfügbar für Test');
  }
}

// 7. Überprüfe CSS-Probleme
function debugCSSIssues() {
  console.log('=== CSS-PROBLEME DEBUG ===');
  
  // Prüfe ob CSS-Dateien geladen sind
  const leafletCSS = document.querySelector('link[href*="leaflet"]');
  console.log('Leaflet CSS geladen:', !!leafletCSS);
  
  // Prüfe Custom CSS
  const customMarkerCSS = document.querySelector('style, link[href*="custom"]');
  console.log('Custom CSS vorhanden:', !!customMarkerCSS);
  
  // Prüfe CSS-Konflikte
  const conflictingStyles = document.querySelectorAll('style, link[rel="stylesheet"]');
  console.log('CSS-Dateien geladen:', conflictingStyles.length);
  
  // Prüfe z-index Konflikte
  const highZIndexElements = document.querySelectorAll('*');
  let maxZIndex = 0;
  highZIndexElements.forEach(el => {
    const zIndex = parseInt(window.getComputedStyle(el).zIndex);
    if (zIndex > maxZIndex) {
      maxZIndex = zIndex;
    }
  });
  console.log('Höchster z-index:', maxZIndex);
}

// 8. Vollständige Analyse
async function runLeafletMarkerDebug() {
  console.log('🚀 Starte Leaflet-Marker Debug-Analyse...');
  console.log('='.repeat(50));
  
  // 1. Leaflet-Bibliothek
  const leafletAvailable = debugLeafletLibrary();
  
  console.log('\n' + '='.repeat(50));
  
  // 2. React-Leaflet
  const reactLeafletAvailable = debugReactLeaflet();
  
  console.log('\n' + '='.repeat(50));
  
  // 3. Karten-Container
  const containerAvailable = debugMapContainer();
  
  console.log('\n' + '='.repeat(50));
  
  // 4. Marker-Elemente
  const markerCount = debugMarkerElements();
  
  console.log('\n' + '='.repeat(50));
  
  // 5. TradeMap-Komponente
  debugTradeMapComponent();
  
  console.log('\n' + '='.repeat(50));
  
  // 6. Marker-Rendering Test
  testMarkerRendering();
  
  console.log('\n' + '='.repeat(50));
  
  // 7. CSS-Probleme
  debugCSSIssues();
  
  console.log('\n' + '='.repeat(50));
  
  // Zusammenfassung
  console.log('📊 LEAFLET-MARKER DEBUG-ZUSAMMENFASSUNG:');
  console.log('✅ Leaflet verfügbar:', leafletAvailable);
  console.log('✅ React-Leaflet verfügbar:', reactLeafletAvailable);
  console.log('✅ Karten-Container verfügbar:', containerAvailable);
  console.log('✅ Marker im DOM:', markerCount);
  
  // Problem-Analyse
  if (!leafletAvailable) {
    console.log('\n🔍 PROBLEM ERKANNT: Leaflet nicht geladen');
    console.log('💡 Lösungsansätze:');
    console.log('   1. Leaflet-Script überprüfen');
    console.log('   2. Netzwerk-Verbindung prüfen');
    console.log('   3. JavaScript-Fehler beheben');
  } else if (!reactLeafletAvailable) {
    console.log('\n🔍 PROBLEM ERKANNT: React-Leaflet nicht geladen');
    console.log('💡 Lösungsansätze:');
    console.log('   1. React-Leaflet Installation prüfen');
    console.log('   2. Import-Statements überprüfen');
    console.log('   3. Build-Prozess prüfen');
  } else if (!containerAvailable) {
    console.log('\n🔍 PROBLEM ERKANNT: Karten-Container nicht gefunden');
    console.log('💡 Lösungsansätze:');
    console.log('   1. React-Komponente überprüfen');
    console.log('   2. CSS-Styles prüfen');
    console.log('   3. DOM-Struktur analysieren');
  } else if (markerCount === 0) {
    console.log('\n🔍 PROBLEM ERKANNT: Keine Marker im DOM');
    console.log('💡 Lösungsansätze:');
    console.log('   1. Trade-Daten überprüfen');
    console.log('   2. Marker-Rendering-Logik prüfen');
    console.log('   3. React-State analysieren');
  } else {
    console.log('\n✅ Alle Komponenten verfügbar, Marker sollten sichtbar sein');
  }
  
  console.log('\n✅ Leaflet-Marker Debug-Analyse abgeschlossen');
}

// Funktionen global verfügbar machen
window.debugLeafletLibrary = debugLeafletLibrary;
window.debugReactLeaflet = debugReactLeaflet;
window.debugMapContainer = debugMapContainer;
window.debugMarkerElements = debugMarkerElements;
window.debugTradeMapComponent = debugTradeMapComponent;
window.testMarkerRendering = testMarkerRendering;
window.debugCSSIssues = debugCSSIssues;
window.runLeafletMarkerDebug = runLeafletMarkerDebug;

console.log('✅ Leaflet-Marker Debug-Skript geladen. Verwenden Sie:');
console.log('   runLeafletMarkerDebug() - Vollständige Analyse');
console.log('   debugLeafletLibrary() - Leaflet-Bibliothek prüfen');
console.log('   debugMarkerElements() - Marker-Elemente prüfen');
console.log('   testMarkerRendering() - Marker-Rendering testen'); 