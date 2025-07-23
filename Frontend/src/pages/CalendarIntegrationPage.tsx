import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useProject } from '../context/ProjectContext';
import CalendarIntegration from '../components/CalendarIntegration';
import ShareCalendarButtons from '../components/ShareCalendarButtons';
import SmartMeetingScheduler from '../components/SmartMeetingScheduler';
import EmailNotificationButton from '../components/EmailNotificationButton';
import { 
  Calendar, 
  CalendarPlus, 
  Mail, 
  Download, 
  Share2, 
  Clock,
  Users,
  ArrowLeft,
  CheckCircle,
  ExternalLink,
  Settings
} from 'lucide-react';

export default function CalendarIntegrationPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { selectedProject, projects } = useProject();
  const [activeTab, setActiveTab] = useState<'connect' | 'sync' | 'schedule' | 'export'>('connect');
  const [integrationStatus, setIntegrationStatus] = useState({
    google: false,
    microsoft: false
  });

  // Lade Integration-Status
  useEffect(() => {
    const fetchIntegrationStatus = async () => {
      try {
        const response = await fetch('/api/v1/calendar/status', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (response.ok) {
          const status = await response.json();
          setIntegrationStatus(status);
        }
      } catch (error) {
        console.error('Fehler beim Laden des Integration-Status:', error);
      }
    };

    fetchIntegrationStatus();
  }, []);

  const tabs = [
    { id: 'connect', label: 'Verbinden', icon: <Settings size={20} /> },
    { id: 'sync', label: 'Synchronisieren', icon: <Calendar size={20} /> },
    { id: 'schedule', label: 'Termine planen', icon: <CalendarPlus size={20} /> },
    { id: 'export', label: 'Exportieren', icon: <Download size={20} /> }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460] p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button 
            onClick={() => navigate('/dashboard')}
            className="p-2 bg-[#51646f] hover:bg-[#607583] rounded-xl transition-colors duration-300"
          >
            <ArrowLeft size={20} className="text-[#ffbd59]" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-white">Kalender-Integration</h1>
            <p className="text-gray-300">Verbinden Sie Ihre Kalender und optimieren Sie Ihre Terminplanung</p>
          </div>
        </div>

        {/* Integration Status */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">Verbindungsstatus</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">G</span>
                </div>
                <span className="text-white font-medium">Google Calendar</span>
              </div>
              <div className="flex items-center gap-2">
                {integrationStatus.google ? (
                  <>
                    <CheckCircle size={20} className="text-green-400" />
                    <span className="text-green-400 text-sm">Verbunden</span>
                  </>
                ) : (
                  <span className="text-gray-400 text-sm">Nicht verbunden</span>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">M</span>
                </div>
                <span className="text-white font-medium">Microsoft Outlook</span>
              </div>
              <div className="flex items-center gap-2">
                {integrationStatus.microsoft ? (
                  <>
                    <CheckCircle size={20} className="text-green-400" />
                    <span className="text-green-400 text-sm">Verbunden</span>
                  </>
                ) : (
                  <span className="text-gray-400 text-sm">Nicht verbunden</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 overflow-hidden">
          {/* Tab Navigation */}
          <div className="flex border-b border-white/20">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-[#ffbd59] text-[#2c3539]'
                    : 'text-gray-300 hover:text-white hover:bg-white/5'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'connect' && (
              <div>
                <h3 className="text-xl font-semibold text-white mb-4">Kalender verbinden</h3>
                <CalendarIntegration 
                  isProUser={user?.subscription_plan === 'pro'}
                  userEmail={user?.email}
                  loginMethod={user?.oauth_provider as 'google' | 'microsoft' | 'email'}
                />
              </div>
            )}

            {activeTab === 'sync' && (
              <div>
                <h3 className="text-xl font-semibold text-white mb-4">Projekte synchronisieren</h3>
                <div className="space-y-4">
                  {projects.map((project) => (
                    <div key={project.id} className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10">
                      <div>
                        <h4 className="text-white font-medium">{project.name}</h4>
                        <p className="text-gray-400 text-sm">{project.description}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <ShareCalendarButtons
                          title={`Projekt: ${project.name}`}
                          description={project.description || ''}
                          startTime={new Date(project.start_date || Date.now())}
                          endTime={new Date(project.end_date || Date.now() + 90 * 24 * 60 * 60 * 1000)}
                          location={`${project.address || ''} ${project.city || ''}`.trim()}
                          type="event"
                          projectName={project.name}
                          itemId={project.id}
                        />
                        <EmailNotificationButton
                          projectId={project.id}
                          projectName={project.name}
                          subject={`Update zu Projekt: ${project.name}`}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'schedule' && (
              <div>
                <h3 className="text-xl font-semibold text-white mb-4">Termine planen</h3>
                {selectedProject ? (
                  <SmartMeetingScheduler
                    projectId={selectedProject.id}
                    onMeetingCreated={(meetingId) => console.log('Meeting erstellt:', meetingId)}
                  />
                ) : (
                  <div className="text-center py-12">
                    <Calendar size={48} className="text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-400">Wählen Sie ein Projekt aus, um Termine zu planen</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'export' && (
              <div>
                <h3 className="text-xl font-semibold text-white mb-4">Kalender exportieren</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-6 bg-white/5 rounded-lg border border-white/10">
                    <div className="flex items-center gap-3 mb-4">
                      <Download size={24} className="text-[#ffbd59]" />
                      <h4 className="text-lg font-medium text-white">ICS-Dateien</h4>
                    </div>
                    <p className="text-gray-400 mb-4">
                      Exportieren Sie Ihre Projekte als universelle ICS-Dateien für jeden Kalender.
                    </p>
                    <div className="space-y-2">
                      {projects.slice(0, 3).map((project) => (
                        <button
                          key={project.id}
                          onClick={() => {
                            // ICS-Download implementieren
                            window.open(`/api/v1/calendar/download/project/${project.id}`, '_blank');
                          }}
                          className="w-full text-left p-3 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-white text-sm">{project.name}</span>
                            <ExternalLink size={16} className="text-gray-400" />
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="p-6 bg-white/5 rounded-lg border border-white/10">
                    <div className="flex items-center gap-3 mb-4">
                      <Share2 size={24} className="text-[#ffbd59]" />
                      <h4 className="text-lg font-medium text-white">Universal-Links</h4>
                    </div>
                    <p className="text-gray-400 mb-4">
                      Erstellen Sie Links für Google Calendar, Outlook und andere Kalender-Apps.
                    </p>
                    <div className="grid grid-cols-3 gap-2">
                      <button className="p-3 bg-red-500/20 hover:bg-red-500/30 rounded-lg text-red-300 text-sm transition-colors">
                        Google
                      </button>
                      <button className="p-3 bg-blue-500/20 hover:bg-blue-500/30 rounded-lg text-blue-300 text-sm transition-colors">
                        Outlook
                      </button>
                      <button className="p-3 bg-purple-500/20 hover:bg-purple-500/30 rounded-lg text-purple-300 text-sm transition-colors">
                        Yahoo
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 