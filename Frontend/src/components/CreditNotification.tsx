import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Coins, TrendingDown, AlertTriangle, Zap, Sparkles, X } from 'lucide-react';

interface CreditNotificationProps {
  creditsChanged: number;
  newBalance: number;
  onClose: () => void;
}

export default function CreditNotification({ 
  creditsChanged, 
  newBalance, 
  onClose 
}: CreditNotificationProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300); // Warte auf Exit-Animation
    }, 4000);

    return () => clearTimeout(timer);
  }, [onClose]);

  const isDeduction = creditsChanged < 0;
  const isLowCredits = newBalance < 10;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -50, scale: 0.9 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="fixed top-4 right-4 z-50 max-w-sm"
        >
          <div className={`
            relative p-4 rounded-xl shadow-2xl border backdrop-blur-lg
            ${isDeduction 
              ? 'bg-gradient-to-r from-red-500/20 to-orange-500/20 border-red-500/30' 
              : 'bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-green-500/30'
            }
          `}>
            {/* Glow-Effekt */}
            <div className={`
              absolute inset-0 rounded-xl blur-sm -z-10
              ${isDeduction 
                ? 'bg-gradient-to-r from-red-500/30 to-orange-500/30' 
                : 'bg-gradient-to-r from-green-500/30 to-emerald-500/30'
              }
            `} />

            {/* Close Button */}
            <button
              onClick={() => {
                setIsVisible(false);
                setTimeout(onClose, 300);
              }}
              className="absolute top-2 right-2 text-gray-400 hover:text-white transition-colors"
            >
              <X size={16} />
            </button>

            {/* Content */}
            <div className="flex items-center gap-3">
              {/* Icon */}
              <motion.div
                animate={{ 
                  scale: [1, 1.2, 1],
                  rotate: isDeduction ? [0, -5, 5, 0] : [0, 5, -5, 0]
                }}
                transition={{ duration: 0.6, ease: "easeInOut" }}
                className={`
                  p-2 rounded-lg
                  ${isDeduction 
                    ? 'bg-red-500/20 text-red-400' 
                    : 'bg-green-500/20 text-green-400'
                  }
                `}
              >
                {isDeduction ? (
                  <TrendingDown size={20} />
                ) : (
                  <Coins size={20} />
                )}
              </motion.div>

              {/* Text */}
              <div className="flex-1">
                <h4 className={`
                  font-semibold text-sm
                  ${isDeduction ? 'text-red-300' : 'text-green-300'}
                `}>
                  {isDeduction ? 'Täglicher Credit-Abzug' : 'Credits erhalten'}
                </h4>
                <p className="text-gray-300 text-xs mt-1">
                  {isDeduction ? (
                    <>
                      <span className="text-red-400 font-bold">{Math.abs(creditsChanged)}</span> Credit{Math.abs(creditsChanged) !== 1 ? 's' : ''} abgezogen
                      <br />
                      <span className="text-white font-bold">{newBalance}</span> Credits verbleibend
                    </>
                  ) : (
                    <>
                      <span className="text-green-400 font-bold">+{creditsChanged}</span> Credits erhalten
                      <br />
                      <span className="text-white font-bold">{newBalance}</span> Credits gesamt
                    </>
                  )}
                </p>
                
                {isLowCredits && (
                  <p className="text-amber-400 text-xs mt-2 flex items-center gap-1">
                    <AlertTriangle size={12} />
                    Credits fast aufgebraucht!
                  </p>
                )}
              </div>

              {/* Sparkle-Effekt */}
              <AnimatePresence>
                {!isDeduction && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0 }}
                    transition={{ duration: 0.3, delay: 0.2 }}
                  >
                    <Sparkles className="w-5 h-5 text-green-400" />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}