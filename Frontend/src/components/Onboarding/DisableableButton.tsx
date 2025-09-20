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
  return cloneElement(children, {
    disabled: isDisabled,
    className: `${children.props.className || ''} ${disabledClasses} ${className}`.trim(),
    onClick: isDisabled ? undefined : children.props.onClick,
    onPointerDown: isDisabled ? undefined : children.props.onPointerDown,
    onMouseDown: isDisabled ? undefined : children.props.onMouseDown,
    'aria-disabled': isDisabled,
    title: isDisabled && shouldDisableUI 
      ? 'Funktion während der geführten Tour nicht verfügbar' 
      : children.props.title
  });
}

export default DisableableButton;