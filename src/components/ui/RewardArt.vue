<script setup lang="ts">
import { computed } from 'vue';
import type { RewardLine } from '../../domain/rewards';
import { COSMETICS } from '../../domain/cosmetics';
import { INTERIORS } from '../../data/cosmetics/bars';
import { consumableDef } from '../../domain/loot';
import CharacterModel from '../characters/CharacterModel.vue';
import ItemArt from './ItemArt.vue';
import UiIcon from './UiIcon.vue';
const props = defineProps<{ line: RewardLine }>();
const style = computed(() => COSMETICS.find(item => item.id === props.line.id));
const background = computed(() => INTERIORS.find(item => item.id === props.line.id));
const icons: Record<string, string> = { coins: 'coin', tip: 'coin', crystals: 'crystal', xp: 'star', level: 'star', prestige: 'trophy', recipe: 'book', card: 'book', style: 'brush', material: 'crystal' };
</script>
<template>
  <div class="reward-art">
    <CharacterModel v-if="style" role="bartender" :character-id="style.character ?? 'noa'" v-bind="{ [style.key === 'bartender' ? 'outfit' : style.key === 'face' ? 'faceStyle' : style.key]: style.value }" animation="idle" />
    <CharacterModel v-else-if="line.kind === 'companion' && line.id" role="customer" :character-id="line.id" animation="idle" />
    <img v-else-if="background" :src="background.asset" alt="" />
    <ItemArt v-else-if="line.kind === 'item' && line.id" kind="item" :id="line.id" :fallback="consumableDef(line.id)?.icon ?? '🎁'" :size="96" />
    <ItemArt v-else-if="line.kind === 'box' && line.id" kind="box" :id="line.id" fallback="🎁" :size="96" />
    <ItemArt v-else-if="line.kind === 'material' && line.id && !['parts', 'skinShards', 'stylePieces'].includes(line.id)" kind="equipment" :id="line.id.replace('shard:', '')" fallback="⚙️" :size="96" />
    <UiIcon v-else :name="icons[line.kind] ?? 'gift'" />
  </div>
</template>
<style>
.reward-art { display: grid; place-items: center; width: 100%; height: 100%; min-height: 0; }
.reward-art > .art-character { width: auto; height: 100%; max-width: 100%; aspect-ratio: .572; pointer-events: none; }
.reward-art > img { width: 100%; height: 100%; object-fit: contain; border-radius: 8px; }
.reward-art > .ui-icon { width: 58%; height: 58%; color: #ffdb86; filter: drop-shadow(0 4px 10px #e8b85a88); }
.reward-art > .item-art { max-width: 100%; max-height: 100%; }
</style>
