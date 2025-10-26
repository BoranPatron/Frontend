import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  ChevronRight,
  ChevronLeft,
  X,
  Eye,
  Download,
  Calendar,
  FolderOpen,
  AlertCircle,
  Search,
  Filter,
  Building,
  Hammer,
  FileCheck,
  Camera,
  Calculator,
  Wrench,
  Files
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useProject } from '../context/ProjectContext';

// Document Interface
export interface DocumentItem {
  id: number;
  title: string;
  filename: string;
  file_path: string;
  file_url?: string;
  category: string;
  subcategory?: string;
  created_at: string;
  file_size?: number;
  file_type?: string;
  milestone_id?: number;
  milestone_title?: string;
  project_id?: number;
  project_title?: string;
  ausschreibung_title?: string;
}

interface DocumentSidebarProps {
  onDocumentClick?: (document: DocumentItem) => void;
}

// Kategorie-Icons und Farben
const CATEGORY_CONFIG: Record<string, { icon: any; color: string; label: string }> = {
  planning: { icon: Building, color: 'blue', label: 'Planung' },
  contracts: { icon: FileText, color: 'green', label: 'Verträge' },
  finance: { icon: Calculator, color: 'yellow', label: 'Finanzen' },
  execution: { icon: Hammer, color: 'orange', label: 'Ausführung' },
  documentation: { icon: Camera, color: 'purple', label: 'Dokumentation' },
  procurement: { icon: FileCheck, color: 'indigo', label: 'Ausschreibungen' },
  technical: { icon: Wrench, color: 'gray', label: 'Technisch' }
};

const DocumentSidebar: React.FC<DocumentSidebarProps> = ({ onDocumentClick }) => {
  const { user, isBautraeger } = useAuth();
  const { selectedProject } = useProject();
  const [isOpen, setIsOpen] = useState(false);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [filteredDocuments, setFilteredDocuments] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedAusschreibung, setSelectedAusschreibung] = useState<string | null>(null);

  // Lade Dokumente beim Öffnen oder wenn sich das Projekt ändert
  useEffect(() => {
    if (isOpen && selectedProject?.id) {
      loadDocuments();
    }
  }, [isOpen, selectedProject?.id]);

  // Filter-Effekt
  useEffect(() => {
    let filtered = [...documents];

    // Suchfilter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(doc => 
        doc.title.toLowerCase().includes(term) ||
        doc.filename.toLowerCase().includes(term) ||
        doc.ausschreibung_title?.toLowerCase().includes(term) ||
        doc.milestone_title?.toLowerCase().includes(term)
      );
    }

    // Kategoriefilter
    if (selectedCategory) {
      filtered = filtered.filter(doc => doc.category === selectedCategory);
    }

    // Ausschreibungsfilter
    if (selectedAusschreibung) {
      filtered = filtered.filter(doc => doc.ausschreibung_title === selectedAusschreibung);
    }

    // Sortiere nach Datum (neueste zuerst)
    filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    setFilteredDocuments(filtered);
  }, [documents, searchTerm, selectedCategory, selectedAusschreibung]);

  const loadDocuments = async () => {
    if (!selectedProject?.id) {
      setError('Kein Projekt ausgewählt');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('token');
      // Ensure baseUrl includes /api/v1 prefix
      let baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';
      if (!baseUrl.includes('/api/v1')) {
        baseUrl = baseUrl.endsWith('/') ? `${baseUrl}api/v1` : `${baseUrl}/api/v1`;
      }
      
      // Determine endpoint based on user role using AuthContext helper
      const isBautraegerUser = isBautraeger();
      const endpoint = isBautraegerUser 
        ? `${baseUrl}/documents/bautraeger/overview?project_id=${selectedProject.id}`
        : `${baseUrl}/documents/dienstleister/overview?project_id=${selectedProject.id}`;
      
      // Debug logging to help diagnose future issues
      console.log('🔍 Document Sidebar User Check:', {
        user_role: user?.user_role,
        user_type: user?.user_type,
        isBautraeger: isBautraegerUser,
        selectedEndpoint: endpoint,
        project_id: selectedProject.id
      });
      
      const response = await fetch(endpoint, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Fehler beim Laden der Dokumente');
      }

      const data = await response.json();
      setDocuments(data.documents || []);
    } catch (err: any) {
      console.error('Error loading documents:', err);
      setError(err.message || 'Fehler beim Laden der Dokumente');
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'N/A';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('de-DE', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    });
  };

  const getCategoryIcon = (category: string) => {
    const config = CATEGORY_CONFIG[category] || CATEGORY_CONFIG.technical;
    const Icon = config.icon;
    return <Icon className="w-4 h-4" />;
  };

  const getCategoryColor = (category: string) => {
    return CATEGORY_CONFIG[category]?.color || 'gray';
  };

  // Extrahiere einzigartige Ausschreibungen für Filter
  const uniqueAusschreibungen = Array.from(
    new Set(documents.map(doc => doc.ausschreibung_title).filter(Boolean))
  );

  const uniqueCategories = Array.from(
    new Set(documents.map(doc => doc.category).filter(Boolean))
  );

  const handleDocumentClick = (doc: DocumentItem) => {
    if (onDocumentClick) {
      onDocumentClick(doc);
    }
  };

  return (
    <>
      {/* Tab/Toggle Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed right-0 z-40 transition-all duration-300 ${
          isOpen ? 'right-[420px]' : 'right-0'
        }`}
        style={{ top: 'calc(50% + 20px)' }}
        whileHover={{ scale: 1.05, x: isOpen ? 0 : -5 }}
        whileTap={{ scale: 0.95 }}
      >
        <div className="bg-gradient-to-br from-[#ffbd59]/60 to-[#f59e0b]/60 backdrop-blur-sm text-white px-3 py-4 rounded-l-lg shadow-xl border border-white/20 flex flex-col items-center gap-2 hover:from-[#ffbd59]/80 hover:to-[#f59e0b]/80 transition-all">
          {isOpen ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <>
              <Files className="w-5 h-5" />
              {documents.length > 0 && (
                <div className="bg-white/95 text-[#f59e0b] rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-bold shadow-sm">
                  {documents.length}
                </div>
              )}
            </>
          )}
        </div>
      </motion.button>

      {/* Sidebar Panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
            />

            {/* Sidebar Content */}
            <motion.div
              initial={{ x: 420 }}
              animate={{ x: 0 }}
              exit={{ x: 420 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 h-screen w-[420px] bg-[#1a1a1a] shadow-2xl z-50 flex flex-col"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-[#ffbd59] to-[#f59e0b] p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <FolderOpen className="w-7 h-7 text-white" />
                    <div>
                      <h2 className="text-2xl font-bold text-white">Dokumente</h2>
                      {selectedProject && (
                        <p className="text-white/80 text-sm font-medium">
                          {selectedProject.name}
                        </p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
                  >
                    <X className="w-5 h-5 text-white" />
                  </button>
                </div>
                
                <p className="text-white/90 text-sm">
                  {documents.length} Dokument{documents.length !== 1 ? 'e' : ''} verfügbar
                </p>
              </div>

              {/* Search and Filters */}
              <div className="p-4 border-b border-gray-700 space-y-3">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Dokumente durchsuchen..."
                    className="w-full bg-[#2a2a2a] text-white pl-10 pr-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ffbd59] text-sm"
                  />
                </div>

                {/* Category Filter */}
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setSelectedCategory(null)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                      selectedCategory === null
                        ? 'bg-[#ffbd59] text-black'
                        : 'bg-[#2a2a2a] text-gray-300 hover:bg-[#333]'
                    }`}
                  >
                    Alle
                  </button>
                  {uniqueCategories.map(cat => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat === selectedCategory ? null : cat)}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-colors flex items-center gap-1 ${
                        selectedCategory === cat
                          ? 'bg-[#ffbd59] text-black'
                          : 'bg-[#2a2a2a] text-gray-300 hover:bg-[#333]'
                      }`}
                    >
                      {getCategoryIcon(cat)}
                      {CATEGORY_CONFIG[cat]?.label || cat}
                    </button>
                  ))}
                </div>

                {/* Ausschreibung Filter */}
                {uniqueAusschreibungen.length > 0 && (
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">Nach Ausschreibung filtern:</label>
                    <select
                      value={selectedAusschreibung || ''}
                      onChange={(e) => setSelectedAusschreibung(e.target.value || null)}
                      className="w-full bg-[#2a2a2a] text-white px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ffbd59] text-sm"
                    >
                      <option value="">Alle Ausschreibungen</option>
                      {uniqueAusschreibungen.map((ausschreibung, idx) => (
                        <option key={idx} value={ausschreibung || ''}>
                          {ausschreibung}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Document List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {loading ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#ffbd59] border-t-transparent mx-auto mb-4"></div>
                      <p className="text-gray-400">Lade Dokumente...</p>
                    </div>
                  </div>
                ) : error ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                      <p className="text-red-400">{error}</p>
                      <button
                        onClick={loadDocuments}
                        className="mt-4 px-4 py-2 bg-[#ffbd59] text-black rounded-lg hover:bg-[#f59e0b] transition-colors"
                      >
                        Erneut versuchen
                      </button>
                    </div>
                  </div>
                ) : !selectedProject ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <Building className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                      <p className="text-gray-400">Kein Projekt ausgewählt</p>
                      <p className="text-gray-500 text-sm mt-2">
                        Wählen Sie ein Projekt aus, um dessen Dokumente anzuzeigen
                      </p>
                    </div>
                  </div>
                ) : filteredDocuments.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <FileText className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                      <p className="text-gray-400">
                        {searchTerm || selectedCategory || selectedAusschreibung
                          ? 'Keine passenden Dokumente gefunden'
                          : 'Keine Dokumente verfügbar'}
                      </p>
                    </div>
                  </div>
                ) : (
                  filteredDocuments.map((doc) => (
                    <motion.div
                      key={doc.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      whileHover={{ scale: 1.02 }}
                      onClick={() => handleDocumentClick(doc)}
                      className="bg-[#2a2a2a] rounded-lg p-4 cursor-pointer hover:bg-[#333] transition-all border border-gray-700 hover:border-[#ffbd59]/50"
                    >
                      {/* Document Header */}
                      <div className="flex items-start gap-3 mb-3">
                        <div className={`w-10 h-10 rounded-lg bg-${getCategoryColor(doc.category)}-500/20 flex items-center justify-center flex-shrink-0`}>
                          {getCategoryIcon(doc.category)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-white font-semibold text-sm mb-1 truncate">
                            {doc.title}
                          </h3>
                          <p className="text-gray-400 text-xs truncate">
                            {doc.filename}
                          </p>
                        </div>
                      </div>

                      {/* Ausschreibung Info */}
                      {doc.ausschreibung_title && (
                        <div className="mb-2 flex items-center gap-2 text-xs">
                          <Hammer className="w-3 h-3 text-[#ffbd59]" />
                          <span className="text-[#ffbd59] font-medium truncate">
                            {doc.ausschreibung_title}
                          </span>
                        </div>
                      )}

                      {/* Milestone Info */}
                      {doc.milestone_title && (
                        <div className="mb-2 flex items-center gap-2 text-xs">
                          <Building className="w-3 h-3 text-blue-400" />
                          <span className="text-blue-400 truncate">
                            {doc.milestone_title}
                          </span>
                        </div>
                      )}

                      {/* Meta Info */}
                      <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-700">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>{formatDate(doc.created_at)}</span>
                        </div>
                        <span>{formatFileSize(doc.file_size)}</span>
                      </div>

                      {/* Action Hint */}
                      <div className="mt-2 flex items-center justify-end gap-1 text-xs text-[#ffbd59]">
                        <Eye className="w-3 h-3" />
                        <span>Anzeigen</span>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>

              {/* Footer Stats */}
              {!loading && !error && documents.length > 0 && (
                <div className="p-4 border-t border-gray-700 bg-[#222]">
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <div className="text-2xl font-bold text-[#ffbd59]">{filteredDocuments.length}</div>
                      <div className="text-xs text-gray-400">Angezeigt</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-white">{documents.length}</div>
                      <div className="text-xs text-gray-400">Gesamt</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-green-400">{uniqueAusschreibungen.length}</div>
                      <div className="text-xs text-gray-400">Ausschreibungen</div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default DocumentSidebar;

