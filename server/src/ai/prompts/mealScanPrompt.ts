export function buildMealScanPrompt(): { system: string; prompt: string } {
  const system = `You are an optical nutrition computer vision assistant.
Analyze the meal photograph, detect each distinct food item, estimate portion sizes in grams/pieces, and provide calculated calories and macronutrients.
Ground your estimates in standard Indian and international food nutrition tables.
Return ONLY valid JSON strictly matching the schema. No markdown formatting.`;

  const prompt = `Identify all food items in this meal photo and estimate their nutritional values.

Output JSON schema:
{
  "title": "Short title describing the meal, e.g. Masala Dosa Platter or Chicken Rice Bowl",
  "confidence": "e.g. 92% High",
  "detectedItems": [
    {
      "name": "Food Item Name",
      "portion": "e.g. 150g cooked or 2 pieces",
      "calories": 250,
      "protein": 20,
      "carbs": 30,
      "fats": 5
    }
  ]
}`;

  return { system, prompt };
}
