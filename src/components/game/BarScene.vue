<script setup lang="ts">
import { computed, onBeforeUnmount } from 'vue';
import { CUSTOMER_ART_BY_SLOT } from '../../data/cosmetics/artCatalog';
import type { CharacterExpression } from '../../domain/dialogue/types';
import { useGameStore } from '../../stores/game';
import CharacterModel from '../characters/CharacterModel.vue';

const game = useGameStore();
const interval = window.setInterval(() => game.tickPatience(), 1000);
onBeforeUnmount(() => window.clearInterval(interval));

const expressionFor = (mood: string): CharacterExpression => ({
  calm: 'neutral', friendly: 'smile', impatient: 'impatient', angry: 'angry', sad: 'worried', tired: 'thinking', shy: 'embarrassed', confused: 'confused', wealthy: 'impressed', vip: 'smile'
}[mood] as CharacterExpression ?? 'neutral');
const activeIndex = computed(() => game.customers.findIndex((item) => item.id === game.activeCustomerId));
function patience(value: number, total: number) { return Math.max(0, Math.min(100, (value / total) * 100)); }
</script>

<template>
  <section class="bar-scene" :data-wall="game.decor.wall">
    <div class="scene-light scene-light-left"></div><div class="scene-light scene-light-right"></div>
    <div class="bar-cast">
      <button v-for="(customer, index) in game.customers" :key="customer.id" type="button" class="scene-customer" :class="{ active: customer.id === game.activeCustomerId, waiting: customer.id !== game.activeCustomerId }" @click="game.selectCustomer(customer.id)">
        <div class="speech-bubble"><span>{{ customer.greeting }}</span><b>{{ customer.request }}</b></div>
        <CharacterModel role="customer" :character-id="CUSTOMER_ART_BY_SLOT[index % CUSTOMER_ART_BY_SLOT.length]" :seed="customer.id" :mood="customer.mood" :expression="expressionFor(customer.mood)" :animation="customer.id === game.activeCustomerId ? 'talk' : 'idle'" />
        <div class="customer-plate">
          <div><b>{{ customer.name }}</b><small>{{ customer.mood }}</small></div>
          <span class="mini-patience"><i :style="{ width: patience(customer.patienceRemaining, customer.patience) + '%' }"></i></span>
        </div>
      </button>
    </div>
    <div class="bartender-layer">
      <CharacterModel role="bartender" character-id="noa" :outfit="game.decor.bartender" animation="idle" />
      <span class="name-ribbon">NOA · BARTENDER</span>
    </div>
    <div class="counter-glow"></div>
    <div class="scene-status"><span></span>{{ game.message }}<b>{{ activeIndex + 1 }}/{{ game.customers.length }}</b></div>
  </section>
</template>
