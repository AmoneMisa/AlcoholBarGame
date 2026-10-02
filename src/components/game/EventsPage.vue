<script setup lang="ts">
import { useGameStore } from '../../stores/game';
import Glyph from '../ui/Glyph.vue';
import PanelHeading from '../ui/PanelHeading.vue';
import DailyRewardCard from '../ui/DailyRewardCard.vue';
import CityEvent from './CityEvent.vue';

// Everything that is going on, in one place: the login streak, what is happening in the city, and tonight at the bar.
const game = useGameStore();
</script>

<template>
  <section class="events-page game-panel">
    <PanelHeading eyebrow="WHAT IS GOING ON" title="Events" :aside="game.dailyGiftAvailable ? 'Reward ready' : `Day ${game.loginStreak} streak`" />

    <article class="card events-card">
      <header><small>LOGIN STREAK</small><h3>Your daily reward</h3></header>
      <DailyRewardCard />
    </article>

    <article class="card events-card">
      <header><small>IN THE CITY</small><h3>{{ game.region.name }}</h3></header>
      <CityEvent />
    </article>

    <article class="card events-card">
      <header><small>TONIGHT AT THE BAR</small><h3>{{ game.barEvent ? game.barEvent.title : 'A quiet night' }}</h3></header>
      <div v-if="game.barEvent" class="bar-night" :class="game.barEvent.mood">
        <span class="bar-night-icon" aria-hidden="true"><Glyph :g="game.barEvent.icon" /></span>
        <p>{{ game.barEvent.description }}</p>
      </div>
      <p v-else class="bar-night-quiet">Nothing special is happening in your bar tonight. Special nights show up here when they start.</p>
    </article>
  </section>
</template>

<style>
.events-page { display: grid; gap: 12px; }
.events-card { display: grid; gap: 10px; }
.events-card > header { display: grid; gap: 2px; }
.events-card > header small { color: #9eafc1; letter-spacing: .1em; font-size: 10px; font-weight: 800; }
.events-card > header h3 { margin: 0; font-size: 18px; color: #f8efe7; }
.events-card .city-event { margin: 0; }
.bar-night { display: flex; align-items: center; gap: 12px; padding: 10px 12px; border: 1px solid #d9a441; border-radius: 12px; background: #1e160c; color: #ffe6a8; }
.bar-night.risky { border-color: #d9694f; }
.bar-night.quiet { border-color: #7aa0c8; }
.bar-night-icon { font-size: 26px; }
.bar-night p, .bar-night-quiet { margin: 0; font-size: 13px; line-height: 1.5; color: #c9d5e6; }
.bar-night p { color: #ffe6a8; }
</style>
