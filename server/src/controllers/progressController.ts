import { Request, Response } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { localDateString } from '../utils/date.js';

const prisma = new PrismaClient();

const TIMEFRAMES: Record<string, number> = { '7d': 7, '30d': 30, '60d': 60, '90d': 90, '180d': 180 };

function resolveDays(timeframe: unknown): number {
  return TIMEFRAMES[String(timeframe)] ?? 30;
}

function isoDate(d: Date): string {
  return localDateString(d);
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

/** Everything the Progress page and the downloadable report need, computed from the user's own logs. */
async function buildProgressSummary(userId: string, days: number) {
  const today = new Date();
  const start = new Date(today);
  start.setDate(start.getDate() - (days - 1));
  const startStr = isoDate(start);
  const endStr = isoDate(today);

  const [profile, measurements, baseline, workoutsInPeriod, totalWorkouts, mealLogs, bodyVisionReports] = await Promise.all([
    prisma.profile.findUnique({ where: { userId } }),
    prisma.bodyMeasurement.findMany({
      where: { userId, date: { gte: startStr } },
      orderBy: [{ date: 'asc' }, { createdAt: 'asc' }]
    }),
    // Last weigh-in before the period: the starting point for "change during this period".
    prisma.bodyMeasurement.findFirst({
      where: { userId, date: { lt: startStr } },
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }]
    }),
    prisma.workoutSession.count({ where: { userId, date: { gte: startStr } } }),
    prisma.workoutSession.count({ where: { userId } }),
    prisma.mealLog.findMany({ where: { userId, date: { gte: startStr } } }),
    prisma.bodyVisionReport.findMany({
      where: { userId, createdAt: { gte: start } },
      orderBy: { createdAt: 'asc' }
    })
  ]);

  // Weight & waist change across the period, measured from the last weigh-in before it
  // (or the first one inside it for new users).
  const last = measurements[measurements.length - 1];
  const startWeight = baseline?.weight ?? measurements[0]?.weight ?? null;
  const hasTrend = last != null && startWeight != null && (baseline != null || measurements.length > 1);
  const waistPoints = measurements.filter(m => m.waist != null);
  const firstWaist = baseline?.waist ?? waistPoints[0]?.waist ?? null;
  const lastWaist = waistPoints[waistPoints.length - 1]?.waist ?? null;
  const hasWaistTrend = lastWaist != null && firstWaist != null && (baseline?.waist != null || waistPoints.length > 1);

  // Nutrition: average per day that has at least one logged meal
  const perDay = new Map<string, { calories: number; protein: number }>();
  for (const m of mealLogs) {
    const d = perDay.get(m.date) || { calories: 0, protein: 0 };
    d.calories += m.calories;
    d.protein += m.protein;
    perDay.set(m.date, d);
  }
  const daysLogged = perDay.size;
  const avgCalories = daysLogged ? Math.round([...perDay.values()].reduce((a, d) => a + d.calories, 0) / daysLogged) : null;
  const avgProtein = daysLogged ? Math.round([...perDay.values()].reduce((a, d) => a + d.protein, 0) / daysLogged) : null;
  const proteinTarget = profile?.proteinTarget ?? null;
  const proteinAdherence = avgProtein != null && proteinTarget
    ? Math.min(100, Math.round((avgProtein / proteinTarget) * 100))
    : null;

  const firstScan = bodyVisionReports[0];
  const lastScan = bodyVisionReports[bodyVisionReports.length - 1];

  return {
    period: { days, start: startStr, end: endStr },
    profile: {
      name: profile?.name || 'Athlete',
      goal: profile?.primaryGoal || '',
      currentWeight: profile?.weight ?? null,
      targetWeight: profile?.targetWeight ?? null,
      currentWaist: profile?.waist ?? null,
      dailyCalorieTarget: profile?.dailyCalorieTarget ?? null,
      proteinTarget,
      streakDays: profile?.streakDays ?? 0
    },
    measurements,
    baseline: baseline ? { date: baseline.date, weight: baseline.weight, waist: baseline.waist } : null,
    weight: {
      start: startWeight,
      end: last?.weight ?? null,
      delta: hasTrend ? round1(last.weight - (startWeight as number)) : null
    },
    waist: {
      start: firstWaist,
      end: lastWaist,
      delta: hasWaistTrend ? round1((lastWaist as number) - (firstWaist as number)) : null
    },
    workouts: { inPeriod: workoutsInPeriod, allTime: totalWorkouts },
    nutrition: { daysLogged, avgCalories, avgProtein, proteinAdherence },
    bodyVision: {
      scans: bodyVisionReports.length,
      first: firstScan ? { date: firstScan.date, range: firstScan.estimatedBodyFatRange } : null,
      latest: lastScan ? { date: lastScan.date, range: lastScan.estimatedBodyFatRange } : null
    }
  };
}

type ProgressSummary = Awaited<ReturnType<typeof buildProgressSummary>>;

function signed(n: number, unit: string): string {
  return `${n > 0 ? '+' : ''}${n} ${unit}`;
}

/** Plain-language highlights derived only from logged data (no invented numbers). */
function buildHighlights(s: ProgressSummary): string[] {
  const out: string[] = [];

  if (s.weight.delta != null) {
    out.push(`Scale weight changed ${signed(s.weight.delta, 'kg')} (${s.weight.start} kg → ${s.weight.end} kg).`);
  } else {
    out.push('Log at least two weigh-ins in this period to see a weight trend.');
  }

  if (s.profile.targetWeight != null && s.weight.end != null) {
    const remaining = round1(s.weight.end - s.profile.targetWeight);
    out.push(
      remaining === 0
        ? `You are at your target weight of ${s.profile.targetWeight} kg.`
        : `${Math.abs(remaining)} kg to go to reach your target of ${s.profile.targetWeight} kg.`
    );
  }

  if (s.waist.delta != null) {
    out.push(`Waist changed ${signed(s.waist.delta, 'cm')} (${s.waist.start} cm → ${s.waist.end} cm).`);
  }

  out.push(`Completed ${s.workouts.inPeriod} workout${s.workouts.inPeriod === 1 ? '' : 's'} in this period (${s.workouts.allTime} all-time).`);

  if (s.nutrition.daysLogged > 0) {
    out.push(
      `Logged meals on ${s.nutrition.daysLogged} of ${s.period.days} days, averaging ${s.nutrition.avgCalories} kcal and ${s.nutrition.avgProtein} g protein per logged day.`
    );
    if (s.nutrition.proteinAdherence != null) {
      out.push(`Protein intake reached ${s.nutrition.proteinAdherence}% of your ${s.profile.proteinTarget} g daily target on logged days.`);
    }
  } else {
    out.push('No meals were logged in this period.');
  }

  if (s.bodyVision.latest) {
    out.push(
      s.bodyVision.scans > 1 && s.bodyVision.first
        ? `BodyVision estimate moved from ${s.bodyVision.first.range} to ${s.bodyVision.latest.range} across ${s.bodyVision.scans} scans.`
        : `Latest BodyVision estimate: ${s.bodyVision.latest.range} (${s.bodyVision.latest.date}).`
    );
  }

  return out;
}

export async function getProgressData(req: Request, res: Response): Promise<void> {
  const summary = await buildProgressSummary(req.user!.userId, resolveDays(req.query.timeframe));
  res.json({ ...summary, highlights: buildHighlights(summary) });
}

const measurementSchema = z.object({
  weight: z.coerce.number({ invalid_type_error: 'Weight must be a number' }).min(20, 'Weight looks too low').max(400, 'Weight looks too high'),
  waist: z.coerce.number().min(30).max(250).optional().nullable(),
  chest: z.coerce.number().min(30).max(250).optional().nullable(),
  arms: z.coerce.number().min(10).max(100).optional().nullable(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional()
});

export async function logMeasurement(req: Request, res: Response): Promise<void> {
  const userId = req.user!.userId;
  const { weight, waist, chest, arms, date } = measurementSchema.parse(req.body);
  const logDate = date || isoDate(new Date());

  const measurement = await prisma.bodyMeasurement.create({
    data: {
      userId,
      date: logDate,
      weight,
      waist: waist ?? null,
      chest: chest ?? null,
      arms: arms ?? null
    }
  });

  // Update profile current weight & measurements
  await prisma.profile.update({
    where: { userId },
    data: {
      weight,
      ...(waist ? { waist } : {}),
      ...(chest ? { chest } : {}),
      ...(arms ? { arms } : {})
    }
  });

  res.status(201).json({ measurement });
}

type BreakdownUnit = 'month' | 'week' | 'day';

/** Period length for the report breakdown: monthly for 60+ days, weekly for ~30 days, daily for a week. */
function breakdownUnit(days: number): { unit: BreakdownUnit; size: number } {
  if (days >= 60) return { unit: 'month', size: 30 };
  if (days >= 28) return { unit: 'week', size: 7 };
  return { unit: 'day', size: 1 };
}

const shortDate = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

/**
 * Splits the report window into consecutive periods (counted back from today) and
 * computes the change in each one. A period's starting weight is the last weigh-in
 * before it, so changes chain together and add up to the overall change.
 */
async function buildBreakdown(userId: string, days: number) {
  const { unit, size } = breakdownUnit(days);
  const today = new Date();
  const offsetToDate = (offset: number) => {
    const d = new Date(today);
    d.setDate(d.getDate() - offset);
    return isoDate(d);
  };

  // Buckets as [startOffset, endOffset] in days before today, oldest first.
  const buckets: Array<{ startOffset: number; endOffset: number }> = [];
  for (let end = 0; end < days; end += size) {
    buckets.unshift({ startOffset: Math.min(end + size, days) - 1, endOffset: end });
  }
  // Fold a short leftover at the start (e.g. 2 days) into the next period.
  if (buckets.length > 1 && buckets[0].startOffset - buckets[0].endOffset + 1 < size / 2) {
    buckets[1].startOffset = buckets[0].startOffset;
    buckets.shift();
  }

  const windowStart = offsetToDate(days - 1);
  const [measurements, sessions, meals] = await Promise.all([
    prisma.bodyMeasurement.findMany({ where: { userId }, orderBy: [{ date: 'asc' }, { createdAt: 'asc' }] }),
    prisma.workoutSession.findMany({ where: { userId, date: { gte: windowStart } }, select: { date: true } }),
    prisma.mealLog.findMany({ where: { userId, date: { gte: windowStart } }, select: { date: true, calories: true, protein: true } })
  ]);

  const lastBefore = (date: string, key: 'weight' | 'waist') => {
    for (let i = measurements.length - 1; i >= 0; i--) {
      const m = measurements[i];
      if (m.date < date && m[key] != null) return m[key] as number;
    }
    return null;
  };

  const periods = buckets.map((b, i) => {
    const start = offsetToDate(b.startOffset);
    const end = offsetToDate(b.endOffset);
    const inside = measurements.filter(m => m.date >= start && m.date <= end);

    const change = (key: 'weight' | 'waist') => {
      const points = inside.filter(m => m[key] != null).map(m => m[key] as number);
      if (points.length === 0) return { start: null, end: null, delta: null };
      const from = lastBefore(start, key) ?? points[0];
      const to = points[points.length - 1];
      const hasBaseline = lastBefore(start, key) != null || points.length > 1;
      return { start: from, end: to, delta: hasBaseline ? round1(to - from) : null };
    };

    const dayTotals = new Map<string, { calories: number; protein: number }>();
    for (const m of meals) {
      if (m.date < start || m.date > end) continue;
      const t = dayTotals.get(m.date) || { calories: 0, protein: 0 };
      t.calories += m.calories;
      t.protein += m.protein;
      dayTotals.set(m.date, t);
    }
    const logged = [...dayTotals.values()];
    const avg = (k: 'calories' | 'protein') => (logged.length ? Math.round(logged.reduce((a, t) => a + t[k], 0) / logged.length) : null);

    const label = unit === 'month' ? `Month ${i + 1}` : unit === 'week' ? `Week ${i + 1}` : new Date(`${start}T00:00:00`).toLocaleDateString('en-US', { weekday: 'short' });

    return {
      label,
      start,
      end,
      range: start === end ? shortDate(start) : `${shortDate(start)} – ${shortDate(end)}`,
      days: b.startOffset - b.endOffset + 1,
      weighIns: inside.length,
      weight: change('weight'),
      waist: change('waist'),
      workouts: sessions.filter(s => s.date >= start && s.date <= end).length,
      daysLogged: logged.length,
      avgCalories: avg('calories'),
      avgProtein: avg('protein')
    };
  });

  return { unit, periods };
}

export async function generateReport(req: Request, res: Response): Promise<void> {
  const userId = req.user!.userId;
  const days = resolveDays(req.body?.timeframe);
  const [summary, breakdown] = await Promise.all([buildProgressSummary(userId, days), buildBreakdown(userId, days)]);

  res.json({
    report: {
      generatedDate: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      ...summary,
      highlights: buildHighlights(summary),
      breakdown
    }
  });
}

export const MEASUREMENT_INTERVAL_DAYS = 7;

/** Whole calendar days between two YYYY-MM-DD dates (b - a). */
function daysBetween(a: string, b: string): number {
  const [ay, am, ad] = a.split('-').map(Number);
  const [by, bm, bd] = b.split('-').map(Number);
  return Math.round((Date.UTC(by, bm - 1, bd) - Date.UTC(ay, am - 1, ad)) / 86400000);
}

/** Weekly check-in status: when the user last logged measurements and whether a new one is due. */
export async function getMeasurementReminder(req: Request, res: Response): Promise<void> {
  const userId = req.user!.userId;
  const today = localDateString();

  const last = await prisma.bodyMeasurement.findFirst({
    where: { userId },
    orderBy: [{ date: 'desc' }, { createdAt: 'desc' }]
  });

  if (!last) {
    res.json({ intervalDays: MEASUREMENT_INTERVAL_DAYS, lastDate: null, daysSince: null, due: true, daysUntilDue: 0, nextDueDate: today });
    return;
  }

  const daysSince = Math.max(0, daysBetween(last.date, today));
  const next = new Date(`${last.date}T00:00:00`);
  next.setDate(next.getDate() + MEASUREMENT_INTERVAL_DAYS);

  res.json({
    intervalDays: MEASUREMENT_INTERVAL_DAYS,
    lastDate: last.date,
    lastWeight: last.weight,
    daysSince,
    due: daysSince >= MEASUREMENT_INTERVAL_DAYS,
    daysUntilDue: Math.max(0, MEASUREMENT_INTERVAL_DAYS - daysSince),
    nextDueDate: localDateString(next)
  });
}
