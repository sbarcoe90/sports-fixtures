import { DayFixtures } from '@/types/sports';
import FixtureCard from './FixtureCard';

interface DaySectionProps {
  dayFixtures: DayFixtures;
}

export default function DaySection({ dayFixtures }: DaySectionProps) {
  return (
    <div className="mb-8">
      <h2 className="text-2xl font-bold text-gray-800 mb-4 pb-2 border-b-2 border-orange-200">
        {dayFixtures.day} {dayFixtures.date}
      </h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {dayFixtures.fixtures.map((fixture) => (
          <FixtureCard key={fixture.id} fixture={fixture} />
        ))}
      </div>
    </div>
  );
} 