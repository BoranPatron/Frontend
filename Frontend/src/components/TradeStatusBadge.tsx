import React from 'react';
import { 
  CheckCircle, 
  Clock, 
  XCircle, 
  AlertTriangle, 
  UserCheck, 
  UserX, 
  Euro,
  Calendar,
  MapPin
} from 'lucide-react';

interface TradeStatusBadgeProps {
  trade: {
    trade_status: string;
    has_user_quote: boolean;
    user_quote_status?: string;
    user_quote_amount?: number;
    user_quote_currency?: string;
    is_accepted_by_other: boolean;
    accepted_contractor?: string;
    accepted_at?: string;
    distance_km: number;
  };
  showDetails?: boolean;
}

export default function TradeStatusBadge({ trade, showDetails = false }: TradeStatusBadgeProps) {
  const getStatusConfig = () => {
    // Wenn bereits von anderen angenommen
    if (trade.is_accepted_by_other) {
      return {
        icon: CheckCircle,
        color: 'bg-green-100 text-green-800 border-green-200',
        text: 'Angenommen',
        description: `Von ${trade.accepted_contractor || 'anderem Dienstleister'} angenommen`
      };
    }
    
    // Wenn User bereits Angebot abgegeben hat
    if (trade.has_user_quote) {
      switch (trade.user_quote_status) {
        case 'accepted':
          return {
            icon: CheckCircle,
            color: 'bg-green-100 text-green-800 border-green-200',
            text: 'Ihr Angebot angenommen',
            description: 'Ihr Angebot wurde angenommen'
          };
        case 'submitted':
          return {
            icon: Clock,
            color: 'bg-blue-100 text-blue-800 border-blue-200',
            text: 'Angebot eingereicht',
            description: 'Ihr Angebot wurde eingereicht und wird geprüft'
          };
        case 'rejected':
          return {
            icon: XCircle,
            color: 'bg-red-100 text-red-800 border-red-200',
            text: 'Angebot abgelehnt',
            description: 'Ihr Angebot wurde abgelehnt'
          };
        default:
          return {
            icon: AlertTriangle,
            color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
            text: 'Angebot vorhanden',
            description: 'Sie haben bereits ein Angebot abgegeben'
          };
      }
    }
    
    // Standard: Verfügbar
    return {
      icon: MapPin,
      color: 'bg-gray-100 text-gray-800 border-gray-200',
      text: 'Verfügbar',
      description: 'Angebot abgeben möglich'
    };
  };

  const statusConfig = getStatusConfig();
  const IconComponent = statusConfig.icon;

  const formatCurrency = (amount: number, currency: string = 'EUR') => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-DE');
  };

  return (
    <div className="space-y-2">
      {/* Haupt-Status-Badge */}
      <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${statusConfig.color}`}>
        <IconComponent className="w-4 h-4 mr-2" />
        {statusConfig.text}
      </div>

      {/* Detaillierte Informationen */}
      {showDetails && (
        <div className="text-sm text-gray-600 space-y-1">
          <p>{statusConfig.description}</p>
          
          {/* Angebots-Betrag */}
          {trade.user_quote_amount && (
            <div className="flex items-center">
              <Euro className="w-4 h-4 mr-1" />
              <span>
                Ihr Angebot: {formatCurrency(trade.user_quote_amount, trade.user_quote_currency || 'EUR')}
              </span>
            </div>
          )}
          
          {/* Akzeptiert-Datum */}
          {trade.accepted_at && (
            <div className="flex items-center">
              <Calendar className="w-4 h-4 mr-1" />
              <span>Akzeptiert am: {formatDate(trade.accepted_at)}</span>
            </div>
          )}
          
          {/* Entfernung */}
          <div className="flex items-center">
            <MapPin className="w-4 h-4 mr-1" />
            <span>{trade.distance_km.toFixed(1)} km entfernt</span>
          </div>
        </div>
      )}

      {/* Warnung wenn bereits angenommen */}
      {trade.is_accepted_by_other && (
        <div className="mt-2 p-2 bg-orange-50 border border-orange-200 rounded-md">
          <div className="flex items-center">
            <AlertTriangle className="w-4 h-4 text-orange-600 mr-2" />
            <span className="text-sm text-orange-800">
              Dieses Gewerk wurde bereits angenommen
            </span>
          </div>
        </div>
      )}

      {/* Erfolgs-Meldung für angenommenes Angebot */}
      {trade.has_user_quote && trade.user_quote_status === 'accepted' && (
        <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-md">
          <div className="flex items-center">
            <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
            <span className="text-sm text-green-800">
              Herzlichen Glückwunsch! Ihr Angebot wurde angenommen
            </span>
          </div>
        </div>
      )}
    </div>
  );
} 