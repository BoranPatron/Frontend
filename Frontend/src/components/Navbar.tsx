import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Settings, 
  MessageCircle, 
  FileText, 
  Bell,
  Sun,
  Moon,
  User,
  LogOut,
  ChevronDown
} from 'lucide-react';

export default function Navbar() {
  const { pathname } = useLocation();
  const { user, logout } = useAuth();
  const [showSettings, setShowSettings] = useState(false);
  const [showMessages, setShowMessages] = useState(false);
  const [showDocuments, setShowDocuments] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  const handleLogout = () => {
    logout();
    // Optional: Weiterleitung zur Login-Seite
    window.location.href = '/login';
  };

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    // Hier würde die Dark Mode Logik implementiert
    document.documentElement.classList.toggle('dark');
  };

  return (
    <nav className="bg-[#3d4952] text-white px-6 py-3 flex items-center justify-between shadow-md relative">
      <div className="flex items-center gap-3">
        <Link to="/" className="hover:opacity-80 transition-opacity">
          <span className="font-bold text-xl tracking-wide text-[#ffbd59] cursor-pointer">BuildWise</span>
        </Link>
      </div>
      
      <div className="flex gap-6 items-center">
        {user ? (
          <>
            <Link
              to="/"
              className={`hover:text-[#ffbd59] transition ${pathname === '/' ? 'text-[#ffbd59] font-semibold' : ''}`}
            >
              Dashboard
            </Link>
            <Link
              to="/projects"
              className={`hover:text-[#ffbd59] transition ${pathname === '/projects' ? 'text-[#ffbd59] font-semibold' : ''}`}
            >
              Projekte
            </Link>
            <Link
              to="/tasks"
              className={`hover:text-[#ffbd59] transition ${pathname === '/tasks' ? 'text-[#ffbd59] font-semibold' : ''}`}
            >
              Aufgaben
            </Link>
            <Link
              to="/finance"
              className={`hover:text-[#ffbd59] transition ${pathname === '/finance' ? 'text-[#ffbd59] font-semibold' : ''}`}
            >
              Finanzen
            </Link>
            <Link
              to="/quotes"
              className={`hover:text-[#ffbd59] transition ${pathname === '/quotes' ? 'text-[#ffbd59] font-semibold' : ''}`}
            >
              Gewerke
            </Link>
            <Link
              to="/visualize"
              className={`hover:text-[#ffbd59] transition ${pathname === '/visualize' ? 'text-[#ffbd59] font-semibold' : ''}`}
            >
              Visualisierung
            </Link>
            
            {/* Globale Icons */}
            <div className="flex items-center gap-4 ml-6 pl-6 border-l border-white/20">
              {/* Documents Icon */}
              <div className="relative">
                <button
                  onClick={() => setShowDocuments(!showDocuments)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors relative"
                  title="Dokumente"
                >
                  <FileText size={20} className="text-white hover:text-[#ffbd59] transition-colors" />
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    3
                  </span>
                </button>
                
                {/* Documents Dropdown */}
                {showDocuments && (
                  <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
                    <div className="p-4">
                      <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                        <FileText size={16} />
                        Projekt-Dokumente
                      </h3>
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        <div className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer">
                          <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center">
                            <FileText size={14} className="text-blue-600" />
                          </div>
                          <div className="flex-1">
                            <div className="text-sm font-medium text-gray-800">Bauplan.pdf</div>
                            <div className="text-xs text-gray-500">Vor 2 Stunden</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer">
                          <div className="w-8 h-8 bg-green-100 rounded flex items-center justify-center">
                            <FileText size={14} className="text-green-600" />
                          </div>
                          <div className="flex-1">
                            <div className="text-sm font-medium text-gray-800">Angebot_Elektro.pdf</div>
                            <div className="text-xs text-gray-500">Gestern</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer">
                          <div className="w-8 h-8 bg-orange-100 rounded flex items-center justify-center">
                            <FileText size={14} className="text-orange-600" />
                          </div>
                          <div className="flex-1">
                            <div className="text-sm font-medium text-gray-800">Gutachten.pdf</div>
                            <div className="text-xs text-gray-500">Vor 3 Tagen</div>
                          </div>
                        </div>
                      </div>
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <Link
                          to="/documents"
                          className="text-sm text-[#ffbd59] hover:text-[#e6a800] font-medium"
                          onClick={() => setShowDocuments(false)}
                        >
                          Alle Dokumente anzeigen →
                        </Link>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Messenger Icon */}
              <div className="relative">
                <button
                  onClick={() => setShowMessages(!showMessages)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors relative"
                  title="Nachrichten"
                >
                  <MessageCircle size={20} className="text-white hover:text-[#ffbd59] transition-colors" />
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    5
                  </span>
                </button>
                
                {/* Messages Dropdown */}
                {showMessages && (
                  <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
                    <div className="p-4">
                      <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                        <MessageCircle size={16} />
                        Nachrichten
                      </h3>
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        <div className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer">
                          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-medium">
                            JD
                          </div>
                          <div className="flex-1">
                            <div className="text-sm font-medium text-gray-800">Johann Doe</div>
                            <div className="text-xs text-gray-500">Neue Nachricht zum Projekt...</div>
                          </div>
                          <div className="text-xs text-gray-400">2 Min</div>
                        </div>
                        <div className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer">
                          <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white text-xs font-medium">
                            MS
                          </div>
                          <div className="flex-1">
                            <div className="text-sm font-medium text-gray-800">Maria Schmidt</div>
                            <div className="text-xs text-gray-500">Termin für Besichtigung...</div>
                          </div>
                          <div className="text-xs text-gray-400">1 Std</div>
                        </div>
                      </div>
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <Link
                          to="/messages"
                          className="text-sm text-[#ffbd59] hover:text-[#e6a800] font-medium"
                          onClick={() => setShowMessages(false)}
                        >
                          Alle Nachrichten anzeigen →
                        </Link>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Settings Icon */}
              <div className="relative">
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  title="Einstellungen"
                >
                  <Settings size={20} className="text-white hover:text-[#ffbd59] transition-colors" />
                </button>
                
                {/* Settings Dropdown */}
                {showSettings && (
                  <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
                    <div className="p-4">
                      <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                        <Settings size={16} />
                        Einstellungen
                      </h3>
                      <div className="space-y-3">
                        <button
                          onClick={toggleDarkMode}
                          className="flex items-center justify-between w-full p-2 hover:bg-gray-50 rounded text-left"
                        >
                          <div className="flex items-center gap-2">
                            {isDarkMode ? <Moon size={16} /> : <Sun size={16} />}
                            <span className="text-sm text-gray-700">
                              {isDarkMode ? 'Dark Mode' : 'Light Mode'}
                            </span>
                          </div>
                          <div className={`w-10 h-6 rounded-full transition-colors ${isDarkMode ? 'bg-[#ffbd59]' : 'bg-gray-300'}`}>
                            <div className={`w-4 h-4 bg-white rounded-full transition-transform ${isDarkMode ? 'translate-x-4' : 'translate-x-0'} mt-1 ml-1`}></div>
                          </div>
                        </button>
                        
                        <Link
                          to="/profile"
                          className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded text-sm text-gray-700"
                          onClick={() => setShowSettings(false)}
                        >
                          <User size={16} />
                          Profil bearbeiten
                        </Link>
                        
                        <div className="border-t border-gray-200 pt-3">
                          <button
                            onClick={handleLogout}
                            className="flex items-center gap-2 p-2 hover:bg-red-50 rounded text-sm text-red-600 w-full text-left"
                          >
                            <LogOut size={16} />
                            Abmelden
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Benutzer-Info */}
              <div className="flex items-center gap-3 ml-4 pl-4 border-l border-white/20">
                <div className="text-sm">
                  <span className="text-gray-300">Willkommen,</span>
                  <div className="font-medium text-[#ffbd59]">
                    {user.first_name} {user.last_name}
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <Link
            to="/login"
            className={`hover:text-[#ffbd59] transition ${pathname === '/login' ? 'text-[#ffbd59] font-semibold' : ''}`}
          >
            Login
          </Link>
        )}
      </div>

      {/* Click outside to close dropdowns */}
      {(showSettings || showMessages || showDocuments) && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => {
            setShowSettings(false);
            setShowMessages(false);
            setShowDocuments(false);
          }}
        />
      )}
    </nav>
  );
} 