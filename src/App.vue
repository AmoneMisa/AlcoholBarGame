<script setup lang="ts">
import GuidePointer from './components/ui/GuidePointer.vue';
import TutorialTour from './components/ui/TutorialTour.vue';
import { computed, defineAsyncComponent, onMounted, onUnmounted, ref, watch } from 'vue';
import CocktailWorkspace from './components/cocktails/CocktailWorkspace.vue';
import BarScene from './components/game/BarScene.vue';
import TopHud from './components/game/TopHud.vue';
import GuideSheet from './components/knowledge/GuideSheet.vue';
import UiIcon from './components/ui/UiIcon.vue';
import NotificationToasts from './components/ui/NotificationToasts.vue';
import RewardPopup from './components/ui/RewardPopup.vue';
import DailyRewardPopup from './components/ui/DailyRewardPopup.vue';
import { useGameStore } from './stores/game';
import { useNotificationsStore } from './stores/notifications';
import { calendarDate } from './domain/economy';
import { initMusic, musicOn, playSfx, refreshMusic, setMusicInterior } from './audio/index';

// Only the bar scene is needed for the first paint; every other screen is fetched when the player opens it.
const ConversationPopup = defineAsyncComponent(() => import('./components/conversation/ConversationPopup.vue'));
const ManagementDeck = defineAsyncComponent(() => import('./components/game/ManagementDeck.vue'));
const LearningPage = defineAsyncComponent(() => import('./components/learning/LearningPage.vue'));
const FriendsPage = defineAsyncComponent(() => import('./components/friends/FriendsPage.vue'));
const StartingBarPicker = defineAsyncComponent(() => import('./components/game/StartingBarPicker.vue'));

const game = useGameStore();
const notifications = useNotificationsStore();
const view = ref('service');
const managementView = ref('inventory');
// The management screens stay mounted once opened, so edits and scroll positions survive switching tabs.
const managementOpened = ref(false);
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
});

// Small counters on the tabs: what is waiting for the player.
const badges = computed<Record<string, number>>(() => ({
  service: (game.barEvent ? 1 : 0) + game.deliveryIssues.filter((issue) => issue.status === 'open').length,
  english: game.dailyLessonsComplete ? 0 : 1,
  market: game.economy.event ? 1 : 0,
  design: game.cosmeticRouletteAvailable ? 1 : 0,
  friends: game.friends.filter((friend) => friend.status === 'pending' && friend.direction === 'incoming').length
}));

function selectView(id: string) {
  view.value = id;
  if (id !== 'service' && id !== 'english' && id !== 'friends') { managementView.value = id; managementOpened.value = true; }
}
</script>

<template>
  <div class="velvet-app">
    <TopHud @design="selectView('design')" @goto="selectView" />
    <main>
      <section v-show="view === 'service'" class="service-layout">
        <BarScene :active="view === 'service'" />
        <CocktailWorkspace />
      </section>
      <LearningPage v-if="view === 'english'" />
      <FriendsPage v-if="view === 'friends'" />
      <ManagementDeck v-if="managementOpened" v-show="view !== 'service' && view !== 'english' && view !== 'friends'" :active-view="managementView" />
    </main>
    <ConversationPopup v-if="game.conversationCustomerId" />
    <GuideSheet />
    <NotificationToasts />
    <RewardPopup />
    <DailyRewardPopup v-if="game.dailyOpen" />
    <GuidePointer />
    <TutorialTour :ready="game.sessionReady && game.startingBarChosen" :seen="game.tourSeen" @view="selectView" @finish="game.setTour" />
    <StartingBarPicker v-if="game.sessionReady && !game.startingBarChosen" />
    <nav class="game-nav" aria-label="Game views">
      <button v-for="item in nav" :key="item.id" :class="{ active: view === item.id }" :data-guide="'nav-' + item.id" type="button" @click="selectView(item.id)"><UiIcon :name="item.mark" /><b>{{ item.label }}</b><i v-if="badges[item.id]" class="nav-badge" :aria-label="`${badges[item.id]} waiting`">{{ badges[item.id] }}</i></button>
    </nav>
  </div>
</template>
