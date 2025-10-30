import React from 'react';
import { Bell, Calendar, FileText, Users, HelpCircle, MapPin } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface CentralTabClusterProps {}

export default function CentralTabCluster(_: CentralTabClusterProps) {
  const { user } = useAuth();
  if (!user) return null;

  const isBautraeger = user.user_role === 'BAUTRAEGER' || user.user_role === 'bautraeger';
  const isDienstleister = user.user_role === 'DIENSTLEISTER' || user.user_role === 'dienstleister';

  const [spNewCount, setSpNewCount] = React.useState(0);
  const [btNewCount, setBtNewCount] = React.useState(0);

  React.useEffect(() => {
    const handleSp = (e: CustomEvent) => setSpNewCount(Math.max(0, e?.detail?.count ?? 0));
    const handleBt = (e: CustomEvent) => setBtNewCount(Math.max(0, e?.detail?.count ?? 0));
    window.addEventListener('notification:newCount', handleSp as unknown as EventListener);
    window.addEventListener('bautraegerNotification:newCount', handleBt as unknown as EventListener);
    return () => {
      window.removeEventListener('notification:newCount', handleSp as unknown as EventListener);
      window.removeEventListener('bautraegerNotification:newCount', handleBt as unknown as EventListener);
    };
  }, []);

  const buttons = isBautraeger
    ? [
        { key: 'bautraegerNotifications', label: 'Benachrichtigungen', icon: Calendar, event: 'openBautraegerNotificationTab', count: btNewCount },
        { key: 'documents', label: 'Dokumente', icon: FileText, event: 'openDocumentSidebar' },
        { key: 'contacts', label: 'Kontakte', icon: Users, event: 'openContactTab' },
        { key: 'help', label: 'Hilfe', icon: HelpCircle, event: 'openHelpTab' },
      ]
    : isDienstleister
    ? [
        { key: 'notifications', label: 'Benachrichtigungen', icon: Bell, event: 'openNotificationTab', count: spNewCount },
        { key: 'documents', label: 'Dokumente', icon: FileText, event: 'openServiceProviderDocumentTab' },
        { key: 'tenders', label: 'Ausschreibungen', icon: MapPin, event: 'openTendersSidebar' },
        { key: 'contacts', label: 'Kontakte', icon: Users, event: 'openContactTab' },
        { key: 'help', label: 'Hilfe', icon: HelpCircle, event: 'openHelpTab' },
      ]
    : [];

  if (buttons.length === 0) return null;

  return (
    <div className="flex fixed top-1/2 right-2 md:right-2 lg:right-4 -translate-y-1/2 z-[10001] pointer-events-none">
      {/* subtle edge rail for emphasis */}
      <div className="absolute right-0 top-1/2 -translate-y-1/2 h-64 md:h-72 lg:h-80 w-px bg-gradient-to-b from-transparent via-white/20 to-transparent pointer-events-none" />
      <div className="flex flex-col items-center justify-center gap-3 md:gap-4 lg:gap-6 pointer-events-auto">
        {buttons.map(({ key, label, icon: Icon, event, count }) => {
          const hasCount = typeof count === 'number' && count > 0;
          return (
            <button
              key={key}
              onClick={() => window.dispatchEvent(new CustomEvent(event))}
              className={`w-12 h-12 md:w-14 md:h-14 lg:w-16 lg:h-16 rounded-full flex items-center justify-center 
                         bg-gradient-to-br from-white/15 to-white/5 backdrop-blur-xl border border-white/25 
                         ring-1 ${hasCount ? 'ring-[#ffbd59]/60 animate-pulse' : 'ring-white/20 hover:ring-[#ffbd59]/50'} 
                         shadow-[0_0_14px_rgba(255,189,89,0.22),0_8px_22px_rgba(0,0,0,0.35)] 
                         hover:shadow-[0_0_24px_rgba(255,189,89,0.38),0_10px_34px_rgba(0,0,0,0.45)] 
                         transition-transform transition-shadow duration-300 ease-out text-white hover:scale-105 relative`}
              title={label}
            >
              <Icon size={20} className="drop-shadow-[0_0_6px_rgba(255,189,89,0.6)]" />
              {hasCount && (
                <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-[#ffbd59] text-[#1a1a2e] text-[10px] font-bold flex items-center justify-center shadow-[0_0_10px_rgba(255,189,89,0.6)]">
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
