import React, { useState } from 'react';
import { 
  X, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  User,
  FileText,
  Download,
  Calendar,
  Clock,
  MapPin,
  MessageCircle,
  Star,
  Euro
} from 'lucide-react';
import { 
  appointmentService, 
  getStatusBadgeColor, 
  getStatusText,
  type AppointmentResponse,
  type InspectionDecisionRequest 
} from '../api/appointmentService';

interface InspectionDecisionModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: AppointmentResponse;
  onDecisionMade: (decision: any) => void;
}

export default function InspectionDecisionModal({
  isOpen,
  onClose,
  appointment,
  onDecisionMade
}: InspectionDecisionModalProps) {
  const [selectedServiceProviderId, setSelectedServiceProviderId] = useState<number | null>(null);
  const [inspectionNotes, setInspectionNotes] = useState('');
  const [requiresRenegotiation, setRequiresRenegotiation] = useState(false);
  const [renegotiationDetails, setRenegotiationDetails] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!selectedServiceProviderId) {
      alert('Bitte wählen Sie einen Dienstleister aus.');
      return;
    }

    setLoading(true);
    try {
      const decisionData: InspectionDecisionRequest = {
        appointment_id: appointment.id,
        selected_service_provider_id: selectedServiceProviderId,
        inspection_notes: inspectionNotes,
        requires_renegotiation: requiresRenegotiation,
        renegotiation_details: requiresRenegotiation ? renegotiationDetails : undefined
      };

      const result = await appointmentService.completeInspection(decisionData);
      onDecisionMade(result);
      onClose();
    } catch (error: any) {
      console.error('❌ Fehler beim Abschließen der Besichtigung:', error);
      alert(`Fehler: ${error.response?.data?.detail || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadCalendar = async () => {
    try {
      await appointmentService.downloadCalendarEvent(appointment.id);
    } catch (error) {
      console.error('Fehler beim Download:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-DE', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('de-DE', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-slate-700">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">
                Besichtigung abschließen
              </h2>
              <p className="text-slate-400">
                Treffen Sie Ihre Entscheidung für das Gewerk
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white transition-colors p-2 hover:bg-slate-700 rounded-lg"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Termin-Details */}
        <div className="p-6 border-b border-slate-700">
          <div className="bg-slate-800/50 rounded-xl p-4 mb-4">
            <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
              <Calendar className="text-blue-400" size={20} />
              Termin-Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2 text-slate-300">
                <Calendar size={16} className="text-blue-400" />
                <span>{formatDate(appointment.scheduled_date)}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <Clock size={16} className="text-green-400" />
                <span>{formatTime(appointment.scheduled_date)} ({appointment.duration_minutes} Min.)</span>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <MapPin size={16} className="text-red-400" />
                <span>{appointment.location || 'Kein Ort angegeben'}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(appointment.status)}`}>
                  {getStatusText(appointment.status)}
                </span>
              </div>
            </div>
            
            <div className="mt-4 flex gap-2">
              <button
                onClick={handleDownloadCalendar}
                className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm"
              >
                <Download size={16} />
                Kalender (.ics)
              </button>
            </div>
          </div>
        </div>

        {/* Service Provider Auswahl */}
        <div className="p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <User className="text-purple-400" size={20} />
            Dienstleister auswählen
          </h3>

          {appointment.invited_service_providers && appointment.invited_service_providers.length > 0 ? (
            <div className="grid gap-3 mb-6">
              {appointment.invited_service_providers.map((provider) => {
                const response = appointment.responses?.find(r => r.service_provider_id === provider.id);
                const isSelected = selectedServiceProviderId === provider.id;
                
                return (
                  <div
                    key={provider.id}
                    onClick={() => setSelectedServiceProviderId(provider.id)}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all hover:shadow-lg ${
                      isSelected 
                        ? 'border-green-500 bg-green-500/10' 
                        : 'border-slate-600 bg-slate-800/30 hover:border-slate-500'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-4 h-4 rounded-full border-2 ${
                          isSelected ? 'bg-green-500 border-green-500' : 'border-slate-400'
                        }`}>
                          {isSelected && <CheckCircle size={16} className="text-white -m-0.5" />}
                        </div>
                        <div>
                          <h4 className="font-semibold text-white">{provider.name}</h4>
                          <p className="text-sm text-slate-400">{provider.email}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {response && (
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            response.status === 'accepted' ? 'bg-green-100 text-green-800' :
                            response.status === 'rejected' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {response.status === 'accepted' ? 'Angenommen' :
                             response.status === 'rejected' ? 'Abgelehnt' :
                             'Vorschlag'}
                          </span>
                        )}
                        <Star className="text-yellow-400" size={16} />
                      </div>
                    </div>

                    {response?.message && (
                      <div className="mt-3 p-3 bg-slate-700/50 rounded-lg">
                        <p className="text-sm text-slate-300 flex items-start gap-2">
                          <MessageCircle size={14} className="text-blue-400 mt-0.5 flex-shrink-0" />
                          {response.message}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-400">
              <User size={48} className="mx-auto mb-2 opacity-50" />
              <p>Keine Dienstleister eingeladen</p>
            </div>
          )}

          {/* Notizen zur Besichtigung */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
              <FileText size={16} className="text-blue-400" />
              Notizen zur Besichtigung
            </label>
            <textarea
              value={inspectionNotes}
              onChange={(e) => setInspectionNotes(e.target.value)}
              placeholder="Beschreiben Sie Ihre Eindrücke und wichtige Erkenntnisse aus der Besichtigung..."
              className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={4}
            />
          </div>

          {/* Nachverhandlung */}
          <div className="mb-6">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={requiresRenegotiation}
                onChange={(e) => setRequiresRenegotiation(e.target.checked)}
                className="w-5 h-5 text-orange-500 bg-slate-800 border-slate-600 rounded focus:ring-orange-500 focus:ring-2"
              />
              <span className="text-slate-300 flex items-center gap-2">
                <AlertTriangle size={16} className="text-orange-400" />
                Nachverhandlung erforderlich
              </span>
            </label>
            
            {requiresRenegotiation && (
              <div className="mt-3">
                <textarea
                  value={renegotiationDetails}
                  onChange={(e) => setRenegotiationDetails(e.target.value)}
                  placeholder="Beschreiben Sie, was nachverhandelt werden soll (Preis, Leistungen, Zeitplan, etc.)..."
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                  rows={3}
                />
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 justify-end">
            <button
              onClick={onClose}
              className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl transition-colors"
            >
              Abbrechen
            </button>
            <button
              onClick={handleSubmit}
              disabled={!selectedServiceProviderId || loading}
              className="px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Verarbeitung...
                </>
              ) : (
                <>
                  <CheckCircle size={16} />
                  Entscheidung bestätigen
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 