'use client';
import { useEffect, useRef, useState } from 'react';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const cleanupRef = useRef<(() => void)[]>([]);
  const [isWebOSInitialized, setIsWebOSInitialized] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const userAgent = window.navigator.userAgent.toLowerCase();
    const isWebOS = /\b(webos)\b/i.test(userAgent);
    
    if (isWebOS && !isWebOSInitialized) {
      document.documentElement.setAttribute('data-os', 'webos');
      document.body.setAttribute('data-os', 'webos');

      // Allow scrolling within the container but prevent body scroll
      const handleWheel = (e: WheelEvent) => {
        if (scrollContainerRef.current) {
          const container = scrollContainerRef.current;
          container.scrollTop += e.deltaY;
          e.preventDefault();
        }
      };

      // Handle touch scrolling
      let touchStartY = 0;
      const handleTouchStart = (e: TouchEvent) => {
        touchStartY = e.touches[0].clientY;
      };

      const handleTouchMove = (e: TouchEvent) => {
        if (!scrollContainerRef.current) return;
        const touchDeltaY = touchStartY - e.touches[0].clientY;
        scrollContainerRef.current.scrollTop += touchDeltaY;
        touchStartY = e.touches[0].clientY;
      };

      // Add scroll event listeners
      if (scrollContainerRef.current) {
        scrollContainerRef.current.addEventListener('wheel', handleWheel, { passive: false });
        scrollContainerRef.current.addEventListener('touchstart', handleTouchStart, { passive: true });
        scrollContainerRef.current.addEventListener('touchmove', handleTouchMove, { passive: true });

        cleanupRef.current.push(() => {
          if (scrollContainerRef.current) {
            scrollContainerRef.current.removeEventListener('wheel', handleWheel);
            scrollContainerRef.current.removeEventListener('touchstart', handleTouchStart);
            scrollContainerRef.current.removeEventListener('touchmove', handleTouchMove);
          }
        });
      }

      // Handle back button
      const handleBackButton = (e: KeyboardEvent) => {
        if (e.key === 'GoBack' || e.key === 'Exit' || e.key === 'Back') {
          e.preventDefault();
          e.stopPropagation();
        }
      };
      
      document.addEventListener('keydown', handleBackButton);
      cleanupRef.current.push(() => {
        document.removeEventListener('keydown', handleBackButton);
      });

      if ('scrollRestoration' in history) {
        history.scrollRestoration = 'manual';
      }

      const viewport = document.querySelector('meta[name=viewport]');
      if (viewport) {
        viewport.setAttribute('content', 
          'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover'
        );
      }

      setIsWebOSInitialized(true);
    }

    return () => {
      if (isWebOS) {
        document.documentElement.removeAttribute('data-os');
        document.body.removeAttribute('data-os');
      }
      cleanupRef.current.forEach(cleanup => cleanup());
      cleanupRef.current = [];
    };
  }, [isWebOSInitialized]);

  return (
    <div 
      ref={scrollContainerRef}
      className="webos-scroll-container"
      style={{
        height: '100vh',
        overflowY: 'auto',
        overflowX: 'hidden',
        WebkitOverflowScrolling: 'touch',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
      }}
    >
      {children}
    </div>
  );
}