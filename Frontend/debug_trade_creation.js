// Debug-Skript für Gewerk-Erstellung
// Führe dies in der Browser-Konsole aus

console.log('🔍 Debug: Gewerk-Erstellung - Problemdiagnose');

// Teste Backend-Verfügbarkeit
async function testBackendAvailability() {
  console.log('🔍 Teste Backend-Verfügbarkeit...');
  
  try {
    const response = await fetch('http://localhost:8000/api/v1/');
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

// Teste Milestones-Endpunkt
async function testMilestonesEndpoint() {
  console.log('🔍 Teste Milestones-Endpunkt...');
  
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('❌ Kein Token gefunden!');
      return { success: false, error: 'No token' };
    }
    
    const response = await fetch('http://localhost:8000/api/v1/milestones/?project_id=1', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`📡 Milestones API Status: ${response.status}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Milestones API Error: ${errorText}`);
      return { success: false, error: errorText, status: response.status };
    }
    
    const data = await response.json();
    console.log('✅ Milestones geladen:', data);
    console.log('📊 Anzahl Milestones:', data.length);
    
    return { success: true, data, count: data.length };
  } catch (error) {
    console.error('❌ Fehler:', error);
    return { success: false, error: error.message };
  }
}

// Teste Milestone-Erstellung
async function testMilestoneCreation() {
  console.log('🔍 Teste Milestone-Erstellung...');
  
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('❌ Kein Token gefunden!');
      return { success: false, error: 'No token' };
    }
    
    const testData = {
      title: 'Test Gewerk',
      description: 'Test Beschreibung',
      project_id: 1,
      status: 'planned',
      priority: 'medium',
      planned_date: '2024-12-31',
      category: 'eigene',
      notes: 'Test Notizen',
      is_critical: false,
      notify_on_completion: true
    };
    
    console.log('📡 Sende Test-Daten:', testData);
    
    const response = await fetch('http://localhost:8000/api/v1/milestones/', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testData)
    });
    
    console.log(`📡 Milestone-Erstellung Status: ${response.status}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Milestone-Erstellung Error: ${errorText}`);
      return { success: false, error: errorText, status: response.status };
    }
    
    const data = await response.json();
    console.log('✅ Milestone erfolgreich erstellt:', data);
    
    return { success: true, data };
  } catch (error) {
    console.error('❌ Fehler:', error);
    return { success: false, error: error.message };
  }
}

// Teste TradeCreationForm-Daten
function testTradeCreationFormData() {
  console.log('🔍 Teste TradeCreationForm-Daten...');
  
  // Simuliere die Daten, die von der TradeCreationForm gesendet werden
  const mockTradeData = {
    title: 'Elektroinstallation Erdgeschoss',
    description: 'Vollständige Elektroinstallation für das Erdgeschoss',
    project_id: 1,
    category: 'elektro',
    priority: 'medium',
    planned_date: '2024-12-31',
    notes: 'Test Notizen',
    category_specific_fields: {
      electrical_voltage: '230V',
      electrical_power: '10',
      electrical_circuits: 5,
      electrical_switches: 8,
      electrical_outlets: 12,
      electrical_lighting_points: 15
    },
    documents: [],
    technical_specifications: 'Technische Spezifikationen',
    quality_requirements: 'Qualitätsanforderungen',
    safety_requirements: 'Sicherheitsanforderungen',
    environmental_requirements: 'Umweltanforderungen'
  };
  
  console.log('📊 Mock TradeCreationForm-Daten:', mockTradeData);
  
  // Teste die Transformation zu Milestone-Daten
  const milestoneData = {
    title: mockTradeData.title,
    description: mockTradeData.description,
    project_id: mockTradeData.project_id,
    status: 'planned',
    priority: mockTradeData.priority,
    planned_date: mockTradeData.planned_date,
    category: mockTradeData.category,
    notes: mockTradeData.notes,
    is_critical: false,
    notify_on_completion: true
  };
  
  console.log('📊 Transformierte Milestone-Daten:', milestoneData);
  
  return { mockTradeData, milestoneData };
}

// Umfassender Test
async function runTradeCreationDebug() {
  console.log('🚀 Starte umfassenden TradeCreation-Debug...');
  
  const results = {
    backendAvailable: false,
    milestonesEndpoint: null,
    milestoneCreation: null,
    formData: null
  };
  
  // Teste Backend-Verfügbarkeit
  results.backendAvailable = await testBackendAvailability();
  
  if (!results.backendAvailable) {
    console.error('💥 Backend ist nicht verfügbar - starte Backend zuerst!');
    return results;
  }
  
  // Teste Milestones-Endpunkt
  results.milestonesEndpoint = await testMilestonesEndpoint();
  
  // Teste Milestone-Erstellung
  results.milestoneCreation = await testMilestoneCreation();
  
  // Teste Form-Daten
  results.formData = testTradeCreationFormData();
  
  // Empfehlungen basierend auf Ergebnissen
  if (!results.milestonesEndpoint?.success) {
    console.error('💡 Problem: Milestones-Endpunkt funktioniert nicht');
  }
  
  if (!results.milestoneCreation?.success) {
    console.error('💡 Problem: Milestone-Erstellung funktioniert nicht');
  }
  
  console.log('📊 Debug-Ergebnisse:', results);
  
  return results;
}

// Automatischer Test
console.log('🔧 Debug-Funktionen verfügbar:');
console.log('- testBackendAvailability() - Teste Backend-Verfügbarkeit');
console.log('- testMilestonesEndpoint() - Teste Milestones-Endpunkt');
console.log('- testMilestoneCreation() - Teste Milestone-Erstellung');
console.log('- testTradeCreationFormData() - Teste Form-Daten');
console.log('- runTradeCreationDebug() - Umfassender Test');

// Führe automatischen Test aus
runTradeCreationDebug(); 