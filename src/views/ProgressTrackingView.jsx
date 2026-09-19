import React, { useState } from 'react';
import MedicalDisclaimer from '../components/MedicalDisclaimer';
import {
  TrendingUp,
  Award,
  Calendar,
  Sparkles,
  CheckCircle2,
  Dumbbell,
  Scale,
  Activity,
  FileText,
  ChevronRight
} from 'lucide-react';

export default function ProgressTrackingView({ userProfile }) {
  const [selectedTimeframe, setSelectedTimeframe] = useState('30d');
  const [showReportModal, setShowReportModal] = useState(false);

  // Mock Weight Trend Data points for clean SVG chart rendering
  const weightPoints = [
    { day: "Aug 20", weight: 76.5, waist: 84 },
    { day: "Aug 27", weight: 76.1, waist: 83.5 },
    { day: "Sep 03", weight: 75.6, waist: 83.0 },
    { day: "Sep 10", weight: 75.0, waist: 82.5 },
    { day: "Sep 17", weight: 74.4, waist: 82.0 }
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="bg-[#12141D] border border-[#2D3245] rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#C6FF00]/10 text-[#C6FF00] border border-[#C6FF00]/30 text-xs font-bold uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5" /> Analytics Engine
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">Comprehensive Progress Tracking</h2>
          <p className="text-xs sm:text-sm text-[#94A3B8] mt-1">
            Track body weight, waist tape measurements, macro adherence, and strength PRs over time.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {['7d', '30d', '60d'].map((t) => (
            <button
              key={t}
              onClick={() => setSelectedTimeframe(t)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase transition cursor-pointer ${
                selectedTimeframe === t
                  ? 'bg-[#C6FF00] text-black font-extrabold'
                  : 'bg-[#191C28] text-[#94A3B8] border border-[#2D3245]'
              }`}
            >
              {t}
            </button>
          ))}

          <button
            onClick={() => setShowReportModal(true)}
            className="px-4 py-2 bg-[#C6FF00] hover:bg-[#B5F500] text-black font-extrabold text-xs rounded-xl shadow transition cursor-pointer flex items-center gap-2"
          >
            <FileText className="w-4 h-4" /> Generate My Progress Report
          </button>
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-[#12141D] border border-[#2D3245] rounded-2xl p-4">
          <span className="text-xs text-[#94A3B8] font-bold block mb-1">Scale Weight Change</span>
          <div className="text-2xl font-black text-white">-2.1 kg</div>
          <span className="text-[10px] text-emerald-400 font-bold">76.5 kg → 74.4 kg</span>
        </div>
        <div className="bg-[#12141D] border border-[#2D3245] rounded-2xl p-4">
          <span className="text-xs text-[#94A3B8] font-bold block mb-1">Waist Tape Change</span>
          <div className="text-2xl font-black text-[#C6FF00]">-2.0 cm</div>
          <span className="text-[10px] text-[#C6FF00] font-bold">84 cm → 82 cm</span>
        </div>
        <div className="bg-[#12141D] border border-[#2D3245] rounded-2xl p-4">
          <span className="text-xs text-[#94A3B8] font-bold block mb-1">Protein Adherence</span>
          <div className="text-2xl font-black text-white">94%</div>
          <span className="text-[10px] text-[#94A3B8] font-bold">152g avg / 155g target</span>
        </div>
        <div className="bg-[#12141D] border border-[#2D3245] rounded-2xl p-4">
          <span className="text-xs text-[#94A3B8] font-bold block mb-1">Workout Consistency</span>
          <div className="text-2xl font-black text-cyan-400">100%</div>
          <span className="text-[10px] text-cyan-400 font-bold">16 / 16 workouts done</span>
        </div>
      </div>

      {/* Interactive Weight & Waist Chart Simulation */}
      <div className="bg-[#12141D] border border-[#2D3245] rounded-3xl p-6 sm:p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-extrabold text-white">Weight & Waist Measurement Trend</h3>
            <p className="text-xs text-[#94A3B8]">30-Day Body Recomposition Trajectory</p>
          </div>
          <div className="flex items-center gap-4 text-xs font-bold">
            <span className="flex items-center gap-1.5 text-white">
              <span className="w-3 h-3 rounded-full bg-[#C6FF00]"></span> Scale Weight (kg)
            </span>
            <span className="flex items-center gap-1.5 text-cyan-400">
              <span className="w-3 h-3 rounded-full bg-cyan-400"></span> Waist Tape (cm)
            </span>
          </div>
        </div>

        {/* Visual Chart Bars Representation */}
        <div className="h-48 flex items-end justify-between gap-4 pt-8 border-b border-[#2D3245] pb-4 px-4">
          {weightPoints.map((pt, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
              <div className="text-[10px] font-mono font-bold text-[#C6FF00] opacity-0 group-hover:opacity-100 transition">
                {pt.weight}kg
              </div>
              <div
                className="w-full max-w-[40px] bg-[#C6FF00] rounded-t-xl transition-all duration-500 hover:bg-[#B5F500]"
                style={{ height: `${((pt.weight - 70) / 10) * 100}%` }}
              ></div>
              <span className="text-[10px] text-[#94A3B8] font-mono mt-1">{pt.day}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Weekly & Monthly Progress Summaries */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Weekly Summary */}
        <div className="bg-[#12141D] border border-[#2D3245] rounded-3xl p-6 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">Weekly Progress Summary</h4>
            <span className="text-xs font-mono text-[#C6FF00]">Sep 12 - Sep 18</span>
          </div>
          <ul className="text-xs text-[#94A3B8] space-y-2 list-disc pl-4 leading-relaxed">
            <li>Lost <strong className="text-white">0.6 kg</strong> weight safely while increasing training weights.</li>
            <li>Avg daily calorie consumption: <strong className="text-white">2,140 kcal</strong>.</li>
            <li>Hit 4 out of 4 scheduled hyper-trophy sessions.</li>
            <li>Incline Dumbbell Press weight increased to <strong className="text-[#C6FF00]">24 kg x 9 reps</strong>.</li>
          </ul>
        </div>

        {/* Monthly Summary */}
        <div className="bg-[#12141D] border border-[#2D3245] rounded-3xl p-6 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">Monthly Recomp Summary</h4>
            <span className="text-xs font-mono text-[#C6FF00]">Last 30 Days</span>
          </div>
          <ul className="text-xs text-[#94A3B8] space-y-2 list-disc pl-4 leading-relaxed">
            <li>Total weight loss: <strong className="text-white">-2.1 kg</strong> (from 76.5 kg to 74.4 kg).</li>
            <li>Waist size reduced from <strong className="text-white">84 cm to 82 cm</strong>.</li>
            <li>Optical BodyVision fat estimation reduced by ~1.2%.</li>
            <li>Completed 16 gym workouts with zero injury flare-ups.</li>
          </ul>
        </div>
      </div>

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#12141D] border border-[#C6FF00] rounded-3xl p-6 max-w-lg w-full relative space-y-4 shadow-2xl lime-glow">
            <div className="flex justify-between items-center border-b border-[#2D3245] pb-3">
              <span className="text-xs font-extrabold text-[#C6FF00] uppercase tracking-wider">Official Progress Report</span>
              <button onClick={() => setShowReportModal(false)} className="text-xs text-[#94A3B8] hover:text-white">Close</button>
            </div>
            <h3 className="text-xl font-black text-white">REPP 30-Day Executive Summary</h3>
            <p className="text-xs text-[#94A3B8] leading-relaxed">
              Alex Sharma — Body Recomposition Program. Fat loss of 2.1kg achieved alongside strength gains on incline press and lat pulldowns.
            </p>
            <div className="p-4 bg-[#191C28] rounded-2xl border border-[#2D3245] text-xs space-y-1 font-mono text-white">
              <div>Weight Delta: -2.1 kg</div>
              <div>Waist Delta: -2.0 cm</div>
              <div>Protein Adherence: 94%</div>
              <div>Workouts Completed: 16</div>
            </div>
            <button
              onClick={() => { alert("Report downloaded as PDF!"); setShowReportModal(false); }}
              className="w-full py-3 bg-[#C6FF00] text-black font-extrabold text-xs rounded-xl shadow cursor-pointer"
            >
              Download PDF Report
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
