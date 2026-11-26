/**
 * Creates (or recreates) a demo account with ~6 months of realistic history:
 * weekly body measurements, workout sessions, daily meal logs and water logs.
 *
 *   npm --prefix server run seed:demo
 *   npm --prefix server run seed:demo -- --days=90 --email=demo3m@repp.app --name="Demo Member" --complete
 *
 * --days      history length (default 178, about 6 months)
 * --email     account email (default demo@repp.app)
 * --name      profile name (default Demo Athlete)
 * --complete  every day fully logged: all meals, water and every scheduled workout, no break week
 *
 * Re-running deletes the previous demo account first. Data is deterministic (fixed RNG seed).
 */
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { calculateMacros } from '../src/utils/fitnessMath.js';
import { localDateString } from '../src/utils/date.js';
import { evaluateUserBadges } from '../src/utils/badgeEvaluator.js';

const prisma = new PrismaClient();

const arg = (name: string) => process.argv.find(a => a.startsWith(`--${name}=`))?.split('=').slice(1).join('=');
export const DEMO_EMAIL = arg('email') || 'demo@repp.app';
export const DEMO_PASSWORD = 'Demo@1234';
const DAYS = parseInt(arg('days') || '178', 10); // default ~6 months (fits inside the 6M view on the Progress tab)
const COMPLETE = process.argv.includes('--complete');
// Shorter histories lose proportionally less weight so the curve stays realistic.
const SPAN = Math.pow(Math.min(1, DAYS / 178), 0.6);

// ---------- deterministic random ----------
let seed = 20260524;
function rand(): number {
  seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
const between = (a: number, b: number) => a + (b - a) * rand();
const pick = <T,>(arr: T[]): T => arr[Math.floor(rand() * arr.length)];
const round1 = (n: number) => Math.round(n * 10) / 10;

function daysAgo(n: number, hour = 12, minute = 0): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(hour, minute, 0, 0);
  return d;
}

// ---------- profile ----------
const PROFILE = {
  name: arg('name') || 'Demo Athlete',
  age: 28,
  sex: 'Male',
  height: 178,
  startWeight: 86.0,
  targetWeight: 76,
  startWaist: 96.0,
  startChest: 104.0,
  startArms: 35.0,
  activityLevel: 'Moderately Active (3-4 days exercise)',
  primaryGoal: 'Fat Loss',
  experienceLevel: 'Intermediate',
  dietPreference: 'Non-Vegetarian'
};

// ---------- meals (Indian, non-veg) ----------
type MealTemplate = { name: string; calories: number; protein: number; carbs: number; fats: number; items: Array<{ name: string; portion: string }> };
const MEALS: Record<string, MealTemplate[]> = {
  Breakfast: [
    { name: 'Oats with milk, banana & almonds', calories: 430, protein: 18, carbs: 62, fats: 12, items: [{ name: 'Rolled oats', portion: '60 g' }, { name: 'Toned milk', portion: '250 ml' }, { name: 'Banana', portion: '1 medium' }, { name: 'Almonds', portion: '10 g' }] },
    { name: '3-egg omelette with 2 toast', calories: 420, protein: 26, carbs: 30, fats: 20, items: [{ name: 'Whole eggs', portion: '3 large' }, { name: 'Brown bread', portion: '2 slices' }] },
    { name: 'Poha with peanuts & curd', calories: 400, protein: 13, carbs: 60, fats: 12, items: [{ name: 'Poha', portion: '1.5 cups' }, { name: 'Peanuts', portion: '15 g' }, { name: 'Curd', portion: '100 g' }] },
    { name: 'Idli sambar (4 idli)', calories: 380, protein: 14, carbs: 70, fats: 5, items: [{ name: 'Idli', portion: '4 pieces' }, { name: 'Sambar', portion: '1 cup' }] },
    { name: 'Paneer bhurji with 2 roti', calories: 480, protein: 28, carbs: 46, fats: 20, items: [{ name: 'Paneer bhurji', portion: '120 g' }, { name: 'Roti', portion: '2' }] }
  ],
  Lunch: [
    { name: 'Chicken curry, rice & salad', calories: 620, protein: 42, carbs: 70, fats: 16, items: [{ name: 'Chicken curry', portion: '150 g chicken' }, { name: 'Cooked rice', portion: '1 cup' }, { name: 'Cucumber salad', portion: '1 bowl' }] },
    { name: 'Dal, 3 roti, sabzi & curd', calories: 600, protein: 24, carbs: 88, fats: 15, items: [{ name: 'Dal tadka', portion: '1 cup' }, { name: 'Roti', portion: '3' }, { name: 'Mixed veg sabzi', portion: '1 cup' }, { name: 'Curd', portion: '100 g' }] },
    { name: 'Rajma chawal with salad', calories: 580, protein: 22, carbs: 96, fats: 10, items: [{ name: 'Rajma', portion: '1 cup' }, { name: 'Cooked rice', portion: '1 cup' }, { name: 'Salad', portion: '1 bowl' }] },
    { name: 'Grilled chicken, brown rice & veggies', calories: 560, protein: 48, carbs: 58, fats: 12, items: [{ name: 'Grilled chicken breast', portion: '180 g' }, { name: 'Brown rice', portion: '1 cup' }, { name: 'Sauteed vegetables', portion: '1 cup' }] },
    { name: 'Fish curry with rice', calories: 590, protein: 38, carbs: 68, fats: 16, items: [{ name: 'Fish curry', portion: '150 g fish' }, { name: 'Cooked rice', portion: '1 cup' }] }
  ],
  'Evening Snack': [
    { name: 'Whey protein shake & banana', calories: 230, protein: 26, carbs: 30, fats: 2, items: [{ name: 'Whey protein', portion: '1 scoop' }, { name: 'Banana', portion: '1 medium' }] },
    { name: 'Roasted chana & green tea', calories: 180, protein: 10, carbs: 26, fats: 4, items: [{ name: 'Roasted chana', portion: '45 g' }, { name: 'Green tea', portion: '1 cup' }] },
    { name: 'Greek yogurt with fruit', calories: 200, protein: 15, carbs: 24, fats: 5, items: [{ name: 'Greek yogurt', portion: '150 g' }, { name: 'Apple', portion: '1 small' }] },
    { name: '2 boiled eggs & apple', calories: 240, protein: 13, carbs: 25, fats: 10, items: [{ name: 'Boiled eggs', portion: '2' }, { name: 'Apple', portion: '1 medium' }] },
    { name: 'Samosa & masala chai', calories: 360, protein: 6, carbs: 40, fats: 19, items: [{ name: 'Samosa', portion: '1' }, { name: 'Masala chai', portion: '1 cup' }] }
  ],
  Dinner: [
    { name: 'Paneer tikka with 2 roti', calories: 560, protein: 32, carbs: 48, fats: 24, items: [{ name: 'Paneer tikka', portion: '150 g' }, { name: 'Roti', portion: '2' }] },
    { name: 'Chicken tikka & salad', calories: 480, protein: 46, carbs: 18, fats: 22, items: [{ name: 'Chicken tikka', portion: '200 g' }, { name: 'Green salad', portion: '1 bowl' }] },
    { name: 'Egg curry with 2 roti', calories: 520, protein: 24, carbs: 50, fats: 22, items: [{ name: 'Egg curry', portion: '3 eggs' }, { name: 'Roti', portion: '2' }] },
    { name: 'Soya chunk curry with rice', calories: 530, protein: 34, carbs: 66, fats: 12, items: [{ name: 'Soya chunks curry', portion: '60 g dry soya' }, { name: 'Cooked rice', portion: '0.75 cup' }] },
    { name: 'Chicken biryani (restaurant)', calories: 780, protein: 34, carbs: 90, fats: 30, items: [{ name: 'Chicken biryani', portion: '1 plate' }, { name: 'Raita', portion: '1 small bowl' }] }
  ]
};
const MEAL_TIMES: Record<string, [number, number]> = { Breakfast: [8, 15], Lunch: [13, 20], 'Evening Snack': [17, 30], Dinner: [20, 45] };

// ---------- workouts (4-day upper/lower) ----------
type Lift = { name: string; sets: number; reps: string; startKg: number; stepKg: number };
const SESSIONS: Record<number, { dayName: string; lifts: Lift[] }> = {
  1: { dayName: 'Day 1 - Upper Body Strength', lifts: [
    { name: 'Barbell Bench Press', sets: 4, reps: '6-8', startKg: 60, stepKg: 2.5 },
    { name: 'Barbell Bent-Over Row', sets: 4, reps: '6-8', startKg: 55, stepKg: 2.5 },
    { name: 'Seated Dumbbell Shoulder Press', sets: 3, reps: '8-10', startKg: 18, stepKg: 1 },
    { name: 'Lat Pulldown', sets: 3, reps: '10-12', startKg: 50, stepKg: 2.5 },
    { name: 'Cable Tricep Pushdown', sets: 3, reps: '12-15', startKg: 20, stepKg: 1.25 }
  ] },
  2: { dayName: 'Day 2 - Lower Body Strength', lifts: [
    { name: 'Barbell Back Squat', sets: 4, reps: '6-8', startKg: 80, stepKg: 2.5 },
    { name: 'Romanian Deadlift', sets: 3, reps: '8-10', startKg: 70, stepKg: 2.5 },
    { name: 'Leg Press', sets: 3, reps: '10-12', startKg: 140, stepKg: 5 },
    { name: 'Seated Leg Curl', sets: 3, reps: '12-15', startKg: 35, stepKg: 1.25 },
    { name: 'Standing Calf Raise', sets: 4, reps: '12-15', startKg: 60, stepKg: 2.5 }
  ] },
  4: { dayName: 'Day 3 - Upper Body Hypertrophy', lifts: [
    { name: 'Incline Dumbbell Bench Press', sets: 4, reps: '8-10', startKg: 22, stepKg: 1 },
    { name: 'Seated Cable Row', sets: 4, reps: '10-12', startKg: 55, stepKg: 2.5 },
    { name: 'Dumbbell Lateral Raises', sets: 3, reps: '12-15', startKg: 8, stepKg: 0.5 },
    { name: 'Hammer Curl', sets: 3, reps: '10-12', startKg: 12, stepKg: 0.5 },
    { name: 'Overhead Rope Extension', sets: 3, reps: '12-15', startKg: 18, stepKg: 1.25 }
  ] },
  5: { dayName: 'Day 4 - Lower Body Hypertrophy', lifts: [
    { name: 'Conventional Deadlift', sets: 3, reps: '5', startKg: 100, stepKg: 5 },
    { name: 'Bulgarian Split Squat', sets: 3, reps: '8-10', startKg: 14, stepKg: 1 },
    { name: 'Leg Extension', sets: 3, reps: '12-15', startKg: 40, stepKg: 1.25 },
    { name: 'Hip Thrust', sets: 3, reps: '10-12', startKg: 80, stepKg: 5 },
    { name: 'Hanging Leg Raise', sets: 3, reps: '12', startKg: 0, stepKg: 0 }
  ] }
};
// A realistic one-week break (travel/illness) around month 3. Disabled with --complete.
const BREAK_START = COMPLETE ? -100 : 95; // days ago
const BREAK_END = COMPLETE ? -100 : 88;

async function main() {
  const existing = await prisma.user.findUnique({ where: { email: DEMO_EMAIL } });
  if (existing) {
    await prisma.user.delete({ where: { id: existing.id } });
    console.log('Removed previous demo account.');
  }

  const startDate = daysAgo(DAYS, 9);
  const user = await prisma.user.create({
    data: {
      email: DEMO_EMAIL,
      passwordHash: await bcrypt.hash(DEMO_PASSWORD, 10),
      createdAt: startDate
    }
  });
  const userId = user.id;

  // ---------- weekly measurements ----------
  // Fat-loss curve: faster early, slower later, flat during the break week, small noise.
  const measurements: Array<{ daysAgo: number; weight: number; waist: number; chest: number; arms: number }> = [];
  for (let d = DAYS; d >= 0; d -= 7) {
    const t = (DAYS - d) / DAYS; // 0..1
    const breakPenalty = d <= BREAK_START && d >= BREAK_END - 7 ? 0.5 : 0; // small regain around the break
    const loss = 9.2 * SPAN * (1 - Math.exp(-2.1 * t));
    measurements.push({
      daysAgo: Math.max(d, 2),
      weight: round1(PROFILE.startWeight - loss + breakPenalty + between(-0.35, 0.35)),
      waist: round1(PROFILE.startWaist - 8.0 * SPAN * (1 - Math.exp(-1.9 * t)) + between(-0.3, 0.3)),
      chest: round1(PROFILE.startChest - 3.0 * SPAN * t + between(-0.3, 0.3)),
      arms: round1(PROFILE.startArms + 0.7 * SPAN * t + between(-0.15, 0.15))
    });
  }
  // Make the very first entry the exact onboarding numbers.
  Object.assign(measurements[0], { weight: PROFILE.startWeight, waist: PROFILE.startWaist, chest: PROFILE.startChest, arms: PROFILE.startArms });
  await prisma.bodyMeasurement.createMany({
    data: measurements.map(m => ({
      userId,
      date: localDateString(daysAgo(m.daysAgo)),
      weight: m.weight,
      waist: m.waist,
      chest: m.chest,
      arms: m.arms,
      createdAt: daysAgo(m.daysAgo, 7, 30)
    }))
  });
  const weightOn = (d: number) => {
    const m = measurements.reduce((best, cur) => (cur.daysAgo >= d && cur.daysAgo - d < best.daysAgo - d ? cur : best), measurements[0]);
    return m.weight;
  };

  // ---------- daily meals, water and workouts ----------
  const mealRows: any[] = [];
  const waterRows: any[] = [];
  const sessionRows: any[] = [];

  for (let d = DAYS; d >= 1; d--) {
    const day = daysAgo(d);
    const date = localDateString(day);
    const progress = (DAYS - d) / DAYS; // habits improve over time
    const onBreak = d <= BREAK_START && d >= BREAK_END;
    const weekend = day.getDay() === 0 || day.getDay() === 6;

    const macros = calculateMacros({
      weight: weightOn(d), height: PROFILE.height, age: PROFILE.age, sex: PROFILE.sex,
      activityLevel: PROFILE.activityLevel, primaryGoal: PROFILE.primaryGoal
    });

    // Meals: occasionally not logged at all; break week has patchy logging.
    const skipDayChance = COMPLETE ? -1 : onBreak ? 0.6 : 0.07 - 0.04 * progress;
    if (rand() > skipDayChance) {
      // Calories: early on often over target, later closer to target; weekends a bit higher.
      const calRatio = between(0.88, 1.02) + (1 - progress) * between(0, 0.12) + (weekend ? between(0, 0.08) : 0);
      const dayCalories = macros.dailyCalorieTarget * calRatio;
      const categories = !COMPLETE && rand() < 0.15 ? ['Breakfast', 'Lunch', 'Dinner'] : ['Breakfast', 'Lunch', 'Evening Snack', 'Dinner'];

      // Pick meals; protein-forward choices become more likely as the user learns.
      const chosen = categories.map(cat => {
        const options = MEALS[cat];
        const sorted = [...options].sort((a, b) => b.protein / b.calories - a.protein / a.calories);
        const preferProtein = rand() < 0.35 + 0.45 * progress;
        return { cat, meal: preferProtein ? sorted[Math.floor(rand() * 2)] : pick(options) };
      });
      const base = chosen.reduce((s, c) => s + c.meal.calories, 0);
      const scale = dayCalories / base;

      for (const { cat, meal } of chosen) {
        const s = scale * between(0.92, 1.08);
        const [h, m] = MEAL_TIMES[cat];
        mealRows.push({
          userId,
          date,
          category: cat,
          name: meal.name,
          calories: Math.round(meal.calories * s),
          protein: Math.round(meal.protein * s),
          carbs: Math.round(meal.carbs * s),
          fats: Math.round(meal.fats * s),
          source: rand() < 0.4 ? 'photo' : 'text',
          items: JSON.stringify(meal.items),
          confidence: null,
          createdAt: daysAgo(d, h, m + Math.floor(between(-20, 20)))
        });
      }
    }

    // Water
    if (!onBreak || rand() < 0.4) {
      waterRows.push({
        userId,
        date,
        amountMl: Math.round(between(1800 + 900 * progress, 2700 + 600 * progress) / 250) * 250,
        createdAt: daysAgo(d, 21, 30)
      });
    }

    // Workouts: Mon, Tue, Thu, Fri; attendance improves; none during the break.
    const session = SESSIONS[day.getDay()];
    if (session && !onBreak && (COMPLETE || rand() < 0.78 + 0.17 * progress)) {
      const weeksIn = Math.floor((DAYS - d) / 7);
      const deloadAfterBreak = d < BREAK_END && d > BREAK_END - 10 ? 0.9 : 1;
      const completed = session.lifts.map(l => {
        const kg = l.startKg === 0 ? 0 : Math.round(((l.startKg + l.stepKg * Math.floor(weeksIn / 2)) * deloadAfterBreak) / 1.25) * 1.25;
        return { name: l.name, sets: l.sets, reps: l.reps, weight: kg === 0 ? 'Bodyweight' : `${kg} kg` };
      });
      sessionRows.push({
        userId,
        date,
        dayName: session.dayName,
        durationMinutes: Math.round(between(50, 72)),
        completedExercises: JSON.stringify(completed),
        notes: 'Completed successfully with active logging.',
        createdAt: daysAgo(d, 18, 45)
      });
    }
  }

  await prisma.mealLog.createMany({ data: mealRows });
  await prisma.waterLog.createMany({ data: waterRows });
  await prisma.workoutSession.createMany({ data: sessionRows });

  // ---------- profile reflects the latest state ----------
  const latest = measurements[measurements.length - 1];
  const macros = calculateMacros({
    weight: latest.weight, height: PROFILE.height, age: PROFILE.age, sex: PROFILE.sex,
    activityLevel: PROFILE.activityLevel, primaryGoal: PROFILE.primaryGoal
  });

  // Streak = consecutive days with a workout ending at the last session.
  const sessionDates = new Set(sessionRows.map(s => s.date));
  const lastSession = sessionRows[sessionRows.length - 1];
  let streak = 0;
  for (let i = 0; i < 400; i++) {
    const d = new Date(`${lastSession.date}T12:00:00`);
    d.setDate(d.getDate() - i);
    if (sessionDates.has(localDateString(d))) streak++;
    else break;
  }
  const last4Weeks = sessionRows.filter(s => s.createdAt >= daysAgo(28)).length;

  await prisma.profile.create({
    data: {
      userId,
      name: PROFILE.name,
      age: PROFILE.age,
      sex: PROFILE.sex,
      height: PROFILE.height,
      weight: latest.weight,
      targetWeight: PROFILE.targetWeight,
      waist: latest.waist,
      chest: latest.chest,
      arms: latest.arms,
      experienceLevel: PROFILE.experienceLevel,
      activityLevel: PROFILE.activityLevel,
      primaryGoal: PROFILE.primaryGoal,
      goalDescription: 'Lose fat while keeping strength, get to 76 kg.',
      dietPreference: PROFILE.dietPreference,
      availableFoods: JSON.stringify(['Roti / Chapati', 'Paneer', 'Eggs', 'Chicken Breast', 'Yellow Dal / Rajma', 'White / Brown Rice', 'Curd / Yogurt', 'Oats', 'Fresh Vegetables']),
      workoutLocation: 'Gym Workouts',
      workoutSplit: '4-Day Upper/Lower Split',
      workoutDaysPerWeek: 4,
      workoutDuration: 60,
      dailyCalorieTarget: macros.dailyCalorieTarget,
      proteinTarget: macros.proteinTarget,
      carbsTarget: macros.carbsTarget,
      fatsTarget: macros.fatsTarget,
      waterTarget: macros.waterTarget,
      streakDays: streak,
      weeklyConsistencyScore: Math.min(100, Math.round((last4Weeks / 16) * 100)),
      totalWorkoutsCompleted: sessionRows.length,
      lastActiveDate: lastSession.date,
      isOnboarded: true,
      createdAt: startDate
    }
  });

  const badges = await evaluateUserBadges(prisma, userId);

  console.log('Demo account ready');
  console.log(`  Email:    ${DEMO_EMAIL}`);
  console.log(`  Password: ${DEMO_PASSWORD}`);
  console.log(`  History:  ${localDateString(startDate)} to ${localDateString(daysAgo(1))}`);
  console.log(`  Weight:   ${PROFILE.startWeight} kg -> ${latest.weight} kg   Waist: ${PROFILE.startWaist} cm -> ${latest.waist} cm`);
  console.log(`  Records:  ${measurements.length} measurements, ${sessionRows.length} workouts, ${mealRows.length} meals, ${waterRows.length} water logs`);
  console.log(`  Badges:   ${badges.length ? badges.join(', ') : 'none'}`);
}

main()
  .catch(err => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
