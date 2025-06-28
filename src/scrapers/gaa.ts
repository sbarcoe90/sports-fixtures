import puppeteer from 'puppeteer';
import { BaseScraper } from './base';
import { ScraperResult } from '../types/sports';

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
      await page.goto(this.baseUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
      
      console.log('Extracting GAA fixtures from DOM...');
      
      const fixturesByDay = await page.evaluate(() => {
        function parseTimeToMinutes(time: string): number {
          if (!time) return 0;
          const [h, m] = time.split(':').map(Number);
          return h * 60 + m;
        }

        // Find all gar-match-item elements on the page
        const allMatchItems = document.querySelectorAll('.gar-match-item');
        console.log(`Found ${allMatchItems.length} total gar-match-item elements`);
        
        // Group matches by date using the data-match-date attribute
        const matchesByDate = new Map();
        
        allMatchItems.forEach(matchItem => {
          // Extract team names
          const homeTeam = matchItem.querySelector('.gar-match-item__team.-home .gar-match-item__team-name');
          const awayTeam = matchItem.querySelector('.gar-match-item__team.-away .gar-match-item__team-name');
          
          if (homeTeam && awayTeam) {
            const team1 = homeTeam.textContent ? homeTeam.textContent.trim() : '';
            const team2 = awayTeam.textContent ? awayTeam.textContent.trim() : '';
            
            // Extract time
            const timeElement = matchItem.querySelector('.gar-match-item__upcoming');
            const time = timeElement && timeElement.textContent ? timeElement.textContent.trim() : '';
            
            // Extract venue
            const venueElement = matchItem.querySelector('.gar-match-item__venue');
            let venue = '';
            if (venueElement && venueElement.textContent) {
              venue = venueElement.textContent.replace('Venue: ', '').trim();
            }
            
            // Extract broadcasting info
            let channel = 'No TV Coverage';
            const tvProvider = matchItem.querySelector('.gar-match-item__tv-provider img') as HTMLImageElement | null;
            if (tvProvider && tvProvider.alt && tvProvider.alt.includes('Broadcasting on')) {
              const match = tvProvider.alt.match(/Broadcasting on (.+)/);
              if (match) {
                channel = match[1].trim();
              }
            }
            
            if (team1 && team2 && time) {
              // Get the date from data-match-date attribute
              const matchDate = matchItem.getAttribute('data-match-date');
              
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
                  sport: 'GAA Football',
                  match: `${team1} v ${team2}`,
                  channel,
                  date: `${dateStr} 2025`,
                  venue,
                  competition: 'GAA Football'
                });
              }
            }
          }
        });
        
        // Convert to array and sort fixtures by time
        const days = Array.from(matchesByDate.values());
        days.forEach(day => {
          day.fixtures.sort((a, b) => parseTimeToMinutes(a.time) - parseTimeToMinutes(b.time));
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
