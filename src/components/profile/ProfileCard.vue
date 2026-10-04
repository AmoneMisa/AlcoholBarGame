<script setup lang="ts">
import { computed } from 'vue';
import { wishedGifts, WISHLIST_MAX } from '../../domain/wishlist';
import { FEATURED_MAX, type PlayerProfile } from '../../domain/profile';
import { REGIONS } from '../../domain/catalog';
import RewardArt from '../ui/RewardArt.vue';
import AchievementArt from '../ui/AchievementArt.vue';
import UiIcon from '../ui/UiIcon.vue';
import CharacterPortrait from '../characters/CharacterPortrait.vue';
const props = defineProps<{
  name: string; level: number; profile: PlayerProfile; look?: Record<string, string>;
  editable?: boolean; subtitle?: string; progress?: { into: number; needed: number; percent: number };
}>();
const emit = defineEmits<{ achievements: []; pickAchievements: []; wishlist: [] }>();
const english = computed(() => props.profile.englishPercent === undefined ? '—' : props.profile.englishPercent + '%');
const favourite = computed(() => REGIONS.find(region => region.id === props.profile.favoriteBarId)?.name ?? 'Not yet');
const placeholders = ['loginDays', 'perfectTalks', 'serves', 'bars', 'giftsGot'];
const medals = computed(() => Array.from({ length: FEATURED_MAX }, (_, index) => props.profile.shown[index]));
const wishes = computed(() => wishedGifts(props.profile.wishedGifts));
</script>

<template>
  <section class="player-profile-card" :class="{ 'own-profile': editable }" aria-label="Player profile">
    <header class="profile-head">
      <div class="profile-avatar"><CharacterPortrait :character="look?.bartenderCharacter ?? 'noa'" :hair="look?.hairStyle" /></div>
      <div class="profile-title">
        <h2>{{ name }}</h2>
        <p v-if="subtitle" class="profile-subtitle">{{ subtitle }}</p>
        <p class="profile-level">Level {{ level }}<template v-if="progress"> · {{ progress.needed ? progress.into + ' / ' + progress.needed + ' XP' : 'Max level' }}</template></p>
        <div v-if="progress" class="profile-xp" role="progressbar" aria-label="Level progress" :aria-valuenow="Math.round(progress.percent)" :aria-valuemin="0" :aria-valuemax="100"><span :style="{ width: progress.percent + '%' }" /></div>
      </div>
      <div v-if="$slots.actions" class="profile-actions"><slot name="actions" /></div>
    </header>
    <dl class="profile-stats">
      <div><UiIcon name="friends" /><dt>Guests served</dt><dd>{{ profile.served.toLocaleString('en-US') }}</dd></div>
      <div><UiIcon name="chat" /><dt>Correct English</dt><dd>{{ english }}</dd></div>
      <div class="profile-favourite"><UiIcon name="glass" /><dt>Favourite bar</dt><dd>{{ favourite }}</dd></div>
    </dl>
    <section class="profile-achievements">
      <h3><component :is="editable ? 'button' : 'span'" :type="editable ? 'button' : undefined" @click="editable && emit('achievements')">Achievements · {{ profile.achievementCount }} / {{ profile.achievementTotal }}</component></h3>
      <ul class="profile-medals">
        <li v-for="(item, index) in medals" :key="index">
          <component :is="editable ? 'button' : 'span'" :type="editable ? 'button' : undefined" class="profile-medal" :class="{ 'medal-empty': !item }" :title="item ? item.seriesName + ' · ' + item.tierName + ': ' + item.name : 'Choose achievements to display'" :aria-label="item ? item.seriesName + ' · ' + item.tierName : 'Empty achievement slot ' + (index + 1)" @click="editable && emit('pickAchievements')">
            <AchievementArt :series="item?.series ?? placeholders[index]!" :tier="item?.tier ?? 1" :size="48" />
          </component>
        </li>
      </ul>
    </section>
    <section class="profile-wishes">
      <h3>Desired gifts</h3>
      <component :is="editable ? 'button' : 'div'" :type="editable ? 'button' : undefined" class="profile-wishlist" :aria-label="editable ? 'Choose desired gifts' : undefined" @click="editable && emit('wishlist')">
        <ul v-if="wishes.length"><li v-for="(line, index) in wishes" :key="index" :title="line.text"><RewardArt :line="line" /><span>{{ line.text }}</span></li></ul>
        <template v-else><UiIcon name="gift" /><span>{{ editable ? 'Choose up to ' + WISHLIST_MAX + ' gifts for your wishlist' : 'No desired gifts selected.' }}</span></template>
      </component>
    </section>
  </section>
</template>

<style scoped>
.player-profile-card{display:grid;gap:16px;min-width:0;padding:16px;border:1px solid #526078;border-radius:14px;background:#101d2df2;color:#f3eee4;text-align:center}
.own-profile{background:linear-gradient(180deg,#05112045,#051120b3 40%,#051120f0),url('/assets/bar/backgrounds/interior-riad.webp') center top/cover no-repeat}
.profile-head{display:grid;grid-template-columns:64px minmax(0,1fr);gap:10px;align-items:center;min-width:0}
.profile-avatar{position:relative;width:64px;height:64px;overflow:hidden;border:2px solid #d5b675;border-radius:50%;background:#101d2d}
.profile-title{min-width:0;overflow-wrap:anywhere;text-shadow:0 1px 3px #000}
.profile-title h2{margin:0;font:700 22px Georgia,serif;color:#ffe7af}
.profile-subtitle{margin:3px 0;color:#e0e6ee;font-size:13px;line-height:1.35}
.profile-level{margin:5px 0;color:#e6d4ac;font-size:12px;line-height:1.4}
.profile-xp{height:6px;border:1px solid #65738a;border-radius:99px;overflow:hidden;background:#081321}
.profile-xp span{display:block;height:100%;border-radius:inherit;background:linear-gradient(90deg,#ac7730,#f8d484)}
.profile-actions{display:flex;justify-content:center;gap:8px;grid-column:1/-1}
.own-profile .profile-actions{grid-column:3;grid-row:1;align-self:start}
.own-profile .profile-head{grid-template-columns:64px minmax(0,1fr) auto}
.profile-stats{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:0;margin:0;padding:12px 0;border:1px solid #586b83;border-radius:12px;background:#071729e8}
.profile-stats>div{display:grid;justify-items:center;align-content:start;gap:5px;min-width:0;padding:0 5px;background:none}
.profile-stats>div+div{border-left:1px solid #3c536c}
.profile-stats .ui-icon{width:24px;height:24px;color:#efcb7a}
.profile-stats dt{color:#c8d3e2;font-size:12px;line-height:1.3;min-height:31px;display:flex;align-items:center;justify-content:center}
.profile-stats dd{margin:0;max-width:100%;overflow-wrap:anywhere;font:700 22px Georgia,serif}
.profile-favourite dd{font-size:16px;line-height:1.5}
h3{margin:0 0 9px;color:#f2d69c;font:700 17px Georgia,serif;line-height:1.4;text-align:center}
h3 button{padding:0;border:0;background:none;color:inherit;font:inherit;cursor:pointer}
.profile-medals{list-style:none;display:grid;grid-template-columns:repeat(5,minmax(0,1fr));align-items:center;gap:4px;margin:0;padding:10px 5px;border:1px solid #586b83;border-radius:12px;background:#071729e8}
.profile-medals li{min-width:0;display:flex;justify-content:center}
.profile-medal{display:grid;place-items:center;width:100%;max-width:52px;min-height:44px;padding:0;border:0;border-radius:50%;background:none;color:inherit}
button.profile-medal{cursor:pointer}
.profile-medal :deep(.achievement-art){width:100%;height:auto;max-width:48px}
.medal-empty :deep(.achievement-art){filter:grayscale(1);opacity:.35}
.profile-wishlist{display:flex;align-items:center;justify-content:center;gap:12px;width:100%;min-height:58px;padding:10px 12px;border:1px solid #586b83;border-radius:12px;background:#071729e8;color:#e4eaf3;font:inherit;font-size:13px;line-height:1.5;text-align:center}
button.profile-wishlist{cursor:pointer}
.profile-wishlist>.ui-icon{width:28px;height:28px;color:#efcb7a}
.profile-wishlist>span{min-width:0;overflow-wrap:anywhere}
.profile-wishlist ul{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:8px;width:100%;margin:0;padding:0;list-style:none}
.profile-wishlist li{display:grid;justify-items:center;align-content:start;gap:4px;min-width:0;font-size:10px;line-height:1.3;overflow-wrap:anywhere}
.profile-wishlist :deep(.reward-art){width:36px;height:36px;max-width:100%}
button:focus-visible{outline:2px solid #f5d287;outline-offset:3px}
button.profile-medal:hover,button.profile-wishlist:hover{background-color:#23384ad9}
@media(max-width:360px){.player-profile-card{padding:12px}.own-profile .profile-head{grid-template-columns:56px minmax(0,1fr)}.profile-avatar{width:56px;height:56px}.own-profile .profile-actions{grid-column:2;grid-row:2;justify-self:center}.profile-title h2{font-size:20px}}
</style>
