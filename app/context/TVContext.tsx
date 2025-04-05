'use client';
import { createContext, useContext, useEffect, useState, useRef } from 'react';

type TVContextType = {
  isTV: boolean;
  isTVLoading: boolean;
  isWebOS: boolean;
  forceRetry: () => void;
};

const TVContext = createContext<TVContextType>({
  isTV: false,
  isTVLoading: true,
  isWebOS: false,
  forceRetry: () => {},
});

export function TVProvider({ children }: { children: React.ReactNode }) {
  const [isTV, setIsTV] = useState(false);
  const [isWebOS, setIsWebOS] = useState(false);
  const [isTVLoading, setIsTVLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const setupComplete = useRef(false);

  useEffect(() => {
    if (setupComplete.current) return;

    const detectTV = () => {
      const userAgent = navigator.userAgent.toLowerCase();
      const isTV = /\b(smarttv|smart-tv|tv|webos|tizen|vidaa|hbbtv)\b/i.test(userAgent);
      const isWebOS = /\b(webos)\b/i.test(userAgent);
      
      setIsTV(isTV);
      setIsWebOS(isWebOS);
      setIsTVLoading(false);

      if (isTV) {
        document.documentElement.classList.add('tv-device');
        if (isWebOS) {
          document.documentElement.classList.add('webos-tv');
        }
        document.body.classList.add('tv-optimized');
        
        if ('scrollRestoration' in history) {
          history.scrollRestoration = 'manual';
        }

        // WebOS specific optimizations
        if (isWebOS) {
          document.body.style.overscrollBehavior = 'none';
          document.documentElement.style.overscrollBehavior = 'none';
          document.body.style.touchAction = 'none';
          document.documentElement.style.touchAction = 'none';
          
          // Prevent reload gestures
          document.addEventListener('touchmove', (e) => {
            e.preventDefault();
          }, { passive: false });
        }

        // General TV optimizations
        document.body.style.overflow = 'hidden';
        document.documentElement.style.overflow = 'hidden';
      }
    };

    // Initial detection
    detectTV();
    setupComplete.current = true;

    // Cleanup function
    return () => {
      document.documentElement.classList.remove('tv-device', 'webos-tv');
      document.body.classList.remove('tv-optimized');
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
      document.body.style.overscrollBehavior = '';
      document.documentElement.style.overscrollBehavior = '';
      document.body.style.touchAction = '';
      document.documentElement.style.touchAction = '';
    };
  }, []);

  const forceRetry = () => {
    setRetryCount(prev => prev + 1);
  };

  return (
    <TVContext.Provider value={{ isTV, isWebOS, isTVLoading, forceRetry }}>
      {children}
    </TVContext.Provider>
  );
}

export const useTV = () => useContext(TVContext);