import React, { useState } from 'react';
import { Calendar, Share2, Download, Mail, ExternalLink, Clock, MapPin, Users, Copy, Check } from 'lucide-react';

interface ShareCalendarButtonsProps {
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  location?: string;
  attendees?: string[];
  type: 'milestone' | 'task' | 'meeting' | 'event';
  projectName?: string;
  itemId?: number;
  className?: string;
  // Legacy support für eventData
  eventData?: {
    title: string;
    description?: string;
    startDate: string;
    endDate: string;
    location?: string;
    category?: string;
    priority?: string;
  };
  size?: string;
  variant?: string;
}

interface CalendarLinks {
  google: string;
  outlook: string;
  yahoo: string;
  ics_download: string;
}

export default function ShareCalendarButtons({ 
  title, 
  description, 
  startTime, 
  endTime, 
  location, 
  attendees = [], 
  type,
  projectName,
  itemId,
  className = "",
  eventData,
  size = "md",
  variant = "primary"
}: ShareCalendarButtonsProps) {
  const [calendarLinks, setCalendarLinks] = useState<CalendarLinks | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedLink, setCopiedLink] = useState<string | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);

  // Legacy support: verwende eventData falls verfügbar
  const eventTitle = eventData?.title || title;
  const eventDescription = eventData?.description || description;
  const eventStart = eventData ? new Date(eventData.startDate) : startTime;
  const eventEnd = eventData ? new Date(eventData.endDate) : endTime;
  const eventLocation = eventData?.location || location;

  const generateCalendarLinks = async () => {
    if (calendarLinks) {
      setShowDropdown(!showDropdown);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/v1/calendar/generate-links', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          title: eventTitle,
          description: eventDescription,
          start_time: eventStart.toISOString(),
          end_time: eventEnd.toISOString(),
          location: eventLocation,
          attendees: attendees,
          type: type
        })
      });

      if (response.ok) {
        const links = await response.json();
        setCalendarLinks(links);
        setShowDropdown(true);
      } else {
        // Fallback: generiere einfache Links
        const fallbackLinks = generateFallbackLinks();
        setCalendarLinks(fallbackLinks);
        setShowDropdown(true);
      }
    } catch (error) {
      console.error('Fehler beim Generieren der Kalender-Links:', error);
      // Fallback: generiere einfache Links
      const fallbackLinks = generateFallbackLinks();
      setCalendarLinks(fallbackLinks);
      setShowDropdown(true);
    } finally {
      setIsLoading(false);
    }
  };

  const generateFallbackLinks = (): CalendarLinks => {
    const startDate = eventStart.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const endDate = eventEnd.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    
    const googleUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(eventTitle)}&dates=${startDate}/${endDate}&details=${encodeURIComponent(eventDescription || '')}&location=${encodeURIComponent(eventLocation || '')}`;
    
    const outlookUrl = `https://outlook.live.com/calendar/0/deeplink/compose?subject=${encodeURIComponent(eventTitle)}&startdt=${eventStart.toISOString()}&enddt=${eventEnd.toISOString()}&body=${encodeURIComponent(eventDescription || '')}&location=${encodeURIComponent(eventLocation || '')}`;
    
    const yahooUrl = `https://calendar.yahoo.com/?v=60&view=d&type=20&title=${encodeURIComponent(eventTitle)}&st=${startDate}&dur=0100&desc=${encodeURIComponent(eventDescription || '')}&in_loc=${encodeURIComponent(eventLocation || '')}`;

    return {
      google: googleUrl,
      outlook: outlookUrl,
      yahoo: yahooUrl,
      ics_download: `/api/v1/calendar/download/event?title=${encodeURIComponent(eventTitle)}&start=${eventStart.toISOString()}&end=${eventEnd.toISOString()}`
    };
  };

  const downloadICS = async () => {
    try {
      const response = await fetch('/api/v1/calendar/download/ics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          title: eventTitle,
          description: eventDescription,
          start_time: eventStart.toISOString(),
          end_time: eventEnd.toISOString(),
          location: eventLocation,
          attendees: attendees
        })
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${eventTitle.replace(/[^a-zA-Z0-9]/g, '_')}.ics`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Fehler beim ICS-Download:', error);
    }
  };

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedLink(type);
      setTimeout(() => setCopiedLink(null), 2000);
    } catch (error) {
      console.error('Fehler beim Kopieren:', error);
    }
  };

  const getButtonSize = () => {
    switch (size) {
      case 'sm': return 'px-2 py-1 text-xs';
      case 'lg': return 'px-6 py-3 text-base';
      default: return 'px-4 py-2 text-sm';
    }
  };

  const getButtonStyle = () => {
    switch (variant) {
      case 'secondary': return 'bg-gray-600 hover:bg-gray-700';
      case 'minimal': return 'bg-transparent hover:bg-white/10 border border-white/20';
      default: return 'bg-[#ffbd59] hover:bg-[#ffa726] text-[#2c3539]';
    }
  };

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={generateCalendarLinks}
        disabled={isLoading}
        className={`flex items-center gap-2 ${getButtonSize()} ${getButtonStyle()} rounded-lg font-medium transition-colors ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
        title="Zu Kalender hinzufügen"
      >
        {isLoading ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
            <span>Laden...</span>
          </>
        ) : (
          <>
            <Calendar size={16} />
            <span>Kalender</span>
          </>
        )}
      </button>

      {showDropdown && calendarLinks && (
        <div className="absolute top-full left-0 mt-2 w-64 bg-[#3d4952] rounded-xl shadow-2xl border border-white/20 z-50">
          <div className="p-4">
            <h4 className="text-white font-medium mb-3">Zu Kalender hinzufügen</h4>
            
            <div className="space-y-2">
              <a
                href={calendarLinks.google}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/10 transition-colors text-white"
              >
                <div className="w-6 h-6 bg-red-500 rounded flex items-center justify-center">
                  <span className="text-white font-bold text-xs">G</span>
                </div>
                <span>Google Calendar</span>
                <ExternalLink size={14} className="ml-auto text-gray-400" />
              </a>

              <a
                href={calendarLinks.outlook}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/10 transition-colors text-white"
              >
                <div className="w-6 h-6 bg-blue-500 rounded flex items-center justify-center">
                  <span className="text-white font-bold text-xs">O</span>
                </div>
                <span>Outlook</span>
                <ExternalLink size={14} className="ml-auto text-gray-400" />
              </a>

              <a
                href={calendarLinks.yahoo}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/10 transition-colors text-white"
              >
                <div className="w-6 h-6 bg-purple-500 rounded flex items-center justify-center">
                  <span className="text-white font-bold text-xs">Y</span>
                </div>
                <span>Yahoo Calendar</span>
                <ExternalLink size={14} className="ml-auto text-gray-400" />
              </a>

              <button
                onClick={downloadICS}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/10 transition-colors text-white w-full"
              >
                <Download size={16} className="text-[#ffbd59]" />
                <span>ICS-Datei herunterladen</span>
              </button>
            </div>

            <div className="mt-3 pt-3 border-t border-white/20">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => copyToClipboard(calendarLinks.google, 'google')}
                  className="flex-1 flex items-center justify-center gap-2 p-2 rounded-lg hover:bg-white/10 transition-colors text-white"
                >
                  {copiedLink === 'google' ? (
                    <Check size={14} className="text-green-400" />
                  ) : (
                    <Copy size={14} />
                  )}
                  <span className="text-xs">Link kopieren</span>
                </button>
                
                <button
                  onClick={() => setShowDropdown(false)}
                  className="p-2 rounded-lg hover:bg-white/10 transition-colors text-gray-400"
                >
                  ✕
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 