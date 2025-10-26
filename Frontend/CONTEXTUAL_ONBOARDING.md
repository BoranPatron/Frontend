# Contextual Onboarding System

## Überblick

Das neue Contextual Onboarding System ersetzt die alte Guided Tour durch einen modernen, unaufdringlichen Ansatz, der Nutzer durch natürliche Interaktion statt erzwungene Tours führt.

## Kernprinzipien

1. **Non-Intrusive**: Tooltips blockieren nie die UI
2. **Contextual**: Erscheinen nur wenn relevant
3. **Dismissible**: User hat immer die Kontrolle
4. **Beautiful**: Glassmorphism + Glow-Effekte
5. **Smart**: Lernt von User-Verhalten

## Architektur

### Components

- **ContextualTooltip.tsx**: Moderner Tooltip mit Glassmorphism-Design
- **InteractiveHotspot.tsx**: Pulsierender Indikator für wichtige Features
- **DashboardOnboardingOverlay.tsx**: Verwaltet alle Tooltips/Hotspots
- **FeatureWrapper.tsx**: Wrapper für einzelne Features (optional)

### Context & Hooks

- **ContextualOnboardingContext**: State Management für Feature-Discovery
- **useFeatureDiscovery**: Hook für Feature-Tracking
- **useContextualOnboarding**: Hook für Components

### Configuration

- **onboardingFeatures.ts**: Definition aller Features mit Prioritäten

## User Experience Flow

1. User meldet sich an → **Kein Modal, kein Overlay**
2. User bewegt Maus über Radial Menu → **Hotspot pulsiert**
3. User klickt Radial Menu → **Tooltip erscheint**: "Dein Kommandozentrum"
4. User erkundet → **Weitere Tooltips erscheinen bei Bedarf**
5. Nach allen Features → **Automatische Completion**

## Feature Definition

```typescript
{
  id: 'radial-menu-fab',
  title: 'Dein Kommandozentrum 🎯',
  description: 'Alle wichtigen Aktionen an einem Ort...',
  priority: 1,
  userRole: 'BAUTRAEGER',
  placement: 'left',
  showHotspot: true,
  triggerOn: 'hover',
  delay: 1000
}
```

## Integration

### 1. UI-Element markieren

```tsx
<button data-feature-id="radial-menu-fab">
  Menü
</button>
```

### 2. Overlay einbinden

```tsx
import DashboardOnboardingOverlay from '../components/Onboarding/DashboardOnboardingOverlay';

function Dashboard() {
  return (
    <>
      {/* Your dashboard content */}
      <DashboardOnboardingOverlay />
    </>
  );
}
```

### 3. Context Provider (bereits in App.tsx)

```tsx
<ContextualOnboardingProvider>
  <YourApp />
</ContextualOnboardingProvider>
```

## Features pro Rolle

### Bauträger (7 Features)
1. Radial Menu - Kommandozentrum
2. Projekt erstellen
3. Ausschreibung starten
4. Dokumente hochladen
5. Kanban Board
6. Benachrichtigungen
7. Finanzen

### Dienstleister (6 Features)
1. Radial Menu - Werkzeug-Center
2. Auftragssuche
3. Geo-Map
4. Angebot erstellen
5. Verfügbarkeit
6. Benachrichtigungen

## Persistence

- **LocalStorage**: Sofortiges Tracking (client-side)
- **Database**: Sync über `consent_fields.contextual_onboarding`
- **Backup**: LocalStorage als Fallback bei DB-Fehlern

## Debug Functions (Development)

```javascript
// Im Browser Console
window.resetContextualOnboarding(); // Reset für Testing
window.checkOnboardingProgress(); // Status anzeigen
```

## Migration von Guided Tour

### Entfernte Components
- ❌ FinalGuidedTour.tsx
- ❌ EnhancedGuidedTour.tsx
- ❌ GuidedTourOverlay.tsx
- ❌ WorkingGuidedTour.tsx
- ❌ TourMockups.tsx
- ❌ DisableableButton.tsx

### Legacy Support
- OnboardingContext.tsx ist jetzt deprecated aber funktional
- Alte Tour-Funktionen loggen Deprecation-Warnungen
- `shouldDisableUI` ist immer `false`

## Performance

- **Lazy Loading**: Tooltips nur bei Bedarf
- **Event Delegation**: Effiziente Event-Handler
- **Cleanup**: Automatische Ressourcen-Freigabe
- **Optimized Rendering**: Nur aktive Tooltips gerendert

## Accessibility

- **ARIA Labels**: Vollständige Accessibility-Support
- **Keyboard Navigation**: ESC zum Schließen
- **Screen Readers**: Semantisches HTML
- **Focus Management**: Korrekte Tab-Order

## Responsive Design

- **Mobile Optimiert**: Touch-freundliche Hotspots
- **Tablet Support**: Adaptive Tooltip-Positionierung
- **Desktop**: Volle Feature-Set

## Best Practices

1. **Neue Features hinzufügen**: In `onboardingFeatures.ts` definieren
2. **Priority setzen**: 1 = höchste Priorität
3. **Delay nutzen**: Für bessere UX (z.B. 1000ms)
4. **Placement**: `auto` für automatische Positionierung
5. **Testing**: Mit Debug-Functions testen

## Troubleshooting

### Tooltip erscheint nicht
1. Prüfe ob `data-feature-id` gesetzt ist
2. Überprüfe Feature-Definition in `onboardingFeatures.ts`
3. Console-Log für Debugging nutzen

### Hotspot nicht sichtbar
1. `showHotspot: true` in Feature-Definition?
2. Element existiert im DOM?
3. Z-Index Konflikte prüfen

### Progress wird nicht gespeichert
1. User-ID vorhanden?
2. LocalStorage aktiviert?
3. Console für Fehler prüfen

## Future Enhancements

- [ ] Analytics-Integration
- [ ] A/B Testing für Feature-Texte
- [ ] Video-Tooltips für komplexe Features
- [ ] Multi-Language Support
- [ ] Custom Themes
- [ ] Conditional Features (basierend auf User-Type)

## Changelog

### v1.0.0 (2025-10-26)
- Initial Release
- Ersetzt Guided Tour System
- 13 Features definiert
- Vollständige Integration in beide Dashboards
- Persistence mit LocalStorage + DB
- Debug-Functions für Development

