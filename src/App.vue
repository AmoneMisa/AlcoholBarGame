<script setup lang="ts">
import { computed, ref } from 'vue';
import CocktailWorkspace from './components/cocktails/CocktailWorkspace.vue';
import DialogueWindow from './components/dialogue/DialogueWindow.vue';
import BarScene from './components/game/BarScene.vue';
import ManagementDeck from './components/game/ManagementDeck.vue';
import TopHud from './components/game/TopHud.vue';
import { CUSTOMER_ART_BY_SLOT } from './data/cosmetics/artCatalog';
import { DIALOGUE_SCENARIOS } from './data/dialogue/scenarios';
import { useGameStore } from './stores/game';

const game = useGameStore();
const view = ref('service');
const managementView = ref('inventory');
const scenarioIndex = ref(0);
const scenario = computed(() => DIALOGUE_SCENARIOS[scenarioIndex.value % DIALOGUE_SCENARIOS.length]!);
const portraitId = computed(() => CUSTOMER_ART_BY_SLOT[Math.max(0, game.customers.findIndex((item) => item.id === game.activeCustomerId)) % CUSTOMER_ART_BY_SLOT.length]);
const nav = [
  { id: 'service', label: 'Service', mark: '✦' },
  { id: 'inventory', label: 'Stock', mark: '▦' },
  { id: 'market', label: 'Market', mark: '◇' },
  { id: 'recipes', label: 'Recipes', mark: '⌁' },
  { id: 'design', label: 'Design', mark: '◐' },
  { id: 'regions', label: 'Cities', mark: '⌖' },
  { id: 'advisor', label: 'Pairings', mark: '◎' }
];

function selectView(id: string) {
  view.value = id;
  if (id !== 'service') managementView.value = id;
}
function nextScenario() { scenarioIndex.value = (scenarioIndex.value + 1) % DIALOGUE_SCENARIOS.length; }
</script>

<template>
  <div class="velvet-app">
    <TopHud />
    <main>
      <section v-show="view === 'service'" class="service-layout">
        <BarScene />
        <DialogueWindow :key="scenario.id + game.activeCustomerId" :scenario="scenario" :portrait-id="portraitId" @action="nextScenario" />
        <CocktailWorkspace />
      </section>
      <ManagementDeck v-show="view !== 'service'" :active-view="managementView" />
    </main>
    <nav class="game-nav" aria-label="Game views">
      <button v-for="item in nav" :key="item.id" :class="{ active: view === item.id }" type="button" @click="selectView(item.id)"><span>{{ item.mark }}</span><b>{{ item.label }}</b></button>
    </nav>
  </div>
</template>
