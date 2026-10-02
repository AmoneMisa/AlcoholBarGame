import { BASIC_COSTUMES } from '../src/data/cosmetics/styleSources.ts';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import test from 'node:test';
import { AVATAR_OPTIONS, avatarOptionsFor } from '../src/data/cosmetics/avatar.ts';
import { BAR_PROFILE_OPTIONS } from '../src/data/cosmetics/bars.ts';
import { canUseCosmetic } from '../src/domain/cosmetics.ts';
import { avatarIdleAt } from '../src/domain/avatarMotion.ts';
import { BARTENDER_AVATARS, bartenderAvatarFor } from '../src/data/cosmetics/bartenderAvatars.ts';
import { INTERIORS } from '../src/data/cosmetics/bars.ts';
import { bartenderCostumesFor, bartenderCostumeFor } from '../src/data/cosmetics/bartenderCostumes.ts';

test('Avatars share compact atlases with unique hairstyle cells and fixed natural hair colors', () => {
  const paths = new Set();
  for (const character of ['noa', 'leo']) {
    assert.equal(BARTENDER_AVATARS[character].length, 6);
    assert.deepEqual(avatarOptionsFor(character).map(option => option.key), ['hairStyle']);
    for (const avatar of BARTENDER_AVATARS[character]) {
      assert.equal(bartenderAvatarFor(character, avatar.hairStyle), avatar);
      const bytes = readFileSync(new URL(`../public${avatar.sheet}`, import.meta.url));
      assert.equal(bytes.toString('ascii', 0, 4), 'RIFF');
      assert.equal(bytes.toString('ascii', 8, 12), 'WEBP');
      assert.ok(bytes.length > 10000);
      assert.ok(avatar.frameRatio > .5 && avatar.frameRatio < .7);
      const cell = `${avatar.sheet}:${avatar.column}`;
      assert.ok(!paths.has(cell));
      paths.add(cell);
      assert.equal(avatar.hairColor, character === 'noa' ? 'espresso' : 'chestnut');
      assert.ok(avatar.column >= 0 && avatar.column < 6);
      assert.ok(BAR_PROFILE_OPTIONS.hairColor.includes(avatar.hairColor));
    }
    assert.equal(bartenderAvatarFor(character, 'legacy-unknown'), BARTENDER_AVATARS[character][0]);
  }
  assert.equal(bartenderAvatarFor('marin', 'waves'), undefined);
  // The themed sheets (one pair of backgrounds and costumes per theme) are checked with the themed styles; here only the others.
  assert.deepEqual(readdirSync(new URL('../public/assets/characters/bartender/', import.meta.url)).filter((name) => !name.includes('-themed-atlas-')).sort(), [
    'leo-costumes-atlas-v1.webp',
    'leo-costumes-atlas-v2.webp',
    'leo-costumes-atlas-v3.webp',
    'leo-costumes-atlas-v4.webp',
    'leo-costumes-atlas-v5.webp',
    'leo-costumes-atlas-v6.webp',
    'leo-costumes-atlas-v7.webp',
    'leo-costumes-atlas-v8.webp',
    'leo-natural-atlas-v2.webp', 'leo-special-a-v1.webp', 'leo-special-b-v1.webp',
    'noa-costumes-atlas-v1.webp',
    'noa-costumes-atlas-v2.webp',
    'noa-costumes-atlas-v3.webp',
    'noa-costumes-atlas-v4.webp',
    'noa-costumes-atlas-v5.webp',
    'noa-costumes-atlas-v6.webp',
    'noa-costumes-atlas-v7.webp',
    'noa-costumes-atlas-v8.webp',
    'noa-costumes-atlas-v9.webp',
    'noa-natural-atlas-v2.webp', 'noa-special-a-v1.webp', 'noa-special-b-v1.webp',
  ]);
});

test('Reference costumes are selectable, valid saved outfits and exclusive to their bartender', () => {
  for (const character of ['noa', 'leo']) {
    const costumes = bartenderCostumesFor(character);
    assert.ok(costumes.length >= 45, `${character} has ${costumes.length} painted styles`);
    for (const choice of costumes) {
      const costume = bartenderCostumeFor(character, choice.value);
      assert.ok(BAR_PROFILE_OPTIONS.bartender.includes(choice.value));
      // Three styles per bartender are open from the start; every other one needs to be owned.
      const owned = [`bartender:${choice.value}:${character}`];
      assert.equal(canUseCosmetic(owned, 'bartender', choice.value, character), true);
      assert.equal(canUseCosmetic([], 'bartender', choice.value, character), BASIC_COSTUMES[character].includes(choice.value));
      assert.equal(canUseCosmetic(owned, 'bartender', choice.value, character === 'noa' ? 'leo' : 'noa'), false);
      assert.equal(bartenderCostumeFor(character === 'noa' ? 'leo' : 'noa', choice.value), undefined);
      assert.ok(costume.index >= 0 && costume.index < 6);
      const bytes = readFileSync(new URL(`../public${costume.sheet}`, import.meta.url));
      assert.equal(bytes.toString('ascii', 8, 12), 'WEBP');
    }
  }
});

test('Every bar theme has an installed background', () => {
  assert.ok(INTERIORS.length >= 20);
  for (const interior of INTERIORS) {
    const bytes = readFileSync(new URL(`../public${interior.asset}`, import.meta.url));
    assert.equal(bytes.toString('ascii', 8, 12), 'WEBP', interior.id);
  }
});

test('Every editor choice remains valid for saved profiles and server validation', () => {
  for (const option of AVATAR_OPTIONS) for (const value of option.values) assert.ok(BAR_PROFILE_OPTIONS[option.key].includes(value), `${option.key}: ${value}`);
  for (const character of ['noa', 'leo']) {
    for (const option of avatarOptionsFor(character)) {
      assert.ok(option.values.length > 0);
      for (const value of option.values) assert.ok(BAR_PROFILE_OPTIONS[option.key].includes(value), `${character} ${option.key}: ${value}`);
    }
  }
});

test('Idle motion stays subtle, blinks briefly, and fully stops when paused', () => {
  let closingFrames=0;
  for(let i=0;i<3000;i++) {
    const pose=avatarIdleAt(i/60);
    assert.ok(pose.blink>=0 && pose.blink<=1);
    assert.ok(Math.abs(pose.breath)<=.0023 && Math.abs(pose.yaw)<=.046 && Math.abs(pose.nod)<=.013);
    if(pose.blink>.2) closingFrames++;
    assert.deepEqual(avatarIdleAt(i/60,false),{blink:0,breath:0,yaw:0,nod:0,sway:0});
  }
  assert.ok(closingFrames>0 && closingFrames<180,'eyes should remain open for over 94% of the idle cycle');
  assert.equal(avatarIdleAt(3.6).blink,1);
  assert.equal(avatarIdleAt(3.9).blink,0);
});

test('Facial hair keeps existing ownership IDs across avatars without bypassing locks', () => {
  assert.equal(canUseCosmetic([], 'facialHair', 'stubble', 'noa'), false);
  assert.equal(canUseCosmetic(['facialHair:stubble:leo'], 'facialHair', 'stubble', 'noa'), true);
  assert.equal(canUseCosmetic([], 'hairStyle', 'bun', 'noa'), false);
});
