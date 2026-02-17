import { useState, useEffect } from 'react';
import { Clock, List } from 'lucide-react';
import { deleteEntry } from '../utils/storage';
import { calculateEfficiency } from '../utils/efficiency';

const CheckInList = ({ entries, onDelete }) => {
  const [selectedIds, setSelectedIds] = useState(new Set());
  
  // Resetuj zaznaczenie gdy lista się zmienia (usuń ID które już nie istnieją)
  useEffect(() => {
    setSelectedIds(prev => {
      const updated = new Set(prev);
      let changed = false;
      prev.forEach(id => {
        if (!entries.find(e => e.id === id)) {
          updated.delete(id);
          changed = true;
        }
      });
      return changed ? updated : prev;
    });
  }, [entries]);

  const handleToggleSelection = (id) => {
    setSelectedIds(prev => {
      const updated = new Set(prev);
      if (updated.has(id)) {
        updated.delete(id);
      } else {
        updated.add(id);
      }
      return updated;
    });
  };

  const handleDeleteSelected = () => {
    selectedIds.forEach(id => {
      deleteEntry(id);
    });
    if (onDelete) onDelete();
    setSelectedIds(new Set());
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('pl-PL', { day: '2-digit', month: '2-digit' });
  };

  // Sortuj kopię tablicy, aby nie mutować oryginalnej
  const sortedEntries = [...entries].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  return (
    <div className="glass-card p-6 space-y-3">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <List className="w-4 h-4 text-green-600" />
          <h3 className="text-lg font-bold text-white">Saved check-ins</h3>
        </div>
        {selectedIds.size > 0 && (
          <span className="text-xs text-gray-500">
            Selected: {selectedIds.size}
          </span>
        )}
      </div>
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {sortedEntries.length === 0 ? (
          <p className="text-center text-gray-400 py-4">No saved check-ins</p>
        ) : (
          sortedEntries.map((entry) => {
            const efficiency = calculateEfficiency(entry).toFixed(1);
            const isSelected = selectedIds.has(entry.id);

            return (
              <div
                key={entry.id}
                className="relative"
              >
                <div
                  onClick={() => handleToggleSelection(entry.id)}
                  className={`p-3 rounded-lg border cursor-pointer transition-all duration-200 ${
                    isSelected
                      ? 'bg-gray-800/60 border-green-600/40 ring-2 ring-green-600/20'
                      : 'bg-gray-900/40 border-gray-800/50 hover:border-green-600/20'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${isSelected ? 'bg-green-600' : 'bg-gray-600'}`} />
                    <Clock className="w-4 h-4 text-gray-400" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-white">
                          {formatTime(entry.timestamp)}
                        </span>
                        <span className="text-xs text-gray-500">
                          {formatDate(entry.timestamp)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-gray-400">
                          E:{entry.energy} F:{entry.focus} M:{entry.mood} S:{entry.stressLevel !== undefined && entry.stressLevel !== null ? entry.stressLevel : '-'} R:{entry.result !== undefined && entry.result !== null ? entry.result : '-'}
                        </span>
                        <span className="text-xs font-semibold text-green-600">
                          {efficiency}/10
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
      {selectedIds.size > 0 && (
        <button
          onClick={handleDeleteSelected}
          className="w-full mt-4 pt-3 text-sm text-gray-500 hover:text-gray-400 transition-colors underline decoration-gray-600 hover:decoration-gray-500"
        >
          delete selected ({selectedIds.size})
        </button>
      )}
    </div>
  );
};

export default CheckInList;
