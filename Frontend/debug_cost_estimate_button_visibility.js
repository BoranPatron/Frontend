// Debug-Skript für Kostenvoranschlag-Button Sichtbarkeitsproblem
// Führe dies in der Browser-Konsole aus

console.log('🔍 Debug: Kostenvoranschlag-Button Sichtbarkeitsproblem - Dienstleister-Ansicht');

// Prüfe Button-Sichtbarkeit
function debugButtonVisibility() {
  console.log('🔍 Prüfe Button-Sichtbarkeit...');
  
  // Suche nach allen "Kostenvoranschlag abgeben" Buttons
  const buttons = document.querySelectorAll('button');
  const costEstimateButtons = Array.from(buttons).filter(button => 
    button.textContent?.includes('Kostenvoranschlag abgeben')
  );
  
  console.log(`📊 Gefundene Kostenvoranschlag-Buttons: ${costEstimateButtons.length}`);
  
  costEstimateButtons.forEach((button, index) => {
    const computedStyle = window.getComputedStyle(button);
    const rect = button.getBoundingClientRect();
    
    console.log(`🔘 Button ${index + 1}:`, {
      text: button.textContent?.trim(),
      visible: button.offsetParent !== null,
      display: computedStyle.display,
      visibility: computedStyle.visibility,
      opacity: computedStyle.opacity,
      position: computedStyle.position,
      zIndex: computedStyle.zIndex,
      width: rect.width,
      height: rect.height,
      top: rect.top,
      left: rect.left,
      className: button.className,
      style: button.style.cssText,
      parentVisible: button.parentElement?.offsetParent !== null,
      parentDisplay: window.getComputedStyle(button.parentElement || document.body).display
    });
  });
  
  return costEstimateButtons;
}

// Prüfe Service Provider Status
function debugServiceProviderStatus() {
  console.log('🔍 Prüfe Service Provider Status...');
  
  const token = localStorage.getItem('token');
  const user = localStorage.getItem('user');
  
  if (user) {
    try {
      const userData = JSON.parse(user);
      const isServiceProvider = userData.user_type === 'service_provider';
      console.log('👤 User-Daten:', userData);
      console.log('👤 User-Type:', userData.user_type);
      console.log('👤 Service Provider:', isServiceProvider ? '✅ Ja' : '❌ Nein');
      return isServiceProvider;
    } catch (e) {
      console.error('❌ User-Daten sind kein gültiges JSON:', e);
    }
  }
  
  return false;
}

// Prüfe Trade-Daten und Angebote
function debugTradeAndQuoteData() {
  console.log('🔍 Prüfe Trade- und Angebot-Daten...');
  
  // Suche nach Trade-Karten
  const tradeCards = document.querySelectorAll('[class*="group bg-white/10"]');
  console.log(`📊 Gefundene Trade-Karten: ${tradeCards.length}`);
  
  tradeCards.forEach((card, index) => {
    const title = card.querySelector('h3')?.textContent;
    const description = card.querySelector('p')?.textContent;
    const buttons = card.querySelectorAll('button');
    const costEstimateButtons = Array.from(buttons).filter(button => 
      button.textContent?.includes('Kostenvoranschlag abgeben')
    );
    
    console.log(`📋 Trade ${index + 1}:`, {
      title,
      description,
      totalButtons: buttons.length,
      costEstimateButtons: costEstimateButtons.length,
      buttonTexts: Array.from(buttons).map(b => b.textContent?.trim())
    });
  });
  
  return tradeCards;
}

// Teste Button-Click mit verschiedenen Methoden
function testButtonClickMethods() {
  console.log('🔍 Teste verschiedene Button-Click-Methoden...');
  
  const buttons = document.querySelectorAll('button');
  const costEstimateButtons = Array.from(buttons).filter(button => 
    button.textContent?.includes('Kostenvoranschlag abgeben')
  );
  
  if (costEstimateButtons.length > 0) {
    const button = costEstimateButtons[0];
    
    console.log('🔘 Teste verschiedene Click-Methoden auf ersten Button...');
    
    // Methode 1: Direkter Click
    console.log('1. Direkter Button-Click...');
    try {
      button.click();
      console.log('✅ Direkter Click erfolgreich');
    } catch (error) {
      console.error('❌ Direkter Click fehlgeschlagen:', error);
    }
    
    // Methode 2: Event-Listener
    console.log('2. Event-Listener Click...');
    try {
      const clickEvent = new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        view: window
      });
      button.dispatchEvent(clickEvent);
      console.log('✅ Event-Listener Click erfolgreich');
    } catch (error) {
      console.error('❌ Event-Listener Click fehlgeschlagen:', error);
    }
    
    // Methode 3: Programmatischer Click
    console.log('3. Programmatischer Click...');
    try {
      const onClick = button.onclick;
      if (onClick) {
        onClick.call(button);
        console.log('✅ Programmatischer Click erfolgreich');
      } else {
        console.log('ℹ️ Kein onclick-Handler gefunden');
      }
    } catch (error) {
      console.error('❌ Programmatischer Click fehlgeschlagen:', error);
    }
    
    return true;
  } else {
    console.log('❌ Keine Kostenvoranschlag-Buttons gefunden');
    return false;
  }
}

// Prüfe CSS-Styles und Layout
function debugCSSAndLayout() {
  console.log('🔍 Prüfe CSS-Styles und Layout...');
  
  const buttons = document.querySelectorAll('button');
  const costEstimateButtons = Array.from(buttons).filter(button => 
    button.textContent?.includes('Kostenvoranschlag abgeben')
  );
  
  if (costEstimateButtons.length > 0) {
    const button = costEstimateButtons[0];
    const parent = button.parentElement;
    const grandParent = parent?.parentElement;
    
    console.log('🎨 Button-Styles:', {
      button: {
        display: window.getComputedStyle(button).display,
        visibility: window.getComputedStyle(button).visibility,
        opacity: window.getComputedStyle(button).opacity,
        position: window.getComputedStyle(button).position,
        zIndex: window.getComputedStyle(button).zIndex,
        overflow: window.getComputedStyle(button).overflow
      },
      parent: parent ? {
        display: window.getComputedStyle(parent).display,
        visibility: window.getComputedStyle(parent).visibility,
        opacity: window.getComputedStyle(parent).opacity,
        overflow: window.getComputedStyle(parent).overflow,
        height: window.getComputedStyle(parent).height,
        maxHeight: window.getComputedStyle(parent).maxHeight
      } : null,
      grandParent: grandParent ? {
        display: window.getComputedStyle(grandParent).display,
        visibility: window.getComputedStyle(grandParent).visibility,
        opacity: window.getComputedStyle(grandParent).opacity,
        overflow: window.getComputedStyle(grandParent).overflow
      } : null
    });
  }
}

// Umfassender Test
function runButtonVisibilityDebug() {
  console.log('🚀 Starte Button-Sichtbarkeits-Debug...');
  
  const results = {
    serviceProvider: debugServiceProviderStatus(),
    buttons: debugButtonVisibility(),
    trades: debugTradeAndQuoteData(),
    css: null
  };
  
  // Prüfe CSS und Layout
  debugCSSAndLayout();
  
  console.log('📊 Debug-Ergebnisse:', results);
  
  // Empfehlungen basierend auf Ergebnissen
  if (!results.serviceProvider) {
    console.error('💡 Problem: User ist kein Service Provider');
  }
  
  if (results.buttons.length === 0) {
    console.error('💡 Problem: Keine Kostenvoranschlag-Buttons gefunden');
  }
  
  if (results.trades.length === 0) {
    console.error('💡 Problem: Keine Trade-Karten gefunden');
  }
  
  // Teste Button-Click-Methoden
  console.log('🔘 Teste Button-Click-Methoden...');
  const clickResult = testButtonClickMethods();
  
  return {
    ...results,
    clickTest: clickResult
  };
}

// Automatischer Test
console.log('🔧 Debug-Funktionen verfügbar:');
console.log('- debugButtonVisibility() - Prüfe Button-Sichtbarkeit');
console.log('- debugServiceProviderStatus() - Prüfe Service Provider Status');
console.log('- debugTradeAndQuoteData() - Prüfe Trade- und Angebot-Daten');
console.log('- testButtonClickMethods() - Teste Button-Click-Methoden');
console.log('- debugCSSAndLayout() - Prüfe CSS und Layout');
console.log('- runButtonVisibilityDebug() - Umfassender Test');

// Führe automatischen Test aus
runButtonVisibilityDebug(); 