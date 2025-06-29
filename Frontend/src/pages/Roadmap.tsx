import React, { useState, useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getProjects } from '../api/projectService';
import { getMilestones } from '../api/milestoneService';
import { getTasks } from '../api/taskService';
import ProjectBreadcrumb from '../components/ProjectBreadcrumb';
import { 
  Calendar, 
  Clock, 
  TrendingUp, 
  BarChart3, 
  Target, 
  CheckCircle, 
  AlertTriangle,
  Play,
  Pause,
  Square,
  ArrowRight,
  CalendarDays,
  Clock3,
  Zap,
  Building,
  Users,
  Euro,
  FileText,
  CheckSquare,
  Eye,
  Handshake,
  Home
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
  is_public: boolean;
  allow_quotes: boolean;
  created_at: string;
  updated_at: string;
}

interface Milestone {
  id: number;
  title: string;
  description: string;
  status: string;
  priority: string;
  category?: string;
  planned_date: string;
  actual_date?: string;
  start_date?: string;
  end_date?: string;
  budget?: number;
  actual_costs?: number;
  contractor?: string;
  progress_percentage: number;
  is_critical: boolean;
  notes?: string;
  created_at: string;
  updated_at: string;
}

interface Task {
  id: number;
  title: string;
  description: string;
  status: string;
  priority: string;
  progress_percentage: number;
  due_date?: string;
  estimated_hours?: number;
  actual_hours?: number;
  is_milestone: boolean;
  created_at: string;
  updated_at: string;
}

interface TimelineItem {
  id: number;
  title: string;
  type: 'milestone' | 'task' | 'project';
  start_date: string;
  end_date?: string;
  status: string;
  priority: string;
  progress: number;
  category?: string;
  contractor?: string;
  budget?: number;
  color: string;
}

export default function Roadmap() {
  const { projectId: urlProjectId } = useParams<{ projectId: string }>();
  const location = useLocation();
  const { token } = useAuth();
  const [selectedProject, setSelectedProject] = useState<number>(1);
  const [projects, setProjects] = useState<Project[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [timelineItems, setTimelineItems] = useState<TimelineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState<'gantt' | 'timeline' | 'calendar'>('gantt');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');

  const getProjectId = () => {
    if (urlProjectId) {
      return urlProjectId;
    }
    const urlParams = new URLSearchParams(location.search);
    const queryProjectId = urlParams.get('project');
    if (queryProjectId) {
      return queryProjectId;
    }
    return selectedProject.toString();
  };

  const projectId = getProjectId();

  // Lade alle Daten
  useEffect(() => {
    loadAllData();
  }, [projectId]);

  const loadAllData = async () => {
    setLoading(true);
    setError('');
    try {
      const currentProjectId = getProjectId();
      console.log('🔍 Loading roadmap data for projectId:', currentProjectId);

      // Lade Projekte, Milestones und Tasks parallel
      const [projectsData, milestonesData, tasksData] = await Promise.all([
        getProjects(),
        getMilestones(Number(currentProjectId)),
        getTasks(Number(currentProjectId))
      ]);

      setProjects(projectsData);
      setMilestones(milestonesData);
      setTasks(tasksData);

      // Erstelle Timeline-Items
      const timelineData = createTimelineItems(milestonesData, tasksData, projectsData.find(p => p.id === Number(currentProjectId)));
      setTimelineItems(timelineData);

    } catch (err: any) {
      console.error('❌ Error loading roadmap data:', err);
      setError(err.message || 'Fehler beim Laden der Roadmap-Daten');
    } finally {
      setLoading(false);
    }
  };

  const createTimelineItems = (milestones: Milestone[], tasks: Task[], project?: Project): TimelineItem[] => {
    const items: TimelineItem[] = [];

    // Füge Projekt hinzu
    if (project && project.start_date && project.end_date) {
      items.push({
        id: project.id,
        title: project.name,
        type: 'project',
        start_date: project.start_date,
        end_date: project.end_date,
        status: project.status,
        priority: 'medium',
        progress: project.progress_percentage,
        color: getStatusColor(project.status)
      });
    }

    // Füge Milestones hinzu
    milestones.forEach(milestone => {
      const startDate = milestone.start_date || milestone.planned_date;
      const endDate = milestone.end_date || milestone.planned_date;
      
      if (startDate) {
        items.push({
          id: milestone.id,
          title: milestone.title,
          type: 'milestone',
          start_date: startDate,
          end_date: endDate,
          status: milestone.status,
          priority: milestone.priority,
          progress: milestone.progress_percentage,
          category: milestone.category,
          contractor: milestone.contractor,
          budget: milestone.budget,
          color: getMilestoneColor(milestone.status, milestone.priority)
        });
      }
    });

    // Füge Tasks hinzu
    tasks.forEach(task => {
      if (task.due_date) {
        items.push({
          id: task.id,
          title: task.title,
          type: 'task',
          start_date: task.created_at.split('T')[0], // Verwende Erstellungsdatum als Start
          end_date: task.due_date,
          status: task.status,
          priority: task.priority,
          progress: task.progress_percentage,
          color: getTaskColor(task.status, task.priority)
        });
      }
    });

    // Sortiere nach Startdatum
    return items.sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime());
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'planning': return '#3B82F6';
      case 'preparation': return '#F59E0B';
      case 'execution': return '#10B981';
      case 'completion': return '#8B5CF6';
      case 'completed': return '#059669';
      case 'on_hold': return '#F97316';
      case 'cancelled': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const getMilestoneColor = (status: string, priority: string): string => {
    if (priority === 'critical') return '#EF4444';
    if (priority === 'high') return '#F97316';
    
    switch (status) {
      case 'planned': return '#3B82F6';
      case 'in_progress': return '#F59E0B';
      case 'completed': return '#10B981';
      case 'delayed': return '#EF4444';
      case 'cancelled': return '#6B7280';
      default: return '#6B7280';
    }
  };

  const getTaskColor = (status: string, priority: string): string => {
    if (priority === 'urgent') return '#EF4444';
    if (priority === 'high') return '#F97316';
    
    switch (status) {
      case 'todo': return '#6B7280';
      case 'in_progress': return '#F59E0B';
      case 'review': return '#8B5CF6';
      case 'completed': return '#10B981';
      case 'cancelled': return '#6B7280';
      default: return '#6B7280';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'planned': return 'Geplant';
      case 'in_progress': return 'In Bearbeitung';
      case 'completed': return 'Abgeschlossen';
      case 'delayed': return 'Verzögert';
      case 'cancelled': return 'Abgebrochen';
      case 'todo': return 'To Do';
      case 'review': return 'In Prüfung';
      case 'planning': return 'Planung';
      case 'preparation': return 'Vorbereitung';
      case 'execution': return 'Ausführung';
      case 'completion': return 'Fertigstellung';
      case 'on_hold': return 'Pausiert';
      default: return status;
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'low': return 'Niedrig';
      case 'medium': return 'Mittel';
      case 'high': return 'Hoch';
      case 'urgent': return 'Dringend';
      case 'critical': return 'Kritisch';
      default: return priority;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'project': return 'Projekt';
      case 'milestone': return 'Meilenstein';
      case 'task': return 'Aufgabe';
      default: return type;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'project': return <Building size={16} />;
      case 'milestone': return <Target size={16} />;
      case 'task': return <CheckSquare size={16} />;
      default: return <Square size={16} />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-DE');
  };

  const getFilteredItems = () => {
    let filtered = timelineItems;

    if (filterStatus !== 'all') {
      filtered = filtered.filter(item => item.status === filterStatus);
    }

    if (filterPriority !== 'all') {
      filtered = filtered.filter(item => item.priority === filterPriority);
    }

    return filtered;
  };

  const getProjectStats = () => {
    const currentProject = projects.find(p => p.id === Number(projectId));
    if (!currentProject) return null;

    const totalMilestones = milestones.length;
    const completedMilestones = milestones.filter(m => m.status === 'completed').length;
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === 'completed').length;
    const overdueItems = timelineItems.filter(item => {
      if (!item.end_date) return false;
      return new Date(item.end_date) < new Date() && item.status !== 'completed';
    }).length;

    return {
      project: currentProject,
      totalMilestones,
      completedMilestones,
      totalTasks,
      completedTasks,
      overdueItems,
      progress: currentProject.progress_percentage
    };
  };

  const stats = getProjectStats();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#ffbd59] mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Lade Roadmap...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-[#ffbd59] to-[#ffa726] rounded-xl flex items-center justify-center shadow-lg">
                <TrendingUp size={24} className="text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Roadmap</h1>
                <p className="text-gray-600">Zeitliche Übersicht und Projektplanung</p>
              </div>
            </div>
            <ProjectBreadcrumb />
          </div>
        </div>
      </header>

      {/* Error Banner */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 mb-6">
          <div className="flex items-center gap-3">
            <AlertTriangle size={20} />
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Project Stats */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Target size={20} className="text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Meilensteine</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.completedMilestones}/{stats.totalMilestones}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-green-100 rounded-lg">
                  <CheckSquare size={20} className="text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Aufgaben</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.completedTasks}/{stats.totalTasks}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-red-100 rounded-lg">
                  <AlertTriangle size={20} className="text-red-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Überfällig</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.overdueItems}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-yellow-100 rounded-lg">
                  <TrendingUp size={20} className="text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Fortschritt</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.progress}%</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <h2 className="text-lg font-semibold text-gray-900">Ansicht</h2>
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('gantt')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    viewMode === 'gantt' 
                      ? 'bg-white text-gray-900 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Gantt
                </button>
                <button
                  onClick={() => setViewMode('timeline')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    viewMode === 'timeline' 
                      ? 'bg-white text-gray-900 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Timeline
                </button>
                <button
                  onClick={() => setViewMode('calendar')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    viewMode === 'calendar' 
                      ? 'bg-white text-gray-900 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Kalender
                </button>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent"
              >
                <option value="all">Alle Status</option>
                <option value="planned">Geplant</option>
                <option value="in_progress">In Bearbeitung</option>
                <option value="completed">Abgeschlossen</option>
                <option value="delayed">Verzögert</option>
              </select>
              
              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent"
              >
                <option value="all">Alle Prioritäten</option>
                <option value="low">Niedrig</option>
                <option value="medium">Mittel</option>
                <option value="high">Hoch</option>
                <option value="critical">Kritisch</option>
              </select>
            </div>
          </div>
        </div>

        {/* Timeline View */}
        {viewMode === 'timeline' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Zeitliche Übersicht</h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {getFilteredItems().map((item) => (
                  <div key={`${item.type}-${item.id}`} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        {getTypeIcon(item.type)}
                        <span className="text-sm font-medium text-gray-900">{item.title}</span>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium`}
                              style={{ backgroundColor: `${item.color}20`, color: item.color }}>
                          {getStatusLabel(item.status)}
                        </span>
                        <span className="text-xs text-gray-500">{getPriorityLabel(item.priority)}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Calendar size={14} />
                        <span>{formatDate(item.start_date)}</span>
                      </div>
                      {item.end_date && (
                        <>
                          <ArrowRight size={14} />
                          <div className="flex items-center gap-1">
                            <Calendar size={14} />
                            <span>{formatDate(item.end_date)}</span>
                          </div>
                        </>
                      )}
                      <div className="flex items-center gap-1">
                        <BarChart3 size={14} />
                        <span>{item.progress}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Gantt Chart View */}
        {viewMode === 'gantt' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Gantt-Diagramm</h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {getFilteredItems().map((item) => (
                  <div key={`${item.type}-${item.id}`} className="flex items-center gap-4">
                    <div className="w-48 flex items-center gap-2">
                      {getTypeIcon(item.type)}
                      <span className="text-sm font-medium text-gray-900 truncate">{item.title}</span>
                    </div>
                    
                    <div className="flex-1 relative">
                      <div className="h-8 bg-gray-200 rounded-lg relative overflow-hidden">
                        <div
                          className="h-full rounded-lg transition-all duration-300"
                          style={{
                            backgroundColor: item.color,
                            width: `${item.progress}%`,
                            left: `${getProgressOffset(item.start_date)}%`
                          }}
                        />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-xs font-medium text-white drop-shadow-sm">
                            {item.progress}%
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="w-32 text-right text-sm text-gray-600">
                      {formatDate(item.start_date)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Calendar View */}
        {viewMode === 'calendar' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Kalenderansicht</h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-7 gap-4">
                {['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map(day => (
                  <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
                    {day}
                  </div>
                ))}
                
                {/* Placeholder für Kalender-Grid */}
                {Array.from({ length: 35 }, (_, i) => (
                  <div key={i} className="h-24 border border-gray-200 rounded-lg p-2">
                    <div className="text-xs text-gray-400 mb-1">{i + 1}</div>
                    {/* Hier würden die Timeline-Items als kleine Karten angezeigt */}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {getFilteredItems().length === 0 && (
          <div className="bg-white rounded-xl p-12 text-center shadow-sm border border-gray-200">
            <TrendingUp size={48} className="text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Keine Roadmap-Daten</h3>
            <p className="text-gray-600 mb-6">
              Für dieses Projekt sind noch keine zeitlich relevanten Daten vorhanden.
            </p>
            <div className="flex items-center justify-center gap-4 text-sm text-gray-500">
              <div className="flex items-center gap-1">
                <Target size={16} />
                <span>Meilensteine erstellen</span>
              </div>
              <div className="flex items-center gap-1">
                <CheckSquare size={16} />
                <span>Aufgaben planen</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar size={16} />
                <span>Termine setzen</span>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

// Hilfsfunktion für Gantt-Chart Positionierung
function getProgressOffset(startDate: string): number {
  const start = new Date(startDate);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, Math.min(100, (diffDays / 365) * 100)); // Vereinfachte Berechnung
} 