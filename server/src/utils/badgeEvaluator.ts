import { PrismaClient } from '@prisma/client';

export async function evaluateUserBadges(prisma: PrismaClient, userId: string): Promise<string[]> {
  const newlyUnlocked: string[] = [];

  const profile = await prisma.profile.findUnique({ where: { userId } });
  if (!profile) return newlyUnlocked;

  const existingBadges = await prisma.userBadge.findMany({
    where: { userId },
    include: { badge: true }
  });
  const ownedCodes = new Set(existingBadges.map(b => b.badge.code));

  const allBadges = await prisma.badge.findMany();
  const badgeMap = new Map(allBadges.map(b => [b.code, b.id]));

  const unlock = async (code: string) => {
    if (!ownedCodes.has(code) && badgeMap.has(code)) {
      await prisma.userBadge.create({
        data: {
          userId,
          badgeId: badgeMap.get(code)!
        }
      });
      newlyUnlocked.push(code);
      ownedCodes.add(code);
    }
  };

  // 1. 7-day streak
  if (profile.streakDays >= 7) {
    await unlock('7-day-streak');
  }

  // 2. Iron Warrior (20 workouts)
  if (profile.totalWorkoutsCompleted >= 20) {
    await unlock('iron-warrior');
  }

  // 3. BodyVision Pro (3 progress photos)
  const reportCount = await prisma.bodyVisionReport.count({ where: { userId } });
  if (reportCount >= 3) {
    await unlock('bodyvision-pro');
  }

  // 5. Protein Master (>= 150g protein or hitting target)
  const recentLogs = await prisma.mealLog.findMany({
    where: { userId },
    orderBy: { date: 'desc' },
    take: 30
  });

  // Group protein by date
  const proteinByDate: Record<string, number> = {};
  for (const log of recentLogs) {
    proteinByDate[log.date] = (proteinByDate[log.date] || 0) + log.protein;
  }
  const dates = Object.keys(proteinByDate).sort().reverse();
  let consecutiveHighProteinDays = 0;
  for (const d of dates) {
    if (proteinByDate[d] >= 140) {
      consecutiveHighProteinDays++;
    } else {
      break;
    }
  }
  if (consecutiveHighProteinDays >= 5) {
    await unlock('protein-master');
  }

  // 6. Macro Titan (14 days within 2% margin)
  if (profile.weeklyConsistencyScore >= 90 && profile.streakDays >= 14) {
    await unlock('macro-titan');
  }

  return newlyUnlocked;
}
