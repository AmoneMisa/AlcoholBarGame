<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';
import * as THREE from 'three';
import { layerAsset, type ModularSceneDefinition, type ModularSelectionKey } from '../../data/cosmetics/modularScenes';
import { PAINTED_BOTTLE_ATLAS, PAINTED_BOTTLE_COLUMNS, PAINTED_BOTTLE_ROWS, shelfDecorPresetFor, type ShelfDecorPresetId } from '../../data/cosmetics/shelfDecor';
import { windowBackdropFor, type WindowBackdropId } from '../../data/cosmetics/windowBackdrops';
import { shelfBottlePlacements, shelfSurface } from '../../data/cosmetics/shelfBottleLayout';
import { COUNTER_GLASSWARE, ORIGINAL_ROOM_SHELVES } from '../../data/cosmetics/originalRoomShelves';

const props=defineProps<{
  scene:ModularSceneDefinition;
  width:number;
  height:number;
  backgroundSource?:string;
  wall:string;
  counter:string;
  counterColor:string;
  shelf:string;
  shelfPreset?:ShelfDecorPresetId;
  windowBackdrop?:WindowBackdropId;
  lighting:string;
  highlightStrength:string;
  animated?:boolean;
  seatCount?:string | number;
}>();

const canvas=ref<HTMLCanvasElement>();
const fallback=ref(false);
const fallbackSource=ref<string>();
let renderer:THREE.WebGLRenderer|undefined;
let threeScene:THREE.Scene|undefined;
let camera:THREE.Camera|undefined;
let material:THREE.ShaderMaterial|undefined;
let mesh:THREE.Mesh<THREE.PlaneGeometry,THREE.ShaderMaterial>|undefined;
let texture:THREE.CanvasTexture|undefined;
let frame=0;
let startedAt=0;
let disposed=false;
let buildEpoch=0;
const bottleBounds=new Map<string,{x:number;y:number;width:number;height:number}[]>();
const imageCache=new Map<string,Promise<HTMLImageElement>>();
const shelfPixels=new Map<string,ImageData>();
const softenedShelves=new Map<string,HTMLCanvasElement>();

const vertex=`
varying vec2 vUv;
void main(){vUv=uv;gl_Position=vec4(position.xy,0.0,1.0);}
`;

const fragment=`
precision highp float;
uniform sampler2D uTexture;
uniform float uImageAspect;
uniform float uViewportAspect;
uniform float uPositionY;
uniform vec3 uLightAColor;
uniform vec3 uLightBColor;
uniform vec2 uLightAPos;
uniform vec2 uLightBPos;
uniform float uLightARadius;
uniform float uLightBRadius;
uniform float uStrength;
uniform float uVignette;
uniform float uTime;
varying vec2 vUv;

vec2 coverUv(vec2 uv){
  vec2 outUv=uv;
  if(uViewportAspect>uImageAspect){
    float visible=uImageAspect/uViewportAspect;
    outUv.y=uv.y*visible+(1.0-visible)*(1.0-uPositionY);
  }else{
    float visible=uViewportAspect/uImageAspect;
    outUv.x=uv.x*visible+(1.0-visible)*0.5;
  }
  return outUv;
}
float softLight(vec2 p,vec2 centre,float radius){
  return 1.0-smoothstep(0.0,radius,distance(p,centre));
}
void main(){
  vec2 sampleUv=coverUv(vUv);
  vec4 tex=texture2D(uTexture,sampleUv);
  vec3 base=tex.rgb;
  vec2 topUv=vec2(vUv.x,1.0-vUv.y);
  float luma=dot(base,vec3(0.2126,0.7152,0.0722));
  float materialResponse=mix(0.22,1.0,smoothstep(0.08,0.88,luma));
  float a=softLight(topUv,uLightAPos,uLightARadius);
  float b=softLight(topUv,uLightBPos,uLightBRadius);
  float shimmer=1.0+sin(uTime*0.65)*0.012;
  vec3 light=(uLightAColor*a+uLightBColor*b)*uStrength*0.12*materialResponse*shimmer;
  vec3 graded=base+light;
  float edge=distance(vUv,vec2(0.5));
  graded*=1.0-uVignette*smoothstep(0.34,0.76,edge);
  gl_FragColor=vec4(graded,tex.a);
}
`;

const LIGHTS:Record<string,{a:[number,number,number];b:[number,number,number]}>={
  amber:{a:[1.0,.57,.23],b:[1.0,.78,.43]},
  rose:{a:[1.0,.28,.43],b:[1.0,.48,.60]},
  blue:{a:[.25,.58,1.0],b:[.40,.72,1.0]},
  violet:{a:[.56,.28,1.0],b:[.73,.45,1.0]},
  emerald:{a:[.22,.82,.54],b:[.42,1.0,.70]},
  ice:{a:[.64,.88,1.0],b:[.84,.96,1.0]}
};
const STRENGTH:Record<string,number>={soft:.45,medium:.72,bright:1.0};

function selections():Partial<Record<ModularSelectionKey,string>>{
  return {wall:props.wall,counter:props.counter,counterColor:props.counterColor,shelf:props.shelf};
}
function loadImage(src:string){
  if(imageCache.has(src))return imageCache.get(src)!;
  const request=new Promise<HTMLImageElement>((resolve,reject)=>{
    const image=new Image();
    image.decoding='async';
    image.onload=()=>resolve(image);
    image.onerror=()=>reject(new Error('Could not load modular bar layer '+src));
    image.src=src;
  });
  imageCache.set(src,request);
  request.catch(()=>imageCache.delete(src));
  return request;
}
function drawCover(context:CanvasRenderingContext2D,image:HTMLImageElement){
  const {width,height}=props.scene.canvas;
  const scale=Math.max(width/image.naturalWidth,height/image.naturalHeight);
  context.drawImage(image,(width-image.naturalWidth*scale)/2,(height-image.naturalHeight*scale)*props.scene.positionY,image.naturalWidth*scale,image.naturalHeight*scale);
}
async function drawExterior(context:CanvasRenderingContext2D){
  if(!props.scene.exterior)return;
  if((props.windowBackdrop??'original')==='original' && props.scene.exterior.asset){
    const image=await loadImage(props.scene.exterior.asset);
    drawCover(context,image);
    return;
  }
  const preset=windowBackdropFor(props.windowBackdrop??'skyline');
  const image=await loadImage(preset.asset);
  const crop=preset.sourceRect;
  const sx=crop.x*image.naturalWidth;
  const sy=crop.y*image.naturalHeight;
  const sw=crop.width*image.naturalWidth;
  const sh=crop.height*image.naturalHeight;
  const aspect=props.scene.canvas.width/props.scene.canvas.height;
  const width=Math.min(sw,sh*aspect);
  const height=Math.min(sh,sw/aspect);
  context.drawImage(image,sx+(sw-width)/2,sy+(sh-height)/2,width,height,0,0,props.scene.canvas.width,props.scene.canvas.height);
}

async function drawShelfDecor(context:CanvasRenderingContext2D){
  const decor=props.scene.shelfDecor;
  if(!decor)return;
  const selection=props.shelfPreset??'room-original';
  const preset=shelfDecorPresetFor(selection==='room-original' && props.scene.id==='velvet' ? 'velvet-original' : selection);
  const columns=preset.atlas?.columns??PAINTED_BOTTLE_COLUMNS;
  const rows=preset.atlas?.rows??PAINTED_BOTTLE_ROWS;
  const atlas=await loadImage(preset.atlas?.asset??PAINTED_BOTTLE_ATLAS);
  const cellW=atlas.naturalWidth/columns;
  const cellH=atlas.naturalHeight/rows;
  const boundsKey=`${atlas.src}:${columns}:${rows}`;
  if(!bottleBounds.has(boundsKey)){
    const sample=document.createElement('canvas');
    sample.width=atlas.naturalWidth;sample.height=atlas.naturalHeight;
    const scan=sample.getContext('2d',{willReadFrequently:true})!;
    scan.drawImage(atlas,0,0);
    const pixels=scan.getImageData(0,0,sample.width,sample.height).data;
    bottleBounds.set(boundsKey,Array.from({length:columns*rows},(_,cell)=>{
      const x0=Math.floor(cell%columns*cellW),y0=Math.floor(Math.floor(cell/columns)*cellH);
      const x1=Math.floor((cell%columns+1)*cellW),y1=Math.floor((Math.floor(cell/columns)+1)*cellH);
      let left=x1,right=x0,top=y1,bottom=y0;
      for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++)if(pixels[(y*sample.width+x)*4+3]!>40){left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);}
      return right>=left?{x:left,y:top,width:right-left+1,height:bottom-top+1}:{x:x0,y:y0,width:cellW,height:cellH};
    }));
  }
  const bounds=bottleBounds.get(boundsKey)!;

  const bays=await Promise.all(decor.bays.map(async bay=>{
    if(decor.paintBacking!==false)return bay;
    const centre=bay.rect.x+bay.rect.width/2;
    const layer=props.scene.layers.find(layer=>layer.role==='shelves' && layer.rect && centre>=layer.rect.x-.001 && centre<=layer.rect.x+layer.rect.width+.001);
    if(!layer?.rect)return bay;
    const src=layerAsset(layer,selections(),props.backgroundSource);
    if(!src)return bay;
    const image=await loadImage(src);
    if(!shelfPixels.has(src)){
      const sample=document.createElement('canvas');sample.width=image.naturalWidth;sample.height=image.naturalHeight;
      const scan=sample.getContext('2d',{willReadFrequently:true})!;scan.drawImage(image,0,0);
      shelfPixels.set(src,scan.getImageData(0,0,sample.width,sample.height));
    }
    const pixels=shelfPixels.get(src)!;
    const rect=layer.rect;
    let x0=(bay.rect.x-rect.x)/rect.width,x1=(bay.rect.x+bay.rect.width-rect.x)/rect.width;
    if(layer.flipX)[x0,x1]=[1-x1,1-x0];
    const inset=(x1-x0)*.12;
    const rowBaselines=bay.rowBaselines.map((line,index)=>{
      const baseline=(bay.rect.y+line*bay.rect.height-rect.y)/rect.height*pixels.height;
      const gap=(line-(index?bay.rowBaselines[index-1]!:0))*bay.rect.height/rect.height*pixels.height;
      const y=shelfSurface(pixels.data,pixels.width,pixels.height,(x0+inset)*pixels.width,(x1-inset)*pixels.width,baseline,Math.min(gap*.4,pixels.height*.045));
      return (rect.y+y/pixels.height*rect.height-bay.rect.y)/bay.rect.height;
    });
    return {...bay,rowBaselines};
  }));
  for(const bay of bays){
    const bx=bay.rect.x*props.scene.canvas.width;
    const by=bay.rect.y*props.scene.canvas.height;
    const bw=bay.rect.width*props.scene.canvas.width;
    const bh=bay.rect.height*props.scene.canvas.height;

    const panel=context.createLinearGradient(0,by,0,by+bh);
    panel.addColorStop(0,decor.panelTop);
    panel.addColorStop(1,decor.panelBottom);
    context.save();
    context.fillStyle=panel;
    if(decor.paintBacking!==false) context.fillRect(bx,by,bw,bh);

    context.strokeStyle=decor.rail;
    context.lineWidth=Math.max(2,props.scene.canvas.height*.0024);
    for(const baseline of decor.paintBacking===false ? [] : bay.rowBaselines){
      const y=by+baseline*bh;
      context.beginPath();
      context.moveTo(bx,y);
      context.lineTo(bx+bw,y);
      context.stroke();
    }
    context.restore();

  }
  for(const bottle of shelfBottlePlacements(bays,preset,bounds,props.scene.canvas.width,props.scene.canvas.height)){
    const {item,crop,x,y,width,height}=bottle;
    context.save();
    context.globalAlpha=item.alpha??1;
    context.filter=[preset.filter,preset.glow ? `drop-shadow(0 0 ${Math.max(2,height*.045)}px ${preset.glow})` : ''].filter(Boolean).join(' ');
    context.drawImage(atlas,crop.x,crop.y,crop.width,crop.height,x-width/2,y-height,width,height);
    context.restore();
  }
}

async function sourceShelfImage(image:HTMLImageElement){
  const maskAsset=props.scene.exterior?.asset;
  const original=ORIGINAL_ROOM_SHELVES[props.scene.id];
  const key=`${image.src}:${maskAsset??''}`;
  if(!softenedShelves.has(key)){
    const softened=document.createElement('canvas');softened.width=image.naturalWidth;softened.height=image.naturalHeight;
    const context=softened.getContext('2d')!;context.drawImage(image,0,0);
    const fade=context.createLinearGradient(0,0,0,softened.height);
    fade.addColorStop(0,'#0000');fade.addColorStop(.025,'#000');fade.addColorStop(1,'#000');
    context.globalCompositeOperation='destination-in';context.fillStyle=fade;context.fillRect(0,0,softened.width,softened.height);
    if(maskAsset && original){
      const mask=await loadImage(maskAsset),r=original.sourceRect;
      context.globalCompositeOperation='destination-out';
      context.drawImage(mask,r.x*mask.naturalWidth,r.y*mask.naturalHeight,r.width*mask.naturalWidth,r.height*mask.naturalHeight,0,0,softened.width,softened.height);
    }
    softenedShelves.set(key,softened);
  }
  return softenedShelves.get(key)!;
}

async function drawCounterGlassware(context:CanvasRenderingContext2D){
  const image=await loadImage(COUNTER_GLASSWARE.asset),crop=COUNTER_GLASSWARE.crop;
  const {width,height}=props.scene.canvas;
  const h=Math.min(52,height*.075,width*.10),w=h*COUNTER_GLASSWARE.aspect;
  const baseline=props.scene.geometry.back*height+5;
  context.save();context.globalAlpha=.78;
  for(const [x,scale] of [[.10,1],[.17,.92],[.84,1]] as const){
    context.drawImage(image,crop.x*image.naturalWidth,crop.y*image.naturalHeight,crop.width*image.naturalWidth,crop.height*image.naturalHeight,x*width-w*scale/2,baseline-h*scale,w*scale,h*scale);
  }
  context.restore();
}

async function compose(){
  const source=document.createElement('canvas');
  source.width=props.scene.canvas.width;
  source.height=props.scene.canvas.height;
  const context=source.getContext('2d',{alpha:true});
  if(!context) throw new Error('2D compositor unavailable');
  context.clearRect(0,0,source.width,source.height);
  context.imageSmoothingEnabled=true;
  context.imageSmoothingQuality='high';
  await drawExterior(context);
  const layers=[...props.scene.layers].sort((a,b)=>a.z-b.z);
  const availableSeats=layers.filter(layer=>layer.role==='seating').length;
  const requestedSeats=props.seatCount===undefined ? availableSeats : Math.max(0,Math.min(availableSeats,Math.floor(Number(props.seatCount)||0)));
  let seatsDrawn=0;
  let decorDrawn=false;
  for(const layer of layers){
    if(layer.role==='seating' && seatsDrawn++>=requestedSeats) continue;
    if(!decorDrawn && props.scene.shelfDecor && layer.z>props.scene.shelfDecor.z){
      await drawShelfDecor(context);
      decorDrawn=true;
    }
    const src=layerAsset(layer,selections(),props.backgroundSource);
    if(!src) continue;
    const image=await loadImage(src);
    const drawable=layer.role==='shelves' && props.shelfPreset==='room-original' && !props.scene.shelfDecor ? await sourceShelfImage(image) : image;
    const rect=layer.rect;
    const crop=layer.sourceRect??{x:0,y:0,width:1,height:1};
    const sx=crop.x*image.naturalWidth,sy=crop.y*image.naturalHeight,sw=crop.width*image.naturalWidth,sh=crop.height*image.naturalHeight;
    if(rect){
      const x=rect.x*source.width,y=rect.y*source.height,w=rect.width*source.width,h=rect.height*source.height;
      if(layer.flipX){
        context.save();
        context.translate(x+w,y);
        context.scale(-1,1);
        context.drawImage(drawable,sx,sy,sw,sh,0,0,w,h);
        context.restore();
      }else context.drawImage(drawable,sx,sy,sw,sh,x,y,w,h);
    }else drawCover(context,image);
    if(layer.role==='counter')await drawCounterGlassware(context);
  }
  if(!decorDrawn && props.scene.shelfDecor) await drawShelfDecor(context);
  return source;
}
function lightUniforms(){
  const selected=LIGHTS[props.lighting]??LIGHTS.amber!;
  return {
    a:new THREE.Vector3(...selected.a),
    b:new THREE.Vector3(...selected.b),
    strength:STRENGTH[props.highlightStrength]??STRENGTH.medium!
  };
}
function applyUniforms(){
  if(!material)return;
  const light=lightUniforms();
  material.uniforms.uViewportAspect.value=Math.max(1,props.width)/Math.max(1,props.height);
  material.uniforms.uImageAspect.value=props.scene.canvas.width/props.scene.canvas.height;
  material.uniforms.uPositionY.value=props.scene.positionY;
  material.uniforms.uLightAColor.value.copy(light.a);
  material.uniforms.uLightBColor.value.copy(light.b);
  material.uniforms.uLightAPos.value.set(props.scene.lighting.lightA.x,props.scene.lighting.lightA.y);
  material.uniforms.uLightBPos.value.set(props.scene.lighting.lightB.x,props.scene.lighting.lightB.y);
  material.uniforms.uLightARadius.value=props.scene.lighting.lightA.radius;
  material.uniforms.uLightBRadius.value=props.scene.lighting.lightB.radius;
  material.uniforms.uStrength.value=light.strength;
  material.uniforms.uVignette.value=props.scene.lighting.vignette;
}
function render(time=0){
  if(!renderer||!material||!threeScene||!camera)return;
  material.uniforms.uTime.value=time;
  renderer.render(threeScene,camera);
}
function resize(){
  if(!renderer||!props.width||!props.height)return;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2));
  renderer.setSize(props.width,props.height,false);
  applyUniforms();
  render();
}
function stopAnimation(){
  if(frame){cancelAnimationFrame(frame);frame=0;}
}
function animate(now:number){
  if(!props.animated||disposed)return;
  if(!startedAt)startedAt=now;
  render((now-startedAt)/1000);
  frame=requestAnimationFrame(animate);
}
function syncAnimation(){
  stopAnimation();
  startedAt=0;
  if(props.animated) frame=requestAnimationFrame(animate);
  else render();
}
async function build(){
  if(!canvas.value||!props.width||!props.height)return;
  const epoch=++buildEpoch;
  stopAnimation();
  let composite:HTMLCanvasElement|undefined;
  try{
    composite=await compose();
    if(disposed||epoch!==buildEpoch)return;
    texture?.dispose();
    texture=new THREE.CanvasTexture(composite);
    texture.minFilter=THREE.LinearFilter;
    texture.magFilter=THREE.LinearFilter;
    texture.generateMipmaps=false;
    if(!renderer){
      renderer=new THREE.WebGLRenderer({canvas:canvas.value,alpha:false,antialias:false,powerPreference:'high-performance',preserveDrawingBuffer:true});
      renderer.outputColorSpace=THREE.SRGBColorSpace;
    }
    material?.dispose();
    const light=lightUniforms();
    material=new THREE.ShaderMaterial({
      vertexShader:vertex,fragmentShader:fragment,depthTest:false,depthWrite:false,
      uniforms:{
        uTexture:{value:texture},uImageAspect:{value:1},uViewportAspect:{value:1},uPositionY:{value:.5},
        uLightAColor:{value:light.a},uLightBColor:{value:light.b},
        uLightAPos:{value:new THREE.Vector2()},uLightBPos:{value:new THREE.Vector2()},
        uLightARadius:{value:.5},uLightBRadius:{value:.5},uStrength:{value:light.strength},
        uVignette:{value:0},uTime:{value:0}
      }
    });
    mesh?.geometry.dispose();
    threeScene=new THREE.Scene();
    camera=new THREE.Camera();
    mesh=new THREE.Mesh(new THREE.PlaneGeometry(2,2),material);
    threeScene.add(mesh);
    fallback.value=false;
    resize();
    syncAnimation();
  }catch{
    if(disposed||epoch!==buildEpoch)return;
    fallbackSource.value=composite?.toDataURL('image/webp');
    fallback.value=true;
    renderer?.dispose();
    renderer=undefined;
  }
}
watch(()=>[props.scene,props.backgroundSource,props.wall,props.counter,props.counterColor,props.shelf,props.shelfPreset,props.windowBackdrop,props.seatCount],()=>{void build();},{deep:true});
watch(()=>[props.width,props.height],()=>{if(renderer)resize();else void build();});
watch(()=>[props.lighting,props.highlightStrength],()=>{applyUniforms();render();});
watch(()=>props.animated,syncAnimation);
onMounted(()=>{void build();});
onBeforeUnmount(()=>{
  disposed=true;
  buildEpoch++;
  stopAnimation();
  texture?.dispose();
  material?.dispose();
  mesh?.geometry.dispose();
  renderer?.dispose();
});
</script>

<template>
  <div class="modular-bar-backdrop" aria-hidden="true">
    <img v-if="fallback" :src="fallbackSource || backgroundSource || scene.layers[0]?.asset" :style="{objectPosition:`center ${scene.positionY*100}%`}" alt="" draggable="false" />
    <canvas v-show="!fallback" ref="canvas" />
  </div>
</template>
