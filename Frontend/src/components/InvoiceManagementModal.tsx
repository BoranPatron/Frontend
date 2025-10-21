import React, { useState, useEffect } from 'react';
import { 
  X, 
  Receipt, 
  Plus, 
  Search, 
  Filter, 
  Calendar, 
  Euro, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  Download,
  Eye,
  FileText,
  Star,
  Building,
  ChevronDown,
  SortAsc,
  SortDesc
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/api';
import InvoiceModal from './InvoiceModal';

interface Invoice {
  id: number;
  invoice_number: string;
  milestone_id: number;
  milestone_title: string;
  project_name: string;
  total_amount: number;
  currency: string;
  status: string;
  created_at: string;
  due_date: string;
  paid_at?: string;
}

interface InvoiceManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const InvoiceManagementModal: React.FC<InvoiceManagementModalProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showFilters, setShowFilters] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [selectedMilestone, setSelectedMilestone] = useState<any>(null);

  useEffect(() => {
    if (isOpen) {
      loadInvoices();
    }
  }, [isOpen]);

  const loadInvoices = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.get('/api/v1/invoices/my-invoices');
      setInvoices(response.data || []);
      } catch (err: any) {
      console.error('❌ Fehler beim Laden der Rechnungen:', err);
      setError('Fehler beim Laden der Rechnungen.');
    } finally {
      setLoading(false);
    }
  };

  const statusOptions = [
    { value: 'all', label: 'Alle Status' },
    { value: 'draft', label: 'Entwurf' },
    { value: 'sent', label: 'Gesendet' },
    { value: 'viewed', label: 'Eingesehen' },
    { value: 'paid', label: 'Bezahlt' },
    { value: 'overdue', label: 'Überfällig' }
  ];

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'draft': { color: 'bg-gray-500/20 text-gray-300 border-gray-500/30', label: 'Entwurf' },
      'sent': { color: 'bg-blue-500/20 text-blue-300 border-blue-500/30', label: 'Gesendet' },
      'viewed': { color: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30', label: 'Eingesehen' },
      'paid': { color: 'bg-green-500/20 text-green-300 border-green-500/30', label: 'Bezahlt' },
      'overdue': { color: 'bg-red-500/20 text-red-300 border-red-500/30', label: 'Überfällig' }
    };
    
    const config = statusConfig[status] || statusConfig['draft'];
    return (
      <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${config.color}`}>
        {status === 'paid' && <CheckCircle size={12} />}
        {status === 'overdue' && <AlertTriangle size={12} />}
        {status === 'viewed' && <Eye size={12} />}
        {status === 'sent' && <FileText size={12} />}
        {status === 'draft' && <Clock size={12} />}
        <span>{config.label}</span>
      </div>
    );
  };

  const formatCurrency = (amount: number, currency: string = 'EUR') => {
    return new Intl.NumberFormat('de-DE', { 
      style: 'currency', 
      currency 
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const filteredAndSortedInvoices = invoices
    .filter(invoice => {
      const matchesSearch = invoice.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           invoice.project_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           invoice.milestone_title.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = selectedStatus === 'all' || invoice.status === selectedStatus;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortBy) {
        case 'created_at':
          aValue = new Date(a.created_at);
          bValue = new Date(b.created_at);
          break;
        case 'due_date':
          aValue = new Date(a.due_date);
          bValue = new Date(b.due_date);
          break;
        case 'total_amount':
          aValue = a.total_amount;
          bValue = b.total_amount;
          break;
        case 'invoice_number':
          aValue = a.invoice_number.toLowerCase();
          bValue = b.invoice_number.toLowerCase();
          break;
        default:
          return 0;
      }
      
      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

  const handleCreateInvoice = (milestone: any) => {
    setSelectedMilestone(milestone);
    setShowInvoiceModal(true);
  };

  const handleInvoiceCreated = () => {
    setShowInvoiceModal(false);
    setSelectedMilestone(null);
    loadInvoices(); // Lade Rechnungen neu
  };

  const handleViewInvoice = async (invoice: Invoice) => {
    try {
      // Markiere als angesehen
      await api.post(`/api/v1/invoices/${invoice.id}/mark-viewed`);
      
      // Öffne PDF in neuem Tab
      window.open(`/api/v1/invoices/${invoice.id}/download`, '_blank');
    } catch (error) {
      console.error('❌ Fehler beim Ansehen der Rechnung:', error);
    }
  };

  const handleDownloadInvoice = async (invoice: Invoice) => {
    try {
      // Markiere als angesehen und lade dann herunter
      await api.post(`/api/v1/invoices/${invoice.id}/mark-viewed`);
      window.open(`/api/v1/invoices/${invoice.id}/download`, '_blank');
    } catch (error) {
      console.error('❌ Fehler beim Herunterladen der Rechnung:', error);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-[#2c3539] rounded-2xl shadow-2xl border border-white/20 max-w-7xl w-full max-h-[90vh] overflow-hidden">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#ffbd59]"></div>
            <span className="ml-3 text-white">Lade Rechnungen...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-[#2c3539] rounded-2xl shadow-2xl border border-white/20 max-w-7xl w-full max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-[#51636f] to-[#3a4a57] rounded-xl">
                <Receipt size={24} className="text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Rechnungsmanagement</h2>
                <p className="text-sm text-gray-400">
                  {filteredAndSortedInvoices.length} von {invoices.length} Rechnungen
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-4 py-2 bg-[#51636f] text-white rounded-lg hover:bg-[#3a4a57] transition-colors"
              >
                <Filter size={16} />
                Filter
                <ChevronDown size={16} className={`transform transition-transform ${showFilters ? 'rotate-180' : ''}`} />
              </button>
              
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X size={24} className="text-gray-400" />
              </button>
            </div>
          </div>

          {/* Filter & Search */}
          {showFilters && (
            <div className="p-6 border-b border-white/10 bg-white/5">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Suche */}
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Rechnungsnummer, Projekt oder Gewerk suchen..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent"
                  />
                </div>

                {/* Status Filter */}
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent"
                >
                  {statusOptions.map(option => (
                    <option key={option.value} value={option.value} className="bg-[#2c3539] text-white">
                      {option.label}
                    </option>
                  ))}
                </select>

                {/* Sortierung */}
                <div className="flex gap-2">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="flex-1 px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent"
                  >
                    <option value="created_at" className="bg-[#2c3539] text-white">Erstellungsdatum</option>
                    <option value="due_date" className="bg-[#2c3539] text-white">Fälligkeitsdatum</option>
                    <option value="total_amount" className="bg-[#2c3539] text-white">Betrag</option>
                    <option value="invoice_number" className="bg-[#2c3539] text-white">Rechnungsnummer</option>
                  </select>
                  
                  <button
                    onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                    className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white hover:bg-white/20 transition-colors"
                  >
                    {sortOrder === 'asc' ? <SortAsc size={16} /> : <SortDesc size={16} />}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Content */}
          <div className="p-6">
            {error ? (
              <div className="text-center py-8">
                <div className="text-red-400 mb-2">❌ {error}</div>
                <button
                  onClick={loadInvoices}
                  className="px-4 py-2 bg-[#ffbd59] text-[#1a1a2e] rounded-lg hover:bg-[#ffa726] transition-colors text-sm font-medium"
                >
                  Erneut versuchen
                </button>
              </div>
            ) : filteredAndSortedInvoices.length === 0 ? (
              <div className="text-center py-12">
                <Receipt size={48} className="mx-auto mb-4 text-gray-400 opacity-50" />
                <h3 className="text-lg font-semibold text-white mb-2">Keine Rechnungen</h3>
                <p className="text-gray-400">
                  {searchTerm || selectedStatus !== 'all' 
                    ? 'Keine Rechnungen entsprechen den aktuellen Filterkriterien.'
                    : 'Erstellen Sie Ihre erste Rechnung für abgeschlossene Gewerke.'
                  }
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredAndSortedInvoices.map((invoice) => (
                  <div
                    key={invoice.id}
                    className="bg-white/5 rounded-lg border border-white/10 hover:border-[#ffbd59]/30 transition-all duration-200 hover:shadow-lg group"
                  >
                    {/* Card Header */}
                    <div className="p-4 border-b border-white/10">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Receipt size={16} className="text-[#ffbd59]" />
                          <h3 className="font-semibold text-white group-hover:text-[#ffbd59] transition-colors">
                            {invoice.invoice_number}
                          </h3>
                        </div>
                        {getStatusBadge(invoice.status)}
                      </div>
                      
                      <p className="text-sm text-gray-400 mb-3">
                        {invoice.milestone_title}
                      </p>
                      
                      <div className="text-xs text-gray-500">
                        Projekt: {invoice.project_name}
                      </div>
                    </div>

                    {/* Card Body */}
                    <div className="p-4 space-y-3">
                      {/* Betrag */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          <Euro size={14} className="text-[#ffbd59]" />
                          <span className="font-semibold text-[#ffbd59]">
                            {formatCurrency(invoice.total_amount, invoice.currency)}
                          </span>
                        </div>
                      </div>

                      {/* Datum */}
                      <div className="flex items-center justify-between text-sm text-gray-400">
                        <div className="flex items-center gap-1">
                          <Calendar size={14} />
                          <span>Erstellt: {formatDate(invoice.created_at)}</span>
                        </div>
                        
                        <div className="flex items-center gap-1">
                          <Clock size={14} />
                          <span>Fällig: {formatDate(invoice.due_date)}</span>
                        </div>
                      </div>

                      {/* Bezahlt am */}
                      {invoice.paid_at && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-400">Bezahlt am:</span>
                          <span className="text-green-400 font-medium">
                            {formatDate(invoice.paid_at)}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Card Actions */}
                    <div className="p-4 border-t border-white/10">
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => handleViewInvoice(invoice)}
                          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-[#51636f] text-white rounded-lg hover:bg-[#3a4a57] transition-colors text-sm"
                          title="Rechnung ansehen"
                        >
                          <Eye size={14} />
                          Ansehen
                        </button>
                        
                        <button 
                          onClick={() => handleDownloadInvoice(invoice)}
                          className="flex items-center justify-center gap-2 px-3 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors text-sm"
                          title="Rechnung herunterladen"
                        >
                          <Download size={14} />
                        </button>
                        
                        <button className="flex items-center justify-center gap-2 px-3 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors text-sm">
                          <FileText size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* InvoiceModal für neue Rechnungen */}
      {showInvoiceModal && selectedMilestone && (
        <InvoiceModal
          isOpen={showInvoiceModal}
          onClose={() => setShowInvoiceModal(false)}
          milestoneId={selectedMilestone.id}
          milestoneTitle={selectedMilestone.title}
          onInvoiceCreated={handleInvoiceCreated}
        />
      )}
    </>
  );
};

export default InvoiceManagementModal; 
