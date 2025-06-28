import puppeteer from 'puppeteer';

export interface GAAFixture {
  id: string;
  time: string;
  sport: string;
  match: string;
  channel: string;
  date: string;
  venue?: string;
  referee?: string;
  competition?: string;
}

export interface GAADayFixtures {
  day: string;
  date: string;
  fixtures: GAAFixture[];
}

export class GAAScraper {
  private baseUrl = 'https://www.gaa.ie/fixtures-results';

  async scrapeFixtures(): Promise<GAADayFixtures[]> {
    let browser;
    try {
      console.log('Starting GAA fixtures scraping with Puppeteer...');
      
      browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      
      const page = await browser.newPage();
      
      // Set user agent to avoid detection
      await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
      
      console.log('Navigating to GAA website...');
      await page.goto(this.baseUrl, { waitUntil: 'networkidle2', timeout: 30000 });
      
      console.log('Page loaded, extracting content and broadcasting info...');
      
      // Extract both text content and broadcasting information
      const pageData = await page.evaluate(() => {
        const textContent = document.body.innerText;
        
        // Extract broadcasting information from image alt attributes
        const broadcastingInfo: string[] = [];
        const images = document.querySelectorAll('img[alt*="Broadcasting"]');
        
        images.forEach((img) => {
          const alt = img.getAttribute('alt') || '';
          if (alt.includes('Broadcasting on')) {
            // Extract the broadcaster name from alt text
            const match = alt.match(/Broadcasting on (.+)/);
            if (match) {
              const broadcaster = match[1].trim();
              broadcastingInfo.push(broadcaster);
            }
          }
        });
        
        return { textContent, broadcastingInfo };
      });
      
      console.log('Content and broadcasting info extracted, parsing fixtures...');
      
      return this.parsePageContent(pageData.textContent, pageData.broadcastingInfo);
      
    } catch (error) {
      console.error('Error scraping GAA fixtures:', error);
      throw new Error(`Failed to scrape GAA fixtures: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }

  private parsePageContent(content: string, broadcastingInfo: string[] = []): GAADayFixtures[] {
    const fixtures: GAADayFixtures[] = [];
    const lines = content.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
    let currentDay = '';
    let currentDate = '';
    let currentFixtures: GAAFixture[] = [];
    let fixtureIndex = 0; // Track fixture index for broadcasting assignment
    let i = 0;
    while (i < lines.length) {
      const line = lines[i];
      // Detect day header (e.g., "SATURDAY 28 JUNE")
      if (/^(SATURDAY|SUNDAY) \d{2} \w+$/i.test(line)) {
        // Save previous day's fixtures
        if (currentDay && currentFixtures.length > 0) {
          fixtures.push({ day: currentDay, date: currentDate, fixtures: currentFixtures });
        }
        // Start new day
        const [day, dayNum, month] = line.split(' ');
        currentDay = day.charAt(0) + day.slice(1).toLowerCase();
        currentDate = `${dayNum} ${month}`;
        currentFixtures = [];
        i++;
        continue;
      }
      // Parse fixture blocks (look for a team, then time, venue, referee, then another team)
      if (this.isTeamName(lines[i])) {
        const team1 = lines[i];
        let time = '';
        let venue = '';
        let referee = '';
        let team2 = '';
        let j = i + 1;
        // Look ahead for time, venue, referee, team2
        while (j < lines.length && !/^(SATURDAY|SUNDAY) \d{2} \w+$/i.test(lines[j]) && !this.isTeamName(lines[j])) {
          if (/^\d{1,2}:\d{2}$/.test(lines[j])) time = lines[j];
          if (lines[j].startsWith('Venue:')) venue = lines[j].replace('Venue:', '').trim();
          if (lines[j].startsWith('Referee:')) referee = lines[j].replace('Referee:', '').trim();
          j++;
        }
        // The next team name after the block is team2
        if (j < lines.length && this.isTeamName(lines[j])) {
          team2 = lines[j];
          j++;
        }
        // Only add if both teams and time are found
        if (team1 && team2 && time) {
          // Assign broadcasting info based on fixture index
          let channel = 'GAA.ie'; // Default
          if (broadcastingInfo[fixtureIndex]) {
            channel = broadcastingInfo[fixtureIndex];
          }
          
          const id = `${currentDay}-${team1}-${team2}-${time.replace(':','')}`;
          currentFixtures.push({
            id,
            time,
            sport: 'GAA Football', // Could be improved with context
            match: `${team1} v ${team2}`,
            channel,
            date: `${currentDate} 2025`,
            venue,
            referee
          });
          
          fixtureIndex++; // Increment for next fixture
        }
        i = j;
        continue;
      }
      i++;
    }
    // Push last day's fixtures
    if (currentDay && currentFixtures.length > 0) {
      fixtures.push({ day: currentDay, date: currentDate, fixtures: currentFixtures });
    }
    return fixtures;
  }

  private isTeamName(text: string): boolean {
    // Heuristic: team names are single words, not time, not venue/ref, not empty
    return /^[A-Za-z ]{3,}$/.test(text) && !text.startsWith('Venue:') && !text.startsWith('Referee:') && !/^\d{1,2}:\d{2}$/.test(text) && !/^(SATURDAY|SUNDAY) \d{2} \w+$/i.test(text);
  }

  // TODO: Implement actual web scraping once we resolve the dependency issues
  // This method will use axios and cheerio to parse the actual GAA website
  async scrapeActualFixtures(): Promise<GAADayFixtures[]> {
    // This will be implemented later when we have the scraping working
    throw new Error('Actual scraping not yet implemented');
  }
} 