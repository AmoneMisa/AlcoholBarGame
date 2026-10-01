<script setup lang="ts">
import { ref } from 'vue';
import { REGIONS } from '../../domain/catalog';
import { INTERIORS } from '../../data/cosmetics/bars';
import type { RegionId } from '../../domain/types';
import { useGameStore } from '../../stores/game';

// The first thing a new player sees: pick the city of their first (free) bar. Shown until a bar is chosen.
const game = useGameStore();
const picked = ref<RegionId>(game.regionId);
// Guests pay more in expensive cities, and stock costs more there too.
const pricing = (factor: number) => factor >= 1.25 ? 'Guests pay more · pricier stock' : factor >= .95 ? 'Balanced prices' : 'Guests pay less · cheap stock';
function start() { game.chooseStartingBar(picked.value); }
</script>

<template>
  <div class="starting-bar" role="dialog" aria-modal="true" aria-labelledby="starting-bar-title">
    <div class="starting-bar-sheet">
      <header>
        <small>WELCOME, BARTENDER</small>
        <h1 id="starting-bar-title">Choose the city for your first bar</h1>
        <p>Your first bar is free. Each city has its own prices, guests and look. You can open more bars later as you level up.</p>
      </header>
      <div class="starting-bar-grid">
        <button v-for="region in REGIONS" :key="region.id" type="button" :class="{ picked: picked === region.id }" :aria-pressed="picked === region.id" @click="picked = region.id">
          <img :src="INTERIORS.find((item) => item.id === game.bars[region.id].interior)?.asset" alt="" />
          <span class="starting-bar-copy"><small>{{ region.name }}</small><b>{{ game.bars[region.id].name }}</b><em>{{ region.tagline }}</em><i>{{ pricing(region.marketFactor) }} · {{ region.marketFactor.toFixed(2) }}×</i></span>
        </button>
      </div>
      <footer><button type="button" class="primary-button" @click="start">Open {{ REGIONS.find((region) => region.id === picked)?.name }}</button></footer>
    </div>
  </div>
</template>

<style>
.starting-bar { position: fixed; z-index: 2000; inset: 0; display: grid; place-items: center; padding: max(12px, env(safe-area-inset-top)) 12px max(12px, env(safe-area-inset-bottom)); background: radial-gradient(ellipse at 50% 20%, #2a1c2ecc, #070b12f5 70%); backdrop-filter: blur(6px); }
.starting-bar-sheet { display: grid; grid-template-rows: auto minmax(0, 1fr) auto; width: min(980px, 100%); max-height: 100%; overflow: hidden; border: 1px solid #d2a24e; border-radius: 18px; background: linear-gradient(160deg, #17243a, #0b1320 70%); box-shadow: 0 30px 80px #000e; }
.starting-bar-sheet > header { padding: 18px 20px 12px; text-align: center; }
.starting-bar-sheet > header small { color: var(--gold, #e8b85a); font-size: 10px; font-weight: 900; letter-spacing: .16em; }
.starting-bar-sheet > header h1 { margin: 4px 0 6px; color: #fff3dc; font: 700 clamp(22px, 4vw, 32px) Georgia, serif; }
.starting-bar-sheet > header p { max-width: 560px; margin: 0 auto; color: #aeb9c7; font-size: 13px; line-height: 1.45; }
.starting-bar-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(230px, 1fr)); gap: 12px; overflow-y: auto; padding: 6px 20px 14px; overscroll-behavior: contain; scrollbar-width: thin; scrollbar-color: #a87943 transparent; }
.starting-bar-grid > button { display: grid; overflow: hidden; padding: 0; border: 1px solid #3e5068; border-radius: 14px; background: #0e1725; color: #fff; text-align: left; cursor: pointer; transition: border-color .15s, transform .15s; }
.starting-bar-grid > button:hover { border-color: #b8862f; }
.starting-bar-grid > button.picked { border-color: #e4b35c; box-shadow: 0 0 0 2px #e4b35c66; transform: translateY(-2px); }
.starting-bar-grid img { width: 100%; height: 120px; object-fit: cover; }
.starting-bar-copy { display: grid; gap: 2px; padding: 10px 12px 12px; }
.starting-bar-copy small { color: var(--gold, #e8b85a); font-size: 10px; font-weight: 900; letter-spacing: .12em; text-transform: uppercase; }
.starting-bar-copy b { color: #fff3dc; font: 700 18px Georgia, serif; }
.starting-bar-copy em { color: #c9d3df; font-size: 12px; font-style: normal; }
.starting-bar-copy i { color: #8fa0b5; font-size: 11px; font-style: normal; }
.starting-bar-sheet > footer { display: flex; justify-content: center; padding: 12px 20px 16px; border-top: 1px solid #354762; }
.starting-bar-sheet > footer .primary-button { min-width: min(360px, 100%); }
@media (max-width: 560px) {
  .starting-bar-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; padding: 4px 12px 10px; }
  .starting-bar-grid img { height: 78px; }
  .starting-bar-copy { padding: 7px 8px 9px; }
  .starting-bar-copy b { font-size: 14px; }
  .starting-bar-copy em, .starting-bar-copy i { font-size: 10px; }
}
</style>
