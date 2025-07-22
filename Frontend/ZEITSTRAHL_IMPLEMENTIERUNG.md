# Bauphasen-Zeitstrahl Implementierung

## Übersicht

Diese Dokumentation beschreibt die Implementierung der modernen, responsiven Bauphasen-Zeitstrahl-Komponenten für die BuildWise-Plattform.

## Komponenten

### 1. ConstructionPhaseTimeline

**Datei:** `src/components/ConstructionPhaseTimeline.tsx`

**Beschreibung:** Vollständige Zeitstrahl-Komponente mit allen Features

**Features:**
- ✅ Responsive Design (Desktop & Mobile)
- ✅ Farbkodierung (Grün = Abgeschlossen, Gelb = Aktuell, Grau = Ausstehend)
- ✅ Animierte Übergänge
- ✅ Legend-Anzeige
- ✅ Fortschrittsbalken für Mobile
- ✅ Aktuelle Phase Info-Box
- ✅ Konfigurierbare Optionen

**Props:**
```typescript
interface ConstructionPhaseTimelineProps {
  currentPhase?: string;        // Aktuelle Bauphase
  country?: string;             // Land (Deutschland, Schweiz, Österreich)
  phases?: ConstructionPhase[]; // Optionale benutzerdefinierte Phasen
  showLegend?: boolean;         // Legend anzeigen (Standard: true)
  showProgress?: boolean;       // Fortschrittsbalken anzeigen (Standard: true)
  compact?: boolean;            // Kompakte Darstellung (Standard: false)
}
```

**Verwendung:**
```tsx
<ConstructionPhaseTimeline 
  currentPhase="rohbau"
  country="Deutschland"
  showLegend={true}
  showProgress={true}
  compact={false}
/>
```

### 2. CompactPhaseTimeline

**Datei:** `src/components/CompactPhaseTimeline.tsx`

**Beschreibung:** Kompakte Version für Dashboard-Karten

**Features:**
- ✅ Minimale Darstellung
- ✅ Optimiert für kleine Räume
- ✅ Farbkodierung
- ✅ Fortschrittsanzeige

**Props:**
```typescript
interface CompactPhaseTimelineProps {
  currentPhase?: string;        // Aktuelle Bauphase
  country?: string;             // Land
  phases?: ConstructionPhase[]; // Optionale benutzerdefinierte Phasen
}
```

**Verwendung:**
```tsx
<CompactPhaseTimeline 
  currentPhase="rohbau"
  country="Deutschland"
/>
```

## Farbkodierung

### Status-Farben
- **Grün** (`bg-green-400`): Abgeschlossene Phasen
- **Gelb** (`bg-[#ffbd59]`): Aktuelle Phase
- **Grau** (`bg-gray-500`): Ausstehende Phasen

### Animationen
- **Pulse**: Aktuelle Phase pulsiert für Aufmerksamkeit
- **Transition**: Smooth Übergänge zwischen Zuständen
- **Shadow**: Glow-Effekt für aktuelle Phase

## Responsive Design

### Desktop (md:)
- Horizontale Timeline
- Vollständige Phasen-Labels
- Legend rechts
- Verbindungslinien zwischen Phasen

### Mobile (md:hidden)
- Horizontale Scrollbare Timeline
- Kompakte Phasen-Labels
- Fortschrittsbalken
- Touch-optimiert

## Integration

### Dashboard
Die Zeitstrahl-Komponente ist in das Dashboard integriert:

```tsx
{/* Bauphasen-Zeitstrahl */}
<ConstructionPhaseTimeline 
  currentPhase={(currentProject as any).construction_phase}
  country={(currentProject as any).address_country}
  showLegend={true}
  showProgress={true}
  compact={false}
/>
```

### Projektkacheln
Für die Dashboard-Karten kann die kompakte Version verwendet werden:

```tsx
<CompactPhaseTimeline 
  currentPhase={project.construction_phase}
  country={project.address_country}
/>
```

## Länder-spezifische Phasen

### Schweiz 🇨🇭 (11 Phasen)
1. Vorprojekt
2. Projektierung
3. Baugenehmigung
4. Ausschreibung
5. Aushub
6. Fundament
7. Rohbau
8. Dach
9. Fassade
10. Innenausbau
11. Fertigstellung

### Deutschland 🇩🇪 (10 Phasen)
1. Planungsphase
2. Baugenehmigung
3. Ausschreibung
4. Aushub
5. Fundament
6. Rohbau
7. Dach
8. Fassade
9. Innenausbau
10. Fertigstellung

### Österreich 🇦🇹 (10 Phasen)
1. Planungsphase
2. Einreichung
3. Ausschreibung
4. Aushub
5. Fundament
6. Rohbau
7. Dach
8. Fassade
9. Innenausbau
10. Fertigstellung

## Technische Details

### CSS-Klassen
```css
/* Responsive Design */
.hidden.md:flex          /* Desktop Timeline */
.md:hidden               /* Mobile Timeline */

/* Animationen */
.animate-pulse           /* Pulsierende aktuelle Phase */
.transition-all          /* Smooth Übergänge */
.duration-300            /* 300ms Übergangszeit */

/* Farben */
.bg-green-400           /* Abgeschlossene Phasen */
.bg-[#ffbd59]          /* Aktuelle Phase */
.bg-gray-500           /* Ausstehende Phasen */
```

### SVG-Icons
```tsx
{/* Checkmark für abgeschlossene Phasen */}
<svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
</svg>
```

## Performance-Optimierungen

### React-Optimierungen
- ✅ Memoization für Phasen-Arrays
- ✅ Effiziente Re-Renders
- ✅ Optimierte Event-Handler

### CSS-Optimierungen
- ✅ Hardware-beschleunigte Animationen
- ✅ Effiziente Transitions
- ✅ Optimierte Flexbox-Layouts

## Zugänglichkeit (Accessibility)

### ARIA-Labels
```tsx
aria-label="Bauphasen-Fortschritt"
role="progressbar"
aria-valuenow={currentPhaseIndex + 1}
aria-valuemin={1}
aria-valuemax={phases.length}
```

### Keyboard-Navigation
- ✅ Tab-Navigation
- ✅ Enter/Space für Interaktionen
- ✅ Focus-Indikatoren

### Screen Reader Support
- ✅ Semantische HTML-Struktur
- ✅ Beschreibende Labels
- ✅ Status-Announcements

## Wartung und Erweiterungen

### Neue Länder hinzufügen
1. Phasen-Array in `getConstructionPhases` erweitern
2. Farbkodierung anpassen (falls nötig)
3. Tests aktualisieren

### Neue Features
- **Zeitstempel**: Start-/Enddatum für jede Phase
- **Notizen**: Kommentare zu Phasen
- **Bilder**: Fotos von Baufortschritt
- **Export**: PDF-Berichte mit Zeitstrahl

### Performance-Monitoring
- Ladezeiten überwachen
- Re-Render-Frequenz optimieren
- Bundle-Größe minimieren

## Testing

### Unit Tests
```typescript
// Phasen-Konfiguration testen
test('Schweiz hat 11 Phasen', () => {
  const phases = getConstructionPhases('Schweiz');
  expect(phases).toHaveLength(11);
});

// Farbkodierung testen
test('Aktuelle Phase ist gelb', () => {
  const component = render(<ConstructionPhaseTimeline currentPhase="rohbau" country="Deutschland" />);
  const currentPhase = component.getByTestId('current-phase');
  expect(currentPhase).toHaveClass('bg-[#ffbd59]');
});
```

### Integration Tests
- Dashboard-Integration
- Mobile Responsiveness
- Touch-Interaktionen
- Keyboard-Navigation

## Troubleshooting

### Häufige Probleme

#### 1. Phasen werden nicht angezeigt
- **Ursache**: `currentPhase` oder `country` ist undefined
- **Lösung**: Props überprüfen, Fallback-Werte setzen

#### 2. Mobile Scroll funktioniert nicht
- **Ursache**: CSS-Konflikte
- **Lösung**: `scrollbar-hide` Klasse hinzufügen

#### 3. Animationen sind langsam
- **Ursache**: Hardware-Beschleunigung fehlt
- **Lösung**: `transform` statt `left/top` verwenden

### Debug-Modus
```tsx
// Debug-Informationen anzeigen
<ConstructionPhaseTimeline 
  currentPhase="rohbau"
  country="Deutschland"
  debug={true}  // Zeigt zusätzliche Debug-Info
/>
``` 