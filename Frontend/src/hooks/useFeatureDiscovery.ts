/**
 * useFeatureDiscovery Hook
 * Verwaltet Feature-Discovery State und Interaktionen
 */

import { useState, useEffect, useCallback } from 'react';
import { OnboardingFeature } from '../utils/onboardingFeatures';

export interface FeatureDiscoveryState {
  discoveredFeatures: Set<string>;
  activeTooltip: string | null;
  shouldShowHotspot: (featureId: string) => boolean;
  shouldShowTooltip: (featureId: string) => boolean;
  markAsDiscovered: (featureId: string) => void;
  showTooltip: (featureId: string) => void;
  hideTooltip: () => void;
  dismissFeatureForever: (featureId: string) => void;
  resetDiscovery: () => void;
}

export function useFeatureDiscovery(
  userId: number | undefined,
  userRole: 'BAUTRAEGER' | 'DIENSTLEISTER' | null,
  features: OnboardingFeature[]
): FeatureDiscoveryState {
  const [discoveredFeatures, setDiscoveredFeatures] = useState<Set<string>>(new Set());
  const [dismissedForever, setDismissedForever] = useState<Set<string>>(new Set());
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);

  // Load from localStorage on mount
  useEffect(() => {
    if (!userId || !userRole) return;

    const storageKey = `feature_discovery_${userId}_${userRole}`;
    const dismissedKey = `feature_dismissed_${userId}_${userRole}`;
    
    try {
      const stored = localStorage.getItem(storageKey);
      const dismissed = localStorage.getItem(dismissedKey);
      
      if (stored) {
        const data = JSON.parse(stored);
        setDiscoveredFeatures(new Set(data.discovered || []));
      }
      
      if (dismissed) {
        const data = JSON.parse(dismissed);
        setDismissedForever(new Set(data.dismissed || []));
      }
    } catch (error) {
      console.warn('Failed to load feature discovery state:', error);
    }
  }, [userId, userRole]);

  // Save to localStorage when state changes
  useEffect(() => {
    if (!userId || !userRole) return;

    const storageKey = `feature_discovery_${userId}_${userRole}`;
    const dismissedKey = `feature_dismissed_${userId}_${userRole}`;
    
    try {
      localStorage.setItem(storageKey, JSON.stringify({
        discovered: Array.from(discoveredFeatures),
        timestamp: Date.now()
      }));
      
      localStorage.setItem(dismissedKey, JSON.stringify({
        dismissed: Array.from(dismissedForever),
        timestamp: Date.now()
      }));
    } catch (error) {
      console.warn('Failed to save feature discovery state:', error);
    }
  }, [discoveredFeatures, dismissedForever, userId, userRole]);

  const shouldShowHotspot = useCallback((featureId: string): boolean => {
    if (!userId || !userRole) return false;
    
    const feature = features.find(f => f.id === featureId);
    if (!feature || !feature.showHotspot) return false;
    
    return !discoveredFeatures.has(featureId) && !dismissedForever.has(featureId);
  }, [discoveredFeatures, dismissedForever, features, userId, userRole]);

  const shouldShowTooltip = useCallback((featureId: string): boolean => {
    if (!userId || !userRole) return false;
    
    return !discoveredFeatures.has(featureId) && !dismissedForever.has(featureId);
  }, [discoveredFeatures, dismissedForever, userId, userRole]);

  const markAsDiscovered = useCallback((featureId: string) => {
    setDiscoveredFeatures(prev => {
      const newSet = new Set(prev);
      newSet.add(featureId);
      return newSet;
    });
    
    // Hide tooltip when marking as discovered
    if (activeTooltip === featureId) {
      setActiveTooltip(null);
    }
  }, [activeTooltip]);

  const showTooltip = useCallback((featureId: string) => {
    setActiveTooltip(featureId);
  }, []);

  const hideTooltip = useCallback(() => {
    setActiveTooltip(null);
  }, []);

  const dismissFeatureForever = useCallback((featureId: string) => {
    setDismissedForever(prev => {
      const newSet = new Set(prev);
      newSet.add(featureId);
      return newSet;
    });
    
    // Also mark as discovered
    markAsDiscovered(featureId);
  }, [markAsDiscovered]);

  const resetDiscovery = useCallback(() => {
    setDiscoveredFeatures(new Set());
    setDismissedForever(new Set());
    setActiveTooltip(null);
    
    // Clear localStorage
    if (userId && userRole) {
      const storageKey = `feature_discovery_${userId}_${userRole}`;
      const dismissedKey = `feature_dismissed_${userId}_${userRole}`;
      localStorage.removeItem(storageKey);
      localStorage.removeItem(dismissedKey);
    }
  }, [userId, userRole]);

  return {
    discoveredFeatures,
    activeTooltip,
    shouldShowHotspot,
    shouldShowTooltip,
    markAsDiscovered,
    showTooltip,
    hideTooltip,
    dismissFeatureForever,
    resetDiscovery
  };
}

