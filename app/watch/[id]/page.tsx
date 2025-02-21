'use client';
import { useEffect, useState } from 'react';
import { Media, Movie, TVShow } from '@/app/context/MoviesContext';
import { useMovies } from '@/app/context/MoviesContext';
import { motion, AnimatePresence } from 'framer-motion';
import { FaHeart, FaRegHeart, FaPlay, FaClock, FaStar, FaCalendar } from 'react-icons/fa';
import TrailerModal from '@/app/components/TrailerModal';
import VideoPlayer from '@/app/components/VideoPlayer';
import { fetchStreamingUrls, fetchSimilarMovies, fetchRecommendedMovies } from '@/app/services/tmdb';
import ErrorDisplay from '@/app/components/ErrorDisplay';
import LoadingSpinner from '@/app/components/LoadingSpinner';
import { useRouter, useParams } from 'next/navigation';

interface MovieOrTVShow extends Media {
  media_type: 'movie' | 'tv';
  title?: string;
  name?: string;
  release_date?: string;
  first_air_date?: string;
  vote_average: number;
  runtime?: number;
  overview: string;
  genres?: Array<{ id: number; name: string }>;
  seasons?: Array<{
    season_number: number;
    episode_count: number;
    name: string;
  }>;
}

interface MovieSectionProps {
  title: string;
  movies: Movie[];
  getMediaLink: (id: number, type?: string) => string;
  router: any;
}

const MovieSection = ({ title, movies, getMediaLink, router }: MovieSectionProps) => (
  <div className="mb-12">
    <h2 className="text-2xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white to-emerald-200">
      {title}
    </h2>
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
      <AnimatePresence mode="popLayout">
        {movies.slice(0, 5).map((content) => (
          <motion.div
            key={content.id}
            layout
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.3 }}
            className="relative aspect-[2/3] rounded-lg overflow-hidden group cursor-pointer"
            onClick={() => router.push(getMediaLink(content.id, content.media_type))}
          >
            <img
              src={`https://image.tmdb.org/t/p/w500${content.poster_path}`}
              alt={content.title || content.name}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <h3 className="text-lg font-semibold mb-1 line-clamp-1">{content.title || content.name}</h3>
                <div className="flex items-center gap-2 text-sm text-gray-300">
                  <span>
                    {new Date(content.release_date || content.first_air_date || '').getFullYear()}
                  </span>
                  {content.vote_average && (
                    <>
                      <span>•</span>
                      <span className="text-emerald-400">★ {content.vote_average.toFixed(1)}</span>
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

export default function WatchPage() {
  const router = useRouter();
  const params = useParams();
  
  const getMediaLink = (id: number, type?: string) => `/watch/${id}?type=${type || 'movie'}`;
  const id = params.id as string;
  const searchParams = new URLSearchParams(window.location.search);
  const mediaType = searchParams.get('type') || 'movie';
  const [movie, setMovie] = useState<Movie | null>(null);
  const [streamingData, setStreamingData] = useState<{ embedUrl: string; isEmbed: boolean } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const { watchlist, addToWatchlist, removeFromWatchlist } = useMovies();
  const isInWatchlist = watchlist.some(m => m.id === Number(id));
  const [similarMovies, setSimilarMovies] = useState<Movie[]>([]);
  const [recommendedMovies, setRecommendedMovies] = useState<Movie[]>([]);
  const [content, setContent] = useState<MovieOrTVShow | null>(null);
  const [showInfo, setShowInfo] = useState(false);

  // Add these new states for TV shows
  const [seasons, setSeasons] = useState<any[]>([]);
  const [selectedSeason, setSelectedSeason] = useState(1);
  const [selectedEpisode, setSelectedEpisode] = useState(1);

  const updatePlaybackState = (contentId: number, state: number) => {
    // Store playback state in localStorage
    localStorage.setItem(`playback_${contentId}`, state.toString());
  };

  useEffect(() => {
    const fetchContent = async () => {
      try {
        setIsLoading(true);
        setError(null);
        setLoadingProgress(30);

        // Fetch movie/show details
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_TMDB_BASE_URL}/${mediaType}/${id}?api_key=${process.env.NEXT_PUBLIC_TMDB_API_KEY}`
        );
        if (!response.ok) throw new Error('Content not found');
        const data = await response.json();
        setContent({ ...data, media_type: mediaType });
        
        // If it's a TV show, get the seasons data
        if (mediaType === 'tv' && data.seasons) {
          setSeasons(data.seasons);
          // Get the streaming URL with season/episode
          const streamData = await fetchStreamingUrls(
            Number(id),
            'tv',
            selectedSeason,
            selectedEpisode
          );
          setStreamingData(streamData);
        } else {
          // For movies, get the streaming URL normally
          const streamData = await fetchStreamingUrls(Number(id), 'movie');
          setStreamingData(streamData);
        }
        
        setLoadingProgress(80);

        // Fetch similar and recommended content
        const [similar, recommended] = await Promise.all([
          fetchSimilarMovies(Number(id)),
          fetchRecommendedMovies(Number(id))
        ]);

        setSimilarMovies(similar);
        setRecommendedMovies(recommended);
        setLoadingProgress(100);
      } catch (error) {
        console.error('Error:', error);
        setError(error instanceof Error ? error.message : 'Failed to load content');
      } finally {
        setIsLoading(false);
      }
    };

    fetchContent();
  }, [id, mediaType, selectedSeason, selectedEpisode]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !content) {
    return (
      <div className="min-h-screen pt-24">
        <ErrorDisplay error={error || 'Content not found'} />
      </div>
    );
  }

  return (
    <div className="relative bg-slate-900 min-h-screen">
      {/* Video Player Section - Fixed to top only initially */}
      <div className="relative w-full bg-black">
        <div className="w-full aspect-video max-h-[85vh]">
          {streamingData ? (
            <VideoPlayer
              videoUrl={streamingData.embedUrl}
              title={content?.title || content?.name || ''}
              isEmbed={streamingData.isEmbed}
              isLoading={isLoading}
              content={content}
              showInfo={showInfo}
              onToggleInfo={() => setShowInfo(!showInfo)}
              onSavePlaybackState={(time) => {
                if (content) {
                  updatePlaybackState(content.id, time);
                }
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <LoadingSpinner size="lg" />
            </div>
          )}
        </div>
      </div>

      {/* Content Information - Always visible below player */}
      <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 py-4 sm:py-8 text-gray-100">
        {/* Episode Selection for TV Shows */}
        {mediaType === 'tv' && seasons && seasons.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-2 sm:gap-4 bg-slate-800/50 p-2 sm:p-4 rounded-lg">
            <select
              value={selectedSeason}
              onChange={(e) => {
                setSelectedSeason(Number(e.target.value));
                setSelectedEpisode(1); // Reset episode when season changes
              }}
              className="flex-1 px-2 sm:px-4 py-1 sm:py-2 bg-slate-700 rounded-lg border border-slate-600 focus:border-emerald-500 outline-none text-white text-sm sm:text-base"
            >
              {seasons.map((season) => (
                <option key={season.season_number} value={season.season_number}>
                  Season {season.season_number}
                </option>
              ))}
            </select>
            <select
              value={selectedEpisode}
              onChange={(e) => setSelectedEpisode(Number(e.target.value))}
              className="flex-1 px-2 sm:px-4 py-1 sm:py-2 bg-slate-700 rounded-lg border border-slate-600 focus:border-emerald-500 outline-none text-white text-sm sm:text-base"
            >
              {Array.from({ length: seasons[selectedSeason - 1]?.episode_count || 0 }, (_, i) => (
                <option key={i + 1} value={i + 1}>
                  Episode {i + 1}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Content Details */}
        <div className="bg-slate-800/50 rounded-lg p-3 sm:p-6 mb-4">
          <h1 className="text-2xl sm:text-4xl font-bold mb-2 sm:mb-4 text-white">
            {content?.media_type === 'movie' ? content?.title : content?.name}
          </h1>

          <div className="flex flex-wrap gap-2 sm:gap-4 mb-2 sm:mb-4 text-gray-300 text-sm sm:text-base">
            <div className="flex items-center text-emerald-400">
              <FaStar className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
              <span className="font-semibold">{content?.vote_average?.toFixed(1)}</span>
            </div>
            <div className="flex items-center">
              <FaCalendar className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
              <span>
                {content?.media_type === 'movie'
                  ? content?.release_date && new Date(content.release_date).getFullYear()
                  : content?.first_air_date && new Date(content.first_air_date).getFullYear()}
              </span>
            </div>
            {content?.runtime && content.media_type === 'movie' && (
              <div className="flex items-center">
                <FaClock className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
                <span>{Math.floor(content.runtime / 60)}h {content.runtime % 60}m</span>
              </div>
            )}
          </div>

          {/* Collapsible overview on mobile */}
          <details className="sm:hidden mb-2">
            <summary className="text-emerald-400 cursor-pointer">Show description</summary>
            <p className="text-gray-300 text-sm leading-relaxed mt-2">
              {content?.overview}
            </p>
          </details>
          <p className="hidden sm:block text-gray-300 text-lg leading-relaxed mb-4 sm:mb-6">
            {content?.overview}
          </p>

          <div className="flex flex-wrap gap-1 sm:gap-2">
            {content?.genres?.map((genre: any) => (
              <span 
                key={genre.id}
                className="px-2 sm:px-3 py-0.5 sm:py-1 text-xs sm:text-sm bg-emerald-500/20 text-emerald-400 rounded-full"
              >
                {genre.name}
              </span>
            ))}
          </div>
        </div>

        {/* Similar and Recommended Content */}
        <div className="space-y-4 sm:space-y-8">
          {similarMovies.length > 0 && (
            <MovieSection 
              title={`Similar ${content?.media_type === 'tv' ? 'Shows' : 'Movies'}`} 
              movies={similarMovies} 
              getMediaLink={getMediaLink}
              router={router}
            />
          )}
          {recommendedMovies.length > 0 && (
            <MovieSection 
              title="You May Also Like" 
              movies={recommendedMovies} 
              getMediaLink={getMediaLink}
              router={router}
            />
          )}
        </div>
      </div>
    </div>
  );
}
