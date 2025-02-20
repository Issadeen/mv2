'use client';
import { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { FaSearch, FaTimes } from 'react-icons/fa';
import { PlayIcon } from '@heroicons/react/24/solid';
import Link from 'next/link';
import { useMovies } from '../context/MoviesContext';
import { searchContent } from '../services/tmdb';
import { Movie } from '../context/MoviesContext';

export default function SearchOverlay({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Movie[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const searchMovies = async () => {
      if (query.length < 2) {
        setResults([]);
        return;
      }
      
      setIsLoading(true);
      try {
        const data = await searchContent(query);
        setResults(data);
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    const debounce = setTimeout(searchMovies, 300);
    return () => clearTimeout(debounce);
  }, [query]);

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="min-h-full p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-3xl mx-auto rounded-2xl">
                <div className="relative">
                  <FaSearch className="absolute left-5 top-5 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search movies..."
                    className="w-full h-16 pl-14 pr-4 text-lg bg-slate-900/90 backdrop-blur-xl rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    autoFocus
                  />
                </div>

                <div className="mt-4 bg-slate-900/90 backdrop-blur-xl rounded-2xl">
                  {isLoading ? (
                    <div className="flex items-center justify-center p-8">
                      <div className="w-8 h-8 border-4 border-emerald-400/20 border-t-emerald-400 rounded-full animate-spin" />
                    </div>
                  ) : results.length > 0 ? (
                    <div className="grid gap-4 p-4 grid-cols-1 sm:grid-cols-2">
                      {results.map((movie) => (
                        <Link 
                          key={movie.id} 
                          href={`/watch/${movie.id}`}
                          onClick={onClose}
                          className="flex gap-4 p-2 rounded-lg hover:bg-white/5 transition-colors"
                        >
                          <div className="relative w-24 h-36 flex-shrink-0">
                            <img
                              src={`https://image.tmdb.org/t/p/w200${movie.poster_path}`}
                              alt={movie.title}
                              className="object-cover w-full h-full rounded-lg"
                            />
                          </div>
                          <div className="flex flex-col flex-grow">
                            <h3 className="font-semibold">{movie.title}</h3>
                            <p className="text-sm text-gray-400 line-clamp-2 mt-1">
                              {movie.overview}
                            </p>
                            <div className="flex items-center gap-2 mt-2 text-sm text-gray-400">
                              <span>{movie.release_date?.split('-')[0]}</span>
                              {movie.vote_average && (
                                <>
                                  <span>•</span>
                                  <span className="text-emerald-400">
                                    ★ {movie.vote_average.toFixed(1)}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  ) : query.length > 0 && (
                    <div className="p-8 text-center text-gray-400">
                      No results found for "{query}"
                    </div>
                  )}
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
