<script setup lang="ts">
import GuidePointer from './components/ui/GuidePointer.vue';
import TutorialTour from './components/ui/TutorialTour.vue';
import PopularityBar from './components/game/PopularityBar.vue';
import { computed, onMounted, onUnmounted, reactive, ref, watch } from 'vue';
import SectionTabs from './components/ui/SectionTabs.vue';
import { lazyPage } from './ui/lazy';
import BarChips from './components/game/BarChips.vue';
import CocktailWorkspace from './components/cocktails/CocktailWorkspace.vue';
import BarScene from './components/game/BarScene.vue';
import TopHud from './components/game/TopHud.vue';
import GuideSheet from './components/knowledge/GuideSheet.vue';
import UiIcon from './components/ui/UiIcon.vue';
const CompanionsPanel = lazyPage(() => import('./components/workshop/CompanionsPanel.vue'));
const WorkshopPage = lazyPage(() => import('./components/workshop/WorkshopPage.vue'));
const ProfilePage = lazyPage(() => import('./components/profile/ProfilePage.vue'));
const SettingsPage = lazyPage(() => import('./components/settings/SettingsPage.vue'));
import NotificationToasts from './components/ui/NotificationToasts.vue';
import RewardPopup from './components/ui/RewardPopup.vue';
import DailyRewardPopup from './components/ui/DailyRewardPopup.vue';
import { useGameStore } from './stores/game';
import { useNotificationsStore } from './stores/notifications';
import { calendarDate } from './domain/economy';
import { initMusic, musicOn, playSfx, refreshMusic, setMusicInterior } from './audio/index';

// Only the bar scene is needed for the first paint; every other screen is fetched when the player opens it.
const ConversationPopup = lazyPage(() => import('./components/conversation/ConversationPopup.vue'));
const ManagementDeck = lazyPage(() => import('./components/game/ManagementDeck.vue'));
const LearningPage = lazyPage(() => import('./components/learning/LearningPage.vue'));
const FriendsPage = lazyPage(() => import('./components/friends/FriendsPage.vue'));
const StartingBarPicker = lazyPage(() => import('./components/game/StartingBarPicker.vue'));

const game = useGameStore();
const notifications = useNotificationsStore();
const view = ref('service');
const managementView = ref('inventory');
// The management screens stay mounted once opened, so edits and scroll positions survive switching tabs.
const managementOpened = ref(false);
// The bottom bar has six tabs. Screens that belong together are tabs inside one screen; the bar and the character
// open from the header (tap the bar name, or the bar icon).
const nav = [
  { id: 'service', label: 'Service', mark: 'glass' },
  { id: 'english', label: 'English', mark: 'chat' },
  { id: 'manage', label: 'Manage', mark: 'stock' },
  { id: 'circle', label: 'Circle', mark: 'heart' },
  { id: 'friends', label: 'Friends', mark: 'friends' },
  { id: 'settings', label: 'Settings', mark: 'settings' }
];
const SECTIONS: Record<string, { id: string; label: string }[]> = {
  english: [{ id: 'learn', label: 'Learn' }, { id: 'recipes', label: 'Recipes' }, { id: 'advisor', label: 'Pairings' }],
  manage: [{ id: 'market', label: 'Market' }, { id: 'inventory', label: 'Inventory' }, { id: 'workshop', label: 'Workshop' }],
  bar: [{ id: 'regions', label: 'Bars' }, { id: 'design', label: 'Design' }],
  character: [{ id: 'profile', label: 'Profile' }, { id: 'look', label: 'Look' }]
};
const sub = reactive<Record<string, string>>({ english: 'learn', manage: 'market', bar: 'regions', character: 'profile' });
// Older names (the tour, the training lessons and the header use them) lead to the right tab.
const LEGACY: Record<string, [string, string]> = {
  inventory: ['manage', 'inventory'], market: ['manage', 'market'], workshop: ['manage', 'workshop'],
  recipes: ['english', 'recipes'], advisor: ['english', 'advisor'], regions: ['bar', 'regions'], design: ['bar', 'design'], profile: ['character', 'profile']
};
// Which part of the big management screen shows in each tab.
const DECK: Record<string, Record<string, string>> = {
  english: { recipes: 'recipes', advisor: 'advisor' }, manage: { market: 'market', inventory: 'inventory' }, bar: { regions: 'regions', design: 'design' }, character: { look: 'design' }
};
const deckView = computed(() => DECK[view.value]?.[sub[view.value] ?? ''] ?? '');
const designSection = computed(() => (view.value === 'bar' ? 'bar' : view.value === 'character' ? 'character' : undefined));
const sectionTabs = computed(() => (SECTIONS[view.value] ?? []).map((tab) => ({ ...tab, badge: view.value === 'bar' && tab.id === 'design' && game.cosmeticRouletteAvailable ? 1 : undefined })));

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
// Workshop: a new box to open, and boosters that have just run out.
import { seasonAt } from './domain/seasons';
import { weeklyRewardNotice } from './domain/leaderboard';
import { fetchLeaderboard } from './telegram/api';
// Online only: when a new week has started and last week paid a reward, tell the player once.
async function checkWeeklyReward() {
  if (game.mode !== 'online') return;
  try {
    const board = await fetchLeaderboard();
    const notice = weeklyRewardNotice(board.previous);
    if (notice) notifications.push('leaderboard', notice.title, notice.text, notice.key);
  } catch { /* offline or rate-limited: try again later */ }
}
let weeklyTimer: ReturnType<typeof setInterval>;
onMounted(() => { weeklyTimer = setInterval(() => void checkWeeklyReward(), 30 * 60_000); });
onUnmounted(() => clearInterval(weeklyTimer));
watch(() => game.sessionReady, (ready) => { if (ready) void checkWeeklyReward(); }, { immediate: true });
watch(() => game.sessionReady, (ready) => {
  if (!ready) return;
  const season = seasonAt(Date.now());
  notifications.push('loot', `New season: ${season.name}`, 'A seasonal style banner is live in the Workshop.', `season:${season.id}`);
}, { immediate: true });
const boxTotal = () => Object.values(game.loot.boxes).reduce((sum, count) => sum + count, 0);
let boxEpoch = game.connectEpoch;
watch(boxTotal, (next, previous) => {
  // The first server state replaces the local one: boxes that were already waiting are not "new".
  if (game.connectEpoch !== boxEpoch) { boxEpoch = game.connectEpoch; return; }
  if (previous !== undefined && next > previous) notifications.push('loot', 'You got a box', 'Open it in the Workshop.');
});
const boostNames: Record<string, string> = { 'happy-hour': 'Happy Hour', 'xp-boost': 'XP Booster', 'coin-boost': 'Coin Booster', 'tip-boost': 'Tip Booster' };
const announcedBoosts = new Set<string>();   // in memory only: a stored key per booster would grow forever
let boostTimer: ReturnType<typeof setInterval>;
onMounted(() => {
  boostTimer = setInterval(() => {
    for (const [kind, until] of Object.entries(game.loot.boosts)) {
      const key = `${kind}:${until}`;
      if (until <= Date.now() && until > Date.now() - 120_000 && !announcedBoosts.has(key)) {
        announcedBoosts.add(key);
        notifications.push('loot', `${boostNames[kind] ?? kind} ended`, 'Use another one from the Workshop.');
      }
    }
  }, 15_000);
});
onUnmounted(() => clearInterval(boostTimer));
watch(() => game.message,(message,previous) => {
  if (!message || message === previous) return;
  if (/visited your bar/i.test(message)) notifications.push('friendVisit','A friend visited',message,`visit:${message}`);
});

// Small counters on the tabs: what is waiting for the player.
const badges = computed<Record<string, number>>(() => ({
  // A number on a tab means something is waiting for the player to act, not just that something is going on.
  service: game.deliveryIssues.filter((issue) => issue.status === 'open').length,
  english: game.dailyLessonsComplete ? 0 : 1,
  manage: 0,
  friends: game.friends.filter((friend) => friend.status === 'pending' && friend.direction === 'incoming').length
}));

function selectView(id: string) {
  const legacy = LEGACY[id];
  if (legacy) { view.value = legacy[0]; sub[legacy[0]] = legacy[1]; } else view.value = id;
}
// The management screen keeps the part it showed last, so switching tabs never blanks it.
watch(deckView, (part) => { if (part) { managementView.value = part; managementOpened.value = true; } }, { immediate: true });
</script>

<template>
  <div class="velvet-app">
    <TopHud @design="selectView('design')" @goto="selectView" />
    <main>
      <section v-show="view === 'service'" class="service-layout">
        <PopularityBar />
        <BarScene :active="view === 'service'" />
        <CocktailWorkspace />
      </section>
      <SectionTabs v-if="sectionTabs.length" v-model="sub[view]" :tabs="sectionTabs" :label="view" />
      <BarChips v-if="view === 'bar'" />
      <LearningPage v-if="view === 'english' && sub.english === 'learn'" />
      <section v-if="view === 'circle'" class="circle-page game-panel"><CompanionsPanel /></section>
      <FriendsPage v-if="view === 'friends'" />
      <WorkshopPage v-if="view === 'manage' && sub.manage === 'workshop'" />
      <ProfilePage v-if="view === 'character' && sub.character === 'profile'" />
      <SettingsPage v-if="view === 'settings'" @goto="selectView" />
      <ManagementDeck v-if="managementOpened" v-show="!!deckView" :active-view="managementView" :design-section="designSection" />
    </main>
    <ConversationPopup v-if="game.conversationCustomerId" />
    <GuideSheet />
    <NotificationToasts />
    <RewardPopup />
    <DailyRewardPopup v-if="game.dailyOpen" />
    <GuidePointer />
    <TutorialTour :ready="game.sessionReady && game.startingBarChosen" :seen="game.tourSeen" @finish="game.setTour" />
    <StartingBarPicker v-if="game.sessionReady && !game.startingBarChosen" />
    <nav class="game-nav" aria-label="Game views">
      <button v-for="item in nav" :key="item.id" :class="{ active: view === item.id }" :data-guide="'nav-' + item.id" type="button" @click="selectView(item.id)"><UiIcon :name="item.mark" /><b>{{ item.label }}</b><i v-if="badges[item.id]" class="nav-badge" :aria-label="`${badges[item.id]} waiting`">{{ badges[item.id] }}</i></button>
    </nav>
  </div>
</template>
