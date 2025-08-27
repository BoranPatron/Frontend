import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';

export default function OAuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login, user } = useAuth();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const processingRef = useRef(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    // Setze mountedRef explizit auf true beim Mount
    mountedRef.current = true;
    const handleOAuthCallback = async () => {
      // Verhindere mehrfache Verarbeitung mit robuster Prüfung
      if (processingRef.current) {
        return;
      }
      
      processingRef.current = true;
      
      try {
        // URL-Parameter extrahieren
        const code = searchParams.get('code');
        const state = searchParams.get('state');
        const error = searchParams.get('error');
        const errorDescription = searchParams.get('error_description');

        console.log('📋 URL-Parameter:', { 
          code: code ? `${code.substring(0, 10)}...` : 'missing', 
          state, 
          error, 
          errorDescription 
        });

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

        // Sende Code an Backend mit Timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 Sekunden Timeout

        try {
          const response = await fetch(`http://localhost:8000/api/v1/auth/oauth/${provider}/callback`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              code,
              state: state || undefined,
            }),
            signal: controller.signal
          });

          clearTimeout(timeoutId);

          if (!response.ok) {
            const errorText = await response.text();
            let errorData;
            
            try {
              errorData = JSON.parse(errorText);
            } catch {
              errorData = { detail: errorText || 'Unbekannter Fehler' };
            }

            console.error(`❌ ${provider.toUpperCase()} OAuth fehlgeschlagen:`, errorData);
            
            const errorDetail = errorData.detail || '';
            
            // Bei invalid_grant oder ähnlichen Fehlern
            if (errorDetail.includes('OAuth-Code ist abgelaufen') || 
                errorDetail.includes('OAuth-Code bereits verwendet') || 
                errorDetail.includes('invalid_grant') ||
                errorDetail.includes('authorization code has expired') ||
                errorDetail.includes('AADSTS70008')) {
              
              setStatus('error');
              setMessage('Der OAuth-Code ist bereits verwendet oder abgelaufen. Bitte starten Sie den Login-Prozess erneut.');
              return;
            }
            
            // Bei Konfigurationsfehlern
            if (errorDetail.includes('nicht konfiguriert') || 
                errorDetail.includes('Client-Konfiguration fehlerhaft')) {
              setStatus('error');
              setMessage('OAuth ist nicht korrekt konfiguriert. Bitte wenden Sie sich an den Administrator.');
              return;
            }
            
            // Bei anderen Fehlern
            setStatus('error');
            setMessage(errorDetail || `${provider.toUpperCase()} OAuth fehlgeschlagen`);
            return;
          }

          const data = await response.json();
          // Login erfolgreich - ENTFERNE mountedRef Check komplett
          if (data.access_token && data.user) {
            console.log('🔄 Führe Login durch (ohne mountedRef Check)');
            
            try {
              // Speichere Benutzerdaten für die Willkommensnachricht
              setCurrentUser(data.user);
              
              // Führe Login durch - IMMER ausführen
              console.log('🔐 Rufe login() Funktion auf...');
              login(data.access_token, data.user);
              console.log('✅ login() Funktion erfolgreich aufgerufen');
              
              setStatus('success');
              setMessage(`${provider.toUpperCase()} Login erfolgreich! Weiterleitung...`);
              // Verzögerte Weiterleitung für AuthContext-Aktualisierung
              setTimeout(() => {
                const redirectPath = localStorage.getItem('redirectAfterLogin') || '/';
                localStorage.removeItem('redirectAfterLogin');
                navigate(redirectPath, { replace: true });
              }, 2000); // Etwas länger für bessere UX mit der neuen Willkommensnachricht
              
            } catch (loginError) {
              console.error('❌ Fehler beim Login-Prozess:', loginError);
              setStatus('error');
              setMessage('Fehler beim Login-Prozess');
            }
          } else {
            console.error('❌ Unvollständige Antwort vom Backend:', data);
            setStatus('error');
            setMessage('Unvollständige Antwort vom Server');
          }

        } catch (fetchError: any) {
          clearTimeout(timeoutId);
          
          if (fetchError.name === 'AbortError') {
            console.error('❌ OAuth-Request Timeout');
            setStatus('error');
            setMessage('Timeout beim Verbinden mit dem Server. Bitte versuchen Sie es erneut.');
          } else {
            console.error('❌ Netzwerkfehler:', fetchError);
            setStatus('error');
            setMessage('Netzwerkfehler. Bitte überprüfen Sie Ihre Internetverbindung.');
          }
        }

      } catch (err: any) {
        console.error('❌ OAuth callback error:', err);
        setStatus('error');
        setMessage(err.message || 'Ein unerwarteter Fehler ist aufgetreten');
      }
    };

    // Starte OAuth-Callback-Verarbeitung
    handleOAuthCallback();

    // Cleanup function
    return () => {
      mountedRef.current = false;
    };
  }, [searchParams, navigate, login]);

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

        {/* Dynamischer Titel basierend auf Status */}
        {status === 'loading' && (
          <h1 className="text-2xl font-bold text-[#ffbd59] mb-4">OAuth-Verarbeitung</h1>
        )}
        
        {(status === 'success' || status === 'error') && (
          <h1 className="text-2xl font-bold text-[#ffbd59] mb-4">
            {status === 'success' && currentUser ? 
              `Willkommen ${currentUser.first_name || currentUser.name || currentUser.email || 'zurück'}!` : 
              'Anmeldung'
            }
          </h1>
        )}

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
            <div className="text-center space-y-3">
              <p className="text-lg text-white font-medium">
                Schön, dass du da bist! 🎉
              </p>
              <p className="text-gray-300">
                Deine Anmeldung war erfolgreich. Du wirst gleich zu deinem Dashboard weitergeleitet.
              </p>
              <p className="text-sm text-gray-400">
                {message}
              </p>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-4">
            <div className="flex justify-center">
              <AlertTriangle className="h-12 w-12 text-red-500" />
            </div>
            <p className="text-gray-300 mb-4">{message}</p>
            
            {/* Hilfe-Sektion */}
            <div className="mt-4 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
              <h3 className="text-yellow-500 font-semibold mb-2">💡 Lösung:</h3>
              <ol className="text-sm text-gray-300 space-y-1 text-left">
                <li>1. Gehen Sie zurück zur Login-Seite</li>
                <li>2. Klicken Sie erneut auf "Mit Microsoft anmelden"</li>
                <li>3. Führen Sie den Login-Prozess erneut durch</li>
              </ol>
              <div className="mt-3">
                <button 
                  onClick={() => {
                    window.location.href = '/';
                  }}
                  className="bg-[#ffbd59] text-black px-4 py-2 rounded-lg hover:bg-[#ffbd59]/80 transition-colors"
                >
                  Zurück zur Login-Seite
                </button>
              </div>
            </div>
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
