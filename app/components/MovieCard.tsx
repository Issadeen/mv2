'use client';
import { motion } from 'framer-motion';
import { FaPlay, FaHeart, FaStar, FaCalendar } from 'react-icons/fa';
import Link from 'next/link';

interface MovieCardProps {
  id: number;
  title: string;
  posterPath: string;
  releaseDate?: string;
  voteAverage?: number;
  mediaType?: 'movie' | 'tv';
  isInWatchlist?: boolean;
  onAddToWatchlist?: () => void;
  onRemoveFromWatchlist?: () => void;
  onPlayTrailer?: () => void;
}

export default function MovieCard({
  id,
  title,
  posterPath,
  releaseDate,
  voteAverage,
  mediaType = 'movie',
  isInWatchlist,
  onAddToWatchlist,
  onRemoveFromWatchlist,
  onPlayTrailer
}: MovieCardProps) {
  const year = releaseDate ? new Date(releaseDate).getFullYear() : null;
  const rating = voteAverage ? voteAverage.toFixed(1) : null;

  return (
    <motion.div
      layout
      className="movie-card group"
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.98 }}
    >
      <Link href={`/watch/${id}?type=${mediaType}`}>
        <img
          src={`https://image.tmdb.org/t/p/w500${posterPath}`}
          alt={title}
          className="w-full h-full object-cover"
          loading="lazy"
        />
        <div className="movie-info p-4">
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <h3 className="text-lg font-semibold mb-2 line-clamp-1">{title}</h3>
            <div className="flex items-center gap-3 text-sm text-gray-300">
              {year && (
                <div className="flex items-center">
                  <FaCalendar className="w-3 h-3 mr-1" />
                  <span>{year}</span>
                </div>
              )}
              {rating && (
                <div className="flex items-center text-emerald-400">
                  <FaStar className="w-3 h-3 mr-1" />
                  <span>{rating}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </Link>

      {/* Action buttons */}
      <div className="absolute top-2 right-2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={onPlayTrailer}
          className="p-2 rounded-full bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-colors"
        >
          <FaPlay className="w-4 h-4" />
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={isInWatchlist ? onRemoveFromWatchlist : onAddToWatchlist}
          className={`p-2 rounded-full backdrop-blur-sm transition-colors ${
            isInWatchlist 
              ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30' 
              : 'bg-white/10 hover:bg-white/20'
          }`}
        >
          <FaHeart className="w-4 h-4" />
        </motion.button>
      </div>

      {/* Mobile touch overlay */}
      <div className="absolute inset-0 md:hidden" onClick={(e) => {
        // Prevent navigation on touch devices when touching action buttons
        const target = e.target as HTMLElement;
        if (target.closest('button')) {
          e.preventDefault();
        }
      }} />
    </motion.div>
  );
} 