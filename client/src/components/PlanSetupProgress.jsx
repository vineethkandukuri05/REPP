import React, { useEffect, useRef, useState } from 'react';
import { Check } from './ui/icons';

/**
 * Progress ring + step list shown while a new account's plans are generated.
 *
 * The server can't report how far the AI has got, so progress is estimated from each step's expected
 * duration: inside a step the ring eases toward the step's end but never reaches it until the step
 * really finishes. `expected` (seconds per step) can be updated mid-way as real timings come in.
 */
export default function PlanSetupProgress({ steps, stage, expected }) {
  const stageStart = useRef({ index: stage, at: Date.now() });
  const shown = useRef(0);
  const [now, setNow] = useState(Date.now());

  if (stageStart.current.index !== stage) stageStart.current = { index: stage, at: Date.now() };

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(t);
  }, []);

  const total = expected.reduce((a, b) => a + b, 0);
  const elapsed = Math.max(0, (now - stageStart.current.at) / 1000);
  const current = expected[stage] ?? 0;
  // Approaches 95% of the step asymptotically: steady at first, slowing if the step runs long.
  const withinStep = current > 0 ? Math.min(0.95, 1 - Math.exp(-1.6 * (elapsed / current))) : 0;
  const doneSeconds = expected.slice(0, stage).reduce((a, b) => a + b, 0);
  // Never move backwards, even when an estimate is revised upward.
  shown.current = Math.max(shown.current, Math.min(99, Math.round(((doneSeconds + current * withinStep) / total) * 100)));
  const percent = shown.current;

  const remainingSeconds = Math.round(
    Math.max(current - elapsed, 0) + expected.slice(stage + 1).reduce((a, b) => a + b, 0)
  );
  const overdue = elapsed > current * 1.3 && stage < steps.length;
  const timeText = overdue
    ? 'Taking a little longer than usual…'
    : remainingSeconds >= 60
      ? `About ${Math.ceil(remainingSeconds / 60)} min left`
      : `About ${Math.max(remainingSeconds, 1)} seconds left`;

  const size = 168;
  const stroke = 12;
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;

  return (
    <div className="py-6 sm:py-10 flex flex-col md:flex-row items-center md:items-start justify-center gap-10">
      <div
        className="relative shrink-0"
        style={{ width: size, height: size }}
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        aria-label="Setting up your plan"
      >
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--color-subtle)" strokeWidth={stroke} />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="var(--color-brand)"
            strokeWidth={stroke}
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - percent / 100)}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
            style={{ transition: 'stroke-dashoffset 0.25s linear' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl font-bold text-ink">{percent}%</span>
          <span className="mt-1 text-xs text-muted">complete</span>
        </div>
      </div>

      <div className="w-full max-w-sm">
        <h3 className="text-xl font-bold text-ink">Setting up your plan</h3>
        <p className="mt-1 text-sm text-muted" aria-live="polite">{timeText}</p>

        <ol className="mt-6 space-y-4">
          {steps.map((label, i) => {
            const state = i < stage ? 'done' : i === stage ? 'active' : 'waiting';
            return (
              <li key={label} className="flex items-start gap-3">
                <span
                  className={`mt-0.5 w-6 h-6 shrink-0 rounded-sm border flex items-center justify-center text-xs font-bold ${
                    state === 'done'
                      ? 'bg-brand border-brand text-on-brand'
                      : state === 'active'
                        ? 'border-brand text-brand'
                        : 'border-line-strong text-muted'
                  }`}
                >
                  {state === 'done' ? <Check className="w-4 h-4" /> : i + 1}
                </span>
                <div>
                  <p className={`text-sm ${state === 'waiting' ? 'text-muted' : 'text-ink font-bold'}`}>{label}</p>
                  <p className="text-xs text-muted">
                    {state === 'done' ? 'Done' : state === 'active' ? 'In progress' : 'Waiting'}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}
