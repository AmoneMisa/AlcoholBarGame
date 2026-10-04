<script setup lang="ts">
import AppearancePicker from './AppearancePicker.vue';
import { acquisitionOffer } from '../../domain/uiOffers';
import { computed, ref } from 'vue';
import { INTERIORS, interiorStyle, type InteriorId } from '../../data/cosmetics/bars';
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
const catalogue = ref<'background'|'style'>(props.outfit && props.outfit!==game.decor.bartender ? 'style' : 'background');

const everyday = ['vest', 'shirt', 'apron'];

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
      <p><b>{{ styleLabel(character, outfit) }}</b> · <span :class="styleOwned ? 'own' : 'locked'">{{ styleOwned ? 'You own it' : 'Not owned' }}</span><br /><small v-if="!styleOwned">{{ outfitInfo.how }}</small></p>
      <p><b>{{ interiorName }}</b> · <span :class="interiorOwned ? 'own' : 'locked'">{{ interiorOwned ? 'You own it' : 'Not owned' }}</span><br /><small v-if="!interiorOwned">{{ interiorInfo.how }}</small></p>
      <p v-if="outfitInfo.background" class="pair">This style comes with the background “{{ outfitInfo.background }}”.</p>
      <p v-else-if="interiorInfo.style" class="pair">This background comes with the style “{{ interiorInfo.style }}”.</p>
      <p v-if="pairedInterior && pairedInterior !== interior" class="pair">Its own background is “{{ pairedInteriorName }}”.</p>
    </div>
    <div class="preview-pick" role="group" aria-label="Bartender">
      <UiButton size="sm" :variant="character === 'noa' ? 'solid' : 'secondary'" @click="setCharacter('noa')">Noa</UiButton>
      <UiButton size="sm" :variant="character === 'leo' ? 'solid' : 'secondary'" @click="setCharacter('leo')">Leo</UiButton>
    </div>
    <div class="preview-pick" aria-label="Preview catalogue"><UiButton size="sm" :variant="catalogue==='background'?'solid':'ghost'" @click="catalogue='background'">Backgrounds</UiButton><UiButton size="sm" :variant="catalogue==='style'?'solid':'ghost'" @click="catalogue='style'">Styles</UiButton></div>
    <AppearancePicker v-if="catalogue==='background'" kind="background" :character="character" :selected="interior" @pick="interior=$event" />
    <AppearancePicker v-else kind="style" :character="character" :selected="outfit" @pick="outfit=$event" />
    <div class="preview-actions">
      <UiButton v-if="!styleOwned" @click="acquisitionOffer={kind:'style',id:outfitId,label:styleLabel(character,outfit)};emit('close')">How to get this style</UiButton>
      <UiButton v-if="!interiorOwned" @click="acquisitionOffer={kind:'background',id:interior,label:interiorName};emit('close')">How to get this background</UiButton>
      <UiButton v-if="canBuyStyle" variant="primary" :crystal-cost="outfitInfo.price" @click="game.buyStyle(outfitId)">Buy style · <CrystalAmount :value="outfitInfo.price" /></UiButton>
      <UiButton v-if="canBuyInterior" variant="primary" :crystal-cost="interiorInfo.price" @click="game.buyInterior(interior)">Buy background · <CrystalAmount :value="interiorInfo.price" /></UiButton>
      <UiButton v-if="canApply" variant="solid" @click="apply">Use this look</UiButton>
      <UiButton variant="secondary" @click="emit('close')">Close</UiButton>
    </div>
  </ModalDialog>
</template>

<style>
.preview-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:14px;position:static}
.preview-stage { position: relative; height: 240px; border-radius: 14px; overflow: hidden; border: 1px solid #d8aa5755; }
.preview-stage .art-character { position: absolute !important; inset: auto auto 0 50% !important; transform: translateX(-50%); width: 132px !important; height: 220px !important; min-height:0!important; aspect-ratio:.6!important; }
.preview-stage .bartender-art { height: 100%; width: auto; object-fit: contain; }
.preview-info { display: grid; gap: 6px; margin: 10px 0; font-size: 13px; }
.preview-info p { margin: 0; }
.preview-info .own { color: #7fd6a2; }
.preview-info .locked { color: #e4b35c; }
.preview-info .pair { color: #c9d5e6; }
.preview-pick { display: flex; gap: 8px; margin: 6px 0; }
</style>
