import React, { useState, useRef, useEffect } from 'react';

interface SmartTooltipProps {
  content: string;
  children: React.ReactNode;
  className?: string;
  delay?: number;
}

const SmartTooltip: React.FC<SmartTooltipProps> = ({ 
  content, 
  children, 
  className = '',
  delay = 200 
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState<'top' | 'bottom' | 'left' | 'right'>('top');
  const triggerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const calculatePosition = () => {
    if (!triggerRef.current || !tooltipRef.current) return;

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const scrollY = window.scrollY;
    const scrollX = window.scrollX;

    // Berechne verfügbaren Platz in alle Richtungen
    const spaceTop = triggerRect.top - scrollY;
    const spaceBottom = viewportHeight - (triggerRect.bottom - scrollY);
    const spaceLeft = triggerRect.left - scrollX;
    const spaceRight = viewportWidth - (triggerRect.right - scrollX);

    // Tooltip-Dimensionen
    const tooltipWidth = tooltipRect.width;
    const tooltipHeight = tooltipRect.height;

    // Bestimme beste Position basierend auf verfügbarem Platz
    let bestPosition: 'top' | 'bottom' | 'left' | 'right' = 'top';

    if (spaceTop >= tooltipHeight + 10) {
      bestPosition = 'top';
    } else if (spaceBottom >= tooltipHeight + 10) {
      bestPosition = 'bottom';
    } else if (spaceRight >= tooltipWidth + 10) {
      bestPosition = 'right';
    } else if (spaceLeft >= tooltipWidth + 10) {
      bestPosition = 'left';
    } else {
      // Fallback: Wähle Position mit dem meisten Platz
      const maxSpace = Math.max(spaceTop, spaceBottom, spaceLeft, spaceRight);
      if (maxSpace === spaceTop) bestPosition = 'top';
      else if (maxSpace === spaceBottom) bestPosition = 'bottom';
      else if (maxSpace === spaceRight) bestPosition = 'right';
      else bestPosition = 'left';
    }

    setPosition(bestPosition);
  };

  const showTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
      // Berechne Position nach dem Anzeigen
      setTimeout(calculatePosition, 0);
    }, delay);
  };

  const hideTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsVisible(false);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const getTooltipClasses = () => {
    const baseClasses = "absolute px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap transition-opacity duration-200 pointer-events-none z-50";
    
    switch (position) {
      case 'top':
        return `${baseClasses} bottom-full left-1/2 transform -translate-x-1/2 mb-2`;
      case 'bottom':
        return `${baseClasses} top-full left-1/2 transform -translate-x-1/2 mt-2`;
      case 'left':
        return `${baseClasses} right-full top-1/2 transform -translate-y-1/2 mr-2`;
      case 'right':
        return `${baseClasses} left-full top-1/2 transform -translate-y-1/2 ml-2`;
      default:
        return `${baseClasses} bottom-full left-1/2 transform -translate-x-1/2 mb-2`;
    }
  };

  const getArrowClasses = () => {
    const baseArrowClasses = "absolute w-0 h-0";
    
    switch (position) {
      case 'top':
        return `${baseArrowClasses} top-full left-1/2 transform -translate-x-1/2 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900`;
      case 'bottom':
        return `${baseArrowClasses} bottom-full left-1/2 transform -translate-x-1/2 border-l-4 border-r-4 border-b-4 border-transparent border-b-gray-900`;
      case 'left':
        return `${baseArrowClasses} left-full top-1/2 transform -translate-y-1/2 border-t-4 border-b-4 border-l-4 border-transparent border-l-gray-900`;
      case 'right':
        return `${baseArrowClasses} right-full top-1/2 transform -translate-y-1/2 border-t-4 border-b-4 border-r-4 border-transparent border-r-gray-900`;
      default:
        return `${baseArrowClasses} top-full left-1/2 transform -translate-x-1/2 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900`;
    }
  };

  return (
    <div
      ref={triggerRef}
      className={`relative inline-block ${className}`}
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      onFocus={showTooltip}
      onBlur={hideTooltip}
    >
      {children}
      {isVisible && (
        <div
          ref={tooltipRef}
          className={`${getTooltipClasses()} ${isVisible ? 'opacity-100' : 'opacity-0'}`}
        >
          {content}
          <div className={getArrowClasses()}></div>
        </div>
      )}
    </div>
  );
};

export default SmartTooltip;

