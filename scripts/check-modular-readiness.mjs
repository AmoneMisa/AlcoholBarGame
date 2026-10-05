#!/usr/bin/env node
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const MOD=resolve('public/assets/bar/modular');
const ROLES=['counter','shelf','seating'];

function hasFinalFurniture(base,name,requiredRoles){
  if(name==='velvet'){
    const legacy={counter:'counter.webp',shelf:'shelf.webp',seating:'stool.webp'};
    return requiredRoles.every(role=>existsSync(resolve(base,legacy[role])));
  }
  return requiredRoles.every(role=>existsSync(resolve(base,'clean-ready',`${role}.webp`)));
}

let failed=0;
const rows=[];

for(const name of readdirSync(MOD).sort()){
  const base=resolve(MOD,name);
  const measured=resolve(base,'auto/segmentation-report.json');
  const candidate=resolve(base,'auto-candidate/segmentation-report.json');
  const reportPath=existsSync(measured)?measured:existsSync(candidate)?candidate:null;
  if(!reportPath) continue;

  const kind=reportPath===measured?'measured':'candidate';
  const report=JSON.parse(readFileSync(reportPath,'utf8'));
  const manifestPath=resolve('scripts/modular-scenes',`${name}.json`);
  const manifest=existsSync(manifestPath)?JSON.parse(readFileSync(manifestPath,'utf8')):{};
  const requiredRoles=manifest.requiredRoles??ROLES;
  const manualApprovedRoles=new Set(manifest.manualApprovedRoles??[]);
  const statuses=Object.fromEntries(ROLES.map(role=>[role,report.roles?.[role]?.status??'missing']));
  const promoted=Object.fromEntries(ROLES.map(role=>[role,existsSync(resolve(base,'review-ready',`${role}.webp`))]));

  if(kind==='candidate'){
    for(const role of ROLES){
      if(promoted[role]){
        console.error(`${name}: provisional candidate leaked into review-ready: ${role}`);
        failed++;
      }
    }
  }else{
    for(const role of ROLES){
      const shouldPromote=statuses[role]==='ok'||manualApprovedRoles.has(role);
      if(promoted[role]!==shouldPromote){
        console.error(`${name}: review-ready mismatch for ${role}: status=${statuses[role]}, asset=${promoted[role]}`);
        failed++;
      }
    }
  }

  const isolatedFurnitureReady=kind==='measured'&&requiredRoles.every(role=>statuses[role]==='ok'||manualApprovedRoles.has(role));
  const cleanFurnitureReady=hasFinalFurniture(base,name,requiredRoles);
  const architectureReady=existsSync(resolve(base,'architecture.webp'));

  rows.push({
    scene:name,
    kind,
    architectureReady,
    isolatedFurnitureReady,
    cleanFurnitureReady,
    requiredRoles,
    manualApprovedRoles:[...manualApprovedRoles],
    productionReady:architectureReady&&cleanFurnitureReady,
    statuses
  });
}

const measured=rows.filter(row=>row.kind==='measured');
const candidates=rows.filter(row=>row.kind==='candidate');
const isolatedFurnitureReady=rows.filter(row=>row.isolatedFurnitureReady).map(row=>row.scene);
const cleanFurnitureReady=rows.filter(row=>row.cleanFurnitureReady).map(row=>row.scene);
const architectureReady=rows.filter(row=>row.architectureReady).map(row=>row.scene);
const productionReady=rows.filter(row=>row.productionReady).map(row=>row.scene);

console.log(`modular scenes: ${rows.length}; measured: ${measured.length}; candidates: ${candidates.length}`);
console.log(`isolated furniture: ${isolatedFurnitureReady.length} [${isolatedFurnitureReady.join(', ')}]`);
console.log(`clean furniture: ${cleanFurnitureReady.length} [${cleanFurnitureReady.join(', ')}]`);
console.log(`clean architecture: ${architectureReady.length} [${architectureReady.join(', ')}]`);
console.log(`production-ready: ${productionReady.length} [${productionReady.join(', ')}]`);

if(failed){
  console.error(`${failed} modular readiness invariant(s) failed.`);
  process.exit(1);
}
