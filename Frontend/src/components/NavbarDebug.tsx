import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useLocation } from 'react-router-dom';

interface NavbarDebugProps {
  showDebug?: boolean;
}

export default function NavbarDebug({ showDebug = false }: NavbarDebugProps) {
  const { user, token, isInitialized, isAuthenticated } = useAuth();
  const location = useLocation();
  const isLoginPage = location.pathname === '/login';

  const debugInfo = {
    hasUser: !!user,
    hasToken: !!token,
    isInitialized,
    isAuthenticated: isAuthenticated(),
    isLoginPage,
    currentPath: location.pathname,
    shouldShowNavbar: !isLoginPage && isInitialized && !!user,
    userData: user ? {
      id: user.id,
      email: user.email,
      user_type: user.user_type
    } : null
  };

  // Logge Debug-Informationen
  React.useEffect(() => {
    console.log('🔍 NavbarDebug Status:', debugInfo);
    
    // Zusätzliche Debug-Informationen
    if (debugInfo.shouldShowNavbar) {
      console.log('✅ Navbar sollte angezeigt werden');
    } else {
      console.log('❌ Navbar sollte NICHT angezeigt werden');
      if (debugInfo.isLoginPage) {
        console.log('   - Grund: Auf Login-Seite');
      }
      if (!debugInfo.isInitialized) {
        console.log('   - Grund: AuthContext nicht initialisiert');
      }
      if (!debugInfo.hasUser) {
        console.log('   - Grund: Kein User vorhanden');
      }
    }
  }, [debugInfo]);

  // Zeige Debug-Informationen nur wenn showDebug aktiviert ist
  if (!showDebug) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 bg-black/90 text-white p-3 text-xs font-mono z-50 max-w-md border border-white/20 rounded-br-lg">
      <div className="font-bold mb-2 text-[#ffbd59]">Navbar Debug:</div>
      <div className="space-y-1">
        <div className="flex justify-between">
          <span>User:</span>
          <span className={debugInfo.hasUser ? 'text-green-400' : 'text-red-400'}>
            {debugInfo.hasUser ? '✅' : '❌'}
          </span>
        </div>
        <div className="flex justify-between">
          <span>Token:</span>
          <span className={debugInfo.hasToken ? 'text-green-400' : 'text-red-400'}>
            {debugInfo.hasToken ? '✅' : '❌'}
          </span>
        </div>
        <div className="flex justify-between">
          <span>Initialized:</span>
          <span className={debugInfo.isInitialized ? 'text-green-400' : 'text-red-400'}>
            {debugInfo.isInitialized ? '✅' : '❌'}
          </span>
        </div>
        <div className="flex justify-between">
          <span>Authenticated:</span>
          <span className={debugInfo.isAuthenticated ? 'text-green-400' : 'text-red-400'}>
            {debugInfo.isAuthenticated ? '✅' : '❌'}
          </span>
        </div>
        <div className="flex justify-between">
          <span>Login Page:</span>
          <span className={debugInfo.isLoginPage ? 'text-yellow-400' : 'text-blue-400'}>
            {debugInfo.isLoginPage ? '✅' : '❌'}
          </span>
        </div>
        <div className="flex justify-between font-bold">
          <span>Show Navbar:</span>
          <span className={debugInfo.shouldShowNavbar ? 'text-green-400' : 'text-red-400'}>
            {debugInfo.shouldShowNavbar ? '✅' : '❌'}
          </span>
        </div>
        <div className="text-gray-300">Path: {debugInfo.currentPath}</div>
      </div>
      {debugInfo.userData && (
        <div className="mt-2 pt-2 border-t border-white/20">
          <div>User ID: {debugInfo.userData.id}</div>
          <div>Email: {debugInfo.userData.email}</div>
          <div>Type: {debugInfo.userData.user_type}</div>
        </div>
      )}
    </div>
  );
} 