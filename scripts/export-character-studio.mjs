import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve, dirname } from 'node:path';
import { BODY, composeLayers, renderSvg } from '../src/domain/characterStudio/art.ts';
import { MAN_BODY } from '../src/domain/characterStudio/manArt.ts';
import { DEFAULTS, OPTIONS_BY_MODEL, RIGS, HAIR_COLORS } from '../src/domain/characterStudio/rig.ts';

const root = resolve('public/assets/Character');
// Check both contracts before writing anything, including when only one rig has changed.
const contracts = await Promise.all(Object.entries(RIGS).map(async ([model, rig]) => {
  const fingerprint = createHash('sha256').update(JSON.stringify(rig) + (model === 'woman' ? BODY : MAN_BODY)).digest('hex');
  const baseline = JSON.parse(await readFile(`src/domain/characterStudio/${model === 'woman' ? 'baseline' : 'man-baseline'}.json`, 'utf8'));
  if (baseline.sha256 !== fingerprint) throw new Error(`${model} canonical rig changed. Restore the mannequin; correct the asset instead.`);
  return { model, rig, fingerprint };
}));
const catalog = [];
for (const { model, rig, fingerprint } of contracts) {
const directory = model === 'woman' ? 'Woman' : 'Man';
const modelRoot = resolve(root, directory);
const defaultLook = DEFAULTS[model];
const assets = new Map();
for (const [key, values] of Object.entries(OPTIONS_BY_MODEL[model])) {
  for (const value of values) {
    const look = { ...defaultLook, [key]: value };
    for (const asset of composeLayers(look, model)) {
      if (!assets.has(asset.id)) assets.set(asset.id, { asset, look });
    }
  }
}
const manifest = { ...rig, model, sha256: fingerprint, compatibleRigs: [rig.id], colorRegions: ['skin', 'hairColor', 'iris', 'lips', 'primary', 'secondary', 'trim'], assets: [] };
for (const { asset, look } of assets.values()) {
  const file = resolve(modelRoot, asset.id + '.svg');
  await mkdir(dirname(file), { recursive: true });
  await writeFile(file, renderSvg(look, asset, false, model));
  manifest.assets.push({ id: asset.id, file: asset.id + '.svg', layer: asset.layer, motion: asset.motion, rig: asset.rig });
}
await writeFile(resolve(modelRoot, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
await writeFile(resolve(modelRoot, 'preview.svg'), renderSvg(defaultLook, undefined, false, model));
await writeFile(resolve(modelRoot, 'hair-palettes.json'), JSON.stringify({ rig: rig.id, source: `Hair/Back/${defaultLook.hair}.svg`, colors: HAIR_COLORS }, null, 2) + '\n');
await mkdir(resolve(modelRoot, 'Animation/Idle'), { recursive: true });
await writeFile(resolve(modelRoot, 'Animation/Idle/manifest.json'), JSON.stringify({ rig: rig.id, durationSeconds: 6, seamless: true, breathing: { scaleY: [1, 1.002, 1], pivot: rig.anchors.feet }, hair: { rotationDegrees: [-.12, .12, -.12], pivot: rig.pivots.hair }, fabric: { scaleX: [1, 1.001, 1], pivot: rig.pivots.fabric }, accessories: { rotationDegrees: [-.15, .15, -.15], pivot: rig.pivots.accessory }, blink: { intervalMs: [2800, 6700], durationMs: 150 }, reducedMotion: 'disabled', runtime: 'CharacterStudio.vue; SVG exports are static' }, null, 2) + '\n');
const options = OPTIONS_BY_MODEL[model];
const previews = options.hair.flatMap((hair, h) => options.outfit.map((outfit, o) => ({ ...defaultLook, hair, outfit, eyes: options.eyes[(h + o) % 3], brows: options.brows[(h + 2 * o) % 3], mouth: options.mouth[(h + o + 1) % 3], accessory: options.accessory[1 + (h + o) % 2] })));
previews.push(...HAIR_COLORS.map(hairColor => ({ ...defaultLook, hairColor })));
const sheet = `<svg xmlns="http://www.w3.org/2000/svg" width="1800" height="3210" viewBox="0 0 1800 3210"><rect width="1800" height="3210" fill="#222626"/>${previews.map((look, index) => {
  const x = index % 3 * 600, y = Math.floor(index / 3) * 1070;
  return `<image x="${x}" y="${y}" width="600" height="1000" href="data:image/svg+xml;base64,${Buffer.from(renderSvg(look, undefined, false, model)).toString('base64')}"/><text x="${x + 20}" y="${y + 1025}" fill="#e8ddd0" font-family="sans-serif" font-size="18">${look.hair} / ${look.outfit} / ${look.eyes} / ${look.mouth}</text><text x="${x + 20}" y="${y + 1052}" fill="#c8ad82" font-family="sans-serif" font-size="16">${look.accessory} / hair ${look.hairColor}</text>`;
}).join('')}</svg>`;
await writeFile(resolve(modelRoot, 'combinations.svg'), sheet);
catalog.push({ model, rig: rig.id, directory, manifest: `${directory}/manifest.json`, combinations: `${directory}/combinations.svg`, assetCount: assets.size, productionApproved: false });
console.log(`Exported ${model}: ${assets.size} transparent layers, animation metadata and nine review combinations`);
}
await writeFile(resolve(root, 'catalog.json'), JSON.stringify({ models: catalog, legacyWomanLibrary: 'manifest.json' }, null, 2) + '\n');
