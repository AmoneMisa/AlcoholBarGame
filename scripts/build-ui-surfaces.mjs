import { createRequire } from 'node:module';
import { mkdir, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

// Resize and recompress existing artwork for reusable UI backgrounds.
const sharp = createRequire(import.meta.url)(process.env.ART_SHARP_PATH || 'C:/Users/kubai/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const root = new URL('../public/assets/ui/', import.meta.url);
await mkdir(root, {recursive:true});
for (const [source, target, width] of [
  ['lounge-panel-painted-v1.webp', 'surface-dialog.webp', 960],
  ['pass-panel-painted-v1.webp', 'surface-panel.webp', 960],
  ['pass-free-surface-v1.webp', 'surface-card.webp', 480],
  ['pass-premium-surface-v1.webp', 'surface-gold.webp', 480]
]) {
  const output = new URL(target, root);
  await sharp(fileURLToPath(new URL(source, root))).resize({width,withoutEnlargement:true}).webp({quality:68,effort:6}).toFile(fileURLToPath(output));
  console.log(`${target}: ${(await stat(output)).size} bytes`);
}
