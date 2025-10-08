import { useState, useEffect, useMemo, useCallback, useRef } from 'react';

// Custom Hook für Dashboard-Performance
export const useDashboardPerformance = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Performance-optimierte State-Updates
  const updateState = useCallback((updates: Record<string, any>) => {
    setIsInitialized(prev => ({ ...prev, ...updates }));
  }, []);

  // Debounced API calls für bessere Performance
  const debouncedApiCall = useCallback(
    (apiFunction: () => Promise<any>, delay: number = 300) => {
      const timeoutRef = useRef<NodeJS.Timeout>();
      
      return (...args: any[]) => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        
        timeoutRef.current = setTimeout(() => {
          apiFunction(...args);
        }, delay);
      };
    },
    []
  );

  return {
    isInitialized,
    isLoading,
    error,
    setIsInitialized,
    setIsLoading,
    setError,
    updateState,
    debouncedApiCall
  };
};

// Custom Hook für Mobile Touch-Optimierung
export const useMobileTouch = () => {
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
  const [touchEnd, setTouchEnd] = useState<{ x: number; y: number } | null>(null);
  
  const minSwipeDistance = 50;

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY
    });
  }, []);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    setTouchEnd({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY
    });
  }, []);

  const onTouchEnd = useCallback(() => {
    if (!touchStart || !touchEnd) return;
    
    const distanceX = touchStart.x - touchEnd.x;
    const distanceY = touchStart.y - touchEnd.y;
    const isLeftSwipe = distanceX > minSwipeDistance;
    const isRightSwipe = distanceX < -minSwipeDistance;
    const isUpSwipe = distanceY > minSwipeDistance;
    const isDownSwipe = distanceY < -minSwipeDistance;

    return {
      isLeftSwipe,
      isRightSwipe,
      isUpSwipe,
      isDownSwipe,
      distanceX,
      distanceY
    };
  }, [touchStart, touchEnd, minSwipeDistance]);

  return {
    onTouchStart,
    onTouchMove,
    onTouchEnd,
    touchStart,
    touchEnd
  };
};

// Custom Hook für Virtualisierung (für große Listen)
export const useVirtualization = (
  items: any[],
  itemHeight: number,
  containerHeight: number
) => {
  const [scrollTop, setScrollTop] = useState(0);
  
  const visibleItems = useMemo(() => {
    const startIndex = Math.floor(scrollTop / itemHeight);
    const endIndex = Math.min(
      startIndex + Math.ceil(containerHeight / itemHeight) + 1,
      items.length
    );
    
    return {
      startIndex,
      endIndex,
      items: items.slice(startIndex, endIndex),
      totalHeight: items.length * itemHeight,
      offsetY: startIndex * itemHeight
    };
  }, [items, itemHeight, containerHeight, scrollTop]);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  return {
    visibleItems,
    handleScroll,
    setScrollTop
  };
};

// Custom Hook für Lazy Loading
export const useLazyLoading = (
  loadMore: () => Promise<void>,
  hasMore: boolean,
  threshold: number = 100
) => {
  const [isLoading, setIsLoading] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!hasMore || isLoading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setIsLoading(true);
          loadMore().finally(() => setIsLoading(false));
        }
      },
      { rootMargin: `${threshold}px` }
    );

    observerRef.current = observer;

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [hasMore, isLoading, loadMore, threshold]);

  return {
    loadMoreRef,
    isLoading
  };
};

// Custom Hook für Mobile Gestures
export const useMobileGestures = () => {
  const [gestureState, setGestureState] = useState({
    isDragging: false,
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
    deltaX: 0,
    deltaY: 0
  });

  const handleGestureStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    setGestureState(prev => ({
      ...prev,
      isDragging: true,
      startX: touch.clientX,
      startY: touch.clientY,
      currentX: touch.clientX,
      currentY: touch.clientY,
      deltaX: 0,
      deltaY: 0
    }));
  }, []);

  const handleGestureMove = useCallback((e: React.TouchEvent) => {
    if (!gestureState.isDragging) return;
    
    const touch = e.touches[0];
    const deltaX = touch.clientX - gestureState.startX;
    const deltaY = touch.clientY - gestureState.startY;
    
    setGestureState(prev => ({
      ...prev,
      currentX: touch.clientX,
      currentY: touch.clientY,
      deltaX,
      deltaY
    }));
  }, [gestureState.isDragging, gestureState.startX, gestureState.startY]);

  const handleGestureEnd = useCallback(() => {
    setGestureState(prev => ({
      ...prev,
      isDragging: false,
      deltaX: 0,
      deltaY: 0
    }));
  }, []);

  return {
    gestureState,
    handleGestureStart,
    handleGestureMove,
    handleGestureEnd
  };
};

// Custom Hook für Mobile Viewport Management
export const useMobileViewport = () => {
  const [viewport, setViewport] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
    isMobile: window.innerWidth < 768,
    isTablet: window.innerWidth >= 768 && window.innerWidth < 1024,
    isDesktop: window.innerWidth >= 1024
  });

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      setViewport({
        width,
        height,
        isMobile: width < 768,
        isTablet: width >= 768 && width < 1024,
        isDesktop: width >= 1024
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return viewport;
};

// Custom Hook für Mobile Performance Monitoring
export const useMobilePerformance = () => {
  const [performanceMetrics, setPerformanceMetrics] = useState({
    renderTime: 0,
    memoryUsage: 0,
    isSlowDevice: false
  });

  useEffect(() => {
    const startTime = performance.now();
    
    // Memory usage (if available)
    const memory = (performance as any).memory;
    const memoryUsage = memory ? memory.usedJSHeapSize / memory.jsHeapSizeLimit : 0;
    
    // Detect slow device based on hardware concurrency
    const isSlowDevice = navigator.hardwareConcurrency <= 2;
    
    const endTime = performance.now();
    const renderTime = endTime - startTime;
    
    setPerformanceMetrics({
      renderTime,
      memoryUsage,
      isSlowDevice
    });
  }, []);

  return performanceMetrics;
};

// Custom Hook für Mobile State Persistence
export const useMobileStatePersistence = (key: string, defaultValue: any) => {
  const [state, setState] = useState(() => {
    try {
      const saved = localStorage.getItem(key);
      return saved ? JSON.parse(saved) : defaultValue;
    } catch {
      return defaultValue;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch (error) {
      console.warn('Failed to save state to localStorage:', error);
    }
  }, [key, state]);

  return [state, setState] as const;
};

// Custom Hook für Mobile Network Status
export const useMobileNetworkStatus = () => {
  const [networkStatus, setNetworkStatus] = useState({
    isOnline: navigator.onLine,
    connectionType: 'unknown',
    effectiveType: 'unknown'
  });

  useEffect(() => {
    const handleOnline = () => {
      setNetworkStatus(prev => ({ ...prev, isOnline: true }));
    };

    const handleOffline = () => {
      setNetworkStatus(prev => ({ ...prev, isOnline: false }));
    };

    const handleConnectionChange = () => {
      const connection = (navigator as any).connection;
      if (connection) {
        setNetworkStatus(prev => ({
          ...prev,
          connectionType: connection.type || 'unknown',
          effectiveType: connection.effectiveType || 'unknown'
        }));
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    if ((navigator as any).connection) {
      (navigator as any).connection.addEventListener('change', handleConnectionChange);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      
      if ((navigator as any).connection) {
        (navigator as any).connection.removeEventListener('change', handleConnectionChange);
      }
    };
  }, []);

  return networkStatus;
};

// Custom Hook für Mobile Theme Management
export const useMobileTheme = () => {
  const [theme, setTheme] = useState<'light' | 'dark' | 'auto'>(() => {
    const saved = localStorage.getItem('mobile-theme');
    return (saved as 'light' | 'dark' | 'auto') || 'auto';
  });

  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('dark');

  useEffect(() => {
    const updateResolvedTheme = () => {
      if (theme === 'auto') {
        setResolvedTheme(window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
      } else {
        setResolvedTheme(theme);
      }
    };

    updateResolvedTheme();
    
    if (theme === 'auto') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      mediaQuery.addEventListener('change', updateResolvedTheme);
      
      return () => mediaQuery.removeEventListener('change', updateResolvedTheme);
    }
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('mobile-theme', theme);
    document.documentElement.setAttribute('data-theme', resolvedTheme);
  }, [theme, resolvedTheme]);

  return {
    theme,
    resolvedTheme,
    setTheme
  };
};
