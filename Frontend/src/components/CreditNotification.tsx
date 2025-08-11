import React, { useState, useEffect } from 'react';
import { getCreditBalance, CreditBalance } from '../api/creditService';
import { useAuth } from '../context/AuthContext';

interface CreditNotificationProps {
  onClose?: () => void;
}

export default function CreditNotification({ onClose }: CreditNotificationProps) {
  const { user, isInitialized, isAuthenticated } = useAuth();
  const [balance, setBalance] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showNotification, setShowNotification] = useState(false);

  useEffect(() => {
    // Lade Credits erst, wenn AuthContext initialisiert und User authentifiziert ist
    if (isInitialized && isAuthenticated() && user) {
      console.log('🔄 AuthContext bereit - lade Credit-Daten');
      loadCreditBalance();
    } else if (isInitialized && !isAuthenticated()) {
      console.log('ℹ️ User nicht authentifiziert - überspringe Credit-Laden');
      setLoading(false);
    }
  }, [isInitialized, user]);

  const loadCreditBalance = async () => {
    try {
      setLoading(true);
      const balanceData = await getCreditBalance();
      setBalance(balanceData);
      
      // Zeige Benachrichtigung nur bei niedrigen Credits oder abgelaufenem Pro-Status
      if (balanceData.low_credit_warning || balanceData.plan_status === 'expired') {
        setShowNotification(true);
      }
    } catch (err) {
      console.error('Fehler beim Laden der Credit-Daten:', err);
      // Fehler beim Credit-Laden sollte nicht die gesamte App blockieren
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setShowNotification(false);
    onClose?.();
  };

  const handleBuyCredits = () => {
    // Navigiere zur Credits-Seite
    window.location.href = '/credits';
  };

  if (loading || !balance || !showNotification) {
    return null;
  }

  const getNotificationType = () => {
    if (balance.plan_status === 'expired') {
      return {
        type: 'error',
        title: 'Pro-Status abgelaufen',
        message: 'Ihr Pro-Status ist abgelaufen. Kaufen Sie Credits oder führen Sie Aktivitäten aus, um Ihren Status zu erneuern.',
        icon: '🔒',
        color: 'bg-gradient-to-r from-red-600 to-red-700',
        buttonText: 'Credits kaufen'
      };
    }
    
    if (balance.low_credit_warning) {
      return {
        type: 'warning',
        title: 'Niedrige Credits',
        message: `Sie haben nur noch ${balance.credits} Credits. Kaufen Sie Credits oder führen Sie Aktivitäten aus, um Credits zu verdienen.`,
        icon: '⚠️',
        color: 'bg-gradient-to-r from-yellow-600 to-yellow-700',
        buttonText: 'Credits kaufen'
      };
    }

    return null;
  };

  const notification = getNotificationType();
  if (!notification) return null;

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm">
      <div className={`${notification.color} text-white rounded-lg shadow-lg p-4 border border-white/20`}>
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <span className="text-2xl">{notification.icon}</span>
          </div>
          <div className="ml-3 flex-1">
            <h3 className="text-sm font-medium">
              {notification.title}
            </h3>
            <p className="text-sm mt-1 opacity-90">
              {notification.message}
            </p>
            <div className="mt-3 flex space-x-2">
              <button
                onClick={handleBuyCredits}
                className="bg-white/20 hover:bg-white/30 text-white px-3 py-1 rounded text-sm font-medium transition-colors"
              >
                {notification.buttonText}
              </button>
              <button
                onClick={handleClose}
                className="text-white/70 hover:text-white px-3 py-1 rounded text-sm transition-colors"
              >
                Schließen
              </button>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="ml-2 text-white/70 hover:text-white transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}; 