// Builds a printable progress report and opens the browser's print dialog,
// where the user can choose "Save as PDF". Uses a hidden iframe, so no popup
// blocker interferes and no PDF library is needed.

function esc(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function fmt(value, unit) {
  return value == null ? 'n/a' : `${value}${unit ? ` ${unit}` : ''}`;
}

function signed(value, unit) {
  if (value == null) return 'n/a';
  return `${value > 0 ? '+' : ''}${value} ${unit}`;
}


const UNIT_TITLES = { month: 'Month-by-Month Breakdown', week: 'Week-by-Week Breakdown', day: 'Day-by-Day Breakdown' };

const dateNum = (iso) => new Date(`${iso}T00:00:00`).getTime();
const shortDate = (iso) => new Date(`${iso}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

function niceTicks(min, max, count = 4) {
  if (min === max) { min -= 1; max += 1; }
  const pad = (max - min) * 0.12;
  const lo = min - pad;
  const hi = max + pad;
  return Array.from({ length: count + 1 }, (_, i) => lo + ((hi - lo) * i) / count);
}

/** Weight (left axis) and waist (right axis) over the report period, with period boundaries. */
function trendChartSvg(report) {
  // Start the line from the last weigh-in before the period (pinned to the period start),
  // so short periods with a single weigh-in still show the change.
  const inPeriod = (report.measurements || []).filter(m => m.weight != null);
  const pts = report.baseline?.weight != null
    ? [{ ...report.baseline, date: report.period.start, isBaseline: true }, ...inPeriod]
    : inPeriod;
  if (pts.length < 2) return '<p class="muted">Log at least two weigh-ins to see a trend chart.</p>';

  const W = 700, H = 240, L = 46, R = 46, T = 16, B = 34;
  const x0 = dateNum(report.period.start), x1 = dateNum(report.period.end);
  const x = (iso) => L + ((dateNum(iso) - x0) / Math.max(1, x1 - x0)) * (W - L - R);

  const wVals = pts.map(p => p.weight);
  const wTicks = niceTicks(Math.min(...wVals), Math.max(...wVals));
  const yW = (v) => T + (1 - (v - wTicks[0]) / (wTicks[wTicks.length - 1] - wTicks[0])) * (H - T - B);
  // Enough decimals that neighbouring tick labels never look identical.
  const tickText = (ticks, t) => t.toFixed(ticks[1] - ticks[0] < 0.2 ? 2 : 1);

  const waistPts = pts.filter(p => p.waist != null);
  const aTicks = waistPts.length ? niceTicks(Math.min(...waistPts.map(p => p.waist)), Math.max(...waistPts.map(p => p.waist))) : null;
  const yA = aTicks ? (v) => T + (1 - (v - aTicks[0]) / (aTicks[aTicks.length - 1] - aTicks[0])) * (H - T - B) : null;

  const line = (arr, key, y) => arr.map((p, i) => `${i ? 'L' : 'M'}${x(p.date).toFixed(1)},${y(p[key]).toFixed(1)}`).join(' ');

  const periods = report.breakdown?.periods || [];
  const boundaries = report.breakdown?.unit === 'day' ? [] : periods.slice(1).map(p => p.start);
  const labelEvery = Math.max(1, Math.ceil(periods.length / 8));

  return `<svg viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="Weight and waist trend">
    ${wTicks.map(t => `<line x1="${L}" x2="${W - R}" y1="${yW(t)}" y2="${yW(t)}" stroke="#E2E0DB"/>
      <text x="${L - 6}" y="${yW(t) + 3}" font-size="9" fill="#2F4F3E" text-anchor="end">${tickText(wTicks, t)}</text>`).join('')}
    ${aTicks ? aTicks.map(t => `<text x="${W - R + 6}" y="${yA(t) + 3}" font-size="9" fill="#3D5A80">${tickText(aTicks, t)}</text>`).join('') : ''}
    ${boundaries.map(d => `<line x1="${x(d)}" x2="${x(d)}" y1="${T}" y2="${H - B}" stroke="#C9C6BF" stroke-dasharray="3 3"/>`).join('')}
    ${periods.map((p, i) => i % labelEvery === 0 || i === periods.length - 1
      ? `<text x="${((x(p.start) + x(p.end)) / 2).toFixed(1)}" y="${H - B + 14}" font-size="9" fill="#6B6B6B" text-anchor="middle">${esc(p.label)}</text>
         <text x="${((x(p.start) + x(p.end)) / 2).toFixed(1)}" y="${H - B + 25}" font-size="8" fill="#6B6B6B" text-anchor="middle">${esc(shortDate(p.start))}</text>`
      : '').join('')}
    ${yA && waistPts.length > 1 ? `<path d="${line(waistPts, 'waist', yA)}" fill="none" stroke="#3D5A80" stroke-width="2" stroke-dasharray="5 3"/>` : ''}
    <path d="${line(pts, 'weight', yW)}" fill="none" stroke="#2F4F3E" stroke-width="2.5"/>
    ${pts.map(p => `<circle cx="${x(p.date).toFixed(1)}" cy="${yW(p.weight).toFixed(1)}" r="2.6" fill="${p.isBaseline ? '#fff' : '#2F4F3E'}" stroke="#2F4F3E" stroke-width="1.2"/>`).join('')}
    ${pts[0]?.isBaseline ? `<text x="${(x(pts[0].date) + 5).toFixed(1)}" y="${(yW(pts[0].weight) - 6).toFixed(1)}" font-size="8" fill="#6B6B6B">start ${esc(pts[0].weight)} kg (${esc(shortDate(report.baseline.date))})</text>` : ''}
    <text x="${L}" y="10" font-size="9" fill="#2F4F3E" font-weight="bold">Weight (kg)</text>
    ${aTicks ? `<text x="${W - R}" y="10" font-size="9" fill="#3D5A80" font-weight="bold" text-anchor="end">Waist (cm, dashed)</text>` : ''}
  </svg>`;
}

/** Bar chart of one value per period. Bars grow up/down from zero (or up from 0 for totals). */
function barChartSvg({ periods, value, format, color, target, ariaLabel }) {
  const vals = periods.map(value);
  if (vals.every(v => v == null)) return '<p class="muted">Not enough data in this period for this chart.</p>';

  const W = 700, H = 200, L = 46, R = 16, T = 18, B = 34;
  const nums = vals.filter(v => v != null).concat(target != null ? [target] : []);
  let lo = Math.min(0, ...nums), hi = Math.max(0, ...nums);
  if (lo === hi) hi = lo + 1;
  const span = hi - lo;
  lo -= lo < 0 ? span * 0.15 : 0;
  hi += hi > 0 ? span * 0.15 : 0;
  const y = (v) => T + (1 - (v - lo) / (hi - lo)) * (H - T - B);
  const slot = (W - L - R) / periods.length;
  const bw = Math.min(56, slot * 0.6);

  return `<svg viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="${esc(ariaLabel)}">
    <line x1="${L}" x2="${W - R}" y1="${y(0)}" y2="${y(0)}" stroke="#6B6B6B"/>
    ${target != null ? `<line x1="${L}" x2="${W - R}" y1="${y(target)}" y2="${y(target)}" stroke="#A3362B" stroke-dasharray="4 3"/>
      <text x="${W - R}" y="${y(target) - 4}" font-size="9" fill="#A3362B" text-anchor="end">Target ${esc(format(target))}</text>` : ''}
    ${periods.map((p, i) => {
      const v = vals[i];
      const cx = L + slot * i + slot / 2;
      const label = `<text x="${cx}" y="${H - B + 14}" font-size="9" fill="#6B6B6B" text-anchor="middle">${esc(p.label)}</text>
        <text x="${cx}" y="${H - B + 25}" font-size="8" fill="#6B6B6B" text-anchor="middle">${esc(shortDate(p.start))}</text>`;
      if (v == null) return `${label}<text x="${cx}" y="${y(0) - 4}" font-size="9" fill="#6B6B6B" text-anchor="middle">n/a</text>`;
      const top = Math.min(y(v), y(0));
      const h = Math.max(1, Math.abs(y(v) - y(0)));
      const ty = v < 0 ? top + h + 11 : top - 4;
      return `<rect x="${cx - bw / 2}" y="${top}" width="${bw}" height="${h}" rx="3" fill="${color(v)}"/>
        <text x="${cx}" y="${ty}" font-size="9.5" font-weight="bold" fill="#1C1C1C" text-anchor="middle">${esc(format(v))}</text>${label}`;
    }).join('')}
  </svg>`;
}

function breakdownSection(report) {
  const b = report.breakdown;
  if (!b?.periods?.length) return '';
  const losing = /loss|cut/i.test(report.profile?.goal || '');
  const goodColor = '#2F4F3E', badColor = '#8A5A12';
  const weightColor = (v) => (v === 0 ? '#6B6B6B' : (v < 0) === losing ? goodColor : badColor);

  const chart = b.unit === 'day'
    ? `<h3>Daily calories vs target</h3>${barChartSvg({
        periods: b.periods,
        value: p => p.avgCalories,
        format: v => `${Math.round(v)}`,
        color: v => (report.profile?.dailyCalorieTarget && v > report.profile.dailyCalorieTarget * 1.05 ? badColor : goodColor),
        target: report.profile?.dailyCalorieTarget ?? null,
        ariaLabel: 'Calories per day'
      })}`
    : `<h3>Weight change per ${b.unit}</h3>${barChartSvg({
        periods: b.periods,
        value: p => p.weight.delta,
        format: v => `${v > 0 ? '+' : ''}${v} kg`,
        color: weightColor,
        target: null,
        ariaLabel: `Weight change per ${b.unit}`
      })}`;

  const rows = b.periods.map(p => `<tr>
      <td><strong>${esc(p.label)}</strong><div class="muted small">${esc(p.range)}</div></td>
      <td>${p.weight.start != null ? `${fmt(p.weight.start)} → ${fmt(p.weight.end)} kg` : '<span class="muted">no weigh-in</span>'}</td>
      <td class="num ${p.weight.delta < 0 ? 'down' : p.weight.delta > 0 ? 'up' : ''}">${signed(p.weight.delta, 'kg')}</td>
      <td class="num">${signed(p.waist.delta, 'cm')}</td>
      <td class="num">${p.workouts}</td>
      <td class="num">${fmt(p.avgCalories)}</td>
      <td class="num">${fmt(p.avgProtein, 'g')}</td>
      <td class="num">${p.daysLogged}/${p.days}</td>
    </tr>`).join('');

  return `<section class="keep">
    <h2>${UNIT_TITLES[b.unit]}</h2>
    ${chart}
    <table class="breakdown">
      <tr><th>Period</th><th>Weight</th><th class="num">Change</th><th class="num">Waist</th><th class="num">Workouts</th><th class="num">Avg kcal</th><th class="num">Avg protein</th><th class="num">Days logged</th></tr>
      ${rows}
    </table>
    <p class="muted small">Each period's change is measured from the last weigh-in before it, so the changes add up to the overall change. Calories and protein are averages over days with logged meals.</p>
  </section>`;
}

export function reportHtml(report) {
  // The 6-month report summarises by month; listing every weekly weigh-in there is too long.
  const showMeasurementLog = (report.period?.days ?? 0) < 180;
  const rows = (report.measurements || [])
    .map(m => `<tr><td>${esc(m.date)}</td><td>${fmt(m.weight, 'kg')}</td><td>${fmt(m.waist, 'cm')}</td><td>${fmt(m.chest, 'cm')}</td><td>${fmt(m.arms, 'cm')}</td></tr>`)
    .join('');

  const stats = [
    ['Weight change', signed(report.weight?.delta, 'kg'), report.weight?.start != null ? `${report.weight.start} → ${report.weight.end} kg` : 'Needs 2+ weigh-ins'],
    ['Waist change', signed(report.waist?.delta, 'cm'), report.waist?.start != null ? `${report.waist.start} → ${report.waist.end} cm` : 'Needs 2+ waist logs'],
    ['Workouts', String(report.workouts?.inPeriod ?? 0), `${report.workouts?.allTime ?? 0} all-time`],
    ['Protein adherence', report.nutrition?.proteinAdherence != null ? `${report.nutrition.proteinAdherence}%` : 'n/a', report.profile?.proteinTarget ? `target ${report.profile.proteinTarget} g/day` : '']
  ];

  return `<!doctype html>
<html><head><meta charset="utf-8">
<title>REPP Progress Report - ${esc(report.profile?.name)} - ${esc(report.period?.end)}</title>
<style>
  @page { size: A4; margin: 16mm; }
  * { box-sizing: border-box; }
  body { font-family: Arial, Helvetica, sans-serif; color: #1C1C1C; margin: 0; font-size: 12px; line-height: 1.5; }
  .brand { font-weight: 900; font-size: 22px; letter-spacing: -0.5px; }
  .brand span { color: #2F4F3E; }
  header { display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 3px solid #2F4F3E; padding-bottom: 8px; margin-bottom: 16px; }
  header .meta { text-align: right; color: #4A4A4A; font-size: 11px; }
  h1 { font-size: 18px; margin: 0 0 4px; }
  h2 { font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; color: #4A4A4A; margin: 20px 0 8px; }
  .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
  .card { border: 1px solid #E2E0DB; border-radius: 2px; padding: 10px; }
  .card .label { font-size: 10px; color: #6B6B6B; text-transform: uppercase; font-weight: 700; }
  .card .value { font-size: 18px; font-weight: 800; margin-top: 2px; }
  .card .sub { font-size: 10px; color: #6B6B6B; }
  ul { margin: 0; padding-left: 18px; }
  li { margin-bottom: 4px; }
  table { width: 100%; border-collapse: collapse; }
  th, td { text-align: left; padding: 6px 8px; border-bottom: 1px solid #E2E0DB; }
  th { background: #EFEDE8; font-size: 10px; text-transform: uppercase; color: #4A4A4A; }
  .muted { color: #6B6B6B; }
  h3 { font-size: 11px; color: #4A4A4A; margin: 12px 0 4px; font-weight: 700; }
  .num { text-align: right; white-space: nowrap; }
  .small { font-size: 10px; }
  .down { color: #2F4F3E; font-weight: 700; }
  .up { color: #8A5A12; font-weight: 700; }
  table.breakdown td { vertical-align: top; }
  .keep { break-inside: avoid; }
  svg { display: block; margin: 4px 0 8px; }
  html, body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  footer { margin-top: 24px; font-size: 10px; color: #6B6B6B; border-top: 1px solid #E2E0DB; padding-top: 8px; }
</style></head>
<body>
  <header>
    <div>
      <div class="brand">REPP<span>.</span></div>
      <h1>Progress Report</h1>
      <div class="muted">${esc(report.profile?.name)}${report.profile?.goal ? ` · ${esc(report.profile.goal)}` : ''}</div>
    </div>
    <div class="meta">
      Period: ${esc(report.period?.start)} to ${esc(report.period?.end)} (${esc(report.period?.days)} days)<br>
      Generated ${esc(report.generatedDate)}
    </div>
  </header>

  <div class="grid">
    ${stats.map(([label, value, sub]) => `<div class="card"><div class="label">${esc(label)}</div><div class="value">${esc(value)}</div><div class="sub">${esc(sub)}</div></div>`).join('')}
  </div>

  <h2>Summary</h2>
  <ul>${(report.highlights || []).map(h => `<li>${esc(h)}</li>`).join('')}</ul>

  <section class="keep">
    <h2>Weight &amp; Waist Trend</h2>
    ${trendChartSvg(report)}
  </section>

  ${breakdownSection(report)}

  <h2>Current Profile</h2>
  <table>
    <tr><th>Current weight</th><th>Target weight</th><th>Waist</th><th>Daily calories target</th><th>Streak</th></tr>
    <tr>
      <td>${fmt(report.profile?.currentWeight, 'kg')}</td>
      <td>${fmt(report.profile?.targetWeight, 'kg')}</td>
      <td>${fmt(report.profile?.currentWaist, 'cm')}</td>
      <td>${fmt(report.profile?.dailyCalorieTarget, 'kcal')}</td>
      <td>${fmt(report.profile?.streakDays, report.profile?.streakDays === 1 ? 'day' : 'days')}</td>
    </tr>
  </table>

  ${showMeasurementLog
    ? `<h2>Measurement Log</h2>
  ${rows
    ? `<table><tr><th>Date</th><th>Weight</th><th>Waist</th><th>Chest</th><th>Arms</th></tr>${rows}</table>`
    : '<p class="muted">No measurements logged in this period.</p>'}`
    : `<p class="muted small">This 6-month report shows month-by-month changes only. Choose 90D, 30D or 7D for individual weigh-ins.</p>`}

  <footer>
    Generated by REPP from your logged data. Body-fat figures are AI optical estimates, not clinical measurements.
    REPP is not a medical service; consult a qualified professional before major changes to diet or exercise.
  </footer>
</body></html>`;
}

// Prints an HTML document via a hidden iframe so the user can choose "Save as PDF".
export function printHtml(html) {
  const iframe = document.createElement('iframe');
  iframe.setAttribute('aria-hidden', 'true');
  Object.assign(iframe.style, { position: 'fixed', right: '0', bottom: '0', width: '0', height: '0', border: '0' });
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow.document;
  doc.open();
  doc.write(html);
  doc.close();

  const cleanup = () => setTimeout(() => iframe.remove(), 1000);
  iframe.contentWindow.addEventListener('afterprint', cleanup);

  // Give the iframe a moment to lay out before printing.
  setTimeout(() => {
    iframe.contentWindow.focus();
    iframe.contentWindow.print();
    // Fallback cleanup in browsers that don't fire afterprint.
    setTimeout(() => iframe.isConnected && iframe.remove(), 60000);
  }, 250);
}

export function printProgressReport(report) {
  printHtml(reportHtml(report));
}
