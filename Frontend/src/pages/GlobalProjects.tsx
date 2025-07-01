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
      <header className="bg-gradient-to-r from-[#3d4952]/95 to-[#51646f]/95 backdrop-blur-lg text-white px-8 py-6 shadow-2xl border-b border-[#ffbd59]/20">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-[#ffbd59] to-[#ffa726] rounded-2xl flex items-center justify-center shadow-lg">
              <Building size={28} className="text-[#3d4952]" />
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
              className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-lg border border-white/20 hover:bg-white/20 transition-all duration-300"
            >
              <RefreshCw size={18} />
              <span>Aktualisieren</span>
            </button>
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 px-4 py-2 bg-[#ffbd59] text-[#3d4952] rounded-lg hover:bg-[#ffa726] transition-all duration-300 font-semibold"
            >
              <ArrowRight size={18} />
              <span>Zurück zum Dashboard</span>
            </button>
          </div>
        </div>

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
      </header>

      {/* Main Content */}
      <main className="p-8">
        <div className="max-w-7xl mx-auto">
          {/* Global Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 shadow-xl border border-white/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-300 text-sm">Gesamtprojekte</p>
                  <p className="text-3xl font-bold text-white">{globalStats.totalProjects}</p>
                </div>
                <div className="p-3 bg-blue-500/20 rounded-xl">
                  <Building size={24} className="text-blue-400" />
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2 text-sm">
                <span className="text-green-400">{globalStats.activeProjects} aktiv</span>
                <span className="text-gray-400">•</span>
                <span className="text-blue-400">{globalStats.completedProjects} abgeschlossen</span>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 shadow-xl border border-white/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-300 text-sm">Gesamtbudget</p>
                  <p className="text-3xl font-bold text-white">{formatCurrency(globalStats.totalBudget)}</p>
                </div>
                <div className="p-3 bg-green-500/20 rounded-xl">
                  <Euro size={24} className="text-green-400" />
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2 text-sm">
                <span className="text-yellow-400">{formatCurrency(globalStats.totalSpent)} ausgegeben</span>
                <span className="text-gray-400">•</span>
                <span className="text-green-400">{globalStats.totalBudget > 0 ? Math.round((globalStats.totalSpent / globalStats.totalBudget) * 100) : 0}%</span>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 shadow-xl border border-white/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-300 text-sm">Aufgaben</p>
                  <p className="text-3xl font-bold text-white">{globalStats.totalTasks}</p>
                </div>
                <div className="p-3 bg-purple-500/20 rounded-xl">
                  <CheckCircle size={24} className="text-purple-400" />
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2 text-sm">
                <span className="text-green-400">{globalStats.completedTasks} erledigt</span>
                <span className="text-gray-400">•</span>
                <span className="text-red-400">{globalStats.overdueTasks} überfällig</span>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 shadow-xl border border-white/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-300 text-sm">Dokumente</p>
                  <p className="text-3xl font-bold text-white">{globalStats.totalDocuments}</p>
                </div>
                <div className="p-3 bg-orange-500/20 rounded-xl">
                  <FileText size={24} className="text-orange-400" />
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2 text-sm">
                <span className="text-blue-400">{globalStats.totalQuotes} Angebote</span>
                <span className="text-gray-400">•</span>
                <span className="text-purple-400">{globalStats.totalMilestones} Meilensteine</span>
              </div>
            </div>
          </div>

          {/* Diagramm-Sektion */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {/* Budgetauslastung Donut */}
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 shadow-xl border border-white/20 flex flex-col items-center">
              <h4 className="text-lg font-semibold text-white mb-2">Budgetauslastung</h4>
              <ResponsiveContainer width="100%" height={220}>
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
                    innerRadius={60}
                    outerRadius={80}
                    fill="#ffbd59"
                    label
                  >
                    <Cell key="spent" fill="#ffbd59" />
                    <Cell key="available" fill="#3d4952" />
                  </Pie>
                  <ReTooltip formatter={(value: number) => formatCurrency(value)} />
                  <ReLegend />
                </RePieChart>
              </ResponsiveContainer>
              <div className="mt-4 text-center">
                <span className="text-2xl font-bold text-[#ffbd59]">
                  {globalStats.totalBudget > 0 ? Math.round((globalStats.totalSpent / globalStats.totalBudget) * 100) : 0}%
                </span>
                <span className="text-gray-300 ml-2">des Budgets verbraucht</span>
              </div>
            </div>

            {/* Projektstatus-Verteilung Donut */}
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 shadow-xl border border-white/20 flex flex-col items-center">
              <h4 className="text-lg font-semibold text-white mb-2">Projektstatus</h4>
              <ResponsiveContainer width="100%" height={220}>
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
                    innerRadius={60}
                    outerRadius={80}
                    fill="#ffbd59"
                    label
                  >
                    <Cell key="active" fill="#4ade80" />
                    <Cell key="completed" fill="#818cf8" />
                    <Cell key="other" fill="#64748b" />
                  </Pie>
                  <ReTooltip />
                  <ReLegend />
                </RePieChart>
              </ResponsiveContainer>
            </div>

            {/* Aufgabenstatus Donut */}
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 shadow-xl border border-white/20 flex flex-col items-center">
              <h4 className="text-lg font-semibold text-white mb-2">Aufgabenstatus</h4>
              <ResponsiveContainer width="100%" height={220}>
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
                    innerRadius={60}
                    outerRadius={80}
                    fill="#ffbd59"
                    label
                  >
                    <Cell key="done" fill="#4ade80" />
                    <Cell key="open" fill="#fbbf24" />
                    <Cell key="overdue" fill="#ef4444" />
                  </Pie>
                  <ReTooltip />
                  <ReLegend />
                </RePieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Filters and Controls */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 shadow-xl border border-white/20 mb-8">
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
                    className="pl-10 pr-4 py-2 bg-white/10 backdrop-blur-md rounded-lg border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent"
                  />
                </div>

                {/* Status Filter */}
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-4 py-2 bg-white/10 backdrop-blur-md rounded-lg border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent"
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
                  className="px-4 py-2 bg-white/10 backdrop-blur-md rounded-lg border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent"
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
                  className="px-4 py-2 bg-white/10 backdrop-blur-md rounded-lg border border-white/20 text-white hover:bg-white/20 transition-all duration-300"
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

          {/* Projects Grid/List */}
          {filteredProjects.length === 0 ? (
            <div className="text-center py-12">
              <Building size={64} className="text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">Keine Projekte gefunden</h3>
              <p className="text-gray-400">Erstellen Sie Ihr erstes Projekt oder passen Sie die Filter an.</p>
            </div>
          ) : (
            <div className={viewMode === 'grid' 
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' 
              : 'space-y-4'
            }>
              {filteredProjects.map((project) => (
                <div
                  key={project.id}
                  className={`bg-white/10 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 hover:bg-white/15 transition-all duration-300 cursor-pointer transform hover:scale-105 ${
                    viewMode === 'list' ? 'p-6' : 'p-6'
                  }`}
                  onClick={() => handleProjectClick(project.id)}
                >
                  {/* Project Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-white mb-2">{project.name}</h3>
                      <p className="text-gray-300 text-sm mb-3">{project.description}</p>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-medium text-white ${getStatusColor(project.status)}`}>
                      {getStatusLabel(project.status)}
                    </div>
                  </div>

                  {/* Project Details */}
                  <div className="space-y-3 mb-4">
                    <div className="flex items-center gap-2 text-sm text-gray-300">
                      <Building size={16} className="text-[#ffbd59]" />
                      <span>{getProjectTypeLabel(project.project_type)}</span>
                    </div>
                    
                    {project.address && (
                      <div className="flex items-center gap-2 text-sm text-gray-300">
                        <MapPin size={16} className="text-[#ffbd59]" />
                        <span>{project.address}</span>
                      </div>
                    )}

                    {project.budget && (
                      <div className="flex items-center gap-2 text-sm text-gray-300">
                        <Euro size={16} className="text-[#ffbd59]" />
                        <span>{formatCurrency(project.budget)} Budget</span>
                      </div>
                    )}
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-300">Fortschritt</span>
                      <span className="text-[#ffbd59] font-bold">{project.progress_percentage}%</span>
                    </div>
                    <div className="relative w-full bg-gray-700/50 rounded-full h-3">
                      <div 
                        className="absolute inset-0 bg-gradient-to-r from-[#ffbd59] to-[#ffa726] h-3 rounded-full transition-all duration-1000 ease-out" 
                        style={{ width: `${project.progress_percentage}%` }} 
                      />
                    </div>
                  </div>

                  {/* Quick Stats */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="text-center p-3 bg-white/5 rounded-lg">
                      <div className="text-[#ffbd59] font-bold">{formatCurrency(project.current_costs)}</div>
                      <div className="text-gray-400">Ausgaben</div>
                    </div>
                    <div className="text-center p-3 bg-white/5 rounded-lg">
                      <div className="text-[#ffbd59] font-bold">
                        {project.start_date ? formatDate(project.start_date) : 'N/A'}
                      </div>
                      <div className="text-gray-400">Start</div>
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="mt-4 pt-4 border-t border-white/10">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleProjectClick(project.id);
                      }}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-[#ffbd59] text-[#3d4952] rounded-lg hover:bg-[#ffa726] transition-all duration-300 font-semibold"
                    >
                      <ArrowRight size={16} />
                      <span>Projekt öffnen</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Summary */}
          <div className="mt-8 bg-white/10 backdrop-blur-lg rounded-2xl p-6 shadow-xl border border-white/20">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <BarChart3 size={24} className="text-[#ffbd59]" />
              Zusammenfassung
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-[#ffbd59]">{filteredProjects.length}</div>
                <div className="text-gray-300">Projekte angezeigt</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-[#ffbd59]">
                  {formatCurrency(filteredProjects.reduce((sum, p) => sum + (p.budget || 0), 0))}
                </div>
                <div className="text-gray-300">Gesamtbudget</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-[#ffbd59]">
                  {Math.round(filteredProjects.reduce((sum, p) => sum + p.progress_percentage, 0) / filteredProjects.length)}%
                </div>
                <div className="text-gray-300">Durchschnittlicher Fortschritt</div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
} 