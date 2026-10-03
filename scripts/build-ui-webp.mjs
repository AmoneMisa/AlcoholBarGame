import { createRequire } from 'node:module';
import { mkdir, writeFile } from 'node:fs/promises';

const sharp = createRequire(import.meta.url)(process.env.ART_SHARP_PATH || 'C:/Users/kubai/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const raster = async (path, viewBox, body, width, height = width) => {
  await mkdir(path.slice(0, path.lastIndexOf('/')), { recursive: true });
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" width="${width}" height="${height}">${body}</svg>`;
  await writeFile(path, await sharp(Buffer.from(svg)).webp({lossless:true}).toBuffer());
};

await raster('public/assets/ui/guest-silhouette.webp', '0 0 160 180', '<path fill="#06080a" fill-opacity=".94" d="M0 180 8 140Q10 131 23 126L54 114Q64 109 63 98L62 91C53 84 49 73 47 62C40 60 39 50 43 47L43 34C42 12 57 2 79 2C102 2 116 15 116 36L115 47C121 49 120 61 113 63C111 75 106 85 98 91L97 101Q96 109 106 114L138 126Q151 131 153 141L160 180Z"/>', 320, 360);
await raster('src/assets/ui/icons/fullscreen.webp', '0 0 24 24', '<path d="M8 4H4v16h4M16 4h4v16h-4" fill="none" stroke="white" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>', 72);
