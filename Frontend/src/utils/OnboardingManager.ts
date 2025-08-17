/**
 * OnboardingManager - Intelligente Erstbenutzer-Erkennung und Onboarding-Flow
 */

export const OnboardingStep = {
  NOT_STARTED: 0,
  WELCOME: 1,
  ROLE_SELECTION: 2,
  SUBSCRIPTION_PLAN: 3,  // Nur für Bauträger
  PROFILE_SETUP: 4,      // Nur für Dienstleister
  COMPLETED: 999
} as const;

export type OnboardingStep = typeof OnboardingStep[keyof typeof OnboardingStep];

export interface OnboardingState {
  needsOnboarding: boolean;
  currentStep: OnboardingStep;
  isFirstTimeUser: boolean;
  reason: string;
}

export interface User {
  id: number;
  email: string;
  user_role?: string | null;
  role_selected: boolean;
  role_selection_modal_shown?: boolean; // Neues Flag für Modal-Anzeige
  first_login_completed: boolean;
  onboarding_completed: boolean;
  onboarding_step: number;
  subscription_plan?: string;
  user_type?: string;
  created_at?: string; // Hinzugefügt für neue User-Erkennung
  consent_fields?: Record<string, any> | null;
  company_name?: string | null; // Firmenname
  company_address?: string | null; // Firmenadresse
}

export class OnboardingManager {
  
  /**
   * Hauptfunktion: Bestimmt ob User Onboarding benötigt
   */
  static shouldShowOnboarding(user: User): boolean {
    const state = this.getOnboardingState(user);
    return state.needsOnboarding;
  }

  /**
   * Prüft ob User wirklich neu ist (innerhalb der letzten 24 Stunden erstellt)
   */
  static isNewUser(user: User): boolean {
    if (!user.created_at) return false;
    
    const createdAt = new Date(user.created_at);
    const now = new Date();
    const hoursSinceCreation = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
    
    // User ist "neu" wenn er in den letzten 24 Stunden erstellt wurde
    return hoursSinceCreation < 24;
  }

  /**
   * Analysiert den Onboarding-Status eines Users
   */
  static getOnboardingState(user: User): OnboardingState {
    // WICHTIG: Prüfe zuerst, ob User bereits vollständig konfiguriert ist
    // (unabhängig vom onboarding_completed Flag)
    if (user.role_selected && user.user_role && user.subscription_plan) {
      return {
        needsOnboarding: false,
        currentStep: OnboardingStep.COMPLETED,
        isFirstTimeUser: false,
        reason: "User vollständig konfiguriert - kein Onboarding erforderlich"
      };
    }

    // 1. Höchste Priorität: Modal bereits angezeigt - kein erneutes Onboarding
    if (user.role_selection_modal_shown && user.role_selected && user.user_role) {
      return {
        needsOnboarding: false,
        currentStep: OnboardingStep.COMPLETED,
        isFirstTimeUser: false,
        reason: "Rollenauswahl-Modal bereits angezeigt - kein erneutes Onboarding"
      };
    }

    // 2. Zweite Priorität: Wirklich neue User (basierend auf created_at)
    const isNewUser = this.isNewUser(user);
    
    if (isNewUser && (!user.role_selected || !user.user_role)) {
      return {
        needsOnboarding: true,
        currentStep: OnboardingStep.ROLE_SELECTION,
        isFirstTimeUser: true,
        reason: "Neuer User - Rollenauswahl erforderlich"
      };
    }

    // 3. Dritte Priorität: Alte User ohne Rolle (Edge-Case - sollte nicht passieren)
    if (!isNewUser && !user.role_selected && !user.user_role && !user.role_selection_modal_shown) {
      return {
        needsOnboarding: true,
        currentStep: OnboardingStep.ROLE_SELECTION,
        isFirstTimeUser: false,
        reason: "Keine Rolle ausgewählt - Rollenauswahl erforderlich"
      };
    }

    // 3b. Dashboard-Tour prüfen: Wenn Rolle existiert, aber Tour nicht abgeschlossen → Tour zeigen
    const tourCompleted = !!(user.consent_fields && user.consent_fields.dashboard_tour && user.consent_fields.dashboard_tour.completed);
    if (user.role_selected && user.user_role && !tourCompleted) {
      return {
        needsOnboarding: true,
        currentStep: OnboardingStep.COMPLETED,
        isFirstTimeUser: true,
        reason: 'Dashboard-Tour noch nicht abgeschlossen'
      };
    }

    // 4. Explizit abgeschlossenes Onboarding
    if (user.onboarding_completed) {
      return {
        needsOnboarding: false,
        currentStep: OnboardingStep.COMPLETED,
        isFirstTimeUser: false,
        reason: "Onboarding bereits abgeschlossen"
      };
    }

    // 5. Admin-User: Kein Onboarding
    if (user.user_role === 'ADMIN') {
      return {
        needsOnboarding: false,
        currentStep: OnboardingStep.COMPLETED,
        isFirstTimeUser: false,
        reason: "Admin-User - kein Onboarding erforderlich"
      };
    }

    // 6. Fallback: Wenn alles andere fehlschlägt, prüfe aktuellen Schritt
    const step = this.determineCurrentStep(user);
    if (step === OnboardingStep.COMPLETED) {
      return {
        needsOnboarding: false,
        currentStep: OnboardingStep.COMPLETED,
        isFirstTimeUser: false,
        reason: "Onboarding-Schritte vollständig"
      };
    }

    // 7. Letzter Fallback: Onboarding erforderlich
    return {
      needsOnboarding: true,
      currentStep: step,
      isFirstTimeUser: false,
      reason: `Onboarding unvollständig - Schritt ${step} erforderlich`
    };
  }

  /**
   * Bestimmt den aktuellen Onboarding-Schritt basierend auf User-Daten
   */
  static determineCurrentStep(user: User): OnboardingStep {
    // Prüfe zuerst, ob alles bereits abgeschlossen ist
    if (user.onboarding_completed) {
      return OnboardingStep.COMPLETED;
    }

    // Prüfe ob User bereits vollständig konfiguriert ist (auch ohne explizites onboarding_completed)
    if (user.role_selected && user.user_role) {
      // Bauträger mit Subscription-Plan = fertig
      if (user.user_role === 'BAUTRAEGER' && user.subscription_plan) {
        return OnboardingStep.COMPLETED;
      }
      
      // Dienstleister mit abgeschlossenem Profil-Setup = fertig
      if (user.user_role === 'DIENSTLEISTER' && user.onboarding_step >= 4) {
        return OnboardingStep.COMPLETED;
      }
    }

    // Noch kein erster Login
    if (!user.first_login_completed) {
      return OnboardingStep.WELCOME;
    }

    // Keine Rolle ausgewählt
    if (!user.role_selected && !user.user_role) {
      return OnboardingStep.ROLE_SELECTION;
    }

    // Bauträger ohne Subscription-Plan
    if (user.user_role === 'BAUTRAEGER' && !user.subscription_plan) {
      return OnboardingStep.SUBSCRIPTION_PLAN;
    }

    // Dienstleister ohne Profil-Setup (basierend auf onboarding_step)
    if (user.user_role === 'DIENSTLEISTER' && user.onboarding_step < 4) {
      return OnboardingStep.PROFILE_SETUP;
    }

    // Fallback: Alles scheint fertig zu sein
    return OnboardingStep.COMPLETED;
  }

  /**
   * Bestimmt den nächsten Schritt nach Rollenauswahl
   */
  static getNextStepAfterRole(role: string): OnboardingStep {
    switch (role) {
      case 'BAUTRAEGER':
      case 'bautraeger':
        return OnboardingStep.SUBSCRIPTION_PLAN;
      case 'DIENSTLEISTER':
      case 'dienstleister':
        return OnboardingStep.PROFILE_SETUP;
      default:
        return OnboardingStep.COMPLETED;
    }
  }

  /**
   * Prüft ob User ein Erstbenutzer ist (verschiedene Kriterien)
   */
  static isFirstTimeUser(user: User): boolean {
    return (
      !user.first_login_completed ||
      (!user.role_selected && !user.user_role) ||
      !user.onboarding_completed
    );
  }

  /**
   * Prüft ob die Dashboard-Tour gestartet werden kann
   * Die Tour wird nur gestartet, wenn alle vorherigen Onboarding-Schritte abgeschlossen sind
   */
  static canStartDashboardTour(user: User): boolean {
    // Grundvoraussetzungen prüfen
    if (!user.role_selected || !user.user_role) {
      return false; // Rolle muss ausgewählt sein
    }

    // Prüfe ob noch andere Onboarding-Modals aktiv sind
    const state = this.getOnboardingState(user);
    if (state.needsOnboarding && state.currentStep !== OnboardingStep.COMPLETED) {
      return false; // Andere Onboarding-Schritte haben Vorrang
    }

    // Prüfe ob Tour bereits abgeschlossen wurde
    const tourCompleted = !!(user.consent_fields && user.consent_fields.dashboard_tour && user.consent_fields.dashboard_tour.completed);
    if (tourCompleted) {
      return false; // Tour bereits abgeschlossen
    }

    // Tour kann gestartet werden
    return true;
  }

  /**
   * Generiert Debug-Informationen für Entwicklung
   */
  static getDebugInfo(user: User): object {
    const state = this.getOnboardingState(user);
    
    return {
      userId: user.id,
      email: user.email,
      onboardingState: state,
      userFlags: {
        first_login_completed: user.first_login_completed,
        role_selected: user.role_selected,
        onboarding_completed: user.onboarding_completed,
        onboarding_step: user.onboarding_step,
        user_role: user.user_role,
        user_type: user.user_type,
        subscription_plan: user.subscription_plan
      },
      recommendations: this.getRecommendations(user)
    };
  }

  /**
   * Gibt Empfehlungen für den aktuellen User-Status
   */
  static getRecommendations(user: User): string[] {
    const recommendations: string[] = [];
    const state = this.getOnboardingState(user);

    if (state.needsOnboarding) {
      const stepName = Object.keys(OnboardingStep).find(key => 
        OnboardingStep[key as keyof typeof OnboardingStep] === state.currentStep
      );
      recommendations.push(`Zeige Onboarding-Schritt: ${stepName || state.currentStep}`);
    }

    if (state.isFirstTimeUser) {
      recommendations.push("Vollständiger Willkommen-Flow erforderlich");
    }

    if (!user.first_login_completed) {
      recommendations.push("Markiere ersten Login als abgeschlossen");
    }

    if (!user.onboarding_completed && user.role_selected) {
      recommendations.push("Schließe Onboarding-Prozess ab");
    }

    return recommendations;
  }
}

/**
 * Onboarding-Storage für persistente Zustandsspeicherung
 */
export class OnboardingStorage {
  
  static saveOnboardingState(userId: number, state: OnboardingState): void {
    try {
      const key = `onboarding_${userId}`;
      const data = {
        ...state,
        timestamp: Date.now(),
        version: '1.0'
      };
      localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.warn('Fehler beim Speichern des Onboarding-Status:', error);
    }
  }

  static getOnboardingState(userId: number): OnboardingState | null {
    try {
      const key = `onboarding_${userId}`;
      const stored = localStorage.getItem(key);
      
      if (!stored) return null;
      
      const data = JSON.parse(stored);
      
      // Prüfe Alter der Daten (max. 24h)
      const maxAge = 24 * 60 * 60 * 1000; // 24 Stunden
      if (Date.now() - data.timestamp > maxAge) {
        localStorage.removeItem(key);
        return null;
      }
      
      return {
        needsOnboarding: data.needsOnboarding,
        currentStep: data.currentStep,
        isFirstTimeUser: data.isFirstTimeUser,
        reason: data.reason
      };
      
    } catch (error) {
      console.warn('Fehler beim Laden des Onboarding-Status:', error);
      return null;
    }
  }

  static clearOnboardingState(userId: number): void {
    try {
      const key = `onboarding_${userId}`;
      localStorage.removeItem(key);
    } catch (error) {
      console.warn('Fehler beim Löschen des Onboarding-Status:', error);
    }
  }
} 
