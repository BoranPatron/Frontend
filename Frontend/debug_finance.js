// Debug-Skript für die Finance-Seite
// Führe dies in der Browser-Konsole aus

console.log('🔍 Debug: Finance-Seite - Erweiterte Diagnose');

// Prüfe localStorage
console.log('Token:', localStorage.getItem('token'));
console.log('User:', localStorage.getItem('user'));
console.log('RefreshToken:', localStorage.getItem('refreshToken'));

// Prüfe aktuelle URL
console.log('URL:', window.location.href);
console.log('URL Params:', new URLSearchParams(window.location.search));

// Teste API-Call direkt
async function testCostPositions() {
  try {
    console.log('🔍 Teste Kostenpositionen für Projekt 4...');
    
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('❌ Kein Token gefunden!');
      return { success: false, error: 'No token' };
    }
    
    console.log(`🔑 Token gefunden: ${token.substring(0, 20)}...`);
    
    const response = await fetch('http://localhost:8000/api/v1/cost-positions/?project_id=4&accepted_quotes_only=true', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('📡 API Response Status:', response.status);
    console.log('📡 API Response Headers:', Object.fromEntries(response.headers.entries()));
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ API Error: ${errorText}`);
      return { success: false, error: errorText, status: response.status };
    }
    
    const data = await response.json();
    console.log('✅ Kostenpositionen geladen:', data);
    console.log('📊 Anzahl Kostenpositionen:', data.length);
    
    return { success: true, data, count: data.length };
  } catch (error) {
    console.error('❌ Fehler:', error);
    return { success: false, error: error.message };
  }
}

// Teste Projekte laden
async function testProjects() {
  try {
    console.log('🔍 Teste Projekte laden...');
    
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('❌ Kein Token gefunden!');
      return { success: false, error: 'No token' };
    }
    
    const response = await fetch('http://localhost:8000/api/v1/projects/', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('📡 Projekte API Status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Projekte API Error: ${errorText}`);
      return { success: false, error: errorText, status: response.status };
    }
    
    const data = await response.json();
    console.log('✅ Projekte geladen:', data);
    console.log('📊 Anzahl Projekte:', data.length);
    
    return { success: true, data, count: data.length };
  } catch (error) {
    console.error('❌ Fehler:', error);
    return { success: false, error: error.message };
  }
}

// Teste Token-Validität
async function testTokenValidity() {
  try {
    console.log('🔍 Teste Token-Validität...');
    
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('❌ Kein Token gefunden!');
      return { valid: false, error: 'No token' };
    }
    
    // Teste mit einem einfachen Endpunkt
    const response = await fetch('http://localhost:8000/api/v1/users/me', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('📡 Token-Test Status:', response.status);
    
    if (response.status === 401) {
      console.error('❌ Token ist ungültig oder abgelaufen');
      return { valid: false, error: 'Token expired or invalid' };
    } else if (response.ok) {
      const userData = await response.json();
      console.log('✅ Token ist gültig, User:', userData);
      return { valid: true, user: userData };
    } else {
      console.error('❌ Token-Test fehlgeschlagen:', response.status);
      return { valid: false, error: `HTTP ${response.status}` };
    }
  } catch (error) {
    console.error('❌ Token-Test Fehler:', error);
    return { valid: false, error: error.message };
  }
}

// Umfassender Test aller Endpunkte
async function runComprehensiveTest() {
  console.log('🚀 Starte umfassenden API-Test...');
  
  const results = {
    tokenValidity: null,
    projects: null,
    costPositions: null,
    summary: {}
  };
  
  // Teste Token
  results.tokenValidity = await testTokenValidity();
  
  // Teste Projekte
  results.projects = await testProjects();
  
  // Teste Kostenpositionen
  results.costPositions = await testCostPositions();
  
  // Zusammenfassung
  results.summary = {
    tokenValid: results.tokenValidity?.valid || false,
    projectsLoaded: results.projects?.success || false,
    costPositionsLoaded: results.costPositions?.success || false,
    projectCount: results.projects?.count || 0,
    costPositionCount: results.costPositions?.count || 0
  };
  
  console.log('📊 Test-Zusammenfassung:', results.summary);
  
  // Empfehlungen basierend auf Ergebnissen
  if (!results.summary.tokenValid) {
    console.error('💡 Empfehlung: Token erneuern - zur Login-Seite weiterleiten');
  }
  
  if (results.summary.projectsLoaded && results.summary.projectCount === 0) {
    console.warn('⚠️ Warnung: Keine Projekte gefunden');
  }
  
  if (results.summary.costPositionsLoaded && results.summary.costPositionCount === 0) {
    console.warn('⚠️ Warnung: Keine Kostenpositionen gefunden - möglicherweise keine akzeptierten Angebote');
  }
  
  return results;
}

// Automatischer Test beim Laden
console.log('🔧 Debug-Funktionen verfügbar:');
console.log('- testCostPositions() - Teste Kostenpositionen');
console.log('- testProjects() - Teste Projekte');
console.log('- testTokenValidity() - Teste Token');
console.log('- runComprehensiveTest() - Umfassender Test');

// Führe automatischen Test aus
runComprehensiveTest(); 