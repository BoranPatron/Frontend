import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Star, 
  StarOff, 
  Plus, 
  Settings, 
  X, 
  GripVertical,
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

interface FavoriteItem {
  id: string;
  title: string;
  path: string;
  icon: React.ReactNode;
  category: 'navigation' | 'tools' | 'projects';
  isActive?: boolean;
}

interface FavoritesManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

const availableItems: FavoriteItem[] = [
  // Navigation
  { id: 'dashboard', title: 'Dashboard', path: '/', icon: <Home size={16} />, category: 'navigation' },
  { id: 'global-projects', title: 'Übersicht', path: '/global-projects', icon: <Globe size={16} />, category: 'navigation' },
  { id: 'service-provider', title: 'Dienstleister', path: '/service-provider', icon: <Users size={16} />, category: 'navigation' },
  
  // Tools
  { id: 'tasks', title: 'Aufgaben', path: '/tasks', icon: <Target size={16} />, category: 'tools' },
  { id: 'finance', title: 'Finanzen', path: '/finance', icon: <Euro size={16} />, category: 'tools' },
  { id: 'documents', title: 'Dokumente', path: '/documents', icon: <FileText size={16} />, category: 'tools' },
  { id: 'visualize', title: 'Visualisierung', path: '/visualize', icon: <BarChart3 size={16} />, category: 'tools' },
  { id: 'roadmap', title: 'Roadmap', path: '/roadmap', icon: <Calendar size={16} />, category: 'tools' },
  { id: 'quotes', title: 'Gewerke', path: '/quotes', icon: <Handshake size={16} />, category: 'tools' },
  { id: 'buildwise-fees', title: 'Gebühren', path: '/buildwise-fees', icon: <DollarSign size={16} />, category: 'tools' },
  { id: 'messages', title: 'Messenger', path: '/messages', icon: <MessageCircle size={16} />, category: 'tools' },
  
  // Projects (dynamisch)
  { id: 'project-template', title: 'Projekt', path: '/project/:id', icon: <Building size={16} />, category: 'projects' },
];

export default function FavoritesManager({ isOpen, onClose }: FavoritesManagerProps) {
  const { isServiceProvider } = useAuth();
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  // Lade Favoriten beim Start
  useEffect(() => {
    const loadFavorites = () => {
      const savedFavorites = localStorage.getItem('buildwise-favorites');
      if (savedFavorites) {
        setFavorites(JSON.parse(savedFavorites));
      } else {
        // Standard-Favoriten basierend auf Benutzerrolle
        const defaultFavorites: FavoriteItem[] = isServiceProvider() 
          ? [
              { id: 'dashboard', title: 'Dashboard', path: '/service-provider', icon: '<Home size={16} />', category: 'navigation' as const },
              { id: 'messages', title: 'Messenger', path: '/messages', icon: '<MessageCircle size={16} />', category: 'tools' as const },
              { id: 'quotes', title: 'Gewerke', path: '/quotes', icon: '<Handshake size={16} />', category: 'tools' as const },
            ]
          : [
              { id: 'dashboard', title: 'Dashboard', path: '/', icon: '<Home size={16} />', category: 'navigation' as const },
              { id: 'tasks', title: 'Aufgaben', path: '/tasks', icon: '<Target size={16} />', category: 'tools' as const },
              { id: 'finance', title: 'Finanzen', path: '/finance', icon: '<Euro size={16} />', category: 'tools' as const },
            ];
        setFavorites(defaultFavorites);
        localStorage.setItem('buildwise-favorites', JSON.stringify(defaultFavorites));
      }
    };

    loadFavorites();

    // Event-Listener für localStorage-Änderungen
    const handleStorageChange = () => {
      console.log('🔄 FavoritesManager: localStorage geändert - Favoriten neu laden');
      loadFavorites();
    };

    // Event-Listener für benutzerdefinierte Events
    const handleFavoritesChanged = (event: Event) => {
      const customEvent = event as CustomEvent;
      // Prüfe ob das Event vom FavoritesManager selbst ausgelöst wurde
      if (customEvent.detail?.source === 'FavoritesManager') {
        return;
      }
      console.log('🔄 FavoritesManager: Favoriten geändert - Favoriten neu laden', customEvent.detail);
      loadFavorites();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('favoritesChanged', handleFavoritesChanged as EventListener);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('favoritesChanged', handleFavoritesChanged as EventListener);
    };
  }, [isServiceProvider]);

  // Speichere Favoriten bei Änderungen
  useEffect(() => {
    if (favorites.length > 0) {
      localStorage.setItem('buildwise-favorites', JSON.stringify(favorites));
      // Events werden bereits in den einzelnen Funktionen ausgelöst
    }
  }, [favorites]);

  const handleAddFavorite = (item: FavoriteItem) => {
    if (!favorites.find(fav => fav.id === item.id)) {
      const newFavorites = [...favorites, item];
      setFavorites(newFavorites);
      // Sofort speichern und Event auslösen
      localStorage.setItem('buildwise-favorites', JSON.stringify(newFavorites));
      window.dispatchEvent(new CustomEvent('favoritesChanged', {
        detail: { favorites: newFavorites, source: 'FavoritesManager' }
      }));
    }
  };

  const handleRemoveFavorite = (id: string) => {
    const newFavorites = favorites.filter(fav => fav.id !== id);
    setFavorites(newFavorites);
    // Sofort speichern und Event auslösen
    localStorage.setItem('buildwise-favorites', JSON.stringify(newFavorites));
    window.dispatchEvent(new CustomEvent('favoritesChanged', {
      detail: { favorites: newFavorites, source: 'FavoritesManager' }
    }));
  };

  const handleDragStart = (index: number) => {
    setDragIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (dragIndex !== null && dragIndex !== index) {
      const newFavorites = [...favorites];
      const draggedItem = newFavorites[dragIndex];
      newFavorites.splice(dragIndex, 1);
      newFavorites.splice(index, 0, draggedItem);
      setFavorites(newFavorites);
      setDragIndex(index);
      // Sofort speichern und Event auslösen
      localStorage.setItem('buildwise-favorites', JSON.stringify(newFavorites));
      window.dispatchEvent(new CustomEvent('favoritesChanged', {
        detail: { favorites: newFavorites, source: 'FavoritesManager' }
      }));
    }
  };

  const handleDragEnd = () => {
    setDragIndex(null);
  };

  const getAvailableItems = () => {
    return availableItems.filter(item => {
      // Filtere basierend auf Benutzerrolle
      if (isServiceProvider()) {
        return item.id !== 'buildwise-fees' && item.id !== 'global-projects';
      } else {
        return item.id !== 'service-provider';
      }
    }).filter(item => !favorites.find(fav => fav.id === item.id));
  };

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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-[#3d4952] rounded-xl shadow-2xl border border-white/20 w-full max-w-4xl max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <Star className="text-[#ffbd59]" size={24} />
            <h2 className="text-xl font-semibold text-white">Favoriten verwalten</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsEditing(!isEditing)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                isEditing 
                  ? 'bg-[#ffbd59] text-[#2c3539]' 
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              <Settings size={16} />
              <span className="text-sm">{isEditing ? 'Bearbeitung beenden' : 'Bearbeiten'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X size={20} className="text-white" />
            </button>
          </div>
        </div>

        <div className="flex h-[calc(80vh-120px)]">
          {/* Favoriten Liste */}
          <div className="flex-1 p-6 border-r border-white/10">
            <h3 className="text-lg font-medium text-white mb-4">Aktuelle Favoriten</h3>
            <div className="space-y-2 max-h-full overflow-y-auto">
              {favorites.map((favorite, index) => (
                <div
                  key={favorite.id}
                  draggable={isEditing}
                  onDragStart={() => isEditing && handleDragStart(index)}
                  onDragOver={(e) => isEditing && handleDragOver(e, index)}
                  onDragEnd={handleDragEnd}
                  className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                    dragIndex === index ? 'opacity-50' : 'opacity-100'
                  } ${
                    isEditing 
                      ? 'bg-white/5 hover:bg-white/10 cursor-move' 
                      : 'bg-white/5 hover:bg-white/10'
                  }`}
                >
                  {isEditing && (
                    <GripVertical size={16} className="text-gray-400 cursor-move" />
                  )}
                  <div className="text-[#ffbd59]">
                    {renderIcon(favorite.icon as string)}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-white">{favorite.title}</div>
                    <div className="text-sm text-gray-300">{favorite.path}</div>
                  </div>
                  {isEditing && (
                    <button
                      onClick={() => handleRemoveFavorite(favorite.id)}
                      className="p-1 hover:bg-red-500/20 rounded transition-colors"
                    >
                      <X size={16} className="text-red-400" />
                    </button>
                  )}
                </div>
              ))}
              {favorites.length === 0 && (
                <div className="text-center py-8 text-gray-400">
                  <StarOff size={48} className="mx-auto mb-4 opacity-50" />
                  <p>Keine Favoriten hinzugefügt</p>
                  <p className="text-sm">Fügen Sie Funktionen aus der rechten Liste hinzu</p>
                </div>
              )}
            </div>
          </div>

          {/* Verfügbare Funktionen */}
          <div className="w-80 p-6">
            <h3 className="text-lg font-medium text-white mb-4">Verfügbare Funktionen</h3>
            <div className="space-y-2 max-h-full overflow-y-auto">
              {getAvailableItems().map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleAddFavorite(item)}
                  className="flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors w-full text-left"
                >
                  <div className="text-[#ffbd59]">
                    {item.icon}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-white">{item.title}</div>
                    <div className="text-sm text-gray-300">{item.path}</div>
                  </div>
                  <Plus size={16} className="text-[#ffbd59]" />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/10 bg-[#2c3539]">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-300">
              {favorites.length} Favorit{favorites.length !== 1 ? 'en' : ''} konfiguriert
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setFavorites([]);
                  localStorage.removeItem('buildwise-favorites');
                  // Event auslösen für andere Komponenten
                  window.dispatchEvent(new Event('storage'));
                }}
                className="px-4 py-2 text-sm text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
              >
                Alle entfernen
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-[#ffbd59] text-[#2c3539] rounded-lg font-medium hover:bg-[#ffa726] transition-colors"
              >
                Schließen
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 