export interface MealSafetyCheckInput {
  name: string;
  ingredients: Array<{ name: string; qty: string }>;
  userDietPreference: string; // 'Vegetarian' | 'Non-Vegetarian' | 'Vegan'
  userAllergies: string[];
  userDislikedFoods: string[];
}

export interface WorkoutSafetyCheckInput {
  exerciseName: string;
  targetMuscles: string[];
  equipmentNeeded: string;
  userInjuries: string[];
  userAvailableEquipment: string[];
  userExcludedExercises: string[];
}

const NON_VEG_KEYWORDS = [
  'chicken', 'mutton', 'lamb', 'beef', 'pork', 'fish', 'prawn', 'salmon',
  'tuna', 'egg', 'eggs', 'meat', 'turkey', 'seafood', 'bacon', 'ham'
];

const DAIRY_KEYWORDS = [
  'milk', 'paneer', 'cheese', 'curd', 'dahi', 'yogurt', 'butter', 'ghee',
  'whey', 'cream'
];

export function validateMealSafety(input: MealSafetyCheckInput): { safe: boolean; reason?: string } {
  const allText = `${input.name} ${input.ingredients.map(i => i.name).join(' ')}`.toLowerCase();

  // Check diet preference: Vegetarian
  if (input.userDietPreference.toLowerCase().includes('veg') && !input.userDietPreference.toLowerCase().includes('non')) {
    for (const kw of NON_VEG_KEYWORDS) {
      if (allText.includes(kw)) {
        return { safe: false, reason: `Meal contains '${kw}', violating Vegetarian preference.` };
      }
    }
  }

  // Check diet preference: Vegan
  if (input.userDietPreference.toLowerCase() === 'vegan') {
    for (const kw of [...NON_VEG_KEYWORDS, ...DAIRY_KEYWORDS]) {
      if (allText.includes(kw)) {
        return { safe: false, reason: `Meal contains '${kw}', violating Vegan preference.` };
      }
    }
  }

  // Check allergies
  for (const allergy of input.userAllergies) {
    if (!allergy || allergy.toLowerCase() === 'none') continue;
    const allergen = allergy.trim().toLowerCase();
    if (allText.includes(allergen)) {
      return { safe: false, reason: `Meal contains listed allergen: '${allergy}'.` };
    }
  }

  // Check disliked foods
  for (const disliked of input.userDislikedFoods) {
    if (!disliked) continue;
    const item = disliked.trim().toLowerCase();
    if (allText.includes(item)) {
      return { safe: false, reason: `Meal contains disliked food: '${disliked}'.` };
    }
  }

  return { safe: true };
}

export function validateExerciseSafety(input: WorkoutSafetyCheckInput): { safe: boolean; reason?: string } {
  const exName = input.exerciseName.toLowerCase();

  // Check excluded exercises
  for (const excluded of input.userExcludedExercises) {
    if (!excluded) continue;
    if (exName.includes(excluded.toLowerCase().trim())) {
      return { safe: false, reason: `Exercise matches user excluded list: '${excluded}'.` };
    }
  }

  // Check injury contraindications
  for (const injury of input.userInjuries) {
    if (!injury || injury.toLowerCase() === 'none') continue;
    const inj = injury.toLowerCase();
    if (inj.includes('wrist') && (exName.includes('overhead barbell press') || exName.includes('front squat'))) {
      return { safe: false, reason: `Exercise puts high stress on sensitive wrist (${injury}).` };
    }
    if (inj.includes('shoulder') && (exName.includes('behind neck') || exName.includes('dip'))) {
      return { safe: false, reason: `Exercise risky for shoulder injury (${injury}).` };
    }
    if (inj.includes('lower back') && (exName.includes('heavy deadlift') || exName.includes('good morning'))) {
      return { safe: false, reason: `Exercise risky for lower back injury (${injury}).` };
    }
    if (inj.includes('knee') && (exName.includes('heavy leg extension') || exName.includes('jump squat'))) {
      return { safe: false, reason: `Exercise contra-indicated for knee condition (${injury}).` };
    }
  }

  return { safe: true };
}
