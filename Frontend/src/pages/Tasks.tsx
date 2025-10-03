import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  Calendar, 
  Clock,
  User,
  AlertTriangle,
  CheckCircle,
  XCircle,
  MoreHorizontal,
  ArrowLeft,
  PlusCircle,
  RefreshCw,
  Search,
  Filter,
  ListTodo,
  Play,
  RotateCcw,
  Flag,
  CalendarDays,
  Users,
  Target,
  BarChart3,
  FolderOpen,
  Home,
  ClipboardList,
  TrendingUp
} from 'lucide-react';
import { getTasks, createTask, updateTask, deleteTask, getTaskStatistics } from '../api/taskService';
import { useAuth } from '../context/AuthContext';
import { getProjects } from '../api/projectService';
import ProjectBreadcrumb from '../components/ProjectBreadcrumb';

interface Task {
  id: number;
  title: string;
  description: string;
  status: 'todo' | 'in_progress' | 'review' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  project_id: number;
  assigned_to?: number;
  created_by: number;
  due_date?: string;
  estimated_hours?: number;
  actual_hours?: number;
  progress_percentage: number;
  is_milestone: boolean;
  created_at: string;
  updated_at: string;
  completed_at?: string;
}

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
  created_at: string;
}

export default function Tasks() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deletingTask, setDeletingTask] = useState<number | null>(null);
  const [selectedProject, setSelectedProject] = useState<number | null>(null);

  // Form state für neue/bearbeitete Aufgabe
  const [formData, setFormData] = useState<{
    title: string;
    description: string;
    status: 'todo' | 'in_progress' | 'review' | 'completed' | 'cancelled';
    priority: 'low' | 'medium' | 'high' | 'urgent';
    project_id: string;
    assigned_to: string;
    due_date: string;
    estimated_hours: string;
    is_milestone: boolean;
  }>({
    title: '',
    description: '',
    status: 'todo',
    priority: 'medium',
    project_id: '',
    assigned_to: '',
    due_date: '',
    estimated_hours: '',
    is_milestone: false
  });

  useEffect(() => {
    // Lese Projekt-ID aus URL-Parametern
    const urlParams = new URLSearchParams(location.search);
    const projectId = urlParams.get('project');
    
    if (projectId) {
      const projectIdNum = parseInt(projectId);
      setSelectedProject(projectIdNum);
      setFormData(prev => ({ ...prev, project_id: projectId }));
    }
    
    loadProjects();
  }, [location.search]);

  useEffect(() => {
    loadTasks();
  }, [selectedProject]);

  const loadProjects = async () => {
    try {
      const data = await getProjects();
      setProjects(data);
    } catch (err: any) {
      console.error('❌ Error loading projects:', err);
      setProjects([]);
    }
  };

  const loadTasks = async () => {
    setLoading(true);
    try {
      // Wenn ein Projekt ausgewählt ist, lade nur dessen Aufgaben
      // Ansonsten lade alle Aufgaben des Benutzers
      const data = await getTasks(selectedProject || undefined);
      setTasks(data);
    } catch (err: any) {
      console.error('❌ Error in loadTasks:', err);
      const errorMessage = err.message || 'Unbekannter Fehler beim Laden der Aufgaben';
      setError(errorMessage);
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); // Lösche vorherige Fehler
    
    try {
      // Validiere erforderliche Felder
      if (!formData.title.trim()) {
        setError('Aufgabentitel ist erforderlich');
        return;
      }
      
      if (!formData.project_id) {
        setError('Projekt-ID ist erforderlich');
        return;
      }
      
      const taskData = {
        ...formData,
        project_id: parseInt(formData.project_id),
        assigned_to: formData.assigned_to ? parseInt(formData.assigned_to) : null,
        estimated_hours: formData.estimated_hours ? parseInt(formData.estimated_hours) : null
      };
      
      await createTask(taskData);
      
      setShowCreateModal(false);
      resetForm();
      await loadTasks(); // Lade Aufgaben neu
      
    } catch (err: any) {
      console.error('❌ Error in handleCreateTask:', err);
      
      // Zeige spezifische Fehlermeldung
      const errorMessage = err.message || 'Unbekannter Fehler beim Erstellen der Aufgabe';
      setError(errorMessage);
      
      // Logge zusätzliche Details für Debugging
      if (err.response) {
        console.error('Response error details:', {
          status: err.response.status,
          data: err.response.data,
          headers: err.response.headers
        });
      }
    }
  };

  const handleUpdateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask) return;
    
    try {
      const taskData = {
        ...formData,
        project_id: parseInt(formData.project_id) || editingTask.project_id,
        assigned_to: formData.assigned_to ? parseInt(formData.assigned_to) : null,
        estimated_hours: formData.estimated_hours ? parseInt(formData.estimated_hours) : null
      };
      
      await updateTask(editingTask.id, taskData);
      setShowEditModal(false);
      setEditingTask(null);
      resetForm();
      loadTasks();
    } catch (err: any) {
      console.error('Error in handleUpdateTask:', err);
      const errorMessage = err.message || 'Unbekannter Fehler beim Aktualisieren der Aufgabe';
      setError(errorMessage);
    }
  };

  const handleDeleteTask = async (taskId: number) => {
    try {
      await deleteTask(taskId);
      setDeletingTask(null);
      loadTasks();
    } catch (err: any) {
      console.error('Error in handleDeleteTask:', err);
      const errorMessage = err.message || 'Unbekannter Fehler beim Löschen der Aufgabe';
      setError(errorMessage);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      status: 'todo',
      priority: 'medium',
      project_id: selectedProject ? selectedProject.toString() : '',
      assigned_to: '',
      due_date: '',
      estimated_hours: '',
      is_milestone: false
    });
  };

  const openEditModal = (task: Task) => {
    setEditingTask(task);
    setFormData({
      title: task.title,
      description: task.description || '',
      status: task.status,
      priority: task.priority,
      project_id: task.project_id.toString(),
      assigned_to: task.assigned_to?.toString() || '',
      due_date: task.due_date || '',
      estimated_hours: task.estimated_hours?.toString() || '',
      is_milestone: task.is_milestone
    });
    setShowEditModal(true);
  };

  // Filtere und suche Aufgaben
  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || task.status === filterStatus;
    const matchesPriority = filterPriority === 'all' || task.priority === filterPriority;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  // Gruppiere Aufgaben nach Status für Kanban-Board
  const groupedTasks = {
    todo: filteredTasks.filter(task => task.status === 'todo'),
    in_progress: filteredTasks.filter(task => task.status === 'in_progress'),
    review: filteredTasks.filter(task => task.status === 'review'),
    completed: filteredTasks.filter(task => task.status === 'completed')
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'todo': return <ListTodo size={20} />;
      case 'in_progress': return <Play size={20} />;
      case 'review': return <RotateCcw size={20} />;
      case 'completed': return <CheckCircle size={20} />;
      case 'cancelled': return <XCircle size={20} />;
      default: return <ListTodo size={20} />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'todo': return 'To Do';
      case 'in_progress': return 'In Bearbeitung';
      case 'review': return 'In Prüfung';
      case 'completed': return 'Abgeschlossen';
      case 'cancelled': return 'Abgebrochen';
      default: return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'todo': return 'bg-gray-100 text-gray-700 border-gray-200';
      case 'in_progress': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'review': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'completed': return 'bg-green-100 text-green-700 border-green-200';
      case 'cancelled': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return 'bg-green-100 text-green-700 border-green-200';
      case 'medium': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'high': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'urgent': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'low': return 'Niedrig';
      case 'medium': return 'Mittel';
      case 'high': return 'Hoch';
      case 'urgent': return 'Dringend';
      default: return priority;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#51646f] via-[#3d4952] to-[#2c3539] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#ffbd59] mx-auto mb-4"></div>
          <p className="text-white">Lade Aufgaben...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#51646f] via-[#3d4952] to-[#2c3539] flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="bg-red-50 border border-red-200 rounded-2xl p-6 mb-6">
            <h2 className="text-xl font-bold text-red-800 mb-4">Fehler beim Laden</h2>
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
            >
              Seite neu laden
            </button>
          </div>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
          >
            Zurück zum Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#51646f] via-[#3d4952] to-[#2c3539]">
      <ProjectBreadcrumb />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate(-1)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft size={20} className="text-gray-600" />
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Aufgaben</h1>
                <p className="text-gray-600">
                  Aufgabenverwaltung & Projektplanung
                  {selectedProject && (
                    <span className="block text-sm text-blue-600 mt-1">
                      Projekt-ID: {selectedProject}
                    </span>
                  )}
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all duration-300 transform hover:scale-105 shadow-lg font-semibold"
            >
              <Plus size={20} />
              Aufgabe erstellen
            </button>
          </div>
        </header>

        {/* Error Banner */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 flex items-center justify-between mb-6 rounded-xl">
            <div className="flex items-center gap-3">
              <AlertTriangle size={20} />
              <span>{error}</span>
            </div>
            <button onClick={() => setError('')} className="text-red-500 hover:text-red-700">
              <XCircle size={20} />
            </button>
          </div>
        )}

        {/* Success Banner */}
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-6 py-4 flex items-center justify-between mb-6 rounded-xl">
            <div className="flex items-center gap-3">
              <CheckCircle size={20} />
              <span>{success}</span>
            </div>
            <button onClick={() => setSuccess('')} className="text-green-500 hover:text-green-700">
              <XCircle size={20} />
            </button>
          </div>
        )}

        <div className="max-w-7xl mx-auto">
          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="group relative bg-white/10 backdrop-blur-lg rounded-3xl p-6 border border-white/20 hover:border-[#ffbd59]/30 transition-all duration-500 transform hover:-translate-y-1 hover:scale-105">
              <div className="absolute inset-0 bg-gradient-to-br from-[#ffbd59]/5 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-[#ffbd59] to-[#ffa726] rounded-2xl blur-lg opacity-30 group-hover:opacity-50 transition-opacity duration-500"></div>
                    <div className="relative w-12 h-12 bg-gradient-to-br from-[#ffbd59] to-[#ffa726] rounded-2xl flex items-center justify-center shadow-xl group-hover:shadow-2xl transition-all duration-500 transform group-hover:scale-110">
                      <ClipboardList size={24} className="text-white drop-shadow-lg" />
                    </div>
                  </div>
                  <span className="text-sm text-gray-400">Gesamt</span>
                </div>
                <h3 className="text-3xl font-bold text-white mb-1 group-hover:text-[#ffbd59] transition-all duration-300">{tasks.length}</h3>
                <p className="text-sm text-gray-300">Aufgaben</p>
              </div>
            </div>

            <div className="group relative bg-white/10 backdrop-blur-lg rounded-3xl p-6 border border-white/20 hover:border-[#ffbd59]/30 transition-all duration-500 transform hover:-translate-y-1 hover:scale-105">
              <div className="absolute inset-0 bg-gradient-to-br from-[#ffbd59]/5 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-[#ffbd59] to-[#ffa726] rounded-2xl blur-lg opacity-30 group-hover:opacity-50 transition-opacity duration-500"></div>
                    <div className="relative w-12 h-12 bg-gradient-to-br from-[#ffbd59] to-[#ffa726] rounded-2xl flex items-center justify-center shadow-xl group-hover:shadow-2xl transition-all duration-500 transform group-hover:scale-110">
                      <CheckCircle size={24} className="text-white drop-shadow-lg" />
                    </div>
                  </div>
                  <span className="text-sm text-gray-400">Erledigt</span>
                </div>
                <h3 className="text-3xl font-bold text-white mb-1 group-hover:text-[#ffbd59] transition-all duration-300">
                  {tasks.filter(t => t.status === 'completed').length}
                </h3>
                <p className="text-sm text-gray-300">Abgeschlossen</p>
              </div>
            </div>

            <div className="group relative bg-white/10 backdrop-blur-lg rounded-3xl p-6 border border-white/20 hover:border-[#ffbd59]/30 transition-all duration-500 transform hover:-translate-y-1 hover:scale-105">
              <div className="absolute inset-0 bg-gradient-to-br from-[#ffbd59]/5 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-[#ffbd59] to-[#ffa726] rounded-2xl blur-lg opacity-30 group-hover:opacity-50 transition-opacity duration-500"></div>
                    <div className="relative w-12 h-12 bg-gradient-to-br from-[#ffbd59] to-[#ffa726] rounded-2xl flex items-center justify-center shadow-xl group-hover:shadow-2xl transition-all duration-500 transform group-hover:scale-110">
                      <Clock size={24} className="text-white drop-shadow-lg" />
                    </div>
                  </div>
                  <span className="text-sm text-gray-400">In Bearbeitung</span>
                </div>
                <h3 className="text-3xl font-bold text-white mb-1 group-hover:text-[#ffbd59] transition-all duration-300">
                  {tasks.filter(t => t.status === 'in_progress').length}
                </h3>
                <p className="text-sm text-gray-300">Aktiv</p>
              </div>
            </div>

            <div className="group relative bg-white/10 backdrop-blur-lg rounded-3xl p-6 border border-white/20 hover:border-[#ffbd59]/30 transition-all duration-500 transform hover:-translate-y-1 hover:scale-105">
              <div className="absolute inset-0 bg-gradient-to-br from-[#ffbd59]/5 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-[#ffbd59] to-[#ffa726] rounded-2xl blur-lg opacity-30 group-hover:opacity-50 transition-opacity duration-500"></div>
                    <div className="relative w-12 h-12 bg-gradient-to-br from-[#ffbd59] to-[#ffa726] rounded-2xl flex items-center justify-center shadow-xl group-hover:shadow-2xl transition-all duration-500 transform group-hover:scale-110">
                      <AlertTriangle size={24} className="text-white drop-shadow-lg" />
                    </div>
                  </div>
                  <span className="text-sm text-gray-400">Überfällig</span>
                </div>
                <h3 className="text-3xl font-bold text-white mb-1 group-hover:text-[#ffbd59] transition-all duration-300">
                  {tasks.filter(t => t.due_date && new Date(t.due_date) < new Date()).length}
                </h3>
                <p className="text-sm text-gray-300">Fällig</p>
              </div>
            </div>
          </div>

          {/* Search and Filter */}
          <div className="flex flex-col md:flex-row gap-4 mb-8">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Aufgaben durchsuchen..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
              />
            </div>
            
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="pl-10 pr-8 py-3 bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent appearance-none cursor-pointer shadow-sm"
              >
                <option value="all" className="bg-[#3d4952] text-white">Alle Status</option>
                <option value="todo" className="bg-[#3d4952] text-white">To Do</option>
                <option value="in_progress" className="bg-[#3d4952] text-white">In Bearbeitung</option>
                <option value="review" className="bg-[#3d4952] text-white">In Prüfung</option>
                <option value="completed" className="bg-[#3d4952] text-white">Abgeschlossen</option>
                <option value="cancelled" className="bg-[#3d4952] text-white">Abgebrochen</option>
              </select>
            </div>
          </div>

          {/* Tasks Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTasks.map((task) => (
              <div key={task.id} className="group relative bg-white/10 backdrop-blur-lg rounded-3xl p-6 cursor-pointer transition-all duration-500 hover:bg-white/15 hover:shadow-2xl focus:outline-none focus:ring-2 focus:ring-[#ffbd59] focus:ring-opacity-50 border border-white/20 hover:border-[#ffbd59]/30 transform hover:-translate-y-2 hover:scale-105">
                {/* Animated Background Glow */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#ffbd59]/5 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-br from-[#ffbd59] to-[#ffa726] rounded-2xl blur-lg opacity-30 group-hover:opacity-50 transition-opacity duration-500"></div>
                      <div className="relative w-16 h-16 bg-gradient-to-br from-[#ffbd59] to-[#ffa726] rounded-2xl flex items-center justify-center shadow-xl group-hover:shadow-2xl transition-all duration-500 transform group-hover:scale-110 group-hover:rotate-3">
                        <div className="text-white drop-shadow-lg">
                          {getStatusIcon(task.status)}
                        </div>
                      </div>
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-lg group-hover:text-[#ffbd59] transition-all duration-300">
                        {task.title}
                      </h3>
                      <p className="text-sm text-gray-300 group-hover:text-gray-200 transition-colors">{task.description}</p>
                    </div>
                  </div>
                  
                  {/* Actions Menu */}
                  <div className="relative">
                    <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                      <MoreHorizontal size={16} className="text-gray-300" />
                    </button>
                    <div className="absolute right-0 top-full mt-2 w-48 bg-[#3d4952] rounded-xl shadow-lg border border-white/20 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-[100]">
                      <button
                        onClick={() => openEditModal(task)}
                        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/10 transition-colors rounded-t-xl text-white"
                      >
                        <Edit size={16} />
                        <span>Bearbeiten</span>
                      </button>
                      <button
                        onClick={() => handleDeleteTask(task.id)}
                        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-red-500/20 text-red-300 transition-colors rounded-b-xl"
                      >
                        <Trash2 size={16} />
                        <span>Löschen</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Task Details */}
                <div className="space-y-3 mb-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">Status</span>
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-[#ffbd59] to-[#ffa726] text-white shadow-lg">
                        {getStatusLabel(task.status)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <Calendar size={14} className="text-[#ffbd59]" />
                      <span className="text-gray-400">Fällig:</span>
                      <span className="text-white ml-1">
                        {task.due_date ? new Date(task.due_date).toLocaleDateString('de-DE') : 'Kein Datum'}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <TrendingUp size={14} className="text-[#ffbd59]" />
                      <span className="text-gray-400">Fortschritt:</span>
                      <span className="text-[#ffbd59] font-bold ml-1">{task.progress_percentage}%</span>
                    </div>
                  </div>
                  
                  {task.is_milestone && (
                    <div className="flex items-center gap-2 p-2 bg-[#ffbd59]/20 border border-[#ffbd59]/30 rounded-lg">
                      <Target size={14} className="text-[#ffbd59]" />
                      <span className="text-sm text-[#ffbd59] font-medium">Meilenstein</span>
                    </div>
                  )}
                </div>

                {/* Progress Bar */}
                <div className="space-y-3 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Fortschritt</span>
                    <span className="text-[#ffbd59] font-bold">{task.progress_percentage}%</span>
                  </div>
                  <div className="relative w-full bg-gray-700/50 rounded-full h-3 backdrop-blur-sm border border-gray-600/30 overflow-hidden">
                    <div 
                      className="absolute inset-0 bg-gradient-to-r from-[#ffbd59] to-[#ffa726] h-3 rounded-full transition-all duration-1000 ease-out shadow-lg"
                      style={{ width: `${task.progress_percentage}%` }}
                      role="progressbar"
                      aria-valuenow={task.progress_percentage}
                      aria-valuemin={0}
                      aria-valuemax={100}
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent h-3 rounded-full animate-pulse"></div>
                  </div>
                </div>

                {/* Priority */}
                <div className="flex flex-wrap gap-2">
                  <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-[#ffbd59] to-[#ffa726] text-white shadow-lg transform group-hover:scale-110 transition-transform duration-300">
                    <span>{getPriorityLabel(task.priority)}</span>
                  </div>
                </div>
                
                {/* Hover Effect Overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#ffbd59]/0 to-[#ffbd59]/5 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
              </div>
            ))}
          </div>

          {/* Empty State */}
          {filteredTasks.length === 0 && (
            <div className="text-center py-12">
              <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200 max-w-md mx-auto">
                <ClipboardList size={48} className="text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Keine Aufgaben gefunden</h3>
                <p className="text-gray-500 mb-6">
                  {searchTerm || filterStatus !== 'all' 
                    ? 'Versuchen Sie andere Suchkriterien oder Filter.'
                    : 'Erstellen Sie Ihre erste Aufgabe, um zu beginnen.'
                  }
                </p>
                {!searchTerm && filterStatus === 'all' && (
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all duration-300 font-semibold"
                  >
                    Erste Aufgabe erstellen
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create Task Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#3d4952] rounded-2xl p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">Neue Aufgabe erstellen</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <XCircle size={24} className="text-gray-400" />
              </button>
            </div>
            
            <form onSubmit={handleCreateTask} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Aufgabentitel *</label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent"
                    placeholder="z.B. Elektroinstallation planen"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Status *</label>
                  <select
                    required
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value as any})}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent"
                  >
                    <option value="todo" className="bg-[#3d4952] text-white">To Do</option>
                    <option value="in_progress" className="bg-[#3d4952] text-white">In Bearbeitung</option>
                    <option value="review" className="bg-[#3d4952] text-white">In Prüfung</option>
                    <option value="completed" className="bg-[#3d4952] text-white">Abgeschlossen</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Beschreibung</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  rows={3}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent"
                  placeholder="Beschreiben Sie die Aufgabe..."
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Priorität *</label>
                  <select
                    required
                    value={formData.priority}
                    onChange={(e) => setFormData({...formData, priority: e.target.value as any})}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent"
                  >
                    <option value="low" className="bg-[#3d4952] text-white">Niedrig</option>
                    <option value="medium" className="bg-[#3d4952] text-white">Mittel</option>
                    <option value="high" className="bg-[#3d4952] text-white">Hoch</option>
                    <option value="urgent" className="bg-[#3d4952] text-white">Dringend</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Projekt *</label>
                  <select
                    required
                    value={formData.project_id}
                    onChange={(e) => setFormData({...formData, project_id: e.target.value})}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent"
                  >
                    <option value="" className="bg-[#3d4952] text-white">Projekt auswählen...</option>
                    {projects.map((project) => (
                      <option key={project.id} value={project.id} className="bg-[#3d4952] text-white">
                        {project.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Fälligkeitsdatum</label>
                  <input
                    type="date"
                    value={formData.due_date}
                    onChange={(e) => setFormData({...formData, due_date: e.target.value})}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Geschätzte Stunden</label>
                  <input
                    type="number"
                    value={formData.estimated_hours}
                    onChange={(e) => setFormData({...formData, estimated_hours: e.target.value})}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent"
                    placeholder="8"
                  />
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="is_milestone"
                  checked={formData.is_milestone}
                  onChange={(e) => setFormData({...formData, is_milestone: e.target.checked})}
                  className="w-4 h-4 text-[#ffbd59] bg-white/10 border-white/20 rounded focus:ring-[#ffbd59] focus:ring-2"
                />
                <label htmlFor="is_milestone" className="text-sm text-gray-300">
                  Als Meilenstein markieren
                </label>
              </div>
              
              <div className="flex gap-4 pt-6">
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-[#ffbd59] to-[#ffa726] text-[#3d4952] font-bold py-3 rounded-xl hover:from-[#ffa726] hover:to-[#ff9800] transition-all duration-300 transform hover:scale-105"
                >
                  Aufgabe erstellen
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 bg-white/10 text-white font-bold py-3 rounded-xl hover:bg-white/20 transition-all duration-300"
                >
                  Abbrechen
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Task Modal */}
      {showEditModal && editingTask && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#3d4952] rounded-2xl p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">Aufgabe bearbeiten</h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <XCircle size={24} className="text-gray-400" />
              </button>
            </div>
            
            <form onSubmit={handleUpdateTask} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Aufgabentitel *</label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Status *</label>
                  <select
                    required
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value as any})}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent"
                  >
                    <option value="todo" className="bg-[#3d4952] text-white">To Do</option>
                    <option value="in_progress" className="bg-[#3d4952] text-white">In Bearbeitung</option>
                    <option value="review" className="bg-[#3d4952] text-white">In Prüfung</option>
                    <option value="completed" className="bg-[#3d4952] text-white">Abgeschlossen</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Beschreibung</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  rows={3}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Priorität *</label>
                  <select
                    required
                    value={formData.priority}
                    onChange={(e) => setFormData({...formData, priority: e.target.value as any})}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent"
                  >
                    <option value="low" className="bg-[#3d4952] text-white">Niedrig</option>
                    <option value="medium" className="bg-[#3d4952] text-white">Mittel</option>
                    <option value="high" className="bg-[#3d4952] text-white">Hoch</option>
                    <option value="urgent" className="bg-[#3d4952] text-white">Dringend</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Projekt *</label>
                  <select
                    required
                    value={formData.project_id}
                    onChange={(e) => setFormData({...formData, project_id: e.target.value})}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent"
                  >
                    <option value="" className="bg-[#3d4952] text-white">Projekt auswählen...</option>
                    {projects.map((project) => (
                      <option key={project.id} value={project.id} className="bg-[#3d4952] text-white">
                        {project.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Fälligkeitsdatum</label>
                  <input
                    type="date"
                    value={formData.due_date}
                    onChange={(e) => setFormData({...formData, due_date: e.target.value})}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Geschätzte Stunden</label>
                  <input
                    type="number"
                    value={formData.estimated_hours}
                    onChange={(e) => setFormData({...formData, estimated_hours: e.target.value})}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent"
                  />
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="edit_is_milestone"
                  checked={formData.is_milestone}
                  onChange={(e) => setFormData({...formData, is_milestone: e.target.checked})}
                  className="w-4 h-4 text-[#ffbd59] bg-white/10 border-white/20 rounded focus:ring-[#ffbd59] focus:ring-2"
                />
                <label htmlFor="edit_is_milestone" className="text-sm text-gray-300">
                  Als Meilenstein markieren
                </label>
              </div>
              
              <div className="flex gap-4 pt-6">
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-[#ffbd59] to-[#ffa726] text-[#3d4952] font-bold py-3 rounded-xl hover:from-[#ffa726] hover:to-[#ff9800] transition-all duration-300 transform hover:scale-105"
                >
                  Änderungen speichern
                </button>
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
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
      {deletingTask && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#3d4952] rounded-2xl p-8 w-full max-w-md">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Trash2 size={32} className="text-red-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Aufgabe löschen</h3>
              <p className="text-gray-400 mb-6">
                Sind Sie sicher, dass Sie diese Aufgabe löschen möchten? Diese Aktion kann nicht rückgängig gemacht werden.
              </p>
              <div className="flex gap-4">
                <button
                  onClick={() => handleDeleteTask(deletingTask)}
                  className="flex-1 bg-red-500 text-white font-bold py-3 rounded-xl hover:bg-red-600 transition-all duration-300"
                >
                  Löschen
                </button>
                <button
                  onClick={() => setDeletingTask(null)}
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
