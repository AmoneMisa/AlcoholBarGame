<script setup lang="ts">
import { REGIONS, INGREDIENTS } from './domain/catalog';
import { useGameStore } from './stores/game';
import BarScene from './components/BarScene.vue';
import { haptic } from './telegram/webapp';

const game = useGameStore();
const lessons = [
  ['Hello at the bar', 'hello', 'please', 'thank you', 'drink', 'bar'],
  ['Taste', 'sweet', 'sour', 'bitter', 'dry', 'fresh'],
  ['Order', 'want', 'have', 'with', 'without', 'more', 'less'],
  ['Payment', 'price', 'cash', 'card', 'pay', 'change'],
  ['Problems', 'wrong', 'sorry', 'replace', 'refund', 'again']
];
</script>

<template>
  <div class="app-shell">
    <header class="topbar">
      <div><strong>BarLingo</strong><span>English bar manager · A0</span></div>
      <div class="stats">
        <select v-model="game.regionId"><option v-for="r in REGIONS" :key="r.id" :value="r.id">{{ r.name }}</option></select>
        <i>Day {{ game.day }}</i><i>{{ game.region.currencySymbol }}{{ game.money.toFixed(2) }}</i><i>XP {{ game.xp }}</i>
      </div>
    </header>

    <main>
      <div class="status-line">{{ game.message }}</div>
      <BarScene v-if="game.tab === 'bar'" />

      <section v-else-if="game.tab === 'market'" class="card-grid">
        <article v-for="offer in game.market" :key="offer.supplier + '-' + offer.ingredientId" class="panel offer-card">
          <b>{{ INGREDIENTS.find((x) => x.id === offer.ingredientId)?.name }}</b><small>{{ offer.supplier }} · {{ offer.quality }} · {{ offer.quantity }}</small>
          <button @click="haptic(); game.buy(offer)">{{ game.region.currencySymbol }}{{ offer.price.toFixed(2) }}</button>
        </article>
      </section>

      <section v-else-if="game.tab === 'learn'" class="card-grid">
        <article v-for="lesson in lessons" :key="lesson[0]" class="panel lesson"><em>A0</em><h3>{{ lesson[0] }}</h3><div class="chips"><span v-for="word in lesson.slice(1)" :key="word">{{ word }}</span></div></article>
      </section>

      <section v-else class="panel design-panel">
        <h2>Design your bar</h2>
        <div class="design-grid">
          <label>Wall<select v-model="game.decor.wall"><option>burgundy</option><option>midnight</option><option>emerald</option></select></label>
          <label>Counter<select v-model="game.decor.counter"><option>classic</option><option>gold</option><option>neon</option></select></label>
          <label>Bartender<select v-model="game.decor.bartender"><option>vest</option><option>shirt</option><option>apron</option></select></label>
        </div>
      </section>
    </main>

    <nav class="bottom-nav">
      <button :class="{ active: game.tab === 'bar' }" @click="game.tab = 'bar'">🍸<span>Bar</span></button>
      <button :class="{ active: game.tab === 'market' }" @click="game.tab = 'market'">📦<span>Market</span></button>
      <button :class="{ active: game.tab === 'learn' }" @click="game.tab = 'learn'">🗣️<span>Learn</span></button>
      <button :class="{ active: game.tab === 'design' }" @click="game.tab = 'design'">🪄<span>Design</span></button>
      <button @click="game.nextDay()">🌙<span>Next day</span></button>
    </nav>
  </div>
</template>
