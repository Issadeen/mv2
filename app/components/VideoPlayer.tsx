'use client';
import { useState, useRef, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { FaPlay, FaPause, FaExpand, FaCompress, FaVolumeUp, FaVolumeMute } from 'react-icons/fa';

interface VideoPlayerProps {
  videoUrl: string;
  title: string;
  onClose?: () => void;
  isOpen?: boolean;
}

export default function VideoPlayer({ videoUrl, title, onClose, isOpen }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  const isIframeSource = videoUrl.includes('vidsrc.xyz');

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isMuted;
      if (isPlaying) {
        videoRef.current.play().catch(error => console.error("Playback failed:", error));
      } else {
        videoRef.current.pause();
      }
    }
  }, [isPlaying, isMuted, videoUrl]);

  useEffect(() => {
    // Prevent scrolling when video is playing
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

      if (!document.fullscreenElement) {
        await container.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (err) {
      console.error(`Fullscreen error:`, err);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
      setProgress((videoRef.current.currentTime / videoRef.current.duration) * 100);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const progressBar = e.currentTarget;
    const clickPosition = (e.clientX - progressBar.getBoundingClientRect().left) / progressBar.offsetWidth;
    if (videoRef.current) {
      videoRef.current.currentTime = clickPosition * videoRef.current.duration;
      handleTimeUpdate();
    }
  };

  return (
    <div 
      ref={containerRef} 
      className="fixed inset-0 w-full h-full bg-black touch-none"
      onClick={(e) => e.preventDefault()}
    >
      {isIframeSource ? (
        <div className="relative w-full h-full">
          <iframe
            src={videoUrl}
            className="w-full h-full"
            allowFullScreen
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            style={{ 
              border: 'none',
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%'
            }}
          />
        </div>
      ) : videoUrl ? (
        <video
          ref={videoRef}
          src={videoUrl}
          className="w-full h-full object-contain" // Changed to object-contain
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onClick={togglePlay}
          controlsList="nodownload"
          playsInline
        />
      ) : (
        <div className="flex items-center justify-center h-full">
          <div className="w-16 h-16 border-4 border-emerald-400/20 border-t-emerald-400 rounded-full animate-spin" />
        </div>
      )}

      {/* Show controls only for direct video sources */}
      {!isIframeSource && (
        <div 
          className="absolute inset-0 flex flex-col justify-between opacity-0 hover:opacity-100 transition-opacity bg-gradient-to-b from-black/50 via-transparent to-black/50 z-20"
          onClick={(e) => e.preventDefault()}
        >
          {/* Top Bar */}
          <div className="flex items-center justify-between p-4">
            <h2 className="text-xl font-bold">{title}</h2>
            {onClose && (
              <button
                onClick={onClose}
                className="p-2 rounded-full bg-black/50 hover:bg-black/70 transition-colors"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            )}
          </div>

          {/* Bottom Controls */}
          <div className="p-4 space-y-2">
            {/* Progress Bar */}
            <div 
              className="w-full h-1 bg-gray-600 cursor-pointer"
              onClick={handleProgressClick}
            >
              <div 
                className="h-full bg-emerald-500 relative"
                style={{ width: `${progress}%` }}
              >
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-emerald-400 rounded-full" />
              </div>
            </div>

            {/* Control Buttons */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={togglePlay}
                  className="p-2 rounded-full bg-black/50 hover:bg-black/70 transition-colors"
                >
                  {isPlaying ? <FaPause /> : <FaPlay />}
                </button>
                <button
                  onClick={toggleMute}
                  className="p-2 rounded-full bg-black/50 hover:bg-black/70 transition-colors"
                >
                  {isMuted ? <FaVolumeMute /> : <FaVolumeUp />}
                </button>
                <span className="text-sm">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </span>
              </div>

              <button
                onClick={toggleFullscreen}
                className="p-2 rounded-full bg-black/50 hover:bg-black/70 transition-colors"
              >
                {isFullscreen ? <FaCompress /> : <FaExpand />}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}