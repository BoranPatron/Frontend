import React, { useState, useEffect, useRef } from 'react';
import { 
  FileText, 
  Eye, 
  Download, 
  Upload,
  ChevronLeft,
  X,
  FolderOpen,
  Calendar,
  User,
  Tag,
  Lock,
  Globe,
  BarChart3,
  Home,
  FileArchive,
  Shield,
  Folder,
  Grid,
  List,
  SortAsc,
  SortDesc,
  Star,
  Clock,
  FileType,
  Layers,
  Archive,
  Share2,
  History,
  Settings,
  ChevronDown,
  ChevronRight,
  CloudUpload,
  Paperclip,
  Building,
  Heart,
  HardDrive,
  Zap,
  Target,
  TrendingUp,
  BookOpen,
  Video,
  FileImage,
  FileVideo,
  FileAudio,
  FileCode,
  FileSpreadsheet,
  FileBarChart,
  Award,
  Briefcase,
  Calculator,
  Hammer,
  Camera,
  CheckSquare,
  AlertCircle,
  Info,
  FileCheck,
  Wrench,
  Menu,
  Search,
  Filter,
  RefreshCw,
  Plus,
  Edit,
  Trash2,
  AlertTriangle,
  CheckCircle,
  XCircle,
  MoreHorizontal,
  ArrowLeft,
  PlusCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { 
  getDocuments, 
  uploadDocument, 
  deleteDocumentForServiceProvider,
  updateDocument,
  toggleDocumentFavorite,
  updateDocumentStatus,
  getCategoryStatistics,
  trackDocumentAccess,
  getRecentDocuments,
  searchDocumentsFulltext
} from '../api/documentService';
import DocumentViewer from './DocumentViewer';
import { glass } from '../styles/glass';

// Dokumentenkategorien für die Baubranche
const DOCUMENT_CATEGORIES = {
  planning: {
    name: 'Planung & Genehmigung',
    icon: Building,
    color: 'blue',
    subcategories: [
      'Baupläne & Grundrisse',
      'Baugenehmigungen',
      'Statische Berechnungen',
      'Energieausweise',
      'Vermessungsunterlagen'
    ]
  },
  contracts: {
    name: 'Verträge & Rechtliches',
    icon: FileText,
    color: 'green',
    subcategories: [
      'Bauverträge',
      'Nachträge',
      'Versicherungen',
      'Gewährleistungen',
      'Mängelrügen'
    ]
  },
  finance: {
    name: 'Finanzen & Abrechnung',
    icon: Calculator,
    color: 'yellow',
    subcategories: [
      'Rechnungen',
      'Kostenvoranschläge',
      'Leistungsverzeichnisse',
      'Zahlungsbelege',
      'Änderungsaufträge',
      'Schlussrechnungen'
    ]
  },
  execution: {
    name: 'Ausführung & Handwerk',
    icon: Hammer,
    color: 'orange',
    subcategories: [
      'Lieferscheine',
      'Materialbelege',
      'Abnahmeprotokolle',
      'Prüfberichte',
      'Zertifikate',
      'Arbeitsanweisungen'
    ]
  },
  documentation: {
    name: 'Dokumentation & Medien',
    icon: Camera,
    color: 'purple',
    subcategories: [
      'Fotos',
      'Baufortschrittsfotos',
      'Mängeldokumentation',
      'Bestandsdokumentation',
      'Videos',
      'Baustellenberichte'
    ]
  },
  order_confirmations: {
    name: 'Auftragsbestätigungen',
    icon: FileCheck,
    color: 'indigo',
    subcategories: [
      'Auftragsbestätigungen',
      'Bestellbestätigungen',
      'Leistungsbestätigungen'
    ]
  },
  project_management: {
    name: 'Projektmanagement',
    icon: BarChart3,
    color: 'emerald',
    subcategories: [
      'Projektpläne',
      'Terminplanung',
      'Budgetplanung',
      'Projektsteuerung',
      'Risikomanagement',
      'Qualitätsmanagement',
      'Ressourcenplanung',
      'Projektdokumentation'
    ]
  },
  procurement: {
    name: 'Ausschreibungen & Angebote',
    icon: Briefcase,
    color: 'teal',
    subcategories: [
      'Ausschreibungsunterlagen',
      'Technische Spezifikationen',
      'Angebote',
      'Angebotsbewertung',
      'Vergabedokumentation',
      'Verhandlungen'
    ]
  },
  technical: {
    name: 'Technische Unterlagen',
    icon: Wrench,
    color: 'gray',
    subcategories: [
      'Technische Zeichnungen',
      'Spezifikationen',
      'Datenblätter',
      'Handbücher',
      'Anleitungen',
      'Installationsanweisungen',
      'Wartungsanleitungen'
    ]
  }
};

interface Document {
  id: number;
  title: string;
  description?: string;
  file_name: string;
  file_path: string;
  file_size: number;
  mime_type?: string;
  document_type: string;
  category?: string;
  subcategory?: string;
  is_favorite?: boolean;
  status?: string;
  tags?: string;
  is_encrypted: boolean;
  created_at: string;
  updated_at: string;
  accessed_at?: string;
  project_id: number;
  uploaded_by: number;
  milestone_id?: number;
  milestone_title?: string;
  milestone_status?: string;
  milestone_category?: string;
}

interface ServiceProviderDocumentTabProps {
  userId: number;
}

export default function ServiceProviderDocumentTab({ userId }: ServiceProviderDocumentTabProps) {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [showViewer, setShowViewer] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'created_at' | 'title' | 'file_size' | 'accessed_at'>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const documentTabRef = useRef<HTMLDivElement>(null);

  // Click-Outside-Handler für automatisches Einklappen
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isExpanded && documentTabRef.current && !documentTabRef.current.contains(event.target as Node)) {
        setIsExpanded(false);
      }
    };

    if (isExpanded) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isExpanded]);

  // Dokumente laden
  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      console.log('[DEBUG] ServiceProviderDocumentTab: Loading documents...');
      
      const docs = await getDocuments(0, { 
        service_provider_documents: true
      });
      
      console.log('[DEBUG] ServiceProviderDocumentTab: Documents loaded:', docs);
      setDocuments(docs);
      
    } catch (err: any) {
      console.error('[ERROR] ServiceProviderDocumentTab: Failed to load documents:', err);
      setError(err.message || 'Fehler beim Laden der Dokumente');
    } finally {
      setLoading(false);
    }
  };

  // Gefilterte und sortierte Dokumente
  const filteredDocuments = React.useMemo(() => {
    let filtered = documents;

    // Kategorie-Filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(doc => doc.category === selectedCategory);
    }

    // Suchfilter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(doc =>
        doc.title.toLowerCase().includes(term) ||
        doc.description?.toLowerCase().includes(term) ||
        doc.file_name.toLowerCase().includes(term) ||
        doc.tags?.toLowerCase().includes(term)
      );
    }

    // Sortierung
    filtered.sort((a, b) => {
      let aVal: any, bVal: any;
      
      switch (sortBy) {
        case 'title':
          aVal = a.title.toLowerCase();
          bVal = b.title.toLowerCase();
          break;
        case 'file_size':
          aVal = a.file_size;
          bVal = b.file_size;
          break;
        case 'accessed_at':
          aVal = new Date(a.accessed_at || a.created_at);
          bVal = new Date(b.accessed_at || b.created_at);
          break;
        default: // created_at
          aVal = new Date(a.created_at);
          bVal = new Date(b.created_at);
      }

      if (sortOrder === 'desc') {
        return aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
      } else {
        return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      }
    });

    return filtered;
  }, [documents, selectedCategory, searchTerm, sortBy, sortOrder]);

  const handleViewDocument = async (doc: Document) => {
    try {
      await trackDocumentAccess(doc.id);
      setSelectedDocument(doc);
      setShowViewer(true);
    } catch (error: any) {
      console.warn('Fehler beim Tracking:', error.message);
      setSelectedDocument(doc);
      setShowViewer(true);
    }
  };

  const handleToggleFavorite = async (docId: number) => {
    try {
      await toggleDocumentFavorite(docId);
      setDocuments(prev => prev.map(doc => 
        doc.id === docId ? { ...doc, is_favorite: !doc.is_favorite } : doc
      ));
    } catch (error: any) {
      setError(error.message);
    }
  };

  const handleDeleteDocument = async (docId: number) => {
    if (!window.confirm('Möchten Sie dieses Dokument wirklich löschen? Eine Wiederherstellung ist nicht möglich.')) {
      return;
    }

    try {
      await deleteDocumentForServiceProvider(docId);
      setDocuments(prev => prev.filter(doc => doc.id !== docId));
    } catch (error: any) {
      setError(error.message);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getCategoryIcon = (category: string) => {
    return DOCUMENT_CATEGORIES[category as keyof typeof DOCUMENT_CATEGORIES]?.icon || FileText;
  };

  const getCategoryColor = (category: string) => {
    return DOCUMENT_CATEGORIES[category as keyof typeof DOCUMENT_CATEGORIES]?.color || 'gray';
  };

  const documentCount = documents.length;
  const favoriteCount = documents.filter(doc => doc.is_favorite).length;
  const hasDocuments = documentCount > 0;

  return (
    <>
      {/* Service Provider Document Tab - rechts am Bildschirmrand */}
      <div 
        ref={documentTabRef}
        className={`fixed right-0 top-[250px] h-screen z-[9999] transition-all duration-300 ${
          isExpanded ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        
        {/* Tab Handle - Der "Griff" der Lasche (links) */}
        <div 
          className={`absolute left-0 top-0 -translate-x-full cursor-pointer transition-all duration-300 ${
            hasDocuments 
              ? 'bg-gradient-to-r from-[#ffbd59]/80 to-[#ffa726]/80 shadow-lg shadow-[#ffbd59]/50' 
              : 'bg-gradient-to-r from-[#ffbd59]/60 to-[#ffa726]/60'
          } rounded-l-lg px-3 py-4 text-white hover:from-[#ffbd59]/80 hover:to-[#ffa726]/80 hover:shadow-xl backdrop-blur-sm border border-white/20`}
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex flex-col items-center gap-2">
            {/* Document Icon */}
            <div>
              <FileText size={20} />
            </div>
            
            {/* Anzahl Dokumente */}
            {hasDocuments && (
              <div className="bg-white text-[#ffbd59] rounded-full w-7 h-7 flex items-center justify-center text-xs font-bold shadow-lg">
                {documentCount}
              </div>
            )}
            
            {/* Pfeil */}
            <div className={`transform transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
              <ChevronLeft size={16} />
            </div>
          </div>
        </div>

        {/* Document Panel */}
        <div className="bg-gradient-to-br from-slate-900/95 to-gray-900/95 backdrop-blur-xl shadow-2xl w-96 h-full overflow-hidden border-l-4 border-[#ffbd59] border border-gray-700/50 flex flex-col">
          
          {/* Header */}
          <div className="bg-gradient-to-r from-[#ffbd59] to-[#ffa726] text-white p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText size={20} />
                <h3 className="font-semibold">Meine Dokumente</h3>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={loadDocuments}
                  className="hover:bg-white/20 rounded-lg px-3 py-1 transition-colors text-sm font-medium"
                  title="Aktualisieren"
                >
                  <RefreshCw size={14} className="inline mr-1" />
                  Aktualisieren
                </button>
                <button 
                  onClick={() => setIsExpanded(false)}
                  className="hover:bg-white/20 rounded-full p-1 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          </div>

          {/* Search and Filter */}
          <div className="p-4 bg-slate-800/80 backdrop-blur-sm border-b border-gray-700/50">
            <div className="space-y-3">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Dokumente durchsuchen..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-slate-700/80 backdrop-blur-sm border border-gray-600/50 rounded-lg px-3 py-2 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent w-full pl-10 pr-4 text-sm"
                />
              </div>

              {/* Category Filter */}
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-slate-700/80 backdrop-blur-sm border border-gray-600/50 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent w-full text-sm"
              >
                <option value="all" className="bg-gray-800 text-white">Alle Kategorien</option>
                {Object.entries(DOCUMENT_CATEGORIES).map(([key, category]) => (
                  <option key={key} value={key} className="bg-gray-800 text-white">{category.name}</option>
                ))}
              </select>

              {/* Sort */}
              <select
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [field, order] = e.target.value.split('-');
                  setSortBy(field as 'created_at' | 'title' | 'file_size' | 'accessed_at');
                  setSortOrder(order as 'asc' | 'desc');
                }}
                className="bg-slate-700/80 backdrop-blur-sm border border-gray-600/50 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent w-full text-sm"
              >
                <option value="created_at-desc" className="bg-gray-800 text-white">Neueste zuerst</option>
                <option value="created_at-asc" className="bg-gray-800 text-white">Älteste zuerst</option>
                <option value="title-asc" className="bg-gray-800 text-white">Name A-Z</option>
                <option value="title-desc" className="bg-gray-800 text-white">Name Z-A</option>
                <option value="file_size-desc" className="bg-gray-800 text-white">Größte zuerst</option>
                <option value="file_size-asc" className="bg-gray-800 text-white">Kleinste zuerst</option>
              </select>
            </div>
          </div>

          {/* Documents List */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center">
                <RefreshCw className="w-6 h-6 text-[#ffbd59] animate-spin mx-auto mb-2" />
                <p className="text-gray-400 text-sm">Dokumente werden geladen...</p>
              </div>
            ) : error ? (
              <div className="p-4 text-center">
                <AlertTriangle className="w-6 h-6 text-red-400 mx-auto mb-2" />
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            ) : filteredDocuments.length === 0 ? (
              <div className="p-4 text-center">
                <FileText className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-400 text-sm">
                  {documents.length === 0 
                    ? 'Noch keine Dokumente vorhanden'
                    : 'Keine Dokumente gefunden'
                  }
                </p>
              </div>
            ) : (
              <div className="space-y-2 p-2">
                {filteredDocuments.map((doc) => {
                  const CategoryIcon = getCategoryIcon(doc.category || 'documentation');
                  const categoryColor = getCategoryColor(doc.category || 'documentation');
                  
                  return (
                    <div
                      key={doc.id}
                      className="bg-slate-800/90 backdrop-blur-sm rounded-lg border border-gray-600/50 p-3 hover:border-[#ffbd59]/50 hover:bg-slate-700/90 transition-all duration-300 group cursor-pointer hover:shadow-lg hover:shadow-[#ffbd59]/20"
                      onClick={() => handleViewDocument(doc)}
                    >
                      <div className="flex items-start gap-3">
                        {/* Icon */}
                        <div className={`p-2 rounded-lg bg-${categoryColor}-500/10 backdrop-blur-sm border border-${categoryColor}-500/20 shadow-lg shadow-${categoryColor}-500/20 flex-shrink-0`}>
                          <CategoryIcon className={`w-4 h-4 text-${categoryColor}-400`} />
                        </div>
                        
                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium text-gray-100 text-sm truncate hover:text-[#ffbd59] transition-colors">{doc.title}</h4>
                            {doc.is_favorite && (
                              <Star className="w-3 h-3 text-yellow-400 fill-current flex-shrink-0" />
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-300 mb-2">
                            <span>{formatFileSize(doc.file_size)}</span>
                            <span>•</span>
                            <span>{new Date(doc.created_at).toLocaleDateString('de-DE')}</span>
                          </div>
                          {doc.subcategory && (
                            <div className="text-xs text-gray-400 mb-2">{doc.subcategory}</div>
                          )}
                          <div className="text-xs text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                             Klicken zum Öffnen
                          </div>
                        </div>
                        
                        {/* Actions */}
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-300">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewDocument(doc);
                            }}
                            className="p-1 rounded bg-[#ffbd59]/20 text-[#ffbd59] hover:bg-[#ffbd59]/30 transition-all duration-300"
                            title="Anzeigen"
                          >
                            <Eye className="w-3 h-3" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleFavorite(doc.id);
                            }}
                            className={`p-1 rounded transition-all duration-300 ${
                              doc.is_favorite 
                                ? 'bg-yellow-500/20 text-yellow-400' 
                                : 'bg-white/10 text-gray-400 hover:text-yellow-400 hover:bg-white/20'
                            }`}
                            title="Favorit"
                          >
                            <Star className={`w-3 h-3 ${doc.is_favorite ? 'fill-current' : ''}`} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteDocument(doc.id);
                            }}
                            className="p-1 rounded bg-white/10 text-gray-400 hover:text-red-400 hover:bg-white/20 transition-all duration-300"
                            title="Löschen"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer Stats */}
          <div className="p-4 bg-slate-800/80 backdrop-blur-sm border-t border-gray-700/50">
            <div className="flex items-center justify-between text-sm text-gray-400">
              <span>{filteredDocuments.length} von {documents.length} Dokumenten</span>
              <span>{favoriteCount} Favoriten</span>
            </div>
          </div>
        </div>
      </div>

      {/* Document Viewer */}
      {showViewer && selectedDocument && (
        <DocumentViewer
          document={selectedDocument}
          onClose={() => {
            setShowViewer(false);
            setSelectedDocument(null);
          }}
        />
      )}
    </>
  );
}
