<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { INGREDIENTS, RECIPES, REGIONS, recipeAlcoholLabel } from '../../domain/catalog';
import { ALCOHOL_PRODUCTS, ALCOHOL_TYPE_LABELS, bottleSaleCrystalReward } from '../../domain/bottleCatalog';
import BrandBottle from '../knowledge/BrandBottle.vue';
import { guideIdForProduct } from '../../data/knowledge/alcohol';
import { BARTENDER_FACES, BODY_SHAPES, BUST_OPTIONS, COUNTER_COLORS, COUNTER_MATERIALS, COUNTER_SIZES, HAIR_COLORS, HAIR_STYLES, HIGHLIGHTS, HIGHLIGHT_STRENGTHS, INTERIORS, MAKEUP_OPTIONS, POSES, SHELF_STYLES, SKIN_DETAILS, SKIN_TONES, TAN_LEVELS, WALLS, interiorStyle, shelfStyleFor } from '../../data/cosmetics/bars';
import { DAILY_COINS } from '../../domain/economy';
import type { Ingredient, RegionId } from '../../domain/types';
import { useGameStore } from '../../stores/game';
import BottleModel from '../cocktails/BottleModel.vue';
import RecipeMastery from '../cocktails/RecipeMastery.vue';
import GlassModel from '../cocktails/GlassModel.vue';
import CharacterModel from '../characters/CharacterModel.vue';
import PairingAdvisor from '../PairingAdvisor.vue';
import MarketPanel from './MarketPanel.vue';
import { useGuide } from '../../composables/useGuide';
import { recipeCard } from '../../data/knowledge/guides';
import WorldMap from './WorldMap.vue';

withDefaults(defineProps<{ activeView?: string }>(), { activeView: 'inventory' });
const game = useGameStore();
const stockCategory = ref<'all' | 'spirit' | 'mixer' | 'fresh'>('all');
const selectedRecipeId = ref<string | null>(null);
const recipeMode = ref<'library' | 'shop'>('library');
const transferIngredientId = ref(INGREDIENTS[0]!.id);
const barName = ref(game.decor.name);
const bartenderNickname = ref(game.decor.bartenderNickname ?? (game.decor.bartenderCharacter === 'leo' ? 'Leo' : 'Noa'));
watch(() => game.regionId, () => {
  barName.value = game.decor.name;
  bartenderNickname.value = game.decor.bartenderNickname ?? (game.decor.bartenderCharacter === 'leo' ? 'Leo' : 'Noa');
});

const ingredientById = (id: string) => INGREDIENTS.find((item) => item.id === id)!;
const bottleById = (id: string) => ALCOHOL_PRODUCTS.find((item) => item.id === id)!;
const uiCategory = (ingredient: Ingredient) => ingredient.category === 'spirit' ? 'spirit' : ingredient.category === 'mixer' && !['sugar-syrup', 'coconut-cream', 'milk', 'coconut-milk'].includes(ingredient.id) ? 'mixer' : 'fresh';
const visibleStock = computed(() => game.inventory.filter((stock) => stockCategory.value === 'all' || uiCategory(ingredientById(stock.ingredientId)) === stockCategory.value));
const { openGuide } = useGuide();
// What to do with each ingredient of the open recipe (pour, top up, garnish…), from the recipe card.
const formulaActions = computed(() => selectedRecipe.value ? new Map(recipeCard(selectedRecipe.value).lines.filter((line) => line.ingredientId).map((line) => [line.ingredientId!, line.action])) : new Map<string, string>());
const selectedRecipe = computed(() => RECIPES.find((recipe) => recipe.id === selectedRecipeId.value) ?? null);
const selectedRecipeIndex = computed(() => Math.max(0, RECIPES.findIndex((recipe) => recipe.id === selectedRecipeId.value)));
const targetRegions = computed(() => REGIONS.filter((region) => region.id !== game.regionId && game.isBarOwned(region.id)));
const barUnits = (id: RegionId) => game.inventories[id].reduce((sum, stock) => sum + stock.amount, 0);
const barBottles = (id: RegionId) => game.bottleInventories[id].reduce((sum, stock) => sum + stock.quantity, 0);
const selectedBartender = computed(() => game.decor.bartenderCharacter ?? 'noa');
const visibleHairStyles = computed(() => selectedBartender.value === 'leo' ? HAIR_STYLES.filter((style) => ['slick','short','undercut'].includes(style)) : HAIR_STYLES.filter((style) => ['updo','waves','bob','ponytail','braids'].includes(style)));
const outfitLabel = (outfit: 'base' | 'vest' | 'shirt' | 'apron') => ({
  noa: { base: 'Mannequin', vest: 'Corset vest', shirt: 'Ivory jacket', apron: 'Emerald apron' },
  leo: { base: 'Mannequin', vest: 'Velvet vest', shirt: 'Open shirt', apron: 'Work apron' }
}[selectedBartender.value][outfit]);
const isRecipeKnown = (id: string) => game.knownRecipeIds.includes(id);
const recipeCardInventory = computed(() => RECIPES.map((recipe) => ({ recipe, quantity: game.recipeCopies[recipe.id] ?? 0 })).filter((item) => item.quantity > 0));
const isInteriorOwned = (id: string) => game.ownedInteriorIds.includes(id);
const recipePriceLabel = (id: string) => {
  const price = game.recipePrice(id);
  return `${price.amount} ${price.currency}`;
};
const barPriceLabel = () => game.nextBarPrice.currency === 'coins' ? `${game.nextBarPrice.amount.toLocaleString()} coins` : `◆ ${game.nextBarPrice.amount.toLocaleString()}`;
const barActionLabel = (id: RegionId) => {
  if (!game.startingBarChosen) return 'Choose as first bar · free';
  if (game.isBarOwned(id)) return id === game.regionId ? 'Active bar' : 'Manage bar';
  if (game.level < game.barPurchaseLevel) return `Unlocks at level ${game.barPurchaseLevel}`;
  return `Buy bar · ${barPriceLabel()}`;
};
function regionAction(id: RegionId) {
  if (!game.startingBarChosen) game.chooseStartingBar(id);
  else if (game.isBarOwned(id)) game.switchBar(id);
  else game.buyBar(id);
}
function selectBartender(id: 'noa' | 'leo') {
  const oldDefault = selectedBartender.value === 'leo' ? 'Leo' : 'Noa';
  game.decor.bartenderCharacter = id;
  if (id === 'leo') {
    if (['slim','curvy'].includes(game.decor.bodyShape)) game.decor.bodyShape = 'muscular';
    if (['updo','waves','bob','ponytail','braids'].includes(game.decor.hairStyle)) game.decor.hairStyle = 'slick';
    if (game.decor.skinDetail === 'clean') game.decor.skinDetail = 'tattoo-bold';
    game.decor.makeup = 'none';
  } else {
    if (['muscular','broad'].includes(game.decor.bodyShape)) game.decor.bodyShape = 'curvy';
    if (['slick','short','undercut'].includes(game.decor.hairStyle)) game.decor.hairStyle = 'updo';
    if (game.decor.skinDetail === 'tattoo-bold') game.decor.skinDetail = 'clean';
    if (game.decor.makeup === 'none') game.decor.makeup = 'natural';
  }
  if (!game.decor.bartenderNickname || game.decor.bartenderNickname === oldDefault) {
    bartenderNickname.value = id === 'leo' ? 'Leo' : 'Noa';
    game.renameBartender(bartenderNickname.value);
  }
}
</script>

<template>
  <section class="management-deck">
    <article v-show="activeView === 'inventory'" class="game-panel inventory-deck">
      <header class="panel-heading"><div><small>STOCK ROOM · {{ game.region.name }}</small><h2>Bar inventories</h2></div><span>{{ game.inventory.length }} ingredients · {{ game.bottleInventory.length }} sealed brands</span></header>
      <div class="bar-switcher" aria-label="Choose a bar inventory">
        <button v-for="region in REGIONS.filter(item => game.isBarOwned(item.id))" :key="region.id" :class="{ active: region.id === game.regionId }" type="button" @click="game.switchBar(region.id)"><b>{{ region.name }}</b><small>{{ barUnits(region.id).toLocaleString() }} ingredient units · {{ barBottles(region.id) }} bottles</small></button>
      </div>
      <div class="inventory-tools">
        <div class="category-tabs inventory-filter">
          <button v-for="category in ['all','spirit','mixer','fresh'] as const" :key="category" :class="{ active: stockCategory === category }" type="button" @click="stockCategory = category">{{ category === 'spirit' ? 'Spirits' : category === 'mixer' ? 'Mixers' : category === 'fresh' ? 'Fresh & food' : 'All' }}</button>
        </div>
        <div v-if="targetRegions.length" class="transfer-console">
          <div><small>MOVE BETWEEN BARS</small><b>Stock transfer</b></div>
          <select v-model="transferIngredientId" aria-label="Ingredient to transfer"><option v-for="ingredient in INGREDIENTS" :key="ingredient.id" :value="ingredient.id">{{ ingredient.name }}</option></select>
          <span>→</span>
          <select v-model="game.transferTargetId" aria-label="Destination bar"><option v-for="region in targetRegions" :key="region.id" :value="region.id">{{ region.name }}</option></select>
          <button type="button" @click="game.transferStock(transferIngredientId, game.transferTargetId)">Transfer {{ ingredientById(transferIngredientId).unit === 'ml' ? '100 ml' : '3 pcs' }}</button>
        </div>
        <p v-else class="transfer-locked">Unlock a second bar at level {{ game.barPurchaseLevel }} to rotate stock between locations.</p>
      </div>
      <div class="inventory-cards">
        <div v-for="stock in visibleStock" :key="stock.ingredientId" class="inventory-card">
          <BottleModel :ingredient="ingredientById(stock.ingredientId)" />
          <div><b>{{ ingredientById(stock.ingredientId).name }}</b><small>{{ stock.amount }} {{ ingredientById(stock.ingredientId).unit }}</small></div>
          <span>{{ uiCategory(ingredientById(stock.ingredientId)) }}</span>
        </div>
      </div>
      <section v-if="stockCategory === 'all' && recipeCardInventory.length" class="recipe-item-inventory">
        <header><div><small>COLLECTIBLE ITEMS</small><h3>Recipe cards</h3></div><span>Duplicates are spent on mastery upgrades.</span></header>
        <div><article v-for="item in recipeCardInventory" :key="item.recipe.id"><GlassModel :art-index="RECIPES.indexOf(item.recipe) % 10" type="coupe" /><span><small>RECIPE ITEM</small><b>{{ item.recipe.name }}</b><em>Owned ×{{ item.quantity }}</em></span><strong>×{{ item.quantity }}</strong></article></div>
      </section>
      <section v-if="stockCategory === 'all' || stockCategory === 'spirit'" class="sealed-stock-section">
        <header><div><small>FULL-BOTTLE RETAIL</small><h3>Popular brands ready to sell</h3></div><span>{{ barBottles(game.regionId) }} sealed bottles</span></header>
        <div class="sealed-stock-grid">
          <article v-for="stock in game.bottleInventory" :key="stock.productId">
            <div class="stock-brand-model"><BrandBottle :brand="bottleById(stock.productId).brand" :category="guideIdForProduct(bottleById(stock.productId))" :color="bottleById(stock.productId).color" /></div>
            <div><small>{{ ALCOHOL_TYPE_LABELS[bottleById(stock.productId).type] }} · {{ bottleById(stock.productId).abv }}% ABV</small><b>{{ bottleById(stock.productId).name }}</b><span>{{ bottleById(stock.productId).volumeMl }} ml · customer pays {{ (bottleById(stock.productId).price * game.economy.guestPriceFactor).toFixed(2) }} coins + ◆ {{ bottleSaleCrystalReward(bottleById(stock.productId)) }}</span></div>
            <strong>{{ stock.quantity }}×</strong>
            <button v-if="game.bottleCrystalCost(stock.productId)" class="reserve-restock" type="button" :disabled="game.crystals < game.bottleCrystalCost(stock.productId)" @click="game.buyBottleStock(stock.productId)">+1 reserve · ◆ {{ game.bottleCrystalCost(stock.productId) }}</button>
          </article>
        </div>
      </section>
    </article>

    <MarketPanel v-show="activeView === 'market'" />

    <article v-show="activeView === 'recipes'" class="game-panel recipes-deck">
      <template v-if="!selectedRecipe">
        <header class="panel-heading"><div><small>RECIPE ACADEMY</small><h2>Learn, collect & master</h2></div><span>{{ game.knownRecipes.length }} / {{ RECIPES.length }} learned</span></header>
        <section class="unlock-guide">
          <div class="unlock-intro"><small>HOW THE RECIPE BOOK GROWS</small><h3>Ten classics start your journey</h3><p>Every cocktail appears in the catalog. Advanced lessons stay locked until you discover them, then reveal the complete story, guest profile, ingredients and cooking path.</p></div>
          <div><b>1</b><strong>Recipe shop</strong><span>Spend service earnings on a recipe you want next.</span></div>
          <div><b>2</b><strong>Special client</strong><span>Serve their secret order correctly and they teach it to you.</span></div>
          <div class="daily-gift-card"><b>3</b><strong>Daily gift · day {{ game.upcomingLoginDay }}</strong><span>150–1,000 coins for consecutive logins. Day 3 adds 45 crystals and day 7 adds 120. A recipe may drop as an extra gift (12% chance).</span><button type="button" :disabled="!game.dailyGiftAvailable" @click="game.claimDailyGift()">{{ game.dailyGiftAvailable ? `Claim ${game.dailyCoinReward} coins${game.dailyCrystalReward ? ` + ${game.dailyCrystalReward} crystals` : ''}` : 'Gift claimed today' }}</button><em>{{ game.dailyGiftResult }}</em></div>
        </section>
        <div class="login-reward-track"><span v-for="(reward,index) in DAILY_COINS" :key="reward" :class="{active:((game.upcomingLoginDay - 1) % 7) + 1 === index + 1,claimed:game.loginStreak > index}"><small>DAY {{ index + 1 }}</small><b>{{ reward }}</b><em>coins{{ index === 2 ? ' · +45 ◆' : index === 6 ? ' · +120 ◆' : '' }}</em></span></div>
        <div class="recipe-mode-tabs"><button :class="{ active: recipeMode === 'library' }" type="button" @click="recipeMode = 'library'">All recipes · {{ RECIPES.length }}</button><button :class="{ active: recipeMode === 'shop' }" type="button" @click="recipeMode = 'shop'">Learn locked · {{ game.lockedRecipes.length }}</button></div>
        <div v-if="recipeMode === 'library'" class="recipe-cards">
          <button v-for="recipe in RECIPES" :key="recipe.id" :class="{ locked: !isRecipeKnown(recipe.id) }" type="button" @click="isRecipeKnown(recipe.id) ? selectedRecipeId = recipe.id : recipeMode = 'shop'">
            <GlassModel :type="RECIPES.indexOf(recipe) % 3 === 0 ? 'highball' : RECIPES.indexOf(recipe) % 3 === 1 ? 'coupe' : 'rocks'" :art-index="RECIPES.indexOf(recipe) % 10" />
            <div class="recipe-card-copy"><small>{{ isRecipeKnown(recipe.id) ? recipe.origin : 'LOCKED LESSON' }}</small><b>{{ recipe.name }}</b><p>{{ isRecipeKnown(recipe.id) ? recipe.story : 'Discover this recipe to reveal its story, ingredients and cooking path.' }}</p><span v-if="isRecipeKnown(recipe.id)">{{ recipe.ingredients.length }} ingredients · {{ recipe.needsShake ? 'Shake' : 'Build / stir' }} · {{ recipeAlcoholLabel(recipe) }}</span><span v-else>{{ recipeAlcoholLabel(recipe) }} · shop · special client · daily gift</span><em>{{ isRecipeKnown(recipe.id) ? 'Open lesson →' : '🔒 Need to learn first' }}</em></div>
          </button>
        </div>
        <div v-else class="recipe-shop-grid">
          <article v-for="recipe in game.lockedRecipes" :key="recipe.id" class="locked-recipe-card">
            <div class="locked-art"><GlassModel :art-index="RECIPES.indexOf(recipe) % 10" type="coupe" /><span>LOCKED</span></div>
            <div><small>ADVANCED RECIPE</small><h3>{{ recipe.name }}</h3><p>{{ recipeAlcoholLabel(recipe) }} · {{ recipe.tastingNotes.join(' · ') }}</p><span>Unlock the full history, guest profile and method.</span></div>
            <button type="button" @click="game.buyRecipe(recipe.id)">Buy for {{ recipePriceLabel(recipe.id) }}</button>
          </article>
        </div>
      </template>
      <template v-else>
        <header class="panel-heading recipe-detail-heading"><button type="button" @click="selectedRecipeId = null">← All recipes</button><div><small>{{ selectedRecipe.category }} · {{ selectedRecipe.origin }}</small><h2>{{ selectedRecipe.name }}</h2></div><span>{{ recipeAlcoholLabel(selectedRecipe) }} · {{ (selectedRecipe.price * game.economy.guestPriceFactor).toFixed(2) }} coins</span></header>
        <div class="recipe-detail-page">
          <aside class="recipe-hero-art"><GlassModel :art-index="selectedRecipeIndex" type="coupe" /><div><small>TASTING PROFILE · {{ recipeAlcoholLabel(selectedRecipe) }}</small><div class="tasting-badges"><span v-for="note in selectedRecipe.tastingNotes" :key="note">{{ note }}</span></div></div></aside>
          <RecipeMastery :recipe="selectedRecipe" />
          <section class="recipe-story"><small>THE STORY</small><h3>A drink with a past</h3><p>{{ selectedRecipe.story }}</p><button type="button" class="guide-open" @click="openGuide('cocktail', selectedRecipe.id)">Full history, method &amp; why choose it →</button><div class="occasion-block"><small>WHEN IT IS A GOOD CHOICE</small><div><span v-for="occasion in selectedRecipe.occasions" :key="occasion">{{ occasion }}</span></div></div></section>
          <section class="recipe-formula"><small>WHAT YOU NEED</small><h3>Bar formula</h3><div v-for="part in selectedRecipe.ingredients" :key="part.ingredientId" class="formula-ingredient-card"><div class="formula-icon"><BottleModel :ingredient="ingredientById(part.ingredientId)" /></div><b class="formula-name">{{ ingredientById(part.ingredientId).name }}</b><span class="formula-amount">{{ part.amount }} {{ ingredientById(part.ingredientId).unit }}</span><small class="formula-action">{{ formulaActions.get(part.ingredientId) }}</small><button type="button" class="guide-open" :aria-label="`About ${ingredientById(part.ingredientId).name}`" @click="openGuide('ingredient', part.ingredientId)">About</button></div></section>
          <section class="recipe-method"><small>COOKING PATH</small><h3>{{ selectedRecipe.needsShake ? 'Shake and serve' : 'Build with control' }}</h3><ol><li v-for="(step, index) in selectedRecipe.method" :key="step"><b>{{ index + 1 }}</b><span>{{ step }}</span></li></ol></section>
        </div>
      </template>
    </article>

    <article v-show="activeView === 'design'" class="game-panel design-deck">
      <header class="panel-heading"><div><small>PERSONALIZE</small><h2>Bar & bartender</h2></div><span>Live preview</span></header>
      <div class="design-location-tabs"><button v-for="region in REGIONS.filter(item => game.isBarOwned(item.id))" :key="region.id" :class="{active:region.id === game.regionId}" type="button" @click="game.switchBar(region.id)">{{ region.name }}</button></div>
      <form class="bar-name-editor" @submit.prevent="game.renameBar(barName)"><label :for="'bar-name'">Bar name in {{ game.region.name }}<input id="bar-name" v-model="barName" maxlength="32" required placeholder="Name your bar" /></label><button type="submit">Save name</button><span aria-live="polite">{{ game.message }}</span></form>
      <form class="bartender-name-editor" @submit.prevent="game.renameBartender(bartenderNickname)"><label for="bartender-nickname">Bartender nickname<input id="bartender-nickname" v-model="bartenderNickname" maxlength="18" required placeholder="Enter a nickname" /></label><button type="submit">Save nickname</button><span>This is the name guests see.</span></form>
      <div class="design-grid-new">
        <div class="mini-interior" :data-wall="game.decor.wall" :data-counter="game.decor.counter" :data-counter-color="game.decor.counterColor" :data-counter-size="game.decor.counterSize" :data-lighting="game.decor.lighting" :data-highlight-strength="game.decor.highlightStrength" :style="game.barInteriorStyle"><span></span><b>{{ game.decor.name }}</b><i></i><em>{{ game.region.name }} · Saved automatically</em></div>
        <div class="bartender-custom">
          <CharacterModel role="bartender" :character-id="selectedBartender" :outfit="game.decor.bartender" :face-style="game.decor.face" :hair-style="game.decor.hairStyle" :hair-color="game.decor.hairColor" :body-shape="game.decor.bodyShape" :skin-detail="game.decor.skinDetail" :skin-tone="game.decor.skinTone" :tan-level="game.decor.tanLevel" :bust="game.decor.bust" :pose="game.decor.pose" :makeup="game.decor.makeup" />
          <div class="bartender-selector" aria-label="Choose bartender">
            <button v-for="person in [{id:'noa',label:'Woman'},{id:'leo',label:'Man'}] as const" :key="person.id" :class="{ active: selectedBartender === person.id }" type="button" @click="selectBartender(person.id)">{{ person.label }}</button>
          </div>
          <div class="outfit-selector" aria-label="Choose bartender outfit"><button v-for="outfit in ['base','vest','shirt','apron'] as const" :key="outfit" :class="{ active: game.decor.bartender === outfit }" type="button" @click="game.decor.bartender = outfit">{{ outfitLabel(outfit) }}</button></div>
        </div>
        <div class="design-options">
          <section class="background-picker"><small>{{ INTERIORS.length }} BACKGROUNDS · {{ game.ownedInteriorIds.length }} OWNED</small><div><button v-for="interior in INTERIORS" :key="interior.id" :class="{active:game.decor.interior === interior.id,locked:!isInteriorOwned(interior.id),special:'special' in interior && interior.special}" :style="interiorStyle(interior.id)" type="button" @click="game.chooseInterior(interior.id)"><em v-if="!isInteriorOwned(interior.id)">◆ {{ interior.crystalCost }}</em><span>{{ interior.name }}</span></button></div></section>
          <section><small>WALL COLOR</small><div><button v-for="wall in WALLS" :key="wall" :class="{ active: game.decor.wall === wall }" type="button" @click="game.decor.wall = wall"><i :data-color="wall"></i>{{ wall }}</button></div></section>
          <section class="shelf-style-picker"><small>BACK-BAR SHELVES · {{ shelfStyleFor(game.decor) }}</small><div><button v-for="shelf in SHELF_STYLES" :key="shelf" :class="{ active: (game.decor.shelf ?? 'auto') === shelf }" :data-shelf-swatch="shelf === 'auto' ? shelfStyleFor({ interior: game.decor.interior }) : shelf" type="button" @click="game.decor.shelf = shelf">{{ shelf === 'auto' ? 'Match background' : shelf }}</button></div></section>
          <section><small>BARLINE TINT · the counter in your background</small><div><button v-for="color in COUNTER_COLORS" :key="color" :class="{ active: game.decor.counterColor === color }" type="button" @click="game.decor.counterColor = color"><i :data-color="color"></i>{{ color }}</button></div></section>
          <section><small>HIGHLIGHT COLOR</small><div><button v-for="light in HIGHLIGHTS" :key="light" :class="{ active: game.decor.lighting === light }" type="button" @click="game.decor.lighting = light"><i :data-color="light"></i>{{ light }}</button></div></section>
          <section><small>HIGHLIGHT STRENGTH</small><div><button v-for="strength in HIGHLIGHT_STRENGTHS" :key="strength" :class="{ active: game.decor.highlightStrength === strength }" type="button" @click="game.decor.highlightStrength = strength">{{ strength }}</button></div></section>
          <section><small>FACE</small><div><button v-for="face in BARTENDER_FACES" :key="face" :class="{active:game.decor.face === face}" type="button" @click="game.decor.face = face">{{ face }}</button></div></section>
          <section><small>HAIR STYLE</small><div><button v-for="hair in visibleHairStyles" :key="hair" :class="{active:game.decor.hairStyle === hair}" type="button" @click="game.decor.hairStyle = hair">{{ hair }}</button></div></section>
          <section><small>HAIR COLOR</small><div><button v-for="color in HAIR_COLORS" :key="color" :class="{active:game.decor.hairColor === color}" type="button" @click="game.decor.hairColor = color"><i :data-color="color"></i>{{ color }}</button></div></section>
          <section><small>SKIN TONE</small><div><button v-for="tone in SKIN_TONES" :key="tone" :class="{active:game.decor.skinTone === tone}" type="button" @click="game.decor.skinTone = tone"><i :data-skin-tone="tone"></i>{{ tone }}</button></div></section>
          <section><small>TAN</small><div><button v-for="tan in TAN_LEVELS" :key="tan" :class="{active:game.decor.tanLevel === tan}" type="button" @click="game.decor.tanLevel = tan">{{ tan.replace('-', ' ') }}</button></div></section>
          <section><small>BODY BUILD</small><div><button v-for="shape in BODY_SHAPES" :key="shape" :class="{active:game.decor.bodyShape === shape}" type="button" @click="game.decor.bodyShape = shape">{{ shape }}</button></div></section>
          <section><small>SKIN · TATTOOS · SCARS</small><div><button v-for="detail in SKIN_DETAILS" :key="detail" :class="{active:game.decor.skinDetail === detail}" type="button" @click="game.decor.skinDetail = detail">{{ detail.replace('-', ' ') }}</button></div></section>
          <section v-if="selectedBartender === 'noa'"><small>CURVES</small><div><button v-for="bust in BUST_OPTIONS" :key="bust" :class="{active:game.decor.bust === bust}" type="button" @click="game.decor.bust = bust">{{ bust }}</button></div></section>
          <section><small>POSE</small><div><button v-for="pose in POSES" :key="pose" :class="{active:game.decor.pose === pose}" type="button" @click="game.decor.pose = pose">{{ pose }}</button></div></section>
          <section v-if="selectedBartender === 'noa'"><small>MAKEUP</small><div><button v-for="makeup in MAKEUP_OPTIONS" :key="makeup" :class="{active:game.decor.makeup === makeup}" type="button" @click="game.decor.makeup = makeup">{{ makeup.replace('-', ' ') }}</button></div></section>
        </div>
      </div>
    </article>

    <article v-show="activeView === 'regions'" class="game-panel regions-deck">
      <header class="panel-heading"><div><small>WORLD TOUR</small><h2>{{ game.startingBarChosen ? 'Build your bar network' : 'Choose your first city' }}</h2></div><span>{{ game.ownedBarIds.length }} / {{ REGIONS.length }} bars open</span></header>
      <div class="bar-unlock-rules"><b>{{ game.startingBarChosen ? `Expansion unlocks at level ${game.barPurchaseLevel}` : 'Your first bar is free' }}</b><span>The second location costs coins. Every later location costs crystals. Each bar keeps its own name, look and inventory.</span></div>
      <WorldMap />
      <div class="region-cards"><article v-for="region in REGIONS" :key="region.id" :class="{ active: region.id === game.regionId && game.isBarOwned(region.id), locked: !game.isBarOwned(region.id) }"><img :src="INTERIORS.find(item => item.id === game.bars[region.id].interior)?.asset" alt="" /><small>{{ region.name }}</small><b>{{ game.bars[region.id].name }}</b><small>{{ region.tagline }}</small><span v-if="game.isBarOwned(region.id)">{{ region.marketFactor }}× prices · {{ barUnits(region.id).toLocaleString() }} stock</span><span v-else>{{ game.level < game.barPurchaseLevel && game.startingBarChosen ? `Level ${game.barPurchaseLevel} required` : 'Location not owned' }}</span><button type="button" :disabled="game.startingBarChosen && (game.isBarOwned(region.id) && region.id === game.regionId || !game.isBarOwned(region.id) && game.level < game.barPurchaseLevel)" @click="regionAction(region.id)">{{ barActionLabel(region.id) }}</button></article></div>
    </article>

    <PairingAdvisor v-show="activeView === 'advisor'" />
  </section>
</template>
