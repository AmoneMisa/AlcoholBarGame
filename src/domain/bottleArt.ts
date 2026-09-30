export const PAINTED_BOTTLE_ATLAS = '/assets/drinks/bottles/painted-bottles-v3.webp';
export const PAINTED_BOTTLE_COLUMNS = 6;
export const PAINTED_BOTTLE_ROWS = 4;

const ingredientCells: Record<string, number> = {
  'white-rum': 0,
  'dark-rum': 1,
  gin: 2,
  vodka: 3,
  tequila: 4,
  whiskey: 5,
  'orange-liqueur': 6,
  vermouth: 7,
  'bitter-aperitif': 8,
  'sparkling-wine': 9,
  'coffee-liqueur': 10,
  'blue-curacao': 11,
  'herbal-liqueur': 12,
  'specialty-liqueur': 13,
  'fruit-wine': 14,
  'alcohol-free-beer': 15,
  'lime-juice': 16,
  'lemon-juice': 17,
  'pineapple-juice': 18,
  'cranberry-juice': 19,
  'sugar-syrup': 20,
  'coconut-cream': 13,
  milk: 21,
  'coconut-milk': 21,
  tonic: 22,
  soda: 23,
  cola: 10,
  'ginger-beer': 15,
  'grapefruit-soda': 23
};

const categoryCells: Record<string, number[]> = {
  rum: [0, 1], gin: [2], vodka: [3], tequila: [4], whiskey: [5], bourbon: [5],
  liqueur: [6, 10, 11, 12, 13], vermouth: [7], aperitif: [8], champagne: [9], wine: [9, 14],
  beer: [15], soju: [3, 14], sake: [3, 14], brandy: [1, 5], cognac: [1, 5], cider: [14, 15]
};

function hash(value: string) {
  let result = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    result ^= value.charCodeAt(index);
    result = Math.imul(result, 16777619);
  }
  return result >>> 0;
}

export function ingredientBottleArtIndex(id: string) {
  return ingredientCells[id];
}

export function brandBottleArtIndex(brand: string, category: string) {
  const normalized = category.toLowerCase().replace(/[^a-z]+/g, '-');
  const candidates = Object.entries(categoryCells).find(([key]) => normalized.includes(key))?.[1];
  if (candidates?.length) return candidates[hash(brand) % candidates.length];
  return hash(`${brand}:${category}`) % (PAINTED_BOTTLE_COLUMNS * PAINTED_BOTTLE_ROWS);
}

export function paintedBottleSpriteStyle(index: number) {
  const column = index % PAINTED_BOTTLE_COLUMNS;
  const row = Math.floor(index / PAINTED_BOTTLE_COLUMNS);
  return {
    backgroundImage: `url('${PAINTED_BOTTLE_ATLAS}')`,
    backgroundSize: `${PAINTED_BOTTLE_COLUMNS * 100}% ${PAINTED_BOTTLE_ROWS * 100}%`,
    backgroundPosition: `${column / (PAINTED_BOTTLE_COLUMNS - 1) * 100}% ${row / (PAINTED_BOTTLE_ROWS - 1) * 100}%`
  };
}
