import React from 'react';
import CreditDashboard from '../components/CreditDashboard';
import { useAuth } from '../context/AuthContext';

const Credits: React.FC = () => {
  const { user } = useAuth();

  // Prüfe ob User ein Bauträger ist
  const isBautraeger = user?.user_role === 'BAUTRAEGER';
  const isAdmin = user?.user_role === 'ADMIN';

  if (!isBautraeger && !isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460] py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-r from-[#1a1a2e] to-[#16213e] rounded-lg shadow-lg border border-gray-700 p-6">
            <div className="text-center">
              <div className="text-6xl mb-4">🔒</div>
              <h1 className="text-2xl font-bold text-white mb-2">Zugriff verweigert</h1>
              <p className="text-gray-300">
                Das Credit-System ist nur für Bauträger verfügbar. Als Dienstleister haben Sie keinen Zugriff auf diese Funktion.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460] py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <CreditDashboard isAdmin={isAdmin} />
      </div>
    </div>
  );
};

export default Credits; 