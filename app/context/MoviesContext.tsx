'use client';
import { createContext, useContext, useEffect, useState } from 'react';
import { 
  fetchLatestMovies, 
  fetchPopularMovies, 
  fetchTopRatedMovies, 
  fetchUpcomingMovies,
  fetchPopularTVShows,
  fetchTopRatedTVShows,
  fetchTrendingTVShows,
  fetchLatestTVShows
} from '../services/tmdb';

interface StreamingInfo {
  embedUrl: string;
  isEmbed: boolean;
}

interface PlaybackState {
  currentTime: number;
  duration: number;
}

// Base Media interface
export interface Media {
  id: number;
  title?: string;
  name?: string;
  overview: string;
  poster_path: string;
  backdrop_path: string;
  release_date?: string;
  first_air_date?: string;
  vote_average: number;
  media_type?: 'movie' | 'tv';
  genre_ids?: number[];
  genres?: Array<{ id: number; name: string }>;
  streamingInfo?: StreamingInfo;
  playbackState?: PlaybackState;
  runtime?: number;
}

// Movie specific interface
export interface Movie extends Media {
  title: string;
  release_date: string;
}

// TV Show specific interface
export interface TVShow extends Media {
  name: string;
  first_air_date: string;
  number_of_seasons?: number;
  number_of_episodes?: number;
  seasons?: Array<{
    season_number: number;
    episode_count: number;
    name: string;
  }>;
}

interface MoviesContextType {
  trendingMovies: Media[];
  latestMovies: Media[];
  popularMovies: Media[];
  topRatedMovies: Media[];
  upcomingMovies: Media[];
  trendingTVShows: TVShow[];
  popularTVShows: TVShow[];
  topRatedTVShows: TVShow[];
  latestTVShows: TVShow[];
  watchlist: Media[];
  isLoading: boolean;
  addToWatchlist: (movie: Media) => void;
  removeFromWatchlist: (id: number) => void;
  searchMovies: (query: string) => Promise<void>;
}

const MoviesContext = createContext<MoviesContextType | undefined>(undefined);

export function MoviesProvider({ children }: { children: React.ReactNode }) {
  const [trendingMovies, setTrendingMovies] = useState<Media[]>([]);
  const [latestMovies, setLatestMovies] = useState<Media[]>([]);
  const [popularMovies, setPopularMovies] = useState<Media[]>([]);
  const [topRatedMovies, setTopRatedMovies] = useState<Media[]>([]);
  const [upcomingMovies, setUpcomingMovies] = useState<Media[]>([]);
  const [trendingTVShows, setTrendingTVShows] = useState<TVShow[]>([]);
  const [popularTVShows, setPopularTVShows] = useState<TVShow[]>([]);
  const [topRatedTVShows, setTopRatedTVShows] = useState<TVShow[]>([]);
  const [latestTVShows, setLatestTVShows] = useState<TVShow[]>([]);
  const [watchlist, setWatchlist] = useState<Media[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [
          latestData,
          popularData,
          topRatedData,
          upcomingData,
          popularTVData,
          topRatedTVData,
          trendingTVData,
          latestTVData
        ] = await Promise.all([
          fetchLatestMovies(),
          fetchPopularMovies(),
          fetchTopRatedMovies(),
          fetchUpcomingMovies(),
          fetchPopularTVShows(),
          fetchTopRatedTVShows(),
          fetchTrendingTVShows(),
          fetchLatestTVShows()
        ]);

        setLatestMovies(latestData);
        setPopularMovies(popularData);
        setTopRatedMovies(topRatedData);
        setUpcomingMovies(upcomingData);
        setPopularTVShows(popularTVData);
        setTopRatedTVShows(topRatedTVData);
        setTrendingTVShows(trendingTVData);
        setLatestTVShows(latestTVData);

        // Set trending to be a mix of movies and TV shows
        setTrendingMovies([...popularData.slice(0, 10), ...topRatedData.slice(0, 10)]);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInitialData();

    // Load watchlist from localStorage
    const savedWatchlist = localStorage.getItem('watchlist');
    if (savedWatchlist) {
      setWatchlist(JSON.parse(savedWatchlist));
    }
  }, []);

  // Save watchlist to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('watchlist', JSON.stringify(watchlist));
  }, [watchlist]);

  const addToWatchlist = (movie: Media) => {
    setWatchlist((prev) => {
      if (!prev.some((m) => m.id === movie.id)) {
        return [...prev, movie];
      }
      return prev;
    });
  };

  const removeFromWatchlist = (id: number) => {
    setWatchlist((prev) => prev.filter((movie) => movie.id !== id));
  };

  const searchMovies = async (query: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_TMDB_BASE_URL}/search/multi?api_key=${process.env.NEXT_PUBLIC_TMDB_API_KEY}&query=${query}`
      );
      const data = await response.json();
      setTrendingMovies(data.results);
    } catch (error) {
      console.error('Error searching movies:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <MoviesContext.Provider
      value={{
        trendingMovies,
        latestMovies,
        popularMovies,
        topRatedMovies,
        upcomingMovies,
        trendingTVShows,
        popularTVShows,
        topRatedTVShows,
        latestTVShows,
        watchlist,
        isLoading,
        addToWatchlist,
        removeFromWatchlist,
        searchMovies,
      }}
    >
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