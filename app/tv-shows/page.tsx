import ContentListPage from '../components/ContentListPage';
import * as tmdbApi from '../services/tmdb'; // Import API functions

export default function TVShowsPage() {
  // Provide TV show-specific functions and configurations
  return (
    <ContentListPage
      title="TV Shows"
      fetchDataFunction={tmdbApi.fetchPopularTVShows} // Function to fetch popular TV shows initially
      searchFunction={async (query) => { // Adapt search function if needed
        const results = await tmdbApi.searchContent(query);
        return results.filter(item => item.media_type === 'tv'); // Ensure only TV shows are returned
      }}
      fetchGenresFunction={tmdbApi.fetchTVShowGenres} // Function to fetch TV genres
      mediaType="tv"
      queryKey="tvshows" // Unique query key for TV shows
    />
  );
}