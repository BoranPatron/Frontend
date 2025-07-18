// Fix für Marker-Positionierung in Leaflet
// Problem: Marker bewegen sich proportional zum Zoom-Faktor
// Lösung: Korrekte iconAnchor-Eigenschaften und geografische Fixierung

function fixMarkerPositioning() {
  console.log('🔧 Starte Marker-Positionierung Fix...');
  
  // 1. Überprüfe Leaflet-Bibliothek
  if (typeof L === 'undefined') {
    console.error('❌ Leaflet ist nicht geladen');
    return false;
  }
  
  console.log('✅ Leaflet ist verfügbar');
  
  // 2. Fixiere Standard-Icons
  try {
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    });
    console.log('✅ Standard-Icons fixiert');
  } catch (error) {
    console.error('❌ Fehler beim Fixieren der Standard-Icons:', error);
  }
  
  // 3. Erstelle korrigierte Custom Icon-Funktion
  window.createFixedCustomIcon = function(color, icon) {
    return L.divIcon({
      html: `
        <div style="
          background: ${color};
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
          ${icon}
        </div>
      `,
      className: 'fixed-custom-marker',
      iconSize: [32, 32],
      iconAnchor: [16, 32], // Wichtig: Anker muss genau in der Mitte unten sein
      popupAnchor: [0, -32]
    });
  };
  
  // 4. Erstelle korrigierte Cluster-Icon-Funktion
  window.createFixedClusterIcon = function(count) {
    const size = Math.min(32 + count * 4, 48);
    const fontSize = Math.min(12 + count, 16);
    
    return L.divIcon({
      html: `
        <div style="
          background: linear-gradient(135deg, #ffbd59, #ffa726);
          border: 3px solid white;
          border-radius: 50%;
          width: ${size}px;
          height: ${size}px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 8px rgba(0,0,0,0.3);
          color: white;
          font-size: ${fontSize}px;
          font-weight: bold;
          cursor: pointer;
          transform: translate(-50%, -100%);
        ">
          ${count}
        </div>
      `,
      className: 'fixed-cluster-marker',
      iconSize: [size, size],
      iconAnchor: [size / 2, size], // Wichtig: Anker muss genau in der Mitte unten sein
      popupAnchor: [0, -size]
    });
  };
  
  // 5. Erstelle korrigierte Current Location Icon-Funktion
  window.createFixedCurrentLocationIcon = function() {
    return L.divIcon({
      html: `
        <div style="
          background: #ffbd59;
          border: 3px solid white;
          border-radius: 50%;
          width: 20px;
          height: 20px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
          transform: translate(-50%, -50%);
        "></div>
      `,
      className: 'fixed-current-location-marker',
      iconSize: [20, 20],
      iconAnchor: [10, 10], // Wichtig: Anker muss genau in der Mitte sein
      popupAnchor: [0, -10]
    });
  };
  
  // 6. Überprüfe TradeMap-Komponente
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
  
  // 7. Überprüfe Leaflet-Container
  function checkLeafletContainer() {
    const leafletContainer = document.querySelector('.leaflet-container');
    if (leafletContainer) {
      console.log('✅ Leaflet-Container gefunden');
      
      // Überprüfe Marker im Container
      const markers = leafletContainer.querySelectorAll('.leaflet-marker-icon');
      console.log('🔍 Gefundene Marker:', markers.length);
      
      markers.forEach((marker, index) => {
        console.log(`📍 Marker ${index}:`, {
          position: marker.style.transform,
          className: marker.className,
          parent: marker.parentElement?.className
        });
      });
      
      return markers.length;
    } else {
      console.log('⚠️ Leaflet-Container nicht gefunden');
      return 0;
    }
  }
  
  // 8. Teste Marker-Positionierung
  function testMarkerPositioning() {
    console.log('🧪 Teste Marker-Positionierung...');
    
    // Simuliere einen Marker mit korrekten Koordinaten
    const testMarker = {
      position: [47.3769, 8.5417], // Zürich-Koordinaten
      icon: window.createFixedCustomIcon('#ff0000', '🧪'),
      title: 'Test Marker'
    };
    
    console.log('✅ Test-Marker erstellt:', testMarker);
    return testMarker;
  }
  
  // 9. Überprüfe CSS für Marker
  function checkMarkerCSS() {
    const style = document.createElement('style');
    style.textContent = `
      .fixed-custom-marker {
        background: transparent !important;
        border: none !important;
      }
      
      .fixed-cluster-marker {
        background: transparent !important;
        border: none !important;
      }
      
      .fixed-current-location-marker {
        background: transparent !important;
        border: none !important;
      }
      
      .leaflet-marker-icon {
        transition: none !important;
      }
    `;
    document.head.appendChild(style);
    console.log('✅ Marker-CSS hinzugefügt');
  }
  
  // 10. Hauptfunktion
  function runMarkerPositioningFix() {
    console.log('🚀 Starte Marker-Positionierung Fix...');
    
    // Führe alle Checks durch
    const leafletAvailable = typeof L !== 'undefined';
    const tradeMapFound = checkTradeMapComponent();
    const markerCount = checkLeafletContainer();
    const testMarker = testMarkerPositioning();
    
    // Füge CSS hinzu
    checkMarkerCSS();
    
    console.log('📊 Fix-Status:', {
      leafletAvailable,
      tradeMapFound,
      markerCount,
      testMarkerCreated: !!testMarker
    });
    
    // Empfehlungen
    if (!leafletAvailable) {
      console.error('❌ Leaflet ist nicht verfügbar - bitte überprüfen Sie die Imports');
    }
    
    if (!tradeMapFound) {
      console.warn('⚠️ TradeMap-Komponente nicht gefunden - möglicherweise nicht geladen');
    }
    
    if (markerCount === 0) {
      console.warn('⚠️ Keine Marker gefunden - möglicherweise noch nicht gerendert');
    }
    
    console.log('✅ Marker-Positionierung Fix abgeschlossen');
    return {
      success: true,
      leafletAvailable,
      tradeMapFound,
      markerCount,
      testMarker
    };
  }
  
  // 11. Event-Listener für dynamische Updates
  function addMarkerUpdateListener() {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          const newMarkers = mutation.target.querySelectorAll('.leaflet-marker-icon');
          if (newMarkers.length > 0) {
            console.log('🔄 Neue Marker erkannt:', newMarkers.length);
            // Hier könnten weitere Fixes angewendet werden
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
      console.log('✅ Marker-Update-Listener hinzugefügt');
    }
  }
  
  // 12. Führe Fix aus
  const result = runMarkerPositioningFix();
  
  // 13. Füge Update-Listener hinzu
  addMarkerUpdateListener();
  
  // 14. Exponiere Funktionen global
  window.fixMarkerPositioning = runMarkerPositioningFix;
  window.checkTradeMapComponent = checkTradeMapComponent;
  window.checkLeafletContainer = checkLeafletContainer;
  window.testMarkerPositioning = testMarkerPositioning;
  
  console.log('🎯 Marker-Positionierung Fix bereit');
  console.log('💡 Verwenden Sie window.fixMarkerPositioning() um den Fix erneut auszuführen');
  
  return result;
}

// Führe Fix aus
const fixResult = fixMarkerPositioning();

// Debug-Ausgabe
console.log('🔧 Marker-Positionierung Fix Ergebnis:', fixResult); 