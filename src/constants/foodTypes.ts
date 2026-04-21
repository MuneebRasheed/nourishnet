/** Canonical listing food types (must match provider Post Food and listing `food_type`). */
export const FOOD_TYPES = [
  'Prepared Meals',
  'Baked Goods',
  'Produce',
  'Dairy',
  'Pantry',
  'Other',
] as const;

export type FoodType = (typeof FOOD_TYPES)[number];
