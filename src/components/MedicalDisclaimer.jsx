import React from 'react';
import { AlertTriangle, Info } from 'lucide-react';

export default function MedicalDisclaimer({ compact = false, className = '' }) {
  if (compact) {
    return (
      <div className={`flex items-center gap-2 p-3 bg-[#12141D] border border-[#2D3245] rounded-xl text-xs text-[#94A3B8] ${className}`}>
        <Info className="w-4 h-4 text-[#C6FF00] shrink-0" />
        <span>REPP is an AI fitness & nutrition coach, not a medical diagnostic tool. Consult a physician before starting any diet or workout regimen.</span>
      </div>
    );
  }

  return (
    <div className={`p-4 bg-[#12141D] border border-amber-500/30 rounded-2xl flex items-start gap-3.5 text-xs text-[#94A3B8] leading-relaxed ${className}`}>
      <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
      <div>
        <h5 className="font-bold text-[#E2E8F0] mb-1">Medical & Health Notice</h5>
        <p>
          REPP provides automated AI fitness plans, calorie estimations, and workout recommendations based on user-entered parameters. REPP is <strong className="text-white">not a licensed medical diagnostic tool or registered clinical dietitian service</strong>. Always consult a qualified medical professional or certified nutritionist before undertaking significant changes to your nutrition, exercise, or health routine.
        </p>
      </div>
    </div>
  );
}
