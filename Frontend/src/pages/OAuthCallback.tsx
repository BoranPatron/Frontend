import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';

export default function OAuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const hasProcessed = useRef(false);

  useEffect(() => {
    const handleOAuthCallback = async () => {
      // Verhindere mehrfache Verarbeitung
      if (isProcessing || hasProcessed.current) {
        console.log('🔄 OAuth-Callback bereits verarbeitet oder in Verarbeitung...');
        return;
      }
      
      setIsProcessing(true);
      hasProcessed.current = true;
      
      try {
        console.log('🔍 OAuth-Callback gestartet');
        
        // URL-Parameter extrahieren
        const code = searchParams.get('code');
        const state = searchParams.get('state');
        const error = searchParams.get('error');
        const errorDescription = searchParams.get('error_description');

        console.log('📋 URL-Parameter:', { code: code ? 'present' : 'missing', state, error, errorDescription });

        // Prüfe auf OAuth-Fehler
        if (error) {
          console.error('❌ OAuth-Fehler:', error, errorDescription);
          setStatus('error');
          setMessage(errorDescription || `OAuth-Fehler: ${error}`);
          return;
        }

        if (!code) {
          console.error('❌ Kein Authorization Code erhalten');
          setStatus('error');
          setMessage('Kein Authorization Code erhalten');
          return;
        }

        // Bestimme Provider aus URL
        const pathname = window.location.pathname;
        let provider = '';
        
        if (pathname.includes('/auth/google/callback')) {
          provider = 'google';
        } else if (pathname.includes('/auth/microsoft/callback')) {
          provider = 'microsoft';
        } else {
          console.error('❌ Unbekannter OAuth-Provider');
          setStatus('error');
          setMessage('Unbekannter OAuth-Provider');
          return;
        }

        console.log(`🔗 Verarbeite ${provider.toUpperCase()} OAuth-Callback`);

        // Sende Code an Backend
        const response = await fetch(`http://localhost:8000/api/v1/auth/oauth/${provider}/callback`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            code,
            state: state || undefined,
          }),
        });

        const data = await response.json();
        console.log(`📡 Backend-Response:`, { status: response.status, data });

        // Prüfe auf spezifische Fehler
        if (!response.ok) {
          const errorDetail = data.detail || '';
          
          // Bei invalid_grant (Code bereits verwendet) - das ist normal, aber wir sollten nicht erneut versuchen
          if (errorDetail.includes('OAuth-Code ist abgelaufen') || 
              errorDetail.includes('OAuth-Code bereits verwendet') || 
              errorDetail.includes('invalid_grant')) {
            console.log('🔄 OAuth-Code bereits verwendet oder abgelaufen (normal)');
            
            // Anstatt zu retry, zeigen wir eine freundliche Nachricht
            setStatus('error');
            setMessage('OAuth-Code wurde bereits verwendet oder ist abgelaufen. Bitte starten Sie den Login-Prozess erneut.');
            return;
          }
          
          // Bei anderen Fehlern
          console.error(`❌ ${provider.toUpperCase()} OAuth fehlgeschlagen:`, data);
          setStatus('error');
          setMessage(data.detail || `${provider.toUpperCase()} OAuth fehlgeschlagen`);
          return;
        }

        // Login erfolgreich
        console.log('✅ OAuth-Login erfolgreich, setze User-Daten');
        login(data.access_token, data.user);
        setStatus('success');
        setMessage(`${provider.toUpperCase()} Login erfolgreich! Weiterleitung...`);

        // Direkte Weiterleitung ohne Verzögerung
        const redirectPath = localStorage.getItem('redirectAfterLogin') || '/';
        localStorage.removeItem('redirectAfterLogin');
        console.log(`🔄 Weiterleitung zu: ${redirectPath}`);
        navigate(redirectPath);

      } catch (err: any) {
        console.error('❌ OAuth callback error:', err);
        setStatus('error');
        setMessage(err.message || 'Ein unerwarteter Fehler ist aufgetreten');
      } finally {
        setIsProcessing(false);
      }
    };

    handleOAuthCallback();
  }, [searchParams, navigate, login, isProcessing]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460] flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 w-full max-w-md border border-white/20 shadow-2xl text-center">
        
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <img 
            src="/src/logo_trans_big.png" 
            alt="BuildWise Logo" 
            className="h-20 w-auto object-contain"
          />
        </div>

        <h1 className="text-2xl font-bold text-[#ffbd59] mb-4">OAuth-Verarbeitung</h1>

        {/* Status-Anzeige */}
        {status === 'loading' && (
          <div className="space-y-4">
            <div className="flex justify-center">
              <Loader2 className="h-12 w-12 text-[#ffbd59] animate-spin" />
            </div>
            <p className="text-gray-300">Verarbeite OAuth-Callback...</p>
          </div>
        )}

        {status === 'success' && (
          <div className="space-y-4">
            <div className="flex justify-center">
              <CheckCircle className="h-12 w-12 text-green-500" />
            </div>
            <p className="text-gray-300">{message}</p>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-4">
            <div className="flex justify-center">
              <AlertTriangle className="h-12 w-12 text-red-500" />
            </div>
            <p className="text-gray-300">{message}</p>
            
            {/* Zusätzliche Hilfe bei OAuth-Fehlern */}
            {message.includes('OAuth-Code') && (
              <div className="mt-4 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                <h3 className="text-yellow-500 font-semibold mb-2">💡 Lösung:</h3>
                <ol className="text-sm text-gray-300 space-y-1">
                  <li>1. Gehen Sie zurück zur <a href="/" className="text-[#ffbd59] hover:underline">Login-Seite</a></li>
                  <li>2. Klicken Sie erneut auf "Mit Microsoft anmelden"</li>
                  <li>3. Führen Sie den Login-Prozess erneut durch</li>
                </ol>
                <div className="mt-3">
                  <button 
                    onClick={() => window.location.href = '/'}
                    className="bg-[#ffbd59] text-black px-4 py-2 rounded-lg hover:bg-[#ffbd59]/80 transition-colors"
                  >
                    Zurück zur Login-Seite
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Debug-Info */}
        <div className="mt-6 text-xs text-gray-400">
          <p>Provider: {window.location.pathname.includes('google') ? 'Google' : 'Microsoft'}</p>
          <p>Status: {status}</p>
        </div>
      </div>
    </div>
  );
} 