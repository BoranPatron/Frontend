import React from 'react';
import { 
  CheckCircle, 
  FileText, 
  Clock, 
  Euro, 
  Building, 
  User, 
  Calendar,
  Download,
  Share2,
  ArrowRight,
  X,
  MapPin,
  Award,
  Shield,
  AlertTriangle,
  Info,
  Eye,
  Edit,
  Trash2
} from 'lucide-react';

interface TradeQuoteDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  quote: any;
  trade: any;
  project: any;
  user: any;
  onEditQuote?: (quote: any) => void;
  onDeleteQuote?: (quoteId: number) => void;
  onViewTradeDetails?: () => void;
}

export default function TradeQuoteDetailsModal({ 
  isOpen, 
  onClose, 
  quote, 
  trade, 
  project, 
  user,
  onEditQuote,
  onDeleteQuote,
  onViewTradeDetails
}: TradeQuoteDetailsModalProps) {
  
  if (!isOpen) return null;

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

  const getStatusInfo = () => {
    if (!quote) return null;
    
    switch (quote.status) {
      case 'accepted':
        return {
          icon: <CheckCircle size={20} className="text-green-400" />,
          text: 'Angebot angenommen',
          color: 'text-green-400',
          bgColor: 'bg-green-500/10',
          borderColor: 'border-green-500/20',
          description: 'Ihr Angebot wurde vom Bauträger angenommen. Sie erhalten in Kürze eine Auftragsbestätigung.'
        };
      case 'rejected':
        return {
          icon: <AlertTriangle size={20} className="text-red-400" />,
          text: 'Angebot abgelehnt',
          color: 'text-red-400',
          bgColor: 'bg-red-500/10',
          borderColor: 'border-red-500/20',
          description: 'Ihr Angebot wurde vom Bauträger abgelehnt. Sie können ein neues Angebot abgeben.'
        };
      case 'submitted':
      default:
        return {
          icon: <Clock size={20} className="text-blue-400" />,
          text: 'Angebot eingereicht',
          color: 'text-blue-400',
          bgColor: 'bg-blue-500/10',
          borderColor: 'border-blue-500/20',
          description: 'Ihr Angebot wird vom Bauträger geprüft. Sie erhalten eine Benachrichtigung über die Entscheidung.'
        };
    }
  };

  const statusInfo = getStatusInfo();

  const handleDownloadPDF = () => {
    };

  const handleShareQuote = () => {
    };

  const handleViewDashboard = () => {
    onClose();
  };

  const handleEditQuote = () => {
    if (onEditQuote && quote) {
      onEditQuote(quote);
    }
  };

  const handleDeleteQuote = () => {
    if (onDeleteQuote && quote && quote.status === 'submitted') {
      if (window.confirm('Möchten Sie dieses Angebot wirklich zurückziehen?')) {
        onDeleteQuote(quote.id);
        onClose();
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460] rounded-2xl shadow-2xl border border-white/20 max-w-6xl w-full max-h-[90vh] overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/20">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-[#ffbd59]/20 rounded-xl">
              <FileText size={24} className="text-[#ffbd59]" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">
                {quote ? 'Gewerk & Angebot Details' : 'Gewerk Details'}
              </h2>
              <p className="text-gray-400">
                {quote ? 'Vollständige Übersicht über Gewerk und abgegebenes Angebot' : 'Details zum ausgeschriebenen Gewerk'}
              </p>
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
            
            {/* Gewerk-Details */}
            <div className="bg-white/5 rounded-xl p-6 border border-white/10">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Building size={20} className="text-[#ffbd59]" />
                Gewerk-Details
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Linke Spalte - Gewerk-Info */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <FileText size={16} className="text-gray-400" />
                    <div>
                      <div className="text-sm text-gray-400">Gewerk</div>
                      <div className="text-white font-medium text-lg">{trade?.title || 'Unbekannt'}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Building size={16} className="text-gray-400" />
                    <div>
                      <div className="text-sm text-gray-400">Projekt</div>
                      <div className="text-white font-medium">{project?.name || 'Unbekannt'}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <MapPin size={16} className="text-gray-400" />
                    <div>
                      <div className="text-sm text-gray-400">Standort</div>
                      <div className="text-white font-medium">
                        {trade?.address_street}, {trade?.address_zip} {trade?.address_city}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Award size={16} className="text-gray-400" />
                    <div>
                      <div className="text-sm text-gray-400">Kategorie</div>
                      <div className="text-white font-medium">{trade?.category || 'Unbekannt'}</div>
                    </div>
                  </div>
                </div>
                
                {/* Rechte Spalte - Projekt-Info */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Calendar size={16} className="text-gray-400" />
                    <div>
                      <div className="text-sm text-gray-400">Geplantes Datum</div>
                      <div className="text-white font-medium">{formatDate(trade?.planned_date)}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Euro size={16} className="text-gray-400" />
                    <div>
                      <div className="text-sm text-gray-400">Budget</div>
                      <div className="text-white font-medium">
                        {trade?.budget ? formatCurrency(trade.budget) : 'Nicht angegeben'}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Shield size={16} className="text-gray-400" />
                    <div>
                      <div className="text-sm text-gray-400">Status</div>
                      <div className="text-white font-medium">{trade?.status || 'Unbekannt'}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Info size={16} className="text-gray-400" />
                    <div>
                      <div className="text-sm text-gray-400">Projekt-Typ</div>
                      <div className="text-white font-medium">{project?.project_type || 'Unbekannt'}</div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Gewerk-Beschreibung */}
              {trade?.description && (
                <div className="mt-4 p-4 bg-white/5 rounded-lg">
                  <h4 className="text-sm font-medium text-white mb-2">Beschreibung</h4>
                  <p className="text-gray-300 text-sm leading-relaxed">{trade.description}</p>
                </div>
              )}
            </div>

            {/* Angebot-Details (falls vorhanden) */}
            {quote && (
              <>
                {/* Status-Banner */}
                <div className={`${statusInfo?.bgColor} border ${statusInfo?.borderColor} rounded-xl p-6`}>
                  <div className="flex items-center gap-3 mb-2">
                    {statusInfo?.icon}
                    <h3 className={`text-lg font-semibold ${statusInfo?.color}`}>{statusInfo?.text}</h3>
                  </div>
                  <p className="text-gray-300 text-sm">{statusInfo?.description}</p>
                </div>

                {/* Angebot-Informationen */}
                <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <FileText size={20} className="text-[#ffbd59]" />
                    Angebot-Informationen
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    
                    {/* Linke Spalte */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <User size={16} className="text-gray-400" />
                        <div>
                          <div className="text-sm text-gray-400">Dienstleister</div>
                          <div className="text-white font-medium">{quote.company_name || quote.contact_person}</div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <Calendar size={16} className="text-gray-400" />
                        <div>
                          <div className="text-sm text-gray-400">Erstellt am</div>
                          <div className="text-white font-medium">{formatDate(quote.created_at)}</div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <Calendar size={16} className="text-gray-400" />
                        <div>
                          <div className="text-sm text-gray-400">Gültig bis</div>
                          <div className="text-white font-medium">{formatDate(quote.valid_until)}</div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Rechte Spalte */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <Euro size={16} className="text-gray-400" />
                        <div>
                          <div className="text-sm text-gray-400">Gesamtbetrag</div>
                          <div className="text-white font-medium text-lg">
                            {formatCurrency(quote.total_amount, quote.currency)}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <Clock size={16} className="text-gray-400" />
                        <div>
                          <div className="text-sm text-gray-400">Geschätzte Dauer</div>
                          <div className="text-white font-medium">{quote.estimated_duration || 0} Tage</div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <Award size={16} className="text-gray-400" />
                        <div>
                          <div className="text-sm text-gray-400">Garantie</div>
                          <div className="text-white font-medium">{quote.warranty_period || 12} Monate</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Kostenaufschlüsselung */}
                {(quote.labor_cost || quote.material_cost || quote.overhead_cost) && (
                  <div className="bg-white/5 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <Euro size={20} className="text-[#ffbd59]" />
                      Kostenaufschlüsselung
                    </h3>
                    
                    <div className="space-y-3">
                      {quote.labor_cost && (
                        <div className="flex justify-between items-center">
                          <span className="text-gray-300">Arbeitskosten</span>
                          <span className="text-white font-medium">{formatCurrency(quote.labor_cost, quote.currency)}</span>
                        </div>
                      )}
                      
                      {quote.material_cost && (
                        <div className="flex justify-between items-center">
                          <span className="text-gray-300">Materialkosten</span>
                          <span className="text-white font-medium">{formatCurrency(quote.material_cost, quote.currency)}</span>
                        </div>
                      )}
                      
                      {quote.overhead_cost && (
                        <div className="flex justify-between items-center">
                          <span className="text-gray-300">Gemeinkosten</span>
                          <span className="text-white font-medium">{formatCurrency(quote.overhead_cost, quote.currency)}</span>
                        </div>
                      )}
                      
                      <div className="border-t border-white/20 pt-3">
                        <div className="flex justify-between items-center">
                          <span className="text-white font-semibold">Gesamtbetrag</span>
                          <span className="text-[#ffbd59] font-bold text-lg">{formatCurrency(quote.total_amount, quote.currency)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Beschreibung */}
                {quote.description && (
                  <div className="bg-white/5 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <FileText size={20} className="text-[#ffbd59]" />
                      Beschreibung
                    </h3>
                    <p className="text-gray-300 text-sm leading-relaxed">{quote.description}</p>
                  </div>
                )}

                {/* Zahlungsbedingungen */}
                {quote.payment_terms && (
                  <div className="bg-white/5 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <Shield size={20} className="text-[#ffbd59]" />
                      Zahlungsbedingungen
                    </h3>
                    <p className="text-gray-300 text-sm leading-relaxed">{quote.payment_terms}</p>
                  </div>
                )}
              </>
            )}

            {/* Aktionen */}
            <div className="flex flex-col sm:flex-row gap-3">
              {quote && (
                <>
                  <button
                    onClick={handleDownloadPDF}
                    className="flex items-center justify-center gap-2 px-6 py-3 bg-[#ffbd59] text-[#2c3539] rounded-xl font-semibold hover:bg-[#ffa726] transition-all duration-300 transform hover:scale-105 shadow-lg"
                  >
                    <Download size={16} />
                    PDF herunterladen
                  </button>
                  
                  <button
                    onClick={handleShareQuote}
                    className="flex items-center justify-center gap-2 px-6 py-3 bg-white/10 text-white rounded-xl font-semibold hover:bg-white/20 transition-all duration-300 border border-white/20"
                  >
                    <Share2 size={16} />
                    Angebot teilen
                  </button>
                  
                  {quote.status === 'submitted' && onEditQuote && (
                    <button
                      onClick={handleEditQuote}
                      className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-500/20 text-blue-300 rounded-xl font-semibold hover:bg-blue-500/30 transition-all duration-300 border border-blue-500/20"
                    >
                      <Edit size={16} />
                      Bearbeiten
                    </button>
                  )}
                  
                  {quote.status === 'submitted' && onDeleteQuote && (
                    <button
                      onClick={handleDeleteQuote}
                      className="flex items-center justify-center gap-2 px-6 py-3 bg-red-500/20 text-red-300 rounded-xl font-semibold hover:bg-red-500/30 transition-all duration-300 border border-red-500/20"
                    >
                      <Trash2 size={16} />
                      Zurückziehen
                    </button>
                  )}
                </>
              )}
              
              <button
                onClick={handleViewDashboard}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-semibold hover:from-blue-600 hover:to-blue-700 transition-all duration-300 transform hover:scale-105 shadow-lg"
              >
                <ArrowRight size={16} />
                Zum Dashboard
              </button>
            </div>

            {/* Zusätzliche Informationen */}
            <div className="bg-white/5 rounded-xl p-4">
              <div className="text-sm text-gray-400">
                {quote && (
                  <>
                    <p className="mb-2">
                      <strong>Angebots-ID:</strong> #{quote.id}
                    </p>
                    <p className="mb-2">
                      <strong>Status:</strong> 
                      <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                        quote.status === 'accepted' ? 'bg-green-500/20 text-green-400' :
                        quote.status === 'rejected' ? 'bg-red-500/20 text-red-400' :
                        'bg-blue-500/20 text-blue-400'
                      }`}>
                        {quote.status === 'accepted' ? 'Angenommen' :
                         quote.status === 'rejected' ? 'Abgelehnt' :
                         'Eingereicht'}
                      </span>
                    </p>
                    <p>
                      <strong>Kontakt:</strong> {quote.email || 'Nicht angegeben'}
                    </p>
                  </>
                )}
                {!quote && (
                  <p>
                    <strong>Gewerk-ID:</strong> #{trade?.id || 'N/A'}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 
