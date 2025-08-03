import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  CheckSquare, 
  Plus, 
  Clock, 
  AlertTriangle, 
  TrendingUp,
  User,
  Calendar,
  ArrowRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface Task {
  id: number;
  title: string;
  description?: string;
  status: 'todo' | 'in_progress' | 'review' | 'completed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  due_date?: string;
  progress_percentage: number;
  assigned_to?: number;
  created_by: number;
  project_id: number;
  created_at: string;
  assigned_user?: {
    id: number;
    first_name: string;
    last_name: string;
  };
}

interface TodoStats {
  total: number;
  todo: number;
  in_progress: number;
  review: number;
  completed: number;
  overdue: number;
}

interface TodoDashboardCardProps {
  className?: string;
  showOnlyAssignedToMe?: boolean;
  projectId?: number;
}

const TodoDashboardCard: React.FC<TodoDashboardCardProps> = ({ 
  className = "",
  showOnlyAssignedToMe = false,
  projectId
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [stats, setStats] = useState<TodoStats>({
    total: 0,
    todo: 0,
    in_progress: 0,
    review: 0,
    completed: 0,
    overdue: 0
  });
  const [loading, setLoading] = useState(true);
  const [recentTasks, setRecentTasks] = useState<Task[]>([]);

  useEffect(() => {
    loadTasks();
  }, [showOnlyAssignedToMe, projectId]);

  const loadTasks = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      let url = '/api/v1/tasks';
      
      const params = new URLSearchParams();
      if (projectId) params.append('project_id', projectId.toString());
      if (showOnlyAssignedToMe && user?.id) params.append('assigned_to', user.id.toString());
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Fehler beim Laden der Tasks');
      }

      const data = await response.json();
      const taskList = Array.isArray(data) ? data : [];
      setTasks(taskList);

      // Statistiken berechnen
      const now = new Date();
      const newStats: TodoStats = {
        total: taskList.length,
        todo: taskList.filter(t => t.status === 'todo').length,
        in_progress: taskList.filter(t => t.status === 'in_progress').length,
        review: taskList.filter(t => t.status === 'review').length,
        completed: taskList.filter(t => t.status === 'completed').length,
        overdue: taskList.filter(t => t.due_date && new Date(t.due_date) < now && t.status !== 'completed').length
      };
      setStats(newStats);

      // Neueste Tasks (nicht abgeschlossen, sortiert nach Erstellungsdatum)
      const recent = taskList
        .filter(t => t.status !== 'completed')
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 3);
      setRecentTasks(recent);

    } catch (err) {
      console.error('Fehler beim Laden der Tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit'
    });
  };

  const isOverdue = (due_date?: string) => {
    if (!due_date) return false;
    return new Date(due_date) < new Date();
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-500';
      case 'high': return 'text-orange-500';
      case 'medium': return 'text-blue-500';
      case 'low': return 'text-gray-500';
      default: return 'text-gray-500';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'todo': return 'bg-gray-100 text-gray-700';
      case 'in_progress': return 'bg-blue-100 text-blue-700';
      case 'review': return 'bg-yellow-100 text-yellow-700';
      case 'completed': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'todo': return 'Offen';
      case 'in_progress': return 'Bearbeitung';
      case 'review': return 'Prüfung';
      case 'completed': return 'Erledigt';
      default: return status;
    }
  };

  const openKanbanBoard = () => {
    navigate('/tasks');
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-xl shadow-sm border border-gray-200 p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded mb-4 w-32"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <CheckSquare className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">
                {showOnlyAssignedToMe ? 'Meine Todos' : 'Todos'}
              </h3>
              <p className="text-sm text-gray-500">
                {stats.total} Aufgaben insgesamt
              </p>
            </div>
          </div>
          <button
            onClick={openKanbanBoard}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            title="Kanban-Board öffnen"
          >
            <ArrowRight size={16} />
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="p-6 border-b border-gray-100">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-600">{stats.todo}</div>
            <div className="text-xs text-gray-500">Offen</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.in_progress}</div>
            <div className="text-xs text-gray-500">In Arbeit</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">{stats.review}</div>
            <div className="text-xs text-gray-500">Prüfung</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
            <div className="text-xs text-gray-500">Erledigt</div>
          </div>
        </div>

        {stats.overdue > 0 && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2">
              <AlertTriangle size={16} className="text-red-500" />
              <span className="text-sm text-red-700">
                {stats.overdue} überfällige Aufgabe{stats.overdue !== 1 ? 'n' : ''}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Recent Tasks */}
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-medium text-gray-900">Aktuelle Aufgaben</h4>
          <button
            onClick={openKanbanBoard}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            Alle anzeigen
          </button>
        </div>

        {recentTasks.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <CheckSquare size={32} className="mx-auto mb-3 opacity-50" />
            <p className="text-sm">Keine offenen Aufgaben</p>
            <button
              onClick={openKanbanBoard}
              className="mt-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Neue Aufgabe erstellen
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {recentTasks.map(task => (
              <div 
                key={task.id}
                className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                onClick={openKanbanBoard}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h5 className="font-medium text-gray-900 text-sm truncate">
                      {task.title}
                    </h5>
                    <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(task.status)}`}>
                      {getStatusLabel(task.status)}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    {task.due_date && (
                      <div className={`flex items-center gap-1 ${
                        isOverdue(task.due_date) ? 'text-red-500' : ''
                      }`}>
                        <Calendar size={10} />
                        {formatDate(task.due_date)}
                      </div>
                    )}
                    
                    {task.assigned_user && (
                      <div className="flex items-center gap-1">
                        <User size={10} />
                        <span>{task.assigned_user.first_name} {task.assigned_user.last_name}</span>
                      </div>
                    )}
                    
                    <div className={`w-2 h-2 rounded-full ${
                      task.priority === 'urgent' ? 'bg-red-400' :
                      task.priority === 'high' ? 'bg-orange-400' :
                      task.priority === 'medium' ? 'bg-blue-400' : 'bg-gray-400'
                    }`} />
                  </div>

                  {task.progress_percentage > 0 && task.status !== 'completed' && (
                    <div className="mt-2">
                      <div className="w-full bg-gray-200 rounded-full h-1">
                        <div 
                          className="bg-blue-500 h-1 rounded-full transition-all duration-300"
                          style={{ width: `${task.progress_percentage}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-6 py-4 bg-gray-50 rounded-b-xl">
        <button
          onClick={openKanbanBoard}
          className="w-full flex items-center justify-center gap-2 py-2 text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
        >
          <Plus size={16} />
          Kanban-Board öffnen
        </button>
      </div>
    </div>
  );
};

export default TodoDashboardCard;