<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { INGREDIENTS, RECIPES, REGIONS } from '../../domain/catalog';
import { INTERIORS } from '../../data/cosmetics/bars';
import { DAILY_COINS } from '../../domain/economy';
import type { Ingredient, RegionId } from '../../domain/types';
import { useGameStore } from '../../stores/game';
import BottleModel from '../cocktails/BottleModel.vue';
import GlassModel from '../cocktails/GlassModel.vue';
import CharacterModel from '../characters/CharacterModel.vue';
import PairingAdvisor from '../PairingAdvisor.vue';
import MarketPanel from './MarketPanel.vue';
import WorldMap from './WorldMap.vue';

withDefaults(defineProps<{ activeView?: string }>(), { activeView: 'inventory' });
const game = useGameStore();
const stockCategory = ref<'all' | 'spirit' | 'mixer' | 'fresh'>('all');
const selectedRecipeId = ref<string | null>(null);
const recipeMode = ref<'library' | 'shop'>('library');
const transferIngredientId = ref(INGREDIENTS[0]!.id);
const barName = ref(game.decor.name);
watch(() => game.regionId, () => barName.value = game.decor.name);

const ingredientById = (id: string) => INGREDIENTS.find((item) => item.id === id)!;
const uiCategory = (ingredient: Ingredient) => ingredient.category === 'spirit' ? 'spirit' : ingredient.category === 'mixer' && !['sugar-syrup', 'coconut-cream'].includes(ingredient.id) ? 'mixer' : 'fresh';
const visibleStock = computed(() => game.inventory.filter((stock) => stockCategory.value === 'all' || uiCategory(ingredientById(stock.ingredientId)) === stockCategory.value));
const selectedRecipe = computed(() => RECIPES.find((recipe) => recipe.id === selectedRecipeId.value) ?? null);
const selectedRecipeIndex = computed(() => Math.max(0, RECIPES.findIndex((recipe) => recipe.id === selectedRecipeId.value)));
const targetRegions = computed(() => REGIONS.filter((region) => region.id !== game.regionId));
const barUnits = (id: RegionId) => game.inventories[id].reduce((sum, stock) => sum + stock.amount, 0);
</script>

<template>
  <section class="management-deck">
    <article v-show="activeView === 'inventory'" class="game-panel inventory-deck">
      <header class="panel-heading"><div><small>STOCK ROOM · {{ game.region.name }}</small><h2>Bar inventories</h2></div><span>{{ game.inventory.length }} products</span></header>
      <div class="bar-switcher" aria-label="Choose a bar inventory">
        <button v-for="region in REGIONS" :key="region.id" :class="{ active: region.id === game.regionId }" type="button" @click="game.switchBar(region.id)"><b>{{ region.name }}</b><small>{{ barUnits(region.id).toLocaleString() }} units</small></button>
      </div>
      <div class="inventory-tools">
        <div class="category-tabs inventory-filter">
          <button v-for="category in ['all','spirit','mixer','fresh'] as const" :key="category" :class="{ active: stockCategory === category }" type="button" @click="stockCategory = category">{{ category === 'spirit' ? 'Spirits' : category === 'mixer' ? 'Mixers' : category === 'fresh' ? 'Fresh & food' : 'All' }}</button>
        </div>
        <div class="transfer-console">
          <div><small>MOVE BETWEEN BARS</small><b>Stock transfer</b></div>
          <select v-model="transferIngredientId" aria-label="Ingredient to transfer"><option v-for="ingredient in INGREDIENTS" :key="ingredient.id" :value="ingredient.id">{{ ingredient.name }}</option></select>
          <span>→</span>
          <select v-model="game.transferTargetId" aria-label="Destination bar"><option v-for="region in targetRegions" :key="region.id" :value="region.id">{{ region.name }}</option></select>
          <button type="button" @click="game.transferStock(transferIngredientId, game.transferTargetId)">Transfer {{ ingredientById(transferIngredientId).unit === 'ml' ? '100 ml' : '3 pcs' }}</button>
        </div>
      </div>
      <div class="inventory-cards">
        <div v-for="stock in visibleStock" :key="stock.ingredientId" class="inventory-card">
          <BottleModel :ingredient="ingredientById(stock.ingredientId)" />
          <div><b>{{ ingredientById(stock.ingredientId).name }}</b><small>{{ stock.amount }} {{ ingredientById(stock.ingredientId).unit }}</small></div>
          <span>{{ uiCategory(ingredientById(stock.ingredientId)) }}</span>
        </div>
      </div>
    </article>

    <MarketPanel v-show="activeView === 'market'" />

    <article v-show="activeView === 'recipes'" class="game-panel recipes-deck">
      <template v-if="!selectedRecipe">
        <header class="panel-heading"><div><small>RECIPE ACADEMY</small><h2>Learn, collect & master</h2></div><span>{{ game.knownRecipes.length }} / {{ RECIPES.length }} learned</span></header>
        <section class="unlock-guide">
          <div class="unlock-intro"><small>HOW THE RECIPE BOOK GROWS</small><h3>Ten classics start your journey</h3><p>Advanced cocktails stay hidden until you discover them. Every unlock adds its complete story, ideal guest profile, ingredients and cooking path.</p></div>
          <div><b>1</b><strong>Recipe shop</strong><span>Spend service earnings on a recipe you want next.</span></div>
          <div><b>2</b><strong>Special client</strong><span>Serve their secret order correctly and they teach it to you.</span></div>
          <div class="daily-gift-card"><b>3</b><strong>Daily gift · day {{ game.upcomingLoginDay }}</strong><span>150–1,000 coins for consecutive logins. A recipe may drop as an extra gift (12% chance). Missing a day resets the streak.</span><button type="button" :disabled="!game.dailyGiftAvailable" @click="game.claimDailyGift()">{{ game.dailyGiftAvailable ? `Claim ${game.dailyCoinReward} coins` : 'Gift claimed today' }}</button><em>{{ game.dailyGiftResult }}</em></div>
        </section>
        <div class="login-reward-track"><span v-for="(reward,index) in DAILY_COINS" :key="reward" :class="{active:Math.min(7,game.upcomingLoginDay) === index + 1,claimed:game.loginStreak > index}"><small>DAY {{ index + 1 }}{{ index === 6 ? '+' : '' }}</small><b>{{ reward }}</b><em>coins</em></span></div>
        <div class="recipe-mode-tabs"><button :class="{ active: recipeMode === 'library' }" type="button" @click="recipeMode = 'library'">My recipes · {{ game.knownRecipes.length }}</button><button :class="{ active: recipeMode === 'shop' }" type="button" @click="recipeMode = 'shop'">Recipe shop · {{ game.lockedRecipes.length }}</button></div>
        <div v-if="recipeMode === 'library'" class="recipe-cards">
          <button v-for="recipe in game.knownRecipes" :key="recipe.id" type="button" @click="selectedRecipeId = recipe.id">
            <GlassModel :type="RECIPES.indexOf(recipe) % 3 === 0 ? 'highball' : RECIPES.indexOf(recipe) % 3 === 1 ? 'coupe' : 'rocks'" :art-index="RECIPES.indexOf(recipe) % 10" />
            <div class="recipe-card-copy"><small>{{ recipe.origin }}</small><b>{{ recipe.name }}</b><p>{{ recipe.story }}</p><span>{{ recipe.ingredients.length }} ingredients · {{ recipe.needsShake ? 'Shake' : 'Build / stir' }}</span><em>Open lesson →</em></div>
          </button>
        </div>
        <div v-else class="recipe-shop-grid">
          <article v-for="recipe in game.lockedRecipes" :key="recipe.id" class="locked-recipe-card">
            <div class="locked-art"><GlassModel :art-index="RECIPES.indexOf(recipe) % 10" type="coupe" /><span>LOCKED</span></div>
            <div><small>ADVANCED RECIPE</small><h3>{{ recipe.name }}</h3><p>{{ recipe.tastingNotes.join(' · ') }}</p><span>Unlock the full history, guest profile and method.</span></div>
            <button type="button" @click="game.buyRecipe(recipe.id)">Buy for {{ Math.round(recipe.price * 18) }} coins</button>
          </article>
        </div>
      </template>
      <template v-else>
        <header class="panel-heading recipe-detail-heading"><button type="button" @click="selectedRecipeId = null">← All recipes</button><div><small>{{ selectedRecipe.category }} · {{ selectedRecipe.origin }}</small><h2>{{ selectedRecipe.name }}</h2></div><span>{{ (selectedRecipe.price * game.region.marketFactor).toFixed(2) }} coins</span></header>
        <div class="recipe-detail-page">
          <aside class="recipe-hero-art"><GlassModel :art-index="selectedRecipeIndex" type="coupe" /><div><small>TASTING PROFILE</small><span v-for="note in selectedRecipe.tastingNotes" :key="note">{{ note }}</span></div></aside>
          <section class="recipe-story"><small>THE STORY</small><h3>A drink with a past</h3><p>{{ selectedRecipe.story }}</p><div class="occasion-block"><small>WHEN IT IS A GOOD CHOICE</small><div><span v-for="occasion in selectedRecipe.occasions" :key="occasion">{{ occasion }}</span></div></div></section>
          <section class="recipe-formula"><small>WHAT YOU NEED</small><h3>Bar formula</h3><div v-for="part in selectedRecipe.ingredients" :key="part.ingredientId"><BottleModel :ingredient="ingredientById(part.ingredientId)" /><b>{{ ingredientById(part.ingredientId).name }}</b><span>{{ part.amount }} {{ ingredientById(part.ingredientId).unit }}</span></div></section>
          <section class="recipe-method"><small>COOKING PATH</small><h3>{{ selectedRecipe.needsShake ? 'Shake and serve' : 'Build with control' }}</h3><ol><li v-for="(step, index) in selectedRecipe.method" :key="step"><b>{{ index + 1 }}</b><span>{{ step }}</span></li></ol></section>
        </div>
      </template>
    </article>

    <article v-show="activeView === 'design'" class="game-panel design-deck">
      <header class="panel-heading"><div><small>PERSONALIZE</small><h2>Bar & bartender</h2></div><span>Live preview</span></header>
      <div class="design-location-tabs"><button v-for="region in REGIONS" :key="region.id" :class="{active:region.id === game.regionId}" type="button" @click="game.switchBar(region.id)">{{ region.name }}</button></div>
      <form class="bar-name-editor" @submit.prevent="game.renameBar(barName)"><label :for="'bar-name'">Bar name in {{ game.region.name }}<input id="bar-name" v-model="barName" maxlength="32" required placeholder="Name your bar" /></label><button type="submit">Save name</button><span aria-live="polite">{{ game.message }}</span></form>
      <div class="design-grid-new">
        <div class="mini-interior" :data-wall="game.decor.wall" :data-counter="game.decor.counter" :data-lighting="game.decor.lighting" :style="{backgroundImage:`url('${game.barBackground}')`}"><span></span><b>{{ game.decor.name }}</b><i></i><em>{{ game.region.name }} · Saved automatically</em></div>
        <div class="bartender-custom"><CharacterModel role="bartender" character-id="noa" :outfit="game.decor.bartender" /><div><button v-for="outfit in ['vest','shirt','apron']" :key="outfit" :class="{ active: game.decor.bartender === outfit }" type="button" @click="game.decor.bartender = outfit">{{ outfit }}</button></div></div>
        <div class="design-options">
          <section><small>INTERIOR</small><button v-for="interior in INTERIORS" :key="interior.id" :class="{active:game.decor.interior === interior.id}" type="button" @click="game.decor.interior = interior.id">{{ interior.name }}</button></section>
          <section><small>WALL MOOD</small><button v-for="wall in ['neon','burgundy','emerald']" :key="wall" :class="{ active: game.decor.wall === wall }" type="button" @click="game.decor.wall = wall"><i :data-color="wall"></i>{{ wall }}</button></section>
          <section><small>COUNTER</small><button v-for="counter in ['classic','marble','brass']" :key="counter" :class="{ active: game.decor.counter === counter }" type="button" @click="game.decor.counter = counter">{{ counter }}</button></section>
          <section><small>LIGHTING</small><button v-for="lighting in ['amber','rose','blue']" :key="lighting" :class="{ active: game.decor.lighting === lighting }" type="button" @click="game.decor.lighting = lighting">{{ lighting }}</button></section>
        </div>
      </div>
    </article>

    <article v-show="activeView === 'regions'" class="game-panel regions-deck">
      <header class="panel-heading"><div><small>WORLD TOUR</small><h2>Choose your active bar</h2></div><span>{{ game.region.tagline }}</span></header>
      <WorldMap />
      <div class="region-cards"><button v-for="region in REGIONS" :key="region.id" :class="{ active: region.id === game.regionId }" type="button" @click="game.switchBar(region.id)"><img :src="INTERIORS.find(item => item.id === game.bars[region.id].interior)?.asset" alt="" /><small>{{ region.name }}</small><b>{{ game.bars[region.id].name }}</b><small>{{ region.tagline }}</small><span>{{ region.marketFactor }}× prices · {{ barUnits(region.id).toLocaleString() }} stock</span></button></div>
    </article>

    <PairingAdvisor v-show="activeView === 'advisor'" />
  </section>
</template>
