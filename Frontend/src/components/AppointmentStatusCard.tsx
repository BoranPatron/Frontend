import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  Download, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Bell,
  Eye,
  Settings
} from 'lucide-react';
import { 
  appointmentService, 
  getStatusBadgeColor, 
  getStatusText,
  type AppointmentResponse 
} from '../api/appointmentService';
import InspectionDecisionModal from './InspectionDecisionModal';

interface AppointmentStatusCardProps {
  projectId: number;
  milestoneId?: number;
  onDecisionMade?: (decision: any) => void;
}

export default function AppointmentStatusCard({ 
  projectId, 
  milestoneId, 
  onDecisionMade 
}: AppointmentStatusCardProps) {
  const [appointments, setAppointments] = useState<AppointmentResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentResponse | null>(null);
  const [showDecisionModal, setShowDecisionModal] = useState(false);

  useEffect(() => {
    if (projectId) {
      loadAppointments();
    }
  }, [projectId, milestoneId]);

  // Event-Listener für Appointment-Updates von NotificationTab
  useEffect(() => {
    const handleAppointmentUpdate = (event: CustomEvent) => {
      // Lade Appointments neu wenn ein Update empfangen wurde
      loadAppointments();
    };

    window.addEventListener('appointmentUpdated', handleAppointmentUpdate as EventListener);
    
    return () => {
      window.removeEventListener('appointmentUpdated', handleAppointmentUpdate as EventListener);
    };
  }, []);

  const loadAppointments = async () => {
    setLoading(true);
    try {
      // Nutze den sicheren Endpunkt - rollenbasierte Filterung
      const myAppointments = await appointmentService.getMyAppointments(projectId);
      
      // Filtere nach milestone_id wenn angegeben
      const filteredAppointments = milestoneId 
        ? myAppointments.filter(apt => apt.milestone_id === milestoneId)
        : myAppointments;
       
      // Entferne Duplikate basierend auf ID
      const uniqueAppointments = filteredAppointments.filter((apt, index, self) => 
        index === self.findIndex(a => a.id === apt.id)
      );
      
      setAppointments(uniqueAppointments);
      } catch (error) {
      console.error('❌ AppointmentStatusCard: Fehler beim Laden der Termine:', error);
      // Setze leeres Array bei Fehler, damit die Komponente nicht crasht
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadCalendar = async (appointmentId: number) => {
    try {
      await appointmentService.downloadCalendarEvent(appointmentId);
    } catch (error) {
      console.error('Fehler beim Download:', error);
    }
  };

  const handleShowDecision = (appointment: AppointmentResponse) => {
    setSelectedAppointment(appointment);
    setShowDecisionModal(true);
  };

  const handleDecisionMade = async (decision: any) => {
    await loadAppointments(); // Lade Termine neu
    if (onDecisionMade) {
      onDecisionMade(decision);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-DE', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('de-DE', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isFollowUpDue = (appointment: AppointmentResponse) => {
    if (!appointment.follow_up_notification_date || appointment.follow_up_sent) {
      return false;
    }
    const followUpDate = new Date(appointment.follow_up_notification_date);
    const now = new Date();
    return now >= followUpDate;
  };

  if (loading) {
    return (
      <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
        <div className="animate-pulse flex items-center gap-3">
          <div className="w-8 h-8 bg-slate-600 rounded-lg"></div>
          <div className="flex-1">
            <div className="h-4 bg-slate-600 rounded w-1/3 mb-2"></div>
            <div className="h-3 bg-slate-600 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  if (appointments.length === 0) {
    return null; // Keine Termine vorhanden
  }

  return (
    <>
      <div className="space-y-4">
        {appointments.map((appointment) => (
          <div
            key={appointment.id}
            className="bg-gradient-to-br from-slate-800 via-slate-700 to-slate-800 rounded-xl border border-slate-600 overflow-hidden shadow-xl"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <Calendar className="text-white" size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">{appointment.title}</h3>
                    <p className="text-blue-100 text-sm">
                      {formatDate(appointment.scheduled_date)} um {formatTime(appointment.scheduled_date)}
                    </p>
                  </div>
                </div>
                
                {/* Status und Aktionen */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(appointment.status)}`}>
                      {getStatusText(appointment.status)}
                    </span>
                    
                    {/* Response Status Badges */}
                    {(() => {
                      // Parse responses robustly - handle both array and JSON string
                      let responses = [];
                      if (appointment.responses_array && Array.isArray(appointment.responses_array)) {
                        responses = appointment.responses_array;
                      } else if (appointment.responses) {
                        try {
                          if (typeof appointment.responses === 'string') {
                            responses = JSON.parse(appointment.responses);
                          } else if (Array.isArray(appointment.responses)) {
                            responses = appointment.responses;
                          }
                        } catch (e) {
                          console.error(`❌ Error parsing responses in AppointmentStatusCard:`, e);
                          responses = [];
                        }
                      }
                      
                      return responses && responses.length > 0 && (
                        <div className="flex gap-1">
                          {responses.map((response, idx) => (
                            <span 
                              key={idx}
                              className={`px-2 py-1 rounded-full text-xs font-medium ${
                                response.status === 'accepted' 
                                  ? 'bg-green-100 text-green-800' 
                                : response.status === 'rejected'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}
                          >
                            {response.status === 'accepted' && '✅ Angenommen'}
                            {response.status === 'rejected' && '❌ Abgelehnt'}
                            {response.status === 'rejected_with_suggestion' && '📅 Alternativtermin'}
                          </span>
                        ))}
                      </div>
                      );
                    })()}
                  </div>
                  {isFollowUpDue(appointment) && (
                    <div className="p-1 bg-orange-500 rounded-full">
                      <Bell className="text-white" size={14} />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="flex items-center gap-3 p-3 bg-slate-700/50 rounded-lg">
                  <Clock className="text-blue-400" size={20} />
                  <div>
                    <p className="text-sm text-slate-400">Dauer</p>
                    <p className="text-white font-medium">{appointment.duration_minutes} Minuten</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-3 bg-slate-700/50 rounded-lg">
                  <MapPin className="text-red-400" size={20} />
                  <div>
                    <p className="text-sm text-slate-400">Ort</p>
                    <p className="text-white font-medium">{appointment.location || 'Wird noch bekannt gegeben'}</p>
                  </div>
                </div>
                
                {appointment.invited_service_providers && (
                  <div className="flex items-center gap-3 p-3 bg-slate-700/50 rounded-lg md:col-span-2">
                    <Users className="text-green-400" size={20} />
                    <div>
                      <p className="text-sm text-slate-400">Eingeladene Dienstleister</p>
                      <p className="text-white font-medium">{appointment.invited_service_providers.length} Dienstleister</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Antworten der Service Provider */}
              {appointment.responses && appointment.responses.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-slate-300 mb-2 flex items-center gap-2">
                    <Users size={16} />
                    Antworten der Dienstleister
                  </h4>
                  <div className="space-y-2">
                    {(() => {
                      // Parse responses robustly - handle both array and JSON string
                      let responses = [];
                      if (appointment.responses_array && Array.isArray(appointment.responses_array)) {
                        responses = appointment.responses_array;
                      } else if (appointment.responses) {
                        try {
                          if (typeof appointment.responses === 'string') {
                            responses = JSON.parse(appointment.responses);
                          } else if (Array.isArray(appointment.responses)) {
                            responses = appointment.responses;
                          }
                        } catch (e) {
                          console.error(`❌ Error parsing responses in AppointmentStatusCard modal:`, e);
                          responses = [];
                        }
                      }
                      
                      return responses.map((response, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className={`w-3 h-3 rounded-full ${
                              response.status === 'accepted' ? 'bg-green-500' :
                            response.status === 'rejected' ? 'bg-red-500' :
                            'bg-yellow-500'
                          }`}></div>
                          <span className="text-slate-300">
                            Dienstleister #{response.service_provider_id}
                          </span>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          response.status === 'accepted' ? 'bg-green-100 text-green-800' :
                          response.status === 'rejected' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {response.status === 'accepted' ? 'Angenommen' :
                           response.status === 'rejected' ? 'Abgelehnt' :
                           'Alternativtermin'}
                        </span>
                      </div>
                      ));
                    })()}
                  </div>
                </div>
              )}

              {/* Follow-up Benachrichtigung */}
              {isFollowUpDue(appointment) && !appointment.inspection_completed && (
                <div className="mb-4 p-4 bg-orange-500/10 border border-orange-500/30 rounded-lg">
                  <div className="flex items-center gap-3 mb-3">
                    <Bell className="text-orange-400" size={20} />
                    <div>
                      <h4 className="font-semibold text-orange-300">Follow-up erforderlich</h4>
                      <p className="text-sm text-orange-200">
                        Die Besichtigung hat stattgefunden. Haben Sie sich für einen Dienstleister entschieden?
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleShowDecision(appointment)}
                    className="flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors"
                  >
                    <Settings size={16} />
                    Entscheidung treffen
                  </button>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => handleDownloadCalendar(appointment.id)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  <Download size={16} />
                  Kalender (.ics)
                </button>
                
                {appointment.status === 'scheduled' && (
                  <button
                    onClick={() => handleShowDecision(appointment)}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                  >
                    <Eye size={16} />
                    Entscheidung
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Decision Modal */}
      {selectedAppointment && (
        <InspectionDecisionModal
          isOpen={showDecisionModal}
          onClose={() => {
            setShowDecisionModal(false);
            setSelectedAppointment(null);
          }}
          appointment={selectedAppointment}
          onDecisionMade={handleDecisionMade}
        />
      )}
    </>
  );
} 
