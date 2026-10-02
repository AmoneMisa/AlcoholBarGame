<script setup lang="ts">
import { nextTick, onMounted, onBeforeUnmount, ref } from 'vue';
import BarScene from './BarScene.vue';
import UiButton from '../ui/UiButton.vue';
import CloseButton from '../ui/CloseButton.vue';
import ScreenshotOptions from '../settings/ScreenshotOptions.vue';
import { useScreenshotStore } from '../../stores/screenshot';
const emit=defineEmits<{close:[]}>();
const screenshot=useScreenshotStore();
const controls=ref(true), settings=ref(false);
const root=ref<HTMLElement>();
let previousOverflow='';
function key(event:KeyboardEvent) {if(event.key==='Escape'){event.preventDefault();event.stopImmediatePropagation();if(settings.value)settings.value=false;else emit('close');}}
onMounted(async()=>{previousOverflow=document.body.style.overflow;document.body.style.overflow='hidden';window.addEventListener('keydown',key,true);await nextTick();root.value?.focus();});
onBeforeUnmount(()=>{document.body.style.overflow=previousOverflow;window.removeEventListener('keydown',key,true);void nextTick(()=>document.querySelector<HTMLButtonElement>('.bar-screenshot-open')?.focus({preventScroll:true}));});
function hideControls(){settings.value=false;controls.value=false;root.value?.focus();}
</script>
<template>
  <Teleport to="body"><section ref="root" class="bar-photo-screen" role="dialog" aria-modal="true" aria-label="Full-screen bar for screenshots" tabindex="-1" @click="!controls && (controls=true)">
    <BarScene capture :capture-options="screenshot.prefs" :capture-controls="controls" />
    <div v-if="controls" class="photo-controls"><UiButton size="sm" :aria-expanded="settings" @click.stop="settings=!settings">Screenshot settings</UiButton><UiButton size="sm" @click.stop="hideControls">Hide controls</UiButton><CloseButton label="Close full-screen bar" size="sm" @click.stop="emit('close')" /></div>
    <section v-if="controls && settings" class="photo-settings" aria-label="Screenshot settings"><h2>Screenshot settings</h2><ScreenshotOptions /><p class="photo-hint">Hide controls before taking your screenshot. Tap anywhere to bring them back.</p></section>
  </section></Teleport>
</template>
<style>
.bar-photo-screen {position:fixed;inset:0;z-index:10000;background:#080a10;color:#f6e5c5;outline:none;overflow:hidden;}
.bar-photo-screen .bar-scene-shell {display:block;height:100%;min-height:0;}
.bar-photo-screen .bar-scene {height:100%!important;min-height:0!important;border:0;border-radius:0;}
.photo-controls {position:absolute;right:max(12px,env(safe-area-inset-right));top:max(12px,env(safe-area-inset-top));display:flex;align-items:center;gap:6px;max-width:calc(100% - 24px);z-index:40;}
.photo-controls .ui-btn {font-size:11px;background:#111a29e8;}
.photo-settings {position:absolute;right:12px;top:58px;z-index:40;width:min(320px,calc(100% - 24px));box-sizing:border-box;max-height:calc(100% - 80px);overflow:auto;padding:18px;border:1px solid #ac8e56;border-radius:14px;background:#121c2ef5;box-shadow:0 12px 40px #000a;}
.photo-settings h2 {margin:0 0 14px;font:700 20px Georgia;}
.photo-hint {font-size:11px;color:#afbbcb;line-height:1.5;margin:16px 0 0;}
.bar-scene.capture .scene-customer,.bar-scene.capture .tip-jar {pointer-events:none!important;}
.bar-scene.capture .scene-status,.bar-scene.capture .guest-nudge .hidden-guest-dot {display:none!important;}
.bar-scene.capture.hide-bartender .bartender-layer,.bar-scene.capture.hide-customers .scene-customer:not(.empty-seat),.bar-scene.capture.hide-tip-jar .tip-jar,.bar-scene.capture.hide-empty-seats .empty-seat,.bar-scene.capture.hide-guest-cards .guest-card,.bar-scene.capture.hide-arrival-timers .seat-countdown,.bar-scene.capture.hide-capture-controls .guest-nudge {visibility:hidden!important;}
</style>
