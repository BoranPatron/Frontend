# Projektauswahl: Nachhaltige Lösung

## Problem-Beschreibung

Wenn ein Gewerk unter "Gewerke" angelegt wurde, sollte es dem richtigen Projekt zugewiesen werden, welches über Swipen auf der Startseite ausgewählt wurde. Zudem sollte bei Auswahl durch Swipen eines Projektes in dem Projekt geblieben werden bei Neuladen oder Rückkehren ins Hauptprogramm.

## Implementierte Lösung

### 1. ProjectContext - Globale Projektauswahl-Verwaltung

**Datei:** `src/context/ProjectContext.tsx`

Eine neue globale Verwaltung für die Projektauswahl wurde erstellt:

```typescript
interface ProjectContextType {
  projects: Project[];
  selectedProject: Project | null;
  selectedProjectIndex: number;
  isLoading: boolean;
  error: string;
  setSelectedProjectIndex: (index: number) => void;
  setSelectedProject: (project: Project | null) => void;
  loadProjects: () => Promise<void>;
  getCurrentProject: () => Project | null;
  isProjectSelected: () => boolean;
}
```

**Features:**
- **Persistente Speicherung:** Projektauswahl wird in localStorage gespeichert
- **Automatische Wiederherstellung:** Beim Neuladen wird die letzte Auswahl wiederhergestellt
- **Globale Verfügbarkeit:** Alle Komponenten können auf die aktuelle Projektauswahl zugreifen
- **Robuste Initialisierung:** Fallback auf erstes Projekt, wenn gespeicherte Auswahl nicht mehr existiert

### 2. Integration in App.tsx

**Datei:** `src/App.tsx`

Der ProjectProvider wurde in die App-Hierarchie integriert:

```typescript
export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <ProjectProvider>
          <AppContent />
        </ProjectProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
```

### 3. Dashboard-Integration

**Datei:** `src/pages/Dashboard.tsx`

Das Dashboard verwendet jetzt den ProjectContext:

```typescript
const { 
  projects, 
  selectedProject, 
  selectedProjectIndex, 
  setSelectedProjectIndex,
  isLoading: projectsLoading,
  error: projectsError 
} = useProject();
```

**Verbesserungen:**
- Swipe-Funktionalität aktualisiert die globale Projektauswahl
- Navigation zu anderen Seiten übergibt automatisch das ausgewählte Projekt
- Persistente Projektauswahl über Neuladen hinweg

### 4. Quotes-Seite Integration

**Datei:** `src/pages/Quotes.tsx`

Die Quotes-Seite verwendet jetzt das ausgewählte Projekt:

```typescript
const { selectedProject: currentProject } = useProject();

// Für Bauträger: Verwende das aktuell ausgewählte Projekt
if (!isServiceProviderUser && currentProject) {
  console.log('🔧 Using current project from context:', currentProject.id);
  setSelectedProject(currentProject.id);
}
```

**Vorteile:**
- Neue Gewerke werden automatisch dem ausgewählten Projekt zugewiesen
- Keine manuelle Projektauswahl mehr erforderlich
- Konsistente Projektauswahl über alle Seiten

## Funktionsweise

### 1. Projektauswahl-Persistierung

```typescript
// Speichern der Projektauswahl
useEffect(() => {
  if (selectedProject) {
    localStorage.setItem('selectedProjectId', selectedProject.id.toString());
    localStorage.setItem('selectedProjectIndex', selectedProjectIndex.toString());
  }
}, [selectedProject, selectedProjectIndex]);

// Wiederherstellen der Projektauswahl
useEffect(() => {
  const savedProjectId = localStorage.getItem('selectedProjectId');
  const savedProjectIndex = localStorage.getItem('selectedProjectIndex');
  
  if (savedProjectId && savedProjectIndex && projects.length > 0) {
    const projectId = parseInt(savedProjectId);
    const projectIndex = parseInt(savedProjectIndex);
    
    const savedProject = projects.find(p => p.id === projectId);
    if (savedProject) {
      setSelectedProject(savedProject);
      setSelectedProjectIndex(projectIndex);
    }
  }
}, [projects]);
```

### 2. Swipe-Funktionalität

```typescript
const handleSwipe = (direction: 'left' | 'right') => {
  if (isTransitioning || projects.length === 0) return;
  
  setIsTransitioning(true);
  
  if (direction === 'left' && selectedProjectIndex < projects.length - 1) {
    setSelectedProjectIndex(selectedProjectIndex + 1);
  } else if (direction === 'right' && selectedProjectIndex > 0) {
    setSelectedProjectIndex(selectedProjectIndex - 1);
  }
  
  setTimeout(() => setIsTransitioning(false), 300);
};
```

### 3. Gewerk-Erstellung mit Projektzuweisung

```typescript
const handleCreateTrade = async (e: React.FormEvent) => {
  // Prüfe ob ein Projekt ausgewählt ist
  if (!selectedProject) {
    setError('Bitte wählen Sie ein Projekt aus.');
    return;
  }
  
  const tradeData = {
    project_id: selectedProject, // Automatische Projektzuweisung
    title: tradeForm.title.trim(),
    description: tradeForm.description.trim(),
    // ... weitere Felder
  };
  
  await createMilestone(tradeData);
};
```

## Debug-Funktionen

### 1. Projektauswahl-Status prüfen

```javascript
// In der Browser-Konsole ausführen:
const projectContext = document.querySelector('[data-project-context]');
console.log('Aktuelles Projekt:', projectContext?.dataset);

// Oder über localStorage:
console.log('Gespeicherte Projektauswahl:', {
  projectId: localStorage.getItem('selectedProjectId'),
  projectIndex: localStorage.getItem('selectedProjectIndex')
});
```

### 2. Projektauswahl zurücksetzen

```javascript
// Projektauswahl zurücksetzen:
localStorage.removeItem('selectedProjectId');
localStorage.removeItem('selectedProjectIndex');
window.location.reload();
```

## Test-Szenarien

### 1. Projektauswahl über Swipe
1. Auf Dashboard gehen
2. Zwischen Projekten swipen
3. Zur Quotes-Seite navigieren
4. Neues Gewerk erstellen
5. **Erwartung:** Gewerk wird dem ausgewählten Projekt zugewiesen

### 2. Persistierung über Neuladen
1. Projekt über Swipe auswählen
2. Seite neu laden (F5)
3. **Erwartung:** Gleiche Projektauswahl ist noch aktiv

### 3. Navigation mit Projektauswahl
1. Projekt über Swipe auswählen
2. Zu verschiedenen Seiten navigieren (Finance, Tasks, etc.)
3. Zurück zum Dashboard
4. **Erwartung:** Projektauswahl bleibt erhalten

### 4. Gewerk-Erstellung
1. Projekt über Swipe auswählen
2. Zur Quotes-Seite gehen
3. Neues Gewerk erstellen
4. **Erwartung:** Gewerk wird automatisch dem ausgewählten Projekt zugewiesen

## Vorteile der Lösung

### 1. Benutzerfreundlichkeit
- Keine manuelle Projektauswahl mehr erforderlich
- Intuitive Swipe-Navigation
- Persistente Auswahl über Neuladen hinweg

### 2. Datenkonsistenz
- Alle neuen Gewerke werden automatisch dem richtigen Projekt zugewiesen
- Keine verwaisten Gewerke ohne Projektzuweisung
- Zentrale Projektverwaltung

### 3. Entwicklerfreundlichkeit
- Globale Projektauswahl über useProject() verfügbar
- Einfache Integration in neue Komponenten
- Robuste Fehlerbehandlung

### 4. Skalierbarkeit
- Einfache Erweiterung für weitere Projekt-bezogene Funktionen
- Konsistente API für alle Komponenten
- Wiederverwendbare Logik

## Monitoring

### Debug-Ausgaben

Die Lösung enthält umfassende Debug-Ausgaben:

- `💾` - Projektauswahl gespeichert
- `📂` - Gespeicherte Projektauswahl geladen
- `🔄` - Projektauswahl aktualisiert
- `🎯` - Projekt direkt ausgewählt
- `❌` - Projektauswahl zurückgesetzt

### localStorage-Überwachung

```javascript
// Überwache localStorage-Änderungen
const originalSetItem = localStorage.setItem;
localStorage.setItem = function(key, value) {
  if (key.includes('Project')) {
    console.log('📝 Projektauswahl geändert:', { key, value });
  }
  originalSetItem.apply(this, arguments);
};
```

## Fazit

Die nachhaltige Lösung behebt das Problem durch:

1. **Globale Projektauswahl-Verwaltung** - Zentrale Kontrolle über alle Projekt-bezogenen Operationen
2. **Persistente Speicherung** - Projektauswahl bleibt über Neuladen erhalten
3. **Automatische Projektzuweisung** - Neue Gewerke werden automatisch dem ausgewählten Projekt zugewiesen
4. **Intuitive Benutzerführung** - Swipe-Navigation mit visueller Rückmeldung
5. **Robuste Fehlerbehandlung** - Fallback-Mechanismen für verschiedene Szenarien

Die Lösung ist zukunftssicher und kann einfach für weitere Projekt-bezogene Funktionen erweitert werden. 