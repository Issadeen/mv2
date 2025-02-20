'use client';
import { createContext, useContext, useEffect, useState } from 'react';
import { 
  fetchLatestMovies, 
  fetchPopularMovies, 
  fetchTopRatedMovies, 
  fetchUpcomingMovies,
  searchContent 
} from '../services/tmdb';

// Add these interfaces at the top
interface StreamingInfo {
  embedUrl: string;
  isEmbed: boolean;
  currentTime?: number;
  progress?: number;
}

interface PlaybackState {
  selectedSeason?: number;
  selectedEpisode?: number;
  currentTime: number;
}

// Update Media interfaces
export interface Media {
  id: number;
  title?: string;
  name?: string;  // For TV shows
  overview: string;
  poster_path: string;
  backdrop_path: string;
  release_date?: string;
  first_air_date?: string;  // For TV shows
  vote_average: number;
  genre_ids?: number[];
  genres?: Array<{ id: number; name: string }>;
  media_type?: 'movie' | 'tv';
  runtime?: number;
  streaming?: StreamingInfo;
  playback?: PlaybackState;
}

export interface Movie extends Media {
  title: string;
  release_date: string;
}

export interface TVShow extends Media {
  name: string;
  first_air_date: string;
  seasons?: Array<{
    season_number: number;
    episode_count: number;
    name: string;
  }>;
}

interface MoviesContextType {
  trendingMovies: Movie[];
  latestMovies: Movie[];
  popularMovies: Movie[];
  topRatedMovies: Movie[];
  upcomingMovies: Movie[];
  tvShows: TVShow[];
  popularTVShows: TVShow[];
  watchlist: (Movie | TVShow)[];
  isLoading: boolean;
  searchMovies: (query: string) => Promise<void>;
  addToWatchlist: (media: Movie | TVShow) => void;
  removeFromWatchlist: (mediaId: number) => void;
  updatePlaybackState: (mediaId: number, state: PlaybackState) => void;
  getPlaybackState: (mediaId: number) => PlaybackState | undefined;
}

const MoviesContext = createContext<MoviesContextType | undefined>(undefined);

export function MoviesProvider({ children }: { children: React.ReactNode }) {
  const [trendingMovies, setTrendingMovies] = useState<Movie[]>([]);
  const [latestMovies, setLatestMovies] = useState<Movie[]>([]);
  const [popularMovies, setPopularMovies] = useState<Movie[]>([]);
  const [topRatedMovies, setTopRatedMovies] = useState<Movie[]>([]);
  const [upcomingMovies, setUpcomingMovies] = useState<Movie[]>([]);
  const [tvShows, setTvShows] = useState<TVShow[]>([]);
  const [popularTVShows, setPopularTVShows] = useState<TVShow[]>([]);
  const [watchlist, setWatchlist] = useState<(Movie | TVShow)[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [playbackStates, setPlaybackStates] = useState<Record<number, PlaybackState>>({});

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const [latest, popular, topRated, upcoming, tvPopular] = await Promise.all([
          fetchLatestMovies(),
          fetchPopularMovies(),
          fetchTopRatedMovies(),
          fetchUpcomingMovies(),
          fetch(`${process.env.NEXT_PUBLIC_TMDB_BASE_URL}/tv/popular?api_key=${process.env.NEXT_PUBLIC_TMDB_API_KEY}`)
            .then(res => res.json())
            .then(data => data.results)
        ]);

        setLatestMovies(latest);
        setTrendingMovies(latest); // Using latest as trending for now
        setPopularMovies(popular);
        setTopRatedMovies(topRated);
        setUpcomingMovies(upcoming);
        setPopularTVShows(tvPopular);
      } catch (error) {
        console.error('Error fetching content:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchContent();
  }, []);

  const searchMovies = async (query: string) => {
    if (!query) return;
    const results = await searchContent(query);
    setTrendingMovies(results);
  };

  const addToWatchlist = (media: Movie | TVShow) => {
    setWatchlist(prev => [...prev, media]);
  };

  const removeFromWatchlist = (mediaId: number) => {
    setWatchlist(prev => prev.filter(media => media.id !== mediaId));
  };

  const updatePlaybackState = (mediaId: number, state: PlaybackState) => {
    setPlaybackStates(prev => ({
      ...prev,
      [mediaId]: state
    }));
  };

  const getPlaybackState = (mediaId: number) => {
    return playbackStates[mediaId];
  };

  return (
    <MoviesContext.Provider value={{
      trendingMovies,
      latestMovies,
      popularMovies,
      topRatedMovies,
      upcomingMovies,
      tvShows,
      popularTVShows,
      watchlist,
      isLoading,
      searchMovies,
      addToWatchlist,
      removeFromWatchlist,
      updatePlaybackState,
      getPlaybackState,
    }}>
      {children}
    </MoviesContext.Provider>
  );
}

export function useMovies() {
  const context = useContext(MoviesContext);
  if (context === undefined) {
    throw new Error('useMovies must be used within a MoviesProvider');
  }
  return context;
}