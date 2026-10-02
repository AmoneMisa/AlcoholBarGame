import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { INTERIORS, BAR_PROFILE_OPTIONS } from '../src/data/cosmetics/bars.ts';
import { bartenderCostumeFor, bartenderCostumesFor } from '../src/data/cosmetics/bartenderCostumes.ts';
import { THEMED_INTERIORS, THEMED_COSTUMES, costumesForInterior } from '../src/data/cosmetics/themedBars.ts';
import { GAME_THEME_INTERIORS } from '../src/data/cosmetics/gameThemeExpansion.ts';

test('Every bar recommends valid outfits for both bartender identities', () => {
  for (const interior of INTERIORS) for (const character of ['noa','leo']) {
    const styles=costumesForInterior(interior.id,character);
    assert.ok(styles.length,`${interior.id} has no ${character} style`);
    for(const value of styles) {
      assert.ok(BAR_PROFILE_OPTIONS.bartender.includes(value),value);
      assert.ok(value === 'vest' || bartenderCostumeFor(character,value),`${interior.id}: ${character}/${value}`);
    }
  }
  assert.deepEqual(costumesForInterior('missing','noa'),[]);
  assert.deepEqual(costumesForInterior('underwater','missing'),[]);
});

test('Race collections and requested characters are complete for both sexes', () => {
  for(const character of ['noa','leo']) {
    assert.equal(THEMED_COSTUMES[character].length,53);
    assert.equal(GAME_THEME_INTERIORS.length,17);
    for (const interior of GAME_THEME_INTERIORS) {
      assert.equal(THEMED_COSTUMES[character].filter(style=>style.theme===interior.id).length,1);
      assert.deepEqual(costumesForInterior(interior.id,character),[`theme-${interior.id}-${character}`]);
    }
    assert.equal(THEMED_COSTUMES[character].filter(style=>style.theme==='lineage-2').length,8);
    assert.equal(THEMED_COSTUMES[character].filter(style=>style.theme==='perfect-world').length,6);
    assert.equal(THEMED_COSTUMES[character].filter(style=>style.theme==='allods').length,8);
    assert.equal(THEMED_COSTUMES[character].filter(style=>style.theme==='warcraft-3').length,4);
    assert.equal(THEMED_COSTUMES[character].filter(style=>style.theme==='mass-effect').length,3);
    const cells=new Set();
    for(const style of THEMED_COSTUMES[character]) {
      const frame=bartenderCostumeFor(character,style.value);
      const cell=`${frame.sheet}:${frame.index}`;
      assert.ok(!cells.has(cell),style.value); cells.add(cell);
      assert.equal(frame.frameRatio,420/552);
      assert.equal(bartenderCostumeFor(character==='noa'?'leo':'noa',style.value),undefined);
    }
  }
  const values=THEMED_COSTUMES.noa.concat(THEMED_COSTUMES.leo).map(style=>style.value);
  for(const value of ['theme-wc3-sylvanas-noa','theme-wc3-maiev-noa','theme-wc3-jaina-noa','theme-wc3-tyrande-noa','theme-wc3-illidan-leo','theme-wc3-malfurion-leo','theme-wc3-arthas-leo','theme-wc3-thrall-leo','theme-lost-ark-bard-noa','theme-lost-ark-berserker-leo','theme-shepard-noa','theme-shepard-leo','theme-garrus-leo','theme-thane-leo','theme-miranda-noa','theme-liara-noa']) assert.ok(values.includes(value),value);
});

test('All original and new backgrounds are individually installed and unique', () => {
  assert.equal(THEMED_INTERIORS.length,30);
  const hashes=new Set();
  for(const interior of INTERIORS) {
    const bytes=readFileSync(new URL(`../public${interior.asset}`,import.meta.url));
    assert.equal(bytes.toString('ascii',8,12),'WEBP');
    const hash=createHash('sha256').update(bytes).digest('hex');
    assert.ok(!hashes.has(hash),`${interior.id} duplicates another background`);hashes.add(hash);
  }
});
