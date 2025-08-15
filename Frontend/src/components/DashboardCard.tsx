import React, { useState, useEffect } from 'react';
import { Star } from 'lucide-react';

interface DashboardCardProps {
  title: string;
  icon: React.ReactNode;
  children?: React.ReactNode;
  onClick: () => void;
  ariaLabel: string;
  status?: 'online' | 'offline' | 'syncing';
  badge?: {
    text: string;
    color: 'green' | 'yellow' | 'red' | 'blue';
  };
  progress?: {
    value: number;
    label: string;
  };
  // Neue Props für Favoriten-System
  cardId: string;
  path: string;
  iconString: string;
}

// Hilfsfunktion für Bauphasen
const getConstructionPhases = (country: string) => {
  switch (country) {
    case 'Schweiz':
      return [
        { value: 'vorprojekt', label: 'Vorprojekt' },
        { value: 'projektierung', label: 'Projektierung' },
        { value: 'baugenehmigung', label: 'Baugenehmigung' },
        { value: 'ausschreibung', label: 'Ausschreibung' },
        { value: 'aushub', label: 'Aushub' },
        { value: 'fundament', label: 'Fundament' },
        { value: 'rohbau', label: 'Rohbau' },
        { value: 'dach', label: 'Dach' },
        { value: 'fassade', label: 'Fassade' },
        { value: 'innenausbau', label: 'Innenausbau' },
        { value: 'fertigstellung', label: 'Fertigstellung' }
      ];
    case 'Deutschland':
      return [
        { value: 'planungsphase', label: 'Planungsphase' },
        { value: 'baugenehmigung', label: 'Baugenehmigung' },
        { value: 'ausschreibung', label: 'Ausschreibung' },
        { value: 'aushub', label: 'Aushub' },
        { value: 'fundament', label: 'Fundament' },
        { value: 'rohbau', label: 'Rohbau' },
        { value: 'dach', label: 'Dach' },
        { value: 'fassade', label: 'Fassade' },
        { value: 'innenausbau', label: 'Innenausbau' },
        { value: 'fertigstellung', label: 'Fertigstellung' }
      ];
    case 'Österreich':
      return [
        { value: 'planungsphase', label: 'Planungsphase' },
        { value: 'einreichung', label: 'Einreichung' },
        { value: 'ausschreibung', label: 'Ausschreibung' },
        { value: 'aushub', label: 'Aushub' },
        { value: 'fundament', label: 'Fundament' },
        { value: 'rohbau', label: 'Rohbau' },
        { value: 'dach', label: 'Dach' },
        { value: 'fassade', label: 'Fassade' },
        { value: 'innenausbau', label: 'Innenausbau' },
        { value: 'fertigstellung', label: 'Fertigstellung' }
      ];
    default:
      return [];
  }
};

export default function DashboardCard({ 
  title, 
  icon, 
  children, 
  onClick, 
  ariaLabel, 
  status,
  badge,
  progress,
  cardId,
  path,
  iconString
}: DashboardCardProps) {
  const [isFavorite, setIsFavorite] = useState(false);
  // Alle Kacheln verwenden jetzt das gleiche Design - keine spezielle Behandlung mehr
  const isVisualize = false;

  // Prüfe ob Karte in Favoriten ist
  useEffect(() => {
    const checkFavoriteStatus = () => {
      const savedFavorites = localStorage.getItem('buildwise-favorites');
      if (savedFavorites) {
        const favorites = JSON.parse(savedFavorites);
        setIsFavorite(favorites.some((fav: any) => fav.id === cardId));
      }
    };

    checkFavoriteStatus();

    // Event-Listener für localStorage-Änderungen (nur prüfen, keine Events auslösen)
    const handleStorageChange = () => {
      checkFavoriteStatus();
    };

    // Event-Listener für benutzerdefinierte Events (nur prüfen, keine Events auslösen)
    const handleFavoritesChanged = () => {
      checkFavoriteStatus();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('favoritesChanged', handleFavoritesChanged);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('favoritesChanged', handleFavoritesChanged);
    };
  }, [cardId]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'text-green-400';
      case 'offline': return 'text-red-400';
      case 'syncing': return 'text-yellow-400';
      default: return 'text-gray-400';
    }
  };

  const getBadgeColor = (color: string) => {
    switch (color) {
      case 'green': return 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg';
      case 'yellow': return 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-lg';
      case 'red': return 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg';
      case 'blue': return 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg';
      default: return 'bg-gradient-to-r from-gray-500 to-gray-600 text-white shadow-lg';
    }
  };

  const handleFavoriteToggle = (e: React.MouseEvent) => {
    e.stopPropagation(); // Verhindert das Auslösen des onClick der Karte
    
    const savedFavorites = localStorage.getItem('buildwise-favorites');
    let favorites = savedFavorites ? JSON.parse(savedFavorites) : [];
    
    if (isFavorite) {
      // Entferne aus Favoriten
      favorites = favorites.filter((fav: any) => fav.id !== cardId);
    } else {
      // Prüfe ob bereits in Favoriten (verhindert Duplikate)
      const exists = favorites.some((fav: any) => fav.id === cardId);
      if (!exists) {
        // Füge zu Favoriten hinzu
        favorites.push({
          id: cardId,
          title: title,
          path: path,
          icon: iconString,
          category: 'tools'
        });
      }
    }
    
    localStorage.setItem('buildwise-favorites', JSON.stringify(favorites));
    setIsFavorite(!isFavorite);
    
    // Benutzerdefiniertes Event auslösen für andere Komponenten
    window.dispatchEvent(new CustomEvent('favoritesChanged', {
      detail: { favorites: favorites, changedCardId: cardId }
    }));
    
    };



  return (
    <button
      className={`group relative bg-white/10 backdrop-blur-lg rounded-3xl p-8 cursor-pointer transition-all duration-500 hover:bg-white/15 hover:shadow-2xl focus:outline-none focus:ring-2 ${isVisualize ? 'focus:ring-[#51636f]' : 'focus:ring-[#ffbd59]'} focus:ring-opacity-50 min-h-[320px] w-full border border-white/20 ${isVisualize ? 'hover:border-[#51636f]/40' : 'hover:border-[#ffbd59]/30'} transform hover:-translate-y-2 hover:scale-105`}
      onClick={onClick}
      aria-label={ariaLabel}
      type="button"
      data-tour-id={cardId}
    >
      {/* Animated Background Glow */}
      <div className={`absolute inset-0 bg-gradient-to-br ${isVisualize ? 'from-[#51636f]/10' : 'from-[#ffbd59]/5'} to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>
      
      {/* Favoriten-Stern */}
      <div
        onClick={handleFavoriteToggle}
        className={`absolute top-4 left-4 z-10 p-2 rounded-full transition-all duration-300 cursor-pointer ${
          isFavorite 
            ? 'bg-[#ffbd59] text-[#2c3539] shadow-lg' 
            : 'bg-white/10 text-gray-400 hover:bg-white/20 hover:text-[#ffbd59]'
        }`}
        title={isFavorite ? 'Aus Favoriten entfernen' : 'Zu Favoriten hinzufügen'}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleFavoriteToggle(e as any);
          }
        }}
      >
        <Star size={16} className={isFavorite ? 'fill-current' : ''} />
      </div>
      
      {/* Status Indicator */}
      {status && (
        <div className={`absolute top-4 left-16 flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium backdrop-blur-md border ${
          status === 'online' 
            ? 'bg-green-500/20 text-green-300 border-green-500/30' 
            : status === 'offline'
            ? 'bg-red-500/20 text-red-300 border-red-500/30'
            : 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'
        }`}>
          <span className="capitalize">{status}</span>
        </div>
      )}

      {/* Badge */}
      {badge && (
        <div className={`absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-bold ${getBadgeColor(badge.color)} transform group-hover:scale-110 transition-transform duration-300`}>
          {badge.text}
        </div>
      )}

      {/* Icon Container */}
      <div className="relative flex items-center justify-center mb-6">
        <div className={`absolute inset-0 bg-gradient-to-br ${isVisualize ? 'from-[#51636f] to-[#3a4a57]' : 'from-[#ffbd59] to-[#ffa726]'} rounded-2xl blur-lg opacity-30 group-hover:opacity-50 transition-opacity duration-500`}></div>
        <div className={`relative w-20 h-20 bg-gradient-to-br ${isVisualize ? 'from-[#51636f] to-[#3a4a57]' : 'from-[#ffbd59] to-[#ffa726]'} rounded-2xl flex items-center justify-center shadow-xl group-hover:shadow-2xl transition-all duration-500 transform group-hover:scale-110 group-hover:rotate-3`}>
          <div className="text-white drop-shadow-lg">
            {icon}
          </div>
        </div>
      </div>

      {/* Title */}
      <h3 className={`font-bold text-2xl mb-3 tracking-wide text-white transition-all duration-300 text-center ${isVisualize ? 'group-hover:text-[#51636f]' : 'group-hover:text-[#ffbd59]'}`}>
        {title}
      </h3>

      {/* Custom Content */}
      {children && (
        <div className="text-sm text-gray-300 text-center group-hover:text-gray-200 transition-colors w-full mb-6">
          {children}
        </div>
      )}



      {/* Progress Bar */}
      {progress && (
        <div className="space-y-3 w-full">
          <div className="flex justify-between text-xs text-gray-400">
            <span>{progress.label}</span>
            <span className={`${isVisualize ? 'text-[#51636f]' : 'text-[#ffbd59]'} font-bold`}>{progress.value}%</span>
          </div>
          <div className="relative w-full bg-gray-700/50 rounded-full h-3 backdrop-blur-sm border border-gray-600/30 overflow-hidden">
            <div 
              className={`absolute inset-0 bg-gradient-to-r ${isVisualize ? 'from-[#51636f] to-[#3a4a57]' : 'from-[#ffbd59] to-[#ffa726]'} h-3 rounded-full transition-all duration-1000 ease-out shadow-lg`}
              style={{ width: `${progress.value}%` }}
              role="progressbar"
              aria-valuenow={progress.value}
              aria-valuemin={0}
              aria-valuemax={100}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent h-3 rounded-full animate-pulse"></div>
          </div>
        </div>
      )}

      {/* Hover Effect Overlay */}
      <div className={`absolute inset-0 bg-gradient-to-br ${isVisualize ? 'from-[#51636f]/0 to-[#51636f]/5' : 'from-[#ffbd59]/0 to-[#ffbd59]/5'} rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none`}></div>
    </button>
  );
}
