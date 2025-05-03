'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { FaPlay, FaInfoCircle, FaHeart, FaRegHeart } from 'react-icons/fa';

import { useMovies } from './context/MoviesContext';
import * as tmdbApi from './services/tmdb';
import { Movie } from './types/media';

import LoadingSpinner from './components/LoadingSpinner';
import MovieRow from './components/MovieRow';
import TrailerModal from './components/TrailerModal';

const queryKeys = {
  latestMovies: 'latestMovies',
  popularMovies: 'popularMovies',
  topRatedMovies: 'topRatedMovies',
  upcomingMovies: 'upcomingMovies',
};

export default function Home() {
  const { watchlist, addToWatchlist, removeFromWatchlist, isMediaInWatchlist } = useMovies();

  const { data: latestMovies = [], isLoading: isLoadingLatest } = useQuery<Movie[]>({
    queryKey: [queryKeys.latestMovies],
    queryFn: tmdbApi.fetchLatestMovies,
  });
  const { data: popularMovies = [], isLoading: isLoadingPopular } = useQuery<Movie[]>({
    queryKey: [queryKeys.popularMovies],
    queryFn: tmdbApi.fetchPopularMovies,
  });
  const { data: topRatedMovies = [], isLoading: isLoadingTopRated } = useQuery<Movie[]>({
    queryKey: [queryKeys.topRatedMovies],
    queryFn: tmdbApi.fetchTopRatedMovies,
  });
  const { data: upcomingMovies = [], isLoading: isLoadingUpcoming } = useQuery<Movie[]>({
    queryKey: [queryKeys.upcomingMovies],
    queryFn: tmdbApi.fetchUpcomingMovies,
  });

  const isLoading = isLoadingLatest || isLoadingPopular || isLoadingTopRated || isLoadingUpcoming;

  const [currentMovieIndex, setCurrentMovieIndex] = useState(0);
  const [isTrailerOpen, setIsTrailerOpen] = useState(false);
  const [selectedTrailer, setSelectedTrailer] = useState({ url: '', title: '' });

  useEffect(() => {
    if (latestMovies.length > 1) {
      const timer = setInterval(() => {
        setCurrentMovieIndex((prev) => (prev + 1) % Math.min(latestMovies.length, 5));
      }, 8000);
      return () => clearInterval(timer);
    }
  }, [latestMovies]);

  const openTrailer = async (mediaId: number, mediaTitle: string | undefined, mediaType: 'movie' | 'tv') => {
    if (!mediaTitle) return;
    setSelectedTrailer({ url: '', title: mediaTitle });
    setIsTrailerOpen(true);
    try {
      const trailerUrl = mediaType === 'movie'
        ? await tmdbApi.fetchMovieTrailer(mediaId)
        : await tmdbApi.fetchTVShowTrailer(mediaId);

      if (trailerUrl) {
        setSelectedTrailer({ url: trailerUrl, title: mediaTitle });
      } else {
        console.warn(`No trailer found for ${mediaType} ${mediaId}`);
        setIsTrailerOpen(false);
      }
    } catch (error) {
      console.error('Failed to fetch trailer:', error);
      setIsTrailerOpen(false);
    }
  };

  const currentHeroMovie = latestMovies[currentMovieIndex];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-slate-900 to-slate-950">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="relative bg-gradient-to-b from-slate-900 to-slate-950 min-h-screen overflow-x-hidden">
      {latestMovies.length > 0 && currentHeroMovie && (
        <div className="relative h-[80vh] md:h-[90vh] w-full text-white">
          <AnimatePresence mode='wait'>
            <motion.div
              key={currentMovieIndex}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1 }}
              className="absolute inset-0"
            >
              {currentHeroMovie.backdrop_path && (
                <img
                  src={`https://image.tmdb.org/t/p/original${currentHeroMovie.backdrop_path}`}
                  alt={currentHeroMovie.title || 'Hero background'}
                  className="object-cover w-full h-full"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-r from-slate-900/90 via-slate-900/50 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent" />
            </motion.div>
          </AnimatePresence>

          <div className="relative z-10 flex items-center h-full px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
            <motion.div
              key={currentMovieIndex}
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="max-w-2xl"
            >
              <h1 className="mb-4 text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl text-white drop-shadow-lg">
                {currentHeroMovie.title}
              </h1>
              <p className="mb-8 text-lg text-gray-200 line-clamp-3 drop-shadow-md">
                {currentHeroMovie.overview}
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={() => openTrailer(currentHeroMovie.id, currentHeroMovie.title, 'movie')}
                  className="flex items-center heroButton bg-emerald-500 hover:bg-emerald-600 transition-colors duration-300 shadow-lg"
                >
                  <FaPlay className="w-5 h-5 mr-2" />
                  Watch Trailer
                </button>
                <Link href={`/watch/${currentHeroMovie.id}?type=movie`}>
                  <button className="flex items-center heroButton bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-colors duration-300 shadow-lg">
                    <FaInfoCircle className="w-5 h-5 mr-2" />
                    More Info
                  </button>
                </Link>
                <button
                  onClick={() => isMediaInWatchlist(currentHeroMovie.id)
                    ? removeFromWatchlist(currentHeroMovie.id)
                    : addToWatchlist(currentHeroMovie)
                  }
                  className="p-3 rounded-full bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-colors duration-300 shadow-lg"
                  aria-label={isMediaInWatchlist(currentHeroMovie.id) ? 'Remove from Watchlist' : 'Add to Watchlist'}
                >
                  {isMediaInWatchlist(currentHeroMovie.id)
                    ? <FaHeart className="w-5 h-5 text-emerald-400" />
                    : <FaRegHeart className="w-5 h-5" />
                  }
                </button>
              </div>
            </motion.div>
          </div>

          <div className="absolute bottom-5 left-1/2 transform -translate-x-1/2 flex space-x-2 z-10">
            {latestMovies.slice(0, 5).map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentMovieIndex(index)}
                className={`w-2.5 h-2.5 rounded-full transition-colors duration-300 ${currentMovieIndex === index ? 'bg-emerald-400 scale-125' : 'bg-white/40 hover:bg-white/70'}`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </div>
      )}

      <div className="relative px-4 py-12 mx-auto -mt-24 md:-mt-32 max-w-screen-2xl sm:px-6 lg:px-8 z-20">
        <MovieRow title="Trending Now" movies={[...popularMovies.slice(0, 10), ...topRatedMovies.slice(0, 10)]} link="/movies?category=popular" />
        <MovieRow title="Popular Movies" movies={popularMovies} link="/movies?category=popular" />
        <MovieRow title="Top Rated" movies={topRatedMovies} link="/movies?category=top-rated" />
        <MovieRow title="Upcoming" movies={upcomingMovies} link="/movies?category=upcoming" />
      </div>

      <TrailerModal
        isOpen={isTrailerOpen}
        onClose={() => setIsTrailerOpen(false)}
        trailerUrl={selectedTrailer.url}
        title={selectedTrailer.title}
      />
    </div>
  );
}
