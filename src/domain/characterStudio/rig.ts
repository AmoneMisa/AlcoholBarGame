/** Canonical prototype geometry. Never adapt this rig to fit an asset. */
function freeze<T extends object>(value: T): Readonly<T> {
  Object.values(value).forEach(item => { if (item && typeof item === 'object') freeze(item); });
  return Object.freeze(value);
}
export const RIG = freeze({
  id: 'atelier-adult-01', revision: 1, status: 'prototype-awaiting-art-approval',
  canvas: { width: 600, height: 1000 },
  camera: { projection: 'orthographic', view: 'front', scale: 1 },
  lighting: 'upper-left, soft key, warm ambient',
  anchors: {
    head: [300, 150], eyeLeft: [274, 151], eyeRight: [326, 151],
    browLeft: [274, 135], browRight: [326, 135], nose: [300, 174], mouth: [300, 192],
    neck: [300, 233], shoulderLeft: [240, 256], shoulderRight: [360, 256],
    waist: [300, 405], hip: [300, 490], handLeft: [190, 545], handRight: [410, 545],
    earLeft: [248, 169], earRight: [352, 169], crown: [300, 94], feet: [300, 943],
  },
  pivots: { torso: [300, 405], hair: [300, 115], fabric: [300, 405], accessory: [300, 233] },
  layers: ['rearAccessories', 'hairBack', 'rearClothing', 'body', 'face', 'eyes', 'brows', 'nose', 'mouth', 'makeup', 'clothing', 'clothingOverlay', 'hairFront', 'accessories', 'foreground'],
} as const);
export type Layer = typeof RIG.layers[number];
export const MAN_RIG = freeze({
  ...RIG,
  id: 'atelier-adult-man-01',
  anchors: {
    head: [300, 150], eyeLeft: [273, 151], eyeRight: [327, 151],
    browLeft: [273, 133], browRight: [327, 133], nose: [300, 177], mouth: [300, 196],
    neck: [300, 236], shoulderLeft: [223, 256], shoulderRight: [377, 256],
    waist: [300, 422], hip: [300, 492], handLeft: [176, 557], handRight: [424, 557],
    earLeft: [246, 166], earRight: [354, 166], crown: [300, 89], feet: [300, 943],
  },
  pivots: { torso: [300, 422], hair: [300, 112], fabric: [300, 422], accessory: [300, 236] },
} as const);
export const RIGS = freeze({ woman: RIG, man: MAN_RIG });
export type ModelKind = keyof typeof RIGS;
export interface Look {
  eyes: 'almond' | 'round' | 'soft'; brows: 'arched' | 'straight' | 'gentle';
  mouth: 'neutral' | 'smile' | 'full'; hair: 'cascade' | 'bob' | 'updo' | 'swept' | 'cropped' | 'tied';
  outfit: 'evening' | 'tailored' | 'formal' | 'casual'; accessory: 'none' | 'pearls' | 'moon' | 'chain' | 'brooch';
  nose: 'soft' | 'defined'; makeup: 'none' | 'blush' | 'freckles';
  skin: string; hairColor: string; iris: string; lips: string;
  primary: string; secondary: string; trim: string;
}
export const DEFAULT_LOOK: Look = { eyes: 'almond', brows: 'arched', mouth: 'neutral', hair: 'cascade', outfit: 'evening', accessory: 'moon', nose: 'soft', makeup: 'blush', skin: '#e6b9a2', hairColor: '#493039', iris: '#6e9386', lips: '#bd737d', primary: '#315a61', secondary: '#d5b78c', trim: '#dec18a' };
export const OPTIONS = {
  eyes: ['almond', 'round', 'soft'], brows: ['arched', 'straight', 'gentle'],
  mouth: ['neutral', 'smile', 'full'], hair: ['cascade', 'bob', 'updo'],
  outfit: ['evening', 'tailored'], accessory: ['none', 'pearls', 'moon'],
  nose: ['soft', 'defined'], makeup: ['none', 'blush', 'freckles'],
} as const;
export const MAN_OPTIONS = {
  eyes: ['almond', 'round', 'soft'], brows: ['arched', 'straight', 'gentle'],
  mouth: ['neutral', 'smile', 'full'], hair: ['swept', 'cropped', 'tied'],
  outfit: ['formal', 'casual'], accessory: ['none', 'chain', 'brooch'],
  nose: ['soft', 'defined'], makeup: ['none', 'blush', 'freckles'],
} as const;
export const OPTIONS_BY_MODEL = freeze({ woman: OPTIONS, man: MAN_OPTIONS });
export const DEFAULTS = freeze({
  woman: DEFAULT_LOOK,
  man: { ...DEFAULT_LOOK, brows: 'straight', nose: 'defined', mouth: 'neutral', hair: 'swept', outfit: 'formal', accessory: 'chain', makeup: 'none', hairColor: '#3b3030', lips: '#aa7770', primary: '#303f50', secondary: '#e6dbc6' } as Look,
});
export const HAIR_COLORS = ['#493039', '#ae7950', '#c8bfaf'];
export function validateLook(input: unknown, model: ModelKind = 'woman'): input is Look {
  if (!input || typeof input !== 'object') return false;
  const candidate = input as Record<string, unknown>;
  const options = OPTIONS_BY_MODEL[model];
  if (!options) return false;
  return Object.entries(DEFAULT_LOOK).every(([key]) => Object.hasOwn(options, key)
    ? (options[key as keyof typeof OPTIONS] as readonly unknown[]).includes(candidate[key])
    : typeof candidate[key] === 'string' && /^#[0-9a-f]{6}$/i.test(candidate[key] as string));
}
/** Never trust a saved model label alone: the rig ID, revision and options must agree. */
export function parseSavedLook(input: unknown): { model: ModelKind; look: Look } {
  if (!input || typeof input !== 'object') throw new Error('Invalid saved look');
  const value = input as Record<string, unknown>;
  const model = (Object.keys(RIGS) as ModelKind[]).find(key => RIGS[key].id === value.rig);
  if (!model || value.revision !== RIGS[model].revision || !validateLook(value.look, model)) throw new Error('Incompatible rig or look');
  // Copy only known keys. Unknown imported fields never enter reactive state.
  const look = Object.fromEntries(Object.keys(DEFAULT_LOOK).map(key => [key, (value.look as unknown as Record<string, unknown>)[key]])) as unknown as Look;
  return { model, look };
}
export function serializeLook(model: ModelKind, look: Look) {
  if (!validateLook(look, model)) throw new Error('Incompatible look');
  return { rig: RIGS[model].id, revision: RIGS[model].revision, look: { ...look } };
}
