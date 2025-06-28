import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Handshake,
  Plus,
  Edit,
  Trash2,
  AlertTriangle,
  CheckCircle,
  XCircle,
  ArrowLeft,
  PlusCircle,
  RefreshCw,
  Search,
  Filter,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Calendar,
  User,
  Euro,
  Star,
  Eye,
  Download,
  Send,
  Check,
  X,
  Clock,
  Award,
  Target,
  Shield,
  Zap,
  MoreHorizontal,
  FileText,
  Building,
  Phone,
  Mail,
  Globe,
  MapPin
} from 'lucide-react';
import { getQuotes, createQuote, updateQuote, deleteQuote, submitQuote, acceptQuote, analyzeQuote } from '../api/quoteService';
import { useAuth } from '../context/AuthContext';

interface Quote {
  id: number;
  title: string;
  description: string;
  status: 'draft' | 'submitted' | 'under_review' | 'accepted' | 'rejected' | 'expired';
  project_id: number;
  service_provider_id: number;
  total_amount: number;
  currency: string;
  valid_until: string;
  labor_cost: number;
  material_cost: number;
  overhead_cost: number;
  estimated_duration: number;
  start_date: string;
  completion_date: string;
  payment_terms: string;
  warranty_period: number;
  risk_score: number;
  price_deviation: number;
  ai_recommendation: string;
  contact_released: boolean;
  created_at: string;
  updated_at: string;
  submitted_at: string | null;
  accepted_at: string | null;
}

interface ServiceProvider {
  id: number;
  first_name: string;
  last_name: string;
  company_name: string;
  company_address: string;
  company_phone: string;
  company_website: string;
  region: string;
  is_verified: boolean;
}

export default function Quotes() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [editingQuote, setEditingQuote] = useState<Quote | null>(null);
  const [deletingQuote, setDeletingQuote] = useState<number | null>(null);
  const [selectedProject, setSelectedProject] = useState<number>(1);

  // Form state für Angebote
  const [quoteForm, setQuoteForm] = useState({
    title: '',
    description: '',
    total_amount: '',
    currency: 'EUR',
    valid_until: '',
    labor_cost: '',
    material_cost: '',
    overhead_cost: '',
    estimated_duration: '',
    start_date: '',
    completion_date: '',
    payment_terms: '',
    warranty_period: ''
  });

  // Mock-Daten für Demo
  useEffect(() => {
    loadQuotes();
  }, [selectedProject]);

  const loadQuotes = async () => {
    try {
      setLoading(true);
      // Mock-Daten für Demo
      const mockQuotes: Quote[] = [
        {
          id: 1,
          title: 'Elektroinstallation komplett',
          description: 'Vollständige Elektroinstallation für das Einfamilienhaus',
          status: 'submitted',
          project_id: 1,
          service_provider_id: 1,
          total_amount: 18500.00,
          currency: 'EUR',
          valid_until: '2024-02-15',
          labor_cost: 8500.00,
          material_cost: 7500.00,
          overhead_cost: 2500.00,
          estimated_duration: 14,
          start_date: '2024-03-01',
          completion_date: '2024-03-15',
          payment_terms: '30% Anzahlung, 70% nach Fertigstellung',
          warranty_period: 24,
          risk_score: 15,
          price_deviation: -8.5,
          ai_recommendation: 'Gutes Angebot, erfahrener Anbieter',
          contact_released: true,
          created_at: '2024-01-10T10:30:00Z',
          updated_at: '2024-01-10T10:30:00Z',
          submitted_at: '2024-01-10T10:30:00Z',
          accepted_at: null
        },
        {
          id: 2,
          title: 'Heizungsanlage Wärmepumpe',
          description: 'Luft-Wasser-Wärmepumpe mit Fußbodenheizung',
          status: 'under_review',
          project_id: 1,
          service_provider_id: 2,
          total_amount: 32000.00,
          currency: 'EUR',
          valid_until: '2024-02-20',
          labor_cost: 12000.00,
          material_cost: 15000.00,
          overhead_cost: 5000.00,
          estimated_duration: 21,
          start_date: '2024-03-10',
          completion_date: '2024-03-31',
          payment_terms: '40% Anzahlung, 30% bei Lieferung, 30% nach Fertigstellung',
          warranty_period: 36,
          risk_score: 25,
          price_deviation: 12.3,
          ai_recommendation: 'Höherer Preis, aber sehr gute Qualität',
          contact_released: true,
          created_at: '2024-01-12T14:20:00Z',
          updated_at: '2024-01-12T14:20:00Z',
          submitted_at: '2024-01-12T14:20:00Z',
          accepted_at: null
        },
        {
          id: 3,
          title: 'Sanitärinstallation',
          description: 'Komplette Sanitärinstallation mit Bad und Küche',
          status: 'accepted',
          project_id: 1,
          service_provider_id: 3,
          total_amount: 12500.00,
          currency: 'EUR',
          valid_until: '2024-02-10',
          labor_cost: 6000.00,
          material_cost: 4500.00,
          overhead_cost: 2000.00,
          estimated_duration: 10,
          start_date: '2024-02-20',
          completion_date: '2024-03-02',
          payment_terms: '50% Anzahlung, 50% nach Fertigstellung',
          warranty_period: 24,
          risk_score: 8,
          price_deviation: -15.2,
          ai_recommendation: 'Sehr günstiges Angebot, empfohlen',
          contact_released: true,
          created_at: '2024-01-08T09:15:00Z',
          updated_at: '2024-01-08T09:15:00Z',
          submitted_at: '2024-01-08T09:15:00Z',
          accepted_at: '2024-01-15T16:45:00Z'
        }
      ];

      setQuotes(mockQuotes);
      setError('');
    } catch (err: any) {
      setError('Fehler beim Laden der Angebote: ' + (err.response?.data?.detail || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleCreateQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const newQuote: Quote = {
        id: Date.now(),
        title: quoteForm.title,
        description: quoteForm.description,
        status: 'draft',
        project_id: selectedProject,
        service_provider_id: 1, // Mock provider
        total_amount: parseFloat(quoteForm.total_amount),
        currency: quoteForm.currency,
        valid_until: quoteForm.valid_until,
        labor_cost: parseFloat(quoteForm.labor_cost) || 0,
        material_cost: parseFloat(quoteForm.material_cost) || 0,
        overhead_cost: parseFloat(quoteForm.overhead_cost) || 0,
        estimated_duration: parseInt(quoteForm.estimated_duration) || 0,
        start_date: quoteForm.start_date,
        completion_date: quoteForm.completion_date,
        payment_terms: quoteForm.payment_terms,
        warranty_period: parseInt(quoteForm.warranty_period) || 0,
        risk_score: 0,
        price_deviation: 0,
        ai_recommendation: '',
        contact_released: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        submitted_at: null,
        accepted_at: null
      };

      setQuotes([...quotes, newQuote]);
      setShowQuoteModal(false);
      resetQuoteForm();
    } catch (err: any) {
      setError('Fehler beim Erstellen des Angebots: ' + (err.response?.data?.detail || err.message));
    }
  };

  const handleUpdateQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingQuote) return;
    
    try {
      const updatedQuotes = quotes.map(quote => 
        quote.id === editingQuote.id 
          ? {
              ...quote,
              title: quoteForm.title,
              description: quoteForm.description,
              total_amount: parseFloat(quoteForm.total_amount),
              currency: quoteForm.currency,
              valid_until: quoteForm.valid_until,
              labor_cost: parseFloat(quoteForm.labor_cost) || 0,
              material_cost: parseFloat(quoteForm.material_cost) || 0,
              overhead_cost: parseFloat(quoteForm.overhead_cost) || 0,
              estimated_duration: parseInt(quoteForm.estimated_duration) || 0,
              start_date: quoteForm.start_date,
              completion_date: quoteForm.completion_date,
              payment_terms: quoteForm.payment_terms,
              warranty_period: parseInt(quoteForm.warranty_period) || 0,
              updated_at: new Date().toISOString()
            }
          : quote
      );

      setQuotes(updatedQuotes);
      setShowQuoteModal(false);
      setEditingQuote(null);
      resetQuoteForm();
    } catch (err: any) {
      setError('Fehler beim Aktualisieren des Angebots: ' + (err.response?.data?.detail || err.message));
    }
  };

  const handleDeleteQuote = async (quoteId: number) => {
    try {
      const updatedQuotes = quotes.filter(quote => quote.id !== quoteId);
      setQuotes(updatedQuotes);
      setDeletingQuote(null);
    } catch (err: any) {
      setError('Fehler beim Löschen des Angebots: ' + (err.response?.data?.detail || err.message));
    }
  };

  const handleSubmitQuote = async (quoteId: number) => {
    try {
      const updatedQuotes = quotes.map(quote => 
        quote.id === quoteId 
          ? {
              ...quote,
              status: 'submitted' as const,
              submitted_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }
          : quote
      );
      setQuotes(updatedQuotes);
    } catch (err: any) {
      setError('Fehler beim Einreichen des Angebots: ' + (err.response?.data?.detail || err.message));
    }
  };

  const handleAcceptQuote = async (quoteId: number) => {
    try {
      const updatedQuotes = quotes.map(quote => 
        quote.id === quoteId 
          ? {
              ...quote,
              status: 'accepted' as const,
              accepted_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }
          : quote
      );
      setQuotes(updatedQuotes);
    } catch (err: any) {
      setError('Fehler beim Annehmen des Angebots: ' + (err.response?.data?.detail || err.message));
    }
  };

  const resetQuoteForm = () => {
    setQuoteForm({
      title: '',
      description: '',
      total_amount: '',
      currency: 'EUR',
      valid_until: '',
      labor_cost: '',
      material_cost: '',
      overhead_cost: '',
      estimated_duration: '',
      start_date: '',
      completion_date: '',
      payment_terms: '',
      warranty_period: ''
    });
  };

  const openEditQuoteModal = (quote: Quote) => {
    setEditingQuote(quote);
    setQuoteForm({
      title: quote.title,
      description: quote.description,
      total_amount: quote.total_amount.toString(),
      currency: quote.currency,
      valid_until: quote.valid_until,
      labor_cost: quote.labor_cost.toString(),
      material_cost: quote.material_cost.toString(),
      overhead_cost: quote.overhead_cost.toString(),
      estimated_duration: quote.estimated_duration.toString(),
      start_date: quote.start_date,
      completion_date: quote.completion_date,
      payment_terms: quote.payment_terms,
      warranty_period: quote.warranty_period.toString()
    });
    setShowQuoteModal(true);
  };

  // Filtere und suche Angebote
  const filteredQuotes = quotes.filter(quote => {
    const matchesSearch = quote.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         quote.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterStatus === 'all' || quote.status === filterStatus;
    
    return matchesSearch && matchesFilter;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft': return <FileText size={20} />;
      case 'submitted': return <Send size={20} />;
      case 'under_review': return <Eye size={20} />;
      case 'accepted': return <Check size={20} />;
      case 'rejected': return <X size={20} />;
      case 'expired': return <Clock size={20} />;
      default: return <FileText size={20} />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'draft': return 'Entwurf';
      case 'submitted': return 'Eingereicht';
      case 'under_review': return 'In Prüfung';
      case 'accepted': return 'Angenommen';
      case 'rejected': return 'Abgelehnt';
      case 'expired': return 'Abgelaufen';
      default: return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
      case 'submitted': return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'under_review': return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      case 'accepted': return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'rejected': return 'bg-red-500/20 text-red-300 border-red-500/30';
      case 'expired': return 'bg-orange-500/20 text-orange-300 border-orange-500/30';
      default: return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  };

  const getRiskColor = (riskScore: number) => {
    if (riskScore <= 10) return 'text-green-400';
    if (riskScore <= 25) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getPriceDeviationColor = (deviation: number) => {
    if (deviation <= -10) return 'text-green-400';
    if (deviation <= 10) return 'text-yellow-400';
    return 'text-red-400';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#51646f] via-[#3d4952] to-[#2c3539] flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 text-[#ffbd59] animate-spin mx-auto mb-4" />
          <p className="text-white text-lg">Lade Angebote...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#51646f] via-[#3d4952] to-[#2c3539]">
      {/* Header */}
      <header className="bg-gradient-to-r from-[#3d4952]/95 to-[#51646f]/95 backdrop-blur-lg text-white px-8 py-6 shadow-2xl border-b border-[#ffbd59]/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate(-1)}
              className="p-2 bg-[#51646f] hover:bg-[#607583] rounded-xl transition-colors duration-300"
            >
              <ArrowLeft size={20} className="text-[#ffbd59]" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-[#ffbd59]">Angebote</h1>
              <p className="text-gray-300">Angebotsverwaltung & Vergleich</p>
            </div>
          </div>
          <button
            onClick={() => setShowQuoteModal(true)}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#ffbd59] to-[#ffa726] text-[#3d4952] rounded-xl hover:from-[#ffa726] hover:to-[#ff9800] transition-all duration-300 transform hover:scale-105 shadow-lg font-semibold"
          >
            <PlusCircle size={20} />
            Angebot erstellen
          </button>
        </div>
      </header>

      {/* Error Banner */}
      {error && (
        <div className="bg-red-500/20 border border-red-500/30 text-red-300 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle size={20} />
            <span>{error}</span>
          </div>
          <button onClick={() => setError('')} className="text-red-300 hover:text-red-100">
            <XCircle size={20} />
          </button>
        </div>
      )}

      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl">
                  <Handshake size={24} className="text-white" />
                </div>
                <span className="text-sm text-gray-400">Gesamt</span>
              </div>
              <h3 className="text-2xl font-bold text-white mb-1">{quotes.length}</h3>
              <p className="text-sm text-gray-400">Angebote</p>
            </div>

            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl">
                  <Eye size={24} className="text-white" />
                </div>
                <span className="text-sm text-gray-400">In Prüfung</span>
              </div>
              <h3 className="text-2xl font-bold text-white mb-1">
                {quotes.filter(q => q.status === 'under_review').length}
              </h3>
              <p className="text-sm text-gray-400">Warten auf Entscheidung</p>
            </div>

            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gradient-to-br from-green-400 to-green-600 rounded-xl">
                  <Check size={24} className="text-white" />
                </div>
                <span className="text-sm text-gray-400">Angenommen</span>
              </div>
              <h3 className="text-2xl font-bold text-white mb-1">
                {quotes.filter(q => q.status === 'accepted').length}
              </h3>
              <p className="text-sm text-gray-400">Bestätigte Angebote</p>
            </div>

            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gradient-to-br from-purple-400 to-purple-600 rounded-xl">
                  <BarChart3 size={24} className="text-white" />
                </div>
                <span className="text-sm text-gray-400">Durchschnitt</span>
              </div>
              <h3 className="text-2xl font-bold text-white mb-1">
                {quotes.length > 0 ? formatCurrency(quotes.reduce((sum, q) => sum + q.total_amount, 0) / quotes.length) : '€0'}
              </h3>
              <p className="text-sm text-gray-400">Pro Angebot</p>
            </div>
          </div>

          {/* Search and Filter */}
          <div className="flex flex-col md:flex-row gap-4 mb-8">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Angebote durchsuchen..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent"
              />
            </div>
            
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="pl-10 pr-8 py-3 bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent appearance-none cursor-pointer"
              >
                <option value="all">Alle Status</option>
                <option value="draft">Entwurf</option>
                <option value="submitted">Eingereicht</option>
                <option value="under_review">In Prüfung</option>
                <option value="accepted">Angenommen</option>
                <option value="rejected">Abgelehnt</option>
                <option value="expired">Abgelaufen</option>
              </select>
            </div>
          </div>

          {/* Quotes Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredQuotes.map((quote) => (
              <div key={quote.id} className="group bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-300 transform hover:-translate-y-2 hover:shadow-2xl">
                {/* Quote Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-br from-[#ffbd59] to-[#ffa726] rounded-xl">
                      {getStatusIcon(quote.status)}
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-lg group-hover:text-[#ffbd59] transition-colors">
                        {quote.title}
                      </h3>
                      <p className="text-sm text-gray-400">{quote.description}</p>
                    </div>
                  </div>
                  
                  {/* Actions Menu */}
                  <div className="relative">
                    <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                      <MoreHorizontal size={16} className="text-gray-400" />
                    </button>
                    <div className="absolute right-0 top-full mt-2 w-48 bg-[#3d4952] rounded-xl shadow-2xl border border-white/20 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-10">
                      {quote.status === 'draft' && (
                        <button
                          onClick={() => handleSubmitQuote(quote.id)}
                          className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/10 transition-colors rounded-t-xl"
                        >
                          <Send size={16} />
                          <span>Einreichen</span>
                        </button>
                      )}
                      {quote.status === 'under_review' && (
                        <button
                          onClick={() => handleAcceptQuote(quote.id)}
                          className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/10 transition-colors rounded-t-xl"
                        >
                          <Check size={16} />
                          <span>Annehmen</span>
                        </button>
                      )}
                      <button
                        onClick={() => openEditQuoteModal(quote)}
                        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/10 transition-colors"
                      >
                        <Edit size={16} />
                        <span>Bearbeiten</span>
                      </button>
                      <button
                        onClick={() => setDeletingQuote(quote.id)}
                        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-red-500/20 text-red-300 transition-colors rounded-b-xl"
                      >
                        <Trash2 size={16} />
                        <span>Löschen</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Quote Details */}
                <div className="space-y-4 mb-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">Gesamtbetrag</span>
                    <span className="text-xl font-bold text-white">{formatCurrency(quote.total_amount)}</span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-400">Arbeitskosten:</span>
                      <span className="text-white ml-2">{formatCurrency(quote.labor_cost)}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Materialkosten:</span>
                      <span className="text-white ml-2">{formatCurrency(quote.material_cost)}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <Calendar size={14} className="text-gray-400" />
                      <span className="text-gray-400">Dauer:</span>
                      <span className="text-white ml-1">{quote.estimated_duration} Tage</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Shield size={14} className="text-gray-400" />
                      <span className="text-gray-400">Garantie:</span>
                      <span className="text-white ml-1">{quote.warranty_period} Monate</span>
                    </div>
                  </div>
                </div>

                {/* Status and AI Analysis */}
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium backdrop-blur-md border ${getStatusColor(quote.status)}`}>
                      {getStatusLabel(quote.status)}
                    </div>
                    
                    {quote.risk_score > 0 && (
                      <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-white/10 border border-white/20 ${getRiskColor(quote.risk_score)}`}>
                        <AlertTriangle size={10} />
                        <span>Risiko: {quote.risk_score}%</span>
                      </div>
                    )}
                    
                    {quote.price_deviation !== 0 && (
                      <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-white/10 border border-white/20 ${getPriceDeviationColor(quote.price_deviation)}`}>
                        {quote.price_deviation > 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                        <span>{quote.price_deviation > 0 ? '+' : ''}{quote.price_deviation.toFixed(1)}%</span>
                      </div>
                    )}
                  </div>
                  
                  {quote.ai_recommendation && (
                    <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                      <div className="flex items-center gap-2 mb-2">
                        <Zap size={14} className="text-[#ffbd59]" />
                        <span className="text-xs font-medium text-[#ffbd59]">KI-Empfehlung</span>
                      </div>
                      <p className="text-sm text-gray-300">{quote.ai_recommendation}</p>
                    </div>
                  )}
                </div>

                {/* Validity */}
                <div className="mt-4 pt-4 border-t border-white/10">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Gültig bis:</span>
                    <span className="text-white">{new Date(quote.valid_until).toLocaleDateString('de-DE')}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Empty State */}
          {filteredQuotes.length === 0 && !loading && (
            <div className="text-center py-16">
              <div className="w-24 h-24 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Handshake size={40} className="text-[#ffbd59]" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Keine Angebote gefunden</h3>
              <p className="text-gray-400 mb-6">
                {searchTerm || filterStatus !== 'all' 
                  ? 'Versuchen Sie andere Suchkriterien oder Filter.'
                  : 'Erstellen Sie Ihr erstes Angebot, um loszulegen.'
                }
              </p>
              {!searchTerm && filterStatus === 'all' && (
                <button
                  onClick={() => setShowQuoteModal(true)}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#ffbd59] to-[#ffa726] text-[#3d4952] rounded-xl hover:from-[#ffa726] hover:to-[#ff9800] transition-all duration-300 transform hover:scale-105 shadow-lg font-semibold mx-auto"
                >
                  <PlusCircle size={20} />
                  Erstes Angebot erstellen
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Quote Modal */}
      {showQuoteModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#3d4952] rounded-2xl p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">
                {editingQuote ? 'Angebot bearbeiten' : 'Neues Angebot erstellen'}
              </h2>
              <button
                onClick={() => {
                  setShowQuoteModal(false);
                  setEditingQuote(null);
                  resetQuoteForm();
                }}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <XCircle size={24} className="text-gray-400" />
              </button>
            </div>
            
            <form onSubmit={editingQuote ? handleUpdateQuote : handleCreateQuote} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Titel *</label>
                  <input
                    type="text"
                    required
                    value={quoteForm.title}
                    onChange={(e) => setQuoteForm({...quoteForm, title: e.target.value})}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent"
                    placeholder="z.B. Elektroinstallation komplett"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Gesamtbetrag (€) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={quoteForm.total_amount}
                    onChange={(e) => setQuoteForm({...quoteForm, total_amount: e.target.value})}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent"
                    placeholder="0.00"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Beschreibung</label>
                <textarea
                  value={quoteForm.description}
                  onChange={(e) => setQuoteForm({...quoteForm, description: e.target.value})}
                  rows={3}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent"
                  placeholder="Beschreiben Sie das Angebot..."
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Arbeitskosten (€)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={quoteForm.labor_cost}
                    onChange={(e) => setQuoteForm({...quoteForm, labor_cost: e.target.value})}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent"
                    placeholder="0.00"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Materialkosten (€)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={quoteForm.material_cost}
                    onChange={(e) => setQuoteForm({...quoteForm, material_cost: e.target.value})}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent"
                    placeholder="0.00"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Gemeinkosten (€)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={quoteForm.overhead_cost}
                    onChange={(e) => setQuoteForm({...quoteForm, overhead_cost: e.target.value})}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent"
                    placeholder="0.00"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Geschätzte Dauer (Tage)</label>
                  <input
                    type="number"
                    min="1"
                    value={quoteForm.estimated_duration}
                    onChange={(e) => setQuoteForm({...quoteForm, estimated_duration: e.target.value})}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent"
                    placeholder="14"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Garantie (Monate)</label>
                  <input
                    type="number"
                    min="0"
                    value={quoteForm.warranty_period}
                    onChange={(e) => setQuoteForm({...quoteForm, warranty_period: e.target.value})}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent"
                    placeholder="24"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Startdatum</label>
                  <input
                    type="date"
                    value={quoteForm.start_date}
                    onChange={(e) => setQuoteForm({...quoteForm, start_date: e.target.value})}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Fertigstellungsdatum</label>
                  <input
                    type="date"
                    value={quoteForm.completion_date}
                    onChange={(e) => setQuoteForm({...quoteForm, completion_date: e.target.value})}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Zahlungsbedingungen</label>
                <input
                  type="text"
                  value={quoteForm.payment_terms}
                  onChange={(e) => setQuoteForm({...quoteForm, payment_terms: e.target.value})}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent"
                  placeholder="z.B. 30% Anzahlung, 70% nach Fertigstellung"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Gültig bis *</label>
                <input
                  type="date"
                  required
                  value={quoteForm.valid_until}
                  onChange={(e) => setQuoteForm({...quoteForm, valid_until: e.target.value})}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent"
                />
              </div>
              
              <div className="flex gap-4 pt-6">
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-[#ffbd59] to-[#ffa726] text-[#3d4952] font-bold py-3 rounded-xl hover:from-[#ffa726] hover:to-[#ff9800] transition-all duration-300 transform hover:scale-105"
                >
                  {editingQuote ? 'Änderungen speichern' : 'Angebot erstellen'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowQuoteModal(false);
                    setEditingQuote(null);
                    resetQuoteForm();
                  }}
                  className="flex-1 bg-white/10 text-white font-bold py-3 rounded-xl hover:bg-white/20 transition-all duration-300"
                >
                  Abbrechen
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingQuote && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#3d4952] rounded-2xl p-8 w-full max-w-md">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Trash2 size={32} className="text-red-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Angebot löschen</h3>
              <p className="text-gray-400 mb-6">
                Sind Sie sicher, dass Sie dieses Angebot löschen möchten? Diese Aktion kann nicht rückgängig gemacht werden.
              </p>
              <div className="flex gap-4">
                <button
                  onClick={() => handleDeleteQuote(deletingQuote)}
                  className="flex-1 bg-red-500 text-white font-bold py-3 rounded-xl hover:bg-red-600 transition-all duration-300"
                >
                  Löschen
                </button>
                <button
                  onClick={() => setDeletingQuote(null)}
                  className="flex-1 bg-white/10 text-white font-bold py-3 rounded-xl hover:bg-white/20 transition-all duration-300"
                >
                  Abbrechen
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 