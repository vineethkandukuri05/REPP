import React from 'react';

const MACROS = [
  { key: 'calories', label: 'Calories', unit: 'kcal', bar: 'bg-surface', text: 'text-ink' },
  { key: 'protein', label: 'Protein', unit: 'g', bar: 'bg-brand', text: 'text-brand' },
  { key: 'carbs', label: 'Carbs', unit: 'g', bar: 'bg-data-carbs', text: 'text-data-carbs' },
  { key: 'fats', label: 'Fats', unit: 'g', bar: 'bg-warning', text: 'text-warning' }
];

const fmt = (n) => Math.round(n).toLocaleString();

function MacroBar({ macro, eaten, target, adding = 0 }) {
  const total = eaten + adding;
  const pctEaten = target > 0 ? Math.min(100, (eaten / target) * 100) : 0;
  const pctAdding = target > 0 ? Math.max(0, Math.min(100, (total / target) * 100) - pctEaten) : 0;
  const left = target - total;
  const over = left < 0;

  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-2 text-xs">
        <span className="font-bold text-ink">{macro.label}</span>
        <span className="font-mono text-muted">
          <span className={`font-bold ${over ? 'text-danger' : macro.text}`}>{fmt(total)}</span> / {fmt(target)} {macro.unit}
        </span>
      </div>
      <div
        className="h-2 w-full bg-subtle rounded-sm overflow-hidden flex"
        role="progressbar"
        aria-label={`${macro.label}: ${fmt(total)} of ${fmt(target)} ${macro.unit}`}
        aria-valuemin={0}
        aria-valuemax={target}
        aria-valuenow={Math.round(total)}
      >
        <div className={`h-full ${over ? 'bg-danger' : macro.bar}`} style={{ width: `${pctEaten}%` }} />
        {adding > 0 && <div className={`h-full ${over ? 'bg-subtle' : `${macro.bar} opacity-40`}`} style={{ width: `${pctAdding}%` }} />}
      </div>
      <div className={`text-[11px] font-semibold ${over ? 'text-danger' : 'text-muted'}`}>
        {over ? `${fmt(-left)} ${macro.unit} over target` : `${fmt(left)} ${macro.unit} left`}
      </div>
    </div>
  );
}

/** Today's intake vs targets, with where the numbers came from. */
export function TodayVsTarget({ summary }) {
  if (!summary) return null;
  const { consumed, targets, breakdown, planMealsLeft } = summary;
  const nextPlanned = planMealsLeft?.[0];

  return (
    <div className="bg-surface border border-line rounded-sm p-6 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <h3 className="text-base font-bold text-ink flex items-center gap-2">
           Today vs Your REPP Targets
        </h3>
        <span className="text-[11px] text-muted">
          Logged meals {fmt(breakdown.fromLogs.calories)} kcal · Diet plan meals eaten {fmt(breakdown.fromPlan.calories)} kcal
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {MACROS.map(m => (
          <MacroBar key={m.key} macro={m} eaten={consumed[m.key]} target={targets[m.key]} />
        ))}
      </div>

      {nextPlanned && (
        <p className="text-[11px] text-muted border-t border-line pt-3">
          Next in your diet plan: <strong className="text-ink">{nextPlanned.category}: {nextPlanned.name}</strong>{' '}
          ({fmt(nextPlanned.calories)} kcal, {fmt(nextPlanned.protein)} g protein)
        </p>
      )}
    </div>
  );
}

/** Shows what logging `meal` would do to today's totals. */
export function MealImpact({ summary, meal }) {
  if (!summary || !meal) return null;
  const { consumed, targets } = summary;
  const after = (k) => consumed[k] + (meal[k] || 0);
  const overList = MACROS.filter(m => m.key !== 'protein' && after(m.key) > targets[m.key]);
  const pctOfDay = targets.calories > 0 ? Math.round(((meal.calories || 0) / targets.calories) * 100) : 0;
  const caloriesLeft = targets.calories - after('calories');
  const proteinLeft = targets.protein - after('protein');

  return (
    <div className="bg-subtle border border-line rounded-sm p-4 space-y-4">
      <div className="text-xs font-bold text-ink flex items-center gap-2">
         If you log this meal
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {MACROS.map(m => (
          <MacroBar key={m.key} macro={m} eaten={consumed[m.key]} target={targets[m.key]} adding={meal[m.key] || 0} />
        ))}
      </div>

      <p className="text-xs text-muted leading-relaxed">
        This meal is <strong className="text-ink">{pctOfDay}%</strong> of your daily calories.{' '}
        {caloriesLeft >= 0
          ? <>You'd have <strong className="text-ink">{fmt(caloriesLeft)} kcal</strong> left today</>
          : <>You'd be <strong className="text-danger">{fmt(-caloriesLeft)} kcal over</strong> today's target</>}
        {proteinLeft > 0
          ? <> and still need <strong className="text-brand">{fmt(proteinLeft)} g protein</strong>.</>
          : <> and you'd hit your protein target.</>}
      </p>

      {overList.length > 0 && (
        <div className="flex items-start gap-2 text-[11px] text-warning bg-subtle border border-warning rounded-sm p-2.5">
          
          <span>
            This would take you over your {overList.map(m => m.label.toLowerCase()).join(' and ')} target for today.
            Consider a smaller portion or a lighter next meal.
          </span>
        </div>
      )}
    </div>
  );
}
