import React, { useState, useEffect, useRef } from 'react';
import { 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  MapPin, 
  Download,
  Eye,
  User,
  Building,
  CheckCircle,
  XCircle,
  AlertCircle,
  Plus
} from 'lucide-react';
import { appointmentService, type AppointmentResponse } from '../api/appointmentService';
import { useAuth } from '../context/AuthContext';

interface NavbarCalendarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  appointments: AppointmentResponse[];
}

export default function NavbarCalendar({ isOpen, onClose }: NavbarCalendarProps) {
  const { user, isServiceProvider } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [appointments, setAppointments] = useState<AppointmentResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');
  const calendarRef = useRef<HTMLDivElement>(null);

  // Termine laden
  const loadAppointments = async () => {
    setLoading(true);
    try {
      const data = await appointmentService.getMyAppointments();
      console.log('📅 Geladene Termine (NavbarCalendar):', data);
      console.log('📅 Anzahl geladene Termine:', data?.length || 0);
      console.log('📅 Benutzer-Info:', {
        userId: user?.id,
        userRole: user?.user_role,
        isServiceProvider: isServiceProvider()
      });
      
      // Debug: Struktur aller Termine analysieren
      if (data && data.length > 0) {
        data.forEach((appointment, index) => {
          console.log(`🔍 Termin ${index + 1} (DETAILLIERT):`, {
            id: appointment.id,
            title: appointment.title,
            appointment_type: appointment.appointment_type,
            scheduled_date: appointment.scheduled_date,
            created_by: appointment.created_by,
            milestone_id: appointment.milestone_id,
            // KRITISCH: Detaillierte Analyse der Einladungs-/Response-Daten
            responses: appointment.responses,
            responses_type: typeof appointment.responses,
            responses_array: appointment.responses_array,
            responses_array_type: typeof appointment.responses_array,
            invited_service_providers: appointment.invited_service_providers,
            invited_service_providers_type: typeof appointment.invited_service_providers,
            // Zusätzliche mögliche Felder
            appointment_responses: (appointment as any).appointment_responses,
            service_provider_responses: (appointment as any).service_provider_responses,
            // Vollständiges Objekt für maximale Transparenz
            full_appointment: appointment
          });
          
          // Spezielle Analyse für Appointment 14
          if (appointment.id === 14) {
            console.log('🚨 SPEZIAL-ANALYSE für Appointment 14:', appointment);
            console.log('🚨 Alle verfügbaren Felder:', Object.keys(appointment));
            console.log('🚨 invited_service_providers Inhalt:', appointment.invited_service_providers);
            console.log('🚨 responses Inhalt:', appointment.responses);
          }
        });
      }
      setAppointments(data || []);
    } catch (error) {
      console.error('❌ Fehler beim Laden der Termine:', error);
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadAppointments();
    }
  }, [isOpen]);

  // Event-Listener für Termin-Updates
  useEffect(() => {
    const handleAppointmentUpdate = () => {
      console.log('📅 Appointment updated event received, reloading appointments...');
      // Lade Termine neu, unabhängig davon ob Kalender offen ist
      loadAppointments();
    };

    const handleAppointmentResponse = () => {
      console.log('📅 Appointment response event received, reloading appointments...');
      // Lade Termine neu, unabhängig davon ob Kalender offen ist
      loadAppointments();
    };

    const handleAppointmentCreated = () => {
      console.log('📅 Appointment created event received, reloading appointments...');
      // Lade Termine neu, unabhängig davon ob Kalender offen ist
      loadAppointments();
    };

    // Verschiedene Events für Terminänderungen
    window.addEventListener('appointmentUpdated', handleAppointmentUpdate);
    window.addEventListener('appointmentResponse', handleAppointmentResponse);
    window.addEventListener('appointmentAccepted', handleAppointmentUpdate);
    window.addEventListener('appointmentRejected', handleAppointmentUpdate);
    window.addEventListener('appointmentCreated', handleAppointmentCreated);
    
    return () => {
      window.removeEventListener('appointmentUpdated', handleAppointmentUpdate);
      window.removeEventListener('appointmentResponse', handleAppointmentResponse);
      window.removeEventListener('appointmentAccepted', handleAppointmentUpdate);
      window.removeEventListener('appointmentRejected', handleAppointmentUpdate);
      window.removeEventListener('appointmentCreated', handleAppointmentCreated);
    };
  }, []); // Entferne isOpen dependency damit Events immer gehört werden

  // Automatisches Reload alle 30 Sekunden wenn Kalender offen ist
  useEffect(() => {
    if (!isOpen) return;

    const interval = setInterval(() => {
      console.log('📅 Auto-reload appointments every 30 seconds...');
      loadAppointments();
    }, 30000); // 30 Sekunden

    return () => clearInterval(interval);
  }, [isOpen]);

  // Außerhalb klicken um zu schließen
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Kalender-Tage generieren
  const generateCalendarDays = (): CalendarDay[] => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const firstDayOfWeek = (firstDayOfMonth.getDay() + 6) % 7; // Montag = 0
    
    const days: CalendarDay[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Vorherige Monatstage
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const date = new Date(year, month, -i);
      days.push({
        date,
        isCurrentMonth: false,
        isToday: date.getTime() === today.getTime(),
        isSelected: date.getTime() === selectedDate.getTime(),
        appointments: getAppointmentsForDate(date)
      });
    }
    
    // Aktuelle Monatstage
    for (let day = 1; day <= lastDayOfMonth.getDate(); day++) {
      const date = new Date(year, month, day);
      days.push({
        date,
        isCurrentMonth: true,
        isToday: date.getTime() === today.getTime(),
        isSelected: date.getTime() === selectedDate.getTime(),
        appointments: getAppointmentsForDate(date)
      });
    }
    
    // Nächste Monatstage
    const remainingDays = 42 - days.length;
    for (let day = 1; day <= remainingDays; day++) {
      const date = new Date(year, month + 1, day);
      days.push({
        date,
        isCurrentMonth: false,
        isToday: date.getTime() === today.getTime(),
        isSelected: date.getTime() === selectedDate.getTime(),
        appointments: getAppointmentsForDate(date)
      });
    }
    
    return days;
  };

  // Termine für ein bestimmtes Datum filtern
  const getAppointmentsForDate = (date: Date): AppointmentResponse[] => {
    // Verwende lokales Datum für Vergleich
    const year = date.getFullYear();
    const month = date.getMonth();
    const day = date.getDate();
    
    const dateFilteredAppointments = appointments.filter(apt => {
      // Parse das Appointment-Datum in lokaler Zeitzone
      const aptDate = new Date(apt.scheduled_date);
      
      // Vergleiche Jahr, Monat und Tag in lokaler Zeitzone
      const aptYear = aptDate.getFullYear();
      const aptMonth = aptDate.getMonth();
      const aptDay = aptDate.getDate();
      
      const isMatch = year === aptYear && month === aptMonth && day === aptDay;
      
      if (isMatch) {
        console.log('🔍 Date match found:', {
          filterDate: `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
          appointmentDate: `${aptYear}-${String(aptMonth + 1).padStart(2, '0')}-${String(aptDay).padStart(2, '0')}`,
          appointmentUTC: apt.scheduled_date,
          appointmentLocal: aptDate.toLocaleString('de-DE')
        });
      }
      
      return isMatch;
    });

    // Zusätzliche Benutzer-Relevanz-Filterung
    const userFilteredAppointments = dateFilteredAppointments.filter(apt => {
      const responses = Array.isArray(apt.responses) ? apt.responses : [];
      const invitedProviders = Array.isArray(apt.invited_service_providers) ? apt.invited_service_providers : [];
      
      if (isServiceProvider()) {
        // Prüfe responses
        const hasResponse = responses.some((r: any) => 
          r.service_provider_id === user?.id || 
          String(r.service_provider_id) === String(user?.id) ||
          Number(r.service_provider_id) === Number(user?.id)
        );
        
        // Prüfe alle möglichen Response-Felder
        const responsesArray = responses || [];
        const responsesArrayAlt = (apt as any).responses_array || [];
        const appointmentResponses = (apt as any).appointment_responses || [];
        const serviceProviderResponses = (apt as any).service_provider_responses || [];
        
        // Kombiniere alle Response-Arrays
        const allResponses = [
          ...responsesArray,
          ...responsesArrayAlt,
          ...appointmentResponses,
          ...serviceProviderResponses
        ];
        
        const hasResponseExtended = allResponses.some((r: any) => {
          if (!r) return false;
          return r.service_provider_id === user?.id || 
                 String(r.service_provider_id) === String(user?.id) ||
                 Number(r.service_provider_id) === Number(user?.id) ||
                 r.user_id === user?.id ||
                 String(r.user_id) === String(user?.id) ||
                 Number(r.user_id) === Number(user?.id);
        });
        
        // Prüfe invited_service_providers mit erweiterter Logik
        const isInvited = invitedProviders.some((provider: any) => {
          // Robuste Prüfung für verschiedene Datenstrukturen
          if (typeof provider === 'number') {
            return provider === user?.id || 
                   String(provider) === String(user?.id) ||
                   Number(provider) === Number(user?.id);
          } else if (typeof provider === 'object' && provider !== null) {
            return provider.id === user?.id || 
                   String(provider.id) === String(user?.id) ||
                   Number(provider.id) === Number(user?.id);
          } else if (typeof provider === 'string') {
            return provider === String(user?.id) ||
                   Number(provider) === Number(user?.id);
          }
          return false;
        });
        
        const relevant = hasResponse || hasResponseExtended || isInvited;
        
        // Spezielle Debug-Ausgabe für Appointment 14
        if (apt.id === 14) {
          console.log('🚨 ERWEITERTE FILTERUNG für Appointment 14:', {
            appointmentId: apt.id,
            userId: user?.id,
            hasResponse: hasResponse,
            hasResponseExtended: hasResponseExtended,
            isInvited: isInvited,
            relevant: relevant,
            allResponsesCount: allResponses.length,
            invitedProvidersCount: invitedProviders.length,
            responses: responses,
            responsesArrayAlt: responsesArrayAlt,
            appointmentResponses: appointmentResponses,
            serviceProviderResponses: serviceProviderResponses,
            invitedProviders: invitedProviders
          });
        }
        console.log('🔍 User filter for appointment:', {
          appointmentId: apt.id,
          hasResponse,
          hasResponseExtended,
          isInvited,
          relevant,
          finalRelevant: relevant
        });
        
        return relevant;
      } else {
        // Bauträger sehen alle Termine die sie erstellt haben
        return apt.created_by === user?.id;
      }
    });

    console.log('🔍 Final filtered appointments for date:', {
      originalCount: appointments.length,
      dateFiltered: dateFilteredAppointments.length,
      userFiltered: userFilteredAppointments.length,
      date: `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    });

    return userFilteredAppointments;
  };

  // Termine für ausgewähltes Datum
  const selectedDateAppointments = getAppointmentsForDate(selectedDate);

  // Status-Icon für Termine
  const getAppointmentStatusIcon = (appointment: AppointmentResponse) => {
    // Sichere Überprüfung der responses
    const responses = Array.isArray(appointment.responses) ? appointment.responses : [];
    const invitedProviders = Array.isArray(appointment.invited_service_providers) ? appointment.invited_service_providers : [];
    
    // Debug-Logging für alle Benutzer
    console.log('🔍 Appointment filtering debug (NavbarCalendar):', {
      appointmentId: appointment.id,
      appointmentTitle: appointment.title,
      appointmentType: appointment.appointment_type,
      userId: user?.id,
      userRole: user?.user_role,
      isServiceProvider: isServiceProvider(),
      responses: responses,
      responsesLength: responses.length,
      invitedProviders: invitedProviders,
      invitedProvidersLength: invitedProviders.length,
      created_by: appointment.created_by,
      status: appointment.status
    });
    
    // Prüfe ob der Termin für den aktuellen Benutzer relevant ist
    const isRelevantForUser = isServiceProvider() 
      ? (() => {
          // Prüfe alle möglichen Response-Felder
          const responsesArray = responses || [];
          const responsesArrayAlt = (appointment as any).responses_array || [];
          const appointmentResponses = (appointment as any).appointment_responses || [];
          const serviceProviderResponses = (appointment as any).service_provider_responses || [];
          
          // Kombiniere alle Response-Arrays
          const allResponses = [
            ...responsesArray,
            ...responsesArrayAlt,
            ...appointmentResponses,
            ...serviceProviderResponses
          ];
          
          const hasResponse = responses.some((r: any) => {
            const match = r.service_provider_id === user?.id || 
                         String(r.service_provider_id) === String(user?.id) ||
                         Number(r.service_provider_id) === Number(user?.id);
            
            if (match) {
              console.log('✅ Found matching service provider response:', {
                responseId: r.service_provider_id,
                userId: user?.id,
                status: r.status
              });
            }
            
            return match;
          });
          
          const hasResponseExtended = allResponses.some((r: any) => {
            if (!r) return false;
            const match = r.service_provider_id === user?.id || 
                         String(r.service_provider_id) === String(user?.id) ||
                         Number(r.service_provider_id) === Number(user?.id) ||
                         r.user_id === user?.id ||
                         String(r.user_id) === String(user?.id) ||
                         Number(r.user_id) === Number(user?.id);
            
            if (match) {
              console.log('✅ Found matching extended response:', {
                responseId: r.service_provider_id || r.user_id,
                userId: user?.id,
                status: r.status,
                responseData: r
              });
            }
            
            return match;
          });
          
          // Prüfe invited_service_providers
          const isInvited = invitedProviders.some((provider: any) => {
            // Robuste Prüfung für verschiedene Datenstrukturen
            let match = false;
            
            if (typeof provider === 'number') {
              match = provider === user?.id || 
                     String(provider) === String(user?.id) ||
                     Number(provider) === Number(user?.id);
            } else if (typeof provider === 'object' && provider !== null) {
              match = provider.id === user?.id || 
                     String(provider.id) === String(user?.id) ||
                     Number(provider.id) === Number(user?.id);
            } else if (typeof provider === 'string') {
              match = provider === String(user?.id) ||
                     Number(provider) === Number(user?.id);
            }
            
            if (match) {
              console.log('✅ Found matching invited service provider:', {
                providerId: typeof provider === 'object' ? provider.id : provider,
                userId: user?.id,
                providerData: provider,
                providerType: typeof provider
              });
            }
            
            return match;
          });
          
          const relevant = hasResponse || hasResponseExtended || isInvited;
          
          // Spezielle Debug-Ausgabe für Appointment 14
          if (appointment.id === 14) {
            console.log('🚨 DETAILLIERTE STATUSICON-FILTERUNG für Appointment 14:', {
              appointmentId: appointment.id,
              userId: user?.id,
              hasResponse: hasResponse,
              hasResponseExtended: hasResponseExtended,
              isInvited: isInvited,
              relevant: relevant,
              allResponsesCount: allResponses.length,
              invitedProvidersCount: invitedProviders.length,
              fullAppointment: appointment
            });
          }
          
          console.log('🔍 Service Provider Relevance Check:', {
            hasResponse,
            hasResponseExtended,
            isInvited,
            relevant,
            appointmentId: appointment.id
          });
          
          return relevant;
        })()
      : (() => {
          // Bauträger sehen alle Termine die sie erstellt haben
          const relevant = appointment.created_by === user?.id;
          console.log('🔍 Bauträger Relevance Check:', {
            created_by: appointment.created_by,
            userId: user?.id,
            relevant,
            appointmentId: appointment.id
          });
          return relevant;
        })();

    console.log('🔍 Final relevance result:', {
      appointmentId: appointment.id,
      appointmentTitle: appointment.title,
      isRelevantForUser,
      willShowIcon: isRelevantForUser
    });

    if (!isRelevantForUser) {
      console.log('🚫 Skipping appointment - not relevant for user:', appointment.id);
      return null;
    }

    console.log('✅ Appointment is relevant, generating status icon for:', appointment.id);

    if (isServiceProvider()) {
      // Prüfe alle möglichen Response-Quellen
      const allResponses = [
        ...(responses || []),
        ...((appointment as any).responses_array || []),
        ...((appointment as any).appointment_responses || []),
        ...((appointment as any).service_provider_responses || [])
      ];
      
      const myResponse = allResponses.find((r: any) => {
        if (!r) return false;
        return r.service_provider_id === user?.id || 
               String(r.service_provider_id) === String(user?.id) ||
               Number(r.service_provider_id) === Number(user?.id) ||
               r.user_id === user?.id ||
               String(r.user_id) === String(user?.id) ||
               Number(r.user_id) === Number(user?.id);
      });
      
      const status = myResponse?.status || 'pending';
      
      console.log('🔍 Service Provider Status Icon:', {
        appointmentId: appointment.id,
        myResponse: myResponse,
        status: status,
        allResponsesCount: allResponses.length
      });
      
      switch (status) {
        case 'accepted': return <CheckCircle size={12} className="text-green-400" />;
        case 'rejected': return <XCircle size={12} className="text-red-400" />;
        default: return <AlertCircle size={12} className="text-yellow-400" />;
      }
    } else {
      // Bauträger sieht alle Termine die er erstellt hat
      switch (appointment.status) {
        case 'COMPLETED': return <CheckCircle size={12} className="text-green-400" />;
        case 'CANCELLED': return <XCircle size={12} className="text-red-400" />;
        default: return <Clock size={12} className="text-blue-400" />;
      }
    }
  };

  // Status-Text für Termine
  const getAppointmentStatusText = (appointment: AppointmentResponse): string => {
    if (isServiceProvider()) {
      // Prüfe alle möglichen Response-Quellen
      const allResponses = [
        ...(Array.isArray(appointment.responses) ? appointment.responses : []),
        ...((appointment as any).responses_array || []),
        ...((appointment as any).appointment_responses || []),
        ...((appointment as any).service_provider_responses || [])
      ];
      
      const myResponse = allResponses.find((r: any) => {
        if (!r) return false;
        return r.service_provider_id === user?.id || 
               String(r.service_provider_id) === String(user?.id) ||
               Number(r.service_provider_id) === Number(user?.id) ||
               r.user_id === user?.id ||
               String(r.user_id) === String(user?.id) ||
               Number(r.user_id) === Number(user?.id);
      });
      
      const status = myResponse?.status || 'pending';
      
      switch (status) {
        case 'accepted': return 'Zugesagt';
        case 'rejected': return 'Abgesagt';
        default: return 'Ausstehend';
      }
    } else {
      switch (appointment.status) {
        case 'COMPLETED': return 'Abgeschlossen';
        case 'CANCELLED': return 'Abgebrochen';
        case 'SCHEDULED': return 'Geplant';
        default: return appointment.status;
      }
    }
  };

  // Status-Farbe für Termine
  const getAppointmentStatusColor = (appointment: AppointmentResponse): string => {
    if (isServiceProvider()) {
      // Prüfe alle möglichen Response-Quellen
      const allResponses = [
        ...(Array.isArray(appointment.responses) ? appointment.responses : []),
        ...((appointment as any).responses_array || []),
        ...((appointment as any).appointment_responses || []),
        ...((appointment as any).service_provider_responses || [])
      ];
      
      const myResponse = allResponses.find((r: any) => {
        if (!r) return false;
        return r.service_provider_id === user?.id || 
               String(r.service_provider_id) === String(user?.id) ||
               Number(r.service_provider_id) === Number(user?.id) ||
               r.user_id === user?.id ||
               String(r.user_id) === String(user?.id) ||
               Number(r.user_id) === Number(user?.id);
      });
      
      const status = myResponse?.status || 'pending';
      
      switch (status) {
        case 'accepted': return 'border-green-500/30 bg-green-500/10';
        case 'rejected': return 'border-red-500/30 bg-red-500/10';
        default: return 'border-yellow-500/30 bg-yellow-500/10';
      }
    } else {
      switch (appointment.status) {
        case 'COMPLETED': return 'border-green-500/30 bg-green-500/10';
        case 'CANCELLED': return 'border-red-500/30 bg-red-500/10';
        default: return 'border-blue-500/30 bg-blue-500/10';
      }
    }
  };

  // ICS Download für Termin mit korrekter Zeitzone
  const handleDownloadICS = async (appointmentId: number) => {
    try {
      // Finde den entsprechenden Termin in unseren lokalen Daten
      const appointment = appointments.find(apt => apt.id === appointmentId);
      if (!appointment) {
        console.error('❌ Termin nicht gefunden:', appointmentId);
        return;
      }

      // Generiere ICS-Datei mit korrekter lokaler Zeit
      const icsContent = generateICSContent(appointment);
      
      // Erstelle Download
      const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `termin_${appointment.title?.replace(/[^a-zA-Z0-9]/g, '_') || 'appointment'}.ics`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      console.log('✅ ICS-Datei erfolgreich generiert und heruntergeladen');
    } catch (error) {
      console.error('❌ Fehler beim Download der ICS-Datei:', error);
    }
  };

  // Generiere ICS-Inhalt mit korrekter Zeitzone
  const generateICSContent = (appointment: AppointmentResponse): string => {
    const startDate = new Date(appointment.scheduled_date);
    const endDate = new Date(startDate.getTime() + (appointment.duration_minutes || 60) * 60000);
    
    // Formatiere Datum für ICS (YYYYMMDDTHHMMSS)
    const formatICSDate = (date: Date): string => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const seconds = String(date.getSeconds()).padStart(2, '0');
      
      return `${year}${month}${day}T${hours}${minutes}${seconds}`;
    };

    // Generiere eindeutige UID
    const uid = `appointment-${appointment.id}-${Date.now()}@buildwise.app`;
    const now = new Date();
    const timestamp = formatICSDate(now);

    // Escape Sonderzeichen für ICS
    const escapeICSText = (text: string): string => {
      return text
        .replace(/\\/g, '\\\\')
        .replace(/;/g, '\\;')
        .replace(/,/g, '\\,')
        .replace(/\n/g, '\\n')
        .replace(/\r/g, '');
    };

    const title = escapeICSText(appointment.title || 'Besichtigungstermin');
    const description = escapeICSText(appointment.description || '');
    const location = escapeICSText(appointment.location || '');

    console.log('🔍 ICS Generation Debug:', {
      originalDate: appointment.scheduled_date,
      parsedStartDate: startDate,
      localStartTime: startDate.toLocaleString('de-DE'),
      icsStartTime: formatICSDate(startDate),
      endDate: endDate,
      icsEndTime: formatICSDate(endDate)
    });

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//BuildWise//Appointment Calendar//DE',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      `UID:${uid}`,
      `DTSTAMP:${timestamp}`,
      `DTSTART:${formatICSDate(startDate)}`,
      `DTEND:${formatICSDate(endDate)}`,
      `SUMMARY:${title}`,
      description ? `DESCRIPTION:${description}` : '',
      location ? `LOCATION:${location}` : '',
      'STATUS:CONFIRMED',
      'TRANSP:OPAQUE',
      appointment.contact_person ? `ORGANIZER:CN=${escapeICSText(appointment.contact_person)}` : '',
      'END:VEVENT',
      'END:VCALENDAR'
    ].filter(line => line !== '').join('\r\n');

    return icsContent;
  };

  // Navigation
  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDate(today);
  };

  if (!isOpen) return null;

  const calendarDays = generateCalendarDays();
  const monthNames = [
    'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
    'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'
  ];
  const dayNames = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20">
      <div 
        ref={calendarRef}
        className="bg-gradient-to-br from-[#2c3539] to-[#3d4952] rounded-2xl shadow-2xl border border-white/20 max-w-4xl w-full mx-4 max-h-[80vh] overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/20">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-[#ffbd59] to-[#ffa726] rounded-xl shadow-lg shadow-[#ffbd59]/20">
              <Calendar size={24} className="text-[#2c3539]" />
            </div>
            <div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-200 bg-clip-text text-transparent">
                Terminkalender
              </h2>
              <p className="text-gray-300">
                {isServiceProvider() ? 'Ihre Besichtigungstermine' : 'Ihre erstellten Termine'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={goToToday}
              className="px-4 py-2 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-all duration-300 text-sm backdrop-blur-sm border border-white/20"
            >
              Heute
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-xl transition-all duration-300"
            >
              <XCircle size={24} className="text-gray-300" />
            </button>
          </div>
        </div>

        <div className="flex h-[calc(80vh-120px)]">
          {/* Kalender */}
          <div className="flex-1 p-6">
            {/* Kalender Navigation */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => navigateMonth('prev')}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <ChevronLeft size={20} className="text-white" />
                </button>
                
                <h3 className="text-xl font-semibold text-white min-w-[180px] text-center">
                  {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                </h3>
                
                <button
                  onClick={() => navigateMonth('next')}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <ChevronRight size={20} className="text-white" />
                </button>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setViewMode(viewMode === 'month' ? 'week' : 'month')}
                  className="px-3 py-1 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors text-sm"
                >
                  {viewMode === 'month' ? 'Woche' : 'Monat'}
                </button>
              </div>
            </div>

            {/* Wochentage */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {dayNames.map(day => (
                <div key={day} className="p-3 text-center text-sm font-medium text-gray-400">
                  {day}
                </div>
              ))}
            </div>

            {/* Kalendertage */}
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((day, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedDate(day.date)}
                  className={(() => {
                    // Prüfe ob dieser Tag relevante Termine hat
                    const relevantAppointments = day.appointments.filter(apt => {
                      const responses = Array.isArray(apt.responses) ? apt.responses : [];
                      const invitedProviders = Array.isArray(apt.invited_service_providers) ? apt.invited_service_providers : [];
                      
                      if (isServiceProvider()) {
                        // Prüfe alle möglichen Response-Felder
                        const responsesArray = responses || [];
                        const responsesArrayAlt = (apt as any).responses_array || [];
                        const appointmentResponses = (apt as any).appointment_responses || [];
                        const serviceProviderResponses = (apt as any).service_provider_responses || [];
                        
                        const allResponses = [
                          ...responsesArray,
                          ...responsesArrayAlt,
                          ...appointmentResponses,
                          ...serviceProviderResponses
                        ];
                        
                        const hasResponse = responses.some((r: any) => 
                          r.service_provider_id === user?.id || 
                          String(r.service_provider_id) === String(user?.id) ||
                          Number(r.service_provider_id) === Number(user?.id)
                        );
                        
                        const hasResponseExtended = allResponses.some((r: any) => {
                          if (!r) return false;
                          return r.service_provider_id === user?.id || 
                                 String(r.service_provider_id) === String(user?.id) ||
                                 Number(r.service_provider_id) === Number(user?.id) ||
                                 r.user_id === user?.id ||
                                 String(r.user_id) === String(user?.id) ||
                                 Number(r.user_id) === Number(user?.id);
                        });
                        
                        const isInvited = invitedProviders.some((provider: any) => {
                          if (typeof provider === 'number') {
                            return provider === user?.id || 
                                   String(provider) === String(user?.id) ||
                                   Number(provider) === Number(user?.id);
                          } else if (typeof provider === 'object' && provider !== null) {
                            return provider.id === user?.id || 
                                   String(provider.id) === String(user?.id) ||
                                   Number(provider.id) === Number(user?.id);
                          } else if (typeof provider === 'string') {
                            return provider === String(user?.id) ||
                                   Number(provider) === Number(user?.id);
                          }
                          return false;
                        });
                        
                        return hasResponse || hasResponseExtended || isInvited;
                      } else {
                        return apt.created_by === user?.id;
                      }
                    });

                    const hasRelevantAppointments = relevantAppointments.length > 0;
                    
                    return `
                      relative p-3 min-h-[60px] rounded-lg transition-all duration-200 text-left
                      ${day.isCurrentMonth 
                        ? 'text-white hover:bg-white/10' 
                        : 'text-gray-500 hover:bg-white/5'
                      }
                      ${day.isToday 
                        ? 'bg-[#ffbd59]/20 border border-[#ffbd59]/50' 
                        : hasRelevantAppointments
                        ? 'bg-blue-500/15 border border-blue-500/30' 
                        : 'border border-transparent'
                      }
                      ${day.isSelected 
                        ? 'bg-[#ffbd59]/30 border border-[#ffbd59]' 
                        : ''
                      }
                    `;
                  })()}
                >
                  <div className="text-sm font-medium mb-1">
                    {day.date.getDate()}
                  </div>
                  
                  {/* Termin-Indikatoren */}
                  {(() => {
                    // Verwende dieselbe Filterlogik wie in getAppointmentsForDate
                    const relevantAppointments = day.appointments.filter(apt => {
                      const responses = Array.isArray(apt.responses) ? apt.responses : [];
                      const invitedProviders = Array.isArray(apt.invited_service_providers) ? apt.invited_service_providers : [];
                      
                      if (isServiceProvider()) {
                        // Prüfe alle möglichen Response-Felder (erweiterte Logik)
                        const responsesArray = responses || [];
                        const responsesArrayAlt = (apt as any).responses_array || [];
                        const appointmentResponses = (apt as any).appointment_responses || [];
                        const serviceProviderResponses = (apt as any).service_provider_responses || [];
                        
                        const allResponses = [
                          ...responsesArray,
                          ...responsesArrayAlt,
                          ...appointmentResponses,
                          ...serviceProviderResponses
                        ];
                        
                        const hasResponse = responses.some((r: any) => 
                          r.service_provider_id === user?.id || 
                          String(r.service_provider_id) === String(user?.id) ||
                          Number(r.service_provider_id) === Number(user?.id)
                        );
                        
                        const hasResponseExtended = allResponses.some((r: any) => {
                          if (!r) return false;
                          return r.service_provider_id === user?.id || 
                                 String(r.service_provider_id) === String(user?.id) ||
                                 Number(r.service_provider_id) === Number(user?.id) ||
                                 r.user_id === user?.id ||
                                 String(r.user_id) === String(user?.id) ||
                                 Number(r.user_id) === Number(user?.id);
                        });
                        
                        const isInvited = invitedProviders.some((provider: any) => {
                          // Robuste Prüfung für verschiedene Datenstrukturen
                          if (typeof provider === 'number') {
                            return provider === user?.id || 
                                   String(provider) === String(user?.id) ||
                                   Number(provider) === Number(user?.id);
                          } else if (typeof provider === 'object' && provider !== null) {
                            return provider.id === user?.id || 
                                   String(provider.id) === String(user?.id) ||
                                   Number(provider.id) === Number(user?.id);
                          } else if (typeof provider === 'string') {
                            return provider === String(user?.id) ||
                                   Number(provider) === Number(user?.id);
                          }
                          return false;
                        });
                        
                        return hasResponse || hasResponseExtended || isInvited;
                      } else {
                        return apt.created_by === user?.id;
                      }
                    });

                    return relevantAppointments.length > 0 && (
                      <div className="space-y-1">
                        {relevantAppointments.slice(0, 2).map((apt, aptIndex) => {
                          // Verwende ein Standard-Icon falls getAppointmentStatusIcon null zurückgibt
                          const statusIcon = getAppointmentStatusIcon(apt) || <Clock size={12} className="text-blue-400" />;
                          
                          return (
                            <div
                              key={aptIndex}
                              className={`
                                flex items-center gap-1 px-1 py-0.5 rounded text-xs
                                ${getAppointmentStatusColor(apt)}
                              `}
                            >
                              {statusIcon}
                              <span className="truncate">
                                {new Date(apt.scheduled_date).toLocaleTimeString('de-DE', { 
                                  hour: '2-digit', 
                                  minute: '2-digit',
                                  timeZone: 'Europe/Berlin' // Explizite Zeitzone für Deutschland/Schweiz
                                })}
                              </span>
                            </div>
                          );
                        })}
                        {relevantAppointments.length > 2 && (
                          <div className="text-xs text-gray-400">
                            +{relevantAppointments.length - 2} weitere
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </button>
              ))}
            </div>
          </div>

          {/* Termine-Sidebar */}
          <div className="w-80 bg-white/5 border-l border-white/20 p-6 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold text-white">
                {selectedDate.toLocaleDateString('de-DE', { 
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long'
                })}
              </h4>
              {selectedDateAppointments.length > 0 && (
                <span className="px-2 py-1 bg-[#ffbd59]/20 text-[#ffbd59] rounded-full text-xs font-medium">
                  {selectedDateAppointments.length} Termine
                </span>
              )}
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#ffbd59]"></div>
              </div>
            ) : selectedDateAppointments.length > 0 ? (
              <div className="space-y-3">
                {selectedDateAppointments.map((appointment) => {
                  // Verwende dieselbe Filterlogik wie in getAppointmentsForDate
                  const responses = Array.isArray(appointment.responses) ? appointment.responses : [];
                  const invitedProviders = Array.isArray(appointment.invited_service_providers) ? appointment.invited_service_providers : [];
                  
                  // Für Dienstleister: Erweiterte Relevanz-Prüfung
                  if (isServiceProvider()) {
                    // Prüfe alle möglichen Response-Felder
                    const responsesArray = responses || [];
                    const responsesArrayAlt = (appointment as any).responses_array || [];
                    const appointmentResponses = (appointment as any).appointment_responses || [];
                    const serviceProviderResponses = (appointment as any).service_provider_responses || [];
                    
                    // Kombiniere alle Response-Arrays
                    const allResponses = [
                      ...responsesArray,
                      ...responsesArrayAlt,
                      ...appointmentResponses,
                      ...serviceProviderResponses
                    ];
                    
                    const hasResponse = responses.some((r: any) => 
                      r.service_provider_id === user?.id || 
                      String(r.service_provider_id) === String(user?.id) ||
                      Number(r.service_provider_id) === Number(user?.id)
                    );
                    
                    const hasResponseExtended = allResponses.some((r: any) => {
                      if (!r) return false;
                      return r.service_provider_id === user?.id || 
                             String(r.service_provider_id) === String(user?.id) ||
                             Number(r.service_provider_id) === Number(user?.id) ||
                             r.user_id === user?.id ||
                             String(r.user_id) === String(user?.id) ||
                             Number(r.user_id) === Number(user?.id);
                    });
                    
                    const isInvited = invitedProviders.some((provider: any) => {
                      // Robuste Prüfung für verschiedene Datenstrukturen
                      if (typeof provider === 'number') {
                        return provider === user?.id || 
                               String(provider) === String(user?.id) ||
                               Number(provider) === Number(user?.id);
                      } else if (typeof provider === 'object' && provider !== null) {
                        return provider.id === user?.id || 
                               String(provider.id) === String(user?.id) ||
                               Number(provider.id) === Number(user?.id);
                      } else if (typeof provider === 'string') {
                        return provider === String(user?.id) ||
                               Number(provider) === Number(user?.id);
                      }
                      return false;
                    });
                    
                    const isRelevant = hasResponse || hasResponseExtended || isInvited;
                    
                    // Spezielle Debug-Ausgabe für Appointment 14 in Sidebar
                    if (appointment.id === 14) {
                      console.log('🚨 SIDEBAR-FILTERUNG für Appointment 14:', {
                        appointmentId: appointment.id,
                        userId: user?.id,
                        hasResponse: hasResponse,
                        hasResponseExtended: hasResponseExtended,
                        isInvited: isInvited,
                        isRelevant: isRelevant,
                        allResponsesCount: allResponses.length,
                        invitedProvidersCount: invitedProviders.length
                      });
                    }
                    
                    // Zeige Termin wenn User eingeladen wurde oder bereits geantwortet hat
                    if (!isRelevant) {
                      console.log('🚫 Skipping appointment in sidebar - user not invited:', {
                        appointmentId: appointment.id,
                        userId: user?.id,
                        hasResponse: hasResponse,
                        hasResponseExtended: hasResponseExtended,
                        isInvited: isInvited
                      });
                      return null;
                    }
                  }
                  
                  const statusIcon = getAppointmentStatusIcon(appointment);
                  
                  return (
                    <div
                      key={appointment.id}
                      className={`
                        p-4 rounded-xl border backdrop-blur-sm
                        ${getAppointmentStatusColor(appointment)}
                      `}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {statusIcon}
                          <h5 className="font-medium text-white text-sm">
                            {appointment.title}
                          </h5>
                        </div>
                        <span className="text-xs px-2 py-1 bg-white/10 text-white rounded-full">
                          {getAppointmentStatusText(appointment)}
                        </span>
                      </div>

                      <div className="space-y-2 text-xs text-gray-300">
                        <div className="flex items-center gap-2">
                          <Clock size={12} />
                          <span>
                            {new Date(appointment.scheduled_date).toLocaleTimeString('de-DE', {
                              hour: '2-digit',
                              minute: '2-digit',
                              timeZone: 'Europe/Berlin' // Explizite Zeitzone
                            })} ({appointment.duration_minutes} Min.)
                          </span>
                        </div>
                        
                        {appointment.location && (
                          <div className="flex items-center gap-2">
                            <MapPin size={12} />
                            <span className="truncate">{appointment.location}</span>
                          </div>
                        )}

                        {appointment.contact_person && (
                          <div className="flex items-center gap-2">
                            <User size={12} />
                            <span>{appointment.contact_person}</span>
                          </div>
                        )}
                      </div>

                      {appointment.description && (
                        <p className="text-xs text-gray-400 mt-2 line-clamp-2">
                          {appointment.description}
                        </p>
                      )}

                      <div className="flex items-center gap-2 mt-3">
                        <button
                          onClick={() => handleDownloadICS(appointment.id)}
                          className="flex items-center gap-1 px-3 py-1 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors text-xs"
                        >
                          <Download size={12} />
                          ICS
                        </button>
                        
                        {/* Zusätzliche Aktionen je nach Rolle */}
                        {!isServiceProvider() && (
                          <button className="flex items-center gap-1 px-3 py-1 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors text-xs">
                            <Eye size={12} />
                            Details
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <Calendar size={48} className="mx-auto mb-4 text-gray-500" />
                <p className="text-gray-400 text-sm">
                  Keine Termine für diesen Tag
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer mit Statistiken */}
        <div className="flex items-center justify-between p-4 border-t border-white/20 bg-white/5">
          <div className="flex items-center gap-6 text-sm text-gray-300">
            {(() => {
              // Filtere zunächst alle Termine nach Benutzer-Relevanz
              const relevantAppointments = appointments.filter(apt => {
                const responses = Array.isArray(apt.responses) ? apt.responses : [];
                const invitedProviders = Array.isArray(apt.invited_service_providers) ? apt.invited_service_providers : [];
                
                if (isServiceProvider()) {
                  const hasResponse = responses.some((r: any) => 
                    r.service_provider_id === user?.id || 
                    String(r.service_provider_id) === String(user?.id) ||
                    Number(r.service_provider_id) === Number(user?.id)
                  );
                  
                  const isInvited = invitedProviders.some((provider: any) => 
                    provider === user?.id || 
                    provider.id === user?.id || 
                    String(provider === user?.id ? provider : provider.id) === String(user?.id) ||
                    Number(provider === user?.id ? provider : provider.id) === Number(user?.id)
                  );
                  
                  return hasResponse || isInvited;
                } else {
                  return apt.created_by === user?.id;
                }
              });

              return (
                <>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500/50"></div>
                    <span>Bestätigt ({relevantAppointments.filter(apt => {
                      if (isServiceProvider()) {
                        const responses = Array.isArray(apt.responses) ? apt.responses : [];
                        const myResponse = responses.find((r: any) => 
                          r.service_provider_id === user?.id || 
                          String(r.service_provider_id) === String(user?.id) ||
                          Number(r.service_provider_id) === Number(user?.id)
                        );
                        return myResponse?.status === 'accepted';
                      }
                      return apt.status === 'COMPLETED';
                    }).length})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-yellow-500/50"></div>
                    <span>Ausstehend ({relevantAppointments.filter(apt => {
                      if (isServiceProvider()) {
                        const responses = Array.isArray(apt.responses) ? apt.responses : [];
                        const myResponse = responses.find((r: any) => 
                          r.service_provider_id === user?.id || 
                          String(r.service_provider_id) === String(user?.id) ||
                          Number(r.service_provider_id) === Number(user?.id)
                        );
                        return !myResponse || myResponse.status === 'pending';
                      }
                      return apt.status === 'SCHEDULED';
                    }).length})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500/50"></div>
                    <span>Abgelehnt ({relevantAppointments.filter(apt => {
                      if (isServiceProvider()) {
                        const responses = Array.isArray(apt.responses) ? apt.responses : [];
                        const myResponse = responses.find((r: any) => 
                          r.service_provider_id === user?.id || 
                          String(r.service_provider_id) === String(user?.id) ||
                          Number(r.service_provider_id) === Number(user?.id)
                        );
                        return myResponse?.status === 'rejected';
                      }
                      return apt.status === 'CANCELLED';
                    }).length})</span>
                  </div>
                </>
              );
            })()}
          </div>
          
          <button
            onClick={loadAppointments}
            className="px-4 py-2 bg-[#ffbd59]/20 text-[#ffbd59] rounded-lg hover:bg-[#ffbd59]/30 transition-colors text-sm flex items-center gap-2"
          >
            <Calendar size={14} />
            Aktualisieren
          </button>
        </div>
      </div>
    </div>
  );
}
