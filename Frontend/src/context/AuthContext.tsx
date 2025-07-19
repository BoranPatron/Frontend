import React, { createContext, useContext, useState, useEffect } from 'react';

interface AuthContextType {
  token: string | null;
  user: any;
  isInitialized: boolean;
  login: (token: string, user: any) => void;
  logout: () => void;
  isServiceProvider: () => boolean;
  isAuthenticated: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Hilfsfunktion zur Token-Validierung
const isTokenValid = (token: string): boolean => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Math.floor(Date.now() / 1000);
    return payload.exp > currentTime;
  } catch (error) {
    console.error('❌ Token-Validierung fehlgeschlagen:', error);
    return false;
  }
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  // Initialisiere Auth-Daten beim ersten Laden mit Verzögerung
  useEffect(() => {
    console.log('🔧 Initialisiere AuthContext...');
    
    const initializeAuth = () => {
      try {
        const storedToken = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');
        
        console.log('🔑 Token aus localStorage:', storedToken ? '✅ Vorhanden' : '❌ Fehlt');
        console.log('👤 User aus localStorage:', storedUser ? '✅ Vorhanden' : '❌ Fehlt');
        
        if (storedToken) {
          // Validiere Token vor der Verwendung
          if (isTokenValid(storedToken)) {
            setToken(storedToken);
            console.log('✅ Token gesetzt (gültig)');
          } else {
            console.log('❌ Token ist abgelaufen - entferne aus localStorage');
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            setToken(null);
            setUser(null);
          }
        }
        
        if (storedUser && storedToken && isTokenValid(storedToken)) {
          try {
            const userData = JSON.parse(storedUser);
            console.log('👤 User-Daten geparst:', userData);
            setUser(userData);
            console.log('✅ User gesetzt');
          } catch (error) {
            console.error('❌ Fehler beim Parsen der User-Daten:', error);
            localStorage.removeItem('user');
            setUser(null);
          }
        } else if (storedUser && (!storedToken || !isTokenValid(storedToken))) {
          // User-Daten vorhanden aber Token ungültig - entferne alles
          console.log('❌ Token ungültig - entferne User-Daten');
          localStorage.removeItem('user');
          setUser(null);
        }
        
        setIsInitialized(true);
        setIsInitializing(false);
        console.log('✅ AuthContext initialisiert');
        console.log('📊 Finaler Auth-Status:', {
          hasToken: !!storedToken && isTokenValid(storedToken),
          hasUser: !!storedUser,
          isInitialized: true
        });
      } catch (error) {
        console.error('❌ Fehler bei AuthContext-Initialisierung:', error);
        setIsInitialized(true);
        setIsInitializing(false);
      }
    };

    // Verzögerte Initialisierung für bessere Stabilität
    const timer = setTimeout(initializeAuth, 100);
    
    return () => clearTimeout(timer);
  }, []);

  // Token-Persistierung - nur nach der Initialisierung
  useEffect(() => {
    if (!isInitializing) {
      if (token) {
        localStorage.setItem('token', token);
        console.log('💾 Token in localStorage gespeichert');
      } else {
        localStorage.removeItem('token');
        console.log('🗑️ Token aus localStorage entfernt');
      }
    }
  }, [token, isInitializing]);

  // User-Persistierung - nur nach der Initialisierung
  useEffect(() => {
    if (!isInitializing) {
      if (user) {
        localStorage.setItem('user', JSON.stringify(user));
        console.log('💾 User in localStorage gespeichert');
      } else {
        localStorage.removeItem('user');
        console.log('🗑️ User aus localStorage entfernt');
      }
    }
  }, [user, isInitializing]);

  const login = (newToken: string, newUser: any) => {
    console.log('🔐 Login durchgeführt:', { hasToken: !!newToken, hasUser: !!newUser });
    setToken(newToken);
    setUser(newUser);
  };

  const logout = () => {
    console.log('🚪 Logout durchgeführt');
    setToken(null);
    setUser(null);
  };

  // Hilfsfunktion um zu prüfen, ob der Benutzer ein Dienstleister ist
  const isServiceProvider = () => {
    return user?.user_type === 'service_provider' || user?.email?.includes('dienstleister');
  };

  // Hilfsfunktion um zu prüfen, ob der Benutzer authentifiziert ist
  const isAuthenticated = () => {
    return !!user && !!token && isTokenValid(token);
  };

  // Debug-Logging für Auth-Status
  useEffect(() => {
    if (isInitialized) {
      console.log('🔍 AuthContext Status Update:', {
        hasToken: !!token,
        hasUser: !!user,
        isInitialized,
        isAuthenticated: isAuthenticated(),
        isServiceProvider: isServiceProvider()
      });
    }
  }, [token, user, isInitialized]);

  return (
    <AuthContext.Provider value={{ 
      token, 
      user, 
      isInitialized, 
      login, 
      logout, 
      isServiceProvider,
      isAuthenticated 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth muss innerhalb von AuthProvider verwendet werden');
  return ctx;
} 