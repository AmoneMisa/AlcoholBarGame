import { computed, ref, toRaw } from 'vue';
import { barEventFor } from '../sim/events';
import { pitchChance } from '../sim/pitch';
import { defineStore } from 'pinia';
import { INGREDIENTS, RECIPES, REGIONS, SUPPLIERS } from '../domain/catalog';
import { ALCOHOL_PRODUCTS, bottleRestockCrystalCost } from '../domain/bottleCatalog';
import { arrivalSkipCrystalCost, calendarDate, coins, consecutiveDays, dailyCoinsFor, dailyCrystalsFor, quotePurchase, recipePurchase, supplierInCity } from '../domain/economy';
import { BAR_PROFILE_OPTIONS, INTERIORS, interiorStyle, type BarProfile } from '../data/cosmetics/bars';
import { judgeMix } from '../domain/engine';
import { economyAt, levelProgress, marketFor } from '../domain/progression';
import { BAR_PURCHASE_LEVEL, barUnlockPrice } from '../domain/barUnlocks';
import { dailyLessonsFor, learningStreakBonus } from '../domain/dailyLessons';
import { COSMETICS, canUseCosmetic as ownsCosmetic } from '../domain/cosmetics';
import { negotiatedQuote } from '../sim/trade';
import type { Customer, InventoryItem, RegionId, SupplierOffer } from '../domain/types';
import { pourableBrand } from '../domain/brandServe';
import { formatCountdown } from '../domain/customerTiming';
import { checkText } from '../domain/english/checker';
import { advanceClock, applyAction, RuleError, type GameAction } from '../sim/rules';
import { createInitialState, levelFor, normalizePlayerState, type PlayerState } from '../sim/state';
import { playSfx } from '../audio/index';
import { answerFriendRequest, connectSession, createStarInvoice, fetchFriends, requestFriend, saveFriendLabel, sendAction, sendFriendGift, visitFriendBar, type FriendBar, type FriendSummary } from '../telegram/api';
import type { GiftRequest } from '../sim/gifts';
import { currentStage, fill as fillSituationText, guestLine, visibleChoices } from '../sim/situations';

// The client side of a server-authoritative game.
// Online: every action is applied locally for an instant response, then sent to the server; the server's
// answer (computed with the same rules and its own clock) replaces the local state, so a modified client gains nothing.
// Offline practice (no server — local development and tests): the same rules run locally and progress is
// kept on this device only; it is never uploaded to an account.

const OFFLINE_KEY = 'barlingo-offline-v2';
const LEGACY_KEY = 'barlingo-economy-v1';
const EMPTY_CUSTOMER: Customer = {
  id: 'waiting-for-customer', name: 'Next guest', mood: 'calm', patience: 1, patienceRemaining: 1,
  budget: 0, orderRecipeId: RECIPES[0]!.id, greeting: '', request: '', paymentMethod: 'cash', orderKind: 'cocktail'
};

function loadOffline(): PlayerState | undefined {
  try {
    const saved = JSON.parse(localStorage.getItem(OFFLINE_KEY) ?? 'null');
    if (saved?.version === 1) return normalizePlayerState(saved as PlayerState);
    const legacy = JSON.parse(localStorage.getItem(LEGACY_KEY) ?? 'null');
    return legacy?.version === 1 ? migrateLegacySave(legacy) : undefined;
  } catch { return undefined; }
}

// The first local-only save format: keep valid bar profiles and progress for offline practice.
function migrateLegacySave(saved: Record<string, any>): PlayerState {
  const state = createInitialState();
  if (Number.isFinite(saved.money) && saved.money >= 0) state.money = saved.money;
  if (Number.isFinite(saved.xp) && saved.xp >= 0) state.xp = saved.xp;
  if (REGIONS.some((item) => item.id === saved.regionId)) state.regionId = saved.regionId;
  for (const region of REGIONS) {
    const profile = saved.bars?.[region.id];
    if (!profile || typeof profile !== 'object') continue;
    const bar = state.bars[region.id] as unknown as Record<string, string>;
    if (typeof profile.name === 'string' && profile.name.trim()) bar.name = profile.name.trim().slice(0, 32);
    for (const [key, allowed] of Object.entries(BAR_PROFILE_OPTIONS)) {
      if (typeof profile[key] === 'string' && (allowed as readonly string[]).includes(profile[key])) bar[key] = profile[key];
    }
    const nickname = typeof profile.bartenderNickname === 'string' ? profile.bartenderNickname.replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, 18) : '';
    bar.bartenderNickname = nickname || (bar.bartenderCharacter === 'leo' ? 'Leo' : 'Noa');
  }
  if (Array.isArray(saved.knownRecipeIds)) state.knownRecipeIds = [...new Set([...state.knownRecipeIds, ...saved.knownRecipeIds.filter((id: string) => RECIPES.some((recipe) => recipe.id === id))])];
  state.ownedBarIds = [state.regionId];
  state.startingBarChosen = true;
  return state;
}

export const useGameStore = defineStore('game', () => {
  const state = ref<PlayerState>(loadOffline() ?? createInitialState());
  const mode = ref<'connecting' | 'online' | 'offline'>('connecting');
  const playerName = ref('');
  const playerId = ref(0);
  const playerFriendCode = ref('');
  const friends = ref<FriendSummary[]>([]);
  const visitedFriend = ref<FriendBar>();
  const serverOffset = ref(0);
  const clientNow = () => Date.now() + serverOffset.value;
  const nowMs = ref(clientNow());
  const message = ref(state.value.message);

  // Screen-only state: the drink being built, carts and filters never touch the economy until an action is sent.
  const currentMix = ref<InventoryItem[]>([]);
  const shaken = ref(false);
  const pourBrands = ref<Record<string, string>>({});
  const serving = ref(false);
  const selectedSupplier = ref('global');
  const purchaseCart = ref<Record<string, number>>({});
  const saleCart = ref<Record<string, number>>({});
  const transferTargetId = ref<RegionId>('london');
  const recipeCategory = ref<'all' | 'classic' | 'cocktail'>('all');

  // Read-only views of the authoritative state.
  const regionId = computed(() => state.value.regionId);
  const money = computed(() => state.value.money);
  const crystals = computed(() => state.value.crystals ?? 0);
  const xp = computed(() => state.value.xp);
  const streak = computed(() => state.value.streak);
  const level = computed(() => levelFor(state.value.xp));
  const bars = computed(() => state.value.bars);
  const ownedBarIds = computed(() => state.value.ownedBarIds);
  const startingBarChosen = computed(() => state.value.startingBarChosen);
  const sessionReady = computed(() => mode.value !== 'connecting');
  const ownedInteriorIds = computed(() => state.value.ownedInteriorIds ?? ['velvet']);
  const inventories = computed(() => state.value.inventories);
  const inventory = computed(() => state.value.inventories[state.value.regionId]);
  const bottleInventories = computed(() => state.value.bottleInventories);
  const bottleInventory = computed(() => state.value.bottleInventories[state.value.regionId]);
  const customers = computed(() => state.value.customers);
  const activeCustomerId = computed(() => state.value.activeCustomerId);
  const conversationCustomerId = computed(() => state.value.conversationCustomerId);
  const knownRecipeIds = computed(() => state.value.knownRecipeIds);
  const recipeUnlockSources = computed(() => state.value.recipeUnlockSources);
  const dailyGiftResult = computed(() => state.value.dailyGiftResult);
  const loginStreak = computed(() => state.value.loginStreak);
  const dailyLessonResult = computed(() => state.value.dailyLessonResult);
  const learningStreak = computed(() => state.value.learningStreak);
  const languageStats = computed(() => state.value.languageStats);
  const deliveryOrders = computed(() => state.value.deliveryOrders);
  const tradeLog = computed(() => state.value.tradeLog);
  const nextCustomerAt = computed(() => state.value.nextCustomerAt);
  const vipCooldownUntil = computed(() => state.value.vipCooldownUntil);
  const ownedCosmeticIds = computed(() => state.value.ownedCosmeticIds ?? []);
  const cosmeticCopies = computed(() => state.value.cosmeticCopies ?? {});
  const cosmeticRouletteAvailable = computed(() => state.value.cosmeticRouletteKey !== today.value);
  const cosmeticRouletteResult = computed(() => state.value.cosmeticRouletteResult);
  const cosmeticGiftLog = computed(() => state.value.cosmeticGiftLog ?? []);

  // Decor edits (Design screen) go through a validated action; the proxy keeps `game.decor.wall = 'x'` working.
  const decor = computed<BarProfile>(() => new Proxy(state.value.bars[state.value.regionId], {
    set(_target, key, value) {
      dispatch({ type: 'setDecor', key: String(key), value: String(value) });
      return true;
    }
  }));
  const barBackground = computed(() => INTERIORS.find((item) => item.id === decor.value.interior)?.asset ?? INTERIORS[0].asset);
  const barInteriorStyle = computed(() => interiorStyle(decor.value.interior));

  const region = computed(() => REGIONS.find((item) => item.id === state.value.regionId)!);
  // Level perks and the city's current event (Hot Time, shortages…), computed exactly as the rules do.
  const economy = computed(() => economyAt(region.value.id, region.value.marketFactor, state.value.xp, nowMs.value));
  const xpProgress = computed(() => levelProgress(state.value.xp));
  const market = computed(() => marketFor(region.value, nowMs.value, state.value.xp));
  const knownRecipes = computed(() => RECIPES.filter((recipe) => state.value.knownRecipeIds.includes(recipe.id)));
  const lockedRecipes = computed(() => RECIPES.filter((recipe) => !state.value.knownRecipeIds.includes(recipe.id)));
  const today = computed(() => calendarDate(new Date(nowMs.value)));
  const dailyLessons = computed(() => dailyLessonsFor(today.value));
  const dailyLessonCompletedIds = computed(() => state.value.dailyLessonKey === today.value ? state.value.dailyLessonCompletedIds : []);
  const learningStreakForToday = computed(() => consecutiveDays(state.value.lastLearningDayKey, state.value.learningStreak, new Date(nowMs.value)));
  const learningBonusPercent = computed(() => Math.round(learningStreakBonus(learningStreakForToday.value) * 100));
  const dailyLessonsComplete = computed(() => dailyLessonCompletedIds.value.length >= dailyLessons.value.length);
  const dailyGiftAvailable = computed(() => state.value.dailyGiftClaimedKey !== today.value);
  const upcomingLoginDay = computed(() => consecutiveDays(state.value.dailyGiftClaimedKey, state.value.loginStreak, new Date(nowMs.value)));
  const dailyCoinReward = computed(() => dailyCoinsFor(upcomingLoginDay.value));
  const dailyCrystalReward = computed(() => dailyCrystalsFor(upcomingLoginDay.value));
  // Suppliers with this city's delivery fees (the same terms the rules charge).
  const localSuppliers = computed(() => SUPPLIERS.map((item) => supplierInCity(item, region.value.marketFactor)));
  const supplier = computed(() => localSuppliers.value.find((item) => item.id === selectedSupplier.value) ?? localSuppliers.value[0]!);
  const purchaseQuote = computed(() => quotePurchase(market.value, purchaseCart.value, supplier.value));
  const saleQuote = computed(() => INGREDIENTS.filter((item) => Number.isFinite(saleCart.value[item.id]) && saleCart.value[item.id]! >= 1).map((item) => {
    const quantity = Math.max(0, Math.floor(saleCart.value[item.id]!));
    const available = Math.max(0, (inventory.value.find((stock) => stock.ingredientId === item.id)?.amount ?? 0) - (currentMix.value.find((mix) => mix.ingredientId === item.id)?.amount ?? 0));
    return { ingredientId: item.id, quantity, available, revenue: coins(item.basePrice * quantity * region.value.marketFactor * .55 * economy.value.buybackFactor(item.id)) };
  }));
  const saleRevenue = computed(() => coins(saleQuote.value.reduce((sum, line) => sum + line.revenue, 0)));
  const guestPriceFactor = computed(() => customer.value.priceFactor ?? region.value.marketFactor);
  const hasCustomer = computed(() => state.value.customers.length > 0);
  const customer = computed(() => state.value.customers.find((item) => item.id === state.value.activeCustomerId) ?? state.value.customers[0] ?? EMPTY_CUSTOMER);
  const nextCustomerInSeconds = computed(() => state.value.nextCustomerAt ? Math.max(0, Math.ceil((state.value.nextCustomerAt - nowMs.value) / 1000)) : 0);
  const nextCustomerCountdown = computed(() => formatCountdown(nextCustomerInSeconds.value));
  const nextCustomerCrystalCost = computed(() => arrivalSkipCrystalCost(state.value.nextCustomerAt - nowMs.value));
  const orderCountdown = computed(() => formatCountdown(customer.value.patienceRemaining));
  const orderTimerPaused = computed(() => !!state.value.conversationCustomerId);
  const recipe = computed(() => judgeMix(currentMix.value, customer.value, shaken.value).recipe);
  const mixJudge = computed(() => judgeMix(currentMix.value, customer.value, shaken.value));
  const filteredRecipes = computed(() => recipeCategory.value === 'all' ? knownRecipes.value : knownRecipes.value.filter((item) => item.category === recipeCategory.value));

  const checkEnglish = (text: string) => { const result = checkText(text); return { ok: result.ok, corrected: result.corrected || text }; };
  const ruleContext = () => ({ now: clientNow(), checkEnglish, spawnCustomers: mode.value !== 'online' });
  // Online, these depend on hidden orders or on the server clock, so only the server can apply them.
  const SERVER_ONLY = new Set<GameAction['type']>(['say', 'serve', 'autoServe', 'openConversation', 'offerSimilar', 'sellBottle', 'rejectCustomer', 'tick', 'expediteCustomer', 'haggle', 'makeOffer', 'acceptDeal', 'completeDailyLesson','spinCosmeticRoulette','giftCosmetic','giveAshtray','cleanAshtrays','pitchStart','pitchAsk','pitchCancel','giveWater','callTaxi','askToLeave','situationChoice','reportIssue','discardStock']);

  function saveOffline() {
    if (mode.value === 'online') return;
    try { localStorage.setItem(OFFLINE_KEY, JSON.stringify(toRaw(state.value))); } catch { /* storage unavailable */ }
  }

  function adoptServerState(next: PlayerState, serverTime?: number, note?: string) {
    if (serverTime) serverOffset.value = serverTime - Date.now();
    state.value = normalizePlayerState(next);
    nowMs.value = clientNow();
    if (note) message.value = note;
  }

  function send(action: GameAction) {
    const levelBefore = levelFor(state.value.xp ?? 0);
    return sendAction(action).then((result) => {
      if (result.state) adoptServerState(result.state, result.serverTime, result.ok ? result.message : result.error);
      if (result.ok) playActionSound(action, levelBefore);
      else playSfx('error');
      return result.ok;
    }).catch(() => {
      message.value = 'Connection lost. Reconnecting…';
      connect();
      return false;
    });
  }

  const ACTION_SOUNDS: Partial<Record<GameAction['type'], Parameters<typeof playSfx>[0]>> = {
    serve: 'serve', sellBottle: 'coin', claimDaily: 'coin', exchangeCrystals: 'coin', buy: 'buy', sell: 'coin', acceptDeal: 'buy', buyBar: 'buy', buyRecipe: 'buy',
    buyInterior: 'buy', buyBottleStock: 'buy', selectCustomer: 'select', openConversation: 'select', completeDailyLesson: 'correct'
  };
  // Spoken English: a chime when the sentence was right, a soft buzz when it needed a fix.
  function playEnglishSound(action: GameAction) {
    if (action.type !== 'say' && action.type !== 'haggle') return false;
    const lines = action.type === 'say' ? Object.values(state.value.conversations ?? {}).flatMap((talk) => talk.lines) : state.value.negotiation?.lines ?? [];
    const mine = [...lines].reverse().find((line) => line.speaker === 'bartender' || line.speaker === 'buyer');
    if (mine?.ok !== undefined) playSfx(mine.ok ? 'correct' : 'wrong');
    return true;
  }
  function playActionSound(action: GameAction, levelBefore: number) {
    if (levelFor(state.value.xp ?? 0) > levelBefore) { playSfx('levelUp'); return; }
    if (playEnglishSound(action)) return;
    const sound = ACTION_SOUNDS[action.type];
    if (sound) playSfx(sound);
  }

  // Apply an action locally (instant feedback), then let the server decide. Returns false if the rules refuse it.
  function dispatch(action: GameAction): boolean {
    if (mode.value === 'online' && SERVER_ONLY.has(action.type)) {
      if (action.type === 'openConversation') state.value.conversationCustomerId = action.customerId;
      void send(action);
      return true;
    }
    // Applied in place (objects the screens hold stay valid); a refused action is rolled back.
    // A JSON copy, not structuredClone: rules that filter reactive lists (deliveries, guests) leave Vue proxies
    // inside the state, which structuredClone refuses — and then every later action silently failed.
    const snapshot = JSON.parse(JSON.stringify(state.value)) as PlayerState;
    const levelBefore = levelFor(state.value.xp ?? 0);
    try {
      applyAction(state.value, action, ruleContext());
    } catch (error) {
      state.value = snapshot;
      if (!(error instanceof RuleError)) throw error;
      message.value = error.message;
      playSfx('error');
      return false;
    }
    message.value = state.value.message;
    playActionSound(action, levelBefore);
    if (mode.value === 'online') void send(action);
    else {
      saveOffline();
    }
    return true;
  }

  async function connect() {
    if (typeof window === 'undefined' || !window.location?.origin) { mode.value = 'offline'; return; }
    try {
      const session = await connectSession();
      playerName.value = session.player.name;
      playerId.value = session.player.id;
      playerFriendCode.value = session.player.friendCode;
      mode.value = 'online';
      starterPackAvailable.value = session.starterPackAvailable !== false;
      adoptServerState(session.state, session.serverTime, session.state.message);
      resetMix();
      void loadFriends();
    } catch {
      mode.value = 'offline';
      message.value = 'Offline practice: progress is saved on this device only.';
    }
  }

  async function loadFriends() {
    if (mode.value !== 'online') { friends.value = []; return false; }
    try {
      const result = await fetchFriends();
      if (!result.ok) throw new Error(result.error);
      friends.value = result.friends ?? [];
      playerFriendCode.value = result.friendCode ?? playerFriendCode.value;
      return true;
    } catch (error) { message.value = (error as Error).message || 'Could not load friends.'; return false; }
  }
  async function addFriend(code:string) {
    try { const result = await requestFriend(code); if (!result.ok) throw new Error(result.error); message.value = result.message ?? 'Friend request sent.'; await loadFriends(); return true; }
    catch (error) { message.value = (error as Error).message; return false; }
  }
  async function answerFriend(code:string, accept:boolean) {
    try { const result = await answerFriendRequest(code,accept); if (!result.ok) throw new Error(result.error); message.value = result.message ?? ''; await loadFriends(); return true; }
    catch (error) { message.value = (error as Error).message; return false; }
  }
  async function renameFriend(code:string,label:string) {
    try { const result = await saveFriendLabel(code,label); if (!result.ok) throw new Error(result.error); if (result.state) adoptServerState(result.state, clientNow(), result.message); await loadFriends(); return true; }
    catch (error) { message.value = (error as Error).message; return false; }
  }
  async function visitFriend(code:string) {
    try { const result = await visitFriendBar(code); if (!result.ok || !result.friend) throw new Error(result.error); if (result.state) adoptServerState(result.state, clientNow()); visitedFriend.value = result.friend; message.value = result.rewarded ? `Visited ${result.friend.nickname}. They received +1 popularity.` : `Visiting ${result.friend.nickname}. Today’s popularity was already awarded.`; return true; }
    catch (error) { message.value = (error as Error).message; return false; }
  }
  async function giftFriend(gift:GiftRequest) {
    if (!visitedFriend.value) return false;
    try { const result = await sendFriendGift(visitedFriend.value.code,gift); if (!result.ok) throw new Error(result.error); if (result.state) adoptServerState(result.state,clientNow(),result.message); return true; }
    catch (error) { message.value = (error as Error).message; return false; }
  }

  // ---- Clock ----
  let lastSyncTick = 0;
  function tickGameClock(now = clientNow()) {
    nowMs.value = now;
    const before = state.value.customers.length;
    const draft = state.value;
    advanceClock(draft, { now, spawnCustomers: mode.value !== 'online' });
    const arrivalDue = !draft.customers.length && draft.nextCustomerAt > 0 && now >= draft.nextCustomerAt;
    if (draft.customers.length !== before || arrivalDue) {
      message.value = draft.message;
      if (draft.customers.length > before) playSfx('guest');
      if (draft.customers.length < before) resetMix();
      // Online, guests and timeouts are decided by the server: ask it (at most every 5 s).
      if (mode.value === 'online' && now - lastSyncTick > 5000) {
        lastSyncTick = now;
        dispatch({ type: 'tick' });
      }
    }
    if (mode.value !== 'online' && draft.customers.length !== before) saveOffline();
  }
  const tickPatience = () => tickGameClock();
  function welcomeNextCustomer() {
    if (mode.value === 'online') return dispatch({ type: 'tick' });
    state.value.nextCustomerAt = clientNow();
    tickGameClock();
    return true;
  }

  // ---- Mixing (screen only until served) ----
  function resetMix() {
    currentMix.value = [];
    shaken.value = false;
    pourBrands.value = {};
  }
  function brandOnShelf(productId: string) {
    return (bottleInventory.value.find((item) => item.productId === productId)?.quantity ?? 0) > 0;
  }
  function shelfBrandsFor(ingredientId: string) {
    return ALCOHOL_PRODUCTS.filter((product) => product.ingredientId === ingredientId && pourableBrand(product) && brandOnShelf(product.id));
  }
  function setPourBrand(ingredientId: string, productId?: string) {
    const next = { ...pourBrands.value };
    if (productId) next[ingredientId] = productId;
    else delete next[ingredientId];
    pourBrands.value = next;
  }
  function addIngredient(ingredientId: string, requestedAmount?: number) {
    if (!hasCustomer.value) {
      message.value = `The bar is ready. The next customer arrives in ${nextCustomerCountdown.value}.`;
      return;
    }
    const ingredient = INGREDIENTS.find((item) => item.id === ingredientId);
    if (!ingredient) return;
    const amount = requestedAmount ?? (ingredient.unit === 'ml' ? 5 : 1);
    const stock = inventory.value.find((item) => item.ingredientId === ingredientId);
    const used = currentMix.value.find((item) => item.ingredientId === ingredientId)?.amount ?? 0;
    if (!stock || stock.amount - used < amount) {
      message.value = 'Not enough ' + ingredient.name + '.';
      return;
    }
    const current = currentMix.value.find((item) => item.ingredientId === ingredientId);
    if (current) current.amount += amount;
    else currentMix.value.push({ ingredientId, amount });
    playSfx('pour');
    message.value = ingredient.name + ': +' + amount + ' ' + ingredient.unit + '.';
  }
  function shakeCurrentMix() {
    if (!currentMix.value.length) {
      message.value = 'The shaker is empty.';
      return;
    }
    shaken.value = true;
    playSfx('shake');
    message.value = 'Shaken. Now serve the drink.';
  }
  function serveMix() {
    const action: GameAction = { type: 'serve', mix: currentMix.value.map((item) => ({ ...item })), shaken: shaken.value, pourBrands: { ...pourBrands.value } };
    const served = dispatch(action);
    if (served) resetMix();
    return served;
  }

  // ---- Guests and conversation ----
  const selectCustomer = (id: string) => { if (id !== state.value.activeCustomerId) { dispatch({ type: 'selectCustomer', customerId: id }); resetMix(); } };
  const openConversation = (id: string) => { if (id !== state.value.activeCustomerId) resetMix(); return dispatch({ type: 'openConversation', customerId: id }); };
  const closeConversation = () => { if (state.value.conversationCustomerId) dispatch({ type: 'closeConversation' }); };
  // One sentence to the guest in the open conversation. The rules (on the server when online) check the English,
  // award XP and decide the guest's answer, which arrives in state.conversations. Resolves false if refused.
  async function say(text: string) {
    if (mode.value === 'online') return send({ type: 'say', text });
    return dispatch({ type: 'say', text });
  }
  const conversations = computed(() => state.value.conversations ?? {});
  const sellBottleToCustomer = () => dispatch({ type: 'sellBottle' });

  // ---- Haggling with suppliers (rules in sim/trade.ts; the server decides every answer) ----
  const negotiation = computed(() => state.value.negotiation);
  const negotiationQuote = computed(() => state.value.negotiation ? negotiatedQuote(state.value, state.value.negotiation, nowMs.value) : undefined);
  const startNegotiation = () => dispatch({ type: 'startNegotiation', supplierId: selectedSupplier.value, cart: { ...purchaseCart.value } });
  async function haggle(text: string) {
    if (mode.value === 'online') return send({ type: 'haggle', text });
    return dispatch({ type: 'haggle', text });
  }
  // The server rolls the chance; the answer arrives with the new state.
  async function makeOffer(price: number) {
    if (mode.value === 'online') return send({ type: 'makeOffer', price });
    return dispatch({ type: 'makeOffer', price });
  }
  function acceptDeal() {
    const done = dispatch({ type: 'acceptDeal' });
    if (done) purchaseCart.value = {};
    return done;
  }
  const leaveNegotiation = () => dispatch({ type: 'leaveNegotiation' });
  const offerSimilarOrder = (id: string) => { const done = dispatch({ type: 'offerSimilar', customerId: id }); if (done) resetMix(); return done; };
  const rejectCustomer = (id: string) => { const done = dispatch({ type: 'rejectCustomer', customerId: id }); if (done) resetMix(); return done; };
  // Level unlocks: Auto-serve makes the confirmed order from stock, Auto-supply reorders low stock.
  const autoServe = () => { const done = dispatch({ type: 'autoServe' }); if (done) resetMix(); return done; };
  const setAutoSupply = (enabled: boolean) => dispatch({ type: 'setAutoSupply', enabled });
  const autoSupply = computed(() => state.value.autoSupply === true);

  // ---- Trade ----
  function selectSupplier(id: string) {
    if (!SUPPLIERS.some((item) => item.id === id)) return;
    if (selectedSupplier.value !== id) purchaseCart.value = {};
    selectedSupplier.value = id;
  }
  function checkoutPurchase() {
    const done = dispatch({ type: 'buy', supplierId: selectedSupplier.value, cart: { ...purchaseCart.value } });
    if (done) purchaseCart.value = {};
    return done;
  }
  function buy(offer: SupplierOffer, packs = 1) {
    selectSupplier(offer.supplierId);
    purchaseCart.value = { [offer.ingredientId]: Math.min(99, Math.max(0, Math.floor(packs))) };
    return checkoutPurchase();
  }
  function checkoutSale() {
    if (saleQuote.value.some((line) => line.quantity > line.available)) { message.value = 'Some stock is no longer available. Adjust your sale.'; return false; }
    const done = dispatch({ type: 'sell', cart: { ...saleCart.value } });
    if (done) saleCart.value = {};
    return done;
  }
  function sell(ingredientId: string, amount?: number) {
    const ingredient = INGREDIENTS.find((item) => item.id === ingredientId);
    const stock = inventory.value.find((item) => item.ingredientId === ingredientId);
    if (!ingredient || !stock) return false;
    saleCart.value = { [ingredientId]: amount ?? (ingredient.unit === 'ml' ? Math.min(250, stock.amount) : Math.min(6, stock.amount)) };
    return checkoutSale();
  }
  function transferStock(ingredientId: string, targetId: RegionId) {
    const reserved = currentMix.value.find((item) => item.ingredientId === ingredientId)?.amount ?? 0;
    const stock = inventory.value.find((item) => item.ingredientId === ingredientId)?.amount ?? 0;
    if (stock - reserved <= 0) { message.value = 'This stock is in the glass you are mixing.'; return false; }
    const ingredient = INGREDIENTS.find((item) => item.id === ingredientId);
    const amount = Math.min(ingredient?.unit === 'ml' ? 100 : 3, stock - reserved);
    return dispatch({ type: 'transfer', ingredientId, targetId, amount });
  }
  function deliveryCountdown(dueAt: number) {
    const seconds = Math.max(0, Math.ceil((dueAt - nowMs.value) / 1000));
    const days = Math.floor(seconds / 86_400);
    const hours = Math.floor((seconds % 86_400) / 3600);
    return days ? `${days}d ${hours}h` : formatCountdown(seconds);
  }

  // ---- Progress, bars and profile ----
  const buyRecipe = (recipeId: string) => dispatch({ type: 'buyRecipe', recipeId });
  const upgradeRecipe = (recipeId: string) => dispatch({ type: 'upgradeRecipe', recipeId });
  const recipeLevels = computed(() => state.value.recipeLevels ?? {});
  const recipeCopies = computed(() => state.value.recipeCopies ?? {});
  const friendVisits = computed(() => state.value.friendVisits ?? {});
  const recipePrice = (recipeId: string) => {
    const recipe = RECIPES.find((item) => item.id === recipeId)!;
    return recipePurchase(recipe, RECIPES.indexOf(recipe));
  };
  const buyInterior = (interiorId: string) => dispatch({ type: 'buyInterior', interiorId });
  const chooseInterior = (interiorId: string) => state.value.ownedInteriorIds.includes(interiorId)
    ? dispatch({ type: 'setDecor', key: 'interior', value: interiorId }) : buyInterior(interiorId);
  const bottleCrystalCost = (productId: string) => bottleRestockCrystalCost(ALCOHOL_PRODUCTS.find((item) => item.id === productId)!);
  const buyBottleStock = (productId: string, quantity = 1) => dispatch({ type: 'buyBottleStock', productId, quantity });
  const expediteCustomer = () => dispatch({ type: 'expediteCustomer' });
  const claimDailyGift = () => dispatch({ type: 'claimDaily' });
  const completeDailyLesson = (lessonId: string, answer: string) => dispatch({ type: 'completeDailyLesson', lessonId, answer });
  const exchangeCrystals = (crystals: number) => dispatch({ type: 'exchangeCrystals', crystals });

  // Looking after the people at the bar.
  const giveAshtray = (customerId: string) => dispatch({ type: 'giveAshtray', customerId });
  const pitchStart = (customerId: string, kind: 'drink' | 'food', itemId: string) => dispatch({ type: 'pitchStart', customerId, kind, itemId });
  const pitchAsk = (customerId: string) => dispatch({ type: 'pitchAsk', customerId });
  const pitchCancel = (customerId: string) => dispatch({ type: 'pitchCancel', customerId });
  const barEvent = computed(() => barEventFor(state.value, nowMs.value));
  const offerChance = (customerId: string) => { const guest = state.value.customers.find((item) => item.id === customerId); return guest ? pitchChance(state.value, guest, nowMs.value) : undefined; };
  const giveWater = (customerId: string) => dispatch({ type: 'giveWater', customerId });
  const callTaxi = (customerId: string) => dispatch({ type: 'callTaxi', customerId });
  const askToLeave = (customerId: string, tone: 'gentle' | 'firm' | 'aggressive') => dispatch({ type: 'askToLeave', customerId, tone });
  const cleanAshtrays = () => dispatch({ type: 'cleanAshtrays' });
  // A situation that is open for a guest (a payment problem, a broken glass, an emergency): its title and the replies on offer.
  const situationOf = (customerId: string) => {
    const guest = state.value.customers.find((item) => item.id === customerId);
    const current = guest ? currentStage(guest) : undefined;
    if (!guest || !current) return undefined;
    const data = guest.social!.event!.data;
    return {
      line: guestLine(state.value, guest), title: current.def.title, icon: current.def.icon, category: current.def.category, severity: current.def.severity,
      choices: visibleChoices(state.value, guest).map((choice) => ({ id: choice.id, say: fillSituationText(choice.say, data, region.value.currencySymbol) }))
    };
  };
  const answerSituation = (customerId: string, choiceId: string) => dispatch({ type: 'situationChoice', customerId, choiceId });
  // Problems with delivered goods in the bar you are in.
  const deliveryIssues = computed(() => (state.value.deliveryIssues ?? []).filter((issue) => issue.barId === state.value.regionId));
  const quarantine = computed(() => (state.value.quarantine ?? []).filter((item) => item.barId === state.value.regionId));
  const lowGrade = computed(() => state.value.lowGrade?.[state.value.regionId] ?? {});
  const reportIssue = (issueId: string, text: string) => dispatch({ type: 'reportIssue', issueId, text });
  const discardStock = (id: string) => dispatch({ type: 'discardStock', id });
  const ashtrays = computed(() => state.value.ashtrays ?? { clean: 4, dirty: 0 });

  // Buying crystals with Telegram Stars. The server only hands out an invoice; crystals arrive when Telegram
  // confirms the payment to the bot, so after "paid" the account is re-read until the new balance shows up.
  const buyingCrystals = ref(false);
  const starterPackAvailable = ref(true);
  async function buyCrystalPack(packId: string): Promise<boolean> {
    const webApp = window.Telegram?.WebApp;
    if (buyingCrystals.value) return false;
    if (mode.value !== 'online' || !webApp?.openInvoice) { message.value = 'Open the game inside Telegram to buy crystals with Stars.'; playSfx('error'); return false; }
    buyingCrystals.value = true;
    try {
      const invoice = await createStarInvoice(packId);
      if (!invoice.ok || !invoice.url) throw new Error(invoice.error ?? 'Could not start the payment.');
      const status = await new Promise<string>((resolve) => webApp.openInvoice!(invoice.url!, resolve));
      if (status === 'cancelled') return false;
      if (status === 'failed') throw new Error('The payment failed. You were not charged.');
      const before = state.value.crystals ?? 0;
      message.value = 'Payment received. Adding your crystals…';
      for (let attempt = 0; attempt < 10; attempt++) {
        const session = await connectSession();
        adoptServerState(session.state, session.serverTime);
        starterPackAvailable.value = session.starterPackAvailable !== false;
        if ((session.state.crystals ?? 0) > before) { message.value = session.state.message; playSfx('coin'); return true; }
        await new Promise((resolve) => setTimeout(resolve, 1500));
      }
      message.value = 'Payment received. Your crystals will appear in a moment — reopen the game if they do not.';
      return true;
    } catch (error) {
      message.value = error instanceof Error ? error.message : 'Could not start the payment.';
      playSfx('error');
      return false;
    } finally {
      buyingCrystals.value = false;
    }
  }
  const spinCosmeticRoulette = () => dispatch({ type:'spinCosmeticRoulette' });
  const giftCosmetic = (cosmeticId:string, recipient:string) => dispatch({ type:'giftCosmetic', cosmeticId, recipient });
  const activatePopularityBoost = (boost:'no-cooldown'|'vip-run') => dispatch({ type:'activatePopularityBoost', boost });
  const popularity = computed(() => state.value.popularity ?? 0);
  const popularityBoost = computed(() => state.value.popularityBoost);
  const canUseCosmetic = (key:string,value:string) => ownsCosmetic(state.value.ownedCosmeticIds ?? [],key,value,state.value.bars[state.value.regionId].bartenderCharacter);
  const refreshDailyGift = () => { nowMs.value = clientNow(); };
  const renameBar = (name: string) => dispatch({ type: 'renameBar', name });
  const renameBartender = (name: string) => dispatch({ type: 'renameBartender', name });
  function switchBar(id: RegionId) {
    if (id === state.value.regionId) return;
    if (dispatch({ type: 'switchBar', regionId: id })) {
      clearBarWorkspace();
    }
  }
  const isBarOwned = (id: RegionId) => state.value.ownedBarIds.includes(id);
  const nextBarPrice = computed(() => barUnlockPrice(state.value.ownedBarIds));
  function clearBarWorkspace() {
    purchaseCart.value = {};
    saleCart.value = {};
    transferTargetId.value = REGIONS.find((item) => item.id !== state.value.regionId && state.value.ownedBarIds.includes(item.id))?.id ?? state.value.regionId;
    resetMix();
  }
  function chooseStartingBar(id: RegionId) { const ok = dispatch({ type: 'chooseStartingBar', regionId: id }); if (ok) clearBarWorkspace(); return ok; }
  function buyBar(id: RegionId) { const ok = dispatch({ type: 'buyBar', regionId: id }); if (ok) clearBarWorkspace(); return ok; }

  void connect();

  return {
    mode, playerName, playerId, playerFriendCode, friends, visitedFriend, loadFriends, addFriend, answerFriend, renameFriend, visitFriend, giftFriend, friendVisits, connect,
    economy, xpProgress, guestPriceFactor, nowMs,
    upgradeRecipe, recipeLevels, recipeCopies, autoServe, setAutoSupply, autoSupply,
    negotiation, negotiationQuote, startNegotiation, haggle, makeOffer, acceptDeal, leaveNegotiation,
    regionId, region, money, crystals, xp, streak, level, serving, decor, bars, ownedBarIds, startingBarChosen, sessionReady, ownedInteriorIds, barBackground, barInteriorStyle,
    cosmetics:COSMETICS, ownedCosmeticIds, cosmeticCopies, cosmeticRouletteAvailable, cosmeticRouletteResult, cosmeticGiftLog, canUseCosmetic, spinCosmeticRoulette, giftCosmetic, popularity, popularityBoost, activatePopularityBoost,
    inventories, inventory, bottleInventories, bottleInventory, currentMix, shaken, customers, activeCustomerId, customer, hasCustomer, recipe, mixJudge,
    knownRecipeIds, recipeUnlockSources, knownRecipes, lockedRecipes, dailyGiftAvailable, dailyGiftResult, loginStreak, upcomingLoginDay, dailyCoinReward, dailyCrystalReward,
    dailyLessons, dailyLessonCompletedIds, dailyLessonsComplete, dailyLessonResult, learningStreak, learningStreakForToday, learningBonusPercent, completeDailyLesson,
    conversationCustomerId, languageStats, nextCustomerAt, nextCustomerInSeconds, nextCustomerCountdown, nextCustomerCrystalCost, vipCooldownUntil, orderCountdown, orderTimerPaused,
    message, market, selectedSupplier, transferTargetId, tradeLog, recipeCategory, filteredRecipes,
    pourBrands, brandOnShelf, shelfBrandsFor, setPourBrand,
    selectCustomer, addIngredient, resetMix, shakeCurrentMix, serveMix, tickPatience, tickGameClock, welcomeNextCustomer, offerSimilarOrder, rejectCustomer, buy, sell, switchBar, isBarOwned, nextBarPrice, barPurchaseLevel:BAR_PURCHASE_LEVEL, chooseStartingBar, buyBar, transferStock,
    supplier, localSuppliers, purchaseCart, saleCart, purchaseQuote, saleQuote, saleRevenue, deliveryOrders, deliveryCountdown, selectSupplier, checkoutPurchase, checkoutSale, renameBar, renameBartender,
    buyRecipe, recipePrice, buyInterior, chooseInterior, bottleCrystalCost, buyBottleStock, expediteCustomer, claimDailyGift, exchangeCrystals, giveAshtray, giveWater, callTaxi, pitchStart, pitchAsk, pitchCancel, barEvent, offerChance, askToLeave, cleanAshtrays, ashtrays, situationOf, answerSituation, deliveryIssues, quarantine, lowGrade, reportIssue, discardStock, buyCrystalPack, buyingCrystals, starterPackAvailable, refreshDailyGift, openConversation, closeConversation, say, conversations, sellBottleToCustomer
  };
});
