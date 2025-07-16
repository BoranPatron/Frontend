// Debug-Skript für BuildWise-Gebühren Frontend
// Führe dies in der Browser-Konsole aus

console.log('🔍 Debug: BuildWise-Gebühren Frontend - Erweiterte Diagnose');

// Prüfe localStorage
function debugAuthContext() {
  console.log('🔍 Prüfe AuthContext...');
  
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

// Teste API-Call direkt
async function testBuildWiseFeesAPI() {
  try {
    console.log('🔍 Teste BuildWise-Gebühren API direkt...');
    
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('❌ Kein Token gefunden!');
      return { success: false, error: 'No token' };
    }
    
    console.log(`🔑 Token gefunden: ${token.substring(0, 20)}...`);
    
    const response = await fetch('http://localhost:8000/api/v1/buildwise-fees/', {
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
    console.log('✅ BuildWise-Gebühren geladen:', data);
    console.log('📊 Anzahl Gebühren:', data.length);
    
    // Zeige Details der ersten 3 Gebühren
    data.slice(0, 3).forEach((fee, index) => {
      console.log(`📋 Gebühr ${index + 1}:`, {
        id: fee.id,
        project_id: fee.project_id,
        quote_id: fee.quote_id,
        fee_amount: fee.fee_amount,
        status: fee.status,
        invoice_number: fee.invoice_number,
        created_at: fee.created_at
      });
    });
    
    return { success: true, data, count: data.length };
  } catch (error) {
    console.error('❌ Fehler:', error);
    return { success: false, error: error.message };
  }
}

// Teste verschiedene API-Parameter
async function testBuildWiseFeesWithParams() {
  try {
    console.log('🔍 Teste BuildWise-Gebühren API mit verschiedenen Parametern...');
    
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('❌ Kein Token gefunden!');
      return { success: false, error: 'No token' };
    }
    
    const testCases = [
      { name: 'Ohne Filter', params: '' },
      { name: 'Mit Limit 10', params: '?limit=10' },
      { name: 'Mit Skip 0', params: '?skip=0&limit=100' },
      { name: 'Mit Status Open', params: '?status=open' },
      { name: 'Mit Projekt ID 1', params: '?project_id=1' },
      { name: 'Mit Monat/Year', params: '?month=1&year=2024' }
    ];
    
    const results = {};
    
    for (const testCase of testCases) {
      console.log(`\n🔍 Teste: ${testCase.name}`);
      
      const response = await fetch(`http://localhost:8000/api/v1/buildwise-fees/${testCase.params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log(`📡 Status: ${response.status}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`✅ ${testCase.name}: ${data.length} Gebühren`);
        results[testCase.name] = { success: true, count: data.length };
      } else {
        const errorText = await response.text();
        console.error(`❌ ${testCase.name}: ${response.status} - ${errorText}`);
        results[testCase.name] = { success: false, status: response.status, error: errorText };
      }
    }
    
    return results;
  } catch (error) {
    console.error('❌ Fehler:', error);
    return { success: false, error: error.message };
  }
}

// Teste Frontend-Service
async function testFrontendService() {
  try {
    console.log('🔍 Teste Frontend BuildWiseFeeService...');
    
    // Importiere die Service-Funktion
    const { getBuildWiseFees } = await import('./src/api/buildwiseFeeService.ts');
    
    console.log('📦 Service importiert');
    
    // Teste verschiedene Aufrufe
    const testCases = [
      { name: 'Ohne Parameter', params: {} },
      { name: 'Mit Limit 5', params: { limit: 5 } },
      { name: 'Mit Projekt ID', params: { projectId: 1 } },
      { name: 'Mit Status', params: { status: 'open' } }
    ];
    
    const results = {};
    
    for (const testCase of testCases) {
      console.log(`\n🔍 Teste Service: ${testCase.name}`);
      
      try {
        const data = await getBuildWiseFees(
          testCase.params.month,
          testCase.params.year,
          testCase.params.projectId,
          testCase.params.status,
          testCase.params.skip || 0,
          testCase.params.limit || 100
        );
        
        console.log(`✅ ${testCase.name}: ${data.length} Gebühren`);
        results[testCase.name] = { success: true, count: data.length, data };
      } catch (error) {
        console.error(`❌ ${testCase.name}: ${error.message}`);
        results[testCase.name] = { success: false, error: error.message };
      }
    }
    
    return results;
  } catch (error) {
    console.error('❌ Fehler beim Testen des Frontend-Services:', error);
    return { success: false, error: error.message };
  }
}

// Teste aktuelle Seite
function debugCurrentPage() {
  console.log('🔍 Prüfe aktuelle Seite...');
  
  console.log('🌐 Aktuelle URL:', window.location.href);
  console.log('📍 Pathname:', window.location.pathname);
  
  // Prüfe ob wir auf der BuildWiseFees-Seite sind
  const isBuildWiseFeesPage = window.location.pathname === '/buildwise-fees';
  console.log('📄 Auf BuildWiseFees-Seite:', isBuildWiseFeesPage);
  
  // Prüfe React-Komponenten
  const reactRoot = document.querySelector('#root');
  if (reactRoot) {
    console.log('✅ React Root gefunden');
    console.log('📦 Root Children:', reactRoot.children.length);
  } else {
    console.log('❌ React Root nicht gefunden');
  }
  
  return {
    isBuildWiseFeesPage,
    hasReactRoot: !!reactRoot
  };
}

// Umfassender Test
async function runBuildWiseFeesDebug() {
  console.log('🚀 Starte umfassenden BuildWise-Gebühren-Debug...');
  
  const results = {
    auth: debugAuthContext(),
    currentPage: debugCurrentPage(),
    api: null,
    apiWithParams: null,
    frontendService: null
  };
  
  // Teste API-Calls
  console.log('\n🔍 Teste API-Calls...');
  results.api = await testBuildWiseFeesAPI();
  
  console.log('\n🔍 Teste API mit Parametern...');
  results.apiWithParams = await testBuildWiseFeesWithParams();
  
  console.log('\n🔍 Teste Frontend-Service...');
  results.frontendService = await testFrontendService();
  
  console.log('\n📊 Debug-Ergebnisse:', results);
  
  // Empfehlungen basierend auf Ergebnissen
  if (!results.auth.token) {
    console.error('💡 Problem: Kein Token vorhanden - Login erforderlich');
  }
  
  if (!results.currentPage.isBuildWiseFeesPage) {
    console.error('💡 Problem: Nicht auf der BuildWiseFees-Seite');
  }
  
  if (results.api?.success && results.api.count === 0) {
    console.warn('⚠️ Warnung: API liefert keine Gebühren zurück');
  }
  
  if (results.api?.success && results.api.count === 1) {
    console.warn('⚠️ Warnung: API liefert nur 1 Gebühr zurück, obwohl 2 erwartet werden');
  }
  
  return results;
}

// Automatischer Test
console.log('🔧 Debug-Funktionen verfügbar:');
console.log('- debugAuthContext() - Prüfe AuthContext');
console.log('- testBuildWiseFeesAPI() - Teste API direkt');
console.log('- testBuildWiseFeesWithParams() - Teste API mit Parametern');
console.log('- testFrontendService() - Teste Frontend-Service');
console.log('- debugCurrentPage() - Prüfe aktuelle Seite');
console.log('- runBuildWiseFeesDebug() - Umfassender Test');

// Führe automatischen Test aus
runBuildWiseFeesDebug(); 