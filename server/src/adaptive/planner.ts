/**
 * Turns a WeeklyAnalysis into insights, recommendations and a 7-day plan.
 * Deterministic rules only (no AI, no randomness), so every number is explainable.
 */
import { calculateBMR } from '../utils/fitnessMath.js';
import { validateExerciseSafety } from '../ai/safetyValidators.js';
import type { WeeklyAnalysis, Goal } from './analysis.js';
import { addDays, dateRange, trainingWeekdays } from './analysis.js';
import {
  SLOTS, SESSION_TEMPLATES, SPLITS, injuryStresses, locationOf, FOODS, allowedDiets, PROTEIN_SOURCES,
  type Exercise, type FoodOption
} from './library.js';
import { localDateString } from '../utils/date.js';

// ---------------------------------------------------------------- types

export interface PlanValues {
  calories: number;
  protein: number;
  workoutDays: number;
  cardioMinutes: number;   // per week
  waterMl: number;
  sleepHours: number;      // nightly target
}
export type PlanField = keyof PlanValues;

export const FIELD_META: Record<PlanField, { label: string; unit: string; min: number; max: number }> = {
  calories: { label: 'Daily calories', unit: 'kcal', min: 1200, max: 4500 },
  protein: { label: 'Daily protein', unit: 'g', min: 50, max: 300 },
  workoutDays: { label: 'Workout days', unit: 'days/week', min: 2, max: 6 },
  cardioMinutes: { label: 'Cardio', unit: 'min/week', min: 0, max: 300 },
  waterMl: { label: 'Water', unit: 'ml/day', min: 1500, max: 6000 },
  sleepHours: { label: 'Sleep', unit: 'hours/night', min: 6, max: 10 }
};

export interface Insight { tone: 'positive' | 'warning' | 'info'; title: string; detail: string }

export interface Recommendation {
  id: string;
  category: 'nutrition' | 'workout' | 'recovery' | 'hydration' | 'tracking';
  priority: 'high' | 'medium' | 'low';
  title: string;
  detail: string;
  reason: string;
  change?: { field: PlanField; from: number | null; to: number };
  status: 'pending' | 'accepted' | 'rejected';
}

const round5 = (n: number) => Math.round(n / 5) * 5;
const round50 = (n: number) => Math.round(n / 50) * 50;
const fmtKg = (n: number) => `${n > 0 ? '+' : ''}${n} kg`;

export const DEFAULT_CARDIO: Record<Goal, number> = { fat_loss: 90, recomposition: 60, muscle_gain: 40, strength: 40, general: 120 };
const PROTEIN_RANGE: Record<Goal, [number, number, number]> = {
  // g per kg: [min acceptable, max acceptable, aim]
  fat_loss: [1.6, 2.4, 2.0],
  muscle_gain: [1.6, 2.4, 1.8],
  recomposition: [1.8, 2.4, 2.0],
  strength: [1.6, 2.4, 1.8],
  general: [1.2, 2.2, 1.5]
};

// ---------------------------------------------------------------- baseline values

/** The values the user was following last week (accepted plan if any, else profile targets). */
export function baselineValues(a: WeeklyAnalysis, previousPlanValues: Partial<PlanValues> | null): PlanValues {
  return {
    calories: a.profile.targets.calories,
    protein: a.profile.targets.protein,
    workoutDays: a.profile.workoutDaysPerWeek,
    cardioMinutes: previousPlanValues?.cardioMinutes ?? DEFAULT_CARDIO[a.goal],
    waterMl: a.profile.targets.water,
    sleepHours: previousPlanValues?.sleepHours ?? Math.max(7.5, Math.min(9, a.profile.sleepSettingHours ?? 7.5))
  };
}

/** Values for the upcoming week: baseline, plus every recommendation not rejected, plus user customisations. */
export function resolveValues(base: PlanValues, recs: Recommendation[], customizations: Partial<PlanValues>): PlanValues {
  const v = { ...base };
  for (const r of recs) {
    if (r.change && r.status !== 'rejected') v[r.change.field] = r.change.to;
  }
  for (const [k, val] of Object.entries(customizations || {})) {
    const field = k as PlanField;
    if (!(field in FIELD_META) || typeof val !== 'number' || !Number.isFinite(val)) continue;
    const m = FIELD_META[field];
    v[field] = Math.max(m.min, Math.min(m.max, val));
  }
  return v;
}

// ---------------------------------------------------------------- insights

export function buildInsights(a: WeeklyAnalysis): Insight[] {
  const out: Insight[] = [];
  const { body, workouts, current, previous, recovery } = a;
  const t = a.profile.targets;
  const rate = body.weightTrendPctPerWeek;
  const waistTrend = body.waistTrendCmPerWeek;
  const improved = workouts.strength.improved.length;
  const declined = workouts.strength.declined.length;

  // Body composition, judged by goal (not "weight down = good").
  if (body.trendReliable && rate != null) {
    const kg = body.weightTrendKgPerWeek!;
    if (a.goal === 'fat_loss') {
      if (rate < -1) out.push({ tone: 'warning', title: 'Losing weight faster than recommended', detail: `About ${fmtKg(kg)}/week (${rate}% of body weight). Above ~1%/week you risk losing muscle and energy.` });
      else if (rate <= -0.2) out.push({ tone: 'positive', title: 'Fat loss is on track', detail: `Trend of ${fmtKg(kg)}/week over the last 4 weeks, within the healthy 0.25–1% range.` });
      else if (waistTrend != null && waistTrend <= -0.2) out.push({ tone: 'positive', title: 'Scale is flat but your waist is shrinking', detail: `Weight trend ${fmtKg(kg)}/week while waist is going down ${waistTrend} cm/week, which points to fat loss with muscle being kept or added.` });
      else out.push({ tone: 'warning', title: 'Fat loss has stalled', detail: `Weight trend ${fmtKg(kg)}/week and waist not decreasing over the last 4 weeks.` });
    } else if (a.goal === 'muscle_gain') {
      if (rate < 0.05) out.push({ tone: 'warning', title: 'Weight is not going up', detail: `Trend ${fmtKg(kg)}/week. Lean gain usually needs about +0.1–0.3 kg/week.` });
      else if (rate > 0.6) out.push({ tone: 'warning', title: 'Gaining faster than needed', detail: `Trend ${fmtKg(kg)}/week. Faster than ~0.5%/week mostly adds fat.` });
      else out.push({ tone: 'positive', title: 'Lean gain is on track', detail: `Trend ${fmtKg(kg)}/week, a sensible pace for building muscle.` });
    } else if (a.goal === 'recomposition' || a.goal === 'strength') {
      if (Math.abs(rate) <= 0.3 && waistTrend != null && waistTrend < 0) out.push({ tone: 'positive', title: 'Weight stable, measurements improving', detail: `Weight is steady (${fmtKg(kg)}/week) while your waist trends ${waistTrend} cm/week. For ${a.goalLabel}, that is progress even though the scale barely moves.` });
      else if (rate < -0.75) out.push({ tone: 'warning', title: 'Weight dropping quickly for your goal', detail: `${fmtKg(kg)}/week. Recomposition and strength work best close to maintenance.` });
      else out.push({ tone: 'info', title: 'Weight is roughly stable', detail: `Trend ${fmtKg(kg)}/week. Judge progress by waist and strength, not the scale alone.` });
    } else {
      if (Math.abs(rate) > 0.75) out.push({ tone: 'info', title: 'Weight is changing noticeably', detail: `${fmtKg(kg)}/week over 4 weeks. For general fitness, staying near maintenance is usually best.` });
      else out.push({ tone: 'positive', title: 'Weight is stable', detail: `Trend ${fmtKg(kg)}/week, consistent with maintaining.` });
    }
  }

  if (workouts.strength.compared >= 2) {
    if (improved > 0 && improved >= declined) {
      const ex = workouts.strength.improved.slice(0, 2).map(e => `${e.name} ${e.from}→${e.to} kg`).join(', ');
      out.push({ tone: 'positive', title: 'Strength is improving', detail: `${improved} of ${workouts.strength.compared} tracked lifts went up this week (${ex}).` });
    } else if (declined > improved) {
      out.push({ tone: 'warning', title: 'Some lifts went down', detail: `${declined} lift${declined === 1 ? '' : 's'} dropped compared with the previous 4 weeks. Check sleep, food and stress.` });
    }
  }

  if (workouts.completionPct != null) {
    if (workouts.completionPct >= 90) out.push({ tone: 'positive', title: 'Great workout consistency', detail: `${workouts.completed} of ${workouts.planned} planned workouts done.` });
    else if (workouts.completionPct < 60) out.push({ tone: 'warning', title: 'Workout consistency needs attention', detail: `${workouts.completed} of ${workouts.planned} planned workouts done${a.hasPreviousWeekData ? ` (previous week: ${workouts.previousCompleted})` : ''}.` });
  }

  if (current.daysWithMeals >= 3) {
    const proteinPct = current.avgProtein != null ? Math.round((current.avgProtein / t.protein) * 100) : null;
    if (current.proteinTargetDays < Math.min(5, current.daysWithMeals))
      out.push({ tone: 'warning', title: 'Protein intake is inconsistent', detail: `You reached your ${t.protein} g target on ${current.proteinTargetDays} of ${current.daysWithMeals} logged days (average ${current.avgProtein} g, ${proteinPct}%).` });
    else out.push({ tone: 'positive', title: 'Protein target met consistently', detail: `Target reached on ${current.proteinTargetDays} of ${current.daysWithMeals} logged days.` });

    if (current.avgCalories != null) {
      const diff = current.avgCalories - t.calories;
      if (Math.abs(diff) > t.calories * 0.1) out.push({ tone: 'info', title: diff > 0 ? 'Eating above your calorie target' : 'Eating below your calorie target', detail: `Average ${current.avgCalories} kcal vs ${t.calories} kcal target (${diff > 0 ? '+' : ''}${diff} kcal/day).` });
    }
  }

  if (recovery.sleepHours != null && recovery.sleepHours < 7) {
    out.push({ tone: 'warning', title: 'Sleep may be limiting recovery', detail: `About ${recovery.sleepHours} h per night (${recovery.sleepSource === 'self-reported' ? 'from your check-in' : 'from your profile'}). Under 7 h slows recovery and can stall fat loss and strength.` });
  }
  if (recovery.energyLevel != null && recovery.energyLevel <= 2) {
    out.push({ tone: 'warning', title: 'Low energy reported', detail: 'You rated your energy as low this week. The plan reduces training volume slightly.' });
  }

  if (a.consistency.score != null && a.consistency.previousScore != null) {
    const d = a.consistency.score - a.consistency.previousScore;
    if (Math.abs(d) >= 10) out.push({ tone: d > 0 ? 'positive' : 'warning', title: d > 0 ? 'More consistent than last week' : 'Less consistent than last week', detail: `Consistency score ${a.consistency.previousScore} → ${a.consistency.score}.` });
  }

  if (previous.daysWithMeals === 0 && current.daysWithMeals === 0 && workouts.completed === 0) {
    out.push({ tone: 'info', title: 'Not enough tracking data yet', detail: 'Log meals, workouts and a weigh-in this week and next week’s plan will adapt to you.' });
  }
  return out;
}

// ---------------------------------------------------------------- recommendations

function minCalories(a: WeeklyAnalysis): number {
  const w = a.body.latest?.weight ?? 70;
  const bmr = calculateBMR(w, a.profile.heightCm, a.profile.age, a.profile.sex);
  const floor = a.profile.sex.toLowerCase() === 'female' ? 1200 : 1500;
  return Math.max(floor, Math.round(bmr * 0.95));
}

export function buildRecommendations(a: WeeklyAnalysis, base: PlanValues): Recommendation[] {
  const recs: Recommendation[] = [];
  let n = 0;
  const add = (r: Omit<Recommendation, 'id' | 'status'>) => recs.push({ ...r, id: `rec_${++n}`, status: 'pending' });

  const { body, current, workouts, recovery } = a;
  const rate = body.weightTrendPctPerWeek;
  const waistTrend = body.waistTrendCmPerWeek;
  const weight = body.latest?.weight ?? null;
  const fb = recovery.feedback;
  const adherent = current.daysWithMeals >= 5 && current.avgCalories != null && Math.abs(current.avgCalories - base.calories) <= base.calories * 0.1;
  // Poor recovery this week: don't ask for more work or less food on top of it.
  const lowRecovery = (recovery.energyLevel != null && recovery.energyLevel <= 2) || (workouts.strength.declined.length >= 2 && (recovery.sleepHours ?? 8) < 7);

  // ---- Calories: only on a reliable multi-week trend, and only if the current target was actually followed.
  if (body.trendReliable && rate != null) {
    let to: number | null = null;
    let reason = '';
    let alt: Omit<Recommendation, 'id' | 'status'> | null = null;
    const kgWk = body.weightTrendKgPerWeek;

    if (a.goal === 'fat_loss') {
      if (rate < -1) { to = base.calories + 150; reason = `Your 4-week trend is ${fmtKg(kgWk!)}/week (${rate}%/week), faster than the ~1%/week limit that protects muscle.`; }
      else if (rate > -0.2 && !(waistTrend != null && waistTrend <= -0.2)) {
        if (lowRecovery) {
          alt = { category: 'nutrition', priority: 'medium', title: 'Keep calories and cardio the same this week', detail: `Stay at ${base.calories} kcal and ${base.cardioMinutes} min cardio while you recover; reassess next week.`, reason: `Fat loss has stalled (${fmtKg(kgWk!)}/week), but your recovery is low this week (${recovery.energyLevel != null ? `energy ${recovery.energyLevel}/5` : 'lifts dropping with short sleep'}). Eating less or doing more now would make that worse.` };
        } else if (!adherent) {
          alt = { category: 'nutrition', priority: 'high', title: 'Hit your current calorie target before changing it', detail: `Aim for ${base.calories} kcal (±10%) on at least 5 days and log every meal.`, reason: `Weight has stalled, but meals were logged on ${current.daysWithMeals}/7 days${current.avgCalories != null ? ` averaging ${current.avgCalories} kcal` : ''}. Cutting calories without knowing what you eat could undershoot nutrition.` };
        } else if (base.cardioMinutes < 120) {
          alt = { category: 'workout', priority: 'high', title: 'Add a little cardio instead of cutting food', detail: `Increase cardio to ${base.cardioMinutes + 30} min this week (e.g. two extra 15-min brisk walks).`, reason: `Fat loss stalled (${fmtKg(kgWk!)}/week) even though you ate on target. A small activity increase keeps food intake adequate.`, change: { field: 'cardioMinutes', from: base.cardioMinutes, to: base.cardioMinutes + 30 } };
        } else {
          to = Math.max(minCalories(a), base.calories - 150);
          reason = `Weight and waist have been flat for 4 weeks (${fmtKg(kgWk!)}/week) while you ate on target and already do ${base.cardioMinutes} min of cardio.`;
          if (to >= base.calories) to = null;
        }
      }
    } else if (a.goal === 'muscle_gain') {
      if (rate < 0.05 && adherent) { to = base.calories + 150; reason = `Weight trend is ${fmtKg(kgWk!)}/week while eating on target; lean gain needs a small surplus.`; }
      else if (rate < 0.05 && !adherent) alt = { category: 'nutrition', priority: 'high', title: 'Eat your full calorie target consistently', detail: `Reach ${base.calories} kcal on at least 5 days before the target is raised.`, reason: `Weight isn't going up, but meals were logged on ${current.daysWithMeals}/7 days${current.avgCalories != null ? ` averaging ${current.avgCalories} kcal` : ''}.` };
      else if (rate > 0.6) { to = base.calories - 100; reason = `Gaining ${fmtKg(kgWk!)}/week (${rate}%/week); above ~0.5%/week extra weight is mostly fat.`; }
    } else if (a.goal === 'recomposition' || a.goal === 'strength') {
      if (rate < -0.75) { to = base.calories + 100; reason = `Weight is dropping ${fmtKg(kgWk!)}/week. ${a.goalLabel} works best close to maintenance so training stays strong.`; }
      else if (rate > 0.3 && waistTrend != null && waistTrend > 0.2) { to = base.calories - 100; reason = `Both weight (${fmtKg(kgWk!)}/week) and waist (+${waistTrend} cm/week) are rising.`; }
    } else if (Math.abs(rate) > 0.75) {
      to = rate > 0 ? base.calories - 100 : base.calories + 100;
      reason = `Weight is moving ${fmtKg(kgWk!)}/week; for general fitness the aim is to stay near maintenance.`;
    }

    if (to != null && to !== base.calories) {
      add({ category: 'nutrition', priority: 'high', title: `${to > base.calories ? 'Increase' : 'Reduce'} daily calories to ${to} kcal`, detail: `Change of ${to > base.calories ? '+' : ''}${to - base.calories} kcal/day. Spread it across meals rather than one meal.`, reason, change: { field: 'calories', from: base.calories, to } });
    } else if (alt) {
      add(alt);
    }
  }

  // ---- Protein target: only change if it's outside the sensible range for the goal and weight.
  if (weight) {
    const [lo, hi, aim] = PROTEIN_RANGE[a.goal];
    const perKg = base.protein / weight;
    if (perKg < lo || perKg > hi) {
      const to = round5(weight * aim);
      add({ category: 'nutrition', priority: 'medium', title: `Set protein target to ${to} g/day`, detail: `${aim} g per kg of body weight.`, reason: `Your current target (${base.protein} g = ${perKg.toFixed(1)} g/kg) is outside the ${lo}–${hi} g/kg range that suits ${a.goalLabel}.`, change: { field: 'protein', from: base.protein, to } });
    }
  }

  // ---- Protein consistency: food suggestions, no target change.
  if (current.daysWithMeals >= 3 && current.proteinTargetDays < Math.min(5, current.daysWithMeals)) {
    const sources = proteinSourcesFor(a).slice(0, 4).map(s => `${s.name} (${s.protein}, ${s.costNote})`).join('; ');
    add({ category: 'nutrition', priority: 'high', title: 'Make protein more consistent', detail: `Add one protein-rich item to two meals a day. Affordable options for you: ${sources}.`, reason: `Protein target (${base.protein} g) was reached on ${current.proteinTargetDays} of ${current.daysWithMeals} logged days${current.avgProtein != null ? `, averaging ${current.avgProtein} g` : ''}${fb?.proteinTargetMet === 'no' ? ', and you said you did not hit it' : ''}.` });
  }

  // ---- Budget
  if (fb && fb.mealsAffordable <= 2) {
    add({ category: 'nutrition', priority: 'medium', title: 'Switch to lower-cost meals', detail: 'This week\'s meal plan favours dal, soya, chana, eggs/curd and seasonal vegetables over paneer, chicken and supplements.', reason: `You rated meal affordability ${fb.mealsAffordable}/5 in your check-in (budget ₹${a.profile.dailyBudget}/day).` });
  }

  // ---- Workout frequency
  const bothWeeksLow = (workouts.completionPct ?? 100) < 60 && (workouts.previousCompletionPct ?? 100) < 60 && a.hasPreviousWeekData;
  if ((bothWeeksLow || (fb && fb.workoutManageable <= 2)) && base.workoutDays > 3) {
    const to = base.workoutDays - 1;
    add({ category: 'workout', priority: 'high', title: `Train ${to} days instead of ${base.workoutDays}`, detail: `Same key lifts, fewer days. A schedule you complete beats a bigger one you skip.`, reason: bothWeeksLow ? `You completed ${workouts.completed}/${workouts.planned} workouts this week and ${workouts.previousCompleted} the week before.` : `You rated the workout schedule ${fb!.workoutManageable}/5 for manageability.`, change: { field: 'workoutDays', from: base.workoutDays, to } });
  } else if (workouts.missedDays.length > 0) {
    add({ category: 'workout', priority: 'medium', title: `Reschedule ${workouts.missedDays.length} missed session${workouts.missedDays.length === 1 ? '' : 's'}`, detail: 'The missed session types are placed first in this week\'s schedule. No extra days are added to make up for them.', reason: `No workout was logged on ${workouts.missedDays.map(d => new Date(`${d}T12:00:00`).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })).join(', ')}.` });
  } else if ((workouts.completionPct ?? 0) >= 100 && (workouts.previousCompletionPct ?? 0) >= 100 && fb && fb.energyLevel >= 4 && fb.workoutManageable >= 4
    && base.workoutDays < 5 && a.profile.experienceLevel !== 'Beginner' && (a.goal === 'muscle_gain' || a.goal === 'strength')) {
    add({ category: 'workout', priority: 'low', title: `Optional: add a ${base.workoutDays + 1}th training day`, detail: 'Only if your schedule allows. Keep each session the same length.', reason: `Two weeks of 100% completion with high energy (${fb.energyLevel}/5) and a manageable schedule.`, change: { field: 'workoutDays', from: base.workoutDays, to: base.workoutDays + 1 } });
  }

  // ---- Progression / deload
  if (lowRecovery) {
    add({ category: 'workout', priority: 'high', title: 'Lighter week: one fewer set per exercise', detail: 'Keep the same exercises and weights, drop one working set each. Return to normal next week if energy improves.', reason: recovery.energyLevel != null && recovery.energyLevel <= 2 ? `You rated your energy ${recovery.energyLevel}/5.` : `${workouts.strength.declined.length} lifts went down and sleep is about ${recovery.sleepHours} h.` });
  } else if (workouts.strength.improved.length > 0 && (workouts.completionPct ?? 0) >= 75) {
    add({ category: 'workout', priority: 'low', title: 'Keep progressing your main lifts', detail: 'When you complete all reps at the top of the range with good form, add 2.5 kg (upper body) or 5 kg (lower body) next session.', reason: `${workouts.strength.improved.length} lift${workouts.strength.improved.length === 1 ? '' : 's'} improved this week and you trained consistently.` });
  }

  // ---- Sleep
  if (recovery.sleepHours != null && recovery.sleepHours < 7) {
    const to = Math.max(base.sleepHours, 7.5);
    add({ category: 'recovery', priority: recovery.energyLevel != null && recovery.energyLevel <= 2 ? 'high' : 'medium', title: `Get closer to ${to} hours of sleep`, detail: 'Fixed bedtime, no screens 30 min before bed, caffeine before 2 pm.', reason: `You average about ${recovery.sleepHours} h (${recovery.sleepSource === 'self-reported' ? 'from your check-in' : 'from your profile setting'}) against a ${to} h target. Below 7 h slows recovery and raises hunger.`, ...(to !== base.sleepHours ? { change: { field: 'sleepHours' as const, from: base.sleepHours, to } } : {}) });
  }

  // ---- Hydration habit (target already set from body weight)
  if (current.daysWithWater >= 3 && current.avgWater != null && current.avgWater < base.waterMl * 0.8) {
    add({ category: 'hydration', priority: 'low', title: `Drink closer to ${base.waterMl} ml a day`, detail: 'Keep a 1-litre bottle nearby and finish one before lunch, one by evening, and one around training.', reason: `Average logged water was ${current.avgWater} ml (${Math.round((current.avgWater / base.waterMl) * 100)}% of target).` });
  }

  // ---- Tracking gaps
  for (const g of a.dataGaps.filter(g => ['no_weighin_week', 'no_measurements', 'weight_trend', 'meals'].includes(g.key)).slice(0, 2)) {
    add({ category: 'tracking', priority: 'medium', title: g.action, detail: g.message, reason: 'The plan can only adjust targets when it has enough data to see a trend.' });
  }

  return recs;
}

function proteinSourcesFor(a: WeeklyAnalysis) {
  const allowed = allowedDiets(a.profile.dietPreference);
  const allergies = a.profile.foodAllergies.map(x => x.toLowerCase());
  return PROTEIN_SOURCES.filter(s => allowed.includes(s.diet) && !s.allergens.some(al => allergies.some(u => u.includes(al) || al.includes(u))));
}

// ---------------------------------------------------------------- plan

function pickExercise(slot: string, loc: ReturnType<typeof locationOf>, stresses: Set<string>, a: WeeklyAnalysis): Exercise | null {
  const options = SLOTS[slot] || [];
  for (const ex of options) {
    if (!ex.where.includes(loc)) continue;
    if (ex.stress.some(s => stresses.has(s))) continue;
    const safe = validateExerciseSafety({
      exerciseName: ex.name, targetMuscles: [ex.muscles], equipmentNeeded: '',
      userInjuries: a.profile.injuries, userAvailableEquipment: [], userExcludedExercises: a.profile.excludedExercises
    });
    if (safe.safe) return ex;
  }
  return null;
}

function prescription(ex: Exercise, a: WeeklyAnalysis, deload: boolean) {
  const lvl = a.profile.experienceLevel;
  let sets: number, reps: string, rest: string;
  if (ex.compound) {
    if (a.goal === 'strength' && lvl !== 'Beginner') { sets = 5; reps = '3-5'; rest = '2-3 min'; }
    else if (lvl === 'Beginner') { sets = 3; reps = '10-12'; rest = '90 sec'; }
    else if (lvl === 'Advanced') { sets = 4; reps = '6-8'; rest = '2 min'; }
    else { sets = 4; reps = '8-10'; rest = '90 sec'; }
  } else {
    sets = lvl === 'Beginner' ? 2 : 3; reps = '12-15'; rest = '60 sec';
  }
  if (ex.name === 'Plank') reps = '30-45 sec';
  if (deload) sets = Math.max(2, sets - 1);
  return { sets, reps, rest };
}

function cardioType(a: WeeklyAnalysis, stresses: Set<string>) {
  if (stresses.has('impact') || stresses.has('knee')) return 'Stationary cycling or swimming (low impact)';
  return locationOf(a.profile.workoutLocation) === 'gym' ? 'Incline treadmill walk or cycling' : 'Brisk outdoor walk';
}

function chooseFood(slot: FoodOption['slot'], a: WeeklyAnalysis, budgetMode: boolean, exclude: string[] = []): FoodOption[] {
  const allowed = allowedDiets(a.profile.dietPreference);
  const allergies = a.profile.foodAllergies.map(x => x.toLowerCase().trim()).filter(Boolean);
  const dislikes = a.profile.dislikedFoods.map(x => x.toLowerCase().trim()).filter(Boolean);
  return FOODS
    .filter(f => f.slot === slot && allowed.includes(f.diet) && !exclude.includes(f.name))
    .filter(f => !allergies.some(al => f.allergens.some(x => x.includes(al) || al.includes(x)) || f.name.toLowerCase().includes(al)))
    .filter(f => !dislikes.some(d => f.name.toLowerCase().includes(d)))
    .sort((x, y) => budgetMode
      ? x.costInr / Math.max(1, x.protein) - y.costInr / Math.max(1, y.protein)
      : y.protein / y.calories - x.protein / x.calories);
}

export function buildPlan(a: WeeklyAnalysis, v: PlanValues, recs: Recommendation[]) {
  const accepted = (titleStart: string) => recs.some(r => r.status !== 'rejected' && r.title.startsWith(titleStart));
  const deload = accepted('Lighter week');
  const budgetMode = accepted('Switch to lower-cost') || a.profile.dailyBudget < 300;

  // ---- dates for the upcoming week (starts today)
  const weekStart = localDateString();
  const weekEnd = addDays(weekStart, 6);
  const days = dateRange(weekStart, weekEnd);

  // ---- workouts
  const daysPerWeek = Math.max(2, Math.min(6, Math.round(v.workoutDays)));
  const split = SPLITS[daysPerWeek];
  const loc = locationOf(a.profile.workoutLocation);
  const stresses = injuryStresses(a.profile.injuries);

  // Missed sessions go first (mapped from last week's weekday -> session slot).
  let order = [...split.sessions];
  const lastWeekdays = trainingWeekdays(a.profile.workoutDaysPerWeek);
  const lastSplit = SPLITS[Math.max(2, Math.min(6, a.profile.workoutDaysPerWeek))]?.sessions ?? [];
  const missedKeys = a.workouts.missedDays
    .map(d => lastSplit[lastWeekdays.indexOf(new Date(`${d}T12:00:00`).getDay())])
    .filter((k): k is string => !!k && order.includes(k));
  if (missedKeys.length) order = [...new Set([...missedKeys, ...order])].slice(0, order.length);

  const maxExercises = a.profile.workoutDuration <= 45 ? 5 : a.profile.workoutDuration >= 75 ? 7 : 6;
  const trainingDays = trainingWeekdays(daysPerWeek);
  const sessionsPerDay = new Map<string, string>();
  let si = 0;
  for (const d of days) {
    if (si < order.length && trainingDays.includes(new Date(`${d}T12:00:00`).getDay())) sessionsPerDay.set(d, order[si++]);
  }
  // If the week started mid-pattern, put any remaining sessions on the earliest free days.
  for (const d of days) {
    if (si >= order.length) break;
    if (!sessionsPerDay.has(d)) sessionsPerDay.set(d, order[si++]);
  }

  // Cardio: ~30-min blocks on non-training days, always keeping one full rest day
  // (Sunday if possible); anything left goes after lifting sessions as shorter blocks.
  const freeDays = days.filter(d => !sessionsPerDay.has(d));
  const restDay = freeDays.find(d => new Date(`${d}T12:00:00`).getDay() === 0) ?? freeDays[freeDays.length - 1];
  const cardioDays = freeDays.filter(d => d !== restDay);
  const cardioPlan = new Map<string, number>();
  let remaining = Math.round(v.cardioMinutes);
  for (const d of cardioDays) {
    if (remaining <= 0) break;
    const m = Math.min(remaining, remaining > 45 ? 30 : remaining);
    cardioPlan.set(d, m);
    remaining -= m;
  }
  const liftDays = days.filter(d => sessionsPerDay.has(d));
  for (let i = 0; remaining > 0 && liftDays.length; i++) {
    const d = liftDays[i % liftDays.length];
    const m = Math.min(remaining, 15);
    cardioPlan.set(d, (cardioPlan.get(d) ?? 0) + m);
    remaining -= m;
    if (i > 40) break;
  }
  const cType = cardioType(a, stresses);

  const schedule = days.map(date => {
    const weekday = new Date(`${date}T12:00:00`).toLocaleDateString('en-US', { weekday: 'long' });
    const key = sessionsPerDay.get(date);
    const cardio = cardioPlan.get(date);
    if (key) {
      const tpl = SESSION_TEMPLATES[key];
      const exercises = tpl.slots
        .map(slot => pickExercise(slot, loc, stresses, a))
        .filter((e): e is Exercise => !!e)
        .filter((e, i, arr) => arr.findIndex(x => x.name === e.name) === i)
        .slice(0, maxExercises)
        .map(e => ({ name: e.name, muscles: e.muscles, ...prescription(e, a, deload) }));
      return {
        date, weekday, type: 'training' as const, title: tpl.title, focus: tpl.focus, exercises,
        cardio: cardio ? { minutes: cardio, type: cType, note: 'After lifting, easy pace' } : null,
        note: missedKeys.includes(key) && order.indexOf(key) < missedKeys.length ? 'Rescheduled from last week' : null
      };
    }
    if (cardio) {
      return { date, weekday, type: 'cardio' as const, title: 'Cardio & mobility', focus: `${cardio} min ${cType.toLowerCase()} + 10 min stretching`, exercises: [], cardio: { minutes: cardio, type: cType, note: 'Conversational pace (you can talk in sentences)' }, note: null };
    }
    return { date, weekday, type: 'rest' as const, title: 'Rest & recovery', focus: 'Easy walk (6,000–8,000 steps), light mobility', exercises: [], cardio: null, note: null };
  });

  // ---- nutrition
  const slots: Array<{ slot: FoodOption['slot']; label: string; share: number }> =
    a.profile.mealsPerDay <= 3
      ? [{ slot: 'breakfast', label: 'Breakfast', share: 0.3 }, { slot: 'lunch', label: 'Lunch', share: 0.4 }, { slot: 'dinner', label: 'Dinner', share: 0.3 }]
      : a.profile.mealsPerDay >= 5
        ? [{ slot: 'breakfast', label: 'Breakfast', share: 0.22 }, { slot: 'snack', label: 'Mid-morning snack', share: 0.1 }, { slot: 'lunch', label: 'Lunch', share: 0.3 }, { slot: 'snack', label: 'Evening snack', share: 0.1 }, { slot: 'dinner', label: 'Dinner', share: 0.28 }]
        : [{ slot: 'breakfast', label: 'Breakfast', share: 0.25 }, { slot: 'lunch', label: 'Lunch', share: 0.35 }, { slot: 'snack', label: 'Evening snack', share: 0.12 }, { slot: 'dinner', label: 'Dinner', share: 0.28 }];

  const used: string[] = [];
  const meals = slots.map(s => {
    const options = chooseFood(s.slot, a, budgetMode, used);
    const main = options[0];
    if (!main) return { label: s.label, name: 'Choose a balanced meal', portion: '', calories: Math.round(v.calories * s.share), protein: 0, costInr: 0, alternatives: [] as string[] };
    used.push(main.name);
    const target = v.calories * s.share;
    const scale = Math.max(0.75, Math.min(1.5, target / main.calories));
    return {
      label: s.label,
      name: main.name,
      portion: scale > 1.1 ? `${main.portion} (about ${Math.round(scale * 100)}% portion)` : scale < 0.9 ? `${main.portion} (about ${Math.round(scale * 100)}% portion)` : main.portion,
      calories: Math.round(main.calories * scale),
      protein: Math.round(main.protein * scale),
      costInr: Math.round(main.costInr * scale),
      alternatives: options.slice(1, 3).map(o => o.name)
    };
  });
  const mealProtein = meals.reduce((s, m) => s + m.protein, 0);
  const mealCalories = meals.reduce((s, m) => s + m.calories, 0);
  const sources = proteinSourcesFor(a);
  const proteinGap = v.protein - mealProtein;
  const topUp = proteinGap > 10 && sources.length
    ? `Add ${sources[0].name.toLowerCase()} or ${(sources[1] ?? sources[0]).name.toLowerCase()} to close the ~${Math.round(proteinGap)} g protein gap.`
    : null;

  const fats = Math.round((v.calories * 0.25) / 9);
  const carbs = Math.max(50, Math.round((v.calories - v.protein * 4 - fats * 9) / 4));

  const substitutions = [
    { instead: 'Paneer', use: 'Tofu or soya chunks', why: 'Similar protein, lower fat and cost' },
    { instead: 'White rice', use: 'Brown rice, millets or extra roti', why: 'More fibre, keeps you full longer' },
    { instead: 'Fried snacks', use: 'Roasted chana or sprouts chaat', why: 'Same crunch, more protein, fewer calories' },
    { instead: 'Sugary chai', use: 'Chai with less sugar or buttermilk', why: 'Cuts empty calories' },
    { instead: 'Chicken (if over budget)', use: 'Eggs or soya chunks', why: 'Much cheaper per gram of protein' }
  ].filter(s => {
    const allowed = allowedDiets(a.profile.dietPreference);
    if (!allowed.includes('nonveg') && s.instead.startsWith('Chicken')) return false;
    if (!allowed.includes('egg') && s.use.startsWith('Eggs')) return false;
    if (!allowed.includes('veg') && s.instead === 'Paneer') return false;
    return true;
  }).slice(0, 4);

  // ---- recovery
  const recovery = {
    sleepTargetHours: v.sleepHours,
    tips: [
      `Be in bed by the same time each night to get ${v.sleepHours} h`,
      'No caffeine after 2 pm; dim screens 30 minutes before bed',
      ...(deload ? ['This is a lighter training week: keep sessions easy and focus on form'] : []),
      ...(a.recovery.energyLevel != null && a.recovery.energyLevel <= 2 ? ['Have a carb + protein meal 1–2 hours before training'] : [])
    ],
    restDayActivities: ['6,000–8,000 steps of easy walking', '10–15 min mobility (hips, thoracic spine, shoulders)', 'Light yoga or stretching'],
    suggestions: [
      'Keep at least one full rest day per week',
      stresses.size ? `Your plan avoids exercises that heavily load your ${[...stresses].filter(s => s !== 'impact').join(', ').replace('_', ' ') || 'injured area'}` : 'Warm up 5–10 minutes before lifting'
    ]
  };

  // ---- weekly goals
  const goalProgress: Record<Goal, string> = {
    fat_loss: `Weight trend down 0.25–1% per week (about ${((a.body.latest?.weight ?? 70) * 0.0025).toFixed(1)}–${((a.body.latest?.weight ?? 70) * 0.01).toFixed(1)} kg), waist steady or lower`,
    muscle_gain: 'Weight up about 0.1–0.3 kg, add reps or load on at least 2 lifts',
    recomposition: 'Waist steady or lower while adding reps or load on at least 2 lifts',
    strength: 'Add load or reps on your main compound lifts',
    general: 'Complete every planned session and cardio block'
  };
  const goals = [
    { label: 'Workouts', target: `Complete ${daysPerWeek} of ${daysPerWeek} sessions`, why: 'Consistency drives every goal' },
    { label: 'Meal logging', target: 'Log meals on at least 6 of 7 days', why: 'Lets next week\'s plan adjust accurately' },
    { label: 'Protein', target: `Reach ${v.protein} g on at least 5 days`, why: 'Protects and builds muscle' },
    { label: 'Sleep', target: `${v.sleepHours} h on at least 5 nights`, why: 'Recovery and appetite control' },
    { label: 'Cardio', target: v.cardioMinutes > 0 ? `${v.cardioMinutes} minutes this week` : 'Optional', why: 'Heart health and energy use' },
    { label: 'Check-in', target: 'Weigh in once and answer the weekly check-in', why: 'Needed for the next adaptive update' },
    { label: 'Progress', target: goalProgress[a.goal], why: `What progress looks like for ${a.goalLabel}` }
  ];

  return {
    weekStart, weekEnd,
    values: v,
    nutrition: {
      calories: v.calories, protein: v.protein, carbs, fats, waterMl: v.waterMl,
      mealsPerDay: slots.length, sampleDay: meals, sampleDayTotals: { calories: mealCalories, protein: mealProtein, costInr: meals.reduce((s, m) => s + m.costInr, 0) },
      proteinTopUp: topUp,
      proteinSources: sources.slice(0, 5),
      substitutions,
      budgetMode,
      dietPreference: a.profile.dietPreference
    },
    workouts: {
      daysPerWeek, splitName: split.name, location: loc, deload, cardioMinutesPerWeek: v.cardioMinutes,
      cardioType: cType, schedule
    },
    recovery,
    goals
  };
}

// ---------------------------------------------------------------- comparison

export function buildComparison(a: WeeklyAnalysis, base: PlanValues, v: PlanValues, recs: Recommendation[]) {
  const reasonFor = (field: PlanField, custom: boolean) => {
    if (custom) return 'Changed by you.';
    const r = recs.find(x => x.change?.field === field && x.status !== 'rejected');
    if (r) return r.reason;
    const declined = recs.find(x => x.change?.field === field && x.status === 'rejected');
    if (declined) return `You declined "${declined.title}", so last week's value is kept.`;
    return 'No change needed based on your data.';
  };
  const row = (field: PlanField, previousActual: string | null, customised: boolean) => ({
    field,
    metric: FIELD_META[field].label,
    unit: FIELD_META[field].unit,
    previousTarget: base[field],
    previousActual,
    upcoming: v[field],
    changed: base[field] !== v[field],
    reason: reasonFor(field, customised)
  });
  return (custom: Partial<PlanValues>) => [
    row('workoutDays', `${a.workouts.completed} completed`, 'workoutDays' in custom),
    row('calories', a.current.avgCalories != null ? `${a.current.avgCalories} avg eaten` : 'not logged', 'calories' in custom),
    row('protein', a.current.avgProtein != null ? `${a.current.avgProtein} avg eaten` : 'not logged', 'protein' in custom),
    row('cardioMinutes', 'not tracked', 'cardioMinutes' in custom),
    row('sleepHours', a.recovery.sleepHours != null ? `${a.recovery.sleepHours} avg (${a.recovery.sleepSource})` : 'unknown', 'sleepHours' in custom),
    row('waterMl', a.current.avgWater != null ? `${a.current.avgWater} avg` : 'not logged', 'waterMl' in custom)
  ];
}
