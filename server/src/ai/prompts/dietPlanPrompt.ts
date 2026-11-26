export interface DietPromptContext {
  name: string;
  age: number;
  sex: string;
  weight: number;
  height: number;
  primaryGoal: string;
  dietPreference: string;
  foodAllergies: string[];
  dietaryRestrictions: string[];
  preferredCuisines: string[];
  availableFoods: string[];
  dislikedFoods: string[];
  dailyBudget: number;
  dailyCalorieTarget: number;
  proteinTarget: number;
  carbsTarget: number;
  fatsTarget: number;
}

export function buildDietPlanPrompt(ctx: DietPromptContext): { system: string; prompt: string } {
  const system = `You are an elite sports dietitian specialized in Indian and global sports nutrition.
You generate realistic, culturally authentic meal plans with accurate raw vs cooked weight conversions, Indian market pricing in INR, and precise macronutrient splits.
Return ONLY valid JSON matching the requested schema. No markdown formatting, no conversational text.`;

  const prompt = `Generate a complete 1-day meal plan for ${ctx.name} with 4 meals (Breakfast, Lunch, Evening Snack, Dinner).

User Profile:
- Goal: ${ctx.primaryGoal}
- Diet Preference: ${ctx.dietPreference}
- Target Calories: ${ctx.dailyCalorieTarget} kcal
- Target Protein: ${ctx.proteinTarget}g
- Target Carbs: ${ctx.carbsTarget}g
- Target Fats: ${ctx.fatsTarget}g
- Allergies to strictly avoid: ${ctx.foodAllergies.length ? ctx.foodAllergies.join(', ') : 'None'}
- Disliked foods to avoid: ${ctx.dislikedFoods.length ? ctx.dislikedFoods.join(', ') : 'None'}
- Preferred cuisines: ${ctx.preferredCuisines.join(', ')}
- Available preferred staples: ${ctx.availableFoods.join(', ')}
- Daily Food Budget: ₹${ctx.dailyBudget} INR

Guidelines:
1. Breakfast: High protein, complex carbs, healthy fats.
2. Lunch: Core balanced meal (e.g. roti/rice, dal, lean protein source like chicken or paneer, fresh salad).
3. Evening Snack: Portable or quick high-protein snack (e.g. eggs, soya tikka, curd, nuts).
4. Dinner: Lean protein and fiber-rich vegetables.
5. Provide rawVsCooked detail for every meal (e.g., "Raw Chicken (150g raw → ~115g cooked) + 2 Whole Wheat Rotis (60g flour)").
6. Sum of meals must closely approximate the targets (${ctx.dailyCalorieTarget} kcal, ${ctx.proteinTarget}g protein).
7. Be brief: prepInstructions is one sentence (max 20 words); list at most 4 ingredients per meal.

Output JSON schema:
{
  "meals": [
    {
      "category": "Breakfast | Lunch | Evening Snack | Dinner",
      "time": "08:30 AM",
      "name": "Meal Name",
      "rawVsCooked": "Detailed raw to cooked weights",
      "calories": 450,
      "protein": 35,
      "carbs": 45,
      "fats": 14,
      "prepInstructions": "One short sentence",
      "ingredients": [
        { "name": "Ingredient Name", "qty": "quantity with units", "calories": 150 }
      ]
    }
  ]
}`;

  return { system, prompt };
}

export function buildMealSwapPrompt(
  ctx: DietPromptContext,
  currentMeal: { category: string; name: string; calories: number; protein: number }
): { system: string; prompt: string } {
  const system = `You are a clinical sports nutritionist. You suggest tasty, healthy meal alternatives that preserve macro balance. Return ONLY valid JSON.`;
  const prompt = `Suggest a 1-to-1 alternative replacement meal for:
Category: ${currentMeal.category}
Original Meal: ${currentMeal.name}
Target Calories: ~${currentMeal.calories} kcal
Target Protein: ~${currentMeal.protein}g

Constraints:
- Diet Preference: ${ctx.dietPreference}
- Avoid Allergens: ${ctx.foodAllergies.join(', ') || 'None'}
- Avoid Disliked Foods: ${ctx.dislikedFoods.join(', ') || 'None'}
- Preferred Cuisines: ${ctx.preferredCuisines.join(', ')}

Output JSON schema:
{
  "name": "New Meal Name",
  "rawVsCooked": "Raw to cooked specs",
  "calories": ${currentMeal.calories},
  "protein": ${currentMeal.protein},
  "carbs": 40,
  "fats": 12,
  "prepInstructions": "One short sentence",
  "ingredients": [
    { "name": "Ingredient", "qty": "portion", "calories": 120 }
  ]
}`;

  return { system, prompt };
}
