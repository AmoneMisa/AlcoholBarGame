<script setup lang="ts">
import { computed } from 'vue';
import { BOXES, CONSUMABLES, EQUIPMENT } from '../../domain/loot';
import { COMPANIONS, KEEPSAKES, companionName } from '../../domain/companions';
import { useGameStore } from '../../stores/game';

// What the player carries besides drinks: Workshop items (parts, boxes, boosters, keepsakes) or shards (style, item and
// companion shards). The inventory shows these tabs only when the player owns something of that kind.
const props = defineProps<{ kind: 'items' | 'shards' }>();
const game = useGameStore();
const rows = computed(() => {
  const loot = game.loot;
  if (props.kind === 'items') {
    return [
      { icon: '⚙️', name: 'Workshop parts', note: 'Used to upgrade equipment', count: loot.parts },
      ...BOXES.map((box) => ({ icon: box.icon, name: box.name, note: box.description, count: loot.boxes[box.id] ?? 0 })),
      ...CONSUMABLES.map((item) => ({ icon: item.icon, name: item.name, note: item.description, count: loot.consumables[item.id] ?? 0 })),
      ...KEEPSAKES.map((item) => ({ icon: item.icon, name: item.name, note: 'Deepens a bond in the Circle', count: game.circle.keepsakes[item.id] ?? 0 }))
    ].filter((row) => row.count > 0);
  }
  return [
    { icon: '🎨', name: 'Style shards', note: 'Craft a style you do not own', count: loot.skinShards },
    ...EQUIPMENT.map((item) => ({ icon: item.icon, name: `${item.name} shards`, note: 'Raise the tier of this equipment', count: loot.itemShards[item.id] ?? 0 })),
    ...COMPANIONS.map((person) => ({ icon: '🧑', name: `${companionName(person.id)} shards`, note: `${game.circle.shards[person.id] ?? 0} of ${person.shards} to invite ${companionName(person.id)}`, count: game.circle.shards[person.id] ?? 0 }))
  ].filter((row) => row.count > 0);
});
</script>

<template>
  <section class="workshop-stock" :aria-label="kind === 'items' ? 'Workshop items' : 'Shards'">
    <article v-for="row in rows" :key="row.name"><i>{{ row.icon }}</i><span><b>{{ row.name }}</b><small>{{ row.note }}</small></span><strong>×{{ row.count }}</strong></article>
    <p v-if="!rows.length" class="empty">Nothing here yet.</p>
  </section>
</template>

<style scoped>
.workshop-stock { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 8px; padding: 4px 0 12px; }
.workshop-stock article { display: grid; grid-template-columns: 34px 1fr auto; align-items: center; gap: 10px; padding: 8px 12px; border: 1px solid #354762; border-radius: 12px; background: #111c2d; color: #e9eef7; }
.workshop-stock i { font-size: 24px; font-style: normal; text-align: center; }
.workshop-stock span { display: grid; gap: 1px; min-width: 0; }
.workshop-stock b { font-size: 14px; }
.workshop-stock small { color: #9eafc1; font-size: 11px; line-height: 1.3; }
.workshop-stock strong { color: #ffd98a; font: 700 18px Georgia, serif; }
.empty { margin: 0; color: #9eafc1; }
</style>
