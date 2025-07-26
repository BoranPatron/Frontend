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
  X
} from 'lucide-react';

interface QuoteSubmissionConfirmationProps {
  isOpen: boolean;
  onClose: () => void;
  quote: any;
  trade: any;
  project: any;
  user: any;
}

export default function QuoteSubmissionConfirmation({ 
  isOpen, 
  onClose, 
  quote, 
  trade, 
  project, 
  user 
}: QuoteSubmissionConfirmationProps) {
  
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

  const handleDownloadPDF = () => {
    // PDF-Download Funktionalität hier implementieren
    console.log('📄 PDF-Download für Angebot:', quote.id);
  };

  const handleShareQuote = () => {
    // Teilen-Funktionalität hier implementieren
    console.log('📤 Angebot teilen:', quote.id);
  };

  const handleViewDashboard = () => {
    // Zurück zum Dashboard
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460] rounded-2xl shadow-2xl border border-green-500/20 max-w-4xl w-full max-h-[90vh] overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-green-500/20">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-500/20 rounded-xl">
              <CheckCircle size={24} className="text-green-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Angebot erfolgreich eingereicht!</h2>
              <p className="text-green-400">Ihr Kostenvoranschlag wurde an den Bauträger gesendet</p>
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
            
            {/* Erfolgs-Banner */}
            <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <CheckCircle size={24} className="text-green-400" />
                <h3 className="text-lg font-semibold text-white">Angebot erfolgreich übermittelt</h3>
              </div>
              <p className="text-green-200">
                Ihr Kostenvoranschlag wurde erfolgreich an den Bauträger gesendet und wird nun geprüft. 
                Sie erhalten eine Benachrichtigung, sobald eine Entscheidung vorliegt.
              </p>
            </div>

            {/* Angebot-Details */}
            <div className="bg-white/5 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <FileText size={20} className="text-[#ffbd59]" />
                Angebot-Details
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Linke Spalte */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Building size={16} className="text-gray-400" />
                    <div>
                      <div className="text-sm text-gray-400">Projekt</div>
                      <div className="text-white font-medium">{project?.name || 'Unbekannt'}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <FileText size={16} className="text-gray-400" />
                    <div>
                      <div className="text-sm text-gray-400">Gewerk</div>
                      <div className="text-white font-medium">{trade?.title || 'Unbekannt'}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <User size={16} className="text-gray-400" />
                    <div>
                      <div className="text-sm text-gray-400">Dienstleister</div>
                      <div className="text-white font-medium">{user?.company_name || `${user?.first_name} ${user?.last_name}`}</div>
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
                        {formatCurrency(quote?.total_amount || 0, quote?.currency || 'EUR')}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Calendar size={16} className="text-gray-400" />
                    <div>
                      <div className="text-sm text-gray-400">Gültig bis</div>
                      <div className="text-white font-medium">{formatDate(quote?.valid_until)}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Clock size={16} className="text-gray-400" />
                    <div>
                      <div className="text-sm text-gray-400">Erstellt am</div>
                      <div className="text-white font-medium">{formatDate(quote?.created_at)}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Nächste Schritte */}
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <ArrowRight size={20} className="text-blue-400" />
                Nächste Schritte
              </h3>
              
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-blue-400 rounded-full mt-2"></div>
                  <div>
                    <div className="text-white font-medium">Bauträger prüft Ihr Angebot</div>
                    <div className="text-sm text-blue-200">Ihr Angebot wird nun vom Bauträger geprüft und bewertet</div>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-yellow-400 rounded-full mt-2"></div>
                  <div>
                    <div className="text-white font-medium">Entscheidung in 3-5 Werktagen</div>
                    <div className="text-sm text-yellow-200">Sie erhalten eine Benachrichtigung über die Entscheidung</div>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-green-400 rounded-full mt-2"></div>
                  <div>
                    <div className="text-white font-medium">Bei Annahme: Auftragsbestätigung</div>
                    <div className="text-sm text-green-200">Bei positiver Entscheidung erhalten Sie eine Auftragsbestätigung</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Aktionen */}
            <div className="flex flex-col sm:flex-row gap-3">
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
                <p className="mb-2">
                  <strong>Angebots-ID:</strong> #{quote?.id || 'N/A'}
                </p>
                <p className="mb-2">
                  <strong>Status:</strong> 
                  <span className="ml-2 px-2 py-1 bg-green-500/20 text-green-400 rounded-full text-xs">
                    Eingereicht
                  </span>
                </p>
                <p>
                  <strong>Kontakt:</strong> {user?.email || 'Nicht angegeben'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 