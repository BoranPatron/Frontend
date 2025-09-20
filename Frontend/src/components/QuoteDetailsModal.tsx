import React, { useState, useEffect } from 'react';
import { 
  X, 
  FileText, 
  Euro, 
  Calendar, 
  User, 
  Building, 
  CheckCircle, 
  Clock, 
  XCircle,
  Download,
  Share2,
  Edit,
  Trash2,
  AlertTriangle,
  Award,
  Shield,
  Clock as ClockIcon,
  Upload,
  Mail,
  MessageCircle,
  Link,
  Copy,
  ExternalLink,
  Eye,
  Archive,
  FolderPlus
} from 'lucide-react';
import QuoteDocumentUpload from './QuoteDocumentUpload';
import { DOCUMENT_CATEGORIES, DocumentCategorizer } from '../utils/documentCategorizer';
import { uploadDocument } from '../api/documentService';
import { getAuthenticatedFileUrl } from '../api/api';

interface QuoteDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  quote: any;
  trade: any;
  project: any;
  user: any;
  onEditQuote?: (quote: any) => void;
  onDeleteQuote?: (quoteId: number) => void;
}

export default function QuoteDetailsModal({ 
  isOpen, 
  onClose, 
  quote, 
  trade, 
  project, 
  user,
  onEditQuote,
  onDeleteQuote
}: QuoteDetailsModalProps) {
  
  const [fullQuoteData, setFullQuoteData] = useState<any>(quote);
  const [isLoadingFullData, setIsLoadingFullData] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [showCategorizationModal, setShowCategorizationModal] = useState(false);
  const [currentDMSDocument, setCurrentDMSDocument] = useState<any>(null);
  const [documentCategory, setDocumentCategory] = useState('');
  const [documentSubcategory, setDocumentSubcategory] = useState('');
  const [documentTags, setDocumentTags] = useState('');
  const [documentDescription, setDocumentDescription] = useState('');
  const [isDMSProcessing, setIsDMSProcessing] = useState(false);

  // Lade vollständige Quote-Details beim Öffnen
  useEffect(() => {
    if (isOpen && quote?.id) {
      loadFullQuoteDetails();
    }
  }, [isOpen, quote?.id]);

  const loadFullQuoteDetails = async () => {
    if (!quote?.id) return;
    
    setIsLoadingFullData(true);
    try {
      const response = await fetch(`/api/v1/quotes/${displayQuote.id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const fullQuoteData = await response.json();
        console.log('🔍 Vollständige Quote-Daten geladen:', fullQuoteData);
        setFullQuoteData(fullQuoteData);
      } else {
        console.warn('⚠️ Fehler beim Laden der vollständigen Quote-Details:', response.status);
        // Fallback: verwende die ursprünglichen Quote-Daten
        setFullQuoteData(quote);
      }
    } catch (error) {
      console.error('❌ Fehler beim Laden der vollständigen Quote-Details:', error);
      // Fallback: verwende die ursprünglichen Quote-Daten
      setFullQuoteData(quote);
    } finally {
      setIsLoadingFullData(false);
    }
  };
  
  if (!isOpen || !quote) return null;

  // Verwende fullQuoteData anstatt quote für die Anzeige
  const displayQuote = fullQuoteData || quote;

  const formatCurrency = (amount: number, currency: string = 'EUR') => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Nicht angegeben';
    return new Date(dateString).toLocaleDateString('de-DE');
  };

  const getStatusInfo = () => {
    switch (displayQuote.status) {
      case 'accepted':
        return {
          icon: <CheckCircle size={20} className="text-green-400" />,
          text: 'Angebot angenommen',
          color: 'text-green-400',
          bgColor: 'bg-green-500/10',
          borderColor: 'border-green-500/20',
          description: 'Ihr Angebot wurde vom Bauträger angenommen. Sie erhalten in Kürze eine Auftragsbestätigung.'
        };
      case 'rejected':
        return {
          icon: <XCircle size={20} className="text-red-400" />,
          text: 'Angebot abgelehnt',
          color: 'text-red-400',
          bgColor: 'bg-red-500/10',
          borderColor: 'border-red-500/20',
          description: 'Ihr Angebot wurde vom Bauträger abgelehnt. Sie können ein neues Angebot abgeben.'
        };
      case 'submitted':
      default:
        return {
          icon: <Clock size={20} className="text-blue-400" />,
          text: 'Angebot eingereicht',
          color: 'text-blue-400',
          bgColor: 'bg-blue-500/10',
          borderColor: 'border-blue-500/20',
          description: 'Ihr Angebot wird vom Bauträger geprüft. Sie erhalten eine Benachrichtigung über die Entscheidung.'
        };
    }
  };

  const statusInfo = getStatusInfo();

  const handleDownloadPDF = async () => {
    try {
      if (!displayQuote?.id) {
        alert('Kein Angebot ausgewählt');
        return;
      }

      // Generiere ein PDF aus den Angebotsdaten
      await generateQuotePDF(displayQuote);
    } catch (error) {
      console.error('Fehler beim PDF-Download:', error);
      alert('Fehler beim Herunterladen des PDFs');
    }
  };

  const generateQuotePDF = async (quote: any) => {
    try {
      // Erstelle HTML-Inhalt für das PDF
      const htmlContent = generateQuoteHTML(quote);
      
      // Erstelle ein neues Fenster mit dem HTML-Inhalt
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        alert('Popup-Blocker verhindert das Öffnen des PDF-Fensters. Bitte erlauben Sie Popups für diese Seite.');
        return;
      }

      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>Angebot - ${quote.title}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 20px;
              color: #333;
              line-height: 1.6;
            }
            .header {
              border-bottom: 2px solid #ffbd59;
              padding-bottom: 20px;
              margin-bottom: 30px;
            }
            .header h1 {
              color: #ffbd59;
              margin: 0;
              font-size: 28px;
            }
            .header p {
              color: #666;
              margin: 5px 0;
            }
            .section {
              margin-bottom: 25px;
              padding: 15px;
              border: 1px solid #ddd;
              border-radius: 8px;
              background-color: #f9f9f9;
            }
            .section h2 {
              color: #333;
              margin-top: 0;
              margin-bottom: 15px;
              font-size: 18px;
              border-bottom: 1px solid #ffbd59;
              padding-bottom: 5px;
            }
            .info-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 20px;
              margin-bottom: 20px;
            }
            .info-item {
              display: flex;
              justify-content: space-between;
              margin-bottom: 8px;
            }
            .info-label {
              font-weight: bold;
              color: #555;
            }
            .info-value {
              color: #333;
            }
            .amount {
              font-size: 24px;
              font-weight: bold;
              color: #ffbd59;
            }
            .description {
              white-space: pre-wrap;
              background-color: white;
              padding: 15px;
              border-radius: 5px;
              border-left: 4px solid #ffbd59;
            }
            .footer {
              margin-top: 40px;
              padding-top: 20px;
              border-top: 1px solid #ddd;
              text-align: center;
              color: #666;
              font-size: 12px;
            }
            .status {
              display: inline-block;
              padding: 4px 12px;
              border-radius: 20px;
              font-size: 12px;
              font-weight: bold;
              text-transform: uppercase;
            }
            .status.submitted {
              background-color: #e3f2fd;
              color: #1976d2;
            }
            .status.accepted {
              background-color: #e8f5e8;
              color: #2e7d32;
            }
            .status.rejected {
              background-color: #ffebee;
              color: #c62828;
            }
            @media print {
              body { margin: 0; }
              .section { break-inside: avoid; }
            }
          </style>
        </head>
        <body>
          ${htmlContent}
        </body>
        </html>
      `);

      printWindow.document.close();
      
      // Warte kurz und drucke dann
      setTimeout(() => {
        printWindow.print();
        // Optional: Schließe das Fenster nach dem Drucken
        setTimeout(() => {
          printWindow.close();
        }, 1000);
      }, 500);

    } catch (error) {
      console.error('Fehler beim Generieren des PDFs:', error);
      throw error;
    }
  };

  const generateQuoteHTML = (quote: any) => {
    const statusText = quote.status === 'accepted' ? 'Angenommen' : 
                      quote.status === 'rejected' ? 'Abgelehnt' : 'Eingereicht';
    const statusClass = quote.status;

    return `
      <div class="header">
        <h1>Angebot Details</h1>
        <p><strong>Titel:</strong> ${quote.title || 'Nicht angegeben'}</p>
        <p><strong>Angebots-ID:</strong> #${quote.id}</p>
        <p><strong>Status:</strong> <span class="status ${statusClass}">${statusText}</span></p>
        <p><strong>Erstellt am:</strong> ${formatDate(quote.created_at)}</p>
      </div>

      <div class="section">
        <h2>📊 Angebotsübersicht</h2>
        <div class="info-grid">
          <div>
            <div class="info-item">
              <span class="info-label">Gesamtbetrag:</span>
              <span class="info-value amount">${formatCurrency(quote.total_amount, quote.currency)}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Währung:</span>
              <span class="info-value">${quote.currency || 'EUR'}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Gültig bis:</span>
              <span class="info-value">${formatDate(quote.valid_until || quote.validity_date || quote.valid_till || quote.expires_at)}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Geschätzte Dauer:</span>
              <span class="info-value">${quote.estimated_duration || 0} Tage</span>
            </div>
          </div>
          <div>
            <div class="info-item">
              <span class="info-label">Startdatum:</span>
              <span class="info-value">${formatDate(quote.start_date)}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Fertigstellung:</span>
              <span class="info-value">${formatDate(quote.completion_date)}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Garantie:</span>
              <span class="info-value">${quote.warranty_period || 0} Monate</span>
            </div>
            <div class="info-item">
              <span class="info-label">Zahlungsbedingungen:</span>
              <span class="info-value">${quote.payment_terms || 'Nicht angegeben'}</span>
            </div>
          </div>
        </div>
      </div>

      ${quote.labor_cost || quote.material_cost || quote.overhead_cost ? `
      <div class="section">
        <h2>💰 Kostenaufschlüsselung</h2>
        ${quote.labor_cost ? `
        <div class="info-item">
          <span class="info-label">Arbeitskosten:</span>
          <span class="info-value">${formatCurrency(quote.labor_cost, quote.currency)}</span>
        </div>
        ` : ''}
        ${quote.material_cost ? `
        <div class="info-item">
          <span class="info-label">Materialkosten:</span>
          <span class="info-value">${formatCurrency(quote.material_cost, quote.currency)}</span>
        </div>
        ` : ''}
        ${quote.overhead_cost ? `
        <div class="info-item">
          <span class="info-label">Gemeinkosten:</span>
          <span class="info-value">${formatCurrency(quote.overhead_cost, quote.currency)}</span>
        </div>
        ` : ''}
      </div>
      ` : ''}

      <div class="section">
        <h2>🏢 Unternehmensinformationen</h2>
        <div class="info-grid">
          <div>
            <div class="info-item">
              <span class="info-label">Unternehmen:</span>
              <span class="info-value">${quote.company_name || 'Nicht angegeben'}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Ansprechpartner:</span>
              <span class="info-value">${quote.contact_person || 'Nicht angegeben'}</span>
            </div>
          </div>
          <div>
            <div class="info-item">
              <span class="info-label">E-Mail:</span>
              <span class="info-value">${quote.email || 'Nicht angegeben'}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Telefon:</span>
              <span class="info-value">${quote.phone || 'Nicht angegeben'}</span>
            </div>
          </div>
        </div>
      </div>

      ${quote.description ? `
      <div class="section">
        <h2>📝 Beschreibung</h2>
        <div class="description">${quote.description}</div>
      </div>
      ` : ''}

      ${quote.qualifications ? `
      <div class="section">
        <h2>🏆 Qualifikationen</h2>
        <div class="description">${quote.qualifications}</div>
      </div>
      ` : ''}

      ${quote.technical_approach ? `
      <div class="section">
        <h2>🔧 Technischer Ansatz</h2>
        <div class="description">${quote.technical_approach}</div>
      </div>
      ` : ''}

      ${quote.quality_standards ? `
      <div class="section">
        <h2>⭐ Qualitätsstandards</h2>
        <div class="description">${quote.quality_standards}</div>
      </div>
      ` : ''}

      ${quote.safety_measures ? `
      <div class="section">
        <h2>🛡️ Sicherheitsmaßnahmen</h2>
        <div class="description">${quote.safety_measures}</div>
      </div>
      ` : ''}

      ${quote.environmental_compliance ? `
      <div class="section">
        <h2>🌱 Umwelt-Compliance</h2>
        <div class="description">${quote.environmental_compliance}</div>
      </div>
      ` : ''}

      ${quote.risk_assessment ? `
      <div class="section">
        <h2>⚠️ Risikobewertung</h2>
        <div class="description">${quote.risk_assessment}</div>
      </div>
      ` : ''}

      ${quote.contingency_plan ? `
      <div class="section">
        <h2>🚨 Notfallplan</h2>
        <div class="description">${quote.contingency_plan}</div>
      </div>
      ` : ''}

      ${quote.additional_notes ? `
      <div class="section">
        <h2>📋 Zusätzliche Notizen</h2>
        <div class="description">${quote.additional_notes}</div>
      </div>
      ` : ''}

      <div class="footer">
        <p>Erstellt am ${new Date().toLocaleDateString('de-DE')} um ${new Date().toLocaleTimeString('de-DE')}</p>
        <p>Angebots-ID: #${quote.id}</p>
      </div>
    `;
  };

  const handleShareQuote = () => {
    if (!displayQuote?.id) {
      alert('Kein Angebot ausgewählt');
      return;
    }
    setShowShareModal(true);
  };

  // PDF für Sharing generieren
  const generatePDFForSharing = async () => {
    setIsGeneratingPDF(true);
    try {
      const htmlContent = generateQuoteHTML(displayQuote);
      
      // Erstelle ein verstecktes iframe für PDF-Generierung
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      iframe.style.width = '210mm';
      iframe.style.height = '297mm';
      document.body.appendChild(iframe);

      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
      if (!iframeDoc) throw new Error('Iframe konnte nicht erstellt werden');

      iframeDoc.open();
      iframeDoc.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>Angebot - ${displayQuote.title}</title>
          <style>
            @page {
              size: A4;
              margin: 15mm;
            }
            body {
              font-family: Arial, sans-serif;
              margin: 0;
              color: #333;
              line-height: 1.6;
              font-size: 12px;
            }
            .header {
              border-bottom: 2px solid #ffbd59;
              padding-bottom: 15px;
              margin-bottom: 20px;
            }
            .header h1 {
              color: #ffbd59;
              margin: 0;
              font-size: 20px;
            }
            .header p {
              color: #666;
              margin: 3px 0;
              font-size: 11px;
            }
            .section {
              margin-bottom: 15px;
              padding: 10px;
              border: 1px solid #ddd;
              border-radius: 5px;
              background-color: #f9f9f9;
              page-break-inside: avoid;
            }
            .section h2 {
              color: #333;
              margin-top: 0;
              margin-bottom: 10px;
              font-size: 14px;
              border-bottom: 1px solid #ffbd59;
              padding-bottom: 3px;
            }
            .info-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 10px;
              margin-bottom: 10px;
            }
            .info-item {
              display: flex;
              justify-content: space-between;
              margin-bottom: 5px;
              font-size: 11px;
            }
            .info-label {
              font-weight: bold;
              color: #555;
            }
            .info-value {
              color: #333;
            }
            .amount {
              font-size: 16px;
              font-weight: bold;
              color: #ffbd59;
            }
            .description {
              white-space: pre-wrap;
              background-color: white;
              padding: 10px;
              border-radius: 3px;
              border-left: 3px solid #ffbd59;
              font-size: 11px;
            }
            .footer {
              margin-top: 20px;
              padding-top: 10px;
              border-top: 1px solid #ddd;
              text-align: center;
              color: #666;
              font-size: 10px;
            }
            .status {
              display: inline-block;
              padding: 2px 8px;
              border-radius: 10px;
              font-size: 9px;
              font-weight: bold;
              text-transform: uppercase;
            }
            .status.submitted {
              background-color: #e3f2fd;
              color: #1976d2;
            }
            .status.accepted {
              background-color: #e8f5e8;
              color: #2e7d32;
            }
            .status.rejected {
              background-color: #ffebee;
              color: #c62828;
            }
          </style>
        </head>
        <body>
          ${htmlContent}
        </body>
        </html>
      `);
      iframeDoc.close();

      // Warte auf das Laden des Inhalts
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Generiere PDF mit jsPDF (falls verfügbar) oder verwende Print
      if (window.jsPDF) {
        const pdf = new window.jsPDF('p', 'mm', 'a4');
        pdf.html(iframeDoc.body, {
          callback: function (doc) {
            const pdfBlob = doc.output('blob');
            return pdfBlob;
          }
        });
      } else {
        // Fallback: Verwende Print-Funktionalität
        iframe.contentWindow?.print();
      }

      document.body.removeChild(iframe);
      return true;
    } catch (error) {
      console.error('Fehler beim Generieren des PDFs für Sharing:', error);
      throw error;
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  // Sharing-Funktionen
  const shareViaEmail = async () => {
    try {
      await generatePDFForSharing();
      
      const subject = `Angebot: ${displayQuote.title}`;
      const body = `Hallo,

ich teile Ihnen das folgende Angebot mit:

${displayQuote.title}
Gesamtbetrag: ${formatCurrency(displayQuote.total_amount, displayQuote.currency)}

${displayQuote.description ? displayQuote.description.substring(0, 300) + '...' : 'Weitere Details finden Sie im angehängten PDF.'}

Mit freundlichen Grüßen
${displayQuote.contact_person || displayQuote.company_name || 'Ihr Ansprechpartner'}`;

      const mailtoUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      window.open(mailtoUrl, '_blank');
    } catch (error) {
      console.error('Fehler beim E-Mail-Sharing:', error);
      alert('Fehler beim Öffnen des E-Mail-Clients');
    }
  };

  const shareViaWhatsApp = async () => {
    try {
      await generatePDFForSharing();
      
      const text = `📋 *Angebot: ${displayQuote.title}*

💰 *Gesamtbetrag:* ${formatCurrency(displayQuote.total_amount, displayQuote.currency)}

${displayQuote.description ? displayQuote.description.substring(0, 200) + '...' : 'Weitere Details finden Sie im PDF-Anhang.'}

📎 Das vollständige Angebot als PDF finden Sie im Chat.`;

      const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
      window.open(whatsappUrl, '_blank');
    } catch (error) {
      console.error('Fehler beim WhatsApp-Sharing:', error);
      alert('Fehler beim Öffnen von WhatsApp');
    }
  };

  const shareViaWebShare = async () => {
    try {
      if (!navigator.share) {
        throw new Error('Web Share API nicht unterstützt');
      }

      await generatePDFForSharing();
      
      const shareData = {
        title: `Angebot: ${displayQuote.title}`,
        text: `Angebot für ${displayQuote.title} - ${formatCurrency(displayQuote.total_amount, displayQuote.currency)}`,
        url: `${window.location.origin}/quote/${displayQuote.id}`
      };

      await navigator.share(shareData);
    } catch (error) {
      console.error('Fehler beim Web Share:', error);
      // Fallback zu Link kopieren
      await copyLinkToClipboard();
    }
  };

  const copyLinkToClipboard = async () => {
    try {
      const shareUrl = `${window.location.origin}/quote/${displayQuote.id}`;
      await navigator.clipboard.writeText(shareUrl);
      alert('✅ Link wurde in die Zwischenablage kopiert!');
    } catch (error) {
      console.error('Fehler beim Kopieren:', error);
      alert('❌ Fehler beim Kopieren des Links');
    }
  };

  // DMS Storage Handler - Verwendet bestehende DMS-Upload-Funktion
  const handleDMSStorage = async (quote: any, documentType: string, document?: any) => {
    console.log('🗄️ DMS Storage initiated:', { quote, documentType, document });
    
    try {
      // Ermittle den korrekten Dateipfad
      let filePath: string | undefined;
      let fileName: string;
      
      if (documentType === 'pdf_main') {
        filePath = quote.pdf_upload_path || quote.document_path || quote.file_path;
        fileName = filePath?.split('/').pop() || 'angebot.pdf';
      } else {
        filePath = document?.url || document?.path || document?.file_path;
        fileName = document?.name || document?.title || document?.file_name || 'dokument.pdf';
      }
      
      if (!filePath) {
        alert('Kein Dokumentenpfad gefunden');
        return;
      }

      console.log('📁 Dateipfad:', filePath);
      
      // Verwende getAuthenticatedFileUrl für den Download
      const authenticatedUrl = getAuthenticatedFileUrl(filePath);
      console.log('🔗 Authentifizierte URL:', authenticatedUrl);
      
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Kein Authentifizierungstoken verfügbar');
        return;
      }

      const response = await fetch(authenticatedUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error(`Dokument konnte nicht geladen werden: ${response.status}`);
      }

      const blob = await response.blob();
      const file = new File([blob], fileName, { type: blob.type });

      // Setze aktuelles Dokument für die Kategorisierung
      setCurrentDMSDocument({
        quote,
        documentType,
        document,
        file,
        title: fileName,
        originalPath: document?.url || document?.path || quote.pdf_upload_path
      });
      
      // Automatische Kategorisierung basierend auf Dateiname
      const fileExtension = '.' + fileName.split('.').pop()?.toLowerCase();
      const suggestedCategory = DocumentCategorizer.categorizeDocument(fileName, fileExtension);
      
      if (suggestedCategory) {
        console.log('🤖 Automatische Kategorisierung:', suggestedCategory);
        setDocumentCategory(suggestedCategory.id);
        
        // Versuche Unterkategorie vorzuschlagen
        const suggestedSubcategory = DocumentCategorizer.suggestSubcategory(suggestedCategory, fileName);
        if (suggestedSubcategory) {
          setDocumentSubcategory(suggestedSubcategory);
        }
        
        // Intelligente Tags basierend auf Angebot
        const smartTags = generateSmartTags(quote, trade, fileName);
        setDocumentTags(smartTags.join(', '));
      } else {
        // Fallback für Angebotsdokumente
        setDocumentCategory('procurement'); // "Ausschreibungen & Angebote"
        setDocumentSubcategory('Angebote');
        setDocumentTags(`Angebot, ${trade?.title || 'Gewerk'}, ${displayQuote.company_name || 'Dienstleister'}`);
      }
      
      // Öffne Kategorisierungsmodal
      setShowCategorizationModal(true);
    } catch (error) {
      console.error('❌ Fehler beim Vorbereiten des DMS-Uploads:', error);
      alert(`Fehler beim Vorbereiten des DMS-Uploads: ${(error as Error).message}`);
    }
  };

  // Dokumentenkategorisierung abschließen und DMS speichern - Verwendet bestehende Upload-API
  const completeDMSStorage = async () => {
    if (!currentDMSDocument || !currentDMSDocument.file) {
      alert('Kein Dokument für DMS-Speicherung ausgewählt');
      return;
    }

    if (!project?.id) {
      alert('Kein Projekt verfügbar für DMS-Upload');
      return;
    }

    setIsDMSProcessing(true);
    
    try {
      // Erstelle FormData für bestehende Upload-API
      const formData = new FormData();
      formData.append('project_id', project.id.toString());
      formData.append('file', currentDMSDocument.file);
      
      // Titel mit Angebot-Information erweitern
      const enhancedTitle = `Angebot-${displayQuote.id}: ${currentDMSDocument.title}`;
      formData.append('title', enhancedTitle);
      
      // Beschreibung mit Metadaten
      const enhancedDescription = [
        documentDescription || '',
        `Angebot #${displayQuote.id}`,
        `Dienstleister: ${displayQuote.company_name || displayQuote.contact_person}`,
        `Gewerk: ${trade?.title}`,
        `Betrag: ${displayQuote.total_amount} ${displayQuote.currency || 'EUR'}`,
        documentTags ? `Tags: ${documentTags}` : ''
      ].filter(line => line.trim()).join('\n');
      formData.append('description', enhancedDescription);
      
      // Konvertiere Frontend-Kategorie zu Backend-Format (lowercase)
      const backendCategory = documentCategory.toLowerCase();
      formData.append('category', backendCategory);
      
      if (documentSubcategory) {
        formData.append('subcategory', documentSubcategory);
      }
      
      if (documentTags) {
        formData.append('tags', documentTags);
      }
      
      // Dokumenttyp basierend auf Dateierweiterung
      const fileExtension = currentDMSDocument.file.name.split('.').pop()?.toLowerCase() || 'pdf';
      formData.append('document_type', getDocumentTypeFromExtension(fileExtension));
      
      formData.append('is_public', 'true');

      console.log('📝 DMS Upload FormData:', {
        project_id: project.id,
        title: enhancedTitle,
        category: backendCategory,
        subcategory: documentSubcategory,
        tags: documentTags,
        fileName: currentDMSDocument.file.name,
        fileSize: currentDMSDocument.file.size
      });

      // Verwende bestehende Upload-API
      const result = await uploadDocument(formData);
      console.log('✅ DMS Upload erfolgreich:', result);

      // Erfolgsmeldung
      alert(`✅ Dokument erfolgreich im DMS gespeichert!\n\n` +
            `📁 Kategorie: ${documentCategory}${documentSubcategory ? ' > ' + documentSubcategory : ''}\n` +
            `🏷️ Tags: ${documentTags || 'Keine'}\n` +
            `📄 Titel: ${enhancedTitle}\n` +
            `💾 Dokument-ID: ${result.id}`);

      // Modal schließen und Reset
      setShowCategorizationModal(false);
      resetDMSForm();
      
    } catch (error) {
      console.error('❌ DMS Storage Fehler:', error);
      alert(`❌ Fehler beim Speichern im DMS:\n\n${(error as Error).message}`);
    } finally {
      setIsDMSProcessing(false);
    }
  };

  // Hilfsfunktion: Dokumenttyp basierend auf Dateierweiterung
  const getDocumentTypeFromExtension = (extension: string): string => {
    const typeMap: { [key: string]: string } = {
      'pdf': 'pdf',
      'doc': 'document',
      'docx': 'document',
      'xls': 'spreadsheet',
      'xlsx': 'spreadsheet',
      'ppt': 'presentation',
      'pptx': 'presentation',
      'jpg': 'image',
      'jpeg': 'image',
      'png': 'image',
      'gif': 'image',
      'mp4': 'video',
      'mov': 'video',
      'avi': 'video'
    };
    return typeMap[extension] || 'document';
  };

  // Hilfsfunktion: Intelligente Tags basierend auf Kontext generieren
  const generateSmartTags = (quote: any, trade: any, fileName: string): string[] => {
    const tags: string[] = [];
    
    // Basis-Tags
    tags.push('Angebot');
    
    // Gewerk-basierte Tags
    if (trade?.title) {
      tags.push(trade.title);
      
      // Gewerk-spezifische Tags
      const tradeTitle = trade.title.toLowerCase();
      if (tradeTitle.includes('elektr')) tags.push('Elektrik');
      if (tradeTitle.includes('sanit')) tags.push('Sanitär');
      if (tradeTitle.includes('heiz')) tags.push('Heizung');
      if (tradeTitle.includes('dach')) tags.push('Dacharbeit');
      if (tradeTitle.includes('fenster')) tags.push('Fenster');
      if (tradeTitle.includes('maler')) tags.push('Malerarbeit');
      if (tradeTitle.includes('boden')) tags.push('Bodenbelag');
      if (tradeTitle.includes('fliesen')) tags.push('Fliesenarbeit');
    }
    
    // Dienstleister-basierte Tags
    if (quote.company_name) {
      tags.push(quote.company_name);
    }
    
    // Dateiname-basierte Tags
    const lowerFileName = fileName.toLowerCase();
    if (lowerFileName.includes('kostenvoranschlag')) tags.push('Kostenvoranschlag');
    if (lowerFileName.includes('kalkulation')) tags.push('Kalkulation');
    if (lowerFileName.includes('material')) tags.push('Materialkosten');
    if (lowerFileName.includes('arbeitszeit') || lowerFileName.includes('lohn')) tags.push('Arbeitskosten');
    if (lowerFileName.includes('zeitplan') || lowerFileName.includes('termin')) tags.push('Terminplanung');
    if (lowerFileName.includes('garantie') || lowerFileName.includes('gewähr')) tags.push('Garantie');
    
    // Projekt-basierte Tags
    if (project?.name) {
      tags.push(project.name);
    }
    
    // Entferne Duplikate und limitiere auf max. 8 Tags
    return Array.from(new Set(tags)).slice(0, 8);
  };

  // Aufbewahrungszeit basierend auf Kategorie bestimmen - verwendet DMS-Standard
  const getRetentionPeriod = (category: string): number => {
    const retentionMap: { [key: string]: number } = {
      'planning': 30, // Planungsunterlagen: 30 Jahre (gesetzlich)
      'contracts': 30, // Verträge: 30 Jahre (gesetzlich)
      'finance': 10, // Finanzdokumente: 10 Jahre (HGB)
      'execution': 5, // Ausführungsunterlagen: 5 Jahre
      'documentation': 10, // Dokumentation: 10 Jahre
      'order_confirmations': 6, // Auftragsbestätigungen: 6 Jahre
      'technical': 10, // Technische Unterlagen: 10 Jahre
      'project_management': 10, // Projektmanagement: 10 Jahre
      'procurement': 6 // Beschaffung: 6 Jahre
    };
    return retentionMap[category.toLowerCase()] || 10;
  };

  // DMS Form Reset
  const resetDMSForm = () => {
    setCurrentDMSDocument(null);
    setDocumentCategory('');
    setDocumentSubcategory('');
    setDocumentTags('');
    setDocumentDescription('');
  };

  // Verwende bestehende DMS-Kategorien
  const documentCategories = DOCUMENT_CATEGORIES.map(cat => ({
    value: cat.id,
    label: cat.name,
    description: cat.description,
    subcategories: getSubcategoriesForCategory(cat.id)
  }));

  // Hilfsfunktion: Unterkategorien für eine Kategorie abrufen
  function getSubcategoriesForCategory(categoryId: string): string[] {
    const subcategoryMappings: Record<string, string[]> = {
      'planning': ['Baupläne & Grundrisse', 'Baugenehmigungen', 'Statische Berechnungen', 'Energieausweise', 'Vermessungsunterlagen'],
      'contracts': ['Bauverträge', 'Nachträge', 'Versicherungen', 'Gewährleistungen', 'Mängelrügen'],
      'finance': ['Rechnungen', 'Kostenvoranschläge', 'Leistungsverzeichnisse', 'Zahlungsbelege', 'Änderungsaufträge', 'Schlussrechnungen'],
      'execution': ['Lieferscheine', 'Materialbelege', 'Abnahmeprotokolle', 'Prüfberichte', 'Zertifikate'],
      'documentation': ['Fotos', 'Videos', 'Baustellenberichte', 'Bestandsdokumentation', 'Fortschrittsberichte'],
      'order_confirmations': ['Auftragsbestätigungen', 'Bestellbestätigungen', 'Leistungsbestätigungen'],
      'technical': ['Technische Zeichnungen', 'Spezifikationen', 'Datenblätter', 'Handbücher', 'Anleitungen'],
      'project_management': ['Projektpläne', 'Terminplanung', 'Budgetplanung', 'Projektsteuerung', 'Risikomanagement', 'Qualitätsmanagement'],
      'procurement': ['Ausschreibungsunterlagen', 'Technische Spezifikationen', 'Angebote', 'Angebotsbewertung', 'Vergabedokumentation']
    };
    return subcategoryMappings[categoryId] || [];
  }

  const downloadPDF = async () => {
    try {
      await generateQuotePDF(displayQuote);
    } catch (error) {
      console.error('Fehler beim PDF-Download:', error);
      alert('Fehler beim Herunterladen des PDFs');
    }
  };

  const handleEditQuote = () => {
    if (onEditQuote) {
      onEditQuote(displayQuote);
    }
  };

  const handleDeleteQuote = () => {
    if (onDeleteQuote && displayQuote.status === 'submitted') {
      if (window.confirm('Möchten Sie dieses Angebot wirklich zurückziehen?')) {
        onDeleteQuote(displayQuote.id);
        onClose();
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-[#0f172a]/95 rounded-2xl shadow-2xl border border-white/10 max-w-4xl w-full max-h-[90vh] overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-[#ffbd59]/15 rounded-xl">
              <FileText size={24} className="text-[#ffbd59] drop-shadow" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Angebot Details</h2>
              <p className="text-gray-300">{displayQuote.title}</p>
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
        <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="p-6 space-y-6">
            
            {/* Status-Banner */}
            <div className={`${statusInfo.bgColor} border ${statusInfo.borderColor} rounded-xl p-4`}> 
              <div className="flex items-center gap-3 mb-2">
                {statusInfo.icon}
                <h3 className={`text-lg font-semibold ${statusInfo.color}`}>{statusInfo.text}</h3>
              </div>
              <p className="text-gray-300 text-sm">{statusInfo.description}</p>
            </div>

            {/* Grundlegende Angebot-Informationen */}
            <div className="bg-white/5 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <FileText size={20} className="text-[#ffbd59]" />
                Grundlegende Angebot-Informationen
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Linke Spalte */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Building size={16} className="text-gray-400" />
                    <div>
                      <div className="text-sm text-gray-400">Projekt</div>
                      <div className="text-white font-medium">{project?.name || 'Unbekannt'}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <FileText size={16} className="text-gray-400" />
                    <div>
                      <div className="text-sm text-gray-400">Gewerk</div>
                      <div className="text-white font-medium">{trade?.title || 'Unbekannt'}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <FileText size={16} className="text-gray-400" />
                    <div>
                      <div className="text-sm text-gray-400">Angebotsnummer</div>
                      <div className="text-white font-medium">#{displayQuote.id}{displayQuote.quote_number ? ` - ${displayQuote.quote_number}` : ''}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Calendar size={16} className="text-gray-400" />
                    <div>
                      <div className="text-sm text-gray-400">Erstellt am</div>
                      <div className="text-white font-medium">{formatDate(displayQuote.created_at)}</div>
                    </div>
                  </div>
                </div>
                
                {/* Rechte Spalte */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Euro size={16} className="text-gray-400" />
                    <div>
                      <div className="text-sm text-gray-400">Gesamtbetrag</div>
                      <div className="text-white font-medium text-lg">
                        {formatCurrency(displayQuote.total_amount, displayQuote.currency)}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Calendar size={16} className="text-gray-400" />
                    <div>
                      <div className="text-sm text-gray-400">Gültig bis</div>
                      <div className="text-white font-medium">
                        {formatDate(displayQuote.valid_until || displayQuote.validity_date || displayQuote.valid_till || displayQuote.expires_at)}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <ClockIcon size={16} className="text-gray-400" />
                    <div>
                      <div className="text-sm text-gray-400">Geschätzte Dauer</div>
                      <div className="text-white font-medium">{displayQuote.estimated_duration || 0} Tage</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Shield size={16} className="text-gray-400" />
                    <div>
                      <div className="text-sm text-gray-400">Garantie</div>
                      <div className="text-white font-medium">{displayQuote.warranty_period || 0} Monate</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Unternehmensinformationen */}
            <div className="bg-white/5 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Building size={20} className="text-[#ffbd59]" />
                Unternehmensinformationen
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Building size={16} className="text-gray-400" />
                    <div>
                      <div className="text-sm text-gray-400">Unternehmen</div>
                      <div className="text-white font-medium">{displayQuote.company_name || 'Nicht angegeben'}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <User size={16} className="text-gray-400" />
                    <div>
                      <div className="text-sm text-gray-400">Ansprechpartner</div>
                      <div className="text-white font-medium">{displayQuote.contact_person || 'Nicht angegeben'}</div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <User size={16} className="text-gray-400" />
                    <div>
                      <div className="text-sm text-gray-400">E-Mail</div>
                      <div className="text-white font-medium">{displayQuote.email || 'Nicht angegeben'}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <User size={16} className="text-gray-400" />
                    <div>
                      <div className="text-sm text-gray-400">Telefon</div>
                      <div className="text-white font-medium">{displayQuote.phone || 'Nicht angegeben'}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Zeitplan und Termine */}
            <div className="bg-white/5 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Calendar size={20} className="text-[#ffbd59]" />
                Zeitplan und Termine
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Calendar size={16} className="text-gray-400" />
                    <div>
                      <div className="text-sm text-gray-400">Startdatum</div>
                      <div className="text-white font-medium">{formatDate(displayQuote.start_date)}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Calendar size={16} className="text-gray-400" />
                    <div>
                      <div className="text-sm text-gray-400">Fertigstellung</div>
                      <div className="text-white font-medium">{formatDate(displayQuote.completion_date)}</div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Shield size={16} className="text-gray-400" />
                    <div>
                      <div className="text-sm text-gray-400">Zahlungsbedingungen</div>
                      <div className="text-white font-medium">{displayQuote.payment_terms || 'Nicht angegeben'}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Kostenaufschlüsselung */}
            {displayQuote.labor_cost || displayQuote.material_cost || displayQuote.overhead_cost ? (
              <div className="bg-white/5 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Euro size={20} className="text-[#ffbd59]" />
                  Kostenaufschlüsselung
                </h3>
                
                <div className="space-y-3">
                  {displayQuote.labor_cost && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">Arbeitskosten</span>
                      <span className="text-white font-medium">{formatCurrency(displayQuote.labor_cost, displayQuote.currency)}</span>
                    </div>
                  )}
                  
                  {displayQuote.material_cost && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">Materialkosten</span>
                      <span className="text-white font-medium">{formatCurrency(displayQuote.material_cost, displayQuote.currency)}</span>
                    </div>
                  )}
                  
                  {displayQuote.overhead_cost && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">Gemeinkosten</span>
                      <span className="text-white font-medium">{formatCurrency(displayQuote.overhead_cost, displayQuote.currency)}</span>
                    </div>
                  )}
                  
                  <div className="border-t border-white/20 pt-3">
                    <div className="flex justify-between items-center">
                      <span className="text-white font-semibold">Gesamtbetrag</span>
                      <span className="text-[#ffbd59] font-bold text-lg">{formatCurrency(displayQuote.total_amount, displayQuote.currency)}</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

            {/* Beschreibung */}
            {displayQuote.description && (
              <div className="bg-white/5 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <FileText size={20} className="text-[#ffbd59]" />
                  Beschreibung
                </h3>
                <p className="text-gray-300 text-sm leading-relaxed">{displayQuote.description}</p>
              </div>
            )}

            {/* Qualifikationen und Referenzen */}
            {(displayQuote.qualifications || displayQuote.references) && (
              <div className="bg-white/5 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Award size={20} className="text-[#ffbd59]" />
                  Qualifikationen und Referenzen
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {displayQuote.qualifications && (
                    <div>
                      <h4 className="text-white font-medium mb-2">Qualifikationen</h4>
                      <p className="text-gray-300 text-sm leading-relaxed">{displayQuote.qualifications}</p>
                    </div>
                  )}
                  
                  {displayQuote.references && (
                    <div>
                      <h4 className="text-white font-medium mb-2">Referenzen</h4>
                      <p className="text-gray-300 text-sm leading-relaxed">{displayQuote.references}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Technischer Ansatz und Qualitätsstandards */}
            {(displayQuote.technical_approach || displayQuote.quality_standards) && (
              <div className="bg-white/5 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Shield size={20} className="text-[#ffbd59]" />
                  Technischer Ansatz und Qualität
                </h3>
                
                <div className="space-y-4">
                  {displayQuote.technical_approach && (
                    <div>
                      <h4 className="text-white font-medium mb-2">Technischer Ansatz</h4>
                      <p className="text-gray-300 text-sm leading-relaxed">{displayQuote.technical_approach}</p>
                    </div>
                  )}
                  
                  {displayQuote.quality_standards && (
                    <div>
                      <h4 className="text-white font-medium mb-2">Qualitätsstandards</h4>
                      <p className="text-gray-300 text-sm leading-relaxed">{displayQuote.quality_standards}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Sicherheit und Compliance */}
            {(displayQuote.safety_measures || displayQuote.environmental_compliance) && (
              <div className="bg-white/5 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Shield size={20} className="text-[#ffbd59]" />
                  Sicherheit und Umwelt-Compliance
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {displayQuote.safety_measures && (
                    <div>
                      <h4 className="text-white font-medium mb-2">Sicherheitsmaßnahmen</h4>
                      <p className="text-gray-300 text-sm leading-relaxed">{displayQuote.safety_measures}</p>
                    </div>
                  )}
                  
                  {displayQuote.environmental_compliance && (
                    <div>
                      <h4 className="text-white font-medium mb-2">Umwelt-Compliance</h4>
                      <p className="text-gray-300 text-sm leading-relaxed">{displayQuote.environmental_compliance}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Risikobewertung und Notfallplan */}
            {(displayQuote.risk_assessment || displayQuote.contingency_plan) && (
              <div className="bg-white/5 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <AlertTriangle size={20} className="text-[#ffbd59]" />
                  Risikomanagement
                </h3>
                
                <div className="space-y-4">
                  {displayQuote.risk_assessment && (
                    <div>
                      <h4 className="text-white font-medium mb-2">Risikobewertung</h4>
                      <p className="text-gray-300 text-sm leading-relaxed">{displayQuote.risk_assessment}</p>
                    </div>
                  )}
                  
                  {displayQuote.contingency_plan && (
                    <div>
                      <h4 className="text-white font-medium mb-2">Notfallplan</h4>
                      <p className="text-gray-300 text-sm leading-relaxed">{displayQuote.contingency_plan}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Zusätzliche Notizen */}
            {displayQuote.additional_notes && (
              <div className="bg-white/5 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <FileText size={20} className="text-[#ffbd59]" />
                  Zusätzliche Notizen
                </h3>
                <p className="text-gray-300 text-sm leading-relaxed">{displayQuote.additional_notes}</p>
              </div>
            )}





            {/* Dokument-Upload (nur für den Dienstleister der das Angebot erstellt hat) */}
            {user && displayQuote.service_provider_id === user.id && displayQuote.status !== 'accepted' && (
              <div className="bg-white/5 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Upload size={20} className="text-[#ffbd59]" />
                  Dokument hochladen
                </h3>
                <QuoteDocumentUpload 
                  quoteId={displayQuote.id}
                  onUploadSuccess={(updatedQuote) => {
                    setFullQuoteData(updatedQuote);
                    console.log('✅ Dokument erfolgreich hochgeladen:', updatedQuote);
                  }}
                  onUploadError={(error) => {
                    console.error('❌ Upload-Fehler:', error);
                  }}
                />
              </div>
            )}

            {/* Angebot-Dokumente - Erweiterte Logik */}
            {(() => {
              const hasDocuments = displayQuote.pdf_upload_path || displayQuote.additional_documents || 
                                 displayQuote.document_path || displayQuote.documents || displayQuote.file_path || 
                                 displayQuote.attachments || displayQuote.uploaded_files;
              
              if (!hasDocuments) {
                return (
                  <div className="bg-gray-500/10 border border-gray-500/30 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
                      <FileText size={20} className="text-gray-400" />
                      Keine Dokumente vorhanden
                    </h3>
                    <p className="text-gray-300 text-sm">
                      {user && displayQuote.service_provider_id === user.id 
                        ? 'Laden Sie Dokumente über den Upload-Bereich oben hoch.'
                        : 'Für dieses Angebot wurden keine Dokumente hochgeladen.'
                      }
                    </p>
                  </div>
                );
              }
              
              return (
                <div className="bg-white/5 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <FileText size={20} className="text-[#ffbd59]" />
                    Angebot-Dokumente
                  </h3>
                  
                  <div className="space-y-3">
                    {/* PDF Upload - Mehrere mögliche Feldnamen prüfen */}
                    {(displayQuote.pdf_upload_path || displayQuote.document_path || displayQuote.file_path) && (
                      <div className="flex items-center justify-between p-3 bg-black/20 rounded-lg border border-white/10">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-red-500/20 rounded-lg">
                            <FileText size={16} className="text-red-400" />
                          </div>
                          <div>
                            <div className="text-white font-medium">Angebot PDF</div>
                            <div className="text-gray-400 text-sm">
                              {(displayQuote.pdf_upload_path || displayQuote.document_path || displayQuote.file_path)?.split('/').pop() || 'Angebot.pdf'}
                            </div>
                          </div>
                        </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            const path = displayQuote.pdf_upload_path || displayQuote.document_path || displayQuote.file_path;
                            if (!path) {
                              alert('Kein Dokument-Pfad gefunden');
                              return;
                            }
                            
                            try {
                              // Verwende getAuthenticatedFileUrl für Download
                              const authenticatedUrl = getAuthenticatedFileUrl(path);
                              const token = localStorage.getItem('token');
                              
                              fetch(authenticatedUrl, {
                                method: 'GET',
                                headers: {
                                  'Authorization': `Bearer ${token}`
                                }
                              })
                              .then(response => {
                                if (!response.ok) {
                                  throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                                }
                                return response.blob();
                              })
                              .then(blob => {
                                const url = URL.createObjectURL(blob);
                                const a = document.createElement('a');
                                a.href = url;
                                a.download = path.split('/').pop() || 'angebot.pdf';
                                document.body.appendChild(a);
                                a.click();
                                document.body.removeChild(a);
                                URL.revokeObjectURL(url);
                              })
                              .catch(error => {
                                console.error('Download failed:', error);
                                alert(`Download fehlgeschlagen: ${error.message}`);
                              });
                            } catch (error) {
                              console.error('Download error:', error);
                              alert('Fehler beim Download');
                            }
                          }}
                          className="flex items-center gap-2 px-3 py-1.5 bg-green-600/20 text-green-400 rounded-lg font-medium hover:bg-green-600/30 transition-colors"
                        >
                          <Download size={14} />
                          Download
                        </button>
                        
                        <button
                          onClick={() => {
                            const path = displayQuote.pdf_upload_path || displayQuote.document_path || displayQuote.file_path;
                            if (!path) {
                              alert('Kein Dokument-Pfad gefunden');
                              return;
                            }
                            
                            try {
                              // Verwende getAuthenticatedFileUrl für Inline Viewer
                              const authenticatedUrl = getAuthenticatedFileUrl(path);
                              const token = localStorage.getItem('token');
                              
                              fetch(authenticatedUrl, {
                                method: 'GET',
                                headers: {
                                  'Authorization': `Bearer ${token}`
                                }
                              })
                              .then(response => {
                                if (!response.ok) {
                                  throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                                }
                                return response.blob();
                              })
                              .then(blob => {
                                const url = URL.createObjectURL(blob);
                                window.open(url, '_blank');
                                // Cleanup nach 5 Sekunden
                                setTimeout(() => URL.revokeObjectURL(url), 5000);
                              })
                              .catch(error => {
                                console.error('Inline viewer failed:', error);
                                alert(`Inline Viewer fehlgeschlagen: ${error.message}`);
                              });
                            } catch (error) {
                              console.error('Inline viewer error:', error);
                              alert('Fehler beim Öffnen des Inline Viewers');
                            }
                          }}
                          className="flex items-center gap-2 px-3 py-1.5 bg-blue-600/20 text-blue-400 rounded-lg font-medium hover:bg-blue-600/30 transition-colors"
                        >
                          <Eye size={14} />
                          Ansehen
                        </button>
                        
                        <button
                          onClick={() => {
                            // DMS Ablage mit Dokumentenkategorisierung
                            handleDMSStorage(displayQuote, 'pdf_main');
                          }}
                          className="flex items-center gap-2 px-3 py-1.5 bg-orange-600/20 text-orange-400 rounded-lg font-medium hover:bg-orange-600/30 transition-colors"
                        >
                          <FileText size={14} />
                          DMS
                        </button>
                      </div>
                      </div>
                    )}
                    
                    {/* Zusätzliche Dokumente - Mehrere mögliche Feldnamen prüfen */}
                    {(() => {
                      const documentsField = displayQuote.additional_documents || displayQuote.documents || displayQuote.attachments || displayQuote.uploaded_files;
                      if (!documentsField) return null;
                      
                      try {
                        let additionalDocs = [];
                        
                        // Versuche JSON zu parsen wenn String
                        if (typeof documentsField === 'string') {
                          additionalDocs = JSON.parse(documentsField);
                        } else if (Array.isArray(documentsField)) {
                          additionalDocs = documentsField;
                        } else if (typeof documentsField === 'object') {
                          additionalDocs = [documentsField];
                        }
                        
                        return Array.isArray(additionalDocs) && additionalDocs.length > 0 ? (
                          additionalDocs.map((doc: any, index: number) => (
                            <div key={index} className="flex items-center justify-between p-3 bg-black/20 rounded-lg border border-white/10">
                              <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-500/20 rounded-lg">
                                  <FileText size={16} className="text-blue-400" />
                                </div>
                                <div>
                                  <div className="text-white font-medium">
                                    {doc.name || doc.title || doc.filename || `Dokument ${index + 1}`}
                                  </div>
                                  <div className="text-gray-400 text-sm">
                                    {doc.type || doc.mime_type || 'Unbekannter Typ'} • {doc.size ? `${Math.round(doc.size / 1024)} KB` : 'Unbekannte Größe'}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => {
                                    const path = doc.url || doc.path || doc.file_path;
                                    if (!path) {
                                      alert('Kein Dokument-Pfad gefunden');
                                      return;
                                    }
                                    
                                    try {
                                      // Verwende getAuthenticatedFileUrl für Download
                                      const authenticatedUrl = getAuthenticatedFileUrl(path);
                                      const token = localStorage.getItem('token');
                                      
                                      fetch(authenticatedUrl, {
                                        method: 'GET',
                                        headers: {
                                          'Authorization': `Bearer ${token}`
                                        }
                                      })
                                      .then(response => {
                                        if (!response.ok) {
                                          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                                        }
                                        return response.blob();
                                      })
                                      .then(blob => {
                                        const url = URL.createObjectURL(blob);
                                        const a = document.createElement('a');
                                        a.href = url;
                                        a.download = doc.name || doc.filename || `document_${index + 1}`;
                                        document.body.appendChild(a);
                                        a.click();
                                        document.body.removeChild(a);
                                        URL.revokeObjectURL(url);
                                      })
                                      .catch(error => {
                                        console.error('Download failed:', error);
                                        alert(`Download fehlgeschlagen: ${error.message}`);
                                      });
                                    } catch (error) {
                                      console.error('Download error:', error);
                                      alert('Fehler beim Download');
                                    }
                                  }}
                                  className="flex items-center gap-2 px-3 py-1.5 bg-green-600/20 text-green-400 rounded-lg font-medium hover:bg-green-600/30 transition-colors"
                                >
                                  <Download size={14} />
                                  Download
                                </button>
                                
                                <button
                                  onClick={() => {
                                    const path = doc.url || doc.path || doc.file_path;
                                    if (!path) {
                                      alert('Kein Dokument-Pfad gefunden');
                                      return;
                                    }
                                    
                                    try {
                                      // Verwende getAuthenticatedFileUrl für Inline Viewer
                                      const authenticatedUrl = getAuthenticatedFileUrl(path);
                                      const token = localStorage.getItem('token');
                                      
                                      fetch(authenticatedUrl, {
                                        method: 'GET',
                                        headers: {
                                          'Authorization': `Bearer ${token}`
                                        }
                                      })
                                      .then(response => {
                                        if (!response.ok) {
                                          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                                        }
                                        return response.blob();
                                      })
                                      .then(blob => {
                                        const url = URL.createObjectURL(blob);
                                        window.open(url, '_blank');
                                        // Cleanup nach 5 Sekunden
                                        setTimeout(() => URL.revokeObjectURL(url), 5000);
                                      })
                                      .catch(error => {
                                        console.error('Inline viewer failed:', error);
                                        alert(`Inline Viewer fehlgeschlagen: ${error.message}`);
                                      });
                                    } catch (error) {
                                      console.error('Inline viewer error:', error);
                                      alert('Fehler beim Öffnen des Inline Viewers');
                                    }
                                  }}
                                  className="flex items-center gap-2 px-3 py-1.5 bg-blue-600/20 text-blue-400 rounded-lg font-medium hover:bg-blue-600/30 transition-colors"
                                >
                                  <Eye size={14} />
                                  Ansehen
                                </button>
                                
                                <button
                                  onClick={() => {
                                    // DMS Ablage mit Dokumentenkategorisierung
                                    handleDMSStorage(displayQuote, 'additional_doc', doc);
                                  }}
                                  className="flex items-center gap-2 px-3 py-1.5 bg-orange-600/20 text-orange-400 rounded-lg font-medium hover:bg-orange-600/30 transition-colors"
                                >
                                  <FileText size={14} />
                                  DMS
                                </button>
                              </div>
                            </div>
                          ))
                        ) : null;
                      } catch (e) {
                        console.error('Fehler beim Parsen der zusätzlichen Dokumente:', e);
                        return (
                          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                            <div className="text-red-400 text-sm">
                              Fehler beim Laden der Dokumente. Raw-Daten: {String(documentsField)}
                            </div>
                          </div>
                        );
                      }
                    })()}
                  </div>
                </div>
              );
            })()}

            {/* Aktionen */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleDownloadPDF}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-[#ffbd59] text-[#0f172a] rounded-xl font-semibold hover:bg-[#ffa726] transition-all duration-300 transform hover:scale-105 shadow-lg"
              >
                <Download size={16} />
                PDF herunterladen
              </button>
              
              <button
                onClick={handleShareQuote}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-white/10 text-white rounded-xl font-semibold hover:bg-white/15 transition-all duration-300 border border-white/10"
              >
                <Share2 size={16} />
                Angebot teilen
              </button>
              
              {displayQuote.status === 'submitted' && onEditQuote && (
                <button
                  onClick={handleEditQuote}
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-500/20 text-blue-300 rounded-xl font-semibold hover:bg-blue-500/30 transition-all duration-300 border border-blue-500/20"
                >
                  <Edit size={16} />
                  Bearbeiten
                </button>
              )}
              
              {displayQuote.status === 'submitted' && onDeleteQuote && (
                <button
                  onClick={handleDeleteQuote}
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-red-500/20 text-red-300 rounded-xl font-semibold hover:bg-red-500/30 transition-all duration-300 border border-red-500/20"
                >
                  <Trash2 size={16} />
                  Zurückziehen
                </button>
              )}
            </div>

            {/* Zusätzliche Informationen - Erweitert */}
            <div className="bg-white/5 rounded-xl p-4">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <FileText size={20} className="text-[#ffbd59]" />
                Angebot-Übersicht
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-400">
                <div>
                  <p className="mb-2">
                    <strong>Angebots-ID:</strong> #{displayQuote.id}
                  </p>
                  <p className="mb-2">
                    <strong>Status:</strong> 
                    <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                      displayQuote.status === 'accepted' ? 'bg-green-500/20 text-green-400' :
                      displayQuote.status === 'rejected' ? 'bg-red-500/20 text-red-400' :
                      'bg-blue-500/20 text-blue-400'
                    }`}>
                      {displayQuote.status === 'accepted' ? 'Angenommen' :
                       displayQuote.status === 'rejected' ? 'Abgelehnt' :
                       'Eingereicht'}
                    </span>
                  </p>
                  <p className="mb-2">
                    <strong>Eingereicht am:</strong> {formatDate(displayQuote.submitted_at || displayQuote.created_at)}
                  </p>
                </div>
                <div>
                  <p className="mb-2">
                    <strong>Kontakt:</strong> {displayQuote.email || 'Nicht angegeben'}
                  </p>
                  <p className="mb-2">
                    <strong>Telefon:</strong> {displayQuote.phone || 'Nicht angegeben'}
                  </p>
                  {displayQuote.rating && (
                    <p className="mb-2">
                      <strong>KI-Bewertung:</strong> {displayQuote.rating}/5
                    </p>
                  )}
                </div>
              </div>
              
              {/* AI Recommendation und Feedback */}
              {(displayQuote.ai_recommendation || displayQuote.feedback) && (
                <div className="mt-4 pt-4 border-t border-white/20">
                  {displayQuote.ai_recommendation && (
                    <div className="mb-3">
                      <strong className="text-[#ffbd59]">KI-Empfehlung:</strong>
                      <p className="text-gray-300 text-sm mt-1">{displayQuote.ai_recommendation}</p>
                    </div>
                  )}
                  {displayQuote.feedback && (
                    <div>
                      <strong className="text-blue-400">Feedback:</strong>
                      <p className="text-gray-300 text-sm mt-1">{displayQuote.feedback}</p>
                    </div>
                  )}
                </div>
              )}
              
              {/* Ablehnungsgrund falls vorhanden */}
              {displayQuote.rejection_reason && displayQuote.status === 'rejected' && (
                <div className="mt-4 pt-4 border-t border-red-500/30">
                  <strong className="text-red-400">Ablehnungsgrund:</strong>
                  <p className="text-gray-300 text-sm mt-1">{displayQuote.rejection_reason}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-[#0f172a]/95 rounded-2xl shadow-2xl border border-white/10 max-w-md w-full">
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[#ffbd59]/15 rounded-lg">
                    <Share2 size={20} className="text-[#ffbd59]" />
                  </div>
                  <h3 className="text-lg font-semibold text-white">Angebot teilen</h3>
                </div>
                <button
                  onClick={() => setShowShareModal(false)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X size={20} className="text-gray-400" />
                </button>
              </div>

              {/* Content */}
              <div className="space-y-4">
                <p className="text-gray-300 text-sm">
                  Wählen Sie, wie Sie das Angebot teilen möchten:
                </p>

                {/* Sharing-Optionen */}
                <div className="grid grid-cols-1 gap-3">
                  
                  {/* E-Mail */}
                  <button
                    onClick={shareViaEmail}
                    disabled={isGeneratingPDF}
                    className="flex items-center gap-3 p-4 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 transition-all duration-200 group"
                  >
                    <div className="p-2 bg-blue-500/20 rounded-lg group-hover:bg-blue-500/30 transition-colors">
                      <Mail size={20} className="text-blue-400" />
                    </div>
                    <div className="flex-1 text-left">
                      <div className="text-white font-medium">E-Mail senden</div>
                      <div className="text-gray-400 text-sm">PDF per E-Mail versenden</div>
                    </div>
                    <ExternalLink size={16} className="text-gray-400" />
                  </button>

                  {/* WhatsApp */}
                  <button
                    onClick={shareViaWhatsApp}
                    disabled={isGeneratingPDF}
                    className="flex items-center gap-3 p-4 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 transition-all duration-200 group"
                  >
                    <div className="p-2 bg-green-500/20 rounded-lg group-hover:bg-green-500/30 transition-colors">
                      <MessageCircle size={20} className="text-green-400" />
                    </div>
                    <div className="flex-1 text-left">
                      <div className="text-white font-medium">WhatsApp</div>
                      <div className="text-gray-400 text-sm">Nachricht mit PDF-Link</div>
                    </div>
                    <ExternalLink size={16} className="text-gray-400" />
                  </button>

                  {/* Web Share API */}
                  {navigator.share && (
                    <button
                      onClick={shareViaWebShare}
                      disabled={isGeneratingPDF}
                      className="flex items-center gap-3 p-4 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 transition-all duration-200 group"
                    >
                      <div className="p-2 bg-purple-500/20 rounded-lg group-hover:bg-purple-500/30 transition-colors">
                        <Share2 size={20} className="text-purple-400" />
                      </div>
                      <div className="flex-1 text-left">
                        <div className="text-white font-medium">Teilen</div>
                        <div className="text-gray-400 text-sm">System-Sharing verwenden</div>
                      </div>
                      <ExternalLink size={16} className="text-gray-400" />
                    </button>
                  )}

                  {/* Link kopieren */}
                  <button
                    onClick={copyLinkToClipboard}
                    className="flex items-center gap-3 p-4 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 transition-all duration-200 group"
                  >
                    <div className="p-2 bg-orange-500/20 rounded-lg group-hover:bg-orange-500/30 transition-colors">
                      <Copy size={20} className="text-orange-400" />
                    </div>
                    <div className="flex-1 text-left">
                      <div className="text-white font-medium">Link kopieren</div>
                      <div className="text-gray-400 text-sm">Link in Zwischenablage kopieren</div>
                    </div>
                    <Copy size={16} className="text-gray-400" />
                  </button>

                  {/* PDF herunterladen */}
                  <button
                    onClick={downloadPDF}
                    disabled={isGeneratingPDF}
                    className="flex items-center gap-3 p-4 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 transition-all duration-200 group"
                  >
                    <div className="p-2 bg-[#ffbd59]/20 rounded-lg group-hover:bg-[#ffbd59]/30 transition-colors">
                      <Download size={20} className="text-[#ffbd59]" />
                    </div>
                    <div className="flex-1 text-left">
                      <div className="text-white font-medium">PDF herunterladen</div>
                      <div className="text-gray-400 text-sm">PDF direkt herunterladen</div>
                    </div>
                    <Download size={16} className="text-gray-400" />
                  </button>
                </div>

                {/* Loading State */}
                {isGeneratingPDF && (
                  <div className="flex items-center justify-center gap-3 p-4 bg-[#ffbd59]/10 rounded-lg border border-[#ffbd59]/20">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#ffbd59]"></div>
                    <span className="text-[#ffbd59] text-sm font-medium">PDF wird generiert...</span>
                  </div>
                )}

                {/* Info */}
                <div className="mt-4 p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                  <div className="flex items-start gap-2">
                    <div className="p-1 bg-blue-500/20 rounded">
                      <FileText size={14} className="text-blue-400" />
                    </div>
                    <div className="text-sm text-blue-300">
                      <p className="font-medium mb-1">💡 Tipp:</p>
                      <p>Das PDF enthält alle Angebotsdetails und kann als Anhang versendet werden.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="mt-6 pt-4 border-t border-white/10">
                <button
                  onClick={() => setShowShareModal(false)}
                  className="w-full px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/15 transition-colors"
                >
                  Schließen
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Document Categorization Modal */}
      {showCategorizationModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
          <div className="bg-[#0f172a]/95 rounded-2xl shadow-2xl border border-white/10 max-w-2xl w-full max-h-[90vh] overflow-hidden">
            
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-orange-500/15 rounded-xl">
                  <FolderPlus size={24} className="text-orange-400 drop-shadow" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">Dokumentenkategorisierung</h2>
                  <p className="text-gray-300">{currentDMSDocument?.title}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowCategorizationModal(false);
                  resetDMSForm();
                }}
                disabled={isDMSProcessing}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50"
              >
                <X size={24} className="text-gray-400" />
              </button>
            </div>

            {/* Content */}
            <div className="overflow-y-auto max-h-[calc(90vh-180px)] p-6">
              <div className="space-y-6">
                
                {/* Dokumenteninfo */}
                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
                    <FileText size={18} className="text-[#ffbd59]" />
                    Dokument-Information
                  </h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-400">Typ:</span>
                      <span className="text-white ml-2">{currentDMSDocument?.documentType === 'pdf_main' ? 'Haupt-PDF' : 'Zusätzliches Dokument'}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Angebot:</span>
                      <span className="text-white ml-2">#{displayQuote?.id}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Projekt:</span>
                      <span className="text-white ml-2">{project?.name || 'Unbekannt'}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Gewerk:</span>
                      <span className="text-white ml-2">{trade?.title || 'Unbekannt'}</span>
                    </div>
                  </div>
                </div>

                {/* Smart Categorization Hint */}
                {documentCategory && (
                  <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                    <div className="flex items-start gap-2">
                      <div className="p-1 bg-green-500/20 rounded">
                        <Eye size={14} className="text-green-400" />
                      </div>
                      <div className="text-sm text-green-300">
                        <p className="font-medium mb-1">🤖 Intelligente Kategorisierung:</p>
                        <p>Basierend auf dem Dateinamen wurde automatisch die Kategorie "{documentCategories.find(c => c.value === documentCategory)?.label}" vorgeschlagen. Sie können diese bei Bedarf ändern.</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Kategorie auswählen */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <Archive size={18} className="text-[#ffbd59]" />
                    Kategorisierung
                    {documentCategory && (
                      <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full">
                        KI-Vorschlag
                      </span>
                    )}
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Hauptkategorie */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Hauptkategorie *
                      </label>
                      <select
                        value={documentCategory}
                        onChange={(e) => {
                          setDocumentCategory(e.target.value);
                          setDocumentSubcategory(''); // Reset subcategory
                        }}
                        className="w-full bg-[#1e293b] border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent"
                      >
                        <option value="">Kategorie wählen...</option>
                        {documentCategories.map((category) => (
                          <option key={category.value} value={category.value}>
                            {category.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Unterkategorie */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Unterkategorie
                      </label>
                      <select
                        value={documentSubcategory}
                        onChange={(e) => setDocumentSubcategory(e.target.value)}
                        disabled={!documentCategory}
                        className="w-full bg-[#1e293b] border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <option value="">Unterkategorie wählen...</option>
                        {documentCategory && documentCategories
                          .find(cat => cat.value === documentCategory)
                          ?.subcategories.map((subcategory) => (
                            <option key={subcategory} value={subcategory}>
                              {subcategory}
                            </option>
                          ))
                        }
                      </select>
                    </div>
                  </div>

                  {/* Tags */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Tags (kommagetrennt)
                    </label>
                    <input
                      type="text"
                      value={documentTags}
                      onChange={(e) => setDocumentTags(e.target.value)}
                      placeholder="z.B. Elektrik, Installation, Neubau"
                      className="w-full bg-[#1e293b] border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent"
                    />
                  </div>

                  {/* Beschreibung */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Beschreibung
                    </label>
                    <textarea
                      value={documentDescription}
                      onChange={(e) => setDocumentDescription(e.target.value)}
                      placeholder="Zusätzliche Beschreibung des Dokuments..."
                      rows={3}
                      className="w-full bg-[#1e293b] border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent"
                    />
                  </div>

                  {/* Aufbewahrungszeit Info */}
                  {documentCategory && (
                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                      <div className="flex items-start gap-2">
                        <div className="p-1 bg-blue-500/20 rounded">
                          <Clock size={14} className="text-blue-400" />
                        </div>
                        <div className="text-sm text-blue-300">
                          <p className="font-medium mb-1">📅 Aufbewahrungszeit:</p>
                          <p>{getRetentionPeriod(documentCategory)} Jahre (nach gesetzlichen Bestimmungen)</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-white/10">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => {
                    setShowCategorizationModal(false);
                    resetDMSForm();
                  }}
                  disabled={isDMSProcessing}
                  className="px-6 py-2 bg-white/10 text-white rounded-lg hover:bg-white/15 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Abbrechen
                </button>
                
                <button
                  onClick={completeDMSStorage}
                  disabled={isDMSProcessing || !documentCategory}
                  className="px-6 py-3 bg-[#ffbd59] text-[#0f172a] rounded-lg font-semibold hover:bg-[#ffa726] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isDMSProcessing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#0f172a]"></div>
                      Speichere...
                    </>
                  ) : (
                    <>
                      <Archive size={16} />
                      Im DMS speichern
                    </>
                  )}
                </button>
              </div>
              
              {/* Hinweis */}
              <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                <div className="flex items-start gap-2">
                  <div className="p-1 bg-yellow-500/20 rounded">
                    <AlertTriangle size={14} className="text-yellow-400" />
                  </div>
                  <div className="text-sm text-yellow-300">
                    <p className="font-medium mb-1">💡 Hinweis:</p>
                    <p>Das Dokument wird mit allen Kategorisierungsdetails im Dokumentenmanagementsystem (DMS) archiviert und kann später über die Suchfunktion gefunden werden.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
