# Kostenvoranschlag-Implementierung - Neue Terminologie und Funktionalität

## Übersicht

Die Implementierung wurde von "Angebot" zu "Kostenvoranschlag" geändert und umfasst eine erweiterte Gewerk-Erstellung mit kategorie-spezifischen Feldern und Datei-Upload-Funktionalität.

## Neue Terminologie

### Vorher (Angebot-System)
```
Bauträger → Gewerk anlegen → Dienstleister → Angebot → Entscheidung
```

### Jetzt (Kostenvoranschlag-System)
```
Bauträger → Gewerk anlegen (mit Kategorie-spezifischen Feldern) → 
Dienstleister → Kostenvoranschlag → Entscheidung
```

## Implementierte Komponenten

### 1. TradeCreationForm.tsx
**Neue Komponente für erweiterte Gewerk-Erstellung**

**Features:**
- **Kategorie-spezifische Felder**: Automatische Anpassung je nach Gewerk-Kategorie
- **Datei-Upload**: Unterstützung für gängige Formate (PDF, Bilder, Office, ZIP)
- **Technische Spezifikationen**: Detaillierte Anforderungen für Dienstleister
- **Validierung**: Umfassende Eingabevalidierung
- **Responsive Design**: Optimiert für alle Bildschirmgrößen

**Unterstützte Kategorien:**
- **Elektro**: Spannung, Leistung, Stromkreise, Schalter, Steckdosen, Leuchten
- **Sanitär**: Sanitärobjekte, Rohrleitungslänge, Warmwasserbereiter, Abwassersystem
- **Heizung**: Heizungssystem, Heizleistung, Heizkörper, Thermostate, Kessel
- **Dach**: Dachmaterial, Dachfläche, Dachneigung, Dämmung, Regenrinne, Dachfenster
- **Fenster/Türen**: Anzahl, Typ, Verglasung, Material
- **Boden**: Bodenbelag, Bodenfläche, Untergrund, Dämmung
- **Wand**: Wandmaterial, Wandfläche, Dämmung, Anstrich
- **Fundament**: Fundamenttyp, Fundamenttiefe, Bodentyp, Abdichtung
- **Garten/Landschaft**: Gartenfläche, Bewässerung, Beleuchtung, Wege, Bepflanzung

### 2. Erweiterte Trade-Interface
**Neue Felder in der Trade-Interface:**

```typescript
interface Trade {
  // ... bestehende Felder ...
  
  // Kategorie-spezifische Felder
  category_specific_fields?: {
    // Elektro
    electrical_voltage?: string;
    electrical_power?: string;
    electrical_circuits?: number;
    electrical_switches?: number;
    electrical_outlets?: number;
    electrical_lighting_points?: number;
    
    // Sanitär
    plumbing_fixtures?: number;
    plumbing_pipes_length?: number;
    plumbing_water_heater?: boolean;
    plumbing_sewage_system?: boolean;
    plumbing_water_supply?: boolean;
    
    // ... weitere Kategorien
  };
  
  // Dokumente und Dateien
  documents?: Array<{
    id: number;
    title: string;
    file_name: string;
    file_path: string;
    file_size: number;
    mime_type: string;
    uploaded_at: string;
  }>;
  
  // Technische Spezifikationen
  technical_specifications?: string;
  quality_requirements?: string;
  safety_requirements?: string;
  environmental_requirements?: string;
}
```

## Datei-Upload-Funktionalität

### Unterstützte Formate
- **PDF**: `.pdf`
- **Bilder**: `.jpg`, `.jpeg`, `.png`, `.gif`
- **Office-Dokumente**: `.doc`, `.docx`, `.xls`, `.xlsx`
- **Archive**: `.zip`, `.rar`

### Datei-Größenbeschränkung
- **Maximale Dateigröße**: 10MB pro Datei
- **Validierung**: Automatische Prüfung von Dateityp und -größe

### Upload-Features
- **Drag & Drop**: Intuitive Datei-Upload-Oberfläche
- **Mehrfach-Upload**: Mehrere Dateien gleichzeitig hochladen
- **Vorschau**: Dateiname und -größe werden angezeigt
- **Entfernen**: Einzelne Dateien können entfernt werden

## Kategorie-spezifische Felder

### Elektro
```typescript
{
  electrical_voltage: '230V' | '400V' | '230V/400V',
  electrical_power: 'number', // kW
  electrical_circuits: 'number',
  electrical_switches: 'number',
  electrical_outlets: 'number',
  electrical_lighting_points: 'number'
}
```

### Sanitär
```typescript
{
  plumbing_fixtures: 'number',
  plumbing_pipes_length: 'number', // m
  plumbing_water_heater: 'boolean',
  plumbing_sewage_system: 'boolean',
  plumbing_water_supply: 'boolean'
}
```

### Heizung
```typescript
{
  heating_system_type: 'Gas' | 'Öl' | 'Wärmepumpe' | 'Pellet' | 'Fernwärme',
  heating_power: 'number', // kW
  heating_radiators: 'number',
  heating_thermostats: 'number',
  heating_boiler: 'boolean'
}
```

### Dach
```typescript
{
  roof_material: 'Ziegel' | 'Beton' | 'Metall' | 'Schiefer' | 'Holz',
  roof_area: 'number', // m²
  roof_pitch: 'number', // °
  roof_insulation: 'boolean',
  roof_gutters: 'boolean',
  roof_skylights: 'number'
}
```

## Technische Spezifikationen

### Eingabefelder
- **Technische Anforderungen**: Detaillierte technische Beschreibung
- **Qualitätsanforderungen**: Qualitätsstandards und -kriterien
- **Sicherheitsanforderungen**: Sicherheitsstandards und -maßnahmen
- **Umweltanforderungen**: Umweltstandards und -kriterien

### Vorteile für Dienstleister
- **Bessere Grundlage**: Detaillierte Informationen für präzise Kostenvoranschläge
- **Reduzierte Nachfragen**: Weniger Rückfragen durch umfassende Spezifikationen
- **Zeitersparnis**: Schnellere Erstellung von Kostenvoranschlägen
- **Qualitätsverbesserung**: Höhere Qualität der Kostenvoranschläge

## Validierung und Fehlerbehandlung

### Eingabevalidierung
- **Pflichtfelder**: Titel, Beschreibung, Kategorie, geplantes Datum
- **Kategorie-spezifische Pflichtfelder**: Je nach Kategorie unterschiedliche Anforderungen
- **Datei-Validierung**: Dateityp und -größe werden geprüft
- **Echtzeit-Feedback**: Sofortige Anzeige von Validierungsfehlern

### Fehlerbehandlung
- **Benutzerfreundliche Fehlermeldungen**: Klare und verständliche Fehlermeldungen
- **Spezifische Validierung**: Kategorie-spezifische Validierungsregeln
- **Graceful Degradation**: Anwendung bleibt funktionsfähig auch bei Fehlern

## Benutzerfreundlichkeit

### Intuitive Bedienung
- **Schritt-für-Schritt**: Klare Strukturierung der Eingabefelder
- **Kontextuelle Hilfe**: Tooltips und Beschreibungen für komplexe Felder
- **Responsive Design**: Optimiert für Desktop, Tablet und Mobile

### Automatisierung
- **Automatische Kategorie-Erkennung**: Felder werden automatisch angepasst
- **Intelligente Vorschläge**: Vorausfüllung basierend auf Kategorie
- **Validierung in Echtzeit**: Sofortige Rückmeldung bei Eingaben

## Integration in bestehende Architektur

### Quotes.tsx Integration
```typescript
// Neue State-Variablen
const [showTradeCreationForm, setShowTradeCreationForm] = useState(false);

// Neue Funktion für erweiterte Gewerk-Erstellung
const handleCreateTradeWithForm = async (tradeData: any) => {
  try {
    console.log('🔧 Erstelle Gewerk mit erweiterten Daten:', tradeData);
    // API-Call für Gewerk-Erstellung
    await createMilestone(tradeData);
    setShowTradeCreationForm(false);
    await loadTrades();
  } catch (error) {
    console.error('❌ Fehler beim Erstellen des Gewerks:', error);
    throw error;
  }
};
```

### Modal-Integration
```typescript
{/* TradeCreationForm Modal */}
{showTradeCreationForm && currentProject && (
  <TradeCreationForm
    isOpen={showTradeCreationForm}
    onClose={() => setShowTradeCreationForm(false)}
    onSubmit={handleCreateTradeWithForm}
    projectId={currentProject.id}
  />
)}
```

## Vorteile der neuen Implementierung

### Für Bauträger
1. **Detailliertere Spezifikationen**: Bessere Grundlage für Kostenvoranschläge
2. **Reduzierte Kommunikation**: Weniger Nachfragen von Dienstleistern
3. **Qualitätsverbesserung**: Höhere Qualität der Kostenvoranschläge
4. **Zeitersparnis**: Schnellere Vergabe von Gewerken

### Für Dienstleister
1. **Bessere Informationen**: Umfassende Spezifikationen für präzise Kostenvoranschläge
2. **Reduzierte Unsicherheit**: Klare Anforderungen reduzieren Risiken
3. **Zeitersparnis**: Weniger Rückfragen und Nachverhandlungen
4. **Qualitätsverbesserung**: Höhere Qualität der Kostenvoranschläge

### Für das System
1. **Standardisierung**: Einheitliche Struktur für alle Gewerke
2. **Skalierbarkeit**: Einfache Erweiterung um neue Kategorien
3. **Datenqualität**: Strukturierte und validierte Daten
4. **Benutzerfreundlichkeit**: Intuitive und effiziente Bedienung

## Test-Szenarien

### 1. Gewerk-Erstellung mit Kategorie-spezifischen Feldern
1. Bauträger erstellt neues Gewerk
2. Wählt Kategorie "Elektro"
3. Spezifische Felder werden automatisch angezeigt
4. Füllt alle Pflichtfelder aus
5. **Erwartung**: Gewerk wird mit allen spezifischen Daten erstellt

### 2. Datei-Upload-Funktionalität
1. Bauträger lädt Dokumente hoch
2. Verschiedene Dateiformate testen
3. Dateigröße über 10MB testen
4. **Erwartung**: Nur gültige Dateien werden akzeptiert

### 3. Dienstleister-Ansicht
1. Dienstleister sieht erstelltes Gewerk
2. Alle kategorie-spezifischen Felder sind sichtbar
3. Dokumente können heruntergeladen werden
4. **Erwartung**: Umfassende Informationen für Kostenvoranschlag

### 4. Validierung
1. Pflichtfelder leer lassen
2. Ungültige Dateien hochladen
3. **Erwartung**: Klare Fehlermeldungen werden angezeigt

## Zukunftserweiterungen

### Mögliche Erweiterungen
1. **KI-Unterstützung**: Automatische Vorschläge basierend auf Kategorie
2. **Templates**: Vorlagen für häufige Gewerke
3. **Berechnungen**: Automatische Berechnungen basierend auf Eingaben
4. **Integration**: Verbindung mit CAD-Systemen und BIM

### Neue Kategorien
1. **Smart Home**: Automatisierung, Sensoren, Steuerung
2. **Erneuerbare Energien**: Solar, Wind, Geothermie
3. **Barrierefreiheit**: Aufzüge, Rampen, spezielle Ausstattung
4. **Sicherheit**: Alarmanlagen, Videoüberwachung, Zutrittskontrolle

## Fazit

Die neue Kostenvoranschlag-Implementierung bietet:

1. **Bessere Terminologie**: "Kostenvoranschlag" statt "Angebot"
2. **Kategorie-spezifische Felder**: Detaillierte Spezifikationen je nach Gewerk
3. **Datei-Upload**: Unterstützung für gängige Formate
4. **Technische Spezifikationen**: Umfassende Anforderungen für Dienstleister
5. **Validierung**: Robuste Eingabevalidierung und Fehlerbehandlung
6. **Benutzerfreundlichkeit**: Intuitive und effiziente Bedienung

Die Implementierung stellt sicher, dass Dienstleister alle notwendigen Informationen erhalten, um präzise und qualitativ hochwertige Kostenvoranschläge zu erstellen. 