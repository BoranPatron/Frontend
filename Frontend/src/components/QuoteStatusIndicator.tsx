import React, { useState, useEffect } from 'react';
import { CheckCircle, Clock, XCircle, AlertTriangle, Eye, FileText, Euro, Calendar, User, ChevronDown, ChevronUp } from 'lucide-react';

interface QuoteStatusIndicatorProps {
  tradeId: number;
  onViewQuoteDetails?: (quote: any) => void;
}

interface QuoteData {
  id: number;
  title: string;
  total_amount: number;
  currency: string;
  status: string;
  created_at: string;
  valid_until: string;
  company_name: string;
  contact_person: string;
  description: string;
  labor_cost?: number;
  material_cost?: number;
  overhead_cost?: number;
  estimated_duration?: number;
  warranty_period?: number;
  payment_terms?: string;
}

export default function QuoteStatusIndicator({ tradeId, onViewQuoteDetails }: QuoteStatusIndicatorProps) {
  const [quoteStatus, setQuoteStatus] = useState<'none' | 'submitted' | 'accepted' | 'rejected' | 'loading'>('loading');
  const [quoteData, setQuoteData] = useState<QuoteData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    checkQuoteStatus();
  }, [tradeId]);

  const checkQuoteStatus = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setQuoteStatus('none');
        return;
      }

      const response = await fetch(`/api/v1/quotes/milestone/${tradeId}/check-user-quote`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.has_quote) {
          setQuoteStatus(data.quote.status || 'submitted');
          setQuoteData(data.quote);
        } else {
          setQuoteStatus('none');
          setQuoteData(null);
        }
      } else {
        setQuoteStatus('none');
        setQuoteData(null);
      }
    } catch (error) {
      console.error('Fehler beim Prüfen des Quote-Status:', error);
      setQuoteStatus('none');
      setQuoteData(null);
    } finally {
      setLoading(false);
    }
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

  const handleViewDetails = () => {
    if (quoteData && onViewQuoteDetails) {
      onViewQuoteDetails(quoteData);
    } else {
      setShowDetails(!showDetails);
    }
  };

  if (loading) {
    return (
      <div className="text-xs text-gray-400 mt-1">
        <div className="animate-pulse">Prüfe Status...</div>
      </div>
    );
  }

  const getStatusDisplay = () => {
    switch (quoteStatus) {
      case 'none':
        return {
          icon: <FileText size={14} className="text-gray-400" />,
          text: 'Kein Angebot abgegeben',
          color: 'text-gray-400',
          bgColor: 'bg-gray-500/10',
          borderColor: 'border-gray-500/20',
          description: 'Sie haben noch kein Angebot für dieses Gewerk abgegeben.'
        };
      case 'submitted':
        return {
          icon: <Clock size={14} className="text-blue-400" />,
          text: 'Angebot eingereicht',
          color: 'text-blue-400',
          bgColor: 'bg-blue-500/10',
          borderColor: 'border-blue-500/20',
          description: 'Ihr Angebot wird vom Bauträger geprüft.'
        };
      case 'accepted':
        return {
          icon: <CheckCircle size={14} className="text-green-400" />,
          text: 'Angebot angenommen',
          color: 'text-green-400',
          bgColor: 'bg-green-500/10',
          borderColor: 'border-green-500/20',
          description: 'Ihr Angebot wurde angenommen!'
        };
      case 'rejected':
        return {
          icon: <XCircle size={14} className="text-red-400" />,
          text: 'Angebot abgelehnt',
          color: 'text-red-400',
          bgColor: 'bg-red-500/10',
          borderColor: 'border-red-500/20',
          description: 'Ihr Angebot wurde abgelehnt.'
        };
      default:
        return {
          icon: <AlertTriangle size={14} className="text-yellow-400" />,
          text: 'Unbekannter Status',
          color: 'text-yellow-400',
          bgColor: 'bg-yellow-500/10',
          borderColor: 'border-yellow-500/20',
          description: 'Status konnte nicht ermittelt werden.'
        };
    }
  };

  const statusInfo = getStatusDisplay();

  return (
    <div className="mt-3">
      <div className={`${statusInfo.bgColor} border ${statusInfo.borderColor} rounded-lg p-3`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {statusInfo.icon}
            <span className={`text-sm font-medium ${statusInfo.color}`}>
              {statusInfo.text}
            </span>
          </div>
          {quoteData && (
            <button
              onClick={handleViewDetails}
              className="text-xs text-[#ffbd59] hover:text-[#ffa726] transition-colors flex items-center gap-1"
            >
              {showDetails ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              {showDetails ? 'Weniger' : 'Details'}
            </button>
          )}
        </div>
        <p className="text-xs text-gray-300 mt-1">{statusInfo.description}</p>
        
        {/* Erweiterte Angebot-Details */}
        {quoteData && showDetails && (
          <div className="mt-3 pt-3 border-t border-white/10 space-y-3">
            {/* Angebot-Informationen */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-2">
                <Euro size={12} className="text-gray-400" />
                <span className="text-gray-400">Betrag:</span>
                <span className="text-white font-medium">{formatCurrency(quoteData.total_amount, quoteData.currency)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar size={12} className="text-gray-400" />
                <span className="text-gray-400">Erstellt:</span>
                <span className="text-white font-medium">{formatDate(quoteData.created_at)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar size={12} className="text-gray-400" />
                <span className="text-gray-400">Gültig bis:</span>
                <span className="text-white font-medium">{formatDate(quoteData.valid_until)}</span>
              </div>
              <div className="flex items-center gap-2">
                <User size={12} className="text-gray-400" />
                <span className="text-gray-400">Dienstleister:</span>
                <span className="text-white font-medium">{quoteData.company_name || quoteData.contact_person}</span>
              </div>
            </div>
            
            {/* Kostenaufschlüsselung */}
            {(quoteData.labor_cost || quoteData.material_cost || quoteData.overhead_cost) && (
              <div className="bg-white/5 rounded p-2 space-y-1">
                <div className="text-xs font-medium text-white mb-2">Kostenaufschlüsselung:</div>
                {quoteData.labor_cost && (
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-300">Arbeitskosten:</span>
                    <span className="text-white">{formatCurrency(quoteData.labor_cost, quoteData.currency)}</span>
                  </div>
                )}
                {quoteData.material_cost && (
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-300">Materialkosten:</span>
                    <span className="text-white">{formatCurrency(quoteData.material_cost, quoteData.currency)}</span>
                  </div>
                )}
                {quoteData.overhead_cost && (
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-300">Gemeinkosten:</span>
                    <span className="text-white">{formatCurrency(quoteData.overhead_cost, quoteData.currency)}</span>
                  </div>
                )}
                <div className="border-t border-white/20 pt-1 mt-1">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-white">Gesamtbetrag:</span>
                    <span className="text-[#ffbd59]">{formatCurrency(quoteData.total_amount, quoteData.currency)}</span>
                  </div>
                </div>
              </div>
            )}
            
            {/* Zusätzliche Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
              {quoteData.estimated_duration && (
                <div className="flex items-center gap-2">
                  <Clock size={12} className="text-gray-400" />
                  <span className="text-gray-400">Dauer:</span>
                  <span className="text-white font-medium">{quoteData.estimated_duration} Tage</span>
                </div>
              )}
              {quoteData.warranty_period && (
                <div className="flex items-center gap-2">
                  <CheckCircle size={12} className="text-gray-400" />
                  <span className="text-gray-400">Garantie:</span>
                  <span className="text-white font-medium">{quoteData.warranty_period} Monate</span>
                </div>
              )}
            </div>
            
            {/* Beschreibung */}
            {quoteData.description && (
              <div className="text-xs">
                <span className="text-gray-400">Beschreibung:</span>
                <p className="text-white mt-1 leading-relaxed">{quoteData.description}</p>
              </div>
            )}
            
            {/* Zahlungsbedingungen */}
            {quoteData.payment_terms && (
              <div className="text-xs">
                <span className="text-gray-400">Zahlungsbedingungen:</span>
                <p className="text-white mt-1 leading-relaxed">{quoteData.payment_terms}</p>
              </div>
            )}
            
            {/* Aktions-Buttons */}
            <div className="flex items-center gap-2 pt-2 border-t border-white/10">
              <button
                onClick={handleViewDetails}
                className="text-xs text-[#ffbd59] hover:text-[#ffa726] transition-colors flex items-center gap-1"
              >
                <Eye size={12} />
                Vollständige Details
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 