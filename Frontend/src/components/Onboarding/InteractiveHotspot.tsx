/**
 * InteractiveHotspot - Pulsierender Indikator für wichtige UI-Elemente
 * 
 * Features:
 * - Dezenter, pulsierender Punkt
 * - Glow-Effekt
 * - Auto-Dismiss nach Interaktion
 * - Positionierung relativ zum Target-Element
 */

import React, { useEffect, useState, useRef } from 'react';

export interface InteractiveHotspotProps {
  targetElement: HTMLElement | null;
  isVisible: boolean;
  color?: string;
  size?: number;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'center';
}

export default function InteractiveHotspot({
  targetElement,
  isVisible,
  color = '#ffbd59',
  size = 12,
  position = 'top-right'
}: InteractiveHotspotProps) {
  const [coordinates, setCoordinates] = useState({ top: 0, left: 0 });
  const hotspotRef = useRef<HTMLDivElement>(null);

  // Calculate position
  useEffect(() => {
    if (!targetElement || !isVisible) return;

    const updatePosition = () => {
      const rect = targetElement.getBoundingClientRect();
      let top = 0;
      let left = 0;

      switch (position) {
        case 'top-right':
          top = rect.top + window.scrollY;
          left = rect.right + window.scrollX - size / 2;
          break;
        case 'top-left':
          top = rect.top + window.scrollY;
          left = rect.left + window.scrollX - size / 2;
          break;
        case 'bottom-right':
          top = rect.bottom + window.scrollY - size / 2;
          left = rect.right + window.scrollX - size / 2;
          break;
        case 'bottom-left':
          top = rect.bottom + window.scrollY - size / 2;
          left = rect.left + window.scrollX - size / 2;
          break;
        case 'center':
          top = rect.top + rect.height / 2 + window.scrollY - size / 2;
          left = rect.left + rect.width / 2 + window.scrollX - size / 2;
          break;
      }

      setCoordinates({ top, left });
    };

    updatePosition();

    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);

    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [targetElement, isVisible, position, size]);

  if (!isVisible || !targetElement) return null;

  return (
    <div
      ref={hotspotRef}
      className="fixed z-[9999] pointer-events-none"
      style={{
        top: `${coordinates.top}px`,
        left: `${coordinates.left}px`,
        width: `${size}px`,
        height: `${size}px`,
      }}
    >
      {/* Outer pulsing ring */}
      <div
        className="absolute inset-0 rounded-full animate-ping"
        style={{
          backgroundColor: color,
          opacity: 0.5,
        }}
      />
      
      {/* Middle glow */}
      <div
        className="absolute inset-0 rounded-full blur-sm"
        style={{
          backgroundColor: color,
          opacity: 0.7,
          animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        }}
      />
      
      {/* Inner solid dot */}
      <div
        className="absolute inset-0 rounded-full"
        style={{
          backgroundColor: color,
          boxShadow: `0 0 20px ${color}, 0 0 40px ${color}66`,
        }}
      />
    </div>
  );
}

