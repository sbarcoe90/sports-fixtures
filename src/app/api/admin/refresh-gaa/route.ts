import { NextResponse } from 'next/server';
import puppeteer from 'puppeteer';
import fs from 'fs/promises';
import path from 'path';

// This is the original scraping logic, now dedicated to refreshing the local data file.
async function refreshGaaFixtures() {
  let browser;
  try {
    console.log(`Starting GAA fixtures refresh...`);
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
    await page.goto('https://www.gaa.ie/fixtures-results', { waitUntil: 'networkidle0', timeout: 60000 });

    const today = new Date();
    const nextSaturday = new Date(today);
    nextSaturday.setDate(today.getDate() + ((6 - today.getDay() + 7) % 7));
    if (nextSaturday.getMonth() !== today.getMonth()) {
      const nextMonthName = nextSaturday.toLocaleString('en-US', { month: 'long' });
      await page.evaluate((monthName) => {
        const monthElements = Array.from(document.querySelectorAll('.gar-month-list__item'));
        const targetElement = monthElements.find(el => el.textContent?.trim().toLowerCase() === monthName.toLowerCase());
        if (targetElement) (targetElement as HTMLElement).click();
      }, nextMonthName);
      await page.waitForNetworkIdle({ timeout: 5000 });
    } else {
      try {
        await page.waitForSelector('.gar-matches-list__btn.btn-secondary.-next', { timeout: 5000 });
        await page.click('.gar-matches-list__btn.btn-secondary.-next');
        await page.waitForNetworkIdle({ timeout: 5000 });
      } catch (e) {
        console.log('No "More results" button found, continuing.');
      }
    }

    const fixturesData = await page.evaluate(() => {
      // NOTE: This function runs in the browser context.
      const allNodes = document.querySelectorAll('.gar-matches-list h3.gar-matches-list__group-name, .gar-matches-list .gar-match-item');
      const fixtures: any[] = [];
      let currentCompetition = 'GAA';

      const mapChannelName = (raw: any): string => {
        const map: any = { 'rtebbc': 'RTE / BBC Sport', 'rte': 'RTE', 'bbc': 'BBC Sport', 'tg4': 'TG4', 'sky sports': 'Sky Sports', 'gaa go': 'GAAGO' };
        const key = (raw as string).trim().toLowerCase();
        return map[key] || (raw as string).replace(/\b\w/g, (c: any) => (c as string).toUpperCase());
      };
      
      allNodes.forEach(el => {
        if (el.matches('h3.gar-matches-list__group-name')) {
          currentCompetition = el.textContent?.trim() || 'GAA';
        } else if (el.matches('.gar-match-item')) {
          const homeTeam = el.querySelector('.gar-match-item__team.-home .gar-match-item__team-name')?.textContent?.trim();
          const awayTeam = el.querySelector('.gar-match-item__team.-away .gar-match-item__team-name')?.textContent?.trim();
          const time = el.querySelector('.gar-match-item__upcoming')?.textContent?.trim();
          const venue = el.querySelector('.gar-match-item__venue')?.textContent?.replace('Venue:', '').trim();
          const matchDate = el.getAttribute('data-match-date');
          
          let channel = 'No TV Coverage';
          const tvProviderImg = el.querySelector('.gar-match-item__tv-provider img') as HTMLImageElement;
          if (tvProviderImg && tvProviderImg.alt.includes('Broadcasting on')) {
            const rawChannel = tvProviderImg.alt.match(/Broadcasting on (.+)/)?.[1];
            if (rawChannel) channel = mapChannelName(rawChannel);
          }

          if (homeTeam && awayTeam && time && matchDate) {
            fixtures.push({
              date: matchDate,
              time: time,
              sport: currentCompetition.includes('Hurling') ? 'GAA Hurling' : 'GAA Football',
              match: `${homeTeam} v ${awayTeam}`,
              venue: venue,
              competition: currentCompetition,
              tv_channel: channel,
            });
          }
        }
      });
      return fixtures;
    });

    return fixturesData;

  } catch (error) {
    console.error(`Error refreshing GAA fixtures:`, error);
    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

export async function POST() {
  try {
    const fixtures = await refreshGaaFixtures();
    
    // Format the data for the file
    const fileContent = `export const gaaFixtures = ${JSON.stringify(fixtures, null, 2)};\n`;
    
    // Write to the data file
    const filePath = path.join(process.cwd(), 'src', 'data', 'gaaFixtures.ts');
    await fs.writeFile(filePath, fileContent, 'utf-8');
    
    return NextResponse.json({
      success: true,
      message: `Successfully refreshed and saved ${fixtures.length} GAA fixtures.`,
      fixtureCount: fixtures.length,
    });

  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to refresh GAA fixtures', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 