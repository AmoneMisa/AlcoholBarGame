import {createRequire} from 'node:module';
import {readFile} from 'node:fs/promises';
const sharp=createRequire(import.meta.url)('C:/Users/kubai/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const manifest=JSON.parse(await readFile('scripts/iconic-costume-revisions.json','utf8'));
const results=JSON.parse(await readFile('scripts/iconic-costume-revision-results.json','utf8'));
const ready=manifest.jobs.map(job=>({...job,...results.find(r=>r.key===job.key)})).filter(job=>job.path);
if(!ready.length) throw Error('No revised costumes ready');
const escape=text=>text.replaceAll('&','&amp;').replaceAll('<','&lt;');
for(const [group,outfits] of [['all',ready],['noa',ready.filter(j=>j.character==='noa')],['leo',ready.filter(j=>j.character==='leo')]]) {
if(!outfits.length) continue;
const layers=[];
for(const [index,job] of outfits.entries()) {
  const art=await sharp(job.path).trim().resize(240,350,{fit:'contain',background:{r:0,g:0,b:0,alpha:0}}).png().toBuffer();
  layers.push({input:art,left:index%4*250+5,top:Math.floor(index/4)*390});
  const label=job.name==='Commander Shepard, female'?'Female Shepard':job.name==='Commander Shepard, male'?'Male Shepard':job.name.split(',')[0];
  const caption=Buffer.from(`<svg width="250" height="40"><text x="10" y="26" fill="#f5d99c" font-family="Arial" font-size="16">${escape(label)}</text></svg>`);
  layers.push({input:caption,left:index%4*250,top:Math.floor(index/4)*390+350});
}
await sharp({create:{width:1000,height:Math.ceil(outfits.length/4)*390,channels:4,background:'#293144'}}).composite(layers).webp({quality:92}).toFile(group==='all'?'docs/iconic-costumes-preview.webp':`docs/iconic-${group}-costumes-preview.webp`);
}
console.log(`Previewed ${ready.length} revised costumes.`);
