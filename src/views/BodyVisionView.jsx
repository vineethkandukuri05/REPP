import React, { useState } from 'react';
import MedicalDisclaimer from '../components/MedicalDisclaimer';
import {
  Scan,
  Camera,
  Upload,
  AlertTriangle,
  Lock,
  Trash2,
  Sparkles,
  CheckCircle2,
  TrendingDown,
  Info,
  ShieldCheck,
  ChevronRight,
  EyeOff
} from 'lucide-react';

export default function BodyVisionView({ reports, onDeletePhoto }) {
  const [activeReport, setActiveReport] = useState(reports[0]);
  const [comparingReport, setComparingReport] = useState(reports[1] || reports[0]);
  const [isUploading, setIsUploading] = useState(false);
  const [privacyPolicyAccepted, setPrivacyPolicyAccepted] = useState(true);

  const handleSimulateScan = () => {
    setIsUploading(true);
    setTimeout(() => {
      setIsUploading(false);
      alert("New progress photo uploaded & analyzed! Body fat estimated in 15.8% - 17.5% range.");
    }, 1800);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="bg-[#12141D] border border-[#2D3245] rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#C6FF00]/10 text-[#C6FF00] border border-[#C6FF00]/30 text-xs font-bold uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5" /> Optical Body Composition AI
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">REPP BodyVision™</h2>
          <p className="text-xs sm:text-sm text-[#94A3B8] mt-1">
            Privacy-conscious optical body-fat range estimation & progressive shape analysis.
          </p>
        </div>

        <button
          onClick={handleSimulateScan}
          disabled={isUploading}
          className="px-5 py-2.5 bg-[#C6FF00] hover:bg-[#B5F500] text-black font-extrabold text-xs rounded-xl shadow transition cursor-pointer flex items-center gap-2 lime-glow"
        >
          {isUploading ? <Sparkles className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
          <span>{isUploading ? "Analyzing..." : "Upload New Progress Photos"}</span>
        </button>
      </div>

      {/* Mandatory Clinical & Privacy Disclaimer Box */}
      <div className="p-5 bg-[#12141D] border border-amber-500/30 rounded-3xl space-y-3">
        <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider">
          <AlertTriangle className="w-4 h-4" /> AI Body Composition Disclaimer & Guidance
        </div>
        <ul className="text-xs text-[#94A3B8] space-y-1.5 list-disc pl-5 leading-relaxed">
          <li><strong className="text-white">Estimate Only:</strong> Body fat is displayed strictly as a range (e.g., 16.2% - 18.0%), not a precise DEXA scan or clinical measurement.</li>
          <li><strong className="text-white">Variables:</strong> Lighting, posture, camera angle, clothing, and water retention directly affect optical analysis.</li>
          <li><strong className="text-white">Visceral Fat Limit:</strong> REPP cannot detect internal visceral fat from surface photographs.</li>
          <li><strong className="text-white">Spot Reduction Myth:</strong> Fat loss occurs systemically; targeted fat reduction cannot be guaranteed.</li>
          <li><strong className="text-white">Best Practice:</strong> Combine photo trends with scale weight and waist tape measurements for accuracy.</li>
        </ul>
      </div>

      {/* Photography Consistency Guidance */}
      <div className="bg-[#12141D] border border-[#2D3245] rounded-3xl p-6">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-3">Guidelines for Consistent Photos</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-[#94A3B8]">
          <div className="p-3 bg-[#191C28] rounded-2xl border border-[#2D3245]">
            <span className="font-bold text-white block mb-1">1. Lighting</span>
            <span>Use natural morning light facing camera. Avoid harsh overhead shadows.</span>
          </div>
          <div className="p-3 bg-[#191C28] rounded-2xl border border-[#2D3245]">
            <span className="font-bold text-white block mb-1">2. Distance & Angle</span>
            <span>Position camera at chest height, exactly 2 meters (6 feet) away.</span>
          </div>
          <div className="p-3 bg-[#191C28] rounded-2xl border border-[#2D3245]">
            <span className="font-bold text-white block mb-1">3. Consistent Attire</span>
            <span>Wear fitted shorts / swimwear for identical anatomical tracking.</span>
          </div>
          <div className="p-3 bg-[#191C28] rounded-2xl border border-[#2D3245]">
            <span className="font-bold text-white block mb-1">4. Neutral Posture</span>
            <span>Stand straight, arms slightly away from sides, relaxed breath out.</span>
          </div>
        </div>
      </div>

      {/* Upload 3 Photos Preview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { title: "Front View", img: activeReport.frontPhoto, label: "Abs & Chest Definition" },
          { title: "Side Profile", img: activeReport.sidePhoto || activeReport.frontPhoto, label: "Abdominal Depth & Posture" },
          { title: "Back View", img: activeReport.backPhoto || activeReport.frontPhoto, label: "Lats & Upper Back Width" }
        ].map((p, idx) => (
          <div key={idx} className="bg-[#12141D] border border-[#2D3245] rounded-3xl p-4 text-center space-y-3 relative group">
            <div className="text-xs font-bold text-white flex items-center justify-between">
              <span>{p.title}</span>
              <span className="text-[10px] text-[#C6FF00] bg-[#C6FF00]/10 px-2 py-0.5 rounded">Active Scan</span>
            </div>
            <img src={p.img} alt={p.title} className="w-full h-56 object-cover rounded-2xl border border-[#2D3245] group-hover:opacity-90 transition" />
            <span className="text-[11px] text-[#94A3B8] font-medium block">{p.label}</span>
          </div>
        ))}
      </div>

      {/* AI Analysis Report Card */}
      <div className="bg-[#12141D] border border-[#C6FF00]/40 rounded-3xl p-6 sm:p-8 space-y-6 lime-glow">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#2D3245]">
          <div>
            <div className="text-xs font-bold text-[#C6FF00] uppercase tracking-wider">AI Report • {activeReport.date}</div>
            <h3 className="text-2xl font-black text-white mt-0.5">Estimated Body Fat Range</h3>
          </div>
          <div className="px-6 py-3 bg-[#191C28] border border-[#C6FF00] rounded-2xl text-center">
            <span className="text-2xl font-black text-[#C6FF00]">{activeReport.estimatedBodyFatRange}</span>
            <span className="text-[10px] text-[#94A3B8] block font-mono">Estimated Range</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
          <div className="space-y-2">
            <h4 className="font-bold text-white uppercase tracking-wider">Visible Composition Trends</h4>
            <p className="text-[#94A3B8] leading-relaxed bg-[#191C28] p-4 rounded-2xl border border-[#2D3245]">
              {activeReport.visibleTrends}
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="font-bold text-white uppercase tracking-wider">Fat Distribution Observations</h4>
            <p className="text-[#94A3B8] leading-relaxed bg-[#191C28] p-4 rounded-2xl border border-[#2D3245]">
              {activeReport.fatDistribution}
            </p>
          </div>
        </div>
      </div>

      {/* Section: Track Your Changes Over Time */}
      <div className="bg-[#12141D] border border-[#2D3245] rounded-3xl p-6 sm:p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-extrabold text-white">Track Your Changes Over Time</h3>
            <p className="text-xs text-[#94A3B8]">Compare current progress against baseline photos taken 30 days ago.</p>
          </div>
          <span className="text-xs text-[#C6FF00] font-bold bg-[#C6FF00]/10 px-3 py-1 rounded-full border border-[#C6FF00]/30">
            30-Day Recomp Progress
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Past Scan Card */}
          <div className="p-4 bg-[#191C28] rounded-2xl border border-[#2D3245] space-y-3">
            <div className="flex justify-between text-xs font-bold text-[#94A3B8]">
              <span>Baseline: Aug 18, 2026</span>
              <span className="text-white">BF Range: 17.4% - 19.2%</span>
            </div>
            <img src={reports[1]?.frontPhoto || reports[0].frontPhoto} alt="Baseline" className="w-full h-48 object-cover rounded-xl border border-[#2D3245]" />
            <p className="text-xs text-[#94A3B8]">Baseline scan recorded at onboarding start.</p>
          </div>

          {/* Current Scan Card */}
          <div className="p-4 bg-[#191C28] rounded-2xl border border-[#C6FF00]/50 space-y-3">
            <div className="flex justify-between text-xs font-bold text-[#C6FF00]">
              <span>Current: Sep 18, 2026</span>
              <span className="text-white">BF Range: 16.2% - 18.0%</span>
            </div>
            <img src={activeReport.frontPhoto} alt="Current" className="w-full h-48 object-cover rounded-xl border border-[#C6FF00]/40" />
            <p className="text-xs text-white">Progress: ~1.2% fat reduction with increased shoulder cap definition.</p>
          </div>
        </div>
      </div>

      {/* Photo Privacy & Management Controls */}
      <div className="p-6 bg-[#12141D] border border-[#2D3245] rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Lock className="w-6 h-6 text-[#C6FF00]" />
          <div>
            <div className="text-sm font-bold text-white">Photo Privacy Controls</div>
            <div className="text-xs text-[#94A3B8]">Your body photos are encrypted locally. You can wipe all photos anytime.</div>
          </div>
        </div>

        <button
          onClick={onDeletePhoto}
          className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer"
        >
          <Trash2 className="w-4 h-4" /> Delete All Uploaded Photos
        </button>
      </div>
    </div>
  );
}
