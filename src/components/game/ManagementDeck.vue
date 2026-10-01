<script setup lang="ts">
import UiButton from '../ui/UiButton.vue';
import WorkshopStock from './WorkshopStock.vue';
import SpeakButton from '../ui/SpeakButton.vue';
import UiInput from '../ui/UiInput.vue';
import CrystalAmount from '../ui/CrystalAmount.vue';
import PanelHeading from '../ui/PanelHeading.vue';
import { computed, ref, watch } from 'vue';
import { INGREDIENTS, RECIPES, REGIONS, recipeAlcoholLabel } from '../../domain/catalog';
import { ALCOHOL_PRODUCTS, ALCOHOL_TYPE_LABELS, bottleSaleCrystalReward } from '../../domain/bottleCatalog';
import UiIcon from '../ui/UiIcon.vue';
import BrandBottle from '../knowledge/BrandBottle.vue';
import { guideIdForProduct } from '../../data/knowledge/alcohol';
import { isEventInterior } from '../../data/cosmetics/bars';
import { HIGHLIGHTS, HIGHLIGHT_STRENGTHS, INTERIORS, POSES, SHELF_STYLES, WALLS, interiorStyle, shelfStyleFor } from '../../data/cosmetics/bars';
import { capacityFor, isPerishable } from '../../domain/warehouse';
import { SPECIALTY_PREMIUM, isCitySpecialty, specialtyFactor } from '../../domain/economy';
import type { Ingredient, RegionId } from '../../domain/types';
import { useGameStore } from '../../stores/game';
import BottleModel from '../cocktails/BottleModel.vue';
import RecipeMastery from '../cocktails/RecipeMastery.vue';
import GlassModel from '../cocktails/GlassModel.vue';
import PairingAdvisor from '../PairingAdvisor.vue';
import MarketPanel from './MarketPanel.vue';
import { useGuide } from '../../composables/useGuide';
import { recipeCard } from '../../data/knowledge/guides';
import WorldMap from './WorldMap.vue';
import OptionSelect, { type SelectOption } from './OptionSelect.vue';
import BarScene from './BarScene.vue';
import DeliveryProblems from './DeliveryProblems.vue';
import CharacterModel from '../characters/CharacterModel.vue';
import { avatarOptionsFor, avatarLabel, type AvatarOption, type AvatarOptionKey } from '../../data/cosmetics/avatar';
import { BAR_PROFILE_OPTIONS } from '../../data/cosmetics/bars';

withDefaults(defineProps<{ activeView?: string }>(), { activeView: 'inventory' });
const game = useGameStore();
const stockCategory = ref<'all' | 'spirit' | 'mixer' | 'fresh' | 'food' | 'items' | 'shards' | 'cards'>('all');
// Tabs for Workshop items, shards and cards appear only when the player owns something of that kind.
const stockTabs = computed(() => {
  const loot = game.loot;
  const tabs: { id: typeof stockCategory.value; label: string }[] = [{ id: 'all', label: 'All' }, { id: 'spirit', label: 'Spirits' }, { id: 'mixer', label: 'Mixers' }, { id: 'fresh', label: 'Fresh' }, { id: 'food', label: 'Food' }];
  const hasItems = loot.parts > 0 || Object.values(loot.boxes).some((n) => n > 0) || Object.values(loot.consumables).some((n) => n > 0) || Object.values(game.circle.keepsakes).some((n) => n > 0);
  const hasShards = loot.skinShards > 0 || Object.values(loot.itemShards).some((n) => n > 0) || Object.values(game.circle.shards).some((n) => n > 0);
  if (hasItems) tabs.push({ id: 'items', label: 'Items' });
  if (hasShards) tabs.push({ id: 'shards', label: 'Shards' });
  if (recipeCardInventory.value.length) tabs.push({ id: 'cards', label: 'Cards' });
  return tabs;
});
const isStockKind = computed(() => ['all', 'spirit', 'mixer', 'fresh', 'food'].includes(stockCategory.value));
const selectedRecipeId = ref<string | null>(null);
const recipeMode = ref<'library' | 'shop'>('library');
const recipeSearch = ref('');
const matchesSearch = (name: string) => !recipeSearch.value.trim() || name.toLowerCase().includes(recipeSearch.value.trim().toLowerCase());
const libraryRecipes = computed(() => RECIPES.filter((recipe) => matchesSearch(recipe.name)));
const shopRecipes = computed(() => game.lockedRecipes.filter((recipe) => matchesSearch(recipe.name)));
const transferIngredientId = ref(INGREDIENTS[0]!.id);
const barName = ref(game.decor.name);
const bartenderNickname = ref(game.decor.bartenderNickname ?? (game.decor.bartenderCharacter === 'leo' ? 'Leo' : 'Noa'));
watch(() => game.regionId, () => {
  barName.value = game.decor.name;
  bartenderNickname.value = game.decor.bartenderNickname ?? (game.decor.bartenderCharacter === 'leo' ? 'Leo' : 'Noa');
});

const fridgeLevel = computed(() => game.loot.equipment[game.regionId]?.fridge?.level ?? 0);
const capacityOf = (id: string) => capacityFor(INGREDIENTS.find((item) => item.id === id)!, fridgeLevel.value);
const ingredientById = (id: string) => INGREDIENTS.find((item) => item.id === id)!;
const bottleById = (id: string) => ALCOHOL_PRODUCTS.find((item) => item.id === id)!;
const uiCategory = (ingredient: Ingredient) => ingredient.category === 'food' ? 'food' : ingredient.category === 'spirit' ? 'spirit' : ingredient.category === 'mixer' && !['sugar-syrup', 'coconut-cream', 'milk', 'coconut-milk'].includes(ingredient.id) ? 'mixer' : 'fresh';
const visibleStock = computed(() => game.visibleInventory.filter((stock) => stockCategory.value === 'all' || uiCategory(ingredientById(stock.ingredientId)) === stockCategory.value));
const { openGuide } = useGuide();
// What to do with each ingredient of the open recipe (pour, top up, garnish…), from the recipe card.
const formulaActions = computed(() => selectedRecipe.value ? new Map(recipeCard(selectedRecipe.value).lines.filter((line) => line.ingredientId).map((line) => [line.ingredientId!, line.action])) : new Map<string, string>());
const selectedRecipe = computed(() => RECIPES.find((recipe) => recipe.id === selectedRecipeId.value) ?? null);
const targetRegions = computed(() => REGIONS.filter((region) => region.id !== game.regionId && game.isBarOwned(region.id)));
const barUnits = (id: RegionId) => game.inventories[id].reduce((sum, stock) => sum + stock.amount, 0);
const barBottles = (id: RegionId) => game.bottleInventories[id].reduce((sum, stock) => sum + stock.quantity, 0);
const selectedBartender = computed(() => game.decor.bartenderCharacter ?? 'noa');
const visibleOutfits = computed(() => selectedBartender.value === 'noa' ? ['vest','shirt','tee-skirt','suit-jeans','biker','bunny','kimono','baggy-tee','streetwear'] as const : ['vest','shirt','biker'] as const);
const outfitLabel = (outfit: string) => ({
  vest:'Leather jacket',shirt:selectedBartender.value === 'leo' ? 'Plaid shirt' : 'Cropped tee',biker:selectedBartender.value === 'leo' ? 'Biker jeans' : 'Leather set','tee-skirt':'Tee & skirt','suit-jeans':'Jacket & jeans',bunny:'Bunny suit',kimono:'Kimono','baggy-tee':'Baggy tee',streetwear:'Streetwear',
  'special-gala':'Midnight gown','special-cyberpunk':'Cyberpunk','special-steampunk':'Steampunk','special-post-apocalypse':'Wasteland','special-historical':'Historical','special-fantasy':'Fantasy','special-masquerade':'Masquerade'
}[outfit] ?? outfit);
const isRecipeKnown = (id: string) => game.knownRecipeIds.includes(id);
const recipeCardInventory = computed(() => RECIPES.map((recipe) => ({ recipe, quantity: game.recipeCopies[recipe.id] ?? 0 })).filter((item) => item.quantity > 0));
const isInteriorOwned = (id: string) => game.ownedInteriorIds.includes(id);
const cosmeticLocked = (key:string,value:string) => !game.canUseCosmetic(key,value);
const DESIGN_TABS = [{ id: 'bar', label: 'Bar' }, { id: 'clothes', label: 'Clothes' }, { id: 'character', label: 'Character' }] as const;
const designTab = ref<typeof DESIGN_TABS[number]['id']>('bar');
const avatarOptions = computed(() => avatarOptionsFor(selectedBartender.value));
const clothesOptions = computed(() => avatarOptions.value.filter((option) => option.key === 'outfitColor'));
const characterOptions = computed(() => avatarOptions.value.filter((option) => option.key !== 'outfitColor'));
// Every choice plus the saved one (legacy values stay visible but cannot be re-picked).
function avatarChoices(option: AvatarOption): SelectOption[] {
  const saved: string = game.decor[option.key];
  const values = option.values;
  const choices = values.map((value) => ({ value, label: avatarLabel(value), locked: cosmeticLocked(option.key, value) }));
  return values.includes(saved) ? choices : [{ value: saved, label: `${avatarLabel(saved)} (saved style)`, locked: true }, ...choices];
}
function setAvatarOption(key: AvatarOptionKey, value: string) {
  if (cosmeticLocked(key,value) || !(BAR_PROFILE_OPTIONS[key] as readonly string[]).includes(value)) return;
  // The catalog and profile options above validate the dynamic field/value pair.
  Object.assign(game.decor, { [key]: value });
}
const recipePriceLabel = (id: string) => {
  const price = game.recipePrice(id);
  return `${price.amount} ${price.currency}`;
};
const barPriceLabel = () => game.nextBarPrice.currency === 'coins' ? `${game.nextBarPrice.amount.toLocaleString()} coins` : `${game.nextBarPrice.amount.toLocaleString()} crystals`;
const barActionLabel = (id: RegionId) => {
  if (!game.startingBarChosen) return 'Choose · free';
  if (game.isBarOwned(id)) return id === game.regionId ? 'Active bar' : 'Switch';
  if (game.level < game.barPurchaseLevel) return `Level ${game.barPurchaseLevel}`;
  return `Buy · ${barPriceLabel()}`;
};
function regionAction(id: RegionId) {
  if (!game.startingBarChosen) game.chooseStartingBar(id);
  else if (game.isBarOwned(id)) game.switchBar(id);
  else game.buyBar(id);
}
function selectBartender(id: 'noa' | 'leo') {
  const oldDefault = selectedBartender.value === 'leo' ? 'Leo' : 'Noa';
  game.decor.bartenderCharacter = id;
  if (game.decor.bartender.startsWith('special-')) game.decor.bartender = id === 'leo' ? 'shirt' : 'vest';
  if (id === 'leo' && !['shirt','biker'].includes(game.decor.bartender)) game.decor.bartender = 'shirt';
  if (id === 'leo') {
    game.decor.bodyShape = 'muscular';
    game.decor.hairStyle = 'slick';
    game.decor.skinDetail = 'clean';
    game.decor.facialHair = 'short-beard';
    game.decor.eyeliner = 'none'; game.decor.eyeshadow = 'none'; game.decor.blush = 'none'; game.decor.lipColor = 'bare';
  } else {
    game.decor.bodyShape = 'curvy';
    game.decor.hairStyle = 'updo';
    game.decor.skinDetail = 'clean';
    game.decor.facialHair = 'clean';
    if (game.decor.eyeshadow === 'none') game.decor.eyeshadow = 'bronze';
    if (game.decor.lipColor === 'bare') game.decor.lipColor = 'rose';
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
      <PanelHeading :eyebrow="`STOCK ROOM · ${game.region.name}`" title="Bar inventories" :aside="`${game.inventory.length} ingredients · ${game.bottleInventory.length} sealed brands`" />
      <div class="bar-switcher" aria-label="Choose a bar inventory">
        <button v-for="region in REGIONS.filter(item => game.isBarOwned(item.id))" :key="region.id" :class="{ active: region.id === game.regionId }" type="button" @click="game.switchBar(region.id)"><b>{{ region.name }}</b><small>{{ barUnits(region.id).toLocaleString() }} ingredient units · {{ barBottles(region.id) }} bottles</small></button>
      </div>
      <div class="inventory-tools">
        <div class="category-tabs inventory-filter">
          <button v-for="tab in stockTabs" :key="tab.id" :class="{ active: stockCategory === tab.id }" type="button" @click="stockCategory = tab.id">{{ tab.label }}</button>
        </div>
        <div v-if="targetRegions.length" class="transfer-console">
          <div><small>MOVE BETWEEN BARS</small><b>Stock transfer</b></div>
          <OptionSelect label="Ingredient" v-model="transferIngredientId" :options="INGREDIENTS.map((ingredient) => ({ value: ingredient.id, label: ingredient.name }))" />
          <UiIcon class="inline-icon" name="arrow-right" />
          <OptionSelect label="To bar" v-model="game.transferTargetId" :options="targetRegions.map((region) => ({ value: region.id, label: region.name }))" />
          <button type="button" @click="game.transferStock(transferIngredientId, game.transferTargetId)">Transfer {{ ingredientById(transferIngredientId).unit === 'ml' ? '100 ml' : '3 pcs' }}</button>
        </div>
        <p v-else class="transfer-locked">Unlock a second bar at level {{ game.barPurchaseLevel }} to rotate stock between locations.</p>
      </div>
      <WorkshopStock v-if="stockCategory === 'items' || stockCategory === 'shards'" :kind="stockCategory" />
      <div v-if="isStockKind" class="inventory-cards">
        <div v-for="stock in visibleStock" :key="stock.ingredientId" class="inventory-card">
          <BottleModel :ingredient="ingredientById(stock.ingredientId)" />
          <div><b>{{ ingredientById(stock.ingredientId).name }}</b><small>{{ stock.amount }} / {{ capacityOf(stock.ingredientId) }} {{ ingredientById(stock.ingredientId).unit }}<template v-if="isPerishable(ingredientById(stock.ingredientId))"> · fresh, spoils</template></small></div>
          <span>{{ uiCategory(ingredientById(stock.ingredientId)) }}</span>
          <em v-if="game.lowGrade[stock.ingredientId]?.damaged" class="grade damaged" title="Damaged: cocktails only">{{ game.lowGrade[stock.ingredientId]!.damaged }} damaged</em>
          <em v-if="game.lowGrade[stock.ingredientId]?.expiring" class="grade expiring" title="Close to its date: use it soon">{{ game.lowGrade[stock.ingredientId]!.expiring }} old</em>
        </div>
      </div>
      <DeliveryProblems />
      <section v-if="(stockCategory === 'all' || stockCategory === 'cards') && recipeCardInventory.length" class="recipe-item-inventory">
        <header><div><small>COLLECTIBLE ITEMS</small><h3>Recipe cards</h3></div><span>Duplicates are spent on mastery upgrades.</span></header>
        <div><article v-for="item in recipeCardInventory" :key="item.recipe.id"><GlassModel :art-index="RECIPES.indexOf(item.recipe)" :recipe-id="item.recipe.id" type="coupe" /><span><small>RECIPE ITEM</small><b>{{ item.recipe.name }}</b><em>Owned ×{{ item.quantity }}</em></span><strong>×{{ item.quantity }}</strong></article></div>
      </section>
      <section v-if="stockCategory === 'all' || stockCategory === 'spirit'" class="sealed-stock-section">
        <header><div><small>FULL-BOTTLE RETAIL</small><h3>Popular brands ready to sell</h3></div><span>{{ barBottles(game.regionId) }} sealed bottles</span></header>
        <div class="sealed-stock-grid">
          <article v-for="stock in game.bottleInventory" :key="stock.productId">
            <div class="stock-brand-model"><BrandBottle :brand="bottleById(stock.productId).brand" :category="guideIdForProduct(bottleById(stock.productId))" :color="bottleById(stock.productId).color" /></div>
            <div><small>{{ ALCOHOL_TYPE_LABELS[bottleById(stock.productId).type] }} · {{ bottleById(stock.productId).abv }}% ABV</small><b>{{ bottleById(stock.productId).name }}</b><span>{{ bottleById(stock.productId).volumeMl }} ml · customer pays {{ (bottleById(stock.productId).price * game.economy.guestPriceFactor).toFixed(2) }} coins + <CrystalAmount :value="bottleSaleCrystalReward(bottleById(stock.productId))" /></span></div>
            <strong>{{ stock.quantity }}×</strong>
            <button v-if="game.bottleCrystalCost(stock.productId)" class="reserve-restock" type="button" :disabled="game.crystals < game.bottleCrystalCost(stock.productId)" @click="game.buyBottleStock(stock.productId)">+1 reserve · <CrystalAmount :value="game.bottleCrystalCost(stock.productId)" /></button>
          </article>
        </div>
      </section>
    </article>

    <MarketPanel v-show="activeView === 'market'" />

    <article v-show="activeView === 'recipes'" class="game-panel recipes-deck">
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
        <header class="panel-heading recipe-detail-heading"><button type="button" @click="selectedRecipeId = null"><UiIcon class="inline-icon" name="arrow-left" /> All recipes</button><div><small>{{ selectedRecipe.category }} · {{ selectedRecipe.origin }}</small><h2>{{ selectedRecipe.name }}</h2></div><span>{{ recipeAlcoholLabel(selectedRecipe) }} · {{ (selectedRecipe.price * game.economy.guestPriceFactor * specialtyFactor(game.regionId, selectedRecipe.id)).toFixed(2) }} coins<template v-if="isCitySpecialty(game.regionId, selectedRecipe.id)"> · {{ game.region.name }} specialty</template></span></header>
        <div class="recipe-detail-page">
          <aside class="recipe-hero-art"><GlassModel :art-index="RECIPES.indexOf(selectedRecipe)" :recipe-id="selectedRecipe.id" type="coupe" /><div><small>TASTING PROFILE · {{ recipeAlcoholLabel(selectedRecipe) }}</small><div class="tasting-badges"><span v-for="note in selectedRecipe.tastingNotes" :key="note">{{ note }}</span></div></div></aside>
          <RecipeMastery :recipe="selectedRecipe" />
          <section class="recipe-story"><small>THE STORY</small><h3>A drink with a past <SpeakButton :text="selectedRecipe.name" /></h3><p>{{ selectedRecipe.story }} <SpeakButton :text="selectedRecipe.story" /></p><button type="button" class="guide-open" @click="openGuide('cocktail', selectedRecipe.id)">Full history, method &amp; why choose it <UiIcon class="inline-icon" name="arrow-right" /></button><div class="occasion-block"><small>WHEN IT IS A GOOD CHOICE</small><div><span v-for="occasion in selectedRecipe.occasions" :key="occasion">{{ occasion }}</span></div></div></section>
          <section class="recipe-formula"><small>WHAT YOU NEED</small><h3>Bar formula</h3><div v-for="part in selectedRecipe.ingredients" :key="part.ingredientId" class="formula-ingredient-card"><div class="formula-icon"><BottleModel :ingredient="ingredientById(part.ingredientId)" /></div><b class="formula-name">{{ ingredientById(part.ingredientId).name }}</b><span class="formula-amount">{{ part.amount }} {{ ingredientById(part.ingredientId).unit }}</span><small class="formula-action">{{ formulaActions.get(part.ingredientId) }}</small><button type="button" class="guide-open" :aria-label="`About ${ingredientById(part.ingredientId).name}`" @click="openGuide('ingredient', part.ingredientId)">About</button></div></section>
          <section class="recipe-method"><small>COOKING PATH</small><h3>{{ selectedRecipe.needsShake ? 'Shake and serve' : 'Build with control' }}</h3><ol><li v-for="(step, index) in selectedRecipe.method" :key="step"><b>{{ index + 1 }}</b><span>{{ step }}</span></li></ol></section>
        </div>
      </template>
    </article>

    <article v-show="activeView === 'design'" class="game-panel design-deck">
      <PanelHeading eyebrow="PERSONALIZE" title="Bar & bartender" aside="Live preview" />
      <div class="design-tabs" role="tablist" aria-label="Design sections"><button v-for="tab in DESIGN_TABS" :key="tab.id" role="tab" type="button" :aria-selected="designTab === tab.id" :class="{ active: designTab === tab.id }" @click="designTab = tab.id">{{ tab.label }}</button></div>
      <div class="design-grid-new">
        <!-- Bar: the real bar scene in preview mode, pinned while the options scroll. -->
        <div v-show="designTab === 'bar'" class="design-tab-bar">
      <div class="design-location-tabs"><button v-for="region in REGIONS.filter(item => game.isBarOwned(item.id))" :key="region.id" :class="{active:region.id === game.regionId}" type="button" @click="game.switchBar(region.id)">{{ region.name }}</button></div>
      <form class="bar-name-editor" @submit.prevent="game.renameBar(barName)"><label :for="'bar-name'">Bar name in {{ game.region.name }}<UiInput id="bar-name" v-model="barName" maxlength="32" required placeholder="Name your bar" /></label><UiButton type="submit" variant="solid">Save name</UiButton></form>
          <div class="design-preview" aria-label="Live preview of your bar"><BarScene preview :active="false" /></div>
        <div class="design-options">
          <section class="background-picker"><small>{{ INTERIORS.length }} BACKGROUNDS · {{ game.ownedInteriorIds.length }} OWNED</small><div><button v-for="interior in INTERIORS" :key="interior.id" :class="{active:game.decor.interior === interior.id,locked:!isInteriorOwned(interior.id),special:'special' in interior && interior.special}" :style="interiorStyle(interior.id)" type="button" @click="game.chooseInterior(interior.id)"><em v-if="!isInteriorOwned(interior.id)"><template v-if="isEventInterior(interior.id)">★ Event · boxes</template><CrystalAmount v-else :value="interior.crystalCost" /></em><span>{{ interior.name }}</span></button></div></section>
          <section><small>WALL COLOR</small><div><button v-for="wall in WALLS" :key="wall" :class="{ active: game.decor.wall === wall }" type="button" @click="game.decor.wall = wall"><i :data-color="wall"></i>{{ wall }}</button></div></section>
          <section class="shelf-style-picker"><small>BACK-BAR SHELVES · {{ shelfStyleFor(game.decor) }}</small><div><button v-for="shelf in SHELF_STYLES" :key="shelf" :class="{ active: (game.decor.shelf ?? 'auto') === shelf }" :data-shelf-swatch="shelf === 'auto' ? shelfStyleFor({ interior: game.decor.interior }) : shelf" type="button" @click="game.decor.shelf = shelf">{{ shelf === 'auto' ? 'Match background' : shelf }}</button></div></section>
          <section><small>HIGHLIGHT COLOR</small><div><button v-for="light in HIGHLIGHTS" :key="light" :class="{ active: game.decor.lighting === light }" type="button" @click="game.decor.lighting = light"><i :data-color="light"></i>{{ light }}</button></div></section>
          <section><small>HIGHLIGHT STRENGTH</small><div><button v-for="strength in HIGHLIGHT_STRENGTHS" :key="strength" :class="{ active: game.decor.highlightStrength === strength }" type="button" @click="game.decor.highlightStrength = strength">{{ strength }}</button></div></section>
          <section><small>POSE · OUTFITS HAVE THEIR OWN GESTURE</small><div><button v-for="(pose,index) in POSES" :key="pose" :class="{active:game.decor.pose === pose}" type="button" @click="game.decor.pose = pose">Pose {{ index + 1 }}</button></div></section>
        </div>
        </div>
        <!-- Clothes and Character share one pinned 3D viewer; the options scroll underneath it. -->
        <div v-show="designTab !== 'bar'" class="bartender-custom">
          <div class="avatar-stage">
            <CharacterModel role="bartender" interactive :character-id="selectedBartender" :outfit="game.decor.bartender" :hair-style="game.decor.hairStyle" :hair-color="game.decor.hairColor" :body-shape="game.decor.bodyShape" :eye-shape="game.decor.eyeShape" :eye-color="game.decor.eyeColor" :brow-shape="game.decor.browShape" :nose-shape="game.decor.noseShape" :cheek-shape="game.decor.cheekShape" :lip-shape="game.decor.lipShape" :lip-color="game.decor.lipColor" :eyeshadow="game.decor.eyeshadow" :eyeliner="game.decor.eyeliner" :blush="game.decor.blush" :facial-hair="game.decor.facialHair" :outfit-color="game.decor.outfitColor" :pose="game.decor.pose" />
          </div>
          <div v-show="designTab === 'clothes'" class="design-tab-clothes">
          <div class="bartender-selector" aria-label="Choose bartender">
            <button v-for="person in [{id:'noa',label:'Woman bartender'},{id:'leo',label:'Man bartender'}] as const" :key="person.id" :class="{ active: selectedBartender === person.id }" type="button" @click="selectBartender(person.id)">{{ person.label }}</button>
          </div>
          <div class="outfit-selector" aria-label="Choose bartender outfit"><button v-for="outfit in visibleOutfits" :key="outfit" :class="{ active: game.decor.bartender === outfit || (outfit === 'shirt' && game.decor.bartender === 'apron'), special:outfit.startsWith('special-'), locked:cosmeticLocked('bartender',outfit) }" type="button" :disabled="cosmeticLocked('bartender',outfit)" :title="cosmeticLocked('bartender',outfit) ? 'Unlock in the daily style draw' : outfitLabel(outfit)" @click="game.decor.bartender = outfit"><em v-if="cosmeticLocked('bartender',outfit)"><UiIcon class="inline-icon" name="lock" /></em>{{ outfitLabel(outfit) }}</button></div>
            <div class="avatar-options">
              <OptionSelect v-for="option in clothesOptions" :key="option.key" :label="option.label" :model-value="game.decor[option.key]" :options="avatarChoices(option)" @update:model-value="setAvatarOption(option.key, $event)" />
            </div>
          </div>
          <div v-show="designTab === 'character'" class="design-tab-character">
      <form class="bartender-name-editor" @submit.prevent="game.renameBartender(bartenderNickname)"><label for="bartender-nickname">Bartender nickname<UiInput id="bartender-nickname" v-model="bartenderNickname" maxlength="18" required placeholder="Enter a nickname" /></label><UiButton type="submit" variant="solid">Save nickname</UiButton><span>This is the name guests see.</span></form>
            <p class="avatar-help">Drag to turn your character. Changes are saved with this bar.</p>
            <div class="avatar-options">
              <OptionSelect v-for="option in characterOptions" :key="option.key" :label="option.label" :model-value="game.decor[option.key]" :options="avatarChoices(option)" @update:model-value="setAvatarOption(option.key, $event)" />
            </div>
          </div>
        </div>
      </div>
    </article>

    <article v-show="activeView === 'regions'" class="game-panel regions-deck">
      <PanelHeading eyebrow="WORLD TOUR" :title="`${game.startingBarChosen ? 'Build your bar network' : 'Choose your first city'}`" :aside="`${game.ownedBarIds.length} / ${REGIONS.length} bars open`" />
      <div class="bar-unlock-rules"><b>{{ game.startingBarChosen ? `Expansion unlocks at level ${game.barPurchaseLevel}` : 'Your first bar is free' }}</b><span>The second location costs coins. Every later location costs crystals. Each bar keeps its own name, look and inventory.</span></div>
      <WorldMap />
      <div class="region-cards"><article v-for="region in REGIONS" :key="region.id" :class="{ active: region.id === game.regionId && game.isBarOwned(region.id), locked: !game.isBarOwned(region.id) }"><img :src="INTERIORS.find(item => item.id === game.bars[region.id].interior)?.asset" alt="" /><small>{{ region.name }}</small><b>{{ game.bars[region.id].name }}</b><small>{{ region.tagline }}</small><span v-if="game.isBarOwned(region.id)">{{ region.marketFactor }}× prices · {{ barUnits(region.id).toLocaleString() }} stock</span><span v-else>{{ game.level < game.barPurchaseLevel && game.startingBarChosen ? `Level ${game.barPurchaseLevel} required` : 'Location not owned' }}</span><button type="button" :disabled="game.startingBarChosen && (game.isBarOwned(region.id) && region.id === game.regionId || !game.isBarOwned(region.id) && game.level < game.barPurchaseLevel)" @click="regionAction(region.id)">{{ barActionLabel(region.id) }}</button></article></div>
    </article>

    <PairingAdvisor v-show="activeView === 'advisor'" />
  </section>
</template>
