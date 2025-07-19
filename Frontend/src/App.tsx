import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProjectProvider } from './context/ProjectContext';
import Navbar from './components/Navbar';
import FloatingActionButton from './components/FloatingActionButton';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import GlobalProjects from './pages/GlobalProjects';
import ProjectDetail from './pages/ProjectDetail';
import ProjectMessages from './pages/ProjectMessages';
import ProjectAnalytics from './pages/ProjectAnalytics';
import Documents from './pages/Documents';
import Visualize from './pages/Visualize';
import Roadmap from './pages/Roadmap';
import Tasks from './pages/Tasks';
import Finance from './pages/Finance';
import Messages from './pages/Messages';
import Quotes from './pages/Quotes';
import BuildWiseFees from './pages/BuildWiseFees';
import ServiceProviderDashboard from './pages/ServiceProviderDashboard';
import ServiceProviderBuildWiseFees from './pages/ServiceProviderBuildWiseFees';
import Canvas from './pages/Canvas';
import GeoSearch from './pages/GeoSearch';
import GlobalMessages from './pages/GlobalMessages';
import './index.css';

// Router-Fix: Kein doppelter Router mehr - Cache-Invalidierung
// Timestamp: 2024-07-19 14:30:00 - Router-Fix final
// Error Boundary
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Ein Fehler ist aufgetreten</h1>
            <p className="text-gray-400 mb-4">Bitte laden Sie die Seite neu.</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded"
            >
              Seite neu laden
            </button>
          </div>
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
  const { user, isInitialized } = useAuth();
  
  if (!isInitialized) {
    return <LoadingSpinner />;
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
}

// App Content Component - Router-Fix implementiert
function AppContent() {
  const { isServiceProvider } = useAuth();
  
  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460]">
        <Navbar />
        <main className="pt-16">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<Dashboard />} />
            <Route path="/global-projects" element={<GlobalProjects />} />
            <Route path="/project/:id" element={<ProjectDetail />} />
            <Route path="/project/:id/messages" element={<ProjectMessages />} />
            <Route path="/project/:id/analytics" element={<ProjectAnalytics />} />
            <Route path="/documents" element={<Documents />} />
            <Route path="/visualize" element={<Visualize />} />
            <Route path="/roadmap" element={<Roadmap />} />
            <Route path="/tasks" element={<Tasks />} />
            <Route path="/finance" element={<Finance />} />
            <Route path="/messages" element={<Messages />} />
            <Route path="/quotes" element={<Quotes />} />
            <Route path="/buildwise-fees" element={<BuildWiseFees />} />
            <Route path="/service-provider" element={<ServiceProviderDashboard />} />
            <Route path="/service-provider-buildwise-fees" element={<ServiceProviderBuildWiseFees />} />
            <Route path="/canvas" element={<Canvas />} />
            <Route path="/geo-search" element={<GeoSearch />} />
            <Route path="/global-messages" element={<GlobalMessages />} />
          </Routes>
        </main>
      </div>
      
      {/* Footer */}
      <footer className="bg-gray-900 text-white py-4 text-center">
        <div className="container mx-auto">
          <p className="text-sm text-gray-400">
            © 2024 BuildWise. Alle Rechte vorbehalten.
          </p>
          <span className="text-xs text-gray-300 font-mono">22</span>
        </div>
      </footer>
      
      {/* Floating Action Button */}
      <FloatingActionButton isServiceProvider={isServiceProvider()} />
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