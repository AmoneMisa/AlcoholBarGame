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
const castStyle = computed(() => {
  const columns = art.value.columns ?? 5;
  const rows = art.value.rows ?? 1;
  const index = props.role === 'bartender' ? Math.max(0,['vest','shirt','apron'].indexOf(props.outfit)) : art.value.castIndex ?? 0;
  return {
    backgroundImage:`url('${art.value.sheet ?? '/assets/characters/customers/velvet-hour-cast.png'}')`,
    backgroundSize:`${columns * 100}% ${rows * 100}%`,
    backgroundPosition:`${columns > 1 ? (index % columns) / (columns - 1) * 100 : 50}% ${rows > 1 ? Math.floor(index / columns) / (rows - 1) * 100 : 50}%`
  };
});
const customStyle = computed<Record<string,string>>(() => {
  const hair = { espresso:'#2a1712',black:'#100e12',chestnut:'#5b2d1f',copper:'#ad4f2b',blonde:'#d4af6d',platinum:'#e5ddce',red:'#8e1e26',blue:'#224f87',pink:'#9d3d72' }[props.hairColor] ?? '#2a1712';
  const scale = { slim:'.92',athletic:'.98',curvy:'1.04',muscular:'1.07',broad:'1.1' }[props.bodyShape] ?? '1';
  const pose = {
    neutral:['0deg','0%','0%'],confident:['0deg','0%','-1%'],relaxed:['-1.5deg','-2%','1%'],lean:['2.5deg','4%','0%'],hip:['-2deg','-3%','0%'],crossed:['1deg','1%','0%']
  }[props.pose] ?? ['0deg','0%','0%'];
  return { '--hair-custom':hair,'--body-custom-scale':scale,'--pose-rotate':pose[0]!,'--pose-x':pose[1]!,'--pose-y':pose[2]! };
});
</script>

<template>
  <div class="art-character" :class="[`role-${role}`, `character-${characterId}`, `expression-${expression}`, `motion-${animation}`, `body-${look.body}`, `skin-${look.skin}`, `hair-${look.hair}`, `face-${look.face}`, `outfit-${outfit}`, `accessory-${accessory}`, `glasses-${look.glasses}`, `hat-${look.hat}`, `vip-${look.vip}`, `custom-face-${faceStyle}`, `custom-hair-${hairStyle}`, `custom-body-${bodyShape}`, `custom-skin-${skinDetail}`, `custom-bust-${bust}`, `custom-pose-${pose}`, `custom-makeup-${makeup}`, mood]" :style="role === 'bartender' ? customStyle : undefined" :aria-label="`${art.name}, ${expression}`">
    <img v-if="art.asset" class="bartender-art" :src="art.asset" :alt="art.name" draggable="false" />
    <div v-else class="character-sprite" :class="role === 'bartender' ? 'wardrobe-art' : 'customer-art'" :style="castStyle" role="img" :aria-label="art.name"></div>
    <div v-if="role === 'bartender'" class="bartender-customization" aria-hidden="true"><span class="custom-hair-tint"></span><span class="custom-face-detail"></span><span class="custom-skin-detail"></span><span class="custom-makeup-detail"></span><span class="custom-body-detail"></span></div>
  </div>
</template>
