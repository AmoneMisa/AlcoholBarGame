import {mkdir,writeFile} from 'node:fs/promises';
import {registerPortrait,writePart,sharp,sourceRoot,outputRoot} from './painted-look-lib.mjs';
import {RIGS} from '../src/domain/characterStudio/rig.ts';
const configs={
 woman:{x:[[234,0],[248,.09],[274,390/1168],[300,580/1168],[326,773/1168],[352,.915],[366,1]],y:[[76,0],[87,83/1346],[129,445/1346],[135,482/1346],[139,510/1346],[146,535/1346],[151,576/1346],[158,630/1346],[174,810/1346],[192,936/1346],[220,1150/1346],[228,1]]},
 man:{x:[[234,0],[246,.065],[273,393/1168],[300,580/1168],[327,773/1168],[354,.935],[366,1]],y:[[76,0],[82,36/1346],[127,423/1346],[133,476/1346],[137,500/1346],[143,508/1346],[146,518/1346],[151,541/1346],[157,592/1346],[177,788/1346],[196,920/1346],[221,1160/1346],[228,1]]}
};
const manifest={};
for(const model of ['woman','man']){
 const dir=`${outputRoot}/${model}`;await mkdir(dir,{recursive:true});
 const frame=await registerPortrait(`${sourceRoot}/sources/${model}-face-painterly-v2.png`,configs[model]);
 const rig=RIGS[model],ex=[rig.anchors.eyeLeft[0],rig.anchors.eyeRight[0]],by=rig.anchors.browLeft[1],ny=rig.anchors.nose[1],my=rig.anchors.mouth[1];
 const inEye=(x,y)=>ex.some(cx=>Math.abs(x-cx)<=20&&y>=141&&y<=164);
 const inBrow=(x,y)=>ex.some(cx=>Math.abs(x-cx)<=21&&y>=by-8&&y<141);
 const inNose=(x,y)=>y>=153&&y<=ny+8&&Math.abs(x-300)<(y<ny-8?6:13);
 const inMouth=(x,y)=>Math.abs(x-300)<=22&&y>=my-10&&y<=my+13;
 const part=(x,y)=>inMouth(x,y)?'mouth':inNose(x,y)?'nose':inBrow(x,y)?'brows':inEye(x,y)?'eyes':'face';
 const assets={};
 for(const name of ['face','brows','nose','mouth'])assets[name]=await writePart(frame,(x,y)=>part(x,y)===name?(name==='face'?Math.min(1,Math.max(0,(227-y)/8)):1):0,`${dir}/${name}.png`);
 // Aperture mask follows the painted eye whites/iris instead of drawing eye art.
 const aperture=new Uint8Array(frame.info.width*frame.info.height);
 for(const cx of ex)for(let y=Math.floor((143-frame.bounds[1])*frame.scale);y<Math.ceil((158-frame.bounds[1])*frame.scale);y++){
  let lo=Infinity,hi=-Infinity;
  for(let x=Math.floor((cx-15-frame.bounds[0])*frame.scale);x<Math.ceil((cx+15-frame.bounds[0])*frame.scale);x++){
   const i=(y*frame.info.width+x)*4,[r,g,b]=frame.data.subarray(i,i+3);
   const lx=frame.bounds[0]+x/frame.scale,ly=frame.bounds[1]+y/frame.scale;
   const neutral=g>r*.85&&b>r*.77,iris=(lx-cx)**2+(ly-151)**2<45&&(g>r*.92||(r<55&&Math.abs(ly-151)<3));
   if((lx-cx)**2/30.25+(ly-151)**2/25<1&&part(lx,ly)==='eyes'){lo=Math.min(lo,x);hi=Math.max(hi,x)}
  }
  if(Number.isFinite(lo))for(let x=lo;x<=hi;x++)aperture[y*frame.info.width+x]=1;
 }
 const index=(x,y)=>Math.min(frame.info.height-1,Math.max(0,Math.floor((y-frame.bounds[1])*frame.scale)))*frame.info.width+Math.min(frame.info.width-1,Math.max(0,Math.floor((x-frame.bounds[0])*frame.scale)));
 assets.eyes=await writePart(frame,(x,y)=>part(x,y)==='eyes'&&!aperture[index(x,y)],`${dir}/eyes.png`);
 assets.irisPaint=await writePart(frame,(x,y)=>!!aperture[index(x,y)],`${dir}/iris-painted.png`);
 const white=Buffer.from(frame.data);for(let i=0;i<white.length;i+=4){white[i]=white[i+1]=white[i+2]=255;white[i+3]=aperture[i/4]?255:0}
 assets.aperture=await writePart({...frame,data:white},()=>true,`${dir}/eye-aperture-mask.png`);
 assets.catchlights=await writePart(frame,(x,y)=>{
  if(!ex.some(cx=>(x-cx)**2+(y-151)**2<40))return false;
  const i=index(x,y)*4;return Math.min(frame.data[i],frame.data[i+1],frame.data[i+2])>216;
 },`${dir}/catchlights.png`);
 const blinkFrame=await registerPortrait(`${sourceRoot}/sources/${model}-blink-painterly-v2.png`,configs[model]);
 assets.blink=await writePart(blinkFrame,(x,y)=>part(x,y)==='eyes',`${dir}/blink.png`);
 const lipWhite=Buffer.from(frame.data);for(let i=0;i<lipWhite.length;i+=4)lipWhite[i]=lipWhite[i+1]=lipWhite[i+2]=255;
 assets.lipMask=await writePart({...frame,data:lipWhite},(x,y)=>{
  if(Math.abs(x-300)>20||Math.abs(y-my)>8)return false;
  const i=index(x,y)*4,r=frame.data[i],g=frame.data[i+1];return Math.max(0,Math.min(1,((r-g)/Math.max(1,r)-.22)/.08));
 },`${dir}/lip-color-mask.png`);
 await sharp(frame.data,{raw:frame.info}).png().toFile(`${dir}/face-registration-QA.png`);
 manifest[model]={rig:rig.id,registration:configs[model],assets};
}
await writeFile(`${sourceRoot}/face-manifest.json`,JSON.stringify(manifest,null,2));
console.log('Separated painted facial pixels and eye-aperture masks for both immutable rigs.');
