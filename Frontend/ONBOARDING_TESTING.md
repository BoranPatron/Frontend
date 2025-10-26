# Contextual Onboarding - Testanleitung

## 🔧 Vor dem Testen

### 1. LocalStorage leeren
```javascript
// Im Browser Console
localStorage.clear();
window.location.reload();
```

### 2. Debug-Functions verfügbar machen
Die App muss im Development-Mode laufen:
```bash
npm run dev
```

## 📊 Debug Commands (Browser Console)

### Basis-Commands
```javascript
// Status anzeigen
window.checkOnboardingProgress();

// Alle Features auflisten
window.listOnboardingFeatures();

// Onboarding zurücksetzen
window.resetContextualOnboarding();

// Feature manuell triggern
window.showOnboardingFeature('radial-menu-fab');
```

## 🧪 Testablauf Bauträger

### Test 1: Radial Menu (Priority 1)
**Feature ID:** `radial-menu-fab`
**Trigger:** Hover (1000ms delay)

**Schritte:**
1. ✅ Dashboard öffnen
2. ✅ Rechts unten das FAB (Floating Action Button) finden
3. ✅ Hotspot sollte sichtbar sein (pulsierender Punkt)
4. ✅ Mit Maus über FAB hovern (1 Sekunde warten)
5. ✅ Tooltip sollte erscheinen: "Dein Kommandozentrum 🎯"
6. ✅ Tooltip hat "Verstanden" Button
7. ✅ Progress-Indicator zeigt "1 von 7 Features"

**Console prüfen:**
```javascript
// Sollte erscheinen:
🏗️ DashboardOnboardingOverlay mounted
✨ InteractiveHotspot rendered: radial-menu-fab
🎯 ContextualTooltip mounted: radial-menu-fab
```

**Manueller Test:**
```javascript
window.showOnboardingFeature('radial-menu-fab');
```

---

### Test 2: Projekt erstellen (Priority 2)
**Feature ID:** `create-project-button`
**Trigger:** Hover

**Schritte:**
1. ✅ Radial Menu öffnen (auf FAB klicken)
2. ✅ "Projekt erstellen" Button finden
3. ✅ Hotspot sollte sichtbar sein
4. ✅ Mit Maus über Button hovern
5. ✅ Tooltip sollte erscheinen: "Starte dein erstes Projekt 🏗️"

**Voraussetzung:**
- Element muss `data-feature-id="create-project-button"` haben

---

### Test 3: Ausschreibung starten (Priority 3)
**Feature ID:** `create-trade-button`
**Trigger:** Hover

**Schritte:**
1. ✅ Radial Menu öffnen
2. ✅ "Ausschreibung erstellen" Button finden
3. ✅ Hotspot sollte sichtbar sein
4. ✅ Mit Maus über Button hovern
5. ✅ Tooltip: "Ausschreibung starten 📋"

---

### Test 4: Dokumente hochladen (Priority 4)
**Feature ID:** `document-upload-button`
**Trigger:** Hover

**Schritte:**
1. ✅ Radial Menu öffnen
2. ✅ "Dokument hochladen" Button finden
3. ✅ KEIN Hotspot (showHotspot: false)
4. ✅ Hover zeigt Tooltip: "Dokumente hochladen 📁"

---

### Test 5: Kanban Board (Priority 5)
**Feature ID:** `kanban-board-tab`
**Trigger:** Click

**Schritte:**
1. ✅ "Kanban" Tab im Dashboard finden
2. ✅ KEIN Hotspot
3. ✅ Auf Tab klicken
4. ✅ Tooltip: "Aufgaben organisieren 📊"

---

### Test 6: Benachrichtigungen (Priority 6)
**Feature ID:** `notification-icon`
**Trigger:** Hover

**Schritte:**
1. ✅ Benachrichtigungs-Icon in der Navbar finden
2. ✅ KEIN Hotspot
3. ✅ Hover zeigt Tooltip: "Benachrichtigungen 🔔"

---

### Test 7: Finanzen (Priority 7)
**Feature ID:** `finance-widget`
**Trigger:** Mount (3000ms delay)

**Schritte:**
1. ✅ Dashboard öffnen
2. ✅ KEIN Hotspot
3. ✅ Nach 3 Sekunden erscheint automatisch Tooltip: "Finanzen im Blick 💰"

---

## 🧪 Testablauf Dienstleister

### Test 1: Radial Menu (Priority 1)
**Feature ID:** `radial-menu-fab`
**Trigger:** Hover (1000ms delay)

**Gleich wie Bauträger, aber Text:**
"Dein Werkzeug-Center 🛠️"

---

### Test 2: Auftragssuche (Priority 2)
**Feature ID:** `search-trades-section`
**Trigger:** Mount (2000ms delay)

**Schritte:**
1. ✅ Service Provider Dashboard öffnen
2. ✅ Hotspot sollte bei Suchbereich erscheinen
3. ✅ Nach 2 Sekunden automatisch Tooltip: "Aufträge finden 🎯"

---

### Test 3: Geo-Map (Priority 3)
**Feature ID:** `geo-map-tab`
**Trigger:** Click

**Schritte:**
1. ✅ "Karte" Tab finden
2. ✅ KEIN Hotspot
3. ✅ Auf Tab klicken
4. ✅ Tooltip: "Geografische Suche 🗺️"

---

### Test 4: Angebot erstellen (Priority 4)
**Feature ID:** `create-quote-button`
**Trigger:** Hover

---

### Test 5: Verfügbarkeit (Priority 5)
**Feature ID:** `resource-management-section`
**Trigger:** Mount (4000ms delay)

---

### Test 6: Benachrichtigungen (Priority 6)
**Feature ID:** `notification-icon`
**Trigger:** Hover

---

## 🐛 Troubleshooting

### Problem 1: Keine Tooltips/Hotspots sichtbar

**Checkliste:**
```javascript
// 1. Context prüfen
window.checkOnboardingProgress();
// Erwartung: totalFeatures > 0, discoveredCount < totalFeatures

// 2. Features auflisten
window.listOnboardingFeatures();
// Erwartung: Liste aller Features mit Status

// 3. Console prüfen
// Suche nach:
🏗️ DashboardOnboardingOverlay mounted
⚠️ Element not found for feature: XXX
```

**Häufige Ursachen:**
- ❌ User hat keine Rolle gesetzt (`user_role` ist null)
- ❌ Features bereits in localStorage als discovered markiert
- ❌ `data-feature-id` Attribut fehlt im HTML
- ❌ Element ist noch nicht im DOM

**Fixes:**
```javascript
// LocalStorage leeren
localStorage.clear();
window.location.reload();

// Oder nur Onboarding resetten
window.resetContextualOnboarding();
```

---

### Problem 2: Element nicht gefunden

**Console zeigt:**
```
⚠️ Element not found for feature: create-project-button
```

**Fix:**
1. Element im DOM suchen:
```javascript
document.querySelector('[data-feature-id="create-project-button"]');
// Sollte nicht null sein
```

2. Wenn null → `data-feature-id` Attribut fehlt
3. Prüfe ob Element dynamisch geladen wird (z.B. in Radial Menu)

---

### Problem 3: Tooltip hinter anderen Elementen

**Fix ist bereits implementiert:**
- Tooltip: `z-index: 99999`
- Hotspot: `z-index: 99998`

**Manuell prüfen:**
```javascript
// Console
const tooltip = document.querySelector('[role="tooltip"]');
console.log(window.getComputedStyle(tooltip).zIndex);
// Sollte 99999 sein
```

---

### Problem 4: Features werden sofort als "discovered" markiert

**Console zeigt:**
```
ℹ️ Feature radial-menu-fab already discovered, skipping
```

**Fix:**
```javascript
// LocalStorage für User prüfen
Object.keys(localStorage).filter(k => k.includes('feature_discovery'));
// Sollte leer sein für neuen User

// Leeren
localStorage.clear();
```

---

## 📈 Success Metrics

### Nach kompletter Tour sollte:
- ✅ Alle 7 Features (Bauträger) oder 6 Features (Dienstleister) discovered
- ✅ `progressPercentage` = 100%
- ✅ `isComplete` = true
- ✅ Database: `consent_fields.contextual_onboarding.completed` = true

### Console Check:
```javascript
window.checkOnboardingProgress();
// Erwartung:
{
  progressPercentage: '100%',
  isComplete: true,
  discoveredCount: 7 (oder 6)
}
```

---

## 🔄 Reset für erneutes Testen

### Vollständiger Reset:
```javascript
// 1. LocalStorage
localStorage.clear();

// 2. Database (optional, via pgAdmin):
UPDATE users 
SET consent_fields = consent_fields - 'contextual_onboarding'
WHERE id = YOUR_USER_ID;

// 3. Page reload
window.location.reload();
```

### Schneller Reset (nur für aktuellen User):
```javascript
window.resetContextualOnboarding();
window.location.reload();
```

---

## 📝 Checklist für neues Feature

Wenn du ein neues Feature hinzufügen willst:

1. ✅ In `onboardingFeatures.ts` definieren
2. ✅ `data-feature-id` Attribut zum HTML-Element hinzufügen
3. ✅ Testen mit `window.showOnboardingFeature('your-feature-id')`
4. ✅ Z-Index prüfen (sollte < 99998 sein)
5. ✅ Event-Listener prüfen (hover/click/focus/mount)
6. ✅ Console-Logs prüfen

---

## 🎯 Quick Test Script

Kopiere in Console für schnellen Test:
```javascript
// Quick Test
console.log('🧪 Starting Onboarding Quick Test...');

// 1. Reset
window.resetContextualOnboarding();
console.log('✅ Reset completed');

// 2. Check Status
window.checkOnboardingProgress();

// 3. List Features
window.listOnboardingFeatures();

// 4. Test first feature
setTimeout(() => {
  window.showOnboardingFeature('radial-menu-fab');
  console.log('✅ First feature triggered');
}, 1000);

console.log('🧪 Test completed. Check for tooltips!');
```

---

## 📞 Support

Bei Problemen:
1. Console-Logs prüfen
2. `window.checkOnboardingProgress()` ausführen
3. CONTEXTUAL_ONBOARDING.md lesen
4. GitHub Issue erstellen mit Console-Logs

