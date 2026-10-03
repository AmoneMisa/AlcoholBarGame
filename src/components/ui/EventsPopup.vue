<script setup lang="ts">
import { computed, ref } from 'vue';
import { useGameStore } from '../../stores/game';
import ModalDialog from './ModalDialog.vue';
import UiButton from './UiButton.vue';
import UiIcon from './UiIcon.vue';
import LoginRewardTrack from './LoginRewardTrack.vue';
import DailyWheel from '../workshop/DailyWheel.vue';
import SeasonPass from '../workshop/SeasonPass.vue';
import QuestsPanel from '../workshop/QuestsPanel.vue';
import { lazyPage } from '../../ui/lazy';
const WeeklyLeaderboard = lazyPage(() => import('../workshop/WeeklyLeaderboard.vue'));
const emit = defineEmits<{close:[]}>();
const game = useGameStore();
const page = ref<'login'|'wheel'|'pass'|'quests'|'weekly'>();
const title = computed(() => page.value ? ({login:'Daily login rewards',wheel:'Daily wheel',pass:'Battle Pass',quests:'Quests & rewards',weekly:'Weekly Leaderboard'})[page.value] : 'Events & rewards');
const wheelBusy = ref(false);
function back() { if (!wheelBusy.value) page.value = undefined; }
</script>
<template>
  <ModalDialog :title="title" eyebrow="EVENTS" :width="page === 'pass' ? '960px' : '640px'" :closable="!wheelBusy" @close="page ? back() : emit('close')">
    <template v-if="!page">
      <div class="event-summary"><span><b>{{ game.availableEvents.rewards }}</b> rewards ready</span><span><b>{{ game.rouletteSpinsLeft }}</b> free wheel spins</span></div>
      <div class="event-menu">
        <UiButton @click="page = 'login'"><UiIcon class="event-menu-icon" name="gift" /><span><b>Daily login</b><small>{{ game.dailyGiftAvailable ? 'Your reward is ready' : 'Come back tomorrow' }}</small></span></UiButton>
        <UiButton @click="page = 'wheel'"><img class="event-menu-icon" src="/assets/ui/daily-wheel-painted-v1.webp" alt="" /><span><b>Daily wheel</b><small>{{ game.rouletteSpinsLeft }} free spins available</small></span></UiButton>
        <UiButton @click="page = 'pass'"><UiIcon class="event-menu-icon" name="prestige" /><span><b>Battle Pass</b><small>Season outfits, background & rewards</small></span></UiButton>
        <UiButton @click="page = 'quests'"><UiIcon class="event-menu-icon" name="trophy" /><span><b>Quests & rewards</b><small>{{ game.availableEvents.quests.length + game.availableEvents.achievements.length }} ready to collect</small></span></UiButton>
        <UiButton @click="page = 'weekly'"><UiIcon class="event-menu-icon" name="trophy" /><span><b>Weekly Leaderboard</b><small>Compete with everyone or your friends</small></span></UiButton>
      </div>
    </template>
    <template v-else>
      <UiButton class="event-back" size="sm" :disabled="wheelBusy" @click="back">← All events</UiButton>
      <LoginRewardTrack v-if="page === 'login'" />
      <DailyWheel v-else-if="page === 'wheel'" @busy="wheelBusy = $event" />
      <SeasonPass v-else-if="page === 'pass'" />
      <QuestsPanel v-else-if="page === 'quests'" />
      <WeeklyLeaderboard v-else-if="page === 'weekly'" />
    </template>
  </ModalDialog>
</template>
<style>
.event-summary { display:flex;flex-wrap:wrap;gap:16px;color:#becbdc;margin-bottom:18px;font-size:13px; }.event-summary b { color:#f4cf80; }.event-menu { display:grid;gap:12px; }.event-menu .ui-btn { height:auto;min-height:80px; padding:18px;justify-content:start;text-align:left; }.event-menu .ui-btn-label { display:flex;width:100%;align-items:center;gap:18px; }.event-menu b,.event-menu small { display:block; }.event-menu b { color:#ffe5b3;font-size:18px; }.event-menu small { margin-top:5px;color:#acbbce;font-size:13px; }.event-menu-icon { width:36px;height:36px;flex:none;object-fit:contain; }.event-back { margin-bottom:20px; }.event-claim { display:flex;align-items:center;justify-content:space-between;gap:12px;padding:14px 0; }
</style>
