import React, { useState, useEffect, memo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Plus, X, Trash2, Calendar, Clock, User, ChevronDown, ChevronUp, Maximize2, Minimize2, CheckSquare, Upload, Image, FileX } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import TaskDetailModal from './TaskDetailModal';

// CSS für optimierte Animationen
const animationStyles = `
  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

// Inject CSS with cleanup
function useKanbanStyles() {
  useEffect(() => {
    const styleSheet = document.createElement('style');
    styleSheet.id = 'kanban-board-styles';
    styleSheet.setAttribute('data-component', 'KanbanBoard');
    styleSheet.textContent = animationStyles;
    
    try {
      document.head.appendChild(styleSheet);
    } catch (error) {
      console.error('Failed to append Kanban styles:', error);
    }
    
    return () => {
      try {
        if (styleSheet.parentNode === document.head) {
          document.head.removeChild(styleSheet);
        }
      } catch (error) {
        console.warn('Failed to remove Kanban styles:', error);
      }
    };
  }, []);
}

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
  updated_at?: string;
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
  showArchived?: boolean;
  className?: string;
  mobileViewMode?: 'vertical' | 'horizontal' | 'auto';
  defaultExpanded?: boolean;
}

interface Milestone {
  id: number;
  title: string;
}

const COLUMNS = [
  { id: 'todo', title: 'Zu erledigen', color: 'bg-gray-50', headerColor: 'bg-gradient-to-r from-gray-500 to-gray-600' },
  { id: 'in_progress', title: 'In Bearbeitung', color: 'bg-blue-50', headerColor: 'bg-gradient-to-r from-blue-500 to-blue-600' },
  { id: 'review', title: 'Überprüfung', color: 'bg-yellow-50', headerColor: 'bg-gradient-to-r from-yellow-500 to-yellow-600' },
  { id: 'completed', title: 'Abgeschlossen', color: 'bg-green-50', headerColor: 'bg-gradient-to-r from-green-500 to-green-600' }
] as const;

const PRIORITY_COLORS = {
  low: 'bg-gray-400',
  medium: 'bg-blue-400',
  high: 'bg-orange-400',
  urgent: 'bg-red-500'
};

// Memoized Task Card Component für Performance - Kompakte Version
const CompactTaskCard = memo(({ 
  task, 
  onClick
}: { 
  task: Task; 
  onClick: () => void;
}) => {
  // Bereinige Beschreibung für kompakte Ansicht (entferne Base64-Bilder)
  const cleanDescription = task.description 
    ? task.description.replace(/!\[.*?\]\(data:image\/[^)]+\)/g, '[Bild]').substring(0, 50)
    : '';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      onClick={onClick}
      className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm rounded-lg p-2 border border-white/20 hover:border-white/40 transition-all cursor-pointer group hover:shadow-lg hover:shadow-white/10"
    >
      <div className="flex items-center gap-2">
        <span className={`${PRIORITY_COLORS[task.priority]} w-2 h-2 rounded-full flex-shrink-0`}></span>
        <div className="flex-1 min-w-0">
          <p className="text-white text-xs font-medium truncate">{task.title}</p>
          {cleanDescription && (
            <p className="text-gray-400 text-xs truncate mt-0.5">{cleanDescription}</p>
          )}
        </div>
      </div>
    </motion.div>
  );
});

CompactTaskCard.displayName = 'CompactTaskCard';

// Memoized Task Card Component für Performance - Vollansicht (Optimiert)
const TaskCard = memo(({ 
  task, 
  onClick,
  onDelete,
  onDragStart,
  onDragEnd
}: { 
  task: Task; 
  onClick: () => void;
  onDelete: (id: number) => void;
  onDragStart: (e: React.DragEvent, task: Task) => void;
  onDragEnd: (e: React.DragEvent) => void;
}) => {
  return (
    <div
      draggable={true}
      onDragStart={(e) => onDragStart(e, task)}
      onDragEnd={onDragEnd}
      onClick={onClick}
      className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-lg rounded-lg sm:rounded-xl p-2 sm:p-4 border border-white/20 hover:border-white/40 shadow-lg hover:shadow-xl hover:shadow-white/20 transition-all cursor-pointer group"
    >
      <div className="flex items-start justify-between mb-2 sm:mb-3">
        <h4 className="font-semibold text-xs sm:text-sm text-white flex-1 line-clamp-2 pr-2">
          {task.title}
        </h4>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(task.id);
          }}
          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 sm:p-1.5 hover:bg-red-500/20 rounded-lg flex-shrink-0"
        >
          <Trash2 size={12} className="sm:w-4 sm:h-4 text-red-400" />
        </button>
      </div>
      
      {task.description && (
        <p className="text-xs text-gray-300 mb-2 sm:mb-3 line-clamp-2">
          {task.description.replace(/!\[.*?\]\(data:image\/[^)]+\)/g, '[Bild]')}
        </p>
      )}
      
      <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
        <span className={`${PRIORITY_COLORS[task.priority]} text-white text-xs px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-lg font-medium shadow-sm`}>
          {task.priority}
        </span>
        
        {task.milestone && (
          <span className="bg-indigo-500/20 text-indigo-300 text-xs px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-lg border border-indigo-400/30">
            {task.milestone.title}
          </span>
        )}
        
        {task.due_date && (
          <span className="text-xs text-gray-300 flex items-center gap-1 bg-white/5 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-lg">
            <Calendar size={10} className="sm:w-3 sm:h-3" />
            <span className="hidden sm:inline">{new Date(task.due_date).toLocaleDateString('de-DE')}</span>
            <span className="sm:hidden">{new Date(task.due_date).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })}</span>
          </span>
        )}
        
        {task.estimated_hours && (
          <span className="text-xs text-gray-300 flex items-center gap-1 bg-white/5 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-lg">
            <Clock size={10} className="sm:w-3 sm:h-3" />
            {task.estimated_hours}h
          </span>
        )}
      </div>
    </div>
  );
});

TaskCard.displayName = 'TaskCard';

const KanbanBoard: React.FC<KanbanBoardProps> = ({
  projectId,
  showOnlyAssignedToMe = false,
  showArchived = false,
  className = '',
  defaultExpanded = false
}) => {
  useKanbanStyles(); // Initialize styles with cleanup
  
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showTaskDetailModal, setShowTaskDetailModal] = useState(false);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    priority: 'medium' as Task['priority'],
    due_date: '',
    estimated_hours: ''
  });
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  // Lade Tasks wenn User verfügbar ist
  useEffect(() => {
    // Warte bis user verfügbar ist
    if (!user?.id) {
      console.log('⏳ Warte auf User-Daten...');
      return;
    }

    let mounted = true;

    const loadTasks = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const { api } = await import('../api/api');
        
        const params = new URLSearchParams();
        if (projectId) params.append('project_id', projectId.toString());
        if (showOnlyAssignedToMe && user?.id) {
          params.append('assigned_to', user.id.toString());
        }
        
        const url = `/api/v1/tasks/${params.toString() ? `?${params.toString()}` : ''}`;
        const response = await api.get(url);
        const data = response.data || response;
        
        if (mounted) {
          setTasks(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.error('❌ Fehler beim Laden der Tasks:', err);
        if (mounted) {
          // iOS-spezifische Fehlerbehandlung
          const errorMessage = err instanceof Error ? err.message : 'Fehler beim Laden der Aufgaben';
          if (errorMessage.includes('Network Error') || errorMessage.includes('timeout')) {
            setError('Netzwerkfehler - Bitte prüfen Sie Ihre Internetverbindung');
          } else if (errorMessage.includes('401') || errorMessage.includes('Authentication')) {
            setError('Sitzung abgelaufen - Bitte melden Sie sich erneut an');
          } else {
            setError('Fehler beim Laden der Aufgaben');
          }
          setTasks([]);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadTasks();
    if (projectId) {
      loadMilestones();
    }

    return () => {
      mounted = false;
    };
  }, [user?.id, projectId, showOnlyAssignedToMe]); // Dependencies angepasst

  const loadMilestones = useCallback(async () => {
    if (!projectId) return;
    
    try {
      const { api } = await import('../api/api');
      const response = await api.get(`/api/v1/milestones/?project_id=${projectId}`);
      const data = response.data || response;
      setMilestones(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Fehler beim Laden der Milestones:', err);
      setMilestones([]);
    }
  }, [projectId]);

  const getTasksByStatus = useCallback((status: Task['status']) => {
    return tasks.filter(task => task.status === status);
  }, [tasks]);

  // File Upload Handler
  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    if (imageFiles.length !== files.length) {
      setError('Nur Bilddateien sind erlaubt');
      return;
    }
    
    setUploadedFiles(prev => [...prev, ...imageFiles]);
  }, []);

  const handleFileDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    if (imageFiles.length !== files.length) {
      setError('Nur Bilddateien sind erlaubt');
      return;
    }
    
    setUploadedFiles(prev => [...prev, ...imageFiles]);
  }, []);

  const handleFileDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const removeFile = useCallback((index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  }, []);

  const createTask = useCallback(async () => {
    if (!newTask.title.trim()) {
      setError('Bitte geben Sie einen Titel ein');
      return;
    }

    try {
      setUploadingFiles(true);
      const { api } = await import('../api/api');
      
      // Konvertiere Bilder zu Base64 und füge sie zur Beschreibung hinzu
      let description = newTask.description || '';
      
      if (uploadedFiles.length > 0) {
        const imageMarkdown = await Promise.all(
          uploadedFiles.map(async (file) => {
            return new Promise<string>((resolve) => {
              const reader = new FileReader();
              reader.onload = () => {
                const base64 = reader.result as string;
                resolve(`![${file.name}](${base64})`);
              };
              reader.readAsDataURL(file);
            });
          })
        );
        
        if (description) {
          description += '\n\n' + imageMarkdown.join('\n');
        } else {
          description = imageMarkdown.join('\n');
        }
      }
      
      const taskData = {
        title: newTask.title,
        description: description || null,
        priority: newTask.priority,
        project_id: projectId,
        assigned_to: user?.id,
        estimated_hours: newTask.estimated_hours ? parseFloat(newTask.estimated_hours) : null,
        due_date: newTask.due_date || null,
        status: 'todo'
      };
      
      const response = await api.post('/api/v1/tasks/', taskData);
      const createdTask = response.data || response;
      
      setTasks(prev => [...prev, createdTask]);
      setShowCreateModal(false);
      setNewTask({
        title: '',
        description: '',
        priority: 'medium',
        due_date: '',
        estimated_hours: ''
      });
      setUploadedFiles([]);
      setError(null);
    } catch (err) {
      console.error('❌ Fehler beim Erstellen der Aufgabe:', err);
      setError('Fehler beim Erstellen der Aufgabe');
    } finally {
      setUploadingFiles(false);
    }
  }, [newTask, projectId, user?.id, uploadedFiles]);

  const updateTaskStatus = useCallback(async (taskId: number, newStatus: Task['status']) => {
    try {
      const { api } = await import('../api/api');
      await api.post(`/api/v1/tasks/${taskId}/status`, { status: newStatus });
      
      setTasks(prev => prev.map(task => 
        task.id === taskId ? { ...task, status: newStatus } : task
      ));
    } catch (err) {
      console.error('❌ Fehler beim Aktualisieren des Status:', err);
      setError('Fehler beim Aktualisieren des Status');
    }
  }, []);

  const deleteTask = useCallback(async (taskId: number) => {
    if (!window.confirm('Möchten Sie diese Aufgabe wirklich löschen?')) {
      return;
    }

    try {
      const { api } = await import('../api/api');
      await api.delete(`/api/v1/tasks/${taskId}`);
      
      setTasks(prev => prev.filter(task => task.id !== taskId));
    } catch (err) {
      console.error('❌ Fehler beim Löschen der Aufgabe:', err);
      setError('Fehler beim Löschen der Aufgabe');
    }
  }, []);

  const handleTaskUpdate = useCallback((updatedTask: Task) => {
    setTasks(prevTasks => 
      prevTasks.map(task => 
        task.id === updatedTask.id ? updatedTask : task
      )
    );
  }, []);

  const handleTaskDelete = useCallback((taskId: number) => {
    setTasks(prevTasks => prevTasks.filter(task => task.id !== taskId));
  }, []);

  // Drag & Drop Handler
  const handleDragStart = useCallback((e: React.DragEvent, task: Task) => {
    setDraggedTask(task);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', e.currentTarget.outerHTML);
    (e.currentTarget as HTMLElement).style.opacity = '0.5';
  }, []);

  const handleDragEnd = useCallback((e: React.DragEvent) => {
    (e.currentTarget as HTMLElement).style.opacity = '1';
    setDraggedTask(null);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent, targetStatus: string) => {
    e.preventDefault();
    
    if (!draggedTask) return;

    const newStatus = targetStatus as Task['status'];
    if (draggedTask.status !== newStatus) {
      try {
        const { api } = await import('../api/api');
        await api.post(`/api/v1/tasks/${draggedTask.id}/status`, { status: newStatus });
        
        setTasks(prev => prev.map(task => 
          task.id === draggedTask.id ? { ...task, status: newStatus } : task
        ));
      } catch (err) {
        console.error('❌ Fehler beim Verschieben der Aufgabe:', err);
        setError('Fehler beim Verschieben der Aufgabe');
      }
    }
    
    setDraggedTask(null);
  }, [draggedTask]);

  // Task Statistiken für kompakte Ansicht
  const taskStats = {
    todo: getTasksByStatus('todo').length,
    in_progress: getTasksByStatus('in_progress').length,
    review: getTasksByStatus('review').length,
    completed: getTasksByStatus('completed').length,
    total: tasks.length
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Zeige Loading-State wenn User-Daten noch nicht verfügbar sind
  if (!user?.id) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Lade Benutzer-Daten...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
        <p className="text-red-600 font-semibold mb-2">{error}</p>
        <div className="flex gap-2 justify-center">
          <button
            onClick={() => {
              setError(null);
              setLoading(true);
              setRetryCount(prev => prev + 1);
              
              // iOS-optimierte Retry-Logik mit Exponential Backoff
              const loadTasks = async () => {
                try {
                  // Exponential Backoff für iOS Safari
                  const delay = Math.min(1000 * Math.pow(2, retryCount), 5000);
                  if (retryCount > 0) {
                    await new Promise(resolve => setTimeout(resolve, delay));
                  }
                  
                  const { api } = await import('../api/api');
                  const params = new URLSearchParams();
                  if (projectId) params.append('project_id', projectId.toString());
                  if (showOnlyAssignedToMe && user?.id) {
                    params.append('assigned_to', user.id.toString());
                  }
                  
                  const url = `/api/v1/tasks/${params.toString() ? `?${params.toString()}` : ''}`;
                  const response = await api.get(url);
                  const data = response.data || response;
                  
                  setTasks(Array.isArray(data) ? data : []);
                  setError(null);
                  setRetryCount(0); // Reset bei Erfolg
                } catch (err) {
                  console.error('❌ Retry fehlgeschlagen:', err);
                  const errorMessage = err instanceof Error ? err.message : 'Fehler beim Laden der Aufgaben';
                  if (errorMessage.includes('Network Error') || errorMessage.includes('timeout')) {
                    setError(`Netzwerkfehler (Versuch ${retryCount + 1}) - Bitte prüfen Sie Ihre Internetverbindung`);
                  } else if (errorMessage.includes('401') || errorMessage.includes('Authentication')) {
                    setError('Sitzung abgelaufen - Bitte melden Sie sich erneut an');
                  } else {
                    setError(`Fehler beim Laden der Aufgaben (Versuch ${retryCount + 1})`);
                  }
                } finally {
                  setLoading(false);
                }
              };
              loadTasks();
            }}
            className="text-sm text-red-700 hover:text-red-800 underline px-3 py-1 bg-red-100 rounded hover:bg-red-200 transition-colors"
          >
            Erneut versuchen
          </button>
          <button
            onClick={() => {
              setError(null);
              setTasks([]);
            }}
            className="text-sm text-gray-600 hover:text-gray-800 underline px-3 py-1 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
          >
            Schließen
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className={`${className}`}>
      {/* Kompakte Ansicht - Intelligente Ein-Zeilen-Übersicht */}
      {!isExpanded && (
        <div
          className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-lg rounded-xl border border-white/20 shadow-xl hover:shadow-2xl hover:shadow-white/10 transition-all cursor-pointer overflow-hidden"
          onClick={() => setIsExpanded(true)}
        >
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg">
                    <CheckSquare size={18} className="text-white" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">
                      {showOnlyAssignedToMe ? 'Meine Aufgaben' : 'Aufgaben-Board'}
                    </h3>
                    <p className="text-xs text-gray-400">
                      {taskStats.total} {taskStats.total === 1 ? 'Aufgabe' : 'Aufgaben'} • {taskStats.completed} abgeschlossen
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowCreateModal(true);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 rounded-lg transition-colors border border-emerald-400/30 text-sm"
                >
                  <Plus size={16} />
                  <span className="hidden sm:inline">Neu</span>
                </button>
                <Maximize2 size={18} className="text-gray-400" />
              </div>
            </div>

            {/* Schnelle Statistik-Übersicht */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {COLUMNS.map(column => {
                const count = taskStats[column.id as keyof typeof taskStats];
                const columnTasks = getTasksByStatus(column.id as Task['status']).slice(0, 3);
                
                return (
                  <div
                    key={column.id}
                    className="bg-white/5 rounded-lg p-2 border border-white/10 hover:border-white/20 transition-all"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-gray-300 font-medium truncate">{column.title}</span>
                      <span className="text-xs font-bold text-white bg-white/10 px-2 py-0.5 rounded-full">
                        {count}
                      </span>
                    </div>
                    
                    {/* Mini Karten Vorschau */}
                    {columnTasks.length > 0 && (
                      <div className="space-y-1">
                        {columnTasks.map(task => (
                          <CompactTaskCard 
                            key={task.id} 
                            task={task}
                            onClick={(e) => {
                              e.stopPropagation();
                              setIsExpanded(true);
                            }}
                          />
                        ))}
                      </div>
                    )}
                    
                    {columnTasks.length === 0 && (
                      <div className="flex items-center justify-center h-8 text-gray-500 text-xs">
                        Leer
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Hover-Hinweis */}
          <div className="bg-white/5 border-t border-white/10 px-4 py-2 flex items-center justify-center gap-2 text-xs text-gray-400">
            <ChevronDown size={14} />
            <span>Klicken zum Erweitern</span>
          </div>
        </div>
      )}

      {/* Vollständige Kanban-Ansicht */}
      {isExpanded && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
          className="space-y-4"
        >
          {/* Header */}
          <div className="flex items-center justify-between bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-lg rounded-xl p-4 border border-white/20">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg">
                <CheckSquare size={20} className="text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">
                  {showOnlyAssignedToMe ? 'Meine Aufgaben' : 'Aufgaben-Board'}
                </h3>
                <p className="text-sm text-gray-400">{taskStats.total} Aufgaben insgesamt</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 text-xs text-gray-400 bg-white/5 px-3 py-1 rounded-lg">
                <span>💡</span>
                <span>Ziehen zum Verschieben</span>
              </div>
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors shadow-lg hover:shadow-emerald-500/30"
              >
                <Plus size={18} />
                <span className="hidden sm:inline">Neue Aufgabe</span>
              </button>
              
              <button
                onClick={() => setIsExpanded(false)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-white"
                title="Minimieren"
              >
                <Minimize2 size={20} />
              </button>
            </div>
          </div>

           {/* Kanban Columns - Mobile-optimiert */}
           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
             {COLUMNS.map((column, index) => {
               const columnTasks = getTasksByStatus(column.id as Task['status']);
               
               return (
                 <div
                   key={column.id}
                   className="flex flex-col min-h-[200px] sm:min-h-[400px] max-h-[300px] sm:max-h-[600px]"
                   style={{
                     animationDelay: `${index * 50}ms`,
                     animation: 'fadeInUp 0.3s ease-out forwards',
                     opacity: 0
                   }}
                 >
                   {/* Column Header - Mobile-optimiert */}
                   <div className={`${column.headerColor} text-white px-2 sm:px-4 py-2 sm:py-3 rounded-t-xl shadow-lg`}>
                     <div className="flex items-center justify-between">
                       <h4 className="font-semibold text-xs sm:text-sm lg:text-base truncate">{column.title}</h4>
                       <span className="bg-white/30 px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-lg text-xs sm:text-sm font-bold backdrop-blur-sm ml-2">
                         {columnTasks.length}
                       </span>
                     </div>
                   </div>
                  
                   {/* Column Content - Mobile-optimiert */}
                   <div 
                     className={`bg-gradient-to-br from-white/5 to-white/[0.02] p-2 sm:p-3 rounded-b-xl flex-1 space-y-2 sm:space-y-3 overflow-y-auto border border-t-0 border-white/10 transition-all duration-300 ${
                       draggedTask && draggedTask.status !== column.id ? 'border-dashed border-[#ffbd59]/50 bg-[#ffbd59]/5' : ''
                     }`}
                     onDragOver={handleDragOver}
                     onDrop={(e) => handleDrop(e, column.id as Task['status'])}
                   >
                    {columnTasks.map(task => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        onClick={() => {
                          setSelectedTask(task);
                          setShowTaskDetailModal(true);
                        }}
                        onDelete={deleteTask}
                        onDragStart={handleDragStart}
                        onDragEnd={handleDragEnd}
                      />
                    ))}
                    
                     {columnTasks.length === 0 && (
                       <div className="flex flex-col items-center justify-center h-20 sm:h-32 text-gray-500 text-xs sm:text-sm">
                         <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-full bg-white/5 flex items-center justify-center mb-1 sm:mb-2">
                           <CheckSquare size={16} className="sm:w-6 sm:h-6 text-gray-600" />
                         </div>
                         <p className="text-center">Keine Aufgaben</p>
                         {draggedTask && draggedTask.status !== column.id && (
                           <p className="text-xs text-[#ffbd59] mt-1 text-center">Hier ablegen</p>
                         )}
                       </div>
                     )}
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Create Task Modal - Modernisiert mit Portal */}
      {showCreateModal && createPortal(
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[99999] p-4"
            onClick={() => setShowCreateModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-gradient-to-br from-[#1a1a2e] to-[#16213e] rounded-2xl p-6 w-full max-w-md shadow-2xl border border-white/10 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg">
                    <Plus size={20} className="text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-white">Neue Aufgabe</h3>
                </div>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X size={20} className="text-gray-400" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Titel *
                  </label>
                  <input
                    type="text"
                    value={newTask.title}
                    onChange={(e) => setNewTask(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-white placeholder-gray-500 transition-all"
                    placeholder="z.B. Dokumente prüfen"
                    autoFocus
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Beschreibung
                  </label>
                  <textarea
                    value={newTask.description}
                    onChange={(e) => setNewTask(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-white placeholder-gray-500 transition-all resize-none"
                    rows={3}
                    placeholder="Detaillierte Beschreibung der Aufgabe..."
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Priorität
                    </label>
                    <select
                      value={newTask.priority}
                      onChange={(e) => setNewTask(prev => ({ ...prev, priority: e.target.value as Task['priority'] }))}
                      className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-white transition-all"
                    >
                      <option value="low" className="bg-[#1a1a2e]">Niedrig</option>
                      <option value="medium" className="bg-[#1a1a2e]">Normal</option>
                      <option value="high" className="bg-[#1a1a2e]">Hoch</option>
                      <option value="urgent" className="bg-[#1a1a2e]">Dringend</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Stunden
                    </label>
                    <input
                      type="number"
                      value={newTask.estimated_hours}
                      onChange={(e) => setNewTask(prev => ({ ...prev, estimated_hours: e.target.value }))}
                      className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-white placeholder-gray-500 transition-all"
                      placeholder="8"
                      min="0"
                      step="0.5"
                    />
                  </div>
                </div>
                
                 <div>
                   <label className="block text-sm font-medium text-gray-300 mb-2">
                     Fälligkeitsdatum
                   </label>
                   <input
                     type="date"
                     value={newTask.due_date}
                     onChange={(e) => setNewTask(prev => ({ ...prev, due_date: e.target.value }))}
                     className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-white transition-all"
                   />
                 </div>
                 
                 {/* File Upload Section */}
                 <div>
                   <label className="block text-sm font-medium text-gray-300 mb-2">
                     Fotos hinzufügen
                   </label>
                   <div className="space-y-3">
                     {/* Upload Button */}
                     <div 
                       className="relative"
                       onDrop={handleFileDrop}
                       onDragOver={handleFileDragOver}
                     >
                       <input
                         type="file"
                         multiple
                         accept="image/*"
                         onChange={handleFileUpload}
                         className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                         id="file-upload"
                       />
                       <label
                         htmlFor="file-upload"
                         className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-white/5 border-2 border-dashed border-white/20 rounded-lg hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all cursor-pointer group"
                       >
                         <Upload size={20} className="text-gray-400 group-hover:text-emerald-400" />
                         <span className="text-gray-300 group-hover:text-emerald-300">
                           Fotos auswählen oder hier ablegen
                         </span>
                       </label>
                     </div>
                     
                     {/* Uploaded Files Preview */}
                     {uploadedFiles.length > 0 && (
                       <div className="space-y-2">
                         <p className="text-xs text-gray-400">
                           {uploadedFiles.length} Foto{uploadedFiles.length !== 1 ? 's' : ''} ausgewählt
                         </p>
                         <div className="grid grid-cols-2 gap-2">
                           {uploadedFiles.map((file, index) => (
                             <div
                               key={`kanban-file-${file.id || file.name || index}`}
                               className="relative bg-white/5 rounded-lg p-2 border border-white/10"
                             >
                               <div className="flex items-center gap-2">
                                 <Image size={16} className="text-emerald-400 flex-shrink-0" />
                                 <span className="text-xs text-gray-300 truncate flex-1">
                                   {file.name}
                                 </span>
                                 <button
                                   onClick={() => removeFile(index)}
                                   className="p-1 hover:bg-red-500/20 rounded transition-colors"
                                 >
                                   <FileX size={14} className="text-red-400" />
                                 </button>
                               </div>
                               <div className="text-xs text-gray-500 mt-1">
                                 {(file.size / 1024 / 1024).toFixed(1)} MB
                               </div>
                             </div>
                           ))}
                         </div>
                       </div>
                     )}
                   </div>
                 </div>
                
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 px-4 py-2.5 border border-white/20 text-gray-300 rounded-lg hover:bg-white/5 transition-colors"
                  >
                    Abbrechen
                  </button>
                   <button
                     onClick={createTask}
                     disabled={uploadingFiles}
                     className="flex-1 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-lg hover:from-emerald-600 hover:to-emerald-700 transition-all shadow-lg hover:shadow-emerald-500/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                   >
                     {uploadingFiles ? (
                       <>
                         <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                         Erstelle...
                       </>
                     ) : (
                       'Erstellen'
                     )}
                   </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </AnimatePresence>,
        document.body
      )}
      </div>

      {/* Task Detail Modal - außerhalb des Hauptcontainers */}
      <TaskDetailModal
        isOpen={showTaskDetailModal}
        task={selectedTask}
        onClose={() => {
          setShowTaskDetailModal(false);
          setSelectedTask(null);
        }}
        onTaskUpdate={handleTaskUpdate}
        onTaskDelete={handleTaskDelete}
        milestones={milestones}
      />
    </>
  );
};

export default KanbanBoard;
