import { BaseScraper } from './base';
import { ScraperResult, DayFixtures } from '../types/sports';
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
      
      const fixtures = this.processFixtures(f1Fixtures2024);
      
      console.log(`Processed ${fixtures.length} days with F1 fixtures.`);
      console.log(`Total final F1 fixtures: ${fixtures.reduce((sum, day) => sum + day.fixtures.length, 0)}`);
      console.log("--- F1 SCRAPER END ---");

      return this.createScraperResult(this.name, fixtures, true);
    } catch (error) {
      const errorMessage = `Error loading F1 fixtures: ${error instanceof Error ? error.message : 'Unknown error'}`;
      console.error(errorMessage);
      return this.createScraperResult(this.name, [], false, errorMessage);
    }
  }

  private processFixtures(fixtures: any[]): DayFixtures[] {
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

        const [grandPrix] = fixture.name.split(' – ');

        fixturesByDay.get(dayKey)?.fixtures.push({
          id: `${fixture.name}-${fixture.time}`.replace(/\s/g, ''),
          time: fixture.time,
          sport: fixture.sport,
          match: fixture.name,
          channel: fixture.tv_channel,
          date: dayKey, // ISO string
          venue: grandPrix,
          competition: 'Formula 1'
        });
      });

    // Sort fixtures within each day by time
    fixturesByDay.forEach(day => {
      day.fixtures.sort((a, b) => this.parseTimeToMinutes(a.time) - this.parseTimeToMinutes(b.time));
    });

    return Array.from(fixturesByDay.values());
  }
}