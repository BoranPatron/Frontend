/**
 * OnboardingManager - Intelligente Erstbenutzer-Erkennung und Onboarding-Flow
 */

interface OnboardingState {
  needsOnboarding: boolean;
  reason: string;
  userType: 'beta' | 'new';
  lastShown?: Date;
  completedSteps: string[];
}

interface User {
  id: number;
  email: string;
  user_type: string;
  user_role: string;
  role_selected: boolean;
  subscription_plan: string;
  created_at: string;
}

class OnboardingManager {
  private static readonly STORAGE_KEY = 'buildwise_onboarding_state';
  private static readonly BETA_USER_INDICATORS = ['beta', 'tester', 'early_access'];
  private static readonly DAILY_RESET_KEY = 'buildwise_onboarding_daily_reset';

  /**
   * Bestimmt den Onboarding-Status für einen User
   */
  static getOnboardingState(user: User): OnboardingState {
    const userType = this.determineUserType(user);
    const storedState = this.getStoredState(user.id);
    
    // Prüfe ob täglicher Reset für Beta-User erforderlich ist
    if (userType === 'beta' && this.shouldShowDailyOnboarding(user.id)) {
      return {
        needsOnboarding: true,
        reason: 'Beta-User tägliches Onboarding',
        userType,
        completedSteps: storedState?.completedSteps || []
      };
    }

    // Prüfe ob User bereits Onboarding abgeschlossen hat
    if (storedState?.completedSteps?.length > 0) {
      return {
        needsOnboarding: false,
        reason: 'Onboarding bereits abgeschlossen',
        userType,
        completedSteps: storedState.completedSteps
      };
    }

    // Neue User oder User ohne abgeschlossenes Onboarding
    return {
      needsOnboarding: true,
      reason: userType === 'beta' ? 'Beta-User Onboarding' : 'Neuer User Onboarding',
      userType,
      completedSteps: []
    };
  }

  /**
   * Bestimmt den User-Typ basierend auf User-Daten
   */
  private static determineUserType(user: User): 'beta' | 'new' {
    // Prüfe auf Beta-Indikatoren
    const email = user.email.toLowerCase();
    const userType = user.user_type?.toLowerCase();
    const subscription = user.subscription_plan?.toLowerCase();

    const isBetaUser = 
      this.BETA_USER_INDICATORS.some(indicator => 
        email.includes(indicator) || 
        userType?.includes(indicator) || 
        subscription?.includes(indicator)
      );

    // Prüfe auf frühe Registrierung (erste 1000 User)
    const userId = user.id;
    const isEarlyUser = userId <= 1000;

    // Prüfe auf spezielle Rollen
    const hasSpecialRole = user.user_role === 'beta_tester' || user.user_role === 'early_access';

    if (isBetaUser || isEarlyUser || hasSpecialRole) {
      return 'beta';
    }

    return 'new';
  }

  /**
   * Prüft ob tägliches Onboarding für Beta-User angezeigt werden soll
   */
  private static shouldShowDailyOnboarding(userId: number): boolean {
    const lastReset = localStorage.getItem(`${this.DAILY_RESET_KEY}_${userId}`);
    const today = new Date().toDateString();

    if (lastReset !== today) {
      // Setze täglichen Reset
      localStorage.setItem(`${this.DAILY_RESET_KEY}_${userId}`, today);
      return true;
    }

    return false;
  }

  /**
   * Speichert den Onboarding-Status
   */
  static saveOnboardingState(userId: number, state: Partial<OnboardingState>): void {
    const currentState = this.getStoredState(userId);
    const updatedState = {
      ...currentState,
      ...state,
      lastShown: new Date().toISOString()
    };

    localStorage.setItem(`${this.STORAGE_KEY}_${userId}`, JSON.stringify(updatedState));
  }

  /**
   * Lädt den gespeicherten Onboarding-Status
   */
  private static getStoredState(userId: number): OnboardingState | null {
    try {
      const stored = localStorage.getItem(`${this.STORAGE_KEY}_${userId}`);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error('Fehler beim Laden des Onboarding-Status:', error);
      return null;
    }
  }

  /**
   * Markiert einen Onboarding-Schritt als abgeschlossen
   */
  static markStepCompleted(userId: number, stepId: string): void {
    const currentState = this.getStoredState(userId);
    const completedSteps = currentState?.completedSteps || [];
    
    if (!completedSteps.includes(stepId)) {
      completedSteps.push(stepId);
      this.saveOnboardingState(userId, { completedSteps });
    }
  }

  /**
   * Markiert das gesamte Onboarding als abgeschlossen
   */
  static markOnboardingCompleted(userId: number, userType: 'beta' | 'new'): void {
    this.saveOnboardingState(userId, {
      needsOnboarding: false,
      reason: 'Onboarding abgeschlossen',
      userType,
      completedSteps: ['completed']
    });
  }

  /**
   * Setzt das Onboarding für einen User zurück
   */
  static resetOnboarding(userId: number): void {
    localStorage.removeItem(`${this.STORAGE_KEY}_${userId}`);
    localStorage.removeItem(`${this.DAILY_RESET_KEY}_${userId}`);
  }

  /**
   * Debug-Informationen für Entwickler
   */
  static getDebugInfo(user: User): any {
    const userType = this.determineUserType(user);
    const storedState = this.getStoredState(user.id);
    const needsDailyReset = this.shouldShowDailyOnboarding(user.id);

    return {
      userId: user.id,
      email: user.email,
      userType,
      userRole: user.user_role,
      subscriptionPlan: user.subscription_plan,
      storedState,
      needsDailyReset,
      isBetaUser: userType === 'beta',
      onboardingState: this.getOnboardingState(user)
    };
  }

  /**
   * Statistiken für das Onboarding
   */
  static getOnboardingStats(): any {
    const stats = {
      totalUsers: 0,
      betaUsers: 0,
      newUsers: 0,
      completedOnboardings: 0,
      dailyOnboardings: 0
    };

    // Durchsuche localStorage nach Onboarding-Daten
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(this.STORAGE_KEY)) {
        try {
          const data = JSON.parse(localStorage.getItem(key) || '{}');
          stats.totalUsers++;
          
          if (data.userType === 'beta') {
            stats.betaUsers++;
          } else {
            stats.newUsers++;
          }

          if (data.completedSteps?.includes('completed')) {
            stats.completedOnboardings++;
          }
        } catch (error) {
          console.error('Fehler beim Parsen der Onboarding-Statistiken:', error);
        }
      }
    }

    return stats;
  }
}

export default OnboardingManager; 