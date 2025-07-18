// Test-Skript für BuildWise-Gebühren-Erstellung
// Führen Sie dieses Skript in der Browser-Konsole aus

console.log('🧪 Teste BuildWise-Gebühren-Erstellung...');

// Test-Funktionen
async function testBuildWiseFeesAPI() {
  try {
    console.log('🔍 Teste BuildWise-Fees-API...');
    
    // Hole Token
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('❌ Kein Token verfügbar');
      return;
    }
    
    // Teste API-Endpunkt
    const response = await fetch('http://localhost:8000/api/v1/buildwise-fees/', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ BuildWise-Fees-API funktioniert:', data);
      console.log('📊 Anzahl Gebühren:', data.length);
      
      // Zeige Details der ersten Gebühren
      data.slice(0, 3).forEach((fee, index) => {
        console.log(`  Gebühr ${index + 1}: ID=${fee.id}, Project=${fee.project_id}, Quote=${fee.quote_id}, Status=${fee.status}, Amount=${fee.fee_amount}`);
      });
    } else {
      console.error('❌ API-Fehler:', response.status, response.statusText);
    }
  } catch (error) {
    console.error('❌ Test fehlgeschlagen:', error);
  }
}

async function testCreateFeeFromQuote() {
  try {
    console.log('🔍 Teste createFeeFromQuote...');
    
    // Hole Token
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('❌ Kein Token verfügbar');
      return;
    }
    
    // Teste create-from-quote Endpunkt
    const response = await fetch('http://localhost:8000/api/v1/buildwise-fees/create-from-quote/1/1', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ createFeeFromQuote erfolgreich:', data);
    } else {
      const errorData = await response.json();
      console.error('❌ createFeeFromQuote fehlgeschlagen:', errorData);
    }
  } catch (error) {
    console.error('❌ Test fehlgeschlagen:', error);
  }
}

async function testServiceProviderFees() {
  try {
    console.log('🔍 Teste ServiceProvider BuildWise-Fees...');
    
    // Simuliere Laden der Gebühren
    const { getBuildWiseFees } = await import('./src/api/buildwiseFeeService.ts');
    
    const fees = await getBuildWiseFees();
    console.log('✅ ServiceProvider Gebühren geladen:', fees);
    console.log('📊 Anzahl Gebühren:', fees.length);
    
    // Zeige Details
    fees.slice(0, 3).forEach((fee, index) => {
      console.log(`  Gebühr ${index + 1}: ID=${fee.id}, Project=${fee.project_id}, Quote=${fee.quote_id}, Status=${fee.status}, Amount=${fee.fee_amount}`);
    });
  } catch (error) {
    console.error('❌ Test fehlgeschlagen:', error);
  }
}

// Führe Tests aus
async function runAllTests() {
  console.log('🚀 Starte alle Tests...');
  
  await testBuildWiseFeesAPI();
  await testCreateFeeFromQuote();
  await testServiceProviderFees();
  
  console.log('✅ Alle Tests abgeschlossen');
}

// Exportiere Funktionen für manuelle Ausführung
window.testBuildWiseFees = {
  testAPI: testBuildWiseFeesAPI,
  testCreateFee: testCreateFeeFromQuote,
  testServiceProvider: testServiceProviderFees,
  runAll: runAllTests
};

console.log('📋 Verfügbare Test-Funktionen:');
console.log('  - testBuildWiseFees.testAPI()');
console.log('  - testBuildWiseFees.testCreateFee()');
console.log('  - testBuildWiseFees.testServiceProvider()');
console.log('  - testBuildWiseFees.runAll()');

// Automatischer Test
runAllTests(); 