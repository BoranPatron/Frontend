// Debug-Script für Bauträger-Dokumentenanzeige
// Führe dieses Script in der Browser-Konsole aus, wenn die TradeDetailsModal geöffnet ist

console.log("🔍 Debug: Bauträger-Dokumentenanzeige");
console.log("=" * 50);

// Prüfe ob wir in der TradeDetailsModal sind
const modal = document.querySelector('[class*="TradeDetailsModal"]') || 
              document.querySelector('[class*="fixed inset-0"]');

if (modal) {
    console.log("✅ TradeDetailsModal gefunden");
    
    // Prüfe Dokumente-Sektion
    const documentsSection = modal.querySelector('[class*="Dokumente"]') ||
                           Array.from(modal.querySelectorAll('*')).find(el => 
                               el.textContent && el.textContent.includes('Dokumente'));
    
    if (documentsSection) {
        console.log("✅ Dokumente-Sektion gefunden:", documentsSection);
        console.log("📄 Inhalt:", documentsSection.textContent);
    } else {
        console.log("❌ Dokumente-Sektion nicht gefunden");
    }
    
    // Prüfe auf Ladeindikator
    const loadingIndicator = modal.querySelector('[class*="animate-spin"]');
    if (loadingIndicator) {
        console.log("🔄 Ladeindikator gefunden - Dokumente werden geladen");
    }
    
    // Prüfe auf Fehlermeldungen
    const errorMessage = modal.querySelector('[class*="text-red"]');
    if (errorMessage) {
        console.log("❌ Fehlermeldung gefunden:", errorMessage.textContent);
    }
    
} else {
    console.log("❌ TradeDetailsModal nicht gefunden");
}

// Prüfe localStorage für Token
const token = localStorage.getItem('token');
if (token) {
    console.log("✅ Token gefunden:", token.substring(0, 20) + "...");
} else {
    console.log("❌ Kein Token gefunden");
}

// Prüfe aktuelle Route/URL
console.log("📍 Aktuelle URL:", window.location.href);

// Prüfe React DevTools falls verfügbar
if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
    console.log("✅ React DevTools verfügbar");
} else {
    console.log("⚠️ React DevTools nicht verfügbar");
}

console.log("\n💡 Tipp: Öffne die Netzwerk-Registerkarte und schaue nach:");
console.log("- API-Aufrufe zu /milestones/");
console.log("- API-Aufrufe zu /milestones/{id}");
console.log("- Antworten mit Dokumenten-Daten");