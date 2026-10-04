<script setup lang="ts">
import UiButton from '../ui/UiButton.vue';
import CollectionBonuses from './CollectionBonuses.vue';
import { acquisitionOffer } from '../../domain/uiOffers';
import UiInput from '../ui/UiInput.vue';
import CrystalAmount from '../ui/CrystalAmount.vue';
import PanelHeading from '../ui/PanelHeading.vue';
import { computed, ref, watch } from 'vue';
import { REGIONS } from '../../domain/catalog';
import UiIcon from '../ui/UiIcon.vue';
import { isEventInterior } from '../../data/cosmetics/bars';
import { BARTENDER_OUTFITS, HIGHLIGHTS, HIGHLIGHT_STRENGTHS, INTERIORS, SHELF_STYLES, WALLS, interiorStyle, shelfStyleFor } from '../../data/cosmetics/bars';
import { useGameStore } from '../../stores/game';
import OptionSelect, { type SelectOption } from './OptionSelect.vue';
import BarScene from './BarScene.vue';
import CharacterModel from '../characters/CharacterModel.vue';
import { avatarOptionsFor, avatarLabel, type AvatarOption, type AvatarOptionKey } from '../../data/cosmetics/avatar';
import { BAR_PROFILE_OPTIONS } from '../../data/cosmetics/bars';
import { bartenderAvatarFor } from '../../data/cosmetics/bartenderAvatars';
import { bartenderCostumeFor, bartenderCostumesFor } from '../../data/cosmetics/bartenderCostumes';
import { COSMETICS } from '../../domain/cosmetics';
import { ownedFirst } from '../../domain/appearanceRewards';
import { STYLE_SHOP_PRICE } from '../../data/cosmetics/styleSources';
import { styleOrigin } from '../../domain/styleInfo';
import StylePreview from './StylePreview.vue';
const props = withDefaults(defineProps<{ activeView?: string; designSection?: 'bar' | 'character' }>(), { activeView: 'inventory' });
const game = useGameStore();
const barName = ref(game.decor.name);
const bartenderNickname = ref(game.decor.bartenderNickname ?? (game.decor.bartenderCharacter === 'leo' ? 'Leo' : 'Noa'));
watch(() => game.regionId, () => {
  barName.value = game.decor.name;
  bartenderNickname.value = game.decor.bartenderNickname ?? (game.decor.bartenderCharacter === 'leo' ? 'Leo' : 'Noa');
});
const selectedBartender = computed(() => game.decor.bartenderCharacter ?? 'noa');
const visibleOutfits = computed(() => ownedFirst(BARTENDER_OUTFITS.filter(value => ['vest', 'shirt', 'apron'].includes(value) || bartenderCostumesFor(selectedBartender.value).some(costume => costume.value === value) || COSMETICS.some(item => item.key === 'bartender' && item.character === selectedBartender.value && item.value === value)), value=>game.canUseCosmetic('bartender',value)));
const fixedCostume = computed(() => game.decor.bartender.startsWith('special-') || !!bartenderCostumeFor(selectedBartender.value, game.decor.bartender));
const outfitLabel = (outfit: string) => bartenderCostumeFor(selectedBartender.value, outfit)?.label ?? ({
  vest:'Burgundy vest',shirt:selectedBartender.value === 'leo' ? 'Shirt & suspenders' : 'Ivory jacket',apron:'Emerald apron',biker:'Leather set','tee-skirt':'Tee & skirt','suit-jeans':'Jacket & jeans',bunny:'Bunny suit',kimono:'Kimono','baggy-tee':'Baggy tee',streetwear:'Streetwear',
  'special-gala':'Midnight gown','special-cyberpunk':'Cyberpunk','special-steampunk':'Steampunk','special-post-apocalypse':'Wasteland','special-historical':'Historical','special-fantasy':'Fantasy','special-masquerade':'Masquerade'
}[outfit] ?? outfit);
const isInteriorOwned = (id: string) => game.ownedInteriorIds.includes(id);
const cosmeticLocked = (key:string,value:string) => !game.canUseCosmetic(key,value);
const pendingStyle = ref('');
const styleInfo = computed(() => {
  const value = pendingStyle.value; const character = selectedBartender.value;
  const item = COSMETICS.find((entry) => entry.key === 'bartender' && entry.value === value && entry.character === character);
  if (!item || game.ownedCosmeticIds.includes(item.id)) return null;
  return { item, ...styleOrigin(character, value) };
});
const previewOpen = ref(false);
const previewInterior = ref('');
const previewOutfit = ref('');
function openPreview(interior?: string, outfit?: string) { previewInterior.value = interior ?? game.decor.interior; previewOutfit.value = outfit ?? game.decor.bartender; previewOpen.value = true; }
function pickInterior(id: string) { if (isInteriorOwned(id)) game.chooseInterior(id); else acquisitionOffer.value={kind:'background',id,label:INTERIORS.find(item=>item.id===id)?.name??id}; }
function pickOutfit(outfit: typeof BARTENDER_OUTFITS[number]) {
  if (cosmeticLocked('bartender',outfit)) { pendingStyle.value = outfit; acquisitionOffer.value={kind:'style',id:`bartender:${outfit}:${selectedBartender.value}`,label:outfitLabel(outfit)}; return; }
  pendingStyle.value = ''; game.decor.bartender = outfit;
}
const DESIGN_TABS = [{ id: 'bar', label: 'Bar' }, { id: 'clothes', label: 'Clothes' }, { id: 'character', label: 'Character' }] as const;
const designTab = ref<typeof DESIGN_TABS[number]['id']>('bar');
const designTabsShown = computed(() => (props.designSection === 'bar' ? [] : props.designSection === 'character' ? DESIGN_TABS.filter((tab) => tab.id !== 'bar') : [...DESIGN_TABS]));
watch(() => props.designSection, (section) => { if (section === 'bar') designTab.value = 'bar'; else if (section === 'character' && designTab.value === 'bar') designTab.value = 'clothes'; }, { immediate: true });
const avatarOptions = computed(() => avatarOptionsFor(selectedBartender.value));
const clothesOptions = computed(() => avatarOptions.value.filter((option) => option.key === 'outfitColor'));
const characterOptions = computed(() => fixedCostume.value ? [] : avatarOptions.value.filter((option) => option.key !== 'outfitColor'));
function avatarChoices(option: AvatarOption): SelectOption[] {
  const saved: string = game.decor[option.key];
  const values = option.values;
  const choices = values.map((value) => ({ value, label: option.key === 'hairStyle' ? bartenderAvatarFor(selectedBartender.value, value)!.label : avatarLabel(value), locked: cosmeticLocked(option.key, value) }));
  return values.includes(saved) ? choices : [{ value: saved, label: `${avatarLabel(saved)} (saved style)`, locked: true }, ...choices];
}
function setAvatarOption(key: AvatarOptionKey, value: string) {
  if (cosmeticLocked(key,value) || !(BAR_PROFILE_OPTIONS[key] as readonly string[]).includes(value)) return;
  // The catalog and profile options above validate the dynamic field/value pair.
  Object.assign(game.decor, { [key]: value });
  if (key === 'hairStyle') game.decor.hairColor = bartenderAvatarFor(selectedBartender.value, value)!.hairColor as typeof game.decor.hairColor;
}
function selectBartender(id: 'noa' | 'leo') {
  const oldDefault = selectedBartender.value === 'leo' ? 'Leo' : 'Noa';
  game.decor.bartenderCharacter = id;
  game.decor.hairColor = id === 'leo' ? 'chestnut' : 'espresso';
  game.decor.skinTone = 'fair';
  game.decor.tanLevel = 'none';
  if (game.decor.bartender.startsWith('special-')) game.decor.bartender = id === 'leo' ? 'shirt' : 'vest';
  if (!['vest','shirt','apron'].includes(game.decor.bartender)) game.decor.bartender = 'vest';
  if (id === 'leo') {
    game.decor.bodyShape = 'muscular';
    game.decor.hairStyle = 'slick';
    game.decor.skinDetail = 'clean';
    game.decor.facialHair = 'short-beard';
    game.decor.eyeliner = 'none'; game.decor.eyeshadow = 'none'; game.decor.blush = 'none'; game.decor.lipColor = 'bare';
  } else {
    game.decor.bodyShape = 'curvy';
    game.decor.hairStyle = 'updo';
    game.decor.skinDetail = 'clean';
    game.decor.facialHair = 'clean';
    if (game.decor.eyeshadow === 'none') game.decor.eyeshadow = 'bronze';
    if (game.decor.lipColor === 'bare') game.decor.lipColor = 'rose';
  }
  if (!game.decor.bartenderNickname || game.decor.bartenderNickname === oldDefault) {
    bartenderNickname.value = id === 'leo' ? 'Leo' : 'Noa';
    game.renameBartender(bartenderNickname.value);
  }
}

</script>
<template>
<article class="game-panel design-deck">
      <PanelHeading eyebrow="PERSONALIZE" title="Bar & bartender" aside="Live preview" />
      <CollectionBonuses />
      <div v-if="designTabsShown.length" class="design-tabs" role="tablist" aria-label="Design sections"><button v-for="tab in designTabsShown" :key="tab.id" role="tab" type="button" :aria-selected="designTab === tab.id" :class="{ active: designTab === tab.id }" @click="designTab = tab.id">{{ tab.label }}</button></div>
      <div class="design-grid-new">
        <!-- Bar: the real bar scene in preview mode, pinned while the options scroll. -->
        <div v-show="designTab === 'bar'" class="design-tab-bar">
      <div class="design-location-tabs"><button v-for="region in REGIONS.filter(item => game.isBarOwned(item.id))" :key="region.id" :class="{active:region.id === game.regionId}" type="button" @click="game.switchBar(region.id)">{{ region.name }}</button></div>
      <form class="bar-name-editor" @submit.prevent="game.renameBar(barName)"><label :for="'bar-name'">Bar name in {{ game.region.name }}<UiInput id="bar-name" v-model="barName" maxlength="32" required placeholder="Name your bar" /></label><UiButton type="submit" variant="solid">Save name</UiButton></form>
          <div class="design-preview" aria-label="Live preview of your bar"><BarScene preview :active="false" /></div>
        <div class="design-options">
          <section class="background-picker"><small>{{ INTERIORS.length }} BACKGROUNDS · {{ game.ownedInteriorIds.length }} OWNED</small><UiButton size="sm" variant="secondary" class="preview-open" @click="openPreview()">Preview backgrounds &amp; styles</UiButton><div><button v-for="interior in INTERIORS" :key="interior.id" :class="{active:game.decor.interior === interior.id,locked:!isInteriorOwned(interior.id),special:'special' in interior && interior.special}" :style="interiorStyle(interior.id)" type="button" @click="pickInterior(interior.id)"><em v-if="!isInteriorOwned(interior.id)"><template v-if="isEventInterior(interior.id)">★ Event · boxes</template><CrystalAmount v-else :value="interior.crystalCost" /></em><span>{{ interior.name }}</span></button></div></section>
          <section><small>WALL COLOR</small><div><button v-for="wall in WALLS" :key="wall" :class="{ active: game.decor.wall === wall }" type="button" @click="game.decor.wall = wall"><i :data-color="wall"></i>{{ wall }}</button></div></section>
          <section class="shelf-style-picker"><small>BACK-BAR SHELVES · {{ shelfStyleFor(game.decor) }}</small><div><button v-for="shelf in SHELF_STYLES" :key="shelf" :class="{ active: (game.decor.shelf ?? 'auto') === shelf }" :data-shelf-swatch="shelf === 'auto' ? shelfStyleFor({ interior: game.decor.interior }) : shelf" type="button" @click="game.decor.shelf = shelf">{{ shelf === 'auto' ? 'Match background' : shelf }}</button></div></section>
          <section><small>HIGHLIGHT COLOR</small><div><button v-for="light in HIGHLIGHTS" :key="light" :class="{ active: game.decor.lighting === light }" type="button" @click="game.decor.lighting = light"><i :data-color="light"></i>{{ light }}</button></div></section>
          <section><small>HIGHLIGHT STRENGTH</small><div><button v-for="strength in HIGHLIGHT_STRENGTHS" :key="strength" :class="{ active: game.decor.highlightStrength === strength }" type="button" @click="game.decor.highlightStrength = strength">{{ strength }}</button></div></section>
        </div>
        </div>
        <!-- Clothes and Character share one painted avatar preview. -->
        <div v-show="designTab !== 'bar'" class="bartender-custom">
          <div class="avatar-stage">
            <CharacterModel role="bartender" interactive :character-id="selectedBartender" :outfit="game.decor.bartender" :hair-style="game.decor.hairStyle" :hair-color="game.decor.hairColor" :body-shape="game.decor.bodyShape" :eye-shape="game.decor.eyeShape" :eye-color="game.decor.eyeColor" :brow-shape="game.decor.browShape" :nose-shape="game.decor.noseShape" :cheek-shape="game.decor.cheekShape" :lip-shape="game.decor.lipShape" :lip-color="game.decor.lipColor" :eyeshadow="game.decor.eyeshadow" :eyeliner="game.decor.eyeliner" :blush="game.decor.blush" :facial-hair="game.decor.facialHair" :outfit-color="game.decor.outfitColor" :pose="game.decor.pose" />
          </div>
          <div v-show="designTab === 'clothes'" class="design-tab-clothes">
          <div class="bartender-selector" aria-label="Choose bartender">
            <button v-for="person in [{id:'noa',label:'Woman bartender'},{id:'leo',label:'Man bartender'}] as const" :key="person.id" :class="{ active: selectedBartender === person.id }" type="button" @click="selectBartender(person.id)">{{ person.label }}</button>
          </div>
          <div class="outfit-selector" aria-label="Choose bartender outfit"><button v-for="outfit in visibleOutfits" :key="outfit" :class="{ active: game.decor.bartender === outfit, locked:cosmeticLocked('bartender',outfit) }" type="button" :aria-pressed="pendingStyle === outfit" @click="pickOutfit(outfit)"><UiIcon v-if="cosmeticLocked('bartender',outfit)" name="lock" /> {{ outfitLabel(outfit) }}</button></div>
          <div v-if="styleInfo" class="style-info" role="status">
            <b>{{ styleInfo.item.label }}</b>
            <span>{{ styleInfo.how }}</span>
            <span v-if="styleInfo.background">Background: “{{ styleInfo.background }}”.</span>
            <UiButton size="sm" variant="secondary" @click="openPreview(undefined, pendingStyle)">Preview this style</UiButton>
            <button v-if="styleInfo.source === 'shop'" class="ui-btn ui-btn-primary ui-btn-sm" type="button"  @click="game.buyStyle(styleInfo.item.id); pendingStyle = ''">Buy · {{ STYLE_SHOP_PRICE }} 💎</button>
          </div>
            <div class="avatar-options">
              <OptionSelect v-for="option in clothesOptions" :key="option.key" :label="option.label" :model-value="game.decor[option.key]" :options="avatarChoices(option)" @update:model-value="setAvatarOption(option.key, $event)" />
            </div>
          </div>
          <div v-show="designTab === 'character'" class="design-tab-character">
      <form class="bartender-name-editor" @submit.prevent="game.renameBartender(bartenderNickname)"><label for="bartender-nickname">Bartender nickname<UiInput id="bartender-nickname" v-model="bartenderNickname" maxlength="18" required placeholder="Enter a nickname" /></label><UiButton type="submit" variant="solid">Save nickname</UiButton><span>This is the name guests see.</span></form>
            <p class="avatar-help">{{ fixedCostume ? 'This costume includes its hairstyle, hair color and makeup. Choose an everyday outfit to change your hairstyle.' : 'Your hairstyle comes with your selected costume.' }} Changes are saved with this bar.</p>
            <div class="avatar-options">
              <OptionSelect v-for="option in characterOptions" :key="option.key" :label="option.label" :model-value="game.decor[option.key]" :options="avatarChoices(option)" @update:model-value="setAvatarOption(option.key, $event)" />
            </div>
          </div>
        </div>
      </div>
    </article>
    <StylePreview v-if="previewOpen" :character="selectedBartender === 'leo' ? 'leo' : 'noa'" :interior="previewInterior" :outfit="previewOutfit" @close="previewOpen = false" />
</template>
<style scoped>
.bottle-inventory-tools { display:flex; flex-wrap:wrap; align-items:end; justify-content:space-between; gap:12px; margin:12px 0; }
.bottle-inventory-tools > :first-child { flex:1 1 240px; max-width:480px; }
.bottle-pagination { display:flex; align-items:center; gap:8px; }
.bottle-pagination span { font-size:.85rem; color:var(--muted, #a8b6c9); white-space:nowrap; }
</style>
