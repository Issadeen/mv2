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

// Add TV-specific network configuration
const setupTVNetwork = () => {
  if (/\b(webos|tizen|vidaa|hbbtv)\b/i.test(navigator.userAgent.toLowerCase())) {
    return {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      },
      mode: 'cors' as RequestMode,
      credentials: 'omit' as RequestCredentials,
      redirect: 'follow' as RequestRedirect,
    };
  }
  return {};
};

export const fetchStreamingUrls = async (
  tmdbId: number, 
  mediaType: 'movie' | 'tv' = 'movie',
  season?: number,
  episode?: number
) => {
  const cacheKey = `stream-${tmdbId}-${mediaType}-${season}-${episode}`;
  const isWebOS = /\b(webos)\b/i.test(navigator.userAgent.toLowerCase());
  
  try {
    const sources = [
      'https://vidsrc.to/embed',
      'https://www.vidplay.site/e',
      'https://2embed.org/embed',
      'https://vidsrc.xyz/embed',
      'https://multiembed.mov/directstream.php'
    ];

    const generateUrl = (base: string): string => {
      if (mediaType === 'tv') {
        return `${base}/tv?tmdb=${tmdbId}&s=${season}&e=${episode}`;
      }
      return `${base}/movie?tmdb=${tmdbId}`;
    };

    // For WebOS, use direct source without validation to prevent refresh loops
    if (isWebOS) {
      const sourceUrl = generateUrl(sources[0]);
      return { 
        embedUrl: sourceUrl,
        isEmbed: true,
        isWebOS: true,
        useWebView: true
      };
    }

    // For non-WebOS devices, continue with normal source checking
    const sourcePromises = sources.map(base => 
      new Promise<string | null>(async (resolve) => {
        try {
          const url = generateUrl(base);
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 3000);

          const response = await fetch(url, { 
            method: 'HEAD',
            signal: controller.signal
          });
          
          clearTimeout(timeoutId);
          
          if (response.ok) {
            resolve(url);
          } else {
            resolve(null);
          }
        } catch (error) {
          resolve(null);
        }
      })
    );

    const results = await Promise.all(sourcePromises);
    const validUrl = results.find(url => url !== null);

    if (validUrl) {
      const result = { embedUrl: validUrl, isEmbed: true };
      sessionStorage.setItem(cacheKey, JSON.stringify(result));
      return result;
    }

    // Fallback to first source
    const sourceUrl = generateUrl(sources[0]);
    const result = { embedUrl: sourceUrl, isEmbed: true };
    if (!isWebOS) {
      sessionStorage.setItem(cacheKey, JSON.stringify(result));
    }
    return result;

  } catch (error) {
    console.error('Error creating streaming URL:', error);
    const fallbackBase = isWebOS ? 'https://vidsrc.to/embed' : 'https://www.vidplay.site/e';
    const fallbackUrl = `${fallbackBase}/${mediaType === 'tv' ? 'tv' : 'movie'}?tmdb=${tmdbId}${mediaType === 'tv' ? `&s=${season}&e=${episode}` : ''}`;
    
    return { 
      embedUrl: fallbackUrl,
      isEmbed: true,
      isWebOS,
      useWebView: isWebOS
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