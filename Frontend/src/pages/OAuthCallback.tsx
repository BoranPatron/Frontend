import React, { useEffect, useState } from 'react';
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

  useEffect(() => {
    const handleOAuthCallback = async () => {
      // Verhindere doppelte Verarbeitung
      if (isProcessing) {
        console.log('🔄 OAuth-Callback bereits in Verarbeitung...');
        return;
      }
      
      setIsProcessing(true);
      
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

        // Prüfe auf spezifische Fehler, die wir ignorieren wollen
        if (!response.ok) {
          const errorDetail = data.detail || '';
          
          // Bei invalid_grant (Code bereits verwendet) - das ist normal, versuche es erneut
          if (errorDetail.includes('Token-Austausch fehlgeschlagen') || 
              errorDetail.includes('invalid_grant') ||
              response.status === 400) {
            console.log('🔄 Token-Austausch fehlgeschlagen (normal bei mehrfachen Requests), versuche erneut...');
            
            // Kurze Verzögerung und erneuter Versuch
            await new Promise(resolve => setTimeout(resolve, 500));
            
            const retryResponse = await fetch(`http://localhost:8000/api/v1/auth/oauth/${provider}/callback`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                code,
                state: state || undefined,
              }),
            });
            
            const retryData = await retryResponse.json();
            console.log(`📡 Retry-Response:`, { status: retryResponse.status, data: retryData });
            
            if (retryResponse.ok) {
              // Login erfolgreich beim zweiten Versuch
              console.log('✅ OAuth-Login erfolgreich (Retry), setze User-Daten');
              login(retryData.access_token, retryData.user);
              setStatus('success');
              setMessage(`${provider.toUpperCase()} Login erfolgreich! Weiterleitung...`);
              
              // Direkte Weiterleitung ohne Verzögerung
              const redirectPath = localStorage.getItem('redirectAfterLogin') || '/';
              localStorage.removeItem('redirectAfterLogin');
              console.log(`🔄 Weiterleitung zu: ${redirectPath}`);
              navigate(redirectPath);
              return;
            }
          }
          
          // Bei anderen Fehlern
          console.error(`❌ ${provider.toUpperCase()} OAuth fehlgeschlagen:`, data);
          setStatus('error');
          setMessage(data.detail || `${provider.toUpperCase()} OAuth fehlgeschlagen`);
          return;
        }

        // Login erfolgreich beim ersten Versuch
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
              <CheckCircle className="h-12 w-12 text-green-400" />
            </div>
            <p className="text-green-300">{message}</p>
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#ffbd59]"></div>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-4">
            <div className="flex justify-center">
              <AlertTriangle className="h-12 w-12 text-red-400" />
            </div>
            <div className="text-red-300 text-sm">
              {(() => {
                if (typeof message === 'string') {
                  return <p>{message}</p>;
                } else if (Array.isArray(message)) {
                  return (
                    <div>
                      {(message as any[]).map((err: any, i: number) => (
                        <p key={i} className="mb-1">
                          {err.msg || err.message || JSON.stringify(err)}
                        </p>
                      ))}
                    </div>
                  );
                } else if (message && typeof message === 'object') {
                  return <p>{JSON.stringify(message, null, 2)}</p>;
                } else {
                  return <p>Ein unbekannter Fehler ist aufgetreten</p>;
                }
              })()}
            </div>
            <button
              onClick={() => navigate('/login')}
              className="bg-gradient-to-r from-[#ffbd59] to-[#ffa726] text-white font-bold py-2 px-6 rounded-xl hover:from-[#ffa726] hover:to-[#ff9800] transition-all duration-300"
            >
              Zurück zum Login
            </button>
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