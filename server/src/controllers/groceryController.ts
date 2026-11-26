import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { evaluateUserBadges } from '../utils/badgeEvaluator.js';

const prisma = new PrismaClient();

const sampleBaseGrocery = [
  { name: 'Chicken Breast (Boneless)', category: 'Protein', qty: '1.5 kg', estimatedPrice: 420 },
  { name: 'Whole Eggs', category: 'Protein', qty: '30 Eggs', estimatedPrice: 210 },
  { name: 'Low-Fat Paneer', category: 'Protein', qty: '500g', estimatedPrice: 190 },
  { name: 'Soya Chunks', category: 'Protein', qty: '500g', estimatedPrice: 85 },
  { name: 'Rolled Oats', category: 'Grains', qty: '1 kg', estimatedPrice: 180 },
  { name: 'Brown Rice / Whole Wheat Atta', category: 'Grains', qty: '3 kg', estimatedPrice: 240 },
  { name: 'Yellow Moong / Toor Dal', category: 'Grains', qty: '1 kg', estimatedPrice: 150 },
  { name: 'Fresh Spinach, Cucumber, Tomatoes', category: 'Vegetables', qty: '2 kg mix', estimatedPrice: 120 },
  { name: 'Broccoli & Bell Peppers', category: 'Vegetables', qty: '1 kg', estimatedPrice: 160 },
  { name: 'Bananas & Apples', category: 'Fruits', qty: '1 dozen + 1kg', estimatedPrice: 180 },
  { name: 'Curd / Greek Yogurt', category: 'Dairy', qty: '1 kg', estimatedPrice: 110 },
  { name: 'Raw Almonds & Walnuts', category: 'Snacks', qty: '250g', estimatedPrice: 290 },
  { name: 'Olive Oil & Spices', category: 'Spices and essentials', qty: '500ml', estimatedPrice: 450 }
];

export async function getGroceryList(req: Request, res: Response): Promise<void> {
  const userId = req.user!.userId;

  let items = await prisma.groceryItem.findMany({
    where: { userId },
    orderBy: { createdAt: 'asc' }
  });

  if (items.length === 0) {
    // Populate baseline list
    await prisma.groceryItem.createMany({
      data: sampleBaseGrocery.map(g => ({
        userId,
        name: g.name,
        category: g.category,
        qty: g.qty,
        estimatedPrice: g.estimatedPrice,
        isBought: false,
        isCustom: false
      }))
    });

    items = await prisma.groceryItem.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' }
    });
  }

  res.json({ items });
}

export async function addItem(req: Request, res: Response): Promise<void> {
  const userId = req.user!.userId;
  const { name, category, qty, estimatedPrice } = req.body;

  if (!name || !name.trim()) {
    res.status(400).json({ error: 'Item name is required' });
    return;
  }

  const newItem = await prisma.groceryItem.create({
    data: {
      userId,
      name: name.trim(),
      category: category || 'Protein',
      qty: qty || '1 unit',
      estimatedPrice: Number(estimatedPrice) || 100,
      isBought: false,
      isCustom: true
    }
  });

  res.status(201).json({ item: newItem });
}

export async function toggleItem(req: Request, res: Response): Promise<void> {
  const userId = req.user!.userId;
  const id = req.params.id as string;

  const item = await prisma.groceryItem.findUnique({ where: { id } });
  if (!item || item.userId !== userId) {
    res.status(404).json({ error: 'Grocery item not found' });
    return;
  }

  const updated = await prisma.groceryItem.update({
    where: { id },
    data: { isBought: !item.isBought }
  });

  const newBadges = await evaluateUserBadges(prisma, userId);

  res.json({ item: updated, newBadges });
}

export async function deleteItem(req: Request, res: Response): Promise<void> {
  const userId = req.user!.userId;
  const id = req.params.id as string;

  const item = await prisma.groceryItem.findUnique({ where: { id } });
  if (!item || item.userId !== userId) {
    res.status(404).json({ error: 'Grocery item not found' });
    return;
  }

  await prisma.groceryItem.delete({ where: { id } });
  res.json({ message: 'Item deleted' });
}

export async function regenerateList(req: Request, res: Response): Promise<void> {
  const userId = req.user!.userId;

  // Preserve user-added custom items
  const customItems = await prisma.groceryItem.findMany({
    where: { userId, isCustom: true }
  });

  // Remove non-custom items
  await prisma.groceryItem.deleteMany({
    where: { userId, isCustom: false }
  });

  // Extract from active meal plan
  const activePlan = await prisma.mealPlan.findFirst({
    where: { userId, isActive: true },
    include: { meals: true }
  });

  const newGroceryList: Array<{ name: string; category: string; qty: string; estimatedPrice: number }> = [];

  if (activePlan && activePlan.meals.length > 0) {
    for (const meal of activePlan.meals) {
      const ings = JSON.parse(meal.ingredients || '[]');
      for (const ing of ings) {
        let cat = 'Protein';
        const lower = ing.name.toLowerCase();
        if (lower.includes('rice') || lower.includes('roti') || lower.includes('oat') || lower.includes('atta') || lower.includes('bread')) {
          cat = 'Grains';
        } else if (lower.includes('salad') || lower.includes('spinach') || lower.includes('vegetable') || lower.includes('bean') || lower.includes('tomato')) {
          cat = 'Vegetables';
        } else if (lower.includes('curd') || lower.includes('milk') || lower.includes('yogurt')) {
          cat = 'Dairy';
        } else if (lower.includes('almond') || lower.includes('nut') || lower.includes('seed')) {
          cat = 'Snacks';
        }

        newGroceryList.push({
          name: ing.name,
          category: cat,
          qty: ing.qty || '1 pack',
          estimatedPrice: Math.round((ing.calories || 100) * 0.8)
        });
      }
    }
  }

  if (newGroceryList.length === 0) {
    newGroceryList.push(...sampleBaseGrocery);
  }

  await prisma.groceryItem.createMany({
    data: newGroceryList.map(g => ({
      userId,
      name: g.name,
      category: g.category,
      qty: g.qty,
      estimatedPrice: g.estimatedPrice,
      isBought: false,
      isCustom: false
    }))
  });

  const allItems = await prisma.groceryItem.findMany({
    where: { userId },
    orderBy: { createdAt: 'asc' }
  });

  res.json({
    items: allItems,
    message: 'Grocery list regenerated from current AI meal plan while preserving custom items!'
  });
}
