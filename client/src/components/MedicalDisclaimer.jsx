import React from 'react';

export default function MedicalDisclaimer({ compact = false, className = '' }) {
  if (compact) {
    return (
      <div className={`flex items-center gap-2 p-3 bg-surface border border-line rounded-sm text-xs text-muted ${className}`}>
        
        <span>REPP is an AI fitness & nutrition coach, not a medical diagnostic tool. Consult a physician before starting any diet or workout regimen.</span>
      </div>
    );
  }

  return (
    <div className={`p-4 bg-surface border border-warning rounded-sm flex items-start gap-3.5 text-xs text-muted leading-relaxed ${className}`}>
      
      <div>
        <h5 className="font-bold text-body mb-1">Medical & Health Notice</h5>
        <p>
          REPP provides automated AI fitness plans, calorie estimations, and workout recommendations based on user-entered parameters. REPP is <strong className="text-ink">not a licensed medical diagnostic tool or registered clinical dietitian service</strong>. Always consult a qualified medical professional or certified nutritionist before undertaking significant changes to your nutrition, exercise, or health routine.
        </p>
      </div>
    </div>
  );
}
