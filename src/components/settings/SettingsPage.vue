<script setup lang="ts">
import UiInput from '../ui/UiInput.vue';
import UiCheckbox from '../ui/UiCheckbox.vue';
import { APP_BUILT, APP_VERSION, formatBuilt } from '../../version';
import UiButton from '../ui/UiButton.vue';
import ConfirmDialog from '../ui/ConfirmDialog.vue';
import { ref } from 'vue';
import { useGameStore } from '../../stores/game';
import SoundControls from './SoundControls.vue';
import ScreenshotOptions from './ScreenshotOptions.vue';
import { NOTIFICATION_EVENTS, useNotificationsStore } from '../../stores/notifications';

// Everything the player sets once and rarely touches again: sound, notifications, help and the version of the game.
const notifications = useNotificationsStore();
const game = useGameStore();
// Resetting the whole account works at any level, and only after the player agrees.
const promoCode = ref(''), promoFeedback = ref(''), redeeming = ref(false);
async function redeem() { redeeming.value = true; promoFeedback.value = ''; try { promoFeedback.value = await game.redeemPromoCode(promoCode.value); promoCode.value = ''; } catch(error) { promoFeedback.value = (error as Error).message; } finally { redeeming.value = false; } }
const resetting = ref(false);
const agreed = ref(false);
function openReset() { agreed.value = false; resetting.value = true; }
function wipeAccount() { resetting.value = false; game.act({ type: 'wipeAccount', confirm: true }); }
const emit = defineEmits<{ goto: [view: string] }>();
const replayTour = () => { emit('goto', 'service'); setTimeout(() => window.dispatchEvent(new Event('barlingo:tour')), 250); };
</script>

<template>
  <div class="settings-page game-panel">
    <header class="settings-head"><small>SETTINGS</small><h2>Sound, notifications and help</h2></header>

    <form class="settings-card" @submit.prevent="redeem">
      <h3>Promo code</h3><UiInput v-model="promoCode" label="Code" placeholder="Enter your promo code" maxlength="40" autocomplete="off" />
      <UiButton type="submit" variant="primary" :disabled="redeeming || !promoCode.trim()">{{ redeeming ? 'Checking…' : 'Redeem' }}</UiButton><p role="status">{{ promoFeedback }}</p>
    </form>
    <section class="settings-card">
      <h3>Sound</h3>
      <div class="sound-rows">
        <SoundControls id-prefix="settings" />
      </div>
    </section>

    <section class="settings-card notification-settings">
      <h3>Notifications</h3>
      <p>Choose what the game tells you about.</p>
      <UiCheckbox v-for="event in NOTIFICATION_EVENTS" :key="event.id" :model-value="notifications.prefs[event.id]" :label="event.label" :hint="event.detail" @update:model-value="(value: boolean) => notifications.setEnabled(event.id, value)" />
    </section>

    <section class="settings-card">
      <h3>Help</h3>
      <p>Practice a Gin & Tonic for Mia, accept payment in the dialogue and collect your first tip. Your account balance and stock stay safe. You can skip any step and replay the tour whenever you like.</p>
      <UiButton variant="primary" icon="help" @click="replayTour">How to play (replay the tour)</UiButton>
    </section>

    <section class="settings-card"><h3>Screenshot mode</h3><ScreenshotOptions /></section>

    <section class="settings-card danger-zone">
      <h3>Reset my account</h3>
      <p>Deletes all your progress and starts the game again from the beginning, at any level: bars, recipes, styles, crystals, equipment, friends' gifts you have not opened and your stats. Your friends list stays. This cannot be undone.</p>
      <UiButton variant="danger" class="settings-action" @click="openReset">Reset my account…</UiButton>
    </section>

    <ConfirmDialog v-if="resetting" title="Delete all my progress?" confirm-label="Delete everything" danger :disabled="!agreed" @cancel="resetting = false" @confirm="wipeAccount">
      <p>Everything you have built will be deleted <b>forever</b>: level {{ game.level }}, {{ game.knownRecipes.length }} recipes, your bars, styles, crystals and equipment. There is no way to get it back.</p>
      <UiCheckbox v-model="agreed" tone="danger" label="I understand that my progress will be deleted and cannot be restored." />
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
</style>
