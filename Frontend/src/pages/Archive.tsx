import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useProject } from '../context/ProjectContext';
import { 
  Archive as ArchiveIcon, 
  ArrowLeft, 
  Search, 
  Filter,
  Calendar,
  User,
  Building,
  FileText,
  CheckCircle,
  Euro,
  Eye,
  Download,
  Clock
} from 'lucide-react';

interface ArchivedTrade {
  id: number;
  title: string;
  description: string;
  category: string;
  budget: number;
  service_provider: {
    id: number;
    company_name: string;
    contact_person: string;
    email: string;
    phone: string;
  };
  accepted_quote: {
    id: number;
    amount: number;
    description: string;
    accepted_at: string;
  };
  invoice: {
    id: number;
    invoice_number: string;
    amount: number;
    status: string;
    paid_at: string;
  };
  completion_status: string;
  archived_at: string;
  archived_by: string;
  archive_reason: string;
  project: {
    id: number;
    title: string;
    address: string;
  };
}

const Archive: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { selectedProject } = useProject();
  
  const [archivedTrades, setArchivedTrades] = useState<ArchivedTrade[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'archived_at' | 'title' | 'amount'>('archived_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  // Kategorien für Filter
  const categories = [
    { key: 'all', label: 'Alle Kategorien' },
    { key: 'electrical', label: 'Elektroarbeiten' },
    { key: 'plumbing', label: 'Sanitärarbeiten' },
    { key: 'heating', label: 'Heizung' },
    { key: 'flooring', label: 'Bodenarbeiten' },
    { key: 'painting', label: 'Malerarbeiten' },
    { key: 'roofing', label: 'Dacharbeiten' },
    { key: 'windows', label: 'Fenster & Türen' },
    { key: 'masonry', label: 'Maurerarbeiten' },
    { key: 'other', label: 'Sonstige' }
  ];

  // Lade archivierte Gewerke
  useEffect(() => {
    if (selectedProject) {
      loadArchivedTrades();
    }
  }, [selectedProject, searchTerm, categoryFilter]);

  const loadArchivedTrades = async () => {
    try {
      setLoading(true);
      
      const { apiCall } = await import('../api/api');
      
      const params = new URLSearchParams();
      if (selectedProject) params.append('project_id', selectedProject.id.toString());
      if (searchTerm) params.append('search_query', searchTerm);
      if (categoryFilter !== 'all') params.append('category_filter', categoryFilter);
      
      const response = await apiCall(`/milestones/archived?${params.toString()}`);
      
      if (response && Array.isArray(response)) {
        setArchivedTrades(response);
      } else {
        setArchivedTrades([]);
      }
      
    } catch (error) {
      console.error('❌ Fehler beim Laden der archivierten Gewerke:', error);
      setArchivedTrades([]);
    } finally {
      setLoading(false);
    }
  };

  // Sortierte und gefilterte Daten
  const sortedTrades = React.useMemo(() => {
    let filtered = archivedTrades;
    
    // Sortierung anwenden
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortBy) {
        case 'archived_at':
          aValue = new Date(a.archived_at);
          bValue = new Date(b.archived_at);
          break;
        case 'title':
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        case 'amount':
          aValue = a.accepted_quote?.amount || 0;
          bValue = b.accepted_quote?.amount || 0;
          break;
        default:
          return 0;
      }
      
      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
    
    return filtered;
  }, [archivedTrades, sortBy, sortOrder]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const getCategoryLabel = (category: string) => {
    const cat = categories.find(c => c.key === category);
    return cat ? cat.label : category;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f1419] via-[#1a1a2e] to-[#16213e] p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2 px-4 py-2 bg-gray-600/20 hover:bg-gray-600/30 text-gray-300 hover:text-white rounded-lg transition-all duration-200"
            >
              <ArrowLeft size={16} />
              <span>Zurück zum Dashboard</span>
            </button>
            
            <div className="flex items-center gap-3">
              <ArchiveIcon size={24} className="text-[#ffbd59]" />
              <h1 className="text-2xl font-bold text-white">Archiv</h1>
            </div>
          </div>
          
          {selectedProject && (
            <div className="text-right">
              <p className="text-gray-400 text-sm">Projekt</p>
              <p className="text-white font-medium">{selectedProject.title}</p>
            </div>
          )}
        </div>

        {/* Filter und Suche */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {/* Suche */}
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Ausschreibung suchen..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent"
            />
          </div>

          {/* Kategorie-Filter */}
          <div className="relative">
            <Filter size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent appearance-none"
            >
              {categories.map(category => (
                <option key={category.key} value={category.key} className="bg-gray-800">
                  {category.label}
                </option>
              ))}
            </select>
          </div>

          {/* Sortierung */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent appearance-none"
          >
            <option value="archived_at" className="bg-gray-800">Archiviert am</option>
            <option value="title" className="bg-gray-800">Titel</option>
            <option value="amount" className="bg-gray-800">Betrag</option>
          </select>

          {/* Sortierreihenfolge */}
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as any)}
            className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent appearance-none"
          >
            <option value="desc" className="bg-gray-800">Neueste zuerst</option>
            <option value="asc" className="bg-gray-800">Älteste zuerst</option>
          </select>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#ffbd59]"></div>
            <span className="ml-3 text-gray-400">Archivierte Ausschreibungen werden geladen...</span>
          </div>
        ) : sortedTrades.length === 0 ? (
          <div className="text-center py-12">
            <ArchiveIcon size={64} className="text-gray-500 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-300 mb-2">Keine archivierten Ausschreibungen</h3>
            <p className="text-gray-400">
              {searchTerm || categoryFilter !== 'all' 
                ? 'Keine Ausschreibungen entsprechen den aktuellen Filterkriterien.'
                : 'Es wurden noch keine Ausschreibungen archiviert.'
              }
            </p>
          </div>
        ) : (
          <div className="grid gap-6">
            {sortedTrades.map((trade) => (
              <div
                key={trade.id}
                className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 p-6 hover:bg-white/15 transition-all duration-200"
              >
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Gewerk-Informationen */}
                  <div className="lg:col-span-2">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-white mb-2">{trade.title}</h3>
                        <p className="text-gray-400 text-sm mb-2">{trade.description}</p>
                        <div className="flex items-center gap-4 text-sm">
                          <span className="flex items-center gap-1 text-gray-400">
                            <Building size={14} />
                            {getCategoryLabel(trade.category)}
                          </span>
                          <span className="flex items-center gap-1 text-gray-400">
                            <Calendar size={14} />
                            Archiviert: {formatDate(trade.archived_at)}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <span className="px-3 py-1 bg-gray-600/30 text-gray-300 rounded-lg text-sm">
                          Archiviert
                        </span>
                      </div>
                    </div>

                    {/* Dienstleister */}
                    <div className="bg-white/5 rounded-lg p-4 mb-4">
                      <h4 className="text-white font-medium mb-2 flex items-center gap-2">
                        <User size={16} className="text-blue-400" />
                        Dienstleister
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-gray-400">Firma:</span>
                          <span className="text-white ml-2">{trade.service_provider?.company_name || 'Nicht verfügbar'}</span>
                        </div>
                        <div>
                          <span className="text-gray-400">Kontakt:</span>
                          <span className="text-white ml-2">{trade.service_provider?.contact_person || 'Nicht verfügbar'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Angenommenes Angebot */}
                    {trade.accepted_quote && (
                      <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                        <h4 className="text-green-300 font-medium mb-2 flex items-center gap-2">
                          <CheckCircle size={16} />
                          Angenommenes Angebot
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="text-gray-400">Betrag:</span>
                            <span className="text-white ml-2 font-medium">
                              {formatCurrency(trade.accepted_quote.amount)}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-400">Angenommen am:</span>
                            <span className="text-white ml-2">
                              {formatDate(trade.accepted_quote.accepted_at)}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Rechnung */}
                  <div>
                    {trade.invoice ? (
                      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                        <h4 className="text-blue-300 font-medium mb-3 flex items-center gap-2">
                          <FileText size={16} />
                          Rechnung
                        </h4>
                        
                        <div className="space-y-2 text-sm mb-4">
                          <div className="flex justify-between">
                            <span className="text-gray-400">Nummer:</span>
                            <span className="text-white">{trade.invoice.invoice_number}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Betrag:</span>
                            <span className="text-white font-medium">
                              {formatCurrency(trade.invoice.amount)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Status:</span>
                            <span className={`px-2 py-1 rounded text-xs ${
                              trade.invoice.status === 'paid' 
                                ? 'bg-green-500/20 text-green-300'
                                : 'bg-yellow-500/20 text-yellow-300'
                            }`}>
                              {trade.invoice.status === 'paid' ? 'Bezahlt' : 'Offen'}
                            </span>
                          </div>
                          {trade.invoice.paid_at && (
                            <div className="flex justify-between">
                              <span className="text-gray-400">Bezahlt am:</span>
                              <span className="text-white">{formatDate(trade.invoice.paid_at)}</span>
                            </div>
                          )}
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => {/* TODO: Implement view invoice */}}
                            className="flex items-center gap-1 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded transition-colors"
                          >
                            <Eye size={12} />
                            Anzeigen
                          </button>
                          <button
                            onClick={() => {/* TODO: Implement download invoice */}}
                            className="flex items-center gap-1 px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-xs rounded transition-colors"
                          >
                            <Download size={12} />
                            Download
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-gray-600/20 rounded-lg p-4 text-center">
                        <Clock size={24} className="text-gray-500 mx-auto mb-2" />
                        <p className="text-gray-400 text-sm">Keine Rechnung verfügbar</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Archive;
