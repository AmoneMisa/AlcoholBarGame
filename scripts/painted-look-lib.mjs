// Raster asset registration/export helpers. Masks never supply final painted color.
import {createRequire} from 'node:module';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
export const sharp=createRequire(import.meta.url)(process.env.CHARACTER_SHARP_PATH || 'C:/Users/kubai/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
export const sourceRoot='assets-src/character-studio/painted-look';
export const outputRoot='public/assets/Character/Painted';
export async function pixels(file){return sharp(file).ensureAlpha().raw().toBuffer({resolveWithObject:true})}
export function alphaBounds(data,info,threshold=20){
 let l=info.width,t=info.height,r=-1,b=-1;
 for(let y=0;y<info.height;y++)for(let x=0;x<info.width;x++)if(data[(y*info.width+x)*4+3]>threshold){l=Math.min(l,x);t=Math.min(t,y);r=Math.max(r,x);b=Math.max(b,y)}
 if(r<l)throw new Error('Empty image');
 return {left:l,top:t,width:r-l+1,height:b-t+1};
}
export async function trimSource(file,dest,bounds){
 const {data,info}=await pixels(file),crop=alphaBounds(data,info);
 await sharp(file).extract(crop).png().toFile(dest);
 return {file:dest.split('/').at(-1),bounds,native:[crop.width,crop.height],source:file,sha256:createHash('sha256').update(await readFile(file)).digest('hex')};
}
function interpolate(knots,value){
 let i=0;while(i<knots.length-2&&value>knots[i+1][0])i++;
 const [a,b]=[knots[i],knots[i+1]],t=(value-a[0])/(b[0]-a[0]);return a[1]+t*(b[1]-a[1]);
}
// Inverse-map illustrated pixels to immutable logical anchors. Never mutates the rig.
export async function registerPortrait(file,config,scale=8){
 const {data,info}=await pixels(file),bounds=[234,76,132,152];
 const width=bounds[2]*scale,height=bounds[3]*scale,out=Buffer.alloc(width*height*4);
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){
  const sx=Math.max(0,Math.min(info.width-1,interpolate(config.x,bounds[0]+(x+.5)/scale)*info.width));
  const sy=Math.max(0,Math.min(info.height-1,interpolate(config.y,bounds[1]+(y+.5)/scale)*info.height));
  const x0=Math.floor(sx),y0=Math.floor(sy),x1=Math.min(x0+1,info.width-1),y1=Math.min(y0+1,info.height-1),fx=sx-x0,fy=sy-y0;
  for(let c=0;c<4;c++)out[(y*width+x)*4+c]=Math.round((1-fy)*((1-fx)*data[(y0*info.width+x0)*4+c]+fx*data[(y0*info.width+x1)*4+c])+fy*((1-fx)*data[(y1*info.width+x0)*4+c]+fx*data[(y1*info.width+x1)*4+c]));
 }
 return {data:out,info:{width,height,channels:4},bounds,scale};
}
export async function writePart(frame,predicate,path){
 const data=Buffer.from(frame.data);
 for(let y=0;y<frame.info.height;y++)for(let x=0;x<frame.info.width;x++){
  const a=predicate(frame.bounds[0]+(x+.5)/frame.scale,frame.bounds[1]+(y+.5)/frame.scale);
  const i=(y*frame.info.width+x)*4;data[i+3]=Math.round(data[i+3]*Math.max(0,Math.min(1,Number(a))));
  if(!data[i+3])data.fill(0,i,i+4);
 }
 const crop=alphaBounds(data,frame.info);
 await sharp(data,{raw:frame.info}).extract(crop).png().toFile(path);
 return {file:path.split('/').at(-1),bounds:[frame.bounds[0]+crop.left/frame.scale,frame.bounds[1]+crop.top/frame.scale,crop.width/frame.scale,crop.height/frame.scale],native:[crop.width,crop.height]};
}
