import React from 'react';

/**
 * CalorieRing Component
 * Displays a progress ring in the brand colour accent for calories,
 * and mini progress bars for Protein, Carbs, Fats.
 */
export default function CalorieRing({ target = 2200, consumed = 1680, protein = 122, proteinTarget = 155, carbs = 165, carbsTarget = 220, fats = 48, fatsTarget = 60 }) {
  const percentage = Math.min(Math.round((consumed / target) * 100), 100);
  const strokeDashoffset = 440 - (440 * percentage) / 100;
  const remaining = Math.max(target - consumed, 0);

  return (
    <div className="bg-surface border border-line rounded-sm p-6 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
      {/* Circle Ring */}
      <div className="relative flex items-center justify-center shrink-0">
        <svg className="w-44 h-44 -rotate-90">
          {/* Background circle */}
          <circle
            cx="88"
            cy="88"
            r="70"
            stroke="var(--color-subtle)"
            strokeWidth="12"
            fill="transparent"
          />
          {/* Progress circle */}
          <circle
            cx="88"
            cy="88"
            r="70"
            stroke="var(--color-brand)"
            strokeWidth="12"
            fill="transparent"
            strokeDasharray="440"
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-colors duration-150 ease-out"
          />
        </svg>

        {/* Center Content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-3xl font-bold text-ink tracking-tight">{consumed}</span>
          <span className="text-xs text-muted font-medium tracking-wide uppercase">/ {target} kcal</span>
          <span className="mt-1 text-[10px] font-bold text-brand bg-subtle px-2 py-0.5 rounded-sm border border-line-strong">
            {remaining} kcal left
          </span>
        </div>
      </div>

      {/* Macro Breakdown Bars */}
      <div className="flex-1 w-full space-y-4">
        <h4 className="text-sm font-semibold text-body tracking-wide flex items-center justify-between">
          <span>Daily Macro Targets</span>
          <span className="text-xs text-muted font-normal">{percentage}% Calorie Target Reached</span>
        </h4>

        {/* Protein Bar */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs font-semibold">
            <span className="text-body flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-brand"></span> Protein
            </span>
            <span className="text-muted">
              <strong className="text-ink">{protein}g</strong> / {proteinTarget}g
            </span>
          </div>
          <div className="w-full bg-subtle h-2.5 rounded-sm overflow-hidden border border-line">
            <div
              className="bg-brand h-full rounded-sm transition-colors duration-150"
              style={{ width: `${Math.min((protein / proteinTarget) * 100, 100)}%` }}
            ></div>
          </div>
        </div>

        {/* Carbs Bar */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs font-semibold">
            <span className="text-body flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-data-carbs"></span> Carbs
            </span>
            <span className="text-muted">
              <strong className="text-ink">{carbs}g</strong> / {carbsTarget}g
            </span>
          </div>
          <div className="w-full bg-subtle h-2.5 rounded-sm overflow-hidden border border-line">
            <div
              className="bg-data-carbs h-full rounded-sm transition-colors duration-150"
              style={{ width: `${Math.min((carbs / carbsTarget) * 100, 100)}%` }}
            ></div>
          </div>
        </div>

        {/* Fats Bar */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs font-semibold">
            <span className="text-body flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-warning"></span> Fats
            </span>
            <span className="text-muted">
              <strong className="text-ink">{fats}g</strong> / {fatsTarget}g
            </span>
          </div>
          <div className="w-full bg-subtle h-2.5 rounded-sm overflow-hidden border border-line">
            <div
              className="bg-warning h-full rounded-sm transition-colors duration-150"
              style={{ width: `${Math.min((fats / fatsTarget) * 100, 100)}%` }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
}
