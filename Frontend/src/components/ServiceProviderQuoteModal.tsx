import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  X, 
  Calendar, 
  Euro, 
  Clock, 
  User, 
  Phone, 
  Mail, 
  Globe,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Info,
  Download,
  Eye,
  MapPin,
  FileText,
  Building,
  Wrench,
  Shield,
  MessageSquare,
  Bell,
  CalendarCheck,
  CalendarX,
  CalendarClock
} from 'lucide-react';
import { appointmentService } from '../api/appointmentService';

interface ServiceProviderQuoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  trade: any;
  quote: any; // Das eigene Angebot des Dienstleisters
  project: any;
}

interface AppointmentInfo {
  id: number;
  title: string;
  scheduled_date: string;
  status: string;
  location?: string;
  duration_minutes: number;
  userResponse?: {
    status: 'accepted' | 'rejected' | 'rejected_with_suggestion';
    message?: string;
    suggested_date?: string;
    responded_at: string;
  };
}

export default function ServiceProviderQuoteModal({ 
  isOpen, 
  onClose, 
  trade, 
  quote,
  project
}: ServiceProviderQuoteModalProps) {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<AppointmentInfo[]>([]);
  const [loadingAppointments, setLoadingAppointments] = useState(false);

  useEffect(() => {
    if (isOpen && trade?.requires_inspection) {
      loadAppointments();
    }
  }, [isOpen, trade]);

  // Event-Listener für Terminantwort-Updates
  useEffect(() => {
    const handleAppointmentUpdate = () => {
      if (isOpen && trade?.requires_inspection) {
        loadAppointments();
      }
    };

    window.addEventListener('appointmentUpdated', handleAppointmentUpdate);
    return () => {
      window.removeEventListener('appointmentUpdated', handleAppointmentUpdate);
    };
  }, [isOpen, trade]);

  const loadAppointments = async () => {
    try {
      setLoadingAppointments(true);
      
      // Lade alle Termine für dieses Gewerk
      const response = await fetch('http://localhost:8000/api/v1/appointments/my-appointments-simple', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        
        // Filtere nur Termine für dieses Gewerk
        const relevantAppointments = (data.appointments || [])
          .filter((apt: any) => apt.milestone_id === trade.id)
          .map((apt: any) => {
                                      // Neue Datenstruktur: Verwende responses_array falls verfügbar, sonst Fallback auf JSON-Parsing
             let responses = [];
             
             if (apt.responses_array && Array.isArray(apt.responses_array)) {
               // Neue Struktur: Direkt als Array verfügbar
               responses = apt.responses_array;
               } else {
               // Fallback: Legacy JSON-Parsing für Kompatibilität
               try {
                 if (apt.responses) {
                   if (typeof apt.responses === 'string') {
                     responses = JSON.parse(apt.responses);
                   } else if (Array.isArray(apt.responses)) {
                     responses = apt.responses;
                   } else if (typeof apt.responses === 'object' && apt.responses !== null) {
                     responses = Array.isArray(apt.responses) ? apt.responses : [apt.responses];
                   }
                   
                   }
               } catch (e) {
                 console.error('❌ Fehler beim Parsen der legacy responses für Termin', apt.id, e);
                 responses = [];
               }
             }
            
             // Finde die eigene Antwort (robuste Typ-Konvertierung für alle Browser)
             const myResponse = Array.isArray(responses) ? responses.find((r: any) => {
               const responseProviderId = parseInt(String(r.service_provider_id));
               const currentUserId = parseInt(String(user?.id));
               const match = responseProviderId === currentUserId && responseProviderId > 0 && currentUserId > 0;
               return match;
             }) : undefined;
            
            console.log(`🔍 ServiceProviderQuoteModal - Termin ${apt.id}: responses=${JSON.stringify(responses)}, myResponse=${JSON.stringify(myResponse)}, userId=${user?.id}`);
            
            return {
              id: apt.id,
              title: apt.title,
              scheduled_date: apt.scheduled_date,
              status: apt.status,
              location: apt.location,
              duration_minutes: apt.duration_minutes,
              userResponse: myResponse ? {
                status: myResponse.status,
                message: myResponse.message,
                suggested_date: myResponse.suggested_date,
                responded_at: myResponse.responded_at
              } : undefined
            };
          });
        
        setAppointments(relevantAppointments);
      }
    } catch (error) {
      console.error('Fehler beim Laden der Termine:', error);
    } finally {
      setLoadingAppointments(false);
    }
  };

  if (!isOpen || !trade || !quote) return null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'submitted':
        return <Clock className="text-blue-500" size={16} />;
      case 'under_review':
        return <Eye className="text-yellow-500" size={16} />;
      case 'accepted':
        return <CheckCircle className="text-green-500" size={16} />;
      case 'rejected':
        return <XCircle className="text-red-500" size={16} />;
      default:
        return <Info className="text-gray-500" size={16} />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'draft':
        return 'Entwurf';
      case 'submitted':
        return 'Eingereicht';
      case 'under_review':
        return 'In Prüfung';
      case 'accepted':
        return 'Angenommen';
      case 'rejected':
        return 'Abgelehnt';
      default:
        return status;
    }
  };

  const getResponseIcon = (status?: string) => {
    switch (status) {
      case 'accepted':
        return <CalendarCheck className="text-green-500" size={20} />;
      case 'rejected':
        return <CalendarX className="text-red-500" size={20} />;
      case 'rejected_with_suggestion':
        return <CalendarClock className="text-yellow-500" size={20} />;
      default:
        return <Calendar className="text-gray-400" size={20} />;
    }
  };

  const getResponseText = (status?: string) => {
    switch (status) {
      case 'accepted':
        return 'Termin zugesagt';
      case 'rejected':
        return 'Termin abgesagt';
      case 'rejected_with_suggestion':
        return 'Alternativtermin vorgeschlagen';
      default:
        return 'Keine Antwort';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-[#1a1a1a] rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#2a2a2a] to-[#3a3a3a] p-6 border-b border-gray-700">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Mein Angebot</h2>
              <p className="text-gray-400">{trade.title}</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        <div className="overflow-y-auto max-h-[calc(90vh-100px)]">
          <div className="p-6 space-y-6">
            {/* Projekt-Informationen */}
            <div className="bg-[#2a2a2a] rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Building size={20} className="text-[#ffbd59]" />
                Projekt-Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-400 text-sm">Projekt</p>
                  <p className="text-white font-medium">{project?.name || 'Nicht angegeben'}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Standort</p>
                  <p className="text-white font-medium flex items-center gap-1">
                    <MapPin size={14} />
                    {project?.location || 'Nicht angegeben'}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Bauherr</p>
                  <p className="text-white font-medium">{project?.owner_name || 'Nicht angegeben'}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Geplanter Start</p>
                  <p className="text-white font-medium">
                    {trade.planned_date ? formatDate(trade.planned_date) : 'Nicht angegeben'}
                  </p>
                </div>
              </div>
            </div>

            {/* Gewerk-Details */}
            <div className="bg-[#2a2a2a] rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Wrench size={20} className="text-[#ffbd59]" />
                Gewerk-Anforderungen
              </h3>
              <div className="space-y-3">
                <div>
                  <p className="text-gray-400 text-sm mb-1">Beschreibung</p>
                  <p className="text-white">{trade.description || 'Keine Beschreibung vorhanden'}</p>
                </div>
                {trade.requirements && (
                  <div>
                    <p className="text-gray-400 text-sm mb-1">Spezielle Anforderungen</p>
                    <p className="text-white">{trade.requirements}</p>
                  </div>
                )}
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <Shield size={14} className="text-green-400" />
                    <span className="text-gray-300">
                      Besichtigung: {trade.requires_inspection ? 'Erforderlich' : 'Nicht erforderlich'}
                    </span>
                  </div>
                  {trade.budget && (
                    <div className="flex items-center gap-1">
                      <Euro size={14} className="text-blue-400" />
                      <span className="text-gray-300">
                        Budget: {formatCurrency(trade.budget)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Mein Angebot */}
            <div className="bg-[#2a2a2a] rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <FileText size={20} className="text-[#ffbd59]" />
                Mein eingereichtes Angebot
              </h3>
              
              {quote ? (
                <div className="space-y-4">
                  {/* Status */}
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Status</span>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(quote.status)}
                      <span className={`font-medium ${
                        quote.status === 'accepted' ? 'text-green-400' :
                      quote.status === 'rejected' ? 'text-red-400' :
                      'text-white'
                    }`}>
                      {getStatusText(quote.status)}
                    </span>
                  </div>
                </div>

                {/* Preis */}
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Angebotspreis</span>
                  <span className="text-2xl font-bold text-[#ffbd59]">
                    {formatCurrency(quote.total_price)}
                  </span>
                </div>

                {/* Details */}
                <div className="border-t border-gray-600 pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Eingereicht am</span>
                    <span className="text-white">{formatDate(quote.created_at)}</span>
                  </div>
                  {quote.valid_until && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Gültig bis</span>
                      <span className="text-white">{formatDate(quote.valid_until)}</span>
                    </div>
                  )}
                  {quote.execution_time && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Ausführungszeit</span>
                      <span className="text-white">{quote.execution_time}</span>
                    </div>
                  )}
                </div>

                {/* Beschreibung */}
                {quote.description && (
                  <div className="border-t border-gray-600 pt-4">
                    <p className="text-gray-400 text-sm mb-2">Angebotsbeschreibung</p>
                    <p className="text-white">{quote.description}</p>
                  </div>
                )}

                {/* Ablehnungsgrund */}
                {quote.status === 'rejected' && quote.rejection_reason && (
                  <div className="bg-red-900/20 border border-red-800 rounded-lg p-4 mt-4">
                    <p className="text-red-400 font-medium mb-1">Ablehnungsgrund:</p>
                    <p className="text-red-200">{quote.rejection_reason}</p>
                  </div>
                )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText size={48} className="text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-400">Noch kein Angebot eingereicht</p>
                  <p className="text-gray-500 text-sm mt-1">
                    Sie haben für dieses Gewerk noch kein Angebot abgegeben
                  </p>
                </div>
              )}
            </div>

            {/* Besichtigungstermine */}
            {trade.requires_inspection && (
              <div className="bg-[#2a2a2a] rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Calendar size={20} className="text-[#ffbd59]" />
                  Besichtigungstermine
                </h3>
                
                {loadingAppointments ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#ffbd59] mx-auto"></div>
                    <p className="text-gray-400 mt-2">Lade Termine...</p>
                  </div>
                ) : appointments.length === 0 ? (
                  <div className="text-center py-8">
                    <Bell size={48} className="text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-400">Noch keine Besichtigungstermine geplant</p>
                    <p className="text-gray-500 text-sm mt-1">
                      Sie werden benachrichtigt, sobald ein Termin angesetzt wird
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {appointments.map((appointment) => (
                      <div key={appointment.id} className="border border-gray-600 rounded-lg p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h4 className="text-white font-medium">{appointment.title}</h4>
                            <p className="text-gray-400 text-sm mt-1">
                              {formatDate(appointment.scheduled_date)}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            {getResponseIcon(appointment.userResponse?.status)}
                          </div>
                        </div>
                        
                        {appointment.location && (
                          <div className="flex items-center gap-2 text-sm text-gray-300 mb-2">
                            <MapPin size={14} />
                            <span>{appointment.location}</span>
                          </div>
                        )}
                        
                        <div className="flex items-center gap-2 text-sm text-gray-300 mb-3">
                          <Clock size={14} />
                          <span>Dauer: {appointment.duration_minutes} Minuten</span>
                        </div>
                        
                        {/* Meine Antwort */}
                        <div className={`rounded-lg p-3 ${
                          appointment.userResponse?.status === 'accepted' ? 'bg-green-900/20 border border-green-800' :
                          appointment.userResponse?.status === 'rejected' ? 'bg-red-900/20 border border-red-800' :
                          appointment.userResponse?.status === 'rejected_with_suggestion' ? 'bg-yellow-900/20 border border-yellow-800' :
                          'bg-gray-800 border border-gray-600'
                        }`}>
                          <p className={`font-medium mb-1 ${
                            appointment.userResponse?.status === 'accepted' ? 'text-green-400' :
                            appointment.userResponse?.status === 'rejected' ? 'text-red-400' :
                            appointment.userResponse?.status === 'rejected_with_suggestion' ? 'text-yellow-400' :
                            'text-gray-400'
                          }`}>
                            {getResponseText(appointment.userResponse?.status)}
                          </p>
                          
                          {appointment.userResponse?.message && (
                            <p className="text-gray-300 text-sm mb-2">
                              <MessageSquare size={14} className="inline mr-1" />
                              {appointment.userResponse.message}
                            </p>
                          )}
                          
                          {appointment.userResponse?.suggested_date && (
                            <p className="text-yellow-300 text-sm">
                              <CalendarClock size={14} className="inline mr-1" />
                              Alternativtermin: {formatDate(appointment.userResponse.suggested_date)}
                            </p>
                          )}
                          
                          {!appointment.userResponse && (
                            <div className="space-y-3">
                              <p className="text-gray-400 text-sm mb-3">
                                Bitte antworten Sie auf die Einladung:
                              </p>
                              <div className="flex gap-2">
                                <button
                                  onClick={async () => {
                                    try {
                                      await appointmentService.respondToAppointment({
                                        appointment_id: appointment.id,
                                        status: 'accepted'
                                      });
                                      // Termine neu laden
                                      await loadAppointments();
                                      // Event für andere Komponenten
                                      window.dispatchEvent(new CustomEvent('appointmentUpdated'));
                                    } catch (error) {
                                      console.error('❌ Fehler beim Zusagen:', error);
                                      alert('Fehler beim Zusagen des Termins');
                                    }
                                  }}
                                  className="flex-1 px-4 py-2 text-sm rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30 transition-colors flex items-center justify-center gap-2"
                                >
                                  <CheckCircle size={16} />
                                  Zusagen
                                </button>
                                <button
                                  onClick={async () => {
                                    try {
                                      await appointmentService.respondToAppointment({
                                        appointment_id: appointment.id,
                                        status: 'rejected'
                                      });
                                      // Termine neu laden
                                      await loadAppointments();
                                      // Event für andere Komponenten
                                      window.dispatchEvent(new CustomEvent('appointmentUpdated'));
                                    } catch (error) {
                                      console.error('❌ Fehler beim Absagen:', error);
                                      alert('Fehler beim Absagen des Termins');
                                    }
                                  }}
                                  className="flex-1 px-4 py-2 text-sm rounded-lg bg-red-500/20 text-red-300 border border-red-500/30 hover:bg-red-500/30 transition-colors flex items-center justify-center gap-2"
                                >
                                  <XCircle size={16} />
                                  Absagen
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Kontaktinformationen */}
            <div className="bg-[#2a2a2a] rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <User size={20} className="text-[#ffbd59]" />
                Meine Kontaktdaten
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <User size={16} className="text-gray-400" />
                  <span className="text-white">{user?.first_name} {user?.last_name}</span>
                </div>
                {user?.company_name && (
                  <div className="flex items-center gap-2">
                    <Building size={16} className="text-gray-400" />
                    <span className="text-white">{user.company_name}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Mail size={16} className="text-gray-400" />
                  <span className="text-white">{user?.email}</span>
                </div>
                {user?.phone && (
                  <div className="flex items-center gap-2">
                    <Phone size={16} className="text-gray-400" />
                    <span className="text-white">{user.phone}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 
