<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted } from 'vue';
import { TECHNIQUE_EXPLAINED } from '../../data/knowledge/cocktails';
import { guideFor, recipeCard } from '../../data/knowledge/guides';
import { INGREDIENT_GUIDES, KIND_LABEL } from '../../data/knowledge/ingredients';
import { BRANDS, EXTRA_ALCOHOL_GUIDES, shopProductsFor } from '../../data/knowledge/alcohol';
import { bottleTotal } from '../../domain/bottleCatalog';
import { useGameStore } from '../../stores/game';
import { useGuide } from '../../composables/useGuide';
import { INGREDIENTS, RECIPES } from '../../domain/catalog';
import { canSpeak, speak } from '../../domain/english/speak';
import BottleModel from '../cocktails/BottleModel.vue';
import BrandBottle from './BrandBottle.vue';
import { SIGNATURE_BRANDS, SIGNATURE_REASON_LABEL } from '../../data/knowledge/signatureBrands';

const { current, openGuide, closeGuide } = useGuide();
const recipe = computed(() => current.value?.kind === 'cocktail' ? RECIPES.find((item) => item.id === current.value!.id) : undefined);
const cocktail = computed(() => recipe.value && guideFor(recipe.value));
const card = computed(() => recipe.value && recipeCard(recipe.value));
const ingredient = computed(() => current.value?.kind === 'ingredient' ? INGREDIENTS.find((item) => item.id === current.value!.id) : undefined);
const extraGuide = computed(() => current.value?.kind === 'ingredient' ? EXTRA_ALCOHOL_GUIDES[current.value.id] : undefined);
const ingredientGuide = computed(() => ingredient.value ? INGREDIENT_GUIDES[ingredient.value.id] : extraGuide.value);
const guideName = computed(() => ingredient.value?.name ?? extraGuide.value?.name ?? '');
const brands = computed(() => current.value?.kind === 'ingredient' ? BRANDS[current.value.id] ?? [] : []);
const game = useGameStore();
const stockOf = (productId: string) => game.bottleInventory.find((item) => item.productId === productId)?.quantity ?? 0;
const usedIn = computed(() => ingredient.value ? RECIPES.filter((item) => item.ingredients.some((part) => part.ingredientId === ingredient.value!.id)) : []);
const recipeByName = (name: string) => RECIPES.find((item) => item.name === name);
const signature = computed(() => recipe.value ? SIGNATURE_BRANDS[recipe.value.id] ?? [] : []);
const signatureFor = (ingredientId?: string) => signature.value.find((item) => item.ingredientId && item.ingredientId === ingredientId);
const brandNote = (category: string, name: string) => (BRANDS[category] ?? []).find((brand) => brand.name === name);
// Cocktails that name a brand in their history, for the brand list of an alcohol guide.
const brandCocktails = (name: string) => Object.entries(SIGNATURE_BRANDS).filter(([, list]) => list.some((item) => item.brand === name)).map(([id]) => RECIPES.find((item) => item.id === id)).filter((item) => !!item);

const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') closeGuide(); };
onMounted(() => window.addEventListener('keydown', onKey));
onBeforeUnmount(() => window.removeEventListener('keydown', onKey));
</script>

<template>
  <div v-if="current" class="guide-backdrop" @click.self="closeGuide()">
    <article class="guide-sheet" role="dialog" aria-modal="true" :aria-label="recipe?.name ?? guideName">
      <button class="guide-close" type="button" aria-label="Close guide" @click="closeGuide()">×</button>

      <!-- COCKTAIL -->
      <template v-if="recipe && cocktail">
        <header class="guide-head">
          <small>COCKTAIL GUIDE · {{ recipe.origin }}</small>
          <h2>{{ recipe.name }} <button v-if="canSpeak()" type="button" class="guide-speak" aria-label="Listen to the name" @click="speak(recipe.name)">🔊</button></h2>
          <p>{{ cocktail.summary }}</p>
          <div class="guide-badges"><span>{{ cocktail.preparation.technique }}</span><span>{{ cocktail.strength }}</span><span v-for="note in recipe.tastingNotes" :key="note">{{ note }}</span></div>
        </header>

        <section class="guide-section">
          <h3>History</h3>
          <ol class="guide-timeline"><li v-for="step in cocktail.timeline" :key="step.when"><b>{{ step.when }}</b><span>{{ step.what }}</span></li></ol>
          <p>{{ cocktail.history }}</p>
        </section>

        <section class="guide-section">
          <h3>How it is made — and why</h3>
          <p class="guide-why"><b>{{ cocktail.preparation.technique }}.</b> {{ cocktail.preparation.why }}</p>
          <p class="guide-note">{{ TECHNIQUE_EXPLAINED[cocktail.preparation.technique] }}</p>
          <dl class="guide-facts"><dt>Glass</dt><dd>{{ cocktail.preparation.glass }}</dd><dt>Ice</dt><dd>{{ cocktail.preparation.ice }}</dd><dt>Garnish</dt><dd>{{ cocktail.preparation.garnish }}</dd></dl>
          <h4>Recipe card — step by step</h4>
          <ol v-if="card" class="recipe-card">
            <li v-for="(line, index) in card.lines" :key="index" :class="`role-${line.role}`">
              <span class="card-amount">{{ line.amount || '—' }}</span>
              <button v-if="line.ingredientId" type="button" class="guide-link card-name" @click="openGuide('ingredient', line.ingredientId)">{{ line.ingredient }}</button>
              <b v-else class="card-name">{{ line.ingredient }}</b>
              <span class="card-action">{{ line.action }}<em v-if="signatureFor(line.ingredientId)" class="card-brand">{{ SIGNATURE_REASON_LABEL[signatureFor(line.ingredientId)!.reason] }}: {{ signatureFor(line.ingredientId)!.brand }}</em></span>
            </li>
          </ol>
        </section>

        <section v-if="signature.length" class="guide-section">
          <h3>Brands for this drink</h3>
          <ul class="signature-list">
            <li v-for="item in signature" :key="item.brand">
              <div class="brand-model"><BrandBottle :brand="item.brand" :category="item.category" /></div>
              <div>
                <small>{{ SIGNATURE_REASON_LABEL[item.reason] }}</small>
                <button type="button" class="guide-link" @click="openGuide('ingredient', item.category)"><b>{{ item.brand }}</b></button>
                <p>{{ item.note }}</p>
                <p v-if="brandNote(item.category, item.brand)" class="guide-note">{{ brandNote(item.category, item.brand)!.description }}</p>
              </div>
            </li>
          </ul>
        </section>
        <section class="guide-section">
          <h3>Why choose it?</h3>
          <p><b>Taste:</b> {{ cocktail.taste }}</p>
          <ul class="guide-list"><li v-for="reason in cocktail.chooseWhen" :key="reason">{{ reason }}</li></ul>
          <h4>Compared with…</h4>
          <ul class="guide-compare"><li v-for="item in cocktail.compare" :key="item.other"><button v-if="recipeByName(item.other)" type="button" class="guide-link" @click="openGuide('cocktail', recipeByName(item.other)!.id)">{{ item.other }}</button><b v-else>{{ item.other }}</b> — {{ item.difference }}</li></ul>
          <h4>Variations</h4>
          <ul class="guide-compare"><li v-for="item in cocktail.variations" :key="item.name"><b>{{ item.name }}</b> — {{ item.change }}</li></ul>
        </section>

        <p class="guide-fun">💡 {{ cocktail.funFact }}</p>
      </template>

      <!-- INGREDIENT -->
      <template v-else-if="ingredientGuide">
        <header class="guide-head" :class="{ 'guide-head-ingredient': ingredient }">
          <BottleModel v-if="ingredient" :ingredient="ingredient" />
          <div>
            <small>{{ KIND_LABEL[ingredientGuide.kind].toUpperCase() }}<template v-if="ingredientGuide.abv"> · {{ ingredientGuide.abv }}</template></small>
            <h2>{{ guideName }} <button v-if="canSpeak()" type="button" class="guide-speak" aria-label="Listen to the name" @click="speak(guideName)">🔊</button></h2>
            <p>{{ ingredientGuide.summary }}</p>
          </div>
        </header>
        <section class="guide-section">
          <h3>Origin & history</h3>
          <dl class="guide-facts">
            <template v-if="ingredientGuide.origin"><dt>From</dt><dd>{{ ingredientGuide.origin }}</dd></template>
            <template v-if="ingredientGuide.madeFrom"><dt>Made from</dt><dd>{{ ingredientGuide.madeFrom }}</dd></template>
          </dl>
          <p>{{ ingredientGuide.history }}</p>
        </section>
        <section v-if="ingredientGuide.howMade" class="guide-section"><h3>How it is made</h3><p>{{ ingredientGuide.howMade }}</p></section>
        <section v-if="ingredientGuide.styles?.length" class="guide-section">
          <h3>Styles</h3>
          <ul class="guide-compare"><li v-for="style in ingredientGuide.styles" :key="style.name"><b>{{ style.name }}</b> — {{ style.note }}</li></ul>
        </section>
        <section v-if="brands.length" class="guide-section">
          <h3>Famous brands <small class="brand-count">{{ brands.length }}</small></h3>
          <ul class="brand-list">
            <li v-for="brand in brands" :key="brand.name" class="brand-item">
              <div class="brand-model"><BrandBottle :brand="brand.name" :category="current!.id" :color="shopProductsFor(brand)[0]?.color" /></div>
              <div>
              <header><b>{{ brand.name }}</b><button v-if="canSpeak()" type="button" class="guide-speak" :aria-label="`Listen to ${brand.name}`" @click="speak(brand.name)">🔊</button><span>{{ brand.from }} · since {{ brand.since }}</span></header>
              <p>{{ brand.description }}</p>
              <p v-for="product in shopProductsFor(brand)" :key="product.id" class="brand-shop">In your shop: <b>{{ product.name }}</b> · {{ product.volumeMl }} ml · {{ product.abv }}% · {{ bottleTotal(product, 1, game.region.marketFactor) }} coins · {{ stockOf(product.id) }} in stock</p>
              <p v-if="brandCocktails(brand.name).length" class="brand-cocktails">Classic in: <template v-for="(item, index) in brandCocktails(brand.name)" :key="item!.id"><button type="button" class="guide-link" @click="openGuide('cocktail', item!.id)">{{ item!.name }}</button>{{ index < brandCocktails(brand.name).length - 1 ? ', ' : '' }}</template></p>
              </div>
            </li>
          </ul>
          <p class="guide-note">Tip for sellers: the brand is a promise of a style. When a customer names a brand, ask what they like about it — then you can suggest a similar bottle if it is out of stock.</p>
        </section>
        <section class="guide-section">
          <h3>Taste & use</h3>
          <p><b>Flavour:</b> {{ ingredientGuide.flavour }}</p>
          <p><b>How bartenders use it:</b> {{ ingredientGuide.howToUse }}</p>
          <p class="guide-sell"><b>Selling tip:</b> {{ ingredientGuide.sellingTip }}</p>
          <p v-if="usedIn.length" class="guide-note">Used in: <template v-for="(item, index) in usedIn" :key="item.id"><button type="button" class="guide-link" @click="openGuide('cocktail', item.id)">{{ item.name }}</button>{{ index < usedIn.length - 1 ? ', ' : '' }}</template></p>
        </section>
        <p class="guide-fun">💡 {{ ingredientGuide.funFact }}</p>
      </template>

      <p v-else class="guide-note">No guide yet for this item.</p>
    </article>
  </div>
</template>
