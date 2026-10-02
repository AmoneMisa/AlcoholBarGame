import {sharp,sourceRoot} from './painted-look-lib.mjs';
import {readdir,mkdir,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
const folder='C:/Users/kubai/Desktop/Samples for modelling';
const files=(await readdir(folder)).filter(f=>/\.(jpg|jpeg|png|webp|avif)$/i.test(f)).sort();
const dest=`${sourceRoot}/reference-index`;await mkdir(dest,{recursive:true});
await writeFile(`${dest}/files.json`,JSON.stringify(files.map((name,i)=>({index:i+1,name,path:join(folder,name)})),null,2));
for(let page=0;page<Math.ceil(files.length/25);page++){
 const layers=[];
 for(let j=0;j<25&&page*25+j<files.length;j++){
  const i=page*25+j,x=(j%5)*230,y=Math.floor(j/5)*290;
  try{layers.push({input:await sharp(join(folder,files[i])).resize(220,260,{fit:'contain',background:'#d8d8d8'}).png().toBuffer(),left:x+5,top:y+5})}catch(e){console.log('Unreadable',files[i],e.message)}
  const label=`${i+1}. ${files[i].slice(0,24)}`.replaceAll('&','&amp;').replaceAll('<','&lt;');
  layers.push({input:Buffer.from(`<svg width="230" height="25"><rect width="230" height="25" fill="#fff"/><text x="5" y="17" font-family="Arial" font-size="12">${label}</text></svg>`),left:x,top:y+265});
 }
 await sharp({create:{width:1150,height:1450,channels:4,background:'#fff'}}).composite(layers).png().toFile(`${dest}/sheet-${page+1}.png`);
}
console.log(`${files.length} references indexed without modifying originals.`);
