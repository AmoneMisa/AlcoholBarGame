#!/usr/bin/env node
import { readdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';

const dir=resolve('scripts/modular-scenes');
const manifests=readdirSync(dir)
  .filter(name=>name.endsWith('.json'))
  .sort();

let failed=0;
for(const name of manifests){
  const path=resolve(dir,name);
  console.log(`\n=== ${name} ===`);
  const run=spawnSync(process.execPath,[resolve('scripts/modular-scene-plan.mjs'),path],{stdio:'inherit'});
  if(run.status!==0) failed++;
}
console.log(`\nValidated ${manifests.length} modular scene manifests.`);
if(failed){
  console.error(`${failed} manifest(s) failed.`);
  process.exit(1);
}
