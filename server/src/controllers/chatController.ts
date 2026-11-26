import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { aiService } from '../ai/aiService.js';
import { buildAskCoachSystemPrompt, CoachContext } from '../ai/prompts/askCoachPrompt.js';
import { localDateString } from '../utils/date.js';
import { getTodayNutrition } from '../utils/todayNutrition.js';

const prisma = new PrismaClient();

const MAX_MESSAGE_LENGTH = 2000;
const HISTORY_FOR_CONTEXT = 10;

function parseList(value: unknown): string[] {
  let parsed: unknown = value;
  for (let i = 0; i < 3 && typeof parsed === 'string'; i++) {
    try { parsed = JSON.parse(parsed); } catch { return []; }
  }
  return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === 'string' && v.trim() !== '') : [];
}

function greeting(name?: string | null): string {
  return `Hi ${name || 'there'}! I'm your REPP AI Coach. I can see your goals, today's meals, water and workout. Ask me anything about food, training or recovery.`;
}

// Demo visitors each have their own conversation (visitorId); everyone else has visitorId null.
function chatScope(req: Request) {
  return { userId: req.user!.userId, visitorId: req.user!.visitorId ?? null };
}

async function getOrCreateConversation(scope: { userId: string; visitorId: string | null }) {
  const existing = await prisma.chatConversation.findFirst({
    where: scope,
    orderBy: { createdAt: 'asc' }
  });
  return existing ?? prisma.chatConversation.create({ data: scope });
}

/** Builds the coach's view of the user from today's actual logs (not running counters). */
async function buildCoachContext(userId: string): Promise<CoachContext | null> {
  const today = localDateString();
  const [profile, nutrition, water, workoutToday, lastSession, measurements] = await Promise.all([
    prisma.profile.findUnique({ where: { userId } }),
    getTodayNutrition(prisma, userId),
    prisma.waterLog.findFirst({ where: { userId, date: today } }),
    prisma.workoutPlan.findFirst({ where: { userId }, orderBy: { createdAt: 'desc' }, include: { exercises: true } }),
    prisma.workoutSession.findFirst({ where: { userId }, orderBy: { createdAt: 'desc' } }),
    prisma.bodyMeasurement.findMany({ where: { userId }, orderBy: [{ date: 'desc' }, { createdAt: 'desc' }], take: 10 })
  ]);
  if (!profile) return null;

  const eatenLabels = [
    ...nutrition.loggedMeals.map(m => `${m.name} (${m.calories} kcal, ${m.protein} g protein)`),
    ...nutrition.planMealsEaten.map(m => `${m.name} (${m.calories} kcal, ${m.protein} g protein, from diet plan)`)
  ];

  let weightTrend: string | null = null;
  if (measurements.length > 1) {
    const latest = measurements[0];
    const oldest = measurements[measurements.length - 1];
    const delta = Math.round((latest.weight - oldest.weight) * 10) / 10;
    weightTrend = `${delta > 0 ? '+' : ''}${delta} kg from ${oldest.date} (${oldest.weight} kg) to ${latest.date} (${latest.weight} kg)`;
  }

  return {
    name: profile.name,
    age: profile.age,
    sex: profile.sex,
    heightCm: profile.height,
    primaryGoal: profile.primaryGoal,
    experienceLevel: profile.experienceLevel,
    weight: profile.weight,
    targetWeight: profile.targetWeight,
    weightTrend,
    dailyCalorieTarget: profile.dailyCalorieTarget,
    proteinTarget: profile.proteinTarget,
    carbsTarget: profile.carbsTarget,
    fatsTarget: profile.fatsTarget,
    caloriesConsumed: nutrition.consumed.calories,
    proteinConsumed: nutrition.consumed.protein,
    carbsConsumed: nutrition.consumed.carbs,
    fatsConsumed: nutrition.consumed.fats,
    mealsEatenToday: eatenLabels,
    plannedMealsRemaining: nutrition.planMealsLeft.map(m => `${m.category}: ${m.name} (${m.calories} kcal, ${m.protein} g protein)`),
    waterIntake: water?.amountMl ?? 0,
    waterTarget: profile.waterTarget,
    workoutSplit: profile.workoutSplit,
    todaysWorkout: workoutToday
      ? `${workoutToday.dayName}: ${workoutToday.exercises.map(e => `${e.name} ${e.sets}x${e.reps}`).join(', ')}`
      : null,
    workoutDoneToday: lastSession?.date === today,
    lastWorkoutDate: lastSession?.date ?? null,
    streakDays: profile.streakDays,
    injuries: parseList(profile.injuries),
    dietPreference: profile.dietPreference,
    foodAllergies: parseList(profile.foodAllergies),
    todayDate: today
  };
}

export async function getChatHistory(req: Request, res: Response): Promise<void> {
  const conversation = await getOrCreateConversation(chatScope(req));
  const messages = await prisma.chatMessage.findMany({
    where: { conversationId: conversation.id },
    orderBy: { createdAt: 'asc' }
  });

  if (messages.length === 0) {
    const profile = await prisma.profile.findUnique({ where: { userId: req.user!.userId } });
    messages.push(await prisma.chatMessage.create({
      data: { conversationId: conversation.id, sender: 'ai', text: greeting(profile?.name) }
    }));
  }

  res.json({ conversationId: conversation.id, messages });
}

export async function streamChat(req: Request, res: Response): Promise<void> {
  const userId = req.user!.userId;
  const message = typeof req.body?.message === 'string' ? req.body.message.trim() : '';

  if (!message) {
    res.status(400).json({ error: 'Message cannot be empty' });
    return;
  }
  if (message.length > MAX_MESSAGE_LENGTH) {
    res.status(400).json({ error: `Message is too long (max ${MAX_MESSAGE_LENGTH} characters).` });
    return;
  }

  // Only ever use the caller's own conversation.
  const requestedId = typeof req.body?.conversationId === 'string' ? req.body.conversationId : null;
  const conversation =
    (requestedId && await prisma.chatConversation.findFirst({ where: { id: requestedId, ...chatScope(req) } })) ||
    await getOrCreateConversation(chatScope(req));

  const ctx = await buildCoachContext(userId);
  if (!ctx) {
    res.status(404).json({ error: 'Profile not found' });
    return;
  }

  // Recent history (before this message) for conversational context
  const history = await prisma.chatMessage.findMany({
    where: { conversationId: conversation.id },
    orderBy: { createdAt: 'desc' },
    take: HISTORY_FOR_CONTEXT
  });
  history.reverse();

  await prisma.chatMessage.create({
    data: { conversationId: conversation.id, sender: 'user', text: message }
  });

  const formattedMessages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
    { role: 'system', content: buildAskCoachSystemPrompt(ctx) },
    ...history.map(m => ({
      role: (m.sender === 'user' ? 'user' : 'assistant') as 'user' | 'assistant',
      content: m.text
    })),
    { role: 'user', content: message }
  ];

  // Server-sent events
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const send = (data: object) => res.write(`data: ${JSON.stringify(data)}\n\n`);

  let fullAiReply = '';
  const controller = new AbortController();
  let clientGone = false;
  res.on('close', () => {
    if (!res.writableEnded) {
      clientGone = true;
      controller.abort();
    }
  });

  try {
    await aiService.chatStream(
      formattedMessages,
      (chunk) => {
        fullAiReply += chunk;
        send({ chunk });
      },
      controller.signal
    );
  } catch (err: any) {
    if (clientGone) return;
    console.log('Ask REPP chat error:', err.message);

    if (!fullAiReply.trim()) {
      // Nothing was generated: say so plainly instead of pretending to answer.
      const errorText = err.message?.includes('offline')
        ? "I can't reach the AI engine right now (Ollama isn't running), so I can't answer that properly. Please start Ollama and ask again."
        : "Sorry, I couldn't generate an answer just now. Please try asking again.";
      send({ error: errorText });
      send({ done: true });
      res.end();
      return;
    }
    const note = '\n\n(My reply was cut off. Please ask again if you need the rest.)';
    fullAiReply += note;
    send({ chunk: note });
  }

  if (fullAiReply.trim()) {
    const saved = await prisma.chatMessage.create({
      data: { conversationId: conversation.id, sender: 'ai', text: fullAiReply.trim() }
    });
    send({ done: true, messageId: saved.id, conversationId: conversation.id });
  } else {
    send({ done: true });
  }
  res.end();
}

export async function clearChat(req: Request, res: Response): Promise<void> {
  const conversations = await prisma.chatConversation.findMany({ where: chatScope(req), select: { id: true } });

  await prisma.chatMessage.deleteMany({ where: { conversationId: { in: conversations.map(c => c.id) } } });

  res.json({ message: 'Chat conversation cleared' });
}
