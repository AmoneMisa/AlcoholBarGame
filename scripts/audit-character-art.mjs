// Read-only diagnostics. Does not alter artwork or canonical geometry.
// Placeholder silhouette overlap is NOT a production acceptance threshold:
// hairstyle silhouettes may differ while scalp/face attachment anchors stay fixed.
import { createRequire } from 'node:module';
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
const require = createRequire(import.meta.url);
const sharp = require(process.env.CHARACTER_SHARP_PATH || 'C:/Users/kubai/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const [model, assetId, sourceFile, reportFile] = process.argv.slice(2);
if (!['woman', 'man'].includes(model) || !assetId || !sourceFile || !reportFile) throw new Error('Usage: audit-character-art.mjs woman|man Asset/Id source.png report.json');
const guidesRoot = resolve('assets-src/character-studio/production/guides');
const guideManifest = JSON.parse(await readFile(resolve(guidesRoot, `${model}.json`), 'utf8'));
const guide = guideManifest.assets.find(asset => asset.id === assetId);
if (!guide) throw new Error('Asset does not belong to the selected rig');
const sourceBytes = await readFile(sourceFile);
const meta = await sharp(sourceBytes).metadata();
const { data, info } = await sharp(sourceBytes).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
let left=info.width,top=info.height,right=-1,bottom=-1,transparentPixels=0;
for(let y=0;y<info.height;y++)for(let x=0;x<info.width;x++){
  const alpha=data[(y*info.width+x)*4+3];
  if(alpha<=16) transparentPixels++;
  else {left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);}
}
if(right<left) throw new Error('Empty source');
const sourceBounds={left,top,width:right-left+1,height:bottom-top+1};
const size={width:guide.bounds.width,height:guide.bounds.height};
// Resampling here is analysis only. No upscaled artwork is saved or accepted as a master.
const candidate=await sharp(sourceBytes).extract(sourceBounds).resize(size.width,size.height,{fit:'fill'}).ensureAlpha().raw().toBuffer();
const target=await sharp(resolve(guidesRoot,guide.crop)).ensureAlpha().raw().toBuffer();
let intersection=0,union=0,missing=0,spill=0,covered=0;
for(let i=3;i<target.length;i+=4){
  const a=candidate[i]>16,b=target[i]>16;
  if(a&&b)intersection++; if(a||b)union++; if(b)covered++; if(b&&!a)missing++; if(a&&!b)spill++;
}
const report={rig:guideManifest.rig,asset:assetId,source:sourceFile,sha256:createHash('sha256').update(sourceBytes).digest('hex'),native:{width:meta.width,height:meta.height,hasAlpha:meta.hasAlpha},sourceBounds,targetLogicalBounds:guide.logicalBounds,minimumGuideRasterSize:size,sourcePixelsPerLogicalUnit:Math.min(sourceBounds.width/guide.logicalBounds[2],sourceBounds.height/guide.logicalBounds[3]),silhouetteIoU:intersection/union,unpaintedGuideFraction:missing/covered,spillFraction:spill/union,transparentFraction:transparentPixels/(info.width*info.height),registered:false,accepted:false,notes:['Bounding-box-normalized comparison measures silhouette drift; it does not establish internal feature alignment.','This tool never modifies the approved mannequin, anchor manifest, or source artwork.','A human visual detail/material/lighting review is still required.']};
await writeFile(reportFile,JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));
