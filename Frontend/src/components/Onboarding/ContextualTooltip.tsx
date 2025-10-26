/**
 * ContextualTooltip - Moderner, kontextueller Tooltip für Feature-Discovery
 * 
 * Features:
 * - Glassmorphism Design mit Glow-Effekten
 * - Smart Positioning (automatische Anpassung)
 * - Dismissible mit "Nicht mehr anzeigen" Option
 * - Progress Indicator
 * - Smooth Animations
 */

import React, { useEffect, useState, useRef } from 'react';
import { X, Sparkles, CheckCircle } from 'lucide-react';

export interface ContextualTooltipProps {
  id: string;
  title: string;
  description: string;
  targetElement: HTMLElement | null;
  placement?: 'top' | 'bottom' | 'left' | 'right' | 'auto';
  onDismiss: () => void;
  onDismissForever: () => void;
  showProgress?: boolean;
  currentStep?: number;
  totalSteps?: number;
  isVisible: boolean;
}

const ARROW_SIZE = 12;
const TOOLTIP_OFFSET = 16;

export default function ContextualTooltip({
  id,
  title,
  description,
  targetElement,
  placement = 'auto',
  onDismiss,
  onDismissForever,
  showProgress = false,
  currentStep = 0,
  totalSteps = 0,
  isVisible
}: ContextualTooltipProps) {
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [actualPlacement, setActualPlacement] = useState<'top' | 'bottom' | 'left' | 'right'>('bottom');
  const [isAnimating, setIsAnimating] = useState(false);

  // Calculate optimal position
  useEffect(() => {
    if (!targetElement || !tooltipRef.current || !isVisible) return;

    const calculatePosition = () => {
      const targetRect = targetElement.getBoundingClientRect();
      const tooltipRect = tooltipRef.current?.getBoundingClientRect();
      
      if (!tooltipRect) return;

      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      let finalPlacement = placement;
      let top = 0;
      let left = 0;

      // Auto-detect best placement
      if (placement === 'auto') {
        const spaceTop = targetRect.top;
        const spaceBottom = viewportHeight - targetRect.bottom;
        const spaceLeft = targetRect.left;
        const spaceRight = viewportWidth - targetRect.right;

        if (spaceBottom > tooltipRect.height + TOOLTIP_OFFSET) {
          finalPlacement = 'bottom';
        } else if (spaceTop > tooltipRect.height + TOOLTIP_OFFSET) {
          finalPlacement = 'top';
        } else if (spaceRight > tooltipRect.width + TOOLTIP_OFFSET) {
          finalPlacement = 'right';
        } else if (spaceLeft > tooltipRect.width + TOOLTIP_OFFSET) {
          finalPlacement = 'left';
        } else {
          finalPlacement = 'bottom'; // Fallback
        }
      }

      // Calculate position based on placement
      switch (finalPlacement) {
        case 'top':
          top = targetRect.top - tooltipRect.height - TOOLTIP_OFFSET + window.scrollY;
          left = targetRect.left + (targetRect.width / 2) - (tooltipRect.width / 2) + window.scrollX;
          break;
        case 'bottom':
          top = targetRect.bottom + TOOLTIP_OFFSET + window.scrollY;
          left = targetRect.left + (targetRect.width / 2) - (tooltipRect.width / 2) + window.scrollX;
          break;
        case 'left':
          top = targetRect.top + (targetRect.height / 2) - (tooltipRect.height / 2) + window.scrollY;
          left = targetRect.left - tooltipRect.width - TOOLTIP_OFFSET + window.scrollX;
          break;
        case 'right':
          top = targetRect.top + (targetRect.height / 2) - (tooltipRect.height / 2) + window.scrollY;
          left = targetRect.right + TOOLTIP_OFFSET + window.scrollX;
          break;
      }

      // Keep tooltip within viewport bounds
      const maxLeft = viewportWidth - tooltipRect.width - 20;
      const maxTop = viewportHeight - tooltipRect.height - 20;
      left = Math.max(20, Math.min(left, maxLeft));
      top = Math.max(20, Math.min(top, maxTop));

      setPosition({ top, left });
      setActualPlacement(finalPlacement);
    };

    // Delay calculation to ensure DOM is ready
    setTimeout(calculatePosition, 50);

    // Recalculate on scroll/resize
    window.addEventListener('scroll', calculatePosition, true);
    window.addEventListener('resize', calculatePosition);

    return () => {
      window.removeEventListener('scroll', calculatePosition, true);
      window.removeEventListener('resize', calculatePosition);
    };
  }, [targetElement, placement, isVisible]);

  // Animation on mount
  useEffect(() => {
    if (isVisible) {
      setIsAnimating(true);
      const timer = setTimeout(() => setIsAnimating(false), 600);
      return () => clearTimeout(timer);
    }
  }, [isVisible]);

  if (!isVisible || !targetElement) return null;

  // Arrow position based on placement
  const getArrowStyle = () => {
    const baseStyle = {
      position: 'absolute' as const,
      width: 0,
      height: 0,
      borderStyle: 'solid' as const,
    };

    switch (actualPlacement) {
      case 'top':
        return {
          ...baseStyle,
          bottom: -ARROW_SIZE,
          left: '50%',
          transform: 'translateX(-50%)',
          borderWidth: `${ARROW_SIZE}px ${ARROW_SIZE}px 0 ${ARROW_SIZE}px`,
          borderColor: 'rgba(255, 189, 89, 0.6) transparent transparent transparent',
        };
      case 'bottom':
        return {
          ...baseStyle,
          top: -ARROW_SIZE,
          left: '50%',
          transform: 'translateX(-50%)',
          borderWidth: `0 ${ARROW_SIZE}px ${ARROW_SIZE}px ${ARROW_SIZE}px`,
          borderColor: 'transparent transparent rgba(255, 189, 89, 0.6) transparent',
        };
      case 'left':
        return {
          ...baseStyle,
          right: -ARROW_SIZE,
          top: '50%',
          transform: 'translateY(-50%)',
          borderWidth: `${ARROW_SIZE}px 0 ${ARROW_SIZE}px ${ARROW_SIZE}px`,
          borderColor: 'transparent transparent transparent rgba(255, 189, 89, 0.6)',
        };
      case 'right':
        return {
          ...baseStyle,
          left: -ARROW_SIZE,
          top: '50%',
          transform: 'translateY(-50%)',
          borderWidth: `${ARROW_SIZE}px ${ARROW_SIZE}px ${ARROW_SIZE}px 0`,
          borderColor: 'transparent rgba(255, 189, 89, 0.6) transparent transparent',
        };
      default:
        return baseStyle;
    }
  };

  // Debug logging
  useEffect(() => {
    console.log('🎯 ContextualTooltip mounted:', {
      id,
      isVisible,
      targetElement: targetElement?.tagName,
      position,
      placement: actualPlacement
    });
  }, [id, isVisible, targetElement, position, actualPlacement]);

  return (
    <div
      ref={tooltipRef}
      className={`fixed z-[99999] pointer-events-auto transition-all duration-300 ${
        isAnimating ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
      }`}
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
      }}
      role="tooltip"
      aria-labelledby={`tooltip-title-${id}`}
    >
      {/* Modern glassmorphism card */}
      <div className="relative bg-gradient-to-br from-gray-900/98 via-gray-800/98 to-gray-900/98 backdrop-blur-xl border-2 border-[#ffbd59]/60 rounded-2xl p-5 shadow-2xl max-w-sm">
        {/* Glow effect */}
        <div 
          className="absolute inset-0 opacity-20 pointer-events-none rounded-2xl"
          style={{
            background: 'radial-gradient(circle at 50% 0%, rgba(255,189,89,0.3) 0%, transparent 70%)',
          }}
        />

        {/* Arrow */}
        <div style={getArrowStyle()} />

        {/* Content */}
        <div className="relative z-10">
          {/* Header */}
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex items-center gap-2 flex-1">
              <Sparkles className="w-5 h-5 text-[#ffbd59] flex-shrink-0" />
              <h3 
                id={`tooltip-title-${id}`}
                className="text-base font-bold text-white leading-tight"
              >
                {title}
              </h3>
            </div>
            <button
              onClick={onDismiss}
              className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
              aria-label="Tooltip schließen"
            >
              <X className="w-4 h-4 text-gray-300" />
            </button>
          </div>

          {/* Description */}
          <p className="text-sm text-gray-200 leading-relaxed mb-4">
            {description}
          </p>

          {/* Progress */}
          {showProgress && totalSteps > 0 && (
            <div className="flex items-center gap-2 mb-4 text-xs text-gray-400">
              <CheckCircle className="w-3 h-3 text-[#ffbd59]" />
              <span>{currentStep} von {totalSteps} Features entdeckt</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between gap-2 pt-3 border-t border-gray-700/50">
            <button
              onClick={onDismissForever}
              className="text-xs text-gray-400 hover:text-gray-200 transition-colors"
            >
              Nicht mehr anzeigen
            </button>
            <button
              onClick={onDismiss}
              className="px-4 py-2 bg-gradient-to-r from-[#ffbd59] to-[#ffa726] hover:from-[#ffa726] hover:to-[#ff9800] text-[#2c3539] text-sm font-bold rounded-lg transition-all duration-200 hover:scale-105 active:scale-95"
            >
              Verstanden
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

