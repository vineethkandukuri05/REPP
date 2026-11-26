import { describe, it, expect } from 'vitest';
import { calculateBMR, calculateMacros, calculateBMI, getActivityMultiplier } from './fitnessMath.js';

describe('Fitness Math Calculators', () => {
  it('calculates Mifflin-St Jeor BMR correctly for Male', () => {
    // Male: 10 * 76.5 + 6.25 * 178 - 5 * 26 + 5 = 765 + 1112.5 - 130 + 5 = 1752.5 -> 1753
    const bmr = calculateBMR(76.5, 178, 26, 'Male');
    expect(bmr).toBe(1753);
  });

  it('calculates Mifflin-St Jeor BMR correctly for Female', () => {
    // Female: 10 * 60 + 6.25 * 165 - 5 * 28 - 161 = 600 + 1031.25 - 140 - 161 = 1330.25 -> 1330
    const bmr = calculateBMR(60, 165, 28, 'Female');
    expect(bmr).toBe(1330);
  });

  it('calculates BMI properly', () => {
    const bmi = calculateBMI(76.5, 178);
    expect(bmi).toBe(24.1);
  });

  it('calculates macro split and enforces safe minimum floor', () => {
    const result = calculateMacros({
      weight: 50,
      height: 155,
      age: 25,
      sex: 'Female',
      activityLevel: 'Sedentary',
      primaryGoal: 'Fat Loss'
    });

    // Minimum floor for females must never be below 1200 kcal
    expect(result.dailyCalorieTarget).toBeGreaterThanOrEqual(1200);
    expect(result.proteinTarget).toBeGreaterThanOrEqual(100);
    expect(result.fatsTarget).toBeGreaterThan(0);
    expect(result.carbsTarget).toBeGreaterThan(0);
    expect(result.waterTarget).toBeGreaterThan(2000);
  });

  it('calculates recomposition targets for Alex Sharma baseline', () => {
    const result = calculateMacros({
      weight: 76.5,
      height: 178,
      age: 26,
      sex: 'Male',
      activityLevel: 'Moderately Active (3-4 days exercise)',
      primaryGoal: 'Body Recomposition'
    });

    expect(result.bmr).toBe(1753);
    expect(result.tdee).toBeGreaterThan(2400);
    expect(result.dailyCalorieTarget).toBeGreaterThan(2100);
    expect(result.proteinTarget).toBeGreaterThanOrEqual(150);
  });
});
