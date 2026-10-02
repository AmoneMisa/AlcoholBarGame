// Export reference masks only. No final artwork is drawn here.
import {createRequire} from 'node:module';
const sharp=createRequire(import.meta.url)('C:/Users/kubai/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
import { mkdir, writeFile } from 'node:fs/promises';
import { composeLayers, renderSvg } from '../src/domain/characterStudio/art.ts';
import { DEFAULTS, RIGS } from '../src/domain/characterStudio/rig.ts';
const root='assets-src/character-studio/painted-look';
await mkdir(`${root}/guides`,{recursive:true});
await mkdir(`${root}/sources`,{recursive:true});
const manifest={};
for(const model of ['woman','man']){
 const look=DEFAULTS[model],layers=composeLayers(look,model);
 const body=layers.find(a=>a.layer==='body');
 const clothes=layers.filter(a=>a.layer==='clothing'||a.layer==='clothingOverlay');
 const svg=s=>`<svg xmlns="http://www.w3.org/2000/svg" width="600" height="1000" viewBox="0 0 600 1000">${s}</svg>`;
 const raw=async s=>sharp(Buffer.from(s),{density:288}).resize(2400,4000).ensureAlpha().raw().toBuffer();
 const b=await raw(renderSvg(look,body,false,model));
 const c=await raw(renderSvg(look,{...clothes[0],svg:clothes.map(a=>a.svg).join('')},false,model));
 for(let i=3;i<b.length;i+=4){
  const y=Math.floor((i-3)/4/2400)/4;
  b[i]=y>600?0:Math.round(b[i]*(1-c[i]/255));
  if(b[i]<20){b[i]=0;b[i-1]=0;b[i-2]=0;b[i-3]=0;}
 }
 // Exposed skin is nonsexual and includes only head, neck, arms/hands.
 const parts={skin:b};
 for(const [name,predicate] of Object.entries({outfit:a=>a.layer==='clothing',overlay:a=>a.layer==='clothingOverlay',eyes:a=>a.layer==='eyes',brows:a=>a.layer==='brows',nose:a=>a.layer==='nose',mouth:a=>a.layer==='mouth',accessory:a=>a.layer==='accessories'})){
  const a=layers.find(predicate);parts[name]=await raw(renderSvg(look,a,false,model));
 }
 manifest[model]={rig:RIGS[model].id,assets:{}};
 for(const [name,data] of Object.entries(parts)){
  let l=2400,t=4000,r=-1,bt=-1;
  for(let y=0;y<4000;y++)for(let x=0;x<2400;x++)if(data[(y*2400+x)*4+3]>16){l=Math.min(l,x);t=Math.min(t,y);r=Math.max(r,x);bt=Math.max(bt,y)}
  const bounds={left:l,top:t,width:r-l+1,height:bt-t+1};
  await sharp(data,{raw:{width:2400,height:4000,channels:4}}).extract(bounds).png().toFile(`${root}/guides/${model}-${name}.png`);
  manifest[model].assets[name]={file:`${model}-${name}.png`,bounds:[l/4,t/4,bounds.width/4,bounds.height/4]};
 }
}
await writeFile(`${root}/guides/manifest.json`,JSON.stringify(manifest,null,2));
console.log('Painted-look reference masks exported.');
