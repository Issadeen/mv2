import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import Navbar from './components/Navbar'
import { MoviesProvider } from './context/MoviesContext'
import Providers from './providers'
import ClientLayout from './ClientLayout'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'MovieVerse - Your Streaming Platform',
  description: 'Stream your favorite movies and TV shows',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning data-tv-device>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      </head>
      <body className={`${inter.className} bg-slate-900 text-white min-h-screen overflow-hidden`}>
        <Providers>
          <MoviesProvider>
            <ClientLayout>
              <Navbar />
              <main className="min-h-screen">{children}</main>
            </ClientLayout>
          </MoviesProvider>
        </Providers>
      </body>
    </html>
  )
}
