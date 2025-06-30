import { BaseScraper } from './base';
import { ScraperResult, DayFixtures, Fixture } from '../types/sports';
import { f1Fixtures2024 } from '../data/f1Fixtures';

export class F1Scraper extends BaseScraper {
  name = 'F1';

  isActive(): boolean {
    return true;
  }

  async scrapeFixtures(): Promise<ScraperResult> {
    try {
      console.log("--- F1 SCRAPER START ---");
      console.log(`Found ${f1Fixtures2024.length} raw F1 fixtures in the data file.`);
      
      const fixtures: Fixture[] = f1Fixtures2024.map(f => ({
        id: `${f.name}-${f.time}`.replace(/\s/g, ''),
        time: f.time,
        sport: f.sport,
        match: f.name,
        channel: f.tv_channel,
        date: f.date,
        venue: undefined,
        competition: 'Formula 1'
      }));
      
      const processed = this.processFixtures(fixtures);
      
      console.log(`Processed ${processed.length} days with F1 fixtures.`);
      console.log(`Total final F1 fixtures: ${processed.reduce((sum, day) => sum + day.fixtures.length, 0)}`);
      console.log("--- F1 SCRAPER END ---");

      return this.createScraperResult(this.name, processed, true);
    } catch (error) {
      const errorMessage = `Error loading F1 fixtures: ${error instanceof Error ? error.message : 'Unknown error'}`;
      console.error(errorMessage);
      return this.createScraperResult(this.name, [], false, errorMessage);
    }
  }

  private processFixtures(fixtures: Fixture[]): DayFixtures[] {
    const fixturesByDay = new Map<string, DayFixtures>();

    fixtures
      .filter(fixture => new Date(fixture.date) >= new Date()) // Only include upcoming fixtures
      .forEach(fixture => {
        const stageDate = new Date(`${fixture.date}T${fixture.time}`);
        const dayKey = fixture.date; // already ISO string

        if (!fixturesByDay.has(dayKey)) {
          fixturesByDay.set(dayKey, {
            day: stageDate.toLocaleDateString('en-US', { weekday: 'long' }),
            date: dayKey, // ISO string
            fixtures: []
          });
        }

        const [grandPrix] = fixture.match.split(' – ');

        fixturesByDay.get(dayKey)?.fixtures.push({
          id: fixture.id,
          time: fixture.time,
          sport: fixture.sport,
          match: fixture.match,
          channel: fixture.channel,
          date: dayKey, // ISO string
          venue: grandPrix,
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