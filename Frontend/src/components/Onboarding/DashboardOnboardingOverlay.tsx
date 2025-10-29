/**
 * DashboardOnboardingOverlay - Verwaltet alle Tooltips und Hotspots für das Dashboard
 * Wird als Overlay-Layer über dem Dashboard gerendert
 */

import React, { useEffect, useRef } from 'react';
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

  // Use ref to persist processedMountFeatures across re-renders
  const processedMountFeaturesRef = useRef<Set<string>>(new Set());

  // Debug: Log overlay mount
  useEffect(() => {
    console.log('🏗️ DashboardOnboardingOverlay mounted:', {
      totalFeatures: features.length,
      discoveredCount,
      activeTooltip,
      features: features.map(f => f.id)
    });
  }, []);

  // Debug: Log when features change
  useEffect(() => {
    console.log('📊 Onboarding state update:', {
      totalFeatures: features.length,
      discoveredCount,
      progress: `${discoveredCount}/${features.length}`,
      activeTooltip
    });
  }, [features.length, discoveredCount, activeTooltip]);

  // Helper function to trigger mount for a feature
  const triggerMountForFeature = (featureId: string, feature: any) => {
    console.log(`🔍 Checking mount trigger for: ${featureId}`, {
      shouldShow: shouldShowTooltip(featureId),
      alreadyProcessed: processedMountFeaturesRef.current.has(featureId),
      discoveredCount,
      totalFeatures
    });

    if (!shouldShowTooltip(featureId)) {
      console.log(`ℹ️ Feature ${featureId} already discovered, skipping mount trigger`);
      return;
    }

    if (processedMountFeaturesRef.current.has(featureId)) {
      console.log(`⚠️ Feature ${featureId} already processed, skipping to prevent duplicate trigger`);
      return;
    }

    processedMountFeaturesRef.current.add(featureId);

    const delay = feature.delay || 0;
    console.log(`⏱️ Scheduling mount trigger for ${featureId} with delay: ${delay}ms`);
    
    setTimeout(() => {
      // Check again after delay - might have been discovered in the meantime
      if (shouldShowTooltip(featureId)) {
        console.log(`🚀 Triggering mount for feature: ${featureId}`);
        showFeatureTooltip(featureId);
      } else {
        console.log(`⚠️ Feature ${featureId} was discovered during delay, not showing tooltip`);
      }
    }, delay);
  };

  // Setup event listeners for all features
  useEffect(() => {
    const handlersMap: Map<string, {element: HTMLElement, handler: () => void, event: string}> = new Map();

    console.log('🔧 Setting up event listeners for features:', features.map(f => ({ id: f.id, triggerOn: f.triggerOn })));

    // Function to process a feature and set up its trigger
    const setupFeatureTrigger = (feature: any, element: HTMLElement) => {
      if (!shouldShowTooltip(feature.id)) {
        console.log(`ℹ️ Feature ${feature.id} already discovered, skipping`);
        return;
      }

      console.log(`✅ Setting up listener for: ${feature.id} (trigger: ${feature.triggerOn})`);
      
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
          // For mount features, trigger immediately if element exists
          // Otherwise, MutationObserver will catch it when it appears later
          if (!processedMountFeaturesRef.current.has(feature.id)) {
            console.log(`📌 Mount feature found with element: ${feature.id}`);
            triggerMountForFeature(feature.id, feature);
          } else {
            console.log(`⏭️ Mount feature ${feature.id} already processed, skipping initial trigger`);
          }
          break;
      }
    };

    // Process all features for initially existing elements
    features.forEach(feature => {
      const element = document.querySelector(`[data-feature-id="${feature.id}"]`) as HTMLElement;
      
      if (!element) {
        console.warn(`⚠️ Element not found for feature: ${feature.id}`);
        return;
      }
      
      setupFeatureTrigger(feature, element);
    });

    // MutationObserver to watch for new elements appearing in the DOM
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as HTMLElement;
            
            // Check if this element has a data-feature-id
            const featureId = element.getAttribute('data-feature-id');
            if (featureId) {
              const feature = features.find(f => f.id === featureId);
              if (feature && feature.triggerOn === 'mount') {
                console.log(`🔍 New mount element detected in DOM: ${featureId}`, {
                  alreadyProcessed: processedMountFeaturesRef.current.has(featureId),
                  shouldShow: shouldShowTooltip(featureId),
                  element: element
                });
                if (!processedMountFeaturesRef.current.has(featureId)) {
                  triggerMountForFeature(featureId, feature);
                } else {
                  console.log(`⏭️ Feature ${featureId} was already processed, skipping`);
                }
              }
            }
            
            // Also check children for data-feature-id
            const childrenWithFeatureId = element.querySelectorAll('[data-feature-id]');
            childrenWithFeatureId.forEach((child) => {
              const childFeatureId = child.getAttribute('data-feature-id');
              if (childFeatureId) {
                const feature = features.find(f => f.id === childFeatureId);
                if (feature && feature.triggerOn === 'mount') {
                  console.log(`🔍 New mount element detected (child) in DOM: ${childFeatureId}`, {
                    alreadyProcessed: processedMountFeaturesRef.current.has(childFeatureId),
                    shouldShow: shouldShowTooltip(childFeatureId)
                  });
                  if (!processedMountFeaturesRef.current.has(childFeatureId)) {
                    triggerMountForFeature(childFeatureId, feature);
                  } else {
                    console.log(`⏭️ Feature ${childFeatureId} was already processed, skipping`);
                  }
                }
              }
            });
          }
        });
      });
    });

    // Start observing the document body for changes
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    // Cleanup
    return () => {
      handlersMap.forEach(({ element, handler, event }) => {
        element.removeEventListener(event, handler);
      });
      observer.disconnect();
    };
  }, [features, shouldShowTooltip, showFeatureTooltip]);

  // Render hotspots for all undiscovered features
  const hotspots = features.filter(f => f.showHotspot && shouldShowHotspot(f.id)).map(feature => {
    const element = document.querySelector(`[data-feature-id="${feature.id}"]`) as HTMLElement;
    if (!element) {
      console.warn(`⚠️ Hotspot target not found: ${feature.id}`);
      return null;
    }
    
    console.log(`🔆 Rendering hotspot for: ${feature.id}`);

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

  // Debug active tooltip
  useEffect(() => {
    if (activeTooltip) {
      console.log('🎨 Active tooltip:', {
        id: activeTooltip,
        feature: activeFeature?.title,
        elementFound: !!activeElement
      });
    }
  }, [activeTooltip, activeFeature, activeElement]);

  return (
    <>
      {/* Hotspots */}
      {hotspots.length > 0 && console.log(`🔆 Rendering ${hotspots.length} hotspots`)}
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

