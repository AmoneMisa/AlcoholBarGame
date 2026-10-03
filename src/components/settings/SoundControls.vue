<script setup lang="ts">
import { computed } from 'vue';
import { musicOn, musicVolume, sfxOn, sfxVolume, speechOn, speechVolume, soundPackLoaded, soundPackLoading, soundPackError, downloadSoundPack } from '../../audio/index';
import UiButton from '../ui/UiButton.vue';
import UiIcon from '../ui/UiIcon.vue';

// The three volume sliders with their mute buttons: used by the quick panel in the header and by the Settings page.
const props = defineProps<{ idPrefix: string }>();
const percent = (value: number) => `${Math.round(value * 100)}%`;
// Dragging a slider up from zero also turns that channel back on.
function setVolume(channel: 'music' | 'sfx' | 'speech', event: Event) {
  const value = Number((event.target as HTMLInputElement).value) / 100;
  if (channel === 'music') { musicVolume.value = value; if (value > 0) musicOn.value = true; }
  else if (channel === 'sfx') { sfxVolume.value = value; if (value > 0) sfxOn.value = true; }
  else { speechVolume.value = value; if (value > 0) speechOn.value = true; }
}
const channels = computed(() => [
  { id: 'music' as const, label: 'Music', mute: 'Mute music', icon: 'music', on: musicOn.value, volume: musicVolume.value },
  { id: 'sfx' as const, label: 'Effects', mute: 'Mute sound effects', icon: 'speaker', on: sfxOn.value, volume: sfxVolume.value },
  { id: 'speech' as const, label: 'English voice', mute: 'Mute English voice', icon: 'chat', on: speechOn.value, volume: speechVolume.value }
].filter(channel => channel.id === 'speech' || soundPackLoaded.value));
const toggle = (id: 'music' | 'sfx' | 'speech') => { if (id === 'music') musicOn.value = !musicOn.value; else if (id === 'sfx') sfxOn.value = !sfxOn.value; else speechOn.value = !speechOn.value; };
</script>

<template>
  <div class="optional-sound-pack" v-if="!soundPackLoaded"><p>Music and game effects are optional. English voice is available without downloading this pack.</p><UiButton size="sm" :disabled="soundPackLoading" @click="downloadSoundPack">{{ soundPackLoading ? 'Downloading…' : 'Download sound pack' }}</UiButton><p v-if="soundPackError" role="alert">{{ soundPackError }}</p></div>
  <p v-else class="sound-pack-ready" role="status">Sound pack downloaded. Enable music or effects below.</p>
  <div v-for="channel in channels" :key="channel.id" class="volume-row" :class="{ off: !channel.on }">
    <span :id="`${props.idPrefix}-${channel.id}`"><UiIcon :name="channel.icon" /> {{ channel.label }}</span>
    <input type="range" min="0" max="100" step="5" :aria-labelledby="`${props.idPrefix}-${channel.id}`" :value="Math.round(channel.volume * 100)" :style="{ '--fill': percent(channel.volume) }" :aria-valuetext="channel.on ? percent(channel.volume) : 'Muted'" @input="setVolume(channel.id, $event)" />
    <output>{{ channel.on ? percent(channel.volume) : 'Off' }}</output>
    <UiButton size="sm" :aria-pressed="!channel.on" :aria-label="channel.mute" @click="toggle(channel.id)">{{ channel.on ? 'Mute' : 'Unmute' }}</UiButton>
  </div>
</template>
