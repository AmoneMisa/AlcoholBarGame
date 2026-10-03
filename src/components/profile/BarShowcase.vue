<script setup lang="ts">
import { computed } from 'vue';
import { INTERIORS, interiorStyle, type InteriorId } from '../../data/cosmetics/bars';
import CharacterModel from '../characters/CharacterModel.vue';

// Somebody else's bar as one picture: their background, their bartender in their style, and the bar's name. Used for a
// friend's visit and for a look at a bar from the leaderboard.
const props = defineProps<{ bar?: Record<string, string>; name: string }>();
const background = computed(() => interiorStyle(((INTERIORS.some((item) => item.id === props.bar?.interior) ? props.bar?.interior : INTERIORS[0]!.id) ?? INTERIORS[0]!.id) as InteriorId));
</script>

<template>
  <div class="bar-showcase" :style="background">
    <CharacterModel role="bartender" :character-id="bar?.bartenderCharacter ?? 'noa'" :outfit="bar?.bartender" :face-style="bar?.face" :hair-style="bar?.hairStyle" :hair-color="bar?.hairColor" :body-shape="bar?.bodyShape" :skin-detail="bar?.skinDetail" :skin-tone="bar?.skinTone" :pose="bar?.pose" :eye-shape="bar?.eyeShape" :brow-shape="bar?.browShape" :nose-shape="bar?.noseShape" :lip-shape="bar?.lipShape" :cheek-shape="bar?.cheekShape" :eye-color="bar?.eyeColor" :eyeliner="bar?.eyeliner" :eyeshadow="bar?.eyeshadow" :lip-color="bar?.lipColor" :blush="bar?.blush" :facial-hair="bar?.facialHair" :outfit-color="bar?.outfitColor" animation="idle" />
    <span class="ribbon">{{ bar?.name || name }}</span>
    <slot />
  </div>
</template>

<style>
.bar-showcase { position: relative; height: clamp(220px, 46vw, 340px); overflow: hidden; border: 1px solid #4a5c75; border-radius: 12px; }
.bar-showcase .art-character { position: absolute; right: 6%; bottom: -4%; width: auto; height: 96%; aspect-ratio: .572; }
.bar-showcase .ribbon { position: absolute; left: 10px; bottom: 10px; max-width: calc(100% - 20px); padding: 5px 10px; border: 1px solid #d8a34e; border-radius: 6px; background: #1c1420e8; color: #ffe2a8; font: 700 13px Georgia, serif; }
</style>
