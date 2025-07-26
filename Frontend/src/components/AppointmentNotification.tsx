import React, { useState } from 'react';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  User, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  MessageCircle,
  Download,
  Bell
} from 'lucide-react';
import { 
  appointmentService, 
  getStatusBadgeColor, 
  getStatusText,
  type AppointmentResponse,
  type AppointmentResponseRequest 
} from '../api/appointmentService';

interface AppointmentNotificationProps {
  appointment: AppointmentResponse;
  onResponse: (response: any) => void;
}

export default function AppointmentNotification({ appointment, onResponse }: AppointmentNotificationProps) {
  const [showResponseForm, setShowResponseForm] = useState(false);
  const [responseType, setResponseType] = useState<'accepted' | 'rejected' | 'rejected_with_suggestion'>('accepted');
  const [message, setMessage] = useState('');
  const [suggestedDate, setSuggestedDate] = useState('');
  const [suggestedTime, setSuggestedTime] = useState('');
  const [loading, setLoading] = useState(false);

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

  const handleSubmitResponse = async () => {
    setLoading(true);
    try {
      const responseData: AppointmentResponseRequest = {
        appointment_id: appointment.id,
        status: responseType,
        message: message || undefined,
        suggested_date: responseType === 'rejected_with_suggestion' && suggestedDate && suggestedTime 
          ? `${suggestedDate}T${suggestedTime}:00.000Z` 
          : undefined
      };

      const result = await appointmentService.respondToAppointment(responseData);
      onResponse(result);
      setShowResponseForm(false);
    } catch (error: any) {
      console.error('❌ Fehler beim Senden der Antwort:', error);
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

  const getResponseButtonText = () => {
    switch (responseType) {
      case 'accepted': return 'Termin annehmen';
      case 'rejected': return 'Termin ablehnen';
      case 'rejected_with_suggestion': return 'Alternativen Termin vorschlagen';
      default: return 'Antworten';
    }
  };

  const getResponseButtonColor = () => {
    switch (responseType) {
      case 'accepted': return 'from-green-600 to-green-700 hover:from-green-700 hover:to-green-800';
      case 'rejected': return 'from-red-600 to-red-700 hover:from-red-700 hover:to-red-800';
      case 'rejected_with_suggestion': return 'from-yellow-600 to-yellow-700 hover:from-yellow-700 hover:to-yellow-800';
      default: return 'from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800';
    }
  };

  return (
    <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl shadow-2xl border border-slate-700 overflow-hidden">
      {/* Header mit Benachrichtigungs-Icon */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/20 rounded-full">
            <Bell className="text-white" size={20} />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Neue Termineinladung</h3>
            <p className="text-blue-100 text-sm">Sie wurden zu einer Besichtigung eingeladen</p>
          </div>
        </div>
      </div>

      {/* Termin-Details */}
      <div className="p-6">
        <div className="mb-6">
          <h4 className="text-xl font-bold text-white mb-2">{appointment.title}</h4>
          <p className="text-slate-400 mb-4">{appointment.description}</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg">
              <Calendar className="text-blue-400" size={20} />
              <div>
                <p className="text-sm text-slate-400">Datum</p>
                <p className="text-white font-medium">{formatDate(appointment.scheduled_date)}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg">
              <Clock className="text-green-400" size={20} />
              <div>
                <p className="text-sm text-slate-400">Zeit</p>
                <p className="text-white font-medium">{formatTime(appointment.scheduled_date)} ({appointment.duration_minutes} Min.)</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg md:col-span-2">
              <MapPin className="text-red-400" size={20} />
              <div>
                <p className="text-sm text-slate-400">Ort</p>
                <p className="text-white font-medium">{appointment.location || 'Wird noch bekannt gegeben'}</p>
                {appointment.location_details && (
                  <p className="text-slate-400 text-sm mt-1">{appointment.location_details}</p>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between mb-6">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadgeColor(appointment.status)}`}>
              {getStatusText(appointment.status)}
            </span>
            
            <button
              onClick={handleDownloadCalendar}
              className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm"
            >
              <Download size={16} />
              Kalender (.ics)
            </button>
          </div>
        </div>

        {/* Antwort-Bereich */}
        {!showResponseForm ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <button
              onClick={() => {
                setResponseType('accepted');
                setShowResponseForm(true);
              }}
              className="flex items-center justify-center gap-2 p-4 bg-green-600 hover:bg-green-700 text-white rounded-xl transition-colors"
            >
              <CheckCircle size={20} />
              <span className="font-medium">Annehmen</span>
            </button>
            
            <button
              onClick={() => {
                setResponseType('rejected');
                setShowResponseForm(true);
              }}
              className="flex items-center justify-center gap-2 p-4 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-colors"
            >
              <XCircle size={20} />
              <span className="font-medium">Ablehnen</span>
            </button>
            
            <button
              onClick={() => {
                setResponseType('rejected_with_suggestion');
                setShowResponseForm(true);
              }}
              className="flex items-center justify-center gap-2 p-4 bg-yellow-600 hover:bg-yellow-700 text-white rounded-xl transition-colors"
            >
              <AlertTriangle size={20} />
              <span className="font-medium">Alternativtermin</span>
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Response Type Selector */}
            <div className="flex gap-2 p-1 bg-slate-800 rounded-lg">
              <button
                onClick={() => setResponseType('accepted')}
                className={`flex-1 p-2 rounded-md transition-colors ${
                  responseType === 'accepted' 
                    ? 'bg-green-600 text-white' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Annehmen
              </button>
              <button
                onClick={() => setResponseType('rejected')}
                className={`flex-1 p-2 rounded-md transition-colors ${
                  responseType === 'rejected' 
                    ? 'bg-red-600 text-white' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Ablehnen
              </button>
              <button
                onClick={() => setResponseType('rejected_with_suggestion')}
                className={`flex-1 p-2 rounded-md transition-colors ${
                  responseType === 'rejected_with_suggestion' 
                    ? 'bg-yellow-600 text-white' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Alternativtermin
              </button>
            </div>

            {/* Alternativtermin Eingabe */}
            {responseType === 'rejected_with_suggestion' && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Alternatives Datum</label>
                  <input
                    type="date"
                    value={suggestedDate}
                    onChange={(e) => setSuggestedDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Alternative Zeit</label>
                  <input
                    type="time"
                    value={suggestedTime}
                    onChange={(e) => setSuggestedTime(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  />
                </div>
              </div>
            )}

            {/* Nachricht */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
                <MessageCircle size={16} />
                Nachricht (optional)
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Zusätzliche Informationen oder Begründung..."
                className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                rows={3}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowResponseForm(false)}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
              >
                Abbrechen
              </button>
              <button
                onClick={handleSubmitResponse}
                disabled={loading || (responseType === 'rejected_with_suggestion' && (!suggestedDate || !suggestedTime))}
                className={`px-6 py-2 bg-gradient-to-r ${getResponseButtonColor()} text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2`}
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Sende...
                  </>
                ) : (
                  getResponseButtonText()
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 