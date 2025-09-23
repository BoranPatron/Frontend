import api from './api';

export interface NotificationData {
  id?: number;
  type: 'completion_request' | 'appointment_invitation' | 'task_assignment' | 'general' | 
        'resource_preselection' | 'resource_invitation' | 'resource_offer_requested' | 'resource_allocated';
  title: string;
  message: string;
  description?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  requires_action?: boolean;
  action_type?: string;
  project_id?: number;
  milestone_id?: number;
  trade_id?: number;
  user_id?: number;
  resource_id?: number;
  allocation_id?: number;
  metadata?: Record<string, any>;
  read_at?: string;
  created_at?: string;
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
  }): Promise<NotificationData> {
    const notificationData: NotificationData = {
      type: 'completion_request',
      title: `Fertigstellungsmeldung: ${data.trade_title}`,
      message: `Der Dienstleister hat das Gewerk "${data.trade_title}" als fertiggestellt markiert und bittet um Abnahme.`,
      description: `Projekt: ${data.project_name}\nGewerk: ${data.trade_title}\nDienstleister: ${data.service_provider}`,
      priority: 'high',
      requires_action: true,
      action_type: 'acceptance_review',
      project_id: data.project_id,
      milestone_id: data.trade_id,
      trade_id: data.trade_id,
      metadata: {
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
      }
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
  }): Promise<NotificationData> {
    const notificationData: NotificationData = {
      type: 'resource_preselection',
      title: `Ressourcen-Vorauswahl für ${data.trade_title}`,
      message: `Sie wurden für die Ausschreibung "${data.trade_title}" im Projekt "${data.project_name}" vorausgewählt.`,
      description: `Bauträger: ${data.bautraeger_name}\nProjekt: ${data.project_name}\nAusschreibung: ${data.trade_title}`,
      priority: 'high',
      requires_action: true,
      action_type: 'create_offer',
      project_id: data.trade_id,
      trade_id: data.trade_id,
      resource_id: data.resource_id,
      allocation_id: data.allocation_id,
      user_id: data.service_provider_id,
      metadata: {
        trade_title: data.trade_title,
        project_name: data.project_name,
        bautraeger_name: data.bautraeger_name,
        preselection_date: new Date().toISOString(),
        actions_available: [
          'view_trade_details',
          'create_offer', 
          'decline_invitation'
        ]
      }
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
  serviceProvider: any
): NotificationData => ({
  type: 'completion_request',
  title: `Fertigstellungsmeldung: ${trade.title}`,
  message: `Der Dienstleister hat das Gewerk "${trade.title}" als fertiggestellt markiert und bittet um Abnahme.`,
  description: `Projekt: ${project.name}\nGewerk: ${trade.title}\nDienstleister: ${serviceProvider.name}`,
  priority: 'high',
  requires_action: true,
  action_type: 'acceptance_review',
  project_id: project.id,
  milestone_id: trade.id,
  trade_id: trade.id,
  metadata: {
    trade_title: trade.title,
    project_name: project.name,
    service_provider: serviceProvider.name,
    completion_date: new Date().toISOString(),
    service_provider_id: serviceProvider.id
  }
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
    case 'completion_request': return '✅';
    case 'appointment_invitation': return '📅';
    case 'task_assignment': return '📋';
    default: return '📢';
  }
};
