<script setup lang="ts">
import { computed, onUnmounted, ref, watch } from 'vue';
import { useGameStore } from '../../stores/game';
import CloseButton from './CloseButton.vue';
import RewardList from './RewardList.vue';
import RewardArt from './RewardArt.vue';
import ModalDialog from './ModalDialog.vue';
import UiButton from './UiButton.vue';
import type { RewardLine } from '../../domain/rewards';
import { appearanceRewardOption } from '../../domain/appearanceRewards';

// Tells the player exactly what the last action gave: coins, tips, crystals, XP, recipes, gifts.
// It stays until closed or tapped away, or for a few seconds when nothing else needs reading.
const game = useGameStore();
const revealIndex = ref(-1);
const specials = computed(() => game.rewardReport?.lines.filter(line => line.id && ['style', 'background', 'companion', 'item'].includes(line.kind)) ?? []);
const current = computed(() => specials.value[revealIndex.value]);
const appearanceOption = (line:RewardLine)=>appearanceRewardOption(line,game.decor.bartenderCharacter ?? 'noa',game.ownedCosmeticIds,game.ownedInteriorIds);
const inUse = (line:RewardLine)=> {const option=appearanceOption(line);return !!option && (game.decor as unknown as Record<string,string>)[option.key]===option.value;};
function useAppearance(line:RewardLine) {const option=appearanceOption(line);if(option) game.act({type:'setDecor',key:option.key,value:option.value});}
let timer: ReturnType<typeof setTimeout> | undefined;
watch(() => game.rewardReport?.id, () => {
  clearTimeout(timer);
  revealIndex.value = -1;
  if (game.rewardReport && !game.rewardReport.celebration && !specials.value.length) timer = setTimeout(game.dismissRewards, 9000);
});
function advance() {
  if (revealIndex.value + 1 < specials.value.length) revealIndex.value++;
  else game.dismissRewards();
}
onUnmounted(() => clearTimeout(timer));
</script>

<template>
  <template v-if="game.rewardReport && !game.dailyOpen">
    <ModalDialog v-if="game.rewardReport.celebration || specials.length" :key="game.rewardReport.id" :presentation="current ? 'reveal' : 'celebration'" label="Rewards received" close-label="Close rewards" width="640px" @close="advance">
      <section v-if="current" :key="revealIndex" class="reward-reveal" :class="current.rarity ?? 'common'">
        <div class="reveal-stars" aria-hidden="true"><i v-for="n in 18" :key="n" :style="{ '--n': n }">✦</i></div>
        <UiButton variant="ghost" size="sm" class="reveal-skip" @click="game.dismissRewards()">Skip all ››</UiButton>
        <div class="reveal-halo" aria-hidden="true"></div>
        <div class="reveal-hero"><RewardArt :line="current" /></div>
        <div class="reveal-caption"><span class="reveal-new">{{ current.kind === 'item' ? 'RECEIVED' : 'NEW' }}</span><small>{{ current.rarity ?? 'common' }} · {{ current.kind }}</small><h2>{{ current.text.replace(/^New (style|background): /, '') }}</h2><div class="reward-flourish" aria-hidden="true">✧ ━ ◆ ━ ✧</div></div>
        <UiButton v-if="appearanceOption(current)" variant="solid" :disabled="inUse(current)" @click="useAppearance(current)">{{ inUse(current) ? 'In use' : appearanceOption(current)!.label }}</UiButton>
        <UiButton variant="ghost" class="reward-continue" @click="advance">{{ revealIndex + 1 < specials.length ? 'Next reward' : 'Continue' }} · {{ revealIndex + 1 }}/{{ specials.length }}</UiButton>
      </section>
      <section v-else class="reward-celebration">
        <div class="reward-flourish" aria-hidden="true">✦ ━ ◆ ━ ✦</div><h2>Congratulations!</h2>
        <p class="reward-source">{{ game.rewardReport.title }}</p>
        <div class="reward-divider"><span>Received</span></div>
        <ul class="reward-grid">
          <li v-for="(line, index) in game.rewardReport.lines" :key="index" :class="line.rarity ?? line.kind" :style="{ '--order': index }">
            <div class="reward-tile-art"><RewardArt :line="line" /><span v-if="['style', 'background', 'companion'].includes(line.kind)" class="reward-new">NEW</span></div><span>{{ line.text }}</span>
            <UiButton v-if="appearanceOption(line)" size="sm" :disabled="inUse(line)" @click="useAppearance(line)">{{ inUse(line) ? 'In use' : appearanceOption(line)!.label }}</UiButton>
          </li>
        </ul>
        <UiButton variant="ghost" class="reward-continue" @click="advance">{{ specials.length ? 'Discover your rewards ✦' : 'Continue' }}</UiButton>
      </section>
    </ModalDialog>
  <aside v-else :key="game.rewardReport.id" class="reward-popup" role="status" aria-live="polite">
    <header><b>{{ game.rewardReport.title }}</b><CloseButton label="Close reward summary" size="sm" @click="game.dismissRewards()" /></header>
    <RewardList :lines="game.rewardReport.lines" />
  </aside>
  </template>
</template>

<style>
.modal-backdrop.celebration { background: #090610c9; backdrop-filter: blur(2px); }
.celebration .modal-sheet, .reveal .modal-sheet { border: 0; background: transparent; box-shadow: none; }
.celebration .modal-head, .reveal .modal-head { justify-content: flex-end; border: 0; }
.reward-celebration { text-align: center; padding: 0 4px 12px; }
.reward-flourish { color: #f3ce85; letter-spacing: .2em; text-shadow: 0 0 14px #efaf70; }
.reward-celebration h2 { margin: 8px 0; color: #fff0c9; font: italic 700 clamp(28px, 7vw, 44px)/1.15 Georgia, serif; text-shadow: 0 2px 0 #763d32, 0 0 22px #e99668; }
.reward-source { margin: 0; color: #e5c6b4; font-size: 14px; }
.reward-divider { display: flex; align-items: center; gap: 14px; margin: 24px 0 18px; color: #e4c39a; font: 18px Georgia, serif; }
.reward-divider::before, .reward-divider::after { content: ''; height: 1px; flex: 1; background: linear-gradient(90deg, transparent, #e9c18c, transparent); }
.reward-grid { display: flex; flex-wrap: wrap; justify-content: center; gap: 22px 8px; margin: 0; padding: 0; list-style: none; }
.reward-grid li { --glow: #e4ae56; width: calc((100% - 16px)/3); min-width: 0; display: grid; align-content: start; justify-items: center; gap: 8px; animation: reward-bloom .5s both; animation-delay: calc(var(--order) * 65ms); }
.reward-grid li.rare, .reward-grid li.crystals { --glow: #71e5f8; }
.reward-grid li.legendary, .reward-grid li.companion { --glow: #d097fa; }
.reward-tile-art { position: relative; width: min(100%, 120px); height: 108px; isolation: isolate; }
.reward-tile-art::before { content: ''; position: absolute; z-index: -1; inset: -8px; border-radius: 50%; background: radial-gradient(circle, color-mix(in srgb, var(--glow) 65%, transparent), transparent 68%); }
.reward-grid li > span { color: #fff0d3; font-size: 13px; line-height: 1.35; overflow-wrap: anywhere; text-shadow: 0 2px 4px #000; }
.reward-new { position: absolute; right: 0; top: 0; padding: 4px; border: 1px solid #f9d897; border-radius: 50%; background: #d15b71; color: #fff3ba; font: italic 13px Georgia, serif; box-shadow: 0 0 14px #f7ad78; }
.reward-continue { display: block; margin: 28px auto 0; min-height: 44px; color: #f4dfb7; }
.modal-backdrop.reveal { background:#0b1320 var(--ui-panel-art) center / cover no-repeat; backdrop-filter: none; }
.reveal .modal-sheet { width: min(720px, 100%) !important; }
.reveal .modal-body { padding-top: 0; }
.reward-reveal { position: relative; isolation: isolate; display: grid; justify-items: center; text-align: center; overflow: hidden; }
.reveal-skip { position: absolute; right: 0; top: 0; z-index: 3; }
.reveal-hero { width: 100%; height: clamp(240px, 48dvh, 570px); animation: reward-bloom .85s both; filter: drop-shadow(0 0 26px #b981d577); }
.reveal-halo { position: absolute; z-index: -1; top: 12%; width: 85%; aspect-ratio: 1; border-radius: 50%; background: repeating-conic-gradient(from 0deg, #b57ff720 0deg 2deg, transparent 2deg 12deg); mask-image: radial-gradient(circle, transparent 16%, #000 40%, transparent 70%); animation: reward-orbit 40s linear infinite; }
.reveal-caption { z-index: 1; margin-top: 8px; }
.reveal-new { display: block; width: 65px; margin: 0 auto 12px; padding: 8px 4px; border: 1px solid #e6bf76; border-radius: 50%; color: #ffde91; font: italic 14px Georgia, serif; box-shadow: 0 0 20px #dba65366; }
.reveal-caption small { color: #d7bce7; font-size: 13px; text-transform: uppercase; letter-spacing: .2em; }
.reveal-caption h2 { margin: 10px 0; color: #ffdf91; font: 700 clamp(26px, 7vw, 42px)/1.1 Georgia, serif; text-shadow: 0 0 20px #b88269; }
.reveal-stars { position: absolute; inset: 0; pointer-events: none; z-index: -1; }
.reveal-stars i { position: absolute; left: calc(mod(var(--n) * 37, 100) * 1%); top: calc(mod(var(--n) * 23, 100) * 1%); color: #d7acf3; font-size: 13px; font-style: normal; animation: reward-spark 3s ease-in-out infinite alternate; animation-delay: calc(var(--n) * -230ms); }
@keyframes reward-bloom { from { opacity: 0; transform: translateY(18px) scale(.88); } to { opacity: 1; transform: none; } }
@keyframes reward-orbit { to { transform: rotate(360deg); } }
@keyframes reward-spark { from { opacity: .15; transform: translateY(6px) scale(.5); } to { opacity: .9; transform: translateY(-6px) scale(1.2); } }
@media (prefers-reduced-motion: reduce) { .reward-grid li, .reveal-hero, .reveal-halo, .reveal-stars i { animation: none; } }
@media (max-width: 360px) { .reward-tile-art { height: 88px; } .reward-grid li > span { font-size: 13px; } }
.reward-popup { position: fixed; z-index: 140; left: 50%; bottom: calc(96px + env(safe-area-inset-bottom, 0px)); display: grid; gap: 8px; width: min(340px, calc(100vw - 24px)); padding: 10px 12px 12px; border: 1px solid #d2a24e; border-radius: 14px; background:#0b1320 var(--ui-dialog-art) center / cover no-repeat; box-shadow: 0 18px 50px #000d; transform: translateX(-50%); animation: reward-in .24s ease-out; }
.reward-popup > header { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
.reward-popup > header b { color: var(--gold, #e8b85a); font: 700 15px Georgia, serif; }
@keyframes reward-in { from { opacity: 0; transform: translate(-50%, 14px); } }
</style>
