import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/api';
import logo from '../logo_trans_big.png';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [serviceProviderLoading, setServiceProviderLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Login-Request an die API
      const formData = new URLSearchParams();
      formData.append('username', email);
      
      // Automatisch das richtige Passwort für bekannte Test-Accounts verwenden
      let loginPassword = password;
      if (email === 'test-dienstleister@buildwise.de') {
        loginPassword = 'test1234';
        console.log('🔧 Automatisch Passwort für Dienstleister-Test-Account verwendet');
      }
      
      formData.append('password', loginPassword);

      const response = await api.post('/auth/login', formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      const { access_token, user } = response.data;
      
      // Token und User-Daten speichern
      login(access_token, user);
      
      // Debug-Logging für Benutzerrolle
      console.log('🔍 Login erfolgreich:', {
        user: user,
        user_type: user?.user_type,
        email: user?.email,
        isServiceProvider: user?.user_type === 'service_provider' || user?.email?.includes('dienstleister')
      });
      
      // Weiterleitung basierend auf Benutzerrolle
      const isServiceProvider = user?.user_type === 'service_provider' || user?.email?.includes('dienstleister');
      if (isServiceProvider) {
        console.log('🚀 Weiterleitung zu Dienstleister-Dashboard: /service-provider');
        navigate('/service-provider');
      } else {
        console.log('🚀 Weiterleitung zu Bauträger-Dashboard: /');
      navigate('/');
      }
      
    } catch (err: any) {
      console.error('Login error:', err);
      if (err.response?.data?.detail) {
        setError(err.response.data.detail);
      } else {
        setError('Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Dienstleister-Test-Login
  const handleServiceProviderTest = async () => {
    setError('');
    setServiceProviderLoading(true);

    try {
      // Test-Login mit Dienstleister-Zugangsdaten
      const formData = new URLSearchParams();
      formData.append('username', 'test-dienstleister@buildwise.de');
      formData.append('password', 'test1234');  // Korrigiertes Passwort

      const response = await api.post('/auth/login', formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      const { access_token, user } = response.data;
      
      // Debug-Logging für Dienstleister-Test
      console.log('🔍 Dienstleister-Test Login erfolgreich:', {
        user: user,
        user_type: user?.user_type,
        email: user?.email,
        isServiceProvider: user?.user_type === 'service_provider' || user?.email?.includes('dienstleister')
      });
      
      // Token und User-Daten speichern
      login(access_token, user);
      
      // Weiterleitung zur Dienstleisteransicht
      console.log('🚀 Weiterleitung zu Dienstleister-Dashboard: /service-provider');
      navigate('/service-provider');
      
    } catch (err: any) {
      console.error('Service provider login error:', err);
      if (err.response?.data?.detail) {
        setError(err.response.data.detail);
      } else {
        setError('Fehler beim Dienstleister-Test-Login. Bitte versuchen Sie es erneut.');
      }
    } finally {
      setServiceProviderLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#3d4952] to-[#2c3e50] flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        {/* Logo und Titel */}
        <div className="text-center">
          <div className="flex items-center justify-center mb-6">
            <img src={logo} alt="BuildWise Logo" className="h-80 w-auto" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-2">BuildWise</h2>
          <p className="text-gray-300">Melden Sie sich in Ihrem Konto an</p>
        </div>

        {/* Login-Formular */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            {/* E-Mail */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                E-Mail-Adresse
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent transition-all duration-300"
                placeholder="ihre.email@beispiel.de"
              />
            </div>

            {/* Passwort */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                Passwort
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent transition-all duration-300"
                placeholder="Ihr Passwort"
              />
            </div>
          </div>

          {/* Fehlermeldung */}
          {error && (
            <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-4 text-red-300 text-sm">
              {error}
            </div>
          )}

          {/* Login-Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-gradient-to-r from-[#ffbd59] to-[#ffa726] hover:from-[#ffa726] hover:to-[#ffbd59] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#ffbd59] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105"
          >
            {loading ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Anmeldung läuft...
              </div>
            ) : (
              'Anmelden'
            )}
          </button>

          {/* Dienstleister-Test-Button */}
          <button
            type="button"
            onClick={handleServiceProviderTest}
            disabled={serviceProviderLoading}
            className="w-full flex justify-center py-3 px-4 border border-[#ffbd59]/30 rounded-xl shadow-sm text-sm font-medium text-[#ffbd59] bg-white/5 backdrop-blur-lg hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#ffbd59] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105"
          >
            {serviceProviderLoading ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#ffbd59] mr-2"></div>
                Dienstleister-Login läuft...
              </div>
            ) : (
              'Dienstleister-Test (admin)'
            )}
          </button>

          {/* Demo-Zugangsdaten */}
          <div className="mt-6 p-4 bg-white/5 backdrop-blur-lg border border-white/10 rounded-xl">
            <h3 className="text-sm font-medium text-gray-300 mb-2">Demo-Zugangsdaten:</h3>
            <div className="text-xs text-gray-400 space-y-1">
              <p><strong>Bauträger:</strong> admin@buildwise.de / admin123</p>
              <p><strong>Dienstleister:</strong> test-dienstleister@buildwise.de / test1234</p>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
} 