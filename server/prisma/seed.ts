import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const initialFoodItems = [
  { name: 'Roti / Chapati', hindiName: 'रोटी / चपाती', servingSize: '1 medium (40g)', calories: 104, protein: 3.2, carbs: 22.0, fats: 0.5, isVegetarian: true, category: 'Bread' },
  { name: 'Plain Dosa', hindiName: 'डोसा', servingSize: '1 large (100g)', calories: 165, protein: 4.0, carbs: 28.0, fats: 4.0, isVegetarian: true, category: 'Grain' },
  { name: 'Masala Dosa', hindiName: 'मसाला डोसा', servingSize: '1 medium (150g)', calories: 280, protein: 5.5, carbs: 40.0, fats: 11.0, isVegetarian: true, category: 'Grain' },
  { name: 'Idli', hindiName: 'इडली', servingSize: '1 piece (40g)', calories: 58, protein: 2.0, carbs: 12.0, fats: 0.2, isVegetarian: true, category: 'Grain' },
  { name: 'Low-Fat Paneer', hindiName: 'लो-फैट पनीर', servingSize: '100g', calories: 180, protein: 18.0, carbs: 4.0, fats: 10.0, isVegetarian: true, category: 'Dairy' },
  { name: 'Standard Paneer', hindiName: 'पनीर', servingSize: '100g', calories: 265, protein: 18.0, carbs: 3.0, fats: 20.0, isVegetarian: true, category: 'Dairy' },
  { name: 'Soya Chunks', hindiName: 'सोया चंक्स', servingSize: '50g dry', calories: 172, protein: 26.0, carbs: 16.5, fats: 0.5, isVegetarian: true, category: 'Lentil' },
  { name: 'Chicken Breast', hindiName: 'चिकन ब्रेस्ट', servingSize: '100g raw', calories: 120, protein: 26.0, carbs: 0.0, fats: 1.5, isVegetarian: false, category: 'Meat' },
  { name: 'Whole Egg', hindiName: 'अंडा', servingSize: '1 large (50g)', calories: 72, protein: 6.3, carbs: 0.4, fats: 4.8, isVegetarian: false, category: 'Dairy' },
  { name: 'Egg White', hindiName: 'अंडे की सफेदी', servingSize: '1 large (33g)', calories: 17, protein: 3.6, carbs: 0.2, fats: 0.1, isVegetarian: false, category: 'Dairy' },
  { name: 'Yellow Dal Tadka', hindiName: 'दाल तड़का', servingSize: '1 cup cooked (150g)', calories: 140, protein: 8.0, carbs: 20.0, fats: 3.5, isVegetarian: true, category: 'Lentil' },
  { name: 'Chana Masala', hindiName: 'चना मसाला', servingSize: '1 cup cooked (150g)', calories: 210, protein: 10.0, carbs: 35.0, fats: 3.5, isVegetarian: true, category: 'Lentil' },
  { name: 'Rajma Curry', hindiName: 'राजमा', servingSize: '1 cup cooked (150g)', calories: 190, protein: 11.0, carbs: 32.0, fats: 1.5, isVegetarian: true, category: 'Lentil' },
  { name: 'Cooked White Rice', hindiName: 'सफ़ेद चावल', servingSize: '1 cup (150g)', calories: 195, protein: 3.8, carbs: 43.0, fats: 0.4, isVegetarian: true, category: 'Grain' },
  { name: 'Cooked Brown Rice', hindiName: 'ब्राउन राइस', servingSize: '1 cup (150g)', calories: 165, protein: 3.5, carbs: 35.0, fats: 1.3, isVegetarian: true, category: 'Grain' },
  { name: 'Curd / Dahi', hindiName: 'दही', servingSize: '100g', calories: 65, protein: 3.5, carbs: 4.5, fats: 3.5, isVegetarian: true, category: 'Dairy' },
  { name: 'Greek Yogurt', hindiName: 'ग्रीक योगर्ट', servingSize: '100g', calories: 90, protein: 10.0, carbs: 4.0, fats: 3.5, isVegetarian: true, category: 'Dairy' },
  { name: 'Rolled Oats', hindiName: 'ओट्स', servingSize: '50g dry', calories: 190, protein: 6.5, carbs: 33.0, fats: 3.5, isVegetarian: true, category: 'Grain' },
  { name: 'Almonds', hindiName: 'बादाम', servingSize: '10g (approx 8 nuts)', calories: 58, protein: 2.1, carbs: 2.2, fats: 5.0, isVegetarian: true, category: 'Snack' },
  { name: 'Banana', hindiName: 'केला', servingSize: '1 medium (118g)', calories: 105, protein: 1.3, carbs: 27.0, fats: 0.3, isVegetarian: true, category: 'Vegetable' },
  { name: 'Apple', hindiName: 'सेब', servingSize: '1 medium (180g)', calories: 95, protein: 0.5, carbs: 25.0, fats: 0.3, isVegetarian: true, category: 'Vegetable' },
  { name: 'Vegetable Sambar', hindiName: 'सांभर', servingSize: '1 cup (200ml)', calories: 110, protein: 5.0, carbs: 16.0, fats: 3.0, isVegetarian: true, category: 'Lentil' },
  { name: 'Coconut Chutney', hindiName: 'नारियल चटनी', servingSize: '2 tbsp (30g)', calories: 85, protein: 1.0, carbs: 3.0, fats: 8.0, isVegetarian: true, category: 'Snack' },
  { name: 'Fish Curry', hindiName: 'मछली करी', servingSize: '150g', calories: 180, protein: 28.0, carbs: 2.0, fats: 7.0, isVegetarian: false, category: 'Meat' },
  { name: 'Whey Protein Powder', hindiName: 'व्हे प्रोटीन', servingSize: '1 scoop (30g)', calories: 120, protein: 24.0, carbs: 2.0, fats: 1.5, isVegetarian: true, category: 'Dairy' },
  { name: 'Mixed Green Salad', hindiName: 'सलाद', servingSize: '1 bowl (100g)', calories: 35, protein: 1.5, carbs: 7.0, fats: 0.2, isVegetarian: true, category: 'Vegetable' }
];

const initialBadges = [
  { code: '7-day-streak', title: '7-Day Streak', icon: '🔥', desc: 'Logged food & workouts 7 days in a row' },
  { code: 'protein-master', title: 'Protein Master', icon: '🍗', desc: 'Hit 150g+ protein for 5 consecutive days' },
  { code: 'iron-warrior', title: 'Iron Warrior', icon: '🏋️‍♂️', desc: 'Completed 20 gym workouts' },
  { code: 'bodyvision-pro', title: 'BodyVision Pro', icon: '📸', desc: 'Uploaded 3 progress photos over 30 days' },
  { code: 'macro-titan', title: 'Macro Titan', icon: '⚡', desc: 'Hit calorie target within 2% margin for 14 days' }
];

async function main() {
  console.log('Seeding initial Indian food items...');
  for (const item of initialFoodItems) {
    await prisma.foodItem.upsert({
      where: { name: item.name },
      update: item,
      create: item,
    });
  }

  console.log('Seeding system badges...');
  for (const badge of initialBadges) {
    await prisma.badge.upsert({
      where: { code: badge.code },
      update: badge,
      create: badge,
    });
  }

  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
