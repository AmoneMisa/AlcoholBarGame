<script setup lang="ts">
import BoxRewardsPreview from './BoxRewardsPreview.vue';
import ModalDialog from '../ui/ModalDialog.vue';
import ItemArt from '../ui/ItemArt.vue';


import InventoryPanel from './InventoryPanel.vue';
import UiCheckbox from '../ui/UiCheckbox.vue';
import UiInput from '../ui/UiInput.vue';
import { computed, ref, watch } from 'vue';



import { RECIPES } from '../../domain/catalog';
import {
  BOXES,
  consumableDef, describeReward, equipmentDef
} from '../../domain/loot';
import { INGREDIENTS } from '../../domain/catalog';
import { FAME_PRICE_BONUS, FAME_STEPS, MAX_ITEMS, SIGNATURE_FEE, SIGNATURE_GUEST_CHANCE, SIGNATURE_LEVEL, fameLevel, nextFameStep, scoreSignature, validateSignature } from '../../domain/signature';
import { usableIngredientIds } from '../../domain/usableStock';
import UiButton from '../ui/UiButton.vue';

import OptionSelect from '../game/OptionSelect.vue';
import { useGameStore } from '../../stores/game';

const game = useGameStore();
const previewBox = ref('');
const tab = ref<'inventory' | 'boxes' | 'signature'>('inventory');
const tabs = [['inventory', 'Inventory'], ['boxes', 'Chests'], ['signature', 'Signature']] as const;
const names = { consumable: (id: string) => consumableDef(id)?.name ?? id, equipment: (id: string) => equipmentDef(id)?.name ?? id };
const boxCount = (id: string) => game.loot.boxes[id] ?? 0;
// The words under a blocked button when the player cannot afford something.
const needMore = (what: string, need: number, have: number) => have < need ? `Not enough ${what}: you need ${need}, you have ${Math.floor(have)}.` : '';
const started = computed(() => [
  { label: 'Open your welcome box from its Inventory popup', done: (game.loot.stats.boxes ?? 0) >= 1 },
  { label: 'Upgrade a piece of equipment', done: (game.loot.stats.upgrades ?? 0) >= 1 },
  { label: 'Serve a perfect drink to earn parts and boxes', done: (game.loot.stats.serves ?? 0) >= 1 }
]);
const gettingStarted = computed(() => started.value.some((step) => !step.done));
// ---- Signature cocktail designer ----
const saved = computed(() => game.loot.signatures[game.regionId]);
const draftName = ref(saved.value?.name ?? '');
const draftShake = ref(saved.value?.needsShake ?? true);
const draftItems = ref<{ ingredientId: string; amount: number }[]>(saved.value ? saved.value.items.map((item) => ({ ...item })) : [{ ingredientId: 'gin', amount: 45 }, { ingredientId: 'lime-juice', amount: 20 }]);
const usableList = computed(() => [...usableIngredientIds(game.knownRecipeIds)].map((id) => INGREDIENTS.find((item) => item.id === id)!).filter(Boolean));
const ingredient = (id: string) => INGREDIENTS.find((item) => item.id === id)!;
const preview = computed(() => scoreSignature(draftItems.value));
const draftError = computed(() => {
  try { validateSignature({ name: draftName.value, items: draftItems.value, needsShake: draftShake.value }, usableIngredientIds(game.knownRecipeIds)); return ''; }
  catch (error) { return (error as Error).message; }
});
const stepAmount = (row: { ingredientId: string; amount: number }, direction: 1 | -1) => {
  const item = ingredient(row.ingredientId);
  row.amount = Math.max(item.pourStep, row.amount + direction * item.pourStep);
};
const pickIngredient = (row: { ingredientId: string; amount: number }, id: string) => { row.ingredientId = id; row.amount = ingredient(id).pourStep * (ingredient(id).unit === 'ml' ? 3 : 1); };
const addRow = () => { const free = usableList.value.find((item) => !draftItems.value.some((row) => row.ingredientId === item.id)); if (free && draftItems.value.length < MAX_ITEMS) draftItems.value.push({ ingredientId: free.id, amount: free.pourStep * (free.unit === 'ml' ? 3 : 1) }); };
const defaultDraft = () => [{ ingredientId: 'gin', amount: 45 }, { ingredientId: 'lime-juice', amount: 20 }];
// Each bar has its own signature: the draft follows the bar being managed.
watch(() => game.regionId, () => {
  draftName.value = saved.value?.name ?? '';
  draftShake.value = saved.value?.needsShake ?? true;
  draftItems.value = saved.value ? saved.value.items.map((item) => ({ ...item })) : defaultDraft();
});
const fame = computed(() => fameLevel(saved.value?.served ?? 0));
</script>

<template>
  <section class="workshop game-panel">
    <header class="workshop-hero"><div><small>YOUR COLLECTION</small><h2>{{ tab === 'inventory' ? 'Inventory' : tab === 'boxes' ? 'Chests' : 'Signature cocktail' }}</h2><p>Inspect your items, open chests and improve your bar.</p></div></header>
    <nav class="workshop-tabs"><UiButton v-for="[id, label] in tabs" :key="id" type="button" :class="{ active: tab === id }" @click="tab = id">{{ label }}</UiButton></nav>
    <aside v-if="gettingStarted && tab === 'boxes'" class="getting-started"><b>Getting started</b><ol><li v-for="step in started" :key="step.label" :class="{ done: step.done }">{{ step.label }}</li></ol></aside>

    <InventoryPanel v-if="tab === 'inventory'" />
    <div v-else-if="tab === 'boxes'" class="grid">
      <article v-for="box in BOXES" :key="box.id" class="card">
        <ItemArt kind="box" :id="box.id" :fallback="box.icon" :size="72" class="workshop-art" />
        <h3>{{ box.name }} <b>×{{ boxCount(box.id) }}</b></h3>
        <UiButton size="sm" @click="previewBox = box.id">View rewards</UiButton>
        <div class="row">
          <UiButton variant="primary" v-if="box.crystalPrice" type="button" :reason="needMore('crystals', box.crystalPrice, game.crystals)" @click="game.act({ type: 'buyBox', box: box.id })">Buy · {{ box.crystalPrice }} crystals</UiButton>
        </div>
      </article>
    </div>

    <div v-else-if="tab === 'signature'" class="draw">
      <article v-if="game.level < SIGNATURE_LEVEL" class="card"><h3>🍹 Signature cocktail</h3><p>Invent your own cocktail for this bar. Unlocks at level {{ SIGNATURE_LEVEL }} (you are level {{ game.level }}).</p></article>
      <template v-else>
        <article class="card">
          <h3>🍹 Design your signature</h3>
          <p>Some guests will come asking for your house special (about {{ Math.round(SIGNATURE_GUEST_CHANCE * 100) }}% of arrivals) without naming it: open the conversation and offer it in English, by name or as “the house special”. Developing or changing it costs {{ SIGNATURE_FEE }} coins and restarts its fame.</p>
          <UiInput label="Cocktail name" v-model="draftName" maxlength="24" placeholder="Cocktail name" />
          <div v-for="(row, index) in draftItems" :key="index" class="row sig-row">
            <OptionSelect label="Ingredient" :model-value="row.ingredientId" :options="usableList.map((item) => ({ value: item.id, label: item.name }))" @update:model-value="(value: string) => pickIngredient(row, value)" />
            <UiButton variant="primary" @click="stepAmount(row, -1)">−</UiButton><b>{{ row.amount }} {{ ingredient(row.ingredientId).unit === 'ml' ? 'ml' : '×' }}</b><UiButton variant="primary" @click="stepAmount(row, 1)">+</UiButton>
            <UiButton variant="secondary" size="sm" icon="close" aria-label="Remove this ingredient" :disabled="draftItems.length <= 2" @click="draftItems.splice(index, 1)" />
          </div>
          <div class="row"><UiButton variant="primary" :disabled="draftItems.length >= MAX_ITEMS" @click="addRow">Add ingredient</UiButton><UiCheckbox v-model="draftShake" label="Needs shaking" /></div>
          <b>Guests would pay {{ preview.price.toFixed(0) }} coins</b>
          <small v-for="line in preview.notes" :key="line">{{ line }}</small>
          <small v-if="draftError" class="sig-error">{{ draftError }}</small>
          <UiButton variant="primary" :disabled="!!draftError" :coin-cost="SIGNATURE_FEE" @click="game.act({ type: 'designSignature', name: draftName, items: draftItems, needsShake: draftShake })">{{ saved ? 'Replace signature' : 'Develop signature' }} · {{ SIGNATURE_FEE }} coins</UiButton>
        </article>
        <article class="card">
          <h3>⭐ {{ saved?.name ?? 'No signature yet' }}</h3>
          <template v-if="saved">
            <p>Price {{ saved.price.toFixed(0) }} coins · served {{ saved.served }} times · fame level {{ fame }} (+{{ Math.round(FAME_PRICE_BONUS * fame * 100) }}% price).</p>
            <progress :value="saved.served" :max="nextFameStep(saved.served) ?? saved.served"></progress>
            <p>{{ nextFameStep(saved.served) ? `${nextFameStep(saved.served)! - saved.served} more serves to fame level ${fame + 1}.` : 'Top fame reached.' }} Fame levels at {{ FAME_STEPS.join(' / ') }} serves pay a bronze, silver and choice box.</p>
            <ul class="results"><li v-for="item in saved.items" :key="item.ingredientId">{{ ingredient(item.ingredientId).name }} · {{ item.amount }} {{ ingredient(item.ingredientId).unit === 'ml' ? 'ml' : '×' }}</li><li>{{ saved.needsShake ? 'Shake with ice' : 'Build over ice' }}</li></ul>
          </template>
          <p v-else>Each bar keeps its own signature.</p>
        </article>
      </template>
    </div>

    <ModalDialog v-if="previewBox" :title="BOXES.find(box=>box.id===previewBox)?.name" width="640px" @close="previewBox = ''"><BoxRewardsPreview :box-id="previewBox" /></ModalDialog>

  </section>
</template>

<style scoped>
.workshop{overflow:hidden}.workshop-hero{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:16px;padding:14px 18px;background:#0b1320; background-image:var(--ui-panel-art);background-position:center;background-size:cover;border-bottom:1px solid #354762}
.workshop-hero small{color:#e4b35c;font-size:13px;font-weight:900;letter-spacing:.12em}.workshop-hero h2{margin:5px 0;font:700 23px Georgia,serif}.workshop-hero p{margin:0;color:#bdc8d6;font-size:13px}
.workshop-hero dl{display:flex;gap:14px;margin:0}.workshop-hero dt{color:#91a2b5;font-size:13px;letter-spacing:.1em;text-transform:uppercase}.workshop-hero dd{margin:2px 0 0;color:#fff0c8;font:700 20px Georgia,serif}
.workshop-tabs{display:flex;gap:6px;padding:12px 14px 0;overflow-x:auto}.workshop-tabs button{padding:8px 12px;border:1px solid #40536c;border-radius:9px;background:#111c2d;color:#c7d3e0;font-weight:800;white-space:nowrap;cursor:pointer}.workshop-tabs button.active{border-color:#b78649;background:#3b2b1f;color:#fff0ce}
.getting-started{margin:10px 14px 0;padding:10px 14px;border:1px solid #b78649;border-radius:10px;background:#2a2016;color:#ffe9bd;font-size:13px}.getting-started ol{margin:6px 0 0;padding-left:20px;display:grid;gap:3px}.getting-started li.done{color:#8fd1a0;text-decoration:line-through}
.workshop-log{margin:10px 14px 0;padding:8px 10px;border:1px solid #3e7756;border-radius:8px;background:#173425;color:#b9e5c6;font-size:13px}
.grid,.draw{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:10px;padding:14px}.draw{grid-template-columns:repeat(auto-fit,minmax(280px,1fr))}
.card{display:grid;align-content:start;gap:8px;padding:14px;border:1px solid #354762;border-radius:13px;background:#111c2d}.card h3{margin:0;font:700 17px Georgia,serif}.card p{margin:0;color:#aebdce;font-size:13px;line-height:1.45}.card>b{color:#f4d08e;font-size:13px}.card select{padding:8px;border:1px solid #40536c;border-radius:8px;background:#0c1625;color:#fff}
.workshop-art{display:block;width:72px;height:72px;object-fit:contain;border-radius:50%}
.card em{margin-left:6px;padding:2px 6px;border-radius:6px;background:#26364d;color:#c7d3e0;font-size:13px;font-style:normal;text-transform:uppercase}.card em.rare{background:#1d4b6e}.card em.legendary{background:#7a4d12;color:#ffe0a0}
.card progress{width:100%;accent-color:#e7b556}.row{display:flex;flex-wrap:wrap;gap:6px}
.results{display:grid;gap:4px;margin:0;padding:0;list-style:none;font-size:13px}.results li{padding:5px 8px;border-radius:7px;background:#17253a}.results li.rare{border-color:#3f86b8;color:#bfe2ff}.results li.legendary{background:#4a3210;color:#ffe0a0}
input[type=text],.card>input{padding:8px;border:1px solid #40536c;border-radius:8px;background:#0c1625;color:#fff}.sig-row{align-items:center}.sig-row select{flex:1;min-width:120px}.sig-row b{min-width:58px;text-align:center;color:#fff0c8}.sig-error{color:#f2a0a0}.card label{color:#c7d3e0;font-size:13px}
.board{display:grid;gap:4px;margin:0;padding:0;list-style:none;font-size:13px}.board li{display:grid;grid-template-columns:30px 1fr auto auto;gap:8px;align-items:center;padding:6px 8px;border-radius:7px;background:#17253a}.board li.me{background:#4a3210;color:#ffe0a0}.board li b{color:#f4d08e}.board li em{font-style:normal;color:#fff0c8}.board .empty{display:block;color:#93a5b9}
.gotit{color:#8fd1a0;text-decoration:line-through}
.bar-chips{grid-column:1/-1;display:flex;flex-wrap:wrap;gap:6px}

.hint{grid-column:1/-1;margin:0;color:#93a5b9;font-size:13px}small{color:#e4b35c}
</style>
