<script setup lang="ts">
import { computed, ref } from 'vue';
import { useGameStore } from '../../stores/game';
import { COSMETICS } from '../../domain/cosmetics';
import { BOXES, CONSUMABLES, EQUIPMENT, SHARD_CRAFT_COST } from '../../domain/loot';
import { COMPANIONS, companionName } from '../../domain/companions';
import { STYLE_PIECES_TO_CRAFT } from '../../data/cosmetics/styleSources';
import { shardStyles } from '../../sim/loot';
import InventoryShelf, { type ShelfEntry } from '../ui/InventoryShelf.vue';
import RewardArt from '../ui/RewardArt.vue';
import ModalDialog from '../ui/ModalDialog.vue';
import UiButton from '../ui/UiButton.vue';
const game = useGameStore();
type Entry = ShelfEntry & { detail: string; action?: Parameters<typeof game.act>[0]; actionLabel?: string; reason?: string };
const selectedKey = ref('');
const groups = computed<{ title: string; entries: Entry[] }[]>(() => [
  { title: 'Chests & items', entries: [
    ...BOXES.filter(item => (game.loot.boxes[item.id] ?? 0) > 0).map(item => ({ key: `box:${item.id}`, line: { kind: 'box' as const, id: item.id, text: item.name }, count: game.loot.boxes[item.id]!, detail: item.description, action: { type: 'openBox' as const, box: item.id }, actionLabel: 'Open chest', reason: game.loot.pendingChoice ? 'Pick your previous chest reward in Boxes first.' : '' })),
    ...CONSUMABLES.filter(item => (game.loot.consumables[item.id] ?? 0) > 0).map(item => ({ key: `item:${item.id}`, line: { kind: 'item' as const, id: item.id, text: item.name }, count: game.loot.consumables[item.id]!, detail: item.description, action: item.id === 'scroll' ? undefined : { type: 'useConsumable' as const, id: item.id }, actionLabel: 'Use item' }))
  ] },
  { title: 'Style collection', entries: COSMETICS.filter(item => game.ownedCosmeticIds.includes(item.id)).map(item => ({ key: `style:${item.id}`, line: { kind: 'style' as const, id: item.id, rarity: item.rarity, text: item.label }, count: 1 + (game.cosmeticCopies[item.id] ?? 0), detail: `${item.rarity} ${item.key} · ${item.character ?? 'Both characters'}. Choose this style in Design.${game.cosmeticCopies[item.id] ? ` ${game.cosmeticCopies[item.id]} spare copies can be gifted to friends.` : ''}` })) },
  { title: 'Style fragments', entries: [
    ...shardStyles().filter(item => (game.loot.styleShards[item.id] ?? 0) > 0 && !game.ownedCosmeticIds.includes(item.id)).map(item => ({ key: `pieces:${item.id}`, line: { kind: 'style' as const, id: item.id, rarity: item.rarity, text: item.label }, count: (game.loot.styleShards[item.id] ?? 0), fragments: true, detail: `${(game.loot.styleShards[item.id] ?? 0)}/${STYLE_PIECES_TO_CRAFT} style pieces. These fragments belong to this style; crafting spends only its fragments.`, action: { type: 'craftStyle' as const, cosmeticId: item.id }, actionLabel: 'Craft style', reason: (game.loot.styleShards[item.id] ?? 0) < STYLE_PIECES_TO_CRAFT ? `Requires ${STYLE_PIECES_TO_CRAFT} style pieces.` : '' })),
    ...COSMETICS.filter(item => game.loot.skinShards > 0 && !item.source && !game.ownedCosmeticIds.includes(item.id)).map(item => ({ key: `skin:${item.id}`, line: { kind: 'style' as const, id: item.id, rarity: item.rarity, text: item.label }, count: game.loot.skinShards, fragments: true, detail: `${game.loot.skinShards}/${SHARD_CRAFT_COST[item.rarity]} skin shards. This pool is shared by all draw styles.`, action: { type: 'craftSkin' as const, cosmeticId: item.id }, actionLabel: 'Craft style', reason: game.loot.skinShards < SHARD_CRAFT_COST[item.rarity] ? `Requires ${SHARD_CRAFT_COST[item.rarity]} skin shards.` : '' }))
  ] },
  { title: 'Equipment fragments', entries: EQUIPMENT.filter(item => (game.loot.itemShards[item.id] ?? 0) > 0).map(item => ({ key: `equipment:${item.id}`, line: { kind: 'material' as const, id: item.id, text: item.name }, count: game.loot.itemShards[item.id]!, fragments: true, detail: `Shards for ${item.name}. Raise its tier in Equipment for the bar you choose.` })) },
  { title: 'Circle fragments', entries: COMPANIONS.filter(person => (game.circle.shards[person.id] ?? 0) > 0 && !(person.id in game.circle.owned)).map(person => ({ key: `companion:${person.id}`, line: { kind: 'companion' as const, id: person.id, rarity: 'rare' as const, text: companionName(person.id) }, count: game.circle.shards[person.id]!, fragments: true, detail: `${game.circle.shards[person.id]}/${person.shards} fragments · ${person.intro}`, action: { type: 'recruitCompanion' as const, id: person.id }, actionLabel: 'Invite to your Circle', reason: game.circle.shards[person.id]! < person.shards ? `Requires ${person.shards} fragments.` : '' })) }
]);
const selected = computed(() => groups.value.flatMap(group => group.entries).find(entry => entry.key === selectedKey.value));
function activate() { const entry = selected.value; if (entry?.action && game.act(entry.action)) selectedKey.value = ''; }
</script>
<template>
  <div class="inventory-panel">
    <p class="inventory-note">Tap a card to inspect or use it. ◈ marks fragments; each style has its own fragments. Skin shards are a shared crafting pool.</p>
    <InventoryShelf v-for="group in groups" :key="group.title" :title="group.title" :entries="group.entries" @select="selectedKey = $event" />
    <ModalDialog v-if="selected" :title="selected.line.text" close-label="Close item" @close="selectedKey = ''">
      <div class="inventory-inspect-art"><RewardArt :line="selected.line" /></div>
      <p class="inventory-note">{{ selected.detail }}</p>
      <UiButton v-if="selected.action" variant="solid" block :reason="selected.reason" @click="activate">{{ selected.actionLabel }}</UiButton>
    </ModalDialog>
  </div>
</template>
<style scoped>
.inventory-panel { display: grid; gap: 14px; }
.inventory-note { margin: 0 0 12px; color: #c2b3bf; font-size: 12px; line-height: 1.5; }
.inventory-inspect-art { height: 240px; margin-bottom: 16px; }
</style>
