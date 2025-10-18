import { useState, useCallback } from 'react';
import { acceptQuote } from '../api/quoteService';

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

interface CreditAdditionState {
  isVisible: boolean;
  creditAmount: number;
  eventType: 'quote_accepted' | 'inspection_quote_accepted' | 'project_completed' | 'provider_review' | 'milestone_completed' | 'registration_bonus' | 'referral_bonus' | 'loyalty_bonus';
  providerName?: string;
}

export const useCreditAdditionAnimation = () => {
  const [creditAnimation, setCreditAnimation] = useState<CreditAdditionState>({
    isVisible: false,
    creditAmount: 0,
    eventType: 'quote_accepted'
  });

  const showCreditAnimation = useCallback((
    creditAmount: number,
    eventType: CreditAdditionState['eventType'],
    providerName?: string
  ) => {
    console.log('🎨 showCreditAnimation aufgerufen:', { creditAmount, eventType, providerName });
    setCreditAnimation({
      isVisible: true,
      creditAmount,
      eventType,
      providerName
    });
    console.log('🎨 Animation-State gesetzt auf:', { isVisible: true, creditAmount, eventType, providerName });
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
      console.log('🎯 acceptQuoteWithAnimation aufgerufen:', { quoteId, providerName, isInspectionQuote });
      
      // Akzeptiere das Angebot
      const acceptedQuote = await acceptQuote(quoteId);
      console.log('✅ Angebot erfolgreich angenommen:', acceptedQuote);
      
      // Bestimme Event-Typ und Credit-Menge basierend auf Konfiguration
      const eventType = isInspectionQuote ? 'inspection_quote_accepted' : 'quote_accepted';
      const creditAmount = CREDIT_CONFIG[eventType];
      
      console.log('🎨 Zeige Animation:', { eventType, creditAmount, providerName });
      
      // Zeige Animation
      showCreditAnimation(creditAmount, eventType, providerName);
      
      return acceptedQuote;
    } catch (error) {
      console.error('❌ Fehler beim Annehmen des Angebots:', error);
      throw error;
    }
  }, [showCreditAnimation]);

  return {
    creditAnimation,
    showCreditAnimation,
    hideCreditAnimation,
    acceptQuoteWithAnimation
  };
};
