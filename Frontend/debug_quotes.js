// Debug-Skript für die Quotes-Seite
// Führe dies in der Browser-Konsole aus

console.log('🔍 Debug: Quotes-Seite - Erweiterte Diagnose');

// Prüfe localStorage
console.log('Token:', localStorage.getItem('token'));
console.log('User:', localStorage.getItem('user'));
console.log('RefreshToken:', localStorage.getItem('refreshToken'));

// Prüfe aktuelle URL
console.log('URL:', window.location.href);
console.log('URL Params:', new URLSearchParams(window.location.search));

// Teste Milestones-API direkt
async function testMilestonesAPI() {
  try {
    console.log('🔍 Teste Milestones-API...');
    
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('❌ Kein Token gefunden!');
      return { success: false, error: 'No token' };
    }
    
    console.log(`🔑 Token gefunden: ${token.substring(0, 20)}...`);
    
    // Teste verschiedene Endpunkte
    const endpoints = [
      '/api/v1/milestones/?project_id=4',
      '/api/v1/milestones/all',
      '/api/v1/milestones/',
      '/api/v1/quotes/'
    ];
    
    for (const endpoint of endpoints) {
      console.log(`\n🔍 Teste Endpoint: ${endpoint}`);
      
      const response = await fetch(`https://buildwise-backend.onrender.com${endpoint}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log(`📡 Status: ${response.status}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ API Error: ${errorText}`);
      } else {
        const data = await response.json();
        console.log('✅ API Response:', data);
        console.log('📊 Anzahl Einträge:', Array.isArray(data) ? data.length : 'N/A');
      }
    }
    
    return { success: true };
  } catch (error) {
    console.error('❌ Fehler:', error);
    return { success: false, error: error.message };
  }
}

// Teste Frontend-Service
async function testFrontendService() {
  try {
    console.log('🔍 Teste Frontend-Service...');
    
    // Importiere die Service-Funktionen
    const { getMilestones, getAllMilestones } = await import('./src/api/milestoneService.ts');
    const { getQuotes } = await import('./src/api/quoteService.ts');
    
    console.log('🔧 Teste getMilestones für Projekt 4...');
    const milestones = await getMilestones(4);
    console.log('✅ Milestones geladen:', milestones);
    console.log('📊 Anzahl Milestones:', milestones.length);
    
    console.log('🔧 Teste getAllMilestones...');
    const allMilestones = await getAllMilestones();
    console.log('✅ Alle Milestones geladen:', allMilestones);
    console.log('📊 Anzahl alle Milestones:', allMilestones.length);
    
    console.log('🔧 Teste getQuotes...');
    const quotes = await getQuotes();
    console.log('✅ Quotes geladen:', quotes);
    console.log('📊 Anzahl Quotes:', quotes.length);
    
    return { success: true, milestones, allMilestones, quotes };
  } catch (error) {
    console.error('❌ Frontend-Service Fehler:', error);
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
    const response = await fetch('https://buildwise-backend.onrender.com/api/v1/users/me', {
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
    milestones: null,
    frontendService: null,
    summary: {}
  };
  
  // Teste Token
  results.tokenValidity = await testTokenValidity();
  
  // Teste Milestones-API
  results.milestones = await testMilestonesAPI();
  
  // Teste Frontend-Service
  results.frontendService = await testFrontendService();
  
  // Zusammenfassung
  results.summary = {
    tokenValid: results.tokenValidity?.valid || false,
    milestonesLoaded: results.milestones?.success || false,
    frontendServiceLoaded: results.frontendService?.success || false,
    milestonesCount: results.frontendService?.milestones?.length || 0,
    allMilestonesCount: results.frontendService?.allMilestones?.length || 0,
    quotesCount: results.frontendService?.quotes?.length || 0
  };
  
  console.log('📊 Test-Zusammenfassung:', results.summary);
  
  // Empfehlungen basierend auf Ergebnissen
  if (!results.summary.tokenValid) {
    console.error('💡 Empfehlung: Token erneuern - zur Login-Seite weiterleiten');
  }
  
  if (results.summary.milestonesLoaded && results.summary.milestonesCount === 0) {
    console.warn('⚠️ Warnung: Keine Milestones gefunden');
  }
  
  if (results.summary.frontendServiceLoaded && results.summary.quotesCount === 0) {
    console.warn('⚠️ Warnung: Keine Quotes gefunden');
  }
  
  return results;
}

// Automatischer Test
console.log('🔧 Debug-Funktionen verfügbar:');
console.log('- testMilestonesAPI() - Teste Milestones-API');
console.log('- testFrontendService() - Teste Frontend-Service');
console.log('- testTokenValidity() - Teste Token');
console.log('- runComprehensiveTest() - Umfassender Test');

// Führe automatischen Test aus
runComprehensiveTest(); 