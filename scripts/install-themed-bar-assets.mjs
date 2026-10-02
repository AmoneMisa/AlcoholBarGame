import { createRequire } from 'node:module';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
const sharp = createRequire(import.meta.url)(process.env.ART_SHARP_PATH || 'C:/Users/kubai/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const manifest = JSON.parse(await readFile('scripts/themed-bar-generations.json','utf8'));
const results = JSON.parse(await readFile('scripts/themed-bar-results.json','utf8'));
const jobs = manifest.jobs.map(job=>({ ...job, ...results.find(result=>result.key===job.key) }));
const missing = jobs.filter(job=>!job.path);
if (missing.length && !process.argv.includes('--partial')) throw Error(`Missing ${missing.length} generations: ${missing.map(job=>job.key).join(', ')}`);
await mkdir('public/assets/bar/backgrounds',{recursive:true});
await mkdir('public/assets/characters/bartender',{recursive:true});
const assets=[];
for (const job of jobs.filter(job=>job.kind==='background' && job.path)) {
  const output=`public/assets/bar/backgrounds/${job.key}.webp`;
  await sharp(job.path).webp({quality:92}).toFile(output);
  assets.push({key:job.key,asset:output,source:job.path});
}
for (const character of ['noa','leo']) {
  const costumes=jobs.filter(job=>job.kind==='costume' && job.character===character);
  for(let offset=0;offset<costumes.length;offset+=6) {
    const frames=costumes.slice(offset,offset+6);
    if(frames.some(frame=>!frame.path)) continue;
    const layers=[];
    for(const [index,frame] of frames.entries()) {
      const metadata=await sharp(frame.path).metadata();
      if(!metadata.hasAlpha) throw Error(`${frame.key} needs alpha transparency`);
      layers.push({input:await sharp(frame.path).trim().resize(306,542,{fit:'contain',background:{r:0,g:0,b:0,alpha:0}}).extend({top:5,bottom:5,left:5,right:5,background:{r:0,g:0,b:0,alpha:0}}).png().toBuffer(),left:index%3*316,top:Math.floor(index/3)*552});
    }
    const key=`${character}-themed-atlas-v${Math.floor(offset/6)+1}`;
    const output=`public/assets/characters/bartender/${key}.webp`;
    await sharp({create:{width:948,height:1104,channels:4,background:{r:0,g:0,b:0,alpha:0}}}).composite(layers).webp({quality:93,alphaQuality:100}).toFile(output);
    assets.push({key,asset:output,columns:3,rows:2,frame:[316,552],poses:1,frames:frames.map(frame=>({value:frame.value,label:frame.label,theme:frame.theme,source:frame.path}))});
  }
}
await writeFile('docs/themed-bar-delivery.json',JSON.stringify({tool:manifest.tool,backgroundCount:13,costumeCount:70,assets},null,2));
console.log(`Installed ${assets.length} themed backgrounds and costume atlases.`);
