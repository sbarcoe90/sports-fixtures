import { BaseScraper } from './base';
import { ScraperResult, DayFixtures } from '../types/sports';

// Use a try-catch for the import to handle cases where the file doesn't exist during build time
let gaaFixtures: any[] = [];
try {
  gaaFixtures = require('../data/gaaFixtures').gaaFixtures;
} catch (error) {
  console.warn('Could not load local GAA fixtures. Please run the refresh script from the admin panel.');
}

export class GAAScraper extends BaseScraper {
  name = 'GAA';

  isActive(): boolean {
    // GAA is active from January to September
    const now = new Date();
    return now.getMonth() >= 0 && now.getMonth() <= 8;
  }

  async scrapeFixtures(): Promise<ScraperResult> {
    try {
      if (!gaaFixtures || gaaFixtures.length === 0) {
         throw new Error('gaaFixtures data is missing or empty. Please run the refresh script from the admin panel.');
      }
      console.log(`Loading GAA fixtures from local data...`);
      const fixtures = this.processFixtures(gaaFixtures);
      console.log(`Found ${fixtures.reduce((sum, day) => sum + day.fixtures.length, 0)} GAA fixtures from local data.`);
      return this.createScraperResult(this.name, fixtures, true);
    } catch (error) {
      const errorMessage = `Error loading GAA fixtures: ${error instanceof Error ? error.message : 'Unknown error'}`;
      console.error(errorMessage);
      return this.createScraperResult(this.name, [], false, errorMessage);
    }
  }

  private processFixtures(fixtures: any[]): DayFixtures[] {
    const fixturesByDay = new Map<string, DayFixtures>();

    fixtures
      .filter(fixture => new Date(fixture.date) >= new Date()) // Only include upcoming fixtures
      .forEach(fixture => {
        const dateOnly = fixture.date.split('T')[0];
        const stageDate = new Date(`${dateOnly}T${fixture.time}`);
        const dayKey = dateOnly; // ISO string

        if (!fixturesByDay.has(dayKey)) {
          fixturesByDay.set(dayKey, {
            day: stageDate.toLocaleDateString('en-US', { weekday: 'long' }),
            date: dayKey, // ISO string
            fixtures: []
          });
        }

        fixturesByDay.get(dayKey)?.fixtures.push({
          id: `${fixture.match}-${fixture.time}`.replace(/\s/g, ''),
          time: fixture.time,
          sport: fixture.sport,
          match: fixture.match,
          channel: fixture.tv_channel,
          date: dayKey, // ISO string
          venue: fixture.venue,
          competition: fixture.competition
        });
      });

    // Sort fixtures within each day by time
    fixturesByDay.forEach(day => {
      day.fixtures.sort((a, b) => this.parseTimeToMinutes(a.time) - this.parseTimeToMinutes(b.time));
    });

    return Array.from(fixturesByDay.values());
  }
}
