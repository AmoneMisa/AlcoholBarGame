<script setup lang="ts">
import AchievementArt from '../ui/AchievementArt.vue';
import WishlistEditor from './WishlistEditor.vue';
import UiCheckbox from '../ui/UiCheckbox.vue';
import UiButton from '../ui/UiButton.vue';
import { computed, ref } from 'vue';
import UiIcon from '../ui/UiIcon.vue';
import ModalDialog from '../ui/ModalDialog.vue';
import { FEATURED_MAX } from '../../domain/profile';
import { useGameStore } from '../../stores/game';
import ProfileCard from './ProfileCard.vue';

// The five medals can be chosen by tapping a displayed medal.
const game = useGameStore();
const emit = defineEmits<{ achievements: []; appearance: []; settings: [] }>();
const picking = ref(false);
const wishesOpen=ref(false);
const chosen = ref<string[]>([]);
const earned = computed(() => game.earnedAchievements);

function startPicking() {
  chosen.value = game.profile.picked ? game.profile.shown.map((item) => item.id) : [];
  picking.value = true;
}
function toggle(id: string) {
  if (chosen.value.includes(id)) chosen.value = chosen.value.filter((item) => item !== id);
  else if (chosen.value.length < FEATURED_MAX) chosen.value = [...chosen.value, id];
}
function save() { game.setFeaturedAchievements(chosen.value); picking.value = false; }
function latest() { game.setFeaturedAchievements([]); picking.value = false; }
</script>

<template>
  <div class="profile-page">
    <ProfileCard editable :name="game.decor.bartenderNickname || (game.decor.bartenderCharacter === 'leo' ? 'Leo' : 'Noa')" :subtitle="game.decor.name" :progress="game.xpProgress" :level="game.level" :profile="game.profile" :look="game.decor as unknown as Record<string, string>" @achievements="emit('achievements')" @pick-achievements="startPicking" @wishlist="wishesOpen=true">
      <template #actions>
        <button type="button" class="profile-icon-button" aria-label="Customize appearance" title="Customize appearance" @click="emit('appearance')"><UiIcon name="hanger" /></button>
        <button type="button" class="profile-icon-button" aria-label="Settings" title="Settings" @click="emit('settings')"><UiIcon name="settings" /></button>
      </template>
    </ProfileCard>

    <ModalDialog v-if="picking" title="Choose achievements to show" @close="picking=false"><section class="picker">
      <header><b>Choose up to {{ FEATURED_MAX }} achievements to show on your profile</b></header>
      <div v-for="item in earned" :key="item.id" class="achievement-picker-option"><AchievementArt :series="item.series" :tier="item.tier" :size="40" /><UiCheckbox :model-value="chosen.includes(item.id)" :label="`${item.seriesName} · ${item.tierName}`" :hint="item.name" :disabled="!chosen.includes(item.id) && chosen.length >= FEATURED_MAX" @update:model-value="toggle(item.id)" /></div>
      <footer>
        <UiButton variant="primary" @click="save">Save ({{ chosen.length }} / {{ FEATURED_MAX }})</UiButton>
        <UiButton variant="secondary" @click="latest">Show the latest instead</UiButton>
        <UiButton variant="secondary" @click="picking = false">Cancel</UiButton>
      </footer>
    </section></ModalDialog>
    <WishlistEditor v-if="wishesOpen" @close="wishesOpen=false" />
  </div>
</template>

<style scoped>
.achievement-picker-option{display:flex;align-items:center;gap:8px;}
.profile-page { display: grid; gap: 14px; padding: 0; border:0;background:none;box-shadow:none; }
.profile-icon-button{display:grid;place-items:center;width:36px;height:36px;padding:6px;border:1px solid #ceb071;border-radius:50%;background:#071321db;color:#f4d895;cursor:pointer}
.profile-icon-button svg,.profile-icon-button :deep(.ui-icon){width:22px;height:22px}
.profile-icon-button:hover{background:#243749}
.profile-icon-button:focus-visible{outline:2px solid #f5d287;outline-offset:3px}
.picker { display: grid; gap: 6px; padding: 14px; border: 1px solid #b78649; border-radius: 14px; background: #1a1f2c; color: #e9eef7; }
.picker label { display: flex; align-items: center; gap: 8px; padding: 6px 8px; border-radius: 8px; cursor: pointer; }
.picker label.on { background: rgba(255, 211, 90, .12); }
.picker footer { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 6px; }
</style>
