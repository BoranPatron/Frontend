// Finales Debug-Skript für Kostenvoranschlag-Button Problem
// Führe dies in der Browser-Konsole aus

console.log('🔍 Debug: Kostenvoranschlag-Button Problem - Finale Diagnose');

// Prüfe AuthContext
function debugAuthContext() {
  console.log('🔍 Prüfe AuthContext...');
  
  // Prüfe localStorage
  const token = localStorage.getItem('token');
  const user = localStorage.getItem('user');
  
  console.log('📊 localStorage Status:');
  console.log('- Token:', token ? '✅ Vorhanden' : '❌ Fehlt');
  console.log('- User:', user ? '✅ Vorhanden' : '❌ Fehlt');
  
  if (user) {
    try {
      const userData = JSON.parse(user);
      console.log('👤 User-Daten:', userData);
      console.log('👤 User-Type:', userData.user_type);
      console.log('👤 User-ID:', userData.id);
    } catch (e) {
      console.error('❌ User-Daten sind kein gültiges JSON:', e);
    }
  }
  
  return {
    token: !!token,
    user: !!user,
    userData: user ? JSON.parse(user) : null
  };
}

// Prüfe Service Provider Status
function debugServiceProviderStatus() {
  console.log('🔍 Prüfe Service Provider Status...');
  
  const auth = debugAuthContext();
  
  if (auth.userData) {
    const isServiceProvider = auth.userData.user_type === 'service_provider';
    console.log('👤 Service Provider:', isServiceProvider ? '✅ Ja' : '❌ Nein');
    return isServiceProvider;
  }
  
  return false;
}

// Prüfe Button-Elemente
function debugButtonElements() {
  console.log('🔍 Prüfe Button-Elemente...');
  
  // Suche nach allen "Kostenvoranschlag abgeben" Buttons
  const buttons = document.querySelectorAll('button');
  const costEstimateButtons = Array.from(buttons).filter(button => 
    button.textContent?.includes('Kostenvoranschlag abgeben')
  );
  
  console.log(`📊 Gefundene Kostenvoranschlag-Buttons: ${costEstimateButtons.length}`);
  
  costEstimateButtons.forEach((button, index) => {
    console.log(`🔘 Button ${index + 1}:`, {
      text: button.textContent?.trim(),
      disabled: button.disabled,
      visible: button.offsetParent !== null,
      clickable: button.style.pointerEvents !== 'none',
      className: button.className,
      onClick: button.onclick ? 'Vorhanden' : 'Fehlt'
    });
  });
  
  return costEstimateButtons;
}

// Prüfe Trade-Daten
function debugTradeData() {
  console.log('🔍 Prüfe Trade-Daten...');
  
  // Suche nach Trade-Karten
  const tradeCards = document.querySelectorAll('[class*="group bg-white/10"]');
  console.log(`📊 Gefundene Trade-Karten: ${tradeCards.length}`);
  
  tradeCards.forEach((card, index) => {
    const title = card.querySelector('h3')?.textContent;
    const description = card.querySelector('p')?.textContent;
    const button = card.querySelector('button');
    
    console.log(`📋 Trade ${index + 1}:`, {
      title,
      description,
      hasButton: !!button,
      buttonText: button?.textContent?.trim()
    });
  });
  
  return tradeCards;
}

// Teste Button-Click mit Event-Listener
function testButtonClickWithListener() {
  console.log('🔍 Teste Button-Click mit Event-Listener...');
  
  const buttons = document.querySelectorAll('button');
  const costEstimateButtons = Array.from(buttons).filter(button => 
    button.textContent?.includes('Kostenvoranschlag abgeben')
  );
  
  if (costEstimateButtons.length > 0) {
    console.log('🔘 Teste Klick auf ersten Button mit Event-Listener...');
    
    const button = costEstimateButtons[0];
    
    // Füge Event-Listener hinzu
    const clickHandler = (e) => {
      console.log('🖱️ Button-Click erkannt!');
      console.log('Event:', e);
      console.log('Target:', e.target);
      console.log('Current Target:', e.currentTarget);
    };
    
    button.addEventListener('click', clickHandler);
    
    // Simuliere Click-Event
    const clickEvent = new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
      view: window
    });
    
    console.log('🖱️ Sende Click-Event...');
    button.dispatchEvent(clickEvent);
    
    // Entferne Event-Listener
    button.removeEventListener('click', clickHandler);
    
    // Prüfe ob Modal geöffnet wurde
    setTimeout(() => {
      const modal = document.querySelector('[class*="fixed inset-0"]');
      console.log('📋 Modal geöffnet:', !!modal);
      
      if (modal) {
        console.log('✅ Modal erfolgreich geöffnet');
      } else {
        console.log('❌ Modal nicht geöffnet');
      }
    }, 100);
    
    return true;
  } else {
    console.log('❌ Keine Kostenvoranschlag-Buttons gefunden');
    return false;
  }
}

// Prüfe React-Komponenten
function debugReactComponents() {
  console.log('🔍 Prüfe React-Komponenten...');
  
  // Prüfe ob React DevTools verfügbar sind
  const hasReactDevTools = window.__REACT_DEVTOOLS_GLOBAL_HOOK__;
  console.log('⚛️ React DevTools verfügbar:', hasReactDevTools ? 'Ja' : 'Nein');
  
  // Prüfe aktuelle URL
  console.log('🌐 Aktuelle URL:', window.location.href);
  console.log('📍 Pathname:', window.location.pathname);
  
  // Prüfe ob wir auf der Quotes-Seite sind
  const isQuotesPage = window.location.pathname === '/quotes';
  console.log('📄 Auf Quotes-Seite:', isQuotesPage);
  
  return {
    hasReactDevTools: !!hasReactDevTools,
    isQuotesPage
  };
}

// Prüfe State-Variablen
function debugStateVariables() {
  console.log('🔍 Prüfe State-Variablen...');
  
  // Versuche auf React-Komponenten zuzugreifen
  const reactRoot = document.querySelector('#root');
  if (reactRoot) {
    console.log('✅ React Root gefunden');
    console.log('📦 Root Children:', reactRoot.children.length);
  } else {
    console.log('❌ React Root nicht gefunden');
  }
  
  return !!reactRoot;
}

// Teste direkten Button-Click
function testDirectButtonClick() {
  console.log('🔍 Teste direkten Button-Click...');
  
  const buttons = document.querySelectorAll('button');
  const costEstimateButtons = Array.from(buttons).filter(button => 
    button.textContent?.includes('Kostenvoranschlag abgeben')
  );
  
  if (costEstimateButtons.length > 0) {
    console.log('🔘 Teste direkten Klick auf ersten Button...');
    
    const button = costEstimateButtons[0];
    
    // Direkter Click
    console.log('🖱️ Direkter Button-Click...');
    button.click();
    
    // Prüfe ob Modal geöffnet wurde
    setTimeout(() => {
      const modal = document.querySelector('[class*="fixed inset-0"]');
      console.log('📋 Modal geöffnet:', !!modal);
      
      if (modal) {
        console.log('✅ Modal erfolgreich geöffnet');
      } else {
        console.log('❌ Modal nicht geöffnet');
      }
    }, 100);
    
    return true;
  } else {
    console.log('❌ Keine Kostenvoranschlag-Buttons gefunden');
    return false;
  }
}

// Teste API-Calls
async function testApiCalls() {
  console.log('🔍 Teste API-Calls...');
  
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('❌ Kein Token gefunden!');
      return { success: false, error: 'No token' };
    }
    
    // Teste Projekte laden
    const projectsResponse = await fetch('http://localhost:8000/api/v1/projects/', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('📡 Projekte API Status:', projectsResponse.status);
    
    if (projectsResponse.ok) {
      const projectsData = await projectsResponse.json();
      console.log('✅ Projekte geladen:', projectsData);
      console.log('📊 Anzahl Projekte:', projectsData.length);
    } else {
      console.error('❌ Projekte API Error:', projectsResponse.status);
    }
    
    // Teste Milestones laden
    const milestonesResponse = await fetch('http://localhost:8000/api/v1/milestones/all', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('📡 Milestones API Status:', milestonesResponse.status);
    
    if (milestonesResponse.ok) {
      const milestonesData = await milestonesResponse.json();
      console.log('✅ Milestones geladen:', milestonesData);
      console.log('📊 Anzahl Milestones:', milestonesData.length);
    } else {
      console.error('❌ Milestones API Error:', milestonesResponse.status);
    }
    
    return { success: true };
  } catch (error) {
    console.error('❌ API-Test Fehler:', error);
    return { success: false, error: error.message };
  }
}

// Umfassender Test
async function runFinalCostEstimateButtonDebug() {
  console.log('🚀 Starte finalen Kostenvoranschlag-Button-Debug...');
  
  const results = {
    auth: debugAuthContext(),
    serviceProvider: debugServiceProviderStatus(),
    buttons: debugButtonElements(),
    trades: debugTradeData(),
    react: debugReactComponents(),
    state: debugStateVariables(),
    api: null
  };
  
  // Teste API-Calls
  results.api = await testApiCalls();
  
  console.log('📊 Finale Debug-Ergebnisse:', results);
  
  // Empfehlungen basierend auf Ergebnissen
  if (!results.auth.user) {
    console.error('💡 Problem: Kein User vorhanden - Login erforderlich');
  }
  
  if (!results.serviceProvider) {
    console.error('💡 Problem: User ist kein Service Provider');
  }
  
  if (results.buttons.length === 0) {
    console.error('💡 Problem: Keine Kostenvoranschlag-Buttons gefunden');
  }
  
  if (results.trades.length === 0) {
    console.error('💡 Problem: Keine Trade-Karten gefunden');
  }
  
  if (!results.react.isQuotesPage) {
    console.error('💡 Problem: Nicht auf der Quotes-Seite');
  }
  
  if (!results.api?.success) {
    console.error('💡 Problem: API-Calls funktionieren nicht');
  }
  
  // Teste verschiedene Button-Click-Methoden
  console.log('🔘 Teste verschiedene Button-Click-Methoden...');
  
  console.log('1. Teste direkten Button-Click...');
  const directClickResult = testDirectButtonClick();
  
  console.log('2. Teste Button-Click mit Event-Listener...');
  const listenerClickResult = testButtonClickWithListener();
  
  return {
    ...results,
    directClickTest: directClickResult,
    listenerClickTest: listenerClickResult
  };
}

// Automatischer Test
console.log('🔧 Debug-Funktionen verfügbar:');
console.log('- debugAuthContext() - Prüfe AuthContext');
console.log('- debugServiceProviderStatus() - Prüfe Service Provider Status');
console.log('- debugButtonElements() - Prüfe Button-Elemente');
console.log('- debugTradeData() - Prüfe Trade-Daten');
console.log('- debugReactComponents() - Prüfe React-Komponenten');
console.log('- debugStateVariables() - Prüfe State-Variablen');
console.log('- testDirectButtonClick() - Teste direkten Button-Click');
console.log('- testButtonClickWithListener() - Teste Button-Click mit Event-Listener');
console.log('- testApiCalls() - Teste API-Calls');
console.log('- runFinalCostEstimateButtonDebug() - Umfassender Test');

// Führe automatischen Test aus
runFinalCostEstimateButtonDebug(); 