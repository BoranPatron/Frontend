import React from 'react';
import { Mail, Calendar, ExternalLink } from 'lucide-react';

interface EmailCalendarButtonsProps {
  loginMethod?: 'google' | 'microsoft' | 'email';
  isProUser: boolean;
}

export default function EmailCalendarButtons({ loginMethod, isProUser }: EmailCalendarButtonsProps) {
  
  if (!isProUser) {
    return null;
  }

  const handleGoogleConnect = () => {
    // TODO: Implementierung in Schritt 2
    console.log('🔗 Google Integration wird gestartet...');
    alert('Google Integration wird in Schritt 2 implementiert');
  };

  const handleMicrosoftConnect = () => {
    // TODO: Implementierung in Schritt 2
    console.log('🔗 Microsoft Integration wird gestartet...');
    alert('Microsoft Integration wird in Schritt 2 implementiert');
  };

  return (
    <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10">
      <div className="text-center mb-6">
        <h3 className="text-xl font-semibold text-white mb-2">
          📧 Email & Kalender Integration
        </h3>
        <p className="text-gray-300 text-sm">
          Verbinden Sie Ihre bevorzugte Plattform für nahtlose Kommunikation
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Google Integration */}
        <button
          onClick={handleGoogleConnect}
          className="group relative p-4 bg-white hover:bg-gray-50 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl border border-gray-200"
        >
          <div className="flex flex-col items-center text-center">
            {/* Google Logo */}
            <div className="w-12 h-12 mb-3 flex items-center justify-center">
              <svg viewBox="0 0 24 24" className="w-8 h-8">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            </div>
            
            <h4 className="font-semibold text-gray-800 mb-1">Google</h4>
            <p className="text-sm text-gray-600 mb-3">
              Gmail + Calendar
            </p>
            
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Mail className="w-4 h-4" />
              <Calendar className="w-4 h-4" />
              <ExternalLink className="w-4 h-4" />
            </div>
          </div>
          
          {/* Hover-Effekt */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#4285F4]/10 to-[#34A853]/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          
          {/* Connect Button */}
          <div className="mt-4 bg-[#4285F4] text-white px-4 py-2 rounded-lg text-sm font-medium group-hover:bg-[#3367D6] transition-colors">
            Verbinden
          </div>
        </button>

        {/* Microsoft Integration */}
        <button
          onClick={handleMicrosoftConnect}
          className="group relative p-4 bg-white hover:bg-gray-50 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl border border-gray-200"
        >
          <div className="flex flex-col items-center text-center">
            {/* Microsoft Logo */}
            <div className="w-12 h-12 mb-3 flex items-center justify-center">
              <svg viewBox="0 0 24 24" className="w-8 h-8">
                <path fill="#F25022" d="M1 1h10v10H1z"/>
                <path fill="#00A4EF" d="M13 1h10v10H13z"/>
                <path fill="#7FBA00" d="M1 13h10v10H1z"/>
                <path fill="#FFB900" d="M13 13h10v10H13z"/>
              </svg>
            </div>
            
            <h4 className="font-semibold text-gray-800 mb-1">Microsoft</h4>
            <p className="text-sm text-gray-600 mb-3">
              Outlook + Calendar
            </p>
            
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Mail className="w-4 h-4" />
              <Calendar className="w-4 h-4" />
              <ExternalLink className="w-4 h-4" />
            </div>
          </div>
          
          {/* Hover-Effekt */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#00A4EF]/10 to-[#FFB900]/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          
          {/* Connect Button */}
          <div className="mt-4 bg-[#00A4EF] text-white px-4 py-2 rounded-lg text-sm font-medium group-hover:bg-[#0078D4] transition-colors">
            Verbinden
          </div>
        </button>
      </div>

      {/* Hinweis */}
      <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
        <div className="flex items-start gap-3">
          <div className="text-blue-400 mt-0.5">
            <ExternalLink className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-blue-300 font-medium text-sm mb-1">
              Integration basierend auf Login-Methode
            </h4>
            <p className="text-blue-200 text-xs">
              {loginMethod === 'google' 
                ? 'Da Sie sich mit Google angemeldet haben, empfehlen wir die Google-Integration.'
                : loginMethod === 'microsoft'
                ? 'Da Sie sich mit Microsoft angemeldet haben, empfehlen wir die Microsoft-Integration.'
                : 'Wählen Sie die Plattform, die Sie bevorzugen.'
              }
            </p>
          </div>
        </div>
      </div>

      {/* Pro-Badge */}
      <div className="mt-4 text-center">
        <span className="inline-flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-[#ffbd59] to-[#ffa726] text-[#2c3539] rounded-full text-xs font-semibold">
          <span>💎</span>
          Pro Feature
        </span>
      </div>
    </div>
  );
} 