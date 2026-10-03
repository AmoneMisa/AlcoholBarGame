// Resize the existing paintings and split their sprite sheets. Originals stay available for large previews.
import fs from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';
import { CHARACTER_ART } from '../src/data/cosmetics/artCatalog.ts';
import { BARTENDER_AVATARS } from '../src/data/cosmetics/bartenderAvatars.ts';
import { bartenderCostumesFor, bartenderCostumeFor } from '../src/data/cosmetics/bartenderCostumes.ts';
import { INTERIORS } from '../src/data/cosmetics/bars.ts';
const require = createRequire(import.meta.url);
let sharp;
try { sharp = require('sharp'); } catch { sharp = require(path.join(process.env.LOCALAPPDATA ?? '', '../../.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp')); }
const root = new URL('../public/', import.meta.url);
const output = new URL('assets/optimized/', root);
const images = [];
async function walk(directory) {
  for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
    const file = new URL(entry.name + (entry.isDirectory() ? '/' : ''), directory);
    if (entry.isDirectory()) await walk(file); else if (entry.name.endsWith('.webp')) images.push(file);
  }
}
await walk(new URL('assets/workshop/', root));
for (const name of ['fragment-puzzle-painted-v1.webp', 'lock-painted-v1.webp']) images.push(new URL(`assets/ui/${name}`, root));
for (const asset of new Set(INTERIORS.map(interior => interior.asset))) images.push(new URL(asset.replace(/^\//, ''), root));
const thumbnails = [];
const mobileAssets = [];
for (const file of images) {
  const relative = decodeURIComponent(file.pathname.slice(root.pathname.length));
  thumbnails.push(relative);
  for (const size of [96, 192]) {
    const target = new URL(`${size}/${relative}`, output);
    await fs.mkdir(new URL('./', target), { recursive: true });
    await sharp(await fs.readFile(file)).resize(size, size, { fit: 'inside', withoutEnlargement: true }).webp({ quality: 84, alphaQuality: 100 }).toFile(target.pathname.replace(/^\/(\w:)/, '$1'));
  }
  if (relative.startsWith('assets/bar/backgrounds/')) {
    const target = new URL(`mobile/${relative}`, output);
    await fs.mkdir(new URL('./', target), { recursive: true });
    await sharp(await fs.readFile(file)).resize({ width: 960, withoutEnlargement: true }).webp({ quality: 84 }).toFile(target.pathname.replace(/^\/(\w:)/, '$1'));
    mobileAssets.push(relative);
  }
}
const sheets = new Map();
const addSheet = (sheet, columns, rows) => { if (sheet) sheets.set(sheet, { columns, rows }); };
for (const art of CHARACTER_ART) {
  addSheet(art.sheet, art.columns ?? 5, art.rows ?? 1);
  for (const sheet of art.specialSheets ?? []) addSheet(sheet, 1, 3);
}
for (const character of ['noa', 'leo']) for (const costume of bartenderCostumesFor(character)) {
  const info = bartenderCostumeFor(character, costume.value);
  addSheet(info.sheet, info.columns, info.rows);
}
const frameSheets = [];
for (const [sheet, { columns, rows }] of sheets) {
  const source = await fs.readFile(new URL(sheet.replace(/^\//, ''), root));
  const meta = await sharp(source).metadata();
  const name = path.basename(sheet, '.webp');
  frameSheets.push(sheet);
  const directory = new URL(`frames/${name}/`, output);
  await fs.mkdir(directory, { recursive: true });
  for (let index = 0; index < columns * rows; index++) {
    const col = index % columns, row = Math.floor(index / columns);
    const left = Math.round(col * meta.width / columns), top = Math.round(row * meta.height / rows);
    const width = Math.round((col + 1) * meta.width / columns) - left;
    const height = Math.round((row + 1) * meta.height / rows) - top;
    const frame = await sharp(source).extract({ left, top, width, height }).png().toBuffer();
    for (const size of [128, 512]) await sharp(frame).resize({ height: size, withoutEnlargement: true }).webp({ quality: 88, alphaQuality: 100 }).toFile(new URL(`${index}-${size}.webp`, directory).pathname.replace(/^\/(\w:)/, '$1'));
  }
}
// A square head-and-shoulders crop with breathing room, shared by the header and profile.
for (const [character, avatars] of Object.entries(BARTENDER_AVATARS)) {
  const source = await fs.readFile(new URL(avatars[0].sheet.replace(/^\//, ''), root));
  const meta = await sharp(source).metadata();
  const directory = new URL('portraits/', output);
  await fs.mkdir(directory, { recursive: true });
  for (const avatar of avatars) {
    const frameW = meta.width / 6, frameH = meta.height / 3;
    const width = Math.round(frameW * .9), height = width;
    const left = Math.round(frameW * avatar.column + frameW * .05);
    const top = 0;
    await sharp(source).extract({ left, top, width, height }).resize(88, 88).extend({ top: 4, bottom: 4, left: 4, right: 4, background: '#0000' }).webp({ quality: 90, alphaQuality: 100 }).toFile(new URL(`${character}-${avatar.hairStyle}.webp`, directory).pathname.replace(/^\/(\w:)/, '$1'));
  }
}
await fs.writeFile(new URL('../src/data/cosmetics/optimizedArt.ts', import.meta.url), `// Generated by scripts/build-performance-art.mjs; only known files are routed to smaller copies.\nexport const THUMBNAIL_ASSETS = new Set(${JSON.stringify(thumbnails)});\nexport const FRAME_SHEETS = new Set(${JSON.stringify(frameSheets)});\nexport const MOBILE_ASSETS = new Set(${JSON.stringify(mobileAssets)});\n`);
console.log(`Built ${thumbnails.length * 2} thumbnails, ${frameSheets.length} split sheets and 12 portraits.`);
