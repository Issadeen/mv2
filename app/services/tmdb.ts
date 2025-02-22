import axios from 'axios';

interface TMDBResponse<T> {
  results: T[];
}

interface TMDBVideo {
  type: string;
  site: string;
  key: string;
}

const tmdbApi = axios.create({
  baseURL: process.env.NEXT_PUBLIC_TMDB_BASE_URL,
  params: {
    api_key: process.env.NEXT_PUBLIC_TMDB_API_KEY,
  },
});

export const fetchLatestMovies = async () => {
  const { data } = await tmdbApi.get<TMDBResponse<any>>('/movie/now_playing');
  return data.results;
};

export const fetchMovieTrailer = async (movieId: number) => {
  const { data } = await tmdbApi.get<TMDBResponse<TMDBVideo>>(`/movie/${movieId}/videos`);
  const trailer = data.results.find(
    (video: any) => video.type === 'Trailer' && video.site === 'YouTube'
  );
  return trailer ? `https://www.youtube.com/embed/${trailer.key}?autoplay=1&rel=0&modestbranding=1` : null;
};

export const searchMovies = async (query: string) => {
  const { data } = await tmdbApi.get<TMDBResponse<Movie>>('/search/movie', {
    params: { query },
  });
  return data.results;
};

interface Movie {
  id: number;
  title: string;
  overview: string;
  poster_path: string;
  backdrop_path: string;
  release_date: string;
  vote_average: number;
}

export const fetchMoviesByGenre = async (genreId: number) => {
  const { data } = await tmdbApi.get<TMDBResponse<Movie>>('/discover/movie', {
    params: { with_genres: genreId },
  });
  return data.results;
};

export const fetchTVShows = async () => {
  const { data } = await tmdbApi.get<TMDBResponse<any>>('/trending/tv/week');
  return data.results;
};

interface GenreResponse {
  genres: Array<{ id: number; name: string; }>;
}

export const fetchMovieGenres = async () => {
  const { data } = await tmdbApi.get<GenreResponse>('/genre/movie/list');
  return data.genres;
};

export const fetchPopularMovies = async () => {
  const { data } = await tmdbApi.get<TMDBResponse<Movie>>('/movie/popular');
  return data.results;
};

export const fetchTopRatedMovies = async () => {
  const { data } = await tmdbApi.get<TMDBResponse<Movie>>('/movie/top_rated');
  return data.results;
};

export const fetchUpcomingMovies = async () => {
  const { data } = await tmdbApi.get<TMDBResponse<Movie>>('/movie/upcoming');
  return data.results;
};

// Enhanced search function with proper typing
export const searchContent = async (query: string, type: 'movie' | 'multi' = 'movie'): Promise<Movie[]> => {
  const { data } = await tmdbApi.get<TMDBResponse<Movie>>(`/search/${type}`, {
    params: { query },
  });
  return data.results.map(movie => ({
    id: movie.id,
    title: movie.title,
    overview: movie.overview,
    poster_path: movie.poster_path,
    backdrop_path: movie.backdrop_path,
    release_date: movie.release_date,
    vote_average: movie.vote_average
  }));
};

interface StreamingSource {
  base: string;
  getUrl: () => string;
}

export const fetchStreamingUrls = async (
  tmdbId: number, 
  mediaType: 'movie' | 'tv' = 'movie',
  season?: number,
  episode?: number
) => {
  try {
    const sources: StreamingSource[] = [
      {
        base: 'https://vidsrc.xyz/embed',
        getUrl: (): string => mediaType === 'tv'
          ? `${sources[0].base}/tv?tmdb=${tmdbId}&season=${season}&episode=${episode}`
          : `${sources[0].base}/movie?tmdb=${tmdbId}`
      },
      {
        base: 'https://vidsrc.to/embed',
        getUrl: (): string => mediaType === 'tv'
          ? `${sources[1].base}/tv/${tmdbId}/${season}/${episode}`
          : `${sources[1].base}/movie/${tmdbId}`
      },
      {
        base: 'https://2embed.org/embed',
        getUrl: (): string => mediaType === 'tv'
          ? `${sources[2].base}/series?tmdb=${tmdbId}&s=${season}&e=${episode}`
          : `${sources[2].base}/movie?tmdb=${tmdbId}`
      }
    ];

    // Try each source until one works
    for (const source of sources) {
      try {
        const url = source.getUrl();
        const response = await fetch(url, { 
          method: 'HEAD',
          signal: AbortSignal.timeout(5000) // Using AbortSignal instead of timeout option
        });
        
        if (response.ok) {
          return { embedUrl: url, isEmbed: true };
        }
      } catch (error) {
        console.warn(`Source ${source.base} unavailable, trying next...`);
        continue;
      }
    }

    throw new Error('No available streaming sources found');
  } catch (error) {
    console.error('Error creating streaming URL:', error);
    return {
      error: 'Content is temporarily unavailable. Please try again or choose a different title.',
      embedUrl: null,
      isEmbed: true
    };
  }
};

export const fetchSimilarContent = async (id: number, type: 'movie' | 'tv' = 'movie') => {
  const { data } = await tmdbApi.get<TMDBResponse<any>>(`/${type}/${id}/similar`);
  return data.results;
};

export const fetchRecommendedContent = async (id: number, type: 'movie' | 'tv' = 'movie') => {
  const { data } = await tmdbApi.get<TMDBResponse<any>>(`/${type}/${id}/recommendations`);
  return data.results;
};

// Add TV show specific endpoints
export const fetchTVShowDetails = async (id: number) => {
  const { data } = await tmdbApi.get(`/tv/${id}`);
  return data;
};

export const fetchTVShowSeasonDetails = async (id: number, seasonNumber: number) => {
  const { data } = await tmdbApi.get(`/tv/${id}/season/${seasonNumber}`);
  return data;
};

export const fetchSimilarMovies = async (movieId: number) => {
  const { data } = await tmdbApi.get<TMDBResponse<Movie>>(`/movie/${movieId}/similar`);
  return data.results;
};

export const fetchRecommendedMovies = async (movieId: number) => {
  const { data } = await tmdbApi.get<TMDBResponse<Movie>>(`/movie/${movieId}/recommendations`);
  return data.results;
};

// TV Show specific functions
export const fetchPopularTVShows = async () => {
  const { data } = await tmdbApi.get<TMDBResponse<any>>('/tv/popular');
  return data.results.map(show => ({
    ...show,
    title: show.name,
    release_date: show.first_air_date,
    media_type: 'tv'
  }));
};

export const fetchTopRatedTVShows = async () => {
  const { data } = await tmdbApi.get<TMDBResponse<any>>('/tv/top_rated');
  return data.results.map(show => ({
    ...show,
    title: show.name,
    release_date: show.first_air_date,
    media_type: 'tv'
  }));
};

export const fetchTrendingTVShows = async () => {
  const { data } = await tmdbApi.get<TMDBResponse<any>>('/trending/tv/week');
  return data.results.map(show => ({
    ...show,
    title: show.name,
    release_date: show.first_air_date,
    media_type: 'tv'
  }));
};

export const fetchLatestTVShows = async () => {
  const { data } = await tmdbApi.get<TMDBResponse<any>>('/tv/on_the_air');
  return data.results.map(show => ({
    ...show,
    title: show.name,
    release_date: show.first_air_date,
    media_type: 'tv'
  }));
};

export const fetchTVShowTrailer = async (showId: number) => {
  const { data } = await tmdbApi.get<TMDBResponse<TMDBVideo>>(`/tv/${showId}/videos`);
  const trailer = data.results.find(
    (video: any) => video.type === 'Trailer' && video.site === 'YouTube'
  );
  return trailer ? `https://www.youtube.com/embed/${trailer.key}?autoplay=1&rel=0&modestbranding=1` : null;
};