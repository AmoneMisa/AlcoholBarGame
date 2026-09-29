<script setup lang="ts">
import { computed } from 'vue';
import { RECIPES } from '../../domain/catalog';
import { recipePurchase } from '../../domain/economy';
import type { Recipe } from '../../domain/types';
import { RECIPE_MAX_LEVEL, isStarterRecipe, recipeBonus, upgradeCost } from '../../sim/recipes';
import { useGameStore } from '../../stores/game';

// Recipe mastery: level stars, what the level earns, the next upgrade, and spare cards to gift.
const props = defineProps<{ recipe: Recipe }>();
const game = useGameStore();
const known = computed(() => game.knownRecipeIds.includes(props.recipe.id));
const level = computed(() => Math.min(RECIPE_MAX_LEVEL, Math.max(1, game.recipeLevels[props.recipe.id] ?? 1)));
const bonus = computed(() => recipeBonus(level.value));
const next = computed(() => level.value < RECIPE_MAX_LEVEL ? recipeBonus(level.value + 1) : undefined);
const cost = computed(() => upgradeCost(props.recipe, level.value));
const copies = computed(() => game.recipeCopies[props.recipe.id] ?? 0);
const starter = computed(() => isStarterRecipe(props.recipe.id));
const sparePrice = computed(() => recipePurchase(props.recipe, RECIPES.indexOf(props.recipe)));
const pct = (value: number) => `+${Math.round((value - 1) * 100)}%`;
</script>

<template>
  <section v-if="known" class="recipe-mastery">
    <header>
      <small>RECIPE MASTERY</small>
      <span class="mastery-stars" :aria-label="`Level ${level} of ${RECIPE_MAX_LEVEL}`"><i v-for="star in RECIPE_MAX_LEVEL" :key="star" :class="{ on: star <= level }">★</i></span>
    </header>
    <p>Level {{ level }} · guests pay <b>{{ pct(bonus.pay) }}</b> and tip <b>{{ pct(bonus.tips) }}</b> more for this drink.</p>
    <button v-if="next && cost !== undefined" type="button" class="primary-button" :disabled="game.money < cost" @click="game.upgradeRecipe(recipe.id)">
      Upgrade to level {{ level + 1 }} · {{ cost.toLocaleString('en-US') }} coins <em>pay {{ pct(next.pay) }}, tips {{ pct(next.tips) }}</em>
    </button>
    <p v-else class="mastery-max">Top level reached.</p>
    <footer v-if="!starter">
      <span>Spare cards to gift: <b>{{ copies }}</b></span>
      <button type="button" class="secondary-button" :disabled="sparePrice.currency === 'coins' ? game.money < sparePrice.amount : game.crystals < sparePrice.amount" @click="game.buyRecipe(recipe.id)">Buy a spare · {{ sparePrice.currency === 'coins' ? '' : '◆ ' }}{{ sparePrice.amount }}{{ sparePrice.currency === 'coins' ? ' coins' : '' }}</button>
    </footer>
    <footer v-else><span>Starter recipes cannot be gifted — every bar already has them.</span></footer>
  </section>
</template>

<style scoped>
.recipe-mastery { display: grid; gap: 8px; padding: 14px; border: 1px solid #b78649; border-radius: 14px; background: radial-gradient(120% 100% at 0% 0%, #3a2a18, #141c2a 70%); }
.recipe-mastery header { display: flex; align-items: center; justify-content: space-between; }
.recipe-mastery header small { color: var(--gold, #f1c26b); font-size: 8px; font-weight: 900; letter-spacing: .14em; }
.mastery-stars i { color: #3c4658; font-size: 18px; font-style: normal; }
.mastery-stars i.on { color: #f2c35f; text-shadow: 0 0 8px rgba(242, 195, 95, .6); }
.recipe-mastery p { margin: 0; color: #d9e0ea; font-size: 11px; }
.recipe-mastery p b { color: #91dbad; }
.recipe-mastery .primary-button em { display: block; font-size: 9px; font-style: normal; font-weight: 700; opacity: .8; }
.recipe-mastery .primary-button:disabled { opacity: .5; cursor: default; }
.mastery-max { color: #91dbad !important; font-weight: 800; }
.recipe-mastery footer { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 8px; padding-top: 8px; border-top: 1px solid #34435a; color: #a9b3c1; font-size: 10px; }
.recipe-mastery footer b { color: #ffe3a3; }
.recipe-mastery footer .secondary-button { padding: 6px 10px; border-radius: 8px; font-size: 10px; font-weight: 800; cursor: pointer; }
</style>
