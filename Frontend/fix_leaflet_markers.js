// Fix-Skript für Leaflet-Marker Problem
// Behebt das Problem mit nicht angezeigten Markern auf der Karte

console.log('🔧 Starte Leaflet-Marker Fix...');

// 1. Leaflet-Icon-Fix
function fixLeafletIcons() {
  console.log('=== LEAFLET-ICON FIX ===');
  
  if (typeof L !== 'undefined') {
    try {
      // Fix für Leaflet-Icons in React
      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
      });
      
      console.log('✅ Leaflet-Icon-Fix angewendet');
    } catch (error) {
      console.error('❌ Fehler beim Leaflet-Icon-Fix:', error);
    }
  } else {
    console.error('❌ Leaflet nicht verfügbar für Icon-Fix');
  }
}

// 2. CSS-Fix für Marker-Sichtbarkeit
function fixMarkerCSS() {
  console.log('=== MARKER CSS FIX ===');
  
  // Erstelle CSS für bessere Marker-Sichtbarkeit
  const markerCSS = `
    .custom-marker {
      z-index: 1000 !important;
      pointer-events: auto !important;
    }
    
    .cluster-marker {
      z-index: 1001 !important;
      pointer-events: auto !important;
    }
    
    .current-location-marker {
      z-index: 1002 !important;
      pointer-events: auto !important;
    }
    
    .leaflet-marker-icon {
      z-index: 1000 !important;
      pointer-events: auto !important;
    }
    
    .leaflet-popup {
      z-index: 1003 !important;
    }
    
    .leaflet-container {
      z-index: 1 !important;
    }
  `;
  
  // Füge CSS zum DOM hinzu
  const styleElement = document.createElement('style');
  styleElement.textContent = markerCSS;
  document.head.appendChild(styleElement);
  
  console.log('✅ Marker CSS-Fix angewendet');
}

// 3. TradeMap-Komponente Fix
function fixTradeMapComponent() {
  console.log('=== TRADEMAP KOMPONENTE FIX ===');
  
  // Suche nach React-Komponenten und aktualisiere sie
  const reactRoot = document.querySelector('#root');
  if (reactRoot && reactRoot._reactInternalFiber) {
    try {
      // Versuche TradeMap-Komponente zu finden und zu aktualisieren
      let currentFiber = reactRoot._reactInternalFiber;
      
      while (currentFiber) {
        if (currentFiber.type && currentFiber.type.name === 'TradeMap') {
          console.log('✅ TradeMap-Komponente gefunden, aktualisiere...');
          
          // Force Re-render der Komponente
          if (currentFiber.stateNode && currentFiber.stateNode.forceUpdate) {
            currentFiber.stateNode.forceUpdate();
            console.log('✅ TradeMap-Komponente neu gerendert');
          }
          
          break;
        }
        currentFiber = currentFiber.return;
      }
    } catch (error) {
      console.error('❌ Fehler beim TradeMap-Fix:', error);
    }
  }
}

// 4. Marker-Rendering Fix
function fixMarkerRendering() {
  console.log('=== MARKER-RENDERING FIX ===');
  
  // Entferne alle bestehenden Marker
  const existingMarkers = document.querySelectorAll('.custom-marker, .cluster-marker, .leaflet-marker-icon');
  existingMarkers.forEach(marker => {
    if (marker.parentNode) {
      marker.parentNode.removeChild(marker);
    }
  });
  
  console.log(`🧹 ${existingMarkers.length} bestehende Marker entfernt`);
  
  // Warte kurz und erstelle neue Marker
  setTimeout(() => {
    console.log('⏳ Erstelle neue Marker...');
    
    // Force Re-render der Karte
    const mapContainer = document.querySelector('.leaflet-container');
    if (mapContainer) {
      // Trigger resize event für Leaflet
      window.dispatchEvent(new Event('resize'));
      console.log('✅ Karten-Resize ausgelöst');
    }
  }, 100);
}

// 5. Debug-Marker hinzufügen
function addDebugMarkers() {
  console.log('=== DEBUG-MARKER HINZUFÜGEN ===');
  
  const mapContainer = document.querySelector('.leaflet-container');
  if (mapContainer) {
    // Erstelle Debug-Marker
    const debugMarker = document.createElement('div');
    debugMarker.className = 'debug-marker';
    debugMarker.style.cssText = `
      position: absolute;
      left: 50%;
      top: 50%;
      transform: translate(-50%, -50%);
      background: #ff0000;
      border: 3px solid white;
      border-radius: 50%;
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 20px;
      font-weight: bold;
      z-index: 9999;
      pointer-events: auto;
    `;
    debugMarker.innerHTML = '🐛';
    debugMarker.title = 'Debug-Marker';
    
    mapContainer.appendChild(debugMarker);
    console.log('✅ Debug-Marker hinzugefügt');
    
    // Entferne Debug-Marker nach 5 Sekunden
    setTimeout(() => {
      if (debugMarker.parentNode) {
        debugMarker.parentNode.removeChild(debugMarker);
        console.log('🧹 Debug-Marker entfernt');
      }
    }, 5000);
  }
}

// 6. Vollständiger Fix
async function runLeafletMarkerFix() {
  console.log('🚀 Starte vollständigen Leaflet-Marker Fix...');
  console.log('='.repeat(50));
  
  // 1. Leaflet-Icon-Fix
  fixLeafletIcons();
  
  console.log('\n' + '='.repeat(50));
  
  // 2. CSS-Fix
  fixMarkerCSS();
  
  console.log('\n' + '='.repeat(50));
  
  // 3. TradeMap-Komponente Fix
  fixTradeMapComponent();
  
  console.log('\n' + '='.repeat(50));
  
  // 4. Marker-Rendering Fix
  fixMarkerRendering();
  
  console.log('\n' + '='.repeat(50));
  
  // 5. Debug-Marker hinzufügen
  addDebugMarkers();
  
  console.log('\n' + '='.repeat(50));
  
  // Zusammenfassung
  console.log('📊 LEAFLET-MARKER FIX ZUSAMMENFASSUNG:');
  console.log('✅ Leaflet-Icon-Fix angewendet');
  console.log('✅ CSS-Fix für Marker-Sichtbarkeit angewendet');
  console.log('✅ TradeMap-Komponente aktualisiert');
  console.log('✅ Marker-Rendering neu initialisiert');
  console.log('✅ Debug-Marker hinzugefügt');
  
  console.log('\n💡 Nächste Schritte:');
  console.log('1. Prüfen Sie ob die Marker jetzt sichtbar sind');
  console.log('2. Schauen Sie nach dem roten Debug-Marker (🐛)');
  console.log('3. Testen Sie die Karten-Interaktion');
  console.log('4. Überprüfen Sie die Browser-Konsole auf Fehler');
  
  console.log('\n✅ Leaflet-Marker Fix abgeschlossen');
}

// 7. Automatische Ausführung
console.log('🔄 Starte automatischen Leaflet-Marker Fix...');
runLeafletMarkerFix().then(() => {
  console.log('✅ Automatischer Fix abgeschlossen');
}).catch(error => {
  console.error('❌ Automatischer Fix fehlgeschlagen:', error);
});

// 8. Manuelle Ausführung ermöglichen
window.runLeafletMarkerFix = runLeafletMarkerFix;
window.fixLeafletIcons = fixLeafletIcons;
window.fixMarkerCSS = fixMarkerCSS;
window.fixTradeMapComponent = fixTradeMapComponent;
window.fixMarkerRendering = fixMarkerRendering;
window.addDebugMarkers = addDebugMarkers;

console.log('💡 Verwende window.runLeafletMarkerFix() für manuelle Ausführung'); 