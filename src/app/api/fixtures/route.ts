import { NextRequest, NextResponse } from 'next/server';
import { GAAScraper } from '@/utils/gaaScraper';

export async function GET(request: NextRequest) {
  try {
    const scraper = new GAAScraper();
    const fixtures = await scraper.scrapeFixtures();
    
    return NextResponse.json({
      success: true,
      data: fixtures,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('API Error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch fixtures',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 