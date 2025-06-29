import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getProjects, createProject } from '../api/projectService';
import { 
  FolderOpen, 
  Home, 
  Plus, 
  TrendingUp, 
  XCircle, 
  AlertTriangle,
  Calendar,
  MapPin,
  DollarSign,
  Ruler,
  FileText,
  Eye,
  EyeOff,
  CheckCircle
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
  created_at: string;
}

export default function Projects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const navigate = useNavigate();

  // Form state für neues Projekt
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    project_type: 'new_build',
    status: 'planning',
    address: '',
    property_size: '',
    construction_area: '',
    start_date: '',
    end_date: '',
    estimated_duration: '',
    budget: '',
    is_public: false,
    allow_quotes: true
  });

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    setLoading(true);
    try {
      const data = await getProjects();
      setProjects(data);
    } catch (e: any) {
      console.error('❌ Error loading projects:', e);
      setError(e.message || 'Fehler beim Laden der Projekte');
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      // Validiere erforderliche Felder
      if (!formData.name.trim()) {
        setError('Projektname ist erforderlich');
        return;
      }

      if (!formData.project_type) {
        setError('Projekttyp ist erforderlich');
        return;
      }

      // Bereite die Daten für die API vor
      const projectData = {
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        project_type: formData.project_type as 'new_build' | 'renovation' | 'extension' | 'refurbishment',
        status: formData.status as 'planning' | 'preparation' | 'execution' | 'completion' | 'completed' | 'on_hold' | 'cancelled',
        address: formData.address.trim() || null,
        property_size: formData.property_size ? parseFloat(formData.property_size) : null,
        construction_area: formData.construction_area ? parseFloat(formData.construction_area) : null,
        start_date: formData.start_date && formData.start_date.trim() !== '' ? formData.start_date : null,
        end_date: formData.end_date && formData.end_date.trim() !== '' ? formData.end_date : null,
        estimated_duration: formData.estimated_duration ? parseInt(formData.estimated_duration) : null,
        budget: formData.budget ? parseFloat(formData.budget) : null,
        is_public: formData.is_public,
        allow_quotes: formData.allow_quotes
      };

      console.log('🚀 Creating project with data:', projectData);
      await createProject(projectData);
      
      console.log('✅ Project created successfully');
      setShowCreateModal(false);
      resetForm();
      await loadProjects(); // Lade Projekte neu
      
    } catch (err: any) {
      console.error('❌ Error in handleCreateProject:', err);
      let errorMessage = 'Unbekannter Fehler beim Erstellen des Projekts';
      
      // Versuche detaillierte Fehlermeldung zu extrahieren
      if (err.response?.data?.detail) {
        if (Array.isArray(err.response.data.detail)) {
          // Pydantic Validation Errors
          const validationErrors = err.response.data.detail.map((error: any) => 
            `${error.loc.join('.')}: ${error.msg}`
          ).join(', ');
          errorMessage = `Validierungsfehler: ${validationErrors}`;
        } else {
          errorMessage = err.response.data.detail;
        }
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      project_type: 'new_build',
      status: 'planning',
      address: '',
      property_size: '',
      construction_area: '',
      start_date: '',
      end_date: '',
      estimated_duration: '',
      budget: '',
      is_public: false,
      allow_quotes: true
    });
  };

  const getProjectTypeLabel = (type: string) => {
    switch (type) {
      case 'new_build': return 'Neubau';
      case 'renovation': return 'Renovierung';
      case 'extension': return 'Anbau';
      case 'refurbishment': return 'Sanierung';
      default: return type;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'planning': return 'Planung';
      case 'preparation': return 'Vorbereitung';
      case 'execution': return 'Ausführung';
      case 'completion': return 'Fertigstellung';
      case 'completed': return 'Abgeschlossen';
      case 'on_hold': return 'Pausiert';
      case 'cancelled': return 'Abgebrochen';
      default: return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planning': return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'preparation': return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      case 'execution': return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'completion': return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      case 'completed': return 'bg-green-600/20 text-green-400 border-green-600/30';
      case 'on_hold': return 'bg-orange-500/20 text-orange-300 border-orange-500/30';
      case 'cancelled': return 'bg-red-500/20 text-red-300 border-red-500/30';
      default: return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#51646f] via-[#3d4952] to-[#2c3539] flex flex-col p-8">
      <header className="mb-10 flex items-center gap-4">
        <Home size={32} className="text-[#ffbd59]" />
        <h1 className="text-3xl font-bold text-white">Projekte</h1>
        <button
          className="ml-auto flex items-center gap-2 px-5 py-2 bg-[#ffbd59] text-[#3d4952] rounded-lg font-semibold hover:bg-[#ffa726] transition"
          onClick={() => setShowCreateModal(true)}
        >
          <Plus size={18} /> Neues Projekt
        </button>
      </header>

      {/* Error Banner */}
      {error && (
        <div className="bg-red-500/20 border border-red-500/30 text-red-300 px-6 py-4 flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <AlertTriangle size={20} />
            <span>{error}</span>
          </div>
          <button onClick={() => setError('')} className="text-red-300 hover:text-red-100">
            <XCircle size={20} />
          </button>
        </div>
      )}

      {loading ? (
        <div className="text-white text-lg">Lade Projekte...</div>
      ) : projects.length === 0 ? (
        <div className="text-gray-300 text-lg flex flex-col items-center mt-20">
          <FolderOpen size={48} className="mb-4 text-[#ffbd59]" />
          <span>Keine Projekte gefunden.</span>
          <button
            onClick={() => setShowCreateModal(true)}
            className="mt-4 flex items-center gap-2 px-4 py-2 bg-[#ffbd59] text-[#3d4952] rounded-lg font-semibold hover:bg-[#ffa726] transition"
          >
            <Plus size={16} /> Erstes Projekt erstellen
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {projects.map((project) => (
            <div
              key={project.id}
              className="bg-white/10 backdrop-blur-lg rounded-2xl p-7 shadow-xl border border-white/20 hover:bg-white/15 transition-all duration-300 transform hover:-translate-y-2 cursor-pointer"
              onClick={() => navigate(`/projects/${project.id}`)}
            >
              <div className="flex items-center gap-3 mb-2">
                <TrendingUp size={24} className="text-[#ffbd59]" />
                <h2 className="text-xl font-bold text-white">{project.name}</h2>
              </div>
              <p className="text-gray-300 mb-2">{project.description}</p>
              <div className="flex items-center gap-4 text-sm text-gray-400 mb-2">
                <span>Typ: <span className="text-white font-medium">{getProjectTypeLabel(project.project_type)}</span></span>
                <span>Status: <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium backdrop-blur-md border ${getStatusColor(project.status)}`}>
                  {getStatusLabel(project.status)}
                </span></span>
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-400">
                <span>Fortschritt:</span>
                <div className="relative w-32 bg-gray-700/50 rounded-full h-3">
                  <div className="absolute inset-0 bg-gradient-to-r from-[#ffbd59] to-[#ffa726] h-3 rounded-full transition-all duration-1000 ease-out shadow-lg" style={{ width: `${project.progress_percentage}%` }} />
                </div>
                <span className="text-[#ffbd59] font-bold">{project.progress_percentage}%</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Project Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#3d4952] rounded-2xl p-8 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">Neues Projekt erstellen</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <XCircle size={24} className="text-gray-400" />
              </button>
            </div>
            
            <form onSubmit={handleCreateProject} className="space-y-6">
              {/* Grundinformationen */}
              <div className="bg-white/5 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <FileText size={20} className="text-[#ffbd59]" />
                  Grundinformationen
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Projektname *</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent"
                      placeholder="z.B. Einfamilienhaus Musterstraße"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Projekttyp *</label>
                    <select
                      required
                      value={formData.project_type}
                      onChange={(e) => setFormData({...formData, project_type: e.target.value})}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent"
                    >
                      <option value="new_build">Neubau</option>
                      <option value="renovation">Renovierung</option>
                      <option value="extension">Anbau</option>
                      <option value="refurbishment">Sanierung</option>
                    </select>
                  </div>
                </div>
                
                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-300 mb-2">Beschreibung</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    rows={3}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent"
                    placeholder="Beschreiben Sie Ihr Projekt..."
                  />
                </div>
              </div>

              {/* Standort und Größe */}
              <div className="bg-white/5 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <MapPin size={20} className="text-[#ffbd59]" />
                  Standort und Größe
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Adresse</label>
                    <input
                      type="text"
                      value={formData.address}
                      onChange={(e) => setFormData({...formData, address: e.target.value})}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent"
                      placeholder="Musterstraße 123, 12345 Musterstadt"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Grundstücksgröße (m²)</label>
                    <input
                      type="number"
                      value={formData.property_size}
                      onChange={(e) => setFormData({...formData, property_size: e.target.value})}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent"
                      placeholder="500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Baufläche (m²)</label>
                    <input
                      type="number"
                      value={formData.construction_area}
                      onChange={(e) => setFormData({...formData, construction_area: e.target.value})}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent"
                      placeholder="150"
                    />
                  </div>
                </div>
              </div>

              {/* Zeitplan */}
              <div className="bg-white/5 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Calendar size={20} className="text-[#ffbd59]" />
                  Zeitplan
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Startdatum</label>
                    <input
                      type="date"
                      value={formData.start_date}
                      onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Enddatum</label>
                    <input
                      type="date"
                      value={formData.end_date}
                      onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Geschätzte Dauer (Tage)</label>
                    <input
                      type="number"
                      value={formData.estimated_duration}
                      onChange={(e) => setFormData({...formData, estimated_duration: e.target.value})}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent"
                      placeholder="180"
                    />
                  </div>
                </div>
              </div>

              {/* Budget */}
              <div className="bg-white/5 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <DollarSign size={20} className="text-[#ffbd59]" />
                  Budget
                </h3>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Gesamtbudget (€)</label>
                  <input
                    type="number"
                    value={formData.budget}
                    onChange={(e) => setFormData({...formData, budget: e.target.value})}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent"
                    placeholder="500000"
                  />
                </div>
              </div>

              {/* Einstellungen */}
              <div className="bg-white/5 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Eye size={20} className="text-[#ffbd59]" />
                  Einstellungen
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="is_public"
                      checked={formData.is_public}
                      onChange={(e) => setFormData({...formData, is_public: e.target.checked})}
                      className="w-4 h-4 text-[#ffbd59] bg-white/10 border-white/20 rounded focus:ring-[#ffbd59] focus:ring-2"
                    />
                    <label htmlFor="is_public" className="text-sm text-gray-300 flex items-center gap-2">
                      {formData.is_public ? <Eye size={16} /> : <EyeOff size={16} />}
                      Projekt öffentlich sichtbar (für Dienstleister)
                    </label>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="allow_quotes"
                      checked={formData.allow_quotes}
                      onChange={(e) => setFormData({...formData, allow_quotes: e.target.checked})}
                      className="w-4 h-4 text-[#ffbd59] bg-white/10 border-white/20 rounded focus:ring-[#ffbd59] focus:ring-2"
                    />
                    <label htmlFor="allow_quotes" className="text-sm text-gray-300 flex items-center gap-2">
                      <CheckCircle size={16} />
                      Angebote von Dienstleistern erlauben
                    </label>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-4 pt-6">
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-[#ffbd59] to-[#ffa726] text-[#3d4952] font-bold py-3 rounded-xl hover:from-[#ffa726] hover:to-[#ff9800] transition-all duration-300 transform hover:scale-105"
                >
                  Projekt erstellen
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
    </div>
  );
} 