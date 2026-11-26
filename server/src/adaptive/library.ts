/**
 * Static exercise and food libraries used to build the weekly plan.
 * These are reference data (like a recipe book), not user data.
 */

// ---------------------------------------------------------------- exercises

export type Location = 'gym' | 'home' | 'bodyweight';
/** Body areas an exercise loads heavily; used to respect injuries. */
export type Stress = 'knee' | 'lower_back' | 'shoulder' | 'wrist' | 'elbow' | 'impact';

export interface Exercise {
  name: string;
  muscles: string;
  compound: boolean;
  where: Location[];
  stress: Stress[];
}

/** For each movement slot, options in order of preference. The first one that fits location + injuries is used. */
export const SLOTS: Record<string, Exercise[]> = {
  horizontal_push: [
    { name: 'Barbell Bench Press', muscles: 'Chest, Triceps, Front Delts', compound: true, where: ['gym'], stress: ['shoulder'] },
    { name: 'Dumbbell Bench Press', muscles: 'Chest, Triceps, Front Delts', compound: true, where: ['gym', 'home'], stress: [] },
    { name: 'Push-ups', muscles: 'Chest, Triceps, Core', compound: true, where: ['gym', 'home', 'bodyweight'], stress: ['wrist'] },
    { name: 'Knuckle / Handle Push-ups', muscles: 'Chest, Triceps, Core', compound: true, where: ['gym', 'home', 'bodyweight'], stress: [] }
  ],
  incline_push: [
    { name: 'Incline Dumbbell Press', muscles: 'Upper Chest, Front Delts', compound: true, where: ['gym', 'home'], stress: [] },
    { name: 'Decline (Feet-Elevated) Push-ups', muscles: 'Upper Chest, Shoulders', compound: true, where: ['gym', 'home', 'bodyweight'], stress: ['wrist'] },
    { name: 'Incline Push-ups', muscles: 'Chest, Triceps', compound: true, where: ['gym', 'home', 'bodyweight'], stress: [] }
  ],
  vertical_push: [
    { name: 'Seated Dumbbell Shoulder Press', muscles: 'Shoulders, Triceps', compound: true, where: ['gym', 'home'], stress: ['shoulder'] },
    { name: 'Landmine Press', muscles: 'Shoulders, Upper Chest', compound: true, where: ['gym'], stress: [] },
    { name: 'Pike Push-ups', muscles: 'Shoulders, Triceps', compound: true, where: ['gym', 'home', 'bodyweight'], stress: ['shoulder', 'wrist'] },
    { name: 'Band Lateral Raise + Front Raise', muscles: 'Shoulders', compound: false, where: ['gym', 'home', 'bodyweight'], stress: [] }
  ],
  horizontal_pull: [
    { name: 'Chest-Supported Row', muscles: 'Upper Back, Lats, Biceps', compound: true, where: ['gym'], stress: [] },
    { name: 'Seated Cable Row', muscles: 'Upper Back, Lats, Biceps', compound: true, where: ['gym'], stress: [] },
    { name: 'One-Arm Dumbbell Row', muscles: 'Lats, Upper Back, Biceps', compound: true, where: ['gym', 'home'], stress: [] },
    { name: 'Inverted Row (table / bar)', muscles: 'Upper Back, Biceps', compound: true, where: ['gym', 'home', 'bodyweight'], stress: [] },
    { name: 'Resistance Band Row', muscles: 'Upper Back, Biceps', compound: true, where: ['gym', 'home', 'bodyweight'], stress: [] }
  ],
  vertical_pull: [
    { name: 'Lat Pulldown', muscles: 'Lats, Biceps', compound: true, where: ['gym'], stress: [] },
    { name: 'Assisted / Band Pull-ups', muscles: 'Lats, Biceps', compound: true, where: ['gym', 'home', 'bodyweight'], stress: ['elbow'] },
    { name: 'Band Lat Pulldown', muscles: 'Lats, Biceps', compound: true, where: ['gym', 'home', 'bodyweight'], stress: [] }
  ],
  squat: [
    { name: 'Barbell Back Squat', muscles: 'Quads, Glutes, Core', compound: true, where: ['gym'], stress: ['knee', 'lower_back'] },
    { name: 'Leg Press', muscles: 'Quads, Glutes', compound: true, where: ['gym'], stress: ['knee'] },
    { name: 'Goblet Squat', muscles: 'Quads, Glutes', compound: true, where: ['gym', 'home'], stress: ['knee'] },
    { name: 'Bodyweight Squat to Box', muscles: 'Quads, Glutes', compound: true, where: ['gym', 'home', 'bodyweight'], stress: ['knee'] },
    { name: 'Glute Bridge', muscles: 'Glutes, Hamstrings', compound: true, where: ['gym', 'home', 'bodyweight'], stress: [] }
  ],
  hinge: [
    { name: 'Romanian Deadlift', muscles: 'Hamstrings, Glutes, Lower Back', compound: true, where: ['gym', 'home'], stress: ['lower_back'] },
    { name: 'Hip Thrust', muscles: 'Glutes, Hamstrings', compound: true, where: ['gym', 'home'], stress: [] },
    { name: 'Single-Leg Glute Bridge', muscles: 'Glutes, Hamstrings', compound: true, where: ['gym', 'home', 'bodyweight'], stress: [] }
  ],
  single_leg: [
    { name: 'Bulgarian Split Squat', muscles: 'Quads, Glutes', compound: true, where: ['gym', 'home', 'bodyweight'], stress: ['knee'] },
    { name: 'Walking Lunges', muscles: 'Quads, Glutes', compound: true, where: ['gym', 'home', 'bodyweight'], stress: ['knee'] },
    { name: 'Step-ups (low box)', muscles: 'Quads, Glutes', compound: true, where: ['gym', 'home', 'bodyweight'], stress: [] },
    { name: 'Side-Lying Leg Raise', muscles: 'Glutes (abductors)', compound: false, where: ['gym', 'home', 'bodyweight'], stress: [] }
  ],
  hamstring: [
    { name: 'Seated Leg Curl', muscles: 'Hamstrings', compound: false, where: ['gym'], stress: [] },
    { name: 'Stability-Ball / Towel Leg Curl', muscles: 'Hamstrings', compound: false, where: ['gym', 'home', 'bodyweight'], stress: [] }
  ],
  calves: [
    { name: 'Standing Calf Raise', muscles: 'Calves', compound: false, where: ['gym', 'home', 'bodyweight'], stress: [] }
  ],
  biceps: [
    { name: 'Dumbbell Curl', muscles: 'Biceps', compound: false, where: ['gym', 'home'], stress: ['elbow'] },
    { name: 'Hammer Curl', muscles: 'Biceps, Forearms', compound: false, where: ['gym', 'home'], stress: [] },
    { name: 'Band Curl', muscles: 'Biceps', compound: false, where: ['gym', 'home', 'bodyweight'], stress: [] }
  ],
  triceps: [
    { name: 'Cable Rope Pushdown', muscles: 'Triceps', compound: false, where: ['gym'], stress: ['elbow'] },
    { name: 'Overhead Dumbbell Extension', muscles: 'Triceps', compound: false, where: ['gym', 'home'], stress: ['elbow', 'shoulder'] },
    { name: 'Bench Dips (feet on floor)', muscles: 'Triceps', compound: false, where: ['gym', 'home', 'bodyweight'], stress: ['shoulder', 'wrist'] },
    { name: 'Band Pushdown', muscles: 'Triceps', compound: false, where: ['gym', 'home', 'bodyweight'], stress: [] }
  ],
  lateral_delt: [
    { name: 'Dumbbell Lateral Raise', muscles: 'Side Delts', compound: false, where: ['gym', 'home'], stress: [] },
    { name: 'Band Lateral Raise', muscles: 'Side Delts', compound: false, where: ['gym', 'home', 'bodyweight'], stress: [] }
  ],
  rear_delt: [
    { name: 'Face Pull', muscles: 'Rear Delts, Upper Back', compound: false, where: ['gym'], stress: [] },
    { name: 'Band Pull-Apart', muscles: 'Rear Delts, Upper Back', compound: false, where: ['gym', 'home', 'bodyweight'], stress: [] }
  ],
  core: [
    { name: 'Plank', muscles: 'Core', compound: false, where: ['gym', 'home', 'bodyweight'], stress: [] },
    { name: 'Dead Bug', muscles: 'Core', compound: false, where: ['gym', 'home', 'bodyweight'], stress: [] },
    { name: 'Hanging Knee Raise', muscles: 'Core, Hip Flexors', compound: false, where: ['gym'], stress: ['shoulder'] }
  ]
};

/** Session templates: which slots each training day uses. */
export const SESSION_TEMPLATES: Record<string, { title: string; focus: string; slots: string[] }> = {
  full_a: { title: 'Full Body A', focus: 'Squat, push, pull', slots: ['squat', 'horizontal_push', 'horizontal_pull', 'hinge', 'lateral_delt', 'core'] },
  full_b: { title: 'Full Body B', focus: 'Hinge, vertical push/pull', slots: ['hinge', 'vertical_push', 'vertical_pull', 'single_leg', 'biceps', 'core'] },
  full_c: { title: 'Full Body C', focus: 'Single-leg, incline push, rows', slots: ['single_leg', 'incline_push', 'horizontal_pull', 'hamstring', 'triceps', 'core'] },
  upper_a: { title: 'Upper Body A', focus: 'Chest & back strength', slots: ['horizontal_push', 'horizontal_pull', 'vertical_push', 'vertical_pull', 'triceps', 'biceps'] },
  lower_a: { title: 'Lower Body A', focus: 'Quads & glutes', slots: ['squat', 'hinge', 'single_leg', 'calves', 'core'] },
  upper_b: { title: 'Upper Body B', focus: 'Shoulders & arms', slots: ['incline_push', 'vertical_pull', 'lateral_delt', 'horizontal_pull', 'rear_delt', 'biceps', 'triceps'] },
  lower_b: { title: 'Lower Body B', focus: 'Hamstrings & glutes', slots: ['hinge', 'single_leg', 'hamstring', 'calves', 'core'] },
  push: { title: 'Push', focus: 'Chest, shoulders, triceps', slots: ['horizontal_push', 'vertical_push', 'incline_push', 'lateral_delt', 'triceps'] },
  pull: { title: 'Pull', focus: 'Back, rear delts, biceps', slots: ['vertical_pull', 'horizontal_pull', 'rear_delt', 'biceps', 'core'] },
  legs: { title: 'Legs', focus: 'Quads, hamstrings, glutes', slots: ['squat', 'hinge', 'single_leg', 'hamstring', 'calves'] }
};

export const SPLITS: Record<number, { name: string; sessions: string[] }> = {
  2: { name: '2-Day Full Body', sessions: ['full_a', 'full_b'] },
  3: { name: '3-Day Full Body', sessions: ['full_a', 'full_b', 'full_c'] },
  4: { name: '4-Day Upper/Lower Split', sessions: ['upper_a', 'lower_a', 'upper_b', 'lower_b'] },
  5: { name: '5-Day Push/Pull/Legs + Upper/Lower', sessions: ['push', 'pull', 'legs', 'upper_b', 'lower_b'] },
  6: { name: '6-Day Push/Pull/Legs x2', sessions: ['push', 'pull', 'legs', 'push', 'pull', 'legs'] }
};

/** Injury text -> stressed areas to avoid. */
export function injuryStresses(injuries: string[]): Set<Stress> {
  const out = new Set<Stress>();
  for (const raw of injuries) {
    const i = raw.toLowerCase();
    if (/knee|acl|meniscus|patell/.test(i)) { out.add('knee'); out.add('impact'); }
    if (/back|spine|disc|lumbar|sciatica/.test(i)) out.add('lower_back');
    if (/shoulder|rotator|labrum/.test(i)) out.add('shoulder');
    if (/wrist|carpal/.test(i)) out.add('wrist');
    if (/elbow|tennis|golfer/.test(i)) out.add('elbow');
    if (/ankle|shin|foot|plantar/.test(i)) out.add('impact');
  }
  return out;
}

export function locationOf(workoutLocation: string): Location {
  const l = (workoutLocation || '').toLowerCase();
  if (l.includes('bodyweight') || l.includes('calisthenics')) return 'bodyweight';
  if (l.includes('home')) return 'home';
  return 'gym';
}

// ---------------------------------------------------------------- food

export type DietTag = 'vegan' | 'veg' | 'egg' | 'nonveg';
export interface FoodOption {
  name: string;
  slot: 'breakfast' | 'lunch' | 'snack' | 'dinner';
  diet: DietTag;           // least restrictive diet that can eat it (vegan < veg < egg < nonveg)
  calories: number;
  protein: number;
  costInr: number;         // approximate cost of this portion
  allergens: string[];     // lower-case keywords
  portion: string;
}

export const FOODS: FoodOption[] = [
  // breakfast
  { name: 'Moong dal chilla (3) with curd', slot: 'breakfast', diet: 'veg', calories: 380, protein: 22, costInr: 35, allergens: ['dairy', 'milk'], portion: '3 chillas + 100 g curd' },
  { name: 'Besan chilla (2) with mint chutney', slot: 'breakfast', diet: 'vegan', calories: 330, protein: 16, costInr: 25, allergens: [], portion: '2 chillas' },
  { name: 'Oats with milk, banana & peanuts', slot: 'breakfast', diet: 'veg', calories: 430, protein: 18, costInr: 35, allergens: ['dairy', 'milk', 'peanut'], portion: '60 g oats, 250 ml milk' },
  { name: 'Egg bhurji (3 eggs) with 2 roti', slot: 'breakfast', diet: 'egg', calories: 440, protein: 25, costInr: 40, allergens: ['egg', 'gluten', 'wheat'], portion: '3 eggs + 2 roti' },
  { name: 'Poha with peanuts & sprouts', slot: 'breakfast', diet: 'vegan', calories: 380, protein: 14, costInr: 25, allergens: ['peanut'], portion: '1.5 cups' },
  { name: 'Idli (4) with sambar', slot: 'breakfast', diet: 'vegan', calories: 380, protein: 14, costInr: 35, allergens: [], portion: '4 idli + 1 cup sambar' },
  { name: 'Paneer paratha with curd', slot: 'breakfast', diet: 'veg', calories: 480, protein: 22, costInr: 50, allergens: ['dairy', 'milk', 'gluten', 'wheat'], portion: '1 large paratha + 100 g curd' },
  // lunch
  { name: 'Dal, 3 roti, sabzi & curd', slot: 'lunch', diet: 'veg', calories: 600, protein: 24, costInr: 50, allergens: ['gluten', 'wheat', 'dairy', 'milk'], portion: '1 cup dal, 3 roti' },
  { name: 'Rajma / chole with rice & salad', slot: 'lunch', diet: 'vegan', calories: 580, protein: 21, costInr: 45, allergens: [], portion: '1 cup rajma, 1 cup rice' },
  { name: 'Soya chunk curry with 2 roti', slot: 'lunch', diet: 'vegan', calories: 540, protein: 36, costInr: 40, allergens: ['soy', 'gluten', 'wheat'], portion: '50 g dry soya + 2 roti' },
  { name: 'Chicken curry, rice & salad', slot: 'lunch', diet: 'nonveg', calories: 620, protein: 42, costInr: 90, allergens: [], portion: '150 g chicken, 1 cup rice' },
  { name: 'Egg curry (3 eggs) with rice', slot: 'lunch', diet: 'egg', calories: 590, protein: 26, costInr: 50, allergens: ['egg'], portion: '3 eggs, 1 cup rice' },
  { name: 'Paneer bhurji, 2 roti & salad', slot: 'lunch', diet: 'veg', calories: 560, protein: 30, costInr: 70, allergens: ['dairy', 'milk', 'gluten', 'wheat'], portion: '120 g paneer + 2 roti' },
  { name: 'Fish curry with rice', slot: 'lunch', diet: 'nonveg', calories: 590, protein: 38, costInr: 100, allergens: ['fish'], portion: '150 g fish, 1 cup rice' },
  // snack
  { name: 'Roasted chana & buttermilk', slot: 'snack', diet: 'veg', calories: 200, protein: 12, costInr: 15, allergens: ['dairy', 'milk'], portion: '40 g chana + 1 glass chaas' },
  { name: 'Sprouts chaat', slot: 'snack', diet: 'vegan', calories: 180, protein: 11, costInr: 15, allergens: [], portion: '1 bowl' },
  { name: 'Curd with fruit', slot: 'snack', diet: 'veg', calories: 190, protein: 9, costInr: 25, allergens: ['dairy', 'milk'], portion: '150 g curd + 1 fruit' },
  { name: '2 boiled eggs & a fruit', slot: 'snack', diet: 'egg', calories: 230, protein: 13, costInr: 20, allergens: ['egg'], portion: '2 eggs + 1 fruit' },
  { name: 'Peanut chikki & banana', slot: 'snack', diet: 'vegan', calories: 260, protein: 7, costInr: 15, allergens: ['peanut'], portion: '1 piece + 1 banana' },
  { name: 'Whey protein in milk', slot: 'snack', diet: 'veg', calories: 250, protein: 32, costInr: 45, allergens: ['dairy', 'milk'], portion: '1 scoop + 250 ml milk' },
  // dinner
  { name: 'Paneer tikka with 2 roti & salad', slot: 'dinner', diet: 'veg', calories: 560, protein: 32, costInr: 75, allergens: ['dairy', 'milk', 'gluten', 'wheat'], portion: '150 g paneer + 2 roti' },
  { name: 'Tofu / soya bhurji with 2 roti', slot: 'dinner', diet: 'vegan', calories: 500, protein: 30, costInr: 45, allergens: ['soy', 'gluten', 'wheat'], portion: '150 g tofu or 50 g soya' },
  { name: 'Moong dal khichdi with curd', slot: 'dinner', diet: 'veg', calories: 480, protein: 20, costInr: 30, allergens: ['dairy', 'milk'], portion: '1.5 cups + 100 g curd' },
  { name: 'Grilled chicken with sauteed veg & 1 roti', slot: 'dinner', diet: 'nonveg', calories: 480, protein: 45, costInr: 95, allergens: ['gluten', 'wheat'], portion: '180 g chicken' },
  { name: 'Egg & veg stir-fry with 2 roti', slot: 'dinner', diet: 'egg', calories: 480, protein: 24, costInr: 40, allergens: ['egg', 'gluten', 'wheat'], portion: '3 eggs + veg + 2 roti' },
  { name: 'Mixed dal, rice & vegetable', slot: 'dinner', diet: 'vegan', calories: 500, protein: 18, costInr: 30, allergens: [], portion: '1 cup dal, 0.75 cup rice' }
];

/** Diet preference -> which food tags are allowed. */
export function allowedDiets(pref: string): DietTag[] {
  const p = (pref || '').toLowerCase();
  if (p.includes('vegan')) return ['vegan'];
  if (p.includes('egg')) return ['vegan', 'veg', 'egg'];
  if (p.includes('non')) return ['vegan', 'veg', 'egg', 'nonveg'];
  if (p.includes('veg')) return ['vegan', 'veg'];
  return ['vegan', 'veg', 'egg', 'nonveg'];
}

/** Affordable protein sources by diet, for consistency recommendations. */
export const PROTEIN_SOURCES: Array<{ name: string; protein: string; costNote: string; diet: DietTag; allergens: string[] }> = [
  { name: 'Soya chunks', protein: '26 g per 50 g dry', costNote: '≈ ₹10 per serving', diet: 'vegan', allergens: ['soy'] },
  { name: 'Roasted chana', protein: '9 g per 40 g', costNote: '≈ ₹8 per serving', diet: 'vegan', allergens: [] },
  { name: 'Moong / masoor dal', protein: '9 g per cooked cup', costNote: '≈ ₹10 per cup', diet: 'vegan', allergens: [] },
  { name: 'Peanuts', protein: '7 g per 30 g', costNote: '≈ ₹5 per serving', diet: 'vegan', allergens: ['peanut'] },
  { name: 'Curd / dahi', protein: '4 g per 100 g (hung curd ≈ 9 g)', costNote: '≈ ₹10 per 100 g', diet: 'veg', allergens: ['dairy', 'milk'] },
  { name: 'Paneer', protein: '18 g per 100 g', costNote: '≈ ₹40 per 100 g', diet: 'veg', allergens: ['dairy', 'milk'] },
  { name: 'Milk', protein: '8 g per 250 ml', costNote: '≈ ₹15 per glass', diet: 'veg', allergens: ['dairy', 'milk'] },
  { name: 'Eggs', protein: '6 g each', costNote: '≈ ₹7 each', diet: 'egg', allergens: ['egg'] },
  { name: 'Chicken breast', protein: '31 g per 100 g cooked', costNote: '≈ ₹35 per 100 g', diet: 'nonveg', allergens: [] }
];
