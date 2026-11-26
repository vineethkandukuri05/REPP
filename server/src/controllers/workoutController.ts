import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { serializeProfile } from '../utils/profileSerializer.js';
import { aiService } from '../ai/aiService.js';
import { isDemoEmail } from '../middleware/blockDemo.js';
import { buildWorkoutPlanPrompt, buildExerciseSwapPrompt } from '../ai/prompts/workoutPlanPrompt.js';
import { validateExerciseSafety } from '../ai/safetyValidators.js';
import { evaluateUserBadges } from '../utils/badgeEvaluator.js';
import { localDateString, previousLocalDateString } from '../utils/date.js';

const prisma = new PrismaClient();

// The shared demo account never counts as "done for today", so every visitor can try the workout and substitutions.
async function findTodaysSession(userId: string, email?: string) {
  if (isDemoEmail(email)) return null;
  return prisma.workoutSession.findFirst({
    where: { userId, date: localDateString() },
    orderBy: { createdAt: 'desc' }
  });
}

const ALREADY_DONE_MESSAGE = "You've already completed today's workout. Rest and recover, and your next session unlocks tomorrow.";

function getFallbackWorkout(profile: any) {
  const split = profile.workoutSplit || '4-Day Upper/Lower Split';
  return {
    dayName: 'Day 1 - Upper Body Hypertrophy',
    split,
    duration: profile.workoutDuration || 55,
    difficulty: profile.experienceLevel || 'Intermediate',
    targetMuscles: JSON.stringify(['Chest', 'Lats', 'Shoulders', 'Triceps', 'Biceps']),
    exercises: [
      {
        name: 'Incline Dumbbell Bench Press',
        target: 'Upper Chest & Anterior Delts',
        equipment: 'Incline Bench, Dumbbells',
        sets: 4,
        reps: '8-10',
        rest: '90 sec',
        targetWeight: '22 kg',
        instructions: 'Set bench to 30 degrees. Retract scapula, press with controlled 3-second negative eccentric tempo.',
        substitutions: JSON.stringify(['Barbell Incline Press', 'Machine Chest Press', 'Push-ups'])
      },
      {
        name: 'Lat Pulldown (Neutral Grip)',
        target: 'Latissimus Dorsi & Mid Back',
        equipment: 'Cable Pulley',
        sets: 4,
        reps: '10-12',
        rest: '75 sec',
        targetWeight: '52.5 kg',
        instructions: 'Depress shoulders before initiating pull. Pull to collarbone and squeeze lats hard at peak contraction.',
        substitutions: JSON.stringify(['Pull-ups', 'Single-Arm Cable Row', 'Chest-Supported Row'])
      },
      {
        name: 'Dumbbell Lateral Raises',
        target: 'Lateral Deltoids',
        equipment: 'Dumbbells',
        sets: 3,
        reps: '12-15',
        rest: '60 sec',
        targetWeight: '10 kg',
        instructions: 'Slight forward lean at hips. Raise arms in scapular plane with elbows slightly bent. Control downward descent.',
        substitutions: JSON.stringify(['Cable Lateral Raise', 'Machine Lateral Raise'])
      },
      {
        name: 'Cable Tricep Pushdown (Rope)',
        target: 'Triceps Lateral & Medial Heads',
        equipment: 'Cable & Rope Attachment',
        sets: 3,
        reps: '12-15',
        rest: '60 sec',
        targetWeight: '25 kg',
        instructions: 'Pin elbows to torso. Extend arms down and flare rope tips outward at bottom lockout.',
        substitutions: JSON.stringify(['Overhead Rope Extension', 'Dumbbell Skull Crushers'])
      },
      {
        name: 'Incline Dumbbell Bicep Curl',
        target: 'Biceps Brachii (Long Head)',
        equipment: 'Incline Bench, Dumbbells',
        sets: 3,
        reps: '10-12',
        rest: '60 sec',
        targetWeight: '12 kg',
        instructions: 'Bench at 45 degrees. Allow full stretch of biceps at bottom, supinate wrists forcefully as you curl up.',
        substitutions: JSON.stringify(['EZ-Bar Preacher Curl', 'Hammer Curls'])
      }
    ]
  };
}

export async function getTodayWorkout(req: Request, res: Response): Promise<void> {
  const userId = req.user!.userId;
  const todayStr = localDateString();

  let plan = await prisma.workoutPlan.findFirst({
    where: { userId, date: todayStr },
    include: { exercises: true }
  });

  if (!plan) {
    plan = await prisma.workoutPlan.findFirst({
      where: { userId },
      include: { exercises: true },
      orderBy: { createdAt: 'desc' }
    });
  }

  if (!plan) {
    const profile = await prisma.profile.findUnique({ where: { userId } });
    if (!profile) {
      res.status(404).json({ error: 'Profile not found' });
      return;
    }

    const fallback = getFallbackWorkout(profile);
    plan = await prisma.workoutPlan.create({
      data: {
        userId,
        date: todayStr,
        dayName: fallback.dayName,
        split: fallback.split,
        duration: fallback.duration,
        difficulty: fallback.difficulty,
        targetMuscles: fallback.targetMuscles,
        isCompletedToday: false,
        exercises: {
          create: fallback.exercises
        }
      },
      include: { exercises: true }
    });
  }

  const safeExercises = plan.exercises.map(ex => ({
    ...ex,
    substitutions: parseStringList(ex.substitutions)
  }));

  const todaysSession = await findTodaysSession(userId, req.user!.email);

  res.json({
    workoutPlan: { ...plan, targetMuscles: parseStringList(plan.targetMuscles), exercises: safeExercises },
    completedToday: Boolean(todaysSession),
    completedSession: todaysSession
      ? { date: todaysSession.date, dayName: todaysSession.dayName, durationMinutes: todaysSession.durationMinutes, completedAt: todaysSession.createdAt }
      : null
  });
}

export async function generateWorkout(req: Request, res: Response): Promise<void> {
  if (await findTodaysSession(req.user!.userId, req.user!.email)) {
    res.status(409).json({ error: ALREADY_DONE_MESSAGE, completedToday: true });
    return;
  }

  const userId = req.user!.userId;
  const todayStr = localDateString();

  const profile = await prisma.profile.findUnique({ where: { userId } });
  if (!profile) {
    res.status(404).json({ error: 'Profile not found' });
    return;
  }

  const ctx = {
    name: profile.name,
    experienceLevel: profile.experienceLevel,
    workoutLocation: profile.workoutLocation,
    workoutSplit: profile.workoutSplit,
    availableEquipment: JSON.parse(profile.availableEquipment || '[]'),
    workoutDuration: profile.workoutDuration,
    injuries: JSON.parse(profile.injuries || '[]'),
    excludedExercises: JSON.parse(profile.excludedExercises || '[]'),
    primaryGoal: profile.primaryGoal
  };

  let generatedData: any = null;
  let isAiGenerated = false;

  try {
    const { system, prompt } = buildWorkoutPlanPrompt(ctx);
    const result = await aiService.generateStructured<any>(prompt, system, undefined, undefined, undefined, { task: 'workout plan', maxTokens: 1600 });
    if (result && Array.isArray(result.exercises) && result.exercises.length > 0) {
      // Validate each exercise for safety against injuries and excluded exercises
      const safeExs: any[] = [];
      for (const ex of result.exercises) {
        const safety = validateExerciseSafety({
          exerciseName: ex.name,
          targetMuscles: [ex.target || 'Full Body'],
          equipmentNeeded: ex.equipment || 'Standard',
          userInjuries: ctx.injuries,
          userAvailableEquipment: ctx.availableEquipment,
          userExcludedExercises: ctx.excludedExercises
        });
        if (safety.safe) {
          safeExs.push(ex);
        }
      }
      if (safeExs.length >= 3) {
        generatedData = {
          dayName: result.dayName || `${profile.workoutSplit} Session`,
          split: result.split || profile.workoutSplit,
          duration: result.duration || profile.workoutDuration,
          difficulty: result.difficulty || profile.experienceLevel,
          targetMuscles: JSON.stringify(result.targetMuscles || []),
          exercises: safeExs
        };
        isAiGenerated = true;
      }
    }
  } catch (err: any) {
    console.log('AI workout generation fallback:', err.message);
  }

  if (!generatedData) {
    generatedData = getFallbackWorkout(profile);
  }

  const newPlan = await prisma.workoutPlan.create({
    data: {
      userId,
      date: todayStr,
      dayName: generatedData.dayName,
      split: generatedData.split,
      duration: generatedData.duration,
      difficulty: generatedData.difficulty,
      targetMuscles: generatedData.targetMuscles,
      isCompletedToday: false,
      exercises: {
        create: generatedData.exercises.map((ex: any) => ({
          name: ex.name,
          target: ex.target || 'General Muscle',
          equipment: ex.equipment || 'Gym Equipment',
          sets: Number(ex.sets) || 3,
          reps: String(ex.reps || '10-12'),
          rest: String(ex.rest || '60 sec'),
          completedSets: 0,
          targetWeight: String(ex.targetWeight || '15 kg'),
          isPR: Boolean(ex.isPR),
          instructions: ex.instructions || '',
          substitutions: encodeStringList(ex.substitutions)
        }))
      }
    },
    include: { exercises: true }
  });

  const safeExercises = newPlan.exercises.map(ex => ({
    ...ex,
    substitutions: parseStringList(ex.substitutions)
  }));

  res.json({
    workoutPlan: { ...newPlan, targetMuscles: parseStringList(newPlan.targetMuscles), exercises: safeExercises },
    isAiGenerated,
    message: isAiGenerated ? 'AI workout plan generated via Ollama!' : 'Workout plan generated from exercise library.'
  });
}

export async function toggleExerciseSet(req: Request, res: Response): Promise<void> {
  const userId = req.user!.userId;
  const exerciseId = req.params.exerciseId as string;

  const exercise = await prisma.exercise.findUnique({
    where: { id: exerciseId },
    include: { workoutPlan: true }
  }) as any;

  if (!exercise || exercise.workoutPlan.userId !== userId) {
    res.status(404).json({ error: 'Exercise not found' });
    return;
  }

  const nextSets = exercise.completedSets >= exercise.sets ? 0 : exercise.completedSets + 1;
  const updated = await prisma.exercise.update({
    where: { id: exerciseId as string },
    data: { completedSets: nextSets }
  });

  res.json({
    exercise: {
      ...updated,
      substitutions: parseStringList(updated.substitutions)
    }
  });
}

const PLACEHOLDER_NAMES = new Set(['alternative exercise', 'alternative exercise name', '']);

// Lists are stored as JSON text. Older rows can be double-encoded ("[\"a\"]" inside a string),
// so keep decoding until we reach an array.
function parseStringList(value: unknown): string[] {
  let parsed: unknown = value;
  for (let i = 0; i < 3 && typeof parsed === 'string'; i++) {
    try {
      parsed = JSON.parse(parsed);
    } catch {
      return [];
    }
  }
  return Array.isArray(parsed)
    ? parsed.filter((v): v is string => typeof v === 'string' && v.trim() !== '').map(v => v.trim())
    : [];
}

function encodeStringList(value: unknown): string {
  return JSON.stringify(parseStringList(value));
}

function isRealName(name: unknown): name is string {
  return typeof name === 'string' && !PLACEHOLDER_NAMES.has(name.trim().toLowerCase());
}

export async function substituteExercise(req: Request, res: Response): Promise<void> {
  const userId = req.user!.userId;
  const exerciseId = req.params.exerciseId as string;
  const requestedName = typeof req.body?.newName === 'string' ? req.body.newName.trim() : '';

  const exercise = await prisma.exercise.findUnique({
    where: { id: exerciseId },
    include: { workoutPlan: true }
  });

  if (!exercise || exercise.workoutPlan.userId !== userId) {
    res.status(404).json({ error: 'Exercise not found' });
    return;
  }

  const profile = await prisma.profile.findUnique({ where: { userId } });
  const injuries = parseStringList(profile?.injuries);
  const excluded = parseStringList(profile?.excludedExercises);
  const equipment = parseStringList(profile?.availableEquipment);

  const isSafe = (name: string) =>
    validateExerciseSafety({
      exerciseName: name,
      targetMuscles: [exercise.target],
      equipmentNeeded: exercise.equipment,
      userInjuries: injuries,
      userAvailableEquipment: equipment,
      userExcludedExercises: excluded
    }).safe;

  const current = exercise.name.trim();
  const sameAsCurrent = (name: string) => name.toLowerCase() === current.toLowerCase();

  // 1. Stored alternatives for this exercise (safe ones, excluding the current name)
  const storedAlternatives = parseStringList(exercise.substitutions).filter(n => isRealName(n) && !sameAsCurrent(n));
  const safeAlternatives = storedAlternatives.filter(isSafe);

  let next: {
    name: string;
    instructions: string;
    equipment?: string;
    targetWeight?: string;
    extraAlternatives?: string[];
  } | null = null;

  const genericInstructions = (name: string) =>
    `${name} targets ${exercise.target}. Keep the same sets and reps, and choose a load where the last 1-2 reps are hard while your form stays clean.`;

  if (requestedName && isRealName(requestedName) && !sameAsCurrent(requestedName) && isSafe(requestedName)) {
    next = { name: requestedName, instructions: genericInstructions(requestedName) };
  } else if (safeAlternatives.length > 0) {
    next = { name: safeAlternatives[0], instructions: genericInstructions(safeAlternatives[0]) };
  } else {
    // 2. Ask the AI for a fresh alternative
    try {
      const { system, prompt } = buildExerciseSwapPrompt(
        isRealName(current) ? current : `an exercise for ${exercise.target}`,
        exercise.target,
        equipment,
        injuries
      );
      const ai = await aiService.generateStructured<any>(prompt, system, undefined, undefined, undefined, { task: 'exercise swap', maxTokens: 400 });
      if (isRealName(ai?.name) && !sameAsCurrent(ai.name) && isSafe(ai.name)) {
        next = {
          name: ai.name.trim(),
          instructions: typeof ai.instructions === 'string' && ai.instructions.trim() ? ai.instructions.trim() : genericInstructions(ai.name.trim()),
          equipment: typeof ai.equipment === 'string' && ai.equipment.trim() ? ai.equipment.trim() : undefined,
          targetWeight: typeof ai.targetWeight === 'string' && ai.targetWeight.trim() ? ai.targetWeight.trim() : undefined,
          extraAlternatives: parseStringList(ai.substitutions).filter(n => isRealName(n) && isSafe(n))
        };
      }
    } catch (err: any) {
      console.log('AI exercise swap failed:', err.message);
    }
  }

  if (!next) {
    res.status(503).json({
      error: 'No safe alternative found for this exercise right now. Try again in a moment, or use Regenerate Routine.'
    });
    return;
  }

  // Keep the old exercise in the list so substituting again cycles back to it.
  const remaining = [
    ...storedAlternatives.filter(n => n.toLowerCase() !== next!.name.toLowerCase()),
    ...(next.extraAlternatives || []),
    ...(isRealName(current) ? [current] : [])
  ].filter((n, i, arr) => arr.findIndex(m => m.toLowerCase() === n.toLowerCase()) === i && n.toLowerCase() !== next!.name.toLowerCase());

  const updated = await prisma.exercise.update({
    where: { id: exerciseId },
    data: {
      name: next.name,
      instructions: next.instructions,
      ...(next.equipment ? { equipment: next.equipment } : {}),
      // A different exercise needs a different load; don't carry over the old target weight.
      targetWeight: next.targetWeight || 'Adjust load',
      completedSets: 0,
      isPR: false,
      substitutions: JSON.stringify(remaining)
    }
  });

  res.json({
    exercise: {
      ...updated,
      substitutions: remaining
    }
  });
}

export async function completeWorkout(req: Request, res: Response): Promise<void> {
  const userId = req.user!.userId;
  const { workoutPlanId } = req.body;
  const todayStr = localDateString();

  // One workout per day.
  if (await findTodaysSession(userId, req.user!.email)) {
    res.status(409).json({ error: ALREADY_DONE_MESSAGE, completedToday: true });
    return;
  }

  // Demo account: keep at most one session per day and don't inflate the streak when visitors finish it again.
  const demoRepeat = isDemoEmail(req.user!.email)
    ? (await prisma.workoutSession.deleteMany({ where: { userId, date: todayStr } })).count > 0
    : false;

  const plan = workoutPlanId
    ? await prisma.workoutPlan.findUnique({ where: { id: String(workoutPlanId) }, include: { exercises: true } })
    : null;

  if (plan && plan.userId !== userId) {
    res.status(404).json({ error: 'Workout plan not found' });
    return;
  }

  if (plan) {
    await prisma.workoutPlan.update({
      where: { id: plan.id },
      data: { isCompletedToday: true }
    });
  }

  // Create WorkoutSession entry
  await prisma.workoutSession.create({
    data: {
      userId,
      date: todayStr,
      dayName: plan?.dayName || 'Gym Session',
      durationMinutes: plan?.duration || 50,
      completedExercises: JSON.stringify(plan?.exercises || []),
      notes: 'Completed successfully with active logging.'
    }
  });

  // Streak: +1 if the last workout was yesterday, otherwise start again at 1.
  const profile = await prisma.profile.findUnique({ where: { userId } });
  const continuesStreak = profile?.lastActiveDate === previousLocalDateString();
  const updatedProfile = demoRepeat
    ? await prisma.profile.update({ where: { userId }, data: { lastActiveDate: todayStr } })
    : await prisma.profile.update({
        where: { userId },
        data: {
          streakDays: continuesStreak ? { increment: 1 } : 1,
          totalWorkoutsCompleted: { increment: 1 },
          lastActiveDate: todayStr
        }
      });

  // Evaluate gamification badges
  const newBadges = await evaluateUserBadges(prisma, userId);

  res.json({
    message: 'Workout session saved and streak updated! 🔥',
    profile: serializeProfile(updatedProfile),
    newBadges
  });
}

export async function getWorkoutHistory(req: Request, res: Response): Promise<void> {
  const userId = req.user!.userId;

  const sessions = await prisma.workoutSession.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 20
  });

  const parsed = sessions.map(s => ({
    ...s,
    completedExercises: JSON.parse(s.completedExercises || '[]')
  }));

  res.json({ history: parsed });
}
