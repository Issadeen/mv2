'use client';
import { useState, useRef, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { FaPlay, FaPause, FaExpand, FaCompress, FaVolumeUp, FaVolumeMute, FaInfoCircle } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import LoadingSpinner from './LoadingSpinner';

interface VideoPlayerProps {
  videoUrl: string;
  title: string;
  onClose?: () => void;
  isOpen?: boolean;
  isEmbed?: boolean;
  isLoading?: boolean;
  onProgress?: (progress: number) => void;
  onTimeUpdate?: (time: number) => void;
  initialTime?: number;
  showInfo?: boolean;
  onToggleInfo?: () => void;
  content?: any;
  autoPlay?: boolean;
  onSavePlaybackState?: (time: number) => void;
}

const getFullscreenElement = (): Element | null => {
  return (
    document.fullscreenElement ||
    (document as any).webkitFullscreenElement ||
    (document as any).mozFullScreenElement ||
    (document as any).msFullscreenElement
  );
};

const requestFullscreen = async (element: HTMLElement) => {
  if (element.requestFullscreen) {
    await element.requestFullscreen();
  } else if ((element as any).webkitRequestFullscreen) {
    await (element as any).webkitRequestFullscreen();
  } else if ((element as any).mozRequestFullScreen) {
    await (element as any).mozRequestFullScreen();
  } else if ((element as any).msRequestFullscreen) {
    await (element as any).msRequestFullscreen();
  }
};

const exitFullscreen = async () => {
  if (document.exitFullscreen) {
    await document.exitFullscreen();
  } else if ((document as any).webkitExitFullscreen) {
    await (document as any).webkitExitFullscreen();
  } else if ((document as any).mozCancelFullScreen) {
    await (document as any).mozCancelFullScreen();
  } else if ((document as any).msExitFullscreen) {
    await (document as any).msExitFullscreen();
  }
};

const InfoOverlay = ({ content, isVisible, onClose }: { 
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
    <motion.div
      initial={{ y: 50 }}
      animate={{ y: 0 }}
      className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black via-black/95 to-transparent"
      onClick={e => e.stopPropagation()}
    >
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
    </motion.div>
  </motion.div>
);

export default function VideoPlayer({ 
  videoUrl, 
  title, 
  onClose, 
  isOpen, 
  isEmbed, 
  isLoading,
  onProgress,
  onTimeUpdate,
  initialTime = 0,
  showInfo = false,
  onToggleInfo,
  content,
  autoPlay = true,
  onSavePlaybackState,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [lastUpdateTime, setLastUpdateTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isControlsVisible, setIsControlsVisible] = useState(true);
  const updateInterval = 5000;

  // Add control functions
  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsMuted(!isMuted);
    }
  };

  // Update playback state handler
  const handleTimeUpdate = () => {
    if (!videoRef.current || !onSavePlaybackState) return;

    const currentTime = Date.now();
    if (currentTime - lastUpdateTime >= updateInterval) {
      const time = videoRef.current.currentTime;
      onSavePlaybackState(time);
      setCurrentTime(time);
      setProgress((time / videoRef.current.duration) * 100);
      setLastUpdateTime(currentTime);
    }
  };

  // Controls visibility
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    const handleMouseMove = () => {
      setIsControlsVisible(true);
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        if (isPlaying) {
          setIsControlsVisible(false);
        }
      }, 3000);
    };

    document.addEventListener('mousemove', handleMouseMove);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      clearTimeout(timeout);
    };
  }, [isPlaying]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && videoRef.current) {
        videoRef.current.pause();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Handle fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const toggleFullscreen = () => {
    if (!containerRef.current) return;

    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  if (isEmbed) {
    return (
      <div ref={containerRef} className="relative w-full h-full bg-black group">
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm"
            >
              <LoadingSpinner size="lg" />
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="relative w-full h-full"
            >
              <iframe
                src={videoUrl}
                className="w-full h-full"
                allowFullScreen
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                style={{ border: 'none' }}
                onError={() => setError('Failed to load video')}
              />
              
              {/* Fullscreen button */}
              <button
                onClick={toggleFullscreen}
                className="absolute bottom-4 right-4 p-2 bg-black/50 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
              >
                {isFullscreen ? (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20H5a2 2 0 01-2-2v-4m14 0v4a2 2 0 01-2 2h-4m0-16h4a2 2 0 012 2v4M5 4h4a2 2 0 012 2v4" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 3h6m0 0v6m0-6L14 10M9 21H3m0 0v-6m0 6l7-7" />
                  </svg>
                )}
              </button>

              {error && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/80">
                  <div className="text-center">
                    <p className="text-red-400 mb-4">{error}</p>
                    <button
                      onClick={() => window.location.reload()}
                      className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
                    >
                      Try Again
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef} 
      className={`relative w-full h-full bg-black group touch-none ${
        isControlsVisible ? '' : 'cursor-none'
      }`}
    >
      <video
        ref={videoRef}
        src={videoUrl}
        className="w-full h-full"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={() => {
          if (videoRef.current) {
            setDuration(videoRef.current.duration);
            if (initialTime) {
              videoRef.current.currentTime = initialTime;
            }
          }
        }}
        onClick={togglePlay}
        onTouchEnd={togglePlay}
        controlsList="nodownload"
        playsInline
      />

      {/* Controls Overlay - Mobile Optimized */}
      <motion.div
        initial={false}
        animate={{ opacity: isControlsVisible ? 1 : 0 }}
        transition={{ duration: 0.2 }}
        className="absolute inset-0 flex flex-col justify-between bg-gradient-to-b from-black/50 via-transparent to-black/50"
      >
        {/* Top Bar - Compact for Mobile */}
        <div className="flex justify-between items-center p-2 sm:p-4">
          <motion.h2 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-base sm:text-xl font-semibold text-white drop-shadow-lg truncate flex items-center gap-2 max-w-[70%]"
          >
            {title}
            {content && (
              <button
                onClick={() => onToggleInfo?.()}
                className="p-1.5 sm:p-2 rounded-full bg-black/50 hover:bg-black/70 transition-colors"
              >
                <FaInfoCircle className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            )}
          </motion.h2>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 sm:p-2 rounded-full bg-black/50 hover:bg-black/70 transition-colors"
            >
              <XMarkIcon className="w-4 h-4 sm:w-6 sm:h-6" />
            </button>
          )}
        </div>

        {/* Center Play Button - Adjusted Size for Mobile */}
        <div className="absolute inset-0 flex items-center justify-center">
          <AnimatePresence>
            {!isPlaying && isControlsVisible && (
              <motion.button
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5 }}
                onClick={togglePlay}
                className="w-14 h-14 sm:w-20 sm:h-20 flex items-center justify-center rounded-full bg-emerald-500/80 hover:bg-emerald-500 transition-colors"
              >
                <FaPlay className="w-6 h-6 sm:w-8 sm:h-8 ml-1" />
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        {/* Bottom Controls - Mobile Optimized */}
        <div className="p-2 sm:p-4 space-y-1 sm:space-y-2">
          {/* Progress Bar - Larger touch target */}
          <div 
            className="relative h-2 sm:h-1.5 bg-white/20 cursor-pointer rounded-full overflow-hidden" 
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const pos = (e.clientX - rect.left) / rect.width;
              if (videoRef.current) {
                videoRef.current.currentTime = pos * videoRef.current.duration;
              }
            }}
          >
            <motion.div 
              className="absolute h-full bg-emerald-500"
              style={{ width: `${progress}%` }}
              transition={{ duration: 0.1 }}
            >
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-3 sm:h-3 bg-emerald-400 rounded-full transform scale-0 group-hover:scale-100 transition-transform" />
            </motion.div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 sm:space-x-4">
              <button 
                onClick={togglePlay} 
                className="p-1.5 sm:p-2 rounded-full hover:bg-white/10 transition-colors"
              >
                {isPlaying ? <FaPause className="w-4 h-4 sm:w-5 sm:h-5" /> : <FaPlay className="w-4 h-4 sm:w-5 sm:h-5" />}
              </button>
              <button 
                onClick={toggleMute} 
                className="p-1.5 sm:p-2 rounded-full hover:bg-white/10 transition-colors"
              >
                {isMuted ? <FaVolumeMute className="w-4 h-4 sm:w-5 sm:h-5" /> : <FaVolumeUp className="w-4 h-4 sm:w-5 sm:h-5" />}
              </button>
              <div className="flex items-center space-x-1 sm:space-x-2">
                <span className="text-xs sm:text-sm font-medium">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-1 sm:space-x-2">
              <button
                onClick={toggleFullscreen} 
                className="p-1.5 sm:p-2 rounded-full hover:bg-white/10 transition-colors"
              >
                {isFullscreen ? <FaCompress className="w-4 h-4 sm:w-5 sm:h-5" /> : <FaExpand className="w-4 h-4 sm:w-5 sm:h-5" />}
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Info Overlay */}
      {content && (
        <InfoOverlay
          content={content}
          isVisible={showInfo}
          onClose={() => onToggleInfo?.()}
        />
      )}
    </div>
  );
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}