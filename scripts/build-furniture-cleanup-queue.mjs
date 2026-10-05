#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT=resolve('.');
const summary=JSON.parse(readFileSync(resolve(ROOT,'docs/modular-review/summary.json'),'utf8'));
const roles={
  counter:{
    prompt:'Clean the isolated counter furniture from the existing source. Remove bottles, glasses, tools, napkins and loose objects while preserving the exact counter silhouette, material, perspective, reflections and fixed trim.'
  },
  shelf:{
    prompt:'Clean the isolated back-bar shelf/cabinet from the existing source. Remove every painted bottle, glass, label and loose object. Preserve only the empty furniture, shelf boards, cabinet frame, material, perspective, permanent lighting and fixed decorative trim.'
  },
  seating:{
    prompt:'Clean the isolated seating furniture from the existing source. Remove loose objects and accidental foreground clutter while preserving the exact chairs/stools, upholstery, legs, perspective and permanent material details.'
  }
};

const queue=[];
for(const item of summary){
  if(!item.isolatedFurnitureReady||item.cleanFurnitureReady) continue;
  for(const [role,contract] of Object.entries(roles)){
    queue.push({
      scene:item.scene,
      role,
      source:`public/assets/bar/modular/${item.scene}/review-ready/${role}.webp`,
      sourceMask:`public/assets/bar/modular/${item.scene}/review-ready/${role}-mask.png`,
      output:`public/assets/bar/modular/${item.scene}/clean-ready/${role}.webp`,
      prompt:contract.prompt,
      constraints:[
        'Use the existing isolated furniture asset as the visual ground truth.',
        'Do not change camera, perspective, scale or silhouette.',
        'Keep transparent surroundings transparent.',
        'Do not invent new furniture geometry or decorative objects.',
        role==='shelf'
          ? 'The final shelf must contain no bottles or glassware because bottle presets are rendered independently at runtime.'
          : 'The final asset must contain furniture only; gameplay/decor objects are rendered independently.'
      ]
    });
  }
}

const out=resolve(ROOT,'docs/modular-review/furniture-cleanup-queue.json');
writeFileSync(out,JSON.stringify({count:queue.length,scenes:[...new Set(queue.map(item=>item.scene))],items:queue},null,2)+'\n');
console.log(`furniture cleanup queue: ${queue.length} role(s) across ${new Set(queue.map(item=>item.scene)).size} scene(s)`);
for(const item of queue) console.log(`- ${item.scene}/${item.role}: ${item.source} -> ${item.output}`);
