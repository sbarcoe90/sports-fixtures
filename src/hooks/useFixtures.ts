import { useState, useEffect } from 'react';
import { GAADayFixtures } from '@/utils/gaaScraper';

interface UseFixturesReturn {
  fixtures: GAADayFixtures[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useFixtures(): UseFixturesReturn {
  const [fixtures, setFixtures] = useState<GAADayFixtures[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFixtures = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/fixtures');
      const data = await response.json();
      
      if (data.success) {
        // Group fixtures by ISO date string
        const groupedByDay = new Map<string, GAADayFixtures>();

        data.data.forEach((dayFixtures: GAADayFixtures) => {
          const key = dayFixtures.date; // ISO string, e.g. "2025-07-05"

          if (groupedByDay.has(key)) {
            const existing = groupedByDay.get(key)!;
            // Merge fixtures arrays for the same day
            existing.fixtures = [...existing.fixtures, ...dayFixtures.fixtures];
          } else {
            groupedByDay.set(key, { ...dayFixtures, fixtures: [...dayFixtures.fixtures] });
          }
        });

        // Convert to array and sort days chronologically
        const mergedFixtures = Array.from(groupedByDay.values()).sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
        );

        // Sort fixtures within each day by time (earliest to latest)
        mergedFixtures.forEach(day => {
          day.fixtures.sort((a, b) => {
            const [hA, mA] = a.time.split(':').map(Number);
            const [hB, mB] = b.time.split(':').map(Number);
            return hA * 60 + mA - (hB * 60 + mB);
          });
        });

        setFixtures(mergedFixtures);
        setError(null);
      } else {
        setError(data.message || 'Failed to fetch fixtures');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFixtures();
  }, []);

  return {
    fixtures,
    loading,
    error,
    refetch: fetchFixtures
  };
} 