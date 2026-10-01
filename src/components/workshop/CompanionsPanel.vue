<script setup lang="ts">
import { computed, ref } from 'vue';
import { BOND_NAMES, BOND_STEPS, COMPANIONS, KEEPSAKES, KEEPSAKE_CRYSTAL_PRICE, KEEPSAKE_LIKED_POINTS, KEEPSAKE_POINTS, MAX_BOND, bondLevel, companionName, companionSlots, describeBonus, keepsakeDef, nextBondStep } from '../../domain/companions';
import { REGIONS } from '../../domain/catalog';
import { useGameStore } from '../../stores/game';
import CharacterModel from '../characters/CharacterModel.vue';

// The Circle: fifteen people with a story. Meet them as guests, recruit them with shards, give keepsakes to deepen the
// bond, and put up to two (three from level 25) to work in the bar being managed.
const game = useGameStore();
const open = ref<string>('');
const slots = computed(() => companionSlots(game.level));
const crew = computed(() => (game.circle.assigned[game.regionId] ?? []).filter((id) => id in game.circle.owned));
const cards = computed(() => COMPANIONS.map((person) => {
  const joined = person.id in game.circle.owned;
  const points = game.circle.owned[person.id] ?? 0;
  const bond = joined ? bondLevel(points) : 0;
  const bar = Object.entries(game.circle.assigned).find(([, list]) => list.includes(person.id))?.[0];
  return { person, joined, points, bond, next: joined ? nextBondStep(points) : undefined, shards: game.circle.shards[person.id] ?? 0, here: crew.value.includes(person.id), bar };
}));
const met = computed(() => cards.value.filter((item) => item.joined).length);
const keepsakes = computed(() => KEEPSAKES.map((item) => ({ ...item, count: game.circle.keepsakes[item.id] ?? 0 })));
const barName = (id?: string) => REGIONS.find((region) => region.id === id)?.name ?? '';
const toggle = (id: string) => { open.value = open.value === id ? '' : id; };
</script>

<template>
  <div class="circle">
    <p class="hint">The Circle: {{ met }} of {{ COMPANIONS.length }} have joined. Serve them as guests to collect their shards, or reach certain achievements. Each person works in one bar at a time and gives it their own bonus; keepsakes deepen the bond ({{ KEEPSAKE_POINTS }} points, {{ KEEPSAKE_LIKED_POINTS }} for something they love).</p>

    <section class="crew card">
      <h3>At the bar now <b>{{ crew.length }} / {{ slots }}</b></h3>
      <ul v-if="crew.length">
        <li v-for="id in crew" :key="id"><b>{{ companionName(id) }}</b> — {{ describeBonus(COMPANIONS.find((item) => item.id === id)!.bonus, bondLevel(game.circle.owned[id] ?? 0)) }}<button type="button" @click="game.dismissCompanion(id)">Send home</button></li>
      </ul>
      <p v-else class="empty">Nobody works here yet. Choose someone below.</p>
    </section>

    <section class="keepsakes card">
      <h3>Keepsakes</h3>
      <div class="keep-row">
        <span v-for="item in keepsakes" :key="item.id" class="keep"><i>{{ item.icon }}</i><b>{{ item.count }}</b><small>{{ item.name }}</small><button type="button" :disabled="game.crystals < KEEPSAKE_CRYSTAL_PRICE" @click="game.buyKeepsake(item.id)">{{ KEEPSAKE_CRYSTAL_PRICE }} 💎</button></span>
      </div>
    </section>

    <div class="people">
      <article v-for="item in cards" :key="item.person.id" class="person card" :class="{ joined: item.joined }">
        <header @click="toggle(item.person.id)">
          <span class="face"><CharacterModel role="customer" :character-id="item.person.id" :seed="item.person.id" mood="friendly" /></span>
          <span class="who">
            <b>{{ companionName(item.person.id) }}</b>
            <small>{{ item.person.title }} · {{ item.person.from }}</small>
            <small v-if="item.joined" class="bond">Bond {{ item.bond }} · {{ BOND_NAMES[item.bond] }}</small>
            <small v-else>Not in your circle yet</small>
          </span>
        </header>
        <p class="bonus"><b>Bonus:</b> {{ describeBonus(item.person.bonus, Math.max(1, item.bond)) }}<template v-if="item.bond && item.bond < MAX_BOND"> (next level {{ describeBonus(item.person.bonus, item.bond + 1) }})</template></p>

        <template v-if="item.joined">
          <progress v-if="item.next" :value="item.points" :max="item.next"></progress>
          <p v-if="item.next" class="meta">{{ item.points }} / {{ item.next }} bond points</p>
          <p v-else class="meta">Fully bonded</p>
          <div class="gifts">
            <button v-for="keep in keepsakes" :key="keep.id" type="button" :class="{ loved: item.person.likes === keep.id }" :disabled="!keep.count || !item.next" :title="`${keep.name}${item.person.likes === keep.id ? ' — loved' : ''}`" @click="game.giveKeepsake(item.person.id, keep.id)">{{ keep.icon }}</button>
          </div>
          <p class="meta">Loves: {{ keepsakeDef(item.person.likes)?.icon }} {{ keepsakeDef(item.person.likes)?.name }}</p>
          <button v-if="item.here" type="button" @click="game.dismissCompanion(item.person.id)">Working here · send home</button>
          <button v-else type="button" :disabled="crew.length >= slots" @click="game.assignCompanion(item.person.id)">{{ item.bar ? `Move from ${barName(item.bar)} to this bar` : 'Work in this bar' }}</button>
        </template>
        <template v-else>
          <progress :value="item.shards" :max="item.person.shards"></progress>
          <p class="meta">{{ item.shards }} / {{ item.person.shards }} shards<template v-if="item.person.joinsWith"> · joins at once with an achievement</template><template v-if="item.person.eventId"> · likes a special night</template></p>
          <button type="button" :disabled="item.shards < item.person.shards" @click="game.recruitCompanion(item.person.id)">Invite to your circle</button>
        </template>

        <section v-if="open === item.person.id" class="story">
          <blockquote>“{{ item.person.quote }}”</blockquote>
          <p>{{ item.person.intro }}</p>
          <template v-for="(chapter, index) in item.person.chapters" :key="index">
            <p v-if="item.bond > index"><b>{{ BOND_NAMES[index + 1] }}.</b> {{ chapter }}</p>
            <p v-else class="locked">🔒 Chapter {{ index + 1 }} opens at bond level {{ index + 1 }}{{ index ? ` (${BOND_STEPS[index]} points)` : '' }}.</p>
          </template>
        </section>
        <button type="button" class="story-toggle" @click="toggle(item.person.id)">{{ open === item.person.id ? 'Hide story' : 'Read story' }}</button>
      </article>
    </div>
  </div>
</template>

<style scoped>
.circle { display: grid; gap: 12px; padding: 14px; }
.card { padding: 12px 14px; border: 1px solid #354762; border-radius: 14px; background: #111c2d; color: #e9eef7; }
.hint { margin: 0; color: #93a5b9; font-size: 12px; line-height: 1.5; }
h3 { margin: 0 0 6px; font-size: 14px; }
h3 b { margin-left: 8px; color: #e4b35c; }
.crew ul { list-style: none; margin: 0; padding: 0; display: grid; gap: 6px; }
.crew li { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }
.empty { margin: 0; color: #9eafc1; font-size: 13px; }
.keep-row { display: flex; flex-wrap: wrap; gap: 10px; }
.keep { display: grid; justify-items: center; gap: 2px; padding: 6px 10px; border-radius: 10px; background: #17253a; }
.keep i { font-size: 22px; font-style: normal; }
.keep small { color: #9eafc1; font-size: 11px; }
.people { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 12px; }
.person { display: grid; align-content: start; gap: 4px; }
.person.joined { border-color: #b78649; }
.person header { display: grid; grid-template-columns: 72px 1fr; gap: 10px; align-items: center; cursor: pointer; }
.face { position: relative; width: 72px; height: 72px; overflow: hidden; border: 2px solid #d4a44d; border-radius: 50%; background: radial-gradient(circle at 50% 30%, #5b3a4a, #1b1522); }
.face :deep(.art-character) { position: absolute; inset: auto; left: calc(50% - 52px); top: -2px; width: 104px; height: 149px; margin: 0; }
.who { display: grid; gap: 1px; }
.who b { font: 700 17px Georgia, serif; }
.who small { color: #9eafc1; font-size: 11px; }
.who .bond { color: #ffd35a; }
.bonus { margin: 8px 0 4px; font-size: 13px; }
.meta { margin: 2px 0 6px; color: #9eafc1; font-size: 12px; }
progress { width: 100%; height: 8px; }
.gifts { display: flex; gap: 6px; margin: 6px 0; }
.gifts button { padding: 4px 8px; font-size: 16px; background: #1d283b; border-color: #5a6b86; }
.gifts button.loved { border-color: #ff8fb1; }
.crew li button { background: #1d283b; border-color: #5a6b86; color: #e9eef7; }
button { padding: 7px 11px; border: 1px solid #a97938; border-radius: 8px; background: #5f3d1c; color: #ffe9bd; font-weight: 800; font-size: 12px; cursor: pointer; }
button:disabled { opacity: .45; cursor: default; }
.story { margin-top: 10px; padding-top: 8px; border-top: 1px solid #2d4059; font-size: 13px; line-height: 1.45; }
.story blockquote { margin: 0 0 6px; color: #e4b35c; font-style: italic; }
.story p { margin: 6px 0; }
.story .locked { color: #6f819a; }
.story-toggle { margin-top: 8px; background: transparent; border-color: #5a6b86; color: #c7d3e0; }
.keep button { padding: 4px 8px; font-size: 11px; }
.person > button:not(.story-toggle) { margin-top: 4px; }
</style>
