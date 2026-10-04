<script setup lang="ts">
import { computed, defineAsyncComponent, ref } from 'vue';
import { INTERIORS } from '../../data/cosmetics/bars';
import { MOTION_LAYERS, MOTION_PAINTINGS, motionPaintingBox, roomMotion, roomWind, type MotionRegion } from '../../domain/sceneMotion';
import { sceneWind, sceneWindSupported } from '../../ui/sceneMotion';
const WindCanvas=defineAsyncComponent(()=>import('./WindCanvas.vue'));
const props = defineProps<{ interior: string; width: number; height: number; backgroundSource?:string; tinted?:boolean }>();
const failed = ref<string[]>([]);
const layers = computed(() => roomMotion(props.interior));
const localLayers = computed(() => [
  ...layers.value.water.map(region => ({kind:'water' as const,region})),
  ...layers.value.curtains.map(region => ({kind:'curtain' as const,region})),
  ...layers.value.caustics.map(region => ({kind:'caustics' as const,region})),
  ...layers.value.snow.map(region => ({kind:'snow' as const,region})),
  ...layers.value.fireflies.map(region => ({kind:'fireflies' as const,region}))
].filter(layer => !failed.value.includes(layer.kind)));
const base = `${import.meta.env.BASE_URL}assets/bar/motion/`;
const source = (kind: keyof typeof MOTION_LAYERS) => base + MOTION_LAYERS[kind];
const regionStyle = (box: MotionRegion) => ({left:`${box.x*100}%`,top:`${box.y*100}%`,width:`${box.width*100}%`,height:`${box.height*100}%`});
const painting = computed(() => {
  const geometry = MOTION_PAINTINGS[props.interior];
  if (!geometry || !props.width || !props.height) return undefined;
  const position = INTERIORS.find(item => item.id === props.interior)?.position ?? 'center';
  const y = Number(/(\d+)%\s*$/.exec(position)?.[1] ?? 50) / 100;
  return Object.fromEntries(Object.entries(motionPaintingBox(geometry.width,geometry.height,props.width,props.height,y)).map(([key,value])=>[key,`${value}px`]));
});
function fail(kind: string) { failed.value = [...failed.value,kind]; }
</script>
<template>
  <div class="scene-atmosphere" aria-hidden="true">
    <WindCanvas v-if="sceneWind && sceneWindSupported && roomWind(interior).length && width && height" :key="interior + (backgroundSource??'')" :interior="interior" :width="width" :height="height" :source="backgroundSource" :tinted="tinted" @unavailable="sceneWindSupported=false" />
    <img v-if="!failed.includes(layers.light)" class="atmosphere-light" :src="source(layers.light)" alt="" decoding="async" draggable="false" @error="fail(layers.light)" />
    <div v-if="painting && localLayers.length" class="atmosphere-painting" :style="painting">
      <img v-for="(layer,index) in localLayers" :key="`${layer.kind}-${index}`" :class="`atmosphere-local atmosphere-${layer.kind}`" :style="regionStyle(layer.region)" :src="source(layer.kind)" alt="" decoding="async" draggable="false" @error="fail(layer.kind)" />
    </div>
  </div>
</template>
<style scoped>
.scene-atmosphere {position:absolute;inset:0;overflow:hidden;pointer-events:none;z-index:1}
.atmosphere-light {position:absolute;inset:0 0 auto;width:100%;height:58%;object-fit:fill;opacity:.8}
.atmosphere-painting {position:absolute;pointer-events:none}
.atmosphere-local {position:absolute;object-fit:fill}
.atmosphere-water {opacity:.65}.atmosphere-curtain {opacity:.65}
.atmosphere-caustics {opacity:.45}.atmosphere-snow {opacity:.8}.atmosphere-fireflies {opacity:.7}
</style>
