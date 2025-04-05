export interface VideoPlayerProps {
  videoUrl: string | null;
  title: string;
  onClose?: () => void;
  isOpen?: boolean;
  isEmbed?: boolean;
  isLoading?: boolean;
  onProgress?: (progress: number) => void;
  onTimeUpdate?: (time: number) => void;
  initialTime?: number;
  showInfo?: boolean;
  onToggleInfo?: () => void;
  content?: any;
  autoPlay?: boolean;
  onSavePlaybackState?: (time: number) => void;
  onEpisodeComplete?: () => void;
  error?: string;
  onError?: () => void;
}

export interface StreamingData {
  embedUrl: string | null;
  isEmbed: boolean;
  error?: string;
}

export interface MovieOrTVShow {
  id: number;
  title?: string;
  name?: string;
  overview: string;
  poster_path: string;
  backdrop_path: string;
  release_date?: string;
  first_air_date?: string;
  vote_average: number;
  media_type: 'movie' | 'tv';
  genres?: Array<{ id: number; name: string }>;
  seasons?: Array<{
    season_number: number;
    episode_count: number;
    name: string;
  }>;
}