import React, { useState, useEffect } from 'react';
import { 
  Receipt, 
  Eye, 
  Download, 
  CreditCard, 
  FileText, 
  Archive, 
  Tag, 
  Calendar, 
  User,
  AlertTriangle,
  CheckCircle,
  Clock,
  FolderOpen,
  Upload,
  Zap
} from 'lucide-react';

// Import der bestehenden Services
import { DocumentCategorizer, DOCUMENT_CATEGORIES } from '../utils/documentCategorizer';
import { uploadDocument } from '../api/documentService';

interface InvoiceData {
  id: number;
  invoice_number: string;
  total_amount: number;
  currency?: string;
  status: 'draft' | 'sent' | 'viewed' | 'paid' | 'overdue';
  invoice_date?: string;
  due_date?: string;
  description?: string;
  service_provider_id?: number;
  service_provider_name?: string;
  milestone_id?: number;
  created_at?: string;
  country?: string;
  vat_rate?: number;
  net_amount?: number;
  vat_amount?: number;
  pdf_path?: string;
}

interface InvoiceManagementCardProps {
  invoice: InvoiceData | null;
  tradeId: number;
  tradeTitle: string;
  projectId: number;
  onInvoiceUpdated?: (updatedInvoice: InvoiceData) => void;
  onViewInvoice?: (invoice: InvoiceData) => void;
  onMarkAsPaid?: (invoice: InvoiceData) => void;
  isMarkingAsPaid?: boolean;
}

const InvoiceManagementCard: React.FC<InvoiceManagementCardProps> = ({
  invoice,
  tradeId,
  tradeTitle,
  projectId,
  onInvoiceUpdated,
  onViewInvoice,
  onMarkAsPaid,
  isMarkingAsPaid = false
}) => {
  const [isProcessingDMS, setIsProcessingDMS] = useState(false);
  const [showDMSModal, setShowDMSModal] = useState(false);
  const [dmsSuccess, setDmsSuccess] = useState(false);
  const [dmsCategoryData, setDmsCategoryData] = useState<any>(null);

  // Keine Rechnung vorhanden
  if (!invoice) {
    return (
      <div className="bg-gradient-to-r from-gray-500/10 to-gray-600/10 border border-gray-500/20 rounded-xl p-6">
        <div className="text-center">
          <Receipt size={48} className="text-gray-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-300 mb-2">
            Keine Rechnung vorhanden
          </h3>
          <p className="text-gray-400 text-sm">
            Der Dienstleister hat noch keine Rechnung erstellt.
          </p>
        </div>
      </div>
    );
  }

  // Status-Mapping für bessere UX
  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'sent':
        return {
          label: 'Versendet',
          color: 'bg-blue-500/20 text-blue-300',
          icon: <FileText size={16} />
        };
      case 'viewed':
        return {
          label: 'Eingesehen',
          color: 'bg-yellow-500/20 text-yellow-300',
          icon: <Eye size={16} />
        };
      case 'paid':
        return {
          label: 'Bezahlt',
          color: 'bg-green-500/20 text-green-300',
          icon: <CheckCircle size={16} />
        };
      case 'overdue':
        return {
          label: 'Überfällig',
          color: 'bg-red-500/20 text-red-300',
          icon: <AlertTriangle size={16} />
        };
      default:
        return {
          label: 'Neu',
          color: 'bg-purple-500/20 text-purple-300',
          icon: <Clock size={16} />
        };
    }
  };

  const statusInfo = getStatusInfo(invoice.status);

  // DMS-Kategorisierung und Upload
  const handleDMSIntegration = async () => {
    setIsProcessingDMS(true);
    setShowDMSModal(true);

    try {
      // 1. Rechnung-PDF vom Backend holen
      const { api } = await import('../api/api');
      const response = await api.get(`/invoices/${invoice.id}/download`, { 
        responseType: 'blob' 
      });
      
      const pdfBlob = new Blob([response.data], { type: 'application/pdf' });
      const pdfFile = new File([pdfBlob], `Rechnung_${invoice.invoice_number}.pdf`, {
        type: 'application/pdf'
      });

      // 2. Automatische Kategorisierung basierend auf Rechnungsdaten
      const documentName = `Rechnung ${invoice.invoice_number} - ${tradeTitle}`;
      const category = DocumentCategorizer.categorizeDocument(documentName, '.pdf');
      
      // 3. Erweiterte Metadata für die Rechnung
      const categoryData = {
        mainCategory: category?.id || 'finance',
        subCategory: 'paid_invoices', // Spezifische Unterkategorie für bezahlte Rechnungen
        confidence: 95, // High confidence for invoices
        detectedPatterns: category?.patterns || [],
        autoTags: [
          'rechnung',
          'bezahlt',
          tradeTitle.toLowerCase(),
          invoice.service_provider_name || 'dienstleister',
          `projekt-${projectId}`,
          `milestone-${tradeId}`,
          `betrag-${invoice.total_amount}`,
          `datum-${new Date().getFullYear()}`
        ].filter(Boolean)
      };

      setDmsCategoryData(categoryData);

      // 4. FormData für DMS-Upload vorbereiten
      const formData = new FormData();
      formData.append('file', pdfFile);
      formData.append('project_id', projectId.toString());
      formData.append('title', documentName);
      formData.append('description', `
        Rechnung von ${invoice.service_provider_name || 'Dienstleister'} für ${tradeTitle}
        
        Details:
        • Rechnungsnummer: ${invoice.invoice_number}
        • Betrag: ${invoice.total_amount} ${invoice.currency || 'CHF'}
        • Datum: ${invoice.invoice_date ? new Date(invoice.invoice_date).toLocaleDateString('de-DE') : 'N/A'}
        • Status: ${statusInfo.label}
        • MwSt.: ${invoice.vat_rate || 0}%
        
        Automatisch kategorisiert und ins DMS hochgeladen.
      `.trim());
      
      formData.append('document_type', 'invoice');
      formData.append('category', categoryData.mainCategory);
      formData.append('subcategory', categoryData.subCategory);
      formData.append('source', 'invoice_workflow');
      formData.append('trade_id', tradeId.toString());
      formData.append('invoice_id', invoice.id.toString());
      
      // Tags als JSON-String
      formData.append('tags', JSON.stringify(categoryData.autoTags));
      
      // 5. DMS-Upload durchführen
      console.log('🗂️ Uploading invoice to DMS with category:', categoryData);
      const uploadResult = await uploadDocument(formData);
      
      console.log('✅ Invoice successfully uploaded to DMS:', uploadResult);
      setDmsSuccess(true);

      // 6. Invoice als "DMS-integriert" markieren
      await api.post(`/invoices/${invoice.id}/mark-dms-integrated`, {
        dms_document_id: uploadResult.id,
        category: categoryData.mainCategory,
        subcategory: categoryData.subCategory,
        tags: categoryData.autoTags
      });

      // 7. Success-Callback
      if (onInvoiceUpdated) {
        onInvoiceUpdated(invoice); // Keep the original invoice object unchanged
      }

    } catch (error) {
      console.error('❌ Error during DMS integration:', error);
      alert('Fehler bei der DMS-Integration. Bitte versuchen Sie es erneut.');
    } finally {
      setIsProcessingDMS(false);
      // Modal nach 3 Sekunden schließen wenn erfolgreich
      if (dmsSuccess) {
        setTimeout(() => {
          setShowDMSModal(false);
          setDmsSuccess(false);
          setDmsCategoryData(null);
        }, 3000);
      }
    }
  };

  const handleViewInvoice = async () => {
    if (onViewInvoice) {
      onViewInvoice(invoice);
    } else {
      // Fallback: Standard-Implementierung
      try {
        const { api } = await import('../api/api');
        
        // Mark as viewed
        await api.post(`/invoices/${invoice.id}/mark-viewed`);
        
        // Open PDF in new window
        const token = localStorage.getItem('token');
        const baseUrl = window.location.hostname === 'localhost' 
          ? 'http://localhost:8000' 
          : '';
        
        const response = await fetch(`${baseUrl}/api/v1/invoices/${invoice.id}/download`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          window.open(url, '_blank');
          setTimeout(() => window.URL.revokeObjectURL(url), 1000);
        }
        
      } catch (error) {
        console.error('❌ Error viewing invoice:', error);
        alert('Fehler beim Öffnen der Rechnung. Bitte versuchen Sie es erneut.');
      }
    }
  };

  const handleDownloadInvoice = async () => {
    try {
      const { api } = await import('../api/api');
      
      const response = await api.get(`/invoices/${invoice.id}/download`, { 
        responseType: 'blob' 
      });
      
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Rechnung_${invoice.invoice_number}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('❌ Error downloading invoice:', error);
      alert('Fehler beim Herunterladen der Rechnung. Bitte versuchen Sie es erneut.');
    }
  };

  const handleMarkAsPaidLocal = () => {
    if (onMarkAsPaid) {
      onMarkAsPaid(invoice);
    }
  };

  return (
    <>
      {/* Haupt-Card */}
      <div className="bg-gradient-to-r from-[#1a1a2e]/80 to-[#2c3539]/80 backdrop-blur-sm rounded-xl border border-gray-600/30 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 px-6 py-4 border-b border-gray-600/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/20 rounded-lg">
                <Receipt size={24} className="text-green-400" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white">Rechnung erhalten</h3>
                <p className="text-sm text-gray-400">
                  Von {invoice.service_provider_name || 'Dienstleister'} • {tradeTitle}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <span className={`flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium ${statusInfo.color}`}>
                {statusInfo.icon}
                {statusInfo.label}
              </span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Rechnungsdetails */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="bg-[#1a1a2e]/50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-400 mb-3">Rechnungsdetails</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-300">Nummer:</span>
                    <span className="text-white font-medium">{invoice.invoice_number}</span>
                  </div>
                  {invoice.invoice_date && (
                    <div className="flex justify-between">
                      <span className="text-gray-300">Datum:</span>
                      <span className="text-white">{new Date(invoice.invoice_date).toLocaleDateString('de-DE')}</span>
                    </div>
                  )}
                  {invoice.due_date && (
                    <div className="flex justify-between">
                      <span className="text-gray-300">Fällig:</span>
                      <span className="text-white">{new Date(invoice.due_date).toLocaleDateString('de-DE')}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-[#ffbd59]/10 rounded-lg p-4 border border-[#ffbd59]/20">
                <h4 className="text-sm font-medium text-[#ffbd59] mb-3">Beträge</h4>
                <div className="space-y-2">
                  {invoice.net_amount && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-300">Netto:</span>
                      <span className="text-white">{invoice.net_amount.toFixed(2)} {invoice.currency || 'CHF'}</span>
                    </div>
                  )}
                  {invoice.vat_amount && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-300">MwSt ({invoice.vat_rate}%):</span>
                      <span className="text-white">+{invoice.vat_amount.toFixed(2)} {invoice.currency || 'CHF'}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg font-semibold border-t border-[#ffbd59]/20 pt-2">
                    <span className="text-white">Gesamt:</span>
                    <span className="text-[#ffbd59]">
                      {invoice.total_amount.toFixed(2)} {invoice.currency || 'CHF'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Aktions-Buttons */}
          <div className="flex gap-3 flex-wrap">
            <button
              onClick={handleViewInvoice}
              className="flex items-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-all duration-200 shadow-lg hover:scale-105"
            >
              <Eye size={16} />
              Rechnung öffnen
            </button>
            
            <button
              onClick={handleDownloadInvoice}
              className="flex items-center gap-2 px-4 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-all duration-200 shadow-lg hover:scale-105"
            >
              <Download size={16} />
              Download
            </button>
            
            {invoice.status !== 'paid' && (
              <button
                onClick={handleMarkAsPaidLocal}
                disabled={isMarkingAsPaid}
                className="flex items-center gap-2 px-4 py-3 bg-yellow-600 hover:bg-yellow-700 text-white font-medium rounded-lg transition-all duration-200 shadow-lg hover:scale-105 disabled:opacity-50"
              >
                <CreditCard size={16} />
                {isMarkingAsPaid ? 'Wird markiert...' : 'Als bezahlt markieren'}
              </button>
            )}
            
            {/* DMS Integration Button - nur bei bezahlten Rechnungen */}
            {invoice.status === 'paid' && (
              <button
                onClick={handleDMSIntegration}
                disabled={isProcessingDMS}
                className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-medium rounded-lg transition-all duration-200 shadow-lg hover:scale-105 disabled:opacity-50"
              >
                {isProcessingDMS ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    DMS-Integration...
                  </>
                ) : (
                  <>
                    <Archive size={16} />
                    Ins DMS archivieren
                  </>
                )}
              </button>
            )}
          </div>

          {/* Info-Box für DMS-Integration */}
          {invoice.status === 'paid' && (
            <div className="bg-gradient-to-r from-purple-500/10 to-indigo-500/10 rounded-lg p-4 border border-purple-500/20">
              <div className="flex items-start gap-3">
                <FolderOpen size={20} className="text-purple-400 mt-0.5" />
                <div>
                  <h4 className="font-medium text-purple-300 mb-1">DMS-Archivierung verfügbar</h4>
                  <p className="text-sm text-gray-400">
                    Diese bezahlte Rechnung kann automatisch kategorisiert und im 
                    Dokumentenmanagementsystem archiviert werden.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* DMS-Modal */}
      {showDMSModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-r from-[#1a1a2e] to-[#2c3539] rounded-xl border border-gray-600/30 max-w-md w-full shadow-2xl">
            <div className="p-6">
              {isProcessingDMS && !dmsSuccess ? (
                /* Processing State */
                <div className="text-center">
                  <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#ffbd59] mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-white mb-2">
                    DMS-Integration läuft...
                  </h3>
                  <p className="text-gray-400 text-sm mb-4">
                    Die Rechnung wird kategorisiert und archiviert
                  </p>
                  
                  <div className="bg-[#1a1a2e]/50 rounded-lg p-4 text-left">
                    <div className="space-y-2 text-xs text-gray-300">
                      <div className="flex items-center gap-2">
                        <Zap size={12} className="text-yellow-400" />
                        <span>Rechnung wird heruntergeladen...</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Tag size={12} className="text-blue-400" />
                        <span>Automatische Kategorisierung...</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Upload size={12} className="text-green-400" />
                        <span>Upload ins DMS...</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : dmsSuccess && dmsCategoryData ? (
                /* Success State */
                <div className="text-center">
                  <CheckCircle size={64} className="text-green-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-white mb-2">
                    ✅ DMS-Integration erfolgreich!
                  </h3>
                  <p className="text-gray-400 text-sm mb-6">
                    Die Rechnung wurde automatisch kategorisiert und archiviert
                  </p>
                  
                  <div className="bg-green-500/10 rounded-lg p-4 border border-green-500/20">
                    <div className="text-left space-y-3 text-sm">
                      <div>
                        <span className="text-gray-400">Kategorie:</span>
                        <p className="text-green-300 font-medium">
                          {DOCUMENT_CATEGORIES.find(c => c.id === dmsCategoryData.mainCategory)?.name}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-400">Tags:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {dmsCategoryData.autoTags.slice(0, 4).map((tag: string) => (
                            <span key={tag} className="px-2 py-1 bg-green-500/20 text-green-300 text-xs rounded">
                              {tag}
                            </span>
                          ))}
                          {dmsCategoryData.autoTags.length > 4 && (
                            <span className="px-2 py-1 bg-gray-500/20 text-gray-400 text-xs rounded">
                              +{dmsCategoryData.autoTags.length - 4}
                            </span>
                          )}
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-400">Vertrauen:</span>
                        <p className="text-green-300">{Math.round(dmsCategoryData.confidence * 100)}%</p>
                      </div>
                    </div>
                  </div>
                  
                  <p className="text-xs text-gray-500 mt-4">
                    Modal schließt automatisch...
                  </p>
                </div>
              ) : (
                /* Error State */
                <div className="text-center">
                  <AlertTriangle size={64} className="text-red-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-white mb-2">
                    Fehler bei DMS-Integration
                  </h3>
                  <p className="text-gray-400 text-sm mb-6">
                    Es ist ein Fehler aufgetreten. Bitte versuchen Sie es erneut.
                  </p>
                  
                  <button
                    onClick={() => setShowDMSModal(false)}
                    className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg"
                  >
                    Schließen
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default InvoiceManagementCard;