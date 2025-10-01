import React, { cloneElement, ReactElement } from 'react';
import { useOnboarding } from '../../context/OnboardingContext';

interface DisableableButtonProps {
  children: ReactElement;
  disabled?: boolean;
  disableOnTour?: boolean;
  allowedDuringTour?: boolean;
  className?: string;
}

export function DisableableButton({ 
  children, 
  disabled = false, 
  disableOnTour = true,
  allowedDuringTour = false,
  className = '' 
}: DisableableButtonProps) {
  const { shouldDisableUI, showTour } = useOnboarding();
  
  // Determine if button should be disabled
  const isDisabled = disabled || (disableOnTour && shouldDisableUI && !allowedDuringTour);
  
  // Add disabled state styling
  const disabledClasses = isDisabled 
    ? 'opacity-50 cursor-not-allowed pointer-events-none' 
    : '';
  
  // Clone the child element and add our properties
  return cloneElement(children as React.ReactElement<any>, {
    disabled: isDisabled,
    className: `${(children as any).props.className || ''} ${disabledClasses} ${className}`.trim(),
    onClick: isDisabled ? undefined : (children as any).props.onClick,
    onPointerDown: isDisabled ? undefined : (children as any).props.onPointerDown,
    onMouseDown: isDisabled ? undefined : (children as any).props.onMouseDown,
    'aria-disabled': isDisabled,
    title: isDisabled && shouldDisableUI 
      ? 'Funktion während der geführten Tour nicht verfügbar' 
      : (children as any).props.title
  });
}

export default DisableableButton;