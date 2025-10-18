import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Building, 
  Users, 
  Calendar, 
  Euro, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle,
  Clock,
  FileText,
  Handshake,
  Eye,
  MapPin,
  Target,
  BarChart3,
  Filter,
  Search,
  Plus,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Download,
  RefreshCw,
  Settings,
  Grid,
  List,
  PieChart,
  Activity
} from 'lucide-react';
import { getProjects } from '../api/projectService';
import { getTasks } from '../api/taskService';
import { getDocuments } from '../api/documentService';
import { getQuotes, getQuoteStatistics } from '../api/quoteService';
import { getMilestones } from '../api/milestoneService';
import { financeAnalyticsService } from '../api/financeAnalyticsService';
import { expenseService } from '../api/expenseService';
import {
  PieChart as RePieChart,
  Pie,
  Cell,
  Tooltip as ReTooltip,
  Legend as ReLegend,
  ResponsiveContainer
} from 'recharts';

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

interface GlobalStats {
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  totalBudget: number;
  totalSpent: number;
  totalTasks: number;
  completedTasks: number;
  totalDocuments: number;
  totalQuotes: number;
  totalMilestones: number;
  overdueTasks: number;
  upcomingMilestones: number;
}

interface ProjectDetails {
  projectId: number;
  quotes: any[];
  quoteStats: any;
  financeData: any;
  expenses: any[];
  loading: boolean;
  error: string | null;
}

export default function GlobalProjects() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [globalStats, setGlobalStats] = useState<GlobalStats>({
    totalProjects: 0,
    activeProjects: 0,
    completedProjects: 0,
    totalBudget: 0,
    totalSpent: 0,
    totalTasks: 0,
    completedTasks: 0,
    totalDocuments: 0,
    totalQuotes: 0,
    totalMilestones: 0,
    overdueTasks: 0,
    upcomingMilestones: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'name' | 'status' | 'progress' | 'budget' | 'date'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedProject, setExpandedProject] = useState<number | null>(null);
  const [showProjectDetails, setShowProjectDetails] = useState<{ [projectId: number]: boolean }>({});
  const [projectDetailsData, setProjectDetailsData] = useState<{ [projectId: number]: ProjectDetails }>({});

  useEffect(() => {
    loadGlobalData();
  }, []);

  const loadGlobalData = async () => {
    setLoading(true);
    try {
      // Lade alle Projekte
      const projectsData = await getProjects();
      setProjects(projectsData);

      // Lade globale Statistiken
      await loadGlobalStats(projectsData);

    } catch (e: any) {
      console.error('❌ Error loading global data:', e);
      setError(e.message || 'Fehler beim Laden der globalen Daten');
    } finally {
      setLoading(false);
    }
  };

  const loadGlobalStats = async (projectsData: Project[]) => {
    try {
      let totalTasks = 0;
      let completedTasks = 0;
      let overdueTasks = 0;
      let totalDocuments = 0;
      let totalQuotes = 0;
      let totalMilestones = 0;
      let upcomingMilestones = 0;

      // Sammle Daten aus allen Projekten
      for (const project of projectsData) {
        try {
          // Tasks für dieses Projekt
          const tasks = await getTasks(project.id);
          totalTasks += tasks.length;
          completedTasks += tasks.filter((t: any) => t.status === 'completed').length;
          overdueTasks += tasks.filter((t: any) => {
            if (t.due_date && t.status !== 'completed') {
              return new Date(t.due_date) < new Date();
            }
            return false;
          }).length;

          // Dokumente für dieses Projekt
          const documents = await getDocuments(project.id);
          totalDocuments += documents.length;

          // Angebote für dieses Projekt
          const quotes = await getQuotes(project.id);
          totalQuotes += quotes.length;

          // Meilensteine für dieses Projekt
          const milestones = await getMilestones(project.id);
          totalMilestones += milestones.length;
          upcomingMilestones += milestones.filter((m: any) => {
            if (m.planned_date) {
              const plannedDate = new Date(m.planned_date);
              const now = new Date();
              const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
              return plannedDate >= now && plannedDate <= thirtyDaysFromNow;
            }
            return false;
          }).length;

        } catch (error) {
          console.warn(`Fehler beim Laden der Daten für Projekt ${project.id}:`, error);
        }
      }

      // Berechne globale Statistiken
      const totalBudget = projectsData.reduce((sum, p) => sum + (p.budget || 0), 0);
      const totalSpent = projectsData.reduce((sum, p) => sum + p.current_costs, 0);
      const activeProjects = projectsData.filter(p => 
        ['planning', 'preparation', 'execution', 'completion'].includes(p.status)
      ).length;
      const completedProjects = projectsData.filter(p => p.status === 'completed').length;

      setGlobalStats({
        totalProjects: projectsData.length,
        activeProjects,
        completedProjects,
        totalBudget,
        totalSpent,
        totalTasks,
        completedTasks,
        totalDocuments,
        totalQuotes,
        totalMilestones,
        overdueTasks,
        upcomingMilestones
      });

    } catch (error) {
      console.error('Fehler beim Laden der globalen Statistiken:', error);
    }
  };

  const getFilteredAndSortedProjects = () => {
    let filtered = projects;

    // Filter nach Status
    if (filterStatus !== 'all') {
      filtered = filtered.filter(p => p.status === filterStatus);
    }

    // Filter nach Suchbegriff
    if (searchTerm) {
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.address?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Sortierung
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;

      switch (sortBy) {
        case 'name':
          aValue = a.name;
          bValue = b.name;
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        case 'progress':
          aValue = a.progress_percentage;
          bValue = b.progress_percentage;
          break;
        case 'budget':
          aValue = a.budget || 0;
          bValue = b.budget || 0;
          break;
        case 'date':
          aValue = new Date(a.created_at);
          bValue = new Date(b.created_at);
          break;
        default:
          aValue = a.name;
          bValue = b.name;
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
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
      case 'planning': return 'bg-blue-500';
      case 'preparation': return 'bg-yellow-500';
      case 'execution': return 'bg-green-500';
      case 'completion': return 'bg-purple-500';
      case 'completed': return 'bg-green-600';
      case 'on_hold': return 'bg-orange-500';
      case 'cancelled': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-DE');
  };

  const handleProjectClick = (projectId: number) => {
    navigate(`/project/${projectId}`);
  };

  const toggleProjectDetails = async (projectId: number) => {
    const isCurrentlyShown = showProjectDetails[projectId];
    
    setShowProjectDetails(prev => ({
      ...prev,
      [projectId]: !prev[projectId]
    }));

    // Wenn Details geöffnet werden und noch nicht geladen, lade die Daten
    if (!isCurrentlyShown && !projectDetailsData[projectId]) {
      await loadProjectDetails(projectId);
    }
  };

  const loadProjectDetails = async (projectId: number) => {
    // Initialisiere Loading-State
    setProjectDetailsData(prev => ({
      ...prev,
      [projectId]: {
        projectId,
        quotes: [],
        quoteStats: null,
        financeData: null,
        expenses: [],
        loading: true,
        error: null
      }
    }));

    try {
      // Lade alle benötigten Daten parallel
      const [quotes, quoteStats, financeData, expenses] = await Promise.allSettled([
        getQuotes(projectId),
        getQuoteStatistics(projectId).catch(() => null), // Optional
        financeAnalyticsService.getComprehensiveFinanceAnalytics(projectId).catch(() => null), // Optional
        expenseService.getExpenses(projectId).catch(() => []) // Optional
      ]);

      setProjectDetailsData(prev => ({
        ...prev,
        [projectId]: {
          projectId,
          quotes: quotes.status === 'fulfilled' ? quotes.value : [],
          quoteStats: quoteStats.status === 'fulfilled' ? quoteStats.value : null,
          financeData: financeData.status === 'fulfilled' ? financeData.value : null,
          expenses: expenses.status === 'fulfilled' ? expenses.value : [],
          loading: false,
          error: null
        }
      }));

    } catch (error: any) {
      console.error(`❌ Fehler beim Laden der Details für Projekt ${projectId}:`, error);
      setProjectDetailsData(prev => ({
        ...prev,
        [projectId]: {
          projectId,
          quotes: [],
          quoteStats: null,
          financeData: null,
          expenses: [],
          loading: false,
          error: error.message || 'Fehler beim Laden der Projektdetails'
        }
      }));
    }
  };

  const handleRefresh = () => {
    loadGlobalData();
  };

  const filteredProjects = getFilteredAndSortedProjects();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460] flex items-center justify-center relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-[#ffbd59]/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl animate-pulse delay-2000"></div>
        </div>
        
        <div className="text-center relative z-10">
          <div className="bg-white/15 backdrop-blur-2xl rounded-2xl p-8 shadow-2xl border border-white/30 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-50"></div>
            <div className="relative z-10">
              <div className="animate-spin rounded-full h-20 w-20 border-b-4 border-[#ffbd59] mx-auto mb-6 shadow-[0_0_30px_rgba(255,189,89,0.5)]"></div>
              <p className="text-white text-xl font-semibold mb-2">Lade globale Projektdaten...</p>
              <p className="text-gray-300 text-sm">Bitte warten Sie einen Moment</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460] relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-[#ffbd59]/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl animate-pulse delay-2000"></div>
      </div>

      {/* Header */}
      <header className="relative z-10 bg-gradient-to-r from-[#2c3539]/90 to-[#3d4952]/90 backdrop-blur-2xl text-white px-8 py-6 shadow-2xl border-b border-[#ffbd59]/40 relative overflow-hidden">
        {/* Enhanced Glassmorphism overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-white/10 via-white/5 to-white/10 backdrop-blur-xl"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-[#ffbd59]/5 to-transparent opacity-50"></div>
        
        <div className="relative z-10">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-[#ffbd59] to-[#ffa726] rounded-2xl flex items-center justify-center shadow-2xl relative overflow-hidden group hover:scale-110 transition-all duration-500">
                <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="absolute inset-0 shadow-[0_0_40px_rgba(255,189,89,0.8)] opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl"></div>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-pulse"></div>
                <Building size={32} className="text-[#2c3539] relative z-10 group-hover:scale-110 transition-transform duration-300" />
              </div>
              <div>
                <h1 className="text-4xl font-extrabold bg-gradient-to-r from-white via-[#ffbd59] to-white bg-clip-text text-transparent drop-shadow-lg">
                  Globale Projektsicht
                </h1>
                <p className="text-lg text-gray-300 drop-shadow-md">Übersicht aller Projekte und Gesamtstatistiken</p>
              </div>
            </div>
          
          <div className="flex items-center gap-4">
            <button
              onClick={handleRefresh}
              className="flex items-center gap-2 px-6 py-3 bg-white/15 backdrop-blur-xl rounded-xl border border-white/30 hover:bg-white/25 transition-all duration-500 relative overflow-hidden group hover:shadow-[0_0_30px_rgba(255,255,255,0.3)] hover:scale-105 transform"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-pulse"></div>
              <RefreshCw size={20} className="relative z-10 group-hover:rotate-180 transition-transform duration-500" />
              <span className="relative z-10 font-medium">Aktualisieren</span>
            </button>
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#ffbd59] to-[#ffa726] text-[#2c3539] rounded-xl hover:from-[#ffa726] hover:to-[#ff9800] transition-all duration-500 font-semibold relative overflow-hidden group hover:shadow-[0_0_40px_rgba(255,189,89,0.8)] hover:scale-105 transform"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-pulse"></div>
              <ArrowRight size={20} className="relative z-10 group-hover:translate-x-1 transition-transform duration-300" />
              <span className="relative z-10">Zurück zum Dashboard</span>
            </button>
          </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 p-8">
        <div className="max-w-7xl mx-auto">
          {/* Error Banner */}
          {error && (
            <div className="bg-red-500/20 backdrop-blur-xl border border-red-500/40 text-red-300 px-6 py-4 flex items-center justify-between mb-6 rounded-xl shadow-lg hover:shadow-[0_0_20px_rgba(239,68,68,0.3)] transition-all duration-300">
              <div className="flex items-center gap-3">
                <AlertTriangle size={20} />
                <span>{error}</span>
              </div>
              <button onClick={() => setError('')} className="text-red-300 hover:text-red-100 transition-colors">
                <span>×</span>
              </button>
            </div>
          )}
          {/* Enhanced Global Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6 mb-8">
            <div className="bg-white/15 backdrop-blur-2xl rounded-2xl p-6 shadow-2xl border border-white/30 relative overflow-hidden group hover:bg-white/20 transition-all duration-500 hover:shadow-[0_0_40px_rgba(59,130,246,0.4)] hover:border-blue-400/50 hover:scale-105 transform">
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-pulse"></div>
              <div className="flex items-center gap-4 relative z-10">
                <div className="p-3 bg-blue-500/25 rounded-xl group-hover:bg-blue-500/35 transition-all duration-500 group-hover:shadow-[0_0_25px_rgba(59,130,246,0.6)] group-hover:scale-110 transform">
                  <Building size={22} className="text-blue-300 group-hover:text-blue-200 transition-colors duration-300" />
                </div>
                <div>
                  <p className="text-gray-300 text-sm font-medium">Projekte</p>
                  <p className="text-2xl font-bold text-white group-hover:text-blue-100 transition-colors duration-300">{globalStats.totalProjects}</p>
                </div>
              </div>
              <div className="mt-3 text-sm text-gray-400 group-hover:text-gray-300 transition-colors duration-300">
                {globalStats.activeProjects} aktiv • {globalStats.completedProjects} fertig
              </div>
            </div>

            <div className="bg-white/15 backdrop-blur-2xl rounded-2xl p-6 shadow-2xl border border-white/30 relative overflow-hidden group hover:bg-white/20 transition-all duration-500 hover:shadow-[0_0_40px_rgba(34,197,94,0.4)] hover:border-green-400/50 hover:scale-105 transform">
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-green-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-pulse"></div>
              <div className="flex items-center gap-4 relative z-10">
                <div className="p-3 bg-green-500/25 rounded-xl group-hover:bg-green-500/35 transition-all duration-500 group-hover:shadow-[0_0_25px_rgba(34,197,94,0.6)] group-hover:scale-110 transform">
                  <Euro size={22} className="text-green-300 group-hover:text-green-200 transition-colors duration-300" />
                </div>
                <div>
                  <p className="text-gray-300 text-sm font-medium">Budget</p>
                  <p className="text-2xl font-bold text-white group-hover:text-green-100 transition-colors duration-300">{formatCurrency(globalStats.totalBudget / 1000)}k</p>
                </div>
              </div>
              <div className="mt-3 text-sm text-gray-400 group-hover:text-gray-300 transition-colors duration-300">
                {globalStats.totalBudget > 0 ? Math.round((globalStats.totalSpent / globalStats.totalBudget) * 100) : 0}% verbraucht
              </div>
            </div>

            <div className="bg-white/15 backdrop-blur-2xl rounded-2xl p-6 shadow-2xl border border-white/30 relative overflow-hidden group hover:bg-white/20 transition-all duration-500 hover:shadow-[0_0_40px_rgba(147,51,234,0.4)] hover:border-purple-400/50 hover:scale-105 transform">
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-pulse"></div>
              <div className="flex items-center gap-4 relative z-10">
                <div className="p-3 bg-purple-500/25 rounded-xl group-hover:bg-purple-500/35 transition-all duration-500 group-hover:shadow-[0_0_25px_rgba(147,51,234,0.6)] group-hover:scale-110 transform">
                  <CheckCircle size={22} className="text-purple-300 group-hover:text-purple-200 transition-colors duration-300" />
                </div>
                <div>
                  <p className="text-gray-300 text-sm font-medium">Aufgaben</p>
                  <p className="text-2xl font-bold text-white group-hover:text-purple-100 transition-colors duration-300">{globalStats.totalTasks}</p>
                </div>
              </div>
              <div className="mt-3 text-sm text-gray-400 group-hover:text-gray-300 transition-colors duration-300">
                {globalStats.completedTasks} erledigt • {globalStats.overdueTasks} überfällig
              </div>
            </div>

            <div className="bg-white/15 backdrop-blur-2xl rounded-2xl p-6 shadow-2xl border border-white/30 relative overflow-hidden group hover:bg-white/20 transition-all duration-500 hover:shadow-[0_0_40px_rgba(249,115,22,0.4)] hover:border-orange-400/50 hover:scale-105 transform">
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-orange-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-pulse"></div>
              <div className="flex items-center gap-4 relative z-10">
                <div className="p-3 bg-orange-500/25 rounded-xl group-hover:bg-orange-500/35 transition-all duration-500 group-hover:shadow-[0_0_25px_rgba(249,115,22,0.6)] group-hover:scale-110 transform">
                  <FileText size={22} className="text-orange-300 group-hover:text-orange-200 transition-colors duration-300" />
                </div>
                <div>
                  <p className="text-gray-300 text-sm font-medium">Dokumente</p>
                  <p className="text-2xl font-bold text-white group-hover:text-orange-100 transition-colors duration-300">{globalStats.totalDocuments}</p>
                </div>
              </div>
              <div className="mt-3 text-sm text-gray-400 group-hover:text-gray-300 transition-colors duration-300">
                {globalStats.totalQuotes} Angebote
              </div>
            </div>

            <div className="bg-white/15 backdrop-blur-2xl rounded-2xl p-6 shadow-2xl border border-white/30 relative overflow-hidden group hover:bg-white/20 transition-all duration-500 hover:shadow-[0_0_40px_rgba(234,179,8,0.4)] hover:border-yellow-400/50 hover:scale-105 transform">
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-pulse"></div>
              <div className="flex items-center gap-4 relative z-10">
                <div className="p-3 bg-yellow-500/25 rounded-xl group-hover:bg-yellow-500/35 transition-all duration-500 group-hover:shadow-[0_0_25px_rgba(234,179,8,0.6)] group-hover:scale-110 transform">
                  <Target size={22} className="text-yellow-300 group-hover:text-yellow-200 transition-colors duration-300" />
                </div>
                <div>
                  <p className="text-gray-300 text-sm font-medium">Meilensteine</p>
                  <p className="text-2xl font-bold text-white group-hover:text-yellow-100 transition-colors duration-300">{globalStats.totalMilestones}</p>
                </div>
              </div>
              <div className="mt-3 text-sm text-gray-400 group-hover:text-gray-300 transition-colors duration-300">
                {globalStats.upcomingMilestones} anstehend
              </div>
            </div>

            <div className="bg-white/15 backdrop-blur-2xl rounded-2xl p-6 shadow-2xl border border-white/30 relative overflow-hidden group hover:bg-white/20 transition-all duration-500 hover:shadow-[0_0_40px_rgba(239,68,68,0.4)] hover:border-red-400/50 hover:scale-105 transform">
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-red-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-pulse"></div>
              <div className="flex items-center gap-4 relative z-10">
                <div className="p-3 bg-red-500/25 rounded-xl group-hover:bg-red-500/35 transition-all duration-500 group-hover:shadow-[0_0_25px_rgba(239,68,68,0.6)] group-hover:scale-110 transform">
                  <TrendingUp size={22} className="text-red-300 group-hover:text-red-200 transition-colors duration-300" />
                </div>
                <div>
                  <p className="text-gray-300 text-sm font-medium">Ausgaben</p>
                  <p className="text-2xl font-bold text-white group-hover:text-red-100 transition-colors duration-300">{formatCurrency(globalStats.totalSpent / 1000)}k</p>
                </div>
              </div>
              <div className="mt-3 text-sm text-gray-400 group-hover:text-gray-300 transition-colors duration-300">
                von {formatCurrency(globalStats.totalBudget / 1000)}k
              </div>
            </div>
          </div>

          {/* Enhanced Charts Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Budgetauslastung Donut */}
            <div className="bg-white/15 backdrop-blur-2xl rounded-2xl p-6 shadow-2xl border border-white/30 flex flex-col items-center relative overflow-hidden group hover:bg-white/20 transition-all duration-500 hover:shadow-[0_0_50px_rgba(255,189,89,0.3)] hover:border-[#ffbd59]/50 hover:scale-105 transform">
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#ffbd59]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-pulse"></div>
              <h4 className="text-lg font-semibold text-white mb-4 relative z-10 group-hover:text-[#ffbd59] transition-colors duration-300">Budgetauslastung</h4>
              <ResponsiveContainer width="100%" height={180}>
                <RePieChart>
                  <Pie
                    data={[
                      { name: 'Ausgegeben', value: globalStats.totalSpent },
                      { name: 'Verfügbar', value: Math.max(globalStats.totalBudget - globalStats.totalSpent, 0) }
                    ]}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    fill="#ffbd59"
                  >
                    <Cell key="spent" fill="#ffbd59" />
                    <Cell key="available" fill="#3d4952" />
                  </Pie>
                  <ReTooltip formatter={(value: number) => formatCurrency(value)} />
                </RePieChart>
              </ResponsiveContainer>
              <div className="text-center relative z-10 mt-2">
                <span className="text-2xl font-bold text-[#ffbd59] group-hover:text-[#ffa726] transition-colors duration-300">
                  {globalStats.totalBudget > 0 ? Math.round((globalStats.totalSpent / globalStats.totalBudget) * 100) : 0}%
                </span>
                <span className="text-gray-300 text-sm ml-2 group-hover:text-gray-200 transition-colors duration-300">verbraucht</span>
              </div>
            </div>

            {/* Projektstatus-Verteilung Donut */}
            <div className="bg-white/15 backdrop-blur-2xl rounded-2xl p-6 shadow-2xl border border-white/30 flex flex-col items-center relative overflow-hidden group hover:bg-white/20 transition-all duration-500 hover:shadow-[0_0_50px_rgba(255,189,89,0.3)] hover:border-[#ffbd59]/50 hover:scale-105 transform">
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#ffbd59]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-pulse"></div>
              <h4 className="text-lg font-semibold text-white mb-4 relative z-10 group-hover:text-[#ffbd59] transition-colors duration-300">Projektstatus</h4>
              <ResponsiveContainer width="100%" height={180}>
                <RePieChart>
                  <Pie
                    data={[
                      { name: 'Aktiv', value: globalStats.activeProjects },
                      { name: 'Abgeschlossen', value: globalStats.completedProjects },
                      { name: 'Andere', value: globalStats.totalProjects - globalStats.activeProjects - globalStats.completedProjects }
                    ]}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    fill="#ffbd59"
                  >
                    <Cell key="active" fill="#4ade80" />
                    <Cell key="completed" fill="#818cf8" />
                    <Cell key="other" fill="#64748b" />
                  </Pie>
                  <ReTooltip />
                </RePieChart>
              </ResponsiveContainer>
            </div>

            {/* Aufgabenstatus Donut */}
            <div className="bg-white/15 backdrop-blur-2xl rounded-2xl p-6 shadow-2xl border border-white/30 flex flex-col items-center relative overflow-hidden group hover:bg-white/20 transition-all duration-500 hover:shadow-[0_0_50px_rgba(255,189,89,0.3)] hover:border-[#ffbd59]/50 hover:scale-105 transform">
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#ffbd59]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-pulse"></div>
              <h4 className="text-lg font-semibold text-white mb-4 relative z-10 group-hover:text-[#ffbd59] transition-colors duration-300">Aufgabenstatus</h4>
              <ResponsiveContainer width="100%" height={180}>
                <RePieChart>
                  <Pie
                    data={[
                      { name: 'Erledigt', value: globalStats.completedTasks },
                      { name: 'Offen', value: globalStats.totalTasks - globalStats.completedTasks },
                      { name: 'Überfällig', value: globalStats.overdueTasks }
                    ]}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    fill="#ffbd59"
                  >
                    <Cell key="done" fill="#4ade80" />
                    <Cell key="open" fill="#fbbf24" />
                    <Cell key="overdue" fill="#ef4444" />
                  </Pie>
                  <ReTooltip />
                </RePieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Enhanced Filters and Controls */}
          <div className="bg-white/15 backdrop-blur-2xl rounded-2xl p-6 shadow-2xl border border-white/30 mb-8 relative overflow-hidden hover:bg-white/20 transition-all duration-500 hover:shadow-[0_0_40px_rgba(255,189,89,0.2)] hover:border-[#ffbd59]/40">
            <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-500"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#ffbd59]/5 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-500 animate-pulse"></div>
            <div className="relative z-10">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex flex-col sm:flex-row gap-4">
                {/* Enhanced Search */}
                <div className="relative group">
                  <Search size={22} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-hover:text-[#ffbd59] transition-colors duration-300" />
                  <input
                    type="text"
                    placeholder="Projekte durchsuchen..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-12 pr-4 py-3 bg-[#2c3539] backdrop-blur-xl rounded-xl border border-white/30 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#ffbd59] focus:border-[#ffbd59]/50 focus:shadow-[0_0_30px_rgba(255,189,89,0.4)] hover:bg-[#3d4952] hover:border-white/40 transition-all duration-500 hover:shadow-[0_0_20px_rgba(255,255,255,0.2)]"
                    style={{ colorScheme: 'dark' }}
                  />
                </div>

                {/* Enhanced Status Filter */}
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-4 py-3 bg-[#2c3539] backdrop-blur-xl rounded-xl border border-white/30 text-white focus:outline-none focus:ring-2 focus:ring-[#ffbd59] focus:border-[#ffbd59]/50 focus:shadow-[0_0_30px_rgba(255,189,89,0.4)] hover:bg-[#3d4952] hover:border-white/40 transition-all duration-500 hover:shadow-[0_0_20px_rgba(255,255,255,0.2)]"
                  style={{ colorScheme: 'dark' }}
                >
                  <option value="all" className="bg-[#2c3539] text-white">Alle Status</option>
                  <option value="planning" className="bg-[#2c3539] text-white">Planung</option>
                  <option value="preparation" className="bg-[#2c3539] text-white">Vorbereitung</option>
                  <option value="execution" className="bg-[#2c3539] text-white">Ausführung</option>
                  <option value="completion" className="bg-[#2c3539] text-white">Fertigstellung</option>
                  <option value="completed" className="bg-[#2c3539] text-white">Abgeschlossen</option>
                  <option value="on_hold" className="bg-[#2c3539] text-white">Pausiert</option>
                  <option value="cancelled" className="bg-[#2c3539] text-white">Abgebrochen</option>
                </select>

                {/* Enhanced Sort */}
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="px-4 py-3 bg-[#2c3539] backdrop-blur-xl rounded-xl border border-white/30 text-white focus:outline-none focus:ring-2 focus:ring-[#ffbd59] focus:border-[#ffbd59]/50 focus:shadow-[0_0_30px_rgba(255,189,89,0.4)] hover:bg-[#3d4952] hover:border-white/40 transition-all duration-500 hover:shadow-[0_0_20px_rgba(255,255,255,0.2)]"
                  style={{ colorScheme: 'dark' }}
                >
                  <option value="name" className="bg-[#2c3539] text-white">Nach Name</option>
                  <option value="status" className="bg-[#2c3539] text-white">Nach Status</option>
                  <option value="progress" className="bg-[#2c3539] text-white">Nach Fortschritt</option>
                  <option value="budget" className="bg-[#2c3539] text-white">Nach Budget</option>
                  <option value="date" className="bg-[#2c3539] text-white">Nach Datum</option>
                </select>

                {/* Enhanced Sort Order */}
                <button
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="px-4 py-3 bg-white/15 backdrop-blur-xl rounded-xl border border-white/30 text-white hover:bg-white/25 hover:border-white/40 transition-all duration-500 hover:shadow-[0_0_25px_rgba(255,255,255,0.3)] hover:scale-105 transform group"
                >
                  <div className="group-hover:scale-110 transition-transform duration-300">
                    {sortOrder === 'asc' ? <ChevronUp size={22} /> : <ChevronDown size={22} />}
                  </div>
                </button>
              </div>

              {/* Enhanced View Mode */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-3 rounded-xl transition-all duration-500 relative overflow-hidden group hover:scale-110 transform ${
                    viewMode === 'grid' 
                      ? 'bg-gradient-to-r from-[#ffbd59] to-[#ffa726] text-[#2c3539] shadow-lg hover:shadow-[0_0_30px_rgba(255,189,89,0.6)]' 
                      : 'bg-white/15 text-white hover:bg-white/25 hover:shadow-[0_0_20px_rgba(255,255,255,0.3)]'
                  }`}
                >
                  <div className={`absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${viewMode === 'grid' ? 'opacity-100' : ''}`}></div>
                  <Grid size={22} className="relative z-10 group-hover:scale-110 transition-transform duration-300" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-3 rounded-xl transition-all duration-500 relative overflow-hidden group hover:scale-110 transform ${
                    viewMode === 'list' 
                      ? 'bg-gradient-to-r from-[#ffbd59] to-[#ffa726] text-[#2c3539] shadow-lg hover:shadow-[0_0_30px_rgba(255,189,89,0.6)]' 
                      : 'bg-white/15 text-white hover:bg-white/25 hover:shadow-[0_0_20px_rgba(255,255,255,0.3)]'
                  }`}
                >
                  <div className={`absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${viewMode === 'list' ? 'opacity-100' : ''}`}></div>
                  <List size={22} className="relative z-10 group-hover:scale-110 transition-transform duration-300" />
                </button>
              </div>
            </div>
            </div>
          </div>

          {/* Projects Grid/List */}
          {filteredProjects.length === 0 ? (
            <div className="text-center py-12">
              <Building size={64} className="text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">Keine Projekte gefunden</h3>
              <p className="text-gray-400">Erstellen Sie Ihr erstes Projekt oder passen Sie die Filter an.</p>
            </div>
          ) : (
            <div className={viewMode === 'grid' 
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4' 
              : 'space-y-3'
            }>
              {filteredProjects.map((project) => (
                <div
                  key={project.id}
                  className={`bg-white/15 backdrop-blur-2xl rounded-2xl shadow-2xl border border-white/30 hover:bg-white/20 transition-all duration-700 transform hover:scale-[1.03] hover:shadow-[0_0_60px_rgba(255,189,89,0.4)] hover:border-[#ffbd59]/60 relative overflow-hidden group ${
                    viewMode === 'list' ? 'p-6' : 'p-6'
                  }`}
                >
                  {/* Enhanced Glassmorphism overlay */}
                  <div className="absolute inset-0 bg-gradient-to-br from-white/15 via-white/8 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" style={{ zIndex: 1 }}></div>
                  {/* Enhanced animated glow effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#ffbd59]/15 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 animate-pulse" style={{ zIndex: 1 }}></div>
                  {/* Additional shimmer effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 animate-pulse delay-300" style={{ zIndex: 1 }}></div>
                  <div className="relative z-10">
                  {/* Compact Project Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-bold text-white mb-1 truncate">{project.name}</h3>
                      <div className="flex items-center gap-2 mb-2">
                        <div className={`px-2 py-1 rounded-full text-xs font-medium text-white ${getStatusColor(project.status)} group-hover:shadow-lg transition-shadow duration-300`}>
                          {getStatusLabel(project.status)}
                        </div>
                        <span className="text-xs text-gray-400">{getProjectTypeLabel(project.project_type)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Compact Progress Bar */}
                  <div className="mb-3">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-300">Fortschritt</span>
                      <span className="text-[#ffbd59] font-bold">{project.progress_percentage}%</span>
                    </div>
                    <div className="relative w-full bg-gray-700/50 rounded-full h-2">
                      <div 
                        className="absolute inset-0 bg-gradient-to-r from-[#ffbd59] to-[#ffa726] h-2 rounded-full transition-all duration-1000 ease-out" 
                        style={{ width: `${project.progress_percentage}%` }} 
                      />
                    </div>
                  </div>

                  {/* Compact Stats */}
                  <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                    <div className="text-center p-2 bg-white/5 rounded-lg group-hover:bg-white/10 transition-colors duration-300 group-hover:shadow-[0_0_10px_rgba(255,189,89,0.2)]">
                      <div className="text-[#ffbd59] font-bold text-sm group-hover:text-[#ffa726] transition-colors duration-300">{formatCurrency(project.current_costs)}</div>
                      <div className="text-gray-400 group-hover:text-gray-300 transition-colors duration-300">Ausgaben</div>
                    </div>
                    <div className="text-center p-2 bg-white/5 rounded-lg group-hover:bg-white/10 transition-colors duration-300 group-hover:shadow-[0_0_10px_rgba(255,189,89,0.2)]">
                      <div className="text-[#ffbd59] font-bold text-sm group-hover:text-[#ffa726] transition-colors duration-300">
                        {project.start_date ? formatDate(project.start_date) : 'N/A'}
                      </div>
                      <div className="text-gray-400 group-hover:text-gray-300 transition-colors duration-300">Start</div>
                    </div>
                  </div>

                  {/* Expandable Details Section */}
                  {showProjectDetails[project.id] && (
                    <div className="mb-3 p-3 bg-white/5 rounded-lg border-t border-white/10">
                      <p className="text-gray-300 text-sm mb-3">{project.description}</p>
                      
                      {/* Projekt Details Data */}
                      {(() => {
                        const details = projectDetailsData[project.id];
                        
                        if (!details) {
                          return (
                            <div className="text-center py-4">
                              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#ffbd59] mx-auto mb-2"></div>
                              <p className="text-gray-400 text-sm">Lade Details...</p>
                            </div>
                          );
                        }

                        if (details.loading) {
                          return (
                            <div className="text-center py-4">
                              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#ffbd59] mx-auto mb-2"></div>
                              <p className="text-gray-400 text-sm">Lade Projektdaten...</p>
                            </div>
                          );
                        }

                        if (details.error) {
                          return (
                            <div className="text-center py-4">
                              <AlertTriangle size={20} className="text-red-400 mx-auto mb-2" />
                              <p className="text-red-300 text-sm">{details.error}</p>
                            </div>
                          );
                        }

                        return (
                          <div className="space-y-4">
                            {/* Kennzahlen Grid */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                              {/* Aktive Angebote */}
                              <div className="bg-white/5 rounded-lg p-2 text-center">
                                <div className="text-[#ffbd59] font-bold text-lg">
                                  {details.quotes?.filter((q: any) => ['submitted', 'pending'].includes(q.status)).length || 0}
                                </div>
                                <div className="text-gray-400 text-xs">Aktive Angebote</div>
                              </div>

                              {/* Gesamtangebote */}
                              <div className="bg-white/5 rounded-lg p-2 text-center">
                                <div className="text-[#ffbd59] font-bold text-lg">
                                  {details.quotes?.length || 0}
                                </div>
                                <div className="text-gray-400 text-xs">Gesamt Angebote</div>
                              </div>

                              {/* Ausgaben */}
                              <div className="bg-white/5 rounded-lg p-2 text-center">
                                <div className="text-[#ffbd59] font-bold text-lg">
                                  {details.expenses?.length || 0}
                                </div>
                                <div className="text-gray-400 text-xs">Ausgaben</div>
                              </div>

                              {/* Budget Auslastung */}
                              <div className="bg-white/5 rounded-lg p-2 text-center">
                                <div className="text-[#ffbd59] font-bold text-lg">
                                  {details.financeData?.budget_analysis ? 
                                    `${Math.round(details.financeData.budget_analysis.budget_utilization_percentage)}%` : 
                                    project.budget ? `${Math.round((project.current_costs / project.budget) * 100)}%` : 'N/A'
                                  }
                                </div>
                                <div className="text-gray-400 text-xs">Budget genutzt</div>
                              </div>
                            </div>

                            {/* Aktive Ausschreibungen */}
                            {details.quotes && details.quotes.length > 0 && (
                              <div>
                                <h5 className="text-white font-semibold text-sm mb-2 flex items-center gap-2">
                                  <Handshake size={14} className="text-[#ffbd59]" />
                                  Aktive Ausschreibungen
                                </h5>
                                <div className="space-y-1 max-h-32 overflow-y-auto">
                                  {details.quotes
                                    .filter((quote: any) => ['submitted', 'pending'].includes(quote.status))
                                    .slice(0, 3)
                                    .map((quote: any) => (
                                      <div key={quote.id} className="bg-white/5 rounded p-2 text-sm">
                                        <div className="flex justify-between items-start">
                                          <div className="flex-1 min-w-0">
                                            <p className="text-white font-medium truncate">{quote.title}</p>
                                            <p className="text-gray-400 text-xs">{quote.company_name || 'Unbekannter Anbieter'}</p>
                                          </div>
                                          <div className="text-right ml-2">
                                            <p className="text-[#ffbd59] font-bold text-sm">
                                              {formatCurrency(quote.total_amount || 0)}
                                            </p>
                                            <div className={`px-2 py-1 rounded-full text-xs ${
                                              quote.status === 'submitted' ? 'bg-green-500/20 text-green-300' :
                                              quote.status === 'pending' ? 'bg-yellow-500/20 text-yellow-300' :
                                              'bg-gray-500/20 text-gray-300'
                                            }`}>
                                              {quote.status === 'submitted' ? 'Eingereicht' :
                                               quote.status === 'pending' ? 'Ausstehend' : quote.status}
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  {details.quotes.filter((q: any) => ['submitted', 'pending'].includes(q.status)).length > 3 && (
                                    <p className="text-gray-400 text-xs text-center">
                                      +{details.quotes.filter((q: any) => ['submitted', 'pending'].includes(q.status)).length - 3} weitere...
                                    </p>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Finanz-Übersicht */}
                            {details.financeData && (
                              <div>
                                <h5 className="text-white font-semibold text-sm mb-2 flex items-center gap-2">
                                  <Euro size={14} className="text-[#ffbd59]" />
                                  Finanz-Übersicht
                                </h5>
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                  <div className="bg-white/5 rounded p-2">
                                    <div className="text-gray-400">Kostenpositionen</div>
                                    <div className="text-white font-bold">
                                      {formatCurrency(details.financeData.cost_positions?.total_amount || 0)}
                                    </div>
                                  </div>
                                  <div className="bg-white/5 rounded p-2">
                                    <div className="text-gray-400">Bereits bezahlt</div>
                                    <div className="text-green-400 font-bold">
                                      {formatCurrency(details.financeData.cost_positions?.paid_amount || 0)}
                                    </div>
                                  </div>
                                  <div className="bg-white/5 rounded p-2">
                                    <div className="text-gray-400">Ausstehend</div>
                                    <div className="text-orange-400 font-bold">
                                      {formatCurrency(details.financeData.cost_positions?.remaining_amount || 0)}
                                    </div>
                                  </div>
                                  <div className="bg-white/5 rounded p-2">
                                    <div className="text-gray-400">BuildWise Gebühren</div>
                                    <div className="text-blue-400 font-bold">
                                      {formatCurrency(details.financeData.buildwise_fees?.total_amount || 0)}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Basis Projekt-Informationen */}
                            <div>
                              <h5 className="text-white font-semibold text-sm mb-2 flex items-center gap-2">
                                <Building size={14} className="text-[#ffbd59]" />
                                Projekt-Informationen
                              </h5>
                              <div className="space-y-1 text-sm">
                                {project.address && (
                                  <div className="flex items-center gap-2 text-gray-300">
                                    <MapPin size={12} className="text-[#ffbd59]" />
                                    <span className="truncate text-xs">{project.address}</span>
                                  </div>
                                )}

                                {project.budget && (
                                  <div className="flex items-center gap-2 text-gray-300">
                                    <Euro size={12} className="text-[#ffbd59]" />
                                    <span className="text-xs">Budget: {formatCurrency(project.budget)}</span>
                                  </div>
                                )}

                                {project.property_size && (
                                  <div className="flex items-center gap-2 text-gray-300">
                                    <Target size={12} className="text-[#ffbd59]" />
                                    <span className="text-xs">Grundstück: {project.property_size}m²</span>
                                  </div>
                                )}

                                {project.construction_area && (
                                  <div className="flex items-center gap-2 text-gray-300">
                                    <Building size={12} className="text-[#ffbd59]" />
                                    <span className="text-xs">Baufläche: {project.construction_area}m²</span>
                                  </div>
                                )}

                                <div className="flex items-center gap-2 text-gray-300">
                                  <Activity size={12} className="text-[#ffbd59]" />
                                  <span className="text-xs">Erstellt: {formatDate(project.created_at)}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  )}

                  {/* Enhanced Action Buttons */}
                  <div className="flex gap-3 relative z-20">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleProjectDetails(project.id);
                      }}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-white/15 backdrop-blur-xl text-white rounded-xl hover:bg-white/25 transition-all duration-500 text-sm font-medium hover:shadow-[0_0_25px_rgba(255,255,255,0.3)] hover:border-white/40 border border-white/20 hover:scale-105 transform relative overflow-hidden group/btn"
                      style={{ zIndex: 30 }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover/btn:opacity-100 transition-opacity duration-500"></div>
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover/btn:opacity-100 transition-opacity duration-500 animate-pulse"></div>
                      <div className="relative z-10 flex items-center gap-2">
                        {showProjectDetails[project.id] ? (
                          <>
                            <ChevronUp size={16} className="group-hover/btn:scale-110 transition-transform duration-300" />
                            <span>Weniger</span>
                          </>
                        ) : (
                          <>
                            <Eye size={16} className="group-hover/btn:scale-110 transition-transform duration-300" />
                            <span>Details</span>
                          </>
                        )}
                      </div>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleProjectClick(project.id);
                      }}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-[#ffbd59] to-[#ffa726] text-[#2c3539] rounded-xl hover:from-[#ffa726] hover:to-[#ff9800] transition-all duration-500 text-sm font-semibold hover:shadow-[0_0_40px_rgba(255,189,89,0.8)] transform hover:scale-110 relative overflow-hidden group/btn"
                      style={{ zIndex: 30 }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-white/30 to-transparent opacity-0 group-hover/btn:opacity-100 transition-opacity duration-500"></div>
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover/btn:opacity-100 transition-opacity duration-500 animate-pulse"></div>
                      <div className="relative z-10 flex items-center gap-2">
                        <ArrowRight size={16} className="group-hover/btn:translate-x-1 transition-transform duration-300" />
                        <span>Öffnen</span>
                      </div>
                    </button>
                  </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Enhanced Summary */}
          {filteredProjects.length > 0 && (
            <div className="mt-8 bg-white/15 backdrop-blur-2xl rounded-2xl p-6 shadow-2xl border border-white/30 relative overflow-hidden hover:bg-white/20 transition-all duration-500 hover:shadow-[0_0_40px_rgba(255,189,89,0.25)] hover:border-[#ffbd59]/40 hover:scale-[1.02] transform">
              <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-500"></div>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#ffbd59]/5 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-500 animate-pulse"></div>
              <div className="flex items-center justify-between text-base relative z-10">
                <div className="flex items-center gap-6">
                  <span className="text-gray-300 group-hover:text-gray-200 transition-colors duration-300">
                    <span className="text-[#ffbd59] font-bold text-lg group-hover:text-[#ffa726] transition-colors duration-300">{filteredProjects.length}</span> Projekte angezeigt
                  </span>
                  <span className="text-gray-300 group-hover:text-gray-200 transition-colors duration-300">
                    Budget: <span className="text-[#ffbd59] font-bold text-lg group-hover:text-[#ffa726] transition-colors duration-300">
                      {formatCurrency(filteredProjects.reduce((sum, p) => sum + (p.budget || 0), 0))}
                    </span>
                  </span>
                  <span className="text-gray-300 group-hover:text-gray-200 transition-colors duration-300">
                    ⌀ Fortschritt: <span className="text-[#ffbd59] font-bold text-lg group-hover:text-[#ffa726] transition-colors duration-300">
                      {Math.round(filteredProjects.reduce((sum, p) => sum + p.progress_percentage, 0) / filteredProjects.length)}%
                    </span>
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}