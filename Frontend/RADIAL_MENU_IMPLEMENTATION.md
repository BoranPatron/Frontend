# Radial Menu Implementation

## 🎯 Übersicht

Das neue Radial Menu System ersetzt die bisherige Kachel-Navigation mit einem modernen, interaktiven Planetarium/Orbit-Design. Das System bietet zwei Varianten:

1. **RadialMenu** - Basis-Version mit einem Ring
2. **RadialMenuAdvanced** - Erweiterte Version mit zwei Ringen und Create-Actions

## ✨ Features

### Kern-Features
- **Radiale Anordnung** mit Polar-Koordinaten
- **Spring-Animationen** mit Framer Motion
- **Responsive Design** für Mobile und Desktop
- **Tastaturnavigation** (Pfeiltasten, Tab, Enter, ESC)
- **Touch-Gesten** für Mobile (Long-Press für erweiterte Optionen)
- **Barrierefreiheit** (ARIA-Labels, Fokus-Management)
- **Role-basierte Navigation** (Anpassung an Benutzerrolle und Subscription)

### Visuelle Features
- **Gooey-Effekt** (optional, SVG-Filter)
- **Orbit-Linien** für visuelle Hierarchie
- **Tooltips** mit Beschreibungen
- **Badges** für Benachrichtigungen
- **Pulse-Animation** im geschlossenen Zustand
- **Hover/Active States** mit Micro-Animationen

### Erweiterte Features (RadialMenuAdvanced)
- **Zweiter Ring** für Create-Actions
- **Keyboard Shortcuts** (C für Create-Menu)
- **Long-Press** auf Mobile für direkten Zugriff auf Create-Actions
- **Dynamische Filterung** basierend auf User-Role

## 🎨 Design-Spezifikationen

### Layout
- **Haupt-Ring**: 120px Radius (Desktop) / 88px (Mobile)
- **Zweiter Ring**: 200px Radius (Desktop) / 140px (Mobile)
- **Winkelbereich**: -160° bis -20° (Hauptmenü)
- **FAB-Button**: 72x72px (Desktop) / 56x56px (Mobile)

### Animationen
- **Spring**: stiffness: 350, damping: 25
- **Staggered Delay**: 40ms pro Item (Haupt), 60ms (Sekundär)
- **Rotation**: 45° beim Öffnen des FAB
- **Scale**: 1.15 bei Hover, 0.95 bei Tap

### Farben
- **Manager**: #ffbd59 (BuildWise Gelb)
- **Docs**: #4F46E5 (Indigo)
- **Tasks**: #10B981 (Grün)
- **Finance**: #F59E0B (Orange)
- **Gewerke**: #8B5CF6 (Violett)
- **Visualize**: #06B6D4 (Cyan)
- **Canvas**: #EC4899 (Pink)

## 🚀 Verwendung

### Basis-Version

```tsx
import { RadialMenu } from '../components/RadialMenu';

// In deiner Komponente
<RadialMenu 
  enableGooeyEffect={false}
  showTooltips={true}
  startAngleDeg={-160}
  endAngleDeg={-20}
/>
```

### Erweiterte Version

```tsx
import { RadialMenuAdvanced } from '../components/RadialMenuAdvanced';

// In deiner Komponente
<RadialMenuAdvanced 
  enableGooeyEffect={true}
  showTooltips={true}
  enableSecondRing={true}
/>
```

### Custom Items

```tsx
const customItems = [
  {
    id: "custom-1",
    label: "Custom Action",
    icon: <CustomIcon size={24} />,
    onSelect: () => handleCustomAction(),
    color: "#FF6B6B",
    description: "Beschreibung der Aktion",
    badge: { text: "NEU", color: "#10B981" },
    ring: 1 // oder 2 für zweiten Ring
  }
];

<RadialMenu items={customItems} />
```

## ⌨️ Keyboard Shortcuts

| Taste | Aktion |
|-------|--------|
| **Enter/Space** | Menü öffnen/Item auswählen |
| **ESC** | Menü schließen |
| **Pfeiltasten** | Navigation zwischen Items |
| **Tab/Shift+Tab** | Navigation zwischen Items |
| **C** | Create-Menu toggle (nur Advanced) |

## 📱 Mobile Interaktionen

- **Tap**: Menü öffnen/schließen
- **Long-Press** (500ms): Menü mit Create-Actions öffnen
- **Swipe**: Wird unterstützt für Item-Auswahl
- **Outside-Tap**: Menü schließen

## 🔧 Performance-Optimierungen

1. **will-change: transform** für optimierte Animationen
2. **Lazy Loading** der Create-Items
3. **Memoization** der Layout-Berechnungen
4. **Event-Delegation** für Touch-Events
5. **CSS containment** für isolierte Repaints

## 🎯 Barrierefreiheit

- **ARIA-Rollen**: menu, menuitem, expanded
- **Fokus-Management**: Automatischer Fokus auf aktive Items
- **Tastatur-Navigation**: Vollständige Keyboard-Unterstützung
- **Screen-Reader**: Beschreibende Labels und Descriptions
- **Kontraste**: AA/AAA konform

## 🔄 Migration von Kacheln

Die alte Kachel-Navigation wurde vollständig durch das Radial Menu ersetzt:

### Vorher (Kacheln)
```tsx
<DashboardCard 
  title="Manager"
  icon={<Home />}
  onClick={onManagerClick}
/>
```

### Nachher (Radial Menu)
```tsx
// Automatisch im RadialMenu enthalten
// Navigation erfolgt über den zentralen FAB-Button
```

## 📊 Benutzer-Rollen

Das Menu passt sich automatisch an die Benutzerrolle an:

- **Dienstleister**: Manager, Gewerke, Docs
- **Bauträger (BASIS)**: Manager, Gewerke, Docs  
- **Bauträger (PRO)**: Alle Module
- **Admin**: Alle Module

## 🐛 Bekannte Einschränkungen

1. **Gooey-Effekt** kann auf schwachen Geräten Performance-Probleme verursachen
2. **Maximum 8 Items** pro Ring für optimale Darstellung
3. **Safari iOS** benötigt Polyfill für bestimmte Touch-Events

## 🚧 Zukünftige Erweiterungen

- [ ] Drag-to-Select Geste
- [ ] Customizable Themes
- [ ] Persönliche Favoriten-Ring
- [ ] Analytics-Integration
- [ ] Haptic Feedback (Mobile)
- [ ] Voice Control Integration

## 📝 Changelog

### Version 1.0.0 (Aktuell)
- Initiale Implementierung
- Zwei Komponenten-Varianten
- Vollständige Keyboard-Navigation
- Gooey-Effekt Option
- Role-basierte Filterung

---

*BuildWise Radial Menu System - Modern, Accessible, Performant* 🚀
