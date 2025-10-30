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
    <div className="hidden lg:flex fixed inset-0 z-[10001] pointer-events-none">
      <div className="m-auto flex flex-col items-center justify-center gap-6 pointer-events-auto">
        {buttons.map(({ key, label, icon: Icon, event }) => (
          <button
            key={key}
            onClick={() => window.dispatchEvent(new CustomEvent(event))}
            className="w-14 h-14 rounded-full flex items-center justify-center bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20 shadow-[0_0_30px_rgba(255,189,89,0.15)] hover:shadow-[0_0_40px_rgba(255,189,89,0.25)] transition-all text-white hover:scale-105"
            title={label}
          >
            <Icon size={20} />
          </button>
        ))}
      </div>
    </div>
  );
}
