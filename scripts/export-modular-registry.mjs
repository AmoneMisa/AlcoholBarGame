// node --import ./tests/register.mjs scripts/export-modular-registry.mjs | python scripts/measure-mobile-bar-art.py
import { MODULAR_SCENES } from '../src/data/cosmetics/modularScenes.ts';
console.log(JSON.stringify({scenes: MODULAR_SCENES}));
