import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { pathname } = useLocation();
  const { user, logout } = useAuth();

  return (
    <nav className="bg-[#3d4952] text-white px-6 py-3 flex items-center justify-between shadow-md">
      <div className="flex items-center gap-3">
        <span className="font-bold text-xl tracking-wide text-[#ffbd59]">BuildWise</span>
      </div>
      <div className="flex gap-6 items-center">
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
        {user ? (
          <button onClick={logout} className="hover:text-[#ffbd59] transition">Logout</button>
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