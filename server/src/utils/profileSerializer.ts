import type { Profile } from '@prisma/client';

// Profile list fields are stored as JSON strings in SQLite. Convert them back to
// arrays before sending a profile to the client.
const JSON_ARRAY_FIELDS = [
  'healthConditions',
  'injuries',
  'foodAllergies',
  'dietaryRestrictions',
  'preferredCuisines',
  'availableFoods',
  'dislikedFoods',
  'availableEquipment',
  'excludedExercises'
] as const;

function parseArray(value: unknown): unknown[] {
  if (Array.isArray(value)) return value;
  if (typeof value !== 'string' || value.trim() === '') return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function serializeProfile(profile: Profile): Record<string, unknown>;
export function serializeProfile(profile: Profile | null | undefined): Record<string, unknown> | null;
export function serializeProfile(profile: Profile | null | undefined): Record<string, unknown> | null {
  if (!profile) return null;
  const result: Record<string, unknown> = { ...profile };
  for (const field of JSON_ARRAY_FIELDS) {
    result[field] = parseArray(profile[field]);
  }
  return result;
}
