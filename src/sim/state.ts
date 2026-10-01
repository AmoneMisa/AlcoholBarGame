import { INGREDIENTS, RECIPES, REGIONS, STARTING_INVENTORY } from '../domain/catalog';
import { ALCOHOL_PRODUCTS } from '../domain/bottleCatalog';
import { DEFAULT_BARS, INTERIORS, type BarProfile } from '../data/cosmetics/bars';
import { CHARACTER_ART, CUSTOMER_ART_BY_SLOT } from '../data/cosmetics/artCatalog';
import { generateCustomer } from '../domain/engine';
import { levelPerks } from '../domain/progression';
import type { BottleInventoryItem, Customer, InventoryItem, RegionId } from '../domain/types';
import { buildProfile, shortWish, type CustomerReply, type Fact } from '../domain/conversation/customerTalk';
import type { BottleConversationFacts } from '../domain/conversation/bottleTalk';
import { ensureSocial, rollSocial } from '../domain/social/generate';

// The complete, serializable game state of one player. The server owns it; the client only displays it
// (and, in offline practice mode, simulates it locally with the same rules).

export const BASIC_RECIPE_COUNT = 10;
export const DELIVERY_DAY_MS = 24 * 60 * 60 * 1000;
export type UnlockSource = 'starter' | 'shop' | 'special-client' | 'daily-gift' | 'daily-lesson' | 'friend-gift';
export interface ChatLine { id: number; speaker: 'customer' | 'bartender'; text: string; note?: string; ok?: boolean; }
// One conversation with one guest. Only what has been said is stored here — never the hidden order.
export interface Transcript { lines: ChatLine[]; facts: Fact[]; bottleFacts: BottleConversationFacts; expression: CustomerReply['expression']; attempts: number; correct: number; perfectRewardClaimed?: boolean; }

export interface DeliveryOrder { id: string; supplier: string; barId: RegionId; dueAt: number; items: InventoryItem[]; total: number; }
export type PopularityBoost = { kind: 'no-cooldown'; until: number } | { kind: 'vip-run'; remaining: number };

export interface PlayerState {
  version: 1;
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
  // Servers hired (up to four), when their work was last counted, and what they have earned in all.
  staff?: { level: number }[];
  staffAt?: number;
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
  if (customer.orderKind === 'serve' || customer.specialRecipeRewardId) return customer.request;
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
    ...customer, orderRecipeId: '', modifierId: undefined, bottleRequest: undefined, budget: 0,
    wish: customer.wish ?? wishFor(customer), request: customer.wish ?? wishFor(customer)
  });
  return view;
}

const makeBarInventory = (barIndex: number) => STARTING_INVENTORY.map((item, ingredientIndex) => {
  const ingredient = INGREDIENTS.find((entry) => entry.id === item.ingredientId)!;
  const factor = .48 + ((barIndex * 3 + ingredientIndex) % 6) * .11;
  const floor = ingredient.unit === 'ml' ? 90 : 4;
  return { ...item, amount: Math.max(floor, Math.round(item.amount * factor)) };
});

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
  return {
    version: 1,
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
    dailyGiftClaimedKey: '',
    loginStreak: 0,
    dailyGiftResult: 'A new gift is available today.',
    dailyLessonKey: '',
    dailyLessonCompletedIds: [],
    learningStreak: 0,
    lastLearningDayKey: '',
    dailyLessonResult: 'Complete today’s three lessons to grow your learning streak.',
    inventories: Object.fromEntries(REGIONS.map((region, index) => [region.id, makeBarInventory(index)])) as Record<RegionId, InventoryItem[]>,
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
    rewardedSentences: {},
    conversations: {},
    message: 'Tap a customer to talk, find out what they want, then build the cocktail.'
  };
}

// JSON player snapshots are intentionally schema-light. Upgrade older snapshots in place whenever
// they are loaded so adding a currency never invalidates an existing account.
export function normalizePlayerState(state: PlayerState) {
  state.crystals = Number.isFinite(state.crystals) && state.crystals >= 0 ? Math.floor(state.crystals) : 0;
  state.dailyLessonKey = typeof state.dailyLessonKey === 'string' ? state.dailyLessonKey : '';
  state.dailyLessonCompletedIds = Array.isArray(state.dailyLessonCompletedIds) ? [...new Set(state.dailyLessonCompletedIds.filter((id) => typeof id === 'string'))] : [];
  state.learningStreak = Number.isFinite(state.learningStreak) ? Math.max(0, Math.floor(state.learningStreak)) : 0;
  state.lastLearningDayKey = typeof state.lastLearningDayKey === 'string' ? state.lastLearningDayKey : '';
  state.dailyLessonResult = typeof state.dailyLessonResult === 'string' ? state.dailyLessonResult : 'Complete today’s three lessons to grow your learning streak.';
  state.tradeLog = Array.isArray(state.tradeLog)
    ? state.tradeLog.filter((entry) => entry !== 'Each city bar now keeps its own stock.').slice(0, 40)
    : [];
  state.popularity = Number.isFinite(state.popularity) ? Math.max(0, Math.floor(state.popularity)) : 0;
  if (state.popularityBoost?.kind === 'no-cooldown') {
    if (!Number.isFinite(state.popularityBoost.until)) state.popularityBoost = undefined;
  } else if (state.popularityBoost?.kind === 'vip-run') {
    const remaining = Math.max(0, Math.floor(state.popularityBoost.remaining));
    state.popularityBoost = remaining ? { kind: 'vip-run', remaining } : undefined;
  } else state.popularityBoost = undefined;
  state.friendVisits = state.friendVisits && typeof state.friendVisits === 'object' ? state.friendVisits : {};
  state.friendLabels = state.friendLabels && typeof state.friendLabels === 'object' ? state.friendLabels : {};
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
  state.staff = Array.isArray(state.staff) ? state.staff.slice(0, 4).map((member) => ({ level: Math.max(1, Math.min(5, Math.round(Number(member?.level) || 1))) })) : [];
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

// Levels follow a rising XP curve (60, 80, 100… XP per level) — see domain/progression.ts.
export { levelFor } from '../domain/progression';
