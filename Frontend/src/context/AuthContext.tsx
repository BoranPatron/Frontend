import React, { createContext, useContext, useState, useEffect } from 'react';

interface AuthContextType {
  token: string | null;
  user: any;
  isInitialized: boolean;
  login: (token: string, user: any) => void;
  logout: () => void;
  isServiceProvider: () => boolean;
  isAuthenticated: () => boolean;
  userRole: string | null;
  roleSelected: boolean;
  selectRole: (role: 'bautraeger' | 'dienstleister') => Promise<void>;
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
  const [userRole, setUserRole] = useState<string | null>(null);
  const [roleSelected, setRoleSelected] = useState(false);

  // Initialisiere Auth-Daten beim ersten Laden mit Verzögerung
  useEffect(() => {
    console.log('🔧 Initialisiere AuthContext...');
    
    const initializeAuth = async () => {
      try {
        const storedToken = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');
        const rememberMe = localStorage.getItem('rememberMe');
        const sessionExpiry = localStorage.getItem('sessionExpiry');
        
        console.log('🔑 Token aus localStorage:', storedToken ? '✅ Vorhanden' : '❌ Fehlt');
        console.log('👤 User aus localStorage:', storedUser ? '✅ Vorhanden' : '❌ Fehlt');
        console.log('💾 Remember Me:', rememberMe ? '✅ Aktiv' : '❌ Inaktiv');
        
        // Prüfe Session-Ablauf bei "Angemeldet bleiben"
        if (rememberMe === 'true' && sessionExpiry) {
          const expiryDate = new Date(sessionExpiry);
          const now = new Date();
          
          if (now > expiryDate) {
            console.log('❌ Session abgelaufen - entferne alle Daten');
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            localStorage.removeItem('rememberMe');
            localStorage.removeItem('sessionExpiry');
            setToken(null);
            setUser(null);
            setIsInitialized(true);
            setIsInitializing(false);
            return;
          } else {
            console.log('✅ Session noch gültig bis:', expiryDate.toLocaleString());
          }
        }
        
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
            console.log('🔍 Rollen-Debug:', {
              hasUserRole: !!userData.user_role,
              userRole: userData.user_role,
              hasRoleSelected: userData.role_selected !== undefined,
              roleSelected: userData.role_selected,
              subscriptionPlan: userData.subscription_plan
            });
            
            // IMMER aktuelle User-Daten vom Backend laden (verhindert veraltete localStorage-Daten)
            console.log('🔄 Lade immer aktuelle User-Daten vom Backend');
            try {
              const response = await fetch('http://localhost:8000/api/v1/users/me', {
                headers: {
                  'Authorization': `Bearer ${storedToken}`,
                  'Content-Type': 'application/json'
                }
              });
              
              if (response.ok) {
                const freshUserData = await response.json();
                console.log('✅ Aktuelle User-Daten geladen:', freshUserData);
                console.log('🔍 Fresh Rollen-Debug:', {
                  hasUserRole: !!freshUserData.user_role,
                  userRole: freshUserData.user_role,
                  hasRoleSelected: freshUserData.role_selected !== undefined,
                  roleSelected: freshUserData.role_selected,
                  subscriptionPlan: freshUserData.subscription_plan
                });
                
                setUser(freshUserData);
                localStorage.setItem('user', JSON.stringify(freshUserData));
                
                // Setze Rollen-Informationen
                if (freshUserData.user_role) {
                  setUserRole(freshUserData.user_role);
                }
                if (freshUserData.role_selected !== undefined) {
                  setRoleSelected(freshUserData.role_selected);
                }
              } else {
                console.log('❌ Fehler beim Laden der User-Daten - verwende localStorage');
                setUser(userData);
                
                // Setze Rollen-Informationen aus localStorage
                if (userData.user_role) {
                  setUserRole(userData.user_role);
                }
                if (userData.role_selected !== undefined) {
                  setRoleSelected(userData.role_selected);
                }
              }
            } catch (error) {
              console.log('❌ Netzwerk-Fehler - verwende localStorage:', error);
              setUser(userData);
              
              // Setze Rollen-Informationen aus localStorage
              if (userData.user_role) {
                setUserRole(userData.user_role);
              }
              if (userData.role_selected !== undefined) {
                setRoleSelected(userData.role_selected);
              }
            }
            
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
          rememberMe: rememberMe === 'true',
          isInitialized: true
        });
      } catch (error) {
        console.error('❌ Fehler bei AuthContext-Initialisierung:', error);
        setIsInitialized(true);
        setIsInitializing(false);
      }
    };

    // Verzögerte Initialisierung für bessere Stabilität
    const timer = setTimeout(() => {
      initializeAuth().catch(error => {
        console.error('❌ Async-Fehler bei AuthContext-Initialisierung:', error);
        setIsInitialized(true);
        setIsInitializing(false);
      });
    }, 100);
    
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
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('rememberMe');
    localStorage.removeItem('sessionExpiry');
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

  // Funktion zum Auswählen der Benutzerrolle
  const selectRole = async (role: 'bautraeger' | 'dienstleister') => {
    try {
      console.log('🔄 Sende Rollenauswahl:', { role, hasToken: !!token, userId: user?.id });
      
      const response = await fetch('http://localhost:8000/api/v1/auth/select-role', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ role })
      });

      console.log('📡 Backend Response Status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.text();
        console.error('❌ Backend Error:', errorData);
        throw new Error(`Fehler beim Speichern der Rolle: ${errorData}`);
      }

      const data = await response.json();
      console.log('✅ Backend Response Data:', data);
      
      // Aktualisiere lokale States
      setUserRole(role);
      setRoleSelected(true);
      
      // Aktualisiere User-Objekt
      if (user) {
        const updatedUser = { ...user, user_role: role, role_selected: true };
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
      }
      
      console.log('✅ Rolle erfolgreich ausgewählt:', role);
    } catch (error) {
      console.error('❌ Fehler beim Auswählen der Rolle:', error);
      throw error;
    }
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
      isAuthenticated,
      userRole,
      roleSelected,
      selectRole
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