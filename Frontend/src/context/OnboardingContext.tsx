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
  resetTour?: () => void; // Debug-Funktion
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
      
      // Zusätzliche Sicherheitsprüfung: Lokale Speicherung
      const localTourCompletedKey = `tour_completed_${user.id}`;
      const localTourCompleted = localStorage.getItem(localTourCompletedKey) === 'true';
      
      // Tour ist abgeschlossen wenn entweder DB oder lokale Speicherung es bestätigt
      const isTourCompleted = completed || localTourCompleted;
      
      console.log('🔍 Tour completion check:', {
        userId: user.id,
        consentFields,
        dashboardTour,
        dbCompleted: completed,
        localCompleted: localTourCompleted,
        finalCompleted: isTourCompleted,
        userConsentFields: user.consent_fields
      });
      
      setTourCompleted(isTourCompleted);
      
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
        const tourCompletionData = {
          consent_fields: {
            ...user.consent_fields, // Behalte bestehende consent_fields
            dashboard_tour: {
              completed: true,
              version: '2.0',
              completed_at: new Date().toISOString(),
            }
          }
        };
        
        console.log('💾 Saving tour completion to database:', tourCompletionData);
        
        await updateMe(tourCompletionData);
        
        console.log('✅ Tour completion successfully saved to database');
        
        // Setze auch die lokale Speicherung als Backup
        const localTourCompletedKey = `tour_completed_${user.id}`;
        localStorage.setItem(localTourCompletedKey, 'true');
        console.log('💾 Tour completion also saved locally as backup');
        
        // Aktualisiere den lokalen User-State
        const updatedUser = {
          ...user,
          consent_fields: tourCompletionData.consent_fields
        };
        
        // Trigger eine Aktualisierung des User-Objekts
        // Dies wird durch den AuthContext gehandhabt, wenn der User beim nächsten Login neu geladen wird
        
      } catch (error) {
        console.error('❌ Tour completion could not be saved to database:', error);
        
        // Fallback: Setze lokale Speicherung trotzdem, um die Tour zu beenden
        const localTourCompletedKey = `tour_completed_${user.id}`;
        localStorage.setItem(localTourCompletedKey, 'true');
        console.log('💾 Tour completion saved locally as fallback due to DB error');
        
        // Setze tourCompleted trotzdem auf true, um die Tour zu beenden
        // Der Benutzer kann die Tour manuell erneut starten, falls nötig
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
      console.log('🎯 Manual tour start event received');
      initializeTour();
    };

    window.addEventListener('startDashboardTour', handleStartTour);
    return () => window.removeEventListener('startDashboardTour', handleStartTour);
  }, [user]);

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