import React, { useState, useEffect } from 'react';
import { 
  X, 
  Eye, 
  Download, 
  ExternalLink, 
  FileText, 
  ChevronUp, 
  ChevronDown,
  User,
  Mail,
  Phone,
  Globe,
  Calendar,
  MapPin,
  Euro,
  CheckCircle,
  Clock,
  AlertTriangle,
  Star,
  Building,
  Wrench,
  Hammer,
  TreePine,
  Droplets,
  Thermometer,
  Zap,
  MessageCircle,
  Calculator,
  Map,
  List
} from 'lucide-react';
import type { TradeSearchResult } from '../api/geoService';
// import { getQuotesByTrade } from '../api/quoteService';
import { useAuth } from '../context/AuthContext';
import CostEstimateForm from './CostEstimateForm';
import { getAuthenticatedFileUrl, getApiBaseUrl } from '../api/api';
// import FullDocumentViewer from './DocumentViewer';

// PDF Viewer Komponente
const PDFViewer: React.FC<{ url: string; filename: string; onError: (error: string) => void }> = ({ url, filename, onError }) => {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadPDF = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        onError('Kein Authentifizierungstoken verfügbar');
        return;
      }

      // Versuche Document-ID aus URL zu extrahieren
      const documentId = extractDocumentIdFromUrl(url);
      if (documentId) {
        const baseUrl = getApiBaseUrl();
        const response = await fetch(`${baseUrl}/documents/${documentId}/content`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const blob = await response.blob();
          const objectUrl = URL.createObjectURL(blob);
          setPdfUrl(objectUrl);
        } else {
          throw new Error('PDF konnte nicht geladen werden');
        }
      } else {
        // Fallback: Verwende die authentifizierte URL
        const authenticatedUrl = getAuthenticatedFileUrl(url);
        setPdfUrl(authenticatedUrl);
      }
    } catch (error) {
      console.error('❌ Fehler beim Laden des PDFs:', error);
      onError('PDF konnte nicht geladen werden');
    } finally {
      setLoading(false);
    }
  };

  // Hilfsfunktion um Document-ID aus URL zu extrahieren
  const extractDocumentIdFromUrl = (url: string): string | null => {
    const patterns = [
      /\/documents\/(\d+)\//,
      /document_(\d+)/,
      /(\d+)\.(pdf|doc|docx|txt)$/,
      /\/storage\/uploads\/project_\d+\/(\d+)\./
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        return match[1];
      }
    }
    return null;
  };

  useEffect(() => {
    loadPDF();
  }, [url]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#ffbd59] mx-auto mb-2"></div>
          <p className="text-gray-400 text-sm">Lade PDF...</p>
        </div>
      </div>
    );
  }

  if (!pdfUrl) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-red-400 text-sm">PDF konnte nicht geladen werden</p>
        </div>
      </div>
    );
  }

  return (
    <iframe
      src={pdfUrl}
      width="100%"
      height="100%"
      frameBorder="0"
      className="rounded-b border-0"
      title={filename}
    />
  );
};

interface TradeDetailsModalProps {
  trade: TradeSearchResult | null;
  isOpen: boolean;
  onClose: () => void;
  onCreateQuote: (trade: TradeSearchResult) => void;
  existingQuotes?: Quote[];
}

interface Quote {
  id: number;
  service_provider_id: number;
  status: string;
  total_price: number;
  created_at: string;
  service_provider_name?: string;
}

interface DocumentViewerProps {
  documents: Array<{
    id: number | string;
    title?: string;
    name?: string;
    file_name?: string;
    url?: string;
    file_path?: string;
    type?: string;
    mime_type?: string;
    size?: number;
    file_size?: number;
  }>;
  existingQuotes: Quote[];
}

function TradeDocumentViewer({ documents, existingQuotes }: DocumentViewerProps) {
  const [selectedDoc, setSelectedDoc] = useState<string | null>(null);
  const [viewerError, setViewerError] = useState<string | null>(null);
  const { isBautraeger } = useAuth();

  console.log('🔍 TradeDocumentViewer - Debug:', {
    documents,
    documentsLength: documents?.length,
    isBautraeger: isBautraeger(),
    existingQuotes
  });

  if (!documents || documents.length === 0) {
    return (
      <div className="bg-gradient-to-br from-[#2c3539]/30 to-[#1a1a2e]/30 rounded-xl p-6 border border-gray-600/30 backdrop-blur-sm">
        <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
          <FileText size={18} className="text-[#ffbd59]" />
          Dokumente
        </h3>
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <FileText size={48} className="text-gray-500 mx-auto mb-3 opacity-50" />
            <p className="text-gray-400 text-sm">
              {isBautraeger() 
                ? 'Keine Dokumente für dieses Gewerk vorhanden' 
                : 'Keine Dokumente für dieses Gewerk freigegeben'
              }
            </p>
            <p className="text-gray-500 text-xs mt-1">
              {isBautraeger() 
                ? 'Dokumente können über die Projektverwaltung hinzugefügt werden' 
                : 'Dokumente werden nach Angebotsannahme verfügbar'
              }
            </p>
          </div>
        </div>
      </div>
    );
  }

  const getFileIcon = (doc: any) => {
    const type = doc.type || doc.mime_type || '';
    if (type && type.includes('pdf')) return '📄';
    if (type && (type.includes('word') || type.includes('document'))) return '📝';
    if (type && (type.includes('presentation') || type.includes('powerpoint'))) return '📊';
    return '📁';
  };

  const canPreview = (doc: any) => {
    const type = doc.type || doc.mime_type || '';
    return type && (type.includes('pdf') || 
           type.includes('word') || 
           type.includes('document') ||
           type.includes('presentation') || 
           type.includes('powerpoint'));
  };

  const getViewerUrl = (doc: any) => {
    const url = doc.url || doc.file_path || '';
    const type = doc.type || doc.mime_type || '';
    
    if (type && type.includes('pdf')) {
      const documentId = extractDocumentIdFromUrl(url);
      if (documentId) {
        const baseUrl = getApiBaseUrl();
        return `${baseUrl}/documents/${documentId}/content`;
      }
      return getAuthenticatedFileUrl(url);
    }
    
    if (type && (type.includes('word') || type.includes('document') || 
        type.includes('presentation') || type.includes('powerpoint'))) {
      const authenticatedUrl = getAuthenticatedFileUrl(url);
      return `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(authenticatedUrl)}`;
    }
    
    return getAuthenticatedFileUrl(url);
  };

  const extractDocumentIdFromUrl = (url: string): string | null => {
    const patterns = [
      /\/documents\/(\d+)\//,
      /document_(\d+)/,
      /(\d+)\.(pdf|doc|docx|txt)$/,
      /\/storage\/uploads\/project_\d+\/(\d+)\./
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        return match[1];
      }
    }
    return null;
  };

  return (
    <div className="bg-gradient-to-br from-[#2c3539]/30 to-[#1a1a2e]/30 rounded-xl p-6 border border-gray-600/30 backdrop-blur-sm">
      <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
        <FileText size={18} className="text-[#ffbd59]" />
        Dokumente ({documents.length})
      </h3>
      
      {viewerError && (
        <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
          <p className="text-red-400 text-sm">{viewerError}</p>
        </div>
      )}
      
      <div className="space-y-3">
        {documents.map((doc) => {
          if (!doc) {
            return null;
          }
          
          return (
            <div key={doc.id} className="bg-gradient-to-br from-[#1a1a2e]/50 to-[#2c3539]/50 rounded-lg border border-gray-600/30 p-4 hover:border-[#ffbd59]/50 transition-all duration-200 group">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-[#ffbd59] to-[#ffa726] rounded-lg flex items-center justify-center text-white font-bold shadow-lg">
                    {getFileIcon(doc)}
                  </div>
                  <div>
                    <p className="font-medium text-white group-hover:text-[#ffbd59] transition-colors">
                      {doc.name || doc.title || doc.file_name || 'Unbekanntes Dokument'}
                    </p>
                    <p className="text-sm text-gray-400">
                      {((doc.size || doc.file_size || 0) / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {canPreview(doc) && (
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        
                        if (doc.type && doc.type.includes('pdf')) {
                          const token = localStorage.getItem('token');
                          if (!token) {
                            setViewerError('Kein Authentifizierungstoken verfügbar');
                            return;
                          }
                          
                          const documentId = extractDocumentIdFromUrl(doc.url || doc.file_path || '');
                          if (documentId) {
                            setSelectedDoc(selectedDoc === String(doc.id) ? null : String(doc.id));
                            setViewerError(null);
                            return;
                          }
                        }
                        
                        setSelectedDoc(selectedDoc === String(doc.id) ? null : String(doc.id));
                        setViewerError(null);
                      }}
                      className={`flex items-center gap-1 px-3 py-2 rounded-lg transition-all duration-200 text-sm font-medium ${
                        selectedDoc === String(doc.id)
                          ? 'bg-[#ffbd59] text-[#1a1a2e] shadow-lg'
                          : 'bg-[#ffbd59]/20 text-[#ffbd59] hover:bg-[#ffbd59]/30'
                      }`}
                      title="Dokument anzeigen"
                    >
                      <Eye size={14} />
                      {selectedDoc === String(doc.id) ? 'Schließen' : 'Ansehen'}
                    </button>
                  )}
                  
                  {(isBautraeger() || existingQuotes.some((quote: Quote) => quote.status === 'accepted')) && (
                    <a
                      href={getAuthenticatedFileUrl(doc.url || doc.file_path || '')}
                      download={doc.name || doc.title || doc.file_name || 'document'}
                      className="flex items-center gap-1 px-3 py-2 bg-green-600/20 text-green-400 rounded-lg hover:bg-green-600/30 transition-all duration-200 text-sm font-medium"
                      title={isBautraeger() ? "Dokument herunterladen" : "Dokument herunterladen (nur nach Angebotsannahme)"}
                    >
                      <Download size={14} />
                      Download
                    </a>
                  )}
                  
                  <button
                    onClick={async (e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      
                      try {
                        const token = localStorage.getItem('token');
                        if (!token) {
                          alert('Kein Authentifizierungstoken verfügbar');
                          return;
                        }
                        
                        const documentId = extractDocumentIdFromUrl(doc.url || doc.file_path || '');
                        if (documentId) {
                          const baseUrl = getApiBaseUrl();
                          const response = await fetch(`${baseUrl}/documents/${documentId}/content`, {
                            headers: {
                              'Authorization': `Bearer ${token}`
                            }
                          });
                          
                          if (response.ok) {
                            const blob = await response.blob();
                            const url = URL.createObjectURL(blob);
                            window.open(url, '_blank');
                            setTimeout(() => URL.revokeObjectURL(url), 1000);
                          } else {
                            throw new Error('Dokument konnte nicht geladen werden');
                          }
                        } else {
                          const authenticatedUrl = getAuthenticatedFileUrl(doc.url || doc.file_path || '');
                          window.open(authenticatedUrl, '_blank');
                        }
                      } catch (error) {
                        console.error('❌ Fehler beim Öffnen des Dokuments:', error);
                        alert('Dokument konnte nicht geöffnet werden');
                      }
                    }}
                    className="flex items-center gap-1 px-3 py-2 bg-blue-600/20 text-blue-400 rounded-lg hover:bg-blue-600/30 transition-all duration-200 text-sm font-medium"
                    title="In neuem Tab öffnen"
                  >
                    <ExternalLink size={14} />
                    Öffnen
                  </button>
                </div>
              </div>
              
              {selectedDoc === String(doc.id) && (
                <div className="mt-4 bg-gradient-to-br from-[#1a1a2e]/80 to-[#2c3539]/80 rounded-lg border border-gray-600/50 overflow-hidden">
                  <div className="flex items-center justify-between p-3 border-b border-gray-600/30">
                    <div className="flex items-center gap-2">
                      <FileText size={16} className="text-[#ffbd59]" />
                      <span className="text-white font-medium">
                        {doc.name || doc.title || doc.file_name || 'Dokument'}
                      </span>
                    </div>
                    <button
                      onClick={() => setSelectedDoc(null)}
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      <X size={16} />
                    </button>
                  </div>
                  <div style={{ height: '400px' }} className="relative">
                    {doc.type && doc.type.includes('pdf') ? (
                      <PDFViewer 
                        url={doc.url || doc.file_path || ''} 
                        filename={doc.name || doc.title || doc.file_name || 'document'}
                        onError={(error: string) => {
                          console.error(`❌ PDF Viewer Fehler:`, error);
                          setViewerError('PDF konnte nicht geladen werden');
                        }}
                      />
                    ) : (
                      <iframe
                        src={getViewerUrl(doc)}
                        width="100%"
                        height="100%"
                        frameBorder="0"
                        className="rounded-b border-0"
                        onError={() => {
                          setViewerError('Das Dokument konnte nicht geladen werden');
                        }}
                      />
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function TradeDetailsModal({ 
  trade, 
  isOpen, 
  onClose, 
  onCreateQuote, 
  existingQuotes = [] 
}: TradeDetailsModalProps) {
  const { user, isBautraeger } = useAuth();
  const [loading, setLoading] = useState(false);
  const [userHasQuote, setUserHasQuote] = useState(false);
  const [userQuote, setUserQuote] = useState<Quote | null>(null);
  const [showCostEstimateForm, setShowCostEstimateForm] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  console.log('🔍 TradeDetailsModal - Hauptkomponente gerendert:', {
    isOpen,
    tradeId: trade?.id,
    documents: trade?.documents,
    documentsLength: trade?.documents?.length,
    isBautraeger: isBautraeger(),
    existingQuotes: existingQuotes
  });

  useEffect(() => {
    if (isOpen && trade) {
      setLoading(true);
      
      const userQuote = existingQuotes.find(quote => quote.service_provider_id === user?.id);
      if (userQuote) {
        setUserHasQuote(true);
        setUserQuote(userQuote);
      } else {
        setUserHasQuote(false);
        setUserQuote(null);
      }
      
      setLoading(false);
    }
  }, [isOpen, trade, existingQuotes, user?.id]);

  const getCategoryIcon = (category: string) => {
    const iconMap: { [key: string]: { color: string; icon: React.ReactNode } } = {
      'electrical': { color: '#fbbf24', icon: <span className="text-lg">⚡</span> },
      'plumbing': { color: '#3b82f6', icon: <span className="text-lg">🔧</span> },
      'heating': { color: '#ef4444', icon: <span className="text-lg">🔥</span> },
      'roofing': { color: '#f97316', icon: <span className="text-lg">🏠</span> },
      'windows': { color: '#10b981', icon: <span className="text-lg">🪟</span> },
      'flooring': { color: '#8b5cf6', icon: <span className="text-lg">📐</span> },
      'walls': { color: '#ec4899', icon: <span className="text-lg">🧱</span> },
      'foundation': { color: '#6b7280', icon: <span className="text-lg">🏗️</span> },
      'landscaping': { color: '#22c55e', icon: <span className="text-lg">🌱</span> }
    };
    
    return iconMap[category] || { color: '#6b7280', icon: <span className="text-lg">🔧</span> };
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planned': return 'text-blue-400';
      case 'in_progress': return 'text-yellow-400';
      case 'completed': return 'text-green-400';
      case 'delayed': return 'text-red-400';
      case 'cancelled': return 'text-gray-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'planned': return 'Geplant';
      case 'in_progress': return 'In Bearbeitung';
      case 'completed': return 'Abgeschlossen';
      case 'delayed': return 'Verzögert';
      case 'cancelled': return 'Storniert';
      default: return status;
    }
  };

  const getQuoteStatusColor = (status: string) => {
    switch (status) {
      case 'accepted': return 'text-green-400';
      case 'submitted': return 'text-yellow-400';
      case 'rejected': return 'text-red-400';
      case 'draft': return 'text-gray-400';
      default: return 'text-gray-400';
    }
  };

  const getQuoteStatusLabel = (status: string) => {
    switch (status) {
      case 'accepted': return 'Angenommen';
      case 'submitted': return 'Eingereicht';
      case 'rejected': return 'Abgelehnt';
      case 'draft': return 'Entwurf';
      default: return status;
    }
  };

  if (!isOpen || !trade) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-[#1a1a2e] to-[#2c3539] rounded-2xl shadow-2xl border border-gray-600/30 max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-600/30">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-[#ffbd59] to-[#ffa726] rounded-xl flex items-center justify-center text-white font-bold shadow-lg">
              {getCategoryIcon(trade.category || '').icon}
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">{trade.title}</h2>
              <p className="text-gray-400 text-sm">{trade.category}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors p-2 rounded-lg hover:bg-white/10"
          >
            <X size={24} />
          </button>
        </div>

        <div className="h-[calc(90vh-120px)] overflow-y-auto p-6">
          <div className="space-y-6">
            {/* Status und Priorität */}
            <div className="flex items-center gap-4">
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(trade.status)}`}>
                {getStatusLabel(trade.status)}
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-[#ffbd59]/20 text-[#ffbd59]">
                {trade.priority}
              </span>
            </div>

            {/* Beschreibung */}
            {trade.description && (
              <div className="bg-gradient-to-br from-[#1a1a2e]/50 to-[#2c3539]/50 rounded-xl p-6 border border-gray-600/30">
                <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                  <FileText size={18} className="text-[#ffbd59]" />
                  Beschreibung
                </h3>
                <p className="text-gray-300 leading-relaxed">{trade.description}</p>
              </div>
            )}

            {/* Projekt-Informationen */}
            <div className="bg-gradient-to-br from-[#1a1a2e]/50 to-[#2c3539]/50 rounded-xl p-6 border border-gray-600/30">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Building size={18} className="text-[#ffbd59]" />
                Projekt-Informationen
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <span className="text-sm font-medium text-gray-400">Projektname</span>
                  <p className="text-white">{trade.project_name || 'Nicht angegeben'}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-400">Projekttyp</span>
                  <p className="text-white">{trade.project_type || 'Nicht angegeben'}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-400">Projekt-Status</span>
                  <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(trade.project_status)}`}>
                    {getStatusLabel(trade.project_status)}
                  </span>
                </div>
                {trade.budget && (
                  <div>
                    <span className="text-sm font-medium text-gray-400">Budget</span>
                    <p className="text-white font-bold">{trade.budget.toLocaleString('de-DE')} €</p>
                  </div>
                )}
              </div>
            </div>

            {/* Standort */}
            <div className="bg-gradient-to-br from-[#1a1a2e]/50 to-[#2c3539]/50 rounded-xl p-6 border border-gray-600/30">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <MapPin size={18} className="text-[#ffbd59]" />
                Standort
              </h3>
              <div className="space-y-2">
                <p className="text-white">
                  {trade.address_street || 'Adresse nicht angegeben'}
                </p>
                <p className="text-gray-300">
                  {trade.address_zip} {trade.address_city}
                </p>
                {trade.distance_km && (
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <span>📍 Entfernung: {trade.distance_km.toFixed(1)} km</span>
                  </div>
                )}
              </div>
            </div>

            {/* Zeitplan */}
            <div className="bg-gradient-to-br from-[#1a1a2e]/50 to-[#2c3539]/50 rounded-xl p-6 border border-gray-600/30">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Calendar size={18} className="text-[#ffbd59]" />
                Zeitplan
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {trade.planned_date && (
                  <div>
                    <span className="text-sm font-medium text-gray-400">Geplantes Datum</span>
                    <p className="text-white">
                      {new Date(trade.planned_date).toLocaleDateString('de-DE')}
                    </p>
                  </div>
                )}
                {trade.start_date && (
                  <div>
                    <span className="text-sm font-medium text-gray-400">Startdatum</span>
                    <p className="text-white">
                      {new Date(trade.start_date).toLocaleDateString('de-DE')}
                    </p>
                  </div>
                )}
                {trade.end_date && (
                  <div>
                    <span className="text-sm font-medium text-gray-400">Enddatum</span>
                    <p className="text-white">
                      {new Date(trade.end_date).toLocaleDateString('de-DE')}
                    </p>
                  </div>
                )}
                {trade.created_at && (
                  <div>
                    <span className="text-sm font-medium text-gray-400">Erstellt am</span>
                    <p className="text-white">
                      {new Date(trade.created_at).toLocaleDateString('de-DE')}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Technische Details */}
            {trade.requires_inspection && (
              <div className="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-xl p-6 border border-yellow-500/30">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <CheckCircle size={18} className="text-yellow-400" />
                  Besichtigung
                </h3>
                <div className="flex items-center gap-2">
                  <CheckCircle size={20} className="text-yellow-400" />
                  <span className="text-yellow-300 font-medium">Vor-Ort-Besichtigung erforderlich</span>
                </div>
              </div>
            )}

            {/* Fortschritt */}
            {trade.progress_percentage !== undefined && (
              <div className="bg-gradient-to-br from-[#1a1a2e]/50 to-[#2c3539]/50 rounded-xl p-6 border border-gray-600/30">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Clock size={18} className="text-[#ffbd59]" />
                  Fortschritt
                </h3>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-gray-400">Fortschritt</span>
                  <span className="text-white font-bold">{trade.progress_percentage}%</span>
                </div>
                <div className="w-full bg-gray-600/30 rounded-full h-3">
                  <div 
                    className="bg-gradient-to-r from-[#ffbd59] to-[#ffa726] h-3 rounded-full transition-all duration-300 shadow-lg"
                    style={{ width: `${trade.progress_percentage}%` }}
                  ></div>
                </div>
              </div>
            )}

            {/* Angebote */}
            {existingQuotes && existingQuotes.length > 0 && (
              <div className="bg-gradient-to-br from-[#1a1a2e]/50 to-[#2c3539]/50 rounded-xl p-6 border border-gray-600/30">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Eye size={18} className="text-[#ffbd59]" />
                  Angebote ({existingQuotes.length})
                </h3>
                <div className="space-y-3">
                  {existingQuotes.map((quote) => (
                    <div key={quote.id} className="bg-gradient-to-br from-[#1a1a2e]/30 to-[#2c3539]/30 rounded-lg p-4 border border-gray-600/20">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-white font-medium">
                            {quote.service_provider_name || `Angebot #${quote.id}`}
                          </p>
                          <p className="text-gray-400 text-sm">
                            {new Date(quote.created_at).toLocaleDateString('de-DE')}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-white font-bold">
                            {quote.total_price.toLocaleString('de-DE')} €
                          </p>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getQuoteStatusColor(quote.status)}`}>
                            {getQuoteStatusLabel(quote.status)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Dokumente - Einklappbar */}
            <div className="bg-gradient-to-br from-[#1a1a2e]/50 to-[#2c3539]/50 rounded-xl border border-gray-600/30 overflow-hidden">
              <div className="flex items-center justify-between p-6 cursor-pointer hover:bg-[#1a1a2e]/30 transition-all duration-200" onClick={() => setIsExpanded(!isExpanded)}>
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <FileText size={18} className="text-[#ffbd59]" />
                  Dokumente ({trade.documents?.length || 0})
                </h3>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-400">
                    {isExpanded ? 'Einklappen' : 'Ausklappen'}
                  </span>
                  <div className={`transform transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
                    <ChevronDown size={20} className="text-[#ffbd59]" />
                  </div>
                </div>
              </div>
              
              {isExpanded && (
                <div className="border-t border-gray-600/30">
                  <TradeDocumentViewer documents={trade.documents || []} existingQuotes={existingQuotes} />
                </div>
              )}
            </div>

            {/* Dienstleister-spezifische Aktionen */}
            {!isBautraeger() && (
              <div className="bg-gradient-to-br from-[#1a1a2e]/50 to-[#2c3539]/50 rounded-xl p-6 border border-gray-600/30">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Calculator size={18} className="text-[#ffbd59]" />
                  Aktionen
                </h3>
                <button
                  onClick={() => onCreateQuote(trade)}
                  className="w-full bg-gradient-to-r from-[#ffbd59] to-[#ffa726] text-[#1a1a2e] font-semibold py-3 px-6 rounded-lg hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <Calculator size={20} />
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