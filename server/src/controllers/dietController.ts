import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { aiService } from '../ai/aiService.js';
import { buildDietPlanPrompt, buildMealSwapPrompt } from '../ai/prompts/dietPlanPrompt.js';
import { validateMealSafety } from '../ai/safetyValidators.js';
import { localDateString } from '../utils/date.js';
import { getTodaysActivePlan } from '../utils/todayNutrition.js';

const prisma = new PrismaClient();

// High quality fallback meals constructed from seeded Indian nutrition database
function getFallbackMeals(profile: any) {
  const isVeg = profile.dietPreference.toLowerCase().includes('veg') && !profile.dietPreference.toLowerCase().includes('non');
  const targetCals = profile.dailyCalorieTarget || 2000;

  if (isVeg) {
    return [
      {
        category: 'Breakfast',
        time: '08:30 AM',
        name: 'High-Protein Oats with Almonds & Greek Yogurt',
        rawVsCooked: 'Rolled Oats (50g dry) + 100g Greek Yogurt + 10g Almonds',
        calories: Math.round(targetCals * 0.22),
        protein: 26,
        carbs: 45,
        fats: 12,
        prepInstructions: 'Cook rolled oats in water or skim milk. Stir in greek yogurt and garnish with crushed almonds.',
        ingredients: JSON.stringify([
          { name: 'Rolled Oats', qty: '50g dry', calories: 190 },
          { name: 'Greek Yogurt', qty: '100g', calories: 90 },
          { name: 'Almonds', qty: '10g', calories: 58 }
        ])
      },
      {
        category: 'Lunch',
        time: '01:30 PM',
        name: 'Whole Wheat Rotis with Paneer Bhurji & Dal Tadka',
        rawVsCooked: '2 Rotis (60g flour) + 100g Low-fat Paneer + 1 Cup Dal (150g)',
        calories: Math.round(targetCals * 0.35),
        protein: 42,
        carbs: 65,
        fats: 16,
        prepInstructions: 'Crumble low-fat paneer with diced tomatoes and spices. Serve hot with 2 fresh whole wheat rotis and yellow dal tadka.',
        ingredients: JSON.stringify([
          { name: 'Roti / Chapati', qty: '2 pieces (80g)', calories: 208 },
          { name: 'Low-Fat Paneer', qty: '100g', calories: 180 },
          { name: 'Yellow Dal Tadka', qty: '1 cup (150g)', calories: 140 },
          { name: 'Mixed Green Salad', qty: '1 bowl', calories: 35 }
        ])
      },
      {
        category: 'Evening Snack',
        time: '05:30 PM',
        name: 'Spiced Soya Chunks Tikka Chaat',
        rawVsCooked: 'Soya Chunks (40g dry → 120g soaked) + Mint Chutney',
        calories: Math.round(targetCals * 0.18),
        protein: 24,
        carbs: 20,
        fats: 4,
        prepInstructions: 'Boil soya chunks, drain water, toss with lemon, chaat masala, and fresh mint chutney.',
        ingredients: JSON.stringify([
          { name: 'Soya Chunks', qty: '40g dry', calories: 138 },
          { name: 'Mint Chutney & Spices', qty: '2 tbsp', calories: 30 }
        ])
      },
      {
        category: 'Dinner',
        time: '08:45 PM',
        name: 'Steamed Brown Rice with Rajma & Cucumber Salad',
        rawVsCooked: 'Brown Rice (50g dry → 125g cooked) + 1 Cup Rajma (150g)',
        calories: Math.round(targetCals * 0.25),
        protein: 28,
        carbs: 58,
        fats: 10,
        prepInstructions: 'Simmer kidney beans in light onion-tomato gravy. Pair with steamed brown rice and cucumber slices.',
        ingredients: JSON.stringify([
          { name: 'Cooked Brown Rice', qty: '1 cup (150g)', calories: 165 },
          { name: 'Rajma Curry', qty: '1 cup (150g)', calories: 190 },
          { name: 'Mixed Green Salad', qty: '1 bowl', calories: 35 }
        ])
      }
    ];
  }

  // Non-Veg standard
  return [
    {
      category: 'Breakfast',
      time: '08:30 AM',
      name: 'High-Protein Oats & Boiled Eggs',
      rawVsCooked: 'Oats (50g dry) + 3 Whole Eggs + 10g Almonds',
      calories: Math.round(targetCals * 0.24),
      protein: 34,
      carbs: 45,
      fats: 16,
      prepInstructions: 'Cook rolled oats in water or skim milk. Boil 3 eggs to medium firmness. Garnish with chopped almonds.',
      ingredients: JSON.stringify([
        { name: 'Rolled Oats', qty: '50g dry', calories: 190 },
        { name: 'Whole Egg', qty: '3 eggs', calories: 216 },
        { name: 'Almonds', qty: '10g', calories: 58 }
      ])
    },
    {
      category: 'Lunch',
      time: '01:30 PM',
      name: 'Grilled Chicken Breast with Whole Wheat Rotis & Dal',
      rawVsCooked: 'Raw Chicken (150g raw → ~115g cooked) + 2 Whole Wheat Rotis + 1 Bowl Dal Tadka (150g)',
      calories: Math.round(targetCals * 0.35),
      protein: 52,
      carbs: 64,
      fats: 14,
      prepInstructions: 'Marinate chicken in curd and spices, pan-grill with 5ml olive oil. Serve hot with 2 rotis and yellow dal.',
      ingredients: JSON.stringify([
        { name: 'Chicken Breast', qty: '150g raw', calories: 180 },
        { name: 'Roti / Chapati', qty: '2 pieces (80g)', calories: 208 },
        { name: 'Yellow Dal Tadka', qty: '1 cup (150g)', calories: 140 },
        { name: 'Mixed Green Salad', qty: '1 bowl', calories: 35 }
      ])
    },
    {
      category: 'Evening Snack',
      time: '05:30 PM',
      name: 'Low-Fat Paneer & Soya Chunks Tikka Bowl',
      rawVsCooked: 'Paneer (75g raw) + Soya Chunks (25g dry → 75g soaked)',
      calories: Math.round(targetCals * 0.18),
      protein: 26,
      carbs: 18,
      fats: 14,
      prepInstructions: 'Soak soya chunks in warm water. Toss with paneer cubes, mint chutney, lemon juice, and air-fry for 10 mins.',
      ingredients: JSON.stringify([
        { name: 'Low-Fat Paneer', qty: '75g', calories: 135 },
        { name: 'Soya Chunks', qty: '25g dry', calories: 86 },
        { name: 'Mint Chutney & Spices', qty: '2 tbsp', calories: 30 }
      ])
    },
    {
      category: 'Dinner',
      time: '08:45 PM',
      name: 'Egg Curry with Brown Rice & Stir-Fried Beans',
      rawVsCooked: 'Brown Rice (60g dry → 150g cooked) + 3 Egg whites & 1 Whole egg curry',
      calories: Math.round(targetCals * 0.23),
      protein: 32,
      carbs: 52,
      fats: 12,
      prepInstructions: 'Boil eggs, simmer in light tomato gravy. Serve with steamed brown rice and sautéed green vegetables.',
      ingredients: JSON.stringify([
        { name: 'Egg White', qty: '3 whites', calories: 51 },
        { name: 'Whole Egg', qty: '1 whole', calories: 72 },
        { name: 'Cooked Brown Rice', qty: '1 cup (150g)', calories: 165 },
        { name: 'Mixed Green Salad', qty: '1 bowl', calories: 35 }
      ])
    }
  ];
}

export async function getActivePlan(req: Request, res: Response): Promise<void> {
  const userId = req.user!.userId;
  const todayStr = localDateString();

  let plan = await getTodaysActivePlan(prisma, userId);

  if (!plan) {
    // Generate new plan automatically
    const profile = await prisma.profile.findUnique({ where: { userId } });
    if (!profile) {
      res.status(404).json({ error: 'Profile not found' });
      return;
    }

    const fallbackMeals = getFallbackMeals(profile);
    plan = await prisma.mealPlan.create({
      data: {
        userId,
        date: todayStr,
        dayOfWeek: new Date().toLocaleDateString('en-US', { weekday: 'long' }),
        isActive: true,
        meals: {
          create: fallbackMeals
        }
      },
      include: { meals: true }
    });
  }

  const safeMeals = plan.meals.map(m => ({
    ...m,
    ingredients: JSON.parse(m.ingredients || '[]')
  }));

  res.json({ plan: { ...plan, meals: safeMeals } });
}

export async function generatePlan(req: Request, res: Response): Promise<void> {
  const userId = req.user!.userId;
  const todayStr = localDateString();

  const profile = await prisma.profile.findUnique({ where: { userId } });
  if (!profile) {
    res.status(404).json({ error: 'Profile not found' });
    return;
  }

  const ctx = {
    name: profile.name,
    age: profile.age,
    sex: profile.sex,
    weight: profile.weight,
    height: profile.height,
    primaryGoal: profile.primaryGoal,
    dietPreference: profile.dietPreference,
    foodAllergies: JSON.parse(profile.foodAllergies || '[]'),
    dietaryRestrictions: JSON.parse(profile.dietaryRestrictions || '[]'),
    preferredCuisines: JSON.parse(profile.preferredCuisines || '["Indian North/South"]'),
    availableFoods: JSON.parse(profile.availableFoods || '[]'),
    dislikedFoods: JSON.parse(profile.dislikedFoods || '[]'),
    dailyBudget: profile.dailyBudget,
    dailyCalorieTarget: profile.dailyCalorieTarget,
    proteinTarget: profile.proteinTarget,
    carbsTarget: profile.carbsTarget,
    fatsTarget: profile.fatsTarget
  };

  let generatedMeals: any[] = [];
  let isAiGenerated = false;

  try {
    const { system, prompt } = buildDietPlanPrompt(ctx);
    const result = await aiService.generateStructured<{ meals: any[] }>(prompt, system, undefined, undefined, undefined, { task: 'diet plan', maxTokens: 1800 });
    if (result && Array.isArray(result.meals) && result.meals.length > 0) {
      // Validate each meal with safety check
      const validMeals: any[] = [];
      for (const meal of result.meals) {
        const safety = validateMealSafety({
          name: meal.name,
          ingredients: meal.ingredients || [],
          userDietPreference: ctx.dietPreference,
          userAllergies: ctx.foodAllergies,
          userDislikedFoods: ctx.dislikedFoods
        });
        if (safety.safe) {
          validMeals.push(meal);
        }
      }
      if (validMeals.length >= 3) {
        generatedMeals = validMeals;
        isAiGenerated = true;
      }
    }
  } catch (err: any) {
    console.log('AI diet plan generation falling back to local deterministic plan:', err.message);
  }

  if (generatedMeals.length === 0) {
    generatedMeals = getFallbackMeals(profile).map(m => ({
      ...m,
      ingredients: JSON.parse(m.ingredients)
    }));
  }

  // Deactivate old active plans
  await prisma.mealPlan.updateMany({
    where: { userId, isActive: true },
    data: { isActive: false }
  });

  // Create new active plan
  const newPlan = await prisma.mealPlan.create({
    data: {
      userId,
      date: todayStr,
      dayOfWeek: new Date().toLocaleDateString('en-US', { weekday: 'long' }),
      isActive: true,
      meals: {
        create: generatedMeals.map(m => ({
          category: m.category,
          time: m.time || '12:00 PM',
          name: m.name,
          rawVsCooked: m.rawVsCooked || '',
          calories: Number(m.calories) || 400,
          protein: Number(m.protein) || 30,
          carbs: Number(m.carbs) || 40,
          fats: Number(m.fats) || 12,
          isCompleted: false,
          prepInstructions: m.prepInstructions || '',
          ingredients: JSON.stringify(m.ingredients || [])
        }))
      }
    },
    include: { meals: true }
  });

  const safeMeals = newPlan.meals.map(m => ({
    ...m,
    ingredients: JSON.parse(m.ingredients || '[]')
  }));

  res.json({
    plan: { ...newPlan, meals: safeMeals },
    isAiGenerated,
    message: isAiGenerated ? 'AI diet plan generated successfully via Ollama!' : 'Diet plan generated from nutritional database.'
  });
}

export async function swapMeal(req: Request, res: Response): Promise<void> {
  const userId = req.user!.userId;
  const mealId = req.params.mealId as string;

  const meal = await prisma.plannedMeal.findUnique({
    where: { id: mealId },
    include: { mealPlan: true }
  }) as any;

  if (!meal || meal.mealPlan.userId !== userId) {
    res.status(404).json({ error: 'Meal not found' });
    return;
  }

  const profile = await prisma.profile.findUnique({ where: { userId } });
  if (!profile) {
    res.status(404).json({ error: 'Profile not found' });
    return;
  }

  const ctx = {
    name: profile.name,
    age: profile.age,
    sex: profile.sex,
    weight: profile.weight,
    height: profile.height,
    primaryGoal: profile.primaryGoal,
    dietPreference: profile.dietPreference,
    foodAllergies: JSON.parse(profile.foodAllergies || '[]'),
    dietaryRestrictions: JSON.parse(profile.dietaryRestrictions || '[]'),
    preferredCuisines: JSON.parse(profile.preferredCuisines || '["Indian North/South"]'),
    availableFoods: JSON.parse(profile.availableFoods || '[]'),
    dislikedFoods: JSON.parse(profile.dislikedFoods || '[]'),
    dailyBudget: profile.dailyBudget,
    dailyCalorieTarget: profile.dailyCalorieTarget,
    proteinTarget: profile.proteinTarget,
    carbsTarget: profile.carbsTarget,
    fatsTarget: profile.fatsTarget
  };

  let newMealData: any = null;

  try {
    const { system, prompt } = buildMealSwapPrompt(ctx, {
      category: meal.category,
      name: meal.name,
      calories: meal.calories,
      protein: meal.protein
    });
    const result = await aiService.generateStructured<any>(prompt, system, undefined, undefined, undefined, { task: 'meal swap', maxTokens: 500 });
    if (result && result.name) {
      newMealData = result;
    }
  } catch (err: any) {
    console.log('AI meal swap fallback:', err.message);
  }

  if (!newMealData) {
    // Intelligent fallback swap
    const isVeg = profile.dietPreference.toLowerCase().includes('veg');
    if (isVeg) {
      newMealData = {
        name: 'Spiced Paneer Paratha with Fresh Curd',
        rawVsCooked: '75g Low-fat Paneer + 50g Whole Wheat Flour + 100g Curd',
        calories: meal.calories,
        protein: meal.protein,
        carbs: Math.round(meal.calories * 0.45 / 4),
        fats: Math.round(meal.calories * 0.25 / 9),
        prepInstructions: 'Grate paneer, season with ajwain and green chili, stuff into whole wheat dough, and shallow cook with 3ml ghee.',
        ingredients: [
          { name: 'Low-Fat Paneer', qty: '75g', calories: 135 },
          { name: 'Whole Wheat Atta', qty: '50g', calories: 170 },
          { name: 'Curd / Dahi', qty: '100g', calories: 65 }
        ]
      };
    } else {
      newMealData = {
        name: 'Grilled Fish Fillet with Steamed Brown Rice & Salad',
        rawVsCooked: '180g Fish Fillet + 50g Brown Rice (raw) → 125g cooked',
        calories: meal.calories,
        protein: meal.protein,
        carbs: Math.round(meal.calories * 0.45 / 4),
        fats: Math.round(meal.calories * 0.25 / 9),
        prepInstructions: 'Season fish with lemon, garlic and black pepper. Pan sear with olive oil spray and serve with steamed brown rice.',
        ingredients: [
          { name: 'Fish Fillet', qty: '180g', calories: 200 },
          { name: 'Cooked Brown Rice', qty: '1 cup (150g)', calories: 165 },
          { name: 'Mixed Green Salad', qty: '1 bowl', calories: 35 }
        ]
      };
    }
  }

  const updatedMeal = await prisma.plannedMeal.update({
    where: { id: mealId as string },
    data: {
      name: newMealData.name,
      rawVsCooked: newMealData.rawVsCooked || '',
      calories: Number(newMealData.calories) || meal.calories,
      protein: Number(newMealData.protein) || meal.protein,
      carbs: Number(newMealData.carbs) || meal.carbs,
      fats: Number(newMealData.fats) || meal.fats,
      prepInstructions: newMealData.prepInstructions || '',
      ingredients: JSON.stringify(newMealData.ingredients || [])
    }
  });

  res.json({
    meal: {
      ...updatedMeal,
      ingredients: JSON.parse(updatedMeal.ingredients || '[]')
    }
  });
}

export async function toggleMeal(req: Request, res: Response): Promise<void> {
  const userId = req.user!.userId;
  const mealId = req.params.mealId as string;

  const meal = await prisma.plannedMeal.findUnique({
    where: { id: mealId },
    include: { mealPlan: true }
  }) as any;

  if (!meal || meal.mealPlan.userId !== userId) {
    res.status(404).json({ error: 'Meal not found' });
    return;
  }

  const nextState = !meal.isCompleted;
  const calorieDelta = nextState ? meal.calories : -meal.calories;
  const proteinDelta = nextState ? meal.protein : -meal.protein;
  const carbsDelta = nextState ? meal.carbs : -meal.carbs;
  const fatsDelta = nextState ? meal.fats : -meal.fats;

  const [updatedMeal, updatedProfile] = await prisma.$transaction([
    prisma.plannedMeal.update({
      where: { id: mealId as string },
      data: { isCompleted: nextState }
    }),
    prisma.profile.update({
      where: { userId },
      data: {
        caloriesConsumed: { increment: calorieDelta },
        proteinConsumed: { increment: proteinDelta },
        carbsConsumed: { increment: carbsDelta },
        fatsConsumed: { increment: fatsDelta }
      } as any
    })
  ]);

  res.json({
    meal: {
      ...updatedMeal,
      ingredients: JSON.parse(updatedMeal.ingredients || '[]')
    },
    profile: updatedProfile
  });
}

export async function updateMeal(req: Request, res: Response): Promise<void> {
  const userId = req.user!.userId;
  const mealId = req.params.mealId as string;
  const { portionMultiplier } = req.body;

  const meal = await prisma.plannedMeal.findUnique({
    where: { id: mealId },
    include: { mealPlan: true }
  }) as any;

  if (!meal || meal.mealPlan.userId !== userId) {
    res.status(404).json({ error: 'Meal not found' });
    return;
  }

  const mult = Number(portionMultiplier) || 1.0;
  const updated = await prisma.plannedMeal.update({
    where: { id: mealId as string },
    data: {
      calories: Math.round(meal.calories * mult),
      protein: Math.round(meal.protein * mult),
      carbs: Math.round(meal.carbs * mult),
      fats: Math.round(meal.fats * mult)
    }
  });

  res.json({
    meal: {
      ...updated,
      ingredients: JSON.parse(updated.ingredients || '[]')
    }
  });
}
