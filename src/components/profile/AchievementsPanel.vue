<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { currentAchievements, ACHIEVEMENT_CATEGORIES } from '../../domain/achievementTrack';
import { useGameStore } from '../../stores/game';
import AchievementArt from '../ui/AchievementArt.vue';
import ItemArt from '../ui/ItemArt.vue';
import SectionTabs from '../ui/SectionTabs.vue';
import UiButton from '../ui/UiButton.vue';

const game = useGameStore();
const category = ref('all');
const page = ref(1);
const PAGE_SIZE = 6;
const rows = computed(() => {
  const selected = ACHIEVEMENT_CATEGORIES.find(item => item.id === category.value)!;
  return currentAchievements(game.loot.achievements).filter(row => category.value === 'completed' ? row.finished : !row.finished && (!selected.stats.length || selected.stats.includes(row.goal.stat)));
});
const pages = computed(() => Math.max(1, Math.ceil(rows.value.length / PAGE_SIZE)));
const visible = computed(() => rows.value.slice((page.value - 1) * PAGE_SIZE, page.value * PAGE_SIZE));
watch(category, () => { page.value = 1; });
watch(pages, count => { page.value = Math.min(page.value, count); });
</script>
<template>
  <section class="achievements-panel" aria-label="Achievements">
    <SectionTabs v-model="category" :tabs="ACHIEVEMENT_CATEGORIES" label="Achievement categories" />
    <nav class="achievement-pagination" aria-label="Achievement pages">
      <UiButton size="sm" :disabled="page === 1" @click="page--">Previous</UiButton>
      <span role="status">{{ page }} / {{ pages }}</span>
      <UiButton size="sm" :disabled="page === pages" @click="page++">Next</UiButton>
    </nav>
    <div class="achievement-cards">
      <article v-for="row in visible" :key="row.goal.id" class="achievement-card">
        <AchievementArt :series="row.goal.series" :tier="row.goal.tier" :size="64" />
        <h3>{{ row.goal.seriesName }}</h3><p>{{ row.goal.name }}</p>
        <template v-if="!row.finished">
          <progress :value="Math.min(game.achievementStat(row.goal.stat), row.goal.target)" :max="row.goal.target" />
          <b>{{ Math.min(game.achievementStat(row.goal.stat), row.goal.target) }} / {{ row.goal.target }}</b>
          <div class="achievement-prizes"><span><ItemArt kind="resource" id="crystals" fallback="💎" :size="32" />{{ row.goal.crystals }}</span><span><ItemArt kind="box" :id="row.goal.box" fallback="🎁" :size="32" />×1</span></div>
          <UiButton variant="primary" block :disabled="game.achievementStat(row.goal.stat) < row.goal.target" @click="game.act({type:'claimAchievement',id:row.goal.id})">Claim reward</UiButton>
        </template><b v-else>Completed</b>
      </article>
    </div>
    <p v-if="!rows.length">No achievements in this category yet.</p>
  </section>
</template>
<style scoped>
.achievements-panel{display:grid;gap:12px;min-width:0}.achievement-cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:10px}.achievement-card{display:grid;align-content:start;justify-items:start;gap:8px;padding:14px;border:1px solid #354762;border-radius:13px;background:#111c2d var(--ui-dialog-art) center/cover}.achievement-card h3,.achievement-card p{margin:0}.achievement-card p{color:#aebdce;font-size:13px;line-height:1.45}.achievement-card progress{width:100%;accent-color:#e7b556}.achievement-prizes,.achievement-prizes>span{display:flex;align-items:center;gap:8px}.achievement-pagination{display:flex;align-items:center;justify-content:center;gap:12px}.achievement-card .ui-btn{justify-self:stretch}
</style>
