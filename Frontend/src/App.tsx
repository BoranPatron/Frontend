import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProjectProvider } from './context/ProjectContext';
import Navbar from './components/Navbar';
import CreditNotification from './components/CreditNotification';
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
import OAuthCallback from './pages/OAuthCallback';
import RoleSelectionModal from './components/RoleSelectionModal';
import NotificationTab from './components/NotificationTab';
import BautraegerNotificationTab from './components/BautraegerNotificationTab';

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
  const [onboardingChecked, setOnboardingChecked] = useState(false);
  const [sessionUserId, setSessionUserId] = useState<number | null>(null);
  
  useEffect(() => {
    // Reset bei User-Wechsel (Logout/Login)
    if (user?.id !== sessionUserId) {
      console.log('🔄 User-Wechsel erkannt - Reset Onboarding-Check', {
        previousUserId: sessionUserId,
        currentUserId: user?.id
      });
      setOnboardingChecked(false);
      setShowRoleModal(false);
      setSessionUserId(user?.id || null);
    }
    
    // Prüfe ob Rollenauswahl benötigt wird - aber nur einmalig pro Login-Session
    if (user && isInitialized && !onboardingChecked) {
      console.log('🔍 Einmalige Onboarding-Prüfung für User:', {
        hasUser: !!user,
        userId: user.id,
        email: user.email,
        userType: user.user_type,
        userRole: user.user_role,
        roleSelected: user.role_selected,
        subscriptionPlan: user.subscription_plan,
        onboardingChecked: onboardingChecked
      });
      
      // Intelligente Onboarding-Logik mit OnboardingManager
      import('./utils/OnboardingManager').then(({ OnboardingManager }) => {
        const onboardingState = OnboardingManager.getOnboardingState(user);
        const debugInfo = OnboardingManager.getDebugInfo(user);
        
        console.log('🎯 Onboarding-Analyse:', debugInfo);
        
        if (onboardingState.needsOnboarding) {
          console.log('🚀 Onboarding erforderlich:', onboardingState.reason);
          // Onboarding kann Rolle oder Dashboard-Tour sein.
          // Rolle fehlt → Modaldialog anzeigen, Tour wird in Dashboard gestartet.
          if (!user.role_selected || !user.user_role) {
            setShowRoleModal(true);
          } else {
            setShowRoleModal(false);
          }
        } else {
          console.log('✅ Kein Onboarding erforderlich:', onboardingState.reason);
          setShowRoleModal(false);
        }
        
        setOnboardingChecked(true);
      }).catch(error => {
        console.error('❌ Fehler beim Laden des OnboardingManagers:', error);
        // Fallback: Zeige Rollenauswahl falls nötig
        if (!user.role_selected || !user.user_role) {
          setShowRoleModal(true);
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
            console.log('🎯 Rolle ausgewählt:', role);
            try {
              await selectRole(role);
              console.log('✅ Rolle erfolgreich gespeichert');
              
              // Modal dauerhaft schließen
              setShowRoleModal(false);
              
              // Onboarding als abgeschlossen markieren (verhindert erneutes Erscheinen)
              setOnboardingChecked(true);
              
              console.log('✅ Modal geschlossen - wird nicht mehr angezeigt');
            } catch (error) {
              console.error('❌ Fehler beim Speichern der Rolle:', error);
              // Modal bleibt offen bei Fehlern
            }
          }}
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
  console.log('🔍 NavbarWrapper Debug:', {
    hasUser: !!user,
    isInitialized,
    isLoginPage,
    currentPath: location.pathname,
    shouldShowNavbar: !isLoginPage && isInitialized && !!user
  });

  // Zeige Navbar nur wenn:
  // 1. Nicht auf Login-Seite
  // 2. AuthContext ist initialisiert
  // 3. Benutzer ist authentifiziert (user existiert)
  if (isLoginPage) {
    console.log('🚫 Navbar ausgeblendet: Auf Login-Seite');
    return null;
  }
  
  if (!isInitialized) {
    console.log('🚫 Navbar ausgeblendet: AuthContext nicht initialisiert');
    return null;
  }
  
  if (!user) {
    console.log('🚫 Navbar ausgeblendet: Kein User vorhanden');
    return null;
  }

  console.log('✅ Navbar wird angezeigt');
  return <Navbar />;
}

function AppContent() {
  const { isInitialized, user } = useAuth();

  console.log('🔍 AppContent Debug:', {
    isInitialized,
    hasUser: !!user,
    currentPath: window.location.pathname
  });

  // Warte auf Initialisierung
  if (!isInitialized) {
    console.log('⏳ Warte auf AuthContext-Initialisierung...');
    return <LoadingSpinner />;
  }

  console.log('✅ AppContent gerendert - AuthContext initialisiert');

  return (
    <>
      {/* Navbar wird durch NavbarWrapper gesteuert */}
      <NavbarWrapper />
      
      {/* Credit-Notifications für Bauträger */}
      <CreditNotification />
      
      {/* Notification Tab für Terminanfragen/antworten - NUR für Dienstleister */}
      {user && user.user_role === 'DIENSTLEISTER' && (
        <NotificationTab
          userRole={user.user_role as 'BAUTRAEGER' | 'DIENSTLEISTER'}
          userId={user.id}
          onResponseSent={() => {
            console.log('Notification response sent');
            // Hier könnten weitere Aktionen ausgeführt werden
          }}
        />
      )}

      {/* Separate Bauträger Notification Tab für Terminantworten (rechts) */}
      {user && user.user_role === 'BAUTRAEGER' && (
        <BautraegerNotificationTab
          userId={user.id}
          onResponseHandled={() => {
            console.log('Bauträger response handled');
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
        <Route path="/quotes" element={
          <ProtectedRoute>
            <Quotes />
          </ProtectedRoute>
        } />
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
          <AppContent />
        </ProjectProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}