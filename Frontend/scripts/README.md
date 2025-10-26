# Contextual Onboarding CLI Commands

## Verfügbare Commands

```bash
# Zeige Hilfe
npm run onboarding
npm run onboarding:help

# Zeige Status
npm run onboarding:status

# Reset-Hinweise
npm run onboarding:reset
```

## Development Debug Functions

### Im Browser Console:

```javascript
// Reset Onboarding für aktuellen User
window.resetContextualOnboarding();

// Zeige Onboarding-Status
window.checkOnboardingProgress();
```

## Manual Reset (LocalStorage)

Falls die Debug-Functions nicht verfügbar sind:

```javascript
// Im Browser Console
localStorage.clear(); // Vorsicht: Löscht ALLE localStorage Daten!
window.location.reload();
```

## Production Onboarding Reset (Database)

Für einen vollständigen Reset aller Users:

```sql
-- PostgreSQL Query
UPDATE users 
SET consent_fields = consent_fields - 'contextual_onboarding'
WHERE consent_fields ? 'contextual_onboarding';
```

## Troubleshooting

### Onboarding erscheint nicht
1. Prüfe ob `data-feature-id` gesetzt ist
2. Überprüfe Feature-Definition in `onboardingFeatures.ts`
3. Console für Linter-Fehler prüfen

### Reset funktioniert nicht
1. Prüfe Browser-Console für Fehler
2. LocalStorage manuell leeren
3. Page hard-refresh (Ctrl+Shift+R)

## Mehr Informationen

Siehe `CONTEXTUAL_ONBOARDING.md` für vollständige Dokumentation.

