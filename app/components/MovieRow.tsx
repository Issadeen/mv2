'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { FaChevronLeft, FaChevronRight, FaPlay, FaRegHeart, FaHeart } from 'react-icons/fa';
import { Movie } from '../types/media';
import { useMovies } from '../context/MoviesContext';

interface MovieRowProps {
  title: string;
  movies: Movie[];
  link: string;
}

export default function MovieRow({ title, movies, link }: MovieRowProps) {
  const { isMediaInWatchlist, addToWatchlist, removeFromWatchlist } = useMovies();
  const [showControls, setShowControls] = useState(false);
  const rowRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (rowRef.current) {
      const { scrollLeft, clientWidth } = rowRef.current;
      const scrollTo = direction === 'left' 
        ? scrollLeft - clientWidth * 0.75
        : scrollLeft + clientWidth * 0.75;
      
      rowRef.current.scrollTo({
        left: scrollTo,
        behavior: 'smooth'
      });
    }
  };

  if (!movies || movies.length === 0) return null;

  return (
    <div 
      className="mb-8 md:mb-12"
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl md:text-2xl font-bold text-white">{title}</h2>
        <Link href={link} className="text-sm text-emerald-400 hover:text-emerald-300 transition-colors">
          View All
        </Link>
      </div>
      
      <div className="relative group">
        {/* Left scroll button */}
        <button 
          onClick={() => scroll('left')}
          className={`absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-black/50 rounded-full p-2 text-white transform transition duration-300 ${
            showControls ? 'opacity-80 -translate-x-0 hover:opacity-100' : 'opacity-0 -translate-x-10'
          }`}
          aria-label="Scroll left"
        >
          <FaChevronLeft className="w-5 h-5" />
        </button>
        
        {/* Movie row */}
        <div 
          ref={rowRef}
          className="flex space-x-4 overflow-x-scroll scrollbar-hide pb-4"
        >
          {movies.map((movie) => (
            <div 
              key={movie.id} 
              className="flex-shrink-0 w-[160px] md:w-[200px] relative group/item"
            >
              <Link href={`/watch/${movie.id}?type=movie`}>
                <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-slate-800 shadow-lg">
                  {movie.poster_path ? (
                    <img 
                      src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
                      alt={movie.title}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover/item:scale-105"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      No Image
                    </div>
                  )}
                  
                  {/* Overlay on hover */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent opacity-0 group-hover/item:opacity-100 transition-opacity flex flex-col justify-end p-3">
                    <h3 className="text-sm font-medium line-clamp-1 text-white">{movie.title}</h3>
                    <div className="flex items-center gap-1 text-xs text-gray-300 mt-1">
                      <span>{new Date(movie.release_date || '').getFullYear() || 'N/A'}</span>
                      {movie.vote_average > 0 && (
                        <>
                          <span className="opacity-50">•</span>
                          <span className="flex items-center gap-0.5">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                            {movie.vote_average.toFixed(1)}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
              
              {/* Action buttons */}
              <div className="absolute top-2 right-2 z-10 opacity-0 group-hover/item:opacity-100 transition-opacity">
                <button
                  onClick={() => isMediaInWatchlist(movie.id)
                    ? removeFromWatchlist(movie.id)
                    : addToWatchlist(movie)
                  }
                  className="p-1.5 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors mb-1.5"
                  aria-label={isMediaInWatchlist(movie.id) ? 'Remove from watchlist' : 'Add to watchlist'}
                >
                  {isMediaInWatchlist(movie.id) ? (
                    <FaHeart className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <FaRegHeart className="w-3.5 h-3.5" />
                  )}
                </button>
                <Link href={`/watch/${movie.id}?type=movie`}>
                  <button
                    className="p-1.5 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
                    aria-label="Play movie"
                  >
                    <FaPlay className="w-3.5 h-3.5" />
                  </button>
                </Link>
              </div>
            </div>
          ))}
        </div>
        
        {/* Right scroll button */}
        <button 
          onClick={() => scroll('right')}
          className={`absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-black/50 rounded-full p-2 text-white transition duration-300 ${
            showControls ? 'opacity-80 translate-x-0 hover:opacity-100' : 'opacity-0 translate-x-10'
          }`}
          aria-label="Scroll right"
        >
          <FaChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
