/**
 * Weekly analysis built only from the authenticated user's stored data.
 * Nothing here is estimated by AI or randomised: every number traces back to a log.
 * Each metric carries a `source` so the UI can label it:
 *   recorded      – logged by the user in REPP (meals, workouts, measurements, water)
 *   self-reported – answered in the weekly feedback check-in
 *   profile       – a setting from onboarding/profile (e.g. usual sleep), not a measurement
 */
import type { PrismaClient } from '@prisma/client';
import { localDateString } from '../utils/date.js';

export type Goal = 'fat_loss' | 'muscle_gain' | 'recomposition' | 'strength' | 'general';
export type MetricSource = 'recorded' | 'self-reported' | 'profile';

export function normaliseGoal(goal: string | null | undefined): Goal {
  const g = (goal || '').toLowerCase();
  if (g.includes('fat') || g.includes('weight loss') || g.includes('cut')) return 'fat_loss';
  if (g.includes('muscle') || g.includes('bulk') || g.includes('gain')) return 'muscle_gain';
  if (g.includes('recomp')) return 'recomposition';
  if (g.includes('strength')) return 'strength';
  return 'general';
}

export const GOAL_LABELS: Record<Goal, string> = {
  fat_loss: 'Fat Loss',
  muscle_gain: 'Muscle Gain',
  recomposition: 'Body Recomposition',
  strength: 'Strength Improvement',
  general: 'General Fitness'
};

const round1 = (n: number) => Math.round(n * 10) / 10;

function addDays(iso: string, n: number): string {
  const d = new Date(`${iso}T12:00:00`);
  d.setDate(d.getDate() + n);
  return localDateString(d);
}

export function dateRange(start: string, end: string): string[] {
  const out: string[] = [];
  for (let d = start; d <= end; d = addDays(d, 1)) out.push(d);
  return out;
}

function parseJson<T>(value: unknown, fallback: T): T {
  let parsed: unknown = value;
  for (let i = 0; i < 3 && typeof parsed === 'string'; i++) {
    try { parsed = JSON.parse(parsed); } catch { return fallback; }
  }
  return (parsed ?? fallback) as T;
}

/** "60 kg" / "62.5kg" / 60 -> 60. Bodyweight / "Adjust load" -> null. */
function parseKg(value: unknown): number | null {
  if (typeof value === 'number' && value > 0) return value;
  if (typeof value !== 'string') return null;
  const m = value.match(/(\d+(?:\.\d+)?)\s*kg/i);
  return m ? Number(m[1]) : null;
}

/** "7.5 hours", "6 - 7 hours", "Less than 6 hours", "More than 8 hours" -> hours. */
export function parseSleepSetting(value: string | null | undefined): number | null {
  if (!value) return null;
  const v = value.toLowerCase();
  if (v.includes('less than')) return 5.5;
  if (v.includes('more than')) return 8.5;
  const nums = v.match(/\d+(?:\.\d+)?/g)?.map(Number) ?? [];
  if (!nums.length) return null;
  return nums.length > 1 ? (nums[0] + nums[1]) / 2 : nums[0];
}

/** Least-squares slope in kg per week over (dayIndex, value) points. */
function weeklySlope(points: Array<{ day: number; value: number }>): number | null {
  if (points.length < 2) return null;
  const n = points.length;
  const mx = points.reduce((a, p) => a + p.day, 0) / n;
  const my = points.reduce((a, p) => a + p.value, 0) / n;
  let num = 0, den = 0;
  for (const p of points) {
    num += (p.day - mx) * (p.value - my);
    den += (p.day - mx) ** 2;
  }
  return den === 0 ? null : (num / den) * 7;
}

interface WindowStats {
  start: string;
  end: string;
  days: string[];
  daily: Array<{ date: string; calories: number | null; protein: number | null; water: number | null; workout: string | null }>;
  daysWithMeals: number;
  avgCalories: number | null;
  avgProtein: number | null;
  proteinTargetDays: number;     // days logged where protein >= 90% of target
  calorieOnTargetDays: number;   // days logged within ±10% of calorie target
  avgWater: number | null;
  daysWithWater: number;
  workoutsDone: number;
  workoutDates: string[];
}

export interface WeeklyAnalysis {
  generatedAt: string;
  goal: Goal;
  goalLabel: string;
  window: { current: { start: string; end: string }; previous: { start: string; end: string } };
  profile: {
    name: string; sex: string; age: number; heightCm: number; experienceLevel: string;
    dietPreference: string; foodAllergies: string[]; dislikedFoods: string[]; dailyBudget: number;
    injuries: string[]; excludedExercises: string[]; workoutLocation: string;
    workoutDaysPerWeek: number; workoutDuration: number; mealsPerDay: number;
    targets: { calories: number; protein: number; carbs: number; fats: number; water: number };
    sleepSettingHours: number | null;
  };
  current: WindowStats;
  previous: WindowStats;
  hasPreviousWeekData: boolean;
  body: {
    weighIns28d: number;
    weightTrendKgPerWeek: number | null; // from all weigh-ins in the last 28 days
    weightTrendPctPerWeek: number | null;
    trendReliable: boolean;              // >= 3 weigh-ins spanning >= 14 days
    latest: { date: string; weight: number; waist: number | null; chest: number | null; arms: number | null } | null;
    change7d: { weight: number | null; waist: number | null; chest: number | null; arms: number | null }; // latest vs last weigh-in >= 7 days earlier
    changePrev7d: { weight: number | null; waist: number | null };
    waistTrendCmPerWeek: number | null;
    startOfJourney: { date: string; weight: number; waist: number | null } | null;
    recent: Array<{ date: string; weight: number; waist: number | null }>; // weigh-ins in the last 28 days
  };
  workouts: {
    planned: number;
    completed: number;
    completionPct: number | null;
    previousCompleted: number;
    previousCompletionPct: number | null;
    missedDays: string[];                // planned-weekday dates in the current window without a session
    strength: {
      compared: number;
      improved: Array<{ name: string; from: number; to: number }>;
      declined: Array<{ name: string; from: number; to: number }>;
      same: number;
    };
  };
  recovery: {
    sleepHours: number | null;
    sleepSource: MetricSource | null;
    energyLevel: number | null;          // 1-5 from feedback
    feedback: null | {
      weekStart: string; energyLevel: number; workoutManageable: number; mealsAffordable: number;
      proteinTargetMet: string; sleepQuality: number; sleepHours: number | null; difficulties: string; improvements: string;
    };
  };
  consistency: { score: number | null; previousScore: number | null; parts: Record<string, number | null> };
  dataGaps: Array<{ key: string; message: string; action: string }>;
}

async function windowStats(
  prisma: PrismaClient, userId: string, start: string, end: string,
  targets: { calories: number; protein: number }
): Promise<WindowStats> {
  const days = dateRange(start, end);
  const [logs, plans, water, sessions] = await Promise.all([
    prisma.mealLog.findMany({ where: { userId, date: { gte: start, lte: end } }, select: { date: true, calories: true, protein: true } }),
    // Diet-plan meals ticked off count as eaten on that plan's date.
    prisma.mealPlan.findMany({ where: { userId, date: { gte: start, lte: end } }, include: { meals: { where: { isCompleted: true } } } }),
    prisma.waterLog.findMany({ where: { userId, date: { gte: start, lte: end } } }),
    prisma.workoutSession.findMany({ where: { userId, date: { gte: start, lte: end } }, orderBy: { createdAt: 'asc' } })
  ]);

  const food = new Map<string, { calories: number; protein: number }>();
  const addFood = (date: string, c: number, p: number) => {
    const t = food.get(date) || { calories: 0, protein: 0 };
    t.calories += c; t.protein += p;
    food.set(date, t);
  };
  logs.forEach(l => addFood(l.date, l.calories, l.protein));
  plans.forEach(pl => pl.meals.forEach(m => addFood(pl.date, m.calories, m.protein)));

  const waterByDay = new Map(water.map(w => [w.date, w.amountMl]));
  const workoutByDay = new Map<string, string>();
  sessions.forEach(s => workoutByDay.set(s.date, s.dayName));

  const loggedDays = [...food.values()];
  const avg = (k: 'calories' | 'protein') => (loggedDays.length ? Math.round(loggedDays.reduce((a, d) => a + d[k], 0) / loggedDays.length) : null);
  const waterVals = [...waterByDay.values()].filter(v => v > 0);

  return {
    start, end, days,
    daily: days.map(date => ({
      date,
      calories: food.get(date)?.calories ?? null,
      protein: food.get(date)?.protein ?? null,
      water: waterByDay.get(date) ?? null,
      workout: workoutByDay.get(date) ?? null
    })),
    daysWithMeals: loggedDays.length,
    avgCalories: avg('calories'),
    avgProtein: avg('protein'),
    proteinTargetDays: loggedDays.filter(d => d.protein >= targets.protein * 0.9).length,
    calorieOnTargetDays: loggedDays.filter(d => Math.abs(d.calories - targets.calories) <= targets.calories * 0.1).length,
    avgWater: waterVals.length ? Math.round(waterVals.reduce((a, b) => a + b, 0) / waterVals.length) : null,
    daysWithWater: waterVals.length,
    workoutsDone: workoutByDay.size,
    workoutDates: [...workoutByDay.keys()]
  };
}

function consistencyScore(w: WindowStats, plannedWorkouts: number, waterTarget: number) {
  const n = w.days.length;
  const parts = {
    workouts: plannedWorkouts > 0 ? Math.min(1, w.workoutsDone / plannedWorkouts) : null,
    mealLogging: w.daysWithMeals / n,
    protein: w.proteinTargetDays / n,
    water: w.daysWithWater ? Math.min(1, (w.avgWater ?? 0) / waterTarget) * (w.daysWithWater / n) : 0
  };
  const anyData = w.workoutsDone + w.daysWithMeals + w.daysWithWater > 0;
  if (!anyData) return { score: null, parts };
  const weights = { workouts: 0.4, mealLogging: 0.25, protein: 0.2, water: 0.15 };
  let total = 0, wsum = 0;
  for (const [k, wt] of Object.entries(weights)) {
    const v = parts[k as keyof typeof parts];
    if (v == null) continue;
    total += v * wt; wsum += wt;
  }
  return {
    score: wsum ? Math.round((total / wsum) * 100) : null,
    parts: Object.fromEntries(Object.entries(parts).map(([k, v]) => [k, v == null ? null : Math.round(v * 100)]))
  };
}

/** Which weekdays (0=Sun..6=Sat) a split with N training days normally uses. */
export function trainingWeekdays(daysPerWeek: number): number[] {
  const map: Record<number, number[]> = {
    2: [1, 4], 3: [1, 3, 5], 4: [1, 2, 4, 5], 5: [1, 2, 3, 5, 6], 6: [1, 2, 3, 4, 5, 6], 7: [0, 1, 2, 3, 4, 5, 6]
  };
  return map[Math.max(2, Math.min(7, daysPerWeek))];
}

export async function buildWeeklyAnalysis(prisma: PrismaClient, userId: string): Promise<WeeklyAnalysis | null> {
  const profile = await prisma.profile.findUnique({ where: { userId } });
  if (!profile) return null;

  const today = localDateString();
  // Analyse the last 7 complete days (today is still in progress).
  const curEnd = addDays(today, -1);
  const curStart = addDays(curEnd, -6);
  const prevEnd = addDays(curStart, -1);
  const prevStart = addDays(prevEnd, -6);

  const targets = {
    calories: profile.dailyCalorieTarget,
    protein: profile.proteinTarget,
    carbs: profile.carbsTarget,
    fats: profile.fatsTarget,
    water: profile.waterTarget
  };

  // Planned training days for each window: the accepted plan for that week if any, else the profile setting.
  const acceptedPlans = await prisma.weeklyPlan.findMany({
    where: { userId, status: { in: ['accepted', 'archived'] } },
    orderBy: { weekStart: 'desc' },
    take: 4
  });
  const plannedFor = (start: string) => {
    const p = acceptedPlans.find(ap => ap.weekStart <= start && ap.weekEnd >= start);
    const days = p ? parseJson<any>(p.plan, {})?.workouts?.daysPerWeek : null;
    return typeof days === 'number' ? days : profile.workoutDaysPerWeek;
  };
  // Only count days since the account existed: a new user hasn't "missed" workouts before signing up.
  const activeSince = localDateString(profile.createdAt);
  const plannedInWindow = (start: string, end: string, perWeek: number) => {
    if (activeSince <= start) return perWeek;
    const weekdays = trainingWeekdays(perWeek);
    return dateRange(start, end).filter(d => d >= activeSince && weekdays.includes(new Date(`${d}T12:00:00`).getDay())).length;
  };
  const scheduledCur = plannedFor(curStart);
  const plannedCur = plannedInWindow(curStart, curEnd, scheduledCur);
  const plannedPrev = plannedInWindow(prevStart, prevEnd, plannedFor(prevStart));

  const [current, previous] = await Promise.all([
    windowStats(prisma, userId, curStart, curEnd, targets),
    windowStats(prisma, userId, prevStart, prevEnd, targets)
  ]);

  // ---------- body measurements ----------
  const allMeasurements = await prisma.bodyMeasurement.findMany({
    where: { userId },
    orderBy: [{ date: 'asc' }, { createdAt: 'asc' }]
  });
  const latest = allMeasurements[allMeasurements.length - 1] ?? null;
  const lastOnOrBefore = (date: string) => [...allMeasurements].reverse().find(m => m.date <= date) ?? null;
  const diff = (a: number | null | undefined, b: number | null | undefined) => (a != null && b != null ? round1(a - b) : null);

  const weekAgoRef = latest ? lastOnOrBefore(addDays(latest.date, -7)) : null;
  const twoWeeksAgoRef = weekAgoRef ? lastOnOrBefore(addDays(weekAgoRef.date, -7)) : null;

  const since28 = addDays(today, -28);
  const recent = allMeasurements.filter(m => m.date >= since28);
  const dayIndex = (iso: string) => (new Date(`${iso}T12:00:00`).getTime() - new Date(`${since28}T12:00:00`).getTime()) / 86400000;
  const slope = weeklySlope(recent.map(m => ({ day: dayIndex(m.date), value: m.weight })));
  const waistSlope = weeklySlope(recent.filter(m => m.waist != null).map(m => ({ day: dayIndex(m.date), value: m.waist as number })));
  const spanDays = recent.length > 1 ? dayIndex(recent[recent.length - 1].date) - dayIndex(recent[0].date) : 0;
  const first = allMeasurements[0] ?? null;

  // ---------- strength: best working weight per exercise, this week vs the 4 weeks before ----------
  const strengthSessions = await prisma.workoutSession.findMany({
    where: { userId, date: { gte: addDays(curStart, -28), lte: curEnd } },
    select: { date: true, completedExercises: true }
  });
  const best = (from: string, to: string) => {
    const map = new Map<string, number>();
    for (const s of strengthSessions) {
      if (s.date < from || s.date > to) continue;
      for (const ex of parseJson<any[]>(s.completedExercises, [])) {
        if (!ex?.name) continue;
        const kg = parseKg(ex.weight ?? ex.targetWeight);
        if (kg == null) continue;
        map.set(ex.name, Math.max(map.get(ex.name) ?? 0, kg));
      }
    }
    return map;
  };
  const bestNow = best(curStart, curEnd);
  const bestBefore = best(addDays(curStart, -28), prevEnd);
  const improved: Array<{ name: string; from: number; to: number }> = [];
  const declined: Array<{ name: string; from: number; to: number }> = [];
  let same = 0;
  for (const [name, now] of bestNow) {
    const before = bestBefore.get(name);
    if (before == null) continue;
    if (now > before) improved.push({ name, from: before, to: now });
    else if (now < before) declined.push({ name, from: before, to: now });
    else same++;
  }

  const plannedWeekdays = trainingWeekdays(scheduledCur);
  const missedDays = current.days.filter(d => {
    const wd = new Date(`${d}T12:00:00`).getDay();
    return d >= activeSince && plannedWeekdays.includes(wd) && !current.workoutDates.includes(d);
  }).slice(0, Math.max(0, plannedCur - current.workoutsDone));

  // ---------- recovery: feedback for the analysed week (or the latest one) ----------
  const feedbackRow =
    (await prisma.weeklyFeedback.findFirst({ where: { userId, weekStart: curStart } })) ??
    (await prisma.weeklyFeedback.findFirst({ where: { userId, weekStart: { gte: addDays(curStart, -7) } }, orderBy: { weekStart: 'desc' } }));
  const sleepSetting = parseSleepSetting(profile.sleepDuration);
  const sleepHours = feedbackRow?.sleepHours ?? sleepSetting;
  const sleepSource: MetricSource | null = feedbackRow?.sleepHours != null ? 'self-reported' : sleepSetting != null ? 'profile' : null;

  const curScore = consistencyScore(current, plannedCur, targets.water);
  const prevScore = consistencyScore(previous, plannedPrev, targets.water);

  // ---------- what's missing ----------
  const dataGaps: WeeklyAnalysis['dataGaps'] = [];
  const weighInsThisWeek = allMeasurements.filter(m => m.date >= curStart && m.date <= today).length;
  if (!latest) {
    dataGaps.push({ key: 'no_measurements', message: 'No body measurements recorded yet.', action: 'Log your weight and waist on the Progress tab.' });
  } else if (weighInsThisWeek === 0) {
    dataGaps.push({ key: 'no_weighin_week', message: `No weigh-in in the last 7 days (last one ${latest.date}).`, action: 'Log your weight and waist on the Progress tab so the trend stays accurate.' });
  }
  if (recent.length < 3 || spanDays < 14) {
    dataGaps.push({ key: 'weight_trend', message: `Only ${recent.length} weigh-in${recent.length === 1 ? '' : 's'} in the last 4 weeks, so calorie targets won't be changed yet.`, action: 'Weigh in at least once a week, same time of day.' });
  }
  if (current.daysWithMeals < 4) {
    dataGaps.push({ key: 'meals', message: `Meals were logged on only ${current.daysWithMeals} of 7 days.`, action: 'Log meals on Log & Scan Meal or tick them off in your diet plan.' });
  }
  if (!feedbackRow) {
    dataGaps.push({ key: 'feedback', message: 'No weekly check-in yet, so sleep and energy are based on your profile setting, not this week.', action: 'Answer the weekly check-in below (1 minute).' });
  }
  if (current.daysWithWater === 0) {
    dataGaps.push({ key: 'water', message: 'No water intake logged this week.', action: 'Use the water tracker on the Dashboard.' });
  }

  const hasPreviousWeekData = previous.daysWithMeals + previous.workoutsDone + previous.daysWithWater > 0;

  return {
    generatedAt: new Date().toISOString(),
    goal: normaliseGoal(profile.primaryGoal),
    goalLabel: profile.primaryGoal || GOAL_LABELS[normaliseGoal(profile.primaryGoal)],
    window: { current: { start: curStart, end: curEnd }, previous: { start: prevStart, end: prevEnd } },
    profile: {
      name: profile.name, sex: profile.sex, age: profile.age, heightCm: profile.height,
      experienceLevel: profile.experienceLevel, dietPreference: profile.dietPreference,
      foodAllergies: parseJson<string[]>(profile.foodAllergies, []), dislikedFoods: parseJson<string[]>(profile.dislikedFoods, []),
      dailyBudget: profile.dailyBudget, injuries: parseJson<string[]>(profile.injuries, []),
      excludedExercises: parseJson<string[]>(profile.excludedExercises, []), workoutLocation: profile.workoutLocation,
      workoutDaysPerWeek: scheduledCur, workoutDuration: profile.workoutDuration, mealsPerDay: profile.mealsPerDay,
      targets, sleepSettingHours: sleepSetting
    },
    current,
    previous,
    hasPreviousWeekData,
    body: {
      weighIns28d: recent.length,
      weightTrendKgPerWeek: slope != null ? round1(slope * 10) / 10 : null,
      weightTrendPctPerWeek: slope != null && latest ? Math.round((slope / latest.weight) * 1000) / 10 : null,
      trendReliable: recent.length >= 3 && spanDays >= 14,
      latest: latest ? { date: latest.date, weight: latest.weight, waist: latest.waist, chest: latest.chest, arms: latest.arms } : null,
      change7d: {
        weight: diff(latest?.weight, weekAgoRef?.weight),
        waist: diff(latest?.waist, weekAgoRef?.waist),
        chest: diff(latest?.chest, weekAgoRef?.chest),
        arms: diff(latest?.arms, weekAgoRef?.arms)
      },
      changePrev7d: {
        weight: diff(weekAgoRef?.weight, twoWeeksAgoRef?.weight),
        waist: diff(weekAgoRef?.waist, twoWeeksAgoRef?.waist)
      },
      waistTrendCmPerWeek: waistSlope != null ? round1(waistSlope) : null,
      startOfJourney: first ? { date: first.date, weight: first.weight, waist: first.waist } : null,
      recent: recent.map(m => ({ date: m.date, weight: m.weight, waist: m.waist }))
    },
    workouts: {
      planned: plannedCur,
      completed: current.workoutsDone,
      completionPct: plannedCur ? Math.min(100, Math.round((current.workoutsDone / plannedCur) * 100)) : null, // null = no training days since signing up
      previousCompleted: previous.workoutsDone,
      previousCompletionPct: plannedPrev ? Math.min(100, Math.round((previous.workoutsDone / plannedPrev) * 100)) : null,
      missedDays,
      strength: { compared: improved.length + declined.length + same, improved, declined, same }
    },
    recovery: {
      sleepHours: sleepHours != null ? round1(sleepHours) : null,
      sleepSource,
      energyLevel: feedbackRow?.energyLevel ?? null,
      feedback: feedbackRow ? {
        weekStart: feedbackRow.weekStart, energyLevel: feedbackRow.energyLevel, workoutManageable: feedbackRow.workoutManageable,
        mealsAffordable: feedbackRow.mealsAffordable, proteinTargetMet: feedbackRow.proteinTargetMet, sleepQuality: feedbackRow.sleepQuality,
        sleepHours: feedbackRow.sleepHours, difficulties: feedbackRow.difficulties, improvements: feedbackRow.improvements
      } : null
    },
    consistency: { score: curScore.score, previousScore: hasPreviousWeekData ? prevScore.score : null, parts: curScore.parts },
    dataGaps
  };
}

export { addDays };
