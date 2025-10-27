import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProjectProvider } from './context/ProjectContext';
import { OnboardingProvider, useOnboarding } from './context/OnboardingContext';
import { ContextualOnboardingProvider } from './context/ContextualOnboardingContext';
import CacheDebugPanel from './components/CacheDebugPanel';
import './utils/serviceWorkerManager'; // Service Worker initialisieren
import './styles/grid-optimizations.css'; // Grid-Optimierungen für dynamische Kachel-Größen
import Navbar from './components/Navbar';
import WelcomeCreditNotification from './components/WelcomeCreditNotification';
import Dashboard from './pages/Dashboard';
import ServiceProviderDashboard from './pages/ServiceProviderDashboard';
import Login from './pages/Login';
import ProjectDetail from './pages/ProjectDetail';
import ProjectMessages from './pages/ProjectMessages';
import ProjectAnalytics from './pages/ProjectAnalytics';
import Tasks from './pages/Tasks';
import TasksPage from './pages/TasksPage';
import Documents from './pages/Documents';
import Quotes from './pages/Quotes';
import Visualize from './pages/Visualize';
import Messages from './pages/Messages';
import GlobalMessages from './pages/GlobalMessages';
import Roadmap from './pages/Roadmap';
import GlobalProjects from './pages/GlobalProjects';
import ServiceProviderBuildWiseFees from './pages/ServiceProviderBuildWiseFees';
import PaymentSuccess from './pages/PaymentSuccess';
import Canvas from './pages/Canvas';
import GeoSearch from './pages/GeoSearch';
import Invoices from './pages/Invoices';
import Credits from './pages/Credits';
import Archive from './pages/Archive';
import Profile from './pages/Profile';
import OAuthCallback from './pages/OAuthCallback';
import RoleSelectionModal from './components/RoleSelectionModal';
import CompanyAddressModal from './components/CompanyAddressModal';
import NotificationTab from './components/NotificationTab';
import BautraegerNotificationTab from './components/BautraegerNotificationTab';
import { RadialMenuAdvanced } from './components/RadialMenuAdvanced';
import AccountLockedModal from './components/AccountLockedModal';
import { checkAccountStatus, type AccountStatus } from './api/buildwiseFeeService';

// Error Boundary
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', background: 'red', color: 'white', minHeight: '100vh' }}>
          <h1>Ein Fehler ist aufgetreten!</h1>
          <p>Error: {this.state.error?.message}</p>
          <button onClick={() => window.location.reload()}>Seite neu laden</button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Verbesserte Loading-Komponente
function LoadingSpinner() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460] flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#ffbd59] mx-auto mb-4"></div>
        <p className="text-white">Lade Anwendung...</p>
        <p className="text-gray-400 text-sm mt-2">Bitte warten Sie einen Moment</p>
      </div>
    </div>
  );
}

// Geschützte Route-Komponente
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isInitialized, roleSelected, selectRole } = useAuth();
  const { showWelcomeNotification, setShowWelcomeNotification } = useOnboarding();
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showCompanyAddressModal, setShowCompanyAddressModal] = useState(false);
  const [onboardingChecked, setOnboardingChecked] = useState(false);
  const [sessionUserId, setSessionUserId] = useState<number | null>(null);
  const [accountStatus, setAccountStatus] = useState<AccountStatus | null>(null);
  const [checkingAccountStatus, setCheckingAccountStatus] = useState(false);
  
  // Account-Status-Check für Dienstleister
  useEffect(() => {
    let isSubscribed = true;
    let timeoutId: NodeJS.Timeout | null = null;
    
    const checkAccount = async () => {
      console.log('[ACCOUNT-CHECK] Start:', {
        hasUser: !!user,
        isInitialized,
        userRole: user?.user_role,
        isSubscribed,
        checkingAccountStatus
      });

      // Verhindere mehrfache gleichzeitige Checks
      if (checkingAccountStatus) {
        console.log('[ACCOUNT-CHECK] Skip - Check bereits läuft');
        return;
      }

      // Nur für Dienstleister prüfen
      if (user && isInitialized && user.user_role === 'DIENSTLEISTER' && isSubscribed) {
        try {
          setCheckingAccountStatus(true);
          
          console.log('🔍 [ACCOUNT-CHECK] Prüfe Account-Status für Dienstleister...');
          console.log('   User ID:', user.id);
          console.log('   User Email:', user.email);
          
          const status = await checkAccountStatus();
          
          if (!isSubscribed) return; // Component wurde unmounted
          
          console.log('📊 [ACCOUNT-CHECK] Account-Status erhalten:', status);
          console.log('   Account gesperrt?', status.account_locked);
          console.log('   Überfällige Gebühren:', status.overdue_fees?.length || 0);
          
          if (status.account_locked) {
            console.log('🔒 [ACCOUNT-CHECK] SPERRE ACCOUNT - Modal wird angezeigt');
            setAccountStatus(status);
          } else {
            console.log('✅ [ACCOUNT-CHECK] Account ist aktiv - keine Sperre');
            setAccountStatus(null);
          }
        } catch (error) {
          console.error('❌ [ACCOUNT-CHECK] Fehler beim Prüfen des Account-Status:', error);
          if (isSubscribed) {
            // Bei Fehler nicht sperren, aber Status zurücksetzen
            setAccountStatus(null);
          }
        } finally {
          if (isSubscribed) {
            setCheckingAccountStatus(false);
          }
        }
      } else {
        console.log('[ACCOUNT-CHECK] Skip - Bedingungen nicht erfüllt');
      }
    };

    // Initialer Check mit Verzögerung
    timeoutId = setTimeout(() => {
      checkAccount();
    }, 1000);
    
    // Prüfe Account-Status alle 5 Minuten (reduziert von 30 Sekunden)
    const interval = setInterval(checkAccount, 5 * 60 * 1000);
    
    return () => {
      isSubscribed = false;
      if (timeoutId) clearTimeout(timeoutId);
      clearInterval(interval);
    };
  }, [user, isInitialized, checkingAccountStatus]);

  useEffect(() => {
    // Reset bei User-Wechsel (Logout/Login)
    if (user?.id !== sessionUserId) {
      setOnboardingChecked(false);
      setShowRoleModal(false);
      setShowCompanyAddressModal(false);
      setSessionUserId(user?.id || null);
      setAccountStatus(null);
    }
    
    // Prüfe ob Rollenauswahl benötigt wird - aber nur einmalig pro Login-Session
    if (user && isInitialized && !onboardingChecked) {
      // Intelligente Onboarding-Logik mit OnboardingManager
      import('./utils/OnboardingManager').then(({ OnboardingManager }) => {
        const onboardingState = OnboardingManager.getOnboardingState(user);
        const debugInfo = OnboardingManager.getDebugInfo(user);
        
        if (onboardingState.needsOnboarding) {
          // Onboarding kann Rolle oder Dashboard-Tour sein.
          // Rolle fehlt → Modaldialog anzeigen, Tour wird in Dashboard gestartet.
          if (!user.role_selected || !user.user_role) {
            setShowRoleModal(true);
          } else if (user.role_selected && user.user_role && !user.company_name) {
            // Rolle ist gewählt, aber Firmenadresse fehlt noch → Firmenadresse-Modal zeigen
            setShowCompanyAddressModal(true);
            setShowRoleModal(false);
          } else {
            setShowRoleModal(false);
            setShowCompanyAddressModal(false);
          }
        } else {
          setShowRoleModal(false);
          setShowCompanyAddressModal(false);
        }
        
        setOnboardingChecked(true);
      }).catch(error => {
        console.error('❌ Fehler beim Laden des OnboardingManagers:', error);
        // Fallback: Zeige Rollenauswahl falls nötig
        if (!user.role_selected || !user.user_role) {
          setShowRoleModal(true);
        } else if (user.role_selected && user.user_role && !user.company_name) {
          setShowCompanyAddressModal(true);
        }
        setOnboardingChecked(true);
      });
    }
  }, [user, isInitialized, onboardingChecked, sessionUserId]);
  
  // ✨ NEU: Welcome Notification nach Reload anzeigen (überlebt window.location.reload)
  useEffect(() => {
    if (!user) return;
    
    const shouldShowWelcome = localStorage.getItem('show_welcome_notification');
    const credits = localStorage.getItem('welcome_credits');
    
    if (shouldShowWelcome === 'true') {
      console.log('🎉 Zeige Welcome Notification nach Reload');
      
      // Cleanup LocalStorage
      localStorage.removeItem('show_welcome_notification');
      localStorage.removeItem('welcome_credits');
      
      // Zeige Notification nach kurzer Verzögerung (damit UI fertig geladen ist)
      setTimeout(() => {
        setShowWelcomeNotification(true);
      }, 1500);
    }
  }, [user, setShowWelcomeNotification]);
  
  if (!isInitialized) {
    return <LoadingSpinner />;
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  // Account gesperrt? Zeige Sperre-Modal
  if (accountStatus && accountStatus.account_locked) {
    return (
      <AccountLockedModal 
        accountStatus={accountStatus}
        onPaymentSuccess={() => {
          // Nach erfolgreicher Zahlung Account-Status neu prüfen
          setAccountStatus(null);
          setCheckingAccountStatus(false);
          window.location.reload();
        }}
      />
    );
  }

  // Normale Darstellung - Modal wird parallel gerendert, nicht blockierend
  return (
    <>
      {children}
      {showRoleModal && (
        <RoleSelectionModal 
          onSelectRole={async (role) => {
            try {
              console.log('🎯 App.tsx: onSelectRole aufgerufen mit:', role);
              await selectRole(role);
              console.log('✅ App.tsx: selectRole erfolgreich');
              
              // Rollenauswahl-Modal schließen
              setShowRoleModal(false);
              console.log('✅ App.tsx: RoleModal geschlossen');
              
              // Nach Rollenauswahl: Zeige Firmenadresse-Modal
              setShowCompanyAddressModal(true);
              console.log('✅ App.tsx: CompanyAddressModal geöffnet');
              
              // Willkommens-Notification wird erst nach Abschluss der Guided Tour angezeigt
              // (siehe OnboardingContext für die Logik)
              
              } catch (error) {
              console.error('❌ App.tsx: Fehler beim Speichern der Rolle:', error);
              // Modal bleibt offen bei Fehlern
            }
          }}
        />
      )}
      
      {/* Firmenadresse-Modal */}
      {showCompanyAddressModal && user && (
        <CompanyAddressModal
          userRole={user.user_role === 'BAUTRAEGER' ? 'bautraeger' : 'dienstleister'}
          onComplete={async (companyData) => {
            try {
              const { updateCompanyInfo } = await import('./api/userService');
              const response = await updateCompanyInfo(companyData);
              
              console.log('✅ Company info saved:', response);
              
              // Modal schließen
              setShowCompanyAddressModal(false);
              setOnboardingChecked(true);
              
              // Speichere Welcome-Flag in LocalStorage (überlebt Reload)
              if (response.show_welcome_notification) {
                localStorage.setItem('show_welcome_notification', 'true');
                localStorage.setItem('welcome_credits', response.welcome_credits?.toString() || '90');
                console.log('📦 Welcome notification flag gespeichert in LocalStorage');
              }
              
              // Dashboard-Tour nach kurzer Verzögerung triggern
              setTimeout(() => {
                const tourEvent = new CustomEvent('startDashboardTour');
                window.dispatchEvent(tourEvent);
              }, 1000);
              
              // Reload nach Tour-Start (gibt Zeit für Speicherung)
              setTimeout(() => {
                window.location.reload();
              }, 2000);
              
            } catch (error) {
              console.error('❌ Fehler beim Speichern der Firmeninformationen:', error);
            }
          }}
          onSkip={async () => {
            // Modal schließen und Onboarding abschließen (ohne Daten zu speichern)
            setShowCompanyAddressModal(false);
            setOnboardingChecked(true);
            
            // Trigger Dashboard-Tour nach kurzer Verzögerung
            setTimeout(() => {
              const tourEvent = new CustomEvent('startDashboardTour');
              window.dispatchEvent(tourEvent);
              
              // Reload nach kurzer Verzögerung
              setTimeout(() => {
                window.location.reload();
              }, 1000);
            }, 1000);
          }}
        />
      )}
      
      {/* Willkommens-Notification mit Credit-Bonus */}
      {showWelcomeNotification && (
        <WelcomeCreditNotification
          show={showWelcomeNotification}
          credits={90}
          userName={user?.first_name || user?.email?.split('@')[0]}
          onClose={() => setShowWelcomeNotification(false)}
        />
      )}
    </>
  );
  
  return <>{children}</>;
}

// Navbar-Wrapper-Komponente für bessere Kontrolle
function NavbarWrapper() {
  const { user, isInitialized } = useAuth();
  const location = useLocation();
  const isLoginPage = location.pathname === '/login';

  // Debug-Logging für Navbar-Anzeige
  // Zeige Navbar nur wenn:
  // 1. Nicht auf Login-Seite
  // 2. AuthContext ist initialisiert
  // 3. Benutzer ist authentifiziert (user existiert)
  if (isLoginPage) {
    return null;
  }
  
  if (!isInitialized) {
    return null;
  }
  
  if (!user) {
    return null;
  }

  return <Navbar />;
}

function AppContent() {
  const { isInitialized, user } = useAuth();
  const location = useLocation();

  // Warte auf Initialisierung
  if (!isInitialized) {
    return <LoadingSpinner />;
  }

  return (
    <>
      {/* Navbar wird durch NavbarWrapper gesteuert */}
      <NavbarWrapper />

      {/* Radial Menu: Für Bauträger und Dienstleister auf allen Seiten außer Login sichtbar */}
      {user && location.pathname !== '/login' && (
        ((user.user_role === 'BAUTRAEGER' || user.user_role === 'bautraeger') && (
          <RadialMenuAdvanced enableGooeyEffect={false} showTooltips enableSecondRing />
        )) ||
        ((user.user_role === 'DIENSTLEISTER' || user.user_role === 'dienstleister') && (
          <RadialMenuAdvanced enableGooeyEffect={false} showTooltips enableSecondRing={false} />
        ))
      )}
      
      {/* Notification Tab für Terminanfragen/antworten - NUR für Dienstleister */}
      {user && user.user_role === 'DIENSTLEISTER' && (
        <NotificationTab
          userRole={user.user_role as 'BAUTRAEGER' | 'DIENSTLEISTER'}
          userId={user.id}
          onResponseSent={() => {
            // Hier könnten weitere Aktionen ausgeführt werden
          }}
        />
      )}

      {/* Bauträger Notification Tab für Terminantworten und neue Angebote (rechts) */}
      {user && user.user_role === 'BAUTRAEGER' && (
        <BautraegerNotificationTab
          userId={user.id}
          onResponseHandled={() => {
            // Event für Dashboard auslösen, um Daten neu zu laden
            window.dispatchEvent(new CustomEvent('notificationHandled', {
              detail: { userId: user.id }
            }));
          }}
        />
      )}
      
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/auth/google/callback" element={<OAuthCallback />} />
        <Route path="/auth/microsoft/callback" element={<OAuthCallback />} />
        <Route path="/" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />
        <Route path="/service-provider" element={
          <ProtectedRoute>
            <ServiceProviderDashboard />
          </ProtectedRoute>
        } />
        <Route path="/global-projects" element={
          <ProtectedRoute>
            <GlobalProjects />
          </ProtectedRoute>
        } />
        <Route path="/roadmap" element={
          <ProtectedRoute>
            <Roadmap />
          </ProtectedRoute>
        } />
        <Route path="/project/:id" element={
          <ProtectedRoute>
            <ProjectDetail />
          </ProtectedRoute>
        } />
        <Route path="/project/:id/messages" element={
          <ProtectedRoute>
            <ProjectMessages />
          </ProtectedRoute>
        } />
        <Route path="/project/:id/analytics" element={
          <ProtectedRoute>
            <ProjectAnalytics />
          </ProtectedRoute>
        } />
        <Route path="/tasks" element={
          <ProtectedRoute>
            <TasksPage />
          </ProtectedRoute>
        } />
        <Route path="/documents" element={
          <ProtectedRoute>
            <Documents />
          </ProtectedRoute>
        } />
        {/* Deaktiviert: Quotes jetzt im Dashboard unter Gewerke integriert */}
        {/* <Route path="/quotes" element={
          <ProtectedRoute>
            <Quotes />
          </ProtectedRoute>
        } /> */}
        <Route path="/service-provider/buildwise-fees" element={
          <ProtectedRoute>
            <ServiceProviderBuildWiseFees />
          </ProtectedRoute>
        } />
        <Route path="/payment/success" element={
          <ProtectedRoute>
            <PaymentSuccess />
          </ProtectedRoute>
        } />
        <Route path="/visualize" element={
          <ProtectedRoute>
            <Visualize />
          </ProtectedRoute>
        } />
        <Route path="/canvas" element={
          <ProtectedRoute>
            <Canvas />
          </ProtectedRoute>
        } />
        <Route path="/project/:projectId/canvas" element={
          <ProtectedRoute>
            <Canvas />
          </ProtectedRoute>
        } />
        <Route path="/messages" element={
          <ProtectedRoute>
            <GlobalMessages />
          </ProtectedRoute>
        } />
        <Route path="/messages/:projectId" element={
          <ProtectedRoute>
            <Messages />
          </ProtectedRoute>
        } />
        <Route path="/geo-search" element={
          <ProtectedRoute>
            <GeoSearch />
          </ProtectedRoute>
        } />
        <Route path="/invoices" element={
          <ProtectedRoute>
            <Invoices />
          </ProtectedRoute>
        } />
        <Route path="/credits" element={
          <ProtectedRoute>
            <Credits />
          </ProtectedRoute>
        } />
          <Route path="/archive" element={
            <ProtectedRoute>
              <Archive />
            </ProtectedRoute>
          } />
        <Route path="/profile" element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        } />
        {/* Fallback für unbekannte Routen */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      
      {/* Unaufälliger Developer-Footer */}
      <footer className="fixed bottom-0 right-0 p-1">
        <span className="text-xs text-gray-300 font-mono">22</span>
      </footer>
    </>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <ProjectProvider>
          <OnboardingProvider>
            <ContextualOnboardingProvider>
              <AppContent />
              <CacheDebugPanel />
            </ContextualOnboardingProvider>
          </OnboardingProvider>
        </ProjectProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
