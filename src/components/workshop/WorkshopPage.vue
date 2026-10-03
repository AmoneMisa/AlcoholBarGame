<script setup lang="ts">
import BoxRewardsPreview from './BoxRewardsPreview.vue';
import ModalDialog from '../ui/ModalDialog.vue';
import ItemArt from '../ui/ItemArt.vue';
import WeeklyPodium from './WeeklyPodium.vue';
import WeeklyRewards from './WeeklyRewards.vue';
import InventoryPanel from './InventoryPanel.vue';
import UiCheckbox from '../ui/UiCheckbox.vue';
import UiInput from '../ui/UiInput.vue';
import { computed, ref, watch } from 'vue';
import { fetchLeaderboard, viewBoardBar, type BoardBar, type LeaderboardResult } from '../../telegram/api';
import BoardBarView from '../profile/BoardBarView.vue';
import { LEADERBOARD_SIZE, MIN_WEEKLY_SCORE, leaderboardReward, describeLeaderboardReward } from '../../domain/leaderboard';
import { RECIPES } from '../../domain/catalog';
import {
  BOXES, EQUIPMENT, TIER_SHARD_COST,
  consumableDef, describeReward, equipmentDef, levelCap, upgradeCostFor
} from '../../domain/loot';
import { INGREDIENTS } from '../../domain/catalog';
import { FAME_PRICE_BONUS, FAME_STEPS, MAX_ITEMS, SIGNATURE_FEE, SIGNATURE_GUEST_CHANCE, SIGNATURE_LEVEL, fameLevel, nextFameStep, scoreSignature, validateSignature } from '../../domain/signature';
import { usableIngredientIds } from '../../domain/usableStock';
import UiButton from '../ui/UiButton.vue';
import { REGIONS } from '../../domain/catalog';
import OptionSelect from '../game/OptionSelect.vue';
import { useGameStore } from '../../stores/game';

const game = useGameStore();
const previewBox = ref('');
const tab = ref<'inventory' | 'equipment' | 'boxes' | 'signature' | 'weekly'>('inventory');
const tabs = [['inventory', 'Inventory'], ['equipment', 'Equipment'], ['boxes', 'Chests'], ['signature', 'Signature'], ['weekly', 'Weekly']] as const;
const names = { consumable: (id: string) => consumableDef(id)?.name ?? id, equipment: (id: string) => equipmentDef(id)?.name ?? id };
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
const boxCount = (id: string) => game.loot.boxes[id] ?? 0;
// The words under a blocked button when the player cannot afford something.
const needMore = (what: string, need: number, have: number) => have < need ? `Not enough ${what}: you need ${need}, you have ${Math.floor(have)}.` : '';
// A look at the bar of someone on the board (read-only).
const viewing = ref<BoardBar>();
const viewError = ref('');
async function viewRow(row: { rank: number; score: number }) {
  if (!board.value) return;
  viewError.value = '';
  try {
    const result = await viewBoardBar(boardScope.value, row.rank, board.value.week, row.score);
    if (result.ok) viewing.value = result; else viewError.value = result.error ?? 'This bar is not available.';
  } catch (error) { viewError.value = (error as Error).message; }
}
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
// ---- Weekly leaderboard (online only) ----
const board = ref<LeaderboardResult | null>(null);
const boardError = ref('');
const boardLoading = ref(false);
const boardScope = ref<'global' | 'friends'>('global');
async function loadBoard() {
  if (game.mode !== 'online') return;
  boardLoading.value = true; boardError.value = '';
  try { board.value = await fetchLeaderboard(boardScope.value); } catch (error) { boardError.value = (error as Error).message; }
  boardLoading.value = false;
}
watch(tab, (next) => { if (next === 'weekly') void loadBoard(); });
watch(boardScope, () => { void loadBoard(); });
watch(() => game.loot.leaderboardClaimed, () => { if (tab.value === 'weekly') void loadBoard(); });
const daysLeft = computed(() => board.value ? Math.max(0, Math.ceil((board.value.endsAt - Date.now()) / 86_400_000)) : 0);
const effectText = (id: string) => {
  const item = equipmentDef(id)!;
  return `${Math.round(slot(id).level * item.perLevel * 1000) / 10}% ${item.unit}`;
};

</script>

<template>
  <section class="workshop game-panel">
    <header class="workshop-hero"><div><small>YOUR COLLECTION</small><h2>{{ tab === 'inventory' ? 'Inventory' : tab === 'equipment' ? 'Equipment' : tab === 'boxes' ? 'Chests' : tab === 'signature' ? 'Signature cocktail' : 'Weekly ranking' }}</h2><p>Inspect your items, open chests and improve your bar.</p></div></header>
    <nav class="workshop-tabs"><UiButton v-for="[id, label] in tabs" :key="id" type="button" :class="{ active: tab === id }" @click="tab = id">{{ label }}</UiButton></nav>
    <aside v-if="gettingStarted && (tab === 'equipment' || tab === 'boxes')" class="getting-started"><b>Getting started</b><ol><li v-for="step in started" :key="step.label" :class="{ done: step.done }">{{ step.label }}</li></ol></aside>
    <p v-if="game.loot.log[0]" class="workshop-log">{{ game.loot.log[0] }}</p>

    <InventoryPanel v-if="tab === 'inventory'" />
    <div v-else-if="tab === 'equipment'" class="grid">
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
          <UiButton variant="primary" :disabled="!!draftError || game.money < SIGNATURE_FEE" @click="game.act({ type: 'designSignature', name: draftName, items: draftItems, needsShake: draftShake })">{{ saved ? 'Replace signature' : 'Develop signature' }} · {{ SIGNATURE_FEE }} coins</UiButton>
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

    <div v-else-if="tab === 'weekly'" class="draw">
      <article v-if="game.mode !== 'online'" class="card"><h3>🏆 Weekly leaderboard</h3><p>The leaderboard needs an online account. Open the game from Telegram to compete.</p></article>
      <template v-else>
        <article class="card">
          <h3>🏆 This week's {{ boardScope === 'friends' ? 'friends' : 'top bars' }}</h3>
          <div class="row"><UiButton :variant="boardScope === 'global' ? 'solid' : 'secondary'" @click="boardScope = 'global'">Everyone</UiButton><UiButton :variant="boardScope === 'friends' ? 'solid' : 'secondary'" @click="boardScope = 'friends'">Friends</UiButton></div>
          <p>Score = XP you earn this week (serving, English, lessons). A drink pays the same XP at every level, so newcomers can win. Resets in {{ daysLeft }} day{{ daysLeft === 1 ? '' : 's' }}.</p>
          <p v-if="boardLoading">Loading…</p><p v-if="boardError || viewError" class="sig-error">{{ boardError || viewError }}</p>
          <WeeklyPodium v-if="board?.top.length" :rows="board.top" />
          <ol v-if="board" class="board">
            <li v-for="row in board.top" :key="row.rank" :class="{ me: row.me }"><b>{{ row.rank }}</b><span>{{ row.label }}<small v-if="row.level"> · level {{ row.level }}</small></span><em>{{ row.score }}</em><UiButton size="sm" variant="secondary" @click="viewRow(row)">View bar</UiButton></li>
            <li v-if="!board.top.length" class="empty">{{ boardScope === 'friends' ? 'Add friends in the Friends tab to compete with them.' : 'Nobody has scored yet this week. Serve a drink to take the lead.' }}</li>
          </ol>
          <p v-if="board?.me">You are <b>#{{ board.me.rank }}</b> of {{ board.me.size }} with {{ board.me.score }} XP.<template v-if="board.me.rank > LEADERBOARD_SIZE"> The list shows the top {{ LEADERBOARD_SIZE }}.</template></p>
          <p v-else-if="board">You have no score this week yet.</p>
          <UiButton variant="primary" @click="loadBoard">Refresh</UiButton>
        </article>
        <article class="card">
          <h3>🎁 Last week's reward</h3>
          <template v-if="board?.previous">
            <p>You finished <b>#{{ board.previous.rank }}</b> of {{ board.previous.size }} with {{ board.previous.score }} XP<template v-if="board.previous.tier"> — {{ board.previous.tier }}</template>.</p>
            <p v-if="board.previous.reward">Reward: {{ board.previous.reward }}</p>
            <p v-else>You need {{ MIN_WEEKLY_SCORE }} XP in a week to earn a reward.</p>
            <UiButton variant="primary" :disabled="!board.previous.claimable" @click="game.act({ type: 'claimLeaderboardReward' })">{{ board.previous.claimable ? 'Claim reward' : board.previous.reward ? 'Claimed' : 'No reward' }}</UiButton>
          </template>
          <p v-else>You did not play last week. Score at least {{ MIN_WEEKLY_SCORE }} XP this week to earn a reward next week.</p>
          <WeeklyRewards />
        </article>
      </template>
    </div>

    <ModalDialog v-if="previewBox" :title="BOXES.find(box=>box.id===previewBox)?.name" width="640px" @close="previewBox = ''"><BoxRewardsPreview :box-id="previewBox" /></ModalDialog>
    <BoardBarView v-if="viewing" :view="viewing" @close="viewing = undefined" />
  </section>
</template>

<style scoped>
.workshop{overflow:hidden}.workshop-hero{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:16px;padding:14px 18px;background:#0b1320; background-image:linear-gradient(#0b132088,#0b132088),url('/assets/ui/lounge-panel-painted-v1.webp');background-position:center;background-size:cover;border-bottom:1px solid #354762}
.workshop-hero small{color:#e4b35c;font-size:9px;font-weight:900;letter-spacing:.12em}.workshop-hero h2{margin:5px 0;font:700 23px Georgia,serif}.workshop-hero p{margin:0;color:#bdc8d6;font-size:12px}
.workshop-hero dl{display:flex;gap:14px;margin:0}.workshop-hero dt{color:#91a2b5;font-size:9px;letter-spacing:.1em;text-transform:uppercase}.workshop-hero dd{margin:2px 0 0;color:#fff0c8;font:700 20px Georgia,serif}
.workshop-tabs{display:flex;gap:6px;padding:12px 14px 0;overflow-x:auto}.workshop-tabs button{padding:8px 12px;border:1px solid #40536c;border-radius:9px;background:#111c2d;color:#c7d3e0;font-weight:800;white-space:nowrap;cursor:pointer}.workshop-tabs button.active{border-color:#b78649;background:#3b2b1f;color:#fff0ce}
.getting-started{margin:10px 14px 0;padding:10px 14px;border:1px solid #b78649;border-radius:10px;background:#2a2016;color:#ffe9bd;font-size:12px}.getting-started ol{margin:6px 0 0;padding-left:20px;display:grid;gap:3px}.getting-started li.done{color:#8fd1a0;text-decoration:line-through}
.workshop-log{margin:10px 14px 0;padding:8px 10px;border:1px solid #3e7756;border-radius:8px;background:#173425;color:#b9e5c6;font-size:11px}
.grid,.draw{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:10px;padding:14px}.draw{grid-template-columns:repeat(auto-fit,minmax(280px,1fr))}
.card{display:grid;align-content:start;gap:8px;padding:14px;border:1px solid #354762;border-radius:13px;background:#111c2d}.card h3{margin:0;font:700 17px Georgia,serif}.card p{margin:0;color:#aebdce;font-size:11px;line-height:1.45}.card>b{color:#f4d08e;font-size:11px}.card select{padding:8px;border:1px solid #40536c;border-radius:8px;background:#0c1625;color:#fff}
.workshop-art{display:block;width:72px;height:72px;object-fit:contain;border-radius:50%}
.card em{margin-left:6px;padding:2px 6px;border-radius:6px;background:#26364d;color:#c7d3e0;font-size:9px;font-style:normal;text-transform:uppercase}.card em.rare{background:#1d4b6e}.card em.legendary{background:#7a4d12;color:#ffe0a0}
.card progress{width:100%;accent-color:#e7b556}.row{display:flex;flex-wrap:wrap;gap:6px}
.results{display:grid;gap:4px;margin:0;padding:0;list-style:none;font-size:11px}.results li{padding:5px 8px;border-radius:7px;background:#17253a}.results li.rare{border-color:#3f86b8;color:#bfe2ff}.results li.legendary{background:#4a3210;color:#ffe0a0}
input[type=text],.card>input{padding:8px;border:1px solid #40536c;border-radius:8px;background:#0c1625;color:#fff}.sig-row{align-items:center}.sig-row select{flex:1;min-width:120px}.sig-row b{min-width:58px;text-align:center;color:#fff0c8}.sig-error{color:#f2a0a0}.card label{color:#c7d3e0;font-size:11px}
.board{display:grid;gap:4px;margin:0;padding:0;list-style:none;font-size:12px}.board li{display:grid;grid-template-columns:30px 1fr auto auto;gap:8px;align-items:center;padding:6px 8px;border-radius:7px;background:#17253a}.board li.me{background:#4a3210;color:#ffe0a0}.board li b{color:#f4d08e}.board li em{font-style:normal;color:#fff0c8}.board .empty{display:block;color:#93a5b9}
.gotit{color:#8fd1a0;text-decoration:line-through}
.bar-chips{grid-column:1/-1;display:flex;flex-wrap:wrap;gap:6px}

.hint{grid-column:1/-1;margin:0;color:#93a5b9;font-size:11px}small{color:#e4b35c}
</style>
