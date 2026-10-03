<script setup lang="ts">
import { ref } from 'vue';
import { REGIONS } from '../../domain/catalog';
import { INTERIORS } from '../../data/cosmetics/bars';
import type { RegionId } from '../../domain/types';
import { useGameStore } from '../../stores/game';
import ModalDialog from '../ui/ModalDialog.vue';
import UiButton from '../ui/UiButton.vue';

// The first thing a new player sees: pick the city of their first (free) bar. Shown until a bar is chosen.
const game = useGameStore();
const picked = ref<RegionId>(game.regionId);
// Guests pay more in expensive cities, and stock costs more there too.
const pricing = (factor: number) => factor >= 1.25 ? 'Guests pay more · pricier stock' : factor >= .95 ? 'Balanced prices' : 'Guests pay less · cheap stock';
function start() { game.chooseStartingBar(picked.value); }
</script>

<template>
  <ModalDialog :closable="false" label="Choose your first bar" width="980px">
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
      <div class="starting-bar-footer"><UiButton variant="solid" block @click="start">Open {{ REGIONS.find((region) => region.id === picked)?.name }}</UiButton></div>
    </div>
  </ModalDialog>
</template>

<style>
.starting-bar-sheet { display: grid; gap: 4px; }
.starting-bar-sheet > header { padding: 18px 20px 12px; text-align: center; }
.starting-bar-sheet > header small { color: var(--gold, #e8b85a); font-size: 13px; font-weight: 900; letter-spacing: .16em; }
.starting-bar-sheet > header h1 { margin: 4px 0 6px; color: #fff3dc; font: 700 clamp(22px, 4vw, 32px) Georgia, serif; }
.starting-bar-sheet > header p { max-width: 560px; margin: 0 auto; color: #aeb9c7; font-size: 13px; line-height: 1.45; }
.starting-bar-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(230px, 1fr)); gap: 12px; padding: 6px 20px 14px; }
.starting-bar-grid > button { display: grid; overflow: hidden; padding: 0; border: 1px solid #3e5068; border-radius: 14px; background: #0e1725; color: #fff; text-align: left; cursor: pointer; transition: border-color .15s, transform .15s; }
.starting-bar-grid > button:hover { border-color: #b8862f; }
.starting-bar-grid > button.picked { border-color: #e4b35c; box-shadow: 0 0 0 2px #e4b35c66; transform: translateY(-2px); }
.starting-bar-grid img { width: 100%; height: 120px; object-fit: cover; }
.starting-bar-copy { display: grid; gap: 2px; padding: 10px 12px 12px; }
.starting-bar-copy small { color: var(--gold, #e8b85a); font-size: 13px; font-weight: 900; letter-spacing: .12em; text-transform: uppercase; }
.starting-bar-copy b { color: #fff3dc; font: 700 18px Georgia, serif; }
.starting-bar-copy em { color: #c9d3df; font-size: 13px; font-style: normal; }
.starting-bar-copy i { color: #8fa0b5; font-size: 13px; font-style: normal; }
.starting-bar-footer { position: sticky; bottom: -14px; display: flex; justify-content: center; margin: 0 -14px -14px; padding: 12px 20px calc(14px + env(safe-area-inset-bottom, 0px)); border-top: 1px solid #354762; background: linear-gradient(180deg, #0f1a2c, #0b1320); }
.starting-bar-footer .ui-btn { max-width: 360px; }
@media (max-width: 560px) {
  .starting-bar-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; padding: 4px 12px 10px; }
  .starting-bar-grid img { height: 78px; }
  .starting-bar-copy { padding: 7px 8px 9px; }
  .starting-bar-copy b { font-size: 14px; }
  .starting-bar-copy em, .starting-bar-copy i { font-size: 13px; }
}
</style>
