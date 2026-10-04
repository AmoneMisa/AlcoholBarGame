<script setup lang="ts">
import UiIcon from '../ui/UiIcon.vue';
import { acquisitionOffer } from '../../domain/uiOffers';
import { computed, ref } from 'vue';
import { SPOTLIGHT_MIN_BOND, SPOTLIGHT_MS, BOND_NAMES, BOND_STEPS, COMPANIONS, KEEPSAKES, KEEPSAKE_CRYSTAL_PRICE, KEEPSAKE_LIKED_POINTS, KEEPSAKE_POINTS, COMPANION_START_LEVEL, MAX_COMPANION_LEVEL, companionLevelCost, levelCapForGrade, companionPower, linksOf, linkStrength, bondLevel, companionName, companionSlots, describeBonus, keepsakeDef, nextBondStep } from '../../domain/companions';
import { REGIONS } from '../../domain/catalog';
import { useGameStore } from '../../stores/game';
import UiButton from '../ui/UiButton.vue';
import ItemArt from '../ui/ItemArt.vue';
import RelationshipLine from '../ui/RelationshipLine.vue';
import { COMPANION_LADDER } from '../../domain/relationship';

// The Circle: fifteen people with a story. Meet them as guests, recruit them with shards, give keepsakes to deepen the
// bond, and put up to two (three from level 25) to work in the bar being managed.
const game = useGameStore();
const open = ref<string>('');
const slots = computed(() => companionSlots(game.level));
// Spotlight: what the button says and why it cannot be pressed right now.
const spotState = (id: string) => {
  const slot = game.circle.spotlights?.[id];
  const now = game.nowMs;
  if (slot && slot.until > now) return { label: `In the spotlight · ${Math.ceil((slot.until - now) / 60_000)} min left`, reason: 'Already in the spotlight.' };
  if (slot && slot.ready > now) return { label: 'Spotlight', reason: `Resting: ready in ${Math.ceil((slot.ready - now) / 3_600_000)} h.` };
  if (bondLevel(game.circle.owned[id] ?? 0) < SPOTLIGHT_MIN_BOND) return { label: 'Spotlight', reason: `Needs bond level ${SPOTLIGHT_MIN_BOND}.` };
  return { label: 'Spotlight', reason: '' };
};
// What each grade gives: the stronger bonus and the next chapter of their story.
const companionGives = (person: (typeof COMPANIONS)[number]) => COMPANION_LADDER.names.map((_, at) => `Level up to ${levelCapForGrade(at + 1)} (${describeBonus(person.bonus, companionPower(levelCapForGrade(at + 1), at + 1))}) · chapter ${at + 1}`);
// A person's level: saved, or ten per bond grade for people who joined before levels existed.
const levelOfId = (id: string) => game.circle.levels?.[id] ?? Math.max(COMPANION_START_LEVEL, bondLevel(game.circle.owned[id] ?? 0) * 10);
const levelUpReason = (id: string, bond: number) => {
  const level = levelOfId(id);
  if (level >= MAX_COMPANION_LEVEL) return 'Highest level.';
  if (level >= levelCapForGrade(bond)) return `Level ${level} is the most this grade allows. Deepen the bond to ${BOND_NAMES[bond + 1]} first.`;
  const cost = companionLevelCost(level);
  if (game.money < cost.coins) return `Needs ${cost.coins} coins.`;
  if (game.loot.parts < cost.parts) return `Needs ${cost.parts} workshop parts.`;
  return '';
};
// Friends who know each other: while both work in the same bar, both bonuses grow by a tenth for every grade of the lesser one.
const linkRows = (id: string) => linksOf(id).map((link) => {
  const mine = bondLevel(game.circle.owned[id] ?? 0);
  const theirs = bondLevel(game.circle.owned[link.partner] ?? 0);
  const both = id in game.circle.owned && link.partner in game.circle.owned;
  const lesser = both ? Math.min(mine, theirs) : 0;
  const together = both && crew.value.includes(id) && crew.value.includes(link.partner);
  return { ...link, name: companionName(link.partner), both, lesser, percent: Math.round(linkStrength(lesser) * 100), together, lesserName: BOND_NAMES[lesser] ?? '' };
});
const crew = computed(() => (game.circle.assigned[game.regionId] ?? []).filter((id) => id in game.circle.owned));
const cards = computed(() => COMPANIONS.map((person) => {
  const joined = person.id in game.circle.owned;
  const points = game.circle.owned[person.id] ?? 0;
  const bond = joined ? bondLevel(points) : 0;
  const bar = Object.entries(game.circle.assigned).find(([, list]) => list.includes(person.id))?.[0];
  return { person, joined, points, bond, level: joined ? levelOfId(person.id) : 0, cap: joined ? levelCapForGrade(bond) : 0, next: joined ? nextBondStep(points) : undefined, shards: game.circle.shards[person.id] ?? 0, here: crew.value.includes(person.id), bar };
}));
const met = computed(() => cards.value.filter((item) => item.joined).length);
const keepsakes = computed(() => KEEPSAKES.map((item) => ({ ...item, count: game.circle.keepsakes[item.id] ?? 0 })));
const barName = (id?: string) => REGIONS.find((region) => region.id === id)?.name ?? '';
const toggle = (id: string) => { open.value = open.value === id ? '' : id; };
</script>

<template>
  <div class="circle">
    <p v-if="met" class="hint">The Circle: {{ met }} of {{ COMPANIONS.length }} have joined. Serve them as guests to collect their shards, or reach certain achievements. Each person works in one bar at a time and gives it their own bonus; keepsakes deepen the bond ({{ KEEPSAKE_POINTS }} points, {{ KEEPSAKE_LIKED_POINTS }} for something they love).</p>

    <section v-if="!met" class="card first-steps">
      <h3>Nobody has joined yet</h3>
      <ol>
        <li>Special guests drop by now and then. Serve them a perfect drink and they leave <b>shards</b>.</li>
        <li>With enough shards, press <b>Invite to your circle</b> on their card below.</li>
        <li>Then send them to work in a bar: each one gives your bar a bonus.</li>
      </ol>
    </section>

    <section v-if="met" class="crew card">
      <h3>At the bar now <b>{{ crew.length }} / {{ slots }}</b></h3>
      <ul v-if="crew.length">
        <li v-for="id in crew" :key="id"><ItemArt kind="companion" :id="id" fallback="👤" :size="38" class="crew-face" /><b>{{ companionName(id) }}</b> — {{ describeBonus(COMPANIONS.find((item) => item.id === id)!.bonus, companionPower(levelOfId(id), bondLevel(game.circle.owned[id] ?? 0))) }}<UiButton size="sm" variant="solid" :reason="spotState(id).reason" :title="`Their bonus counts double for ${SPOTLIGHT_MS / 60000} minutes, then they rest for 6 hours.`" @click="game.spotlightCompanion(id)">{{ spotState(id).label }}</UiButton><UiButton size="sm" @click="game.dismissCompanion(id)">Send home</UiButton></li>
      </ul>
      <p v-else class="empty">Nobody works here yet. Choose someone below.</p>
    </section>

    <section v-if="met" class="keepsakes card">
      <h3>Keepsakes</h3>
      <div class="keep-row">
        <span v-for="item in keepsakes" :key="item.id" class="keep"><ItemArt kind="keepsake" :id="item.id" :fallback="item.icon" :size="52" class="keep-art" /><b>{{ item.count }}</b><small>{{ item.name }}</small><UiButton size="sm" variant="primary" :crystal-cost="KEEPSAKE_CRYSTAL_PRICE" @click="game.buyKeepsake(item.id)">{{ KEEPSAKE_CRYSTAL_PRICE }} 💎</UiButton></span>
      </div>
    </section>

    <div class="people">
      <article v-for="item in cards" :key="item.person.id" class="person card" :class="{ joined: item.joined }">
        <header :class="{ clickable: item.joined }" @click="item.joined && toggle(item.person.id)">
          <span class="face"><ItemArt kind="companion" :id="item.person.id" fallback="👤" :size="76" /></span>
          <span class="who">
            <b>{{ companionName(item.person.id) }}</b>
            <small>{{ item.person.title }} · {{ item.person.from }}</small>
            <small v-if="item.joined" class="bond">Bond {{ item.bond }} · {{ BOND_NAMES[item.bond] }}</small>
            <small v-else>Not in your circle yet</small>
          </span>
        </header>
        <p class="bonus"><b>Bonus:</b> {{ describeBonus(item.person.bonus, companionPower(item.joined ? item.level : COMPANION_START_LEVEL, Math.max(1, item.bond))) }}<template v-if="item.joined && item.level < MAX_COMPANION_LEVEL"> (next level {{ describeBonus(item.person.bonus, companionPower(item.level + 1, item.bond)) }})</template></p>

        <template v-if="item.joined">
          <RelationshipLine :ladder="COMPANION_LADDER" :points="item.points" :gives="companionGives(item.person)" />
          <ul v-if="linkRows(item.person.id).length" class="links">
            <li v-for="link in linkRows(item.person.id)" :key="link.partner" :class="{ on: link.together }">
              <b>Friends with {{ link.name }}</b>
              <small v-if="!link.both">{{ link.name }} has not joined your circle yet.</small>
              <small v-else-if="link.together">Working together: both bonuses +{{ link.percent }}% (the lesser grade is {{ link.lesserName }}).</small>
              <small v-else>Put both in the same bar for +{{ link.percent }}% on both bonuses (the lesser grade is {{ link.lesserName }}).</small>
            </li>
          </ul>
          <div class="level-row">
            <span><b>Level {{ item.level }}</b> <small>of {{ item.cap }} for this grade</small></span>
            <UiButton size="sm" variant="solid" :reason="levelUpReason(item.person.id, item.bond)" :title="item.level < MAX_COMPANION_LEVEL ? `${companionLevelCost(item.level).coins} coins + ${companionLevelCost(item.level).parts} parts` : ''" @click="game.levelUpCompanion(item.person.id)">Level up<template v-if="item.level < MAX_COMPANION_LEVEL"> · {{ companionLevelCost(item.level).coins }} 🪙 {{ companionLevelCost(item.level).parts }} ⚙</template></UiButton>
          </div>
          <div class="gifts">
            <UiButton v-for="keep in keepsakes" :key="keep.id" size="sm" :variant="item.person.likes === keep.id ? 'danger' : 'secondary'" :disabled="!keep.count || !item.next" :title="`${keep.name}${item.person.likes === keep.id ? ' — loved' : ''}${keep.count ? '' : ' (you have none)'}`" @click="game.giveKeepsake(item.person.id, keep.id)"><ItemArt kind="keepsake" :id="keep.id" :fallback="keep.icon" :size="24" class="gift-art" /></UiButton>
          </div>
          <p class="meta">Loves: {{ keepsakeDef(item.person.likes)?.icon }} {{ keepsakeDef(item.person.likes)?.name }}</p>
          <UiButton v-if="item.here" block @click="game.dismissCompanion(item.person.id)">Working here · send home</UiButton>
          <UiButton v-else block variant="primary" :reason="crew.length >= slots ? `This bar has room for ${slots} people. Send someone home first.` : ''" @click="game.assignCompanion(item.person.id)">{{ item.bar ? `Move from ${barName(item.bar)} to this bar` : 'Work in this bar' }}</UiButton>
        </template>
        <template v-else>
          <progress :value="item.shards" :max="item.person.shards"></progress>
          <p class="meta">{{ item.shards }} / {{ item.person.shards }} shards<template v-if="item.person.joinsWith"> · joins at once with an achievement</template><template v-if="item.person.eventId"> · likes a special night</template></p>
          <UiButton block variant="primary" @click="item.shards < item.person.shards ? acquisitionOffer={kind:'companion',id:item.person.id,label:companionName(item.person.id)} : game.recruitCompanion(item.person.id)">Invite to your circle</UiButton>
        </template>

        <section v-if="item.joined && open === item.person.id" class="story">
          <blockquote>“{{ item.person.quote }}”</blockquote>
          <p>{{ item.person.intro }}</p>
          <template v-for="(chapter, index) in item.person.chapters" :key="index">
            <p v-if="item.bond > index"><b>{{ BOND_NAMES[index + 1] }}.</b> {{ chapter }}</p>
            <p v-else class="locked"><UiIcon name="lock" /> Chapter {{ index + 1 }} opens at <b>{{ BOND_NAMES[index + 1] }}</b>{{ index ? ` (${BOND_STEPS[index]} bond points)` : '' }}.</p>
          </template>
        </section>
        <UiButton v-if="item.joined" size="sm" variant="ghost" @click="toggle(item.person.id)">{{ open === item.person.id ? 'Hide story' : `Read story · ${item.bond} of ${item.person.chapters.length} chapters open` }}</UiButton>
        <p v-else class="meta locked-story"><UiIcon name="lock" /> Their story opens when they join your circle, a chapter for each grade.</p>
      </article>
    </div>
  </div>
</template>

<style scoped>
.locked-story { color: #7d8ba1; }
header.clickable { cursor: pointer; }
.first-steps ol { margin: 6px 0 0; padding-left: 20px; display: grid; gap: 4px; font-size: 14px; line-height: 1.4; }
.links { display: grid; gap: 4px; margin: 4px 0 8px; padding: 0; list-style: none; }
.links li { display: grid; gap: 1px; padding: 6px 8px; border: 1px dashed #4a5b75; border-radius: 9px; font-size: 13px; }
.links li.on { border-style: solid; border-color: #c98e3c; background: #2a2316; }
.links small { opacity: .8; }
.level-row { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin: 4px 0 8px; }
.level-row small { opacity: .7; }
.circle { display: grid; gap: 12px; padding: 14px; }
.card { padding: 12px 14px; border: 1px solid #354762; border-radius: 14px; background: #111c2d; color: #e9eef7; }
.hint { margin: 0; color: #93a5b9; font-size: 13px; line-height: 1.5; }
h3 { margin: 0 0 6px; font-size: 14px; }
h3 b { margin-left: 8px; color: #e4b35c; }
.crew ul { list-style: none; margin: 0; padding: 0; display: grid; gap: 6px; }
.crew li { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }
.crew-face { width: 38px; height: 38px; border-radius: 50%; object-fit: cover; }
.empty { margin: 0; color: #9eafc1; font-size: 13px; }
.keep-row { display: flex; flex-wrap: wrap; gap: 10px; }
.keep { display: grid; justify-items: center; gap: 2px; padding: 6px 10px; border-radius: 10px; background: #17253a; }
.keep-art { width: 52px; height: 52px; border-radius: 50%; }
.keep small { color: #9eafc1; font-size: 13px; }
.people { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 12px; }
.person { display: grid; align-content: start; gap: 4px; }
.person.joined { border-color: #b78649; }
.person header { display: grid; grid-template-columns: 72px 1fr; gap: 10px; align-items: center; cursor: pointer; }
.face { position: relative; width: 72px; height: 72px; overflow: hidden; border: 2px solid #d4a44d; border-radius: 50%; background: radial-gradient(circle at 50% 30%, #5b3a4a, #1b1522); }
.face img { display: block; width: 100%; height: 100%; object-fit: cover; }
.gift-art { display: block; width: 24px; height: 24px; border-radius: 50%; }
.who { display: grid; gap: 1px; }
.who b { font: 700 17px Georgia, serif; }
.who small { color: #9eafc1; font-size: 13px; }
.who .bond { color: #ffd35a; }
.bonus { margin: 8px 0 4px; font-size: 13px; }
.meta { margin: 2px 0 6px; color: #9eafc1; font-size: 13px; }
progress { width: 100%; height: 8px; }
.gifts { display: flex; gap: 6px; margin: 6px 0; }
.story { margin-top: 10px; padding-top: 8px; border-top: 1px solid #2d4059; font-size: 13px; line-height: 1.45; }
.story blockquote { margin: 0 0 6px; color: #e4b35c; font-style: italic; }
.story p { margin: 6px 0; }
.story .locked { color: #6f819a; }
</style>
