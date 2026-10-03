import {createRequire} from 'node:module';import {readFile} from 'node:fs/promises';
const sharp=createRequire(import.meta.url)(process.env.ART_SHARP_PATH || 'C:/Users/kubai/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const {source}=JSON.parse(await readFile('scripts/wheel-pointer-art.json','utf8'));
const pointer=await sharp(source).trim().resize(72,104,{fit:'contain',background:'#00000000'}).png().toBuffer();
const base=await sharp({create:{width:256,height:256,channels:4,background:'#00000000'}}).composite([{input:pointer,left:92,top:116}]).png().toBuffer();
const frames=[];
for(const angle of [0,-10,-22,-10,5,0]){
 const rotated=await sharp(base).rotate(angle,{background:'#00000000'}).png().toBuffer();const {width,height}=await sharp(rotated).metadata();
 frames.push(await sharp(rotated).extract({left:Math.floor(width/2)-64,top:Math.floor(height/2)-32,width:128,height:160}).raw().toBuffer());
}
await sharp(frames[0],{raw:{width:128,height:160,channels:4}}).webp({quality:90,alphaQuality:100}).toFile('public/assets/ui/wheel-pointer-still-v1.webp');
for(const [speed,delay] of Object.entries({fast:[18,24,28,24,24,42],medium:[35,40,45,40,40,100],slow:[50,60,70,60,60,250]})){
 const out='public/assets/ui/wheel-pointer-'+speed+'-v1.webp';
 await sharp(Buffer.concat(frames),{raw:{width:128,height:960,channels:4,pageHeight:160}}).webp({quality:85,alphaQuality:100,loop:0,delay}).toFile(out);
 const metadata=await sharp(out,{animated:true}).metadata();if(metadata.pages!==6)throw new Error('Animation frame count wrong');console.log(speed,metadata.pages,metadata.delay);
}
