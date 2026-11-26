import type { WeeklyAnalysis } from '../../adaptive/analysis.js';
import type { Insight, Recommendation, PlanValues } from '../../adaptive/planner.js';

/**
 * Prompt for the optional AI coach note on the Adaptive Plan tab.
 * The AI only writes prose around numbers that were already calculated from the
 * user's data; it is told not to introduce new figures or change the plan.
 */
export function buildAdaptiveSummaryPrompt(
  a: WeeklyAnalysis,
  insights: Insight[],
  recs: Recommendation[],
  values: PlanValues
): { system: string; prompt: string } {
  const system = `You are REPP's fitness coach writing a short weekly note.
Use ONLY the facts and numbers given. Do not invent measurements, percentages or targets, and do not change the plan.
Be encouraging, specific and practical. No medical advice. Return ONLY valid JSON.`;

  const fb = a.recovery.feedback;
  const facts = [
    `Goal: ${a.goalLabel}. Experience: ${a.profile.experienceLevel}.`,
    `Analysed week: ${a.window.current.start} to ${a.window.current.end}.`,
    a.body.trendReliable && a.body.weightTrendKgPerWeek != null ? `4-week weight trend: ${a.body.weightTrendKgPerWeek} kg/week.` : 'Not enough weigh-ins for a reliable weight trend.',
    a.body.waistTrendCmPerWeek != null ? `Waist trend: ${a.body.waistTrendCmPerWeek} cm/week.` : '',
    `Workouts: ${a.workouts.completed} of ${a.workouts.planned} planned.`,
    a.workouts.strength.improved.length ? `Lifts improved: ${a.workouts.strength.improved.map(e => `${e.name} ${e.from}->${e.to} kg`).join(', ')}.` : '',
    a.current.avgCalories != null ? `Average calories ${a.current.avgCalories} vs target ${a.profile.targets.calories}.` : 'Meals not logged enough to judge calories.',
    a.current.avgProtein != null ? `Average protein ${a.current.avgProtein} g vs target ${a.profile.targets.protein} g (target met on ${a.current.proteinTargetDays} days).` : '',
    a.recovery.sleepHours != null ? `Sleep about ${a.recovery.sleepHours} h (${a.recovery.sleepSource}).` : '',
    fb ? `User check-in: energy ${fb.energyLevel}/5, schedule manageable ${fb.workoutManageable}/5, meals affordable ${fb.mealsAffordable}/5.` : 'No weekly check-in submitted.',
    fb?.difficulties ? `User said difficulties: "${fb.difficulties.slice(0, 300)}"` : '',
    fb?.improvements ? `User wants to improve: "${fb.improvements.slice(0, 300)}"` : ''
  ].filter(Boolean).join('\n');

  const prompt = `FACTS
${facts}

KEY INSIGHTS
${insights.map(i => `- ${i.title}: ${i.detail}`).join('\n') || '- none'}

NEXT WEEK'S PLAN (already decided)
- ${values.calories} kcal, ${values.protein} g protein, ${values.workoutDays} workout days, ${values.cardioMinutes} min cardio, ${values.sleepHours} h sleep target
${recs.map(r => `- ${r.title} (because: ${r.reason})`).join('\n') || '- no changes'}

Write a weekly coach note in JSON:
{
  "summary": "3-5 sentences: what went well, the main thing to fix, and why next week's plan looks the way it does",
  "focus": ["three short, specific focus points for next week"]
}`;

  return { system, prompt };
}
