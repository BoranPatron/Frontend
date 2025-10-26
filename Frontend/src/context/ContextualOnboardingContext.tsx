/**
 * ContextualOnboardingContext
 * Verwaltet kontextuelles Onboarding mit Feature-Discovery
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { updateMe } from '../api/userService';
import { 
  getFeaturesByRole, 
  OnboardingFeature, 
  BAUTRAEGER_FEATURES,
  DIENSTLEISTER_FEATURES 
} from '../utils/onboardingFeatures';
import { useFeatureDiscovery } from '../hooks/useFeatureDiscovery';

interface ContextualOnboardingContextType {
  // Feature Discovery
  features: OnboardingFeature[];
  discoveredFeatures: Set<string>;
  activeTooltip: string | null;
  shouldShowHotspot: (featureId: string) => boolean;
  shouldShowTooltip: (featureId: string) => boolean;
  
  // Actions
  markFeatureAsDiscovered: (featureId: string) => void;
  showFeatureTooltip: (featureId: string) => void;
  hideFeatureTooltip: () => void;
  dismissFeatureForever: (featureId: string) => void;
  
  // Progress
  totalFeatures: number;
  discoveredCount: number;
  progressPercentage: number;
  
  // State
  isOnboardingComplete: boolean;
  completeOnboarding: () => Promise<void>;
  
  // Debug
  resetOnboarding?: () => void;
}

const ContextualOnboardingContext = createContext<ContextualOnboardingContextType | undefined>(undefined);

export function ContextualOnboardingProvider({ children }: { children: React.ReactNode }) {
  const { user, isInitialized } = useAuth();
  const userRole = user?.user_role as 'BAUTRAEGER' | 'DIENSTLEISTER' | null;
  
  // Get features for current role
  const features = userRole ? getFeaturesByRole(userRole) : [];
  
  // Use feature discovery hook
  const {
    discoveredFeatures,
    activeTooltip,
    shouldShowHotspot,
    shouldShowTooltip,
    markAsDiscovered,
    showTooltip,
    hideTooltip,
    dismissFeatureForever,
    resetDiscovery
  } = useFeatureDiscovery(user?.id, userRole, features);
  
  const [isOnboardingComplete, setIsOnboardingComplete] = useState(false);

  // Check if onboarding is complete
  useEffect(() => {
    if (!user) return;
    
    const contextualOnboarding = user.consent_fields?.contextual_onboarding;
    const completed = contextualOnboarding?.completed === true;
    
    // Also check local storage as backup
    const localKey = `onboarding_complete_${user.id}`;
    const localCompleted = localStorage.getItem(localKey) === 'true';
    
    setIsOnboardingComplete(completed || localCompleted);
  }, [user]);

  // Calculate progress
  const totalFeatures = features.length;
  const discoveredCount = discoveredFeatures.size;
  const progressPercentage = totalFeatures > 0 
    ? Math.round((discoveredCount / totalFeatures) * 100) 
    : 0;

  // Mark feature as discovered
  const markFeatureAsDiscovered = useCallback((featureId: string) => {
    markAsDiscovered(featureId);
    
    // Log for analytics
    console.log('🎯 Feature discovered:', featureId, {
      progress: `${discoveredCount + 1}/${totalFeatures}`,
      percentage: `${Math.round(((discoveredCount + 1) / totalFeatures) * 100)}%`
    });
  }, [markAsDiscovered, discoveredCount, totalFeatures]);

  // Show feature tooltip
  const showFeatureTooltip = useCallback((featureId: string) => {
    if (!shouldShowTooltip(featureId)) return;
    showTooltip(featureId);
  }, [showTooltip, shouldShowTooltip]);

  // Hide feature tooltip and mark as discovered
  const hideFeatureTooltip = useCallback(() => {
    if (activeTooltip) {
      markFeatureAsDiscovered(activeTooltip);
    }
    hideTooltip();
  }, [activeTooltip, hideTooltip, markFeatureAsDiscovered]);

  // Complete onboarding
  const completeOnboarding = useCallback(async () => {
    if (!user) return;
    
    try {
      const onboardingData = {
        consent_fields: {
          ...user.consent_fields,
          contextual_onboarding: {
            completed: true,
            version: '1.0',
            completed_at: new Date().toISOString(),
            discovered_features: Array.from(discoveredFeatures)
          }
        }
      };
      
      await updateMe(onboardingData);
      
      // Save locally as backup
      const localKey = `onboarding_complete_${user.id}`;
      localStorage.setItem(localKey, 'true');
      
      setIsOnboardingComplete(true);
      
      console.log('✅ Contextual onboarding completed');
    } catch (error) {
      console.error('❌ Failed to save onboarding completion:', error);
      
      // Save locally anyway
      const localKey = `onboarding_complete_${user.id}`;
      localStorage.setItem(localKey, 'true');
      setIsOnboardingComplete(true);
    }
  }, [user, discoveredFeatures]);

  // Auto-complete onboarding when all features discovered
  useEffect(() => {
    if (discoveredCount === totalFeatures && totalFeatures > 0 && !isOnboardingComplete) {
      console.log('🎉 All features discovered! Completing onboarding...');
      completeOnboarding();
    }
  }, [discoveredCount, totalFeatures, isOnboardingComplete, completeOnboarding]);

  // Debug function
  const resetOnboarding = useCallback(() => {
    if (process.env.NODE_ENV === 'development') {
      resetDiscovery();
      setIsOnboardingComplete(false);
      
      if (user) {
        const localKey = `onboarding_complete_${user.id}`;
        localStorage.removeItem(localKey);
      }
      
      console.log('🔄 Contextual onboarding reset');
    }
  }, [resetDiscovery, user]);

  // Expose debug functions
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    (window as any).resetContextualOnboarding = resetOnboarding;
    (window as any).checkOnboardingProgress = () => {
      console.log('📊 Onboarding Progress:', {
        role: userRole,
        userId: user?.id,
        totalFeatures,
        discoveredCount,
        progressPercentage: `${progressPercentage}%`,
        discoveredFeatures: Array.from(discoveredFeatures),
        isComplete: isOnboardingComplete,
        activeTooltip,
        features: features.map(f => ({
          id: f.id,
          title: f.title,
          discovered: discoveredFeatures.has(f.id),
          showHotspot: f.showHotspot,
          triggerOn: f.triggerOn
        }))
      });
    };
    (window as any).showOnboardingFeature = (featureId: string) => {
      console.log(`🎯 Manually triggering feature: ${featureId}`);
      const feature = features.find(f => f.id === featureId);
      if (feature) {
        showFeatureTooltip(featureId);
      } else {
        console.error(`❌ Feature not found: ${featureId}`);
      }
    };
    (window as any).listOnboardingFeatures = () => {
      console.table(features.map(f => ({
        ID: f.id,
        Title: f.title,
        Priority: f.priority,
        Discovered: discoveredFeatures.has(f.id) ? '✅' : '❌',
        Hotspot: f.showHotspot ? '🔆' : '-',
        Trigger: f.triggerOn
      })));
    };
  }

  const value: ContextualOnboardingContextType = {
    features,
    discoveredFeatures,
    activeTooltip,
    shouldShowHotspot,
    shouldShowTooltip,
    markFeatureAsDiscovered,
    showFeatureTooltip,
    hideFeatureTooltip,
    dismissFeatureForever,
    totalFeatures,
    discoveredCount,
    progressPercentage,
    isOnboardingComplete,
    completeOnboarding,
    resetOnboarding: process.env.NODE_ENV === 'development' ? resetOnboarding : undefined
  };

  return (
    <ContextualOnboardingContext.Provider value={value}>
      {children}
    </ContextualOnboardingContext.Provider>
  );
}

export function useContextualOnboarding() {
  const context = useContext(ContextualOnboardingContext);
  if (context === undefined) {
    throw new Error('useContextualOnboarding must be used within a ContextualOnboardingProvider');
  }
  return context;
}

