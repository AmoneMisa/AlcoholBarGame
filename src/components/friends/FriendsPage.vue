<script setup lang="ts">
import { INTERIORS } from '../../data/cosmetics/bars';
import UiButton from '../ui/UiButton.vue';
import UiInput from '../ui/UiInput.vue';
import PanelHeading from '../ui/PanelHeading.vue';
import { computed, nextTick, onMounted, ref } from 'vue';
import { RECIPES } from '../../domain/catalog';
import { CONSUMABLES } from '../../domain/loot';
import { COSMETICS } from '../../domain/cosmetics';
import { SHARD_GIFT_AMOUNTS, STYLE_SHARD_GIFT_AMOUNTS } from '../../sim/gifts';
import { useGameStore } from '../../stores/game';
import BarShowcase from '../profile/BarShowcase.vue';
import TipJar from '../game/TipJar.vue';
import ProfileCard from '../profile/ProfileCard.vue';
import UiIcon from '../ui/UiIcon.vue';

const game = useGameStore();
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
const styleShardGifts = STYLE_SHARD_GIFT_AMOUNTS;
// Style shards are kept per style: one entry for each pile the player has.
const shardPiles = computed(() => Object.entries(game.loot.styleShards).map(([id, quantity]) => ({ id, quantity, label: COSMETICS.find((item) => item.id === id)?.label ?? INTERIORS.find(item=>`background:${item.id}`===id)?.name ?? id })).filter((item) => item.quantity > 0));
const visit = computed(() => game.visitedFriend);
const visitBar = computed(() => visit.value?.bar as Record<string, string> | undefined);
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
        <div class="row"><UiInput label="Friend code" id="friend-code-input" v-model="code" autocomplete="off" autocapitalize="characters" maxlength="12" placeholder="ABCD-1234" /><UiButton variant="solid" type="submit"><UiIcon name="user-plus" />Send</UiButton></div>
        <p>They must accept before you can visit each other.</p>
      </form>
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
          <UiInput label="Custom name" v-model="draftName" maxlength="28" :placeholder="`Name for ${friend.nickname}`" :aria-label="`Custom name for ${friend.nickname}`" />
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
      <BarShowcase :bar="visitBar" :name="visit.name"><TipJar visited /></BarShowcase>
      <p v-if="visit.tips">Tip jar: {{ visit.tips.amount.toFixed(0) }} / {{ visit.tips.capacity }} coins · {{ visit.tips.attemptsLeft }} theft attempts left today.<br>Tap the jar to take up to 5%. At least 30% stays protected. One attempt per player per day, 10 attempts total. Empty or protected jars also use an attempt.</p>
      <ul class="visit-stats">
        <li><UiIcon name="star" />Level {{ visit.level }}</li>
        <li><UiIcon name="trophy" />{{ visit.prestige }} prestige</li>
        <li><UiIcon name="book" />{{ visit.recipes }} recipes</li>
        <li><UiIcon name="pin" />{{ visit.interiors }} backgrounds</li>
      </ul>
      <p v-if="visit.mastered.length" class="mastered">Mastered: {{ visit.mastered.map((item) => `${item.name} (lv ${item.level})`).join(' · ') }}</p>
      <div ref="giftsPanel" class="gifts">
        <header><UiIcon name="gift" /><div><small>GIFT FROM YOUR INVENTORY</small><p>Spare copies can be given away, and so can things that only come from boxes (style shards, whole styles, event backgrounds): they leave you and go to your friend, and only if you have them and are not using them. Workshop gifts: up to 5 a day.</p></div></header>
        <article v-for="item in recipeCards" :key="item.recipe.id"><span><b>{{ item.recipe.name }}</b><small>Recipe card · you have {{ item.quantity }}</small></span><UiButton variant="solid" size="sm" @click="gift({ kind: 'recipe-copy', recipeId: item.recipe.id })">Give</UiButton></article>
        <article v-for="item in styleItems" :key="item.cosmetic.id"><span><b>{{ item.cosmetic.label }}</b><small>Style · you have {{ item.quantity }}</small></span><UiButton variant="solid" size="sm" @click="gift({ kind: 'cosmetic-copy', cosmeticId: item.cosmetic.id })">Give</UiButton></article>
        <article v-for="item in itemGifts" :key="item.id"><span><b>{{ item.name }}</b><small>Workshop item · you have {{ item.quantity }}</small></span><UiButton variant="solid" size="sm" @click="gift({ kind: 'consumable', id: item.id })">Give</UiButton></article>
        <article v-for="pile in shardPiles" :key="`style-${pile.id}`"><span><b>{{ pile.label }} shards</b><small>You give them away and lose them · you have {{ pile.quantity }}</small></span><span class="gift-amounts"><UiButton v-for="amount in styleShardGifts" :key="amount" variant="solid" size="sm" :disabled="pile.quantity < amount" @click="gift({ kind: 'style-shards', cosmeticId: pile.id, amount })">Give {{ amount }}</UiButton></span></article>
        <article v-for="item in game.giftableStyleItems" :key="item.id"><span><b>{{ item.label }}</b><small>Whole style · you lose it · not worn in any bar</small></span><UiButton variant="solid" size="sm" @click="gift({ kind: 'style-transfer', cosmeticId: item.id })">Give</UiButton></article>
        <article v-for="item in game.giftableBackgrounds" :key="item.id"><span><b>{{ item.name }}</b><small>Background with its style · you lose both · not used by any bar</small></span><UiButton variant="solid" size="sm" @click="gift({ kind: 'interior-transfer', interiorId: item.id })">Give</UiButton></article>
        <p v-if="!recipeCards.length && !styleItems.length && !itemGifts.length" class="empty">You have no spare cards or styles yet. Duplicates from VIP guests, lessons and the daily style draw show up here.</p>
      </div>
    </section>

  </section>
</template>

<style scoped>
.gift-amounts { display: flex; flex-wrap: wrap; gap: 6px; }
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
.friend-code b { color: #fff0c8; font: 800 26px ui-monospace, Consolas, "Courier New", monospace; letter-spacing: .12em; font-variant-numeric: lining-nums tabular-nums; }
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
@media (min-width: 900px) { .friend-list > article { grid-template-columns: 1fr auto; align-items: center; } .rename { grid-column: 1 / -1; } }
</style>
