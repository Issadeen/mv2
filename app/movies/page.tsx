'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMovies, type Movie } from '../context/MoviesContext';
import { FaHeart, FaRegHeart, FaSearch, FaFilter } from 'react-icons/fa';
import TrailerModal from '../components/TrailerModal';
import { PlayIcon } from '@heroicons/react/24/solid';
import Link from 'next/link';

export default function MoviesPage() {
  const { trendingMovies, latestMovies, addToWatchlist, removeFromWatchlist, watchlist } = useMovies();
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isTrailerOpen, setIsTrailerOpen] = useState(false);
  const [selectedTrailer, setSelectedTrailer] = useState({ url: '', title: '' });
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState('newest');

  const categories = [
    { id: 'all', name: 'All Movies' },
    { id: 'action', name: 'Action' },
    { id: 'comedy', name: 'Comedy' },
    { id: 'drama', name: 'Drama' },
    { id: 'sci-fi', name: 'Sci-Fi' },
    { id: 'horror', name: 'Horror' }
  ];

  const filteredMovies = (trendingMovies || [])
    .filter((movie: Movie) => {
      const matchesSearch = movie.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = activeCategory === 'all' || movie.genre?.includes(activeCategory);
      return matchesSearch && matchesCategory;
    })
    .sort((a: Movie, b: Movie) => {
      if (sortBy === 'newest') return (new Date(b.release_date || '')).getTime() - (new Date(a.release_date || '')).getTime();
      if (sortBy === 'rating') return (b.vote_average || 0) - (a.vote_average || 0);
      return 0;
    });

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

  const toggleWatchlist = (movie: any) => {
    if (watchlist.some(m => m.id === movie.id)) {
      removeFromWatchlist(movie.id);
    } else {
      addToWatchlist(movie);
    }
  };

  return (
    <div className="min-h-screen pt-24">
      <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
        {/* Hero Banner */}
        <div className="relative mb-8 overflow-hidden rounded-2xl h-[300px] ambient-blur">
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900/90 via-slate-900/50 to-transparent" />
          <img
            src="https://image.tmdb.org/t/p/original/tmU7GeKVybMWFButWEGl2M4GeiP.jpg"
            alt="Movies Banner"
            className="object-cover w-full h-full"
          />
          <div className="absolute inset-0 flex flex-col justify-center p-8">
            <h1 className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-emerald-200">
              Explore Movies
            </h1>
            <p className="mt-4 text-lg text-gray-300 max-w-xl">
              Discover the latest and greatest films from around the world
            </p>

            {/* Search Bar */}
            <div className="relative mt-8 max-w-lg">
              <input
                type="text"
                placeholder="Search movies..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-3 pl-12 text-white bg-black/50 backdrop-blur-sm rounded-full border border-emerald-500/30 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none"
              />
              <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-emerald-400" />
            </div>
          </div>
        </div>

        {/* Filters and Categories */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex space-x-2 overflow-x-auto pb-4 scrollbar-hide">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setActiveCategory(category.id)}
                className={`px-4 py-2 text-sm font-medium rounded-full whitespace-nowrap transition-all duration-300 
                  ${activeCategory === category.id 
                    ? 'bg-emerald-500 text-white' 
                    : 'text-gray-300 hover:text-emerald-400 hover:bg-emerald-500/10'}`}
              >
                {category.name}
              </button>
            ))}
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center px-4 py-2 text-sm font-medium text-emerald-400 rounded-full border border-emerald-400/50 hover:bg-emerald-500/10"
          >
            <FaFilter className="mr-2" />
            Filters
          </button>
        </div>

        {/* Filters Panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mb-6 overflow-hidden p-4 rounded-lg bg-slate-800/50 backdrop-blur-sm"
            >
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-300">Sort by:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 py-1 text-sm bg-slate-700 rounded-md border border-emerald-500/30 focus:border-emerald-500 outline-none"
                >
                  <option value="newest">Newest First</option>
                  <option value="rating">Top Rated</option>
                </select>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Movies Grid */}
        <motion.div 
          layout
          className="grid grid-cols-2 gap-6 py-8 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
        >
          <AnimatePresence mode="popLayout">
            {filteredMovies.map((movie) => (
              <motion.div
                key={movie.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3 }}
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
                        onClick={() => toggleWatchlist(movie)}
                        className="p-2 text-white rounded-full bg-black/50 hover:bg-black/70 transition-colors"
                      >
                        {watchlist.some(m => m.id === movie.id) ? (
                          <FaHeart className="w-5 h-5 text-emerald-500" />
                        ) : (
                          <FaRegHeart className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                    <div className="absolute inset-0 flex flex-col justify-end p-4">
                      <h3 className="mb-1 text-lg font-semibold">{movie.title}</h3>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {movie.genre?.map((g: string, index: number) => (
                          <span key={index} className="px-2 py-1 text-xs bg-emerald-500/20 text-emerald-400 rounded-md">
                            {g}
                          </span>
                        ))}
                      </div>
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-sm text-gray-300">{movie.release_date?.split('-')[0]}</span>
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
          </AnimatePresence>
        </motion.div>

        {/* Trailer Modal */}
        <TrailerModal
          isOpen={isTrailerOpen}
          onClose={() => setIsTrailerOpen(false)}
          trailerUrl={selectedTrailer.url}
          title={selectedTrailer.title}
        />
      </div>
    </div>
  );
}