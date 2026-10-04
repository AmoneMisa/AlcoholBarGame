import { computed, ref, watch } from 'vue';
import { liteGraphics } from './graphics';

export type SceneMotion = 'static' | 'animated';
const KEY = 'barlingo.scene-motion';
function load(): SceneMotion {
  try { return localStorage.getItem(KEY) === 'animated' ? 'animated' : 'static'; } catch { return 'static'; }
}
export const sceneMotion = ref<SceneMotion>(load());
function loadWind() { try { return localStorage.getItem(KEY+'.wind') !== 'off'; } catch { return true; } }
export const sceneWind = ref(loadWind());
export const sceneWindSupported = ref(true);
export const reducedSceneMotion = ref(false);
const visible = ref(true);
export function canAnimateScene(mode: SceneMotion, lite: boolean, reduced: boolean, visible: boolean, active = true, capture = false) {
  return mode === 'animated' && !lite && !reduced && visible && active && !capture;
}
export const sceneMotionPlaying = computed(() => canAnimateScene(sceneMotion.value, liteGraphics.value, reducedSceneMotion.value, visible.value));

export function initSceneMotion() {
  const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
  const sync = () => { visible.value = !document.hidden; reducedSceneMotion.value = preference.matches; };
  sync();
  document.addEventListener('visibilitychange', sync);
  if (preference.addEventListener) preference.addEventListener('change', sync);
  else preference.addListener(sync);
  const stop = watch([sceneMotion,sceneWind], ([mode,wind]) => {
    try { localStorage.setItem(KEY, mode); localStorage.setItem(KEY+'.wind',wind?'on':'off'); } catch { /* Device preference is optional. */ }
  });
  return () => {
    stop(); document.removeEventListener('visibilitychange', sync);
    if (preference.removeEventListener) preference.removeEventListener('change', sync);
    else preference.removeListener(sync);
  };
}
