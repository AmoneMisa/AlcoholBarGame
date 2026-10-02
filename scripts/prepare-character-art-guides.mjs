// Development guides only. These vector renders are never production illustration.
import { createRequire } from 'node:module';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { composeLayers, renderSvg } from '../src/domain/characterStudio/art.ts';
import { DEFAULTS, OPTIONS_BY_MODEL, RIGS } from '../src/domain/characterStudio/rig.ts';

const require = createRequire(import.meta.url);
const sharp = require(process.env.CHARACTER_SHARP_PATH || 'C:/Users/kubai/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const root = resolve('assets-src/character-studio/production/guides');
await mkdir(root, { recursive: true });
for (const model of ['woman', 'man']) {
  const assets = new Map();
  for (const [key, variants] of Object.entries(OPTIONS_BY_MODEL[model])) {
    for (const variant of variants) {
      const look = { ...DEFAULTS[model], [key]: variant };
      for (const asset of composeLayers(look, model)) if (!assets.has(asset.id)) assets.set(asset.id, { asset, look });
    }
  }
  const manifest = { rig: RIGS[model].id, logicalCanvas: [600, 1000], scale: 4, assets: [] };
  for (const { asset, look } of assets.values()) {
    const id = asset.id.replaceAll('/', '-');
    const file = `${model}-${id}.png`;
    const buffer = Buffer.from(renderSvg(look, asset, false, model));
    await sharp(buffer, { density: 288 }).resize(2400, 4000).png().toFile(resolve(root, file));
    const { data, info } = await sharp(resolve(root, file)).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    let left = info.width, top = info.height, right = -1, bottom = -1;
    for (let y = 0; y < info.height; y++) for (let x = 0; x < info.width; x++) {
      if (data[(y * info.width + x) * 4 + 3] > 16) { left = Math.min(left,x); right = Math.max(right,x); top = Math.min(top,y); bottom = Math.max(bottom,y); }
    }
    const bounds = { left, top, width: right - left + 1, height: bottom - top + 1 };
    const crop = `${model}-${id}-crop.png`;
    await sharp(resolve(root, file)).extract(bounds).png().toFile(resolve(root, crop));
    manifest.assets.push({ id: asset.id, layer: asset.layer, file, crop, bounds, logicalBounds: [left/4,top/4,bounds.width/4,bounds.height/4] });
  }
  await writeFile(resolve(root, `${model}.json`), JSON.stringify(manifest, null, 2));
  console.log(`${model}: ${assets.size} full-canvas guides and measured crops`);
}
