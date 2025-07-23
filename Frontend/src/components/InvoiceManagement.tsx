import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Plus, 
  Eye, 
  Download, 
  Send, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  X, 
  Euro, 
  Calendar, 
  User, 
  Building, 
  Mail, 
  Phone,
  Edit,
  Trash2,
  Filter,
  Search,
  RefreshCw,
  PaperclipIcon,
  DollarSign,
  TrendingUp,
  BarChart3,
  Copy,
  Archive,
  Settings,
  FileCheck,
  CreditCard,
  Zap,
  Target,
  Users,
  Printer,
  Share2,
  Bookmark,
  AlertCircle,
  CheckSquare,
  Square,
  MoreHorizontal
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface Invoice {
  id: number;
  invoice_number: string;
  project_name: string;
  project_id: number;
  trade_title: string;
  trade_id: number;
  client_name: string;
  client_email: string;
  client_phone?: string;
  amount: number;
  currency: string;
  tax_rate: number;
  tax_amount: number;
  total_amount: number;
  status: 'draft' | 'sent' | 'viewed' | 'paid' | 'overdue' | 'cancelled';
  created_at: string;
  sent_at?: string;
  due_date: string;
  paid_at?: string;
  description: string;
  line_items: InvoiceLineItem[];
  payment_terms: string;
  notes?: string;
  pdf_path?: string;
}

interface InvoiceLineItem {
  id: number;
  description: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

interface InvoiceStats {
  total_invoices: number;
  total_revenue: number;
  pending_amount: number;
  overdue_amount: number;
  paid_invoices: number;
  draft_invoices: number;
  average_payment_time: number;
}

interface InvoiceTemplate {
  id: number;
  name: string;
  description: string;
  line_items: InvoiceLineItem[];
  payment_terms: string;
  notes?: string;
  is_default: boolean;
  created_at: string;
}

interface BulkAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  action: (invoices: Invoice[]) => void;
  requiresConfirmation?: boolean;
}

interface InvoiceReport {
  id: string;
  name: string;
  description: string;
  type: 'summary' | 'detailed' | 'aging' | 'tax' | 'custom';
  period: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'custom';
  format: 'pdf' | 'excel' | 'csv';
}

interface PaymentReminder {
  id: number;
  invoice_id: number;
  type: 'friendly' | 'first_reminder' | 'second_reminder' | 'final_notice';
  sent_at: string;
  status: 'sent' | 'opened' | 'clicked';
}

export default function InvoiceManagement() {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [stats, setStats] = useState<InvoiceStats>({
    total_invoices: 0,
    total_revenue: 0,
    pending_amount: 0,
    overdue_amount: 0,
    paid_invoices: 0,
    draft_invoices: 0,
    average_payment_time: 0
  });
  
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  
  // Filter & Search
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'amount' | 'status'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Extended state for new features
  const [templates, setTemplates] = useState<InvoiceTemplate[]>([]);
  const [selectedInvoices, setSelectedInvoices] = useState<number[]>([]);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [showReportsModal, setShowReportsModal] = useState(false);
  const [showTemplatesModal, setShowTemplatesModal] = useState(false);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<InvoiceTemplate | null>(null);
  const [advancedFilters, setAdvancedFilters] = useState({
    client: '',
    project: '',
    amountMin: '',
    amountMax: '',
    dateFrom: '',
    dateTo: '',
    tags: [] as string[]
  });
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [reminderHistory, setReminderHistory] = useState<PaymentReminder[]>([]);

  // Mock-Daten laden (später durch echte API ersetzen)
  useEffect(() => {
    loadInvoices();
    loadStats();
    loadTemplates();
  }, []);

  const loadInvoices = async () => {
    setLoading(true);
    try {
      // TODO: Echte API-Integration
      const mockInvoices: Invoice[] = [
        {
          id: 1,
          invoice_number: 'INV-2024-001',
          project_name: 'Neubau Einfamilienhaus München',
          project_id: 1,
          trade_title: 'Elektroinstallation',
          trade_id: 1,
          client_name: 'Max Mustermann',
          client_email: 'max@mustermann.de',
          client_phone: '+49 89 12345678',
          amount: 5500.00,
          currency: 'EUR',
          tax_rate: 19,
          tax_amount: 1045.00,
          total_amount: 6545.00,
          status: 'sent',
          created_at: '2024-01-15T10:30:00Z',
          sent_at: '2024-01-16T09:00:00Z',
          due_date: '2024-02-15T23:59:59Z',
          description: 'Komplette Elektroinstallation für Neubau',
          line_items: [
            {
              id: 1,
              description: 'Elektroinstallation Erdgeschoss',
              quantity: 1,
              unit_price: 2500.00,
              total_price: 2500.00
            },
            {
              id: 2,
              description: 'Elektroinstallation Obergeschoss',
              quantity: 1,
              unit_price: 2000.00,
              total_price: 2000.00
            },
            {
              id: 3,
              description: 'Sicherungskasten und Anschlüsse',
              quantity: 1,
              unit_price: 1000.00,
              total_price: 1000.00
            }
          ],
          payment_terms: '30 Tage netto',
          notes: 'Zahlung nach Abnahme der Arbeiten'
        },
        {
          id: 2,
          invoice_number: 'INV-2024-002',
          project_name: 'Sanierung Bürogebäude Berlin',
          project_id: 2,
          trade_title: 'Heizungsinstallation',
          trade_id: 2,
          client_name: 'Schmidt GmbH',
          client_email: 'info@schmidt-bau.de',
          amount: 8200.00,
          currency: 'EUR',
          tax_rate: 19,
          tax_amount: 1558.00,
          total_amount: 9758.00,
          status: 'paid',
          created_at: '2024-01-10T14:20:00Z',
          sent_at: '2024-01-11T08:30:00Z',
          due_date: '2024-02-10T23:59:59Z',
          paid_at: '2024-01-25T16:45:00Z',
          description: 'Heizungsmodernisierung mit neuer Wärmepumpe',
          line_items: [
            {
              id: 4,
              description: 'Wärmepumpe Installation',
              quantity: 1,
              unit_price: 6000.00,
              total_price: 6000.00
            },
            {
              id: 5,
              description: 'Rohrleitungen und Anschlüsse',
              quantity: 1,
              unit_price: 1500.00,
              total_price: 1500.00
            },
            {
              id: 6,
              description: 'Inbetriebnahme und Konfiguration',
              quantity: 1,
              unit_price: 700.00,
              total_price: 700.00
            }
          ],
          payment_terms: '14 Tage netto',
          notes: 'Rechnung bereits beglichen'
        },
        {
          id: 3,
          invoice_number: 'INV-2024-003',
          project_name: 'Dachsanierung Hamburg',
          project_id: 3,
          trade_title: 'Dachdeckerarbeiten',
          trade_id: 3,
          client_name: 'Immobilien Nord AG',
          client_email: 'projekte@immo-nord.de',
          amount: 12500.00,
          currency: 'EUR',
          tax_rate: 19,
          tax_amount: 2375.00,
          total_amount: 14875.00,
          status: 'overdue',
          created_at: '2023-12-20T11:15:00Z',
          sent_at: '2023-12-21T10:00:00Z',
          due_date: '2024-01-20T23:59:59Z',
          description: 'Komplette Dachsanierung mit neuer Eindeckung',
          line_items: [
            {
              id: 7,
              description: 'Dachziegel und Material',
              quantity: 1,
              unit_price: 8000.00,
              total_price: 8000.00
            },
            {
              id: 8,
              description: 'Arbeitszeit Dachdeckung',
              quantity: 40,
              unit_price: 85.00,
              total_price: 3400.00
            },
            {
              id: 9,
              description: 'Dachrinnen und Fallrohre',
              quantity: 1,
              unit_price: 1100.00,
              total_price: 1100.00
            }
          ],
          payment_terms: '30 Tage netto',
          notes: 'Mahnung bereits versandt'
        }
      ];
      
      setInvoices(mockInvoices);
      console.log('📋 Rechnungen geladen:', mockInvoices.length);
    } catch (error) {
      console.error('❌ Fehler beim Laden der Rechnungen:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      // TODO: Echte API-Integration
      const mockStats: InvoiceStats = {
        total_invoices: 3,
        total_revenue: 30958.00,
        pending_amount: 6545.00,
        overdue_amount: 14875.00,
        paid_invoices: 1,
        draft_invoices: 0,
        average_payment_time: 14
      };
      
      setStats(mockStats);
    } catch (error) {
      console.error('❌ Fehler beim Laden der Statistiken:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'sent': return 'bg-blue-100 text-blue-800';
      case 'viewed': return 'bg-purple-100 text-purple-800';
      case 'paid': return 'bg-green-100 text-green-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'draft': return 'Entwurf';
      case 'sent': return 'Versendet';
      case 'viewed': return 'Angesehen';
      case 'paid': return 'Bezahlt';
      case 'overdue': return 'Überfällig';
      case 'cancelled': return 'Storniert';
      default: return status;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft': return <Edit size={16} />;
      case 'sent': return <Send size={16} />;
      case 'viewed': return <Eye size={16} />;
      case 'paid': return <CheckCircle size={16} />;
      case 'overdue': return <AlertTriangle size={16} />;
      case 'cancelled': return <X size={16} />;
      default: return <Clock size={16} />;
    }
  };

  // Load templates
  const loadTemplates = async () => {
    try {
      // TODO: Echte API-Integration
      const mockTemplates: InvoiceTemplate[] = [
        {
          id: 1,
          name: "Standard Dienstleistung",
          description: "Standardvorlage für Dienstleistungsrechnungen",
          line_items: [
            {
              id: 1,
              description: "Dienstleistung",
              quantity: 1,
              unit_price: 0,
              total_price: 0
            }
          ],
          payment_terms: "30 Tage netto",
          notes: "Vielen Dank für Ihr Vertrauen",
          is_default: true,
          created_at: new Date().toISOString()
        },
        {
          id: 2,
          name: "Wartungsvertrag",
          description: "Vorlage für wiederkehrende Wartungsarbeiten",
          line_items: [
            {
              id: 2,
              description: "Monatliche Wartung",
              quantity: 1,
              unit_price: 0,
              total_price: 0
            }
          ],
          payment_terms: "14 Tage netto",
          notes: "Regelmäßige Wartung gemäß Vertrag",
          is_default: false,
          created_at: new Date().toISOString()
        }
      ];
      setTemplates(mockTemplates);
    } catch (error) {
      console.error('❌ Fehler beim Laden der Vorlagen:', error);
    }
  };

  // Bulk actions
  const bulkActions: BulkAction[] = [
    {
      id: 'send',
      label: 'Versenden',
      icon: <Send size={16} />,
      action: (invoices) => handleBulkSend(invoices),
      requiresConfirmation: true
    },
    {
      id: 'mark_paid',
      label: 'Als bezahlt markieren',
      icon: <CheckCircle size={16} />,
      action: (invoices) => handleBulkMarkPaid(invoices),
      requiresConfirmation: true
    },
    {
      id: 'download',
      label: 'PDF herunterladen',
      icon: <Download size={16} />,
      action: (invoices) => handleBulkDownload(invoices)
    },
    {
      id: 'archive',
      label: 'Archivieren',
      icon: <Archive size={16} />,
      action: (invoices) => handleBulkArchive(invoices),
      requiresConfirmation: true
    },
    {
      id: 'delete',
      label: 'Löschen',
      icon: <Trash2 size={16} />,
      action: (invoices) => handleBulkDelete(invoices),
      requiresConfirmation: true
    }
  ];

  // Bulk action handlers
  const handleBulkSend = async (invoices: Invoice[]) => {
    console.log('📧 Bulk-Versand für', invoices.length, 'Rechnungen');
    // TODO: Implementierung
  };

  const handleBulkMarkPaid = async (invoices: Invoice[]) => {
    console.log('✅ Bulk-Markierung als bezahlt für', invoices.length, 'Rechnungen');
    // TODO: Implementierung
  };

  const handleBulkDownload = async (invoices: Invoice[]) => {
    console.log('📄 Bulk-Download für', invoices.length, 'Rechnungen');
    // TODO: Implementierung
  };

  const handleBulkArchive = async (invoices: Invoice[]) => {
    console.log('📦 Bulk-Archivierung für', invoices.length, 'Rechnungen');
    // TODO: Implementierung
  };

  const handleBulkDelete = async (invoices: Invoice[]) => {
    console.log('🗑️ Bulk-Löschung für', invoices.length, 'Rechnungen');
    // TODO: Implementierung
  };

  // Invoice selection handlers
  const handleSelectInvoice = (invoiceId: number) => {
    setSelectedInvoices(prev => 
      prev.includes(invoiceId) 
        ? prev.filter(id => id !== invoiceId)
        : [...prev, invoiceId]
    );
  };

  const handleSelectAllInvoices = () => {
    if (selectedInvoices.length === enhancedFilteredInvoices.length) {
      setSelectedInvoices([]);
    } else {
      setSelectedInvoices(enhancedFilteredInvoices.map(invoice => invoice.id));
    }
  };

  // Payment reminder system
  const handleSendReminder = async (invoice: Invoice, type: 'friendly' | 'first_reminder' | 'second_reminder' | 'final_notice') => {
    try {
      console.log(`📩 Sende ${type} Mahnung für Rechnung ${invoice.invoice_number}`);
      // TODO: API-Integration für Mahnungen
      
      const newReminder: PaymentReminder = {
        id: Date.now(),
        invoice_id: invoice.id,
        type,
        sent_at: new Date().toISOString(),
        status: 'sent'
      };
      
      setReminderHistory(prev => [...prev, newReminder]);
      alert(`${type} Mahnung wurde versendet`);
    } catch (error) {
      console.error('❌ Fehler beim Versenden der Mahnung:', error);
    }
  };

  // Template management
  const handleCreateFromTemplate = (template: InvoiceTemplate) => {
    console.log('📋 Erstelle Rechnung aus Vorlage:', template.name);
    setSelectedTemplate(template);
    setShowCreateModal(true);
    setShowTemplatesModal(false);
  };

  const handleSaveAsTemplate = (invoice: Invoice) => {
    console.log('💾 Speichere Rechnung als Vorlage:', invoice.invoice_number);
    // TODO: Implementierung
  };

  // Advanced filtering
  const applyAdvancedFilters = (invoice: Invoice) => {
    if (advancedFilters.client && !invoice.client_name.toLowerCase().includes(advancedFilters.client.toLowerCase())) return false;
    if (advancedFilters.project && !invoice.project_name.toLowerCase().includes(advancedFilters.project.toLowerCase())) return false;
    if (advancedFilters.amountMin && invoice.total_amount < parseFloat(advancedFilters.amountMin)) return false;
    if (advancedFilters.amountMax && invoice.total_amount > parseFloat(advancedFilters.amountMax)) return false;
    if (advancedFilters.dateFrom && new Date(invoice.created_at) < new Date(advancedFilters.dateFrom)) return false;
    if (advancedFilters.dateTo && new Date(invoice.created_at) > new Date(advancedFilters.dateTo)) return false;
    return true;
  };

  // Enhanced filtered invoices with advanced filters
  const enhancedFilteredInvoices = invoices
    .filter(invoice => {
      // Basic filters
      if (statusFilter !== 'all' && invoice.status !== statusFilter) return false;
      if (searchTerm && !invoice.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) &&
          !invoice.project_name.toLowerCase().includes(searchTerm.toLowerCase()) &&
          !invoice.client_name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
      
      // Advanced filters
      if (!applyAdvancedFilters(invoice)) return false;
      
      return true;
    })
    .sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'date':
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
        case 'amount':
          comparison = a.total_amount - b.total_amount;
          break;
        case 'status':
          comparison = a.status.localeCompare(b.status);
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  // Report generation
  const handleGenerateReport = async (report: InvoiceReport) => {
    console.log('📊 Generiere Report:', report.name);
    // TODO: Report-Generation implementieren
    alert(`Report "${report.name}" wird generiert`);
  };

  const handleCreateInvoice = () => {
    setShowCreateModal(true);
  };

  const handleViewInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setShowDetailsModal(true);
  };

  const handleDownloadPDF = async (invoice: Invoice) => {
    try {
      console.log('📄 PDF-Download für Rechnung:', invoice.invoice_number);
      // TODO: PDF-Generation implementieren
      alert(`PDF-Download für ${invoice.invoice_number} wird implementiert`);
    } catch (error) {
      console.error('❌ Fehler beim PDF-Download:', error);
    }
  };

  const handleSendInvoice = async (invoice: Invoice) => {
    try {
      console.log('📧 Rechnung versenden:', invoice.invoice_number);
      // TODO: E-Mail-Versand implementieren
      alert(`E-Mail-Versand für ${invoice.invoice_number} wird implementiert`);
    } catch (error) {
      console.error('❌ Fehler beim Versenden:', error);
    }
  };

  // Update bulk actions visibility
  useEffect(() => {
    setShowBulkActions(selectedInvoices.length > 0);
  }, [selectedInvoices]);

  return (
    <div className="space-y-6">
      {/* Header mit Statistiken */}
      <div className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">Rechnungsmanagement</h1>
            <p className="text-gray-300">Verwalten Sie Ihre Rechnungen und Zahlungen</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowTemplatesModal(true)}
              className="bg-white/10 border border-white/20 text-white px-4 py-2 rounded-lg font-medium hover:bg-white/20 transition-all duration-300 flex items-center gap-2"
            >
              <FileCheck size={16} />
              Vorlagen
            </button>
            <button
              onClick={() => setShowReportsModal(true)}
              className="bg-white/10 border border-white/20 text-white px-4 py-2 rounded-lg font-medium hover:bg-white/20 transition-all duration-300 flex items-center gap-2"
            >
              <BarChart3 size={16} />
              Reports
            </button>
            <button
              onClick={handleCreateInvoice}
              className="bg-gradient-to-r from-[#ffbd59] to-[#ffa726] text-[#2c3539] px-4 py-2 rounded-lg font-medium hover:from-[#ffa726] hover:to-[#ff9800] transition-all duration-300 flex items-center gap-2"
            >
              <Plus size={16} />
              Neue Rechnung
            </button>
          </div>
        </div>

        {/* Statistik-Karten */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white/10 backdrop-blur-sm p-4 rounded-lg border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[#ffbd59]">Gesamt-Umsatz</p>
                <p className="text-2xl font-bold text-white">
                  {stats.total_revenue.toLocaleString('de-DE')} €
                </p>
              </div>
              <div className="w-10 h-10 bg-[#ffbd59] rounded-lg flex items-center justify-center">
                <TrendingUp size={20} className="text-[#2c3539]" />
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-sm p-4 rounded-lg border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-400">Bezahlte Rechnungen</p>
                <p className="text-2xl font-bold text-white">{stats.paid_invoices}</p>
              </div>
              <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                <CheckCircle size={20} className="text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-sm p-4 rounded-lg border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-yellow-400">Ausstehend</p>
                <p className="text-2xl font-bold text-white">
                  {stats.pending_amount.toLocaleString('de-DE')} €
                </p>
              </div>
              <div className="w-10 h-10 bg-yellow-500 rounded-lg flex items-center justify-center">
                <Clock size={20} className="text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-sm p-4 rounded-lg border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-400">Überfällig</p>
                <p className="text-2xl font-bold text-white">
                  {stats.overdue_amount.toLocaleString('de-DE')} €
                </p>
              </div>
              <div className="w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center">
                <AlertTriangle size={20} className="text-white" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Erweiterte Filter und Suche */}
      <div className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 p-4">
        <div className="flex flex-col gap-4">
          {/* Erste Reihe: Basis-Filter */}
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechnungen suchen..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-300 focus:ring-2 focus:ring-[#ffbd59] focus:border-[#ffbd59]"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:ring-2 focus:ring-[#ffbd59] focus:border-[#ffbd59]"
              >
                <option value="all" className="bg-[#2c3539] text-white">Alle Status</option>
                <option value="draft" className="bg-[#2c3539] text-white">Entwurf</option>
                <option value="sent" className="bg-[#2c3539] text-white">Versendet</option>
                <option value="viewed" className="bg-[#2c3539] text-white">Angesehen</option>
                <option value="paid" className="bg-[#2c3539] text-white">Bezahlt</option>
                <option value="overdue" className="bg-[#2c3539] text-white">Überfällig</option>
                <option value="cancelled" className="bg-[#2c3539] text-white">Storniert</option>
              </select>

              <button
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className={`px-3 py-2 border border-white/20 rounded-lg text-white transition-colors flex items-center gap-2 ${
                  showAdvancedFilters ? 'bg-[#ffbd59] text-[#2c3539]' : 'bg-white/10 hover:bg-white/20'
                }`}
              >
                <Filter size={16} />
                Erweitert
              </button>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'date' | 'amount' | 'status')}
                className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:ring-2 focus:ring-[#ffbd59] focus:border-[#ffbd59]"
              >
                <option value="date" className="bg-[#2c3539] text-white">Nach Datum</option>
                <option value="amount" className="bg-[#2c3539] text-white">Nach Betrag</option>
                <option value="status" className="bg-[#2c3539] text-white">Nach Status</option>
              </select>

              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white hover:bg-white/20 transition-colors"
              >
                {sortOrder === 'asc' ? '↑' : '↓'}
              </button>

              <button
                onClick={loadInvoices}
                disabled={loading}
                className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white hover:bg-white/20 transition-colors disabled:opacity-50"
              >
                <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
              </button>
            </div>
          </div>

          {/* Erweiterte Filter (ausklappbar) */}
          {showAdvancedFilters && (
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 p-4 bg-white/5 rounded-lg border border-white/10">
              <input
                type="text"
                placeholder="Kunde"
                value={advancedFilters.client}
                onChange={(e) => setAdvancedFilters(prev => ({ ...prev, client: e.target.value }))}
                className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-300 focus:ring-2 focus:ring-[#ffbd59] focus:border-[#ffbd59]"
              />
              <input
                type="text"
                placeholder="Projekt"
                value={advancedFilters.project}
                onChange={(e) => setAdvancedFilters(prev => ({ ...prev, project: e.target.value }))}
                className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-300 focus:ring-2 focus:ring-[#ffbd59] focus:border-[#ffbd59]"
              />
              <input
                type="number"
                placeholder="Min. Betrag"
                value={advancedFilters.amountMin}
                onChange={(e) => setAdvancedFilters(prev => ({ ...prev, amountMin: e.target.value }))}
                className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-300 focus:ring-2 focus:ring-[#ffbd59] focus:border-[#ffbd59]"
              />
              <input
                type="number"
                placeholder="Max. Betrag"
                value={advancedFilters.amountMax}
                onChange={(e) => setAdvancedFilters(prev => ({ ...prev, amountMax: e.target.value }))}
                className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-300 focus:ring-2 focus:ring-[#ffbd59] focus:border-[#ffbd59]"
              />
              <input
                type="date"
                placeholder="Von Datum"
                value={advancedFilters.dateFrom}
                onChange={(e) => setAdvancedFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
                className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:ring-2 focus:ring-[#ffbd59] focus:border-[#ffbd59]"
              />
              <input
                type="date"
                placeholder="Bis Datum"
                value={advancedFilters.dateTo}
                onChange={(e) => setAdvancedFilters(prev => ({ ...prev, dateTo: e.target.value }))}
                className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:ring-2 focus:ring-[#ffbd59] focus:border-[#ffbd59]"
              />
            </div>
          )}
        </div>
      </div>

      {/* Bulk-Aktionen Bar */}
      {showBulkActions && (
        <div className="bg-[#ffbd59] rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-[#2c3539] font-medium">
              {selectedInvoices.length} Rechnung(en) ausgewählt
            </span>
            <button
              onClick={() => setSelectedInvoices([])}
              className="text-[#2c3539] hover:text-red-600 transition-colors"
            >
              <X size={16} />
            </button>
          </div>
          <div className="flex items-center gap-2">
            {bulkActions.map((action) => (
              <button
                key={action.id}
                onClick={() => {
                  const selectedInvoiceObjects = enhancedFilteredInvoices.filter(inv => selectedInvoices.includes(inv.id));
                  if (action.requiresConfirmation) {
                    if (confirm(`Möchten Sie diese Aktion für ${selectedInvoices.length} Rechnung(en) ausführen?`)) {
                      action.action(selectedInvoiceObjects);
                    }
                  } else {
                    action.action(selectedInvoiceObjects);
                  }
                }}
                className="px-3 py-2 bg-white/20 text-[#2c3539] rounded-lg hover:bg-white/30 transition-colors flex items-center gap-2 text-sm font-medium"
              >
                {action.icon}
                {action.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Rechnungsliste */}
      <div className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20">
        <div className="p-4 border-b border-white/20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-semibold text-white">
              Rechnungen ({enhancedFilteredInvoices.length})
            </h2>
            {enhancedFilteredInvoices.length > 0 && (
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedInvoices.length === enhancedFilteredInvoices.length}
                  onChange={handleSelectAllInvoices}
                  className="w-4 h-4 text-[#ffbd59] bg-white/10 border-white/20 rounded focus:ring-[#ffbd59] focus:ring-2"
                />
                <span className="text-sm text-gray-300">Alle auswählen</span>
              </label>
            )}
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#ffbd59] mx-auto"></div>
            <p className="mt-2 text-gray-300">Lade Rechnungen...</p>
          </div>
        ) : enhancedFilteredInvoices.length === 0 ? (
          <div className="p-8 text-center">
            <FileText size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-gray-300">Keine Rechnungen gefunden</p>
            <button
              onClick={handleCreateInvoice}
              className="mt-4 bg-gradient-to-r from-[#ffbd59] to-[#ffa726] text-[#2c3539] px-4 py-2 rounded-lg hover:from-[#ffa726] hover:to-[#ff9800] transition-colors"
            >
              Erste Rechnung erstellen
            </button>
          </div>
        ) : (
          <div className="divide-y divide-white/10">
            {enhancedFilteredInvoices.map((invoice) => (
              <div key={invoice.id} className="p-4 hover:bg-white/5 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <input
                      type="checkbox"
                      checked={selectedInvoices.includes(invoice.id)}
                      onChange={() => handleSelectInvoice(invoice.id)}
                      className="w-4 h-4 text-[#ffbd59] bg-white/10 border-white/20 rounded focus:ring-[#ffbd59] focus:ring-2"
                    />
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-white">{invoice.invoice_number}</h3>
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(invoice.status)}`}>
                          {getStatusIcon(invoice.status)}
                          {getStatusLabel(invoice.status)}
                        </span>
                        {invoice.status === 'overdue' && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            <AlertCircle size={12} />
                            Mahnung fällig
                          </span>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-300">
                        <div>
                          <p className="font-medium text-white">{invoice.project_name}</p>
                          <p>{invoice.trade_title}</p>
                        </div>
                        <div>
                          <p className="font-medium text-white">{invoice.client_name}</p>
                          <p>{invoice.client_email}</p>
                        </div>
                        <div>
                          <p className="font-medium text-[#ffbd59]">
                            {invoice.total_amount.toLocaleString('de-DE')} €
                          </p>
                          <p>Fällig: {new Date(invoice.due_date).toLocaleDateString('de-DE')}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleViewInvoice(invoice)}
                      className="p-2 text-gray-300 hover:text-[#ffbd59] hover:bg-white/10 rounded-lg transition-colors"
                      title="Details anzeigen"
                    >
                      <Eye size={16} />
                    </button>
                    <button
                      onClick={() => handleDownloadPDF(invoice)}
                      className="p-2 text-gray-300 hover:text-green-400 hover:bg-white/10 rounded-lg transition-colors"
                      title="PDF herunterladen"
                    >
                      <Download size={16} />
                    </button>
                    <button
                      onClick={() => handleSaveAsTemplate(invoice)}
                      className="p-2 text-gray-300 hover:text-blue-400 hover:bg-white/10 rounded-lg transition-colors"
                      title="Als Vorlage speichern"
                    >
                      <Bookmark size={16} />
                    </button>
                    {invoice.status === 'draft' && (
                      <button
                        onClick={() => handleSendInvoice(invoice)}
                        className="p-2 text-gray-300 hover:text-blue-400 hover:bg-white/10 rounded-lg transition-colors"
                        title="Rechnung versenden"
                      >
                        <Send size={16} />
                      </button>
                    )}
                    {invoice.status === 'overdue' && (
                      <div className="relative">
                        <button
                          onClick={() => setShowReminderModal(true)}
                          className="p-2 text-gray-300 hover:text-red-400 hover:bg-white/10 rounded-lg transition-colors"
                          title="Mahnung senden"
                        >
                          <AlertTriangle size={16} />
                        </button>
                      </div>
                    )}
                    <div className="relative">
                      <button
                        className="p-2 text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                        title="Weitere Aktionen"
                      >
                        <MoreHorizontal size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modals für erweiterte Features */}
      
      {/* Vorlagen Modal */}
      {showTemplatesModal && (
        <TemplatesModal
          templates={templates}
          isOpen={showTemplatesModal}
          onClose={() => setShowTemplatesModal(false)}
          onSelectTemplate={handleCreateFromTemplate}
        />
      )}

      {/* Reports Modal */}
      {showReportsModal && (
        <ReportsModal
          isOpen={showReportsModal}
          onClose={() => setShowReportsModal(false)}
          onGenerateReport={handleGenerateReport}
        />
      )}

      {/* Mahnung Modal */}
      {showReminderModal && (
        <ReminderModal
          isOpen={showReminderModal}
          onClose={() => setShowReminderModal(false)}
          onSendReminder={handleSendReminder}
          selectedInvoice={selectedInvoice}
        />
      )}

      {/* Rechnungsdetails Modal */}
      {showDetailsModal && selectedInvoice && (
        <InvoiceDetailsModal
          invoice={selectedInvoice}
          isOpen={showDetailsModal}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedInvoice(null);
          }}
          onDownload={() => handleDownloadPDF(selectedInvoice)}
          onSend={() => handleSendInvoice(selectedInvoice)}
        />
      )}

      {showCreateModal && (
        <CreateInvoiceModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            loadInvoices();
          }}
          selectedTemplate={selectedTemplate}
        />
      )}
    </div>
  );
}

// Rechnungsdetails Modal Komponente
interface InvoiceDetailsModalProps {
  invoice: Invoice;
  isOpen: boolean;
  onClose: () => void;
  onDownload: () => void;
  onSend: () => void;
}

function InvoiceDetailsModal({ invoice, isOpen, onClose, onDownload, onSend }: InvoiceDetailsModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">{invoice.invoice_number}</h2>
              <p className="text-gray-600">{invoice.project_name}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X size={24} className="text-gray-400" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Rechnungsinformationen */}
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-xl p-4">
                <h3 className="font-semibold text-gray-800 mb-3">Rechnungsdetails</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Rechnungsnummer:</span>
                    <span className="font-medium">{invoice.invoice_number}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Erstellt am:</span>
                    <span className="font-medium">{new Date(invoice.created_at).toLocaleDateString('de-DE')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Fällig am:</span>
                    <span className="font-medium">{new Date(invoice.due_date).toLocaleDateString('de-DE')}</span>
                  </div>
                  {invoice.paid_at && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Bezahlt am:</span>
                      <span className="font-medium text-green-600">{new Date(invoice.paid_at).toLocaleDateString('de-DE')}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-4">
                <h3 className="font-semibold text-gray-800 mb-3">Kunde</h3>
                <div className="space-y-2">
                  <p className="font-medium">{invoice.client_name}</p>
                  <p className="text-gray-600">{invoice.client_email}</p>
                  {invoice.client_phone && (
                    <p className="text-gray-600">{invoice.client_phone}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Positionen */}
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-xl p-4">
                <h3 className="font-semibold text-gray-800 mb-3">Rechnungspositionen</h3>
                <div className="space-y-3">
                  {invoice.line_items.map((item) => (
                    <div key={item.id} className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="font-medium text-gray-800">{item.description}</p>
                        <p className="text-sm text-gray-600">
                          {item.quantity} × {item.unit_price.toLocaleString('de-DE')} €
                        </p>
                      </div>
                      <p className="font-semibold">{item.total_price.toLocaleString('de-DE')} €</p>
                    </div>
                  ))}
                </div>
                
                <div className="border-t border-gray-200 mt-4 pt-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Nettobetrag:</span>
                    <span className="font-medium">{invoice.amount.toLocaleString('de-DE')} €</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">MwSt. ({invoice.tax_rate}%):</span>
                    <span className="font-medium">{invoice.tax_amount.toLocaleString('de-DE')} €</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold border-t border-gray-200 pt-2">
                    <span>Gesamtbetrag:</span>
                    <span>{invoice.total_amount.toLocaleString('de-DE')} €</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Aktionen */}
          <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-200">
            <button
              onClick={onDownload}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2"
            >
              <Download size={16} />
              PDF herunterladen
            </button>
            {invoice.status === 'draft' && (
              <button
                onClick={onSend}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
              >
                <Send size={16} />
                Rechnung versenden
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Rechnung erstellen Modal Komponente
interface CreateInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  selectedTemplate: InvoiceTemplate | null;
}

function CreateInvoiceModal({ isOpen, onClose, onSuccess, selectedTemplate }: CreateInvoiceModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-800">Neue Rechnung erstellen</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X size={20} className="text-gray-400" />
            </button>
          </div>
        </div>
        
        <div className="p-6">
          <p className="text-gray-600 text-center">
            Rechnungserstellung wird implementiert...
          </p>
          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Abbrechen
            </button>
            <button
              onClick={() => {
                onSuccess();
                alert('Rechnung erstellt (Demo)');
              }}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Rechnung erstellen
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 

// Neue Modal-Komponenten für erweiterte Features

interface TemplatesModalProps {
  templates: InvoiceTemplate[];
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (template: InvoiceTemplate) => void;
}

function TemplatesModal({ templates, isOpen, onClose, onSelectTemplate }: TemplatesModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#2c3539] rounded-2xl shadow-2xl border border-white/20 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-[#2c3539] border-b border-white/20 p-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white">Rechnungsvorlagen</h2>
              <p className="text-gray-300">Wählen Sie eine Vorlage für Ihre neue Rechnung</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-full transition-colors"
            >
              <X size={24} className="text-gray-400" />
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {templates.map((template) => (
              <div
                key={template.id}
                className="bg-white/10 rounded-lg p-4 border border-white/20 hover:bg-white/15 transition-colors cursor-pointer"
                onClick={() => onSelectTemplate(template)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-white">{template.name}</h3>
                    <p className="text-sm text-gray-300">{template.description}</p>
                  </div>
                  {template.is_default && (
                    <span className="px-2 py-1 bg-[#ffbd59] text-[#2c3539] text-xs font-medium rounded">
                      Standard
                    </span>
                  )}
                </div>
                
                <div className="space-y-2 text-sm text-gray-300">
                  <p><strong>Positionen:</strong> {template.line_items.length}</p>
                  <p><strong>Zahlungsbedingungen:</strong> {template.payment_terms}</p>
                  <p><strong>Erstellt:</strong> {new Date(template.created_at).toLocaleDateString('de-DE')}</p>
                </div>

                <button className="mt-4 w-full bg-[#ffbd59] text-[#2c3539] py-2 rounded-lg font-medium hover:bg-[#ffa726] transition-colors">
                  Vorlage verwenden
                </button>
              </div>
            ))}
          </div>

          {templates.length === 0 && (
            <div className="text-center py-8">
              <FileCheck size={48} className="mx-auto text-gray-400 mb-4" />
              <p className="text-gray-300">Keine Vorlagen verfügbar</p>
              <p className="text-sm text-gray-400 mt-2">
                Erstellen Sie Ihre erste Vorlage, indem Sie eine Rechnung als Vorlage speichern
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface ReportsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerateReport: (report: InvoiceReport) => void;
}

function ReportsModal({ isOpen, onClose, onGenerateReport }: ReportsModalProps) {
  if (!isOpen) return null;

  const availableReports: InvoiceReport[] = [
    {
      id: 'monthly_summary',
      name: 'Monatliche Zusammenfassung',
      description: 'Übersicht über alle Rechnungen des aktuellen Monats',
      type: 'summary',
      period: 'monthly',
      format: 'pdf'
    },
    {
      id: 'aging_report',
      name: 'Fälligkeits-Report',
      description: 'Analyse überfälliger Rechnungen nach Zeiträumen',
      type: 'aging',
      period: 'custom',
      format: 'excel'
    },
    {
      id: 'tax_report',
      name: 'Steuer-Report',
      description: 'MwSt-Übersicht für Steuererklärung',
      type: 'tax',
      period: 'quarterly',
      format: 'csv'
    },
    {
      id: 'client_analysis',
      name: 'Kunden-Analyse',
      description: 'Detaillierte Analyse pro Kunde',
      type: 'detailed',
      period: 'yearly',
      format: 'pdf'
    }
  ];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#2c3539] rounded-2xl shadow-2xl border border-white/20 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-[#2c3539] border-b border-white/20 p-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white">Reports generieren</h2>
              <p className="text-gray-300">Erstellen Sie detaillierte Berichte über Ihre Rechnungen</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-full transition-colors"
            >
              <X size={24} className="text-gray-400" />
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {availableReports.map((report) => (
              <div
                key={report.id}
                className="bg-white/10 rounded-lg p-4 border border-white/20 hover:bg-white/15 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-white">{report.name}</h3>
                    <p className="text-sm text-gray-300">{report.description}</p>
                  </div>
                  <span className="px-2 py-1 bg-blue-500 text-white text-xs font-medium rounded uppercase">
                    {report.format}
                  </span>
                </div>
                
                <div className="space-y-2 text-sm text-gray-300 mb-4">
                  <p><strong>Typ:</strong> {report.type}</p>
                  <p><strong>Zeitraum:</strong> {report.period}</p>
                </div>

                <button
                  onClick={() => onGenerateReport(report)}
                  className="w-full bg-[#ffbd59] text-[#2c3539] py-2 rounded-lg font-medium hover:bg-[#ffa726] transition-colors flex items-center justify-center gap-2"
                >
                  <BarChart3 size={16} />
                  Report generieren
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

interface ReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSendReminder: (invoice: Invoice, type: 'friendly' | 'first_reminder' | 'second_reminder' | 'final_notice') => void;
  selectedInvoice: Invoice | null;
}

function ReminderModal({ isOpen, onClose, onSendReminder, selectedInvoice }: ReminderModalProps) {
  if (!isOpen || !selectedInvoice) return null;

  const reminderTypes = [
    {
      type: 'friendly' as const,
      title: 'Freundliche Erinnerung',
      description: 'Höfliche Erinnerung an die ausstehende Zahlung',
      icon: <Mail size={20} className="text-blue-500" />
    },
    {
      type: 'first_reminder' as const,
      title: 'Erste Mahnung',
      description: 'Offizielle erste Mahnung mit Hinweis auf Verzug',
      icon: <AlertTriangle size={20} className="text-yellow-500" />
    },
    {
      type: 'second_reminder' as const,
      title: 'Zweite Mahnung',
      description: 'Zweite Mahnung mit Mahngebühren',
      icon: <AlertTriangle size={20} className="text-orange-500" />
    },
    {
      type: 'final_notice' as const,
      title: 'Letzte Mahnung',
      description: 'Letzte Warnung vor rechtlichen Schritten',
      icon: <AlertCircle size={20} className="text-red-500" />
    }
  ];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#2c3539] rounded-2xl shadow-2xl border border-white/20 max-w-2xl w-full">
        <div className="p-6 border-b border-white/20">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white">Mahnung senden</h2>
              <p className="text-gray-300">Rechnung: {selectedInvoice.invoice_number}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-full transition-colors"
            >
              <X size={24} className="text-gray-400" />
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="space-y-4">
            {reminderTypes.map((reminder) => (
              <div
                key={reminder.type}
                className="bg-white/10 rounded-lg p-4 border border-white/20 hover:bg-white/15 transition-colors cursor-pointer"
                onClick={() => {
                  onSendReminder(selectedInvoice, reminder.type);
                  onClose();
                }}
              >
                <div className="flex items-center gap-4">
                  <div className="flex-shrink-0">
                    {reminder.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-white">{reminder.title}</h3>
                    <p className="text-sm text-gray-300">{reminder.description}</p>
                  </div>
                  <div className="flex-shrink-0">
                    <button className="px-4 py-2 bg-[#ffbd59] text-[#2c3539] rounded-lg font-medium hover:bg-[#ffa726] transition-colors">
                      Senden
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 p-4 bg-white/5 rounded-lg border border-white/10">
            <h4 className="font-medium text-white mb-2">Rechnungsdetails:</h4>
            <div className="text-sm text-gray-300 space-y-1">
              <p><strong>Kunde:</strong> {selectedInvoice.client_name}</p>
              <p><strong>Betrag:</strong> {selectedInvoice.total_amount.toLocaleString('de-DE')} €</p>
              <p><strong>Fällig seit:</strong> {new Date(selectedInvoice.due_date).toLocaleDateString('de-DE')}</p>
              <p><strong>Tage überfällig:</strong> {Math.floor((Date.now() - new Date(selectedInvoice.due_date).getTime()) / (1000 * 60 * 60 * 24))}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 