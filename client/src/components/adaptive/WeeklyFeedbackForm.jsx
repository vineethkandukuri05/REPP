import React, { useState } from 'react';

const SCALES = [
  { key: 'energyLevel', question: 'How was your energy level?', low: 'Exhausted', high: 'Great' },
  { key: 'workoutManageable', question: 'Was the workout schedule manageable?', low: 'Too much', high: 'Easy to follow' },
  { key: 'mealsAffordable', question: 'Were the meals affordable?', low: 'Too costly', high: 'Very affordable' },
  { key: 'sleepQuality', question: 'How was your sleep?', low: 'Poor', high: 'Excellent' }
];

const EMPTY = { energyLevel: 0, workoutManageable: 0, mealsAffordable: 0, sleepQuality: 0, proteinTargetMet: '', sleepHours: '', difficulties: '', improvements: '' };

function Scale({ item, value, onChange }) {
  return (
    <fieldset className="space-y-1.5">
      <legend className="text-xs font-bold text-ink">{item.question}</legend>
      <div className="flex items-center gap-1.5" role="radiogroup">
        {[1, 2, 3, 4, 5].map(n => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={value === n}
            aria-label={`${n} of 5`}
            onClick={() => onChange(n)}
            className={`w-9 h-9 rounded-sm text-xs font-bold border transition cursor-pointer ${
              value === n ? 'bg-brand text-on-brand border-brand' : 'bg-subtle text-muted border-line hover:border-line-strong hover:text-ink'
            }`}
          >
            {n}
          </button>
        ))}
      </div>
      <div className="flex justify-between text-[10px] text-muted max-w-[220px]"><span>{item.low}</span><span>{item.high}</span></div>
    </fieldset>
  );
}

/** End-of-week check-in. Answers are self-reported and used by the next plan. */
export default function WeeklyFeedbackForm({ existing, weekLabel, onSubmit }) {
  const [editing, setEditing] = useState(!existing);
  const [form, setForm] = useState(() => existing ? {
    ...EMPTY, ...existing, sleepHours: existing.sleepHours ?? '', difficulties: existing.difficulties || '', improvements: existing.improvements || ''
  } : EMPTY);
  const [saving, setSaving] = useState(false);

  const complete = SCALES.every(s => form[s.key] >= 1) && form.proteinTargetMet;

  const submit = async (e) => {
    e.preventDefault();
    if (!complete) return;
    setSaving(true);
    try {
      await onSubmit({
        energyLevel: form.energyLevel,
        workoutManageable: form.workoutManageable,
        mealsAffordable: form.mealsAffordable,
        sleepQuality: form.sleepQuality,
        proteinTargetMet: form.proteinTargetMet,
        sleepHours: form.sleepHours === '' ? null : Number(form.sleepHours),
        difficulties: form.difficulties.trim(),
        improvements: form.improvements.trim()
      });
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  if (!editing && existing) {
    return (
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="text-xs text-muted space-y-1">
          <div className="text-ink font-bold">Check-in saved for {weekLabel}</div>
          <div>
            Energy {existing.energyLevel}/5 · Schedule {existing.workoutManageable}/5 · Meals affordable {existing.mealsAffordable}/5 ·
            Sleep {existing.sleepQuality}/5{existing.sleepHours ? ` (${existing.sleepHours} h)` : ''} · Protein target: {existing.proteinTargetMet}
          </div>
          {existing.difficulties && <div>Difficulties: "{existing.difficulties}"</div>}
        </div>
        <button onClick={() => setEditing(true)} className="px-3 py-2 bg-subtle hover:bg-subtle-hover border border-line rounded-sm text-xs font-bold text-ink flex items-center gap-1.5 cursor-pointer shrink-0">
           Edit answers
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {SCALES.map(s => <Scale key={s.key} item={s} value={form[s.key]} onChange={(n) => setForm(f => ({ ...f, [s.key]: n }))} />)}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <fieldset className="space-y-1.5">
          <legend className="text-xs font-bold text-ink">Did you achieve your protein target?</legend>
          <div className="flex gap-1.5" role="radiogroup">
            {[['yes', 'Yes, most days'], ['partly', 'Partly'], ['no', 'No']].map(([v, l]) => (
              <button key={v} type="button" role="radio" aria-checked={form.proteinTargetMet === v} onClick={() => setForm(f => ({ ...f, proteinTargetMet: v }))}
                className={`px-3 py-2 rounded-sm text-xs font-bold border transition cursor-pointer ${form.proteinTargetMet === v ? 'bg-brand text-on-brand border-brand' : 'bg-subtle text-muted border-line hover:text-ink'}`}>
                {l}
              </button>
            ))}
          </div>
        </fieldset>
        <label className="space-y-1.5 block">
          <span className="text-xs font-bold text-ink">Average sleep per night (hours, optional)</span>
          <input type="number" min="3" max="12" step="0.5" inputMode="decimal" value={form.sleepHours}
            onChange={(e) => setForm(f => ({ ...f, sleepHours: e.target.value }))}
            className="w-full sm:w-40 bg-white border border-line-strong rounded-sm px-3 py-2 text-sm text-ink focus:outline-none focus:border-brand" />
        </label>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <label className="space-y-1.5 block">
          <span className="text-xs font-bold text-ink">What difficulties did you experience?</span>
          <textarea rows={2} maxLength={1000} value={form.difficulties} onChange={(e) => setForm(f => ({ ...f, difficulties: e.target.value }))}
            placeholder="e.g. late office hours, skipped breakfast"
            className="w-full bg-white border border-line-strong rounded-sm px-3 py-2 text-sm text-ink placeholder-muted focus:outline-none focus:border-brand" />
        </label>
        <label className="space-y-1.5 block">
          <span className="text-xs font-bold text-ink">What would you like to improve next week?</span>
          <textarea rows={2} maxLength={1000} value={form.improvements} onChange={(e) => setForm(f => ({ ...f, improvements: e.target.value }))}
            placeholder="e.g. sleep earlier, cheaper protein"
            className="w-full bg-white border border-line-strong rounded-sm px-3 py-2 text-sm text-ink placeholder-muted focus:outline-none focus:border-brand" />
        </label>
      </div>
      <div className="flex flex-wrap items-center justify-end gap-2">
        {existing && <button type="button" onClick={() => setEditing(false)} className="px-4 py-2 text-xs font-bold text-muted hover:text-ink cursor-pointer">Cancel</button>}
        <button type="submit" disabled={!complete || saving}
          className="px-5 py-2.5 bg-brand hover:bg-brand-hover text-on-brand font-bold text-xs rounded-sm flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
          
          Save Check-in
        </button>
      </div>
    </form>
  );
}
