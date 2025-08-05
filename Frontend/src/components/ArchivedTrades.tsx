import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Archive, 
  Search, 
  Filter, 
  Calendar, 
  Euro, 
  CheckCircle, 
  Clock, 
  FileText,
  Eye,
  Download,
  Star,
  ChevronDown,
  SortAsc,
  SortDesc
} from 'lucide-react';
import { api } from '../api/api';

interface ArchivedTrade {
  id: number;
  title: string;
  description: string;
  category: string;
  completion_status: string;
  completed_date: string;
  total_amount: number;
  currency: string;
  project_name: string;
  project_id: number;
  duration_days: number;
  client_rating?: number;
  invoice_status?: string;
  invoice_amount?: number;
}

interface ArchivedTradesProps {
  className?: string;
}

const ArchivedTrades: React.FC<ArchivedTradesProps> = ({ className = '' }) => {
  const { user } = useAuth();
  const [archivedTrades, setArchivedTrades] = useState<ArchivedTrade[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('completed_date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadArchivedTrades();
  }, []);

  const loadArchivedTrades = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.get('/milestones/archived');
      setArchivedTrades(response.data || []);
      console.log('✅ Archivierte Gewerke geladen:', response.data);
    } catch (err: any) {
      console.error('❌ Fehler beim Laden archivierter Gewerke:', err);
      setError('Fehler beim Laden der archivierten Gewerke.');
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    { value: 'all', label: 'Alle Kategorien' },
    { value: 'elektro', label: 'Elektroinstallation' },
    { value: 'sanitaer', label: 'Sanitär' },
    { value: 'heizung', label: 'Heizung' },
    { value: 'dach', label: 'Dach' },
    { value: 'fenster_tueren', label: 'Fenster & Türen' },
    { value: 'boden', label: 'Boden' },
    { value: 'wand', label: 'Wand' },
    { value: 'fundament', label: 'Fundament' },
    { value: 'garten', label: 'Garten & Landschaft' }
  ];

  const getCategoryIcon = (category: string) => {
    const iconMap: { [key: string]: React.ReactNode } = {
      'elektro': <div className="w-4 h-4 bg-yellow-400 rounded-full"></div>,
      'sanitaer': <div className="w-4 h-4 bg-blue-400 rounded-full"></div>,
      'heizung': <div className="w-4 h-4 bg-red-400 rounded-full"></div>,
      'dach': <div className="w-4 h-4 bg-orange-400 rounded-full"></div>,
      'fenster_tueren': <div className="w-4 h-4 bg-green-400 rounded-full"></div>,
      'boden': <div className="w-4 h-4 bg-purple-400 rounded-full"></div>,
      'wand': <div className="w-4 h-4 bg-pink-400 rounded-full"></div>,
      'fundament': <div className="w-4 h-4 bg-gray-400 rounded-full"></div>,
      'garten': <div className="w-4 h-4 bg-emerald-400 rounded-full"></div>
    };
    return iconMap[category] || <div className="w-4 h-4 bg-gray-400 rounded-full"></div>;
  };

  const getStatusBadge = (status: string, invoiceStatus?: string) => {
    if (invoiceStatus === 'paid') {
      return (
        <div className="inline-flex items-center gap-1 px-2 py-1 bg-green-500/20 border border-green-500/30 text-green-300 rounded-full text-xs font-medium">
          <CheckCircle size={12} />
          Abgerechnet
        </div>
      );
    }
    
    if (status === 'completed') {
      return (
        <div className="inline-flex items-center gap-1 px-2 py-1 bg-blue-500/20 border border-blue-500/30 text-blue-300 rounded-full text-xs font-medium">
          <Archive size={12} />
          Abgeschlossen
        </div>
      );
    }
    
    return (
      <div className="inline-flex items-center gap-1 px-2 py-1 bg-gray-500/20 border border-gray-500/30 text-gray-300 rounded-full text-xs font-medium">
        <Clock size={12} />
        Archiviert
      </div>
    );
  };

  const formatCurrency = (amount: number, currency: string = 'EUR') => {
    return new Intl.NumberFormat('de-DE', { 
      style: 'currency', 
      currency 
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const filteredAndSortedTrades = archivedTrades
    .filter(trade => {
      const matchesSearch = trade.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           trade.project_name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || trade.category === selectedCategory;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortBy) {
        case 'completed_date':
          aValue = new Date(a.completed_date);
          bValue = new Date(b.completed_date);
          break;
        case 'title':
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        case 'total_amount':
          aValue = a.total_amount;
          bValue = b.total_amount;
          break;
        case 'client_rating':
          aValue = a.client_rating || 0;
          bValue = b.client_rating || 0;
          break;
        default:
          return 0;
      }
      
      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

  if (loading) {
    return (
      <div className={`bg-gradient-to-br from-[#1a1a2e] to-[#2c3539] rounded-2xl p-6 border border-white/10 ${className}`}>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#ffbd59]"></div>
          <span className="ml-3 text-white">Lade archivierte Gewerke...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-gradient-to-br from-[#1a1a2e] to-[#2c3539] rounded-2xl p-6 border border-white/10 ${className}`}>
        <div className="text-center py-8">
          <div className="text-red-400 mb-2">❌ {error}</div>
          <button
            onClick={loadArchivedTrades}
            className="px-4 py-2 bg-[#ffbd59] text-[#1a1a2e] rounded-lg hover:bg-[#ffa726] transition-colors text-sm font-medium"
          >
            Erneut versuchen
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-gradient-to-br from-[#1a1a2e] to-[#2c3539] rounded-2xl border border-white/10 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-[#51636f] to-[#3a4a57] rounded-xl">
            <Archive size={24} className="text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Archivierte Gewerke</h2>
            <p className="text-sm text-gray-400">
              {filteredAndSortedTrades.length} von {archivedTrades.length} Gewerken
            </p>
          </div>
        </div>
        
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 px-4 py-2 bg-[#51636f] text-white rounded-lg hover:bg-[#3a4a57] transition-colors"
        >
          <Filter size={16} />
          Filter
          <ChevronDown size={16} className={`transform transition-transform ${showFilters ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Filter & Search */}
      {showFilters && (
        <div className="p-6 border-b border-white/10 bg-white/5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Suche */}
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Gewerk oder Projekt suchen..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent"
              />
            </div>

            {/* Kategorie Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent"
            >
              {categories.map(category => (
                <option key={category.value} value={category.value} className="bg-[#2c3539] text-white">
                  {category.label}
                </option>
              ))}
            </select>

            {/* Sortierung */}
            <div className="flex gap-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="flex-1 px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent"
              >
                <option value="completed_date" className="bg-[#2c3539] text-white">Abschlussdatum</option>
                <option value="title" className="bg-[#2c3539] text-white">Titel</option>
                <option value="total_amount" className="bg-[#2c3539] text-white">Betrag</option>
                <option value="client_rating" className="bg-[#2c3539] text-white">Bewertung</option>
              </select>
              
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white hover:bg-white/20 transition-colors"
              >
                {sortOrder === 'asc' ? <SortAsc size={16} /> : <SortDesc size={16} />}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="p-6">
        {filteredAndSortedTrades.length === 0 ? (
          <div className="text-center py-12">
            <Archive size={48} className="mx-auto mb-4 text-gray-400 opacity-50" />
            <h3 className="text-lg font-semibold text-white mb-2">Keine archivierten Gewerke</h3>
            <p className="text-gray-400">
              {searchTerm || selectedCategory !== 'all' 
                ? 'Keine Gewerke entsprechen den aktuellen Filterkriterien.'
                : 'Abgeschlossene Gewerke werden hier archiviert und können jederzeit eingesehen werden.'
              }
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAndSortedTrades.map((trade) => (
              <div
                key={trade.id}
                className="bg-white/5 rounded-lg border border-white/10 hover:border-[#ffbd59]/30 transition-all duration-200 hover:shadow-lg group"
              >
                {/* Card Header */}
                <div className="p-4 border-b border-white/10">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {getCategoryIcon(trade.category)}
                      <h3 className="font-semibold text-white group-hover:text-[#ffbd59] transition-colors">
                        {trade.title}
                      </h3>
                    </div>
                    {getStatusBadge(trade.completion_status, trade.invoice_status)}
                  </div>
                  
                  <p className="text-sm text-gray-400 mb-3" style={{
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                  }}>
                    {trade.description}
                  </p>
                  
                  <div className="text-xs text-gray-500">
                    Projekt: {trade.project_name}
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-4 space-y-3">
                  {/* Betrag & Bewertung */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <Euro size={14} className="text-[#ffbd59]" />
                      <span className="font-semibold text-[#ffbd59]">
                        {formatCurrency(trade.total_amount, trade.currency)}
                      </span>
                    </div>
                    
                    {trade.client_rating && (
                      <div className="flex items-center gap-1">
                        <Star size={14} className="text-yellow-400 fill-current" />
                        <span className="text-sm text-white">{trade.client_rating}/5</span>
                      </div>
                    )}
                  </div>

                  {/* Datum & Dauer */}
                  <div className="flex items-center justify-between text-sm text-gray-400">
                    <div className="flex items-center gap-1">
                      <Calendar size={14} />
                      <span>Abgeschlossen: {formatDate(trade.completed_date)}</span>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <Clock size={14} />
                      <span>{trade.duration_days} Tage</span>
                    </div>
                  </div>

                  {/* Rechnung Status */}
                  {trade.invoice_status && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">Rechnung:</span>
                      <div className="flex items-center gap-2">
                        <span className={`font-medium ${
                          trade.invoice_status === 'paid' ? 'text-green-400' : 
                          trade.invoice_status === 'pending' ? 'text-yellow-400' : 'text-gray-400'
                        }`}>
                          {trade.invoice_status === 'paid' ? 'Bezahlt' : 
                           trade.invoice_status === 'pending' ? 'Ausstehend' : 'Offen'}
                        </span>
                        {trade.invoice_amount && (
                          <span className="text-white font-semibold">
                            {formatCurrency(trade.invoice_amount, trade.currency)}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Card Actions */}
                <div className="p-4 border-t border-white/10">
                  <div className="flex items-center gap-2">
                    <button className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-[#51636f] text-white rounded-lg hover:bg-[#3a4a57] transition-colors text-sm">
                      <Eye size={14} />
                      Ansehen
                    </button>
                    
                    <button className="flex items-center justify-center gap-2 px-3 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors text-sm">
                      <Download size={14} />
                    </button>
                    
                    <button className="flex items-center justify-center gap-2 px-3 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors text-sm">
                      <FileText size={14} />
                    </button>
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

export default ArchivedTrades;