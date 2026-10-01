<script setup lang="ts">
import UiIcon from '../ui/UiIcon.vue';
import { computed } from 'vue';
import { RECIPES } from '../../domain/catalog';
import { recipePurchase } from '../../domain/economy';
import type { Recipe } from '../../domain/types';
import { RECIPE_MAX_LEVEL, recipeBonus, recipeCardsRequired, upgradeCost } from '../../sim/recipes';
import { useGameStore } from '../../stores/game';

// Recipe mastery: learned source, level rewards, and duplicate cards used for advanced upgrades.
const props = defineProps<{ recipe: Recipe }>();
const game = useGameStore();
const known = computed(() => game.knownRecipeIds.includes(props.recipe.id));
const level = computed(() => Math.min(RECIPE_MAX_LEVEL, Math.max(1, game.recipeLevels[props.recipe.id] ?? 1)));
const bonus = computed(() => recipeBonus(level.value));
const next = computed(() => level.value < RECIPE_MAX_LEVEL ? recipeBonus(level.value + 1) : undefined);
const cost = computed(() => upgradeCost(props.recipe, level.value));
const copies = computed(() => game.recipeCopies[props.recipe.id] ?? 0);
const cardsRequired = computed(() => recipeCardsRequired(level.value));
const sparePrice = computed(() => recipePurchase(props.recipe, RECIPES.indexOf(props.recipe)));
const unlockSource = computed(() => ({
  starter: 'Starter lesson',
  shop: 'Recipe shop',
  'special-client': 'VIP customer',
  'daily-gift': 'Daily gift',
  'daily-lesson': 'Daily lesson',
  'friend-gift': 'Friend gift'
}[game.recipeUnlockSources[props.recipe.id] ?? 'starter']));
const canUpgrade = computed(() => game.money >= (cost.value ?? Infinity) && copies.value >= cardsRequired.value);
const pct = (value: number) => `+${Math.round((value - 1) * 100)}%`;
</script>

<template>
  <section v-if="known" class="recipe-mastery">
    <header>
      <div><small>RECIPE MASTERY</small><span class="recipe-owned">LEARNED · {{ unlockSource }}</span></div>
      <span class="mastery-levels" :aria-label="`Level ${level} of ${RECIPE_MAX_LEVEL}`"><i v-for="step in RECIPE_MAX_LEVEL" :key="step" :class="{ on: step <= level, current: step === level }">{{ step }}</i></span>
    </header>
    <p>Level {{ level }} · guests pay <b>{{ pct(bonus.pay) }}</b> and tip <b>{{ pct(bonus.tips) }}</b> more for this drink.</p>
    <div class="recipe-card-balance"><span>{{ recipe.name.toUpperCase() }} CARDS</span><b>×{{ copies }}</b><em>{{ !next ? 'Mastery is complete; extra cards may be gifted.' : cardsRequired ? `Level ${level + 1} needs ${cardsRequired} cards.` : `Level ${level + 1} needs coins only.` }}</em></div>
    <button v-if="next && cost !== undefined" type="button" class="primary-button" :disabled="!canUpgrade" @click="game.upgradeRecipe(recipe.id)">
      Upgrade to level {{ level + 1 }} · {{ cost.toLocaleString('en-US') }} coins<span v-if="cardsRequired"> + {{ cardsRequired }} cards</span><em>pay {{ pct(next.pay) }}, tips {{ pct(next.tips) }}</em>
    </button>
    <p v-if="next && cardsRequired && copies < cardsRequired" class="mastery-help">You need {{ cardsRequired - copies }} more {{ recipe.name }} card{{ cardsRequired - copies === 1 ? '' : 's' }}. Earn duplicates from VIP recipe challenges, daily gifts, the recipe shop, or friends.</p>
    <p v-else-if="!next" class="mastery-max">Top level reached.</p>
    <footer>
      <span>Duplicate cards can upgrade this recipe or be gifted.</span>
      <button type="button" class="secondary-button" :disabled="sparePrice.currency === 'coins' ? game.money < sparePrice.amount : game.crystals < sparePrice.amount" @click="game.buyRecipe(recipe.id)">Get another card · <UiIcon v-if="sparePrice.currency !== 'coins'" class="inline-icon" name="crystal" /> {{ sparePrice.amount }}{{ sparePrice.currency === 'coins' ? ' coins' : '' }}</button>
    </footer>
  </section>
</template>

<style scoped>
.recipe-mastery { display: grid; gap: 8px; padding: 14px; border: 1px solid #b78649; border-radius: 14px; background: radial-gradient(120% 100% at 0% 0%, #3a2a18, #141c2a 70%); }
.recipe-mastery header { display: flex;align-items:flex-start;justify-content:space-between;gap:12px; }
.recipe-mastery header > div { display:grid;gap:5px; }
.recipe-mastery header small { color: var(--gold, #f1c26b); font-size: 8px; font-weight: 900; letter-spacing: .14em; }
.recipe-owned { display:inline-flex;min-height:22px;align-items:center;justify-content:center;width:max-content;padding:3px 8px;border:1px solid #3d7454;border-radius:999px;background:#173526;color:#a7e3bc;font-size:8px;font-weight:900;letter-spacing:.06em; }
.mastery-levels { display:flex;align-items:center;gap:4px; }
.mastery-levels i { display:grid;width:25px;height:25px;place-items:center;border:1px solid #3c4658;border-radius:50%;background:#182132;color:#778296;font-size:10px;font-style:normal;font-weight:900; }
.mastery-levels i.on { border-color:#8d6c35;background:#4a361e;color:#f2c35f; }
.mastery-levels i.current { box-shadow:0 0 0 2px #f2c35f44,0 0 10px #f2c35f44; }
.recipe-mastery p { margin: 0; color: #d9e0ea; font-size: 11px; }
.recipe-mastery p b { color: #91dbad; }
.recipe-mastery .primary-button em { display: block; font-size: 9px; font-style: normal; font-weight: 700; opacity: .8; }
.recipe-mastery .primary-button:disabled { opacity: .5; cursor: default; }
.recipe-card-balance { display:grid;grid-template-columns:auto auto 1fr;align-items:center;gap:8px;padding:8px 10px;border:1px solid #394a60;border-radius:9px;background:#101a2a; }
.recipe-card-balance span { color:#aab7c8;font-size:8px;font-weight:900;letter-spacing:.1em; }
.recipe-card-balance b { display:grid;width:27px;height:27px;place-items:center;border-radius:7px;background:#49351e;color:#ffd37e;font-size:13px; }
.recipe-card-balance em { color:#91a2b6;font-size:9px;font-style:normal;line-height:1.35; }
.mastery-help { color:#e8c585!important; }
.mastery-max { color: #91dbad !important; font-weight: 800; }
.recipe-mastery footer { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 8px; padding-top: 8px; border-top: 1px solid #34435a; color: #a9b3c1; font-size: 10px; }
.recipe-mastery footer b { color: #ffe3a3; }
.recipe-mastery footer .secondary-button { padding: 6px 10px; border-radius: 8px; font-size: 10px; font-weight: 800; cursor: pointer; }
@media(max-width:560px){.recipe-mastery header{display:grid}.mastery-levels{width:100%;justify-content:space-between}.mastery-levels i{width:29px;height:29px}.recipe-card-balance{grid-template-columns:auto auto}.recipe-card-balance em{grid-column:1/-1}}
</style>
