import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { localDateString } from '../utils/date.js';

const prisma = new PrismaClient();

export async function getWaterIntake(req: Request, res: Response): Promise<void> {
  const userId = req.user!.userId;
  const todayStr = localDateString();

  const log = await prisma.waterLog.findUnique({
    where: { userId_date: { userId, date: todayStr } }
  });

  const profile = await prisma.profile.findUnique({
    where: { userId },
    select: { waterTarget: true, waterIntake: true }
  });

  res.json({
    waterIntake: log?.amountMl ?? profile?.waterIntake ?? 0,
    waterTarget: profile?.waterTarget ?? 3000
  });
}

export async function updateWaterIntake(req: Request, res: Response): Promise<void> {
  const userId = req.user!.userId;
  const { amountMl } = req.body;
  const todayStr = localDateString();
  const amount = Math.max(0, Number(amountMl) || 0);

  await prisma.waterLog.upsert({
    where: { userId_date: { userId, date: todayStr } },
    update: { amountMl: amount },
    create: { userId, date: todayStr, amountMl: amount }
  });

  const updatedProfile = await prisma.profile.update({
    where: { userId },
    data: { waterIntake: amount }
  });

  res.json({
    waterIntake: amount,
    waterTarget: updatedProfile.waterTarget
  });
}
