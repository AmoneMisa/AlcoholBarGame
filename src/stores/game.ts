import { trainingGuest } from '../domain/training';
import { eventAvailability } from '../domain/eventAvailability';
import { resetTips, tipCapacity } from '../sim/tips';
import { stealFriendTips } from '../telegram/api';
import { fetchMailbox, answerMailGift, claimMailReward } from '../telegram/api';
import type { MailEntry } from '../sim/mailbox';
import {redeemPromo} from '../telegram/api';
import { computed, ref, toRaw } from 'vue';
import { statValue } from '../domain/achievementStats';
import { companionBonus, emptyCompanions } from '../sim/companions';
import type { BonusId } from '../domain/companions';
import type { StatId } from '../domain/quests';
import { buildPlayerProfile, earnedAchievements as earnedAchievementList } from '../domain/profile';
import { rulesFor } from '../domain/situations/houseRules';
import { barEventFor } from '../sim/events';
import { pitchChance, recommendedFoods } from '../sim/pitch';
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
import { usableIngredientIds } from '../domain/usableStock';
import { negotiatedQuote } from '../sim/trade';
import type { Customer, InventoryItem, RegionId, SupplierOffer } from '../domain/types';
import { pourableBrand } from '../domain/brandServe';
import { formatCountdown } from '../domain/customerTiming';
import { spinsLeft } from '../domain/roulette';
import { passEndsOf, passIdOf, passLevel, passPointsFor, passThemeOf, readyPassRewards } from '../domain/pass';
import { checkText } from '../domain/english/checker';
import { advanceClock, applyAction, previewTopUp, RuleError, type GameAction } from '../sim/rules';
import { createInitialState, levelFor, normalizePlayerState, type PlayerState } from '../sim/state';
import { playSfx } from '../audio/index';
import { answerFriendRequest, claimFriendGifts, connectSession, createStarInvoice, fetchFriends, removeFriendLink, requestFriend, saveFriendLabel, sendAction, sendFriendGift, visitFriendBar, type FriendBar, type FriendSummary } from '../telegram/api';
import { rewardLines, snapshot as stateSnapshot, type RewardLine, type RewardReport, type Snapshot } from '../domain/rewards';
import { giftableInteriors, giftableStyles, type GiftRequest } from '../sim/gifts';
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
  state.xpCurve = undefined; // the first local format used the original XP curve
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
  const mailboxOpen = ref(false);
  const mailboxEntries = computed(()=>state.value.mailbox ?? []);
  const unreadMail = computed(()=>mailboxEntries.value.filter(item=>!item.readAt || (item.direction==='incoming' && item.status==='pending')).length);
  const theftNotices = ref<MailEntry[]>([]);
  const mailBusy = ref(false);
  const mailMessage = ref('');
  async function loadMailbox(readIds:string[] = []) {
    if (mode.value!=='online') return false;
    try {
      const result=await fetchMailbox(readIds);
      if (!result.ok) throw new Error(result.error);
      if (result.state) adoptServerState(result.state,result.serverTime);
      mailMessage.value='';
      return true;
    } catch (error) { mailMessage.value=(error as Error)?.message || 'Could not load your mailbox.'; return friendError(error,'Could not load your mailbox.'); }
  }
  async function openMailbox() {mailboxOpen.value=true; await loadMailbox();}
  async function dismissTheftNotices() {
    if (await loadMailbox(theftNotices.value.map(item=>item.id))) theftNotices.value=[];
  }
  async function decideMailGift(giftId:number,accept:boolean) {
    if (mailBusy.value) return;
    mailBusy.value=true;
    try {
      const result=await answerMailGift(giftId,accept);
      if (!result.ok) throw new Error(result.error);
      if (result.state) adoptServerState(result.state,result.serverTime,result.message);
      mailMessage.value=result.message ?? '';
      if (accept && result.message) showRewards('Gift accepted',[{kind:'gift',text:result.message}]);
    } catch (error) { mailMessage.value=(error as Error)?.message || 'Could not handle this gift.'; friendError(error,'Could not handle this gift.'); }
    finally {mailBusy.value=false;}
  }
  async function collectMailReward(id:string) {
    if(mailBusy.value)return;
    mailBusy.value=true;
    try {
      const before=stateSnapshot(state.value);
      const result=await claimMailReward(id);
      if(!result.ok)throw new Error(result.error);
      if(result.state)adoptServerState(result.state,result.serverTime,result.message);
      mailMessage.value=result.message ?? '';
      showRewards('Mail rewards',rewardLines(before,stateSnapshot(state.value),result.message));
    } catch(error){mailMessage.value=(error as Error)?.message || 'Could not claim this reward.';friendError(error,'Could not claim this reward.');}
    finally{mailBusy.value=false;}
  }
  const rewardReport = ref<RewardReport>();
  const trainingActive = ref(false);
  const trainingPhase = ref<'order' | 'payment' | 'tips' | 'complete'>('order');
  const trainingRestocked = ref(false);
  let savedTrainingState: PlayerState | undefined;
  let savedTrainingMode: 'connecting' | 'online' | 'offline' = 'offline';
  function beginTraining() {
    if (trainingActive.value) return;
    savedTrainingState = JSON.parse(JSON.stringify(toRaw(state.value)));
    savedTrainingMode = mode.value;
    const practice = JSON.parse(JSON.stringify(toRaw(state.value))) as PlayerState;
    const guest = trainingGuest();
    practice.customers = [guest]; practice.activeCustomerId = guest.id; practice.conversationCustomerId = undefined;
    practice.conversations = { [guest.id]: { lines: [{ id:0, speaker:'customer', text:guest.greeting }], facts:[], bottleFacts:{}, expression:'smile', attempts:0, correct:0 } }; practice.rewardedSentences = {}; practice.tipJar = 0;
    practice.nextCustomerAt = clientNow() + 86400000; practice.seatNextCustomerAt = Array(5).fill(practice.nextCustomerAt);
    resetTips(practice, clientNow());
    practice.staffByBar = {}; practice.deliveryOrders = []; practice.autoSupply = false; practice.money = Math.max(practice.money, 900); practice.knownRecipeIds = [...new Set([...practice.knownRecipeIds, 'gin-tonic'])];
    for (const item of practice.inventories[practice.regionId]) item.amount = Math.max(item.amount, 1000);
    practice.inventories[practice.regionId].find(item => item.ingredientId === 'tonic')!.amount = 90;
    for (const item of practice.bottleInventories[practice.regionId]) item.quantity = Math.max(item.quantity, 1);
    practice.message = 'Practice order: Gin & Tonic. Your account balance and stock are safe.';
    trainingActive.value = true; trainingPhase.value = 'order'; trainingRestocked.value = false; state.value = practice; mode.value = 'offline';
    rewardReport.value = undefined; dailyOpen.value = false; selectedSupplier.value = 'global'; clearBarWorkspace(); message.value = practice.message;
  }
  function endTraining() {
    if (!trainingActive.value) return;
    trainingActive.value = false;
    if (savedTrainingState) { savedTrainingState.lastClockAt = clientNow(); state.value = savedTrainingState; }
    mode.value = savedTrainingMode; savedTrainingState = undefined;
    clearBarWorkspace(); rewardReport.value = undefined; message.value = state.value.message;
  }
  const preparationCustomerId = ref('');
  const tipJar = computed(() => state.value.tipJar ?? 0);
  const tipJarCapacity = computed(() => tipCapacity(state.value));
  const collectTips = () => dispatch({ type: 'collectTips' });
  function openPreparation(id: string) {
    const customer = state.value.customers.find(customer => customer.id === id);
    if (!customer?.orderRevealed) return;
    if (customer.orderKind === 'bottle') { openConversation(id); return; }
    selectCustomer(id);
    closeConversation();
    preparationCustomerId.value = id;
  }
  const dailyOpen = ref(false);
  let reportId = 0;
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
  // Bumped when the first server state replaces the local one, so screens do not announce stored items as new.
  const connectEpoch = ref(0);
  const ownedInteriorIds = computed(() => state.value.ownedInteriorIds ?? ['velvet']);
  const inventories = computed(() => state.value.inventories);
  const inventory = computed(() => state.value.inventories[state.value.regionId]);
  // Rows worth showing: in stock, or needed by a recipe the player knows (unusable empty rows stay hidden).
  const usableIngredients = computed(() => usableIngredientIds(state.value.knownRecipeIds));
  const visibleInventory = computed(() => inventory.value.filter((item) => item.amount > 0 || usableIngredients.value.has(item.ingredientId)));
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
  const seatArrivals = computed(() => (state.value.seatNextCustomerAt ?? []).map((at, seat) => ({ seat, at, cost: arrivalSkipCrystalCost(at-nowMs.value), countdown: formatCountdown(Math.max(0, (at-nowMs.value)/1000)) })).filter(item => item.at > 0));
  const nextCustomerAt = computed(() => state.value.nextCustomerAt);
  const vipCooldownUntil = computed(() => state.value.vipCooldownUntil);
  const ownedCosmeticIds = computed(() => state.value.ownedCosmeticIds ?? []);
  const cosmeticCopies = computed(() => state.value.cosmeticCopies ?? {});
  // What can be given away because it only comes from boxes: moves to the friend and leaves this player.
  const giftableStyleItems = computed(() => giftableStyles(state.value));
  const giftableBackgrounds = computed(() => giftableInteriors(state.value));
  const rouletteSpinsLeft = computed(() => spinsLeft(state.value.roulette, today.value));
  const rouletteLast = computed(() => state.value.roulette.last);
  // The season pass: shown from the loot counters; a pass that has not been started by an action yet counts from zero.
  // The pass clock is the player's own: it began when the game first saw them (until then it starts now).
  const passEpoch = computed(() => state.value.pass.epoch || nowMs.value);
  const passNow = computed(() => passIdOf(passEpoch.value, nowMs.value));
  const passCurrent = computed(() => state.value.pass.id === passNow.value);
  const passEarned = computed(() => passPointsFor(state.value.loot.stats, passCurrent.value ? state.value.pass.base : state.value.loot.stats));
  const passPoints = computed(() => passEarned.value + (passCurrent.value ? state.value.pass.bonus ?? 0 : 0));
  const passLevelNow = computed(() => passLevel(passPoints.value));
  const passBase = computed(() => state.value.pass.base);
  const passPremium = computed(() => passCurrent.value && state.value.pass.premium);
  const passClaimed = computed(() => (passCurrent.value ? state.value.pass.claimed : []));
  const passReady = computed(() => readyPassRewards(passLevelNow.value, passPremium.value, passClaimed.value));
  const passTheme = computed(() => passThemeOf(passEpoch.value, nowMs.value));
  const passEnds = computed(() => passEndsOf(passEpoch.value, nowMs.value));
  const cosmeticRouletteAvailable = computed(() => rouletteSpinsLeft.value > 0);
  const loot = computed(() => state.value.loot);
  const availableEvents = computed(() => eventAvailability(state.value, nowMs.value));
  // Progress of an achievement counter (counted ones and ones read from what the player owns).
  const achievementStat = (stat: StatId) => statValue(state.value, stat);
  // The player profile (guests served, English, favourite bar, achievements) and the achievements the player may show.
  const profile = computed(() => buildPlayerProfile(state.value));
  const earnedAchievements = computed(() => earnedAchievementList(state.value));
  const setFeaturedAchievements = (ids: string[]) => dispatch({ type: 'setFeaturedAchievements', ids });
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
  const ruleContext = () => ({ now: clientNow(), checkEnglish, spawnCustomers: !trainingActive.value && mode.value !== 'online', training: trainingActive.value });
  // Online, these depend on hidden orders or on the server clock, so only the server can apply them.
  const SERVER_ONLY = new Set<GameAction['type']>(['collectTips', 'serveFood', 'say', 'serve', 'autoServe', 'openConversation', 'offerSimilar', 'sellBottle', 'rejectCustomer', 'tick', 'expediteCustomer', 'haggle', 'makeOffer', 'acceptDeal', 'completeDailyLesson', 'spinRoulette', 'claimPass', 'buyPassPremium', 'buyPassLevels', 'discardLoot', 'giveAshtray', 'cleanGuestAshtray', 'removeGuestAshtray', 'cleanAshtrays', 'pitchStart', 'pitchAsk', 'pitchCancel', 'hireStaff', 'upgradeStaff', 'giveWater', 'callTaxi', 'askToLeave', 'situationChoice', 'reportIssue', 'discardStock', 'openBox', 'pickReward', 'drawStyle', 'claimLeaderboardReward']);

  function saveOffline() {
    if (mode.value === 'online' || trainingActive.value) return;
    try { localStorage.setItem(OFFLINE_KEY, JSON.stringify(toRaw(state.value))); } catch { /* storage unavailable */ }
  }

  function adoptServerState(next: PlayerState, serverTime?: number, note?: string) {
    if (serverTime) serverOffset.value = serverTime - Date.now();
    if (trainingActive.value) { savedTrainingState = normalizePlayerState(next); return; }
    state.value = normalizePlayerState(next);
    nowMs.value = clientNow();
    if (note) message.value = note;
  }

  // The popup that tells the player what an action paid. Only actions that can give something are reported.
  const REWARD_TITLES: Partial<Record<GameAction['type'], string>> = {
    say: 'Payment received', serve: 'Drink served', autoServe: 'Drink served', sellBottle: 'Bottle sold', collectTips: 'Tips collected', serveFood: 'Food served', claimDaily: 'Daily reward', completeDailyLesson: 'Lesson complete',
    spinRoulette: 'Daily wheel', sell: 'Stock sold', exchangeCrystals: 'Crystals exchanged', situationChoice: 'Guest situation resolved',
    openBox: 'Chest opened', pickReward: 'Chest reward', drawStyle: 'Style draw', claimSpark: 'Season reward', craftSkin: 'New style', craftStyle: 'New style',
    claimQuest: 'Quest complete', claimAchievement: 'Achievement unlocked', claimLeaderboardReward: 'Weekly reward', recruitCompanion: 'Welcome to your Circle', buyInterior: 'New background', buyStyle: 'New style',
    claimPass: 'Season pass reward', buyPassLevels: 'Pass levels bought', discardLoot: 'Thrown away'
  };
  function showRewards(title: string, lines: RewardLine[]) {
    if (lines.length) rewardReport.value = { id: ++reportId, title, lines, celebration: !['Drink served', 'Bottle sold', 'Stock sold', 'Crystals exchanged', 'Guest situation resolved', 'Tips collected', 'Food served', 'Payment received'].includes(title) };
  }
  function reportAction(action: GameAction, before: Snapshot) {
    if (action.type === 'say' && state.value.money <= before.money) return;
    if (trainingActive.value) {
      if (action.type === 'serve' && state.value.customers.some(guest => guest.pendingPayment)) trainingPhase.value = 'payment';
      if (action.type === 'say' && state.value.money > before.money) trainingPhase.value = 'tips';
      if (action.type === 'collectTips') trainingPhase.value = 'complete';
      if (action.type === 'buy' && (action.cart.tonic ?? 0) > 0) trainingRestocked.value = true;
    }
    if (action.type === 'spinRoulette') return; // The wheel reveals its result after the animation.
    const title = REWARD_TITLES[action.type];
    if (title) showRewards(title, rewardLines(before, stateSnapshot(state.value), state.value.message));
  }
  const dismissRewards = () => { rewardReport.value = undefined; };

  function send(action: GameAction, before: Snapshot = stateSnapshot(state.value)) {
    const levelBefore = levelFor(state.value.xp ?? 0);
    return sendAction(action).then((result) => {
      if (result.state) adoptServerState(result.state, result.serverTime, result.ok ? result.message : result.error);
      if (trainingActive.value) return result.ok;
      if (result.ok) reportAction(action, before);
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
    const before = stateSnapshot(state.value);
    if (mode.value === 'online' && SERVER_ONLY.has(action.type)) {
      if (action.type === 'openConversation') state.value.conversationCustomerId = action.customerId;
      void send(action, before);
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
    if (mode.value === 'online') void send(action, before);
    else {
      reportAction(action, before);
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
      theftNotices.value=session.theftNotifications ?? [];
      if (session.received?.length) showRewards('Gifts from friends', session.received.map((text) => ({ kind: 'gift', text })));
      connectEpoch.value += 1;
      resetMix();
      void loadFriends();
    } catch {
      mode.value = 'offline';
      message.value = 'Offline practice: progress is saved on this device only.';
    }
  }

  const friendPrestige = ref(0);
  const friendError = (error: unknown, fallback: string) => { message.value = (error as Error)?.message || fallback; return false; };
  async function redeemPromoCode(code:string) {
    if (mode.value !== 'online') throw new Error('Connect to your account to redeem a promo code.');
    const result = await redeemPromo(code);
    if (!result.ok) throw new Error(result.error || 'Could not redeem this code.');
    if (result.state) adoptServerState(result.state,result.serverTime,result.message);
    showRewards('Rewards sent to Mail',[{kind:'gift',text:result.message ?? 'Claim your promo code rewards in Mail within 180 days.'}]);
    return result.message || 'Rewards received.';
  }
  async function loadFriends() {
    if (mode.value !== 'online') { friends.value = []; return false; }
    try {
      const result = await fetchFriends();
      if (!result.ok) throw new Error(result.error);
      friends.value = result.friends ?? [];
      playerFriendCode.value = result.friendCode ?? playerFriendCode.value;
      friendPrestige.value = result.prestige ?? friendPrestige.value;
      return true;
    } catch (error) { return friendError(error, 'Could not load friends.'); }
  }
  // Gifts that friends handed over while this player was online.
  async function claimGifts() {
    try {
      const result = await claimFriendGifts();
      if (!result.ok) throw new Error(result.error);
      if (result.state) adoptServerState(result.state, result.serverTime);
      if (result.received?.length) { showRewards('Gifts from friends', result.received.map((text) => ({ kind: 'gift' as const, text }))); playSfx('coin'); }
      return true;
    } catch (error) { return friendError(error, 'Could not open your gifts.'); }
  }
  async function addFriend(code: string) {
    try { const result = await requestFriend(code); if (!result.ok) throw new Error(result.error); message.value = result.message ?? 'Friend request sent.'; await loadFriends(); return true; }
    catch (error) { return friendError(error, 'Could not send the request.'); }
  }
  async function answerFriend(code: string, accept: boolean) {
    try { const result = await answerFriendRequest(code, accept); if (!result.ok) throw new Error(result.error); message.value = result.message ?? ''; await loadFriends(); return true; }
    catch (error) { return friendError(error, 'Could not answer the request.'); }
  }
  async function removeFriend(code: string) {
    try {
      const result = await removeFriendLink(code); if (!result.ok) throw new Error(result.error);
      if (visitedFriend.value?.code === code) visitedFriend.value = undefined;
      message.value = result.message ?? ''; await loadFriends(); return true;
    } catch (error) { return friendError(error, 'Could not remove this friend.'); }
  }
  async function renameFriend(code: string, label: string) {
    try { const result = await saveFriendLabel(code, label); if (!result.ok) throw new Error(result.error); if (result.state) adoptServerState(result.state, clientNow(), result.message); await loadFriends(); return true; }
    catch (error) { return friendError(error, 'Could not save the name.'); }
  }
  async function visitFriend(code: string) {
    try {
      const result = await visitFriendBar(code);
      if (!result.ok || !result.friend) throw new Error(result.error);
      if (result.state) adoptServerState(result.state, clientNow());
      visitedFriend.value = result.friend;
      message.value = result.rewarded ? `You visited ${result.friend.nickname}. They received +1 prestige.` : `Visiting ${result.friend.nickname}. Today's prestige was already given.`;
      void loadFriends();
      return true;
    } catch (error) { return friendError(error, 'Could not visit this bar.'); }
  }
  const leaveVisit = () => { visitedFriend.value = undefined; };
  const stealingTips = ref(false);
  async function stealVisitedTips() {
    if (!visitedFriend.value || stealingTips.value) return;
    const friend = visitedFriend.value;
    stealingTips.value = true;
    try {
      const result = await stealFriendTips(friend.code);
      if (!result.ok) throw new Error(result.error);
      if (result.state) adoptServerState(result.state, clientNow(), result.message);
      if (visitedFriend.value?.code === friend.code) visitedFriend.value.tips = result.tips;
      if (result.stolen) playSfx('coin');
      showRewards('Tip jar raid',[{kind:'tip',text:result.message ?? `You took ${Math.round(result.stolen ?? 0)} coins.`}]);
    } catch (error) { friendError(error, 'Could not take tips.'); }
    finally { stealingTips.value = false; }
  }
  async function giftFriend(gift: GiftRequest) {
    if (!visitedFriend.value) return false;
    try {
      const result = await sendFriendGift(visitedFriend.value.code, gift);
      if (!result.ok) throw new Error(result.error);
      if (result.state) adoptServerState(result.state, clientNow(), result.message);
      playSfx('coin');
      return true;
    } catch (error) { return friendError(error, 'The gift could not be sent.'); }
  }

  // ---- Clock ----
  let lastSyncTick = 0;
  function tickGameClock(now = clientNow()) {
    nowMs.value = now;
    if (trainingActive.value) { state.value.lastClockAt = now; return; }
    const before = state.value.customers.length;
    const draft = state.value;
    advanceClock(draft, { now, spawnCustomers: !trainingActive.value && mode.value !== 'online' });
    const arrivalDue = draft.nextCustomerAt > 0 && now >= draft.nextCustomerAt;
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
    if (state.value.seatNextCustomerAt) { const seat = state.value.seatNextCustomerAt.findIndex(time => time > 0); if (seat >= 0) state.value.seatNextCustomerAt[seat] = clientNow(); }
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
  const buyStyle = (cosmeticId: string) => dispatch({ type: 'buyStyle', cosmeticId });
  const chooseInterior = (interiorId: string) => state.value.ownedInteriorIds.includes(interiorId)
    ? dispatch({ type: 'setDecor', key: 'interior', value: interiorId }) : buyInterior(interiorId);
  const bottleCrystalCost = (productId: string) => bottleRestockCrystalCost(ALCOHOL_PRODUCTS.find((item) => item.id === productId)!);
  const buyBottleStock = (productId: string, quantity = 1) => dispatch({ type: 'buyBottleStock', productId, quantity });
  const expediteCustomer = (seatId?: number) => dispatch({ type: 'expediteCustomer', seatId });
  const claimDailyGift = () => dispatch({ type: 'claimDaily' });
  const completeDailyLesson = (lessonId: string, answer: string) => dispatch({ type: 'completeDailyLesson', lessonId, answer });
  const exchangeCrystals = (crystals: number) => dispatch({ type: 'exchangeCrystals', crystals });

  // Looking after the people at the bar.
  const giveAshtray = (customerId: string) => dispatch({ type: 'giveAshtray', customerId });
  const pitchStart = (customerId: string, kind: 'drink' | 'food', itemId: string) => dispatch({ type: 'pitchStart', customerId, kind, itemId });
  const pitchAsk = (customerId: string) => dispatch({ type: 'pitchAsk', customerId });
  const pitchCancel = (customerId: string) => dispatch({ type: 'pitchCancel', customerId });
  const houseRules = computed(() => rulesFor(state.value.regionId));
  const ruleViolations = computed(() => state.value.ruleViolations ?? 0);
  const barEvent = computed(() => barEventFor(state.value, nowMs.value));
  const offerChance = (customerId: string) => { const guest = state.value.customers.find((item) => item.id === customerId); return guest ? pitchChance(state.value, guest, nowMs.value) : undefined; };
  // Players who are already well into the game never need the tour.
  const tourSeen = computed(() => !!state.value.tour || state.value.xp >= 150);
  const setTour = (value: 'done' | 'skipped') => dispatch({ type: 'setTour', value });
  const topUp = () => dispatch({ type: 'topUp' });
  const topUpPreview = () => previewTopUp(state.value, clientNow());
  // The servers of the bar being managed: every bar has its own team.
  const staff = computed(() => state.value.staffByBar?.[state.value.regionId] ?? []);
  // The Circle: people who joined, shards, keepsakes and who works in this bar.
  const crewBonus = (bonus: BonusId, regionId?: string) => companionBonus(state.value, bonus, regionId);
  const circle = computed(() => state.value.companions ?? emptyCompanions());
  const recruitCompanion = (id: string) => dispatch({ type: 'recruitCompanion', id });
  const giveKeepsake = (id: string, kind: string) => dispatch({ type: 'giveKeepsake', id, kind });
  const buyKeepsake = (kind: string, quantity = 1) => dispatch({ type: 'buyKeepsake', kind, quantity });
  const assignCompanion = (id: string) => dispatch({ type: 'assignCompanion', id });
  const dismissCompanion = (id: string) => dispatch({ type: 'dismissCompanion', id });
  const spotlightCompanion = (id: string) => dispatch({ type: 'spotlightCompanion', id });
  const levelUpCompanion = (id: string) => dispatch({ type: 'levelUpCompanion', id });
  const hireStaff = () => dispatch({ type: 'hireStaff' });
  const upgradeStaff = (index: number) => dispatch({ type: 'upgradeStaff', index });
  const giveWater = (customerId: string) => dispatch({ type: 'giveWater', customerId });
  const callTaxi = (customerId: string) => dispatch({ type: 'callTaxi', customerId });
  const askToLeave = (customerId: string, tone: 'gentle' | 'firm' | 'aggressive') => dispatch({ type: 'askToLeave', customerId, tone });
  const cleanAshtrays = () => dispatch({ type: 'cleanAshtrays' });
  const foodRecommendations = (id:string) => { const guest = state.value.customers.find(item => item.id === id); return guest ? recommendedFoods(state.value, guest) : []; };
  const cleanGuestAshtray = (customerId:string) => dispatch({ type:'cleanGuestAshtray', customerId });
  const removeGuestAshtray = (customerId:string) => dispatch({ type:'removeGuestAshtray', customerId });
  // A situation that is open for a guest (a payment problem, a broken glass, an emergency): its title and the replies on offer.
  const situationOf = (customerId: string) => {
    const guest = state.value.customers.find((item) => item.id === customerId);
    const current = guest ? currentStage(guest) : undefined;
    if (!guest || !current) return undefined;
    const data = guest.social!.event!.data;
    const whispered = (state.value.loot.armed['whisper'] ?? 0) > 0;
    return {
      line: guestLine(state.value, guest), title: current.def.title, icon: current.def.icon, category: current.def.category, severity: current.def.severity,
      choices: visibleChoices(state.value, guest).map((choice) => ({ id: choice.id, say: fillSituationText(choice.say, data, region.value.currencySymbol), best: whispered && choice.tone === 'good' }))
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
  const spinRoulette = () => dispatch({ type:'spinRoulette' });
  const claimPass = (track: 'free' | 'premium', level: number) => dispatch({ type:'claimPass', track, level });
  const buyPassPremium = () => dispatch({ type:'buyPassPremium' });
  const buyPassLevels = (count: number) => dispatch({ type:'buyPassLevels', count });
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

  const act = (action: GameAction) => dispatch(action);
  return {
    mailMessage, collectMailReward, mailboxOpen, mailboxEntries, unreadMail, theftNotices, mailBusy, loadMailbox, openMailbox, dismissTheftNotices, decideMailGift, foodRecommendations, cleanGuestAshtray, removeGuestAshtray, trainingActive, trainingPhase, trainingRestocked, beginTraining, endTraining, preparationCustomerId, openPreparation, tipJar, tipJarCapacity, collectTips, stealVisitedTips, stealingTips,
    topUpPreview, circle, crewBonus, recruitCompanion, giveKeepsake, buyKeepsake, assignCompanion, dismissCompanion, spotlightCompanion, levelUpCompanion, achievementStat, profile, earnedAchievements, setFeaturedAchievements, mode, playerName, playerId, playerFriendCode, friends, visitedFriend, loadFriends, addFriend, answerFriend, removeFriend, renameFriend, visitFriend, leaveVisit, giftFriend, claimGifts, friendVisits, connect, rewardReport, dismissRewards, dailyOpen, economy, xpProgress, guestPriceFactor, nowMs, loot, availableEvents, act, visibleInventory, connectEpoch,
    upgradeRecipe, recipeLevels, recipeCopies, autoServe, setAutoSupply, autoSupply,
    negotiation, negotiationQuote, startNegotiation, haggle, makeOffer, acceptDeal, leaveNegotiation,
    regionId, region, money, crystals, xp, streak, level, serving, decor, bars, ownedBarIds, startingBarChosen, sessionReady, ownedInteriorIds, barBackground, barInteriorStyle,
    cosmetics:COSMETICS, ownedCosmeticIds, cosmeticCopies, cosmeticRouletteAvailable, passReady, passEarned, passCurrent, passBase, buyPassLevels, giftableStyleItems, giftableBackgrounds, rouletteSpinsLeft, rouletteLast, passPoints, passLevelNow, passPremium, passClaimed, passTheme, passEnds, claimPass, buyPassPremium, cosmeticGiftLog, canUseCosmetic, spinRoulette, popularity, popularityBoost, activatePopularityBoost,
    inventories, inventory, bottleInventories, bottleInventory, currentMix, shaken, customers, activeCustomerId, customer, hasCustomer, recipe, mixJudge,
    knownRecipeIds, recipeUnlockSources, knownRecipes, lockedRecipes, dailyGiftAvailable, dailyGiftResult, loginStreak, upcomingLoginDay, dailyCoinReward, dailyCrystalReward,
    dailyLessons, dailyLessonCompletedIds, dailyLessonsComplete, dailyLessonResult, learningStreak, learningStreakForToday, learningBonusPercent, completeDailyLesson,
    redeemPromoCode, conversationCustomerId, languageStats, seatArrivals, nextCustomerAt, nextCustomerInSeconds, nextCustomerCountdown, nextCustomerCrystalCost, vipCooldownUntil, orderCountdown, orderTimerPaused,
    message, market, selectedSupplier, transferTargetId, tradeLog, recipeCategory, filteredRecipes,
    pourBrands, brandOnShelf, shelfBrandsFor, setPourBrand,
    selectCustomer, addIngredient, resetMix, shakeCurrentMix, serveMix, tickPatience, tickGameClock, welcomeNextCustomer, offerSimilarOrder, rejectCustomer, buy, sell, switchBar, isBarOwned, nextBarPrice, barPurchaseLevel:BAR_PURCHASE_LEVEL, chooseStartingBar, buyBar, transferStock,
    supplier, localSuppliers, purchaseCart, saleCart, purchaseQuote, saleQuote, saleRevenue, deliveryOrders, deliveryCountdown, selectSupplier, checkoutPurchase, checkoutSale, renameBar, renameBartender,
    buyRecipe, recipePrice, buyInterior, buyStyle, chooseInterior, bottleCrystalCost, buyBottleStock, expediteCustomer, claimDailyGift, exchangeCrystals, giveAshtray, giveWater, callTaxi, pitchStart, pitchAsk, pitchCancel, topUp, tourSeen, setTour, staff, hireStaff, upgradeStaff, barEvent, offerChance, houseRules, ruleViolations, askToLeave, cleanAshtrays, ashtrays, situationOf, answerSituation, deliveryIssues, quarantine, lowGrade, reportIssue, discardStock, buyCrystalPack, buyingCrystals, starterPackAvailable, refreshDailyGift, openConversation, closeConversation, say, conversations, sellBottleToCustomer
  };
});

