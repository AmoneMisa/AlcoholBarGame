import {sharp,sourceRoot} from './painted-look-lib.mjs';
import {writeFile} from 'node:fs/promises';
const rects={woman:{collar:[269,286,62,43],belt:[260,393,80,29],shoes:[239,916,122,34]},man:{collar:[250,235,100,111],belt:[250,413,100,16],shoes:[230,915,140,35]}};
for(const [model,parts] of Object.entries(rects))for(const [name,bounds] of Object.entries(parts)){
 const src=`assets-src/character-studio/production/guides/${model}-Clothing-Overlays-${model==='woman'?'evening':'formal'}.png`;
 await sharp(src).extract({left:bounds[0]*4,top:bounds[1]*4,width:bounds[2]*4,height:bounds[3]*4}).png().toFile(`${sourceRoot}/guides/${model}-${name}.png`);
}
await writeFile(`${sourceRoot}/guides/trim-manifest.json`,JSON.stringify(rects,null,2));
