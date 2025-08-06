import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Receipt, 
  Download, 
  Eye, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  Euro,
  Calendar,
  Building,
  FileText,
  Filter,
  Search,
  Plus
} from 'lucide-react';
import { api } from '../api/api';
import InvoiceModal from '../components/InvoiceModal';

interface Invoice {
  id: number;
  invoice_number: string;
  milestone_id: number;
  milestone_title: string;
  project_name: string;
  total_amount: number;
  status: 'draft' | 'sent' | 'viewed' | 'paid' | 'overdue';
  due_date: string;
  created_at: string;
  updated_at: string;
  pdf_path?: string;
}

export default function Invoices() {
  const { user, isServiceProvider } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [selectedMilestone, setSelectedMilestone] = useState<any>(null);

  // Nur für Dienstleister zugänglich
  if (!isServiceProvider()) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#2c3539] to-[#1a1f23] p-4 flex items-center justify-center">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Zugriff verweigert</h1>
          <p className="text-gray-300">
            Diese Seite ist nur für Dienstleister verfügbar.
          </p>
        </div>
      </div>
    );
  }

  useEffect(() => {
    loadInvoices();
  }, []);

      const loadInvoices = async () => {
    setLoading(true);
    setError(null);
    try {
      // Korrigierter API-Pfad - Entfernung des doppelten 'invoices'
      const response = await api.get('/invoices/my-invoices');
      setInvoices(response.data || []);
    } catch (error: any) {
      console.error('❌ Fehler beim Laden der Rechnungen:', error);
      setError('Fehler beim Laden der Rechnungen');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'viewed': return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'sent': return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      case 'overdue': return 'bg-red-500/20 text-red-300 border-red-500/30';
      case 'draft': return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
      default: return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'paid': return 'Bezahlt';
      case 'viewed': return 'Eingesehen';
      case 'sent': return 'Gesendet';
      case 'overdue': return 'Überfällig';
      case 'draft': return 'Entwurf';
      default: return status;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid': return <CheckCircle size={16} />;
      case 'viewed': return <Eye size={16} />;
      case 'sent': return <FileText size={16} />;
      case 'overdue': return <AlertTriangle size={16} />;
      case 'draft': return <Clock size={16} />;
      default: return <FileText size={16} />;
    }
  };

  const handleDownloadInvoice = async (invoice: Invoice) => {
    try {
      // Markiere als angesehen und lade dann herunter
      await api.post(`/invoices/${invoice.id}/mark-viewed`);
      window.open(`/api/v1/invoices/${invoice.id}/download`, '_blank');
    } catch (error) {
      console.error('❌ Fehler beim Herunterladen der Rechnung:', error);
    }
  };

  const handleViewInvoice = async (invoice: Invoice) => {
    try {
      // Markiere als angesehen
      await api.post(`/invoices/${invoice.id}/mark-viewed`);
      
      // Öffne PDF in neuem Tab
      window.open(`/api/v1/invoices/${invoice.id}/download`, '_blank');
    } catch (error) {
      console.error('❌ Fehler beim Ansehen der Rechnung:', error);
    }
  };

  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = invoice.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         invoice.milestone_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         invoice.project_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalAmount = filteredInvoices.reduce((sum, invoice) => sum + invoice.total_amount, 0);
  const paidAmount = filteredInvoices.filter(inv => inv.status === 'paid').reduce((sum, invoice) => sum + invoice.total_amount, 0);
  const outstandingAmount = totalAmount - paidAmount;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#2c3539] to-[#1a1f23] p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                <Receipt className="text-[#ffbd59]" size={32} />
                Rechnungsverwaltung
              </h1>
              <p className="text-gray-400">
                Verwalten Sie alle Ihre Rechnungen an einem Ort
              </p>
            </div>
            <button
              onClick={() => {
                // TODO: Öffne Modal zur Erstellung einer neuen Rechnung
                console.log('Neue Rechnung erstellen');
              }}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#ffbd59] to-[#ffa726] text-[#1a1a2e] font-semibold rounded-lg hover:shadow-lg transition-all duration-200"
            >
              <Plus size={20} />
              Neue Rechnung
            </button>
          </div>

          {/* Statistiken */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-gradient-to-br from-[#1a1a2e]/50 to-[#2c3539]/50 rounded-xl p-6 border border-gray-600/30">
              <div className="flex items-center gap-3 mb-2">
                <Euro className="text-[#ffbd59]" size={24} />
                <span className="text-gray-400 text-sm font-medium">Gesamtsumme</span>
              </div>
              <p className="text-2xl font-bold text-white">
                {totalAmount.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
              </p>
            </div>
            <div className="bg-gradient-to-br from-[#1a1a2e]/50 to-[#2c3539]/50 rounded-xl p-6 border border-gray-600/30">
              <div className="flex items-center gap-3 mb-2">
                <CheckCircle className="text-green-400" size={24} />
                <span className="text-gray-400 text-sm font-medium">Bezahlt</span>
              </div>
              <p className="text-2xl font-bold text-green-400">
                {paidAmount.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
              </p>
            </div>
            <div className="bg-gradient-to-br from-[#1a1a2e]/50 to-[#2c3539]/50 rounded-xl p-6 border border-gray-600/30">
              <div className="flex items-center gap-3 mb-2">
                <Clock className="text-yellow-400" size={24} />
                <span className="text-gray-400 text-sm font-medium">Ausstehend</span>
              </div>
              <p className="text-2xl font-bold text-yellow-400">
                {outstandingAmount.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
              </p>
            </div>
          </div>

          {/* Filter und Suche */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Rechnungen durchsuchen..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-[#1a1a2e]/50 border border-gray-600/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="text-gray-400" size={20} />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-3 bg-[#1a1a2e]/50 border border-gray-600/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent"
              >
                <option value="all">Alle Status</option>
                <option value="draft">Entwurf</option>
                <option value="sent">Gesendet</option>
                <option value="viewed">Eingesehen</option>
                <option value="paid">Bezahlt</option>
                <option value="overdue">Überfällig</option>
              </select>
            </div>
          </div>
        </div>

        {/* Rechnungen Liste */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#ffbd59] mx-auto mb-4"></div>
              <p className="text-gray-400">Lade Rechnungen...</p>
            </div>
          </div>
        ) : error ? (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-6 text-center">
            <AlertTriangle className="text-red-400 mx-auto mb-3" size={48} />
            <p className="text-red-400 font-medium mb-2">Fehler beim Laden</p>
            <p className="text-red-300 text-sm">{error}</p>
            <button
              onClick={loadInvoices}
              className="mt-4 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
            >
              Erneut versuchen
            </button>
          </div>
        ) : filteredInvoices.length === 0 ? (
          <div className="bg-gradient-to-br from-[#1a1a2e]/50 to-[#2c3539]/50 rounded-xl p-12 border border-gray-600/30 text-center">
            <Receipt className="text-gray-500 mx-auto mb-4" size={64} />
            <h3 className="text-xl font-semibold text-white mb-2">Keine Rechnungen gefunden</h3>
            <p className="text-gray-400 mb-6">
              {searchTerm || statusFilter !== 'all' 
                ? 'Keine Rechnungen entsprechen Ihren Filterkriterien.'
                : 'Sie haben noch keine Rechnungen erstellt.'
              }
            </p>
            {(!searchTerm && statusFilter === 'all') && (
              <button
                onClick={() => {
                  // TODO: Öffne Modal zur Erstellung einer neuen Rechnung
                  console.log('Erste Rechnung erstellen');
                }}
                className="px-6 py-3 bg-gradient-to-r from-[#ffbd59] to-[#ffa726] text-[#1a1a2e] font-semibold rounded-lg hover:shadow-lg transition-all duration-200"
              >
                Erste Rechnung erstellen
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredInvoices.map((invoice) => (
              <div key={invoice.id} className="bg-gradient-to-br from-[#1a1a2e]/50 to-[#2c3539]/50 rounded-xl p-6 border border-gray-600/30 hover:border-[#ffbd59]/50 transition-all duration-200">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-3">
                      <div className="flex items-center gap-2">
                        <Receipt className="text-[#ffbd59]" size={20} />
                        <span className="text-white font-semibold text-lg">
                          {invoice.invoice_number}
                        </span>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium border flex items-center gap-1 ${getStatusColor(invoice.status)}`}>
                        {getStatusIcon(invoice.status)}
                        {getStatusLabel(invoice.status)}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Building className="text-gray-400" size={16} />
                        <div>
                          <p className="text-gray-400">Projekt</p>
                          <p className="text-white font-medium">{invoice.project_name}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <FileText className="text-gray-400" size={16} />
                        <div>
                          <p className="text-gray-400">Gewerk</p>
                          <p className="text-white font-medium">{invoice.milestone_title}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="text-gray-400" size={16} />
                        <div>
                          <p className="text-gray-400">Fälligkeitsdatum</p>
                          <p className="text-white font-medium">
                            {new Date(invoice.due_date).toLocaleDateString('de-DE')}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-gray-400 text-sm">Betrag</p>
                      <p className="text-2xl font-bold text-white">
                        {invoice.total_amount.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleViewInvoice(invoice)}
                        className="flex items-center gap-1 px-3 py-2 bg-green-600/20 text-green-400 rounded-lg hover:bg-green-600/30 transition-all duration-200 text-sm font-medium"
                        title="Rechnung ansehen"
                      >
                        <Eye size={16} />
                        Ansehen
                      </button>
                      <button
                        onClick={() => handleDownloadInvoice(invoice)}
                        className="flex items-center gap-1 px-3 py-2 bg-blue-600/20 text-blue-400 rounded-lg hover:bg-blue-600/30 transition-all duration-200 text-sm font-medium"
                        title="Rechnung herunterladen"
                      >
                        <Download size={16} />
                        Download
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Invoice Modal */}
        {showInvoiceModal && selectedMilestone && (
          <InvoiceModal
            isOpen={showInvoiceModal}
            onClose={() => {
              setShowInvoiceModal(false);
              setSelectedMilestone(null);
            }}
            milestoneId={selectedMilestone.id}
            milestoneTitle={selectedMilestone.title}
            contractValue={selectedMilestone.budget || 0}
            onInvoiceSubmitted={() => {
              setShowInvoiceModal(false);
              setSelectedMilestone(null);
              loadInvoices(); // Lade Rechnungen neu
            }}
          />
        )}
      </div>
    </div>
  );
} 