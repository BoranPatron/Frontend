import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  Globe, 
  Star, 
  Settings, 
  ChevronDown, 
  Moon, 
  Sun, 
  LogOut, 
  Plus,
  X,
  AlertTriangle,
  FileText,
  BarChart3,
  MessageCircle,
  Handshake,
  DollarSign,
  Palette,
  CheckSquare,
  Euro,
  MessageSquare,
  Bell,
  User,
  Menu,
  Target,
  Calendar
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import FavoritesManager from './FavoritesManager';
import logo from '../logo_trans_big.png';

interface FavoriteItem {
  id: string;
  title: string;
  path: string;
  icon: string;
  category: 'navigation' | 'tools' | 'projects';
  isActive?: boolean;
}

export default function Navbar() {
  const { user, logout, isServiceProvider } = useAuth();
  const pathname = useLocation().pathname;
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [showFavoritesManager, setShowFavoritesManager] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  
  // Projekt-Erstellung State - ENTFERNT, da jetzt im FAB
  // const [showCreateProjectModal, setShowCreateProjectModal] = useState(false);
  // const [isCreatingProject, setIsCreatingProject] = useState(false);
  // const [createProjectError, setCreateProjectError] = useState<string | null>(null);
  // const [projectForm, setProjectForm] = useState({...});

  // Favoriten laden
  useEffect(() => {
    const loadFavorites = () => {
      try {
        const storedFavorites = localStorage.getItem('favorites');
        if (storedFavorites) {
          const parsedFavorites = JSON.parse(storedFavorites);
          setFavorites(parsedFavorites);
          console.log('🔍 Favoriten geladen:', parsedFavorites);
        }
      } catch (error) {
        console.error('❌ Fehler beim Laden der Favoriten:', error);
        setFavorites([]);
      }
    };

    loadFavorites();
    
    const handleStorageChange = () => {
      loadFavorites();
    };

    const handleCustomStorageChange = (event: Event) => {
      if (event instanceof StorageEvent && event.key === 'favorites') {
        loadFavorites();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('favoritesChanged', handleCustomStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('favoritesChanged', handleCustomStorageChange);
    };
  }, []);

  const renderIcon = (iconString: string) => {
    const iconMap: { [key: string]: React.ReactNode } = {
      '<Home size={16} />': <Home size={16} />,
      '<FileText size={16} />': <FileText size={16} />,
      '<CheckSquare size={16} />': <CheckSquare size={16} />,
      '<Euro size={16} />': <Euro size={16} />,
      '<MessageSquare size={16} />': <MessageSquare size={16} />,
      '<BarChart3 size={16} />': <BarChart3 size={16} />,
      '<Palette size={16} />': <Palette size={16} />,
      '<Globe size={16} />': <Globe size={16} />,
    };
    
    return iconMap[iconString] || <Star size={16} />;
  };

  const handleLogout = () => {
    logout();
  };

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle('dark');
  };

  // Projekt-Erstellung Funktionen - ENTFERNT
  // const handleCreateProjectClick = () => {
  //   setShowCreateProjectModal(true);
  //   setCreateProjectError(null);
  // };

  // const handleCloseCreateProjectModal = () => {
  //   setShowCreateProjectModal(false);
  //   setProjectForm({
  //     name: '',
  //     description: '',
  //     project_type: 'new_build',
  //     address: '',
  //     address_street: '',
  //     address_zip: '',
  //     address_city: '',
  //     address_country: 'Deutschland',
  //     property_size: '',
  //     construction_area: '',
  //     start_date: '',
  //     end_date: '',
  //     budget: '',
  //     is_public: false,
  //     allow_quotes: true
  //   });
  // };

  // const handleProjectFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
  //   const { name, value, type } = e.target;
  //   setProjectForm(prev => ({
  //     ...prev,
  //     [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
  //   }));
  // };

  // const handleCreateProject = async (e: React.FormEvent) => {
  //   e.preventDefault();
  //   setIsCreatingProject(true);
  //   setCreateProjectError(null);

  //   try {
  //     // Formatiere die Daten für die API
  //     const projectData = {
  //       name: projectForm.name.trim(),
  //       description: projectForm.description.trim() || '',
  //       project_type: projectForm.project_type,
  //       status: 'planning', // Standard-Status für neue Projekte
  //       address: projectForm.address.trim() || undefined,
  //       address_street: projectForm.address_street?.trim() || undefined,
  //       address_zip: projectForm.address_zip?.trim() || undefined,
  //       address_city: projectForm.address_city?.trim() || undefined,
  //       address_country: projectForm.address_country?.trim() || 'Deutschland',
  //       property_size: projectForm.property_size ? parseFloat(projectForm.property_size) : undefined,
  //       construction_area: projectForm.construction_area ? parseFloat(projectForm.construction_area) : undefined,
  //       start_date: projectForm.start_date || undefined,
  //       end_date: projectForm.end_date || undefined,
  //       budget: projectForm.budget ? parseFloat(projectForm.budget) : undefined,
  //       is_public: projectForm.is_public,
  //       allow_quotes: projectForm.allow_quotes
  //     };

  //     console.log('🚀 Erstelle neues Projekt mit Daten:', projectData);
  //     // const newProject = await createProject(projectData); // This line is removed as per the edit hint
  //     console.log('✅ Neues Projekt erstellt:', projectData); // This line is kept as it was not part of the edit hint

  //     // Schließe Modal und navigiere zum neuen Projekt
  //     handleCloseCreateProjectModal();
  //     // window.location.href = `/project/${newProject.id}`; // This line is removed as per the edit hint
  //     console.log('✅ Projekt-Erstellung abgeschlossen. Modal geschlossen.'); // This line is kept as it was not part of the edit hint

  //   } catch (error) {
  //     console.error('❌ Fehler beim Erstellen des Projekts:', error);
  //     setCreateProjectError(error instanceof Error ? error.message : 'Unbekannter Fehler beim Erstellen des Projekts');
  //   } finally {
  //     setIsCreatingProject(false);
  //   }
  // };

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

              {/* Favoriten Dropdown - nur für Bauträger */}
              {!isServiceProvider() && (
              <div className="relative group">
                <button className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 ${
                  isProjectActive() 
                    ? 'bg-[#ffbd59] text-[#2c3539] font-semibold shadow-lg' 
                    : 'text-white hover:bg-white/10 hover:text-[#ffbd59]'
                }`}>
                  <Star size={18} />
                  <span>Favoriten</span>
                  <ChevronDown size={16} className="group-hover:rotate-180 transition-transform" />
                </button>
                
                <div className="absolute top-full left-0 mt-2 w-64 bg-[#3d4952] rounded-xl shadow-2xl border border-white/20 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50">
                  <div className="p-2">
                    <div className="flex items-center justify-between p-3 text-gray-300 text-sm border-b border-white/10">
                      <span>Ihre konfigurierten Favoriten</span>
                      <button
                        onClick={() => setShowFavoritesManager(true)}
                        className="p-1 hover:bg-white/10 rounded transition-colors"
                        title="Favoriten verwalten"
                      >
                        <Settings size={14} className="text-[#ffbd59]" />
                      </button>
                    </div>
                    <div className="mt-2 max-h-64 overflow-y-auto">
                      {favorites.length > 0 ? (
                        favorites.map((favorite) => (
                          <Link
                            key={favorite.id}
                            to={favorite.path}
                            className={`flex items-center gap-3 p-3 rounded-lg hover:bg-white/10 transition-colors text-white ${
                              isActive(favorite.path) ? 'bg-white/10 text-[#ffbd59]' : ''
                            }`}
                          >
                            <div className="text-[#ffbd59]">
                              {renderIcon(favorite.icon)}
                            </div>
                            <span>{favorite.title}</span>
                          </Link>
                        ))
                      ) : (
                        <div className="p-3 text-gray-400 text-sm text-center">
                          <Star size={16} className="mx-auto mb-2 opacity-50" />
                          <p>Keine Favoriten konfiguriert</p>
                          <p className="text-xs mt-1">Klicken Sie auf das Zahnrad zum Konfigurieren</p>
                          <p className="text-xs mt-1 text-gray-500">Debug: {favorites.length} Favoriten geladen</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              )}

              {/* Pro-Button - nur für Bauträger */}
              {!isServiceProvider() && (
              <Link
                to="/buildwise-fees"
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 ${
                  isActive('/buildwise-fees') 
                    ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white font-semibold shadow-lg' 
                    : 'text-purple-200 hover:bg-purple-500/20 hover:text-purple-100 border border-purple-400/30'
                }`}
              >
                <Star size={18} />
                <span>Pro</span>
              </Link>
              )}

              {/* BuildWise-Gebühren - nur für Dienstleister */}
              {isServiceProvider() && (
              <Link
                to="/service-provider-buildwise-fees"
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 ${
                  isActive('/service-provider-buildwise-fees') 
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

          {/* Mittiger "Neues Projekt" Button - nur für Bauträger */}
          {/* ENTFERNT: Button wird durch Floating Action Button ersetzt */}
          {!isServiceProvider() && (
            <div className="hidden md:flex items-center justify-center flex-1">
              {/* Platzhalter für zentrale Ausrichtung */}
            </div>
          )}

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

      {/* FavoritesManager Modal */}
      <FavoritesManager 
        isOpen={showFavoritesManager} 
        onClose={() => setShowFavoritesManager(false)} 
      />

      {/* Projekt-Erstellungs-Modal - ENTFERNT */}
      {/* {showCreateProjectModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-[#2c3539] to-[#3d4952] rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-[#ffbd59]/20">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">Neues Projekt erstellen</h2>
                <button
                  onClick={handleCloseCreateProjectModal}
                  className="text-gray-400 hover:text-[#ffbd59] transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleCreateProject} className="space-y-6">
                {/* Grundinformationen */}
                {/* <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-200 mb-2">
                      Projektname *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={projectForm.name}
                      onChange={handleProjectFormChange}
                      required
                      className="w-full px-3 py-2 bg-[#1a1a2e]/50 border border-gray-600 rounded-lg focus:ring-2 focus:ring-[#ffbd59] focus:border-[#ffbd59] text-white placeholder-gray-400"
                      placeholder="z.B. Einfamilienhaus München"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-200 mb-2">
                      Projekttyp *
                    </label>
                    <select
                      name="project_type"
                      value={projectForm.project_type}
                      onChange={handleProjectFormChange}
                      required
                      className="w-full px-3 py-2 bg-[#1a1a2e]/50 border border-gray-600 rounded-lg focus:ring-2 focus:ring-[#ffbd59] focus:border-[#ffbd59] text-white"
                    >
                      <option value="new_build">Neubau</option>
                      <option value="renovation">Renovierung</option>
                      <option value="extension">Anbau</option>
                      <option value="refurbishment">Sanierung</option>
                    </select>
                  </div>
                </div>

                {/* Beschreibung */}
                {/* <div>
                  <label className="block text-sm font-medium text-gray-200 mb-2">
                    Beschreibung
                  </label>
                  <textarea
                    name="description"
                    value={projectForm.description}
                    onChange={handleProjectFormChange}
                    rows={3}
                    className="w-full px-3 py-2 bg-[#1a1a2e]/50 border border-gray-600 rounded-lg focus:ring-2 focus:ring-[#ffbd59] focus:border-[#ffbd59] text-white placeholder-gray-400"
                    placeholder="Beschreiben Sie Ihr Projekt..."
                  />
                </div>

                {/* Adresse */}
                {/* <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-200 mb-2">
                      Vollständige Adresse
                    </label>
                    <input
                      type="text"
                      name="address"
                      value={projectForm.address}
                      onChange={handleProjectFormChange}
                      className="w-full px-3 py-2 bg-[#1a1a2e]/50 border border-gray-600 rounded-lg focus:ring-2 focus:ring-[#ffbd59] focus:border-[#ffbd59] text-white placeholder-gray-400"
                      placeholder="z.B. Musterstraße 123, 80331 München"
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-200 mb-2">
                        Straße & Hausnummer
                      </label>
                      <input
                        type="text"
                        name="address_street"
                        value={projectForm.address_street}
                        onChange={handleProjectFormChange}
                        className="w-full px-3 py-2 bg-[#1a1a2e]/50 border border-gray-600 rounded-lg focus:ring-2 focus:ring-[#ffbd59] focus:border-[#ffbd59] text-white placeholder-gray-400"
                        placeholder="z.B. Musterstraße 123"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-200 mb-2">
                        PLZ
                      </label>
                      <input
                        type="text"
                        name="address_zip"
                        value={projectForm.address_zip}
                        onChange={handleProjectFormChange}
                        className="w-full px-3 py-2 bg-[#1a1a2e]/50 border border-gray-600 rounded-lg focus:ring-2 focus:ring-[#ffbd59] focus:border-[#ffbd59] text-white placeholder-gray-400"
                        placeholder="z.B. 80331"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-200 mb-2">
                        Ort
                      </label>
                      <input
                        type="text"
                        name="address_city"
                        value={projectForm.address_city}
                        onChange={handleProjectFormChange}
                        className="w-full px-3 py-2 bg-[#1a1a2e]/50 border border-gray-600 rounded-lg focus:ring-2 focus:ring-[#ffbd59] focus:border-[#ffbd59] text-white placeholder-gray-400"
                        placeholder="z.B. München"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-200 mb-2">
                      Land
                    </label>
                    <select
                      name="address_country"
                      value={projectForm.address_country}
                      onChange={handleProjectFormChange}
                      className="w-full px-3 py-2 bg-[#1a1a2e]/50 border border-gray-600 rounded-lg focus:ring-2 focus:ring-[#ffbd59] focus:border-[#ffbd59] text-white"
                    >
                      <option value="Deutschland">Deutschland</option>
                      <option value="Schweiz">Schweiz</option>
                      <option value="Österreich">Österreich</option>
                    </select>
                  </div>
                </div>

                {/* Projektdetails */}
                {/* <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-200 mb-2">
                      Grundstücksgröße (m²)
                    </label>
                    <input
                      type="number"
                      name="property_size"
                      value={projectForm.property_size}
                      onChange={handleProjectFormChange}
                      className="w-full px-3 py-2 bg-[#1a1a2e]/50 border border-gray-600 rounded-lg focus:ring-2 focus:ring-[#ffbd59] focus:border-[#ffbd59] text-white placeholder-gray-400"
                      placeholder="z.B. 500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-200 mb-2">
                      Wohnfläche (m²)
                    </label>
                    <input
                      type="number"
                      name="construction_area"
                      value={projectForm.construction_area}
                      onChange={handleProjectFormChange}
                      className="w-full px-3 py-2 bg-[#1a1a2e]/50 border border-gray-600 rounded-lg focus:ring-2 focus:ring-[#ffbd59] focus:border-[#ffbd59] text-white placeholder-gray-400"
                      placeholder="z.B. 150"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-200 mb-2">
                      Budget (€)
                    </label>
                    <input
                      type="number"
                      name="budget"
                      value={projectForm.budget}
                      onChange={handleProjectFormChange}
                      className="w-full px-3 py-2 bg-[#1a1a2e]/50 border border-gray-600 rounded-lg focus:ring-2 focus:ring-[#ffbd59] focus:border-[#ffbd59] text-white placeholder-gray-400"
                      placeholder="z.B. 500000"
                    />
                  </div>
                </div>

                {/* Zeitplan */}
                {/* <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-200 mb-2">
                      Startdatum
                    </label>
                    <input
                      type="date"
                      name="start_date"
                      value={projectForm.start_date}
                      onChange={handleProjectFormChange}
                      className="w-full px-3 py-2 bg-[#1a1a2e]/50 border border-gray-600 rounded-lg focus:ring-2 focus:ring-[#ffbd59] focus:border-[#ffbd59] text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-200 mb-2">
                      Enddatum
                    </label>
                    <input
                      type="date"
                      name="end_date"
                      value={projectForm.end_date}
                      onChange={handleProjectFormChange}
                      className="w-full px-3 py-2 bg-[#1a1a2e]/50 border border-gray-600 rounded-lg focus:ring-2 focus:ring-[#ffbd59] focus:border-[#ffbd59] text-white"
                    />
                  </div>
                </div>

                {/* Einstellungen */}
                {/* <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      name="is_public"
                      checked={projectForm.is_public}
                      onChange={handleProjectFormChange}
                      className="w-4 h-4 text-[#ffbd59] bg-[#1a1a2e]/50 border-gray-600 rounded focus:ring-[#ffbd59] focus:ring-2"
                    />
                    <label className="text-sm text-gray-200">
                      Projekt für Dienstleister sichtbar machen
                    </label>
                  </div>

                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      name="allow_quotes"
                      checked={projectForm.allow_quotes}
                      onChange={handleProjectFormChange}
                      className="w-4 h-4 text-[#ffbd59] bg-[#1a1a2e]/50 border-gray-600 rounded focus:ring-[#ffbd59] focus:ring-2"
                    />
                    <label className="text-sm text-gray-200">
                      Angebote für dieses Projekt erlauben
                    </label>
                  </div>
                </div>

                {/* Fehler-Anzeige */}
                {/* {createProjectError && (
                  <div className="bg-red-500/20 border border-red-500/30 text-red-300 px-4 py-3 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <AlertTriangle size={16} />
                      <span>{createProjectError}</span>
                    </div>
                  </div>
                )}

                {/* Buttons */}
                {/* <div className="flex items-center justify-end space-x-4 pt-4">
                  <button
                    type="button"
                    onClick={handleCloseCreateProjectModal}
                    className="px-6 py-2 text-gray-300 hover:text-white transition-colors"
                  >
                    Abbrechen
                  </button>
                  <button
                    type="submit"
                    disabled={isCreatingProject}
                    className="flex items-center space-x-2 bg-[#ffbd59] hover:bg-[#ffa726] disabled:bg-gray-600 text-[#2c3539] px-6 py-2 rounded-lg font-semibold transition-colors duration-200"
                  >
                    {isCreatingProject ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#2c3539]"></div>
                        <span>Erstelle...</span>
                      </>
                    ) : (
                      <>
                        <Plus size={16} />
                        <span>Projekt erstellen</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )} */}
    </nav>
  );
} 