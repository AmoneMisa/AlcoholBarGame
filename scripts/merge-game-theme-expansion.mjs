import { readFile, writeFile } from 'node:fs/promises';

const base = process.argv.includes('--second') ? 'scripts/game-theme-expansion-2' : 'scripts/game-theme-expansion';
const expansion = JSON.parse(await readFile(`${base}.json`, 'utf8'));
const additions = JSON.parse(await readFile(`${base}-results.json`, 'utf8'));
const corrections = JSON.parse(await readFile(`${base}-corrections.json`, 'utf8'));
for (const correction of corrections) {
  const index = additions.findIndex(item => item.key === correction.key);
  if (index < 0) additions.push(correction);
  else additions[index] = correction;
  const job = expansion.jobs.find(job => job.key === correction.key);
  job.originalPrompt ??= job.prompt;
  job.originalReference ??= job.reference;
  Object.assign(job, { prompt: correction.prompt, reference: correction.reference });
}
const manifest = JSON.parse(await readFile('scripts/themed-bar-generations.json', 'utf8'));
const results = JSON.parse(await readFile('scripts/themed-bar-results.json', 'utf8'));
for (const job of expansion.jobs) {
  // A blocked generation stays in the expansion queue, outside the live atlas order.
  if (!additions.some(result => result.key === job.key && result.path)) continue;
  const index = manifest.jobs.findIndex(item => item.key === job.key);
  if (index < 0) manifest.jobs.push(job);
  else manifest.jobs[index] = job;
}
for (const result of additions) {
  const index = results.findIndex(item => item.key === result.key);
  if (index < 0) results.push(result);
  else results[index] = result;
}
await writeFile('scripts/themed-bar-generations.json', JSON.stringify(manifest, null, 2) + '\n');
await writeFile('scripts/themed-bar-results.json', JSON.stringify(results, null, 2) + '\n');
await writeFile(`${base}.json`, JSON.stringify(expansion, null, 2) + '\n');
if (process.argv.includes('--finalize')) {
  const complete = expansion.jobs.map(job => additions.find(result => result.key === job.key));
  if (complete.some(result => !result?.path)) throw Error('Cannot finalize an incomplete expansion.');
  await writeFile(`${base}-results.json`, JSON.stringify(complete, null, 2) + '\n');
}
console.log(`Expansion: ${additions.length}/${expansion.jobs.length} generated assets; ${manifest.jobs.length} total jobs.`);
