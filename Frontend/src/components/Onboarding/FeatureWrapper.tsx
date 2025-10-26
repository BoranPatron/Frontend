/**
 * FeatureWrapper - Wrapper-Component für Feature-Discovery
 * Zeigt Hotspots und Tooltips für UI-Elemente
 */

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useContextualOnboarding } from '../../context/ContextualOnboardingContext';
import ContextualTooltip from './ContextualTooltip';
import InteractiveHotspot from './InteractiveHotspot';
import { getFeatureById } from '../../utils/onboardingFeatures';

interface FeatureWrapperProps {
  featureId: string;
  children: React.ReactElement;
  disabled?: boolean;
}

export default function FeatureWrapper({ 
  featureId, 
  children,
  disabled = false 
}: FeatureWrapperProps) {
  const {
    shouldShowHotspot,
    shouldShowTooltip,
    showFeatureTooltip,
    hideFeatureTooltip,
    activeTooltip,
    discoveredCount,
    totalFeatures
  } = useContextualOnboarding();

  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null);
  const [hasInteracted, setHasInteracted] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const feature = getFeatureById(featureId);

  // Get reference to the child element
  useEffect(() => {
    const element = document.querySelector(`[data-feature-id="${featureId}"]`) as HTMLElement;
    if (element) {
      setTargetElement(element);
    }
  }, [featureId]);

  // Handle trigger based on feature config
  const handleTrigger = useCallback(() => {
    if (disabled || !feature || hasInteracted || !shouldShowTooltip(featureId)) return;

    setHasInteracted(true);

    const delay = feature.delay || 0;
    timeoutRef.current = setTimeout(() => {
      showFeatureTooltip(featureId);
    }, delay);
  }, [disabled, feature, featureId, hasInteracted, shouldShowTooltip, showFeatureTooltip]);

  // Setup event listeners based on trigger type
  useEffect(() => {
    if (!targetElement || disabled || !feature || !shouldShowTooltip(featureId)) return;

    const triggerType = feature.triggerOn || 'hover';

    let listener: (() => void) | null = null;

    switch (triggerType) {
      case 'hover':
        listener = () => handleTrigger();
        targetElement.addEventListener('mouseenter', listener);
        break;
      case 'click':
        listener = () => handleTrigger();
        targetElement.addEventListener('click', listener);
        break;
      case 'focus':
        listener = () => handleTrigger();
        targetElement.addEventListener('focus', listener);
        break;
      case 'mount':
        // Trigger on mount with delay
        handleTrigger();
        break;
    }

    return () => {
      if (listener && triggerType !== 'mount') {
        targetElement.removeEventListener(triggerType === 'hover' ? 'mouseenter' : triggerType, listener);
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [targetElement, disabled, feature, featureId, shouldShowTooltip, handleTrigger]);

  if (!feature || disabled) return children;

  const showHotspot = shouldShowHotspot(featureId);
  const showTooltip = activeTooltip === featureId;

  return (
    <>
      {children}
      
      {/* Hotspot indicator */}
      {showHotspot && targetElement && (
        <InteractiveHotspot
          targetElement={targetElement}
          isVisible={true}
        />
      )}
      
      {/* Contextual tooltip */}
      {showTooltip && targetElement && (
        <ContextualTooltip
          id={featureId}
          title={feature.title}
          description={feature.description}
          targetElement={targetElement}
          placement={feature.placement}
          onDismiss={hideFeatureTooltip}
          onDismissForever={() => {
            const { dismissFeatureForever } = require('../../context/ContextualOnboardingContext').useContextualOnboarding();
            dismissFeatureForever(featureId);
            hideFeatureTooltip();
          }}
          showProgress={true}
          currentStep={discoveredCount}
          totalSteps={totalFeatures}
          isVisible={true}
        />
      )}
    </>
  );
}

