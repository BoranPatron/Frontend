import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff, AlertTriangle, CheckCircle } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { login, isInitialized } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Prüfe URL-Parameter für Nachrichten
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const message = urlParams.get('message');
    
    if (message === 'session_expired') {
      setError('Ihre Sitzung ist abgelaufen. Bitte melden Sie sich erneut an.');
    }
  }, [location.search]);

  // Warte auf AuthContext-Initialisierung
  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#ffbd59] mx-auto mb-4"></div>
          <p className="text-white">Initialisiere Anwendung...</p>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Verwende das korrekte Format für das Backend (FormData statt JSON)
      const formData = new URLSearchParams();
      formData.append('username', email); // Backend erwartet 'username' statt 'email'
      formData.append('password', password);

      const response = await fetch('http://localhost:8000/api/v1/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        // Bessere Fehlerbehandlung
        if (response.status === 422) {
          // Validierungsfehler
          if (data.detail && Array.isArray(data.detail)) {
            const errorMessages = data.detail.map((err: any) => 
              `${err.loc?.join('.')}: ${err.msg}`
            ).join(', ');
            throw new Error(`Validierungsfehler: ${errorMessages}`);
          } else if (typeof data.detail === 'string') {
            throw new Error(data.detail);
          } else {
            throw new Error('Ungültige Anmeldedaten. Bitte überprüfen Sie E-Mail und Passwort.');
          }
        } else if (response.status === 401) {
          throw new Error('Ungültige Anmeldedaten. Bitte überprüfen Sie E-Mail und Passwort.');
        } else {
          throw new Error(data.detail || 'Login fehlgeschlagen');
        }
      }

      // Token und User-Daten speichern
      login(data.access_token, data.user);
      
      // Refresh-Token speichern (falls verfügbar)
      if (data.refresh_token) {
        localStorage.setItem('refreshToken', data.refresh_token);
      }

      setSuccess('Login erfolgreich! Weiterleitung...');

      // Verzögerte Weiterleitung für bessere Stabilität
      const redirectPath = localStorage.getItem('redirectAfterLogin') || '/';
      localStorage.removeItem('redirectAfterLogin'); // Cleanup
      
      setTimeout(() => {
        navigate(redirectPath);
      }, 1500); // Erhöht auf 1.5 Sekunden für bessere Stabilität

    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Ein Fehler ist aufgetreten');
    } finally {
      setLoading(false);
    }
  };

  const handleServiceProviderTest = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Verwende das korrekte Format für das Backend
      const formData = new URLSearchParams();
      formData.append('username', 'dienstleister@buildwise.de');
      formData.append('password', 'Dienstleister123!');

      const response = await fetch('http://localhost:8000/api/v1/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        // Bessere Fehlerbehandlung
        if (response.status === 422) {
          if (data.detail && Array.isArray(data.detail)) {
            const errorMessages = data.detail.map((err: any) => 
              `${err.loc?.join('.')}: ${err.msg}`
            ).join(', ');
            throw new Error(`Validierungsfehler: ${errorMessages}`);
          } else if (typeof data.detail === 'string') {
            throw new Error(data.detail);
          } else {
            throw new Error('Ungültige Anmeldedaten für Dienstleister-Test.');
          }
        } else if (response.status === 401) {
          throw new Error('Ungültige Anmeldedaten für Dienstleister-Test.');
        } else {
          throw new Error(data.detail || 'Dienstleister-Login fehlgeschlagen');
        }
      }

      // Token und User-Daten speichern
      login(data.access_token, data.user);
      
      // Refresh-Token speichern (falls verfügbar)
      if (data.refresh_token) {
        localStorage.setItem('refreshToken', data.refresh_token);
      }

      setSuccess('Dienstleister-Login erfolgreich! Weiterleitung...');

      // Verzögerte Weiterleitung für bessere Stabilität
      setTimeout(() => {
        navigate('/service-provider');
      }, 1500); // Erhöht auf 1.5 Sekunden für bessere Stabilität

    } catch (err: any) {
      console.error('Service provider login error:', err);
      setError(err.message || 'Ein Fehler ist aufgetreten');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Generiere OAuth-URL vom Backend
      const response = await fetch('http://localhost:8000/api/v1/auth/oauth/google/url', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Google OAuth nicht verfügbar');
      }

      // Weiterleitung zur Google OAuth-Seite
      window.location.href = data.oauth_url;

    } catch (err: any) {
      console.error('Google OAuth error:', err);
      setError(err.message || 'Google OAuth fehlgeschlagen');
      setLoading(false);
    }
  };

  const handleMicrosoftLogin = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Generiere OAuth-URL vom Backend
      const response = await fetch('http://localhost:8000/api/v1/auth/oauth/microsoft/url', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Microsoft OAuth nicht verfügbar');
      }

      // Weiterleitung zur Microsoft OAuth-Seite
      window.location.href = data.oauth_url;

    } catch (err: any) {
      console.error('Microsoft OAuth error:', err);
      setError(err.message || 'Microsoft OAuth fehlgeschlagen');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460] flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 w-full max-w-md border border-white/20 shadow-2xl">
        <div className="text-center mb-8">
          {/* Logo zentral über der Login-Eingabe */}
          <div className="flex justify-center mb-6">
            <img 
              src="/src/logo_trans_big.png" 
              alt="BuildWise Logo" 
              className="h-40 w-auto object-contain"
            />
          </div>
          <h1 className="text-3xl font-bold text-[#ffbd59] mb-2">BuildWise</h1>
          <p className="text-gray-300">Anmelden zu Ihrem Konto</p>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="bg-red-500/20 border border-red-500/30 text-red-300 px-4 py-3 flex items-center gap-3 mb-6 rounded-xl">
            <AlertTriangle size={20} />
            <span>{error}</span>
          </div>
        )}

        {/* Success Banner */}
        {success && (
          <div className="bg-green-500/20 border border-green-500/30 text-green-300 px-4 py-3 flex items-center gap-3 mb-6 rounded-xl">
            <CheckCircle size={20} />
            <span>{success}</span>
          </div>
        )}

        {/* Social Login Buttons */}
        <div className="space-y-3 mb-6">
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full bg-white text-gray-800 font-semibold py-3 px-6 rounded-xl hover:bg-gray-100 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-3"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            {loading ? 'Verbinde...' : 'Mit Google anmelden'}
          </button>

          <button
            onClick={handleMicrosoftLogin}
            disabled={loading}
            className="w-full bg-[#2F2F2F] text-white font-semibold py-3 px-6 rounded-xl hover:bg-[#404040] transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-3"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#F25022" d="M1 1h10v10H1z"/>
              <path fill="#7FBA00" d="M13 1h10v10H13z"/>
              <path fill="#00A4EF" d="M1 13h10v10H1z"/>
              <path fill="#FFB900" d="M13 13h10v10H13z"/>
            </svg>
            {loading ? 'Verbinde...' : 'Mit Microsoft anmelden'}
          </button>
        </div>

        {/* Divider */}
        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/20"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460] text-gray-300">oder</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              E-Mail-Adresse
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent transition-all duration-300"
              placeholder="ihre.email@beispiel.de"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Passwort
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent transition-all duration-300 pr-12"
                placeholder="Ihr Passwort"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-[#ffbd59] to-[#ffa726] text-white font-bold py-3 px-6 rounded-xl hover:from-[#ffa726] hover:to-[#ff9800] transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {loading ? 'Anmelden...' : 'Anmelden'}
          </button>
        </form>

        {/* Dienstleister-Test Button */}
        <div className="mt-6 pt-6 border-t border-white/20">
          <button
            onClick={handleServiceProviderTest}
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold py-3 px-6 rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {loading ? 'Teste...' : 'Dienstleister-Test (admin)'}
          </button>
        </div>

        {/* Debug-Info */}
        <div className="mt-4 text-xs text-gray-400 text-center">
          <p>Debug: AuthContext initialisiert: {isInitialized ? 'Ja' : 'Nein'}</p>
        </div>
      </div>
    </div>
  );
} 