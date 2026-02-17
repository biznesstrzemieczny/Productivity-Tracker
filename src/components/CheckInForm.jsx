import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Zap, Target, Smile, AlertCircle, ClipboardList, TrendingUp } from 'lucide-react';
import { saveEntry } from '../utils/storage';

const CheckInForm = ({ onSave }) => {
  const [energy, setEnergy] = useState(5);
  const [focus, setFocus] = useState(5);
  const [mood, setMood] = useState(5);
  const [stressLevel, setStressLevel] = useState(5);
  const [result, setResult] = useState(5);

  // session timer
  const [sessionMinutes, setSessionMinutes] = useState(60); // 15–180
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [sessionStartTime, setSessionStartTime] = useState(null);
  const [sessionEndTime, setSessionEndTime] = useState(null);
  const [sessionActualEndTime, setSessionActualEndTime] = useState(null); // Czas kliknięcia "End session"

  // Load active session from localStorage on mount
  useEffect(() => {
    const savedSessionEnd = localStorage.getItem('active_session_end');
    if (savedSessionEnd) {
      const endTime = new Date(savedSessionEnd);
      const now = new Date();
      const remaining = Math.max(0, Math.floor((endTime - now) / 1000));

      if (remaining > 0) {
        setSessionEndTime(endTime);
        setIsSessionActive(true);
        setRemainingSeconds(remaining);
        // Restore session start time (end time - session duration)
        const savedSessionStart = localStorage.getItem('active_session_start');
        if (savedSessionStart) {
          setSessionStartTime(new Date(savedSessionStart));
        }
      } else {
        // Session expired while away
        localStorage.removeItem('active_session_end');
        localStorage.removeItem('active_session_start');
        setIsSessionActive(false);
        setShowModal(true);
      }
    }
  }, []);

  // Session countdown - calculate based on real time difference
  useEffect(() => {
    if (!isSessionActive || !sessionEndTime) return;

    const updateTimer = () => {
      const now = new Date();
      const remaining = Math.max(0, Math.floor((sessionEndTime - now) / 1000));

      setRemainingSeconds(remaining);

      if (remaining <= 0) {
        const actualEndTime = new Date(); // Zapisz rzeczywisty czas zakończenia sesji
        setSessionActualEndTime(actualEndTime);
        setIsSessionActive(false);
        setShowModal(true);
        localStorage.removeItem('active_session_end');
        localStorage.removeItem('active_session_start');
        setSessionEndTime(null);
      }
    };

    // Update immediately
    updateTimer();

    // Update every second
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [isSessionActive, sessionEndTime]);

  const startSession = () => {
    const startTime = new Date();
    const endTime = new Date(startTime.getTime() + sessionMinutes * 60000);

    setSessionStartTime(startTime);
    setSessionEndTime(endTime);
    setRemainingSeconds(sessionMinutes * 60);
    setIsSessionActive(true);

    // Save to localStorage so it persists across page refreshes
    localStorage.setItem('active_session_end', endTime.toISOString());
    localStorage.setItem('active_session_start', startTime.toISOString());
  };

  const endSession = () => {
    const actualEndTime = new Date(); // Zapisz rzeczywisty czas zakończenia sesji
    setSessionActualEndTime(actualEndTime);
    setIsSessionActive(false);
    setShowModal(true);
    localStorage.removeItem('active_session_end');
    localStorage.removeItem('active_session_start');
    setSessionEndTime(null);
  };

  const formatTime = (totalSeconds) => {
    const hours = Math.floor(totalSeconds / 3600)
      .toString()
      .padStart(2, '0');
    const minutes = Math.floor((totalSeconds % 3600) / 60)
      .toString()
      .padStart(2, '0');
    const seconds = (totalSeconds % 60).toString().padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
  };

  const handleSaveCheckIn = () => {
    const startTime = sessionStartTime || new Date(); // Fallback jeśli brak czasu startu
    // Użyj czasu kliknięcia "End session" jako końca sesji, nie czasu zapisu
    const endTime = sessionActualEndTime || new Date();

    // Oblicz czas trwania sesji w minutach
    const sessionDurationMs = endTime - startTime;
    const sessionDurationMinutes = Math.max(1, Math.floor(sessionDurationMs / 60000));

    // Zapisz JEDEN zbiorczy check-in dla całej sesji
    const entryTime = startTime;

    const entry = {
      id: Date.now(),
      timestamp: entryTime.toISOString(), // traktujemy jako czas startu sesji
      date: entryTime.toLocaleDateString('pl-PL'),
      hour: entryTime.getHours(),
      minute: entryTime.getMinutes(),
      energy: parseFloat(energy),
      focus: parseFloat(focus),
      mood: parseFloat(mood),
      stressLevel: parseFloat(stressLevel),
      result: parseFloat(result),
      // dodatkowe pola opisujące przedział czasowy sesji
      sessionStart: startTime.toISOString(),
      sessionEnd: endTime.toISOString(),
      sessionDurationMinutes,
    };

    saveEntry(entry);

    // Reset stanów
    setEnergy(5);
    setFocus(5);
    setMood(5);
    setStressLevel(5);
    setResult(5);
    setShowModal(false);
    setSessionStartTime(null);
    setSessionEndTime(null);
    setSessionActualEndTime(null);
    localStorage.removeItem('active_session_end');
    localStorage.removeItem('active_session_start');

    if (onSave) onSave();
  };

  const Slider = ({ label, value, onChange, icon: Icon, color }) => {
    const calculateValue = (percent) => {
      // percent * 18 daje zakres 0-18
      // Math.round zaokrągla do najbliższej całkowitej
      // / 2 daje wartości co 0.5 (0, 0.5, 1, 1.5, ..., 9)
      // + 1 przesuwa zakres do 1-10
      const rawValue = Math.round(percent * 18) / 2 + 1;
      return Math.max(1, Math.min(10, rawValue));
    };

    const handleMouseMove = (e) => {
      if (e.buttons === 1) {
        const rect = e.currentTarget.getBoundingClientRect();
        const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        const newValue = calculateValue(percent);
        onChange(newValue);
      }
    };

    const handleMouseDown = (e) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      const newValue = calculateValue(percent);
      onChange(newValue);
    };

    return (
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <Icon className={`w-5 h-5 ${color}`} />
          <label className="text-sm font-semibold text-gray-300">{label}</label>
          <span className="ml-auto text-xl font-bold text-green-600">{parseFloat(value).toFixed(1)}</span>
        </div>
        <input
          type="range"
          min="1"
          max="10"
          step="0.5"
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          onMouseMove={handleMouseMove}
          onMouseDown={handleMouseDown}
          className="slider-thumb"
        />
      </div>
    );
  };

  return (
    <div className="glass-card p-4 sm:p-7 space-y-5 sm:space-y-7">
      <div className="flex items-center gap-3 mb-4">
        <ClipboardList className="w-5 h-5 text-green-600" />
        <h2 className="text-xl font-bold text-white">Check-in</h2>
        <span className="ml-auto text-sm text-gray-400">
          {new Date().toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>

      {/* session start state */}
      {!isSessionActive && (
        <div className="space-y-7 py-6">
          <button
            type="button"
            onClick={startSession}
            className="w-full h-14 flex items-center justify-center bg-gray-900/40 border border-green-600/30 backdrop-blur-xl rounded-xl font-semibold hover:bg-gray-900/60 hover:border-green-600/50 transition-all duration-200 text-green-600"
          >
            Start session
          </button>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-gray-400">
              <span>Session length</span>
              <span>{sessionMinutes} min</span>
            </div>
            <input
              type="range"
              min={15}
              max={180}
              step={5}
              value={sessionMinutes}
              onChange={(e) => setSessionMinutes(parseInt(e.target.value, 10))}
              className="w-full slider-thumb"
            />
          </div>
        </div>
      )}

      {/* active session */}
      {isSessionActive && (
        <div className="flex flex-col items-center gap-4">
          <div className="text-xs uppercase tracking-wide text-gray-400">
            Session in progress
          </div>
          <div className="text-3xl sm:text-4xl font-semibold text-green-500 tabular-nums">
            {formatTime(remainingSeconds)}
          </div>
          <button
            type="button"
            onClick={endSession}
            className="text-xs text-gray-500 hover:text-gray-300 transition-colors underline decoration-gray-600/60 hover:decoration-gray-400"
          >
            End session
          </button>
        </div>
      )}

      {/* post-session self‑rating modal (portal to body so it's centered on screen) */}
      {showModal &&
        createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 px-4">
            <div className="glass-card p-4 sm:p-10 w-full max-w-2xl space-y-5 sm:space-y-7 max-h-[85vh] overflow-y-auto mx-2 sm:mx-0">
              <div className="space-y-0.5">
                <h3 className="text-lg font-bold text-white">Session summary</h3>
                <p className="text-xs text-gray-400">
                  Rate how you felt during this session.
                </p>
              </div>

              <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
                <Slider
                  label="Energy"
                  value={energy}
                  onChange={setEnergy}
                  icon={Zap}
                  color="text-yellow-500"
                />

                <Slider
                  label="Focus"
                  value={focus}
                  onChange={setFocus}
                  icon={Target}
                  color="text-blue-400"
                />

                <Slider
                  label="Mood"
                  value={mood}
                  onChange={setMood}
                  icon={Smile}
                  color="text-green-600"
                />

                <Slider
                  label="Stress Level"
                  value={stressLevel}
                  onChange={setStressLevel}
                  icon={AlertCircle}
                  color="text-red-500"
                />

                <Slider
                  label="Result"
                  value={result}
                  onChange={setResult}
                  icon={TrendingUp}
                  color="text-amber-400"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2 text-xs text-gray-500 hover:text-gray-300 transition-colors border border-gray-700/70 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveCheckIn}
                  className="flex-1 py-2 bg-gray-900/40 border border-green-600/40 rounded-lg text-sm font-semibold text-green-500 hover:bg-gray-900/70 hover:border-green-600/60 transition-all"
                >
                  Save check-in
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};

export default CheckInForm;
