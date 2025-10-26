import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { useProject } from './ProjectContext';
import { OnboardingManager } from '../utils/OnboardingManager';
import { updateMe } from '../api/userService';

/**
 * OnboardingContext - Legacy context for backward compatibility
 * @deprecated Use ContextualOnboardingContext instead
 * This context is kept for compatibility with existing code during migration
 */
interface OnboardingContextType {
  showTour: boolean;
  setShowTour: (show: boolean) => void;
  isFirstLogin: boolean;
  shouldDisableUI: boolean;
  tourCompleted: boolean;
  hasProjects: boolean;
  userRole: 'BAUTRAEGER' | 'DIENSTLEISTER' | null;
  initializeTour: () => void;
  completeTour: () => void;
  showWelcomeNotification: boolean;
  setShowWelcomeNotification: (show: boolean) => void;
  resetTour?: () => void; // Debug-Funktion
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const { user, isInitialized } = useAuth();
  const { projects } = useProject();
  
  // DEPRECATED: Legacy tour state - kept for backward compatibility
  const [showTour, setShowTour] = useState(false);
  const [tourCompleted, setTourCompleted] = useState(true); // Always true for new system
  const [isFirstLogin, setIsFirstLogin] = useState(false);
  const [showWelcomeNotification, setShowWelcomeNotification] = useState(false);

  // Calculate derived state
  const hasProjects = projects && projects.length > 0;
  const userRole = user?.user_role as 'BAUTRAEGER' | 'DIENSTLEISTER' | null;

  // Debug: Log state changes
  useEffect(() => {
    console.log('🔍 OnboardingContext state changed:', {
      showTour,
      tourCompleted,
      showWelcomeNotification,
      userRole,
      userId: user?.id
    });
  }, [showTour, tourCompleted, showWelcomeNotification, userRole, user?.id]);

  // DEPRECATED: Legacy tour check - contextual onboarding doesn't need this
  useEffect(() => {
    if (user) {
      // Always mark tour as completed for new contextual onboarding system
      setTourCompleted(true);
      
      // Check if this is a first login
      const isNew = OnboardingManager.isFirstTimeUser(user);
      setIsFirstLogin(isNew);
      
      console.log('🔍 Legacy onboarding context (deprecated):', {
        userId: user.id,
        tourCompleted: true,
        contextualOnboarding: user.consent_fields?.contextual_onboarding
      });
    }
  }, [user]);

  // DEPRECATED: UI is never disabled in contextual onboarding
  const shouldDisableUI = false;

  // DEPRECATED: No guided tour in contextual onboarding
  const initializeTour = () => {
    console.log('⚠️ initializeTour called but is deprecated. Use contextual onboarding instead.');
  };

  // DEPRECATED: Legacy completeTour - kept for compatibility
  const completeTour = async () => {
    console.log('⚠️ completeTour called but is deprecated. Contextual onboarding completes automatically.');
    setShowTour(false);
    setTourCompleted(true);
  };

  // DEPRECATED: Contextual onboarding doesn't need auto-start

  // Debug-Funktion zum manuellen Starten der Tour (nur für Entwicklung)
  const startTour = () => {
    if (process.env.NODE_ENV === 'development' && user) {
      console.log('🎯 Manual tour start requested');
      setShowTour(true);
    }
  };

  // Debug-Funktion zum Zurücksetzen der Tour (nur für Entwicklung)
  const resetTour = () => {
    if (process.env.NODE_ENV === 'development' && user) {
      const localTourCompletedKey = `tour_completed_${user.id}`;
      localStorage.removeItem(localTourCompletedKey);
      setTourCompleted(false);
      console.log('🔄 Tour reset for debugging');
    }
  };

  // Debug-Funktion zum Überprüfen des Tour-Status (nur für Entwicklung)
  const checkTourStatus = () => {
    if (process.env.NODE_ENV === 'development' && user) {
      const consentFields = user.consent_fields || {};
      const dashboardTour = consentFields.dashboard_tour;
      const localTourCompletedKey = `tour_completed_${user.id}`;
      const localTourCompleted = localStorage.getItem(localTourCompletedKey) === 'true';
      
      console.log('🔍 Tour Status Check:', {
        userId: user.id,
        dbCompleted: dashboardTour?.completed,
        localCompleted: localTourCompleted,
        currentTourCompleted: tourCompleted,
        showTour,
        userConsentFields: user.consent_fields
      });
    }
  };

  // Debug-Funktionen für Entwicklung - füge zu window hinzu
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    (window as any).resetTour = resetTour;
    (window as any).checkTourStatus = checkTourStatus;
    (window as any).startTour = startTour;
  }

  const value: OnboardingContextType = {
    showTour,
    setShowTour,
    isFirstLogin,
    shouldDisableUI,
    tourCompleted,
    hasProjects: Boolean(hasProjects),
    userRole,
    initializeTour,
    completeTour,
    showWelcomeNotification,
    setShowWelcomeNotification,
    resetTour: process.env.NODE_ENV === 'development' ? resetTour : undefined
  };

  return (
    <OnboardingContext.Provider value={value}>
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (context === undefined) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
}