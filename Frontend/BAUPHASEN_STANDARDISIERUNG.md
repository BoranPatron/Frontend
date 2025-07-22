# Standardisierte Bauphasen für Immobilienentwicklung

## Übersicht

Diese Dokumentation beschreibt die standardisierten Bauphasen für die Immobilienentwicklung in der Schweiz, Österreich und Deutschland, die in der BuildWise-Plattform implementiert sind.

## Schweiz 🇨🇭

### Bauphasen nach SIA-Norm (Schweizerischer Ingenieur- und Architektenverein)

1. **Vorprojekt** - Grundlagenermittlung und Machbarkeitsstudie
   - Projektdefinition und Zielsetzung
   - Machbarkeitsstudie
   - Grobkonzept und Variantenstudien

2. **Projektierung** - Detaillierte Planung und Ausführungsprojekt
   - Ausführungsprojekt
   - Detailplanung
   - Technische Spezifikationen

3. **Baugenehmigung** - Einreichung und Genehmigungsverfahren
   - Baugesuch einreichen
   - Behördenverfahren
   - Genehmigung erhalten

4. **Ausschreibung** - Vergabe der Bauleistungen
   - Leistungsverzeichnis erstellen
   - Angebote einholen
   - Vergabeentscheidung

5. **Aushub** - Erdarbeiten und Baugrubenaushub
   - Baugrubenaushub
   - Gründungsarbeiten vorbereiten
   - Baustelleneinrichtung

6. **Fundament** - Gründung und Keller
   - Fundamentarbeiten
   - Kellerbau
   - Abdichtungsarbeiten

7. **Rohbau** - Tragkonstruktion und Geschossdecken
   - Tragkonstruktion
   - Geschossdecken
   - Treppenhaus

8. **Dach** - Dachkonstruktion und Dacheindeckung
   - Dachstuhl
   - Dacheindeckung
   - Dachfenster

9. **Fassade** - Außenwände und Fenster
   - Außenwände
   - Fenster und Türen
   - Wärmedämmung

10. **Innenausbau** - Elektro, Sanitär, Heizung
    - Elektroinstallation
    - Sanitäranlagen
    - Heizungsanlage
    - Lüftungsanlage

11. **Fertigstellung** - Endausbau und Übergabe
    - Innenputz
    - Bodenbeläge
    - Malerarbeiten
    - Übergabe

## Deutschland 🇩🇪

### Bauphasen nach HOAI (Honorarordnung für Architekten und Ingenieure)

1. **Planungsphase** - Grundlagenermittlung und Vorplanung
   - Grundlagenermittlung
   - Vorplanung
   - Entwurfsplanung

2. **Baugenehmigung** - Einreichung und Genehmigungsverfahren
   - Baugenehmigungsplanung
   - Einreichung bei Behörden
   - Genehmigungsverfahren

3. **Ausschreibung** - Vergabe der Bauleistungen
   - Leistungsverzeichnis
   - Angebotseinholung
   - Vergabe

4. **Aushub** - Erdarbeiten und Baugrubenaushub
   - Baugrubenaushub
   - Gründungsarbeiten
   - Baustelleneinrichtung

5. **Fundament** - Gründung und Keller
   - Fundamentarbeiten
   - Kellerbau
   - Abdichtung

6. **Rohbau** - Tragkonstruktion und Geschossdecken
   - Tragkonstruktion
   - Geschossdecken
   - Treppenhaus

7. **Dach** - Dachkonstruktion und Dacheindeckung
   - Dachstuhl
   - Dacheindeckung
   - Dachfenster

8. **Fassade** - Außenwände und Fenster
   - Außenwände
   - Fenster und Türen
   - Wärmedämmung

9. **Innenausbau** - Elektro, Sanitär, Heizung
   - Elektroinstallation
   - Sanitäranlagen
   - Heizungsanlage
   - Lüftungsanlage

10. **Fertigstellung** - Endausbau und Übergabe
    - Innenputz
    - Bodenbeläge
    - Malerarbeiten
    - Übergabe

## Österreich 🇦🇹

### Bauphasen nach ÖNORM und Baurecht

1. **Planungsphase** - Grundlagenermittlung und Vorprojekt
   - Grundlagenermittlung
   - Vorprojekt
   - Entwurfsplanung

2. **Einreichung** - Baugenehmigungsverfahren
   - Einreichplanung
   - Einreichung bei Behörden
   - Genehmigungsverfahren

3. **Ausschreibung** - Vergabe der Bauleistungen
   - Leistungsverzeichnis
   - Angebotseinholung
   - Vergabe

4. **Aushub** - Erdarbeiten und Baugrubenaushub
   - Baugrubenaushub
   - Gründungsarbeiten
   - Baustelleneinrichtung

5. **Fundament** - Gründung und Keller
   - Fundamentarbeiten
   - Kellerbau
   - Abdichtung

6. **Rohbau** - Tragkonstruktion und Geschossdecken
   - Tragkonstruktion
   - Geschossdecken
   - Treppenhaus

7. **Dach** - Dachkonstruktion und Dacheindeckung
   - Dachstuhl
   - Dacheindeckung
   - Dachfenster

8. **Fassade** - Außenwände und Fenster
   - Außenwände
   - Fenster und Türen
   - Wärmedämmung

9. **Innenausbau** - Elektro, Sanitär, Heizung
   - Elektroinstallation
   - Sanitäranlagen
   - Heizungsanlage
   - Lüftungsanlage

10. **Fertigstellung** - Endausbau und Übergabe
    - Innenputz
    - Bodenbeläge
    - Malerarbeiten
    - Übergabe

## Technische Implementierung

### Frontend-Integration

Die Bauphasen sind in beiden Frontend-Komponenten implementiert:

1. **Dashboard.tsx** - Hauptkomponente für Projekterstellung
2. **Navbar.tsx** - Navigation mit Projekterstellung

### Backend-Speicherung

Die Bauphasen werden als String-Werte in der Datenbank gespeichert:

```sql
construction_phase VARCHAR -- Aktuelle Bauphase
```

### Farbkodierung

Jede Bauphase hat eine spezifische Farbkodierung für die visuelle Darstellung:

- **Planungsphase/Vorprojekt**: Blau (`text-blue-400`)
- **Baugenehmigung/Einreichung**: Gelb (`text-yellow-400`)
- **Ausschreibung**: Orange (`text-orange-400`)
- **Aushub**: Rot (`text-red-400`)
- **Fundament**: Lila (`text-purple-400`)
- **Rohbau**: Pink (`text-pink-400`)
- **Dach**: Indigo (`text-indigo-400`)
- **Fassade**: Grün (`text-green-400`)
- **Innenausbau**: Teal (`text-teal-400`)
- **Fertigstellung**: Smaragd (`text-emerald-400`)

## Verwendung

### In der Projekterstellung

1. Wählen Sie das Land aus (Deutschland, Schweiz, Österreich)
2. Das Dropdown "🏗️ Aktuelle Bauphase (optional)" zeigt automatisch die entsprechenden Phasen an
3. Wählen Sie die aktuelle Bauphase Ihres Projekts

### Zeitstrahl-Darstellung

Die Bauphasen werden in einem visuellen Zeitstrahl dargestellt, der den Fortschritt des Projekts zeigt.

## Länder-spezifische Besonderheiten

### Schweiz
- **Vorprojekt** und **Projektierung** als separate Phasen
- Strenge Baugenehmigungsverfahren
- Detaillierte Ausschreibungsverfahren

### Deutschland
- **Planungsphase** als umfassende Vorbereitung
- HOAI-konforme Phasenstruktur
- Standardisierte Vergabeverfahren

### Österreich
- **Einreichung** als spezifische Phase
- ÖNORM-konforme Struktur
- Österreichisches Baurecht

## Wartung und Updates

Bei Änderungen der Bauphasen-Standards:

1. Aktualisieren Sie die `getConstructionPhases`-Funktionen in beiden Frontend-Komponenten
2. Aktualisieren Sie die `getPhaseColor`-Funktion für neue Farben
3. Testen Sie die Darstellung in der UI
4. Dokumentieren Sie Änderungen in dieser Datei 