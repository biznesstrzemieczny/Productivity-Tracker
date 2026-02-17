const STORAGE_KEY = 'peakstate_data';
const HEADER_STORAGE_KEY = 'peakstate_header';

const isLegacyEntry = (entry) => {
  // Legacy wpisy nie mają informacji o przedziale sesji
  return entry && !entry.sessionStart && !entry.sessionEnd;
};

const nearlyEqual = (a, b, eps = 1e-9) => Math.abs(Number(a) - Number(b)) <= eps;

const hasSameRatings = (a, b) => {
  // Łączymy tylko wtedy, gdy wartości są identyczne (tolerancja na floaty)
  return (
    nearlyEqual(a.energy, b.energy) &&
    nearlyEqual(a.focus, b.focus) &&
    nearlyEqual(a.mood, b.mood) &&
    nearlyEqual(a.stressLevel ?? null, b.stressLevel ?? null) &&
    nearlyEqual(a.result ?? null, b.result ?? null)
  );
};

const toSessionEntry = (first, last) => {
  const start = new Date(first.timestamp);
  const end = new Date(last.timestamp);
  const durationMinutes = Math.max(1, Math.floor((end - start) / 60000));

  return {
    ...first,
    // utrzymujemy id pierwszego wpisu, aby usuwanie/dalsze edycje działały przewidywalnie
    timestamp: start.toISOString(),
    date: start.toLocaleDateString('pl-PL'),
    hour: start.getHours(),
    minute: start.getMinutes(),
    sessionStart: start.toISOString(),
    sessionEnd: end.toISOString(),
    sessionDurationMinutes: durationMinutes,
  };
};

const migrateLegacyEntriesToSessions = (entries) => {
  if (!Array.isArray(entries) || entries.length < 2) {
    return { entries, changed: false };
  }

  // pracuj na kopii, posortuj rosnąco po czasie
  const sorted = [...entries].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  const migrated = [];

  let changed = false;
  let i = 0;

  while (i < sorted.length) {
    const current = sorted[i];

    // Nie dotykamy już-zmigrowanych wpisów sesji
    if (!isLegacyEntry(current)) {
      migrated.push(current);
      i += 1;
      continue;
    }

    const group = [current];
    let j = i + 1;

    while (j < sorted.length) {
      const next = sorted[j];
      if (!isLegacyEntry(next)) break;
      if (!hasSameRatings(current, next)) break;

      const prevInGroup = group[group.length - 1];
      const diffMinutes = (new Date(next.timestamp) - new Date(prevInGroup.timestamp)) / 60000;

      // Stare wpisy były tworzone co 15 minut; tolerancja na opóźnienia/zaokrąglenia
      if (diffMinutes >= 10 && diffMinutes <= 20) {
        group.push(next);
        j += 1;
      } else {
        break;
      }
    }

    if (group.length >= 2) {
      migrated.push(toSessionEntry(group[0], group[group.length - 1]));
      changed = true;
    } else {
      migrated.push(current);
    }

    i = j;
  }

  // Zachowaj finalne sortowanie tak jak wcześniej (kolejność nie jest krytyczna),
  // ale zapisujemy w lokalStorage w formie migrated.
  return { entries: migrated, changed };
};

export const saveEntry = (entry) => {
  try {
    const entries = getEntries();
    entries.push(entry);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch (error) {
    console.error('Error while saving data to localStorage:', error);
  }
};

export const getEntries = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    const parsed = data ? JSON.parse(data) : [];
    const { entries: migrated, changed } = migrateLegacyEntriesToSessions(parsed);
    if (changed) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
    }
    return migrated;
  } catch (error) {
    console.error('Error while reading data from localStorage:', error);
    return [];
  }
};

export const clearEntries = () => {
  localStorage.removeItem(STORAGE_KEY);
};

export const deleteEntry = (id) => {
  try {
    const entries = getEntries();
    // Konwertuj ID na number dla porównania (Date.now() zwraca number)
    const idToDelete = typeof id === 'string' ? parseInt(id, 10) : Number(id);
    const filtered = entries.filter(entry => {
      const entryId = typeof entry.id === 'string' ? parseInt(entry.id, 10) : Number(entry.id);
      return entryId !== idToDelete;
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    return filtered.length < entries.length; // Return true if something was deleted
  } catch (error) {
    console.error('Error while deleting data from localStorage:', error);
    return false;
  }
};

export const updateEntry = (id, updates) => {
  try {
    const entries = getEntries();
    // Konwertuj ID na number dla porównania
    const idToUpdate = typeof id === 'string' ? parseInt(id, 10) : Number(id);
    const updated = entries.map(entry => {
      const entryId = typeof entry.id === 'string' ? parseInt(entry.id, 10) : Number(entry.id);
      if (entryId === idToUpdate) {
        return { ...entry, ...updates };
      }
      return entry;
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (error) {
    console.error('Error while updating data in localStorage:', error);
    return getEntries();
  }
};

export const saveHeader = (title, subtitle) => {
  try {
    localStorage.setItem(HEADER_STORAGE_KEY, JSON.stringify({ title, subtitle }));
  } catch (error) {
    console.error('Error while saving header to localStorage:', error);
  }
};

export const getHeader = () => {
  try {
    const data = localStorage.getItem(HEADER_STORAGE_KEY);
    if (data) {
      return JSON.parse(data);
    }
    return { title: 'Productivity Tracker', subtitle: 'Jakub Strzemieczny' };
  } catch (error) {
    console.error('Error while reading header from localStorage:', error);
    return { title: 'Productivity Tracker', subtitle: 'Jakub Strzemieczny' };
  }
};
