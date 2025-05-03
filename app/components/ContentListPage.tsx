'use client';

import { useState, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { FaSearch, FaFilter, FaHeart, FaRegHeart, FaPlay } from 'react-icons/fa';
import Link from 'next/link';

import { Media, Movie, TVShow, Genre } from '../types/media';
import { useMovies } from '../context/MoviesContext';
import { useDebounce } from '../hooks/useDebounce';
import LoadingSpinner from './LoadingSpinner';
import TrailerModal from './TrailerModal';
import * as tmdbApi from '../services/tmdb'; // Import API functions

// Helper to get genre mapping (can be fetched or predefined)
// Example predefined mapping (adjust based on actual genre IDs from TMDB)
const genreMapping: { [key: string]: number } = {
  action: 28,
  adventure: 12,
  animation: 16,
  comedy: 35,
  crime: 80,
  documentary: 99,
  drama: 18,
  family: 10751,
  fantasy: 14,
  history: 36,
  horror: 27,
  music: 10402,
  mystery: 9648,
  romance: 10749,
  'sci-fi': 878, // Use 'sci-fi' key for Science Fiction
  sciencefiction: 878, // Alias
  tvmovie: 10770,
  thriller: 53,
  war: 10752,
  western: 37,
  // TV Genres (add more as needed)
  actionadventure: 10759,
  kids: 10762,
  news: 10763,
  reality: 10764,
  scififantasy: 10765,
  soap: 10766,
  talk: 10767,
  warpolitics: 10768,
};

interface ContentListPageProps {
  title: string;
  fetchDataFunction: (page?: number) => Promise<Media[]>; // Function to fetch initial/paginated data
  searchFunction: (query: string) => Promise<Media[]>; // Function to fetch search results
  fetchGenresFunction: () => Promise<Genre[]>; // Function to fetch genres
  mediaType: 'movie' | 'tv';
  queryKey: string; // Base query key for react-query
}

function ContentListPageClient({
  title,
  fetchDataFunction,
  searchFunction,
  fetchGenresFunction,
  mediaType,
  queryKey
}: ContentListPageProps) {
  const { watchlist, addToWatchlist, removeFromWatchlist, isMediaInWatchlist } = useMovies();
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get('category') || 'all';

  const [activeCategory, setActiveCategory] = useState<string | number>(initialCategory === 'all' ? 'all' : (genreMapping[initialCategory] || 'all'));
  const [searchQuery, setSearchQuery] = useState('');
  const [isTrailerOpen, setIsTrailerOpen] = useState(false);
  const [selectedTrailer, setSelectedTrailer] = useState({ url: '', title: '' });
  const [isLoadingTrailer, setIsLoadingTrailer] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState('popularity.desc'); // Default sort

  const debouncedSearchQuery = useDebounce(searchQuery, 500); // Debounce search input

  // Fetch Genres
  const { data: genres, isLoading: isLoadingGenres } = useQuery<Genre[]>({
    queryKey: [`${queryKey}-genres`],
    queryFn: fetchGenresFunction,
    staleTime: Infinity, // Genres rarely change
  });

  // Fetch Content (either initial data or search results)
  const { data: contentData, isLoading: isLoadingContent, error: contentError } = useQuery<Media[]>({
    queryKey: [queryKey, debouncedSearchQuery || 'all', activeCategory, sortBy], // Query key includes filters/search
    queryFn: () => debouncedSearchQuery ? searchFunction(debouncedSearchQuery) : fetchDataFunction(),
    enabled: !!fetchDataFunction && !!searchFunction, // Ensure functions are provided
  });

  const isLoading = isLoadingContent || isLoadingGenres;

  // Filter and Sort Logic
  const filteredAndSortedContent = useMemo(() => {
    let filtered = contentData || [];

    // Filter by search query (API handles primary search, this is fallback/refinement if needed)
    if (!debouncedSearchQuery && searchQuery) { // Apply local filter only if not using API search results
       filtered = filtered.filter((item: Media) =>
         (item.title || item.name || '').toLowerCase().includes(searchQuery.toLowerCase())
       );
    }

    // Filter by category
    if (activeCategory !== 'all') {
      filtered = filtered.filter((item: Media) =>
        item.genre_ids?.includes(Number(activeCategory))
      );
    }

    // Sort
    return filtered.sort((a: Media, b: Media) => {
      const dateA = new Date(a.release_date || a.first_air_date || 0).getTime();
      const dateB = new Date(b.release_date || b.first_air_date || 0).getTime();
      const voteA = a.vote_average || 0;
      const voteB = b.vote_average || 0;

      switch (sortBy) {
        case 'popularity.desc': // TMDB default sort is often popularity
          return (b.vote_average ?? 0) - (a.vote_average ?? 0); // Approximation if popularity not available
        case 'release_date.desc':
          return dateB - dateA;
        case 'release_date.asc':
          return dateA - dateB;
        case 'vote_average.desc':
          return voteB - voteA;
        case 'vote_average.asc':
          return voteA - voteB;
        default:
          return 0;
      }
    });
  }, [contentData, debouncedSearchQuery, searchQuery, activeCategory, sortBy]);

  const openTrailer = async (itemId: number, itemTitle: string | undefined) => {
    if (!itemTitle) return;
    setIsLoadingTrailer(true); // Show loading indicator in modal
    setSelectedTrailer({ url: '', title: itemTitle }); // Set title immediately
    setIsTrailerOpen(true);
    try {
      const trailerUrl = mediaType === 'movie'
        ? await tmdbApi.fetchMovieTrailer(itemId)
        : await tmdbApi.fetchTVShowTrailer(itemId);

      if (trailerUrl) {
        setSelectedTrailer({ url: trailerUrl, title: itemTitle });
      } else {
        console.warn(`No trailer found for ${mediaType} ${itemId}`);
        // Optionally show a message to the user
        setIsTrailerOpen(false); // Close modal if no trailer found
      }
    } catch (error) {
      console.error('Failed to fetch trailer:', error);
      setIsTrailerOpen(false); // Close modal on error
    } finally {
      setIsLoadingTrailer(false); // Set loading state to false when done
    }
  };

  const handleCategoryClick = (categoryId: string | number) => {
    setActiveCategory(categoryId);
    // Potentially reset search query when changing category?
    // setSearchQuery('');
  };

  const allCategories = useMemo(() => {
    const baseCategories = [{ id: 'all', name: `All ${mediaType === 'movie' ? 'Movies' : 'Shows'}` }];
    if (genres) {
      return [...baseCategories, ...genres];
    }
    return baseCategories;
  }, [genres, mediaType]);

  return (
    <div className="min-h-screen pt-20 md:pt-24 pb-16 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8 md:mb-12 text-center md:text-left">
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-2 text-white">{title}</h1>
        <p className="text-lg text-gray-400">
          Discover {mediaType === 'movie' ? 'movies' : 'TV shows'} based on your preferences.
        </p>
      </div>

      {/* Search and Filter Bar */}
      <div className="sticky top-16 md:top-16 bg-slate-900/80 backdrop-blur-lg z-30 py-4 mb-6 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 rounded-b-lg shadow-lg">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Search Bar */}
          <div className="relative w-full md:max-w-md">
            <input
              type="text"
              placeholder={`Search ${mediaType === 'movie' ? 'movies' : 'shows'}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-3 pl-12 text-white bg-black/30 backdrop-blur-sm rounded-full border border-emerald-500/30 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-colors duration-300"
            />
            <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-emerald-400/80" />
          </div>

          {/* Filter Toggle Button */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center justify-center w-full md:w-auto px-4 py-2 text-sm font-medium text-emerald-400 rounded-full border border-emerald-400/50 hover:bg-emerald-500/10 transition-colors duration-300"
          >
            <FaFilter className="mr-2" />
            Filters & Sort
          </button>
        </div>

        {/* Filters Panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0, marginTop: 0 }}
              animate={{ height: 'auto', opacity: 1, marginTop: '1rem' }}
              exit={{ height: 0, opacity: 0, marginTop: 0 }}
              className="overflow-hidden"
            >
              <div className="p-4 rounded-lg bg-slate-800/50 backdrop-blur-sm border border-slate-700/50">
                {/* Sorting */}
                <div className="mb-4">
                   <label htmlFor="sort-by" className="block text-sm font-medium text-gray-300 mb-1">Sort by:</label>
                   <select
                     id="sort-by"
                     value={sortBy}
                     onChange={(e) => setSortBy(e.target.value)}
                     className="w-full md:w-auto px-3 py-2 text-sm bg-slate-700 rounded-md border border-emerald-500/30 focus:border-emerald-500 outline-none text-white transition-colors duration-300"
                   >
                     <option value="popularity.desc">Popularity</option>
                     <option value="release_date.desc">Newest First</option>
                     <option value="release_date.asc">Oldest First</option>
                     <option value="vote_average.desc">Top Rated</option>
                     <option value="vote_average.asc">Lowest Rated</option>
                   </select>
                </div>

                {/* Categories/Genres */}
                <div>
                  <span className="block text-sm font-medium text-gray-300 mb-2">Category:</span>
                  <div className="flex flex-wrap gap-2">
                    {isLoadingGenres ? (
                      <LoadingSpinner size="sm" />
                    ) : (
                      allCategories.map((category) => (
                        <button
                          key={category.id}
                          onClick={() => handleCategoryClick(category.id)}
                          className={`px-3 py-1.5 text-xs sm:text-sm font-medium rounded-full whitespace-nowrap transition-all duration-300
                            ${activeCategory === category.id
                              ? 'bg-emerald-500 text-white shadow-md'
                              : 'text-gray-300 bg-slate-700/60 hover:text-emerald-400 hover:bg-emerald-500/10'}`}
                        >
                          {category.name}
                        </button>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Content Grid */}
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      ) : contentError ? (
         <div className="text-center py-10 text-red-400">
            <p>Error loading content. Please try again later.</p>
            {/* <p>Details: {contentError.message}</p> */}
         </div>
      ) : filteredAndSortedContent.length === 0 ? (
        <div className="text-center py-10 text-gray-400">
          No {mediaType === 'movie' ? 'movies' : 'shows'} found matching your criteria.
        </div>
      ) : (
        <motion.div
          layout
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6"
        >
          <AnimatePresence mode="popLayout">
            {filteredAndSortedContent.map((item) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3 }}
                className="movieCard group relative rounded-lg overflow-hidden shadow-lg bg-slate-800/50"
              >
                <Link href={`/watch/${item.id}?type=${mediaType}`} className="block aspect-[2/3]">
                  {item.poster_path ? (
                    <img
                      src={`https://image.tmdb.org/t/p/w500${item.poster_path}`}
                      alt={item.title || item.name || 'Poster'}
                      className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full bg-slate-700 flex items-center justify-center text-gray-400">
                      No Image
                    </div>
                  )}
                   {/* Overlay for Title/Info on Hover */}
                   <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3">
                      <h3 className="text-sm font-semibold text-white mb-1 line-clamp-2">{item.title || item.name}</h3>
                      <div className="flex items-center gap-1.5 text-xs text-gray-300">
                        <span>{new Date(item.release_date || item.first_air_date || '').getFullYear() || 'N/A'}</span>
                        {item.vote_average > 0 && (
                          <>
                            <span className="opacity-50">•</span>
                            <span className="flex items-center gap-0.5">
                               <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-yellow-400" viewBox="0 0 20 20" fill="currentColor"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                               {item.vote_average.toFixed(1)}
                            </span>
                          </>
                        )}
                      </div>
                   </div>
                </Link>

                 {/* Action Buttons (Watchlist, Trailer) - Positioned top-right */}
                 <div className="absolute top-2 right-2 z-10 flex flex-col gap-2">
                    {/* Watchlist Button */}
                    <button
                      onClick={() => isMediaInWatchlist(item.id)
                        ? removeFromWatchlist(item.id)
                        : addToWatchlist({
                            id: item.id,
                            title: item.title || item.name || 'Unknown Title',
                            name: item.name || item.title || 'Unknown Title',
                            media_type: mediaType,
                            poster_path: item.poster_path,
                            backdrop_path: item.backdrop_path,
                            genre_ids: item.genre_ids,
                            overview: item.overview,
                            popularity: item.popularity,
                            vote_average: item.vote_average, // Fixed: Just pass the number directly instead of wrapping in a React Element
                            vote_count: item.vote_count,
                            release_date: item.release_date || '',
                            first_air_date: item.first_air_date || '',
                          })}
                      className="p-2 rounded-full bg-black/60 backdrop-blur-sm text-white hover:bg-black/80 hover:text-emerald-400 transition-colors duration-200"
                      aria-label={isMediaInWatchlist(item.id) ? 'Remove from Watchlist' : 'Add to Watchlist'}
                    >
                      {isMediaInWatchlist(item.id) ? (
                        <FaHeart className="w-4 h-4 text-emerald-500" />
                      ) : (
                        <FaRegHeart className="w-4 h-4" />
                      )}
                    </button>
                    {/* Trailer Button */}
                    <button
                      onClick={() => openTrailer(item.id, item.title || item.name || undefined)}
                      className="p-2 rounded-full bg-black/60 backdrop-blur-sm text-white hover:bg-black/80 hover:text-emerald-400 transition-colors duration-200"
                      aria-label="Watch Trailer"
                    >
                      <FaPlay className="w-3.5 h-3.5" />
                    </button>
                 </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}
      {/* Trailer Modal */}
      <TrailerModal
        isOpen={isTrailerOpen}
        onClose={() => setIsTrailerOpen(false)}
        trailerUrl={selectedTrailer.url}
        title={selectedTrailer.title}
        isLoading={isLoadingTrailer}
      />
    </div>
  );
}

// Use Suspense for Search Params
export default function ContentListPage(props: ContentListPageProps) {
  return (
    <Suspense fallback={<div className="flex justify-center items-center min-h-screen"><LoadingSpinner size="lg" /></div>}>
      <ContentListPageClient {...props} />
    </Suspense>
  );
}
function setActiveCategory(categoryId: string | number) {
    throw new Error('Function not implemented.');
}
