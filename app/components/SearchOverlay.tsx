'use client';
import { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { FaSearch, FaTimes } from 'react-icons/fa';
import { PlayIcon } from '@heroicons/react/24/solid';
import Link from 'next/link';
import { Movie, TVShow, Media } from '../context/MoviesContext';

export default function SearchOverlay({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Media[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'movies' | 'tv'>('all');

  useEffect(() => {
    const searchMedia = async () => {
      if (query.length < 2) {
        setResults([]);
        return;
      }
      
      setIsLoading(true);
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_TMDB_BASE_URL}/search/multi?api_key=${process.env.NEXT_PUBLIC_TMDB_API_KEY}&query=${query}`
        );
        const data = await response.json();
        const filteredResults = data.results.filter((item: any) => 
          item.media_type === 'movie' || item.media_type === 'tv'
        ).map((item: any) => ({
          ...item,
          title: item.title || item.name,
          release_date: item.release_date || item.first_air_date
        }));
        setResults(filteredResults);
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    const debounce = setTimeout(searchMedia, 300);
    return () => clearTimeout(debounce);
  }, [query]);

  const filteredResults = results.filter(item => {
    if (activeTab === 'all') return true;
    return item.media_type === activeTab;
  });

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
                    placeholder="Search movies and TV shows..."
                    className="w-full h-16 pl-14 pr-4 text-lg bg-slate-900/90 backdrop-blur-xl rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    autoFocus
                  />
                </div>

                <div className="mt-4 bg-slate-900/90 backdrop-blur-xl rounded-2xl">
                  <div className="flex gap-2 p-2">
                    {['all', 'movies', 'tv'].map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setActiveTab(tab as 'all' | 'movies' | 'tv')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          activeTab === tab
                            ? 'bg-emerald-500 text-white'
                            : 'text-gray-400 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                      </button>
                    ))}
                  </div>

                  {isLoading ? (
                    <div className="flex items-center justify-center p-8">
                      <div className="w-8 h-8 border-4 border-emerald-400/20 border-t-emerald-400 rounded-full animate-spin" />
                    </div>
                  ) : filteredResults.length > 0 ? (
                    <div className="grid gap-4 p-4 grid-cols-1 sm:grid-cols-2">
                      {filteredResults.map((item) => (
                        <Link 
                          key={item.id} 
                          href={`/watch/${item.id}?type=${item.media_type}`}
                          onClick={onClose}
                          className="flex gap-4 p-2 rounded-lg hover:bg-white/5 transition-colors"
                        >
                          <div className="w-16 h-24 flex-shrink-0">
                            <img
                              src={`https://image.tmdb.org/t/p/w200${item.poster_path}`}
                              alt={item.title || item.name}
                              className="w-full h-full object-cover rounded-md"
                            />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-medium mb-1">{item.title || item.name}</h3>
                            <div className="flex items-center gap-2 text-sm text-gray-400">
                              <span>{new Date(item.release_date || '').getFullYear()}</span>
                              <span>•</span>
                              <span className="capitalize">{item.media_type}</span>
                              {item.vote_average && (
                                <>
                                  <span>•</span>
                                  <span className="text-emerald-400">★ {item.vote_average.toFixed(1)}</span>
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
