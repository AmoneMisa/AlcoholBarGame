#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT=resolve('.');
const summary=JSON.parse(readFileSync(resolve(ROOT,'docs/modular-review/summary.json'),'utf8'));
const queue=[];

for(const item of summary){
  if(!item.furnitureReady||item.architectureReady) continue;
  const manifestPath=resolve(ROOT,'scripts/modular-scenes',`${item.scene}.json`);
  const manifest=JSON.parse(readFileSync(manifestPath,'utf8'));
  const architecture=manifest.modules?.['architecture-reference']??{};
  queue.push({
    id:item.scene,
    source:manifest.source,
    output:`public/assets/bar/modular/${item.scene}/architecture.webp`,
    mask:`public/assets/bar/modular/${item.scene}/architecture-mask.png`,
    windowCutouts:manifest.windowCutoutsNormalized??manifest.windowCutouts??[],
    prompt:architecture.prompt??'Create a clean architecture plate from the exact source while preserving camera, horizon and perspective.',
    constraints:[
      'Use only the existing source background as visual ground truth.',
      'Remove counter, seating, loose foreground decor and back-bar furniture.',
      'Reconstruct only surfaces hidden by removed furniture; do not redesign the room.',
      'Keep camera, horizon, perspective, wall openings and permanent architecture unchanged.',
      'Do not bake bottle decor into shelves; bottles are rendered separately.',
      'Where windowCutouts are present, keep frames/mullions/reflections but make the marked panes transparent.'
    ]
  });
}

const output=resolve(ROOT,'docs/modular-review/architecture-queue.json');
writeFileSync(output,JSON.stringify({count:queue.length,scenes:queue},null,2)+'\n');
console.log(`architecture queue: ${queue.length} scene(s)`);
for(const item of queue) console.log(`- ${item.id}: ${item.source} -> ${item.output}`);
