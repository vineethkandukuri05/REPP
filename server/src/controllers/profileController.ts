import { Request, Response } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import { calculateMacros } from '../utils/fitnessMath.js';
import { config } from '../config.js';
import { serializeProfile } from '../utils/profileSerializer.js';
import { localDateString } from '../utils/date.js';

const prisma = new PrismaClient();

export async function getProfile(req: Request, res: Response): Promise<void> {
  const userId = req.user!.userId;

  let profile = await prisma.profile.findUnique({ where: { userId } });
  if (!profile) {
    profile = await prisma.profile.create({
      data: { userId }
    });
  }

  res.json({ profile: serializeProfile(profile) });
}

function positiveIntOr(value: unknown, fallback: number): number {
  const n = Math.round(Number(value));
  return value !== undefined && value !== null && value !== '' && Number.isFinite(n) && n > 0 ? n : fallback;
}

export async function updateProfile(req: Request, res: Response): Promise<void> {
  const userId = req.user!.userId;
  const data = req.body;

  // Re-calculate macros if metrics are updated
  const existing = await prisma.profile.findUnique({ where: { userId } });
  if (!existing) {
    res.status(404).json({ error: 'Profile not found' });
    return;
  }

  for (const key of ['weight', 'height', 'age', 'targetWeight', 'waist', 'chest', 'arms', 'workoutDaysPerWeek', 'dailyCalorieTarget', 'proteinTarget']) {
    if (data[key] !== undefined && data[key] !== null && data[key] !== '' && !Number.isFinite(Number(data[key]))) {
      res.status(400).json({ error: `${key} must be a number` });
      return;
    }
  }
  if (data.workoutDaysPerWeek !== undefined && (Number(data.workoutDaysPerWeek) < 1 || Number(data.workoutDaysPerWeek) > 7)) {
    res.status(400).json({ error: 'Workout days per week must be between 1 and 7' });
    return;
  }

  const weight = data.weight !== undefined ? Number(data.weight) : existing.weight;
  const height = data.height !== undefined ? Number(data.height) : existing.height;
  const age = data.age !== undefined ? Number(data.age) : existing.age;
  const sex = data.sex || existing.sex;
  const activityLevel = data.activityLevel || existing.activityLevel;
  const primaryGoal = data.primaryGoal || existing.primaryGoal;

  const macros = calculateMacros({
    weight,
    height,
    age,
    sex,
    activityLevel,
    primaryGoal
  });

  const updated = await prisma.profile.update({
    where: { userId },
    data: {
      name: data.name !== undefined ? data.name : existing.name,
      age,
      sex,
      height,
      weight,
      targetWeight: data.targetWeight !== undefined ? Number(data.targetWeight) : existing.targetWeight,
      waist: data.waist !== undefined ? Number(data.waist) : existing.waist,
      chest: data.chest !== undefined ? Number(data.chest) : existing.chest,
      arms: data.arms !== undefined ? Number(data.arms) : existing.arms,
      experienceLevel: data.experienceLevel || existing.experienceLevel,

      healthConditions: data.healthConditions ? JSON.stringify(data.healthConditions) : existing.healthConditions,
      injuries: data.injuries ? JSON.stringify(data.injuries) : existing.injuries,
      activityLevel,
      dailyRoutine: data.dailyRoutine !== undefined ? data.dailyRoutine : existing.dailyRoutine,
      sleepDuration: data.sleepDuration || existing.sleepDuration,
      stressLevel: data.stressLevel || existing.stressLevel,

      primaryGoal,
      goalDescription: data.goalDescription !== undefined ? data.goalDescription : existing.goalDescription,

      dietPreference: data.dietPreference || existing.dietPreference,
      foodAllergies: data.foodAllergies ? JSON.stringify(data.foodAllergies) : existing.foodAllergies,
      dietaryRestrictions: data.dietaryRestrictions ? JSON.stringify(data.dietaryRestrictions) : existing.dietaryRestrictions,
      preferredCuisines: data.preferredCuisines ? JSON.stringify(data.preferredCuisines) : existing.preferredCuisines,
      availableFoods: data.availableFoods ? JSON.stringify(data.availableFoods) : existing.availableFoods,
      dislikedFoods: data.dislikedFoods ? JSON.stringify(data.dislikedFoods) : existing.dislikedFoods,
      dailyBudget: data.dailyBudget !== undefined ? Number(data.dailyBudget) : existing.dailyBudget,
      mealsPerDay: data.mealsPerDay !== undefined ? Number(data.mealsPerDay) : existing.mealsPerDay,

      workoutLocation: data.workoutLocation || existing.workoutLocation,
      workoutSplit: data.workoutSplit || existing.workoutSplit,
      availableEquipment: data.availableEquipment ? JSON.stringify(data.availableEquipment) : existing.availableEquipment,
      workoutDaysPerWeek: data.workoutDaysPerWeek !== undefined ? Number(data.workoutDaysPerWeek) : existing.workoutDaysPerWeek,
      workoutDuration: data.workoutDuration !== undefined ? Number(data.workoutDuration) : existing.workoutDuration,
      excludedExercises: data.excludedExercises ? JSON.stringify(data.excludedExercises) : existing.excludedExercises,

      // Recalculated from body metrics unless the user set a target explicitly.
      dailyCalorieTarget: positiveIntOr(data.dailyCalorieTarget, macros.dailyCalorieTarget),
      proteinTarget: positiveIntOr(data.proteinTarget, macros.proteinTarget),
      carbsTarget: macros.carbsTarget,
      fatsTarget: macros.fatsTarget,
      waterTarget: macros.waterTarget
    }
  });

  // Log today's weight & measurements to history only when one of them changed
  const measurementChanged = (['weight', 'waist', 'chest', 'arms'] as const).some(
    k => data[k] !== undefined && Number(data[k]) !== Number((existing as any)[k])
  );
  const todayStr = localDateString();
  if (measurementChanged) await prisma.bodyMeasurement.create({
    data: {
      userId,
      date: todayStr,
      weight,
      waist: data.waist !== undefined ? Number(data.waist) : existing.waist,
      chest: data.chest !== undefined ? Number(data.chest) : existing.chest,
      arms: data.arms !== undefined ? Number(data.arms) : existing.arms
    }
  });

  res.json({ profile: serializeProfile(updated), macros });
}

function optionalNumber(value: unknown): number | null {
  const n = Number(value);
  return value === '' || value == null || !Number.isFinite(n) || n <= 0 ? null : n;
}

export async function completeOnboarding(req: Request, res: Response): Promise<void> {
  const userId = req.user!.userId;
  const data = req.body;

  const weight = Number(data.weight) || 70;
  const height = Number(data.height) || 175;
  const age = Number(data.age) || 25;
  const sex = data.sex || 'Male';
  const activityLevel = data.activityLevel || 'Moderately Active (3-4 days exercise)';
  const primaryGoal = data.primaryGoal || 'Body Recomposition';

  const macros = calculateMacros({
    weight,
    height,
    age,
    sex,
    activityLevel,
    primaryGoal
  });

  const profile = await prisma.profile.upsert({
    where: { userId },
    update: {
      name: data.name || 'Athlete',
      age,
      sex,
      height,
      weight,
      targetWeight: Number(data.targetWeight) || weight,
      waist: Number(data.waist) || 80,
      chest: Number(data.chest) || 95,
      arms: Number(data.arms) || 35,
      experienceLevel: data.experienceLevel || 'Intermediate',

      healthConditions: JSON.stringify(data.healthConditions || []),
      injuries: JSON.stringify(data.injuries || []),
      activityLevel,
      dailyRoutine: data.dailyRoutine || '',
      sleepDuration: data.sleepDuration || '7.5 hours',
      stressLevel: data.stressLevel || 'Moderate',

      primaryGoal,
      goalDescription: data.goalDescription || '',

      dietPreference: data.dietPreference || 'Non-Vegetarian',
      foodAllergies: JSON.stringify(data.foodAllergies || []),
      dietaryRestrictions: JSON.stringify(data.dietaryRestrictions || []),
      preferredCuisines: JSON.stringify(data.preferredCuisines || ['Indian North/South']),
      availableFoods: JSON.stringify(data.availableFoods || []),
      dislikedFoods: JSON.stringify(data.dislikedFoods || []),
      dailyBudget: Number(data.dailyBudget) || 450,
      mealsPerDay: Number(data.mealsPerDay) || 4,

      workoutLocation: data.workoutLocation || 'Gym Workouts',
      workoutSplit: data.workoutSplit || '4-Day Upper/Lower Split',
      availableEquipment: JSON.stringify(data.availableEquipment || []),
      workoutDaysPerWeek: Number(data.workoutDaysPerWeek) || 4,
      workoutDuration: Number(data.workoutDuration) || 60,
      excludedExercises: JSON.stringify(data.excludedExercises || []),

      // Recalculated from body metrics unless the user set a target explicitly.
      dailyCalorieTarget: positiveIntOr(data.dailyCalorieTarget, macros.dailyCalorieTarget),
      proteinTarget: positiveIntOr(data.proteinTarget, macros.proteinTarget),
      carbsTarget: macros.carbsTarget,
      fatsTarget: macros.fatsTarget,
      waterTarget: macros.waterTarget,
      streakDays: 1,
      weeklyConsistencyScore: 85,
      isOnboarded: true
    },
    create: {
      userId,
      name: data.name || 'Athlete',
      age,
      sex,
      height,
      weight,
      targetWeight: Number(data.targetWeight) || weight,
      waist: Number(data.waist) || 80,
      chest: Number(data.chest) || 95,
      arms: Number(data.arms) || 35,
      experienceLevel: data.experienceLevel || 'Intermediate',

      healthConditions: JSON.stringify(data.healthConditions || []),
      injuries: JSON.stringify(data.injuries || []),
      activityLevel,
      dailyRoutine: data.dailyRoutine || '',
      sleepDuration: data.sleepDuration || '7.5 hours',
      stressLevel: data.stressLevel || 'Moderate',

      primaryGoal,
      goalDescription: data.goalDescription || '',

      dietPreference: data.dietPreference || 'Non-Vegetarian',
      foodAllergies: JSON.stringify(data.foodAllergies || []),
      dietaryRestrictions: JSON.stringify(data.dietaryRestrictions || []),
      preferredCuisines: JSON.stringify(data.preferredCuisines || ['Indian North/South']),
      availableFoods: JSON.stringify(data.availableFoods || []),
      dislikedFoods: JSON.stringify(data.dislikedFoods || []),
      dailyBudget: Number(data.dailyBudget) || 450,
      mealsPerDay: Number(data.mealsPerDay) || 4,

      workoutLocation: data.workoutLocation || 'Gym Workouts',
      workoutSplit: data.workoutSplit || '4-Day Upper/Lower Split',
      availableEquipment: JSON.stringify(data.availableEquipment || []),
      workoutDaysPerWeek: Number(data.workoutDaysPerWeek) || 4,
      workoutDuration: Number(data.workoutDuration) || 60,
      excludedExercises: JSON.stringify(data.excludedExercises || []),

      // Recalculated from body metrics unless the user set a target explicitly.
      dailyCalorieTarget: positiveIntOr(data.dailyCalorieTarget, macros.dailyCalorieTarget),
      proteinTarget: positiveIntOr(data.proteinTarget, macros.proteinTarget),
      carbsTarget: macros.carbsTarget,
      fatsTarget: macros.fatsTarget,
      waterTarget: macros.waterTarget,
      streakDays: 1,
      weeklyConsistencyScore: 85,
      isOnboarded: true
    }
  });

  // Log baseline measurement
  const todayStr = localDateString();
  await prisma.bodyMeasurement.create({
    data: {
      userId,
      date: todayStr,
      weight,
      // Only record measurements the user actually entered (no made-up defaults in their history).
      waist: optionalNumber(data.waist),
      chest: optionalNumber(data.chest),
      arms: optionalNumber(data.arms)
    }
  });

  res.json({ profile: serializeProfile(profile), macros });
}

export async function changePassword(req: Request, res: Response): Promise<void> {
  const userId = req.user!.userId;
  const { currentPassword, newPassword } = req.body;

  if (!newPassword || newPassword.length < 6) {
    res.status(400).json({ error: 'New password must be at least 6 characters' });
    return;
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  // Google-only accounts have no password yet: they may set one (enables email login too).
  if (user.passwordHash) {
    const match = typeof currentPassword === 'string' && await bcrypt.compare(currentPassword, user.passwordHash);
    if (!match) {
      res.status(400).json({ error: 'Current password is incorrect' });
      return;
    }
  }

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(newPassword, salt);

  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash }
  });

  res.json({ message: 'Password updated successfully' });
}

// Parse JSON-in-text columns so the export is readable rather than full of escaped strings.
function parseJsonField(value: unknown): unknown {
  if (typeof value !== 'string' || !/^\s*("?\s*[[{])/.test(value)) return value;
  let parsed: unknown = value;
  for (let i = 0; i < 3 && typeof parsed === 'string'; i++) {
    try { parsed = JSON.parse(parsed); } catch { return value; }
  }
  return parsed;
}

function parseFields<T extends Record<string, any>>(row: T, fields: string[]): T {
  const out: Record<string, any> = { ...row };
  for (const f of fields) if (f in out) out[f] = parseJsonField(out[f]);
  return out as T;
}

export async function exportData(req: Request, res: Response): Promise<void> {
  const userId = req.user!.userId;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      profile: true,
      mealPlans: { include: { meals: true } },
      mealLogs: { orderBy: { createdAt: 'asc' } },
      workoutPlans: { include: { exercises: true } },
      workoutSessions: { orderBy: { createdAt: 'asc' } },
      waterLogs: { orderBy: { date: 'asc' } },
      measurements: { orderBy: [{ date: 'asc' }, { createdAt: 'asc' }] },
      bodyVisionReports: { orderBy: { createdAt: 'asc' } },
      groceryItems: true,
      adaptiveReviews: true,
      badges: { include: { badge: true } },
      conversations: { include: { messages: true } },
      weeklyPlans: { where: { status: { in: ['accepted', 'archived'] } }, orderBy: { createdAt: 'asc' } },
      weeklyFeedback: { orderBy: { weekStart: 'asc' } }
    }
  });

  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  const { passwordHash: _omit, ...safeUser } = user;
  const exported = {
    exportedAt: new Date().toISOString(),
    format: 'REPP personal data export v1',
    ...safeUser,
    profile: serializeProfile(user.profile),
    mealPlans: user.mealPlans.map(mp => ({ ...mp, meals: mp.meals.map(m => parseFields(m, ['ingredients'])) })),
    mealLogs: user.mealLogs.map(m => parseFields(m, ['items'])),
    workoutPlans: user.workoutPlans.map(wp => ({
      ...parseFields(wp, ['targetMuscles']),
      exercises: wp.exercises.map(e => parseFields(e, ['substitutions']))
    })),
    workoutSessions: user.workoutSessions.map(w => parseFields(w, ['completedExercises'])),
    adaptiveReviews: user.adaptiveReviews.map(r => parseFields(r as any, Object.keys(r))),
    weeklyPlans: user.weeklyPlans.map(p => parseFields(p as any, ['analysis', 'insights', 'recommendations', 'plan', 'customizations', 'aiSummary']))
  };

  res.setHeader('Content-Disposition', `attachment; filename="REPP_UserData_${localDateString()}.json"`);
  res.json(exported);
}

function removeStoredFile(urlPath: string | null | undefined): void {
  if (!urlPath || /^https?:/i.test(urlPath)) return;
  const filename = path.basename(urlPath);
  for (const dir of [config.privateUploadDir, config.uploadDir]) {
    const full = path.join(dir, filename);
    if (fs.existsSync(full)) {
      try { fs.unlinkSync(full); } catch {}
    }
  }
}

export async function deleteAccount(req: Request, res: Response): Promise<void> {
  const userId = req.user!.userId;
  const { password, confirmText } = (req.body || {}) as { password?: string; confirmText?: string };

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  // Require the current password so a stolen session can't wipe the account.
  if (user.passwordHash) {
    if (!password || !(await bcrypt.compare(password, user.passwordHash))) {
      res.status(401).json({ error: 'Incorrect password. Your account was not deleted.' });
      return;
    }
  } else if (confirmText !== 'DELETE') {
    // Google-only account (no password): require the typed confirmation instead.
    res.status(400).json({ error: 'Type DELETE to confirm. Your account was not deleted.' });
    return;
  }

  // Remove uploaded files (body progress photos and meal photos) from disk.
  const [reports, mealLogs] = await Promise.all([
    prisma.bodyVisionReport.findMany({ where: { userId }, select: { frontPhotoPath: true, sidePhotoPath: true, backPhotoPath: true } }),
    prisma.mealLog.findMany({ where: { userId, imagePath: { not: null } }, select: { imagePath: true } })
  ]);
  for (const r of reports) [r.frontPhotoPath, r.sidePhotoPath, r.backPhotoPath].forEach(removeStoredFile);
  for (const m of mealLogs) removeStoredFile(m.imagePath);

  // Delete user (cascade deletes profile and all related records)
  await prisma.user.delete({ where: { id: userId } });
  res.clearCookie('repp_token');
  res.json({ message: 'Account and associated data deleted completely' });
}
