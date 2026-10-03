<script setup lang="ts">
import UiButton from './UiButton.vue';
import { computed, onUnmounted } from 'vue';
import { DAILY_COINS, dailyCrystalsFor } from '../../domain/economy';
import { useGameStore } from '../../stores/game';
import UiIcon from './UiIcon.vue';
import RewardList from './RewardList.vue';

// The login streak: the seven-day track and the claim button. Shown on the Events page and in the popup that opens
// when the player comes back for the first time in a day.
const game = useGameStore();
// Day of the 7-day cycle that the next claim (or the one just claimed) belongs to.
const cycleDay = computed(() => ((game.dailyGiftAvailable ? game.upcomingLoginDay : game.loginStreak) - 1) % 7 + 1);
const claimedDays = computed(() => game.dailyGiftAvailable ? Math.max(0, game.upcomingLoginDay - 1) % 7 : cycleDay.value);
const justClaimed = computed(() => game.rewardReport?.title === 'Daily reward' ? game.rewardReport : undefined);
const crystalsFor = (day: number) => dailyCrystalsFor(day);
defineExpose({ cycleDay });
// The result was shown here; it should not pop up a second time once this is closed.
onUnmounted(() => { if (game.rewardReport?.title === 'Daily reward') game.dismissRewards(); });
function claim() { game.claimDailyGift(); }
</script>

<template>
  <div class="daily-popup">
    <p class="daily-intro">Come back every day to grow your streak. Day 3 and day 7 add crystals, and a recipe card may drop as an extra gift (12% chance).</p>
    <div class="daily-track">
      <span v-for="(coins, index) in DAILY_COINS" :key="index" :class="{ today: cycleDay === index + 1, claimed: index < claimedDays }">
        <small>DAY {{ index + 1 }}</small>
        <UiIcon :name="index < claimedDays ? 'check' : 'coin'" />
        <b>{{ coins }}</b>
        <em>{{ crystalsFor(index + 1) ? `+${crystalsFor(index + 1)} crystals` : 'coins' }}</em>
      </span>
    </div>
    <div v-if="justClaimed" class="daily-result">
      <b>You received</b>
      <RewardList :lines="justClaimed.lines" />
    </div>
    <p v-else-if="!game.dailyGiftAvailable" class="daily-wait">Today's gift is already in your bar. The next one opens tomorrow.</p>
    <UiButton variant="solid" class="daily-claim" :disabled="!game.dailyGiftAvailable" @click="claim">
      <UiIcon name="gift" /><template v-if="game.dailyGiftAvailable">Claim +{{ game.dailyCoinReward }}<template v-if="game.dailyCrystalReward"> · +{{ game.dailyCrystalReward }} <UiIcon class="inline-icon" name="crystal" /></template></template><template v-else>Claimed today</template>
    </UiButton>
  </div>
</template>

<style>
.daily-popup { display: grid; gap: 12px; }
.daily-intro, .daily-wait { margin: 0; color: #aebccd; font-size: 13px; line-height: 1.5; }
.daily-track { display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); gap: 5px; }
.daily-track > span { display: grid; justify-items: center; gap: 3px; padding: 8px 2px; border: 1px solid #34465e; border-radius: 10px; background: #142034; text-align: center; }
.daily-track small { color: #93a8be; font-size: 13px; font-weight: 800; letter-spacing: .06em; }
.daily-track .ui-icon { width: 18px; height: 18px; color: #7c8da3; }
.daily-track b { color: #e7be68; font: 700 16px Georgia, serif; }
.daily-track em { color: #859ab0; font-size: 13px; font-style: normal; line-height: 1.15; }
.daily-track > span.claimed { border-color: #3f7a55; background: #14291f; }
.daily-track > span.claimed .ui-icon { color: #7fd69b; }
.daily-track > span.today { border-color: #e2b657; background: #48351f; box-shadow: 0 0 0 2px #e2b65755; }
.daily-track > span.today .ui-icon { color: #f2bd58; }
.daily-result { display: grid; gap: 6px; padding: 10px 12px; border: 1px solid #3f7a55; border-radius: 12px; background: #12271d; }
.daily-result > b { color: #b9e5c6; font-size: 13px; }
.daily-claim { display: flex; align-items: center; justify-content: center; gap: 8px; min-height: 46px; }
.daily-claim .ui-icon { width: 20px; height: 20px; }
@media (max-width: 420px) { .daily-track { gap: 3px; } .daily-track b { font-size: 13px; } .daily-track em { font-size: 13px; } }
</style>
