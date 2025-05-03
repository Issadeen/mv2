'use client';

import ContentListPage from '../components/ContentListPage';
import * as tmdbApi from '../services/tmdb'; // Import API functions

export default function MoviesPage() {
  // Provide movie-specific functions and configurations
  return (
    <ContentListPage
      title="Movies"
      fetchDataFunction={tmdbApi.fetchPopularMovies} // Function to fetch popular movies initially
      searchFunction={tmdbApi.searchMovies} // Function to search movies
      fetchGenresFunction={tmdbApi.fetchMovieGenres} // Function to fetch movie genres
      mediaType="movie"
      queryKey="movies" // Unique query key for movies
    />
  );
}