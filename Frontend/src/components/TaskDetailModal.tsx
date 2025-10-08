import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Calendar, Clock, User, Flag, Building, Edit2, Save, Trash2 } from 'lucide-react';
import { api } from '../api/api';

// Simple Markdown Renderer Component for handling base64 images
const MarkdownRenderer: React.FC<{ content: string }> = ({ content }) => {
  // Convert markdown image syntax to HTML img tags
  const renderMarkdown = (text: string): string => {
    // Replace ![alt](data:image/...) with proper img tags
    return text.replace(
      /!\[([^\]]*)\]\((data:image\/[^;]+;base64,[^)]+)\)/g,
      '<img src="$2" alt="$1" style="max-width: 100%; height: auto; border-radius: 12px; margin: 12px 0; box-shadow: 0 4px 12px rgba(0,0,0,0.3);" />'
    );
  };

  const htmlContent = renderMarkdown(content);
  
  return (
    <div 
      dangerouslySetInnerHTML={{ __html: htmlContent }}
      className="markdown-content"
    />
  );
};

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

interface TaskDetailModalProps {
  isOpen: boolean;
  task: Task | null;
  onClose: () => void;
  onTaskUpdate: (updatedTask: Task) => void;
  onTaskDelete: (taskId: number) => void;
  milestones: Array<{ id: number; title: string }>;
}

const TaskDetailModal: React.FC<TaskDetailModalProps> = ({
  isOpen,
  task,
  onClose,
  onTaskUpdate,
  onTaskDelete,
  milestones
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTask, setEditedTask] = useState<Partial<Task>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (task) {
      setEditedTask({
        title: task.title,
        description: task.description || '',
        priority: task.priority,
        due_date: task.due_date,
        estimated_hours: task.estimated_hours,
        milestone_id: task.milestone_id
      });
    }
  }, [task]);

  if (!isOpen || !task) return null;

  const handleSave = async () => {
    if (!task) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await api.put(`/tasks/${task.id}`, editedTask);
      const updatedTask = response.data;
      
      onTaskUpdate(updatedTask);
      setIsEditing(false);
      
      } catch (error: any) {
      console.error('❌ Fehler beim Aktualisieren der Task:', error);
      setError('Fehler beim Speichern der Änderungen');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!task) return;
    
    if (!confirm('Sind Sie sicher, dass Sie diese Aufgabe löschen möchten?')) {
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      await api.delete(`/tasks/${task.id}`);
      onTaskDelete(task.id);
      onClose();
      
      } catch (error: any) {
      console.error('❌ Fehler beim Löschen der Task:', error);
      setError('Fehler beim Löschen der Aufgabe');
    } finally {
      setIsLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'urgent': return 'text-red-300 bg-red-500/20 border-red-400/30';
      case 'high': return 'text-orange-300 bg-orange-500/20 border-orange-400/30';
      case 'medium': return 'text-blue-300 bg-blue-500/20 border-blue-400/30';
      case 'low': return 'text-green-300 bg-green-500/20 border-green-400/30';
      default: return 'text-gray-300 bg-gray-500/20 border-gray-400/30';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'todo': return 'text-blue-300 bg-blue-500/20 border-blue-400/30';
      case 'in_progress': return 'text-[#ffbd59] bg-[#ffbd59]/20 border-[#ffbd59]/30';
      case 'review': return 'text-purple-300 bg-purple-500/20 border-purple-400/30';
      case 'completed': return 'text-green-300 bg-green-500/20 border-green-400/30';
      default: return 'text-gray-300 bg-gray-500/20 border-gray-400/30';
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Nicht gesetzt';
    return new Date(dateString).toLocaleDateString('de-DE');
  };

  const formatDateTime = (dateString?: string) => {
    if (!dateString) return 'Nicht verfügbar';
    return new Date(dateString).toLocaleString('de-DE');
  };

  if (!isOpen || !task) return null;

  const modalContent = (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
      <div className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl max-w-5xl w-full max-h-[95vh] overflow-y-auto border border-white/20">
        {/* Header - Dashboard-Style */}
        <div className="flex items-center justify-between p-6 border-b border-white/20">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br from-[#ffbd59] to-[#ff9500] shadow-lg">
              <Edit2 className="w-6 h-6 text-[#3d4952]" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Task Details</h2>
              <p className="text-sm text-gray-300">ID: #{task.id}</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="p-3 text-gray-300 hover:text-[#ffbd59] hover:bg-[#ffbd59]/10 rounded-xl transition-all duration-200"
              title={isEditing ? 'Bearbeitung abbrechen' : 'Task bearbeiten'}
            >
              <Edit2 className="w-5 h-5" />
            </button>
            <button
              onClick={handleDelete}
              disabled={isLoading}
              className="p-3 text-gray-300 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all duration-200 disabled:opacity-50"
              title="Task löschen"
            >
              <Trash2 className="w-5 h-5" />
            </button>
            <button
              onClick={onClose}
              className="p-3 text-gray-300 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content - Dashboard-Style */}
        <div className="p-6">
          {error && (
            <div className="bg-red-500/20 border border-red-400/30 rounded-xl p-4 mb-6">
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}

          {/* Haupt-Kachel - Dashboard-Style */}
          <div className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10 mb-6">
            {/* Title */}
            <div className="mb-6">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-3 h-3 bg-[#ffbd59] rounded-full"></div>
                <span className="text-sm text-gray-400 uppercase tracking-wide font-semibold">Titel</span>
              </div>
              {isEditing ? (
                <input
                  type="text"
                  value={editedTask.title || ''}
                  onChange={(e) => setEditedTask({ ...editedTask, title: e.target.value })}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl focus:ring-2 focus:ring-[#ffbd59] focus:border-[#ffbd59] transition-all text-lg font-semibold text-white placeholder-gray-400"
                  placeholder="Task-Titel eingeben..."
                />
              ) : (
                <h1 className="text-2xl font-bold text-white leading-tight">{task.title}</h1>
              )}
            </div>

            {/* Description */}
            <div className="mb-6">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-3 h-3 bg-[#ffbd59] rounded-full"></div>
                <span className="text-sm text-gray-400 uppercase tracking-wide font-semibold">Beschreibung</span>
              </div>
              {isEditing ? (
                <textarea
                  value={editedTask.description || ''}
                  onChange={(e) => setEditedTask({ ...editedTask, description: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl focus:ring-2 focus:ring-[#ffbd59] focus:border-[#ffbd59] transition-all resize-none text-white placeholder-gray-400"
                  placeholder="Beschreibung eingeben..."
                />
              ) : (
                <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
                  <div className="text-gray-300 whitespace-pre-wrap leading-relaxed">
                    <MarkdownRenderer content={task.description || 'Keine Beschreibung verfügbar'} />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Info-Kacheln Grid - Dashboard-Style */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {/* Status Kachel */}
            <div className="bg-white/5 backdrop-blur-lg rounded-xl p-4 border border-white/10 hover:bg-white/10 transition-all duration-300">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse"></div>
                <span className="text-sm text-gray-400 uppercase tracking-wide font-semibold">Status</span>
              </div>
              <div className={`inline-flex items-center px-3 py-2 rounded-lg text-sm font-semibold border ${getStatusColor(task.status)}`}>
                <div className="w-2 h-2 rounded-full bg-current mr-2"></div>
                {task.status}
              </div>
            </div>

            {/* Priorität Kachel */}
            <div className="bg-white/5 backdrop-blur-lg rounded-xl p-4 border border-white/10 hover:bg-white/10 transition-all duration-300">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                <span className="text-sm text-gray-400 uppercase tracking-wide font-semibold">Priorität</span>
              </div>
              {isEditing ? (
                <select
                  value={editedTask.priority || ''}
                  onChange={(e) => setEditedTask({ ...editedTask, priority: e.target.value as 'low' | 'medium' | 'high' | 'urgent' })}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg focus:ring-2 focus:ring-[#ffbd59] focus:border-[#ffbd59] transition-all text-white"
                >
                  <option value="low" className="bg-gray-800">Niedrig</option>
                  <option value="medium" className="bg-gray-800">Mittel</option>
                  <option value="high" className="bg-gray-800">Hoch</option>
                  <option value="urgent" className="bg-gray-800">Dringend</option>
                </select>
              ) : (
                <div className={`inline-flex items-center px-3 py-2 rounded-lg text-sm font-semibold border ${getPriorityColor(task.priority)}`}>
                  <Flag className="w-4 h-4 mr-2" />
                  {task.priority}
                </div>
              )}
            </div>

            {/* Fälligkeitsdatum Kachel */}
            <div className="bg-white/5 backdrop-blur-lg rounded-xl p-4 border border-white/10 hover:bg-white/10 transition-all duration-300">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-sm text-gray-400 uppercase tracking-wide font-semibold">Fälligkeitsdatum</span>
              </div>
              {isEditing ? (
                <input
                  type="date"
                  value={editedTask.due_date || ''}
                  onChange={(e) => setEditedTask({ ...editedTask, due_date: e.target.value })}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg focus:ring-2 focus:ring-[#ffbd59] focus:border-[#ffbd59] transition-all text-white"
                />
              ) : (
                <div className="flex items-center text-gray-300 font-medium">
                  <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                  {formatDate(task.due_date)}
                </div>
              )}
            </div>

            {/* Geschätzte Stunden Kachel */}
            <div className="bg-white/5 backdrop-blur-lg rounded-xl p-4 border border-white/10 hover:bg-white/10 transition-all duration-300">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
                <span className="text-sm text-gray-400 uppercase tracking-wide font-semibold">Geschätzte Stunden</span>
              </div>
              {isEditing ? (
                <input
                  type="number"
                  step="0.25"
                  min="0"
                  value={editedTask.estimated_hours || ''}
                  onChange={(e) => setEditedTask({ ...editedTask, estimated_hours: parseFloat(e.target.value) || undefined })}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg focus:ring-2 focus:ring-[#ffbd59] focus:border-[#ffbd59] transition-all text-white placeholder-gray-400"
                  placeholder="0.0"
                />
              ) : (
                <div className="flex items-center text-gray-300 font-medium">
                  <Clock className="w-4 h-4 mr-2 text-gray-400" />
                  {task.estimated_hours ? `${task.estimated_hours}h` : (
                    <span className="inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium bg-yellow-500/20 text-yellow-300 border border-yellow-400/30">
                      Keine Schätzung
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Gewerk Kachel */}
            <div className="bg-white/5 backdrop-blur-lg rounded-xl p-4 border border-white/10 hover:bg-white/10 transition-all duration-300">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse"></div>
                <span className="text-sm text-gray-400 uppercase tracking-wide font-semibold">Gewerk</span>
              </div>
              {isEditing ? (
                <select
                  value={editedTask.milestone_id || ''}
                  onChange={(e) => setEditedTask({ ...editedTask, milestone_id: parseInt(e.target.value) || undefined })}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg focus:ring-2 focus:ring-[#ffbd59] focus:border-[#ffbd59] transition-all text-white"
                >
                  <option value="" className="bg-gray-800">Kein Gewerk</option>
                  {milestones.map(milestone => (
                    <option key={milestone.id} value={milestone.id} className="bg-gray-800">
                      {milestone.title}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="flex items-center text-gray-300 font-medium">
                  <Building className="w-4 h-4 mr-2 text-gray-400" />
                  {task.milestone?.title || 'Kein Gewerk zugeordnet'}
                </div>
              )}
            </div>

            {/* Zugewiesen an Kachel */}
            <div className="bg-white/5 backdrop-blur-lg rounded-xl p-4 border border-white/10 hover:bg-white/10 transition-all duration-300">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
                <span className="text-sm text-gray-400 uppercase tracking-wide font-semibold">Zugewiesen an</span>
              </div>
              <div className="flex items-center text-gray-300 font-medium">
                <User className="w-4 h-4 mr-2 text-gray-400" />
                {task.assigned_user ? 
                  `${task.assigned_user.first_name} ${task.assigned_user.last_name}` : 
                  `User ID: ${task.assigned_to}`
                }
              </div>
            </div>
          </div>

          {/* Timestamps Kachel - Dashboard-Style */}
          <div className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-3 h-3 bg-[#ffbd59] rounded-full"></div>
              <span className="text-sm text-gray-400 uppercase tracking-wide font-semibold">Zeitstempel</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <span className="text-xs text-gray-400 uppercase tracking-wide font-semibold block mb-1">Erstellt am</span>
                <p className="text-sm text-gray-300 font-medium">{formatDateTime(task.created_at)}</p>
              </div>
              {task.updated_at && (
                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <span className="text-xs text-gray-400 uppercase tracking-wide font-semibold block mb-1">Zuletzt aktualisiert</span>
                  <p className="text-sm text-gray-300 font-medium">{formatDateTime(task.updated_at)}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer - Dashboard-Style */}
        {isEditing && (
          <div className="flex items-center justify-end space-x-4 p-6 border-t border-white/20 bg-white/5 backdrop-blur-sm">
            <button
              onClick={() => setIsEditing(false)}
              disabled={isLoading}
              className="px-6 py-3 text-gray-300 hover:text-white font-medium transition-colors"
            >
              Abbrechen
            </button>
            <button
              onClick={handleSave}
              disabled={isLoading}
              className="flex items-center px-8 py-3 bg-[#ffbd59] text-[#3d4952] rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 hover:bg-[#ffa726]"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-[#3d4952] border-t-transparent rounded-full animate-spin mr-2"></div>
                  Speichern...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Speichern
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default TaskDetailModal;