import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';
import { getApiBaseUrl } from '../api/api';

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
    console.log('🔄 OAuthCallback mounted, processing OAuth callback...');
    // Setze mountedRef explizit auf true beim Mount
    mountedRef.current = true;
    const handleOAuthCallback = async () => {
      // Verhindere mehrfache Verarbeitung mit robuster Prüfung
      if (processingRef.current) {
        console.log('⚠️ OAuth callback already processing, skipping...');
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
          const apiUrl = getApiBaseUrl();
          console.log(`🌐 Sende OAuth-Callback an: ${apiUrl}/auth/oauth/${provider}/callback`);
          
          const response = await fetch(`${apiUrl}/auth/oauth/${provider}/callback`, {
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
            
            console.error('❌ Backend-Fehler:', response.status, errorData);
            setStatus('error');
            setMessage(errorData.detail || `Backend-Fehler: ${response.status}`);
            return;
          }

          const data = await response.json();
          console.log('✅ OAuth-Callback erfolgreich:', data);

          if (!data.access_token) {
            console.error('❌ Kein Access Token erhalten');
            setStatus('error');
            setMessage('Kein Access Token erhalten');
            return;
          }

          // Login durchführen
          console.log('🔐 Führe Login durch...');
          await login(data.access_token, data.user, true);
          
          setCurrentUser(data.user);
          setStatus('success');
          setMessage('Anmeldung erfolgreich!');

          // Weiterleitung nach kurzer Verzögerung
          setTimeout(() => {
            if (mountedRef.current) {
              console.log('🚀 Weiterleitung zum Dashboard...');
              navigate('/');
            }
          }, 2000);

        } catch (fetchError: any) {
          clearTimeout(timeoutId);
          
          if (fetchError.name === 'AbortError') {
            console.error('⏰ OAuth-Callback Timeout');
            setStatus('error');
            setMessage('Anmeldung dauerte zu lange. Bitte versuchen Sie es erneut.');
          } else {
            console.error('❌ OAuth-Callback Fehler:', fetchError);
            setStatus('error');
            setMessage(fetchError.message || 'Anmeldung fehlgeschlagen');
          }
        }

      } catch (err: any) {
        console.error('❌ Allgemeiner OAuth-Callback Fehler:', err);
        setStatus('error');
        setMessage(err.message || 'Anmeldung fehlgeschlagen');
      } finally {
        processingRef.current = false;
      }
    };

    handleOAuthCallback();

    // Cleanup
    return () => {
      mountedRef.current = false;
    };
  }, [searchParams, navigate, login]);

  // Cleanup beim Unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const getStatusIcon = () => {
    switch (status) {
      case 'loading':
        return <Loader2 className="w-8 h-8 animate-spin text-blue-500" />;
      case 'success':
        return <CheckCircle className="w-8 h-8 text-green-500" />;
      case 'error':
        return <AlertTriangle className="w-8 h-8 text-red-500" />;
      default:
        return <Loader2 className="w-8 h-8 animate-spin text-blue-500" />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'loading':
        return 'text-blue-600';
      case 'success':
        return 'text-green-600';
      case 'error':
        return 'text-red-600';
      default:
        return 'text-blue-600';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460] flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 w-full max-w-md border border-white/20 shadow-2xl text-center">
        <div className="mb-6">
          {getStatusIcon()}
        </div>
        
        <h2 className={`text-2xl font-bold mb-4 ${getStatusColor()}`}>
          {status === 'loading' && 'Anmeldung läuft...'}
          {status === 'success' && 'Anmeldung erfolgreich!'}
          {status === 'error' && 'Anmeldung fehlgeschlagen'}
        </h2>
        
        <p className="text-white/80 mb-6">
          {message || 'Verarbeite OAuth-Callback...'}
        </p>
        
        {status === 'success' && currentUser && (
          <div className="bg-white/10 rounded-lg p-4 mb-6">
            <p className="text-white/90 font-medium">
              Willkommen, {currentUser.first_name} {currentUser.last_name}!
            </p>
            <p className="text-white/70 text-sm mt-1">
              Sie werden in Kürze weitergeleitet...
            </p>
          </div>
        )}
        
        {status === 'error' && (
          <div className="space-y-4">
            <button
              onClick={() => navigate('/login')}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
            >
              Zurück zur Anmeldung
            </button>
            
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-gray-600 hover:bg-gray-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
            >
              Seite neu laden
            </button>
          </div>
        )}
        
        {status === 'loading' && (
          <div className="text-white/60 text-sm">
            Bitte warten Sie, während wir Ihre Anmeldung verarbeiten...
          </div>
        )}
      </div>
    </div>
  );
}