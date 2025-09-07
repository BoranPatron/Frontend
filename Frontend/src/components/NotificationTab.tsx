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
  FileText,
  Phone,
  CheckCircle
} from 'lucide-react';
import { appointmentService } from '../api/appointmentService';

interface NotificationTabProps {
  userRole: 'BAUTRAEGER' | 'DIENSTLEISTER';
  userId: number;
  onResponseSent?: () => void;
}

interface NotificationData {
  id: number;
  type: 'appointment_invitation' | 'appointment_responses' | 'service_provider_selection_reminder' | 'quote_accepted' | 'quote_submitted';
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

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 30000);
    
    // Event-Listener für neue Angebot-Benachrichtigungen
    const handleQuoteSubmitted = (event: CustomEvent) => {
      console.log('📢 Quote submitted event empfangen:', event.detail);
      const newNotification = event.detail.notification;
      
      // Füge die neue Benachrichtigung zur Liste hinzu
      setNotifications(prev => [newNotification, ...prev]);
      
      // Setze automatisch als "neu" für 10 Sekunden
      setTimeout(() => {
        setNotifications(prev => 
          prev.map(n => n.id === newNotification.id ? { ...n, isNew: false } : n)
        );
      }, 10000);
    };
    
    window.addEventListener('quoteSubmitted', handleQuoteSubmitted as EventListener);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('quoteSubmitted', handleQuoteSubmitted as EventListener);
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

  const handleMarkAllAsRead = () => {
    // Markiere alle aktuellen Benachrichtigungen als gesehen
    const allNotificationIds = notifications.map(n => n.id);
    markAsSeen(allNotificationIds);
    
    // Für Dienstleister: Setze permanente Marker für alle Termine
    if (userRole === 'DIENSTLEISTER') {
      notifications.forEach(notification => {
        if (notification.type === 'appointment_invitation') {
          const permanentSeenKey = `appointment_response_${notification.appointmentId}_${userId}`;
          localStorage.setItem(permanentSeenKey, JSON.stringify({
            appointmentId: notification.appointmentId,
            userId: userId,
            status: 'marked_as_read',
            markedAt: new Date().toISOString()
          }));
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

  const loadNotifications = async () => {
    try {
      let notifications: NotificationData[] = [];
      
      // 1. Lade allgemeine Benachrichtigungen aus der Datenbank
      try {
        const notificationResponse = await fetch('http://localhost:8000/api/v1/notifications/', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          },
          method: 'GET'
        });
        
        if (notificationResponse.ok) {
          const notificationData = await notificationResponse.json();
          const generalNotifications = notificationData || [];
          
          console.log('🔔 NotificationTab: API Response:', notificationData);
          console.log('🔔 NotificationTab: User Role:', userRole);
          console.log('🔔 NotificationTab: User ID:', userId);
          
          // Filtere für Dienstleister relevante Benachrichtigungen
          if (userRole === 'DIENSTLEISTER') {
            console.log('🔔 NotificationTab: Processing notifications for DIENSTLEISTER');
            generalNotifications.forEach((notification: any) => {
              console.log('🔔 NotificationTab: Processing notification:', notification);
              if (notification.type === 'quote_accepted') {
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
              }
            });
          }
        } else {
          console.error('🔔 NotificationTab: API Error:', notificationResponse.status, notificationResponse.statusText);
        }
      } catch (error) {
        console.error('Fehler beim Laden der allgemeinen Benachrichtigungen:', error);
      }
      
      // 2. Lade Termin-Benachrichtigungen (bestehende Logik)
      const response = await fetch('http://localhost:8000/api/v1/appointments/my-appointments-simple', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
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
            const isNew = !seenNotifications.has(apt.id) && !hasResponded && !myResponse;
            
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
          });
          
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
      } else {
        console.error('❌ NotificationTab: Fehler beim Laden der Termine:', response.status);
      }
      
      console.log('🔔 NotificationTab: Final notifications array:', notifications);
      console.log('🔔 NotificationTab: Total notifications:', notifications.length);
      setNotifications(notifications);
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

      // Mark as seen and close modal
      markAsSeen([selectedNotification.id]);
      
      // Create a permanent seen marker for this appointment response
      const permanentSeenKey = `appointment_response_${selectedNotification.appointmentId}_${userId}`;
      localStorage.setItem(permanentSeenKey, JSON.stringify({
        appointmentId: selectedNotification.appointmentId,
        userId: userId,
        status: status,
        respondedAt: new Date().toISOString()
      }));
      
      setSelectedNotification(null);
      setResponseMessage('');
      setSuggestedDate('');
      setSuggestedTime('');
      
      // Reload notifications after response
      setTimeout(() => {
        loadNotifications();
      }, 1000);
      
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

  const newCount = notifications.filter(n => n.isNew).length;
  const hasNewNotifications = newCount > 0;
  
  return (
    <>
      {/* Notification Tab - Fixed Position */}
      <div className={`fixed right-0 top-1/2 -mt-6 transform -translate-y-1/2 z-[9999] transition-all duration-300 ${
        isExpanded ? 'translate-x-0' : 'translate-x-full'
      }`}>
        
        {/* Tab Handle - Der "Griff" der Lasche (links) */}
        <div 
          className={`absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-full cursor-pointer transition-all duration-300 ${
            hasNewNotifications 
              ? 'bg-gradient-to-r from-orange-500 to-yellow-500 animate-pulse shadow-lg shadow-orange-500/50' 
              : 'bg-gradient-to-r from-gray-500 to-slate-500'
          } rounded-l-lg px-3 py-4 text-white hover:shadow-xl`}
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
              <div className="bg-white text-orange-600 rounded-full w-7 h-7 flex items-center justify-center text-xs font-bold animate-pulse shadow-lg">
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
        <div className="bg-white shadow-2xl rounded-l-xl w-96 max-h-[80vh] overflow-hidden border-l-4 border-orange-500">
          
          {/* Header */}
          <div className="bg-gradient-to-r from-orange-600 to-yellow-600 text-white p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell size={20} />
                <h3 className="font-semibold">
                  Benachrichtigungen
                </h3>
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
            {notifications.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <Bell size={32} className="mx-auto mb-2 opacity-50" />
                <p>Keine Benachrichtigungen</p>
              </div>
            ) : (
              <div className="space-y-0">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 border-b border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors ${
                      notification.isNew ? 'bg-orange-50 border-l-4 border-l-orange-400' : ''
                    }`}
                    onClick={() => {
                      if (userRole === 'DIENSTLEISTER' && notification.type === 'appointment_invitation') {
                        setSelectedNotification(notification);
                      } else if (userRole === 'DIENSTLEISTER' && notification.type === 'quote_accepted') {
                        setSelectedNotification(notification);
                        markAsSeen([notification.id]);
                      } else if (userRole === 'DIENSTLEISTER' && notification.type === 'quote_submitted') {
                        // Öffne die betroffene Ausschreibung
                        console.log('📋 Öffne Ausschreibung für Quote:', notification.tradeId);
                        markAsSeen([notification.id]);
                        
                        // Event für ServiceProviderDashboard auslösen, um TradeDetailsModal zu öffnen
                        window.dispatchEvent(new CustomEvent('openTradeDetails', {
                          detail: {
                            tradeId: notification.tradeId,
                            source: 'quote_notification'
                          }
                        }));
                        
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
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 mt-1">
                            {notification.type === 'appointment_invitation' ? (
                              <Calendar size={16} className="text-orange-500" />
                            ) : notification.type === 'quote_accepted' ? (
                              <CheckCircle size={16} className="text-green-500" />
                            ) : notification.type === 'quote_submitted' ? (
                              <FileText size={16} className="text-blue-500" />
                            ) : notification.type === 'service_provider_selection_reminder' ? (
                              <AlertCircle size={16} className="text-orange-400 animate-pulse" />
                            ) : (
                              <MessageSquare size={16} className="text-orange-500" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-gray-900 mb-1">
                              {notification.title}
                            </h4>
                            <p className="text-sm text-gray-600 mb-2">
                              {notification.message}
                            </p>
                            
                            <div className="flex items-center gap-4 text-sm text-gray-500">
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
                              <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                  <div>
                                    <span className="text-gray-500">Angebotssumme:</span>
                                    <div className="font-semibold text-blue-600">
                                      {new Intl.NumberFormat('de-DE', { 
                                        style: 'currency', 
                                        currency: notification.quoteSummary.currency || 'CHF' 
                                      }).format(notification.quoteSummary.amount || 0)}
                                    </div>
                                  </div>
                                  {notification.quoteSummary.validUntil && (
                                    <div>
                                      <span className="text-gray-500">Gültig bis:</span>
                                      <div className="font-semibold text-gray-700">
                                        {new Date(notification.quoteSummary.validUntil).toLocaleDateString('de-DE')}
                                      </div>
                                    </div>
                                  )}
                                  {notification.quoteSummary.startDate && (
                                    <div>
                                      <span className="text-gray-500">Start:</span>
                                      <div className="font-semibold text-gray-700">
                                        {new Date(notification.quoteSummary.startDate).toLocaleDateString('de-DE')}
                                      </div>
                                    </div>
                                  )}
                                  {notification.quoteSummary.completionDate && (
                                    <div>
                                      <span className="text-gray-500">Fertigstellung:</span>
                                      <div className="font-semibold text-gray-700">
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
                        <span className="text-gray-500">Datum:</span>
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
                        <span className="text-gray-500">Dauer:</span>
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
                        <span className="text-gray-500">Adresse:</span>
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
                        <span className="text-gray-500">Zusätzliche Ortsangaben:</span>
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
                        <span className="text-gray-500">Ansprechpartner:</span>
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
                        <span className="text-gray-500">Telefonnummer:</span>
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
                <label className="block text-sm font-medium text-gray-700 mb-2">
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
                        <span className="text-gray-500">Datum:</span>
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
                        <span className="text-gray-500">Dauer:</span>
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
                        <span className="text-gray-500">Adresse:</span>
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
                        <span className="text-gray-500">Zusätzliche Ortsangaben:</span>
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
                        <span className="text-gray-500">Ansprechpartner:</span>
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
                        <span className="text-gray-500">Telefonnummer:</span>
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
                        key={index}
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
                                <span className="text-sm font-medium text-gray-700">Nachricht:</span>
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
                                <span className="text-sm font-medium text-gray-700">Alternativtermin:</span>
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
                          <div className="mt-2 text-xs text-gray-500">
                            Geantwortet am: {new Date(response.responded_at).toLocaleDateString('de-DE')} um {new Date(response.responded_at).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-400">
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
                  onClick={() => {
                    setSelectedNotification(null);
                    // Markiere Benachrichtigung als acknowledged
                    if (selectedNotification.notification) {
                      fetch(`http://localhost:8000/api/v1/notifications/${selectedNotification.notification.id}/acknowledge`, {
                        method: 'PATCH',
                        headers: {
                          'Authorization': `Bearer ${localStorage.getItem('token')}`,
                          'Content-Type': 'application/json'
                        }
                      }).catch(error => {
                        console.error('Fehler beim Bestätigen der Benachrichtigung:', error);
                      });
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
                
                <p className="text-sm text-gray-700 mb-3">{selectedNotification.message}</p>
                
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
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>• Kontaktdaten des Bauträgers sind nun freigeschaltet</li>
                  <li>• Sie können mit der Projektplanung beginnen</li>
                  <li>• Vereinbaren Sie einen Starttermin</li>
                  <li>• Dokumentieren Sie den Fortschritt regelmäßig</li>
                </ul>
              </div>
              
              {/* Action Buttons */}
              <div className="flex justify-center">
                <button
                  onClick={() => {
                    setSelectedNotification(null);
                    // Markiere als acknowledged
                    if (selectedNotification.notification) {
                      fetch(`http://localhost:8000/api/v1/notifications/${selectedNotification.notification.id}/acknowledge`, {
                        method: 'PATCH',
                        headers: {
                          'Authorization': `Bearer ${localStorage.getItem('token')}`,
                          'Content-Type': 'application/json'
                        }
                      }).catch(error => {
                        console.error('Fehler beim Bestätigen der Benachrichtigung:', error);
                      });
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
