// Debug-Skript für Navbar-Problem
// Führe dies in der Browser-Konsole aus

console.log('🔍 Debug: Navbar-Problem');

// Prüfe AuthContext
function debugAuthContext() {
  console.log('🔍 Prüfe AuthContext...');
  
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
  
  // Prüfe React-Komponenten
  console.log('⚛️ React DevTools verfügbar:', window.__REACT_DEVTOOLS_GLOBAL_HOOK__ ? 'Ja' : 'Nein');
  
  return {
    token: !!token,
    user: !!user,
    refreshToken: !!refreshToken,
    isLoginPage,
    currentPath: window.location.pathname
  };
}

// Prüfe Navbar-Element
function debugNavbarElement() {
  console.log('🔍 Prüfe Navbar-Element...');
  
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
  
  return !!navbar;
}

// Prüfe AuthProvider
function debugAuthProvider() {
  console.log('🔍 Prüfe AuthProvider...');
  
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

// Umfassender Test
function runNavbarDebug() {
  console.log('🚀 Starte Navbar-Debug...');
  
  const results = {
    authContext: debugAuthContext(),
    navbarElement: debugNavbarElement(),
    authProvider: debugAuthProvider()
  };
  
  console.log('📊 Debug-Ergebnisse:', results);
  
  // Empfehlungen
  if (!results.authContext.token) {
    console.error('💡 Problem: Kein Token vorhanden - Login erforderlich');
  }
  
  if (!results.authContext.user) {
    console.error('💡 Problem: Keine User-Daten vorhanden');
  }
  
  if (results.authContext.isLoginPage) {
    console.log('ℹ️ Info: Auf Login-Seite - Navbar wird korrekt ausgeblendet');
  }
  
  if (!results.navbarElement) {
    console.error('💡 Problem: Navbar-Element nicht im DOM');
  }
  
  return results;
}

// Automatischer Test
console.log('🔧 Debug-Funktionen verfügbar:');
console.log('- debugAuthContext() - Prüfe AuthContext');
console.log('- debugNavbarElement() - Prüfe Navbar-Element');
console.log('- debugAuthProvider() - Prüfe AuthProvider');
console.log('- runNavbarDebug() - Umfassender Test');

// Führe automatischen Test aus
runNavbarDebug(); 