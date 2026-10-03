<script setup lang="ts">
import UiButton from '../ui/UiButton.vue';
import SpeakButton from '../ui/SpeakButton.vue';
import UiInput from '../ui/UiInput.vue';
import PanelHeading from '../ui/PanelHeading.vue';
import { computed, ref } from 'vue';
import { INGREDIENTS, RECIPES, recipeAlcoholLabel } from '../../domain/catalog';
import UiIcon from '../ui/UiIcon.vue';
import { SPECIALTY_PREMIUM, isCitySpecialty, specialtyFactor } from '../../domain/economy';
import { useGameStore } from '../../stores/game';
import BottleModel from '../cocktails/BottleModel.vue';
import RecipeMastery from '../cocktails/RecipeMastery.vue';
import GlassModel from '../cocktails/GlassModel.vue';
import { useGuide } from '../../composables/useGuide';
import { recipeCard } from '../../data/knowledge/guides';
const game = useGameStore();
const selectedRecipeId = ref<string | null>(null);
const recipeMode = ref<'library' | 'shop'>('library');
const recipeSearch = ref('');
const matchesSearch = (name: string) => !recipeSearch.value.trim() || name.toLowerCase().includes(recipeSearch.value.trim().toLowerCase());
const libraryRecipes = computed(() => RECIPES.filter((recipe) => matchesSearch(recipe.name)));
const shopRecipes = computed(() => game.lockedRecipes.filter((recipe) => matchesSearch(recipe.name)));
const ingredientById = (id: string) => INGREDIENTS.find((item) => item.id === id)!;
const { openGuide } = useGuide();
const formulaActions = computed(() => selectedRecipe.value ? new Map(recipeCard(selectedRecipe.value).lines.filter((line) => line.ingredientId).map((line) => [line.ingredientId!, line.action])) : new Map<string, string>());
const selectedRecipe = computed(() => RECIPES.find((recipe) => recipe.id === selectedRecipeId.value) ?? null);
const isRecipeKnown = (id: string) => game.knownRecipeIds.includes(id);
const recipePriceLabel = (id: string) => {
  const price = game.recipePrice(id);
  return `${price.amount} ${price.currency}`;
};

</script>
<template>
<article class="game-panel recipes-deck">
      <template v-if="!selectedRecipe">
        <PanelHeading eyebrow="RECIPE ACADEMY" title="Learn, collect & master" :aside="`${game.knownRecipes.length} / ${RECIPES.length} learned`" />
        <section class="unlock-guide">
          <div class="unlock-intro"><small>HOW THE RECIPE BOOK GROWS</small><h3>Ten classics to start</h3><p>The rest stay locked until you find them. Three ways to get a recipe:</p></div>
          <div><b>1</b><strong>Recipe shop</strong><span>Spend service earnings on a recipe you want next.</span></div>
          <div><b>2</b><strong>Special client</strong><span>Serve their secret order correctly and they teach it to you.</span></div>
          <div><b>3</b><strong>Daily gift</strong><span>A recipe card may come with the login reward — open it from the gift button at the top.</span></div>
        </section>

        <div class="recipe-mode-tabs"><button :class="{ active: recipeMode === 'library' }" type="button" @click="recipeMode = 'library'">All recipes · {{ RECIPES.length }}</button><button :class="{ active: recipeMode === 'shop' }" type="button" @click="recipeMode = 'shop'">Learn locked · {{ game.lockedRecipes.length }}</button></div>
        <div class="recipe-search"><UiInput v-model="recipeSearch" label="Find a recipe" placeholder="Type a name, e.g. Mojito" autocomplete="off" /></div>
        <div v-if="recipeMode === 'library'" class="recipe-cards">
          <button v-for="recipe in libraryRecipes" :key="recipe.id" :class="{ locked: !isRecipeKnown(recipe.id) }" type="button" @click="isRecipeKnown(recipe.id) ? selectedRecipeId = recipe.id : recipeMode = 'shop'">
            <GlassModel :type="RECIPES.indexOf(recipe) % 3 === 0 ? 'highball' : RECIPES.indexOf(recipe) % 3 === 1 ? 'coupe' : 'rocks'" :art-index="RECIPES.indexOf(recipe)" :recipe-id="recipe.id" />
            <div class="recipe-card-copy"><small>{{ isRecipeKnown(recipe.id) ? recipe.origin : 'LOCKED LESSON' }}</small><b>{{ recipe.name }}</b><em v-if="isCitySpecialty(game.regionId, recipe.id)" class="specialty-badge">{{ game.region.name }} specialty · +{{ Math.round(SPECIALTY_PREMIUM * 100) }}%</em><p>{{ isRecipeKnown(recipe.id) ? recipe.story : 'Discover this recipe to reveal its story, ingredients and cooking path.' }}</p><span v-if="isRecipeKnown(recipe.id)">{{ recipe.ingredients.length }} ingredients · {{ recipe.needsShake ? 'Shake' : 'Build / stir' }} · {{ recipeAlcoholLabel(recipe) }}</span><span v-else>{{ recipeAlcoholLabel(recipe) }} · shop · special client · daily gift</span><em>{{ isRecipeKnown(recipe.id) ? 'Open lesson' : 'Need to learn first' }}</em></div>
          </button>
        </div>
        <div v-else class="recipe-shop-grid">
          <article v-for="recipe in shopRecipes" :key="recipe.id" class="locked-recipe-card">
            <div class="locked-art"><GlassModel :art-index="RECIPES.indexOf(recipe)" :recipe-id="recipe.id" type="coupe" /><span>LOCKED</span></div>
            <div><small>ADVANCED RECIPE</small><h3>{{ recipe.name }}</h3><p>{{ recipeAlcoholLabel(recipe) }} · {{ recipe.tastingNotes.join(' · ') }}</p><span>Unlock the full history, guest profile and method.</span></div>
            <button type="button" @click="game.buyRecipe(recipe.id)">Buy for {{ recipePriceLabel(recipe.id) }}</button>
          </article>
        </div>
      </template>
      <template v-else>
        <header class="panel-heading recipe-detail-heading"><button type="button" @click="selectedRecipeId = null"><UiIcon class="inline-icon" name="arrow-left" /> All recipes</button><div><small>{{ selectedRecipe.category }} · {{ selectedRecipe.origin }}</small><h2>{{ selectedRecipe.name }}</h2></div><span>{{ recipeAlcoholLabel(selectedRecipe) }} · {{ (selectedRecipe.price * game.economy.guestPriceFactor * specialtyFactor(game.regionId, selectedRecipe.id)).toFixed(0) }} coins<template v-if="isCitySpecialty(game.regionId, selectedRecipe.id)"> · {{ game.region.name }} specialty</template></span></header>
        <div class="recipe-detail-page">
          <aside class="recipe-hero-art"><GlassModel :art-index="RECIPES.indexOf(selectedRecipe)" :recipe-id="selectedRecipe.id" type="coupe" /><div><small>TASTING PROFILE · {{ recipeAlcoholLabel(selectedRecipe) }}</small><div class="tasting-badges"><span v-for="note in selectedRecipe.tastingNotes" :key="note">{{ note }}</span></div></div></aside>
          <RecipeMastery :recipe="selectedRecipe" />
          <section class="recipe-story"><small>THE STORY</small><h3>A drink with a past <SpeakButton :text="selectedRecipe.name" /></h3><p>{{ selectedRecipe.story }} <SpeakButton :text="selectedRecipe.story" /></p><UiButton variant="secondary" size="sm" class="guide-open" @click="openGuide('cocktail', selectedRecipe.id)">Full history, method &amp; why choose it <UiIcon class="inline-icon" name="arrow-right" /></UiButton><div class="occasion-block"><small>WHEN IT IS A GOOD CHOICE</small><div><span v-for="occasion in selectedRecipe.occasions" :key="occasion">{{ occasion }}</span></div></div></section>
          <section class="recipe-formula"><small>WHAT YOU NEED</small><h3>Bar formula</h3><div v-for="part in selectedRecipe.ingredients" :key="part.ingredientId" class="formula-ingredient-card"><div class="formula-icon"><BottleModel :ingredient="ingredientById(part.ingredientId)" /></div><b class="formula-name">{{ ingredientById(part.ingredientId).name }}</b><span class="formula-amount">{{ part.amount }} {{ ingredientById(part.ingredientId).unit }}</span><small class="formula-action">{{ formulaActions.get(part.ingredientId) }}</small><UiButton variant="secondary" size="sm" class="guide-open" :aria-label="`About ${ingredientById(part.ingredientId).name}`" @click="openGuide('ingredient', part.ingredientId)">About</UiButton></div></section>
          <section class="recipe-method"><small>COOKING PATH</small><h3>{{ selectedRecipe.needsShake ? 'Shake and serve' : 'Build with control' }}</h3><ol><li v-for="(step, index) in selectedRecipe.method" :key="step"><b>{{ index + 1 }}</b><span>{{ step }}</span></li></ol></section>
        </div>
      </template>
    </article>
</template>
<style scoped>
.bottle-inventory-tools { display:flex; flex-wrap:wrap; align-items:end; justify-content:space-between; gap:12px; margin:12px 0; }
.bottle-inventory-tools > :first-child { flex:1 1 240px; max-width:480px; }
.bottle-pagination { display:flex; align-items:center; gap:8px; }
.bottle-pagination span { font-size:.85rem; color:var(--muted, #a8b6c9); white-space:nowrap; }
</style>

