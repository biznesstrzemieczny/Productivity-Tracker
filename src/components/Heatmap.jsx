import { useState } from 'react';
import { Calendar } from 'lucide-react';
import { calculateEfficiency } from '../utils/efficiency';

const Heatmap = ({ entries }) => {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const hours = Array.from({ length: 24 }, (_, i) => i);

  // Prepare data: for each weekday and hour, compute average efficiency
  const getEfficiency = (dayIndex, hour) => {
    const dayEntries = entries.filter(entry => {
      const entryDate = new Date(entry.timestamp);
      const entryDay = (entryDate.getDay() + 6) % 7; // Convert Sunday=0 -> Monday=0
      return entryDay === dayIndex && entry.hour === hour;
    });

    if (dayEntries.length === 0) return null;

    const avgEfficiency = dayEntries.reduce((sum, entry) => sum + calculateEfficiency(entry), 0) / dayEntries.length;

    return avgEfficiency;
  };

  const [hovered, setHovered] = useState(null);

  const getColor = (efficiency) => {
    if (efficiency === null) return 'bg-gray-800';
    if (efficiency < 3) return 'bg-gray-700';
    if (efficiency < 5) return 'bg-blue-900';
    if (efficiency < 7) return 'bg-blue-600';
    if (efficiency < 8.5) return 'bg-purple-600';
    return 'bg-purple-400';
  };

  return (
    <div className="glass-card p-6">
      <div className="flex items-center gap-3 mb-4">
        <Calendar className="w-5 h-5 text-blue-400" />
        <h3 className="text-lg font-bold">Weekly heatmap</h3>
      </div>
      
      <div className="overflow-x-auto">
        <div className="inline-block min-w-full">
          <div className="flex flex-col gap-1">
            {/* Header z godzinami */}
            <div className="flex gap-1 pl-14">
              {hours.map(hour => (
                <div key={hour} className="w-4 text-xs text-gray-400 text-center">
                  {hour % 4 === 0 ? hour : ''}
                </div>
              ))}
            </div>
            
            {/* Rows for each day */}
            {days.map((day, dayIndex) => (
              <div key={day} className="flex items-center gap-1">
                <div className="w-14 text-sm font-medium text-gray-300 text-right pr-2">
                  {day}
                </div>
                {hours.map(hour => {
                  const efficiency = getEfficiency(dayIndex, hour);
                  const cellKey = `${dayIndex}-${hour}`;
                  return (
                    <div
                      key={cellKey}
                      className={`w-4 h-4 rounded ${getColor(efficiency)} transition-all duration-200 ${
                        hovered === cellKey ? 'scale-125 z-10 shadow-lg ring-2 ring-blue-400' : ''
                      }`}
                      onMouseEnter={() => setHovered(cellKey)}
                      onMouseLeave={() => setHovered(null)}
                      title={efficiency !== null ? `Day: ${day}, Hour: ${hour}:00, Efficiency: ${efficiency.toFixed(1)}` : ''}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-3 mt-4 text-xs text-gray-400">
        <span>Less</span>
        <div className="flex gap-1">
          <div className="w-4 h-4 rounded bg-gray-700"></div>
          <div className="w-4 h-4 rounded bg-blue-900"></div>
          <div className="w-4 h-4 rounded bg-blue-600"></div>
          <div className="w-4 h-4 rounded bg-purple-600"></div>
          <div className="w-4 h-4 rounded bg-purple-400"></div>
        </div>
        <span>More</span>
      </div>
    </div>
  );
};

export default Heatmap;
