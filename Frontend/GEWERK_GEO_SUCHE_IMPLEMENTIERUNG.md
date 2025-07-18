# Gewerk-Suche für Dienstleister - Implementierung

## Übersicht

Die geo-basierte Umkreissuche wurde erweitert, um Dienstleistern spezifisch nach **Gewerken (Trades)** zu suchen, anstatt nach ganzen Projekten. Dies macht die Suche für Dienstleister viel relevanter und intuitiver.

## Was wurde implementiert

### 1. Backend-Erweiterungen

#### Neue API-Endpoints
- `POST /api/geo/search-trades` - Sucht Gewerke im Radius
- Erweiterte Filter für Gewerke (Kategorie, Status, Priorität, Budget)

#### GeoService-Erweiterungen
- `search_trades_in_radius()` - Neue Methode für Gewerk-Suche
- Join zwischen Milestone (Gewerke) und Project (Projekte)
- Adress-Informationen werden vom übergeordneten Projekt übernommen

#### Request/Response Models
```typescript
// Request
interface TradeSearchRequest {
  latitude: number;
  longitude: number;
  radius_km: number;
  category?: string;
  status?: string;
  priority?: string;
  min_budget?: number;
  max_budget?: number;
  limit?: number;
}

// Response
interface TradeSearchResult {
  id: number;
  title: string;
  description?: string;
  category: string;
  status: string;
  priority: string;
  budget?: number;
  planned_date: string;
  start_date?: string;
  end_date?: string;
  progress_percentage: number;
  contractor?: string;
  // Projekt-Informationen
  project_id: number;
  project_name: string;
  project_type: string;
  project_status: string;
  // Adress-Informationen (vom übergeordneten Projekt)
  address_street: string;
  address_zip: string;
  address_city: string;
  address_latitude: number;
  address_longitude: number;
  distance_km: number;
  created_at?: string;
}
```

### 2. Frontend-Erweiterungen

#### GeoService API
- `searchTradesInRadius()` - Neue Funktion für Gewerk-Suche
- TypeScript-Interfaces für Request/Response

#### GeoSearch-Seite
- Neuer Suchmodus "Gewerke" (nur für Dienstleister sichtbar)
- Erweiterte Filter für Gewerke:
  - **Kategorie**: Bau, Elektro, Sanitär, Heizung, Dach, Maler, Garten, Boden
  - **Status**: Geplant, In Bearbeitung, Abgeschlossen, Verzögert, Storniert
  - **Priorität**: Niedrig, Mittel, Hoch, Kritisch
  - **Budget**: Min/Max-Bereich

#### UI-Verbesserungen
- Intuitive Darstellung der Gewerke mit:
  - Gewerk-Titel und Beschreibung
  - Kategorie, Status, Priorität
  - Geplantes Datum
  - Projekt-Informationen (Name, Typ)
  - Adresse (vom übergeordneten Projekt)
  - Entfernung und Budget
  - Fortschritt in Prozent

## Best Practices für Dienstleister

### 1. Relevante Informationen
- **Gewerke statt Projekte**: Dienstleister interessieren sich für konkrete Aufträge, nicht für ganze Projekte
- **Adress-Übernahme**: Gewerke übernehmen die Adresse des übergeordneten Projekts
- **Projekt-Kontext**: Jedes Gewerk zeigt das zugehörige Projekt an

### 2. Intuitive Filter
- **Kategorie-basiert**: Dienstleister können nach ihrem Fachgebiet filtern
- **Status-basiert**: Nur relevante Gewerke (geplant, in Bearbeitung)
- **Budget-basiert**: Passende Auftragsgrößen
- **Prioritäts-basiert**: Dringende Aufträge erkennen

### 3. Benutzerfreundliche Darstellung
- **Klare Hierarchie**: Gewerk → Projekt → Adresse
- **Visuelle Indikatoren**: Icons für Kategorien, Status, Priorität
- **Relevante Metriken**: Entfernung, Budget, Fortschritt

## Technische Details

### Datenbank-Query
```sql
SELECT milestone.*, project.* 
FROM milestones milestone
JOIN projects project ON milestone.project_id = project.id
WHERE project.is_public = true 
  AND project.allow_quotes = true
  AND project.address IS NOT NULL
  AND milestone.category = ?
  AND milestone.status = ?
  AND milestone.priority = ?
  AND milestone.budget BETWEEN ? AND ?
```

### Geocoding-Prozess
1. Projekt-Adresse wird geocodiert
2. Entfernung zum Suchzentrum berechnet
3. Nur Gewerke im Radius zurückgegeben
4. Nach Entfernung sortiert

### Sicherheit
- Nur Dienstleister können nach Gewerken suchen
- Nur öffentliche Projekte mit erlaubten Angeboten
- Adressdaten werden validiert

## Verwendung

### Für Dienstleister
1. GeoSearch-Seite öffnen
2. "Gewerke"-Tab wählen
3. Standort auswählen (Browser oder manuell)
4. Filter anpassen (Kategorie, Status, Budget)
5. Relevante Gewerke finden und kontaktieren

### Für Bauträger
- Gewerke werden automatisch mit Projekt-Adresse verknüpft
- Dienstleister finden Gewerke in ihrer Nähe
- Bessere Matching-Qualität

## Vorteile

1. **Relevanz**: Dienstleister sehen konkrete Aufträge, nicht ganze Projekte
2. **Effizienz**: Direkte Filterung nach Fachgebiet und Budget
3. **Transparenz**: Klare Darstellung von Projekt-Kontext und Adresse
4. **Benutzerfreundlichkeit**: Intuitive Filter und Darstellung
5. **Skalierbarkeit**: Einfache Erweiterung um weitere Filter

## Nächste Schritte

1. **Karten-Integration**: Leaflet-Karten für visuelle Darstellung
2. **Benachrichtigungen**: Push-Notifications für neue Gewerke
3. **Bewertungssystem**: Dienstleister-Bewertungen für Gewerke
4. **Chat-Integration**: Direkte Kommunikation zwischen Bauträger und Dienstleister
5. **Mobile App**: Native App für unterwegs

## Fazit

Die Gewerk-Suche macht die Plattform für Dienstleister viel relevanter und benutzerfreundlicher. Anstatt durch ganze Projekte zu scrollen, finden sie direkt passende Aufträge in ihrer Nähe und können gezielt nach ihrem Fachgebiet und Budget filtern. 