import React, { createContext, useContext, useState, useCallback } from 'react';
import { acceptQuote } from '../api/quoteService';
import { getCreditBalance } from '../api/creditService';
import CreditAdditionAnimation from '../components/CreditAdditionAnimation';

// Credit-Konfiguration (sollte mit dem Backend synchronisiert werden)
const CREDIT_CONFIG = {
  quote_accepted: 5,
  inspection_quote_accepted: 15,
  project_completed: 10,
  provider_review: 2,
  milestone_completed: 1,
  registration_bonus: 90,
  referral_bonus: 20,
  loyalty_bonus: 10
};

interface CreditAnimationState {
  isVisible: boolean;
  creditAmount: number;
  eventType: 'quote_accepted' | 'inspection_quote_accepted' | 'project_completed' | 'provider_review' | 'milestone_completed' | 'registration_bonus' | 'referral_bonus' | 'loyalty_bonus';
  providerName?: string;
}

interface CreditAnimationContextType {
  creditAnimation: CreditAnimationState;
  showCreditAnimation: (creditAmount: number, eventType: CreditAnimationState['eventType'], providerName?: string) => void;
  hideCreditAnimation: () => void;
  acceptQuoteWithAnimation: (quoteId: number, providerName?: string, isInspectionQuote?: boolean) => Promise<any>;
  checkAndShowProjectCompletionAnimation: (milestoneName?: string) => Promise<void>;
}

const CreditAnimationContext = createContext<CreditAnimationContextType | undefined>(undefined);

export const CreditAnimationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [creditAnimation, setCreditAnimation] = useState<CreditAnimationState>({
    isVisible: false,
    creditAmount: 0,
    eventType: 'quote_accepted'
  });

  const showCreditAnimation = useCallback((
    creditAmount: number,
    eventType: CreditAnimationState['eventType'],
    providerName?: string
  ) => {
    setCreditAnimation({
      isVisible: true,
      creditAmount,
      eventType,
      providerName
    });
  }, []);

  const hideCreditAnimation = useCallback(() => {
    setCreditAnimation(prev => ({
      ...prev,
      isVisible: false
    }));
  }, []);

  const acceptQuoteWithAnimation = useCallback(async (
    quoteId: number,
    providerName?: string,
    isInspectionQuote: boolean = false
  ) => {
    try {
      // Akzeptiere das Angebot
      const acceptedQuote = await acceptQuote(quoteId);
      
      // Warte kurz, damit das Backend die Credits verarbeitet
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Hole die aktualisierte Credit-Balance
      try {
        const balance = await getCreditBalance();
        
        // Trigger Credit-Balance Update Event für Navbar
        window.dispatchEvent(new CustomEvent('creditBalanceUpdated', { 
          detail: { credits: balance.credits } 
        }));
      } catch (error) {
        console.error('Fehler beim Laden der Credit-Balance:', error);
      }
      
      // Bestimme Event-Typ und Credit-Menge basierend auf Konfiguration
      const eventType = isInspectionQuote ? 'inspection_quote_accepted' : 'quote_accepted';
      const creditAmount = CREDIT_CONFIG[eventType];
      
      // Zeige Animation
      showCreditAnimation(creditAmount, eventType, providerName);
      
      return acceptedQuote;
    } catch (error) {
      console.error('Fehler beim Annehmen des Angebots:', error);
      throw error;
    }
  }, [showCreditAnimation]);

  const checkAndShowProjectCompletionAnimation = useCallback(async (milestoneName?: string) => {
    try {
      // Warte kurz, damit das Backend die Credits verarbeitet
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Hole die aktualisierte Credit-Balance
      const balance = await getCreditBalance();
      
      // Trigger Credit-Balance Update Event für Navbar
      window.dispatchEvent(new CustomEvent('creditBalanceUpdated', { 
        detail: { credits: balance.credits } 
      }));
      
      // Zeige Animation für Projekt-Abschluss
      const creditAmount = CREDIT_CONFIG.project_completed;
      showCreditAnimation(creditAmount, 'project_completed', milestoneName);
    } catch (error) {
      console.error('Fehler beim Laden der Credit-Balance nach Projekt-Abschluss:', error);
    }
  }, [showCreditAnimation]);

  return (
    <CreditAnimationContext.Provider value={{
      creditAnimation,
      showCreditAnimation,
      hideCreditAnimation,
      acceptQuoteWithAnimation,
      checkAndShowProjectCompletionAnimation
    }}>
      {children}
      {creditAnimation.isVisible && (
        <CreditAdditionAnimation
          isVisible={creditAnimation.isVisible}
          onComplete={hideCreditAnimation}
          creditAmount={creditAnimation.creditAmount}
          eventType={creditAnimation.eventType}
          providerName={creditAnimation.providerName}
        />
      )}
    </CreditAnimationContext.Provider>
  );
};

export const useCreditAdditionAnimation = () => {
  const context = useContext(CreditAnimationContext);
  if (context === undefined) {
    throw new Error('useCreditAdditionAnimation must be used within a CreditAnimationProvider');
  }
  return context;
};

