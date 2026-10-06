<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';
import * as THREE from 'three';
import { layerAsset, type ModularSceneDefinition, type ModularSelectionKey } from '../../data/cosmetics/modularScenes';
import { PAINTED_BOTTLE_ATLAS, PAINTED_BOTTLE_COLUMNS, PAINTED_BOTTLE_ROWS, shelfDecorPresetFor, type ShelfDecorPresetId } from '../../data/cosmetics/shelfDecor';
import { windowBackdropFor, type WindowBackdropId } from '../../data/cosmetics/windowBackdrops';

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
  return new Promise<HTMLImageElement>((resolve,reject)=>{
    const image=new Image();
    image.decoding='async';
    image.onload=()=>resolve(image);
    image.onerror=()=>reject(new Error('Could not load modular bar layer '+src));
    image.src=src;
  });
}
async function drawExterior(context:CanvasRenderingContext2D){
  if(!props.scene.exterior)return;
  const preset=windowBackdropFor(props.windowBackdrop??'skyline');
  const image=await loadImage(preset.asset);
  const crop=preset.sourceRect;
  const sx=crop.x*image.naturalWidth;
  const sy=crop.y*image.naturalHeight;
  const sw=crop.width*image.naturalWidth;
  const sh=crop.height*image.naturalHeight;
  context.drawImage(image,sx,sy,sw,sh,0,0,props.scene.canvas.width,props.scene.canvas.height);
}

async function drawShelfDecor(context:CanvasRenderingContext2D){
  const decor=props.scene.shelfDecor;
  if(!decor)return;
  const preset=shelfDecorPresetFor(props.shelfPreset??'classic-cocktails');
  const atlas=await loadImage(PAINTED_BOTTLE_ATLAS);
  const cellW=atlas.naturalWidth/PAINTED_BOTTLE_COLUMNS;
  const cellH=atlas.naturalHeight/PAINTED_BOTTLE_ROWS;

  for(const bay of decor.bays){
    const bx=bay.rect.x*props.scene.canvas.width;
    const by=bay.rect.y*props.scene.canvas.height;
    const bw=bay.rect.width*props.scene.canvas.width;
    const bh=bay.rect.height*props.scene.canvas.height;

    const panel=context.createLinearGradient(0,by,0,by+bh);
    panel.addColorStop(0,decor.panelTop);
    panel.addColorStop(1,decor.panelBottom);
    context.save();
    context.fillStyle=panel;
    context.fillRect(bx,by,bw,bh);

    context.strokeStyle=decor.rail;
    context.lineWidth=Math.max(2,props.scene.canvas.height*.0024);
    for(const baseline of bay.rowBaselines){
      const y=by+baseline*bh;
      context.beginPath();
      context.moveTo(bx,y);
      context.lineTo(bx+bw,y);
      context.stroke();
    }
    context.restore();

    const rowCount=bay.rowBaselines.length;
    for(const item of preset.items){
      const row=Math.max(0,Math.min(rowCount-1,item.row));
      const baseline=by+bay.rowBaselines[row]!*bh;
      const scale=item.scale??1;
      const targetH=Math.min(bh*.27,props.scene.canvas.height*.115)*scale;
      const targetW=targetH*(cellW/cellH);
      const x=bx+item.x*bw-targetW/2;
      const y=baseline-targetH;
      const column=item.cell%PAINTED_BOTTLE_COLUMNS;
      const sourceRow=Math.floor(item.cell/PAINTED_BOTTLE_COLUMNS)%PAINTED_BOTTLE_ROWS;

      context.save();
      context.globalAlpha=item.alpha??1;
      context.filter=[preset.filter,preset.glow ? `drop-shadow(0 0 ${Math.max(2,targetH*.045)}px ${preset.glow})` : ''].filter(Boolean).join(' ');
      context.translate(x+targetW/2,baseline);
      context.rotate((item.rotate??0)*Math.PI/180);
      context.drawImage(atlas,column*cellW,sourceRow*cellH,cellW,cellH,-targetW/2,-targetH,targetW,targetH);
      context.restore();
    }
  }
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
    const rect=layer.rect;
    if(rect){
      const x=rect.x*source.width,y=rect.y*source.height,w=rect.width*source.width,h=rect.height*source.height;
      if(layer.flipX){
        context.save();
        context.translate(x+w,y);
        context.scale(-1,1);
        context.drawImage(image,0,0,w,h);
        context.restore();
      }else context.drawImage(image,x,y,w,h);
    }else context.drawImage(image,0,0,source.width,source.height);
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
  try{
    const composite=await compose();
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
    <img v-if="fallback" :src="backgroundSource || scene.layers[0]?.asset" alt="" draggable="false" />
    <canvas v-show="!fallback" ref="canvas" />
  </div>
</template>
