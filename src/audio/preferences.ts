import { ref, watch } from 'vue';
const STORE_KEY = 'barlingo.audio';
// On/off is kept apart from the level, so muting and unmuting returns to the volume the player chose.
interface Prefs { music: boolean; sfx: boolean; speech: boolean; musicVolume: number; sfxVolume: number; speechVolume: number }

// Optional game sound is disabled until the player downloads its separate package.
const MUSIC_DEFAULT = false;

const level = (value: unknown) => typeof value === 'number' && Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : 1;
function loadPrefs(): Prefs {
  try {
    const saved = JSON.parse(localStorage.getItem(STORE_KEY) ?? '{}');
    return {
      music: typeof saved.music === 'boolean' ? saved.music : MUSIC_DEFAULT,
      sfx: saved.sfx === true,
      speech: saved.speech !== false,
      musicVolume: level(saved.musicVolume),
      sfxVolume: level(saved.sfxVolume),
      speechVolume: level(saved.speechVolume)
    };
  } catch { return { music: MUSIC_DEFAULT, sfx: false, speech: true, musicVolume: 1, sfxVolume: 1, speechVolume: 1 }; }
}

// Phones with few cores or little memory get shorter reverbs, so the audio thread and the game both stay smooth.
export const LOW_POWER = typeof navigator !== 'undefined' && ((navigator.hardwareConcurrency ?? 8) <= 4 || ((navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 8) <= 2);

const prefs = loadPrefs();
export const musicOn = ref(prefs.music);
export const sfxOn = ref(prefs.sfx);
export const speechOn = ref(prefs.speech);
/** 0–1, multiplied with the channel's mix level. */
export const musicVolume = ref(prefs.musicVolume);
export const sfxVolume = ref(prefs.sfxVolume);
export const speechVolume = ref(prefs.speechVolume);
watch([musicOn, sfxOn, speechOn, musicVolume, sfxVolume, speechVolume], () => {
  const saved: Prefs = {
    music: musicOn.value,
    sfx: sfxOn.value,
    speech: speechOn.value,
    musicVolume: level(musicVolume.value),
    sfxVolume: level(sfxVolume.value),
    speechVolume: level(speechVolume.value)
  };
  try { localStorage.setItem(STORE_KEY, JSON.stringify(saved)); } catch { /* private mode */ }

});

