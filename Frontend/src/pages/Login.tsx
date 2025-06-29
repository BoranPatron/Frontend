import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/api';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
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
      formData.append('password', password);

      const response = await api.post('/auth/login', formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      const { access_token, user } = response.data;
      
      // Token und User-Daten speichern
      login(access_token, user);
      
      // Weiterleitung zum Dashboard
      navigate('/');
      
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#3d4952] to-[#2c3e50] flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        {/* Logo und Titel */}
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-gradient-to-br from-[#ffbd59] to-[#ffa726] rounded-2xl flex items-center justify-center mb-4">
            <span className="text-white text-2xl font-bold">BW</span>
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

          {/* Demo-Zugangsdaten */}
          <div className="mt-6 p-4 bg-white/5 backdrop-blur-lg border border-white/10 rounded-xl">
            <h3 className="text-sm font-medium text-gray-300 mb-2">Demo-Zugangsdaten:</h3>
            <div className="text-xs text-gray-400 space-y-1">
              <p><strong>E-Mail:</strong> admin@buildwise.de</p>
              <p><strong>Passwort:</strong> admin123</p>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
} 