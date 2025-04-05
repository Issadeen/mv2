'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { FaHome, FaFilm, FaTv, FaHeart, FaSearch } from 'react-icons/fa';

const navLinks = [
  { href: '/', label: 'Home', icon: FaHome },
  { href: '/movies', label: 'Movies', icon: FaFilm },
  { href: '/tv-shows', label: 'TV Shows', icon: FaTv },
  { href: '/my-list', label: 'My List', icon: FaHeart },
];

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      {/* Desktop Navigation */}
      <nav
        className={`fixed top-0 w-full z-40 transition-all duration-300 hidden md:block ${
          isScrolled ? 'bg-slate-900/80 backdrop-blur-xl' : 'bg-transparent'
        }`}
      >
        <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center flex-shrink-0">
              <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-emerald-200">
                MovieVerse
              </span>
            </Link>

            <div className="flex items-center space-x-8">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`nav-link ${pathname === link.href ? 'active text-emerald-400' : 'text-gray-300'}`}
                >
                  {link.label}
                </Link>
              ))}
              <button
                onClick={() => setIsSearchOpen(true)}
                className="p-2 text-gray-300 hover:text-white transition-colors"
              >
                <FaSearch className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-40 md:hidden ${
        isScrolled ? 'bg-slate-900/80 backdrop-blur-xl' : 'bg-gradient-to-b from-black/80 to-transparent'
      }`}>
        <div className="px-4 py-2">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex-shrink-0">
              <span className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-emerald-200">
                MovieVerse
              </span>
            </Link>
            <div className="flex items-center gap-4">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`p-2 ${pathname === link.href ? 'text-emerald-400' : 'text-gray-300'}`}
                >
                  <link.icon className="w-5 h-5" />
                </Link>
              ))}
              <button
                onClick={() => setIsSearchOpen(true)}
                className="p-2 text-gray-300"
              >
                <FaSearch className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Search Modal */}
      <AnimatePresence>
        {isSearchOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm"
          >
            <div className="flex min-h-screen items-center justify-center p-4">
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="w-full max-w-lg"
              >
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search movies and TV shows..."
                    className="w-full px-4 py-3 bg-slate-800/50 backdrop-blur-xl border border-slate-700 rounded-full text-white placeholder-gray-400 focus:outline-none focus:border-emerald-500"
                    autoFocus
                  />
                  <button
                    onClick={() => setIsSearchOpen(false)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                  >
                    Cancel
                  </button>
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}