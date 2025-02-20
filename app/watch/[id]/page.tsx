'use client';
import { useEffect, useState } from 'react';
import { Movie } from '@/app/context/MoviesContext';
import { useMovies } from '@/app/context/MoviesContext';
import { motion, AnimatePresence } from 'framer-motion';
import { FaHeart, FaRegHeart, FaPlay, FaClock, FaStar, FaCalendar } from 'react-icons/fa';
import TrailerModal from '@/app/components/TrailerModal';
import VideoPlayer from '@/app/components/VideoPlayer';
import { fetchStreamingUrls, fetchSimilarMovies, fetchRecommendedMovies } from '@/app/services/tmdb';
import ErrorDisplay from '@/app/components/ErrorDisplay';
import LoadingSpinner from '@/app/components/LoadingSpinner';
import { useRouter, useParams } from 'next/navigation';

export default function WatchPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [movie, setMovie] = useState<Movie | null>(null);
  const [streamingData, setStreamingData] = useState<{ embedUrl: string; isEmbed: boolean } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const { watchlist, addToWatchlist, removeFromWatchlist } = useMovies();
  const isInWatchlist = watchlist.some(m => m.id === Number(id));
  const [similarMovies, setSimilarMovies] = useState<Movie[]>([]);
  const [recommendedMovies, setRecommendedMovies] = useState<Movie[]>([]);

  useEffect(() => {
    const fetchMovieData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Fetch movie details
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_TMDB_BASE_URL}/movie/${id}?api_key=${process.env.NEXT_PUBLIC_TMDB_API_KEY}`
        );
        if (!response.ok) throw new Error('Movie not found');
        const movieData = await response.json();
        setMovie(movieData);

        // Fetch streaming URL
        const streamData = await fetchStreamingUrls(Number(id));
        if (!streamData) throw new Error('No streaming sources found');
        setStreamingData(streamData);

        // Fetch similar and recommended movies
        const [similar, recommended] = await Promise.all([
          fetchSimilarMovies(Number(id)),
          fetchRecommendedMovies(Number(id))
        ]);

        setSimilarMovies(similar);
        setRecommendedMovies(recommended);
      } catch (error) {
        console.error('Error:', error);
        setError(error instanceof Error ? error.message : 'Failed to load movie');
      } finally {
        setIsLoading(false);
      }
    };

    fetchMovieData();
  }, [id]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !movie) {
    return (
      <div className="min-h-screen pt-24">
        <ErrorDisplay error={error || 'Movie not found'} />
      </div>
    );
  }

  const MovieSection = ({ title, movies }: { title: string; movies: Movie[] }) => (
    <div className="mb-12">
      <h2 className="text-2xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white to-emerald-200">
        {title}
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        <AnimatePresence mode="popLayout">
          {movies.slice(0, 5).map((movie) => (
            <motion.div
              key={movie.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3 }}
              className="relative aspect-[2/3] rounded-lg overflow-hidden group cursor-pointer"
              onClick={() => window.location.href = `/watch/${movie.id}`}
            >
              <img
                src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
                alt={movie.title}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <h3 className="text-lg font-semibold mb-1 line-clamp-1">{movie.title}</h3>
                  <div className="flex items-center gap-2 text-sm text-gray-300">
                    <span>{new Date(movie.release_date).getFullYear()}</span>
                    {movie.vote_average && (
                      <>
                        <span>•</span>
                        <span className="text-emerald-400">★ {movie.vote_average.toFixed(1)}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-950">
      {/* Loading Progress Bar */}
      <AnimatePresence>
        {isLoading && (
          <motion.div 
            className="fixed top-0 left-0 right-0 z-50 h-1 bg-slate-800"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: loadingProgress }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="h-full bg-emerald-500" />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative">
        {/* Video Player Section */}
        <div className="aspect-video w-full max-h-[80vh] bg-black/90 backdrop-blur-sm">
          {streamingData ? (
            <VideoPlayer
              videoUrl={streamingData.embedUrl}
              title={movie.title}
              isEmbed={streamingData.isEmbed}
              isLoading={isLoading}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <LoadingSpinner size="lg" />
            </div>
          )}
        </div>

        {/* Content Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="relative -mt-16 mb-8"
          >
            {/* Movie Info Card */}
            <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl overflow-hidden shadow-2xl">
              <div className="flex flex-col md:flex-row gap-8 p-8">
                {/* Poster */}
                <div className="w-full md:w-1/4 flex-shrink-0">
                  <div className="aspect-[2/3] rounded-lg overflow-hidden">
                    <img
                      src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
                      alt={movie.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>

                {/* Details */}
                <div className="flex-grow">
                  <h1 className="text-4xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-white to-emerald-200">
                    {movie.title}
                  </h1>

                  {/* Movie Stats */}
                  <div className="flex flex-wrap gap-6 mb-6">
                    <div className="flex items-center text-emerald-400">
                      <FaStar className="w-5 h-5 mr-2" />
                      <span className="text-lg font-semibold">{movie.vote_average?.toFixed(1)}</span>
                    </div>
                    <div className="flex items-center text-gray-300">
                      <FaCalendar className="w-5 h-5 mr-2" />
                      <span>{new Date(movie.release_date).getFullYear()}</span>
                    </div>
                    {movie.runtime && (
                      <div className="flex items-center text-gray-300">
                        <FaClock className="w-5 h-5 mr-2" />
                        <span>{Math.floor(movie.runtime / 60)}h {movie.runtime % 60}m</span>
                      </div>
                    )}
                  </div>

                  {/* Genres */}
                  <div className="flex flex-wrap gap-2 mb-6">
                    {movie.genres?.map((genre: any) => (
                      <span 
                        key={genre.id}
                        className="px-3 py-1 text-sm bg-emerald-500/20 text-emerald-400 rounded-full"
                      >
                        {genre.name}
                      </span>
                    ))}
                  </div>

                  {/* Overview */}
                  <p className="text-gray-300 text-lg leading-relaxed mb-8">
                    {movie.overview}
                  </p>

                  {/* Actions */}
                  <div className="flex flex-wrap gap-4">
                    <button
                      onClick={() => isInWatchlist 
                        ? removeFromWatchlist(movie.id)
                        : addToWatchlist(movie)
                      }
                      className="flex items-center px-6 py-3 rounded-lg bg-white/10 hover:bg-white/20 transition-all duration-300 group"
                    >
                      {isInWatchlist 
                        ? <FaHeart className="w-6 h-6 mr-2 text-emerald-400 group-hover:scale-110 transition-transform" />
                        : <FaRegHeart className="w-6 h-6 mr-2 group-hover:scale-110 transition-transform" />
                      }
                      <span className="text-lg font-medium">
                        {isInWatchlist ? 'In Watchlist' : 'Add to Watchlist'}
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Additional Sections can be added here */}
        </div>
      </div>

      {/* Add these sections after the movie info card */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {similarMovies.length > 0 && (
          <MovieSection title="Similar Movies" movies={similarMovies} />
        )}
        {recommendedMovies.length > 0 && (
          <MovieSection title="Recommended For You" movies={recommendedMovies} />
        )}
      </div>
    </div>
  );
}
