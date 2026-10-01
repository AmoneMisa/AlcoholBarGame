<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { APP_BUILT, APP_VERSION, fetchServerVersion, formatBuilt } from '../../version';
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
// Which build is running on this device and on the server: if they differ, this device has an old copy.
const server = ref<{ version: string; built?: string }>();
const outdated = computed(() => !!server.value && APP_VERSION !== 'dev' && server.value.version !== 'dev' && server.value.version !== APP_VERSION);
onMounted(async () => { server.value = await fetchServerVersion(); });
const reload = () => window.location.reload();
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

    <section class="version-card" aria-label="Game version">
      <h3>Version</h3>
      <dl>
        <div><dt>This device</dt><dd>{{ APP_VERSION }}<small v-if="APP_BUILT">built {{ formatBuilt(APP_BUILT) }}</small></dd></div>
        <div><dt>Server</dt><dd>{{ server ? server.version : 'not reachable' }}<small v-if="server?.built">built {{ formatBuilt(server.built) }}</small></dd></div>
      </dl>
      <p v-if="outdated" class="outdated">A newer version is running on the server. <button type="button" @click="reload">Reload to update</button></p>
      <p v-else-if="server && APP_VERSION !== 'dev'" class="current">You have the latest version.</p>
    </section>

    <section v-if="picking" class="picker" aria-label="Choose achievements to show">
      <header><b>Choose up to {{ FEATURED_MAX }} achievements to show on your profile</b></header>
      <label v-for="item in earned" :key="item.id" :class="{ on: chosen.includes(item.id) }">
        <input type="checkbox" :checked="chosen.includes(item.id)" :disabled="!chosen.includes(item.id) && chosen.length >= FEATURED_MAX" @change="toggle(item.id)" />
        <span>🏅 {{ item.seriesName }} · {{ item.tierName }}</span>
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
.version-card { padding: 12px 14px; border: 1px solid #354762; border-radius: 14px; background: #111c2d; color: #e9eef7; font-size: 13px; }
.version-card h3 { margin: 0 0 6px; font-size: 14px; }
.version-card dl { display: flex; flex-wrap: wrap; gap: 18px; margin: 0; }
.version-card dt { color: #91a2b5; font-size: 11px; text-transform: uppercase; letter-spacing: .06em; }
.version-card dd { margin: 2px 0 0; font: 700 15px ui-monospace, monospace; }
.version-card dd small { display: block; font: 400 11px system-ui, sans-serif; color: #9eafc1; }
.version-card p { margin: 8px 0 0; }
.version-card .outdated { color: #ffd35a; }
.version-card .outdated button { margin-left: 8px; padding: 4px 10px; border: 1px solid #e0a14a; border-radius: 8px; background: #a9702b; color: #fff6e0; font-weight: 700; cursor: pointer; }
.version-card .current { color: #7cc686; }
.picker { display: grid; gap: 6px; padding: 14px; border: 1px solid #b78649; border-radius: 14px; background: #1a1f2c; color: #e9eef7; }
.picker label { display: flex; align-items: center; gap: 8px; padding: 6px 8px; border-radius: 8px; cursor: pointer; }
.picker label.on { background: rgba(255, 211, 90, .12); }
.picker footer { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 6px; }
.picker button { padding: 7px 12px; border: 1px solid #5a6b86; border-radius: 10px; background: #1d283b; color: inherit; font-weight: 700; cursor: pointer; }
.picker button.primary { background: #a9702b; border-color: #e0a14a; color: #fff6e0; }
</style>
