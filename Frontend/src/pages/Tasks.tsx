import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  BarChart3
} from 'lucide-react';
import { getTasks, createTask, updateTask, deleteTask, getTaskStatistics } from '../api/taskService';
import { useAuth } from '../context/AuthContext';

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

export default function Tasks() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deletingTask, setDeletingTask] = useState<number | null>(null);
  const [selectedProject, setSelectedProject] = useState<number | null>(null);

  // Form state für neue/bearbeitete Aufgabe
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'todo' as const,
    priority: 'medium' as const,
    project_id: '',
    assigned_to: '',
    due_date: '',
    estimated_hours: '',
    is_milestone: false
  });

  // Lade Aufgaben beim Mounten
  useEffect(() => {
    loadTasks();
  }, [selectedProject]);

  const loadTasks = async () => {
    try {
      setLoading(true);
      const data = await getTasks(selectedProject || undefined);
      setTasks(data);
      setError('');
    } catch (err: any) {
      setError('Fehler beim Laden der Aufgaben: ' + (err.response?.data?.detail || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const taskData = {
        ...formData,
        project_id: parseInt(formData.project_id) || 1, // Fallback auf Projekt 1
        assigned_to: formData.assigned_to ? parseInt(formData.assigned_to) : null,
        estimated_hours: formData.estimated_hours ? parseInt(formData.estimated_hours) : null
      };
      
      await createTask(taskData);
      setShowCreateModal(false);
      resetForm();
      loadTasks();
    } catch (err: any) {
      setError('Fehler beim Erstellen der Aufgabe: ' + (err.response?.data?.detail || err.message));
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
      setError('Fehler beim Aktualisieren der Aufgabe: ' + (err.response?.data?.detail || err.message));
    }
  };

  const handleDeleteTask = async (taskId: number) => {
    try {
      await deleteTask(taskId);
      setDeletingTask(null);
      loadTasks();
    } catch (err: any) {
      setError('Fehler beim Löschen der Aufgabe: ' + (err.response?.data?.detail || err.message));
    }
  };

  const resetForm = () => {
    setFormData({
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
      case 'todo': return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
      case 'in_progress': return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'review': return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      case 'completed': return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'cancelled': return 'bg-red-500/20 text-red-300 border-red-500/30';
      default: return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'medium': return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      case 'high': return 'bg-orange-500/20 text-orange-300 border-orange-500/30';
      case 'urgent': return 'bg-red-500/20 text-red-300 border-red-500/30';
      default: return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
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
          <RefreshCw className="w-12 h-12 text-[#ffbd59] animate-spin mx-auto mb-4" />
          <p className="text-white text-lg">Lade Aufgaben...</p>
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
              onClick={() => navigate(-1)}
              className="p-2 bg-[#51646f] hover:bg-[#607583] rounded-xl transition-colors duration-300"
            >
              <ArrowLeft size={20} className="text-[#ffbd59]" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-[#ffbd59]">Aufgaben</h1>
              <p className="text-gray-300">Verwalten Sie Ihre Projektaufgaben</p>
            </div>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#ffbd59] to-[#ffa726] text-[#3d4952] rounded-xl hover:from-[#ffa726] hover:to-[#ff9800] transition-all duration-300 transform hover:scale-105 shadow-lg font-semibold"
          >
            <PlusCircle size={20} />
            Neue Aufgabe
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

      {/* Search and Filter */}
      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row gap-4 mb-8">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Aufgaben durchsuchen..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent"
              />
            </div>
            
            {/* Status Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="pl-10 pr-8 py-3 bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent appearance-none cursor-pointer"
              >
                <option value="all">Alle Status</option>
                <option value="todo">To Do</option>
                <option value="in_progress">In Bearbeitung</option>
                <option value="review">In Prüfung</option>
                <option value="completed">Abgeschlossen</option>
                <option value="cancelled">Abgebrochen</option>
              </select>
            </div>

            {/* Priority Filter */}
            <div className="relative">
              <Flag className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                className="pl-10 pr-8 py-3 bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent appearance-none cursor-pointer"
              >
                <option value="all">Alle Prioritäten</option>
                <option value="low">Niedrig</option>
                <option value="medium">Mittel</option>
                <option value="high">Hoch</option>
                <option value="urgent">Dringend</option>
              </select>
            </div>
          </div>

          {/* Kanban Board */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {Object.entries(groupedTasks).map(([status, statusTasks]) => (
              <div key={status} className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-gradient-to-br from-[#ffbd59] to-[#ffa726] rounded-xl">
                    {getStatusIcon(status)}
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-lg">{getStatusLabel(status)}</h3>
                    <p className="text-sm text-gray-400">{statusTasks.length} Aufgaben</p>
                  </div>
                </div>

                <div className="space-y-4">
                  {statusTasks.map((task) => (
                    <div key={task.id} className="group bg-white/5 backdrop-blur-lg rounded-xl p-4 border border-white/10 hover:bg-white/10 transition-all duration-300">
                      {/* Task Header */}
                      <div className="flex items-start justify-between mb-3">
                        <h4 className="font-semibold text-white text-sm group-hover:text-[#ffbd59] transition-colors line-clamp-2">
                          {task.title}
                        </h4>
                        
                        {/* Actions Menu */}
                        <div className="relative">
                          <button className="p-1 hover:bg-white/10 rounded transition-colors">
                            <MoreHorizontal size={14} className="text-gray-400" />
                          </button>
                          <div className="absolute right-0 top-full mt-1 w-40 bg-[#3d4952] rounded-xl shadow-2xl border border-white/20 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-10">
                            <button
                              onClick={() => openEditModal(task)}
                              className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-white/10 transition-colors rounded-t-xl text-sm"
                            >
                              <Edit size={14} />
                              <span>Bearbeiten</span>
                            </button>
                            <button
                              onClick={() => setDeletingTask(task.id)}
                              className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-red-500/20 text-red-300 transition-colors rounded-b-xl text-sm"
                            >
                              <Trash2 size={14} />
                              <span>Löschen</span>
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Task Description */}
                      {task.description && (
                        <p className="text-gray-300 text-xs mb-3 line-clamp-2">
                          {task.description}
                        </p>
                      )}

                      {/* Task Details */}
                      <div className="space-y-2 mb-3">
                        {/* Priority Badge */}
                        <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium backdrop-blur-md border ${getPriorityColor(task.priority)}`}>
                          <Flag size={10} />
                          {getPriorityLabel(task.priority)}
                        </div>

                        {/* Due Date */}
                        {task.due_date && (
                          <div className="flex items-center gap-1 text-xs text-gray-400">
                            <Calendar size={10} />
                            <span>{new Date(task.due_date).toLocaleDateString('de-DE')}</span>
                          </div>
                        )}

                        {/* Estimated Hours */}
                        {task.estimated_hours && (
                          <div className="flex items-center gap-1 text-xs text-gray-400">
                            <Clock size={10} />
                            <span>{task.estimated_hours}h geschätzt</span>
                          </div>
                        )}

                        {/* Milestone Indicator */}
                        {task.is_milestone && (
                          <div className="flex items-center gap-1 text-xs text-[#ffbd59]">
                            <Target size={10} />
                            <span>Meilenstein</span>
                          </div>
                        )}
                      </div>

                      {/* Progress Bar */}
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs text-gray-400">
                          <span>Fortschritt</span>
                          <span className="text-[#ffbd59] font-bold">{task.progress_percentage}%</span>
                        </div>
                        <div className="relative w-full bg-gray-700/50 rounded-full h-2 backdrop-blur-sm border border-gray-600/30">
                          <div 
                            className="absolute inset-0 bg-gradient-to-r from-[#ffbd59] to-[#ffa726] h-2 rounded-full transition-all duration-1000 ease-out shadow-lg"
                            style={{ width: `${task.progress_percentage}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Empty State for Column */}
                {statusTasks.length === 0 && (
                  <div className="text-center py-8">
                    <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-3">
                      {getStatusIcon(status)}
                    </div>
                    <p className="text-gray-400 text-sm">Keine Aufgaben</p>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Empty State */}
          {filteredTasks.length === 0 && !loading && (
            <div className="text-center py-16">
              <div className="w-24 h-24 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <ListTodo size={40} className="text-[#ffbd59]" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Keine Aufgaben gefunden</h3>
              <p className="text-gray-400 mb-6">
                {searchTerm || filterStatus !== 'all' || filterPriority !== 'all'
                  ? 'Versuchen Sie andere Suchkriterien oder Filter.'
                  : 'Erstellen Sie Ihre erste Aufgabe, um loszulegen.'
                }
              </p>
              {!searchTerm && filterStatus === 'all' && filterPriority === 'all' && (
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#ffbd59] to-[#ffa726] text-[#3d4952] rounded-xl hover:from-[#ffa726] hover:to-[#ff9800] transition-all duration-300 transform hover:scale-105 shadow-lg font-semibold mx-auto"
                >
                  <PlusCircle size={20} />
                  Erste Aufgabe erstellen
                </button>
              )}
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
                    <option value="todo">To Do</option>
                    <option value="in_progress">In Bearbeitung</option>
                    <option value="review">In Prüfung</option>
                    <option value="completed">Abgeschlossen</option>
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
                    <option value="low">Niedrig</option>
                    <option value="medium">Mittel</option>
                    <option value="high">Hoch</option>
                    <option value="urgent">Dringend</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Projekt-ID</label>
                  <input
                    type="number"
                    value={formData.project_id}
                    onChange={(e) => setFormData({...formData, project_id: e.target.value})}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent"
                    placeholder="1"
                  />
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
                    <option value="todo">To Do</option>
                    <option value="in_progress">In Bearbeitung</option>
                    <option value="review">In Prüfung</option>
                    <option value="completed">Abgeschlossen</option>
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
                    <option value="low">Niedrig</option>
                    <option value="medium">Mittel</option>
                    <option value="high">Hoch</option>
                    <option value="urgent">Dringend</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Projekt-ID</label>
                  <input
                    type="number"
                    value={formData.project_id}
                    onChange={(e) => setFormData({...formData, project_id: e.target.value})}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent"
                  />
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