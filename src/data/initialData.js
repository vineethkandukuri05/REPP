// Initial Mock Data Store for REPP AI Fitness Platform

export const initialUserProfile = {
  name: "Alex Sharma",
  email: "alex@example.com",
  age: 26,
  sex: "Male",
  height: 178, // cm
  weight: 76.5, // kg
  targetWeight: 72.0,
  waist: 82, // cm
  chest: 102, // cm
  arms: 38, // cm
  experienceLevel: "Intermediate",

  // Health & Lifestyle
  healthConditions: ["None"],
  injuries: ["Minor left wrist sensitivity"],
  activityLevel: "Moderately Active (3-4 days exercise)",
  dailyRoutine: "Desk job (8 hours), 1-hour workout in evening",
  sleepDuration: "7.5 hours",
  waterIntake: 2750, // ml
  waterTarget: 3500, // ml
  stressLevel: "Moderate",

  // Goals
  primaryGoal: "Body Recomposition", // Fat loss + Muscle gain
  goalDescription: "Lose 4.5kg fat while preserving lean muscle mass and improving strength.",

  // Nutrition Preferences
  dietPreference: "Non-Vegetarian", // Veg / Non-Veg / Vegan
  foodAllergies: ["Shellfish"],
  dietaryRestrictions: ["High protein focus", "Low refined sugar"],
  preferredCuisines: ["Indian North/South", "Mediterranean", "Continental"],
  availableFoods: [
    "Roti", "Dosa", "Idli", "Paneer", "Soya Chunks", "Eggs", "Chicken Breast",
    "Dal Tadka", "Brown Rice", "Curd / Yogurt", "Oats", "Whey Protein", "Vegetables", "Bananas"
  ],
  dislikedFoods: ["Bitter gourd", "Raw onions"],
  dailyBudget: 450, // INR ₹ per day
  mealsPerDay: 4,

  // Workout Preferences
  workoutLocation: "Gym Workouts",
  workoutSplit: "4-Day Upper/Lower Split",
  availableEquipment: ["Barbell", "Dumbbells", "Cable Machine", "Pull-up Bar", "Bench"],
  workoutDaysPerWeek: 4,
  workoutDuration: 60, // minutes
  excludedExercises: ["Overhead barbell press (wrist substitution applied)"],

  // Target Macros
  dailyCalorieTarget: 2200,
  caloriesConsumed: 1680,
  proteinTarget: 155, // grams
  proteinConsumed: 122,
  carbsTarget: 220,
  carbsConsumed: 165,
  fatsTarget: 60,
  fatsConsumed: 48,

  // Streak & Consistency
  streakDays: 7,
  weeklyConsistencyScore: 92,
  totalWorkoutsCompleted: 24,

  // Onboarding status
  isOnboarded: true
};

export const sampleMealPlan = [
  {
    id: "m1",
    category: "Breakfast",
    time: "08:30 AM",
    name: "High-Protein Oats & Boiled Eggs",
    rawVsCooked: "Oats (50g dry) + 3 Whole Eggs + 10g Almonds",
    calories: 480,
    protein: 34,
    carbs: 48,
    fats: 16,
    isCompleted: true,
    prepInstructions: "Cook 50g oats in 200ml skimmed milk or water. Boil 3 eggs for 8 mins. Garnish with chopped almonds.",
    ingredients: [
      { name: "Rolled Oats", qty: "50g dry", calories: 190 },
      { name: "Whole Eggs", qty: "3 large", calories: 210 },
      { name: "Almonds", qty: "10g", calories: 60 },
      { name: "Skimmed Milk", qty: "100ml", calories: 40 }
    ]
  },
  {
    id: "m2",
    category: "Lunch",
    time: "01:30 PM",
    name: "Grilled Chicken Breast with Whole Wheat Rotis & Dal",
    rawVsCooked: "Raw Chicken (150g raw → ~115g cooked) + 2 Whole Wheat Rotis (60g flour) + 1 Bowl Dal Tadka (150g)",
    calories: 620,
    protein: 52,
    carbs: 64,
    fats: 14,
    isCompleted: true,
    prepInstructions: "Marinate chicken in curd and spices, pan-grill with 5ml olive oil. Serve hot with 2 rotis and yellow dal.",
    ingredients: [
      { name: "Chicken Breast", qty: "150g raw (~115g cooked)", calories: 245 },
      { name: "Whole Wheat Roti", qty: "2 pieces (60g total)", calories: 180 },
      { name: "Yellow Dal Tadka", qty: "1 cup (150g cooked)", calories: 140 },
      { name: "Cucumber & Tomato Salad", qty: "1 bowl", calories: 35 }
    ]
  },
  {
    id: "m3",
    category: "Evening Snack",
    time: "05:30 PM",
    name: "Paneer & Soya Chunks Tikka Bowl",
    rawVsCooked: "Paneer (75g raw) + Soya Chunks (25g dry → 75g soaked)",
    calories: 330,
    protein: 26,
    carbs: 18,
    fats: 16,
    isCompleted: false,
    prepInstructions: "Soak soya chunks in hot water. Toss with paneer cubes, mint chutney, lemon juice, and air-fry for 10 mins.",
    ingredients: [
      { name: "Low-fat Paneer", qty: "75g", calories: 180 },
      { name: "Soya Chunks", qty: "25g dry", calories: 90 },
      { name: "Mint Chutney & Spices", qty: "2 tbsp", calories: 30 },
      { name: "Lemon & Onion", qty: "50g", calories: 30 }
    ]
  },
  {
    id: "m4",
    category: "Dinner",
    time: "08:45 PM",
    name: "Egg Curry / Fish Curry with Brown Rice & Stir-fried Beans",
    rawVsCooked: "Brown Rice (60g dry → 150g cooked) + 3 Egg whites & 1 Whole egg curry",
    calories: 450,
    protein: 32,
    carbs: 52,
    fats: 12,
    isCompleted: false,
    prepInstructions: "Boil eggs, simmer in light onion-tomato gravy. Serve with steamed brown rice and sauteed green beans.",
    ingredients: [
      { name: "Boiled Eggs", qty: "3 Whites + 1 Yolk", calories: 160 },
      { name: "Brown Rice", qty: "60g dry (~150g cooked)", calories: 210 },
      { name: "Green Beans & Spices", qty: "100g", calories: 50 },
      { name: "Olive Oil", qty: "4ml", calories: 30 }
    ]
  }
];

export const sampleWorkoutPlan = {
  dayName: "Day 3 - Upper Body Hypertrophy",
  split: "Upper / Lower Split",
  duration: 55, // mins
  difficulty: "Intermediate",
  targetMuscles: ["Chest", "Lats", "Shoulders", "Triceps", "Biceps"],
  isCompletedToday: false,
  exercises: [
    {
      id: "ex1",
      name: "Incline Dumbbell Press",
      target: "Upper Chest & Anterior Delts",
      equipment: "Incline Bench, Dumbbells",
      sets: 4,
      reps: "8-10",
      rest: "90 sec",
      completedSets: 3,
      targetWeight: "24 kg",
      isPR: true,
      instructions: "Set bench at 30 degrees. Retract shoulder blades, press weight up in a slight arc without locking elbows.",
      substitutions: ["Barbell Incline Press", "Machine Chest Press", "Decline Push-ups"]
    },
    {
      id: "ex2",
      name: "Lat Pulldown (Neutral Grip)",
      target: "Lats & Middle Back",
      equipment: "Cable Pulley",
      sets: 4,
      reps: "10-12",
      rest: "75 sec",
      completedSets: 4,
      targetWeight: "55 kg",
      isPR: false,
      instructions: "Pull bar down to upper chest, squeezing lats at the bottom. Control the 3-second negative eccentric phase.",
      substitutions: ["Pull-ups", "Chest-supported Dumbbell Row", "Single-arm Cable Row"]
    },
    {
      id: "ex3",
      name: "Dumbbell Lateral Raises",
      target: "Side Deltoids",
      equipment: "Dumbbells",
      sets: 3,
      reps: "12-15",
      rest: "60 sec",
      completedSets: 0,
      targetWeight: "10 kg",
      isPR: false,
      instructions: "Keep slight bend in elbows, raise arms out to sides until parallel with shoulders. Lead with elbows.",
      substitutions: ["Cable Lateral Raise", "Machine Side Raise"]
    },
    {
      id: "ex4",
      name: "Cable Tricep Pushdown",
      target: "Triceps Lateral Head",
      equipment: "Cable & Rope",
      sets: 3,
      reps: "12-15",
      rest: "60 sec",
      completedSets: 0,
      targetWeight: "25 kg",
      isPR: false,
      instructions: "Pin upper arms to torso sides. Extend elbows fully down and spread rope ends out at bottom extension.",
      substitutions: ["Skull Crushers", "Dumbbell Overhead Tricep Extension"]
    },
    {
      id: "ex5",
      name: "Incline Dumbbell Bicep Curl",
      target: "Biceps Long Head",
      equipment: "Incline Bench, Dumbbells",
      sets: 3,
      reps: "10-12",
      rest: "60 sec",
      completedSets: 0,
      targetWeight: "12 kg",
      isPR: false,
      instructions: "Sit on incline bench at 45 degrees, let arms hang back to get maximum bicep stretch. Curl smoothly.",
      substitutions: ["Ez-bar Preacher Curl", "Hammer Curls"]
    }
  ]
};

export const sampleBodyVisionReports = [
  {
    id: "bv-latest",
    date: "Sep 18, 2026",
    frontPhoto: "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?auto=format&fit=crop&w=400&q=80",
    sidePhoto: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=400&q=80",
    backPhoto: "https://images.unsplash.com/photo-1534367507873-d2d7e24c797f?auto=format&fit=crop&w=400&q=80",
    estimatedBodyFatRange: "16.2% - 18.0%",
    fatDistribution: "Primary storage in lower abdominal area; upper chest and shoulders showing improved muscular definition.",
    visibleTrends: "Noticeable increase in shoulder cap width and upper abdominal vascularity compared to 4 weeks ago.",
    comparisonWithPrevious: "Body fat reduced by ~1.2% over 30 days while maintaining arm circumference (38 cm).",
    disclaimer: "AI estimate for tracking progress, not a DEXA scan or clinical measurement. Posture, lighting, and water retention influence optical estimation."
  },
  {
    id: "bv-past",
    date: "Aug 18, 2026",
    frontPhoto: "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?auto=format&fit=crop&w=400&q=80",
    estimatedBodyFatRange: "17.4% - 19.2%",
    fatDistribution: "Moderate fat concentration around waistline and hips.",
    visibleTrends: "Baseline scan recorded at start of REPP Recomp Program."
  }
];

export const sampleGroceryList = [
  { id: "g1", name: "Chicken Breast (Boneless)", category: "Protein", qty: "1.5 kg", estimatedPrice: 420, isBought: true },
  { id: "g2", name: "Whole Eggs", category: "Protein", qty: "30 Eggs", estimatedPrice: 210, isBought: true },
  { id: "g3", name: "Low-Fat Paneer", category: "Protein", qty: "500g", estimatedPrice: 190, isBought: false },
  { id: "g4", name: "Soya Chunks", category: "Protein", qty: "500g", estimatedPrice: 85, isBought: false },
  { id: "g5", name: "Rolled Oats", category: "Grains", qty: "1 kg", estimatedPrice: 180, isBought: true },
  { id: "g6", name: "Brown Rice / Whole Wheat Atta", category: "Grains", qty: "3 kg", estimatedPrice: 240, isBought: false },
  { id: "g7", name: "Yellow Moong / Toor Dal", category: "Grains", qty: "1 kg", estimatedPrice: 150, isBought: true },
  { id: "g8", name: "Fresh Spinach, Cucumber, Tomatoes", category: "Vegetables", qty: "2 kg mix", estimatedPrice: 120, isBought: false },
  { id: "g9", name: "Broccoli & Bell Peppers", category: "Vegetables", qty: "1 kg", estimatedPrice: 160, isBought: false },
  { id: "g10", name: "Bananas & Apples", category: "Fruits", qty: "1 dozen + 1kg", estimatedPrice: 180, isBought: true },
  { id: "g11", name: "Curd / Greek Yogurt", category: "Dairy", qty: "1 kg", estimatedPrice: 110, isBought: false },
  { id: "g12", name: "Raw Almonds & Walnuts", category: "Snacks", qty: "250g", estimatedPrice: 290, isBought: false },
  { id: "g13", name: "Olive Oil & Spices", category: "Spices and essentials", qty: "500ml", estimatedPrice: 450, isBought: true }
];

export const sampleAdaptivePlan = {
  weekNumber: 4,
  reviewPeriod: "Sep 12 - Sep 18, 2026",
  adherenceScore: 92,
  summaryText: "Excellent consistency this week! You met 94% of your protein target and completed 4 out of 4 scheduled workouts.",
  whatWentWell: [
    "Protein intake averaged 152g/day (Target: 155g).",
    "Hit a new Personal Record on Incline Dumbbell Press (24kg x 9 reps).",
    "Water intake improved to 3.2L average per day."
  ],
  areasForImprovement: [
    "Friday dinner contained unexpected high-sodium restaurant meal.",
    "Sleep fell below 7 hours on Wednesday night."
  ],
  suggestedAdjustments: {
    calories: "Adjust daily calories from 2,200 to 2,150 (-50 kcal) to accelerate mild fat loss phase.",
    protein: "Maintain 155g protein target.",
    workout: "Increase working weight on Lat Pulldown from 55kg to 57.5kg for next 2 weeks.",
    habit: "Set a 10:30 PM sleep reminder on weekdays."
  },
  nextWeekGoals: [
    "Log all 4 meals daily before 9 PM",
    "Complete 4 Upper/Lower hypertrophy sessions",
    "Maintain sub-82cm waist measurement"
  ]
};

export const sampleBadges = [
  { id: "b1", title: "7-Day Streak", icon: "🔥", desc: "Logged food & workouts 7 days in a row", unlocked: true },
  { id: "b2", title: "Protein Master", icon: "🍗", desc: "Hit 150g+ protein for 5 consecutive days", unlocked: true },
  { id: "b3", title: "Iron Warrior", icon: "🏋️‍♂️", desc: "Completed 20 gym workouts", unlocked: true },
  { id: "b4", title: "BodyVision Pro", icon: "📸", desc: "Uploaded 3 progress photos over 30 days", unlocked: true },
  { id: "b5", title: "Grocery Wizard", icon: "🛒", desc: "Purchased 100% of planned meal items", unlocked: false },
  { id: "b6", title: "Macro Titan", icon: "⚡", desc: "Hit calorie target within 2% margin for 14 days", unlocked: false }
];

export const sampleChatHistory = [
  {
    sender: "ai",
    text: "Hello Alex! I'm your REPP AI Coach. I've analyzed your goal of Body Recomposition (76.5 kg → 72 kg, 155g protein target). How can I assist you with your diet, workout, or recovery today?",
    time: "10:00 AM"
  }
];
