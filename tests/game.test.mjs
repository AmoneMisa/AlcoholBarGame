import test from 'node:test';
import assert from 'node:assert/strict';
import { createPinia,setActivePinia } from 'pinia';
import { nextTick } from 'vue';
import { checkText } from '../src/domain/english/checker.ts';
import { questionTemplates,tilesFor,withArticle,buildProfile,matchesFacts,sentenceWords,correctedTileSelection } from '../src/domain/conversation/customerTalk.ts';
import { INGREDIENTS,RECIPES,REGIONS,SUPPLIERS } from '../src/domain/catalog.ts';
import { createMarket,generateCustomer } from '../src/domain/engine.ts';
import { dailyCoinsFor,consecutiveDays,quotePurchase } from '../src/domain/economy.ts';
import { CHARACTER_ART } from '../src/data/cosmetics/artCatalog.ts';
import { useGameStore } from '../src/stores/game.ts';

const saves = new Map();
globalThis.localStorage = { getItem:key => saves.get(key) ?? null,setItem:(key,value) => saves.set(key,value) };
globalThis.window = { setTimeout,clearTimeout };
function freshGame() { saves.clear();setActivePinia(createPinia());return useGameStore(); }

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
  assert.equal(small.delivery,8);assert.equal(small.total,Number((offer.price + 8).toFixed(2)));
  const medium = quotePurchase(offers,{[offer.ingredientId]:5},supplier);assert.equal(medium.discountRate,.05);
  const large = quotePurchase(offers,{[offer.ingredientId]:10},supplier);assert.equal(large.discountRate,.10);assert.equal(large.delivery,0);
  assert.equal(quotePurchase(offers,{},supplier).total,0);
  assert.equal(quotePurchase(offers,{[offer.ingredientId]:Infinity},supplier).total,0);
  assert.equal(quotePurchase(offers,{[offer.ingredientId]:.5},supplier).total,0);
  for (const item of offers) assert.equal(item.price,Number((item.listPrice * (1 - item.discountPercent / 100)).toFixed(2)));
  assert.notEqual(createMarket(REGIONS[0],1)[0].price,createMarket(REGIONS[1],1)[0].price);
  assert.notEqual(createMarket(REGIONS[0],1)[0].price,createMarket(REGIONS[0],2)[0].price);
});

test('Login rewards grow to 1000, reset after missed days and cross month boundaries',() => {
  assert.deepEqual([1,2,3,4,5,6,7,30].map(dailyCoinsFor),[150,250,400,550,700,850,1000,1000]);
  assert.equal(consecutiveDays('2026-09-27',4,new Date(2026,8,28)),5);
  assert.equal(consecutiveDays('2026-09-26',4,new Date(2026,8,28)),1);
  assert.equal(consecutiveDays('2026-09-30',6,new Date(2026,9,1)),7);
});

test('Daily claim awards coins once, survives reload, and cannot be farmed by game shifts',async() => {
  const game = freshGame();const before = game.money;
  game.claimDailyGift();assert.equal(game.money,before + 150);assert.equal(game.loginStreak,1);
  game.claimDailyGift();assert.equal(game.money,before + 150);
  game.nextDay();assert.equal(game.dailyGiftAvailable,false);
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
  game.switchBar('london');const london = game.inventory.find(item => item.ingredientId === offer.ingredientId).amount;
  for (let day=0;day<3;day++) game.nextDay();
  assert.equal(game.deliveryOrders.length,0);
  assert.equal(game.inventories['new-york'].find(item => item.ingredientId === offer.ingredientId).amount,original + offer.quantity * 5);
  assert.equal(game.inventory.find(item => item.ingredientId === offer.ingredientId).amount,london);
  game.purchaseCart[offer.ingredientId] = 99;game.money = 0;
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
  const destination = game.inventories.london[0].amount;
  game.addIngredient(id,initial - 5);game.transferStock(id,'london');
  assert.equal(game.inventory[0].amount,initial - 5);
  assert.equal(game.inventories.london[0].amount,destination + 5);
  const balance = game.money;
  for (const quantity of [Infinity,NaN,-1,.5]) { game.saleCart[id] = quantity;assert.equal(game.checkoutSale(),false); }
  assert.equal(game.money,balance);
});

test('Bar names and styles are per-city and persisted; all 15 customer models are available',async() => {
  const game = freshGame();game.renameBar('North Star');game.decor.interior = 'skyline';
  game.switchBar('london');assert.notEqual(game.decor.name,'North Star');game.renameBar('Juniper Club');game.decor.bartender = 'apron';
  game.switchBar('new-york');assert.equal(game.decor.name,'North Star');assert.equal(game.decor.interior,'skyline');
  await nextTick();setActivePinia(createPinia());const reloaded = useGameStore();
  assert.equal(reloaded.bars.london.name,'Juniper Club');assert.equal(reloaded.bars.london.bartender,'apron');
  assert.equal(CHARACTER_ART.filter(art => art.id !== 'noa').length,15);
  assert.equal(new Set(game.customers.map(customer => customer.characterId)).size,5);
  for (let i=0;i<30;i++) { const customer = generateCustomer();assert.ok(CHARACTER_ART.some(art => art.id === customer.characterId)); }
});
