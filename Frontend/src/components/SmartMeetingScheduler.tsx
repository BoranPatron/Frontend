import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Users, MapPin, AlertCircle, CheckCircle, Loader2, Brain, Zap, Mail } from 'lucide-react';

interface SmartMeetingSchedulerProps {
  projectId?: number;
  initialAttendees?: string[];
  onMeetingCreated?: (meetingId: string) => void;
  className?: string;
}

interface TimeSlot {
  start: string;
  end: string;
  date: string;
  time: string;
  available: boolean;
  confidence: 'high' | 'medium' | 'low';
}

interface AvailabilityResult {
  available: boolean;
  busy_times: any[];
  suggested_times: TimeSlot[];
  provider: string;
}

interface MeetingForm {
  title: string;
  description: string;
  agenda: string;
  duration: number; // in minutes
  location: string;
  attendees: string[];
  priority: 'low' | 'medium' | 'high' | 'urgent';
  meetingType: 'planning' | 'review' | 'coordination' | 'decision' | 'other';
}

export default function SmartMeetingScheduler({ 
  projectId, 
  initialAttendees = [], 
  onMeetingCreated,
  className = ""
}: SmartMeetingSchedulerProps) {
  const [step, setStep] = useState<'form' | 'availability' | 'confirm'>('form');
  const [loading, setLoading] = useState(false);
  const [availabilityResults, setAvailabilityResults] = useState<AvailabilityResult | null>(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<TimeSlot | null>(null);
  const [newAttendee, setNewAttendee] = useState('');
  const [smartSuggestions, setSmartSuggestions] = useState<string[]>([]);
  
  const [meetingForm, setMeetingForm] = useState<MeetingForm>({
    title: '',
    description: '',
    agenda: '',
    duration: 60,
    location: 'Online',
    attendees: initialAttendees,
    priority: 'medium',
    meetingType: 'planning'
  });

  useEffect(() => {
    if (meetingForm.meetingType) {
      generateSmartSuggestions();
    }
  }, [meetingForm.meetingType, projectId]);

  const generateSmartSuggestions = () => {
    const suggestions: { [key: string]: string[] } = {
      planning: [
        'Projektplanung und Meilensteine definieren',
        'Ressourcenallokation besprechen',
        'Zeitplan und Abhängigkeiten klären',
        'Risiken und Mitigation-Strategien diskutieren'
      ],
      review: [
        'Fortschritt der letzten Woche reviewen',
        'Qualitätskontrolle und Standards prüfen',
        'Budget und Kosten analysieren',
        'Stakeholder-Feedback einbeziehen'
      ],
      coordination: [
        'Team-Synchronisation und Updates',
        'Schnittstellen zwischen Gewerken klären',
        'Logistik und Materialplanung',
        'Kommunikation mit Subunternehmern'
      ],
      decision: [
        'Wichtige Projektentscheidungen treffen',
        'Änderungsanträge bewerten',
        'Budgetfreigaben diskutieren',
        'Eskalationen und Probleme lösen'
      ],
      other: [
        'Allgemeine Projektbesprechung',
        'Team-Building und Motivation',
        'Wissenstransfer und Schulung',
        'Retrospektive und Lessons Learned'
      ]
    };

    setSmartSuggestions(suggestions[meetingForm.meetingType] || []);
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

  const applySuggestion = (suggestion: string) => {
    if (meetingForm.agenda) {
      setMeetingForm(prev => ({
        ...prev,
        agenda: prev.agenda + '\n• ' + suggestion
      }));
    } else {
      setMeetingForm(prev => ({
        ...prev,
        agenda: '• ' + suggestion
      }));
    }
  };

  const checkAvailability = async () => {
    if (!meetingForm.title || !meetingForm.duration) {
      alert('Bitte füllen Sie mindestens Titel und Dauer aus');
      return;
    }

    setLoading(true);
    setStep('availability');

    try {
      // Generiere mehrere Zeitslots für die nächsten 7 Tage
      const timeSlots: TimeSlot[] = [];
      const now = new Date();
      
      for (let dayOffset = 1; dayOffset <= 7; dayOffset++) {
        const checkDate = new Date(now);
        checkDate.setDate(now.getDate() + dayOffset);
        
        // Prüfe verschiedene Uhrzeiten (Geschäftszeiten)
        const businessHours = [9, 10, 11, 14, 15, 16];
        
        for (const hour of businessHours) {
          const startTime = new Date(checkDate);
          startTime.setHours(hour, 0, 0, 0);
          
          const endTime = new Date(startTime);
          endTime.setMinutes(startTime.getMinutes() + meetingForm.duration);
          
          // Skip weekends
          if (startTime.getDay() === 0 || startTime.getDay() === 6) continue;
          
          try {
            const response = await fetch(`/api/v1/calendar/availability?start_time=${startTime.toISOString()}&end_time=${endTime.toISOString()}&provider=google`, {
              headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
              }
            });

            if (response.ok) {
              const availability = await response.json();
              
              timeSlots.push({
                start: startTime.toISOString(),
                end: endTime.toISOString(),
                date: startTime.toLocaleDateString('de-DE', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                }),
                time: `${startTime.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })} - ${endTime.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}`,
                available: availability.available,
                confidence: availability.available ? 'high' : 'low'
              });
            }
          } catch (error) {
            console.error('Verfügbarkeitsprüfung fehlgeschlagen:', error);
          }
        }
      }

      // Sortiere verfügbare Zeiten zuerst
      timeSlots.sort((a, b) => {
        if (a.available && !b.available) return -1;
        if (!a.available && b.available) return 1;
        return new Date(a.start).getTime() - new Date(b.start).getTime();
      });

      setAvailabilityResults({
        available: timeSlots.some(slot => slot.available),
        busy_times: [],
        suggested_times: timeSlots.slice(0, 10), // Top 10 Vorschläge
        provider: 'google'
      });

    } catch (error) {
      console.error('❌ Fehler bei Verfügbarkeitsprüfung:', error);
      alert('Fehler bei der Verfügbarkeitsprüfung');
      setStep('form');
    } finally {
      setLoading(false);
    }
  };

  const selectTimeSlot = (timeSlot: TimeSlot) => {
    setSelectedTimeSlot(timeSlot);
    setStep('confirm');
  };

  const createMeeting = async () => {
    if (!selectedTimeSlot) return;

    setLoading(true);
    try {
      const meetingData = {
        title: meetingForm.title,
        description: meetingForm.description,
        agenda: meetingForm.agenda,
        start_time: selectedTimeSlot.start,
        end_time: selectedTimeSlot.end,
        location: meetingForm.location,
        attendees: meetingForm.attendees
      };

      const response = await fetch('/api/v1/calendar/create-meeting?provider=google', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(meetingData)
      });

      if (response.ok) {
        const result = await response.json();
        alert('✅ Meeting erfolgreich erstellt!');
        
        if (onMeetingCreated) {
          onMeetingCreated(result.event_id);
        }

        // Reset form
        setStep('form');
        setMeetingForm({
          title: '',
          description: '',
          agenda: '',
          duration: 60,
          location: 'Online',
          attendees: initialAttendees,
          priority: 'medium',
          meetingType: 'planning'
        });
        setSelectedTimeSlot(null);
        setAvailabilityResults(null);

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

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-400 bg-red-500/20 border-red-500/30';
      case 'high': return 'text-orange-400 bg-orange-500/20 border-orange-500/30';
      case 'medium': return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30';
      default: return 'text-green-400 bg-green-500/20 border-green-500/30';
    }
  };

  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case 'high': return 'text-green-400';
      case 'medium': return 'text-yellow-400';
      default: return 'text-red-400';
    }
  };

  return (
    <div className={`bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10 ${className}`}>
      {/* Header */}
      <div className="text-center mb-6">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Brain className="w-8 h-8 text-[#ffbd59]" />
          <Zap className="w-6 h-6 text-yellow-400" />
        </div>
        <h3 className="text-xl font-semibold text-white mb-2">
          🧠 Smart Meeting Scheduler
        </h3>
        <p className="text-gray-300 text-sm">
          KI-gestützte Terminplanung mit automatischer Verfügbarkeitsprüfung
        </p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-center mb-8">
        <div className="flex items-center space-x-4">
          {['form', 'availability', 'confirm'].map((stepName, index) => (
            <div key={stepName} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium border-2 ${
                step === stepName 
                  ? 'bg-[#ffbd59] text-[#2c3539] border-[#ffbd59]'
                  : index < ['form', 'availability', 'confirm'].indexOf(step)
                  ? 'bg-green-500 text-white border-green-500'
                  : 'bg-white/10 text-gray-400 border-white/20'
              }`}>
                {index < ['form', 'availability', 'confirm'].indexOf(step) ? '✓' : index + 1}
              </div>
              {index < 2 && (
                <div className={`w-12 h-0.5 mx-2 ${
                  index < ['form', 'availability', 'confirm'].indexOf(step)
                    ? 'bg-green-500'
                    : 'bg-white/20'
                }`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step 1: Meeting Form */}
      {step === 'form' && (
        <div className="space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Meeting-Titel *</label>
              <input
                type="text"
                value={meetingForm.title}
                onChange={(e) => setMeetingForm(prev => ({ ...prev, title: e.target.value }))}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#ffbd59]"
                placeholder="z.B. Wöchentliches Projekt-Standup"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Meeting-Typ</label>
              <select
                value={meetingForm.meetingType}
                onChange={(e) => setMeetingForm(prev => ({ ...prev, meetingType: e.target.value as any }))}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#ffbd59]"
              >
                <option value="planning">🎯 Planung</option>
                <option value="review">📊 Review</option>
                <option value="coordination">🤝 Koordination</option>
                <option value="decision">⚡ Entscheidung</option>
                <option value="other">📝 Sonstiges</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Dauer (Minuten) *</label>
              <select
                value={meetingForm.duration}
                onChange={(e) => setMeetingForm(prev => ({ ...prev, duration: parseInt(e.target.value) }))}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#ffbd59]"
              >
                <option value={15}>15 Min (Kurz-Update)</option>
                <option value={30}>30 Min (Standard)</option>
                <option value={60}>60 Min (Ausführlich)</option>
                <option value={90}>90 Min (Workshop)</option>
                <option value={120}>120 Min (Deep Dive)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Priorität</label>
              <select
                value={meetingForm.priority}
                onChange={(e) => setMeetingForm(prev => ({ ...prev, priority: e.target.value as any }))}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#ffbd59]"
              >
                <option value="low">🟢 Niedrig</option>
                <option value="medium">🟡 Mittel</option>
                <option value="high">🟠 Hoch</option>
                <option value="urgent">🔴 Dringend</option>
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Beschreibung</label>
            <textarea
              value={meetingForm.description}
              onChange={(e) => setMeetingForm(prev => ({ ...prev, description: e.target.value }))}
              className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#ffbd59] h-20"
              placeholder="Kurze Beschreibung des Meetings..."
            />
          </div>

          {/* Smart Suggestions */}
          {smartSuggestions.length > 0 && (
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <Brain className="w-5 h-5 text-blue-400" />
                <h4 className="font-medium text-blue-300">KI-Agenda-Vorschläge</h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {smartSuggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => applySuggestion(suggestion)}
                    className="text-left text-sm text-blue-200 hover:text-blue-100 hover:bg-blue-500/20 p-2 rounded-lg transition-colors"
                  >
                    + {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Agenda */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Agenda</label>
            <textarea
              value={meetingForm.agenda}
              onChange={(e) => setMeetingForm(prev => ({ ...prev, agenda: e.target.value }))}
              className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#ffbd59] h-24"
              placeholder="• Punkt 1&#10;• Punkt 2&#10;• Punkt 3"
            />
          </div>

          {/* Location & Attendees */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Ort / Link</label>
              <input
                type="text"
                value={meetingForm.location}
                onChange={(e) => setMeetingForm(prev => ({ ...prev, location: e.target.value }))}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#ffbd59]"
                placeholder="Online, Büro, oder Meeting-Link"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Teilnehmer hinzufügen</label>
              <div className="flex gap-2">
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
            </div>
          </div>

          {/* Attendees List */}
          {meetingForm.attendees.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Teilnehmer ({meetingForm.attendees.length})
              </label>
              <div className="flex flex-wrap gap-2">
                {meetingForm.attendees.map((email) => (
                  <div key={email} className="flex items-center gap-2 bg-white/10 rounded-lg px-3 py-1 border border-white/20">
                    <Mail className="w-3 h-3 text-gray-400" />
                    <span className="text-sm text-gray-300">{email}</span>
                    <button
                      onClick={() => removeAttendee(email)}
                      className="text-red-400 hover:text-red-300 text-xs ml-1"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Next Button */}
          <div className="flex justify-center">
            <button
              onClick={checkAvailability}
              disabled={!meetingForm.title || !meetingForm.duration || loading}
              className="bg-[#ffbd59] hover:bg-[#ffa726] text-[#2c3539] px-8 py-3 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Prüfe Verfügbarkeit...
                </>
              ) : (
                <>
                  <Brain className="w-5 h-5" />
                  Verfügbarkeit prüfen
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Availability Check */}
      {step === 'availability' && (
        <div className="space-y-6">
          <div className="text-center">
            <h4 className="text-lg font-semibold text-white mb-2">Verfügbare Termine</h4>
            <p className="text-gray-300 text-sm">
              Wählen Sie einen passenden Termin aus den Vorschlägen
            </p>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <Loader2 className="w-12 h-12 text-[#ffbd59] mx-auto mb-4 animate-spin" />
              <p className="text-gray-300">Prüfe Verfügbarkeit...</p>
            </div>
          ) : availabilityResults ? (
            <div className="space-y-4">
              {availabilityResults.suggested_times.length === 0 ? (
                <div className="text-center py-8">
                  <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                  <p className="text-gray-300 mb-4">Keine verfügbaren Termine gefunden</p>
                  <button
                    onClick={() => setStep('form')}
                    className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    Zurück zur Eingabe
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {availabilityResults.suggested_times.map((timeSlot, index) => (
                    <button
                      key={index}
                      onClick={() => selectTimeSlot(timeSlot)}
                      disabled={!timeSlot.available}
                      className={`p-4 rounded-xl border-2 text-left transition-all ${
                        timeSlot.available
                          ? 'bg-green-500/10 border-green-500/30 hover:bg-green-500/20 hover:border-green-500/50'
                          : 'bg-red-500/10 border-red-500/30 opacity-50 cursor-not-allowed'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className={`flex items-center gap-2 ${timeSlot.available ? 'text-green-400' : 'text-red-400'}`}>
                          {timeSlot.available ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                          <span className="text-sm font-medium">
                            {timeSlot.available ? 'Verfügbar' : 'Belegt'}
                          </span>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-full ${getConfidenceColor(timeSlot.confidence)}`}>
                          {timeSlot.confidence === 'high' ? '●●●' : timeSlot.confidence === 'medium' ? '●●○' : '●○○'}
                        </span>
                      </div>
                      <div className="text-white font-medium">{timeSlot.date}</div>
                      <div className="text-gray-300 text-sm">{timeSlot.time}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : null}

          <div className="flex justify-center gap-4">
            <button
              onClick={() => setStep('form')}
              className="bg-white/10 hover:bg-white/20 text-white px-6 py-2 rounded-lg transition-colors"
            >
              Zurück
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Confirmation */}
      {step === 'confirm' && selectedTimeSlot && (
        <div className="space-y-6">
          <div className="text-center">
            <h4 className="text-lg font-semibold text-white mb-2">Meeting bestätigen</h4>
            <p className="text-gray-300 text-sm">
              Überprüfen Sie die Details vor der Erstellung
            </p>
          </div>

          <div className="bg-white/10 rounded-xl p-6 border border-white/20">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-[#ffbd59]" />
                <div>
                  <div className="font-semibold text-white">{meetingForm.title}</div>
                  <div className="text-sm text-gray-300">{meetingForm.meetingType}</div>
                </div>
                <div className={`ml-auto px-3 py-1 rounded-full text-xs font-medium border ${getPriorityColor(meetingForm.priority)}`}>
                  {meetingForm.priority.toUpperCase()}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-blue-400" />
                <div>
                  <div className="text-white">{selectedTimeSlot.date}</div>
                  <div className="text-sm text-gray-300">{selectedTimeSlot.time} ({meetingForm.duration} Min)</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-green-400" />
                <div className="text-white">{meetingForm.location}</div>
              </div>

              <div className="flex items-start gap-3">
                <Users className="w-5 h-5 text-purple-400 mt-0.5" />
                <div>
                  <div className="text-white mb-1">Teilnehmer ({meetingForm.attendees.length})</div>
                  <div className="text-sm text-gray-300">
                    {meetingForm.attendees.join(', ') || 'Keine Teilnehmer'}
                  </div>
                </div>
              </div>

              {meetingForm.agenda && (
                <div className="border-t border-white/10 pt-4">
                  <div className="text-white font-medium mb-2">Agenda:</div>
                  <div className="text-sm text-gray-300 whitespace-pre-line">
                    {meetingForm.agenda}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-center gap-4">
            <button
              onClick={() => setStep('availability')}
              className="bg-white/10 hover:bg-white/20 text-white px-6 py-2 rounded-lg transition-colors"
            >
              Zurück
            </button>
            <button
              onClick={createMeeting}
              disabled={loading}
              className="bg-[#ffbd59] hover:bg-[#ffa726] text-[#2c3539] px-8 py-2 rounded-lg font-semibold transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Erstelle Meeting...
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5" />
                  Meeting erstellen
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Pro Badge */}
      <div className="mt-6 text-center">
        <span className="inline-flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-[#ffbd59] to-[#ffa726] text-[#2c3539] rounded-full text-xs font-semibold">
          <Brain className="w-3 h-3" />
          KI-powered Pro Feature
        </span>
      </div>
    </div>
  );
} 