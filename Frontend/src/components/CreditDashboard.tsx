import React, { useState, useEffect } from 'react';
import { getCreditBalance, getCreditHistory, getCreditPackages, purchaseCredits, CreditBalance, CreditEvent, CreditPackage } from '../api/creditService';

interface CreditDashboardProps {
  isAdmin?: boolean;
}

// Helper functions
const getEventTypeIcon = (eventType: string): string => {
  const icons: { [key: string]: string } = {
    'REGISTRATION_BONUS': '🎉',
    'DAILY_DEDUCTION': '📅',
    'PURCHASE': '💳',
    'TASK_COMPLETION': '✅',
    'MILESTONE_COMPLETION': '🎯',
    'PROJECT_COMPLETION': '🏆',
    'REFERRAL_BONUS': '🤝',
    'ADMIN_ADJUSTMENT': '⚙️',
  };
  return icons[eventType] || '📝';
};

const getEventTypeLabel = (eventType: string): string => {
  const labels: { [key: string]: string } = {
    'REGISTRATION_BONUS': 'Registrierungsbonus',
    'DAILY_DEDUCTION': 'Tägliche Abbuchung',
    'PURCHASE': 'Credit-Kauf',
    'TASK_COMPLETION': 'Aufgabe abgeschlossen',
    'MILESTONE_COMPLETION': 'Meilenstein erreicht',
    'PROJECT_COMPLETION': 'Projekt abgeschlossen',
    'REFERRAL_BONUS': 'Empfehlungsbonus',
    'ADMIN_ADJUSTMENT': 'Admin-Anpassung',
  };
  return labels[eventType] || eventType;
};

const CreditDashboard: React.FC<CreditDashboardProps> = ({ isAdmin = false }) => {
  const [balance, setBalance] = useState<CreditBalance | null>(null);
  const [events, setEvents] = useState<CreditEvent[]>([]);
  const [packages, setPackages] = useState<CreditPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [purchaseLoading, setPurchaseLoading] = useState(false);

  useEffect(() => {
    loadCreditData();
  }, []);

  const loadCreditData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [balanceData, eventsData, packagesData] = await Promise.all([
        getCreditBalance(),
        getCreditHistory(),
        getCreditPackages(),
      ]);

      setBalance(balanceData);
      setEvents(eventsData);
      setPackages(packagesData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler beim Laden der Credit-Daten');
    } finally {
      setLoading(false);
    }
  };

  const handlePurchaseCredits = async (packageType: string) => {
    try {
      setPurchaseLoading(true);
      const purchase = await purchaseCredits(packageType);
      
      // TODO: Stripe-Integration - hier würde der User zu Stripe weitergeleitet
      // Simuliere erfolgreichen Kauf für Demo
      alert(`Credit-Kauf initiiert: ${purchase.credits_amount} Credits für ${purchase.price_chf} CHF`);
      
      // Lade Daten neu
      await loadCreditData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler beim Credit-Kauf');
    } finally {
      setPurchaseLoading(false);
    }
  };

  const handleAdminDailyDeduction = async () => {
    try {
      // TODO: Implement processDailyDeductions API call
      alert('Tägliche Abzüge wurden verarbeitet');
      await loadCreditData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler bei täglichen Abzügen');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#ffbd59]"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-400">Fehler</h3>
            <div className="mt-2 text-sm text-red-300">{error}</div>
            <div className="mt-4">
              <button
                onClick={loadCreditData}
                className="bg-red-800/50 text-red-200 px-3 py-2 rounded-md text-sm font-medium hover:bg-red-800/70 transition-colors"
              >
                Erneut versuchen
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#1a1a2e] to-[#16213e] rounded-lg shadow-lg border border-gray-700 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">BuildWise Credits</h1>
            <p className="text-gray-300 mt-1">Verwalten Sie Ihre Credits und Pro-Status</p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={loadCreditData}
              className="bg-[#ffbd59] text-[#1a1a2e] px-4 py-2 rounded-md text-sm font-medium hover:bg-[#ffa726] transition-colors"
            >
              Aktualisieren
            </button>
            {isAdmin && (
              <button
                onClick={handleAdminDailyDeduction}
                className="bg-orange-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-orange-700 transition-colors"
              >
                Tägliche Abzüge
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Credit Balance */}
      {balance && (
        <div className="bg-gradient-to-r from-[#1a1a2e] to-[#16213e] rounded-lg shadow-lg border border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Ihr Credit-Status</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-r from-[#0f3460] to-[#16213e] rounded-lg p-4 border border-gray-600">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-300 text-sm">Verfügbare Credits</p>
                  <p className="text-3xl font-bold text-[#ffbd59]">{balance.credits}</p>
                </div>
                <div className="text-4xl">💎</div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-[#0f3460] to-[#16213e] rounded-lg p-4 border border-gray-600">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-300 text-sm">Pro-Status</p>
                  <p className="text-2xl font-bold text-[#ffbd59]">{balance.plan_status === 'PRO' ? 'Pro' : 'Basic'}</p>
                  <p className="text-gray-300 text-sm">
                    {balance.remaining_pro_days} Tage verbleibend
                  </p>
                </div>
                <div className="text-4xl">⭐</div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-[#0f3460] to-[#16213e] rounded-lg p-4 border border-gray-600">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-300 text-sm">Status</p>
                  <p className="text-2xl font-bold text-[#ffbd59]">
                    {balance.is_pro_active ? 'Aktiv' : 'Inaktiv'}
                  </p>
                  <p className="text-gray-300 text-sm">
                    {balance.can_perform_actions ? 'Vollzugriff' : 'Eingeschränkt'}
                  </p>
                </div>
                <div className="text-4xl">🔒</div>
              </div>
            </div>
          </div>

          {/* Warnung bei niedrigen Credits */}
          {balance.low_credit_warning && (
            <div className="mt-4 bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-400">Niedrige Credits</h3>
                  <div className="mt-2 text-sm text-yellow-300">
                    <p>Ihre Credits sind niedrig. Kaufen Sie Credits oder führen Sie Aktivitäten aus, um Credits zu verdienen.</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Credit Packages */}
      <div className="bg-gradient-to-r from-[#1a1a2e] to-[#16213e] rounded-lg shadow-lg border border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Credits kaufen</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {packages.map((pkg) => {
            const savings = pkg.credits - pkg.price; // Rabatt in Credits
            const savingsPercent = ((savings / pkg.credits) * 100).toFixed(0);
            
            return (
              <div
                key={pkg.package_type}
                className={`border rounded-lg p-4 cursor-pointer transition-all ${
                  pkg.popular
                    ? 'border-[#ffbd59] bg-[#ffbd59]/10'
                    : pkg.best_value
                    ? 'border-green-500 bg-green-500/10'
                    : 'border-gray-600 hover:border-gray-500 bg-gray-800/50'
                }`}
                onClick={() => setSelectedPackage(pkg.package_type)}
              >
                {pkg.popular && (
                  <div className="bg-[#ffbd59] text-[#1a1a2e] text-xs px-2 py-1 rounded-full mb-2 inline-block font-medium">
                    Beliebt
                  </div>
                )}
                {pkg.best_value && (
                  <div className="bg-green-500 text-white text-xs px-2 py-1 rounded-full mb-2 inline-block font-medium">
                    Beste Wert
                  </div>
                )}
                <h3 className="font-semibold text-white">{pkg.name}</h3>
                <p className="text-2xl font-bold text-[#ffbd59]">{pkg.credits} Credits</p>
                <p className="text-gray-300 text-lg font-medium">{pkg.price} CHF</p>
                <p className="text-sm text-gray-400 mt-1">
                  {pkg.price_per_credit.toFixed(2)} CHF pro Credit
                </p>
                {savings > 0 && (
                  <p className="text-sm text-green-400 mt-1">
                    Sparen Sie {savings} Credits ({savingsPercent}% Rabatt)
                  </p>
                )}
                <p className="text-sm text-gray-400 mt-2">{pkg.description}</p>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePurchaseCredits(pkg.package_type);
                  }}
                  disabled={purchaseLoading}
                  className="mt-3 w-full bg-[#ffbd59] text-[#1a1a2e] px-3 py-2 rounded-md text-sm font-medium hover:bg-[#ffa726] transition-colors disabled:opacity-50"
                >
                  {purchaseLoading ? 'Wird verarbeitet...' : 'Kaufen'}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Credit Events */}
      <div className="bg-gradient-to-r from-[#1a1a2e] to-[#16213e] rounded-lg shadow-lg border border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Credit-Historie</h2>
        <div className="space-y-3">
          {events.map((event) => (
            <div key={event.id} className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg border border-gray-600">
              <div className="flex items-center space-x-3">
                <span className="text-2xl">{getEventTypeIcon(event.event_type)}</span>
                <div>
                  <p className="font-medium text-white">
                    {getEventTypeLabel(event.event_type)}
                  </p>
                  <p className="text-sm text-gray-300">{event.description}</p>
                  <p className="text-xs text-gray-400">
                    {new Date(event.created_at).toLocaleDateString('de-DE')}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className={`font-semibold ${
                  event.credits_change > 0 ? 'text-green-400' : 'text-red-400'
                }`}>
                  {event.credits_change > 0 ? '+' : ''}{event.credits_change} Credits
                </p>
                <p className="text-sm text-gray-400">
                  {event.credits_after} Credits
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CreditDashboard; 
