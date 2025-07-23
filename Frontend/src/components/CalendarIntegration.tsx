import React, { useState, useEffect } from 'react';
import { Calendar, Mail, Download, ExternalLink, Clock, Users, MapPin, Bell, RefreshCw, CheckCircle } from 'lucide-react';

interface CalendarIntegrationProps {
  isProUser: boolean;
  userEmail?: string;
  loginMethod?: 'google' | 'microsoft' | 'email';
}

interface CalendarStatus {
  google_calendar: {
    enabled: boolean;
    connected: boolean;
    token_expires: string | null;
  };
  microsoft_calendar: {
    enabled: boolean;
    connected: boolean;
    token_expires: string | null;
  };
}

interface Project {
  id: number;
  name: string;
  milestones_count: number;
  tasks_count: number;
}

interface MeetingData {
  title: string;
  description: string;
  agenda: string;
  start_time: string;
  end_time: string;
  location: string;
  attendees: string[];
}

export default function CalendarIntegration({ isProUser, userEmail, loginMethod }: CalendarIntegrationProps) {
  const [calendarStatus, setCalendarStatus] = useState<CalendarStatus | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'connect' | 'sync' | 'meeting' | 'download'>('connect');
  const [meetingForm, setMeetingForm] = useState<MeetingData>({
    title: '',
    description: '',
    agenda: '',
    start_time: '',
    end_time: '',
    location: 'Online',
    attendees: []
  });
  const [newAttendee, setNewAttendee] = useState('');
  const [syncStatus, setSyncStatus] = useState<{ [key: number]: string }>({});

  useEffect(() => {
    if (isProUser) {
      loadCalendarStatus();
      loadProjects();
    }
  }, [isProUser]);

  const loadCalendarStatus = async () => {
    try {
      const response = await fetch('/api/v1/calendar/status', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const status = await response.json();
        setCalendarStatus(status);
      }
    } catch (error) {
      console.error('❌ Fehler beim Laden des Kalender-Status:', error);
    }
  };

  const loadProjects = async () => {
    try {
      const response = await fetch('/api/v1/projects/', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const projectsData = await response.json();
        setProjects(projectsData);
      }
    } catch (error) {
      console.error('❌ Fehler beim Laden der Projekte:', error);
    }
  };

  const connectCalendar = async (provider: 'google' | 'microsoft') => {
    try {
      setLoading(true);
      const response = await fetch(`/api/v1/calendar/${provider}/authorize`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        window.location.href = data.authorization_url;
      } else {
        throw new Error(`Fehler beim Verbinden mit ${provider}`);
      }
    } catch (error) {
      console.error(`❌ ${provider} Calendar Verbindung fehlgeschlagen:`, error);
      alert(`Fehler beim Verbinden mit ${provider} Calendar`);
    } finally {
      setLoading(false);
    }
  };

  const disconnectCalendar = async (provider: 'google' | 'microsoft') => {
    try {
      setLoading(true);
      const response = await fetch(`/api/v1/calendar/disconnect/${provider}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        await loadCalendarStatus();
        alert(`${provider === 'google' ? 'Google' : 'Microsoft'} Calendar erfolgreich getrennt`);
      } else {
        throw new Error(`Fehler beim Trennen von ${provider}`);
      }
    } catch (error) {
      console.error(`❌ ${provider} Calendar Trennung fehlgeschlagen:`, error);
      alert(`Fehler beim Trennen von ${provider} Calendar`);
    } finally {
      setLoading(false);
    }
  };

  const syncProjectToCalendar = async (projectId: number, provider: 'google' | 'microsoft') => {
    try {
      setSyncStatus(prev => ({ ...prev, [projectId]: 'syncing' }));
      
      const response = await fetch(`/api/v1/calendar/${provider}/sync-project`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          project_id: projectId,
          sync_milestones: true,
          sync_tasks: true,
          calendar_provider: provider
        })
      });

      if (response.ok) {
        const result = await response.json();
        setSyncStatus(prev => ({ ...prev, [projectId]: 'success' }));
        alert(`✅ ${result.total_synced} Elemente erfolgreich synchronisiert!`);
      } else {
        throw new Error('Synchronisation fehlgeschlagen');
      }
    } catch (error) {
      console.error('❌ Projekt-Synchronisation fehlgeschlagen:', error);
      setSyncStatus(prev => ({ ...prev, [projectId]: 'error' }));
      alert('Fehler bei der Projekt-Synchronisation');
    }
  };

  const createMeeting = async (provider: 'google' | 'microsoft') => {
    try {
      setLoading(true);
      
      const response = await fetch(`/api/v1/calendar/create-meeting?provider=${provider}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(meetingForm)
      });

      if (response.ok) {
        const result = await response.json();
        alert(`✅ Meeting-Einladung über ${provider === 'google' ? 'Google' : 'Microsoft'} erstellt!`);
        
        // Reset form
        setMeetingForm({
          title: '',
          description: '',
          agenda: '',
          start_time: '',
          end_time: '',
          location: 'Online',
          attendees: []
        });
      } else {
        throw new Error('Meeting-Erstellung fehlgeschlagen');
      }
    } catch (error) {
      console.error('❌ Meeting-Erstellung fehlgeschlagen:', error);
      alert('Fehler beim Erstellen des Meetings');
    } finally {
      setLoading(false);
    }
  };

  const downloadProjectCalendar = (projectId: number) => {
    const downloadUrl = `/api/v1/calendar/download/project/${projectId}`;
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = `BuildWise-Projekt-${projectId}.ics`;
    link.click();
  };

  const addAttendee = () => {
    if (newAttendee && !meetingForm.attendees.includes(newAttendee)) {
      setMeetingForm(prev => ({
        ...prev,
        attendees: [...prev.attendees, newAttendee]
      }));
      setNewAttendee('');
    }
  };

  const removeAttendee = (email: string) => {
    setMeetingForm(prev => ({
      ...prev,
      attendees: prev.attendees.filter(a => a !== email)
    }));
  };

  if (!isProUser) {
    return (
      <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10">
        <div className="text-center">
          <Calendar className="w-12 h-12 text-[#ffbd59] mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">
            📅 Kalender-Integration
          </h3>
          <p className="text-gray-300 mb-4">
            Synchronisieren Sie Ihre Projekte mit Google Calendar und Microsoft Outlook
          </p>
          <div className="bg-gradient-to-r from-[#ffbd59] to-[#ffa726] text-[#2c3539] px-4 py-2 rounded-lg inline-block">
            💎 Pro Feature - Upgrade erforderlich
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10">
      {/* Header */}
      <div className="text-center mb-6">
        <Calendar className="w-12 h-12 text-[#ffbd59] mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-white mb-2">
          📅 Kalender & E-Mail Integration
        </h3>
        <p className="text-gray-300 text-sm">
          Verbinden Sie BuildWise mit Ihren Kalender- und E-Mail-Diensten
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-2 mb-6 bg-black/20 rounded-xl p-2">
        {[
          { key: 'connect', label: 'Verbinden', icon: ExternalLink },
          { key: 'sync', label: 'Synchronisieren', icon: RefreshCw },
          { key: 'meeting', label: 'Meeting', icon: Users },
          { key: 'download', label: 'Download', icon: Download }
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === key
                ? 'bg-[#ffbd59] text-[#2c3539]'
                : 'text-gray-300 hover:text-white hover:bg-white/10'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Connect Tab */}
      {activeTab === 'connect' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Google Calendar */}
            <div className="bg-white/10 rounded-xl p-4 border border-white/20">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                  <svg viewBox="0 0 24 24" className="w-5 h-5">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                </div>
                <div>
                  <h4 className="font-semibold text-white">Google Calendar</h4>
                  <p className="text-xs text-gray-400">Calendar + Gmail</p>
                </div>
              </div>
              
              {calendarStatus?.google_calendar?.connected ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-green-400 text-sm">
                    <CheckCircle className="w-4 h-4" />
                    Verbunden
                  </div>
                  <button
                    onClick={() => disconnectCalendar('google')}
                    disabled={loading}
                    className="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                  >
                    Trennen
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => connectCalendar('google')}
                  disabled={loading}
                  className="w-full bg-[#4285F4] hover:bg-[#3367D6] text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                >
                  {loading ? 'Verbinde...' : 'Verbinden'}
                </button>
              )}
            </div>

            {/* Microsoft Calendar */}
            <div className="bg-white/10 rounded-xl p-4 border border-white/20">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                  <svg viewBox="0 0 24 24" className="w-5 h-5">
                    <path fill="#F25022" d="M1 1h10v10H1z"/>
                    <path fill="#00A4EF" d="M13 1h10v10H13z"/>
                    <path fill="#7FBA00" d="M1 13h10v10H1z"/>
                    <path fill="#FFB900" d="M13 13h10v10H13z"/>
                  </svg>
                </div>
                <div>
                  <h4 className="font-semibold text-white">Microsoft Outlook</h4>
                  <p className="text-xs text-gray-400">Calendar + Mail</p>
                </div>
              </div>
              
              {calendarStatus?.microsoft_calendar?.connected ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-green-400 text-sm">
                    <CheckCircle className="w-4 h-4" />
                    Verbunden
                  </div>
                  <button
                    onClick={() => disconnectCalendar('microsoft')}
                    disabled={loading}
                    className="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                  >
                    Trennen
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => connectCalendar('microsoft')}
                  disabled={loading}
                  className="w-full bg-[#00A4EF] hover:bg-[#0078D4] text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                >
                  {loading ? 'Verbinde...' : 'Verbinden'}
                </button>
              )}
            </div>
          </div>

          {/* Recommendation */}
          {loginMethod && (
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <Bell className="w-5 h-5 text-blue-400 mt-0.5" />
                <div>
                  <h4 className="text-blue-300 font-medium text-sm mb-1">
                    Empfehlung basierend auf Ihrer Anmeldung
                  </h4>
                  <p className="text-blue-200 text-xs">
                    {loginMethod === 'google' 
                      ? 'Da Sie sich mit Google angemeldet haben, empfehlen wir die Google Calendar Integration.'
                      : loginMethod === 'microsoft'
                      ? 'Da Sie sich mit Microsoft angemeldet haben, empfehlen wir die Microsoft Outlook Integration.'
                      : 'Wählen Sie die Plattform, die Sie bevorzugen.'
                    }
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Sync Tab */}
      {activeTab === 'sync' && (
        <div className="space-y-4">
          <div className="text-center mb-4">
            <h4 className="text-lg font-semibold text-white mb-2">Projekt-Synchronisation</h4>
            <p className="text-gray-300 text-sm">
              Synchronisieren Sie Meilensteine und Aufgaben mit Ihrem Kalender
            </p>
          </div>

          {projects.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-400">Keine Projekte verfügbar</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {projects.map((project) => (
                <div key={project.id} className="bg-white/10 rounded-xl p-4 border border-white/20">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h5 className="font-semibold text-white">{project.name}</h5>
                      <p className="text-xs text-gray-400">
                        {project.milestones_count} Meilensteine • {project.tasks_count} Aufgaben
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {calendarStatus?.google_calendar?.connected && (
                        <button
                          onClick={() => syncProjectToCalendar(project.id, 'google')}
                          disabled={syncStatus[project.id] === 'syncing'}
                          className="bg-[#4285F4] hover:bg-[#3367D6] text-white px-3 py-1 rounded-lg text-xs font-medium transition-colors disabled:opacity-50 flex items-center gap-1"
                        >
                          {syncStatus[project.id] === 'syncing' ? (
                            <>
                              <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                              Sync...
                            </>
                          ) : syncStatus[project.id] === 'success' ? (
                            <>
                              <CheckCircle className="w-3 h-3" />
                              Google ✓
                            </>
                          ) : (
                            <>
                              <RefreshCw className="w-3 h-3" />
                              Google
                            </>
                          )}
                        </button>
                      )}
                      {calendarStatus?.microsoft_calendar?.connected && (
                        <button
                          onClick={() => syncProjectToCalendar(project.id, 'microsoft')}
                          disabled={syncStatus[project.id] === 'syncing'}
                          className="bg-[#00A4EF] hover:bg-[#0078D4] text-white px-3 py-1 rounded-lg text-xs font-medium transition-colors disabled:opacity-50 flex items-center gap-1"
                        >
                          {syncStatus[project.id] === 'syncing' ? (
                            <>
                              <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                              Sync...
                            </>
                          ) : syncStatus[project.id] === 'success' ? (
                            <>
                              <CheckCircle className="w-3 h-3" />
                              Outlook ✓
                            </>
                          ) : (
                            <>
                              <RefreshCw className="w-3 h-3" />
                              Outlook
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Meeting Tab */}
      {activeTab === 'meeting' && (
        <div className="space-y-4">
          <div className="text-center mb-4">
            <h4 className="text-lg font-semibold text-white mb-2">Meeting erstellen</h4>
            <p className="text-gray-300 text-sm">
              Erstellen Sie Meeting-Einladungen direkt aus BuildWise
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Titel</label>
                <input
                  type="text"
                  value={meetingForm.title}
                  onChange={(e) => setMeetingForm(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#ffbd59]"
                  placeholder="Meeting-Titel"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Beschreibung</label>
                <textarea
                  value={meetingForm.description}
                  onChange={(e) => setMeetingForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#ffbd59] h-20"
                  placeholder="Meeting-Beschreibung"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Agenda</label>
                <textarea
                  value={meetingForm.agenda}
                  onChange={(e) => setMeetingForm(prev => ({ ...prev, agenda: e.target.value }))}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#ffbd59] h-20"
                  placeholder="Meeting-Agenda"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Start</label>
                  <input
                    type="datetime-local"
                    value={meetingForm.start_time}
                    onChange={(e) => setMeetingForm(prev => ({ ...prev, start_time: e.target.value }))}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#ffbd59]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Ende</label>
                  <input
                    type="datetime-local"
                    value={meetingForm.end_time}
                    onChange={(e) => setMeetingForm(prev => ({ ...prev, end_time: e.target.value }))}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#ffbd59]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Ort</label>
                <input
                  type="text"
                  value={meetingForm.location}
                  onChange={(e) => setMeetingForm(prev => ({ ...prev, location: e.target.value }))}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#ffbd59]"
                  placeholder="Meeting-Ort oder Online"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Teilnehmer</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="email"
                    value={newAttendee}
                    onChange={(e) => setNewAttendee(e.target.value)}
                    className="flex-1 bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#ffbd59]"
                    placeholder="E-Mail-Adresse"
                    onKeyPress={(e) => e.key === 'Enter' && addAttendee()}
                  />
                  <button
                    onClick={addAttendee}
                    className="bg-[#ffbd59] hover:bg-[#ffa726] text-[#2c3539] px-3 py-2 rounded-lg font-medium transition-colors"
                  >
                    +
                  </button>
                </div>
                <div className="space-y-1">
                  {meetingForm.attendees.map((email) => (
                    <div key={email} className="flex items-center justify-between bg-white/5 rounded-lg px-3 py-1">
                      <span className="text-sm text-gray-300">{email}</span>
                      <button
                        onClick={() => removeAttendee(email)}
                        className="text-red-400 hover:text-red-300 text-xs"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-2 justify-center pt-4">
            {calendarStatus?.google_calendar?.connected && (
              <button
                onClick={() => createMeeting('google')}
                disabled={loading || !meetingForm.title || !meetingForm.start_time}
                className="bg-[#4285F4] hover:bg-[#3367D6] text-white px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                <Users className="w-4 h-4" />
                Google Meeting
              </button>
            )}
            {calendarStatus?.microsoft_calendar?.connected && (
              <button
                onClick={() => createMeeting('microsoft')}
                disabled={loading || !meetingForm.title || !meetingForm.start_time}
                className="bg-[#00A4EF] hover:bg-[#0078D4] text-white px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                <Users className="w-4 h-4" />
                Teams Meeting
              </button>
            )}
          </div>
        </div>
      )}

      {/* Download Tab */}
      {activeTab === 'download' && (
        <div className="space-y-4">
          <div className="text-center mb-4">
            <h4 className="text-lg font-semibold text-white mb-2">Kalender-Downloads</h4>
            <p className="text-gray-300 text-sm">
              Laden Sie ICS-Dateien herunter für alle Kalender-Apps
            </p>
          </div>

          {projects.length === 0 ? (
            <div className="text-center py-8">
              <Download className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-400">Keine Projekte verfügbar</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {projects.map((project) => (
                <div key={project.id} className="bg-white/10 rounded-xl p-4 border border-white/20">
                  <div className="flex items-center justify-between">
                    <div>
                      <h5 className="font-semibold text-white">{project.name}</h5>
                      <p className="text-xs text-gray-400">
                        {project.milestones_count} Meilensteine • {project.tasks_count} Aufgaben
                      </p>
                    </div>
                    <button
                      onClick={() => downloadProjectCalendar(project.id)}
                      className="bg-[#ffbd59] hover:bg-[#ffa726] text-[#2c3539] px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      ICS Download
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-blue-400 mt-0.5" />
              <div>
                <h4 className="text-blue-300 font-medium text-sm mb-1">
                  ICS-Dateien verwenden
                </h4>
                <p className="text-blue-200 text-xs">
                  ICS-Dateien können in alle gängigen Kalender-Apps importiert werden: 
                  Apple Calendar, Google Calendar, Outlook, Thunderbird und viele mehr.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pro Badge */}
      <div className="mt-6 text-center">
        <span className="inline-flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-[#ffbd59] to-[#ffa726] text-[#2c3539] rounded-full text-xs font-semibold">
          <span>💎</span>
          Pro Feature
        </span>
      </div>
    </div>
  );
} 