import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Gift, Sparkles, X, CreditCard, Zap, TrendingUp } from 'lucide-react';
import confetti from 'canvas-confetti';

interface WelcomeCreditNotificationProps {
  show: boolean;
  credits: number;
  onClose: () => void;
  userName?: string;
}

export default function WelcomeCreditNotification({ 
  show, 
  credits = 90, 
  onClose,
  userName 
}: WelcomeCreditNotificationProps) {
  const [isVisible, setIsVisible] = useState(show);
  const [animationStep, setAnimationStep] = useState(0);

  useEffect(() => {
    if (show) {
      setIsVisible(true);
      setAnimationStep(0);
      
      // Trigger confetti animation
      setTimeout(() => {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#ffbd59', '#ffa726', '#ff9800', '#fb8c00', '#f57c00']
        });
      }, 500);

      // Start animation sequence
      const timer1 = setTimeout(() => setAnimationStep(1), 100);
      const timer2 = setTimeout(() => setAnimationStep(2), 600);
      const timer3 = setTimeout(() => setAnimationStep(3), 1200);

      // Auto-close after 10 seconds
      const autoCloseTimer = setTimeout(() => {
        handleClose();
      }, 10000);

      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
        clearTimeout(timer3);
        clearTimeout(autoCloseTimer);
      };
    }
  }, [show]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: -20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: -20 }}
          transition={{ type: "spring", duration: 0.5 }}
          className="fixed top-4 right-4 z-[9999] max-w-md"
        >
          <div className="relative bg-gradient-to-br from-amber-50 via-white to-orange-50 rounded-2xl shadow-2xl border border-amber-200/50 overflow-hidden">
            {/* Animated background pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-gradient-to-br from-amber-400 to-orange-400 rounded-full blur-3xl animate-pulse" />
              <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-gradient-to-br from-orange-400 to-amber-400 rounded-full blur-3xl animate-pulse delay-1000" />
            </div>

            {/* Content */}
            <div className="relative p-6">
              {/* Close button */}
              <button
                onClick={handleClose}
                className="absolute top-4 right-4 p-1 rounded-lg hover:bg-gray-100/80 transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>

              {/* Header with animated icon */}
              <div className="flex items-start gap-4 mb-4">
                <motion.div
                  animate={{ 
                    rotate: animationStep >= 1 ? [0, -10, 10, -10, 10, 0] : 0,
                    scale: animationStep >= 1 ? [1, 1.1, 1] : 1
                  }}
                  transition={{ duration: 0.6 }}
                  className="relative"
                >
                  <div className="w-14 h-14 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg">
                    <Gift className="w-7 h-7 text-white" />
                  </div>
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: animationStep >= 1 ? 1 : 0 }}
                    className="absolute -top-1 -right-1"
                  >
                    <Sparkles className="w-5 h-5 text-amber-500" />
                  </motion.div>
                </motion.div>

                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 mb-1">
                    Willkommen{userName ? `, ${userName}` : ''} bei BuildWise! 🎉
                  </h3>
                  <p className="text-sm text-gray-600">
                    Ihr Konto wurde erfolgreich erstellt
                  </p>
                </div>
              </div>

              {/* Credit announcement */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ 
                  opacity: animationStep >= 2 ? 1 : 0,
                  y: animationStep >= 2 ? 0 : 10
                }}
                transition={{ duration: 0.4 }}
                className="bg-gradient-to-r from-amber-100 to-orange-100 rounded-xl p-4 mb-4 border border-amber-200/30"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-amber-600" />
                    <span className="text-sm font-semibold text-amber-900">Willkommensbonus</span>
                  </div>
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ 
                      scale: animationStep >= 2 ? [0, 1.2, 1] : 0,
                      rotate: animationStep >= 2 ? [0, 360] : 0
                    }}
                    transition={{ duration: 0.6 }}
                    className="flex items-center gap-1 bg-white px-3 py-1 rounded-full shadow-sm"
                  >
                    <span className="text-2xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                      +{credits}
                    </span>
                    <span className="text-sm text-gray-600">Credits</span>
                  </motion.div>
                </div>
                <p className="text-xs text-gray-700">
                  Nutzen Sie Ihre Credits für Premium-Features und erweiterte Funktionen
                </p>
              </motion.div>

              {/* Pro status announcement */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ 
                  opacity: animationStep >= 3 ? 1 : 0,
                  y: animationStep >= 3 ? 0 : 10
                }}
                transition={{ duration: 0.4 }}
                className="bg-gradient-to-r from-purple-500 to-indigo-600 rounded-xl p-4 mb-4 relative overflow-hidden"
              >
                {/* Shimmer effect */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                  animate={{ x: [-200, 200] }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
                />
                
                <div className="relative flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
                    <Zap className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-white font-bold">BuildWise PRO</span>
                      <span className="px-2 py-0.5 bg-white/20 backdrop-blur text-white text-xs font-semibold rounded-full">
                        AKTIVIERT
                      </span>
                    </div>
                    <p className="text-white/90 text-xs">
                      Alle Premium-Features freigeschaltet
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* Features list */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ 
                  opacity: animationStep >= 3 ? 1 : 0
                }}
                transition={{ duration: 0.4, delay: 0.2 }}
                className="space-y-2 mb-4"
              >
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">
                    <svg className="w-3 h-3 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-gray-700">Unbegrenzte Projekte erstellen</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">
                    <svg className="w-3 h-3 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-gray-700">Premium-Funktionen nutzen</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">
                    <svg className="w-3 h-3 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-gray-700">Erweiterte Analytics & Reports</span>
                </div>
              </motion.div>

              {/* CTA */}
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ 
                  opacity: animationStep >= 3 ? 1 : 0
                }}
                transition={{ duration: 0.4, delay: 0.3 }}
                onClick={handleClose}
                className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold py-3 px-4 rounded-xl hover:shadow-lg transform hover:scale-[1.02] transition-all duration-200 flex items-center justify-center gap-2"
              >
                <TrendingUp className="w-5 h-5" />
                Jetzt durchstarten
              </motion.button>

              {/* Credit info */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ 
                  opacity: animationStep >= 3 ? 1 : 0
                }}
                transition={{ duration: 0.4, delay: 0.4 }}
                className="text-xs text-gray-500 text-center mt-3"
              >
                Credits verfallen nicht • 1 Credit = 1 Tag Pro-Status
              </motion.p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

