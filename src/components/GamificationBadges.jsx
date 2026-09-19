import React from 'react';
import { Award, Flame, CheckCircle2, ShieldCheck, Zap } from 'lucide-react';

export default function GamificationBadges({ badges }) {
  return (
    <div className="bg-[#12141D] border border-[#2D3245] rounded-3xl p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Award className="w-5 h-5 text-[#C6FF00]" />
          <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">Milestone Badges & Accomplishments</h3>
        </div>
        <span className="text-xs font-mono text-[#C6FF00] font-bold">
          {badges.filter(b => b.unlocked).length} / {badges.length} Unlocked
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
        {badges.map((badge) => (
          <div
            key={badge.id}
            className={`p-3 rounded-2xl border text-center transition ${
              badge.unlocked
                ? 'bg-[#191C28] border-[#C6FF00]/40'
                : 'bg-[#191C28]/40 border-[#2D3245] opacity-50'
            }`}
          >
            <div className="text-2xl mb-1">{badge.icon}</div>
            <div className="text-xs font-bold text-white truncate">{badge.title}</div>
            <div className="text-[10px] text-[#94A3B8] mt-0.5 leading-tight line-clamp-2">{badge.desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
