import { useState, useEffect, useCallback } from 'react';
import api from '../api/client';

const EVENT = 'repp:measurements-changed';

/** Call after saving a weight/measurement so every reminder on screen refreshes. */
export function notifyMeasurementsChanged() {
  window.dispatchEvent(new Event(EVENT));
}

/**
 * Weekly measurement check-in status from GET /api/progress/reminder:
 * { intervalDays, lastDate, daysSince, due, daysUntilDue, nextDueDate }
 */
export function useMeasurementReminder() {
  const [reminder, setReminder] = useState(null);

  const refresh = useCallback(async () => {
    try {
      setReminder(await api.get('/progress/reminder'));
    } catch {
      setReminder(null);
    }
  }, []);

  useEffect(() => {
    refresh();
    window.addEventListener(EVENT, refresh);
    // Re-check when the user comes back to the tab (e.g. the next day).
    window.addEventListener('focus', refresh);
    return () => {
      window.removeEventListener(EVENT, refresh);
      window.removeEventListener('focus', refresh);
    };
  }, [refresh]);

  return { reminder, refresh };
}

export function formatDueDate(isoDate) {
  if (!isoDate) return '';
  return new Date(`${isoDate}T00:00:00`).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}
