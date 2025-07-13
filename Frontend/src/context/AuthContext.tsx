import React, { createContext, useContext, useState, useEffect } from 'react';

interface AuthContextType {
  token: string | null;
  user: any;
  isInitialized: boolean;
  login: (token: string, user: any) => void;
  logout: () => void;
  isServiceProvider: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialisiere Auth-Daten beim ersten Laden
  useEffect(() => {
    console.log('🔧 Initialisiere AuthContext...');
    
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    
    console.log('🔑 Token aus localStorage:', storedToken ? '✅ Vorhanden' : '❌ Fehlt');
    console.log('👤 User aus localStorage:', storedUser ? '✅ Vorhanden' : '❌ Fehlt');
    
    if (storedToken) {
      setToken(storedToken);
    }
    
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        console.log('👤 User-Daten geparst:', userData);
        setUser(userData);
      } catch (error) {
        console.error('❌ Fehler beim Parsen der User-Daten:', error);
        localStorage.removeItem('user'); // Entferne ungültige Daten
      }
    }
    
    setIsInitialized(true);
    console.log('✅ AuthContext initialisiert');
  }, []);

  useEffect(() => {
    if (token) localStorage.setItem('token', token);
    else localStorage.removeItem('token');
  }, [token]);

  useEffect(() => {
    if (user) localStorage.setItem('user', JSON.stringify(user));
    else localStorage.removeItem('user');
  }, [user]);

  const login = (newToken: string, newUser: any) => {
    setToken(newToken);
    setUser(newUser);
  };

  const logout = () => {
    setToken(null);
    setUser(null);
  };

  // Hilfsfunktion um zu prüfen, ob der Benutzer ein Dienstleister ist
  const isServiceProvider = () => {
    return user?.user_type === 'service_provider' || user?.email?.includes('dienstleister');
  };

  return (
    <AuthContext.Provider value={{ token, user, isInitialized, login, logout, isServiceProvider }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth muss innerhalb von AuthProvider verwendet werden');
  return ctx;
} 