<script setup lang="ts">
import { computed, ref } from 'vue';
import { STAR_CRYSTAL_PACKS } from '../../domain/economy';
import { useGameStore } from '../../stores/game';
import ModalDialog from './ModalDialog.vue';
import UiIcon from './UiIcon.vue';
const game = useGameStore();
const emit = defineEmits<{close:[]}>();
const packs = computed(() => STAR_CRYSTAL_PACKS.filter(pack => !pack.once || game.starterPackAvailable));
const purchaseAttempted = ref(false);
async function buy(id:string) { purchaseAttempted.value = true; if (await game.buyCrystalPack(id)) emit('close'); }
</script>
<template>
  <ModalDialog title="Crystal boutique" eyebrow="A LITTLE EXTRA SPARKLE" width="560px" @close="emit('close')">
    <div class="crystal-boutique">
      <div class="boutique-hero"><div class="crystal-jewels" aria-hidden="true"><UiIcon name="crystal" /><UiIcon name="crystal" /><UiIcon name="crystal" /></div><h3>Make your bar shine</h3><p>New styles, faster arrivals, more possibilities.</p><span>Your balance <UiIcon name="crystal" /><b>{{ game.crystals.toLocaleString('en-US') }}</b></span></div>
      <div class="boutique-packs"><button v-for="pack in packs" :key="pack.id" type="button" :class="{starter:pack.once}" :disabled="game.buyingCrystals" :aria-label="`Buy ${pack.crystals} crystals for ${pack.stars} Telegram Stars`" @click="buy(pack.id)"><small>{{ pack.once ? 'WELCOME OFFER · ONCE ONLY' : pack.title }}</small><span class="pack-amount"><UiIcon name="crystal" /><b>{{ pack.crystals.toLocaleString('en-US') }}</b></span><span class="pack-price"><UiIcon name="star-fill" />{{ pack.stars }} Stars</span></button></div>
      <p v-if="game.buyingCrystals" role="status" class="boutique-status">Waiting for Telegram payment confirmation…</p><p v-else-if="purchaseAttempted && game.message" role="status" class="boutique-status">{{ game.message }}</p>
      <p class="boutique-foot">Secure payment with Telegram Stars. Choose a pack to review your purchase in Telegram.</p>
    </div>
  </ModalDialog>
</template>
<style scoped>
.crystal-boutique {display:grid;gap:16px}.boutique-hero {text-align:center;padding:10px 0 16px;background:radial-gradient(ellipse at 50% 30%,#9165b34d,transparent 70%)}.crystal-jewels {height:100px;display:flex;justify-content:center;align-items:center;filter:drop-shadow(0 8px 16px #ac73ff55)}.crystal-jewels .ui-icon {width:54px;height:54px;color:#b3a0ff;rotate:-20deg}.crystal-jewels .ui-icon:nth-child(2) {width:82px;height:82px;color:#e1ccff;rotate:10deg}.crystal-jewels .ui-icon:last-child {rotate:25deg;color:#89c9e5}.boutique-hero h3 {margin:0;color:#ffe4a9;font:700 26px Georgia}.boutique-hero p {font-size:12px;color:#c5bcd7;margin:10px 0 14px}.boutique-hero >span {display:inline-flex;gap:7px;align-items:center;font-size:11px;color:#b7becd}.boutique-hero >span .ui-icon {width:16px;height:16px}.boutique-packs {display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.boutique-packs button {display:grid;justify-items:center;gap:12px;min-width:0;padding:16px 8px;border:1px solid #8e729e77;border-radius:14px;background:linear-gradient(140deg,#443050,#1d273d);color:#f5eafa;cursor:pointer}.boutique-packs button.starter {grid-column:1/-1;border-color:#d8af61;background:linear-gradient(130deg,#59412f,#3d2b49)}.boutique-packs button:disabled {opacity:.5;cursor:wait}.boutique-packs button:hover:enabled {border-color:#e0c183;box-shadow:0 0 20px #baa2e51c}.boutique-packs small {font-size:9px;letter-spacing:.08em;color:#d8bfdc}.starter small {color:#ffd990}.pack-amount {display:flex;align-items:center;gap:8px;font:700 28px Georgia}.pack-amount .ui-icon {width:30px;height:30px;color:#c0afff}.pack-price {display:flex;align-items:center;gap:6px;padding:7px 14px;border-radius:20px;background:#111b2ca8;font-size:12px;color:#f5d38c}.pack-price .ui-icon {width:15px;height:15px}.boutique-foot,.boutique-status {margin:0;font-size:11px;line-height:1.5;text-align:center;color:#a9b6c8}.boutique-status {color:#ebc97e}
</style>

