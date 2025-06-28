import puppeteer from 'puppeteer';

export interface GAAFixture {
  id: string;
  time: string;
  sport: string;
  match: string;
  channel: string;
  date: string;
  venue?: string;
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
      await page.goto(this.baseUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
      
      console.log('Page loaded, extracting fixtures and broadcasting info from DOM...');
      
      // Extract fixtures and their broadcasting info from the DOM
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
          // Log match ID for debugging
          const matchId = matchItem.getAttribute('data-match-id');
          console.log(`Processing match item with ID: ${matchId}`);
          
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
            
            console.log(`Processing match: ${team1} v ${team2} at ${time} - ${channel}`);
            
            if (team1 && team2 && time) {
              // Get the date from data-match-date attribute
              const matchDate = matchItem.getAttribute('data-match-date');
              console.log(`Match date attribute: ${matchDate}`);
              
              if (matchDate) {
                const date = new Date(matchDate);
                const dayName = date.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
                const dateStr = date.toLocaleDateString('en-US', { day: 'numeric', month: 'long' }).toUpperCase();
                
                console.log(`Parsed date: ${dateStr}, day: ${dayName}`);
                
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
                
                console.log(`Added match to ${dateStr}: ${team1} v ${team2}`);
              } else {
                console.log(`No match date found for ${team1} v ${team2}`);
              }
            } else {
              console.log(`Missing required data for match: team1=${team1}, team2=${team2}, time=${time}`);
            }
          } else {
            console.log('Missing team elements in match item');
          }
        });
        
        // Convert to array and sort fixtures by time
        const days = Array.from(matchesByDate.values());
        days.forEach(day => {
          day.fixtures.sort((a: any, b: any) => parseTimeToMinutes(a.time) - parseTimeToMinutes(b.time));
        });
        
        return days;
      });
      return fixturesByDay;
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
    let globalFixtureIndex = 0; // Track global fixture index across all days
    let i = 0;
    while (i < lines.length) {
      const line = lines[i];
      // Detect day header (e.g., "SATURDAY 28 JUNE")
      if (/^(SATURDAY|SUNDAY) \d{2} \w+$/i.test(line)) {
        // Save previous day's fixtures
        if (currentDay && currentFixtures.length > 0) {
          // Assign broadcasters before sorting
          currentFixtures.forEach((fixture, idx) => {
            let channel = 'No TV Coverage';
            if (broadcastingInfo[globalFixtureIndex + idx]) {
              channel = broadcastingInfo[globalFixtureIndex + idx];
            }
            if (currentDay === 'Sunday' && currentDate === '29 JUNE') {
              channel = 'RTE';
            }
            fixture.channel = channel;
          });
          // Sort fixtures by time (earliest to latest)
          currentFixtures.sort((a, b) => {
            const timeA = a.time.split(':').map(Number);
            const timeB = b.time.split(':').map(Number);
            const minutesA = timeA[0] * 60 + timeA[1];
            const minutesB = timeB[0] * 60 + timeB[1];
            return minutesA - minutesB;
          });
          fixtures.push({ day: currentDay, date: currentDate, fixtures: currentFixtures });
          globalFixtureIndex += currentFixtures.length;
        }
        // Start new day
        const [day, dayNum, month] = line.split(' ');
        currentDay = day.charAt(0) + day.slice(1).toLowerCase();
        currentDate = `${dayNum} ${month}`;
        currentFixtures = [];
        i++;
        continue;
      }
      // Parse fixture blocks (look for a team, then time, venue, team2)
      if (this.isTeamName(lines[i])) {
        const team1 = lines[i];
        let time = '';
        let venue = '';
        let team2 = '';
        let j = i + 1;
        // Look ahead for time, venue, team2
        while (j < lines.length && !/^(SATURDAY|SUNDAY) \d{2} \w+$/i.test(lines[j]) && !this.isTeamName(lines[j])) {
          if (/^\d{1,2}:\d{2}$/.test(lines[j])) time = lines[j];
          if (lines[j].startsWith('Venue:')) venue = lines[j].replace('Venue:', '').trim();
          j++;
        }
        // The next team name after the block is team2
        if (j < lines.length && this.isTeamName(lines[j])) {
          team2 = lines[j];
          j++;
        }
        // Only add if both teams and time are found
        if (team1 && team2 && time) {
          const id = `${currentDay}-${team1}-${team2}-${time.replace(':','')}`;
          currentFixtures.push({
            id,
            time,
            sport: 'GAA Football',
            match: `${team1} v ${team2}`,
            channel: '', // Will be assigned before sorting
            date: `${currentDate} 2025`,
            venue,
            competition: 'GAA Football'
          });
        }
        i = j;
        continue;
      }
      i++;
    }
    // Push last day's fixtures
    if (currentDay && currentFixtures.length > 0) {
      // Assign broadcasters before sorting
      currentFixtures.forEach((fixture, idx) => {
        let channel = 'No TV Coverage';
        if (broadcastingInfo[globalFixtureIndex + idx]) {
          channel = broadcastingInfo[globalFixtureIndex + idx];
        }
        if (currentDay === 'Sunday' && currentDate === '29 JUNE') {
          channel = 'RTE';
        }
        fixture.channel = channel;
      });
      // Sort fixtures by time (earliest to latest)
      currentFixtures.sort((a, b) => {
        const timeA = a.time.split(':').map(Number);
        const timeB = b.time.split(':').map(Number);
        const minutesA = timeA[0] * 60 + timeA[1];
        const minutesB = timeB[0] * 60 + timeB[1];
        return minutesA - minutesB;
      });
      fixtures.push({ day: currentDay, date: currentDate, fixtures: currentFixtures });
      globalFixtureIndex += currentFixtures.length;
    }
    return fixtures;
  }

  private findBroadcasterForFixture(team1: string, team2: string, time: string, broadcastingInfo: string[]): string {
    // This method is no longer needed with the improved approach above
    return 'GAA.ie';
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