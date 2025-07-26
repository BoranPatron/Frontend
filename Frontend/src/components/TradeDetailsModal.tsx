import React, { useState, useEffect } from 'react';
import { X, MapPin, Calendar, Euro, Building, User, Clock, CheckCircle, AlertTriangle, Plus, Eye } from 'lucide-react';
import type { TradeSearchResult } from '../api/geoService';
// import { getQuotesByTrade } from '../api/quoteService';
import { useAuth } from '../context/AuthContext';
import CostEstimateForm from './CostEstimateForm';

interface TradeDetailsModalProps {
  trade: TradeSearchResult | null;
  isOpen: boolean;
  onClose: () => void;
  onCreateQuote: (trade: TradeSearchResult) => void;
}

interface Quote {
  id: number;
  service_provider_id: number;
  status: string;
  total_price: number;
  created_at: string;
  service_provider_name?: string;
}

export default function TradeDetailsModal({ 
  trade, 
  isOpen, 
  onClose, 
  onCreateQuote 
}: TradeDetailsModalProps) {
  const { user } = useAuth();
  const [existingQuotes, setExistingQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCostEstimateForm, setShowCostEstimateForm] = useState(false);
  const [userHasQuote, setUserHasQuote] = useState(false);
  const [userQuote, setUserQuote] = useState<Quote | null>(null);

  // Lade existierende Angebote für das Gewerk
  useEffect(() => {
    if (trade && isOpen) {
      loadExistingQuotes();
    }
  }, [trade, isOpen]);

  const loadExistingQuotes = async () => {
    if (!trade) return;
    
    setLoading(true);
    try {
      // TODO: Implementiere getQuotesByTrade API-Call
      // const quotes = await getQuotesByTrade(trade.id);
      const quotes: Quote[] = []; // Temporär leer
      setExistingQuotes(quotes);
      
      // Prüfe ob aktueller User bereits ein Angebot abgegeben hat
      const currentUserQuote = quotes.find((q: Quote) => q.service_provider_id === user?.id);
      setUserHasQuote(!!currentUserQuote);
      setUserQuote(currentUserQuote || null);
      
      console.log('📋 Angebote geladen:', { 
        total: quotes.length, 
        userHasQuote: !!currentUserQuote,
        userQuote: currentUserQuote 
      });
    } catch (error) {
      console.error('❌ Fehler beim Laden der Angebote:', error);
      setExistingQuotes([]);
      setUserHasQuote(false);
      setUserQuote(null);
    } finally {
      setLoading(false);
    }
  };

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
    return iconMap[category] || { color: '#6b7280', icon: <span className="text-lg">🔨</span> };
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planning': return 'bg-blue-100 text-blue-800';
      case 'cost_estimate': return 'bg-yellow-100 text-yellow-800';
      case 'tender': return 'bg-purple-100 text-purple-800';
      case 'bidding': return 'bg-orange-100 text-orange-800';
      case 'evaluation': return 'bg-pink-100 text-pink-800';
      case 'awarded': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-cyan-100 text-cyan-800';
      case 'completed': return 'bg-emerald-100 text-emerald-800';
      case 'delayed': return 'bg-red-100 text-red-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'planning': return 'Planung';
      case 'cost_estimate': return 'Kostenvoranschlag';
      case 'tender': return 'Ausschreibung';
      case 'bidding': return 'Angebote';
      case 'evaluation': return 'Bewertung';
      case 'awarded': return 'Vergeben';
      case 'in_progress': return 'In Bearbeitung';
      case 'completed': return 'Abgeschlossen';
      case 'delayed': return 'Verzögert';
      case 'cancelled': return 'Storniert';
      default: return status;
    }
  };

  const getQuoteStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'submitted': return 'bg-blue-100 text-blue-800';
      case 'under_review': return 'bg-yellow-100 text-yellow-800';
      case 'accepted': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'withdrawn': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getQuoteStatusLabel = (status: string) => {
    switch (status) {
      case 'draft': return 'Entwurf';
      case 'submitted': return 'Eingereicht';
      case 'under_review': return 'In Prüfung';
      case 'accepted': return 'Angenommen';
      case 'rejected': return 'Abgelehnt';
      case 'withdrawn': return 'Zurückgezogen';
      default: return status;
    }
  };

  const handleCreateQuote = () => {
    if (trade) {
      setShowCostEstimateForm(true);
    }
  };

  const handleCostEstimateSubmit = async (formData: any) => {
    if (trade) {
      await onCreateQuote(trade);
      setShowCostEstimateForm(false);
      // Lade Angebote neu
      await loadExistingQuotes();
    }
  };

  if (!isOpen || !trade) return null;

  const categoryInfo = getCategoryIcon(trade.category);

  return (
    <>
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#2c3539] rounded-2xl shadow-2xl border border-white/20 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-[#2c3539] border-b border-white/20 p-6 rounded-t-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div 
                  className="w-12 h-12 rounded-full flex items-center justify-center border-2 border-white shadow-lg"
                  style={{ backgroundColor: categoryInfo.color }}
                >
                  {categoryInfo.icon}
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">{trade.title}</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(trade.status)}`}>
                      {getStatusLabel(trade.status)}
                    </span>
                    <span className="text-sm text-gray-400">•</span>
                    <span className="text-sm text-gray-300">{trade.category}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X size={24} className="text-gray-400" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Hauptinformationen */}
              <div className="lg:col-span-2 space-y-6">
                {/* Beschreibung */}
                <div className="bg-gray-50 rounded-xl p-4">
                  <h3 className="font-semibold text-gray-800 mb-2">Beschreibung</h3>
                  <p className="text-gray-600">
                    {trade.description || 'Keine Beschreibung verfügbar.'}
                  </p>
                </div>

                {/* Projekt-Details */}
                <div className="bg-gray-50 rounded-xl p-4">
                  <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <Building size={18} />
                    Projekt-Informationen
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm font-medium text-gray-500">Projektname</span>
                      <p className="text-gray-800">{trade.project_name}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">Projekttyp</span>
                      <p className="text-gray-800">{trade.project_type}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">Projekt-Status</span>
                      <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(trade.project_status)}`}>
                        {getStatusLabel(trade.project_status)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Standort */}
                <div className="bg-gray-50 rounded-xl p-4">
                  <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <MapPin size={18} />
                    Standort
                  </h3>
                  <div className="space-y-2">
                    <p className="text-gray-800">
                      {trade.address_street}
                    </p>
                    <p className="text-gray-600">
                      {trade.address_zip} {trade.address_city}
                    </p>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <span>📍 Entfernung: {trade.distance_km ? trade.distance_km.toFixed(1) : 'N/A'} km</span>
                    </div>
                  </div>
                </div>

                {/* Existierende Angebote */}
                {existingQuotes.length > 0 && (
                  <div className="bg-gray-50 rounded-xl p-4">
                    <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                      <Eye size={18} />
                      Eingegangene Angebote ({existingQuotes.length})
                    </h3>
                    <div className="space-y-2">
                      {existingQuotes.map((quote, index) => (
                        <div key={quote.id} className="flex items-center justify-between p-3 bg-white rounded-lg border">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                              <User size={16} className="text-gray-600" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-800">
                                {quote.service_provider_name || `Anbieter ${index + 1}`}
                              </p>
                              <p className="text-sm text-gray-500">
                                {new Date(quote.created_at).toLocaleDateString('de-DE')}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-gray-800">
                              {quote.total_price.toLocaleString('de-DE')} €
                            </p>
                            <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getQuoteStatusColor(quote.status)}`}>
                              {getQuoteStatusLabel(quote.status)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Seitenleiste */}
              <div className="space-y-4">
                {/* Zeitplan */}
                <div className="bg-white border border-gray-200 rounded-xl p-4">
                  <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <Calendar size={18} />
                    Zeitplan
                  </h3>
                  <div className="space-y-3">
                                         {trade.planned_date && (
                       <div>
                         <span className="text-sm font-medium text-gray-500">Geplant für</span>
                         <p className="text-gray-800">
                           {new Date(trade.planned_date).toLocaleDateString('de-DE')}
                         </p>
                       </div>
                     )}
                     <div>
                       <span className="text-sm font-medium text-gray-500">Erstellt am</span>
                       <p className="text-gray-800">
                         {trade.created_at ? new Date(trade.created_at).toLocaleDateString('de-DE') : 'Unbekannt'}
                       </p>
                     </div>
                  </div>
                </div>

                {/* Budget */}
                {trade.budget && (
                  <div className="bg-white border border-gray-200 rounded-xl p-4">
                    <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                      <Euro size={18} />
                      Budget
                    </h3>
                    <p className="text-2xl font-bold text-green-600">
                      {trade.budget.toLocaleString('de-DE')} €
                    </p>
                  </div>
                )}

                {/* Angebots-Status für aktuellen User */}
                <div className="bg-white border border-gray-200 rounded-xl p-4">
                  <h3 className="font-semibold text-gray-800 mb-3">Ihr Angebot</h3>
                  {loading ? (
                    <div className="flex items-center justify-center py-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                    </div>
                  ) : userHasQuote ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <CheckCircle size={16} className="text-green-600" />
                        <span className="text-sm font-medium text-green-600">Angebot bereits abgegeben</span>
                      </div>
                      {userQuote && (
                        <div className="bg-green-50 rounded-lg p-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-gray-800">
                                {userQuote.total_price.toLocaleString('de-DE')} €
                              </p>
                              <p className="text-sm text-gray-500">
                                {new Date(userQuote.created_at).toLocaleDateString('de-DE')}
                              </p>
                            </div>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getQuoteStatusColor(userQuote.status)}`}>
                              {getQuoteStatusLabel(userQuote.status)}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <AlertTriangle size={16} className="text-orange-500" />
                        <span className="text-sm text-gray-600">Noch kein Angebot abgegeben</span>
                      </div>
                      <button
                        onClick={handleCreateQuote}
                        className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 text-white px-4 py-2 rounded-lg font-medium hover:from-yellow-600 hover:to-yellow-700 transition-all duration-300 flex items-center justify-center gap-2"
                      >
                        <Plus size={16} />
                        Angebot abgeben
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

             {/* CostEstimateForm Modal */}
       {showCostEstimateForm && trade && (
         <CostEstimateForm
           isOpen={showCostEstimateForm}
           onClose={() => setShowCostEstimateForm(false)}
           onSubmit={handleCostEstimateSubmit}
         />
       )}
    </>
  );
} 