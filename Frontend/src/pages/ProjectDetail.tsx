import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getProject, getProjectDashboard, updateProject } from '../api/projectService';
import { getTasks } from '../api/taskService';
import { getDocuments } from '../api/documentService';
import { getQuotes } from '../api/quoteService';
import { 
  ArrowLeft, 
  Home, 
  FileText, 
  ListTodo, 
  Calendar, 
  DollarSign, 
  MapPin, 
  Ruler,
  Plus,
  Edit,
  Trash2,
  Download,
  Eye,
  CheckCircle,
  Clock,
  AlertTriangle,
  TrendingUp,
  Users,
  MessageSquare,
  Settings,
  BarChart3,
  FolderOpen,
  File,
  Image,
  Receipt,
  FileCheck,
  Camera,
  XCircle,
  X
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
  address?: string;
  property_size?: number;
  construction_area?: number;
  estimated_duration?: number;
  is_public: boolean;
  allow_quotes: boolean;
  created_at: string;
  updated_at: string;
}

interface Task {
  id: number;
  title: string;
  description: string;
  status: 'todo' | 'in_progress' | 'review' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  progress_percentage: number;
  due_date?: string;
  estimated_hours?: number;
  is_milestone: boolean;
  created_at: string;
}

interface Document {
  id: number;
  title: string;
  description: string;
  document_type: 'plan' | 'permit' | 'quote' | 'invoice' | 'contract' | 'photo' | 'other';
  file_name: string;
  file_size: number;
  mime_type: string;
  created_at: string;
}

interface ProjectDashboard {
  project: Project;
  task_count: number;
  completed_tasks: number;
  milestone_count: number;
  completed_milestones: number;
  document_count: number;
  quote_count: number;
  recent_activities: any[];
}

interface ProjectEditForm {
  name: string;
  description: string;
  project_type: string;
  status: string;
  address: string;
  property_size: number;
  construction_area: number;
  start_date: string;
  end_date: string;
  budget: number;
  is_public: boolean;
  allow_quotes: boolean;
}

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [dashboard, setDashboard] = useState<ProjectDashboard | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [quotes, setQuotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'tasks' | 'documents' | 'quotes'>('overview');
  
  // Modal states
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState<ProjectEditForm>({
    name: '',
    description: '',
    project_type: '',
    status: '',
    address: '',
    property_size: 0,
    construction_area: 0,
    start_date: '',
    end_date: '',
    budget: 0,
    is_public: false,
    allow_quotes: true
  });

  useEffect(() => {
    if (id) {
      loadProjectData();
    }
  }, [id]);

  const loadProjectData = async () => {
    setLoading(true);
    try {
      const projectId = parseInt(id!);
      
      // Lade Projekt-Dashboard-Daten
      const dashboardData = await getProjectDashboard(projectId);
      setDashboard(dashboardData);
      setProject(dashboardData.project);
      
      // Lade Aufgaben für dieses Projekt
      const tasksData = await getTasks(projectId);
      setTasks(tasksData);
      
      // Lade Dokumente für dieses Projekt
      const documentsData = await getDocuments(projectId);
      setDocuments(documentsData);
      
      // Lade Angebote für dieses Projekt
      const quotesData = await getQuotes(projectId);
      setQuotes(quotesData);
      
    } catch (e: any) {
      console.error('❌ Error loading project data:', e);
      setError(e.message || 'Fehler beim Laden der Projektdaten');
    } finally {
      setLoading(false);
    }
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

  const getTaskStatusIcon = (status: string) => {
    switch (status) {
      case 'todo': return <ListTodo size={16} />;
      case 'in_progress': return <Clock size={16} />;
      case 'review': return <Eye size={16} />;
      case 'completed': return <CheckCircle size={16} />;
      case 'cancelled': return <AlertTriangle size={16} />;
      default: return <ListTodo size={16} />;
    }
  };

  const getTaskStatusColor = (status: string) => {
    switch (status) {
      case 'todo': return 'bg-gray-500/20 text-gray-300';
      case 'in_progress': return 'bg-blue-500/20 text-blue-300';
      case 'review': return 'bg-yellow-500/20 text-yellow-300';
      case 'completed': return 'bg-green-500/20 text-green-300';
      case 'cancelled': return 'bg-red-500/20 text-red-300';
      default: return 'bg-gray-500/20 text-gray-300';
    }
  };

  const getDocumentTypeIcon = (type: string) => {
    switch (type) {
      case 'plan': return <FileText size={16} />;
      case 'permit': return <FileCheck size={16} />;
      case 'quote': return <Receipt size={16} />;
      case 'invoice': return <Receipt size={16} />;
      case 'contract': return <FileCheck size={16} />;
      case 'photo': return <Camera size={16} />;
      default: return <File size={16} />;
    }
  };

  const getDocumentTypeLabel = (type: string) => {
    switch (type) {
      case 'plan': return 'Plan';
      case 'permit': return 'Genehmigung';
      case 'quote': return 'Angebot';
      case 'invoice': return 'Rechnung';
      case 'contract': return 'Vertrag';
      case 'photo': return 'Foto';
      default: return 'Sonstiges';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-DE');
  };

  const getBudgetProgress = () => {
    if (!project?.budget || project.budget === 0) return 0;
    return Math.min((project.current_costs / project.budget) * 100, 100);
  };

  const getBudgetStatus = () => {
    const progress = getBudgetProgress();
    if (progress < 50) return 'good';
    if (progress < 80) return 'warning';
    return 'danger';
  };

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'add_task':
        navigate(`/tasks?project=${project?.id}`);
        break;
      case 'add_document':
        navigate(`/documents?project=${project?.id}`);
        break;
      case 'edit_project':
        if (project) {
          setEditForm({
            name: project.name,
            description: project.description || '',
            project_type: project.project_type,
            status: project.status,
            address: project.address || '',
            property_size: project.property_size || 0,
            construction_area: project.construction_area || 0,
            start_date: project.start_date || '',
            end_date: project.end_date || '',
            budget: project.budget || 0,
            is_public: project.is_public,
            allow_quotes: project.allow_quotes
          });
          setShowEditModal(true);
        }
        break;
      case 'view_quotes':
        navigate(`/quotes?project=${project?.id}`);
        break;
      case 'view_messages':
        navigate(`/projects/${project?.id}/messages`);
        break;
    }
  };

  const handleEditProject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!project?.id) return;
      
      await updateProject(project.id, editForm);
      setShowEditModal(false);
      // Lade Projektdaten neu
      await loadProjectData();
    } catch (error) {
      console.error('Error updating project:', error);
      setError('Fehler beim Aktualisieren des Projekts');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#51646f] via-[#3d4952] to-[#2c3539] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#ffbd59] mx-auto mb-4"></div>
          <p className="text-white text-lg">Lade Projektdaten...</p>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#51646f] via-[#3d4952] to-[#2c3539] flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle size={48} className="text-red-400 mx-auto mb-4" />
          <p className="text-white text-lg">{error || 'Projekt nicht gefunden'}</p>
          <button
            onClick={() => navigate('/projects')}
            className="mt-4 px-6 py-2 bg-[#ffbd59] text-[#3d4952] rounded-lg font-semibold hover:bg-[#ffa726] transition"
          >
            Zurück zu Projekten
          </button>
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
              onClick={() => navigate('/projects')}
              className="p-2 bg-[#51646f] hover:bg-[#607583] rounded-xl transition-colors duration-300"
            >
              <ArrowLeft size={20} className="text-[#ffbd59]" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-[#ffbd59]">{project.name}</h1>
              <p className="text-gray-300">{project.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium backdrop-blur-md border ${getStatusColor(project.status)}`}>
              {getStatusLabel(project.status)}
            </span>
          </div>
        </div>
      </header>

      <div className="p-8">
        {/* Schnellaktionen */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Settings size={20} className="text-[#ffbd59]" />
            Schnellaktionen
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <button
              onClick={() => handleQuickAction('add_task')}
              className="bg-white/10 backdrop-blur-lg rounded-xl p-4 text-center hover:bg-white/20 transition-all duration-300 border border-white/20"
            >
              <Plus size={24} className="text-[#ffbd59] mx-auto mb-2" />
              <span className="text-white text-sm font-medium">Aufgabe hinzufügen</span>
            </button>
            <button
              onClick={() => handleQuickAction('add_document')}
              className="bg-white/10 backdrop-blur-lg rounded-xl p-4 text-center hover:bg-white/20 transition-all duration-300 border border-white/20"
            >
              <FileText size={24} className="text-[#ffbd59] mx-auto mb-2" />
              <span className="text-white text-sm font-medium">Dokument hochladen</span>
            </button>
            <button
              onClick={() => handleQuickAction('edit_project')}
              className="bg-white/10 backdrop-blur-lg rounded-xl p-4 text-center hover:bg-white/20 transition-all duration-300 border border-white/20"
            >
              <Edit size={24} className="text-[#ffbd59] mx-auto mb-2" />
              <span className="text-white text-sm font-medium">Projekt bearbeiten</span>
            </button>
            <button
              onClick={() => handleQuickAction('view_quotes')}
              className="bg-white/10 backdrop-blur-lg rounded-xl p-4 text-center hover:bg-white/20 transition-all duration-300 border border-white/20"
            >
              <Receipt size={24} className="text-[#ffbd59] mx-auto mb-2" />
              <span className="text-white text-sm font-medium">Angebote anzeigen</span>
            </button>
            <button
              onClick={() => handleQuickAction('view_messages')}
              className="bg-white/10 backdrop-blur-lg rounded-xl p-4 text-center hover:bg-white/20 transition-all duration-300 border border-white/20"
            >
              <MessageSquare size={24} className="text-[#ffbd59] mx-auto mb-2" />
              <span className="text-white text-sm font-medium">Nachrichten</span>
            </button>
            <button
              onClick={() => navigate(`/projects/${project.id}/analytics`)}
              className="bg-white/10 backdrop-blur-lg rounded-xl p-4 text-center hover:bg-white/20 transition-all duration-300 border border-white/20"
            >
              <BarChart3 size={24} className="text-[#ffbd59] mx-auto mb-2" />
              <span className="text-white text-sm font-medium">Analytics</span>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="flex space-x-1 bg-white/10 backdrop-blur-lg rounded-xl p-1">
            {[
              { id: 'overview', label: 'Übersicht', icon: <Home size={16} /> },
              { id: 'tasks', label: 'Aufgaben', icon: <ListTodo size={16} /> },
              { id: 'documents', label: 'Dokumente', icon: <FileText size={16} /> },
              { id: 'quotes', label: 'Angebote', icon: <Receipt size={16} /> }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                  activeTab === tab.id
                    ? 'bg-[#ffbd59] text-[#3d4952] shadow-lg'
                    : 'text-gray-300 hover:text-white hover:bg-white/10'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Projekt-Statistiken */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-500/20 rounded-lg">
                      <ListTodo size={20} className="text-blue-300" />
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">Aufgaben</p>
                      <p className="text-white text-xl font-bold">{dashboard?.task_count || 0}</p>
                      <p className="text-green-400 text-xs">
                        {dashboard?.completed_tasks || 0} abgeschlossen
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-500/20 rounded-lg">
                      <FileText size={20} className="text-green-300" />
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">Dokumente</p>
                      <p className="text-white text-xl font-bold">{dashboard?.document_count || 0}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-yellow-500/20 rounded-lg">
                      <Receipt size={20} className="text-yellow-300" />
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">Angebote</p>
                      <p className="text-white text-xl font-bold">{dashboard?.quote_count || 0}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-500/20 rounded-lg">
                      <TrendingUp size={20} className="text-purple-300" />
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">Fortschritt</p>
                      <p className="text-white text-xl font-bold">{project.progress_percentage}%</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Projekt-Details */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <MapPin size={20} className="text-[#ffbd59]" />
                    Projekt-Details
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Typ:</span>
                      <span className="text-white">{getProjectTypeLabel(project.project_type)}</span>
                    </div>
                    {project.address && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">Adresse:</span>
                        <span className="text-white">{project.address}</span>
                      </div>
                    )}
                    {project.property_size && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">Grundstücksgröße:</span>
                        <span className="text-white">{project.property_size} m²</span>
                      </div>
                    )}
                    {project.construction_area && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">Baufläche:</span>
                        <span className="text-white">{project.construction_area} m²</span>
                      </div>
                    )}
                    {project.estimated_duration && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">Geschätzte Dauer:</span>
                        <span className="text-white">{project.estimated_duration} Tage</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <DollarSign size={20} className="text-[#ffbd59]" />
                    Budget & Zeitplan
                  </h3>
                  <div className="space-y-4">
                    {project.budget && (
                      <div>
                        <div className="flex justify-between mb-2">
                          <span className="text-gray-400">Budget:</span>
                          <span className="text-white">{project.budget.toLocaleString('de-DE')} €</span>
                        </div>
                        <div className="flex justify-between mb-2">
                          <span className="text-gray-400">Aktuelle Kosten:</span>
                          <span className="text-white">{project.current_costs.toLocaleString('de-DE')} €</span>
                        </div>
                        <div className="w-full bg-gray-700/50 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full transition-all duration-1000 ${
                              getBudgetStatus() === 'good' ? 'bg-green-500' :
                              getBudgetStatus() === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${getBudgetProgress()}%` }}
                          />
                        </div>
                      </div>
                    )}
                    
                    {project.start_date && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">Startdatum:</span>
                        <span className="text-white">{formatDate(project.start_date)}</span>
                      </div>
                    )}
                    {project.end_date && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">Enddatum:</span>
                        <span className="text-white">{formatDate(project.end_date)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'tasks' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-white">Aufgaben ({tasks.length})</h3>
                <button
                  onClick={() => handleQuickAction('add_task')}
                  className="flex items-center gap-2 px-4 py-2 bg-[#ffbd59] text-[#3d4952] rounded-lg font-semibold hover:bg-[#ffa726] transition"
                >
                  <Plus size={16} />
                  Aufgabe hinzufügen
                </button>
              </div>
              
              {tasks.length === 0 ? (
                <div className="text-center py-12">
                  <ListTodo size={48} className="text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-400">Keine Aufgaben für dieses Projekt vorhanden.</p>
                  <button
                    onClick={() => handleQuickAction('add_task')}
                    className="mt-4 px-6 py-2 bg-[#ffbd59] text-[#3d4952] rounded-lg font-semibold hover:bg-[#ffa726] transition"
                  >
                    Erste Aufgabe erstellen
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {tasks.map((task) => (
                    <div
                      key={task.id}
                      className="bg-white/5 rounded-xl p-4 border border-white/10 hover:bg-white/10 transition-all duration-300 cursor-pointer"
                      onClick={() => navigate(`/tasks?project=${project.id}`)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {getTaskStatusIcon(task.status)}
                          <div>
                            <h4 className="text-white font-medium">{task.title}</h4>
                            <p className="text-gray-400 text-sm">{task.description}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getTaskStatusColor(task.status)}`}>
                            {task.status === 'todo' ? 'To Do' :
                             task.status === 'in_progress' ? 'In Bearbeitung' :
                             task.status === 'review' ? 'In Prüfung' :
                             task.status === 'completed' ? 'Abgeschlossen' : 'Abgebrochen'}
                          </span>
                          {task.is_milestone && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-500/20 text-purple-300">
                              Meilenstein
                            </span>
                          )}
                          <div className="text-right">
                            <div className="text-white text-sm font-medium">{task.progress_percentage}%</div>
                            <div className="w-16 bg-gray-700/50 rounded-full h-1">
                              <div 
                                className="bg-[#ffbd59] h-1 rounded-full transition-all duration-300"
                                style={{ width: `${task.progress_percentage}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'documents' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-white">Dokumente ({documents.length})</h3>
                <button
                  onClick={() => handleQuickAction('add_document')}
                  className="flex items-center gap-2 px-4 py-2 bg-[#ffbd59] text-[#3d4952] rounded-lg font-semibold hover:bg-[#ffa726] transition"
                >
                  <Plus size={16} />
                  Dokument hochladen
                </button>
              </div>
              
              {documents.length === 0 ? (
                <div className="text-center py-12">
                  <FileText size={48} className="text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-400">Keine Dokumente für dieses Projekt vorhanden.</p>
                  <button
                    onClick={() => handleQuickAction('add_document')}
                    className="mt-4 px-6 py-2 bg-[#ffbd59] text-[#3d4952] rounded-lg font-semibold hover:bg-[#ffa726] transition"
                  >
                    Erstes Dokument hochladen
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {documents.map((document) => (
                    <div
                      key={document.id}
                      className="bg-white/5 rounded-xl p-4 border border-white/10 hover:bg-white/10 transition-all duration-300 cursor-pointer"
                      onClick={() => navigate(`/documents?project=${project.id}`)}
                    >
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-blue-500/20 rounded-lg">
                          {getDocumentTypeIcon(document.document_type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-white font-medium truncate">{document.title}</h4>
                          <p className="text-gray-400 text-sm truncate">{document.description}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-500/20 text-blue-300">
                              {getDocumentTypeLabel(document.document_type)}
                            </span>
                            <span className="text-gray-400 text-xs">
                              {formatFileSize(document.file_size)}
                            </span>
                          </div>
                          <p className="text-gray-500 text-xs mt-1">
                            {formatDate(document.created_at)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'quotes' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-white">Angebote ({dashboard?.quote_count || 0})</h3>
                <button
                  onClick={() => handleQuickAction('view_quotes')}
                  className="flex items-center gap-2 px-4 py-2 bg-[#ffbd59] text-[#3d4952] rounded-lg font-semibold hover:bg-[#ffa726] transition"
                >
                  <Eye size={16} />
                  Alle Angebote anzeigen
                </button>
              </div>
              
              <div className="text-center py-12">
                <Receipt size={48} className="text-gray-400 mx-auto mb-4" />
                <p className="text-gray-400">Angebote werden in der separaten Angebote-Sektion verwaltet.</p>
                <button
                  onClick={() => handleQuickAction('view_quotes')}
                  className="mt-4 px-6 py-2 bg-[#ffbd59] text-[#3d4952] rounded-lg font-semibold hover:bg-[#ffa726] transition"
                >
                  Zur Angebote-Sektion
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Edit Project Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-[#3d4952]">Projekt bearbeiten</h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleEditProject} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Projektname *
                  </label>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Projekttyp *
                  </label>
                  <select
                    value={editForm.project_type}
                    onChange={(e) => setEditForm({...editForm, project_type: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent"
                    required
                  >
                    <option value="">Typ auswählen</option>
                    <option value="new_build">Neubau</option>
                    <option value="renovation">Renovierung</option>
                    <option value="extension">Anbau</option>
                    <option value="refurbishment">Sanierung</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status *
                  </label>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm({...editForm, status: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent"
                    required
                  >
                    <option value="">Status auswählen</option>
                    <option value="planning">Planung</option>
                    <option value="preparation">Vorbereitung</option>
                    <option value="execution">Ausführung</option>
                    <option value="completion">Fertigstellung</option>
                    <option value="completed">Abgeschlossen</option>
                    <option value="on_hold">Pausiert</option>
                    <option value="cancelled">Abgebrochen</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Budget (€)
                  </label>
                  <input
                    type="number"
                    value={editForm.budget}
                    onChange={(e) => setEditForm({...editForm, budget: parseFloat(e.target.value) || 0})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Startdatum
                  </label>
                  <input
                    type="date"
                    value={editForm.start_date}
                    onChange={(e) => setEditForm({...editForm, start_date: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Enddatum
                  </label>
                  <input
                    type="date"
                    value={editForm.end_date}
                    onChange={(e) => setEditForm({...editForm, end_date: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Adresse
                </label>
                <input
                  type="text"
                  value={editForm.address}
                  onChange={(e) => setEditForm({...editForm, address: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Grundstücksgröße (m²)
                  </label>
                  <input
                    type="number"
                    value={editForm.property_size}
                    onChange={(e) => setEditForm({...editForm, property_size: parseFloat(e.target.value) || 0})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Baufläche (m²)
                  </label>
                  <input
                    type="number"
                    value={editForm.construction_area}
                    onChange={(e) => setEditForm({...editForm, construction_area: parseFloat(e.target.value) || 0})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Beschreibung
                </label>
                <textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent"
                />
              </div>
              
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={editForm.is_public}
                    onChange={(e) => setEditForm({...editForm, is_public: e.target.checked})}
                    className="rounded border-gray-300 text-[#ffbd59] focus:ring-[#ffbd59]"
                  />
                  <span className="text-sm text-gray-700">Öffentlich sichtbar</span>
                </label>
                
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={editForm.allow_quotes}
                    onChange={(e) => setEditForm({...editForm, allow_quotes: e.target.checked})}
                    className="rounded border-gray-300 text-[#ffbd59] focus:ring-[#ffbd59]"
                  />
                  <span className="text-sm text-gray-700">Angebote erlauben</span>
                </label>
              </div>
              
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-[#ffbd59] text-[#3d4952] rounded-lg font-semibold hover:bg-[#ffa726] transition"
                >
                  Speichern
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
} 