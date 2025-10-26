/**
 * DashboardOnboardingOverlay - Verwaltet alle Tooltips und Hotspots für das Dashboard
 * Wird als Overlay-Layer über dem Dashboard gerendert
 */

import React, { useEffect } from 'react';
import { useContextualOnboarding } from '../../context/ContextualOnboardingContext';
import ContextualTooltip from './ContextualTooltip';
import InteractiveHotspot from './InteractiveHotspot';

export default function DashboardOnboardingOverlay() {
  const {
    features,
    shouldShowHotspot,
    shouldShowTooltip,
    showFeatureTooltip,
    hideFeatureTooltip,
    dismissFeatureForever,
    activeTooltip,
    discoveredCount,
    totalFeatures
  } = useContextualOnboarding();

  // Setup event listeners for all features
  useEffect(() => {
    const handlersMap: Map<string, {element: HTMLElement, handler: () => void, event: string}> = new Map();

    features.forEach(feature => {
      const element = document.querySelector(`[data-feature-id="${feature.id}"]`) as HTMLElement;
      if (!element || !shouldShowTooltip(feature.id)) return;

      const triggerType = feature.triggerOn || 'hover';
      const delay = feature.delay || 0;

      let handler: (() => void) | null = null;

      switch (triggerType) {
        case 'hover':
          handler = () => {
            setTimeout(() => {
              if (shouldShowTooltip(feature.id)) {
                showFeatureTooltip(feature.id);
              }
            }, delay);
          };
          element.addEventListener('mouseenter', handler);
          handlersMap.set(feature.id, { element, handler, event: 'mouseenter' });
          break;

        case 'click':
          handler = () => {
            setTimeout(() => {
              if (shouldShowTooltip(feature.id)) {
                showFeatureTooltip(feature.id);
              }
            }, delay);
          };
          element.addEventListener('click', handler, { once: true });
          handlersMap.set(feature.id, { element, handler, event: 'click' });
          break;

        case 'focus':
          handler = () => {
            setTimeout(() => {
              if (shouldShowTooltip(feature.id)) {
                showFeatureTooltip(feature.id);
              }
            }, delay);
          };
          element.addEventListener('focus', handler);
          handlersMap.set(feature.id, { element, handler, event: 'focus' });
          break;

        case 'mount':
          // Trigger on mount with delay
          setTimeout(() => {
            if (shouldShowTooltip(feature.id)) {
              showFeatureTooltip(feature.id);
            }
          }, delay);
          break;
      }
    });

    // Cleanup
    return () => {
      handlersMap.forEach(({ element, handler, event }) => {
        element.removeEventListener(event, handler);
      });
    };
  }, [features, shouldShowTooltip, showFeatureTooltip]);

  // Render hotspots for all undiscovered features
  const hotspots = features.filter(f => f.showHotspot && shouldShowHotspot(f.id)).map(feature => {
    const element = document.querySelector(`[data-feature-id="${feature.id}"]`) as HTMLElement;
    if (!element) return null;

    return (
      <InteractiveHotspot
        key={feature.id}
        targetElement={element}
        isVisible={true}
      />
    );
  }).filter(Boolean);

  // Render active tooltip
  const activeFeature = features.find(f => f.id === activeTooltip);
  const activeElement = activeTooltip 
    ? document.querySelector(`[data-feature-id="${activeTooltip}"]`) as HTMLElement
    : null;

  return (
    <>
      {/* Hotspots */}
      {hotspots}

      {/* Active Tooltip */}
      {activeFeature && activeElement && (
        <ContextualTooltip
          id={activeFeature.id}
          title={activeFeature.title}
          description={activeFeature.description}
          targetElement={activeElement}
          placement={activeFeature.placement}
          onDismiss={hideFeatureTooltip}
          onDismissForever={() => dismissFeatureForever(activeFeature.id)}
          showProgress={true}
          currentStep={discoveredCount}
          totalSteps={totalFeatures}
          isVisible={true}
        />
      )}
    </>
  );
}

