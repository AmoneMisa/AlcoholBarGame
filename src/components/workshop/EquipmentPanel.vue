<script setup lang="ts">
import { computed, ref } from 'vue';
import { REGIONS } from '../../domain/catalog';
import { EQUIPMENT, TIER_SHARD_COST, equipmentDef, levelCap, upgradeCostFor } from '../../domain/loot';
import { useGameStore } from '../../stores/game';
import ItemArt from '../ui/ItemArt.vue';
import UiButton from '../ui/UiButton.vue';
const game = useGameStore();
// Equipment is kept per bar. The bar shown here can be picked without leaving the page.
const pickedBar = ref('');
const equipBar = computed(() => (ownedBars.value.some((region) => region.id === pickedBar.value) ? pickedBar.value : game.regionId));
const ownedBars = computed(() => REGIONS.filter((region) => game.isBarOwned(region.id)));
const cap = (id: string) => levelCap(game.loot.equipment[equipBar.value]![id]!.tier);
const slot = (id: string) => game.loot.equipment[equipBar.value]![id]!;
const partsFor = (id: string) => Math.max(1, Math.ceil(upgradeCostFor(slot(id).level).parts * (1 - game.crewBonus('upgrade', equipBar.value))));
// Why a button is off, in words: shown under it, so the player never faces a dead button.
function upgradeReason(id: string) {
  const level = slot(id).level;
  if (level >= cap(id)) return TIER_SHARD_COST[slot(id).tier] ? 'This tier is at its top level. Raise the tier with shards to go higher.' : 'This item is at its top level.';
  const cost = upgradeCostFor(level);
  if (game.money < cost.coins) return `Not enough coins: you need ${cost.coins}, you have ${Math.floor(game.money)}.`;
  if (game.loot.parts < partsFor(id)) return `Not enough parts: you need ${partsFor(id)}, you have ${game.loot.parts}. Serve guests or open boxes to find parts.`;
  return '';
}
function tierReason(id: string) {
  const need = TIER_SHARD_COST[slot(id).tier];
  const have = game.loot.itemShards[id] ?? 0;
  return need && have < need ? `Not enough shards: you need ${need} ${equipmentDef(id)?.name.toLowerCase()} shards, you have ${have}. Silver and gold boxes bring item shards.` : '';
}
const effectText = (id: string) => {
  const item = equipmentDef(id)!;
  return `${Math.round(slot(id).level * item.perLevel * 1000) / 10}% ${item.unit}`;
};

</script>
<template><section class="workshop-utility equipment-panel">    <div  class="grid">
      <nav v-if="ownedBars.length > 1" class="bar-chips" aria-label="Bar to upgrade"><UiButton v-for="region in ownedBars" :key="region.id" size="sm" :variant="region.id === equipBar ? 'solid' : 'secondary'" @click="pickedBar = region.id">{{ region.name }}</UiButton></nav>
      <article v-for="item in EQUIPMENT" :key="item.id" class="card">
        <ItemArt kind="equipment" :id="item.id" :fallback="item.icon" :size="72" class="workshop-art" />
        <h3>{{ item.name }} <em :class="slot(item.id).tier">{{ slot(item.id).tier }}</em></h3>
        <p>{{ item.description }}</p>
        <b>Level {{ slot(item.id).level }} / {{ cap(item.id) }} · {{ effectText(item.id) }}</b>
        <progress :value="slot(item.id).level" :max="10"></progress>
        <div class="row">
          <UiButton variant="primary" :reason="upgradeReason(item.id)" @click="game.act({ type: 'upgradeEquipment', item: item.id, regionId: equipBar })">
            Upgrade · {{ upgradeCostFor(slot(item.id).level).coins }} coins + {{ partsFor(item.id) }} parts
          </UiButton>
          <UiButton variant="primary" v-if="TIER_SHARD_COST[slot(item.id).tier]" type="button" :reason="tierReason(item.id)" @click="game.act({ type: 'promoteEquipment', item: item.id, regionId: equipBar })">
            Raise tier · {{ game.loot.itemShards[item.id] ?? 0 }}/{{ TIER_SHARD_COST[slot(item.id).tier] }} shards
          </UiButton>
        </div>
      </article>
      <p class="hint">Every bar has its own equipment. Pick a bar above to upgrade it from here, without switching. Serving guests drops workshop parts; boxes bring shards.</p>
    </div>

</section></template>
<style src="./utility-panels.css"></style>