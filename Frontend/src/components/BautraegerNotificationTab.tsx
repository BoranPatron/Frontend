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
  ExternalLink
} from 'lucide-react';
import { appointmentService, type AppointmentResponse } from '../api/appointmentService';

interface BautraegerNotificationTabProps {
  userId: number;
  onResponseHandled?: () => void;
}

interface BautraegerNotificationData {
  appointment: AppointmentResponse;
  response: any; // Service Provider Response
  type: 'confirmation' | 'rejection' | 'reschedule';
  isHandled: boolean;
}

export default function BautraegerNotificationTab({ userId, onResponseHandled }: BautraegerNotificationTabProps) {
  const [notifications, setNotifications] = useState<BautraegerNotificationData[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<BautraegerNotificationData | null>(null);

  useEffect(() => {
    loadBautraegerNotifications();
    const interval = setInterval(loadBautraegerNotifications, 30000);
    return () => clearInterval(interval);
  }, [userId]);

  const loadBautraegerNotifications = async () => {
    try {
      console.log('🏗️ BautraegerNotificationTab: Lade Bauträger-Benachrichtigungen für User:', userId);
      
      // Nutze den sicheren Endpunkt - Bauträger sehen nur eigene Termine
      const myAppointments = await appointmentService.getMyAppointments(8); // Demo: Projekt 8
      
      let notifications: BautraegerNotificationData[] = [];
      
      // Verarbeite jede Antwort von Service Providern
      myAppointments.forEach(appointment => {
        console.log(`🔍 BautraegerNotificationTab: Processing appointment ${appointment.id}:`, appointment);
        
        // Parse responses robustly - handle both array and JSON string
        let responses = [];
        if (appointment.responses_array && Array.isArray(appointment.responses_array)) {
          responses = appointment.responses_array;
          console.log(`✅ Using new responses_array for appointment ${appointment.id}:`, responses);
        } else if (appointment.responses) {
          try {
            if (typeof appointment.responses === 'string') {
              responses = JSON.parse(appointment.responses);
            } else if (Array.isArray(appointment.responses)) {
              responses = appointment.responses;
            }
            console.log(`✅ Parsed legacy responses for appointment ${appointment.id}:`, responses);
          } catch (e) {
            console.error(`❌ Error parsing responses for appointment ${appointment.id}:`, e);
            responses = [];
          }
        }
        
        if (responses && responses.length > 0) {
          responses.forEach(response => {
            notifications.push({
              appointment,
              response,
              type: response.status === 'accepted' ? 'confirmation' : 
                    response.status === 'rejected_with_suggestion' ? 'reschedule' : 'rejection',
              isHandled: false // TODO: Aus Backend laden
            });
          });
        }
      });

      console.log('🔒 Sichere Abfrage: Bauträger sieht nur eigene Termine mit Antworten:', notifications.length);

      // Keine Demo-Benachrichtigungen mehr - nur echte Daten
      console.log('✅ BautraegerNotificationTab: Keine Demo-Benachrichtigungen - nur echte Daten');

      setNotifications(notifications);
      console.log('✅ BautraegerNotificationTab: Benachrichtigungen geladen:', notifications.length);
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
    
    console.log('📧 E-Mail generiert für Service Provider:', response.service_provider_id);
  };

  const handleMarkAsHandled = (notificationIndex: number) => {
    setNotifications(prev => 
      prev.map((n, idx) => 
        idx === notificationIndex ? { ...n, isHandled: true } : n
      )
    );
    setSelectedNotification(null);
    
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
  
  console.log(`🏗️ [BAUTRAEGER-NOTIFICATION] Rendering with ${notifications.length} notifications, ${unhandledCount} unhandled`);

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
                <Calendar size={20} />
                <h3 className="font-semibold">Terminantworten</h3>
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
            {notifications.map((notification, index) => (
              <div 
                key={`${notification.appointment.id}-${index}`}
                className={`p-4 border-b border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors ${
                  !notification.isHandled ? 'bg-green-50 border-l-4 border-l-green-400' : ''
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
                        notification.type === 'confirmation' ? 'bg-green-100 text-green-800' :
                        notification.type === 'reschedule' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {notification.type === 'confirmation' && '✅ Bestätigt'}
                        {notification.type === 'reschedule' && '📅 Neuer Vorschlag'}
                        {notification.type === 'rejection' && '❌ Abgelehnt'}
                      </span>
                      
                      {!notification.isHandled && (
                        <div className="animate-pulse">
                          <AlertCircle size={16} className="text-green-500" />
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
            <div className="bg-gradient-to-r from-green-600 to-blue-600 text-white p-6 rounded-t-xl">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Terminantwort Details</h3>
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
              </div>

              {/* Service Provider Response */}
              <div className="bg-blue-50 rounded-lg p-4 mb-6">
                <h5 className="font-medium text-gray-900 mb-2">Antwort des Dienstleisters</h5>
                
                <div className="flex items-center gap-2 mb-2">
                  <User size={16} className="text-blue-600" />
                  <span className="text-sm text-gray-700">Dienstleister #{selectedNotification.response.service_provider_id}</span>
                </div>
                
                <div className={`inline-flex px-3 py-1 rounded-full text-sm font-medium mb-3 ${
                  selectedNotification.type === 'confirmation' ? 'bg-green-100 text-green-800' :
                  selectedNotification.type === 'reschedule' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {selectedNotification.type === 'confirmation' && '✅ Termin bestätigt'}
                  {selectedNotification.type === 'reschedule' && '📅 Alternativtermin vorgeschlagen'}
                  {selectedNotification.type === 'rejection' && '❌ Termin abgelehnt'}
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

              {/* Action Buttons */}
              <div className="flex flex-col gap-3">
                
                {/* E-Mail an Dienstleister */}
                <button
                  onClick={() => generateEmailToServiceProvider(selectedNotification)}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                >
                  <Mail size={16} />
                  E-Mail an Dienstleister senden
                </button>

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