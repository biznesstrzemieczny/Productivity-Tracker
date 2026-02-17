import { useState, useEffect } from 'react';
import { Calendar, TrendingUp } from 'lucide-react';
import { updateEntry } from '../utils/storage';
import { calculateEfficiency } from '../utils/efficiency';

const ResultEditor = ({ entries, onUpdate }) => {
  const [resultValues, setResultValues] = useState({});
  const [savedIds, setSavedIds] = useState(new Set());

  // Inicjalizuj savedIds z zapisanymi wartościami result po załadowaniu danych
  useEffect(() => {
    const saved = new Set();
    entries.forEach(entry => {
      if (entry.result !== undefined && entry.result !== null) {
        saved.add(entry.id);
      }
    });
    setSavedIds(saved);
  }, [entries]);

  const handleResultChange = (id, value) => {
    setResultValues(prev => ({ ...prev, [id]: value }));
    // Usuń z zapisanych jeśli użytkownik zmieni wartość
    setSavedIds(prev => {
      const newSet = new Set(prev);
      newSet.delete(id);
      return newSet;
    });
  };

  const handleSave = (entry) => {
    // Jeśli już zapisany, zresetuj stan
    if (savedIds.has(entry.id)) {
      setSavedIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(entry.id);
        return newSet;
      });
      return;
    }

    // Zapisz result
    const resultValue = resultValues[entry.id] ?? (entry.result || 5);
    updateEntry(entry.id, { result: parseFloat(resultValue) });
    setResultValues(prev => {
      const newValues = { ...prev };
      delete newValues[entry.id];
      return newValues;
    });
    // Oznacz jako zapisany (bez timeout - zostaje wygaszony)
    setSavedIds(prev => new Set(prev).add(entry.id));
    if (onUpdate) onUpdate();
  };

  const formatFullDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('pl-PL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Sortuj od najnowszych do najstarszych
  const sortedEntries = [...entries].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  return (
    <div className="glass-card p-6 mt-8">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="w-4 h-4 text-green-600" />
        <h3 className="text-lg font-bold text-white">Uzupełnij Result</h3>
      </div>

      <div className="space-y-3 max-h-96 overflow-y-auto">
        {sortedEntries.length === 0 ? (
          <p className="text-center text-gray-400 py-4">Brak check-inów</p>
        ) : (
          sortedEntries.map((entry) => {
            const currentResult = resultValues[entry.id] ?? (entry.result || 5);
            const isSaved = savedIds.has(entry.id);
            const currentScore = (() => {
              // Podgląd score z aktualnym (tymczasowym) result
              return calculateEfficiency({ ...entry, result: parseFloat(currentResult) }).toFixed(1);
            })();
            const savedScore = calculateEfficiency(entry).toFixed(1);

            return (
              <div
                key={entry.id}
                className="p-4 rounded-lg border bg-gray-900/40 border-gray-800/50 hover:border-green-600/20 transition-all duration-200"
              >
                <div className="flex items-center gap-2 mb-3">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span className="text-sm font-medium text-white">
                    {formatFullDate(entry.timestamp)}
                  </span>
                  <span className="ml-auto text-sm font-semibold text-green-600">
                    Score: {resultValues[entry.id] !== undefined ? currentScore : savedScore}/10
                  </span>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <TrendingUp className="w-4 h-4 text-gray-400" />
                    <label className="text-sm font-semibold text-gray-300 flex-1">Result</label>
                    <span className="text-lg font-bold text-green-600 min-w-[50px] text-right">
                      {parseFloat(currentResult).toFixed(1)}
                    </span>
                  </div>

                  <input
                    type="range"
                    min="1"
                    max="10"
                    step="0.5"
                    value={currentResult}
                    onChange={(e) => handleResultChange(entry.id, parseFloat(e.target.value))}
                    className="w-full slider-thumb"
                  />

                  <button
                    onClick={() => handleSave(entry)}
                    className={`w-full py-2 rounded-lg font-semibold transition-all duration-200 text-sm ${isSaved
                        ? 'bg-gray-700/30 border border-gray-600/30 text-gray-500 hover:bg-gray-700/40'
                        : 'bg-green-600/20 border border-green-600/30 hover:bg-green-600/30 text-green-600'
                      }`}
                  >
                    {isSaved ? 'Zapisano' : 'Zapisz'}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ResultEditor;
