import {readFile,writeFile} from 'node:fs/promises';
const revisions=JSON.parse(await readFile('scripts/iconic-costume-revisions.json','utf8'));
const revisedResults=JSON.parse(await readFile('scripts/iconic-costume-revision-results.json','utf8'));
const manifest=JSON.parse(await readFile('scripts/themed-bar-generations.json','utf8'));
const results=JSON.parse(await readFile('scripts/themed-bar-results.json','utf8'));
if(revisions.jobs.length!==16 || revisedResults.length!==16 || revisedResults.some(r=>!r.path || r.error)) throw Error('All sixteen revised costumes must succeed before installation');
for(const revision of revisions.jobs) {
  const job=manifest.jobs.find(j=>j.key===revision.key);
  const result=results.find(r=>r.key===revision.key);
  const revised=revisedResults.find(r=>r.key===revision.key);
  if(!job || !result || !revised) throw Error(`Missing costume ${revision.key}`);
  result.replacedGeneration ??= {path:result.path,prompt:result.prompt};
  Object.assign(job,revision);
  Object.assign(result,revised);
}
await writeFile('scripts/themed-bar-generations.json',JSON.stringify(manifest,null,2));
await writeFile('scripts/themed-bar-results.json',JSON.stringify(results,null,2));
console.log('Updated sixteen costume sources; run install-themed-bar-assets.mjs to repack their existing cells.');
