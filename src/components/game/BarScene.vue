<script setup lang="ts">
import { onBeforeUnmount } from 'vue';
import { CUSTOMER_ART_BY_SLOT } from '../../data/cosmetics/artCatalog';
import { RECIPES } from '../../domain/catalog';
import { buildProfile, shortWish } from '../../domain/conversation/customerTalk';
import type { Customer } from '../../domain/types';
import type { CharacterExpression } from '../../domain/dialogue/types';
import { useGameStore } from '../../stores/game';
import CharacterModel from '../characters/CharacterModel.vue';

const game = useGameStore();
withDefaults(defineProps<{ active?: boolean }>(), { active: true });
const interval = window.setInterval(() => {
  if (!document.hidden) game.tickGameClock();
}, 1000);
onBeforeUnmount(() => window.clearInterval(interval));

const expressionFor = (mood: string): CharacterExpression => ({
  calm: 'neutral', friendly: 'smile', impatient: 'impatient', angry: 'angry', sad: 'worried', tired: 'thinking', shy: 'embarrassed', confused: 'confused', wealthy: 'impressed', vip: 'smile'
}[mood] as CharacterExpression ?? 'neutral');
function bubbleText(customer: Customer) {
  if (customer.orderRevealed) return customer.request;
  // Online the order itself is secret until found out; the public wish is all the guest says at first.
  if (customer.wish) return customer.wish;
  if (customer.orderKind === 'bottle') return `I need bottles for a ${customer.bottleRequest?.occasion ?? 'special occasion'}.`;
  const recipe = RECIPES.find((item) => item.id === customer.orderRecipeId);
  return recipe ? shortWish(buildProfile(recipe)) : customer.request;
}
function patience(value: number, total: number) { return Math.max(0, Math.min(100, (value / total) * 100)); }
</script>

<template>
  <section class="bar-scene" :data-wall="game.decor.wall" :data-counter="game.decor.counter" :data-counter-color="game.decor.counterColor" :data-counter-size="game.decor.counterSize" :data-lighting="game.decor.lighting" :data-highlight-strength="game.decor.highlightStrength" :style="game.barInteriorStyle">
    <div class="scene-light scene-light-left"></div><div class="scene-light scene-light-right"></div>
    <div class="bar-cast">
      <button v-for="(customer, index) in game.customers" :key="customer.id" type="button" class="scene-customer" :class="{ active: customer.id === game.activeCustomerId, waiting: customer.id !== game.activeCustomerId }" @click="game.openConversation(customer.id)">
        <div class="speech-bubble"><span>{{ customer.greeting }}</span><b>{{ bubbleText(customer) }}</b><em>{{ customer.orderRevealed ? 'Order confirmed' : 'Tap to talk' }}</em></div>
        <CharacterModel role="customer" :character-id="customer.characterId ?? CUSTOMER_ART_BY_SLOT[index % CUSTOMER_ART_BY_SLOT.length]" :seed="customer.id" :mood="customer.mood" :expression="expressionFor(customer.mood)" :animation="customer.id === game.activeCustomerId ? 'talk' : 'idle'" />
        <div class="customer-plate">
          <div><b>{{ customer.name }}</b><small>{{ customer.mood }}</small></div>
          <span class="mini-patience"><i :style="{ width: patience(customer.patienceRemaining, customer.patience) + '%' }"></i><em>{{ game.orderCountdown }}</em></span>
        </div>
      </button>
      <div v-if="!game.hasCustomer" class="empty-bar-wait">
        <small>NEXT CUSTOMER</small><b>{{ game.nextCustomerCountdown }}</b><p>Use the quiet time to restock, learn recipes, or customize this bar.</p>
      </div>
    </div>
    <div class="bartender-layer">
      <CharacterModel role="bartender" :character-id="game.decor.bartenderCharacter ?? 'noa'" :outfit="game.decor.bartender" :face-style="game.decor.face" :hair-style="game.decor.hairStyle" :hair-color="game.decor.hairColor" :body-shape="game.decor.bodyShape" :skin-detail="game.decor.skinDetail" :bust="game.decor.bust" :pose="game.decor.pose" :makeup="game.decor.makeup" animation="idle" />
      <span class="name-ribbon">{{ (game.decor.bartenderNickname || (game.decor.bartenderCharacter === 'leo' ? 'Leo' : 'Noa')).toUpperCase() }} · BARTENDER</span>
    </div>
    <div class="counter-glow"></div>
    <div class="scene-status"><span :class="{ waiting: !game.hasCustomer }"></span>{{ game.message }}<b>{{ game.hasCustomer ? (game.orderTimerPaused ? 'Paused in dialogue' : game.orderCountdown) : game.nextCustomerCountdown }}</b></div>
  </section>
</template>
