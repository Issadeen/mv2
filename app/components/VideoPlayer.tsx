'use client';
import { useState, useRef, useEffect, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import LoadingSpinner from './LoadingSpinner';
import { VideoPlayerProps } from '../types/player';
import { useTV } from '../context/TVContext';

const InfoOverlay = memo(({ content, isVisible, onClose }: { 
  content: any; 
  isVisible: boolean; 
  onClose: () => void;
}) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: isVisible ? 1 : 0 }}
    transition={{ duration: 0.3 }}
    className={`fixed inset-0 bg-black/80 z-50 ${isVisible ? '' : 'pointer-events-none'}`}
    onClick={onClose}
  >
    <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black via-black/95 to-transparent">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-2xl font-bold mb-4">{content.title || content.name}</h2>
        <p className="text-gray-300 mb-4">{content.overview}</p>
        {content.genres && (
          <div className="flex flex-wrap gap-2">
            {content.genres.map((genre: any) => (
              <span 
                key={genre.id}
                className="px-3 py-1 text-sm bg-emerald-500/20 text-emerald-400 rounded-full"
              >
                {genre.name}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  </motion.div>
));

InfoOverlay.displayName = 'InfoOverlay';

export default function VideoPlayer({ 
  videoUrl, 
  title, 
  isEmbed, 
  isLoading,
  content,
  showInfo,
  onToggleInfo,
  error,
  onError
}: VideoPlayerProps) {
  const [retryCount, setRetryCount] = useState(0);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const userAgent = typeof window !== 'undefined' ? window.navigator.userAgent.toLowerCase() : '';
  const isWebOS = /\b(webos)\b/i.test(userAgent);
  const { isTV } = useTV();
  const [internalError, setInternalError] = useState<string | null>(null);
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const maxRetries = 1;
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);
  const lastUrlRef = useRef<string | null>(null);
  const [iframeKey, setIframeKey] = useState<string>('initial');

  // Handle fullscreen for WebOS
  useEffect(() => {
    if (isWebOS) {
      // Find the scroll container and disable scrolling when video is playing
      const scrollContainer = document.querySelector('.webos-scroll-container') as HTMLElement;
      if (scrollContainer && videoUrl) {
        scrollContainer.style.overflow = 'hidden';
        document.body.style.overflow = 'hidden';
      }

      return () => {
        // Re-enable scrolling when component unmounts
        if (scrollContainer) {
          scrollContainer.style.overflow = 'auto';
          document.body.style.overflow = 'auto';
        }
      };
    }
  }, [isWebOS, videoUrl]);

  // Handle first load for TV devices
  useEffect(() => {
    if ((isTV || isWebOS) && isFirstLoad && videoUrl) {
      const timer = setTimeout(() => {
        setIsFirstLoad(false);
      }, isWebOS ? 3000 : 2000); // Give WebOS more time for initial load

      return () => clearTimeout(timer);
    }
  }, [isTV, isWebOS, isFirstLoad, videoUrl]);

  const handleRetry = useCallback(() => {
    if (!mountedRef.current || retryCount >= maxRetries) {
      setInternalError('Maximum retry attempts reached. Please try a different source.');
      return;
    }

    setRetryCount(prev => prev + 1);
    setInternalError(null);

    if (iframeRef.current && videoUrl) {
      const currentUrl = videoUrl;
      iframeRef.current.src = 'about:blank';
      
      // Longer delay for WebOS to prevent refresh loops
      const retryDelay = isWebOS ? 3000 : isTV ? 2000 : 1000;
      
      retryTimeoutRef.current = setTimeout(() => {
        if (mountedRef.current && iframeRef.current) {
          iframeRef.current.src = currentUrl;
        }
      }, retryDelay);
    }
  }, [retryCount, maxRetries, videoUrl, isTV, isWebOS]);

  // Prevent reload if URL hasn't changed
  useEffect(() => {
    if (!videoUrl || videoUrl === lastUrlRef.current) return;
    lastUrlRef.current = videoUrl;
    
    setInternalError(null);
    setRetryCount(0);
    setIsFirstLoad(true);
    setIframeKey(Date.now().toString());

    if (iframeRef.current) {
      if (isWebOS) {
        iframeRef.current.src = videoUrl;
      } else {
        iframeRef.current.src = videoUrl;
      }
    }
  }, [videoUrl, isWebOS]);

  // Handle WebOS-specific loading
  const handleWebOSLoad = useCallback(() => {
    if (!isWebOS || !iframeRef.current) return;
    
    const iframe = iframeRef.current;
    try {
      if (!iframe.contentWindow) {
        if (retryCount < maxRetries) {
          setRetryCount(prev => prev + 1);
          iframe.src = videoUrl || '';
        } else {
          setInternalError('Unable to load video. Please try again.');
          onError?.();
        }
      }
    } catch (error) {
      console.log('Loading...');
    }
  }, [isWebOS, videoUrl, retryCount, maxRetries, onError]);

  useEffect(() => {
    if (!isWebOS || !iframeRef.current) return;

    const iframe = iframeRef.current;
    iframe.addEventListener('load', handleWebOSLoad);

    return () => {
      iframe.removeEventListener('load', handleWebOSLoad);
    };
  }, [isWebOS, handleWebOSLoad]);

  // Cleanup on unmount
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
      lastUrlRef.current = null;
    };
  }, []);

  if (!videoUrl) {
    return (
      <div className="flex items-center justify-center w-full h-full bg-black">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div 
      className={`relative w-full h-full bg-black group ${isWebOS ? 'webos-player' : isTV ? 'tv-optimized-player' : ''}`}
      style={{ 
        position: (isTV || isWebOS) ? 'fixed' : 'relative',
        top: (isTV || isWebOS) ? 0 : undefined,
        left: (isTV || isWebOS) ? 0 : undefined,
        width: (isTV || isWebOS) ? '100vw' : '100%',
        height: (isTV || isWebOS) ? '100vh' : '100%',
        zIndex: (isTV || isWebOS) ? 9999 : undefined,
        overflow: 'hidden',
        touchAction: 'none',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        WebkitTouchCallout: 'none'
      }}
    >
      <AnimatePresence mode="wait">
        {isLoading || ((isTV || isWebOS) && isFirstLoad) ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          >
            <LoadingSpinner size="lg" />
          </motion.div>
        ) : (error || internalError) ? (
          <motion.div
            key="error"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center bg-black/80"
          >
            <div className="text-center px-4">
              <p className="text-red-400 mb-4">{error || internalError}</p>
              <button
                onClick={handleRetry}
                className="px-6 py-3 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
              >
                Try Again ({maxRetries - retryCount} attempts left)
              </button>
            </div>
          </motion.div>
        ) : (
          <div key="player" className="relative w-full h-full">
            <iframe
              ref={iframeRef}
              key={iframeKey}
              src={videoUrl}
              className={`w-full h-full ${isWebOS ? 'webos-iframe' : ''}`}
              allowFullScreen
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              style={{ 
                border: 'none',
                position: (isTV || isWebOS) ? 'fixed' : 'absolute',
                top: (isTV || isWebOS) ? '0' : '50%',
                left: (isTV || isWebOS) ? '0' : '50%',
                transform: (isTV || isWebOS) ? 'none' : 'translate(-50%, -50%)',
                width: (isTV || isWebOS) ? '100vw' : '100%',
                height: (isTV || isWebOS) ? '100vh' : '100%',
                zIndex: (isTV || isWebOS) ? 9999 : undefined,
                backgroundColor: '#000',
                overflow: 'hidden'
              }}
              onLoad={() => { if(isFirstLoad) setIsFirstLoad(false); }}
              onError={handleRetry}
            />
          </div>
        )}
      </AnimatePresence>

      {showInfo && content && !isTV && !isWebOS && (
        <InfoOverlay
          content={content}
          isVisible={showInfo}
          onClose={() => onToggleInfo?.()}
        />
      )}
    </div>
  );
}