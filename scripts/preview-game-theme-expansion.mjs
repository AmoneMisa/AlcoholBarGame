import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';

const sharp = createRequire(import.meta.url)('C:/Users/kubai/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const second = process.argv.includes('--second');
const name = second ? 'game-theme-expansion-2' : 'game-theme-expansion';
const manifest = JSON.parse(await readFile(`scripts/${name}.json`, 'utf8'));
const results = JSON.parse(await readFile(`scripts/${name}-results.json`, 'utf8'));
for (const correction of JSON.parse(await readFile(`scripts/${name}-corrections.json`, 'utf8'))) {
  const index = results.findIndex(result => result.key === correction.key);
  if (index < 0) results.push(correction);
  else results[index] = correction;
}
const escape = value => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;');
const ready = manifest.themes.filter(theme => [`interior-${theme.id}`, `theme-${theme.id}-noa`, `theme-${theme.id}-leo`].every(key => results.some(result => result.key === key)));
if (!ready.length) { console.log('No complete pairs yet.'); process.exit(0); }
const cards = [];
for (const [index, theme] of ready.entries()) {
  const source = key => results.find(result => result.key === key).path;
  const layers = [{ input: await sharp(source(`interior-${theme.id}`)).resize(640, 360, { fit: 'cover' }).png().toBuffer(), left: 0, top: 0 }];
  for (const [column, character] of ['noa', 'leo'].entries()) {
    const art = await sharp(source(`theme-${theme.id}-${character}`)).trim().resize(235, 315, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer();
    layers.push({ input: art, left: 45 + column * 315, top: 38 });
  }
  layers.push({ input: Buffer.from(`<svg width="640" height="45"><rect width="640" height="45" fill="#141a27"/><text x="14" y="28" fill="#f5d99c" font-family="Arial" font-size="19">${escape(theme.name)}</text></svg>`), left: 0, top: 360 });
  const card = await sharp({ create: { width: 640, height: 405, channels: 4, background: '#141a27' } }).composite(layers).webp({ quality: 89 }).toBuffer();
  cards.push({ input: card, left: index % 3 * 640, top: Math.floor(index / 3) * 405 });
}
await sharp({ create: { width: 1920, height: Math.ceil(cards.length / 3) * 405, channels: 4, background: '#141a27' } }).composite(cards).webp({ quality: 89 }).toFile(`docs/${name}-preview.webp`);
const selected = ready.length === manifest.themes.length ? (second ? [0, 1, 8, 10, 11, 17] : [0, 2, 5, 10, 15, 16]).map(index => cards[index]) : cards.slice(0, 6);
const highlights = await Promise.all(selected.map(async (card, index) => ({ input: await sharp(card.input).resize(400, 253).webp({ quality: 90 }).toBuffer(), left: index % 3 * 400, top: Math.floor(index / 3) * 253 })));
await sharp({ create: { width: 1200, height: Math.ceil(highlights.length / 3) * 253, channels: 4, background: '#141a27' } }).composite(highlights).webp({ quality: 90 }).toFile(`docs/${name}-overview.webp`);
for (const character of ['noa', 'leo']) {
  const jobs = manifest.jobs.filter(job => job.character === character && results.some(result => result.key === job.key));
  const layers = [];
  for (const [index, job] of jobs.entries()) {
    const art = await sharp(results.find(result => result.key === job.key).path).trim().resize(230, 330, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer();
    layers.push({ input: art, left: index % 4 * 250 + 10, top: Math.floor(index / 4) * 370 });
    layers.push({ input: Buffer.from(`<svg width="250" height="40"><text x="8" y="25" fill="#f5d99c" font-family="Arial" font-size="14">${escape(job.label)}</text></svg>`), left: index % 4 * 250, top: Math.floor(index / 4) * 370 + 330 });
  }
  await sharp({ create: { width: 1000, height: Math.ceil(jobs.length / 4) * 370, channels: 4, background: '#293144' } }).composite(layers).webp({ quality: 90 }).toFile(`docs/${character}-${name}-preview.webp`);
}
console.log(`Previewed ${ready.length}/${manifest.themes.length} complete themes.`);
