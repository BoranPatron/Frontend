// Debug-Skript für Navbar-Initialisierungsproblem
// Führe dies in der Browser-Konsole aus

console.log('🔍 Debug: Navbar-Initialisierungsproblem');

// Prüfe AuthContext-Initialisierung
function debugAuthInitialization() {
  console.log('🔍 Prüfe AuthContext-Initialisierung...');
  
  // Prüfe localStorage
  const token = localStorage.getItem('token');
  const user = localStorage.getItem('user');
  const refreshToken = localStorage.getItem('refreshToken');
  
  console.log('📊 localStorage Status:');
  console.log('- Token:', token ? '✅ Vorhanden' : '❌ Fehlt');
  console.log('- User:', user ? '✅ Vorhanden' : '❌ Fehlt');
  console.log('- RefreshToken:', refreshToken ? '✅ Vorhanden' : '❌ Fehlt');
  
  if (user) {
    try {
      const userData = JSON.parse(user);
      console.log('👤 User-Daten:', userData);
    } catch (e) {
      console.error('❌ User-Daten sind kein gültiges JSON:', e);
    }
  }
  
  // Prüfe aktuelle URL
  console.log('🌐 Aktuelle URL:', window.location.href);
  console.log('📍 Pathname:', window.location.pathname);
  
  // Prüfe ob wir auf Login-Seite sind
  const isLoginPage = window.location.pathname === '/login';
  console.log('🔐 Auf Login-Seite:', isLoginPage);
  
  return {
    token: !!token,
    user: !!user,
    refreshToken: !!refreshToken,
    isLoginPage,
    currentPath: window.location.pathname
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
    
    // Prüfe ob AuthProvider läuft
    const authProviderRunning = reactRoot.children.length > 0;
    console.log('🔧 AuthProvider läuft:', authProviderRunning);
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
    authProviderRunning: reactRoot?.children.length > 0,
    navbarFound: !!navbar,
    navbarVisible: navbar?.offsetParent !== null
  };
}

// Prüfe Initialisierungs-Timing
function debugInitializationTiming() {
  console.log('🔍 Prüfe Initialisierungs-Timing...');
  
  // Prüfe ob localStorage sofort verfügbar ist
  const immediateToken = localStorage.getItem('token');
  console.log('⚡ Sofortiger Token-Zugriff:', immediateToken ? '✅ Erfolgreich' : '❌ Fehlgeschlagen');
  
  // Prüfe Performance-Timing
  const startTime = performance.now();
  localStorage.getItem('token'); // Test-Zugriff
  const endTime = performance.now();
  console.log(`⏱️ localStorage Zugriffszeit: ${(endTime - startTime).toFixed(2)}ms`);
  
  // Prüfe Event-Listener
  console.log('📡 Event-Listener Status:');
  console.log('- DOMContentLoaded:', document.readyState);
  console.log('- Window Load:', window.performance.timing.loadEventEnd > 0 ? 'Abgeschlossen' : 'Läuft noch');
  
  return {
    immediateAccess: !!immediateToken,
    accessTime: endTime - startTime,
    domReady: document.readyState === 'complete'
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
  
  // Simuliere localStorage Reset
  console.log('🔄 Simuliere localStorage Reset...');
  
  // Zeige Anweisungen
  console.log('📋 Anweisungen:');
  console.log('1. Drücken Sie F5 um die Seite neu zu laden');
  console.log('2. Prüfen Sie die Konsole für Debug-Ausgaben');
  console.log('3. Die Navbar sollte nach dem Neuladen erscheinen');
  
  return {
    token: currentToken,
    user: currentUser,
    instructions: 'F5 drücken für Neuladen'
  };
}

// Umfassender Test
function runInitializationDebug() {
  console.log('🚀 Starte Initialisierungs-Debug...');
  
  const results = {
    auth: debugAuthInitialization(),
    react: debugReactComponents(),
    timing: debugInitializationTiming()
  };
  
  console.log('📊 Debug-Ergebnisse:', results);
  
  // Empfehlungen basierend auf Ergebnissen
  if (!results.auth.token) {
    console.error('💡 Problem: Kein Token vorhanden - Login erforderlich');
  }
  
  if (!results.auth.user) {
    console.error('💡 Problem: Keine User-Daten vorhanden');
  }
  
  if (!results.react.authProviderRunning) {
    console.error('💡 Problem: AuthProvider läuft nicht korrekt');
  }
  
  if (!results.react.navbarFound) {
    console.error('💡 Problem: Navbar-Element nicht im DOM');
  }
  
  if (results.auth.isLoginPage) {
    console.log('ℹ️ Info: Auf Login-Seite - Navbar wird korrekt ausgeblendet');
  }
  
  if (results.timing.accessTime > 10) {
    console.warn('⚠️ Warnung: Langsamer localStorage-Zugriff');
  }
  
  return results;
}

// Automatischer Test
console.log('🔧 Debug-Funktionen verfügbar:');
console.log('- debugAuthInitialization() - Prüfe Auth-Initialisierung');
console.log('- debugReactComponents() - Prüfe React-Komponenten');
console.log('- debugInitializationTiming() - Prüfe Timing');
console.log('- simulatePageReload() - Simuliere Neuladen');
console.log('- runInitializationDebug() - Umfassender Test');

// Führe automatischen Test aus
runInitializationDebug(); 