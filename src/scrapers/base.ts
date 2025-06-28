import { Fixture, DayFixtures, ScraperResult } from '../types/sports';

// Base interface that all sport scrapers must implement
export interface SportScraper {
  name: string;
  isActive(): boolean;
  scrapeFixtures(): Promise<ScraperResult>;
}

// Base class with common functionality
export abstract class BaseScraper implements SportScraper {
  abstract name: string;
  
  abstract isActive(): boolean;
  abstract scrapeFixtures(): Promise<ScraperResult>;
  
  // Common helper methods
  protected parseTimeToMinutes(time: string): number {
    if (!time) return 0;
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
  }
  
  protected sortFixturesByTime(fixtures: Fixture[]): Fixture[] {
    return fixtures.sort((a, b) => 
      this.parseTimeToMinutes(a.time) - this.parseTimeToMinutes(b.time)
    );
  }
  
  protected createScraperResult(
    sport: string, 
    fixtures: DayFixtures[], 
    success: boolean, 
    error?: string
  ): ScraperResult {
    return {
      sport,
      fixtures,
      success,
      error,
      timestamp: new Date().toISOString()
    };
  }
}
