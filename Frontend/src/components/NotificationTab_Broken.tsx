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
  ChevronRight,
  Bell,
  AlertCircle
} from 'lucide-react';
import { appointmentService, type AppointmentResponse } from '../api/appointmentService';

interface NotificationTabProps {
  userRole: 'BAUTRAEGER' | 'DIENSTLEISTER';
  userId: number;
  onResponseSent?: () => void;
}

interface NotificationData {
  appointment: AppointmentResponse;
  type: 'invitation' | 'response' | 'reschedule';
  isAnswered: boolean;
  isNew: boolean;
  seenAt?: Date;
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
      setSeenNotifications(new Set(JSON.parse(saved)));
    }
  }, [userId]);

  const markAsSeen = (appointmentId: number) => {
    const newSeen = new Set(seenNotifications);
    newSeen.add(appointmentId);
    setSeenNotifications(newSeen);
    
    const seenKey = `seen_notifications_${userId}`;
    localStorage.setItem(seenKey, JSON.stringify(Array.from(newSeen)));
  };

  const loadNotifications = async () => {
    try {
      console.log('🔍 NotificationTab: Lade Benachrichtigungen für', { userRole, userId });
      let notifications: NotificationData[] = [];
      
      if (userRole === 'DIENSTLEISTER') {
        console.log('🔍 NotificationTab: Lade Termine für Dienstleister', userId);
        
        try {
          const response = await fetch('http://localhost:8000/api/v1/appointments/my-appointments-simple', {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (response.ok) {
            const data = await response.json();
            console.log('🔍 NotificationTab: Dienstleister-Termine:', data.appointments?.length || 0, data.appointments);
            
            const myAppointments = data.appointments || [];
            notifications = myAppointments.map((apt: any) => {
              // Neue Datenstruktur: Verwende responses_array falls verfügbar, sonst Fallback auf JSON-Parsing
              let responses = [];
              
              if (apt.responses_array && Array.isArray(apt.responses_array)) {
                // Neue Struktur: Direkt als Array verfügbar
                responses = apt.responses_array;
                console.log(`✅ NotificationTab - Using new responses_array for appointment ${apt.id}:`, responses);
              } else {
                try {
                  if (apt.responses) {
                    console.log(`🔍 NotificationTab - Fallback to JSON parsing for appointment ${apt.id}`);
                    if (typeof apt.responses === 'string') {
                      responses = JSON.parse(apt.responses);
                    } else if (Array.isArray(apt.responses)) {
                      responses = apt.responses;
                    } else if (typeof apt.responses === 'object' && apt.responses !== null) {
                      responses = Array.isArray(apt.responses) ? apt.responses : [apt.responses];
                    }
                    console.log(`✅ NotificationTab - Parsed legacy responses:`, responses);
                  }
                } catch (e) {
                  console.error('❌ Fehler beim Parsen der legacy responses für Termin', apt.id, e);
                  responses = [];
                }
              }
              
              // Prüfe ob dieser User bereits geantwortet hat
              const myResponse = responses.find((r: any) => 
                parseInt(String(r.service_provider_id || 0)) === parseInt(String(userId || 0))
              );
              
              const isAnswered = !!myResponse;
              const isNew = !seenNotifications.has(apt.id) && !isAnswered;
              
              console.log(`🔍 Termin ${apt.id}: responses="${typeof apt.responses === 'string' ? apt.responses : JSON.stringify(apt.responses)}", isAnswered=${isAnswered}, userId=${userId} [CACHE-BUSTER-2025]`);
              
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
          } else {
            console.error('❌ NotificationTab: Fehler beim Laden der Dienstleister-Termine:', response.status);
          }
        } catch (error) {
          console.error('❌ NotificationTab: Network error:', error);
        }
      } else if (userRole === 'BAUTRAEGER') {
        console.log('🔍 NotificationTab: Lade Termine für Bauträger', userId);
        
        try {
          const response = await fetch('http://localhost:8000/api/v1/appointments/my-appointments-simple', {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (response.ok) {
            const data = await response.json();
            console.log('🔍 NotificationTab: Bauträger-Termine:', data.appointments?.length || 0, data.appointments);
            
            const myAppointments = data.appointments || [];
            notifications = myAppointments.map((apt: any) => {
              // Für Bauträger: Zeige neue Antworten von Dienstleistern
              let responses = [];
              
              if (apt.responses_array && Array.isArray(apt.responses_array)) {
                responses = apt.responses_array;
                console.log(`✅ NotificationTab (Bauträger) - Using new responses_array for appointment ${apt.id}:`, responses);
              } else {
                try {
                  if (apt.responses) {
                    if (typeof apt.responses === 'string') {
                      responses = JSON.parse(apt.responses);
                    } else if (Array.isArray(apt.responses)) {
                      responses = apt.responses;
                    }
                    console.log(`✅ NotificationTab (Bauträger) - Parsed legacy responses:`, responses);
                  }
                } catch (e) {
                  console.error('❌ Fehler beim Parsen der responses für Bauträger', apt.id, e);
                  responses = [];
                }
              }
              
              // Für Bauträger: Zähle neue Antworten
              const newResponses = responses.filter((r: any) => {
                const responseTime = new Date(r.responded_at || r.created_at);
                const dayAgo = new Date();
                dayAgo.setDate(dayAgo.getDate() - 1);
                return responseTime > dayAgo; // Antworten der letzten 24h als "neu" betrachten
              });
              
              const isNew = !seenNotifications.has(apt.id) && newResponses.length > 0;
              
              console.log(`🔍 Bauträger Termin ${apt.id}: ${responses.length} Antworten, ${newResponses.length} neue [CACHE-BUSTER-2025]`);
              
              return {
                id: apt.id,
                type: 'appointment_responses' as const,
                title: apt.title || `Besichtigung #${apt.id}`,
                message: `${responses.length} Antworten erhalten (${newResponses.length} neue)`,
                timestamp: apt.created_at || apt.scheduled_date,
                isNew,
                appointmentId: apt.id,
                scheduledDate: apt.scheduled_date,
                location: apt.location || '',
                responses: responses
              };
            });
          } else {
            console.error('❌ NotificationTab: Fehler beim Laden der Bauträger-Termine:', response.status);
          }
        } catch (error) {
          console.error('❌ NotificationTab: Network error:', error);
        }
      }
                // Fallback: Legacy JSON-Parsing für Kompatibilität
                try {
                  if (apt.responses) {
                    console.log(`🔍 NotificationTab - Fallback to JSON parsing for appointment ${apt.id}`);
                    
                    if (typeof apt.responses === 'string') {
                      responses = JSON.parse(apt.responses);
                    } else if (Array.isArray(apt.responses)) {
                      responses = apt.responses;
                    } else if (typeof apt.responses === 'object' && apt.responses !== null) {
                      responses = Array.isArray(apt.responses) ? apt.responses : [apt.responses];
                    }
                    
                    console.log(`✅ NotificationTab - Parsed legacy responses:`, responses);
                  }
                } catch (e) {
                  console.error('❌ Fehler beim Parsen der legacy responses für Termin', apt.id, e);
                  responses = [];
                }
              }
              
              const isAnswered = Array.isArray(responses) && responses.some((r: any) => {
                // Robuste Typ-Konvertierung für alle Browser
                const responseProviderId = parseInt(String(r.service_provider_id || 0));
                const currentUserId = parseInt(String(userId || 0));
                console.log(`🔍 NotificationTab Vergleich: responseProviderId=${responseProviderId} vs currentUserId=${currentUserId} [CACHE-BUSTER-2025]`);
                const match = responseProviderId === currentUserId && responseProviderId > 0;
                console.log(`🔍 NotificationTab Match: ${match}`);
                return match;
              }) || false;
              
              // Eine Benachrichtigung ist "neu" nur wenn sie nicht gesehen UND nicht beantwortet wurde
              const isNew = !seenNotifications.has(apt.id) && !isAnswered;
              
              console.log(`🔍 Termin ${apt.id}: responses=${JSON.stringify(responses)}, isAnswered=${isAnswered}, userId=${userId}`);
              
              return {
                appointment: apt,
                type: 'invitation' as const,
                isAnswered,
                isNew
              };
            });
          } else {
            console.error('❌ NotificationTab: API-Fehler:', response.status, response.statusText);
            return;
          }
        } catch (fetchError) {
          console.error('❌ NotificationTab: Fetch-Fehler:', fetchError);
          return;
        }
      } else {
        console.log('🏗️ NotificationTab: Bauträger-Modus - keine Implementierung');
      }

      console.log('✅ NotificationTab: Verwende nur echte Appointments aus der Datenbank');
      setNotifications(notifications);
      console.log('✅ NotificationTab: Benachrichtigungen geladen:', notifications.length);
    } catch (error) {
      console.error('❌ NotificationTab: Fehler beim Laden der Benachrichtigungen:', error);
    }
  };

  const handleTabClick = () => {
    setIsExpanded(!isExpanded);
    
    if (!isExpanded) {
      notifications.forEach(notification => {
        if (notification.isNew) {
          markAsSeen(notification.appointment.id);
        }
      });
      
      setNotifications(prev => prev.map(n => ({ ...n, isNew: false })));
    }
  };

  const handleResponse = async (appointmentId: number, status: 'accepted' | 'rejected' | 'rejected_with_suggestion', message?: string, suggestedDateTime?: string) => {
    setLoading(true);
    try {
      console.log('🔄 NotificationTab: Sende Antwort für Termin', appointmentId, { status, message, suggestedDateTime });
      
      const responseData = {
        appointment_id: appointmentId,
        status,
        message,
        suggested_date: suggestedDateTime
      };
      
      await appointmentService.respondToAppointment(responseData);
      
      console.log('✅ NotificationTab: Antwort erfolgreich gesendet');
      
      // Markiere Benachrichtigung als beantwortet und als gesehen
      setNotifications(prev => prev.map(notification => 
        notification.appointment.id === appointmentId 
          ? { ...notification, isAnswered: true, isNew: false }
          : notification
      ));
      
      // Markiere als gesehen im localStorage
      const updatedSeenNotifications = new Set(seenNotifications);
      updatedSeenNotifications.add(appointmentId);
      setSeenNotifications(updatedSeenNotifications);
      localStorage.setItem('buildwise_seen_notifications', JSON.stringify([...updatedSeenNotifications]));
      
      setSelectedNotification(null);
      setResponseMessage('');
      setSuggestedDate('');
      setSuggestedTime('');
      
      // Lade Benachrichtigungen neu aus der Datenbank für konsistenten Zustand
      setTimeout(() => {
        console.log('🔄 NotificationTab: Lade Benachrichtigungen nach Antwort neu');
        loadNotifications();
      }, 500);
      
      if (onResponseSent) {
        onResponseSent();
      }
      
      window.dispatchEvent(new CustomEvent('appointmentUpdated', { 
        detail: { appointmentId, status } 
      }));
      
    } catch (error) {
      console.error('❌ NotificationTab: Fehler beim Senden der Antwort:', error);
      alert('Fehler beim Senden der Antwort. Bitte versuchen Sie es erneut.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('de-DE', {
        weekday: 'short',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch {
      return 'Ungültiges Datum';
    }
  };

  const formatTime = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleTimeString('de-DE', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Ungültige Zeit';
    }
  };

  const newNotifications = notifications.filter(n => n.isNew);
  const newCount = newNotifications.length;
  const hasNewNotifications = newCount > 0;

  if (notifications.length === 0) {
    return null;
  }

  return (
    <>
      {/* Dienstleister Notification Tab - rechts am Bildschirmrand */}
      <div className={`fixed right-0 top-1/2 transform -translate-y-1/2 z-[100] transition-all duration-300 ${
        isExpanded ? 'translate-x-0' : 'translate-x-full'
      }`}>
        
        {/* Tab Handle - Der "Griff" der Lasche (links) */}
        <div 
          className={`absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-full cursor-pointer transition-all duration-300 ${
            hasNewNotifications 
              ? 'bg-gradient-to-r from-[#ffbd59] to-[#ff9500] animate-pulse shadow-lg shadow-[#ffbd59]/50' 
              : 'bg-gradient-to-r from-gray-500 to-slate-500'
          } rounded-l-lg px-3 py-4 text-white hover:shadow-xl`}
          onClick={handleTabClick}
        >
          <div className="flex flex-col items-center gap-2">
            {/* Dienstleister Icon */}
            <div className={`${hasNewNotifications ? 'animate-bounce' : ''}`}>
              <Bell size={20} />
            </div>
            
            {/* Anzahl neue Benachrichtigungen */}
            {hasNewNotifications && (
              <div className="bg-white text-[#ff9500] rounded-full w-7 h-7 flex items-center justify-center text-xs font-bold animate-pulse shadow-lg">
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
        <div className="bg-white shadow-2xl rounded-l-xl w-96 max-h-[80vh] overflow-hidden border-l-4 border-[#ff9500]">
          
          {/* Header */}
          <div className="bg-gradient-to-r from-[#ffbd59] to-[#ff9500] text-white p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell size={20} />
                <h3 className="font-semibold">Termineinladungen</h3>
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
            {notifications.map((notification) => (
              <div 
                key={notification.appointment.id}
                className={`p-4 border-b border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors ${
                  notification.isNew ? 'bg-[#ffbd59]/10 border-l-4 border-l-[#ff9500]' : ''
                }`}
                onClick={() => setSelectedNotification(notification)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 mb-1">
                      {notification.appointment.title}
                    </h4>
                    
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

                    <div className="flex items-center justify-between">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        notification.isAnswered ? 'bg-green-100 text-green-800' : 'bg-[#ffbd59]/20 text-[#ff9500]'
                      }`}>
                        {notification.isAnswered ? '✅ Beantwortet' : '📅 Neue Einladung'}
                      </span>
                      
                      {notification.isNew && (
                        <div className="animate-pulse">
                          <AlertCircle size={16} className="text-[#ff9500]" />
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
            <div className="bg-gradient-to-r from-[#ffbd59] to-[#ff9500] text-white p-6 rounded-t-xl">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Termineinladung Details</h3>
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

                {selectedNotification.appointment.description && (
                  <div className="mt-3 p-3 bg-white rounded border">
                    <p className="text-sm text-gray-700 italic">
                      "{selectedNotification.appointment.description}"
                    </p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              {!selectedNotification.isAnswered && (
                <div className="space-y-3">
                  <button
                    onClick={() => handleResponse(selectedNotification.appointment.id, 'accepted')}
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
                  >
                    <Check size={16} />
                    {loading ? 'Wird gesendet...' : 'Termin annehmen'}
                  </button>
                  
                  <button
                    onClick={() => setSelectedNotification(null)}
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
                  >
                    <X size={16} />
                    {loading ? 'Wird gesendet...' : 'Termin ablehnen'}
                  </button>
                  
                  <button
                    onClick={() => setSelectedNotification(null)}
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-yellow-600 hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
                  >
                    <MessageSquare size={16} />
                    {loading ? 'Wird gesendet...' : 'Alternativtermin vorschlagen'}
                  </button>
                </div>
              )}

              {selectedNotification.isAnswered && (
                <div className="bg-green-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-green-800">
                    <Check size={16} />
                    <span className="font-medium">Termin bereits beantwortet</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Response Modal für detaillierte Antworten */}
      {selectedNotification && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-96 max-w-[90vw]">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Auf Termineinladung antworten
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nachricht (optional)
                </label>
                <textarea
                  value={responseMessage}
                  onChange={(e) => setResponseMessage(e.target.value)}
                  className="w-full p-3 bg-gray-50 border border-gray-300 rounded text-gray-900 resize-none"
                  rows={3}
                  placeholder="Ihre Nachricht..."
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Alternatives Datum
                  </label>
                  <input
                    type="date"
                    value={suggestedDate}
                    onChange={(e) => setSuggestedDate(e.target.value)}
                    className="w-full p-3 bg-gray-50 border border-gray-300 rounded text-gray-900"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Alternative Uhrzeit
                  </label>
                  <input
                    type="time"
                    value={suggestedTime}
                    onChange={(e) => setSuggestedTime(e.target.value)}
                    className="w-full p-3 bg-gray-50 border border-gray-300 rounded text-gray-900"
                  />
                </div>
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  const suggestedDateTime = suggestedDate && suggestedTime 
                    ? `${suggestedDate}T${suggestedTime}:00` 
                    : undefined;
                  
                  handleResponse(
                    selectedNotification.appointment.id,
                    suggestedDateTime ? 'rejected_with_suggestion' : 'rejected',
                    responseMessage || undefined,
                    suggestedDateTime
                  );
                }}
                disabled={loading}
                className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded font-medium transition-colors"
              >
                {loading ? 'Wird gesendet...' : 'Ablehnen'}
              </button>
              
              <button
                onClick={() => setSelectedNotification(null)}
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded font-medium transition-colors"
              >
                Abbrechen
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
} 