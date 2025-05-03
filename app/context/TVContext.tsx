'use client';

import React, { createContext, useState, useContext, useEffect } from 'react';

interface TVContextProps {
  isTV: boolean;
  setIsTV: React.Dispatch<React.SetStateAction<boolean>>;
}

const TVContext = createContext<TVContextProps | undefined>(undefined);

export function TVProvider({ children }: { children: React.ReactNode }) {
  const [isTV, setIsTV] = useState(false);

  // Detect if running on TV (common TV devices or large screens)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // Check user agent for common TV platforms
    const userAgent = navigator.userAgent.toLowerCase();
    const isTVDevice = 
      /\b(smart-tv|smarttv|webos|tizen|vidaa|hbbtv|netcast|appletv|roku|tvos|androidtv|chromecast|fire tv)\b/i.test(userAgent);
    
    // Also check screen dimensions (most TVs are at least 1080p)
    const hasLargeScreen = window.innerWidth >= 1920 && window.innerHeight >= 1080;
    
    // Check for TV UI flags from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const hasExplicitTVParam = urlParams.has('tv') || urlParams.has('tv_mode');
    
    setIsTV(isTVDevice || (hasLargeScreen && hasExplicitTVParam));

    // Add TV-specific classes if needed
    if (isTVDevice || (hasLargeScreen && hasExplicitTVParam)) {
      document.documentElement.classList.add('tv-device');
      document.body.classList.add('tv-optimized');
    }
  }, []);

  return (
    <TVContext.Provider value={{ isTV, setIsTV }}>
      {children}
    </TVContext.Provider>
  );
}

export const useTV = () => {
  const context = useContext(TVContext);
  if (context === undefined) {
    throw new Error('useTV must be used within a TVProvider');
  }
  return context;
};
