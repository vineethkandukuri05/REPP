import React, { useState } from 'react';

const weekdayShort = (iso) => new Date(`${iso}T12:00:00`).toLocaleDateString('en-US', { weekday: 'short' });
const shortDate = (iso) => new Date(`${iso}T12:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

/**
 * 7 bars (one per day) against a target line. Days with no data show as an empty slot.
 * Hover/focus a bar to see its value.
 */
export function DailyBarChart({ days, valueKey, target, unit, color = 'var(--color-brand)', previousAvg = null, label }) {
  const [active, setActive] = useState(null);
  const values = days.map(d => d[valueKey]);
  const max = Math.max(target || 0, previousAvg || 0, ...values.filter(v => v != null)) * 1.15 || 1;
  const W = 320, H = 150, L = 6, R = 6, T = 14, B = 22;
  const slot = (W - L - R) / days.length;
  const bw = Math.min(26, slot * 0.62);
  const y = (v) => T + (1 - v / max) * (H - T - B);

  return (
    <figure className="space-y-2">
      <figcaption className="flex items-baseline justify-between text-xs">
        <span className="font-bold text-ink">{label}</span>
        <span className="text-muted font-mono">
          {active != null
            ? `${weekdayShort(days[active].date)}: ${values[active] != null ? `${Math.round(values[active]).toLocaleString()} ${unit}` : 'not logged'}`
            : target ? `Target ${Math.round(target).toLocaleString()} ${unit}` : ''}
        </span>
      </figcaption>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-36" role="img" aria-label={`${label}, last 7 days`}>
        {target ? (
          <>
            <line x1={L} x2={W - R} y1={y(target)} y2={y(target)} stroke="var(--color-muted)" strokeDasharray="4 3" strokeWidth="1" />
          </>
        ) : null}
        {previousAvg ? <line x1={L} x2={W - R} y1={y(previousAvg)} y2={y(previousAvg)} stroke="var(--color-data-carbs)" strokeOpacity="0.6" strokeDasharray="2 3" strokeWidth="1" /> : null}
        {days.map((d, i) => {
          const v = values[i];
          const cx = L + slot * i + slot / 2;
          const over = target && v != null && v > target * 1.1;
          return (
            <g key={d.date}
              tabIndex={0}
              onMouseEnter={() => setActive(i)} onMouseLeave={() => setActive(null)}
              onFocus={() => setActive(i)} onBlur={() => setActive(null)}
              className="outline-none cursor-default"
            >
              <rect x={cx - slot / 2} y={T} width={slot} height={H - T - B} fill="transparent" />
              {v != null ? (
                <rect x={cx - bw / 2} y={y(v)} width={bw} height={Math.max(2, H - B - y(v))} rx="4"
                  fill={over ? 'var(--color-warning)' : color} opacity={active == null || active === i ? 1 : 0.45} />
              ) : (
                <rect x={cx - bw / 2} y={H - B - 3} width={bw} height="3" rx="1.5" fill="var(--color-line)" />
              )}
              <text x={cx} y={H - 6} fontSize="10" fill={active === i ? 'var(--color-data-calories)' : 'var(--color-muted)'} textAnchor="middle">{weekdayShort(d.date)}</text>
            </g>
          );
        })}
      </svg>
      <div className="flex flex-wrap gap-3 text-[10px] text-muted">
        {target ? <span className="flex items-center gap-1"><span className="w-3 border-t border-dashed border-muted" /> Target</span> : null}
        {previousAvg ? <span className="flex items-center gap-1"><span className="w-3 border-t border-dashed border-data-carbs" /> Last week's average</span> : null}
        <span className="flex items-center gap-1"><span className="w-2.5 h-1 rounded-sm bg-line" /> Not logged</span>
      </div>
    </figure>
  );
}

/** Weight (line) and waist (dashed) over the last 4 weeks of weigh-ins. */
export function WeightTrendChart({ points }) {
  const [active, setActive] = useState(null);
  if (!points || points.length < 2) {
    return (
      <div className="h-36 flex items-center justify-center text-xs text-muted border border-dashed border-line rounded-sm text-center px-4">
        Log at least two weigh-ins (one a week) to see your trend.
      </div>
    );
  }
  const W = 320, H = 150, L = 30, R = 30, T = 12, B = 22;
  const t0 = new Date(`${points[0].date}T12:00:00`).getTime();
  const t1 = new Date(`${points[points.length - 1].date}T12:00:00`).getTime();
  const x = (iso) => L + ((new Date(`${iso}T12:00:00`).getTime() - t0) / Math.max(1, t1 - t0)) * (W - L - R);
  const scale = (vals) => {
    const lo = Math.min(...vals), hi = Math.max(...vals);
    const pad = Math.max(0.3, (hi - lo) * 0.2);
    return { lo: lo - pad, hi: hi + pad, y: (v) => T + (1 - (v - (lo - pad)) / (hi - lo + 2 * pad)) * (H - T - B) };
  };
  const w = scale(points.map(p => p.weight));
  const waistPts = points.filter(p => p.waist != null);
  const wa = waistPts.length > 1 ? scale(waistPts.map(p => p.waist)) : null;
  const path = (arr, key, s) => arr.map((p, i) => `${i ? 'L' : 'M'}${x(p.date).toFixed(1)},${s.y(p[key]).toFixed(1)}`).join(' ');
  const shown = active != null ? points[active] : points[points.length - 1];

  return (
    <figure className="space-y-2">
      <figcaption className="flex items-baseline justify-between text-xs">
        <span className="font-bold text-ink">Weight & waist (4 weeks)</span>
        <span className="text-muted font-mono">{shortDate(shown.date)}: {shown.weight} kg{shown.waist != null ? ` · ${shown.waist} cm` : ''}</span>
      </figcaption>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-36" role="img" aria-label="Weight and waist trend over the last 4 weeks">
        <text x={L - 4} y={w.y(w.hi) + 8} fontSize="9" fill="var(--color-brand)" textAnchor="end">{w.hi.toFixed(1)}</text>
        <text x={L - 4} y={w.y(w.lo)} fontSize="9" fill="var(--color-brand)" textAnchor="end">{w.lo.toFixed(1)}</text>
        {wa && <text x={W - R + 4} y={wa.y(wa.hi) + 8} fontSize="9" fill="var(--color-data-carbs)">{wa.hi.toFixed(1)}</text>}
        {wa && <text x={W - R + 4} y={wa.y(wa.lo)} fontSize="9" fill="var(--color-data-carbs)">{wa.lo.toFixed(1)}</text>}
        <line x1={L} x2={W - R} y1={H - B} y2={H - B} stroke="var(--color-line)" />
        {wa && <path d={path(waistPts, 'waist', wa)} fill="none" stroke="var(--color-data-carbs)" strokeWidth="2" strokeDasharray="5 3" />}
        <path d={path(points, 'weight', w)} fill="none" stroke="var(--color-brand)" strokeWidth="2.5" />
        {points.map((p, i) => (
          <g key={p.date + i} tabIndex={0} onMouseEnter={() => setActive(i)} onMouseLeave={() => setActive(null)} onFocus={() => setActive(i)} onBlur={() => setActive(null)} className="outline-none">
            <circle cx={x(p.date)} cy={w.y(p.weight)} r="10" fill="transparent" />
            <circle cx={x(p.date)} cy={w.y(p.weight)} r={active === i ? 5 : 3.5} fill="var(--color-brand)" stroke="var(--color-surface)" strokeWidth="1.5" />
            <text x={x(p.date)} y={H - 6} fontSize="9" fill="var(--color-muted)" textAnchor="middle">{shortDate(p.date)}</text>
          </g>
        ))}
      </svg>
      <div className="flex gap-3 text-[10px] text-muted">
        <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-brand" /> Weight (kg)</span>
        {wa && <span className="flex items-center gap-1"><span className="w-3 border-t border-dashed border-data-carbs" /> Waist (cm)</span>}
      </div>
    </figure>
  );
}

/** Thin progress bar used in metric cards. */
export function ProgressBar({ pct, color = 'bg-brand' }) {
  const v = Math.max(0, Math.min(100, pct ?? 0));
  return (
    <div className="h-1.5 w-full bg-subtle rounded-sm overflow-hidden" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(v)}>
      <div className={`h-full ${color} rounded-sm transition-colors duration-150`} style={{ width: `${v}%` }} />
    </div>
  );
}
