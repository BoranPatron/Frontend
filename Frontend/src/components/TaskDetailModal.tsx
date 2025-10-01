import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, User, Flag, Building, Edit2, Save, Trash2 } from 'lucide-react';
import { api } from '../api/api';

// Simple Markdown Renderer Component for handling base64 images
const MarkdownRenderer: React.FC<{ content: string }> = ({ content }) => {
  // Convert markdown image syntax to HTML img tags
  const renderMarkdown = (text: string): string => {
    // Replace ![alt](data:image/...) with proper img tags
    return text.replace(
      /!\[([^\]]*)\]\((data:image\/[^;]+;base64,[^)]+)\)/g,
      '<img src="$2" alt="$1" style="max-width: 100%; height: auto; border-radius: 8px; margin: 8px 0;" />'
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
      case 'urgent': return 'text-red-600 bg-red-50 border-red-200';
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'todo': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'in_progress': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'review': return 'text-purple-600 bg-purple-50 border-purple-200';
      case 'completed': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100" style={{ backgroundColor: '#51636f0a' }}>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#51636f' }}>
              <Edit2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold" style={{ color: '#51636f' }}>Task Details</h2>
              <p className="text-sm text-gray-600">ID: {task.id}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="p-2 text-gray-500 rounded-lg transition-colors"
              style={{ 
                color: '#6b7280'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#ffbd59';
                e.currentTarget.style.backgroundColor = '#ffbd590a';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = '#6b7280';
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
              title={isEditing ? 'Bearbeitung abbrechen' : 'Task bearbeiten'}
            >
              <Edit2 className="w-5 h-5" />
            </button>
            <button
              onClick={handleDelete}
              disabled={isLoading}
              className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Task löschen"
            >
              <Trash2 className="w-5 h-5" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Titel
            </label>
            {isEditing ? (
              <input
                type="text"
                value={editedTask.title || ''}
                onChange={(e) => setEditedTask({ ...editedTask, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Task-Titel eingeben..."
              />
            ) : (
              <p className="text-lg font-semibold text-gray-900">{task.title}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Beschreibung
            </label>
            {isEditing ? (
              <textarea
                value={editedTask.description || ''}
                onChange={(e) => setEditedTask({ ...editedTask, description: e.target.value })}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Beschreibung eingeben..."
              />
            ) : (
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-gray-700 whitespace-pre-wrap">
                  <MarkdownRenderer content={task.description || 'Keine Beschreibung verfügbar'} />
                </div>
              </div>
            )}
          </div>

          {/* Status and Priority Row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(task.status)}`}>
                {task.status}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Priorität
              </label>
              {isEditing ? (
                <select
                  value={editedTask.priority || ''}
                  onChange={(e) => setEditedTask({ ...editedTask, priority: e.target.value as 'low' | 'medium' | 'high' | 'urgent' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="low">Niedrig</option>
                  <option value="medium">Mittel</option>
                  <option value="high">Hoch</option>
                  <option value="urgent">Dringend</option>
                </select>
              ) : (
                <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getPriorityColor(task.priority)}`}>
                  <Flag className="w-4 h-4 mr-1" />
                  {task.priority}
                </div>
              )}
            </div>
          </div>

          {/* Due Date and Hours Row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fälligkeitsdatum
              </label>
              {isEditing ? (
                <input
                  type="date"
                  value={editedTask.due_date || ''}
                  onChange={(e) => setEditedTask({ ...editedTask, due_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              ) : (
                <div className="flex items-center text-gray-600">
                  <Calendar className="w-4 h-4 mr-2" />
                  {formatDate(task.due_date)}
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Geschätzte Stunden
              </label>
              {isEditing ? (
                <input
                  type="number"
                  step="0.25"
                  min="0"
                  value={editedTask.estimated_hours || ''}
                  onChange={(e) => setEditedTask({ ...editedTask, estimated_hours: parseFloat(e.target.value) || undefined })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0.0"
                />
              ) : (
                <div className="flex items-center text-gray-600">
                  <Clock className="w-4 h-4 mr-2" />
                  {task.estimated_hours ? `${task.estimated_hours}h` : (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-200">
                      Keine Schätzung
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Milestone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Gewerk
            </label>
            {isEditing ? (
              <select
                value={editedTask.milestone_id || ''}
                onChange={(e) => setEditedTask({ ...editedTask, milestone_id: parseInt(e.target.value) || undefined })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Kein Gewerk</option>
                {milestones.map(milestone => (
                  <option key={milestone.id} value={milestone.id}>
                    {milestone.title}
                  </option>
                ))}
              </select>
            ) : (
              <div className="flex items-center text-gray-600">
                <Building className="w-4 h-4 mr-2" />
                {task.milestone?.title || 'Kein Gewerk zugeordnet'}
              </div>
            )}
          </div>

          {/* Assigned User */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Zugewiesen an
            </label>
            <div className="flex items-center text-gray-600">
              <User className="w-4 h-4 mr-2" />
              {task.assigned_user ? 
                `${task.assigned_user.first_name} ${task.assigned_user.last_name}` : 
                `User ID: ${task.assigned_to}`
              }
            </div>
          </div>

          {/* Timestamps */}
          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Erstellt am
              </label>
              <p className="text-sm text-gray-600">{formatDateTime(task.created_at)}</p>
            </div>
            {task.updated_at && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Zuletzt aktualisiert
                </label>
                <p className="text-sm text-gray-600">{formatDateTime(task.updated_at)}</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        {isEditing && (
          <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
            <button
              onClick={() => setIsEditing(false)}
              disabled={isLoading}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
            >
              Abbrechen
            </button>
            <button
              onClick={handleSave}
              disabled={isLoading}
              className="flex items-center px-6 py-2 text-white rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50"
              style={{ 
                backgroundColor: '#ffbd59'
              }}
              onMouseEnter={(e) => {
                if (!isLoading) e.currentTarget.style.backgroundColor = '#ff9500';
              }}
              onMouseLeave={(e) => {
                if (!isLoading) e.currentTarget.style.backgroundColor = '#ffbd59';
              }}
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
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
};

export default TaskDetailModal;
