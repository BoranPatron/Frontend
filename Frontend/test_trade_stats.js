// Test-Datei für Trade-Statistiken Debugging
console.log('🔍 Teste Trade-Statistiken...');

// Simuliere Browser-Umgebung
if (typeof window === 'undefined') {
  global.window = {};
  global.localStorage = {
    getItem: (key) => {
      console.log(`🔍 localStorage.getItem(${key})`);
      return null;
    },
    setItem: (key, value) => {
      console.log(`🔍 localStorage.setItem(${key}, ${value})`);
    }
  };
}

// Test-Funktion für getQuotesForMilestone
async function testGetQuotesForMilestone(tradeId) {
  console.log(`🔍 Teste getQuotesForMilestone für Trade ${tradeId}`);
  
  try {
    // Simuliere API-Aufruf
    const mockQuotes = [
      {
        id: 1,
        title: 'Test Angebot',
        total_amount: 5000,
        currency: 'EUR',
        status: 'accepted',
        company_name: 'Test Firma',
        contact_person: 'Max Mustermann',
        created_at: '2025-01-24T10:00:00Z',
        valid_until: '2025-02-24T10:00:00Z'
      }
    ];
    
    console.log(`✅ Mock-Quotes für Trade ${tradeId}:`, mockQuotes);
    
    const acceptedQuote = mockQuotes.find(q => q.status === 'accepted');
    console.log(`✅ Angenommenes Angebot:`, acceptedQuote);
    
    return mockQuotes;
  } catch (error) {
    console.error(`❌ Fehler beim Testen:`, error);
    return [];
  }
}

// Teste die Funktion
testGetQuotesForMilestone(1).then(quotes => {
  console.log(`📊 Ergebnis: ${quotes.length} Angebote gefunden`);
  console.log(`✅ Angenommenes Angebot:`, quotes.find(q => q.status === 'accepted'));
});

console.log('✅ Test-Datei geladen'); 