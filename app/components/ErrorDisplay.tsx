'use client';

export default function ErrorDisplay({ error }: { error: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] p-8">
      <div className="bg-red-500/10 rounded-lg p-6 max-w-lg w-full">
        <h2 className="text-xl font-semibold text-red-400 mb-4">Playback Error</h2>
        <p className="text-gray-300">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-6 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}