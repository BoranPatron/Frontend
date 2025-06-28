import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  BarChart3
} from 'lucide-react';
import { getDocuments, uploadDocument, updateDocument, deleteDocument } from '../api/documentService';
import { useAuth } from '../context/AuthContext';

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

export default function Documents() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingDocument, setEditingDocument] = useState<Document | null>(null);
  const [deletingDocument, setDeletingDocument] = useState<number | null>(null);
  const [selectedProject, setSelectedProject] = useState<number>(1); // Default project

  // Form state für neues/bearbeitetes Dokument
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    document_type: 'other' as 'plan' | 'permit' | 'quote' | 'invoice' | 'contract' | 'photo' | 'other',
    tags: '',
    category: '',
    is_public: false
  });

  const [uploadFile, setUploadFile] = useState<File | null>(null);

  // Lade Dokumente beim Mounten
  useEffect(() => {
    loadDocuments();
  }, [selectedProject]);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const data = await getDocuments(selectedProject);
      setDocuments(data);
      setError('');
    } catch (err: any) {
      setError('Fehler beim Laden der Dokumente: ' + (err.response?.data?.detail || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleUploadDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) {
      setError('Bitte wählen Sie eine Datei aus.');
      return;
    }

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('file', uploadFile);
      formDataToSend.append('project_id', selectedProject.toString());
      formDataToSend.append('title', formData.title);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('document_type', formData.document_type);
      formDataToSend.append('tags', formData.tags);
      formDataToSend.append('category', formData.category);
      formDataToSend.append('is_public', formData.is_public.toString());
      
      await uploadDocument(formDataToSend);
      setShowUploadModal(false);
      resetForm();
      loadDocuments();
    } catch (err: any) {
      setError('Fehler beim Hochladen des Dokuments: ' + (err.response?.data?.detail || err.message));
    }
  };

  const handleUpdateDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDocument) return;
    
    try {
      const documentData = {
        title: formData.title,
        description: formData.description,
        document_type: formData.document_type,
        tags: formData.tags,
        category: formData.category,
        is_public: formData.is_public
      };
      
      await updateDocument(editingDocument.id, documentData);
      setShowEditModal(false);
      setEditingDocument(null);
      resetForm();
      loadDocuments();
    } catch (err: any) {
      setError('Fehler beim Aktualisieren des Dokuments: ' + (err.response?.data?.detail || err.message));
    }
  };

  const handleDeleteDocument = async (documentId: number) => {
    try {
      await deleteDocument(documentId);
      setDeletingDocument(null);
      loadDocuments();
    } catch (err: any) {
      setError('Fehler beim Löschen des Dokuments: ' + (err.response?.data?.detail || err.message));
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      document_type: 'other',
      tags: '',
      category: '',
      is_public: false
    });
    setUploadFile(null);
  };

  const openEditModal = (document: Document) => {
    setEditingDocument(document);
    setFormData({
      title: document.title,
      description: document.description || '',
      document_type: document.document_type as 'plan' | 'permit' | 'quote' | 'invoice' | 'contract' | 'photo' | 'other',
      tags: document.tags || '',
      category: document.category || '',
      is_public: document.is_public
    });
    setShowEditModal(true);
  };

  // Filtere und suche Dokumente
  const filteredDocuments = documents.filter(document => {
    const matchesSearch = document.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         document.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         document.file_name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterType === 'all' || document.document_type === filterType;
    
    return matchesSearch && matchesFilter;
  });

  const getDocumentTypeIcon = (type: string) => {
    switch (type) {
      case 'plan': return <FileText size={20} />;
      case 'permit': return <File size={20} />;
      case 'quote': return <FileText size={20} />;
      case 'invoice': return <FileText size={20} />;
      case 'contract': return <FileText size={20} />;
      case 'photo': return <Image size={20} />;
      case 'other': return <File size={20} />;
      default: return <File size={20} />;
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
      case 'other': return 'Sonstiges';
      default: return type;
    }
  };

  const getDocumentTypeColor = (type: string) => {
    switch (type) {
      case 'plan': return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'permit': return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'quote': return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      case 'invoice': return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      case 'contract': return 'bg-orange-500/20 text-orange-300 border-orange-500/30';
      case 'photo': return 'bg-pink-500/20 text-pink-300 border-pink-500/30';
      case 'other': return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#51646f] via-[#3d4952] to-[#2c3539] flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 text-[#ffbd59] animate-spin mx-auto mb-4" />
          <p className="text-white text-lg">Lade Dokumente...</p>
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
              <h1 className="text-3xl font-bold text-[#ffbd59]">Dokumente</h1>
              <p className="text-gray-300">Verwalten Sie Ihre Projektdokumente</p>
            </div>
          </div>
          <button
            onClick={() => setShowUploadModal(true)}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#ffbd59] to-[#ffa726] text-[#3d4952] rounded-xl hover:from-[#ffa726] hover:to-[#ff9800] transition-all duration-300 transform hover:scale-105 shadow-lg font-semibold"
          >
            <PlusCircle size={20} />
            Dokument hochladen
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
                placeholder="Dokumente durchsuchen..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent"
              />
            </div>
            
            {/* Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="pl-10 pr-8 py-3 bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent appearance-none cursor-pointer"
              >
                <option value="all">Alle Typen</option>
                <option value="plan">Pläne</option>
                <option value="permit">Genehmigungen</option>
                <option value="quote">Angebote</option>
                <option value="invoice">Rechnungen</option>
                <option value="contract">Verträge</option>
                <option value="photo">Fotos</option>
                <option value="other">Sonstiges</option>
              </select>
            </div>
          </div>

          {/* Documents Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDocuments.map((document) => (
              <div key={document.id} className="group bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-300 transform hover:-translate-y-2 hover:shadow-2xl">
                {/* Document Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-br from-[#ffbd59] to-[#ffa726] rounded-xl">
                      {getDocumentTypeIcon(document.document_type)}
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-lg group-hover:text-[#ffbd59] transition-colors">
                        {document.title}
                      </h3>
                      <p className="text-sm text-gray-400">
                        {getDocumentTypeLabel(document.document_type)}
                      </p>
                    </div>
                  </div>
                  
                  {/* Actions Menu */}
                  <div className="relative">
                    <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                      <MoreHorizontal size={16} className="text-gray-400" />
                    </button>
                    <div className="absolute right-0 top-full mt-2 w-48 bg-[#3d4952] rounded-xl shadow-2xl border border-white/20 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-10">
                      <button
                        onClick={() => window.open(`/api/documents/${document.id}/download`, '_blank')}
                        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/10 transition-colors rounded-t-xl"
                      >
                        <Download size={16} />
                        <span>Herunterladen</span>
                      </button>
                      <button
                        onClick={() => openEditModal(document)}
                        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/10 transition-colors"
                      >
                        <Edit size={16} />
                        <span>Bearbeiten</span>
                      </button>
                      <button
                        onClick={() => setDeletingDocument(document.id)}
                        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-red-500/20 text-red-300 transition-colors rounded-b-xl"
                      >
                        <Trash2 size={16} />
                        <span>Löschen</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Document Description */}
                <p className="text-gray-300 text-sm mb-4 line-clamp-2">
                  {document.description || 'Keine Beschreibung verfügbar'}
                </p>

                {/* Document Details */}
                <div className="space-y-3 mb-4">
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <File size={14} />
                    <span>{document.file_name}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <BarChart3 size={14} />
                    <span>{formatFileSize(document.file_size)}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <Calendar size={14} />
                    <span>{new Date(document.created_at).toLocaleDateString('de-DE')}</span>
                  </div>

                  {document.tags && (
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <Tag size={14} />
                      <span>{document.tags}</span>
                    </div>
                  )}
                </div>

                {/* Status Badges */}
                <div className="flex flex-wrap gap-2 mb-4">
                  <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium backdrop-blur-md border ${getDocumentTypeColor(document.document_type)}`}>
                    {getDocumentTypeLabel(document.document_type)}
                  </div>
                  
                  {document.is_public ? (
                    <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-300 border border-green-500/30">
                      <Globe size={10} />
                      <span>Öffentlich</span>
                    </div>
                  ) : (
                    <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-500/20 text-gray-300 border border-gray-500/30">
                      <Lock size={10} />
                      <span>Privat</span>
                    </div>
                  )}
                </div>

                {/* Version Info */}
                {document.version > 1 && (
                  <div className="text-xs text-gray-400">
                    Version {document.version}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Empty State */}
          {filteredDocuments.length === 0 && !loading && (
            <div className="text-center py-16">
              <div className="w-24 h-24 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <FolderOpen size={40} className="text-[#ffbd59]" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Keine Dokumente gefunden</h3>
              <p className="text-gray-400 mb-6">
                {searchTerm || filterType !== 'all' 
                  ? 'Versuchen Sie andere Suchkriterien oder Filter.'
                  : 'Laden Sie Ihr erstes Dokument hoch, um loszulegen.'
                }
              </p>
              {!searchTerm && filterType === 'all' && (
                <button
                  onClick={() => setShowUploadModal(true)}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#ffbd59] to-[#ffa726] text-[#3d4952] rounded-xl hover:from-[#ffa726] hover:to-[#ff9800] transition-all duration-300 transform hover:scale-105 shadow-lg font-semibold mx-auto"
                >
                  <PlusCircle size={20} />
                  Erstes Dokument hochladen
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Upload Document Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#3d4952] rounded-2xl p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">Dokument hochladen</h2>
              <button
                onClick={() => setShowUploadModal(false)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <XCircle size={24} className="text-gray-400" />
              </button>
            </div>
            
            <form onSubmit={handleUploadDocument} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Dokumenttitel *</label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent"
                    placeholder="z.B. Bauantrag"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Dokumenttyp *</label>
                  <select
                    required
                    value={formData.document_type}
                    onChange={(e) => setFormData({...formData, document_type: e.target.value as any})}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent"
                  >
                    <option value="plan">Plan</option>
                    <option value="permit">Genehmigung</option>
                    <option value="quote">Angebot</option>
                    <option value="invoice">Rechnung</option>
                    <option value="contract">Vertrag</option>
                    <option value="photo">Foto</option>
                    <option value="other">Sonstiges</option>
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
                  placeholder="Beschreiben Sie das Dokument..."
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Tags</label>
                  <input
                    type="text"
                    value={formData.tags}
                    onChange={(e) => setFormData({...formData, tags: e.target.value})}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent"
                    placeholder="Komma-getrennte Tags"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Kategorie</label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent"
                    placeholder="z.B. Genehmigungen"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Datei auswählen *</label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-white/20 border-dashed rounded-xl hover:border-[#ffbd59]/50 transition-colors">
                  <div className="space-y-1 text-center">
                    <Upload className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="flex text-sm text-gray-400">
                      <label htmlFor="file-upload" className="relative cursor-pointer bg-transparent rounded-md font-medium text-[#ffbd59] hover:text-[#ffa726] focus-within:outline-none">
                        <span>Datei hochladen</span>
                        <input
                          id="file-upload"
                          name="file-upload"
                          type="file"
                          className="sr-only"
                          onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                          required
                        />
                      </label>
                      <p className="pl-1">oder per Drag & Drop</p>
                    </div>
                    <p className="text-xs text-gray-500">
                      PDF, DOC, XLS, JPG, PNG bis 10MB
                    </p>
                  </div>
                </div>
                {uploadFile && (
                  <p className="mt-2 text-sm text-gray-300">
                    Ausgewählte Datei: {uploadFile.name}
                  </p>
                )}
              </div>
              
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="is_public"
                  checked={formData.is_public}
                  onChange={(e) => setFormData({...formData, is_public: e.target.checked})}
                  className="w-4 h-4 text-[#ffbd59] bg-white/10 border-white/20 rounded focus:ring-[#ffbd59] focus:ring-2"
                />
                <label htmlFor="is_public" className="text-sm text-gray-300">
                  Dokument öffentlich machen (für Dienstleister sichtbar)
                </label>
              </div>
              
              <div className="flex gap-4 pt-6">
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-[#ffbd59] to-[#ffa726] text-[#3d4952] font-bold py-3 rounded-xl hover:from-[#ffa726] hover:to-[#ff9800] transition-all duration-300 transform hover:scale-105"
                >
                  Dokument hochladen
                </button>
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="flex-1 bg-white/10 text-white font-bold py-3 rounded-xl hover:bg-white/20 transition-all duration-300"
                >
                  Abbrechen
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Document Modal */}
      {showEditModal && editingDocument && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#3d4952] rounded-2xl p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">Dokument bearbeiten</h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <XCircle size={24} className="text-gray-400" />
              </button>
            </div>
            
            <form onSubmit={handleUpdateDocument} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Dokumenttitel *</label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Dokumenttyp *</label>
                  <select
                    required
                    value={formData.document_type}
                    onChange={(e) => setFormData({...formData, document_type: e.target.value as any})}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent"
                  >
                    <option value="plan">Plan</option>
                    <option value="permit">Genehmigung</option>
                    <option value="quote">Angebot</option>
                    <option value="invoice">Rechnung</option>
                    <option value="contract">Vertrag</option>
                    <option value="photo">Foto</option>
                    <option value="other">Sonstiges</option>
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
                  <label className="block text-sm font-medium text-gray-300 mb-2">Tags</label>
                  <input
                    type="text"
                    value={formData.tags}
                    onChange={(e) => setFormData({...formData, tags: e.target.value})}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Kategorie</label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent"
                  />
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="edit_is_public"
                  checked={formData.is_public}
                  onChange={(e) => setFormData({...formData, is_public: e.target.checked})}
                  className="w-4 h-4 text-[#ffbd59] bg-white/10 border-white/20 rounded focus:ring-[#ffbd59] focus:ring-2"
                />
                <label htmlFor="edit_is_public" className="text-sm text-gray-300">
                  Dokument öffentlich machen (für Dienstleister sichtbar)
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
      {deletingDocument && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#3d4952] rounded-2xl p-8 w-full max-w-md">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Trash2 size={32} className="text-red-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Dokument löschen</h3>
              <p className="text-gray-400 mb-6">
                Sind Sie sicher, dass Sie dieses Dokument löschen möchten? Diese Aktion kann nicht rückgängig gemacht werden.
              </p>
              <div className="flex gap-4">
                <button
                  onClick={() => handleDeleteDocument(deletingDocument)}
                  className="flex-1 bg-red-500 text-white font-bold py-3 rounded-xl hover:bg-red-600 transition-all duration-300"
                >
                  Löschen
                </button>
                <button
                  onClick={() => setDeletingDocument(null)}
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