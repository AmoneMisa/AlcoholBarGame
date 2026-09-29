<script setup lang="ts">
import { computed } from 'vue';
import { CHARACTER_ART } from '../../data/cosmetics/artCatalog';
import { createCharacterLook } from '../../domain/customers/characterFactory';
import type { CharacterExpression } from '../../domain/dialogue/types';
import type { Mood } from '../../domain/types';

const props = withDefaults(defineProps<{
  role: 'bartender' | 'customer';
  characterId?: string;
  mood?: Mood;
  expression?: CharacterExpression;
  outfit?: string;
  accessory?: string;
  faceStyle?: string;
  hairStyle?: string;
  hairColor?: string;
  bodyShape?: string;
  skinDetail?: string;
  skinTone?: string;
  tanLevel?: string;
  bust?: string;
  pose?: string;
  makeup?: string;
  seed?: string;
  animation?: 'enter' | 'approach' | 'idle' | 'listen' | 'talk' | 'think' | 'react-angry' | 'react-happy' | 'receive' | 'pay' | 'leave' | 'reach' | 'grab' | 'pour' | 'shake' | 'stir' | 'garnish' | 'serve';
}>(), {
  characterId: 'marin', expression: 'neutral', animation: 'idle', outfit: 'house', accessory: 'none',
  faceStyle:'classic',hairStyle:'updo',hairColor:'espresso',bodyShape:'athletic',skinDetail:'clean',skinTone:'warm',tanLevel:'none',bust:'balanced',pose:'neutral',makeup:'none'
});

const art = computed(() => CHARACTER_ART.find((item) => item.id === props.characterId) ?? CHARACTER_ART[0]!);
const look = computed(() => createCharacterLook(props.seed || props.characterId));
// Frame proportions (sheet width / columns ÷ sheet height / rows) of the customer sheets.
const FRAME_RATIO: Record<string, number> = { 'extended-cast': (1568 / 5) / (1003 / 2), 'extended-cast-2': (1568 / 5) / (1003 / 2), 'velvet-hour-cast': (2122 / 5) / 741 };
const sheetName = (sheet?: string) => (sheet ?? '/velvet-hour-cast.png').split('/').pop()!.replace(/\.png$/, '');
const poseFrame = computed(() => ({ neutral:0, relaxed:0, confident:1, hip:1, working:2, lean:2, crossed:2 }[props.pose] ?? 0));
const spriteStyle = (sheet: string, columns: number, rows: number, index: number, frameRatio?: number) => ({
  backgroundImage:`url('${sheet}')`,
  backgroundSize:`${columns * 100}% ${rows * 100}%`,
  backgroundPosition:`${columns > 1 ? (index % columns) / (columns - 1) * 100 : 50}% ${rows > 1 ? Math.floor(index / columns) / (rows - 1) * 100 : 50}%`,
  '--frame-ratio':String(frameRatio ?? .6)
});
const castStyle = computed(() => {
  const columns = art.value.columns ?? 5;
  const rows = art.value.rows ?? 1;
  const outfitRow = Math.max(0,['vest','shirt','apron'].indexOf(props.outfit));
  const index = props.role === 'bartender' ? outfitRow * columns + poseFrame.value : art.value.castIndex ?? 0;
  const sheet = art.value.sheet ?? '/assets/characters/customers/velvet-hour-cast.png';
  return spriteStyle(sheet, columns, rows, index, FRAME_RATIO[sheetName(sheet)] ?? .6);
});
const baseStyle = computed(() => {
  const sheet = art.value.baseSheet ?? art.value.sheet ?? '';
  const columns = art.value.baseColumns ?? 3;
  return spriteStyle(sheet, columns, 1, poseFrame.value, .572);
});
const hairMask = computed(() => {
  const match = art.value.sheet?.match(/^(.*)-wardrobe(-v\d+)?\.png$/);
  return match ? `${match[1]}-hair-mask${match[2] ?? ''}.png` : undefined;
});
const hairMaskStyle = computed(() => {
  // noa-wardrobe.png → noa-hair-mask.png, leo-wardrobe-v5.png → leo-hair-mask-v5.png
  const mask = `url('${hairMask.value}')`;
  const { backgroundSize, backgroundPosition } = castStyle.value;
  return { maskImage: mask, WebkitMaskImage: mask, maskSize: backgroundSize, WebkitMaskSize: backgroundSize, maskPosition: backgroundPosition, WebkitMaskPosition: backgroundPosition };
});
const skinMask = computed(() => {
  const match = art.value.sheet?.match(/^(.*)-wardrobe(-v\d+)?\.png$/);
  return match ? `${match[1]}-skin-mask${match[2] ?? ''}.png` : undefined;
});
const skinMaskStyle = computed(() => {
  const mask = `url('${skinMask.value}')`;
  const { backgroundSize, backgroundPosition } = castStyle.value;
  return { maskImage:mask,WebkitMaskImage:mask,maskSize:backgroundSize,WebkitMaskSize:backgroundSize,maskPosition:backgroundPosition,WebkitMaskPosition:backgroundPosition };
});
const hairStyleAsset = computed(() => props.role === 'bartender' && props.outfit !== 'base'
  ? `/assets/characters/bartender/hair/${art.value.id}-${props.hairStyle}.webp`
  : undefined);
const hairStyleLayerStyle = computed(() => hairStyleAsset.value ? {
  '--hair-style-art':`url('${hairStyleAsset.value}')`,
  '--hair-style-mask':`url('${hairStyleAsset.value}')`
} : undefined);
const customStyle = computed<Record<string,string>>(() => {
  const hair = { espresso:'#2a1712',black:'#100e12',chestnut:'#5b2d1f',copper:'#ad4f2b',blonde:'#d4af6d',platinum:'#e5ddce',red:'#8e1e26',blue:'#224f87',pink:'#9d3d72' }[props.hairColor] ?? '#2a1712';
  const scale = { slim:'.94',athletic:'.99',curvy:'1.035',muscular:'1.055',broad:'1.075' }[props.bodyShape] ?? '1';
  const skin = { porcelain:'#f0c7b5',fair:'#dca58a',warm:'#b97858',olive:'#a36f4f',brown:'#82523d',deep:'#54362d' }[props.skinTone] ?? '#b97858';
  const tan = { none:'1', 'sun-kissed':'.88', deep:'.74' }[props.tanLevel] ?? '1';
  return { '--hair-custom':hair,'--skin-custom':skin,'--skin-tan':tan,'--body-custom-scale':scale,'--pose-rotate':'0deg','--pose-x':'0%','--pose-y':'0%','--bartender-frame-ratio':'.572' };
});
</script>

<template>
  <div class="art-character" :class="[`role-${role}`, `character-${characterId}`, `expression-${expression}`, `motion-${animation}`, `body-${look.body}`, `skin-${look.skin}`, `hair-${look.hair}`, `face-${look.face}`, `outfit-${outfit}`, `accessory-${accessory}`, `glasses-${look.glasses}`, `hat-${look.hat}`, `vip-${look.vip}`, `custom-face-${faceStyle}`, `custom-hair-${hairStyle}`, `custom-body-${bodyShape}`, `custom-skin-${skinDetail}`, `custom-bust-${bust}`, `custom-pose-${pose}`, `custom-makeup-${makeup}`, mood]" :style="role === 'bartender' ? customStyle : undefined" :aria-label="`${art.name}, ${expression}`">
    <img v-if="art.asset" class="bartender-art" :src="art.asset" :alt="art.name" draggable="false" />
    <div v-else-if="role === 'customer'" class="character-sprite customer-art" :style="castStyle" role="img" :aria-label="art.name"></div>
    <div v-else class="character-composite" :class="{ 'showing-base': outfit === 'base' }" role="img" :aria-label="art.name">
      <!-- The mannequin is its own look; under an outfit its different pose would show around the clothes. -->
      <div v-if="outfit === 'base'" class="character-sprite base-art" :style="baseStyle"></div>
      <div v-if="outfit !== 'base'" class="character-sprite wardrobe-art" :style="castStyle">
        <span v-if="skinMask" class="sprite-skin-tint" :style="skinMaskStyle"></span>
        <!-- Hair colour: a per-pixel hair mask on the same sprite frame, so the face and skin are never tinted. -->
        <span v-if="hairMask" class="sprite-hair-tint" :style="hairMaskStyle"></span>
        <span v-if="hairStyleAsset" class="sprite-hair-style" :style="hairStyleLayerStyle"></span>
        <span v-if="skinMask" class="sprite-tattoo-pattern" :style="skinMaskStyle"></span>
      </div>
    </div>
    <div v-if="role === 'bartender'" class="bartender-customization" aria-hidden="true"><span class="custom-face-detail"></span><span class="custom-skin-detail"></span><span class="custom-makeup-detail"></span><span class="custom-body-detail"></span></div>
  </div>
</template>
