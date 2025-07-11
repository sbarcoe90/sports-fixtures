import { SportConfig } from '../types/sports';
import { GAAScraper } from './gaa';
import { SoccerScraper } from './soccer';
import { F1Scraper } from './f1';

// Registry of all available sports
export const SPORTS_REGISTRY: Record<string, SportConfig> = {
  gaa: {
    id: 'gaa',
    name: 'GAA',
    isEnabled: true,
    priority: 1,
    seasonStart: '2025-01-01',
    seasonEnd: '2025-09-30'
  },
  soccer: {
    id: 'soccer',
    name: 'Soccer',
    isEnabled: false, // Disabled until implemented
    priority: 2,
    seasonStart: '2025-08-01',
    seasonEnd: '2025-05-31'
  },
  f1: {
    id: 'f1',
    name: 'F1',
    isEnabled: true,
    priority: 3,
    seasonStart: '2025-02-01',
    seasonEnd: '2025-12-31'
  }
};

// Scraper instances
export const SCRAPERS = {
  gaa: new GAAScraper(),
  soccer: new SoccerScraper(),
  f1: new F1Scraper()
};

// Helper functions
export function getActiveScrapers() {
  return Object.entries(SPORTS_REGISTRY)
    .filter(([, config]) => config.isEnabled)
    .map(([id, config]) => ({
      id,
      config,
      scraper: SCRAPERS[id as keyof typeof SCRAPERS]
    }))
    .sort((a, b) => a.config.priority - b.config.priority);
}

export function enableSport(sportId: string) {
  if (SPORTS_REGISTRY[sportId]) {
    SPORTS_REGISTRY[sportId].isEnabled = true;
  }
}

export function disableSport(sportId: string) {
  if (SPORTS_REGISTRY[sportId]) {
    SPORTS_REGISTRY[sportId].isEnabled = false;
  }
}
