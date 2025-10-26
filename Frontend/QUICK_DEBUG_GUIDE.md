# 🚀 Quick Debug Guide - Contextual Onboarding

## Sofort-Diagnose (2 Minuten)

### 1. Browser Console öffnen (F12)

### 2. Diese Befehle ausführen:

```javascript
// Status prüfen
window.checkOnboardingProgress();
```

**Was du sehen solltest:**
```javascript
{
  role: "BAUTRAEGER", // oder "DIENSTLEISTER"
  userId: 123,
  totalFeatures: 7, // oder 6 für Dienstleister
  discoveredCount: 0, // bei neuem User
  progressPercentage: "0%",
  isComplete: false,
  features: [...]
}
```

**❌ Probleme:**
- `totalFeatures: 0` → Context nicht geladen oder keine Rolle
- `discoveredCount === totalFeatures` → Bereits abgeschlossen, resetten
- `role: null` → User hat keine Rolle

---

### 3. Features auflisten:

```javascript
window.listOnboardingFeatures();
```

**Was du sehen solltest:**
Tabelle mit allen Features und Status:
```
| ID                  | Title                    | Discovered | Hotspot | Trigger |
|---------------------|--------------------------|------------|---------|---------|
| radial-menu-fab     | Dein Kommandozentrum     | ❌         | 🔆      | hover   |
| create-project...   | Starte dein erstes...    | ❌         | 🔆      | hover   |
```

---

### 4. Console-Logs prüfen:

**Beim Laden sollte erscheinen:**
```
🏗️ DashboardOnboardingOverlay mounted: { totalFeatures: 7, ... }
📊 Onboarding state update: { totalFeatures: 7, discoveredCount: 0, ... }
🔧 Setting up event listeners for features: [...]
✅ Setting up listener for: radial-menu-fab (trigger: hover)
✅ Setting up listener for: create-project-button (trigger: hover)
```

**❌ Wenn du siehst:**
```
⚠️ Element not found for feature: radial-menu-fab
```
→ `data-feature-id` Attribut fehlt im HTML

---

## 🔥 Schnelle Lösungen

### Problem: Keine Tooltips sichtbar

**Lösung 1: Reset**
```javascript
window.resetContextualOnboarding();
window.location.reload();
```

**Lösung 2: Kompletter Reset**
```javascript
localStorage.clear();
window.location.reload();
```

**Lösung 3: Feature manuell triggern**
```javascript
window.showOnboardingFeature('radial-menu-fab');
```

---

### Problem: "Element not found"

**Diagnose:**
```javascript
// Prüfe ob Element existiert
document.querySelector('[data-feature-id="radial-menu-fab"]');
```

**Wenn null:**
1. Element ist noch nicht im DOM (zu früh geladen)
2. `data-feature-id` Attribut fehlt
3. Element ist dynamisch und noch nicht gerendert

**Fix:**
Warte bis Element geladen ist:
```javascript
setTimeout(() => {
  window.showOnboardingFeature('radial-menu-fab');
}, 2000);
```

---

### Problem: Tooltip hinter anderem Element

**Prüfen:**
```javascript
const tooltip = document.querySelector('[role="tooltip"]');
if (tooltip) {
  console.log('Z-Index:', window.getComputedStyle(tooltip).zIndex);
  // Sollte 99999 sein
}
```

**Fix (bereits implementiert):**
- Tooltips haben z-index: 99999
- Hotspots haben z-index: 99998

---

### Problem: Features sofort als "discovered"

**Prüfen:**
```javascript
// Zeige alle Onboarding-Keys in localStorage
Object.keys(localStorage).filter(k => k.includes('feature_discovery'));
```

**Fix:**
```javascript
// Nur Onboarding resetten (behält andere Daten)
window.resetContextualOnboarding();

// Oder komplett leeren
localStorage.clear();
```

---

## 🧪 Manueller Test

### Test alle Features nacheinander:

```javascript
// Bauträger Features
const bautraegerFeatures = [
  'radial-menu-fab',
  'create-project-button',
  'create-trade-button',
  'document-upload-button',
  'kanban-board-tab',
  'notification-icon',
  'finance-widget'
];

// Test alle Features mit 2 Sekunden Pause
bautraegerFeatures.forEach((id, index) => {
  setTimeout(() => {
    console.log(`Testing ${index + 1}/7: ${id}`);
    window.showOnboardingFeature(id);
  }, index * 2000);
});
```

---

## 📊 Live Monitoring

### Console-Filter verwenden:

1. Browser Console öffnen
2. Filter eingeben: `onboarding` oder `🏗️` oder `🎯`
3. Nur relevante Logs werden angezeigt

### Wichtige Log-Icons:
- `🏗️` - Overlay mounted
- `📊` - State update
- `🔧` - Event listener setup
- `✅` - Listener erfolgreich registriert
- `⚠️` - Warnung (Element nicht gefunden)
- `🔆` - Hotspot gerendert
- `🎯` - Tooltip gerendert/triggered
- `✨` - Hotspot-Koordinaten

---

## 🎯 Erfolgs-Check

### Nach jedem Feature sollte:

```javascript
window.checkOnboardingProgress();
// discoveredCount sollte +1 sein
```

### Nach allen Features:
```javascript
window.checkOnboardingProgress();
// Erwartung:
{
  progressPercentage: "100%",
  discoveredCount: 7, // oder 6
  isComplete: true
}
```

---

## 🚨 Wenn NICHTS funktioniert

### Kompletter Neustart:

```javascript
// 1. Alles leeren
localStorage.clear();
sessionStorage.clear();

// 2. Page reload
window.location.reload();

// 3. Nach Reload (5 Sekunden warten):
setTimeout(() => {
  console.log('=== DIAGNOSTIC START ===');
  window.checkOnboardingProgress();
  window.listOnboardingFeatures();
  console.log('=== DIAGNOSTIC END ===');
}, 5000);
```

### User-Rolle prüfen:

```javascript
// Im Console nach Page-Load
const user = JSON.parse(localStorage.getItem('user') || '{}');
console.log('User Role:', user.user_role);
// Sollte "BAUTRAEGER" oder "DIENSTLEISTER" sein
```

**Wenn null:**
→ User hat keine Rolle gesetzt
→ Rolle muss zuerst über RoleSelectionModal gesetzt werden

---

## 📞 Hilfe anfordern

Wenn nichts funktioniert, kopiere diese Debug-Infos:

```javascript
// Alle Debug-Infos sammeln
const debugInfo = {
  onboarding: window.checkOnboardingProgress(),
  localStorage: Object.keys(localStorage).filter(k => k.includes('onboarding') || k.includes('feature')),
  radialMenuExists: !!document.querySelector('[data-feature-id="radial-menu-fab"]'),
  tooltipElements: document.querySelectorAll('[role="tooltip"]').length,
  hotspotElements: document.querySelectorAll('[class*="z-[99998]"]').length,
  consoleErrors: 'Check console for red errors'
};

console.log('=== DEBUG INFO FOR SUPPORT ===');
console.log(JSON.stringify(debugInfo, null, 2));
console.log('=== END DEBUG INFO ===');
```

Kopiere Output und erstelle GitHub Issue.

---

## 🎓 Lern-Modus

### Verstehe den Flow:

1. **Page Load** → `ContextualOnboardingContext` wird initialisiert
2. **Dashboard Mount** → `DashboardOnboardingOverlay` wird gerendert
3. **Feature Scan** → Sucht alle `[data-feature-id]` Elemente
4. **Event Listener** → Registriert hover/click/focus Handler
5. **User Interaktion** → Tooltip wird getriggert
6. **Discovery** → Feature wird als "discovered" markiert
7. **Persistence** → LocalStorage + DB Sync
8. **Completion** → Nach allen Features automatisch complete

### Console-Output verstehen:

```
🏗️ Overlay mounted → Dashboard geladen
✅ Listener registered → Feature bereit
🔆 Hotspot rendered → Visueller Indikator aktiv
🎯 Tooltip mounted → User hat interagiert
📊 State update → Discovery-Status aktualisiert
```

---

## ✨ Pro-Tipps

1. **Browser-Cache leeren** nach Code-Änderungen (Ctrl+Shift+R)
2. **Inkognito-Modus** für saubere Tests
3. **Console-Filter** verwenden für bessere Übersicht
4. **Network-Tab** prüfen für API-Fehler
5. **React DevTools** installieren für Context-Inspektion

---

## 🔗 Weiterführende Docs

- **ONBOARDING_TESTING.md** - Vollständige Testanleitung
- **CONTEXTUAL_ONBOARDING.md** - Architektur & Integration
- **scripts/README.md** - CLI Commands

