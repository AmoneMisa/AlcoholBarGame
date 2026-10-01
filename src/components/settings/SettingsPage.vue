<script setup lang="ts">
import { voiceMode } from '../../audio/index';
import { APP_BUILT, APP_VERSION, formatBuilt } from '../../version';
import OptionSelect from '../game/OptionSelect.vue';
import UiButton from '../ui/UiButton.vue';
import SoundControls from './SoundControls.vue';

// Everything the player sets once and rarely touches again: sound, guest voices, help and the version of the game.
const emit = defineEmits<{ goto: [view: string] }>();
const replayTour = () => { emit('goto', 'service'); setTimeout(() => window.dispatchEvent(new Event('barlingo:tour')), 250); };
</script>

<template>
  <div class="settings-page game-panel">
    <header class="settings-head"><small>SETTINGS</small><h2>Sound, voices and help</h2></header>

    <section class="settings-card">
      <h3>Sound</h3>
      <div class="volume-panel static">
        <SoundControls id-prefix="settings" />
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
      <UiButton variant="primary" icon="help" @click="replayTour">How to play (replay the tour)</UiButton>
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
</style>
