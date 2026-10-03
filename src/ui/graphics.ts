import { computed, ref, watch } from 'vue';

export type GraphicsMode = 'auto' | 'lite' | 'full';
const KEY = 'barlingo.graphics';
export function weakDevice(device: { hardwareConcurrency?: number; deviceMemory?: number; saveData?: boolean }) {
  return device.saveData === true || (device.hardwareConcurrency !== undefined && device.hardwareConcurrency <= 4)
    || (device.deviceMemory !== undefined && device.deviceMemory <= 4);
}
function load(): GraphicsMode {
  try { const value = localStorage.getItem(KEY); return value === 'lite' || value === 'full' ? value : 'auto'; } catch { return 'auto'; }
}
export const graphicsMode = ref<GraphicsMode>(load());
const device: { hardwareConcurrency?: number; deviceMemory?: number; connection?: { saveData?: boolean } } = typeof navigator === 'undefined' ? {} : navigator;
export const liteGraphics = computed(() => graphicsMode.value === 'lite' || (graphicsMode.value === 'auto' && weakDevice({ hardwareConcurrency: device.hardwareConcurrency, deviceMemory: device.deviceMemory, saveData: device.connection?.saveData })));

export function initGraphics() {
  watch([graphicsMode, liteGraphics], ([mode, lite]) => {
    document.documentElement.dataset.graphics = lite ? 'lite' : 'full';
    try { localStorage.setItem(KEY, mode); } catch { /* Preferences are optional when storage is unavailable. */ }
  }, { immediate: true });
}
