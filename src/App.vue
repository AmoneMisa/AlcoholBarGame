<script setup lang="ts">
import { ref } from 'vue';
import CocktailWorkspace from './components/cocktails/CocktailWorkspace.vue';
import ConversationPopup from './components/conversation/ConversationPopup.vue';
import BarScene from './components/game/BarScene.vue';
import ManagementDeck from './components/game/ManagementDeck.vue';
import TopHud from './components/game/TopHud.vue';
import UiIcon from './components/ui/UiIcon.vue';
import { useGameStore } from './stores/game';

const game = useGameStore();
const view = ref('service');
const managementView = ref('inventory');
const nav = [
  { id: 'service', label: 'Service', mark: 'glass' },
  { id: 'inventory', label: 'Stock', mark: 'stock' },
  { id: 'market', label: 'Market', mark: 'basket' },
  { id: 'recipes', label: 'Recipes', mark: 'book' },
  { id: 'design', label: 'Design', mark: 'brush' },
  { id: 'regions', label: 'Cities', mark: 'pin' },
  { id: 'advisor', label: 'Pairings', mark: 'pair' }
];

function selectView(id: string) {
  view.value = id;
  if (id !== 'service') managementView.value = id;
}
</script>

<template>
  <div class="velvet-app">
    <TopHud @design="selectView('design')" />
    <main>
      <section v-show="view === 'service'" class="service-layout">
        <BarScene :active="view === 'service'" />
        <CocktailWorkspace />
      </section>
      <ManagementDeck v-show="view !== 'service'" :active-view="managementView" />
    </main>
    <ConversationPopup v-if="game.conversationCustomerId" />
    <nav class="game-nav" aria-label="Game views">
      <button v-for="item in nav" :key="item.id" :class="{ active: view === item.id }" type="button" @click="selectView(item.id)"><UiIcon :name="item.mark" /><b>{{ item.label }}</b></button>
    </nav>
  </div>
</template>
