import React from 'react';
import { X, FileText, CheckCircle, Building, User, Calendar, DollarSign, Shield, Clock, MapPin, Phone, Mail, Globe, Star } from 'lucide-react';
import jsPDF from 'jspdf';

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
      case 'electrical':
        return <div className="w-6 h-6 bg-yellow-500 rounded flex items-center justify-center text-white text-xs font-bold">⚡</div>;
      case 'plumbing':
        return <div className="w-6 h-6 bg-blue-500 rounded flex items-center justify-center text-white text-xs font-bold">💧</div>;
      case 'heating':
        return <div className="w-6 h-6 bg-red-500 rounded flex items-center justify-center text-white text-xs font-bold">🔥</div>;
      case 'roofing':
        return <div className="w-6 h-6 bg-gray-500 rounded flex items-center justify-center text-white text-xs font-bold">🏠</div>;
      case 'windows':
        return <div className="w-6 h-6 bg-green-500 rounded flex items-center justify-center text-white text-xs font-bold">🪟</div>;
      case 'flooring':
        return <div className="w-6 h-6 bg-brown-500 rounded flex items-center justify-center text-white text-xs font-bold">🪵</div>;
      case 'walls':
        return <div className="w-6 h-6 bg-orange-500 rounded flex items-center justify-center text-white text-xs font-bold">🧱</div>;
      case 'foundation':
        return <div className="w-6 h-6 bg-gray-700 rounded flex items-center justify-center text-white text-xs font-bold">🏗️</div>;
      case 'landscaping':
        return <div className="w-6 h-6 bg-green-600 rounded flex items-center justify-center text-white text-xs font-bold">🌳</div>;
      default:
        return <div className="w-6 h-6 bg-gray-400 rounded flex items-center justify-center text-white text-xs font-bold">🔧</div>;
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category?.toLowerCase()) {
      case 'electrical': return 'Elektro';
      case 'plumbing': return 'Sanitär';
      case 'heating': return 'Heizung';
      case 'roofing': return 'Dach';
      case 'windows': return 'Fenster & Türen';
      case 'flooring': return 'Boden';
      case 'walls': return 'Wände';
      case 'foundation': return 'Fundament';
      case 'landscaping': return 'Garten & Landschaft';
      default: return category || 'Sonstiges';
    }
  };

  const formatCurrency = (amount: number, currency: string = 'EUR') => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-DE');
  };

  const generatePDFContent = () => {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('AUFTRAGSBESTÄTIGUNG', 105, 20, { align: 'center' });
    
    // Linie unter Header
    doc.setDrawColor(0, 0, 0);
    doc.line(20, 25, 190, 25);
    
    // Projektinformationen
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Projekt:', 20, 40);
    doc.setFont('helvetica', 'normal');
    doc.text(project.name, 60, 40);
    
    if (project.address) {
      doc.text('Adresse:', 20, 50);
      doc.text(project.address, 60, 50);
    }
    
    // Gewerk
    doc.setFont('helvetica', 'bold');
    doc.text('Gewerk:', 20, 65);
    doc.setFont('helvetica', 'normal');
    doc.text(trade.title, 60, 65);
    doc.text(`Kategorie: ${getCategoryLabel(trade.category)}`, 60, 75);
    
    // Dienstleister
    doc.setFont('helvetica', 'bold');
    doc.text('Dienstleister:', 20, 90);
    doc.setFont('helvetica', 'normal');
    doc.text(quote.company_name || 'Nicht angegeben', 60, 90);
    
    if (quote.contact_person) {
      doc.text('Kontaktperson:', 20, 100);
      doc.text(quote.contact_person, 60, 100);
    }
    
    if (quote.phone) {
      doc.text('Telefon:', 20, 110);
      doc.text(quote.phone, 60, 110);
    }
    
    if (quote.email) {
      doc.text('E-Mail:', 20, 120);
      doc.text(quote.email, 60, 120);
    }
    
    // Angebotsdetails
    doc.setFont('helvetica', 'bold');
    doc.text('Angebotsdetails:', 20, 140);
    doc.setFont('helvetica', 'normal');
    
    doc.text('Gesamtbetrag:', 20, 155);
    doc.text(formatCurrency(quote.total_amount, quote.currency), 60, 155);
    
    if (quote.labor_cost) {
      doc.text('Arbeitskosten:', 20, 165);
      doc.text(formatCurrency(quote.labor_cost, quote.currency), 60, 165);
    }
    
    if (quote.material_cost) {
      doc.text('Materialkosten:', 20, 175);
      doc.text(formatCurrency(quote.material_cost, quote.currency), 60, 175);
    }
    
    if (quote.estimated_duration) {
      doc.text('Geschätzte Dauer:', 20, 185);
      doc.text(`${quote.estimated_duration} Tage`, 60, 185);
    }
    
    if (quote.warranty_period) {
      doc.text('Gewährleistung:', 20, 195);
      doc.text(`${quote.warranty_period} Monate`, 60, 195);
    }
    
    // Datum und Unterschrift
    doc.setFont('helvetica', 'bold');
    doc.text('Datum der Annahme:', 20, 220);
    doc.setFont('helvetica', 'normal');
    doc.text(new Date().toLocaleDateString('de-DE'), 60, 220);
    
    // Rechtlicher Hinweis
    doc.setFontSize(10);
    doc.setFont('helvetica', 'italic');
    doc.text('Diese Auftragsbestätigung ist verbindlich und stellt eine rechtsgültige Vereinbarung dar.', 20, 240);
    doc.text('Alle rechtlichen Bestimmungen des deutschen Bauvertragsrechts (VOB/B) gelten entsprechend.', 20, 245);
    
    return doc;
  };

  const handleGenerateDocument = async () => {
    try {
      const pdfDoc = generatePDFContent();
      const orderNumber = `AB-${project.id}-${trade.id}-${quote.id}-${Date.now()}`;
      
      // Konvertiere PDF zu Blob
      const pdfBlob = pdfDoc.output('blob');
      const pdfFile = new File([pdfBlob], 'auftragsbestätigung.pdf', { type: 'application/pdf' });
      
      // Erstelle Dokument-Daten
      const documentData = {
        title: `Auftragsbestätigung - ${trade.title}`,
        description: `Verbindliche Auftragsbestätigung für ${trade.title} - Projekt: ${project.name}`,
        project_id: project.id,
        document_type: 'contract', // Korrekter document_type für Backend
        category: 'order_confirmations', // Neue spezifische Kategorie
        subcategory: 'Auftragsbestätigungen',
        tags: 'auftragsbestätigung,verbindlich,kostenvoranschlag,gewerk',
        is_public: true,
        file: pdfFile,
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
                  {trade.description && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Beschreibung:</span>
                      <span className="text-white">{trade.description}</span>
                    </div>
                  )}
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
                  {quote.contact_person && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Kontakt:</span>
                      <span className="text-white">{quote.contact_person}</span>
                    </div>
                  )}
                  {quote.phone && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Telefon:</span>
                      <span className="text-white">{quote.phone}</span>
                    </div>
                  )}
                  {quote.email && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">E-Mail:</span>
                      <span className="text-white">{quote.email}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Angebot */}
              <div className="space-y-3">
                <h4 className="font-medium text-[#ffbd59] flex items-center gap-2">
                  <DollarSign size={16} />
                  Angebot
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Gesamtbetrag:</span>
                    <span className="text-white font-semibold">
                      {formatCurrency(quote.total_amount, quote.currency)}
                    </span>
                  </div>
                  {quote.labor_cost && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Arbeitskosten:</span>
                      <span className="text-white">{formatCurrency(quote.labor_cost, quote.currency)}</span>
                    </div>
                  )}
                  {quote.material_cost && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Materialkosten:</span>
                      <span className="text-white">{formatCurrency(quote.material_cost, quote.currency)}</span>
                    </div>
                  )}
                  {quote.estimated_duration && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Dauer:</span>
                      <span className="text-white">{quote.estimated_duration} Tage</span>
                    </div>
                  )}
                  {quote.warranty_period && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Gewährleistung:</span>
                      <span className="text-white">{quote.warranty_period} Monate</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Rechtlicher Hinweis */}
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Shield size={16} className="text-yellow-500" />
              <span className="font-medium text-yellow-500">Wichtiger Hinweis</span>
            </div>
            <p className="text-sm text-yellow-300">
              Diese Auftragsbestätigung ist verbindlich und stellt eine rechtsgültige Vereinbarung dar.
              Alle rechtlichen Bestimmungen des deutschen Bauvertragsrechts (VOB/B) gelten entsprechend.
            </p>
          </div>

          {/* Aktionen */}
          <div className="flex gap-4 pt-4">
            <button
              onClick={handleGenerateDocument}
              className="flex-1 bg-[#ffbd59] hover:bg-[#ffbd59]/90 text-black font-semibold py-3 px-6 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              <FileText size={20} />
              Auftragsbestätigung erstellen
            </button>
            <button
              onClick={onClose}
              className="px-6 py-3 border border-gray-600 text-gray-300 hover:bg-white/10 rounded-xl transition-colors"
            >
              Abbrechen
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 