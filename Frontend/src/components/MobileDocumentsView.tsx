import React, { useState, useEffect } from 'react';
import { 
  Menu, 
  Search, 
  Filter, 
  Upload, 
  Grid, 
  List, 
  RefreshCw,
  X,
  ChevronDown,
  ChevronRight,
  Home,
  Star,
  Briefcase,
  Folder,
  Eye,
  Edit,
  Trash2,
  File,
  Building,
  Calculator,
  Hammer,
  Camera,
  FileCheck,
  BarChart3,
  Wrench
} from 'lucide-react';
import '../styles/mobile-documents.css';

interface MobileDocumentsViewProps {
  documents: any[];
  filteredDocuments: any[];
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  statusFilter: string;
  setStatusFilter: (filter: string) => void;
  sortBy: string;
  sortOrder: string;
  setSortBy: (sort: string) => void;
  setSortOrder: (order: string) => void;
  onRefresh: () => void;
  onUpload: () => void;
  onViewDocument: (doc: any) => void;
  onEditDocument: (doc: any) => void;
  onToggleFavorite: (id: number) => void;
  onDeleteDocument: (id: number) => void;
  formatFileSize: (bytes: number) => string;
  getCategoryIcon: (category: string) => any;
  getCategoryColor: (category: string) => string;
}

const MobileDocumentsView: React.FC<MobileDocumentsViewProps> = ({
  documents,
  filteredDocuments,
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
  sortBy,
  sortOrder,
  setSortBy,
  setSortOrder,
  onRefresh,
  onUpload,
  onViewDocument,
  onEditDocument,
  onToggleFavorite,
  onDeleteDocument,
  formatFileSize,
  getCategoryIcon,
  getCategoryColor
}) => {
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  
  // Mobile View Mode - Standardmäßig Liste
  const [mobileViewMode, setMobileViewMode] = useState<'grid' | 'list'>('list');

  // Kategorien für mobile Navigation
  const categories = [
    { key: 'all', name: 'Alle Dokumente', icon: Home, count: documents.length },
    { key: 'favorites', name: 'Favoriten', icon: Star, count: documents.filter(d => d.is_favorite).length },
    { key: 'planning', name: 'Planung', icon: Building, count: documents.filter(d => d.category === 'planning').length },
    { key: 'contracts', name: 'Verträge', icon: FileCheck, count: documents.filter(d => d.category === 'contracts').length },
    { key: 'finance', name: 'Finanzen', icon: Calculator, count: documents.filter(d => d.category === 'finance').length },
    { key: 'execution', name: 'Ausführung', icon: Hammer, count: documents.filter(d => d.category === 'execution').length },
    { key: 'documentation', name: 'Dokumentation', icon: Camera, count: documents.filter(d => d.category === 'documentation').length },
    { key: 'technical', name: 'Technisch', icon: Wrench, count: documents.filter(d => d.category === 'technical').length },
  ];

  const toggleCategory = (categoryKey: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryKey)) {
        newSet.delete(categoryKey);
      } else {
        newSet.add(categoryKey);
      }
      return newSet;
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Mobile Sidebar Overlay */}
      {showMobileSidebar && (
        <div 
          className="mobile-sidebar" 
          onClick={() => setShowMobileSidebar(false)}
        >
          <div 
            className="mobile-sidebar-content"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Mobile Sidebar Header */}
            <div className="p-4 border-b border-gray-700/50 bg-black/10">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-white">Navigation</h2>
                <button
                  onClick={() => setShowMobileSidebar(false)}
                  className="mobile-button mobile-secondary-button"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              {/* Mobile Search */}
              <div className="relative">
                <Search className="mobile-search-icon" />
                <input
                  type="text"
                  placeholder="Dokumente durchsuchen..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="mobile-input"
                />
              </div>
            </div>

            {/* Mobile Navigation */}
            <div className="p-4 space-y-2">
              {categories.map((category) => {
                const Icon = category.icon;
                const isSelected = selectedCategory === category.key;
                
                return (
                  <div key={category.key}>
                    <button
                      onClick={() => {
                        setSelectedCategory(category.key);
                        setShowMobileSidebar(false);
                      }}
                      className={`mobile-nav-item ${
                        isSelected 
                          ? 'bg-[#ffbd59] text-[#1a1a2e]' 
                          : 'text-gray-300 hover:bg-[#3d4952]'
                      }`}
                    >
                      <Icon size={18} />
                      <span className="font-medium flex-1 text-left">{category.name}</span>
                      <span className="text-sm bg-slate-600 px-2 py-1 rounded">
                        {category.count}
                      </span>
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Mobile Upload Button */}
            <div className="p-4 border-t border-gray-700/50 bg-black/10">
              <button
                onClick={() => {
                  onUpload();
                  setShowMobileSidebar(false);
                }}
                className="mobile-upload-button w-full flex items-center gap-2"
              >
                <Upload size={18} />
                Dokument hochladen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Header */}
      <div className="mobile-header lg:hidden">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setShowMobileSidebar(true)}
              className="mobile-button mobile-secondary-button"
            >
              <Menu size={20} className="text-[#ffbd59]" />
            </button>
            <div>
              <h1 className="text-lg font-bold text-[#ffbd59]">Dokumente</h1>
              <p className="text-xs text-gray-300">{filteredDocuments.length} Dokumente</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowMobileFilters(!showMobileFilters)}
              className={`mobile-button mobile-secondary-button ${
                showMobileFilters ? 'bg-[#ffbd59] text-[#1a1a2e]' : ''
              }`}
            >
              <Filter size={20} className={showMobileFilters ? 'text-[#1a1a2e]' : 'text-[#ffbd59]'} />
            </button>
            <button
              onClick={onUpload}
              className="mobile-button mobile-primary-button"
            >
              <Upload size={20} className="text-[#1a1a2e]" />
            </button>
          </div>
        </div>
        
        {/* Mobile Search */}
        <div className="mobile-search-bar">
          <div className="relative">
            <Search className="mobile-search-icon" />
            <input
              type="text"
              placeholder="Dokumente durchsuchen..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="mobile-search-input"
            />
          </div>
        </div>
        
        {/* Mobile Filters */}
        {showMobileFilters && (
          <div className="mobile-filter-panel">
            <div className="mobile-filter-grid">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="mobile-select"
              >
                <option value="all">Alle Status</option>
                <option value="draft">Entwurf</option>
                <option value="review">Prüfung</option>
                <option value="approved">Genehmigt</option>
                <option value="rejected">Abgelehnt</option>
                <option value="archived">Archiviert</option>
              </select>
              
              <select
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [field, order] = e.target.value.split('-');
                  setSortBy(field);
                  setSortOrder(order);
                }}
                className="mobile-select"
              >
                <option value="created_at-desc">Neueste zuerst</option>
                <option value="created_at-asc">Älteste zuerst</option>
                <option value="title-asc">Name A-Z</option>
                <option value="title-desc">Name Z-A</option>
                <option value="file_size-desc">Größte zuerst</option>
                <option value="file_size-asc">Kleinste zuerst</option>
                <option value="accessed_at-desc">Zuletzt verwendet</option>
              </select>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => setMobileViewMode(mobileViewMode === 'grid' ? 'list' : 'grid')}
                className="mobile-view-toggle"
              >
                {mobileViewMode === 'grid' ? <List size={16} /> : <Grid size={16} />}
                {mobileViewMode === 'grid' ? 'Liste' : 'Kacheln'}
              </button>
              <button
                onClick={onRefresh}
                className="mobile-button mobile-secondary-button"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Mobile Content */}
      <div className="p-4 lg:hidden">
        {filteredDocuments.length === 0 ? (
          <div className="mobile-empty-state">
            <File className="mobile-empty-state-icon" />
            <h3 className="mobile-empty-state-title">Keine Dokumente gefunden</h3>
            <p className="mobile-empty-state-description">
              {documents.length === 0 
                ? 'Laden Sie Ihr erstes Dokument hoch, um zu beginnen.'
                : 'Versuchen Sie, Ihre Suchkriterien anzupassen.'
              }
            </p>
            {documents.length === 0 && (
              <button
                onClick={onUpload}
                className="mobile-upload-button"
              >
                Erstes Dokument hochladen
              </button>
            )}
          </div>
        ) : (
          <div>
            {mobileViewMode === 'grid' ? (
              // Mobile Grid View
              <div className="mobile-grid">
                {filteredDocuments.map((doc) => {
                  const CategoryIcon = getCategoryIcon(doc.category || 'documentation');
                  const categoryColor = getCategoryColor(doc.category || 'documentation');
                  
                  return (
                    <div
                      key={doc.id}
                      className="mobile-document-card group"
                    >
                      {/* Header */}
                      <div className="flex items-start justify-between mb-3">
                        <div className={`mobile-category-icon bg-${categoryColor}-500/10 p-2 rounded-lg`}>
                          <CategoryIcon className={`w-5 h-5 text-${categoryColor}-400`} />
                        </div>
                        <div className="flex items-center gap-1">
                          {doc.is_favorite && (
                            <Star className="mobile-favorite-star" />
                          )}
                        </div>
                      </div>

                      {/* Content */}
                      <div className="mb-3">
                        <h3 className="mobile-document-title">{doc.title}</h3>
                        <p className="mobile-document-filename">{doc.file_name}</p>
                        {doc.description && (
                          <p className="mobile-document-description">{doc.description}</p>
                        )}
                      </div>
            
                      {/* Metadata */}
                      <div className="mobile-metadata">
                        <div className="mobile-metadata-row">
                          <span className="mobile-file-size">{formatFileSize(doc.file_size)}</span>
                          <span className="mobile-status-badge capitalize">{doc.status || 'draft'}</span>
                        </div>
                        {doc.subcategory && (
                          <div className="mobile-subcategory">
                            {doc.subcategory}
                          </div>
                        )}
                        <div className="mobile-date">
                          {new Date(doc.created_at).toLocaleDateString('de-DE')}
                        </div>
                      </div>
            
                      {/* Actions - Mobile optimiert */}
                      <div className="mobile-actions-row">
                        <button
                          onClick={() => onViewDocument(doc)}
                          className="mobile-primary-action"
                        >
                          <Eye className="w-4 h-4 mx-auto" />
                        </button>
                        <button
                          onClick={() => onEditDocument(doc)}
                          className="mobile-secondary-action"
                          title="Bearbeiten"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onToggleFavorite(doc.id)}
                          className={`mobile-favorite-action ${
                            doc.is_favorite 
                              ? 'bg-yellow-500/20 text-yellow-400' 
                              : 'bg-[#2c3539]/50 text-gray-400 hover:text-yellow-400'
                          }`}
                        >
                          <Star className={`w-4 h-4 ${doc.is_favorite ? 'fill-current' : ''}`} />
                        </button>
                        <button
                          onClick={() => onDeleteDocument(doc.id)}
                          className="mobile-delete-action"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              // Mobile List View
              <div className="mobile-list-view">
                {filteredDocuments.map((doc) => {
                  const CategoryIcon = getCategoryIcon(doc.category || 'documentation');
                  const categoryColor = getCategoryColor(doc.category || 'documentation');
                  
                  return (
                    <div
                      key={doc.id}
                      className="mobile-list-item group"
                    >
                      <div className="mobile-list-content">
                        {/* Icon */}
                        <div className={`mobile-list-icon bg-${categoryColor}-500/10`}>
                          <CategoryIcon className={`mobile-category-icon text-${categoryColor}-400`} />
                        </div>
                
                        {/* Content */}
                        <div className="mobile-list-text">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="mobile-list-title">{doc.title}</h3>
                            {doc.is_favorite && (
                              <Star className="mobile-favorite-star" />
                            )}
                          </div>
                          <div className="mobile-list-meta">
                            <span className="truncate">{doc.file_name}</span>
                            <span className="mobile-file-size">{formatFileSize(doc.file_size)}</span>
                            <span className="mobile-status-badge capitalize">{doc.status || 'draft'}</span>
                          </div>
                        </div>
                
                        {/* Actions */}
                        <div className="mobile-list-actions">
                          <button
                            onClick={() => onViewDocument(doc)}
                            className="mobile-action-button bg-[#ffbd59]/20 text-[#ffbd59] hover:bg-[#ffbd59]/30"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onToggleFavorite(doc.id)}
                            className={`mobile-action-button ${
                              doc.is_favorite 
                                ? 'bg-yellow-500/20 text-yellow-400' 
                                : 'bg-[#2c3539]/50 text-gray-400 hover:text-yellow-400'
                            }`}
                          >
                            <Star className={`w-4 h-4 ${doc.is_favorite ? 'fill-current' : ''}`} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MobileDocumentsView;
