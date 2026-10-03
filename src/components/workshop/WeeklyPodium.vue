<script setup lang="ts">
import { computed } from 'vue';
import type { LeaderboardResult } from '../../telegram/api';
import { INTERIORS } from '../../data/cosmetics/bars';
import CharacterModel from '../characters/CharacterModel.vue';
import UiIcon from '../ui/UiIcon.vue';
const props = defineProps<{ rows: LeaderboardResult['top'] }>();
const podium = computed(() => [2, 1, 3].map(rank => ({ rank, row: props.rows.find(row => row.rank === rank) })));
const titles: Record<number, string> = { 1: 'Weekly champion', 2: 'Rising fame', 3: 'Shining star' };
function background(look?: Record<string, string>) { return INTERIORS.find(item => item.id === look?.interior)?.asset ?? INTERIORS[0].asset; }
</script>
<template>
  <section class="weekly-podium" aria-label="This week's top three">
    <div class="podium-heading"><span>✧ ━ ◆ ━ ✧</span><h3>Hall of fame</h3><small>THIS WEEK'S LEADING BARS</small></div>
    <div class="podium-cards">
      <article v-for="{ rank, row } in podium" :key="rank" class="podium-card" :class="[`place-${rank}`, { 'is-me': row?.me, vacant: !row }]">
        <div class="podium-portrait" :style="row ? { backgroundImage: `url('${background(row.look)}')` } : {}">
          <div class="podium-rank"><UiIcon name="trophy" /><b>{{ rank }}</b></div>
          <CharacterModel v-if="row?.look" role="bartender" :character-id="row.look.bartenderCharacter ?? 'noa'" :outfit="row.look.bartender" :hair-style="row.look.hairStyle" :hair-color="row.look.hairColor" :body-shape="row.look.bodyShape" :skin-detail="row.look.skinDetail" :skin-tone="row.look.skinTone" :pose="row.look.pose" :eye-shape="row.look.eyeShape" :brow-shape="row.look.browShape" :nose-shape="row.look.noseShape" :lip-shape="row.look.lipShape" :cheek-shape="row.look.cheekShape" :eye-color="row.look.eyeColor" :eyeliner="row.look.eyeliner" :eyeshadow="row.look.eyeshadow" :lip-color="row.look.lipColor" :blush="row.look.blush" :facial-hair="row.look.facialHair" :outfit-color="row.look.outfitColor" animation="idle" />
          <UiIcon v-else class="podium-empty" :name="row ? 'trophy' : 'star'" />
          <span class="podium-ornament" aria-hidden="true">✦</span>
        </div>
        <h4>{{ titles[rank] }}</h4>
        <div class="podium-details"><b>{{ row?.label ?? 'Place awaits' }}</b><small v-if="row?.level">Level {{ row.level }}<template v-if="row.me"> · You</template></small><strong v-if="row"><UiIcon name="xp" />{{ row.score.toLocaleString('en-US') }}<small>XP</small></strong><small v-else>Earn XP to join</small></div>
      </article>
    </div>
  </section>
</template>
<style scoped>
.weekly-podium { position: relative; isolation: isolate; overflow: hidden; padding: 20px 8px 26px; border: 1px solid #856448; border-radius: 18px; background: linear-gradient(#181421bb, #24152cf0 58%, #764e3999), url('/assets/bar/backgrounds/interior-palace.webp') center/cover; }
.podium-heading { text-align: center; margin-bottom: 24px; }
.podium-heading span { color: #eac77e; letter-spacing: .2em; }
.podium-heading h3 { margin: 8px 0 4px; color: #ffe1a5; font: italic 700 30px Georgia, serif; }
.podium-heading small { color: #d5bfa1; font-size: 8px; letter-spacing: .18em; }
.podium-cards { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); align-items: start; gap: 6px; padding-top: 18px; }
.podium-card { --frame: #9fdedc; --shade: #3e7186; position: relative; min-width: 0; border: 1px solid var(--frame); border-radius: 48px 48px 8px 8px; background: linear-gradient(var(--shade), #241c2fee); box-shadow: inset 0 0 0 3px #fff2, 0 8px 24px #0008; }
.place-1 { --frame: #f6d386; --shade: #8c583c; margin-top: 28px; z-index: 1; }
.place-3 { --frame: #e6a5d8; --shade: #865775; }
.podium-card.is-me { box-shadow: inset 0 0 0 3px #fff3, 0 0 22px #edc97c66; }
.podium-portrait { position: relative; height: clamp(190px, 44vw, 330px); border-radius: 48px 48px 0 0; overflow: hidden; background-size: cover; background-position: center; }
.podium-portrait::after { content: ''; position: absolute; inset: 0; box-shadow: inset 0 0 24px var(--shade); pointer-events: none; }
.podium-portrait :deep(.art-character) { position: absolute; width: auto; max-width: none; height: 100%; aspect-ratio: .572; bottom: -2%; left: 50%; translate: -50% 0; pointer-events: none; }
.podium-rank { position: absolute; top: 10px; left: 50%; transform: translateX(-50%); z-index: 2; display: grid; place-items: center; width: 34px; height: 34px; border: 1px solid var(--frame); border-radius: 50%; background: #211529dc; color: var(--frame); }
.podium-rank .ui-icon { position: absolute; width: 28px; height: 28px; opacity: .25; }
.podium-rank b { font: 700 20px Georgia, serif; }
.podium-empty { position: absolute; left: 25%; top: 40%; width: 50%; height: 50px; color: var(--frame); opacity: .5; }
.podium-ornament { position: absolute; bottom: 8px; left: 8px; color: var(--frame); font-size: 20px; }
.podium-card h4 { position: relative; margin: -1px -3px 0; padding: 8px 2px; border-block: 1px solid var(--frame); background: linear-gradient(90deg, var(--shade), #452a51, var(--shade)); color: #ffebbc; font: italic 700 clamp(10px, 2.8vw, 16px)/1.2 Georgia, serif; text-align: center; }
.podium-details { display: grid; justify-items: center; gap: 6px; min-height: 104px; padding: 12px 5px; text-align: center; }
.podium-details > b { color: #fff0d7; font-size: 12px; overflow-wrap: anywhere; }
.podium-details small { color: #d2becd; font-size: 9px; }
.podium-details strong { display: flex; align-items: center; flex-wrap: wrap; justify-content: center; gap: 4px; color: var(--frame); font: 700 clamp(13px, 3.6vw, 20px) Georgia, serif; }
.podium-details .ui-icon { width: 16px; height: 16px; }
.vacant { opacity: .65; }
</style>
