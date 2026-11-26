export interface WorkoutPromptContext {
  name: string;
  experienceLevel: string;
  workoutLocation: string;
  workoutSplit: string;
  availableEquipment: string[];
  workoutDuration: number;
  injuries: string[];
  excludedExercises: string[];
  primaryGoal: string;
  dayName?: string;
}

export function buildWorkoutPlanPrompt(ctx: WorkoutPromptContext): { system: string; prompt: string } {
  const system = `You are a certified strength and conditioning specialist (CSCS).
You prescribe biomechanically sound, evidence-based resistance training routines.
Strictly respect user injuries, equipment limitations, and session duration.
Return ONLY valid JSON matching the schema. No markdown formatting.`;

  const prompt = `Generate a comprehensive gym/home training session for ${ctx.name}.

Parameters:
- Split / Day: ${ctx.workoutSplit} (${ctx.dayName || 'Day Session'})
- Experience Level: ${ctx.experienceLevel}
- Location: ${ctx.workoutLocation}
- Target Duration: ${ctx.workoutDuration} minutes
- Goal: ${ctx.primaryGoal}
- Available Equipment: ${ctx.availableEquipment.join(', ') || 'Standard gym equipment'}
- Current Injuries / Sensitivities: ${ctx.injuries.join(', ') || 'None'}
- Exercises to Exclude: ${ctx.excludedExercises.join(', ') || 'None'}

Rules:
1. Select 5-6 compound and isolation exercises.
2. For any injury mentioned, substitute high-risk movements with safe alternatives (e.g., neutral grip dumbbell press instead of barbell overhead press for wrist pain).
3. Specify realistic sets, reps range and rest times.
4. Provide 2-3 viable substitutions per exercise.
5. Be brief: instructions are one sentence (max 20 words).

Output JSON schema:
{
  "dayName": "e.g. Day 1 - Upper Body Hypertrophy",
  "split": "${ctx.workoutSplit}",
  "duration": ${ctx.workoutDuration},
  "difficulty": "${ctx.experienceLevel}",
  "targetMuscles": ["Chest", "Lats", "Shoulders", "Triceps", "Biceps"],
  "exercises": [
    {
      "name": "Exercise Name",
      "target": "Target Muscle Group",
      "equipment": "Required Equipment",
      "sets": 4,
      "reps": "8-10",
      "rest": "90 sec",
      "targetWeight": "20 kg",
      "instructions": "One short form cue",
      "substitutions": ["Alt 1", "Alt 2"]
    }
  ]
}`;

  return { system, prompt };
}

export function buildExerciseSwapPrompt(
  exerciseName: string,
  targetMuscle: string,
  equipment: string[],
  injuries: string[]
): { system: string; prompt: string } {
  const system = `You are a strength coach. Provide a single direct exercise replacement. Return ONLY valid JSON.`;
  const prompt = `Suggest a biomechanically sound alternative to "${exerciseName}" targeting ${targetMuscle}.
Available equipment: ${equipment.join(', ') || 'Bodyweight, Dumbbells'}
Injuries/Constraints: ${injuries.join(', ') || 'None'}

Output JSON schema:
{
  "name": "Alternative Exercise Name",
  "target": "${targetMuscle}",
  "equipment": "Equipment needed",
  "sets": 3,
  "reps": "10-12",
  "rest": "60 sec",
  "targetWeight": "15 kg",
  "instructions": "Form cues focused on safety and joint longevity",
  "substitutions": ["Alt A", "Alt B"]
}`;

  return { system, prompt };
}
