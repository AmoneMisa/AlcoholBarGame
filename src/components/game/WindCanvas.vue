<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { INTERIORS } from '../../data/cosmetics/bars';
import { MOTION_PAINTINGS, motionPaintingBox, roomWind } from '../../domain/sceneMotion';
import { mobileArtwork } from '../../domain/optimizedArtwork';
import { createWindRenderer, type WindPaint } from '../../ui/windRenderer';
const props=defineProps<{interior:string;width:number;height:number;source?:string;tinted?:boolean}>();
const emit=defineEmits<{unavailable:[]}>();
const canvas=ref<HTMLCanvasElement>();
const running=ref(false);
let renderer:ReturnType<typeof createWindRenderer>|undefined,frame:number|undefined,image:HTMLImageElement|undefined,stopped=false;
const paint=computed<WindPaint|undefined>(()=> {
  const room=INTERIORS.find(item=>item.id===props.interior),geometry=MOTION_PAINTINGS[props.interior];
  if(!room || !geometry || !props.width || !props.height) return;
  const tint=room.tint.replace('#',''),position=Number(/(\d+)%\s*$/.exec(room.position)?.[1]??50)/100;
  return {width:props.width,height:props.height,painting:motionPaintingBox(geometry.width,geometry.height,props.width,props.height,position),regions:roomWind(props.interior),
    tint:props.tinted===false?[0,0,0,0]:[parseInt(tint.slice(0,2),16)/255,parseInt(tint.slice(2,4),16)/255,parseInt(tint.slice(4,6),16)/255,parseInt(tint.slice(6,8)||'ff',16)/255],
    blend:['multiply','soft-light','screen'].includes(room.blend)?room.blend as WindPaint['blend']:'normal'};
});
function stop() {
  stopped=true;running.value=false;
  if(frame!==undefined) cancelAnimationFrame(frame);
  if(image) {image.onload=null;image.onerror=null;}
  renderer?.dispose();renderer=undefined;
}
function unavailable() {stop();emit('unavailable');}
function contextLost(event:Event) {event.preventDefault();if(!stopped) unavailable();}
onMounted(()=> {
  const room=INTERIORS.find(item=>item.id===props.interior);
  if(!room || !canvas.value) return;
  canvas.value.addEventListener('webglcontextlost',contextLost);
  image=new Image();image.decoding='async';
  image.onload=()=> {
    if(stopped || !canvas.value || !image) return;
    try {renderer=createWindRenderer(canvas.value,image);} catch {unavailable();return;}
    let previous=-Infinity;const origin=performance.now();
    const tick=(time:number)=> {
      if(stopped) return;
      if(time-previous>=50 && !document.hidden && paint.value) {
        try {renderer?.draw(paint.value,(time-origin)/1000);running.value=true;} catch {unavailable();return;}
        previous=time;
      }
      frame=requestAnimationFrame(tick);
    };
    frame=requestAnimationFrame(tick);
  };
  image.onerror=unavailable;
  image.src=props.source??mobileArtwork(room.asset);
});
onBeforeUnmount(()=>{canvas.value?.removeEventListener('webglcontextlost',contextLost);stop();});
</script>
<template><canvas ref="canvas" class="wind-canvas" :data-wind-state="running?'running':'loading'" aria-hidden="true" /></template>
<style scoped>.wind-canvas{position:absolute;inset:0;width:100%;height:100%;pointer-events:none}</style>
