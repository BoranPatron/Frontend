import React from 'react';
import { useAuth } from '../context/AuthContext';
import InvoiceManagement from '../components/InvoiceManagement';

export default function Invoices() {
  const { user, isServiceProvider } = useAuth();

  // Nur für Dienstleister zugänglich
  if (!isServiceProvider()) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#2c3539] to-[#1a1f23] p-4 flex items-center justify-center">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Zugriff verweigert</h1>
          <p className="text-gray-300">
            Diese Seite ist nur für Dienstleister verfügbar.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#2c3539] to-[#1a1f23] p-4">
      <div className="max-w-7xl mx-auto">
        <InvoiceManagement />
      </div>
    </div>
  );
} 