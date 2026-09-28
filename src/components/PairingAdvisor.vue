<script setup lang="ts">
import { computed, ref } from 'vue';
import { BAR_PAIRINGS } from '../data/pairings/barPairings';
import { alcoholProfile, recommendationPrompts, topDrinkPairings, topFoodPairings, type PairingMode } from '../domain/pairingEngine';

const mode = ref<PairingMode>('food');
const selectedAlcohol = ref('cabernet_sauvignon');
const search = ref('');

const profiles = computed(() => {
  const query = search.value.trim().toLowerCase();
  if (!query) return BAR_PAIRINGS.alcohol_profiles;
  return BAR_PAIRINGS.alcohol_profiles.filter((item) =>
    item.name.toLowerCase().includes(query) ||
    item.family.toLowerCase().includes(query) ||
    item.style.toLowerCase().includes(query)
  );
});
const foodResults = computed(() => topFoodPairings(selectedAlcohol.value, 6));
const drinkResults = computed(() => topDrinkPairings(selectedAlcohol.value, 6));
const prompts = computed(() => recommendationPrompts().slice(0, 9));
const partnerName = (id: string) => alcoholProfile(id)?.name ?? id.replaceAll('_', ' ');
</script>

<template>
  <article class="panel pairing-advisor">
    <div class="panel-title-row"><h2>Pairing Advisor</h2><span>Knowledge base {{ BAR_PAIRINGS.metadata.version }}</span></div>
    <div class="pairing-controls">
      <div class="filter-tabs">
        <button :class="{ active: mode === 'food' }" @click="mode = 'food'">With food</button>
        <button :class="{ active: mode === 'drink' }" @click="mode = 'drink'">With another drink</button>
      </div>
      <input v-model="search" placeholder="Search wine, beer, spirit…" />
      <select v-model="selectedAlcohol">
        <option v-for="profile in profiles" :key="profile.id" :value="profile.id">{{ profile.name }} · {{ profile.style }}</option>
      </select>
    </div>
    <div v-if="mode === 'food'" class="pairing-results">
      <div v-for="item in foodResults" :key="item.alcohol + item.food" class="pairing-result" :data-band="item.band">
        <div><b>{{ item.food }}</b><span>{{ item.relationship }}</span></div><strong>{{ item.score }}</strong><p>{{ item.why }}</p>
      </div>
    </div>
    <div v-else class="pairing-results">
      <div v-for="item in drinkResults" :key="item.a + item.b" class="pairing-result" :data-band="item.band">
        <div><b>{{ partnerName(item.partnerId) }}</b><span>{{ item.relationship }}</span></div><strong>{{ item.score }}</strong>
        <p>{{ item.why }}</p><small v-if="item.examples.length">Example: {{ item.examples.join(', ') }}</small>
      </div>
    </div>
    <div class="a0-prompts"><h3>A0 questions to learn</h3><div class="chips"><span v-for="item in prompts" :key="item.slot + item.prompt">{{ item.prompt }}</span></div></div>
    <p class="pairing-note">{{ BAR_PAIRINGS.metadata.important_note }}</p>
  </article>
</template>

<style scoped>
.pairing-advisor{margin-top:8px;overflow:hidden}.pairing-controls{display:grid;grid-template-columns:auto minmax(160px,.65fr) minmax(240px,1fr);gap:6px;align-items:center;padding:7px}.pairing-controls input,.pairing-controls select{width:100%;border:1px solid #394b63;border-radius:7px;background:#172438;color:#fff;padding:8px;font-size:9px}.pairing-results{display:grid;grid-template-columns:repeat(3,1fr);gap:5px;padding:0 7px 7px}.pairing-result{position:relative;min-height:94px;border:1px solid #3a4a60;border-radius:8px;background:#18263a;padding:8px}.pairing-result>div{padding-right:36px}.pairing-result b,.pairing-result span,.pairing-result small{display:block}.pairing-result b{text-transform:capitalize;font-size:10px}.pairing-result span,.pairing-result small{font-size:8px;color:#aab8c8}.pairing-result strong{position:absolute;right:7px;top:7px;border-radius:999px;background:#24344a;padding:4px 6px;font-size:10px}.pairing-result p{margin:7px 0 0;color:#c8d1dc;font-size:8px;line-height:1.35}.pairing-result[data-band=excellent]{border-color:#38b46b}.pairing-result[data-band=good]{border-color:#74bd70}.pairing-result[data-band=situational]{border-color:#d1b44e}.pairing-result[data-band=weak]{border-color:#cf8848}.pairing-result[data-band=challenging]{border-color:#c65454}.a0-prompts{padding:8px;border-top:1px solid #2b3b52}.a0-prompts h3{margin:0 0 5px;font-size:10px}.pairing-note{margin:0;padding:7px 9px;background:#0c1521;color:#8f9caf;font-size:7px;line-height:1.4}@media(max-width:900px){.pairing-controls{grid-template-columns:1fr}.pairing-results{grid-template-columns:1fr 1fr}}@media(max-width:560px){.pairing-results{grid-template-columns:1fr}}
</style>
