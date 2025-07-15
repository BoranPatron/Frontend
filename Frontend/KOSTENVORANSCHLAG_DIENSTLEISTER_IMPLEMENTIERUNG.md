# Kostenvoranschlag-Funktionalität für Dienstleister

## Übersicht

Die neue Kostenvoranschlag-Funktionalität ermöglicht es Dienstleistern, professionelle Kostenvoranschläge basierend auf den detaillierten Gewerk-Informationen abzugeben. Der Button "Angebot abgeben" wurde zu "Kostenvoranschlag abgeben" geändert und öffnet eine umfassende Seite mit allen relevanten Informationen.

## Implementierte Komponenten

### 1. CostEstimateForm.tsx
**Neue Komponente für professionelle Kostenvoranschlag-Erstellung**

**Features:**
- **Umfassende Gewerk-Informationen**: Zeigt alle Details des Gewerks in der Sidebar
- **Professionelles Formular**: Strukturiert in Tabs für bessere Übersicht
- **Kategorie-spezifische Felder**: Automatische Anzeige der technischen Spezifikationen
- **Dokumenten-Upload**: Unterstützung für gängige Formate
- **Validierung**: Umfassende Eingabevalidierung mit spezifischen Fehlermeldungen
- **Responsive Design**: Optimiert für alle Bildschirmgrößen

**Tabs:**
1. **Übersicht**: Basis-Informationen und Gesamtbetrag
2. **Kosten**: Detaillierte Kostenaufschlüsselung
3. **Zeitplan**: Geschätzte Dauer und Termine
4. **Qualifikationen**: Dienstleister-Informationen und Referenzen
5. **Technisch**: Technischer Ansatz und Qualitätsstandards
6. **Dokumente**: Datei-Upload und zusätzliche Notizen

### 2. Erweiterte Quotes.tsx
**Integration der neuen Kostenvoranschlag-Funktionalität**

**Änderungen:**
- Button "Angebot abgeben" → "Kostenvoranschlag abgeben"
- Neue State-Variablen für CostEstimateForm
- Integration der neuen Komponente
- API-Integration für Kostenvoranschlag-Erstellung

## Funktionsweise

### 1. Button-Änderung
**Vorher:**
```typescript
<Handshake size={16} className="inline mr-2" />
Angebot abgeben
```

**Jetzt:**
```typescript
<Calculator size={16} className="inline mr-2" />
Kostenvoranschlag abgeben
```

### 2. Modal-Öffnung
```typescript
const openCostEstimateModal = (trade: Trade) => {
  setSelectedTradeForEstimate(trade);
  setShowCostEstimateForm(true);
};
```

### 3. Kostenvoranschlag-Erstellung
```typescript
const handleCostEstimateSubmit = async (costEstimateData: any) => {
  // API-Call für Kostenvoranschlag-Erstellung
  const quoteData = {
    title: costEstimateData.title,
    description: costEstimateData.description,
    project_id: costEstimateData.project_id,
    milestone_id: costEstimateData.trade_id,
    service_provider_id: user?.id || 0,
    total_amount: parseFloat(costEstimateData.total_amount),
    currency: costEstimateData.currency,
    valid_until: costEstimateData.valid_until,
    estimated_duration: parseInt(costEstimateData.estimated_duration),
    start_date: costEstimateData.start_date,
    completion_date: costEstimateData.completion_date,
    labor_cost: costEstimateData.labor_cost ? parseFloat(costEstimateData.labor_cost) : 0,
    material_cost: costEstimateData.material_cost ? parseFloat(costEstimateData.material_cost) : 0,
    overhead_cost: costEstimateData.overhead_cost ? parseFloat(costEstimateData.overhead_cost) : 0,
    payment_terms: costEstimateData.payment_terms,
    warranty_period: costEstimateData.warranty_period ? parseInt(costEstimateData.warranty_period) : 24,
    status: 'submitted',
    company_name: costEstimateData.company_name,
    contact_person: costEstimateData.contact_person,
    phone: costEstimateData.phone,
    email: costEstimateData.email,
    website: costEstimateData.website
  };
  
  await createQuote(quoteData);
};
```

## Benutzerfreundlichkeit

### 1. Intuitive Bedienung
- **Schritt-für-Schritt**: Klare Strukturierung in Tabs
- **Kontextuelle Hilfe**: Tooltips und Beschreibungen
- **Responsive Design**: Optimiert für Desktop, Tablet und Mobile

### 2. Automatisierung
- **Automatische Anzeige**: Gewerk-Informationen werden automatisch geladen
- **Intelligente Vorschläge**: Vorausfüllung basierend auf Gewerk-Kategorie
- **Validierung in Echtzeit**: Sofortige Rückmeldung bei Eingaben

### 3. Professionelle Darstellung
- **BuildWise-Farbschema**: Konsistentes Design
- **Moderne UI**: Gradient-Hintergründe und Glasmorphismus
- **Klare Struktur**: Sidebar mit Gewerk-Info, Hauptbereich mit Formular

## Technische Details

### 1. Datenstruktur
```typescript
interface CostEstimateFormData {
  // Basis-Informationen
  title: string;
  description: string;
  total_amount: string;
  currency: string;
  valid_until: string;
  
  // Zeitplan
  estimated_duration: string;
  start_date: string;
  completion_date: string;
  
  // Kostenaufschlüsselung
  labor_cost: string;
  material_cost: string;
  overhead_cost: string;
  profit_margin: string;
  
  // Zahlungsbedingungen
  payment_terms: string;
  warranty_period: string;
  
  // Dienstleister-Informationen
  company_name: string;
  contact_person: string;
  phone: string;
  email: string;
  website: string;
  
  // Qualifikationen und Referenzen
  qualifications: string;
  references: string;
  certifications: string;
  
  // Technische Details
  technical_approach: string;
  quality_standards: string;
  safety_measures: string;
  environmental_compliance: string;
  
  // Risiko-Bewertung
  risk_assessment: string;
  contingency_plan: string;
  
  // Dokumente
  documents: File[];
  
  // Zusätzliche Informationen
  additional_notes: string;
}
```

### 2. Validierung
```typescript
const validateForm = () => {
  const errors: string[] = [];
  
  if (!formData.total_amount) errors.push('Gesamtbetrag');
  if (!formData.valid_until) errors.push('Gültig bis');
  if (!formData.estimated_duration) errors.push('Geschätzte Dauer');
  if (!formData.start_date) errors.push('Startdatum');
  if (!formData.completion_date) errors.push('Fertigstellungsdatum');
  if (!formData.company_name) errors.push('Firmenname');
  if (!formData.contact_person) errors.push('Ansprechpartner');
  if (!formData.email) errors.push('E-Mail');
  
  return errors;
};
```

### 3. Datei-Upload
```typescript
const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
  if (e.target.files) {
    const newFiles = Array.from(e.target.files);
    setFormData(prev => ({
      ...prev,
      documents: [...prev.documents, ...newFiles]
    }));
  }
};
```

## Vorteile der neuen Implementierung

### Für Dienstleister
1. **Bessere Informationen**: Umfassende Gewerk-Details für präzise Kostenvoranschläge
2. **Professionelle Darstellung**: Strukturiertes Formular mit allen relevanten Feldern
3. **Zeitersparnis**: Automatische Anzeige der technischen Spezifikationen
4. **Qualitätsverbesserung**: Detaillierte Eingabemöglichkeiten für bessere Kostenvoranschläge

### Für Bauträger
1. **Höhere Qualität**: Professionellere Kostenvoranschläge durch bessere Informationen
2. **Reduzierte Nachfragen**: Weniger Rückfragen durch umfassende Spezifikationen
3. **Bessere Vergleichbarkeit**: Standardisierte Struktur für einfacheren Vergleich
4. **Zeitersparnis**: Schnellere Vergabe durch qualitativ hochwertigere Kostenvoranschläge

### Für das System
1. **Standardisierung**: Einheitliche Struktur für alle Kostenvoranschläge
2. **Skalierbarkeit**: Einfache Erweiterung um neue Felder
3. **Datenqualität**: Strukturierte und validierte Daten
4. **Benutzerfreundlichkeit**: Intuitive und effiziente Bedienung

## Test-Szenarien

### 1. Kostenvoranschlag-Erstellung
1. Dienstleister klickt auf "Kostenvoranschlag abgeben"
2. Modal öffnet sich mit allen Gewerk-Informationen
3. Dienstleister füllt alle Pflichtfelder aus
4. Kostenvoranschlag wird eingereicht
5. **Erwartung**: Kostenvoranschlag wird erstellt und angezeigt

### 2. Validierung
1. Pflichtfelder leer lassen
2. Ungültige Daten eingeben
3. **Erwartung**: Klare Fehlermeldungen werden angezeigt

### 3. Datei-Upload
1. Verschiedene Dateiformate hochladen
2. Dateigröße über 10MB testen
3. **Erwartung**: Nur gültige Dateien werden akzeptiert

### 4. Responsive Design
1. Auf verschiedenen Bildschirmgrößen testen
2. **Erwartung**: Optimale Darstellung auf allen Geräten

## Zukunftserweiterungen

### Mögliche Erweiterungen
1. **KI-Unterstützung**: Automatische Vorschläge basierend auf Gewerk-Kategorie
2. **Templates**: Vorlagen für häufige Kostenvoranschläge
3. **Berechnungen**: Automatische Berechnungen basierend auf Eingaben
4. **Integration**: Verbindung mit CAD-Systemen und BIM

### Neue Features
1. **Mehrsprachigkeit**: Unterstützung für verschiedene Sprachen
2. **Offline-Modus**: Lokale Speicherung für Offline-Arbeit
3. **Synchronisation**: Automatische Synchronisation über Geräte hinweg
4. **Analytics**: Detaillierte Analysen der Kostenvoranschläge

## Fazit

Die neue Kostenvoranschlag-Funktionalität bietet:

1. **Professionelle Darstellung**: Umfassende Seite mit allen Gewerk-Informationen
2. **Strukturiertes Formular**: Klare Tabs für bessere Übersicht
3. **Automatische Integration**: Gewerk-Details werden automatisch angezeigt
4. **Validierung**: Robuste Eingabevalidierung und Fehlerbehandlung
5. **Benutzerfreundlichkeit**: Intuitive und effiziente Bedienung
6. **BuildWise-Design**: Konsistentes Farbschema und moderne UI

Die Implementierung stellt sicher, dass Dienstleister alle notwendigen Informationen erhalten, um professionelle und qualitativ hochwertige Kostenvoranschläge zu erstellen. 