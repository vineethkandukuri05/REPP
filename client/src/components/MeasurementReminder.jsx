import React from 'react';
import { formatDueDate } from '../hooks/useMeasurementReminder';

/**
 * Weekly check-in prompt. Shows a prominent banner when measurements are due,
 * or (with showWhenNotDue) a quiet line saying when the next check-in is.
 */
export default function MeasurementReminder({ reminder, onAction, actionLabel = 'Log Measurements', showWhenNotDue = false }) {
  if (!reminder) return null;

  if (!reminder.due) {
    if (!showWhenNotDue) return null;
    return (
      <div className="px-4 py-3 bg-surface border border-line rounded-sm flex items-center gap-3 text-xs text-muted">
        
        <span>
          Weekly check-in up to date. Last measured <strong className="text-ink">{formatDueDate(reminder.lastDate)}</strong>.
          {' '}Next check-in {reminder.daysUntilDue === 1 ? 'tomorrow' : `in ${reminder.daysUntilDue} days`} (<strong className="text-ink">{formatDueDate(reminder.nextDueDate)}</strong>).
        </span>
      </div>
    );
  }

  const message = reminder.lastDate
    ? `It's been ${reminder.daysSince} days since your last measurements (${formatDueDate(reminder.lastDate)}). Log your weight and waist now so REPP can track your progress accurately.`
    : 'Log your weight and waist to start tracking your progress. REPP will remind you every 7 days.';

  return (
    <div className="p-4 sm:p-5 bg-subtle border border-warning rounded-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4" role="status">
      <div className="flex items-start gap-3">
        <div>
          <div className="text-sm font-bold text-ink">Weekly check-in due</div>
          <p className="text-xs text-body leading-relaxed mt-0.5">{message}</p>
        </div>
      </div>
      {onAction && (
        <button
          onClick={onAction}
          className="px-4 py-2.5 bg-warning hover:bg-warning text-on-brand font-bold text-xs rounded-sm transition cursor-pointer flex items-center justify-center gap-2 shrink-0"
        >
          {actionLabel} 
        </button>
      )}
    </div>
  );
}
