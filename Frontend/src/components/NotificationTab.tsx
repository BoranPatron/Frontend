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
  FileText,
  Phone,
  CheckCircle,
  Trash2,
  CreditCard
} from 'lucide-react';
import { appointmentService } from '../api/appointmentService';
import { getApiBaseUrl, apiCall } from '../api/api';

interface NotificationTabProps {
  userRole: 'BAUTRAEGER' | 'DIENSTLEISTER';
  userId: number;
  onResponseSent?: () => void;
}

interface NotificationData {
  id: number;
  type: 'appointment_invitation' | 'appointment_responses' | 'service_provider_selection_reminder' | 'quote_accepted' | 'quote_submitted' | 'resource_allocated' | 'tender_invitation' | 'acceptance_with_defects' | 'milestone_completed' | 'invoice_submitted';
  title: string;
  message: string;
  description?: string;
  timestamp: string;
  isNew: boolean;
  appointmentId?: number;
  scheduledDate?: string;
  duration_minutes?: number;
  location?: string;
  location_details?: string;
  contact_person?: string;
  contact_phone?: string;
  preparation_notes?: string;
  myResponse?: any;
  responses?: any[];
  selectedServiceProviderId?: number;
  tradeId?: number;
  quoteId?: number;
  projectName?: string;
  quoteSummary?: {
    amount: number;
    currency: string;
    validUntil?: string;
    startDate?: string;
    completionDate?: string;
  };
  actionRequired?: boolean;
  // Für allgemeine Benachrichtigungen
  notification?: any;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  // Für Ressourcen-Benachrichtigungen
  allocationId?: number;
  resourceId?: number;
  tradeTitle?: string;
  bautraegerName?: string;
  deadline?: string;
  allocatedStartDate?: string;
  allocatedEndDate?: string;
  allocatedPersonCount?: number;
  // Für milestone_completed Benachrichtigungen
  directLink?: string;
  completionDate?: string;
  quoteAmount?: number;
  currency?: string;
  // Für invoice_submitted Benachrichtigungen
  invoiceId?: number;
  invoiceNumber?: string;
  invoiceDate?: string;
  dueDate?: string;
  totalAmount?: number;
  serviceProviderName?: string;
  showAcceptanceTab?: boolean;
}

export default function NotificationTab({ userRole, userId, onResponseSent }: NotificationTabProps) {
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<NotificationData | null>(null);
  const [responseMessage, setResponseMessage] = useState('');
  const [suggestedDate, setSuggestedDate] = useState('');
  const [suggestedTime, setSuggestedTime] = useState('');
  const [loading, setLoading] = useState(false);
  const [seenNotifications, setSeenNotifications] = useState<Set<number>>(new Set());
  const notificationTabRef = useRef<HTMLDivElement>(null);

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
    // Bereinige alte permanente Marker beim Laden
    cleanupOldPermanentMarkers();
    
    loadNotifications();
    const interval = setInterval(loadNotifications, 30000);
    
    // Event-Listener für neue Angebot-Benachrichtigungen (Dienstleister)
    const handleQuoteSubmitted = (event: CustomEvent) => {
      console.log('📢 Quote submitted event empfangen:', event.detail);
      const newNotification = event.detail.notification;
      
      // Prüfe ob newNotification gültig ist
      if (newNotification && newNotification.id) {
        // Füge die neue Benachrichtigung zur Liste hinzu
        setNotifications(prev => [newNotification, ...prev]);
        
        // Setze automatisch als "neu" für 10 Sekunden
        setTimeout(() => {
          setNotifications(prev => 
            prev.map(n => n && n.id === newNotification.id ? { ...n, isNew: false } : n)
          );
        }, 10000);
      } else {
        console.error('❌ NotificationTab: Ungültige Benachrichtigung empfangen:', newNotification);
      }
    };
    
    // Event-Listener für neue Angebot-Benachrichtigungen (Bauträger)
    const handleQuoteSubmittedForBautraeger = (event: CustomEvent) => {
      console.log('📢 NotificationTab: quoteSubmittedForBautraeger Event empfangen, aber NotificationTab ist nur für Dienstleister!');
      console.log('📢 NotificationTab: Event-Detail:', event.detail);
      // NotificationTab ist nur für Dienstleister - ignoriere Bautraeger-Events
      return;
    };
    
    window.addEventListener('quoteSubmitted', handleQuoteSubmitted as EventListener);
    window.addEventListener('quoteSubmittedForBautraeger', handleQuoteSubmittedForBautraeger as EventListener);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('quoteSubmitted', handleQuoteSubmitted as EventListener);
      window.removeEventListener('quoteSubmittedForBautraeger', handleQuoteSubmittedForBautraeger as EventListener);
    };
  }, [userId, userRole]);

  useEffect(() => {
    const seenKey = `seen_notifications_${userId}`;
    const saved = localStorage.getItem(seenKey);
    if (saved) {
      try {
        const seenArray = JSON.parse(saved);
        setSeenNotifications(new Set(seenArray));
      } catch (e) {
        console.error('Error loading seen notifications:', e);
      }
    }
  }, [userId]);

  const markAsSeen = (notificationIds: number[]) => {
    const newSeen = new Set([...seenNotifications, ...notificationIds]);
    setSeenNotifications(newSeen);
    
    const seenKey = `seen_notifications_${userId}`;
    localStorage.setItem(seenKey, JSON.stringify(Array.from(newSeen)));
  };

  const cleanupOldPermanentMarkers = () => {
    // Entferne alle alten permanenten Marker für appointment responses
    // Diese blockieren neue Benachrichtigungen unnötig
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(`appointment_response_`) && key.includes(`_${userId}`)) {
        keysToRemove.push(key);
      }
    }
    
    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
      console.log(`🧹 Entfernt alten permanenten Marker: ${key}`);
    });
    
    if (keysToRemove.length > 0) {
      console.log(`🧹 Bereinigung abgeschlossen: ${keysToRemove.length} alte Marker entfernt`);
    }
  };

  const handleMarkAllAsRead = async () => {
    // Markiere alle aktuellen Benachrichtigungen als gesehen (lokal)
    const allNotificationIds = notifications.map(n => n.id);
    markAsSeen(allNotificationIds);
    
    // ✅ Markiere Backend-Benachrichtigungen als acknowledged
    const backendNotifications = notifications.filter(n => n.notification?.id);
    if (backendNotifications.length > 0) {
      // Sende Acknowledge-Request für jede Backend-Benachrichtigung
      const acknowledgePromises = backendNotifications.map(async notification => {
        try {
          await apiCall(`/notifications/${notification.notification.id}/acknowledge`, {
            method: 'PATCH'
          });
          console.log('✅ Benachrichtigung als quittiert markiert:', notification.notification.id);
        } catch (error) {
          console.error('❌ Fehler beim Quittieren der Benachrichtigung:', error);
        }
      });
      
      // Warte auf alle Acknowledge-Requests
      await Promise.all(acknowledgePromises);
    }
    
    // Für Dienstleister: Markiere nur als gesehen, aber setze keine permanenten Marker
    // die neue Benachrichtigungen blockieren würden
    if (userRole === 'DIENSTLEISTER') {
      notifications.forEach(notification => {
        if (notification.type === 'appointment_invitation') {
          // Nur als gesehen markieren, aber nicht permanent blockieren
          markAsSeen([notification.id]);
        }
      });
    }
    
    // Für Bauträger: Setze permanente Marker für alle Antworten
    if (userRole === 'BAUTRAEGER') {
      notifications.forEach(notification => {
        if (notification.type === 'appointment_responses') {
          const permanentSeenKey = `appointment_responses_${notification.appointmentId}_${userId}`;
          localStorage.setItem(permanentSeenKey, JSON.stringify({
            appointmentId: notification.appointmentId,
            userId: userId,
            markedAllReadAt: new Date().toISOString()
          }));
        }
        if (notification.type === 'service_provider_selection_reminder') {
          markAsSeen([notification.id]);
        }
      });
    }
    
    // Aktualisiere die Benachrichtigungen
    setTimeout(() => {
      loadNotifications();
    }, 500);
  };

  const handleDeleteNotification = async (notificationId: number) => {
    try {
      // Entferne die Benachrichtigung aus dem lokalen State
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      
      // Wenn es eine Backend-Benachrichtigung ist, lösche sie auch dort
      const notification = notifications.find(n => n.id === notificationId);
      if (notification?.notification?.id) {
        await apiCall(`/notifications/${notification.notification.id}`, {
          method: 'DELETE'
        });
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
      await apiCall('/notifications/delete-all', {
        method: 'DELETE'
      });
      
      // Leere den lokalen State
      setNotifications([]);
      
      // Schließe Modal falls offen
      setSelectedNotification(null);
      
      console.log('Alle Benachrichtigungen gelöscht');
    } catch (error) {
      console.error('Fehler beim Löschen aller Benachrichtigungen:', error);
    }
  };

  const loadNotifications = async () => {
    try {
      let notifications: NotificationData[] = [];
      
      // 1. Lade allgemeine Benachrichtigungen aus der Datenbank
      try {
        const notificationData = await apiCall('/notifications/', {
          method: 'GET'
        });
        
        const generalNotifications = notificationData || [];
        
        console.log('🔔 NotificationTab: API Response:', notificationData);
        console.log('🔔 NotificationTab: User Role:', userRole);
        console.log('🔔 NotificationTab: User ID:', userId);
        
        // Filtere für Dienstleister relevante Benachrichtigungen
        if (userRole === 'DIENSTLEISTER') {
          console.log('🔔 NotificationTab: Processing notifications for DIENSTLEISTER');
          generalNotifications.forEach((notification: any) => {
            console.log('🔔 NotificationTab: Processing notification:', notification);
            
            // Überspringe bereits quittierte Benachrichtigungen
            if (notification.is_acknowledged) {
              console.log('🔔 NotificationTab: Skipping acknowledged notification:', notification.id);
              return;
            }
            
            // Normalisiere Type zu Lowercase für Vergleich
            const notificationType = (notification.type || '').toLowerCase();
            console.log('🔔 NotificationTab: Normalized type:', notificationType);
            
            if (notificationType === 'quote_accepted') {
              console.log('🔔 NotificationTab: Adding quote_accepted notification');
              notifications.push({
                id: notification.id,
                type: 'quote_accepted',
                title: notification.title,
                message: notification.message,
                timestamp: notification.created_at,
                isNew: !notification.is_acknowledged,
                notification: notification,
                priority: notification.priority
              });
            } else if (notificationType === 'resource_allocated') {
              console.log('🔔 NotificationTab: Adding resource_allocated notification');
              const data = notification.data ? JSON.parse(notification.data) : {};
              notifications.push({
                id: notification.id,
                type: 'resource_allocated',
                title: notification.title,
                message: notification.message,
                timestamp: notification.created_at,
                isNew: !notification.is_acknowledged,
                notification: notification,
                priority: notification.priority,
                allocationId: data.allocation_id,
                resourceId: data.resource_id,
                tradeId: data.trade_id,
                tradeTitle: data.trade_title,
                projectName: data.project_name,
                bautraegerName: data.bautraeger_name,
                allocatedStartDate: data.allocated_start_date,
                allocatedEndDate: data.allocated_end_date,
                allocatedPersonCount: data.allocated_person_count
              });
            } else if (notificationType === 'tender_invitation') {
              console.log('🔔 NotificationTab: Adding tender_invitation notification');
              const data = notification.data ? JSON.parse(notification.data) : {};
              notifications.push({
                id: notification.id,
                type: 'tender_invitation',
                title: notification.title,
                message: notification.message,
                timestamp: notification.created_at,
                isNew: !notification.is_acknowledged,
                notification: notification,
                priority: notification.priority,
                allocationId: data.allocation_id,
                resourceId: data.resource_id,
                tradeId: data.trade_id,
                tradeTitle: data.trade_title,
                projectName: data.project_name,
                bautraegerName: data.bautraeger_name,
                deadline: data.deadline,
                allocatedStartDate: data.allocated_start_date,
                allocatedEndDate: data.allocated_end_date,
                allocatedPersonCount: data.allocated_person_count
              });
            } else if (notificationType === 'acceptance_with_defects') {
              console.log('🔔 NotificationTab: Adding acceptance_with_defects notification');
              const data = notification.data ? JSON.parse(notification.data) : {};
              notifications.push({
                id: notification.id,
                type: 'acceptance_with_defects',
                title: notification.title,
                message: notification.message,
                timestamp: notification.created_at,
                isNew: !notification.is_acknowledged,
                notification: notification,
                priority: notification.priority,
                tradeId: data.tradeId || data.trade_id,
                tradeTitle: data.tradeTitle || data.trade_title,
                projectName: data.projectName || data.project_name,
                bautraegerName: data.bautraegerName || data.bautraeger_name
              });
            } else if (notificationType === 'milestone_completed') {
              console.log('🔔 NotificationTab: Adding milestone_completed notification');
              const data = notification.data ? JSON.parse(notification.data) : {};
              notifications.push({
                id: notification.id,
                type: 'milestone_completed',
                title: notification.title,
                message: notification.message,
                timestamp: notification.created_at,
                isNew: !notification.is_acknowledged,
                notification: notification,
                priority: notification.priority,
                tradeId: data.milestone_id,
                tradeTitle: data.milestone_title,
                projectName: data.project_name,
                directLink: data.direct_link,
                completionDate: data.completion_date,
                quoteAmount: data.quote_amount,
                currency: data.currency
              });
            } else if (notificationType === 'payment_received') {
              console.log('🔔 NotificationTab: Adding payment_received notification for Dienstleister');
              const data = notification.data ? JSON.parse(notification.data) : {};
              notifications.push({
                id: notification.id,
                type: 'payment_received',
                title: notification.title,
                message: notification.message,
                timestamp: notification.created_at,
                isNew: !notification.is_acknowledged,
                notification: notification,
                priority: notification.priority,
                invoiceId: data.invoice_id,
                invoiceNumber: data.invoice_number,
                tradeId: data.milestone_id,
                tradeTitle: data.milestone_title,
                projectName: data.project_name,
                bautraegerName: data.bautraeger_name,
                totalAmount: data.total_amount,
                currency: data.currency,
                paidAt: data.paid_at,
                paymentReference: data.payment_reference,
                directLink: data.direct_link
              });
            }
          });
        } else if (userRole === 'BAUTRAEGER') {
          console.log('🔔 NotificationTab: Processing notifications for BAUTRAEGER');
          generalNotifications.forEach((notification: any) => {
            console.log('🔔 NotificationTab: BAUTRAEGER - Processing notification:', notification);
            
            // Überspringe bereits quittierte Benachrichtigungen
            if (notification.is_acknowledged) {
              console.log('🔔 NotificationTab: Skipping acknowledged notification:', notification.id);
              return;
            }
            
            // Normalisiere Type zu Lowercase für Vergleich
            const notificationType = (notification.type || '').toLowerCase();
            console.log('🔔 NotificationTab: Normalized type:', notificationType);
            
            if (notificationType === 'quote_submitted') {
              console.log('🔔 NotificationTab: Adding quote_submitted notification for Bautraeger');
              const data = notification.data ? JSON.parse(notification.data) : {};
              notifications.push({
                id: notification.id,
                type: 'quote_submitted',
                title: notification.title,
                message: notification.message,
                timestamp: notification.created_at,
                isNew: !notification.is_acknowledged,
                notification: notification,
                priority: notification.priority,
                tradeId: data.trade_id || notification.related_milestone_id,
                quoteId: data.quote_id || notification.related_quote_id,
                projectName: data.project_name,
                bautraegerName: data.bautraeger_name,
                quoteSummary: {
                  amount: data.quote_amount,
                  currency: data.quote_currency,
                  validUntil: data.valid_until,
                  startDate: data.start_date,
                  completionDate: data.completion_date
                }
              });
            } else if (notificationType === 'invoice_submitted') {
              console.log('🔔 NotificationTab: Adding invoice_submitted notification for Bautraeger');
              const data = notification.data ? JSON.parse(notification.data) : {};
              notifications.push({
                id: notification.id,
                type: 'invoice_submitted',
                title: notification.title,
                message: notification.message,
                timestamp: notification.created_at,
                isNew: !notification.is_acknowledged,
                notification: notification,
                priority: notification.priority,
                tradeId: data.milestone_id || data.tradeId,
                tradeTitle: data.milestone_title || data.tradeTitle,
                projectName: data.project_name || data.projectName,
                serviceProviderName: data.service_provider_name,
                invoiceId: data.invoice_id,
                invoiceNumber: data.invoice_number,
                totalAmount: data.total_amount,
                currency: data.currency,
                invoiceDate: data.invoice_date,
                dueDate: data.due_date,
                directLink: data.direct_link,
                showAcceptanceTab: data.showAcceptanceTab
              });
            }
          });
        }
      } catch (error) {
        console.error('Fehler beim Laden der allgemeinen Benachrichtigungen:', error);
        // Bei Netzwerkfehlern nicht die gesamte Funktion abbrechen
        // sondern nur die allgemeinen Benachrichtigungen überspringen
      }
      
      // 2. Lade Termin-Benachrichtigungen (bestehende Logik)
      try {
        const data = await apiCall('/appointments/my-appointments-simple', {
          method: 'GET'
        });
        const myAppointments = data.appointments || [];
        
        if (userRole === 'DIENSTLEISTER') {
          const appointmentNotifications = myAppointments.map((apt: any) => {
            // Parse responses
            let responses = [];
            if (apt.responses_array && Array.isArray(apt.responses_array)) {
              responses = apt.responses_array;
            } else if (apt.responses) {
              try {
                responses = typeof apt.responses === 'string' ? JSON.parse(apt.responses) : apt.responses;
              } catch (e) {
                responses = [];
              }
            }
            
            // Find my response
            const myResponse = responses.find((r: any) => r.service_provider_id === userId);
            
            // Check for permanent response marker - if user has responded, don't show as new anymore
            const permanentSeenKey = `appointment_response_${apt.id}_${userId}`;
            const hasResponded = localStorage.getItem(permanentSeenKey);
            
            // Only skip if user has actually responded to THIS specific appointment
            // Don't skip based on permanent marker alone - let user see new invitations
            if (myResponse) {
              console.log(`🔕 Skipping notification for appointment ${apt.id} - user has already responded`);
              return null; // This will be filtered out later
            }
            
            const isNew = !seenNotifications.has(apt.id);
            
            return {
              id: apt.id,
              type: 'appointment_invitation' as const,
              title: apt.title || `Besichtigung #${apt.id}`,
              message: apt.description || 'Neue Termineinladung',
              description: apt.description,
              timestamp: apt.scheduled_date,
              isNew,
              appointmentId: apt.id,
              scheduledDate: apt.scheduled_date,
              duration_minutes: apt.duration_minutes,
              location: apt.location || '',
              location_details: apt.location_details || '',
              contact_person: apt.contact_person || '',
              contact_phone: apt.contact_phone || '',
              preparation_notes: apt.preparation_notes || '',
              myResponse,
              responses
            };
          }).filter(notification => notification !== null); // Remove null entries
          
          // Kombiniere allgemeine und Termin-Benachrichtigungen
          notifications = [...notifications, ...appointmentNotifications];
        } else if (userRole === 'BAUTRAEGER') {
          myAppointments.forEach((apt: any) => {
            // Parse responses
            let responses = [];
            if (apt.responses_array && Array.isArray(apt.responses_array)) {
              responses = apt.responses_array;
            } else if (apt.responses) {
              try {
                responses = typeof apt.responses === 'string' ? JSON.parse(apt.responses) : apt.responses;
              } catch (e) {
                responses = [];
              }
            }
            
            // Appointment responses notification
            if (responses.length > 0) {
              const newResponses = responses.filter((r: any) => !seenNotifications.has(apt.id));
              const hasNewResponses = newResponses.length > 0;
              
              // Prüfe auf permanenten Seen-Marker für Bauträger
              const permanentSeenKey = `appointment_responses_${apt.id}_${userId}`;
              const hasPermanentSeen = localStorage.getItem(permanentSeenKey);
              const isNewForBautraeger = hasNewResponses && !hasPermanentSeen;

              notifications.push({
                id: apt.id,
                type: 'appointment_responses' as const,
                title: apt.title || `Besichtigung #${apt.id}`,
                message: `${responses.length} Antworten erhalten${newResponses.length > 0 ? ` (${newResponses.length} neue)` : ''}`,
                description: apt.description,
                timestamp: apt.created_at || apt.scheduled_date,
                isNew: isNewForBautraeger,
                appointmentId: apt.id,
                scheduledDate: apt.scheduled_date,
                duration_minutes: apt.duration_minutes,
                location: apt.location || '',
                location_details: apt.location_details || '',
                contact_person: apt.contact_person || '',
                contact_phone: apt.contact_phone || '',
                preparation_notes: apt.preparation_notes || '',
                responses: responses,
                selectedServiceProviderId: apt.selected_service_provider_id
              });

              // Service provider selection reminder notification
              // Zeige nur wenn: Termin akzeptiert wurde, Termin-Datum erreicht/überschritten, kein Dienstleister ausgewählt
              if (apt.scheduled_date && !apt.selected_service_provider_id) {
                const appointmentDate = new Date(apt.scheduled_date);
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                appointmentDate.setHours(0, 0, 0, 0);
                
                // Prüfe ob mindestens ein Dienstleister zugesagt hat
                const acceptedResponses = responses.filter((r: any) => r.status === 'accepted');
                
                if (appointmentDate <= today && acceptedResponses.length > 0) {
                  const reminderNotificationId = apt.id + 10000; // Unique ID für Reminder
                  const isReminderNew = !seenNotifications.has(reminderNotificationId);
                  
                  notifications.push({
                    id: reminderNotificationId,
                    type: 'service_provider_selection_reminder' as const,
                    title: 'Dienstleister auswählen',
                    message: `Wählen Sie einen Dienstleister für die Besichtigung vom ${appointmentDate.toLocaleDateString('de-DE')} aus`,
                    timestamp: apt.scheduled_date,
                    isNew: isReminderNew,
                    appointmentId: apt.id,
                    scheduledDate: apt.scheduled_date,
                    location: apt.location || '',
                    responses: responses,
                    selectedServiceProviderId: apt.selected_service_provider_id
                  });
                }
              }
            }
          });
        }
      } catch (error) {
        console.error('❌ NotificationTab: Fehler beim Laden der Termine:', error);
        // Bei Netzwerkfehlern nicht die gesamte Funktion abbrechen
        // sondern nur die Termin-Benachrichtigungen überspringen
      }
      
      console.log('🔔 NotificationTab: Final notifications array:', notifications);
      console.log('🔔 NotificationTab: Total notifications:', notifications.length);
      
      // Filtere undefined/null Elemente aus dem Array
      const validNotifications = notifications.filter(n => n !== null && n !== undefined);
      console.log('🔔 NotificationTab: Valid notifications:', validNotifications.length);
      
      setNotifications(validNotifications);
    } catch (error) {
      console.error('❌ NotificationTab: Network error:', error);
    }
  };

  const handleResponse = async (status: 'accepted' | 'rejected' | 'rejected_with_suggestion') => {
    if (!selectedNotification) return;
    
    setLoading(true);
    try {
      const suggestedDateTime = status === 'rejected_with_suggestion' && suggestedDate && suggestedTime
        ? `${suggestedDate}T${suggestedTime}:00.000Z`
        : undefined;

      await appointmentService.respondToAppointment({
        appointment_id: selectedNotification.appointmentId,
        status,
        message: responseMessage || undefined,
        suggested_date: suggestedDateTime
      });

      // Mark as seen
      markAsSeen([selectedNotification.id]);
      
      // Note: Keine permanenten Marker mehr setzen, da diese neue Benachrichtigungen blockieren
      // Die Antwort wird über die API gespeichert und über myResponse erkannt
      
      // Remove the notification from the list immediately
      setNotifications(prev => prev.filter(n => n.id !== selectedNotification.id));
      
      console.log(`✅ Notification for appointment ${selectedNotification.appointmentId} removed after response: ${status}`);
      
      // Close modal and clear form
      setSelectedNotification(null);
      setResponseMessage('');
      setSuggestedDate('');
      setSuggestedTime('');
      
      // Notify parent component
      if (onResponseSent) {
        onResponseSent();
      }
      
    } catch (error) {
      console.error('❌ NotificationTab: Fehler beim Senden der Antwort:', error);
    } finally {
      setLoading(false);
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

  const newCount = notifications.filter(n => n && n.isNew).length;
  const hasNewNotifications = newCount > 0;
  
  return (
    <>
      {/* Notification Tab - Fixed Position */}
      <div 
        ref={notificationTabRef}
        className={`fixed right-0 transform z-[9999] transition-all duration-300 ${
          isExpanded ? 'translate-x-0' : 'translate-x-full'
        }`}
        style={{ top: 'calc(15% - 50px)' }}
      >
        
        {/* Tab Handle - Der "Griff" der Lasche (links) */}
        <div 
          className={`absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-full cursor-pointer transition-all duration-300 ${
            hasNewNotifications 
              ? 'bg-gradient-to-r from-[#ffbd59]/80 to-[#ffa726]/80 animate-pulse shadow-lg shadow-[#ffbd59]/50' 
              : 'bg-gradient-to-r from-[#ffbd59]/60 to-[#ffa726]/60'
          } rounded-l-lg px-3 py-4 text-white hover:from-[#ffbd59]/80 hover:to-[#ffa726]/80 hover:shadow-xl backdrop-blur-sm border border-white/20`}
          onClick={() => {
            setIsExpanded(!isExpanded);
            if (!isExpanded && hasNewNotifications) {
              // Mark all as seen when opening
              markAsSeen(notifications.filter(n => n.isNew).map(n => n.id));
            }
          }}
        >
          <div className="flex flex-col items-center gap-2">
            {/* Dienstleister Icon */}
            <div className={`${hasNewNotifications ? 'animate-bounce' : ''}`}>
              <Bell size={20} />
            </div>
            
            {/* Anzahl neue Benachrichtigungen */}
            {hasNewNotifications && (
              <div className="bg-white text-[#ffbd59] rounded-full w-7 h-7 flex items-center justify-center text-xs font-bold animate-pulse shadow-lg">
                {newCount}
              </div>
            )}
            
            {/* Zeige Anzahl auch wenn keine neuen */}
            {!hasNewNotifications && notifications.length > 0 && (
              <div className="bg-white bg-opacity-90 text-gray-600 rounded-full w-6 h-6 flex items-center justify-center text-xs font-medium">
                {notifications.length}
              </div>
            )}
            
            {/* Pfeil */}
            <div className={`transform transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
              <ChevronLeft size={16} />
            </div>
          </div>
        </div>

        {/* Notification Panel */}
        <div className="bg-gradient-to-br from-[#1a1a2e]/95 to-[#2c3539]/95 backdrop-blur-xl shadow-2xl rounded-l-xl w-96 max-h-[80vh] overflow-hidden border-l-4 border-[#ffbd59] border border-white/20">
          
          {/* Header */}
          <div className="bg-gradient-to-r from-[#ffbd59] to-[#ffa726] text-white p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell size={20} />
                <h3 className="font-semibold">
                  Benachrichtigungen
                </h3>
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
            {notifications.length === 0 ? (
              <div className="text-center py-8 text-gray-200">
                <Bell size={32} className="mx-auto mb-2 opacity-50" />
                <p>Keine Benachrichtigungen</p>
              </div>
            ) : (
              <div className="space-y-2 p-2">
                {notifications.filter(n => n !== null && n !== undefined).map((notification, index) => (
                  <div
                    key={`notification-${notification.id}-${index}`}
                    className={`p-3 rounded-lg border border-white/20 cursor-pointer hover:border-[#ffbd59]/50 transition-all duration-300 backdrop-blur-sm ${
                      notification.isNew ? 'bg-[#ffbd59]/10 border-l-4 border-l-[#ffbd59] shadow-lg shadow-[#ffbd59]/20' : 'bg-white/5 hover:bg-white/10'
                    }`}
                    onClick={async () => {
                      if (userRole === 'DIENSTLEISTER' && notification.type === 'appointment_invitation') {
                        setSelectedNotification(notification);
                      } else if (userRole === 'DIENSTLEISTER' && notification.type === 'quote_accepted') {
                        setSelectedNotification(notification);
                        markAsSeen([notification.id]);
                      } else if (userRole === 'DIENSTLEISTER' && notification.type === 'quote_submitted') {
                        // Öffne die betroffene Ausschreibung
                        console.log('📋 Öffne Ausschreibung für Quote:', notification.tradeId);
                        markAsSeen([notification.id]);
                        
                        // Prüfe ob tradeId gültig ist
                        if (!notification.tradeId || notification.tradeId === 0) {
                          console.error('❌ NotificationTab: Ungültige tradeId:', notification.tradeId);
                          alert('Die Ausschreibung konnte nicht gefunden werden. Die Benachrichtigung enthält ungültige Daten.');
                          return;
                        }
                        
                        // Event für ServiceProviderDashboard auslösen, um TradeDetailsModal zu öffnen
                        window.dispatchEvent(new CustomEvent('openTradeDetails', {
                          detail: {
                            tradeId: notification.tradeId,
                            source: 'quote_notification'
                          }
                        }));
                        
                        // Schließe Benachrichtigungs-Panel
                        setIsExpanded(false);
                      } else if (userRole === 'DIENSTLEISTER' && notification.type === 'resource_allocated') {
                        // Öffne die betroffene Ausschreibung für Angebotsabgabe
                        console.log('📋 Öffne Ausschreibung für Angebotsabgabe von Resource Allocation:', notification.tradeId);
                        
                        // Markiere Benachrichtigung als quittiert (acknowledge) im Backend
                        if (notification.notification?.id) {
                          try {
                            await apiCall(`/notifications/${notification.notification.id}/acknowledge`, {
                              method: 'PATCH'
                            });
                            console.log('✅ Benachrichtigung als quittiert markiert:', notification.notification.id);
                            
                            // Lade Benachrichtigungen sofort neu, um UI zu aktualisieren
                            setTimeout(() => {
                              loadNotifications();
                            }, 500);
                          } catch (error) {
                            console.error('❌ Fehler beim Quittieren der Benachrichtigung:', error);
                          }
                        }
                        
                        // Markiere auch lokal als gesehen
                        markAsSeen([notification.id]);
                        
                        // Prüfe ob tradeId gültig ist
                        if (!notification.tradeId || notification.tradeId === 0) {
                          console.error('❌ NotificationTab: Ungültige tradeId für Ressourcen-Zuweisung:', notification.tradeId);
                          alert('Die Ausschreibung konnte nicht gefunden werden. Die Benachrichtigung enthält ungültige Daten.');
                          return;
                        }
                        
                        // Event für ServiceProviderDashboard auslösen, um CostEstimateForm zu öffnen
                        window.dispatchEvent(new CustomEvent('openTradeDetails', {
                          detail: {
                            tradeId: notification.tradeId,
                            allocationId: notification.allocationId,
                            source: 'resource_allocation_notification',
                            showQuoteForm: true
                          }
                        }));
                        
                        // Schließe Benachrichtigungs-Panel
                        setIsExpanded(false);
                      } else if (userRole === 'DIENSTLEISTER' && notification.type === 'tender_invitation') {
                        // Öffne die betroffene Ausschreibung für Angebotsabgabe
                        console.log('📋 Öffne Ausschreibung für Angebotsabgabe:', notification.tradeId);
                        
                        // Markiere Benachrichtigung als quittiert (acknowledge) im Backend
                        if (notification.notification?.id) {
                          try {
                            await apiCall(`/notifications/${notification.notification.id}/acknowledge`, {
                              method: 'PATCH'
                            });
                            console.log('✅ Benachrichtigung als quittiert markiert:', notification.notification.id);
                            
                            // Lade Benachrichtigungen sofort neu, um UI zu aktualisieren
                            setTimeout(() => {
                              loadNotifications();
                            }, 500);
                          } catch (error) {
                            console.error('❌ Fehler beim Quittieren der Benachrichtigung:', error);
                          }
                        }
                        
                        // Markiere auch lokal als gesehen
                        markAsSeen([notification.id]);
                        
                        // Prüfe ob tradeId gültig ist
                        if (!notification.tradeId || notification.tradeId === 0) {
                          console.error('❌ NotificationTab: Ungültige tradeId für Ausschreibungseinladung:', notification.tradeId);
                          alert('Die Ausschreibung konnte nicht gefunden werden. Die Benachrichtigung enthält ungültige Daten.');
                          return;
                        }
                        
                        // Event für ServiceProviderDashboard auslösen, um TradeDetailsModal zu öffnen
                        window.dispatchEvent(new CustomEvent('openTradeDetails', {
                          detail: {
                            tradeId: notification.tradeId,
                            source: 'tender_invitation_notification',
                            showQuoteForm: true
                          }
                        }));
                        
                        // Schließe Benachrichtigungs-Panel
                        setIsExpanded(false);
                      } else if (userRole === 'DIENSTLEISTER' && notification.type === 'acceptance_with_defects') {
                        // Öffne die betroffene Ausschreibung für Mängelbehebung
                        console.log('⚠️ Öffne Ausschreibung für Mängelbehebung:', notification.tradeId);
                        
                        // Markiere Benachrichtigung als quittiert (acknowledge) im Backend
                        if (notification.notification?.id) {
                          try {
                            await apiCall(`/notifications/${notification.notification.id}/acknowledge`, {
                              method: 'PATCH'
                            });
                            console.log('✅ Benachrichtigung als quittiert markiert:', notification.notification.id);
                            
                            // Lade Benachrichtigungen sofort neu, um UI zu aktualisieren
                            setTimeout(() => {
                              loadNotifications();
                            }, 500);
                          } catch (error) {
                            console.error('❌ Fehler beim Quittieren der Benachrichtigung:', error);
                          }
                        }
                        
                        // Markiere auch lokal als gesehen
                        markAsSeen([notification.id]);
                        
                        // Prüfe ob tradeId gültig ist
                        if (!notification.tradeId || notification.tradeId === 0) {
                          console.error('❌ NotificationTab: Ungültige tradeId für Abnahme unter Vorbehalt:', notification.tradeId);
                          alert('Die Ausschreibung konnte nicht gefunden werden. Die Benachrichtigung enthält ungültige Daten.');
                          return;
                        }
                        
                        // Event für ServiceProviderDashboard auslösen, um TradeDetailsModal zu öffnen
                        window.dispatchEvent(new CustomEvent('openTradeDetails', {
                          detail: {
                            tradeId: notification.tradeId,
                            source: 'acceptance_with_defects_notification',
                            showDefectsTab: true
                          }
                        }));
                        
                        // Schließe Benachrichtigungs-Panel
                        setIsExpanded(false);
                      } else if (userRole === 'DIENSTLEISTER' && notification.type === 'milestone_completed') {
                        // Öffne die betroffene Ausschreibung für Rechnungsstellung
                        console.log('💰 Öffne Ausschreibung für Rechnungsstellung:', notification.tradeId);
                        
                        // Markiere Benachrichtigung als quittiert (acknowledge) im Backend
                        if (notification.notification?.id) {
                          try {
                            await apiCall(`/notifications/${notification.notification.id}/acknowledge`, {
                              method: 'PATCH'
                            });
                            console.log('✅ Benachrichtigung als quittiert markiert:', notification.notification.id);
                            
                            // Lade Benachrichtigungen sofort neu, um UI zu aktualisieren
                            setTimeout(() => {
                              loadNotifications();
                            }, 500);
                          } catch (error) {
                            console.error('❌ Fehler beim Quittieren der Benachrichtigung:', error);
                          }
                        }
                        
                        // Markiere auch lokal als gesehen
                        markAsSeen([notification.id]);
                        
                        // Prüfe ob tradeId gültig ist
                        if (!notification.tradeId || notification.tradeId === 0) {
                          console.error('❌ NotificationTab: Ungültige tradeId für Gewerk-Abschluss:', notification.tradeId);
                          alert('Die Ausschreibung konnte nicht gefunden werden. Die Benachrichtigung enthält ungültige Daten.');
                          return;
                        }
                        
                        // Event für ServiceProviderDashboard auslösen, um TradeDetailsModal zu öffnen
                        window.dispatchEvent(new CustomEvent('openTradeDetails', {
                          detail: {
                            tradeId: notification.tradeId,
                            source: 'milestone_completed_notification',
                            showAcceptanceTab: true  // Öffne Abnahme-Tab für Rechnungsstellung
                          }
                        }));
                        
                        // Schließe Benachrichtigungs-Panel
                        setIsExpanded(false);
                      } else if (userRole === 'DIENSTLEISTER' && notification.type === 'payment_received') {
                        // Navigiere zur Rechnungsseite
                        console.log('💰 Öffne Rechnungsseite für bezahlte Rechnung:', notification.invoiceId);
                        
                        // Markiere Benachrichtigung als quittiert (acknowledge) im Backend
                        if (notification.notification?.id) {
                          try {
                            await apiCall(`/notifications/${notification.notification.id}/acknowledge`, {
                              method: 'PATCH'
                            });
                            console.log('✅ Benachrichtigung als quittiert markiert:', notification.notification.id);
                            
                            // Lade Benachrichtigungen sofort neu, um UI zu aktualisieren
                            setTimeout(() => {
                              loadNotifications();
                            }, 500);
                          } catch (error) {
                            console.error('❌ Fehler beim Quittieren der Benachrichtigung:', error);
                          }
                        }
                        
                        // Markiere auch lokal als gesehen
                        markAsSeen([notification.id]);
                        
                        // Navigiere zur Rechnungsseite
                        window.location.href = '/invoices';
                        
                        // Schließe Benachrichtigungs-Panel
                        setIsExpanded(false);
                      } else if (userRole === 'BAUTRAEGER' && notification.type === 'appointment_responses') {
                        // Zeige die Antworten der Dienstleister an
                        setSelectedNotification(notification);
                        // Setze permanenten Seen-Marker für Bauträger
                        const permanentSeenKey = `appointment_responses_${notification.appointmentId}_${userId}`;
                        localStorage.setItem(permanentSeenKey, JSON.stringify({
                          appointmentId: notification.appointmentId,
                          userId: userId,
                          viewedAt: new Date().toISOString()
                        }));
                        markAsSeen([notification.id]);
                      } else if (userRole === 'BAUTRAEGER' && notification.type === 'quote_submitted') {
                        // Öffne die betroffene Ausschreibung für Angebotsprüfung
                        console.log('📋 Öffne Ausschreibung für Angebotsprüfung:', notification.tradeId);
                        
                        // Markiere Benachrichtigung als quittiert (acknowledge) im Backend
                        if (notification.notification?.id) {
                          try {
                            await apiCall(`/notifications/${notification.notification.id}/acknowledge`, {
                              method: 'PATCH'
                            });
                            console.log('✅ Benachrichtigung als quittiert markiert:', notification.notification.id);
                            
                            // Lade Benachrichtigungen sofort neu, um UI zu aktualisieren
                            setTimeout(() => {
                              loadNotifications();
                            }, 500);
                          } catch (error) {
                            console.error('❌ Fehler beim Quittieren der Benachrichtigung:', error);
                          }
                        }
                        
                        // Markiere auch lokal als gesehen
                        markAsSeen([notification.id]);
                        
                        // Prüfe ob tradeId gültig ist
                        if (!notification.tradeId || notification.tradeId === 0) {
                          console.error('❌ NotificationTab: Ungültige tradeId für Angebot:', notification.tradeId);
                          alert('Die Ausschreibung konnte nicht gefunden werden. Die Benachrichtigung enthält ungültige Daten.');
                          return;
                        }
                        
                        // Event für BautraegerDashboard auslösen, um TradeDetailsModal zu öffnen
                        window.dispatchEvent(new CustomEvent('openTradeDetails', {
                          detail: {
                            tradeId: notification.tradeId,
                            source: 'quote_submitted_notification',
                            showQuotesTab: true
                          }
                        }));
                        
                        // Schließe Benachrichtigungs-Panel
                        setIsExpanded(false);
                      } else if (userRole === 'BAUTRAEGER' && notification.type === 'invoice_submitted') {
                        // Öffne die betroffene Ausschreibung im Abnahme-Tab
                        console.log('💰 Öffne Ausschreibung für Rechnungsprüfung:', notification.tradeId);
                        
                        // Markiere Benachrichtigung als quittiert (acknowledge) im Backend
                        if (notification.notification?.id) {
                          try {
                            await apiCall(`/notifications/${notification.notification.id}/acknowledge`, {
                              method: 'PATCH'
                            });
                            console.log('✅ Benachrichtigung als quittiert markiert:', notification.notification.id);
                            
                            // Lade Benachrichtigungen sofort neu, um UI zu aktualisieren
                            setTimeout(() => {
                              loadNotifications();
                            }, 500);
                          } catch (error) {
                            console.error('❌ Fehler beim Quittieren der Benachrichtigung:', error);
                          }
                        }
                        
                        // Markiere auch lokal als gesehen
                        markAsSeen([notification.id]);
                        
                        // Prüfe ob tradeId gültig ist
                        if (!notification.tradeId || notification.tradeId === 0) {
                          console.error('❌ NotificationTab: Ungültige tradeId für Rechnung:', notification.tradeId);
                          alert('Die Ausschreibung konnte nicht gefunden werden. Die Benachrichtigung enthält ungültige Daten.');
                          return;
                        }
                        
                        // Event für BautraegerDashboard auslösen, um TradeDetailsModal zu öffnen
                        window.dispatchEvent(new CustomEvent('openTradeDetails', {
                          detail: {
                            tradeId: notification.tradeId,
                            source: 'invoice_submitted_notification',
                            showAcceptanceTab: true  // Öffne Abnahme-Tab wo die Rechnung ist
                          }
                        }));
                        
                        // Schließe Benachrichtigungs-Panel
                        setIsExpanded(false);
                      } else if (userRole === 'BAUTRAEGER' && notification.type === 'service_provider_selection_reminder') {
                        // Navigiere zur Gewerke-Seite
                        window.location.href = '/quotes';
                        markAsSeen([notification.id]);
                      }
                      if (!notification.isNew) {
                        markAsSeen([notification.id]);
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
                            className="hover:bg-red-500/20 rounded-full p-1 transition-colors"
                            title="Benachrichtigung löschen"
                          >
                            <Trash2 size={14} className="text-red-400 hover:text-red-300" />
                          </button>
                        </div>
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 mt-1">
                            {notification.type === 'appointment_invitation' ? (
                              <Calendar size={16} className="text-orange-500" />
                            ) : notification.type === 'quote_accepted' ? (
                              <CheckCircle size={16} className="text-green-500" />
                            ) : notification.type === 'quote_submitted' ? (
                              <FileText size={16} className="text-blue-500" />
                            ) : notification.type === 'invoice_submitted' ? (
                              <FileText size={16} className="text-green-500" />
                            ) : notification.type === 'resource_allocated' ? (
                              <User size={16} className="text-purple-500" />
                            ) : notification.type === 'tender_invitation' ? (
                              <AlertCircle size={16} className="text-red-500 animate-pulse" />
                            ) : notification.type === 'acceptance_with_defects' ? (
                              <AlertCircle size={16} className="text-yellow-500 animate-pulse" />
                            ) : notification.type === 'milestone_completed' ? (
                              <CheckCircle size={16} className="text-green-500 animate-pulse" />
                            ) : notification.type === 'payment_received' ? (
                              <CreditCard size={16} className="text-green-500 animate-pulse" />
                            ) : notification.type === 'service_provider_selection_reminder' ? (
                              <AlertCircle size={16} className="text-orange-400 animate-pulse" />
                            ) : notification.type === 'quote_submitted' && userRole === 'BAUTRAEGER' ? (
                              <FileText size={16} className="text-green-500 animate-pulse" />
                            ) : (
                              <MessageSquare size={16} className="text-orange-500" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-white mb-1">
                              {notification.title}
                            </h4>
                            <p className="text-sm text-gray-200 mb-2">
                              {notification.message}
                            </p>
                            
                            <div className="flex items-center gap-4 text-sm text-gray-300">
                              {notification.scheduledDate && (
                                <>
                                  <div className="flex items-center gap-1">
                                    <Calendar size={12} />
                                    {formatDate(notification.scheduledDate)}
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Clock size={12} />
                                    {formatTime(notification.scheduledDate)}
                                  </div>
                                </>
                              )}
                              {notification.location && (
                                <div className="flex items-center gap-1">
                                  <MapPin size={12} />
                                  {notification.location}
                                </div>
                              )}
                            </div>
                            
                            {/* Zusätzliche Informationen für quote_submitted */}
                            {notification.type === 'quote_submitted' && notification.quoteSummary && (
                              <div className="mt-3 p-3 bg-blue-500/10 rounded-lg border border-blue-500/20 backdrop-blur-sm">
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                  <div>
                                    <span className="text-gray-200">Angebotssumme:</span>
                                    <div className="font-semibold text-blue-400">
                                      {new Intl.NumberFormat('de-DE', { 
                                        style: 'currency', 
                                        currency: notification.quoteSummary.currency || 'CHF' 
                                      }).format(notification.quoteSummary.amount || 0)}
                                    </div>
                                  </div>
                                  {notification.quoteSummary.validUntil && (
                                    <div>
                                      <span className="text-gray-200">Gültig bis:</span>
                                      <div className="font-semibold text-gray-100">
                                        {new Date(notification.quoteSummary.validUntil).toLocaleDateString('de-DE')}
                                      </div>
                                    </div>
                                  )}
                                  {notification.quoteSummary.startDate && (
                                    <div>
                                      <span className="text-gray-200">Start:</span>
                                      <div className="font-semibold text-gray-100">
                                        {new Date(notification.quoteSummary.startDate).toLocaleDateString('de-DE')}
                                      </div>
                                    </div>
                                  )}
                                  {notification.quoteSummary.completionDate && (
                                    <div>
                                      <span className="text-gray-200">Fertigstellung:</span>
                                      <div className="font-semibold text-gray-100">
                                        {new Date(notification.quoteSummary.completionDate).toLocaleDateString('de-DE')}
                                      </div>
                                    </div>
                                  )}
                                </div>
                                <div className="mt-2 text-xs text-blue-600 font-medium">
                                  👆 Klicken Sie hier, um die Ausschreibung zu öffnen
                                </div>
                              </div>
                            )}

                            {/* Zusätzliche Informationen für resource_allocated */}
                            {notification.type === 'resource_allocated' && (
                              <div className="mt-3 p-3 bg-purple-500/10 rounded-lg border border-purple-500/20 backdrop-blur-sm">
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                  {notification.tradeTitle && (
                                    <div>
                                      <span className="text-gray-200">Gewerk:</span>
                                      <div className="font-semibold text-purple-400">
                                        {notification.tradeTitle}
                                      </div>
                                    </div>
                                  )}
                                  {notification.projectName && (
                                    <div>
                                      <span className="text-gray-200">Projekt:</span>
                                      <div className="font-semibold text-purple-400">
                                        {notification.projectName}
                                      </div>
                                    </div>
                                  )}
                                  <div>
                                    <span className="text-gray-200">Bauträger:</span>
                                    <div className="font-semibold text-gray-100">
                                      {notification.bautraegerName}
                                    </div>
                                  </div>
                                  {notification.allocatedStartDate && (
                                    <div>
                                      <span className="text-gray-200">Start:</span>
                                      <div className="font-semibold text-gray-100">
                                        {new Date(notification.allocatedStartDate).toLocaleDateString('de-DE')}
                                      </div>
                                    </div>
                                  )}
                                  {notification.allocatedEndDate && (
                                    <div>
                                      <span className="text-gray-200">Ende:</span>
                                      <div className="font-semibold text-gray-100">
                                        {new Date(notification.allocatedEndDate).toLocaleDateString('de-DE')}
                                      </div>
                                    </div>
                                  )}
                                  {notification.allocatedPersonCount && (
                                    <div>
                                      <span className="text-gray-200">Personen:</span>
                                      <div className="font-semibold text-gray-100">
                                        {notification.allocatedPersonCount}
                                      </div>
                                    </div>
                                  )}
                                </div>
                                <div className="mt-2 text-xs text-purple-600 font-medium">
                                  👆 Klicken Sie hier, um zur Ressourcenverwaltung zu gelangen
                                </div>
                              </div>
                            )}

                            {/* Zusätzliche Informationen für tender_invitation */}
                            {notification.type === 'tender_invitation' && (
                              <div className="mt-3 p-3 bg-red-50 rounded-lg border border-red-200">
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                  <div>
                                    <span className="text-gray-200">Projekt:</span>
                                    <div className="font-semibold text-red-600">
                                      {notification.projectName || 'Unbekanntes Projekt'}
                                    </div>
                                  </div>
                                  <div>
                                    <span className="text-gray-200">Bauträger:</span>
                                    <div className="font-semibold text-gray-100">
                                      {notification.bautraegerName}
                                    </div>
                                  </div>
                                  {notification.deadline && (
                                    <div className="col-span-2">
                                      <span className="text-gray-200">Abgabefrist:</span>
                                      <div className="font-semibold text-red-600">
                                        {new Date(notification.deadline).toLocaleDateString('de-DE')} um {new Date(notification.deadline).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
                                      </div>
                                    </div>
                                  )}
                                  {notification.allocatedStartDate && (
                                    <div>
                                      <span className="text-gray-200">Start:</span>
                                      <div className="font-semibold text-gray-100">
                                        {new Date(notification.allocatedStartDate).toLocaleDateString('de-DE')}
                                      </div>
                                    </div>
                                  )}
                                  {notification.allocatedEndDate && (
                                    <div>
                                      <span className="text-gray-200">Ende:</span>
                                      <div className="font-semibold text-gray-100">
                                        {new Date(notification.allocatedEndDate).toLocaleDateString('de-DE')}
                                      </div>
                                    </div>
                                  )}
                                </div>
                                <div className="mt-2 text-xs text-red-600 font-medium">
                                  🚨 Klicken Sie hier, um ein Angebot abzugeben
                                </div>
                              </div>
                            )}

                            {/* Zusätzliche Informationen für acceptance_with_defects */}
                            {notification.type === 'acceptance_with_defects' && (
                              <div className="mt-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                  <div>
                                    <span className="text-gray-200">Projekt:</span>
                                    <div className="font-semibold text-yellow-600">
                                      {notification.projectName || 'Unbekanntes Projekt'}
                                    </div>
                                  </div>
                                  <div>
                                    <span className="text-gray-200">Bauträger:</span>
                                    <div className="font-semibold text-gray-100">
                                      {notification.bautraegerName}
                                    </div>
                                  </div>
                                  <div className="col-span-2">
                                    <span className="text-gray-200">Status:</span>
                                    <div className="font-semibold text-yellow-600">
                                      Abnahme unter Vorbehalt
                                    </div>
                                  </div>
                                </div>
                                <div className="mt-2 text-xs text-yellow-600 font-medium">
                                  ⚠️ Klicken Sie hier, um die Mängel zu überprüfen und zu beheben
                                </div>
                              </div>
                            )}

                            {/* Zusätzliche Informationen für milestone_completed */}
                            {notification.type === 'milestone_completed' && (
                              <div className="mt-3 p-3 bg-green-500/10 rounded-lg border border-green-500/20 backdrop-blur-sm">
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                  <div>
                                    <span className="text-gray-200">Gewerk:</span>
                                    <div className="font-semibold text-green-400">
                                      {notification.tradeTitle || 'Unbekanntes Gewerk'}
                                    </div>
                                  </div>
                                  <div>
                                    <span className="text-gray-200">Projekt:</span>
                                    <div className="font-semibold text-green-400">
                                      {notification.projectName || 'Unbekanntes Projekt'}
                                    </div>
                                  </div>
                                  {notification.completionDate && (
                                    <div>
                                      <span className="text-gray-200">Abgeschlossen:</span>
                                      <div className="font-semibold text-gray-100">
                                        {new Date(notification.completionDate).toLocaleDateString('de-DE')}
                                      </div>
                                    </div>
                                  )}
                                  {notification.quoteAmount && (
                                    <div>
                                      <span className="text-gray-200">Angebotssumme:</span>
                                      <div className="font-semibold text-gray-100">
                                        {new Intl.NumberFormat('de-DE', { 
                                          style: 'currency', 
                                          currency: notification.currency || 'CHF' 
                                        }).format(notification.quoteAmount)}
                                      </div>
                                    </div>
                                  )}
                                </div>
                                <div className="mt-2 text-xs text-green-600 font-medium">
                                  💰 Klicken Sie hier, um zur Rechnungsstellung zu gelangen
                                </div>
                              </div>
                            )}

                            {/* Zusätzliche Informationen für payment_received (Dienstleister) */}
                            {notification.type === 'payment_received' && userRole === 'DIENSTLEISTER' && (
                              <div className="mt-3 p-3 bg-green-500/10 rounded-lg border border-green-500/20 backdrop-blur-sm">
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                  <div>
                                    <span className="text-gray-200">Rechnungsnummer:</span>
                                    <div className="font-semibold text-green-400">
                                      {notification.invoiceNumber || 'N/A'}
                                    </div>
                                  </div>
                                  <div>
                                    <span className="text-gray-200">Gewerk:</span>
                                    <div className="font-semibold text-green-400">
                                      {notification.tradeTitle || 'Unbekanntes Gewerk'}
                                    </div>
                                  </div>
                                  <div>
                                    <span className="text-gray-200">Projekt:</span>
                                    <div className="font-semibold text-green-400">
                                      {notification.projectName || 'Unbekanntes Projekt'}
                                    </div>
                                  </div>
                                  <div>
                                    <span className="text-gray-200">Bauträger:</span>
                                    <div className="font-semibold text-gray-300">
                                      {notification.bautraegerName || 'Unbekannt'}
                                    </div>
                                  </div>
                                  <div>
                                    <span className="text-gray-200">Betrag:</span>
                                    <div className="font-semibold text-green-400">
                                      {new Intl.NumberFormat('de-DE', { 
                                        style: 'currency', 
                                        currency: notification.currency || 'CHF' 
                                      }).format(notification.totalAmount || 0)}
                                    </div>
                                  </div>
                                  {notification.paidAt && (
                                    <div>
                                      <span className="text-gray-200">Bezahlt am:</span>
                                      <div className="font-semibold text-gray-300">
                                        {new Date(notification.paidAt).toLocaleDateString('de-DE')}
                                      </div>
                                    </div>
                                  )}
                                  {notification.paymentReference && (
                                    <div className="col-span-2">
                                      <span className="text-gray-200">Zahlungsreferenz:</span>
                                      <div className="font-semibold text-gray-300">
                                        {notification.paymentReference}
                                      </div>
                                    </div>
                                  )}
                                </div>
                                <div className="mt-2 text-xs text-green-600 font-medium">
                                  💰 Klicken Sie hier, um zur Rechnungsübersicht zu gelangen
                                </div>
                              </div>
                            )}

                            {/* Zusätzliche Informationen für invoice_submitted (Bauträger) */}
                            {notification.type === 'invoice_submitted' && userRole === 'BAUTRAEGER' && (
                              <div className="mt-3 p-3 bg-green-500/10 rounded-lg border border-green-500/20 backdrop-blur-sm">
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                  <div>
                                    <span className="text-gray-200">Gewerk:</span>
                                    <div className="font-semibold text-green-400">
                                      {notification.tradeTitle || 'Unbekanntes Gewerk'}
                                    </div>
                                  </div>
                                  <div>
                                    <span className="text-gray-200">Projekt:</span>
                                    <div className="font-semibold text-green-400">
                                      {notification.projectName || 'Unbekanntes Projekt'}
                                    </div>
                                  </div>
                                  <div>
                                    <span className="text-gray-200">Dienstleister:</span>
                                    <div className="font-semibold text-gray-300">
                                      {notification.serviceProviderName || 'Unbekannt'}
                                    </div>
                                  </div>
                                  <div>
                                    <span className="text-gray-200">Rechnungsnummer:</span>
                                    <div className="font-semibold text-gray-300">
                                      {notification.invoiceNumber || 'N/A'}
                                    </div>
                                  </div>
                                  {notification.totalAmount && (
                                    <div>
                                      <span className="text-gray-200">Betrag:</span>
                                      <div className="font-semibold text-green-400 text-base">
                                        {new Intl.NumberFormat('de-DE', { 
                                          style: 'currency', 
                                          currency: notification.currency || 'CHF' 
                                        }).format(notification.totalAmount)}
                                      </div>
                                    </div>
                                  )}
                                  {notification.dueDate && (
                                    <div>
                                      <span className="text-gray-200">Fällig am:</span>
                                      <div className="font-semibold text-yellow-400">
                                        {new Date(notification.dueDate).toLocaleDateString('de-DE')}
                                      </div>
                                    </div>
                                  )}
                                </div>
                                <div className="mt-2 text-xs text-green-400 font-medium">
                                  💳 Klicken Sie hier, um die Rechnung zu prüfen und zu bezahlen
                                </div>
                              </div>
                            )}

                            {/* Zusätzliche Informationen für quote_submitted (Bauträger) */}
                            {notification.type === 'quote_submitted' && userRole === 'BAUTRAEGER' && notification.quoteSummary && (
                              <div className="mt-3 p-3 bg-green-500/10 rounded-lg border border-green-500/20 backdrop-blur-sm">
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                  <div>
                                    <span className="text-gray-200">Angebotssumme:</span>
                                    <div className="font-semibold text-green-400">
                                      {new Intl.NumberFormat('de-DE', { 
                                        style: 'currency', 
                                        currency: notification.quoteSummary.currency || 'CHF' 
                                      }).format(notification.quoteSummary.amount || 0)}
                                    </div>
                                  </div>
                                  {notification.quoteSummary.validUntil && (
                                    <div>
                                      <span className="text-gray-200">Gültig bis:</span>
                                      <div className="font-semibold text-gray-100">
                                        {new Date(notification.quoteSummary.validUntil).toLocaleDateString('de-DE')}
                                      </div>
                                    </div>
                                  )}
                                  {notification.quoteSummary.startDate && (
                                    <div>
                                      <span className="text-gray-200">Start:</span>
                                      <div className="font-semibold text-gray-100">
                                        {new Date(notification.quoteSummary.startDate).toLocaleDateString('de-DE')}
                                      </div>
                                    </div>
                                  )}
                                  {notification.quoteSummary.completionDate && (
                                    <div>
                                      <span className="text-gray-200">Fertigstellung:</span>
                                      <div className="font-semibold text-gray-100">
                                        {new Date(notification.quoteSummary.completionDate).toLocaleDateString('de-DE')}
                                      </div>
                                    </div>
                                  )}
                                </div>
                                <div className="mt-2 text-xs text-green-600 font-medium">
                                  👆 Klicken Sie hier, um das Angebot zu prüfen und zu bewerten
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {notification.isNew && (
                        <div className="flex-shrink-0 ml-2">
                          <div className="animate-pulse">
                            <AlertCircle size={16} className="text-orange-500" />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Response Modal for Dienstleister */}
      {selectedNotification && userRole === 'DIENSTLEISTER' && selectedNotification.type === 'appointment_invitation' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[200] p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-orange-600 to-yellow-600 text-white p-6 rounded-t-xl">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Auf Termineinladung antworten</h3>
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
              
              {/* Appointment Details */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h4 className="font-medium text-gray-900 mb-3">{selectedNotification.title}</h4>
                
                {/* Beschreibung falls vorhanden */}
                {selectedNotification.description && (
                  <p className="text-sm text-gray-600 mb-3 italic">
                    {selectedNotification.description}
                  </p>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                  {/* Datum und Zeit */}
                  {selectedNotification.scheduledDate && (
                    <div className="flex items-center gap-2">
                      <Calendar size={16} className="text-blue-500" />
                      <div>
                        <span className="text-gray-200">Datum:</span>
                        <br />
                        {formatDate(selectedNotification.scheduledDate)} um {formatTime(selectedNotification.scheduledDate)}
                      </div>
                    </div>
                  )}
                  
                  {/* Dauer */}
                  {selectedNotification.duration_minutes && (
                    <div className="flex items-center gap-2">
                      <Clock size={16} className="text-green-500" />
                      <div>
                        <span className="text-gray-200">Dauer:</span>
                        <br />
                        {selectedNotification.duration_minutes} Minuten
                      </div>
                    </div>
                  )}
                  
                  {/* Adresse */}
                  {selectedNotification.location && (
                    <div className="flex items-center gap-2 md:col-span-2">
                      <MapPin size={16} className="text-red-500" />
                      <div className="flex-1">
                        <span className="text-gray-200">Adresse:</span>
                        <br />
                        {selectedNotification.location}
                      </div>
                    </div>
                  )}
                  
                  {/* Zusätzliche Ortsangaben */}
                  {selectedNotification.location_details && (
                    <div className="flex items-start gap-2 md:col-span-2">
                      <MapPin size={16} className="text-orange-500 mt-0.5" />
                      <div className="flex-1">
                        <span className="text-gray-200">Zusätzliche Ortsangaben:</span>
                        <br />
                        {selectedNotification.location_details}
                      </div>
                    </div>
                  )}
                  
                  {/* Ansprechpartner */}
                  {selectedNotification.contact_person && (
                    <div className="flex items-center gap-2">
                      <User size={16} className="text-purple-500" />
                      <div>
                        <span className="text-gray-200">Ansprechpartner:</span>
                        <br />
                        {selectedNotification.contact_person}
                      </div>
                    </div>
                  )}
                  
                  {/* Telefonnummer */}
                  {selectedNotification.contact_phone && (
                    <div className="flex items-center gap-2">
                      <Phone size={16} className="text-indigo-500" />
                      <div>
                        <span className="text-gray-200">Telefonnummer:</span>
                        <br />
                        <a href={`tel:${selectedNotification.contact_phone}`} className="text-indigo-600 hover:underline">
                          {selectedNotification.contact_phone}
                        </a>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Vorbereitungshinweise für Dienstleister */}
                {selectedNotification.preparation_notes && (
                  <div className="mt-4 p-3 bg-yellow-50 border-l-4 border-yellow-400 rounded">
                    <div className="flex items-start gap-2">
                      <FileText size={16} className="text-yellow-600 mt-0.5" />
                      <div>
                        <span className="text-sm font-medium text-yellow-800">Vorbereitungshinweise für Dienstleister:</span>
                        <p className="text-sm text-yellow-700 mt-1">
                          {selectedNotification.preparation_notes}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-100 mb-2">
                  Nachricht (optional)
                </label>
                <textarea
                  value={responseMessage}
                  onChange={(e) => setResponseMessage(e.target.value)}
                  placeholder="Ihre Nachricht..."
                  className="w-full p-3 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  rows={3}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 mt-6">
                <button
                  onClick={() => setSelectedNotification(null)}
                  disabled={loading}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors disabled:opacity-50"
                >
                  Abbrechen
                </button>
                
                <button
                  onClick={() => handleResponse('accepted')}
                  disabled={loading}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <Check size={16} />
                  )}
                  Zusagen
                </button>
                
                <button
                  onClick={() => handleResponse('rejected')}
                  disabled={loading}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  <X size={16} />
                  Absagen
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Response Display Modal for Bauträger */}
      {selectedNotification && userRole === 'BAUTRAEGER' && selectedNotification.type === 'appointment_responses' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[200] p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 rounded-t-xl">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Antworten der Dienstleister</h3>
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
              
              {/* Appointment Details */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h4 className="font-medium text-gray-900 mb-3">{selectedNotification.title}</h4>
                
                {/* Beschreibung falls vorhanden */}
                {selectedNotification.description && (
                  <p className="text-sm text-gray-600 mb-3 italic">
                    {selectedNotification.description}
                  </p>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                  {/* Datum und Zeit */}
                  {selectedNotification.scheduledDate && (
                    <div className="flex items-center gap-2">
                      <Calendar size={16} className="text-blue-500" />
                      <div>
                        <span className="text-gray-200">Datum:</span>
                        <br />
                        {formatDate(selectedNotification.scheduledDate)} um {formatTime(selectedNotification.scheduledDate)}
                      </div>
                    </div>
                  )}
                  
                  {/* Dauer */}
                  {selectedNotification.duration_minutes && (
                    <div className="flex items-center gap-2">
                      <Clock size={16} className="text-green-500" />
                      <div>
                        <span className="text-gray-200">Dauer:</span>
                        <br />
                        {selectedNotification.duration_minutes} Minuten
                      </div>
                    </div>
                  )}
                  
                  {/* Adresse */}
                  {selectedNotification.location && (
                    <div className="flex items-center gap-2 md:col-span-2">
                      <MapPin size={16} className="text-red-500" />
                      <div className="flex-1">
                        <span className="text-gray-200">Adresse:</span>
                        <br />
                        {selectedNotification.location}
                      </div>
                    </div>
                  )}
                  
                  {/* Zusätzliche Ortsangaben */}
                  {selectedNotification.location_details && (
                    <div className="flex items-start gap-2 md:col-span-2">
                      <MapPin size={16} className="text-orange-500 mt-0.5" />
                      <div className="flex-1">
                        <span className="text-gray-200">Zusätzliche Ortsangaben:</span>
                        <br />
                        {selectedNotification.location_details}
                      </div>
                    </div>
                  )}
                  
                  {/* Ansprechpartner */}
                  {selectedNotification.contact_person && (
                    <div className="flex items-center gap-2">
                      <User size={16} className="text-purple-500" />
                      <div>
                        <span className="text-gray-200">Ansprechpartner:</span>
                        <br />
                        {selectedNotification.contact_person}
                      </div>
                    </div>
                  )}
                  
                  {/* Telefonnummer */}
                  {selectedNotification.contact_phone && (
                    <div className="flex items-center gap-2">
                      <Phone size={16} className="text-indigo-500" />
                      <div>
                        <span className="text-gray-200">Telefonnummer:</span>
                        <br />
                        <a href={`tel:${selectedNotification.contact_phone}`} className="text-indigo-600 hover:underline">
                          {selectedNotification.contact_phone}
                        </a>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Vorbereitungshinweise für Dienstleister */}
                {selectedNotification.preparation_notes && (
                  <div className="mt-4 p-3 bg-yellow-50 border-l-4 border-yellow-400 rounded">
                    <div className="flex items-start gap-2">
                      <FileText size={16} className="text-yellow-600 mt-0.5" />
                      <div>
                        <span className="text-sm font-medium text-yellow-800">Vorbereitungshinweise für Dienstleister:</span>
                        <p className="text-sm text-yellow-700 mt-1">
                          {selectedNotification.preparation_notes}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Dienstleister-Antworten */}
              <div>
                <h5 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <MessageSquare size={16} className="text-blue-500" />
                  Antworten der Dienstleister ({selectedNotification.responses?.length || 0})
                </h5>

                <div className="space-y-4">
                  {selectedNotification.responses && selectedNotification.responses.length > 0 ? (
                    selectedNotification.responses.map((response: any, index: number) => (
                      <div
                        key={`notification-response-${selectedNotification.id}-${index}`}
                        className={`p-4 rounded-lg border-2 ${
                          response.status === 'accepted'
                            ? 'border-green-200 bg-green-50'
                            : response.status === 'rejected'
                            ? 'border-red-200 bg-red-50'
                            : 'border-yellow-200 bg-yellow-50'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="font-medium text-gray-900">
                            Dienstleister #{response.service_provider_id}
                          </div>
                          <span
                            className={`px-3 py-1 rounded-full text-sm font-medium ${
                              response.status === 'accepted'
                                ? 'bg-green-100 text-green-800'
                                : response.status === 'rejected'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}
                          >
                            {response.status === 'accepted'
                              ? 'Zugesagt'
                              : response.status === 'rejected'
                              ? 'Abgesagt'
                              : 'Alternativtermin vorgeschlagen'}
                          </span>
                        </div>

                        {/* Nachricht vom Dienstleister */}
                        {response.message && (
                          <div className="mt-3 p-3 bg-white border border-gray-200 rounded">
                            <div className="flex items-start gap-2">
                              <MessageSquare size={14} className="text-blue-500 mt-0.5" />
                              <div>
                                <span className="text-sm font-medium text-gray-100">Nachricht:</span>
                                <p className="text-sm text-gray-600 mt-1 font-medium bg-blue-50 p-2 rounded border-l-3 border-blue-400">
                                  {response.message}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Alternativtermin-Vorschlag */}
                        {response.suggested_date && (
                          <div className="mt-3 p-3 bg-white border border-orange-200 rounded">
                            <div className="flex items-start gap-2">
                              <Calendar size={14} className="text-orange-500 mt-0.5" />
                              <div>
                                <span className="text-sm font-medium text-gray-100">Alternativtermin:</span>
                                <p className="text-sm text-orange-700 mt-1 font-medium">
                                  {new Date(response.suggested_date).toLocaleDateString('de-DE', {
                                    weekday: 'long',
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                  })} um {new Date(response.suggested_date).toLocaleTimeString('de-DE', {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Antwortzeit */}
                        {response.responded_at && (
                          <div className="mt-2 text-xs text-gray-200">
                            Geantwortet am: {new Date(response.responded_at).toLocaleDateString('de-DE')} um {new Date(response.responded_at).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-200">
                      <MessageSquare size={32} className="mx-auto mb-2 opacity-50" />
                      <p>Noch keine Antworten erhalten</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 justify-end mt-6">
                <button
                  onClick={() => setSelectedNotification(null)}
                  className="px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors"
                >
                  Schließen
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quote Accepted Modal for Dienstleister */}
      {selectedNotification && userRole === 'DIENSTLEISTER' && selectedNotification.type === 'quote_accepted' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[200] p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white p-6 rounded-t-xl">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Angebot angenommen!</h3>
                <button 
                  onClick={async () => {
                    setSelectedNotification(null);
                    // Markiere Benachrichtigung als acknowledged
                    if (selectedNotification.notification) {
                      try {
                        await apiCall(`/notifications/${selectedNotification.notification.id}/acknowledge`, {
                          method: 'PATCH'
                        });
                      } catch (error) {
                        console.error('Fehler beim Bestätigen der Benachrichtigung:', error);
                      }
                    }
                  }}
                  className="hover:bg-white/20 rounded-full p-1 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              
              {/* Quote Accepted Details */}
              <div className="bg-green-50 rounded-lg p-4 mb-6">
                <div className="flex items-center gap-3 mb-3">
                  <CheckCircle size={24} className="text-green-500" />
                  <h4 className="font-medium text-gray-900">{selectedNotification.title}</h4>
                </div>
                
                <p className="text-sm text-gray-100 mb-3">{selectedNotification.message}</p>
                
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <Clock size={16} />
                    Angenommen am {new Date(selectedNotification.timestamp).toLocaleDateString('de-DE', {
                      day: '2-digit',
                      month: '2-digit', 
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                  {selectedNotification.notification?.related_quote_id && (
                    <div className="flex items-center gap-2">
                      <FileText size={16} />
                      Angebot-ID: {selectedNotification.notification.related_quote_id}
                    </div>
                  )}
                  {selectedNotification.notification?.related_project_id && (
                    <div className="flex items-center gap-2">
                      <FileText size={16} />
                      Projekt-ID: {selectedNotification.notification.related_project_id}
                    </div>
                  )}
                </div>
              </div>

              {/* Next Steps */}
              <div className="bg-blue-50 rounded-lg p-4 mb-6">
                <h5 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                  <AlertCircle size={16} className="text-blue-500" />
                  Nächste Schritte
                </h5>
                <ul className="text-sm text-gray-100 space-y-1">
                  <li>• Kontaktdaten des Bauträgers sind nun freigeschaltet</li>
                  <li>• Sie können mit der Projektplanung beginnen</li>
                  <li>• Vereinbaren Sie einen Starttermin</li>
                  <li>• Dokumentieren Sie den Fortschritt regelmäßig</li>
                </ul>
              </div>
              
              {/* Action Buttons */}
              <div className="flex justify-center">
                <button
                  onClick={async () => {
                    setSelectedNotification(null);
                    // Markiere als acknowledged
                    if (selectedNotification.notification) {
                      try {
                        await apiCall(`/notifications/${selectedNotification.notification.id}/acknowledge`, {
                          method: 'PATCH'
                        });
                      } catch (error) {
                        console.error('Fehler beim Bestätigen der Benachrichtigung:', error);
                      }
                    }
                  }}
                  className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors font-medium"
                >
                  Verstanden
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
} 
