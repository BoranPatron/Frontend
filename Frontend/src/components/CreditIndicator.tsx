import React, { useState, useEffect } from 'react';
import { getCreditBalance, CreditBalance } from '../api/creditService';

interface CreditIndicatorProps {
  className?: string;
}

const CreditIndicator: React.FC<CreditIndicatorProps> = ({ className = '' }) => {
  const [balance, setBalance] = useState<CreditBalance | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCreditBalance();
  }, []);

  const loadCreditBalance = async () => {
    try {
      setLoading(true);
      setError(null);
      const balanceData = await getCreditBalance();
      setBalance(balanceData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler beim Laden der Credits');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <div className="animate-pulse bg-gray-600 rounded-full h-6 w-6"></div>
        <div className="animate-pulse bg-gray-600 rounded h-4 w-12"></div>
      </div>
    );
  }

  if (error || !balance) {
    return null; // Zeige nichts bei Fehlern
  }

  const getStatusColor = () => {
    if (balance.low_credit_warning) return 'text-red-400';
    if (balance.plan_status === 'pro') return 'text-[#ffbd59]';
    return 'text-yellow-400';
  };

  const getStatusIcon = () => {
    if (balance.low_credit_warning) return '⚠️';
    if (balance.plan_status === 'pro') return '💎';
    return '🔒';
  };

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <span className="text-lg">{getStatusIcon()}</span>
      <div className="flex flex-col">
        <span className={`text-sm font-medium ${getStatusColor()}`}>
          {balance.credits} Credits
        </span>
        <span className="text-xs text-gray-400">
          {balance.remaining_pro_days} Tage Pro
        </span>
      </div>
    </div>
  );
};

export default CreditIndicator; 