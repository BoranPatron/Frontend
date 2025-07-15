// Debug-Skript für Login-Problem - Backend-Format-Test
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

// Teste 401-Timing-Problem
async function test401Timing() {
  console.log('🔍 Teste 401-Timing-Problem...');
  
  // Prüfe localStorage vor Login
  console.log('📊 localStorage vor Login:');
  console.log('- Token:', localStorage.getItem('token') ? '✅ Vorhanden' : '❌ Fehlt');
  console.log('- User:', localStorage.getItem('user') ? '✅ Vorhanden' : '❌ Fehlt');
  
  // Simuliere Login
  try {
    const formData = new URLSearchParams();
    formData.append('username', 'admin@buildwise.de');
    formData.append('password', 'admin123');

    const response = await fetch('http://localhost:8000/api/v1/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData,
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Login erfolgreich');
      console.log('📊 Token erhalten:', data.access_token ? '✅ Ja' : '❌ Nein');
      console.log('📊 User erhalten:', data.user ? '✅ Ja' : '❌ Nein');
      
      // Prüfe localStorage nach Login
      console.log('📊 localStorage nach Login:');
      console.log('- Token:', localStorage.getItem('token') ? '✅ Vorhanden' : '❌ Fehlt');
      console.log('- User:', localStorage.getItem('user') ? '✅ Vorhanden' : '❌ Fehlt');
      
      // Teste API-Call nach Login
      console.log('🔍 Teste API-Call nach Login...');
      const apiResponse = await fetch('http://localhost:8000/api/v1/projects', {
        headers: {
          'Authorization': `Bearer ${data.access_token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log(`📡 API-Call Status: ${apiResponse.status}`);
      
      if (apiResponse.ok) {
        console.log('✅ API-Call erfolgreich');
        return { success: true, timing: 'normal' };
      } else {
        console.log('❌ API-Call fehlgeschlagen');
        return { success: false, timing: '401_error' };
      }
    } else {
      console.log('❌ Login fehlgeschlagen:', data);
      return { success: false, timing: 'login_failed' };
    }
  } catch (error) {
    console.error('❌ Login-Test Fehler:', error);
    return { success: false, timing: 'error' };
  }
}

// Umfassender Test
async function runLoginDebug() {
  console.log('🚀 Starte umfassenden Login-Debug...');
  
  const results = {
    backendAvailable: false,
    authEndpointAvailable: false,
    workingFormat: null,
    timingTest: null
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
  
  // Teste 401-Timing-Problem
  results.timingTest = await test401Timing();
  
  // Empfehlungen basierend auf Ergebnissen
  if (results.timingTest?.timing === '401_error') {
    console.error('💡 Problem: 401-Fehler nach Login - Timing-Problem erkannt');
    console.log('💡 Lösung: AuthContext-Initialisierung verbessern');
  }
  
  return results;
}

// Automatischer Test
console.log('🔧 Debug-Funktionen verfügbar:');
console.log('- testBackendAvailability() - Teste Backend-Verfügbarkeit');
console.log('- testAuthEndpoint() - Teste Auth-Endpunkt');
console.log('- testLoginFormats() - Teste verschiedene Login-Formate');
console.log('- test401Timing() - Teste 401-Timing-Problem');
console.log('- runLoginDebug() - Umfassender Test');

// Führe automatischen Test aus
runLoginDebug(); 