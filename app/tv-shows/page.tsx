'use client';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaSearch, FaFilter, FaStar, FaPlay } from 'react-icons/fa';
import TrailerModal from '../components/TrailerModal';
import { useQuery } from '@tanstack/react-query';
import * as tmdbService from '../services/tmdb';
import Link from 'next/link';

const categories = [
  { id: 'all', name: 'All Shows' },
  { id: '10759', name: 'Action' },
  { id: '18', name: 'Drama' },
  { id: '35', name: 'Comedy' },
  { id: '10765', name: 'Sci-Fi' },
  { id: '27', name: 'Horror' }
];

interface TVShow {
  id: number;
  name: string;
  overview?: string;
  poster_path?: string;
  backdrop_path?: string;
  first_air_date?: string;
  vote_average: number;
  genre_ids?: number[];
  popularity: number;
}

export default function TVShowsPage() {
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isTrailerOpen, setIsTrailerOpen] = useState(false);
  const [selectedTrailer, setSelectedTrailer] = useState({ url: '', title: '' });
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState('popularity');

  const { data: tvShows = [], isLoading } = useQuery({
    queryKey: ['tvShows'],
    queryFn: tmdbService.fetchTVShows
  });

  const filteredShows = tvShows
    .filter((show: TVShow) => {
      const matchesSearch = show.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = activeCategory === 'all' || 
        (show.genre_ids && show.genre_ids.includes(parseInt(activeCategory)));
      return matchesSearch && matchesCategory;
    })
    .sort((a: TVShow, b: TVShow) => {
      if (sortBy === 'rating') return b.vote_average - a.vote_average;
      return b.popularity - a.popularity;
    });

  const openTrailer = async (showId: number, title: string) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_TMDB_BASE_URL}/tv/${showId}/videos?api_key=${process.env.NEXT_PUBLIC_TMDB_API_KEY}`
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-16 h-16 border-4 border-emerald-400/20 border-t-emerald-400 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24">
      <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
        {/* Hero Banner */}
        <div className="relative mb-8 overflow-hidden rounded-2xl h-[300px] ambient-blur">
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900/90 via-slate-900/50 to-transparent" />
          <img
            src={`https://image.tmdb.org/t/p/original${tvShows[0]?.backdrop_path}`}
            alt="TV Shows Banner"
            className="object-cover w-full h-full"
          />
          <div className="absolute inset-0 flex flex-col justify-center p-8">
            <h1 className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-emerald-200">
              TV Shows
            </h1>
            <p className="mt-4 text-lg text-gray-300 max-w-xl">
              Discover binge-worthy series and epic shows
            </p>

            {/* Search Bar */}
            <div className="relative mt-8 max-w-lg">
              <input
                type="text"
                placeholder="Search TV shows..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-3 pl-12 text-white bg-black/50 backdrop-blur-sm rounded-full border border-emerald-500/30 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none"
              />
              <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-emerald-400" />
            </div>
          </div>
        </div>

        {/* Categories and Filters */}
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
              className="mb-6 overflow-hidden"
            >
              <div className="p-4 rounded-lg bg-slate-800/50 backdrop-blur-sm">
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-300">Sort by:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="px-3 py-1 text-sm bg-slate-700 rounded-md border border-emerald-500/30 focus:border-emerald-500 outline-none"
                  >
                    <option value="popularity">Popularity</option>
                    <option value="rating">Top Rated</option>
                  </select>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* TV Shows Grid */}
        <motion.div 
          layout
          className="grid grid-cols-2 gap-6 py-8 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4"
        >
          {filteredShows.map((show: TVShow) => (
            <motion.div
              key={show.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3 }}
              className="movieCard group"
            >
              <div className="relative aspect-[2/3] rounded-lg overflow-hidden">
                <img
                  src={`https://image.tmdb.org/t/p/w500${show.poster_path}`}
                  alt={show.name}
                  className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-110"
                />
                <div className="absolute inset-0 transition-opacity opacity-0 bg-gradient-to-t from-slate-900/95 via-slate-900/50 to-transparent group-hover:opacity-100">
                  <div className="absolute top-2 right-2">
                    <div className="flex items-center px-2 py-1 text-sm bg-black/50 rounded-full">
                      <FaStar className="w-4 h-4 text-yellow-400 mr-1" />
                      <span>{show.vote_average.toFixed(1)}</span>
                    </div>
                  </div>
                  <div className="absolute inset-0 flex flex-col justify-end p-4">
                    <h3 className="mb-2 text-lg font-semibold">{show.name}</h3>
                    <p className="text-sm text-gray-300 line-clamp-2 mb-4">{show.overview}</p>
                    <div className="flex flex-col gap-2">
                      <Link href={`/watch/tv/${show.id}`}>
                        <button className="w-full px-4 py-2 text-sm font-medium text-white transition-colors rounded-md bg-emerald-500 hover:bg-emerald-600 flex items-center justify-center gap-2">
                          <FaPlay className="w-3 h-3" />
                          Watch Now
                        </button>
                      </Link>
                      <button
                        onClick={() => openTrailer(show.id, show.name)}
                        className="w-full px-4 py-2 text-sm font-medium text-white transition-colors rounded-md bg-white/10 hover:bg-white/20 flex items-center justify-center gap-2"
                      >
                        <FaPlay className="w-3 h-3" />
                        Watch Trailer
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
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