// Debug-Skript für Login-Probleme
// Führe dies in der Browser-Konsole aus

console.log('🔍 Debug: Login-Problem - Backend-Format-Test');

// Teste verschiedene Login-Formate
async function testLoginFormats() {
  console.log('🚀 Teste verschiedene Login-Formate...');
  
  const testCases = [
    {
      name: 'JSON Format mit email',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@buildwise.de', password: 'admin123' })
    },
    {
      name: 'JSON Format mit username',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin@buildwise.de', password: 'admin123' })
    },
    {
      name: 'FormData Format mit email',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ email: 'admin@buildwise.de', password: 'admin123' })
    },
    {
      name: 'FormData Format mit username',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ username: 'admin@buildwise.de', password: 'admin123' })
    }
  ];

  for (const testCase of testCases) {
    try {
      console.log(`\n🔍 Teste: ${testCase.name}`);
      
      const response = await fetch('https://buildwise-backend.onrender.com/api/v1/auth/login', {
        method: 'POST',
        headers: testCase.headers,
        body: testCase.body
      });
      
      console.log(`📡 Status: ${response.status} ${response.statusText}`);
      
      const data = await response.json();
      
      if (response.ok) {
        console.log('✅ Erfolgreich!', data);
        return { success: true, format: testCase.name, data };
      } else {
        console.log('❌ Fehlgeschlagen:', data);
      }
    } catch (error) {
      console.error(`❌ Fehler bei ${testCase.name}:`, error);
    }
  }
  
  console.log('\n❌ Kein Format funktioniert');
  return { success: false };
}

// Teste Backend-Verfügbarkeit
async function testBackendAvailability() {
  console.log('🔍 Teste Backend-Verfügbarkeit...');
  
  try {
    const response = await fetch('https://buildwise-backend.onrender.com/api/v1/');
    console.log(`📡 Backend Status: ${response.status}`);
    
    if (response.ok) {
      console.log('✅ Backend ist verfügbar');
      return true;
    } else {
      console.log('⚠️ Backend antwortet, aber nicht wie erwartet');
      return false;
    }
  } catch (error) {
    console.error('❌ Backend nicht erreichbar:', error);
    return false;
  }
}

// Teste Auth-Endpunkt
async function testAuthEndpoint() {
  console.log('🔍 Teste Auth-Endpunkt...');
  
  try {
    const response = await fetch('https://buildwise-backend.onrender.com/api/v1/auth/login', {
      method: 'OPTIONS'
    });
    
    console.log(`📡 Auth-Endpunkt Status: ${response.status}`);
    console.log('📡 Erlaubte Methoden:', response.headers.get('allow'));
    
    return response.ok;
  } catch (error) {
    console.error('❌ Auth-Endpunkt nicht erreichbar:', error);
    return false;
  }
}

// Umfassender Test
async function runLoginDebug() {
  console.log('🚀 Starte umfassenden Login-Debug...');
  
  const results = {
    backendAvailable: false,
    authEndpointAvailable: false,
    workingFormat: null
  };
  
  // Teste Backend-Verfügbarkeit
  results.backendAvailable = await testBackendAvailability();
  
  if (!results.backendAvailable) {
    console.error('💥 Backend ist nicht verfügbar - starte Backend zuerst!');
    return results;
  }
  
  // Teste Auth-Endpunkt
  results.authEndpointAvailable = await testAuthEndpoint();
  
  if (!results.authEndpointAvailable) {
    console.error('💥 Auth-Endpunkt ist nicht verfügbar');
    return results;
  }
  
  // Teste Login-Formate
  const formatTest = await testLoginFormats();
  if (formatTest.success) {
    results.workingFormat = formatTest.format;
    console.log(`✅ Funktionales Format gefunden: ${formatTest.format}`);
  }
  
  return results;
}

// Automatischer Test
console.log('🔧 Debug-Funktionen verfügbar:');
console.log('- testBackendAvailability() - Teste Backend-Verfügbarkeit');
console.log('- testAuthEndpoint() - Teste Auth-Endpunkt');
console.log('- testLoginFormats() - Teste verschiedene Login-Formate');
console.log('- runLoginDebug() - Umfassender Test');

// Führe automatischen Test aus
runLoginDebug(); 