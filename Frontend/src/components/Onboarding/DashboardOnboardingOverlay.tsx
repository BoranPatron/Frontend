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
    discoveredFeatures,
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

    // Additional check: Poll for mount features that might already exist or appear shortly
    // This catches cases where MutationObserver misses the addition or element exists before observer starts
    const pollInterval = setInterval(() => {
      features.forEach(feature => {
        if (feature.triggerOn === 'mount' && !processedMountFeaturesRef.current.has(feature.id)) {
          const element = document.querySelector(`[data-feature-id="${feature.id}"]`) as HTMLElement;
          if (element) {
            const shouldShow = shouldShowTooltip(feature.id);
            console.log(`🔄 Poll check for ${feature.id}:`, {
              elementFound: !!element,
              shouldShow,
              isVisible: element.offsetParent !== null || element.getBoundingClientRect().width > 0,
              processed: processedMountFeaturesRef.current.has(feature.id)
            });
            
            if (shouldShow) {
              console.log(`🔄 Poll check found mount element: ${feature.id}`);
              triggerMountForFeature(feature.id, feature);
            }
          }
        }
      });
    }, 1000); // Check every second

    // Also do an immediate check for already-existing mount elements
    setTimeout(() => {
      features.forEach(feature => {
        if (feature.triggerOn === 'mount' && !processedMountFeaturesRef.current.has(feature.id)) {
          const element = document.querySelector(`[data-feature-id="${feature.id}"]`) as HTMLElement;
          if (element) {
            const shouldShow = shouldShowTooltip(feature.id);
            console.log(`🔍 Immediate check for ${feature.id}:`, {
              elementFound: !!element,
              shouldShow,
              isVisible: element.offsetParent !== null || element.getBoundingClientRect().width > 0
            });
            
            if (shouldShow) {
              console.log(`🔍 Immediate check found mount element: ${feature.id}`);
              triggerMountForFeature(feature.id, feature);
            }
          }
        }
      });
    }, 100);

    // Cleanup
    return () => {
      handlersMap.forEach(({ element, handler, event }) => {
        element.removeEventListener(event, handler);
      });
      observer.disconnect();
      clearInterval(pollInterval);
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

  // Calculate current step based on priority
  // Step number should reflect priority ordering (not discovery order)
  const getCurrentStep = (feature: typeof activeFeature): number => {
    if (!feature) return discoveredCount;
    
    // Get all features for the same role, sorted by priority
    const roleFeatures = features
      .filter(f => f.userRole === feature.userRole)
      .sort((a, b) => a.priority - b.priority);
    
    // Count discovered features with priority less than current feature
    let discoveredLowerPriority = 0;
    for (const f of roleFeatures) {
      if (f.priority < feature.priority && discoveredFeatures.has(f.id)) {
        discoveredLowerPriority++;
      }
    }
    
    // If all lower priority features are discovered, use priority as step
    // Otherwise, use discovered count + 1
    const allLowerPriorityDiscovered = discoveredLowerPriority === (feature.priority - 1);
    
    if (allLowerPriorityDiscovered) {
      // Use priority as step number
      return feature.priority;
    } else {
      // Use discovery count (fallback if features not discovered in order)
      return discoveredCount + 1;
    }
  };

  // Debug active tooltip
  useEffect(() => {
    if (activeTooltip) {
      const currentStep = getCurrentStep(activeFeature || undefined);
      console.log('🎨 Active tooltip:', {
        id: activeTooltip,
        feature: activeFeature?.title,
        priority: activeFeature?.priority,
        currentStep,
        totalSteps: totalFeatures,
        elementFound: !!activeElement
      });
    }
  }, [activeTooltip, activeFeature, activeElement, discoveredFeatures, features, totalFeatures]);

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
          currentStep={getCurrentStep(activeFeature)}
          totalSteps={totalFeatures}
          isVisible={true}
        />
      )}
    </>
  );
}

