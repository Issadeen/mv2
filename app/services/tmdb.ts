import axios from 'axios';
import { Media, Movie, TVShow, TMDBResponse, TMDBVideo, Genre, StreamingInfo } from '../types/media'; // Import shared types

const tmdbApi = axios.create({
  baseURL: process.env.NEXT_PUBLIC_TMDB_BASE_URL,
  params: {
    api_key: process.env.NEXT_PUBLIC_TMDB_API_KEY,
  },
});

// --- Movie Endpoints ---

export const fetchLatestMovies = async (): Promise<Movie[]> => {
  const { data } = await tmdbApi.get<TMDBResponse<Movie>>('/movie/now_playing');
  return data.results.map(movie => ({ ...movie, media_type: 'movie' }));
};

export const fetchMovieTrailer = async (movieId: number): Promise<string | null> => {
  try {
    const { data } = await tmdbApi.get<{ results: TMDBVideo[] }>(`/movie/${movieId}/videos`);
    const trailer = data.results.find(
      (video) => video.site === 'YouTube' && (video.type === 'Trailer' || video.type === 'Teaser')
    );
    const officialTrailer = data.results.find(
      (video) => video.site === 'YouTube' && video.type === 'Trailer' && video.name.toLowerCase().includes('official trailer')
    );
    const key = officialTrailer?.key || trailer?.key;
    return key ? `https://www.youtube.com/embed/${key}?autoplay=1&rel=0&modestbranding=1&iv_load_policy=3&controls=1&showinfo=0` : null;
  } catch (error) {
    console.error(`Error fetching trailer for movie ${movieId}:`, error);
    return null;
  }
};

export const searchMovies = async (query: string): Promise<Movie[]> => {
  const { data } = await tmdbApi.get<TMDBResponse<Movie>>('/search/movie', {
    params: { query },
  });
  return data.results.map(movie => ({ ...movie, media_type: 'movie' }));
};

export const fetchMoviesByGenre = async (genreId: number): Promise<Movie[]> => {
  const { data } = await tmdbApi.get<TMDBResponse<Movie>>('/discover/movie', {
    params: { with_genres: genreId },
  });
  return data.results.map(movie => ({ ...movie, media_type: 'movie' }));
};

export const fetchMovieGenres = async (): Promise<Genre[]> => {
  const { data } = await tmdbApi.get<{ genres: Genre[] }>('/genre/movie/list');
  return data.genres;
};

export const fetchPopularMovies = async (): Promise<Movie[]> => {
  const { data } = await tmdbApi.get<TMDBResponse<Movie>>('/movie/popular');
  return data.results.map(movie => ({ ...movie, media_type: 'movie' }));
};

export const fetchTopRatedMovies = async (): Promise<Movie[]> => {
  const { data } = await tmdbApi.get<TMDBResponse<Movie>>('/movie/top_rated');
  return data.results.map(movie => ({ ...movie, media_type: 'movie' }));
};

export const fetchUpcomingMovies = async (): Promise<Movie[]> => {
  const { data } = await tmdbApi.get<TMDBResponse<Movie>>('/movie/upcoming');
  return data.results.map(movie => ({ ...movie, media_type: 'movie' }));
};

// --- TV Show Endpoints ---

export const fetchPopularTVShows = async (): Promise<TVShow[]> => {
  const { data } = await tmdbApi.get<TMDBResponse<TVShow>>('/tv/popular');
  return data.results.map(show => ({
    ...show,
    title: show.name,
    release_date: show.first_air_date,
    media_type: 'tv'
  }));
};

export const fetchTopRatedTVShows = async (): Promise<TVShow[]> => {
  const { data } = await tmdbApi.get<TMDBResponse<TVShow>>('/tv/top_rated');
  return data.results.map(show => ({
    ...show,
    title: show.name,
    release_date: show.first_air_date,
    media_type: 'tv'
  }));
};

export const fetchTrendingTVShows = async (): Promise<TVShow[]> => {
  const { data } = await tmdbApi.get<TMDBResponse<TVShow>>('/trending/tv/week');
  return data.results.map(show => ({
    ...show,
    title: show.name,
    release_date: show.first_air_date,
    media_type: 'tv'
  }));
};

export const fetchLatestTVShows = async (): Promise<TVShow[]> => {
  const { data } = await tmdbApi.get<TMDBResponse<TVShow>>('/tv/on_the_air');
  return data.results.map(show => ({
    ...show,
    title: show.name,
    release_date: show.first_air_date,
    media_type: 'tv'
  }));
};

export const fetchTVShowTrailer = async (showId: number): Promise<string | null> => {
  try {
    const { data } = await tmdbApi.get<{ results: TMDBVideo[] }>(`/tv/${showId}/videos`);
    const trailer = data.results.find(
      (video) => video.site === 'YouTube' && (video.type === 'Trailer' || video.type === 'Teaser')
    );
    const officialTrailer = data.results.find(
      (video) => video.site === 'YouTube' && video.type === 'Trailer' && video.name.toLowerCase().includes('official trailer')
    );
    const key = officialTrailer?.key || trailer?.key;
    return key ? `https://www.youtube.com/embed/${key}?autoplay=1&rel=0&modestbranding=1&iv_load_policy=3&controls=1&showinfo=0` : null;
  } catch (error) {
    console.error(`Error fetching trailer for TV show ${showId}:`, error);
    return null;
  }
};

export const fetchTVShowGenres = async (): Promise<Genre[]> => {
  const { data } = await tmdbApi.get<{ genres: Genre[] }>('/genre/tv/list');
  return data.genres;
};

// --- Combined/Generic Endpoints ---

export const searchContent = async (query: string): Promise<Media[]> => {
  const { data } = await tmdbApi.get<TMDBResponse<Media>>(`/search/multi`, {
    params: { query, include_adult: false },
  });
  return data.results
    .filter(item => item.media_type === 'movie' || item.media_type === 'tv')
    .map(item => ({
      ...item,
      title: item.media_type === 'movie' ? item.title : item.name,
      release_date: item.media_type === 'movie' ? item.release_date : item.first_air_date,
    }));
};

export const fetchDetails = async (id: number, type: 'movie' | 'tv'): Promise<Media | null> => {
  try {
    const { data } = await tmdbApi.get<Media>(`/${type}/${id}`);
    return {
      ...data,
      media_type: type,
      title: type === 'movie' ? data.title : data.name,
      release_date: type === 'movie' ? data.release_date : data.first_air_date,
    };
  } catch (error) {
    console.error(`Error fetching details for ${type} ${id}:`, error);
    return null;
  }
};

// --- Streaming URL Logic ---

export const fetchStreamingUrls = async (
  tmdbId: number,
  mediaType: 'movie' | 'tv' = 'movie',
  season?: number,
  episode?: number
): Promise<StreamingInfo> => {
  const cacheKey = `stream-${tmdbId}-${mediaType}-${season}-${episode}`;
  const isWebOS = typeof window !== 'undefined' && /\b(webos)\b/i.test(navigator.userAgent.toLowerCase());

  if (!isWebOS && typeof sessionStorage !== 'undefined') {
    const cachedData = sessionStorage.getItem(cacheKey);
    if (cachedData) {
      try {
        return JSON.parse(cachedData);
      } catch (e) {
        console.warn("Failed to parse cached streaming data", e);
        sessionStorage.removeItem(cacheKey);
      }
    }
  }

  try {
    const sources = [
      'https://vidsrc.to/embed',
      'https://vidsrc.xyz/embed',
      'https://www.vidplay.site/e',
      'https://multiembed.mov/directstream.php',
      'https://moviesapi.club/movie',
    ];

    const generateUrl = (base: string): string => {
      if (base.includes('multiembed.mov')) {
        return `${base}?tmdb=${tmdbId}`;
      }
      if (base.includes('moviesapi.club')) {
        return `${base}/${tmdbId}`;
      }
      if (mediaType === 'tv') {
        return `${base}/tv/${tmdbId}/${season}/${episode}`;
      }
      return `${base}/movie/${tmdbId}`;
    };

    if (isWebOS) {
      console.log("WebOS detected, using direct source:", sources[0]);
      const sourceUrl = generateUrl(sources[0]);
      return {
        embedUrl: sourceUrl,
        isEmbed: true,
        isWebOS: true,
        useWebView: true
      };
    }

    console.log(`Fetching streaming URLs for ${mediaType} ${tmdbId} (S:${season} E:${episode})`);
    for (const base of sources) {
      const url = generateUrl(base);
      console.log("Trying source:", url);
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3500);

        const response = await fetch(url, {
          method: 'HEAD',
          signal: controller.signal,
          mode: 'no-cors',
          cache: 'no-store',
        });

        clearTimeout(timeoutId);

        if (response.ok || response.type === 'opaqueredirect' || response.status === 200) {
          console.log("Found valid source:", url);
          const result = { embedUrl: url, isEmbed: true };
          if (typeof sessionStorage !== 'undefined') {
            sessionStorage.setItem(cacheKey, JSON.stringify(result));
          }
          return result;
        } else {
          console.log(`Source failed (Status: ${response.status}):`, url);
        }
      } catch (error: any) {
        if (error.name === 'AbortError') {
          console.log("Source timed out:", url);
        } else {
          console.log("Source error:", url, error.message);
        }
      }
    }

    console.warn("No sources validated quickly, falling back to first source:", sources[0]);
    const fallbackUrl = generateUrl(sources[0]);
    const fallbackResult = { embedUrl: fallbackUrl, isEmbed: true };
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem(cacheKey, JSON.stringify(fallbackResult));
    }
    return fallbackResult;

  } catch (error) {
    console.error('Critical error creating streaming URL:', error);
    const fallbackBase = 'https://vidsrc.to/embed';
    const finalFallbackUrl = `${fallbackBase}/${mediaType === 'tv' ? 'tv' : 'movie'}/${tmdbId}${mediaType === 'tv' ? `/${season}/${episode}` : ''}`;
    console.error("Using final fallback URL:", finalFallbackUrl);

    return {
      embedUrl: finalFallbackUrl,
      isEmbed: true,
      isWebOS: isWebOS,
      useWebView: isWebOS
    };
  }
};

// --- Similar and Recommended Content ---

export const fetchSimilarContent = async (id: number, type: 'movie' | 'tv' = 'movie'): Promise<Media[]> => {
  try {
    const { data } = await tmdbApi.get<TMDBResponse<Media>>(`/${type}/${id}/similar`);
    return data.results.map(item => ({
      ...item,
      media_type: type,
      title: type === 'movie' ? item.title : item.name,
      release_date: type === 'movie' ? item.release_date : item.first_air_date,
    }));
  } catch (error) {
    console.error(`Error fetching similar content for ${type} ${id}:`, error);
    return [];
  }
};

export const fetchRecommendedContent = async (id: number, type: 'movie' | 'tv' = 'movie'): Promise<Media[]> => {
  try {
    const { data } = await tmdbApi.get<TMDBResponse<Media>>(`/${type}/${id}/recommendations`);
    return data.results.map(item => ({
      ...item,
      media_type: type,
      title: type === 'movie' ? item.title : item.name,
      release_date: type === 'movie' ? item.release_date : item.first_air_date,
    }));
  } catch (error) {
    console.error(`Error fetching recommended content for ${type} ${id}:`, error);
    return [];
  }
};

// --- Deprecated/Combined Functions ---

export const fetchSimilarMovies = async (movieId: number): Promise<Movie[]> => {
  console.warn("fetchSimilarMovies is deprecated, use fetchSimilarContent(id, 'movie') instead.");
  const results = await fetchSimilarContent(movieId, 'movie');
  return results.filter(item => item.media_type === 'movie') as Movie[];
};

export const fetchRecommendedMovies = async (movieId: number): Promise<Movie[]> => {
  console.warn("fetchRecommendedMovies is deprecated, use fetchRecommendedContent(id, 'movie') instead.");
  const results = await fetchRecommendedContent(movieId, 'movie');
  return results.filter(item => item.media_type === 'movie') as Movie[];
};

export const fetchTVShows = async (): Promise<TVShow[]> => {
  console.warn("fetchTVShows is deprecated, use fetchTrendingTVShows() or fetchPopularTVShows() instead.");
  return fetchTrendingTVShows();
};

export const fetchTVShowDetails = async (id: number): Promise<TVShow | null> => {
  console.warn("fetchTVShowDetails is deprecated, use fetchDetails(id, 'tv') instead.");
  const result = await fetchDetails(id, 'tv');
  return result as TVShow | null;
};

export const fetchTVShowSeasonDetails = async (id: number, seasonNumber: number) => {
  try {
    const { data } = await tmdbApi.get(`/tv/${id}/season/${seasonNumber}`);
    return data;
  } catch (error) {
    console.error(`Error fetching season details for TV show ${id}, season ${seasonNumber}:`, error);
    return null;
  }
};