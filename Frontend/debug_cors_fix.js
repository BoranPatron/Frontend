// CORS-Problem Debug-Skript für Browser
// Führen Sie dieses Skript in der Browser-Konsole aus

console.log('🔍 CORS-Problem Debug-Skript gestartet...');

// Hilfsfunktionen für Browser-Kontext
function getApiBaseUrl() {
  // Versuche verschiedene mögliche API-URLs
  const possibleUrls = [
    'http://localhost:8000',
    'http://127.0.0.1:8000',
    'http://localhost:8001',
    'http://127.0.0.1:8001',
    'https://localhost:8000',
    'https://127.0.0.1:8000'
  ];
  
  // Prüfe, ob eine URL in localStorage gespeichert ist
  const storedUrl = localStorage.getItem('apiBaseUrl');
  if (storedUrl) {
    possibleUrls.unshift(storedUrl);
  }
  
  return possibleUrls[0]; // Verwende die erste URL als Standard
}

function getAuthToken() {
  return localStorage.getItem('token');
}

async function testBackendAvailability() {
  console.log('🔍 Teste Backend-Verfügbarkeit...');
  
  const baseUrl = getApiBaseUrl();
  console.log(`📍 Verwende API Base URL: ${baseUrl}`);
  
  try {
    const response = await fetch(`${baseUrl}/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    console.log('✅ Backend ist erreichbar');
    console.log(`📊 Status: ${response.status}`);
    console.log(`📊 Status Text: ${response.statusText}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('📋 Health Check Response:', data);
    }
    
    return true;
  } catch (error) {
    console.error('❌ Backend ist NICHT erreichbar');
    console.error('🔍 Fehler Details:', error);
    console.log('💡 Mögliche Lösungen:');
    console.log('   1. Backend neu starten');
    console.log('   2. Port überprüfen (8000/8001)');
    console.log('   3. Firewall-Einstellungen prüfen');
    return false;
  }
}

async function testGeoSearchAPI() {
  console.log('🔍 Teste Geo-Search API...');
  
  const baseUrl = getApiBaseUrl();
  const token = getAuthToken();
  
  if (!token) {
    console.error('❌ Kein Auth-Token gefunden');
    console.log('💡 Bitte zuerst einloggen');
    return false;
  }
  
  console.log(`🔑 Token gefunden: ${token.substring(0, 20)}...`);
  
  try {
    // Teste verschiedene Geo-Search Endpoints
    const endpoints = [
      '/api/v1/geo/search/projects',
      '/api/v1/geo/search/trades',
      '/api/v1/geo/search/service-providers'
    ];
    
    for (const endpoint of endpoints) {
      console.log(`🔍 Teste Endpoint: ${endpoint}`);
      
      const response = await fetch(`${baseUrl}${endpoint}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });
      
      console.log(`📊 Status für ${endpoint}: ${response.status}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`✅ ${endpoint} funktioniert:`, data);
      } else {
        console.error(`❌ ${endpoint} fehlgeschlagen:`, response.statusText);
      }
    }
    
    return true;
  } catch (error) {
    console.error('❌ Geo-Search API Test fehlgeschlagen');
    console.error('🔍 Fehler Details:', error);
    
    if (error.name === 'TypeError' && error.message.includes('CORS')) {
      console.log('🚨 CORS-Fehler erkannt!');
      console.log('💡 Lösungsansätze:');
      console.log('   1. Backend CORS-Einstellungen prüfen');
      console.log('   2. Frontend URL in Backend CORS-Liste hinzufügen');
      console.log('   3. Browser-Cache leeren');
    }
    
    return false;
  }
}

async function testApiUrls() {
  console.log('🔍 Teste verschiedene API URLs...');
  
  const testUrls = [
    'http://localhost:8000',
    'http://127.0.0.1:8000',
    'http://localhost:8001',
    'http://127.0.0.1:8001',
    'https://localhost:8000',
    'https://127.0.0.1:8000'
  ];
  
  const results = [];
  
  for (const url of testUrls) {
    console.log(`🔍 Teste URL: ${url}`);
    
    try {
      const response = await fetch(`${url}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const isWorking = response.ok;
      results.push({ url, isWorking, status: response.status });
      
      console.log(`📊 ${url}: ${isWorking ? '✅' : '❌'} (${response.status})`);
    } catch (error) {
      results.push({ url, isWorking: false, status: 'ERROR' });
      console.log(`📊 ${url}: ❌ (ERROR)`);
    }
  }
  
  console.log('📋 URL-Test Ergebnisse:');
  results.forEach(result => {
    console.log(`   ${result.url}: ${result.isWorking ? '✅' : '❌'} (${result.status})`);
  });
  
  return results;
}

function testFrontendConfig() {
  console.log('🔍 Teste Frontend-Konfiguration...');
  
  // Prüfe localStorage
  const token = localStorage.getItem('token');
  const apiUrl = localStorage.getItem('apiBaseUrl');
  const user = localStorage.getItem('user');
  
  console.log('📋 LocalStorage Inhalt:');
  console.log(`   Token: ${token ? '✅ Vorhanden' : '❌ Fehlt'}`);
  console.log(`   API URL: ${apiUrl || '❌ Nicht gesetzt'}`);
  console.log(`   User: ${user ? '✅ Vorhanden' : '❌ Fehlt'}`);
  
  // Prüfe aktuelle URL
  console.log(`📍 Aktuelle URL: ${window.location.href}`);
  console.log(`📍 Origin: ${window.location.origin}`);
  
  // Prüfe Browser-Informationen
  console.log(`🌐 Browser: ${navigator.userAgent}`);
  console.log(`🌐 Online Status: ${navigator.onLine ? '✅ Online' : '❌ Offline'}`);
  
  // Prüfe CORS-Einstellungen
  console.log('🔒 CORS-Test:');
  try {
    const testRequest = new XMLHttpRequest();
    testRequest.open('GET', 'http://localhost:8000/health', false);
    testRequest.send();
    console.log('   ✅ CORS funktioniert');
  } catch (error) {
    console.log('   ❌ CORS blockiert');
    console.log('   💡 Backend CORS-Einstellungen prüfen');
  }
}

async function runCorsFixTest() {
  console.log('🚀 Starte umfassenden CORS-Test...');
  console.log('=' .repeat(50));
  
  // Test 1: Frontend-Konfiguration
  console.log('\n📋 Test 1: Frontend-Konfiguration');
  testFrontendConfig();
  
  // Test 2: Backend-Verfügbarkeit
  console.log('\n📋 Test 2: Backend-Verfügbarkeit');
  const backendAvailable = await testBackendAvailability();
  
  // Test 3: API URLs
  console.log('\n📋 Test 3: API URL-Test');
  const urlResults = await testApiUrls();
  
  // Test 4: Geo-Search API (nur wenn Backend verfügbar)
  if (backendAvailable) {
    console.log('\n📋 Test 4: Geo-Search API');
    await testGeoSearchAPI();
  }
  
  // Zusammenfassung
  console.log('\n📋 Test-Zusammenfassung:');
  console.log(`   Backend verfügbar: ${backendAvailable ? '✅' : '❌'}`);
  console.log(`   Funktionierende URLs: ${urlResults.filter(r => r.isWorking).length}/${urlResults.length}`);
  
  if (!backendAvailable) {
    console.log('\n💡 Empfohlene Schritte:');
    console.log('   1. Backend neu starten: python -m uvicorn app.main:app --reload');
    console.log('   2. Port 8000 überprüfen');
    console.log('   3. Firewall-Einstellungen prüfen');
  }
  
  console.log('\n✅ CORS-Test abgeschlossen');
}

// Funktionen global verfügbar machen
window.testBackendAvailability = testBackendAvailability;
window.testGeoSearchAPI = testGeoSearchAPI;
window.testApiUrls = testApiUrls;
window.testFrontendConfig = testFrontendConfig;
window.runCorsFixTest = runCorsFixTest;

console.log('✅ Debug-Skript geladen. Verwenden Sie:');
console.log('   runCorsFixTest() - Vollständiger Test');
console.log('   testBackendAvailability() - Backend-Test');
console.log('   testGeoSearchAPI() - API-Test');
console.log('   testFrontendConfig() - Konfiguration-Test'); 