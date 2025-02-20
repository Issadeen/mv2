'use client';
import { motion } from 'framer-motion';
import { useMovies } from '../context/MoviesContext';
import { FaHeart, FaTrash, FaPlay } from 'react-icons/fa';
import TrailerModal from '../components/TrailerModal';
import { useState } from 'react';

export default function MyListPage() {
  const { watchlist, removeFromWatchlist } = useMovies();
  const [isTrailerOpen, setIsTrailerOpen] = useState(false);
  const [selectedTrailer, setSelectedTrailer] = useState({ url: '', title: '' });

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

  return (
    <div className="min-h-screen pt-24">
      <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
        {/* Header */}
        <div className="relative mb-8 overflow-hidden rounded-2xl h-[200px] ambient-blur">
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900/90 via-slate-900/50 to-transparent" />
          <div className="absolute inset-0 flex flex-col justify-center p-8">
            <div className="flex items-center gap-3">
              <FaHeart className="w-8 h-8 text-emerald-400" />
              <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-emerald-200">
                My Watchlist
              </h1>
            </div>
            <p className="mt-4 text-lg text-gray-300">
              {watchlist.length === 0 
                ? "Your watchlist is empty. Start adding movies and shows you want to watch!"
                : `You have ${watchlist.length} title${watchlist.length === 1 ? '' : 's'} in your watchlist`
              }
            </p>
          </div>
        </div>

        {/* Watchlist Grid */}
        {watchlist.length > 0 ? (
          <motion.div 
            layout
            className="grid grid-cols-1 gap-6 py-8 sm:grid-cols-2 lg:grid-cols-3"
          >
            {watchlist.map((item) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3 }}
                className="relative overflow-hidden rounded-lg bg-slate-800/50 backdrop-blur-sm group"
              >
                <div className="flex gap-4 p-4">
                  <div className="relative w-32 h-48 flex-shrink-0">
                    <img
                      src={`https://image.tmdb.org/t/p/w500${item.poster_path}`}
                      alt={item.title}
                      className="object-cover w-full h-full rounded-lg"
                    />
                  </div>
                  <div className="flex flex-col flex-grow">
                    <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                    {item.genre_ids && (
                      <div className="flex flex-wrap gap-2 mb-2">
                        {item.genre_ids.map((genreId: number, index: number) => (
                          <span key={index} className="px-2 py-1 text-xs bg-emerald-500/20 text-emerald-400 rounded-md">
                            {genreId}
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      {item.release_date && (
                        <span>{new Date(item.release_date).getFullYear()}</span>
                      )}
                      {item.vote_average && (
                        <>
                          <span className="w-1 h-1 rounded-full bg-gray-600"></span>
                          <span>★ {item.vote_average.toFixed(1)}</span>
                        </>
                      )}
                    </div>
                    <div className="flex-grow"></div>
                    <div className="flex gap-2 mt-4">
                      <button 
                        onClick={() => openTrailer(item.id, item.title)}
                        className="flex items-center px-3 py-1.5 text-sm font-medium text-white transition-colors rounded-md bg-emerald-500 hover:bg-emerald-600"
                      >
                        <FaPlay className="w-3 h-3 mr-2" />
                        Trailer
                      </button>
                      <button 
                        onClick={() => removeFromWatchlist(item.id)}
                        className="flex items-center px-3 py-1.5 text-sm font-medium text-red-400 transition-colors rounded-md hover:bg-red-500/10"
                      >
                        <FaTrash className="w-3 h-3 mr-2" />
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center"
            >
              <FaHeart className="w-16 h-16 mx-auto mb-4 text-emerald-400/20" />
              <h3 className="text-xl font-semibold mb-2">Your Watchlist is Empty</h3>
              <p className="text-gray-400 mb-6">Start exploring and add movies or shows to your watchlist!</p>
              <a 
                href="/movies" 
                className="inline-flex items-center px-6 py-3 text-sm font-medium text-white transition-colors rounded-full bg-emerald-500 hover:bg-emerald-600"
              >
                Explore Movies
              </a>
            </motion.div>
          </div>
        )}

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