import React from 'react';
import { 
  FileText, 
  Download, 
  CheckCircle, 
  Calendar, 
  Euro, 
  User, 
  Building, 
  MapPin, 
  Phone, 
  Mail, 
  Globe,
  Wrench,
  Shield,
  Clock,
  Award,
  File,
  FolderOpen,
  AlertCircle,
  Zap,
  Thermometer,
  Droplets,
  Sun,
  Home,
  TreePine,
  Hammer,
  Ruler,
  Palette,
  Layers,
  Anchor,
  Sprout,
  X
} from 'lucide-react';

interface OrderConfirmationData {
  project: any;
  trade: any;
  quote: any;
  user: any;
}

interface OrderConfirmationGeneratorProps {
  data: OrderConfirmationData;
  onGenerate: (documentData: any) => void;
  onClose: () => void;
}

export default function OrderConfirmationGenerator({ data, onGenerate, onClose }: OrderConfirmationGeneratorProps) {
  const { project, trade, quote, user } = data;

  const getCategoryIcon = (category: string) => {
    switch (category?.toLowerCase()) {
      case 'elektro':
        return <Zap size={16} className="text-blue-400" />;
      case 'sanitär':
        return <Droplets size={16} className="text-cyan-400" />;
      case 'heizung':
        return <Thermometer size={16} className="text-red-400" />;
      case 'dach':
        return <Sun size={16} className="text-orange-400" />;
      case 'fenster/türen':
        return <Home size={16} className="text-green-400" />;
      case 'boden':
        return <Layers size={16} className="text-brown-400" />;
      case 'wand':
        return <Building size={16} className="text-gray-400" />;
      case 'fundament':
        return <Anchor size={16} className="text-gray-600" />;
      case 'garten/landschaft':
        return <TreePine size={16} className="text-green-500" />;
      default:
        return <Wrench size={16} className="text-gray-400" />;
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category?.toLowerCase()) {
      case 'elektro':
        return 'Elektroinstallation';
      case 'sanitär':
        return 'Sanitäranlagen';
      case 'heizung':
        return 'Heizung & Klima';
      case 'dach':
        return 'Dach & Dachdecker';
      case 'fenster/türen':
        return 'Fenster & Türen';
      case 'boden':
        return 'Bodenbeläge';
      case 'wand':
        return 'Wand & Putz';
      case 'fundament':
        return 'Fundament & Keller';
      case 'garten/landschaft':
        return 'Garten & Landschaft';
      default:
        return category || 'Sonstiges';
    }
  };

  const formatCurrency = (amount: number, currency: string = 'EUR') => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('de-DE');
  };

  const generateOrderConfirmationContent = () => {
    const today = new Date().toLocaleDateString('de-DE');
    const orderNumber = `AB-${project.id}-${trade.id}-${quote.id}-${Date.now()}`;

    return `
# AUFTRAGSBESTÄTIGUNG

**Auftragsnummer:** ${orderNumber}  
**Datum:** ${today}  
**Status:** Verbindlich angenommen

---

## 1. PROJEKTINFORMATIONEN

**Projekt:** ${project.name}  
**Projekt-ID:** ${project.id}  
**Projektbeschreibung:** ${project.description || 'Keine Beschreibung verfügbar'}  
**Projektadresse:** ${project.address || 'Nicht angegeben'}

---

## 2. GEWERKSAUSSCHREIBUNG

**Gewerk:** ${trade.title}  
**Kategorie:** ${getCategoryLabel(trade.category)}  
**Beschreibung:** ${trade.description}  
**Geplantes Datum:** ${formatDate(trade.planned_date)}  
**Priorität:** ${trade.priority || 'Standard'}  
**Status:** ${trade.status}

### Technische Spezifikationen:
${trade.technical_specifications || 'Keine technischen Spezifikationen verfügbar'}

### Qualitätsanforderungen:
${trade.quality_requirements || 'Standard-Qualitätsanforderungen'}

### Sicherheitsanforderungen:
${trade.safety_requirements || 'Standard-Sicherheitsanforderungen'}

### Umweltanforderungen:
${trade.environmental_requirements || 'Standard-Umweltanforderungen'}

${trade.category_specific_fields ? `
### Kategorie-spezifische Details:
${Object.entries(trade.category_specific_fields)
  .map(([key, value]) => `- ${key.replace(/_/g, ' ')}: ${value}`)
  .join('\n')}
` : ''}

---

## 3. KOSTENVORANSCHLAG

**Angebotsnummer:** ${quote.id}  
**Angebotsdatum:** ${formatDate(quote.created_at)}  
**Gültig bis:** ${formatDate(quote.valid_until)}  
**Status:** ${quote.status}

### Kostenaufschlüsselung:
- **Gesamtbetrag:** ${formatCurrency(quote.total_amount, quote.currency)}
- **Arbeitskosten:** ${quote.labor_cost ? formatCurrency(quote.labor_cost, quote.currency) : 'Nicht angegeben'}
- **Materialkosten:** ${quote.material_cost ? formatCurrency(quote.material_cost, quote.currency) : 'Nicht angegeben'}
- **Gemeinkosten:** ${quote.overhead_cost ? formatCurrency(quote.overhead_cost, quote.currency) : 'Nicht angegeben'}

### Zeitplan:
- **Geschätzte Dauer:** ${quote.estimated_duration} Tage
- **Startdatum:** ${formatDate(quote.start_date)}
- **Fertigstellungsdatum:** ${formatDate(quote.completion_date)}

### Bedingungen:
- **Zahlungsbedingungen:** ${quote.payment_terms || 'Standard'}
- **Garantie:** ${quote.warranty_period} Monate
- **Gültig bis:** ${formatDate(quote.valid_until)}

---

## 4. DIENSTLEISTER

**Firma:** ${quote.company_name || 'Nicht angegeben'}  
**Ansprechpartner:** ${quote.contact_person || 'Nicht angegeben'}  
**Telefon:** ${quote.phone || 'Nicht angegeben'}  
**E-Mail:** ${quote.email || 'Nicht angegeben'}  
**Website:** ${quote.website || 'Nicht angegeben'}

---

## 5. VERBINDLICHE VEREINBARUNG

**Annahmedatum:** ${today}  
**Angenommen von:** ${user?.first_name} ${user?.last_name}  
**Benutzer-ID:** ${user?.id}

### Wichtige Hinweise:
- Diese Auftragsbestätigung ist verbindlich
- Alle anderen Angebote für dieses Gewerk werden automatisch abgelehnt
- Das angenommene Angebot wird als Kostenposition in der Finanzübersicht angezeigt
- Änderungen bedürfen der schriftlichen Vereinbarung beider Parteien

---

## 6. DOKUMENTE UND ANHÄNGE

### Gewerk-Dokumente:
${trade.documents && trade.documents.length > 0 ? 
  trade.documents.map((doc: any) => `- ${doc.title} (${doc.file_name})`).join('\n') : 
  'Keine Dokumente verfügbar'}

### Kostenvoranschlag-Dokumente:
${quote.pdf_upload_path ? `- Kostenvoranschlag PDF: ${quote.pdf_upload_path}` : 'Keine PDF verfügbar'}

---

## 7. QUALITÄTSSICHERUNG

### Bewertungskriterien:
- Technische Eignung: ${quote.rating ? `${quote.rating}/5` : 'Nicht bewertet'}
- Risiko-Bewertung: ${quote.risk_score ? `${quote.risk_score}/10` : 'Nicht bewertet'}
- Preisabweichung: ${quote.price_deviation ? `${quote.price_deviation}%` : 'Nicht berechnet'}

### KI-Empfehlung:
${quote.ai_recommendation || 'Keine KI-Empfehlung verfügbar'}

---

## 8. RECHTLICHE HINWEISE

Diese Auftragsbestätigung stellt eine verbindliche Vereinbarung zwischen dem Bauträger und dem Dienstleister dar. Alle rechtlichen Bestimmungen des deutschen Bauvertragsrechts (VOB/B) gelten entsprechend.

**Erstellt am:** ${today}  
**Erstellt von:** BuildWise System  
**Dokument-ID:** ${orderNumber}

---

*Ende der Auftragsbestätigung*
    `;
  };

  const handleGenerateDocument = async () => {
    try {
      const content = generateOrderConfirmationContent();
      const orderNumber = `AB-${project.id}-${trade.id}-${quote.id}-${Date.now()}`;
      
      // Erstelle Dokument-Daten
      const documentData = {
        title: `Auftragsbestätigung - ${trade.title}`,
        description: `Verbindliche Auftragsbestätigung für ${trade.title} - Projekt: ${project.name}`,
        project_id: project.id,
        document_type: 'contract',
        category: 'contracts',
        tags: 'auftragsbestätigung,verbindlich,kostenvoranschlag,gewerk',
        is_public: true,
        content: content,
        metadata: {
          order_number: orderNumber,
          trade_id: trade.id,
          quote_id: quote.id,
          accepted_by: user?.id,
          accepted_at: new Date().toISOString(),
          project_name: project.name,
          trade_title: trade.title,
          quote_amount: quote.total_amount,
          quote_currency: quote.currency,
          service_provider: quote.company_name,
          warranty_period: quote.warranty_period,
          estimated_duration: quote.estimated_duration
        }
      };

      onGenerate(documentData);
    } catch (error) {
      console.error('Fehler beim Generieren der Auftragsbestätigung:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-[#2c3539] rounded-2xl shadow-2xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#ffbd59]/20">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-[#ffbd59]/20 rounded-xl">
              <FileText size={24} className="text-[#ffbd59]" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Auftragsbestätigung erstellen</h2>
              <p className="text-gray-400">Verbindliche Auftragsbestätigung für: {trade?.title}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X size={24} className="text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Zusammenfassung */}
          <div className="bg-white/5 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <CheckCircle size={20} className="text-green-400" />
              Auftragsbestätigung Zusammenfassung
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Projekt */}
              <div className="space-y-3">
                <h4 className="font-medium text-[#ffbd59] flex items-center gap-2">
                  <Building size={16} />
                  Projekt
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Name:</span>
                    <span className="text-white">{project.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">ID:</span>
                    <span className="text-white">{project.id}</span>
                  </div>
                  {project.address && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Adresse:</span>
                      <span className="text-white">{project.address}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Gewerk */}
              <div className="space-y-3">
                <h4 className="font-medium text-[#ffbd59] flex items-center gap-2">
                  {getCategoryIcon(trade.category)}
                  Gewerk
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Titel:</span>
                    <span className="text-white">{trade.title}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Kategorie:</span>
                    <span className="text-white">{getCategoryLabel(trade.category)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Status:</span>
                    <span className="text-white">{trade.status}</span>
                  </div>
                </div>
              </div>

              {/* Kostenvoranschlag */}
              <div className="space-y-3">
                <h4 className="font-medium text-[#ffbd59] flex items-center gap-2">
                  <Euro size={16} />
                  Kostenvoranschlag
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Betrag:</span>
                    <span className="text-white font-bold">{formatCurrency(quote.total_amount, quote.currency)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Dauer:</span>
                    <span className="text-white">{quote.estimated_duration} Tage</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Garantie:</span>
                    <span className="text-white">{quote.warranty_period} Monate</span>
                  </div>
                </div>
              </div>

              {/* Dienstleister */}
              <div className="space-y-3">
                <h4 className="font-medium text-[#ffbd59] flex items-center gap-2">
                  <User size={16} />
                  Dienstleister
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Firma:</span>
                    <span className="text-white">{quote.company_name || 'Nicht angegeben'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Kontakt:</span>
                    <span className="text-white">{quote.contact_person || 'Nicht angegeben'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">E-Mail:</span>
                    <span className="text-white">{quote.email || 'Nicht angegeben'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Dokument-Inhalt Vorschau */}
          <div className="bg-white/5 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <FileText size={20} className="text-blue-400" />
              Dokument-Inhalt (Vorschau)
            </h3>
            
            <div className="bg-gray-900 rounded-lg p-4 max-h-60 overflow-y-auto">
              <pre className="text-xs text-gray-300 whitespace-pre-wrap">
                {generateOrderConfirmationContent().substring(0, 1000)}...
              </pre>
            </div>
            
            <p className="text-sm text-gray-400 mt-2">
              Das vollständige Dokument wird mit allen Details erstellt und im Dokumentenbereich abgelegt.
            </p>
          </div>

          {/* Warnhinweis */}
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle size={16} className="text-yellow-400" />
              <span className="font-medium text-yellow-300">Wichtiger Hinweis</span>
            </div>
            <p className="text-sm text-yellow-200">
              Diese Auftragsbestätigung ist verbindlich und stellt eine rechtsgültige Vereinbarung dar. 
              Alle anderen Kostenvoranschläge für dieses Gewerk werden automatisch abgelehnt.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-[#ffbd59]/20">
          <button
            onClick={onClose}
            className="px-6 py-3 bg-gray-600 text-white rounded-xl hover:bg-gray-700 transition-colors"
          >
            Abbrechen
          </button>
          
          <button
            onClick={handleGenerateDocument}
            className="px-6 py-3 bg-gradient-to-r from-[#ffbd59] to-[#ffa726] text-[#3d4952] rounded-xl font-semibold hover:from-[#ffa726] hover:to-[#ff9800] transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center gap-2"
          >
            <FileText size={16} />
            Auftragsbestätigung erstellen
          </button>
        </div>
      </div>
    </div>
  );
} 