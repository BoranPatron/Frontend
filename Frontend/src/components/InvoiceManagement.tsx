import React, { useState, useEffect } from 'react';
import { Download, Eye, CreditCard, AlertCircle, CheckCircle, FileText } from 'lucide-react';
import { api } from '../api/api';

interface InvoiceManagementProps {
  milestoneId: number;
  milestoneTitle: string;
  onInvoiceAction?: (action: 'paid' | 'downloaded' | 'viewed', invoice: any) => void;
}

const InvoiceManagement: React.FC<InvoiceManagementProps> = ({
  milestoneId,
  onInvoiceAction
}) => {
  const [invoice, setInvoice] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadInvoice();
  }, [milestoneId]);

  const loadInvoice = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/invoices/milestone/${milestoneId}`);
      if (response.data) {
        setInvoice(response.data);
      }
    } catch (error: any) {
      if (error.response?.status !== 404) {
        setError('Fehler beim Laden der Rechnung');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleViewInvoice = async () => {
    try {
      // Mark as viewed
      await api.post(`/invoices/${invoice.id}/mark-viewed`);
      
      // Open PDF in new window
      window.open(`/api/v1/invoices/${invoice.id}/download`, '_blank');
      
      // Update local state
      setInvoice(prev => ({ ...prev, status: 'viewed' }));
      onInvoiceAction?.('viewed', invoice);
    } catch (error) {
      console.error('Fehler beim Anzeigen der Rechnung:', error);
    }
  };

  const handleDownloadInvoice = async () => {
    try {
      const response = await api.get(`/invoices/${invoice.id}/download`, { 
        responseType: 'blob' 
      });
      
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Rechnung_${invoice.invoice_number}.pdf`;
      link.click();
      window.URL.revokeObjectURL(url);
      
      onInvoiceAction?.('downloaded', invoice);
    } catch (error) {
      console.error('Download-Fehler:', error);
    }
  };

  const handleMarkAsPaid = async () => {
    try {
      const response = await api.post(`/invoices/${invoice.id}/mark-paid`, {
        paid_at: new Date().toISOString()
      });
      
      setInvoice(response.data);
      onInvoiceAction?.('paid', response.data);
    } catch (error) {
      console.error('Fehler beim Markieren als bezahlt:', error);
    }
  };

  if (loading) {
  return (
      <div className="bg-gradient-to-br from-[#1a1a2e]/50 to-[#2c3539]/50 rounded-xl p-6 border border-gray-600/30">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#ffbd59] mx-auto"></div>
    </div>
  );
}

  if (!invoice) {
  return (
      <div className="bg-gradient-to-br from-[#1a1a2e]/50 to-[#2c3539]/50 rounded-xl p-6 border border-gray-600/30">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <FileText size={18} className="text-[#ffbd59]" />
          Rechnung
        </h3>
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle size={20} className="text-blue-400" />
            <span className="text-blue-300 font-medium">Warten auf Rechnung</span>
            </div>
          <p className="text-blue-200 text-sm">
            Der Dienstleister hat noch keine Rechnung eingereicht.
          </p>
      </div>
    </div>
  );
}

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'text-green-300 bg-green-500/20';
      case 'viewed': return 'text-purple-300 bg-purple-500/20';
      case 'sent': return 'text-blue-300 bg-blue-500/20';
      case 'overdue': return 'text-red-300 bg-red-500/20';
      default: return 'text-gray-300 bg-gray-500/20';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'paid': return 'Bezahlt';
      case 'viewed': return 'Angesehen';
      case 'sent': return 'Gesendet';
      case 'overdue': return 'Überfällig';
      default: return status;
    }
  };

  return (
    <div className="bg-gradient-to-br from-[#1a1a2e]/50 to-[#2c3539]/50 rounded-xl p-6 border border-gray-600/30">
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
        <FileText size={18} className="text-[#ffbd59]" />
        Rechnung
      </h3>

      <div className="space-y-4">
        {/* Rechnungsinfo */}
        <div className="bg-gray-600/20 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
                  <div>
              <span className="text-sm font-medium text-gray-400">Rechnungsnummer</span>
              <p className="text-white font-mono">{invoice.invoice_number}</p>
                  </div>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(invoice.status)}`}>
              {getStatusLabel(invoice.status)}
                    </span>
                </div>
                
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-sm font-medium text-gray-400">Betrag</span>
              <p className="text-white font-bold text-lg" style={{ color: '#ffbd59' }}>
                {invoice.total_amount?.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
              </p>
                </div>
            <div>
              <span className="text-sm font-medium text-gray-400">Fällig am</span>
              <p className="text-white">
                {new Date(invoice.due_date).toLocaleDateString('de-DE')}
              </p>
              </div>
          </div>

          {invoice.description && (
            <div className="mt-3">
              <span className="text-sm font-medium text-gray-400">Beschreibung</span>
              <p className="text-gray-300 text-sm">{invoice.description}</p>
            </div>
          )}
        </div>

        {/* Aktions-Buttons */}
        <div className="grid grid-cols-2 gap-3">
            <button
            onClick={handleViewInvoice}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold rounded-lg hover:shadow-lg transition-all duration-200"
            >
            <Eye size={20} />
            Ansehen
            </button>

                <button
            onClick={handleDownloadInvoice}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold rounded-lg hover:shadow-lg transition-all duration-200"
                >
            <Download size={20} />
            Download
                </button>
              </div>

        {/* Bezahlt markieren Button */}
        {invoice.status !== 'paid' && (
            <button
            onClick={handleMarkAsPaid}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 text-white font-semibold rounded-lg hover:shadow-lg transition-all duration-200"
            style={{ background: 'linear-gradient(to right, #ffbd59, #ff9500)' }}
            >
            <CreditCard size={20} />
            Als bezahlt markieren
            </button>
        )}

        {/* Bezahlt Status */}
        {invoice.status === 'paid' && (
          <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 text-center">
            <div className="flex items-center justify-center gap-2 text-green-300">
              <CheckCircle size={20} />
              <span className="font-medium">Rechnung wurde bezahlt</span>
                  </div>
            {invoice.paid_at && (
              <p className="text-green-200 text-sm mt-1">
                am {new Date(invoice.paid_at).toLocaleDateString('de-DE')}
              </p>
            )}
                  </div>
        )}
      </div>
    </div>
  );
};

export default InvoiceManagement;