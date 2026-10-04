<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { APP_BUILT, APP_VERSION, fetchServerVersion, formatBuilt } from '../../version';
import UiButton from '../ui/UiButton.vue';
const server = ref<{ version: string; built?: string }>();
const outdated = computed(() => !!server.value && APP_VERSION !== 'dev' && server.value.version !== 'dev' && server.value.version !== APP_VERSION);
onMounted(async () => { server.value = await fetchServerVersion(); });
const reload = () => window.location.reload();
</script>
<template>
  <section class="settings-card game-version" aria-label="Game version">
    <h3>Game version</h3>
    <dl>
      <div><dt>This device</dt><dd>{{ APP_VERSION }}<small v-if="APP_BUILT">built {{ formatBuilt(APP_BUILT) }}</small></dd></div>
      <div><dt>Server</dt><dd>{{ server ? server.version : 'not reachable' }}<small v-if="server?.built">built {{ formatBuilt(server.built) }}</small></dd></div>
    </dl>
    <p v-if="outdated">A newer version is running on the server. <UiButton size="sm" @click="reload">Reload to update</UiButton></p>
    <p v-else-if="server && APP_VERSION !== 'dev'">You have the latest version.</p>
  </section>
</template>
<style scoped>
.game-version h3{margin:0;font-size:15px}
.game-version p{margin:0;color:#aebdce;font-size:13px;line-height:1.45}
.game-version dl{display:grid;gap:12px;margin:0;grid-template-columns:repeat(auto-fit,minmax(130px,1fr))}
.game-version dt{color:#aabbd0;font-size:12px}
.game-version dd{margin:3px 0 0;overflow-wrap:anywhere;font:700 13px ui-monospace,monospace}
.game-version small{display:block;color:#aabbd0;font:400 12px system-ui,sans-serif;line-height:1.5}
</style>
