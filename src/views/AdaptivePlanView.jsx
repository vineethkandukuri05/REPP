import React, { useState } from 'react';
import MedicalDisclaimer from '../components/MedicalDisclaimer';
import {
  Sliders,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  ArrowRight,
  RefreshCw,
  Award,
  ChevronRight
} from 'lucide-react';

export default function AdaptivePlanView({ planData, onApplyPlan }) {
  const [isApplied, setIsApplied] = useState(false);

  const handleApply = () => {
    setIsApplied(true);
    if (onApplyPlan) onApplyPlan();
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="bg-[#12141D] border border-[#2D3245] rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#C6FF00]/10 text-[#C6FF00] border border-[#C6FF00]/30 text-xs font-bold uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5" /> 7-Day Feedback Loop
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">Adaptive Weekly Plan Review</h2>
          <p className="text-xs sm:text-sm text-[#94A3B8] mt-1">
            REPP analyzes actual adherence and body metrics to adjust next week's diet & training volume.
          </p>
        </div>

        <button
          onClick={handleApply}
          disabled={isApplied}
          className={`px-6 py-3 rounded-xl font-extrabold text-xs shadow transition cursor-pointer flex items-center gap-2 ${
            isApplied ? 'bg-emerald-500 text-black' : 'bg-[#C6FF00] hover:bg-[#B5F500] text-black lime-glow'
          }`}
        >
          {isApplied ? <CheckCircle2 className="w-4 h-4" /> : <Sliders className="w-4 h-4" />}
          <span>{isApplied ? "Next Week's Plan Applied!" : "Apply Next Week's Plan"}</span>
        </button>
      </div>

      {/* Review Banner Notice */}
      <div className="p-4 bg-[#191C28] border border-[#2D3245] rounded-2xl flex items-center gap-3 text-xs text-[#94A3B8]">
        <AlertCircle className="w-4 h-4 text-[#C6FF00] shrink-0" />
        <span>
          <strong className="text-white">Recommendation Notice:</strong> These adjustments are calculated recommendations based on your week 4 logged data. You can review and modify any parameter before finalizing.
        </span>
      </div>

      {/* Adherence Score Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#12141D] border border-[#C6FF00]/40 rounded-3xl p-6 text-center flex flex-col justify-center space-y-2 lime-glow">
          <span className="text-xs font-bold text-[#94A3B8] uppercase">Week 4 Adherence Score</span>
          <div className="text-5xl font-black text-[#C6FF00]">{planData.adherenceScore}%</div>
          <span className="text-xs text-white font-semibold">High Program Alignment</span>
        </div>

        <div className="md:col-span-2 bg-[#12141D] border border-[#2D3245] rounded-3xl p-6 space-y-3">
          <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">AI Executive Review</h3>
          <p className="text-xs text-[#94A3B8] leading-relaxed">
            {planData.summaryText}
          </p>
          <div className="pt-2 flex flex-wrap gap-2 text-[11px] font-mono text-[#C6FF00]">
            <span className="bg-[#191C28] px-2.5 py-1 rounded border border-[#2D3245]">Protein: 94%</span>
            <span className="bg-[#191C28] px-2.5 py-1 rounded border border-[#2D3245]">Workouts: 4/4</span>
            <span className="bg-[#191C28] px-2.5 py-1 rounded border border-[#2D3245]">Waist Delta: -0.5 cm</span>
          </div>
        </div>
      </div>

      {/* Breakdown: What Went Well vs Areas for Improvement */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* What Went Well */}
        <div className="bg-[#12141D] border border-emerald-500/30 rounded-3xl p-6 space-y-4">
          <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm uppercase tracking-wider">
            <CheckCircle2 className="w-4 h-4" /> What Went Well
          </div>
          <ul className="space-y-2.5 text-xs text-[#94A3B8]">
            {planData.whatWentWell.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2 bg-[#191C28] p-3 rounded-xl border border-[#2D3245]">
                <span className="text-emerald-400 font-bold">✓</span>
                <span className="text-white">{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Areas for Improvement */}
        <div className="bg-[#12141D] border border-amber-500/30 rounded-3xl p-6 space-y-4">
          <div className="flex items-center gap-2 text-amber-400 font-bold text-sm uppercase tracking-wider">
            <AlertCircle className="w-4 h-4" /> Areas for Improvement
          </div>
          <ul className="space-y-2.5 text-xs text-[#94A3B8]">
            {planData.areasForImprovement.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2 bg-[#191C28] p-3 rounded-xl border border-[#2D3245]">
                <span className="text-amber-400 font-bold">!</span>
                <span className="text-white">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Suggested Calorie & Meal Adjustments */}
      <div className="bg-[#12141D] border border-[#2D3245] rounded-3xl p-6 sm:p-8 space-y-6">
        <h3 className="text-lg font-extrabold text-white">Suggested Plan Adjustments for Week 5</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 bg-[#191C28] rounded-2xl border border-[#2D3245] space-y-1">
            <div className="font-bold text-[#C6FF00]">🔥 Calorie Target Adjustment</div>
            <p className="text-[#94A3B8]">{planData.suggestedAdjustments.calories}</p>
          </div>

          <div className="p-4 bg-[#191C28] rounded-2xl border border-[#2D3245] space-y-1">
            <div className="font-bold text-cyan-400">🍗 Protein & Meal Adjustment</div>
            <p className="text-[#94A3B8]">{planData.suggestedAdjustments.protein}</p>
          </div>

          <div className="p-4 bg-[#191C28] rounded-2xl border border-[#2D3245] space-y-1">
            <div className="font-bold text-purple-400">🏋️ Workout Split & Weight Adjustment</div>
            <p className="text-[#94A3B8]">{planData.suggestedAdjustments.workout}</p>
          </div>

          <div className="p-4 bg-[#191C28] rounded-2xl border border-[#2D3245] space-y-1">
            <div className="font-bold text-amber-400">😴 Sleep & Lifestyle Habit</div>
            <p className="text-[#94A3B8]">{planData.suggestedAdjustments.habit}</p>
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-4 flex justify-end">
          <button
            onClick={handleApply}
            disabled={isApplied}
            className={`px-8 py-3.5 rounded-2xl font-extrabold text-sm shadow transition cursor-pointer flex items-center gap-2 ${
              isApplied ? 'bg-emerald-500 text-black' : 'bg-[#C6FF00] hover:bg-[#B5F500] text-black lime-glow'
            }`}
          >
            {isApplied ? <CheckCircle2 className="w-5 h-5" /> : <Sliders className="w-5 h-5" />}
            <span>{isApplied ? "Next Week's Plan Applied!" : "Apply Next Week's Plan"}</span>
          </button>
        </div>
      </div>

      <MedicalDisclaimer compact={true} />
    </div>
  );
}
