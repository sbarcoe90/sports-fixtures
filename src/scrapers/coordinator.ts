import { ScraperResult } from '../types/sports';
import { getActiveScrapers } from './registry';

export class FixtureScraperCoordinator {
  async scrapeAllFixtures(): Promise<ScraperResult[]> {
    console.log('Starting multi-sport fixture scraping...');
    
    const activeScrapers = getActiveScrapers();
    console.log(`Found ${activeScrapers.length} active scrapers:`, 
      activeScrapers.map(s => s.config.name));
    
    const results: ScraperResult[] = [];
    
    for (const { config, scraper } of activeScrapers) {
      try {
        console.log(`Scraping ${config.name} fixtures...`);
        
        if (!scraper.isActive()) {
          console.log(`${config.name} is not currently active`);
          results.push({
            sport: config.name,
            fixtures: [],
            success: false,
            error: 'Sport not in season',
            timestamp: new Date().toISOString()
          });
          continue;
        }
        
        const result = await scraper.scrapeFixtures();
        results.push(result);
        
        console.log(`${config.name} scraping completed:`, 
          result.success ? 'SUCCESS' : 'FAILED');
        
      } catch (error) {
        console.error(`Error scraping ${config.name}:`, error);
        results.push({
          sport: config.name,
          fixtures: [],
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString()
        });
      }
    }
    
    return results;
  }
  
  async scrapeSingleSport(sportId: string): Promise<ScraperResult | null> {
    const activeScrapers = getActiveScrapers();
    const sport = activeScrapers.find(s => s.id === sportId);
    
    if (!sport) {
      return null;
    }
    
    return await sport.scraper.scrapeFixtures();
  }
}
