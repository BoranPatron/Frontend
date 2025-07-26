import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { appointmentService, AppointmentResponse } from '../api/appointmentService';
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  Calendar, 
  User, 
  MessageSquare,
  AlertTriangle,
  RefreshCw,
  Eye,
  ChevronDown,
  ChevronUp,
  Plus,
  UserCheck,
  UserX
} from 'lucide-react';

interface AppointmentResponseTrackerProps {
  projectId: number;
  milestoneId: number;
  className?: string;
}

interface ServiceProviderResponse {
  service_provider_id: number;
  status: 'accepted' | 'rejected' | 'rejected_with_suggestion';
  message?: string;
  suggested_date?: string;
  responded_at: string;
}

export default function AppointmentResponseTracker({ 
  projectId, 
  milestoneId, 
  className = '' 
}: AppointmentResponseTrackerProps) {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<AppointmentResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedAppointment, setExpandedAppointment] = useState<number | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    loadAppointments();
    
    // Listen for appointment updates
    const handleAppointmentUpdate = () => {
      loadAppointments();
    };
    
    // Listen for both event types
    window.addEventListener('appointmentUpdate', handleAppointmentUpdate);
    window.addEventListener('appointmentUpdated', handleAppointmentUpdate);
    return () => {
      window.removeEventListener('appointmentUpdate', handleAppointmentUpdate);
      window.removeEventListener('appointmentUpdated', handleAppointmentUpdate);
    };
  }, [projectId, milestoneId]);

  const loadAppointments = async () => {
    try {
      setLoading(true);
      console.log(`🔍 [BAUTRAEGER-DEBUG] Loading appointments for project ${projectId}, milestone ${milestoneId}`);
      
      const allAppointments = await appointmentService.getMyAppointments();
      console.log(`📊 [BAUTRAEGER-DEBUG] Received ${allAppointments.length} total appointments:`, allAppointments);
      
      // Filter appointments for this milestone
      const relevantAppointments = allAppointments.filter(apt => 
        apt.project_id === projectId && apt.milestone_id === milestoneId
      );
      
      console.log(`🎯 [BAUTRAEGER-DEBUG] Found ${relevantAppointments.length} relevant appointments:`, relevantAppointments);
      
      setAppointments(relevantAppointments);
      setError(null);
    } catch (err) {
      console.error('❌ [BAUTRAEGER-DEBUG] Fehler beim Laden der Termine:', err);
      setError('Fehler beim Laden der Termine');
    } finally {
      setLoading(false);
    }
  };

  // Handler für Bauträger-Aktionen
  const handleAcceptSuggestion = async (appointmentId: number, serviceProviderId: number, suggestedDate: string) => {
    const actionKey = `accept-${appointmentId}-${serviceProviderId}`;
    setActionLoading(actionKey);
    
    try {
      console.log(`🔄 Bauträger akzeptiert Neuvorschlag von Provider ${serviceProviderId} für Termin ${appointmentId}`);
      
      // Erstelle separaten Termin für den Dienstleister
      await appointmentService.createSeparateAppointment({
        project_id: projectId,
        milestone_id: milestoneId,
        service_provider_id: serviceProviderId,
        scheduled_date: suggestedDate,
        title: `Besichtigung - Einzeltermin`,
        description: `Separater Termin basierend auf Neuvorschlag`
      });
      
      console.log('✅ Separater Termin erfolgreich erstellt');
      
      // Aktualisiere die Anzeige
      await loadAppointments();
      
      // Dispatch event für andere Komponenten
      window.dispatchEvent(new CustomEvent('appointmentUpdated'));
      
    } catch (error) {
      console.error('❌ Fehler beim Akzeptieren des Neuvorschlags:', error);
      setError('Fehler beim Akzeptieren des Neuvorschlags');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectSuggestion = async (appointmentId: number, serviceProviderId: number) => {
    const actionKey = `reject-${appointmentId}-${serviceProviderId}`;
    setActionLoading(actionKey);
    
    try {
      console.log(`🔄 Bauträger lehnt Neuvorschlag von Provider ${serviceProviderId} für Termin ${appointmentId} ab`);
      
      // Hier könnte eine API-Funktion aufgerufen werden, um die Ablehnung zu protokollieren
      // Für jetzt loggen wir nur
      console.log('✅ Neuvorschlag abgelehnt (nur geloggt)');
      
      // Aktualisiere die Anzeige
      await loadAppointments();
      
    } catch (error) {
      console.error('❌ Fehler beim Ablehnen des Neuvorschlags:', error);
      setError('Fehler beim Ablehnen des Neuvorschlags');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCreateSeparateAppointment = async (serviceProviderId: number, providerName: string) => {
    const actionKey = `create-${serviceProviderId}`;
    setActionLoading(actionKey);
    
    try {
      console.log(`🔄 Bauträger erstellt separaten Termin für Provider ${serviceProviderId}`);
      
      // Erstelle neuen Termin nur für diesen Dienstleister
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(10, 0, 0, 0);
      
      await appointmentService.createSeparateAppointment({
        project_id: projectId,
        milestone_id: milestoneId,
        service_provider_id: serviceProviderId,
        scheduled_date: tomorrow.toISOString(),
        title: `Separater Besichtigungstermin - ${providerName}`,
        description: `Individueller Termin für ${providerName}`
      });
      
      console.log('✅ Separater Termin erfolgreich erstellt');
      
      // Aktualisiere die Anzeige
      await loadAppointments();
      
      // Dispatch event für andere Komponenten
      window.dispatchEvent(new CustomEvent('appointmentUpdated'));
      
    } catch (error) {
      console.error('❌ Fehler beim Erstellen des separaten Termins:', error);
      setError('Fehler beim Erstellen des separaten Termins');
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'accepted':
        return <CheckCircle size={16} className="text-green-400" />;
      case 'rejected':
        return <XCircle size={16} className="text-red-400" />;
      case 'rejected_with_suggestion':
        return <AlertTriangle size={16} className="text-yellow-400" />;
      default:
        return <Clock size={16} className="text-gray-400" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'accepted':
        return 'Angenommen';
      case 'rejected':
        return 'Abgelehnt';
      case 'rejected_with_suggestion':
        return 'Neuer Vorschlag';
      default:
        return 'Ausstehend';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'rejected':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'rejected_with_suggestion':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('de-DE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Ungültiges Datum';
    }
  };

  if (loading) {
    return (
      <div className={`bg-[#2a2a2a] rounded-lg p-4 ${className}`}>
        <div className="flex items-center gap-2 mb-4">
          <RefreshCw size={20} className="text-[#ffbd59] animate-spin" />
          <h3 className="text-lg font-semibold text-white">Lade Terminantworten...</h3>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-[#2a2a2a] rounded-lg p-4 ${className}`}>
        <div className="flex items-center gap-2 text-red-400">
          <XCircle size={20} />
          <span>{error}</span>
        </div>
      </div>
    );
  }

  if (appointments.length === 0) {
    return (
      <div className={`bg-[#2a2a2a] rounded-lg p-4 ${className}`}>
        <div className="flex items-center gap-2 mb-2">
          <Calendar size={20} className="text-[#ffbd59]" />
          <h3 className="text-lg font-semibold text-white">Terminantworten</h3>
        </div>
        <p className="text-gray-400 text-sm">Keine Besichtigungstermine für dieses Gewerk</p>
      </div>
    );
  }

  return (
    <div className={`bg-[#2a2a2a] rounded-lg p-4 ${className}`}>
      <div className="flex items-center gap-2 mb-4">
        <Calendar size={20} className="text-[#ffbd59]" />
        <h3 className="text-lg font-semibold text-white">
          Terminantworten ({appointments.length})
        </h3>
      </div>

             <div className="space-y-3">
         {appointments.map((appointment) => {
           console.log(`🔍 [BAUTRAEGER-DEBUG] Processing appointment ${appointment.id}:`, appointment);
           
                       // Parse responses with new data structure adaptation
            let responses: ServiceProviderResponse[] = [];
            
            console.log(`🔍 [BAUTRAEGER-DEBUG] Raw appointment data for ${appointment.id}:`, {
              responses_array: appointment.responses_array,
              responses: appointment.responses,
              responses_type: typeof appointment.responses
            });
            
            if (appointment.responses_array && Array.isArray(appointment.responses_array)) {
              responses = appointment.responses_array;
              console.log(`✅ [BAUTRAEGER-DEBUG] Using new responses_array for appointment ${appointment.id}:`, responses);
            } else if (appointment.responses) {
              try {
                if (typeof appointment.responses === 'string') {
                  responses = JSON.parse(appointment.responses);
                } else if (Array.isArray(appointment.responses)) {
                  responses = appointment.responses;
                }
                console.log(`✅ [BAUTRAEGER-DEBUG] Parsed legacy responses for appointment ${appointment.id}:`, responses);
              } catch (e) {
                console.error(`❌ [BAUTRAEGER-DEBUG] Error parsing responses for appointment ${appointment.id}:`, e);
                responses = [];
              }
            } else {
              console.log(`⚠️ [BAUTRAEGER-DEBUG] No responses found for appointment ${appointment.id} - both responses_array and responses are empty/null`);
            }
           
                       let invitedProviders = [];
            
            console.log(`🔍 [BAUTRAEGER-DEBUG] Raw invited_service_providers for ${appointment.id}:`, {
              data: appointment.invited_service_providers,
              type: typeof appointment.invited_service_providers
            });
            
            if (Array.isArray(appointment.invited_service_providers)) {
              invitedProviders = appointment.invited_service_providers;
              console.log(`✅ [BAUTRAEGER-DEBUG] Using array invited_service_providers:`, invitedProviders);
            } else if (typeof appointment.invited_service_providers === 'string') {
              try {
                invitedProviders = JSON.parse(appointment.invited_service_providers);
                console.log(`✅ [BAUTRAEGER-DEBUG] Parsed string invited_service_providers:`, invitedProviders);
              } catch (e) {
                console.error(`❌ [BAUTRAEGER-DEBUG] Error parsing invited_service_providers:`, e);
                invitedProviders = [];
              }
            } else {
              console.log(`⚠️ [BAUTRAEGER-DEBUG] No invited_service_providers found for appointment ${appointment.id}`);
            }
           
           console.log(`📊 [BAUTRAEGER-DEBUG] Appointment ${appointment.id} - Responses: ${responses.length}, Invited: ${invitedProviders.length}`);

          const isExpanded = expandedAppointment === appointment.id;

          return (
            <div key={appointment.id} className="bg-[#1a1a1a] rounded-lg p-3 border border-gray-700">
              {/* Appointment Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Calendar size={16} className="text-[#ffbd59]" />
                  <span className="text-white font-medium">
                    {appointment.title || `Besichtigung #${appointment.id}`}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-400">
                    {formatDate(appointment.scheduled_date)}
                  </span>
                  <button
                    onClick={() => setExpandedAppointment(isExpanded ? null : appointment.id)}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                </div>
              </div>

              {/* Response Summary Badges */}
              <div className="flex flex-wrap gap-2 mb-3">
                {invitedProviders.map((provider, index) => {
                  const response = responses.find(r => r.service_provider_id === provider.id);
                  const status = response?.status || 'pending';
                  
                  return (
                    <div
                      key={provider.id || index}
                      className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs border ${getStatusColor(status)}`}
                    >
                      {getStatusIcon(status)}
                      <span>{provider.name || `Anbieter ${provider.id}`}</span>
                      <span className="font-medium">{getStatusText(status)}</span>
                      
                      {/* Bauträger-Aktion: Separaten Termin erstellen */}
                      {user?.user_role === 'BAUTRAEGER' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCreateSeparateAppointment(provider.id, provider.name || `Anbieter ${provider.id}`);
                          }}
                          disabled={actionLoading === `create-${provider.id}`}
                          className="ml-1 p-1 text-[#ffbd59] hover:bg-[#ffbd59]/20 rounded transition-colors disabled:opacity-50"
                          title="Separaten Termin erstellen"
                        >
                          {actionLoading === `create-${provider.id}` ? (
                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-[#ffbd59]"></div>
                          ) : (
                            <Plus size={12} />
                          )}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Expanded Details */}
              {isExpanded && (
                <div className="border-t border-gray-600 pt-3 mt-3">
                  <div className="space-y-3">
                    {/* Appointment Details */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-400">Status:</span>
                        <div className="flex items-center gap-1 mt-1">
                          {getStatusIcon(appointment.status)}
                          <span className="text-white">{getStatusText(appointment.status)}</span>
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-400">Dauer:</span>
                        <span className="text-white block mt-1">{appointment.duration_minutes} Min</span>
                      </div>
                      {appointment.location && (
                        <div className="col-span-2">
                          <span className="text-gray-400">Ort:</span>
                          <span className="text-white block mt-1">{appointment.location}</span>
                        </div>
                      )}
                    </div>

                    {/* Detailed Responses */}
                    {responses.length > 0 && (
                      <div>
                        <h4 className="text-white font-medium mb-2">Detaillierte Antworten:</h4>
                        <div className="space-y-2">
                          {responses.map((response, index) => (
                            <div key={index} className="bg-[#0a0a0a] p-3 rounded border border-gray-600">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <User size={14} className="text-gray-400" />
                                  <span className="text-white text-sm">
                                    Anbieter {response.service_provider_id}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  {getStatusIcon(response.status)}
                                  <span className={`text-xs px-2 py-1 rounded ${getStatusColor(response.status)}`}>
                                    {getStatusText(response.status)}
                                  </span>
                                </div>
                              </div>
                              
                              {response.message && (
                                <div className="mb-2">
                                  <div className="flex items-center gap-1 mb-1">
                                    <MessageSquare size={12} className="text-gray-400" />
                                    <span className="text-gray-400 text-xs">Nachricht:</span>
                                  </div>
                                  <p className="text-white text-sm bg-[#1a1a1a] p-2 rounded">
                                    {response.message}
                                  </p>
                                </div>
                              )}
                              
                              {response.suggested_date && (
                                <div className="mb-2">
                                  <div className="flex items-center gap-1 mb-1">
                                    <Calendar size={12} className="text-yellow-400" />
                                    <span className="text-gray-400 text-xs">Vorgeschlagener Termin:</span>
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <p className="text-yellow-400 text-sm">
                                      {formatDate(response.suggested_date)}
                                    </p>
                                    
                                    {/* Bauträger-Aktionen für Neuvorschläge */}
                                    {user?.user_role === 'BAUTRAEGER' && response.status === 'rejected_with_suggestion' && (
                                      <div className="flex items-center gap-2 ml-3">
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleAcceptSuggestion(appointment.id, response.service_provider_id, response.suggested_date);
                                          }}
                                          disabled={actionLoading === `accept-${appointment.id}-${response.service_provider_id}`}
                                          className="flex items-center gap-1 px-2 py-1 bg-green-500/20 text-green-400 border border-green-500/30 rounded text-xs hover:bg-green-500/30 transition-colors disabled:opacity-50"
                                        >
                                          {actionLoading === `accept-${appointment.id}-${response.service_provider_id}` ? (
                                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-green-400"></div>
                                          ) : (
                                            <UserCheck size={12} />
                                          )}
                                          Annehmen
                                        </button>
                                        
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleRejectSuggestion(appointment.id, response.service_provider_id);
                                          }}
                                          disabled={actionLoading === `reject-${appointment.id}-${response.service_provider_id}`}
                                          className="flex items-center gap-1 px-2 py-1 bg-red-500/20 text-red-400 border border-red-500/30 rounded text-xs hover:bg-red-500/30 transition-colors disabled:opacity-50"
                                        >
                                          {actionLoading === `reject-${appointment.id}-${response.service_provider_id}` ? (
                                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-red-400"></div>
                                          ) : (
                                            <UserX size={12} />
                                          )}
                                          Ablehnen
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                              
                              <div className="text-xs text-gray-500">
                                Geantwortet: {formatDate(response.responded_at)}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
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