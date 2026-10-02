import { createRequire } from 'node:module';
import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';
const sharp = createRequire(import.meta.url)(process.env.ART_SHARP_PATH || 'C:/Users/kubai/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const records = JSON.parse(await readFile(new URL('./painted-avatar-assets.json', import.meta.url)));
const atlasScenes = {
  'interiors-classic-atlas': ['speakeasy', 'jazz-cellar', 'art-deco', 'library'],
  'interiors-world-atlas': ['palace', 'tropical', 'desert', 'winter'],
  'interiors-nightlife-atlas': ['beach', 'rooftop', 'cyberpunk', 'izakaya'],
  'interiors-atmosphere-atlas': ['marina', 'parisian', 'loft', 'riad'],
};
const selected = new Set(process.argv.slice(2));
let delivered = [];
if (selected.size) {
  try {
    const previous = JSON.parse(await readFile('docs/painted-avatar-delivery.json', 'utf8'));
    delivered = previous.assets.filter(asset => !selected.has(asset.key));
  } catch (error) { if (error.code !== 'ENOENT') throw error; }
}
for (const { key, path, prompt, reference, frames } of records) {
  if (selected.size && !selected.has(key)) continue;
  const isBartender = /^(noa|leo)-/.test(key);
  const folder = isBartender ? 'public/assets/characters/bartender' : 'public/assets/bar/backgrounds';
  await mkdir(folder, { recursive: true });
  const metadata = await sharp(path).metadata();
  if (isBartender && !metadata.hasAlpha) throw new Error(`${key} needs alpha`);
  if (isBartender) {
    const compact = key.includes('natural-atlas');
    const costumes = key.includes('costumes-atlas');
    // Six hairstyles share one atlas. Special outfits retain only their first pose column.
    if (!compact && !costumes && !key.includes('special')) continue;
    const width = costumes ? 948 : compact ? 1896 : 316, height = costumes ? 1104 : 1656;
    let pipeline = sharp(path);
    if (frames?.length) {
      if (!costumes || frames.length > 6) throw new Error(`${key} supports up to six costume cutouts`);
      const layers = await Promise.all(frames.map(async (frame, index) => ({
        input: await sharp(frame.path).resize(316, 552, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer(),
        left: index % 3 * 316, top: Math.floor(index / 3) * 552,
      })));
      pipeline = sharp({ create: { width, height, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } }).composite(layers);
    }
    if (!compact && !costumes) pipeline = pipeline.extract({ left: 0, top: 0, width: Math.floor(metadata.width / 3), height: metadata.height });
    await pipeline.resize(width, height).webp({ quality: 93, alphaQuality: 100 }).toFile(`${folder}/${key}.webp`);
    delivered.push({ key, prompt, reference, frames, native: [metadata.width, metadata.height], sheet: `${folder}/${key}.webp`, dimensions: [width, height], columns: costumes ? 3 : compact ? 6 : 1, rows: costumes ? 2 : 3, poses: 1 });
  } else {
    await copyFile(path, `${folder}/${key}.png`);
    const scenes = atlasScenes[key];
    if (scenes) {
      const width = Math.floor(metadata.width / 2), height = Math.floor(metadata.height / 2);
      for (let i = 0; i < scenes.length; i++) {
        await sharp(path).extract({ left: i % 2 * width + 2, top: Math.floor(i / 2) * height + 2, width: width - 4, height: height - 4 }).webp({ quality: 92 }).toFile(`${folder}/interior-${scenes[i]}.webp`);
      }
    } else await sharp(path).webp({ quality: 92 }).toFile(`${folder}/${key}.webp`);
    delivered.push({ key, prompt, native: [metadata.width, metadata.height], scenes: scenes ?? [key] });
  }
}
await mkdir('docs', { recursive: true });
await writeFile('docs/painted-avatar-delivery.json', JSON.stringify({ tool: 'built-in image_gen', styleReference: 'C:/Users/kubai/Desktop/Samples for modelling/do-semi-realistic-character-designw.png', assets: delivered }, null, 2));
console.log(`Delivery catalog contains ${delivered.length} generated sheets/background masters.`);
