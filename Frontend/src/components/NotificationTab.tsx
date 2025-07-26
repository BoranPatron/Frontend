import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  User, 
  Check, 
  X, 
  MessageSquare,
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
  type: 'appointment_invitation' | 'appointment_responses';
  title: string;
  message: string;
  timestamp: string;
  isNew: boolean;
  appointmentId: number;
  scheduledDate?: string;
  location?: string;
  myResponse?: any;
  responses?: any[];
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
      console.log('🔍 NotificationTab: Lade Benachrichtigungen für', { userRole, userId });
      let notifications: NotificationData[] = [];
      
      const response = await fetch('http://localhost:8000/api/v1/appointments/my-appointments-simple', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log(`🔍 NotificationTab: ${userRole}-Termine:`, data.appointments?.length || 0, data.appointments);
        
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
                console.error('Error parsing responses:', e);
                responses = [];
              }
            }
            
            // Check if user already responded
            const myResponse = responses.find((r: any) => 
              parseInt(String(r.service_provider_id || 0)) === parseInt(String(userId || 0))
            );
            
            const isAnswered = !!myResponse;
            const isNew = !seenNotifications.has(apt.id) && !isAnswered;
            
            return {
              id: apt.id,
              type: 'appointment_invitation' as const,
              title: apt.title || `Besichtigung #${apt.id}`,
              message: `Termineinladung für ${apt.scheduled_date ? new Date(apt.scheduled_date).toLocaleDateString('de-DE') : 'unbekanntes Datum'}`,
              timestamp: apt.created_at || apt.scheduled_date,
              isNew,
              appointmentId: apt.id,
              scheduledDate: apt.scheduled_date,
              location: apt.location || '',
              myResponse
            };
          });
        } else if (userRole === 'BAUTRAEGER') {
          notifications = myAppointments.map((apt: any) => {
            // Parse responses for Bauträger
            let responses = [];
            if (apt.responses_array && Array.isArray(apt.responses_array)) {
              responses = apt.responses_array;
            } else if (apt.responses) {
              try {
                responses = typeof apt.responses === 'string' ? JSON.parse(apt.responses) : apt.responses;
              } catch (e) {
                console.error('Error parsing responses:', e);
                responses = [];
              }
            }
            
            // For Bauträger: Count new responses in last 24h
            const newResponses = responses.filter((r: any) => {
              const responseTime = new Date(r.responded_at || r.created_at);
              const dayAgo = new Date();
              dayAgo.setDate(dayAgo.getDate() - 1);
              return responseTime > dayAgo;
            });
            
            const isNew = !seenNotifications.has(apt.id) && newResponses.length > 0;
            
            return {
              id: apt.id,
              type: 'appointment_responses' as const,
              title: apt.title || `Besichtigung #${apt.id}`,
              message: `${responses.length} Antworten erhalten${newResponses.length > 0 ? ` (${newResponses.length} neue)` : ''}`,
              timestamp: apt.created_at || apt.scheduled_date,
              isNew,
              appointmentId: apt.id,
              scheduledDate: apt.scheduled_date,
              location: apt.location || '',
              responses: responses
            };
          });
        }
      } else {
        console.error('❌ NotificationTab: Fehler beim Laden der Termine:', response.status);
      }
      
      console.log('✅ NotificationTab: Verwende nur echte Appointments aus der Datenbank');
      setNotifications(notifications);
      console.log('✅ NotificationTab: Benachrichtigungen geladen:', notifications.length);
      
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

      console.log('🔄 NotificationTab: Sende Antwort für Termin', selectedNotification.appointmentId, {
        status,
        message: responseMessage || undefined,
        suggestedDateTime
      });

      await appointmentService.respondToAppointment({
        appointment_id: selectedNotification.appointmentId,
        status,
        message: responseMessage || undefined,
        suggested_date: suggestedDateTime
      });

      console.log('✅ NotificationTab: Antwort erfolgreich gesendet');
      
      // Mark as seen and close modal
      markAsSeen([selectedNotification.id]);
      setSelectedNotification(null);
      setResponseMessage('');
      setSuggestedDate('');
      setSuggestedTime('');
      
      // Reload notifications after response
      setTimeout(() => {
        console.log('🔄 NotificationTab: Lade Benachrichtigungen nach Antwort neu');
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

     const newCount = notifications.filter(n => n.isNew).length;
   const hasNewNotifications = newCount > 0;
   
   console.log(`🔔 [NOTIFICATION-TAB] Rendering for ${userRole} with ${notifications.length} notifications, ${newCount} new`);
 
   return (
    <>
             {/* Notification Tab - Fixed Position */}
       <div className="fixed right-0 top-1/2 transform -translate-y-1/2 z-[9999]">
        <button
          onClick={() => {
            setIsExpanded(!isExpanded);
            if (!isExpanded && hasNewNotifications) {
              // Mark all as seen when opening
              markAsSeen(notifications.filter(n => n.isNew).map(n => n.id));
            }
          }}
          className={`flex items-center gap-2 px-3 py-2 rounded-l-lg shadow-lg transition-all duration-300 ${
            hasNewNotifications
              ? 'bg-orange-500 text-white animate-pulse'
              : 'bg-gray-600 text-gray-300'
          }`}
          style={{
            writingMode: 'vertical-rl',
            textOrientation: 'mixed'
          }}
        >
          <Bell size={16} />
          <span className="text-sm font-medium">
            {hasNewNotifications ? newCount : '0'}
          </span>
        </button>
      </div>

             {/* Expanded Notification Panel */}
       {isExpanded && (
         <div className="fixed right-0 top-0 h-full w-80 bg-[#2c3539] shadow-2xl z-[9998] transform transition-transform duration-300">
          <div className="p-4 border-b border-gray-600 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Bell size={20} className="text-[#ffbd59]" />
              Benachrichtigungen
            </h3>
            <button
              onClick={() => setIsExpanded(false)}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <div className="p-4 max-h-full overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <Bell size={32} className="mx-auto mb-2 opacity-50" />
                <p>Keine Benachrichtigungen</p>
              </div>
            ) : (
              <div className="space-y-3">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      notification.isNew
                        ? 'bg-orange-500/20 border-orange-500/50 text-white'
                        : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10'
                    }`}
                    onClick={() => {
                      if (userRole === 'DIENSTLEISTER' && notification.type === 'appointment_invitation') {
                        setSelectedNotification(notification);
                      }
                      if (!notification.isNew) {
                        markAsSeen([notification.id]);
                      }
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-1">
                        {notification.type === 'appointment_invitation' ? (
                          <Calendar size={16} className="text-[#ffbd59]" />
                        ) : (
                          <MessageSquare size={16} className="text-[#ffbd59]" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm truncate">
                          {notification.title}
                        </h4>
                        <p className="text-xs opacity-80 mt-1">
                          {notification.message}
                        </p>
                        {notification.scheduledDate && (
                          <div className="flex items-center gap-1 mt-2 text-xs opacity-60">
                            <Clock size={12} />
                            {new Date(notification.scheduledDate).toLocaleDateString('de-DE', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                        )}
                        {notification.location && (
                          <div className="flex items-center gap-1 mt-1 text-xs opacity-60">
                            <MapPin size={12} />
                            {notification.location}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

             {/* Response Modal for Dienstleister */}
       {selectedNotification && userRole === 'DIENSTLEISTER' && (
         <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9997] p-4">
          <div className="bg-[#2c3539] rounded-2xl shadow-2xl border border-white/20 max-w-md w-full">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-white mb-4">
                Auf Termineinladung antworten
              </h3>
              
              <div className="space-y-4">
                <div className="p-3 bg-white/5 rounded-lg">
                  <h4 className="font-medium text-white">{selectedNotification.title}</h4>
                  {selectedNotification.scheduledDate && (
                    <div className="flex items-center gap-2 mt-2 text-sm text-gray-300">
                      <Calendar size={14} />
                      {new Date(selectedNotification.scheduledDate).toLocaleDateString('de-DE', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  )}
                  {selectedNotification.location && (
                    <div className="flex items-center gap-2 mt-1 text-sm text-gray-300">
                      <MapPin size={14} />
                      {selectedNotification.location}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Nachricht (optional)
                  </label>
                  <textarea
                    value={responseMessage}
                    onChange={(e) => setResponseMessage(e.target.value)}
                    placeholder="Ihre Nachricht..."
                    className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent"
                    rows={3}
                  />
                </div>

                <div className="flex items-center justify-end gap-3">
                  <button
                    onClick={() => setSelectedNotification(null)}
                    disabled={loading}
                    className="px-4 py-2 text-gray-400 hover:text-white transition-colors disabled:opacity-50"
                  >
                    Abbrechen
                  </button>
                  
                  <button
                    onClick={() => handleResponse('accepted')}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
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
                    className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
                  >
                    <X size={16} />
                    Absagen
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
} 