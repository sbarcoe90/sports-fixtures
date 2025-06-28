import { NextResponse } from 'next/server';
import { FixtureScraperCoordinator } from '@/scrapers/coordinator';

export async function GET() {
  try {
    const coordinator = new FixtureScraperCoordinator();
    const results = await coordinator.scrapeAllFixtures();
    
    // Combine all fixtures from all sports
    const allFixtures = results
      .filter(result => result.success)
      .flatMap(result => result.fixtures);
    
    return NextResponse.json({
      success: true,
      data: allFixtures,
      sports: results.map(r => ({
        sport: r.sport,
        success: r.success,
        fixtureCount: r.fixtures.reduce((sum, day) => sum + day.fixtures.length, 0)
      })),
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
