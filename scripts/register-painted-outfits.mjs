import {mkdir,writeFile} from 'node:fs/promises';
import {sharp,pixels,alphaBounds,sourceRoot,outputRoot} from './painted-look-lib.mjs';
import {composeLayers,renderSvg} from '../src/domain/characterStudio/art.ts';
import {DEFAULTS} from '../src/domain/characterStudio/rig.ts';
// Move painted garment pixels onto a fitting mask; the mannequin is never edited.
const manifest={};
function spans(data,w,y,cut=100){
 const all=[];let start=-1;
 for(let x=0;x<=w;x++){const on=x<w&&data[(y*w+x)*4+3]>cut;if(on&&start<0)start=x;if(!on&&start>=0){if(x-start>=3)all.push([start,x-1]);start=-1}}
 // Ignore tiny breaks in anti-aliasing/paint texture, but preserve arm/leg openings.
 for(let i=all.length-2;i>=0;i--)if(all[i+1][0]-all[i][1]<10){all[i][1]=all[i+1][1];all.splice(i+1,1)}
 return all;
}
for(const model of ['woman','man']){
 const look=DEFAULTS[model],layers=composeLayers(look,model),cloth=layers.find(a=>a.layer==='clothing'),body=layers.find(a=>a.layer==='body');
 const scale=3,w=600*scale,h=1000*scale;
 const render=async a=>sharp(Buffer.from(renderSvg(look,a,false,model))).resize(w,h).ensureAlpha().raw().toBuffer();
 const target=await render(cloth),bodyMask=await render(body);
 if(model==='woman'){
  // The old placeholder dress exposed hip/torso slivers. Extend only the garment.
  for(let y=300*scale;y<917*scale;y++)for(let x=238*scale;x<362*scale;x++){
   const i=(y*w+x)*4;target[i+3]=Math.max(target[i+3],bodyMask[i+3]);
  }
 }
 const bounds=alphaBounds(target,{width:w,height:h});
 const sourceFile=`${sourceRoot}/sources/${model}-outfit-painterly-v2.png`;
 const source=await pixels(sourceFile),sb=alphaBounds(source.data,source.info);
 const out=Buffer.alloc(w*h*4);
 if(model==='man'){
  // This painted complete outfit was authored at precisely the male garment
  // rectangle's aspect ratio. Place the whole native painting once: sampling
  // disconnected scanline pieces made sleeve/vest/trouser seams.
  const fitted=await sharp(sourceFile).resize(bounds.width,bounds.height).ensureAlpha().raw().toBuffer();
  for(let ry=0;ry<bounds.height;ry++)fitted.copy(out,((ry+bounds.top)*w+bounds.left)*4,ry*bounds.width*4,(ry+1)*bounds.width*4);
 }
 const widths=[[251,98],[290,110],[310,110],[340,97],[370,85],[405,78],[440,104],[490,121],[550,117],[700,140],[928.5,164]];
 const interpolate=(points,v)=>{let k=0;while(k<points.length-2&&v>points[k+1][0])k++;const [a,b]=[points[k],points[k+1]],t=Math.max(0,Math.min(1,(v-a[0])/(b[0]-a[0])));return a[1]+(b[1]-a[1])*t;};
 if(model==='woman')for(let y=bounds.top;y<bounds.top+bounds.height;y++){
  const progress=model==='woman'?interpolate([[251,0],[280,.065],[405,.206],[928.5,1]],y/scale):(y-bounds.top)/(bounds.height-1);
  const sy=Math.max(sb.top,Math.min(sb.top+sb.height-1,Math.round(sb.top+progress*(sb.height-1))));
  const ts=spans(target,w,y),ss=spans(source.data,source.info.width,sy);
  if(!ss.length)continue;
  if(model==='woman'){
   // One continuous coordinate field across the garment. Never independently
   // stretch disconnected row fragments: that creates visible horizontal bands.
   const half=interpolate(widths,y/scale)*scale/2,sl=ss[0][0],sr=ss.at(-1)[1];
   for(let x=Math.ceil(300*scale-half);x<=Math.floor(300*scale+half);x++){
    const sx=sl+(x-(300*scale-half))/(half*2)*(sr-sl),x0=Math.floor(sx),x1=Math.min(source.info.width-1,x0+1),f=sx-x0;
    const oi=(y*w+x)*4,i0=(sy*source.info.width+x0)*4,i1=(sy*source.info.width+x1)*4;
    for(let c=0;c<4;c++)out[oi+c]=Math.round(source.data[i0+c]*(1-f)+source.data[i1+c]*f);
    if(y>905*scale)out[oi+3]=Math.round(out[oi+3]*target[oi+3]/255);
   }
   continue;
  }
  if(model==='man'){
   // Sample every garment row in one coordinate field. Matching each sleeve,
   // vest or trouser fragment separately produced abrupt horizontal bands.
   const tl=ts[0]?.[0],tr=ts.at(-1)?.[1],sl=ss[0][0],sr=ss.at(-1)[1];
   if(tl===undefined)continue;
   const ay=y/scale;
   const dl=interpolate([[235,223],[400,249],[490,243],[540,255],[924,255]],ay)*scale,dr=w-dl;
   const sourceHalf=interpolate([[235,.2],[400,.27],[490,.29],[540,.30],[924,.32]],ay)*source.info.width;
   const sourceLeft=sourceHalf,sourceRight=source.info.width-sourceHalf;
   for(let x=tl;x<=tr;x++){
    const oi=(y*w+x)*4;if(!target[oi+3])continue;
    let sx=Math.round(x<dl
     ? sourceLeft+(x-dl)*(sourceLeft-sl)/Math.max(1,dl-tl)
     : x>dr
       ? sourceRight+(x-dr)*(sr-sourceRight)/Math.max(1,tr-dr)
       : sourceLeft+(x-dl)/(dr-dl)*(sourceRight-sourceLeft));
    sx=Math.max(0,Math.min(source.info.width-1,sx));
    // Source and fitting-mask gaps can differ by a pixel or two. Extend the
    // nearby painted fabric within this asset; never expose a vector fill.
    if(source.data[(sy*source.info.width+sx)*4+3]<16){
     let d=1;while(d<source.info.width&&source.data[(sy*source.info.width+Math.max(0,sx-d))*4+3]<16&&source.data[(sy*source.info.width+Math.min(source.info.width-1,sx+d))*4+3]<16)d++;
     const left=Math.max(0,sx-d),right=Math.min(source.info.width-1,sx+d);
     sx=source.data[(sy*source.info.width+left)*4+3]>=16?left:right;
    }
    const ii=(sy*source.info.width+sx)*4;
    for(let c=0;c<3;c++)out[oi+c]=source.data[ii+c];
    out[oi+3]=target[oi+3];
   }
   continue;
  }
  for(let j=0;j<ts.length;j++){
   const [tl,tr]=ts[j];
   const match=ss.length===ts.length?ss[j]:ss.reduce((best,s)=>Math.abs((s[0]+s[1])/2/source.info.width-(tl+tr)/2/w)<Math.abs((best[0]+best[1])/2/source.info.width-(tl+tr)/2/w)?s:best,ss[0]);
   for(let x=tl;x<=tr;x++){
    const sx=match[0]+(x-tl)/Math.max(1,tr-tl)*(match[1]-match[0]),x0=Math.floor(sx),x1=Math.min(source.info.width-1,x0+1),f=sx-x0;
    const oi=(y*w+x)*4,i0=(sy*source.info.width+x0)*4,i1=(sy*source.info.width+x1)*4;
    for(let c=0;c<3;c++)out[oi+c]=Math.round(source.data[i0+c]*(1-f)+source.data[i1+c]*f);
    out[oi+3]=target[oi+3];
   }
  }
 }
 const dir=`${outputRoot}/${model}`;await mkdir(dir,{recursive:true});
 const rect=[bounds.left/scale,bounds.top/scale,bounds.width/scale,bounds.height/scale];
 await sharp(out,{raw:{width:w,height:h,channels:4}}).extract(bounds).png().toFile(`${dir}/outfit.png`);
 const masks={primary:Buffer.from(out),secondary:Buffer.from(out),trim:Buffer.from(out)};
 for(let i=0;i<out.length;i+=4){
  const px=(i/4)%w/scale,py=Math.floor(i/4/w)/scale;
  const secondary=model==='man'?out[i]>out[i+2]*1.03&&out[i]>100:py<405&&Math.abs(px-300)>interpolate(widths,py)*.34;
  const gold=model==='woman'&&out[i+1]>out[i]*.48&&out[i+2]<out[i]*.82;
  for(const [name,mask] of Object.entries(masks)){
   mask[i]=mask[i+1]=mask[i+2]=255;mask[i+3]=out[i+3]*Number(name==='trim'?gold:!gold&&(name==='secondary'?secondary:!secondary));
  }
 }
 for(const [name,data] of Object.entries(masks))await sharp(data,{raw:{width:w,height:h,channels:4}}).extract(bounds).png().toFile(`${dir}/outfit-${name}-mask.png`);
 manifest[model]={outfit:{file:'outfit.png',bounds:rect,native:[bounds.width,bounds.height],source:sourceFile},primaryMask:{file:'outfit-primary-mask.png',bounds:rect},secondaryMask:{file:'outfit-secondary-mask.png',bounds:rect},trimMask:{file:'outfit-trim-mask.png',bounds:rect}};
}
await writeFile(`${sourceRoot}/outfit-manifest.json`,JSON.stringify(manifest,null,2));
console.log('Painted outfits fitted to their own mannequins; primary/secondary masks exported.');
