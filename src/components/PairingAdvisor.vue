<script setup lang="ts">
import { computed, ref } from 'vue';
import { BAR_PAIRINGS } from '../data/pairings/barPairings';
import {
  beverageProfile,
  needsNonAlcoholicOption,
  recommendationPrompts,
  topCigarPairings,
  topContextPairings,
  topDrinkPairings,
  topFoodPairings,
  type PairingMode
} from '../domain/pairingEngine';

const mode = ref<PairingMode>('food');
const selectedBeverage = ref('cabernet_sauvignon');
const search = ref('');
const mood = ref('neutral');
const setting = ref('balcony');
const activity = ref('cigar');
const timeOfDay = ref('evening');
const weather = ref('');
const company = ref('');
const cigarBody = ref<'mild' | 'medium' | 'full'>('medium');
const cigarNote = ref('coffee');

const profiles = computed(() => {
  const query = search.value.trim().toLowerCase();
  if (!query) return BAR_PAIRINGS.beverage_profiles;
  return BAR_PAIRINGS.beverage_profiles.filter((item) =>
    item.name.toLowerCase().includes(query) ||
    item.family.toLowerCase().includes(query) ||
    item.style.toLowerCase().includes(query)
  );
});

const foodResults = computed(() => topFoodPairings(selectedBeverage.value, 6));
const drinkResults = computed(() => topDrinkPairings(selectedBeverage.value, 6));
const contextResults = computed(() => topContextPairings({
  mood: mood.value,
  setting: setting.value || undefined,
  activity: activity.value || undefined,
  time_of_day: timeOfDay.value || undefined,
  weather: weather.value || undefined,
  company: company.value || undefined
}, 8));
const cigarNotes = computed(() => Array.from(new Set(
  BAR_PAIRINGS.cigar_beverage_pairings
    .filter((item) => item.cigar_body === cigarBody.value)
    .map((item) => item.cigar_note)
)));
const cigarResults = computed(() => topCigarPairings(cigarBody.value, cigarNote.value, 8));
const prompts = computed(() => recommendationPrompts().slice(0, 12));
const moodRequiresNA = computed(() => needsNonAlcoholicOption(mood.value));
const partnerName = (id: string) => beverageProfile(id)?.name ?? id.replaceAll('_', ' ');
</script>

<template>
  <article class="panel pairing-advisor">
    <div class="panel-title-row">
      <h2>Pairing & Recommendation Advisor</h2>
      <span>Knowledge base {{ BAR_PAIRINGS.metadata.version }}</span>
    </div>

    <div class="filter-tabs pairing-tabs">
      <button :class="{ active: mode === 'food' }" @click="mode = 'food'">Food</button>
      <button :class="{ active: mode === 'drink' }" @click="mode = 'drink'">Drink + drink</button>
      <button :class="{ active: mode === 'context' }" @click="mode = 'context'">Context</button>
      <button :class="{ active: mode === 'cigar' }" @click="mode = 'cigar'">Cigar</button>
    </div>

    <div v-if="mode === 'food' || mode === 'drink'" class="pairing-controls">
      <input v-model="search" placeholder="Search wine, beer, spirit, tea, coffee, mocktail…" />
      <select v-model="selectedBeverage">
        <option v-for="profile in profiles" :key="profile.id" :value="profile.id">
          {{ profile.name }} · {{ profile.style }} · {{ profile.abv_class }}
        </option>
      </select>
    </div>

    <div v-if="mode === 'context'" class="context-controls">
      <label>Mood<select v-model="mood"><option>neutral</option><option>sad</option><option>angry</option><option>stressed</option><option>lonely</option><option>tired</option></select></label>
      <label>Setting<select v-model="setting"><option value="">any</option><option>balcony</option><option>terrace</option></select></label>
      <label>Activity<select v-model="activity"><option value="">any</option><option>cigar</option><option>reading</option><option>gaming</option><option>dessert</option><option>gift_buying</option></select></label>
      <label>Time<select v-model="timeOfDay"><option value="">any</option><option>evening</option><option>late_night</option></select></label>
      <label>Weather<select v-model="weather"><option value="">any</option><option>hot</option><option>cold</option></select></label>
      <label>Company<select v-model="company"><option value="">any</option><option>friend</option></select></label>
    </div>

    <div v-if="mode === 'cigar'" class="context-controls cigar-controls">
      <label>Body<select v-model="cigarBody"><option value="mild">mild</option><option value="medium">medium</option><option value="full">full</option></select></label>
      <label>Note<select v-model="cigarNote"><option v-for="note in cigarNotes" :key="note" :value="note">{{ note }}</option></select></label>
    </div>

    <div v-if="mode === 'food'" class="pairing-results">
      <div v-for="item in foodResults" :key="item.beverage + item.food" class="pairing-result" :data-band="item.band">
        <div><b>{{ item.food }}</b><span>{{ item.relationship }}</span></div>
        <strong>{{ item.score }}</strong><p>{{ item.why }}</p>
      </div>
    </div>

    <div v-else-if="mode === 'drink'" class="pairing-results">
      <div v-for="item in drinkResults" :key="item.a + item.b" class="pairing-result" :data-band="item.band">
        <div><b>{{ partnerName(item.partnerId) }}</b><span>{{ item.relationship }}</span></div>
        <strong>{{ item.score }}</strong><p>{{ item.why }}</p>
        <small v-if="item.examples.length">Example: {{ item.examples.join(', ') }}</small>
      </div>
    </div>

    <div v-else-if="mode === 'context'" class="pairing-results">
      <div v-for="item in contextResults" :key="JSON.stringify(item.context) + item.beverage" class="pairing-result" :data-band="item.band">
        <div><b>{{ partnerName(item.beverage) }}</b><span>{{ item.isNonAlcoholic ? 'non-alcoholic' : 'alcoholic' }}</span></div>
        <strong>{{ item.score }}</strong><p>{{ item.why }}</p>
      </div>
    </div>

    <div v-else class="pairing-results">
      <div v-for="item in cigarResults" :key="item.cigar_body + item.cigar_note + item.beverage" class="pairing-result" :data-band="item.band">
        <div><b>{{ partnerName(item.beverage) }}</b><span>{{ item.alcoholic ? 'alcoholic' : 'non-alcoholic' }}</span></div>
        <strong>{{ item.score }}</strong><p>{{ item.why }}</p>
      </div>
    </div>

    <div v-if="mode === 'context' && moodRequiresNA" class="mood-safe-note">
      This mood never boosts alcohol recommendations. Always offer a non-alcoholic choice too.
    </div>

    <div class="a0-prompts">
      <h3>A0 questions to learn</h3>
      <div class="chips"><span v-for="item in prompts" :key="item.slot + item.prompt">{{ item.prompt }}</span></div>
    </div>

    <p class="pairing-note">{{ BAR_PAIRINGS.metadata.important_note }}</p>
  </article>
</template>

<style scoped>
.pairing-advisor{margin-top:8px;overflow:hidden}.pairing-tabs{padding:7px}.pairing-controls{display:grid;grid-template-columns:minmax(180px,.7fr) minmax(260px,1fr);gap:6px;padding:0 7px 7px}.pairing-controls input,.pairing-controls select,.context-controls select{width:100%;border:1px solid #394b63;border-radius:7px;background:#172438;color:#fff;padding:8px;font-size:9px}.context-controls{display:grid;grid-template-columns:repeat(6,1fr);gap:5px;padding:0 7px 7px}.context-controls label{font-size:8px;color:#9eacbc}.context-controls select{display:block;margin-top:3px}.cigar-controls{grid-template-columns:repeat(2,minmax(160px,260px))}.pairing-results{display:grid;grid-template-columns:repeat(4,1fr);gap:5px;padding:0 7px 7px}.pairing-result{position:relative;min-height:94px;border:1px solid #3a4a60;border-radius:8px;background:#18263a;padding:8px}.pairing-result>div{padding-right:36px}.pairing-result b,.pairing-result span,.pairing-result small{display:block}.pairing-result b{text-transform:capitalize;font-size:10px}.pairing-result span,.pairing-result small{font-size:8px;color:#aab8c8}.pairing-result strong{position:absolute;right:7px;top:7px;border-radius:999px;background:#24344a;padding:4px 6px;font-size:10px}.pairing-result p{margin:7px 0 0;color:#c8d1dc;font-size:8px;line-height:1.35}.pairing-result[data-band=excellent]{border-color:#38b46b}.pairing-result[data-band=good]{border-color:#74bd70}.pairing-result[data-band=situational]{border-color:#d1b44e}.pairing-result[data-band=weak]{border-color:#cf8848}.pairing-result[data-band=challenging]{border-color:#c65454}.mood-safe-note{margin:0 7px 7px;padding:7px 9px;border:1px solid #3f7b76;border-radius:7px;background:#14302f;color:#c8ece8;font-size:8px}.a0-prompts{padding:8px;border-top:1px solid #2b3b52}.a0-prompts h3{margin:0 0 5px;font-size:10px}.pairing-note{margin:0;padding:7px 9px;background:#0c1521;color:#8f9caf;font-size:7px;line-height:1.4}@media(max-width:1100px){.context-controls{grid-template-columns:repeat(3,1fr)}.pairing-results{grid-template-columns:repeat(2,1fr)}}@media(max-width:700px){.pairing-controls,.context-controls,.cigar-controls,.pairing-results{grid-template-columns:1fr}}
</style>
