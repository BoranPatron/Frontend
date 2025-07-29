import React, { useState, useEffect, useRef } from 'react';
import { 
  Eye, 
  Layers, 
  Cube, 
  Map, 
  Calendar,
  Users,
  FileText,
  Image,
  Video,
  Globe,
  Search,
  Filter,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Download,
  Share2,
  Bookmark,
  Star,
  Tag,
  BarChart3,
  PieChart,
  TrendingUp,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle
} from 'lucide-react';

interface DocumentVisualization {
  id: string;
  type: '3d_model' | 'floor_plan' | 'site_plan' | 'photo' | 'video' | 'document';
  title: string;
  description: string;
  thumbnail: string;
  data: any;
  metadata: {
    projectPhase: string;
    uploadDate: string;
    fileSize: number;
    dimensions?: { width: number; height: number; depth?: number };
    location?: { lat: number; lng: number };
    tags: string[];
    status: 'approved' | 'pending' | 'rejected' | 'draft';
    version: number;
    uploadedBy: string;
  };
}

interface DocumentVisualizationHubProps {
  documents: DocumentVisualization[];
  selectedProject: string;
  onDocumentSelect: (document: DocumentVisualization) => void;
  onViewModeChange: (mode: 'grid' | 'timeline' | '3d' | 'map') => void;
}

export default function DocumentVisualizationHub({
  documents,
  selectedProject,
  onDocumentSelect,
  onViewModeChange
}: DocumentVisualizationHubProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'timeline' | '3d' | 'map'>('grid');
  const [selectedDocument, setSelectedDocument] = useState<DocumentVisualization | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'type' | 'status'>('date');
  const [showFilters, setShowFilters] = useState(false);
  const [is3DMode, setIs3DMode] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.metadata.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesType = filterType === 'all' || doc.type === filterType;
    return matchesSearch && matchesType;
  });

  const sortedDocuments = [...filteredDocuments].sort((a, b) => {
    switch (sortBy) {
      case 'date':
        return new Date(b.metadata.uploadDate).getTime() - new Date(a.metadata.uploadDate).getTime();
      case 'name':
        return a.title.localeCompare(b.title);
      case 'type':
        return a.type.localeCompare(b.type);
      case 'status':
        return a.metadata.status.localeCompare(b.metadata.status);
      default:
        return 0;
    }
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'text-green-500 bg-green-500/20 border-green-500/30';
      case 'pending': return 'text-yellow-500 bg-yellow-500/20 border-yellow-500/30';
      case 'rejected': return 'text-red-500 bg-red-500/20 border-red-500/30';
      case 'draft': return 'text-gray-500 bg-gray-500/20 border-gray-500/30';
      default: return 'text-gray-500 bg-gray-500/20 border-gray-500/30';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle size={16} />;
      case 'pending': return <Clock size={16} />;
      case 'rejected': return <XCircle size={16} />;
      case 'draft': return <FileText size={16} />;
      default: return <AlertCircle size={16} />;
    }
  };

  const getDocumentTypeIcon = (type: string) => {
    switch (type) {
      case '3d_model': return <Cube size={20} className="text-blue-500" />;
      case 'floor_plan': return <Layers size={20} className="text-green-500" />;
      case 'site_plan': return <Map size={20} className="text-purple-500" />;
      case 'photo': return <Image size={20} className="text-pink-500" />;
      case 'video': return <Video size={20} className="text-red-500" />;
      case 'document': return <FileText size={20} className="text-orange-500" />;
      default: return <FileText size={20} className="text-gray-500" />;
    }
  };

  const getDocumentTypeLabel = (type: string) => {
    switch (type) {
      case '3d_model': return '3D-Modell';
      case 'floor_plan': return 'Grundriss';
      case 'site_plan': return 'Geländeplan';
      case 'photo': return 'Foto';
      case 'video': return 'Video';
      case 'document': return 'Dokument';
      default: return 'Dokument';
    }
  };

  const handleViewModeChange = (mode: 'grid' | 'timeline' | '3d' | 'map') => {
    setViewMode(mode);
    onViewModeChange(mode);
    
    if (mode === '3d') {
      setIs3DMode(true);
      // Hier würde 3D-Initialisierung stattfinden
    } else {
      setIs3DMode(false);
    }
  };

  const renderGridView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {sortedDocuments.map((doc) => (
        <div
          key={doc.id}
          onClick={() => {
            setSelectedDocument(doc);
            onDocumentSelect(doc);
          }}
          className="group bg-white/10 backdrop-blur-lg rounded-2xl p-4 border border-white/20 hover:bg-white/20 transition-all duration-300 transform hover:-translate-y-1 cursor-pointer"
        >
          <div className="relative mb-4">
            <div className="aspect-video bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl flex items-center justify-center">
              {doc.type === '3d_model' ? (
                <Cube size={32} className="text-blue-400" />
              ) : doc.type === 'photo' ? (
                <Image size={32} className="text-pink-400" />
              ) : (
                getDocumentTypeIcon(doc.type)
              )}
            </div>
            
            <div className="absolute top-2 right-2">
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(doc.metadata.status)}`}>
                {getStatusIcon(doc.metadata.status)}
              </span>
            </div>
            
            {doc.metadata.version > 1 && (
              <div className="absolute top-2 left-2">
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  v{doc.metadata.version}
                </span>
              </div>
            )}
          </div>
          
          <div className="space-y-2">
            <h3 className="font-semibold text-white group-hover:text-[#ffbd59] transition-colors">
              {doc.title}
            </h3>
            <p className="text-sm text-gray-300 line-clamp-2">
              {doc.description}
            </p>
            
            <div className="flex items-center justify-between text-xs text-gray-400">
              <span>{new Date(doc.metadata.uploadDate).toLocaleDateString('de-DE')}</span>
              <span>{getDocumentTypeLabel(doc.type)}</span>
            </div>
            
            <div className="flex flex-wrap gap-1">
              {doc.metadata.tags.slice(0, 3).map((tag, index) => (
                <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-white/10 text-white border border-white/20">
                  <Tag size={10} className="mr-1" />
                  {tag}
                </span>
              ))}
              {doc.metadata.tags.length > 3 && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-white/10 text-white border border-white/20">
                  +{doc.metadata.tags.length - 3}
                </span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderTimelineView = () => (
    <div className="space-y-4">
      {sortedDocuments.map((doc, index) => (
        <div
          key={doc.id}
          onClick={() => {
            setSelectedDocument(doc);
            onDocumentSelect(doc);
          }}
          className="flex items-center gap-4 p-4 bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 hover:bg-white/20 transition-all duration-300 cursor-pointer"
        >
          <div className="flex-shrink-0">
            <div className="w-12 h-12 bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl flex items-center justify-center">
              {getDocumentTypeIcon(doc.type)}
            </div>
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-1">
              <h3 className="font-semibold text-white truncate">{doc.title}</h3>
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(doc.metadata.status)}`}>
                {getStatusIcon(doc.metadata.status)}
              </span>
            </div>
            <p className="text-sm text-gray-300 line-clamp-1">{doc.description}</p>
            <div className="flex items-center gap-4 text-xs text-gray-400 mt-2">
              <span>{new Date(doc.metadata.uploadDate).toLocaleDateString('de-DE')}</span>
              <span>{doc.metadata.uploadedBy}</span>
              <span>{getDocumentTypeLabel(doc.type)}</span>
            </div>
          </div>
          
          <div className="flex-shrink-0">
            <div className="flex items-center gap-2">
              <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                <Eye size={16} className="text-white" />
              </button>
              <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                <Download size={16} className="text-white" />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const render3DView = () => (
    <div className="bg-gradient-to-br from-gray-900 to-black rounded-2xl p-6 border border-white/20">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">3D-Dokumentenvisualisierung</h3>
        <div className="flex items-center gap-2">
          <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
            <ZoomIn size={16} className="text-white" />
          </button>
          <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
            <ZoomOut size={16} className="text-white" />
          </button>
          <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
            <RotateCw size={16} className="text-white" />
          </button>
        </div>
      </div>
      
      <div className="aspect-video bg-gradient-to-br from-blue-900 to-purple-900 rounded-xl flex items-center justify-center">
        <div className="text-center">
          <Cube size={48} className="text-blue-400 mx-auto mb-4" />
          <p className="text-white font-medium">3D-Viewer wird geladen...</p>
          <p className="text-gray-400 text-sm">Interaktive 3D-Visualisierung Ihrer Dokumente</p>
        </div>
      </div>
      
      <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
        {sortedDocuments.filter(doc => doc.type === '3d_model').slice(0, 4).map((doc) => (
          <div key={doc.id} className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-800 to-purple-800 rounded-xl flex items-center justify-center mx-auto mb-2">
              <Cube size={24} className="text-blue-300" />
            </div>
            <p className="text-xs text-white truncate">{doc.title}</p>
          </div>
        ))}
      </div>
    </div>
  );

  const renderMapView = () => (
    <div className="bg-gradient-to-br from-green-900 to-blue-900 rounded-2xl p-6 border border-white/20">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Geografische Dokumentenansicht</h3>
        <div className="flex items-center gap-2">
          <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
            <Globe size={16} className="text-white" />
          </button>
        </div>
      </div>
      
      <div className="aspect-video bg-gradient-to-br from-green-800 to-blue-800 rounded-xl flex items-center justify-center">
        <div className="text-center">
          <Map size={48} className="text-green-400 mx-auto mb-4" />
          <p className="text-white font-medium">Kartenansicht wird geladen...</p>
          <p className="text-gray-300 text-sm">Geografische Verteilung Ihrer Dokumente</p>
        </div>
      </div>
      
      <div className="mt-4">
        <h4 className="text-white font-medium mb-2">Dokumente mit Standortdaten:</h4>
        <div className="space-y-2">
          {sortedDocuments.filter(doc => doc.metadata.location).slice(0, 5).map((doc) => (
            <div key={doc.id} className="flex items-center gap-3 p-2 bg-white/10 rounded-lg">
              <Map size={16} className="text-green-400" />
              <div className="flex-1">
                <p className="text-sm text-white">{doc.title}</p>
                <p className="text-xs text-gray-300">
                  {doc.metadata.location?.lat.toFixed(4)}, {doc.metadata.location?.lng.toFixed(4)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header mit Steuerung */}
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-bold text-[#ffbd59]">Dokumentenvisualisierung</h2>
            <span className="text-sm text-gray-300">Projekt: {selectedProject}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Dokumente durchsuchen..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent backdrop-blur-lg"
              />
            </div>
            
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="p-2 hover:bg-white/10 rounded-xl transition-colors"
            >
              <Filter size={16} className="text-white" />
            </button>
          </div>
        </div>
        
        {/* View Mode Tabs */}
        <div className="flex items-center gap-2 mt-4">
          {[
            { mode: 'grid', label: 'Raster', icon: <Layers size={16} /> },
            { mode: 'timeline', label: 'Zeitstrahl', icon: <Calendar size={16} /> },
            { mode: '3d', label: '3D-Ansicht', icon: <Cube size={16} /> },
            { mode: 'map', label: 'Karte', icon: <Map size={16} /> }
          ].map(({ mode, label, icon }) => (
            <button
              key={mode}
              onClick={() => handleViewModeChange(mode as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-colors ${
                viewMode === mode
                  ? 'bg-[#ffbd59] text-[#3d4952]'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              {icon}
              {label}
            </button>
          ))}
        </div>
        
        {/* Erweiterte Filter */}
        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 pt-4 border-t border-white/10">
            <div>
              <label className="block text-sm font-medium text-white mb-2">Dokumententyp</label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent backdrop-blur-lg"
              >
                <option value="all" className="bg-[#3d4952] text-white">Alle Typen</option>
                <option value="3d_model" className="bg-[#3d4952] text-white">3D-Modelle</option>
                <option value="floor_plan" className="bg-[#3d4952] text-white">Grundrisse</option>
                <option value="site_plan" className="bg-[#3d4952] text-white">Geländepläne</option>
                <option value="photo" className="bg-[#3d4952] text-white">Fotos</option>
                <option value="video" className="bg-[#3d4952] text-white">Videos</option>
                <option value="document" className="bg-[#3d4952] text-white">Dokumente</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-white mb-2">Sortierung</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent backdrop-blur-lg"
              >
                <option value="date" className="bg-[#3d4952] text-white">Datum</option>
                <option value="name" className="bg-[#3d4952] text-white">Name</option>
                <option value="type" className="bg-[#3d4952] text-white">Typ</option>
                <option value="status" className="bg-[#3d4952] text-white">Status</option>
              </select>
            </div>
            
            <div className="flex items-end">
              <button className="w-full px-4 py-2 bg-[#ffbd59] text-[#3d4952] rounded-xl hover:bg-[#ffa726] transition-colors">
                Filter anwenden
              </button>
            </div>
          </div>
        )}
      </div>
      
      {/* Statistiken */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <FileText size={20} className="text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{documents.length}</p>
              <p className="text-sm text-gray-300">Gesamt</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500/20 rounded-lg">
              <CheckCircle size={20} className="text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">
                {documents.filter(d => d.metadata.status === 'approved').length}
              </p>
              <p className="text-sm text-gray-300">Genehmigt</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-500/20 rounded-lg">
              <Clock size={20} className="text-yellow-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">
                {documents.filter(d => d.metadata.status === 'pending').length}
              </p>
              <p className="text-sm text-gray-300">Ausstehend</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <Cube size={20} className="text-purple-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">
                {documents.filter(d => d.type === '3d_model').length}
              </p>
              <p className="text-sm text-gray-300">3D-Modelle</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Content basierend auf View Mode */}
      {viewMode === 'grid' && renderGridView()}
      {viewMode === 'timeline' && renderTimelineView()}
      {viewMode === '3d' && render3DView()}
      {viewMode === 'map' && renderMapView()}
      
      {sortedDocuments.length === 0 && (
        <div className="text-center py-12">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 max-w-md mx-auto">
            <FileText size={48} className="text-[#ffbd59] mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Keine Dokumente gefunden</h3>
            <p className="text-gray-300">
              {searchTerm || filterType !== 'all' 
                ? 'Versuchen Sie andere Suchkriterien oder Filter.'
                : 'Laden Sie Ihr erstes Dokument hoch, um zu beginnen.'
              }
            </p>
          </div>
        </div>
      )}
    </div>
  );
}