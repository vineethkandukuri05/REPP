import { describe, it, expect } from 'vitest';
import { validateMealSafety, validateExerciseSafety } from './safetyValidators.js';

describe('Safety Validators', () => {
  it('rejects meals violating Vegetarian diet preference', () => {
    const check = validateMealSafety({
      name: 'Chicken Biryani',
      ingredients: [{ name: 'Chicken Breast', qty: '150g' }, { name: 'Basmati Rice', qty: '100g' }],
      userDietPreference: 'Vegetarian',
      userAllergies: [],
      userDislikedFoods: []
    });

    expect(check.safe).toBe(false);
    expect(check.reason).toContain('violating Vegetarian preference');
  });

  it('rejects meals containing user listed allergens', () => {
    const check = validateMealSafety({
      name: 'Prawns Curry with Rice',
      ingredients: [{ name: 'Prawns / Shellfish', qty: '150g' }],
      userDietPreference: 'Non-Vegetarian',
      userAllergies: ['Shellfish', 'Peanuts'],
      userDislikedFoods: []
    });

    expect(check.safe).toBe(false);
    expect(check.reason).toContain('Shellfish');
  });

  it('rejects meals containing user disliked foods', () => {
    const check = validateMealSafety({
      name: 'Bitter Gourd Sabzi',
      ingredients: [{ name: 'Bitter gourd', qty: '100g' }],
      userDietPreference: 'Vegetarian',
      userAllergies: [],
      userDislikedFoods: ['Bitter gourd']
    });

    expect(check.safe).toBe(false);
    expect(check.reason).toContain('disliked food');
  });

  it('approves compliant healthy meal', () => {
    const check = validateMealSafety({
      name: 'Paneer Tikka with Whole Wheat Roti',
      ingredients: [{ name: 'Low-Fat Paneer', qty: '100g' }, { name: 'Roti', qty: '2 pieces' }],
      userDietPreference: 'Vegetarian',
      userAllergies: ['Shellfish'],
      userDislikedFoods: ['Bitter gourd']
    });

    expect(check.safe).toBe(true);
  });

  it('rejects overhead presses for wrist injury', () => {
    const check = validateExerciseSafety({
      exerciseName: 'Overhead Barbell Press',
      targetMuscles: ['Shoulders'],
      equipmentNeeded: 'Barbell',
      userInjuries: ['Minor left wrist sensitivity'],
      userAvailableEquipment: ['Dumbbells', 'Barbell'],
      userExcludedExercises: []
    });

    expect(check.safe).toBe(false);
    expect(check.reason).toContain('wrist');
  });

  it('rejects excluded exercises', () => {
    const check = validateExerciseSafety({
      exerciseName: 'Behind Neck Lat Pulldown',
      targetMuscles: ['Back'],
      equipmentNeeded: 'Cable',
      userInjuries: [],
      userAvailableEquipment: ['Cable'],
      userExcludedExercises: ['Behind Neck Lat Pulldown']
    });

    expect(check.safe).toBe(false);
    expect(check.reason).toContain('excluded');
  });
});
