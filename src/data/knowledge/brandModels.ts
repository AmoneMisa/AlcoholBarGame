// Vector bottle models for brands: a silhouette per drink type, plus the real look of well-known brands
// (glass colour, label, cap). Unknown brands fall back to their category's look with their own name on the label.

export type BottleShape = 'tall' | 'shoulder' | 'square' | 'decanter' | 'squat' | 'round' | 'flask' | 'champagne' | 'wine' | 'beer' | 'soju' | 'can';
export interface BottleLook {
  shape: BottleShape;
  glass: string;
  label: string;
  ink: string;
  cap: string;
  labelStyle?: 'rect' | 'oval' | 'band' | 'shield';
  frosted?: boolean;
}

const CATEGORY_LOOK: Record<string, BottleLook> = {
  'white-rum': { shape: 'shoulder', glass: '#e8eef0', label: '#f4ecd6', ink: '#1d2c4a', cap: '#c9a54c' },
  'dark-rum': { shape: 'shoulder', glass: '#6b3416', label: '#efe0bf', ink: '#3a1a0a', cap: '#2a1a12' },
  gin: { shape: 'tall', glass: '#dfeee9', label: '#f5f0e2', ink: '#1f4a3a', cap: '#2f6b53' },
  vodka: { shape: 'tall', glass: '#eef3f6', label: '#ffffff', ink: '#1a2b52', cap: '#b9c2cb', frosted: true },
  tequila: { shape: 'squat', glass: '#eef0e0', label: '#f3ead0', ink: '#6b3a12', cap: '#7a5230' },
  whiskey: { shape: 'shoulder', glass: '#b8651e', label: '#f1e3c3', ink: '#3a200c', cap: '#2a1a12' },
  'orange-liqueur': { shape: 'square', glass: '#e9892a', label: '#f7eddc', ink: '#8a3a0a', cap: '#c9372c' },
  vermouth: { shape: 'wine', glass: '#7a1c1c', label: '#f3e7cf', ink: '#6a1515', cap: '#c9a54c' },
  'bitter-aperitif': { shape: 'tall', glass: '#c8202a', label: '#fbf2e2', ink: '#9a1620', cap: '#1d1b20' },
  'sparkling-wine': { shape: 'champagne', glass: '#1f3a26', label: '#f3e7c6', ink: '#2a2a2a', cap: '#d9ae4c' },
  'coffee-liqueur': { shape: 'flask', glass: '#3a1d12', label: '#e9d4ad', ink: '#3a1d12', cap: '#9b2b25' },
  'herbal-liqueur': { shape: 'square', glass: '#1f4a2a', label: '#f2e6c6', ink: '#1f4a2a', cap: '#c9a54c' },
  'cream-liqueur': { shape: 'flask', glass: '#5a3a2a', label: '#f3e7d6', ink: '#5a3a2a', cap: '#c9a54c' },
  'specialty-liqueur': { shape: 'flask', glass: '#c98a3a', label: '#fbf2e2', ink: '#6a3a12', cap: '#3a3a3a' },
  'blue-curacao': { shape: 'tall', glass: '#1f7fd1', label: '#ffffff', ink: '#0f3f7a', cap: '#c9a54c' },
  sambuca: { shape: 'tall', glass: '#eef3f6', label: '#1a1a2a', ink: '#f3e7c6', cap: '#1a1a2a' },
  cognac: { shape: 'decanter', glass: '#a2521c', label: '#1a1a1a', ink: '#d9ae4c', cap: '#1a1a1a' },
  brandy: { shape: 'decanter', glass: '#9a4a18', label: '#f1e3c3', ink: '#4a200c', cap: '#6a3a12' },
  'port-wine': { shape: 'wine', glass: '#2a0f12', label: '#f3e7cf', ink: '#4a0f15', cap: '#6a1515' },
  beer: { shape: 'beer', glass: '#6b3a0e', label: '#f3e7cf', ink: '#8a1a1a', cap: '#c9a54c' },
  'non-alcoholic-beer': { shape: 'beer', glass: '#2f6b3a', label: '#ffffff', ink: '#1f4a2a', cap: '#1f7fd1' },
  cider: { shape: 'beer', glass: '#d9a84a', label: '#2a4a1a', ink: '#f3e7c6', cap: '#2a4a1a' },
  soju: { shape: 'soju', glass: '#3f9a5a', label: '#ffffff', ink: '#1f4a2a', cap: '#2f7a4a' },
  sake: { shape: 'wine', glass: '#dfe6e9', label: '#f6f1e6', ink: '#2a2a2a', cap: '#2a2a2a', labelStyle: 'band' },
  sangria: { shape: 'wine', glass: '#8a1a2a', label: '#ffffff', ink: '#8a1a2a', cap: '#8a1a2a' },
  'fruit-wine': { shape: 'wine', glass: '#b8653a', label: '#fff4e0', ink: '#6a2a12', cap: '#6a2a12' },
  infusion: { shape: 'tall', glass: '#6b3a1e', label: '#f3e7cf', ink: '#3a1a0a', cap: '#1a1a1a' }
};

// Real looks of famous brands (simplified: colours and bottle type only, no logos).
const BRAND_LOOK: Record<string, Partial<BottleLook>> = {
  'Bacardí': { glass: '#eef3f6', label: '#ffffff', ink: '#c8202a' },
  'Havana Club': { glass: '#eef0e8', label: '#e9d9a8', ink: '#8a1a1a' },
  'Captain Morgan': { glass: '#7a3a16', label: '#f3e0b0', ink: '#1a2a52', labelStyle: 'shield' },
  'Gosling’s': { glass: '#1a0f0a', label: '#1a1a1a', ink: '#f3e7c6' },
  'Kraken': { shape: 'round', glass: '#141414', label: '#e9dcc0', ink: '#141414' },
  'Ron Zacapa': { shape: 'squat', glass: '#5a2a10', label: '#1a1a1a', ink: '#d9ae4c', labelStyle: 'band' },
  'Diplomático': { shape: 'squat', glass: '#6a2a10', label: '#1a2a52', ink: '#d9ae4c' },
  'Gordon’s': { glass: '#d9ebe0', label: '#f3ead0', ink: '#c8202a', cap: '#c8202a' },
  'Tanqueray': { shape: 'square', glass: '#1f5a3a', label: '#c8202a', ink: '#ffffff', cap: '#c9a54c', labelStyle: 'oval' },
  'Beefeater': { glass: '#e8f0ec', label: '#c8202a', ink: '#ffffff', cap: '#c8202a' },
  'Bombay Sapphire': { shape: 'square', glass: '#2a6fd1', label: '#dfeaff', ink: '#1a3a7a', cap: '#c9c9c9' },
  'Hendrick’s': { shape: 'round', glass: '#1a1a1a', label: '#e9dcc0', ink: '#1a1a1a', cap: '#1a1a1a', labelStyle: 'oval' },
  'Monkey 47': { shape: 'squat', glass: '#4a3a1e', label: '#f3e7c6', ink: '#1a1a1a' },
  'Roku': { shape: 'square', glass: '#f0f3f0', label: '#f7f0e6', ink: '#8a1a1a' },
  'Absolut': { shape: 'tall', glass: '#eef4f8', label: '#eef4f8', ink: '#1a3a8a', cap: '#dfe6ec', labelStyle: 'band', frosted: false },
  'Smirnoff': { glass: '#eef3f6', label: '#c8202a', ink: '#ffffff', cap: '#c8202a', labelStyle: 'shield' },
  'Grey Goose': { glass: '#e9eef3', label: '#e9eef3', ink: '#2a4a7a', cap: '#2a3a52', frosted: true },
  'Belvedere': { glass: '#eef3f6', label: '#e9eef3', ink: '#1a1a1a', frosted: true },
  'Skyy': { glass: '#1f4fd1', label: '#1f4fd1', ink: '#ffffff', cap: '#1f4fd1' },
  'Finlandia': { glass: '#e6f0f6', label: '#e6f0f6', ink: '#1a3a7a', frosted: true },
  'Beluga': { glass: '#eef3f6', label: '#1a1a1a', ink: '#c9c9c9', cap: '#1a1a1a' },
  'Tito’s': { glass: '#eef3f6', label: '#f3ead0', ink: '#1a1a1a', cap: '#c9a54c' },
  'Patrón': { shape: 'squat', glass: '#eef0e8', label: '#1a2a1a', ink: '#e9e0c0', cap: '#caa56c', labelStyle: 'oval' },
  'Jose Cuervo': { glass: '#e0a83a', label: '#f3ead0', ink: '#1a3a1a' },
  'Clase Azul': { shape: 'decanter', glass: '#f3f3f3', label: '#1f4fa0', ink: '#ffffff', cap: '#c9a54c', labelStyle: 'band' },
  '1800': { shape: 'square', glass: '#eef0e0', label: '#1a1a1a', ink: '#d9ae4c' },
  'Casamigos': { shape: 'squat', glass: '#eef0e8', label: '#1a1a1a', ink: '#f3e7c6', cap: '#1a1a1a' },
  'Jack Daniel’s': { shape: 'square', glass: '#b8651e', label: '#141414', ink: '#ffffff', cap: '#141414' },
  'Jim Beam': { glass: '#b8651e', label: '#f3ead0', ink: '#1a1a1a', cap: '#1a1a1a' },
  'Maker’s Mark': { shape: 'squat', glass: '#b8651e', label: '#f3ead0', ink: '#1a1a1a', cap: '#c8202a' },
  'Jameson': { glass: '#3f7a3a', label: '#f3ead0', ink: '#1a3a1a', cap: '#1a3a1a' },
  'Johnnie Walker': { shape: 'square', glass: '#b8651e', label: '#1a1a1a', ink: '#d9ae4c', cap: '#1a1a1a' },
  'Chivas Regal': { shape: 'decanter', glass: '#b8651e', label: '#e9d9a8', ink: '#1a1a1a', cap: '#c9a54c' },
  'Glenfiddich': { glass: '#2f5a3a', label: '#f3ead0', ink: '#1a1a1a' },
  'Laphroaig': { glass: '#1f4a2a', label: '#ffffff', ink: '#1a1a1a' },
  'Crown Royal': { shape: 'decanter', glass: '#b8651e', label: '#4a1a7a', ink: '#d9ae4c', cap: '#c9a54c' },
  'Woodford Reserve': { shape: 'squat', glass: '#b8651e', label: '#f3ead0', ink: '#1a1a1a' },
  'Hibiki': { shape: 'decanter', glass: '#c7823a', label: '#f3ead0', ink: '#1a1a1a' },
  'Cointreau': { shape: 'square', glass: '#c9702a', label: '#f3e7cf', ink: '#8a1a1a', cap: '#8a1a1a' },
  'Grand Marnier': { shape: 'round', glass: '#b85a1e', label: '#c8202a', ink: '#ffffff', cap: '#c8202a', labelStyle: 'band' },
  'Martini & Rossi': { glass: '#7a1c1c', label: '#ffffff', ink: '#1a1a1a', cap: '#1a1a1a', labelStyle: 'oval' },
  'Lillet': { glass: '#e9c86a', label: '#f3ead0', ink: '#1a1a1a' },
  'Campari': { glass: '#c8202a', label: '#ffffff', ink: '#c8202a', cap: '#1a1a1a' },
  'Aperol': { shape: 'wine', glass: '#f06a1a', label: '#ffffff', ink: '#1a3a8a', cap: '#f06a1a' },
  'Moët & Chandon': { label: '#ffffff', ink: '#1a1a1a', cap: '#c9a54c' },
  'Veuve Clicquot': { label: '#f2b21e', ink: '#1a1a1a', cap: '#f2b21e' },
  'Dom Pérignon': { glass: '#16241a', label: '#1f3a26', ink: '#d9ae4c', labelStyle: 'shield' },
  'Perrier-Jouët': { glass: '#2f5a3a', label: '#ffffff', ink: '#2f5a3a' },
  'Mionetto': { label: '#1a1a1a', ink: '#f3e7c6', cap: '#1a1a1a' },
  'Freixenet': { glass: '#141414', label: '#141414', ink: '#d9ae4c', cap: '#141414' },
  'Kahlúa': { glass: '#3a1d12', label: '#f2c11e', ink: '#3a1d12', cap: '#c8202a' },
  'Baileys': { glass: '#3a2a1e', label: '#f3e7d6', ink: '#3a2a1e', cap: '#c9a54c' },
  'Jägermeister': { shape: 'square', glass: '#1f4a2a', label: '#f06a1a', ink: '#1a1a1a', cap: '#1a1a1a' },
  'Chartreuse': { shape: 'wine', glass: '#5a8a2a', label: '#f3e7c6', ink: '#1f4a1a' },
  'Galliano': { shape: 'tall', glass: '#e9c21e', label: '#1a1a1a', ink: '#e9c21e' },
  'Disaronno': { shape: 'square', glass: '#b8651e', label: '#1a1a1a', ink: '#d9ae4c', cap: '#1a1a1a' },
  'Frangelico': { shape: 'flask', glass: '#8a5a2a', label: '#f3e7c6', ink: '#5a3a1a', cap: '#8a5a2a' },
  'Malibu': { glass: '#ffffff', label: '#ffffff', ink: '#1a1a1a', cap: '#ffffff' },
  'Midori': { glass: '#5ad13a', label: '#1a1a1a', ink: '#5ad13a' },
  'Chambord': { shape: 'round', glass: '#4a0f2a', label: '#d9ae4c', ink: '#4a0f2a', cap: '#d9ae4c' },
  'St-Germain': { shape: 'tall', glass: '#e9d9a8', label: '#ffffff', ink: '#1a1a1a' },
  'Hennessy': { shape: 'decanter', glass: '#8a4a18', label: '#1a1a1a', ink: '#d9ae4c', cap: '#1a1a1a' },
  'Guinness': { glass: '#141414', label: '#f3e7c6', ink: '#1a1a1a', cap: '#d9ae4c' },
  'Heineken': { glass: '#2f7a3a', label: '#ffffff', ink: '#2f7a3a', cap: '#2f7a3a', labelStyle: 'oval' },
  'Corona': { glass: '#f3e7b0', label: '#1a3a8a', ink: '#f3e7b0', cap: '#d9ae4c', labelStyle: 'band' },
  'Stella Artois': { glass: '#2f7a3a', label: '#ffffff', ink: '#c8202a', cap: '#c9a54c' },
  'Budweiser': { glass: '#6b3a0e', label: '#c8202a', ink: '#ffffff', cap: '#c8202a' },
  'Asahi Super Dry': { shape: 'can', glass: '#c9ced3', label: '#c9ced3', ink: '#1a1a1a', cap: '#c9ced3' },
  'Jinro': { label: '#1f5a3a', ink: '#ffffff' },
  'Dassai': { shape: 'wine', glass: '#f3f3f3', label: '#ffffff', ink: '#1a1a1a' }
};

export function lookFor(brandName: string, category: string, productColor?: string): BottleLook {
  const base = CATEGORY_LOOK[category] ?? CATEGORY_LOOK.whiskey!;
  const brand = BRAND_LOOK[brandName] ?? {};
  return { labelStyle: 'rect', ...base, ...(productColor && !brand.glass ? { glass: productColor } : {}), ...brand };
}

// Short text for the label: the brand's main word.
export function labelText(brandName: string) {
  const cleaned = brandName.replace(/^The /, '').replace(/\s*\(.*\)$/, '');
  const first = cleaned.split(/[\s&]+/)[0] ?? cleaned;
  return (cleaned.length <= 9 ? cleaned : first.length <= 10 ? first : first.slice(0, 9)).toUpperCase();
}

// SVG path for each silhouette in a 60 × 120 box (centre x = 30, base y = 116).
export function bottlePath(shape: BottleShape) {
  const std = (top: number, neck: number, body: number, s1: number, s2: number, r = 4) => {
    const n = neck / 2, b = body / 2, c1 = s1 + (s2 - s1) * .55, c2 = s1 + (s2 - s1) * .45;
    return `M${30 - n} ${top} V${s1} C${30 - n} ${c1} ${30 - b} ${c2} ${30 - b} ${s2} V${116 - r} Q${30 - b} 116 ${30 - b + r} 116 H${30 + b - r} Q${30 + b} 116 ${30 + b} ${116 - r} V${s2} C${30 + b} ${c2} ${30 + n} ${c1} ${30 + n} ${s1} V${top} Z`;
  };
  switch (shape) {
    case 'tall': return std(6, 8, 24, 30, 44, 3);
    case 'shoulder': return std(6, 10, 28, 30, 38, 4);
    case 'square': return `M25 8 V30 L${30 - 16} 38 V114 Q14 116 16 116 H44 Q46 116 46 114 V38 L35 30 V8 Z`;
    case 'decanter': return 'M26 12 V32 C26 38 10 44 10 64 V104 Q10 116 22 116 H38 Q50 116 50 104 V64 C50 44 34 38 34 32 V12 Z';
    case 'squat': return std(14, 11, 34, 38, 50, 6);
    case 'round': return 'M26 10 V40 C14 44 10 58 10 78 C10 104 20 116 30 116 C40 116 50 104 50 78 C50 58 46 44 34 40 V10 Z';
    case 'flask': return std(8, 10, 30, 30, 52, 6);
    case 'champagne': return std(4, 9, 28, 30, 58, 5);
    case 'wine': return std(4, 8, 25, 38, 50, 3);
    case 'beer': return std(10, 7, 23, 38, 62, 3);
    case 'soju': return std(26, 7, 22, 46, 64, 3);
    case 'can': return 'M16 40 Q16 36 20 35 H40 Q44 36 44 40 V112 Q44 116 40 116 H20 Q16 116 16 112 Z';
  }
}
