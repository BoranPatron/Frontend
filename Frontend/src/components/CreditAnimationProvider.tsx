import React from 'react';
import CreditAdditionAnimation from '../components/CreditAdditionAnimation';
import SimpleCreditAnimation from '../components/SimpleCreditAnimation';
import { useCreditAdditionAnimation } from '../hooks/useCreditAdditionAnimation';

interface CreditAnimationProviderProps {
  children: React.ReactNode;
}

export const CreditAnimationProvider: React.FC<CreditAnimationProviderProps> = ({ children }) => {
  const { creditAnimation, hideCreditAnimation } = useCreditAdditionAnimation();

  console.log('🎭 CreditAnimationProvider render:', { 
    isVisible: creditAnimation.isVisible, 
    creditAmount: creditAnimation.creditAmount,
    eventType: creditAnimation.eventType,
    providerName: creditAnimation.providerName
  });

  return (
    <>
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
    </>
  );
};

// Export des Hooks für die Verwendung in anderen Komponenten
export { useCreditAdditionAnimation };
