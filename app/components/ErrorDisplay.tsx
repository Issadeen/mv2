'use client';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { FaExclamationTriangle, FaHome } from 'react-icons/fa';

interface ErrorDisplayProps {
  error: string;
  onRetry?: () => void;
}

export default function ErrorDisplay({ error, onRetry }: ErrorDisplayProps) {
  return (
    <div className="min-h-[400px] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center max-w-md"
      >
        <FaExclamationTriangle className="w-16 h-16 mx-auto mb-6 text-emerald-400/30" />
        <h2 className="text-2xl font-bold mb-4">Oops! Something went wrong</h2>
        <p className="text-gray-400 mb-8">{error}</p>
        <div className="flex justify-center gap-4">
          {onRetry && (
            <button
              onClick={onRetry}
              className="px-6 py-2 text-sm font-medium text-white transition-colors rounded-full bg-emerald-500 hover:bg-emerald-600"
            >
              Try Again
            </button>
          )}
          <Link href="/">
            <button className="flex items-center px-6 py-2 text-sm font-medium text-emerald-400 transition-colors rounded-full border border-emerald-400/50 hover:bg-emerald-500/10">
              <FaHome className="mr-2" />
              Go Home
            </button>
          </Link>
        </div>
      </motion.div>
    </div>
  );
}