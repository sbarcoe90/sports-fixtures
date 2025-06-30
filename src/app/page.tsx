'use client';

import { useFixtures } from '@/hooks/useFixtures';
import DaySection from '@/components/DaySection';

export default function Home() {
  const { fixtures, loading, error, refetch } = useFixtures();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading GAA fixtures...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-blue-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-red-800 mb-2">Error Loading Fixtures</h2>
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={refetch}
              className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-blue-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            Sports Weekend Fixtures
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Your complete guide to this weekend&apos;s GAA matches from the official GAA website
          </p>
          <div className="mt-4">
            <button
              onClick={refetch}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors text-sm"
            >
              Refresh Fixtures
            </button>
          </div>
        </header>

        {/* Fixtures Sections */}
        <main className="max-w-6xl mx-auto">
          {fixtures.length > 0 ? (
            fixtures.map((dayFixtures) => (
              <DaySection key={`${dayFixtures.day}-${dayFixtures.date}`} dayFixtures={dayFixtures} />
            ))
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-600 text-lg">No fixtures found for this weekend.</p>
              <p className="text-gray-500 text-sm mt-2">Check back later for updated fixtures.</p>
            </div>
          )}
        </main>

        {/* Footer */}
        <footer className="text-center mt-16 pt-8 border-t border-gray-200">
          <p className="text-gray-500 text-sm">
            Data sourced from <a href="https://www.gaa.ie/fixtures-results" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">GAA.ie</a>. All times are local and subject to change.
          </p>
        </footer>
      </div>
    </div>
  );
}
