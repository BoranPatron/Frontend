import React, { useState, useEffect, useRef } from 'react';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  User, 
  Check, 
  X, 
  MessageSquare,
  ChevronLeft,
  Bell,
  AlertCircle,
  Mail,
  Phone,
  ExternalLink,
  FileText,
  Trash2,
  CheckCircle
} from 'lucide-react';
import { appointmentService, type AppointmentResponse } from '../api/appointmentService';
import api from '../api/api';

interface Notification {
  id: number;
  recipient_id: number;
  type: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  title: string;
  message: string;
  data?: string;
  is_read: boolean;
  is_acknowledged: boolean;
  created_at: string;
  read_at?: string;
  acknowledged_at?: string;
  related_quote_id?: number;
  related_project_id?: number;
  metadata?: {
    invoice_id?: number;
    invoice_number?: string;
    total_amount?: number;
    milestone_title?: string;
    quote_title?: string;
    project_name?: string;
    quote_currency?: string;
    quote_amount?: number;
    service_provider_name?: string;
    estimated_duration?: string;
    warranty_period?: string;
    [key: string]: any;
  };
  related_milestone_id?: number;
  related_appointment_id?: number;
}

interface BautraegerNotificationTabProps {
  userId: number;
  onResponseHandled?: () => void;
}

interface BautraegerNotificationData {
  id: string;
  type: 'appointment' | 'quote_submitted' | 'quote_revised' | 'quote_update' | 'milestone_completed' | 'defects_resolved' | 'invoice_received';
  title: string;
  message: string;
  timestamp: string;
  isHandled: boolean;
  isRead: boolean;
  priority?: 'normal' | 'high' | 'urgent';
  // Appointment-spezifische Daten
  appointment?: AppointmentResponse;
  response?: any; // Service Provider Response
  appointmentType?: 'confirmation' | 'rejection' | 'reschedule';
  // Quote-spezifische Daten
  notification?: Notification;
  // Invoice-spezifische Daten
  invoiceId?: number;
  invoiceNumber?: string;
  invoiceAmount?: number;
  milestoneId?: number;
  milestoneTitle?: string;
}

export default function BautraegerNotificationTab({ userId, onResponseHandled }: BautraegerNotificationTabProps) {
  const [notifications, setNotifications] = useState<BautraegerNotificationData[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<BautraegerNotificationData | null>(null);
  const notificationTabRef = useRef<HTMLDivElement>(null);

  // Debug: Komponente wird geladen
  console.log('🚨🚨🚨 BautraegerNotificationTab GELADEN für User:', userId);

  // Click-Outside-Handler für automatisches Einklappen
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isExpanded && notificationTabRef.current && !notificationTabRef.current.contains(event.target as Node)) {
        setIsExpanded(false);
      }
    };

    if (isExpanded) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isExpanded]);

  useEffect(() => {
    loadBautraegerNotifications();
    const interval = setInterval(loadBautraegerNotifications, 30000);
    
    // Event-Listener für neue Rechnungs-Benachrichtigungen
    const handleInvoiceSubmitted = (event: CustomEvent) => {
      console.log('💰 BautraegerNotificationTab: Invoice submitted event empfangen:', event.detail);
      
      const { invoice, milestoneId, milestoneTitle, invoiceNumber, totalAmount } = event.detail;
      
      // Erstelle sofortige lokale Benachrichtigung für Bauträger
      const newNotification: BautraegerNotificationData = {
        id: `invoice_${invoice?.id || Date.now()}_${Date.now()}`,
        type: 'invoice_received',
        title: '🧾 Neue Rechnung eingegangen',
        message: `Eine neue Rechnung für "${milestoneTitle}" wurde erstellt`,
        timestamp: new Date().toISOString(),
        isHandled: false,
        isRead: false,
        priority: 'high',
        invoiceId: invoice?.id,
        invoiceNumber: invoiceNumber,
        invoiceAmount: totalAmount,
        milestoneId: milestoneId,
        milestoneTitle: milestoneTitle
      };
      
      console.log('💰 BautraegerNotificationTab: Neue Rechnungs-Benachrichtigung erstellt:', newNotification);
      
      // Füge die neue Benachrichtigung zur Liste hinzu
      setNotifications(prev => [newNotification, ...prev]);
    };
    
    // Event-Listener für neue Angebot-Benachrichtigungen
    const handleQuoteSubmittedForBautraeger = (event: CustomEvent) => {
      console.log('📢 BautraegerNotificationTab: EVENT EMPFANGEN!');
      console.log('📢 BautraegerNotificationTab: Event-Type:', event.type);
      console.log('📢 BautraegerNotificationTab: Event-Detail:', event.detail);
      console.log('📢 BautraegerNotificationTab: Trade:', event.detail?.trade);
      console.log('📢 BautraegerNotificationTab: Quote:', event.detail?.quote);
      
      if (event.detail.trade && event.detail.quote) {
        const { trade, quote } = event.detail;
        
        // Erstelle sofortige lokale Benachrichtigung für Bauträger
        const newNotification: BautraegerNotificationData = {
          id: `quote_${quote.id}_${Date.now()}`,
          type: 'quote_submitted',
          title: 'Neues Angebot eingegangen! 📋',
          message: `Ein Dienstleister hat ein Angebot für "${trade?.title || 'Gewerk'}" eingereicht.`,
          timestamp: new Date().toISOString(),
          isHandled: false,
          isRead: false,
          priority: 'high',
          notification: {
            id: Date.now(),
            recipient_id: userId,
            type: 'quote_submitted',
            priority: 'high',
            title: 'Neues Angebot eingegangen! 📋',
            message: `Ein Dienstleister hat ein Angebot für "${trade?.title}" eingereicht.`,
            data: null,
            is_read: false,
            is_acknowledged: false,
            created_at: new Date().toISOString(),
            related_milestone_id: trade?.id,
            related_project_id: trade?.project_id,
            related_quote_id: quote.id,
            metadata: {
              quote_amount: quote.total_amount,
              quote_currency: quote.currency,
              service_provider_name: quote.company_name || quote.contact_person
            }
          } as any
        };
        
        console.log('📢 BautraegerNotificationTab: Neue Benachrichtigung erstellt:', newNotification);
        
        // Füge die neue Benachrichtigung zur Liste hinzu
        setNotifications(prev => [newNotification, ...prev]);
      }
    };
    
    // Event-Listener für Rechnung angesehen
    const handleInvoiceViewed = (event: CustomEvent) => {
      console.log('📖 BautraegerNotificationTab: Invoice viewed event empfangen:', event.detail);
      
      const { invoiceId, milestoneId } = event.detail;
      
      // Markiere alle Benachrichtigungen für diese Rechnung als gelesen
      setNotifications(prev => 
        prev.map(n => {
          if (n.type === 'invoice_received' && 
              (n.invoiceId === invoiceId || n.milestoneId === milestoneId)) {
            return { ...n, isHandled: true, isRead: true };
          }
          return n;
        })
      );
    };
    
    window.addEventListener('quoteSubmittedForBautraeger', handleQuoteSubmittedForBautraeger as EventListener);
    window.addEventListener('invoiceSubmitted', handleInvoiceSubmitted as EventListener);
    window.addEventListener('invoiceViewed', handleInvoiceViewed as EventListener);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('quoteSubmittedForBautraeger', handleQuoteSubmittedForBautraeger as EventListener);
      window.removeEventListener('invoiceSubmitted', handleInvoiceSubmitted as EventListener);
      window.removeEventListener('invoiceViewed', handleInvoiceViewed as EventListener);
    };
  }, [userId]);

  const loadBautraegerNotifications = async () => {
    try {
      let notifications: BautraegerNotificationData[] = [];
      
      // 1. Lade localStorage-Benachrichtigungen (für sofortige Anzeige)
      try {
        const pendingNotifications = JSON.parse(localStorage.getItem('pendingBautraegerNotifications') || '[]');
        console.log('🔔 BautraegerNotificationTab: localStorage-Benachrichtigungen gefunden:', pendingNotifications.length);
        
        pendingNotifications.forEach((pendingNotif: any) => {
          const notification: BautraegerNotificationData = {
            id: pendingNotif.id,
            type: 'quote_submitted',
            title: pendingNotif.title,
            message: pendingNotif.message,
            timestamp: pendingNotif.timestamp,
            isHandled: false,
            isRead: false,
            priority: 'high',
            notification: {
              id: Date.now() + Math.random(),
              recipient_id: userId,
              type: 'quote_submitted',
              priority: 'high',
              title: pendingNotif.title,
              message: pendingNotif.message,
              data: null,
              is_read: false,
              is_acknowledged: false,
              created_at: pendingNotif.timestamp,
              related_milestone_id: pendingNotif.tradeId,
              related_project_id: pendingNotif.projectId,
              related_quote_id: pendingNotif.quoteId,
              metadata: {
                quote_amount: pendingNotif.quoteAmount,
                quote_currency: pendingNotif.quoteCurrency
              }
            } as any
          };
          
          notifications.push(notification);
        });
        
        // Lösche verarbeitete localStorage-Benachrichtigungen
        localStorage.removeItem('pendingBautraegerNotifications');
        console.log('🔔 BautraegerNotificationTab: localStorage-Benachrichtigungen verarbeitet und gelöscht');
      } catch (error) {
        console.error('❌ BautraegerNotificationTab: Fehler beim Laden der localStorage-Benachrichtigungen:', error);
      }
      
      console.log('🔔 BautraegerNotificationTab: Lade Benachrichtigungen für User:', userId);
      
      // Lade Backend-Benachrichtigungen (Hauptquelle)
      try {
        console.log('🔔 BautraegerNotificationTab: Rufe /notifications/ API auf...');
        
        // Erweiterte Fehlerbehandlung für 500-Fehler
        const response = await api.get('/api/v1/notifications/', {
          params: {
            limit: 20,
            unacknowledged_only: true
          }
        }).catch(async (error) => {
          console.error('❌ BautraegerNotificationTab: API-Fehler:', error);
          
          // Bei 500-Fehler: Versuche mit reduzierten Parametern
          if (error.response?.status === 500) {
            console.log('🔄 BautraegerNotificationTab: Versuche mit reduzierten Parametern...');
            try {
              const fallbackResponse = await api.get('/api/v1/notifications/', {
                params: {
                  limit: 10,
                  unacknowledged_only: false
                }
              });
              console.log('✅ BautraegerNotificationTab: Fallback erfolgreich');
              return fallbackResponse;
            } catch (fallbackError) {
              console.error('❌ BautraegerNotificationTab: Fallback fehlgeschlagen:', fallbackError);
              throw error; // Wirf den ursprünglichen Fehler
            }
          }
          throw error;
        });
        
        console.log('🔔 BautraegerNotificationTab: API Response erhalten:', response);
        const quoteNotifications: Notification[] = response.data;
        
        console.log('🔔 BautraegerNotificationTab: Backend-Benachrichtigungen:', quoteNotifications?.length || 0);
        
        quoteNotifications.forEach(notification => {
          console.log('🔔 BautraegerNotificationTab: Verarbeite Benachrichtigung:', {
            id: notification.id,
            type: notification.type,
            title: notification.title,
            user_id: notification.recipient_id,
            currentUserId: userId,
            related_milestone_id: notification.related_milestone_id
          });
          
          // Prüfe, ob die Benachrichtigung gültig ist (alle verknüpften Entitäten existieren)
          if (notification.related_milestone_id && !notification.related_milestone_id) {
            console.warn('⚠️ BautraegerNotificationTab: Verwaiste Benachrichtigung übersprungen:', notification.id);
            return; // Überspringe verwaiste Benachrichtigungen
          }
          
          // Verarbeite Rechnungs-Benachrichtigungen
          if (notification.type === 'invoice_submitted') {
            console.log('🔔 BautraegerNotificationTab: Verarbeite invoice_submitted Benachrichtigung');
            const data = notification.data ? JSON.parse(notification.data) : {};
            console.log('🔔 BautraegerNotificationTab: Invoice Data:', data);
            
            notifications.push({
              id: `invoice_${notification.id}`,
              type: 'invoice_submitted',
              title: notification.title,
              message: notification.message,
              timestamp: notification.created_at,
              isHandled: notification.is_acknowledged,
              isRead: notification.is_read,
              priority: notification.priority as any,
              notification: notification,
              invoiceId: data.invoice_id,
              invoiceNumber: data.invoice_number,
              invoiceAmount: data.total_amount,
              milestoneId: notification.related_milestone_id,
              milestoneTitle: data.milestone_title,
              serviceProviderName: data.service_provider_name,
              projectName: data.project_name,
              currency: data.currency,
              directLink: data.direct_link,
              showAcceptanceTab: data.showAcceptanceTab
            });
            console.log('✅ BautraegerNotificationTab: Invoice-Benachrichtigung hinzugefügt');
          } else if (notification.type === 'quote_submitted') {
            notifications.push({
              id: `quote_${notification.id}`,
              type: 'quote_submitted',
              title: notification.title,
              message: notification.message,
              timestamp: notification.created_at,
              isHandled: notification.is_acknowledged,
              isRead: notification.is_read,
              priority: notification.priority as 'normal' | 'high' | 'urgent',
              notification: notification
            });
            console.log('✅ BautraegerNotificationTab: Quote-Benachrichtigung hinzugefügt');
          } else if (notification.type === 'quote_revised') {
            notifications.push({
              id: `quote_revised_${notification.id}`,
              type: 'quote_revised',
              title: notification.title,
              message: notification.message,
              timestamp: notification.created_at,
              isHandled: notification.is_acknowledged,
              isRead: notification.is_read,
              priority: notification.priority as 'normal' | 'high' | 'urgent',
              notification: notification
            });
            console.log('✅ BautraegerNotificationTab: Quote-Revised-Benachrichtigung hinzugefügt');
          } else if (notification.type === 'completion') {
            notifications.push({
              id: `completion_${notification.id}`,
              type: 'completion',
              title: notification.title,
              message: notification.message,
              timestamp: notification.created_at,
              isHandled: notification.is_acknowledged,
              isRead: notification.is_read,
              priority: notification.priority as 'normal' | 'high' | 'urgent',
              notification: notification
            });
          } else if (notification.type === 'defects_resolved') {
            notifications.push({
              id: `defects_${notification.id}`,
              type: 'defects_resolved',
              title: notification.title,
              message: notification.message,
              timestamp: notification.created_at,
              isHandled: notification.is_acknowledged,
              isRead: notification.is_read,
              priority: notification.priority as 'normal' | 'high' | 'urgent',
              notification: notification
            });
          } else if (notification.type === 'appointment_invitation' || notification.type === 'appointment_response') {
            // Parse data für Appointment-Typ
            let appointmentData = {};
            try {
              appointmentData = notification.data ? JSON.parse(notification.data) : {};
            } catch (e) {
              console.error('Fehler beim Parsen von Appointment-Data:', e);
            }
            
            // Bestimme Appointment-Typ basierend auf response_status
            let appointmentType = 'confirmation';
            if (appointmentData.response_status === 'accepted') {
              appointmentType = 'confirmation';
            } else if (appointmentData.response_status === 'rejected_with_suggestion') {
              appointmentType = 'reschedule';
            } else if (appointmentData.response_status === 'rejected') {
              appointmentType = 'rejection';
            } else if (notification.metadata?.service_provider_response === 'accepted') {
              appointmentType = 'confirmation';
            } else if (notification.metadata?.service_provider_response === 'rejected_with_suggestion') {
              appointmentType = 'reschedule';
            } else if (notification.metadata?.service_provider_response === 'rejected') {
              appointmentType = 'rejection';
            }
            
            notifications.push({
              id: `appointment_response_${notification.id}`,
              type: 'appointment',
              title: notification.title,
              message: notification.message,
              timestamp: notification.created_at,
              isHandled: notification.is_acknowledged,
              isRead: notification.is_read,
              priority: notification.priority as 'normal' | 'high' | 'urgent',
              notification: notification,
              appointmentType: appointmentType
            });
            console.log('✅ BautraegerNotificationTab: Appointment-Response-Benachrichtigung hinzugefügt:', appointmentType);
          } else if (notification.type === 'milestone_completed') {
            notifications.push({
              id: `milestone_completed_${notification.id}`,
              type: 'milestone_completed',
              title: notification.title,
              message: notification.message,
              timestamp: notification.created_at,
              isHandled: notification.is_acknowledged,
              isRead: notification.is_read,
              priority: notification.priority as 'normal' | 'high' | 'urgent',
              notification: notification,
              milestoneId: notification.related_milestone_id,
              milestoneTitle: notification.metadata?.milestone_title
            });
            console.log('✅ BautraegerNotificationTab: Milestone-Completed-Benachrichtigung hinzugefügt');
          }
        });
      } catch (error) {
        console.error('❌ BautraegerNotificationTab: Fehler beim Laden der Quote-Benachrichtigungen:', error);
        console.error('❌ BautraegerNotificationTab: Error Details:', {
          message: error.message,
          status: error.response?.status,
          data: error.response?.data
        });
        
        // Bei API-Fehlern: Fahre trotzdem fort mit lokalen Daten
        console.log('🔄 BautraegerNotificationTab: Fahre trotz API-Fehler fort...');
        
        // Zeige Benutzer-freundliche Fehlermeldung
        if (error.response?.status === 500) {
          console.warn('⚠️ BautraegerNotificationTab: Backend-Server-Fehler. Verwende Fallback-Modus.');
          // Optional: Zeige Toast-Nachricht für Benutzer
          // toast.error('Benachrichtigungen können derzeit nicht geladen werden. Bitte versuchen Sie es später erneut.');
        }
      }
      
      // 2. Lade Termin-Benachrichtigungen (bestehende Logik)
      try {
        // Nutze den sicheren Endpunkt - Bauträger sehen nur eigene Termine
        const myAppointments = await appointmentService.getMyAppointments(8); // Demo: Projekt 8
        
        // Verarbeite jede Antwort von Service Providern
        myAppointments.forEach(appointment => {
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
            console.error(`❌ Error parsing responses for appointment ${appointment.id}:`, e);
            responses = [];
          }
        }
        
          if (responses && responses.length > 0) {
            responses.forEach(response => {
              const appointmentType = response.status === 'accepted' ? 'confirmation' : 
                        response.status === 'rejected_with_suggestion' ? 'reschedule' : 'rejection';
              
              // Prüfe permanente Marker für behandelte Benachrichtigungen
              const emailSentKey = `bautraeger_email_sent_${appointment.id}_${userId}`;
              const handledKey = `bautraeger_handled_${appointment.id}_${userId}`;
              const hasEmailSent = localStorage.getItem(emailSentKey);
              const hasHandled = localStorage.getItem(handledKey);
              const isPermanentlyHandled = hasEmailSent || hasHandled;
              
              // If notification is permanently handled, don't show it at all
              if (isPermanentlyHandled) {
                console.log(`🔕 Skipping Bauträger notification for appointment ${appointment.id} - already handled`);
                return; // Skip this notification
              }
              
              notifications.push({
                id: `appointment_${appointment.id}_${response.id}`,
                type: 'appointment',
                title: `Terminantwort: ${appointment.title}`,
                message: `${response.service_provider_name} hat ${appointmentType === 'confirmation' ? 'zugesagt' : appointmentType === 'reschedule' ? 'einen anderen Termin vorgeschlagen' : 'abgesagt'}`,
                timestamp: response.created_at || appointment.created_at,
                isHandled: false, // Only show unhandled notifications
                isRead: false,
                appointment,
                response,
                appointmentType
              });
            });
          }
        });
        
        // Echte Benachrichtigungen werden jetzt korrekt geladen
      
      console.log('🔔 BautraegerNotificationTab: Finale Benachrichtigungen:', notifications.length);
      console.log('🔔 BautraegerNotificationTab: Benachrichtigungen Details:', notifications);
      setNotifications(notifications);
      } catch (appointmentError) {
        console.error('❌ Fehler beim Laden der Termin-Benachrichtigungen:', appointmentError);
      }
      
    } catch (error) {
      console.error('❌ BautraegerNotificationTab: Fehler beim Laden:', error);
      // Bei Fehlern Demo-Daten als Fallback
      setNotifications([]);
    }
  };

  const generateEmailToServiceProvider = (notification: BautraegerNotificationData) => {
    // Parse data aus notification falls appointment/response nicht vorhanden
    let appointmentData: any = {};
    let responseData: any = {};
    
    if (notification.notification?.data) {
      try {
        const parsedData = JSON.parse(notification.notification.data);
        appointmentData = parsedData;
        responseData = parsedData;
      } catch (e) {
        console.error('Fehler beim Parsen von notification data:', e);
      }
    }
    
    const appointment = notification.appointment || appointmentData;
    const response = notification.response || responseData;
    
    const appointmentTitle = appointment.appointment_title || appointment.title || 'Besichtigungstermin';
    const scheduledDate = appointment.scheduled_date;
    const location = appointment.location || 'Wird noch bekannt gegeben';
    const durationMinutes = appointment.duration_minutes || 60;
    const responseStatus = response.response_status || response.status || 'accepted';
    const responseMessage = response.response_message || response.message || '';
    const serviceProviderName = response.service_provider_name || 'Dienstleister';
    
    const subject = encodeURIComponent(`Besichtigung bestätigt: ${appointmentTitle}`);
    const body = encodeURIComponent(`
Hallo,

vielen Dank für Ihre ${responseStatus === 'accepted' ? 'Zusage' : 'Antwort'} zur Besichtigung!

Termin-Details:
- Titel: ${appointmentTitle}
- Datum: ${scheduledDate ? new Date(scheduledDate).toLocaleDateString('de-DE') : 'TBD'}
- Uhrzeit: ${scheduledDate ? new Date(scheduledDate).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }) : 'TBD'}
- Ort: ${location}
- Dauer: ${durationMinutes} Minuten

${responseMessage ? `Ihre Nachricht: "${responseMessage}"` : ''}

Bei Fragen können Sie mich gerne kontaktieren.

Mit freundlichen Grüßen
Ihr BuildWise Team
    `);

    // Öffne E-Mail-Client mit vorgefertigter E-Mail
    const serviceProviderEmail = response.service_provider?.email || `${serviceProviderName.toLowerCase().replace(/\s+/g, '')}@demo.com`;
    const mailtoLink = `mailto:${serviceProviderEmail}?subject=${subject}&body=${body}`;
    window.open(mailtoLink, '_blank');
    
    // Setze permanenten Marker für behandelte Benachrichtigung
    const appointmentId = appointment.appointment_id || appointment.id || notification.notification?.related_appointment_id;
    if (appointmentId) {
      const permanentHandledKey = `bautraeger_email_sent_${appointmentId}_${userId}`;
      localStorage.setItem(permanentHandledKey, JSON.stringify({
        appointmentId: appointmentId,
        userId: userId,
        emailSentAt: new Date().toISOString(),
        action: 'email_sent'
      }));
    }
    
    // Setze lokalen Status auf behandelt
    const notificationIndex = notifications.indexOf(notification);
    if (notificationIndex !== -1) {
      handleMarkAsHandled(notificationIndex);
    }
  };

  const handleMarkAsHandled = (notificationIndex: number) => {
    const notification = notifications[notificationIndex];
    
    // Setze permanenten Marker für behandelte Benachrichtigung
    if (notification && notification.type === 'appointment') {
      // Parse appointment data
      let appointmentData: any = {};
      if (notification.notification?.data) {
        try {
          appointmentData = JSON.parse(notification.notification.data);
        } catch (e) {
          console.error('Fehler beim Parsen von notification data:', e);
        }
      }
      
      const appointment = notification.appointment || appointmentData;
      const appointmentId = appointment.appointment_id || appointment.id || notification.notification?.related_appointment_id;
      
      if (appointmentId) {
        const permanentHandledKey = `bautraeger_handled_${appointmentId}_${userId}`;
        localStorage.setItem(permanentHandledKey, JSON.stringify({
          appointmentId: appointmentId,
          userId: userId,
          handledAt: new Date().toISOString(),
          action: 'marked_as_handled'
        }));
        
        console.log(`✅ Bauträger notification for appointment ${appointmentId} marked as handled`);
      }
    }
    
    // Remove the notification from the list immediately
    setNotifications(prev => prev.filter((n, idx) => idx !== notificationIndex));
    
    // Close modal
    setSelectedNotification(null);
    
    if (onResponseHandled) {
      onResponseHandled();
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      // Setze permanente Marker für alle Benachrichtigungen
      notifications.forEach(notification => {
        if (notification.type === 'appointment' && notification.appointment) {
          // Marker für Terminantworten
          const permanentHandledKey = `bautraeger_handled_${notification.appointment.id}_${userId}`;
          localStorage.setItem(permanentHandledKey, JSON.stringify({
            appointmentId: notification.appointment.id,
            userId: userId,
            handledAt: new Date().toISOString(),
            action: 'marked_all_as_read'
          }));
          
          // Marker für E-Mail-Status (als gelesen behandeln)
          const emailSentKey = `bautraeger_email_sent_${notification.appointment.id}_${userId}`;
          localStorage.setItem(emailSentKey, JSON.stringify({
            appointmentId: notification.appointment.id,
            userId: userId,
            markedAllReadAt: new Date().toISOString(),
            action: 'marked_all_as_read'
          }));
        }
        
        if ((notification.type === 'quote_submitted' || notification.type === 'quote_revised' || notification.type === 'completion' || notification.type === 'milestone_completed' || notification.type === 'defects_resolved' || notification.type === 'invoice_received' || notification.type === 'invoice_submitted') && notification.notification) {
          // Für Angebots-, Überarbeitungs-, Fertigstellungs-, Mängelbehebungs- und Rechnungsbenachrichtigungen - markiere als acknowledged
          api.patch(`/api/v1/notifications/${notification.notification.id}/acknowledge`).catch(error => {
            console.error('Fehler beim Bestätigen der Benachrichtigung:', error);
          });
        }
        
        // Speziell für Rechnungsbenachrichtigungen
        if (notification.type === 'invoice_received' || notification.type === 'invoice_submitted') {
          const invoiceHandledKey = `invoice_handled_${notification.invoiceId}_${userId}`;
          localStorage.setItem(invoiceHandledKey, JSON.stringify({
            invoiceId: notification.invoiceId,
            userId: userId,
            handledAt: new Date().toISOString(),
            action: 'marked_all_as_read'
          }));
        }
      });
      
      // Remove all notifications from the list immediately
      setNotifications([]);
      
      // Schließe Modal falls offen
      setSelectedNotification(null);
      
      console.log(`✅ All Bauträger notifications marked as handled and removed`);
      
      if (onResponseHandled) {
        onResponseHandled();
      }
    } catch (error) {
      console.error('Fehler beim Markieren aller Benachrichtigungen als gelesen:', error);
    }
  };

  const handleDeleteNotification = async (notificationId: string) => {
    try {
      // Entferne die Benachrichtigung aus dem lokalen State
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      
      // Wenn es eine Backend-Benachrichtigung ist, lösche sie auch dort
      const notification = notifications.find(n => n.id === notificationId);
      if (notification?.notification?.id) {
        await api.delete(`/api/v1/notifications/${notification.notification.id}`);
      }
      
      // Schließe Modal falls offen
      if (selectedNotification?.id === notificationId) {
        setSelectedNotification(null);
      }
      
      console.log('Benachrichtigung gelöscht:', notificationId);
    } catch (error) {
      console.error('Fehler beim Löschen der Benachrichtigung:', error);
    }
  };

  const handleDeleteAllNotifications = async () => {
    if (!confirm('Möchten Sie wirklich alle Benachrichtigungen löschen? Diese Aktion kann nicht rückgängig gemacht werden.')) {
      return;
    }
    
    try {
      // Lösche alle Benachrichtigungen im Backend
      await api.delete('/api/v1/notifications/delete-all');
      
      // Leere den lokalen State
      setNotifications([]);
      
      // Schließe Modal falls offen
      setSelectedNotification(null);
      
      console.log('Alle Benachrichtigungen gelöscht');
    } catch (error) {
      console.error('Fehler beim Löschen aller Benachrichtigungen:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-DE', {
      weekday: 'short',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('de-DE', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const unhandledCount = notifications.filter(n => !n.isHandled).length;
  const hasUnhandled = unhandledCount > 0;
  
  // Open listener from CentralTabCluster
  useEffect(() => {
    const open = () => setIsExpanded(true);
    window.addEventListener('openBautraegerNotificationTab', open as EventListener);
    return () => window.removeEventListener('openBautraegerNotificationTab', open as EventListener);
  }, []);

  // Zeige immer die Tab, auch wenn keine Notifications da sind
  // if (notifications.length === 0) {
  //   return null;
  // }

  return (
    <>
      {/* Bauträger Notification Tab - rechts am Bildschirmrand */}
      <div ref={notificationTabRef} className="fixed right-0 z-[9999]">
        
        {/* Tab Handle - Independent fixed position */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          data-tour-id="notification-tab-bautraeger"
          className={`fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 sm:bottom-[20px] sm:right-[20px] sm:left-auto sm:top-auto z-[9999] md:hidden 
                     w-14 h-20 rounded-l-xl transition-all duration-300 hover:shadow-2xl
                     flex flex-col items-center justify-center gap-1 ${
            hasUnhandled 
              ? 'bg-gradient-to-r from-blue-500/90 to-cyan-500/90 animate-pulse shadow-lg shadow-blue-500/50' 
              : 'bg-gradient-to-r from-blue-500/80 to-cyan-500/80'
          } text-white hover:from-blue-500 hover:to-cyan-500 border-l border-t border-b border-white/30`}
        >
          {/* Bauträger Icon */}
          <Calendar size={20} className={hasUnhandled ? 'animate-bounce' : ''} />
          
          {/* Anzahl unbehandelte Benachrichtigungen */}
          {hasUnhandled && (
            <div className="bg-white text-blue-600 rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-bold">
              {unhandledCount}
            </div>
          )}
        </button>

        {/* Notification Panel */}
        <div className={`fixed right-0 top-0 h-screen w-96 z-[9998] transition-transform duration-300 ${
          isExpanded ? 'translate-x-0' : 'translate-x-full'
        } bg-white shadow-2xl overflow-hidden border-l-4 border-blue-500 flex flex-col`}>
          
          {/* Header */}
          <div className="bg-gradient-to-r from-green-600 to-blue-600 text-white p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell size={20} />
                <h3 className="font-semibold">Benachrichtigungen</h3>
              </div>
              <div className="flex items-center gap-2">
                {notifications.length > 0 && (
                  <>
                    <button 
                      onClick={handleMarkAllAsRead}
                      className="hover:bg-white/20 rounded-lg px-3 py-1 transition-colors text-sm font-medium"
                      title="Alle gelesen"
                    >
                      <CheckCircle size={14} className="inline mr-1" />
                      Alle gelesen
                    </button>
                    <button 
                      onClick={handleDeleteAllNotifications}
                      className="hover:bg-white/20 rounded-lg px-3 py-1 transition-colors text-sm font-medium"
                      title="Alle löschen"
                    >
                      <Trash2 size={14} className="inline mr-1" />
                      Alle löschen
                    </button>
                  </>
                )}
                <button 
                  onClick={() => setIsExpanded(false)}
                  className="hover:bg-white/20 rounded-full p-1 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto">
            {notifications.map((notification, index) => (
              <div 
                key={`${notification.appointment?.id || notification.id || `notif-${index}`}`}
                className={`p-4 border-b border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors ${
                  !notification.isHandled ? 'bg-green-50 border-l-4 border-l-green-400' : 
                  notification.isRead ? 'opacity-60 bg-gray-50' : ''
                }`}
                onClick={() => {
                  // Für invoice_submitted: Öffne SimpleCostEstimateModal mit Abnahme-Tab
                  if (notification.type === 'invoice_submitted' && notification.milestoneId) {
                    console.log('🧾 BautraegerNotificationTab: Öffne Rechnung für Milestone:', notification.milestoneId);
                    
                    // Event für Dashboard auslösen, um SimpleCostEstimateModal mit Abnahme-Tab zu öffnen
                    window.dispatchEvent(new CustomEvent('openSimpleCostEstimateModal', {
                      detail: {
                        tradeId: notification.milestoneId,
                        showAcceptanceTab: true,
                        source: 'bautraeger_notification_invoice_submitted'
                      }
                    }));
                    
                    // Schließe Benachrichtigungs-Panel
                    setIsExpanded(false);
                    
                    // Markiere als gelesen
                    setNotifications(prev => 
                      prev.map(n => n.id === notification.id ? { ...n, isHandled: true, isRead: true } : n)
                    );
                    
                    // Markiere Backend-Benachrichtigung als gelesen
                    if (notification.notification) {
                      api.patch(`/api/v1/notifications/${notification.notification.id}/acknowledge`).catch(error => {
                        console.error('Fehler beim Bestätigen der Rechnungs-Benachrichtigung:', error);
                      });
                    }
                    
                    return;
                  }
                  
                  // Für invoice_received: Öffne direkt die Rechnung
                  if (notification.type === 'invoice_received' && notification.milestoneId) {
                    console.log('🧾 BautraegerNotificationTab: Öffne Rechnung für Milestone:', notification.milestoneId);
                    
                    // Event für Dashboard auslösen, um SimpleCostEstimateModal mit Rechnung zu öffnen
                    window.dispatchEvent(new CustomEvent('openInvoiceDetails', {
                      detail: {
                        milestoneId: notification.milestoneId,
                        invoiceId: notification.invoiceId,
                        source: 'bautraeger_notification_invoice'
                      }
                    }));
                    
                    // Schließe Benachrichtigungs-Panel
                    setIsExpanded(false);
                    
                    // Markiere als gelesen
                    setNotifications(prev => 
                      prev.map(n => n.id === notification.id ? { ...n, isHandled: true, isRead: true } : n)
                    );
                    
                    // Markiere Backend-Benachrichtigung als gelesen
                    if (notification.notification?.id) {
                      api.patch(`/api/v1/notifications/${notification.notification.id}/acknowledge`).catch(error => {
                        console.error('Fehler beim Bestätigen der Benachrichtigung:', error);
                      });
                    }
                  }
                  // Für quote_submitted oder quote_revised: Öffne direkt die Ausschreibung
                  else if ((notification.type === 'quote_submitted' || notification.type === 'quote_revised') && notification.notification?.related_milestone_id) {
                    console.log('📋 BautraegerNotificationTab: Öffne Ausschreibung für Milestone:', notification.notification.related_milestone_id);
                    
                    // Event für Dashboard auslösen, um TradeDetailsModal zu öffnen
                    window.dispatchEvent(new CustomEvent('openTradeDetails', {
                      detail: {
                        tradeId: notification.notification.related_milestone_id,
                        source: 'bautraeger_notification_list'
                      }
                    }));
                    
                    // Schließe Benachrichtigungs-Panel
                    setIsExpanded(false);
                    
                    // Markiere als behandelt
                    setNotifications(prev => 
                      prev.map(n => n.id === notification.id ? { ...n, isHandled: true } : n)
                    );
                  }
                  // Für milestone_completed: Öffne SimpleCostEstimateModal für Abnahme
                  else if (notification.type === 'milestone_completed' && notification.notification?.related_milestone_id) {
                    console.log('✅ BautraegerNotificationTab: Öffne SimpleCostEstimateModal für Abnahme:', notification.notification.related_milestone_id);
                    
                    // Event für Dashboard auslösen, um SimpleCostEstimateModal zu öffnen
                    window.dispatchEvent(new CustomEvent('openSimpleCostEstimateModal', {
                      detail: {
                        tradeId: notification.notification.related_milestone_id,
                        source: 'milestone_completed_notification'
                      }
                    }));
                    
                    // Schließe Benachrichtigungs-Panel
                    setIsExpanded(false);
                    
                    // Markiere als behandelt
                    setNotifications(prev => 
                      prev.map(n => n.id === notification.id ? { ...n, isHandled: true, isRead: true } : n)
                    );
                    
                    // Markiere Backend-Benachrichtigung als quittiert
                    if (notification.notification?.id) {
                      api.patch(`/api/v1/notifications/${notification.notification.id}/acknowledge`).catch(error => {
                        console.error('Fehler beim Bestätigen der Milestone-Completed-Benachrichtigung:', error);
                      });
                    }
                  }
                  // Für completion: Öffne SimpleCostEstimateModal für Abnahme
                  else if (notification.type === 'completion' && notification.notification?.related_milestone_id) {
                    console.log('✅ BautraegerNotificationTab: Öffne SimpleCostEstimateModal für Abnahme:', notification.notification.related_milestone_id);
                    
                    // Event für Dashboard auslösen, um SimpleCostEstimateModal zu öffnen
                    window.dispatchEvent(new CustomEvent('openSimpleCostEstimateModal', {
                      detail: {
                        tradeId: notification.notification.related_milestone_id,
                        source: 'completion_notification_list'
                      }
                    }));
                    
                    // Schließe Benachrichtigungs-Panel
                    setIsExpanded(false);
                    
                    // Markiere als behandelt
                    setNotifications(prev => 
                      prev.map(n => n.id === notification.id ? { ...n, isHandled: true, isRead: true } : n)
                    );
                    
                    // Markiere Backend-Benachrichtigung als quittiert
                    if (notification.notification?.id) {
                      api.patch(`/api/v1/notifications/${notification.notification.id}/acknowledge`).catch(error => {
                        console.error('Fehler beim Bestätigen der Completion-Benachrichtigung:', error);
                      });
                    }
                  }
                  // Für defects_resolved: Öffne direkt die Ausschreibung für finale Abnahme
                  else if (notification.type === 'defects_resolved' && notification.notification?.related_milestone_id) {
                    console.log('🔧 BautraegerNotificationTab: Öffne SimpleCostEstimateModal für finale Abnahme:', notification.notification.related_milestone_id);
                    
                    // Event für Dashboard auslösen, um SimpleCostEstimateModal zu öffnen
                    window.dispatchEvent(new CustomEvent('openSimpleCostEstimateModal', {
                      detail: {
                        tradeId: notification.notification.related_milestone_id,
                        source: 'defects_resolved_notification_list'
                      }
                    }));
                    
                    // Schließe Benachrichtigungs-Panel
                    setIsExpanded(false);
                    
                    // Markiere als behandelt
                    setNotifications(prev => 
                      prev.map(n => n.id === notification.id ? { ...n, isHandled: true, isRead: true } : n)
                    );
                    
                    // Markiere Backend-Benachrichtigung als quittiert
                    if (notification.notification?.id) {
                      api.patch(`/api/v1/notifications/${notification.notification.id}/acknowledge`).catch(error => {
                        console.error('Fehler beim Bestätigen der Defects-Resolved-Benachrichtigung:', error);
                      });
                    }
                  } else {
                    // Für andere Benachrichtigungen: Öffne Modal
                    setSelectedNotification(notification);
                  }
                }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {/* Lösch-Button oben rechts */}
                    <div className="flex justify-end mb-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteNotification(notification.id);
                        }}
                        className="hover:bg-red-100 rounded-full p-1 transition-colors"
                        title="Benachrichtigung löschen"
                      >
                        <Trash2 size={14} className="text-red-500 hover:text-red-700" />
                      </button>
                    </div>
                    <h4 className="font-medium text-gray-900 mb-1">
                      {notification.title}
                    </h4>
                    
                    <p className="text-sm text-gray-600 mb-2">
                      {notification.message}
                    </p>
                    
                    {/* Termin-spezifische Informationen */}
                    {notification.type === 'appointment' && notification.appointment && (
                      <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                        <div className="flex items-center gap-1">
                          <Calendar size={14} />
                          {formatDate(notification.appointment.scheduled_date)}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock size={14} />
                          {formatTime(notification.appointment.scheduled_date)}
                        </div>
                      </div>
                    )}
                    
                    {/* Rechnung-spezifische Informationen */}
                    {notification.type === 'invoice_received' && (
                      <div className="mt-3 p-3 bg-green-50 rounded-lg border border-green-200">
                        <div className="mb-2">
                          <div className="text-xs text-gray-600 font-medium">
                            🧾 Rechnung für: {notification.milestoneTitle}
                          </div>
                          <div className="text-xs text-gray-500">
                            📄 Rechnungsnummer: {notification.invoiceNumber}
                          </div>
                        </div>
                        
                        <div className="text-center my-3">
                          <div className="text-2xl font-bold text-green-600">
                            {new Intl.NumberFormat('de-DE', { 
                              style: 'currency', 
                              currency: 'EUR' 
                            }).format(notification.invoiceAmount || 0)}
                          </div>
                        </div>
                        
                        <div className="mt-3 p-2 bg-gradient-to-r from-green-100 to-emerald-100 rounded border border-green-300">
                          <div className="flex items-center justify-center gap-2 text-xs text-green-700 font-medium">
                            <FileText size={14} />
                            <span>👆 Klicken Sie hier, um die Rechnung anzuzeigen</span>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Fertigstellungs-spezifische Informationen */}
                    {(notification.type === 'milestone_completed' || notification.type === 'completion') && (
                      <div className="mt-3 p-3 bg-orange-50 rounded-lg border border-orange-200">
                        <div className="mb-2">
                          <div className="text-xs text-gray-600 font-medium flex items-center gap-1">
                            ✅ Fertigstellung beantragt
                          </div>
                          <div className="text-xs text-gray-500">
                            🏗️ {notification.notification?.metadata?.project_name || 'Projekt'}
                          </div>
                        </div>
                        
                        <div className="mt-3 p-2 bg-gradient-to-r from-orange-100 to-yellow-100 rounded border border-orange-300">
                          <div className="flex items-center justify-center gap-2 text-xs text-orange-700 font-medium">
                            <CheckCircle size={14} />
                            <span>👆 Klicken Sie hier, um die Abnahme durchzuführen</span>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Rechnungs-spezifische Informationen */}
                    {notification.type === 'invoice_submitted' && (
                      <div className="mt-3 p-3 bg-green-50 rounded-lg border border-green-200">
                        <div className="mb-2">
                          <div className="text-xs text-gray-600 font-medium flex items-center gap-1">
                            <FileText size={14} />
                            {notification.milestoneTitle || 'Gewerk'}
                          </div>
                          <div className="text-xs text-gray-500">
                            🏗️ {notification.projectName || 'Projekt'}
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="text-gray-500">Dienstleister:</span>
                            <div className="font-semibold text-green-600">
                              {notification.serviceProviderName || 'Unbekannt'}
                            </div>
                          </div>
                          <div>
                            <span className="text-gray-500">Rechnungsnummer:</span>
                            <div className="font-semibold text-green-600">
                              {notification.invoiceNumber || 'N/A'}
                            </div>
                          </div>
                          <div>
                            <span className="text-gray-500">Betrag:</span>
                            <div className="font-semibold text-green-600">
                              {notification.invoiceAmount ? `${notification.invoiceAmount} ${notification.currency || 'CHF'}` : 'N/A'}
                            </div>
                          </div>
                          <div>
                            <span className="text-gray-500">Status:</span>
                            <div className="font-semibold text-green-600">
                              Eingereicht
                            </div>
                          </div>
                        </div>
                        
                        <div className="mt-3 p-2 bg-gradient-to-r from-green-100 to-emerald-100 rounded border border-green-300">
                          <div className="flex items-center justify-center gap-2 text-xs text-green-700 font-medium">
                            <FileText size={14} />
                            <span>👆 Klicken Sie hier, um die Rechnung zu prüfen und zu bezahlen</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Angebot-spezifische Informationen - Design wie Dienstleister-Benachrichtigung */}
                    {(notification.type === 'quote_submitted' || notification.type === 'quote_revised') && notification.notification?.metadata && (
                      <div className={`mt-3 p-3 rounded-lg border ${
                        notification.type === 'quote_revised' 
                          ? 'bg-purple-50 border-purple-200' 
                          : 'bg-blue-50 border-blue-200'
                      }`}>
                        <div className="mb-2">
                          <div className="text-xs text-gray-600 font-medium flex items-center gap-1">
                            {notification.type === 'quote_revised' ? '✏️' : '📋'} 
                            {notification.notification.metadata.quote_title || 'Angebot'}
                            {notification.type === 'quote_revised' && (
                              <span className="ml-2 px-2 py-0.5 bg-purple-200 text-purple-700 rounded-full text-xs font-bold">
                                ÜBERARBEITET
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-gray-500">
                            🏗️ {notification.notification.metadata.project_name || 'Projekt'}
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="text-gray-500">Angebotssumme:</span>
                            <div className={`font-semibold ${
                              notification.type === 'quote_revised' ? 'text-purple-600' : 'text-blue-600'
                            }`}>
                              {new Intl.NumberFormat('de-DE', { 
                                style: 'currency', 
                                currency: notification.notification.metadata.quote_currency || 'CHF' 
                              }).format(notification.notification.metadata.quote_amount || 0)}
                            </div>
                          </div>
                          <div>
                            <span className="text-gray-500">Von:</span>
                            <div className="font-semibold text-gray-700">
                              {notification.notification.metadata.service_provider_name || 'Dienstleister'}
                            </div>
                          </div>
                          <div>
                            <span className="text-gray-500">Start:</span>
                            <div className="font-semibold text-gray-700">
                              20.9.2025
                            </div>
                          </div>
                          <div>
                            <span className="text-gray-500">Fertigstellung:</span>
                            <div className="font-semibold text-gray-700">
                              4.10.2025
                            </div>
                          </div>
                          <div>
                            <span className="text-gray-500">Dauer:</span>
                            <div className="font-semibold text-gray-700">
                              {notification.notification.metadata.estimated_duration || '3 Wochen'}
                            </div>
                          </div>
                          <div>
                            <span className="text-gray-500">Garantie:</span>
                            <div className="font-semibold text-gray-700">
                              {notification.notification.metadata.warranty_period || '24 Monate'}
                            </div>
                          </div>
                        </div>
                        
                        <div className={`mt-3 p-2 rounded border ${
                          notification.type === 'quote_revised'
                            ? 'bg-gradient-to-r from-purple-100 to-indigo-100 border-purple-300'
                            : 'bg-gradient-to-r from-blue-100 to-indigo-100 border-blue-300'
                        }`}>
                          <div className={`flex items-center justify-center gap-2 text-xs font-medium ${
                            notification.type === 'quote_revised' ? 'text-purple-700' : 'text-blue-700'
                          }`}>
                            <FileText size={14} />
                            <span>👆 Klicken Sie hier, um die Ausschreibung zu öffnen</span>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        notification.type === 'invoice_submitted' ? 'bg-green-100 text-green-800' :
                        notification.type === 'invoice_received' ? 'bg-green-100 text-green-800' :
                        notification.type === 'quote_submitted' ? 'bg-blue-100 text-blue-800' :
                        notification.type === 'quote_revised' ? 'bg-purple-100 text-purple-800' :
                        notification.type === 'completion' ? 'bg-orange-100 text-orange-800' :
                        notification.type === 'milestone_completed' ? 'bg-orange-100 text-orange-800' :
                        notification.type === 'defects_resolved' ? 'bg-orange-100 text-orange-800' :
                        notification.appointmentType === 'confirmation' ? 'bg-green-100 text-green-800' :
                        notification.appointmentType === 'reschedule' ? 'bg-yellow-100 text-yellow-800' :
                        notification.appointmentType === 'rejection' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {notification.type === 'invoice_submitted' && '🧾 Rechnung eingereicht'}
                        {notification.type === 'invoice_received' && '🧾 Neue Rechnung'}
                        {notification.type === 'quote_submitted' && '📋 Neues Angebot'}
                        {notification.type === 'quote_revised' && '✏️ Überarbeitetes Angebot'}
                        {notification.type === 'completion' && '✅ Ausschreibung fertiggestellt'}
                        {notification.type === 'milestone_completed' && '✅ Ausschreibung fertiggestellt'}
                        {notification.type === 'defects_resolved' && '🔧 Mängel behoben'}
                        {notification.appointmentType === 'confirmation' && '✅ Bestätigt'}
                        {notification.appointmentType === 'reschedule' && '📅 Neuer Vorschlag'}
                        {notification.appointmentType === 'rejection' && '❌ Abgelehnt'}
                      </span>
                      
                      {!notification.isHandled && (
                        <div className="animate-pulse">
                          <AlertCircle size={16} className={
                            notification.type === 'invoice_received' ? 'text-green-500' :
                            notification.type === 'quote_submitted' ? 'text-blue-500' :
                            notification.type === 'quote_revised' ? 'text-purple-500' : 
                            notification.type === 'completion' ? 'text-orange-500' : 
                            notification.type === 'milestone_completed' ? 'text-orange-500' : 
                            notification.type === 'defects_resolved' ? 'text-orange-500' : 'text-green-500'
                          } />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Response Details Modal */}
      {selectedNotification && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[200] p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className={`text-white p-6 rounded-t-xl ${
              selectedNotification.type === 'quote_submitted' 
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600' 
                : selectedNotification.type === 'completion'
                ? 'bg-gradient-to-r from-orange-600 to-amber-600'
                : selectedNotification.type === 'milestone_completed'
                ? 'bg-gradient-to-r from-orange-600 to-amber-600'
                : selectedNotification.type === 'defects_resolved'
                ? 'bg-gradient-to-r from-orange-600 to-amber-600'
                : 'bg-gradient-to-r from-green-600 to-blue-600'
            }`}>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">
                  {selectedNotification.type === 'quote_submitted' ? 'Neues Angebot' : 
                   selectedNotification.type === 'completion' ? 'Ausschreibung fertiggestellt' : 
                   selectedNotification.type === 'milestone_completed' ? 'Ausschreibung fertiggestellt' : 
                   selectedNotification.type === 'defects_resolved' ? 'Mängelbehebung' : 'Terminantwort Details'}
                </h3>
                <button 
                  onClick={() => setSelectedNotification(null)}
                  className="hover:bg-white/20 rounded-full p-1 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              
              {/* Quote Details */}
              {(selectedNotification.type === 'quote_submitted' || selectedNotification.type === 'quote_revised') && selectedNotification.notification && (
                <div className={`rounded-lg p-4 mb-6 ${
                  selectedNotification.type === 'quote_revised' ? 'bg-purple-50' : 'bg-blue-50'
                }`}>
                  <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                    {selectedNotification.title}
                    {selectedNotification.type === 'quote_revised' && (
                      <span className="px-2 py-0.5 bg-purple-200 text-purple-700 rounded-full text-xs font-bold">
                        ÜBERARBEITET
                      </span>
                    )}
                  </h4>
                  <p className="text-sm text-gray-700 mb-3">{selectedNotification.message}</p>
                  
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <Clock size={16} />
                      Eingereicht am {new Date(selectedNotification.timestamp).toLocaleDateString('de-DE', {
                        day: '2-digit',
                        month: '2-digit', 
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                    {selectedNotification.notification.related_quote_id && (
                      <div className="flex items-center gap-2">
                        <MessageSquare size={16} />
                        Angebot-ID: {selectedNotification.notification.related_quote_id}
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-4 flex gap-2">
                    <button 
                      onClick={async () => {
                        if (selectedNotification.notification) {
                          // Markiere als acknowledged
                          await api.patch(`/api/v1/notifications/${selectedNotification.notification.id}/acknowledge`);
                          
                          // Öffne die Ausschreibung (TradeDetailsModal)
                          const milestoneId = selectedNotification.notification.related_milestone_id;
                          if (milestoneId) {
                            console.log('📋 Öffne Ausschreibung für Milestone:', milestoneId);
                            
                            // Event für Dashboard auslösen, um TradeDetailsModal zu öffnen
                            window.dispatchEvent(new CustomEvent('openTradeDetails', {
                              detail: {
                                tradeId: milestoneId,
                                source: 'bautraeger_quote_notification'
                              }
                            }));
                          }
                          
                          setSelectedNotification(null);
                          loadBautraegerNotifications();
                        }
                      }}
                      className={`text-white px-4 py-2 rounded-lg transition-colors text-sm ${
                        selectedNotification.type === 'quote_revised'
                          ? 'bg-purple-600 hover:bg-purple-700'
                          : 'bg-blue-600 hover:bg-blue-700'
                      }`}
                    >
                      {selectedNotification.type === 'quote_revised' ? '✏️ Überarbeitetes Angebot ansehen' : '📋 Angebot ansehen'}
                    </button>
                    <button 
                      onClick={async () => {
                        if (selectedNotification.notification) {
                          await api.patch(`/api/v1/notifications/${selectedNotification.notification.id}/acknowledge`);
                          setSelectedNotification(null);
                          loadBautraegerNotifications();
                        }
                      }}
                      className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors text-sm"
                    >
                      Quittieren
                    </button>
                  </div>
                </div>
              )}

              {/* Completion Details */}
              {(selectedNotification.type === 'completion' || selectedNotification.type === 'milestone_completed') && selectedNotification.notification && (
                <div className="bg-orange-50 rounded-lg p-4 mb-6">
                  <h4 className="font-medium text-gray-900 mb-3">{selectedNotification.title}</h4>
                  <p className="text-sm text-gray-700 mb-3">{selectedNotification.message}</p>
                  
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <Clock size={16} />
                      Fertiggestellt am {new Date(selectedNotification.timestamp).toLocaleDateString('de-DE', {
                        day: '2-digit',
                        month: '2-digit', 
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                    {selectedNotification.notification.related_milestone_id && (
                      <div className="flex items-center gap-2">
                        <MessageSquare size={16} />
                        Gewerk-ID: {selectedNotification.notification.related_milestone_id}
                      </div>
                    )}
                    {selectedNotification.notification.related_project_id && (
                      <div className="flex items-center gap-2">
                        <MessageSquare size={16} />
                        Projekt-ID: {selectedNotification.notification.related_project_id}
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-4 flex gap-2">
                    <button 
                      onClick={async () => {
                        if (selectedNotification.notification) {
                          // Öffne SimpleCostEstimateModal für Abnahme
                          const milestoneId = selectedNotification.notification.related_milestone_id;
                          if (milestoneId) {
                            console.log('✅ Öffne SimpleCostEstimateModal für Abnahme:', milestoneId);
                            
                            // Event für Dashboard auslösen, um SimpleCostEstimateModal zu öffnen
                            window.dispatchEvent(new CustomEvent('openSimpleCostEstimateModal', {
                              detail: {
                                tradeId: milestoneId,
                                source: 'completion_notification_modal'
                              }
                            }));
                          }
                          
                          // Markiere Benachrichtigung als quittiert
                          await api.patch(`/api/v1/notifications/${selectedNotification.notification.id}/acknowledge`);
                          
                          // Schließe Modal und aktualisiere Liste
                          setSelectedNotification(null);
                          loadBautraegerNotifications();
                        }
                      }}
                      className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors text-sm"
                    >
                      Zur Abnahme
                    </button>
                    <button 
                      onClick={async () => {
                        if (selectedNotification.notification) {
                          await api.patch(`/api/v1/notifications/${selectedNotification.notification.id}/acknowledge`);
                          setSelectedNotification(null);
                          loadBautraegerNotifications();
                        }
                      }}
                      className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors text-sm"
                    >
                      Quittieren
                    </button>
                  </div>
                </div>
              )}

              {/* Defects Resolved Details */}
              {selectedNotification.type === 'defects_resolved' && selectedNotification.notification && (
                <div className="bg-orange-50 rounded-lg p-4 mb-6">
                  <h4 className="font-medium text-gray-900 mb-3">{selectedNotification.title}</h4>
                  <p className="text-sm text-gray-700 mb-3">{selectedNotification.message}</p>
                  
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <Clock size={16} />
                      Gemeldet am {new Date(selectedNotification.timestamp).toLocaleDateString('de-DE', {
                        day: '2-digit',
                        month: '2-digit', 
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                    {selectedNotification.notification.related_milestone_id && (
                      <div className="flex items-center gap-2">
                        <MessageSquare size={16} />
                        Gewerk-ID: {selectedNotification.notification.related_milestone_id}
                      </div>
                    )}
                    {selectedNotification.notification.related_project_id && (
                      <div className="flex items-center gap-2">
                        <MessageSquare size={16} />
                        Projekt-ID: {selectedNotification.notification.related_project_id}
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-4 bg-blue-50 rounded-lg p-3">
                    <h5 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                      <AlertCircle size={16} className="text-blue-500" />
                      Nächste Schritte
                    </h5>
                    <ul className="text-sm text-gray-700 space-y-1">
                      <li>• Prüfen Sie die behobenen Mängel vor Ort</li>
                      <li>• Führen Sie die finale Abnahme durch</li>
                      <li>• Dokumentieren Sie das Ergebnis</li>
                    </ul>
                  </div>
                  
                  <div className="mt-4 p-3 bg-gradient-to-r from-orange-100 to-yellow-100 rounded-lg border border-orange-300 cursor-pointer hover:from-orange-200 hover:to-yellow-200 transition-all duration-200"
                       onClick={async () => {
                         if (selectedNotification.notification) {
                           // Öffne die Ausschreibung für finale Abnahme
                           const milestoneId = selectedNotification.notification.related_milestone_id;
                           if (milestoneId) {
                             console.log('🔧 Öffne SimpleCostEstimateModal für finale Abnahme:', milestoneId);
                             
                             // Event für Dashboard auslösen, um SimpleCostEstimateModal zu öffnen
                             window.dispatchEvent(new CustomEvent('openSimpleCostEstimateModal', {
                               detail: {
                                 tradeId: milestoneId,
                                 source: 'defects_resolved_notification'
                               }
                             }));
                           }
                           
                           // Markiere Benachrichtigung als quittiert
                           await api.patch(`/api/v1/notifications/${selectedNotification.notification.id}/acknowledge`);
                           
                           // Schließe Modal und aktualisiere Liste
                           setSelectedNotification(null);
                           loadBautraegerNotifications();
                         }
                       }}>
                    <div className="flex items-center justify-center gap-2 text-sm text-orange-700 font-medium">
                      <CheckCircle size={16} />
                      <span>👆 Klicken Sie hier, um die Ausschreibung für die finale Abnahme zu öffnen</span>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Appointment Details */}
              {selectedNotification.type === 'appointment' && (
                <>
                  {/* Termin-Details aus appointment oder notification.data */}
                  {(() => {
                    // Parse appointment data from notification.data if available
                    let appointmentData: any = {};
                    if (selectedNotification.notification?.data) {
                      try {
                        appointmentData = JSON.parse(selectedNotification.notification.data);
                      } catch (e) {
                        console.error('Fehler beim Parsen von appointment data:', e);
                      }
                    }
                    
                    // Verwende entweder appointment-Objekt oder geparste data
                    const appointment = selectedNotification.appointment || appointmentData;
                    const appointmentTitle = appointment.appointment_title || appointment.title || 'Besichtigungstermin';
                    const scheduledDate = appointment.scheduled_date;
                    const location = appointment.location || '';
                    const durationMinutes = appointment.duration_minutes || 60;
                    
                    return (
                      <div className="bg-gray-50 rounded-lg p-4 mb-6">
                        <h4 className="font-medium text-gray-900 mb-3">{appointmentTitle}</h4>
                      
                        <div className="space-y-2 text-sm text-gray-600">
                          {scheduledDate && (
                            <>
                              <div className="flex items-center gap-2">
                                <Calendar size={16} />
                                {formatDate(scheduledDate)} um {formatTime(scheduledDate)}
                              </div>
                              <div className="flex items-center gap-2">
                                <Clock size={16} />
                                {durationMinutes} Minuten
                              </div>
                            </>
                          )}
                          {location && (
                            <div className="flex items-center gap-2">
                              <MapPin size={16} />
                              {location}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Service Provider Response - aus response oder notification.data */}
                  {(() => {
                    // Parse response data
                    let responseData: any = {};
                    if (selectedNotification.notification?.data) {
                      try {
                        responseData = JSON.parse(selectedNotification.notification.data);
                      } catch (e) {
                        console.error('Fehler beim Parsen von response data:', e);
                      }
                    }
                    
                    // Verwende entweder response-Objekt oder geparste data
                    const response = selectedNotification.response || responseData;
                    const serviceProviderName = response.service_provider_name || responseData.service_provider_name || 'Dienstleister';
                    const responseMessage = response.message || response.response_message || responseData.response_message || '';
                    const suggestedDate = response.suggested_date || responseData.suggested_date;
                    
                    return (
                      <div className="bg-blue-50 rounded-lg p-4 mb-6">
                        <h5 className="font-medium text-gray-900 mb-2">Antwort des Dienstleisters</h5>
                        
                        <div className="flex items-center gap-2 mb-2">
                          <User size={16} className="text-blue-600" />
                          <span className="text-sm text-gray-700">{serviceProviderName}</span>
                        </div>
                        
                        <div className={`inline-flex px-3 py-1 rounded-full text-sm font-medium mb-3 ${
                          selectedNotification.appointmentType === 'confirmation' ? 'bg-green-100 text-green-800' :
                          selectedNotification.appointmentType === 'reschedule' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {selectedNotification.appointmentType === 'confirmation' && '✅ Termin bestätigt'}
                          {selectedNotification.appointmentType === 'reschedule' && '📅 Alternativtermin vorgeschlagen'}
                          {selectedNotification.appointmentType === 'rejection' && '❌ Termin abgelehnt'}
                        </div>

                        {responseMessage && (
                          <div className="bg-white rounded p-3 text-sm text-gray-700 italic">
                            "{responseMessage}"
                          </div>
                        )}

                        {suggestedDate && (
                          <div className="mt-3 p-3 bg-yellow-100 rounded">
                            <p className="text-sm font-medium text-yellow-800">Vorgeschlagener Alternativtermin:</p>
                            <p className="text-sm text-yellow-700">
                              {formatDate(suggestedDate)} um {formatTime(suggestedDate)}
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col gap-3">
                
                {/* E-Mail an Dienstleister - nur für Appointments */}
                {selectedNotification.type === 'appointment' && (
                  <button
                    onClick={() => generateEmailToServiceProvider(selectedNotification)}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                  >
                    <Mail size={16} />
                    E-Mail an Dienstleister senden
                  </button>
                )}

                {/* Als behandelt markieren */}
                {!selectedNotification.isHandled && (
                  <button
                    onClick={() => handleMarkAsHandled(notifications.indexOf(selectedNotification))}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
                  >
                    <Check size={16} />
                    Als behandelt markieren
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
} 
