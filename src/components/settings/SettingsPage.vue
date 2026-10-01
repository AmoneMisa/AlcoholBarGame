<script setup lang="ts">
import { computed } from 'vue';
import { musicOn, musicVolume, sfxOn, sfxVolume, speechOn, speechVolume, voiceMode } from '../../audio/index';
import { APP_BUILT, APP_VERSION, formatBuilt } from '../../version';
import OptionSelect from '../game/OptionSelect.vue';
import UiIcon from '../ui/UiIcon.vue';

// Everything the player sets once and rarely touches again: sound, guest voices, help and the version of the game.
const emit = defineEmits<{ goto: [view: string] }>();
const percent = (value: number) => `${Math.round(value * 100)}%`;
// Dragging a slider up from zero also turns that channel back on.
function setVolume(channel: 'music' | 'sfx' | 'speech', event: Event) {
  const value = Number((event.target as HTMLInputElement).value) / 100;
  if (channel === 'music') { musicVolume.value = value; if (value > 0) musicOn.value = true; }
  else if (channel === 'sfx') { sfxVolume.value = value; if (value > 0) sfxOn.value = true; }
  else { speechVolume.value = value; if (value > 0) speechOn.value = true; }
}
const channels = computed(() => [
  { id: 'music' as const, label: 'Music', icon: 'music', on: musicOn.value, volume: musicVolume.value },
  { id: 'sfx' as const, label: 'Effects', icon: 'speaker', on: sfxOn.value, volume: sfxVolume.value },
  { id: 'speech' as const, label: 'English voice', icon: 'chat', on: speechOn.value, volume: speechVolume.value }
]);
const toggle = (id: 'music' | 'sfx' | 'speech') => { if (id === 'music') musicOn.value = !musicOn.value; else if (id === 'sfx') sfxOn.value = !sfxOn.value; else speechOn.value = !speechOn.value; };
const replayTour = () => { emit('goto', 'service'); setTimeout(() => window.dispatchEvent(new Event('barlingo:tour')), 250); };
</script>

<template>
  <div class="settings-page game-panel">
    <header class="settings-head"><small>SETTINGS</small><h2>Sound, voices and help</h2></header>

    <section class="settings-card">
      <h3>Sound</h3>
      <div class="volume-panel static">
        <div v-for="channel in channels" :key="channel.id" class="volume-row" :class="{ off: !channel.on }">
          <span :id="`settings-${channel.id}`"><UiIcon :name="channel.icon" /> {{ channel.label }}</span>
          <input type="range" min="0" max="100" step="5" :aria-labelledby="`settings-${channel.id}`" :value="Math.round(channel.volume * 100)" :style="{ '--fill': percent(channel.volume) }" :aria-valuetext="channel.on ? percent(channel.volume) : 'Muted'" @input="setVolume(channel.id, $event)" />
          <output>{{ channel.on ? percent(channel.volume) : 'Off' }}</output>
          <button type="button" :aria-pressed="!channel.on" :aria-label="`Mute ${channel.label.toLowerCase()}`" @click="toggle(channel.id)">{{ channel.on ? 'Mute' : 'Unmute' }}</button>
        </div>
      </div>
    </section>

    <section class="settings-card">
      <h3>Guest voices</h3>
      <p>How guests sound when they talk: a soft murmur, the sentence read aloud, or silent.</p>
      <OptionSelect label="Guest voices" v-model="voiceMode" :options="[{ value: 'murmur', label: 'Murmur' }, { value: 'speech', label: 'Read aloud' }, { value: 'off', label: 'Off' }]" />
    </section>

    <section class="settings-card">
      <h3>Help</h3>
      <p>The tour shows the main parts of the game step by step. You can skip any step and replay it whenever you like.</p>
      <button type="button" class="settings-button-main" @click="replayTour"><UiIcon name="help" /><span>How to play (replay the tour)</span></button>
    </section>

    <section class="settings-card">
      <h3>About</h3>
      <p>Version <b>{{ APP_VERSION }}</b><template v-if="APP_BUILT"> · built {{ formatBuilt(APP_BUILT) }}</template>. The profile page compares it with the version on the server.</p>
    </section>
  </div>
</template>

<style scoped>
.settings-page { display: grid; gap: 14px; padding: 14px; }
.settings-head small { color: #e4b35c; letter-spacing: .12em; font-weight: 800; font-size: 10px; }
.settings-head h2 { margin: 2px 0 0; font: 700 24px Georgia, serif; color: #e9eef7; }
.settings-card { display: grid; gap: 10px; padding: 14px 16px; border: 1px solid #354762; border-radius: 14px; background: #111c2d; color: #e9eef7; }
.settings-card h3 { margin: 0; font-size: 15px; }
.settings-card p { margin: 0; color: #aebdce; font-size: 13px; line-height: 1.45; }
.settings-card :deep(.opt-label) { display: none; }
.settings-card > button { justify-self: start; padding-inline: 18px; border: 1px solid #a97938; border-radius: 10px; background: #5f3d1c; color: #ffe9bd; font-weight: 800; font-size: 14px; cursor: pointer; }
.settings-card > button:hover { background: #7a4d12; }
</style>
