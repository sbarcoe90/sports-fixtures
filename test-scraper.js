const puppeteer = require('puppeteer');

async function testScraper() {
  let browser;
  try {
    console.log('Testing GAA scraper with Puppeteer...');
    
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    // Set user agent to avoid detection
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
    
    console.log('Navigating to GAA website...');
    await page.goto('https://www.gaa.ie/fixtures-results', { waitUntil: 'networkidle2', timeout: 30000 });
    
    console.log('Page loaded, extracting content...');
    
    // Extract the page content
    const pageContent = await page.evaluate(() => {
      return document.body.innerText;
    });
    
    console.log('Content extracted successfully!');
    
    // Look for Saturday and Sunday
    const lines = pageContent.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    console.log(`\nTotal lines: ${lines.length}`);
    
    // Find lines containing Saturday or Sunday
    const dayLines = lines.filter(line => line.includes('SATURDAY') || line.includes('SUNDAY'));
    console.log('\nLines containing SATURDAY or SUNDAY:');
    dayLines.forEach(line => console.log(`  "${line}"`));
    
    // Look for fixture patterns
    console.log('\nLooking for fixture patterns...');
    const fixtureLines = lines.filter(line => /^\w+\s+\d+-\d+\s+\w+$/.test(line));
    console.log('Lines matching fixture pattern (Team1 Score1-Score2 Team2):');
    fixtureLines.forEach(line => console.log(`  "${line}"`));
    
    // Show more context around the day lines
    console.log('\nContext around day lines:');
    dayLines.forEach(dayLine => {
      const dayIndex = lines.indexOf(dayLine);
      console.log(`\n${dayLine}:`);
      for (let i = Math.max(0, dayIndex - 2); i < Math.min(lines.length, dayIndex + 10); i++) {
        const prefix = i === dayIndex ? '>>> ' : '    ';
        console.log(`${prefix}${lines[i]}`);
      }
    });
    
  } catch (error) {
    console.error('Error testing scraper:', error.message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

testScraper(); 