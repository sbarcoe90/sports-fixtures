'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { SportConfig } from '@/types/sports';

interface AdminState {
  sports: Record<string, SportConfig>;
  scraperStatus: {
    [sportId: string]: {
      lastRun: string;
      success: boolean;
      fixtureCount: number;
      error?: string;
    };
  };
  isRefreshing: boolean;
}

interface SportResult {
  sport: string;
  success: boolean;
  fixtureCount: number;
}

export default function AdminPage() {
  const [state, setState] = useState<AdminState>({
    sports: {},
    scraperStatus: {},
    isRefreshing: false
  });

  // Load initial sports configuration
  useEffect(() => {
    loadSportsConfig();
  }, []);

  const loadSportsConfig = async () => {
    try {
      const response = await fetch('/api/admin/sports');
      if (response.ok) {
        const data = await response.json();
        setState(prev => ({
          ...prev,
          sports: data.sports
        }));
      }
    } catch (error) {
      console.error('Failed to load sports config:', error);
    }
  };

  const toggleSport = async (sportId: string) => {
    try {
      const response = await fetch('/api/admin/sports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'toggle',
          sportId
        })
      });

      if (response.ok) {
        await loadSportsConfig();
      }
    } catch (error) {
      console.error('Failed to toggle sport:', error);
    }
  };

  const testScraper = async (sportId: string) => {
    setState(prev => ({
      ...prev,
      isRefreshing: true
    }));

    try {
      const response = await fetch('/api/admin/test-scraper', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sportId })
      });

      if (response.ok) {
        const result = await response.json();
        setState(prev => ({
          ...prev,
          scraperStatus: {
            ...prev.scraperStatus,
            [sportId]: {
              lastRun: new Date().toISOString(),
              success: result.success,
              fixtureCount: result.fixtureCount || 0,
              error: result.error
            }
          }
        }));
      }
    } catch (error) {
      console.error('Failed to test scraper:', error);
      setState(prev => ({
        ...prev,
        scraperStatus: {
          ...prev.scraperStatus,
          [sportId]: {
            lastRun: new Date().toISOString(),
            success: false,
            fixtureCount: 0,
            error: 'Network error'
          }
        }
      }));
    } finally {
      setState(prev => ({
        ...prev,
        isRefreshing: false
      }));
    }
  };

  const refreshGaaFixtures = async () => {
    setState(prev => ({ ...prev, isRefreshing: true }));
    try {
      const response = await fetch('/api/admin/refresh-gaa', {
        method: 'POST'
      });
      const result = await response.json();
      if (response.ok) {
        alert(`Success: ${result.message}`);
        // Optionally, refresh the main fixture list or update status
        testAllScrapers();
      } else {
        throw new Error(result.message || 'Failed to refresh GAA fixtures.');
      }
    } catch (error) {
      console.error('Failed to refresh GAA fixtures:', error);
      alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setState(prev => ({ ...prev, isRefreshing: false }));
    }
  };

  const testAllScrapers = async () => {
    setState(prev => ({
      ...prev,
      isRefreshing: true
    }));

    try {
      const response = await fetch('/api/fixtures');
      if (response.ok) {
        const result = await response.json();
        
        const newStatus: AdminState['scraperStatus'] = {};
        result.sports.forEach((sport: SportResult) => {
          newStatus[sport.sport.toLowerCase()] = {
            lastRun: new Date().toISOString(),
            success: sport.success,
            fixtureCount: sport.fixtureCount,
            error: sport.success ? undefined : 'Scraper failed'
          };
        });

        setState(prev => ({
          ...prev,
          scraperStatus: newStatus
        }));
      }
    } catch (error) {
      console.error('Failed to test all scrapers:', error);
    } finally {
      setState(prev => ({
        ...prev,
        isRefreshing: false
      }));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-blue-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            Sports Fixtures Admin
          </h1>
          <p className="text-lg text-gray-600">
            Manage sports scrapers and monitor their status
          </p>
        </header>

        {/* Admin Controls */}
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Sports Management */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">
              Sports Management
            </h2>
            
            <div className="space-y-4">
              {Object.entries(state.sports).map(([sportId, config]) => (
                <div key={sportId} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-gray-800">
                      {config.name}
                    </h3>
                    <p className="text-sm text-gray-600">
                      Season: {config.seasonStart ? new Date(config.seasonStart).toLocaleDateString() : 'TBD'} - {config.seasonEnd ? new Date(config.seasonEnd).toLocaleDateString() : 'TBD'}
                    </p>
                    <p className="text-sm text-gray-600">
                      Priority: {config.priority}
                    </p>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    {sportId === 'gaa' && (
                      <button
                        onClick={refreshGaaFixtures}
                        disabled={state.isRefreshing}
                        className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Refresh Data
                      </button>
                    )}
                    <button
                      onClick={() => testScraper(sportId)}
                      disabled={state.isRefreshing}
                      className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Test
                    </button>
                    
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={config.isEnabled}
                        onChange={() => toggleSport(sportId)}
                        className="sr-only"
                      />
                      <div className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        config.isEnabled ? 'bg-green-500' : 'bg-gray-300'
                      }`}>
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          config.isEnabled ? 'translate-x-6' : 'translate-x-1'
                        }`} />
                      </div>
                      <span className="ml-3 text-sm font-medium text-gray-700">
                        {config.isEnabled ? 'Enabled' : 'Disabled'}
                      </span>
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Test All Scrapers */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">
              Test All Scrapers
            </h2>
            
            <button
              onClick={testAllScrapers}
              disabled={state.isRefreshing}
              className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {state.isRefreshing ? 'Testing...' : 'Test All Scrapers'}
            </button>
          </div>

          {/* Scraper Status */}
          {Object.keys(state.scraperStatus).length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-semibold text-gray-800 mb-6">
                Scraper Status
              </h2>
              
              <div className="space-y-4">
                {Object.entries(state.scraperStatus).map(([sportId, status]) => (
                  <div key={sportId} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="flex-1">
                      <h3 className="text-lg font-medium text-gray-800 capitalize">
                        {sportId}
                      </h3>
                      <p className="text-sm text-gray-600">
                        Last run: {status.lastRun ? new Date(status.lastRun as string).toLocaleString() : 'Never'}
                      </p>
                      {status.error && (
                        <p className="text-sm text-red-600">
                          Error: {status.error}
                        </p>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                        status.success 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {status.success ? 'Success' : 'Failed'}
                      </div>
                      
                      <div className="text-sm text-gray-600">
                        {status.fixtureCount} fixtures
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="text-center mt-12">
          <Link
            href="/"
            className="text-blue-600 hover:text-blue-800 underline"
          >
            ← Back to Fixtures
          </Link>
        </div>
      </div>
    </div>
  );
} 