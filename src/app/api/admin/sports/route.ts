import { NextResponse } from 'next/server';
import { SPORTS_REGISTRY, enableSport, disableSport } from '@/scrapers/registry';

export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      sports: SPORTS_REGISTRY
    });
  } catch (error) {
    console.error('Admin API Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch sports configuration'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, sportId } = body;

    if (action === 'toggle') {
      if (!SPORTS_REGISTRY[sportId]) {
        return NextResponse.json(
          {
            success: false,
            error: 'Sport not found'
          },
          { status: 404 }
        );
      }

      const currentState = SPORTS_REGISTRY[sportId].isEnabled;
      
      if (currentState) {
        disableSport(sportId);
      } else {
        enableSport(sportId);
      }

      return NextResponse.json({
        success: true,
        sport: SPORTS_REGISTRY[sportId],
        message: `${SPORTS_REGISTRY[sportId].name} ${currentState ? 'disabled' : 'enabled'}`
      });
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Invalid action'
      },
      { status: 400 }
    );
  } catch (error) {
    console.error('Admin API Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update sports configuration'
      },
      { status: 500 }
    );
  }
} 