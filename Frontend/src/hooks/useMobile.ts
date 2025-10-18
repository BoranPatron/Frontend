import { useState, useEffect } from 'react';

/**
 * Custom Hook für Mobile Detection und Responsive Breakpoints
 * 
 * @param breakpoint - Optional: Custom breakpoint (default: 768px)
 * @returns Object mit Mobile-States und Utility-Functions
 */
export function useMobile(breakpoint: number = 768) {
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [width, setWidth] = useState(0);
  const [height, setHeight] = useState(0);
  const [isLandscape, setIsLandscape] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  useEffect(() => {
    const checkDevice = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      
      setWidth(w);
      setHeight(h);
      setIsMobile(w < breakpoint);
      setIsTablet(w >= breakpoint && w < 1024);
      setIsDesktop(w >= 1024);
      setIsLandscape(w > h);
      setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0);
    };

    checkDevice();
    window.addEventListener('resize', checkDevice);
    window.addEventListener('orientationchange', checkDevice);

    return () => {
      window.removeEventListener('resize', checkDevice);
      window.removeEventListener('orientationchange', checkDevice);
    };
  }, [breakpoint]);

  return {
    isMobile,
    isTablet,
    isDesktop,
    width,
    height,
    isLandscape,
    isPortrait: !isLandscape,
    isTouchDevice,
    // Utility functions
    isSmallMobile: width < 375,
    isMediumMobile: width >= 375 && width < 428,
    isLargeMobile: width >= 428 && width < breakpoint,
    // Responsive values
    value: <T,>(mobile: T, tablet?: T, desktop?: T): T => {
      if (isMobile) return mobile;
      if (isTablet && tablet !== undefined) return tablet;
      if (isDesktop && desktop !== undefined) return desktop;
      return tablet !== undefined ? tablet : mobile;
    }
  };
}

/**
 * Hook für Safe Area Insets (iPhone Notch, etc.)
 */
export function useSafeArea() {
  const [safeArea, setSafeArea] = useState({
    top: 0,
    right: 0,
    bottom: 0,
    left: 0
  });

  useEffect(() => {
    const updateSafeArea = () => {
      const computedStyle = getComputedStyle(document.documentElement);
      
      setSafeArea({
        top: parseInt(computedStyle.getPropertyValue('env(safe-area-inset-top)') || '0'),
        right: parseInt(computedStyle.getPropertyValue('env(safe-area-inset-right)') || '0'),
        bottom: parseInt(computedStyle.getPropertyValue('env(safe-area-inset-bottom)') || '0'),
        left: parseInt(computedStyle.getPropertyValue('env(safe-area-inset-left)') || '0')
      });
    };

    updateSafeArea();
    window.addEventListener('resize', updateSafeArea);
    window.addEventListener('orientationchange', updateSafeArea);

    return () => {
      window.removeEventListener('resize', updateSafeArea);
      window.removeEventListener('orientationchange', updateSafeArea);
    };
  }, []);

  return safeArea;
}

/**
 * Hook für Touch-Gestures
 */
export function useSwipeGesture(
  onSwipeLeft?: () => void,
  onSwipeRight?: () => void,
  onSwipeUp?: () => void,
  onSwipeDown?: () => void,
  threshold: number = 50
) {
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
  const [touchEnd, setTouchEnd] = useState<{ x: number; y: number } | null>(null);

  const minSwipeDistance = threshold;

  const onTouchStart = (e: TouchEvent) => {
    setTouchEnd(null);
    setTouchStart({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY
    });
  };

  const onTouchMove = (e: TouchEvent) => {
    setTouchEnd({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY
    });
  };

  const onTouchEndHandler = () => {
    if (!touchStart || !touchEnd) return;

    const distanceX = touchStart.x - touchEnd.x;
    const distanceY = touchStart.y - touchEnd.y;
    const isLeftSwipe = distanceX > minSwipeDistance;
    const isRightSwipe = distanceX < -minSwipeDistance;
    const isUpSwipe = distanceY > minSwipeDistance;
    const isDownSwipe = distanceY < -minSwipeDistance;

    // Horizontal swipes have priority
    if (Math.abs(distanceX) > Math.abs(distanceY)) {
      if (isLeftSwipe && onSwipeLeft) onSwipeLeft();
      if (isRightSwipe && onSwipeRight) onSwipeRight();
    } else {
      if (isUpSwipe && onSwipeUp) onSwipeUp();
      if (isDownSwipe && onSwipeDown) onSwipeDown();
    }
  };

  return {
    onTouchStart,
    onTouchMove,
    onTouchEnd: onTouchEndHandler
  };
}

/**
 * Hook für Pull-to-Refresh
 */
export function usePullToRefresh(
  onRefresh: () => Promise<void>,
  threshold: number = 80
) {
  const [isPulling, setIsPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [startY, setStartY] = useState(0);

  const handleTouchStart = (e: TouchEvent) => {
    if (window.scrollY === 0) {
      setStartY(e.touches[0].clientY);
    }
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (window.scrollY === 0 && startY > 0) {
      const distance = e.touches[0].clientY - startY;
      if (distance > 0) {
        setPullDistance(Math.min(distance, threshold * 1.5));
        setIsPulling(true);
      }
    }
  };

  const handleTouchEnd = async () => {
    if (pullDistance > threshold && !isRefreshing) {
      setIsRefreshing(true);
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
      }
    }
    setIsPulling(false);
    setPullDistance(0);
    setStartY(0);
  };

  return {
    isPulling,
    pullDistance,
    isRefreshing,
    shouldRefresh: pullDistance > threshold,
    pullProgress: Math.min((pullDistance / threshold) * 100, 100),
    handlers: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd
    }
  };
}

/**
 * Hook für Keyboard-Visibility (Mobile)
 */
export function useKeyboardVisible() {
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      // Einfache Heuristik: Wenn die Höhe kleiner wird, ist die Tastatur vermutlich offen
      const viewportHeight = window.visualViewport?.height || window.innerHeight;
      const windowHeight = window.innerHeight;
      setIsKeyboardVisible(viewportHeight < windowHeight * 0.8);
    };

    window.visualViewport?.addEventListener('resize', handleResize);
    window.addEventListener('resize', handleResize);

    return () => {
      window.visualViewport?.removeEventListener('resize', handleResize);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return isKeyboardVisible;
}

/**
 * Hook für Responsive Font Size
 */
export function useResponsiveFontSize(
  mobileSize: number = 14,
  tabletSize?: number,
  desktopSize: number = 16
) {
  const { isMobile, isTablet } = useMobile();
  
  if (isMobile) return `${mobileSize}px`;
  if (isTablet && tabletSize) return `${tabletSize}px`;
  return `${desktopSize}px`;
}

export default useMobile;

