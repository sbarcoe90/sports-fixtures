import { useState, useEffect } from 'react';
import type { DayFixtures } from '../types/sports';

interface UseFixturesReturn {
  fixtures: DayFixtures[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useFixtures(): UseFixturesReturn {
  const [fixtures, setFixtures] = useState<DayFixtures[]>([]);
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
        const groupedByDay = new Map<string, DayFixtures>();

        data.data.forEach((dayFixtures: DayFixtures) => {
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
            // Robust time parsing: trim and pad
            const parseTime = (t: string) => {
              const [h, m] = t.trim().split(':').map(Number);
              return h * 60 + m;
            };
            return parseTime(a.time) - parseTime(b.time);
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