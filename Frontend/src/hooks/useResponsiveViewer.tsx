import { useState, useEffect } from 'react';

interface UseResponsiveViewerReturn {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  viewerType: 'mobile' | 'desktop';
}

export const useResponsiveViewer = (): UseResponsiveViewerReturn => {
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [viewerType, setViewerType] = useState<'mobile' | 'desktop'>('desktop');

  useEffect(() => {
    const checkDevice = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      // Mobile: < 768px
      const mobile = width < 768;
      // Tablet: 768px - 1023px
      const tablet = width >= 768 && width < 1024;
      // Desktop: >= 1024px
      const desktop = width >= 1024;
      
      setIsMobile(mobile);
      setIsTablet(tablet);
      setIsDesktop(desktop);
      
      // Use mobile viewer for mobile and tablet
      setViewerType(mobile || tablet ? 'mobile' : 'desktop');
    };
    
    checkDevice();
    window.addEventListener('resize', checkDevice);
    
    return () => window.removeEventListener('resize', checkDevice);
  }, []);

  return {
    isMobile,
    isTablet,
    isDesktop,
    viewerType
  };
};