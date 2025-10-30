import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Coins, TrendingUp, Sparkles, Zap, Star, Gift, Heart } from 'lucide-react';

interface CreditAdditionAnimationProps {
  isVisible: boolean;
  onComplete: () => void;
  creditAmount: number;
  eventType: 'quote_accepted' | 'inspection_quote_accepted' | 'project_completed' | 'provider_review' | 'milestone_completed' | 'registration_bonus' | 'referral_bonus' | 'loyalty_bonus';
  providerName?: string;
}

export default function CreditAdditionAnimation({ 
  isVisible, 
  onComplete,
  creditAmount,
  eventType,
  providerName
}: CreditAdditionAnimationProps) {
  const [animationPhase, setAnimationPhase] = useState<'initial' | 'addition' | 'complete'>('initial');

  useEffect(() => {
    if (!isVisible) return;

    const timer1 = setTimeout(() => {
      setAnimationPhase('addition');
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

  const getEventConfig = () => {
    switch (eventType) {
      case 'quote_accepted':
        return {
          title: 'Angebot angenommen!',
          subtitle: providerName ? `${providerName} wurde beauftragt` : 'Angebot erfolgreich angenommen',
          icon: TrendingUp,
          colors: 'from-emerald-500/30 via-green-500/30 to-teal-500/30',
          innerColors: 'from-emerald-400/40 via-green-400/40 to-teal-400/40',
          iconBg: 'from-emerald-500/20 to-green-500/20',
          iconBorder: 'border-emerald-500/30',
          iconColor: 'text-emerald-400',
          sparkleColor: 'text-emerald-400',
          zapColor: 'text-green-400',
          glowColor: 'rgba(16, 185, 129, 0.3)',
          particleColors: 'from-emerald-400 to-green-400'
        };
      case 'inspection_quote_accepted':
        return {
          title: 'Besichtigungs-Angebot angenommen!',
          subtitle: providerName ? `${providerName} wurde nach Besichtigung beauftragt` : 'Besichtigungs-Angebot erfolgreich angenommen',
          icon: Star,
          colors: 'from-blue-500/30 via-indigo-500/30 to-purple-500/30',
          innerColors: 'from-blue-400/40 via-indigo-400/40 to-purple-400/40',
          iconBg: 'from-blue-500/20 to-indigo-500/20',
          iconBorder: 'border-blue-500/30',
          iconColor: 'text-blue-400',
          sparkleColor: 'text-blue-400',
          zapColor: 'text-indigo-400',
          glowColor: 'rgba(59, 130, 246, 0.3)',
          particleColors: 'from-blue-400 to-indigo-400'
        };
      case 'project_completed':
        return {
          title: 'Projekt abgeschlossen!',
          subtitle: 'Projekt erfolgreich beendet',
          icon: Gift,
          colors: 'from-purple-500/30 via-pink-500/30 to-rose-500/30',
          innerColors: 'from-purple-400/40 via-pink-400/40 to-rose-400/40',
          iconBg: 'from-purple-500/20 to-pink-500/20',
          iconBorder: 'border-purple-500/30',
          iconColor: 'text-purple-400',
          sparkleColor: 'text-purple-400',
          zapColor: 'text-pink-400',
          glowColor: 'rgba(147, 51, 234, 0.3)',
          particleColors: 'from-purple-400 to-pink-400'
        };
      case 'provider_review':
        return {
          title: 'Bewertung abgegeben!',
          subtitle: 'Dienstleister erfolgreich bewertet',
          icon: Star,
          colors: 'from-yellow-500/30 via-amber-500/30 to-orange-500/30',
          innerColors: 'from-yellow-400/40 via-amber-400/40 to-orange-400/40',
          iconBg: 'from-yellow-500/20 to-amber-500/20',
          iconBorder: 'border-yellow-500/30',
          iconColor: 'text-yellow-400',
          sparkleColor: 'text-yellow-400',
          zapColor: 'text-amber-400',
          glowColor: 'rgba(245, 158, 11, 0.3)',
          particleColors: 'from-yellow-400 to-amber-400'
        };
      case 'milestone_completed':
        return {
          title: 'Meilenstein erreicht!',
          subtitle: 'Meilenstein erfolgreich abgeschlossen',
          icon: Zap,
          colors: 'from-cyan-500/30 via-blue-500/30 to-indigo-500/30',
          innerColors: 'from-cyan-400/40 via-blue-400/40 to-indigo-400/40',
          iconBg: 'from-cyan-500/20 to-blue-500/20',
          iconBorder: 'border-cyan-500/30',
          iconColor: 'text-cyan-400',
          sparkleColor: 'text-cyan-400',
          zapColor: 'text-blue-400',
          glowColor: 'rgba(6, 182, 212, 0.3)',
          particleColors: 'from-cyan-400 to-blue-400'
        };
      case 'registration_bonus':
        return {
          title: 'Willkommensbonus!',
          subtitle: 'Herzlich willkommen bei BuildWise',
          icon: Gift,
          colors: 'from-rose-500/30 via-pink-500/30 to-purple-500/30',
          innerColors: 'from-rose-400/40 via-pink-400/40 to-purple-400/40',
          iconBg: 'from-rose-500/20 to-pink-500/20',
          iconBorder: 'border-rose-500/30',
          iconColor: 'text-rose-400',
          sparkleColor: 'text-rose-400',
          zapColor: 'text-pink-400',
          glowColor: 'rgba(244, 63, 94, 0.3)',
          particleColors: 'from-rose-400 to-pink-400'
        };
      case 'referral_bonus':
        return {
          title: 'Empfehlungsbonus!',
          subtitle: 'Freund erfolgreich empfohlen',
          icon: Star,
          colors: 'from-violet-500/30 via-purple-500/30 to-fuchsia-500/30',
          innerColors: 'from-violet-400/40 via-purple-400/40 to-fuchsia-400/40',
          iconBg: 'from-violet-500/20 to-purple-500/20',
          iconBorder: 'border-violet-500/30',
          iconColor: 'text-violet-400',
          sparkleColor: 'text-violet-400',
          zapColor: 'text-purple-400',
          glowColor: 'rgba(139, 92, 246, 0.3)',
          particleColors: 'from-violet-400 to-purple-400'
        };
      case 'loyalty_bonus':
        return {
          title: 'Treuebonus!',
          subtitle: 'Danke für deine Treue',
          icon: Heart,
          colors: 'from-red-500/30 via-rose-500/30 to-pink-500/30',
          innerColors: 'from-red-400/40 via-rose-400/40 to-pink-400/40',
          iconBg: 'from-red-500/20 to-rose-500/20',
          iconBorder: 'border-red-500/30',
          iconColor: 'text-red-400',
          sparkleColor: 'text-red-400',
          zapColor: 'text-rose-400',
          glowColor: 'rgba(239, 68, 68, 0.3)',
          particleColors: 'from-red-400 to-rose-400'
        };
      default:
        return {
          title: 'Credits erhalten!',
          subtitle: 'Credits erfolgreich gutgeschrieben',
          icon: Coins,
          colors: 'from-emerald-500/30 via-green-500/30 to-teal-500/30',
          innerColors: 'from-emerald-400/40 via-green-400/40 to-teal-400/40',
          iconBg: 'from-emerald-500/20 to-green-500/20',
          iconBorder: 'border-emerald-500/30',
          iconColor: 'text-emerald-400',
          sparkleColor: 'text-emerald-400',
          zapColor: 'text-green-400',
          glowColor: 'rgba(16, 185, 129, 0.3)',
          particleColors: 'from-emerald-400 to-green-400'
        };
    }
  };

  const config = getEventConfig();
  const IconComponent = config.icon;

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="fixed inset-0 z-[10001] flex items-center justify-center pointer-events-none"
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
            className={`absolute inset-0 w-32 h-32 rounded-full bg-gradient-to-r ${config.colors} blur-xl`}
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
            className={`absolute inset-0 w-24 h-24 rounded-full bg-gradient-to-r ${config.innerColors} blur-lg`}
          />

          {/* Main card with glassmorphism */}
          <motion.div
            className="relative w-80 h-48 bg-gradient-to-br from-gray-900/80 via-gray-800/80 to-gray-900/80 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl overflow-hidden"
            animate={{
              boxShadow: [
                `0 0 0px ${config.glowColor}`,
                `0 0 30px ${config.glowColor}`,
                `0 0 0px ${config.glowColor}`
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
                animate={animationPhase === 'addition' ? {
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
                    className={`p-4 rounded-full bg-gradient-to-br ${config.iconBg} border ${config.iconBorder}`}
                  >
                    <IconComponent className={`w-8 h-8 ${config.iconColor}`} />
                  </motion.div>

                  {/* Sparkle effects */}
                  <AnimatePresence>
                    {animationPhase === 'addition' && (
                      <>
                        <motion.div
                          initial={{ opacity: 0, scale: 0 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0 }}
                          transition={{ duration: 0.3, delay: 0.2 }}
                          className="absolute -top-2 -right-2"
                        >
                          <Sparkles className={`w-4 h-4 ${config.sparkleColor}`} />
                        </motion.div>
                        <motion.div
                          initial={{ opacity: 0, scale: 0 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0 }}
                          transition={{ duration: 0.3, delay: 0.4 }}
                          className="absolute -bottom-1 -left-1"
                        >
                          <Zap className={`w-3 h-3 ${config.zapColor}`} />
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
                  animate={animationPhase === 'addition' ? {
                    color: ['#10b981', '#34d399', '#10b981']
                  } : {}}
                  transition={{ duration: 0.6, ease: "easeInOut" }}
                  className="text-xl font-bold text-white mb-2"
                >
                  {config.title}
                </motion.h3>
                
                <motion.p
                  animate={animationPhase === 'addition' ? {
                    scale: [1, 1.05, 1]
                  } : {}}
                  transition={{ duration: 0.4, ease: "easeInOut" }}
                  className="text-gray-300 text-sm mb-1"
                >
                  {animationPhase === 'initial' && 'Credits werden gutgeschrieben...'}
                  {animationPhase === 'addition' && (
                    <>
                      <span className="text-emerald-400 font-bold">+{creditAmount}</span> Credits erhalten
                    </>
                  )}
                  {animationPhase === 'complete' && 'Credits erfolgreich gutgeschrieben'}
                </motion.p>

                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.8 }}
                  className="text-gray-400 text-xs"
                >
                  {config.subtitle}
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
                    className={`h-full bg-gradient-to-r ${config.particleColors} rounded-full`}
                  />
                </div>
              </motion.div>
            </div>
          </motion.div>

          {/* Floating particles */}
          <AnimatePresence>
            {animationPhase === 'addition' && (
              <>
                {[...Array(8)].map((_, i) => (
                  <motion.div
                    key={`credit-addition-particle-${i}`}
                    initial={{ 
                      opacity: 0, 
                      scale: 0,
                      x: 0,
                      y: 0
                    }}
                    animate={{ 
                      opacity: [0, 1, 0],
                      scale: [0, 1, 0],
                      x: Math.cos(i * 45 * Math.PI / 180) * 120,
                      y: Math.sin(i * 45 * Math.PI / 180) * 120
                    }}
                    exit={{ opacity: 0, scale: 0 }}
                    transition={{ 
                      duration: 1.5,
                      delay: i * 0.1,
                      ease: "easeOut"
                    }}
                    className={`absolute w-2 h-2 bg-gradient-to-r ${config.particleColors} rounded-full`}
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
