import { createRequire } from 'node:module';
import { bartenderCostumesFor, bartenderCostumeFor } from '../src/data/cosmetics/bartenderCostumes.ts';
const sharp = createRequire(import.meta.url)(process.env.ART_SHARP_PATH || 'C:/Users/kubai/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const layers = [];
const rooms = ['velvet-hour-bar', 'botanical-room', 'skyline-lounge'];
const batch = Number(process.argv[2] || 1);
const output = batch === 1 ? 'docs/bartender-costumes-preview.webp' : batch === 2 ? 'docs/bartender-costumes-expansion-preview.webp' : `docs/bartender-costumes-batch-${batch}-preview.webp`;
let rowOffset = 0;
for (const character of ['noa', 'leo']) {
  const costumes = bartenderCostumesFor(character).slice((batch - 1) * 6, batch * 6);
  for (const [index, costume] of costumes.entries()) {
    const sheet = `public${bartenderCostumeFor(character, costume.value).sheet}`;
    const figure = await sharp(sheet).extract({ left: index % 3 * 316, top: Math.floor(index / 3) * 552, width: 316, height: 552 }).resize({ height: 370 }).png().toBuffer();
    const { width } = await sharp(figure).metadata();
    const background = await sharp(`public/assets/bar/backgrounds/${rooms[index % 3]}.webp`).resize(330, 380, { fit: 'cover' }).png().toBuffer();
    const panel = await sharp(background).composite([{ input: figure, left: Math.floor((330 - width) / 2), top: 10 }]).png().toBuffer();
    const left = index % 3 * 330, top = (rowOffset + Math.floor(index / 3)) * 420;
    layers.push({ input: panel, left, top });
    const label = `${character === 'noa' ? 'Noa' : 'Leo'} · ${costume.label}`.replaceAll('&', '&amp;');
    layers.push({ input: Buffer.from(`<svg width="330" height="40"><rect width="330" height="40" fill="#142032"/><text x="165" y="25" text-anchor="middle" font-family="Arial" font-size="15" fill="#ffe4b5">${label}</text></svg>`), left, top: top + 380 });
  }
  rowOffset += Math.ceil(costumes.length / 3);
}
await sharp({ create: { width: 990, height: Math.max(1, rowOffset) * 420, channels: 4, background: '#142032' } }).composite(layers).webp({ quality: 92 }).toFile(output);
console.log(`Saved ${output}`);
