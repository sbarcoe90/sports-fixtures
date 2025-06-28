// Core types for the modular sports system

export interface Fixture {
  id: string;
  time: string;
  sport: string;
  match: string;
  channel: string;
  date: string;
  venue?: string;
  competition?: string;
}

export interface DayFixtures {
  day: string;
  date: string;
  fixtures: Fixture[];
}

export interface SportConfig {
  id: string;
  name: string;
  isEnabled: boolean;
  priority: number;
  seasonStart?: string;
  seasonEnd?: string;
}

export interface ScraperResult {
  sport: string;
  fixtures: DayFixtures[];
  success: boolean;
  error?: string;
  timestamp: string;
}
