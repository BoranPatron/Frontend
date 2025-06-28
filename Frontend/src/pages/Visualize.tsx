import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Eye,
  Plus,
  Edit,
  Trash2,
  AlertTriangle,
  CheckCircle,
  XCircle,
  ArrowLeft,
  PlusCircle,
  RefreshCw,
  Search,
  Filter,
  BarChart3,
  Calendar,
  User,
  Tag,
  Lock,
  Globe,
  Camera,
  Image,
  FileText,
  Upload,
  Download,
  MoreHorizontal,
  FolderOpen,
  MapPin,
  Building,
  Home,
  Trees,
  Car,
  Box,
  Palette,
  X,
  Grid3X3,
  Layers,
  ZoomIn,
  ZoomOut,
  RotateCcw
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface Visualization {
  id: number;
  title: string;
  description: string;
  type: 'plan' | 'photo' | '3d_model' | 'rendering' | 'sketch' | 'other';
  project_id: number;
  uploaded_by: number;
  file_path: string;
  file_size: number;
  thumbnail_path?: string;
  tags: string;
  category: string;
  is_public: boolean;
  view_count: number;
  created_at: string;
  updated_at: string;
}

export default function Visualize() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [visualizations, setVisualizations] = useState<Visualization[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [editingVisualization, setEditingVisualization] = useState<Visualization | null>(null);
  const [deletingVisualization, setDeletingVisualization] = useState<number | null>(null);
  const [selectedProject, setSelectedProject] = useState<number>(1);
  const [selectedVisualization, setSelectedVisualization] = useState<Visualization | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Form state für neue/bearbeitete Visualisierung
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'other' as 'plan' | 'photo' | '3d_model' | 'rendering' | 'sketch' | 'other',
    tags: '',
    category: '',
    is_public: false
  });

  const [uploadFile, setUploadFile] = useState<File | null>(null);

  // Mock-Daten für Demo
  useEffect(() => {
    loadVisualizations();
  }, [selectedProject]);

  const loadVisualizations = async () => {
    try {
      setLoading(true);
      // Mock-Daten für Demo
      const mockVisualizations: Visualization[] = [
        {
          id: 1,
          title: 'Grundriss Erdgeschoss',
          description: 'Architektonischer Grundriss des Erdgeschosses mit Raumaufteilung',
          type: 'plan',
          project_id: 1,
          uploaded_by: 1,
          file_path: '/uploads/plans/ground_floor_plan.pdf',
          file_size: 2048576,
          thumbnail_path: '/uploads/thumbnails/ground_floor_thumb.jpg',
          tags: 'grundriss, erdgeschoss, architektur',
          category: 'Pläne',
          is_public: true,
          view_count: 45,
          created_at: '2024-01-10T10:30:00Z',
          updated_at: '2024-01-10T10:30:00Z'
        },
        {
          id: 2,
          title: 'Baustellenfoto - Fundament',
          description: 'Aktueller Baufortschritt: Fertiggestelltes Fundament',
          type: 'photo',
          project_id: 1,
          uploaded_by: 1,
          file_path: '/uploads/photos/foundation_photo.jpg',
          file_size: 3145728,
          thumbnail_path: '/uploads/thumbnails/foundation_thumb.jpg',
          tags: 'baustelle, fundament, fortschritt',
          category: 'Baustellenfotos',
          is_public: true,
          view_count: 23,
          created_at: '2024-01-15T14:20:00Z',
          updated_at: '2024-01-15T14:20:00Z'
        },
        {
          id: 3,
          title: '3D-Rendering Außenansicht',
          description: 'Fotorealistisches 3D-Rendering der fertigen Außenansicht',
          type: 'rendering',
          project_id: 1,
          uploaded_by: 1,
          file_path: '/uploads/renderings/exterior_rendering.jpg',
          file_size: 5242880,
          thumbnail_path: '/uploads/thumbnails/exterior_thumb.jpg',
          tags: '3d, rendering, außenansicht, fertigstellung',
          category: 'Visualisierungen',
          is_public: true,
          view_count: 67,
          created_at: '2024-01-08T09:15:00Z',
          updated_at: '2024-01-08T09:15:00Z'
        },
        {
          id: 4,
          title: 'Schnitt A-A',
          description: 'Architektonischer Schnitt durch das Gebäude',
          type: 'plan',
          project_id: 1,
          uploaded_by: 1,
          file_path: '/uploads/plans/section_a_a.pdf',
          file_size: 1572864,
          thumbnail_path: '/uploads/thumbnails/section_thumb.jpg',
          tags: 'schnitt, architektur, konstruktion',
          category: 'Pläne',
          is_public: false,
          view_count: 12,
          created_at: '2024-01-12T11:45:00Z',
          updated_at: '2024-01-12T11:45:00Z'
        },
        {
          id: 5,
          title: 'Innenraum-Skizze',
          description: 'Handskizze des Wohnzimmers mit Möblierung',
          type: 'sketch',
          project_id: 1,
          uploaded_by: 1,
          file_path: '/uploads/sketches/living_room_sketch.jpg',
          file_size: 1048576,
          thumbnail_path: '/uploads/thumbnails/sketch_thumb.jpg',
          tags: 'skizze, innenraum, wohnzimmer',
          category: 'Skizzen',
          is_public: true,
          view_count: 18,
          created_at: '2024-01-14T16:30:00Z',
          updated_at: '2024-01-14T16:30:00Z'
        },
        {
          id: 6,
          title: 'Baustellenfoto - Rohbau',
          description: 'Rohbauphase: Wände und Decken sind erstellt',
          type: 'photo',
          project_id: 1,
          uploaded_by: 1,
          file_path: '/uploads/photos/shell_construction.jpg',
          file_size: 4194304,
          thumbnail_path: '/uploads/thumbnails/shell_thumb.jpg',
          tags: 'baustelle, rohbau, fortschritt',
          category: 'Baustellenfotos',
          is_public: true,
          view_count: 34,
          created_at: '2024-01-20T13:15:00Z',
          updated_at: '2024-01-20T13:15:00Z'
        }
      ];

      setVisualizations(mockVisualizations);
      setError('');
    } catch (err: any) {
      setError('Fehler beim Laden der Visualisierungen: ' + (err.response?.data?.detail || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleUploadVisualization = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) {
      setError('Bitte wählen Sie eine Datei aus.');
      return;
    }

    try {
      const newVisualization: Visualization = {
        id: Date.now(),
        title: formData.title,
        description: formData.description,
        type: formData.type,
        project_id: selectedProject,
        uploaded_by: user?.id || 1,
        file_path: `/uploads/${formData.type}s/${uploadFile.name}`,
        file_size: uploadFile.size,
        thumbnail_path: `/uploads/thumbnails/${uploadFile.name.replace(/\.[^/.]+$/, '_thumb.jpg')}`,
        tags: formData.tags,
        category: formData.category,
        is_public: formData.is_public,
        view_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      setVisualizations([...visualizations, newVisualization]);
      setShowUploadModal(false);
      resetForm();
    } catch (err: any) {
      setError('Fehler beim Hochladen der Visualisierung: ' + (err.response?.data?.detail || err.message));
    }
  };

  const handleUpdateVisualization = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingVisualization) return;
    
    try {
      const updatedVisualizations = visualizations.map(viz => 
        viz.id === editingVisualization.id 
          ? {
              ...viz,
              title: formData.title,
              description: formData.description,
              type: formData.type,
              tags: formData.tags,
              category: formData.category,
              is_public: formData.is_public,
              updated_at: new Date().toISOString()
            }
          : viz
      );

      setVisualizations(updatedVisualizations);
      setShowUploadModal(false);
      setEditingVisualization(null);
      resetForm();
    } catch (err: any) {
      setError('Fehler beim Aktualisieren der Visualisierung: ' + (err.response?.data?.detail || err.message));
    }
  };

  const handleDeleteVisualization = async (visualizationId: number) => {
    try {
      const updatedVisualizations = visualizations.filter(viz => viz.id !== visualizationId);
      setVisualizations(updatedVisualizations);
      setDeletingVisualization(null);
    } catch (err: any) {
      setError('Fehler beim Löschen der Visualisierung: ' + (err.response?.data?.detail || err.message));
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      type: 'other',
      tags: '',
      category: '',
      is_public: false
    });
    setUploadFile(null);
  };

  const openEditModal = (visualization: Visualization) => {
    setEditingVisualization(visualization);
    setFormData({
      title: visualization.title,
      description: visualization.description,
      type: visualization.type,
      tags: visualization.tags,
      category: visualization.category,
      is_public: visualization.is_public
    });
    setShowUploadModal(true);
  };

  const openVisualization = (visualization: Visualization) => {
    setSelectedVisualization(visualization);
  };

  // Filtere und suche Visualisierungen
  const filteredVisualizations = visualizations.filter(visualization => {
    const matchesSearch = visualization.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         visualization.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         visualization.tags.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterType === 'all' || visualization.type === filterType;
    
    return matchesSearch && matchesFilter;
  });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'plan': return <FileText size={20} />;
      case 'photo': return <Camera size={20} />;
      case '3d_model': return <Box size={20} />;
      case 'rendering': return <Eye size={20} />;
      case 'sketch': return <Palette size={20} />;
      case 'other': return <Image size={20} />;
      default: return <Image size={20} />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'plan': return 'Plan';
      case 'photo': return 'Foto';
      case '3d_model': return '3D-Modell';
      case 'rendering': return 'Rendering';
      case 'sketch': return 'Skizze';
      case 'other': return 'Sonstiges';
      default: return type;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'plan': return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'photo': return 'bg-green-500/20 text-green-300 border-green-500/30';
      case '3d_model': return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      case 'rendering': return 'bg-orange-500/20 text-orange-300 border-orange-500/30';
      case 'sketch': return 'bg-pink-500/20 text-pink-300 border-pink-500/30';
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
          <p className="text-white text-lg">Lade Visualisierungen...</p>
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
              <h1 className="text-3xl font-bold text-[#ffbd59]">Visualisierungen</h1>
              <p className="text-gray-300">Pläne, Fotos & Visualisierungen</p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="flex bg-white/10 rounded-xl p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-[#ffbd59] text-[#3d4952]' : 'text-gray-400 hover:text-white'}`}
              >
                <Grid3X3 size={20} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-[#ffbd59] text-[#3d4952]' : 'text-gray-400 hover:text-white'}`}
              >
                <Layers size={20} />
              </button>
            </div>
            <button
              onClick={() => setShowUploadModal(true)}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#ffbd59] to-[#ffa726] text-[#3d4952] rounded-xl hover:from-[#ffa726] hover:to-[#ff9800] transition-all duration-300 transform hover:scale-105 shadow-lg font-semibold"
            >
              <PlusCircle size={20} />
              Hochladen
            </button>
          </div>
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

      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl">
                  <Image size={24} className="text-white" />
                </div>
                <span className="text-sm text-gray-400">Gesamt</span>
              </div>
              <h3 className="text-2xl font-bold text-white mb-1">{visualizations.length}</h3>
              <p className="text-sm text-gray-400">Visualisierungen</p>
            </div>

            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gradient-to-br from-green-400 to-green-600 rounded-xl">
                  <Camera size={24} className="text-white" />
                </div>
                <span className="text-sm text-gray-400">Fotos</span>
              </div>
              <h3 className="text-2xl font-bold text-white mb-1">
                {visualizations.filter(v => v.type === 'photo').length}
              </h3>
              <p className="text-sm text-gray-400">Baustellenfotos</p>
            </div>

            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gradient-to-br from-purple-400 to-purple-600 rounded-xl">
                  <FileText size={24} className="text-white" />
                </div>
                <span className="text-sm text-gray-400">Pläne</span>
              </div>
              <h3 className="text-2xl font-bold text-white mb-1">
                {visualizations.filter(v => v.type === 'plan').length}
              </h3>
              <p className="text-sm text-gray-400">Architekturpläne</p>
            </div>

            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gradient-to-br from-orange-400 to-orange-600 rounded-xl">
                  <Eye size={24} className="text-white" />
                </div>
                <span className="text-sm text-gray-400">Aufrufe</span>
              </div>
              <h3 className="text-2xl font-bold text-white mb-1">
                {visualizations.reduce((sum, v) => sum + v.view_count, 0)}
              </h3>
              <p className="text-sm text-gray-400">Gesamtaufrufe</p>
            </div>
          </div>

          {/* Search and Filter */}
          <div className="flex flex-col md:flex-row gap-4 mb-8">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Visualisierungen durchsuchen..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent"
              />
            </div>
            
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="pl-10 pr-8 py-3 bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent appearance-none cursor-pointer"
              >
                <option value="all">Alle Typen</option>
                <option value="plan">Pläne</option>
                <option value="photo">Fotos</option>
                <option value="3d_model">3D-Modelle</option>
                <option value="rendering">Renderings</option>
                <option value="sketch">Skizzen</option>
                <option value="other">Sonstiges</option>
              </select>
            </div>
          </div>

          {/* Visualizations Grid/List */}
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredVisualizations.map((visualization) => (
                <div key={visualization.id} className="group bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 hover:bg-white/15 transition-all duration-300 transform hover:-translate-y-2 hover:shadow-2xl overflow-hidden">
                  {/* Thumbnail */}
                  <div className="relative aspect-video bg-gradient-to-br from-gray-800 to-gray-900 overflow-hidden">
                    <div className="absolute inset-0 flex items-center justify-center">
                      {getTypeIcon(visualization.type)}
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="absolute bottom-3 left-3 right-3 flex gap-2">
                        <button
                          onClick={() => openVisualization(visualization)}
                          className="p-2 bg-white/20 backdrop-blur-sm rounded-lg hover:bg-white/30 transition-colors"
                        >
                          <ZoomIn size={16} className="text-white" />
                        </button>
                        <button
                          onClick={() => openEditModal(visualization)}
                          className="p-2 bg-white/20 backdrop-blur-sm rounded-lg hover:bg-white/30 transition-colors"
                        >
                          <Edit size={16} className="text-white" />
                        </button>
                        <button
                          onClick={() => setDeletingVisualization(visualization.id)}
                          className="p-2 bg-red-500/20 backdrop-blur-sm rounded-lg hover:bg-red-500/30 transition-colors"
                        >
                          <Trash2 size={16} className="text-red-400" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-bold text-white text-sm group-hover:text-[#ffbd59] transition-colors line-clamp-1">
                        {visualization.title}
                      </h3>
                      <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium backdrop-blur-md border ${getTypeColor(visualization.type)}`}>
                        {getTypeLabel(visualization.type)}
                      </div>
                    </div>
                    
                    <p className="text-gray-400 text-xs mb-3 line-clamp-2">
                      {visualization.description}
                    </p>

                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <Eye size={12} />
                        <span>{visualization.view_count}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar size={12} />
                        <span>{new Date(visualization.created_at).toLocaleDateString('de-DE')}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredVisualizations.map((visualization) => (
                <div key={visualization.id} className="group bg-white/10 backdrop-blur-lg rounded-2xl p-4 border border-white/20 hover:bg-white/15 transition-all duration-300">
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-20 bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl flex items-center justify-center flex-shrink-0">
                      {getTypeIcon(visualization.type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-bold text-white group-hover:text-[#ffbd59] transition-colors">
                          {visualization.title}
                        </h3>
                        <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium backdrop-blur-md border ${getTypeColor(visualization.type)}`}>
                          {getTypeLabel(visualization.type)}
                        </div>
                      </div>
                      
                      <p className="text-gray-400 text-sm mb-2">
                        {visualization.description}
                      </p>
                      
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <Eye size={12} />
                          <span>{visualization.view_count} Aufrufe</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar size={12} />
                          <span>{new Date(visualization.created_at).toLocaleDateString('de-DE')}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <BarChart3 size={12} />
                          <span>{formatFileSize(visualization.file_size)}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => openVisualization(visualization)}
                        className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                      >
                        <ZoomIn size={16} className="text-gray-400" />
                      </button>
                      <button
                        onClick={() => openEditModal(visualization)}
                        className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                      >
                        <Edit size={16} className="text-gray-400" />
                      </button>
                      <button
                        onClick={() => setDeletingVisualization(visualization.id)}
                        className="p-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg transition-colors"
                      >
                        <Trash2 size={16} className="text-red-400" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty State */}
          {filteredVisualizations.length === 0 && !loading && (
            <div className="text-center py-16">
              <div className="w-24 h-24 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Eye size={40} className="text-[#ffbd59]" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Keine Visualisierungen gefunden</h3>
              <p className="text-gray-400 mb-6">
                {searchTerm || filterType !== 'all' 
                  ? 'Versuchen Sie andere Suchkriterien oder Filter.'
                  : 'Laden Sie Ihre erste Visualisierung hoch, um loszulegen.'
                }
              </p>
              {!searchTerm && filterType === 'all' && (
                <button
                  onClick={() => setShowUploadModal(true)}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#ffbd59] to-[#ffa726] text-[#3d4952] rounded-xl hover:from-[#ffa726] hover:to-[#ff9800] transition-all duration-300 transform hover:scale-105 shadow-lg font-semibold mx-auto"
                >
                  <PlusCircle size={20} />
                  Erste Visualisierung hochladen
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#3d4952] rounded-2xl p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">
                {editingVisualization ? 'Visualisierung bearbeiten' : 'Visualisierung hochladen'}
              </h2>
              <button
                onClick={() => {
                  setShowUploadModal(false);
                  setEditingVisualization(null);
                  resetForm();
                }}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <XCircle size={24} className="text-gray-400" />
              </button>
            </div>
            
            <form onSubmit={editingVisualization ? handleUpdateVisualization : handleUploadVisualization} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Titel *</label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent"
                    placeholder="z.B. Grundriss Erdgeschoss"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Typ *</label>
                  <select
                    required
                    value={formData.type}
                    onChange={(e) => setFormData({...formData, type: e.target.value as any})}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent"
                  >
                    <option value="plan">Plan</option>
                    <option value="photo">Foto</option>
                    <option value="3d_model">3D-Modell</option>
                    <option value="rendering">Rendering</option>
                    <option value="sketch">Skizze</option>
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
                  placeholder="Beschreiben Sie die Visualisierung..."
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
                    placeholder="z.B. Pläne, Baustellenfotos"
                  />
                </div>
              </div>
              
              {!editingVisualization && (
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
                            accept="image/*,.pdf,.dwg,.dxf,.skp"
                            className="sr-only"
                            onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                            required={!editingVisualization}
                          />
                        </label>
                        <p className="pl-1">oder per Drag & Drop</p>
                      </div>
                      <p className="text-xs text-gray-500">
                        JPG, PNG, PDF, DWG, SKP bis 50MB
                      </p>
                    </div>
                  </div>
                  {uploadFile && (
                    <p className="mt-2 text-sm text-gray-300">
                      Ausgewählte Datei: {uploadFile.name}
                    </p>
                  )}
                </div>
              )}
              
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="is_public"
                  checked={formData.is_public}
                  onChange={(e) => setFormData({...formData, is_public: e.target.checked})}
                  className="w-4 h-4 text-[#ffbd59] bg-white/10 border-white/20 rounded focus:ring-[#ffbd59] focus:ring-2"
                />
                <label htmlFor="is_public" className="text-sm text-gray-300">
                  Visualisierung öffentlich machen (für Dienstleister sichtbar)
                </label>
              </div>
              
              <div className="flex gap-4 pt-6">
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-[#ffbd59] to-[#ffa726] text-[#3d4952] font-bold py-3 rounded-xl hover:from-[#ffa726] hover:to-[#ff9800] transition-all duration-300 transform hover:scale-105"
                >
                  {editingVisualization ? 'Änderungen speichern' : 'Visualisierung hochladen'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowUploadModal(false);
                    setEditingVisualization(null);
                    resetForm();
                  }}
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
      {deletingVisualization && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#3d4952] rounded-2xl p-8 w-full max-w-md">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Trash2 size={32} className="text-red-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Visualisierung löschen</h3>
              <p className="text-gray-400 mb-6">
                Sind Sie sicher, dass Sie diese Visualisierung löschen möchten? Diese Aktion kann nicht rückgängig gemacht werden.
              </p>
              <div className="flex gap-4">
                <button
                  onClick={() => handleDeleteVisualization(deletingVisualization)}
                  className="flex-1 bg-red-500 text-white font-bold py-3 rounded-xl hover:bg-red-600 transition-all duration-300"
                >
                  Löschen
                </button>
                <button
                  onClick={() => setDeletingVisualization(null)}
                  className="flex-1 bg-white/10 text-white font-bold py-3 rounded-xl hover:bg-white/20 transition-all duration-300"
                >
                  Abbrechen
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Fullscreen Viewer Modal */}
      {selectedVisualization && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="relative w-full h-full max-w-6xl max-h-[90vh] bg-[#3d4952] rounded-2xl overflow-hidden">
            <div className="absolute top-4 right-4 z-10 flex gap-2">
              <button className="p-2 bg-white/20 backdrop-blur-sm rounded-lg hover:bg-white/30 transition-colors">
                <ZoomIn size={20} className="text-white" />
              </button>
              <button className="p-2 bg-white/20 backdrop-blur-sm rounded-lg hover:bg-white/30 transition-colors">
                <ZoomOut size={20} className="text-white" />
              </button>
              <button className="p-2 bg-white/20 backdrop-blur-sm rounded-lg hover:bg-white/30 transition-colors">
                <RotateCcw size={20} className="text-white" />
              </button>
              <button className="p-2 bg-white/20 backdrop-blur-sm rounded-lg hover:bg-white/30 transition-colors">
                <Download size={20} className="text-white" />
              </button>
              <button 
                onClick={() => setSelectedVisualization(null)}
                className="p-2 bg-red-500/20 backdrop-blur-sm rounded-lg hover:bg-red-500/30 transition-colors"
              >
                <X size={20} className="text-white" />
              </button>
            </div>
            
            <div className="w-full h-full flex items-center justify-center p-8">
              <div className="text-center">
                <div className="w-32 h-32 bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  {getTypeIcon(selectedVisualization.type)}
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">{selectedVisualization.title}</h3>
                <p className="text-gray-400 mb-4">{selectedVisualization.description}</p>
                <div className="flex items-center justify-center gap-4 text-sm text-gray-500">
                  <span>{getTypeLabel(selectedVisualization.type)}</span>
                  <span>•</span>
                  <span>{formatFileSize(selectedVisualization.file_size)}</span>
                  <span>•</span>
                  <span>{selectedVisualization.view_count} Aufrufe</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 