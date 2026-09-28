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
  seed?: string;
  animation?: 'enter' | 'approach' | 'idle' | 'listen' | 'talk' | 'think' | 'react-angry' | 'react-happy' | 'receive' | 'pay' | 'leave' | 'reach' | 'grab' | 'pour' | 'shake' | 'stir' | 'garnish' | 'serve';
}>(), {
  characterId: 'marin', expression: 'neutral', animation: 'idle', outfit: 'house', accessory: 'none'
});

const art = computed(() => CHARACTER_ART.find((item) => item.id === props.characterId) ?? CHARACTER_ART[0]!);
const look = computed(() => createCharacterLook(props.seed || props.characterId));
const castStyle = computed(() => art.value.castIndex === undefined ? {} : ({
  backgroundPosition: `${art.value.castIndex * 25}% 50%`
}));
</script>

<template>
  <div class="art-character" :class="[`role-${role}`, `expression-${expression}`, `motion-${animation}`, `body-${look.body}`, `skin-${look.skin}`, `hair-${look.hair}`, `face-${look.face}`, `outfit-${outfit}`, `accessory-${accessory}`, `glasses-${look.glasses}`, `hat-${look.hat}`, `vip-${look.vip}`, mood]" :aria-label="`${art.name}, ${expression}`">
    <img v-if="art.asset" class="bartender-art" :src="art.asset" :alt="art.name" draggable="false" />
    <div v-else class="customer-art" :style="castStyle" role="img" :aria-label="art.name"></div>
  </div>
</template>
