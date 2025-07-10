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
  ChevronDown,
  Building,
  Globe,
  Menu,
  X,
  Home,
  Target,
  Euro,
  BarChart3,
  FolderOpen,
  Users,
  Calendar,
  Handshake,
  DollarSign
} from 'lucide-react';
import logo from '../logo_trans_big.png';

export default function Navbar() {
  const { pathname } = useLocation();
  const { user, logout, isServiceProvider } = useAuth();
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle('dark');
  };

  const getProjectIdFromPath = () => {
    const match = pathname.match(/\/project\/(\d+)/);
    return match ? match[1] : null;
  };

  const currentProjectId = getProjectIdFromPath();

  const isActive = (path: string) => pathname === path;
  const isProjectActive = () => pathname.includes('/project/');

  return (
    <nav className="bg-gradient-to-r from-[#2c3539] to-[#3d4952] text-white shadow-xl border-b border-[#ffbd59]/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo und Hauptnavigation */}
          <div className="flex items-center gap-8">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3 group">
              <img src={logo} alt="BuildWise Logo" className="h-8 w-auto" />
              <span className="font-bold text-xl tracking-wide text-[#ffbd59] group-hover:text-[#ffa726] transition-colors">
                BuildWise
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-1">
              {/* Dashboard - unterschiedlich für Bauträger und Dienstleister */}
              <Link
                to={isServiceProvider() ? "/service-provider" : "/"}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 ${
                  (isActive('/') || (isServiceProvider() && isActive('/service-provider')))
                    ? 'bg-[#ffbd59] text-[#2c3539] font-semibold shadow-lg' 
                    : 'text-white hover:bg-white/10 hover:text-[#ffbd59]'
                }`}
              >
                <Home size={18} />
                <span>{isServiceProvider() ? 'Dienstleister' : 'Dashboard'}</span>
              </Link>

              {/* Globale Übersicht - nur für Bauträger */}
              {!isServiceProvider() && (
                <Link
                  to="/global-projects"
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 ${
                    isActive('/global-projects') 
                      ? 'bg-[#ffbd59] text-[#2c3539] font-semibold shadow-lg' 
                      : 'text-white hover:bg-white/10 hover:text-[#ffbd59]'
                  }`}
                >
                  <Globe size={18} />
                  <span>Übersicht</span>
                </Link>
              )}

              {/* Projekt-Manager Dropdown - nur für Bauträger */}
              {!isServiceProvider() && (
                <div className="relative group">
                  <button className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 ${
                    isProjectActive() 
                      ? 'bg-[#ffbd59] text-[#2c3539] font-semibold shadow-lg' 
                      : 'text-white hover:bg-white/10 hover:text-[#ffbd59]'
                  }`}>
                    <Target size={18} />
                    <span>Projekte</span>
                    <ChevronDown size={16} className="group-hover:rotate-180 transition-transform" />
                  </button>
                
                <div className="absolute top-full left-0 mt-2 w-64 bg-[#3d4952] rounded-xl shadow-2xl border border-white/20 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50">
                  <div className="p-2">
                    {currentProjectId ? (
                      <Link
                        to={`/project/${currentProjectId}`}
                        className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/10 transition-colors text-white"
                      >
                        <Building size={16} className="text-[#ffbd59]" />
                        <div>
                          <div className="font-medium">Aktuelles Projekt</div>
                          <div className="text-sm text-gray-300">#{currentProjectId}</div>
                        </div>
                      </Link>
                    ) : (
                      <div className="p-3 text-gray-300 text-sm">
                        Kein Projekt ausgewählt
                      </div>
                    )}
                    <div className="border-t border-white/10 mt-2 pt-2">
                      <Link
                        to="/tasks"
                        className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/10 transition-colors text-white"
                      >
                        <Target size={16} className="text-[#ffbd59]" />
                        <span>Aufgaben</span>
                      </Link>
                      <Link
                        to="/finance"
                        className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/10 transition-colors text-white"
                      >
                        <Euro size={16} className="text-[#ffbd59]" />
                        <span>Finanzen</span>
                      </Link>
                      <Link
                        to="/quotes"
                        className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/10 transition-colors text-white"
                      >
                        <Handshake size={16} className="text-[#ffbd59]" />
                        <span>Gewerke</span>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
              )}

              {/* BuildWise-Gebühren - nur für Bauträger */}
              {!isServiceProvider() && (
                <Link
                  to="/buildwise-fees"
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 ${
                    isActive('/buildwise-fees') 
                      ? 'bg-[#ffbd59] text-[#2c3539] font-semibold shadow-lg' 
                      : 'text-white hover:bg-white/10 hover:text-[#ffbd59]'
                  }`}
                >
                  <DollarSign size={18} />
                  <span>Gebühren</span>
                </Link>
              )}

              {/* Dienstleister-spezifische Navigation */}
              {isServiceProvider() && (
                <>
                  <Link
                    to="/messages"
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 ${
                      isActive('/messages') 
                        ? 'bg-[#ffbd59] text-[#2c3539] font-semibold shadow-lg' 
                        : 'text-white hover:bg-white/10 hover:text-[#ffbd59]'
                    }`}
                  >
                    <MessageCircle size={18} />
                    <span>Messenger</span>
                  </Link>
                  <Link
                    to="/quotes"
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 ${
                      isActive('/quotes') 
                        ? 'bg-[#ffbd59] text-[#2c3539] font-semibold shadow-lg' 
                        : 'text-white hover:bg-white/10 hover:text-[#ffbd59]'
                    }`}
                  >
                    <Handshake size={18} />
                    <span>Gewerke</span>
                  </Link>
                </>
              )}

              {/* Tools Dropdown */}
              <div className="relative group">
                <button className="flex items-center gap-2 px-4 py-2 rounded-lg text-white hover:bg-white/10 hover:text-[#ffbd59] transition-all duration-300">
                  <BarChart3 size={18} />
                  <span>Tools</span>
                  <ChevronDown size={16} className="group-hover:rotate-180 transition-transform" />
                </button>
                
                <div className="absolute top-full left-0 mt-2 w-56 bg-[#3d4952] rounded-xl shadow-2xl border border-white/20 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50">
                  <div className="p-2">
                    <Link
                      to="/documents"
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/10 transition-colors text-white"
                    >
                      <FileText size={16} className="text-[#ffbd59]" />
                      <span>Dokumente</span>
                    </Link>
                    <Link
                      to="/visualize"
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/10 transition-colors text-white"
                    >
                      <BarChart3 size={16} className="text-[#ffbd59]" />
                      <span>Visualisierung</span>
                    </Link>
                    <Link
                      to="/roadmap"
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/10 transition-colors text-white"
                    >
                      <Calendar size={16} className="text-[#ffbd59]" />
                      <span>Roadmap</span>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Rechte Seite */}
          <div className="flex items-center gap-4">
            {/* Benachrichtigungen */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors relative"
                title="Benachrichtigungen"
              >
                <Bell size={20} className="text-white hover:text-[#ffbd59] transition-colors" />
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  3
                </span>
              </button>
              
              {showNotifications && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-[#3d4952] rounded-xl shadow-2xl border border-white/20 z-50">
                  <div className="p-4">
                    <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
                      <Bell size={16} />
                      Benachrichtigungen
                    </h3>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      <div className="flex items-center gap-3 p-2 hover:bg-white/10 rounded-lg cursor-pointer">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <div className="flex-1">
                          <div className="text-sm font-medium text-white">Neue Aufgabe zugewiesen</div>
                          <div className="text-xs text-gray-300">Vor 5 Minuten</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-2 hover:bg-white/10 rounded-lg cursor-pointer">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <div className="flex-1">
                          <div className="text-sm font-medium text-white">Dokument hochgeladen</div>
                          <div className="text-xs text-gray-300">Vor 1 Stunde</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Benutzer-Menü */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-3 p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-[#ffbd59] to-[#ffa726] rounded-full flex items-center justify-center">
                  <span className="text-[#2c3539] font-semibold text-sm">
                    {user?.first_name?.[0]}{user?.last_name?.[0]}
                  </span>
                </div>
                <div className="hidden sm:block text-left">
                  <div className="text-sm font-medium text-white">
                    {user?.first_name} {user?.last_name}
                  </div>
                  <div className="text-xs text-gray-300">{user?.user_type}</div>
                </div>
                <ChevronDown size={16} className="text-gray-300" />
              </button>
              
              {showUserMenu && (
                <div className="absolute right-0 top-full mt-2 w-64 bg-[#3d4952] rounded-xl shadow-2xl border border-white/20 z-50">
                  <div className="p-2">
                    <div className="p-3 border-b border-white/10">
                      <div className="font-medium text-white">
                        {user?.first_name} {user?.last_name}
                      </div>
                      <div className="text-sm text-gray-300">{user?.email}</div>
                    </div>
                    
                    <div className="p-2 space-y-1">
                      <button
                        onClick={toggleDarkMode}
                        className="flex items-center justify-between w-full p-3 rounded-lg hover:bg-white/10 transition-colors text-white"
                      >
                        <div className="flex items-center gap-3">
                          {isDarkMode ? <Moon size={16} /> : <Sun size={16} />}
                          <span className="text-sm">
                            {isDarkMode ? 'Dark Mode' : 'Light Mode'}
                          </span>
                        </div>
                        <div className={`w-10 h-6 rounded-full transition-colors ${isDarkMode ? 'bg-[#ffbd59]' : 'bg-gray-600'}`}>
                          <div className={`w-4 h-4 bg-white rounded-full transition-transform ${isDarkMode ? 'translate-x-4' : 'translate-x-0'} mt-1 ml-1`}></div>
                        </div>
                      </button>
                      
                      <Link
                        to="/profile"
                        className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/10 transition-colors text-white"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <User size={16} />
                        <span className="text-sm">Profil bearbeiten</span>
                      </Link>
                      
                      <Link
                        to="/messages"
                        className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/10 transition-colors text-white"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <MessageCircle size={16} />
                        <span className="text-sm">Nachrichten</span>
                      </Link>
                      
                      <div className="border-t border-white/10 pt-1 mt-1">
                        <button
                          onClick={handleLogout}
                          className="flex items-center gap-3 p-3 rounded-lg hover:bg-red-500/20 text-red-300 transition-colors w-full"
                        >
                          <LogOut size={16} />
                          <span className="text-sm">Abmelden</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="md:hidden p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              {showMobileMenu ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {showMobileMenu && (
          <div className="md:hidden border-t border-white/10 py-4">
            <div className="space-y-2">
              <Link
                to="/"
                className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                  isActive('/') ? 'bg-[#ffbd59] text-[#2c3539]' : 'text-white hover:bg-white/10'
                }`}
                onClick={() => setShowMobileMenu(false)}
              >
                <Home size={18} />
                <span>Dashboard</span>
              </Link>
              
              <Link
                to="/global-projects"
                className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                  isActive('/global-projects') ? 'bg-[#ffbd59] text-[#2c3539]' : 'text-white hover:bg-white/10'
                }`}
                onClick={() => setShowMobileMenu(false)}
              >
                <Globe size={18} />
                <span>Globale Übersicht</span>
              </Link>
              
              <Link
                to="/tasks"
                className="flex items-center gap-3 p-3 rounded-lg text-white hover:bg-white/10 transition-colors"
                onClick={() => setShowMobileMenu(false)}
              >
                <Target size={18} />
                <span>Aufgaben</span>
              </Link>
              
              <Link
                to="/finance"
                className="flex items-center gap-3 p-3 rounded-lg text-white hover:bg-white/10 transition-colors"
                onClick={() => setShowMobileMenu(false)}
              >
                <Euro size={18} />
                <span>Finanzen</span>
              </Link>
              
              <Link
                to="/documents"
                className="flex items-center gap-3 p-3 rounded-lg text-white hover:bg-white/10 transition-colors"
                onClick={() => setShowMobileMenu(false)}
              >
                <FileText size={18} />
                <span>Dokumente</span>
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Click outside to close dropdowns */}
      {(showUserMenu || showNotifications || showMobileMenu) && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => {
            setShowUserMenu(false);
            setShowNotifications(false);
            setShowMobileMenu(false);
          }}
        />
      )}
    </nav>
  );
} 