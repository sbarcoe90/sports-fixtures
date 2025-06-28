import { GAAFixture } from '@/utils/gaaScraper';

interface FixtureCardProps {
  fixture: GAAFixture;
}

export default function FixtureCard({ fixture }: FixtureCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 p-4 border border-gray-100">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className="text-sm font-semibold text-gray-600 bg-orange-100 px-2 py-1 rounded">
            {fixture.time}
          </div>
          <div className="text-sm font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded">
            {fixture.sport}
          </div>
        </div>
        <div className={`text-xs px-2 py-1 rounded ${
          fixture.channel === 'No TV Coverage' 
            ? 'text-gray-400 bg-gray-100' 
            : 'text-gray-500 bg-gray-50'
        }`}>
          {fixture.channel === 'No TV Coverage' ? 'No TV' : fixture.channel}
        </div>
      </div>
      
      <div className="mb-3">
        <h3 className="text-lg font-semibold text-gray-800 mb-1">
          {fixture.match}
        </h3>
        {fixture.competition && (
          <p className="text-sm text-gray-600 italic">
            {fixture.competition}
          </p>
        )}
      </div>
      
      {(fixture.venue) && (
        <div className="text-xs text-gray-500 space-y-1">
          {fixture.venue && (
            <div className="flex items-center">
              <span className="font-medium mr-1">Venue:</span>
              <span>{fixture.venue}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 