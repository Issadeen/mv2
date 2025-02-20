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

export const fetchStreamingUrls = async (
  tmdbId: number, 
  mediaType: 'movie' | 'tv' = 'movie',
  season?: number,
  episode?: number
) => {
  try {
    const url = mediaType === 'tv'
      ? `https://vidsrc.xyz/embed/tv?tmdb=${tmdbId}&season=${season}&episode=${episode}`
      : `https://vidsrc.xyz/embed/movie?tmdb=${tmdbId}`;

    // Return the URL directly without checking its existence
    return {
      embedUrl: url,
      isEmbed: true
    };
  } catch (error) {
    console.error('Error creating streaming URL:', error);
    return null;
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