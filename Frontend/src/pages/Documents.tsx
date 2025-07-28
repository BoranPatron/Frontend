import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  Download,
  Upload,
  FileText,
  Image,
  File,
  AlertTriangle,
  CheckCircle,
  XCircle,
  MoreHorizontal,
  ArrowLeft,
  PlusCircle,
  RefreshCw,
  Search,
  Filter,
  FolderOpen,
  Calendar,
  User,
  Tag,
  Lock,
  Globe,
  BarChart3,
  Home,
  FileArchive,
  Shield
} from 'lucide-react';
import { getDocuments, uploadDocument, updateDocument, deleteDocument } from '../api/documentService';
import { useAuth } from '../context/AuthContext';
import { getProjects } from '../api/projectService';
import DocumentViewer from '../components/DocumentViewer';
import ProjectBreadcrumb from '../components/ProjectBreadcrumb';
import SmartDocumentClassifier from '../components/SmartDocumentClassifier';
import DocumentWorkflowManager from '../components/DocumentWorkflowManager';
import DocumentVisualizationHub from '../components/DocumentVisualizationHub';

interface Document {
  id: number;
  title: string;
  description: string;
  document_type: 'plan' | 'permit' | 'quote' | 'invoice' | 'contract' | 'photo' | 'other';
  project_id: number;
  uploaded_by: number;
  file_name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  version: number;
  is_latest: boolean;
  tags: string;
  category: string;
  is_public: boolean;
  is_encrypted: boolean;
  created_at: string;
  updated_at: string;
}

interface Project {
  id: number;
  name: string;
}

export default function Documents() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingDocument, setEditingDocument] = useState<Document | null>(null);
  const [viewingDocument, setViewingDocument] = useState<Document | null>(null);
  const [uploading, setUploading] = useState(false);
  const [showSmartClassifier, setShowSmartClassifier] = useState(false);
  const [showWorkflowManager, setShowWorkflowManager] = useState(false);
  const [showVisualizationHub, setShowVisualizationHub] = useState(false);
  const [documentAnalysis, setDocumentAnalysis] = useState<any>(null);
  const [activeWorkflow, setActiveWorkflow] = useState<any>(null);

  // Filtered documents
  const filteredDocuments = documents.filter(document => {
    const matchesSearch = document.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         document.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         document.tags.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || document.document_type === filterType;
    return matchesSearch && matchesType;
  });

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    document_type: 'other' as 'plan' | 'permit' | 'quote' | 'invoice' | 'contract' | 'photo' | 'other',
    tags: '',
    category: '',
    is_public: false,
    file: null as File | null
  });

  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const projectId = urlParams.get('project');
    if (projectId) {
      setSelectedProject(projectId);
    }
    loadProjects();
  }, [location.search]);

  useEffect(() => {
    if (selectedProject !== 'all') {
      loadDocuments();
    }
  }, [selectedProject]);

  const loadDocuments = async () => {
    if (selectedProject === 'all') return;
    
    setLoading(true);
    try {
      const data = await getDocuments(parseInt(selectedProject));
      setDocuments(data);
    } catch (err: any) {
      console.error('Error loading documents:', err);
      setError('Fehler beim Laden der Dokumente');
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  };

  const loadProjects = async () => {
    setProjectsLoading(true);
    try {
      const data = await getProjects();
      setProjects(data);
    } catch (err: any) {
      console.error('Error loading projects:', err);
      setProjects([]);
    } finally {
      setProjectsLoading(false);
    }
  };

  const handleProjectChange = (projectId: string) => {
    setSelectedProject(projectId);
    if (projectId === 'all') {
      setDocuments([]);
    }
  };

  const handleUploadDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.file || selectedProject === 'all') return;

    setUploading(true);
    setError('');

    try {
      // Zeige Smart Classifier für neue Dokumente
      setShowSmartClassifier(true);
      
      const formDataToSend = new FormData();
      formDataToSend.append('project_id', selectedProject);
      formDataToSend.append('title', formData.title);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('document_type', formData.document_type);
      formDataToSend.append('tags', formData.tags);
      formDataToSend.append('category', formData.category);
      formDataToSend.append('is_public', formData.is_public.toString());
      formDataToSend.append('file', formData.file);

      await uploadDocument(formDataToSend);
      setSuccess('Dokument erfolgreich hochgeladen');
      setShowUploadModal(false);
      resetForm();
      loadDocuments();
      
      // Erstelle automatisch Workflow für wichtige Dokumenttypen
      if (['permit', 'contract', 'quote'].includes(formData.document_type)) {
        setShowWorkflowManager(true);
      }
    } catch (err: any) {
      console.error('Error uploading document:', err);
      setError('Fehler beim Hochladen des Dokuments');
    } finally {
      setUploading(false);
    }
  };

  const handleUpdateDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDocument) return;

    try {
      await updateDocument(editingDocument.id, {
        title: formData.title,
        description: formData.description,
        document_type: formData.document_type,
        tags: formData.tags,
        category: formData.category,
        is_public: formData.is_public
      });
      setSuccess('Dokument erfolgreich aktualisiert');
      setShowEditModal(false);
      setEditingDocument(null);
      resetForm();
      loadDocuments();
    } catch (err: any) {
      console.error('Error updating document:', err);
      setError('Fehler beim Aktualisieren des Dokuments');
    }
  };

  const handleDeleteDocument = async (documentId: number) => {
    if (!confirm('Sind Sie sicher, dass Sie dieses Dokument löschen möchten?')) return;

    try {
      await deleteDocument(documentId);
      setSuccess('Dokument erfolgreich gelöscht');
      loadDocuments();
    } catch (err: any) {
      console.error('Error deleting document:', err);
      setError('Fehler beim Löschen des Dokuments');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      document_type: 'other',
      tags: '',
      category: '',
      is_public: false,
      file: null
    });
  };

  const openEditModal = (document: Document) => {
    setEditingDocument(document);
    setFormData({
      title: document.title,
      description: document.description || '',
      document_type: document.document_type,
      tags: document.tags || '',
      category: document.category || '',
      is_public: document.is_public,
      file: null
    });
    setShowEditModal(true);
  };

  const openDocumentViewer = (document: Document) => {
    setViewingDocument(document);
  };

  const closeDocumentViewer = () => {
    setViewingDocument(null);
  };

  const handleAnalysisComplete = (analysis: any) => {
    setDocumentAnalysis(analysis);
    // Automatisch Form-Daten basierend auf KI-Analyse aktualisieren
    setFormData(prev => ({
      ...prev,
      document_type: analysis.suggestedType,
      tags: analysis.suggestedTags.join(', ')
    }));
  };

  const handleWorkflowCreated = (workflow: any) => {
    setActiveWorkflow(workflow);
    console.log('Workflow erstellt:', workflow);
  };

  const handleWorkflowUpdated = (workflow: any) => {
    setActiveWorkflow(workflow);
    console.log('Workflow aktualisiert:', workflow);
  };

  const getDocumentTypeIcon = (type: string) => {
    switch (type) {
      case 'plan': return <FileText size={20} className="text-blue-600" />;
      case 'permit': return <FileText size={20} className="text-green-600" />;
      case 'quote': return <FileText size={20} className="text-purple-600" />;
      case 'invoice': return <FileText size={20} className="text-orange-600" />;
      case 'contract': return <FileText size={20} className="text-red-600" />;
      case 'photo': return <Image size={20} className="text-pink-600" />;
      default: return <File size={20} className="text-gray-600" />;
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

  const getDocumentTypeColor = (type: string) => {
    switch (type) {
      case 'plan': return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'permit': return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'quote': return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      case 'invoice': return 'bg-orange-500/20 text-orange-300 border-orange-500/30';
      case 'contract': return 'bg-red-500/20 text-red-300 border-red-500/30';
      case 'photo': return 'bg-pink-500/20 text-pink-300 border-pink-500/30';
      default: return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (projectsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#51646f] via-[#3d4952] to-[#2c3539] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#ffbd59] mx-auto mb-4"></div>
          <p className="text-white text-lg">Lade Projekte...</p>
        </div>
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#51646f] via-[#3d4952] to-[#2c3539] flex items-center justify-center">
        <div className="text-center">
          <FolderOpen size={48} className="text-[#ffbd59] mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Keine Projekte gefunden</h2>
          <p className="text-gray-300 mb-6">Sie müssen zuerst ein Projekt erstellen, um Dokumente hochladen zu können.</p>
          <button
            onClick={() => navigate('/projects')}
            className="flex items-center gap-2 px-6 py-3 bg-[#ffbd59] text-[#3d4952] font-medium rounded-xl hover:bg-[#ffa726] transition-colors shadow-lg hover:shadow-xl"
          >
            <Plus size={20} />
            Projekt erstellen
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#51646f] via-[#3d4952] to-[#2c3539] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#ffbd59] mx-auto mb-4"></div>
          <p className="text-white text-lg">Lade Dokumente...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#51646f] via-[#3d4952] to-[#2c3539]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <header className="bg-gradient-to-r from-[#3d4952]/95 to-[#51646f]/95 backdrop-blur-lg text-white px-8 py-6 shadow-2xl border-b border-[#ffbd59]/20 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => navigate('/dashboard')}
                className="p-2 bg-[#51646f] hover:bg-[#607583] rounded-xl transition-colors duration-300"
              >
                <ArrowLeft size={20} className="text-[#ffbd59]" />
              </button>
              <div>
                <h1 className="text-3xl font-bold text-[#ffbd59]">BuildWise DMS Pro</h1>
                <p className="text-gray-300">Intelligentes Dokumentenmanagement mit KI-Unterstützung</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowVisualizationHub(!showVisualizationHub)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white font-medium rounded-xl hover:bg-purple-700 transition-colors"
              >
                <Eye size={16} />
                Visualisierung
              </button>
              <button
                onClick={() => setShowUploadModal(true)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#ffbd59] text-[#3d4952] font-medium rounded-xl hover:bg-[#ffa726] transition-colors shadow-lg hover:shadow-xl"
              >
                <Plus size={20} />
                Dokument hochladen
              </button>
            </div>
          </div>
        </header>

        {error && (
          <div className="bg-red-500/20 border border-red-500/30 text-red-300 px-6 py-4 flex items-center justify-between mb-6 rounded-xl backdrop-blur-lg">
            <div className="flex items-center gap-3">
              <AlertTriangle size={20} />
              <span>{error}</span>
            </div>
            <button onClick={() => setError('')} className="text-red-300 hover:text-red-100">
              <XCircle size={20} />
            </button>
          </div>
        )}

        {success && (
          <div className="bg-green-500/20 border border-green-500/30 text-green-300 px-6 py-4 flex items-center justify-between mb-6 rounded-xl backdrop-blur-lg">
            <div className="flex items-center gap-3">
              <CheckCircle size={20} />
              <span>{success}</span>
            </div>
            <button onClick={() => setSuccess('')} className="text-green-300 hover:text-green-100">
              <XCircle size={20} />
            </button>
          </div>
        )}

        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 mb-8">
          <div className="flex items-center gap-4">
            <FolderOpen size={20} className="text-[#ffbd59]" />
            <label className="text-sm font-medium text-white">Projekt auswählen:</label>
            <select
              value={selectedProject}
              onChange={(e) => handleProjectChange(e.target.value)}
              className="flex-1 px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent backdrop-blur-lg"
            >
              <option value="all" className="bg-[#3d4952] text-white">Alle Projekte</option>
              {projects.map(project => (
                <option key={project.id} value={project.id.toString()} className="bg-[#3d4952] text-white">
                  {project.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Dokumente durchsuchen..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent backdrop-blur-lg"
            />
          </div>
          
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="pl-10 pr-8 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent appearance-none cursor-pointer backdrop-blur-lg"
            >
              <option value="all" className="bg-[#3d4952] text-white">Alle Typen</option>
              <option value="plan" className="bg-[#3d4952] text-white">Pläne</option>
              <option value="permit" className="bg-[#3d4952] text-white">Genehmigungen</option>
              <option value="quote" className="bg-[#3d4952] text-white">Angebote</option>
              <option value="invoice" className="bg-[#3d4952] text-white">Rechnungen</option>
              <option value="contract" className="bg-[#3d4952] text-white">Verträge</option>
              <option value="photo" className="bg-[#3d4952] text-white">Fotos</option>
              <option value="other" className="bg-[#3d4952] text-white">Sonstiges</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDocuments.map((document) => (
            <div key={document.id} className="group bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 hover:bg-white/20 transition-all duration-300 transform hover:-translate-y-1">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/10 rounded-xl">
                    {getDocumentTypeIcon(document.document_type)}
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-lg group-hover:text-[#ffbd59] transition-colors">
                      {document.title}
                    </h3>
                    <p className="text-sm text-gray-300">{document.description}</p>
                  </div>
                </div>
                
                <div className="relative">
                  <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                    <MoreHorizontal size={16} className="text-gray-300" />
                  </button>
                  <div className="absolute right-0 top-full mt-2 w-48 bg-[#3d4952] rounded-xl shadow-lg border border-white/20 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-10">
                    <button
                      onClick={() => openDocumentViewer(document)}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/10 transition-colors rounded-t-xl text-white"
                    >
                      <Eye size={16} />
                      <span>Anzeigen</span>
                    </button>
                    <button
                      onClick={() => openEditModal(document)}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/10 transition-colors text-white"
                    >
                      <Edit size={16} />
                      <span>Bearbeiten</span>
                    </button>
                    <button
                      onClick={() => handleDeleteDocument(document.id)}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-red-500/20 text-red-300 transition-colors rounded-b-xl"
                    >
                      <Trash2 size={16} />
                      <span>Löschen</span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-300">Typ</span>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getDocumentTypeColor(document.document_type)}`}>
                    {getDocumentTypeLabel(document.document_type)}
                  </span>
                </div>
                
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <Calendar size={14} className="text-gray-400" />
                    <span className="text-gray-300">Erstellt:</span>
                    <span className="text-white ml-1">
                      {new Date(document.created_at).toLocaleDateString('de-DE')}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <File size={14} className="text-gray-400" />
                    <span className="text-gray-300">Größe:</span>
                    <span className="text-white ml-1">{formatFileSize(document.file_size)}</span>
                  </div>
                </div>
                
                {document.is_public && (
                  <div className="flex items-center gap-2 p-2 bg-green-500/20 border border-green-500/30 rounded-lg">
                    <Globe size={14} className="text-green-300" />
                    <span className="text-sm text-green-300 font-medium">Öffentlich</span>
                  </div>
                )}
              </div>

              {document.tags && (
                <div className="flex flex-wrap gap-2">
                  {document.tags.split(',').map((tag, index) => (
                    <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-white/10 text-white border border-white/20">
                      {tag.trim()}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {filteredDocuments.length === 0 && (
          <div className="text-center py-12">
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 max-w-md mx-auto">
              <FileText size={48} className="text-[#ffbd59] mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">Keine Dokumente gefunden</h3>
              <p className="text-gray-300 mb-6">
                {searchTerm || filterType !== 'all' 
                  ? 'Versuchen Sie andere Suchkriterien oder Filter.'
                  : 'Laden Sie Ihr erstes Dokument hoch, um zu beginnen.'
                }
              </p>
              {!searchTerm && filterType === 'all' && (
                <button
                  onClick={() => setShowUploadModal(true)}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-[#ffbd59] text-[#3d4952] font-medium rounded-xl hover:bg-[#ffa726] transition-colors"
                >
                  <Upload size={20} />
                  Dokument hochladen
                </button>
              )}
            </div>
          </div>
        )}

        {showUploadModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-[#3d4952] rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl border border-white/20">
              <h2 className="text-2xl font-bold text-[#ffbd59] mb-6">Dokument hochladen</h2>
              <form onSubmit={handleUploadDocument} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Titel</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent backdrop-blur-lg"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Beschreibung</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent backdrop-blur-lg"
                    rows={3}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Typ</label>
                  <select
                    value={formData.document_type}
                    onChange={(e) => setFormData({...formData, document_type: e.target.value as any})}
                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent backdrop-blur-lg"
                  >
                    <option value="other" className="bg-[#3d4952] text-white">Sonstiges</option>
                    <option value="plan" className="bg-[#3d4952] text-white">Plan</option>
                    <option value="permit" className="bg-[#3d4952] text-white">Genehmigung</option>
                    <option value="quote" className="bg-[#3d4952] text-white">Angebot</option>
                    <option value="invoice" className="bg-[#3d4952] text-white">Rechnung</option>
                    <option value="contract" className="bg-[#3d4952] text-white">Vertrag</option>
                    <option value="photo" className="bg-[#3d4952] text-white">Foto</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Datei</label>
                  <input
                    type="file"
                    onChange={(e) => setFormData({...formData, file: e.target.files?.[0] || null})}
                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent backdrop-blur-lg"
                    required
                  />
                </div>
                
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="is_public"
                    checked={formData.is_public}
                    onChange={(e) => setFormData({...formData, is_public: e.target.checked})}
                    className="rounded border-white/20 text-[#ffbd59] focus:ring-[#ffbd59] bg-white/10"
                  />
                  <label htmlFor="is_public" className="text-sm text-white">Öffentlich sichtbar</label>
                </div>
                
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowUploadModal(false);
                      resetForm();
                    }}
                    className="flex-1 px-4 py-2 border border-white/20 text-white rounded-xl hover:bg-white/10 transition-colors"
                  >
                    Abbrechen
                  </button>
                  <button
                    type="submit"
                    disabled={uploading}
                    className="flex-1 px-4 py-2 bg-[#ffbd59] text-[#3d4952] rounded-xl hover:bg-[#ffa726] transition-colors disabled:opacity-50"
                  >
                    {uploading ? 'Wird hochgeladen...' : 'Hochladen'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showEditModal && editingDocument && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-[#3d4952] rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl border border-white/20">
              <h2 className="text-2xl font-bold text-[#ffbd59] mb-6">Dokument bearbeiten</h2>
              <form onSubmit={handleUpdateDocument} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Titel</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent backdrop-blur-lg"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Beschreibung</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent backdrop-blur-lg"
                    rows={3}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Typ</label>
                  <select
                    value={formData.document_type}
                    onChange={(e) => setFormData({...formData, document_type: e.target.value as any})}
                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent backdrop-blur-lg"
                  >
                    <option value="other" className="bg-[#3d4952] text-white">Sonstiges</option>
                    <option value="plan" className="bg-[#3d4952] text-white">Plan</option>
                    <option value="permit" className="bg-[#3d4952] text-white">Genehmigung</option>
                    <option value="quote" className="bg-[#3d4952] text-white">Angebot</option>
                    <option value="invoice" className="bg-[#3d4952] text-white">Rechnung</option>
                    <option value="contract" className="bg-[#3d4952] text-white">Vertrag</option>
                    <option value="photo" className="bg-[#3d4952] text-white">Foto</option>
                  </select>
                </div>
                
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="edit_is_public"
                    checked={formData.is_public}
                    onChange={(e) => setFormData({...formData, is_public: e.target.checked})}
                    className="rounded border-white/20 text-[#ffbd59] focus:ring-[#ffbd59] bg-white/10"
                  />
                  <label htmlFor="edit_is_public" className="text-sm text-white">Öffentlich sichtbar</label>
                </div>
                
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false);
                      setEditingDocument(null);
                      resetForm();
                    }}
                    className="flex-1 px-4 py-2 border border-white/20 text-white rounded-xl hover:bg-white/10 transition-colors"
                  >
                    Abbrechen
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-[#ffbd59] text-[#3d4952] rounded-xl hover:bg-[#ffa726] transition-colors"
                  >
                    Speichern
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showSmartClassifier && formData.file && (
          <div className="mb-8">
            <SmartDocumentClassifier
              file={formData.file}
              onAnalysisComplete={handleAnalysisComplete}
              onManualOverride={() => setShowSmartClassifier(false)}
            />
          </div>
        )}

        {showWorkflowManager && documentAnalysis && (
          <div className="mb-8">
            <DocumentWorkflowManager
              documentType={documentAnalysis.suggestedType}
              projectPhase="planning"
              documentId={Date.now()}
              onWorkflowCreated={handleWorkflowCreated}
              onWorkflowUpdated={handleWorkflowUpdated}
            />
          </div>
        )}

        {showVisualizationHub && (
          <div className="mb-8">
            <DocumentVisualizationHub
              documents={documents.map(doc => ({
                id: doc.id.toString(),
                type: doc.document_type as any,
                title: doc.title,
                description: doc.description,
                thumbnail: '',
                data: {},
                metadata: {
                  projectPhase: 'planning',
                  uploadDate: doc.created_at,
                  fileSize: doc.file_size,
                  tags: doc.tags ? doc.tags.split(',').map(t => t.trim()) : [],
                  status: doc.is_public ? 'approved' : 'pending',
                  version: doc.version,
                  uploadedBy: 'User'
                }
              }))}
              selectedProject={selectedProject}
              onDocumentSelect={(doc) => console.log('Document selected:', doc)}
              onViewModeChange={(mode) => console.log('View mode changed:', mode)}
            />
          </div>
        )}

        <DocumentViewer
          document={viewingDocument}
          isOpen={!!viewingDocument}
          onClose={closeDocumentViewer}
        />
      </div>
    </div>
  );
} 