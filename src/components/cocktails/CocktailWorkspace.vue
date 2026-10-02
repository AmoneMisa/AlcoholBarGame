<script setup lang="ts">
import UiButton from '../ui/UiButton.vue';
import CrystalAmount from '../ui/CrystalAmount.vue';
import UiIcon from '../ui/UiIcon.vue';
import { computed } from 'vue';
import { useGuide } from '../../composables/useGuide';
import { INGREDIENTS } from '../../domain/catalog';
import { ALCOHOL_PRODUCTS, ALCOHOL_TYPE_LABELS, bottleSaleCrystalReward, bottleTotal, brandedServeCrystalReward } from '../../domain/bottleCatalog';
import { guideIdForProduct } from '../../data/knowledge/alcohol';
import { signatureFor } from '../../domain/brandPours';
import { useGameStore } from '../../stores/game';
import { AUTO_SERVE_LEVEL } from '../../domain/progression';
import { haptic } from '../../telegram/webapp';
import BrandBottle from '../knowledge/BrandBottle.vue';

const game = useGameStore();
const { openGuide } = useGuide();
const activeBottle = computed(() => ALCOHOL_PRODUCTS.find((item) => item.id === game.customer.selectedBottleId));
const activeBottleStock = computed(() => game.bottleInventory.find((item) => item.productId === activeBottle.value?.id)?.quantity ?? 0);
const servedProduct = computed(() => game.customer.orderKind === 'serve' ? ALCOHOL_PRODUCTS.find((item) => item.id === game.customer.serveRequest?.productId) : undefined);
const currentStep = computed(() => !game.currentMix.length ? 1 : !game.shaken && game.recipe.needsShake ? 2 : 3);
const pourProduct = (ingredientId: string) => ALCOHOL_PRODUCTS.find((item) => item.id === game.pourBrands[ingredientId]);
const classicBrand = (ingredientId: string) => game.customer.orderRevealed && game.customer.orderKind !== 'serve' ? signatureFor(game.recipe.id, ingredientId)?.brand : undefined;

function shake() {
  haptic('medium');
  game.shakeCurrentMix();
}
function serve() {
  haptic('medium');
  game.serveMix();
}
</script>

<template>
  <section v-if="!game.hasCustomer" class="cocktail-workspace waiting-station game-panel">
    <div class="waiting-station-clock"><small>NEXT CUSTOMER</small><b>{{ game.nextCustomerCountdown }}</b></div>
    <div><small>BAR PREP TIME</small><h2>The station is ready</h2><p>A new guest will arrive between five minutes and two hours after the previous customer leaves. Inventory, learning, recipes, market, and bar design remain available while you wait.</p><UiButton variant="solid" :disabled="game.crystals < game.nextCustomerCrystalCost" @click="game.expediteCustomer()">Welcome next guest now · <CrystalAmount :value="game.nextCustomerCrystalCost" /></UiButton></div>
  </section>

  <section v-else-if="game.customer.orderKind === 'bottle'" class="cocktail-workspace bottle-order-station game-panel">
    <header class="panel-heading ornate-heading">
      <div><small>BOTTLE RETAIL</small><h2>{{ game.customer.orderRevealed && activeBottle ? `Prepare ${activeBottle.brand}` : 'Customer consultation' }}</h2></div>
      <span>{{ game.customer.orderRevealed ? 'Choice confirmed' : 'Ask · match · recommend' }}</span>
    </header>
    <div v-if="!game.customer.orderRevealed || !activeBottle" class="bottle-consultation-empty">
      <div class="sealed-bottle-placeholder" aria-hidden="true">
        <img src="/assets/drinks/bottles/mystery-sealed-bottle.webp" alt="" draggable="false" />
      </div>
      <div><small>THE CUSTOMER NEEDS FULL, SEALED BOTTLES</small><h3>Discover the complete request</h3><p>Ask how many bottles they need, their total budget, preferred alcohol type and flavour, and whether they have a favourite brand.</p><p class="talk-hint">Tap {{ game.customer.name }}’s speech bubble in the bar to talk.</p></div>
    </div>
    <div v-else class="confirmed-bottle-station">
      <div class="hero-brand-model"><BrandBottle :brand="activeBottle.brand" :category="guideIdForProduct(activeBottle)" :color="activeBottle.color" /><em>{{ activeBottle.abv }}%</em></div>
      <div><small>MOST COVERED MATCH</small><h3>{{ activeBottle.name }}</h3><p>{{ activeBottle.description }}</p><div class="bottle-sale-facts"><span>{{ ALCOHOL_TYPE_LABELS[activeBottle.type] }}</span><span>{{ activeBottle.volumeMl }} ml</span><span>{{ activeBottle.abv }}% ABV</span><span>{{ activeBottleStock }} in stock</span></div><strong>{{ game.customer.bottleRequest?.quantity }} bottle{{ game.customer.bottleRequest?.quantity === 1 ? '' : 's' }} · {{ bottleTotal(activeBottle, game.customer.bottleRequest?.quantity ?? 1, game.guestPriceFactor) }} coins · <CrystalAmount :value="bottleSaleCrystalReward(activeBottle, game.customer.bottleRequest?.quantity ?? 1)" /></strong><UiButton variant="solid" @click="game.openConversation(game.customer.id)">Return to customer and sell <UiIcon class="inline-icon" name="arrow-right" /></UiButton></div>
    </div>
  </section>

  <section v-else class="cocktail-workspace compact-order-station game-panel">
    <header class="panel-heading ornate-heading">
      <div><small>LIVE ORDER</small><h2>{{ game.customer.orderRevealed ? game.recipe.name : 'Learn what the guest wants' }}</h2><UiButton variant="secondary" size="sm" v-if="servedProduct" class="guide-open" @click="openGuide('ingredient', guideIdForProduct(servedProduct))">About {{ servedProduct.brand }}</UiButton><UiButton variant="secondary" size="sm" v-else-if="game.customer.orderRevealed" class="guide-open" @click="openGuide('cocktail', game.recipe.id)">Story & recipe</UiButton></div>
      <span>Step {{ currentStep }} / 3</span>
    </header>
    <div v-if="!game.customer.orderRevealed" class="compact-order-hidden">
      <div><small>CUSTOMER FIRST</small><h3>Talk before you pour</h3><p>Ask about flavour, strength, budget, and occasion. The counter becomes your measured work area as soon as the order is clear.</p><p class="talk-hint">Tap {{ game.customer.name }}’s speech bubble in the bar to talk.</p></div>
    </div>
    <div v-else class="compact-order-body">
      <div class="auto-serve" :class="{ locked: game.level < AUTO_SERVE_LEVEL }">
        <span>{{ game.level < AUTO_SERVE_LEVEL ? `Auto-serve unlocks at level ${AUTO_SERVE_LEVEL}` : 'Auto-serve makes this order from stock. Guests pay, but automated drinks get no tip.' }}</span>
        <UiButton variant="secondary" :disabled="game.level < AUTO_SERVE_LEVEL" @click="game.autoServe()">Auto-serve</UiButton>
      </div>
      <div class="counter-instructions"><small>PREPARATION STATION</small><b>Choose a bottle or ingredient to add a measured portion.</b><span>Use search to find a brand, alcohol type or food. Check the quantities below, then shake and serve.</span><em v-if="servedProduct">Specific brand order · pays <CrystalAmount :value="brandedServeCrystalReward(servedProduct)" /></em></div>
      <div class="compact-recipe-progress">
        <div v-for="part in game.recipe.ingredients" :key="part.ingredientId" :class="{ done: game.currentMix.find((item) => item.ingredientId === part.ingredientId)?.amount === part.amount, wrong: (game.currentMix.find((item) => item.ingredientId === part.ingredientId)?.amount ?? 0) > part.amount }">
          <span><b>{{ INGREDIENTS.find((item) => item.id === part.ingredientId)?.name }}</b><small v-if="pourProduct(part.ingredientId)">{{ pourProduct(part.ingredientId)!.brand }}</small><small v-else-if="servedProduct?.ingredientId === part.ingredientId">requested: {{ servedProduct.brand }}</small><small v-else-if="classicBrand(part.ingredientId)">classic: {{ classicBrand(part.ingredientId) }}</small></span>
          <strong>{{ game.currentMix.find((item) => item.ingredientId === part.ingredientId)?.amount ?? 0 }} / {{ part.amount }}</strong>
        </div>
      </div>
    </div>
    <footer class="workspace-actions compact-actions">
      <UiButton variant="secondary" size="lg" @click="game.resetMix">Clear</UiButton>
      <UiButton variant="secondary" size="lg" data-guide="shake" @click="shake">Shake</UiButton>
      <UiButton variant="solid" size="lg" data-guide="serve" :disabled="game.serving" @click="serve">Serve drink <UiIcon class="inline-icon" name="arrow-right" /></UiButton>
    </footer>
  </section>
</template>
