// Finales Debug-Skript für Navbar-Problem
// Führe dies in der Browser-Konsole aus

console.log('🔍 Debug: Finales Navbar-Problem - Umfassende Diagnose');

// Prüfe AuthContext-Status
function debugAuthContext() {
  console.log('🔍 Prüfe AuthContext-Status...');
  
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

// Prüfe React-Komponenten-Status
function debugReactComponents() {
  console.log('🔍 Prüfe React-Komponenten-Status...');
  
  // Prüfe AuthProvider
  const reactRoot = document.querySelector('#root');
  if (reactRoot) {
    console.log('✅ React Root gefunden');
    console.log('📦 Root Children:', reactRoot.children.length);
  } else {
    console.log('❌ React Root nicht gefunden');
  }
  
  // Prüfe Navbar-Element
  const navbar = document.querySelector('nav');
  if (navbar) {
    console.log('✅ Navbar gefunden:', navbar);
    console.log('📏 Navbar Sichtbarkeit:', navbar.offsetParent !== null ? 'Sichtbar' : 'Versteckt');
    console.log('🎨 Navbar Stile:', window.getComputedStyle(navbar));
  } else {
    console.log('❌ Navbar nicht gefunden');
  }
  
  // Prüfe alle nav-Elemente
  const allNavs = document.querySelectorAll('nav');
  console.log(`📊 Anzahl nav-Elemente: ${allNavs.length}`);
  
  return {
    reactRootFound: !!reactRoot,
    navbarFound: !!navbar,
    navbarVisible: navbar?.offsetParent !== null,
    navCount: allNavs.length
  };
}

// Prüfe Routing-Status
function debugRouting() {
  console.log('🔍 Prüfe Routing-Status...');
  
  const currentPath = window.location.pathname;
  const isLoginPage = currentPath === '/login';
  
  console.log('🌐 Routing Status:');
  console.log('- Aktuelle URL:', window.location.href);
  console.log('- Pathname:', currentPath);
  console.log('- Auf Login-Seite:', isLoginPage);
  
  return {
    currentPath,
    isLoginPage,
    fullUrl: window.location.href
  };
}

// Teste Navbar-Logik
function testNavbarLogic() {
  console.log('🔍 Teste Navbar-Logik...');
  
  const auth = debugAuthContext();
  const routing = debugRouting();
  
  // Simuliere die Navbar-Logik aus App.tsx
  const shouldShowNavbar = !routing.isLoginPage && auth.user;
  
  console.log('🧮 Navbar-Logik Test:');
  console.log('- Nicht Login-Seite:', !routing.isLoginPage);
  console.log('- User vorhanden:', auth.user);
  console.log('- Sollte Navbar zeigen:', shouldShowNavbar);
  
  return {
    shouldShowNavbar,
    conditions: {
      notLoginPage: !routing.isLoginPage,
      hasUser: auth.user
    }
  };
}

// Prüfe React DevTools
function debugReactDevTools() {
  console.log('🔍 Prüfe React DevTools...');
  
  const hasReactDevTools = window.__REACT_DEVTOOLS_GLOBAL_HOOK__;
  console.log('⚛️ React DevTools verfügbar:', hasReactDevTools ? 'Ja' : 'Nein');
  
  if (hasReactDevTools) {
    console.log('🔧 React DevTools Hook gefunden');
  }
  
  return {
    hasReactDevTools: !!hasReactDevTools
  };
}

// Simuliere Seite neu laden
function simulatePageReload() {
  console.log('🔄 Simuliere Seite neu laden...');
  
  // Speichere aktuelle Daten
  const currentToken = localStorage.getItem('token');
  const currentUser = localStorage.getItem('user');
  
  console.log('💾 Aktuelle Daten gespeichert:');
  console.log('- Token:', currentToken ? 'Vorhanden' : 'Fehlt');
  console.log('- User:', currentUser ? 'Vorhanden' : 'Fehlt');
  
  // Zeige Anweisungen
  console.log('📋 Anweisungen:');
  console.log('1. Drücken Sie F5 um die Seite neu zu laden');
  console.log('2. Prüfen Sie die Konsole für Debug-Ausgaben');
  console.log('3. Die Navbar sollte nach dem Neuladen erscheinen');
  console.log('4. Falls nicht, aktivieren Sie die Debug-Komponente:');
  console.log('   - Öffnen Sie die Browser-Konsole');
  console.log('   - Führen Sie aus: document.querySelector("[data-debug-navbar]")?.click()');
  
  return {
    token: currentToken,
    user: currentUser,
    instructions: 'F5 drücken für Neuladen'
  };
}

// Aktiviere Debug-Komponente
function enableNavbarDebug() {
  console.log('🔧 Aktiviere Navbar-Debug-Komponente...');
  
  // Suche nach der Debug-Komponente und aktiviere sie
  const debugComponent = document.querySelector('[data-debug-navbar]');
  if (debugComponent) {
    debugComponent.click();
    console.log('✅ Debug-Komponente aktiviert');
  } else {
    console.log('❌ Debug-Komponente nicht gefunden');
    console.log('💡 Tipp: Setzen Sie showDebug={true} in App.tsx');
  }
  
  return {
    debugComponentFound: !!debugComponent
  };
}

// Umfassender Test
function runFinalNavbarDebug() {
  console.log('🚀 Starte finalen Navbar-Debug...');
  
  const results = {
    auth: debugAuthContext(),
    react: debugReactComponents(),
    routing: debugRouting(),
    logic: testNavbarLogic(),
    devTools: debugReactDevTools()
  };
  
  console.log('📊 Finale Debug-Ergebnisse:', results);
  
  // Empfehlungen basierend auf Ergebnissen
  if (!results.auth.user) {
    console.error('💡 Problem: Kein User vorhanden - Login erforderlich');
    console.log('💡 Lösung: Zur Login-Seite navigieren und sich anmelden');
  }
  
  if (!results.auth.token) {
    console.error('💡 Problem: Kein Token vorhanden');
    console.log('💡 Lösung: Token wird beim Login gesetzt');
  }
  
  if (results.routing.isLoginPage) {
    console.log('ℹ️ Info: Auf Login-Seite - Navbar wird korrekt ausgeblendet');
  }
  
  if (!results.react.navbarFound) {
    console.error('💡 Problem: Navbar-Element nicht im DOM');
    console.log('💡 Lösung: Prüfen Sie die React-Komponenten-Hierarchie');
  }
  
  if (results.react.navbarFound && !results.react.navbarVisible) {
    console.error('💡 Problem: Navbar ist im DOM aber nicht sichtbar');
    console.log('💡 Lösung: Prüfen Sie CSS-Styles und z-index');
  }
  
  if (results.logic.shouldShowNavbar && !results.react.navbarFound) {
    console.error('💡 Problem: Navbar sollte angezeigt werden, ist aber nicht da');
    console.log('💡 Lösung: React-Komponente wird nicht gerendert');
  }
  
  return results;
}

// Automatischer Test
console.log('🔧 Debug-Funktionen verfügbar:');
console.log('- debugAuthContext() - Prüfe AuthContext');
console.log('- debugReactComponents() - Prüfe React-Komponenten');
console.log('- debugRouting() - Prüfe Routing');
console.log('- testNavbarLogic() - Teste Navbar-Logik');
console.log('- debugReactDevTools() - Prüfe React DevTools');
console.log('- simulatePageReload() - Simuliere Neuladen');
console.log('- enableNavbarDebug() - Aktiviere Debug-Komponente');
console.log('- runFinalNavbarDebug() - Umfassender Test');

// Führe automatischen Test aus
runFinalNavbarDebug(); 