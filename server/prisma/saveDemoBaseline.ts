/**
 * Saves the current demo account as the clean copy the daily reset restores.
 *
 *   npm --prefix server run demo:baseline
 *
 * Today's logs (meals, water, finished workouts), chats and ticked-off progress are left out,
 * so every day starts with the plans ready and nothing logged yet.
 */
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { config } from '../src/config.js';
import { localDateString } from '../src/utils/date.js';
import { readUserRows } from '../src/utils/demoReset.js';

const prisma = new PrismaClient();
const today = localDateString();

const tables = await readUserRows(prisma, config.demoEmail);
if (!tables.User?.length) {
  console.error(`No account found for ${config.demoEmail}`);
  process.exit(1);
}

for (const t of ['MealLog', 'WaterLog', 'WorkoutSession']) tables[t] = (tables[t] || []).filter(r => r.date !== today);
tables.ChatConversation = [];
tables.ChatMessage = [];
tables.PlannedMeal = (tables.PlannedMeal || []).map(r => ({ ...r, isCompleted: false }));
tables.WorkoutPlan = (tables.WorkoutPlan || []).map(r => ({ ...r, isCompletedToday: false }));
tables.Exercise = (tables.Exercise || []).map(r => ({ ...r, completedSets: 0, isPR: false }));
const lastWorkout = tables.WorkoutSession.map(s => s.date).sort().pop() ?? null;
tables.Profile = tables.Profile.map(p => ({ ...p, lastActiveDate: lastWorkout }));

const file = path.resolve('prisma/demo-baseline.json');
fs.writeFileSync(file, JSON.stringify({ capturedOn: today, email: config.demoEmail, tables }));
console.log(`Saved ${file}`);
console.log(Object.entries(tables).filter(([, v]) => v.length).map(([k, v]) => `${k}:${v.length}`).join(' '));
await prisma.$disconnect();
