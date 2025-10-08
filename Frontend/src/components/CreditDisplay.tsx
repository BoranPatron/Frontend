import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Coins, TrendingDown, AlertTriangle, Zap, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getCreditBalance } from '../api/creditService';

interface CreditBalance {
  credits: number;
  plan_status: 'BASIC' | 'PRO';
  remaining_pro_days: number | null;
  is_pro_active: boolean;
  low_credit_warning: boolean;
  can_perform_actions: boolean;
}

export default function CreditDisplay() {
  const [creditBalance, setCreditBalance] = useState<CreditBalance | null>(null);
  const [loading, setLoading] = useState(true);
  const [showTooltip, setShowTooltip] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [previousCredits, setPreviousCredits] = useState<number | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchCreditBalance();
    // Refresh every 30 seconds
    const interval = setInterval(fetchCreditBalance, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchCreditBalance = async () => {
    try {
      const balance = await getCreditBalance();
      
      // Trigger animation if credits changed
      if (previousCredits !== null && previousCredits !== balance.credits) {
        setIsAnimating(true);
        setTimeout(() => setIsAnimating(false), 2000);
      }
      
      setPreviousCredits(balance.credits);
      setCreditBalance(balance);
      setLoading(false);
    } catch (error) {
      console.error('Fehler beim Abrufen der Credit-Balance:', error);
      setLoading(false);
    }
  };

  if (loading || !creditBalance) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-800/50 animate-pulse">
        <Coins className="w-4 h-4 text-gray-400" />
        <div className="w-12 h-4 bg-gray-700 rounded" />
      </div>
    );
  }

  const isLowCredits = creditBalance.credits < 10;
  const isNegative = creditBalance.credits < 0;

  return (
    <motion.div
      className="relative"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {/* Glow-Effekt bei Animation */}
      <AnimatePresence>
        {isAnimating && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1.2 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 rounded-lg bg-gradient-to-r from-[#ffbd59]/30 to-[#ffa726]/30 blur-md -z-10"
          />
        )}
      </AnimatePresence>

      <motion.button
        onClick={() => navigate('/credits')}
        className={`
          relative flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-300 overflow-hidden
          ${isNegative 
            ? 'bg-red-500/20 border border-red-500/50 hover:bg-red-500/30' 
            : isLowCredits 
            ? 'bg-amber-500/20 border border-amber-500/50 hover:bg-amber-500/30'
            : creditBalance.is_pro_active
            ? 'bg-gradient-to-r from-purple-500/20 to-indigo-500/20 border border-purple-500/50 hover:from-purple-500/30 hover:to-indigo-500/30'
            : 'bg-gray-800/50 border border-gray-700 hover:bg-gray-800/70'
          }
          ${isAnimating ? 'shadow-lg shadow-[#ffbd59]/50' : ''}
        `}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        animate={isAnimating ? { 
          boxShadow: [
            '0 0 0px rgba(255, 189, 89, 0)',
            '0 0 20px rgba(255, 189, 89, 0.5)',
            '0 0 0px rgba(255, 189, 89, 0)'
          ]
        } : {}}
        transition={{ duration: 0.6, ease: "easeInOut" }}
      >
        {/* Shimmer-Effekt bei Animation */}
        <AnimatePresence>
          {isAnimating && (
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: '100%' }}
              exit={{ x: '100%' }}
              transition={{ duration: 0.8, ease: "easeInOut" }}
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
            />
          )}
        </AnimatePresence>

        {/* Icon with enhanced animation */}
        <motion.div
          animate={isLowCredits ? { 
            rotate: [0, -10, 10, -10, 10, 0],
            scale: [1, 1.1, 1, 1.1, 1]
          } : isAnimating ? {
            scale: [1, 1.2, 1],
            rotate: [0, 5, -5, 0]
          } : {}}
          transition={{ 
            duration: isLowCredits ? 0.5 : 0.4, 
            repeat: isLowCredits ? Infinity : 0, 
            repeatDelay: isLowCredits ? 5 : 0,
            ease: "easeInOut"
          }}
        >
          {isNegative ? (
            <AlertTriangle className="w-4 h-4 text-red-400" />
          ) : isLowCredits ? (
            <TrendingDown className="w-4 h-4 text-amber-400" />
          ) : creditBalance.is_pro_active ? (
            <Zap className="w-4 h-4 text-purple-400" />
          ) : (
            <Coins className="w-4 h-4 text-gray-400" />
          )}
        </motion.div>

        {/* Credit amount with pulse animation */}
        <motion.span 
          className={`
            font-bold text-sm relative
            ${isNegative 
              ? 'text-red-400' 
              : isLowCredits 
              ? 'text-amber-400'
              : creditBalance.is_pro_active
              ? 'text-purple-400'
              : 'text-gray-300'
            }
          `}
          animate={isAnimating ? {
            scale: [1, 1.1, 1],
            color: [
              isNegative ? '#f87171' : isLowCredits ? '#fbbf24' : '#a855f7',
              '#ffbd59',
              isNegative ? '#f87171' : isLowCredits ? '#fbbf24' : '#a855f7'
            ]
          } : {}}
          transition={{ duration: 0.6, ease: "easeInOut" }}
        >
          {creditBalance.credits}
          
          {/* Sparkle-Effekt bei Animation */}
          <AnimatePresence>
            {isAnimating && (
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0 }}
                transition={{ duration: 0.3, delay: 0.2 }}
                className="absolute -top-1 -right-1"
              >
                <Sparkles className="w-3 h-3 text-[#ffbd59]" />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.span>

        {/* Status badge with enhanced animation */}
        {creditBalance.is_pro_active && (
          <motion.span 
            className="px-1.5 py-0.5 bg-purple-500/20 text-purple-400 text-xs font-semibold rounded"
            animate={isAnimating ? {
              scale: [1, 1.1, 1],
              backgroundColor: [
                'rgba(168, 85, 247, 0.2)',
                'rgba(255, 189, 89, 0.3)',
                'rgba(168, 85, 247, 0.2)'
              ]
            } : {}}
            transition={{ duration: 0.6, ease: "easeInOut" }}
          >
            PRO
          </motion.span>
        )}
      </motion.button>

      {/* Tooltip */}
      <AnimatePresence>
        {showTooltip && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full mt-2 right-0 z-50 w-64 p-4 bg-gray-900 border border-gray-700 rounded-xl shadow-xl"
          >
            <div className="space-y-3">
              {/* Header */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-300">Credit-Status</span>
                <span className={`
                  px-2 py-1 text-xs font-bold rounded
                  ${creditBalance.is_pro_active 
                    ? 'bg-purple-500/20 text-purple-400' 
                    : 'bg-gray-700 text-gray-400'
                  }
                `}>
                  {creditBalance.plan_status}
                </span>
              </div>

              {/* Credit info */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Verfügbare Credits:</span>
                  <span className={`font-bold ${isNegative ? 'text-red-400' : isLowCredits ? 'text-amber-400' : 'text-white'}`}>
                    {creditBalance.credits}
                  </span>
                </div>

                {creditBalance.is_pro_active && creditBalance.remaining_pro_days !== null && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Pro-Tage verbleibend:</span>
                    <span className="text-purple-400 font-bold">
                      {creditBalance.remaining_pro_days}
                    </span>
                  </div>
                )}

                {isNegative && (
                  <div className="pt-2 border-t border-gray-700">
                    <p className="text-xs text-red-400">
                      ⚠️ Negative Credits! Sie wurden auf BASIC zurückgestuft.
                    </p>
                  </div>
                )}

                {isLowCredits && !isNegative && (
                  <div className="pt-2 border-t border-gray-700">
                    <p className="text-xs text-amber-400">
                      ⚠️ Credits fast aufgebraucht! Laden Sie auf, um PRO zu behalten.
                    </p>
                  </div>
                )}
              </div>

              {/* CTA */}
              <button
                onClick={() => navigate('/credits')}
                className="w-full py-2 px-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-sm font-semibold rounded-lg hover:shadow-lg transform hover:scale-[1.02] transition-all duration-200"
              >
                Credits aufladen
              </button>

              {/* Info */}
              <p className="text-xs text-gray-500 text-center">
                1 Credit = 1 Tag Pro-Status
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

