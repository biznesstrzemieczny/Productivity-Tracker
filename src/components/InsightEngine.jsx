import { Lightbulb, Clock, Sparkles } from 'lucide-react';
import { calculateEfficiency } from '../utils/efficiency';

const InsightEngine = ({ entries }) => {
  if (entries.length === 0) {
    return (
      <div className="glass-card p-6 text-center text-gray-400">
        <Lightbulb className="w-12 h-12 mx-auto mb-4 text-gray-600" />
        <p>Add more check-ins to discover your daily rhythm!</p>
      </div>
    );
  }

  // Find top 3 best time windows based on session start time with grading
  const findBestWindows = () => {
    // Calculate efficiency and get session start time for each entry
    const entryEfficiencies = entries.map(entry => {
      const efficiency = calculateEfficiency(entry);

      // Użyj sessionStart jeśli dostępne, w przeciwnym razie użyj hour/minute lub timestamp
      let startHour, startMinute;
      
      if (entry.sessionStart) {
        const startDate = new Date(entry.sessionStart);
        startHour = startDate.getHours();
        startMinute = startDate.getMinutes();
      } else if (entry.hour !== undefined) {
        startHour = entry.hour;
        startMinute = entry.minute || 0;
      } else if (entry.timestamp) {
        const date = new Date(entry.timestamp);
        startHour = date.getHours();
        startMinute = date.getMinutes();
      } else {
        startHour = 12; // fallback
        startMinute = 0;
      }

      // Convert to minutes since midnight for precise time handling
      const totalMinutes = startHour * 60 + startMinute;

      return {
        efficiency,
        totalMinutes,
        hour: startHour,
        minute: startMinute,
        entry: entry // zachowaj referencję do entry dla późniejszego użycia
      };
    });

    if (entryEfficiencies.length === 0) {
      return [];
    }

    // Grupuj sesje według godziny rozpoczęcia
    const hourlySessions = {};
    
    entryEfficiencies.forEach(entry => {
      const hour = entry.hour;
      
      if (!hourlySessions[hour]) {
        hourlySessions[hour] = {
          sessions: [],
          hour: hour,
          minutes: [] // zbierz minuty dla średniej
        };
      }
      
      hourlySessions[hour].sessions.push({
        efficiency: entry.efficiency,
        minute: entry.minute
      });
      hourlySessions[hour].minutes.push(entry.minute);
    });
    
    if (Object.keys(hourlySessions).length === 0) {
      return [];
    }
    
    // Oblicz score dla każdej godziny z grading (waga na podstawie liczby sesji)
    const hourScores = [];
    
    Object.keys(hourlySessions).forEach(hour => {
      const data = hourlySessions[hour];
      const sessions = data.sessions;
      const sessionCount = sessions.length;
      
      // Średnia efficiency dla tej godziny
      const avgEfficiency = sessions.reduce((sum, s) => sum + s.efficiency, 0) / sessionCount;
      
      // Grading: im więcej sesji, tym większa waga
      // Wzór: weight = min(1.0, 0.5 + (count - 1) * 0.1)
      // 1 sesja = 0.5, 2 sesje = 0.6, 3 sesje = 0.7, 4 sesje = 0.8, 5+ sesji = 1.0
      const gradingWeight = Math.min(1.0, 0.5 + (sessionCount - 1) * 0.1);
      
      // Finalny score = średnia efficiency * waga grading
      const score = avgEfficiency * gradingWeight;
      
      // Użyj średniej minuty dla wyświetlenia (przed zaokrągleniem)
      const avgMinute = Math.round(data.minutes.reduce((sum, m) => sum + m, 0) / data.minutes.length);
      
      hourScores.push({
        hour: parseInt(hour),
        minute: avgMinute,
        efficiency: avgEfficiency,
        score: score,
        sessionCount: sessionCount,
        gradingWeight: gradingWeight
      });
    });
    
    // Sortuj według efficiency (najlepsze na górze) - grading nie wpływa na ranking
    hourScores.sort((a, b) => b.efficiency - a.efficiency);
    
    // Funkcja zaokrąglająca do pełnej lub półgodziny
    const roundToHalfHour = (hour, minute) => {
      if (minute >= 30) {
        // Zaokrąglij w górę do pełnej godziny
        return { hour: (hour + 1) % 24, minute: 0 };
      } else {
        // Zaokrąglij w dół do półgodziny
        return { hour: hour, minute: 30 };
      }
    };
    
    // Zwróć top 3 z zaokrąglonymi godzinami
    return hourScores.slice(0, 3).map((window, index) => {
      const rounded = roundToHalfHour(window.hour, window.minute);
      return {
        rank: index + 1,
        hour: rounded.hour,
        minute: rounded.minute,
        efficiency: window.efficiency,
        sessionCount: window.sessionCount,
        reliability: window.gradingWeight // Używamy gradingWeight jako reliability
      };
    });
  };

  // Generate work mode recommendation based on best windows and chronotype
  const generateRecommendation = (bestWindows, chronotype) => {
    if (bestWindows.length === 0) {
      return "Add more check-ins to get personalized recommendations.";
    }

    const topWindow = bestWindows[0];
    const hour = topWindow.hour;
    const efficiency = topWindow.efficiency;

    // Determine time of day category
    let timeCategory = '';
    if (hour >= 6 && hour < 12) timeCategory = 'morning';
    else if (hour >= 12 && hour < 18) timeCategory = 'afternoon';
    else if (hour >= 18 && hour < 22) timeCategory = 'evening';
    else timeCategory = 'night';

    // Generate recommendation based on efficiency level and chronotype
    let recommendation = '';

    if (efficiency >= 8) {
      recommendation = `Schedule your most demanding deep work during ${topWindow.hour}:${topWindow.minute.toString().padStart(2, '0')}. This is your peak performance window - perfect for complex tasks, creative work, and important decisions.`;
    } else if (efficiency >= 6.5) {
      recommendation = `Plan focused work sessions around ${topWindow.hour}:${topWindow.minute.toString().padStart(2, '0')}. This window shows strong performance - ideal for important tasks and learning.`;
    } else {
      recommendation = `Your best working time starts around ${topWindow.hour}:${topWindow.minute.toString().padStart(2, '0')}. Consider lighter tasks or breaks during other hours to maximize productivity.`;
    }

    // Add chronotype-specific advice
    if (chronotype.type === 'Lion' && timeCategory !== 'morning') {
      recommendation += ' As a morning person, try shifting important work earlier if possible.';
    } else if (chronotype.type === 'Dolphin' && timeCategory !== 'night') {
      recommendation += ' Your chronotype suggests you may perform even better during late hours.';
    }

    // Add multi-window advice if we have multiple good windows
    if (bestWindows.length >= 2) {
      const secondWindow = bestWindows[1];
      const timeDiff = Math.abs((topWindow.hour * 60 + topWindow.minute) - (secondWindow.hour * 60 + secondWindow.minute));

      if (timeDiff > 120) { // More than 2 hours apart
        recommendation += ` You also have a strong secondary window around ${secondWindow.hour}:${secondWindow.minute.toString().padStart(2, '0')} - consider splitting your day between these two peaks.`;
      }
    }

    return recommendation;
  };

  // Determine chronotype based on hours of highest efficiency
  const determineChronotype = () => {
    // Helper function to get hour from entry (obsługuje nowe i stare wpisy)
    const getEntryHour = (entry) => {
      if (entry.sessionStart) {
        return new Date(entry.sessionStart).getHours();
      }
      if (entry.hour !== undefined) {
        return entry.hour;
      }
      if (entry.timestamp) {
        return new Date(entry.timestamp).getHours();
      }
      return 12; // fallback
    };
    
    const morningEntries = entries.filter(e => {
      const hour = getEntryHour(e);
      return hour >= 6 && hour < 12;
    });
    const afternoonEntries = entries.filter(e => {
      const hour = getEntryHour(e);
      return hour >= 12 && hour < 18;
    });
    const eveningEntries = entries.filter(e => {
      const hour = getEntryHour(e);
      return hour >= 18 && hour < 24;
    });
    const nightEntries = entries.filter(e => {
      const hour = getEntryHour(e);
      return hour >= 0 && hour < 6;
    });

    const calcAvgEfficiency = (entries) => {
      if (entries.length === 0) return 0;
      return entries.reduce((sum, e) => {
        return sum + calculateEfficiency(e);
      }, 0) / entries.length;
    };

    const morningAvg = calcAvgEfficiency(morningEntries);
    const afternoonAvg = calcAvgEfficiency(afternoonEntries);
    const eveningAvg = calcAvgEfficiency(eveningEntries);
    const nightAvg = calcAvgEfficiency(nightEntries);

    const maxAvg = Math.max(morningAvg, afternoonAvg, eveningAvg, nightAvg);

    if (maxAvg === morningAvg && morningAvg > 0) return { type: 'Lion', desc: 'You work best in the morning' };
    if (maxAvg === afternoonAvg && afternoonAvg > 0) return { type: 'Bear', desc: 'You work best during the day' };
    if (maxAvg === eveningAvg && eveningAvg > 0) return { type: 'Wolf', desc: 'You work best in the evening' };
    if (maxAvg === nightAvg && nightAvg > 0) return { type: 'Dolphin', desc: 'You work best at night' };

    return { type: 'Bear', desc: 'You work best during the day' };
  };

  const bestWindows = findBestWindows();
  const chronotype = determineChronotype();
  const recommendation = generateRecommendation(bestWindows, chronotype);

  return (
    <div className="glass-card p-4 sm:p-6 space-y-4 sm:space-y-5">
      <div className="flex items-center gap-3 mb-4">
        <Lightbulb className="w-5 h-5 text-amber-400 drop-shadow-[0_0_10px_rgba(251,191,36,0.25)]" />
        <h3 className="text-lg font-bold text-white">Your Insights</h3>
      </div>

      <div className="space-y-4">
        <div className="flex items-start gap-4 p-4 bg-gray-800/50 rounded-xl border border-amber-500/25 shadow-[inset_0_0_0_1px_rgba(251,191,36,0.08)]">
          <Clock className="w-6 h-6 text-amber-400 mt-1 flex-shrink-0 drop-shadow-[0_0_12px_rgba(251,191,36,0.25)]" />
          <div className="flex-1">
            <p className="text-sm text-gray-400 mb-2">Best windows</p>
            {bestWindows.length === 0 ? (
              <p className="text-lg font-semibold text-gray-500">None</p>
            ) : (
              <div className="space-y-2">
                {bestWindows.map((window) => (
                  <div key={`${window.hour}-${window.minute}`} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-amber-400/70">#{window.rank}</span>
                      <span className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-300 to-amber-500 drop-shadow-[0_0_14px_rgba(251,191,36,0.20)]">
                        {window.hour.toString().padStart(2, '0')}:{window.minute.toString().padStart(2, '0')}
                      </span>
                    </div>
                    <span className="text-sm text-gray-400">
                      {window.efficiency.toFixed(1)}/10
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {bestWindows.length > 0 && (
          <div className="p-4 bg-gray-800/30 rounded-xl border border-amber-500/15">
            <p className="text-xs font-semibold text-amber-400/80 mb-2 uppercase tracking-wide">Recommendation</p>
            <p className="text-sm text-gray-300 leading-relaxed">{recommendation}</p>
          </div>
        )}

        <div className="flex items-start gap-4 p-4 bg-gray-800/50 rounded-xl border border-amber-500/25 shadow-[inset_0_0_0_1px_rgba(251,191,36,0.08)]">
          <Sparkles className="w-6 h-6 text-amber-400 mt-1 flex-shrink-0 drop-shadow-[0_0_12px_rgba(251,191,36,0.25)]" />
          <div>
            <p className="text-sm text-gray-400 mb-1">Chronotype</p>
            <p className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-300 to-amber-500 drop-shadow-[0_0_14px_rgba(251,191,36,0.20)]">
              {chronotype.type}
            </p>
            <p className="text-sm text-gray-400 mt-1">{chronotype.desc}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InsightEngine;
