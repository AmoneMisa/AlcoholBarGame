<script setup lang="ts">
import { computed } from 'vue';
import type { RewardLine } from '../../domain/rewards';
import { COSMETICS } from '../../domain/cosmetics';
import { INTERIORS } from '../../data/cosmetics/bars';
import { consumableDef, equipmentDef } from '../../domain/loot';
import { KEEPSAKES } from '../../domain/companions';
import CharacterModel from '../characters/CharacterModel.vue';
import ItemArt from './ItemArt.vue';
import { thumbnailArtwork } from '../../domain/optimizedArtwork';
const props = withDefaults(defineProps<{ line: RewardLine; fragments?: boolean; compact?: boolean }>(), {fragments:undefined});
const artSize = computed(() => props.compact ? 44 : 96);
const puzzle = computed(() => props.compact ? thumbnailArtwork(`${import.meta.env.BASE_URL}assets/ui/fragment-puzzle-painted-v1.webp`, 96, import.meta.env.BASE_URL) : `${import.meta.env.BASE_URL}assets/ui/fragment-puzzle-painted-v1.webp`);
const isFragment = computed(()=> props.fragments ?? ((props.line.kind==='material' && /^(style:|shard:)/.test(props.line.id ?? '')) || /\b(fragments|shards)\b/i.test(props.line.text)));
const style = computed(() => COSMETICS.find(item => item.id === props.line.id?.replace(/^style:/,'')));
const background = computed(() => INTERIORS.find(item => item.id === props.line.id?.replace(/^style:/,'').replace(/^background:/,'')));
const hasFragmentTarget = computed(() => !!style.value || !!background.value || props.line.kind==='companion' || !!equipmentDef(props.line.id?.replace(/^shard:/,'') ?? ''));
</script>
<template>
  <div class="reward-art">
    <div v-if="isFragment" class="fragment-art">
      <img class="fragment-puzzle" :src="puzzle" alt="" width="300" height="300" loading="lazy" decoding="async" aria-hidden="true" />
      <span v-if="hasFragmentTarget" class="fragment-preview"><RewardArt :line="line" :fragments="false" compact /></span>
    </div>
    <CharacterModel v-else-if="style" role="bartender" :art-size="compact ? 128 : 512" :character-id="style.character ?? 'noa'" v-bind="{ [style.key === 'bartender' ? 'outfit' : style.key === 'face' ? 'faceStyle' : style.key]: style.value }" animation="idle" />
    <CharacterModel v-else-if="line.kind === 'companion' && line.id" role="customer" :character-id="line.id" animation="idle" />
    <img v-else-if="background" :src="compact ? thumbnailArtwork(background.asset,192) : background.asset" loading="lazy" decoding="async" alt="" />
    <ItemArt v-else-if="['coins','tip','crystals','xp'].includes(line.kind)" kind="resource" :id="line.kind==='tip' ? 'coins' : line.kind" :fallback="line.kind==='crystals' ? '💎' : line.kind==='xp' ? '⭐' : '🪙'" :size="artSize" />
    <ItemArt v-else-if="line.kind==='material' && ['parts','skinShards','stylePieces'].includes(line.id ?? '')" kind="shard" :id="line.id==='skinShards' ? 'skin' : line.id==='stylePieces' ? 'style' : 'parts'" fallback="🧩" :size="artSize" />
    <ItemArt v-else-if="line.kind === 'item' && line.id" kind="item" :id="line.id" :fallback="consumableDef(line.id)?.icon ?? '🎁'" :size="artSize" />
    <ItemArt v-else-if="line.kind === 'box' && line.id" kind="box" :id="line.id" fallback="🎁" :size="artSize" />
    <ItemArt v-else-if="line.kind === 'material' && line.id && !['parts', 'skinShards', 'stylePieces', 'circle'].includes(line.id)" kind="equipment" :id="line.id.replace('shard:', '')" fallback="⚙️" :size="artSize" />
    <ItemArt v-else-if="line.kind==='prestige'" kind="resource" id="prestige" fallback="🏅" :size="artSize" />
    <ItemArt v-else-if="line.kind==='level'" kind="resource" id="xp" fallback="⭐" :size="artSize" />
    <ItemArt v-else-if="line.kind==='recipe' || line.kind==='card'" kind="item" id="scroll" fallback="📜" :size="artSize" />
    <ItemArt v-else-if="line.kind==='gift' && line.id==='supplies'" kind="resource" id="supplies" fallback="🧺" :size="artSize" />
    <ItemArt v-else-if="line.kind==='gift' && line.id && KEEPSAKES.some(item=>item.id===line.id)" kind="keepsake" :id="line.id" fallback="🎁" :size="artSize" />
    <ItemArt v-else-if="line.kind==='material' && line.id==='circle'" kind="shard" id="circle" fallback="🧩" :size="artSize" />
    <ItemArt v-else kind="box" id="choice" fallback="🎁" :size="artSize" />
  </div>
</template>
<style>
.fragment-art {position:relative;width:100%;height:100%;max-width:240px;min-height:0;aspect-ratio:1}
.fragment-puzzle {position:absolute;inset:0;width:100%;height:100%;filter:drop-shadow(0 3px 3px #0008)}
.fragment-puzzle {object-fit:contain;animation:fragment-reveal .25s ease-out both}
@keyframes fragment-reveal {from {opacity:0;transform:scale(.94)} to {opacity:1;transform:scale(1)}}
@media(prefers-reduced-motion:reduce) {.fragment-puzzle {animation:none}}
.fragment-preview {position:absolute;right:2%;bottom:2%;width:42%;height:42%;padding:2px;overflow:hidden;border:1px solid #dbbd7b;border-radius:4px;background:#132034;box-shadow:0 2px 5px #0009}
.fragment-preview .reward-art {height:100%;width:100%}
.fragment-preview .item-art {width:90%!important;height:90%!important}
.reward-art { display: grid; place-items: center; width: 100%; height: 100%; min-height: 0; }
.reward-art > .art-character { width: auto; height: 100%; max-width: 100%; aspect-ratio: .572; pointer-events: none; }
.reward-art > img { width: 100%; height: 100%; object-fit: contain; border-radius: 8px; }
.reward-art > .ui-icon { width: 58%; height: 58%; color: #ffdb86; filter: drop-shadow(0 4px 10px #e8b85a88); }
.reward-art > .item-art { width:96px; height:96px; max-width: 100%; max-height: 100%; }
</style>
