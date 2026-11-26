export interface UserMetrics {
  weight: number; // in kg
  height: number; // in cm
  age: number;
  sex: string; // 'Male' | 'Female' | 'Other'
  activityLevel: string;
  primaryGoal: string;
}

export interface MacroSplit {
  bmr: number;
  tdee: number;
  dailyCalorieTarget: number;
  proteinTarget: number;
  carbsTarget: number;
  fatsTarget: number;
  waterTarget: number;
  bmi: number;
}

export function calculateBMI(weight: number, heightCm: number): number {
  if (heightCm <= 0) return 0;
  const heightM = heightCm / 100;
  return Math.round((weight / (heightM * heightM)) * 10) / 10;
}

export function calculateBMR(weight: number, heightCm: number, age: number, sex: string): number {
  // Mifflin-St Jeor Formula
  const base = 10 * weight + 6.25 * heightCm - 5 * age;
  if (sex.toLowerCase() === 'female') {
    return Math.round(base - 161);
  }
  // Default to Male formula for male or others
  return Math.round(base + 5);
}

export function getActivityMultiplier(activityLevel: string): number {
  const level = activityLevel.toLowerCase();
  if (level.includes('sedentary')) return 1.2;
  if (level.includes('light')) return 1.375;
  if (level.includes('moderate')) return 1.55;
  if (level.includes('very active') || level.includes('high')) return 1.725;
  if (level.includes('extreme') || level.includes('athlete')) return 1.9;
  return 1.55; // Default moderate
}

export function calculateMacros(metrics: UserMetrics): MacroSplit {
  const { weight, height, age, sex, activityLevel, primaryGoal } = metrics;

  const bmr = calculateBMR(weight, height, age, sex);
  const multiplier = getActivityMultiplier(activityLevel);
  const tdee = Math.round(bmr * multiplier);
  const bmi = calculateBMI(weight, height);

  // Calorie adjustments based on primary goal
  const goalLower = primaryGoal.toLowerCase();
  let calorieTarget = tdee;

  if (goalLower.includes('fat loss') || goalLower.includes('weight loss')) {
    calorieTarget = tdee - 500;
  } else if (goalLower.includes('muscle') || goalLower.includes('hypertrophy') || goalLower.includes('bulk')) {
    calorieTarget = tdee + 300;
  } else if (goalLower.includes('recomposition') || goalLower.includes('recomp')) {
    calorieTarget = tdee - 250;
  }

  // Safety floor check: Never go below safe minimums
  const minFloor = sex.toLowerCase() === 'female' ? 1200 : 1500;
  const safeFloor = Math.max(minFloor, Math.round(bmr * 0.95));
  if (calorieTarget < safeFloor) {
    calorieTarget = safeFloor;
  }

  // Protein calculation: ~2.0g per kg of bodyweight for active fitness, clamped
  let proteinTarget = Math.round(weight * 2.0);
  if (goalLower.includes('muscle') || goalLower.includes('recomp')) {
    proteinTarget = Math.round(weight * 2.1);
  }
  proteinTarget = Math.max(100, Math.min(240, proteinTarget));

  // Fat calculation: 25% of total calories (9 kcal/g)
  const fatsCalories = calorieTarget * 0.25;
  const fatsTarget = Math.round(fatsCalories / 9);

  // Carbohydrates: Remaining calories (4 kcal/g)
  const proteinCalories = proteinTarget * 4;
  const remainingCalories = Math.max(200, calorieTarget - proteinCalories - (fatsTarget * 9));
  const carbsTarget = Math.round(remainingCalories / 4);

  // Water Target: 35ml per kg bodyweight + 500ml for training, rounded to nearest 250ml
  const rawWater = weight * 35 + 500;
  const waterTarget = Math.round(rawWater / 250) * 250;

  return {
    bmr,
    tdee,
    dailyCalorieTarget: calorieTarget,
    proteinTarget,
    carbsTarget,
    fatsTarget,
    waterTarget,
    bmi,
  };
}
