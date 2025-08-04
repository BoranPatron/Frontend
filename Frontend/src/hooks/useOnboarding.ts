import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import OnboardingManager from '../utils/OnboardingManager';

interface UseOnboardingReturn {
  showOnboarding: boolean;
  userType: 'beta' | 'new';
  startOnboarding: () => void;
  completeOnboarding: () => void;
  skipOnboarding: () => void;
  markStepCompleted: (stepId: string) => void;
}

export const useOnboarding = (): UseOnboardingReturn => {
  const { user } = useAuth();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [userType, setUserType] = useState<'beta' | 'new'>('new');

  useEffect(() => {
    if (!user) return;

    // Prüfe Onboarding-Status beim Laden
    const checkOnboardingStatus = () => {
      try {
        const onboardingState = OnboardingManager.getOnboardingState(user);
        
        console.log('🎯 Onboarding-Status Check:', {
          userId: user.id,
          needsOnboarding: onboardingState.needsOnboarding,
          reason: onboardingState.reason,
          userType: onboardingState.userType
        });

        if (onboardingState.needsOnboarding) {
          setShowOnboarding(true);
          setUserType(onboardingState.userType);
        } else {
          setShowOnboarding(false);
          setUserType(onboardingState.userType);
        }
      } catch (error) {
        console.error('❌ Fehler beim Prüfen des Onboarding-Status:', error);
        // Fallback: Zeige Onboarding für neue User
        if (user.id <= 1000) {
          setShowOnboarding(true);
          setUserType('beta');
        }
      }
    };

    // Verzögerung für bessere UX (warten bis App geladen ist)
    const timer = setTimeout(checkOnboardingStatus, 1000);
    
    return () => clearTimeout(timer);
  }, [user]);

  const startOnboarding = () => {
    if (!user) return;
    
    console.log('🚀 Starte Onboarding für User:', user.id);
    setShowOnboarding(true);
  };

  const completeOnboarding = () => {
    if (!user) return;
    
    console.log('✅ Onboarding abgeschlossen für User:', user.id);
    
    // Markiere Onboarding als abgeschlossen
    OnboardingManager.markOnboardingCompleted(user.id, userType);
    
    // Verstecke Overlay
    setShowOnboarding(false);
    
    // Optional: Zeige Erfolgsmeldung
    showSuccessMessage();
  };

  const skipOnboarding = () => {
    if (!user) return;
    
    console.log('⏭️ Onboarding übersprungen für User:', user.id);
    
    // Markiere als übersprungen (aber nicht abgeschlossen)
    OnboardingManager.saveOnboardingState(user.id, {
      needsOnboarding: false,
      reason: 'Onboarding übersprungen',
      userType,
      completedSteps: ['skipped']
    });
    
    // Verstecke Overlay
    setShowOnboarding(false);
    
    // Optional: Zeige Hinweis
    showSkipMessage();
  };

  const markStepCompleted = (stepId: string) => {
    if (!user) return;
    
    console.log('✅ Schritt abgeschlossen:', stepId);
    OnboardingManager.markStepCompleted(user.id, stepId);
  };

  const showSuccessMessage = () => {
    // Optional: Toast oder Notification
    console.log('🎉 Onboarding erfolgreich abgeschlossen!');
  };

  const showSkipMessage = () => {
    // Optional: Hinweis, dass Onboarding später wieder verfügbar ist
    console.log('ℹ️ Onboarding übersprungen - kann später wiederholt werden');
  };

  return {
    showOnboarding,
    userType,
    startOnboarding,
    completeOnboarding,
    skipOnboarding,
    markStepCompleted
  };
};