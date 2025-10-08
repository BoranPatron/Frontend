import { apiCall } from './api';

export interface NotificationPreference {
  id?: number;
  contact_id: number;
  user_id: number;  // Der Bauträger, der die Benachrichtigung sendet
  service_provider_id: number;  // Der Dienstleister, der die Benachrichtigung erhält
  enabled: boolean;
  categories: string[];  // Array von Kategorien
  created_at?: string;
  updated_at?: string;
}

export interface CreateNotificationPreferenceData {
  contact_id: number;
  service_provider_id: number;
  enabled: boolean;
  categories: string[];
}

class NotificationPreferenceService {
  private baseUrl = '/notification-preferences';

  /**
   * Erstellt oder aktualisiert Benachrichtigungspräferenzen für einen Kontakt
   */
  async upsertPreference(data: CreateNotificationPreferenceData): Promise<NotificationPreference> {
    try {
      const response = await apiCall(`${this.baseUrl}`, {
        method: 'POST',
        body: JSON.stringify(data)
      });
      return response;
    } catch (error: any) {
      console.error('❌ Fehler beim Speichern der Benachrichtigungspräferenzen:', error);
      
      // Fallback: Verwende localStorage bis Backend bereit ist
      if (error.status === 404) {
        console.warn('⚠️ Backend nicht verfügbar - verwende localStorage als Fallback');
        return this.upsertPreferenceLocalStorage(data);
      }
      
      throw error;
    }
  }

  /**
   * Fallback: LocalStorage-Implementierung bis Backend fertig ist
   */
  private upsertPreferenceLocalStorage(data: CreateNotificationPreferenceData): NotificationPreference {
    const key = `notification_preference_${data.contact_id}`;
    const now = new Date().toISOString();
    
    const preference: NotificationPreference = {
      id: data.contact_id,
      contact_id: data.contact_id,
      user_id: 1, // Dummy user_id
      service_provider_id: data.service_provider_id,
      enabled: data.enabled,
      categories: data.categories,
      created_at: now,
      updated_at: now
    };
    
    localStorage.setItem(key, JSON.stringify(preference));
    console.log('✅ Benachrichtigungspräferenzen in localStorage gespeichert (Fallback)');
    
    return preference;
  }

  /**
   * Holt die Benachrichtigungspräferenzen für einen Kontakt
   */
  async getPreferenceByContactId(contactId: number): Promise<NotificationPreference | null> {
    try {
      const response = await apiCall(`${this.baseUrl}/contact/${contactId}`, {
        method: 'GET'
      });
      return response;
    } catch (error: any) {
      if (error.status === 404) {
        // Fallback: Versuche aus localStorage zu laden
        return this.getPreferenceByContactIdLocalStorage(contactId);
      }
      console.error('❌ Fehler beim Laden der Benachrichtigungspräferenzen:', error);
      throw error;
    }
  }

  /**
   * Fallback: LocalStorage-Implementierung
   */
  private getPreferenceByContactIdLocalStorage(contactId: number): NotificationPreference | null {
    const key = `notification_preference_${contactId}`;
    const stored = localStorage.getItem(key);
    
    if (stored) {
      console.log('📦 Benachrichtigungspräferenzen aus localStorage geladen (Fallback)');
      return JSON.parse(stored);
    }
    
    return null;
  }

  /**
   * Löscht Benachrichtigungspräferenzen
   */
  async deletePreference(preferenceId: number): Promise<void> {
    try {
      await apiCall(`${this.baseUrl}/${preferenceId}`, {
        method: 'DELETE'
      });
    } catch (error) {
      console.error('❌ Fehler beim Löschen der Benachrichtigungspräferenzen:', error);
      throw error;
    }
  }

  /**
   * Aktualisiert nur die enabled-Status
   */
  async togglePreference(preferenceId: number, enabled: boolean): Promise<NotificationPreference> {
    try {
      const response = await apiCall(`${this.baseUrl}/${preferenceId}/toggle`, {
        method: 'PATCH',
        body: JSON.stringify({ enabled })
      });
      return response;
    } catch (error) {
      console.error('❌ Fehler beim Aktualisieren der Benachrichtigungspräferenzen:', error);
      throw error;
    }
  }

  /**
   * Aktualisiert nur die Kategorien
   */
  async updateCategories(preferenceId: number, categories: string[]): Promise<NotificationPreference> {
    try {
      const response = await apiCall(`${this.baseUrl}/${preferenceId}/categories`, {
        method: 'PATCH',
        body: JSON.stringify({ categories })
      });
      return response;
    } catch (error) {
      console.error('❌ Fehler beim Aktualisieren der Kategorien:', error);
      throw error;
    }
  }
}

export const notificationPreferenceService = new NotificationPreferenceService();

