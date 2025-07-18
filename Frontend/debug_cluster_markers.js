// Debug-Skript für Cluster-Marker Positionierung und Interaktion
// Führen Sie dieses Skript in der Browser-Konsole aus, während Sie auf der Karte sind

function debugClusterMarkers() {
  console.log('🔍 Debugging Cluster-Marker...');
  
  // Überprüfe Leaflet-Bibliothek
  if (typeof L === 'undefined') {
    console.error('❌ Leaflet ist nicht geladen!');
    return;
  }
  
  console.log('✅ Leaflet ist verfügbar:', L.version);
  
  // Finde alle Cluster-Marker auf der Karte
  const clusterMarkers = document.querySelectorAll('.cluster-marker');
  console.log(`📊 Gefundene Cluster-Marker: ${clusterMarkers.length}`);
  
  clusterMarkers.forEach((marker, index) => {
    console.log(`\n📍 Cluster-Marker ${index + 1}:`);
    console.log('Element:', marker);
    console.log('Position:', marker.style.left, marker.style.top);
    console.log('Transform:', marker.style.transform);
    console.log('Z-Index:', marker.style.zIndex);
    
    // Überprüfe Icon-Container
    const iconContainer = marker.querySelector('.leaflet-marker-icon');
    if (iconContainer) {
      console.log('Icon-Container gefunden:', iconContainer);
      console.log('Icon-Size:', iconContainer.style.width, 'x', iconContainer.style.height);
      console.log('Icon-Anchor:', iconContainer.dataset.anchor);
      
      // Überprüfe Gewerk-Icons innerhalb des Clusters
      const tradeIcons = iconContainer.querySelectorAll('div[style*="position: absolute"]');
      console.log(`Gewerk-Icons im Cluster: ${tradeIcons.length}`);
      
      tradeIcons.forEach((icon, iconIndex) => {
        console.log(`  Icon ${iconIndex + 1}:`, icon.style.left, icon.style.top);
      });
    }
  });
}

function debugTradeIconsInClusters() {
  console.log('🎯 Debugging Gewerk-Icons in Clusters...');
  
  // Finde alle Cluster-Marker
  const clusterMarkers = document.querySelectorAll('.cluster-marker .leaflet-marker-icon');
  
  clusterMarkers.forEach((marker, index) => {
    console.log(`\n🎨 Cluster ${index + 1} Icons:`);
    
    // Überprüfe alle div-Elemente (Gewerk-Icons)
    const icons = marker.querySelectorAll('div');
    console.log(`Anzahl Icons: ${icons.length}`);
    
    icons.forEach((icon, iconIndex) => {
      const style = window.getComputedStyle(icon);
      console.log(`  Icon ${iconIndex + 1}:`);
      console.log('    Position:', style.position);
      console.log('    Left:', style.left);
      console.log('    Top:', style.top);
      console.log('    Width:', style.width);
      console.log('    Height:', style.height);
      console.log('    Transform:', style.transform);
      console.log('    Z-Index:', style.zIndex);
      
      // Überprüfe Icon-Inhalt
      if (icon.innerHTML.includes('svg')) {
        console.log('    Enthält SVG-Icon');
      } else if (icon.innerHTML.includes('div')) {
        console.log('    Enthält div-Icon');
      } else {
        console.log('    Icon-Inhalt:', icon.innerHTML.substring(0, 100));
      }
    });
  });
}

function testClusterMarkerPositioning() {
  console.log('🧪 Teste Cluster-Marker Positionierung...');
  
  // Simuliere Zoom-Events
  const map = window.map || document.querySelector('.leaflet-container')?._leaflet_map;
  
  if (map) {
    console.log('🗺️ Karte gefunden, teste Zoom-Events...');
    
    // Teste verschiedene Zoom-Level
    const testZooms = [8, 10, 12, 14, 16];
    
    testZooms.forEach((zoom, index) => {
      setTimeout(() => {
        console.log(`🔍 Teste Zoom-Level ${zoom}...`);
        map.setZoom(zoom);
        
        // Überprüfe Marker-Position nach Zoom
        setTimeout(() => {
          const clusterMarkers = document.querySelectorAll('.cluster-marker');
          clusterMarkers.forEach((marker, markerIndex) => {
            const rect = marker.getBoundingClientRect();
            console.log(`  Marker ${markerIndex + 1} bei Zoom ${zoom}:`, {
              x: rect.x,
              y: rect.y,
              width: rect.width,
              height: rect.height
            });
          });
        }, 500);
      }, index * 1000);
    });
  } else {
    console.error('❌ Karte nicht gefunden!');
  }
}

function debugClusterMarkerCSS() {
  console.log('🎨 Debugging Cluster-Marker CSS...');
  
  // Überprüfe CSS-Regeln für Cluster-Marker
  const clusterMarkers = document.querySelectorAll('.cluster-marker');
  
  clusterMarkers.forEach((marker, index) => {
    console.log(`\n🎨 Cluster-Marker ${index + 1} CSS:`);
    
    const computedStyle = window.getComputedStyle(marker);
    console.log('Marker-Styles:');
    console.log('  Position:', computedStyle.position);
    console.log('  Transform:', computedStyle.transform);
    console.log('  Z-Index:', computedStyle.zIndex);
    console.log('  Filter:', computedStyle.filter);
    
    // Überprüfe Icon-Container CSS
    const iconContainer = marker.querySelector('.leaflet-marker-icon');
    if (iconContainer) {
      const iconStyle = window.getComputedStyle(iconContainer);
      console.log('Icon-Container CSS:');
      console.log('  Position:', iconStyle.position);
      console.log('  Transform:', iconStyle.transform);
      console.log('  Width:', iconStyle.width);
      console.log('  Height:', iconStyle.height);
      console.log('  Background:', iconStyle.background);
      console.log('  Border:', iconStyle.border);
      console.log('  Border-Radius:', iconStyle.borderRadius);
      console.log('  Box-Shadow:', iconStyle.boxShadow);
    }
  });
}

function testClusterMarkerInteraction() {
  console.log('🖱️ Teste Cluster-Marker Interaktion...');
  
  // Finde alle Cluster-Marker
  const clusterMarkers = document.querySelectorAll('.cluster-marker');
  
  clusterMarkers.forEach((marker, index) => {
    console.log(`\n🖱️ Teste Interaktion mit Cluster-Marker ${index + 1}...`);
    
    // Simuliere Click-Event
    const clickEvent = new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
      view: window
    });
    
    marker.dispatchEvent(clickEvent);
    
    // Überprüfe Popup
    setTimeout(() => {
      const popup = document.querySelector('.leaflet-popup');
      if (popup) {
        console.log('✅ Popup geöffnet:', popup.textContent.substring(0, 100));
      } else {
        console.log('❌ Kein Popup gefunden');
      }
    }, 100);
  });
}

function debugTradeCategoriesInClusters() {
  console.log('🏷️ Debugging Gewerk-Kategorien in Clusters...');
  
  // Finde alle Cluster-Marker
  const clusterMarkers = document.querySelectorAll('.cluster-marker');
  
  clusterMarkers.forEach((marker, index) => {
    console.log(`\n🏷️ Cluster ${index + 1} Kategorien:`);
    
    // Überprüfe Icon-Container für Kategorien
    const iconContainer = marker.querySelector('.leaflet-marker-icon');
    if (iconContainer) {
      const icons = iconContainer.querySelectorAll('div');
      
      icons.forEach((icon, iconIndex) => {
        // Versuche Kategorie aus Icon zu erkennen
        let category = 'Unbekannt';
        
        if (icon.innerHTML.includes('⚡') || icon.innerHTML.includes('electric')) {
          category = 'Elektro';
        } else if (icon.innerHTML.includes('💧') || icon.innerHTML.includes('water')) {
          category = 'Sanitär';
        } else if (icon.innerHTML.includes('🔥') || icon.innerHTML.includes('heating')) {
          category = 'Heizung';
        } else if (icon.innerHTML.includes('🏠') || icon.innerHTML.includes('roof')) {
          category = 'Dach';
        } else if (icon.innerHTML.includes('🚪') || icon.innerHTML.includes('window')) {
          category = 'Fenster/Türen';
        } else if (icon.innerHTML.includes('🔧') || icon.innerHTML.includes('other')) {
          category = 'Sonstige';
        }
        
        console.log(`  Icon ${iconIndex + 1}: ${category}`);
        console.log('    Position:', icon.style.left, icon.style.top);
        console.log('    Größe:', icon.style.width, 'x', icon.style.height);
      });
    }
  });
}

// NEUE FUNKTION: Teste Hover-Tooltips für Cluster-Marker
function testClusterMarkerHoverTooltips() {
  console.log('🖱️ Teste Cluster-Marker Hover-Tooltips...');
  
  // Finde alle Cluster-Marker
  const clusterMarkers = document.querySelectorAll('.cluster-marker');
  console.log(`📊 Gefundene Cluster-Marker für Hover-Test: ${clusterMarkers.length}`);
  
  clusterMarkers.forEach((marker, index) => {
    console.log(`\n🖱️ Teste Hover-Tooltip für Cluster-Marker ${index + 1}...`);
    
    // Überprüfe Icon-Container
    const iconContainer = marker.querySelector('.leaflet-marker-icon > div');
    if (iconContainer) {
      console.log('Icon-Container gefunden:', iconContainer);
      
      // Überprüfe Tooltip-Attribute
      const title = iconContainer.getAttribute('title');
      const dataTooltip = iconContainer.getAttribute('data-tooltip');
      
      console.log('Tooltip-Attribute:');
      console.log('  Title:', title);
      console.log('  Data-Tooltip:', dataTooltip);
      
      // Simuliere Hover-Event
      const mouseEnterEvent = new MouseEvent('mouseenter', {
        bubbles: true,
        cancelable: true,
        view: window
      });
      
      const mouseLeaveEvent = new MouseEvent('mouseleave', {
        bubbles: true,
        cancelable: true,
        view: window
      });
      
      console.log('Simuliere Hover-Event...');
      iconContainer.dispatchEvent(mouseEnterEvent);
      
      // Überprüfe Tooltip nach kurzer Verzögerung
      setTimeout(() => {
        const tooltip = document.querySelector('.cluster-marker .leaflet-marker-icon > div::after');
        console.log('Tooltip nach Hover:', tooltip);
        
        // Simuliere Mouse-Leave
        setTimeout(() => {
          iconContainer.dispatchEvent(mouseLeaveEvent);
          console.log('Mouse-Leave simuliert');
        }, 1000);
      }, 500);
    } else {
      console.log('❌ Icon-Container nicht gefunden');
    }
  });
}

// NEUE FUNKTION: Überprüfe CSS-Tooltip-Regeln
function debugTooltipCSS() {
  console.log('🎨 Debugging Tooltip CSS-Regeln...');
  
  // Überprüfe CSS-Regeln für Tooltips
  const tooltipSelectors = [
    '.cluster-marker .leaflet-marker-icon > div::after',
    '.cluster-marker .leaflet-marker-icon > div::before'
  ];
  
  tooltipSelectors.forEach(selector => {
    console.log(`\n🔍 Überprüfe CSS-Regel: ${selector}`);
    
    // Versuche, die CSS-Regel zu finden
    const styleSheets = document.styleSheets;
    let ruleFound = false;
    
    for (let i = 0; i < styleSheets.length; i++) {
      try {
        const rules = styleSheets[i].cssRules || styleSheets[i].rules;
        for (let j = 0; j < rules.length; j++) {
          const rule = rules[j];
          if (rule.selectorText && rule.selectorText.includes(selector)) {
            console.log('✅ CSS-Regel gefunden:', rule.selectorText);
            console.log('CSS-Eigenschaften:', rule.style.cssText);
            ruleFound = true;
          }
        }
      } catch (e) {
        // CORS-Fehler bei externen Stylesheets ignorieren
      }
    }
    
    if (!ruleFound) {
      console.log('❌ CSS-Regel nicht gefunden');
    }
  });
}

// NEUE FUNKTION: Teste Marker-Verschiebung beim Zoomen
function testMarkerZoomShift() {
  console.log('🔍 Teste Marker-Verschiebung beim Zoomen...');
  
  const map = window.map || document.querySelector('.leaflet-container')?._leaflet_map;
  
  if (!map) {
    console.error('❌ Karte nicht gefunden!');
    return;
  }
  
  // Finde alle Marker
  const allMarkers = document.querySelectorAll('.leaflet-marker-icon');
  console.log(`📊 Gefundene Marker: ${allMarkers.length}`);
  
  // Speichere initiale Positionen
  const initialPositions = [];
  allMarkers.forEach((marker, index) => {
    const rect = marker.getBoundingClientRect();
    initialPositions.push({
      index,
      x: rect.x,
      y: rect.y,
      width: rect.width,
      height: rect.height
    });
  });
  
  console.log('📍 Initiale Marker-Positionen:', initialPositions);
  
  // Teste verschiedene Zoom-Level
  const testZooms = [8, 10, 12, 14, 16];
  let currentZoomIndex = 0;
  
  function testNextZoom() {
    if (currentZoomIndex >= testZooms.length) {
      console.log('✅ Zoom-Test abgeschlossen');
      return;
    }
    
    const zoom = testZooms[currentZoomIndex];
    console.log(`🔍 Teste Zoom-Level ${zoom}...`);
    
    map.setZoom(zoom);
    
    // Warte kurz, dann überprüfe Positionen
    setTimeout(() => {
      const currentPositions = [];
      allMarkers.forEach((marker, index) => {
        const rect = marker.getBoundingClientRect();
        currentPositions.push({
          index,
          x: rect.x,
          y: rect.y,
          width: rect.width,
          height: rect.height
        });
      });
      
      console.log(`📍 Marker-Positionen bei Zoom ${zoom}:`, currentPositions);
      
      // Vergleiche mit initialen Positionen
      currentPositions.forEach((current, index) => {
        const initial = initialPositions[index];
        if (initial) {
          const xDiff = Math.abs(current.x - initial.x);
          const yDiff = Math.abs(current.y - initial.y);
          
          if (xDiff > 5 || yDiff > 5) {
            console.warn(`⚠️ Marker ${index} hat sich verschoben bei Zoom ${zoom}:`, {
              xDiff: xDiff.toFixed(2),
              yDiff: yDiff.toFixed(2)
            });
          } else {
            console.log(`✅ Marker ${index} bleibt stabil bei Zoom ${zoom}`);
          }
        }
      });
      
      currentZoomIndex++;
      setTimeout(testNextZoom, 1000);
    }, 500);
  }
  
  testNextZoom();
}

// NEUE FUNKTION: Überprüfe CSS-Regeln für transform
function debugTransformCSS() {
  console.log('🎨 Debugging Transform CSS-Regeln...');
  
  // Überprüfe alle CSS-Regeln für Marker
  const markerSelectors = [
    '.leaflet-marker-icon',
    '.custom-marker .leaflet-marker-icon',
    '.cluster-marker .leaflet-marker-icon',
    '.current-location-marker .leaflet-marker-icon'
  ];
  
  markerSelectors.forEach(selector => {
    const elements = document.querySelectorAll(selector);
    console.log(`\n🔍 ${selector}: ${elements.length} Elemente gefunden`);
    
    elements.forEach((element, index) => {
      const style = window.getComputedStyle(element);
      console.log(`  Element ${index + 1}:`);
      console.log('    Transform:', style.transform);
      console.log('    Transform-Origin:', style.transformOrigin);
      console.log('    Position:', style.position);
      console.log('    Left:', style.left);
      console.log('    Top:', style.top);
      
      // Überprüfe auch inline styles
      console.log('    Inline Transform:', element.style.transform);
    });
  });
}

async function runClusterMarkerDebug() {
  console.log('🚀 Starte umfassendes Cluster-Marker Debug...');
  console.log('='.repeat(50));
  
  // Warte kurz, bis die Karte geladen ist
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Führe alle Debug-Funktionen aus
  debugClusterMarkers();
  await new Promise(resolve => setTimeout(resolve, 500));
  
  debugTradeIconsInClusters();
  await new Promise(resolve => setTimeout(resolve, 500));
  
  debugClusterMarkerCSS();
  await new Promise(resolve => setTimeout(resolve, 500));
  
  debugTransformCSS();
  await new Promise(resolve => setTimeout(resolve, 500));
  
  debugTradeCategoriesInClusters();
  await new Promise(resolve => setTimeout(resolve, 500));
  
  testClusterMarkerInteraction();
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // NEUE TESTS: Hover-Tooltips
  testClusterMarkerHoverTooltips();
  await new Promise(resolve => setTimeout(resolve, 500));
  
  debugTooltipCSS();
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // NEUE TESTS: JavaScript-basierte Hover-Tooltips
  testJavaScriptHoverTooltips();
  await new Promise(resolve => setTimeout(resolve, 500));
  
  debugJavaScriptTooltipCreation();
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Teste Marker-Verschiebung beim Zoomen
  testMarkerZoomShift();
  
  console.log('\n✅ Cluster-Marker Debug abgeschlossen!');
  console.log('\n📋 Zusammenfassung:');
  console.log('- Überprüfen Sie die Konsole für detaillierte Informationen');
  console.log('- Testen Sie das Zoomen der Karte');
  console.log('- Klicken Sie auf Cluster-Marker für Interaktionstests');
  console.log('- Überprüfen Sie die Positionierung der Gewerk-Icons');
  console.log('- Achten Sie auf Marker-Verschiebung beim Zoomen');
  console.log('- Testen Sie die Hover-Tooltips für Cluster-Marker');
}

// NEUE FUNKTION: Teste JavaScript-basierte Hover-Tooltips
function testJavaScriptHoverTooltips() {
  console.log('🖱️ Teste JavaScript-basierte Hover-Tooltips...');
  
  // Überprüfe Tooltip-Element
  const tooltip = document.getElementById('cluster-tooltip');
  console.log('Tooltip-Element gefunden:', !!tooltip);
  
  if (tooltip) {
    console.log('Tooltip-Styles:', {
      position: tooltip.style.position,
      zIndex: tooltip.style.zIndex,
      opacity: tooltip.style.opacity,
      visibility: tooltip.style.visibility
    });
  }
  
  // Finde alle Cluster-Marker
  const clusterMarkers = document.querySelectorAll('.cluster-marker-container');
  console.log(`📊 Gefundene Cluster-Marker für JavaScript-Hover-Test: ${clusterMarkers.length}`);
  
  clusterMarkers.forEach((marker, index) => {
    console.log(`\n🖱️ Teste JavaScript-Hover für Cluster-Marker ${index + 1}...`);
    
    // Überprüfe Tooltip-Attribute
    const tooltipContent = marker.getAttribute('data-tooltip');
    const tradesCount = marker.getAttribute('data-trades-count');
    
    console.log('Tooltip-Attribute:');
    console.log('  Data-Tooltip:', tooltipContent);
    console.log('  Data-Trades-Count:', tradesCount);
    
    // Simuliere Hover-Event
    const mouseEnterEvent = new Event('mouseenter', {
      bubbles: true,
      cancelable: true
    });
    
    const mouseLeaveEvent = new Event('mouseleave', {
      bubbles: true,
      cancelable: true
    });
    
    console.log('Simuliere JavaScript-Hover-Event...');
    marker.dispatchEvent(mouseEnterEvent);
    
    // Überprüfe Tooltip nach kurzer Verzögerung
    setTimeout(() => {
      const tooltipAfterHover = document.getElementById('cluster-tooltip');
      if (tooltipAfterHover) {
        console.log('Tooltip nach JavaScript-Hover:', {
          opacity: tooltipAfterHover.style.opacity,
          visibility: tooltipAfterHover.style.visibility,
          innerHTML: tooltipAfterHover.innerHTML.substring(0, 100)
        });
      } else {
        console.log('❌ Tooltip nicht gefunden nach Hover');
      }
      
      // Simuliere Mouse-Leave
      setTimeout(() => {
        marker.dispatchEvent(mouseLeaveEvent);
        console.log('JavaScript Mouse-Leave simuliert');
      }, 1000);
    }, 500);
  });
}

// NEUE FUNKTION: Überprüfe JavaScript-Tooltip-Erstellung
function debugJavaScriptTooltipCreation() {
  console.log('🎨 Debugging JavaScript-Tooltip-Erstellung...');
  
  // Überprüfe Tooltip-Element
  const tooltip = document.getElementById('cluster-tooltip');
  if (tooltip) {
    console.log('✅ Tooltip-Element existiert');
    console.log('Tooltip-Styles:', {
      position: tooltip.style.position,
      background: tooltip.style.background,
      color: tooltip.style.color,
      zIndex: tooltip.style.zIndex,
      opacity: tooltip.style.opacity,
      visibility: tooltip.style.visibility,
      maxWidth: tooltip.style.maxWidth,
      transform: tooltip.style.transform
    });
  } else {
    console.log('❌ Tooltip-Element nicht gefunden');
  }
  
  // Überprüfe Event-Listener
  const clusterMarkers = document.querySelectorAll('.cluster-marker-container');
  console.log(`📊 Cluster-Marker mit Event-Listenern: ${clusterMarkers.length}`);
  
  clusterMarkers.forEach((marker, index) => {
    console.log(`\n🔍 Cluster-Marker ${index + 1} Event-Listener:`);
    
    // Überprüfe gespeicherte Handler
    const enterHandler = marker._mouseEnterHandler;
    const leaveHandler = marker._mouseLeaveHandler;
    
    console.log('  Mouse-Enter Handler:', !!enterHandler);
    console.log('  Mouse-Leave Handler:', !!leaveHandler);
    
    // Überprüfe Event-Listener-Liste (nicht direkt zugänglich, aber wir können testen)
    console.log('  Event-Listener-Test: Verfügbar');
  });
}

// NEUE FUNKTION: Teste Cluster-Click-Verhalten
function testClusterClickBehavior() {
  console.log('🖱️ Teste Cluster-Click-Verhalten...');
  
  // Finde alle Cluster-Marker
  const clusterMarkers = document.querySelectorAll('.cluster-marker');
  console.log(`📊 Gefundene Cluster-Marker für Click-Test: ${clusterMarkers.length}`);
  
  clusterMarkers.forEach((marker, index) => {
    console.log(`\n🖱️ Teste Click-Verhalten für Cluster-Marker ${index + 1}...`);
    
    // Überprüfe Event-Listener
    const hasClickHandler = marker.onclick || marker._leaflet_events;
    console.log('Click-Handler vorhanden:', !!hasClickHandler);
    
    // Simuliere Click-Event
    const clickEvent = new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
      view: window
    });
    
    console.log('Simuliere Cluster-Click-Event...');
    marker.dispatchEvent(clickEvent);
    
    // Überprüfe nach kurzer Verzögerung, ob sich die Karte geändert hat
    setTimeout(() => {
      const map = window.map || document.querySelector('.leaflet-container')?._leaflet_map;
      if (map) {
        const currentZoom = map.getZoom();
        const currentCenter = map.getCenter();
        console.log('Karten-Zustand nach Cluster-Click:', {
          zoom: currentZoom,
          center: currentCenter
        });
      }
    }, 500);
  });
}

// NEUE FUNKTION: Überprüfe Cluster-Zoom-Verhalten
function debugClusterZoomBehavior() {
  console.log('🔍 Debugging Cluster-Zoom-Verhalten...');
  
  // Überprüfe Map-Referenz
  const map = window.map || document.querySelector('.leaflet-container')?._leaflet_map;
  if (map) {
    console.log('✅ Karte gefunden');
    console.log('Aktueller Zoom:', map.getZoom());
    console.log('Aktuelles Center:', map.getCenter());
  } else {
    console.log('❌ Karte nicht gefunden');
  }
  
  // Überprüfe Cluster-Marker
  const clusterMarkers = document.querySelectorAll('.cluster-marker');
  console.log(`📊 Cluster-Marker gefunden: ${clusterMarkers.length}`);
  
  clusterMarkers.forEach((marker, index) => {
    console.log(`\n🔍 Cluster-Marker ${index + 1}:`);
    
    // Überprüfe Position
    const rect = marker.getBoundingClientRect();
    console.log('Position:', {
      x: rect.x,
      y: rect.y,
      width: rect.width,
      height: rect.height
    });
    
    // Überprüfe Icon-Container
    const iconContainer = marker.querySelector('.leaflet-marker-icon');
    if (iconContainer) {
      console.log('Icon-Container gefunden');
      console.log('Icon-Size:', iconContainer.style.width, 'x', iconContainer.style.height);
    }
  });
}

// Exportiere Funktionen für manuelle Tests
window.debugClusterMarkers = debugClusterMarkers;
window.debugTradeIconsInClusters = debugTradeIconsInClusters;
window.testClusterMarkerPositioning = testClusterMarkerPositioning;
window.debugClusterMarkerCSS = debugClusterMarkerCSS;
window.testClusterMarkerInteraction = testClusterMarkerInteraction;
window.debugTradeCategoriesInClusters = debugTradeCategoriesInClusters;
window.testMarkerZoomShift = testMarkerZoomShift;
window.debugTransformCSS = debugTransformCSS;
window.testClusterMarkerHoverTooltips = testClusterMarkerHoverTooltips;
window.debugTooltipCSS = debugTooltipCSS;
window.runClusterMarkerDebug = runClusterMarkerDebug;
window.testJavaScriptHoverTooltips = testJavaScriptHoverTooltips;
window.debugJavaScriptTooltipCreation = debugJavaScriptTooltipCreation;
window.testClusterClickBehavior = testClusterClickBehavior;
window.debugClusterZoomBehavior = debugClusterZoomBehavior;

console.log('🔧 Cluster-Marker Debug-Skript geladen!');
console.log('Verfügbare Funktionen:');
console.log('- debugClusterMarkers()');
console.log('- debugTradeIconsInClusters()');
console.log('- testClusterMarkerPositioning()');
console.log('- debugClusterMarkerCSS()');
console.log('- testClusterMarkerInteraction()');
console.log('- debugTradeCategoriesInClusters()');
console.log('- testMarkerZoomShift() - NEU: Testet Marker-Verschiebung beim Zoomen');
console.log('- debugTransformCSS() - NEU: Überprüft Transform CSS-Regeln');
console.log('- testClusterMarkerHoverTooltips() - NEU: Testet Hover-Tooltips');
console.log('- debugTooltipCSS() - NEU: Überprüft Tooltip CSS-Regeln');
console.log('- testJavaScriptHoverTooltips() - NEU: Testet JavaScript-basierte Hover-Tooltips');
console.log('- debugJavaScriptTooltipCreation() - NEU: Überprüft JavaScript-Tooltip-Erstellung');
console.log('- testClusterClickBehavior() - NEU: Testet Cluster-Click-Verhalten');
console.log('- debugClusterZoomBehavior() - NEU: Überprüft Cluster-Zoom-Verhalten');
console.log('- runClusterMarkerDebug()'); 