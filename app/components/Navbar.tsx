'use client';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { FaSearch, FaBell, FaUser, FaPlay, FaTimes } from 'react-icons/fa';
import { AnimatePresence, motion } from 'framer-motion';
import { useMovies } from '../context/MoviesContext';
import debounce from 'lodash/debounce';

export default function Navbar() {
  const { searchMovies } = useMovies();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 0) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const debouncedSearch = useCallback(
    debounce(async (query: string) => {
      if (query.trim()) {
        setIsLoading(true);
        const results = await searchMovies(query);
        setSearchResults(results.slice(0, 6));
        setIsLoading(false);
      } else {
        setSearchResults([]);
      }
    }, 300),
    []
  );

  const handleSearchInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    debouncedSearch(query);
  };

  const handleSearchClick = () => {
    setIsSearchOpen(!isSearchOpen);
    if (!isSearchOpen) {
      setTimeout(() => {
        document.querySelector('input')?.focus();
      }, 100);
    } else {
      handleSearchClose();
    }
  };

  const handleSearchClose = () => {
    setIsSearchOpen(false);
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleSearchClose();
    }
  };

  return (
    <nav className={`fixed-header transition-all duration-500 ${
      isScrolled ? 'bg-slate-900/95 backdrop-blur-sm' : 'bg-gradient-to-b from-black/70 to-transparent'
    }`}>
      <div className="px-4 py-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Link href="/" className="text-emerald-400 text-2xl font-bold tracking-wider">MOVIEVERSE</Link>
            <div className="hidden ml-10 space-x-8 md:flex">
              <Link href="/" className="navLink">Home</Link>
              <Link href="/movies" className="navLink">Movies</Link>
              <Link href="/tv-shows" className="navLink">TV Shows</Link>
              <Link href="/my-list" className="navLink">My List</Link>
            </div>
          </div>
          
          <div className="flex items-center space-x-6">
            <div className="relative">
              <AnimatePresence>
                {isSearchOpen ? (
                  <motion.div
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: "300px", opacity: 1 }}
                    exit={{ width: 0, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    className="relative"
                  >
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={handleSearchInput}
                      onKeyDown={handleKeyDown}
                      placeholder="Search movies & shows..."
                      className="w-full pl-10 pr-8 py-2 text-sm bg-black/30 backdrop-blur-sm border border-emerald-500/30 rounded-full text-white placeholder-gray-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50"
                    />
                    <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-emerald-400 w-4 h-4" />
                    {searchQuery && (
                      <button
                        onClick={handleSearchClose}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                      >
                        <FaTimes className="w-4 h-4" />
                      </button>
                    )}
                  </motion.div>
                ) : (
                  <motion.button
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    onClick={handleSearchClick}
                    className="p-2 text-gray-300 hover:text-emerald-400 transition-colors duration-200"
                  >
                    <FaSearch className="w-5 h-5" />
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
            <FaBell className="w-5 h-5 navLink" />
            <div className="p-0.5 rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600">
              <div className="p-0.5 rounded-full bg-slate-900">
                <FaUser className="w-5 h-5 text-emerald-400" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search Results Overlay */}
      <AnimatePresence>
        {isSearchOpen && (searchQuery || isLoading) && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute left-0 right-0 mt-2 mx-auto max-w-3xl px-4"
          >
            <div className="bg-slate-900/95 backdrop-blur-md rounded-2xl shadow-lg border border-emerald-500/20 overflow-hidden">
              <div className="p-4">
                {isLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="w-8 h-8 border-3 border-emerald-400/20 border-t-emerald-400 rounded-full animate-spin" />
                  </div>
                ) : searchResults.length > 0 ? (
                  <div className="space-y-4">
                    {searchResults.map((movie: any) => (
                      <Link href={`/watch/${movie.id}`} key={movie.id}>
                        <div className="flex items-center gap-4 p-2 rounded-lg hover:bg-white/5 transition-colors group cursor-pointer">
                          <div className="relative w-16 h-24 flex-shrink-0 overflow-hidden rounded-md">
                            <img
                              src={`https://image.tmdb.org/t/p/w200${movie.poster_path}`}
                              alt={movie.title}
                              className="object-cover w-full h-full"
                            />
                          </div>
                          <div className="flex-grow min-w-0">
                            <h4 className="font-medium text-white group-hover:text-emerald-400 transition-colors">{movie.title}</h4>
                            <p className="text-sm text-gray-400 truncate">{movie.overview}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-sm text-gray-500">
                                {movie.release_date?.split('-')[0]}
                              </span>
                              {movie.vote_average && (
                                <span className="text-sm text-emerald-400">★ {movie.vote_average.toFixed(1)}</span>
                              )}
                            </div>
                          </div>
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400">
                              <FaPlay className="w-4 h-4" />
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                    <Link href={`/search?q=${encodeURIComponent(searchQuery)}`}>
                      <button className="w-full py-3 text-sm text-emerald-400 hover:text-emerald-300 transition-colors">
                        View all results
                      </button>
                    </Link>
                  </div>
                ) : searchQuery && (
                  <div className="text-center py-8">
                    <p className="text-gray-400">No results found for "{searchQuery}"</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}