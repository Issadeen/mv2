// Interface for TMDB API Genre result
export interface Genre {
  id: number;
  name: string;
}

// Interface for streaming information
export interface StreamingInfo {
  embedUrl: string;
  isEmbed: boolean;
  isWebOS?: boolean;
  useWebView?: boolean;
}

// Interface for playback state
export interface PlaybackState {
  currentTime: number;
  duration: number;
}

// Base Media interface - Ensure all relevant properties are here
export interface Media {
  id: number;
  title?: string | null; // Updated to allow null
  name?: string | null; // Updated to allow null
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null; // Ensure this line exists and is correct
  release_date?: string; // Optional, mainly for movies
  first_air_date?: string; // Optional, mainly for TV shows
  vote_average: number;
  media_type?: 'movie' | 'tv';
  genre_ids?: number[];
  genres?: Genre[];
  streamingInfo?: StreamingInfo;
  playbackState?: PlaybackState;
  runtime?: number;
  popularity?: number; // Add popularity if used for sorting/display
  original_language?: string;
  original_title?: string; // For movies
  original_name?: string; // For TV shows
  vote_count?: number;
  // TV Show specific properties that might appear in 'multi' search
  origin_country?: string[];
  // Movie specific properties that might appear in 'multi' search
  adult?: boolean;
  video?: boolean; // If fetching movie details specifically
}

// Movie specific interface
export interface Movie extends Media {
  title: string; // Make title required for Movie
  release_date: string; // Make release_date required for Movie
  media_type: 'movie';
}

// TV Show specific interface
export interface TVShow extends Media {
  name: string; // Make name required for TVShow
  first_air_date: string; // Make first_air_date required for TVShow
  media_type: 'tv';
  // Add TV specific details if needed
  number_of_episodes?: number;
  number_of_seasons?: number;
  seasons?: any[]; // Define a Season interface if needed
}

// Interface for TMDB API Video result
export interface TMDBVideo {
  type: string;
  site: string;
  key: string;
  name: string;
  id: string;
}

// Interface for TMDB API Response wrapper
export interface TMDBResponse<T> {
  page: number;
  results: T[];
  total_pages: number;
  total_results: number;
}
