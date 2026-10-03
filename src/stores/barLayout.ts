import { ref, watch } from 'vue';
import { defineStore } from 'pinia';

export const useBarLayoutStore = defineStore('bar-layout', () => {
  const positions = ref<Record<string, number>>({});
  try {
    const saved = JSON.parse(localStorage.getItem('barlingo.bartender-positions') ?? '{}');
    for (const [id, value] of Object.entries(saved)) if (typeof value === 'number' && Number.isFinite(value)) positions.value[id] = Math.max(.12, Math.min(.88, value));
  } catch { /* Device storage is optional. */ }
  watch(positions, value => { try { localStorage.setItem('barlingo.bartender-positions', JSON.stringify(value)); } catch { /* Device storage is optional. */ } }, { deep: true });
  function move(interior: string, position: number) { positions.value[interior] = Math.max(.12, Math.min(.88, position)); }
  return { positions, move };
});
