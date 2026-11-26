import { Request, Response } from 'express';
import { z } from 'zod';
import { PrismaClient, type WeeklyPlan } from '@prisma/client';
import { aiService } from '../ai/aiService.js';
import { config } from '../config.js';
import { buildAdaptiveSummaryPrompt } from '../ai/prompts/adaptiveReviewPrompt.js';
import { buildWeeklyAnalysis, addDays, type WeeklyAnalysis } from '../adaptive/analysis.js';
import {
  baselineValues, resolveValues, buildInsights, buildRecommendations, buildPlan, buildComparison,
  FIELD_META, type PlanValues, type Recommendation, type PlanField
} from '../adaptive/planner.js';
import { serializeProfile } from '../utils/profileSerializer.js';

const prisma = new PrismaClient();

const parse = <T,>(value: string | null | undefined, fallback: T): T => {
  try { return value ? (JSON.parse(value) as T) : fallback; } catch { return fallback; }
};

async function previousAcceptedValues(userId: string): Promise<Partial<PlanValues> | null> {
  const prev = await prisma.weeklyPlan.findFirst({ where: { userId, status: 'accepted' }, orderBy: { acceptedAt: 'desc' } });
  return prev ? parse<any>(prev.plan, {})?.values ?? null : null;
}

function serialize(row: WeeklyPlan) {
  const analysis = parse<WeeklyAnalysis | null>(row.analysis, null);
  const recommendations = parse<Recommendation[]>(row.recommendations, []);
  const plan = parse<any>(row.plan, {});
  const customizations = parse<Partial<PlanValues>>(row.customizations, {});
  const base: PlanValues | null = plan.baseValues ?? null;
  const comparison = analysis && base && plan.values ? buildComparison(analysis, base, plan.values, recommendations)(customizations) : [];
  return {
    id: row.id,
    weekStart: row.weekStart,
    weekEnd: row.weekEnd,
    status: row.status,
    source: row.source,
    analysis,
    insights: parse(row.insights, []),
    recommendations,
    plan,
    customizations,
    comparison,
    aiSummary: parse<any>(row.aiSummary, null),
    aiSummaryModel: row.aiSummaryModel,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    acceptedAt: row.acceptedAt
  };
}

/** Rebuild plan content after recommendation decisions or customisations change. */
async function rebuildAndSave(row: WeeklyPlan, recs: Recommendation[], customizations: Partial<PlanValues>) {
  const analysis = parse<WeeklyAnalysis | null>(row.analysis, null);
  const oldPlan = parse<any>(row.plan, {});
  if (!analysis || !oldPlan.baseValues) throw Object.assign(new Error('This plan is missing its analysis and cannot be edited. Generate a new plan.'), { status: 409 });
  const values = resolveValues(oldPlan.baseValues, recs, customizations);
  const plan = { ...buildPlan(analysis, values, recs), baseValues: oldPlan.baseValues, weekStart: oldPlan.weekStart, weekEnd: oldPlan.weekEnd };
  return prisma.weeklyPlan.update({
    where: { id: row.id },
    data: { recommendations: JSON.stringify(recs), customizations: JSON.stringify(customizations), plan: JSON.stringify(plan) }
  });
}

async function ownedPlan(req: Request, res: Response): Promise<WeeklyPlan | null> {
  const row = await prisma.weeklyPlan.findFirst({ where: { id: String(req.params.id), userId: req.user!.userId } });
  if (!row) res.status(404).json({ error: 'Plan not found' });
  return row;
}

function requireDraft(row: WeeklyPlan, res: Response): boolean {
  if (row.status !== 'draft') {
    res.status(409).json({ error: `This plan is ${row.status} and can no longer be changed. Generate a new plan to make changes.` });
    return false;
  }
  return true;
}

// ---------------------------------------------------------------- overview

export async function getOverview(req: Request, res: Response): Promise<void> {
  const userId = req.user!.userId;
  const analysis = await buildWeeklyAnalysis(prisma, userId);
  if (!analysis) {
    res.status(404).json({ error: 'Profile not found' });
    return;
  }

  const [draft, accepted, historyCount] = await Promise.all([
    prisma.weeklyPlan.findFirst({ where: { userId, status: 'draft' }, orderBy: { createdAt: 'desc' } }),
    prisma.weeklyPlan.findFirst({ where: { userId, status: 'accepted' }, orderBy: { acceptedAt: 'desc' } }),
    prisma.weeklyPlan.count({ where: { userId, status: { in: ['accepted', 'archived'] } } })
  ]);

  res.json({
    analysis,
    insights: buildInsights(analysis),
    draft: draft ? serialize(draft) : null,
    accepted: accepted ? serialize(accepted) : null,
    historyCount,
    aiConfigured: { model: aiService.textModelName }
  });
}

// ---------------------------------------------------------------- generate

export async function generatePlan(req: Request, res: Response): Promise<void> {
  const userId = req.user!.userId;
  const replace = req.body?.replace === true;

  const existingDraft = await prisma.weeklyPlan.findFirst({ where: { userId, status: 'draft' }, orderBy: { createdAt: 'desc' } });
  if (existingDraft && !replace) {
    res.status(409).json({ error: 'You already have a draft plan. Confirm to replace it with a newly generated one.', draftId: existingDraft.id, needsConfirmation: true });
    return;
  }

  const analysis = await buildWeeklyAnalysis(prisma, userId);
  if (!analysis) {
    res.status(404).json({ error: 'Profile not found' });
    return;
  }

  const base = baselineValues(analysis, await previousAcceptedValues(userId));
  const recs = buildRecommendations(analysis, base);
  const values = resolveValues(base, recs, {});
  const plan = { ...buildPlan(analysis, values, recs), baseValues: base };

  if (existingDraft) {
    await prisma.weeklyPlan.update({ where: { id: existingDraft.id }, data: { status: 'discarded' } });
  }

  const row = await prisma.weeklyPlan.create({
    data: {
      userId,
      weekStart: plan.weekStart,
      weekEnd: plan.weekEnd,
      status: 'draft',
      source: 'rules',
      analysis: JSON.stringify(analysis),
      insights: JSON.stringify(buildInsights(analysis)),
      recommendations: JSON.stringify(recs),
      originalRecommendations: JSON.stringify(recs),
      plan: JSON.stringify(plan),
      originalPlan: JSON.stringify(plan),
      customizations: '{}'
    }
  });

  res.status(201).json({ plan: serialize(row) });
}

// ---------------------------------------------------------------- read

export async function listPlans(req: Request, res: Response): Promise<void> {
  const rows = await prisma.weeklyPlan.findMany({
    where: { userId: req.user!.userId, status: { in: ['accepted', 'archived', 'draft'] } },
    orderBy: { createdAt: 'desc' },
    take: 52
  });
  res.json({
    plans: rows.map(r => {
      const plan = parse<any>(r.plan, {});
      const recs = parse<Recommendation[]>(r.recommendations, []);
      return {
        id: r.id, weekStart: r.weekStart, weekEnd: r.weekEnd, status: r.status,
        createdAt: r.createdAt, acceptedAt: r.acceptedAt, values: plan.values ?? null,
        recommendations: { total: recs.length, accepted: recs.filter(x => x.status === 'accepted').length, rejected: recs.filter(x => x.status === 'rejected').length },
        consistency: parse<any>(r.analysis, {})?.consistency?.score ?? null
      };
    })
  });
}

export async function getPlan(req: Request, res: Response): Promise<void> {
  const row = await ownedPlan(req, res);
  if (row) res.json({ plan: serialize(row) });
}

// ---------------------------------------------------------------- edit

const decisionSchema = z.object({ status: z.enum(['pending', 'accepted', 'rejected']) });

export async function decideRecommendation(req: Request, res: Response): Promise<void> {
  const row = await ownedPlan(req, res);
  if (!row || !requireDraft(row, res)) return;
  const { status } = decisionSchema.parse(req.body);
  const recs = parse<Recommendation[]>(row.recommendations, []);
  const rec = recs.find(r => r.id === req.params.recId);
  if (!rec) {
    res.status(404).json({ error: 'Recommendation not found' });
    return;
  }
  rec.status = status;
  const updated = await rebuildAndSave(row, recs, parse(row.customizations, {}));
  res.json({ plan: serialize(updated) });
}

const customizationSchema = z.object({
  customizations: z.object(
    Object.fromEntries(
      (Object.keys(FIELD_META) as PlanField[]).map(f => [f, z.number().min(FIELD_META[f].min).max(FIELD_META[f].max).optional()])
    ) as Record<PlanField, z.ZodOptional<z.ZodNumber>>
  )
});

export async function customizePlan(req: Request, res: Response): Promise<void> {
  const row = await ownedPlan(req, res);
  if (!row || !requireDraft(row, res)) return;
  const { customizations } = customizationSchema.parse(req.body);
  const clean: Partial<PlanValues> = {};
  for (const [k, v] of Object.entries(customizations)) {
    if (typeof v === 'number') clean[k as PlanField] = k === 'workoutDays' ? Math.round(v) : Math.round(v * 10) / 10;
  }
  // Only keep values that differ from what the recommendations already produce.
  const plan = parse<any>(row.plan, {});
  const recs = parse<Recommendation[]>(row.recommendations, []);
  const withoutCustom = resolveValues(plan.baseValues, recs, {});
  for (const k of Object.keys(clean) as PlanField[]) if (clean[k] === withoutCustom[k]) delete clean[k];

  const updated = await rebuildAndSave(row, recs, clean);
  res.json({ plan: serialize(updated) });
}

export async function resetPlan(req: Request, res: Response): Promise<void> {
  const row = await ownedPlan(req, res);
  if (!row || !requireDraft(row, res)) return;
  const updated = await prisma.weeklyPlan.update({
    where: { id: row.id },
    data: { recommendations: row.originalRecommendations, plan: row.originalPlan, customizations: '{}' }
  });
  res.json({ plan: serialize(updated) });
}

export async function discardPlan(req: Request, res: Response): Promise<void> {
  const row = await ownedPlan(req, res);
  if (!row || !requireDraft(row, res)) return;
  await prisma.weeklyPlan.update({ where: { id: row.id }, data: { status: 'discarded' } });
  res.json({ message: 'Draft plan discarded.' });
}

// ---------------------------------------------------------------- accept

export async function acceptPlan(req: Request, res: Response): Promise<void> {
  const row = await ownedPlan(req, res);
  if (!row || !requireDraft(row, res)) return;
  if (req.body?.confirm !== true) {
    res.status(400).json({ error: 'Please confirm to replace your current targets with this plan.', needsConfirmation: true });
    return;
  }

  const userId = req.user!.userId;
  // Pending recommendations count as accepted when the whole plan is accepted.
  const recs = parse<Recommendation[]>(row.recommendations, []).map(r => (r.status === 'pending' ? { ...r, status: 'accepted' as const } : r));
  const rebuilt = await rebuildAndSave(row, recs, parse(row.customizations, {}));
  const values: PlanValues = parse<any>(rebuilt.plan, {}).values;

  const fats = Math.round((values.calories * 0.25) / 9);
  const carbs = Math.max(50, Math.round((values.calories - values.protein * 4 - fats * 9) / 4));

  const [, , accepted, profile] = await prisma.$transaction([
    prisma.weeklyPlan.updateMany({ where: { userId, status: 'accepted' }, data: { status: 'archived' } }),
    prisma.weeklyPlan.updateMany({ where: { userId, status: 'draft', id: { not: row.id } }, data: { status: 'discarded' } }),
    prisma.weeklyPlan.update({ where: { id: row.id }, data: { status: 'accepted', acceptedAt: new Date() } }),
    prisma.profile.update({
      where: { userId },
      data: {
        dailyCalorieTarget: values.calories,
        proteinTarget: values.protein,
        fatsTarget: fats,
        carbsTarget: carbs,
        waterTarget: values.waterMl,
        workoutDaysPerWeek: values.workoutDays
      }
    })
  ]);

  res.json({
    message: 'Plan accepted. Your daily targets have been updated.',
    plan: serialize(accepted),
    profile: serializeProfile(profile)
  });
}

// ---------------------------------------------------------------- AI coach note

export async function generateAiSummary(req: Request, res: Response): Promise<void> {
  const row = await ownedPlan(req, res);
  if (!row) return;
  const analysis = parse<WeeklyAnalysis | null>(row.analysis, null);
  if (!analysis) {
    res.status(409).json({ error: 'This plan has no analysis to summarise.' });
    return;
  }

  try {
    const { system, prompt } = buildAdaptiveSummaryPrompt(
      analysis,
      parse(row.insights, []),
      parse<Recommendation[]>(row.recommendations, []).filter(r => r.status !== 'rejected'),
      parse<any>(row.plan, {}).values
    );
    const result = await aiService.generateStructured<any>(prompt, system, undefined, undefined, undefined, { task: 'adaptive summary', maxTokens: 350 });

    // Validate before storing: plain strings of sensible length only.
    const summary = typeof result?.summary === 'string' ? result.summary.trim() : '';
    const focus = Array.isArray(result?.focus) ? result.focus.filter((f: unknown) => typeof f === 'string' && f.trim()).map((f: string) => f.trim().slice(0, 200)).slice(0, 3) : [];
    if (summary.length < 40 || summary.length > 1500) throw new Error('AI returned an unusable summary');

    const updated = await prisma.weeklyPlan.update({
      where: { id: row.id },
      data: { aiSummary: JSON.stringify({ summary, focus }), aiSummaryModel: aiService.textModelName }
    });
    res.json({ plan: serialize(updated) });
  } catch (err: any) {
    console.log('Adaptive AI summary failed:', err.message);
    res.status(503).json({
      error: err.message?.includes('offline')
        ? 'The AI coach is offline (Ollama is not running). Your plan is complete without it; the AI only adds a written summary.'
        : 'The AI coach could not write a summary right now. Your plan is complete without it. Try again later.'
    });
  }
}

// ---------------------------------------------------------------- weekly feedback

const feedbackSchema = z.object({
  energyLevel: z.number().int().min(1).max(5),
  workoutManageable: z.number().int().min(1).max(5),
  mealsAffordable: z.number().int().min(1).max(5),
  proteinTargetMet: z.enum(['yes', 'partly', 'no']),
  sleepQuality: z.number().int().min(1).max(5),
  sleepHours: z.number().min(3).max(12).nullable().optional(),
  difficulties: z.string().max(1000).optional().default(''),
  improvements: z.string().max(1000).optional().default('')
});

export async function getFeedback(req: Request, res: Response): Promise<void> {
  const userId = req.user!.userId;
  const analysis = await buildWeeklyAnalysis(prisma, userId);
  if (!analysis) {
    res.status(404).json({ error: 'Profile not found' });
    return;
  }
  const weekStart = analysis.window.current.start;
  const feedback = await prisma.weeklyFeedback.findFirst({
    where: { userId, weekStart: { gte: addDays(weekStart, -6) } },
    orderBy: { weekStart: 'desc' }
  });
  res.json({ weekStart, weekEnd: analysis.window.current.end, feedback });
}

export async function saveFeedback(req: Request, res: Response): Promise<void> {
  const userId = req.user!.userId;
  const data = feedbackSchema.parse(req.body);
  const analysis = await buildWeeklyAnalysis(prisma, userId);
  if (!analysis) {
    res.status(404).json({ error: 'Profile not found' });
    return;
  }
  // One check-in per review week; answering again within the same week updates it.
  const recent = await prisma.weeklyFeedback.findFirst({
    where: { userId, weekStart: { gte: addDays(analysis.window.current.start, -6) } },
    orderBy: { weekStart: 'desc' }
  });
  const payload = { ...data, sleepHours: data.sleepHours ?? null };
  const feedback = recent
    ? await prisma.weeklyFeedback.update({ where: { id: recent.id }, data: payload })
    : await prisma.weeklyFeedback.create({ data: { userId, weekStart: analysis.window.current.start, ...payload } });
  res.status(recent ? 200 : 201).json({ feedback });
}
