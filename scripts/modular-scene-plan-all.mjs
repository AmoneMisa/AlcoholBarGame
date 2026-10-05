#!/usr/bin/env node
import { readdirSync, readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';

const manifestDir=resolve('scripts/modular-scenes');
const backgroundDir=resolve('public/assets/bar/backgrounds');

const manifests=readdirSync(manifestDir)
  .filter(name=>name.endsWith('.json'))
  .sort();

const backgroundId=(name)=>{
  if(name==='botanical-room.webp') return 'garden';
  if(name==='inferno-penthouse-club.webp') return 'inferno-penthouse';
  if(name==='skyline-lounge.webp') return 'skyline';
  if(name==='velvet-hour-bar.webp') return 'velvet';
  return name.replace(/^interior-/,'').replace(/\.webp$/,'');
};

const backgroundIds=readdirSync(backgroundDir)
  .filter(name=>name.endsWith('.webp')&&!name.includes('atlas'))
  .map(backgroundId)
  .sort();

const manifestIds=manifests.map(name=>name.replace(/\.json$/,''));
const missingManifests=backgroundIds.filter(id=>!manifestIds.includes(id));
const orphanManifests=manifestIds.filter(id=>!backgroundIds.includes(id));

if(missingManifests.length||orphanManifests.length){
  if(missingManifests.length) console.error(`Missing manifests: ${missingManifests.join(', ')}`);
  if(orphanManifests.length) console.error(`Orphan manifests: ${orphanManifests.join(', ')}`);
  process.exit(1);
}

let failed=0;
const statusCounts=new Map();
const geometryCounts=new Map();

for(const name of manifests){
  const path=resolve(manifestDir,name);
  const manifest=JSON.parse(readFileSync(path,'utf8'));
  const status=manifest.status??'authoring';
  const geometrySource=manifest.geometrySource??'unspecified';
  statusCounts.set(status,(statusCounts.get(status)??0)+1);
  geometryCounts.set(geometrySource,(geometryCounts.get(geometrySource)??0)+1);

  console.log(`\n=== ${name} ===`);
  const run=spawnSync(process.execPath,[resolve('scripts/modular-scene-plan.mjs'),path],{stdio:'inherit'});
  if(run.status!==0) failed++;
}

console.log(`\nValidated ${manifests.length} modular scene manifests for ${backgroundIds.length} background assets.`);
console.log('Status coverage:');
for(const [status,count] of [...statusCounts].sort()) console.log(`- ${status}: ${count}`);
console.log('Geometry coverage:');
for(const [source,count] of [...geometryCounts].sort()) console.log(`- ${source}: ${count}`);

if(failed){
  console.error(`${failed} manifest(s) failed.`);
  process.exit(1);
}
