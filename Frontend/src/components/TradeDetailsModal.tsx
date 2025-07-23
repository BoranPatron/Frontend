import React, { useState, useEffect } from 'react';
import { 
  X, 
  Calendar, 
  TrendingUp, 
  Shield, 
  FileText, 
  Wrench, 
  Euro, 
  Clock, 
  User, 
  Phone, 
  Mail, 
  Globe,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Info,
  Download,
  Eye,
  Settings,
  Target,
  BarChart3,
  MapPin,
  Tag,
  Star,
  Award,
  File,
  FolderOpen,
  AlertCircle,
  Zap,
  Thermometer,
  Droplets,
  Sun,
  Home,
  TreePine,
  Hammer,
  Ruler,
  Palette,
  Layers,
  Anchor,
  Sprout,
  Check,
  ThumbsDown,
  MessageSquare,
  Send,
  Building,
  Map,
  Navigation,
  Compass
} from 'lucide-react';

interface TradeDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  trade: any;
  quotes?: any[];
  project?: any;
}

export default function TradeDetailsModal({ 
  isOpen, 
  onClose, 
  trade, 
  quotes = [],
  project
}: TradeDetailsModalProps) {
  const [loading, setLoading] = useState(false);
  const [userQuote, setUserQuote] = useState<any>(null);
  const [hasUserQuote, setHasUserQuote] = useState(false);
  const [allQuotes, setAllQuotes] = useState<any[]>([]);

  // Lade Quotes für das Gewerk
  useEffect(() => {
    if (trade && isOpen) {
      loadQuotesForTrade();
    }
  }, [trade, isOpen]);

  const loadQuotesForTrade = async () => {
    if (!trade) return;
    
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      if (!token) return;

      // Lade alle Quotes für das Gewerk
      const response = await fetch(`/api/v1/quotes/milestone/${trade.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setAllQuotes(data.quotes || []);
        
        // Prüfe ob der aktuelle Benutzer bereits ein Angebot abgegeben hat
        const currentUserId = parseInt(localStorage.getItem('userId') || '0');
        const userQuote = data.quotes?.find((q: any) => q.service_provider_id === currentUserId);
        setUserQuote(userQuote || null);
        setHasUserQuote(!!userQuote);
      }
    } catch (error) {
      console.error('Fehler beim Laden der Quotes:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !trade) return null;

  const getCategoryIcon = (category: string) => {
    const iconMap: { [key: string]: React.ReactNode } = {
      'elektro': <Zap size={20} className="text-yellow-400" />,
      'sanitaer': <Droplets size={20} className="text-blue-400" />,
      'heizung': <Thermometer size={20} className="text-red-400" />,
      'dach': <Sun size={20} className="text-orange-400" />,
      'fenster_tueren': <Home size={20} className="text-green-400" />,
      'boden': <Layers size={20} className="text-brown-400" />,
      'wand': <Palette size={20} className="text-purple-400" />,
      'fundament': <Anchor size={20} className="text-gray-400" />,
      'garten': <Sprout size={20} className="text-green-400" />,
      'eigene': <Settings size={20} className="text-gray-400" />
    };
    return iconMap[category] || <Wrench size={20} className="text-gray-400" />;
  };

  const getCategoryLabel = (category: string) => {
    const labelMap: { [key: string]: string } = {
      'elektro': 'Elektroinstallation',
      'sanitaer': 'Sanitär',
      'heizung': 'Heizung',
      'dach': 'Dach',
      'fenster_tueren': 'Fenster & Türen',
      'boden': 'Boden',
      'wand': 'Wand',
      'fundament': 'Fundament',
      'garten': 'Garten & Landschaft',
      'eigene': 'Eigene Kategorie'
    };
    return labelMap[category] || category;
  };

  const getStatusLabel = (status: string) => {
    const statusMap: { [key: string]: string } = {
      'planning': 'Planung',
      'cost_estimate': 'Kostenvoranschlag',
      'tender': 'Ausschreibung',
      'bidding': 'Angebote',
      'evaluation': 'Bewertung',
      'awarded': 'Vergeben',
      'in_progress': 'In Bearbeitung',
      'completed': 'Abgeschlossen',
      'delayed': 'Verzögert',
      'cancelled': 'Storniert'
    };
    return statusMap[status] || status;
  };

  const getStatusColor = (status: string) => {
    const colorMap: { [key: string]: string } = {
      'planning': 'bg-blue-500/20 border-blue-500/30 text-blue-300',
      'cost_estimate': 'bg-yellow-500/20 border-yellow-500/30 text-yellow-300',
      'tender': 'bg-purple-500/20 border-purple-500/30 text-purple-300',
      'bidding': 'bg-indigo-500/20 border-indigo-500/30 text-indigo-300',
      'evaluation': 'bg-pink-500/20 border-pink-500/30 text-pink-300',
      'awarded': 'bg-green-500/20 border-green-500/30 text-green-300',
      'in_progress': 'bg-cyan-500/20 border-cyan-500/30 text-cyan-300',
      'completed': 'bg-emerald-500/20 border-emerald-500/30 text-emerald-300',
      'delayed': 'bg-orange-500/20 border-orange-500/30 text-orange-300',
      'cancelled': 'bg-red-500/20 border-red-500/30 text-red-300'
    };
    return colorMap[status] || 'bg-gray-500/20 border-gray-500/30 text-gray-300';
  };

  const getPriorityLabel = (priority: string) => {
    const priorityMap: { [key: string]: string } = {
      'low': 'Niedrig',
      'medium': 'Mittel',
      'high': 'Hoch',
      'critical': 'Kritisch'
    };
    return priorityMap[priority] || priority;
  };

  const getPriorityColor = (priority: string) => {
    const colorMap: { [key: string]: string } = {
      'low': 'bg-green-500/20 border-green-500/30 text-green-300',
      'medium': 'bg-yellow-500/20 border-yellow-500/30 text-yellow-300',
      'high': 'bg-orange-500/20 border-orange-500/30 text-orange-300',
      'critical': 'bg-red-500/20 border-red-500/30 text-red-300'
    };
    return colorMap[priority] || 'bg-gray-500/20 border-gray-500/30 text-gray-300';
  };

  const formatCurrency = (amount: number, currency: string = 'EUR') => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Nicht angegeben';
    return new Date(dateString).toLocaleDateString('de-DE');
  };

  const handleSubmitQuote = () => {
    // Hier würde die Logik für das Abgeben eines Angebots implementiert
    console.log('Angebot abgeben für Gewerk:', trade.id);
    // Navigation zur Angebotsformular-Seite oder Modal öffnen
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#2c3539] rounded-2xl shadow-2xl border border-white/20 max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-[#ffbd59] to-[#ffa726] rounded-xl">
              {getCategoryIcon(trade.category || '')}
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Gewerk Details</h2>
              <p className="text-sm text-gray-400">{trade.title}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X size={24} className="text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="p-6 space-y-6">
            {/* Gewerk Übersicht */}
            <div className="bg-white/5 rounded-lg p-4">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-[#ffbd59] to-[#ffa726] rounded-lg">
                    {getCategoryIcon(trade.category || '')}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">{trade.title}</h3>
                    <p className="text-sm text-gray-400">{trade.description}</p>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(trade.status)}`}>
                    {getStatusLabel(trade.status)}
                  </span>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(trade.priority)}`}>
                    {getPriorityLabel(trade.priority)}
                  </span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-400">Kategorie:</span>
                  <div className="text-white">{getCategoryLabel(trade.category || '')}</div>
                </div>
                <div>
                  <span className="text-gray-400">Status:</span>
                  <div className="text-white">{getStatusLabel(trade.status)}</div>
                </div>
                <div>
                  <span className="text-gray-400">Priorität:</span>
                  <div className="text-white">{getPriorityLabel(trade.priority)}</div>
                </div>
                <div>
                  <span className="text-gray-400">Geplant:</span>
                  <div className="text-white">{formatDate(trade.planned_date)}</div>
                </div>
              </div>
            </div>

            {/* Projekt Informationen */}
            {project && (
              <div className="bg-white/5 rounded-lg p-4">
                <h4 className="font-semibold text-white flex items-center gap-2 mb-3">
                  <Building size={16} className="text-[#ffbd59]" />
                  Projekt Informationen
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-400">Projektname:</span>
                    <div className="text-white">{project.name}</div>
                  </div>
                  <div>
                    <span className="text-gray-400">Projekttyp:</span>
                    <div className="text-white">{project.project_type || 'Nicht angegeben'}</div>
                  </div>
                  {project.address_street && (
                    <div className="md:col-span-2">
                      <span className="text-gray-400">Adresse:</span>
                      <div className="text-white flex items-center gap-1">
                        <MapPin size={14} />
                        {project.address_street}, {project.address_zip} {project.address_city}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Zeitplan & Budget */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white/5 rounded-lg p-4">
                <h4 className="font-semibold text-white flex items-center gap-2 mb-3">
                  <Calendar size={16} className="text-[#ffbd59]" />
                  Zeitplan
                </h4>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Geplant:</span>
                    <span className="text-white">{formatDate(trade.planned_date)}</span>
                  </div>
                  {trade.start_date && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Start:</span>
                      <span className="text-white">{formatDate(trade.start_date)}</span>
                    </div>
                  )}
                  {trade.end_date && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Ende:</span>
                      <span className="text-white">{formatDate(trade.end_date)}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Fortschritt:</span>
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-gray-700 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-[#ffbd59] to-[#ffa726] h-2 rounded-full"
                          style={{ width: `${trade.progress_percentage || 0}%` }}
                        />
                      </div>
                      <span className="text-white text-xs">{trade.progress_percentage || 0}%</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white/5 rounded-lg p-4">
                <h4 className="font-semibold text-white flex items-center gap-2 mb-3">
                  <Euro size={16} className="text-[#ffbd59]" />
                  Budget & Kosten
                </h4>
                <div className="space-y-3 text-sm">
                  {trade.budget && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Budget:</span>
                      <span className="text-white font-medium">{formatCurrency(trade.budget)}</span>
                    </div>
                  )}
                  {trade.actual_costs && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Aktuelle Kosten:</span>
                      <span className="text-white">{formatCurrency(trade.actual_costs)}</span>
                    </div>
                  )}
                  {trade.contractor && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Auftragnehmer:</span>
                      <span className="text-white">{trade.contractor}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Angebote Übersicht */}
            <div className="bg-white/5 rounded-lg p-4">
              <h4 className="font-semibold text-white flex items-center gap-2 mb-3">
                <FileText size={16} className="text-[#ffbd59]" />
                Angebote ({allQuotes.length})
              </h4>
              
              {allQuotes.length === 0 ? (
                <div className="text-center py-6 text-gray-400">
                  <FileText size={32} className="mx-auto mb-2 opacity-50" />
                  <p>Noch keine Angebote vorhanden</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {allQuotes.slice(0, 3).map((quote: any) => (
                    <div key={quote.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                        <div>
                          <div className="text-white font-medium">{quote.company_name || 'Unbekannt'}</div>
                          <div className="text-sm text-gray-400">{quote.contact_person}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-white font-medium">{formatCurrency(quote.total_amount, quote.currency)}</div>
                        <div className="text-sm text-gray-400">{quote.status}</div>
                      </div>
                    </div>
                  ))}
                  {allQuotes.length > 3 && (
                    <div className="text-center text-[#ffbd59] text-sm">
                      +{allQuotes.length - 3} weitere Angebote
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Benutzer-spezifische Aktionen */}
            {hasUserQuote ? (
              <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                <div className="flex items-center gap-2 text-green-300 mb-2">
                  <CheckCircle size={16} />
                  <span className="font-medium">Ihr Angebot bereits abgegeben</span>
                </div>
                <p className="text-sm text-green-200">
                  Sie haben bereits ein Angebot für dieses Gewerk abgegeben.
                </p>
              </div>
            ) : (
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                <div className="flex items-center gap-2 text-blue-300 mb-2">
                  <Info size={16} />
                  <span className="font-medium">Angebot abgeben</span>
                </div>
                <p className="text-sm text-blue-200 mb-3">
                  Sie haben noch kein Angebot für dieses Gewerk abgegeben.
                </p>
                <button
                  onClick={handleSubmitQuote}
                  className="px-4 py-2 bg-[#ffbd59] text-[#2c3539] rounded-lg font-medium hover:bg-[#ffa726] transition-colors"
                >
                  Angebot abgeben
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 