import React from 'react';

/**
 * CalorieRing Component
 * Displays a sleek dark mode progress ring with neon lime accent for calories,
 * and mini progress bars for Protein, Carbs, Fats.
 */
export default function CalorieRing({ target = 2200, consumed = 1680, protein = 122, proteinTarget = 155, carbs = 165, carbsTarget = 220, fats = 48, fatsTarget = 60 }) {
  const percentage = Math.min(Math.round((consumed / target) * 100), 100);
  const strokeDashoffset = 440 - (440 * percentage) / 100;
  const remaining = Math.max(target - consumed, 0);

  return (
    <div className="bg-[#12141D] border border-[#2D3245] rounded-2xl p-6 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
      {/* Circle Ring */}
      <div className="relative flex items-center justify-center shrink-0">
        <svg className="w-44 h-44 transform -rotate-90">
          {/* Background circle */}
          <circle
            cx="88"
            cy="88"
            r="70"
            stroke="#191C28"
            strokeWidth="12"
            fill="transparent"
          />
          {/* Progress circle */}
          <circle
            cx="88"
            cy="88"
            r="70"
            stroke="#C6FF00"
            strokeWidth="12"
            fill="transparent"
            strokeDasharray="440"
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
        </svg>

        {/* Center Content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-3xl font-extrabold text-white tracking-tight">{consumed}</span>
          <span className="text-xs text-[#94A3B8] font-medium tracking-wide uppercase">/ {target} kcal</span>
          <span className="mt-1 text-[10px] font-bold text-[#C6FF00] bg-[#C6FF00]/10 px-2 py-0.5 rounded-full border border-[#C6FF00]/30">
            {remaining} kcal left
          </span>
        </div>
      </div>

      {/* Macro Breakdown Bars */}
      <div className="flex-1 w-full space-y-4">
        <h4 className="text-sm font-semibold text-[#E2E8F0] tracking-wide flex items-center justify-between">
          <span>Daily Macro Targets</span>
          <span className="text-xs text-[#94A3B8] font-normal">{percentage}% Calorie Target Reached</span>
        </h4>

        {/* Protein Bar */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs font-semibold">
            <span className="text-[#E2E8F0] flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#C6FF00]"></span> Protein
            </span>
            <span className="text-[#94A3B8]">
              <strong className="text-white">{protein}g</strong> / {proteinTarget}g
            </span>
          </div>
          <div className="w-full bg-[#191C28] h-2.5 rounded-full overflow-hidden border border-[#2D3245]/50">
            <div
              className="bg-[#C6FF00] h-full rounded-full transition-all duration-700"
              style={{ width: `${Math.min((protein / proteinTarget) * 100, 100)}%` }}
            ></div>
          </div>
        </div>

        {/* Carbs Bar */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs font-semibold">
            <span className="text-[#E2E8F0] flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400"></span> Carbs
            </span>
            <span className="text-[#94A3B8]">
              <strong className="text-white">{carbs}g</strong> / {carbsTarget}g
            </span>
          </div>
          <div className="w-full bg-[#191C28] h-2.5 rounded-full overflow-hidden border border-[#2D3245]/50">
            <div
              className="bg-cyan-400 h-full rounded-full transition-all duration-700"
              style={{ width: `${Math.min((carbs / carbsTarget) * 100, 100)}%` }}
            ></div>
          </div>
        </div>

        {/* Fats Bar */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs font-semibold">
            <span className="text-[#E2E8F0] flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span> Fats
            </span>
            <span className="text-[#94A3B8]">
              <strong className="text-white">{fats}g</strong> / {fatsTarget}g
            </span>
          </div>
          <div className="w-full bg-[#191C28] h-2.5 rounded-full overflow-hidden border border-[#2D3245]/50">
            <div
              className="bg-amber-400 h-full rounded-full transition-all duration-700"
              style={{ width: `${Math.min((fats / fatsTarget) * 100, 100)}%` }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
}
