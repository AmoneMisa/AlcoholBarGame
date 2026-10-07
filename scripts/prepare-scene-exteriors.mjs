import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { INTERIORS } from '../src/data/cosmetics/bars.ts';
import { modularSceneFor } from '../src/data/cosmetics/modularScenes.ts';

const target=resolve('scripts/modular-scene-exterior-generation.json');
const previous=existsSync(target)?JSON.parse(readFileSync(target,'utf8')):{items:[]};
const byId=new Map(previous.items.map(item=>[item.id,item]));
const items=INTERIORS.filter(interior=>modularSceneFor(interior.id)?.exterior).map(interior=>{
  const id=`scene-${interior.id}`;
  const scene=modularSceneFor(interior.id);
  const existing=byId.get(id);
  return {
    id,scene:interior.id,label:`${interior.name} — original scenery`,
    reference:`public${interior.asset}`,
    preservedExterior:`public${scene.exterior.asset}`,
    output:`public/assets/bar/exteriors/${id}.webp`,
    prompt:`Create a standalone outdoor scenery panorama faithfully reconstructing ONLY the original view visible outside the windows or open balcony of the supplied ${interior.name} reference. Use the supplied artwork as the authority for scenery, landmarks, architecture outdoors, vegetation, weather, time of day, colors and painterly game art style. Preserve this scene's specific original exterior; do not substitute a generic city or forest. Reconstruct the outdoor areas obscured by the interior and extend the vista into a continuous wide 16:9 panorama. Human eye level, horizon consistent with the reference, natural foreground/middle distance/background depth. ONLY scenery outside: absolutely NO room interior, window frames, mullions, curtains, foreground balcony railings or floor, furniture, bottles, shelves, pillars, borders, writing or UI. Opaque full canvas edge to edge, no transparent gaps. The outdoor buildings, bridges or spaceships that belong to the actual original distant scenery should remain. This asset will be reused behind separately rendered windows and balconies of other rooms.`,
    status:existing?.status??'pending-generation',
    ...(existing?.generatedSource?{generatedSource:existing.generatedSource}:{}),
    ...(existing?.reviewed!==undefined?{reviewed:existing.reviewed}:{})
  };
});
for(const item of items)for(const field of ['reference','preservedExterior'])if(!existsSync(resolve(item[field])))throw new Error(`${item.id}: missing ${field}`);
writeFileSync(target,JSON.stringify({tool:'built-in image_gen',purpose:'One independently reusable faithful exterior for every open room; the 12 existing panoramas remain additional choices.',items},null,2)+'\n');
console.log(`${items.length} referenced original scenery tasks; ${items.filter(item=>item.status==='ready').length} ready.`);
