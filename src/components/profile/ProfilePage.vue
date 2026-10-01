<script setup lang="ts">
import { computed, ref } from 'vue';
import { FEATURED_MAX } from '../../domain/profile';
import { useGameStore } from '../../stores/game';
import ProfileCard from './ProfileCard.vue';

// The player's own screen. The player can pick up to four achievements to show; otherwise the latest four are shown.
const game = useGameStore();
const picking = ref(false);
const chosen = ref<string[]>([]);
const earned = computed(() => game.earnedAchievements);

function startPicking() {
  chosen.value = game.profile.picked ? game.profile.shown.map((item) => item.id) : [];
  picking.value = true;
}
function toggle(id: string) {
  if (chosen.value.includes(id)) chosen.value = chosen.value.filter((item) => item !== id);
  else if (chosen.value.length < FEATURED_MAX) chosen.value = [...chosen.value, id];
}
function save() { game.setFeaturedAchievements(chosen.value); picking.value = false; }
function latest() { game.setFeaturedAchievements([]); picking.value = false; }
</script>

<template>
  <div class="profile-page game-panel">
    <ProfileCard :name="game.decor.name || game.playerName" :level="game.level" :profile="game.profile" :look="game.decor as unknown as Record<string, string>">
      <template #achievements-action>
        <button v-if="earned.length" type="button" class="pick-button" @click="startPicking">Choose what to show</button>
      </template>
    </ProfileCard>

    <section v-if="picking" class="picker" aria-label="Choose achievements to show">
      <header><b>Choose up to {{ FEATURED_MAX }} achievements to show on your profile</b></header>
      <label v-for="item in earned" :key="item.id" :class="{ on: chosen.includes(item.id) }">
        <input type="checkbox" :checked="chosen.includes(item.id)" :disabled="!chosen.includes(item.id) && chosen.length >= FEATURED_MAX" @change="toggle(item.id)" />
        <span>🏅 {{ item.name }}</span>
      </label>
      <footer>
        <button type="button" class="primary" @click="save">Save ({{ chosen.length }} / {{ FEATURED_MAX }})</button>
        <button type="button" @click="latest">Show the latest instead</button>
        <button type="button" @click="picking = false">Cancel</button>
      </footer>
    </section>
  </div>
</template>

<style scoped>
.profile-page { display: grid; gap: 14px; padding: 14px; }
.pick-button { margin-left: 10px; padding: 3px 10px; border: 1px solid #5a6b86; border-radius: 8px; background: transparent; color: inherit; font-size: 12px; cursor: pointer; }
.picker { display: grid; gap: 6px; padding: 14px; border: 1px solid #b78649; border-radius: 14px; background: #1a1f2c; color: #e9eef7; }
.picker label { display: flex; align-items: center; gap: 8px; padding: 6px 8px; border-radius: 8px; cursor: pointer; }
.picker label.on { background: rgba(255, 211, 90, .12); }
.picker footer { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 6px; }
.picker button { padding: 7px 12px; border: 1px solid #5a6b86; border-radius: 10px; background: #1d283b; color: inherit; font-weight: 700; cursor: pointer; }
.picker button.primary { background: #a9702b; border-color: #e0a14a; color: #fff6e0; }
</style>
