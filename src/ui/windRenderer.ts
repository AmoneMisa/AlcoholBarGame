import type { WindRegion } from '../domain/sceneMotion';

const VERTEX = `attribute vec2 aPosition;
varying vec2 vUv;
void main() { gl_Position=vec4(aPosition,0.,1.); vUv=vec2(aPosition.x*.5+.5,.5-aPosition.y*.5); }`;
const FRAGMENT = `precision mediump float;
varying vec2 vUv;
uniform sampler2D uImage;
uniform vec2 uViewport;
uniform vec4 uPainting;
uniform vec4 uRects[8];
uniform float uKinds[8];
uniform int uCount;
uniform float uTime;
uniform vec4 uTint;
uniform int uBlend;
vec3 tint(vec3 b) {
  vec3 s=uTint.rgb, mixed=s;
  if(uBlend==1) mixed=b*s;
  if(uBlend==2) {
    vec3 d=mix(((16.*b-12.)*b+4.)*b,sqrt(b),step(vec3(.25),b));
    mixed=mix(b-(1.-2.*s)*b*(1.-b),b+(2.*s-1.)*(d-b),step(vec3(.5),s));
  }
  if(uBlend==3) mixed=1.-(1.-b)*(1.-s);
  return mix(b,mixed,uTint.a);
}
void main() {
  vec2 uv=(vUv*uViewport-uPainting.xy)/uPainting.zw;
  if(uv.x<0. || uv.x>1. || uv.y<0. || uv.y>1.) discard;
  vec2 shift=vec2(0.); float coverage=0.;
  for(int i=0;i<8;i++) {
    if(i<uCount) {
      vec2 p=(uv-uRects[i].xy)/uRects[i].zw;
      float mask=smoothstep(0.,.16,p.x)*(1.-smoothstep(.84,1.,p.x))
        *smoothstep(0.,.08,p.y)*(1.-smoothstep(.92,1.,p.y));
      float phase=uTime*.9+float(i)*1.7;
      float bend=sin(phase+p.y*3.8)*p.y*p.y;
      if(uKinds[i]>.5) {
        bend=sin(phase*1.3+p.y*7.)*.65;
        shift.y+=cos(phase+p.x*6.)*.0005*mask;
      }
      shift.x+=bend*.0028*mask;
      coverage=max(coverage,mask);
    }
  }
  if(coverage<.001) discard;
  vec3 colour=tint(texture2D(uImage,clamp(uv+shift,vec2(0.),vec2(1.))).rgb);
  gl_FragColor=vec4(colour,coverage);
}`;

export function windCanvasSize(width: number, height: number) {
  const scale=Math.min(1,768/Math.max(1,width),512/Math.max(1,height));
  return {width:Math.max(1,Math.round(width*scale)),height:Math.max(1,Math.round(height*scale))};
}
export interface WindPaint {
  width:number; height:number;
  painting:{left:number;top:number;width:number;height:number};
  regions:WindRegion[];
  tint:[number,number,number,number]; blend:'normal'|'multiply'|'soft-light'|'screen';
}

// Optional WebGL1 only: no scene library, depth buffer, antialiasing or high-DPI render target.
export function createWindRenderer(canvas: HTMLCanvasElement, image: HTMLImageElement) {
  const gl=canvas.getContext('webgl',{alpha:true,premultipliedAlpha:false,antialias:false,depth:false,stencil:false,preserveDrawingBuffer:false,powerPreference:'low-power'});
  if(!gl) throw new Error('WebGL is unavailable');
  const shaders:WebGLShader[]=[];
  let program:WebGLProgram|null=null, buffer:WebGLBuffer|null=null, texture:WebGLTexture|null=null;
  let disposed=false;
  const dispose=()=> {
    if(disposed) return;
    disposed=true;
    if(texture) gl.deleteTexture(texture);
    if(buffer) gl.deleteBuffer(buffer);
    if(program) gl.deleteProgram(program);
    for(const shader of shaders) gl.deleteShader(shader);
    // Vue can recreate the effect after a tab/setting change; release the old context immediately.
    gl.getExtension('WEBGL_lose_context')?.loseContext();
  };
  try {
    const compile=(type:number,source:string)=> {
      const shader=gl.createShader(type); if(!shader) throw new Error('No shader');
      shaders.push(shader);gl.shaderSource(shader,source);gl.compileShader(shader);
      if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS)) throw new Error('Shader compilation failed');
      return shader;
    };
    program=gl.createProgram();if(!program) throw new Error('No program');
    gl.attachShader(program,compile(gl.VERTEX_SHADER,VERTEX));gl.attachShader(program,compile(gl.FRAGMENT_SHADER,FRAGMENT));gl.linkProgram(program);
    if(!gl.getProgramParameter(program,gl.LINK_STATUS)) throw new Error('Shader linking failed');
    gl.useProgram(program);
    buffer=gl.createBuffer();texture=gl.createTexture();if(!buffer || !texture) throw new Error('No resources');
    gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
    gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);
    const position=gl.getAttribLocation(program,'aPosition');gl.enableVertexAttribArray(position);gl.vertexAttribPointer(position,2,gl.FLOAT,false,0,0);
    gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,texture);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,image);
    gl.clearColor(0,0,0,0);
    const uniforms=Object.fromEntries(['uImage','uViewport','uPainting','uRects[0]','uKinds[0]','uCount','uTime','uTint','uBlend'].map(name=>[name,gl.getUniformLocation(program!,name)]));
    gl.uniform1i(uniforms.uImage!,0);
    return {
      dispose,
      draw(paint:WindPaint,time:number) {
        if(disposed || gl.isContextLost()) return;
        const size=windCanvasSize(paint.width,paint.height);
        if(canvas.width!==size.width || canvas.height!==size.height) {canvas.width=size.width;canvas.height=size.height;}
        gl.viewport(0,0,size.width,size.height);
        gl.clear(gl.COLOR_BUFFER_BIT);
        const rects=new Float32Array(32),kinds=new Float32Array(8);
        paint.regions.slice(0,8).forEach((region,index)=>{rects.set([region.x,region.y,region.width,region.height],index*4);kinds[index]=region.kind==='leaves'?1:0;});
        gl.uniform2f(uniforms.uViewport!,paint.width,paint.height);
        const box=paint.painting;gl.uniform4f(uniforms.uPainting!,box.left,box.top,box.width,box.height);
        gl.uniform4fv(uniforms['uRects[0]']!,rects);gl.uniform1fv(uniforms['uKinds[0]']!,kinds);
        gl.uniform1i(uniforms.uCount!,Math.min(8,paint.regions.length));gl.uniform1f(uniforms.uTime!,time);
        gl.uniform4fv(uniforms.uTint!,paint.tint);
        gl.uniform1i(uniforms.uBlend!,['normal','multiply','soft-light','screen'].indexOf(paint.blend));
        gl.drawArrays(gl.TRIANGLES,0,6);
      }
    };
  } catch(error) {dispose();throw error;}
}
