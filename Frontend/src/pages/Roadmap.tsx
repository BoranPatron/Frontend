import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Calendar, 
  Clock, 
  TrendingUp, 
  BarChart3, 
  Filter, 
  Download, 
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Layers,
  Target,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Play,
  Pause,
  Square
} from 'lucide-react';
import { getProjects } from '../api/projectService';
import { getTasks } from '../api/taskService';
import { getMilestones, getAllMilestones } from '../api/milestoneService';
import { getQuotes } from '../api/quoteService';
import { useAuth } from '../context/AuthContext';
import dayjs from 'dayjs';
import ProjectBreadcrumb from '../components/ProjectBreadcrumb';

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
  project_id: number;
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

interface BackendTask {
  id: number;
  project_id: number;
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

interface GanttItem {
  id: number;
  title: string;
  type: 'milestone' | 'task' | 'project';
  start_date: Date;
  end_date: Date;
  duration: number; // in Tagen
  status: string;
  priority: string;
  progress: number;
  category?: string;
  contractor?: string;
  budget?: number;
  actual_costs?: number;
  color: string;
  row: number; // Zeile im Gantt-Diagramm
}

export default function Roadmap() {
  console.log('Roadmap geladen');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { token } = useAuth();
  
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [tasks, setTasks] = useState<BackendTask[]>([]);
  const [quotes, setQuotes] = useState<any[]>([]);

  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Gantt-Diagramm Einstellungen
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [zoomLevel, setZoomLevel] = useState<number>(1); // 1 = Monat, 2 = Woche, 3 = Tag
  const [ganttItems, setGanttItems] = useState<GanttItem[]>([]);
  const [timeRange, setTimeRange] = useState<{ start: Date; end: Date }>({
    start: new Date(),
    end: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // +1 Jahr
  });

  const getProjectId = () => {
    const pathParts = window.location.pathname.split('/');
    const projectIndex = pathParts.indexOf('project');
    if (projectIndex !== -1 && pathParts[projectIndex + 1]) {
      return parseInt(pathParts[projectIndex + 1]);
    }
    return null;
  };

  useEffect(() => {
    if (token) {
      loadAllData();
    }
  }, [token]);

  useEffect(() => {
    const projectId = getProjectId();
    if (projectId && projects.length > 0) {
      setSelectedProjectId(projectId.toString());
      const project = projects.find(p => p.id === projectId);
      if (project) {
        setCurrentProject(project);
      }
    }
  }, [projects, searchParams]);

  useEffect(() => {
    createGanttItems();
  }, [milestones, tasks, projects, selectedProjectId, timeRange]);

  const loadAllData = async () => {
    try {
      setLoading(true);
      setError('');

      console.log('Lade alle Daten für Gantt-Diagramm...');

      // Lade alle Gewerke (Milestones)
      const milestonesData = await getAllMilestones();
      console.log('Gewerke geladen:', milestonesData.length);
      setMilestones(milestonesData);

      // Lade alle Aufgaben
      const tasksData = await getTasks();
      console.log('Aufgaben geladen:', tasksData.length);
      setTasks(tasksData);

      // Lade alle Projekte
      const projectsData = await getProjects();
      console.log('Projekte geladen:', projectsData.length);
      setProjects(projectsData);

      // Berechne Zeitbereich basierend auf allen Daten
      calculateTimeRange(milestonesData, tasksData, projectsData);

    } catch (err) {
      console.error('Fehler beim Laden der Daten:', err);
      setError('Fehler beim Laden der Daten');
    } finally {
      setLoading(false);
    }
  };

  const calculateTimeRange = (milestones: Milestone[], tasks: BackendTask[], projects: Project[]) => {
    let earliestDate = new Date();
    let latestDate = new Date();

    // Finde frühestes und spätestes Datum
    milestones.forEach(item => {
      const startDate = item.start_date || item.planned_date || item.created_at;
      const endDate = item.end_date || item.actual_date;
      
      if (startDate) {
        const date = new Date(startDate);
        if (date < earliestDate) earliestDate = date;
      }
      
      if (endDate) {
        const date = new Date(endDate);
        if (date > latestDate) latestDate = date;
      }
    });

    tasks.forEach(item => {
      const startDate = item.created_at;
      const endDate = item.due_date;
      
      if (startDate) {
        const date = new Date(startDate);
        if (date < earliestDate) earliestDate = date;
      }
      
      if (endDate) {
        const date = new Date(endDate);
        if (date > latestDate) latestDate = date;
      }
    });

    projects.forEach(item => {
      const startDate = item.start_date || item.created_at;
      const endDate = item.end_date;
      
      if (startDate) {
        const date = new Date(startDate);
        if (date < earliestDate) earliestDate = date;
      }
      
      if (endDate) {
        const date = new Date(endDate);
        if (date > latestDate) latestDate = date;
      }
    });

    // Erweitere den Bereich um 30 Tage
    earliestDate.setDate(earliestDate.getDate() - 30);
    latestDate.setDate(latestDate.getDate() + 30);

    setTimeRange({ start: earliestDate, end: latestDate });
  };

  const createGanttItems = () => {
    const items: GanttItem[] = [];
    let rowCounter = 0;

    // Filtere Daten basierend auf ausgewähltem Projekt
    const filteredMilestones = selectedProjectId === 'all' 
      ? milestones 
      : milestones.filter(m => m.project_id && m.project_id.toString() === selectedProjectId);
    
    const filteredTasks = selectedProjectId === 'all' 
      ? tasks 
      : tasks.filter(t => t.project_id && t.project_id.toString() === selectedProjectId);

    // Filtere nach Status
    const statusFilteredMilestones = statusFilter === 'all' 
      ? filteredMilestones 
      : filteredMilestones.filter(m => m.status === statusFilter);
    
    const statusFilteredTasks = statusFilter === 'all' 
      ? filteredTasks 
      : filteredTasks.filter(t => t.status === statusFilter);

    // Erstelle Gantt-Items für Gewerke
    statusFilteredMilestones.forEach(milestone => {
      try {
        // Sichere Datumserstellung mit Fallback
        let startDate: Date;
        let endDate: Date;

        // Startdatum
        if (milestone.start_date && milestone.start_date !== 'null' && milestone.start_date !== '') {
          startDate = new Date(milestone.start_date);
        } else if (milestone.planned_date && milestone.planned_date !== 'null' && milestone.planned_date !== '') {
          startDate = new Date(milestone.planned_date);
        } else {
          startDate = new Date(); // Fallback auf heute
        }

        // Enddatum
        if (milestone.end_date && milestone.end_date !== 'null' && milestone.end_date !== '') {
          endDate = new Date(milestone.end_date);
        } else if (milestone.actual_date && milestone.actual_date !== 'null' && milestone.actual_date !== '') {
          endDate = new Date(milestone.actual_date);
        } else if (milestone.planned_date && milestone.planned_date !== 'null' && milestone.planned_date !== '') {
          endDate = new Date(milestone.planned_date);
          endDate.setDate(endDate.getDate() + 7); // +7 Tage als Fallback
        } else {
          endDate = new Date(startDate);
          endDate.setDate(endDate.getDate() + 7); // +7 Tage als Fallback
        }

        // Prüfe ob Datum gültig ist
        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
          console.warn('Ungültiges Datum für Gewerk:', milestone.id, milestone.title);
          return; // Überspringe dieses Item
        }

        const duration = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));

        items.push({
          id: milestone.id,
          title: milestone.title,
          type: 'milestone',
          start_date: startDate,
          end_date: endDate,
          duration,
          status: milestone.status,
          priority: milestone.priority,
          progress: milestone.progress_percentage,
          category: milestone.category,
          contractor: milestone.contractor,
          budget: milestone.budget,
          actual_costs: milestone.actual_costs,
          color: getMilestoneColor(milestone.status, milestone.priority),
          row: rowCounter++
        });
      } catch (error) {
        console.error('Fehler beim Erstellen des Gewerks:', milestone.id, error);
      }
    });

    // Erstelle Gantt-Items für Aufgaben
    statusFilteredTasks.forEach(task => {
      try {
        if (task.due_date && task.due_date !== 'null' && task.due_date !== '') {
          const startDate = new Date(task.created_at);
          const endDate = new Date(task.due_date);

          // Prüfe ob Datum gültig ist
          if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
            console.warn('Ungültiges Datum für Aufgabe:', task.id, task.title);
            return; // Überspringe dieses Item
          }

          const duration = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));

          items.push({
            id: task.id,
            title: task.title,
            type: 'task',
            start_date: startDate,
            end_date: endDate,
            duration,
            status: task.status,
            priority: task.priority,
            progress: task.progress_percentage,
            color: getTaskColor(task.status, task.priority),
            row: rowCounter++
          });
        }
      } catch (error) {
        console.error('Fehler beim Erstellen der Aufgabe:', task.id, error);
      }
    });

    setGanttItems(items);
  };

  const getProjectColor = (status: string): string => {
    switch (status) {
      case 'planning': return '#3B82F6';
      case 'preparation': return '#8B5CF6';
      case 'execution': return '#10B981';
      case 'completion': return '#F59E0B';
      case 'completed': return '#059669';
      case 'on_hold': return '#6B7280';
      case 'cancelled': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const getMilestoneColor = (status: string, priority: string): string => {
    const baseColor = status === 'completed' ? '#10B981' :
                     status === 'in_progress' ? '#3B82F6' :
                     status === 'delayed' ? '#EF4444' :
                     status === 'cancelled' ? '#6B7280' : '#F59E0B';
    
    // Mache kritische Gewerke dunkler
    if (priority === 'critical') {
      return baseColor.replace(')', ', 0.8)').replace('rgb', 'rgba');
    }
    
    return baseColor;
  };

  const getTaskColor = (status: string, priority: string): string => {
    const baseColor = status === 'completed' ? '#10B981' :
                     status === 'in_progress' ? '#3B82F6' :
                     status === 'review' ? '#8B5CF6' :
                     status === 'cancelled' ? '#6B7280' : '#F59E0B';
    
    // Mache dringende Aufgaben dunkler
    if (priority === 'urgent') {
      return baseColor.replace(')', ', 0.8)').replace('rgb', 'rgba');
    }
    
    return baseColor;
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'planned': return 'Geplant';
      case 'in_progress': return 'In Bearbeitung';
      case 'completed': return 'Abgeschlossen';
      case 'delayed': return 'Verzögert';
      case 'cancelled': return 'Storniert';
      case 'todo': return 'To Do';
      case 'review': return 'In Prüfung';
      default: return status;
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'low': return 'Niedrig';
      case 'medium': return 'Mittel';
      case 'high': return 'Hoch';
      case 'critical': return 'Kritisch';
      case 'urgent': return 'Dringend';
      default: return priority;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'milestone': return 'Gewerk';
      case 'task': return 'Aufgabe';
      case 'project': return 'Projekt';
      default: return type;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'milestone': return '🏗️';
      case 'task': return '📋';
      case 'project': return '📁';
      default: return '📄';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-DE');
  };

  const getFilteredItems = () => {
    return ganttItems.filter(item => {
      if (statusFilter !== 'all' && item.status !== statusFilter) return false;
      return true;
    });
  };

  const getProjectStats = () => {
    const items = getFilteredItems();
    return {
      total: items.length,
      completed: items.filter(item => item.status === 'completed').length,
      inProgress: items.filter(item => item.status === 'in_progress').length,
      delayed: items.filter(item => item.status === 'delayed').length,
      milestones: items.filter(item => item.type === 'milestone').length,
      tasks: items.filter(item => item.type === 'task').length
    };
  };

  const handleProjectChange = (projectId: string) => {
    setSelectedProjectId(projectId);
  };

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 1, 3));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 1, 1));
  };

  const handleRefresh = () => {
    loadAllData();
  };

  const exportRoadmap = () => {
    const items = getFilteredItems();
    const csvContent = [
      ['ID', 'Titel', 'Typ', 'Status', 'Priorität', 'Startdatum', 'Enddatum', 'Dauer (Tage)', 'Fortschritt (%)', 'Kategorie', 'Auftragnehmer'],
      ...items.map(item => [
        item.id,
        item.title,
        getTypeLabel(item.type),
        getStatusLabel(item.status),
        getPriorityLabel(item.priority),
        item.start_date.toLocaleDateString('de-DE'),
        item.end_date.toLocaleDateString('de-DE'),
        item.duration,
        item.progress,
        item.category || '',
        item.contractor || ''
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `roadmap_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Berechne Zeitachse
  const getTimeAxis = () => {
    const days = Math.ceil((timeRange.end.getTime() - timeRange.start.getTime()) / (1000 * 60 * 60 * 24));
    const axis = [];
    
    for (let i = 0; i <= days; i += zoomLevel === 1 ? 30 : zoomLevel === 2 ? 7 : 1) {
      const date = new Date(timeRange.start);
      date.setDate(date.getDate() + i);
      axis.push(date);
    }
    
    return axis;
  };

  // Berechne Position und Breite für Gantt-Balken
  const getItemPosition = (item: GanttItem) => {
    const totalDays = (timeRange.end.getTime() - timeRange.start.getTime()) / (1000 * 60 * 60 * 24);
    const startOffset = (item.start_date.getTime() - timeRange.start.getTime()) / (1000 * 60 * 60 * 24);
    
    const left = (startOffset / totalDays) * 100;
    const width = (item.duration / totalDays) * 100;
    
    return { left: `${left}%`, width: `${width}%` };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#51646f] via-[#3d4952] to-[#2c3539] p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-400 rounded w-1/4 mb-6"></div>
            <div className="h-64 bg-gray-400 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#51646f] via-[#3d4952] to-[#2c3539] p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4">
            <p className="text-red-300">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  const filteredItems = getFilteredItems();
  const stats = getProjectStats();
  const timeAxis = getTimeAxis();

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#51646f] via-[#3d4952] to-[#2c3539]">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-6">
          <ProjectBreadcrumb />
          <div className="flex items-center justify-between mt-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Gantt-Diagramm</h1>
              <p className="text-gray-600 mt-2">
                Zeitliche Übersicht aller Gewerke und Aufgaben
                {currentProject && ` - ${currentProject.name}`}
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={handleRefresh}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                🔄 Aktualisieren
              </button>
              <button
                onClick={exportRoadmap}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                📊 Export CSV
              </button>
            </div>
          </div>
        </div>

        {/* Filter und Steuerung */}
        <div className="group relative bg-white/10 backdrop-blur-lg rounded-3xl p-6 border border-white/20 hover:border-[#ffbd59]/30 transition-all duration-500">
          <div className="absolute inset-0 bg-gradient-to-br from-[#ffbd59]/5 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="relative flex flex-wrap items-center gap-4">
            <div>
              <label className="block text-sm font-medium text-white mb-1">Projekt</label>
              <select
                value={selectedProjectId}
                onChange={(e) => handleProjectChange(e.target.value)}
                className="border border-white/30 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#ffbd59] bg-white/10 text-white placeholder-gray-300"
              >
                <option value="all">Alle Projekte</option>
                {projects.map(project => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-1">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border border-white/30 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#ffbd59] bg-white/10 text-white placeholder-gray-300"
              >
                <option value="all">Alle Status</option>
                <option value="planned">Geplant</option>
                <option value="in_progress">In Bearbeitung</option>
                <option value="completed">Abgeschlossen</option>
                <option value="delayed">Verzögert</option>
                <option value="cancelled">Storniert</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-1">Zoom</label>
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleZoomOut}
                  className="px-3 py-2 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-colors border border-white/20"
                >
                  🔍-
                </button>
                <span className="text-sm text-gray-300">
                  {zoomLevel === 1 ? 'Monat' : zoomLevel === 2 ? 'Woche' : 'Tag'}
                </span>
                <button
                  onClick={handleZoomIn}
                  className="px-3 py-2 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-colors border border-white/20"
                >
                  🔍+
                </button>
              </div>
            </div>

            <div className="ml-auto">
              <div className="text-sm text-gray-300">
                <span className="font-medium text-white">{stats.total}</span> Einträge
                <span className="mx-2">•</span>
                <span className="text-[#ffbd59]">{stats.completed}</span> abgeschlossen
                <span className="mx-2">•</span>
                <span className="text-[#ffbd59]">{stats.inProgress}</span> in Bearbeitung
                <span className="mx-2">•</span>
                <span className="text-[#ffbd59]">{stats.delayed}</span> verzögert
              </div>
            </div>
          </div>
        </div>

        {/* Gantt-Diagramm */}
        <div className="group relative bg-white/10 backdrop-blur-lg rounded-3xl border border-white/20 overflow-hidden">
          {/* Zeitachse */}
          <div className="border-b border-white/20 bg-white/5">
            <div className="flex">
              <div className="w-64 bg-white/10 border-r border-white/20 p-3">
                <span className="text-sm font-medium text-white">Zeitachse</span>
              </div>
              <div className="flex-1 flex">
                {timeAxis.map((date, index) => (
                  <div
                    key={index}
                    className="flex-1 border-r border-white/20 p-2 text-center"
                    style={{ minWidth: zoomLevel === 1 ? '120px' : zoomLevel === 2 ? '80px' : '60px' }}
                  >
                    <div className="text-xs text-gray-300">
                      {date.toLocaleDateString('de-DE', { 
                        month: zoomLevel === 1 ? 'short' : 'numeric',
                        day: zoomLevel === 1 ? undefined : 'numeric'
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Gantt-Inhalt */}
          <div className="overflow-x-auto">
            <div className="min-w-full">
              {filteredItems.map((item, index) => {
                const position = getItemPosition(item);
                return (
                  <div key={item.id} className="flex border-b border-white/10 hover:bg-white/5">
                    {/* Item-Info */}
                    <div className="w-64 bg-white/5 border-r border-white/20 p-3 flex-shrink-0">
                      <div className="flex items-center space-x-2">
                        <span className="text-lg">{getTypeIcon(item.type)}</span>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-white truncate">
                            {item.title}
                          </div>
                          <div className="text-xs text-gray-300">
                            {getTypeLabel(item.type)} • {getStatusLabel(item.status)}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Gantt-Balken */}
                    <div className="flex-1 relative" style={{ minHeight: '60px' }}>
                      <div
                        className="absolute top-3 h-8 rounded-xl shadow-lg border border-white/20 flex items-center justify-center text-xs font-medium text-white cursor-pointer hover:shadow-xl transition-all duration-300 hover:scale-105"
                        style={{
                          left: position.left,
                          width: position.width,
                          backgroundColor: item.color,
                          minWidth: '20px'
                        }}
                        title={`${item.title} (${item.duration} Tage, ${item.progress}% Fortschritt)`}
                      >
                        <span className="truncate px-1">
                          {item.duration <= 3 ? item.title : `${item.duration}d`}
                        </span>
                      </div>
                      
                      {/* Fortschrittsbalken */}
                      {item.progress > 0 && (
                        <div
                          className="absolute top-3 h-8 bg-white bg-opacity-40 rounded-l-xl"
                          style={{
                            left: position.left,
                            width: `${(item.progress / 100) * parseFloat(position.width)}%`
                          }}
                        />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Legende */}
        <div className="mt-6 group relative bg-white/10 backdrop-blur-lg rounded-3xl p-6 border border-white/20 hover:border-[#ffbd59]/30 transition-all duration-500">
          <div className="absolute inset-0 bg-gradient-to-br from-[#ffbd59]/5 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="relative">
            <h3 className="text-lg font-medium text-white mb-3">Legende</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-blue-500 rounded-lg shadow-lg"></div>
                <span className="text-sm text-gray-300">In Bearbeitung</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-green-500 rounded-lg shadow-lg"></div>
                <span className="text-sm text-gray-300">Abgeschlossen</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-yellow-500 rounded-lg shadow-lg"></div>
                <span className="text-sm text-gray-300">Geplant</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-red-500 rounded-lg shadow-lg"></div>
                <span className="text-sm text-gray-300">Verzögert</span>
              </div>
            </div>
          </div>
        </div>

        {/* Zeittabelle */}
        <div className="mt-6 group relative bg-white/10 backdrop-blur-lg rounded-3xl border border-white/20 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[#ffbd59]/5 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="relative">
            <div className="p-6 border-b border-white/20">
              <h3 className="text-lg font-medium text-white">Zeitübersicht</h3>
              <p className="text-sm text-gray-300 mt-1">Alle relevanten Termine und Zeiträume</p>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white/5 border-b border-white/20">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Typ
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Titel
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Projekt
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Priorität
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Start
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Ende
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Dauer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Fortschritt
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Auftragnehmer
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {filteredItems.map((item, index) => (
                    <tr key={item.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <span className="text-lg">{getTypeIcon(item.type)}</span>
                          <span className="text-sm text-gray-300">{getTypeLabel(item.type)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-white">{item.title}</div>
                        {item.category && (
                          <div className="text-xs text-gray-400">{item.category}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-300">
                          {projects.find(p => p.id === (item.type === 'project' ? item.id : 
                            milestones.find(m => m.id === item.id)?.project_id || 
                            tasks.find(t => t.id === item.id)?.project_id))?.name || 'Unbekannt'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          item.status === 'completed' ? 'bg-green-500/20 text-green-300' :
                          item.status === 'in_progress' ? 'bg-blue-500/20 text-blue-300' :
                          item.status === 'delayed' ? 'bg-red-500/20 text-red-300' :
                          'bg-yellow-500/20 text-yellow-300'
                        }`}>
                          {getStatusLabel(item.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          item.priority === 'high' || item.priority === 'critical' ? 'bg-red-500/20 text-red-300' :
                          item.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-300' :
                          'bg-green-500/20 text-green-300'
                        }`}>
                          {getPriorityLabel(item.priority)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {item.start_date.toLocaleDateString('de-DE')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {item.end_date.toLocaleDateString('de-DE')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {item.duration} Tage
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <div className="w-16 bg-white/20 rounded-full h-2">
                            <div 
                              className="bg-[#ffbd59] h-2 rounded-full transition-all duration-300"
                              style={{ width: `${item.progress}%` }}
                            ></div>
                          </div>
                          <span className="text-sm text-gray-300">{item.progress}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {item.contractor || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 