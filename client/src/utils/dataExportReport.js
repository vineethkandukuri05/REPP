// Readable, printable summary of a REPP personal-data export (the JSON from GET /api/profile/export).

const esc = (v) => String(v ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;');

const val = (v, unit) => {
  if (v === null || v === undefined || v === '') return 'n/a';
  if (Array.isArray(v)) return v.length ? v.map(esc).join(', ') : 'n/a';
  return `${esc(v)}${unit ? ` ${unit}` : ''}`;
};

const dateTime = (iso) => {
  if (!iso) return 'n/a';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? esc(iso) : d.toLocaleString();
};

function table(headers, rows, emptyText) {
  if (!rows.length) return `<p class="muted">${esc(emptyText)}</p>`;
  return `<table><thead><tr>${headers.map(h => `<th>${esc(h)}</th>`).join('')}</tr></thead>
<tbody>${rows.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
}

function fields(pairs) {
  return `<dl>${pairs.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${v}</dd></div>`).join('')}</dl>`;
}

export function dataExportHtml(data) {
  const p = data.profile || {};
  const count = (arr) => (Array.isArray(arr) ? arr.length : 0);

  const counts = [
    ['Measurements', count(data.measurements)],
    ['Workout sessions', count(data.workoutSessions)],
    ['Meal logs', count(data.mealLogs)],
    ['Water logs', count(data.waterLogs)],
    ['BodyVision scans', count(data.bodyVisionReports)],
    ['Diet plans', count(data.mealPlans)],
    ['Workout plans', count(data.workoutPlans)],
    ['Grocery items', count(data.groceryItems)],
    ['Badges earned', count(data.badges)],
    ['Coach conversations', count(data.conversations)]
  ];

  return `<!doctype html>
<html><head><meta charset="utf-8">
<title>REPP Personal Data - ${esc(p.name || data.email)}</title>
<style>
  @page { size: A4; margin: 14mm; }
  * { box-sizing: border-box; }
  body { font-family: Arial, Helvetica, sans-serif; color: #1C1C1C; margin: 0; font-size: 11px; line-height: 1.45; }
  header { display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 3px solid #2F4F3E; padding-bottom: 8px; margin-bottom: 14px; }
  .brand { font-weight: 900; font-size: 20px; } .brand span { color: #2F4F3E; }
  h1 { font-size: 17px; margin: 0; }
  h2 { font-size: 12px; text-transform: uppercase; letter-spacing: .5px; color: #4A4A4A; margin: 18px 0 6px; border-bottom: 1px solid #E2E0DB; padding-bottom: 3px; break-after: avoid; }
  .meta { text-align: right; color: #4A4A4A; font-size: 10px; }
  .muted { color: #6B6B6B; }
  dl { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px 16px; margin: 0; }
  dt { font-size: 9px; text-transform: uppercase; color: #6B6B6B; font-weight: 700; }
  dd { margin: 0; }
  .counts { display: grid; grid-template-columns: repeat(5, 1fr); gap: 6px; }
  .count { border: 1px solid #E2E0DB; border-radius: 2px; padding: 6px 8px; }
  .count b { display: block; font-size: 15px; }
  table { width: 100%; border-collapse: collapse; }
  th, td { text-align: left; padding: 4px 6px; border-bottom: 1px solid #E2E0DB; vertical-align: top; }
  th { background: #EFEDE8; font-size: 9px; text-transform: uppercase; color: #4A4A4A; }
  tr { break-inside: avoid; }
  td:first-child { white-space: nowrap; }
  footer { margin-top: 18px; font-size: 9px; color: #6B6B6B; border-top: 1px solid #E2E0DB; padding-top: 6px; }
</style></head>
<body>
  <header>
    <div><div class="brand">REPP<span>.</span></div><h1>Personal Data Summary</h1></div>
    <div class="meta">Exported ${dateTime(data.exportedAt)}<br>Account created ${dateTime(data.createdAt)}</div>
  </header>

  <h2>Account</h2>
  ${fields([['Name', val(p.name)], ['Email', val(data.email)], ['Account ID', val(data.id)]])}

  <h2>Records Stored</h2>
  <div class="counts">${counts.map(([k, n]) => `<div class="count"><b>${n}</b>${esc(k)}</div>`).join('')}</div>

  <h2>Body & Health</h2>
  ${fields([
    ['Sex', val(p.sex)], ['Age', val(p.age)], ['Height', val(p.height, 'cm')],
    ['Weight', val(p.weight, 'kg')], ['Target weight', val(p.targetWeight, 'kg')], ['Experience', val(p.experienceLevel)],
    ['Waist', val(p.waist, 'cm')], ['Chest', val(p.chest, 'cm')], ['Arms', val(p.arms, 'cm')],
    ['Activity level', val(p.activityLevel)], ['Sleep', val(p.sleepDuration)], ['Stress', val(p.stressLevel)],
    ['Injuries', val(p.injuries)], ['Health conditions', val(p.healthConditions)], ['Primary goal', val(p.primaryGoal)]
  ])}

  <h2>Nutrition Settings</h2>
  ${fields([
    ['Diet preference', val(p.dietPreference)], ['Meals per day', val(p.mealsPerDay)], ['Daily budget', val(p.dailyBudget)],
    ['Calorie target', val(p.dailyCalorieTarget, 'kcal')], ['Protein target', val(p.proteinTarget, 'g')], ['Carbs / fats target', `${val(p.carbsTarget, 'g')} / ${val(p.fatsTarget, 'g')}`],
    ['Water target', val(p.waterTarget, 'ml')], ['Allergies', val(p.foodAllergies)], ['Disliked foods', val(p.dislikedFoods)]
  ])}

  <h2>Training Settings</h2>
  ${fields([
    ['Location', val(p.workoutLocation)], ['Split', val(p.workoutSplit)], ['Days per week', val(p.workoutDaysPerWeek)],
    ['Session length', val(p.workoutDuration, 'min')], ['Equipment', val(p.availableEquipment)], ['Excluded exercises', val(p.excludedExercises)],
    ['Current streak', val(p.streakDays, p.streakDays === 1 ? 'day' : 'days')], ['Total workouts', val(p.totalWorkoutsCompleted)]
  ])}

  <h2>Measurement History</h2>
  ${table(['Date', 'Weight', 'Waist', 'Chest', 'Arms'],
    (data.measurements || []).map(m => [val(m.date), val(m.weight, 'kg'), val(m.waist, 'cm'), val(m.chest, 'cm'), val(m.arms, 'cm')]),
    'No measurements recorded.')}

  <h2>Workout Sessions</h2>
  ${table(['Date', 'Session', 'Duration', 'Exercises'],
    (data.workoutSessions || []).map(w => [val(w.date), val(w.dayName), val(w.durationMinutes, 'min'),
      val(Array.isArray(w.completedExercises) ? w.completedExercises.map(e => e?.name).filter(Boolean) : [])]),
    'No workout sessions logged.')}

  <h2>Meal Logs</h2>
  ${table(['Date', 'Meal', 'Category', 'Calories', 'P / C / F (g)', 'Source'],
    (data.mealLogs || []).map(m => [val(m.date), val(m.name), val(m.category), val(m.calories, 'kcal'),
      `${val(m.protein)} / ${val(m.carbs)} / ${val(m.fats)}`, val(m.source)]),
    'No meals logged.')}

  <h2>BodyVision Scans</h2>
  ${table(['Date', 'Body-fat estimate', 'Photos stored', 'Notes'],
    (data.bodyVisionReports || []).map(r => [val(r.date), val(r.estimatedBodyFatRange),
      String([r.frontPhotoPath, r.sidePhotoPath, r.backPhotoPath].filter(Boolean).length), val(r.fatDistribution)]),
    'No BodyVision scans.')}

  <h2>Badges</h2>
  ${table(['Badge', 'Description', 'Unlocked'],
    (data.badges || []).map(b => [`${esc(b.badge?.icon || '')} ${val(b.badge?.title)}`, val(b.badge?.desc), dateTime(b.unlockedAt)]),
    'No badges earned yet.')}

  <footer>
    This summary covers the main records in your account. The JSON export contains every field, including diet plans,
    workout plans, grocery items, adaptive reviews and coach conversations. Photos are not included in either file.
  </footer>
</body></html>`;
}
