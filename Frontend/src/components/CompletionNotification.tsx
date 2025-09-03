import React, { useState } from 'react';
import { 
  CheckCircle, 
  Clock, 
  Mail, 
  ExternalLink, 
  Calendar,
  User,
  Building,
  AlertTriangle,
  X,
  Send
} from 'lucide-react';
import { EmailNotificationButton } from './EmailNotificationButton';

interface CompletionNotificationProps {
  notification: {
    id: number;
    type: string;
    title: string;
    message: string;
    description?: string;
    timestamp: string;
    metadata?: {
      trade_title?: string;
      project_name?: string;
      service_provider?: string;
      completion_date?: string;
      service_provider_id?: number;
      trade_id?: number;
      project_id?: number;
    };
  };
  onMarkAsRead?: (id: number) => void;
  onAction?: (action: string, data?: any) => void;
}

export default function CompletionNotification({ 
  notification, 
  onMarkAsRead, 
  onAction 
}: CompletionNotificationProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);

  const handleMarkAsRead = () => {
    onMarkAsRead?.(notification.id);
  };

  const handleViewProject = () => {
    if (notification.metadata?.project_id) {
      window.open(`/project/${notification.metadata.project_id}`, '_blank');
    }
  };

  const handleViewTrade = () => {
    if (notification.metadata?.project_id && notification.metadata?.trade_id) {
      window.open(`/project/${notification.metadata.project_id}?trade=${notification.metadata.trade_id}`, '_blank');
    }
  };

  const handleScheduleInspection = () => {
    onAction?.('schedule_inspection', {
      trade_id: notification.metadata?.trade_id,
      project_id: notification.metadata?.project_id,
      service_provider_id: notification.metadata?.service_provider_id
    });
  };

  const handleStartAcceptance = () => {
    onAction?.('start_acceptance', {
      trade_id: notification.metadata?.trade_id,
      project_id: notification.metadata?.project_id
    });
  };

  return (
    <div className="bg-gradient-to-r from-orange-500/10 to-amber-500/10 border border-orange-500/30 rounded-xl p-4 shadow-lg">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-orange-500/20 rounded-lg">
            <CheckCircle size={20} className="text-orange-400" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-white text-sm">
              {notification.title}
            </h3>
            <p className="text-orange-200 text-xs mt-1">
              {new Date(notification.timestamp).toLocaleString('de-DE')}
            </p>
          </div>
        </div>
        
        <button
          onClick={handleMarkAsRead}
          className="p-1 hover:bg-white/10 rounded-lg transition-colors"
          title="Als gelesen markieren"
        >
          <X size={16} className="text-gray-400" />
        </button>
      </div>

      {/* Nachricht */}
      <p className="text-gray-200 text-sm mb-4 leading-relaxed">
        {notification.message}
      </p>

      {/* Projekt-Details */}
      {notification.metadata && (
        <div className="bg-black/20 rounded-lg p-3 mb-4 space-y-2">
          <div className="flex items-center gap-2 text-xs">
            <Building size={12} className="text-gray-400" />
            <span className="text-gray-400">Projekt:</span>
            <span className="text-white font-medium">{notification.metadata.project_name}</span>
          </div>
          
          <div className="flex items-center gap-2 text-xs">
            <CheckCircle size={12} className="text-gray-400" />
            <span className="text-gray-400">Gewerk:</span>
            <span className="text-white font-medium">{notification.metadata.trade_title}</span>
          </div>
          
          <div className="flex items-center gap-2 text-xs">
            <User size={12} className="text-gray-400" />
            <span className="text-gray-400">Dienstleister:</span>
            <span className="text-white font-medium">{notification.metadata.service_provider}</span>
          </div>
          
          <div className="flex items-center gap-2 text-xs">
            <Clock size={12} className="text-gray-400" />
            <span className="text-gray-400">Fertiggestellt:</span>
            <span className="text-white font-medium">
              {notification.metadata.completion_date ? 
                new Date(notification.metadata.completion_date).toLocaleDateString('de-DE') : 
                'Heute'
              }
            </span>
          </div>
        </div>
      )}

      {/* Aktions-Buttons */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={handleViewTrade}
          className="flex items-center gap-2 px-3 py-2 bg-blue-600/20 text-blue-300 rounded-lg hover:bg-blue-600/30 transition-colors text-xs font-medium"
        >
          <ExternalLink size={14} />
          Gewerk ansehen
        </button>
        
        <button
          onClick={handleScheduleInspection}
          className="flex items-center gap-2 px-3 py-2 bg-green-600/20 text-green-300 rounded-lg hover:bg-green-600/30 transition-colors text-xs font-medium"
        >
          <Calendar size={14} />
          Abnahmetermin
        </button>
        
        <button
          onClick={handleStartAcceptance}
          className="flex items-center gap-2 px-3 py-2 bg-orange-600/20 text-orange-300 rounded-lg hover:bg-orange-600/30 transition-colors text-xs font-medium"
        >
          <CheckCircle size={14} />
          Abnahme starten
        </button>
        
        <button
          onClick={() => setShowEmailModal(true)}
          className="flex items-center gap-2 px-3 py-2 bg-purple-600/20 text-purple-300 rounded-lg hover:bg-purple-600/30 transition-colors text-xs font-medium"
        >
          <Mail size={14} />
          E-Mail senden
        </button>
      </div>

      {/* E-Mail Modal */}
      {showEmailModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gradient-to-br from-[#2c3539] to-[#3d4952] rounded-2xl shadow-2xl border border-white/20 max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">E-Mail-Benachrichtigung</h3>
                <button
                  onClick={() => setShowEmailModal(false)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X size={20} className="text-gray-400" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
                  <p className="text-blue-300 text-sm">
                    Senden Sie eine E-Mail-Benachrichtigung über die Fertigstellungsmeldung an relevante Projektbeteiligte.
                  </p>
                </div>
                
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      // Hier würde die E-Mail-Funktionalität implementiert
                      console.log('Sende E-Mail für Fertigstellungsmeldung');
                      setShowEmailModal(false);
                    }}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-[#ffbd59] text-[#2c3539] rounded-lg font-semibold hover:bg-[#ffa726] transition-colors"
                  >
                    <Send size={16} />
                    E-Mail senden
                  </button>
                  
                  <button
                    onClick={() => setShowEmailModal(false)}
                    className="px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors"
                  >
                    Abbrechen
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Erweiterte Details */}
      {showDetails && (
        <div className="mt-4 pt-4 border-t border-orange-500/20">
          <div className="bg-black/20 rounded-lg p-3">
            <h4 className="text-white font-medium text-sm mb-2">Nächste Schritte:</h4>
            <ul className="text-gray-300 text-xs space-y-1">
              <li>• Abnahmetermin mit dem Dienstleister vereinbaren</li>
              <li>• Gewerk vor Ort besichtigen und prüfen</li>
              <li>• Mängel dokumentieren (falls vorhanden)</li>
              <li>• Abnahmeprotokoll erstellen</li>
              <li>• Finale Freigabe oder Nachbesserung anfordern</li>
            </ul>
          </div>
        </div>
      )}
      
      <div className="mt-3 text-center">
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="text-orange-300 hover:text-orange-200 text-xs font-medium transition-colors"
        >
          {showDetails ? 'Weniger anzeigen' : 'Details anzeigen'}
        </button>
      </div>
    </div>
  );
}
