import { Fixture } from '@/types/sports';

interface FixtureCardProps {
  fixture: Fixture;
}

function getSportBgClass(sport: string): string {
  if (sport.toLowerCase().includes('f1')) return 'bg-blue-50 border-blue-200';
  if (sport.toLowerCase().includes('gaa')) return 'bg-green-50 border-green-200';
  return 'bg-gray-50 border-gray-200';
}

function getChannelBadgeClass(sport: string): string {
  if (sport.toLowerCase().includes('f1')) return 'bg-blue-500 text-white';
  if (sport.toLowerCase().includes('gaa')) return 'bg-green-500 text-white';
  return 'bg-gray-500 text-white';
}

export default function FixtureCard({ fixture }: FixtureCardProps) {
  return (
    <div className={`rounded-lg shadow-sm border p-4 flex flex-col gap-2 ${getSportBgClass(fixture.sport)}`}>
      <div className="flex items-center justify-between">
        <span className="font-semibold text-lg text-gray-800">{fixture.match}</span>
        <span className="text-sm text-gray-500">{fixture.time}</span>
      </div>
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <span>{fixture.venue}</span>
        {fixture.competition && <span className="ml-2 italic">{fixture.competition}</span>}
      </div>
      <div className="flex justify-end mt-2">
        <span className={`px-3 py-1 rounded-full font-semibold text-xs shadow-sm ${getChannelBadgeClass(fixture.sport)}`}>
          {fixture.channel}
        </span>
      </div>
    </div>
  );
} 