import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getProjects } from '../api/projectService';
import ProjectBreadcrumb from '../components/ProjectBreadcrumb';
import { 
  BarChart3, 
  PieChart, 
  TrendingUp, 
  TrendingDown, 
  Calendar,
  DollarSign,
  Users,
  Building,
  Wrench,
  Truck,
  FileText,
  Shield,
  CheckCircle,
  XCircle,
  AlertCircle,
  MoreHorizontal,
  Target,
  Wallet,
  Clock,
  Activity,
  Layers,
  MapPin
} from 'lucide-react';

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
}

interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor: string[];
    borderColor: string[];
    borderWidth: number;
  }[];
}

export default function Visualize() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [chartType, setChartType] = useState<'progress' | 'budget' | 'timeline' | 'status'>('progress');

  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const projectId = urlParams.get('project');
    if (projectId) {
      setSelectedProject(projectId);
    }
    loadProjects();
  }, [location.search]);

  const loadProjects = async () => {
    try {
      const data = await getProjects();
      setProjects(data);
    } catch (err: any) {
      console.error('Error loading projects:', err);
      setError('Fehler beim Laden der Projekte');
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  const handleProjectChange = (projectId: string) => {
    setSelectedProject(projectId);
  };

  const getProgressData = (): ChartData => {
    const filteredProjects = selectedProject === 'all' 
      ? projects 
      : projects.filter(p => p.id.toString() === selectedProject);

    return {
      labels: filteredProjects.map(p => p.name),
      datasets: [{
        label: 'Fortschritt (%)',
        data: filteredProjects.map(p => p.progress_percentage),
        backgroundColor: filteredProjects.map(p => {
          if (p.progress_percentage >= 80) return 'rgba(34, 197, 94, 0.8)';
          if (p.progress_percentage >= 50) return 'rgba(251, 191, 36, 0.8)';
          return 'rgba(239, 68, 68, 0.8)';
        }),
        borderColor: filteredProjects.map(p => {
          if (p.progress_percentage >= 80) return 'rgb(34, 197, 94)';
          if (p.progress_percentage >= 50) return 'rgb(251, 191, 36)';
          return 'rgb(239, 68, 68)';
        }),
        borderWidth: 2
      }]
    };
  };

  const getBudgetData = (): ChartData => {
    const filteredProjects = selectedProject === 'all' 
      ? projects 
      : projects.filter(p => p.id.toString() === selectedProject);

    return {
      labels: filteredProjects.map(p => p.name),
      datasets: [
        {
          label: 'Budget (€)',
          data: filteredProjects.map(p => p.budget || 0),
                  backgroundColor: ['rgba(59, 130, 246, 0.8)'],
        borderColor: ['rgb(59, 130, 246)'],
          borderWidth: 2
        },
        {
          label: 'Aktuelle Kosten (€)',
          data: filteredProjects.map(p => p.current_costs),
          backgroundColor: ['rgba(239, 68, 68, 0.8)'],
          borderColor: ['rgb(239, 68, 68)'],
          borderWidth: 2
        }
      ]
    };
  };

  const getStatusData = (): ChartData => {
    const statusCounts = projects.reduce((acc, project) => {
      acc[project.status] = (acc[project.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const statusColors = {
      'planning': 'rgba(59, 130, 246, 0.8)',
      'in_progress': 'rgba(251, 191, 36, 0.8)',
      'completed': 'rgba(34, 197, 94, 0.8)',
      'on_hold': 'rgba(156, 163, 175, 0.8)',
      'cancelled': 'rgba(239, 68, 68, 0.8)'
    };

    return {
      labels: Object.keys(statusCounts),
      datasets: [{
        label: 'Anzahl Projekte',
        data: Object.values(statusCounts),
        backgroundColor: Object.keys(statusCounts).map(status => statusColors[status as keyof typeof statusColors] || 'rgba(156, 163, 175, 0.8)'),
        borderColor: Object.keys(statusCounts).map(status => statusColors[status as keyof typeof statusColors]?.replace('0.8', '1') || 'rgb(156, 163, 175)'),
        borderWidth: 2
      }]
    };
  };

  const getProjectTypeData = (): ChartData => {
    const typeCounts = projects.reduce((acc, project) => {
      acc[project.project_type] = (acc[project.project_type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const typeColors = {
      'residential': 'rgba(59, 130, 246, 0.8)',
      'commercial': 'rgba(34, 197, 94, 0.8)',
      'industrial': 'rgba(251, 191, 36, 0.8)',
      'infrastructure': 'rgba(168, 85, 247, 0.8)',
      'renovation': 'rgba(236, 72, 153, 0.8)'
    };

    return {
      labels: Object.keys(typeCounts),
      datasets: [{
        label: 'Anzahl Projekte',
        data: Object.values(typeCounts),
        backgroundColor: Object.keys(typeCounts).map(type => typeColors[type as keyof typeof typeColors] || 'rgba(156, 163, 175, 0.8)'),
        borderColor: Object.keys(typeCounts).map(type => typeColors[type as keyof typeof typeColors]?.replace('0.8', '1') || 'rgb(156, 163, 175)'),
        borderWidth: 2
      }]
    };
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'planning': return 'Planung';
      case 'in_progress': return 'In Bearbeitung';
      case 'completed': return 'Abgeschlossen';
      case 'on_hold': return 'Pausiert';
      case 'cancelled': return 'Abgebrochen';
      default: return status;
    }
  };

  const getProjectTypeLabel = (type: string) => {
    switch (type) {
      case 'residential': return 'Wohnungsbau';
      case 'commercial': return 'Gewerbe';
      case 'industrial': return 'Industrie';
      case 'infrastructure': return 'Infrastruktur';
      case 'renovation': return 'Sanierung';
      default: return type;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planning': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'on_hold': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getProjectTypeColor = (type: string) => {
    switch (type) {
      case 'residential': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'commercial': return 'bg-green-100 text-green-800 border-green-200';
      case 'industrial': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'infrastructure': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'renovation': return 'bg-pink-100 text-pink-800 border-pink-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <ProjectBreadcrumb />
          <div className="flex items-center justify-between mt-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Visualisierung</h1>
              <p className="text-gray-600">Analysieren Sie Ihre Projekte mit interaktiven Diagrammen</p>
            </div>
          </div>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 flex items-center justify-between mb-6 rounded-xl">
            <div className="flex items-center gap-3">
              <AlertCircle size={20} />
              <span>{error}</span>
            </div>
            <button onClick={() => setError('')} className="text-red-500 hover:text-red-700">
              <XCircle size={20} />
            </button>
          </div>
        )}

        {/* Project Selector */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 mb-8">
          <div className="flex items-center gap-4">
            <Building size={20} className="text-gray-500" />
            <label className="text-sm font-medium text-gray-700">Projekt auswählen:</label>
            <select
              value={selectedProject}
              onChange={(e) => handleProjectChange(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Alle Projekte</option>
              {projects.map(project => (
                <option key={project.id} value={project.id.toString()}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Chart Type Selector */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 mb-8">
          <div className="flex items-center gap-4 mb-4">
            <BarChart3 size={20} className="text-gray-500" />
            <label className="text-sm font-medium text-gray-700">Diagramm-Typ:</label>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <button
              onClick={() => setChartType('progress')}
              className={`flex items-center gap-2 px-4 py-3 rounded-xl border transition-colors ${
                chartType === 'progress'
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              <TrendingUp size={16} />
              <span className="text-sm font-medium">Fortschritt</span>
            </button>
            
            <button
              onClick={() => setChartType('budget')}
              className={`flex items-center gap-2 px-4 py-3 rounded-xl border transition-colors ${
                chartType === 'budget'
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              <Wallet size={16} />
              <span className="text-sm font-medium">Budget</span>
            </button>
            
            <button
              onClick={() => setChartType('status')}
              className={`flex items-center gap-2 px-4 py-3 rounded-xl border transition-colors ${
                chartType === 'status'
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              <Activity size={16} />
              <span className="text-sm font-medium">Status</span>
            </button>
            
            <button
              onClick={() => setChartType('timeline')}
              className={`flex items-center gap-2 px-4 py-3 rounded-xl border transition-colors ${
                chartType === 'timeline'
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              <Calendar size={16} />
              <span className="text-sm font-medium">Timeline</span>
            </button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-100 rounded-xl">
                <Building size={24} className="text-blue-600" />
              </div>
              <span className="text-sm text-gray-500">Projekte</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">{projects.length}</h3>
            <p className="text-sm text-gray-500">Gesamtanzahl</p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-green-100 rounded-xl">
                <CheckCircle size={24} className="text-green-600" />
              </div>
              <span className="text-sm text-gray-500">Abgeschlossen</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">
              {projects.filter(p => p.status === 'completed').length}
            </h3>
            <p className="text-sm text-gray-500">Projekte</p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-yellow-100 rounded-xl">
                <Activity size={24} className="text-yellow-600" />
              </div>
              <span className="text-sm text-gray-500">In Bearbeitung</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">
              {projects.filter(p => p.status === 'in_progress').length}
            </h3>
            <p className="text-sm text-gray-500">Projekte</p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-purple-100 rounded-xl">
                <DollarSign size={24} className="text-purple-600" />
              </div>
              <span className="text-sm text-gray-500">Gesamtbudget</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">
              {formatCurrency(projects.reduce((sum, p) => sum + (p.budget || 0), 0))}
            </h3>
            <p className="text-sm text-gray-500">Verfügbar</p>
          </div>
        </div>

        {/* Chart Display */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-900">
              {chartType === 'progress' && 'Projektfortschritt'}
              {chartType === 'budget' && 'Budget vs. Kosten'}
              {chartType === 'status' && 'Projektstatus'}
              {chartType === 'timeline' && 'Projekt-Timeline'}
            </h3>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <BarChart3 size={16} />
              <span>Interaktive Visualisierung</span>
            </div>
          </div>

          {/* Chart Placeholder */}
          <div className="h-96 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center">
            <div className="text-center">
              <BarChart3 size={48} className="text-gray-400 mx-auto mb-4" />
              <h4 className="text-lg font-semibold text-gray-900 mb-2">
                {chartType === 'progress' && 'Fortschritts-Diagramm'}
                {chartType === 'budget' && 'Budget-Analyse'}
                {chartType === 'status' && 'Status-Verteilung'}
                {chartType === 'timeline' && 'Zeitplan-Übersicht'}
              </h4>
              <p className="text-gray-500 mb-4">
                Hier würde ein interaktives Diagramm angezeigt werden
              </p>
              <div className="text-sm text-gray-400">
                {chartType === 'progress' && 'Zeigt den Fortschritt aller Projekte in Prozent'}
                {chartType === 'budget' && 'Vergleicht geplantes Budget mit tatsächlichen Kosten'}
                {chartType === 'status' && 'Verteilung der Projekte nach Status'}
                {chartType === 'timeline' && 'Zeitliche Darstellung der Projektphasen'}
              </div>
            </div>
          </div>
        </div>

        {/* Project Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <div key={project.id} className="group bg-white rounded-2xl p-6 shadow-sm border border-gray-200 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gray-100 rounded-xl">
                    <Building size={20} className="text-gray-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg group-hover:text-blue-600 transition-colors">
                      {project.name}
                    </h3>
                    <p className="text-sm text-gray-500">{project.description}</p>
                  </div>
                </div>
              </div>

              {/* Project Details */}
              <div className="space-y-3 mb-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Status</span>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(project.status)}`}>
                    {getStatusLabel(project.status)}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Typ</span>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getProjectTypeColor(project.project_type)}`}>
                    {getProjectTypeLabel(project.project_type)}
                  </span>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Fortschritt</span>
                    <span className="text-gray-900 font-semibold">{project.progress_percentage}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${
                        project.progress_percentage >= 80 ? 'bg-green-500' :
                        project.progress_percentage >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${project.progress_percentage}%` }}
                    ></div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <DollarSign size={14} className="text-gray-400" />
                    <span className="text-gray-500">Budget:</span>
                    <span className="text-gray-900 ml-1 font-semibold">
                      {formatCurrency(project.budget || 0)}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <Wallet size={14} className="text-gray-400" />
                    <span className="text-gray-500">Kosten:</span>
                    <span className="text-gray-900 ml-1 font-semibold">
                      {formatCurrency(project.current_costs)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {projects.length === 0 && (
          <div className="text-center py-12">
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200 max-w-md mx-auto">
              <BarChart3 size={48} className="text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Keine Projekte gefunden</h3>
              <p className="text-gray-500 mb-6">
                Erstellen Sie Ihr erstes Projekt, um Visualisierungen zu sehen.
              </p>
              <button
                onClick={() => navigate('/')}
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors"
              >
                <Building size={20} />
                Zum Dashboard
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 