import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProjectProvider } from './context/ProjectContext';
import { OnboardingProvider } from './context/OnboardingContext';
import CacheDebugPanel from './components/CacheDebugPanel';
import './utils/serviceWorkerManager'; // Service Worker initialisieren
import './styles/grid-optimizations.css'; // Grid-Optimierungen für dynamische Kachel-Größen
import Navbar from './components/Navbar';
import CreditNotification from './components/CreditNotification';
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
import Finance from './pages/Finance';
import Quotes from './pages/Quotes';
import Visualize from './pages/Visualize';
import Messages from './pages/Messages';
import GlobalMessages from './pages/GlobalMessages';
import Roadmap from './pages/Roadmap';
import GlobalProjects from './pages/GlobalProjects';
import BuildWiseFees from './pages/BuildWiseFees';
import ServiceProviderBuildWiseFees from './pages/ServiceProviderBuildWiseFees';
import Canvas from './pages/Canvas';
import GeoSearch from './pages/GeoSearch';
import Invoices from './pages/Invoices';
import Credits from './pages/Credits';
import Archive from './pages/Archive';
import Profile from './pages/Profile';
import OAuthCallback from './pages/OAuthCallback';
import ResourcesPage from './pages/ResourcesPage';
import RoleSelectionModal from './components/RoleSelectionModal';
import CompanyAddressModal from './components/CompanyAddressModal';
import NotificationTab from './components/NotificationTab';
import BautraegerNotificationTab from './components/BautraegerNotificationTab';
import { RadialMenuAdvanced } from './components/RadialMenuAdvanced';

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
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showCompanyAddressModal, setShowCompanyAddressModal] = useState(false);
  const [onboardingChecked, setOnboardingChecked] = useState(false);
  const [sessionUserId, setSessionUserId] = useState<number | null>(null);
  const [showWelcomeNotification, setShowWelcomeNotification] = useState(false);
  
  useEffect(() => {
    // Reset bei User-Wechsel (Logout/Login)
    if (user?.id !== sessionUserId) {
      setOnboardingChecked(false);
      setShowRoleModal(false);
      setShowCompanyAddressModal(false);
      setSessionUserId(user?.id || null);
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
  
  if (!isInitialized) {
    return <LoadingSpinner />;
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  // Normale Darstellung - Modal wird parallel gerendert, nicht blockierend
  return (
    <>
      {children}
      {showRoleModal && (
        <RoleSelectionModal 
          onSelectRole={async (role) => {
            try {
              await selectRole(role);
              // Rollenauswahl-Modal schließen
              setShowRoleModal(false);
              
              // Nach Rollenauswahl: Zeige Firmenadresse-Modal
              setShowCompanyAddressModal(true);
              
              // Zeige Willkommens-Notification für Bauträger bei Erstanmeldung
              if (role === 'BAUTRAEGER' && !localStorage.getItem(`welcome_shown_${user?.id}`)) {
                setShowWelcomeNotification(true);
                localStorage.setItem(`welcome_shown_${user?.id}`, 'true');
              }
              
              } catch (error) {
              console.error('❌ Fehler beim Speichern der Rolle:', error);
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
              // API-Call zum Speichern der Firmenadresse
              const { updateCompanyInfo } = await import('./api/userService');
              await updateCompanyInfo(companyData);
              
              // Modal schließen und Onboarding abschließen
              setShowCompanyAddressModal(false);
              setOnboardingChecked(true);
              
              // Trigger Dashboard-Tour nach kurzer Verzögerung
              setTimeout(() => {
                const tourEvent = new CustomEvent('startDashboardTour');
                window.dispatchEvent(tourEvent);
              }, 1000);
              
              // User-Context aktualisieren (falls nötig)
              window.location.reload(); // Einfache Lösung für User-Update
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
      
      {/* Credit-Notifications für Bauträger */}
      <CreditNotification />

      {/* Radial Menu: Für Bauträger auf allen Seiten außer Login sichtbar */}
      {user && location.pathname !== '/login' && (
        (user.user_role === 'BAUTRAEGER' || user.user_role === 'bautraeger') && (
          <RadialMenuAdvanced enableGooeyEffect={false} showTooltips enableSecondRing />
        )
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
        <Route path="/finance" element={
          <ProtectedRoute>
            <Finance />
          </ProtectedRoute>
        } />
        {/* Deaktiviert: Quotes jetzt im Dashboard unter Gewerke integriert */}
        {/* <Route path="/quotes" element={
          <ProtectedRoute>
            <Quotes />
          </ProtectedRoute>
        } /> */}
        <Route path="/buildwise-fees" element={
          <ProtectedRoute>
            <BuildWiseFees />
          </ProtectedRoute>
        } />
        <Route path="/service-provider/buildwise-fees" element={
          <ProtectedRoute>
            <ServiceProviderBuildWiseFees />
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
          <Route path="/resources" element={
            <ProtectedRoute>
              <ResourcesPage />
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
            <AppContent />
            <CacheDebugPanel />
          </OnboardingProvider>
        </ProjectProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
