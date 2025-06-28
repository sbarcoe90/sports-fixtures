import { NextResponse } from 'next/server';
import { SCRAPERS } from '@/scrapers/registry';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { sportId } = body;

    if (!SCRAPERS[sportId as keyof typeof SCRAPERS]) {
      return NextResponse.json(
        {
          success: false,
          error: 'Scraper not found'
        },
        { status: 404 }
      );
    }

    const scraper = SCRAPERS[sportId as keyof typeof SCRAPERS];
    
    console.log(`Testing ${sportId} scraper...`);
    const result = await scraper.scrapeFixtures();
    
    const fixtureCount = result.fixtures.reduce((sum, day) => sum + day.fixtures.length, 0);
    
    return NextResponse.json({
      success: result.success,
      fixtureCount,
      error: result.error,
      sport: sportId,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Test Scraper API Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to test scraper',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 