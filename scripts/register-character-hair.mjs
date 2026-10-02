// Deterministic texture registration onto an approved mask. No artwork is drawn here.
// This first registration tool is deliberately restricted to front-hair topology.
import { createRequire } from 'node:module';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { createHash } from 'node:crypto';
const require = createRequire(import.meta.url);
const sharp = require(process.env.CHARACTER_SHARP_PATH || 'C:/Users/kubai/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const [model, style, sourceFile, destination] = process.argv.slice(2);
const guidesRoot=resolve('assets-src/character-studio/production/guides');
const guideManifest=JSON.parse(await readFile(resolve(guidesRoot,`${model}.json`),'utf8'));
const guide=guideManifest.assets.find(a=>a.id===`Hair/Front/${style}`);
if(!guide)throw new Error('Unknown hair/rig combination');
const sourceBytes=await readFile(sourceFile);
const source=await sharp(sourceBytes).ensureAlpha().raw().toBuffer({resolveWithObject:true});
const target=await sharp(resolve(guidesRoot,guide.crop)).ensureAlpha().raw().toBuffer({resolveWithObject:true});
if(source.info.width<target.info.width||source.info.height<target.info.height)throw new Error('Source is too small. Upscaling a master is forbidden.');
function spans(image,y){
 const width=image.info.width, middle=Math.floor(width/2);
 const solid=x=>image.data[(y*width+x)*4+3]>128;
 let left=0,right=width-1;
 while(left<width&&!solid(left))left++;
 while(right>=0&&!solid(right))right--;
 if(left>right)return [];
 if(solid(middle))return [[left,right]];
 // Hair wisps within a side mass are not distinct topology regions.
 let innerLeft=middle,innerRight=middle;
 while(innerLeft>=left&&!solid(innerLeft))innerLeft--;
 while(innerRight<=right&&!solid(innerRight))innerRight++;
 const out=[];
 if(innerLeft>=left)out.push([left,innerLeft]);
 if(innerRight<=right)out.push([innerRight,right]);
 return out;
}
const sourceSpans=Array.from({length:source.info.height},(_,y)=>spans(source,y));
const output=Buffer.alloc(target.data.length);
let maxRowCorrection=0,unmapped=0;
for(let y=0;y<target.info.height;y++){
 const targetSpans=spans(target,y);if(!targetSpans.length)continue;
 const expected=Math.round(y/(target.info.height-1)*(source.info.height-1));
 let sourceY=expected;
 if(sourceSpans[sourceY].length!==targetSpans.length){
  let best=Infinity;
  for(let yy=Math.max(0,expected-100);yy<Math.min(source.info.height,expected+101);yy++)if(sourceSpans[yy].length===targetSpans.length&&Math.abs(yy-expected)<best){sourceY=yy;best=Math.abs(yy-expected);}
 }
 maxRowCorrection=Math.max(maxRowCorrection,Math.abs(sourceY-expected));
 for(let region=0;region<targetSpans.length;region++){
  const [tl,tr]=targetSpans[region];
  const sourceRegion=sourceSpans[sourceY][region];
  if(!sourceRegion){unmapped+=tr-tl+1;continue;}
  const [sl,sr]=sourceRegion;
  for(let x=Math.max(0,tl-2);x<=Math.min(target.info.width-1,tr+2);x++){
   const u=Math.max(0,Math.min(1,(x-tl)/Math.max(1,tr-tl)));
   const sx=sl+u*(sr-sl),lo=Math.floor(sx),hi=Math.min(sr,lo+1),weight=sx-lo;
   const dest=(y*target.info.width+x)*4;
   for(let c=0;c<3;c++)output[dest+c]=Math.round(source.data[(sourceY*source.info.width+lo)*4+c]*(1-weight)+source.data[(sourceY*source.info.width+hi)*4+c]*weight);
   output[dest+3]=target.data[dest+3];
  }
 }
}
if(unmapped)throw new Error(`Registration failed: ${unmapped} mask pixels have no source region`);
await mkdir(dirname(resolve(destination)),{recursive:true});
await sharp(output,{raw:{width:target.info.width,height:target.info.height,channels:4}}).png().toFile(destination);
await writeFile(destination+'.json',JSON.stringify({rig:guideManifest.rig,asset:guide.id,source:sourceFile,sourceSha256:createHash('sha256').update(sourceBytes).digest('hex'),logicalBounds:guide.logicalBounds,nativeSource:[source.info.width,source.info.height],registeredPixels:[target.info.width,target.info.height],canvas:[600,1000],mask:guide.crop,registration:'source-pixel scanline mapping onto locked hair mask; original source preserved',maxSourceRowCorrection:maxRowCorrection,unmappedMaskPixels:unmapped,productionAccepted:false},null,2)+'\n');
console.log({destination,width:target.info.width,height:target.info.height,maxRowCorrection,unmapped});
