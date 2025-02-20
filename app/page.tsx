'use client';
import { useState, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { PlayIcon } from '@heroicons/react/24/solid';
import { FaInfoCircle, FaSearch, FaTimes, FaHeart, FaRegHeart } from 'react-icons/fa';
import TrailerModal from './components/TrailerModal';
import Link from 'next/link';
import { useMovies } from './context/MoviesContext';
import { Movie } from './context/MoviesContext';

export default function Home() {
  const { 
    trendingMovies, 
    latestMovies, 
    popularMovies,
    topRatedMovies,
    upcomingMovies,
    searchMovies,
    watchlist,
    addToWatchlist,
    removeFromWatchlist,
    isLoading 
  } = useMovies();

  const [currentMovie, setCurrentMovie] = useState(0);
  const [isTrailerOpen, setIsTrailerOpen] = useState(false);
  const [selectedTrailer, setSelectedTrailer] = useState({ url: '', title: '' });

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentMovie((prev) => (prev + 1) % (latestMovies?.length || 1));
    }, 8000);
    return () => clearInterval(timer);
  }, [latestMovies]);

  const openTrailer = async (movieId: number, title: string) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_TMDB_BASE_URL}/movie/${movieId}/videos?api_key=${process.env.NEXT_PUBLIC_TMDB_API_KEY}`
      );
      const data = await response.json();
      const trailer = data.results.find(
        (video: any) => video.type === 'Trailer' && video.site === 'YouTube'
      );
      if (trailer) {
        setSelectedTrailer({
          url: `https://www.youtube.com/embed/${trailer.key}?autoplay=1&rel=0&modestbranding=1`,
          title
        });
        setIsTrailerOpen(true);
      }
    } catch (error) {
      console.error('Failed to fetch trailer:', error);
    }
  };

  const MovieRow = ({ title, movies, link }: { title: string; movies: any[]; link: string }) => (
    <section className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">{title}</h2>
        <Link href={link}>
          <button className="px-4 py-2 text-sm text-emerald-400 transition-colors border border-emerald-400/50 rounded-full hover:bg-emerald-400/10">
            View All
          </button>
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {movies.slice(0, 5).map((movie) => (
          <motion.div
            key={movie.id}
            layout
            className="movieCard group"
          >
            <div className="relative aspect-[2/3] rounded-lg overflow-hidden">
              <img
                src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
                alt={movie.title}
                className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-110"
              />
              <div className="absolute inset-0 transition-opacity opacity-0 bg-gradient-to-t from-slate-900/95 via-slate-900/50 to-transparent group-hover:opacity-100">
                <div className="absolute top-2 right-2">
                  <button
                    onClick={() => watchlist.some((m) => 'title' in m && m.id === movie.id) 
                      ? removeFromWatchlist(movie.id)
                      : addToWatchlist(movie)
                    }
                    className="p-2 text-white rounded-full bg-black/50 hover:bg-black/70 transition-colors"
                  >
                    {watchlist.some(m => m.id === movie.id) 
                      ? <FaHeart className="w-5 h-5 text-emerald-500" />
                      : <FaRegHeart className="w-5 h-5" />
                    }
                  </button>
                </div>
                <div className="absolute inset-0 flex flex-col justify-end p-4">
                  <h3 className="mb-1 text-lg font-semibold">{movie.title}</h3>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-sm text-gray-300">
                      {movie.release_date?.split('-')[0]}
                    </span>
                    {movie.vote_average && (
                      <>
                        <span className="w-1 h-1 rounded-full bg-gray-400"></span>
                        <span className="text-sm text-emerald-400">★ {movie.vote_average.toFixed(1)}</span>
                      </>
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    <Link href={`/watch/${movie.id}`}>
                      <button className="w-full px-4 py-2 text-sm font-medium text-white transition-colors rounded-md bg-emerald-500 hover:bg-emerald-600 flex items-center justify-center gap-2">
                        <PlayIcon className="w-4 h-4" />
                        Watch Now
                      </button>
                    </Link>
                    <button
                      onClick={() => openTrailer(movie.id, movie.title)}
                      className="w-full px-4 py-2 text-sm font-medium text-white transition-colors rounded-md bg-white/10 hover:bg-white/20 flex items-center justify-center gap-2"
                    >
                      <PlayIcon className="w-4 h-4" />
                      Watch Trailer
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-16 h-16 border-4 border-emerald-400/20 border-t-emerald-400 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Hero Section */}
      <div className="relative h-screen">
        <AnimatePresence mode='wait'>
          {latestMovies[currentMovie] && (
            <motion.div
              key={currentMovie}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1 }}
              className="absolute inset-0"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-slate-900/90 via-slate-900/50 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent" />
              <img
                src={`https://image.tmdb.org/t/p/original${latestMovies[currentMovie].backdrop_path}`}
                alt={latestMovies[currentMovie].title}
                className="object-cover w-full h-full"
              />
            </motion.div>
          )}
        </AnimatePresence>

        <div className="relative flex items-center h-full px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
          <motion.div
            key={currentMovie}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="max-w-2xl"
          >
            <h1 className="mb-4 text-5xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-emerald-200">
              {latestMovies[currentMovie]?.title}
            </h1>
            <p className="mb-8 text-lg text-gray-300 line-clamp-3">
              {latestMovies[currentMovie]?.overview}
            </p>
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => latestMovies[currentMovie] && openTrailer(latestMovies[currentMovie].id, latestMovies[currentMovie].title)}
                className="flex items-center heroButton bg-emerald-500 hover:bg-emerald-600"
              >
                <PlayIcon className="w-6 h-6 mr-2" />
                Watch Trailer
              </button>
              <Link href={`/movies/${latestMovies[currentMovie]?.id}`}>
                <button className="flex items-center heroButton bg-white/10 backdrop-blur-sm hover:bg-white/20">
                  <FaInfoCircle className="w-5 h-5 mr-2" />
                  More Info
                </button>
              </Link>
            </div>
          </motion.div>
        </div>

        {/* Movie Indicators */}
        <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 flex space-x-3">
          {latestMovies.slice(0, 5).map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentMovie(index)}
              className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                currentMovie === index 
                  ? 'bg-emerald-400 w-8' 
                  : 'bg-gray-400/50 hover:bg-gray-400'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Movie Sections */}
      <div className="relative px-4 py-16 mx-auto -mt-32 max-w-7xl sm:px-6 lg:px-8 ambient-blur">
        <MovieRow title="Trending Now" movies={trendingMovies} link="/movies?category=trending" />
        <MovieRow title="Popular Movies" movies={popularMovies} link="/movies?category=popular" />
        <MovieRow title="Top Rated" movies={topRatedMovies} link="/movies?category=top-rated" />
        <MovieRow title="Upcoming" movies={upcomingMovies} link="/movies?category=upcoming" />
      </div>

      {/* Trailer Modal */}
      <TrailerModal
        isOpen={isTrailerOpen}
        onClose={() => setIsTrailerOpen(false)}
        trailerUrl={selectedTrailer.url}
        title={selectedTrailer.title}
      />
    </div>
  );
}
