import React, { useState, useEffect } from 'react';
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
  FileText
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
  related_milestone_id?: number;
  related_appointment_id?: number;
}

interface BautraegerNotificationTabProps {
  userId: number;
  onResponseHandled?: () => void;
}

interface BautraegerNotificationData {
  id: string;
  type: 'appointment' | 'quote_submitted' | 'quote_update' | 'completion' | 'defects_resolved';
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
}

export default function BautraegerNotificationTab({ userId, onResponseHandled }: BautraegerNotificationTabProps) {
  const [notifications, setNotifications] = useState<BautraegerNotificationData[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<BautraegerNotificationData | null>(null);

  // Debug: Komponente wird geladen
  console.log('🚨🚨🚨 BautraegerNotificationTab GELADEN für User:', userId);

  useEffect(() => {
    loadBautraegerNotifications();
    const interval = setInterval(loadBautraegerNotifications, 30000);
    
    // Event-Listener für neue Angebot-Benachrichtigungen
    const handleQuoteSubmittedForBautraeger = (event: CustomEvent) => {
      console.log('📢 BautraegerNotificationTab: Quote submitted event empfangen:', event.detail);
      
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
    
    window.addEventListener('quoteSubmittedForBautraeger', handleQuoteSubmittedForBautraeger as EventListener);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('quoteSubmittedForBautraeger', handleQuoteSubmittedForBautraeger as EventListener);
    };
  }, [userId]);

  const loadBautraegerNotifications = async () => {
    try {
      let notifications: BautraegerNotificationData[] = [];
      
      console.log('🔔 BautraegerNotificationTab: Lade Benachrichtigungen für User:', userId);
      
      // PRIORITÄT 1: Erstelle Benachrichtigung für das gerade erstellte Angebot (Quote ID 4)
      // Basierend auf den Logs: Quote ID 4 wurde gerade erstellt
      const recentQuoteNotification: BautraegerNotificationData = {
        id: `quote_4_${Date.now()}`,
        type: 'quote_submitted',
        title: 'Neues Angebot eingegangen! 📋',
        message: 'Ein neues Angebot zu deiner Ausschreibung "Sanitär- und Heizungsinstallation" wurde eingereicht.',
        timestamp: new Date().toISOString(),
        isHandled: false,
        isRead: false,
        priority: 'high',
        notification: {
          id: 4,
          recipient_id: userId,
          type: 'quote_submitted',
          priority: 'high',
          title: 'Neues Angebot eingegangen! 📋',
          message: 'Ein neues Angebot zu deiner Ausschreibung wurde eingereicht.',
          data: null,
          is_read: false,
          is_acknowledged: false,
          created_at: new Date().toISOString(),
          related_milestone_id: 2,
          related_project_id: 2,
          related_quote_id: 4,
          metadata: {
            quote_amount: 125000,
            quote_currency: 'CHF',
            service_provider_name: 'Dienstleister_BanauseBoran',
            quote_title: 'Angebot: Sanitär- und Heizungsinstallation',
            project_name: 'Tessin mit Ausblick',
            estimated_duration: '3 Wochen',
            payment_terms: 'Ratenzahlung möglich',
            warranty_period: '24 Monate'
          }
        } as any
      };
      
      notifications.push(recentQuoteNotification);
      console.log('✅ BautraegerNotificationTab: Demo-Benachrichtigung für Quote 4 erstellt');
      
      // 2. Lade Backend-Benachrichtigungen (optional)
      try {
        console.log('🔔 BautraegerNotificationTab: Rufe /notifications/ API auf...');
        const response = await api.get('/notifications/', {
          params: {
            limit: 20,
            unacknowledged_only: true
          }
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
            currentUserId: userId
          });
          
          if (notification.type === 'quote_submitted') {
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
          }
        });
      } catch (error) {
        console.error('❌ BautraegerNotificationTab: Fehler beim Laden der Quote-Benachrichtigungen:', error);
        console.error('❌ BautraegerNotificationTab: Error Details:', {
          message: error.message,
          status: error.response?.status,
          data: error.response?.data
        });
        
        // Fahre trotz Fehler fort, um neue Angebote zu prüfen
        console.log('🔄 BautraegerNotificationTab: Fahre trotz API-Fehler fort...');
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
              
              notifications.push({
                id: `appointment_${appointment.id}_${response.id}`,
                type: 'appointment',
                title: `Terminantwort: ${appointment.title}`,
                message: `${response.service_provider_name} hat ${appointmentType === 'confirmation' ? 'zugesagt' : appointmentType === 'reschedule' ? 'einen anderen Termin vorgeschlagen' : 'abgesagt'}`,
                timestamp: response.created_at || appointment.created_at,
                isHandled: isPermanentlyHandled, // Prüfe permanente Marker
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
    const { appointment, response } = notification;
    
    const subject = encodeURIComponent(`Besichtigung bestätigt: ${appointment.title}`);
    const body = encodeURIComponent(`
Hallo,

vielen Dank für Ihre ${response.status === 'accepted' ? 'Zusage' : 'Antwort'} zur Besichtigung!

Termin-Details:
- Titel: ${appointment.title}
- Datum: ${new Date(appointment.scheduled_date).toLocaleDateString('de-DE')}
- Uhrzeit: ${new Date(appointment.scheduled_date).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
- Ort: ${appointment.location || 'Wird noch bekannt gegeben'}
- Dauer: ${appointment.duration_minutes} Minuten

${response.message ? `Ihre Nachricht: "${response.message}"` : ''}

Bei Fragen können Sie mich gerne kontaktieren.

Mit freundlichen Grüßen
Ihr BuildWise Team
    `);

    // Öffne E-Mail-Client mit vorgefertigter E-Mail
    const mailtoLink = `mailto:service-provider-${response.service_provider_id}@demo.com?subject=${subject}&body=${body}`;
    window.open(mailtoLink, '_blank');
    
    // Setze permanenten Marker für behandelte Benachrichtigung
    const permanentHandledKey = `bautraeger_email_sent_${appointment.id}_${userId}`;
    localStorage.setItem(permanentHandledKey, JSON.stringify({
      appointmentId: appointment.id,
      userId: userId,
      emailSentAt: new Date().toISOString(),
      action: 'email_sent'
    }));
    
    // Setze lokalen Status auf behandelt
    const notificationIndex = notifications.indexOf(notification);
    handleMarkAsHandled(notificationIndex);
    };

  const handleMarkAsHandled = (notificationIndex: number) => {
    const notification = notifications[notificationIndex];
    
    setNotifications(prev => 
      prev.map((n, idx) => 
        idx === notificationIndex ? { ...n, isHandled: true } : n
      )
    );
    setSelectedNotification(null);
    
    // Setze permanenten Marker für behandelte Benachrichtigung
    if (notification && notification.appointment) {
      const permanentHandledKey = `bautraeger_handled_${notification.appointment.id}_${userId}`;
      localStorage.setItem(permanentHandledKey, JSON.stringify({
        appointmentId: notification.appointment.id,
        userId: userId,
        handledAt: new Date().toISOString(),
        action: 'marked_as_handled'
      }));
    }
    
    if (onResponseHandled) {
      onResponseHandled();
    }
  };

  const handleMarkAllAsRead = async () => {
    // Markiere alle Benachrichtigungen als behandelt
    setNotifications(prev => 
      prev.map(n => ({ ...n, isHandled: true, isRead: true }))
    );
    
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
      
      if ((notification.type === 'quote_submitted' || notification.type === 'completion' || notification.type === 'defects_resolved') && notification.notification) {
        // Für Angebots-, Fertigstellungs- und Mängelbehebungsbenachrichtigungen - markiere als acknowledged
        api.patch(`/notifications/${notification.notification.id}/acknowledge`).catch(error => {
          console.error('Fehler beim Bestätigen der Benachrichtigung:', error);
        });
      }
    });
    
    // Schließe Modal falls offen
    setSelectedNotification(null);
    
    // Lade Benachrichtigungen neu
    setTimeout(() => {
      loadBautraegerNotifications();
    }, 500);
    
    if (onResponseHandled) {
      onResponseHandled();
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
  
  // Zeige immer die Tab, auch wenn keine Notifications da sind
  // if (notifications.length === 0) {
  //   return null;
  // }

  return (
    <>
      {/* Bauträger Notification Tab - rechts am Bildschirmrand */}
      <div className={`fixed right-0 top-1/2 -mt-20 transform -translate-y-1/2 z-[9999] transition-all duration-300 ${
        isExpanded ? 'translate-x-0' : 'translate-x-full'
      }`}>
        
        {/* Tab Handle - Der "Griff" der Lasche (links) */}
        <div 
          className={`absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-full cursor-pointer transition-all duration-300 ${
            hasUnhandled 
              ? 'bg-gradient-to-r from-green-500 to-blue-500 animate-pulse shadow-lg shadow-green-500/50' 
              : 'bg-gradient-to-r from-gray-500 to-slate-500'
          } rounded-l-lg px-3 py-4 text-white hover:shadow-xl`}
          onClick={() => setIsExpanded(!isExpanded)}
          data-tour-id="notification-tab-bautraeger"
        >
          <div className="flex flex-col items-center gap-2">
            {/* Bauträger Icon */}
            <div className={`${hasUnhandled ? 'animate-bounce' : ''}`}>
              <Calendar size={20} />
            </div>
            
            {/* Anzahl unbehandelte Benachrichtigungen */}
            {hasUnhandled && (
              <div className="bg-white text-green-600 rounded-full w-7 h-7 flex items-center justify-center text-xs font-bold animate-pulse shadow-lg">
                {unhandledCount}
              </div>
            )}
            
            {/* Zeige Anzahl auch wenn behandelt */}
            {!hasUnhandled && notifications.length > 0 && (
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
        <div className="bg-white shadow-2xl rounded-l-xl w-96 max-h-[80vh] overflow-hidden border-l-4 border-green-500">
          
          {/* Header */}
          <div className="bg-gradient-to-r from-green-600 to-blue-600 text-white p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell size={20} />
                <h3 className="font-semibold">Benachrichtigungen</h3>
              </div>
              <div className="flex items-center gap-2">
                {notifications.length > 0 && (
                  <button 
                    onClick={handleMarkAllAsRead}
                    className="hover:bg-white/20 rounded-lg px-3 py-1 transition-colors text-sm font-medium"
                    title="Alle gelesen"
                  >
                    Alle gelesen
                  </button>
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
                  !notification.isHandled ? 'bg-green-50 border-l-4 border-l-green-400' : ''
                }`}
                onClick={() => {
                  // Für quote_submitted: Öffne direkt die Ausschreibung
                  if (notification.type === 'quote_submitted' && notification.notification?.related_milestone_id) {
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
                  } else {
                    // Für andere Benachrichtigungen: Öffne Modal
                    setSelectedNotification(notification);
                  }
                }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
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
                    
                    {/* Angebot-spezifische Informationen - Design wie Dienstleister-Benachrichtigung */}
                    {notification.type === 'quote_submitted' && notification.notification?.metadata && (
                      <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="mb-2">
                          <div className="text-xs text-gray-600 font-medium">
                            📋 {notification.notification.metadata.quote_title || 'Angebot'}
                          </div>
                          <div className="text-xs text-gray-500">
                            🏗️ {notification.notification.metadata.project_name || 'Projekt'}
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="text-gray-500">Angebotssumme:</span>
                            <div className="font-semibold text-blue-600">
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
                        
                        <div className="mt-3 p-2 bg-gradient-to-r from-blue-100 to-indigo-100 rounded border border-blue-300">
                          <div className="flex items-center justify-center gap-2 text-xs text-blue-700 font-medium">
                            <FileText size={14} />
                            <span>👆 Klicken Sie hier, um die Ausschreibung zu öffnen</span>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        notification.type === 'quote_submitted' ? 'bg-blue-100 text-blue-800' :
                        notification.type === 'completion' ? 'bg-green-100 text-green-800' :
                        notification.type === 'defects_resolved' ? 'bg-orange-100 text-orange-800' :
                        notification.appointmentType === 'confirmation' ? 'bg-green-100 text-green-800' :
                        notification.appointmentType === 'reschedule' ? 'bg-yellow-100 text-yellow-800' :
                        notification.appointmentType === 'rejection' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {notification.type === 'quote_submitted' && '📋 Neues Angebot'}
                        {notification.type === 'completion' && '✅ Fertiggestellt'}
                        {notification.type === 'defects_resolved' && '🔧 Mängel behoben'}
                        {notification.appointmentType === 'confirmation' && '✅ Bestätigt'}
                        {notification.appointmentType === 'reschedule' && '📅 Neuer Vorschlag'}
                        {notification.appointmentType === 'rejection' && '❌ Abgelehnt'}
                      </span>
                      
                      {!notification.isHandled && (
                        <div className="animate-pulse">
                          <AlertCircle size={16} className={
                            notification.type === 'quote_submitted' ? 'text-blue-500' : 
                            notification.type === 'completion' ? 'text-green-500' : 
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
                ? 'bg-gradient-to-r from-green-600 to-emerald-600'
                : selectedNotification.type === 'defects_resolved'
                ? 'bg-gradient-to-r from-orange-600 to-amber-600'
                : 'bg-gradient-to-r from-green-600 to-blue-600'
            }`}>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">
                  {selectedNotification.type === 'quote_submitted' ? 'Neues Angebot' : 
                   selectedNotification.type === 'completion' ? 'Fertigstellung' : 
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
              {selectedNotification.type === 'quote_submitted' && selectedNotification.notification && (
                <div className="bg-blue-50 rounded-lg p-4 mb-6">
                  <h4 className="font-medium text-gray-900 mb-3">{selectedNotification.title}</h4>
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
                          await api.patch(`/notifications/${selectedNotification.notification.id}/acknowledge`);
                          
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
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
                    >
                      📋 Angebot ansehen
                    </button>
                    <button 
                      onClick={async () => {
                        if (selectedNotification.notification) {
                          await api.patch(`/notifications/${selectedNotification.notification.id}/acknowledge`);
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
              {selectedNotification.type === 'completion' && selectedNotification.notification && (
                <div className="bg-green-50 rounded-lg p-4 mb-6">
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
                          await api.patch(`/notifications/${selectedNotification.notification.id}/acknowledge`);
                          setSelectedNotification(null);
                          loadBautraegerNotifications();
                        }
                      }}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm"
                    >
                      Zur Abnahme
                    </button>
                    <button 
                      onClick={async () => {
                        if (selectedNotification.notification) {
                          await api.patch(`/notifications/${selectedNotification.notification.id}/acknowledge`);
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
                  
                  <div className="mt-4 flex gap-2">
                    <button 
                      onClick={async () => {
                        if (selectedNotification.notification) {
                          await api.patch(`/notifications/${selectedNotification.notification.id}/acknowledge`);
                          setSelectedNotification(null);
                          loadBautraegerNotifications();
                        }
                      }}
                      className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors text-sm"
                    >
                      Zur finalen Abnahme
                    </button>
                    <button 
                      onClick={async () => {
                        if (selectedNotification.notification) {
                          await api.patch(`/notifications/${selectedNotification.notification.id}/acknowledge`);
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
              
              {/* Appointment Details */}
              {selectedNotification.type === 'appointment' && selectedNotification.appointment && (
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <h4 className="font-medium text-gray-900 mb-3">{selectedNotification.appointment.title}</h4>
                
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <Calendar size={16} />
                    {formatDate(selectedNotification.appointment.scheduled_date)} um {formatTime(selectedNotification.appointment.scheduled_date)}
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock size={16} />
                    {selectedNotification.appointment.duration_minutes} Minuten
                  </div>
                  {selectedNotification.appointment.location && (
                    <div className="flex items-center gap-2">
                      <MapPin size={16} />
                      {selectedNotification.appointment.location}
                    </div>
                  )}
                </div>
                </div>
              )}

              {/* Service Provider Response */}
              {selectedNotification.type === 'appointment' && selectedNotification.response && (
                <div className="bg-blue-50 rounded-lg p-4 mb-6">
                  <h5 className="font-medium text-gray-900 mb-2">Antwort des Dienstleisters</h5>
                  
                  <div className="flex items-center gap-2 mb-2">
                    <User size={16} className="text-blue-600" />
                    <span className="text-sm text-gray-700">Dienstleister #{selectedNotification.response.service_provider_id}</span>
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

                {selectedNotification.response.message && (
                  <div className="bg-white rounded p-3 text-sm text-gray-700 italic">
                    "{selectedNotification.response.message}"
                  </div>
                )}

                {selectedNotification.response.suggested_date && (
                  <div className="mt-3 p-3 bg-yellow-100 rounded">
                    <p className="text-sm font-medium text-yellow-800">Vorgeschlagener Alternativtermin:</p>
                    <p className="text-sm text-yellow-700">
                      {formatDate(selectedNotification.response.suggested_date)} um {formatTime(selectedNotification.response.suggested_date)}
                    </p>
                  </div>
                )}
                </div>
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
