import api from './api';

export interface NotificationData {
  id?: number;
  recipient_id: number;
  type: 'quote_submitted' | 'quote_accepted' | 'quote_rejected' | 'quote_revised' | 
        'appointment_request' | 'appointment_confirmed' | 'milestone_completed' | 
        'defects_resolved' | 'acceptance_with_defects' | 'invoice_submitted' | 
        'payment_received' | 'document_uploaded' | 'project_status_changed' | 
        'system_announcement' | 'resource_allocated' | 'tender_invitation';
  title: string;
  message: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  data?: string; // JSON-String für zusätzliche Daten
  related_quote_id?: number;
  related_project_id?: number;
  related_milestone_id?: number;
  related_appointment_id?: number;
  is_read?: boolean;
  is_acknowledged?: boolean;
  created_at?: string;
  read_at?: string;
  acknowledged_at?: string;
}

export interface EmailNotificationData {
  type: 'completion_notification' | 'task_reminder' | 'appointment_reminder';
  project_id: number;
  trade_id?: number;
  recipients: string[];
  subject: string;
  template_data: Record<string, any>;
}

export const notificationService = {
  // Benachrichtigung erstellen
  async createNotification(data: NotificationData): Promise<NotificationData> {
    try {
      const response = await api.post('/notifications', data);
      console.log('✅ Benachrichtigung erstellt:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Fehler beim Erstellen der Benachrichtigung:', error);
      throw error;
    }
  },

  // Alle Benachrichtigungen für einen Benutzer abrufen
  async getNotifications(userId?: number, unreadOnly: boolean = false): Promise<NotificationData[]> {
    try {
      const params: any = {};
      if (userId) params.user_id = userId;
      if (unreadOnly) params.unread_only = true;

      const response = await api.get('/notifications', { params });
      return response.data || [];
    } catch (error) {
      console.error('❌ Fehler beim Laden der Benachrichtigungen:', error);
      return [];
    }
  },

  // Benachrichtigung als gelesen markieren
  async markAsRead(notificationId: number): Promise<void> {
    try {
      await api.patch(`/notifications/${notificationId}/read`);
      console.log('✅ Benachrichtigung als gelesen markiert:', notificationId);
    } catch (error) {
      console.error('❌ Fehler beim Markieren als gelesen:', error);
      throw error;
    }
  },

  // Benachrichtigung als quittiert markieren (acknowledge)
  async acknowledgeNotification(notificationId: number): Promise<void> {
    try {
      await api.patch(`/notifications/${notificationId}/acknowledge`);
      console.log('✅ Benachrichtigung quittiert:', notificationId);
    } catch (error) {
      console.error('❌ Fehler beim Quittieren der Benachrichtigung:', error);
      throw error;
    }
  },

  // Mehrere Benachrichtigungen als gelesen markieren
  async markMultipleAsRead(notificationIds: number[]): Promise<void> {
    try {
      await api.patch('/notifications/mark-read', { 
        notification_ids: notificationIds 
      });
      console.log('✅ Mehrere Benachrichtigungen als gelesen markiert');
    } catch (error) {
      console.error('❌ Fehler beim Markieren mehrerer Benachrichtigungen:', error);
      throw error;
    }
  },

  // Benachrichtigung löschen
  async deleteNotification(notificationId: number): Promise<void> {
    try {
      await api.delete(`/notifications/${notificationId}`);
      console.log('✅ Benachrichtigung gelöscht:', notificationId);
    } catch (error) {
      console.error('❌ Fehler beim Löschen der Benachrichtigung:', error);
      throw error;
    }
  },

  // E-Mail-Benachrichtigung senden
  async sendEmailNotification(data: EmailNotificationData): Promise<void> {
    try {
      const response = await api.post('/notifications/email', data);
      console.log('✅ E-Mail-Benachrichtigung gesendet:', response.data);
    } catch (error) {
      console.error('❌ Fehler beim Senden der E-Mail-Benachrichtigung:', error);
      throw error;
    }
  },

  // Fertigstellungs-Benachrichtigung erstellen (Spezialfunktion)
  async createCompletionNotification(data: {
    trade_id: number;
    project_id: number;
    trade_title: string;
    project_name: string;
    service_provider: string;
    service_provider_id: number;
    recipient_id: number;
  }): Promise<NotificationData> {
    const notificationData: NotificationData = {
      recipient_id: data.recipient_id,
      type: 'milestone_completed',
      title: `Fertigstellungsmeldung: ${data.trade_title}`,
      message: `Der Dienstleister hat das Gewerk "${data.trade_title}" als fertiggestellt markiert und bittet um Abnahme.`,
      priority: 'high',
      data: JSON.stringify({
        description: `Projekt: ${data.project_name}\nGewerk: ${data.trade_title}\nDienstleister: ${data.service_provider}`,
        trade_title: data.trade_title,
        project_name: data.project_name,
        service_provider: data.service_provider,
        completion_date: new Date().toISOString(),
        service_provider_id: data.service_provider_id,
        actions_available: [
          'view_trade',
          'schedule_inspection', 
          'start_acceptance',
          'send_email'
        ]
      }),
      related_project_id: data.project_id,
      related_milestone_id: data.trade_id
    };

    return this.createNotification(notificationData);
  },

  // Fertigstellungs-E-Mail senden (Spezialfunktion)
  async sendCompletionEmail(data: {
    project_id: number;
    trade_id: number;
    project_name: string;
    trade_title: string;
    service_provider: string;
    recipients: string[];
  }): Promise<void> {
    const emailData: EmailNotificationData = {
      type: 'completion_notification',
      project_id: data.project_id,
      trade_id: data.trade_id,
      recipients: data.recipients,
      subject: `Fertigstellungsmeldung: ${data.trade_title} - ${data.project_name}`,
      template_data: {
        project_name: data.project_name,
        trade_title: data.trade_title,
        service_provider: data.service_provider,
        completion_date: new Date().toLocaleDateString('de-DE'),
        project_url: `${window.location.origin}/project/${data.project_id}`,
        trade_url: `${window.location.origin}/project/${data.project_id}?trade=${data.trade_id}`,
        action_required: 'Abnahme erforderlich',
        next_steps: [
          'Abnahmetermin vereinbaren',
          'Gewerk besichtigen',
          'Abnahmeprotokoll erstellen'
        ]
      }
    };

    return this.sendEmailNotification(emailData);
  },

  // Benachrichtigungs-Statistiken abrufen
  async getNotificationStats(userId?: number): Promise<{
    total: number;
    unread: number;
    high_priority: number;
    requires_action: number;
  }> {
    try {
      const params: any = {};
      if (userId) params.user_id = userId;

      const response = await api.get('/notifications/stats', { params });
      return response.data || { total: 0, unread: 0, high_priority: 0, requires_action: 0 };
    } catch (error) {
      console.error('❌ Fehler beim Laden der Benachrichtigungs-Statistiken:', error);
      return { total: 0, unread: 0, high_priority: 0, requires_action: 0 };
    }
  },

  // Ressourcen-Vorauswahl Benachrichtigung erstellen
  async createResourcePreselectionNotification(data: {
    trade_id: number;
    resource_id: number;
    allocation_id: number;
    project_name: string;
    trade_title: string;
    bautraeger_name: string;
    service_provider_id: number;
    recipient_id: number;
  }): Promise<NotificationData> {
    const notificationData: NotificationData = {
      recipient_id: data.recipient_id,
      type: 'resource_allocated',
      title: `Ressourcen-Vorauswahl für ${data.trade_title}`,
      message: `Sie wurden für die Ausschreibung "${data.trade_title}" im Projekt "${data.project_name}" vorausgewählt.`,
      priority: 'high',
      data: JSON.stringify({
        description: `Bauträger: ${data.bautraeger_name}\nProjekt: ${data.project_name}\nAusschreibung: ${data.trade_title}`,
        trade_title: data.trade_title,
        project_name: data.project_name,
        bautraeger_name: data.bautraeger_name,
        preselection_date: new Date().toISOString(),
        resource_id: data.resource_id,
        allocation_id: data.allocation_id,
        actions_available: [
          'view_trade_details',
          'create_offer', 
          'decline_invitation'
        ]
      }),
      related_project_id: data.trade_id,
      related_milestone_id: data.trade_id
    };

    return this.createNotification(notificationData);
  },

  // Ressourcen-Einladung Benachrichtigung
  async createResourceInvitationNotification(data: {
    trade_id: number;
    resource_id: number;
    allocation_id: number;
    project_name: string;
    trade_title: string;
    deadline?: string;
    service_provider_id: number;
  }): Promise<NotificationData> {
    const notificationData: NotificationData = {
      type: 'resource_invitation',
      title: `Einladung zur Angebotsabgabe: ${data.trade_title}`,
      message: `Sie wurden eingeladen, ein Angebot für "${data.trade_title}" abzugeben.`,
      description: `Projekt: ${data.project_name}\nFrist: ${data.deadline || 'Keine Frist angegeben'}`,
      priority: 'urgent',
      requires_action: true,
      action_type: 'submit_offer',
      trade_id: data.trade_id,
      resource_id: data.resource_id,
      allocation_id: data.allocation_id,
      user_id: data.service_provider_id,
      metadata: {
        trade_title: data.trade_title,
        project_name: data.project_name,
        deadline: data.deadline,
        invitation_date: new Date().toISOString(),
        actions_available: [
          'view_requirements',
          'submit_offer',
          'request_information',
          'decline'
        ]
      }
    };

    return this.createNotification(notificationData);
  },

  // Ressourcen-Zuordnung Benachrichtigung erstellen
  async createResourceAllocatedNotification(data: {
    allocation_id: number;
    resource_id: number;
    trade_id: number;
    project_name: string;
    trade_title: string;
    bautraeger_name: string;
    service_provider_id: number;
    allocated_start_date?: string;
    allocated_end_date?: string;
    allocated_person_count: number;
  }): Promise<NotificationData> {
    const notificationData: NotificationData = {
      type: 'resource_allocated',
      title: `Ressource einer Ausschreibung zugeordnet`,
      message: `Ihre Ressource wurde der Ausschreibung "${data.trade_title}" im Projekt "${data.project_name}" zugeordnet.`,
      description: `Bauträger: ${data.bautraeger_name}\nProjekt: ${data.project_name}\nAusschreibung: ${data.trade_title}`,
      priority: 'high',
      requires_action: true,
      action_type: 'view_tender_details',
      trade_id: data.trade_id,
      resource_id: data.resource_id,
      allocation_id: data.allocation_id,
      user_id: data.service_provider_id,
      metadata: {
        trade_title: data.trade_title,
        project_name: data.project_name,
        bautraeger_name: data.bautraeger_name,
        allocated_start_date: data.allocated_start_date,
        allocated_end_date: data.allocated_end_date,
        allocated_person_count: data.allocated_person_count,
        allocation_date: new Date().toISOString(),
        actions_available: [
          'view_tender_details',
          'create_offer',
          'request_information'
        ]
      }
    };

    return this.createNotification(notificationData);
  },

  // Einladung zur Angebotsabgabe Benachrichtigung erstellen
  async createTenderInvitationNotification(data: {
    allocation_id: number;
    resource_id: number;
    trade_id: number;
    project_name: string;
    trade_title: string;
    bautraeger_name: string;
    service_provider_id: number;
    deadline?: string;
    allocated_start_date?: string;
    allocated_end_date?: string;
    allocated_person_count: number;
  }): Promise<NotificationData> {
    const notificationData: NotificationData = {
      type: 'tender_invitation',
      title: `Einladung zur Angebotsabgabe`,
      message: `Sie wurden eingeladen, ein Angebot für "${data.trade_title}" im Projekt "${data.project_name}" abzugeben.`,
      description: `Bauträger: ${data.bautraeger_name}\nProjekt: ${data.project_name}\nAusschreibung: ${data.trade_title}${data.deadline ? `\nAbgabefrist: ${new Date(data.deadline).toLocaleDateString('de-DE')}` : ''}`,
      priority: 'urgent',
      requires_action: true,
      action_type: 'submit_offer',
      trade_id: data.trade_id,
      resource_id: data.resource_id,
      allocation_id: data.allocation_id,
      user_id: data.service_provider_id,
      metadata: {
        trade_title: data.trade_title,
        project_name: data.project_name,
        bautraeger_name: data.bautraeger_name,
        deadline: data.deadline,
        allocated_start_date: data.allocated_start_date,
        allocated_end_date: data.allocated_end_date,
        allocated_person_count: data.allocated_person_count,
        invitation_date: new Date().toISOString(),
        actions_available: [
          'view_tender_details',
          'submit_offer',
          'request_information',
          'decline_invitation'
        ]
      }
    };

    return this.createNotification(notificationData);
  },

  // Event-basierte Benachrichtigungen (für Real-time Updates)
  subscribeToNotifications(userId: number, callback: (notification: NotificationData) => void): () => void {
    // WebSocket oder EventSource Implementation würde hier stehen
    console.log('🔔 Abonniere Benachrichtigungen für User:', userId);
    
    // Fallback: Polling alle 30 Sekunden
    const interval = setInterval(async () => {
      try {
        const notifications = await this.getNotifications(userId, true);
        notifications.forEach(callback);
      } catch (error) {
        console.error('❌ Fehler beim Polling von Benachrichtigungen:', error);
      }
    }, 30000);

    // Cleanup-Funktion zurückgeben
    return () => {
      clearInterval(interval);
      console.log('🔕 Benachrichtigungs-Abonnement beendet');
    };
  }
};

// Helper-Funktionen
export const createCompletionNotificationData = (
  trade: any, 
  project: any, 
  serviceProvider: any,
  recipientId: number
): NotificationData => ({
  recipient_id: recipientId,
  type: 'milestone_completed',
  title: `Fertigstellungsmeldung: ${trade.title}`,
  message: `Der Dienstleister hat das Gewerk "${trade.title}" als fertiggestellt markiert und bittet um Abnahme.`,
  priority: 'high',
  data: JSON.stringify({
    description: `Projekt: ${project.name}\nGewerk: ${trade.title}\nDienstleister: ${serviceProvider.name}`,
    trade_title: trade.title,
    project_name: project.name,
    service_provider: serviceProvider.name,
    completion_date: new Date().toISOString(),
    service_provider_id: serviceProvider.id
  }),
  related_project_id: project.id,
  related_milestone_id: trade.id
});

export const getNotificationPriorityColor = (priority: string): string => {
  switch (priority) {
    case 'urgent': return 'text-red-400 bg-red-500/10 border-red-500/30';
    case 'high': return 'text-orange-400 bg-orange-500/10 border-orange-500/30';
    case 'medium': return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30';
    case 'low': return 'text-blue-400 bg-blue-500/10 border-blue-500/30';
    default: return 'text-gray-400 bg-gray-500/10 border-gray-500/30';
  }
};

export const getNotificationTypeIcon = (type: string) => {
  switch (type) {
    case 'milestone_completed': return '✅';
    case 'appointment_request': return '📅';
    case 'appointment_confirmed': return '📅';
    case 'invoice_submitted': return '🧾';
    case 'quote_submitted': return '💰';
    case 'quote_accepted': return '✅';
    case 'quote_rejected': return '❌';
    case 'resource_allocated': return '👥';
    case 'tender_invitation': return '📋';
    default: return '📢';
  }
};
