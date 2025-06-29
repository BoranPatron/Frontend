import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { pathname } = useLocation();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    // Optional: Weiterleitung zur Login-Seite
    window.location.href = '/login';
  };

  return (
    <nav className="bg-[#3d4952] text-white px-6 py-3 flex items-center justify-between shadow-md">
      <div className="flex items-center gap-3">
        <Link to="/" className="hover:opacity-80 transition-opacity">
          <span className="font-bold text-xl tracking-wide text-[#ffbd59] cursor-pointer">BuildWise</span>
        </Link>
      </div>
      
      <div className="flex gap-6 items-center">
        {user ? (
          <>
            <Link
              to="/"
              className={`hover:text-[#ffbd59] transition ${pathname === '/' ? 'text-[#ffbd59] font-semibold' : ''}`}
            >
              Dashboard
            </Link>
            <Link
              to="/projects"
              className={`hover:text-[#ffbd59] transition ${pathname === '/projects' ? 'text-[#ffbd59] font-semibold' : ''}`}
            >
              Projekte
            </Link>
            <Link
              to="/tasks"
              className={`hover:text-[#ffbd59] transition ${pathname === '/tasks' ? 'text-[#ffbd59] font-semibold' : ''}`}
            >
              Aufgaben
            </Link>
            <Link
              to="/documents"
              className={`hover:text-[#ffbd59] transition ${pathname === '/documents' ? 'text-[#ffbd59] font-semibold' : ''}`}
            >
              Dokumente
            </Link>
            <Link
              to="/finance"
              className={`hover:text-[#ffbd59] transition ${pathname === '/finance' ? 'text-[#ffbd59] font-semibold' : ''}`}
            >
              Finanzen
            </Link>
            <Link
              to="/quotes"
              className={`hover:text-[#ffbd59] transition ${pathname === '/quotes' ? 'text-[#ffbd59] font-semibold' : ''}`}
            >
              Angebote
            </Link>
            <Link
              to="/visualize"
              className={`hover:text-[#ffbd59] transition ${pathname === '/visualize' ? 'text-[#ffbd59] font-semibold' : ''}`}
            >
              Visualisierung
            </Link>
            
            {/* Benutzer-Info */}
            <div className="flex items-center gap-3 ml-4 pl-4 border-l border-white/20">
              <div className="text-sm">
                <span className="text-gray-300">Willkommen,</span>
                <div className="font-medium text-[#ffbd59]">
                  {user.first_name} {user.last_name}
                </div>
              </div>
              <button 
                onClick={handleLogout} 
                className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-lg text-sm transition-colors"
              >
                Logout
              </button>
            </div>
          </>
        ) : (
          <Link
            to="/login"
            className={`hover:text-[#ffbd59] transition ${pathname === '/login' ? 'text-[#ffbd59] font-semibold' : ''}`}
          >
            Login
          </Link>
        )}
      </div>
    </nav>
  );
} 