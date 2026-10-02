import fs from 'node:fs/promises';
import { createRequire } from 'node:module';
import { renderSvg } from '../src/domain/characterStudio/art.ts';
import { paintedLook } from '../src/domain/characterStudio/painted.ts';
const sharp=createRequire(import.meta.url)('C:/Users/kubai/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const root='assets-src/character-studio/painted-look/qa';
await fs.mkdir(root,{recursive:true});
for(const model of ['woman','man']) {
 let svg=renderSvg(paintedLook(model),undefined,false,model);
 for(const url of new Set([...svg.matchAll(/href="(\/assets\/[^"<>]+)"/g)].map(m=>m[1]))) svg=svg.replaceAll(url,'data:image/png;base64,'+(await fs.readFile('public'+url)).toString('base64'));
 await fs.writeFile(`${root}/${model}.svg`,svg);
 const png=await sharp(Buffer.from(svg),{density:144}).png().toBuffer();
 await sharp(png).flatten({background:'#353b39'}).toFile(`${root}/${model}.png`);
 await sharp(png).extract({left:440,top:130,width:330,height:430}).flatten({background:'#353b39'}).resize(660,860).toFile(`${root}/${model}-face.png`);
 if(model==='woman'){
  await sharp(png).extract({left:350,top:130,width:500,height:620}).flatten({background:'#29211e'}).resize(500,620).toFile(`${root}/woman-dialogue-v2.png`);
  const closed=svg.replace('.eye-shut{display:none}', '.eye-shut{display:inline}.eye-open{display:none}');
  await sharp(Buffer.from(closed),{density:144}).extract({left:440,top:130,width:330,height:430}).flatten({background:'#353b39'}).png().toFile(`${root}/woman-blink-v2.png`);
 }
}
