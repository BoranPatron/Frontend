// Debug-Skript für Kostenpositionen
// Führe dies in der Browser-Konsole aus

console.log('🔍 Debug: Kostenpositionen-API Test');

// Teste API-Call direkt
async function testCostPositionsAPI() {
  try {
    console.log('🔍 Teste Kostenpositionen für Projekt 4...');
    
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('❌ Kein Token gefunden!');
      return { success: false, error: 'No token' };
    }
    
    console.log(`🔑 Token gefunden: ${token.substring(0, 20)}...`);
    
    // Teste verschiedene Endpunkte
    const endpoints = [
      '/api/v1/cost-positions/?project_id=4&accepted_quotes_only=true',
      '/api/v1/cost-positions/?project_id=4',
      '/api/v1/cost-positions/project/4/statistics?accepted_quotes_only=true'
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
    
    // Importiere die Service-Funktion
    const { costPositionService } = await import('./src/api/costPositionService.ts');
    
    const result = await costPositionService.getCostPositionsFromAcceptedQuotes(4);
    console.log('✅ Frontend-Service Result:', result);
    console.log('📊 Anzahl Kostenpositionen:', result.length);
    
    return { success: true, data: result };
  } catch (error) {
    console.error('❌ Frontend-Service Fehler:', error);
    return { success: false, error: error.message };
  }
}

// Umfassender Test
async function runComprehensiveTest() {
  console.log('🚀 Starte umfassenden Kostenpositionen-Test...');
  
  const results = {
    apiTest: null,
    frontendTest: null
  };
  
  // Teste API direkt
  results.apiTest = await testCostPositionsAPI();
  
  // Teste Frontend-Service
  results.frontendTest = await testFrontendService();
  
  console.log('📊 Test-Zusammenfassung:', results);
  
  return results;
}

// Automatischer Test
console.log('🔧 Debug-Funktionen verfügbar:');
console.log('- testCostPositionsAPI() - Teste API direkt');
console.log('- testFrontendService() - Teste Frontend-Service');
console.log('- runComprehensiveTest() - Umfassender Test');

// Führe automatischen Test aus
runComprehensiveTest(); 