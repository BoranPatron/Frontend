import api from './api';

// Types
export interface AppointmentCreate {
  project_id: number;
  milestone_id?: number;
  title: string;
  description?: string;
  appointment_type: 'INSPECTION' | 'MEETING' | 'CONSULTATION' | 'REVIEW';
  scheduled_date: string;
  duration_minutes: number;
  location?: string;
  location_details?: string;
  // Erweiterte Besichtigungsdetails
  contact_person?: string;
  contact_phone?: string;
  preparation_notes?: string;
  invited_service_provider_ids: number[];
}

export interface AppointmentResponse {
  id: number;
  project_id: number;
  milestone_id?: number;
  created_by: number;
  title: string;
  description?: string;
  appointment_type: string;
  status: string;
  scheduled_date: string;
  duration_minutes: number;
  location?: string;
  location_details?: string;
  // Erweiterte Besichtigungsdetails
  contact_person?: string;
  contact_phone?: string;
  preparation_notes?: string;
  invited_service_providers?: ServiceProviderInvite[];
  responses?: ServiceProviderResponse[];
  responses_array?: ServiceProviderResponse[];
  inspection_completed: boolean;
  selected_service_provider_id?: number;
  inspection_notes?: string;
  requires_renegotiation: boolean;
  renegotiation_details?: string;
  notification_sent: boolean;
  follow_up_notification_date?: string;
  follow_up_sent: boolean;
  created_at: string;
  updated_at: string;
  completed_at?: string;
}

export interface ServiceProviderInvite {
  id: number;
  email: string;
  name: string;
  status: string;
}

export interface ServiceProviderResponse {
  service_provider_id: number;
  status: string;
  message?: string;
  suggested_date?: string;
  responded_at?: string;
}

export interface InspectionDecisionRequest {
  appointment_id: number;
  selected_service_provider_id: number;
  inspection_notes?: string;
  requires_renegotiation: boolean;
  renegotiation_details?: string;
}

export interface AppointmentResponseRequest {
  appointment_id: number;
  status: 'accepted' | 'rejected' | 'rejected_with_suggestion';
  message?: string;
  suggested_date?: string;
}

export interface CalendarEventData {
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  location: string;
  attendees: string[];
  organizer: string;
}

// API Functions
export const appointmentService = {
  // Erstelle neuen Termin
  async createAppointment(data: AppointmentCreate): Promise<AppointmentResponse> {
    const response = await api.post('/appointments/', data);
    return response.data;
  },

  // Hole Termin nach ID
  async getAppointment(appointmentId: number): Promise<AppointmentResponse> {
    const response = await api.get(`/appointments/${appointmentId}`);
    return response.data;
  },

  // Hole alle Termine eines Projekts
  async getProjectAppointments(projectId: number, status?: string): Promise<AppointmentResponse[]> {
    const params = status ? { status } : {};
    const response = await api.get(`/appointments/project/${projectId}`, { params });
    return response.data;
  },

  // Hole meine Termine basierend auf Rolle (SICHERER ENDPUNKT)
  async getMyAppointments(projectId?: number): Promise<AppointmentResponse[]> {
    // Erst Test-Endpoint aufrufen
    try {
      const testResponse = await api.get('/appointments/test-no-deps');
      } catch (error) {
      console.error('❌ Test endpoint failed:', error);
    }
    
    const response = await api.get('/appointments/my-appointments-simple');
    // Convert simple format to expected format
    if (response.data && response.data.appointments) {
      return response.data.appointments.map((apt: any) => ({
        id: apt.id,
        project_id: apt.project_id,
        milestone_id: apt.milestone_id || apt.trade_id, // Use milestone_id if available, fallback to trade_id
        created_by: apt.created_by,
        title: apt.title || `Besichtigung ID ${apt.id}`, // Use real title
        description: apt.description || apt.notes || '',
        appointment_type: apt.appointment_type || 'INSPECTION',
        status: apt.status || 'SCHEDULED',
        scheduled_date: apt.scheduled_date,
        duration_minutes: apt.duration_minutes || 60,
        location: apt.location || '',
        location_details: apt.location_details || '',
        // Erweiterte Besichtigungsdetails
        contact_person: apt.contact_person || '',
        contact_phone: apt.contact_phone || '',
        preparation_notes: apt.preparation_notes || '',
        invited_service_providers: apt.invited_service_providers || [],
        responses: apt.responses || [],
        responses_array: apt.responses_array || [],
        inspection_completed: apt.inspection_completed || false,
        selected_service_provider_id: apt.selected_service_provider_id || null,
        inspection_notes: apt.inspection_notes || '',
        requires_renegotiation: apt.requires_renegotiation || false,
        renegotiation_details: apt.renegotiation_details || '',
        notification_sent: apt.notification_sent || false,
        follow_up_notification_date: apt.follow_up_notification_date || null,
        follow_up_sent: apt.follow_up_sent || false,
        created_at: apt.created_at || apt.scheduled_date,
        updated_at: apt.updated_at || apt.scheduled_date,
        completed_at: apt.completed_at || null
      }));
    }
    
    return [];
  },

  // Hole ausstehende Follow-ups
  async getPendingFollowUps(): Promise<AppointmentResponse[]> {
    const response = await api.get('/appointments/follow-ups/pending');
    return response.data;
  },

  // Service Provider Antwort auf Einladung
  async respondToAppointment(data: AppointmentResponseRequest): Promise<any> {
    const response = await api.post(`/appointments/${data.appointment_id}/respond`, data);
    
    // Benachrichtigung wird jetzt automatisch im Backend erstellt
    console.log('✅ Terminantwort gespeichert - Benachrichtigung wird automatisch vom Backend erstellt');
    
    return response.data;
  },

  // Besichtigung abschließen
  async completeInspection(data: InspectionDecisionRequest): Promise<AppointmentResponse> {
    const response = await api.post(`/appointments/${data.appointment_id}/complete`, data);
    return response.data;
  },

  // Kalendereintrag-Daten abrufen
  async getCalendarEvent(appointmentId: number): Promise<CalendarEventData> {
    const response = await api.get(`/appointments/${appointmentId}/calendar`);
    return response.data;
  },

  // Kalendereintrag (.ics) herunterladen
  async downloadCalendarEvent(appointmentId: number): Promise<void> {
    const response = await api.get(`/appointments/${appointmentId}/calendar/download`, {
      responseType: 'blob'
    });
    
    // Erstelle Download-Link
    const blob = new Blob([response.data], { type: 'text/calendar' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `appointment_${appointmentId}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  },

  // Termin aktualisieren
  async updateAppointment(appointmentId: number, data: Partial<AppointmentCreate>): Promise<AppointmentResponse> {
    const response = await api.put(`/appointments/${appointmentId}`, data);
    return response.data;
  },

  // Termin löschen
  async deleteAppointment(appointmentId: number): Promise<void> {
    await api.delete(`/appointments/${appointmentId}`);
  },

  // Follow-up als gesendet markieren
  async markFollowUpSent(appointmentId: number): Promise<void> {
    await api.post(`/appointments/${appointmentId}/follow-up-sent`);
  },

  // Besichtigung als abgeschlossen markieren
  async markInspectionCompleted(appointmentId: number): Promise<{ message: string; appointment_id: number }> {
    const response = await api.post(`/appointments/${appointmentId}/mark-completed`);
    return response.data;
  },

  // Separaten Termin für einzelnen Dienstleister erstellen
  async createSeparateAppointment(data: {
    project_id: number;
    milestone_id: number;
    service_provider_id: number;
    scheduled_date: string;
    title: string;
    description?: string;
    duration_minutes?: number;
    location?: string;
  }): Promise<AppointmentResponse> {
    const appointmentData = {
      project_id: data.project_id,
      milestone_id: data.milestone_id,
      title: data.title,
      description: data.description || '',
      appointment_type: 'INSPECTION',
      scheduled_date: data.scheduled_date,
      duration_minutes: data.duration_minutes || 60,
      location: data.location || '',
      location_details: '',
      invited_service_provider_ids: [data.service_provider_id]
    };

    const response = await api.post('/appointments/', appointmentData);
    return response.data;
  },

  // Prüfe ob für ein Gewerk ein aktiver Besichtigungstermin existiert
  async checkActiveInspectionForTrade(milestoneId: number): Promise<{
    hasActiveInspection: boolean;
    appointmentDate?: string;
    isInspectionDay: boolean;
    selectedServiceProviderId?: number;
  }> {
    try {
      const appointments = await this.getMyAppointments();
      // Finde Termine für das spezifische Gewerk (Milestone)
      const tradeAppointments = appointments.filter(apt => 
        apt.milestone_id === milestoneId && 
        apt.appointment_type === 'INSPECTION'
      );
      if (tradeAppointments.length === 0) {
        return { hasActiveInspection: false, isInspectionDay: false };
      }

      // Finde den neuesten aktiven Termin
      const activeAppointment = tradeAppointments
        .filter(apt => apt.status !== 'CANCELLED' && apt.status !== 'COMPLETED')
        .sort((a, b) => new Date(b.scheduled_date).getTime() - new Date(a.scheduled_date).getTime())[0];

      if (!activeAppointment) {
        return { hasActiveInspection: false, isInspectionDay: false };
      }

      // Prüfe ob heute der Besichtigungstag ist
      const appointmentDate = new Date(activeAppointment.scheduled_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      appointmentDate.setHours(0, 0, 0, 0);
      const isInspectionDay = appointmentDate.getTime() === today.getTime();

      // Prüfe ob Dienstleister eingeladen wurden (über responses)
      let hasInvitedProviders = false;
      
      // Prüfe verschiedene mögliche Datenfelder
      if (activeAppointment.responses && Array.isArray(activeAppointment.responses)) {
        hasInvitedProviders = activeAppointment.responses.length > 0;
        } else if (activeAppointment.responses_array && Array.isArray(activeAppointment.responses_array)) {
        hasInvitedProviders = activeAppointment.responses_array.length > 0;
        } else if (activeAppointment.invited_service_providers && Array.isArray(activeAppointment.invited_service_providers)) {
        hasInvitedProviders = activeAppointment.invited_service_providers.length > 0;
        } else if (activeAppointment.appointment_responses && Array.isArray(activeAppointment.appointment_responses)) {
        hasInvitedProviders = activeAppointment.appointment_responses.length > 0;
        }
      
      console.log('🔍 DEBUG: Alle verfügbaren Felder im activeAppointment:', Object.keys(activeAppointment));

      if (!hasInvitedProviders) {
        }

      const result = {
        hasActiveInspection: hasInvitedProviders,
        appointmentDate: activeAppointment.scheduled_date,
        isInspectionDay,
        selectedServiceProviderId: activeAppointment.selected_service_provider_id
      };

      return result;
    } catch (error) {
      console.error('❌ Fehler beim Prüfen der Besichtigungstermine:', error);
      return { hasActiveInspection: false, isInspectionDay: false };
    }
  }
};

// Helper Functions
export const formatAppointmentDateTime = (date: string, time: string): string => {
  return `${date}T${time}:00.000Z`;
};

export const parseAppointmentDateTime = (datetime: string): { date: string; time: string } => {
  const dt = new Date(datetime);
  const date = dt.toISOString().split('T')[0];
  const time = dt.toTimeString().split(' ')[0].substring(0, 5);
  return { date, time };
};

export const calculateDuration = (startTime: string, endTime: string): number => {
  const start = new Date(`2000-01-01T${startTime}`);
  const end = new Date(`2000-01-01T${endTime}`);
  return Math.round((end.getTime() - start.getTime()) / (1000 * 60));
};

export const getStatusBadgeColor = (status: string): string => {
  switch (status) {
    case 'scheduled': return 'bg-blue-100 text-blue-800';
    case 'confirmed': return 'bg-green-100 text-green-800';
    case 'accepted': return 'bg-green-100 text-green-800';
    case 'rejected': return 'bg-red-100 text-red-800';
    case 'rejected_with_suggestion': return 'bg-yellow-100 text-yellow-800';
    case 'completed': return 'bg-gray-100 text-gray-800';
    case 'cancelled': return 'bg-gray-100 text-gray-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

export const getStatusText = (status: string): string => {
  switch (status) {
    case 'scheduled': return 'Geplant';
    case 'confirmed': return 'Bestätigt';
    case 'accepted': return 'Angenommen';
    case 'rejected': return 'Abgelehnt';
    case 'rejected_with_suggestion': return 'Abgelehnt mit Vorschlag';
    case 'completed': return 'Abgeschlossen';
    case 'cancelled': return 'Abgebrochen';
    default: return status;
  }
}; 
