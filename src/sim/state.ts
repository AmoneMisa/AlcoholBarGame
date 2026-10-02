import { INGREDIENTS, RECIPES, REGIONS, STARTING_INVENTORY } from '../domain/catalog';
import { ALCOHOL_PRODUCTS } from '../domain/bottleCatalog';
import { cosmeticFor } from '../domain/cosmetics';
import { REFERENCE_COSTUME_IDS } from '../data/cosmetics/bartenderCostumes';
import { DEFAULT_BARS, INTERIORS, type BarProfile } from '../data/cosmetics/bars';
import { CHARACTER_ART, CUSTOMER_ART_BY_SLOT } from '../data/cosmetics/artCatalog';
import { generateCustomer } from '../domain/engine';
import { BOND_STEPS, COMPANIONS, COMPANION_START_LEVEL, KEEPSAKE_IDS, LEGACY_COMPANION_IDS, MAX_BOND, bondLevel, companionSlots, levelCapForGrade } from '../domain/companions';
import { MAX_LEVEL, levelFor, levelPerks, xpForLevel } from '../domain/progression';
import type { BottleInventoryItem, Customer, InventoryItem, RegionId } from '../domain/types';
import { buildProfile, shortWish, type CustomerReply, type Fact } from '../domain/conversation/customerTalk';
import type { BottleConversationFacts } from '../domain/conversation/bottleTalk';
import { ensureSocial, rollSocial } from '../domain/social/generate';
import { createLoot, normalizeLoot, type LootState } from '../domain/lootState';

// The complete, serializable game state of one player. The server owns it; the client only displays it
// (and, in offline practice mode, simulates it locally with the same rules).

export const BASIC_RECIPE_COUNT = 10;
export const DELIVERY_DAY_MS = 24 * 60 * 60 * 1000;
export type UnlockSource = 'starter' | 'shop' | 'special-client' | 'daily-gift' | 'daily-lesson' | 'friend-gift';
export interface ChatLine { id: number; speaker: 'customer' | 'bartender'; text: string; note?: string; ok?: boolean; }
// One conversation with one guest. Only what has been said is stored here — never the hidden order.
export interface Transcript { lines: ChatLine[]; facts: Fact[]; /** Drinks and bottles the guest already said no to: they are not suggested again. */ rejected?: string[]; bottleFacts: BottleConversationFacts; expression: CustomerReply['expression']; attempts: number; correct: number; perfectRewardClaimed?: boolean; }

export interface DeliveryOrder { id: string; supplier: string; barId: RegionId; dueAt: number; items: InventoryItem[]; total: number; }
export type PopularityBoost = { kind: 'no-cooldown'; until: number } | { kind: 'vip-run'; remaining: number };


export interface PlayerState {
  version: 1;
  // XP curve of this save (see migrateXpCurve); missing = the original, shallower curve.
  xpCurve?: number;
  regionId: RegionId;
  money: number;
  crystals: number;
  xp: number;
  streak: number;
  bars: Record<RegionId, BarProfile>;
  ownedBarIds: RegionId[];
  startingBarChosen: boolean;
  ownedInteriorIds: string[];
  ownedCosmeticIds: string[];
  cosmeticCopies: Record<string, number>;
  cosmeticRouletteKey: string;
  cosmeticRouletteResult: string;
  cosmeticGiftLog: { cosmeticId:string; recipient:string; at:number }[];
  knownRecipeIds: string[];
  recipeUnlockSources: Record<string, UnlockSource>;
  dailyGiftClaimedKey: string;
  loginStreak: number;
  dailyGiftResult: string;
  dailyLessonKey: string;
  dailyLessonCompletedIds: string[];
  learningStreak: number;
  lastLearningDayKey: string;
  dailyLessonResult: string;
  inventories: Record<RegionId, InventoryItem[]>;
  bottleInventories: Record<RegionId, BottleInventoryItem[]>;
  customers: Customer[];
  activeCustomerId: string;
  conversationCustomerId?: string;
  nextCustomerAt: number;
  vipCooldownUntil: number;
  lastClockAt: number;
  deliveryOrders: DeliveryOrder[];
  /** Level 5+: low stock is reordered automatically from the cheapest supplier. */
  autoSupply?: boolean;
  tradeLog: string[];
  languageStats: { sentences: number; correct: number };
  // The player profile: guests served (drinks and bottles) in all, per bar, and the achievements the player chose to show.
  served: number;
  servedByBar: Record<string, number>;
  featuredAchievements?: string[];
  // Correct sentences already rewarded per customer, so talking cannot be farmed for XP.
  rewardedSentences: Record<string, number>;
  // Haggling with a supplier's sales rep (see sim/trade.ts); one open negotiation at a time.
  negotiation?: import('./trade').Negotiation;
  // When each supplier last agreed a negotiated deal (a rep haggles once an hour).
  lastNegotiatedAt?: Record<string, number>;
  // Recipe mastery (1–5, see sim/recipes.ts) and duplicate cards used by mastery or friend gifts.
  recipeLevels?: Record<string, number>;
  recipeCopies?: Record<string, number>;
  popularity: number;
  // Equipment, materials, consumables, boxes, style-draw pity and prestige (see sim/loot.ts).
  loot: LootState;
  popularityBoost?: PopularityBoost;
  // Clean and dirty ashtrays: guests who smoke ask for one, and it must be cleaned after they leave.
  ashtrays?: { clean: number; dirty: number };
  // Bills guests could not pay and promised to pay later, and how many situations were solved well or badly.
  tabs?: { guest: string; amount: number; since: number }[];
  situationStats?: { solved: number; failed: number; neutral: number };
  // How many rules the bar has broken since the last inspection.
  ruleViolations?: number;
  // Delivery problems: what went wrong with arrived orders, lower-grade units inside the stock, and unusable goods.
  deliveryIssues?: import('./stockQuality').DeliveryIssue[];
  lowGrade?: Record<RegionId, Record<string, import('./stockQuality').LowGrade>>;
  quarantine?: import('./stockQuality').QuarantineItem[];
  // Events at this bar tonight (promotions, moods of the night), when the next one starts, and loyalty counts by guest look.
  barEvent?: import('./events').ActiveBarEvent;
  nextBarEventAt?: number;
  lastBarEventId?: string;
  loyalty?: Record<string, number>;
  // Guests who came since the last situation, and how many guests the next one is due after (10–12; never before the 4th).
  guestsSinceEvent?: number;
  // The guided tour: finished or skipped. Kept on the account, so it shows once, not once per device.
  tour?: 'done' | 'skipped';
  // Servers hired (up to four), when their work was last counted, and what they have earned in all.
  // The Circle: companions who joined, shards, keepsakes and who works where (see sim/companions.ts).
  companions?: import('./companions').CompanionState;
  staffByBar?: Record<string, { level: number }[]>;
  staffAtByBar?: Record<string, number>;
  staffEarned?: number;
  eventGap?: number;
  // Day of the last rewarded visit to each friend's bar.
  friendVisits?: Record<string, string>;
  friendLabels?: Record<string, string>;
  conversations: Record<string, Transcript>;
  message: string;
}

// A guest's name comes from their portrait, so names are unique and match the face. Special guests keep their story name.
export function withUniqueLook(customer: Customer, others: Customer[]) {
  const used = new Set(others.map((item) => item.characterId));
  if (!customer.characterId || used.has(customer.characterId)) customer.characterId = CUSTOMER_ART_BY_SLOT.find((id) => !used.has(id));
  if (!customer.specialRecipeRewardId) customer.name = CHARACTER_ART.find((art) => art.id === customer.characterId)?.name ?? customer.name;
  customer.wish = wishFor(customer);
  // A stable trait keeps the same guest consistent after save/reload. Smoking
  // guests get an ashtray in the scene; dialogue must never offer them an
  // incompatible “I don't smoke” identity answer.
  customer.smoker ??= [...customer.id].reduce((sum, char) => sum + char.charCodeAt(0), 0) % 7 === 0;
  return customer;
}

export function wishFor(customer: Customer) {
  if (customer.orderKind === 'bottle') return 'Some sealed bottles, please.';
  if (customer.orderKind === 'serve' || customer.specialRecipeRewardId || customer.signature) return customer.request;
  const recipe = RECIPES.find((item) => item.id === customer.orderRecipeId);
  return recipe ? shortWish(buildProfile(recipe)) : 'Something nice, please.';
}

// What the client may see: unrevealed orders are hidden, so the player has to find them out in English.
export function publicState(state: PlayerState): PlayerState {
  const view = structuredClone(state);
  // Facts a situation hides from the player (a banknote is fake, the guest really is right) start with an underscore.
  for (const customer of view.customers) {
    const event = customer.social?.event;
    if (event) event.data = Object.fromEntries(Object.entries(event.data).filter(([key]) => !key.startsWith('_')));
  }
  view.customers = view.customers.map((customer) => customer.orderRevealed ? customer : {
    ...customer, orderRecipeId: '', modifierId: undefined, bottleRequest: undefined, budget: 0, signature: undefined,
    wish: customer.wish ?? wishFor(customer), request: customer.wish ?? wishFor(customer)
  });
  return view;
}

// A new bar is stocked for about STARTER_SERVES orders across the starter recipes (a few levels), and no more:
// three of the biggest single pour of each ingredient at the least, so any starter drink can be made three times.
// Ingredients no starter recipe uses start empty and stay hidden until a recipe needs them.
export const STARTER_SERVES = 14;
// Demand varies with which drinks guests ask for: 60% slack on the average, and at least three of the biggest pour.
const STARTER_SAFETY = 1.6;
const STARTER_POURS = 3;
export function starterStock(recipeIds: readonly string[]) {
  const recipes = RECIPES.filter((recipe) => recipeIds.includes(recipe.id));
  const stock = new Map<string, number>();
  for (const item of INGREDIENTS) {
    const parts = recipes.flatMap((recipe) => recipe.ingredients.filter((part) => part.ingredientId === item.id).map((part) => part.amount));
    if (!parts.length) { stock.set(item.id, 0); continue; }
    const average = parts.reduce((sum, amount) => sum + amount, 0) / recipes.length;
    const wanted = Math.max(Math.ceil(average * STARTER_SERVES * STARTER_SAFETY), Math.max(...parts) * STARTER_POURS);
    stock.set(item.id, item.unit === 'ml' ? Math.ceil(wanted / 5) * 5 : wanted);
  }
  return stock;
}
const makeBarInventory = (stock: ReadonlyMap<string, number>) => STARTING_INVENTORY.map((item) => ({ ...item, amount: stock.get(item.ingredientId) ?? 0 }));

// A new player opens to a full row, so the bar feels alive and there is practice waiting right away.
export const STARTER_GUESTS = 5;

export function createInitialState(now = Date.now()): PlayerState {
  const starterGuests: Customer[] = [];
  // Starter guests pay the same level-1 rate as everyone who walks in later.
  const priceFactor = Number((REGIONS[0]!.marketFactor * levelPerks(1).pay).toFixed(4));
  for (let seat = 0; seat < STARTER_GUESTS; seat++) {
    const guest = withUniqueLook(generateCustomer(2, RECIPES.slice(0, BASIC_RECIPE_COUNT), .35, REGIONS[0]!.marketFactor), starterGuests);
    guest.priceFactor = priceFactor;
    // The first guests are always sober, so a new player's first conversations are the easy ones.
    guest.social = rollSocial(guest, now, Math.random, { arrivesDrunk: 0 });
    guest.social.staysFor = 0; // ...and each of them leaves after one drink; staying guests come later
    starterGuests.push(guest);
  }
  const firstGuest = starterGuests[0]!;
  const knownRecipeIds = RECIPES.slice(0, BASIC_RECIPE_COUNT).map((recipe) => recipe.id);
  const starting = starterStock(knownRecipeIds);
  return {
    version: 1,
    xpCurve: XP_CURVE_VERSION,
    regionId: 'new-york',
    money: 600,
    crystals: 0,
    xp: 0,
    streak: 0,
    bars: structuredClone(DEFAULT_BARS),
    ownedBarIds: ['new-york'],
    startingBarChosen: false,
    ownedInteriorIds: ['velvet'],
    ownedCosmeticIds: [],
    cosmeticCopies: {},
    cosmeticRouletteKey: '',
    cosmeticRouletteResult: 'Your daily style draw is ready.',
    cosmeticGiftLog: [],
    knownRecipeIds,
    recipeUnlockSources: Object.fromEntries(knownRecipeIds.map((id) => [id, 'starter'])),
    popularity: 0,
    loot: { ...createLoot(), boxes: { bronze: 1 } },
    dailyGiftClaimedKey: '',
    loginStreak: 0,
    dailyGiftResult: 'A new gift is available today.',
    dailyLessonKey: '',
    dailyLessonCompletedIds: [],
    learningStreak: 0,
    lastLearningDayKey: '',
    dailyLessonResult: 'Complete today’s three lessons to grow your learning streak.',
    inventories: Object.fromEntries(REGIONS.map((region) => [region.id, makeBarInventory(starting)])) as Record<RegionId, InventoryItem[]>,
    bottleInventories: Object.fromEntries(REGIONS.map((region, barIndex) => [region.id, ALCOHOL_PRODUCTS.map((product, productIndex) => ({
      productId: product.id, quantity: 1 + ((barIndex + productIndex * 2) % 4)
    }))])) as Record<RegionId, BottleInventoryItem[]>,
    customers: starterGuests,
    activeCustomerId: firstGuest.id,
    nextCustomerAt: 0,
    vipCooldownUntil: 0,
    lastClockAt: now,
    deliveryOrders: [],
    tradeLog: [],
    languageStats: { sentences: 0, correct: 0 },
    served: 0,
    servedByBar: {},
    rewardedSentences: {},
    conversations: {},
    message: 'Tap a customer to talk, find out what they want, then build the cocktail.'
  };
}

// JSON player snapshots are intentionally schema-light. Upgrade older snapshots in place whenever
// they are loaded so adding a currency never invalidates an existing account.
// The level curve was made steeper (about 700 served orders to level 50). A save on the old curve keeps its level and
// its progress inside that level, so nobody is demoted or locked out of unlocked features.
export const XP_CURVE_VERSION = 2;
const oldXpForLevel = (level: number) => { const steps = Math.max(0, Math.min(MAX_LEVEL, level) - 1); return 60 * steps + 10 * steps * (steps - 1); };
export function migrateXpCurve(state: Pick<PlayerState, 'xp' | 'xpCurve'>) {
  if (state.xpCurve === XP_CURVE_VERSION) return;
  state.xpCurve = XP_CURVE_VERSION;
  if (!Number.isFinite(state.xp) || state.xp <= 0) { state.xp = 0; return; }
  let level = 1;
  while (level < MAX_LEVEL && state.xp >= oldXpForLevel(level + 1)) level++;
  if (level >= MAX_LEVEL) { state.xp = xpForLevel(MAX_LEVEL); return; }
  const progress = (state.xp - oldXpForLevel(level)) / (60 + (level - 1) * 20);
  state.xp = Math.floor(xpForLevel(level) + progress * (xpForLevel(level + 1) - xpForLevel(level)));
}

export function normalizePlayerState(state: PlayerState) {
  migrateXpCurve(state);
  state.crystals = Number.isFinite(state.crystals) && state.crystals >= 0 ? Math.floor(state.crystals) : 0;
  state.dailyLessonKey = typeof state.dailyLessonKey === 'string' ? state.dailyLessonKey : '';
  state.dailyLessonCompletedIds = Array.isArray(state.dailyLessonCompletedIds) ? [...new Set(state.dailyLessonCompletedIds.filter((id) => typeof id === 'string'))] : [];
  state.learningStreak = Number.isFinite(state.learningStreak) ? Math.max(0, Math.floor(state.learningStreak)) : 0;
  state.lastLearningDayKey = typeof state.lastLearningDayKey === 'string' ? state.lastLearningDayKey : '';
  state.dailyLessonResult = typeof state.dailyLessonResult === 'string' ? state.dailyLessonResult : 'Complete today’s three lessons to grow your learning streak.';
  state.tradeLog = Array.isArray(state.tradeLog)
    ? state.tradeLog.filter((entry) => entry !== 'Each city bar now keeps its own stock.').slice(0, 40)
    : [];
  state.loot = normalizeLoot(state.loot, levelFor(state.xp));
  state.popularity = Number.isFinite(state.popularity) ? Math.max(0, Math.floor(state.popularity)) : 0;
  if (state.popularityBoost?.kind === 'no-cooldown') {
    if (!Number.isFinite(state.popularityBoost.until)) state.popularityBoost = undefined;
  } else if (state.popularityBoost?.kind === 'vip-run') {
    const remaining = Math.max(0, Math.floor(state.popularityBoost.remaining));
    state.popularityBoost = remaining ? { kind: 'vip-run', remaining } : undefined;
  } else state.popularityBoost = undefined;
  state.friendVisits = state.friendVisits && typeof state.friendVisits === 'object' ? state.friendVisits : {};
  state.friendLabels = state.friendLabels && typeof state.friendLabels === 'object' ? state.friendLabels : {};
  // Saves from before the profile existed: the lifetime serve counter is the best guess, all in the current bar.
  state.served = Number.isFinite(state.served) && state.served >= 0 ? Math.floor(state.served) : Math.floor(state.loot?.stats?.serves ?? 0);
  state.servedByBar = state.servedByBar && typeof state.servedByBar === 'object' ? Object.fromEntries(Object.entries(state.servedByBar).filter(([, count]) => Number.isFinite(count) && count > 0).map(([id, count]) => [id, Math.floor(count)])) : {};
  if (!Object.keys(state.servedByBar).length && state.served > 0) state.servedByBar = { [state.regionId]: state.served };
  state.featuredAchievements = Array.isArray(state.featuredAchievements) ? [...new Set(state.featuredAchievements.filter((id) => typeof id === 'string'))].slice(0, 4) : undefined;
  state.customers = Array.isArray(state.customers) ? state.customers : [];
  for (const customer of state.customers) {
    customer.smoker ??= [...customer.id].reduce((sum, char) => sum + char.charCodeAt(0), 0) % 7 === 0;
    ensureSocial(customer, 0);
  }
  state.deliveryIssues = Array.isArray(state.deliveryIssues) ? state.deliveryIssues.slice(0, 40) : [];
  state.quarantine = Array.isArray(state.quarantine) ? state.quarantine.slice(0, 40) : [];
  state.lowGrade = state.lowGrade && typeof state.lowGrade === 'object' ? state.lowGrade : ({} as NonNullable<PlayerState['lowGrade']>);
  const ashtrays = state.ashtrays;
  state.ashtrays = ashtrays && Number.isFinite(ashtrays.clean) && Number.isFinite(ashtrays.dirty)
    ? { clean: Math.max(0, Math.floor(ashtrays.clean)), dirty: Math.max(0, Math.floor(ashtrays.dirty)) } : { clean: 4, dirty: 0 };
  const validRegions = new Set(REGIONS.map((region) => region.id));
  state.ownedBarIds = Array.isArray(state.ownedBarIds)
    ? [...new Set(state.ownedBarIds.filter((id) => validRegions.has(id)))]
    : [validRegions.has(state.regionId) ? state.regionId : 'new-york'];
  if (!state.ownedBarIds.length) state.ownedBarIds = ['new-york'];
  // A short-lived release stored `false` for players who already had progress,
  // reopening onboarding on their next visit. Preserve onboarding only for a
  // genuinely untouched account; older/migrated accounts default to complete.
  const hasAccountProgress = state.xp > 0
    || state.loginStreak > 1
    || state.ownedBarIds.length > 1;
  state.startingBarChosen = typeof state.startingBarChosen === 'boolean'
    ? state.startingBarChosen || hasAccountProgress
    : true;
  if (!state.ownedBarIds.includes(state.regionId)) state.regionId = state.ownedBarIds[0]!;
  const validInteriors = new Set(INTERIORS.map((item) => item.id));
  state.ownedInteriorIds = Array.isArray(state.ownedInteriorIds)
    ? [...new Set(['velvet', ...state.ownedInteriorIds.filter((id) => validInteriors.has(id as never))])]
    : ['velvet'];
  state.ownedCosmeticIds = Array.isArray(state.ownedCosmeticIds) ? [...new Set(state.ownedCosmeticIds.filter((id) => typeof id === 'string'))] : [];
  state.cosmeticCopies = state.cosmeticCopies && typeof state.cosmeticCopies === 'object' ? state.cosmeticCopies : {};
  state.cosmeticRouletteKey = typeof state.cosmeticRouletteKey === 'string' ? state.cosmeticRouletteKey : '';
  state.cosmeticRouletteResult = typeof state.cosmeticRouletteResult === 'string' ? state.cosmeticRouletteResult : 'Your daily style draw is ready.';
  state.cosmeticGiftLog = Array.isArray(state.cosmeticGiftLog) ? state.cosmeticGiftLog.slice(0, 30) : [];
  // The training academy was removed: old saves drop its progress and any practice guest still at the bar.
  delete (state as { training?: unknown }).training;
  state.customers = state.customers.filter((guest) => !(guest as { training?: boolean }).training);
  if (state.tour !== 'done' && state.tour !== 'skipped') delete state.tour;
  state.companions = normalizeCompanions(state.companions);
  // Servers belong to a bar. Older saves had one team: it stays in the bar that was being managed.
  const legacy = state as unknown as { staff?: unknown; staffAt?: unknown };
  const teams: Record<string, { level: number }[]> = {};
  const source = (state.staffByBar && typeof state.staffByBar === 'object' ? state.staffByBar : Array.isArray(legacy.staff) ? { [state.regionId]: legacy.staff } : {}) as Record<string, unknown>;
  for (const region of REGIONS) {
    const team = source[region.id];
    if (Array.isArray(team) && team.length) teams[region.id] = team.slice(0, 4).map((member) => ({ level: Math.max(1, Math.min(5, Math.round(Number((member as { level?: number })?.level) || 1))) }));
  }
  state.staffByBar = teams;
  const times: Record<string, number> = {};
  const oldTimes = (state.staffAtByBar && typeof state.staffAtByBar === 'object' ? state.staffAtByBar : typeof legacy.staffAt === 'number' ? { [state.regionId]: legacy.staffAt } : {}) as Record<string, unknown>;
  for (const region of REGIONS) if (Number.isFinite(oldTimes[region.id])) times[region.id] = oldTimes[region.id] as number;
  state.staffAtByBar = times;
  delete legacy.staff; delete legacy.staffAt;
  state.bars ??= structuredClone(DEFAULT_BARS);
  for (const region of REGIONS) {
    const saved = state.bars[region.id] as Partial<BarProfile> | undefined;
    state.bars[region.id] = { ...structuredClone(DEFAULT_BARS[region.id]), ...saved };
    const bar = state.bars[region.id];
    const defaultInterior = DEFAULT_BARS[region.id].interior;
    // Locked city cards always preview that city's included interior. Opening a
    // bar grants this background; paid custom backgrounds stay player-owned.
    if (!state.ownedBarIds.includes(region.id)) bar.interior = defaultInterior;
    // `base` was an editor-only wooden mannequin. It must never be presented
    // as a wearable look, including for old local saves.
    if ((bar.bartender as string) === 'base') bar.bartender = 'vest';
    // A painted style that is now earned or bought stays with whoever is already wearing it.
    const worn = cosmeticFor('bartender', bar.bartender, bar.bartenderCharacter);
    if (worn?.character && !state.ownedCosmeticIds.includes(worn.id) && (REFERENCE_COSTUME_IDS as readonly string[]).includes(worn.value)) state.ownedCosmeticIds.push(worn.id);
    if (state.ownedBarIds.includes(region.id) && !state.ownedInteriorIds.includes(bar.interior)) {
      bar.interior = defaultInterior;
      if (!state.ownedInteriorIds.includes(defaultInterior)) state.ownedInteriorIds.push(defaultInterior);
    }
    if (['relaxed'].includes(bar.pose as string)) bar.pose = 'neutral';
    if (['hip'].includes(bar.pose as string)) bar.pose = 'confident';
    if (['lean','crossed'].includes(bar.pose as string)) bar.pose = 'working';
  }
  state.conversations ??= {};
  for (const transcript of Object.values(state.conversations)) {
    transcript.attempts = Number.isFinite(transcript.attempts) ? Math.max(0, Math.floor(transcript.attempts)) : transcript.lines.filter((line) => line.speaker === 'bartender').length;
    transcript.correct = Number.isFinite(transcript.correct) ? Math.max(0, Math.floor(transcript.correct)) : transcript.lines.filter((line) => line.speaker === 'bartender' && line.ok).length;
  }
  return state;
}

// Levels follow a rising XP curve (60, 130, 200… XP per level) — see domain/progression.ts.
export { levelFor } from '../domain/progression';

// The Circle in a save: only known people and keepsakes, whole non-negative numbers, and nobody in two bars.
function normalizeCompanions(input: unknown): import('./companions').CompanionState {
  const source = (input && typeof input === 'object' ? input : {}) as Partial<import('./companions').CompanionState>;
  const whole = (value: unknown, max: number) => Number.isFinite(value) && (value as number) > 0 ? Math.min(max, Math.floor(value as number)) : 0;
  const legacyId = (id: string) => Object.keys(LEGACY_COMPANION_IDS).find((old) => LEGACY_COMPANION_IDS[old] === id);
  const savedValue = <T>(record: Record<string, T> | undefined, id: string) => record?.[id] ?? record?.[legacyId(id) ?? ''];
  const owned: Record<string, number> = {};
  const shards: Record<string, number> = {};
  const keepsakes: Record<string, number> = {};
  for (const companion of COMPANIONS) {
    const points = savedValue(source.owned as Record<string, unknown> | undefined, companion.id);
    if (points !== undefined) owned[companion.id] = whole(points, BOND_STEPS[MAX_BOND - 1]!);
    else { const have = whole(savedValue(source.shards as Record<string, unknown> | undefined, companion.id), companion.shards); if (have) shards[companion.id] = have; }
  }
  for (const id of KEEPSAKE_IDS) { const have = whole((source.keepsakes as Record<string, unknown> | undefined)?.[id], 999); if (have) keepsakes[id] = have; }
  const placed = new Set<string>();
  const assigned: Record<string, string[]> = {};
  for (const region of REGIONS) {
    const list = (source.assigned as Record<string, unknown> | undefined)?.[region.id];
    assigned[region.id] = (Array.isArray(list) ? list : []).map((id) => typeof id === 'string' ? LEGACY_COMPANION_IDS[id] ?? id : '').filter((id): id is string => !!id && id in owned && !placed.has(id)).slice(0, companionSlots(MAX_LEVEL)).map((id) => { placed.add(id); return id; });
  }
  const visits = source.visits && typeof source.visits.day === 'string' && source.visits.counts && typeof source.visits.counts === 'object' ? { day: source.visits.day, counts: Object.fromEntries(Object.entries(source.visits.counts).map(([id, count]) => [LEGACY_COMPANION_IDS[id] ?? id, whole(count, 99)])) } : { day: '', counts: {} };
  const spotlights: Record<string, { until: number; ready: number }> = {};
  for (const id of Object.keys(owned)) {
    const saved = savedValue(source.spotlights as Record<string, { until?: unknown; ready?: unknown }> | undefined, id);
    if (saved && Number.isFinite(saved.until) && Number.isFinite(saved.ready)) spotlights[id] = { until: Number(saved.until), ready: Number(saved.ready) };
  }
  // Levels: only what was saved is kept (a person with no saved level counts ten per bond grade, see levelOf).
  const levels: Record<string, number> = {};
  for (const id of Object.keys(owned)) {
    const saved = savedValue(source.levels as Record<string, unknown> | undefined, id);
    if (Number.isFinite(saved)) levels[id] = Math.max(COMPANION_START_LEVEL, Math.min(levelCapForGrade(bondLevel(owned[id]!)), Math.floor(saved as number)));
  }
  return { owned, shards, keepsakes, assigned, visits, spotlights, levels };
}
