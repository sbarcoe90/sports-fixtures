import { BaseScraper } from './base';
import { ScraperResult, DayFixtures, Fixture } from '../types/sports';
import { gaaFixtures } from '../data/gaaFixtures';

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
      // Map gaaFixtures to Fixture type
      const fixtures: Fixture[] = gaaFixtures.map(f => ({
        id: `${f.match}-${f.time}`.replace(/\s/g, ''),
        time: f.time,
        sport: f.sport,
        match: f.match,
        channel: f.tv_channel, // rename
        date: f.date.split('T')[0],
        venue: f.venue,
        competition: f.competition
      }));
      const processed = this.processFixtures(fixtures);
      console.log(`Found ${processed.reduce((sum, day) => sum + day.fixtures.length, 0)} GAA fixtures from local data.`);
      return this.createScraperResult(this.name, processed, true);
    } catch (error) {
      const errorMessage = `Error loading GAA fixtures: ${error instanceof Error ? error.message : 'Unknown error'}`;
      console.error(errorMessage);
      return this.createScraperResult(this.name, [], false, errorMessage);
    }
  }

  private processFixtures(fixtures: Fixture[]): DayFixtures[] {
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
          channel: fixture.channel,
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
