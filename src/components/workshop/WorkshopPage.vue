<script setup lang="ts">
import { computed, ref } from 'vue';
import { RECIPES } from '../../domain/catalog';
import { COSMETICS } from '../../domain/cosmetics';
import {
  BOXES, CONSUMABLES, DRAW_COST, DRAW_ODDS, DUPLICATE_SHARDS, EQUIPMENT, LEGENDARY_PITY, PRESTIGE_LEVEL, PRESTIGE_PERKS, SHARD_CRAFT_COST, TIER_SHARD_COST,
  consumableDef, describeReward, equipmentDef, levelCap, perkCost, prestigeStarsFor, upgradeCostFor
} from '../../domain/loot';
import { ACHIEVEMENTS, questsForWeek, weekOf } from '../../domain/quests';
import { featuredLegendary } from '../../sim/loot';
import { useGameStore } from '../../stores/game';

const game = useGameStore();
const tab = ref<'equipment' | 'boxes' | 'items' | 'draw' | 'quests' | 'prestige'>('equipment');
const tabs = [['equipment', 'Equipment'], ['boxes', 'Boxes'], ['items', 'Consumables'], ['draw', 'Style draw'], ['quests', 'Quests'], ['prestige', 'Grand Opening']] as const;
const scrollRecipe = ref('');
const names = { consumable: (id: string) => consumableDef(id)?.name ?? id, equipment: (id: string) => equipmentDef(id)?.name ?? id };
const cap = (id: string) => levelCap(game.loot.equipment[game.regionId]![id]!.tier, game.loot.prestige.perks.cap ?? 0);
const slot = (id: string) => game.loot.equipment[game.regionId]![id]!;
const boxCount = (id: string) => game.loot.boxes[id] ?? 0;
const knownRecipes = computed(() => RECIPES.filter((recipe) => game.knownRecipeIds.includes(recipe.id)));
const featured = computed(() => featuredLegendary(Date.now()));
const lockedSkins = computed(() => COSMETICS.filter((item) => !game.ownedCosmeticIds.includes(item.id)));
const week = computed(() => weekOf(Date.now()));
const quests = computed(() => questsForWeek(week.value).map((quest) => {
  const current = game.loot.quests.week === week.value;
  return { quest, progress: current ? game.loot.quests.progress[quest.stat] ?? 0 : 0, claimed: current && game.loot.quests.claimed.includes(quest.id) };
}));
const stat = (id: string) => game.loot.stats[id] ?? 0;
const cosmeticKind = (key: string) => key.replace(/([A-Z])/g, ' $1').toLowerCase();
const runStars = computed(() => prestigeStarsFor(game.loot.runEarned));
const effectText = (id: string) => {
  const item = equipmentDef(id)!;
  return `${Math.round(slot(id).level * item.perLevel * 1000) / 10}% ${item.unit}`;
};
const boostLeft = (id: string) => {
  const until = game.loot.boosts[id];
  return until && until > Date.now() ? `${Math.ceil((until - Date.now()) / 60000)} min left` : '';
};
</script>

<template>
  <section class="workshop game-panel">
    <header class="workshop-hero">
      <div><small>WORKSHOP</small><h2>Upgrade your bar</h2><p>Improve equipment, open boxes, use boosters and draw new styles. Everything is checked by the server.</p></div>
      <dl>
        <div><dt>Parts</dt><dd>{{ game.loot.parts }}</dd></div>
        <div><dt>Skin shards</dt><dd>{{ game.loot.skinShards }}</dd></div>
        <div><dt>Crystals</dt><dd>{{ game.crystals }}</dd></div>
        <div><dt>Stars</dt><dd>{{ game.loot.prestige.stars }}</dd></div>
      </dl>
    </header>
    <nav class="workshop-tabs"><button v-for="[id, label] in tabs" :key="id" type="button" :class="{ active: tab === id }" @click="tab = id">{{ label }}</button></nav>
    <p v-if="game.loot.log[0]" class="workshop-log">{{ game.loot.log[0] }}</p>

    <div v-if="tab === 'equipment'" class="grid">
      <article v-for="item in EQUIPMENT" :key="item.id" class="card">
        <h3><span>{{ item.icon }}</span> {{ item.name }} <em :class="slot(item.id).tier">{{ slot(item.id).tier }}</em></h3>
        <p>{{ item.description }}</p>
        <b>Level {{ slot(item.id).level }} / {{ cap(item.id) }} · {{ effectText(item.id) }}</b>
        <progress :value="slot(item.id).level" :max="10"></progress>
        <div class="row">
          <button type="button" :disabled="slot(item.id).level >= cap(item.id)" @click="game.act({ type: 'upgradeEquipment', item: item.id })">
            Upgrade · {{ upgradeCostFor(slot(item.id).level).coins }} coins + {{ upgradeCostFor(slot(item.id).level).parts }} parts
          </button>
          <button v-if="TIER_SHARD_COST[slot(item.id).tier]" type="button" :disabled="(game.loot.itemShards[item.id] ?? 0) < TIER_SHARD_COST[slot(item.id).tier]!" @click="game.act({ type: 'promoteEquipment', item: item.id })">
            Raise tier · {{ game.loot.itemShards[item.id] ?? 0 }}/{{ TIER_SHARD_COST[slot(item.id).tier] }} shards
          </button>
        </div>
      </article>
      <p class="hint">Equipment belongs to the bar you are managing now. Serving guests drops workshop parts; boxes bring shards.</p>
    </div>

    <div v-else-if="tab === 'boxes'" class="grid">
      <article v-for="box in BOXES" :key="box.id" class="card">
        <h3><span>{{ box.icon }}</span> {{ box.name }} <b>×{{ boxCount(box.id) }}</b></h3>
        <p>{{ box.description }}</p>
        <div class="row">
          <button type="button" :disabled="!boxCount(box.id) || !!game.loot.pendingChoice" @click="game.act({ type: 'openBox', box: box.id })">Open</button>
          <button v-if="box.crystalPrice" type="button" :disabled="game.crystals < box.crystalPrice" @click="game.act({ type: 'buyBox', box: box.id })">Buy · {{ box.crystalPrice }} crystals</button>
        </div>
      </article>
      <article v-if="game.loot.pendingChoice" class="card choice">
        <h3>🧭 Pick one reward</h3>
        <div class="row"><button v-for="(reward, index) in game.loot.pendingChoice" :key="index" type="button" @click="game.act({ type: 'pickReward', index })">{{ describeReward(reward, names) }}</button></div>
      </article>
    </div>

    <div v-else-if="tab === 'items'" class="grid">
      <article v-for="item in CONSUMABLES" :key="item.id" class="card">
        <h3><span>{{ item.icon }}</span> {{ item.name }} <b>×{{ game.loot.consumables[item.id] ?? 0 }}</b></h3>
        <p>{{ item.description }}</p>
        <small v-if="boostLeft(item.id)">Active · {{ boostLeft(item.id) }}</small>
        <small v-else-if="game.loot.armed[item.id]">Armed for your next order</small>
        <select v-if="item.id === 'scroll'" v-model="scrollRecipe"><option value="">Choose a recipe</option><option v-for="recipe in knownRecipes" :key="recipe.id" :value="recipe.id">{{ recipe.name }}</option></select>
        <div class="row">
          <button type="button" :disabled="!game.loot.consumables[item.id] || (item.id === 'scroll' && !scrollRecipe)" @click="game.act({ type: 'useConsumable', id: item.id, recipeId: scrollRecipe })">Use</button>
          <button type="button" :disabled="game.crystals < item.crystalPrice" @click="game.act({ type: 'buyConsumable', id: item.id })">Buy · {{ item.crystalPrice }} crystals</button>
        </div>
      </article>
    </div>

    <div v-else-if="tab === 'draw'" class="draw">
      <article class="card">
        <h3>✨ Style draw</h3>
        <p>Odds: Common {{ DRAW_ODDS.common * 100 }}% · Rare {{ DRAW_ODDS.rare * 100 }}% · Legendary {{ DRAW_ODDS.legendary * 100 }}%. A Rare is guaranteed in every ten draws and a Legendary within {{ LEGENDARY_PITY }}.</p>
        <p v-if="featured">This week's featured Legendary: <b>{{ featured.label }}</b> (half of all Legendary wins).</p>
        <p>Pity: {{ game.loot.pity.sinceLegendary }} / {{ LEGENDARY_PITY }} · duplicates give {{ DUPLICATE_SHARDS.common }} / {{ DUPLICATE_SHARDS.rare }} / {{ DUPLICATE_SHARDS.legendary }} skin shards.</p>
        <div class="row">
          <button type="button" :disabled="game.crystals < DRAW_COST.single" @click="game.act({ type: 'drawStyle', count: 1 })">Draw ×1 · {{ DRAW_COST.single }}</button>
          <button type="button" :disabled="game.crystals < DRAW_COST.ten" @click="game.act({ type: 'drawStyle', count: 10 })">Draw ×10 · {{ DRAW_COST.ten }}</button>
        </div>
        <ul v-if="game.loot.lastDraw.length" class="results"><li v-for="(result, index) in game.loot.lastDraw" :key="index" :class="result.rarity">{{ result.label }}<small v-if="result.duplicate"> · duplicate +{{ result.shards }} shards</small></li></ul>
      </article>
      <article class="card">
        <h3>🧩 Craft with shards</h3>
        <p>Common {{ SHARD_CRAFT_COST.common }} · Rare {{ SHARD_CRAFT_COST.rare }} · Legendary {{ SHARD_CRAFT_COST.legendary }} skin shards.</p>
        <div class="crafts">
          <button v-for="item in lockedSkins" :key="item.id" type="button" :class="item.rarity" :disabled="game.loot.skinShards < SHARD_CRAFT_COST[item.rarity]" @click="game.act({ type: 'craftSkin', cosmeticId: item.id })">{{ item.label }} ({{ cosmeticKind(item.key) }}{{ item.character ? `, ${item.character}` : '' }}) · {{ SHARD_CRAFT_COST[item.rarity] }}</button>
          <p v-if="!lockedSkins.length">You own every style.</p>
        </div>
      </article>
    </div>

    <div v-else-if="tab === 'quests'" class="grid">
      <article v-for="item in quests" :key="item.quest.id" class="card">
        <h3>📋 Weekly quest</h3>
        <p>{{ item.quest.name }}</p>
        <progress :value="Math.min(item.progress, item.quest.target)" :max="item.quest.target"></progress>
        <b>{{ Math.min(item.progress, item.quest.target) }} / {{ item.quest.target }} · +{{ item.quest.crystals }} crystals + {{ item.quest.box }} box</b>
        <button type="button" :disabled="item.claimed || item.progress < item.quest.target" @click="game.act({ type: 'claimQuest', questId: item.quest.id })">{{ item.claimed ? 'Claimed' : 'Claim' }}</button>
      </article>
      <article class="card">
        <h3>🍷 Tasting log</h3>
        <p>{{ stat('tasted') }} recipes and {{ game.loot.tasted.length - stat('tasted') }} brands tasted. Serving a recipe for the first time gives parts and skin shards; a new brand gives a shard.</p>
      </article>
      <article v-for="goal in ACHIEVEMENTS" :key="goal.id" class="card">
        <h3>🏅 Achievement</h3>
        <p>{{ goal.name }}</p>
        <progress :value="Math.min(stat(goal.stat), goal.target)" :max="goal.target"></progress>
        <b>{{ Math.min(stat(goal.stat), goal.target) }} / {{ goal.target }} · +{{ goal.crystals }} crystals + {{ goal.box }} box</b>
        <button type="button" :disabled="game.loot.achievements.includes(goal.id) || stat(goal.stat) < goal.target" @click="game.act({ type: 'claimAchievement', id: goal.id })">{{ game.loot.achievements.includes(goal.id) ? 'Claimed' : 'Claim' }}</button>
      </article>
    </div>

    <div v-else class="grid">
      <article class="card">
        <h3>🏛️ Grand Opening</h3>
        <p>At level {{ PRESTIGE_LEVEL }} you can reopen your bars: coins, XP, stock and equipment reset. Recipes, styles, crystals, parts and boxes stay, and you earn prestige stars for permanent perks plus a Choice box.</p>
        <b>Opened {{ game.loot.prestige.count }} times · this run earns {{ runStars }} stars</b>
        <button type="button" :disabled="game.level < PRESTIGE_LEVEL" @click="game.act({ type: 'prestige' })">{{ game.level < PRESTIGE_LEVEL ? `Reach level ${PRESTIGE_LEVEL} (now ${game.level})` : 'Start a Grand Opening' }}</button>
      </article>
      <article v-for="perk in PRESTIGE_PERKS" :key="perk.id" class="card">
        <h3>{{ perk.name }} <b>{{ game.loot.prestige.perks[perk.id] ?? 0 }} / {{ perk.maxRank }}</b></h3>
        <p>{{ perk.description }}</p>
        <button type="button" :disabled="(game.loot.prestige.perks[perk.id] ?? 0) >= perk.maxRank || game.loot.prestige.stars < perkCost(game.loot.prestige.perks[perk.id] ?? 0)" @click="game.act({ type: 'buyPrestigePerk', perk: perk.id })">Buy · {{ perkCost(game.loot.prestige.perks[perk.id] ?? 0) }} stars</button>
      </article>
    </div>
  </section>
</template>

<style scoped>
.workshop{overflow:hidden}.workshop-hero{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:16px;padding:22px;background:radial-gradient(circle at 10% 20%,#4f334b,#16243a 66%);border-bottom:1px solid #354762}
.workshop-hero small{color:#e4b35c;font-size:9px;font-weight:900;letter-spacing:.12em}.workshop-hero h2{margin:5px 0;font:700 29px Georgia,serif}.workshop-hero p{margin:0;color:#bdc8d6;font-size:12px}
.workshop-hero dl{display:flex;gap:14px;margin:0}.workshop-hero dt{color:#91a2b5;font-size:9px;letter-spacing:.1em;text-transform:uppercase}.workshop-hero dd{margin:2px 0 0;color:#fff0c8;font:700 20px Georgia,serif}
.workshop-tabs{display:flex;gap:6px;padding:12px 14px 0;overflow-x:auto}.workshop-tabs button{padding:8px 12px;border:1px solid #40536c;border-radius:9px;background:#111c2d;color:#c7d3e0;font-weight:800;white-space:nowrap;cursor:pointer}.workshop-tabs button.active{border-color:#b78649;background:#3b2b1f;color:#fff0ce}
.workshop-log{margin:10px 14px 0;padding:8px 10px;border:1px solid #3e7756;border-radius:8px;background:#173425;color:#b9e5c6;font-size:11px}
.grid,.draw{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:10px;padding:14px}.draw{grid-template-columns:repeat(auto-fit,minmax(280px,1fr))}
.card{display:grid;align-content:start;gap:8px;padding:14px;border:1px solid #354762;border-radius:13px;background:#111c2d}.card h3{margin:0;font:700 17px Georgia,serif}.card p{margin:0;color:#aebdce;font-size:11px;line-height:1.45}.card>b{color:#f4d08e;font-size:11px}.card select{padding:8px;border:1px solid #40536c;border-radius:8px;background:#0c1625;color:#fff}
.card em{margin-left:6px;padding:2px 6px;border-radius:6px;background:#26364d;color:#c7d3e0;font-size:9px;font-style:normal;text-transform:uppercase}.card em.rare{background:#1d4b6e}.card em.legendary{background:#7a4d12;color:#ffe0a0}
.card progress{width:100%;accent-color:#e7b556}.row{display:flex;flex-wrap:wrap;gap:6px}.card button,.crafts button{padding:8px 10px;border:1px solid #a97938;border-radius:8px;background:#5f3d1c;color:#ffe9bd;font-weight:800;font-size:11px;cursor:pointer}.card button:disabled,.crafts button:disabled{opacity:.4;cursor:default}
.results{display:grid;gap:4px;margin:0;padding:0;list-style:none;font-size:11px}.results li{padding:5px 8px;border-radius:7px;background:#17253a}.results li.rare,.crafts .rare{border-color:#3f86b8;color:#bfe2ff}.results li.legendary,.crafts .legendary{background:#4a3210;color:#ffe0a0}
.crafts{display:flex;flex-wrap:wrap;gap:5px;max-height:260px;overflow:auto}.hint{grid-column:1/-1;margin:0;color:#93a5b9;font-size:11px}small{color:#e4b35c}
</style>
