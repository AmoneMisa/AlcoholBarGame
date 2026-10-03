import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createInitialState, normalizePlayerState } from '../src/sim/state.ts';
import { completeAction } from './paid-action.mjs';
import { fragmentChoiceOptions } from '../src/domain/fragmentChoices.ts';
import { BOX_TABLES, FRAGMENT_CHOICE_IDS } from '../src/domain/loot.ts';
import { ACHIEVEMENT_STYLES } from '../src/data/cosmetics/styleSources.ts';
import { COSMETICS, interiorForCosmetic } from '../src/domain/cosmetics.ts';
import { PASS_THEMES, themeStyleIds } from '../src/domain/pass.ts';
import { isEventInterior } from '../src/data/cosmetics/bars.ts';
import { ACHIEVEMENTS } from '../src/domain/quests.ts';
const now=Date.UTC(2026,9,3,12);const context={now,random:()=>.5,checkEnglish:text=>({ok:true,corrected:text})};
for(const id of FRAGMENT_CHOICE_IDS) test(id+' consumes one choice item and grants exactly the selected fragment',()=>{
  const state=createInitialState(now);state.startingBarChosen=true;state.loot.consumables[id]=2;
  const target=fragmentChoiceOptions(id)[0].id;
  completeAction(state,{type:'useFragmentChoice',id,targetId:target},context);
  assert.equal(state.loot.consumables[id],1);
  const map=id==='friend-choice'?state.companions.shards:id==='equipment-choice'?state.loot.itemShards:state.loot.styleShards;
  assert.equal(map[id==='background-choice'?'background:'+target:target],1);
  assert.equal(state.loot.skinShards,0);assert.equal(state.loot.stylePieces,0);
  normalizePlayerState(state);assert.equal(state.loot.consumables[id],1);
});
test('Excluded costumes and backgrounds are absent from choices and rejected by server without spending the item',()=>{
  const styles=fragmentChoiceOptions('style-choice');const backgrounds=fragmentChoiceOptions('background-choice');
  const excluded=[...PASS_THEMES.flatMap(themeStyleIds),...Object.values(ACHIEVEMENT_STYLES).flatMap(pair=>Object.entries(pair).map(([character,value])=>'bartender:'+value+':'+character))];
  for(const id of excluded){assert.ok(!styles.some(x=>x.id===id));const state=createInitialState(now);state.loot.consumables['style-choice']=1;assert.throws(()=>completeAction(state,{type:'useFragmentChoice',id:'style-choice',targetId:id},context),/not available/);assert.equal(state.loot.consumables['style-choice'],1);assert.equal(state.loot.styleShards[id],undefined);}
  for(const item of styles){assert.ok(!isEventInterior(interiorForCosmetic(item.id)));assert.notEqual(COSMETICS.find(x=>x.id===item.id).source,'achievement');}
  for(const item of backgrounds){assert.ok(!isEventInterior(item.id));assert.ok(!PASS_THEMES.some(x=>x.interior===item.id));}
});
test('Choice puzzles cannot be bought free or used without a valid selection',()=>{
  for(const id of FRAGMENT_CHOICE_IDS){const state=createInitialState(now);state.loot.consumables[id]=1;
    for(const action of [{type:'buyConsumable',id},{type:'useConsumable',id},{type:'useFragmentChoice',id,targetId:'made-up'}]){assert.throws(()=>completeAction(state,action,context));assert.equal(state.loot.consumables[id],1);}
    completeAction(state,{type:'useFragmentChoice',id,targetId:fragmentChoiceOptions(id)[0].id},context);
    assert.throws(()=>completeAction(state,{type:'useFragmentChoice',id,targetId:fragmentChoiceOptions(id)[0].id},context),/do not own/);
  }
});
test('A recruited Circle friend cannot consume a choice puzzle',()=>{const state=createInitialState(now);const target=fragmentChoiceOptions('friend-choice')[0].id;state.companions ??= {owned:{},shards:{},keepsakes:{},assigned:{},visits:{day:'',counts:{}}};state.companions.owned[target]=0;state.loot.consumables['friend-choice']=1;assert.throws(()=>completeAction(state,{type:'useFragmentChoice',id:'friend-choice',targetId:target},context),/already joined/);assert.equal(state.loot.consumables['friend-choice'],1);});
test('Each choice puzzle has the advertised low chance in every chest',()=>{
  for(const [kind,table] of Object.entries(BOX_TABLES))for(const id of FRAGMENT_CHOICE_IDS){const entry=table.find(x=>{const reward=x.make(1,()=>.5);return reward.kind==='consumable' && reward.id===id;});assert.ok(entry);const percent=entry.weight/table.reduce((sum,x)=>sum+x.weight,0)*100;assert.ok(Math.abs(percent-({bronze:.1,silver:.2,gold:.4}[kind]))<1e-10);}
});
test('Every achievement has four distinct WebP stage images',()=>{
  for(const series of new Set(ACHIEVEMENTS.map(x=>x.series))){const images=[1,2,3,4].map(tier=>readFileSync('public/assets/workshop/achievements/'+series+'-tier-'+tier+'.webp'));for(const data of images){assert.equal(data.toString('ascii',0,4),'RIFF');assert.equal(data.toString('ascii',8,12),'WEBP');}assert.equal(new Set(images.map(x=>x.toString('base64'))).size,4);}
});
