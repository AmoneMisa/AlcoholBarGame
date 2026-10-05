#!/usr/bin/env node
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';

const [, , manifestArg, ...flags] = process.argv;
if(!manifestArg){
  console.error('Usage: node scripts/modular-scene-plan.mjs <manifest.json> [--apply]');
  process.exit(1);
}

function uint24le(buffer,offset){return buffer[offset] | (buffer[offset+1]<<8) | (buffer[offset+2]<<16);}
function webpSize(buffer){
  if(buffer.toString('ascii',0,4)!=='RIFF'||buffer.toString('ascii',8,12)!=='WEBP') throw new Error('Source is not a WebP file.');
  for(let offset=12;offset+8<=buffer.length;){
    const kind=buffer.toString('ascii',offset,offset+4);
    const size=buffer.readUInt32LE(offset+4);
    const start=offset+8;
    if(kind==='VP8X') return {width:uint24le(buffer,start+4)+1,height:uint24le(buffer,start+7)+1};
    if(kind==='VP8 '){
      if(buffer[start+3]!==0x9d||buffer[start+4]!==0x01||buffer[start+5]!==0x2a) throw new Error('Invalid VP8 frame header.');
      return {width:buffer.readUInt16LE(start+6)&0x3fff,height:buffer.readUInt16LE(start+8)&0x3fff};
    }
    if(kind==='VP8L'){
      if(buffer[start]!==0x2f) throw new Error('Invalid VP8L frame header.');
      const b1=buffer[start+1],b2=buffer[start+2],b3=buffer[start+3],b4=buffer[start+4];
      return {width:1+(b1|((b2&0x3f)<<8)),height:1+(((b2&0xc0)>>6)|(b3<<2)|((b4&0x0f)<<10))};
    }
    offset=start+size+(size%2);
  }
  throw new Error('Could not read WebP dimensions.');
}

const manifestPath=resolve(manifestArg);
const manifest=JSON.parse(await readFile(manifestPath,'utf8'));
const apply=flags.includes('--apply');
const legacyPublic=(value)=>typeof value==='string'&&value.startsWith('../../../public/') ? value.replace('../../../public/','../../public/') : value;
const source=resolve(dirname(manifestPath),legacyPublic(manifest.source));
const outDir=resolve(dirname(manifestPath),legacyPublic(manifest.outputDir??`../../public/assets/bar/modular/${manifest.id}`));
const detected=webpSize(await readFile(source));
const authorWidth=Number(manifest.canvas?.width??detected.width),authorHeight=Number(manifest.canvas?.height??detected.height);
const width=detected.width,height=detected.height;
if(!(authorWidth>0&&authorHeight>0&&width>0&&height>0)) throw new Error('Could not determine canvas size.');
const authorAspect=authorWidth/authorHeight,sourceAspect=width/height;
if(Math.abs(authorAspect-sourceAspect)>0.015) throw new Error(`${manifest.id}: authoring canvas aspect ${authorWidth}x${authorHeight} does not match source ${width}x${height}`);

const normalized=(rect)=>({
  x:+(rect.x/authorWidth).toFixed(6),y:+(rect.y/authorHeight).toFixed(6),
  width:+(rect.width/authorWidth).toFixed(6),height:+(rect.height/authorHeight).toFixed(6)
});
const sourcePixels=(normalizedRect)=>({
  x:Math.round(normalizedRect.x*width),y:Math.round(normalizedRect.y*height),
  width:Math.round(normalizedRect.width*width),height:Math.round(normalizedRect.height*height)
});
const moduleCrop=(spec)=>{
  if(spec.crop)return sourcePixels(normalized(spec.crop));
  if(spec.cropNormalized)return sourcePixels(spec.cropNormalized);
  throw new Error(`${manifest.id}: module is missing crop/cropNormalized`);
};
const moduleEntries=Object.entries(manifest.modules??{}).map(([id,spec])=>{
  const crop=moduleCrop(spec);
  const rect=normalized(crop);
  return [id,{...spec,crop,rect}];
});
const slots={
  ...Object.fromEntries(Object.entries(manifest.slots??{}).map(([id,rect])=>[id,normalized(rect)])),
  ...(manifest.slotsNormalized??{})
};
const cutouts=[
  ...(manifest.windowCutouts??[]).map(normalized),
  ...(manifest.windowCutoutsNormalized??[])
];
const plan={
  id:manifest.id,
  canvas:{width,height},
  authoringCanvas:{width:authorWidth,height:authorHeight},
  source:manifest.source,
  modules:Object.fromEntries(moduleEntries),
  slots,
  windowCutouts:cutouts,
  shelfRows:manifest.shelfRowsNormalized??manifest.shelfRows??[],
  seatAnchors:manifest.seatAnchorsNormalized??manifest.seatAnchors??[],
  bartenderAnchor:manifest.bartenderAnchorNormalized??manifest.bartenderAnchor??null,
  status:manifest.status??'authoring',
  geometrySource:manifest.geometrySource??null,
  review:manifest.review??{},
  notes:manifest.notes??[]
};
const planPath=resolve(outDir,'scene-plan.json');
await mkdir(outDir,{recursive:true});
await writeFile(planPath,JSON.stringify(plan,null,2)+'\n');
console.log(`Wrote ${planPath} (${width}x${height})`);

for(const [id,spec] of moduleEntries){
  const {x,y,width:cropW,height:cropH}=spec.crop;
  if(x<0||y<0||cropW<=0||cropH<=0||x+cropW>width||y+cropH>height) throw new Error(`${manifest.id}.${id}: crop outside source canvas`);
  const output=resolve(outDir,`${id}.webp`);
  const args=[source,'-crop',`${cropW}x${cropH}+${x}+${y}`,'+repage','-quality',String(spec.quality??92),output];
  console.log(`magick ${args.map(value=>JSON.stringify(value)).join(' ')}`);
  if(apply){
    const run=spawnSync('magick',args,{stdio:'inherit'});
    if(run.error?.code==='ENOENT') throw new Error('ImageMagick is required only for --apply. Install it or run the printed commands elsewhere.');
    if(run.status!==0) process.exit(run.status??1);
  }
}

if(cutouts.length) console.log(`\nWindow contract: make these normalized panes transparent in the clean architecture plate: ${JSON.stringify(cutouts)}`);

console.log('\nGeneration/inpainting contract:');
for(const [id,spec] of moduleEntries){
  if(spec.prompt) console.log(`- ${id}: ${spec.prompt}`);
}
