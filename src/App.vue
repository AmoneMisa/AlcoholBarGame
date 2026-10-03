<script setup lang="ts">
import GuidePointer from './components/ui/GuidePointer.vue';
import TutorialTour from './components/ui/TutorialTour.vue';
import { computed, onMounted, onUnmounted, reactive, ref, watch } from 'vue';
import SectionTabs from './components/ui/SectionTabs.vue';
import { lazyPage } from './ui/lazy';
import BarChips from './components/game/BarChips.vue';
import UiButton from './components/ui/UiButton.vue';
import ModalDialog from './components/ui/ModalDialog.vue';
const PreparationScreen = lazyPage(() => import('./components/cocktails/PreparationScreen.vue'));
const BarScreenshot = lazyPage(() => import('./components/game/BarScreenshot.vue'));
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
import { ACHIEVEMENTS, questsForWeek, weekOf } from './domain/quests';
import { initMusic, musicOn, playSfx, refreshMusic, setMusicInterior } from './audio/index';

// Only the bar scene is needed for the first paint; every other screen is fetched when the player opens it.
const ConversationPopup = lazyPage(() => import('./components/conversation/ConversationPopup.vue'));
const ManagementDeck = lazyPage(() => import('./components/game/ManagementDeck.vue'));
const LearningPage = lazyPage(() => import('./components/learning/LearningPage.vue'));
const FriendsPage = lazyPage(() => import('./components/friends/FriendsPage.vue'));
const EventsPage = lazyPage(() => import('./components/game/EventsPage.vue'));
const StartingBarPicker = lazyPage(() => import('./components/game/StartingBarPicker.vue'));

const game = useGameStore();
const notifications = useNotificationsStore();
const view = ref('service');
const screenshotOpen = ref(false);
const characterInfoOpen = ref(false);
const characterInfoTab = ref('profile');
const managementView = ref('inventory');
// The management screens stay mounted once opened, so edits and scroll positions survive switching tabs.
const managementOpened = ref(false);
// Main activities stay in the bottom navigation. The avatar opens character information and settings.
const nav = [
  { id: 'service', label: 'Bar', mark: 'glass' },
  { id: 'english', label: 'Study', mark: 'chat' },
  { id: 'manage', label: 'Storage', mark: 'stock' },
  { id: 'circle', label: 'Circle', mark: 'heart' },
  { id: 'friends', label: 'Friends', mark: 'friends' }
];
const SECTIONS: Record<string, { id: string; label: string }[]> = {
  english: [{ id: 'learn', label: 'Learn' }, { id: 'recipes', label: 'Recipes' }, { id: 'advisor', label: 'Pairings' }],
  manage: [{ id: 'market', label: 'Market' }, { id: 'inventory', label: 'Inventory' }, { id: 'workshop', label: 'Workshop' }],
  events: [{ id: 'today', label: 'Today' }, { id: 'pass', label: 'Season pass' }, { id: 'wheel', label: 'Daily wheel' }, { id: 'quests', label: 'Quests' }],
  bar: [{ id: 'regions', label: 'Bars' }, { id: 'design', label: 'Design' }],
  character: [{ id: 'profile', label: 'Profile' }, { id: 'look', label: 'Look' }]
};
const sub = reactive<Record<string, string>>({ events: 'today', english: 'learn', manage: 'inventory', bar: 'regions', character: 'profile' });
// Older names (the tour, the training lessons and the header use them) lead to the right tab.
const LEGACY: Record<string, [string, string]> = {
  inventory: ['manage', 'inventory'], market: ['manage', 'market'], workshop: ['manage', 'workshop'],
  pass: ['events', 'pass'], wheel: ['events', 'wheel'], quests: ['events', 'quests'],
  recipes: ['english', 'recipes'], advisor: ['english', 'advisor'], regions: ['bar', 'regions'], design: ['bar', 'design'], profile: ['character', 'profile']
};
// Which part of the big management screen shows in each tab.
const DECK: Record<string, Record<string, string>> = {
  english: { recipes: 'recipes', advisor: 'advisor' }, manage: { market: 'market', inventory: 'inventory' }, bar: { regions: 'regions', design: 'design' }, character: { look: 'design' }
};
const deckView = computed(() => DECK[view.value]?.[sub[view.value] ?? ''] ?? '');
const designSection = computed(() => (view.value === 'bar' ? 'bar' : view.value === 'character' ? 'character' : undefined));
// What is waiting on the Events tabs: the pass rewards to claim, the wheel spins left, the quests ready to claim.
const questsReady = computed(() => {
  const week = weekOf(Date.now());
  const current = game.loot.quests.week === week;
  const quests = questsForWeek(week).filter((quest) => current && !game.loot.quests.claimed.includes(quest.id) && (game.loot.quests.progress[quest.stat] ?? 0) >= quest.target).length;
  const goals = ACHIEVEMENTS.filter((item) => !game.loot.achievements.includes(item.id) && game.achievementStat(item.stat) >= item.target
    && ACHIEVEMENTS.filter((other) => other.series === item.series && other.target < item.target).every((other) => game.loot.achievements.includes(other.id))).length;
  return quests + goals;
});
const eventBadge = (id: string) => view.value !== 'events' ? undefined : (id === 'pass' ? game.passReady : id === 'wheel' ? game.rouletteSpinsLeft : id === 'quests' ? questsReady.value : id === 'today' && game.dailyGiftAvailable ? 1 : 0) || undefined;
const sectionTabs = computed(() => (SECTIONS[view.value] ?? []).map((tab) => ({ ...tab, badge: eventBadge(tab.id) })));

// Music follows the bar's interior; taps on buttons get a soft click.
watch(() => game.decor.interior, (id) => setMusicInterior(id), { immediate: true });
watch(musicOn, refreshMusic);
onMounted(() => {
  initMusic();
  document.addEventListener('click', (event) => {
    if ((event.target as Element | null)?.closest('button, [role="button"], a')) playSfx('tap');
  });
});
// The first time the player is back in a day, the login reward opens by itself (after the first-bar choice and the tour).
let dailyShown = false;
watch(() => [game.sessionReady, game.startingBarChosen, game.tourSeen, game.dailyGiftAvailable] as const, ([ready, chosen, toured, available]) => {
  if (dailyShown || !ready || !chosen || !toured || !available) return;
  dailyShown = true;
  game.dailyOpen = true;
}, { immediate: true });
let socialTimer: ReturnType<typeof setInterval>;
onMounted(() => { socialTimer = setInterval(() => game.loadFriends(),60_000); });
onUnmounted(() => clearInterval(socialTimer));
// The loader in index.html stays until the game has connected (online or offline practice).
// Never trap the player behind the loader if the server does not answer.
const bootGuard = setTimeout(() => document.getElementById('boot')?.remove(), 20_000);
watch(() => game.sessionReady, (ready) => {
  if (!ready) return;
  clearTimeout(bootGuard);
  const boot = document.getElementById('boot');
  boot?.classList.add('done');
  setTimeout(() => boot?.remove(), 400);
}, { immediate: true });
watch(() => game.sessionReady, (ready) => {
  if (!ready) return;
  const today = calendarDate(new Date());
  if (game.dailyGiftAvailable) notifications.push('dailyReward','Daily reward is ready','Claim today’s login gift.',`daily-reward:${today}`);
  if (!game.dailyLessonsComplete) notifications.push('dailyLesson','Daily English quests','Complete today’s lessons for XP, crystals and a recipe chance.',`daily-lesson:${today}`);
}, { immediate:true });
watch(() => game.customers.map((customer) => customer.id).join(','),(next,previous) => {
  if (previous && next && next !== previous) notifications.push('customer','A new customer arrived','Open Bar and tap the guest to greet them.',`customer:${next}`);
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
  if (id === 'settings') { characterInfoTab.value = 'settings'; characterInfoOpen.value = true; return; }
  characterInfoOpen.value = false;
  const legacy = LEGACY[id];
  if (legacy) { view.value = legacy[0]; sub[legacy[0]] = legacy[1]; } else view.value = id;
}
// The management screen keeps the part it showed last, so switching tabs never blanks it.
watch(deckView, (part) => { if (part) { managementView.value = part; managementOpened.value = true; } }, { immediate: true });
</script>

<template>
  <div class="velvet-app" :class="{ 'service-mode': view === 'service' }" :inert="screenshotOpen || undefined">
    <TopHud @design="selectView('design')" @goto="selectView" @profile="characterInfoOpen = true" />
    <main>
      <section v-show="view === 'service'" class="service-layout">
        <BarScene :active="view === 'service'" @screenshot="screenshotOpen = true" />
      </section>
      <SectionTabs v-if="sectionTabs.length" v-model="sub[view]" :tabs="sectionTabs" :label="view" />
      <BarChips v-if="view === 'bar'" />
      <LearningPage v-if="view === 'english' && sub.english === 'learn'" />
      <section v-if="view === 'circle'" class="circle-page game-panel"><CompanionsPanel /></section>
      <FriendsPage v-if="view === 'friends'" />
      <EventsPage v-if="view === 'events'" :section="sub.events ?? 'today'" />
      <WorkshopPage v-if="view === 'manage' && sub.manage === 'workshop'" />
      <ProfilePage v-if="view === 'character' && sub.character === 'profile'" />
      <SettingsPage v-if="view === 'settings'" @goto="selectView" />
      <ManagementDeck v-if="managementOpened" v-show="!!deckView" :active-view="managementView" :design-section="designSection" />
    </main>
    <ConversationPopup v-if="game.conversationCustomerId" />
    <PreparationScreen v-if="game.preparationCustomerId" />
    <BarScreenshot v-if="screenshotOpen" @close="screenshotOpen = false" />
    <ModalDialog v-if="characterInfoOpen" title="Your character" class="character-info-popup" @close="characterInfoOpen = false">
      <SectionTabs v-model="characterInfoTab" :tabs="[{id:'profile',label:'Character'},{id:'settings',label:'Settings'}]" label="Character information" />
      <ProfilePage v-if="characterInfoTab === 'profile'" />
      <SettingsPage v-else @goto="selectView" />
      <UiButton v-if="characterInfoTab === 'profile'" @click="selectView('character'); sub.character = 'look'">Change appearance</UiButton>
    </ModalDialog>
    <GuideSheet />
    <NotificationToasts />
    <RewardPopup />
    <DailyRewardPopup v-if="game.dailyOpen" />
    <GuidePointer />
    <TutorialTour :ready="game.sessionReady && game.startingBarChosen" :seen="game.tourSeen" @finish="game.setTour" />
    <StartingBarPicker v-if="game.sessionReady && !game.startingBarChosen" />
    <nav class="game-nav" aria-label="Game views">
      <button v-for="item in nav" :key="item.id" :class="{ active: view === item.id }" :aria-current="view === item.id ? 'page' : undefined" :data-guide="'nav-' + item.id" type="button" @click="selectView(item.id)"><UiIcon :name="item.mark" /><b>{{ item.label }}</b><i v-if="badges[item.id]" class="nav-badge" :aria-label="`${badges[item.id]} waiting`">{{ badges[item.id] }}</i></button>
    </nav>
  </div>
</template>
