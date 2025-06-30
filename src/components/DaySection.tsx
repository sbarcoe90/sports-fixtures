import { DayFixtures } from '@/types/sports';
import FixtureCard from './FixtureCard';

interface DaySectionProps {
  dayFixtures: DayFixtures;
}

function formatDateWithOrdinal(dateString: string): string {
  const date = new Date(dateString);
  const day = date.getDate();
  const month = date.toLocaleString('en-US', { month: 'long' });
  const getOrdinal = (n: number) => {
    if (n > 3 && n < 21) return 'th';
    switch (n % 10) {
      case 1: return 'st';
      case 2: return 'nd';
      case 3: return 'rd';
      default: return 'th';
    }
  };
  return `${month} ${day}${getOrdinal(day)}`;
}

export default function DaySection({ dayFixtures }: DaySectionProps) {
  return (
    <div className="mb-8">
      <h2 className="text-2xl font-bold text-gray-800 mb-4 pb-2 border-b-2 border-orange-200">
        {dayFixtures.day} {formatDateWithOrdinal(dayFixtures.date)}
      </h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {dayFixtures.fixtures.map((fixture) => (
          <FixtureCard key={fixture.id} fixture={fixture} />
        ))}
      </div>
    </div>
  );
} 