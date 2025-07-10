# Dienstleister-Implementierung für BuildWise

## Übersicht

Diese Implementierung fügt eine Dienstleister-Rolle zu BuildWise hinzu, die es Dienstleistern ermöglicht, sich auf Ausschreibungen zu bewerben und mit Bauträgern zu kommunizieren.

## Implementierte Funktionen

### 1. Login-Erweiterung
- **Datei**: `src/pages/Login.tsx`
- **Funktion**: Neuer "Dienstleister-Test (admin)" Button
- **Zugangsdaten**: test-dienstleister@buildwise.de / test1234
- **Weiterleitung**: Nach erfolgreichem Login zur Dienstleisteransicht (`/service-provider`)

### 2. Dienstleister-Dashboard
- **Datei**: `src/pages/ServiceProviderDashboard.tsx`
- **Funktion**: Reduzierte Oberfläche mit nur 2 Kacheln:
  - **Messenger**: Kommunikation mit Bauträgern
  - **Gewerke**: Ausschreibungen & Angebote
- **Design**: Konsistent mit Bauträger-Dashboard (gleiche Farben, Stil, UI-Elemente)

### 3. Authentifizierung & Rollenverwaltung
- **Datei**: `src/context/AuthContext.tsx`
- **Erweiterung**: `isServiceProvider()` Funktion
- **Logik**: Prüft `user_type === 'service_provider'` oder E-Mail enthält "dienstleister"

### 4. Navigation
- **Datei**: `src/components/Navbar.tsx`
- **Anpassungen**:
  - Bauträger-spezifische Menüpunkte werden für Dienstleister ausgeblendet
  - Dienstleister-spezifische Navigation (Messenger, Gewerke)
  - Dynamische Dashboard-Links basierend auf Benutzerrolle

### 5. Routing
- **Datei**: `src/App.tsx`
- **Neue Route**: `/service-provider` für Dienstleister-Dashboard

### 6. Gewerke/Ausschreibungen
- **Datei**: `src/pages/Quotes.tsx`
- **Anpassungen**:
  - Bedingte Anzeige basierend auf Benutzerrolle
  - Dienstleister sehen "Ausschreibungen" statt "Gewerke"
  - "Gewerk erstellen" Button nur für Bauträger sichtbar

## Technische Details

### Rollenbasierte Anzeige
```typescript
// Prüfung der Benutzerrolle
const isServiceProviderUser = isServiceProvider();

// Bedingte Anzeige von UI-Elementen
{!isServiceProviderUser && (
  <button>Gewerk erstellen</button>
)}
```

### Dynamische Navigation
```typescript
// Dashboard-Link basierend auf Rolle
<Link to={isServiceProvider() ? "/service-provider" : "/"}>
  <span>{isServiceProvider() ? 'Dienstleister' : 'Dashboard'}</span>
</Link>
```

### Konsistente Designsprache
- Gleiche Farbpalette: `#ffbd59`, `#ffa726`, `#3d4952`
- Gleiche UI-Komponenten: `DashboardCard`, Buttons, Modals
- Gleiche Animationen und Übergänge
- Responsive Design für alle Bildschirmgrößen

## Erweiterbarkeit

### Neue Rollen hinzufügen
1. **AuthContext erweitern**:
   ```typescript
   const isNewRole = () => {
     return user?.user_type === 'new_role' || user?.email?.includes('newrole');
   };
   ```

2. **Navigation anpassen**:
   ```typescript
   {isNewRole() && (
     <Link to="/new-role-dashboard">Neue Rolle</Link>
   )}
   ```

3. **Neue Dashboard-Seite erstellen**:
   - Kopie von `ServiceProviderDashboard.tsx`
   - Anpassung der Kacheln und Funktionalität

### Weitere Dienstleister-Funktionen
- **Angebote erstellen**: PDF-Upload, Preisgestaltung
- **Kommunikation**: Direkte Nachrichten mit Bauträgern
- **Bewerbungsmanagement**: Status-Tracking für Bewerbungen
- **Profilverwaltung**: Dienstleister-spezifische Einstellungen

## Test-Szenarien

### Dienstleister-Test
1. Auf "Dienstleister-Test (admin)" klicken
2. Automatischer Login mit Test-Zugangsdaten
3. Weiterleitung zur Dienstleisteransicht
4. Überprüfung der reduzierten Oberfläche (nur 2 Kacheln)

### Bauträger-Test
1. Normaler Login mit admin@buildwise.de / admin123
2. Vollständige Dashboard-Oberfläche
3. Alle Funktionen verfügbar

### Rollenwechsel
- Logout und Login mit anderer Rolle
- Automatische Anpassung der Navigation
- Korrekte Weiterleitung zum entsprechenden Dashboard

## Sicherheitshinweise

- Rollenprüfung erfolgt client-seitig (für UI-Anpassungen)
- Backend-Validierung für alle API-Calls erforderlich
- Token-basierte Authentifizierung bleibt bestehen
- Keine Datenlecks zwischen Rollen

## Nächste Schritte

1. **Backend-Integration**: API-Endpunkte für Dienstleister-Funktionen
2. **Angebote-System**: Vollständige Implementierung des Bewerbungsprozesses
3. **Messaging**: Echtzeit-Kommunikation zwischen Bauträgern und Dienstleistern
4. **PDF-Generierung**: Automatische Angebots-PDFs
5. **Benachrichtigungen**: Push-Notifications für neue Ausschreibungen 