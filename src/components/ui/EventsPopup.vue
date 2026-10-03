<script setup lang="ts">
import { useGameStore } from '../../stores/game';
import { DRAW_COST } from '../../domain/loot';
import ModalDialog from './ModalDialog.vue';
import UiIcon from './UiIcon.vue';
import UiButton from './UiButton.vue';
import LoginRewardTrack from './LoginRewardTrack.vue';
import DailyWheel from '../workshop/DailyWheel.vue';
import SeasonPass from '../workshop/SeasonPass.vue';
import CityEvent from '../game/CityEvent.vue';
const emit = defineEmits<{close:[]}>();
const game = useGameStore();
</script>
<template>
  <ModalDialog title="Events & rewards" eyebrow="WHAT'S ON AT YOUR BAR" width="600px" @close="emit('close')">
    <div class="events-hub">
      <div class="event-counters">
        <span><UiIcon name="gift" /><b>{{ game.availableEvents.rewards }}</b><small>Rewards ready</small></span>
        <span><UiIcon name="crystal" /><b>{{ game.availableEvents.spins }}</b><small>Paid style spins</small></span>
        <span><UiIcon name="star" /><b>{{ game.availableEvents.freeDraws }}</b><small>Free draws</small></span>
      </div>
      <section><h3>Daily login rewards <i v-if="game.dailyGiftAvailable">Ready</i></h3><LoginRewardTrack /></section>
      <section><h3>Daily wheel</h3><DailyWheel /></section>
      <section><h3>Season pass</h3><SeasonPass /></section>
      <section class="event-draws"><h3>Seasonal style draws</h3><p>Paid spins use crystals. Your seasonal progress and rewards are saved.</p><div class="event-draw-actions"><UiButton :disabled="game.crystals < DRAW_COST.single" @click="game.act({type:'drawStyle',count:1,banner:'seasonal'})">Spin · {{ DRAW_COST.single }} <UiIcon name="crystal" /></UiButton><UiButton :disabled="game.crystals < DRAW_COST.ten" @click="game.act({type:'drawStyle',count:10,banner:'seasonal'})">10 spins · {{ DRAW_COST.ten }} <UiIcon name="crystal" /></UiButton></div></section>
      <section v-if="game.availableEvents.quests.length || game.availableEvents.achievements.length"><h3>Ready to collect</h3><article v-for="goal in game.availableEvents.quests" :key="goal.id" class="event-claim"><span><b>{{ goal.name }}</b><small>{{ goal.box }} box · {{ goal.crystals }} crystals</small></span><UiButton size="sm" @click="game.act({type:'claimQuest',questId:goal.id})">Claim</UiButton></article><article v-for="goal in game.availableEvents.achievements" :key="goal.id" class="event-claim"><span><b>{{ goal.name }}</b><small>{{ goal.box }} box · {{ goal.crystals }} crystals</small></span><UiButton size="sm" @click="game.act({type:'claimAchievement',id:goal.id})">Claim</UiButton></article></section>
      <section><h3>Tonight at the bar</h3><CityEvent /><article v-if="game.barEvent"><h4>{{ game.barEvent.title }}</h4><p>{{ game.barEvent.description }}</p></article></section>
    </div>
  </ModalDialog>
</template>
<style scoped>
.events-hub {display:grid;gap:16px}.events-hub section {padding:14px;border:1px solid #b9965538;border-radius:14px;background:#ffffff04}.events-hub h3 {display:flex;align-items:center;justify-content:space-between;gap:8px;margin:0 0 12px;color:#f6e3bc;font:700 18px Georgia,serif}.events-hub h3 i {font:700 10px system-ui;color:#aedab9;background:#284936;padding:4px 8px;border-radius:20px}.events-hub p {font-size:12px;color:#b4c0d0;line-height:1.5}.event-counters {display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}.event-counters span {display:grid;justify-items:center;gap:4px;padding:12px 4px;border:1px solid #bc98574d;border-radius:12px;background:linear-gradient(140deg,#3c3046,#182539)}.event-counters b {font:700 24px Georgia;color:#f5d184}.event-counters small {font-size:10px;text-align:center;color:#bfc9d7}.event-counters .ui-icon {width:22px;height:22px;color:#eec979}.event-draws :deep(.ui-button),.event-draw-actions {width:100%}.event-draw-actions {display:flex;gap:8px}.event-draw-actions :deep(.ui-button) {flex:1;min-width:0}.event-claim {display:flex;gap:12px;align-items:center;justify-content:space-between;padding:10px 0}.event-claim span {display:grid;gap:4px}.event-claim b {font-size:12px}.event-claim small {font-size:10px;color:#bec9d9}
</style>

