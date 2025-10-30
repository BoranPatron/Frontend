import React from 'react';
import { Bell, Calendar, FileText, Users, HelpCircle, MapPin } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface CentralTabClusterProps {}

export default function CentralTabCluster(_: CentralTabClusterProps) {
  const { user } = useAuth();
  if (!user) return null;

  const isBautraeger = user.user_role === 'BAUTRAEGER' || user.user_role === 'bautraeger';
  const isDienstleister = user.user_role === 'DIENSTLEISTER' || user.user_role === 'dienstleister';

  const buttons = isBautraeger
    ? [
        { key: 'bautraegerNotifications', label: 'Benachrichtigungen', icon: Calendar, event: 'openBautraegerNotificationTab' },
        { key: 'documents', label: 'Dokumente', icon: FileText, event: 'openDocumentSidebar' },
        { key: 'contacts', label: 'Kontakte', icon: Users, event: 'openContactTab' },
        { key: 'help', label: 'Hilfe', icon: HelpCircle, event: 'openHelpTab' },
      ]
    : isDienstleister
    ? [
        { key: 'notifications', label: 'Benachrichtigungen', icon: Bell, event: 'openNotificationTab' },
        { key: 'documents', label: 'Dokumente', icon: FileText, event: 'openServiceProviderDocumentTab' },
        { key: 'tenders', label: 'Ausschreibungen', icon: MapPin, event: 'openTendersSidebar' },
        { key: 'contacts', label: 'Kontakte', icon: Users, event: 'openContactTab' },
        { key: 'help', label: 'Hilfe', icon: HelpCircle, event: 'openHelpTab' },
      ]
    : [];

  if (buttons.length === 0) return null;

  return (
    <div className="hidden md:flex fixed top-1/2 right-2 lg:right-4 -translate-y-1/2 z-[10001] pointer-events-none">
      <div className="flex flex-col items-center justify-center gap-4 lg:gap-6 pointer-events-auto">
        {buttons.map(({ key, label, icon: Icon, event }) => (
          <button
            key={key}
            onClick={() => window.dispatchEvent(new CustomEvent(event))}
            className="md:w-14 md:h-14 lg:w-16 lg:h-16 rounded-full flex items-center justify-center 
                       bg-gradient-to-br from-white/15 to-white/5 backdrop-blur-xl border border-white/25 
                       ring-1 ring-white/20 hover:ring-[#ffbd59]/50 
                       shadow-[0_0_18px_rgba(255,189,89,0.25),0_10px_30px_rgba(0,0,0,0.35)] 
                       hover:shadow-[0_0_28px_rgba(255,189,89,0.4),0_12px_40px_rgba(0,0,0,0.45)] 
                       transition-transform transition-shadow duration-300 ease-out text-white hover:scale-105"
            title={label}
          >
            <Icon size={22} className="drop-shadow-[0_0_6px_rgba(255,189,89,0.6)]" />
          </button>
        ))}
      </div>
    </div>
  );
}
