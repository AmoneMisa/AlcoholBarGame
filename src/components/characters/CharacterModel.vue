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
  bust?: string;
  pose?: string;
  makeup?: string;
  seed?: string;
  animation?: 'enter' | 'approach' | 'idle' | 'listen' | 'talk' | 'think' | 'react-angry' | 'react-happy' | 'receive' | 'pay' | 'leave' | 'reach' | 'grab' | 'pour' | 'shake' | 'stir' | 'garnish' | 'serve';
}>(), {
  characterId: 'marin', expression: 'neutral', animation: 'idle', outfit: 'house', accessory: 'none',
  faceStyle:'classic',hairStyle:'updo',hairColor:'espresso',bodyShape:'athletic',skinDetail:'clean',bust:'balanced',pose:'neutral',makeup:'none'
});

const art = computed(() => CHARACTER_ART.find((item) => item.id === props.characterId) ?? CHARACTER_ART[0]!);
const look = computed(() => createCharacterLook(props.seed || props.characterId));
// Frame proportions (sheet width / columns ÷ sheet height / rows) of the customer sheets.
const FRAME_RATIO: Record<string, number> = { 'extended-cast': (1568 / 5) / (1003 / 2), 'extended-cast-2': (1568 / 5) / (1003 / 2), 'velvet-hour-cast': (2122 / 5) / 741 };
const sheetName = (sheet?: string) => (sheet ?? '/velvet-hour-cast.png').split('/').pop()!.replace(/\.png$/, '');
const castStyle = computed(() => {
  const columns = art.value.columns ?? 5;
  const rows = art.value.rows ?? 1;
  const index = props.role === 'bartender' ? Math.max(0,['vest','shirt','apron'].indexOf(props.outfit)) : art.value.castIndex ?? 0;
  return {
    backgroundImage:`url('${art.value.sheet ?? '/assets/characters/customers/velvet-hour-cast.png'}')`,
    backgroundSize:`${columns * 100}% ${rows * 100}%`,
    backgroundPosition:`${columns > 1 ? (index % columns) / (columns - 1) * 100 : 50}% ${rows > 1 ? Math.floor(index / columns) / (rows - 1) * 100 : 50}%`,
    // One frame's width / height, so the portrait is never stretched to its box.
    '--frame-ratio':String(FRAME_RATIO[sheetName(art.value.sheet)] ?? .6)
  };
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
const customStyle = computed<Record<string,string>>(() => {
  const hair = { espresso:'#2a1712',black:'#100e12',chestnut:'#5b2d1f',copper:'#ad4f2b',blonde:'#d4af6d',platinum:'#e5ddce',red:'#8e1e26',blue:'#224f87',pink:'#9d3d72' }[props.hairColor] ?? '#2a1712';
  const scale = { slim:'.92',athletic:'.98',curvy:'1.04',muscular:'1.07',broad:'1.1' }[props.bodyShape] ?? '1';
  const male = art.value.presentation === 'male';
  const pose = (male ? {
    neutral:['0deg','0%','0%'],confident:['0deg','0%','-1%'],relaxed:['0deg','0%','0%'],lean:['1deg','1%','0%'],hip:['0deg','0%','0%'],crossed:['0deg','0%','0%']
  } : {
    neutral:['0deg','0%','0%'],confident:['0deg','0%','-1%'],relaxed:['-1deg','-1%','0%'],lean:['2deg','3%','0%'],hip:['-1.5deg','-2%','0%'],crossed:['.5deg','0%','0%']
  })[props.pose] ?? ['0deg','0%','0%'];
  return { '--hair-custom':hair,'--body-custom-scale':scale,'--pose-rotate':pose[0]!,'--pose-x':pose[1]!,'--pose-y':pose[2]! };
});
</script>

<template>
  <div class="art-character" :class="[`role-${role}`, `character-${characterId}`, `expression-${expression}`, `motion-${animation}`, `body-${look.body}`, `skin-${look.skin}`, `hair-${look.hair}`, `face-${look.face}`, `outfit-${outfit}`, `accessory-${accessory}`, `glasses-${look.glasses}`, `hat-${look.hat}`, `vip-${look.vip}`, `custom-face-${faceStyle}`, `custom-hair-${hairStyle}`, `custom-body-${bodyShape}`, `custom-skin-${skinDetail}`, `custom-bust-${bust}`, `custom-pose-${pose}`, `custom-makeup-${makeup}`, mood]" :style="role === 'bartender' ? customStyle : undefined" :aria-label="`${art.name}, ${expression}`">
    <img v-if="art.asset" class="bartender-art" :src="art.asset" :alt="art.name" draggable="false" />
    <div v-else class="character-sprite" :class="role === 'bartender' ? 'wardrobe-art' : 'customer-art'" :style="castStyle" role="img" :aria-label="art.name">
      <!-- Hair colour: a per-pixel hair mask on the same sprite frame, so the face and skin are never tinted. -->
      <span v-if="role === 'bartender' && hairMask" class="sprite-hair-tint" :style="hairMaskStyle"></span>
    </div>
    <div v-if="role === 'bartender'" class="bartender-customization" aria-hidden="true"><span class="custom-face-detail"></span><span class="custom-skin-detail"></span><span class="custom-makeup-detail"></span><span class="custom-body-detail"></span></div>
  </div>
</template>
