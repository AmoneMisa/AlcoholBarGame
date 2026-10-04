<script setup lang="ts">
import FragmentChoicePicker from '../workshop/FragmentChoicePicker.vue';
import BoxRewardsPreview from '../workshop/BoxRewardsPreview.vue';
import InventoryPanel from '../workshop/InventoryPanel.vue';
import { computed, ref } from 'vue';
import { BOXES, CONSUMABLES, EQUIPMENT, SHARD_CRAFT_COST, TIER_SHARD_COST, consumableDef, equipmentDef } from '../../domain/loot';
import { COMPANIONS, KEEPSAKES, companionName } from '../../domain/companions';
import { COSMETICS, DRAWABLE_COSMETICS } from '../../domain/cosmetics';
import { RECIPES } from '../../domain/catalog';
import { STYLE_PIECES_TO_CRAFT } from '../../data/cosmetics/styleSources';
import { useGameStore } from '../../stores/game';
import ConfirmDialog from '../ui/ConfirmDialog.vue';
import ItemArt from '../ui/ItemArt.vue';
import ModalDialog from '../ui/ModalDialog.vue';
import UiButton from '../ui/UiButton.vue';
import OptionSelect from './OptionSelect.vue';

// What the player carries besides drinks, one tile for each thing: Workshop items (parts, every box, boosters, keepsakes)
// or shards (skin, one pile for each style or background, one per piece of equipment, one per Circle guest). Tap a tile:
// the popup says what it is, offers the action that fits (open, use, craft, raise a tier) and a Delete button that asks
// before it throws the thing away. The inventory shows these tabs only when the player owns something of that kind.
const props = defineProps<{ kind: 'items' | 'shards' }>();
const game = useGameStore();

type Popup =
  | { type: 'box' | 'consumable' | 'keepsake' | 'style' | 'equipment' | 'circle'; id: string }
  | { type: 'skin' | 'parts' };
interface Tile { key: string; art: { kind: 'box' | 'item' | 'equipment' | 'keepsake' | 'companion' | 'shard'; id: string; fallback: string }; name: string; note: string; count: number; popup: Popup }

const tiles = computed<Tile[]>(() => {
  const loot = game.loot;
  if (props.kind === 'items') {
    return ([
      { key: 'parts', art: { kind: 'shard', id: 'parts', fallback: '⚙️' }, name: 'Workshop parts', note: 'Used to upgrade equipment', count: loot.parts, popup: { type: 'parts' } },
      ...BOXES.map((box): Tile => ({ key: `box-${box.id}`, art: { kind: 'box', id: box.id, fallback: box.icon }, name: box.name, note: 'Tap to open', count: loot.boxes[box.id] ?? 0, popup: { type: 'box', id: box.id } })),
      ...CONSUMABLES.map((item): Tile => ({ key: `item-${item.id}`, art: { kind: 'item', id: item.id, fallback: item.icon }, name: item.name, note: item.description, count: loot.consumables[item.id] ?? 0, popup: { type: 'consumable', id: item.id } })),
      ...KEEPSAKES.map((item): Tile => ({ key: `keepsake-${item.id}`, art: { kind: 'keepsake', id: item.id, fallback: item.icon }, name: item.name, note: 'Deepens a bond in the Circle', count: game.circle.keepsakes[item.id] ?? 0, popup: { type: 'keepsake', id: item.id } }))
    ] as Tile[]).filter((tile) => tile.count > 0);
  }
  return ([
    // One tile for every style or background that has shards: its own pile, with the style's own id.
    ...Object.entries(loot.styleShards).map(([id, count]): Tile => ({ key: `style-shard:${id}`, art: { kind: 'shard', id: 'style', fallback: '🧵' }, name: `${COSMETICS.find((item) => item.id === id)?.label ?? id} shards`, note: `${Math.min(count, STYLE_PIECES_TO_CRAFT)} of ${STYLE_PIECES_TO_CRAFT} to craft`, count, popup: { type: 'style', id } })),
    ...EQUIPMENT.map((item): Tile => ({ key: `equipment-${item.id}`, art: { kind: 'equipment', id: item.id, fallback: item.icon }, name: `${item.name} shards`, note: 'Raise the tier of this equipment', count: loot.itemShards[item.id] ?? 0, popup: { type: 'equipment', id: item.id } })),
    ...COMPANIONS.map((person): Tile => ({ key: `circle-${person.id}`, art: { kind: 'companion', id: person.id, fallback: '🤝' }, name: `${companionName(person.id)} shards`, note: `${game.circle.shards[person.id] ?? 0} of ${person.shards} to invite them`, count: game.circle.shards[person.id] ?? 0, popup: { type: 'circle', id: person.id } }))
  ] as Tile[]).filter((tile) => tile.count > 0);
});

const popup = ref<Popup | null>(null);
const confirming = ref(false);
const close = () => { popup.value = null; confirming.value = false; };
const need = (what: string, cost: number, have: number) => have < cost ? `Not enough ${what}: you need ${cost}, you have ${have}.` : '';
const id = computed(() => popup.value && 'id' in popup.value ? popup.value.id : '');

const lockedSkins = computed(() => DRAWABLE_COSMETICS.filter((item) => !game.ownedCosmeticIds.includes(item.id)));
const cosmeticKind = (key: string) => key.replace(/([A-Z])/g, ' $1').toLowerCase();

// A pile of style shards crafts exactly that style (an ordinary background's style brings its background along).
const style = computed(() => COSMETICS.find((item) => item.id === id.value));
const styleOwned = computed(() => game.ownedCosmeticIds.includes(id.value));
const styleHave = computed(() => game.loot.styleShards[id.value] ?? 0);
const box = computed(() => BOXES.find((item) => item.id === id.value));
const item = computed(() => consumableDef(id.value));
const keepsake = computed(() => KEEPSAKES.find((entry) => entry.id === id.value));
const gear = computed(() => EQUIPMENT.find((entry) => entry.id === id.value));
const gearSlot = computed(() => gear.value ? game.loot.equipment[game.regionId]?.[gear.value.id] : undefined);
const gearNeed = computed(() => gearSlot.value ? TIER_SHARD_COST[gearSlot.value.tier] ?? 0 : 0);
const person = computed(() => COMPANIONS.find((entry) => entry.id === id.value));
const itemStatus = computed(() => {
  const until = game.loot.boosts[id.value];
  return until && until > Date.now() ? `Active · ${Math.ceil((until - Date.now()) / 60000)} min left` : game.loot.armed[id.value] ? 'Armed for your next order' : '';
});
const scrollRecipe = ref('');
const knownRecipes = computed(() => RECIPES.filter((recipe) => game.knownRecipeIds.includes(recipe.id)));

const title = computed(() => {
  const p = popup.value;
  if (!p) return '';
  if (p.type === 'box') return box.value?.name ?? 'Box';
  if (p.type === 'consumable') return item.value?.name ?? 'Item';
  if (p.type === 'keepsake') return keepsake.value?.name ?? 'Keepsake';
  if (p.type === 'style') return `${style.value?.label ?? 'Style'} shards`;
  if (p.type === 'equipment') return `${gear.value?.name ?? 'Equipment'} shards`;
  if (p.type === 'circle') return `${companionName(p.id)} shards`;
  return p.type === 'skin' ? 'Skin shards' : 'Workshop parts';
});

// Delete: one box or booster at a time, a whole pile for shards and parts. Keepsakes and Circle shards cannot be deleted.
const discard = computed(() => {
  const p = popup.value;
  if (!p) return undefined;
  const loot = game.loot;
  if (p.type === 'box') return { kind: 'box', id: p.id, amount: 1, have: loot.boxes[p.id] ?? 0 };
  if (p.type === 'consumable') return { kind: 'consumable', id: p.id, amount: 1, have: loot.consumables[p.id] ?? 0 };
  if (p.type === 'style') return { kind: 'styleShards', id: p.id, amount: loot.styleShards[p.id] ?? 0, have: loot.styleShards[p.id] ?? 0 };
  if (p.type === 'equipment') return { kind: 'itemShards', id: p.id, amount: loot.itemShards[p.id] ?? 0, have: loot.itemShards[p.id] ?? 0 };
  if (p.type === 'skin') return { kind: 'skinShards', id: '', amount: loot.skinShards, have: loot.skinShards };
  if (p.type === 'parts') return { kind: 'parts', id: '', amount: loot.parts, have: loot.parts };
  return undefined;
});
function throwAway() {
  const target = discard.value;
  if (!target || target.have < 1) return;
  game.act({ type: 'discardLoot', kind: target.kind, id: target.id, amount: target.amount });
  confirming.value = false;
  // The popup closes when the last one is gone.
  if (target.have <= target.amount) close();
}
</script>

<template>
  <InventoryPanel v-if="kind === 'shards'" />
  <section v-else class="workshop-stock" :aria-label="kind === 'items' ? 'Workshop items' : 'Shards'">
    <button v-for="tile in tiles" :key="tile.key" class="stock-tile tappable" type="button" :data-id="tile.key" @click="popup = tile.popup">
      <ItemArt :kind="tile.art.kind" :id="tile.art.id" :fallback="tile.art.fallback" :size="64" />
      <b>{{ tile.name }}</b><small>{{ tile.note }}</small><strong>×{{ tile.count }}</strong>
    </button>
    <p v-if="!tiles.length" class="stock-empty">Nothing here yet.</p>
  </section>

  <ModalDialog v-if="popup" :title="title" :eyebrow="kind === 'items' ? 'ITEM' : 'SHARDS'" width="560px" placement="bottom" @close="close">
    <template v-if="popup.type === 'box' && box">
      <BoxRewardsPreview :box-id="box.id" />
      <p class="stock-text">You have <b>{{ game.loot.boxes[box.id] ?? 0 }}</b>.</p>
      <div v-if="game.loot.pendingChoice" class="stock-craft"><b>Pick one reward</b><UiButton v-for="(_, index) in game.loot.pendingChoice" :key="index" variant="primary" @click="game.act({ type: 'pickReward', index })">Reward {{ index + 1 }}</UiButton></div>
      <UiButton variant="solid" block :reason="!(game.loot.boxes[box.id] ?? 0) ? 'You have no more of these.' : game.loot.pendingChoice ? 'Pick your reward first.' : ''" @click="game.act({ type: 'openBox', box: box.id })">Open one</UiButton>
    </template>

    <template v-else-if="popup.type === 'consumable' && item">
      <p class="stock-text">{{ item.description }}</p>
      <p class="stock-text">You have <b>{{ game.loot.consumables[item.id] ?? 0 }}</b>.<template v-if="itemStatus"> {{ itemStatus }}.</template></p>
      <OptionSelect v-if="item.id === 'scroll'" label="Recipe" v-model="scrollRecipe" :options="[{ value: '', label: 'Choose a recipe' }, ...knownRecipes.map((recipe) => ({ value: recipe.id, label: recipe.name }))]" />
      <FragmentChoicePicker v-if="item.kind==='choice'" :id="item.id" @used="close()" />
      <UiButton v-else variant="solid" block :reason="!(game.loot.consumables[item.id] ?? 0) ? 'You have no more of these.' : item.id === 'scroll' && !scrollRecipe ? 'Choose a recipe first.' : ''" @click="game.act({ type: 'useConsumable', id: item.id, recipeId: scrollRecipe })">Use</UiButton>
    </template>

    <template v-else-if="popup.type === 'keepsake' && keepsake">
      <p class="stock-text">A gift for someone in the Circle: it deepens the bond when you give it. You have <b>{{ game.circle.keepsakes[keepsake.id] ?? 0 }}</b>. Give it from the Circle tab.</p>
    </template>

    <template v-else-if="popup.type === 'parts'">
      <p class="stock-text">You have <b>{{ game.loot.parts }}</b> workshop parts. Use Upgrades on the Bar screen to upgrade your bar. Serving guests and opening boxes find more.</p>
    </template>

    <template v-else-if="popup.type === 'style' && style">
      <p class="stock-text">{{ style.label }}{{ style.character ? ` (${style.character === 'leo' ? 'Leo' : 'Noa'})` : '' }}. You have <b>{{ styleHave }}</b> of {{ STYLE_PIECES_TO_CRAFT }} shards. These shards belong only to this style.</p>
      <progress class="stock-progress" :value="Math.min(styleHave, STYLE_PIECES_TO_CRAFT)" :max="STYLE_PIECES_TO_CRAFT"></progress>
      <p v-if="styleOwned" class="stock-text">You already own this style.</p>
      <UiButton v-else variant="solid" block :reason="need('shards', STYLE_PIECES_TO_CRAFT, styleHave)" @click="game.act({ type: 'craftStyle', cosmeticId: style.id })">Craft · {{ STYLE_PIECES_TO_CRAFT }} shards</UiButton>
    </template>


    <template v-else-if="popup.type === 'equipment' && gear && gearSlot">
      <p class="stock-text">{{ gear.description }} In {{ game.region.name }} it is <b>{{ gearSlot.tier }}</b>, level {{ gearSlot.level }}.</p>
      <p class="stock-text">You have <b>{{ game.loot.itemShards[gear.id] ?? 0 }}</b> {{ equipmentDef(gear.id)?.name.toLowerCase() }} shards.</p>
      <UiButton v-if="gearNeed" variant="solid" block :reason="need('shards', gearNeed, game.loot.itemShards[gear.id] ?? 0)" @click="game.act({ type: 'promoteEquipment', item: gear.id, regionId: game.regionId })">Raise tier · {{ gearNeed }} shards</UiButton>
      <p v-else class="stock-text">This is the top tier.</p>
    </template>

    <template v-else-if="popup.type === 'circle' && person">
      <p class="stock-text">{{ game.circle.shards[person.id] ?? 0 }} of {{ person.shards }} shards to invite {{ companionName(person.id) }} to your Circle. Serve them well when they visit to find more, then invite them from the Circle tab.</p>
    </template>

    <template #footer>
      <div v-if="discard" class="stock-foot">
        <UiButton variant="danger" size="sm" :disabled="discard.have < 1" @click="confirming = true">Delete{{ discard.amount > 1 ? ` all ${discard.amount}` : '' }}</UiButton>
      </div>
    </template>
  </ModalDialog>

  <ConfirmDialog v-if="confirming && discard" title="Throw it away?" confirm-label="Delete" danger @confirm="throwAway" @cancel="confirming = false">
    <p>{{ discard.amount > 1 ? `All ${discard.amount} of ${title.toLowerCase()}` : `One of ${title}` }} will be deleted. You cannot get {{ discard.amount > 1 ? 'them' : 'it' }} back.</p>
  </ConfirmDialog>
</template>

<style>
.workshop-stock { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 10px; padding: 12px; }
.stock-tile { position: relative; display: grid; justify-items: center; align-content: start; gap: 4px; padding: 14px 10px 12px; border: 1px solid #354762; border-radius: 14px; background:#0b1320 var(--ui-card-art) center / cover no-repeat; color: #e9eef7; text-align: center; font: inherit; }
.stock-tile.tappable { cursor: pointer; }
.stock-tile.tappable:hover, .stock-tile.tappable:focus-visible { border-color: #d6a54d; }
.stock-tile .item-art { width: 64px; height: 64px; border-radius: 50%; }
.stock-tile b { font-size: 14px; }
.stock-tile small { color: #9eafc1; font-size: 13px; line-height: 1.3; }
.stock-tile strong { position: absolute; top: 8px; left: 8px; min-width: 28px; padding: 2px 8px; border: 1px solid #806536; border-radius: 999px; background: #17120c; color: #ffd98a; font: 700 13px Georgia, serif; }
.stock-empty { grid-column: 1 / -1; margin: 0; color: #9eafc1; }
.stock-text { margin: 0 0 10px; color: #c9d5e6; font-size: 14px; line-height: 1.5; }
.stock-progress { width: 100%; margin: 0 0 12px; accent-color: #e7b556; }
.stock-craft { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; margin-bottom: 10px; }
.stock-foot { display: flex; justify-content: flex-end; }
.stock-craft-list { display: grid; gap: 6px; margin: 0; padding: 0; list-style: none; }
.stock-craft-list li { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 6px 10px; padding: 8px 10px; border: 1px solid #354762; border-radius: 10px; background: #111c2d; }
.stock-craft-list li span { display: grid; min-width: 0; font-size: 14px; }
.stock-craft-list li small { color: #9eafc1; font-size: 13px; }
.stock-craft-list li.rare { border-color: #3f86b8; }
.stock-craft-list li.legendary { border-color: #d6a54d; background: #2a2113; }
.stock-craft-list .ui-reason { flex-basis: 100%; margin: 0; }
</style>
