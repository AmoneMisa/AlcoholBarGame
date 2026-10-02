import { createRequire } from 'node:module';
import { bartenderCostumeFor } from '../src/data/cosmetics/bartenderCostumes.ts';
const sharp = createRequire(import.meta.url)(process.env.ART_SHARP_PATH || 'C:/Users/kubai/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const layers = [];
for (const [index, character] of ['noa', 'leo'].entries()) {
  const costume = bartenderCostumeFor(character, `reference-shark-${character}`);
  if (!costume) throw new Error(`Missing shark costume for ${character}`);
  const figure = await sharp(`public${costume.sheet}`).extract({ left: costume.index % costume.columns * 316, top: Math.floor(costume.index / costume.columns) * 552, width: 316, height: 552 }).resize({ height: 370 }).png().toBuffer();
  const { width } = await sharp(figure).metadata();
  const room = index === 0 ? 'botanical-room' : 'skyline-lounge';
  const background = await sharp(`public/assets/bar/backgrounds/${room}.webp`).resize(330, 380, { fit: 'cover' }).png().toBuffer();
  const panel = await sharp(background).composite([{ input: figure, left: Math.floor((330 - width) / 2), top: 10 }]).png().toBuffer();
  layers.push({ input: panel, left: index * 330, top: 0 });
  layers.push({ input: Buffer.from(`<svg width="330" height="40"><rect width="330" height="40" fill="#142032"/><text x="165" y="25" text-anchor="middle" font-family="Arial" font-size="16" fill="#ffe4b5">${character === 'noa' ? 'Noa' : 'Leo'} · Shark costume</text></svg>`), left: index * 330, top: 380 });
}
await sharp({ create: { width: 660, height: 420, channels: 4, background: '#142032' } }).composite(layers).webp({ quality: 92 }).toFile('docs/shark-costumes-preview.webp');
console.log('Saved docs/shark-costumes-preview.webp');
