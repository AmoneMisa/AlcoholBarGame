<script setup lang="ts">
import UiButton from '../ui/UiButton.vue';
import UiInput from '../ui/UiInput.vue';
import PanelHeading from '../ui/PanelHeading.vue';
import { computed, nextTick, onMounted, ref } from 'vue';
import { RECIPES } from '../../domain/catalog';
import { INTERIORS } from '../../data/cosmetics/bars';
import { CONSUMABLES } from '../../domain/loot';
import { SHARD_GIFT_AMOUNTS } from '../../sim/gifts';
import { useGameStore } from '../../stores/game';
import { NOTIFICATION_EVENTS, useNotificationsStore } from '../../stores/notifications';
import CharacterModel from '../characters/CharacterModel.vue';
import ProfileCard from '../profile/ProfileCard.vue';
import UiIcon from '../ui/UiIcon.vue';

const PRESTIGE_GOAL = 30;
const game = useGameStore();
const notifications = useNotificationsStore();
const status = ref('');
const code = ref(new URLSearchParams(location.search).get('friend') ?? '');
const renaming = ref('');
const draftName = ref('');
const visitPanel = ref<HTMLElement>();
const giftsPanel = ref<HTMLElement>();
const accepted = computed(() => game.friends.filter((friend) => friend.status === 'accepted'));
const incoming = computed(() => game.friends.filter((friend) => friend.status === 'pending' && friend.direction === 'incoming'));
const outgoing = computed(() => game.friends.filter((friend) => friend.status === 'pending' && friend.direction === 'outgoing'));
// Gifts are spare copies from the player's own inventory: recipe cards and duplicate styles.
const recipeCards = computed(() => RECIPES.map((recipe) => ({ recipe, quantity: game.recipeCopies[recipe.id] ?? 0 })).filter((item) => item.quantity > 0));
const styleItems = computed(() => game.cosmetics.map((cosmetic) => ({ cosmetic, quantity: game.cosmeticCopies[cosmetic.id] ?? 0 })).filter((item) => item.quantity > 0));
const itemGifts = computed(() => CONSUMABLES.map((item) => ({ id: item.id, name: item.name, quantity: game.loot.consumables[item.id] ?? 0 })).filter((item) => item.quantity > 0));
const shardGifts = SHARD_GIFT_AMOUNTS;
const visit = computed(() => game.visitedFriend);
const visitBar = computed(() => visit.value?.bar as Record<string, string> | undefined);
const visitBackground = computed(() => INTERIORS.find((item) => item.id === visitBar.value?.interior)?.asset ?? INTERIORS[0]!.asset);
const friendName = (friend: { nickname: string; customName: string }) => friend.customName || friend.nickname;

const appLink = () => {
  const app = new URL(`${location.origin}${import.meta.env.BASE_URL}`);
  app.searchParams.set('friend', game.playerFriendCode);
  return app.toString();
};
function shareInvite() {
  const text = `Join my bar in Alcohol Lingo! My friend code: ${game.playerFriendCode}`;
  const link = `https://t.me/share/url?url=${encodeURIComponent(appLink())}&text=${encodeURIComponent(text)}`;
  if (window.Telegram?.WebApp?.openTelegramLink) window.Telegram.WebApp.openTelegramLink(link);
  else window.open(link, '_blank', 'noopener,noreferrer');
}
async function copyCode() {
  try { await navigator.clipboard.writeText(game.playerFriendCode); status.value = 'Code copied.'; }
  catch { status.value = `Your code: ${game.playerFriendCode}`; }
}
async function sendRequest() {
  if (!code.value.trim()) { status.value = 'Enter your friend’s code first.'; return; }
  if (await game.addFriend(code.value)) code.value = '';
  status.value = game.message;
}
async function answer(friendCode: string, accept: boolean) { await game.answerFriend(friendCode, accept); status.value = game.message; }
async function remove(friendCode: string, name: string) {
  if (!window.confirm(`Remove ${name} from your friends?`)) return;
  await game.removeFriend(friendCode); status.value = game.message;
}
function startRename(friendCode: string, current: string) { renaming.value = friendCode; draftName.value = current; }
async function saveRename() {
  await game.renameFriend(renaming.value, draftName.value);
  renaming.value = '';
}
async function goVisit(friendCode: string) {
  if (!await game.visitFriend(friendCode)) { status.value = game.message; return; }
  status.value = '';
  await nextTick();
  visitPanel.value?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
async function gift(request: Parameters<typeof game.giftFriend>[0]) {
  await game.giftFriend(request);
  status.value = game.message;
}
onMounted(() => { void game.loadFriends(); });
</script>

<template>
  <section class="friends-page game-panel">
    <PanelHeading eyebrow="YOUR BAR CIRCLE" title="Friends" :aside="`${accepted.length} ${accepted.length === 1 ? 'friend' : 'friends'}`" />
    <p v-if="status" class="friend-status" role="status" aria-live="polite">{{ status }}</p>

    <div class="friend-top">
      <article class="friend-code card">
        <small>YOUR FRIEND CODE</small>
        <b>{{ game.playerFriendCode || '…' }}</b>
        <p>It never changes. Share it so a friend can send you a request.</p>
        <div class="row"><UiButton variant="secondary" :disabled="!game.playerFriendCode" @click="copyCode"><UiIcon name="copy" />Copy</UiButton><UiButton variant="solid" :disabled="!game.playerFriendCode" @click="shareInvite"><UiIcon name="share" />Invite</UiButton></div>
      </article>
      <form class="card" @submit.prevent="sendRequest">
        <small>ADD A FRIEND</small>
        <label for="friend-code-input">Enter their friend code</label>
        <div class="row"><UiInput id="friend-code-input" v-model="code" autocomplete="off" autocapitalize="characters" maxlength="12" placeholder="ABCD-1234" /><UiButton variant="solid" type="submit"><UiIcon name="user-plus" />Send</UiButton></div>
        <p>They must accept before you can visit each other.</p>
      </form>
      <article class="prestige card">
        <small>PRESTIGE</small>
        <b><UiIcon name="trophy" />{{ game.popularity }} <em>/ {{ PRESTIGE_GOAL }}</em></b>
        <progress :value="Math.min(game.popularity, PRESTIGE_GOAL)" :max="PRESTIGE_GOAL"></progress>
        <p>Every friend who visits your bar once a day adds +1. At {{ PRESTIGE_GOAL }} you can spend it on a boost.</p>
        <div class="row boosts">
          <UiButton variant="secondary" size="sm" :disabled="game.popularity < PRESTIGE_GOAL || !!game.popularityBoost" @click="game.activatePopularityBoost('no-cooldown')">15 min rush</UiButton>
          <UiButton variant="secondary" size="sm" :disabled="game.popularity < PRESTIGE_GOAL || !!game.popularityBoost" @click="game.activatePopularityBoost('vip-run')">VIP run</UiButton>
        </div>
      </article>
    </div>

    <section v-if="incoming.length || outgoing.length" class="card requests">
      <header><small>REQUESTS</small></header>
      <article v-for="friend in incoming" :key="friend.code">
        <span><b>{{ friend.nickname }}</b><small>wants to join your circle · {{ friend.code }}</small></span>
        <UiButton variant="solid" @click="answer(friend.code, true)"><UiIcon name="check" />Accept</UiButton>
        <UiButton variant="secondary" @click="answer(friend.code, false)">Decline</UiButton>
      </article>
      <article v-for="friend in outgoing" :key="friend.code">
        <span><b>{{ friend.nickname }}</b><small>waiting for them to accept · {{ friend.code }}</small></span>
        <UiButton variant="secondary" @click="remove(friend.code, friend.nickname)">Cancel</UiButton>
      </article>
    </section>

    <section class="card friend-list">
      <header><div><small>FRIEND LIST</small><h3>Your people</h3></div></header>
      <p v-if="!accepted.length" class="empty"><UiIcon name="friends" />No friends yet. Send your code, or enter a friend’s code above.</p>
      <article v-for="friend in accepted" :key="friend.code" :class="{ visiting: visit?.code === friend.code }">
        <div class="who">
          <b>{{ friendName(friend) }}</b>
          <small v-if="friend.customName">{{ friend.nickname }}</small>
          <small>{{ friend.barName || 'Bar' }} · level {{ friend.level }}</small>
          <em><UiIcon name="trophy" />{{ friend.prestige }} prestige</em>
        </div>
        <div class="actions">
          <UiButton variant="solid" @click="goVisit(friend.code)"><UiIcon name="eye" />Visit</UiButton>
          <UiButton variant="secondary" size="sm" aria-label="Rename" title="Rename" @click="startRename(friend.code, friend.customName)"><UiIcon name="brush" /></UiButton>
          <UiButton variant="secondary" size="sm" aria-label="Remove friend" title="Remove friend" @click="remove(friend.code, friendName(friend))"><UiIcon name="trash" /></UiButton>
        </div>
        <form v-if="renaming === friend.code" class="rename" @submit.prevent="saveRename">
          <UiInput v-model="draftName" maxlength="28" :placeholder="`Name for ${friend.nickname}`" :aria-label="`Custom name for ${friend.nickname}`" />
          <UiButton variant="solid" type="submit">Save</UiButton><UiButton variant="secondary" @click="renaming = ''">Cancel</UiButton>
        </form>
      </article>
    </section>

    <section v-if="visit" ref="visitPanel" class="card visit">
      <header><div><small>VISITING NOW</small><h3>{{ visit.customName || visit.nickname }}’s bar</h3></div><UiButton variant="secondary" size="sm" @click="game.leaveVisit()">Leave</UiButton></header>
      <ProfileCard v-if="visit.profile" :name="visit.customName || visit.nickname" :level="visit.level" :profile="visit.profile" :look="visitBar">
        <template #actions>
          <UiButton variant="solid" @click="giftsPanel?.scrollIntoView({ behavior: 'smooth', block: 'center' })">Send a gift</UiButton>
          <UiButton variant="danger" @click="remove(visit.code, visit.customName || visit.nickname)">Remove from friends</UiButton>
        </template>
      </ProfileCard>
      <div class="visit-scene" :style="{ backgroundImage: `url('${visitBackground}')` }">
        <CharacterModel role="bartender" :character-id="visitBar?.bartenderCharacter ?? 'noa'" :outfit="visitBar?.bartender" :hair-style="visitBar?.hairStyle" :hair-color="visitBar?.hairColor" :body-shape="visitBar?.bodyShape" :skin-detail="visitBar?.skinDetail" :skin-tone="visitBar?.skinTone" :pose="visitBar?.pose" :eye-shape="visitBar?.eyeShape" :brow-shape="visitBar?.browShape" :nose-shape="visitBar?.noseShape" :lip-shape="visitBar?.lipShape" :cheek-shape="visitBar?.cheekShape" :eye-color="visitBar?.eyeColor" :eyeliner="visitBar?.eyeliner" :eyeshadow="visitBar?.eyeshadow" :lip-color="visitBar?.lipColor" :blush="visitBar?.blush" :facial-hair="visitBar?.facialHair" :outfit-color="visitBar?.outfitColor" animation="idle" />
        <span class="ribbon">{{ visitBar?.name || visit.name }}</span>
      </div>
      <ul class="visit-stats">
        <li><UiIcon name="star" />Level {{ visit.level }}</li>
        <li><UiIcon name="trophy" />{{ visit.prestige }} prestige</li>
        <li><UiIcon name="book" />{{ visit.recipes }} recipes</li>
        <li><UiIcon name="pin" />{{ visit.interiors }} backgrounds</li>
      </ul>
      <p v-if="visit.mastered.length" class="mastered">Mastered: {{ visit.mastered.map((item) => `${item.name} (lv ${item.level})`).join(' · ') }}</p>
      <div ref="giftsPanel" class="gifts">
        <header><UiIcon name="gift" /><div><small>GIFT FROM YOUR INVENTORY</small><p>Only spare copies can be given away — you keep everything else. Workshop items: up to 5 gifts a day.</p></div></header>
        <article v-for="item in recipeCards" :key="item.recipe.id"><span><b>{{ item.recipe.name }}</b><small>Recipe card · you have {{ item.quantity }}</small></span><UiButton variant="solid" size="sm" @click="gift({ kind: 'recipe-copy', recipeId: item.recipe.id })">Give</UiButton></article>
        <article v-for="item in styleItems" :key="item.cosmetic.id"><span><b>{{ item.cosmetic.label }}</b><small>Style · you have {{ item.quantity }}</small></span><UiButton variant="solid" size="sm" @click="gift({ kind: 'cosmetic-copy', cosmeticId: item.cosmetic.id })">Give</UiButton></article>
        <article v-for="item in itemGifts" :key="item.id"><span><b>{{ item.name }}</b><small>Workshop item · you have {{ item.quantity }}</small></span><UiButton variant="solid" size="sm" @click="gift({ kind: 'consumable', id: item.id })">Give</UiButton></article>
        <article v-for="amount in shardGifts" :key="amount"><span><b>{{ amount }} skin shards</b><small>You have {{ game.loot.skinShards }}</small></span><UiButton variant="solid" size="sm" :disabled="game.loot.skinShards < amount" @click="gift({ kind: 'skin-shards', amount })">Give</UiButton></article>
        <p v-if="!recipeCards.length && !styleItems.length && !itemGifts.length" class="empty">You have no spare cards or styles yet. Duplicates from VIP guests, lessons and the daily style draw show up here.</p>
      </div>
    </section>

    <section class="card notification-settings">
      <header><small>NOTIFICATIONS</small><h3>Choose what to be told about</h3></header>
      <label v-for="event in NOTIFICATION_EVENTS" :key="event.id"><span><b>{{ event.label }}</b><small>{{ event.detail }}</small></span><input type="checkbox" :checked="notifications.prefs[event.id]" @change="notifications.setEnabled(event.id, ($event.target as HTMLInputElement).checked)" /></label>
    </section>
  </section>
</template>

<style scoped>
.friends-page { display: grid; gap: 12px; padding-bottom: 14px; overflow: hidden; }
.friends-page > .panel-heading { margin: 0; }
.friends-page > * { margin-inline: 12px; }
.friends-page > .panel-heading { margin-inline: 0; }
.card { padding: 14px; border: 1px solid #354762; border-radius: 14px; background: #111c2d; }
.card small { display: block; color: #e4b35c; font-size: 9px; font-weight: 900; letter-spacing: .12em; }
.card h3 { margin: 3px 0 0; font: 700 20px Georgia, serif; }
.card p { margin: 0; color: #9eafc1; font-size: 12px; line-height: 1.5; }
.card header { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
.friend-status { padding: 9px 12px; border: 1px solid #3e7756; border-radius: 10px; background: #173425; color: #b9e5c6; font-size: 12px; }
.friend-top { display: grid; gap: 12px; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); }
.friend-top > .card { display: grid; align-content: start; gap: 8px; }
.friend-code b { color: #fff0c8; font: 700 28px Georgia, serif; letter-spacing: .1em; }
.row { display: flex; flex-wrap: wrap; gap: 8px; }
.row > * { flex: 1 1 120px; }
input { min-width: 0; min-height: 42px; padding: 8px 10px; border: 1px solid #40536c; border-radius: 10px; background: #0c1625; color: #fff; font-size: 16px; }
form.card label { color: #c7d2df; font-size: 12px; }
form.card { display: grid; align-content: start; gap: 8px; }
.prestige b { display: flex; align-items: center; gap: 8px; color: #fff0c8; font-size: 22px; }
.prestige b .ui-icon { width: 24px; height: 24px; color: #f2bd58; }
.prestige em { color: #8294aa; font-size: 14px; font-style: normal; }
.prestige progress { width: 100%; height: 10px; accent-color: #e7b556; }
.boosts button { font-size: 11px; line-height: 1.25; }
.requests { display: grid; gap: 8px; }
.requests > article { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; padding-top: 8px; border-top: 1px solid #304159; }
.requests > article > span { flex: 1 1 160px; display: grid; gap: 2px; }
.requests > article > span small { color: #91a2b5; font-size: 11px; font-weight: 500; letter-spacing: 0; }
.friend-list { display: grid; gap: 8px; }
.friend-list > article { display: grid; gap: 8px; padding: 12px; border: 1px solid #34465e; border-radius: 12px; background: #17253a; }
.friend-list > article.visiting { border-color: #d2a24e; }
.who { display: grid; gap: 2px; }
.who b { font-size: 16px; }
.who small { color: #b9c6d5; font-size: 12px; font-weight: 500; letter-spacing: 0; }
.who em { display: flex; align-items: center; gap: 5px; color: #f2bd58; font-size: 12px; font-style: normal; }
.who em .ui-icon { width: 15px; height: 15px; }
.actions { display: flex; gap: 8px; }
.actions .ui-btn-solid { flex: 1; }
.actions .ui-btn-sm { flex: none; width: 44px; padding: 0; }
.rename { display: flex; gap: 6px; }
.rename input { flex: 1; }
.empty { display: flex; align-items: center; gap: 10px; padding: 10px 0; color: #9eafc1; font-size: 13px; }
.empty .ui-icon { width: 28px; height: 28px; flex: none; color: #71849b; }
.visit { display: grid; gap: 10px; border-color: #d2a24e; }
.visit-scene { position: relative; height: clamp(220px, 46vw, 340px); overflow: hidden; border: 1px solid #4a5c75; border-radius: 12px; background-position: center; background-size: cover; }
.visit-scene :deep(.art-character) { position: absolute; right: 6%; bottom: -4%; width: auto; height: 96%; aspect-ratio: .572; }
.ribbon { position: absolute; left: 10px; bottom: 10px; max-width: calc(100% - 20px); padding: 5px 10px; border: 1px solid #d8a34e; border-radius: 6px; background: #1c1420e8; color: #ffe2a8; font: 700 13px Georgia, serif; }
.visit-stats { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 6px; margin: 0; padding: 0; list-style: none; }
.visit-stats li { display: flex; align-items: center; gap: 8px; padding: 8px 10px; border-radius: 9px; background: #0d1829; color: #f4d08e; font-size: 13px; font-weight: 700; }
.visit-stats .ui-icon { width: 18px; height: 18px; color: #f2bd58; }
.mastered { color: #aebdce; }
.gifts { display: grid; gap: 8px; padding-top: 10px; border-top: 1px solid #304159; }
.gifts > header { justify-content: flex-start; align-items: flex-start; }
.gifts > header > .ui-icon { width: 26px; height: 26px; flex: none; color: #f2bd58; }
.gifts > article { display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 8px 10px; border: 1px solid #34465e; border-radius: 10px; background: #17253a; }
.gifts > article span { display: grid; gap: 2px; }
.gifts > article small { color: #93a5b9; font-size: 11px; font-weight: 500; letter-spacing: 0; }
.gifts > article button { flex: none; min-width: 72px; }
.notification-settings { display: grid; gap: 2px; }
.notification-settings label { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 10px 0; border-top: 1px solid #2d4059; }
.notification-settings label span { display: grid; gap: 2px; }
.notification-settings label small { color: #91a2b5; font-weight: 500; letter-spacing: 0; text-transform: none; }
.notification-settings input { flex: none; width: 22px; height: 22px; min-height: 0; accent-color: #dca94e; }
@media (min-width: 900px) { .friend-list > article { grid-template-columns: 1fr auto; align-items: center; } .rename { grid-column: 1 / -1; } }
</style>
