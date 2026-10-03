<script setup lang="ts">
import UiIcon from '../ui/UiIcon.vue';
import { computed, ref } from 'vue';
import { INTERIORS, interiorStyle, type InteriorId } from '../../data/cosmetics/bars';
import { bartenderCostumesFor } from '../../data/cosmetics/bartenderCostumes';
import { interiorForStyle } from '../../data/cosmetics/styleSources';
import { interiorOrigin, styleLabel, styleOrigin } from '../../domain/styleInfo';
import { canUseCosmetic } from '../../domain/cosmetics';
import { useGameStore } from '../../stores/game';
import CharacterModel from '../characters/CharacterModel.vue';
import CrystalAmount from '../ui/CrystalAmount.vue';
import ModalDialog from '../ui/ModalDialog.vue';
import UiButton from '../ui/UiButton.vue';

// Try a background and a bartender style together before owning them. Nothing here changes the bar until the
// player buys, or applies something they already own.
const props = defineProps<{ character: 'noa' | 'leo'; interior?: string; outfit?: string }>();
const emit = defineEmits<{ close: [] }>();
const game = useGameStore();
const character = ref<'noa' | 'leo'>(props.character);
const interior = ref<string>(props.interior ?? game.decor.interior);
const outfit = ref<string>(props.outfit ?? game.decor.bartender);

const everyday = ['vest', 'shirt', 'apron'];
const outfits = computed(() => [
  ...everyday.map((value) => ({ value, label: value === 'vest' ? 'Burgundy vest' : value === 'shirt' ? 'Shirt' : 'Apron' })),
  ...bartenderCostumesFor(character.value)
]);
const owns = (value: string) => canUseCosmetic(game.ownedCosmeticIds, 'bartender', value, character.value);
function setCharacter(next: 'noa' | 'leo') { character.value = next; outfit.value = everyday[0]!; }

const styleOwned = computed(() => owns(outfit.value));
const interiorOwned = computed(() => game.ownedInteriorIds.includes(interior.value));
const sameCharacter = computed(() => character.value === (game.decor.bartenderCharacter ?? 'noa'));
const outfitInfo = computed(() => styleOrigin(character.value, outfit.value));
const interiorInfo = computed(() => interiorOrigin(interior.value));
const outfitId = computed(() => `bartender:${outfit.value}:${character.value}`);
const interiorName = computed(() => INTERIORS.find((item) => item.id === interior.value)?.name ?? '');
// Pairing: the one background a style comes with, and the one style a background comes with.
const pairedInterior = computed(() => interiorForStyle(character.value, outfit.value));
const pairedInteriorName = computed(() => INTERIORS.find((item) => item.id === pairedInterior.value)?.name ?? '');
const canBuyInterior = computed(() => !interiorOwned.value && !interiorInfo.value.event && interiorInfo.value.price > 0);
const canBuyStyle = computed(() => !styleOwned.value && outfitInfo.value.source === 'shop');
const canApply = computed(() => interiorOwned.value && styleOwned.value && sameCharacter.value);

function apply() {
  game.decor.bartender = outfit.value as typeof game.decor.bartender;
  void game.chooseInterior(interior.value);
  emit('close');
}
</script>

<template>
  <ModalDialog title="Preview" eyebrow="TRY BEFORE YOU OWN" width="760px" @close="emit('close')">
    <div class="preview-stage" :style="interiorStyle(interior as InteriorId)" aria-label="Preview of the background and style together">
      <CharacterModel role="bartender" :character-id="character" :outfit="outfit"
        :hair-style="sameCharacter ? game.decor.hairStyle : undefined" :hair-color="sameCharacter ? game.decor.hairColor : undefined" />
    </div>
    <div class="preview-info" role="status">
      <p><b>{{ styleLabel(character, outfit) }}</b> · <span :class="styleOwned ? 'own' : 'locked'">{{ styleOwned ? 'You own it' : 'Not owned' }}</span><br /><small>{{ outfitInfo.how }}</small></p>
      <p><b>{{ interiorName }}</b> · <span :class="interiorOwned ? 'own' : 'locked'">{{ interiorOwned ? 'You own it' : 'Not owned' }}</span><br /><small>{{ interiorInfo.how }}</small></p>
      <p v-if="outfitInfo.background" class="pair">This style comes with the background “{{ outfitInfo.background }}”.</p>
      <p v-else-if="interiorInfo.style" class="pair">This background comes with the style “{{ interiorInfo.style }}”.</p>
      <p v-if="pairedInterior && pairedInterior !== interior" class="pair">Its own background is “{{ pairedInteriorName }}”.</p>
    </div>
    <div class="preview-pick" role="group" aria-label="Bartender">
      <UiButton size="sm" :variant="character === 'noa' ? 'solid' : 'secondary'" @click="setCharacter('noa')">Noa</UiButton>
      <UiButton size="sm" :variant="character === 'leo' ? 'solid' : 'secondary'" @click="setCharacter('leo')">Leo</UiButton>
    </div>
    <small class="preview-label">BACKGROUND</small>
    <div class="preview-strip" role="listbox" aria-label="Backgrounds">
      <button v-for="item in INTERIORS" :key="item.id" type="button" role="option" :aria-selected="interior === item.id" :class="{ active: interior === item.id, locked: !game.ownedInteriorIds.includes(item.id) }" :style="interiorStyle(item.id as InteriorId)" @click="interior = item.id"><span><UiIcon v-if="!game.ownedInteriorIds.includes(item.id)" name="lock" /> {{ item.name }}</span></button>
    </div>
    <small class="preview-label">STYLE</small>
    <div class="preview-chips" role="listbox" aria-label="Styles">
      <button v-for="item in outfits" :key="item.value" type="button" role="option" :aria-selected="outfit === item.value" :class="{ active: outfit === item.value, locked: !owns(item.value) }" @click="outfit = item.value"><UiIcon v-if="!owns(item.value)" name="lock" /> {{ item.label }}</button>
    </div>
    <template #footer>
      <UiButton v-if="canBuyStyle" variant="primary" :disabled="game.crystals < outfitInfo.price" @click="game.buyStyle(outfitId)">Buy style · <CrystalAmount :value="outfitInfo.price" /></UiButton>
      <UiButton v-if="canBuyInterior" variant="primary" :disabled="game.crystals < interiorInfo.price" @click="game.buyInterior(interior)">Buy background · <CrystalAmount :value="interiorInfo.price" /></UiButton>
      <UiButton v-if="canApply" variant="solid" @click="apply">Use this look</UiButton>
      <UiButton variant="secondary" @click="emit('close')">Close</UiButton>
    </template>
  </ModalDialog>
</template>

<style>
.preview-stage { position: relative; height: clamp(240px, 42vh, 380px); border-radius: 14px; overflow: hidden; border: 1px solid #d8aa5755; }
.preview-stage .art-character { position: absolute !important; inset: auto auto 0 50% !important; transform: translateX(-50%); width: auto !important; height: 92% !important; aspect-ratio: auto !important; }
.preview-stage .bartender-art { height: 100%; width: auto; object-fit: contain; }
.preview-info { display: grid; gap: 6px; margin: 10px 0; font-size: 13px; }
.preview-info p { margin: 0; }
.preview-info .own { color: #7fd6a2; }
.preview-info .locked { color: #e4b35c; }
.preview-info .pair { color: #c9d5e6; }
.preview-pick { display: flex; gap: 8px; margin: 6px 0; }
.preview-label { display: block; margin: 10px 0 6px; letter-spacing: .08em; }
.preview-strip { display: flex; gap: 8px; overflow-x: auto; padding-bottom: 6px; scroll-snap-type: x proximity; }
.preview-strip button { flex: 0 0 112px; height: 64px; border: 2px solid transparent; border-radius: 10px; color: #fff; text-align: left; padding: 6px; font-size: 11px; font-weight: 700; scroll-snap-align: start; cursor: pointer; text-shadow: 0 1px 4px #000; }
.preview-strip button.active, .preview-chips button.active { border-color: #e4b35c; }
.preview-strip button.locked { filter: saturate(.6); }
.preview-chips { display: flex; flex-wrap: wrap; gap: 6px; max-height: 150px; overflow-y: auto; }
.preview-chips button { min-height: 34px; padding: 0 12px; border: 1px solid #43536b; border-radius: 999px; background: #0c1421; color: #e8e2d8; font-size: 12.5px; cursor: pointer; }
.preview-chips button.locked { opacity: .75; }
</style>
