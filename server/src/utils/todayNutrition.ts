import type { PrismaClient } from '@prisma/client';
import { localDateString } from './date.js';

export interface MacroTotals {
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
}

const ZERO: MacroTotals = { calories: 0, protein: 0, carbs: 0, fats: 0 };

function add(a: MacroTotals, b: Partial<MacroTotals>): MacroTotals {
  return {
    calories: a.calories + (b.calories || 0),
    protein: a.protein + (b.protein || 0),
    carbs: a.carbs + (b.carbs || 0),
    fats: a.fats + (b.fats || 0)
  };
}

function round(t: MacroTotals): MacroTotals {
  return {
    calories: Math.round(t.calories),
    protein: Math.round(t.protein),
    carbs: Math.round(t.carbs),
    fats: Math.round(t.fats)
  };
}

/**
 * Returns the user's active diet plan as today's plan. A plan carried over from an
 * earlier day is moved to today and its "eaten" ticks are cleared, so yesterday's
 * meals never count towards today's intake.
 */
export async function getTodaysActivePlan(prisma: PrismaClient, userId: string) {
  const today = localDateString();

  const todays = await prisma.mealPlan.findFirst({
    where: { userId, date: today, isActive: true },
    include: { meals: true },
    orderBy: { createdAt: 'desc' }
  });
  if (todays) return todays;

  const latest = await prisma.mealPlan.findFirst({
    where: { userId, isActive: true },
    include: { meals: true },
    orderBy: { createdAt: 'desc' }
  });
  if (!latest) return null;

  const dayOfWeek = new Date().toLocaleDateString('en-US', { weekday: 'long' });
  await prisma.$transaction([
    prisma.plannedMeal.updateMany({ where: { mealPlanId: latest.id }, data: { isCompleted: false } }),
    prisma.mealPlan.update({ where: { id: latest.id }, data: { date: today, dayOfWeek } })
  ]);

  return prisma.mealPlan.findUnique({ where: { id: latest.id }, include: { meals: true } });
}

/** Today's intake (logged meals + diet-plan meals marked as eaten) against the user's targets. */
export async function getTodayNutrition(prisma: PrismaClient, userId: string) {
  const today = localDateString();

  const [profile, logs, plan] = await Promise.all([
    prisma.profile.findUnique({ where: { userId } }),
    prisma.mealLog.findMany({ where: { userId, date: today }, orderBy: { createdAt: 'asc' } }),
    getTodaysActivePlan(prisma, userId)
  ]);

  const planEaten = plan?.meals.filter(m => m.isCompleted) ?? [];
  const planLeft = plan?.meals.filter(m => !m.isCompleted) ?? [];

  const fromLogs = round(logs.reduce(add, ZERO));
  const fromPlan = round(planEaten.reduce(add, ZERO));
  const consumed = round(add(fromLogs, fromPlan));

  const targets: MacroTotals = {
    calories: profile?.dailyCalorieTarget ?? 2000,
    protein: profile?.proteinTarget ?? 140,
    carbs: profile?.carbsTarget ?? 200,
    fats: profile?.fatsTarget ?? 55
  };

  const remaining: MacroTotals = {
    calories: targets.calories - consumed.calories,
    protein: targets.protein - consumed.protein,
    carbs: targets.carbs - consumed.carbs,
    fats: targets.fats - consumed.fats
  };

  return {
    date: today,
    targets,
    consumed,
    remaining, // negative means over target
    breakdown: { fromLogs, fromPlan },
    loggedMeals: logs.map(l => ({
      id: l.id,
      name: l.name,
      category: l.category,
      source: l.source,
      calories: l.calories,
      protein: l.protein,
      carbs: l.carbs,
      fats: l.fats,
      loggedAt: l.createdAt
    })),
    planMealsEaten: planEaten.map(m => ({ id: m.id, name: m.name, category: m.category, calories: m.calories, protein: m.protein })),
    planMealsLeft: planLeft.map(m => ({ id: m.id, name: m.name, category: m.category, time: m.time, calories: m.calories, protein: m.protein }))
  };
}
