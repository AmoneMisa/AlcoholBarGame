<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { INTERIORS, shelfStyleFor, type InteriorId } from '../../data/cosmetics/bars';
import { modularSceneFor } from '../../data/cosmetics/modularScenes';
import { useGameStore } from '../../stores/game';
import ModularBarBackdrop from './ModularBarBackdrop.vue';

const props=defineProps<{interior:string}>();
const game=useGameStore();
const scene=computed(()=>modularSceneFor(props.interior,false,game.decor.shelfPreset??'room-original'));
const background=computed(()=>INTERIORS.find(item=>item.id===props.interior)?.asset);
const host=ref<HTMLElement>();
const size=ref({width:0,height:0});
let observer:ResizeObserver|undefined;
function measure(){
  const bounds=host.value?.getBoundingClientRect();
  if(bounds)size.value={width:bounds.width,height:bounds.height};
}
onMounted(()=>{
  measure();
  if(typeof ResizeObserver!=='undefined' && host.value){
    observer=new ResizeObserver(measure);
    observer.observe(host.value);
  }
});
onBeforeUnmount(()=>observer?.disconnect());
</script>

<template>
  <div ref="host" class="modular-bar-preview">
    <ModularBarBackdrop v-if="scene" :scene="scene" :width="size.width" :height="size.height"
      :background-source="background" :wall="game.decor.wall" :counter="game.decor.counter"
      :counter-color="game.decor.counterColor" :shelf="shelfStyleFor({...game.decor,interior:scene.id as InteriorId})"
      :shelf-preset="game.decor.shelfPreset ?? 'room-original'"
      :window-backdrop="game.decor.windowBackdrop ?? 'original'" :seat-count="game.decor.seatCount"
      :lighting="game.decor.lighting" :highlight-strength="game.decor.highlightStrength" :animated="false" />
  </div>
</template>

<style scoped>
.modular-bar-preview{position:absolute;inset:0;pointer-events:none}
.modular-bar-preview :deep(.modular-bar-backdrop){position:absolute;inset:0;overflow:hidden}
.modular-bar-preview :deep(canvas),.modular-bar-preview :deep(img){display:block;width:100%;height:100%;object-fit:cover}
</style>
