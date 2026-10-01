import { INGREDIENTS, RECIPES } from '../../domain/catalog';
import { buildProfile } from '../../domain/conversation/customerTalk';
import type { Recipe } from '../../domain/types';
import { COCKTAIL_GUIDES, type CocktailGuide } from './cocktails';
import { HISTORY_NOTES_A, type HistoryNote } from './historyNotesA';
import { HISTORY_NOTES_B } from './historyNotesB';
import { HISTORY_NOTES_C } from './historyNotesC';
import { ingredientName as nameOf } from '../../domain/catalog';

// Every recipe gets a complete guide: hand-written where it exists, otherwise built from the recipe data
// plus a hand-written history note. The recipe card says exactly what to do with every ingredient.

const HISTORY: Record<string, HistoryNote> = { ...HISTORY_NOTES_A, ...HISTORY_NOTES_B, ...HISTORY_NOTES_C };
const FIZZY = new Set(['soda', 'tonic', 'cola', 'ginger-beer', 'grapefruit-soda', 'sparkling-wine', 'alcohol-free-beer']);
const DECORATION = new Set(['lime-wedge', 'orange', 'pineapple-wedge']);
const lower = (id: string) => nameOf(id).toLowerCase();
const list = (items: string[]) => items.length <= 1 ? items.join('') : `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;
const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

export type Technique = CocktailGuide['preparation']['technique'];
export function techniqueOf(recipe: Recipe): Technique {
  const ids = recipe.ingredients.map((part) => part.ingredientId);
  if (recipe.needsShake) return 'shaken';
  if (ids.some((id) => FIZZY.has(id)) || ids.includes('mint')) return 'built';
  return 'stirred';
}

const liquidVolume = (recipe: Recipe) => recipe.ingredients.filter((part) => INGREDIENTS.find((item) => item.id === part.ingredientId)?.unit === 'ml').reduce((sum, part) => sum + part.amount, 0);
const has = (recipe: Recipe, id: string) => recipe.ingredients.some((part) => part.ingredientId === id);
const isJulep = (recipe: Recipe) => techniqueOf(recipe) === 'built' && has(recipe, 'mint') && !recipe.ingredients.some((part) => FIZZY.has(part.ingredientId));

function serveStyle(recipe: Recipe) {
  const technique = techniqueOf(recipe);
  const fizzy = recipe.ingredients.some((part) => FIZZY.has(part.ingredientId));
  const onlyWine = fizzy && recipe.ingredients.every((part) => !FIZZY.has(part.ingredientId) || part.ingredientId === 'sparkling-wine');
  if (technique === 'built') {
    if (isJulep(recipe)) return { glass: 'Julep cup or rocks glass', ice: 'Crushed ice, packed high', up: false };
    if (has(recipe, 'sparkling-wine')) return { glass: 'Large wine glass', ice: 'Fill the glass with ice cubes', up: false };
    return { glass: 'Tall highball glass', ice: 'Fill the glass with ice cubes', up: false };
  }
  if (technique === 'stirred') {
    const up = has(recipe, 'vermouth') && !has(recipe, 'bitter-aperitif') && !has(recipe, 'coffee-liqueur');
    return up ? { glass: 'Chilled coupe or martini glass', ice: 'Stirred with ice, served without ice', up: true } : { glass: 'Rocks glass', ice: 'One large ice cube', up: false };
  }
  if (fizzy && onlyWine) return { glass: 'Chilled coupe or flute', ice: 'Shaken with ice, served without ice', up: true };
  if (fizzy || liquidVolume(recipe) > 150) return { glass: 'Tall glass', ice: 'Shaken with ice, poured over fresh ice', up: false };
  return { glass: 'Chilled coupe', ice: 'Shaken with ice, served without ice (“straight up”)', up: true };
}

function garnishOf(recipe: Recipe) {
  const pieces = recipe.ingredients.filter((part) => DECORATION.has(part.ingredientId) || part.ingredientId === 'mint').map((part) => part.ingredientId === 'mint' ? 'a mint sprig' : part.ingredientId === 'orange' ? 'an orange peel or slice' : `a ${lower(part.ingredientId).replace('fresh ', '')}`);
  if (pieces.length) return capitalize(list(pieces));
  if (has(recipe, 'coffee-liqueur')) return 'Three coffee beans';
  if (has(recipe, 'lime-juice')) return 'A lime wheel';
  if (has(recipe, 'lemon-juice')) return 'A lemon twist';
  return 'An orange peel';
}

// ---- Recipe card: amount + ingredient + exactly what to do, in order ----
export interface CardLine { ingredientId?: string; amount: string; ingredient: string; action: string; role: 'prepare' | 'pour' | 'ice' | 'mix' | 'top' | 'garnish'; }

function ounces(ml: number) {
  const oz = Math.round(ml / 30 * 4) / 4;
  const whole = Math.floor(oz);
  const fraction = ({ 0: '', 0.25: '¼', 0.5: '½', 0.75: '¾' } as Record<number, string>)[oz - whole] ?? '';
  return `${whole || ''}${fraction || (whole ? '' : '0')} oz`;
}
function amountLabel(id: string, amount: number) {
  const unit = INGREDIENTS.find((item) => item.id === id)?.unit;
  if (unit === 'ml') return `${amount} ml (${ounces(amount)})`;
  if (id === 'ice') return `${amount} cubes`;
  if (id === 'mint') return `${amount} leaves`;
  if (id === 'salt') return 'half the rim';
  if (id === 'orange') return amount === 1 ? '1 peel or slice' : `${amount} slices`;
  return amount === 1 ? '1 wedge' : `${amount} wedges`;
}

export function recipeCard(recipe: Recipe): { technique: Technique; lines: CardLine[] } {
  const technique = techniqueOf(recipe);
  const style = serveStyle(recipe);
  const parts = recipe.ingredients;
  const line = (id: string, action: string, role: CardLine['role']): CardLine => ({ ingredientId: id, amount: amountLabel(id, parts.find((part) => part.ingredientId === id)!.amount), ingredient: nameOf(id), action, role });
  const liquids = parts.filter((part) => INGREDIENTS.find((item) => item.id === part.ingredientId)?.unit === 'ml' && !FIZZY.has(part.ingredientId));
  const fizz = parts.filter((part) => FIZZY.has(part.ingredientId));
  const lines: CardLine[] = [];

  if (has(recipe, 'salt')) lines.push(line('salt', 'Before you start: wet half the rim with a lime wedge and dip it in salt, so the guest can choose salty or not.', 'prepare'));

  if (technique === 'built') {
    // With mint, sugar and citrus go in first and are pressed together with the leaves.
    const pressed = has(recipe, 'mint') ? liquids.filter((part) => ['sugar-syrup', 'lime-juice', 'lemon-juice'].includes(part.ingredientId)) : [];
    for (const part of pressed) lines.push(line(part.ingredientId, 'Pour into the empty glass first.', 'prepare'));
    if (has(recipe, 'mint')) lines.push(line('mint', `Add the leaves and press them gently ${pressed.length ? `with the ${list(pressed.map((part) => lower(part.ingredientId)))} ` : ''}3–4 times to release the aroma. Only press — torn mint tastes bitter.`, 'prepare'));
    if (has(recipe, 'ice')) lines.push(line('ice', isJulep(recipe) ? 'Fill the glass with crushed ice, packed high.' : 'Fill the glass with ice.', 'ice'));
    for (const part of liquids.filter((item) => !pressed.includes(item))) lines.push(line(part.ingredientId, 'Pour into the glass over the ice.', 'pour'));
    for (const part of fizz) lines.push(line(part.ingredientId, `Top up slowly at the end${part.ingredientId === 'sparkling-wine' ? ', pouring down the side of the glass' : ''}. Never shake it — the bubbles would disappear.`, 'top'));
    lines.push({ amount: '', ingredient: 'Bar spoon', action: fizz.length ? 'Stir gently once or twice from the bottom so everything mixes but the bubbles stay.' : 'Stir until the outside of the glass is frosty and cold, then top with a little more crushed ice.', role: 'mix' });
  } else if (technique === 'shaken') {
    for (const part of liquids) lines.push(line(part.ingredientId, 'Pour into the shaker.', 'pour'));
    if (has(recipe, 'mint')) lines.push(line('mint', 'Add to the shaker. Shaking releases the aroma; strain carefully so no leaves go into the glass.', 'pour'));
    if (has(recipe, 'ice')) lines.push(line('ice', `Fill the shaker with ice, close it and shake hard for 10–12 seconds until the shaker is very cold.${style.up ? '' : ' Put fresh ice in the serving glass.'}`, 'ice'));
    lines.push({ amount: '', ingredient: 'Strainer', action: `Strain into the ${style.glass.toLowerCase()}.`, role: 'mix' });
    for (const part of fizz) lines.push(line(part.ingredientId, 'Top up in the glass after straining. Never put it in the shaker.', 'top'));
  } else {
    for (const part of liquids) lines.push(line(part.ingredientId, 'Pour into the mixing glass.', 'pour'));
    if (has(recipe, 'ice')) lines.push(line('ice', `Add ice to the mixing glass and stir for 20–30 seconds until very cold, then strain${style.up ? ' into the chilled glass (no ice)' : ' over one large ice cube in the glass'}.`, 'ice'));
  }

  for (const part of parts.filter((item) => DECORATION.has(item.ingredientId))) {
    const action = part.ingredientId === 'orange'
      ? 'Garnish: squeeze the peel over the drink so the oils fall on the surface, then place it on the rim or in the glass.'
      : `Garnish: place it on the rim${part.ingredientId === 'lime-wedge' ? '. The guest can squeeze it for more sourness' : ''}.`;
    lines.push(line(part.ingredientId, action, 'garnish'));
  }
  if (!parts.some((item) => DECORATION.has(item.ingredientId)) && !(technique !== 'shaken' && has(recipe, 'mint'))) {
    lines.push({ amount: '', ingredient: garnishOf(recipe), action: 'Garnish and serve immediately, while it is cold.', role: 'garnish' });
  }
  return { technique, lines };
}

const TECHNIQUE_WHY: Record<Technique, (recipe: Recipe) => string> = {
  shaken: (recipe) => {
    const why = recipe.ingredients.filter((part) => ['lime-juice', 'lemon-juice', 'pineapple-juice', 'cranberry-juice', 'coconut-cream'].includes(part.ingredientId)).map((part) => lower(part.ingredientId));
    const fizz = recipe.ingredients.filter((part) => FIZZY.has(part.ingredientId)).map((part) => lower(part.ingredientId));
    return `Shaken because it contains ${why.length ? list(why) : 'ingredients of different thickness'}: shaking mixes them fully, chills the drink fast and adds a little air for a lively texture.${fizz.length ? ` The ${list(fizz)} is added after shaking, so the bubbles survive.` : ''}`;
  },
  blended: () => 'Blended with ice for a frozen, slushy texture.',
  stirred: () => 'Stirred because it contains only spirits, wines and liqueurs — no juice. Stirring chills and dilutes it gently and keeps it clear and silky; shaking would make it cloudy and watery.',
  built: (recipe) => {
    const fizz = recipe.ingredients.filter((part) => FIZZY.has(part.ingredientId)).map((part) => lower(part.ingredientId));
    return fizz.length ? `Built directly in the glass because ${list(fizz)} is added at the end. Shaking fizzy drinks would destroy the bubbles.` : 'Built directly in the glass: the mint is pressed in the glass and the drink slowly changes as the crushed ice melts.';
  }
};

function similar(recipe: Recipe) {
  const mine = new Set(recipe.ingredients.map((part) => part.ingredientId).filter((id) => id !== 'ice'));
  return RECIPES.filter((other) => other.id !== recipe.id).map((other) => {
    const theirs = new Set(other.ingredients.map((part) => part.ingredientId).filter((id) => id !== 'ice'));
    const shared = [...mine].filter((id) => theirs.has(id));
    return { other, shared, mineOnly: [...mine].filter((id) => !theirs.has(id)), theirsOnly: [...theirs].filter((id) => !mine.has(id)), score: shared.length / new Set([...mine, ...theirs]).size };
  }).sort((a, b) => b.score - a.score).slice(0, 2);
}

const STRENGTH_TEXT = { light: 'Light and easy to drink.', medium: 'Medium strength.', strong: 'Strong — made to be sipped slowly.' } as const;
const TRAIT_REASON: Record<string, string> = {
  sweet: 'The guest likes sweet drinks', sour: 'The guest likes sour, fresh flavours', bitter: 'The guest enjoys bitter, herbal flavours', creamy: 'The guest wants something creamy, like a dessert',
  sparkling: 'The guest wants something with bubbles', coffee: 'The guest loves coffee', spicy: 'The guest likes a little spice', fruity: 'The guest likes fruity drinks', dry: 'The guest prefers dry, not sweet drinks'
};

export function guideFor(recipe: Recipe): CocktailGuide {
  const written = COCKTAIL_GUIDES[recipe.id];
  if (written) return written;
  const note = HISTORY[recipe.id];
  const profile = buildProfile(recipe);
  const technique = techniqueOf(recipe);
  const style = serveStyle(recipe);
  const card = recipeCard(recipe);
  const reasons = Object.keys(TRAIT_REASON).filter((trait) => profile.traits.has(trait as never)).slice(0, 2).map((trait) => TRAIT_REASON[trait]!);
  const [place, period] = recipe.origin.split('·').map((item) => item.trim());
  return {
    id: recipe.id,
    summary: recipe.story,
    timeline: note?.timeline ?? [{ when: period ?? 'Origin', what: `The drink appears in ${place}.` }],
    history: note ? `${note.history}${note.realRecipe ? ` (${note.realRecipe})` : ''}` : recipe.story,
    preparation: {
      technique, why: TECHNIQUE_WHY[technique](recipe), glass: style.glass, ice: style.ice, garnish: garnishOf(recipe),
      steps: card.lines.map((line) => `${line.amount ? `${line.ingredient} (${line.amount}): ` : ''}${line.action}`)
    },
    taste: `${capitalize(recipe.tastingNotes.join(', '))}. ${STRENGTH_TEXT[profile.strength]}`,
    strength: profile.strength,
    chooseWhen: [...reasons, ...recipe.occasions.map((occasion) => `Good for: ${occasion.toLowerCase()}`)],
    compare: similar(recipe).map(({ other, shared, mineOnly, theirsOnly }) => ({
      other: other.name,
      difference: `${shared.length ? `Both use ${list(shared.slice(0, 3).map(lower))}. ` : ''}${theirsOnly.length ? `The ${other.name} adds ${list(theirsOnly.slice(0, 2).map(lower))}` : `The ${other.name} is simpler`}${mineOnly.length ? `, and has no ${list(mineOnly.slice(0, 2).map(lower))}` : ''}.`
    })),
    variations: note?.variations ?? [],
    funFact: note?.funFact ?? `Its origin: ${recipe.origin}.`
  };
}

export const hasHistory = (id: string) => !!COCKTAIL_GUIDES[id] || !!HISTORY[id];
