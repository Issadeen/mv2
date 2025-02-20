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
      {/* Content details */}
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
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isInfoVisible, setIsInfoVisible] = useState(false);
  const [isControlsVisible, setIsControlsVisible] = useState(true);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  useEffect(() => {
    if (!isEmbed && videoRef.current) {
      videoRef.current.muted = isMuted;
      if (isPlaying) {
        videoRef.current.play().catch(error => console.error("Playback failed:", error));
      } else {
        videoRef.current.pause();
      }
    }
  }, [isPlaying, isMuted, videoUrl, isEmbed]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, []);

  const togglePlay = () => setIsPlaying(!isPlaying);
  const toggleMute = () => setIsMuted(!isMuted);
  
  const toggleFullscreen = async () => {
    try {
      const container = containerRef.current;
      if (!container) return;

      if (!getFullscreenElement()) {
        await requestFullscreen(container);
        setIsFullscreen(true);
      } else {
        await exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (err) {
      console.error('Fullscreen error:', err);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!getFullscreenElement());
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, []);

  useEffect(() => {
    const handleMouseMove = () => {
      setIsControlsVisible(true);
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
      controlsTimeoutRef.current = setTimeout(() => {
        if (!isPlaying) return;
        setIsControlsVisible(false);
      }, 3000);
    };

    document.addEventListener('mousemove', handleMouseMove);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [isPlaying]);

  useEffect(() => {
    if (!isEmbed && videoRef.current && initialTime) {
      videoRef.current.currentTime = initialTime;
    }
  }, [initialTime, isEmbed]);

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const currentTime = videoRef.current.currentTime;
    const duration = videoRef.current.duration;
    const progress = (currentTime / duration) * 100;
    setProgress(progress);
    setCurrentTime(currentTime);
    onProgress?.(progress);
    onTimeUpdate?.(currentTime);
  };

  const handleKeyPress = (e: KeyboardEvent) => {
    switch(e.key) {
      case ' ':
        e.preventDefault();
        togglePlay();
        break;
      case 'f':
        toggleFullscreen();
        break;
      case 'm':
        toggleMute();
        break;
      case 'ArrowRight':
        if (videoRef.current) {
          videoRef.current.currentTime += 10;
        }
        break;
      case 'ArrowLeft':
        if (videoRef.current) {
          videoRef.current.currentTime -= 10;
        }
        break;
    }
  };

  useEffect(() => {
    document.addEventListener('keydown', handleKeyPress);
    return () => {
      document.removeEventListener('keydown', handleKeyPress);
    };
  }, []);

  // Auto-play when ready
  useEffect(() => {
    if (autoPlay && videoRef.current && !isEmbed) {
      videoRef.current.play().catch(error => {
        console.error("Autoplay failed:", error);
      });
    }
  }, [autoPlay, isEmbed]);

  // Save playback state periodically
  useEffect(() => {
    const interval = setInterval(() => {
      if (videoRef.current && onSavePlaybackState) {
        onSavePlaybackState(videoRef.current.currentTime);
      }
    }, 5000); // Save every 5 seconds

    return () => clearInterval(interval);
  }, [onSavePlaybackState]);

  // Handle visibility change to pause/play
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
              />
              
              {/* Custom Overlay Controls */}
              <div className="absolute top-4 left-4 right-4 flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <motion.h2 
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-xl font-semibold text-white drop-shadow-lg truncate"
                >
                  {title}
                </motion.h2>
                <motion.div 
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2"
                >
                  <button
                    onClick={toggleFullscreen}
                    className="p-2 rounded-full bg-black/50 hover:bg-black/70 transition-colors"
                  >
                    {isFullscreen ? <FaCompress /> : <FaExpand />}
                  </button>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef} 
      className={`relative w-full h-full bg-black group ${
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
        controlsList="nodownload"
        playsInline
      />

      {/* Controls Overlay */}
      <motion.div
        initial={false}
        animate={{ opacity: isControlsVisible ? 1 : 0 }}
        transition={{ duration: 0.2 }}
        className="absolute inset-0 flex flex-col justify-between bg-gradient-to-b from-black/50 via-transparent to-black/50"
      >
        {/* Top Bar */}
        <div className="flex justify-between items-center p-4">
          <motion.h2 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-xl font-semibold text-white drop-shadow-lg truncate flex items-center gap-2"
          >
            {title}
            {content && (
              <button
                onClick={() => onToggleInfo?.()}
                className="p-2 rounded-full bg-black/50 hover:bg-black/70 transition-colors"
              >
                <FaInfoCircle className="w-5 h-5" />
              </button>
            )}
          </motion.h2>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 rounded-full bg-black/50 hover:bg-black/70 transition-colors"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          )}
        </div>

        {/* Center Play Button */}
        <div className="absolute inset-0 flex items-center justify-center">
          <AnimatePresence>
            {!isPlaying && isControlsVisible && (
              <motion.button
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5 }}
                onClick={togglePlay}
                className="w-20 h-20 flex items-center justify-center rounded-full bg-emerald-500/80 hover:bg-emerald-500 transition-colors"
              >
                <FaPlay className="w-8 h-8 ml-1" />
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        {/* Bottom Controls */}
        <div className="p-4 space-y-2">
          {/* Progress Bar */}
          <div 
            className="relative h-1.5 bg-white/20 cursor-pointer rounded-full overflow-hidden" 
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
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-emerald-400 rounded-full transform scale-0 group-hover:scale-100 transition-transform" />
            </motion.div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button 
                onClick={togglePlay} 
                className="p-2 rounded-full hover:bg-white/10 transition-colors"
              >
                {isPlaying ? <FaPause className="w-5 h-5" /> : <FaPlay className="w-5 h-5" />}
              </button>
              <button 
                onClick={toggleMute} 
                className="p-2 rounded-full hover:bg-white/10 transition-colors"
              >
                {isMuted ? <FaVolumeMute className="w-5 h-5" /> : <FaVolumeUp className="w-5 h-5" />}
              </button>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    if (videoRef.current) {
                      videoRef.current.currentTime -= 10;
                    }
                  }}
                  className="p-2 rounded-full hover:bg-white/10 transition-colors"
                >
                  -10s
                </button>
                <span className="text-sm font-medium">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </span>
                <button
                  onClick={() => {
                    if (videoRef.current) {
                      videoRef.current.currentTime += 10;
                    }
                  }}
                  className="p-2 rounded-full hover:bg-white/10 transition-colors"
                >
                  +10s
                </button>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => onToggleInfo?.()}
                className="p-2 rounded-full hover:bg-white/10 transition-colors"
              >
                <FaInfoCircle className="w-5 h-5" />
              </button>
              <button 
                onClick={toggleFullscreen} 
                className="p-2 rounded-full hover:bg-white/10 transition-colors"
              >
                {isFullscreen ? <FaCompress className="w-5 h-5" /> : <FaExpand className="w-5 h-5" />}
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