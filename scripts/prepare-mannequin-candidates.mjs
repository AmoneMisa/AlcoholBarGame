// Anatomy review only. These are not locked rigs and may not be mixed with v1 assets.
import { createRequire } from 'node:module';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
const sharp = createRequire(import.meta.url)('C:/Users/kubai/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const output = 'public/assets/Character/MannequinCandidates';
await mkdir(output, { recursive: true });
const manifest = { status: 'anatomy-review-not-locked', canvas: [600, 1000], models: {} };
for (const model of ['woman', 'man']) {
  const input = await readFile(`${output}/Sources/${model}-original.png`);
  const normalized = await sharp(input).resize({ height: 1800, fit: 'inside' }).png().toBuffer();
  const meta = await sharp(normalized).metadata();
  const left = Math.round((1200 - meta.width) / 2);
  const top = Math.round((2000 - meta.height) / 2);
  const composite = await sharp({ create: { width: 1200, height: 2000, channels: 4, background: '#00000000' } })
    .composite([{ input: normalized, left, top }]).ensureAlpha().raw().toBuffer();
  // Generated transparent edges contain colored halo pixels; tighten only alpha.
  for (let i = 3; i < composite.length; i += 4) {
    const a = composite[i];
    composite[i] = a <= 175 ? 0 : a >= 245 ? 255 : Math.round((a - 175) / 70 * 255);
  }
  const master = await sharp(composite, { raw: { width: 1200, height: 2000, channels: 4 } }).png().toBuffer();
  await writeFile(`${output}/${model}-base.png`, master);
  manifest.models[model] = { image: `${model}-base.png`, source: `Sources/${model}-original.png`, frame: [left / 2, top / 2, meta.width / 2, meta.height / 2] };
}
await writeFile(`${output}/manifest.json`, JSON.stringify(manifest, null, 2));
console.log('Prepared face-free, clothing-free anatomy candidates on separate fixed canvases.');
