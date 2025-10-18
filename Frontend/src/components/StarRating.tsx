import React, { useState, useRef, useEffect } from 'react';
import { Star } from 'lucide-react';
import { createPortal } from 'react-dom';

interface StarRatingProps {
  rating: number;
  maxRating?: number;
  size?: 'sm' | 'md' | 'lg';
  showCount?: boolean;
  count?: number;
  className?: string;
  // Detaillierte Bewertungen für Hover-Effekt
  detailedRatings?: {
    quality?: number;
    timeliness?: number;
    communication?: number;
    value?: number;
  };
}

export default function StarRating({ 
  rating, 
  maxRating = 5, 
  size = 'md', 
  showCount = false, 
  count = 0,
  className = '',
  detailedRatings
}: StarRatingProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState<'top' | 'bottom'>('top');
  const [tooltipCoords, setTooltipCoords] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const sizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };

  const starSize = sizeClasses[size];

  // Berechne optimale Tooltip-Position basierend auf verfügbarem Platz
  const updateTooltipPosition = () => {
    if (isHovered && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const viewportWidth = window.innerWidth;
      const tooltipHeight = 200; // Geschätzte Höhe des Tooltips
      const tooltipWidth = 300; // Geschätzte Breite des Tooltips
      
      // Berechne Zentrum des Elements
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      
      // Prüfe ob genug Platz oben ist
      const spaceAbove = rect.top;
      const spaceBelow = viewportHeight - rect.bottom;
      
      // Positioniere Tooltip dort wo mehr Platz ist
      if (spaceAbove < tooltipHeight && spaceBelow > tooltipHeight) {
        setTooltipPosition('bottom');
        setTooltipCoords({ 
          x: centerX, 
          y: rect.bottom + 10 // Unten mit Abstand
        });
      } else {
        setTooltipPosition('top');
        setTooltipCoords({ 
          x: centerX, 
          y: rect.top - 10 // Oben mit Abstand
        });
      }
    }
  };

  useEffect(() => {
    updateTooltipPosition();
    
    // Aktualisiere Position bei Scroll und Resize
    const handleScroll = () => updateTooltipPosition();
    const handleResize = () => updateTooltipPosition();
    
    window.addEventListener('scroll', handleScroll, true);
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', handleResize);
    };
  }, [isHovered]);

  // Berechne gefüllte und halbe Sterne
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  const emptyStars = maxRating - fullStars - (hasHalfStar ? 1 : 0);

  // Bestimme die Farbe basierend auf der Bewertung
  const getStarColor = (index: number) => {
    if (index < fullStars) {
      return 'text-yellow-400'; // Gefüllte Sterne
    } else if (index === fullStars && hasHalfStar) {
      return 'text-yellow-400'; // Halber Stern
    } else {
      return 'text-gray-400'; // Leere Sterne
    }
  };

  // Bestimme die Bewertungsklasse für Glow-Effekte
  const getRatingClass = () => {
    if (rating >= 4.5) return 'text-yellow-400 shadow-lg shadow-yellow-400/30';
    if (rating >= 4.0) return 'text-yellow-400 shadow-md shadow-yellow-400/20';
    if (rating >= 3.0) return 'text-yellow-400 shadow-sm shadow-yellow-400/10';
    return 'text-gray-400';
  };

  // Detaillierte Bewertungsanzeige für Hover mit Portal für höchste Ebene
  const DetailedRatingTooltip = () => {
    if (!detailedRatings || !isHovered) return null;

    // Dynamische Positionierung basierend auf verfügbarem Platz
    const isTopPosition = tooltipPosition === 'top';
    
    // Portal für absolute Positionierung über alle Elemente
    const portalTarget = document.body;
    
    if (!portalTarget) return null;

    return createPortal(
      <div 
        className="fixed px-4 py-3 bg-gray-900/95 backdrop-blur-lg rounded-xl border border-white/20 shadow-2xl min-w-[280px] pointer-events-auto"
        style={{
          // Höchster z-index für vorderste Ebene
          zIndex: 999999,
          // Position basierend auf berechneten Koordinaten
          left: `${tooltipCoords.x}px`,
          top: `${tooltipCoords.y}px`,
          transform: 'translateX(-50%) translateY(-100%)',
          maxWidth: '300px',
          minWidth: '280px',
          maxHeight: '300px',
          overflowY: 'auto',
          wordWrap: 'break-word'
        }}
      >
        {/* Pfeil - zeigt in die richtige Richtung */}
        {isTopPosition ? (
          // Pfeil nach unten (wenn Tooltip oben ist)
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900/95"></div>
        ) : (
          // Pfeil nach oben (wenn Tooltip unten ist)
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-gray-900/95"></div>
        )}
        <TooltipContent />
      </div>,
      portalTarget
    );
  };

  // Tooltip-Inhalt als separate Komponente
  const TooltipContent = () => (
    <div className="space-y-2">
      <div className="text-xs font-semibold text-white mb-2 text-center border-b border-white/20 pb-2">
        Detaillierte Bewertungen
      </div>
      
      {/* Qualität */}
      {detailedRatings.quality !== undefined && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-300">Qualität</span>
          <div className="flex items-center space-x-1">
            {Array.from({ length: 5 }, (_, i) => (
              <Star
                key={i}
                className={`w-3 h-3 ${
                  i < Math.floor(detailedRatings.quality!) 
                    ? 'text-yellow-400' 
                    : 'text-gray-400'
                }`}
                fill={i < Math.floor(detailedRatings.quality!) ? 'currentColor' : 'none'}
              />
            ))}
            <span className="text-xs text-yellow-400 ml-1">
              {detailedRatings.quality?.toFixed(1)}
            </span>
          </div>
        </div>
      )}
      
      {/* Termintreue */}
      {detailedRatings.timeliness !== undefined && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-300">Termintreue</span>
          <div className="flex items-center space-x-1">
            {Array.from({ length: 5 }, (_, i) => (
              <Star
                key={i}
                className={`w-3 h-3 ${
                  i < Math.floor(detailedRatings.timeliness!) 
                    ? 'text-yellow-400' 
                    : 'text-gray-400'
                }`}
                fill={i < Math.floor(detailedRatings.timeliness!) ? 'currentColor' : 'none'}
              />
            ))}
            <span className="text-xs text-yellow-400 ml-1">
              {detailedRatings.timeliness?.toFixed(1)}
            </span>
          </div>
        </div>
      )}
      
      {/* Kommunikation */}
      {detailedRatings.communication !== undefined && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-300">Kommunikation</span>
          <div className="flex items-center space-x-1">
            {Array.from({ length: 5 }, (_, i) => (
              <Star
                key={i}
                className={`w-3 h-3 ${
                  i < Math.floor(detailedRatings.communication!) 
                    ? 'text-yellow-400' 
                    : 'text-gray-400'
                }`}
                fill={i < Math.floor(detailedRatings.communication!) ? 'currentColor' : 'none'}
              />
            ))}
            <span className="text-xs text-yellow-400 ml-1">
              {detailedRatings.communication?.toFixed(1)}
            </span>
          </div>
        </div>
      )}
      
      {/* Preis-Leistung */}
      {detailedRatings.value !== undefined && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-300">Preis-Leistung</span>
          <div className="flex items-center space-x-1">
            {Array.from({ length: 5 }, (_, i) => (
              <Star
                key={i}
                className={`w-3 h-3 ${
                  i < Math.floor(detailedRatings.value!) 
                    ? 'text-yellow-400' 
                    : 'text-gray-400'
                }`}
                fill={i < Math.floor(detailedRatings.value!) ? 'currentColor' : 'none'}
              />
            ))}
            <span className="text-xs text-yellow-400 ml-1">
              {detailedRatings.value?.toFixed(1)}
            </span>
          </div>
        </div>
      )}
      
      {/* Gesamtbewertung */}
      <div className="pt-2 border-t border-white/20">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-white">Gesamt</span>
          <div className="flex items-center space-x-1">
            {Array.from({ length: 5 }, (_, i) => (
              <Star
                key={i}
                className={`w-3 h-3 ${
                  i < Math.floor(rating) 
                    ? 'text-yellow-400' 
                    : 'text-gray-400'
                }`}
                fill={i < Math.floor(rating) ? 'currentColor' : 'none'}
              />
            ))}
            <span className="text-xs text-yellow-400 ml-1 font-semibold">
              {rating.toFixed(1)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div 
      ref={containerRef}
      className={`relative group ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex items-center space-x-1">
        <div className="flex items-center space-x-0.5">
          {Array.from({ length: maxRating }, (_, index) => (
            <Star
              key={index}
              className={`${starSize} ${getStarColor(index)} transition-all duration-300 ${
                index < fullStars || (index === fullStars && hasHalfStar) 
                  ? 'drop-shadow-sm' 
                  : ''
              }`}
              fill={index < fullStars || (index === fullStars && hasHalfStar) ? 'currentColor' : 'none'}
            />
          ))}
        </div>
        
        {showCount && (
          <span className={`text-xs font-medium ${getRatingClass()}`}>
            {rating.toFixed(1)}
            {count > 0 && (
              <span className="text-gray-400 ml-1">
                ({count})
              </span>
            )}
          </span>
        )}
      </div>
      
      {/* Portal-basierter Tooltip mit detaillierten Bewertungen */}
      <DetailedRatingTooltip />
    </div>
  );
}

