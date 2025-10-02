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
import { getQuotes } from '../api/quoteService';
import { getMilestones } from '../api/milestoneService';
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

  const toggleProjectDetails = (projectId: number) => {
    setShowProjectDetails(prev => ({
      ...prev,
      [projectId]: !prev[projectId]
    }));
  };

  const handleRefresh = () => {
    loadGlobalData();
  };

  const filteredProjects = getFilteredAndSortedProjects();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#51646f] via-[#3d4952] to-[#2c3539] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#ffbd59] mx-auto mb-4"></div>
          <p className="text-white text-lg">Lade globale Projektdaten...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#51646f] via-[#3d4952] to-[#2c3539]">
      {/* Header */}
      <header className="bg-gradient-to-r from-[#3d4952]/80 to-[#51646f]/80 backdrop-blur-xl text-white px-8 py-6 shadow-2xl border-b border-[#ffbd59]/30 relative overflow-hidden">
        {/* Glassmorphism overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-white/10 backdrop-blur-sm"></div>
        <div className="relative z-10">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-[#ffbd59] to-[#ffa726] rounded-2xl flex items-center justify-center shadow-lg relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="absolute inset-0 shadow-[0_0_20px_rgba(255,189,89,0.5)] opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl"></div>
                <Building size={28} className="text-[#3d4952] relative z-10" />
              </div>
              <div>
                <h1 className="text-3xl font-extrabold bg-gradient-to-r from-white to-[#ffbd59] bg-clip-text text-transparent">
                  Globale Projektsicht
                </h1>
                <p className="text-base text-gray-300">Übersicht aller Projekte und Gesamtstatistiken</p>
              </div>
            </div>
          
          <div className="flex items-center gap-4">
            <button
              onClick={handleRefresh}
              className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-lg border border-white/20 hover:bg-white/20 transition-all duration-300 relative overflow-hidden group hover:shadow-[0_0_20px_rgba(255,255,255,0.2)]"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <RefreshCw size={18} className="relative z-10" />
              <span className="relative z-10">Aktualisieren</span>
            </button>
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 px-4 py-2 bg-[#ffbd59] text-[#3d4952] rounded-lg hover:bg-[#ffa726] transition-all duration-300 font-semibold relative overflow-hidden group hover:shadow-[0_0_25px_rgba(255,189,89,0.6)]"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <ArrowRight size={18} className="relative z-10" />
              <span className="relative z-10">Zurück zum Dashboard</span>
            </button>
          </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-8">
        <div className="max-w-7xl mx-auto">
          {/* Error Banner */}
          {error && (
            <div className="bg-red-500/20 border border-red-500/30 text-red-300 px-6 py-4 flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <AlertTriangle size={20} />
                <span>{error}</span>
              </div>
              <button onClick={() => setError('')} className="text-red-300 hover:text-red-100">
                <span>×</span>
              </button>
            </div>
          )}
          {/* Compact Global Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
            <div className="bg-white/10 backdrop-blur-xl rounded-xl p-4 shadow-lg border border-white/20 relative overflow-hidden group hover:bg-white/15 transition-all duration-300 hover:shadow-[0_0_30px_rgba(59,130,246,0.3)] hover:border-blue-400/40">
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="flex items-center gap-3 relative z-10">
                <div className="p-2 bg-blue-500/20 rounded-lg group-hover:bg-blue-500/30 transition-colors duration-300 group-hover:shadow-[0_0_15px_rgba(59,130,246,0.4)]">
                  <Building size={18} className="text-blue-400 group-hover:text-blue-300 transition-colors duration-300" />
                </div>
                <div>
                  <p className="text-gray-300 text-xs">Projekte</p>
                  <p className="text-xl font-bold text-white">{globalStats.totalProjects}</p>
                </div>
              </div>
              <div className="mt-2 text-xs text-gray-400">
                {globalStats.activeProjects} aktiv • {globalStats.completedProjects} fertig
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-xl rounded-xl p-4 shadow-lg border border-white/20 relative overflow-hidden group hover:bg-white/15 transition-all duration-300 hover:shadow-[0_0_30px_rgba(34,197,94,0.3)] hover:border-green-400/40">
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="flex items-center gap-3 relative z-10">
                <div className="p-2 bg-green-500/20 rounded-lg group-hover:bg-green-500/30 transition-colors duration-300 group-hover:shadow-[0_0_15px_rgba(34,197,94,0.4)]">
                  <Euro size={18} className="text-green-400 group-hover:text-green-300 transition-colors duration-300" />
                </div>
                <div>
                  <p className="text-gray-300 text-xs">Budget</p>
                  <p className="text-xl font-bold text-white">{formatCurrency(globalStats.totalBudget / 1000)}k</p>
                </div>
              </div>
              <div className="mt-2 text-xs text-gray-400">
                {globalStats.totalBudget > 0 ? Math.round((globalStats.totalSpent / globalStats.totalBudget) * 100) : 0}% verbraucht
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-xl rounded-xl p-4 shadow-lg border border-white/20 relative overflow-hidden group hover:bg-white/15 transition-all duration-300 hover:shadow-[0_0_30px_rgba(147,51,234,0.3)] hover:border-purple-400/40">
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="flex items-center gap-3 relative z-10">
                <div className="p-2 bg-purple-500/20 rounded-lg group-hover:bg-purple-500/30 transition-colors duration-300 group-hover:shadow-[0_0_15px_rgba(147,51,234,0.4)]">
                  <CheckCircle size={18} className="text-purple-400 group-hover:text-purple-300 transition-colors duration-300" />
                </div>
                <div>
                  <p className="text-gray-300 text-xs">Aufgaben</p>
                  <p className="text-xl font-bold text-white">{globalStats.totalTasks}</p>
                </div>
              </div>
              <div className="mt-2 text-xs text-gray-400">
                {globalStats.completedTasks} erledigt • {globalStats.overdueTasks} überfällig
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-xl rounded-xl p-4 shadow-lg border border-white/20 relative overflow-hidden group hover:bg-white/15 transition-all duration-300 hover:shadow-[0_0_30px_rgba(249,115,22,0.3)] hover:border-orange-400/40">
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="flex items-center gap-3 relative z-10">
                <div className="p-2 bg-orange-500/20 rounded-lg group-hover:bg-orange-500/30 transition-colors duration-300 group-hover:shadow-[0_0_15px_rgba(249,115,22,0.4)]">
                  <FileText size={18} className="text-orange-400 group-hover:text-orange-300 transition-colors duration-300" />
                </div>
                <div>
                  <p className="text-gray-300 text-xs">Dokumente</p>
                  <p className="text-xl font-bold text-white">{globalStats.totalDocuments}</p>
                </div>
              </div>
              <div className="mt-2 text-xs text-gray-400">
                {globalStats.totalQuotes} Angebote
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-xl rounded-xl p-4 shadow-lg border border-white/20 relative overflow-hidden group hover:bg-white/15 transition-all duration-300 hover:shadow-[0_0_30px_rgba(234,179,8,0.3)] hover:border-yellow-400/40">
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="flex items-center gap-3 relative z-10">
                <div className="p-2 bg-yellow-500/20 rounded-lg group-hover:bg-yellow-500/30 transition-colors duration-300 group-hover:shadow-[0_0_15px_rgba(234,179,8,0.4)]">
                  <Target size={18} className="text-yellow-400 group-hover:text-yellow-300 transition-colors duration-300" />
                </div>
                <div>
                  <p className="text-gray-300 text-xs">Meilensteine</p>
                  <p className="text-xl font-bold text-white">{globalStats.totalMilestones}</p>
                </div>
              </div>
              <div className="mt-2 text-xs text-gray-400">
                {globalStats.upcomingMilestones} anstehend
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-xl rounded-xl p-4 shadow-lg border border-white/20 relative overflow-hidden group hover:bg-white/15 transition-all duration-300 hover:shadow-[0_0_30px_rgba(239,68,68,0.3)] hover:border-red-400/40">
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="flex items-center gap-3 relative z-10">
                <div className="p-2 bg-red-500/20 rounded-lg group-hover:bg-red-500/30 transition-colors duration-300 group-hover:shadow-[0_0_15px_rgba(239,68,68,0.4)]">
                  <TrendingUp size={18} className="text-red-400 group-hover:text-red-300 transition-colors duration-300" />
                </div>
                <div>
                  <p className="text-gray-300 text-xs">Ausgaben</p>
                  <p className="text-xl font-bold text-white">{formatCurrency(globalStats.totalSpent / 1000)}k</p>
                </div>
              </div>
              <div className="mt-2 text-xs text-gray-400">
                von {formatCurrency(globalStats.totalBudget / 1000)}k
              </div>
            </div>
          </div>

          {/* Compact Charts Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {/* Budgetauslastung Donut */}
            <div className="bg-white/10 backdrop-blur-xl rounded-xl p-4 shadow-lg border border-white/20 flex flex-col items-center relative overflow-hidden group hover:bg-white/15 transition-all duration-300 hover:shadow-[0_0_40px_rgba(255,189,89,0.2)] hover:border-[#ffbd59]/40">
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <h4 className="text-sm font-semibold text-white mb-2 relative z-10">Budgetauslastung</h4>
              <ResponsiveContainer width="100%" height={160}>
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
                    innerRadius={40}
                    outerRadius={60}
                    fill="#ffbd59"
                  >
                    <Cell key="spent" fill="#ffbd59" />
                    <Cell key="available" fill="#3d4952" />
                  </Pie>
                  <ReTooltip formatter={(value: number) => formatCurrency(value)} />
                </RePieChart>
              </ResponsiveContainer>
              <div className="text-center relative z-10">
                <span className="text-lg font-bold text-[#ffbd59] group-hover:text-[#ffa726] transition-colors duration-300">
                  {globalStats.totalBudget > 0 ? Math.round((globalStats.totalSpent / globalStats.totalBudget) * 100) : 0}%
                </span>
                <span className="text-gray-300 text-xs ml-1 group-hover:text-gray-200 transition-colors duration-300">verbraucht</span>
              </div>
            </div>

            {/* Projektstatus-Verteilung Donut */}
            <div className="bg-white/10 backdrop-blur-xl rounded-xl p-4 shadow-lg border border-white/20 flex flex-col items-center relative overflow-hidden group hover:bg-white/15 transition-all duration-300 hover:shadow-[0_0_40px_rgba(255,189,89,0.2)] hover:border-[#ffbd59]/40">
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <h4 className="text-sm font-semibold text-white mb-2 relative z-10">Projektstatus</h4>
              <ResponsiveContainer width="100%" height={160}>
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
                    innerRadius={40}
                    outerRadius={60}
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
            <div className="bg-white/10 backdrop-blur-xl rounded-xl p-4 shadow-lg border border-white/20 flex flex-col items-center relative overflow-hidden group hover:bg-white/15 transition-all duration-300 hover:shadow-[0_0_40px_rgba(255,189,89,0.2)] hover:border-[#ffbd59]/40">
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <h4 className="text-sm font-semibold text-white mb-2 relative z-10">Aufgabenstatus</h4>
              <ResponsiveContainer width="100%" height={160}>
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
                    innerRadius={40}
                    outerRadius={60}
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

          {/* Filters and Controls */}
          <div className="bg-white/10 backdrop-blur-xl rounded-xl p-4 shadow-lg border border-white/20 mb-6 relative overflow-hidden hover:bg-white/15 transition-all duration-300 hover:shadow-[0_0_30px_rgba(255,189,89,0.15)] hover:border-[#ffbd59]/30">
            <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative z-10">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex flex-col sm:flex-row gap-4">
                {/* Search */}
                <div className="relative">
                  <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Projekte durchsuchen..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 bg-white/10 backdrop-blur-md rounded-lg border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent focus:shadow-[0_0_20px_rgba(255,189,89,0.3)] transition-all duration-300"
                  />
                </div>

                {/* Status Filter */}
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-4 py-2 bg-white/10 backdrop-blur-md rounded-lg border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent focus:shadow-[0_0_20px_rgba(255,189,89,0.3)] transition-all duration-300 hover:bg-white/15"
                >
                  <option value="all">Alle Status</option>
                  <option value="planning">Planung</option>
                  <option value="preparation">Vorbereitung</option>
                  <option value="execution">Ausführung</option>
                  <option value="completion">Fertigstellung</option>
                  <option value="completed">Abgeschlossen</option>
                  <option value="on_hold">Pausiert</option>
                  <option value="cancelled">Abgebrochen</option>
                </select>

                {/* Sort */}
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="px-4 py-2 bg-white/10 backdrop-blur-md rounded-lg border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent focus:shadow-[0_0_20px_rgba(255,189,89,0.3)] transition-all duration-300 hover:bg-white/15"
                >
                  <option value="name">Nach Name</option>
                  <option value="status">Nach Status</option>
                  <option value="progress">Nach Fortschritt</option>
                  <option value="budget">Nach Budget</option>
                  <option value="date">Nach Datum</option>
                </select>

                {/* Sort Order */}
                <button
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="px-4 py-2 bg-white/10 backdrop-blur-md rounded-lg border border-white/20 text-white hover:bg-white/20 transition-all duration-300 hover:shadow-[0_0_15px_rgba(255,255,255,0.2)] hover:border-white/30"
                >
                  {sortOrder === 'asc' ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </button>
              </div>

              {/* View Mode */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg transition-all duration-300 ${
                    viewMode === 'grid' 
                      ? 'bg-[#ffbd59] text-[#3d4952]' 
                      : 'bg-white/10 text-white hover:bg-white/20'
                  }`}
                >
                  <Grid size={20} />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-lg transition-all duration-300 ${
                    viewMode === 'list' 
                      ? 'bg-[#ffbd59] text-[#3d4952]' 
                      : 'bg-white/10 text-white hover:bg-white/20'
                  }`}
                >
                  <List size={20} />
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
                  className={`bg-white/10 backdrop-blur-xl rounded-xl shadow-lg border border-white/20 hover:bg-white/15 transition-all duration-500 transform hover:scale-[1.02] hover:shadow-[0_0_40px_rgba(255,189,89,0.25)] hover:border-[#ffbd59]/50 relative overflow-hidden group ${
                    viewMode === 'list' ? 'p-4' : 'p-4'
                  }`}
                >
                  {/* Glassmorphism overlay */}
                  <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  {/* Animated glow effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#ffbd59]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-pulse"></div>
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
                      <p className="text-gray-300 text-sm mb-2">{project.description}</p>
                      
                      <div className="space-y-2 text-sm">
                        {project.address && (
                          <div className="flex items-center gap-2 text-gray-300">
                            <MapPin size={14} className="text-[#ffbd59]" />
                            <span className="truncate">{project.address}</span>
                          </div>
                        )}

                        {project.budget && (
                          <div className="flex items-center gap-2 text-gray-300">
                            <Euro size={14} className="text-[#ffbd59]" />
                            <span>Budget: {formatCurrency(project.budget)}</span>
                          </div>
                        )}

                        {project.property_size && (
                          <div className="flex items-center gap-2 text-gray-300">
                            <Target size={14} className="text-[#ffbd59]" />
                            <span>Grundstück: {project.property_size}m²</span>
                          </div>
                        )}

                        {project.construction_area && (
                          <div className="flex items-center gap-2 text-gray-300">
                            <Building size={14} className="text-[#ffbd59]" />
                            <span>Baufläche: {project.construction_area}m²</span>
                          </div>
                        )}

                        {project.estimated_duration && (
                          <div className="flex items-center gap-2 text-gray-300">
                            <Calendar size={14} className="text-[#ffbd59]" />
                            <span>Dauer: {project.estimated_duration} Monate</span>
                          </div>
                        )}

                        <div className="flex items-center gap-2 text-gray-300">
                          <Activity size={14} className="text-[#ffbd59]" />
                          <span>Erstellt: {formatDate(project.created_at)}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleProjectDetails(project.id);
                      }}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-all duration-300 text-sm font-medium hover:shadow-[0_0_15px_rgba(255,255,255,0.2)] hover:border-white/30 border border-transparent"
                    >
                      {showProjectDetails[project.id] ? (
                        <>
                          <ChevronUp size={14} />
                          <span>Weniger</span>
                        </>
                      ) : (
                        <>
                          <Eye size={14} />
                          <span>Details</span>
                        </>
                      )}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleProjectClick(project.id);
                      }}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-[#ffbd59] text-[#3d4952] rounded-lg hover:bg-[#ffa726] transition-all duration-300 text-sm font-semibold hover:shadow-[0_0_20px_rgba(255,189,89,0.5)] transform hover:scale-105 relative overflow-hidden group/btn"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300"></div>
                      <div className="relative z-10 flex items-center gap-2">
                        <ArrowRight size={14} />
                        <span>Öffnen</span>
                      </div>
                    </button>
                  </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Compact Summary */}
          {filteredProjects.length > 0 && (
            <div className="mt-6 bg-white/10 backdrop-blur-xl rounded-xl p-4 shadow-lg border border-white/20 relative overflow-hidden hover:bg-white/15 transition-all duration-300 hover:shadow-[0_0_25px_rgba(255,189,89,0.15)] hover:border-[#ffbd59]/30">
              <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
              <div className="flex items-center justify-between text-sm relative z-10">
                <div className="flex items-center gap-4">
                  <span className="text-gray-300">
                    <span className="text-[#ffbd59] font-bold">{filteredProjects.length}</span> Projekte angezeigt
                  </span>
                  <span className="text-gray-300">
                    Budget: <span className="text-[#ffbd59] font-bold">
                      {formatCurrency(filteredProjects.reduce((sum, p) => sum + (p.budget || 0), 0))}
                    </span>
                  </span>
                  <span className="text-gray-300">
                    ⌀ Fortschritt: <span className="text-[#ffbd59] font-bold">
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