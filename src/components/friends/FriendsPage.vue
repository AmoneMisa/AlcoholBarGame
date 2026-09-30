<script setup lang="ts">
import { computed, ref } from 'vue';
import { RECIPES } from '../../domain/catalog';
import { useGameStore } from '../../stores/game';
import UiIcon from '../ui/UiIcon.vue';

const game = useGameStore();
const inviteStatus = ref('');
const giftRecipient = ref('');
const spareRecipes = computed(() => RECIPES.map((recipe) => ({ recipe, quantity: game.recipeCopies[recipe.id] ?? 0 })).filter((item) => item.quantity > 0));
const spareCosmetics = computed(() => game.cosmetics.map((cosmetic) => ({ cosmetic, quantity:game.cosmeticCopies[cosmetic.id] ?? 0 })).filter((item) => item.quantity > 0));

async function shareInvite() {
  const url = typeof window === 'undefined' ? '' : window.location.href.split('?')[0]!;
  const text = `Join me in Alcohol Lingo and build your own bar. I’m playing at ${game.decor.name}.`;
  try {
    if (navigator.share) await navigator.share({ title: 'Alcohol Lingo', text, url });
    else {
      await navigator.clipboard.writeText(`${text} ${url}`);
      inviteStatus.value = 'Invite link copied.';
    }
  } catch (error) {
    if ((error as Error).name !== 'AbortError') inviteStatus.value = 'Could not share the link on this device.';
  }
}
</script>

<template>
  <section class="friends-page game-panel">
    <header class="friends-hero">
      <div><small>YOUR BAR CIRCLE{{ game.playerId ? ` · PLAYER ${game.playerId}` : '' }}</small><h2>Friends</h2><p>Invite friends to practise English, compare bars and exchange spare recipe cards and cosmetics.</p></div>
      <button type="button" @click="shareInvite"><UiIcon name="friends" /><span><b>Invite a friend</b><small>Send the game link</small></span></button>
    </header>
    <p v-if="inviteStatus" class="friend-status" aria-live="polite">{{ inviteStatus }}</p>
    <div class="friends-layout">
      <section class="friends-list">
        <header><div><small>FRIEND LIST</small><h3>Your people</h3></div><span>0 connected</span></header>
        <div class="friends-empty"><UiIcon name="friends" /><h3>No friends connected yet</h3><p>Send an invitation from this screen. Friends linked to your account will be shown here with their bar, level and online status.</p><button type="button" @click="shareInvite">Share invitation</button></div>
      </section>
      <aside class="friend-recipes">
        <small>RECIPE GIFTS</small><h3>Spare cards</h3><p>Duplicate cards remain in your inventory and can be gifted after a friend is connected.</p>
        <div v-if="spareRecipes.length"><article v-for="item in spareRecipes.slice(0,6)" :key="item.recipe.id"><span>{{ item.recipe.name }}</span><b>×{{ item.quantity }}</b></article></div>
        <p v-else class="no-spares">No spare recipe cards yet. VIP customers, daily lessons and gifts can drop duplicates.</p>
        <div class="cosmetic-gifts">
          <small>STYLE GIFTS</small><h3>Duplicate cosmetics</h3><p>Enter a friend code or nickname, then send one duplicate won in the daily style draw.</p>
          <input v-model="giftRecipient" inputmode="numeric" maxlength="12" placeholder="Friend player code" aria-label="Friend player code" />
          <article v-for="item in spareCosmetics" :key="item.cosmetic.id"><span><b>{{ item.cosmetic.label }}</b><small>{{ item.cosmetic.key.replace(/([A-Z])/g,' $1') }}{{ item.cosmetic.character ? ` · ${item.cosmetic.character === 'noa' ? 'woman' : 'man'}` : '' }}</small></span><strong>×{{ item.quantity }}</strong><button type="button" :disabled="!giftRecipient.trim()" @click="game.giftCosmetic(item.cosmetic.id,giftRecipient)">Gift</button></article>
          <p v-if="!spareCosmetics.length" class="no-spares">No duplicate cosmetics yet. The first copy unlocks the style; later copies can be gifted.</p>
        </div>
      </aside>
    </div>
  </section>
</template>

<style scoped>
.friends-page{overflow:hidden}.friends-hero{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:22px;background:radial-gradient(circle at 10% 20%,#4f334b,#16243a 66%);border-bottom:1px solid #354762}.friends-hero small,.friends-list small,.friend-recipes>small{color:#e4b35c;font-size:9px;font-weight:900;letter-spacing:.13em}.friends-hero h2{margin:5px 0;font:700 29px Georgia,serif}.friends-hero p{margin:0;color:#bdc8d6;font-size:13px}.friends-hero>button{display:flex;min-width:205px;align-items:center;gap:10px;padding:12px 15px;border:1px solid #b78649;border-radius:12px;background:#3b2b1f;color:#fff0ce;text-align:left;cursor:pointer}.friends-hero>button .ui-icon{width:29px;height:29px;color:#f2bd58}.friends-hero>button b,.friends-hero>button small{display:block}.friends-hero>button small{margin-top:2px;color:#c8aa76;letter-spacing:0}.friend-status{margin:10px 14px 0;padding:8px 10px;border:1px solid #3e7756;border-radius:8px;background:#173425;color:#b9e5c6;font-size:11px}.friends-layout{display:grid;grid-template-columns:minmax(0,1.5fr) minmax(250px,.7fr);gap:12px;padding:14px}.friends-list,.friend-recipes{min-height:320px;padding:16px;border:1px solid #354762;border-radius:13px;background:#111c2d}.friends-list>header{display:flex;justify-content:space-between;gap:10px;border-bottom:1px solid #304159;padding-bottom:10px}.friends-list h3,.friend-recipes h3{margin:4px 0;font:700 20px Georgia,serif}.friends-list>header span{color:#95a7bb;font-size:10px}.friends-empty{display:grid;min-height:240px;place-items:center;align-content:center;text-align:center}.friends-empty>.ui-icon{width:48px;height:48px;color:#6f829a}.friends-empty h3{margin:10px 0 4px}.friends-empty p{max-width:440px;margin:0;color:#9eafc1;font-size:12px;line-height:1.5}.friends-empty button{margin-top:14px;padding:10px 16px;border:1px solid #9a6a2a;border-radius:9px;background:#6d4922;color:#fff0ce;font-weight:900;cursor:pointer}.friend-recipes>p{color:#9eafc1;font-size:11px;line-height:1.5}.friend-recipes>div{display:grid;gap:6px;margin-top:12px}.friend-recipes article{display:flex;justify-content:space-between;gap:8px;padding:9px;border:1px solid #34465e;border-radius:8px;background:#17253a;font-size:11px}.friend-recipes article b{color:#f2bd58}.no-spares{padding:12px;border:1px dashed #40516a;border-radius:9px}.friend-recipes .no-spares{color:#93a5b9}
.cosmetic-gifts{margin-top:18px;padding-top:14px;border-top:1px solid #34465e}.cosmetic-gifts>small{color:#e4b35c;font-size:9px;font-weight:900;letter-spacing:.13em}.cosmetic-gifts>p{color:#9eafc1;font-size:11px;line-height:1.45}.cosmetic-gifts>input{box-sizing:border-box;width:100%;min-height:42px;padding:9px 11px;border:1px solid #40536c;border-radius:9px;background:#0c1625;color:#fff}.cosmetic-gifts article{align-items:center}.cosmetic-gifts article span{display:grid;gap:2px}.cosmetic-gifts article span small{color:#93a5b9;font-size:8px}.cosmetic-gifts article button{padding:7px 9px;border:1px solid #a97938;border-radius:7px;background:#5f3d1c;color:#ffe9bd;font-weight:800}.cosmetic-gifts article button:disabled{opacity:.4}.cosmetic-gifts article strong{color:#f2bd58}
@media(max-width:760px){.friends-hero{display:grid;padding:16px 12px}.friends-hero>button{width:100%;min-width:0}.friends-layout{grid-template-columns:1fr;padding:10px}.friends-list,.friend-recipes{min-height:0;padding:13px}.friends-empty{min-height:220px}}
</style>
