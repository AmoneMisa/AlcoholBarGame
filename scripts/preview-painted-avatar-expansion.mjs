import { createRequire } from 'node:module';
const sharp = createRequire(import.meta.url)(process.env.ART_SHARP_PATH || 'C:/Users/kubai/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const appearances = [
  ['noa', 3, 'Noa · Twin braids', 'botanical-room'],
  ['noa', 4, 'Noa · Short pixie', 'velvet-hour-bar'],
  ['noa', 5, 'Noa · High ponytail', 'skyline-lounge'],
  ['leo', 3, 'Leo · Undercut', 'skyline-lounge'],
  ['leo', 4, 'Leo · Pompadour', 'velvet-hour-bar'],
  ['leo', 5, 'Leo · Shoulder-length waves', 'botanical-room'],
];
const layers = [];
for (let i = 0; i < appearances.length; i++) {
  const [key, column, label, room] = appearances[i];
  const sheet = `public/assets/characters/bartender/${key}-natural-atlas-v2.webp`;
  const { width, height } = await sharp(sheet).metadata();
  const figure = await sharp(sheet).extract({ left: column * width / 6, top: 0, width: width / 6, height: height / 3 }).resize({ height: 400 }).png().toBuffer();
  const { width: figureWidth } = await sharp(figure).metadata();
  const background = await sharp(`public/assets/bar/backgrounds/${room}.webp`).resize(330, 420, { fit: 'cover' }).png().toBuffer();
  const panel = await sharp(background).composite([{ input: figure, top: 20, left: Math.floor((330 - figureWidth) / 2) }]).png().toBuffer();
  const x = i % 3 * 330, y = Math.floor(i / 3) * 460;
  layers.push({ input: panel, left: x, top: y });
  layers.push({ input: Buffer.from(`<svg width="330" height="40"><rect width="330" height="40" fill="#142032"/><text x="165" y="25" text-anchor="middle" font-family="Arial" font-size="16" fill="#ffe4b5">${label}</text></svg>`), left: x, top: y + 420 });
}
await sharp({ create: { width: 990, height: 920, channels: 4, background: '#142032' } }).composite(layers).webp({ quality: 94 }).toFile('docs/painted-avatar-expansion.webp');
console.log('Saved docs/painted-avatar-expansion.webp');
