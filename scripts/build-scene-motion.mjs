import { createRequire } from 'node:module';
import { mkdir, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

// Small procedural transparent layers, not full-frame copies of each room or costume.
// All frames form a periodic loop. Sharp is available in the bundled artwork runtime.
const sharp = createRequire(import.meta.url)(process.env.ART_SHARP_PATH || 'C:/Users/kubai/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const root = new URL('../public/assets/bar/motion/',import.meta.url);
await mkdir(root,{recursive:true});
const count = 20, delay = 200, tau = Math.PI*2;
for (const kind of ['ambient-warm','ambient-neon','water-shimmer','curtain-shimmer','water-caustics','window-snow','garden-fireflies']) {
  const width = kind === 'curtain-shimmer' ? 64 : ['window-snow','water-caustics'].includes(kind) ? 128 : kind === 'garden-fireflies' ? 192 : 256;
  const height = kind === 'water-shimmer' ? 64 : kind === 'water-caustics' ? 96 : ['curtain-shimmer','window-snow'].includes(kind) ? 160 : 128;
  const frames = Buffer.alloc(width*height*4*count);
  for (let frame=0;frame<count;frame++) {
    const phase = frame/count*tau;
    for (let y=0;y<height;y++) for (let x=0;x<width;x++) {
      const nx=x/(width-1), ny=y/(height-1);
      const edge=Math.min(1,nx*12,(1-nx)*12,ny*12,(1-ny)*12);
      let colour=[255,192,105], alpha=0;
      if (kind.startsWith('ambient')) {
        const left = Math.exp(-((nx-.23)**2/.025+(ny-.20)**2/.12))*(.72+.22*Math.sin(phase));
        const right = Math.exp(-((nx-.78)**2/.025+(ny-.18)**2/.12))*(.72+.22*Math.sin(phase+2));
        alpha=(left+right)*43*edge;
        if (kind==='ambient-neon') colour = nx<.5 ? [103,195,255] : [221,100,233];
      } else if (kind==='water-shimmer') {
        const ripple = Math.sin(ny*32+phase+Math.sin(nx*18-phase)*.6);
        const sparkle = Math.max(0,ripple)**12;
        alpha=sparkle*(.6+.4*Math.cos(nx*24+phase))*95*edge;
        colour=[204,247,255];
      } else if (kind==='curtain-shimmer') {
        const fold=Math.sin(nx*22 + Math.sin(ny*5+phase)*.35);
        alpha=Math.abs(fold)*27*edge;
        colour=fold>0 ? [255,184,117] : [22,4,14];
      } else if (kind==='water-caustics') {
        const a=Math.sin(nx*19+Math.sin(ny*17+phase)*1.2);
        const b=Math.sin(ny*23+Math.sin(nx*14-phase)*1.4);
        alpha=Math.max(0,1-Math.abs(a+b)*5)**3*65*edge;
        colour=[177,244,255];
      } else if (kind==='window-snow') {
        // Wrap flakes at the image edges; the edge fade hides the wrap seam.
        for (let flake=0;flake<13;flake++) {
          const fx=(1+flake*.618033+.045*Math.sin(phase+flake))%1;
          const fy=(flake*.381966+frame/count)%1;
          const dx=(nx-fx)*width,dy=(ny-fy)*height;
          alpha+=Math.exp(-(dx*dx+dy*dy)/2.1)*145*edge;
        }
        colour=[240,249,255];
      } else {
        for (let fly=0;fly<6;fly++) {
          const fx=.15+(fly*.618033%1)*.7+.025*Math.sin(phase+fly);
          const fy=.15+(fly*.381966%1)*.7+.035*Math.cos(phase+fly*2);
          const dx=(nx-fx)*width,dy=(ny-fy)*height;
          alpha+=Math.exp(-(dx*dx+dy*dy)/6)*(.5+.5*Math.sin(phase+fly*1.3))*190*edge;
        }
        colour=[239,255,154];
      }
      const offset=(frame*width*height+y*width+x)*4;
      frames[offset]=colour[0];frames[offset+1]=colour[1];frames[offset+2]=colour[2];frames[offset+3]=Math.min(255,Math.round(alpha));
    }
  }
  const output = new URL(`${kind}.webp`,root);
  await sharp(frames,{raw:{width,height:height*count,channels:4,pageHeight:height}})
    .webp({quality:65,alphaQuality:75,effort:6,loop:0,delay:Array(count).fill(delay)}).toFile(fileURLToPath(output));
  const metadata = await sharp(fileURLToPath(output),{animated:true}).metadata();
  if(metadata.pages!==count || metadata.loop!==0 || !metadata.hasAlpha) throw new Error(`Invalid animated layer: ${kind}`);
  console.log(`${kind}: ${(await stat(output)).size} bytes, ${metadata.pages} frames, ${width}×${height}`);
}
