import { ref, watch } from 'vue';
import { musicOn, sfxOn } from './preferences';
import type { SfxName } from './sfx';
export { musicOn, sfxOn, speechOn, musicVolume, sfxVolume, speechVolume } from './preferences';
export const soundPackLoaded = ref(false);
export const soundPackLoading = ref(false);
export const soundPackError = ref('');
let runtime: typeof import('./runtime') | undefined;
let downloading: Promise<void> | undefined;
let interior = 'velvet';
export async function downloadSoundPack() {
  if (runtime) return;
  if (downloading) return downloading;
  soundPackLoading.value = true;
  soundPackError.value = '';
  downloading = import('./runtime').then(module => {
    runtime = module;
    module.setMusicInterior(interior);
    module.initMusic();
    soundPackLoaded.value = true;
  }).catch(() => { soundPackError.value = 'Could not download the sound pack. Please try again.'; }).finally(() => { soundPackLoading.value = false; downloading = undefined; });
  return downloading;
}
export function playSfx(name: SfxName) { if (sfxOn.value) runtime?.playSfx(name); }
export function duckMusic(on: boolean) { runtime?.duckMusic(on); }
export function initMusic() { /* Sound starts only after an explicit package download. */ }
export function refreshMusic() { runtime?.refreshMusic(); }
export function setMusicInterior(id: string) { interior = id; runtime?.setMusicInterior(id); }
watch([musicOn, sfxOn], refreshMusic);
