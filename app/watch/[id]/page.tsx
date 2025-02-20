'use client';
import { useEffect, useState } from 'react';
import { Movie } from '@/app/context/MoviesContext';
import { useMovies } from '@/app/context/MoviesContext';
import { motion } from 'framer-motion';
import { PlayIcon } from '@heroicons/react/24/solid';
import { FaHeart, FaRegHeart } from 'react-icons/fa';
import TrailerModal from '@/app/components/TrailerModal';

export default function WatchPage({ params }: { params: { id: string } }) {
  const [movie, setMovie] = useState<Movie | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isTrailerOpen, setIsTrailerOpen] = useState(false);
  const [trailerUrl, setTrailerUrl] = useState('');
  const { watchlist, addToWatchlist, removeFromWatchlist } = useMovies();
  const isInWatchlist = watchlist.some(m => m.id === Number(params.id));

  useEffect(() => {
    const fetchMovie = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_TMDB_BASE_URL}/movie/${params.id}?api_key=${process.env.NEXT_PUBLIC_TMDB_API_KEY}`
        );
        if (!response.ok) throw new Error('Movie not found');
        const data = await response.json();
        setMovie(data);
        
        // Fetch trailer
        const trailerResponse = await fetch(
          `${process.env.NEXT_PUBLIC_TMDB_BASE_URL}/movie/${params.id}/videos?api_key=${process.env.NEXT_PUBLIC_TMDB_API_KEY}`
        );
        const trailerData = await trailerResponse.json();
        const trailer = trailerData.results.find(
          (video: any) => video.type === 'Trailer' && video.site === 'YouTube'
        );
        if (trailer) {
          setTrailerUrl(`https://www.youtube.com/embed/${trailer.key}?autoplay=1&rel=0&modestbranding=1`);
        }
      } catch (error) {
        console.error('Error fetching movie:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMovie();
  }, [params.id]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-16 h-16 border-4 border-emerald-400/20 border-t-emerald-400 rounded-full animate-spin" />
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h1 className="text-3xl font-bold text-gray-400">Movie not found</h1>
        <p className="mt-2 text-gray-500">The movie you're looking for doesn't exist.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="relative h-[70vh]">
        <div className="absolute inset-0">
          <img
            src={`https://image.tmdb.org/t/p/original${movie.backdrop_path}`}
            alt={movie.title}
            className="object-cover w-full h-full"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900/90 via-slate-900/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/20 to-transparent" />
        </div>

        <div className="relative flex items-center h-full px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="flex gap-8">
            <div className="hidden w-64 overflow-hidden rounded-lg shadow-2xl md:block aspect-[2/3]">
              <img
                src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
                alt={movie.title}
                className="object-cover w-full h-full"
              />
            </div>
            <div className="flex flex-col justify-center max-w-2xl">
              <h1 className="mb-4 text-4xl font-bold tracking-tight">
                {movie.title}
              </h1>
              <p className="mb-6 text-lg text-gray-300">
                {movie.overview}
              </p>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setIsTrailerOpen(true)}
                  className="flex items-center px-6 py-3 text-white transition-colors rounded-lg bg-emerald-500 hover:bg-emerald-600"
                >
                  <PlayIcon className="w-6 h-6 mr-2" />
                  Watch Trailer
                </button>
                <button
                  onClick={() => isInWatchlist 
                    ? removeFromWatchlist(movie.id)
                    : addToWatchlist(movie)
                  }
                  className="flex items-center px-6 py-3 transition-colors rounded-lg bg-white/10 hover:bg-white/20"
                >
                  {isInWatchlist 
                    ? <FaHeart className="w-6 h-6 mr-2 text-emerald-400" />
                    : <FaRegHeart className="w-6 h-6 mr-2" />
                  }
                  {isInWatchlist ? 'In Watchlist' : 'Add to Watchlist'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <TrailerModal
        isOpen={isTrailerOpen}
        onClose={() => setIsTrailerOpen(false)}
        trailerUrl={trailerUrl}
        title={movie.title}
      />
    </div>
  );
}
