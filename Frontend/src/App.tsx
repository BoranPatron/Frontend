import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import ProjectDetail from './pages/ProjectDetail';
import ProjectMessages from './pages/ProjectMessages';
import ProjectAnalytics from './pages/ProjectAnalytics';
import Tasks from './pages/Tasks';
import Documents from './pages/Documents';
import Finance from './pages/Finance';
import Quotes from './pages/Quotes';
import Visualize from './pages/Visualize';
import Messages from './pages/Messages';
import GlobalMessages from './pages/GlobalMessages';
import Roadmap from './pages/Roadmap';
import GlobalProjects from './pages/GlobalProjects';

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

// Geschützte Route-Komponente
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
}

function AppContent() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/" element={
          <ProtectedRoute>
            <Dashboard />
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
            <Tasks />
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
        <Route path="/visualize" element={
          <ProtectedRoute>
            <Visualize />
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
        {/* Fallback für unbekannte Routen */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ErrorBoundary>
  );
}