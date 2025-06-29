import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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
  MapPin,
  ClipboardList,
  Droplets,
  Thermometer,
  Hammer,
  TreePine
} from 'lucide-react';
import { getQuotes, createQuote, updateQuote, deleteQuote, submitQuote, acceptQuote, analyzeQuote } from '../api/quoteService';
import { useAuth } from '../context/AuthContext';
import { getMilestones, createMilestone } from '../api/milestoneService';
import ProjectBreadcrumb from '../components/ProjectBreadcrumb';

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

// Interface für Gewerke
interface Trade {
  id: number;
  title: string;
  description: string;
  status: string;
  priority: string;
  progress_percentage: number;
  start_date?: string;
  end_date?: string;
  category?: string;
  is_critical: boolean;
  notify_on_completion: boolean;
  created_at: string;
  updated_at: string;
}

export default function Trades() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { projectId } = useParams();
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [editingQuote, setEditingQuote] = useState<Quote | null>(null);
  const [deletingQuote, setDeletingQuote] = useState<number | null>(null);
  const [selectedProject, setSelectedProject] = useState<number>(1);
  const [showTradeModal, setShowTradeModal] = useState(false);
  const [tradeForm, setTradeForm] = useState({
    title: '',
    description: '',
    status: 'planned' as Trade['status'],
    start_date: '',
    end_date: '',
    priority: 'medium',
    category: '',
    customCategory: '',
    progress_percentage: 0,
    notify_on_completion: true
  });

  console.log('🔍 Current URL:', window.location.href);
  console.log('🔍 projectId from useParams:', projectId);

  useEffect(() => {
    const loadTrades = async () => {
      setLoading(true);
      setError('');
      try {
        console.log('🔍 Loading trades for projectId:', projectId);
        
        if (!projectId) {
          console.log('⚠️ No projectId provided, setting empty trades');
          setTrades([]);
          setLoading(false);
          return;
        }
        
        const data = await getMilestones(Number(projectId));
        console.log('✅ Trades loaded successfully:', data);
        setTrades(data);
      } catch (e: any) {
        console.error('❌ Error loading trades:', e);
        setError('Fehler beim Laden der Gewerke: ' + (e?.message || e));
        setTrades([]);
      } finally {
        console.log('🏁 Setting loading to false');
        setLoading(false);
      }
    };
    loadTrades();
  }, [projectId]);

  const activeCount = trades.filter(t => t.status !== 'completed' && t.status !== 'abgeschlossen').length;

  const handleCreateTrade = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validierung
    if (!tradeForm.title.trim()) {
      setError('Bitte geben Sie einen Titel für das Gewerk ein.');
      return;
    }
    
    if (tradeForm.category === 'eigene' && !tradeForm.customCategory.trim()) {
      setError('Bitte geben Sie eine eigene Kategorie ein.');
      return;
    }
    
    if (!tradeForm.start_date || !tradeForm.end_date) {
      setError('Bitte geben Sie Start- und Enddatum ein.');
      return;
    }
    
    if (new Date(tradeForm.end_date) <= new Date(tradeForm.start_date)) {
      setError('Das Enddatum muss nach dem Startdatum liegen.');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      const milestoneData = {
        project_id: parseInt(projectId!),
        title: tradeForm.title.trim(),
        description: tradeForm.description.trim() || undefined,
        status: tradeForm.status,
        planned_date: tradeForm.start_date,
        priority: tradeForm.priority,
        category: tradeForm.category === 'eigene' ? tradeForm.customCategory : tradeForm.category || undefined,
        progress_percentage: tradeForm.progress_percentage,
        notify_on_completion: tradeForm.notify_on_completion
      };
      
      await createMilestone(milestoneData);
      
      setSuccess('Gewerk erfolgreich erstellt!');
      setShowTradeModal(false);
      resetTradeForm();
      loadTrades();
      
    } catch (error) {
      console.error('Fehler beim Erstellen des Gewerks:', error);
      setError('Fehler beim Erstellen des Gewerks. Bitte versuchen Sie es erneut.');
    } finally {
      setLoading(false);
    }
  };

  const resetTradeForm = () => {
    const today = new Date();
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);
    
    setTradeForm({
      title: '',
      description: '',
      status: 'planned' as Trade['status'],
      start_date: today.toISOString().split('T')[0],
      end_date: nextWeek.toISOString().split('T')[0],
      priority: 'medium',
      category: '',
      customCategory: '',
      progress_percentage: 0,
      notify_on_completion: true
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#51646f] via-[#3d4952] to-[#2c3539] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#ffbd59] mx-auto mb-4"></div>
          <p className="text-white text-lg">Lade Gewerke...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#51646f] via-[#3d4952] to-[#2c3539] flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="bg-red-500/20 border border-red-500/30 rounded-2xl p-6 mb-6">
            <h2 className="text-xl font-bold text-red-300 mb-4">Fehler beim Laden</h2>
            <p className="text-red-200 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
            >
              Seite neu laden
            </button>
          </div>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-2 bg-[#ffbd59] text-[#3d4952] rounded-lg font-semibold hover:bg-[#ffa726] transition"
          >
            Zurück zum Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <ProjectBreadcrumb />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
                <h1 className="text-3xl font-bold text-[#ffbd59]">Gewerke</h1>
                <p className="text-gray-300">
                  Gewerkeverwaltung & Vergleich
                  {projectId && (
                    <span className="block text-sm text-[#ffbd59] mt-1">
                      Projekt-ID: {projectId}
                    </span>
                  )}
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowTradeModal(true)}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#ffbd59] to-[#ffa726] text-[#3d4952] rounded-xl hover:from-[#ffa726] hover:to-[#ff9800] transition-all duration-300 transform hover:scale-105 shadow-lg font-semibold"
            >
              <PlusCircle size={20} />
              Gewerk erstellen
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
                <h3 className="text-2xl font-bold text-white mb-1">{trades.length}</h3>
                <p className="text-sm text-gray-400">Gewerke</p>
              </div>

              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl">
                    <Eye size={24} className="text-white" />
                  </div>
                  <span className="text-sm text-gray-400">Aktive Gewerke</span>
                </div>
                <h3 className="text-2xl font-bold text-white mb-1">
                  {activeCount}
                </h3>
                <p className="text-sm text-gray-400">Anzahl aktiver Gewerke</p>
              </div>
            </div>

            {/* Search and Filter */}
            <div className="flex flex-col md:flex-row gap-4 mb-8">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Gewerke durchsuchen..."
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
                  <option value="planned">Geplant</option>
                  <option value="in_progress">Aktiv</option>
                  <option value="completed">Abgeschlossen</option>
                  <option value="delayed">Verzögert</option>
                  <option value="cancelled">Abgebrochen</option>
                </select>
              </div>
            </div>

            {/* Gewerke Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {trades.map((trade) => (
                <div key={trade.id} className="group bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-300 transform hover:-translate-y-2 hover:shadow-2xl">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gradient-to-br from-[#ffbd59] to-[#ffa726] rounded-xl">
                        {/* Status Icon */}
                      </div>
                      <div>
                        <h3 className="font-bold text-white text-lg group-hover:text-[#ffbd59] transition-colors">
                          {trade.title}
                        </h3>
                        <p className="text-sm text-gray-400">{trade.description}</p>
                      </div>
                    </div>
                    
                    {/* Actions Menu */}
                    <div className="relative">
                      <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                        <MoreHorizontal size={16} className="text-gray-400" />
                      </button>
                      <div className="absolute right-0 top-full mt-2 w-48 bg-[#3d4952] rounded-xl shadow-2xl border border-white/20 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-10">
                        <button
                          onClick={() => setShowTradeModal(true)}
                          className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/10 transition-colors rounded-t-xl"
                        >
                          <Edit size={16} />
                          <span>Bearbeiten</span>
                        </button>
                        <button
                          onClick={() => setDeletingQuote(trade.id)}
                          className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-red-500/20 text-red-300 transition-colors rounded-b-xl"
                        >
                          <Trash2 size={16} />
                          <span>Löschen</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Gewerk Details */}
                  <div className="space-y-4 mb-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-400">Kategorie</span>
                      <div className="flex items-center gap-2">
                        {getCategoryIcon(trade.category || '')}
                        <span className="text-sm font-medium text-white">{getCategoryLabel(trade.category || '')}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1">
                        <Calendar size={14} className="text-gray-400" />
                        <span className="text-gray-400">Dauer:</span>
                        <span className="text-white ml-1">{trade.start_date && trade.end_date ? Math.round((new Date(trade.end_date).getTime() - new Date(trade.start_date).getTime()) / (1000 * 60 * 60 * 24)) : '—'} Tage</span>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <TrendingUp size={14} className="text-gray-400" />
                        <span className="text-gray-400">Fortschritt:</span>
                        <span className="text-white ml-1">{trade.progress_percentage || 0}%</span>
                      </div>
                    </div>
                    
                    {trade.is_critical && (
                      <div className="flex items-center gap-2 p-2 bg-red-500/10 border border-red-500/20 rounded-lg">
                        <Shield size={14} className="text-red-400" />
                        <span className="text-sm text-red-300 font-medium">Kritisches Gewerk</span>
                      </div>
                    )}
                  </div>

                  {/* Status and AI Analysis */}
                  <div className="space-y-3">
                    <div className="flex flex-wrap gap-2">
                      <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium backdrop-blur-md border ${getStatusColor(trade.status)}`}>
                        {getStatusLabel(trade.status)}
                      </div>
                      
                      {trade.priority && (
                        <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-white/10 border border-white/20 ${getPriorityColor(trade.priority)}`}>
                          <span>{getPriorityLabel(trade.priority)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Empty State */}
            {trades.length === 0 && !loading && (
              <div className="text-center py-16">
                <div className="w-24 h-24 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Handshake size={40} className="text-[#ffbd59]" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">Keine Gewerke gefunden</h3>
                <p className="text-gray-400 mb-6">
                  {searchTerm || filterStatus !== 'all' 
                    ? 'Versuchen Sie andere Suchkriterien oder Filter.'
                    : 'Erstellen Sie Ihr erstes Gewerk, um loszulegen.'
                  }
                </p>
                {!searchTerm && filterStatus === 'all' && (
                  <button
                    onClick={() => setShowQuoteModal(true)}
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#ffbd59] to-[#ffa726] text-[#3d4952] rounded-xl hover:from-[#ffa726] hover:to-[#ff9800] transition-all duration-300 transform hover:scale-105 shadow-lg font-semibold mx-auto"
                  >
                    <PlusCircle size={20} />
                    Erstes Gewerk erstellen
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Add/Edit Gewerk Modal */}
        {showTradeModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-[#3d4952] rounded-2xl p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">
                  {editingQuote ? 'Gewerk bearbeiten' : 'Neues Gewerk erstellen'}
                </h2>
                <button
                  onClick={() => {
                    setShowTradeModal(false);
                    setTradeForm({ 
                      title: '', 
                      description: '', 
                      status: 'planned', 
                      start_date: '', 
                      end_date: '', 
                      priority: 'medium',
                      category: '',
                      customCategory: '',
                      progress_percentage: 0,
                      notify_on_completion: true
                    });
                  }}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <XCircle size={24} className="text-gray-400" />
                </button>
              </div>
              
              {projectId && (
                <div className="mb-6 p-4 bg-[#ffbd59]/10 border border-[#ffbd59]/20 rounded-xl">
                  <p className="text-[#ffbd59] text-sm font-medium">
                    📋 Dieses Gewerk wird dem Projekt-ID {projectId} zugeordnet
                  </p>
                </div>
              )}
              
              <form onSubmit={handleCreateTrade} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Titel *</label>
                    <input
                      type="text"
                      required
                      value={tradeForm.title}
                      onChange={(e) => setTradeForm({...tradeForm, title: e.target.value})}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent"
                      placeholder="z.B. Elektroinstallation"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Gewerk-Kategorie</label>
                    <select
                      value={tradeForm.category}
                      onChange={(e) => setTradeForm({...tradeForm, category: e.target.value})}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent"
                    >
                      <option value="">Kategorie auswählen</option>
                      <option value="fundament">Fundament</option>
                      <option value="rohbau">Rohbau</option>
                      <option value="dach">Dach</option>
                      <option value="elektro">Elektro</option>
                      <option value="sanitaer">Sanitär</option>
                      <option value="heizung">Heizung</option>
                      <option value="fenster">Fenster & Türen</option>
                      <option value="innenausbau">Innenausbau</option>
                      <option value="aussenanlagen">Außenanlagen</option>
                      <option value="eigene">Eigene</option>
                    </select>
                  </div>
                  
                  {/* Eigene Kategorie Textfeld - nur anzeigen wenn "Eigene" ausgewählt */}
                  {tradeForm.category === 'eigene' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Ihre Kategorie</label>
                      <input
                        type="text"
                        value={tradeForm.customCategory}
                        onChange={(e) => setTradeForm({...tradeForm, customCategory: e.target.value})}
                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent"
                        placeholder="z.B. Gartenbau, Malerarbeiten, Bodenbeläge..."
                      />
                    </div>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Beschreibung</label>
                  <textarea
                    value={tradeForm.description}
                    onChange={(e) => setTradeForm({...tradeForm, description: e.target.value})}
                    rows={3}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent"
                    placeholder="Beschreiben Sie das Gewerk, wichtige Details, Anforderungen..."
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Status</label>
                    <select
                      value={tradeForm.status}
                      onChange={(e) => setTradeForm({...tradeForm, status: e.target.value as Trade['status']})}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent"
                    >
                      <option value="planned">Geplant</option>
                      <option value="in_progress">Aktiv</option>
                      <option value="completed">Abgeschlossen</option>
                      <option value="delayed">Verzögert</option>
                      <option value="cancelled">Abgebrochen</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Priorität</label>
                    <select
                      value={tradeForm.priority}
                      onChange={(e) => setTradeForm({...tradeForm, priority: e.target.value})}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent"
                    >
                      <option value="low">Niedrig</option>
                      <option value="medium">Mittel</option>
                      <option value="high">Hoch</option>
                      <option value="critical">Kritisch</option>
                    </select>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Startdatum</label>
                    <input
                      type="date"
                      value={tradeForm.start_date}
                      onChange={(e) => {
                        const newStartDate = e.target.value;
                        let newEndDate = tradeForm.end_date;
                        
                        // Wenn das Enddatum leer ist oder vor dem neuen Startdatum liegt, setze es auf 7 Tage später
                        if (!newEndDate || (newEndDate && newEndDate <= newStartDate)) {
                          const startDate = new Date(newStartDate);
                          const endDate = new Date(startDate);
                          endDate.setDate(startDate.getDate() + 7);
                          newEndDate = endDate.toISOString().split('T')[0];
                        }
                        
                        setTradeForm({
                          ...tradeForm, 
                          start_date: newStartDate,
                          end_date: newEndDate
                        });
                      }}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Enddatum</label>
                    <input
                      type="date"
                      value={tradeForm.end_date}
                      onChange={(e) => setTradeForm({...tradeForm, end_date: e.target.value})}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Fortschritt (%)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={tradeForm.progress_percentage}
                      onChange={(e) => setTradeForm({...tradeForm, progress_percentage: parseInt(e.target.value) || 0})}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent"
                      placeholder="0"
                    />
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={tradeForm.notify_on_completion}
                        onChange={(e) => setTradeForm({...tradeForm, notify_on_completion: e.target.checked})}
                        className="w-4 h-4 text-[#ffbd59] bg-white/10 border-white/20 rounded focus:ring-[#ffbd59] focus:ring-2"
                      />
                      <span className="text-sm font-medium text-gray-300">Benachrichtigung bei Abschluss</span>
                    </label>
                  </div>
                </div>
                
                <div className="flex gap-4 pt-6">
                  <button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-[#ffbd59] to-[#ffa726] text-[#3d4952] font-bold py-3 rounded-xl hover:from-[#ffa726] hover:to-[#ff9800] transition-all duration-300 transform hover:scale-105"
                  >
                    {editingQuote ? 'Änderungen speichern' : 'Gewerk erstellen'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowTradeModal(false);
                      setTradeForm({ 
                        title: '', 
                        description: '', 
                        status: 'planned', 
                        start_date: '', 
                        end_date: '', 
                        priority: 'medium',
                        category: '',
                        customCategory: '',
                        progress_percentage: 0,
                        notify_on_completion: true
                      });
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
                <h3 className="text-xl font-bold text-white mb-2">Gewerk löschen</h3>
                <p className="text-gray-400 mb-6">
                  Sind Sie sicher, dass Sie dieses Gewerk löschen möchten? Diese Aktion kann nicht rückgängig gemacht werden.
                </p>
                <div className="flex gap-4">
                  <button
                    onClick={() => {
                      const updatedTrades = trades.filter(t => t.id !== deletingQuote);
                      setTrades(updatedTrades);
                      setDeletingQuote(null);
                    }}
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
    </div>
  );
}

function getStatusLabel(status: string) {
  switch (status) {
    case 'planned':
    case 'geplant':
      return 'Geplant';
    case 'in_progress':
    case 'aktiv':
      return 'Aktiv';
    case 'completed':
    case 'abgeschlossen':
      return 'Abgeschlossen';
    case 'delayed':
    case 'verzögert':
      return 'Verzögert';
    case 'cancelled':
    case 'abgebrochen':
      return 'Abgebrochen';
    default:
      return status;
  }
}

function getStatusColor(status: string) {
  switch (status) {
    case 'planned':
    case 'geplant':
      return '#6366f1';
    case 'in_progress':
    case 'aktiv':
      return '#22d3ee';
    case 'completed':
    case 'abgeschlossen':
      return '#22c55e';
    case 'delayed':
    case 'verzögert':
      return '#f59e42';
    case 'cancelled':
    case 'abgebrochen':
      return '#ef4444';
    default:
      return '#64748b';
  }
}

function getPriorityLabel(priority: string) {
  switch (priority) {
    case 'low':
    case 'niedrig':
      return 'Niedrig';
    case 'medium':
    case 'mittel':
      return 'Mittel';
    case 'high':
    case 'hoch':
      return 'Hoch';
    case 'critical':
    case 'kritisch':
      return 'Kritisch';
    default:
      return priority;
  }
}

function getPriorityColor(priority: string) {
  switch (priority) {
    case 'low':
    case 'niedrig':
      return 'text-blue-400 border-blue-400/30';
    case 'medium':
    case 'mittel':
      return 'text-yellow-400 border-yellow-400/30';
    case 'high':
    case 'hoch':
      return 'text-red-400 border-red-400/30';
    case 'critical':
    case 'kritisch':
      return 'text-purple-400 border-purple-400/30';
    default:
      return 'text-gray-400 border-gray-400/30';
  }
}

function getCategoryLabel(category: string) {
  switch (category) {
    case 'fundament':
      return 'Fundament';
    case 'rohbau':
      return 'Rohbau';
    case 'dach':
      return 'Dach';
    case 'elektro':
      return 'Elektro';
    case 'sanitaer':
      return 'Sanitär';
    case 'heizung':
      return 'Heizung';
    case 'fenster':
      return 'Fenster & Türen';
    case 'innenausbau':
      return 'Innenausbau';
    case 'aussenanlagen':
      return 'Außenanlagen';
    case 'eigene':
      return 'Eigene';
    default:
      return category || 'Nicht kategorisiert';
  }
}

function getCategoryIcon(category: string) {
  switch (category) {
    case 'fundament':
      return <Building size={16} />;
    case 'rohbau':
      return <Building size={16} />;
    case 'dach':
      return <Building size={16} />;
    case 'elektro':
      return <Zap size={16} />;
    case 'sanitaer':
      return <Droplets size={16} />;
    case 'heizung':
      return <Thermometer size={16} />;
    case 'ausbau':
      return <Hammer size={16} />;
    case 'fassade':
      return <Building size={16} />;
    case 'garten':
      return <TreePine size={16} />;
    case 'strasse':
      return <Target size={16} />;
    default:
      return <Building size={16} />;
  }
} 