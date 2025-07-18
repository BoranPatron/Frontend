// Debug-Skript für PDF-Download-Problem in BuildWise-Gebühren
console.log('🔍 Debug: PDF-Download-Problem Analyse gestartet');

// Funktion zum Debuggen der Auth-Context
function debugAuthContext() {
  console.log('🔍 Debug: Auth-Context Analyse...');
  
  const token = localStorage.getItem('token');
  console.log('Token vorhanden:', !!token);
  console.log('Token Länge:', token ? token.length : 0);
  
  if (token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      console.log('Token Payload:', payload);
      console.log('User ID:', payload.sub);
      console.log('Exp:', new Date(payload.exp * 1000));
    } catch (e) {
      console.error('Token Parsing Fehler:', e);
    }
  }
}

// Funktion zum Testen der BuildWise-Gebühren API
async function testBuildWiseFeesAPI() {
  console.log('🔍 Debug: Teste BuildWise-Gebühren API...');
  
  try {
    const response = await fetch('/api/v1/buildwise-fees/', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('API Response Status:', response.status);
    console.log('API Response Headers:', Object.fromEntries(response.headers.entries()));
    
    if (response.ok) {
      const data = await response.json();
      console.log('Gebühren geladen:', data);
      console.log('Anzahl Gebühren:', data.length);
      
      if (data.length > 0) {
        const firstFee = data[0];
        console.log('Erste Gebühr:', firstFee);
        console.log('PDF generiert:', firstFee.invoice_pdf_generated);
        console.log('PDF Pfad:', firstFee.invoice_pdf_path);
        
        return firstFee.id;
      }
    } else {
      const errorText = await response.text();
      console.error('API Fehler:', errorText);
    }
  } catch (error) {
    console.error('API Call Fehler:', error);
  }
  
  return null;
}

// Funktion zum Testen der PDF-Generierung
async function testPDFGeneration(feeId) {
  console.log('🔍 Debug: Teste PDF-Generierung für Gebühr:', feeId);
  
  try {
    const response = await fetch(`/api/v1/buildwise-fees/${feeId}/generate-invoice`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('PDF-Generierung Status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('PDF-Generierung Response:', data);
      return true;
    } else {
      const errorText = await response.text();
      console.error('PDF-Generierung Fehler:', errorText);
    }
  } catch (error) {
    console.error('PDF-Generierung Call Fehler:', error);
  }
  
  return false;
}

// Funktion zum Testen des PDF-Downloads
async function testPDFDownload(feeId) {
  console.log('🔍 Debug: Teste PDF-Download für Gebühr:', feeId);
  
  try {
    // Teste Download-Endpoint
    const downloadResponse = await fetch(`/api/v1/buildwise-fees/${feeId}/download-invoice`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Download-Endpoint Status:', downloadResponse.status);
    
    if (downloadResponse.ok) {
      const downloadData = await downloadResponse.json();
      console.log('Download-Endpoint Response:', downloadData);
      
      // Teste PDF-Datei-Download
      const pdfResponse = await fetch(`/api/v1/buildwise-fees/${feeId}/invoice.pdf`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      console.log('PDF-Datei Status:', pdfResponse.status);
      console.log('PDF-Datei Headers:', Object.fromEntries(pdfResponse.headers.entries()));
      
      if (pdfResponse.ok) {
        const blob = await pdfResponse.blob();
        console.log('PDF Blob Größe:', blob.size);
        console.log('PDF Blob Type:', blob.type);
        
        // Erstelle Download-Link
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `buildwise_invoice_${feeId}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        console.log('✅ PDF-Download erfolgreich!');
        return true;
      } else {
        const errorText = await pdfResponse.text();
        console.error('PDF-Datei Fehler:', errorText);
      }
    } else {
      const errorText = await downloadResponse.text();
      console.error('Download-Endpoint Fehler:', errorText);
    }
  } catch (error) {
    console.error('PDF-Download Call Fehler:', error);
  }
  
  return false;
}

// Funktion zum Debuggen der Frontend-Komponente
function debugFrontendComponent() {
  console.log('🔍 Debug: Frontend-Komponente Analyse...');
  
  // Suche nach BuildWise-Gebühren-Seite
  const buildWiseFeesPage = document.querySelector('[data-testid="service-provider-buildwise-fees"]') || 
                            document.querySelector('.min-h-screen');
  
  if (buildWiseFeesPage) {
    console.log('BuildWise-Gebühren-Seite gefunden');
    
    // Suche nach Download-Buttons
    const downloadButtons = buildWiseFeesPage.querySelectorAll('button[title*="PDF"], button[title*="Download"], button[title*="Rechnung"]');
    console.log('Download-Buttons gefunden:', downloadButtons.length);
    
    downloadButtons.forEach((button, index) => {
      console.log(`Button ${index + 1}:`, {
        text: button.textContent,
        title: button.title,
        onclick: button.onclick,
        disabled: button.disabled
      });
    });
    
    // Suche nach Tabellen
    const tables = buildWiseFeesPage.querySelectorAll('table');
    console.log('Tabellen gefunden:', tables.length);
    
    tables.forEach((table, index) => {
      const rows = table.querySelectorAll('tr');
      console.log(`Tabelle ${index + 1}: ${rows.length} Zeilen`);
      
      // Suche nach Gebühren-Zeilen
      rows.forEach((row, rowIndex) => {
        const cells = row.querySelectorAll('td');
        if (cells.length > 0) {
          console.log(`Zeile ${rowIndex}: ${cells.length} Zellen`);
          
          // Suche nach Gebühren-ID
          const feeIdMatch = row.textContent.match(/BW-(\d+)/);
          if (feeIdMatch) {
            console.log(`Gebühren-ID gefunden: ${feeIdMatch[1]}`);
          }
        }
      });
    });
  } else {
    console.log('BuildWise-Gebühren-Seite nicht gefunden');
  }
}

// Funktion zum Testen der Service-Funktionen
async function testServiceFunctions() {
  console.log('🔍 Debug: Teste Service-Funktionen...');
  
  // Teste buildwiseFeeService
  if (window.buildwiseFeeService) {
    console.log('buildwiseFeeService verfügbar');
    
    try {
      const fees = await window.buildwiseFeeService.getBuildWiseFees();
      console.log('Service: Gebühren geladen:', fees);
      
      if (fees.length > 0) {
        const feeId = fees[0].id;
        console.log('Teste mit Gebühr ID:', feeId);
        
        // Teste PDF-Generierung
        const generateResult = await window.buildwiseFeeService.generateInvoice(feeId);
        console.log('Service: PDF-Generierung:', generateResult);
        
        // Teste PDF-Download
        const downloadResult = await window.buildwiseFeeService.downloadInvoice(feeId);
        console.log('Service: PDF-Download:', downloadResult);
      }
    } catch (error) {
      console.error('Service-Funktionen Fehler:', error);
    }
  } else {
    console.log('buildwiseFeeService nicht verfügbar');
  }
}

// Hauptfunktion
async function runPDFDownloadDebug() {
  console.log('🚀 Starte PDF-Download Debug...');
  
  // 1. Auth-Context debuggen
  debugAuthContext();
  
  // 2. Frontend-Komponente debuggen
  debugFrontendComponent();
  
  // 3. API testen
  const feeId = await testBuildWiseFeesAPI();
  
  if (feeId) {
    // 4. PDF-Generierung testen
    const generationSuccess = await testPDFGeneration(feeId);
    
    if (generationSuccess) {
      // 5. PDF-Download testen
      await testPDFDownload(feeId);
    }
  }
  
  // 6. Service-Funktionen testen
  await testServiceFunctions();
  
  console.log('✅ PDF-Download Debug abgeschlossen');
}

// Exportiere Funktionen für manuelle Tests
window.debugPDFDownload = {
  debugAuthContext,
  testBuildWiseFeesAPI,
  testPDFGeneration,
  testPDFDownload,
  debugFrontendComponent,
  testServiceFunctions,
  runPDFDownloadDebug
};

// Auto-Start wenn gewünscht
if (window.location.search.includes('debug=pdf')) {
  setTimeout(runPDFDownloadDebug, 1000);
}

console.log('📋 PDF-Download Debug-Skript geladen');
console.log('💡 Verwende: debugPDFDownload.runPDFDownloadDebug() für manuellen Start'); 