// Debug-Skript für Marker-Positionierung
// Überprüft, ob Marker an ihrer geografischen Position fixiert sind

function debugMarkerPositioning() {
  console.log('🔧 Starte Marker-Positionierung Debug...');
  
  // 1. Überprüfe Leaflet-Bibliothek
  if (typeof L === 'undefined') {
    console.error('❌ Leaflet ist nicht geladen');
    return false;
  }
  
  console.log('✅ Leaflet ist verfügbar');
  
  // 2. Überprüfe TradeMap-Komponente
  function checkTradeMapComponent() {
    const tradeMapElements = document.querySelectorAll('[class*="TradeMap"]');
    console.log('🔍 Gefundene TradeMap-Elemente:', tradeMapElements.length);
    
    if (tradeMapElements.length > 0) {
      console.log('✅ TradeMap-Komponente gefunden');
      return true;
    } else {
      console.log('⚠️ TradeMap-Komponente nicht gefunden');
      return false;
    }
  }
  
  // 3. Überprüfe Leaflet-Container
  function checkLeafletContainer() {
    const leafletContainer = document.querySelector('.leaflet-container');
    if (leafletContainer) {
      console.log('✅ Leaflet-Container gefunden');
      
      // Überprüfe Marker im Container
      const markers = leafletContainer.querySelectorAll('.leaflet-marker-icon');
      console.log('🔍 Gefundene Marker:', markers.length);
      
      markers.forEach((marker, index) => {
        const transform = marker.style.transform;
        const className = marker.className;
        const position = marker.getBoundingClientRect();
        
        console.log(`📍 Marker ${index}:`, {
          transform,
          className,
          position: {
            left: position.left,
            top: position.top,
            width: position.width,
            height: position.height
          }
        });
        
        // Überprüfe, ob Marker korrekt positioniert ist
        if (transform && transform.includes('translate3d')) {
          console.log(`✅ Marker ${index} hat korrekte Transform-Eigenschaft`);
        } else {
          console.warn(`⚠️ Marker ${index} hat keine oder falsche Transform-Eigenschaft`);
        }
      });
      
      return markers.length;
    } else {
      console.log('⚠️ Leaflet-Container nicht gefunden');
      return 0;
    }
  }
  
  // 4. Teste Zoom-Verhalten
  function testZoomBehavior() {
    const map = document.querySelector('.leaflet-container');
    if (map) {
      console.log('🧪 Teste Zoom-Verhalten...');
      
      // Simuliere Zoom-Events
      const zoomInButton = map.querySelector('.leaflet-control-zoom-in');
      const zoomOutButton = map.querySelector('.leaflet-control-zoom-out');
      
      if (zoomInButton && zoomOutButton) {
        console.log('✅ Zoom-Controls gefunden');
        
        // Überprüfe Marker-Positionen vor und nach Zoom
        const markers = map.querySelectorAll('.leaflet-marker-icon');
        const initialPositions = Array.from(markers).map(marker => ({
          transform: marker.style.transform,
          position: marker.getBoundingClientRect()
        }));
        
        console.log('📍 Initiale Marker-Positionen:', initialPositions);
        
        // Simuliere Zoom-In
        setTimeout(() => {
          console.log('🔍 Nach Zoom-In Simulation...');
          const newPositions = Array.from(markers).map(marker => ({
            transform: marker.style.transform,
            position: marker.getBoundingClientRect()
          }));
          
          console.log('📍 Neue Marker-Positionen:', newPositions);
          
          // Vergleiche Positionen
          initialPositions.forEach((initial, index) => {
            const current = newPositions[index];
            if (initial.transform === current.transform) {
              console.log(`✅ Marker ${index} behält Position bei`);
            } else {
              console.warn(`⚠️ Marker ${index} hat sich bewegt`);
            }
          });
        }, 1000);
        
      } else {
        console.log('⚠️ Zoom-Controls nicht gefunden');
      }
    }
  }
  
  // 5. Überprüfe CSS-Regeln
  function checkCSSRules() {
    console.log('🎨 Überprüfe CSS-Regeln...');
    
    const styleSheets = Array.from(document.styleSheets);
    let markerCSSFound = false;
    
    styleSheets.forEach((sheet, index) => {
      try {
        const rules = Array.from(sheet.cssRules || sheet.rules);
        rules.forEach(rule => {
          if (rule.selectorText && rule.selectorText.includes('leaflet-marker-icon')) {
            console.log(`✅ Marker-CSS gefunden in Stylesheet ${index}:`, rule.selectorText);
            markerCSSFound = true;
          }
        });
      } catch (error) {
        // CORS-Fehler bei externen Stylesheets
      }
    });
    
    if (!markerCSSFound) {
      console.warn('⚠️ Keine spezifischen Marker-CSS-Regeln gefunden');
    }
  }
  
  // 6. Teste Marker-Erstellung
  function testMarkerCreation() {
    console.log('🧪 Teste Marker-Erstellung...');
    
    // Erstelle einen Test-Marker
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
          transform: translate(-50%, -100%);
        ">
          🧪
        </div>
      `,
      className: 'test-marker',
      iconSize: [32, 32],
      iconAnchor: [16, 32],
      popupAnchor: [0, -32]
    });
    
    console.log('✅ Test-Marker erstellt:', testIcon);
    
    // Überprüfe Icon-Eigenschaften
    console.log('📏 Icon-Eigenschaften:', {
      iconSize: testIcon.options.iconSize,
      iconAnchor: testIcon.options.iconAnchor,
      popupAnchor: testIcon.options.popupAnchor,
      className: testIcon.options.className
    });
    
    return testIcon;
  }
  
  // 7. Überprüfe Koordinaten
  function checkCoordinates() {
    console.log('🌍 Überprüfe Koordinaten...');
    
    // Zürich-Koordinaten als Referenz
    const zurichCoords = [47.3769, 8.5417];
    console.log('📍 Zürich-Koordinaten:', zurichCoords);
    
    // Überprüfe, ob Marker an diesen Koordinaten sind
    const markers = document.querySelectorAll('.leaflet-marker-icon');
    markers.forEach((marker, index) => {
      const transform = marker.style.transform;
      if (transform) {
        // Extrahiere Koordinaten aus Transform
        const match = transform.match(/translate3d\(([^,]+),\s*([^,]+)/);
        if (match) {
          const x = parseFloat(match[1]);
          const y = parseFloat(match[2]);
          console.log(`📍 Marker ${index} Position:`, { x, y });
        }
      }
    });
  }
  
  // 8. Hauptfunktion
  function runDebug() {
    console.log('🚀 Starte Marker-Positionierung Debug...');
    
    // Führe alle Checks durch
    const tradeMapFound = checkTradeMapComponent();
    const markerCount = checkLeafletContainer();
    const testIcon = testMarkerCreation();
    
    // Überprüfe CSS und Koordinaten
    checkCSSRules();
    checkCoordinates();
    
    // Teste Zoom-Verhalten
    testZoomBehavior();
    
    console.log('📊 Debug-Status:', {
      tradeMapFound,
      markerCount,
      testIconCreated: !!testIcon
    });
    
    // Empfehlungen
    if (!tradeMapFound) {
      console.warn('⚠️ TradeMap-Komponente nicht gefunden - möglicherweise nicht geladen');
    }
    
    if (markerCount === 0) {
      console.warn('⚠️ Keine Marker gefunden - möglicherweise noch nicht gerendert');
    }
    
    console.log('✅ Marker-Positionierung Debug abgeschlossen');
    return {
      success: true,
      tradeMapFound,
      markerCount,
      testIcon
    };
  }
  
  // 9. Event-Listener für dynamische Updates
  function addDebugListener() {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          const newMarkers = mutation.target.querySelectorAll('.leaflet-marker-icon');
          if (newMarkers.length > 0) {
            console.log('🔄 Neue Marker erkannt:', newMarkers.length);
            checkLeafletContainer();
          }
        }
      });
    });
    
    const leafletContainer = document.querySelector('.leaflet-container');
    if (leafletContainer) {
      observer.observe(leafletContainer, {
        childList: true,
        subtree: true
      });
      console.log('✅ Debug-Listener hinzugefügt');
    }
  }
  
  // 10. Führe Debug aus
  const result = runDebug();
  
  // 11. Füge Debug-Listener hinzu
  addDebugListener();
  
  // 12. Exponiere Funktionen global
  window.debugMarkerPositioning = runDebug;
  window.checkTradeMapComponent = checkTradeMapComponent;
  window.checkLeafletContainer = checkLeafletContainer;
  window.testMarkerCreation = testMarkerCreation;
  window.checkCoordinates = checkCoordinates;
  
  console.log('🎯 Marker-Positionierung Debug bereit');
  console.log('💡 Verwenden Sie window.debugMarkerPositioning() um den Debug erneut auszuführen');
  
  return result;
}

// Führe Debug aus
const debugResult = debugMarkerPositioning();

// Debug-Ausgabe
console.log('🔧 Marker-Positionierung Debug Ergebnis:', debugResult); 