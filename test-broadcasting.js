const puppeteer = require('puppeteer');

async function testBroadcasting() {
  let browser;
  try {
    console.log('Testing broadcasting info extraction...');
    
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    // Set user agent to avoid detection
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
    
    console.log('Navigating to GAA website...');
    await page.goto('https://www.gaa.ie/fixtures-results', { waitUntil: 'networkidle2', timeout: 30000 });
    
    console.log('Page loaded, extracting broadcasting info...');
    
    // Extract broadcasting information
    const broadcastingData = await page.evaluate(() => {
      const broadcastingInfo = [];
      const images = document.querySelectorAll('img[alt*="Broadcasting"]');
      
      console.log(`Found ${images.length} broadcasting images`);
      
      images.forEach((img, index) => {
        const alt = img.getAttribute('alt') || '';
        console.log(`Image ${index + 1} alt: "${alt}"`);
        
        if (alt.includes('Broadcasting on')) {
          const match = alt.match(/Broadcasting on (.+)/);
          if (match) {
            const broadcaster = match[1].trim();
            
            // Find the fixture context
            const container = img.closest('div, section, article, li');
            if (container) {
              const containerText = container.textContent || '';
              const lines = containerText.split('\n').map(line => line.trim()).filter(line => line.length > 0);
              
              // Look for team names in the container
              const teamNames = lines.filter(line => 
                /^[A-Za-z ]{3,}$/.test(line) && 
                !line.startsWith('Venue:') && 
                !line.startsWith('Referee:') && 
                !/^\d{1,2}:\d{2}$/.test(line) &&
                !/^(SATURDAY|SUNDAY) \d{2} \w+$/i.test(line)
              );
              
              broadcastingInfo.push({
                broadcaster,
                teamNames,
                containerText: containerText.substring(0, 200) + '...'
              });
            }
          }
        }
      });
      
      return broadcastingInfo;
    });
    
    console.log('\nBroadcasting information found:');
    broadcastingData.forEach((info, index) => {
      console.log(`\n${index + 1}. Broadcaster: ${info.broadcaster}`);
      console.log(`   Team names: ${info.teamNames.join(', ')}`);
      console.log(`   Context: ${info.containerText}`);
    });
    
  } catch (error) {
    console.error('Error testing broadcasting extraction:', error.message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

testBroadcasting(); 