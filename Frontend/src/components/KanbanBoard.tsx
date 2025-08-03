import React, { useState, useEffect } from 'react';
import {
  Plus,
  Trash2,
  Calendar,
  Clock,
  MoreHorizontal,
  X,
  Archive,
  Building
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface Task {
  id: number;
  title: string;
  description?: string;
  status: 'todo' | 'in_progress' | 'review' | 'completed' | 'archived';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  due_date?: string;
  estimated_hours?: number;
  actual_hours?: number;
  progress_percentage: number;
  assigned_to?: number;
  created_by: number;
  project_id: number;
  milestone_id?: number;
  created_at: string;
  updated_at: string;
  completed_at?: string;
  archived_at?: string;
  assigned_user?: {
    id: number;
    first_name: string;
    last_name: string;
  };
  creator?: {
    id: number;
    first_name: string;
    last_name: string;
  };
  milestone?: {
    id: number;
    title: string;
  };
}

interface KanbanBoardProps {
  projectId?: number;
  showOnlyAssignedToMe?: boolean;
  className?: string;
  showArchived?: boolean;
}

interface Milestone {
  id: number;
  title: string;
}

const KanbanBoard: React.FC<KanbanBoardProps> = ({ 
  projectId, 
  showOnlyAssignedToMe = false,
  className = "",
  showArchived = false
}) => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent',
    due_date: '',
    estimated_hours: '',
    assigned_to: user?.id || 0,
    milestone_id: undefined as number | undefined
  });

  const columns = showArchived ? [
    { 
      id: 'archived', 
      title: 'Archiviert', 
      color: 'bg-gradient-to-br from-gray-50 to-gray-100', 
      headerColor: 'bg-gradient-to-r from-gray-600 to-gray-700', 
      textColor: 'text-gray-700',
      icon: '📦'
    }
  ] : [
    { 
      id: 'todo', 
      title: 'Zu erledigen', 
      color: 'bg-gradient-to-br from-slate-50 to-slate-100', 
      headerColor: 'bg-gradient-to-r from-[#2c3539] to-[#1a1a2e]', 
      textColor: 'text-slate-700',
      icon: '📋'
    },
    { 
      id: 'in_progress', 
      title: 'In Bearbeitung', 
      color: 'bg-gradient-to-br from-orange-50 to-amber-50', 
      headerColor: 'bg-gradient-to-r from-[#ffbd59] to-[#ff9500]', 
      textColor: 'text-orange-700',
      icon: '⚡'
    },
    { 
      id: 'review', 
      title: 'Überprüfung', 
      color: 'bg-gradient-to-br from-blue-50 to-indigo-50', 
      headerColor: 'bg-gradient-to-r from-blue-500 to-indigo-600', 
      textColor: 'text-blue-700',
      icon: '🔍'
    },
    { 
      id: 'completed', 
      title: 'Erledigt', 
      color: 'bg-gradient-to-br from-green-50 to-emerald-50', 
      headerColor: 'bg-gradient-to-r from-green-500 to-emerald-600', 
      textColor: 'text-green-700',
      icon: '✅'
    }
  ];

  const priorityColors = {
    low: 'bg-gradient-to-r from-gray-400 to-gray-500',
    medium: 'bg-gradient-to-r from-blue-400 to-blue-500', 
    high: 'bg-gradient-to-r from-[#ffbd59] to-[#ff9500]',
    urgent: 'bg-gradient-to-r from-red-500 to-red-600'
  };

  const priorityLabels = {
    low: 'Niedrig',
    medium: 'Normal',
    high: 'Hoch', 
    urgent: 'Dringend'
  };

  const priorityIcons = {
    low: '🟢',
    medium: '🔵',
    high: '🟠',
    urgent: '🔴'
  };

  useEffect(() => {
    loadTasks();
    loadMilestones();
  }, [projectId, showOnlyAssignedToMe, showArchived]);

  const loadTasks = async () => {
    try {
      setLoading(true);
      const { api } = await import('../api/api');
      
      let url = showArchived ? '/tasks/archived' : '/tasks';
      
      const params = new URLSearchParams();
      if (projectId) params.append('project_id', projectId.toString());
      if (showOnlyAssignedToMe && user?.id && !showArchived) {
        params.append('assigned_to', user.id.toString());
      }
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      console.log('🔍 Lade Tasks von:', url);
      const response = await api.get(url);
      console.log('📊 API Response:', response);
      const data = response.data || response; // Handle both direct data and axios response
      console.log('📊 Extrahierte Tasks:', data);
      setTasks(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Fehler beim Laden der Tasks:', err);
      setError(err instanceof Error ? err.message : 'Unbekannter Fehler');
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  const loadMilestones = async () => {
    if (!projectId) return;
    
    try {
      const { api } = await import('../api/api');
      const response = await api.get(`/milestones?project_id=${projectId}`);
      const data = response.data || response;
      setMilestones(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Fehler beim Laden der Milestones:', err);
      setMilestones([]);
    }
  };

  const createTask = async () => {
    try {
      const { api } = await import('../api/api');
      
      const taskData = {
        title: newTask.title,
        description: newTask.description || null,
        priority: newTask.priority,
        project_id: projectId || 1,
        assigned_to: newTask.assigned_to,
        estimated_hours: newTask.estimated_hours ? parseFloat(newTask.estimated_hours) : null,
        due_date: newTask.due_date || null,
        milestone_id: newTask.milestone_id || null
      };
      
      console.log('🚀 Erstelle Task mit Daten:', taskData);
      console.log('🔍 newTask State:', newTask);
      const response = await api.post('/tasks', taskData);
      console.log('✅ Task erstellt:', response.data || response);

      await loadTasks();
      setShowCreateModal(false);
      setNewTask({
        title: '',
        description: '',
        priority: 'medium',
        due_date: '',
        estimated_hours: '',
        assigned_to: user?.id || 0,
        milestone_id: undefined
      });
    } catch (err) {
      console.error('Fehler beim Erstellen der Aufgabe:', err);
      setError(err instanceof Error ? err.message : 'Fehler beim Erstellen');
    }
  };

  const updateTask = async (taskId: number, updates: Partial<Task>) => {
    try {
      const { api } = await import('../api/api');
      const response = await api.put(`/tasks/${taskId}`, updates);
      console.log('✅ Task aktualisiert:', response.data || response);
      await loadTasks();
    } catch (err) {
      console.error('Fehler beim Aktualisieren der Aufgabe:', err);
      setError(err instanceof Error ? err.message : 'Fehler beim Aktualisieren');
    }
  };

  const deleteTask = async (taskId: number) => {
    if (!confirm('Aufgabe wirklich löschen?')) return;

    try {
      const { api } = await import('../api/api');
      const response = await api.delete(`/tasks/${taskId}`);
      console.log('✅ Task gelöscht:', response.status);
      await loadTasks();
    } catch (err) {
      console.error('Fehler beim Löschen der Aufgabe:', err);
      setError(err instanceof Error ? err.message : 'Fehler beim Löschen');
    }
  };

  const moveTask = async (taskId: number, newStatus: Task['status']) => {
    try {
      const { api } = await import('../api/api');
      const response = await api.post(`/tasks/${taskId}/status`, { status: newStatus });
      console.log('✅ Task Status geändert:', response.data || response);
      await loadTasks();
    } catch (err) {
      console.error('Fehler beim Aktualisieren des Status:', err);
      setError(err instanceof Error ? err.message : 'Fehler beim Verschieben');
    }
  };

  // Drag & Drop Handlers
  const handleDragStart = (e: React.DragEvent, task: Task) => {
    setDraggedTask(task);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', e.currentTarget.outerHTML);
    (e.currentTarget as HTMLElement).style.opacity = '0.5';
  };

  const handleDragEnd = (e: React.DragEvent) => {
    (e.currentTarget as HTMLElement).style.opacity = '1';
    setDraggedTask(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e: React.DragEvent, targetStatus: string) => {
    e.preventDefault();
    
    if (!draggedTask) return;

    const newStatus = targetStatus as Task['status'];
    if (draggedTask.status !== newStatus) {
      await moveTask(draggedTask.id, newStatus);
    }
    
    setDraggedTask(null);
  };

  const getTasksByStatus = (status: string) => {
    const filteredTasks = tasks.filter(task => task.status === status);
    console.log(`📋 Tasks für Status '${status}':`, filteredTasks);
    return filteredTasks;
  };

  const getTotalEstimatedHours = (status: string) => {
    const statusTasks = getTasksByStatus(status);
    const totalHours = statusTasks.reduce((sum, task) => {
      const hours = task.estimated_hours || 0;
      return sum + hours;
    }, 0);
    
    // Formatiere als Dezimalzahl mit einer Nachkommastelle
    return totalHours.toFixed(1);
  };

  const formatHoursDisplay = (status: string) => {
    const totalHours = getTotalEstimatedHours(status);
    const taskCount = getTasksByStatus(status).length;
    
    if (taskCount === 0) return '';
    
    const hoursFloat = parseFloat(totalHours);
    if (hoursFloat === 0) return '';
    
    // Zeige ganze Zahlen ohne Dezimalstelle, andere mit einer Dezimalstelle
    const formattedHours = hoursFloat % 1 === 0 ? hoursFloat.toFixed(0) : hoursFloat.toFixed(1);
    return `${formattedHours}h`;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('de-DE');
  };

  const isOverdue = (due_date?: string) => {
    if (!due_date) return false;
    return new Date(due_date) < new Date();
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-red-50 border border-red-200 rounded-lg p-4 ${className}`}>
        <p className="text-red-600">Fehler: {error}</p>
        <button
          onClick={loadTasks}
          className="mt-2 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
        >
          Erneut versuchen
        </button>
      </div>
    );
  }

  return (
    <div className={`h-full ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-[#ffbd59] to-[#ff9500] rounded-xl flex items-center justify-center text-white text-lg font-bold shadow-lg">
            📋
          </div>
          <div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-[#2c3539] to-[#1a1a2e] bg-clip-text text-transparent">
              {showOnlyAssignedToMe ? 'Meine Aufgaben' : 'Alle Aufgaben'}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {tasks.length} Aufgaben insgesamt
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-[#ffbd59] to-[#ff9500] text-white rounded-xl hover:from-[#ff9500] hover:to-[#ffbd59] transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 font-semibold"
        >
          <Plus size={20} />
          Neue Aufgabe
        </button>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 h-[calc(100vh-250px)]">
        {columns.map(column => (
          <div key={column.id} className="flex flex-col">
            {/* Column Header */}
            <div className={`${column.headerColor} text-white p-4 rounded-t-xl shadow-lg`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-xl">{column.icon}</span>
                  <div className="flex flex-col">
                    <span className="font-bold text-lg">{column.title}</span>
                    {(column.id === 'in_progress' || column.id === 'review') && formatHoursDisplay(column.id) && (
                      <span className="text-xs text-white/80 font-medium">
                        ⏱️ {formatHoursDisplay(column.id)} geschätzt
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-semibold">
                    {getTasksByStatus(column.id).length}
                  </span>
                  {(column.id === 'in_progress' || column.id === 'review') && formatHoursDisplay(column.id) && (
                    <div className="bg-white/10 backdrop-blur-sm px-2 py-1 rounded-lg text-xs font-medium border border-white/20">
                      <div className="flex items-center gap-1">
                        <Clock size={12} />
                        <span>{formatHoursDisplay(column.id)}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Column Content */}
            <div 
              className={`${column.color} flex-1 p-4 rounded-b-xl min-h-[400px] space-y-4 transition-all duration-300 shadow-lg ${
                draggedTask && draggedTask.status !== column.id ? 'border-2 border-dashed border-[#ffbd59] bg-gradient-to-br from-orange-50 to-amber-50' : ''
              }`}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, column.id)}
            >
              {getTasksByStatus(column.id).map((task) => (
                <div
                  key={task.id}
                  draggable={!showArchived}
                  onDragStart={(e) => handleDragStart(e, task)}
                  onDragEnd={handleDragEnd}
                  className="bg-white rounded-xl p-4 shadow-md border border-gray-100 hover:shadow-xl transition-all duration-300 cursor-move hover:scale-105 hover:border-[#ffbd59] group"
                >
                  {/* Task Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs text-gray-500 font-medium">#{task.id}</span>
                        <div className={`px-2 py-1 rounded-full text-xs font-semibold text-white ${priorityColors[task.priority]} shadow-sm`}>
                          <span className="mr-1">{priorityIcons[task.priority]}</span>
                          {priorityLabels[task.priority]}
                        </div>
                      </div>
                      <h4 className="font-bold text-gray-800 text-base line-clamp-2 group-hover:text-[#2c3539] transition-colors">
                        {task.title}
                      </h4>
                    </div>
                    <div className="flex items-center gap-2 ml-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingTask(task);
                        }}
                        className="text-gray-400 hover:text-[#ffbd59] p-2 rounded-lg hover:bg-gray-50 transition-all opacity-0 group-hover:opacity-100"
                      >
                        <MoreHorizontal size={16} />
                      </button>
                    </div>
                  </div>

                  {/* Task Description */}
                  {task.description && (
                    <div className="mb-3">
                      <p className="text-gray-600 text-sm line-clamp-2 leading-relaxed">
                        {task.description}
                      </p>
                    </div>
                  )}

                  {/* Gewerk-Zuordnung */}
                  {task.milestone && (
                    <div className="mb-3">
                      <div className="flex items-center gap-2 text-xs text-purple-700 bg-gradient-to-r from-purple-50 to-purple-100 px-3 py-2 rounded-lg border border-purple-200">
                        <Building size={14} className="text-purple-600" />
                        <span className="font-medium">{task.milestone.title}</span>
                      </div>
                    </div>
                  )}

                  {/* Task Meta */}
                  <div className="space-y-2 mb-3">
                    <div className="flex items-center justify-between">
                      {task.due_date && (
                        <div className={`flex items-center gap-2 px-2 py-1 rounded-lg text-xs font-medium ${
                          isOverdue(task.due_date) 
                            ? 'text-red-700 bg-red-50 border border-red-200' 
                            : 'text-blue-700 bg-blue-50 border border-blue-200'
                        }`}>
                          <Calendar size={12} />
                          <span>{formatDate(task.due_date)}</span>
                          {isOverdue(task.due_date) && <span className="text-red-500">⚠️</span>}
                        </div>
                      )}
                      
                      {task.estimated_hours && (
                        <div className="flex items-center gap-2 px-2 py-1 rounded-lg text-xs font-medium text-green-700 bg-green-50 border border-green-200">
                          <Clock size={12} />
                          <span>{task.estimated_hours % 1 === 0 ? task.estimated_hours.toFixed(0) : task.estimated_hours.toFixed(1)}h</span>
                        </div>
                      )}
                    </div>
                    
                    {task.assigned_user && (
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-gradient-to-br from-[#2c3539] to-[#1a1a2e] rounded-full flex items-center justify-center text-white text-xs font-bold">
                          {task.assigned_user.first_name[0]}{task.assigned_user.last_name[0]}
                        </div>
                        <span className="text-xs text-gray-600 font-medium">
                          {task.assigned_user.first_name} {task.assigned_user.last_name}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Archivierungs-Info */}
                  {task.archived_at && (
                    <div className="mb-3">
                      <div className="flex items-center gap-2 text-xs text-gray-600 bg-gradient-to-r from-gray-50 to-gray-100 px-3 py-2 rounded-lg border border-gray-200">
                        <Archive size={12} />
                        <span className="font-medium">Archiviert: {formatDate(task.archived_at)}</span>
                      </div>
                    </div>
                  )}

                  {/* Progress Bar */}
                  {(task.progress_percentage > 0 || task.status !== 'todo') && (
                    <div className="mb-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-gray-600">Fortschritt</span>
                        <span className="text-xs font-bold text-[#ffbd59]">{task.progress_percentage}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 shadow-inner">
                        <div 
                          className="bg-gradient-to-r from-[#ffbd59] to-[#ff9500] h-2 rounded-full transition-all duration-500 shadow-sm"
                          style={{ width: `${task.progress_percentage}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Status Change Buttons */}
                  <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                    {task.status !== 'todo' && (
                      <button
                        onClick={() => moveTask(task.id, 'todo')}
                        className="flex items-center gap-1 text-xs px-3 py-2 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 rounded-lg hover:from-gray-200 hover:to-gray-300 transition-all duration-200 font-medium shadow-sm"
                        title="Zurück zu Todo"
                      >
                        ↩️ Reset
                      </button>
                    )}
                    {task.status === 'todo' && (
                      <button
                        onClick={() => moveTask(task.id, 'in_progress')}
                        className="flex items-center gap-1 text-xs px-3 py-2 bg-gradient-to-r from-[#ffbd59] to-[#ff9500] text-white rounded-lg hover:from-[#ff9500] hover:to-[#ffbd59] transition-all duration-200 font-medium shadow-sm"
                        title="In Bearbeitung"
                      >
                        ⚡ Start
                      </button>
                    )}
                    {task.status === 'in_progress' && (
                      <button
                        onClick={() => moveTask(task.id, 'review')}
                        className="flex items-center gap-1 text-xs px-3 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 font-medium shadow-sm"
                        title="Zur Überprüfung"
                      >
                        🔍 Review
                      </button>
                    )}
                    {(task.status === 'review' || task.status === 'in_progress') && (
                      <button
                        onClick={() => moveTask(task.id, 'completed')}
                        className="flex items-center gap-1 text-xs px-3 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all duration-200 font-medium shadow-sm"
                        title="Abschließen"
                      >
                        ✅ Done
                      </button>
                    )}
                  </div>
                </div>
              ))}
              
              {getTasksByStatus(column.id).length === 0 && (
                <div className="flex items-center justify-center h-40 text-gray-400">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-3 shadow-inner">
                      <span className="text-2xl opacity-50">{column.icon}</span>
                    </div>
                    <p className="text-sm font-medium text-gray-500">Keine Aufgaben</p>
                    <p className="text-xs text-gray-400 mt-1">Ziehen Sie Tasks hierher</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Create Task Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 w-full max-w-lg shadow-2xl border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-[#ffbd59] to-[#ff9500] rounded-xl flex items-center justify-center text-white text-lg shadow-lg">
                  ➕
                </div>
                <h3 className="text-xl font-bold bg-gradient-to-r from-[#2c3539] to-[#1a1a2e] bg-clip-text text-transparent">
                  Neue Aufgabe erstellen
                </h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-red-500 p-2 rounded-lg hover:bg-gray-50 transition-all"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Titel <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newTask.title}
                  onChange={(e) => setNewTask(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full p-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#ffbd59] focus:border-[#ffbd59] transition-all duration-200 text-gray-800 placeholder-gray-400"
                  placeholder="z.B. Website-Design überarbeiten..."
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Beschreibung
                </label>
                <textarea
                  value={newTask.description}
                  onChange={(e) => setNewTask(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full p-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#ffbd59] focus:border-[#ffbd59] transition-all duration-200 text-gray-800 placeholder-gray-400 resize-none"
                  rows={3}
                  placeholder="Detaillierte Beschreibung der Aufgabe..."
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Priorität
                  </label>
                  <select
                    value={newTask.priority}
                    onChange={(e) => setNewTask(prev => ({ ...prev, priority: e.target.value as any }))}
                    className="w-full p-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#ffbd59] focus:border-[#ffbd59] transition-all duration-200 text-gray-800 bg-white"
                  >
                    <option value="low">🟢 Niedrig</option>
                    <option value="medium">🔵 Normal</option>
                    <option value="high">🟠 Hoch</option>
                    <option value="urgent">🔴 Dringend</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Fällig am
                  </label>
                  <input
                    type="date"
                    value={newTask.due_date}
                    onChange={(e) => setNewTask(prev => ({ ...prev, due_date: e.target.value }))}
                    className="w-full p-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#ffbd59] focus:border-[#ffbd59] transition-all duration-200 text-gray-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Geschätzte Stunden
                </label>
                                  <input
                    type="number"
                    value={newTask.estimated_hours}
                    onChange={(e) => setNewTask(prev => ({ ...prev, estimated_hours: e.target.value }))}
                    className="w-full p-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#ffbd59] focus:border-[#ffbd59] transition-all duration-200 text-gray-800 placeholder-gray-400"
                    placeholder="z.B. 4.5"
                    min="0"
                    step="0.25"
                  />
              </div>

              {milestones.length > 0 && (
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Gewerk zuordnen <span className="text-gray-400 text-xs">(optional)</span>
                  </label>
                  <select
                    value={newTask.milestone_id || ''}
                    onChange={(e) => setNewTask(prev => ({ 
                      ...prev, 
                      milestone_id: e.target.value ? parseInt(e.target.value) : undefined 
                    }))}
                    className="w-full p-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#ffbd59] focus:border-[#ffbd59] transition-all duration-200 text-gray-800 bg-white"
                  >
                    <option value="">🏗️ Kein Gewerk</option>
                    {milestones.map(milestone => (
                      <option key={milestone.id} value={milestone.id}>
                        🔧 {milestone.title}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-4 mt-8 pt-6 border-t border-gray-100">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-6 py-3 text-gray-600 hover:text-gray-800 font-medium transition-colors"
              >
                Abbrechen
              </button>
              <button
                onClick={createTask}
                disabled={!newTask.title.trim()}
                className="px-8 py-3 bg-gradient-to-r from-[#ffbd59] to-[#ff9500] text-white rounded-xl hover:from-[#ff9500] hover:to-[#ffbd59] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 font-semibold"
              >
                ✨ Erstellen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Task Modal */}
      {editingTask && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Aufgabe bearbeiten</h3>
              <button
                onClick={() => setEditingTask(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Titel *
                </label>
                <input
                  type="text"
                  value={editingTask.title}
                  onChange={(e) => setEditingTask(prev => prev ? { ...prev, title: e.target.value } : null)}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fortschritt
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={editingTask.progress_percentage}
                  onChange={(e) => setEditingTask(prev => prev ? { ...prev, progress_percentage: parseInt(e.target.value) } : null)}
                  className="w-full"
                />
                <span className="text-sm text-gray-500">{editingTask.progress_percentage}%</span>
              </div>
            </div>

            <div className="flex items-center justify-between mt-6">
              <button
                onClick={() => deleteTask(editingTask.id)}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
              >
                <Trash2 size={16} />
              </button>
              <div className="flex gap-3">
                <button
                  onClick={() => setEditingTask(null)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Abbrechen
                </button>
                <button
                  onClick={async () => {
                    await updateTask(editingTask.id, {
                      title: editingTask.title,
                      progress_percentage: editingTask.progress_percentage
                    });
                    setEditingTask(null);
                  }}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                >
                  Speichern
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default KanbanBoard;