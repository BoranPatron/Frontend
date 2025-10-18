import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { useProject } from './ProjectContext';
import { OnboardingManager } from '../utils/OnboardingManager';
import { updateMe } from '../api/userService';

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
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const { user, isInitialized } = useAuth();
  const { projects } = useProject();
  
  const [showTour, setShowTour] = useState(false);
  const [tourCompleted, setTourCompleted] = useState(false);
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

  // Check if tour has been completed
  useEffect(() => {
    if (user) {
      const consentFields = user.consent_fields || {};
      const dashboardTour = consentFields.dashboard_tour;
      const completed = dashboardTour?.completed === true;
      setTourCompleted(completed);
      
      // Check if this is a first login
      const isNew = OnboardingManager.isFirstTimeUser(user);
      setIsFirstLogin(isNew);
    }
  }, [user]);

  // Determine if UI should be disabled
  const shouldDisableUI = Boolean(
    user && 
    isInitialized && 
    user.role_selected &&
    !tourCompleted && 
    !hasProjects && 
    (userRole === 'BAUTRAEGER' || userRole === 'DIENSTLEISTER')
  );

  // Initialize tour when conditions are met
  const initializeTour = () => {
    if (user && OnboardingManager.canStartDashboardTour(user)) {
      setShowTour(true);
    }
  };

  // Complete tour and re-enable UI
  const completeTour = async () => {
    console.log('🎯 completeTour called');
    setShowTour(false);
    setTourCompleted(true);
    
    // Aktualisiere die Datenbank
    if (user) {
      try {
        await updateMe({
          consent_fields: {
            dashboard_tour: {
              completed: true,
              version: '2.0',
              completed_at: new Date().toISOString(),
            }
          }
        });
      } catch (error) {
        console.warn('Tour completion could not be saved to database', error);
      }
    }
    
    // Zeige Willkommens-Notification für Bauträger nach Abschluss der Guided Tour
    if (userRole === 'BAUTRAEGER' && user) {
      // Prüfe ob dies der erste Login nach der Tour ist
      const firstLoginAfterTourKey = `first_login_after_tour_${user.id}`;
      const hasShownAfterTour = localStorage.getItem(firstLoginAfterTourKey);
      
      console.log('🎉 Tour completed, checking welcome notification:', {
        userRole,
        userId: user.id,
        hasShownAfterTour,
        willShow: !hasShownAfterTour
      });
      
      if (!hasShownAfterTour) {
        // Kleine Verzögerung, damit die Tour vollständig geschlossen ist
        setTimeout(() => {
          console.log('🎉 Showing welcome notification for user after tour:', user.id);
          setShowWelcomeNotification(true);
          localStorage.setItem(firstLoginAfterTourKey, 'true');
        }, 500);
      }
    }
  };

  // Auto-start tour for new users
  useEffect(() => {
    if (isInitialized && user && !tourCompleted && user.role_selected) {
      // Small delay to ensure UI is ready
      const timer = setTimeout(() => {
        initializeTour();
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [isInitialized, user, tourCompleted]);

  // Listen for manual tour start event
  useEffect(() => {
    const handleStartTour = () => {
      initializeTour();
    };

    window.addEventListener('startDashboardTour', handleStartTour);
    return () => window.removeEventListener('startDashboardTour', handleStartTour);
  }, [user]);

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
    setShowWelcomeNotification
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