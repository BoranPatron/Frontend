import React, { createContext, useContext, useState, useEffect } from 'react';
import CreditNotification from '../components/CreditNotification';

interface AuthContextType {
  token: string | null;
  user: any;
  isInitialized: boolean;
  login: (token: string, user: any) => Promise<void>;
  logout: () => void;
  isServiceProvider: () => boolean;
  isBautraeger: () => boolean;
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
  const [creditNotification, setCreditNotification] = useState<{
    creditsChanged: number;
    newBalance: number;
  } | null>(null);

  // Initialisiere Auth-Daten beim ersten Laden mit Verzögerung
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedToken = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');
        const rememberMe = localStorage.getItem('rememberMe');
        const sessionExpiry = localStorage.getItem('sessionExpiry');
        
        // Prüfe Session-Ablauf bei "Angemeldet bleiben"
        if (rememberMe === 'true' && sessionExpiry) {
          const expiryDate = new Date(sessionExpiry);
          const now = new Date();
          
          if (now > expiryDate) {
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
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            setToken(null);
            setUser(null);
          }
        }
        
        if (storedUser && storedToken && isTokenValid(storedToken)) {
          try {
            const userData = JSON.parse(storedUser);
            // IMMER aktuelle User-Daten vom Backend laden (verhindert veraltete localStorage-Daten)
            try {
              const response = await fetch('http://localhost:8000/api/v1/users/me', {
                headers: {
                  'Authorization': `Bearer ${storedToken}`,
                  'Content-Type': 'application/json'
                }
              });
              
              if (response.ok) {
                const freshUserData = await response.json();
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
            console.error('❌ Fehler beim Parsen der User-Daten:', error);
            localStorage.removeItem('user');
            setUser(null);
          }
        } else if (storedUser && (!storedToken || !isTokenValid(storedToken))) {
          // User-Daten vorhanden aber Token ungültig - entferne alles
          localStorage.removeItem('user');
          setUser(null);
        }
        
        setIsInitialized(true);
        setIsInitializing(false);
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
        } else {
        localStorage.removeItem('token');
        }
    }
  }, [token, isInitializing]);

  // User-Persistierung - nur nach der Initialisierung
  useEffect(() => {
    if (!isInitializing) {
      if (user) {
        localStorage.setItem('user', JSON.stringify(user));
        } else {
        localStorage.removeItem('user');
        }
    }
  }, [user, isInitializing]);

  const login = async (newToken: string, newUser: any) => {
    try {
      // Stoppe die Initialisierung, um Race Conditions zu vermeiden
      setIsInitializing(false);
      setIsInitialized(true);
      // Setze Token und User sofort
      setToken(newToken);
      setUser(newUser);
      // Persistiere sofort in localStorage (überschreibt alte Daten)
      localStorage.setItem('token', newToken);
      localStorage.setItem('user', JSON.stringify(newUser));
      // Setze Rollen-Informationen sofort
      if (newUser?.user_role) {
        setUserRole(newUser.user_role);
        }
      if (newUser?.role_selected !== undefined) {
        setRoleSelected(newUser.role_selected);
        }
      
          // Verarbeite täglichen Credit-Abzug für Bauträger (nur beim Login)
          if (newUser?.user_role === 'bautraeger' || newUser?.user_role === 'BAUTRAEGER') {
            try {
              const { processDailyLoginDeduction } = await import('../api/creditService');
              const result = await processDailyLoginDeduction();
              console.log('💰 Täglicher Credit-Abzug beim Login:', result);
              
              // DEBUG: Zeige detaillierte Informationen
              console.log('🔍 DEBUG - API Response Details:', {
                status: result.status,
                message: result.message,
                fullResponse: result
              });
              
              // Zeige Notification nur wenn Credit tatsächlich abgezogen wurde
              if (result.status === 'success') {
                console.log('✅ Credit wurde abgezogen - zeige Notification');
                // Hole aktuelle Credit-Balance für Notification
                const { getCreditBalance } = await import('../api/creditService');
                const balance = await getCreditBalance();
                
                setCreditNotification({
                  creditsChanged: -1, // 1 Credit wird täglich abgezogen
                  newBalance: balance.credits
                });
              } else if (result.status === 'skipped') {
                console.log('⏭️ Kein Credit-Abzug nötig:', result.message);
              } else {
                console.log('❓ Unbekannter Status:', result.status, result.message);
              }
            } catch (error) {
              console.warn('⚠️ Fehler beim täglichen Credit-Abzug:', error);
              // Fehler beim Credit-Abzug soll das Login nicht blockieren
            }
          }
      
      } catch (error) {
      console.error('❌ Fehler in login() Funktion:', error);
      throw error; // Re-throw für besseres Debugging
    }
  };

  const logout = () => {
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
    const result = user?.user_role === 'dienstleister' || 
                   user?.user_role === 'DIENSTLEISTER' ||
                   user?.user_type === 'service_provider' || 
                   user?.email?.includes('dienstleister');
    
    return result;
  };

  // Hilfsfunktion um zu prüfen, ob der Benutzer ein Bauträger ist
  const isBautraeger = () => {
    // WICHTIG: Nur user_role prüfen, NICHT user_type!
    // user_type kann 'private' oder 'professional' für BEIDE Rollen sein
    const result = user?.user_role === 'bautraeger' || 
                   user?.user_role === 'BAUTRAEGER' ||
                   user?.user_role === 'developer' ||
                   user?.user_role === 'DEVELOPER';
    
    return result;
  };

  // Hilfsfunktion um zu prüfen, ob der Benutzer authentifiziert ist
  const isAuthenticated = () => {
    return !!user && !!token && isTokenValid(token);
  };

  // Funktion zum Auswählen der Benutzerrolle
  const selectRole = async (role: 'bautraeger' | 'dienstleister') => {
    try {
      const response = await fetch('http://localhost:8000/api/v1/auth/select-role', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ role })
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('❌ Backend Error:', errorData);
        throw new Error(`Fehler beim Speichern der Rolle: ${errorData}`);
      }

      const data = await response.json();
      // Aktualisiere lokale States
      setUserRole(role);
      setRoleSelected(true);
      
      // Aktualisiere User-Objekt
      if (user) {
        const updatedUser = { ...user, user_role: role, role_selected: true };
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
      }
      
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
        userRole: userRole,
        user_role_from_user: user?.user_role,
        subscription_plan: user?.subscription_plan,
        subscription_status: user?.subscription_status,
        role_selected: roleSelected,
        isInitialized,
        isAuthenticated: isAuthenticated(),
        isServiceProvider: isServiceProvider()
      });
    }
  }, [token, user, isInitialized, userRole, roleSelected]);

  return (
    <AuthContext.Provider value={{ 
      token, 
      user, 
      isInitialized, 
      login, 
      logout, 
      isServiceProvider,
      isBautraeger,
      isAuthenticated,
      userRole,
      roleSelected,
      selectRole
    }}>
      {children}
      
      {/* Credit Notification */}
      {creditNotification && (
        <CreditNotification
          creditsChanged={creditNotification.creditsChanged}
          newBalance={creditNotification.newBalance}
          onClose={() => setCreditNotification(null)}
        />
      )}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth muss innerhalb von AuthProvider verwendet werden');
  return ctx;
} 
