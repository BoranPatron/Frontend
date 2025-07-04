import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
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
  TreePine,
  Wrench
} from 'lucide-react';
import { getQuotes, createQuote, updateQuote, deleteQuote, submitQuote, acceptQuote, analyzeQuote } from '../api/quoteService';
import { useAuth } from '../context/AuthContext';
import { getMilestones, createMilestone, updateMilestone, deleteMilestone, getAllMilestones } from '../api/milestoneService';
import { getProjects } from '../api/projectService';
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

interface Project {
  id: number;
  name: string;
  description: string;
}

// Interface für Gewerke
interface Trade {
  id: number;
  title: string;
  description: string;
  status: string;
  priority: string;
  progress_percentage: number;
  planned_date: string;  // Pflichtfeld vom Backend
  start_date?: string;
  end_date?: string;
  actual_date?: string;
  category?: string;
  budget?: number;
  actual_costs?: number;
  contractor?: string;
  is_critical: boolean;
  notify_on_completion: boolean;
  notes?: string;
  created_at: string;
  updated_at: string;
  completed_at?: string;
}

export default function Trades() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // State für Gewerke
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLoadingTrades, setIsLoadingTrades] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // State für Projekte
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<number | null>(null);
  
  // State für Filter und Suche
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  
  // State für Modal
  const [showTradeModal, setShowTradeModal] = useState(false);
  const [editingTrade, setEditingTrade] = useState<Trade | null>(null);
  const [deletingTrade, setDeletingTrade] = useState<number | null>(null);
  
  // State für Formular
  const [tradeForm, setTradeForm] = useState({
    title: '',
    description: '',
    category: 'eigene',
    customCategory: '',
    start_date: '',
    end_date: '',
    budget: '',
    contractor: '',
    notes: '',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'critical',
    is_critical: false
  });

  const loadTrades = async () => {
    // Verhindere mehrfache gleichzeitige Aufrufe
    if (isLoadingTrades) {
      console.log('⚠️ loadTrades already in progress, skipping...');
      return;
    }

    setIsLoadingTrades(true);
    setLoading(true);
    setError('');
    try {
      console.log('🔍 Loading all trades for user...');
      console.log('🔍 Current URL:', window.location.href);
      
      console.log('📡 Making API call to getAllMilestones');
      const data = await getAllMilestones();
      console.log('✅ Trades loaded successfully:', data);
      console.log('📊 Number of trades loaded:', data.length);
      console.log('📋 Trades data:', JSON.stringify(data, null, 2));
      setTrades(data);
    } catch (e: any) {
      console.error('❌ Error loading trades:', e);
      console.error('❌ Error details:', e.response || e.message);
      setError('Fehler beim Laden der Gewerke: ' + (e?.message || e));
      setTrades([]);
    } finally {
      console.log('🏁 Setting loading to false');
      setLoading(false);
      setIsLoadingTrades(false);
    }
  };

  // Lade Gewerke beim ersten Laden der Komponente
  useEffect(() => {
    console.log('🚀 Component mounted, loading all trades...');
    loadTrades();
  }, []);

  // Lade Projekte beim ersten Laden, falls sie noch nicht geladen sind
  useEffect(() => {
    const loadProjectsIfNeeded = async () => {
      try {
        const projects = await getProjects();
        console.log('📋 Projects loaded:', projects);
        if (projects.length > 0 && !selectedProject) {
          console.log('🔧 Setting selectedProject to first project:', projects[0].id);
          setSelectedProject(projects[0].id);
        }
      } catch (error) {
        console.error('❌ Error loading projects:', error);
      }
    };
    
    loadProjectsIfNeeded();
  }, []);

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
    
    // Prüfe ob ein Projekt ausgewählt ist
    if (!selectedProject) {
      setError('Bitte wählen Sie ein Projekt aus.');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      const category = tradeForm.category === 'eigene' ? tradeForm.customCategory : tradeForm.category;
      
      const tradeData = {
        project_id: selectedProject,
        title: tradeForm.title.trim(),
        description: tradeForm.description.trim(),
        category: category,
        planned_date: tradeForm.start_date,
        start_date: tradeForm.start_date,
        end_date: tradeForm.end_date,
        budget: tradeForm.budget ? parseFloat(tradeForm.budget) : null,
        actual_costs: 0.0,
        contractor: tradeForm.contractor.trim() || null,
        notes: tradeForm.notes.trim() || null,
        priority: tradeForm.priority,
        is_critical: tradeForm.is_critical,
        notify_on_completion: true
      };
      
      if (editingTrade) {
        // Bearbeite existierendes Gewerk
        console.log('📝 Updating trade with data:', tradeData);
        await updateMilestone(editingTrade.id, tradeData);
        setSuccess('Gewerk erfolgreich aktualisiert!');
      } else {
        // Erstelle neues Gewerk
        console.log('📝 Creating new trade with data:', tradeData);
        await createMilestone(tradeData);
        setSuccess('Gewerk erfolgreich erstellt!');
      }
      
      setShowTradeModal(false);
      setEditingTrade(null);
      resetTradeForm();
      
      // Lade Gewerke neu
      console.log('🔄 Reloading trades after operation...');
      
      // Warte kurz, damit das Backend die Daten verarbeitet hat
      await new Promise(resolve => setTimeout(resolve, 500));
      const milestonesData = await getAllMilestones();
      console.log('✅ Trades reloaded successfully after operation:', milestonesData);
      setTrades(milestonesData);
      
    } catch (error: any) {
      console.error('Fehler beim Speichern des Gewerks:', error);
      setError(error.message || 'Fehler beim Speichern des Gewerks');
    } finally {
      setLoading(false);
    }
  };

  // Schnelle Status-Änderung
  const handleQuickStatusChange = async (tradeId: number, newStatus: string) => {
    try {
      const trade = trades.find(t => t.id === tradeId);
      if (!trade) return;

      await updateMilestone(tradeId, { status: newStatus });
      
      // Update local state
      setTrades(prev => prev.map(t => 
        t.id === tradeId ? { ...t, status: newStatus } : t
      ));
      
      setSuccess(`Status von "${trade.title}" erfolgreich geändert!`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (error: any) {
      console.error('Fehler beim Ändern des Status:', error);
      setError('Fehler beim Ändern des Status');
    }
  };

  // Schnelle Prioritäts-Änderung
  const handleQuickPriorityChange = async (tradeId: number, newPriority: string) => {
    try {
      const trade = trades.find(t => t.id === tradeId);
      if (!trade) return;

      await updateMilestone(tradeId, { priority: newPriority });
      
      // Update local state
      setTrades(prev => prev.map(t => 
        t.id === tradeId ? { ...t, priority: newPriority } : t
      ));
      
      setSuccess(`Priorität von "${trade.title}" erfolgreich geändert!`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (error: any) {
      console.error('Fehler beim Ändern der Priorität:', error);
      setError('Fehler beim Ändern der Priorität');
    }
  };

  // Öffne Bearbeitungsmodal
  const openEditModal = (trade: Trade) => {
    setEditingTrade(trade);
    setTradeForm({
      title: trade.title,
      description: trade.description || '',
      category: trade.category || 'eigene',
      customCategory: trade.category || '',
      start_date: trade.start_date || trade.planned_date || '',
      end_date: trade.end_date || '',
      budget: trade.budget?.toString() || '',
      contractor: trade.contractor || '',
      notes: trade.notes || '',
      priority: trade.priority as 'low' | 'medium' | 'high' | 'critical',
      is_critical: trade.is_critical
    });
    setShowTradeModal(true);
  };

  const resetTradeForm = () => {
    setTradeForm({
      title: '',
      description: '',
      category: 'eigene',
      customCategory: '',
      start_date: '',
      end_date: '',
      budget: '',
      contractor: '',
      notes: '',
      priority: 'medium',
      is_critical: false
    });
    setEditingTrade(null);
  };

  // Filtere Gewerke basierend auf Suche und Status
  const filteredTrades = trades.filter(trade => {
    const matchesSearch = trade.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         trade.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (trade.category && trade.category.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = filterStatus === 'all' || trade.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#ffbd59] mx-auto mb-4"></div>
          <p className="text-white">Lade Gewerke...</p>
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
    <div className="min-h-screen bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460]">
      <ProjectBreadcrumb />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate(-1)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <ArrowLeft size={20} className="text-[#ffbd59]" />
              </button>
              <div>
                <h1 className="text-3xl font-bold text-[#ffbd59]">Gewerke</h1>
                <p className="text-gray-300">
                  Gewerkeverwaltung & Vergleich
                  {selectedProject && (
                    <span className="block text-sm text-[#ffbd59] mt-1">
                      Projekt-ID: {selectedProject}
                    </span>
                  )}
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowTradeModal(true)}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#ffbd59] to-[#ffa726] text-[#3d4952] rounded-xl hover:from-[#ffa726] hover:to-[#ff9800] transition-all duration-300 transform hover:scale-105 shadow-lg font-semibold"
            >
              <Plus size={20} />
              Gewerk erstellen
            </button>
          </div>
        </header>

        {/* Error Banner */}
        {error && (
          <div className="bg-red-500/20 border border-red-500/30 text-red-300 px-6 py-4 flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <AlertTriangle size={20} />
              <span>{error}</span>
            </div>
            <button onClick={() => setError('')} className="text-red-300 hover:text-red-100">
              <XCircle size={20} />
            </button>
          </div>
        )}

        {/* Success Banner */}
        {success && (
          <div className="bg-green-500/20 border border-green-500/30 text-green-300 px-6 py-4 flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <CheckCircle size={20} />
              <span>{success}</span>
            </div>
            <button onClick={() => setSuccess('')} className="text-green-300 hover:text-green-100">
              <XCircle size={20} />
            </button>
          </div>
        )}

        <div className="max-w-7xl mx-auto">
          {/* Debug Info */}
          <div className="bg-yellow-500/20 border border-yellow-500/30 text-yellow-300 px-6 py-4 mb-6 rounded-lg">
            <h3 className="font-bold mb-2">Debug Info:</h3>
            <p>Loading: {loading.toString()}</p>
            <p>IsLoadingTrades: {isLoadingTrades.toString()}</p>
            <p>SelectedProject: {selectedProject}</p>
            <p>Trades Count: {trades.length}</p>
            <p>FilteredTrades Count: {filteredTrades.length}</p>
            <p>Error: {error || 'Kein Fehler'}</p>
            <p>Current URL: {window.location.href}</p>
          </div>

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
            {filteredTrades.map((trade) => (
              <div key={trade.id} className="group bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-300 transform hover:-translate-y-2 hover:shadow-2xl">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-br from-[#ffbd59] to-[#ffa726] rounded-xl">
                      <Wrench size={20} className="text-white" />
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
                        onClick={() => openEditModal(trade)}
                        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/10 transition-colors rounded-t-xl"
                      >
                        <Edit size={16} />
                        <span>Bearbeiten</span>
                      </button>
                      <button
                        onClick={() => setDeletingTrade(trade.id)}
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
                      <span className="text-gray-400">Geplant:</span>
                      <span className="text-white ml-1">{trade.planned_date ? new Date(trade.planned_date).toLocaleDateString('de-DE') : '—'}</span>
                    </div>
                    
                    {trade.start_date && trade.end_date && (
                      <div className="flex items-center gap-1">
                        <Calendar size={14} className="text-gray-400" />
                        <span className="text-gray-400">Dauer:</span>
                        <span className="text-white ml-1">{Math.round((new Date(trade.end_date).getTime() - new Date(trade.start_date).getTime()) / (1000 * 60 * 60 * 24))} Tage</span>
                      </div>
                    )}
                  </div>
                  
                  {trade.budget && (
                    <div className="flex items-center gap-1 text-sm">
                      <span className="text-gray-400">Budget:</span>
                      <span className="text-white">{trade.budget.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}</span>
                    </div>
                  )}
                  
                  {trade.contractor && (
                    <div className="flex items-center gap-1 text-sm">
                      <span className="text-gray-400">Auftragnehmer:</span>
                      <span className="text-white">{trade.contractor}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-1 text-sm">
                    <TrendingUp size={14} className="text-gray-400" />
                    <span className="text-gray-400">Fortschritt:</span>
                    <span className="text-white ml-1">{trade.progress_percentage || 0}%</span>
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
                    {/* Klickbarer Status */}
                    <div className="relative group">
                      <button
                        onClick={() => {
                          const statuses = ['planned', 'in_progress', 'completed', 'delayed', 'cancelled'];
                          const currentIndex = statuses.indexOf(trade.status);
                          const nextStatus = statuses[(currentIndex + 1) % statuses.length];
                          handleQuickStatusChange(trade.id, nextStatus);
                        }}
                        className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium backdrop-blur-md border ${getStatusColor(trade.status)} hover:scale-105 transition-all duration-200 cursor-pointer group`}
                        title="Klicken zum Ändern des Status"
                      >
                        {getStatusLabel(trade.status)}
                        <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-[10px]">↻</span>
                      </button>
                    </div>
                    
                    {/* Klickbare Priorität */}
                    {trade.priority && (
                      <div className="relative group">
                        <button
                          onClick={() => {
                            const priorities = ['low', 'medium', 'high', 'critical'];
                            const currentIndex = priorities.indexOf(trade.priority);
                            const nextPriority = priorities[(currentIndex + 1) % priorities.length];
                            handleQuickPriorityChange(trade.id, nextPriority);
                          }}
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-white/10 border border-white/20 ${getPriorityColor(trade.priority)} hover:scale-105 transition-all duration-200 cursor-pointer group`}
                          title="Klicken zum Ändern der Priorität"
                        >
                          <span>{getPriorityLabel(trade.priority)}</span>
                          <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-[10px]">↻</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Empty State */}
          {filteredTrades.length === 0 && (
            <div className="text-center py-12">
              <div className="p-6 bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 max-w-md mx-auto">
                <Wrench size={48} className="text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">Keine Gewerke gefunden</h3>
                <p className="text-gray-400 mb-6">
                  {searchTerm || filterStatus !== 'all' 
                    ? 'Versuchen Sie andere Suchkriterien oder Filter.'
                    : 'Erstellen Sie Ihr erstes Gewerk, um zu beginnen.'
                  }
                </p>
                {!searchTerm && filterStatus === 'all' && (
                  <button
                    onClick={() => setShowTradeModal(true)}
                    className="px-6 py-3 bg-gradient-to-r from-[#ffbd59] to-[#ffa726] text-[#3d4952] rounded-xl hover:from-[#ffa726] hover:to-[#ff9800] transition-all duration-300 font-semibold"
                  >
                    Erstes Gewerk erstellen
                  </button>
                )}
              </div>
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
                {editingTrade ? 'Gewerk bearbeiten' : 'Neues Gewerk erstellen'}
              </h2>
              <button
                onClick={() => {
                  setShowTradeModal(false);
                  resetTradeForm();
                }}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <XCircle size={24} className="text-gray-400" />
              </button>
            </div>
            
            {selectedProject && (
              <div className="mb-6 p-4 bg-[#ffbd59]/10 border border-[#ffbd59]/20 rounded-xl">
                <p className="text-[#ffbd59] text-sm font-medium">
                  📋 Dieses Gewerk wird dem Projekt-ID {selectedProject} zugeordnet
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
                  <label className="block text-sm font-medium text-gray-300 mb-2">Priorität</label>
                  <select
                    value={tradeForm.priority}
                    onChange={(e) => setTradeForm({...tradeForm, priority: e.target.value as 'low' | 'medium' | 'high' | 'critical'})}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent"
                  >
                    <option value="low">Niedrig</option>
                    <option value="medium">Mittel</option>
                    <option value="high">Hoch</option>
                    <option value="critical">Kritisch</option>
                  </select>
                </div>
                
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
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Enddatum</label>
                  <input
                    type="date"
                    value={tradeForm.end_date}
                    onChange={(e) => setTradeForm({...tradeForm, end_date: e.target.value})}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Budget (€)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={tradeForm.budget}
                    onChange={(e) => setTradeForm({...tradeForm, budget: e.target.value})}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent"
                    placeholder="0.00"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Auftragnehmer</label>
                <input
                  type="text"
                  value={tradeForm.contractor}
                  onChange={(e) => setTradeForm({...tradeForm, contractor: e.target.value})}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent"
                  placeholder="Name des Auftragnehmers"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Notizen</label>
                <textarea
                  value={tradeForm.notes}
                  onChange={(e) => setTradeForm({...tradeForm, notes: e.target.value})}
                  rows={3}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent"
                  placeholder="Zusätzliche Notizen, Anmerkungen, Besonderheiten..."
                />
              </div>
              
              <div className="flex items-center space-x-4">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={tradeForm.is_critical}
                    onChange={(e) => setTradeForm({...tradeForm, is_critical: e.target.checked})}
                    className="w-4 h-4 text-[#ffbd59] bg-white/10 border-white/20 rounded focus:ring-[#ffbd59] focus:ring-2"
                  />
                  <span className="text-sm font-medium text-gray-300">Kritisches Gewerk</span>
                </label>
              </div>
              
              <div className="flex gap-4 pt-6">
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-[#ffbd59] to-[#ffa726] text-[#3d4952] font-bold py-3 rounded-xl hover:from-[#ffa726] hover:to-[#ff9800] transition-all duration-300 transform hover:scale-105"
                >
                  {editingTrade ? 'Änderungen speichern' : 'Gewerk erstellen'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowTradeModal(false);
                    resetTradeForm();
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
      {deletingTrade && (
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
                    const updatedTrades = trades.filter(t => t.id !== deletingTrade);
                    setTrades(updatedTrades);
                    setDeletingTrade(null);
                  }}
                  className="flex-1 bg-red-500 text-white font-bold py-3 rounded-xl hover:bg-red-600 transition-all duration-300"
                >
                  Löschen
                </button>
                <button
                  onClick={() => setDeletingTrade(null)}
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