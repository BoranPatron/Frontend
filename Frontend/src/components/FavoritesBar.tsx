import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Star, 
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
  Building,
  X,
  CheckSquare,
  MessageSquare,
  TrendingUp,
  Upload,
  Clock
} from 'lucide-react';

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
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

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
      '<CheckSquare size={16} />': <CheckSquare size={16} />,
      '<MessageSquare size={16} />': <MessageSquare size={16} />,
      '<TrendingUp size={16} />': <TrendingUp size={16} />,
      '<Upload size={16} />': <Upload size={16} />,
      '<Clock size={16} />': <Clock size={16} />,
    };
    return iconMap[iconString] || <Star size={16} />;
  };

  const isActive = (path: string) => {
    if (path === '/') {
      return pathname === '/' || (isServiceProvider() && pathname === '/service-provider');
    }
    return pathname === path || pathname.startsWith(path + '/');
  };

  const handleRemoveFavorite = (favoriteId: string) => {
    const updatedFavorites = favorites.filter(fav => fav.id !== favoriteId);
    setFavorites(updatedFavorites);
    localStorage.setItem('buildwise-favorites', JSON.stringify(updatedFavorites));
    
    // Trigger storage event für andere Komponenten
    window.dispatchEvent(new Event('storage'));
  };

  if (favorites.length === 0) {
    return null;
  }

  return (
    <>
      <div className="flex items-center gap-1">
        {favorites.map((favorite) => (
          <div
            key={favorite.id}
            className="relative group"
            onMouseEnter={() => setHoveredItem(favorite.id)}
            onMouseLeave={() => setHoveredItem(null)}
          >
            <Link
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
            
            {/* Löschen-Button */}
            <button
              onClick={() => handleRemoveFavorite(favorite.id)}
              className={`absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center transition-all duration-300 ${
                hoveredItem === favorite.id 
                  ? 'opacity-100 scale-100' 
                  : 'opacity-0 scale-75'
              } hover:bg-red-600 hover:scale-110`}
              title={`${favorite.title} aus Favoriten entfernen`}
            >
              <X size={12} />
            </button>
          </div>
        ))}
      </div>
    </>
  );
} 