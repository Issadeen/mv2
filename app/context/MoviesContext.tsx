'use client';
import React, { createContext, useState, useContext, useEffect } from 'react';

// Base Media interface
export interface Media {
  id: number;
  title?: string | null;
  name?: string | null;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null; // Add this property
  release_date?: string;
  first_air_date?: string; 
  vote_average: number;
  media_type?: 'movie' | 'tv';
  genre_ids?: number[];
  popularity?: number;
  vote_count?: number;
}

// Movie specific interface
export interface Movie extends Media {
  title: string;
  release_date: string;
  media_type: 'movie';
}

// TV Show specific interface
export interface TVShow extends Media {
  name: string;
  first_air_date: string;
  media_type: 'tv';
  number_of_episodes?: number;
  number_of_seasons?: number;
}

interface MoviesContextProps {
  watchlist: Media[];
  addToWatchlist: (item: Media) => void;
  removeFromWatchlist: (id: number) => void;
  isMediaInWatchlist: (id: number) => boolean;
}

const MoviesContext = createContext<MoviesContextProps | undefined>(undefined);

export function MoviesProvider({ children }: { children: React.ReactNode }) {
  const [watchlist, setWatchlist] = useState<Media[]>([]);

  // Load watchlist from localStorage on initial mount
  useEffect(() => {
    const savedWatchlist = localStorage.getItem('watchlist');
    if (savedWatchlist) {
      try {
        const parsedWatchlist = JSON.parse(savedWatchlist);
        // Basic validation to ensure it's an array
        if (Array.isArray(parsedWatchlist)) {
          setWatchlist(parsedWatchlist);
        } else {
          console.warn("Invalid watchlist data found in localStorage.");
          localStorage.removeItem('watchlist'); // Clear invalid data
        }
      } catch (error) {
        console.error("Failed to parse watchlist from localStorage:", error);
        localStorage.removeItem('watchlist'); // Clear corrupted data
      }
    }
  }, []);

  // Save watchlist to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('watchlist', JSON.stringify(watchlist));
  }, [watchlist]);

  const addToWatchlist = (item: Media) => {
    setWatchlist((prev) => {
      // Avoid adding duplicates
      if (!prev.some((m) => m.id === item.id)) {
        // Add media_type if missing (important for watchlist differentiation)
        const itemToAdd = { ...item, media_type: item.media_type || (item.title ? 'movie' : 'tv') };
        return [...prev, itemToAdd];
      }
      return prev;
    });
  };

  const removeFromWatchlist = (id: number) => {
    setWatchlist((prev) => prev.filter((item) => item.id !== id));
  };

  const isMediaInWatchlist = (id: number) => {
    return watchlist.some((item) => item.id === id);
  };

  return (
    <MoviesContext.Provider
      value={{
        watchlist,
        addToWatchlist,
        removeFromWatchlist,
        isMediaInWatchlist,
      }}
    >
      {children}
    </MoviesContext.Provider>
  );
}

export const useMovies = () => {
  const context = useContext(MoviesContext);
  if (context === undefined) {
    throw new Error('useMovies must be used within a MoviesProvider');
  }
  return context;
};