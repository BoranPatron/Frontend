import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Edit, 
  Plus, 
  Search, 
  Filter,
  PlayCircle,
  PauseCircle,
  User,
  Euro,
  Building2,
  ListTodo,
  Clock,
  Eye,
  CheckCircle,
  AlertTriangle,
  FileText,
  FileCheck,
  Receipt,
  File,
  Camera,
  Wrench,
  BarChart3,
  Calendar,
  DollarSign,
  Users,
  ChevronDown,
  ChevronUp,
  Settings,
  MessageCircle,
  FolderOpen,
  TrendingUp,
  Target,
  Zap,
  Star,
  Award,
  Shield,
  Heart,
  Sparkles,
  Rocket,
  Crown,
  Gem,
  Trophy,
  Medal,
  Badge,
  Flag,
  Anchor,
  Compass,
  Map,
  Navigation,
  Home,
  Building,
  Factory,
  Warehouse,
  Store,
  Hospital,
  School,
  University,
  Church,
  Theater,
  Library,
  Mountain,
  Sun,
  Moon,
  Cloud,
  Wind,
  Tornado,
  X
} from 'lucide-react';
import { getProjectDashboard, updateProject } from '../api/projectService';
import { getTasks } from '../api/taskService';
import { getDocuments } from '../api/documentService';
import { getQuotes } from '../api/quoteService';
import { getMilestones } from '../api/milestoneService';
import ProjectBreadcrumb from '../components/ProjectBreadcrumb';
import TradesCard from '../components/TradesCard';

interface Project {
  id: number;
  name: string;
  description: string;
  project_type: string;
  status: string;
  progress_percentage: number;
  budget?: number;
  current_costs: number;
  start_date?: string;
  end_date?: string;
  address?: string;
  property_size?: number;
  construction_area?: number;
  estimated_duration?: number;
  is_public: boolean;
  allow_quotes: boolean;
  created_at: string;
  updated_at: string;
}

interface Task {
  id: number;
  title: string;
  description: string;
  status: 'todo' | 'in_progress' | 'review' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  progress_percentage: number;
  due_date?: string;
  estimated_hours?: number;
  is_milestone: boolean;
  created_at: string;
}

interface Document {
  id: number;
  title: string;
  description: string;
  document_type: 'plan' | 'permit' | 'quote' | 'invoice' | 'contract' | 'photo' | 'other';
  file_name: string;
  file_size: number;
  mime_type: string;
  created_at: string;
}

interface ProjectDashboard {
  project: Project;
  task_count: number;
  completed_tasks: number;
  milestone_count: number;
  completed_milestones: number;
  document_count: number;
  quote_count: number;
  recent_activities: any[];
}

interface ProjectEditForm {
  name: string;
  description: string;
  project_type: string;
  status: string;
  address: string;
  property_size: number;
  construction_area: number;
  start_date: string;
  end_date: string;
  budget: number;
  is_public: boolean;
  allow_quotes: boolean;
}

interface Quote {
  id: number;
  title: string;
  description: string;
  status: 'draft' | 'submitted' | 'under_review' | 'accepted' | 'rejected' | 'expired';
  project_id: number;
  service_provider_id: number;
  service_provider_name?: string;
  total_amount: number;
  currency: string;
  valid_until?: string;
  labor_cost?: number;
  material_cost?: number;
  overhead_cost?: number;
  estimated_duration?: number;
  start_date?: string;
  completion_date?: string;
  payment_terms?: string;
  warranty_period?: number;
  risk_score?: number;
  price_deviation?: number;
  ai_recommendation?: string;
  contact_released: boolean;
  created_at: string;
  updated_at: string;
  submitted_at?: string;
  accepted_at?: string;
}

interface Trade {
  id: number;
  title: string;
  description: string;
  status: 'planned' | 'in_progress' | 'completed' | 'delayed' | 'cancelled';
  contractor?: string;
  start_date?: string;
  end_date?: string;
  budget?: number;
  actual_costs?: number;
  progress_percentage: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
  category?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [dashboard, setDashboard] = useState<ProjectDashboard | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'tasks' | 'documents' | 'quotes'>('overview');
  
  // Modal states
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState<ProjectEditForm>({
    name: '',
    description: '',
    project_type: '',
    status: '',
    address: '',
    property_size: 0,
    construction_area: 0,
    start_date: '',
    end_date: '',
    budget: 0,
    is_public: false,
    allow_quotes: true
  });

  // Expandable sections state
  const [expandedSections, setExpandedSections] = useState<{
    projectDetails: boolean;
    tasks: boolean;
    phases: boolean;
    trades: boolean;
    budgetTimeline: boolean;
    quotes: boolean;
    documents: boolean;
    analytics: boolean;
  }>({
    projectDetails: true,
    tasks: true,
    phases: false,
    trades: true, // Gewerke standardmäßig expandiert
    budgetTimeline: false,
    quotes: false,
    documents: false,
    analytics: false
  });

  // Neue States für Angebote-Filter
  const [quoteSearchTerm, setQuoteSearchTerm] = useState('');
  const [quoteFilterStatus, setQuoteFilterStatus] = useState<string>('all');
  const [showQuoteFilter, setShowQuoteFilter] = useState(false);

  // Modal states for adding a new trade
  const [showAddTradeModal, setShowAddTradeModal] = useState(false);
  const [tradeForm, setTradeForm] = useState({
    project_id: 0,
    name: '',
    description: '',
    contractor: '',
    priority: 'low',
    start_date: '',
    end_date: '',
    budget: 0,
    actual_costs: 0,
    progress_percentage: 0,
    notes: ''
  });

  // Neue States für Projekt-Dropdown
  const [allProjects, setAllProjects] = useState<Project[]>([]);

  useEffect(() => {
    if (id) {
      loadProjectData();
    }
  }, [id]);

  const loadProjectData = async () => {
    setLoading(true);
    try {
      const projectId = parseInt(id!);
      
      // Lade Projekt-Dashboard-Daten
      const dashboardData = await getProjectDashboard(projectId);
      setDashboard(dashboardData);
      setProject(dashboardData.project);
      
      // Lade Aufgaben für dieses Projekt
      const tasksData = await getTasks(projectId);
      setTasks(tasksData);
      
      // Lade Dokumente für dieses Projekt
      const documentsData = await getDocuments(projectId);
      setDocuments(documentsData);
      
      // Lade Angebote für dieses Projekt
      const quotesData = await getQuotes(projectId);
      // Filtere nur Angebote für das aktuelle Projekt
      const projectQuotes = quotesData.filter((quote: Quote) => quote.project_id === projectId);
      setQuotes(projectQuotes);
      
      // Lade echte Gewerke (Milestones) für dieses Projekt
      console.log('🔍 Lade Milestones für Projekt ID:', projectId);
      const milestonesData = await getMilestones(projectId);
      console.log('🔍 Geladene Milestones:', milestonesData);
      
      // Konvertiere Milestones zu Trade-Format für die Anzeige
      const projectTrades: Trade[] = milestonesData.map((milestone: any) => ({
        id: milestone.id,
        title: milestone.title,
        description: milestone.description || '',
        status: milestone.status,
        contractor: milestone.contractor || '',
        start_date: milestone.start_date || milestone.planned_date,
        end_date: milestone.end_date || '',
        budget: milestone.budget || 0,
        actual_costs: milestone.actual_costs || 0,
        progress_percentage: milestone.progress_percentage || 0,
        priority: milestone.priority || 'medium',
        category: milestone.category || '',
        notes: milestone.notes || '',
        created_at: milestone.created_at,
        updated_at: milestone.updated_at
      }));
      
      console.log('🔍 Konvertierte Trades:', projectTrades);
      setTrades(projectTrades);
      
    } catch (e: any) {
      console.error('❌ Error loading project data:', e);
      setError(e.message || 'Fehler beim Laden der Projektdaten');
    } finally {
      setLoading(false);
    }
  };

  const getProjectTypeLabel = (type: string) => {
    switch (type) {
      case 'new_build': return 'Neubau';
      case 'renovation': return 'Renovierung';
      case 'extension': return 'Anbau';
      case 'refurbishment': return 'Sanierung';
      default: return type;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'planning': return 'Planung';
      case 'preparation': return 'Vorbereitung';
      case 'execution': return 'Ausführung';
      case 'completion': return 'Fertigstellung';
      case 'completed': return 'Abgeschlossen';
      case 'on_hold': return 'Pausiert';
      case 'cancelled': return 'Abgebrochen';
      default: return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planning': return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'preparation': return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      case 'execution': return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'completion': return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      case 'completed': return 'bg-green-600/20 text-green-400 border-green-600/30';
      case 'on_hold': return 'bg-orange-500/20 text-orange-300 border-orange-500/30';
      case 'cancelled': return 'bg-red-500/20 text-red-300 border-red-500/30';
      default: return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  };

  const getTaskStatusIcon = (status: string) => {
    switch (status) {
      case 'todo': return <ListTodo size={16} />;
      case 'in_progress': return <Clock size={16} />;
      case 'review': return <Eye size={16} />;
      case 'completed': return <CheckCircle size={16} />;
      case 'cancelled': return <AlertTriangle size={16} />;
      default: return <ListTodo size={16} />;
    }
  };

  const getTaskStatusColor = (status: string) => {
    switch (status) {
      case 'todo': return 'bg-gray-500/20 text-gray-300';
      case 'in_progress': return 'bg-blue-500/20 text-blue-300';
      case 'review': return 'bg-yellow-500/20 text-yellow-300';
      case 'completed': return 'bg-green-500/20 text-green-300';
      case 'cancelled': return 'bg-red-500/20 text-red-300';
      default: return 'bg-gray-500/20 text-gray-300';
    }
  };

  const getDocumentTypeIcon = (type: string) => {
    switch (type) {
      case 'plan': return <FileText size={16} />;
      case 'permit': return <FileCheck size={16} />;
      case 'quote': return <Receipt size={16} />;
      case 'invoice': return <Receipt size={16} />;
      case 'contract': return <FileCheck size={16} />;
      case 'photo': return <Camera size={16} />;
      default: return <File size={16} />;
    }
  };

  const getDocumentTypeLabel = (type: string) => {
    switch (type) {
      case 'plan': return 'Plan';
      case 'permit': return 'Genehmigung';
      case 'quote': return 'Angebot';
      case 'invoice': return 'Rechnung';
      case 'contract': return 'Vertrag';
      case 'photo': return 'Foto';
      default: return 'Sonstiges';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-DE');
  };

  const getBudgetProgress = () => {
    if (!project?.budget || project.budget === 0) return 0;
    return Math.min((project.current_costs / project.budget) * 100, 100);
  };

  const getBudgetStatus = () => {
    const progress = getBudgetProgress();
    if (progress < 50) return 'good';
    if (progress < 80) return 'warning';
    return 'danger';
  };

  const getProjectQuotes = () => {
    return quotes.filter(quote => quote.project_id === project?.id);
  };

  // Gefilterte Angebote für das aktuelle Projekt
  const getFilteredProjectQuotes = () => {
    const projectQuotes = getProjectQuotes();
    
    return projectQuotes.filter(quote => {
      const matchesSearch = quote.title.toLowerCase().includes(quoteSearchTerm.toLowerCase()) ||
                           quote.description.toLowerCase().includes(quoteSearchTerm.toLowerCase());
      
      const matchesFilter = quoteFilterStatus === 'all' || quote.status === quoteFilterStatus;
      
      return matchesSearch && matchesFilter;
    });
  };

  const getQuoteStatusLabel = (status: string) => {
    switch (status) {
      case 'submitted': return 'Eingereicht';
      case 'accepted': return 'Akzeptiert';
      case 'rejected': return 'Abgelehnt';
      case 'under_review': return 'In Prüfung';
      case 'draft': return 'Entwurf';
      case 'expired': return 'Abgelaufen';
      default: return status;
    }
  };

  const getQuoteStatusColor = (status: string) => {
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

  const getTradeStatusLabel = (status: string) => {
    switch (status) {
      case 'planned': return 'Geplant';
      case 'in_progress': return 'In Bearbeitung';
      case 'completed': return 'Abgeschlossen';
      case 'delayed': return 'Verzögert';
      case 'cancelled': return 'Abgebrochen';
      default: return status;
    }
  };

  const getTradeStatusColor = (status: string) => {
    switch (status) {
      case 'planned': return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'in_progress': return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      case 'completed': return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'delayed': return 'bg-orange-500/20 text-orange-300 border-orange-500/30';
      case 'cancelled': return 'bg-red-500/20 text-red-300 border-red-500/30';
      default: return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  };

  const getTradePriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return 'bg-green-500/20 text-green-300';
      case 'medium': return 'bg-yellow-500/20 text-yellow-300';
      case 'high': return 'bg-orange-500/20 text-orange-300';
      case 'critical': return 'bg-red-500/20 text-red-300';
      default: return 'bg-gray-500/20 text-gray-300';
    }
  };

  const getTradePriorityLabel = (priority: string) => {
    switch (priority) {
      case 'low': return 'Niedrig';
      case 'medium': return 'Mittel';
      case 'high': return 'Hoch';
      case 'critical': return 'Kritisch';
      default: return priority;
    }
  };

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'tasks':
        navigate(`/tasks?project=${project?.id}`);
        break;
      case 'documents':
        navigate(`/documents?project=${project?.id}`);
        break;
      case 'quotes':
        navigate('/quotes');
        break;
      case 'finance':
        navigate(`/finance?project=${project?.id}`);
        break;
      case 'analytics':
        navigate(`/project/${project?.id}/analytics`);
        break;
      case 'messages':
        navigate(`/project/${project?.id}/messages`);
        break;
      default:
        break;
    }
  };

  const handleEditProject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!project?.id) return;
      
      await updateProject(project.id, editForm);
      setShowEditModal(false);
      // Lade Projektdaten neu
      await loadProjectData();
    } catch (error) {
      console.error('Error updating project:', error);
      setError('Fehler beim Aktualisieren des Projekts');
    }
  };

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleAddTrade = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Implementiere die Logik zum Hinzufügen eines neuen Gewerks
      console.log('Neues Gewerk hinzugefügt:', tradeForm);
      setShowAddTradeModal(false);
      // Lade Projektdaten neu
      await loadProjectData();
    } catch (error) {
      console.error('Error adding trade:', error);
      setError('Fehler beim Hinzufügen des Gewerks');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#51646f] via-[#3d4952] to-[#2c3539] flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle size={48} className="text-red-400 mx-auto mb-4" />
          <p className="text-white text-lg">{error || 'Projekt nicht gefunden'}</p>
          <button
            onClick={() => navigate('/projects')}
            className="mt-4 px-6 py-2 bg-[#ffbd59] text-[#3d4952] rounded-lg font-semibold hover:bg-[#ffa726] transition"
          >
            Zurück zu Projekten
          </button>
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
              onClick={() => navigate('/projects')}
              className="p-2 bg-[#51646f] hover:bg-[#607583] rounded-xl transition-colors duration-300"
            >
              <ArrowLeft size={20} className="text-[#ffbd59]" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-[#ffbd59]">{project?.name}</h1>
              <p className="text-gray-300">{project?.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium backdrop-blur-md border ${getStatusColor(project?.status || '')}`}>
              {getStatusLabel(project?.status || '')}
            </span>
          </div>
        </div>
      </header>

      <div className="p-8">
        {/* Schnellaktionen */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Settings size={20} className="text-[#ffbd59]" />
            Schnellaktionen
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button
              onClick={() => handleQuickAction('tasks')}
              className="bg-white/10 backdrop-blur-lg rounded-xl p-4 text-center hover:bg-white/20 transition-all duration-300 border border-white/20"
            >
              <Plus size={24} className="text-[#ffbd59] mx-auto mb-2" />
              <span className="text-white text-sm font-medium">Aufgabe hinzufügen</span>
            </button>
            <button
              onClick={() => handleQuickAction('documents')}
              className="bg-white/10 backdrop-blur-lg rounded-xl p-4 text-center hover:bg-white/20 transition-all duration-300 border border-white/20"
            >
              <FileText size={24} className="text-[#ffbd59] mx-auto mb-2" />
              <span className="text-white text-sm font-medium">Dokument hochladen</span>
            </button>
            <button
              onClick={() => handleQuickAction('quotes')}
              className="bg-white/10 backdrop-blur-lg rounded-xl p-4 text-center hover:bg-white/20 transition-all duration-300 border border-white/20"
            >
              <Receipt size={24} className="text-[#ffbd59] mx-auto mb-2" />
              <span className="text-white text-sm font-medium">Angebote anzeigen</span>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="flex space-x-1 bg-white/10 backdrop-blur-lg rounded-xl p-1">
            {[
              { id: 'overview', label: 'Übersicht', icon: <Home size={16} /> },
              { id: 'tasks', label: 'Aufgaben', icon: <ListTodo size={16} /> },
              { id: 'documents', label: 'Dokumente', icon: <FileText size={16} /> },
              { id: 'quotes', label: 'Angebote', icon: <Receipt size={16} /> }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                  activeTab === tab.id
                    ? 'bg-[#ffbd59] text-[#3d4952] shadow-lg'
                    : 'text-gray-300 hover:text-white hover:bg-white/10'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Projekt-Statistiken */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-500/20 rounded-lg">
                      <ListTodo size={20} className="text-blue-300" />
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">Aufgaben</p>
                      <p className="text-white text-xl font-bold">{dashboard?.task_count || 0}</p>
                      <p className="text-green-400 text-xs">
                        {dashboard?.completed_tasks || 0} abgeschlossen
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-500/20 rounded-lg">
                      <FileText size={20} className="text-green-300" />
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">Dokumente</p>
                      <p className="text-white text-xl font-bold">{dashboard?.document_count || 0}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-yellow-500/20 rounded-lg">
                      <Receipt size={20} className="text-yellow-300" />
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">Angebote</p>
                      <p className="text-white text-xl font-bold">{dashboard?.quote_count || 0}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-500/20 rounded-lg">
                      <TrendingUp size={20} className="text-purple-300" />
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">Fortschritt</p>
                      <p className="text-white text-xl font-bold">{project?.progress_percentage || 0}%</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Aufklappbare Kacheln */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Projekt-Details */}
                <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
                  <button
                    onClick={() => toggleSection('projectDetails')}
                    className="w-full p-6 text-left hover:bg-white/5 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <Map size={20} className="text-[#ffbd59]" />
                        Übersicht
                  </h3>
                      <div className={`transform transition-transform ${expandedSections.projectDetails ? 'rotate-180' : ''}`}>
                        <svg className="w-5 h-5 text-[#ffbd59]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </button>
                  
                  {expandedSections.projectDetails && (
                    <div className="px-6 pb-6 space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Typ:</span>
                      <span className="text-white">{getProjectTypeLabel(project?.project_type || '')}</span>
                    </div>
                    {project?.address && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">Adresse:</span>
                        <span className="text-white">{project.address}</span>
                      </div>
                    )}
                    {project?.property_size && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">Grundstücksgröße:</span>
                        <span className="text-white">{project.property_size} m²</span>
                      </div>
                    )}
                    {project?.construction_area && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">Baufläche:</span>
                        <span className="text-white">{project.construction_area} m²</span>
                      </div>
                    )}
                    {project?.estimated_duration && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">Geschätzte Dauer:</span>
                        <span className="text-white">{project.estimated_duration} Tage</span>
                      </div>
                    )}
                  </div>
                  )}
                </div>

                {/* Aufgaben */}
                <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
                  <button
                    onClick={() => toggleSection('tasks')}
                    className="w-full p-6 text-left hover:bg-white/5 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                        <ListTodo size={20} className="text-[#ffbd59]" />
                        To Do
                      </h3>
                      <div className={`transform transition-transform ${expandedSections.tasks ? 'rotate-180' : ''}`}>
                        <svg className="w-5 h-5 text-[#ffbd59]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </button>
                  
                  {expandedSections.tasks && (
                    <div className="px-6 pb-6 space-y-3">
                      {tasks.length === 0 ? (
                        <p className="text-gray-400 text-sm">Keine Aufgaben vorhanden</p>
                      ) : (
                        <div className="space-y-2">
                          {tasks.slice(0, 3).map((task) => (
                            <div
                              key={task.id}
                              className="flex items-center gap-3 p-2 bg-white/10 rounded-lg cursor-pointer hover:bg-white/20 transition-colors"
                              onClick={() => navigate(`/tasks?project=${project?.id}`)}
                            >
                              <div className="p-1 bg-blue-500/20 rounded">
                                {getTaskStatusIcon(task.status)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="text-white text-sm font-medium truncate">{task.title}</div>
                                <div className="text-gray-400 text-xs">
                                  {task.status === 'todo' ? 'To Do' :
                                   task.status === 'in_progress' ? 'In Bearbeitung' :
                                   task.status === 'review' ? 'In Prüfung' :
                                   task.status === 'completed' ? 'Abgeschlossen' : 'Abgebrochen'}
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-white text-xs font-medium">{task.progress_percentage}%</div>
                                <div className="w-12 bg-gray-700/50 rounded-full h-1">
                                  <div 
                                    className="bg-[#ffbd59] h-1 rounded-full transition-all duration-300"
                                    style={{ width: `${task.progress_percentage}%` }}
                                  />
                                </div>
                              </div>
                            </div>
                          ))}
                          {tasks.length > 3 && (
                            <button
                              onClick={() => navigate(`/tasks?project=${project?.id}`)}
                              className="w-full text-center text-[#ffbd59] text-sm hover:underline"
                            >
                              +{tasks.length - 3} weitere Aufgaben anzeigen
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Phasen */}
                <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
                  <button
                    onClick={() => toggleSection('phases')}
                    className="w-full p-6 text-left hover:bg-white/5 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                        <Users size={20} className="text-[#ffbd59]" />
                        Phasen
                      </h3>
                      <div className={`transform transition-transform ${expandedSections.phases ? 'rotate-180' : ''}`}>
                        <svg className="w-5 h-5 text-[#ffbd59]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </button>
                  
                  {expandedSections.phases && (
                    <div className="px-6 pb-6 space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-white/10 rounded-lg p-3">
                          <div className="text-white font-medium text-sm">Planung</div>
                          <div className="text-green-400 text-xs">Abgeschlossen</div>
                        </div>
                        <div className="bg-white/10 rounded-lg p-3">
                          <div className="text-white font-medium text-sm">Vorbereitung</div>
                          <div className="text-blue-400 text-xs">In Bearbeitung</div>
                        </div>
                        <div className="bg-white/10 rounded-lg p-3">
                          <div className="text-white font-medium text-sm">Ausführung</div>
                          <div className="text-yellow-400 text-xs">Geplant</div>
                        </div>
                        <div className="bg-white/10 rounded-lg p-3">
                          <div className="text-white font-medium text-sm">Fertigstellung</div>
                          <div className="text-gray-400 text-xs">Offen</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Gewerke */}
                <TradesCard 
                  trades={trades}
                  projectId={project?.id}
                  isExpanded={expandedSections.trades}
                  onToggle={() => toggleSection('trades')}
                />

                {/* Budget & Zeitplan */}
                <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
                  <button
                    onClick={() => toggleSection('budgetTimeline')}
                    className="w-full p-6 text-left hover:bg-white/5 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <DollarSign size={20} className="text-[#ffbd59]" />
                        Budget
                  </h3>
                      <div className={`transform transition-transform ${expandedSections.budgetTimeline ? 'rotate-180' : ''}`}>
                        <svg className="w-5 h-5 text-[#ffbd59]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </button>
                  
                  {expandedSections.budgetTimeline && (
                    <div className="px-6 pb-6 space-y-4">
                    {project?.budget && (
                      <div>
                        <div className="flex justify-between mb-2">
                          <span className="text-gray-400">Budget:</span>
                          <span className="text-white">{project.budget.toLocaleString('de-DE')} €</span>
                        </div>
                        <div className="flex justify-between mb-2">
                          <span className="text-gray-400">Aktuelle Kosten:</span>
                          <span className="text-white">{project.current_costs.toLocaleString('de-DE')} €</span>
                        </div>
                        <div className="w-full bg-gray-700/50 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full transition-all duration-1000 ${
                              getBudgetStatus() === 'good' ? 'bg-green-500' :
                              getBudgetStatus() === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${getBudgetProgress()}%` }}
                          />
                        </div>
                      </div>
                    )}
                    
                    {project?.start_date && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">Startdatum:</span>
                        <span className="text-white">{formatDate(project.start_date)}</span>
                      </div>
                    )}
                    {project?.end_date && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">Enddatum:</span>
                        <span className="text-white">{formatDate(project.end_date)}</span>
                      </div>
                    )}
                  </div>
                  )}
                </div>

                {/* Angebote */}
                <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
                  <button
                    onClick={() => toggleSection('quotes')}
                    className="w-full p-6 text-left hover:bg-white/5 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                        <Receipt size={20} className="text-[#ffbd59]" />
                        Angebote
                      </h3>
                      <div className={`transform transition-transform ${expandedSections.quotes ? 'rotate-180' : ''}`}>
                        <svg className="w-5 h-5 text-[#ffbd59]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
              </div>
            </div>
                  </button>
                  
                  {expandedSections.quotes && (
                    <div className="px-6 pb-6 space-y-3">
                      {/* Filter-Bereich */}
                      <div className="flex flex-col gap-3 mb-4">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                          <input
                            type="text"
                            placeholder="Angebote durchsuchen..."
                            value={quoteSearchTerm}
                            onChange={(e) => setQuoteSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 bg-white/10 backdrop-blur-lg border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent text-sm"
                          />
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Filter className="text-gray-400" size={16} />
                          <select
                            value={quoteFilterStatus}
                            onChange={(e) => setQuoteFilterStatus(e.target.value)}
                            className="flex-1 py-2 px-3 bg-white/10 backdrop-blur-lg border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent appearance-none cursor-pointer text-sm"
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

                      {getFilteredProjectQuotes().length === 0 ? (
                        <div className="text-center py-12">
                          <Receipt size={48} className="text-gray-400 mx-auto mb-4" />
                          <h4 className="text-white text-lg font-medium mb-2">Noch keine Angebote vorhanden</h4>
                          <p className="text-gray-400 mb-6">
                            Dienstleister können hier direkt Angebote für Ihr Projekt erstellen und einreichen.
                          </p>
                          
                          {/* Info-Box für zukünftige Backend-Integration */}
                          <div className="max-w-md mx-auto p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                            <div className="flex items-start gap-3">
                              <div className="p-2 bg-blue-500/20 rounded-lg">
                                <svg className="w-5 h-5 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              </div>
                              <div className="text-sm text-blue-300">
                                <p className="font-medium mb-1">Dienstleister-Integration geplant</p>
                                <p className="text-xs">
                                  In der nächsten Version können registrierte Dienstleister:
                                </p>
                                <ul className="text-xs mt-2 space-y-1">
                                  <li>• Direkt Angebote für Ihr Projekt erstellen</li>
                                  <li>• Detaillierte Kostenvoranschläge einreichen</li>
                                  <li>• Zeitpläne und Bedingungen angeben</li>
                                  <li>• Dokumente und Referenzen anhängen</li>
                                </ul>
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {getFilteredProjectQuotes().map((quote) => (
                            <div
                              key={quote.id}
                              className="bg-white/5 rounded-xl p-4 border border-white/10 hover:bg-white/10 transition-all duration-300 cursor-pointer"
                              onClick={() => navigate(`/quotes?project=${project?.id}`)}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className="p-2 bg-yellow-500/20 rounded-lg">
                                    <Receipt size={20} className="text-yellow-300" />
                                  </div>
                                  <div>
                                    <h4 className="text-white font-medium">{quote.title}</h4>
                                    <p className="text-gray-400 text-sm">
                                      {quote.service_provider_name || 'Dienstleister'} • {quote.total_amount?.toLocaleString('de-DE')} €
                                    </p>
                                    {quote.description && (
                                      <p className="text-gray-500 text-sm mt-1 line-clamp-2">{quote.description}</p>
                                    )}
                                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                                      <span>Projekt-ID: {quote.project_id}</span>
                                      <span>Erstellt: {formatDate(quote.created_at)}</span>
                                      {quote.valid_until && (
                                        <span>Gültig bis: {formatDate(quote.valid_until)}</span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-3">
                                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getQuoteStatusColor(quote.status)}`}>
                                    {getQuoteStatusLabel(quote.status)}
                                  </span>
                                  {quote.risk_score && (
                                    <div className="text-right">
                                      <div className="text-white text-sm font-medium">
                                        Risiko: {quote.risk_score.toFixed(1)}%
                                      </div>
                                      <div className="w-16 bg-gray-700/50 rounded-full h-1">
                                        <div 
                                          className={`h-1 rounded-full transition-all duration-300 ${
                                            quote.risk_score < 30 ? 'bg-green-500' :
                                            quote.risk_score < 60 ? 'bg-yellow-500' : 'bg-red-500'
                                          }`}
                                          style={{ width: `${quote.risk_score}%` }}
                                        />
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Dokumente-Übersicht */}
                <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
                  <button
                    onClick={() => toggleSection('documents')}
                    className="w-full p-6 text-left hover:bg-white/5 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                        <FileText size={20} className="text-[#ffbd59]" />
                        Dokumente
                      </h3>
                      <div className={`transform transition-transform ${expandedSections.documents ? 'rotate-180' : ''}`}>
                        <svg className="w-5 h-5 text-[#ffbd59]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </button>
                  
                  {expandedSections.documents && (
                    <div className="px-6 pb-6 space-y-3">
                      {documents.length === 0 ? (
                        <p className="text-gray-400 text-sm">Keine Dokumente vorhanden</p>
                      ) : (
                        <div className="space-y-2">
                          {documents.slice(0, 3).map((document) => (
                            <div
                              key={document.id}
                              className="flex items-center gap-3 p-2 bg-white/10 rounded-lg cursor-pointer hover:bg-white/20 transition-colors"
                              onClick={() => navigate(`/documents?project=${project?.id}`)}
                            >
                              <div className="p-1 bg-blue-500/20 rounded">
                                {getDocumentTypeIcon(document.document_type)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="text-white text-sm font-medium truncate">{document.title}</div>
                                <div className="text-gray-400 text-xs">{formatFileSize(document.file_size)}</div>
                              </div>
                            </div>
                          ))}
                          {documents.length > 3 && (
                            <button
                              onClick={() => navigate(`/documents?project=${project?.id}`)}
                              className="w-full text-center text-[#ffbd59] text-sm hover:underline"
                            >
                              +{documents.length - 3} weitere Dokumente anzeigen
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Analytics */}
                <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
                  <button
                    onClick={() => toggleSection('analytics')}
                    className="w-full p-6 text-left hover:bg-white/5 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                        <BarChart3 size={20} className="text-[#ffbd59]" />
                        Analytics
                      </h3>
                      <div className={`transform transition-transform ${expandedSections.analytics ? 'rotate-180' : ''}`}>
                        <svg className="w-5 h-5 text-[#ffbd59]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </button>
                  
                  {expandedSections.analytics && (
                    <div className="px-6 pb-6 space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-white/10 rounded-lg p-3">
                          <div className="text-white font-medium text-sm">Projektfortschritt</div>
                          <div className="text-[#ffbd59] text-lg font-bold">{project?.progress_percentage || 0}%</div>
                        </div>
                        <div className="bg-white/10 rounded-lg p-3">
                          <div className="text-white font-medium text-sm">Aufgaben</div>
                          <div className="text-blue-400 text-lg font-bold">{dashboard?.task_count || 0}</div>
                        </div>
                        <div className="bg-white/10 rounded-lg p-3">
                          <div className="text-white font-medium text-sm">Dokumente</div>
                          <div className="text-green-400 text-lg font-bold">{dashboard?.document_count || 0}</div>
                        </div>
                        <div className="bg-white/10 rounded-lg p-3">
                          <div className="text-white font-medium text-sm">Angebote</div>
                          <div className="text-yellow-400 text-lg font-bold">{dashboard?.quote_count || 0}</div>
                        </div>
                      </div>
                      <button
                        onClick={() => navigate(`/project/${project?.id}/analytics`)}
                        className="w-full text-center text-[#ffbd59] text-sm hover:underline"
                      >
                        Detaillierte Analytics anzeigen
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'tasks' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-white">Aufgaben ({tasks.length})</h3>
                <button
                  onClick={() => handleQuickAction('tasks')}
                  className="flex items-center gap-2 px-4 py-2 bg-[#ffbd59] text-[#3d4952] rounded-lg font-semibold hover:bg-[#ffa726] transition"
                >
                  <Plus size={16} />
                  Aufgabe hinzufügen
                </button>
              </div>
              
              {tasks.length === 0 ? (
                <div className="text-center py-12">
                  <ListTodo size={48} className="text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-400">Keine Aufgaben für dieses Projekt vorhanden.</p>
                  <button
                    onClick={() => handleQuickAction('tasks')}
                    className="mt-4 px-6 py-2 bg-[#ffbd59] text-[#3d4952] rounded-lg font-semibold hover:bg-[#ffa726] transition"
                  >
                    Erste Aufgabe erstellen
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {tasks.map((task) => (
                    <div
                      key={task.id}
                      className="bg-white/5 rounded-xl p-4 border border-white/10 hover:bg-white/10 transition-all duration-300 cursor-pointer"
                      onClick={() => navigate(`/tasks?project=${project?.id}`)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {getTaskStatusIcon(task.status)}
                          <div>
                            <h4 className="text-white font-medium">{task.title}</h4>
                            <p className="text-gray-400 text-sm">{task.description}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getTaskStatusColor(task.status)}`}>
                            {task.status === 'todo' ? 'To Do' :
                             task.status === 'in_progress' ? 'In Bearbeitung' :
                             task.status === 'review' ? 'In Prüfung' :
                             task.status === 'completed' ? 'Abgeschlossen' : 'Abgebrochen'}
                          </span>
                          {task.is_milestone && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-500/20 text-purple-300">
                              Meilenstein
                            </span>
                          )}
                          <div className="text-right">
                            <div className="text-white text-sm font-medium">{task.progress_percentage}%</div>
                            <div className="w-12 bg-gray-700/50 rounded-full h-1">
                              <div 
                                className="bg-[#ffbd59] h-1 rounded-full transition-all duration-300"
                                style={{ width: `${task.progress_percentage}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'documents' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-white">Dokumente ({documents.length})</h3>
                <button
                  onClick={() => handleQuickAction('documents')}
                  className="flex items-center gap-2 px-4 py-2 bg-[#ffbd59] text-[#3d4952] rounded-lg font-semibold hover:bg-[#ffa726] transition"
                >
                  <Plus size={16} />
                  Dokument hochladen
                </button>
              </div>
              
              {documents.length === 0 ? (
                <div className="text-center py-12">
                  <FileText size={48} className="text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-400">Keine Dokumente für dieses Projekt vorhanden.</p>
                  <button
                    onClick={() => handleQuickAction('documents')}
                    className="mt-4 px-6 py-2 bg-[#ffbd59] text-[#3d4952] rounded-lg font-semibold hover:bg-[#ffa726] transition"
                  >
                    Erstes Dokument hochladen
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {documents.map((document) => (
                    <div
                      key={document.id}
                      className="bg-white/5 rounded-xl p-4 border border-white/10 hover:bg-white/10 transition-all duration-300 cursor-pointer"
                      onClick={() => navigate(`/documents?project=${project?.id}`)}
                    >
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-blue-500/20 rounded-lg">
                          {getDocumentTypeIcon(document.document_type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-white font-medium truncate">{document.title}</h4>
                          <p className="text-gray-400 text-sm truncate">{document.description}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-500/20 text-blue-300">
                              {getDocumentTypeLabel(document.document_type)}
                            </span>
                            <span className="text-gray-400 text-xs">
                              {formatFileSize(document.file_size)}
                            </span>
                          </div>
                          <p className="text-gray-500 text-xs mt-1">
                            {formatDate(document.created_at)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'quotes' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-white">Angebote für Projekt "{project?.name}" ({getProjectQuotes().length})</h3>
                <button
                  onClick={() => handleQuickAction('quotes')}
                  className="flex items-center gap-2 px-4 py-2 bg-[#ffbd59] text-[#3d4952] rounded-lg font-semibold hover:bg-[#ffa726] transition"
                >
                  <Eye size={16} />
                  Alle Angebote anzeigen
                </button>
              </div>
              
              {quotes.length === 0 ? (
              <div className="text-center py-12">
                <Receipt size={48} className="text-gray-400 mx-auto mb-4" />
                  <h4 className="text-white text-lg font-medium mb-2">Noch keine Angebote vorhanden</h4>
                  <p className="text-gray-400 mb-6">
                    Dienstleister können hier direkt Angebote für Ihr Projekt erstellen und einreichen.
                  </p>
                  
                  {/* Info-Box für zukünftige Backend-Integration */}
                  <div className="max-w-md mx-auto p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-blue-500/20 rounded-lg">
                        <svg className="w-5 h-5 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div className="text-sm text-blue-300">
                        <p className="font-medium mb-1">Dienstleister-Integration geplant</p>
                        <p className="text-xs">
                          In der nächsten Version können registrierte Dienstleister:
                        </p>
                        <ul className="text-xs mt-2 space-y-1">
                          <li>• Direkt Angebote für Ihr Projekt erstellen</li>
                          <li>• Detaillierte Kostenvoranschläge einreichen</li>
                          <li>• Zeitpläne und Bedingungen angeben</li>
                          <li>• Dokumente und Referenzen anhängen</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {getProjectQuotes().map((quote) => (
                    <div
                      key={quote.id}
                      className="bg-white/5 rounded-xl p-4 border border-white/10 hover:bg-white/10 transition-all duration-300 cursor-pointer"
                      onClick={() => navigate(`/quotes?project=${project?.id}`)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-yellow-500/20 rounded-lg">
                            <Receipt size={20} className="text-yellow-300" />
                          </div>
                          <div>
                            <h4 className="text-white font-medium">{quote.title}</h4>
                            <p className="text-gray-400 text-sm">
                              {quote.service_provider_name || 'Dienstleister'} • {quote.total_amount?.toLocaleString('de-DE')} €
                            </p>
                            {quote.description && (
                              <p className="text-gray-500 text-sm mt-1 line-clamp-2">{quote.description}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getQuoteStatusColor(quote.status)}`}>
                            {getQuoteStatusLabel(quote.status)}
                          </span>
                          {quote.risk_score && (
                            <div className="text-right">
                              <div className="text-white text-sm font-medium">
                                Risiko: {quote.risk_score.toFixed(1)}%
                              </div>
                              <div className="w-16 bg-gray-700/50 rounded-full h-1">
                                <div 
                                  className={`h-1 rounded-full transition-all duration-300 ${
                                    quote.risk_score < 30 ? 'bg-green-500' :
                                    quote.risk_score < 60 ? 'bg-yellow-500' : 'bg-red-500'
                                  }`}
                                  style={{ width: `${quote.risk_score}%` }}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Edit Project Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-[#3d4952]">Projekt bearbeiten</h2>
                <button
                onClick={() => setShowEditModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
                >
                <X size={20} />
                </button>
              </div>
            
            <form onSubmit={handleEditProject} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Projektname *
                  </label>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent"
                    required
                  />
            </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Projekttyp *
                  </label>
                  <select
                    value={editForm.project_type}
                    onChange={(e) => setEditForm({...editForm, project_type: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent"
                    required
                  >
                    <option value="">Typ auswählen</option>
                    <option value="new_build">Neubau</option>
                    <option value="renovation">Renovierung</option>
                    <option value="extension">Anbau</option>
                    <option value="refurbishment">Sanierung</option>
                  </select>
        </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status *
                  </label>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm({...editForm, status: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent"
                    required
                  >
                    <option value="">Status auswählen</option>
                    <option value="planning">Planung</option>
                    <option value="preparation">Vorbereitung</option>
                    <option value="execution">Ausführung</option>
                    <option value="completion">Fertigstellung</option>
                    <option value="completed">Abgeschlossen</option>
                    <option value="on_hold">Pausiert</option>
                    <option value="cancelled">Abgebrochen</option>
                  </select>
      </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Budget (€)
                  </label>
                  <input
                    type="number"
                    value={editForm.budget}
                    onChange={(e) => setEditForm({...editForm, budget: parseFloat(e.target.value) || 0})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Startdatum
                  </label>
                  <input
                    type="date"
                    value={editForm.start_date}
                    onChange={(e) => setEditForm({...editForm, start_date: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Enddatum
                  </label>
                  <input
                    type="date"
                    value={editForm.end_date}
                    onChange={(e) => setEditForm({...editForm, end_date: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Adresse
                </label>
                <input
                  type="text"
                  value={editForm.address}
                  onChange={(e) => setEditForm({...editForm, address: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Grundstücksgröße (m²)
                  </label>
                  <input
                    type="number"
                    value={editForm.property_size}
                    onChange={(e) => setEditForm({...editForm, property_size: parseFloat(e.target.value) || 0})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Baufläche (m²)
                  </label>
                  <input
                    type="number"
                    value={editForm.construction_area}
                    onChange={(e) => setEditForm({...editForm, construction_area: parseFloat(e.target.value) || 0})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Beschreibung
                </label>
                <textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent"
                />
              </div>
              
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={editForm.is_public}
                    onChange={(e) => setEditForm({...editForm, is_public: e.target.checked})}
                    className="rounded border-gray-300 text-[#ffbd59] focus:ring-[#ffbd59]"
                  />
                  <span className="text-sm text-gray-700">Öffentlich sichtbar</span>
                </label>
                
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={editForm.allow_quotes}
                    onChange={(e) => setEditForm({...editForm, allow_quotes: e.target.checked})}
                    className="rounded border-gray-300 text-[#ffbd59] focus:ring-[#ffbd59]"
                  />
                  <span className="text-sm text-gray-700">Angebote erlauben</span>
                </label>
              </div>
              
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-[#ffbd59] text-[#3d4952] rounded-lg font-semibold hover:bg-[#ffa726] transition"
                >
                  Speichern
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
} 