<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue';
import CocktailWorkspace from './components/cocktails/CocktailWorkspace.vue';
import ConversationPopup from './components/conversation/ConversationPopup.vue';
import BarScene from './components/game/BarScene.vue';
import ManagementDeck from './components/game/ManagementDeck.vue';
import TopHud from './components/game/TopHud.vue';
import LearningPage from './components/learning/LearningPage.vue';
import GuideSheet from './components/knowledge/GuideSheet.vue';
import UiIcon from './components/ui/UiIcon.vue';
import FriendsPage from './components/friends/FriendsPage.vue';
import StartingBarPicker from './components/game/StartingBarPicker.vue';
import NotificationToasts from './components/ui/NotificationToasts.vue';
import { useGameStore } from './stores/game';
import { useNotificationsStore } from './stores/notifications';
import { calendarDate } from './domain/economy';
import { initMusic, musicOn, playSfx, refreshMusic, setMusicInterior } from './audio/index';

const game = useGameStore();
const notifications = useNotificationsStore();
const view = ref('service');
const managementView = ref('inventory');
const nav = [
  { id: 'service', label: 'Service', mark: 'glass' },
  { id: 'english', label: 'English', mark: 'chat' },
  { id: 'inventory', label: 'Inventory', mark: 'stock' },
  { id: 'market', label: 'Market', mark: 'basket' },
  { id: 'recipes', label: 'Recipes', mark: 'book' },
  { id: 'design', label: 'Design', mark: 'brush' },
  { id: 'regions', label: 'Cities', mark: 'pin' },
  { id: 'advisor', label: 'Pairings', mark: 'pair' },
  { id: 'friends', label: 'Friends', mark: 'friends' }
];

// Music follows the bar's interior; taps on buttons get a soft click.
watch(() => game.decor.interior, (id) => setMusicInterior(id), { immediate: true });
watch(musicOn, refreshMusic);
onMounted(() => {
  initMusic();
  document.addEventListener('click', (event) => {
    if ((event.target as Element | null)?.closest('button, [role="button"], a')) playSfx('tap');
  });
});
let socialTimer: ReturnType<typeof setInterval>;
onMounted(() => { socialTimer = setInterval(() => game.loadFriends(),60_000); });
onUnmounted(() => clearInterval(socialTimer));
watch(() => game.sessionReady, (ready) => {
  if (!ready) return;
  const today = calendarDate(new Date());
  if (game.dailyGiftAvailable) notifications.push('dailyReward','Daily reward is ready','Claim today’s login gift.',`daily-reward:${today}`);
  if (!game.dailyLessonsComplete) notifications.push('dailyLesson','Daily English quests','Complete today’s lessons for XP, crystals and a recipe chance.',`daily-lesson:${today}`);
}, { immediate:true });
watch(() => game.customers.map((customer) => customer.id).join(','),(next,previous) => {
  if (previous && next && next !== previous) notifications.push('customer','A new customer arrived','Open Service to greet the new guest.',`customer:${next}`);
});
watch(() => game.friends.filter((friend) => friend.status === 'pending' && friend.direction === 'incoming').map((friend) => friend.code).join(','),(next,previous) => {
  if (next && next !== previous) notifications.push('friendRequest','New friend request','Open Friends to accept or decline.',`friend-request:${next}`);
});
watch(() => game.message,(message,previous) => {
  if (!message || message === previous) return;
  if (/visited your bar/i.test(message)) notifications.push('friendVisit','A friend visited',message,`visit:${message}`);
  else if (/gave you|reward|gift|unlocked/i.test(message)) notifications.push('reward','Reward received',message);
});

function selectView(id: string) {
  view.value = id;
  if (id !== 'service' && id !== 'english') managementView.value = id;
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
      <LearningPage v-if="view === 'english'" />
      <FriendsPage v-if="view === 'friends'" />
      <ManagementDeck v-show="view !== 'service' && view !== 'english' && view !== 'friends'" :active-view="managementView" />
    </main>
    <ConversationPopup v-if="game.conversationCustomerId" />
    <GuideSheet />
    <NotificationToasts />
    <StartingBarPicker v-if="game.sessionReady && !game.startingBarChosen" />
    <nav class="game-nav" aria-label="Game views">
      <button v-for="item in nav" :key="item.id" :class="{ active: view === item.id }" type="button" @click="selectView(item.id)"><UiIcon :name="item.mark" /><b>{{ item.label }}</b></button>
    </nav>
  </div>
</template>
