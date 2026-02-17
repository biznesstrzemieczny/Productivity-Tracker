import { useState, useMemo, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Activity, ChevronLeft, ChevronRight } from 'lucide-react';
import { deleteEntry } from '../utils/storage';
import { calculateEfficiency } from '../utils/efficiency';

const LinearChart = ({ entries, onDelete }) => {
  // Always base on the current system day
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const [selectedDate, setSelectedDate] = useState(() => new Date(today));

  // If selected date drifts into the future, clamp it back to today
  useEffect(() => {
    setSelectedDate((prev) => (prev > today ? new Date(today) : prev));
  }, [today]);

  // Compare dates by day only (ignore time)
  const isSameDay = (date1, date2) => {
    return date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate();
  };

  // Filter entries by selected day
  const filteredEntries = useMemo(() => {
    return entries.filter(entry => {
      const entryDate = new Date(entry.timestamp);
      entryDate.setHours(0, 0, 0, 0);
      return isSameDay(entryDate, selectedDate);
    });
  }, [entries, selectedDate]);

  // Go to previous day
  const goToPreviousDay = () => {
    const prevDate = new Date(selectedDate);
    prevDate.setDate(prevDate.getDate() - 1);
    setSelectedDate(prevDate);
  };

  // Go to next day (only if not already on today)
  const goToNextDay = () => {
    if (!isSameDay(selectedDate, today)) {
      const nextDate = new Date(selectedDate);
      nextDate.setDate(nextDate.getDate() + 1);
      // Do not allow going beyond today
      if (nextDate <= today) {
        setSelectedDate(nextDate);
      }
    }
  };

  // Can we move forward?
  const canGoForward = !isSameDay(selectedDate, today);

  // Format date for display
  const formatSelectedDate = (date) => {
    return date.toLocaleDateString('pl-PL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Helper: przelicz datę na wartość na osi X
  const getTimePosition = (dateObj) => {
    const hour = dateObj.getHours();
    const minute = dateObj.getMinutes();
    const timeValue = hour + minute / 60;
    return hour < 4 ? timeValue + 24 : timeValue;
  };

  // Map entries na punkty wykresu.
  // Dla nowych wpisów z sessionStart/sessionEnd tworzymy dwa punkty (początek i koniec sesji),
  // dla starych danych bez tych pól – pojedynczy punkt.
  const chartData = filteredEntries
    .flatMap(entry => {
      const efficiencyValue = parseFloat(calculateEfficiency(entry).toFixed(1));

      // Nowe wpisy – sesja jako przedział czasu
      if (entry.sessionStart && entry.sessionEnd) {
        const startDate = new Date(entry.sessionStart);
        const endDate = new Date(entry.sessionEnd);

        const startHour = startDate.getHours();
        const startMinute = startDate.getMinutes();
        const endHour = endDate.getHours();
        const endMinute = endDate.getMinutes();

        const startTime = getTimePosition(startDate);
        const endTime = getTimePosition(endDate);

        const startLabel = `${startHour.toString().padStart(2, '0')}:${startMinute.toString().padStart(2, '0')}`;
        const endLabel = `${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`;

        return [
          {
            time: startTime,
            timeLabel: startLabel,
            hour: startHour,
            minute: startMinute,
            efficiency: efficiencyValue,
            timestamp: startDate.toISOString(),
            pointType: 'start',
            entryId: entry.id,
          },
          {
            time: endTime,
            timeLabel: endLabel,
            hour: endHour,
            minute: endMinute,
            efficiency: efficiencyValue,
            timestamp: endDate.toISOString(),
            pointType: 'end',
            entryId: entry.id,
          },
        ];
      }

      // Stare dane – pojedynczy punkt
      const date = new Date(entry.timestamp);
      const hour = entry.hour;
      const minute = entry.minute || 0;
      const time = getTimePosition(date);
      const timeLabel = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;

      return [{
        time,
        timeLabel,
        hour,
        minute,
        efficiency: efficiencyValue,
        timestamp: entry.timestamp,
        pointType: 'single',
        entryId: entry.id,
      }];
    })
    .sort((a, b) => {
      // Sort by real time, taking midnight crossover into account
      if (a.hour < 4 && b.hour >= 4) return 1;
      if (a.hour >= 4 && b.hour < 4) return -1;
      return a.time - b.time;
    });

  // Calculate data range for X-axis optimization
  const calculateDataRange = () => {
    if (chartData.length === 0) return { minTime: 4, maxTime: 28 };

    const times = chartData.map(d => d.time);
    const minDataTime = Math.min(...times);
    const maxDataTime = Math.max(...times);
    const dataSpan = maxDataTime - minDataTime;

    // If data spans less than 8 hours, use focused range with padding
    if (dataSpan < 8) {
      const padding = Math.max(2, dataSpan * 0.3); // 30% padding, minimum 2 hours
      const minTime = Math.max(4, Math.floor(minDataTime - padding));
      const maxTime = Math.min(28, Math.ceil(maxDataTime + padding));
      return { minTime, maxTime };
    }

    // For larger spans, use standard range
    return { minTime: 4, maxTime: 28 };
  };

  const { minTime, maxTime } = calculateDataRange();

  // Build X-axis labels based on data range
  const xAxisLabels = [];
  for (let i = minTime; i <= maxTime; i++) {
    const hour = i % 24;
    xAxisLabels.push({
      hour: hour,
      label: hour < 10 ? `0${hour}:00` : `${hour}:00`,
      position: hour < 4 ? hour + 24 : hour,
    });
  }

  const handleChartClick = (data) => {
    // Handle click on chart using activePayload when available
    if (data && data.activePayload && data.activePayload[0] && data.activePayload[0].payload) {
      const payload = data.activePayload[0].payload;
      const entryId = payload?.entryId;
      if (entryId !== undefined && entryId !== null) {
        const deleted = deleteEntry(entryId);
        if (deleted && onDelete) {
          onDelete();
        }
      }
    }
  };

  return (
    <div className="glass-card p-4 sm:p-6 pb-4">
      <div className="flex items-center gap-3 mb-5">
        <Activity className="w-5 h-5 text-green-600" />
        <h3 className="text-xl font-bold text-white">
          Hourly efficiency
        </h3>
      </div>
      <ResponsiveContainer width="100%" height={250} className="sm:h-[350px]">
        <LineChart
          data={chartData}
          margin={{ top: 20, right: 20, left: 10, bottom: 35 }}
          onClick={handleChartClick}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" />
          <XAxis
            dataKey="time"
            type="number"
            domain={[minTime, maxTime]}
            stroke="#6B7280"
            tick={{ fill: '#9CA3AF', fontSize: 10 }}
            ticks={xAxisLabels.map(l => l.position)}
            tickFormatter={(value) => {
              const label = xAxisLabels.find(l => l.position === value);
              return label ? label.label : '';
            }}
            angle={-45}
            textAnchor="end"
            height={50}
          />
          <YAxis
            domain={[0, 10]}
            stroke="#6B7280"
            tick={{ fill: '#9CA3AF', fontSize: 12 }}
            width={50}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'rgba(17, 24, 39, 0.95)',
              border: '1px solid rgba(22, 163, 74, 0.3)',
              borderRadius: '8px',
              color: '#fff',
              fontSize: '13px',
              boxShadow: '0 0 20px rgba(0, 0, 0, 0.5)',
              transform: 'translate(-10px, -50px)'
            }}
            formatter={(value, name, props) => {
              const timeLabel = props.payload.timeLabel;
              return [`${value}/10`, `Efficiency (${timeLabel})`];
            }}
            labelFormatter={() => ''}
            cursor={{ stroke: '#16a34a', strokeWidth: 1 }}
          />
          <Line
            type="monotone"
            dataKey="efficiency"
            stroke="#16a34a"
            strokeWidth={3}
            dot={(props) => {
              const { cx, cy, payload } = props;

              // Sprawdź czy payload zawiera ID wpisu
              if (!payload || payload.entryId === undefined || payload.entryId === null) {
                return null;
              }

              // Nowa logika: kropki tylko na końcach sesji oraz dla pojedynczych punktów
              const isSessionEndpoint = payload.pointType === 'start' || payload.pointType === 'end';
              const isStandalone = payload.pointType === 'single';

              if (!isSessionEndpoint && !isStandalone) {
                return null;
              }

              const handleClick = (e) => {
                e.stopPropagation();
                e.preventDefault();
                const entryId = payload.entryId;
                if (entryId !== undefined && entryId !== null) {
                  deleteEntry(entryId);
                  if (onDelete) {
                    onDelete();
                  }
                }
              };

              return (
                <g>
                  <circle
                    cx={cx}
                    cy={cy}
                    r={5}
                    fill="#16a34a"
                    stroke="#000"
                    strokeWidth={2}
                    style={{ cursor: 'pointer', pointerEvents: 'all' }}
                    onClick={handleClick}
                    onMouseDown={handleClick}
                  />
                </g>
              );
            }}
            activeDot={(props) => {
              const { cx, cy, payload } = props;

              if (!payload || payload.entryId === undefined || payload.entryId === null) {
                return null;
              }

              // Aktywna kropka tylko na końcach sesji lub dla pojedynczych punktów
              const isSessionEndpoint = payload.pointType === 'start' || payload.pointType === 'end';
              const isStandalone = payload.pointType === 'single';

              if (!isSessionEndpoint && !isStandalone) {
                return null;
              }

              const handleClick = (e) => {
                e.stopPropagation();
                e.preventDefault();
                const entryId = payload.entryId;
                if (entryId !== undefined && entryId !== null) {
                  deleteEntry(entryId);
                  if (onDelete) {
                    onDelete();
                  }
                }
              };

              return (
                <circle
                  cx={cx}
                  cy={cy}
                  r={7}
                  fill="#16a34a"
                  stroke="#000"
                  strokeWidth={2}
                  style={{ cursor: 'pointer', pointerEvents: 'all' }}
                  onClick={handleClick}
                  onMouseDown={handleClick}
                />
              );
            }}
            onClick={(data) => {
              // Dodatkowa obsługa kliknięcia na Line
              if (data && data.activePayload && data.activePayload[0] && data.activePayload[0].payload) {
                const payload = data.activePayload[0].payload;
                if (payload && payload.entryId !== undefined && payload.entryId !== null) {
                  deleteEntry(payload.entryId);
                  if (onDelete) {
                    onDelete();
                  }
                }
              }
            }}
            name="Efficiency"
            connectNulls={false}
          />
        </LineChart>
      </ResponsiveContainer>

      {/* Day navigation */}
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-800/50">
        <button
          onClick={goToPreviousDay}
          className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-400 hover:text-green-600 transition-colors rounded-lg hover:bg-gray-800/30"
          title="Previous day"
        >
          <ChevronLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Previous</span>
        </button>

        <span className="text-sm text-gray-500 font-medium">
          {formatSelectedDate(selectedDate)}
          {isSameDay(selectedDate, today) && (
            <span className="ml-2 text-green-600">(Today)</span>
          )}
        </span>

        <button
          onClick={goToNextDay}
          disabled={!canGoForward}
          className={`flex items-center gap-2 px-3 py-1.5 text-sm transition-colors rounded-lg ${canGoForward
              ? 'text-gray-400 hover:text-green-600 hover:bg-gray-800/30'
              : 'text-gray-600 cursor-not-allowed opacity-50'
            }`}
          title={canGoForward ? 'Next day' : 'You are on the current day'}
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default LinearChart;
