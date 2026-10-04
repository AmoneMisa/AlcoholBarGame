<script setup lang="ts">
import { computed } from 'vue';
import { wishedGifts } from '../../domain/wishlist';
import RewardArt from '../ui/RewardArt.vue';
import { REGIONS } from '../../domain/catalog';
import type { PlayerProfile } from '../../domain/profile';
import AchievementArt from '../ui/AchievementArt.vue';
import CharacterPortrait from '../characters/CharacterPortrait.vue';

// The player card: avatar, level, favourite bar, opened bars, guests served, share of correct English and
// achievements. Used for the player's own screen and for a friend's bar (the actions go in the slot).
const props = defineProps<{
  name: string;
  level: number;
  profile: PlayerProfile;
  /** The bar's look (bartender and decor), as saved in the bar profile. */
  look?: Record<string, string>;
}>();

const regionName = (id?: string) => REGIONS.find((region) => region.id === id)?.name ?? '—';
const opened = computed(() => props.profile.ownedBarIds.map((id) => ({ id, name: regionName(id), served: props.profile.servedByBar[id] ?? 0 })));
const english = computed(() => props.profile.englishPercent === undefined ? '—' : `${props.profile.englishPercent}%`);
</script>

<template>
  <section class="player-profile-card" aria-label="Player profile">
    <header class="profile-head">
      <div class="profile-avatar">
        <CharacterPortrait :character="look?.bartenderCharacter ?? 'noa'" :hair="look?.hairStyle" />
      </div>
      <div class="profile-title">
        <small>PLAYER</small>
        <h2>{{ name }}</h2>
        <span class="profile-level">Level {{ level }}</span>
      </div>
      <div class="profile-actions"><slot name="actions" /></div>
    </header>

    <dl class="profile-stats">
      <div><dt>Favourite bar</dt><dd>{{ profile.favoriteBarId ? regionName(profile.favoriteBarId) : 'Not yet' }}<small v-if="profile.favoriteBarId">{{ profile.servedByBar[profile.favoriteBarId] }} guests served there</small></dd></div>
      <div><dt>Guests served</dt><dd>{{ profile.served.toLocaleString('en-US') }}</dd></div>
      <div><dt>Correct English</dt><dd>{{ english }}<small v-if="profile.sentences">{{ profile.sentences }} sentences</small></dd></div>
      <div><dt>Achievements</dt><dd>{{ profile.achievementCount }} / {{ profile.achievementTotal }}</dd></div>
    </dl>

    <section class="profile-bars">
      <h3>Opened bars <small>{{ opened.length }} of {{ REGIONS.length }}</small></h3>
      <ul><li v-for="bar in opened" :key="bar.id" :class="{ favourite: bar.id === profile.favoriteBarId }"><b>{{ bar.name }}</b><small>{{ bar.served }} served</small></li></ul>
    </section>

    <section class="profile-achievements">
      <h3>{{ profile.picked ? 'Chosen achievements' : 'Latest achievements' }}<slot name="achievements-action" /></h3>
      <ul v-if="profile.shown.length"><li v-for="item in profile.shown" :key="item.id" :class="`tier-${item.tier}`" :title="item.name"><AchievementArt :series="item.series" :tier="item.tier" :size="40" /><span><b>{{ item.seriesName }}</b><small>{{ item.tierName }}</small></span></li></ul>
      <p v-else class="empty">No achievements yet.</p>
    </section>
    <section class="profile-wishes"><h3>Desired gifts<slot name="wishlist-action" /></h3><ul v-if="profile.wishedGifts?.length"><li v-for="(line,i) in wishedGifts(profile.wishedGifts)" :key="i"><RewardArt :line="line" /><span>{{ line.text }}</span></li></ul><p v-else class="empty">No desired gifts selected.</p></section>
  </section>
</template>

<style scoped>
.profile-wishes h3{display:flex;justify-content:space-between;align-items:center;gap:12px;font-size:14px}.profile-wishes ul{display:grid;grid-template-columns:repeat(auto-fit,minmax(90px,1fr));gap:10px;list-style:none;padding:0}.profile-wishes li{display:grid;grid-template-rows:80px auto;gap:8px;justify-items:center;text-align:center;padding:10px;border:1px solid #6b604a;border-radius:10px;background:#172334;font-size:12px;overflow-wrap:anywhere}.profile-wishes :deep(.reward-art){height:80px;width:80px}
.player-profile-card { display: grid; gap: 16px; min-width:0;padding: 12px; border: 1px solid #354762; border-radius: 12px; background: #111c2d; color: #e9eef7; }
.profile-head { display: grid; grid-template-columns: 72px minmax(0,1fr); gap: 10px; align-items: center; }
.profile-actions {grid-column:1/-1;}
.profile-title {min-width:0;overflow-wrap:anywhere;}
.profile-avatar { position: relative; width: 88px; height: 88px; overflow: hidden; border-radius: 50%; background:#0b1320 var(--ui-panel-art) center / cover no-repeat; }
.profile-avatar :deep(.character-portrait) { inset:0;transform:none;width:100%;height:100%;background-size:cover; }
.profile-title small { color: #e4b35c; letter-spacing: .12em; font-weight: 800; font-size: 13px; }
.profile-title h2 { margin: 2px 0; font: 700 24px Georgia, serif; }
.profile-level { display: inline-block; padding: 2px 10px; border-radius: 999px; background: #3b2b1f; border: 1px solid #b78649; color: #ffe9bd; font-weight: 700; font-size: 13px; }
.profile-actions { display: flex; flex-wrap: wrap; gap: 8px; justify-content: flex-end; }
.profile-stats { display: grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap: 8px; margin: 0; }
.profile-stats > div {min-width:0;overflow-wrap:anywhere;}
.profile-stats div { padding: 10px 12px; border-radius: 12px; background: #17253a; }
.profile-stats dt { color: #b6c4d5; font-size: 12px; line-height:1.4; }
.profile-stats dd { margin: 4px 0 0; font: 700 20px Georgia, serif; }
.profile-stats dd small { display: block; font: 400 13px system-ui, sans-serif; color: #9eafc1; }
h3 { margin: 0 0 8px; font-size: 14px; }
.profile-achievements h3,.profile-wishes h3 {display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:8px;line-height:1.4;}
.profile-achievements li {min-width:0;max-width:100%;overflow-wrap:anywhere;}
h3 small { margin-left: 8px; color: #91a2b5; font-weight: 400; }
ul { list-style: none; margin: 0; padding: 0; display: flex; flex-wrap: wrap; gap: 8px; }
.profile-bars li { padding: 6px 12px; border-radius: 10px; background: #17253a; border: 1px solid #2d4059; }
.profile-bars li.favourite { border-color: #e0a14a; }
.profile-bars li small { margin-left: 8px; color: #9eafc1; }
.profile-achievements li { display: flex; align-items: center; gap: 8px; padding: 6px 12px; border-radius: 10px; background: #2a2418; border: 1px solid #6b5a2e; }
.profile-achievements li small { display: block; font-size: 13px; opacity: .85; }
.profile-achievements li.tier-1 { border-color: #a8672f; }
.profile-achievements li.tier-2 { border-color: #b9c3d0; }
.profile-achievements li.tier-3 { border-color: #f0c24b; background: #3a2f16; }
.profile-achievements li.tier-4 { border-color: #7fe0f0; background: #17323a; }
.empty { margin: 0; color: #9eafc1; font-size: 13px; }
@media (max-width: 560px) { .profile-head { grid-template-columns: 72px 1fr; } .profile-actions { grid-column: 1 / -1; justify-content: flex-start; } .profile-avatar { width: 72px; height: 72px; } }
</style>
