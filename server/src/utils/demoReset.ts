/**
 * Daily reset of the shared "Try the demo" account.
 *
 * A clean copy of the demo account (prisma/demo-baseline.json, made with `npm run demo:baseline`)
 * is restored once a day. All dates are moved forward by the days since the copy was taken,
 * so the history always ends yesterday and today's plans are ready but untouched.
 */
import { PrismaClient, Prisma } from '@prisma/client';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { config } from '../config.js';
import { localDateString } from './date.js';
import { evaluateUserBadges } from './badgeEvaluator.js';

// Located relative to this file (src/utils or dist/utils), which also lets Vercel bundle it with the function.
const BASELINE_FILE = fileURLToPath(new URL('../../prisma/demo-baseline.json', import.meta.url));
const SHARED_TABLES = new Set(['Badge', 'FoodItem', 'AiCache']);
const DAY_MS = 86400000;

type Baseline = { capturedOn: string; email: string; tables: Record<string, any[]> };

/** Tables in insert order: each table after the tables its foreign keys point to. */
function tableOrder(): Prisma.DMMF.Model[] {
  const models = Prisma.dmmf.datamodel.models;
  const byName = Object.fromEntries(models.map(m => [m.name, m]));
  const deps = (m: Prisma.DMMF.Model) =>
    m.fields.filter(f => f.kind === 'object' && f.relationFromFields?.length && f.type !== m.name).map(f => f.type);
  const order: string[] = [];
  const visit = (n: string) => { if (order.includes(n)) return; deps(byName[n]).forEach(visit); order.push(n); };
  models.forEach(m => visit(m.name));
  return order.filter(n => !SHARED_TABLES.has(n)).map(n => byName[n]);
}

const delegate = (prisma: PrismaClient, model: string) => (prisma as any)[model[0].toLowerCase() + model.slice(1)];

/** Every row belonging to one user, following foreign keys down from User. */
export async function readUserRows(prisma: PrismaClient, email: string): Promise<Record<string, any[]>> {
  const out: Record<string, any[]> = {};
  const ids: Record<string, string[]> = {};
  for (const m of tableOrder()) {
    let where: any;
    if (m.name === 'User') where = { email };
    else {
      const fk = m.fields.find(f => f.kind === 'object' && f.relationFromFields?.length && ids[f.type]?.length);
      if (!fk) continue;
      where = { [fk.relationFromFields![0]]: { in: ids[fk.type] } };
    }
    const rows = await delegate(prisma, m.name).findMany({ where });
    out[m.name] = rows;
    ids[m.name] = rows.map((r: any) => r.id);
  }
  return out;
}

function shiftDateString(value: string, days: number): string {
  const d = new Date(`${value}T12:00:00`);
  d.setDate(d.getDate() + days);
  return localDateString(d);
}

/** Replace the demo account with the baseline, dates moved forward to today. */
export async function resetDemoAccount(prisma: PrismaClient): Promise<boolean> {
  if (!config.demoEmail) return false;
  if (!fs.existsSync(BASELINE_FILE)) {
    console.error(`[demo] clean copy not found at ${BASELINE_FILE}`);
    return false;
  }
  const baseline: Baseline = JSON.parse(fs.readFileSync(BASELINE_FILE, 'utf8'));
  if (baseline.email !== config.demoEmail) return false;

  const today = localDateString();
  const days = Math.round((new Date(`${today}T12:00:00`).getTime() - new Date(`${baseline.capturedOn}T12:00:00`).getTime()) / DAY_MS);

  await prisma.$transaction(async (tx) => {
    await tx.user.deleteMany({ where: { email: config.demoEmail } }); // cascades to all the account's rows
    for (const m of tableOrder()) {
      let rows = baseline.tables[m.name];
      // Badge ids differ between databases; badges are re-awarded below instead.
      if (m.name === 'UserBadge') rows = [];
      if (!rows?.length) continue;
      const dateFields = m.fields.filter(f => f.type === 'DateTime').map(f => f.name);
      const data = rows.map(row => {
        const r = { ...row };
        for (const [k, v] of Object.entries(r)) {
          if (dateFields.includes(k) && v) r[k] = new Date(new Date(v as string).getTime() + days * DAY_MS);
          else if (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v)) r[k] = shiftDateString(v, days);
        }
        return r;
      });
      await delegate(tx as any, m.name).createMany({ data });
    }
  }, { timeout: 60000 });
  const demo = await prisma.user.findUnique({ where: { email: config.demoEmail } });
  if (demo) await evaluateUserBadges(prisma, demo.id);
  return true;
}

let lastResetDay = '';

/** Reset once at startup, then whenever the date changes (checked every 10 minutes). */
export function scheduleDailyDemoReset(prisma: PrismaClient): void {
  if (process.env.DEMO_DAILY_RESET === 'false') return;
  const tick = async () => {
    const today = localDateString();
    if (today === lastResetDay) return;
    try {
      if (await resetDemoAccount(prisma)) console.log(`[demo] demo account reset for ${today}`);
      lastResetDay = today;
    } catch (err: any) {
      console.error('[demo] reset failed:', err.message);
    }
  };
  tick();
  setInterval(tick, 10 * 60 * 1000).unref();
}
