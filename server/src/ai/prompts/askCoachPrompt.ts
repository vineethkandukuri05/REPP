export interface CoachContext {
  name: string;
  age: number;
  sex: string;
  heightCm: number;
  primaryGoal: string;
  experienceLevel: string;
  weight: number;
  targetWeight: number;
  weightTrend: string | null;
  dailyCalorieTarget: number;
  proteinTarget: number;
  carbsTarget: number;
  fatsTarget: number;
  caloriesConsumed: number;
  proteinConsumed: number;
  carbsConsumed: number;
  fatsConsumed: number;
  mealsEatenToday: string[];
  plannedMealsRemaining: string[];
  waterIntake: number;
  waterTarget: number;
  workoutSplit: string;
  todaysWorkout: string | null;
  workoutDoneToday: boolean;
  lastWorkoutDate: string | null;
  streakDays: number;
  injuries: string[];
  dietPreference: string;
  foodAllergies: string[];
  todayDate: string;
}

export function buildAskCoachSystemPrompt(ctx: CoachContext): string {
  const remaining = (target: number, used: number) => Math.max(0, Math.round(target - used));
  const list = (items: string[]) => (items.length ? items.join('; ') : 'none');

  // Kept compact on purpose: on a CPU the model reads ~20-30 tokens/s, so every line here adds delay.
  return `You are Ask REPP, an encouraging fitness and nutrition coach for ${ctx.name || 'the user'}. Today: ${ctx.todayDate}.
User: ${ctx.age}y ${ctx.sex}, ${ctx.heightCm} cm, ${ctx.weight} kg (target ${ctx.targetWeight} kg). Goal: ${ctx.primaryGoal}. Level: ${ctx.experienceLevel}. Weight trend: ${ctx.weightTrend || 'unknown'}.
Diet: ${ctx.dietPreference}; allergies: ${list(ctx.foodAllergies)}. Injuries: ${list(ctx.injuries)}.
Today: target ${ctx.dailyCalorieTarget} kcal / ${ctx.proteinTarget} g protein; eaten ${ctx.caloriesConsumed} kcal / ${ctx.proteinConsumed} g; left ${remaining(ctx.dailyCalorieTarget, ctx.caloriesConsumed)} kcal, ${remaining(ctx.proteinTarget, ctx.proteinConsumed)} g protein, ${remaining(ctx.carbsTarget, ctx.carbsConsumed)} g carbs, ${remaining(ctx.fatsTarget, ctx.fatsConsumed)} g fats.
Eaten: ${list(ctx.mealsEatenToday)}. Still planned: ${list(ctx.plannedMealsRemaining)}. Water ${ctx.waterIntake}/${ctx.waterTarget} ml.
Training: ${ctx.workoutSplit}; today ${ctx.todaysWorkout || 'none'}${ctx.workoutDoneToday ? ' (done)' : ' (not done)'}; streak ${ctx.streakDays}.
Rules: answer the question directly in 2-5 sentences or a short list; use only the numbers above, never invent user data; respect diet and allergies, prefer Indian staples with gram amounts; for pain, injury or medical issues give general guidance only and suggest a doctor or physiotherapist.`;
}
