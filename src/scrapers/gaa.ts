import puppeteer from 'puppeteer';
import { BaseScraper } from './base';
import { ScraperResult, Fixture } from '../types/sports';

export class GAAScraper extends BaseScraper {
  name = 'GAA';
  private baseUrl = 'https://www.gaa.ie/fixtures-results';

  isActive(): boolean {
    const now = new Date();
    // GAA is active from January to September
    // League: Jan-Jun, Championship: Jun-Sep
    return now.getMonth() >= 0 && now.getMonth() <= 8;
  }

  async scrapeFixtures(): Promise<ScraperResult> {
    let browser;
    try {
      console.log(`Starting ${this.name} fixtures scraping...`);
      
      browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      
      const page = await browser.newPage();
      await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
      
      console.log('Navigating to GAA website...');
      await page.goto(this.baseUrl, { waitUntil: 'networkidle0', timeout: 60000 });
      
      const today = new Date();
      const currentMonth = today.getMonth();
      const nextSaturday = new Date(today);
      // Get the date of the upcoming Saturday
      nextSaturday.setDate(today.getDate() + ((6 - today.getDay() + 7) % 7));
      const nextSaturdayMonth = nextSaturday.getMonth();

      if (nextSaturdayMonth !== currentMonth) {
        // If next weekend is in a new month, click the month filter
        console.log("Following weekend is in a new month, attempting to click month filter.");
        try {
          const nextMonthName = nextSaturday.toLocaleString('en-US', { month: 'long' });
          console.log(`Looking for month filter: ${nextMonthName}`);

          const monthClicked = await page.evaluate((monthName) => {
            const monthElements = Array.from(document.querySelectorAll('.gar-month-list__item'));
            // Find month element by text content, case-insensitive
            const targetElement = monthElements.find(el => el.textContent?.trim().toLowerCase() === monthName.toLowerCase());
            if (targetElement) {
              (targetElement as HTMLElement).click();
              return true;
            }
            return false;
          }, nextMonthName);

          if (monthClicked) {
            console.log(`Successfully clicked on ${nextMonthName} filter.`);
            await page.waitForNetworkIdle({ timeout: 5000 });
          } else {
            console.log(`Could not find filter for month: ${nextMonthName}. Continuing scrape.`);
          }
        } catch (error) {
          console.log(`Error clicking month filter: ${error}`);
        }
      } else {
        // Otherwise, fall back to clicking "More results"
        console.log('Following weekend is in current month, looking for "More results" button...');
        try {
          await page.waitForSelector('.gar-matches-list__btn.btn-secondary.-next', { timeout: 5000 });
          console.log('Found "More results" button, clicking...');
          await page.click('.gar-matches-list__btn.btn-secondary.-next');
          
          await page.waitForNetworkIdle({ timeout: 5000 });
        } catch (error) {
          console.log('No "More results" button found or error clicking it, continuing scrape.');
        }
      }
      
      console.log('Extracting GAA fixtures from DOM...');
      
      const fixturesByDay = await page.evaluate(() => {
        function mapChannelName(raw: any): string {
          const map: any = {
            'rtebbc': 'RTE / BBC Sport',
            'rte': 'RTE',
            'bbc': 'BBC Sport',
            'tg4': 'TG4',
            'sky sports': 'Sky Sports',
            'gaa go': 'GAAGO',
            'gaa go/gaago': 'GAAGO',
            'gaa plus': 'GAA Plus',
            // Add more mappings as needed
          };
          const key = (raw as string).trim().toLowerCase();
          return map[key] || (raw as string).replace(/\b\w/g, (c: any) => (c as string).toUpperCase());
        }
        function parseTimeToMinutes(time: any): number {
          if (!time) return 0;
          const [h, m] = (time as string).split(':').map(Number);
          return h * 60 + m;
        }

        const matchesByDate = new Map();
        let currentSport = 'GAA Football'; // Default

        // Select all group headers and match items from the list in document order.
        // This is more robust than iterating through children.
        const allNodes = document.querySelectorAll('.gar-matches-list h3.gar-matches-list__group-name, .gar-matches-list .gar-match-item');

        allNodes.forEach(el => {
          if (el.matches('h3.gar-matches-list__group-name')) {
            const groupText = el.textContent?.toLowerCase() || '';
            if (groupText.includes('hurling')) {
              currentSport = 'GAA Hurling';
            } else if (groupText.includes('football')) {
              currentSport = 'GAA Football';
            }
          } else if (el.matches('.gar-match-item')) {
            const homeTeam = el.querySelector('.gar-match-item__team.-home .gar-match-item__team-name');
            const awayTeam = el.querySelector('.gar-match-item__team.-away .gar-match-item__team-name');
            if (homeTeam && awayTeam) {
              const team1 = homeTeam.textContent ? homeTeam.textContent.trim() : '';
              const team2 = awayTeam.textContent ? awayTeam.textContent.trim() : '';
              const timeElement = el.querySelector('.gar-match-item__upcoming');
              const time = timeElement && timeElement.textContent ? timeElement.textContent.trim() : '';
              const venueElement = el.querySelector('.gar-match-item__venue');
              let venue = '';
              if (venueElement && venueElement.textContent) {
                venue = venueElement.textContent.replace('Venue: ', '').trim();
              }
              let channel = 'No TV Coverage';
              const tvProvider = el.querySelector('.gar-match-item__tv-provider img') as HTMLImageElement | null;
              if (tvProvider && tvProvider.alt && tvProvider.alt.includes('Broadcasting on')) {
                const match = tvProvider.alt.match(/Broadcasting on (.+)/);
                if (match) {
                  channel = mapChannelName(match[1].trim());
                }
              }
              if (team1 && team2 && time) {
                const matchDate = el.getAttribute('data-match-date');
                if (matchDate) {
                  const date = new Date(matchDate);
                  const dayName = date.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
                  const dateStr = date.toLocaleDateString('en-US', { day: 'numeric', month: 'long' }).toUpperCase();
                  if (!matchesByDate.has(dateStr)) {
                    matchesByDate.set(dateStr, {
                      day: dayName.charAt(0).toUpperCase() + dayName.slice(1),
                      date: dateStr,
                      fixtures: []
                    });
                  }
                  matchesByDate.get(dateStr).fixtures.push({
                    id: `${dayName.charAt(0).toUpperCase() + dayName.slice(1)}-${team1}-${team2}-${time.replace(':','')}`,
                    time,
                    sport: currentSport,
                    match: `${team1} v ${team2}`,
                    channel,
                    date: `${dateStr} 2025`,
                    venue,
                    competition: currentSport
                  });
                }
              }
            }
          }
        });
        
        // Convert to array and sort fixtures by time
        const days = Array.from(matchesByDate.values());
        days.forEach(day => {
          day.fixtures.sort((a: any, b: any) => parseTimeToMinutes(a.time) - parseTimeToMinutes(b.time));
        });
        return days;
      });
      
      return this.createScraperResult(this.name, fixturesByDay, true);
      
    } catch (error) {
      console.error(`Error scraping ${this.name} fixtures:`, error);
      return this.createScraperResult(
        this.name, 
        [], 
        false, 
        error instanceof Error ? error.message : 'Unknown error'
      );
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }
}
