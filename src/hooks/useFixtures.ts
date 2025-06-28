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
        setFixtures(data.data);
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