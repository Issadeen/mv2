'use client';
import { motion, AnimatePresence } from 'framer-motion';
import { FaPlay, FaPause, FaExpand, FaCompress, FaVolumeUp, FaVolumeMute } from 'react-icons/fa';
import { useState, useEffect, useCallback } from 'react';

interface VideoControlsProps {
  isPlaying: boolean;
  isMuted: boolean;
  isFullscreen: boolean;
  duration: number;
  currentTime: number;
  onPlayPause: () => void;
  onMuteToggle: () => void;
  onFullscreenToggle: () => void;
  onSeek: (time: number) => void;
  onHide: () => void;
}

export default function VideoControls({
  isPlaying,
  isMuted,
  isFullscreen,
  duration,
  currentTime,
  onPlayPause,
  onMuteToggle,
  onFullscreenToggle,
  onSeek,
  onHide
}: VideoControlsProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [isDragging, setIsDragging] = useState(false);

  // Format time in MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Hide controls after inactivity
  useEffect(() => {
    if (!isDragging && isPlaying) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        onHide();
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [isPlaying, isDragging, onHide]);

  // Show controls on mouse move
  const handleMouseMove = useCallback(() => {
    setIsVisible(true);
  }, []);

  useEffect(() => {
    document.addEventListener('mousemove', handleMouseMove);
    return () => document.removeEventListener('mousemove', handleMouseMove);
  }, [handleMouseMove]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/80 via-black/40 to-transparent"
        >
          {/* Progress bar */}
          <div className="px-4 py-2">
            <div 
              className="relative h-1 bg-white/20 rounded-full cursor-pointer touch-none"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const pos = (e.clientX - rect.left) / rect.width;
                onSeek(pos * duration);
              }}
            >
              <motion.div
                className="absolute left-0 top-0 h-full bg-emerald-400 rounded-full"
                style={{ width: `${(currentTime / duration) * 100}%` }}
              />
              <motion.div
                className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-emerald-400 rounded-full -ml-2 shadow-lg"
                style={{ left: `${(currentTime / duration) * 100}%` }}
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0}
                dragMomentum={false}
                onDragStart={() => setIsDragging(true)}
                onDragEnd={(e, info) => {
                  setIsDragging(false);
                  const target = e.target as HTMLDivElement;
                  const parent = target.parentElement;
                  if (parent) {
                    const rect = parent.getBoundingClientRect();
                    const pos = (info.point.x - rect.left) / rect.width;
                    onSeek(Math.max(0, Math.min(1, pos)) * duration);
                  }
                }}
              />
            </div>
            <div className="flex justify-between mt-1 text-sm text-gray-400">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Control buttons */}
          <div className="px-4 py-2 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={onPlayPause}
                className="w-12 h-12 flex items-center justify-center rounded-full bg-white/10 backdrop-blur-sm hover:bg-white/20"
              >
                {isPlaying ? <FaPause /> : <FaPlay />}
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={onMuteToggle}
                className="w-12 h-12 flex items-center justify-center rounded-full bg-white/10 backdrop-blur-sm hover:bg-white/20"
              >
                {isMuted ? <FaVolumeMute /> : <FaVolumeUp />}
              </motion.button>
            </div>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={onFullscreenToggle}
              className="w-12 h-12 flex items-center justify-center rounded-full bg-white/10 backdrop-blur-sm hover:bg-white/20"
            >
              {isFullscreen ? <FaCompress /> : <FaExpand />}
            </motion.button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
} 