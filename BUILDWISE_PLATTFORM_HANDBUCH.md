# BuildWise Plattform - Funktionsbeschreibung & Handbuch

## Inhaltsverzeichnis

1. [Übersicht](#übersicht)
2. [Rollen & Zugriff](#rollen--zugriff)
3. [Dashboard Bauträger](#dashboard-bauträger)
4. [Dashboard Dienstleister](#dashboard-dienstleister)
5. [Kernfunktionen](#kernfunktionen)
6. [Modals & Dialoge](#modals--dialoge)
7. [Navigation & Benutzerführung](#navigation--benutzerführung)
8. [Mobile Optimierung](#mobile-optimierung)

---

## Übersicht

BuildWise ist eine umfassende digitale Plattform für die Bauwirtschaft, die Bauträger und Dienstleister vernetzt. Die Plattform bietet Projektmanagement, Ausschreibungsmanagement, Dokumentenverwaltung, Finanzanalyse und Kommunikationstools.

### Hauptmerkmale
- **Projektmanagement**: Vollständige Verwaltung von Bauprojekten mit Bauphasen-Tracking
- **Ausschreibungsmanagement**: Erstellung, Verwaltung und Bewertung von Ausschreibungen
- **Dokumentenmanagement (DMS)**: Strukturierte Verwaltung aller Projektdokumente
- **Geo-basierte Suche**: Finde Projekte und Ausschreibungen in der Nähe
- **Finanzanalyse**: Budget-Tracking, Kostenanalyse und Rechnungsverwaltung
- **Ressourcenmanagement**: Personal- und Materialplanung für Dienstleister
- **Task-Management**: Kanban-basiertes Aufgabenmanagement
- **Canvas**: Kollaborative Zeichnungen und Annotationen
- **Credit-System**: Belohnungssystem für Bauträger

---

## Rollen & Zugriff

### Bauträger (BAUTRAEGER)
- Vollzugriff auf alle Projekte
- Ausschreibungen erstellen und verwalten
- Angebote bewerten und annehmen
- Dokumentenmanagement
- Finanzanalyse und Budgetverwaltung
- Credit-System nutzen
- Aufgaben erstellen und zuweisen

### Dienstleister (DIENSTLEISTER)
- Zugriff auf öffentliche Ausschreibungen
- Angebote einreichen
- Ressourcenmanagement
- Rechnungsverwaltung
- Dokumentenzugriff für zugewiesene Projekte
- Task-Verwaltung für zugewiesene Aufgaben
- Geo-basierte Ausschreibungssuche

---

## Dashboard Bauträger

### Hauptbereiche

#### 1. Projektübersicht
- **Projektauswahl**: Dropdown zur Auswahl des aktiven Projekts
- **Projekt-Navigation**: Pfeile zum Wechseln zwischen Projekten
- **Projekt-Informationen**: Name, Beschreibung, Status, Bauphase
- **Bauphasen-Timeline**: Visuelle Darstellung der aktuellen Bauphase
- **Projektfortschritt**: Fortschrittsbalken und Prozentanzeige

#### 2. Projekt-Kacheln (Dashboard Cards)

**Projekt-Manager**
- Navigiert zur Projekt-Detailseite
- Zeigt Projektübersicht und Statistiken

**Dokumente**
- Navigiert zur Dokumentenverwaltung
- Zeigt Anzahl der Dokumente
- Upload-Funktion direkt verfügbar

**To-Do / Aufgaben**
- Navigiert zur Aufgabenverwaltung
- Zeigt offene Aufgaben
- Kanban-Board Integration

**Gewerke / Ausschreibungen**
- Zeigt alle Gewerke/Milestones des Projekts
- Status-Übersicht (geplant, in Bearbeitung, abgeschlossen)
- Direkter Zugriff auf Angebote

**Visualize / Analytics**
- Navigiert zur Finanzanalyse
- Charts und Diagramme
- Budget-Tracking

**Canvas**
- Navigiert zur Kollaborations-Zeichnung
- Projekt-spezifische Canvas

#### 3. Bauphasen-Timeline
- **Länder-spezifische Phasen**:
  - **Schweiz**: Vorprojekt → Projektierung → Baugenehmigung → Ausschreibung → Aushub → Fundament → Rohbau → Dach → Fassade → Innenausbau → Fertigstellung
  - **Deutschland**: Planungsphase → Baugenehmigung → Ausschreibung → Aushub → Fundament → Rohbau → Dach → Fassade → Innenausbau → Fertigstellung
  - **Österreich**: Planungsphase → Einreichung → Ausschreibung → Aushub → Fundament → Rohbau → Dach → Fassade → Innenausbau → Fertigstellung
- **Status-Anzeige**: Aktuelle Phase hervorgehoben
- **Fortschritt**: Prozentuale Anzeige des Projektfortschritts

#### 4. Finanz-Widget
- **Budget-Anzeige**: Gesamtbudget vs. aktuelle Kosten
- **Kostenübersicht**: Nach Kategorien aufgeschlüsselt
- **Trend-Indikatoren**: Steigende/sinkende Kosten
- **Navigation**: Zu detaillierter Finanzanalyse

#### 5. Quick Actions (Radial Menu)
- **Neues Projekt erstellen**: Öffnet Projekt-Erstellungs-Modal
- **Neue Ausschreibung**: Erstellt ein neues Gewerk/Milestone
- **Dokument hochladen**: Schnellzugriff auf Upload
- **Neue Aufgabe**: Erstellt Task im Kanban-Board
- **Navigation**: Zu verschiedenen Bereichen

---

## Dashboard Dienstleister

### Hauptbereiche

#### 1. Geo-basierte Ausschreibungssuche
- **Standort-Einstellung**: 
  - Browser-Standort verwenden
  - Manuelle Adresseingabe
  - Adressautocomplete
- **Radius-Suche**: Konfigurierbarer Suchradius (Standard: 50km)
- **Filter**:
  - Kategorie (Elektro, Sanitär, etc.)
  - Status (offen, vergeben, etc.)
  - Budget-Bereich
  - Priorität
- **Ansichtsmodi**:
  - **Kartenansicht**: Interaktive Karte mit Markern
  - **Listenansicht**: Kompakte Liste aller Ausschreibungen
  - **Kartenansicht**: Große Karten mit Details

#### 2. Ausschreibungs-Karten
- **Informationen pro Ausschreibung**:
  - Titel und Beschreibung
  - Projektname und Standort
  - Entfernung zum Standort
  - Budget-Bereich
  - Status und Priorität
  - Kategorie
  - Fälligkeitsdatum
- **Aktionen**:
  - **Details anzeigen**: Öffnet TradeDetailsModal
  - **Angebot abgeben**: Öffnet CostEstimateForm
  - **Auf Karte anzeigen**: Zeigt Position

#### 3. Ressourcenmanagement
- **Ressourcen-Übersicht**:
  - Anzahl Mitarbeiter
  - Verfügbare Personentage
  - Gesamtstunden
  - Auslastung in Prozent
- **Ressourcen-Verwaltung**:
  - Ressourcen hinzufügen/bearbeiten/löschen
  - Allokationen anzeigen
  - Kalenderansicht
  - KPI-Dashboard

#### 4. Angebote-Verwaltung
- **Meine Angebote**: Übersicht aller eingereichten Angebote
- **Status-Filter**: Draft, Submitted, Accepted, Rejected
- **Aktionen**:
  - Angebot bearbeiten (wenn noch Draft)
  - Angebot zurückziehen
  - Details anzeigen

#### 5. Abgeschlossene Projekte
- **Archiv-Ansicht**: Abgeschlossene Projekte
- **Rechnungen**: Zugriff auf Rechnungen für abgeschlossene Projekte
- **Bewertungen**: Feedback und Ratings anzeigen

#### 6. Account-Status
- **BuildWise Gebühren**: Verwaltung der Plattform-Gebühren
- **Account-Sperre**: Bei überfälligen Zahlungen
- **Zahlungsstatus**: Übersicht über Zahlungen

---

## Kernfunktionen

### 1. Projektverwaltung

#### Projekt erstellen
**Modal**: `ProjectCreationModal`
- **Pflichtfelder**:
  - Projektname
  - Projekttyp (Neubau, Renovierung, Anbau, Sanierung)
  - Adresse (Straße, PLZ, Stadt, Land)
  - Budget (optional)
- **Optionale Felder**:
  - Beschreibung
  - Baugrundstück-Größe
  - Baufläche
  - Start- und Enddatum
  - Bauphase
- **Dokumenten-Upload**: 
  - Direkt beim Erstellen möglich
  - Automatische Kategorisierung
  - Unterstützt alle gängigen Formate
- **Einstellungen**:
  - Öffentlich/Privat
  - Angebote erlauben

#### Projekt bearbeiten
**Modal**: `ProjectDetailsModal` (Edit-Modus)
- Alle Felder des Projekts bearbeitbar
- Bauphase ändern
- Status aktualisieren

#### Projekt-Detailseite
**Route**: `/project/:id`
- **Übersicht**:
  - Projektinformationen
  - Statistiken (Tasks, Dokumente, Angebote)
  - Finanzübersicht
- **Gewerke-Tab**: Alle Ausschreibungen des Projekts
- **Aufgaben-Tab**: Kanban-Board mit Tasks
- **Dokumente-Tab**: Projektdokumente
- **Angebote-Tab**: Alle Angebote für das Projekt

### 2. Ausschreibungsmanagement (Gewerke)

#### Gewerk erstellen
**Modal**: `TradeCreationForm`
- **Basis-Informationen**:
  - Titel
  - Beschreibung
  - Kategorie (aus vordefinierten Kategorien)
  - Priorität (Niedrig, Mittel, Hoch, Kritisch)
  - Budget
- **Termine**:
  - Geplanter Start
  - Geplantes Ende
  - Fälligkeitsdatum
- **Kategorie-spezifische Felder**:
  - **Elektro**: Spannung, Leistung, Schaltkreise, etc.
  - **Sanitär**: Armaturen, Rohrlänge, Warmwasserbereiter, etc.
  - **Heizung**: Systemtyp, Leistung, Heizkörper, etc.
  - **Dach**: Material, Fläche, Neigung, etc.
  - Und viele weitere...
- **Einstellungen**:
  - Als kritisch markieren
  - Benachrichtigung bei Abschluss

#### Gewerk bearbeiten
- Alle Felder bearbeitbar
- Status ändern
- Budget anpassen

#### Gewerk-Details
**Modal**: `TradeDetailsModal`
- **Übersicht**: Alle Informationen zum Gewerk
- **Angebote**: Liste aller eingegangenen Angebote
- **Dokumente**: Zugeordnete Dokumente
- **Status-Verwaltung**: Status ändern
- **Aktionen**:
  - Abnahme erstellen
  - Auftragsbestätigung generieren
  - Dokumente hochladen

### 3. Angebotsmanagement

#### Angebot einreichen (Dienstleister)
**Modal**: `CostEstimateForm` / `ServiceProviderQuoteModal`
- **Basis-Informationen**:
  - Titel
  - Beschreibung
  - Gesamtbetrag
  - Währung
  - Gültig bis
- **Kostenaufschlüsselung**:
  - Lohnkosten
  - Materialkosten
  - Gemeinkosten
- **Termine**:
  - Startdatum
  - Fertigstellungsdatum
- **Weitere Informationen**:
  - Zahlungsbedingungen
  - Garantiezeit
  - Risikobewertung
  - Preisabweichung
- **Kontaktinformationen**:
  - Firmenname
  - Ansprechpartner
  - Telefon
  - E-Mail
  - Website
- **Dokumente**:
  - PDF-Upload
  - Zusätzliche Dokumente
- **Status**: Draft, Submitted

#### Angebot bearbeiten
- Bearbeitung möglich, solange Status "Draft"
- Nach Submission nur Rückzug möglich

#### Angebot bewerten (Bauträger)
**Modal**: `QuoteDetailsModal`
- **Angebotsdetails**: Alle Informationen anzeigen
- **Vergleich**: Mit anderen Angeboten vergleichen
- **Bewertung**:
  - Angebot annehmen
  - Angebot ablehnen (mit Begründung)
  - Zurückziehen (wenn Draft)
- **Kontaktfreigabe**: Kontaktdaten freigeben
- **Bewertung & Feedback**: Rating und Kommentar nach Abschluss

#### Auftragsbestätigung generieren
**Modal**: `OrderConfirmationGenerator`
- Automatische Generierung nach Angebotsannahme
- PDF-Download
- E-Mail-Versand möglich

### 4. Dokumentenmanagement (DMS)

#### Dokumenten-Kategorien
- **Planung & Genehmigung**: Baupläne, Baugenehmigungen, Statik, etc.
- **Verträge & Rechtliches**: Bauverträge, Nachträge, Versicherungen, etc.
- **Finanzen & Abrechnung**: Rechnungen, Kostenvoranschläge, Zahlungsbelege, etc.
- **Ausführung & Handwerk**: Lieferscheine, Abnahmeprotokolle, Zertifikate, etc.
- **Dokumentation & Medien**: Fotos, Videos, Baustellenberichte, etc.
- **Ausschreibungen & Angebote**: Ausschreibungsunterlagen, Angebote, etc.
- **Projektmanagement**: Projektpläne, Terminplanung, Risikomanagement, etc.
- **Technische Unterlagen**: Zeichnungen, Spezifikationen, Handbücher, etc.
- **Auftragsbestätigungen**: Bestätigungen, Leistungsbestätigungen

#### Dokument hochladen
**Modal**: Upload-Dialog (integriert in Documents-Seite)
- **Drag & Drop**: Dateien per Drag & Drop hochladen
- **Dateiauswahl**: Standard-Dateiauswahl
- **Automatische Kategorisierung**: KI-basierte Erkennung
- **Manuelle Kategorisierung**: 
  - Kategorie wählen
  - Unterkategorie wählen
  - Beschreibung hinzufügen
- **Mehrfach-Upload**: Mehrere Dateien gleichzeitig
- **Fortschrittsanzeige**: Upload-Status pro Datei

#### Dokumentenverwaltung
**Seite**: `/documents`
- **Filter**:
  - Projekt
  - Kategorie
  - Unterkategorie
  - Status
  - Favoriten
  - Ausschreibung
  - Suche
- **Ansichtsmodi**:
  - Grid-Ansicht (Karten)
  - Listenansicht
- **Aktionen**:
  - Dokument anzeigen
  - Dokument bearbeiten
  - Dokument löschen
  - Als Favorit markieren
  - Herunterladen
  - Teilen
- **Dokumentenviewer**:
  - PDF-Anzeige
  - Bildanzeige
  - Video-Player
  - Office-Dokumente (wenn unterstützt)

#### Dokumenten-Sidebar (Bauträger)
- Schnellzugriff auf häufig verwendete Dokumente
- Projekt-spezifische Dokumente
- Kategorien-Navigation

### 5. Aufgabenmanagement (Tasks)

#### Kanban-Board
**Seite**: `/tasks`
- **Spalten**:
  - To-Do
  - In Bearbeitung
  - Review
  - Abgeschlossen
  - Abgebrochen
- **Task erstellen**:
  - Titel
  - Beschreibung
  - Zuordnung zu Projekt
  - Priorität
  - Fälligkeitsdatum
  - Geschätzte Stunden
  - Zuweisung (für Dienstleister)
- **Task bearbeiten**:
  - Status ändern
  - Ziehen zwischen Spalten
  - Details bearbeiten
- **Filter**:
  - Nur mir zugewiesene
  - Projekt-Filter
  - Archivierte Tasks

#### Task-Details
**Modal**: `TaskDetailModal`
- Alle Task-Informationen
- Kommentare
- Anhänge
- Zeit-Tracking
- Historie

### 6. Finanzanalyse

#### Finanz-Widget (Dashboard)
- Budget-Anzeige
- Aktuelle Kosten
- Trend-Indikatoren
- Navigations-Link zur Detailanalyse

#### Finanz-Analytics
**Seite**: `/visualize`
- **Charts**:
  - Budget vs. Ist-Kosten
  - Kosten nach Kategorien
  - Kostenverlauf über Zeit
  - Gewerk-Übersicht
- **Projekt-Finanzanalyse**:
  - Detaillierte Kostenaufschlüsselung
  - Prognosen
  - Abweichungsanalyse

#### Rechnungsverwaltung (Dienstleister)
**Seite**: `/invoices`
- **Rechnungen erstellen**: 
  - Modal: `InvoiceModal`
  - Verknüpfung mit Gewerk
  - Automatische Nummerierung
  - PDF-Generierung
- **Rechnungs-Übersicht**:
  - Status-Filter (Draft, Sent, Viewed, Paid, Overdue)
  - Suche
  - Statistiken (Gesamtsumme, Bezahlt, Ausstehend)
- **Aktionen**:
  - Rechnung ansehen
  - Rechnung herunterladen
  - Status aktualisieren

### 7. Ressourcenmanagement (Dienstleister)

#### Ressourcen verwalten
**Modal**: `ResourceManagementModal`
- **Ressourcen hinzufügen**:
  - Typ (Mitarbeiter, Material, Equipment)
  - Anzahl
  - Zeitraum (Start- und Enddatum)
  - Tägliche Arbeitsstunden
  - Verfügbarkeit
- **Ressourcen-Übersicht**:
  - Liste aller Ressourcen
  - Status (Verfügbar, Allokiert)
  - Allokationen anzeigen
- **Ressourcen-Kalender**:
  - Zeitliche Darstellung
  - Allokationen visualisieren
  - Verfügbarkeit prüfen

#### Ressourcen-Details
**Modal**: `ResourceDetailsModal`
- Alle Informationen zur Ressource
- Allokations-Historie
- Bearbeiten/Löschen

#### Ressourcen-KPI
**Komponente**: `ResourceKPIDashboard`
- Gesamtstatistiken
- Auslastung
- Verfügbarkeit
- Trends

### 8. Geo-basierte Suche

#### Funktionen
- **Standort-Ermittlung**:
  - Browser-Geolocation
  - Manuelle Adresseingabe
  - Adressautocomplete
- **Radius-Suche**:
  - Konfigurierbarer Radius (5-200km)
  - Gespeicherte Standorte
- **Suchmodi**:
  - Projekte suchen
  - Ausschreibungen suchen
  - Dienstleister suchen
- **Filter**:
  - Kategorie
  - Status
  - Budget
  - Priorität
  - Entfernung
- **Ansichten**:
  - Kartenansicht mit Markern
  - Listenansicht
  - Kartenansicht (große Karten)

#### Geo-Details
**Modal**: `GeoDetailsModal`
- Standort auf Karte
- Entfernung
- Wegbeschreibung
- Kontaktinformationen

### 9. Abnahmen & Qualitätsmanagement

#### Abnahme erstellen
**Modal**: `CreateInspectionModal`
- **Abnahme-Typ**:
  - Vorabnahme
  - Zwischenabnahme
  - Endabnahme
- **Termine**:
  - Besichtigungstermin
  - Benachrichtigung an Dienstleister
- **Teilnehmer**:
  - Bauträger
  - Dienstleister
  - Optional: weitere Teilnehmer
- **Mängel-Dokumentation**:
  - Fotos hochladen
  - Beschreibung
  - Priorität
  - Frist zur Behebung

#### Abnahme-Verwaltung
- **Status-Tracking**:
  - Geplant
  - Durchgeführt
  - Abgeschlossen
- **Mängel-Verwaltung**:
  - Mängel erfassen
  - Status aktualisieren
  - Nachkontrolle planen
- **Abnahme-Entscheidung**:
  - Abnahme-Modal: `InspectionDecisionModal`
  - Abnahme bestätigen
  - Mit Mängeln zurückweisen
  - Teilabnahme

#### Mängel-Dokumentation
**Modal**: `DefectDocumentationModal`
- Foto-Upload
- Beschreibung
- Position (optional)
- Priorität
- Frist

### 10. Canvas (Kollaboration)

#### Funktionen
- **Zeichnen**:
  - Freihandzeichnung
  - Formen (Rechteck, Kreis, Linie)
  - Text
  - Pfeile
- **Annotationen**:
  - Kommentare
  - Markierungen
  - Maßangaben
- **Upload**:
  - Bild hochladen
  - Als Hintergrund verwenden
- **Export**:
  - PNG
  - PDF
  - SVG
- **Kollaboration**:
  - Echtzeit-Synchronisation
  - Mehrere Benutzer gleichzeitig

### 11. Credit-System (Bauträger)

#### Credit-Verwaltung
**Seite**: `/credits`
- **Credit-Anzeige**: Aktueller Stand
- **Credit-Historie**: Transaktionen
- **Credit-Verwendung**:
  - Für Angebotsannahme
  - Für Premium-Features
- **Credit-Erwerb**:
  - Kauf-Optionen
  - Bonus-Credits

#### Credit-Dashboard
- Übersicht über Credits
- Statistiken
- Verwendungs-Historie

---

## Modals & Dialoge

### Projekt-Modals

#### ProjectCreationModal
- Projekt erstellen
- Dokumenten-Upload integriert
- Bauphasen-Auswahl

#### ProjectDetailsModal
- Projekt-Details anzeigen
- Projekt bearbeiten
- Projekt-Informationen

### Ausschreibungs-Modals

#### TradeCreationForm
- Gewerk erstellen
- Kategorie-spezifische Felder
- Termine und Budget

#### TradeDetailsModal
- Gewerk-Details
- Angebote anzeigen
- Dokumente zuordnen
- Aktionen (Abnahme, Auftragsbestätigung)

#### CostEstimateDetailsModal
- Kostenvoranschlag-Details
- Vergleich mit anderen Angeboten
- Bewertung

### Angebots-Modals

#### CostEstimateForm
- Angebot erstellen (Dienstleister)
- Kostenaufschlüsselung
- Kontaktinformationen

#### ServiceProviderQuoteModal
- Angebot erstellen/bearbeiten
- Status-Verwaltung

#### QuoteDetailsModal
- Angebot-Details
- Bewertung
- Annahme/Ablehnung

#### QuoteRevisionModal
- Angebot überarbeiten
- Versionen verwalten

#### ReviseQuoteModal
- Angebot korrigieren
- Neue Version erstellen

### Dokumenten-Modals

#### DocumentViewerModal
- Dokument anzeigen
- PDF-Viewer
- Bildanzeige
- Video-Player

#### Upload-Modal (integriert)
- Mehrfach-Upload
- Kategorisierung
- Fortschrittsanzeige

### Aufgaben-Modals

#### TaskCreationModal
- Task erstellen
- Details festlegen
- Zuweisung

#### TaskDetailModal
- Task-Details
- Kommentare
- Anhänge
- Status-Änderung

### Finanz-Modals

#### InvoiceModal
- Rechnung erstellen
- PDF-Generierung
- Verknüpfung mit Gewerk

#### InvoiceManagementModal
- Rechnungen verwalten
- Status aktualisieren
- Statistiken

### Ressourcen-Modals

#### ResourceManagementModal
- Ressourcen verwalten
- Allokationen
- Kalender

#### ResourceDetailsModal
- Ressourcen-Details
- Bearbeiten/Löschen

### Abnahme-Modals

#### CreateInspectionModal
- Abnahme erstellen
- Termine planen
- Teilnehmer einladen

#### InspectionDecisionModal
- Abnahme-Entscheidung
- Mängel erfassen
- Status aktualisieren

#### DefectDocumentationModal
- Mängel dokumentieren
- Fotos hochladen
- Priorität setzen

#### FinalAcceptanceModal
- Endabnahme
- Abschluss bestätigen

#### MilestoneCompletionModal
- Meilenstein abschließen
- Dokumentation

### Sonstige Modals

#### RoleSelectionModal
- Rolle wählen (Onboarding)
- Bauträger oder Dienstleister

#### CompanyAddressModal
- Firmenadresse eingeben
- Onboarding-Schritt

#### UpgradeModal
- Upgrade-Angebot
- Premium-Features

#### AccountLockedModal
- Account gesperrt
- Zahlung erforderlich

#### AcceptanceModalNew
- Abnahme bestätigen
- Dokumentation

#### GeoDetailsModal
- Geo-Informationen
- Karte anzeigen
- Kontakt

---

## Navigation & Benutzerführung

### Radial Menu (Quick Actions)

#### Für Bauträger
**Innerer Ring**:
- Neues Projekt
- Neue Ausschreibung

**Äußerer Ring**:
- Dokumente
- To-Do
- Visualize
- Canvas
- Neue Aufgabe
- Upload

#### Für Dienstleister
**Innerer Ring**:
- Neue Ressource

**Äußerer Ring**:
- Dokumente
- To-Do
- Ausschreibungen
- Rechnungen

### Navbar

#### Hauptnavigation
- Dashboard
- Projekte
- Dokumente
- Aufgaben
- Nachrichten
- Analytics
- Profile

#### Funktionen
- Projektauswahl
- Credit-Anzeige
- Benachrichtigungen
- Suche
- Einstellungen

### Notification Tabs

#### Bauträger Notification Tab
- Neue Angebote
- Terminantworten
- Abnahme-Termine
- Task-Zuweisungen

#### Dienstleister Notification Tab
- Terminanfragen
- Angebots-Updates
- Neue Ausschreibungen
- Task-Zuweisungen

### Central Tab Cluster
- Schnellzugriff auf wichtige Funktionen
- Projekt-Kontext
- Häufig verwendete Aktionen

---

## Mobile Optimierung

### Responsive Design
- Mobile-optimierte Layouts
- Touch-optimierte Bedienung
- Swipe-Gesten
- Kompakte Navigation

### Mobile-spezifische Komponenten
- MobileDashboardOptimized
- MobileDocumentsView
- Mobile Modal Templates

### Performance-Optimierungen
- Lazy Loading
- Bildoptimierung
- Caching
- Offline-Funktionalität (Service Worker)

---

## Onboarding & Hilfe

### Onboarding-Flow
1. **Rollenauswahl**: Bauträger oder Dienstleister
2. **Firmenadresse**: Eingabe der Firmeninformationen
3. **Dashboard-Tour**: Geführte Tour durch das Dashboard
4. **Welcome Notification**: Willkommens-Credits

### Contextual Onboarding
- Kontextbezogene Hilfe
- Tooltips
- Guided Tours
- Schritt-für-Schritt-Anleitungen

### Hilfe-Tab
- FAQ
- Anleitungen
- Support-Kontakt
- Video-Tutorials

---

## Technische Details

### Kategorien & Status

#### Gewerk-Status
- Planning
- Cost Estimate
- Tender
- Bidding
- Evaluation
- Awarded
- In Progress
- Completed
- Delayed
- Cancelled

#### Angebots-Status
- Draft
- Submitted
- Under Review
- Accepted
- Rejected
- Expired

#### Task-Status
- Todo
- In Progress
- Review
- Completed
- Cancelled

#### Dokumenten-Status
- Draft
- Published
- Archived

### Integrationen
- Google Maps (Geo-Suche)
- PDF-Generierung
- E-Mail-Versand
- Kalender-Integration
- OAuth (Google, Microsoft)

---

## Sicherheit & Berechtigungen

### Zugriffskontrolle
- Rollenbasierte Berechtigungen
- Projekt-spezifische Zugriffe
- Dokumenten-Verschlüsselung
- API-Authentifizierung

### Datenschutz
- DSGVO-konform
- Verschlüsselte Übertragung
- Sichere Datenspeicherung
- Benutzer-Datenverwaltung

---

## Zusammenfassung

BuildWise bietet eine umfassende Plattform für die Bauwirtschaft mit:

✅ **Projektmanagement**: Vollständige Verwaltung von Bauprojekten
✅ **Ausschreibungsmanagement**: Erstellung und Verwaltung von Ausschreibungen
✅ **Dokumentenmanagement**: Strukturiertes DMS mit KI-Kategorisierung
✅ **Finanzanalyse**: Budget-Tracking und Kostenanalyse
✅ **Ressourcenmanagement**: Personal- und Materialplanung
✅ **Geo-Suche**: Standortbasierte Ausschreibungssuche
✅ **Kollaboration**: Canvas, Nachrichten, Aufgaben
✅ **Mobile**: Optimiert für alle Geräte
✅ **Onboarding**: Geführte Einführung für neue Benutzer

Die Plattform ist sowohl für Bauträger als auch für Dienstleister optimiert und bietet rollenspezifische Funktionen und Zugriffe.
