'use client';

import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { ThemeProvider } from 'next-themes';
import { TVProvider } from './context/TVContext';
import { MoviesProvider } from './context/MoviesContext';

export default function Providers({ children }: { children: React.ReactNode }) {
  // Create client in component to prevent shared state between requests
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,
        retry: 1,
        staleTime: 1000 * 60 * 5, // 5 minutes
        gcTime: 1000 * 60 * 15, // 15 minutes
      },
    },
  }));

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider enableSystem={false} attribute="class" defaultTheme="dark" forcedTheme="dark">
        <TVProvider>
          <MoviesProvider>
            {children}
          </MoviesProvider>
        </TVProvider>
      </ThemeProvider>
      {process.env.NODE_ENV !== 'production' && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  );
}