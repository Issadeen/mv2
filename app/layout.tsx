import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import Navbar from './components/Navbar'
import { MoviesProvider } from './context/MoviesContext'
import Providers from './providers'

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
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-slate-900 text-white min-h-screen`}>
        <Providers>
          <MoviesProvider>
            <Navbar />
            <main className="min-h-screen">{children}</main>
          </MoviesProvider>
        </Providers>
      </body>
    </html>
  )
}
