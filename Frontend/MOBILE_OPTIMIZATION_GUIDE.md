# Mobile Optimierungs-Guide für BuildWise Frontend

## Übersicht

Dieses Dokument beschreibt die Mobile-First-Strategie für alle Dashboard-Komponenten und Modals im BuildWise Frontend. Die mobile Ansicht wird intensiver genutzt als die Desktop-Ansicht und muss daher höchste Priorität haben.

## Kern-Prinzipien

### 1. **Bottom Sheet Pattern für Modals**
- Alle Modals öffnen sich auf Mobile von unten (Bottom Sheet)
- Smooth Slide-Up Animation (0.3s cubic-bezier)
- Sticky Header mit Touch-freundlichen Close-Buttons
- Maximale Höhe: 92vh (Safe Area berücksichtigen)
- Desktop: Zentrierte Modals mit fester Breite

### 2. **Touch-Friendly Interaktionen**
- Minimum Touch Target Size: 44x44px
- Active Scale Effects (0.95-0.98)
- Tap Highlight deaktiviert
- Swipe-Gesten wo sinnvoll
- Kein Hover auf Mobile, nur Active States

### 3. **Responsive Typography & Spacing**
- Mobile: `text-sm` → Desktop: `text-base`
- Mobile: `p-3` → Desktop: `p-6`
- Mobile: `gap-3` → Desktop: `gap-6`
- Immer `truncate` für lange Texte

### 4. **Input-Optimierung**
- Font-size: 16px (verhindert iOS Zoom)
- Touch-freundliche Padding: `py-3` statt `py-2`
- Clear Visual Feedback
- Native Mobile Keyboards nutzen

### 5. **Performance**
- Lazy Loading für schwere Komponenten
- Memoization mit React.memo
- Virtual Scrolling für lange Listen
- Optimierte Animationen

## Komponenten-spezifische Optimierungen

### ProjectDetailsModal ✅ COMPLETED
**Status:** Vollständig optimiert

**Implementierte Features:**
- Bottom Sheet Animation
- Collapsible Sections mit Chevron Icons
- Touch-friendly Buttons (Icon-only auf Mobile)
- Responsive Grids (`grid-cols-1 sm:grid-cols-2`)
- Sticky Header
- Safe Area Padding

**Code Pattern:**
```tsx
const [isMobile, setIsMobile] = useState(false);
const [expandedSections, setExpandedSections] = useState({...});

// Mobile Detection
useEffect(() => {
  const checkMobile = () => setIsMobile(window.innerWidth < 768);
  checkMobile();
  window.addEventListener('resize', checkMobile);
  return () => window.removeEventListener('resize', checkMobile);
}, []);

// Collapsible Section Component
const CollapsibleSection = ({ title, icon, sectionKey, children }) => {
  const isExpanded = expandedSections[sectionKey];
  return (
    <div className="bg-white/5 rounded-2xl overflow-hidden">
      <button className="mobile-collapsible-header">
        {/* Header Content */}
      </button>
      {(!isMobile || isExpanded) && (
        <div className="mobile-collapsible-content">
          {children}
        </div>
      )}
    </div>
  );
};
```

### TradeDetailsModal
**Priorität:** HOCH

**Zu implementieren:**
1. **Tab-Navigation horizontal scrollbar**
   - Tabs in horizontalem Scroll-Container
   - Scroll-Snap für besseres UX
   - Touch-Drag statt Klick

2. **Kompakte Quote Cards**
   - Kleinere Padding auf Mobile
   - Icon-only Actions
   - Swipe-to-Delete

3. **Bottom Sheet für Sub-Modals**
   - QuoteDetailsModal als Bottom Sheet
   - ReviseQuoteModal als Bottom Sheet
   - Smooth Transitions

**Code Template:**
```tsx
// Mobile Tab Container
<div className="mobile-tab-container">
  {tabs.map(tab => (
    <button 
      className={`mobile-tab-button ${
        activeTab === tab.id ? 'mobile-tab-active' : 'mobile-tab-inactive'
      }`}
    >
      <Icon size={isMobile ? 16 : 20} />
      {!isMobile && <span>{tab.label}</span>}
    </button>
  ))}
</div>
```

### SimpleCostEstimateModal
**Priorität:** HOCH

**Zu implementieren:**
1. **Scrollbare Tabs** (wie TradeDetailsModal)
2. **Kompakte Kostenaufstellung**
   - Stack Layout statt Grid auf Mobile
   - Collapsible Positionen
   - Touch-friendly Bearbeitung

3. **Mobile-optimierter Rechner**
   - Größere Touch-Buttons
   - Native Number Keyboard
   - Instant Berechnung

### KanbanBoard
**Priorität:** MITTEL
**Status:** Bereits teilweise optimiert

**Weitere Optimierungen:**
1. **Horizontal Scroll für Columns**
   ```tsx
   <div className="mobile-horizontal-scroll">
     {COLUMNS.map(column => (
       <div className="min-w-[280px] md:min-w-0 md:flex-1">
         {/* Column Content */}
       </div>
     ))}
   </div>
   ```

2. **Pull-to-Refresh**
   ```tsx
   const [pullDistance, setPullDistance] = useState(0);
   
   // Touch Events
   onTouchMove={(e) => {
     if (scrollY === 0) {
       setPullDistance(Math.min(e.touches[0].clientY - startY, 100));
     }
   }}
   ```

3. **Compact Task Cards** (bereits implementiert ✅)

### ProjectFinancialAnalysis
**Priorität:** MITTEL

**Zu implementieren:**
1. **Responsive Charts**
   - SVG Charts mit ViewBox
   - Touch-Zoom für Details
   - Horizontal Scroll für Balkendiagramme

2. **KPI Cards Carousel**
   ```tsx
   <div className="mobile-horizontal-scroll">
     {kpis.map(kpi => (
       <div className="min-w-[280px] sm:min-w-0">
         {/* KPI Card */}
       </div>
     ))}
   </div>
   ```

### TradeCreationForm
**Priorität:** SEHR HOCH

**Zu implementieren:**
1. **Multi-Step Form**
   ```tsx
   const steps = [
     { id: 'basic', title: 'Grunddaten' },
     { id: 'details', title: 'Details' },
     { id: 'resources', title: 'Ressourcen' },
     { id: 'documents', title: 'Dokumente' }
   ];
   
   const [currentStep, setCurrentStep] = useState(0);
   ```

2. **Progress Indicator**
   ```tsx
   <div className="flex justify-between mb-4">
     {steps.map((step, index) => (
       <div className={`flex-1 h-1 ${
         index <= currentStep ? 'bg-[#ffbd59]' : 'bg-gray-600'
       }`} />
     ))}
   </div>
   ```

3. **Touch-optimierte Inputs**
   - Alle Inputs mit `mobile-input` Klasse
   - Textarea mit `min-h-[120px]`
   - Select mit großen Touch-Targets

4. **Mobile Document Upload**
   - Drag & Drop deaktivieren
   - Native File Picker
   - Foto direkt von Kamera

### CreateInspectionModal
**Priorität:** HOCH

**Zu implementieren:**
1. **Bottom Sheet Pattern**
2. **Native Date/Time Picker**
   ```tsx
   <input 
     type="datetime-local"
     className="mobile-input"
     min={new Date().toISOString().slice(0, 16)}
   />
   ```

3. **Touch-friendly Time Slots**
   - Grid von Time-Buttons
   - Visual Active State
   - Quick Select (Morgen, Nachmittag, etc.)

### TaskCreationModal
**Priorität:** MITTEL

**Zu implementieren:**
1. **Keyboard-optimierte Inputs**
   - Auto-Focus auf Title
   - Enter für Quick Submit
   - Tab-Navigation

2. **Rich Text Editor für Mobile**
   - Simplified Toolbar
   - Touch-friendly Buttons
   - Image Upload via Camera

### FinanceWidget
**Priorität:** MITTEL

**Zu implementieren:**
1. **Horizontal Card Scroll**
   ```tsx
   <div className="mobile-horizontal-scroll">
     {financeCards.map(card => (
       <div className="min-w-[280px]">
         {/* Finance Card */}
       </div>
     ))}
   </div>
   ```

2. **Compact Number Display**
   - Kürzere Zahlenformate (€1.5K statt €1,500)
   - Icon-only Labels
   - Color-coded Status

### DocumentSidebar & DocumentViewerModal
**Priorität:** HOCH

**Zu implementieren:**
1. **Full-Screen Viewer auf Mobile**
   ```tsx
   <div className={`
     fixed inset-0 z-[10001]
     ${isMobile ? 'bg-black' : 'bg-black/80'}
   `}>
     {/* Document Content */}
   </div>
   ```

2. **Pinch-to-Zoom**
   ```tsx
   const handlePinch = (e: TouchEvent) => {
     if (e.touches.length === 2) {
       const distance = getDistance(e.touches[0], e.touches[1]);
       setZoom(distance / initialDistance);
     }
   };
   ```

3. **Swipe Navigation**
   - Swipe Left/Right für Next/Prev
   - Visual Indicators
   - Smooth Transitions

## Utility Classes (mobile-modals.css)

### Layout
- `mobile-modal-container` - Modal Wrapper
- `mobile-modal-content` - Modal Content Box
- `mobile-modal-header` - Sticky Header
- `mobile-modal-scroll` - Scrollable Content

### Interactive
- `mobile-touch-button` - Touch-optimized Button
- `mobile-icon-button` - Icon-only Button
- `mobile-collapsible-header` - Collapsible Section Header

### Forms
- `mobile-input` - Text Input
- `mobile-textarea` - Textarea
- `mobile-select` - Select Dropdown

### Navigation
- `mobile-tab-container` - Horizontal Tab Scroll
- `mobile-tab-button` - Individual Tab
- `mobile-tab-active` / `mobile-tab-inactive` - Tab States

### Cards
- `mobile-card-grid` - Responsive Card Grid
- `mobile-card` - Individual Card
- `mobile-horizontal-scroll` - Horizontal Scroll Container

### Animations
- `modal-slideUp` - Bottom Sheet Slide Up
- `modal-slideDown` - Bottom Sheet Slide Down
- `mobile-skeleton` - Loading Skeleton
- `mobile-spinner` - Loading Spinner

## Testing Checklist

### Geräte-Tests
- [ ] iPhone SE (375px)
- [ ] iPhone 12 Pro (390px)
- [ ] iPhone 14 Pro Max (430px)
- [ ] Samsung Galaxy S21 (360px)
- [ ] iPad Mini (768px)
- [ ] iPad Pro (1024px)

### Browser-Tests
- [ ] Safari Mobile (iOS)
- [ ] Chrome Mobile (Android)
- [ ] Firefox Mobile
- [ ] Edge Mobile

### Feature-Tests
- [ ] Touch-Gesten funktionieren
- [ ] Kein ungewolltes Zoom beim Input-Focus
- [ ] Safe Area wird respektiert (Notch, Home Indicator)
- [ ] Landscape-Mode funktioniert
- [ ] Offline-Funktionalität
- [ ] Performance bei langen Listen
- [ ] Smooth Animationen (60fps)

### Accessibility
- [ ] Screen Reader Support
- [ ] Keyboard Navigation
- [ ] Sufficient Color Contrast
- [ ] Touch Target Size (min 44px)
- [ ] Reduced Motion Support

## Performance Optimierung

### Code Splitting
```tsx
const TradeDetailsModal = lazy(() => import('./TradeDetailsModal'));
const ProjectFinancialAnalysis = lazy(() => import('./ProjectFinancialAnalysis'));
```

### Memoization
```tsx
const MemoizedComponent = memo(Component, (prev, next) => {
  return prev.id === next.id && prev.status === next.status;
});
```

### Virtual Scrolling
```tsx
import { FixedSizeList } from 'react-window';

<FixedSizeList
  height={600}
  itemCount={items.length}
  itemSize={80}
  width="100%"
>
  {({ index, style }) => (
    <div style={style}>{items[index]}</div>
  )}
</FixedSizeList>
```

## Best Practices

### 1. Immer Mobile-First denken
```tsx
// ✅ Gut
className="text-sm md:text-base"

// ❌ Schlecht
className="text-base md:text-sm"
```

### 2. Touch-Targets groß genug
```tsx
// ✅ Gut
<button className="p-3 min-w-[44px] min-h-[44px]">

// ❌ Schlecht
<button className="p-1">
```

### 3. Prevent Zoom on Input
```tsx
// ✅ Gut
<input className="text-base" />

// ❌ Schlecht (zoomed auf iOS bei focus)
<input className="text-sm" />
```

### 4. Safe Area Padding
```tsx
// ✅ Gut
<div className="pb-safe safe-area-inset-bottom">

// ❌ Schlecht (überlappt mit Home Indicator)
<div className="pb-4">
```

### 5. Horizontal Scroll mit Snap
```tsx
// ✅ Gut
<div className="overflow-x-auto" style={{ scrollSnapType: 'x mandatory' }}>
  <div style={{ scrollSnapAlign: 'start' }}>

// ❌ Schlecht (kein Snap-Punkt)
<div className="overflow-x-auto">
```

## Nächste Schritte

1. ✅ ProjectDetailsModal optimiert
2. 🔄 TradeDetailsModal optimieren
3. 🔄 SimpleCostEstimateModal optimieren
4. 🔄 TradeCreationForm Multi-Step implementieren
5. 🔄 DocumentViewer mit Gestures
6. ⏳ Alle anderen Komponenten durchgehen
7. ⏳ Testing auf echten Geräten
8. ⏳ Performance Audit
9. ⏳ Accessibility Audit

## Ressourcen

- [MDN: Touch Events](https://developer.mozilla.org/en-US/docs/Web/API/Touch_events)
- [Web.dev: Mobile UX](https://web.dev/mobile/)
- [Material Design: Bottom Sheets](https://m3.material.io/components/bottom-sheets)
- [iOS HIG: Modality](https://developer.apple.com/design/human-interface-guidelines/modality)
- [React Window](https://react-window.vercel.app/)

