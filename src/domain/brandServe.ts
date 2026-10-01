import { ALCOHOL_PRODUCTS, ALCOHOL_TYPE_LABELS } from './bottleCatalog';
import { INGREDIENTS, RECIPES } from './catalog';
import type { AlcoholProduct, Customer, Recipe, RecipeItem } from './types';
import { foldText as norm } from './text';

// Brand-call orders: the only time a bar guest names a brand is for a simple serve of one spirit
// (“Jack Daniel’s on the rocks”, “Tanqueray and tonic”). Cocktails are always ordered without brands.
// The drink is poured from the bar's ingredient stock, but the brand must be on the shelf (in bottle stock).

export type ServeStyle = 'neat' | 'rocks' | 'shot' | 'with-cola' | 'with-tonic' | 'with-soda' | 'with-ginger' | 'with-cranberry';
export interface ServeRequest { productId: string; style: ServeStyle; substitutedFrom?: string; }

const MIXER: Partial<Record<ServeStyle, { id: string; name: string }>> = {
  'with-cola': { id: 'cola', name: 'cola' }, 'with-tonic': { id: 'tonic', name: 'tonic' }, 'with-soda': { id: 'soda', name: 'soda' },
  'with-ginger': { id: 'ginger-beer', name: 'ginger beer' }, 'with-cranberry': { id: 'cranberry-juice', name: 'cranberry' }
};

const STYLES_BY_TYPE: Partial<Record<AlcoholProduct['type'], ServeStyle[]>> = {
  whiskey: ['rocks', 'neat', 'with-cola', 'with-ginger', 'with-soda'], bourbon: ['rocks', 'neat', 'with-cola', 'with-ginger'],
  gin: ['with-tonic', 'with-soda'], vodka: ['with-tonic', 'with-cranberry', 'with-soda', 'rocks'], rum: ['with-cola', 'with-ginger', 'rocks'],
  tequila: ['shot', 'rocks'], 'herbal-liqueur': ['shot', 'rocks'], liqueur: ['rocks'], 'specialty-liqueur': ['rocks'],
  aperitif: ['with-soda', 'rocks'], vermouth: ['rocks']
};

// A brand that shares its name with a cocktail (“Martini”) is called by its full product name, so
// “Martini Bianco on the rocks” is never mistaken for an order of the Martini cocktail.
const COCKTAIL_NAMES = new Set(RECIPES.map((recipe) => recipe.name.toLowerCase()));
const brandOf = (product: AlcoholProduct) => COCKTAIL_NAMES.has(product.brand.toLowerCase()) ? product.name : product.brand;
const spiritOf = (product: AlcoholProduct) => INGREDIENTS.find((item) => item.id === product.ingredientId && item.unit === 'ml');

// Shop bottles that can be poured as a single serve.
// Bottles that are not bar pours of their linked ingredient (a cognac is not a whiskey, a beer is not mixed).
const NOT_A_POUR = new Set<AlcoholProduct['type']>(['cognac', 'brandy', 'sambuca', 'port-wine', 'beer', 'non-alcoholic-beer', 'cider', 'soju', 'sake', 'sangria', 'fruit-wine', 'infusion']);
export function pourableBrand(product: AlcoholProduct) {
  return !NOT_A_POUR.has(product.type) && !!spiritOf(product);
}

export function servableProducts() {
  return ALCOHOL_PRODUCTS.filter((product) => spiritOf(product) && STYLES_BY_TYPE[product.type]?.length);
}
export function stylesFor(product: AlcoholProduct) { return STYLES_BY_TYPE[product.type] ?? ['rocks']; }

export function serveName(request: ServeRequest) {
  const product = ALCOHOL_PRODUCTS.find((item) => item.id === request.productId)!;
  const brand = brandOf(product);
  switch (request.style) {
    case 'neat': return `${brand}, neat`;
    case 'rocks': return `${brand} on the rocks`;
    case 'shot': return `a shot of ${brand}`;
    default: return `${brand} and ${MIXER[request.style]!.name}`;
  }
}

export function serveRequestText(request: ServeRequest) {
  const name = serveName(request);
  return `${name.charAt(0).toUpperCase()}${name.slice(1)}, please.`;
}

export function serveItems(request: ServeRequest): RecipeItem[] {
  const product = ALCOHOL_PRODUCTS.find((item) => item.id === request.productId)!;
  const spirit = product.ingredientId;
  switch (request.style) {
    case 'neat': return [{ ingredientId: spirit, amount: 50 }];
    case 'rocks': return [{ ingredientId: spirit, amount: 50 }, { ingredientId: 'ice', amount: 3 }, ...(product.type === 'aperitif' || product.type === 'vermouth' ? [{ ingredientId: 'orange', amount: 1 }] : [])];
    case 'shot': return [{ ingredientId: spirit, amount: 40 }, ...(product.type === 'tequila' ? [{ ingredientId: 'salt', amount: 1 }, { ingredientId: 'lime-wedge', amount: 1 }] : [])];
    default: {
      const mixer = MIXER[request.style]!;
      const lime = request.style === 'with-tonic' || (request.style === 'with-cola' && product.type === 'rum');
      return [{ ingredientId: spirit, amount: 50 }, { ingredientId: mixer.id, amount: 120 }, { ingredientId: 'ice', amount: 4 }, ...(lime ? [{ ingredientId: 'lime-wedge', amount: 1 }] : [])];
    }
  }
}

// Bar price of one serve: a 50 ml pour at bar margin, plus the mixer.
export function servePrice(request: ServeRequest) {
  const product = ALCOHOL_PRODUCTS.find((item) => item.id === request.productId)!;
  const pour = request.style === 'shot' ? 40 : 50;
  return Math.round((product.price * pour / product.volumeMl * 2.8 + (MIXER[request.style] ? 1.5 : 0)) * 2) / 2;
}

// A serve behaves like a tiny recipe, so the order station, judging and payment work unchanged.
export function serveRecipe(request: ServeRequest): Recipe {
  const product = ALCOHOL_PRODUCTS.find((item) => item.id === request.productId)!;
  const name = serveName(request);
  const items = serveItems(request);
  const method = request.style === 'neat' ? ['Pour 50 ml into a rocks glass, no ice.', 'Serve with a glass of water on the side if the guest likes.']
    : request.style === 'rocks' ? ['Fill a rocks glass with ice.', 'Pour 50 ml over the ice.']
      : request.style === 'shot' ? ['Pour 40 ml into a shot glass.', ...(product.type === 'tequila' ? ['Serve with salt and a lime wedge.'] : ['Serve ice-cold.'])]
        : ['Fill a highball glass with ice.', 'Pour 50 ml of the spirit.', `Top with ${MIXER[request.style]!.name} and stir gently once.`];
  return {
    id: `serve-${request.productId}-${request.style}`, name: name.charAt(0).toUpperCase() + name.slice(1), price: servePrice(request), needsShake: false, category: 'classic',
    origin: product.origin, story: product.description, tastingNotes: product.tastes, occasions: ['Brand call'], method, ingredients: items
  };
}

export function makeServeRequest(random = Math.random): ServeRequest {
  const products = servableProducts();
  const product = products[Math.floor(random() * products.length)]!;
  const styles = stylesFor(product);
  return { productId: product.id, style: styles[Math.floor(random() * styles.length)]! };
}

// Same type of spirit on the shelf: good substitutes when the requested brand is missing.
export function substitutesFor(request: ServeRequest, onShelf: (productId: string) => boolean) {
  const wanted = ALCOHOL_PRODUCTS.find((item) => item.id === request.productId)!;
  return servableProducts().filter((item) => item.id !== wanted.id && item.ingredientId === wanted.ingredientId && onShelf(item.id));
}

function brandsMentioned(text: string) {
  const haystack = ` ${norm(text)} `;
  return [...ALCOHOL_PRODUCTS]
    .sort((a, b) => b.brand.length - a.brand.length)
    .filter((item) => haystack.includes(` ${norm(item.brand)} `));
}

export interface ServeReply { text: string; expression: 'smile' | 'happy' | 'very-happy' | 'thinking' | 'confused' | 'disappointed' | 'neutral'; switchTo?: string; }

// The guest's answers during a brand-call order. Returns undefined for sentences that are not about the serve.
export function replyToServe(text: string, customer: Customer, onShelf: (productId: string) => boolean): ServeReply | undefined {
  const request = customer.serveRequest;
  if (!request) return undefined;
  const wanted = ALCOHOL_PRODUCTS.find((item) => item.id === request.productId)!;
  const lower = text.toLowerCase();
  // A substitute offer normally repeats the unavailable brand before naming the
  // alternative. Prefer the other mentioned brand instead of stopping at the
  // first match (for example, "No Jack Daniel's. Would you like Jameson?").
  const mentioned = brandsMentioned(text).find((item) => item.id !== wanted.id);
  const saysMissing = /\b(don'?t|do not|no longer|not) have\b|\bout of stock\b|\bsold out\b|\bno \w+ (today|tonight)\b|\brun out\b/.test(lower.replace(/’/g, "'"));

  if (mentioned && mentioned.brand !== wanted.brand) {
    if (mentioned.ingredientId !== wanted.ingredientId) return { text: `No, thank you. I would like ${ALCOHOL_TYPE_LABELS[wanted.type].toLowerCase()}, please.`, expression: 'disappointed' };
    if (!onShelf(mentioned.id)) return { text: `Do you really have ${mentioned.brand}? I cannot see it on the shelf.`, expression: 'confused' };
    return { text: `${mentioned.brand} is fine, thank you!`, expression: 'smile', switchTo: mentioned.id };
  }
  if (saysMissing) {
    const options = substitutesFor(request, onShelf);
    return { text: options.length ? `Oh, that is a pity. What else do you have?` : 'Oh no. Then maybe something else from the menu.', expression: 'disappointed' };
  }
  if (/\b(ice|rocks)\b/.test(lower)) {
    return { text: request.style === 'neat' ? 'No ice, please — neat.' : request.style === 'shot' ? 'No ice, just a cold shot.' : 'Yes, with ice, please.', expression: 'smile' };
  }
  if (/\bneat\b/.test(lower)) return { text: request.style === 'neat' ? 'Yes, neat, please.' : request.style === 'rocks' ? 'No, on the rocks, please.' : `No, ${serveName(request)}, please.`, expression: 'smile' };
  if (/\b(lime|lemon|slice)\b/.test(lower)) {
    const lime = serveItems(request).some((item) => item.ingredientId === 'lime-wedge');
    return { text: lime ? 'Yes, a slice of lime, please.' : 'No, thank you.', expression: 'smile' };
  }
  if (/\b(double|single|how much|large|small)\b/.test(lower)) return { text: 'Just a single, please.', expression: 'smile' };
  if (/\b(tonic|cola|soda|ginger|cranberry|mixer|with what)\b/.test(lower)) {
    const mixer = MIXER[request.style];
    return { text: mixer ? `With ${mixer.name}, please.` : 'No mixer, thank you.', expression: 'smile' };
  }
  if (/\b(which|what) (brand|one)\b|\bany preference\b/.test(lower)) return { text: `${serveRequestText(request)}`, expression: 'smile' };
  return undefined;
}

// Word-bank / idea phrases for a brand-call order.
export function serveTemplates(request: ServeRequest, onShelf: (productId: string) => boolean) {
  const wanted = ALCOHOL_PRODUCTS.find((item) => item.id === request.productId)!;
  const texts: string[] = [];
  if (!onShelf(wanted.id)) {
    const alternative = substitutesFor(request, onShelf)[0];
    if (alternative) texts.push(`Sorry, we don’t have ${wanted.brand}. Would you like ${alternative.brand} instead?`);
  }
  if (request.style === 'rocks' || request.style === 'neat') texts.push('Would you like it neat or on the rocks?');
  if (MIXER[request.style]) texts.push('Would you like a slice of lime?');
  texts.push('Would you like a single or a double?');
  return texts;
}
