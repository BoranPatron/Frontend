import React, { useState, useEffect } from 'react';
import { XCircle } from 'lucide-react';
import { createTask } from '../api/taskService';
import { getProjects } from '../api/projectService';

interface TaskCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTaskCreated?: () => void;
}

interface FormData {
  title: string;
  description: string;
  status: 'todo' | 'in_progress' | 'review' | 'completed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  project_id: string;
  assigned_to: string;
  due_date: string;
  estimated_hours: string;
  is_milestone: boolean;
}

export default function TaskCreationModal({ isOpen, onClose, onTaskCreated }: TaskCreationModalProps) {
  const [formData, setFormData] = useState<FormData>({
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
  
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Load projects when modal opens
  useEffect(() => {
    if (isOpen) {
      loadProjects();
    }
  }, [isOpen]);

  const loadProjects = async () => {
    try {
      const projectsData = await getProjects();
      setProjects(projectsData);
    } catch (err) {
      console.error('Error loading projects:', err);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      // Validate required fields
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
      
      onClose();
      resetForm();
      onTaskCreated?.();
      
    } catch (err: any) {
      console.error('❌ Error in handleCreateTask:', err);
      const errorMessage = err.message || 'Unbekannter Fehler beim Erstellen der Aufgabe';
      setError(errorMessage);
    } finally {
      setLoading(false);
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
    setError('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[99999] p-4">
      <div className="bg-[#3d4952] rounded-2xl p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Neue Aufgabe erstellen</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <XCircle size={24} className="text-gray-400" />
          </button>
        </div>
        
        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-xl text-red-300">
            {error}
          </div>
        )}
        
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
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-[#ffbd59] to-[#ffa726] text-[#3d4952] font-bold py-3 rounded-xl hover:from-[#ffa726] hover:to-[#ff9800] transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Erstelle...' : 'Aufgabe erstellen'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-white/10 text-white font-bold py-3 rounded-xl hover:bg-white/20 transition-all duration-300"
            >
              Abbrechen
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
