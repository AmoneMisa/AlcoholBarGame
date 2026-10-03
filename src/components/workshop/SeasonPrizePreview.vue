<script setup lang="ts">
import { computed } from 'vue';
import { useGameStore } from '../../stores/game';
import { interiorStyle, type InteriorId } from '../../data/cosmetics/bars';
import { COSMETICS } from '../../domain/cosmetics';
import ModalDialog from '../ui/ModalDialog.vue';
import CharacterModel from '../characters/CharacterModel.vue';
const emit = defineEmits<{close:[]}>();
const game = useGameStore();
const theme = computed(() => game.passTheme);
const label = (character:string) => COSMETICS.find(item => item.character === character && item.value === theme.value[character === 'noa' ? 'noa' : 'leo'])?.label;
</script>
<template>
  <ModalDialog title="Season prizes" :eyebrow="theme.name" width="960px" @close="emit('close')">
    <div class="season-preview-scene" :style="interiorStyle(theme.interior as InteriorId)">
      <CharacterModel role="bartender" character-id="noa" :outfit="theme.noa" />
      <CharacterModel role="bartender" character-id="leo" :outfit="theme.leo" />
    </div>
    <div class="season-preview-captions"><span><b>Noa's outfit</b>{{ label('noa') }}</span><span><b>Leo's outfit</b>{{ label('leo') }}</span></div>
    <p class="season-preview-note">Both outfits at level 14 · Gift background at level 20</p>
  </ModalDialog>
</template>
<style scoped>
.season-preview-scene { position:relative;display:flex;justify-content:center;align-items:flex-end;gap:2%;height:clamp(260px,55vh,520px);padding-top:24px;border-radius:14px;overflow:hidden; }
.season-preview-scene :deep(.art-character) { position:relative!important;inset:auto!important;transform:none!important;flex:0 1 45%;width:45%!important;height:92%!important;aspect-ratio:auto!important; }
.season-preview-captions { display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:16px;text-align:center;color:#bcc9db;font-size:13px; }.season-preview-captions b { display:block;margin-bottom:5px;color:#ffe5b3; }.season-preview-note { text-align:center;color:#e4b35c;margin:18px 0 0;font-size:13px; }
@media(max-width:640px) { .season-preview-scene { height:clamp(210px,70vw,340px);padding-top:16px; } }
</style>
