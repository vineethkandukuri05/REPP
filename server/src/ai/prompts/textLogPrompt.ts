export function buildTextLogPrompt(userInput: string): { system: string; prompt: string } {
  const system = `You are a nutrition log parser specializing in Indian and global foods.
Parse freeform natural language food descriptions into structured items with realistic grams, calories, and macros (protein, carbs, fats).
Return ONLY valid JSON. No markdown or explanation.`;

  const prompt = `Parse the following meal description into structured items:
"${userInput}"

Output JSON schema:
{
  "title": "Concise meal title",
  "category": "Breakfast | Lunch | Evening Snack | Dinner",
  "items": [
    {
      "name": "Food item name",
      "portion": "portion description with estimated weight in grams",
      "calories": 200,
      "protein": 10,
      "carbs": 25,
      "fats": 5
    }
  ]
}`;

  return { system, prompt };
}
