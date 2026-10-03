import test from 'node:test';
import assert from 'node:assert/strict';
import { warmPages } from '../src/ui/pageWarmup.ts';
import { existsSync, readFileSync } from 'node:fs';
import { weakDevice } from '../src/ui/graphics.ts';
import { thumbnailArtwork, characterFrame, mobileArtwork } from '../src/domain/optimizedArtwork.ts';
import { FRAME_SHEETS, THUMBNAIL_ASSETS, MOBILE_ASSETS } from '../src/data/cosmetics/optimizedArt.ts';
import { CHARACTER_ART } from '../src/data/cosmetics/artCatalog.ts';
import { BARTENDER_AVATARS } from '../src/data/cosmetics/bartenderAvatars.ts';
import { bartenderCostumesFor, bartenderCostumeFor } from '../src/data/cosmetics/bartenderCostumes.ts';
import { checkTextAsync } from '../src/domain/english/asyncChecker.ts';
import { checkText } from '../src/domain/english/checker.ts';
const exists = path => existsSync(new URL(`../public${path}`,import.meta.url));

test('automatic graphics treats low memory, few cores and data saving conservatively', () => {
  for (const device of [{hardwareConcurrency:4},{deviceMemory:2},{deviceMemory:4},{saveData:true}]) assert.equal(weakDevice(device),true);
  assert.equal(weakDevice({hardwareConcurrency:8,deviceMemory:8,saveData:false}),false);
  assert.equal(weakDevice({}),false, 'missing device hints must not force lightweight graphics');
});
test('every routed thumbnail and mobile background exists, with unknown art falling back', () => {
  for (const asset of THUMBNAIL_ASSETS) for (const size of [96,192]) assert.ok(exists(thumbnailArtwork('/'+asset,size)),asset);
  for (const asset of MOBILE_ASSETS) assert.ok(exists(mobileArtwork('/'+asset)),asset);
  assert.equal(thumbnailArtwork('/assets/new-art.webp'),'/assets/new-art.webp');
  assert.equal(characterFrame('/assets/unknown.webp',0),undefined);
  assert.equal(thumbnailArtwork('/game/assets/workshop/resources/coins-painted-v1.webp',96,'/game/'),'/game/assets/optimized/96/assets/workshop/resources/coins-painted-v1.webp');
});
test('every selectable costume and hairstyle has a separate frame and portrait', () => {
  for (const character of ['noa','leo']) {
    for (const avatar of BARTENDER_AVATARS[character]) {
      assert.ok(exists(`/assets/optimized/portraits/${character}-${avatar.hairStyle}.webp`));
      for (const row of [0,1,2]) for (const size of [128,512]) assert.ok(exists(characterFrame(avatar.sheet,row*6+avatar.column,size)));
    }
    for (const costume of bartenderCostumesFor(character)) {
      const entry=bartenderCostumeFor(character,costume.value);
      for (const size of [128,512]) assert.ok(exists(characterFrame(entry.sheet,entry.index,size)),costume.value);
    }
  }
  for (const art of CHARACTER_ART.filter(art=>art.role!=='bartender' && art.sheet && !['noa','leo'].includes(art.id))) {
    assert.ok(FRAME_SHEETS.has(art.sheet));
    assert.ok(exists(characterFrame(art.sheet,art.castIndex??0)));
  }
});
test('achievement thumbnails considerably reduce transfer size without losing any tier', () => {
  let original=0, small=0;
  for (const asset of THUMBNAIL_ASSETS) if (/tier-\d\.webp$/.test(asset)) {
    original+=readFileSync(new URL('../public/'+asset,import.meta.url)).length;
    small+=readFileSync(new URL('../public'+thumbnailArtwork('/'+asset,96),import.meta.url)).length;
  }
  assert.ok(small>0 && small<original*.3,`${small} vs ${original}`);
});
test('English checking still works when Web Workers are unavailable', async () => {
  for (const input of ['Would you like a Gin and Tonic?', 'How many bottles do you need?', 'I would like drink.']) assert.deepEqual(await checkTextAsync(input),checkText(input));
});

test('game audio is optional and English voice does not depend on the sound runtime', async () => {
  const audio = await import('../src/audio/index.ts');
  assert.equal(audio.soundPackLoaded.value, false);
  assert.equal(audio.musicOn.value, false);
  assert.equal(audio.sfxOn.value, false);
  assert.equal(audio.speechOn.value, true);
  const facade = readFileSync(new URL('../src/audio/index.ts', import.meta.url), 'utf8');
  assert.ok(facade.includes("import('./runtime')"));
  assert.ok(!/^import\s+(?!type\b).*from ['"]\.\/(?:engine|music|sfx|runtime)['"]/m.test(facade));
  const voice = readFileSync(new URL('../src/domain/english/speak.ts', import.meta.url), 'utf8');
  assert.ok(voice.includes("from '../../audio/index'"));
});

test('page warmup respects priority and never overlaps requests', async () => {
  const scheduled = []; const started = []; let finish;
  const stop = warmPages([
    { id: 'study', load: () => { started.push('study'); return new Promise(resolve => { finish = resolve; }); } },
    { id: 'conversation', load: async () => { started.push('conversation'); } }
  ], { allowed: () => true, busy: () => false, schedule: run => { scheduled.push(run); return () => {}; } });
  scheduled.shift()();
  assert.deepEqual(started, ['study']); assert.equal(scheduled.length, 0);
  finish(); await new Promise(resolve => setImmediate(resolve));
  scheduled.shift()(); await new Promise(resolve => setImmediate(resolve));
  assert.deepEqual(started, ['study', 'conversation']); stop();
});

test('saving data prevents speculative pages from being scheduled', () => {
  let scheduled = 0;
  warmPages([{id:'study',load:async()=>{throw new Error('must not load');}}], {allowed:()=>false,busy:()=>false,schedule:()=>{scheduled++;return()=>{};}});
  assert.equal(scheduled,0);
});

test('busy gameplay delays warming and cancellation prevents a queued import', () => {
  const queue=[]; let busy=true; let imports=0;
  const stop=warmPages([{id:'study',load:async()=>{imports++;}}],{allowed:()=>true,busy:()=>busy,schedule:run=>{queue.push(run);return()=>{};}});
  queue.shift()(); assert.equal(imports,0); assert.equal(queue.length,1);
  busy=false; stop(); queue.shift()(); assert.equal(imports,0);
});

test('a failed speculative page does not block later pages', async () => {
  const queue=[]; const loaded=[];
  warmPages([{id:'study',load:async()=>{throw new Error('offline');}},{id:'conversation',load:async()=>{loaded.push('conversation');}}],{allowed:()=>true,busy:()=>false,schedule:run=>{queue.push(run);return()=>{};}});
  queue.shift()(); await new Promise(resolve=>setImmediate(resolve)); queue.shift()();
  await new Promise(resolve=>setImmediate(resolve)); assert.deepEqual(loaded,['conversation']);
});
