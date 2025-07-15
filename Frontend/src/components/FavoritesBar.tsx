import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Star, 
  Settings, 
  Home,
  Target,
  Euro,
  FileText,
  BarChart3,
  Calendar,
  Handshake,
  DollarSign,
  MessageCircle,
  Users,
  Globe,
  Building
} from 'lucide-react';
import FavoritesManager from './FavoritesManager';

interface FavoriteItem {
  id: string;
  title: string;
  path: string;
  icon: string;
  category: 'navigation' | 'tools' | 'projects';
  isActive?: boolean;
}

export default function FavoritesBar() {
  const { pathname } = useLocation();
  const { isServiceProvider } = useAuth();
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [showManager, setShowManager] = useState(false);

  // Lade Favoriten
  useEffect(() => {
    const savedFavorites = localStorage.getItem('buildwise-favorites');
    if (savedFavorites) {
      setFavorites(JSON.parse(savedFavorites));
    }
  }, []);

  // Aktualisiere Favoriten wenn sich localStorage ändert
  useEffect(() => {
    const handleStorageChange = () => {
      const savedFavorites = localStorage.getItem('buildwise-favorites');
      if (savedFavorites) {
        setFavorites(JSON.parse(savedFavorites));
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const renderIcon = (iconString: string) => {
    const iconMap: { [key: string]: React.ReactNode } = {
      '<Home size={16} />': <Home size={16} />,
      '<Target size={16} />': <Target size={16} />,
      '<Euro size={16} />': <Euro size={16} />,
      '<FileText size={16} />': <FileText size={16} />,
      '<BarChart3 size={16} />': <BarChart3 size={16} />,
      '<Calendar size={16} />': <Calendar size={16} />,
      '<Handshake size={16} />': <Handshake size={16} />,
      '<DollarSign size={16} />': <DollarSign size={16} />,
      '<MessageCircle size={16} />': <MessageCircle size={16} />,
      '<Users size={16} />': <Users size={16} />,
      '<Globe size={16} />': <Globe size={16} />,
      '<Building size={16} />': <Building size={16} />,
    };
    return iconMap[iconString] || <Star size={16} />;
  };

  const isActive = (path: string) => {
    if (path === '/') {
      return pathname === '/' || (isServiceProvider() && pathname === '/service-provider');
    }
    return pathname === path || pathname.startsWith(path + '/');
  };

  if (favorites.length === 0) {
    return null;
  }

  return (
    <>
      <div className="flex items-center gap-1">
        {favorites.map((favorite) => (
          <Link
            key={favorite.id}
            to={favorite.path}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-300 ${
              isActive(favorite.path)
                ? 'bg-[#ffbd59] text-[#2c3539] font-semibold shadow-lg' 
                : 'text-white hover:bg-white/10 hover:text-[#ffbd59]'
            }`}
            title={favorite.title}
          >
            <div className="text-current">
              {renderIcon(favorite.icon)}
            </div>
            <span className="hidden sm:inline">{favorite.title}</span>
          </Link>
        ))}
        
        {/* Favoriten-Manager Button */}
        <button
          onClick={() => setShowManager(true)}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-white hover:bg-white/10 hover:text-[#ffbd59] transition-all duration-300"
          title="Favoriten verwalten"
        >
          <Settings size={16} />
          <span className="hidden sm:inline">Favoriten</span>
        </button>
      </div>

      {/* Favoriten-Manager Modal */}
      <FavoritesManager 
        isOpen={showManager} 
        onClose={() => setShowManager(false)} 
      />
    </>
  );
} 