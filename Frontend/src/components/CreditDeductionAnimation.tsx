import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Coins, TrendingDown, Sparkles, Zap } from 'lucide-react';

interface CreditDeductionAnimationProps {
  isVisible: boolean;
  onComplete: () => void;
}

export default function CreditDeductionAnimation({ 
  isVisible, 
  onComplete 
}: CreditDeductionAnimationProps) {
  const [animationPhase, setAnimationPhase] = useState<'initial' | 'deduction' | 'complete'>('initial');

  useEffect(() => {
    if (!isVisible) return;

    const timer1 = setTimeout(() => {
      setAnimationPhase('deduction');
    }, 500);

    const timer2 = setTimeout(() => {
      setAnimationPhase('complete');
    }, 2000);

    const timer3 = setTimeout(() => {
      onComplete();
    }, 3500);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [isVisible, onComplete]);

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
      >
        {/* Backdrop with glassmorphism */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/20 backdrop-blur-sm"
        />

        {/* Main animation container */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="relative"
        >
          {/* Outer glow ring */}
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.6, 0.3]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="absolute inset-0 w-32 h-32 rounded-full bg-gradient-to-r from-red-500/30 via-orange-500/30 to-yellow-500/30 blur-xl"
          />

          {/* Inner glow ring */}
          <motion.div
            animate={{
              scale: [1, 1.1, 1],
              opacity: [0.5, 0.8, 0.5]
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 0.2
            }}
            className="absolute inset-0 w-24 h-24 rounded-full bg-gradient-to-r from-red-400/40 via-orange-400/40 to-yellow-400/40 blur-lg"
          />

          {/* Main card with glassmorphism */}
          <motion.div
            className="relative w-80 h-48 bg-gradient-to-br from-gray-900/80 via-gray-800/80 to-gray-900/80 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl overflow-hidden"
            animate={{
              boxShadow: [
                '0 0 0px rgba(255, 189, 89, 0)',
                '0 0 30px rgba(255, 189, 89, 0.3)',
                '0 0 0px rgba(255, 189, 89, 0)'
              ]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            {/* Shimmer effect */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: '100%' }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 0.5
              }}
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
            />

            {/* Content */}
            <div className="relative h-full flex flex-col items-center justify-center p-6">
              {/* Icon with animation */}
              <motion.div
                animate={animationPhase === 'deduction' ? {
                  scale: [1, 1.3, 1],
                  rotate: [0, -10, 10, -10, 10, 0]
                } : {}}
                transition={{
                  duration: 0.8,
                  ease: "easeInOut"
                }}
                className="mb-4"
              >
                <div className="relative">
                  <motion.div
                    animate={{
                      scale: [1, 1.2, 1],
                      opacity: [0.7, 1, 0.7]
                    }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                    className="p-4 rounded-full bg-gradient-to-br from-red-500/20 to-orange-500/20 border border-red-500/30"
                  >
                    <TrendingDown className="w-8 h-8 text-red-400" />
                  </motion.div>

                  {/* Sparkle effects */}
                  <AnimatePresence>
                    {animationPhase === 'deduction' && (
                      <>
                        <motion.div
                          initial={{ opacity: 0, scale: 0 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0 }}
                          transition={{ duration: 0.3, delay: 0.2 }}
                          className="absolute -top-2 -right-2"
                        >
                          <Sparkles className="w-4 h-4 text-yellow-400" />
                        </motion.div>
                        <motion.div
                          initial={{ opacity: 0, scale: 0 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0 }}
                          transition={{ duration: 0.3, delay: 0.4 }}
                          className="absolute -bottom-1 -left-1"
                        >
                          <Zap className="w-3 h-3 text-orange-400" />
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>

              {/* Text content */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="text-center"
              >
                <motion.h3
                  animate={animationPhase === 'deduction' ? {
                    color: ['#f87171', '#ffbd59', '#f87171']
                  } : {}}
                  transition={{ duration: 0.6, ease: "easeInOut" }}
                  className="text-xl font-bold text-white mb-2"
                >
                  Täglicher Credit-Abzug
                </motion.h3>
                
                <motion.p
                  animate={animationPhase === 'deduction' ? {
                    scale: [1, 1.05, 1]
                  } : {}}
                  transition={{ duration: 0.4, ease: "easeInOut" }}
                  className="text-gray-300 text-sm mb-1"
                >
                  {animationPhase === 'initial' && 'Pro-Status wird aktiv gehalten...'}
                  {animationPhase === 'deduction' && (
                    <>
                      <span className="text-red-400 font-bold">-1</span> Credit abgezogen
                    </>
                  )}
                  {animationPhase === 'complete' && 'Credit erfolgreich abgezogen'}
                </motion.p>

                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.8 }}
                  className="text-gray-400 text-xs"
                >
                  {animationPhase === 'deduction' && 'Pro-Status bleibt aktiv'}
                </motion.p>
              </motion.div>

              {/* Progress indicator */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.5 }}
                className="absolute bottom-4 left-4 right-4"
              >
                <div className="h-1 bg-gray-700/50 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: '0%' }}
                    animate={{ width: '100%' }}
                    transition={{ duration: 3, ease: "easeOut" }}
                    className="h-full bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500 rounded-full"
                  />
                </div>
              </motion.div>
            </div>
          </motion.div>

          {/* Floating particles */}
          <AnimatePresence>
            {animationPhase === 'deduction' && (
              <>
                {[...Array(6)].map((_, i) => (
                  <motion.div
                    key={`credit-deduction-particle-${i}`}
                    initial={{ 
                      opacity: 0, 
                      scale: 0,
                      x: 0,
                      y: 0
                    }}
                    animate={{ 
                      opacity: [0, 1, 0],
                      scale: [0, 1, 0],
                      x: Math.cos(i * 60 * Math.PI / 180) * 100,
                      y: Math.sin(i * 60 * Math.PI / 180) * 100
                    }}
                    exit={{ opacity: 0, scale: 0 }}
                    transition={{ 
                      duration: 1.5,
                      delay: i * 0.1,
                      ease: "easeOut"
                    }}
                    className="absolute w-2 h-2 bg-gradient-to-r from-red-400 to-orange-400 rounded-full"
                  />
                ))}
              </>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

