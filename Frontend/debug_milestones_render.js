// Debug-Skript für Milestones-API auf Render.com
// Führe dies in der Browser-Konsole aus

console.log('🔍 Debug: Milestones-API auf Render.com');

// Teste verschiedene Milestones-Endpunkte
async function testMilestonesEndpoints() {
  try {
    console.log('🔍 Teste Milestones-Endpunkte...');
    
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('❌ Kein Token gefunden!');
      return { success: false, error: 'No token' };
    }
    
    console.log(`🔑 Token gefunden: ${token.substring(0, 20)}...`);
    
    // Teste verschiedene Endpunkte
    const endpoints = [
      {
        name: 'Milestones für Projekt 4',
        url: '/api/v1/milestones/?project_id=4',
        method: 'GET'
      },
      {
        name: 'Alle Milestones (Dienstleister)',
        url: '/api/v1/milestones/all',
        method: 'GET'
      },
      {
        name: 'Milestones ohne project_id',
        url: '/api/v1/milestones/',
        method: 'GET'
      },
      {
        name: 'Quotes',
        url: '/api/v1/quotes/',
        method: 'GET'
      }
    ];
    
    for (const endpoint of endpoints) {
      console.log(`\n🔍 Teste: ${endpoint.name}`);
      console.log(`📡 URL: ${endpoint.url}`);
      
      try {
        const response = await fetch(`https://buildwise-backend.onrender.com${endpoint.url}`, {
          method: endpoint.method,
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        console.log(`📡 Status: ${response.status} ${response.statusText}`);
        console.log(`📡 Headers:`, Object.fromEntries(response.headers.entries()));
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`❌ API Error: ${errorText}`);
        } else {
          const data = await response.json();
          console.log('✅ API Response:', data);
          console.log('📊 Anzahl Einträge:', Array.isArray(data) ? data.length : 'N/A');
        }
      } catch (error) {
        console.error(`❌ Fehler bei ${endpoint.name}:`, error);
      }
    }
    
    return { success: true };
  } catch (error) {
    console.error('❌ Fehler:', error);
    return { success: false, error: error.message };
  }
}

// Teste User-Informationen
async function testUserInfo() {
  try {
    console.log('🔍 Teste User-Informationen...');
    
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('❌ Kein Token gefunden!');
      return { success: false, error: 'No token' };
    }
    
    const response = await fetch('https://buildwise-backend.onrender.com/api/v1/users/me', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`📡 User-API Status: ${response.status}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ User-API Error: ${errorText}`);
      return { success: false, error: errorText };
    }
    
    const userData = await response.json();
    console.log('✅ User-Daten:', userData);
    console.log('👤 User-Type:', userData.user_type);
    console.log('👤 Is Service Provider:', userData.user_type === 'SERVICE_PROVIDER');
    
    return { success: true, user: userData };
  } catch (error) {
    console.error('❌ User-API Fehler:', error);
    return { success: false, error: error.message };
  }
}

// Teste Projekte
async function testProjects() {
  try {
    console.log('🔍 Teste Projekte...');
    
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('❌ Kein Token gefunden!');
      return { success: false, error: 'No token' };
    }
    
    const response = await fetch('https://buildwise-backend.onrender.com/api/v1/projects/', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`📡 Projekte-API Status: ${response.status}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Projekte-API Error: ${errorText}`);
      return { success: false, error: errorText };
    }
    
    const projectsData = await response.json();
    console.log('✅ Projekte geladen:', projectsData);
    console.log('📊 Anzahl Projekte:', projectsData.length);
    
    return { success: true, projects: projectsData };
  } catch (error) {
    console.error('❌ Projekte-API Fehler:', error);
    return { success: false, error: error.message };
  }
}

// Umfassender Test
async function runComprehensiveMilestonesTest() {
  console.log('🚀 Starte umfassenden Milestones-Test...');
  
  const results = {
    userInfo: null,
    projects: null,
    milestones: null,
    summary: {}
  };
  
  // Teste User-Informationen
  results.userInfo = await testUserInfo();
  
  // Teste Projekte
  results.projects = await testProjects();
  
  // Teste Milestones-Endpunkte
  results.milestones = await testMilestonesEndpoints();
  
  // Zusammenfassung
  results.summary = {
    userValid: results.userInfo?.success || false,
    projectsLoaded: results.projects?.success || false,
    milestonesLoaded: results.milestones?.success || false,
    userType: results.userInfo?.user?.user_type || 'Unknown',
    projectCount: results.projects?.projects?.length || 0
  };
  
  console.log('📊 Test-Zusammenfassung:', results.summary);
  
  // Empfehlungen basierend auf Ergebnissen
  if (!results.summary.userValid) {
    console.error('💡 Problem: User-Informationen nicht verfügbar');
  }
  
  if (results.summary.projectCount === 0) {
    console.warn('⚠️ Warnung: Keine Projekte gefunden - möglicherweise keine Daten in der Datenbank');
  }
  
  if (!results.summary.milestonesLoaded) {
    console.error('💡 Problem: Milestones-API funktioniert nicht');
  }
  
  return results;
}

// Automatischer Test
console.log('🔧 Debug-Funktionen verfügbar:');
console.log('- testUserInfo() - Teste User-Informationen');
console.log('- testProjects() - Teste Projekte');
console.log('- testMilestonesEndpoints() - Teste Milestones-Endpunkte');
console.log('- runComprehensiveMilestonesTest() - Umfassender Test');

// Führe automatischen Test aus
runComprehensiveMilestonesTest(); 