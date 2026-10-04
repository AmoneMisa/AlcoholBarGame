<script setup lang="ts">
import UiButton from './UiButton.vue';
import { computed } from 'vue';
import { DAILY_COINS, dailyCoinsFor, dailyCrystalsFor } from '../../domain/economy';
import { useGameStore } from '../../stores/game';

import UiIcon from './UiIcon.vue';
import CrystalAmount from './CrystalAmount.vue';

// Shared login track for Events and the daily reward dialog.
const game = useGameStore();
// Day of the 7-day cycle that the next claim (or the one just claimed) belongs to.
const cycleDay = computed(() => ((game.dailyGiftAvailable ? game.upcomingLoginDay : game.loginStreak) - 1) % 7 + 1);
const claimedDays = computed(() => game.dailyGiftAvailable ? Math.max(0, game.upcomingLoginDay - 1) % 7 : cycleDay.value);
const cycleStart = computed(() => Math.floor((Math.max(1, game.dailyGiftAvailable ? game.upcomingLoginDay : game.loginStreak) - 1) / 7) * 7);
const trackRewards = computed(() => DAILY_COINS.map((_, index) => dailyCoinsFor(cycleStart.value + index + 1)));
const crystalsFor = (day: number) => dailyCrystalsFor(day);
function claim() { game.claimDailyGift(); }
</script>

<template>

    <div class="daily-popup">
      <p class="daily-intro">One reward per day. Miss a day and your streak starts again at day 1. Rewards reset at 00:00 UTC. A recipe card may drop as an extra gift (12% chance).</p>
      <div class="daily-track">
        <span v-for="(coins, index) in trackRewards" :key="index" :class="{ today: cycleDay === index + 1, claimed: index < claimedDays }">
          <small>DAY {{ cycleStart + index + 1 }}</small>
          <UiIcon :name="index < claimedDays ? 'check' : 'coin'" />
          <b>{{ coins }}</b>
          <em v-if="crystalsFor(index + 1)"><CrystalAmount :value="`+${crystalsFor(index + 1)}`" /></em>
        </span>
      </div>
      <p v-if="!game.dailyGiftAvailable" class="daily-wait">Today's gift is already in your bar. The next one opens tomorrow.</p>
      <UiButton variant="solid" class="daily-claim" :disabled="!game.dailyGiftAvailable || game.dailyClaimPending" @click="claim">
        <span class="daily-claim-content"><UiIcon name="gift" /><template v-if="game.dailyClaimPending">Claiming…</template><template v-else-if="game.dailyGiftAvailable">Claim +{{ game.dailyCoinReward }}<CrystalAmount v-if="game.dailyCrystalReward" :value="`+${game.dailyCrystalReward}`" /></template><template v-else>Claimed today</template></span>
      </UiButton>
    </div>

</template>

<style>
.daily-popup { display: grid; gap: 12px; }
.daily-intro, .daily-wait { margin: 0; color: #aebccd; font-size: 13px; line-height: 1.5; }
.daily-track { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; }
.daily-track > span { display: grid; align-content:center;justify-items: center; gap: 6px; min-height:96px;padding: 10px 6px; border: 1px solid #34465e; border-radius: 10px; background: #142034; text-align: center; }
.daily-track > span:last-child { grid-column:2; }
.daily-track small { color: #93a8be; font-size: 13px; font-weight: 800; letter-spacing: .06em; }
.daily-track .ui-icon { width: 24px; height: 24px; color: #7c8da3; }
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
.daily-claim-content {display:flex;align-items:center;justify-content:center;flex-wrap:wrap;gap:8px;}
</style>


