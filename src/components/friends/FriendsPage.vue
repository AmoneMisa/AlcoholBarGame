<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { RECIPES } from '../../domain/catalog';
import { useGameStore } from '../../stores/game';
import { NOTIFICATION_EVENTS, useNotificationsStore } from '../../stores/notifications';
import UiIcon from '../ui/UiIcon.vue';

const game = useGameStore();
const notifications = useNotificationsStore();
const inviteStatus = ref('');
const searchCode = ref(new URLSearchParams(location.search).get('friend') ?? '');
const labels = ref<Record<string,string>>({});
const giftOpen = ref(false);
const accepted = computed(() => game.friends.filter((friend) => friend.status === 'accepted'));
const incoming = computed(() => game.friends.filter((friend) => friend.status === 'pending' && friend.direction === 'incoming'));
const outgoing = computed(() => game.friends.filter((friend) => friend.status === 'pending' && friend.direction === 'outgoing'));
const recipeCards = computed(() => RECIPES.map((recipe) => ({ recipe, quantity:game.recipeCopies[recipe.id] ?? 0 })).filter((item) => item.quantity > 0));
const styleItems = computed(() => game.cosmetics.map((cosmetic) => ({ cosmetic, quantity:game.cosmeticCopies[cosmetic.id] ?? 0 })).filter((item) => item.quantity > 0));

async function shareInvite() {
  const app = new URL(`${location.origin}${import.meta.env.BASE_URL}`);
  app.searchParams.set('friend',game.playerFriendCode);
  const text = `Join my bar in Alcohol Lingo. My friend code is ${game.playerFriendCode}.`;
  const telegramShare = `https://t.me/share/url?url=${encodeURIComponent(app.toString())}&text=${encodeURIComponent(text)}`;
  if (window.Telegram?.WebApp?.openTelegramLink) window.Telegram.WebApp.openTelegramLink(telegramShare);
  else window.open(telegramShare,'_blank','noopener,noreferrer');
  inviteStatus.value = 'Telegram invitation opened.';
}
async function add() {
  if (await game.addFriend(searchCode.value)) searchCode.value = '';
}
async function saveLabel(code:string,current:string) {
  await game.renameFriend(code,labels.value[code] ?? current);
}
onMounted(async () => {
  await game.loadFriends();
  for (const friend of game.friends) labels.value[friend.code] = friend.customName;
});
</script>

<template>
  <section class="friends-page game-panel">
    <header class="friends-hero">
      <div><small>YOUR BAR CIRCLE</small><h2>Friends</h2><p>Visit friends, send a gift from their bar and grow each other’s popularity.</p></div>
      <button type="button" @click="shareInvite"><UiIcon name="friends" /><span><b>Invite in Telegram</b><small>Share the game and your code</small></span></button>
    </header>
    <p v-if="inviteStatus" class="friend-status" aria-live="polite">{{ inviteStatus }}</p>

    <div class="friend-tools">
      <article class="friend-code"><small>YOUR PERMANENT FRIEND CODE</small><b>{{ game.playerFriendCode || '—' }}</b><span>This numeric code never changes.</span></article>
      <form @submit.prevent="add"><label for="friend-search">FIND A PLAYER</label><div><input id="friend-search" v-model="searchCode" inputmode="numeric" pattern="[0-9]*" maxlength="12" placeholder="Numeric friend code" /><button type="submit">Send request</button></div></form>
      <article class="popularity"><small>POPULARITY</small><b>{{ game.popularity }} / 30</b><progress :value="Math.min(game.popularity,30)" max="30"></progress><p>Each first visit of the day gives the bar owner +1.</p><div><button type="button" :disabled="game.popularity < 30 || !!game.popularityBoost" @click="game.activatePopularityBoost('no-cooldown')">15 min · no guest cooldown</button><button type="button" :disabled="game.popularity < 30 || !!game.popularityBoost" @click="game.activatePopularityBoost('vip-run')">3–5 VIP guests</button></div></article>
    </div>

    <section v-if="incoming.length" class="request-list"><header><small>NEW REQUESTS</small><h3>Confirm who joins your circle</h3></header><article v-for="friend in incoming" :key="friend.code"><span><b>{{ friend.nickname }}</b><small>Code {{ friend.code }}</small></span><button type="button" @click="game.answerFriend(friend.code,true)">Accept</button><button class="quiet" type="button" @click="game.answerFriend(friend.code,false)">Decline</button></article></section>
    <p v-if="outgoing.length" class="pending-line">Waiting for: {{ outgoing.map((friend) => friend.nickname).join(', ') }}</p>

    <div class="friends-layout">
      <section class="friends-list">
        <header><div><small>FRIEND LIST</small><h3>Your people</h3></div><span>{{ accepted.length }} connected</span></header>
        <div v-if="accepted.length" class="friend-cards"><article v-for="friend in accepted" :key="friend.code"><div><b>{{ friend.nickname }}</b><small v-if="friend.customName">{{ friend.customName }}</small><em>Code {{ friend.code }}</em></div><div class="friend-alias"><input v-model="labels[friend.code]" maxlength="28" :placeholder="friend.customName || 'Add a one-line name'" :aria-label="`Custom name for ${friend.nickname}`" /><button type="button" @click="saveLabel(friend.code,friend.customName)">Save</button></div><button class="visit" type="button" @click="game.visitFriend(friend.code)">Visit bar</button></article></div>
        <div v-else class="friends-empty"><UiIcon name="friends" /><h3>No friends connected yet</h3><p>Find each other by the permanent numeric code, then confirm the incoming request.</p><button type="button" @click="shareInvite">Invite in Telegram</button></div>
      </section>

      <aside v-if="game.visitedFriend" class="friend-visit">
        <small>VISITING NOW</small><h3>{{ game.visitedFriend.nickname }}</h3><p v-if="game.visitedFriend.customName">{{ game.visitedFriend.customName }}</p><strong>{{ game.visitedFriend.name }} · level {{ game.visitedFriend.level }}</strong><ul><li>{{ game.visitedFriend.recipes }} recipes</li><li>{{ game.visitedFriend.interiors }} interiors</li></ul>
        <button class="gift-toggle" type="button" @click="giftOpen=!giftOpen"><UiIcon name="gift" /> Send a gift</button>
        <div v-if="giftOpen" class="gift-inventory"><small>CHOOSE FROM YOUR INVENTORY</small><article v-for="item in recipeCards" :key="item.recipe.id"><span>{{ item.recipe.name }} <b>×{{ item.quantity }}</b></span><button type="button" @click="game.giftFriend({kind:'recipe-copy',recipeId:item.recipe.id})">Send</button></article><article v-for="item in styleItems" :key="item.cosmetic.id"><span>{{ item.cosmetic.label }} <b>×{{ item.quantity }}</b></span><button type="button" @click="game.giftFriend({kind:'cosmetic-copy',cosmeticId:item.cosmetic.id})">Send</button></article><p v-if="!recipeCards.length&&!styleItems.length">No giftable recipe cards or styles in your inventory.</p></div>
      </aside>
      <aside v-else class="visit-empty"><UiIcon name="pin" /><h3>Choose a friend to visit</h3><p>Their current bar appears here. The first visit each day adds one popularity to their account.</p></aside>
    </div>
    <section class="notification-settings"><header><small>NOTIFICATIONS</small><h3>Choose every event separately</h3></header><label v-for="event in NOTIFICATION_EVENTS" :key="event.id"><span><b>{{ event.label }}</b><small>{{ event.detail }}</small></span><input type="checkbox" :checked="notifications.prefs[event.id]" @change="notifications.setEnabled(event.id,($event.target as HTMLInputElement).checked)" /></label></section>
  </section>
</template>

<style scoped>
.friends-page{overflow:hidden}.friends-hero{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:22px;background:radial-gradient(circle at 10% 20%,#4f334b,#16243a 66%);border-bottom:1px solid #354762}.friends-page small{color:#e4b35c;font-size:9px;font-weight:900;letter-spacing:.12em}.friends-hero h2{margin:5px 0;font:700 29px Georgia,serif}.friends-hero p,.popularity p{margin:0;color:#bdc8d6;font-size:12px}.friends-hero>button,.gift-toggle{display:flex;align-items:center;gap:9px;padding:11px 14px;border:1px solid #b78649;border-radius:11px;background:#3b2b1f;color:#fff0ce;text-align:left;cursor:pointer}.friends-hero>button .ui-icon,.gift-toggle .ui-icon{width:26px;height:26px;color:#f2bd58}.friends-hero>button b,.friends-hero>button small{display:block}.friend-status,.pending-line{margin:10px 14px 0;padding:8px 10px;border:1px solid #3e7756;border-radius:8px;background:#173425;color:#b9e5c6;font-size:11px}.friend-tools{display:grid;grid-template-columns:.7fr 1.15fr 1.4fr;gap:10px;padding:14px}.friend-tools>article,.friend-tools>form,.request-list,.friends-list,.friend-visit,.visit-empty{padding:14px;border:1px solid #354762;border-radius:13px;background:#111c2d}.friend-code{display:grid;align-content:center;gap:4px}.friend-code b{color:#fff0c8;font:700 25px Georgia,serif;letter-spacing:.12em}.friend-code span{color:#91a2b5;font-size:10px}.friend-tools form label{display:block;margin-bottom:8px;color:#e4b35c;font-size:9px;font-weight:900;letter-spacing:.12em}.friend-tools form>div,.friend-alias{display:flex;gap:6px}.friend-tools input,.friend-alias input{min-width:0;flex:1;padding:9px;border:1px solid #40536c;border-radius:8px;background:#0c1625;color:#fff}.friend-tools button,.request-list button,.friend-alias button,.visit,.gift-inventory button{padding:8px 10px;border:1px solid #a97938;border-radius:8px;background:#5f3d1c;color:#ffe9bd;font-weight:800;cursor:pointer}.popularity b{display:block;margin:4px 0;color:#fff0c8;font-size:18px}.popularity progress{width:100%;accent-color:#e7b556}.popularity>div{display:flex;gap:6px;margin-top:9px}.popularity button{flex:1;font-size:9px}.popularity button:disabled,.gift-inventory button:disabled{opacity:.4}.request-list{margin:0 14px}.request-list h3,.friends-list h3,.friend-visit h3,.visit-empty h3{margin:4px 0;font:700 20px Georgia,serif}.request-list article{display:grid;grid-template-columns:1fr auto auto;align-items:center;gap:7px;padding:8px 0;border-top:1px solid #304159}.request-list article span,.friend-cards article>div:first-child{display:grid;gap:2px}.request-list .quiet{border-color:#4c5d73;background:#18263a}.friends-layout{display:grid;grid-template-columns:minmax(0,1.45fr) minmax(250px,.7fr);gap:12px;padding:14px}.friends-list>header{display:flex;justify-content:space-between;border-bottom:1px solid #304159;padding-bottom:10px}.friends-list>header span{color:#95a7bb;font-size:10px}.friend-cards{display:grid;gap:8px;margin-top:10px}.friend-cards article{display:grid;grid-template-columns:minmax(110px,.7fr) minmax(170px,1fr) auto;align-items:center;gap:8px;padding:10px;border:1px solid #34465e;border-radius:9px;background:#17253a}.friend-cards small{color:#b9c6d5;letter-spacing:0;text-transform:none}.friend-cards em{color:#8294aa;font-size:8px;font-style:normal}.friends-empty,.visit-empty{display:grid;min-height:230px;place-items:center;align-content:center;text-align:center}.friends-empty>.ui-icon,.visit-empty>.ui-icon{width:46px;height:46px;color:#71849b}.friends-empty p,.visit-empty p{max-width:390px;color:#9eafc1;font-size:12px;line-height:1.5}.friends-empty button{padding:10px 16px;border:1px solid #9a6a2a;border-radius:9px;background:#6d4922;color:#fff0ce;font-weight:900}.friend-visit>p{margin:0;color:#b9c6d5}.friend-visit>strong{display:block;margin:8px 0;color:#f4d08e}.friend-visit ul{padding-left:18px;color:#aebdce;font-size:11px}.gift-toggle{width:100%;justify-content:center}.gift-inventory{display:grid;gap:5px;margin-top:10px}.gift-inventory article{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:7px;border:1px solid #34465e;border-radius:8px;background:#17253a;font-size:10px}.gift-inventory article b{color:#f2bd58}.gift-inventory>p{color:#93a5b9;font-size:10px;line-height:1.4}.notification-settings{margin:0 14px 14px;padding:14px;border:1px solid #354762;border-radius:13px;background:#111c2d}.notification-settings h3{margin:4px 0 10px;font:700 20px Georgia,serif}.notification-settings label{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:9px 0;border-top:1px solid #2d4059}.notification-settings label span{display:grid;gap:2px}.notification-settings label small{color:#91a2b5;letter-spacing:0;text-transform:none}.notification-settings input{width:20px;height:20px;accent-color:#dca94e}
@media(max-width:760px){.friends-hero{display:grid;padding:16px 12px}.friends-hero>button{width:100%}.friend-tools{grid-template-columns:1fr;padding:10px}.popularity>div{display:grid}.request-list{margin:0 10px}.request-list article{grid-template-columns:1fr auto}.request-list article .quiet{grid-column:2}.friends-layout{grid-template-columns:1fr;padding:10px}.friend-cards article{grid-template-columns:1fr}.friend-alias{width:100%}.visit{width:100%}}
</style>
