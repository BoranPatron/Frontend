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
  AlertCircle
} from 'lucide-react';
import { appointmentService } from '../api/appointmentService';

interface NotificationTabProps {
  userRole: 'BAUTRAEGER' | 'DIENSTLEISTER';
  userId: number;
  onResponseSent?: () => void;
}

interface NotificationData {
  id: number;
  type: 'appointment_invitation' | 'appointment_responses' | 'service_provider_selection_reminder';
  title: string;
  message: string;
  timestamp: string;
  isNew: boolean;
  appointmentId: number;
  scheduledDate?: string;
  location?: string;
  myResponse?: any;
  responses?: any[];
  selectedServiceProviderId?: number;
  tradeId?: number;
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
    return () => clearInterval(interval);
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

  const loadNotifications = async () => {
    try {
      let notifications: NotificationData[] = [];
      
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
          notifications = myAppointments.map((apt: any) => {
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
            const isNew = !seenNotifications.has(apt.id);
            
            return {
              id: apt.id,
              type: 'appointment_invitation' as const,
              title: apt.title || `Besichtigung #${apt.id}`,
              message: apt.description || 'Neue Termineinladung',
              timestamp: apt.scheduled_date,
              isNew,
              appointmentId: apt.id,
              scheduledDate: apt.scheduled_date,
              location: apt.location || '',
              myResponse,
              responses
            };
          });
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
              
              notifications.push({
                id: apt.id,
                type: 'appointment_responses' as const,
                title: apt.title || `Besichtigung #${apt.id}`,
                message: `${responses.length} Antworten erhalten${newResponses.length > 0 ? ` (${newResponses.length} neue)` : ''}`,
                timestamp: apt.created_at || apt.scheduled_date,
                isNew: hasNewResponses,
                appointmentId: apt.id,
                scheduledDate: apt.scheduled_date,
                location: apt.location || '',
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
                  {userRole === 'DIENSTLEISTER' ? 'Termineinladungen' : 'Benachrichtigungen'}
                </h3>
              </div>
              <button 
                onClick={() => setIsExpanded(false)}
                className="hover:bg-white/20 rounded-full p-1 transition-colors"
              >
                <X size={16} />
              </button>
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
      {selectedNotification && userRole === 'DIENSTLEISTER' && (
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
                
                <div className="space-y-2 text-sm text-gray-600">
                  {selectedNotification.scheduledDate && (
                    <div className="flex items-center gap-2">
                      <Calendar size={16} />
                      {formatDate(selectedNotification.scheduledDate)} um {formatTime(selectedNotification.scheduledDate)}
                    </div>
                  )}
                  {selectedNotification.location && (
                    <div className="flex items-center gap-2">
                      <MapPin size={16} />
                      {selectedNotification.location}
                    </div>
                  )}
                </div>
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
    </>
  );
} 
