<script setup lang="ts">
import { computed } from 'vue';
import { bartenderAvatarFor } from '../../data/cosmetics/bartenderAvatars';
import { bartenderCostumeFor } from '../../data/cosmetics/bartenderCostumes';
import { CHARACTER_ART, GUEST_FIGURE_BOTTOM, GUEST_SEAT_LINE } from '../../data/cosmetics/artCatalog';
import { createCharacterLook } from '../../domain/customers/characterFactory';
import type { CharacterExpression } from '../../domain/dialogue/types';
import type { Mood } from '../../domain/types';

const props = withDefaults(defineProps<{
  role: 'bartender' | 'customer';
  interactive?: boolean;
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
  eyeShape?: string;
  browShape?: string;
  noseShape?: string;
  lipShape?: string;
  cheekShape?: string;
  eyeColor?: string;
  eyeliner?: string;
  eyeshadow?: string;
  lipColor?: string;
  blush?: string;
  facialHair?: string;
  outfitColor?: string;
  seed?: string;
  animation?: 'enter' | 'approach' | 'idle' | 'listen' | 'talk' | 'think' | 'react-angry' | 'react-happy' | 'receive' | 'pay' | 'leave' | 'reach' | 'grab' | 'pour' | 'shake' | 'stir' | 'garnish' | 'serve';
}>(), {
  characterId: 'marin', expression: 'neutral', animation: 'idle', outfit: 'house', accessory: 'none',
  faceStyle:'oval',hairStyle:'updo',hairColor:'espresso',bodyShape:'athletic',skinDetail:'clean',skinTone:'warm',tanLevel:'none',bust:'balanced',pose:'neutral',
  eyeShape:'almond',browShape:'soft-arch',noseShape:'soft',lipShape:'balanced',cheekShape:'soft',eyeColor:'brown',eyeliner:'none',eyeshadow:'none',lipColor:'bare',blush:'none',facialHair:'clean'
});

const art = computed(() => CHARACTER_ART.find((item) => item.id === props.characterId) ?? CHARACTER_ART[0]!);
const assetUrl = computed(() => art.value.asset ? `${import.meta.env.BASE_URL}${art.value.asset.replace(/^\//, '')}` : '');
// Guests from different sheets end at different heights in their frames; this drop puts every one on the same seat line.
const figureDrop = computed(() => props.role === 'customer' ? `${Math.max(0, GUEST_SEAT_LINE - (GUEST_FIGURE_BOTTOM[art.value.id] ?? GUEST_SEAT_LINE)).toFixed(1)}%` : '0%');
const look = computed(() => createCharacterLook(props.seed || props.characterId));
// Frame proportions (sheet width / columns ÷ sheet height / rows) of the customer sheets.
const FRAME_RATIO: Record<string, number> = {
  'extended-seated-cast-v2':(1568 / 5) / (1003 / 2),'extended-seated-cast-2-v2':(1568 / 5) / (1003 / 2),'velvet-hour-seated-cast-v2':(2122 / 5) / 741
};
const sheetName = (sheet?: string) => (sheet ?? '/velvet-hour-seated-cast-v2.webp').split('/').pop()!.replace(/\.(?:png|webp)$/, '');
const spriteStyle = (sheet: string, columns: number, rows: number, index: number, frameRatio?: number) => ({
  backgroundImage:`url('${sheet}')`,
  backgroundSize:`${columns * 100}% ${rows * 100}%`,
  backgroundPosition:`${columns > 1 ? (index % columns) / (columns - 1) * 100 : 50}% ${rows > 1 ? Math.floor(index / columns) / (rows - 1) * 100 : 50}%`,
  '--frame-ratio':String(frameRatio ?? .6)
});
const castStyle = computed(() => {
  const costume = props.role === 'bartender' ? bartenderCostumeFor(art.value.id, props.outfit) : undefined;
  if (costume) return spriteStyle(costume.sheet, costume.columns, costume.rows, costume.index, costume.frameRatio);
  const columns = art.value.columns ?? 5;
  const rows = art.value.rows ?? 1;
  const special = props.outfit.startsWith('special-');
  if (props.role === 'bartender' && special) {
    const specialRows = art.value.id === 'noa'
      ? { 'special-gala':[0,0], 'special-cyberpunk':[0,1], 'special-steampunk':[0,2], 'special-post-apocalypse':[1,0], 'special-historical':[1,1], 'special-fantasy':[1,2] } as Record<string,[number,number]>
      : { 'special-cyberpunk':[0,0], 'special-steampunk':[0,1], 'special-post-apocalypse':[0,2], 'special-historical':[1,0], 'special-fantasy':[1,1], 'special-masquerade':[1,2], 'special-gala':[1,2] } as Record<string,[number,number]>;
    const [sheetIndex,row] = specialRows[props.outfit] ?? [0,0];
    const sheet = art.value.specialSheets?.[sheetIndex] ?? art.value.sheet ?? '';
    return spriteStyle(sheet, 1, 3, row, 316 / 552);
  }
  const outfitRow = Math.max(0,['vest','shirt','apron'].indexOf(props.outfit));
  const avatar = props.role === 'bartender' ? bartenderAvatarFor(art.value.id, props.hairStyle) : undefined;
  const index = props.role === 'bartender' ? outfitRow * columns + (avatar?.column ?? 0) : art.value.castIndex ?? 0;
  const sheet = avatar?.sheet ?? art.value.sheet ?? '/assets/characters/customers/velvet-hour-seated-cast-v2.webp';
  return spriteStyle(sheet, columns, rows, index, avatar?.frameRatio ?? FRAME_RATIO[sheetName(sheet)] ?? .6);
});
</script>

<template>
  <div class="art-character" :style="{ '--figure-drop': figureDrop }" :class="[`role-${role}`, `character-${characterId}`, `expression-${expression}`, `motion-${animation}`, `body-${look.body}`, `skin-${look.skin}`, `hair-${look.hair}`, `face-${look.face}`, `outfit-${outfit}`, `accessory-${accessory}`, `glasses-${look.glasses}`, `hat-${look.hat}`, `vip-${look.vip}`, `custom-pose-${pose}`, mood]" :aria-label="`${art.name}, ${expression}`">
    <Bartender3D v-if="USE_3D_BARTENDER && role === 'bartender' && (characterId === 'noa' || characterId === 'leo') && !outfit.startsWith('special-') && !modelFailed" v-bind="props" :key="characterId" @error="modelFailed = true" />
    <img v-else-if="art.asset" class="bartender-art" :src="assetUrl" :alt="art.name" draggable="false" />
    <div v-else-if="role === 'customer'" class="character-sprite customer-art" :style="castStyle" role="img" :aria-label="art.name"></div>
    <div v-else class="character-composite" role="img" :aria-label="art.name">
      <div class="character-sprite wardrobe-art" :style="castStyle"></div>
    </div>
  </div>
</template>
