import { createRequire } from 'node:module';
import { mkdir, writeFile } from 'node:fs/promises';
import { WHEEL } from '../src/domain/roulette.ts';

const sharp = createRequire(import.meta.url)(process.env.ART_SHARP_PATH || 'C:/Users/kubai/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const raster = async (path, viewBox, body, width, height = width) => {
  await mkdir(path.slice(0, path.lastIndexOf('/')), { recursive: true });
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" width="${width}" height="${height}">${body}</svg>`;
  await writeFile(path, await sharp(Buffer.from(svg)).webp({lossless:true}).toBuffer());
};

await raster('public/assets/ui/guest-silhouette.webp', '0 0 160 180', '<path fill="#06080a" fill-opacity=".94" d="M0 180 8 140Q10 131 23 126L54 114Q64 109 63 98L62 91C53 84 49 73 47 62C40 60 39 50 43 47L43 34C42 12 57 2 79 2C102 2 116 15 116 36L115 47C121 49 120 61 113 63C111 75 106 85 98 91L97 101Q96 109 106 114L138 126Q151 131 153 141L160 180Z"/>', 320, 360);
await raster('public/assets/ui/fragment-puzzle.webp', '0 0 100 100', '<path fill="#63b5c1" stroke="#d4f8ff" stroke-width="2" stroke-linejoin="round" d="M12 26H35C30 20 32 10 40 10S50 20 45 26H69V45C75 40 86 41 86 50S75 60 69 55V78H48C53 71 51 62 43 62S33 71 38 78H12V58C18 63 28 62 28 53S18 43 12 48Z"/>', 300);
await raster('src/assets/ui/icons/fullscreen.webp', '0 0 24 24', '<path d="M8 4H4v16h4M16 4h4v16h-4" fill="none" stroke="white" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>', 72);

const segment = 360 / WHEEL.length;
const point = degrees => `${96 * Math.sin(degrees * Math.PI / 180)} ${-96 * Math.cos(degrees * Math.PI / 180)}`;
const wedges = WHEEL.map((slice, i) => `<path d="M0 0 L${point(i * segment)} A96 96 0 0 1 ${point((i + 1) * segment)} Z" fill="${slice.color}" stroke="#0c1421" stroke-width="1"/>`).join('');
await raster('public/assets/ui/daily-wheel.webp', '-100 -100 200 200', `<circle r="99" fill="#10182a" stroke="#d8aa57" stroke-width="2"/>${wedges}<circle r="9" fill="#d8aa57"/>`, 800);
