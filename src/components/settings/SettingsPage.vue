<script setup lang="ts">
import { voiceMode } from '../../audio/index';
import { APP_BUILT, APP_VERSION, formatBuilt } from '../../version';
import OptionSelect from '../game/OptionSelect.vue';
import UiButton from '../ui/UiButton.vue';
import ConfirmDialog from '../ui/ConfirmDialog.vue';
import { computed, ref } from 'vue';
import { PRESTIGE_LEVEL, prestigeStarsFor } from '../../domain/loot';
import { useGameStore } from '../../stores/game';
import SoundControls from './SoundControls.vue';
import { NOTIFICATION_EVENTS, useNotificationsStore } from '../../stores/notifications';

// Everything the player sets once and rarely touches again: sound, guest voices, help and the version of the game.
const notifications = useNotificationsStore();
const game = useGameStore();
// The Grand Opening (prestige) wipes the business and starts over. It lives here, behind an agreement, not on the main page.
const asking = ref(false);
const stars = computed(() => prestigeStarsFor(game.loot.runEarned));
const wipeReason = computed(() => game.level >= PRESTIGE_LEVEL ? '' : `Available from level ${PRESTIGE_LEVEL} (you are level ${game.level}).`);
function grandOpening() { asking.value = false; game.act({ type: 'prestige' }); }
// Resetting the whole account works at any level, and only after the player agrees.
const resetting = ref(false);
const agreed = ref(false);
function openReset() { agreed.value = false; resetting.value = true; }
function wipeAccount() { resetting.value = false; game.act({ type: 'wipeAccount', confirm: true }); }
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

    <section class="settings-card notification-settings">
      <h3>Notifications</h3>
      <p>Choose what the game tells you about.</p>
      <label v-for="event in NOTIFICATION_EVENTS" :key="event.id"><span><b>{{ event.label }}</b><small>{{ event.detail }}</small></span><input type="checkbox" :checked="notifications.prefs[event.id]" @change="notifications.setEnabled(event.id, ($event.target as HTMLInputElement).checked)" /></label>
    </section>

    <section class="settings-card">
      <h3>Help</h3>
      <p>The tour shows the main parts of the game step by step. You can skip any step and replay it whenever you like.</p>
      <UiButton variant="primary" icon="help" @click="replayTour">How to play (replay the tour)</UiButton>
    </section>

    <section class="settings-card">
      <h3>Grand Opening</h3>
      <p>Reopens your bars from scratch: coins, XP, stock and equipment levels are reset. Recipes, styles, crystals, parts, boxes, friends and the bars you own stay. You earn prestige stars for permanent bonuses and a Choice box. Opened {{ game.loot.prestige.count }} times so far.</p>
      <UiButton variant="secondary" class="settings-action" :reason="wipeReason" @click="asking = true">Start a Grand Opening…</UiButton>
    </section>

    <section class="settings-card danger-zone">
      <h3>Reset my account</h3>
      <p>Deletes all your progress and starts the game again from the beginning, at any level: bars, recipes, styles, crystals, equipment, friends' gifts you have not opened and your stats. Your friends list stays. This cannot be undone.</p>
      <UiButton variant="danger" class="settings-action" @click="openReset">Reset my account…</UiButton>
    </section>

    <ConfirmDialog v-if="resetting" title="Delete all my progress?" confirm-label="Delete everything" danger :disabled="!agreed" @cancel="resetting = false" @confirm="wipeAccount">
      <p>Everything you have built will be deleted <b>forever</b>: level {{ game.level }}, {{ game.knownRecipes.length }} recipes, your bars, styles, crystals and equipment. There is no way to get it back.</p>
      <label class="agree"><input v-model="agreed" type="checkbox" /><span>I understand that my progress will be deleted and cannot be restored.</span></label>
    </ConfirmDialog>

    <ConfirmDialog v-if="asking" title="Start over?" confirm-label="Yes, reset my bars" danger @cancel="asking = false" @confirm="grandOpening">
      <p>This <b>resets your business</b> and cannot be undone. You will earn <b>{{ stars }} prestige stars</b> and a Choice box.</p>
      <ul>
        <li><span>Reset</span><b>coins, XP, stock, equipment levels</b></li>
        <li><span>Kept</span><b>recipes, styles, crystals, parts, boxes, friends, owned bars</b></li>
      </ul>
    </ConfirmDialog>

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
.danger-zone { border-color: #6b3a3a; }
.settings-action { justify-self: start; }
.notification-settings label { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 10px 0; border-top: 1px solid #2d4059; }
.notification-settings label span { display: grid; gap: 2px; }
.notification-settings label b { font-size: 14px; }
.notification-settings label small { color: #91a2b5; font-size: 12px; font-weight: 500; }
.notification-settings input { flex: none; width: 22px; height: 22px; accent-color: #dca94e; }
</style>
