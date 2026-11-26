import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import { config } from '../config.js';
import { aiService } from '../ai/aiService.js';
import { buildTextLogPrompt } from '../ai/prompts/textLogPrompt.js';
import { buildMealScanPrompt } from '../ai/prompts/mealScanPrompt.js';
import { evaluateUserBadges } from '../utils/badgeEvaluator.js';
import { localDateString } from '../utils/date.js';
import { getTodayNutrition } from '../utils/todayNutrition.js';

const prisma = new PrismaClient();

// Grounding helper using local FoodItem table
async function groundItemMacros(item: { name: string; portion?: string; calories?: number; protein?: number; carbs?: number; fats?: number }) {
  const allFoods = await prisma.foodItem.findMany();
  const lowerName = item.name.toLowerCase();

  const match = allFoods.find(f => lowerName.includes(f.name.toLowerCase()) || f.name.toLowerCase().includes(lowerName));
  if (match) {
    // If user provided realistic numbers, retain them, otherwise ground using table
    return {
      name: item.name,
      portion: item.portion || match.servingSize,
      calories: item.calories || match.calories,
      protein: item.protein !== undefined ? item.protein : Math.round(match.protein),
      carbs: item.carbs !== undefined ? item.carbs : Math.round(match.carbs),
      fats: item.fats !== undefined ? item.fats : Math.round(match.fats)
    };
  }

  return {
    name: item.name,
    portion: item.portion || '1 serving',
    calories: item.calories || 200,
    protein: item.protein !== undefined ? item.protein : 10,
    carbs: item.carbs !== undefined ? item.carbs : 20,
    fats: item.fats !== undefined ? item.fats : 6
  };
}

export async function parseTextMeal(req: Request, res: Response): Promise<void> {
  const { text } = req.body;

  if (!text || typeof text !== 'string') {
    res.status(400).json({ error: 'Text description of meal is required' });
    return;
  }

  let parsedData: any = null;
  try {
    const { system, prompt } = buildTextLogPrompt(text);
    parsedData = await aiService.generateStructured<any>(prompt, system, undefined, undefined, undefined, { task: 'meal text', maxTokens: 500 });
  } catch (err: any) {
    console.log('AI text parsing fallback:', err.message);
  }

  if (!parsedData || !Array.isArray(parsedData.items) || parsedData.items.length === 0) {
    // Fallback parsing based on common keywords
    const lower = text.toLowerCase();
    const items: any[] = [];
    if (lower.includes('roti') || lower.includes('chapati')) {
      items.push({ name: 'Whole Wheat Roti', portion: '2 pieces (80g)', calories: 208, protein: 6, carbs: 44, fats: 1 });
    }
    if (lower.includes('dal')) {
      items.push({ name: 'Yellow Dal Tadka', portion: '1 cup (150g)', calories: 140, protein: 8, carbs: 20, fats: 3.5 });
    }
    if (lower.includes('chicken')) {
      items.push({ name: 'Grilled Chicken Breast', portion: '150g cooked', calories: 245, protein: 44, carbs: 0, fats: 5 });
    }
    if (lower.includes('paneer')) {
      items.push({ name: 'Low-Fat Paneer', portion: '100g', calories: 180, protein: 18, carbs: 4, fats: 10 });
    }
    if (lower.includes('egg')) {
      items.push({ name: 'Boiled Eggs', portion: '3 eggs', calories: 216, protein: 18, carbs: 1, fats: 14 });
    }
    if (lower.includes('rice')) {
      items.push({ name: 'Cooked Rice', portion: '1 cup (150g)', calories: 195, protein: 4, carbs: 43, fats: 0.5 });
    }
    if (lower.includes('banana')) {
      items.push({ name: 'Banana', portion: '1 medium', calories: 105, protein: 1.3, carbs: 27, fats: 0.3 });
    }

    if (items.length === 0) {
      items.push({ name: text, portion: '1 plate', calories: 350, protein: 20, carbs: 40, fats: 10 });
    }

    parsedData = {
      title: 'Quick Logged Meal',
      category: 'Lunch',
      items
    };
  }

  // Ground and sanitize each item
  const groundedItems = await Promise.all(parsedData.items.map(groundItemMacros));

  const totalCalories = groundedItems.reduce((acc, i) => acc + i.calories, 0);
  const totalProtein = groundedItems.reduce((acc, i) => acc + i.protein, 0);
  const totalCarbs = groundedItems.reduce((acc, i) => acc + i.carbs, 0);
  const totalFats = groundedItems.reduce((acc, i) => acc + i.fats, 0);

  res.json({
    title: parsedData.title || 'Logged Meal',
    category: parsedData.category || 'Lunch',
    items: groundedItems,
    totals: {
      calories: totalCalories,
      protein: totalProtein,
      carbs: totalCarbs,
      fats: totalFats
    }
  });
}

export async function parsePhotoMeal(req: Request, res: Response): Promise<void> {
  const file = req.file;

  let base64Image: string | undefined;
  let imagePath: string | undefined;

  if (file) {
    imagePath = `/uploads/${file.filename}`;
    const fileBuffer = fs.readFileSync(file.path);
    base64Image = fileBuffer.toString('base64');
  }

  let scanResult: any = null;

  if (base64Image) {
    try {
      const { system, prompt } = buildMealScanPrompt();
      scanResult = await aiService.generateStructured<any>(prompt, system, undefined, undefined, [base64Image], { task: 'meal photo', maxTokens: 500 });
    } catch (err: any) {
      console.log('Ollama vision meal scan fallback:', err.message);
    }
  }

  if (!file) {
    res.status(400).json({ error: 'Please attach a food photo to scan.' });
    return;
  }

  if (!scanResult || !Array.isArray(scanResult.detectedItems) || scanResult.detectedItems.length === 0) {
    // Don't invent a meal: without a working vision model we can't know what's in the photo.
    fs.unlink(file.path, () => {});
    res.status(503).json({
      error: aiService.provider === 'claude'
        ? `Couldn't recognise food in this photo. Try a clearer, well-lit photo of the plate, or use the "Natural Language" tab instead.`
        : `Couldn't recognise food in this photo. AI vision needs Ollama running with the "${config.ollamaVisionModel}" model. Use the "Natural Language" tab instead, or start Ollama and try again.`,
      aiUnavailable: true
    });
    return;
  }

  const groundedItems = await Promise.all(scanResult.detectedItems.map(groundItemMacros));

  const totalCalories = groundedItems.reduce((acc, i) => acc + i.calories, 0);
  const totalProtein = groundedItems.reduce((acc, i) => acc + i.protein, 0);
  const totalCarbs = groundedItems.reduce((acc, i) => acc + i.carbs, 0);
  const totalFats = groundedItems.reduce((acc, i) => acc + i.fats, 0);

  res.json({
    title: scanResult.title || 'Scanned Meal',
    confidence: scanResult.confidence || '90% Estimated',
    imagePath,
    items: groundedItems,
    totals: {
      calories: totalCalories,
      protein: totalProtein,
      carbs: totalCarbs,
      fats: totalFats
    }
  });
}

export async function saveMealLog(req: Request, res: Response): Promise<void> {
  const userId = req.user!.userId;
  const { category, name, calories, protein, carbs, fats, source, imagePath, items, confidence } = req.body;
  const todayStr = localDateString();

  const log = await prisma.mealLog.create({
    data: {
      userId,
      date: todayStr,
      category: category || 'Lunch',
      name: name || 'Logged Meal',
      calories: Number(calories) || 0,
      protein: Number(protein) || 0,
      carbs: Number(carbs) || 0,
      fats: Number(fats) || 0,
      source: source || 'manual',
      imagePath: imagePath || null,
      items: JSON.stringify(items || []),
      confidence: confidence || null
    }
  });

  // Update profile consumed totals (including carbs and fats!)
  const updatedProfile = await prisma.profile.update({
    where: { userId },
    data: {
      caloriesConsumed: { increment: Number(calories) || 0 },
      proteinConsumed: { increment: Number(protein) || 0 },
      carbsConsumed: { increment: Number(carbs) || 0 },
      fatsConsumed: { increment: Number(fats) || 0 }
    }
  });

  // Evaluate badges
  const newBadges = await evaluateUserBadges(prisma, userId);

  res.status(201).json({
    log: {
      ...log,
      items: JSON.parse(log.items || '[]')
    },
    profile: updatedProfile,
    newBadges
  });
}

export async function getTodaySummary(req: Request, res: Response): Promise<void> {
  res.json(await getTodayNutrition(prisma, req.user!.userId));
}

export async function getTodayLogs(req: Request, res: Response): Promise<void> {
  const userId = req.user!.userId;
  const todayStr = localDateString();

  const logs = await prisma.mealLog.findMany({
    where: { userId, date: todayStr },
    orderBy: { createdAt: 'desc' }
  });

  const parsed = logs.map(l => ({
    ...l,
    items: JSON.parse(l.items || '[]')
  }));

  res.json({ logs: parsed });
}

export async function deleteMealLog(req: Request, res: Response): Promise<void> {
  const userId = req.user!.userId;
  const id = req.params.id as string;

  const log = await prisma.mealLog.findUnique({ where: { id } });
  if (!log || log.userId !== userId) {
    res.status(404).json({ error: 'Meal log not found' });
    return;
  }

  // Decrement consumed values from profile
  const updatedProfile = await prisma.profile.update({
    where: { userId },
    data: {
      caloriesConsumed: { decrement: log.calories },
      proteinConsumed: { decrement: log.protein },
      carbsConsumed: { decrement: log.carbs },
      fatsConsumed: { decrement: log.fats }
    } as any
  });

  await prisma.mealLog.delete({ where: { id } });

  res.json({ message: 'Meal log deleted successfully', profile: updatedProfile });
}
