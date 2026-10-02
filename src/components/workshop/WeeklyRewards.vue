<script setup lang="ts">
import { MIN_WEEKLY_SCORE, leaderboardReward } from '../../domain/leaderboard';
import ItemArt from '../ui/ItemArt.vue';
import UiIcon from '../ui/UiIcon.vue';
const tiers = [{ rank: 1, label: '1st place' }, { rank: 2, label: '2nd–3rd place' }, { rank: 4, label: '4th–10th place' }, { rank: 11, label: '11th–25th place' }, { rank: 26, label: '26th place & beyond' }].map(tier => ({ ...tier, reward: leaderboardReward(tier.rank, MIN_WEEKLY_SCORE)! }));
</script>
<template>
  <section class="weekly-rewards" aria-label="Weekly ranking prizes">
    <p>Earn at least {{ MIN_WEEKLY_SCORE }} XP this week to receive your placement prizes.</p>
    <article v-for="tier in tiers" :key="tier.rank" class="weekly-prize-tier" :class="{ champion: tier.rank === 1 }">
      <h3><span aria-hidden="true">✦ ━ </span>{{ tier.label }}<span aria-hidden="true"> ━ ✦</span></h3>
      <div class="weekly-prize-body"><div class="weekly-prize-title"><UiIcon name="trophy" /><b>{{ tier.reward.tier }}</b></div>
        <ul><li v-for="(count, box) in tier.reward.boxes" :key="box"><div><ItemArt kind="box" :id="String(box)" fallback="🎁" :size="72" /><b>×{{ count }}</b></div><span>{{ box }} chest</span></li><li v-if="tier.reward.crystals"><div><UiIcon name="crystal" /><b>×{{ tier.reward.crystals }}</b></div><span>Crystals</span></li></ul>
      </div>
    </article>
  </section>
</template>
<style scoped>
.weekly-rewards { display: grid; gap: 20px; }
.weekly-rewards > p { margin: 0; color: #ccbaca; font-size: 12px; line-height: 1.5; }
.weekly-prize-tier { border: 1px solid #91715c; border-radius: 12px; background: linear-gradient(130deg, #49303d, #211b2c); }
.weekly-prize-tier.champion { border-color: #e1bc79; }
.weekly-prize-tier h3 { margin: -1px -1px 0; padding: 10px 4px; border: 1px solid #c99a73; border-radius: 12px 12px 0 0; background: linear-gradient(90deg, #765145, #ae7660, #765145); color: #ffdfaa; font: italic 700 20px Georgia, serif; text-align: center; }
.weekly-prize-tier h3 span { color: #edbf8b; font-size: 12px; }
.weekly-prize-body { padding: 14px; }
.weekly-prize-title { display: flex; align-items: center; gap: 8px; padding-bottom: 12px; margin-bottom: 12px; border-bottom: 1px solid #b4947255; color: #edc58c; }
.weekly-prize-title .ui-icon { width: 26px; height: 26px; }
.weekly-prize-body ul { display: flex; flex-wrap: wrap; gap: 10px; margin: 0; padding: 0; list-style: none; }
.weekly-prize-body li { width: 82px; text-align: center; }
.weekly-prize-body li > div { position: relative; height: 82px; display: grid; place-items: center; border: 1px solid #b2937b; border-radius: 6px; background: linear-gradient(145deg, #ae847744, #251c2f); }
.weekly-prize-body li b { position: absolute; right: 4px; bottom: 3px; color: #ffdc98; font-size: 14px; text-shadow: 0 1px 3px #000; }
.weekly-prize-body li .ui-icon { width: 48px; height: 48px; color: #8bddf3; filter: drop-shadow(0 0 12px #86ddf366); }
.weekly-prize-body li span { display: block; margin-top: 6px; color: #ebd9cf; font-size: 11px; text-transform: capitalize; }
</style>
