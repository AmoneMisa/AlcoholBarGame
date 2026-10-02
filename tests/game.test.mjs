import { THEMED_INTERIORS } from '../src/data/cosmetics/themedBars.ts';
import test from 'node:test';
import assert from 'node:assert/strict';
import { createPinia,setActivePinia } from 'pinia';
import { nextTick } from 'vue';
import { checkText } from '../src/domain/english/checker.ts';
import { questionTemplates,tilesFor,withArticle,buildProfile,matchesFacts,sentenceWords,correctedTileSelection } from '../src/domain/conversation/customerTalk.ts';
import { INGREDIENTS,RECIPES,REGIONS,SUPPLIERS,estimateRecipeAbv,recipeAlcoholLabel } from '../src/domain/catalog.ts';
import { ALCOHOL_PRODUCTS,bottleRestockCrystalCost,bottleSaleCrystalReward } from '../src/domain/bottleCatalog.ts';
import { brandBottleArtIndex,ingredientBottleArtIndex,PAINTED_BOTTLE_COLUMNS,PAINTED_BOTTLE_ROWS } from '../src/domain/bottleArt.ts';
import { bottleQuestionTemplates,rankBottles } from '../src/domain/conversation/bottleTalk.ts';
import { createMarket,generateCustomer } from '../src/domain/engine.ts';
import { arrivalSkipCrystalCost,CRYSTAL_EXCHANGE_BUNDLES,crystalExchange,dailyCoinsFor,dailyCrystalsFor,consecutiveDays,quotePurchase,recipePurchase } from '../src/domain/economy.ts';
import { CHARACTER_ART,CUSTOMER_ART_BY_SLOT } from '../src/data/cosmetics/artCatalog.ts';
import { INTERIORS,COUNTER_MATERIALS,HAIR_STYLES,SKIN_DETAILS } from '../src/data/cosmetics/bars.ts';
import { useGameStore } from '../src/stores/game.ts';
import { COSMETICS } from '../src/domain/cosmetics.ts';
import { applyAction,RuleError } from '../src/sim/rules.ts';
import { createInitialState,withUniqueLook } from '../src/sim/state.ts';
import {
  CUSTOMER_ARRIVAL_MIN_MS,CUSTOMER_ARRIVAL_MAX_MS,VIP_COOLDOWN_MIN_MS,VIP_COOLDOWN_MAX_MS,
  VIP_CHANCE,VIP_RECIPE_CHANCE,canWelcomeVip,nextCustomerArrival,nextVipAvailability,orderTimeSeconds,vipCarriesRecipe
} from '../src/domain/customerTiming.ts';

const saves = new Map();
globalThis.localStorage = { getItem:key => saves.get(key) ?? null,setItem:(key,value) => saves.set(key,value) };
globalThis.window = { setTimeout,clearTimeout };
// The store plays with real randomness; tests that serve guests must not meet a random payment problem or drunk guest.
function freshGame() { saves.clear();Math.random = () => .5;setActivePinia(createPinia());return useGameStore(); }

test('Daily style draw unlocks modular face parts and a duplicate becomes a spare copy',() => {
  const state = createInitialState(Date.UTC(2026,8,30));
  const context = { now:Date.UTC(2026,8,30),random:()=>0,checkEnglish:(text)=>({ok:true,corrected:text}) };
  const first = COSMETICS.find((item) => item.character === 'noa');
  assert.ok(first);
  assert.throws(() => applyAction(state,{type:'setDecor',key:first.key,value:first.value},context),RuleError);
  applyAction(state,{type:'spinCosmeticRoulette'},context);
  assert.equal(state.ownedCosmeticIds.length,1);
  assert.throws(() => applyAction(state,{type:'spinCosmeticRoulette'},context),RuleError,'one draw per day');
  state.ownedCosmeticIds = COSMETICS.map((item) => item.id);
  state.cosmeticRouletteKey = '';
  applyAction(state,{type:'spinCosmeticRoulette'},context);
  const duplicate = COSMETICS[0];
  assert.equal(state.cosmeticCopies[duplicate.id],1);
});

test('Customer smoking trait is stable and never injected as incompatible dialogue text',() => {
  const guest = generateCustomer(2,RECIPES.slice(0,10));
  guest.id = 'stable-guest';
  const first = withUniqueLook(guest,[]).smoker;
  assert.equal(withUniqueLook(guest,[]).smoker,first);
  assert.doesNotMatch(`${guest.greeting} ${guest.request} ${guest.wish}`,/I don['’]t smoke/i);
});

test('The complete 80-cocktail book is valid and includes alcohol strength',() => {
  assert.equal(RECIPES.length,80);
  assert.equal(new Set(RECIPES.map((recipe) => recipe.id)).size,80);
  assert.equal(new Set(RECIPES.map((recipe) => recipe.name)).size,80);
  const ingredientIds = new Set(INGREDIENTS.map((ingredient) => ingredient.id));
  for (const recipe of RECIPES) {
    assert.ok(recipe.story.length > 30,`${recipe.name} needs a story`);
    assert.ok(recipe.method.length >= 3,`${recipe.name} needs a complete method`);
    assert.ok(recipe.occasions.length >= 3,`${recipe.name} needs guest/situation tags`);
    assert.ok(recipe.ingredients.every((part) => ingredientIds.has(part.ingredientId)),`${recipe.name} uses an unknown ingredient`);
    assert.ok(estimateRecipeAbv(recipe) > 0 && estimateRecipeAbv(recipe) < 50,`${recipe.name} needs a realistic ABV`);
    assert.match(recipeAlcoholLabel(recipe),/^~\d+% ABV · (Light|Medium|Strong)$/);
  }
  const game = freshGame();
  assert.equal(game.knownRecipes.length,10);
  assert.equal(game.lockedRecipes.length,70);
});

test('Bottle dialogue ranks stocked brands by quantity, budget, type and taste',() => {
  assert.equal(ALCOHOL_PRODUCTS.length,70);
  assert.equal(new Set(ALCOHOL_PRODUCTS.map((product) => product.id)).size,ALCOHOL_PRODUCTS.length);
  assert.ok(ALCOHOL_PRODUCTS.some((product) => product.brand === 'Jack Daniel’s'));
  assert.ok(ALCOHOL_PRODUCTS.some((product) => product.brand === 'Jim Beam'));
  assert.ok(ALCOHOL_PRODUCTS.some((product) => product.brand === 'Jägermeister'));
  assert.ok(ALCOHOL_PRODUCTS.filter((product) => product.type === 'champagne').length >= 2);
  for (const type of ['port-wine','cognac','beer','soju','sake','brandy','cider','sambuca','sangria','infusion','fruit-wine','non-alcoholic-beer','herbal-liqueur','specialty-liqueur']) assert.ok(ALCOHOL_PRODUCTS.some((product) => product.type === type),type);
  const facts = {quantity:1,budget:50,type:'whiskey',tastes:['smooth','vanilla'],occasion:'gift',preferredBrand:'Jack Daniel’s'};
  const ranked = rankBottles(facts,1);
  assert.equal(ranked[0].product.id,'jack-daniels-old-7');
  assert.ok(ranked[0].score >= 90);
  assert.ok(ranked.find((item) => item.product.id === 'johnnie-walker-black').overBudget);
  for (const {text} of bottleQuestionTemplates({},ranked)) assert.equal(checkText(text).ok,true,`${text}: ${JSON.stringify(checkText(text).issues)}`);
  for (const product of ALCOHOL_PRODUCTS) {
    const text = `Would you like ${product.name}?`;
    assert.equal(checkText(text).ok,true,`${text}: ${JSON.stringify(checkText(text).issues)}`);
  }
});

test('A confirmed full-bottle order consumes sealed stock and earns its retail price',async () => {
  const game = freshGame();
  const product = ALCOHOL_PRODUCTS.find((item) => item.id === 'jack-daniels-old-7');
  const customer = game.customer;
  customer.orderKind = 'bottle';
  customer.bottleRequest = {productId:product.id,quantity:1,budget:100,type:product.type,tastes:['smooth','vanilla'],occasion:'gift',preferredBrand:product.brand};
  customer.orderRevealed = false;
  const stock = game.bottleInventory.find((item) => item.productId === product.id);
  stock.quantity = 2;
  const balance = game.money;
  const crystals = game.crystals;
  assert.equal(game.openConversation(customer.id),true);
  await game.say(`Would you like ${product.name}?`);
  assert.equal(customer.orderRevealed,true,JSON.stringify(game.conversations[customer.id].lines.at(-1)));
  assert.ok(game.crystals >= crystals + 3 && game.crystals <= crystals + 15,'a perfect dialogue pays 3–15 crystals');
  const afterDialogue = game.crystals;
  assert.equal(game.sellBottleToCustomer(),true);
  assert.equal(stock.quantity,1);
  // A level-1 bar earns the guest's own rate (85% of the city price), fixed when they walked in.
  assert.ok(game.money >= balance + product.price * customer.priceFactor - .01);
  assert.equal(game.crystals,afterDialogue + bottleSaleCrystalReward(product));
});

test('Every suggested question is valid and can be built from its word bank',() => {
  const factSets = [[],[{topic:'sweet',likes:true}],[{topic:'sweet',likes:false},{topic:'rum',likes:true}],...RECIPES.map(recipe => [...buildProfile(recipe).traits].map(topic => ({topic,likes:true})))];
  for (const facts of factSets) {
    const candidates = RECIPES.filter(recipe => matchesFacts(recipe,facts));
    for (const {text} of questionTemplates(facts,candidates)) {
      const result = checkText(text);
      assert.equal(result.ok,true,`${text}: ${JSON.stringify(result.issues)}`);
      const remaining = tilesFor(text,RECIPES).map(tile => tile.text);
      const words = sentenceWords(text,RECIPES);
      for (const word of words) { const index = remaining.indexOf(word);assert.notEqual(index,-1,`Missing tile ${word} in ${text}`);remaining.splice(index,1); }
    }
  }
});

test('Correct common English is accepted, and corrections do not create more errors',() => {
  for (const text of ['Do you like lime?','I like coffee.','Would you like an Old Fashioned?','Have a nice day.','Do not worry.','I want something that makes me feel relaxed.','Would you like a drink with bubbles?']) assert.equal(checkText(text).ok,true,`${text}: ${JSON.stringify(checkText(text).issues)}`);
  for (const text of ['Does you likes rum?','Would you like an Mojito?','What you like?','I want try a drink.','i like rum','You like rum?']) {
    const result = checkText(text);assert.equal(result.ok,false,text);
    assert.equal(checkText(result.corrected).ok,true,`${text} => ${result.corrected}: ${JSON.stringify(checkText(result.corrected).issues)}`);
    const tiles = tilesFor(result.corrected,RECIPES);
    const ids = correctedTileSelection(result.corrected,tiles,RECIPES);
    assert.equal(ids.map(id => tiles.find(tile => tile.id === id).text).join(' ').replace(/\s+([?.!])/g,'$1'),result.corrected);
  }
  assert.equal(withArticle('Old Fashioned'),'an Old Fashioned');
  assert.equal(withArticle('Mojito'),'a Mojito');
});

test('Quotes calculate supplier deals, bulk tiers and free delivery after discounts',() => {
  const offers = createMarket(REGIONS[0],1);const supplier = SUPPLIERS[0];const offer = offers.find(item => item.supplierId === supplier.id);
  const small = quotePurchase(offers,{[offer.ingredientId]:1},supplier);
  assert.equal(small.delivery,supplier.deliveryFee);assert.equal(small.total,Number((offer.price + supplier.deliveryFee).toFixed(2)));
  const medium = quotePurchase(offers,{[offer.ingredientId]:5},supplier);assert.equal(medium.discountRate,.05);
  const large = quotePurchase(offers,{[offer.ingredientId]:30},supplier);assert.equal(large.discountRate,.10);assert.equal(large.delivery,0);
  assert.equal(quotePurchase(offers,{},supplier).total,0);
  assert.equal(quotePurchase(offers,{[offer.ingredientId]:Infinity},supplier).total,0);
  assert.equal(quotePurchase(offers,{[offer.ingredientId]:.5},supplier).total,0);
  for (const item of offers) assert.equal(item.price,Number((item.listPrice * (1 - item.discountPercent / 100)).toFixed(2)));
  assert.notEqual(createMarket(REGIONS[0],1)[0].price,createMarket(REGIONS[1],1)[0].price);
  assert.notEqual(createMarket(REGIONS[0],1)[0].price,createMarket(REGIONS[0],2)[0].price);
});

test('Login rewards grow to 500, reset after missed days and cross month boundaries',() => {
  assert.deepEqual([1,2,3,4,5,6,7,30].map(dailyCoinsFor),[100,150,200,260,320,400,500,500]);
  assert.equal(consecutiveDays('2026-09-27',4,new Date(2026,8,28)),5);
  assert.equal(consecutiveDays('2026-09-26',4,new Date(2026,8,28)),1);
  assert.equal(consecutiveDays('2026-09-30',6,new Date(2026,9,1)),7);
  assert.deepEqual([1,2,3,4,5,6,7,10,14].map(dailyCrystalsFor),[0,0,30,0,0,0,90,30,90]);
});

test('Every liquid and retail brand resolves to painted fantasy-label bottle art',() => {
  const cellCount = PAINTED_BOTTLE_COLUMNS * PAINTED_BOTTLE_ROWS;
  for (const ingredient of INGREDIENTS.filter((item) => item.unit === 'ml')) {
    const index = ingredientBottleArtIndex(ingredient.id);
    assert.ok(Number.isInteger(index) && index >= 0 && index < cellCount,`${ingredient.name} has painted bottle art`);
  }
  for (const product of ALCOHOL_PRODUCTS) {
    const index = brandBottleArtIndex(product.brand,product.type);
    assert.ok(index >= 0 && index < cellCount,`${product.brand} has a painted bottle cell`);
  }
});

test('Crystal prices cover locked backgrounds, advanced recipes, waiting time and profitable brand reserves',() => {
  assert.equal(INTERIORS[0].crystalCost,0);
  assert.ok(INTERIORS.slice(1).every((item) => item.crystalCost >= 350 && item.crystalCost <= 3500));
  // The themed backgrounds share one price on purpose; the original ones each have their own.
  const original = INTERIORS.filter((item) => !THEMED_INTERIORS.some((themed) => themed.id === item.id));
  assert.equal(new Set(original.map((item) => item.crystalCost)).size,original.length);
  const advanced = RECIPES.slice(10).map((recipe) => recipePurchase(recipe,RECIPES.indexOf(recipe)));
  assert.ok(advanced.filter((price) => price.currency === 'crystals').length > advanced.length / 2);
  assert.ok(advanced.filter((price) => price.currency === 'crystals').every((price) => price.amount >= 120 && price.amount <= 550));
  assert.equal(Math.min(...advanced.filter((price) => price.currency === 'crystals').map((price) => price.amount)),120);
  assert.equal(Math.max(...advanced.filter((price) => price.currency === 'crystals').map((price) => price.amount)),550);
  assert.equal(arrivalSkipCrystalCost(1),1);assert.equal(arrivalSkipCrystalCost(30 * 60_000),6);assert.equal(arrivalSkipCrystalCost(2 * 60 * 60_000),24);
  const premium = ALCOHOL_PRODUCTS.filter((product) => bottleRestockCrystalCost(product) > 0);
  assert.ok(premium.length >= 10 && premium.length < ALCOHOL_PRODUCTS.length);
  for (const product of premium) assert.ok(bottleSaleCrystalReward(product) > bottleRestockCrystalCost(product),product.name);
});

test('Crystal exchange offers only fixed one-way bundles with larger-bundle bonuses',() => {
  assert.deepEqual(CRYSTAL_EXCHANGE_BUNDLES.map((bundle) => bundle.crystals),[10,50,100,250]);
  assert.equal(crystalExchange(50)?.coins,1350);
  assert.equal(crystalExchange(11),undefined);
  const rates = CRYSTAL_EXCHANGE_BUNDLES.map((bundle) => bundle.coins / bundle.crystals);
  assert.ok(rates.every((rate,index) => index === 0 || rate >= rates[index - 1]));
});

test('Daily claim awards coins once, survives reload, and cannot be farmed by game shifts',async() => {
  const game = freshGame();const before = game.money;
  game.claimDailyGift();assert.equal(game.money,before + 100);assert.equal(game.loginStreak,1);
  game.claimDailyGift();assert.equal(game.money,before + 100);
  assert.equal('nextDay' in game,false,'there is no manual day-skip mechanic');assert.equal(game.dailyGiftAvailable,false);
  await nextTick();setActivePinia(createPinia());const reloaded = useGameStore();
  assert.equal(reloaded.dailyGiftAvailable,false);assert.equal(reloaded.money,game.money);
  assert.equal('gems' in reloaded,false);assert.equal('energy' in reloaded,false);
});

test('Bulk purchase is atomic and delivery goes to its original bar',() => {
  const game = freshGame();const offer = game.market.find(item => item.supplierId === 'global');
  const original = game.inventory.find(item => item.ingredientId === offer.ingredientId).amount;
  game.purchaseCart[offer.ingredientId] = 5;const quote = game.purchaseQuote;const balance = game.money;
  assert.equal(game.checkoutPurchase(),true);assert.equal(game.money,Number((balance - quote.total).toFixed(2)));assert.equal(game.deliveryOrders.length,1);
  assert.equal(game.inventory.find(item => item.ingredientId === offer.ingredientId).amount,original);
  const dueAt = game.deliveryOrders[0].dueAt;
  const london = game.inventories.london.find(item => item.ingredientId === offer.ingredientId).amount;
  game.tickGameClock(dueAt);
  assert.equal(game.deliveryOrders.length,0);
  assert.equal(game.inventories['new-york'].find(item => item.ingredientId === offer.ingredientId).amount,original + offer.quantity * 5);
  assert.equal(game.inventories.london.find(item => item.ingredientId === offer.ingredientId).amount,london);
  game.purchaseCart[offer.ingredientId] = 99;assert.ok(game.purchaseQuote.total > game.money);
  assert.equal(game.checkoutPurchase(),false);assert.equal(game.deliveryOrders.length,0);
});

test('Sale cannot consume reserved mix or leave negative stock',() => {
  const game = freshGame();const ingredient = INGREDIENTS[0];const initial = game.inventory[0].amount;
  game.addIngredient(ingredient.id,5);game.saleCart[ingredient.id] = initial;
  assert.equal(game.checkoutSale(),false);assert.equal(game.inventory[0].amount,initial);
  game.saleCart[ingredient.id] = initial - 5;const balance = game.money;const revenue = game.saleRevenue;
  assert.equal(game.checkoutSale(),true);assert.equal(game.inventory[0].amount,5);assert.equal(game.money,Number((balance + revenue).toFixed(2)));
});

test('Stock transfer respects the glass reservation, and invalid sale amounts do nothing',() => {
  const game = freshGame();const id = INGREDIENTS[0].id;const initial = game.inventory[0].amount;
  game.chooseStartingBar('new-york');game.ownedBarIds.push('london');
  const destination = game.inventories.london[0].amount;
  game.addIngredient(id,initial - 5);game.transferStock(id,'london');
  assert.equal(game.inventory[0].amount,initial - 5);
  assert.equal(game.inventories.london[0].amount,destination + 5);
  const balance = game.money;
  for (const quantity of [Infinity,NaN,-1,.5]) { game.saleCart[id] = quantity;assert.equal(game.checkoutSale(),false); }
  assert.equal(game.money,balance);
});

test('Bar names, bartender nicknames and styles are per-city and persisted; all 25 customer models are available',async() => {
  const game = freshGame();game.chooseStartingBar('new-york');game.ownedBarIds.push('london');game.ownedInteriorIds.push('skyline','cyberpunk');game.renameBar('North Star');game.decor.interior = 'skyline';
  game.switchBar('london');assert.notEqual(game.decor.name,'North Star');game.renameBar('Juniper Club');game.renameBartender('Night Fox');game.decor.bartenderCharacter = 'leo';game.decor.bartender = 'apron';game.decor.interior = 'cyberpunk';game.decor.counter = 'glass';game.decor.counterColor = 'navy';game.decor.counterSize = 'grand';game.decor.lighting = 'violet';game.decor.highlightStrength = 'bright';game.decor.face = 'angular';game.decor.hairStyle = 'undercut';game.decor.hairColor = 'blue';game.decor.bodyShape = 'muscular';game.decor.skinDetail = 'scar-brow';game.decor.pose = 'working';
  game.switchBar('new-york');assert.equal(game.decor.name,'North Star');assert.equal(game.decor.interior,'skyline');
  await nextTick();setActivePinia(createPinia());const reloaded = useGameStore();
  assert.equal(reloaded.bars.london.name,'Juniper Club');assert.equal(reloaded.bars.london.bartenderNickname,'Night Fox');assert.equal(reloaded.bars.london.bartenderCharacter,'leo');assert.equal(reloaded.bars.london.bartender,'apron');
  assert.equal(reloaded.bars.london.interior,'cyberpunk');assert.equal(reloaded.bars.london.counter,'glass');assert.equal(reloaded.bars.london.counterSize,'grand');assert.equal(reloaded.bars.london.hairStyle,'undercut');assert.equal(reloaded.bars.london.skinDetail,'scar-brow');assert.equal(reloaded.bars.london.pose,'working');
  assert.ok(INTERIORS.length >= 19);assert.ok(COUNTER_MATERIALS.length >= 8);assert.ok(HAIR_STYLES.length >= 8);assert.ok(SKIN_DETAILS.includes('clean') && SKIN_DETAILS.some(item => item.startsWith('tattoo')) && SKIN_DETAILS.some(item => item.startsWith('scar')));
  assert.equal(CUSTOMER_ART_BY_SLOT.length,25);
  assert.equal(game.customers.length,5,'a new player opens to a full row of five guests');
  assert.equal(new Set(game.customers.map(customer => customer.characterId)).size,5,'every starter guest has their own look');
  for (let i=0;i<30;i++) { const customer = generateCustomer();assert.ok(CHARACTER_ART.some(art => art.id === customer.characterId)); }
});

test('Customer arrivals, VIP rewards and the shared order timer follow the mobile service rules',() => {
  const base = 1_800_000_000_000;
  assert.equal(nextCustomerArrival(base,() => 0),base + CUSTOMER_ARRIVAL_MIN_MS);
  assert.equal(nextCustomerArrival(base,() => 1),base + CUSTOMER_ARRIVAL_MAX_MS);
  assert.equal(nextVipAvailability(base,() => 0),base + VIP_COOLDOWN_MIN_MS);
  assert.equal(nextVipAvailability(base,() => 1),base + VIP_COOLDOWN_MAX_MS);
  assert.equal(VIP_CHANCE,.10);assert.equal(VIP_RECIPE_CHANCE,.25);
  assert.equal(canWelcomeVip(base,base,() => .099),true);
  assert.equal(canWelcomeVip(base,base,() => .10),false);
  assert.equal(canWelcomeVip(base,base + 1,() => 0),false);
  assert.equal(vipCarriesRecipe(true,() => .249),true);
  assert.equal(vipCarriesRecipe(true,() => .25),false);
  assert.ok(orderTimeSeconds('vip','cocktail') > orderTimeSeconds('impatient','cocktail'));

  const game = freshGame();
  assert.equal(game.customers.length,5);
  const guest = game.customer;
  guest.orderKind = 'cocktail';guest.orderRecipeId = game.knownRecipes[0].id;guest.orderRevealed = true;guest.specialRecipeRewardId = game.lockedRecipes[0].id;
  const originalRecipe = guest.orderRecipeId;
  assert.equal(game.offerSimilarOrder(guest.id),true);
  assert.notEqual(guest.orderRecipeId,originalRecipe);
  assert.equal(guest.specialRecipeRewardId,undefined,'a substitute does not award the VIP’s requested recipe');

  const beforeDialog = guest.patienceRemaining;
  game.openConversation(guest.id);
  game.tickGameClock(Date.now() + 30_000);
  assert.equal(guest.patienceRemaining,beforeDialog,'the order timer pauses inside dialogue');
  game.closeConversation();
  game.tickGameClock(Date.now() + 31_000);
  assert.ok(guest.patienceRemaining < beforeDialog,'the same timer resumes for preparation');

  assert.equal(game.rejectCustomer(guest.id),true);
  assert.equal(game.customers.length,4,'only the served guest leaves; the rest of the row keeps waiting');
  assert.equal(game.customer.id,game.customers[0].id,'the next guest in the row is served');
  assert.equal(game.nextCustomerAt,0,'nobody new is scheduled while guests are still seated');
  while (game.customers.length) assert.equal(game.rejectCustomer(game.customer.id),true);
  assert.ok(game.nextCustomerAt - Date.now() >= CUSTOMER_ARRIVAL_MIN_MS - 1000);
  assert.ok(game.nextCustomerAt - Date.now() <= CUSTOMER_ARRIVAL_MAX_MS + 1000);
  game.tickGameClock(game.nextCustomerAt);
  assert.equal(game.customers.length,1);
});

test('Older saves derive a bartender nickname from the selected model',() => {
  saves.clear();
  saves.set('barlingo-economy-v1',JSON.stringify({version:1,bars:{'new-york':{name:'Legacy Bar',bartenderCharacter:'leo'}}}));
  setActivePinia(createPinia());
  const game = useGameStore();
  assert.equal(game.decor.bartenderCharacter,'leo');
  assert.equal(game.decor.bartenderNickname,'Leo');
});

test('Broken word order is rejected and only a buildable, valid phrase is suggested', () => {
  const target = 'Do you like sour drinks?';
  for (const text of ['Do is like an more sour?', 'Is do you like sweet?', 'Like you do sour drinks?', 'Do you drinks like sour?', 'Would like you a Mojito?', 'Do does you like sweet drinks?', 'Do you like sweet drinks to?']) {
    const result = checkText(text, [target, 'Would you like a Mojito?', 'Do you like sweet drinks?']);
    assert.equal(result.ok, false, text);
    assert.equal(checkText(result.corrected).ok, true, `${text} => ${result.corrected}`);
  }
  assert.equal(checkText('Do is like an more sour?', [target]).corrected, target);
  assert.equal(checkText('Do you like more sour drinks?').ok, true);
});

test('Every checker issue names a rule, and every rule example agrees with the checker', async () => {
  const { RULES } = await import('../src/domain/english/rules.ts');
  for (const text of ['do you likes sweet drinks', 'What you like?', 'Would like you a Mojito?', 'I want something, which make me more happy', 'Would you like a Old Fashioned?', 'Do you want somthing?']) {
    for (const issue of checkText(text).issues) assert.ok(issue.rule && RULES[issue.rule], `${text}: “${issue.message}” has no rule`);
  }
  for (const rule of Object.values(RULES)) {
    for (const example of rule.examples) {
      if (!/[.?!]$/.test(example.right)) continue;
      const right = checkText(example.right);
      assert.equal(right.ok, true, `${rule.id}: “${example.right}” should be correct: ${JSON.stringify(right.issues.map((item) => item.message))}`);
    }
  }
});

test('Every bartender and seller phrase lesson is correct English, and every job has lessons and words', async () => {
  const { PHRASE_GROUPS } = await import('../src/domain/english/phrases.ts');
  const { VOCABULARY, TOPIC_CONTEXT } = await import('../src/domain/english/vocabulary.ts');
  for (const group of PHRASE_GROUPS) {
    for (const lesson of group.lessons) {
      const result = checkText(lesson.text);
      assert.equal(result.ok, true, `${group.id}: “${lesson.text}” ${JSON.stringify(result.issues.map((item) => item.message))}`);
      assert.equal(lesson.parts.map((part) => part.text).join(' '), lesson.text, `${group.id}: parts must spell the whole phrase`);
    }
  }
  for (const job of ['bar', 'shop', 'buyer']) {
    assert.ok(PHRASE_GROUPS.filter((group) => group.context === job).length >= 5, `${job} phrase groups`);
    assert.ok(VOCABULARY.filter((entry) => TOPIC_CONTEXT[entry.topic] === job).length >= 15, `${job} words`);
  }
  assert.equal(new Set(VOCABULARY.map((entry) => entry.word)).size, VOCABULARY.length, 'no duplicate words');
});

test('Every recipe and ingredient has a complete guide, and every pairing has a principle', async () => {
  const { guideFor, recipeCard, hasHistory } = await import('../src/data/knowledge/guides.ts');
  const { INGREDIENT_GUIDES } = await import('../src/data/knowledge/ingredients.ts');
  const { explainPairing } = await import('../src/domain/pairingExplain.ts');
  const { BAR_PAIRINGS } = await import('../src/data/pairings/barPairings.ts');
  for (const recipe of RECIPES) {
    const guide = guideFor(recipe);
    assert.ok(hasHistory(recipe.id), `hand-written history for ${recipe.id}`);
    assert.ok(guide.timeline.length >= 1 && guide.history.length > 120 && guide.preparation.why && guide.chooseWhen.length && guide.compare.length, `complete guide for ${recipe.id}`);
    assert.equal(guide.preparation.technique === 'shaken', recipe.needsShake, `${recipe.id}: technique matches the game (shake or not)`);
    const card = recipeCard(recipe);
    for (const part of recipe.ingredients) assert.ok(card.lines.some((line) => line.ingredientId === part.ingredientId && line.amount && line.action), `${recipe.id}: card says what to do with ${part.ingredientId}`);
  }
  for (const ingredient of INGREDIENTS) {
    const guide = INGREDIENT_GUIDES[ingredient.id];
    assert.ok(guide && guide.history && guide.howToUse && guide.sellingTip, `guide for ${ingredient.id}`);
  }
  const pairings = [];
  const walk = (node) => { if (Array.isArray(node)) node.forEach(walk); else if (node && typeof node === 'object') { if (typeof node.why === 'string') pairings.push(node); Object.values(node).forEach(walk); } };
  walk(BAR_PAIRINGS);
  assert.ok(pairings.length > 700);
  for (const pairing of pairings) assert.ok(explainPairing(pairing).length >= 1);
});

test('Every bartender and seller lesson phrase is understood by a customer in its real situation', async () => {
  const { PHRASE_GROUPS } = await import('../src/domain/english/phrases.ts');
  const { serviceReply } = await import('../src/domain/conversation/serviceTalk.ts');
  const { replyTo, buildProfile, findRecipeMention } = await import('../src/domain/conversation/customerTalk.ts');
  const { replyToBottle, findBottleMention } = await import('../src/domain/conversation/bottleTalk.ts');
  const drinkGuest = { id: 'guest-1', name: 'Ana', mood: 'friendly', paymentMethod: 'card', orderRecipeId: 'mojito' };
  const shopper = { id: 'shopper-1', name: 'Leo', mood: 'calm', paymentMethod: 'cash', orderKind: 'bottle', greeting: 'Hello!',
    bottleRequest: { productId: 'x', quantity: 2, budget: 80, type: 'gin', tastes: ['herbal'], occasion: 'party' } };
  const profile = buildProfile(RECIPES.find((recipe) => recipe.id === 'mojito'));
  const notUnderstood = /don’t understand|Please ask about quantity/;
  for (const group of PHRASE_GROUPS) {
    // Buyer lessons are answered by a supplier's sales rep: see the negotiation test in trade.test.mjs.
    if (group.context === 'buyer' || group.id.startsWith('sit-')) continue; // answered by suppliers / by the situation scripts (see situations.test.mjs)
    const confirmed = ['serve', 'shop-pay'].includes(group.id);
    for (const lesson of group.lessons) {
      const bottle = group.context === 'shop';
      const guest = bottle ? shopper : drinkGuest;
      const namesOrder = !!findRecipeMention(lesson.text, RECIPES) || !!findBottleMention(lesson.text);
      const reply = (namesOrder ? undefined : serviceReply(lesson.text, { customer: guest, kind: bottle ? 'bottle' : 'drink', confirmed }))
        ?? (bottle ? replyToBottle(lesson.text, shopper, {}) : replyTo(lesson.text, drinkGuest, profile, RECIPES, []));
      assert.doesNotMatch(reply.text, notUnderstood, `${group.id}: “${lesson.text}” → “${reply.text}”`);
    }
  }
});

test('Every alcohol has famous brands, and every shop bottle leads to a guide that lists its brand', async () => {
  const { BRANDS, EXTRA_ALCOHOL_GUIDES, shopProductsFor, guideIdForProduct } = await import('../src/data/knowledge/alcohol.ts');
  const { INGREDIENT_GUIDES } = await import('../src/data/knowledge/ingredients.ts');
  const { ALCOHOL_PRODUCTS } = await import('../src/domain/bottleCatalog.ts');
  const alcohol = Object.values(INGREDIENT_GUIDES).filter((guide) => ['spirit', 'liqueur', 'wine'].includes(guide.kind));
  for (const guide of [...alcohol, ...Object.values(EXTRA_ALCOHOL_GUIDES)]) {
    assert.ok((BRANDS[guide.id]?.length ?? 0) >= 3, `brands for ${guide.id}`);
    for (const brand of BRANDS[guide.id]) assert.ok(brand.description.length > 40 && brand.from && brand.since, `${brand.name} is described`);
  }
  for (const product of ALCOHOL_PRODUCTS) {
    const guideId = guideIdForProduct(product);
    assert.ok(INGREDIENT_GUIDES[guideId] || EXTRA_ALCOHOL_GUIDES[guideId], `${product.id} → guide ${guideId}`);
    assert.ok(BRANDS[guideId].some((brand) => shopProductsFor(brand).some((item) => item.id === product.id)), `${product.brand} is listed in the ${guideId} guide`);
  }
});

test('Hundreds of described brands, each with a bottle model; signature cocktails point to real brands', async () => {
  const { BRANDS } = await import('../src/data/knowledge/alcohol.ts');
  const { lookFor, bottlePath, labelText } = await import('../src/data/knowledge/brandModels.ts');
  const { SIGNATURE_BRANDS } = await import('../src/data/knowledge/signatureBrands.ts');
  const all = Object.entries(BRANDS).flatMap(([category, brands]) => brands.map((brand) => ({ category, brand })));
  assert.ok(all.length >= 250, `brand count ${all.length}`);
  for (const { category, brand } of all) {
    assert.ok(brand.description.length > 30 && brand.from && brand.since, `${brand.name} is described`);
    const look = lookFor(brand.name, category);
    assert.ok(bottlePath(look.shape).startsWith('M') && look.glass && look.label && labelText(brand.name).length > 0, `${brand.name} has a bottle model`);
  }
  for (const category of Object.keys(BRANDS)) assert.equal(new Set(BRANDS[category].map((brand) => brand.name)).size, BRANDS[category].length, `no duplicate brands in ${category}`);
  for (const [recipeId, list] of Object.entries(SIGNATURE_BRANDS)) {
    assert.ok(RECIPES.some((recipe) => recipe.id === recipeId), `recipe ${recipeId} exists`);
    const recipe = RECIPES.find((item) => item.id === recipeId);
    for (const item of list) {
      assert.ok(BRANDS[item.category]?.some((brand) => brand.name === item.brand), `${recipeId}: ${item.brand} is a described brand`);
      if (item.ingredientId) assert.ok(recipe.ingredients.some((part) => part.ingredientId === item.ingredientId), `${recipeId}: uses ${item.ingredientId}`);
    }
  }
});

test('Brand calls: the guest names a brand, the bartender must pick that brand; signature brands earn a bonus', async () => {
  const { serveRecipe, serveRequestText, servableProducts, replyToServe, substitutesFor } = await import('../src/domain/brandServe.ts');
  const { signatureBonus } = await import('../src/domain/brandPours.ts');
  assert.ok(servableProducts().length >= 20, 'many brands can be ordered by name');
  const request = { productId: 'jack-daniels-old-7', style: 'rocks' };
  assert.equal(serveRequestText(request), 'Jack Daniel’s on the rocks, please.');
  assert.deepEqual(serveRecipe(request).ingredients, [{ ingredientId: 'whiskey', amount: 50 }, { ingredientId: 'ice', amount: 3 }]);
  assert.equal(checkText('Sorry, we don’t have Jack Daniel’s. Would you like Jameson instead?').ok, true, 'brand names are valid English');

  const game = freshGame();
  const guest = game.customers[0];
  Object.assign(guest, { orderKind: 'serve', serveRequest: request, orderRevealed: true, request: serveRequestText(request) });
  game.selectCustomer(guest.id);
  game.addIngredient('whiskey', 50); game.addIngredient('ice', 3);
  const before = game.money;
  const crystals = game.crystals;
  game.serveMix();
  assert.match(game.message, /asked for Jack Daniel’s/);
  assert.equal(game.money, before, 'no sale without the right brand');
  game.setPourBrand('whiskey', 'jameson');
  game.serveMix();
  assert.match(game.message, /asked for Jack Daniel’s/, 'wrong brand is refused');
  game.setPourBrand('whiskey', 'jack-daniels-old-7');
  game.serveMix();
  assert.ok(game.money > before, `sold: ${game.message}`);
  assert.ok(game.crystals > crystals,'a named-brand drink pays crystals as well as coins');

  // Offering another brand of the same spirit when the requested one is missing.
  const onShelf = (id) => id !== 'jack-daniels-old-7';
  assert.ok(substitutesFor(request, onShelf).some((product) => product.id === 'jameson'));
  const accept = replyToServe('Sorry, we don’t have Jack Daniel’s. Would you like Jameson instead?', { ...guest, serveRequest: request }, onShelf);
  assert.equal(accept.switchTo, 'jameson');
  const refuse = replyToServe('Would you like Absolut instead?', { ...guest, serveRequest: request }, onShelf);
  assert.equal(refuse.switchTo, undefined, 'a vodka is not a whiskey substitute');

  assert.equal(signatureBonus('negroni', { 'bitter-aperitif': 'campari' }), 'Campari');
  assert.equal(signatureBonus('negroni', {}), undefined);
});

test('The brand picker only offers real pours of the ingredient (no cognac as whiskey, no sambuca as bitter)', async () => {
  const { pourableBrand } = await import('../src/domain/brandServe.ts');
  const { ALCOHOL_PRODUCTS } = await import('../src/domain/bottleCatalog.ts');
  const game = freshGame();
  const whiskeyBrands = game.shelfBrandsFor('whiskey');
  assert.ok(whiskeyBrands.length > 0);
  assert.ok(whiskeyBrands.every((product) => ['whiskey', 'bourbon'].includes(product.type)), whiskeyBrands.map((product) => product.type).join(','));
  assert.ok(ALCOHOL_PRODUCTS.filter((product) => ['cognac', 'sambuca', 'beer'].includes(product.type)).every((product) => !pourableBrand(product)));
});

test('Actions keep working after one delivery arrives while another is still on the way',() => {
  const game = freshGame();
  const [fast, slow] = [SUPPLIERS.find((item) => item.id === 'fresh'), SUPPLIERS.find((item) => item.id === 'local')];
  for (const supplier of [fast, slow]) {
    game.selectSupplier(supplier.id);
    const offer = game.market.find((item) => item.supplierId === supplier.id);
    game.purchaseCart[offer.ingredientId] = 1;
    assert.equal(game.checkoutPurchase(),true);
  }
  assert.equal(game.deliveryOrders.length,2);
  game.tickGameClock(Math.min(...game.deliveryOrders.map((order) => order.dueAt)));
  assert.equal(game.deliveryOrders.length,1,'the faster delivery arrived');
  assert.equal(game.chooseStartingBar('london'),true,'later actions still apply (the state can still be copied and saved)');
  assert.equal(game.regionId,'london');
});

test('The newer vocabulary is complete: sentences are correct English and every topic belongs to a job', async () => {
  const { MORE_VOCABULARY } = await import('../src/domain/english/vocabularyMore.ts');
  const { VOCABULARY, VOCAB_TOPICS, TOPIC_CONTEXT } = await import('../src/domain/english/vocabulary.ts');
  assert.ok(MORE_VOCABULARY.length >= 70, 'at least 70 new words, found ' + MORE_VOCABULARY.length);
  for (const topic of VOCAB_TOPICS) assert.ok(['bar', 'shop', 'buyer', 'both'].includes(TOPIC_CONTEXT[topic]), topic + ' has a job');
  for (const entry of MORE_VOCABULARY) {
    assert.ok(VOCAB_TOPICS.includes(entry.topic), entry.word + ': known topic');
    assert.ok(entry.ipa.startsWith('/') && entry.ipa.endsWith('/'), entry.word + ': pronunciation in slashes');
    assert.ok(entry.meaning.length > 8 && entry.example.length > 8, entry.word + ': meaning and example');
    const result = checkText(entry.example);
    assert.equal(result.ok, true, entry.word + ': “' + entry.example + '” ' + JSON.stringify(result.issues.map((item) => item.message)));
  }
  assert.equal(new Set(VOCABULARY.map((entry) => entry.word.toLowerCase())).size, VOCABULARY.length, 'no duplicate words, ignoring case');
});

test('The reward report lists what an action paid: payment, tip, crystals, XP, level and new recipes', async () => {
  const { rewardLines, snapshot } = await import('../src/domain/rewards.ts');
  const before = createInitialState(Date.UTC(2026, 8, 30));
  const after = structuredClone(before);
  after.money += 25; after.crystals += 30; after.xp += 400;
  after.knownRecipeIds.push(RECIPES.find((recipe) => !before.knownRecipeIds.includes(recipe.id)).id);
  const lines = rewardLines(snapshot(before), snapshot(after), 'Perfect service. Tip +5 coins.');
  const text = lines.map((line) => line.text).join(' | ');
  assert.match(text, /\+20 coins/);
  assert.match(text, /\+5 coins tip/);
  assert.match(text, /\+30 crystals/);
  assert.match(text, /\+400 XP/);
  assert.match(text, /New recipe: /);
  assert.deepEqual(rewardLines(snapshot(before), snapshot(before)), [], 'nothing gained, nothing to show');
});
