import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function getUserBadges(req: Request, res: Response): Promise<void> {
  const userId = req.user!.userId;

  const allBadges = await prisma.badge.findMany();
  const unlockedBadges = await prisma.userBadge.findMany({
    where: { userId },
    select: { badgeId: true, unlockedAt: true }
  });

  const unlockedMap = new Map(unlockedBadges.map(ub => [ub.badgeId, ub.unlockedAt]));

  const result = allBadges.map(b => ({
    id: b.id,
    code: b.code,
    title: b.title,
    icon: b.icon,
    desc: b.desc,
    unlocked: unlockedMap.has(b.id),
    unlockedAt: unlockedMap.get(b.id) || null
  }));

  res.json({ badges: result });
}
